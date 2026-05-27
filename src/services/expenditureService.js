import { sb } from "../client.js";

const EWMA_ALPHA = 0.1;

// MET values for common cardio activity types (kcal / kg / hour)
export const MET_VALUES = {
  run:      9.0,
  running:  9.0,
  ride:     7.0,
  cycling:  7.0,
  bike:     7.0,
  swim:     7.0,
  swimming: 7.0,
  walk:     3.5,
  walking:  3.5,
  hike:     5.3,
  hiit:     8.0,
  crossfit: 8.0,
  elliptical: 5.5,
  rowing:   7.0,
  default:  5.0,
};

// Estimated range of motion (metres) per rep by exercise category.
function estimateROM(name) {
  const n = (name || '').toLowerCase();
  if (/squat|deadlift|rdl|good.morning|hip.thrust/.test(n)) return 0.65;
  if (/row|pull.?up|chin.?up|lat.?pull/.test(n))            return 0.60;
  if (/bench|press|lunge|step.?up|dip/.test(n))             return 0.50;
  if (/curl|extension|fly|raise|pushdown|kickback/.test(n)) return 0.40;
  return 0.50;
}

// ── BMR ──────────────────────────────────────────────────────────────────────

// Pure Mifflin-St Jeor BMR with no activity multiplier.
export function computeBMR(profile) {
  const wKg = profile.wUnit === 'lbs'
    ? parseFloat(profile.weight || 180) * 0.4536
    : parseFloat(profile.weight || 80);
  const hCm = (profile.hUnit === 'ft' || (!profile.hUnit && profile.hFt))
    ? (parseInt(profile.hFt || 5) * 12 + parseInt(profile.hIn || 10)) * 2.54
    : parseFloat(profile.hCm || profile.height_cm || 178);
  const age  = Math.max(13, new Date().getFullYear() - parseInt(profile.dobYear || 2000));
  const male = profile.sex === 'male';
  return Math.round(10 * wKg + 6.25 * hCm - 5 * age + (male ? 5 : -161));
}

// ── NEAT ─────────────────────────────────────────────────────────────────────

// Steps → NEAT kcal, bodyweight-scaled.
// Formula: steps × (bw_lbs / 150) × 0.04
export function computeNEAT(steps, bodyweightLbs) {
  if (!steps || steps <= 0) return 0;
  const scale = (bodyweightLbs || 150) / 150;
  return Math.round(steps * scale * 0.04);
}

// ── EAT: strength workout (mechanical work) ───────────────────────────────

// Compute EAT from a workout_log row using set-level mechanical work.
// workoutLog: { workout: { exercises: [{name, sets: [{weight, reps, done}]}] }, session_duration_mins }
// weightLbs: user's current bodyweight in lbs (for scaling, not used in formula but kept for future)
export function computeEATFromWorkoutLog(workoutLog, bodyweightLbs) {
  const exercises = workoutLog?.workout?.exercises || [];
  if (!exercises.length) return 0;

  let totalCal = 0;
  for (const ex of exercises) {
    const rom = estimateROM(ex.name);
    for (const set of ex.sets || []) {
      // Only count sets that were actually done (sets with done===false are skipped)
      if (set.done === false) continue;
      const weightLbs = parseFloat(set.weight) || 0;
      const reps = parseInt(set.reps) || 0;
      if (!weightLbs || !reps) continue;
      const weightKg = weightLbs * 0.4536;
      // Mechanical work (J) = force (N) × distance (m) × reps
      const workJ = weightKg * 9.81 * rom * reps;
      // 0.0035 kcal per joule of mechanical work (~25% mechanical efficiency)
      totalCal += workJ * 0.0035;
    }
  }
  return Math.round(totalCal);
}

// ── EAT: external cardio activity ────────────────────────────────────────

// Compute EAT from an allActs entry (Strava / HealthKit / Garmin).
// Cardio types → MET formula; strength/unknown → 0.7× tracked calories.
export function computeEATFromActivity(act, bodyweightKg) {
  const bwKg = bodyweightKg || 70;
  const durationHours = (parseInt(act.durationMin) || 0) / 60;
  if (!durationHours) return 0;

  const typeRaw = (act.type || '').toLowerCase();
  const isCardio = /run|ride|cycl|swim|walk|hike|elliptic|row/.test(typeRaw);

  if (isCardio) {
    // MET-based calculation — most accurate for continuous cardio
    let met = MET_VALUES.default;
    for (const [key, val] of Object.entries(MET_VALUES)) {
      if (typeRaw.includes(key)) { met = val; break; }
    }
    const metCalories = Math.round(met * bwKg * durationHours);
    // If tracker also has a calories figure, use the lower of the two (conservative)
    if (act.calories > 0) {
      return Math.min(metCalories, Math.round(act.calories * 0.7));
    }
    return metCalories;
  }

  // Strength / unknown HealthKit activities — don't trust tracker calories
  if (act.calories > 0) return Math.round(act.calories * 0.7);
  // No calories and no cardio type — estimate from duration at light effort
  return Math.round(MET_VALUES.default * bwKg * durationHours);
}

// ── Today's total burn ────────────────────────────────────────────────────

