import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://oxxihlwqukbakmnnavuy.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const LIMITS = {
  '/api/claude':      { free: 5,   pro: 50,  window: 3600 },
  '/api/food-search': { free: 30,  pro: 200, window: 3600 },
  '/api/r':           { free: 10,  pro: 10,  window: 3600 },
  '/api/waitlist':    { free: 3,   pro: 3,   window: 3600 },
  '/api/support':     { free: 5,   pro: 10,  window: 3600 },
  default:            { free: 60,  pro: 300, window: 3600 },
};

export const checkRateLimit = async (req, endpoint) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.connection?.remoteAddress
    || 'unknown';

  const userId  = req.headers['x-user-id'] || null;
  const isPro   = req.headers['x-is-pro'] === 'true';
  const config  = LIMITS[endpoint] || LIMITS.default;
  const limit   = isPro ? config.pro : config.free;
  const windowStart = Math.floor(Date.now() / (config.window * 1000));
  const cacheKey    = `rate_${endpoint}_${userId || ip}_${windowStart}`;

  try {
    const { data } = await sb
      .from('rate_limits')
      .select('count')
      .eq('key', cacheKey)
      .maybeSingle();

    if (data && data.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: config.window - (Date.now() / 1000 % config.window),
        limit,
      };
    }

    await sb.from('rate_limits').upsert({
      key: cacheKey,
      count: (data?.count || 0) + 1,
      window_start: windowStart,
      expires_at: new Date((windowStart + 1) * config.window * 1000).toISOString(),
    }, { onConflict: 'key' });

    return {
      allowed: true,
      remaining: limit - (data?.count || 0) - 1,
      limit,
    };
  } catch {
    // If rate limit DB is unavailable, allow the request
    return { allowed: true, remaining: -1, limit };
  }
};
