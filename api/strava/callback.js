import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

function activityToWorkoutLog(a) {
  const typeMap = {
    Run: 'run', Ride: 'cycle', Swim: 'swim', Walk: 'walk',
    WeightTraining: 'lift', Workout: 'lift', Crossfit: 'hyrox',
    Hike: 'hike', VirtualRide: 'cycle', VirtualRun: 'run',
  };
  return {
    date: a.start_date_local?.split('T')[0],
    type: typeMap[a.type] || 'other',
    duration_min: Math.round((a.elapsed_time || 0) / 60),
    distance_m: a.distance || null,
    calories: a.calories || null,
    avg_hr: a.average_heartrate || null,
    max_hr: a.max_heartrate || null,
    elevation_m: a.total_elevation_gain || null,
    strava_name: a.name,
    strava_activity_id: String(a.id),
    source: 'strava',
    raw: { sport_type: a.sport_type, kudos: a.kudos_count },
  };
}

export default async function handler(req, res) {
  const { code, state: userId, error } = req.query;

  if (error) {
    return res.redirect(302, `${process.env.VITE_API_BASE_URL}/?strava=denied`);
  }
  if (!code || !userId) {
    return res.status(400).json({ error: 'Missing code or userId' });
  }

  const tokenRes = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.VITE_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) {
    return res.redirect(302, `${process.env.VITE_API_BASE_URL}/?strava=error`);
  }
  const token = await tokenRes.json();

  await sb.from('connected_apps').upsert({
    user_id: userId,
    provider: 'strava',
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: new Date(token.expires_at * 1000).toISOString(),
    athlete_id: String(token.athlete?.id || ''),
    athlete_name: token.athlete?.firstname
      ? `${token.athlete.firstname} ${token.athlete.lastname || ''}`.trim()
      : null,
    scopes: token.scope || '',
    connected_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });

  // Back-fill last 30 days
  const after = Math.floor(Date.now() / 1000) - 30 * 86400;
  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=60`,
    { headers: { Authorization: `Bearer ${token.access_token}` } }
  );
  if (activitiesRes.ok) {
    const activities = await activitiesRes.json();
    const rows = activities.map(a => ({
      user_id: userId,
      logged_at: a.start_date_local?.split('T')[0],
      ...activityToWorkoutLog(a),
    }));
    if (rows.length > 0) {
      await sb.from('workout_logs').upsert(rows, { onConflict: 'user_id,strava_activity_id' }).throwOnError().catch(() => {});
    }
  }

  res.redirect(302, `${process.env.VITE_API_BASE_URL}/?strava=connected`);
}
