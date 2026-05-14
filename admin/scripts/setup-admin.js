/**
 * One-time TOTP setup script.
 * Generates a TOTP secret, stores it, prints QR code URL + backup codes.
 * Run once, scan QR with Google Authenticator, then sign in.
 */
import { createHash, randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticator } from 'otplib';

// Load env from root .env and admin/.env.local (if present)
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
  } catch { /* file not found — skip */ }
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oxxihlwqukbakmnnavuy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@coach-macro.com';

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not set');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const hashToken = (t) => createHash('sha256').update(t).digest('hex');

function generateBackupCodes(n = 8) {
  return Array.from({ length: n }, () =>
    randomBytes(4).toString('hex').toUpperCase()
  );
}

// Check existing admin row
const { data: existing } = await sb
  .from('admin_users')
  .select('id, totp_enabled')
  .maybeSingle();

if (existing?.totp_enabled) {
  console.log('');
  console.log('TOTP is already enabled for this admin account.');
  console.log('If you need to reset it, delete the admin row and re-run this script.');
  process.exit(0);
}

// Generate secret + backup codes
const secret = authenticator.generateSecret();
const rawCodes = generateBackupCodes(8);
const hashedCodes = rawCodes.map((c) => hashToken(c));
const otpauth = authenticator.keyuri(ADMIN_EMAIL, 'CoachMacro Admin', secret);
const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauth)}`;

// Upsert admin row
let upsertError;
if (existing) {
  const { error } = await sb
    .from('admin_users')
    .update({ totp_secret: secret, totp_enabled: true, backup_codes: hashedCodes })
    .eq('id', existing.id);
  upsertError = error;
} else {
  const { error } = await sb
    .from('admin_users')
    .insert({ email: ADMIN_EMAIL, password_hash: '', totp_secret: secret, totp_enabled: true, backup_codes: hashedCodes });
  upsertError = error;
}

if (upsertError) {
  console.error('DB error:', upsertError.message);
  process.exit(1);
}

// ── Output ────────────────────────────────────────────────────────────────────
const line = '─'.repeat(60);
console.log('');
console.log(line);
console.log('  COACH MACRO ADMIN — TOTP SETUP');
console.log(line);
console.log('');
console.log(`  Admin email : ${ADMIN_EMAIL}`);
console.log('');
console.log('  1. SCAN THIS QR CODE with Google Authenticator:');
console.log('');
console.log(`     ${qrUrl}`);
console.log('');
console.log('     (Open the URL above in a browser to see the QR code)');
console.log('');
console.log('  2. MANUAL ENTRY KEY (if QR scan fails):');
console.log('');
console.log(`     ${secret}`);
console.log('');
console.log('  3. BACKUP CODES (save these securely — shown once):');
console.log('');
rawCodes.forEach((c, i) => {
  const col = i % 2 === 0 ? '     ' : '          ';
  process.stdout.write(`${col}${c}`);
  if (i % 2 === 1 || i === rawCodes.length - 1) process.stdout.write('\n');
});
console.log('');
console.log(line);
console.log('  Scan the QR code, then sign in at:');
console.log('  https://admin.coach-macro.com');
console.log(line);
console.log('');
