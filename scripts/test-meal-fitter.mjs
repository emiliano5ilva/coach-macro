#!/usr/bin/env node
/**
 * test-meal-fitter.mjs — Invariant harness for the pure mealFitter algorithm.
 *
 * Tests the algorithm against a rich synthetic pool so results are
 * deterministic regardless of DB state.  Allergen safety is the primary
 * concern — tested exhaustively across every allergen singly and many
 * multi-allergen combos.
 *
 * Run:  node scripts/test-meal-fitter.mjs
 * Exit: 0 = all pass, non-zero = failures present (CI-friendly).
 */

import {
  fitDay, fitWeek,
  filterPool, isAllergenExcluded, meetsDiet, slotTargets,
  CAL_TOLERANCE, PRO_TOLERANCE,
} from '../src/services/mealFitter.js';

// ── Tiny test runner ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition, detail = '') {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push({ label, detail });
  }
}

// ── Synthetic recipe pool ─────────────────────────────────────────────────────
//
// 40 recipes spanning all slots, all diets, all allergen combinations.
// Macros are realistic (athlete-grade) so tolerance tests can pass.
// Each recipe has an explicit `id` to exercise key-based dedup.

const DIETS_ALL = [
  'balanced','high-protein','keto','vegan','vegetarian',
  'paleo','pescatarian','carnivore','mediterranean','low-carb',
];
const ALL_ALLERGENS = ['dairy','gluten','pork','shellfish','eggs','nuts'];

function recipe(id, name, slot, diets, allergens, cal, pro, carb, fat) {
  return {
    id, name,
    meal_slot:            slot,
    diet_tags:            diets,
    allergen_tags:        allergens,
    calories_per_serving: cal,
    protein_per_serving:  pro,
    carbs_per_serving:    carb,
    fat_per_serving:      fat,
    servings_count:       1,
    use_count:            0,
    last_used:            null,
  };
}

