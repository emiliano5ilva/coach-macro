import { createClient } from '@supabase/supabase-js';
import { withLogging } from './middleware/logger.js';

const SAFETY_SYSTEM_PROMPT = `You are Coach Macro's AI fitness and nutrition assistant. Always follow these non-negotiable safety rules:

CALORIE LIMITS: Never recommend below 1,400 kcal/day for women or 1,600 kcal/day for men. Absolute minimum: 1,200 kcal/day. Never recommend rapid fat loss exceeding 2 lbs/week.

EXERCISE SAFETY: Never encourage training through chest pain, shortness of breath, or dizziness. For pregnant users: no supine exercises after 16 weeks, no heavy barbell loading, no contact sports. For users with joint replacements: avoid high-impact loading on replaced joint. For users with heart conditions: low-to-moderate intensity only and physician clearance required.

AGE GUIDELINES: Under 16 — bodyweight and light dumbbells only, max 3 sets, 12-15 reps, no barbell, no weight recommendations. Ages 16-17 — 70% of adult loading, max 3 sets, 8-10 reps, never to failure. Ages 65-69 — controlled tempo, 80% volume, 1.25x rest. Ages 70+ — 60% volume, 1.5x rest, always include balance work, never to failure.

MEDICAL CONDITIONS: Heart condition or hypertension — moderate intensity only, no Valsalva. Diabetes — monitor blood sugar around exercise. Epilepsy — avoid exercises with fall or seizure-injury risk. Eating disorder history — NEVER mention restriction or very low calorie numbers; frame all nutrition as fueling performance. Recent surgery — physician clearance first.

LANGUAGE: Never say "no pain no gain", "push through the pain", or "pain is weakness". Always use "listen to your body" and "train smart". Never diagnose conditions or recommend stopping medications. When safety is uncertain, recommend consulting a healthcare professional.`;

// Max tokens per request per feature
const TOKEN_LIMITS = {
  restaurant_ai:   { input: 800, output: 600 },
  restaurant_pick: { input: 1200, output: 2000 }, // raised: 900 truncated tool-use response
  menu_scan:       { input: 8000, output: 2000 }, // raised: same fix for menu scan path
  adapt_now:       { input: 600, output: 500 },
  morning_brief:   { input: 2500, output: 700 },
  meal_suggestion: { input: 300, output: 200 },
  food_suggestion: { input: 300, output: 200 },
  meal_prep:       { input: 500, output: 800 },
  default:         { input: 500, output: 400 },
};

// Anti-abuse hourly limits per feature — real users never hit these
const FEATURE_HOURLY_LIMITS = {
  restaurant_ai:   10,
  restaurant_pick: 20,
  menu_scan:       5,
  adapt_now:       5,
  morning_brief:   3,
  food_suggestion: 30,
  default:         60,
};

// Single monthly budget for all trial/pro users
// Heavy user ~38,900/month — 80k gives 2x headroom (~$0.38/user/month)
const MONTHLY_TOKEN_BUDGET = 80000;

const STREAMABLE_FEATURES = ['morning_brief', 'restaurant_ai', 'meal_prep', 'adapt_now'];

function getFirstOfNextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function truncateToTokenLimit(messages, maxInputTokens) {
  const maxChars = maxInputTokens * 4;
  return messages.map(m => {
    if (typeof m.content === 'string' && m.content.length > maxChars) {
      return { ...m, content: m.content.slice(0, maxChars) };
    }
    return m;
  });
}

