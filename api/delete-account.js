import { createClient } from '@supabase/supabase-js';
import { withLogging } from './middleware/logger.js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default withLogging(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  // Delete all user data in parallel, then delete auth record
  await Promise.allSettled([
    supabaseAdmin.from('food_logs').delete().eq('user_id', user.id),
    supabaseAdmin.from('workout_logs').delete().eq('user_id', user.id),
    supabaseAdmin.from('water_logs').delete().eq('user_id', user.id),
    supabaseAdmin.from('analytics_events').delete().eq('user_id', user.id),
    supabaseAdmin.from('token_usage').delete().eq('user_id', user.id),
    supabaseAdmin.from('rate_limits').delete().like('key', `%_${user.id}_%`),
  ]);
  await supabaseAdmin.from('profiles').delete().eq('id', user.id);

  // Delete auth record last — only return success after confirmed
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message);
    return res.status(500).json({ error: 'Failed to delete account' });
  }

  return res.status(200).json({ success: true });
});
