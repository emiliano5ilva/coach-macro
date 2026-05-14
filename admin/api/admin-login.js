import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { authenticator } from 'otplib';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY;

console.log('Supabase URL found:', !!SUPABASE_URL);
console.log('Supabase Key found:', !!SUPABASE_KEY);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'URL: ' + !!SUPABASE_URL +
    ' Key: ' + !!SUPABASE_KEY
  );
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  try {
    console.log('Login attempt started');
    console.log('ENV check:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey:  !!SUPABASE_KEY,
    });

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';
    console.log('IP:', ip);

    console.log('Checking rate limit…');
    const limit = await checkIpLimit(ip);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many attempts. Try again in ${Math.ceil(limit.resetIn / 60)} minute(s).`,
      });
    }

    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Code required' });
    console.log('Code length:', code.trim().length);

    console.log('Fetching admin row…');
    const { data: admin, error: adminErr } = await sb
      .from('admin_users')
      .select('id, email, totp_secret, totp_enabled, backup_codes')
      .eq('totp_enabled', true)
      .maybeSingle();

    if (adminErr) console.error('admin_users query error:', adminErr.message);
    console.log('Admin found:', !!admin, '| totp_enabled:', admin?.totp_enabled, '| has_secret:', !!admin?.totp_secret);

    if (!admin?.totp_secret) {
      return res.status(403).json({ error: 'TOTP not configured. Complete setup first.' });
    }

    const trimmed = code.trim();
    let valid = false;

    if (trimmed.length === 6 && /^\d{6}$/.test(trimmed)) {
      console.log('Verifying TOTP code…');
      valid = authenticator.verify({ token: trimmed, secret: admin.totp_secret });
      console.log('TOTP valid:', valid);
    } else if (trimmed.length === 8) {
      console.log('Verifying backup code…');
      const codeHash = hashToken(trimmed.toUpperCase());
      const codes = Array.isArray(admin.backup_codes) ? admin.backup_codes : [];
      if (codes.includes(codeHash)) {
        const remaining = codes.filter((c) => c !== codeHash);
        await sb.from('admin_users').update({ backup_codes: remaining }).eq('id', admin.id);
        valid = true;
      }
      console.log('Backup code valid:', valid);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Invalid code. Try again.' });
    }

    await sb.from('rate_limits').delete().eq('key', RATE_KEY(ip));

    await sb
      .from('admin_users')
      .update({ last_login: new Date().toISOString(), login_attempts: 0, locked_until: null })
      .eq('id', admin.id);

    console.log('Creating session…');
    const token     = randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

    const { error: sessionErr } = await sb.from('admin_sessions').insert({
      admin_id:   admin.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      ip_address: ip,
    });

    if (sessionErr) console.error('Session insert error:', sessionErr.message);

    res.setHeader(
      'Set-Cookie',
      `admin_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${8 * 60 * 60}`
    );

    console.log('Login success');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Admin login error:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({ error: 'Server error', detail: error.message });
  }
}
