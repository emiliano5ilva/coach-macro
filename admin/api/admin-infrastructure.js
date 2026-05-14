import { verifyAdminSession } from './admin-verify.js';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const session = await verifyAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const fiveMinutesAgo     = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const monthStr           = new Date().toISOString().slice(0, 7);

    const TABLES = [
      'profiles', 'food_logs', 'workout_logs', 'analytics_events',
      'error_logs', 'referrals', 'waitlist', 'token_usage',
      'rate_limits', 'admin_sessions', 'promo_codes', 'feature_flags',
    ];

    const [
      dbStatsRes,
      rowCountResults,
      errorCountRes,
      errorCountYesterdayRes,
      criticalErrorsRes,
      activeNowRes,
      rateLimitHitsRes,
      tokenRes,
      activeAdminRes,
    ] = await Promise.all([
      sb.rpc('get_db_stats').maybeSingle(),
      Promise.all(
        TABLES.map((t) =>
          sb.from(t).select('*', { count: 'exact', head: true })
            .then(({ count }) => ({ table: t, count: count || 0 }))
        )
      ),
      sb.from('error_logs').select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo),
      sb.from('error_logs').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
        .lt('created_at', twentyFourHoursAgo),
      sb.from('error_logs').select('level, message, request_path, created_at')
        .eq('level', 'error')
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5),
      sb.from('analytics_events').select('user_id', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo),
      sb.from('error_logs').select('*', { count: 'exact', head: true })
        .ilike('message', '%rate%')
        .gte('created_at', twentyFourHoursAgo),
      sb.from('token_usage').select('tokens_used, user_id')
        .eq('month', monthStr),
      sb.from('admin_sessions').select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString()),
    ]);

    const dbStats       = dbStatsRes.data || {};
    const totalTokens   = (tokenRes.data || []).reduce((s, r) => s + (r.tokens_used || 0), 0);
    const aiCost        = (totalTokens / 1_000_000) * (3.0 * 0.7 + 15.0 * 0.3);
    const uniqueAiUsers = new Set((tokenRes.data || []).map((r) => r.user_id)).size;

    const errToday     = errorCountRes.count     || 0;
    const errYesterday = errorCountYesterdayRes.count || 0;
    const errTrend     = errYesterday > 0
      ? (((errToday - errYesterday) / errYesterday) * 100).toFixed(1)
      : null;

    const dayOfMonth  = new Date().getDate();
    const projCost    = dayOfMonth > 0 ? (aiCost / dayOfMonth) * 30 : 0;

    return res.json({
      timestamp: new Date().toISOString(),
      database: {
        activeConnections: dbStats.active_connections ?? null,
        totalConnections:  dbStats.total_connections  ?? null,
        connectionLimit:   60,
        dbSizeMb:          dbStats.db_size_mb         ?? null,
        cacheHitRatio:     dbStats.cache_hit_ratio    ?? null,
        rowCounts:         rowCountResults,
        healthStatus:      'healthy',
      },
      errors: {
        last24Hours:    errToday,
        yesterday:      errYesterday,
        trend:          errTrend,
        criticalErrors: criticalErrorsRes.data || [],
        rateLimitHits:  rateLimitHitsRes.count || 0,
      },
      ai: {
        totalTokensThisMonth:     totalTokens,
        estimatedCostThisMonth:   aiCost.toFixed(4),
        projectedMonthCost:       projCost.toFixed(2),
        costPerActiveUser:        uniqueAiUsers > 0 ? (aiCost / uniqueAiUsers).toFixed(4) : 0,
        activeAiUsers:            uniqueAiUsers,
      },
      realtime: {
        activeUsersNow:      activeNowRes.count   || 0,
        activeAdminSessions: activeAdminRes.count || 0,
      },
    });
  } catch (error) {
    console.error('[admin-infrastructure]', error.message);
    return res.status(500).json({ error: error.message });
  }
}