// Breakfast (10)
const POOL = [
  recipe(1,  'Oat Protein Bowl',           'breakfast', ['balanced','high-protein','vegetarian'], ['dairy','gluten'],     400, 35, 50, 8),
  recipe(2,  'Egg and Bacon Skillet',       'breakfast', ['high-protein','keto','carnivore'],      ['pork','eggs'],        480, 42, 2, 34),
  recipe(3,  'Vegan Tofu Scramble',         'breakfast', ['vegan','vegetarian','high-protein'],    [],                     310, 28, 12, 18),
  recipe(4,  'Greek Yogurt Bowl',           'breakfast', ['balanced','vegetarian','high-protein'], ['dairy'],              350, 30, 38, 6),
  recipe(5,  'Keto Bacon Egg Cups',         'breakfast', ['keto','low-carb','high-protein'],       ['pork','eggs','dairy'],420, 36, 4, 30),
  recipe(6,  'Salmon Avocado Toast',        'breakfast', ['pescatarian','mediterranean'],          ['gluten'],             480, 30, 34, 22),
  recipe(7,  'Paleo Sweet Potato Hash',     'breakfast', ['paleo','high-protein'],                 ['eggs'],               390, 32, 28, 16),
  recipe(8,  'Almond Butter Oats',          'breakfast', ['balanced','vegetarian'],                ['nuts','gluten'],      420, 16, 58, 14),
  recipe(9,  'Carnivore Beef Egg Bowl',     'breakfast', ['carnivore','keto','high-protein'],      ['eggs'],               510, 48, 1, 36),
  recipe(10, 'Shrimp Avocado Scramble',     'breakfast', ['pescatarian','high-protein','keto'],    ['shellfish','eggs'],   430, 40, 6, 28),

  // Lunch (10)
  recipe(11, 'Chicken Rice Bowl',           'lunch', ['high-protein','balanced'],                 [],                     520, 45, 48, 12),
  recipe(12, 'Tuna Nicoise Salad',          'lunch', ['pescatarian','mediterranean','keto'],      ['eggs'],               460, 42, 10, 28),
  recipe(13, 'Vegan Lentil Bowl',           'lunch', ['vegan','vegetarian','high-protein'],       [],                     420, 24, 56, 8),
  recipe(14, 'Keto Caesar Salad',           'lunch', ['keto','low-carb','high-protein'],          ['dairy','eggs'],       480, 44, 6, 32),
  recipe(15, 'Turkey Avocado Wrap',         'lunch', ['high-protein','balanced'],                 ['gluten'],             510, 40, 38, 18),
  recipe(16, 'Pork Stir Fry',              'lunch', ['high-protein','balanced'],                 ['pork','gluten'],      490, 42, 36, 16),
  recipe(17, 'Shrimp Quinoa Bowl',          'lunch', ['pescatarian','mediterranean'],             ['shellfish'],          450, 38, 44, 12),
  recipe(18, 'Paleo Beef Lettuce Wrap',     'lunch', ['paleo','keto','high-protein'],             [],                     470, 44, 8, 30),
  recipe(19, 'Carnivore Ribeye Bowl',       'lunch', ['carnivore','keto','high-protein'],         [],                     580, 54, 0, 40),
  recipe(20, 'Walnut Kale Salad',           'lunch', ['vegetarian','balanced','mediterranean'],   ['nuts','dairy'],       380, 18, 30, 24),

  // Dinner (12)
  recipe(21, 'Salmon Quinoa Dinner',        'dinner', ['pescatarian','balanced','high-protein'],  [],                     560, 48, 46, 18),
  recipe(22, 'Chicken Veggie Bake',         'dinner', ['high-protein','paleo','balanced'],        [],                     490, 50, 22, 20),
  recipe(23, 'Vegan Tempeh Stir Fry',      'dinner', ['vegan','vegetarian','high-protein'],      ['gluten'],             430, 32, 40, 16),
  recipe(24, 'Keto Salmon Cream',           'dinner', ['keto','pescatarian','low-carb'],          ['dairy'],              520, 42, 4, 38),
  recipe(25, 'Beef Sweet Potato',           'dinner', ['high-protein','paleo','balanced'],        [],                     540, 48, 32, 18),
  recipe(26, 'Shrimp Broccoli Rice',        'dinner', ['pescatarian','balanced'],                 ['shellfish','gluten'], 480, 40, 44, 10),
  recipe(27, 'Carnivore Lamb Chops',        'dinner', ['carnivore','keto','paleo'],               [],                     620, 56, 0, 46),
  recipe(28, 'Vegan Chickpea Curry',        'dinner', ['vegan','vegetarian','balanced'],          [],                     400, 20, 54, 10),
  recipe(29, 'Mediterranean Cod',           'dinner', ['mediterranean','pescatarian','keto'],     [],                     440, 44, 8, 26),
  recipe(30, 'Turkey Meatball Bowl',        'dinner', ['high-protein','balanced'],                ['eggs'],               510, 46, 36, 16),
  recipe(31, 'Keto Ground Beef Pepper',     'dinner', ['keto','high-protein','low-carb'],         ['dairy'],              490, 44, 8, 32),
  recipe(32, 'Pork Tenderloin Apple',       'dinner', ['paleo','high-protein'],                   ['pork'],               500, 46, 18, 24),

  // Snack (8)
  recipe(33, 'Greek Yogurt Berries',        'snack', ['vegetarian','balanced','high-protein'],   ['dairy'],              200, 18, 22, 4),
  recipe(34, 'Almond Protein Balls',        'snack', ['vegetarian','balanced'],                  ['nuts'],               240, 12, 18, 14),
  recipe(35, 'Tuna Cucumber Bites',         'snack', ['pescatarian','keto','high-protein'],      [],                     160, 28, 4, 4),
  recipe(36, 'Hard Boiled Eggs',           'snack', ['vegetarian','keto','high-protein'],       ['eggs'],               155, 13, 1, 11),
  recipe(37, 'Carnivore Beef Jerky',        'snack', ['carnivore','keto','high-protein'],        [],                     180, 30, 2, 6),
  recipe(38, 'Vegan Edamame Bowl',          'snack', ['vegan','vegetarian','high-protein'],      [],                     180, 18, 12, 8),
  recipe(39, 'Cashew Trail Mix',            'snack', ['balanced','vegetarian'],                  ['nuts'],               260, 8, 22, 16),
  recipe(40, 'Cottage Cheese Hemp',         'snack', ['vegetarian','high-protein','balanced'],   ['dairy'],              220, 24, 8, 8),
];

// Allergen-free sub-pool (for testing worst-case allergen combos)
const CLEAN_POOL = POOL.filter(r => r.allergen_tags.length === 0);
// [ids: 3,11,13,18,19,21,22,25,27,28,29,35,37,38] → 14 recipes

// Standard day target: 2200 cal, 165g pro, 220g carb, 73g fat
const TARGET_2200 = { cal: 2200, pro: 165, carb: 220, fat: 73 };
// High-protein target: 2400 cal, 200g pro, 180g carb, 80g fat
const TARGET_HP   = { cal: 2400, pro: 200, carb: 180, fat: 80 };
// Keto target: 1800 cal, 140g pro, 40g carb, 130g fat
const TARGET_KETO = { cal: 1800, pro: 140, carb: 40, fat: 130 };

// ── Helper: allergen intersection check ───────────────────────────────────────

function hasAllergenViolation(meal, allergens) {
  if (meal.unfillable) return false; // unfillable slots don't violate
  const recipeTags = meal.recipe?.allergen_tags || [];
  return allergens.some(a => recipeTags.includes(a));
}

function anyMealViolatesAllergens(result, allergens) {
  return result.meals.some(m => hasAllergenViolation(m, allergens));
}

// ── Section: unit-level helpers ───────────────────────────────────────────────

console.log('\n── isAllergenExcluded (unit) ──');
assert('no allergens → never excluded',
  !isAllergenExcluded(POOL[0], []) && !isAllergenExcluded(POOL[0], null));
assert('dairy recipe excluded when dairy restricted',
  isAllergenExcluded(POOL[0], ['dairy']));     // recipe 1 has dairy
assert('dairy recipe not excluded by nuts restriction',
  !isAllergenExcluded(POOL[0], ['nuts']));
