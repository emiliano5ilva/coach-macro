import { sb } from '../client';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function getTodayNutritionProtocol(userId) {
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
    .select('profile_data, wprefs, goal, hyrox_race_date, last_refeed_date')
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
  const schedule = wp.schedule || {};
  const dayFocus = wp.dayFocus || {};
  const todayType = schedule[todayKey] || 'rest';
  const todayFocusVal = (dayFocus[todayKey] || '').toLowerCase();
  const isTrainingDay = todayType !== 'rest';

  const refeedInterval = wp.refeed_day_interval ?? profileRow.refeed_day_interval ?? 7;
  // calorie_cycling_enabled (build_muscle +250 branch) removed in Phase 4 rationalisation.
  // getDayTypeNutrition is now the single per-day target system for ring + plan.

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

  // P1: Race day / carb load
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

  // P2: Refeed day (lose_fat / recomp)
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

  // P4: Heavy session boost (leg / lower / full body day)
  else if (isTrainingDay && (
    todayFocusVal.includes('leg') || todayFocusVal.includes('lower') || todayFocusVal.includes('full')
  )) {
    protocolType = 'training_day';
    adjustedCalories = baseCalories + 150;
    adjustedCarbs = baseCarbs + Math.round(150 / 4);
    reason = 'Heavy session today — slight carb increase to support leg/full body training.';
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
