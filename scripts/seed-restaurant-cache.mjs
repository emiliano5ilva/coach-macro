/**
 * seed-restaurant-cache.mjs
 *
 * ONE-TIME seed job: populates restaurant_menu_cache with AI-generated
 * recommendations for ~100 popular US fast-food / fast-casual chains.
 *
 * Calls Anthropic directly (no Vercel /api/claude hop) using the same
 * RESTAURANT_REC_TOOLS schema and prompt used by restaurantAiService.js,
 * with a generic "typical user" context so results are broadly useful.
 *
 * Required env vars (same .env that already has these):
 *   SUPABASE_SERVICE_KEY   — writes to restaurant_menu_cache
 *   ANTHROPIC_API_KEY      — calls claude-sonnet-4-6
 *
 * Usage:
 *   node scripts/seed-restaurant-cache.mjs
 *   node scripts/seed-restaurant-cache.mjs --dry-run   # print list only
 *   node scripts/seed-restaurant-cache.mjs --force     # re-seed already-cached rows
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://oxxihlwqukbakmnnavuy.supabase.co';
const SVC_KEY       = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SVC_KEY)       { console.error('ERROR: SUPABASE_SERVICE_KEY not set'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('ERROR: ANTHROPIC_API_KEY not set');    process.exit(1); }

const DRY_RUN = process.argv.includes('--dry-run');
const FORCE   = process.argv.includes('--force');

const sb = createClient(SUPABASE_URL, SVC_KEY);

// ── 100 popular US chains ─────────────────────────────────────────────────────
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
  "Freshii", "Cosi", "Saladworks", "Tender Loving Empire",
  "Bonefish Grill", "Carrabba's Italian Grill",
  "Maggiano's Little Italy", "Fogo de Chão", "Ruth's Chris Steak House",
  "The Capital Grille", "Bahama Breeze", "Yard House",
  "BJ's Restaurant", "Dave & Buster's", "TGI Fridays",
  "Ruby Tuesday", "Logan's Roadhouse", "Bob Evans",
  "Cracker Barrel", "Golden Corral", "Friendly's",
  "Pizza Hut", "Domino's Pizza", "Papa John's", "Little Caesars",
  "MOD Pizza", "Blaze Pizza", "California Pizza Kitchen",
  "Pieology Pizzeria", "Portillo's", "Giordano's",
  "Corner Bakery Cafe", "Au Bon Pain", "Einstein Bros. Bagels",
  "Bruegger's Bagels", "Panera Bread", "Tim Hortons",
  "Biggby Coffee", "Dutch Bros Coffee", "Caribou Coffee",
  "Peet's Coffee", "The Coffee Bean & Tea Leaf",
  "Gyro Wrap", "Halal Guys", "Shake Shack", "Smashburger",
  "Habit Burger", "Culver's", "Freddy's Frozen Custard",
  "Steak 'n Shake", "Cook Out", "Cookout",
];

// Deduplicate (a few duplicates crept in above for safety)
const UNIQUE_CHAINS = [...new Set(CHAINS)];

// ── Generic "typical user" context ───────────────────────────────────────────
// ~500 kcal / ~40g protein per meal, balanced goal — broadly useful for most users.
const GENERIC_CONTEXT = {
  goal: 'maintenance',
  dietary: [],
  currentMealSlot: 2,
  totalMeals: 3,
  currentMealCalorieTarget: 500,
  mealProteinTarget: 40,
  mealCarbTarget: 55,
  mealFatTarget: 18,
  trainedToday: false,
  sessionType: null,
  healthConditions: [],
  conditions: [],
  goalTimeline: null,
  fasting: null,
};

// ── Restaurant rec tool schema (mirrors restaurantAiService.js) ──────────────
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
      backup_options: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item:          { type: 'string' },
            customisation: { type: 'string' },
            reason:        { type: 'string' },
          },
          required: ['item','reason'],
        },
      },
      avoid: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item:   { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['item','reason'],
        },
      },
      coach_note: { type: 'string' },
    },
    required: ['best_order','backup_options','avoid','coach_note'],
  },
}];

function buildPrompt(restaurantName) {
  const { goal, dietary, currentMealSlot, totalMeals,
    currentMealCalorieTarget, mealProteinTarget, mealCarbTarget, mealFatTarget } = GENERIC_CONTEXT;

  return `You are the Coach Macro nutrition AI. Recommend exactly what to order at ${restaurantName}.

MEAL CONTEXT:
- This is Meal ${currentMealSlot} of ${totalMeals} today
- Calorie target for THIS meal: ${currentMealCalorieTarget} kcal
- Protein target: ${mealProteinTarget}g
- Carb target: ${mealCarbTarget}g
- Fat target: ${mealFatTarget}g
- Training goal: ${goal}
- Trained today: false
- Session type: none

RESTAURANT: ${restaurantName}
Known chain — use exact menu knowledge and suggest specific modifications (e.g. "ask for half rice", "no cheese", "sauce on the side", "grilled not fried").

FLAG WARNINGS IF:
- Calories > ${Math.round(currentMealCalorieTarget * 1.1)} (110% of meal target)
- Protein < ${Math.round(mealProteinTarget * 0.8)}g (below 80% of target)
- Carbs > ${Math.round(mealCarbTarget * 1.1)}g (110% of target)
- Fat > ${Math.round(mealFatTarget * 1.1)}g (110% of target)
- Sodium > 1000mg
- Sugar > 20g

RULES: Optimise for protein first. Stay within 110% of all targets. Never recommend alcohol. Be specific with exact item names.`;
}

async function callAI(restaurantName) {
  const prompt = buildPrompt(restaurantName);
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:       'claude-sonnet-4-6',
      max_tokens:  1200,
      tools:       RESTAURANT_REC_TOOLS,
      tool_choice: { type: 'tool', name: 'restaurant_recommendation' },
      messages:    [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic ${response.status}: ${err.error?.message || 'unknown error'}`);
  }

  const d = await response.json();
  if (d.stop_reason === 'max_tokens') throw new Error('max_tokens truncation');

  const toolUse = d.content?.find(b => b.type === 'tool_use' && b.name === 'restaurant_recommendation');
  if (!toolUse?.input || Object.keys(toolUse.input).length === 0) {
    throw new Error('No structured output returned');
  }
  return toolUse.input;
}

async function main() {
  console.log(`\n🍔 Restaurant Cache Seed — ${UNIQUE_CHAINS.length} chains`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : FORCE ? 'FORCE (re-seed all)' : 'SMART (skip cached)'}\n`);

  if (DRY_RUN) {
    UNIQUE_CHAINS.forEach((c, i) => console.log(`  ${String(i+1).padStart(3)}. ${c}`));
    console.log('\nRun without --dry-run to seed.');
    return;
  }

  // Fetch already-cached keys so we can skip them (unless --force)
  let alreadyCached = new Set();
  if (!FORCE) {
    const { data } = await sb
      .from('restaurant_menu_cache')
      .select('restaurant_key')
      .eq('source', 'seed');
    if (data) data.forEach(r => alreadyCached.add(r.restaurant_key));
    console.log(`  ${alreadyCached.size} already seeded — skipping those.\n`);
  }

  const todo   = UNIQUE_CHAINS.filter(n => FORCE || !alreadyCached.has(n.toLowerCase().trim().replace(/\s+/g, ' ')));
  let seeded   = 0;
  let failed   = [];

  console.log(`  Seeding ${todo.length} chains…\n`);

  for (const name of todo) {
    const key = name.toLowerCase().trim().replace(/\s+/g, ' ');
    process.stdout.write(`  ${name.padEnd(42)} → `);
    try {
      const nutritionData = await callAI(name);
      const { error } = await sb.from('restaurant_menu_cache').upsert({
        restaurant_key:          key,
        restaurant_display_name: name,
        nutrition_data:          nutritionData,
        source:                  'seed',
        updated_at:              new Date().toISOString(),
      }, { onConflict: 'restaurant_key' });
      if (error) throw new Error(error.message);
      seeded++;
      console.log('✓ seeded');
      // Polite rate limit: ~2 req/s stays well within Anthropic's tier limits
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      failed.push({ name, error: e.message });
      console.log(`✗ FAILED: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000)); // back off on error
    }
  }

  console.log('\n────────────────────────────────────────────────');
  console.log(`  ✓ Seeded:  ${seeded}`);
  console.log(`  ✗ Failed:  ${failed.length}`);
  if (failed.length) {
    console.log('\n  Failed chains (retry with --force after fixing):');
    failed.forEach(f => console.log(`    - ${f.name}: ${f.error}`));
  }
  console.log('────────────────────────────────────────────────\n');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
