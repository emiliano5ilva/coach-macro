import { sb } from "../client.js";

const EWMA_ALPHA = 0.1;

// Apply Exponentially Weighted Moving Average to sorted weight logs.
// Returns [{date, raw, ewma}] — trend weight is the `ewma` field.
export function applyEWMA(logs, alpha = EWMA_ALPHA) {
  if (!logs?.length) return [];
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  let smoothed = parseFloat(sorted[0].weight);
  return sorted.map(log => {
    smoothed = alpha * parseFloat(log.weight) + (1 - alpha) * smoothed;
    return { date: log.date, raw: parseFloat(log.weight), ewma: smoothed };
  });
}

// Aggregate food log entries into a per-day map for dates >= cutoffDate.
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

// Accurate TEF: protein 25%, carbs 8%, fat 3% of their caloric contribution.
export function computeTEF(proteinG, carbsG, fatG) {
  return Math.round(proteinG * 4 * 0.25 + carbsG * 4 * 0.08 + fatG * 9 * 0.03);
}

export function getConfidence(dataDays) {
  if (dataDays < 7)  return { level: 'building', label: 'Building baseline', showNumber: false, showRange: false };
  if (dataDays < 14) return { level: 'low',      label: 'Early estimate',    showNumber: true,  showRange: true  };
  if (dataDays < 30) return { level: 'medium',   label: 'Medium confidence', showNumber: true,  showRange: false };
  return               { level: 'high',     label: 'High confidence',   showNumber: true,  showRange: false };
}

// Mifflin-St Jeor with activity multiplier — used for cold-start baseline.
export function mifflinStJeorTDEE(profile) {
  const wKg = profile.wUnit === 'lbs'
    ? parseFloat(profile.weight || 180) * 0.4536
    : parseFloat(profile.weight || 80);
  const hCm = (profile.hUnit === 'ft' || (!profile.hUnit && profile.hFt))
    ? (parseInt(profile.hFt || 5) * 12 + parseInt(profile.hIn || 10)) * 2.54
    : parseFloat(profile.hCm || profile.height_cm || 178);
  const age  = Math.max(13, new Date().getFullYear() - parseInt(profile.dobYear || 2000));
  const male = profile.sex === 'male';
  const bmr  = 10 * wKg + 6.25 * hCm - 5 * age + (male ? 5 : -161);
  const actMult = { sedentary: 1.2, moderate: 1.375, very: 1.55 }[profile.activity] ?? 1.375;
  return Math.round(bmr * actMult);
}

// Linearly blend formula estimate out as real data accumulates.
// day 1: 100% formula | day 14: 20% formula | day 30+: 0% formula
function blendWithFormula(formulaTDEE, dataDrivenTDEE, dataDays) {
  if (dataDays <= 0)  return formulaTDEE;
  if (dataDays >= 30) return dataDrivenTDEE;
  const fw = dataDays < 14
    ? 1 - (dataDays / 14) * 0.8
    : 0.2 * (1 - (dataDays - 14) / 16);
  return Math.round(formulaTDEE * fw + dataDrivenTDEE * (1 - fw));
}

// Core synchronous computation — accepts already-fetched arrays.
// weightLogs: [{date, weight}] in profile.wUnit units
// foodLogs:   [{date, entries}] entries have {calories, protein, carbs, fat}
export function computeExpenditure(weightLogs, foodLogs, profile) {
  const today        = new Date().toISOString().split('T')[0];
  const cutoff14     = new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0];
  const cutoff30     = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  // EWMA over full available history for stable trend
  const ewmaAll      = applyEWMA(weightLogs);
  const ewma14       = ewmaAll.filter(e => e.date >= cutoff14);
  const weightDays   = ewma14.length;

  // 14-day calorie window
  const calMap14     = buildDailyCalMap(foodLogs, cutoff14);
  const calDays      = Object.values(calMap14);
  const foodDays     = calDays.length;

  // Confidence based on combined data availability
  const dataDays     = Math.max(foodDays, weightDays);
  const confidence   = getConfidence(dataDays);

  const formulaTDEE  = mifflinStJeorTDEE(profile);

  // Macro averages for TEF and display
  let avgCalories = 0, avgProtein = 0, avgCarbs = 0, avgFat = 0;
  if (foodDays >= 1) {
    avgCalories = Math.round(calDays.reduce((s, d) => s + d.cal,   0) / foodDays);
    avgProtein  = Math.round(calDays.reduce((s, d) => s + d.prot,  0) / foodDays);
    avgCarbs    = Math.round(calDays.reduce((s, d) => s + d.carbs, 0) / foodDays);
    avgFat      = Math.round(calDays.reduce((s, d) => s + d.fat,   0) / foodDays);
  }

  // Data-driven TDEE requires at least 2 weight measurements and 3 food days
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
    // Sanity bounds: discard clearly impossible values
    if (raw >= 800 && raw <= 7000) dataDrivenTDEE = Math.round(raw);
  }

  const calculatedTDEE = dataDrivenTDEE !== null
    ? blendWithFormula(formulaTDEE, dataDrivenTDEE, dataDays)
    : formulaTDEE;

  const tef = computeTEF(avgProtein, avgCarbs, avgFat);

  // Trend weight = last EWMA value
  const trendWeight = ewmaAll.length
    ? ewmaAll[ewmaAll.length - 1].ewma
    : parseFloat(profile.weight || 0);

  return {
    tdee: calculatedTDEE,
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

// Persist today's result to tdee_history (upsert).
export async function storeExpenditure(userId, result) {
  await sb.from('tdee_history').upsert({
    user_id:          userId,
    date:             result.date,
    calculated_tdee:  result.tdee,
    formula_tdee:     result.formulaTDEE,
    data_driven_tdee: result.dataDrivenTDEE,
    confidence_score: result.confidence.level,
    data_days_used:   result.dataDays,
    tef_calories:     result.tef,
    avg_calories:     result.avgCalories,
    avg_protein_g:    result.avgProtein,
    avg_carbs_g:      result.avgCarbs,
    avg_fat_g:        result.avgFat,
    updated_at:       new Date().toISOString(),
  }, { onConflict: 'user_id,date' });
}

// Fetch stored TDEE history for sparkline.
export async function getExpenditureHistory(userId, days = 30) {
  const since = new Date(Date.now() - days * 864e5).toISOString().split('T')[0];
  const { data } = await sb.from('tdee_history')
    .select('date,calculated_tdee,confidence_score,data_days_used')
    .eq('user_id', userId)
    .gte('date', since)
    .order('date', { ascending: true });
  return data || [];
}
