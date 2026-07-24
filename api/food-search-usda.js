import { withLogging } from './middleware/logger.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

export default withLogging(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { query } = req.query;
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.warn('[food-search-usda] USDA_API_KEY not configured — search degraded');
    return res.status(200).json({ foods: [] });
  }

  try {
    // Include Survey (FNDDS) — the dataset that covers prepared/mixed dishes
    // (e.g. "fettuccine alfredo"); Foundation + SR Legacy are mostly raw ingredients.
    // Use repeated dataType params (USDA spec: array[string], collectionFormat:multi).
    // Build with encodeURIComponent so spaces are %20 (not +) and api_key is passed raw
    // to avoid URLSearchParams encoding base64 chars (+/=) in the key.
    const url = `${USDA_BASE}/foods/search`
      + `?query=${encodeURIComponent(query.trim())}`
      + `&dataType=${encodeURIComponent('Survey (FNDDS)')}`
      + `&dataType=Foundation`
      + `&dataType=${encodeURIComponent('SR Legacy')}`
      + `&pageSize=50`
      + `&api_key=${apiKey}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) {
      const errBody = await r.text().catch(() => '');
      console.error('[food-search-usda] USDA responded', r.status, errBody.slice(0, 300));
      return res.status(200).json({ foods: [] });
    }
    const data = await r.json();
    return res.status(200).json({ foods: data.foods || [] });
  } catch (e) {
    console.error('[food-search-usda] fetch error:', e.message);
    return res.status(200).json({ foods: [] });
  }
});
