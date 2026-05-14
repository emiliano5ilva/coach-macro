import { createClient } from '@supabase/supabase-js';
import { runDailySync } from '../src/services/googleSheets.js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Vercel cron sends requests with authorization header
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now          = new Date();
    const monthStr     = now.toISOString().slice(0, 7);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [
      totalRes, proRes,
      active30Res, active7Res, activeTodayRes,
      tokenRes,
      featuresThisWeek,
    ] = await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }),
      sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
      sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', todayStart),
      sb.from('token_usage').select('tokens_used').eq('month', monthStr),
      sb.from('analytics_events').select('event, user_id').gte('created_at', sevenDaysAgo),
    ]);

    const proCount    = proRes.count || 0;
    const totalTokens = (tokenRes.data || []).reduce((s, r) => s + (r.tokens_used || 0), 0);
    const aiCost      = (totalTokens / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3);
    const mrr         = proCount * 2.99;

    const overviewData = {
      totalUsers:           totalRes.count  || 0,
      proUsers:             proCount,
      active30:             active30Res.count || 0,
      active7:              active7Res.count  || 0,
      activeToday:          activeTodayRes.count || 0,
      mrr:                  mrr.toFixed(2),
      aiCostThisMonth:      aiCost.toFixed(2),
      netProfitThisMonth:   (mrr - aiCost).toFixed(2),
    };

    // Aggregate feature events
    const featureMap = {};
    for (const r of featuresThisWeek.data || []) {
      const k = r.event || 'unknown';
      if (!featureMap[k]) featureMap[k] = { calls: 0, users: new Set() };
      featureMap[k].calls++;
      featureMap[k].users.add(r.user_id);
    }
    const featuresData = {
      features: Object.entries(featureMap).map(([name, { calls, users }]) => ({
        name, callsThisWeek: calls, uniqueUsers: users.size,
      })),
    };

    await runDailySync(overviewData, featuresData);

    // Clean up expired admin sessions
    await sb.from('admin_sessions').delete().lt('expires_at', now.toISOString());

    return res.json({ success: true, synced: now.toISOString() });
  } catch (error) {
    console.error('[admin-daily-sync]', error.message);
    return res.status(500).json({ error: error.message });
  }
}
