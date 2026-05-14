import { createClient } from '@supabase/supabase-js';
import { withLogging } from './middleware/logger.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MONTHLY_TOKEN_BUDGET = 80000;
const HOURLY_LIMIT = 10;

export default withLogging(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: 'API key not configured' });

  const userId = req.headers['x-user-id'] || null;
  if (!userId) return res.status(401).json({ error: 'Authentication required', reason: 'unauthenticated' });

  const { image, mediaType = 'image/jpeg' } = req.body || {};
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  // ── Subscription check ───────────────────────────────────────────────────────
  const { data: profile } = await sb.from('profiles')
    .select('is_pro, profile_data').eq('id', userId).maybeSingle();
  const now = new Date();
  const trialActive = profile?.profile_data?.trialEndsAt && new Date(profile.profile_data.trialEndsAt) > now;
  if (!profile?.is_pro && !trialActive) {
    return res.status(402).json({
      error: 'Upgrade to Pro to use photo logging.',
      reason: 'subscription_required',
    });
  }

  // ── Hourly rate limit ────────────────────────────────────────────────────────
  const windowStart = Math.floor(Date.now() / 3600000);
  const rateKey = `photo_food_${userId}_${windowStart}`;
  try {
    const { data: rateRow } = await sb.from('rate_limits')
      .select('count').eq('key', rateKey).maybeSingle();
    if (rateRow && rateRow.count >= HOURLY_LIMIT) {
      return res.status(429).json({
        error: 'Too many photo logs. Try again in an hour.',
        reason: 'rate_limit',
        resetIn: 3600 - (Math.floor(Date.now() / 1000) % 3600),
      });
    }
    await sb.from('rate_limits').upsert({
      key: rateKey, count: (rateRow?.count || 0) + 1,
      window_start: windowStart,
      expires_at: new Date((windowStart + 1) * 3600000).toISOString(),
    }, { onConflict: 'key' });
  } catch {}

  // ── Monthly token budget ─────────────────────────────────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7);
  const { data: usageRow } = await sb.from('token_usage')
    .select('tokens_used').eq('user_id', userId).eq('month', thisMonth).maybeSingle();
  const usedSoFar = usageRow?.tokens_used || 0;
  if (usedSoFar >= MONTHLY_TOKEN_BUDGET) {
    return res.status(429).json({
      error: "You've reached your monthly AI limit. Resets on the 1st.",
      reason: 'monthly_limit',
    });
  }

  // ── Claude vision call ───────────────────────────────────────────────────────
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
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: image },
            },
            {
              type: 'text',
              text: `You are a nutrition expert analyzing a food photo. Identify every visible food item and estimate quantities and macros.

Be conservative — if unsure about quantity, estimate on the lower side.

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "confidence": "high" | "medium" | "low",
  "items": [
    {
      "name": "Food name",
      "portion": "estimated portion",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0,
      "notes": "any uncertainty"
    }
  ],
  "totals": { "calories": 0, "protein": 0, "carbs": 0, "fat": 0 },
  "suggestions": "optional meal context e.g. high protein meal"
}

If no food is clearly visible return exactly: {"error":"No food detected"}

Portion reference:
- palm-sized chicken breast = 4–6 oz (113–170g) = 160–280 kcal, 30–50g protein
- 1 cup cooked rice = ~200g = 260 kcal, 5g protein, 53g carbs
- 1 cup broccoli = 85g = 30 kcal, 2.5g protein
- 1 medium egg = 50g = 70 kcal, 6g protein, 5g fat
- 1 tbsp oil/butter = 14g = 120 kcal, 14g fat
- slice of bread = 30g = 80 kcal, 3g protein, 15g carbs`,
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

    // Track token usage against shared monthly budget
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    await sb.from('token_usage').upsert(
      { user_id: userId, month: thisMonth, tokens_used: usedSoFar + tokensUsed },
      { onConflict: 'user_id,month' }
    ).catch(() => {});

    return res.status(200).json(analysis);
  } catch (e) {
    console.error('[food-photo] error:', e);
    return res.status(500).json({ error: 'Photo analysis failed. Try again or log manually.' });
  }
});
