/**
 * mealFitter.js — Pure meal-fitting algorithm (Phase 2 of MEAL_FITTER_SPEC.md).
 *
 * No network, no React, no Supabase calls.  The caller loads the recipe pool
 * and passes it in; this module only computes.
 *
 * Core exports:
 *   fitDay(params)   → { meals, dayTotals, withinTolerance }
 *   fitWeek(params)  → fitDayResult[]  (7 or 5 days, recency carried across)
 *
 * Also exported for direct testing / UI use:
 *   filterPool, isAllergenExcluded, meetsDiet, slotTargets
 *   CAL_TOLERANCE, PRO_TOLERANCE
 */

// ── Tunable constants ─────────────────────────────────────────────────────────

export const CAL_TOLERANCE  = 0.08;   // day total cal within ±8% of target
export const PRO_TOLERANCE  = 0.15;   // day total protein within ±15% of target

const SERVING_STEP = 0.25;            // round servings to nearest ¼
const MIN_SERVINGS = 0.5;
const MAX_SERVINGS = 3.0;

// Ordered slot plans: each entry is [key, mealSlot, ratio].
// key    — unique slot identifier used in meals[].slot and positional mapping.
// mealSlot — recipe pool filter value (snack1/2/3 all query meal_slot='snack').
// 2/3/4 ratios are byte-identical to the former SLOT_RATIOS_2/3/4.
// 5 sum: 0.22+0.26+0.30+0.11+0.11 = 1.00
// 6 sum: 0.20+0.22+0.24+0.12+0.11+0.11 = 1.00
const SLOT_PLANS = {
  2: [['lunch','lunch',0.45],['dinner','dinner',0.55]],
  3: [['breakfast','breakfast',0.25],['lunch','lunch',0.35],['dinner','dinner',0.40]],
  4: [['breakfast','breakfast',0.25],['lunch','lunch',0.30],['dinner','dinner',0.35],['snack','snack',0.10]],
  5: [['breakfast','breakfast',0.22],['lunch','lunch',0.26],['dinner','dinner',0.30],['snack1','snack',0.11],['snack2','snack',0.11]],
  6: [['breakfast','breakfast',0.20],['lunch','lunch',0.22],['dinner','dinner',0.24],['snack1','snack',0.12],['snack2','snack',0.11],['snack3','snack',0.11]],
};
function planForCount(n) { return SLOT_PLANS[n] || SLOT_PLANS[Math.max(2, Math.min(6, n))] || SLOT_PLANS[3]; }

// Canonical slot ordering for output stability (snack1/2/3 extend after dinner)
const SLOT_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3, snack1: 3, snack2: 4, snack3: 5 };

// Sort filled plan meals into canonical order so positional mapping (index+1 → slot number) is stable.
// Accepts both shaped plan meals (m.name) and raw fitDay output (m.recipe).
export function orderPlanMeals(meals) {
  return (meals || [])
    .filter(m => m && !m.unfillable && (m.name || m.recipe))
    .sort((a, b) => (SLOT_ORDER[a.slot] ?? 9) - (SLOT_ORDER[b.slot] ?? 9));
}

// Macro scoring weights — protein is weighted 3× to prioritise hitting it
const W = { cal: 1, pro: 3, carb: 1, fat: 1 };

// ── Seeded PRNG (mulberry32) ───────────────────────────────────────────────────
// Needed so tie-breaking is deterministic for a given seed.

