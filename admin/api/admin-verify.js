import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

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

const hashToken = (token) =>
  createHash('sha256').update(token).digest('hex');

export const verifyAdminSession = async (req) => {
  const cookies = req.headers.cookie || '';
  const sessionCookie = cookies
    .split(';')
    .find((c) => c.trim().startsWith('admin_session='));

  if (!sessionCookie) return null;

  const token = sessionCookie.split('=')[1]?.trim();
  if (!token) return null;

  const tokenHash = hashToken(token);

  const { data: session } = await sb
    .from('admin_sessions')
    .select('*, admin_users(*)')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  return session;
};

// Standalone endpoint for the frontend to check auth state
export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const session = await verifyAdminSession(req);

  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    email: session.admin_users?.email,
  });
}