// Compose BMR + NEAT + EAT + TEF for a specific day's data.
// workoutLogsToday: workout_log rows for today
// actsToday:        allActs entries for today (Strava, HealthKit, Garmin)
// healthSnap:       { steps, calories, ... } from HealthKit
// profile:          user profile for bodyweight/unit lookups
// tef:              TEF kcal already computed from food logs
export function computeTodaysBurn(workoutLogsToday, actsToday, healthSnap, profile, tef = 0) {
  const wLbs = profile.wUnit === 'kg'
    ? parseFloat(profile.weight || 70) * 2.205
    : parseFloat(profile.weight || 150);
  const wKg = wLbs * 0.4536;

  const bmr  = computeBMR(profile);
  const neat  = computeNEAT(healthSnap?.steps || 0, wLbs);

  // Strength EAT: use detailed mechanical work from in-app workout logs
  const strengthEAT = (workoutLogsToday || []).reduce(
    (sum, log) => sum + computeEATFromWorkoutLog(log, wLbs), 0
  );

  // Cardio EAT: only cardio activities from external trackers (avoid double-counting strength)
  const cardioRx = /run|ride|cycl|swim|walk|hike|elliptic|row/i;
  const cardioActs = (actsToday || []).filter(a => cardioRx.test(a.type || ''));
  const cardioEAT = cardioActs.reduce(
    (sum, act) => sum + computeEATFromActivity(act, wKg), 0
  );

  // Other external activities (strength-type from HealthKit) — only use if no detailed logs
  const otherActs = (actsToday || []).filter(a => !cardioRx.test(a.type || ''));
  const otherEAT  = strengthEAT > 0
    ? 0
    : otherActs.reduce((sum, act) => sum + (act.calories ? Math.round(act.calories * 0.7) : 0), 0);

  const eat   = strengthEAT + cardioEAT + otherEAT;
  const total = bmr + neat + eat + tef;

  return {
    bmr:          Math.round(bmr),
    neat:         Math.round(neat),
    eat:          Math.round(eat),
    tef,
    total:        Math.round(total),
    noHealthKit:  !healthSnap?.steps,
    hasWorkout:   (workoutLogsToday || []).length > 0 || cardioActs.length > 0,
  };
}

// ── Cross-validation (data drift) ────────────────────────────────────────

// Compare algorithmic TDEE vs component-sum TDEE over the last 7 stored days.
// Returns a warning object or null if no consistent drift.
export function checkDataDrift(history) {
  const withBoth = (history || [])
    .filter(r => (r.total_estimated_burn || 0) > 0 && (r.calculated_tdee || 0) > 0)
    .slice(-7);

  if (withBoth.length < 7) return null;

  const diffs = withBoth.map(r => r.total_estimated_burn - r.calculated_tdee);
  const pcts  = withBoth.map((r, i) => diffs[i] / r.calculated_tdee);

  const allOver  = pcts.every(p => p >  0.20);
  const allUnder = pcts.every(p => p < -0.20);
  if (!allOver && !allUnder) return null;

  const avgDiff = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length);

  return {
    direction: avgDiff > 0 ? 'over' : 'under',
    avgDiff:   Math.abs(avgDiff),
    message: avgDiff > 0
      ? `Your tracked activity suggests ${Math.abs(avgDiff)} kcal/day higher burn than your weight trend shows. Likely culprits: cooking oils, restaurant portions, or BLTs (bites, licks, tastes) not logged.`
      : `Your weight is dropping faster than logged activity implies. You may be burning more than tracked, or eating less than you think.`,
  };
}

// ── Phase-1 EWMA + rolling-average TDEE ─────────────────────────────────

export function applyEWMA(logs, alpha = EWMA_ALPHA) {
  if (!logs?.length) return [];
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let smoothed = parseFloat(sorted[0].weight);
  return sorted.map(log => {
    smoothed = alpha * parseFloat(log.weight) + (1 - alpha) * smoothed;
    return { date: log.date, raw: parseFloat(log.weight), ewma: smoothed };
  });
}

function buildDailyCalMap(foodLogs, cutoffDate) {
  const map = {};
  for (const log of foodLogs || []) {
    if (log.date < cutoffDate) continue;
    const entries = log.entries || [];
    if (!entries.length) continue;
    map[log.date] = {
      cal:   entries.reduce((s, e) => s + (e.calories || 0), 0),
      prot:  entries.reduce((s, e) => s + (e.protein  || 0), 0),
      carbs: entries.reduce((s, e) => s + (e.carbs    || 0), 0),
      fat:   entries.reduce((s, e) => s + (e.fat      || 0), 0),
    };
  }
  return map;
}

export function computeTEF(proteinG, carbsG, fatG) {
  return Math.round(proteinG * 4 * 0.25 + carbsG * 4 * 0.08 + fatG * 9 * 0.03);
}

export function getConfidence(dataDays) {
  if (dataDays < 7)  return { level: 'building', label: 'Building baseline', showNumber: false, showRange: false };
  if (dataDays < 14) return { level: 'low',      label: 'Early estimate',    showNumber: true,  showRange: true  };
  if (dataDays < 30) return { level: 'medium',   label: 'Medium confidence', showNumber: true,  showRange: false };
  return               { level: 'high',     label: 'High confidence',   showNumber: true,  showRange: false };
}

