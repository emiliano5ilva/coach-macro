import { createClient } from '@supabase/supabase-js';

// ── Shared helpers ────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://oxxihlwqukbakmnnavuy.supabase.co';
function sb() { return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); }

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'coach_macro_strava_hook';

const TYPE_MAP = {
  Run: 'run', Ride: 'cycle', Swim: 'swim', Walk: 'walk',
  WeightTraining: 'lift', Workout: 'lift', Crossfit: 'hyrox',
  Hike: 'hike', VirtualRide: 'cycle', VirtualRun: 'run',
};

function activityRow(a, userId) {
  return {
    user_id:            userId,
    logged_at:          a.start_date_local?.split('T')[0],
    type:               TYPE_MAP[a.type] || 'other',
    duration_min:       Math.round((a.elapsed_time || 0) / 60),
    distance_m:         a.distance || null,
    calories:           a.calories || null,
    avg_hr:             a.average_heartrate || null,
    max_hr:             a.max_heartrate || null,
    elevation_m:        a.total_elevation_gain || null,
    strava_name:        a.name,
    strava_activity_id: String(a.id),
    source:             'strava',
    raw:                { sport_type: a.sport_type, kudos: a.kudos_count },
  };
}

async function refreshIfNeeded(userId) {
  const { data } = await sb()
    .from('connected_apps')
    .select('access_token,refresh_token,expires_at')
    .eq('user_id', userId)
    .eq('provider', 'strava')
    .single();
  if (!data) return null;

  if (new Date(data.expires_at) <= new Date(Date.now() + 60000)) {
    const r = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.VITE_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: data.refresh_token,
        grant_type:    'refresh_token',
      }),
    });
    if (!r.ok) return null;
    const t = await r.json();
    await sb().from('connected_apps').update({
      access_token:  t.access_token,
      refresh_token: t.refresh_token,
      expires_at:    new Date(t.expires_at * 1000).toISOString(),
    }).eq('user_id', userId).eq('provider', 'strava');
    return t.access_token;
  }
  return data.access_token;
}

// ── Action handlers ───────────────────────────────────────────────────────────

// GET /api/strava/auth?userId=<uuid>
async function handleAuth(req, res) {
  const clientId   = process.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.VITE_API_BASE_URL}/api/strava/callback`;
  const scope      = 'read,activity:read_all';
  const state      = req.query.userId || '';

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id',     clientId);
  url.searchParams.set('redirect_uri',  redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope',         scope);
  url.searchParams.set('state',         state);

  res.redirect(302, url.toString());
}

// GET /api/strava/callback?code=...&state=<userId>
async function handleCallback(req, res) {
  const { code, state: userId, error } = req.query;
  const base = process.env.VITE_API_BASE_URL;

  if (error) return res.redirect(302, `${base}/?strava=denied`);
  if (!code || !userId) return res.status(400).json({ error: 'Missing code or userId' });

  const tokenRes = await fetch(STRAVA_TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     process.env.VITE_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return res.redirect(302, `${base}/?strava=error`);
  const token = await tokenRes.json();

  await sb().from('connected_apps').upsert({
    user_id:       userId,
    provider:      'strava',
    access_token:  token.access_token,
    refresh_token: token.refresh_token,
    expires_at:    new Date(token.expires_at * 1000).toISOString(),
    athlete_id:    String(token.athlete?.id || ''),
    athlete_name:  token.athlete?.firstname
      ? `${token.athlete.firstname} ${token.athlete.lastname || ''}`.trim()
      : null,
    scopes:        token.scope || '',
    connected_at:  new Date().toISOString(),
  }, { onConflict: 'user_id,provider' });

  // Back-fill last 30 days of activities
  const after = Math.floor(Date.now() / 1000) - 30 * 86400;
  const activitiesRes = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=60`,
    { headers: { Authorization: `Bearer ${token.access_token}` } }
  );
  if (activitiesRes.ok) {
    const activities = await activitiesRes.json();
    const rows = activities.map(a => activityRow(a, userId));
    if (rows.length > 0) {
      await sb().from('workout_logs')
        .upsert(rows, { onConflict: 'user_id,strava_activity_id' })
        .catch(() => {});
    }
  }

  res.redirect(302, `${base}/?strava=connected`);
}

// POST /api/strava/sync  { userId }
async function handleSync(req, res) {
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
  const rows = activities.map(a => activityRow(a, userId));
  if (rows.length > 0) {
    await sb().from('workout_logs')
      .upsert(rows, { onConflict: 'user_id,strava_activity_id' })
      .catch(() => {});
  }
  res.json({ synced: rows.length });
}

// GET /api/strava/webhook — Strava verification handshake
// POST /api/strava/webhook — incoming activity event
async function handleWebhook(req, res) {
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

  const { data: app } = await sb()
    .from('connected_apps')
    .select('user_id,access_token,refresh_token,expires_at')
    .eq('provider', 'strava')
    .eq('athlete_id', String(owner_id))
    .single();
  if (!app) return res.json({ ok: true });

  const accessToken = await refreshIfNeeded(app.user_id);
  if (!accessToken) return res.json({ ok: true });

  const actRes = await fetch(
    `https://www.strava.com/api/v3/activities/${object_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!actRes.ok) return res.json({ ok: true });
  const a = await actRes.json();

  await sb().from('workout_logs')
    .upsert(activityRow(a, app.user_id), { onConflict: 'user_id,strava_activity_id' })
    .catch(() => {});

  res.json({ ok: true });
}

// ── Router ────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const { action } = req.query;

  if (action === 'auth')     return handleAuth(req, res);
  if (action === 'callback') return handleCallback(req, res);
  if (action === 'sync')     return handleSync(req, res);
  if (action === 'webhook')  return handleWebhook(req, res);

  return res.status(400).json({ error: 'Unknown action', valid: ['auth', 'callback', 'sync', 'webhook'] });
}