function makePRNG(seed) {
  let s = (seed >>> 0) ^ 0xdeadbeef;
  return function rand() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function roundToStep(v, step) { return Math.round(v / step) * step; }
function clamp(v, lo, hi)     { return v < lo ? lo : v > hi ? hi : v; }
function r1(v)                { return Math.round(v * 10) / 10; }

/** Stable recipe identifier — prefer numeric id, fall back to name string. */
function recipeKey(r) { return r.id != null ? r.id : r.name; }

/**
 * SAFETY-CRITICAL: returns true when recipe must be EXCLUDED.
 * Excluded iff recipe.allergen_tags ∩ allergens ≠ ∅.
 * This is the only entry point for the allergen gate — kept intentionally
 * small so it can be audited at a glance.
 */
export function isAllergenExcluded(recipe, allergens) {
  if (!allergens || allergens.length === 0) return false;
  const tags = recipe.allergen_tags || [];
  return allergens.some(a => tags.includes(a));
}

// Mirrors DIET_INCLUDES in fuel.jsx — must stay in sync.
// Defines which recipe diet_tags qualify for a given chosen diet.
const _DIET_INCLUDES = {
  vegan:         ['vegan'],
  vegetarian:    ['vegetarian','vegan'],
  pescatarian:   ['pescatarian','vegetarian','vegan'],
  mediterranean: ['mediterranean'],
  keto:          ['keto'],
  paleo:         ['paleo'],
  'low-carb':    ['low-carb'],
  carnivore:     ['carnivore'],
};

/**
 * Diet match: recipe satisfies the requested diet.
 * 'balanced', null, or undefined → any recipe qualifies.
 * Uses inclusion map so sub-diets (e.g. vegan ⊂ vegetarian ⊂ pescatarian) pass.
 */
export function meetsDiet(recipe, diet) {
  if (!diet || diet === 'balanced') return true;
  const allowed = _DIET_INCLUDES[diet] || [diet];
  return (recipe.diet_tags || []).some(t => allowed.includes(t));
}

/**
 * Filter pool to allergen-safe, diet-matching recipes.
 * Never mutates the original array.
 */
export function filterPool(pool, diet, allergens) {
  return pool.filter(r => meetsDiet(r, diet) && !isAllergenExcluded(r, allergens));
}

/**
 * Split a dayTarget proportionally across meal slots.
 * Returns an ordered array of {key, mealSlot, cal, pro, carb, fat}.
 * key    — unique slot id (e.g. 'snack1', 'snack2').
 * mealSlot — recipe pool filter value ('snack' for all snack keys).
 * Supports mealCount 2–6.
 */
export function slotTargets(dayTarget, mealCount) {
  return planForCount(mealCount).map(([key, mealSlot, ratio]) => ({
    key,
    mealSlot,
    cal:  Math.round(dayTarget.cal  * ratio),
    pro:  r1(dayTarget.pro  * ratio),
    carb: r1(dayTarget.carb * ratio),
    fat:  r1(dayTarget.fat  * ratio),
  }));
}

/**
 * Compute macros for `recipe` scaled to `servings`.
 */
function scaleMacros(recipe, servings) {
  return {
    cal:  r1(recipe.calories_per_serving  * servings),
    pro:  r1(recipe.protein_per_serving   * servings),
    carb: r1(recipe.carbs_per_serving     * servings),
    fat:  r1(recipe.fat_per_serving       * servings),
  };
}

/**
 * Compute the optimal serving count for `recipe` to hit `calTarget`,
 * rounded to the nearest SERVING_STEP and clamped to [MIN, MAX].
 */
function optimalServings(recipe, calTarget) {
  const perServing = recipe.calories_per_serving;
  if (!perServing || perServing <= 0) return SERVING_STEP;
  return clamp(roundToStep(calTarget / perServing, SERVING_STEP), MIN_SERVINGS, MAX_SERVINGS);
}

/**
 * Weighted macro distance between `actual` and `target`.
 * Normalised by target value on each axis so all axes are fraction-scale.
 * Safe against zero targets.
 */
function macroDist(actual, target) {
  const safe = v => (v > 0 ? v : 1);
  return (
    W.cal  * Math.abs(actual.cal  - target.cal)  / safe(target.cal)  +
    W.pro  * Math.abs(actual.pro  - target.pro)  / safe(target.pro)  +
    W.carb * Math.abs(actual.carb - target.carb) / safe(target.carb) +
    W.fat  * Math.abs(actual.fat  - target.fat)  / safe(target.fat)
  );
}

/**
 * Soft recency penalty to de-weight frequently or recently used recipes.
 * Returns a small positive number added to the score (lower = better).
 * NEVER causes exclusion.
 */
function recencyPenalty(recipe, nowMs) {
  const count = Math.min((recipe.use_count || 0) * 0.04, 0.24);
  const lastUsed = recipe.last_used ? new Date(recipe.last_used).getTime() : 0;
  const daysSince = lastUsed ? (nowMs - lastUsed) / 86_400_000 : Infinity;
  const recent    = daysSince < 3 ? 0.10 : daysSince < 7 ? 0.04 : 0;
  return count + recent;
}

// ── Core slot picker ──────────────────────────────────────────────────────────

/**
 * Pick the single best recipe for `slot` from `eligible`.
 *
 * Priority:
 *   1. Slot-matched recipes (meal_slot === slot) over cross-slot fallback.
 *   2. Exclude recipes whose key is already in `usedKeys` (no-dup within day).
 *   3. Score = macroDist(scaled, target) + recencyPenalty + rand jitter.
 *   4. If nothing fits → { unfillable:true, reason }.
 *
 * The allergen gate is enforced at `filterPool` level — this function
 * receives only pre-filtered recipes and adds no new allergen logic.
 */
function pickForSlot(eligible, mealSlot, target, usedKeys, rand, nowMs) {
  const available = eligible.filter(r => !usedKeys.has(recipeKey(r)));

  if (available.length === 0) {
    return {
      unfillable: true,
      reason: `no eligible recipes available for slot "${mealSlot}"`,
    };
  }

  // Prefer slot-matched; fall back to whole available pool
  const slotMatched = available.filter(r => r.meal_slot === mealSlot);
  const candidates  = slotMatched.length > 0 ? slotMatched : available;

  // Score every candidate
  const scored = candidates.map(recipe => {
    const servings    = optimalServings(recipe, target.cal);
    const scaled      = scaleMacros(recipe, servings);
    const dist        = macroDist(scaled, target);
    const penalty     = recencyPenalty(recipe, nowMs);
    const jitter      = rand() * 0.001;           // deterministic tie-break
    return { recipe, servings, scaledMacros: scaled, score: dist + penalty + jitter };
  });

  scored.sort((a, b) => a.score - b.score);
  const { recipe, servings, scaledMacros } = scored[0];
  return { recipe, servings, scaledMacros };
}

// ── fitDay ────────────────────────────────────────────────────────────────────

/**
 * fitDay({ dayTarget, mealCount, diet, allergens, pool, seed })
 *
 * @param {{ cal, pro, carb, fat }} dayTarget  - daily macro targets
 * @param {number}   mealCount  - 2–6 meals (2=lunch+dinner, 3=B/L/D, 4=B/L/D+snack, 5=+snack1/2, 6=+snack1/2/3)
 * @param {string}   diet       - diet tag (e.g. 'keto') or 'balanced'/null
 * @param {string[]} allergens  - allergen tags to HARD-EXCLUDE (safety gate)
 * @param {object[]} pool       - array of recipe objects (read-only)
 * @param {number}   seed       - integer for deterministic tie-breaking
 *
 * @returns {{
 *   meals: Array<{ slot, recipe, servings, scaledMacros }
 *              | { slot, unfillable:true, reason }>,
 *   dayTotals: { cal, pro, carb, fat },
 *   withinTolerance: boolean,
 * }}
 */
export function fitDay({
  dayTarget,
  mealCount  = 3,
  diet       = null,
  allergens  = [],
  pool       = [],
  seed       = 0,
}) {
  const rand   = makePRNG(seed);
  const nowMs  = Date.now();

  // 1. Filter pool — ALLERGEN GATE applied here; never relaxed downstream
  const eligible = filterPool(pool, diet, allergens);

  // 2. Per-slot calorie/macro targets (ordered array, already in plan order)
  const slots = slotTargets(dayTarget, mealCount);

  // 3. Pick for each slot in plan order
  const meals    = [];
  const usedKeys = new Set();

  for (const s of slots) {
    const result = pickForSlot(eligible, s.mealSlot, s, usedKeys, rand, nowMs);
    if (!result.unfillable) {
      usedKeys.add(recipeKey(result.recipe));
    }
    meals.push({ slot: s.key, mealSlot: s.mealSlot, ...result });
  }

  // 4. Day totals (sum only filled slots)
  const dayTotals = { cal: 0, pro: 0, carb: 0, fat: 0 };
  for (const m of meals) {
    if (m.unfillable) continue;
    dayTotals.cal  += m.scaledMacros.cal;
    dayTotals.pro  += m.scaledMacros.pro;
    dayTotals.carb += m.scaledMacros.carb;
    dayTotals.fat  += m.scaledMacros.fat;
  }
  dayTotals.cal  = r1(dayTotals.cal);
  dayTotals.pro  = r1(dayTotals.pro);
  dayTotals.carb = r1(dayTotals.carb);
  dayTotals.fat  = r1(dayTotals.fat);

  // 5. Tolerance — only meaningful when all slots are filled
  const calDiff = dayTarget.cal > 0 ? Math.abs(dayTotals.cal - dayTarget.cal) / dayTarget.cal : 0;
  const proDiff = dayTarget.pro > 0 ? Math.abs(dayTotals.pro - dayTarget.pro) / dayTarget.pro : 0;
  const withinTolerance = meals.every(m => !m.unfillable)
    && calDiff <= CAL_TOLERANCE
    && proDiff <= PRO_TOLERANCE;

  return { meals, dayTotals, withinTolerance };
}

// ── fitWeek ───────────────────────────────────────────────────────────────────

/**
 * fitWeek({ dayTargets, mealCount, diet, allergens, pool, seed })
 *
 * Calls fitDay once per day, carrying use_count / last_used forward so the
 * week varies.  The original pool array is never mutated.
 *
 * @param {object[]} dayTargets - 5 or 7 {cal, pro, carb, fat} targets
 * @returns {object[]} - one fitDay result per day
 */
export function fitWeek({
  dayTargets,
  mealCount = 3,
  diet      = null,
  allergens = [],
  pool      = [],
  seed      = 0,
}) {
  // Shallow-copy pool so we can update recency without touching caller's data
  let localPool = pool.map(r => ({ ...r }));
  const results  = [];

  for (let i = 0; i < dayTargets.length; i++) {
    const dayResult = fitDay({
      dayTarget: dayTargets[i],
      mealCount,
      diet,
      allergens,
      pool:  localPool,
      seed:  seed + i * 1000,   // per-day seed derived from base
    });

    results.push(dayResult);

    // Propagate recency: bump use_count + set last_used for today's recipes
    const used = new Set(
      dayResult.meals
        .filter(m => !m.unfillable)
        .map(m => recipeKey(m.recipe)),
    );
    if (used.size > 0) {
      const today = new Date().toISOString().slice(0, 10);
      localPool = localPool.map(r => {
        if (used.has(recipeKey(r))) {
          return { ...r, use_count: (r.use_count || 0) + 1, last_used: today };
        }
        return r;
      });
    }
  }

  return results;
}
