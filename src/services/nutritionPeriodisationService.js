import { sb } from '../client';
import { computeSessionLoad } from './exerciseResolver.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Load-tier thresholds (sets × avgReps × compound-factor):
//   Light    < 120  (1–3 exercises or very short session) → +75 kcal / +19g carbs
//   Moderate 120–200 (typical 4–5 exercise session)       → +150 kcal / +38g carbs
//   Heavy    ≥ 200  (6+ exercises, several compounds)     → +225 kcal / +56g carbs
//   Fallback (no exercise data)                           → +150 kcal / +38g carbs (pre-existing flat)
// Deload discount: all tiers halved (volume is reduced ~50%).
function _trainingBump(todaysExercises, deloadActive) {
  const load = todaysExercises === null ? null : computeSessionLoad(todaysExercises);
  if (load !== null && load === 0) return null; // empty array → no exercises, no bump

  let calBump, carbBump;
  if (load === null) {
    // No exercise data available — fall back to the existing flat value
    calBump = 150; carbBump = 38;
  } else if (load < 120) {
    calBump = 75; carbBump = 19;
  } else if (load < 200) {
    calBump = 150; carbBump = 38;
  } else {
    calBump = 225; carbBump = 56;
  }

  if (deloadActive) {
    calBump = Math.round(calBump / 2);
    carbBump = Math.round(carbBump / 2);
  }

  const tierLabel = load === null ? 'training day'
    : load < 120 ? 'light session'
    : load < 200 ? 'moderate session'
    : 'heavy session';
  const deloadNote = deloadActive ? ' (deload week — reduced)' : '';
  const reason = `${tierLabel}${deloadNote} — carb and calorie increase to support today's training.`;

  return { calBump, carbBump, reason };
}

/**
 * Compute today's nutrition override protocol for a user.
 *
 * @param {string}      userId
 * @param {Array|null}  todaysExercises  - resolved exercise list from resolveTodaysExercises,
 *   or null when the caller couldn't resolve exercises (triggers flat-bump fallback).
 * @param {boolean}     deloadActive     - whether the user is in a deload week.
 * @param {Object|null} todaysRunSession - enriched run session from resolveTodaysRunSession,
 *   or null for non-run days / when the caller can't resolve a run session.
 */