const ALLOWED_ORIGINS = [
  'https://coach-macro.com',
  'https://www.coach-macro.com',
  'capacitor://localhost',
  'http://localhost:5173',
  'ionic://localhost',
];

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
  if (!anthropicKey) { res.status(500).json({ error: 'API key not configured' }); return; }

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

  const feature = req.body?.feature || 'default';
  const limits  = TOKEN_LIMITS[feature] || TOKEN_LIMITS.default;

  // ── 1. Subscription check ──────────────────────────────────────────────────
  const { data: profile } = await sb
    .from('profiles')
    .select('is_pro, subscription_tier, trial_ends_at, profile_data')
    .eq('id', userId)
    .maybeSingle();

  const now         = new Date();
  const trialEndsAt = profile?.trial_ends_at || profile?.profile_data?.trialEndsAt;
  const trialActive = trialEndsAt && new Date(trialEndsAt) > now;
  const isPro       = profile?.is_pro === true
    || profile?.subscription_tier === 'monthly'
    || profile?.subscription_tier === 'annual';

  if (!isPro && !trialActive) {
    return res.status(402).json({
      error:        'Subscription required',
      reason:       'subscription_required',
      message:      trialEndsAt
        ? 'Your free trial has ended. Upgrade to Pro to continue using AI features.'
        : 'Upgrade to Pro to access AI features.',
      trialExpired: !!trialEndsAt,
    });
  }

  // ── 2. Daily AI usage limit (ai_usage table) ──────────────────────────────
  const DAILY_LIMIT = 40; // covers ~10 photo logs + 20 text calls comfortably
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

  // ── 3. Increment daily call count ─────────────────────────────────────────
  try {
    const { error } = await sb.from('ai_usage').upsert({
      user_id:          userId,
      date:             today,
      call_count:       (dailyUsage?.call_count || 0) + 1,
      photo_call_count: dailyUsage?.photo_call_count || 0,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'user_id,date' });
    if (error) console.error('ai_usage upsert failed:', error);
  } catch (e) { console.error('ai_usage upsert threw:', e); }

  // ── Token tracking (analytics — not a rate gate) ───────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7);
  const { data: tokenRow } = await sb
    .from('token_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('month', thisMonth)
    .maybeSingle();
  const tokensUsedSoFar = tokenRow?.tokens_used || 0;

  const { feature: _f, stream: _streamFlag, ...bodyRest } = req.body;
  const messages = truncateToTokenLimit(bodyRest.messages || [], limits.input);
  const shouldStream = req.body.stream === true && STREAMABLE_FEATURES.includes(feature);

  // ── 4a. Streaming response ─────────────────────────────────────────────────
  if (shouldStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          ...bodyRest,
          messages,
          system:     SAFETY_SYSTEM_PROMPT,
          max_tokens: limits.output,
          stream:     true,
        }),
      });

      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        res.write(`data: ${JSON.stringify({ error: errData.error?.message || 'AI error' })}\n\n`);
        res.end();
        return;
      }

      const reader  = r.body.getReader();
      const decoder = new TextDecoder();
      let buf          = '';
      let inputTokens  = 0;
      let outputTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              res.write(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`);
            } else if (evt.type === 'message_start' && evt.message?.usage) {
              inputTokens = evt.message.usage.input_tokens || 0;
            } else if (evt.type === 'message_delta' && evt.usage) {
              outputTokens = evt.usage.output_tokens || 0;
            }
          } catch {}
        }
      }

      const tokensUsed = inputTokens + outputTokens;
      if (tokensUsed > 0) {
        await sb.from('token_usage').upsert({
          user_id:      userId,
          month:        thisMonth,
          tokens_used:  tokensUsedSoFar + tokensUsed,
          last_feature: feature,
          updated_at:   new Date().toISOString(),
        }, { onConflict: 'user_id,month' });
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (e) {
      res.write(`data: ${JSON.stringify({ error: e.message || 'AI error' })}\n\n`);
      res.end();
    }
    return;
  }

  // ── 4b. Non-streaming response ─────────────────────────────────────────────
  try {
    // For tool_choice calls, use max(clientMax, serverLimit) so forced tool-use
    // requests (e.g. Restaurant AI) never get silently truncated by the server cap.
    const clientMax = typeof bodyRest.max_tokens === 'number' ? bodyRest.max_tokens : 0;
    const max_tokens = bodyRest.tool_choice
      ? Math.min(Math.max(clientMax, limits.output), 8192)
      : limits.output;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...bodyRest,
        messages,
        system:     SAFETY_SYSTEM_PROMPT,
        max_tokens,
      }),
    });

    const d = await r.json();

    // ── 5. Track token usage ──────────────────────────────────────────────────
    if (r.ok && d.usage) {
      const tokensUsed = (d.usage.input_tokens || 0) + (d.usage.output_tokens || 0);
      await sb.from('token_usage').upsert({
        user_id:      userId,
        month:        thisMonth,
        tokens_used:  tokensUsedSoFar + tokensUsed,
        last_feature: feature,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'user_id,month' });
    }

    res.status(r.status).json(d);
  } catch {
    res.status(500).json({ error: 'AI error' });
  }
});
