import { withLogging } from './middleware/logger.js';

// Module-level token cache — persists across warm lambda invocations.
// Refreshed 60s before expiry to avoid races at the boundary.
let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60_000) return cachedToken;

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('FatSecret credentials not configured');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`FatSecret token exchange failed: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in ?? 86400) * 1000;
  return cachedToken;
}

export default withLogging(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = process.env.FATSECRET_CLIENT_ID;
  if (!clientId) {
    console.warn('[fatsecret] FATSECRET_CLIENT_ID not configured — search degraded');
    return res.status(200).json({ foods: [], total_results: 0 });
  }

  const { query, page_number = 0, max_results = 20 } = req.query;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const token = await getAccessToken();

  // REST v1 endpoint accepts OAuth2 Bearer tokens; the legacy rest/server.api endpoint requires OAuth1 signatures
  const url = new URL('https://platform.fatsecret.com/rest/foods/search/v1');
  url.searchParams.set('search_expression', query.trim());
  url.searchParams.set('page_number', String(Number(page_number)));
  url.searchParams.set('max_results', String(Math.min(Number(max_results), 50)));
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[fatsecret] search failed HTTP:', response.status, body.slice(0, 200));
    return res.status(200).json({ foods: [], total_results: 0 });
  }

  const data = await response.json();

  // FatSecret embeds API errors inside a 200 response — log and degrade gracefully
  if (data?.error) {
    console.error('[fatsecret] API error:', JSON.stringify(data.error));
    return res.status(200).json({ foods: [], total_results: 0 });
  }

  // FatSecret returns food as an array (>=2 results) or a single object (exactly 1 result)
  const raw = data?.foods?.food;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const foods = items.map(f => ({
    food_id: f.food_id,
    food_name: f.food_name,
    food_type: f.food_type,
    brand_name: f.brand_name ?? null,
    food_url: f.food_url,
    // e.g. "Per 100g - Calories: 165kcal | Fat: 3.57g | Carbs: 0g | Protein: 31.02g"
    description: f.food_description,
  }));

  return res.status(200).json({
    foods,
    total_results: Number(data?.foods?.total_results ?? 0),
    page_number: Number(data?.foods?.page_number ?? 0),
    max_results: Number(data?.foods?.max_results ?? 0),
  });
});
