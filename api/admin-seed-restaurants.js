/**
 * admin-seed-restaurants.js  — ONE-TIME seed endpoint (delete after use)
 *
 * Protected by the SUPABASE_SERVICE_KEY as a bearer token — only an
 * operator who already has the service key can trigger it.
 *
 * Usage (run from terminal, batch through the list):
 *   curl -X POST https://www.coach-macro.com/api/admin-seed-restaurants \
 *        -H "Authorization: Bearer <SUPABASE_SERVICE_KEY>" \
 *        -H "Content-Type: application/json" \
 *        -d '{"from":0,"size":20}'
 *
 * Repeat with from=20, from=40, … until seeded=0 or all done.
 * Each call processes up to `size` restaurants (~3s each → 20*3=60s ≈ safe).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://oxxihlwqukbakmnnavuy.supabase.co';

const CHAINS = [
  "McDonald's", "Burger King", "Wendy's", "Taco Bell", "Subway",
  "Chipotle Mexican Grill", "Chick-fil-A", "Panera Bread", "Starbucks",
  "Dunkin'", "Panda Express", "KFC", "Popeyes", "Sonic Drive-In",
  "Dairy Queen", "Five Guys", "In-N-Out Burger", "Shake Shack",
  "Whataburger", "Jack in the Box", "Arby's", "Hardee's",
  "Carl's Jr.", "Wingstop", "Raising Cane's", "Zaxby's",
  "Bojangles", "Culver's", "Chili's", "Applebee's",
  "Olive Garden", "Outback Steakhouse", "Red Lobster",
  "Texas Roadhouse", "LongHorn Steakhouse", "The Cheesecake Factory",
  "Buffalo Wild Wings", "IHOP", "Denny's", "Waffle House",
  "Jersey Mike's Subs", "Jimmy John's", "Firehouse Subs",
  "Potbelly Sandwich Shop", "Sweetgreen", "QDOBA Mexican Eats",
  "Moe's Southwest Grill", "El Pollo Loco", "Del Taco",
  "Noodles & Company", "Pei Wei", "P.F. Chang's", "Red Robin",
  "First Watch", "McAlister's Deli", "Jason's Deli",
  "Tropical Smoothie Cafe", "Jamba Juice", "Smoothie King",
  "Freshii", "Saladworks", "Bonefish Grill", "Carrabba's Italian Grill",
  "Maggiano's Little Italy", "Fogo de Chão", "Ruth's Chris Steak House",
  "The Capital Grille", "Bahama Breeze", "Yard House",
  "BJ's Restaurant", "TGI Fridays", "Ruby Tuesday",
  "Logan's Roadhouse", "Bob Evans", "Cracker Barrel", "Golden Corral",
  "Pizza Hut", "Domino's Pizza", "Papa John's", "Little Caesars",
  "MOD Pizza", "Blaze Pizza", "California Pizza Kitchen",
  "Pieology Pizzeria", "Portillo's", "Corner Bakery Cafe",
  "Au Bon Pain", "Einstein Bros. Bagels", "Bruegger's Bagels",
  "Tim Hortons", "Biggby Coffee", "Dutch Bros Coffee",
  "Caribou Coffee", "Peet's Coffee", "The Coffee Bean & Tea Leaf",
  "Smashburger", "Habit Burger Grill", "Freddy's Frozen Custard",
  "Steak 'n Shake", "Cook Out", "Culver's",
];
const UNIQUE_CHAINS = [...new Set(CHAINS)];

const RESTAURANT_REC_TOOLS = [{
  name: 'restaurant_recommendation',
  description: 'Structured restaurant meal recommendation matching user macro targets',
  input_schema: {
    type: 'object',
    properties: {
      best_order: {
        type: 'object',
        properties: {
          item:           { type: 'string' },
          customisation:  { type: 'string' },
          reason:         { type: 'string' },
          estimated_macros: {
            type: 'object',
            properties: {
              calories:  { type: 'number' },
              protein_g: { type: 'number' },
              carbs_g:   { type: 'number' },
              fat_g:     { type: 'number' },
              sodium_mg: { type: 'number' },
              sugar_g:   { type: 'number' },
            },
            required: ['calories','protein_g','carbs_g','fat_g','sodium_mg','sugar_g'],
          },
          protein_coverage_pct: { type: 'number' },
          warnings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nutrient: { type: 'string' },
                message:  { type: 'string' },
                fix:      { type: 'string' },
              },
              required: ['nutrient','message','fix'],
            },
          },
        },
        required: ['item','reason','estimated_macros','protein_coverage_pct','warnings'],
      },
      backup_options: { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, customisation: { type: 'string' }, reason: { type: 'string' } }, required: ['item','reason'] } },
      avoid:          { type: 'array', items: { type: 'object', properties: { item: { type: 'string' }, reason: { type: 'string' } }, required: ['item','reason'] } },
      coach_note: { type: 'string' },
    },
    required: ['best_order','backup_options','avoid','coach_note'],
  },
}];

function buildPrompt(name) {
  return `You are the Coach Macro nutrition AI. Recommend exactly what to order at ${name}.

MEAL CONTEXT:
- This is Meal 2 of 3 today
- Calorie target for THIS meal: 500 kcal
- Protein target: 40g
- Carb target: 55g
- Fat target: 18g
- Training goal: maintenance
- Trained today: false
- Session type: none

RESTAURANT: ${name}
Known chain — use exact menu knowledge and suggest specific modifications (e.g. "ask for half rice", "no cheese", "sauce on the side", "grilled not fried").

FLAG WARNINGS IF: Calories > 550 | Protein < 32g | Carbs > 60g | Fat > 20g | Sodium > 1000mg | Sugar > 20g
RULES: Optimise for protein first. Stay within 110% of all targets. Be specific with exact item names.`;
}

async function callAI(anthropicKey, name) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:       'claude-sonnet-4-6',
      max_tokens:  1200,
      tools:       RESTAURANT_REC_TOOLS,
      tool_choice: { type: 'tool', name: 'restaurant_recommendation' },
      messages:    [{ role: 'user', content: buildPrompt(name) }],
    }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(`Anthropic ${r.status}: ${e.error?.message || 'error'}`);
  }
  const d = await r.json();
  const toolUse = d.content?.find(b => b.type === 'tool_use');
  if (!toolUse?.input || Object.keys(toolUse.input).length === 0) throw new Error('no tool output');
  return toolUse.input;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).end(); return; }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const svcKey       = process.env.SUPABASE_SERVICE_KEY;
  if (!anthropicKey || !svcKey) {
    return res.status(500).json({ error: 'env vars missing' });
  }

  // ── Auth: bearer must match service key ───────────────────────────────────
  const bearer = req.headers.authorization?.replace('Bearer ', '').trim();
  if (bearer !== svcKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const from = Math.max(0, parseInt(req.body?.from ?? 0) || 0);
  const size = Math.min(20, Math.max(1, parseInt(req.body?.size ?? 20) || 20));
  const force = req.body?.force === true;

  const sb = createClient(SUPABASE_URL, svcKey);

  // Fetch already-cached keys to skip (unless force)
  let alreadyCached = new Set();
  if (!force) {
    const { data } = await sb.from('restaurant_menu_cache').select('restaurant_key');
    if (data) data.forEach(r => alreadyCached.add(r.restaurant_key));
  }

  const batch   = UNIQUE_CHAINS.slice(from, from + size);
  const results = [];

  for (const name of batch) {
    const key = name.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!force && alreadyCached.has(key)) {
      results.push({ name, status: 'skipped' });
      continue;
    }
    try {
      const data = await callAI(anthropicKey, name);
      const { error } = await sb.from('restaurant_menu_cache').upsert({
        restaurant_key:          key,
        restaurant_display_name: name,
        nutrition_data:          data,
        source:                  'seed',
        updated_at:              new Date().toISOString(),
      }, { onConflict: 'restaurant_key' });
      if (error) throw new Error(error.message);
      results.push({ name, status: 'seeded' });
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      results.push({ name, status: 'failed', error: e.message });
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const seeded  = results.filter(r => r.status === 'seeded').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed  = results.filter(r => r.status === 'failed');
  const next    = from + size;
  const total   = UNIQUE_CHAINS.length;

  res.status(200).json({
    from, size, seeded, skipped, failed: failed.length,
    failedChains: failed.map(r => r.name),
    nextBatch: next < total ? { from: next, size } : null,
    totalChains: total,
    done: next >= total,
    results,
  });
}
