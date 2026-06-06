/**
 * retag-allergens.mjs
 *
 * Re-compute allergen_tags for every global recipe (user_id IS NULL) in
 * Supabase using the FIXED findAllergens.  Only updates rows where the
 * tag set actually changes; reports the full blast radius.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=... node scripts/retag-allergens.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { findAllergens } from '../src/utils/allergenFilter.js';

const SUPABASE_URL = 'https://oxxihlwqukbakmnnavuy.supabase.co';
const SVC_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SVC_KEY) { console.error('ERROR: SUPABASE_SERVICE_KEY not set'); process.exit(1); }

const sb = createClient(SUPABASE_URL, SVC_KEY);

const ALL_ALLERGEN_CHIPS = ['No Dairy','No Gluten','No Pork','No Shellfish','No Eggs','No Nuts'];
const CHIP_TO_TAG = {
  'No Dairy':    'dairy',
  'No Gluten':   'gluten',
  'No Pork':     'pork',
  'No Shellfish':'shellfish',
  'No Eggs':     'eggs',
  'No Nuts':     'nuts',
};

function computeAllergenTags(ingredients) {
  // Join ingredient item names with newline so each ingredient is its own
  // fragment in the fixed findAllergens (comma-safe-phrase scoping).
  const allText = (ingredients || []).map(i => (typeof i === 'string' ? i : i?.item) || '').join('\n');
  const violated = findAllergens(allText, ALL_ALLERGEN_CHIPS);
  return violated.map(chip => CHIP_TO_TAG[chip]).filter(Boolean);
}

function tagSetEqual(a, b) {
  const sa = new Set(a || []);
  const sb2 = new Set(b || []);
  if (sa.size !== sb2.size) return false;
  for (const t of sa) if (!sb2.has(t)) return false;
  return true;
}

async function run() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('Re-tag allergens for all global recipes (fixed filter)');
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data: recipes, error } = await sb
    .from('recipes')
    .select('id, name, ingredients, allergen_tags')
    .is('user_id', null);

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }
  console.log(`Fetched ${recipes.length} global recipes.\n`);

  let updated = 0, unchanged = 0, errored = 0;
  const changed = [];

  for (const recipe of recipes) {
    const newTags = computeAllergenTags(recipe.ingredients);
    const oldTags = recipe.allergen_tags || [];

    if (tagSetEqual(newTags, oldTags)) { unchanged++; continue; }

    // Tags changed — record the diff
    const gained  = newTags.filter(t => !oldTags.includes(t));
    const lost    = oldTags.filter(t => !newTags.includes(t));
    changed.push({ name: recipe.name, old: oldTags, new: newTags, gained, lost });

    const { error: upErr } = await sb
      .from('recipes')
      .update({ allergen_tags: newTags })
      .eq('id', recipe.id);

    if (upErr) {
      console.error(`  ✗ ${recipe.name}: ${upErr.message}`);
      errored++;
    } else {
      updated++;
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Updated: ${updated}   Unchanged: ${unchanged}   Errors: ${errored}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (changed.length === 0) {
    console.log('No allergen_tags changed (library was already correct).\n');
    return;
  }

  console.log(`BLAST RADIUS — ${changed.length} recipe(s) whose allergen_tags changed:\n`);
  for (const c of changed) {
    const gainStr = c.gained.length ? `+[${c.gained.join(',')}]` : '';
    const lostStr = c.lost.length  ? `-[${c.lost.join(',')}]`  : '';
    console.log(`  ${c.name}`);
    console.log(`    before: [${c.old.join(', ')||'—'}]`);
    console.log(`    after:  [${c.new.join(', ')||'—'}]`);
    if (gainStr) console.log(`    GAINED: ${gainStr}`);
    if (lostStr)  console.log(`    LOST:   ${lostStr}`);
    console.log('');
  }
  console.log(`Total changed: ${changed.length} / ${recipes.length} recipes`);
}

run().catch(e => { console.error('\nFATAL:', e.message); process.exit(1); });
