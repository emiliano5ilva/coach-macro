import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { authenticator } from 'otplib';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const hashToken = (t) => createHash('sha256').update(t).digest('hex');

const RATE_KEY   = (ip) => `admin_login:${ip}`;
const MAX_TRIES  = 5;
const WINDOW_SEC = 15 * 60;

async function checkIpLimit(ip) {
  const key = RATE_KEY(ip);
  const { data } = await sb
    .from('rate_limits')
    .select('count, reset_at')
    .eq('key', key)
    .maybeSingle();

  const now = new Date();
  if (data && new Date(data.reset_at) > now) {
    if (data.count >= MAX_TRIES) {
      return { allowed: false, resetIn: Math.ceil((new Date(data.reset_at) - now) / 1000) };
    }
    await sb.from('rate_limits').update({ count: data.count + 1 }).eq('key', key);
  } else {
    const reset_at = new Date(Date.now() + WINDOW_SEC * 1000).toISOString();
    await sb.from('rate_limits').upsert({ key, count: 1, reset_at }, { onConflict: 'key' });
  }
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  const limit = await checkIpLimit(ip);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Too many attempts. Try again in ${Math.ceil(limit.resetIn / 60)} minute(s).`,
    });
  }

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Code required' });

  const { data: admin } = await sb
    .from('admin_users')
    .select('id, email, totp_secret, totp_enabled, backup_codes')
    .eq('totp_enabled', true)
    .maybeSingle();

  if (!admin?.totp_secret) {
    return res.status(403).json({ error: 'TOTP not configured. Complete setup first.' });
  }

  const trimmed = code.trim();
  let valid = false;

  if (trimmed.length === 6 && /^\d{6}$/.test(trimmed)) {
    // Standard TOTP — accept current window ±1 step for clock skew
    valid = authenticator.verify({ token: trimmed, secret: admin.totp_secret });
  } else if (trimmed.length === 8) {
    // Backup code — compare against stored hashes
    const codeHash = hashToken(trimmed.toUpperCase());
    const codes = Array.isArray(admin.backup_codes) ? admin.backup_codes : [];
    if (codes.includes(codeHash)) {
      // Consume the backup code (remove it)
      const remaining = codes.filter((c) => c !== codeHash);
      await sb.from('admin_users').update({ backup_codes: remaining }).eq('id', admin.id);
      valid = true;
    }
  }

  if (!valid) {
    return res.status(401).json({ error: 'Invalid code. Try again.' });
  }

  // Reset IP rate limit on success
  await sb.from('rate_limits').delete().eq('key', RATE_KEY(ip));

  await sb
    .from('admin_users')
    .update({ last_login: new Date().toISOString(), login_attempts: 0, locked_until: null })
    .eq('id', admin.id);

  const token    = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  await sb.from('admin_sessions').insert({
    admin_id:   admin.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    ip_address: ip,
  });

  res.setHeader(
    'Set-Cookie',
    `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`
  );

  return res.status(200).json({ success: true });
}