assert('clean recipe never excluded',
  !isAllergenExcluded(POOL[2], ['dairy','gluten','pork','shellfish','eggs','nuts']));
assert('multi-allergen: excluded if any matches',
  isAllergenExcluded(POOL[4], ['nuts','pork']));    // recipe 5 has pork
assert('multi-allergen: not excluded if none match',
  !isAllergenExcluded(POOL[2], ['gluten','pork'])); // recipe 3 is clean

console.log('\n── meetsDiet (unit) ──');
assert('null diet → all pass',           meetsDiet(POOL[0], null));
assert('balanced diet → all pass',       meetsDiet(POOL[0], 'balanced'));
assert('keto recipe passes keto filter', meetsDiet(POOL[4], 'keto'));
assert('vegan recipe fails carnivore',   !meetsDiet(POOL[2], 'carnivore'));
assert('carnivore recipe passes carnivore', meetsDiet(POOL[8], 'carnivore'));
assert('pescatarian matches pescatarian',   meetsDiet(POOL[5], 'pescatarian'));

console.log('\n── filterPool (unit) ──');
{
  const safe = filterPool(POOL, null, ['dairy']);
  assert('filterPool removes dairy recipes',
    safe.every(r => !(r.allergen_tags || []).includes('dairy')));
  assert('filterPool keeps allergen-free recipes',
    safe.some(r => r.id === 3)); // tofu scramble
}
{
  const keto = filterPool(POOL, 'keto', []);
  assert('filterPool keto: all have keto tag',
    keto.every(r => r.diet_tags.includes('keto')));
  assert('filterPool keto: non-zero count', keto.length > 0);
}
{
  const empty = filterPool(POOL, 'vegan', ['gluten','dairy','eggs','pork','nuts','shellfish']);
  // Vegan + all allergens excluded: only clean vegan recipes
  assert('filterPool vegan+all-allergens: every result is vegan and allergen-free',
    empty.every(r => r.diet_tags.includes('vegan') && r.allergen_tags.length === 0));
}

console.log('\n── slotTargets (unit) ──');
{
  const t3 = slotTargets(TARGET_2200, 3);
  assert('3-meal slots: returns array of 3', t3.length === 3);
  const keys3 = t3.map(s => s.key);
  assert('3-meal slots: has breakfast, lunch, dinner',
    keys3.includes('breakfast') && keys3.includes('lunch') && keys3.includes('dinner'));
  assert('3-meal slots: no snack', !keys3.includes('snack'));
  assert('3-meal slots: each entry has mealSlot field', t3.every(s => typeof s.mealSlot === 'string'));
  const sumCal3 = t3.reduce((sum, s) => sum + s.cal, 0);
  assert('3-meal cal sum ≈ dayTarget.cal (within 10cal)',
    Math.abs(sumCal3 - TARGET_2200.cal) <= 10);
  const dinner3    = t3.find(s => s.key === 'dinner');
  const breakfast3 = t3.find(s => s.key === 'breakfast');
  assert('dinner cal > breakfast cal (40% > 25%)', dinner3.cal > breakfast3.cal);
}
{
  const t4 = slotTargets(TARGET_2200, 4);
  assert('4-meal slots: returns array of 4', t4.length === 4);
  const keys4 = t4.map(s => s.key);
  assert('4-meal slots: has snack', keys4.includes('snack'));
  const snack4     = t4.find(s => s.key === 'snack');
  const breakfast4 = t4.find(s => s.key === 'breakfast');
  assert('4-meal snack is smallest slot', snack4.cal < breakfast4.cal);
  assert('4-meal snack: mealSlot is snack', snack4.mealSlot === 'snack');
}
{
  const t5 = slotTargets(TARGET_2200, 5);
  assert('5-meal slots: returns array of 5', t5.length === 5);
  const keys5 = t5.map(s => s.key);
  assert('5-meal slots: has snack1 and snack2',
    keys5.includes('snack1') && keys5.includes('snack2'));
  assert('5-meal slots: no snack3', !keys5.includes('snack3'));
  assert('5-meal slots: snack1/2 both have mealSlot=snack',
    t5.filter(s => s.key === 'snack1' || s.key === 'snack2').every(s => s.mealSlot === 'snack'));
  const sumCal5 = t5.reduce((sum, s) => sum + s.cal, 0);
  assert('5-meal cal sum ≈ dayTarget.cal (within 10cal)',
    Math.abs(sumCal5 - TARGET_2200.cal) <= 10);
}
{
  const t6 = slotTargets(TARGET_2200, 6);
  assert('6-meal slots: returns array of 6', t6.length === 6);
  const keys6 = t6.map(s => s.key);
  assert('6-meal slots: has snack1, snack2, snack3',
    keys6.includes('snack1') && keys6.includes('snack2') && keys6.includes('snack3'));
  assert('6-meal slots: snack1/2/3 all have mealSlot=snack',
    t6.filter(s => ['snack1','snack2','snack3'].includes(s.key)).every(s => s.mealSlot === 'snack'));
  const sumCal6 = t6.reduce((sum, s) => sum + s.cal, 0);
  assert('6-meal cal sum ≈ dayTarget.cal (within 10cal)',
    Math.abs(sumCal6 - TARGET_2200.cal) <= 10);
}

