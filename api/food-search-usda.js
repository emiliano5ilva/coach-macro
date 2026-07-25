import { withLogging } from './middleware/logger.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

// Targeted cut terms for enrichment of single-word generic queries.
// Each is appended to the bare query ("chicken breast", "chicken thigh", etc.)
// and fetched Foundation+SR Legacy only, pageSize=25.
// "breast"  — surfaces "meat only, cooked, roasted" SR Legacy basics for poultry
// "thigh"   — surfaces thigh basics for poultry
// "fillet"  — surfaces fish fillet basics (salmon, tilapia, cod, etc.)
// Terms not applicable to a given food produce no results or garbage that
// scoreRelevance drops at -1 (e.g. "salmon breast" → salmon-unrelated entries).
const ENRICH_CUTS = ['breast', 'thigh', 'fillet'];

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
    const raw      = query.trim();
    const q        = encodeURIComponent(raw);
    const qCooked  = encodeURIComponent(raw + ' cooked');
    const baseFilt = `&dataType=Foundation&dataType=${encodeURIComponent('SR Legacy')}`;

    const isGenericWord = !raw.includes(' ');

    const urlA = `${USDA_BASE}/foods/search?query=${q}`
      + `&dataType=${encodeURIComponent('Survey (FNDDS)')}`
      + `&dataType=Foundation`
      + `&dataType=${encodeURIComponent('SR Legacy')}`
      + `&pageSize=50&api_key=${apiKey}`;
    const urlB = `${USDA_BASE}/foods/search?query=${q}${baseFilt}&pageSize=25&api_key=${apiKey}`;
    const urlC = `${USDA_BASE}/foods/search?query=${qCooked}${baseFilt}&pageSize=25&api_key=${apiKey}`;

    const requests = [
      ['A', urlA],
      ['B', urlB],
      ['C', urlC],
      ...(isGenericWord
        ? ENRICH_CUTS.map(cut => [`cut:${cut}`, `${USDA_BASE}/foods/search?query=${encodeURIComponent(raw + ' ' + cut)}${baseFilt}&pageSize=25&api_key=${apiKey}`])
        : []),
    ];

    const results = await Promise.allSettled(
      requests.map(([, url]) => fetch(url, { signal: AbortSignal.timeout(5000) }))
    );

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

    for (let i = 0; i < requests.length; i++) {
      const [label] = requests[i];
      const result = results[i];
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
