import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from './admin-verify.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'URL: ' + !!SUPABASE_URL +
    ' Key: ' + !!SUPABASE_KEY
  );
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const session = await verifyAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { section, page = '1', search = '' } = req.query;

  try {
    switch (section) {
      case 'overview':   return res.json(await getOverview());
      case 'users':      return res.json(await getUsers(parseInt(page), search));
      case 'revenue':    return res.json(await getRevenue());
      case 'features':   return res.json(await getFeatures());
      case 'referrals':  return res.json(await getReferrals());
      case 'waitlist':   return res.json(await getWaitlist(parseInt(page), search));
      case 'health':     return res.json(await getHealth());
      case 'promo-codes':return res.json(await getPromoCodes());
      case 'churn':      return res.json(await getChurn());
      case 'financial':  return res.json(await getFinancial());
      case 'growth':     return res.json(await getGrowth());
      case 'user-health':return res.json(await getUserHealth());
      case 'forecast':   return res.json(await getForecast());
      case 'support':    return res.json(await getSupport());
      case 'sessions':   return res.json(await getSessions(session));
      default:
        return res.status(400).json({ error: 'Invalid section' });
    }
  } catch (error) {
    console.error('[admin-data]', section, error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}

// ── OVERVIEW ───────────────────────────────────────────────────────────────────

async function getOverview() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo  = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStr      = now.toISOString().slice(0, 7);

  const [
    totalUsersRes,
    proUsersRes,
    active30Res,
    active7Res,
    activeTodayRes,
    tokenUsageRes,
    waitlistRes,
    waitlistConfirmedRes,
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', todayStart),
    sb.from('token_usage').select('tokens_used').eq('month', monthStr),
    sb.from('waitlist').select('*', { count: 'exact', head: true }),
    sb.from('waitlist').select('*', { count: 'exact', head: true }).eq('confirmed', true),
  ]);

  const proCount      = proUsersRes.count || 0;
  const totalTokens   = (tokenUsageRes.data || []).reduce((s, r) => s + (r.tokens_used || 0), 0);
  // Approximate blended cost: $3/M input tokens, $15/M output tokens, assume 70/30 split
  const aiCost        = (totalTokens / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3);
  const mrr           = proCount * 2.99;

  return {
    totalUsers:           totalUsersRes.count  || 0,
    proUsers:             proCount,
    active30:             active30Res.count    || 0,
    active7:              active7Res.count     || 0,
    activeToday:          activeTodayRes.count || 0,
    waitlistTotal:        waitlistRes.count    || 0,
    waitlistConfirmed:    waitlistConfirmedRes.count || 0,
    mrr:                  mrr.toFixed(2),
    arr:                  (mrr * 12).toFixed(2),
    aiCostThisMonth:      aiCost.toFixed(2),
    totalTokensThisMonth: totalTokens,
    netProfitThisMonth:   (mrr - aiCost).toFixed(2),
  };
}

// ── USERS ──────────────────────────────────────────────────────────────────────

