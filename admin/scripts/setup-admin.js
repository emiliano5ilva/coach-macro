import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ADMIN_EMAIL       = process.env.ADMIN_EMAIL   || 'admin@coach-macro.com';
const ADMIN_PASSWORD    = process.env.ADMIN_PASSWORD;
const ADMIN_SALT        = process.env.ADMIN_SALT;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (!ADMIN_PASSWORD || !ADMIN_SALT) {
  console.error('Missing ADMIN_PASSWORD or ADMIN_SALT env vars');
  console.error('Generate a salt with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const passwordHash = createHash('sha256')
  .update(ADMIN_PASSWORD + ADMIN_SALT)
  .digest('hex');

const { data: existing } = await sb
  .from('admin_users')
  .select('id')
  .eq('email', ADMIN_EMAIL)
  .maybeSingle();

if (existing) {
  // Update password if account exists
  const { error } = await sb
    .from('admin_users')
    .update({ password_hash: passwordHash, login_attempts: 0, locked_until: null })
    .eq('email', ADMIN_EMAIL);

  if (error) { console.error('Update failed:', error.message); process.exit(1); }
  console.log(`Updated admin account: ${ADMIN_EMAIL}`);
} else {
  const { error } = await sb
    .from('admin_users')
    .insert({ email: ADMIN_EMAIL, password_hash: passwordHash });

  if (error) { console.error('Insert failed:', error.message); process.exit(1); }
  console.log(`Created admin account: ${ADMIN_EMAIL}`);
}

console.log('Done. You can now log in at admin.coach-macro.com');