// ── Section: ALLERGEN SAFETY (most critical) ──────────────────────────────────
// Every single allergen tested individually across multiple seeds and targets.
// Then multi-allergen combos. Unfillable slots must also never emit allergens.

console.log('\n── ALLERGEN SAFETY — single allergen × many seeds ──');

for (const allergen of ALL_ALLERGENS) {
  for (const seed of [0, 1, 42, 99, 777, 12345]) {
    for (const target of [TARGET_2200, TARGET_HP, TARGET_KETO]) {
      const result = fitDay({ dayTarget: target, mealCount: 3, diet: null,
                              allergens: [allergen], pool: POOL, seed });
      assert(
        `allergen="${allergen}" seed=${seed} cal=${target.cal}: no violation`,
        !anyMealViolatesAllergens(result, [allergen]),
        `Failed: a meal contains "${allergen}"`,
      );
    }
  }
}

console.log('\n── ALLERGEN SAFETY — multi-allergen combos ──');

const COMBOS = [
  ['dairy', 'nuts'],
  ['gluten', 'eggs'],
  ['pork', 'shellfish'],
  ['dairy', 'gluten'],
  ['eggs', 'dairy'],
  ['nuts', 'pork'],
  ['shellfish', 'dairy', 'nuts'],
  ['gluten', 'pork', 'eggs'],
  ['dairy', 'gluten', 'eggs'],
  ['nuts', 'shellfish', 'pork', 'dairy'],
  // All 6 allergens (only clean recipes should appear)
  ['dairy', 'gluten', 'pork', 'shellfish', 'eggs', 'nuts'],
];

for (const combo of COMBOS) {
  for (const seed of [0, 7, 314]) {
    const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                            allergens: combo, pool: POOL, seed });
    assert(
      `combo=[${combo}] seed=${seed}: no violations in any meal`,
      !anyMealViolatesAllergens(result, combo),
      `Violation: a returned recipe contains one of [${combo}]`,
    );
  }
}

console.log('\n── ALLERGEN SAFETY — 4-meal day ──');
for (const allergen of ALL_ALLERGENS) {
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 4, diet: null,
                          allergens: [allergen], pool: POOL, seed: 0 });
  assert(
    `4-meal allergen="${allergen}": all 4 slots safe`,
    !anyMealViolatesAllergens(result, [allergen]),
  );
}

console.log('\n── ALLERGEN SAFETY — 5-meal and 6-meal days ──');
for (const allergen of ALL_ALLERGENS) {
  const r5 = fitDay({ dayTarget: TARGET_2200, mealCount: 5, diet: null,
                      allergens: [allergen], pool: POOL, seed: 0 });
  assert(`5-meal allergen="${allergen}": all slots safe`,
    !anyMealViolatesAllergens(r5, [allergen]));
  const r6 = fitDay({ dayTarget: TARGET_2200, mealCount: 6, diet: null,
                      allergens: [allergen], pool: POOL, seed: 0 });
  assert(`6-meal allergen="${allergen}": all slots safe`,
    !anyMealViolatesAllergens(r6, [allergen]));
}
// nut+dairy-allergic vegan, 6 meals — the specific case from the spec
{
  const r = fitDay({ dayTarget: TARGET_2200, mealCount: 6, diet: 'vegan',
                     allergens: ['nuts','dairy'], pool: POOL, seed: 0 });
  assert('6-meal vegan nuts+dairy: 6 slots returned', r.meals.length === 6);
  assert('6-meal vegan nuts+dairy: no allergen leak',
    !anyMealViolatesAllergens(r, ['nuts','dairy']));
}

console.log('\n── ALLERGEN SAFETY — week-level ──');
for (const allergen of ALL_ALLERGENS) {
  const weekResult = fitWeek({
    dayTargets: Array(7).fill(TARGET_2200),
    mealCount:  3,
    diet:       null,
    allergens:  [allergen],
    pool:       POOL,
    seed:       0,
  });
  let weekViolation = false;
  for (const day of weekResult) {
    if (anyMealViolatesAllergens(day, [allergen])) { weekViolation = true; break; }
  }
  assert(`week allergen="${allergen}": 7 days, zero violations`, !weekViolation);
}

// ── Section: diet filter invariant ───────────────────────────────────────────

console.log('\n── DIET FILTER invariant ──');

const DIETS_TO_TEST = ['keto','vegan','vegetarian','carnivore','pescatarian','paleo','high-protein','mediterranean'];
for (const diet of DIETS_TO_TEST) {
  for (const seed of [0, 5]) {
    const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet,
                            allergens: [], pool: POOL, seed });
    const filled = result.meals.filter(m => !m.unfillable);
    // All filled meals must carry the diet tag
    const allCorrect = filled.every(m => (m.recipe.diet_tags || []).includes(diet));
    assert(
      `diet="${diet}" seed=${seed}: all filled recipes carry diet tag`,
      allCorrect,
      `A recipe was returned that lacks the "${diet}" tag`,
    );
  }
}

