import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oxxihlwqukbakmnnavuy.supabase.co';
function sb() { return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); }

async function refreshIfNeeded(userId) {
  const { data } = await sb()
    .from('connected_apps')
    .select('access_token,refresh_token,expires_at')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .single();
  if (!data) return null;

  if (new Date(data.expires_at) <= new Date(Date.now() + 60000)) {
    const r = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.VITE_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (!r.ok) return null;
    const t = await r.json();
    await sb().from('connected_apps').update({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(t.expires_at * 1000).toISOString(),
    }).eq('user_id', userId).eq('provider', 'strava');
    return t.access_token;
  }
  return data.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const accessToken = await refreshIfNeeded(userId);
  if (!accessToken) return res.status(401).json({ error: 'Not connected' });

  const after = Math.floor(Date.now() / 1000) - 30 * 86400;
  const r = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=60`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) return res.status(502).json({ error: 'Strava fetch failed' });

  const activities = await r.json();
  const typeMap = {
    Run: 'run', Ride: 'cycle', Swim: 'swim', Walk: 'walk',
    WeightTraining: 'lift', Workout: 'lift', Crossfit: 'hyrox',
    Hike: 'hike', VirtualRide: 'cycle', VirtualRun: 'run',
  };

  const rows = activities.map(a => ({
    user_id: userId,
    logged_at: a.start_date_local?.split('T')[0],
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
    raw: { sport_type: a.sport_type },
  }));

  if (rows.length > 0) {
    await sb().from('workout_logs').upsert(rows, { onConflict: 'user_id,strava_activity_id' }).throwOnError().catch(() => {});
  }

  res.json({ synced: rows.length });
}
