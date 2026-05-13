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

  // Delete all user data first (cascade handled by RLS, but be explicit)
  await supabaseAdmin.from('food_logs').delete().eq('user_id', user.id);
  await supabaseAdmin.from('workout_logs').delete().eq('user_id', user.id);
  await supabaseAdmin.from('water_logs').delete().eq('user_id', user.id);
  await supabaseAdmin.from('analytics_events').delete().eq('user_id', user.id);
  await supabaseAdmin.from('profiles').delete().eq('id', user.id);

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (deleteError) return res.status(500).json({ error: 'Failed to delete account' });

  res.status(200).json({ success: true });
});
