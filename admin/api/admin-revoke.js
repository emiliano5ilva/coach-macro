import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { verifyAdminSession } from './admin-verify.js';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const hashToken = (t) => createHash('sha256').update(t).digest('hex');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await verifyAdminSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const cookie = req.headers.cookie || '';
  const raw    = cookie.split(';').find((c) => c.trim().startsWith('admin_session='));
  const token  = raw?.split('=')[1]?.trim();
  const currentHash = token ? hashToken(token) : null;

  if (!currentHash) return res.status(400).json({ error: 'No active session' });

  // Delete all sessions for this admin except the current one
  await sb
    .from('admin_sessions')
    .delete()
    .eq('admin_id', session.admin_id)
    .neq('token_hash', currentHash);

  return res.status(200).json({ success: true });
}