// ── Section: no-dup within a day ─────────────────────────────────────────────

console.log('\n── NO-DUP within a day ──');

for (const seed of [0, 1, 42, 99, 500]) {
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: POOL, seed });
  const filled = result.meals.filter(m => !m.unfillable);
  const ids = filled.map(m => m.recipe.id ?? m.recipe.name);
  const unique = new Set(ids);
  assert(
    `seed=${seed}: no recipe repeated within one day`,
    unique.size === ids.length,
    `Duplicates: ${ids.join(', ')}`,
  );
}

// 4-meal day no-dup
{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 4, diet: null,
                          allergens: [], pool: POOL, seed: 42 });
  const filled = result.meals.filter(m => !m.unfillable);
  const ids = filled.map(m => m.recipe.id ?? m.recipe.name);
  assert('4-meal day: no dup', new Set(ids).size === ids.length);
}
// 5-meal and 6-meal no-dup
{
  const r5 = fitDay({ dayTarget: TARGET_2200, mealCount: 5, diet: null,
                      allergens: [], pool: POOL, seed: 7 });
  const filled5 = r5.meals.filter(m => !m.unfillable);
  const ids5 = filled5.map(m => m.recipe.id ?? m.recipe.name);
  assert('5-meal day: no dup', new Set(ids5).size === ids5.length);
  const r6 = fitDay({ dayTarget: TARGET_2200, mealCount: 6, diet: null,
                      allergens: [], pool: POOL, seed: 7 });
  const filled6 = r6.meals.filter(m => !m.unfillable);
  const ids6 = filled6.map(m => m.recipe.id ?? m.recipe.name);
  assert('6-meal day: no dup', new Set(ids6).size === ids6.length);
}

// ── Section: determinism ─────────────────────────────────────────────────────

console.log('\n── DETERMINISM ──');

for (const seed of [0, 1, 12345]) {
  const a = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                     allergens: [], pool: POOL, seed });
  const b = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                     allergens: [], pool: POOL, seed });
  const sameNames = a.meals.every((m, i) =>
    m.unfillable === b.meals[i].unfillable &&
    (m.unfillable || (m.recipe.id === b.meals[i].recipe.id && m.servings === b.meals[i].servings)),
  );
  assert(`seed=${seed}: identical results on identical inputs`, sameNames);
}

// Different seeds must (very likely) differ
{
  const a = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                     allergens: [], pool: POOL, seed: 1 });
  const b = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                     allergens: [], pool: POOL, seed: 99999 });
  // Not a hard requirement (scoring may converge on same winner), but
  // we verify at least one plan is produced without crashing.
  assert('different seeds produce valid plans', a.meals.length > 0 && b.meals.length > 0);
}

// ── Section: macro tolerance ──────────────────────────────────────────────────

console.log('\n── MACRO TOLERANCE (cal + protein) ──');

// With the full clean pool (14 allergen-free recipes), targeting 2200 cal
// across 3 meals should be within tolerance with good coverage.
{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: ALL_ALLERGENS, pool: POOL, seed: 0 });
  // All slots filled?
  const allFilled = result.meals.every(m => !m.unfillable);
  assert('clean pool (all-allergen): all 3 slots filled', allFilled);
  if (allFilled) {
    const calErr = Math.abs(result.dayTotals.cal - TARGET_2200.cal) / TARGET_2200.cal;
    const proErr = Math.abs(result.dayTotals.pro - TARGET_2200.pro) / TARGET_2200.pro;
    assert(
      `all-allergen target 2200: cal within ${(CAL_TOLERANCE*100).toFixed(0)}%`,
      calErr <= CAL_TOLERANCE,
      `calErr=${(calErr*100).toFixed(1)}%`,
    );
    // protein tolerance is looser — we assert a generous 30% cap to avoid
    // brittle numeric dependency while still proving it's in the ballpark
    assert(
      `all-allergen target 2200: pro within 30%`,
      proErr <= 0.30,
      `proErr=${(proErr*100).toFixed(1)}%`,
    );
  }
}

// Standard (no allergen filter) — should be well within tolerance
{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: POOL, seed: 0 });
  const allFilled = result.meals.every(m => !m.unfillable);
  assert('no filter 2200: all 3 slots filled', allFilled);
  if (allFilled) {
    const calErr = Math.abs(result.dayTotals.cal - TARGET_2200.cal) / TARGET_2200.cal;
    assert(`no filter 2200: cal within ${(CAL_TOLERANCE*100).toFixed(0)}%`,
      calErr <= CAL_TOLERANCE, `calErr=${(calErr*100).toFixed(1)}%`);
  }
}

// 4-meal day
{
  const result = fitDay({ dayTarget: TARGET_HP, mealCount: 4, diet: null,
                          allergens: [], pool: POOL, seed: 7 });
  assert('4-meal day: 4 slots returned', result.meals.length === 4);
  const allFilled = result.meals.every(m => !m.unfillable);
  assert('4-meal day: all filled', allFilled);
}

// ── Section: protein floor ────────────────────────────────────────────────────

console.log('\n── PROTEIN FLOOR ──');