export async function getTodayNutritionProtocol(userId, todaysExercises = null, deloadActive = false, todaysRunSession = null) {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await sb
    .from('nutrition_protocols')
    .select('*')
    .eq('user_id', userId)
    .eq('protocol_date', today)
    .maybeSingle();
  if (existing) return existing;

  const { data: profileRow } = await sb
    .from('profiles')
    .select('profile_data, wprefs, goal, hyrox_race_date, last_refeed_date, schedule')
    .eq('id', userId)
    .maybeSingle();
  if (!profileRow) return null;

  const p = profileRow.profile_data || {};
  const wp = profileRow.wprefs || {};
  const goal = (profileRow.goal || p.goal || 'build_muscle').toLowerCase().replace(/\s+/g, '_');

  const baseCalories = p.goalCals || 2000;
  const bodyWeightLbs = p.wUnit === 'kg'
    ? (parseFloat(p.weight || 70) * 2.205)
    : parseFloat(p.weight || 160);
  const baseProtein = Math.round(bodyWeightLbs * 0.75);
  const baseCarbs = Math.round((baseCalories * 0.40) / 4);
  const baseFat = Math.max(25, Math.round((baseCalories - baseProtein * 4 - baseCarbs * 4) / 9));

  const todayKey = DAYS[new Date().getDay()];
  const schedule = profileRow.schedule || wp.schedule || {};
  const todayType = schedule[todayKey] || 'rest';
  const isLiftingDay = todayType === 'training' || todayType === 'custom';

  const refeedInterval = wp.refeed_day_interval ?? profileRow.refeed_day_interval ?? 7;

  let protocolType = 'standard';
  let adjustedCalories = baseCalories;
  let adjustedProtein = baseProtein;
  let adjustedCarbs = baseCarbs;
  let adjustedFat = baseFat;
  let reason = null;

  const raceDate = profileRow.hyrox_race_date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const raceIsToday = raceDate === today;
  const raceIsTomorrow = raceDate === tomorrowStr;

  // P1: Race day / carb load — untouched
  if (raceIsToday || raceIsTomorrow) {
    protocolType = raceIsToday ? 'race_day' : 'carb_load';
    const carbBoost = 65;
    const fatCut = 10;
    adjustedCarbs = baseCarbs + carbBoost;
    adjustedFat = Math.max(20, baseFat - fatCut);
    adjustedCalories = baseCalories + carbBoost * 4 - fatCut * 9;
    reason = raceIsToday
      ? 'Race day — high carbs, moderate protein, keep fat low.'
      : 'Race tomorrow — carb loading to top up glycogen stores.';
  }

  // P2: Refeed day (lose_fat / recomp) — untouched
  else if (goal === 'lose_fat' || goal === 'recomp') {
    const lastRefeed = profileRow.last_refeed_date;
    const daysSince = lastRefeed
      ? Math.floor((new Date(today) - new Date(lastRefeed)) / 86400000)
      : refeedInterval;

    if (daysSince >= refeedInterval) {
      protocolType = 'refeed';
      const maintenanceCals = Math.round(baseCalories * 1.2);
      const extraCarbs = Math.round((maintenanceCals - baseCalories) / 4);
      adjustedCalories = maintenanceCals;
      adjustedCarbs = baseCarbs + extraCarbs;
      adjustedFat = Math.max(20, baseFat - 10);
      adjustedProtein = baseProtein;
      reason = `${daysSince} days in deficit. Refeed day today — boosting carbs to maintenance to reset leptin and metabolism.`;
      await sb.from('profiles').upsert(
        { id: userId, last_refeed_date: today, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    }
  }

  // P4: Training-day bump — load-scaled from actual exercises, with deload discount.
  // Fires only for lifting days ('training' / 'custom'); cardio/run/hyrox days are excluded.
  // Falls back to a flat +150 kcal / +38g carbs when todaysExercises is null (no data).
  else if (isLiftingDay) {
    const bump = _trainingBump(todaysExercises, deloadActive);
    if (bump) {
      protocolType = 'training_day';
      adjustedCalories = baseCalories + bump.calBump;
      adjustedCarbs = baseCarbs + bump.carbBump;
      reason = bump.reason;
    }
  }

  // P4b: Run/cardio/hyrox day bump — uses the macroAdjustment from enrichRunSession.
  // Mutually exclusive with P4 (run/cardio/hyrox days are never lifting days per todayType).
  // macroAdjustment is carbs-only; convert to calories at 4 kcal/g (standard carb conversion).
  // Deload discount: halved, same proportion as the lifting branch.
  // Falls through to standard (null) when todaysRunSession is absent or macroAdjustment ≤ 0.
  else if (
    (todayType === 'run' || todayType === 'cardio' || todayType === 'hyrox') &&
    todaysRunSession?.macroAdjustment > 0
  ) {
    let carbBump = todaysRunSession.macroAdjustment;
    let calBump = carbBump * 4;
    if (deloadActive) {
      carbBump = Math.round(carbBump / 2);
      calBump = Math.round(calBump / 2);
    }
    const deloadNote = deloadActive ? ' (deload week — reduced)' : '';
    const sessionLabel = todaysRunSession.type || 'run session';
    protocolType = 'training_day';
    adjustedCalories = baseCalories + calBump;
    adjustedCarbs = baseCarbs + carbBump;
    reason = `run day${deloadNote} — +${carbBump}g carbs to support today's ${sessionLabel}.`;
  }

  if (protocolType === 'standard') return null;

  const { data: protocol } = await sb
    .from('nutrition_protocols')
    .upsert({
      user_id: userId,
      protocol_date: today,
      protocol_type: protocolType,
      base_calories: baseCalories,
      adjusted_calories: adjustedCalories,
      base_protein_g: baseProtein,
      adjusted_protein_g: adjustedProtein,
      base_carbs_g: baseCarbs,
      adjusted_carbs_g: adjustedCarbs,
      base_fat_g: baseFat,
      adjusted_fat_g: adjustedFat,
      reason,
    }, { onConflict: 'user_id,protocol_date' })
    .select()
    .maybeSingle();

  return protocol || null;
}
