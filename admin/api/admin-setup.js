import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'crypto';
import { authenticator } from 'otplib';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const hashToken = (t) => createHash('sha256').update(t).digest('hex');

function generateBackupCodes(n = 8) {
  return Array.from({ length: n }, () =>
    randomBytes(4).toString('hex').toUpperCase()
  );
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const { data: admin } = await sb
    .from('admin_users')
    .select('id, email, totp_secret, totp_enabled')
    .maybeSingle();

  if (!admin) {
    return res.status(404).json({ error: 'No admin account found. Run the setup script.' });
  }

  // GET — return setup state / QR code URL
  if (req.method === 'GET') {
    if (admin.totp_enabled) {
      return res.status(403).json({ error: 'TOTP already configured.' });
    }

    // Generate (or reuse) a pending secret
    let secret = admin.totp_secret;
    if (!secret) {
      secret = authenticator.generateSecret();
      await sb.from('admin_users').update({ totp_secret: secret }).eq('id', admin.id);
    }

    const otpauth = authenticator.keyuri(admin.email, 'CoachMacro Admin', secret);
    return res.status(200).json({
      needsSetup: true,
      secret,
      otpauth,
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`,
    });
  }

  // POST — verify code and enable TOTP
  if (req.method === 'POST') {
    if (admin.totp_enabled) {
      return res.status(403).json({ error: 'TOTP already configured.' });
    }

    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Code required' });

    const valid = authenticator.verify({ token: code.trim(), secret: admin.totp_secret });
    if (!valid) {
      return res.status(401).json({ error: 'Invalid code. Make sure your authenticator is synced.' });
    }

    const rawCodes   = generateBackupCodes(8);
    const hashedCodes = rawCodes.map((c) => hashToken(c));

    await sb.from('admin_users').update({
      totp_enabled:  true,
      backup_codes:  hashedCodes,
    }).eq('id', admin.id);

    return res.status(200).json({ success: true, backupCodes: rawCodes });
  }

  return res.status(405).end();
}
