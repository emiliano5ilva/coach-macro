import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://oxxihlwqukbakmnnavuy.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

export const log = async (level, message, context = {}) => {
  try {
    await sb.from('error_logs').insert({
      level,
      message,
      context:      context.path || context.context || null,
      stack:        context.stack || null,
      user_id:      context.userId || null,
      request_path: context.path || null,
    });
  } catch {}
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${level.toUpperCase()}]`, message, context);
};

// Wraps any Vercel handler — catches unhandled throws and logs slow requests.
// Threshold is 10 s to avoid false positives from SSE streaming responses.
export const withLogging = (handler) => async (req, res) => {
  const start = Date.now();
  try {
    await handler(req, res);
    const duration = Date.now() - start;
    if (duration > 10000) {
      await log('warn', 'Slow request', { path: req.url, duration });
    }
  } catch (error) {
    // userId may come from JWT Bearer token (AI routes) or x-user-id (legacy)
    const bearerToken = req.headers['authorization']?.replace('Bearer ', '');
    const legacyUserId = req.headers['x-user-id'] || null;
    await log('error', error.message, {
      path:   req.url,
      stack:  error.stack,
      userId: legacyUserId || (bearerToken ? '[jwt]' : null),
    });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
