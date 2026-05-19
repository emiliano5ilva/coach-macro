import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oxxihlwqukbakmnnavuy.supabase.co';
function sb() { return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); }

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'coach_macro_strava_hook';

async function getAccessToken(userId) {
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
  // Webhook verification handshake
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': vt, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && vt === VERIFY_TOKEN) {
      return res.json({ 'hub.challenge': challenge });
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { object_type, aspect_type, object_id, owner_id } = req.body || {};

  if (object_type !== 'activity' || !['create', 'update'].includes(aspect_type)) {
    return res.json({ ok: true });
  }

  // Find which user owns this Strava athlete
  const { data: app } = await sb()
    .from('connected_apps')
    .select('user_id,access_token,refresh_token,expires_at')
    .eq('provider', 'strava')
    .eq('athlete_id', String(owner_id))
    .single();

  if (!app) return res.json({ ok: true });

  const accessToken = await getAccessToken(app.user_id);
  if (!accessToken) return res.json({ ok: true });

  const actRes = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!actRes.ok) return res.json({ ok: true });
  const a = await actRes.json();

  const typeMap = {
    Run: 'run', Ride: 'cycle', Swim: 'swim', Walk: 'walk',
    WeightTraining: 'lift', Workout: 'lift', Crossfit: 'hyrox',
    Hike: 'hike', VirtualRide: 'cycle', VirtualRun: 'run',
  };

  await sb().from('workout_logs').upsert({
    user_id: app.user_id,
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
  }, { onConflict: 'user_id,strava_activity_id' }).throwOnError().catch(() => {});

  res.json({ ok: true });
}
