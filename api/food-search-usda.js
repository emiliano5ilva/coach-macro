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
    const q      = encodeURIComponent(query.trim());
    const qCooked = encodeURIComponent(query.trim() + ' cooked');
    const baseFilt = `&dataType=Foundation&dataType=${encodeURIComponent('SR Legacy')}`;

    // Request A: all three dataTypes, plain query — composite dishes + any
    //   Foundation/SR Legacy that ranks naturally in USDA's top 50.
    // Request B: Foundation + SR Legacy, plain query — basic cuts/forms that
    //   USDA buries past position 50 for generic single-word queries.
    // Request C: Foundation + SR Legacy, "${q} cooked" — forces cooked
    //   Foundation/SR Legacy basics (roasted breast, grilled fillet, etc.) that
    //   neither A nor B surface reliably for generic queries.
    // All three run in parallel; results merged and deduped by fdcId.
    const urlA = `${USDA_BASE}/foods/search?query=${q}`
      + `&dataType=${encodeURIComponent('Survey (FNDDS)')}`
      + `&dataType=Foundation`
      + `&dataType=${encodeURIComponent('SR Legacy')}`
      + `&pageSize=50&api_key=${apiKey}`;
    const urlB = `${USDA_BASE}/foods/search?query=${q}${baseFilt}&pageSize=25&api_key=${apiKey}`;
    const urlC = `${USDA_BASE}/foods/search?query=${qCooked}${baseFilt}&pageSize=25&api_key=${apiKey}`;

    const [resA, resB, resC] = await Promise.allSettled([
      fetch(urlA, { signal: AbortSignal.timeout(5000) }),
      fetch(urlB, { signal: AbortSignal.timeout(5000) }),
      fetch(urlC, { signal: AbortSignal.timeout(5000) }),
    ]);

    const seen = new Set();
    const foods = [];

    const merge = (items) => {
      for (const f of (items || [])) {
        if (f.fdcId && !seen.has(f.fdcId)) {
          seen.add(f.fdcId);
          foods.push(f);
        }
      }
    };

    for (const [label, result] of [['A', resA], ['B', resB], ['C', resC]]) {
      if (result.status !== 'fulfilled') {
        console.error(`[food-search-usda] request ${label} threw:`, result.reason?.message);
        continue;
      }
      if (!result.value.ok) {
        const body = await result.value.text().catch(() => '');
        console.error(`[food-search-usda] request ${label} USDA responded`, result.value.status, body.slice(0, 200));
        continue;
      }
      const data = await result.value.json().catch(() => null);
      merge(data?.foods);
    }

    return res.status(200).json({ foods });
  } catch (e) {
    console.error('[food-search-usda] fetch error:', e.message);
    return res.status(200).json({ foods: [] });
  }
});
