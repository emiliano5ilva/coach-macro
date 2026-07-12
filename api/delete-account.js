import { createClient } from '@supabase/supabase-js';
import { withLogging } from './middleware/logger.js';

// SECURITY: the service-role key lives ONLY here (server-side env), never in the
// client bundle. The user being deleted is derived from their OWN bearer token
// (getUser below) — the client never supplies a user id — so a caller can only
// ever delete their own account, never someone else's.
// URL hardcoded to match the other server functions (logger.js/claude.js) — the
// project URL is public (not a secret), and `SUPABASE_URL` is NOT configured on
// Vercel, so reading it from env crashed this function at module load (500 on every
// request → delete-account never actually worked). Only the service key comes from env.
const supabaseAdmin = createClient(
  'https://oxxihlwqukbakmnnavuy.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

// Every public table carrying a per-user row (has a `user_id` column). Deleting by
// user_id also protects shared/curated rows — e.g. `recipes` presets have
// user_id IS NULL, so an eq('user_id', uid) match never touches the 299 curated recipes.
const USER_ID_TABLES = [
  'ai_usage', 'analytics_events', 'bio_data_points', 'bio_insights', 'bodyweight_logs',
  'coach_memories', 'cohort_assignments', 'connected_apps', 'connection_insights',
  'connections_data', 'custom_foods', 'custom_routines', 'deload_weeks', 'error_logs',
  'feature_unlocks', 'food_history', 'food_logs', 'injury_logs', 'injury_risks',
  'macro_memory', 'meal_templates', 'message_outcomes', 'metabolic_adaptations',
  'morning_briefs', 'morning_checkins', 'muscle_balance', 'muscle_recovery',
  'nutrition_protocols', 'outreach_log', 'outreach_preferences', 'pattern_detections',
  'personal_records', 'personality_profiles', 'photo_log_corrections', 'plateaus',
  'predictive_events', 'program_adjustments', 'program_favorites', 'program_ratings',
  'recipes', 'soreness_logs', 'tdee_history', 'token_usage', 'user_events',
  'validation_insights', 'water_logs', 'weight_checkins', 'weight_logs', 'workout_logs',
];

export default withLogging(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const uid = user.id;
  const email = user.email || null;

  // 1) All per-user data (best-effort — one table failing must not abort the rest).
  const ops = [
    ...USER_ID_TABLES.map(t => supabaseAdmin.from(t).delete().eq('user_id', uid)),
    // relational: the user may appear as referrer, recipient, or referred party
    supabaseAdmin.from('referrals').delete().or(`referrer_id.eq.${uid},recipient_user_id.eq.${uid},referred_id.eq.${uid}`),
    // composite-key rate limits key their id into the string
    supabaseAdmin.from('rate_limits').delete().like('key', `%_${uid}_%`),
    // email-keyed tables
    ...(email ? [
      supabaseAdmin.from('support_tickets').delete().eq('email', email),
      supabaseAdmin.from('waitlist').delete().eq('email', email),
    ] : []),
  ];
  const labels = [...USER_ID_TABLES, 'referrals', 'rate_limits', ...(email ? ['support_tickets', 'waitlist'] : [])];
  const results = await Promise.allSettled(ops);
  // Surface any cleanup failures server-side (orphan risk) without blocking deletion.
  results.forEach((r, i) => {
    const err = r.status === 'rejected' ? r.reason : r.value?.error;
    if (err) console.warn('[delete-account] cleanup issue on', labels[i], err.message || err);
  });

  // 2) The profile row (keyed by id = auth user id).
  await supabaseAdmin.from('profiles').delete().eq('id', uid);

  // 3) The auth record LAST — only report success once it's actually gone.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (deleteError) {
    console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message);
    return res.status(500).json({ error: 'Failed to delete account' });
  }

  return res.status(200).json({ success: true });
});