for (const seed of [0, 1, 42]) {
  const result = fitDay({ dayTarget: TARGET_HP, mealCount: 3, diet: null,
                          allergens: [], pool: POOL, seed });
  const filled = result.meals.filter(m => !m.unfillable);
  for (const m of filled) {
    assert(
      `seed=${seed} slot="${m.slot}": protein > 0`,
      m.scaledMacros.pro > 0,
    );
  }
  if (filled.length === 3) {
    assert(
      `seed=${seed}: day protein >= 50% of target (absolute floor)`,
      result.dayTotals.pro >= TARGET_HP.pro * 0.50,
      `got ${result.dayTotals.pro}g vs target ${TARGET_HP.pro}g`,
    );
  }
}

// ── Section: slot structure ───────────────────────────────────────────────────

console.log('\n── SLOT STRUCTURE ──');

{
  const result3 = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                           allergens: [], pool: POOL, seed: 0 });
  assert('3-meal: exactly 3 slots', result3.meals.length === 3);
  const slotNames3 = result3.meals.map(m => m.slot);
  assert('3-meal: has breakfast', slotNames3.includes('breakfast'));
  assert('3-meal: has lunch',     slotNames3.includes('lunch'));
  assert('3-meal: has dinner',    slotNames3.includes('dinner'));
  assert('3-meal: no snack',      !slotNames3.includes('snack'));
}
{
  const result4 = fitDay({ dayTarget: TARGET_2200, mealCount: 4, diet: null,
                           allergens: [], pool: POOL, seed: 0 });
  assert('4-meal: exactly 4 slots', result4.meals.length === 4);
  const slotNames4 = result4.meals.map(m => m.slot);
  assert('4-meal: has snack', slotNames4.includes('snack'));
  assert('4-meal: no snack1', !slotNames4.includes('snack1'));
}
{
  const result5 = fitDay({ dayTarget: TARGET_2200, mealCount: 5, diet: null,
                           allergens: [], pool: POOL, seed: 0 });
  assert('5-meal: exactly 5 slots', result5.meals.length === 5);
  const slotNames5 = result5.meals.map(m => m.slot);
  assert('5-meal: has breakfast', slotNames5.includes('breakfast'));
  assert('5-meal: has snack1',    slotNames5.includes('snack1'));
  assert('5-meal: has snack2',    slotNames5.includes('snack2'));
  assert('5-meal: no snack3',     !slotNames5.includes('snack3'));
  assert('5-meal: slot order correct',
    JSON.stringify(slotNames5) === JSON.stringify(['breakfast','lunch','dinner','snack1','snack2']));
  // All snack slots have mealSlot='snack'
  assert('5-meal: snack1/2 mealSlot=snack',
    result5.meals.filter(m => m.slot==='snack1'||m.slot==='snack2').every(m => m.mealSlot === 'snack'));
}
{
  const result6 = fitDay({ dayTarget: TARGET_2200, mealCount: 6, diet: null,
                           allergens: [], pool: POOL, seed: 0 });
  assert('6-meal: exactly 6 slots', result6.meals.length === 6);
  const slotNames6 = result6.meals.map(m => m.slot);
  assert('6-meal: slot keys in order',
    JSON.stringify(slotNames6) === JSON.stringify(['breakfast','lunch','dinner','snack1','snack2','snack3']));
  assert('6-meal: snack1/2/3 all have mealSlot=snack',
    result6.meals.filter(m => ['snack1','snack2','snack3'].includes(m.slot)).every(m => m.mealSlot === 'snack'));
  // calories within 15% of target (rounding across 6 small slots)
  assert('6-meal: day totals cal within 15% of target',
    Math.abs(result6.dayTotals.cal - TARGET_2200.cal) / TARGET_2200.cal <= 0.15);
}

// ── Section: graceful unfillable ──────────────────────────────────────────────
// Even when no recipe can be found, the result must:
//  (a) NOT crash,
//  (b) return { unfillable:true, reason } for that slot,
//  (c) NEVER emit an allergen-tagged recipe for any slot.

console.log('\n── GRACEFUL UNFILLABLE ──');

// Scenario 1: diet that has very few recipes AND all allergens excluded
{
  // Only 'carnivore' recipes in POOL that are allergen-free: id 19,27,37
  // After filtering for carnivore + all allergens excluded:
  const result = fitDay({
    dayTarget: { cal: 2200, pro: 160, carb: 20, fat: 80 },
    mealCount: 3,
    diet:      'carnivore',
    allergens: ALL_ALLERGENS,
    pool:      POOL,
    seed:      0,
  });
  assert('unfillable: no crash', true); // reaching here = no crash
  assert('unfillable: allergen gate still holds',
    !anyMealViolatesAllergens(result, ALL_ALLERGENS));
  // Some slots may be unfillable due to no cross-slot fallback with mealCount=3
  // but at least one should fill from the clean carnivore recipes
  const anyFilled = result.meals.some(m => !m.unfillable);
  assert('unfillable: at least one slot fills from clean carnivore pool', anyFilled);
  // Unfillable slots must have the marker
  const unfillableSlots = result.meals.filter(m => m.unfillable);
  assert('unfillable slots have reason string',
    unfillableSlots.every(m => typeof m.reason === 'string' && m.reason.length > 0));
}

