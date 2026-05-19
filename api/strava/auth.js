export default function handler(req, res) {
  const clientId = process.env.VITE_STRAVA_CLIENT_ID;
  const redirectUri = `${process.env.VITE_API_BASE_URL}/api/strava/callback`;
  const scope = 'read,activity:read_all';
  const state = req.query.userId || '';

  const url = new URL('https://www.strava.com/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);

  res.redirect(302, url.toString());
}
