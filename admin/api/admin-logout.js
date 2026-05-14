import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;

console.log('All env vars available:', Object.keys(process.env).filter(k => k.includes('SUPA') || k.includes('SERVICE')));

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'URL: ' + !!SUPABASE_URL +
    ' Key: ' + !!SUPABASE_KEY
  );
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies
    .split(';')
    .find((c) => c.trim().startsWith('admin_session='));

  if (sessionCookie) {
    const token = sessionCookie.split('=')[1]?.trim();
    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await sb.from('admin_sessions').delete().eq('token_hash', tokenHash);
    }
  }

  res.setHeader(
    'Set-Cookie',
    'admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  );

  return res.status(200).json({ success: true });
}
