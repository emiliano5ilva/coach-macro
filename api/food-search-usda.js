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
    const url = `${USDA_BASE}/foods/search?query=${encodeURIComponent(query.trim())}&dataType=Survey%20(FNDDS),Foundation,SR%20Legacy&pageSize=25&api_key=${apiKey}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) {
      console.error('[food-search-usda] USDA responded', r.status);
      return res.status(200).json({ foods: [] });
    }
    const data = await r.json();
    return res.status(200).json({ foods: data.foods || [] });
  } catch (e) {
    console.error('[food-search-usda] fetch error:', e.message);
    return res.status(200).json({ foods: [] });
  }
});
