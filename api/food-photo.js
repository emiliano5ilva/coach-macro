import { createClient } from '@supabase/supabase-js';
import { withLogging } from './middleware/logger.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const USDA_SEARCH = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const MONTHLY_TOKEN_BUDGET = 80000;
const HOURLY_LIMIT = 10;

// ── USDA helpers ─────────────────────────────────────────────────────────────

function parsePortionGrams(portion) {
  if (!portion) return null;
  const p = portion.toLowerCase().trim();
  let m;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*oz/))) return parseFloat(m[1]) * 28.35;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*g(?:rams?)?(?:\b|$)/))) return parseFloat(m[1]);
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*(?:lb|pound)s?/))) return parseFloat(m[1]) * 453.6;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*cups?/))) return parseFloat(m[1]) * 240;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*(?:tbsp|tablespoons?)/))) return parseFloat(m[1]) * 15;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*(?:tsp|teaspoons?)/))) return parseFloat(m[1]) * 5;
  if (p.includes('large')) return 200;
  if (p.includes('medium')) return 150;
  if (p.includes('small')) return 80;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*slices?/))) return parseFloat(m[1]) * 28;
  if ((m = p.match(/(\d+(?:\.\d+)?)\s*pieces?/))) return parseFloat(m[1]) * 80;
  if ((m = p.match(/^(\d+(?:\.\d+)?)\b/))) return parseFloat(m[1]) * 120;
  return null;
}

