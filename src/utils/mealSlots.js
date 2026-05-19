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

export function getSlotTargets(calorieTarget, slots, skippedSlots = [], loggedSlots = []) {
  const basePerSlot = calorieTarget / slots.length;
  const freedCalories = skippedSlots.length * basePerSlot;
  const remainingSlots = slots.filter(
    s => !skippedSlots.includes(s) && !loggedSlots.includes(s)
  );
  const extraPerSlot = remainingSlots.length > 0 ? freedCalories / remainingSlots.length : 0;
  const targets = {};
  slots.forEach(slot => {
    if (skippedSlots.includes(slot)) {
      targets[slot] = 0;
    } else if (loggedSlots.includes(slot)) {
      targets[slot] = Math.round(basePerSlot);
    } else {
      targets[slot] = Math.round(basePerSlot + extraPerSlot);
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
