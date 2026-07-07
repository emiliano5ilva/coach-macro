// Proxies ExerciseDB (RapidAPI) so the API key lives server-side only.
// The key is process.env.RAPIDAPI_KEY (NON-VITE_ → never bundled into the client).
// Mirrors api/places.js (lightweight keyed GET proxy); metadata is public + cached
// in Supabase, so no JWT/subscription gating is needed here.
const ALLOWED_ORIGINS = [
  'https://coach-macro.com',
  'https://www.coach-macro.com',
  'capacitor://localhost',
  'http://localhost:5173',
  'ionic://localhost',
];

export default async function handler(req, res) {
  // ── CORS — allowlist only ──────────────────────────────────────────────────
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'not configured' });

  const name = String(req.query.name || '').slice(0, 80).trim();
  if (!name) return res.status(400).json({ error: 'name required' });

  try {
    const r = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`,
      { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com' } }
    );
    if (!r.ok) return res.status(200).json(null);
    const data = await r.json();
    const d = data?.[0];
    if (!d) return res.status(200).json(null);
    // Normalize server-side → the raw RapidAPI response shape never reaches the browser.
    return res.status(200).json({
      target_muscles:    d.target ? [d.target] : [],
      secondary_muscles: d.secondaryMuscles || [],
      instructions:      d.instructions || [],
      equipment:         d.equipment || null,
      body_part:         d.bodyPart || null,
    });
  } catch {
    return res.status(200).json(null);
  }
}
