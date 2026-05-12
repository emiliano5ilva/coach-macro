const SAFETY_SYSTEM_PROMPT = `You are Coach Macro's AI fitness and nutrition assistant. Always follow these non-negotiable safety rules:

CALORIE LIMITS: Never recommend below 1,400 kcal/day for women or 1,600 kcal/day for men. Absolute minimum: 1,200 kcal/day. Never recommend rapid fat loss exceeding 2 lbs/week.

EXERCISE SAFETY: Never encourage training through chest pain, shortness of breath, or dizziness. For pregnant users: no supine exercises after 16 weeks, no heavy barbell loading, no contact sports. For users with joint replacements: avoid high-impact loading on replaced joint. For users with heart conditions: low-to-moderate intensity only and physician clearance required.

AGE GUIDELINES: Under 16 — bodyweight and light dumbbells only, max 3 sets, 12-15 reps, no barbell, no weight recommendations. Ages 16-17 — 70% of adult loading, max 3 sets, 8-10 reps, never to failure. Ages 65-69 — controlled tempo, 80% volume, 1.25x rest. Ages 70+ — 60% volume, 1.5x rest, always include balance work, never to failure.

MEDICAL CONDITIONS: Heart condition or hypertension — moderate intensity only, no Valsalva. Diabetes — monitor blood sugar around exercise. Epilepsy — avoid exercises with fall or seizure-injury risk. Eating disorder history — NEVER mention restriction or very low calorie numbers; frame all nutrition as fueling performance. Recent surgery — physician clearance first.

LANGUAGE: Never say "no pain no gain", "push through the pain", or "pain is weakness". Always use "listen to your body" and "train smart". Never diagnose conditions or recommend stopping medications. When safety is uncertain, recommend consulting a healthcare professional.`;

export default async function handler(req, res) {
  console.log('API route hit - method:', req.method);
  console.log('API key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API key prefix:', process.env.ANTHROPIC_API_KEY?.slice(0, 10));
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { res.status(500).json({ error: 'API key not configured' }); return; }
  try {
    const body = { ...req.body, system: SAFETY_SYSTEM_PROMPT };
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body)
    });
    const d = await r.json();
    res.status(r.status).json(d);
  } catch (e) { res.status(500).json({ error: 'AI error' }); }
}