async function getUsers(page = 1, search = '') {
  const perPage = 25;
  const offset  = (page - 1) * perPage;

  // List auth users
  const { data: authData } = await sb.auth.admin.listUsers({
    perPage: 500,
    page: 1,
  });
  const authUsers = authData?.users || [];

  // Build id→email map
  const emailMap = {};
  for (const u of authUsers) emailMap[u.id] = u.email;

  let query = sb
    .from('profiles')
    .select('id, is_pro, referral_count, referral_tier, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data: profiles, count } = await query;

  const users = (profiles || []).map((p) => ({
    ...p,
    email: emailMap[p.id] || '—',
  }));

  if (search) {
    const lower = search.toLowerCase();
    return {
      users: users.filter(
        (u) =>
          u.email.toLowerCase().includes(lower) ||
          u.id.toLowerCase().includes(lower)
      ),
      total: count || 0,
      page,
      perPage,
    };
  }

  return { users, total: count || 0, page, perPage };
}

// ── REVENUE ────────────────────────────────────────────────────────────────────

async function getRevenue() {
  const now     = new Date();
  const months  = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const [tokenRows, proCountRes] = await Promise.all([
    sb.from('token_usage').select('month, tokens_used').in('month', months),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
  ]);

  const tokensByMonth = {};
  for (const r of tokenRows.data || []) {
    tokensByMonth[r.month] = (tokensByMonth[r.month] || 0) + (r.tokens_used || 0);
  }

  const proCount = proCountRes.count || 0;
  const mrr      = proCount * 2.99;

  const history = months.map((m) => {
    const tokens  = tokensByMonth[m] || 0;
    const aiCost  = (tokens / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3);
    return {
      month:    m,
      tokens,
      aiCost:   aiCost.toFixed(2),
      // Use current MRR as proxy — replace with stored history if available
      mrr:      m === now.toISOString().slice(0, 7) ? mrr.toFixed(2) : null,
    };
  });

  return {
    currentMrr:  mrr.toFixed(2),
    currentArr:  (mrr * 12).toFixed(2),
    proUsers:    proCount,
    pricePerUser: 2.99,
    history,
  };
}

// ── FEATURES ───────────────────────────────────────────────────────────────────

async function getFeatures() {
  const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [thisWeek, lastWeek] = await Promise.all([
    sb.from('analytics_events').select('event, user_id').gte('created_at', sevenDaysAgo),
    sb.from('analytics_events').select('event, user_id').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
  ]);

  const aggregate = (rows) => {
    const map = {};
    for (const r of rows || []) {
      const key = r.event || 'unknown';
      if (!map[key]) map[key] = { calls: 0, users: new Set() };
      map[key].calls++;
      map[key].users.add(r.user_id);
    }
    return map;
  };

  const thisMap = aggregate(thisWeek.data);
  const lastMap = aggregate(lastWeek.data);

  const features = Object.entries(thisMap)
    .map(([name, { calls, users }]) => {
      const lastCalls = lastMap[name]?.calls || 0;
      const wow = lastCalls > 0 ? (((calls - lastCalls) / lastCalls) * 100).toFixed(1) : null;
      return {
        name,
        callsThisWeek:   calls,
        uniqueUsers:     users.size,
        callsLastWeek:   lastCalls,
        wowChange:       wow,
      };
    })
    .sort((a, b) => b.callsThisWeek - a.callsThisWeek);

  return { features };
}

// ── REFERRALS ──────────────────────────────────────────────────────────────────

async function getReferrals() {
  const [topReferrers, tierCounts] = await Promise.all([
    sb
      .from('profiles')
      .select('id, referral_count, referral_tier')
      .gt('referral_count', 0)
      .order('referral_count', { ascending: false })
      .limit(20),
    sb
      .from('profiles')
      .select('referral_tier', { count: 'exact' })
      .not('referral_tier', 'is', null),
  ]);

  // Get emails for top referrers
  const { data: authData } = await sb.auth.admin.listUsers({ perPage: 500 });
  const emailMap = {};
  for (const u of authData?.users || []) emailMap[u.id] = u.email;

  const referrers = (topReferrers.data || []).map((r) => ({
    ...r,
    email: emailMap[r.id] || '—',
  }));

  // Tier distribution
  const tiers = {};
  for (const r of tierCounts.data || []) {
    const t = r.referral_tier || 'none';
    tiers[t] = (tiers[t] || 0) + 1;
  }

  return { referrers, tiers };
}

// ── WAITLIST ───────────────────────────────────────────────────────────────────

async function getWaitlist(page = 1, search = '') {
  const perPage = 50;
  const offset  = (page - 1) * perPage;

  let query = sb
    .from('waitlist')
    .select('id, email, first_name, confirmed, confirmed_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  const { data, count } = await query.range(offset, offset + perPage - 1);

  // Mask emails for display (keep first 2 chars + domain)
  const masked = (data || []).map((r) => ({
    ...r,
    emailMasked: r.email.replace(/(.{2})([^@]*)(@.*)/, '$1***$3'),
  }));

  return { entries: masked, total: count || 0, page, perPage };
}

// ── HEALTH ─────────────────────────────────────────────────────────────────────

async function getHealth() {
  const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [
    errorsDay,
    errorsHour,
    recentErrors,
    activeSessions,
    expiredSessions,
  ] = await Promise.all([
    sb.from('error_logs').select('*', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
    sb.from('error_logs').select('*', { count: 'exact', head: true }).eq('level', 'error').gte('created_at', oneHourAgo),
    sb.from('error_logs').select('level, message, request_path, created_at').eq('level', 'error').order('created_at', { ascending: false }).limit(10),
    sb.from('admin_sessions').select('*', { count: 'exact', head: true }).gt('expires_at', new Date().toISOString()),
    sb.from('admin_sessions').select('*', { count: 'exact', head: true }).lt('expires_at', new Date().toISOString()),
  ]);

  return {
    status:          errorsHour.count === 0 ? 'healthy' : errorsHour.count < 5 ? 'degraded' : 'incident',
    errorsLast24h:   errorsDay.count   || 0,
    errorsLastHour:  errorsHour.count  || 0,
    recentErrors:    recentErrors.data || [],
    activeSessions:  activeSessions.count   || 0,
    expiredSessions: expiredSessions.count  || 0,
    timestamp:       new Date().toISOString(),
  };
}

// ── PROMO CODES ────────────────────────────────────────────────────────────────

async function getPromoCodes() {
  const { data, error } = await sb
    .from('promo_codes')
    .select('id, code, discount_type, discount_value, max_uses, current_uses, expires_at, notes, active, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { codes: [], error: error.message };
  }

  return { codes: data || [] };
}

// ── CHURN ──────────────────────────────────────────────────────────────────────

async function getChurn() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [totalRes, proRes, activeRes] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    sb.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
  ]);

  // Non-pro users who signed up 90+ days ago but haven't been active in 30 days
  // These are "inactive free users" — effectively churned from the funnel
  const { data: oldProfiles } = await sb
    .from('profiles')
    .select('id, is_pro, created_at')
    .eq('is_pro', false)
    .lt('created_at', ninetyDaysAgo)
    .limit(100);

  // Get recent active user IDs
  const { data: recentEvents } = await sb
    .from('analytics_events')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo);

  const recentActiveIds = new Set((recentEvents || []).map((e) => e.user_id));
  const inactiveUsers   = (oldProfiles || []).filter((p) => !recentActiveIds.has(p.id));

  const { data: authData } = await sb.auth.admin.listUsers({ perPage: 500 });
  const emailMap = {};
  for (const u of authData?.users || []) emailMap[u.id] = u.email;

  const total   = totalRes.count || 0;
  const pro     = proRes.count   || 0;
  const convRate = total > 0 ? ((pro / total) * 100).toFixed(1) : '0.0';

  return {
    totalUsers:      total,
    proUsers:        pro,
    activeUsers30d:  activeRes.count || 0,
    conversionRate:  `${convRate}%`,
    dormantCount:    inactiveUsers.length,
    dormantUsers:    inactiveUsers.slice(0, 50).map((u) => ({
      ...u,
      email: emailMap[u.id] || '—',
    })),
  };
}