// Mifflin-St Jeor with activity multiplier — used for cold-start TDEE estimate.
export function mifflinStJeorTDEE(profile) {
  const bmr     = computeBMR(profile);
  const actMult = { sedentary: 1.2, moderate: 1.375, very: 1.55 }[profile.activity] ?? 1.375;
  return Math.round(bmr * actMult);
}

function blendWithFormula(formulaTDEE, dataDrivenTDEE, dataDays) {
  if (dataDays <= 0)  return formulaTDEE;
  if (dataDays >= 30) return dataDrivenTDEE;
  const fw = dataDays < 14
    ? 1 - (dataDays / 14) * 0.8
    : 0.2 * (1 - (dataDays - 14) / 16);
  return Math.round(formulaTDEE * fw + dataDrivenTDEE * (1 - fw));
}

export function computeExpenditure(weightLogs, foodLogs, profile) {
  const today    = new Date().toISOString().split('T')[0];
  const cutoff14 = new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0];
  const cutoff30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const ewmaAll    = applyEWMA(weightLogs);
  const ewma14     = ewmaAll.filter(e => e.date >= cutoff14);
  const weightDays = ewma14.length;

  const calMap14   = buildDailyCalMap(foodLogs, cutoff14);
  const calDays    = Object.values(calMap14);
  const foodDays   = calDays.length;

  const dataDays   = Math.max(foodDays, weightDays);
  const confidence = getConfidence(dataDays);

  const bmr         = computeBMR(profile);
  const formulaTDEE = mifflinStJeorTDEE(profile);

  let avgCalories = 0, avgProtein = 0, avgCarbs = 0, avgFat = 0;
  if (foodDays >= 1) {
    avgCalories = Math.round(calDays.reduce((s, d) => s + d.cal,   0) / foodDays);
    avgProtein  = Math.round(calDays.reduce((s, d) => s + d.prot,  0) / foodDays);
    avgCarbs    = Math.round(calDays.reduce((s, d) => s + d.carbs, 0) / foodDays);
    avgFat      = Math.round(calDays.reduce((s, d) => s + d.fat,   0) / foodDays);
  }

  let dataDrivenTDEE = null;
  if (weightDays >= 2 && foodDays >= 3) {
    const firstE = ewma14[0];
    const lastE  = ewma14[ewma14.length - 1];
    const weightChangeLbs = profile.wUnit === 'kg'
      ? (lastE.ewma - firstE.ewma) * 2.205
      : lastE.ewma - firstE.ewma;
    const daySpan = Math.max(1,
      (new Date(lastE.date) - new Date(firstE.date)) / 864e5
    );
    const raw = avgCalories - (weightChangeLbs * 3500 / daySpan);
    if (raw >= 800 && raw <= 7000) dataDrivenTDEE = Math.round(raw);
  }

  const calculatedTDEE = dataDrivenTDEE !== null
    ? blendWithFormula(formulaTDEE, dataDrivenTDEE, dataDays)
    : formulaTDEE;

  const tef = computeTEF(avgProtein, avgCarbs, avgFat);

  const trendWeight = ewmaAll.length
    ? ewmaAll[ewmaAll.length - 1].ewma
    : parseFloat(profile.weight || 0);

  return {
    tdee: calculatedTDEE,
    bmr,
    formulaTDEE,
    dataDrivenTDEE,
    confidence,
    dataDays,
    tef,
    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    trendWeight,
    ewmaSeries: ewmaAll.filter(e => e.date >= cutoff30),
    date: today,
  };
}

// ── Persistence ───────────────────────────────────────────────────────────

// Upsert today's full expenditure snapshot including activity breakdown.
export async function storeExpenditure(userId, result, todaysBurn = null) {
  await sb.from('tdee_history').upsert({
    user_id:              userId,
    date:                 result.date,
    calculated_tdee:      result.tdee,
    formula_tdee:         result.formulaTDEE,
    data_driven_tdee:     result.dataDrivenTDEE,
    confidence_score:     result.confidence.level,
    data_days_used:       result.dataDays,
    tef_calories:         result.tef,
    avg_calories:         result.avgCalories,
    avg_protein_g:        result.avgProtein,
    avg_carbs_g:          result.avgCarbs,
    avg_fat_g:            result.avgFat,
    bmr:                  todaysBurn?.bmr  ?? result.bmr,
    neat:                 todaysBurn?.neat ?? 0,
    eat:                  todaysBurn?.eat  ?? 0,
    total_estimated_burn: todaysBurn?.total ?? 0,
    updated_at:           new Date().toISOString(),
  }, { onConflict: 'user_id,date' });
}

export async function getExpenditureHistory(userId, days = 30) {
  const since = new Date(Date.now() - days * 864e5).toISOString().split('T')[0];
  const { data } = await sb.from('tdee_history')
    .select('date,calculated_tdee,confidence_score,data_days_used,total_estimated_burn,bmr,neat,eat')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true });
  return data || [];
}
