import { createHash, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';

// Load env files (root .env, root .env.local, admin/.env.local)
const __dir = dirname(fileURLToPath(import.meta.url));
for (const p of [
  resolve(__dir, '../../.env'),
  resolve(__dir, '../../.env.local'),
  resolve(__dir, '../.env.local'),
]) {
  try {
    readFileSync(p, 'utf8').split('\n').forEach((line) => {
      const [k, ...v] = line.split('=');
      if (k && !k.startsWith('#') && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    });
  } catch { /* not found — skip */ }
}

const SUPABASE_URL      = process.env.SUPABASE_URL || 'https://oxxihlwqukbakmnnavuy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL       = process.env.ADMIN_EMAIL || 'admin@coach-macro.com';

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const hashToken = (t) => createHash('sha256').update(t).digest('hex');
const generateBackupCodes = (n = 8) =>
  Array.from({ length: n }, () => randomBytes(4).toString('hex').toUpperCase());

// Generate fresh secret + backup codes
const secret      = authenticator.generateSecret();
const rawCodes    = generateBackupCodes(8);
const hashedCodes = rawCodes.map((c) => hashToken(c));
const otpauth     = authenticator.keyuri(ADMIN_EMAIL, 'Coach Macro Admin', secret);

// Save to database
const { error } = await sb.from('admin_users').upsert(
  { email: ADMIN_EMAIL, password_hash: 'not_used', totp_secret: secret, totp_enabled: true, backup_codes: hashedCodes },
  { onConflict: 'email' }
);

if (error) {
  // email column may not have unique constraint — try update instead
  const { data: existing } = await sb.from('admin_users').select('id').maybeSingle();
  if (existing) {
    const { error: e2 } = await sb.from('admin_users')
      .update({ totp_secret: secret, totp_enabled: true, backup_codes: hashedCodes })
      .eq('id', existing.id);
    if (e2) { console.error('DB error:', e2.message); process.exit(1); }
  } else {
    console.error('DB error:', error.message);
    process.exit(1);
  }
}

// Print ASCII QR code to terminal
const qr = await QRCode.toString(otpauth, { type: 'terminal', small: true });

const line = '─'.repeat(58);
console.log('');
console.log(line);
console.log('  COACH MACRO ADMIN — TOTP SETUP');
console.log(line);
console.log('');
console.log('SCAN THIS QR CODE:');
console.log('');
console.log(qr);
console.log('Manual entry secret:', secret);
console.log('');
console.log('BACKUP CODES (save these — shown once):');
console.log('');
rawCodes.forEach((c, i) => {
  process.stdout.write(`  ${c}`);
  if (i % 2 === 1 || i === rawCodes.length - 1) process.stdout.write('\n');
  else process.stdout.write('    ');
});
console.log('');
console.log(line);
console.log('  Scan QR → open https://admin.coach-macro.com → sign in');
console.log(line);
console.log('');