// ── FINANCIAL ──────────────────────────────────────────────────────────────────

async function getFinancial() {
  const now      = new Date();
  const monthStr = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const [proRes, totalRes, tokenRes, refRes] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true),
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('token_usage').select('tokens_used').eq('month', monthStr),
    sb.from('profiles').select('referral_count'),
  ]);

  const proCount    = proRes.count   || 0;
  const totalCount  = totalRes.count || 0;
  const mrr         = proCount * 2.99;
  const arpu        = proCount > 0 ? mrr / proCount : 0;
  const totalTokens = (tokenRes.data || []).reduce((s, r) => s + (r.tokens_used || 0), 0);
  const aiCost      = (totalTokens / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3);
  const totalRefs   = (refRes.data || []).reduce((s, r) => s + (r.referral_count || 0), 0);

  // LTV assumes 12-month avg retention (update as you get real churn data)
  const ltv               = arpu * 12;
  const viralCoefficient  = totalCount > 0 ? totalRefs / totalCount : 0;

  // Monthly cost breakdown
  const netRevenue = mrr - aiCost;
  const margin     = mrr > 0 ? ((netRevenue / mrr) * 100) : 0;

  return {
    mrr:              mrr.toFixed(2),
    arr:              (mrr * 12).toFixed(2),
    arpu:             arpu.toFixed(2),
    ltv:              ltv.toFixed(2),
    ltvAssumedMonths: 12,
    aiCostThisMonth:  aiCost.toFixed(4),
    netRevenue:       netRevenue.toFixed(2),
    marginPct:        margin.toFixed(1),
    viralCoefficient: viralCoefficient.toFixed(2),
    totalReferrals:   totalRefs,
    proUsers:         proCount,
    totalUsers:       totalCount,
    // CAC is manual — no marketing spend tracked in DB
  };
}

