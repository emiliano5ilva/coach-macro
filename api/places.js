export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { endpoint, ...params } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_KEY;

  const allowedEndpoints = ['nearbysearch', 'geocode', 'photo'];
  if (!allowedEndpoints.includes(endpoint)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  const baseUrls = {
    nearbysearch: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    geocode: 'https://maps.googleapis.com/maps/api/geocode/json',
    photo: 'https://maps.googleapis.com/maps/api/place/photo',
  };

  const url = new URL(baseUrls[endpoint]);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('key', apiKey);

  // Photo endpoint returns an image via redirect, not JSON — follow the redirect
  // server-side so the API key never leaves the server, then re-redirect the client.
  if (endpoint === 'photo') {
    const response = await fetch(url.toString(), { redirect: 'follow' });
    return res.redirect(302, response.url);
  }

  const response = await fetch(url.toString());
  const data = await response.json();
  return res.status(200).json(data);
}
