import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from './admin-verify.js';
import {
  syncRevenueToSheets,
  syncUsersToSheets,
  syncFeaturesToSheets,
  syncAICostsToSheets,
  syncPromodCodesToSheets,
} from '../src/services/googleSheets.js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await verifyAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { sheet } = req.body || {};

  try {
    switch (sheet) {
      case 'revenue':    await exportRevenue(); break;
      case 'users':      await exportUsers(); break;
      case 'features':   await exportFeatures(); break;
      case 'ai-costs':   await exportAICosts(); break;
      case 'promo-codes':await exportPromoCodes(); break;
      case 'all':
        await Promise.all([
          exportRevenue(),
          exportUsers(),
          exportFeatures(),
          exportAICosts(),
          exportPromoCodes(),
        ]);
        break;
      default:
        return res.status(400).json({ error: 'Unknown sheet' });
    }

    return res.json({ success: true, sheet });
  } catch (error) {
    console.error('[admin-export-sheets]', error.message);
    return res.status(500).json({ error: error.message });
  }
}

async function exportRevenue() {
  const now    = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const [tokenRows, proRes] = await Promise.all([
    sb.from('token_usage').select('month, tokens_used').in('month', months),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
  ]);

  const byMonth = {};
  for (const r of tokenRows.data || []) {
    byMonth[r.month] = (byMonth[r.month] || 0) + (r.tokens_used || 0);
  }

  const mrr = (proRes.count || 0) * 2.99;
  const rows = months.map((m) => {
    const tokens  = byMonth[m] || 0;
    const aiCost  = (tokens / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3);
    const mrrVal  = m === now.toISOString().slice(0, 7) ? mrr : 0;
    const profit  = mrrVal - aiCost;
    const margin  = mrrVal > 0 ? ((profit / mrrVal) * 100).toFixed(1) : 0;
    return { date: m, mrr: mrrVal.toFixed(2), aiCosts: aiCost.toFixed(2), netProfit: profit.toFixed(2), margin };
  });

  await syncRevenueToSheets(rows);
}

async function exportUsers() {
  const now          = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [total, pro, trial, a30, a7, aToday] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    sb.from('profiles').select('*', { count: 'exact', head: true }).gt('free_trial_expires', now.toISOString()),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', todayStart),
  ]);

  await syncUsersToSheets([{
    date:       now.toISOString().slice(0, 10),
    totalUsers: total.count  || 0,
    active30:   a30.count    || 0,
    active7:    a7.count     || 0,
    activeToday:aToday.count || 0,
    proUsers:   pro.count    || 0,
    trialUsers: trial.count  || 0,
  }]);
}

async function exportFeatures() {
  const sevenDaysAgo   = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [thisWeek, lastWeek] = await Promise.all([
    sb.from('analytics_events').select('event, user_id').gte('created_at', sevenDaysAgo),
    sb.from('analytics_events').select('event, user_id').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
  ]);

  const agg = (rows) => {
    const m = {};
    for (const r of rows || []) {
      const k = r.event || 'unknown';
      if (!m[k]) m[k] = { calls: 0, users: new Set() };
      m[k].calls++;
      m[k].users.add(r.user_id);
    }
    return m;
  };

  const thisMap = agg(thisWeek.data);
  const lastMap = agg(lastWeek.data);

  const features = Object.entries(thisMap).map(([name, { calls, users }]) => {
    const lc = lastMap[name]?.calls || 0;
    return { name, callsThisWeek: calls, uniqueUsers: users.size, callsLastWeek: lc,
             wowChange: lc > 0 ? (((calls - lc) / lc) * 100).toFixed(1) : 0 };
  });

  await syncFeaturesToSheets(features);
}

async function exportAICosts() {
  const now     = new Date();
  const months  = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  const { data } = await sb.from('token_usage').select('month, tokens_used').in('month', months);
  const rows = (data || []).map((r) => ({
    date:       r.month,
    tokensUsed: r.tokens_used,
    cost:       ((r.tokens_used / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3)).toFixed(4),
  }));
  await syncAICostsToSheets(rows);
}

async function exportPromoCodes() {
  const { data } = await sb.from('promo_codes').select('*').order('created_at', { ascending: false });
  await syncPromodCodesToSheets(data || []);
}
