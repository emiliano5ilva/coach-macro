// scripts/test-slot-targets.mjs
// Tests for the symmetric within-day calorie redistribution rule.
// Conservation invariant: sum(targets over activeSlots) + loggedCaloriesTotal === calorieTarget
//   whenever loggedCaloriesTotal <= calorieTarget.
// Run: node scripts/test-slot-targets.mjs

import { getSlotTargets } from '../src/utils/mealSlots.js';

let passed = 0;
let failed = 0;

function assert(condition, label, extra = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${extra ? ' — ' + extra : ''}`);
    failed++;
  }
}

// Conservation invariant helper
function checkInvariant(targets, slots, skippedSlots, loggedSlots, loggedCaloriesTotal, calorieTarget) {
  const activeSlots = slots.filter(s => !skippedSlots.includes(s) && !loggedSlots.includes(s));
  const activeSum = activeSlots.reduce((s, slot) => s + (targets[slot] || 0), 0);
  const expected = Math.max(0, calorieTarget - loggedCaloriesTotal);
  // Allow ±(activeSlots.length) rounding slack from Math.round
  const slack = activeSlots.length;
  return Math.abs(activeSum - expected) <= slack;
}

// ── CASE 1: Nothing logged → even split summing to dayTotal ─────────────────
console.log('\nCase 1: nothing logged → even split');
{
  const dayTotal = 2950;
  const slots = [1, 2];
  const targets = getSlotTargets(dayTotal, slots, [], [], 0);
  assert(targets[1] === Math.round(dayTotal / 2), 'slot 1 = dayTotal/2', `got ${targets[1]}`);
  assert(targets[2] === Math.round(dayTotal / 2), 'slot 2 = dayTotal/2', `got ${targets[2]}`);
  assert(checkInvariant(targets, slots, [], [], 0, dayTotal), 'conservation invariant holds');
}

// ── CASE 2: Under-eat slot 1 → remaining absorbs leftover (sum conserved) ───
console.log('\nCase 2: under-eat slot 1 (~700) → slot 2 absorbs leftover → ~2250');
{
  const dayTotal = 2950;
  const slots = [1, 2];
  const loggedCaloriesTotal = 700; // slot 1 eaten (under target of 1475)
  const loggedSlots = [1];
  const targets = getSlotTargets(dayTotal, slots, [], loggedSlots, loggedCaloriesTotal);
  const expected2 = dayTotal - loggedCaloriesTotal; // 2250
  assert(targets[2] === expected2, `slot 2 = ${expected2} (absorbed leftover)`, `got ${targets[2]}`);
  assert(checkInvariant(targets, slots, [], loggedSlots, loggedCaloriesTotal, dayTotal), 'conservation invariant holds');
}

// ── CASE 3: Over-eat slot 1 → remaining shrinks (sum conserved) ─────────────
console.log('\nCase 3: over-eat slot 1 (~2200) → slot 2 shrinks → ~750');
{
  const dayTotal = 2950;
  const slots = [1, 2];
  const loggedCaloriesTotal = 2200;
  const loggedSlots = [1];
  const targets = getSlotTargets(dayTotal, slots, [], loggedSlots, loggedCaloriesTotal);
  const expected2 = dayTotal - loggedCaloriesTotal; // 750
  assert(targets[2] === expected2, `slot 2 = ${expected2} (shrunk)`, `got ${targets[2]}`);
  assert(checkInvariant(targets, slots, [], loggedSlots, loggedCaloriesTotal, dayTotal), 'conservation invariant holds');
}

// ── CASE 4: Over-eat beyond dayTotal → remaining targets floor at 0 ─────────
console.log('\nCase 4: massive over-eat (>dayTotal) → remaining floor at 0, never negative');
{
  const dayTotal = 2950;
  const slots = [1, 2, 3];
  const loggedCaloriesTotal = 4000; // more than day total
  const loggedSlots = [1];
  const targets = getSlotTargets(dayTotal, slots, [], loggedSlots, loggedCaloriesTotal);
  assert(targets[2] === 0, 'slot 2 = 0 (floored)', `got ${targets[2]}`);
  assert(targets[3] === 0, 'slot 3 = 0 (floored)', `got ${targets[3]}`);
  assert(targets[2] >= 0 && targets[3] >= 0, 'no negative targets');
}

// ── CASE 5: Skipped slot → budget spreads to remaining unlogged ──────────────
console.log('\nCase 5: 3 slots, slot 2 skipped, nothing logged → slots 1+3 share full dayTotal');
{
  const dayTotal = 2950;
  const slots = [1, 2, 3];
  const skippedSlots = [2];
  const targets = getSlotTargets(dayTotal, slots, skippedSlots, [], 0);
  const perActive = dayTotal / 2; // slots 1 and 3
  assert(targets[2] === 0, 'skipped slot 2 = 0');
  assert(targets[1] === Math.round(perActive), `slot 1 = ${Math.round(perActive)}`, `got ${targets[1]}`);
  assert(targets[3] === Math.round(perActive), `slot 3 = ${Math.round(perActive)}`, `got ${targets[3]}`);
  assert(checkInvariant(targets, slots, skippedSlots, [], 0, dayTotal), 'conservation invariant holds');
}

// ── CASE 6: Locked slot (counted as logged, excluded from active) ────────────
console.log('\nCase 6: 2 slots, slot 1 locked (700 cal logged), slot 2 active → 2250');
{
  const dayTotal = 2950;
  const slots = [1, 2];
  const lockedSlots = [1]; // locked = in loggedSlots for getSlotTargets
  const loggedCaloriesTotal = 700;
  const targets = getSlotTargets(dayTotal, slots, [], lockedSlots, loggedCaloriesTotal);
  const expected2 = dayTotal - loggedCaloriesTotal; // 2250
  assert(targets[2] === expected2, `slot 2 = ${expected2}`, `got ${targets[2]}`);
  assert(checkInvariant(targets, slots, [], lockedSlots, loggedCaloriesTotal, dayTotal), 'conservation invariant holds');
}

// ── CASE 7: All slots logged → no active targets, no crash ───────────────────
console.log('\nCase 7: all slots logged → targets returned for display, no crash');
{
  const dayTotal = 2950;
  const slots = [1, 2];
  const loggedSlots = [1, 2];
  const loggedCaloriesTotal = 2900;
  let threw = false;
  let targets;
  try { targets = getSlotTargets(dayTotal, slots, [], loggedSlots, loggedCaloriesTotal); }
  catch (e) { threw = true; }
  assert(!threw, 'no crash when all slots logged');
  assert(typeof targets[1] === 'number' && typeof targets[2] === 'number', 'returns numeric targets for display');
}

// ── CASE 8: Three-slot under-eat across two logged slots ─────────────────────
console.log('\nCase 8: 3 slots, slots 1+2 logged (400+500=900 of 2950) → slot 3 gets 2050');
{
  const dayTotal = 2950;
  const slots = [1, 2, 3];
  const loggedSlots = [1, 2];
  const loggedCaloriesTotal = 900;
  const targets = getSlotTargets(dayTotal, slots, [], loggedSlots, loggedCaloriesTotal);
  const expected3 = dayTotal - loggedCaloriesTotal; // 2050
  assert(targets[3] === expected3, `slot 3 = ${expected3}`, `got ${targets[3]}`);
  assert(checkInvariant(targets, slots, [], loggedSlots, loggedCaloriesTotal, dayTotal), 'conservation invariant holds');
}

// ── CASE 9: Skip + partial log — combined ────────────────────────────────────
console.log('\nCase 9: 3 slots, slot 2 skipped, slot 1 logged (600) → slot 3 gets 2350');
{
  const dayTotal = 2950;
  const slots = [1, 2, 3];
  const skippedSlots = [2];
  const loggedSlots = [1];
  const loggedCaloriesTotal = 600;
  const targets = getSlotTargets(dayTotal, slots, skippedSlots, loggedSlots, loggedCaloriesTotal);
  const expected3 = dayTotal - loggedCaloriesTotal; // 2350
  assert(targets[2] === 0, 'skipped slot 2 = 0');
  assert(targets[3] === expected3, `slot 3 = ${expected3}`, `got ${targets[3]}`);
  assert(checkInvariant(targets, slots, skippedSlots, loggedSlots, loggedCaloriesTotal, dayTotal), 'conservation invariant holds');
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`TOTAL: ${passed + failed} tests  |  PASS: ${passed}  |  FAIL: ${failed}`);
console.log('─'.repeat(60));
if (failed > 0) {
  console.error('\nSome tests failed.');
  process.exit(1);
} else {
  console.log('\nAll tests passed ✓');
}
