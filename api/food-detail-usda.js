import { withLogging } from './middleware/logger.js';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

// USDA FoodData Central detail endpoint (/food/{fdcId}) — the ONLY place USDA
// exposes household/count measures (foodPortions: "1 slice", "1 medium", "1 strip"
// + their gram weights). The search endpoint does not return these, so the client
// fetches this on food-tap to offer count-based units. Partial coverage by design:
// only USDA foods that DEFINE portions get household units — full universal
// count/unit coverage is the Nutritionix post-revenue upgrade (v2).
export default withLogging(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const { fdcId } = req.query;
  if (!fdcId || !/^\d+$/.test(String(fdcId).trim())) {
    return res.status(400).json({ error: 'Invalid fdcId' });
  }

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    console.warn('[food-detail-usda] USDA_API_KEY not configured');
    return res.status(200).json({ portions: [] });
  }

  try {
    // format=full is required — foodPortions/householdServingFullText are omitted
    // from the abridged format. (No nutrients needed; those came from search.)
    const url = `${USDA_BASE}/food/${encodeURIComponent(String(fdcId).trim())}`
      + `?format=full&api_key=${apiKey}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) {
      console.error('[food-detail-usda] USDA responded', r.status);
      return res.status(200).json({ portions: [] });
    }
    const data = await r.json();

    const seen = new Set();
    const portions = [];

    // Foundation / SR Legacy / Survey (FNDDS) → foodPortions[]
    for (const p of (data.foodPortions || [])) {
      const grams = p.gramWeight;
      if (!(grams > 0)) continue;

      // Prefer an explicit portionDescription; else compose amount + unit/modifier.
      let label = null;
      const desc = (p.portionDescription || '').trim();
      if (desc && !/^undetermined/i.test(desc)) {
        label = desc;
      } else {
        const unitName = p.measureUnit && p.measureUnit.name && p.measureUnit.name !== 'undetermined'
          ? p.measureUnit.name
          : (p.modifier || '').trim();
        if (unitName) {
          const amt = p.amount || 1;
          label = `${amt} ${unitName}`.trim();
        }
      }
      if (!label) continue; // never fake a count when USDA doesn't name the unit

      const g = Math.round(grams * 10) / 10;
      const key = `${label.toLowerCase()}|${g}`;
      if (seen.has(key)) continue;
      seen.add(key);
      portions.push({ label, grams: g });
    }

    // Branded fallback → householdServingFullText + servingSize (grams)
    if (portions.length === 0 && data.householdServingFullText && data.servingSize
        && String(data.servingSizeUnit || '').toLowerCase() === 'g') {
      const g = Math.round(data.servingSize * 10) / 10;
      portions.push({ label: String(data.householdServingFullText).trim(), grams: g });
    }

    return res.status(200).json({ portions: portions.slice(0, 12) });
  } catch (e) {
    console.error('[food-detail-usda] fetch error:', e.message);
    return res.status(200).json({ portions: [] });
  }
});
