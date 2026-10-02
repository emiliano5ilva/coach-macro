/**
 * seed-restaurant-cache.mjs
 *
 * ONE-TIME seed job: populates restaurant_menu_cache with AI-extracted
 * raw per-item menu data for ~100 popular US fast-food / fast-casual chains.
 *
 * Stores {items:[{name,calories,protein_g,carbs_g,fat_g}]} per restaurant.
 * Personalized recommendations are computed client-side from this raw data.
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
  "Bruegger's Bagels", "Tim Hortons",
  "Biggby Coffee", "Dutch Bros Coffee", "Caribou Coffee",
  "Peet's Coffee", "The Coffee Bean & Tea Leaf",
  "Gyro Wrap", "Halal Guys", "Smashburger",
  "Habit Burger", "Freddy's Frozen Custard",
  "Steak 'n Shake", "Cook Out",
];

const UNIQUE_CHAINS = [...new Set(CHAINS)];

const RESTAURANT_MENU_EXTRACT_TOOLS = [{
  name: 'restaurant_menu_data',
  description: 'Per-item menu nutrition data for a restaurant',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name:      { type: 'string' },
            calories:  { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g:   { type: 'number' },
            fat_g:     { type: 'number' },
          },
          required: ['name','calories','protein_g','carbs_g','fat_g'],
        },
      },
    },
    required: ['items'],
  },
}];

function buildPrompt(restaurantName) {
  return `List exactly 20 menu items for ${restaurantName} with estimated nutrition per standard serving.
Use published nutritional values for this known chain. Pick representative items across all main categories (entrées, sides, drinks if notable).
For each item provide: exact menu name, calories, protein (g), carbs (g), fat (g).`;
}

async function callAI(restaurantName) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:       'claude-sonnet-4-6',
      max_tokens:  2000,
      tools:       RESTAURANT_MENU_EXTRACT_TOOLS,
      tool_choice: { type: 'tool', name: 'restaurant_menu_data' },
      messages:    [{ role: 'user', content: buildPrompt(restaurantName) }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Anthropic ${response.status}: ${err.error?.message || 'unknown error'}`);
  }

  const d = await response.json();
  if (d.stop_reason === 'max_tokens') throw new Error('max_tokens truncation');

  const toolUse = d.content?.find(b => b.type === 'tool_use' && b.name === 'restaurant_menu_data');
  if (!toolUse?.input || !toolUse.input.items?.length) {
    throw new Error('No structured output returned');
  }
  return toolUse.input;
}

async function main() {
  console.log(`\n🍔 Restaurant Cache Seed (raw menu data) — ${UNIQUE_CHAINS.length} chains`);
  console.log(`   Mode: ${DRY_RUN ? 'DRY RUN' : FORCE ? 'FORCE (re-seed all)' : 'SMART (skip cached)'}\n`);

  if (DRY_RUN) {
    UNIQUE_CHAINS.forEach((c, i) => console.log(`  ${String(i+1).padStart(3)}. ${c}`));
    console.log('\nRun without --dry-run to seed.');
    return;
  }

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
      console.log(`✓ seeded (${nutritionData.items?.length || 0} items)`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      failed.push({ name, error: e.message });
      console.log(`✗ FAILED: ${e.message}`);
      await new Promise(r => setTimeout(r, 1000));
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