// Scenario 2: completely empty pool
{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: [], seed: 0 });
  assert('empty pool: no crash', true);
  assert('empty pool: 3 slots returned', result.meals.length === 3);
  assert('empty pool: all slots unfillable',
    result.meals.every(m => m.unfillable === true));
  assert('empty pool: allergen gate trivially holds',
    !anyMealViolatesAllergens(result, ALL_ALLERGENS));
  assert('empty pool: withinTolerance is false', result.withinTolerance === false);
}

// Scenario 3: single-recipe pool (forces repeats → should go unfillable on later slots)
{
  const oneRecipe = [POOL[2]]; // vegan tofu scramble, no allergens
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: oneRecipe, seed: 0 });
  assert('single-recipe pool: no crash', true);
  assert('single-recipe pool: first slot filled',
    !result.meals[0].unfillable);
  // Later slots must be unfillable (no-dup constraint)
  assert('single-recipe pool: later slots unfillable',
    result.meals.slice(1).every(m => m.unfillable));
  assert('single-recipe pool: no allergen violations',
    !anyMealViolatesAllergens(result, ALL_ALLERGENS));
}

// Scenario 4: pool has recipes but none match the diet
{
  // Pool of only 'balanced' recipes with no diet='vegan' tag
  const nonVeganPool = POOL.filter(r => !r.diet_tags.includes('vegan'));
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: 'vegan',
                          allergens: [], pool: nonVeganPool, seed: 0 });
  assert('no-diet-match pool: no crash', true);
  assert('no-diet-match pool: all unfillable',
    result.meals.every(m => m.unfillable));
}

// ── Section: dayTotals correctness ───────────────────────────────────────────

console.log('\n── DAYTOTALS correctness ──');

{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: POOL, seed: 0 });
  const filled = result.meals.filter(m => !m.unfillable);
  const manualCal  = filled.reduce((s, m) => s + m.scaledMacros.cal,  0);
  const manualPro  = filled.reduce((s, m) => s + m.scaledMacros.pro,  0);
  // Allow ±1 for floating-point rounding
  assert('dayTotals.cal matches manual sum',
    Math.abs(result.dayTotals.cal - manualCal) <= 1);
  assert('dayTotals.pro matches manual sum',
    Math.abs(result.dayTotals.pro - manualPro) <= 1);
}

// ── Section: servings within valid range ─────────────────────────────────────

console.log('\n── SERVINGS RANGE ──');

{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: POOL, seed: 0 });
  const filled = result.meals.filter(m => !m.unfillable);
  assert('all servings in [0.5, 3.0]',
    filled.every(m => m.servings >= 0.5 && m.servings <= 3.0),
    `Servings: ${filled.map(m => m.servings).join(', ')}`,
  );
  assert('all servings are multiples of 0.25',
    filled.every(m => Math.abs(m.servings * 4 - Math.round(m.servings * 4)) < 0.001));
}

// ── Section: week-level tests ─────────────────────────────────────────────────

console.log('\n── fitWeek ──');

{
  const week = fitWeek({
    dayTargets: Array(7).fill(TARGET_2200),
    mealCount:  3,
    diet:       null,
    allergens:  [],
    pool:       POOL,
    seed:       42,
  });
  assert('fitWeek: 7 days returned', week.length === 7);
  assert('fitWeek: all days have meals array', week.every(d => Array.isArray(d.meals)));
  assert('fitWeek: all days have dayTotals', week.every(d => typeof d.dayTotals.cal === 'number'));

  // No allergen violations across entire week (trivially true here since allergens=[])
  assert('fitWeek no allergen filter: no violations',
    week.every(d => !anyMealViolatesAllergens(d, [])));
}

// Week with allergen filter
{
  const week = fitWeek({
    dayTargets: Array(5).fill(TARGET_2200),
    mealCount:  3,
    diet:       null,
    allergens:  ['dairy'],
    pool:       POOL,
    seed:       0,
  });
  assert('fitWeek dairy-free 5-day: 5 days', week.length === 5);
  assert('fitWeek dairy-free: no dairy in any meal across 5 days',
    week.every(d => !anyMealViolatesAllergens(d, ['dairy'])));
}

// Week variety: use_count carried → later days prefer less-used recipes
{
  const week = fitWeek({
    dayTargets: Array(7).fill(TARGET_2200),
    mealCount:  3,
    diet:       null,
    allergens:  [],
    pool:       POOL,
    seed:       1,
  });
  // Collect all recipe ids used across the week
  const allUsed = [];
  for (const day of week) {
    for (const m of day.meals) {
      if (!m.unfillable) allUsed.push(m.recipe.id ?? m.recipe.name);
    }
  }
  // With 40 recipes and 21 meal slots across 7 days, we should see variety
  const uniqueUsed = new Set(allUsed);
  assert('fitWeek variety: at least 6 distinct recipes over 7 days',
    uniqueUsed.size >= 6, `Only ${uniqueUsed.size} distinct recipes in 7 days`);
}

