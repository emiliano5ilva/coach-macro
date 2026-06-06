export function getSlotsForFreq(mealFreq) {
  const count = Math.min(parseInt(String(mealFreq)) || 3, 6);
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function getSlotLabel(n) {
  return `MEAL ${n}`;
}

export function normaliseSlotToNumber(slot, slots) {
  if (typeof slot === 'number') return slot;
  const namedOrder = [
    'Breakfast', 'Morning Snack', 'Lunch',
    'Afternoon Snack', 'Snack', 'Dinner', 'Evening Snack',
  ];
  const idx = namedOrder.indexOf(slot);
  if (idx !== -1) return Math.min(idx + 1, slots.length);
  return 1;
}

export function getOverageThreshold(goal) {
  const thresholds = {
    lose_fat:       1.02,
    recomp:         1.02,
    maintain:       1.05,
    build_muscle:   1.08,
    get_stronger:   1.08,
    train_for_race: 1.08,
    get_faster:     1.08,
  };
  return thresholds[goal] || 1.05;
}

export function calculateOverage(slotTarget, actualCalories, goal) {
  const threshold = getOverageThreshold(goal);
  const maxAllowed = slotTarget * threshold;
  if (actualCalories <= maxAllowed) return 0;
  return Math.round(actualCalories - slotTarget);
}

// Symmetric within-day redistribution.
// Invariant: sum(targets over activeSlots) + loggedCaloriesTotal === calorieTarget
//            whenever loggedCaloriesTotal <= calorieTarget.
// Under-eating rolls leftover forward; over-eating reduces remaining; skipped
// slots' budget flows to remaining unlogged meals — all via a single rule.
export function getSlotTargets(calorieTarget, slots, skippedSlots = [], loggedSlots = [], loggedCaloriesTotal = 0) {
  const activeSlots = slots.filter(
    s => !skippedSlots.includes(s) && !loggedSlots.includes(s)
  );
  const remainingBudget = Math.max(0, calorieTarget - loggedCaloriesTotal);
  const perSlot = activeSlots.length > 0 ? remainingBudget / activeSlots.length : 0;
  const basePerSlot = calorieTarget / slots.length;
  const targets = {};
  slots.forEach(slot => {
    if (skippedSlots.includes(slot)) {
      targets[slot] = 0;
    } else if (loggedSlots.includes(slot)) {
      targets[slot] = Math.round(basePerSlot); // historical display for done/locked slots
    } else {
      targets[slot] = Math.max(Math.round(perSlot), 0);
    }
  });
  return targets;
}

export function getMissingSlots(targetSlot, slots, loggedSlots, skippedSlots) {
  const targetIndex = slots.indexOf(targetSlot);
  if (targetIndex <= 0) return [];
  return slots
    .slice(0, targetIndex)
    .filter(s => !loggedSlots.includes(s) && !skippedSlots.includes(s));
}

export function getLoggedSlots(entries = []) {
  return [
    ...new Set(
      entries.map(e => e.slot).filter(s => typeof s === 'number')
    ),
  ];
}
