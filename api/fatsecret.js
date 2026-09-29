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
    // basic premier scope required for foods.autocomplete.v2
    body: 'grant_type=client_credentials&scope=basic%20premier',
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

  const { endpoint, query, expression, page_number = 0, max_results = 20 } = req.query;
  const token = await getAccessToken();

  // ── Autocomplete endpoint ─────────────────────────────────────────────────────
  if (endpoint === 'autocomplete') {
    if (!expression || expression.trim().length < 1) {
      return res.status(400).json({ error: 'expression required' });
    }
    const acUrl = new URL('https://platform.fatsecret.com/rest/food/autocomplete/v2');
    acUrl.searchParams.set('expression', expression.trim());
    acUrl.searchParams.set('max_results', '8');
    acUrl.searchParams.set('format', 'json');
    const acRes = await fetch(acUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(4000),
    });
    if (!acRes.ok) {
      console.error('[fatsecret] autocomplete HTTP:', acRes.status);
      return res.status(200).json({ suggestions: [] });
    }
    const acData = await acRes.json();
    if (acData?.error) {
      console.error('[fatsecret] autocomplete API error:', JSON.stringify(acData.error));
      return res.status(200).json({ suggestions: [] });
    }
    // FatSecret returns { suggestions: { suggestion: [...] | "single string" } }
    const rawSug = acData?.suggestions?.suggestion;
    const suggestions = Array.isArray(rawSug) ? rawSug : rawSug ? [rawSug] : [];
    return res.status(200).json({ suggestions });
  }

  // ── Recipe search ─────────────────────────────────────────────────────────────
  if (endpoint === 'recipes') {
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query too short' });
    }
    const url = new URL('https://platform.fatsecret.com/rest/recipes/search/v3');
    url.searchParams.set('search_expression', query.trim());
    url.searchParams.set('page_number', String(Number(page_number)));
    url.searchParams.set('max_results', String(Math.min(Number(max_results), 50)));
    url.searchParams.set('must_have_images', '1');
    url.searchParams.set('format', 'json');

    const rRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!rRes.ok) {
      const body = await rRes.text().catch(() => '');
      console.error('[fatsecret] recipe search HTTP:', rRes.status, body.slice(0, 200));
      return res.status(200).json({ recipes: [], total_results: 0 });
    }
    const rData = await rRes.json();
    if (rData?.error) {
      console.error('[fatsecret] recipe search API error:', JSON.stringify(rData.error));
      return res.status(200).json({ recipes: [], total_results: 0 });
    }
    // FatSecret returns recipe as array (>=2) or single object (exactly 1)
    const rawR = rData?.recipes?.recipe;
    const rItems = Array.isArray(rawR) ? rawR : rawR ? [rawR] : [];

    const recipes = rItems.map(r => {
      const n = r.recipe_nutrition ?? {};
      return {
        recipe_id: r.recipe_id,
        recipe_name: r.recipe_name,
        recipe_image: r.recipe_image ?? null,
        recipe_description: r.recipe_description ?? null,
        recipe_types: r.recipe_types?.recipe_type ?? null,
        cooking_time_min: r.cooking_time_min ?? null,
        nutrition_per_serving: {
          calories: n.calories ?? null,
          protein: n.protein ?? null,
          carbohydrate: n.carbohydrate ?? null,
          fat: n.fat ?? null,
        },
      };
    });

    return res.status(200).json({
      recipes,
      total_results: Number(rData?.recipes?.total_results ?? 0),
      page_number: Number(rData?.recipes?.page_number ?? 0),
      max_results: Number(rData?.recipes?.max_results ?? 0),
    });
  }

  // ── Recipe detail ─────────────────────────────────────────────────────────────
  if (endpoint === 'recipe_detail') {
    const { recipe_id } = req.query;
    if (!recipe_id) {
      return res.status(400).json({ error: 'recipe_id required' });
    }
    const url = new URL('https://platform.fatsecret.com/rest/recipe/v2');
    url.searchParams.set('recipe_id', String(recipe_id));
    url.searchParams.set('format', 'json');

    const dRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!dRes.ok) {
      const body = await dRes.text().catch(() => '');
      console.error('[fatsecret] recipe detail HTTP:', dRes.status, body.slice(0, 200));
      return res.status(500).json({ error: 'Recipe detail fetch failed' });
    }
    const dData = await dRes.json();
    if (dData?.error) {
      console.error('[fatsecret] recipe detail API error:', JSON.stringify(dData.error));
      return res.status(500).json({ error: 'Recipe detail API error' });
    }

    const r = dData?.recipe ?? dData;
    const n = r.recipe_nutrition ?? {};

    // Ingredients: FatSecret returns ingredient as array or single object
    const rawIng = r.ingredients?.ingredient;
    const ingredients = (Array.isArray(rawIng) ? rawIng : rawIng ? [rawIng] : []).map(i => ({
      food_id: i.food_id,
      food_name: i.food_name,
      ingredient_description: i.ingredient_description ?? null,
      serving_description: i.serving_description ?? null,
      measurement_description: i.measurement_description ?? null,
      number_of_units: i.number_of_units ?? null,
      metric_serving_amount: i.metric_serving_amount ?? null,
      metric_serving_unit: i.metric_serving_unit ?? null,
    }));

    // Directions: FatSecret returns direction as array or single object
    const rawDir = r.directions?.direction;
    const directions = (Array.isArray(rawDir) ? rawDir : rawDir ? [rawDir] : []).map(d => ({
      direction_number: d.direction_number,
      direction_description: d.direction_description,
    }));

    // Images
    const rawImg = r.recipe_images?.recipe_image;
    const images = Array.isArray(rawImg) ? rawImg : rawImg ? [rawImg] : [];

    return res.status(200).json({
      recipe_id: r.recipe_id,
      recipe_name: r.recipe_name,
      recipe_url: r.recipe_url ?? null,
      recipe_description: r.recipe_description ?? null,
      recipe_types: r.recipe_types?.recipe_type ?? null,
      cooking_time_min: r.cooking_time_min ?? null,
      number_of_servings: r.number_of_servings ?? null,
      rating: r.rating ?? null,
      images,
      nutrition_per_serving: {
        calories: n.calories ?? null,
        protein: n.protein ?? null,
        carbohydrate: n.carbohydrate ?? null,
        fat: n.fat ?? null,
        saturated_fat: n.saturated_fat ?? null,
        cholesterol: n.cholesterol ?? null,
        sodium: n.sodium ?? null,
        fiber: n.fiber ?? null,
        sugar: n.sugar ?? null,
      },
      ingredients,
      directions,
    });
  }

  // ── Food search ───────────────────────────────────────────────────────────────
  if (!query || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  // REST v1 endpoint accepts OAuth2 Bearer tokens; the legacy rest/server.api requires OAuth1 signatures
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
