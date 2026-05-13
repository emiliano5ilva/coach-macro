import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './middleware/rateLimit.js';

const SAFETY_SYSTEM_PROMPT = `You are Coach Macro's AI fitness and nutrition assistant. Always follow these non-negotiable safety rules:

CALORIE LIMITS: Never recommend below 1,400 kcal/day for women or 1,600 kcal/day for men. Absolute minimum: 1,200 kcal/day. Never recommend rapid fat loss exceeding 2 lbs/week.

EXERCISE SAFETY: Never encourage training through chest pain, shortness of breath, or dizziness. For pregnant users: no supine exercises after 16 weeks, no heavy barbell loading, no contact sports. For users with joint replacements: avoid high-impact loading on replaced joint. For users with heart conditions: low-to-moderate intensity only and physician clearance required.

AGE GUIDELINES: Under 16 — bodyweight and light dumbbells only, max 3 sets, 12-15 reps, no barbell, no weight recommendations. Ages 16-17 — 70% of adult loading, max 3 sets, 8-10 reps, never to failure. Ages 65-69 — controlled tempo, 80% volume, 1.25x rest. Ages 70+ — 60% volume, 1.5x rest, always include balance work, never to failure.

MEDICAL CONDITIONS: Heart condition or hypertension — moderate intensity only, no Valsalva. Diabetes — monitor blood sugar around exercise. Epilepsy — avoid exercises with fall or seizure-injury risk. Eating disorder history — NEVER mention restriction or very low calorie numbers; frame all nutrition as fueling performance. Recent surgery — physician clearance first.

LANGUAGE: Never say "no pain no gain", "push through the pain", or "pain is weakness". Always use "listen to your body" and "train smart". Never diagnose conditions or recommend stopping medications. When safety is uncertain, recommend consulting a healthcare professional.`;

const TOKEN_LIMITS = {
  restaurant_ai:   { input: 800, output: 600 },
  adapt_now:       { input: 600, output: 500 },
  morning_brief:   { input: 400, output: 250 },
  meal_suggestion: { input: 300, output: 200 },
  meal_prep:       { input: 500, output: 800 },
  default:         { input: 500, output: 400 },
};

const MONTHLY_TOKEN_BUDGET = {
  free: 50000,
  pro:  500000,
};

function truncateToTokenLimit(messages, maxInputTokens) {
  const maxChars = maxInputTokens * 4;
  return messages.map(m => {
    if (typeof m.content === 'string' && m.content.length > maxChars) {
      return { ...m, content: m.content.slice(0, maxChars) };
    }
    return m;
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, x-is-pro');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(500).json({ error: 'API key not configured' }); return; }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const rateCheck = await checkRateLimit(req, '/api/claude');
  res.setHeader('X-RateLimit-Limit',     rateCheck.limit);
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the request limit. Please wait before trying again.',
      resetIn: Math.ceil(rateCheck.resetIn || 3600),
      limit: rateCheck.limit,
      upgradeMessage: 'Upgrade to Pro for 10x higher limits',
    });
  }

  const userId  = req.headers['x-user-id'] || null;
  let isPro     = req.headers['x-is-pro'] === 'true';
  const feature = req.body?.feature || 'default';
  const limits  = TOKEN_LIMITS[feature] || TOKEN_LIMITS.default;

  // ── Token budget ─────────────────────────────────────────────────────────────
  let sb = null;
  if (userId && process.env.SUPABASE_SERVICE_KEY) {
    sb = createClient(
      'https://oxxihlwqukbakmnnavuy.supabase.co',
      process.env.SUPABASE_SERVICE_KEY
    );

    // Look up pro status from profile (authoritative source)
    const { data: profile } = await sb.from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .maybeSingle();
    if (profile?.is_pro) isPro = true;

    const thisMonth = new Date().toISOString().slice(0, 7);
    const { data: usageRow } = await sb.from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', thisMonth)
      .maybeSingle();

    const used   = usageRow?.tokens_used || 0;
    const budget = isPro ? MONTHLY_TOKEN_BUDGET.pro : MONTHLY_TOKEN_BUDGET.free;

    if (used >= budget) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      const resetsIn = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      return res.status(429).json({
        error: 'Monthly AI limit reached',
        message: isPro
          ? `You have reached your monthly AI limit. It resets on ${resetsIn}.`
          : 'You have reached your free AI limit. Upgrade to Pro for 10x more AI features.',
        used,
        budget,
        resetsIn,
        upgradeUrl: 'coach-macro.com/pro',
      });
    }
  }

  // ── Call Anthropic ──────────────────────────────────────────────────────────
  try {
    const { feature: _f, ...bodyRest } = req.body;
    const messages = truncateToTokenLimit(bodyRest.messages || [], limits.input);

    const payload = {
      ...bodyRest,
      messages,
      system: SAFETY_SYSTEM_PROMPT,
      max_tokens: limits.output,
    };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const d = await r.json();

    // ── Track token usage ─────────────────────────────────────────────────────
    if (sb && userId && r.ok && d.usage) {
      const tokensUsed = (d.usage.input_tokens || 0) + (d.usage.output_tokens || 0);
      const thisMonth  = new Date().toISOString().slice(0, 7);
      const { data: currentRow } = await sb.from('token_usage')
        .select('tokens_used')
        .eq('user_id', userId)
        .eq('month', thisMonth)
        .maybeSingle();

      await sb.from('token_usage').upsert({
        user_id:      userId,
        month:        thisMonth,
        tokens_used:  (currentRow?.tokens_used || 0) + tokensUsed,
        last_feature: feature,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id,month' });
    }

    res.status(r.status).json(d);
  } catch (e) {
    res.status(500).json({ error: 'AI error' });
  }
}