// ── GROWTH ─────────────────────────────────────────────────────────────────────

async function getGrowth() {
  const now          = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Weekly new signups (last 8 weeks)
  const weeklyPromises = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString();
    const end   = new Date(now - i * 7 * 24 * 60 * 60 * 1000).toISOString();
    const label = new Date(now - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    weeklyPromises.push(
      sb.from('profiles').select('*', { count: 'exact', head: true })
        .gte('created_at', start).lt('created_at', end)
        .then(({ count }) => ({ week: label, newUsers: count || 0 }))
    );
  }

  const [weeklyGrowth, featureEvents, totalRes, refRes] = await Promise.all([
    Promise.all(weeklyPromises),
    sb.from('analytics_events').select('event, user_id').gte('created_at', thirtyDaysAgo),
    sb.from('profiles').select('*', { count: 'exact', head: true }),
    sb.from('profiles').select('referral_count'),
  ]);

  const totalUsers  = totalRes.count || 0;
  const totalRefs   = (refRes.data || []).reduce((s, r) => s + (r.referral_count || 0), 0);
  const viralCoeff  = totalUsers > 0 ? (totalRefs / totalUsers).toFixed(2) : 0;

  // Feature adoption
  const byFeature = {};
  for (const e of featureEvents.data || []) {
    if (!byFeature[e.event]) byFeature[e.event] = new Set();
    byFeature[e.event].add(e.user_id);
  }
  const featureAdoption = Object.entries(byFeature)
    .map(([event, users]) => ({
      event,
      activeUsers:   users.size,
      adoptionPct:   totalUsers > 0 ? ((users.size / totalUsers) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, 12);

  // Week-over-week growth rate (last 2 weeks)
  const weeks = weeklyGrowth.slice(-2);
  const wowRate = weeks[0].newUsers > 0
    ? (((weeks[1].newUsers - weeks[0].newUsers) / weeks[0].newUsers) * 100).toFixed(1)
    : null;

  return { weeklyGrowth, featureAdoption, viralCoefficient: viralCoeff, wowGrowthRate: wowRate, totalUsers };
}

// ── USER HEALTH ────────────────────────────────────────────────────────────────

async function getUserHealth() {
  const now          = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [profilesRes, recentEventsRes] = await Promise.all([
    sb.from('profiles').select('id, is_pro, created_at').order('created_at', { ascending: false }).limit(300),
    sb.from('analytics_events').select('user_id, event, created_at').gte('created_at', sevenDaysAgo),
  ]);

  const profiles = profilesRes.data || [];

  // Build per-user activity map
  const activity = {};
  for (const e of recentEventsRes.data || []) {
    if (!activity[e.user_id]) activity[e.user_id] = { events: 0, uniqueEvents: new Set(), lastSeen: null };
    activity[e.user_id].events++;
    activity[e.user_id].uniqueEvents.add(e.event);
    if (!activity[e.user_id].lastSeen || e.created_at > activity[e.user_id].lastSeen) {
      activity[e.user_id].lastSeen = e.created_at;
    }
  }

  const today = now.toISOString().slice(0, 10);
  const dist  = Array(10).fill(0); // index 0 = score 1
  const atRisk = [];

  for (const p of profiles) {
    const a = activity[p.id] || { events: 0, uniqueEvents: new Set(), lastSeen: null };
    let score = 0;
    if (p.is_pro)                score += 3;
    if (a.events > 0)            score += 2;
    if (a.events > 5)            score += 1;
    if (a.uniqueEvents.size > 3) score += 2;
    if (a.lastSeen?.slice(0, 10) === today) score += 2;
    score = Math.max(1, Math.min(10, score));
    dist[score - 1]++;
    if (score <= 3) atRisk.push({ id: p.id, score, is_pro: p.is_pro, created_at: p.created_at, lastSeen: a.lastSeen });
  }

  // Get emails for at-risk users
  const { data: authData } = await sb.auth.admin.listUsers({ perPage: 500 });
  const emailMap = {};
  for (const u of authData?.users || []) emailMap[u.id] = u.email;

  return {
    distribution: dist.map((count, i) => ({ score: i + 1, count })),
    atRiskCount:  atRisk.length,
    atRiskUsers:  atRisk.slice(0, 30).map((u) => ({ ...u, email: emailMap[u.id] || '—' })),
    totalScored:  profiles.length,
    avgScore:     profiles.length > 0
      ? (dist.reduce((s, c, i) => s + c * (i + 1), 0) / profiles.length).toFixed(1)
      : 0,
  };
}

// ── FORECAST ───────────────────────────────────────────────────────────────────

async function getForecast() {
  const now = new Date();

  // New signups per month for last 6 months
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString();
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).toISOString();
    const label = start.slice(0, 7);
    const [{ count: newUsers }, { count: newPro }] = await Promise.all([
      sb.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', start).lt('created_at', end),
      sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true).gte('created_at', start).lt('created_at', end),
    ]);
    monthlyData.push({ month: label, newUsers: newUsers || 0, newPro: newPro || 0 });
  }

  const { count: totalPro } = await sb.from('profiles').select('*', { count: 'exact', head: true }).eq('is_pro', true);
  const currentMrr = (totalPro || 0) * 2.99;

  // Simple linear growth: avg new pro users per month over last 3 months
  const last3 = monthlyData.slice(-3);
  const avgNewPro = last3.reduce((s, m) => s + m.newPro, 0) / 3;

  // Project next 6 months
  const forecast = [];
  let projectedPro = totalPro || 0;
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    projectedPro += avgNewPro;
    forecast.push({
      month: d.toISOString().slice(0, 7),
      projectedPro: Math.round(projectedPro),
      projectedMrr: (projectedPro * 2.99).toFixed(2),
    });
  }

  return { history: monthlyData, forecast, currentMrr: currentMrr.toFixed(2), currentProUsers: totalPro || 0, avgNewProPerMonth: avgNewPro.toFixed(1) };
}