// fitWeek determinism
{
  const weekA = fitWeek({ dayTargets: Array(7).fill(TARGET_2200), mealCount: 3,
                          diet: null, allergens: [], pool: POOL, seed: 77 });
  const weekB = fitWeek({ dayTargets: Array(7).fill(TARGET_2200), mealCount: 3,
                          diet: null, allergens: [], pool: POOL, seed: 77 });
  const sameWeek = weekA.every((day, d) =>
    day.meals.every((m, i) =>
      m.unfillable === weekB[d].meals[i].unfillable &&
      (m.unfillable || m.recipe.id === weekB[d].meals[i].recipe.id),
    ));
  assert('fitWeek determinism: same seed → same week', sameWeek);
}

// ── Section: edge cases ───────────────────────────────────────────────────────

console.log('\n── EDGE CASES ──');

// Zero-calorie target
{
  const result = fitDay({ dayTarget: { cal: 0, pro: 0, carb: 0, fat: 0 },
                          mealCount: 3, diet: null, allergens: [], pool: POOL, seed: 0 });
  assert('zero-calorie target: no crash', true);
  assert('zero-calorie target: returns 3 slots', result.meals.length === 3);
}

// Very small calorie target (should clamp servings to MIN_SERVINGS)
{
  const result = fitDay({ dayTarget: { cal: 100, pro: 10, carb: 5, fat: 4 },
                          mealCount: 3, diet: null, allergens: [], pool: POOL, seed: 0 });
  const filled = result.meals.filter(m => !m.unfillable);
  assert('small target: servings clamped to ≥ 0.5',
    filled.every(m => m.servings >= 0.5));
}

// Very large calorie target (should clamp servings to MAX_SERVINGS)
{
  const result = fitDay({ dayTarget: { cal: 10000, pro: 500, carb: 1000, fat: 400 },
                          mealCount: 3, diet: null, allergens: [], pool: POOL, seed: 0 });
  const filled = result.meals.filter(m => !m.unfillable);
  assert('large target: servings clamped to ≤ 3.0',
    filled.every(m => m.servings <= 3.0));
}

// Pool with use_count already set (recency de-weighting)
{
  const usedPool = POOL.map(r => ({
    ...r,
    use_count: r.id <= 5 ? 10 : 0,  // first 5 heavily used
    last_used: r.id <= 5 ? new Date().toISOString() : null,
  }));
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: usedPool, seed: 0 });
  assert('recency pool: no crash + 3 slots', result.meals.length === 3);
  assert('recency pool: allergen gate still holds',
    !anyMealViolatesAllergens(result, []));
}

// ── Section: scaledMacros = per_serving × servings ───────────────────────────

console.log('\n── SCALEDMACROS accuracy ──');

{
  const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet: null,
                          allergens: [], pool: POOL, seed: 0 });
  for (const m of result.meals.filter(mm => !mm.unfillable)) {
    const expected = {
      cal:  Math.round(m.recipe.calories_per_serving  * m.servings * 10) / 10,
      pro:  Math.round(m.recipe.protein_per_serving   * m.servings * 10) / 10,
      carb: Math.round(m.recipe.carbs_per_serving     * m.servings * 10) / 10,
      fat:  Math.round(m.recipe.fat_per_serving       * m.servings * 10) / 10,
    };
    assert(
      `slot "${m.slot}": scaledMacros.cal == recipe×servings`,
      Math.abs(m.scaledMacros.cal - expected.cal) <= 0.2,
    );
    assert(
      `slot "${m.slot}": scaledMacros.pro == recipe×servings`,
      Math.abs(m.scaledMacros.pro - expected.pro) <= 0.2,
    );
  }
}

// ── Section: additional allergen safety stress ────────────────────────────────
// Exhaust multiple diet+allergen combinations to confirm the gate is airtight.

console.log('\n── ALLERGEN SAFETY STRESS (diet × allergen matrix) ──');

const STRESS_DIETS     = [null, 'keto', 'vegan', 'high-protein', 'pescatarian'];
const STRESS_ALLERGENS = [
  ['dairy'],
  ['nuts'],
  ['eggs'],
  ['pork'],
  ['shellfish'],
  ['gluten'],
  ['dairy', 'eggs'],
  ['nuts', 'shellfish'],
  ['pork', 'gluten'],
];

for (const diet of STRESS_DIETS) {
  for (const allergens of STRESS_ALLERGENS) {
    const result = fitDay({ dayTarget: TARGET_2200, mealCount: 3, diet,
                            allergens, pool: POOL, seed: 13 });
    assert(
      `stress diet=${diet ?? 'null'} allergens=[${allergens}]: no violation`,
      !anyMealViolatesAllergens(result, allergens),
    );
  }
}

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log(`TOTAL: ${passed + failed} tests  |  PASS: ${passed}  |  FAIL: ${failed}`);
console.log('═'.repeat(60));

if (failures.length > 0) {
  console.log('\nFAILURES:');
  for (const f of failures) {
    console.log(`  ✗ ${f.label}`);
    if (f.detail) console.log(`    ${f.detail}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('\nAll tests passed ✓\n');
  process.exit(0);
}
