import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const hashPassword = (password) =>
  createHash('sha256')
    .update(password + process.env.ADMIN_SALT)
    .digest('hex');

const hashToken = (token) =>
  createHash('sha256').update(token).digest('hex');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const { email, password } = req.body || {};
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const { data: admin } = await sb
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  // Account locked check
  if (admin?.locked_until && new Date(admin.locked_until) > new Date()) {
    const minutesLeft = Math.ceil(
      (new Date(admin.locked_until) - new Date()) / 60000
    );
    return res.status(429).json({
      error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
    });
  }

  const passwordHash = hashPassword(password);
  const validPassword = admin?.password_hash === passwordHash;

  if (!admin || !validPassword) {
    if (admin) {
      const attempts = (admin.login_attempts || 0) + 1;
      const locked = attempts >= 5;
      await sb
        .from('admin_users')
        .update({
          login_attempts: attempts,
          locked_until: locked
            ? new Date(Date.now() + 15 * 60000).toISOString()
            : null,
        })
        .eq('id', admin.id);
    }
    // Same error regardless — prevent user enumeration
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Reset failed attempts on success
  await sb
    .from('admin_users')
    .update({
      login_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString(),
    })
    .eq('id', admin.id);

  // Generate session token
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();

  await sb.from('admin_sessions').insert({
    admin_id: admin.id,
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