// ── SUPPORT ────────────────────────────────────────────────────────────────────

async function getSupport() {
  const oneDayAgo  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [todayRes, weekRes, recentRes, categoryRes] = await Promise.all([
    sb.from('support_tickets').select('*', { count: 'exact', head: true }).gte('created_at', oneDayAgo),
    sb.from('support_tickets').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    sb.from('support_tickets').select('id, name, email, category, subject, status, created_at').order('created_at', { ascending: false }).limit(20),
    sb.from('support_tickets').select('category').gte('created_at', sevenDaysAgo),
  ]).catch(() => [
    { count: 0 }, { count: 0 }, { data: [] }, { data: [] },
  ]);

  const catCounts = {};
  for (const r of (categoryRes?.data || [])) {
    const c = r.category || 'general';
    catCounts[c] = (catCounts[c] || 0) + 1;
  }

  return {
    today:       todayRes?.count   || 0,
    thisWeek:    weekRes?.count    || 0,
    recent:      recentRes?.data   || [],
    categories:  catCounts,
  };
}

// ── SESSIONS ──────────────────────────────────────────────────────────────────

async function getSessions(currentSession) {
  const { data: sessions } = await sb
    .from('admin_sessions')
    .select('id, token_hash, ip_address, created_at, expires_at')
    .eq('admin_id', currentSession.admin_id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return {
    current: {
      id:         currentSession.id,
      ip:         currentSession.ip_address,
      startedAt:  currentSession.created_at,
      expiresAt:  currentSession.expires_at,
    },
    all: (sessions || []).map((s) => ({
      id:         s.id,
      ip:         s.ip_address,
      startedAt:  s.created_at,
      expiresAt:  s.expires_at,
      isCurrent:  s.id === currentSession.id,
    })),
  };
}