async function lookupUSDA(name, portion) {
  const key = process.env.USDA_API_KEY;
  if (!key) return null;
  const grams = parsePortionGrams(portion);
  if (!grams || grams <= 0) return null;
  try {
    const r = await fetch(
      `${USDA_SEARCH}?query=${encodeURIComponent(name)}&dataType=Foundation,SR%20Legacy&pageSize=3&api_key=${key}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!r.ok) return null;
    const d = await r.json();
    const food = d.foods?.[0];
    if (!food) return null;
    const n = {};
    for (const fn of (food.foodNutrients || [])) n[fn.nutrientId] = fn.value;
    if (!n[1008]) return null;
    const s = grams / 100;
    return {
      calories: Math.round((n[1008] || 0) * s),
      protein: Math.round((n[1003] || 0) * s * 10) / 10,
      carbs:   Math.round((n[1005] || 0) * s * 10) / 10,
      fat:     Math.round((n[1004] || 0) * s * 10) / 10,
      source:  'usda',
      verified: true,
    };
  } catch { return null; }
}

const ALLOWED_ORIGINS = [
  'https://coach-macro.com',
  'capacitor://localhost',
  'http://localhost:5173',
  'ionic://localhost',
];

// ── Handler ──────────────────────────────────────────────────────────────────

export default withLogging(async function handler(req, res) {
  // ── CORS — allowlist only ──────────────────────────────────────────────────
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'API key not configured' });

  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  // ── JWT verification — replaces x-user-id header trust ───────────────────
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required', reason: 'unauthenticated' });
  const { data: { user }, error: authError } = await sb.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid session', reason: 'unauthenticated' });
  const userId = user.id;

  const { image, mediaType = 'image/jpeg', userDescription } = req.body || {};
  if (!image) return res.status(400).json({ error: 'No image provided' });

  // ── Subscription check ────────────────────────────────────────────────────
  const { data: profile } = await sb.from('profiles')
    .select('is_pro, subscription_tier, trial_ends_at, profile_data').eq('id', userId).maybeSingle();
  const now = new Date();
  const trialEndsAt = profile?.trial_ends_at || profile?.profile_data?.trialEndsAt;
  const trialActive = trialEndsAt && new Date(trialEndsAt) > now;
  const isPro = profile?.is_pro === true
    || profile?.subscription_tier === 'monthly'
    || profile?.subscription_tier === 'annual';
  if (!isPro && !trialActive) {
    return res.status(402).json({
      error: 'Upgrade to Pro to use photo logging.',
      reason: 'subscription_required',
    });
  }

  // ── Daily AI usage limit (ai_usage table) ─────────────────────────────────
  const DAILY_LIMIT = 40; // photo_call_count counts double → ~10 photo logs max
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyUsage } = await sb
    .from('ai_usage')
    .select('call_count, photo_call_count')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  const effectiveCalls = (dailyUsage?.call_count || 0) + ((dailyUsage?.photo_call_count || 0) * 2);
  if (effectiveCalls >= DAILY_LIMIT) {
    return res.status(429).json({
      error:       'daily_limit_reached',
      reason:      'daily_limit',
      calls_used:  effectiveCalls,
      calls_limit: DAILY_LIMIT,
      message:     "You've used all your AI credits for today. They reset at midnight. Core tracking (food search, barcode, workouts) still works normally.",
    });
  }

  // ── Increment photo call count ─────────────────────────────────────────────
  await sb.from('ai_usage').upsert({
    user_id:          userId,
    date:             today,
    call_count:       dailyUsage?.call_count || 0,
    photo_call_count: (dailyUsage?.photo_call_count || 0) + 1,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id,date' }).catch(() => {});

  // ── Token tracking (analytics — not a rate gate) ───────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7);
  const { data: usageRow } = await sb.from('token_usage')
    .select('tokens_used').eq('user_id', userId).eq('month', thisMonth).maybeSingle();
  const usedSoFar = usageRow?.tokens_used || 0;

  // ── Load correction history for calibration ──────────────────────────────────
  let portionHints = '';
  try {
    const { data: corrections } = await sb.from('photo_log_corrections')
      .select('ai_identified, user_corrected_to, portion_adjustment')
      .eq('user_id', userId)
      .order('corrected_at', { ascending: false })
      .limit(20);

    if (corrections?.length) {
      const hints = corrections
        .filter(c => c.portion_adjustment || c.user_corrected_to)
        .slice(0, 8)
        .map(c => {
          if (c.user_corrected_to && c.ai_identified !== c.user_corrected_to)
            return `- This user calls "${c.ai_identified}" → "${c.user_corrected_to}"`;
          if (c.portion_adjustment && c.portion_adjustment !== 1)
            return `- This user typically scales ${c.ai_identified} portions by ${c.portion_adjustment}×`;
          return null;
        })
        .filter(Boolean);
      if (hints.length) portionHints = `\n\nUser correction history (calibrate to their preferences):\n${hints.join('\n')}`;
    }
  } catch {}

  // ── Claude vision call ───────────────────────────────────────────────────────
  const descriptionContext = userDescription
    ? `\n\nThe user added this note about the photo: "${userDescription}". Use it to improve identification accuracy.`
    : '';

  try {
    const r = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: `You are a precision nutrition expert analyzing a food photo. Identify every visible food item and estimate quantities and macros.

CRITICAL RULES:
1. Break complex dishes into components. A burrito bowl → rice, beans, chicken, cheese, guac, salsa separately. A plate of pasta → pasta, sauce, protein separately. Each ingredient gets its own entry.
2. Be conservative on portions — estimate on the lower side if unsure.
3. Do NOT combine mixed dishes into a single vague entry.${descriptionContext}${portionHints}

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "confidence": "high" | "medium" | "low",
  "items": [
    {
      "name": "Specific food name (e.g. 'White rice' not 'Carbs')",
      "portion": "estimated portion with unit (e.g. '1 cup', '4 oz', '150g')",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "notes": "any uncertainty or assumption"
    }
  ],
  "totals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "suggestions": "optional one-line meal context"
}

If no food is clearly visible return exactly: {"error":"No food detected"}

Reference object calibration:
Look for these objects in the frame and use them to calibrate portion sizes:
- Fork or spoon: typically 7 inches / 18 cm long
- Credit card: 3.4 × 2.1 inches / 8.6 × 5.4 cm
- Human hand: palm typically 3–4 inches / 7–10 cm wide
- Plate: small ≈ 7", medium ≈ 9", large ≈ 11" diameter
If you find a reference object, use it to calibrate your estimates and mention which one in the notes field of the relevant item (e.g. "Calibrated against fork in frame"). If no reference object is visible, add a note on one item: "No size reference visible — estimate may vary ±20%".

Portion reference:
- palm-sized chicken breast = 4–6 oz (113–170g) = 160–280 kcal, 30–50g protein
- 1 cup cooked rice = ~200g = 260 kcal, 5g protein, 53g carbs
- 1 cup cooked pasta = ~140g = 220 kcal, 8g protein, 43g carbs
- 1 cup broccoli = 85g = 30 kcal, 2.5g protein
- 1 medium egg = 50g = 70 kcal, 6g protein, 5g fat
- 1 tbsp oil/butter = 14g = 120 kcal, 14g fat
- 1 slice bread = 30g = 80 kcal, 3g protein, 15g carbs
- 1 oz cheese = 28g = 115 kcal, 7g protein, 9g fat`,
            },
          ],
        }],
      }),
    });

    if (!r.ok) {
      const errData = await r.json().catch(() => ({}));
      return res.status(500).json({ error: errData.error?.message || 'AI analysis failed' });
    }

    const data = await r.json();
    const text = data.content?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();

    let analysis;
    try {
      analysis = JSON.parse(clean);
    } catch {
      return res.status(500).json({ error: 'Could not parse AI response. Try again.' });
    }

    // Track token usage
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    await sb.from('token_usage').upsert(
      { user_id: userId, month: thisMonth, tokens_used: usedSoFar + tokensUsed },
      { onConflict: 'user_id,month' }
    ).catch(() => {});

    if (analysis.error) return res.status(200).json(analysis);

    // ── USDA enrichment (parallel, best-effort) ──────────────────────────────
    const usdaKey = process.env.USDA_API_KEY;
    if (usdaKey && analysis.items?.length) {
      const enriched = await Promise.all(
        analysis.items.map(async (item) => {
          const usda = await lookupUSDA(item.name, item.portion);
          if (!usda) return { ...item, source: 'ai', verified: false };

          // Sanity check: accept USDA only if within 50% of AI estimate
          const aiCal = item.calories || 1;
          const ratio = usda.calories / aiCal;
          if (ratio < 0.5 || ratio > 2.0) return { ...item, source: 'ai', verified: false };

          return {
            ...item,
            calories: usda.calories,
            protein:  usda.protein,
            carbs:    usda.carbs,
            fat:      usda.fat,
            source:   'usda',
            verified: true,
          };
        })
      );
      analysis.items = enriched;

      // Recalculate totals after enrichment
      analysis.totals = enriched.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein:  acc.protein  + (item.protein  || 0),
        carbs:    acc.carbs    + (item.carbs    || 0),
        fat:      acc.fat      + (item.fat      || 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } else if (analysis.items?.length) {
      analysis.items = analysis.items.map(item => ({ ...item, source: 'ai', verified: false }));
    }

    return res.status(200).json(analysis);
  } catch (e) {
    console.error('[food-photo] error:', e);
    return res.status(500).json({ error: 'Photo analysis failed. Try again or log manually.' });
  }
});
