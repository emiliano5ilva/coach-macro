import { sb } from '../client.js';

const DEFAULT_FACTORS = {
  logging_accuracy_factor: 1.0,   // multiplier on logged calories (0.85–1.15)
  workout_calorie_factor: 1.0,    // multiplier on EAT calculations (0.6–1.0)
  water_retention_sensitivity: 'medium', // low / medium / high
  last_recalibrated: null,
  data_days: 0,
};

// ─── Read / write ─────────────────────────────────────────────────────────────

export async function getAdaptiveFactors(userId) {
  if (!userId) return { ...DEFAULT_FACTORS };
  const { data } = await sb.from('profiles').select('adaptive_factors').eq('id', userId).single();
  const stored = data?.adaptive_factors;
  if (!stored || Object.keys(stored).length === 0) return { ...DEFAULT_FACTORS };
  return { ...DEFAULT_FACTORS, ...stored };
}

export async function saveAdaptiveFactors(userId, factors) {
  if (!userId) return;
  await sb.from('profiles').upsert(
    { id: userId, adaptive_factors: { ...factors, updated_at: new Date().toISOString() } },
    { onConflict: 'id' }
  );
}

// ─── Core detector ────────────────────────────────────────────────────────────

export async function detectSystematicBias(userId) {
  if (!userId) return { ...DEFAULT_FACTORS };

  const since = new Date(Date.now() - 60 * 864e5).toISOString().split('T')[0];
  const { data: insights } = await sb
    .from('validation_insights')
    .select('insight_type, priority, signals_aligned, date_generated, acted_upon')
    .eq('user_id', userId)
    .gte('date_generated', since)
    .order('date_generated', { ascending: false });

  if (!insights?.length) return { ...DEFAULT_FACTORS };

  const current = await getAdaptiveFactors(userId);

  // Count patterns across insight history
  const caloricLow = insights.filter(
    i => i.insight_type === 'calorie_intake' && (i.priority === 'severe' || i.priority === 'high')
  ).length;

  const weightFastLoss = insights.filter(
    i => i.insight_type === 'weight_trend' &&
      (i.signals_aligned || []).some(s => s.direction === 'severe' && String(s.value || '').includes('-'))
  ).length;

  const weightStalled = insights.filter(
    i => i.insight_type === 'weight_trend' &&
      (i.signals_aligned || []).some(s => s.direction === 'stalled')
  ).length;

  const totalDays = new Set(insights.map(i => i.date_generated)).size;
  const factors = { ...current, data_days: totalDays };

  // Logging accuracy factor
  // If repeatedly flagged as under-eating while weight drops fast → user is under-reporting food
  // logging_accuracy_factor > 1 means "actual intake is higher than logged"
  if (caloricLow >= 4 && weightFastLoss >= 2 && totalDays >= 14) {
    // Strong signal: they say they eat little AND weight is dropping fast → not under-eating, under-reporting
    factors.logging_accuracy_factor = clamp(current.logging_accuracy_factor + 0.03, 0.85, 1.15);
  } else if (caloricLow >= 4 && weightStalled >= 3 && totalDays >= 21) {
    // They report low cals but weight isn't dropping → under-reporting
    factors.logging_accuracy_factor = clamp(current.logging_accuracy_factor + 0.04, 0.85, 1.15);
  } else if (caloricLow === 0 && weightFastLoss >= 3 && totalDays >= 14) {
    // Cals look fine but weight dropping fast → they may actually be eating less than logged
    factors.logging_accuracy_factor = clamp(current.logging_accuracy_factor - 0.02, 0.85, 1.15);
  }

  // Workout calorie factor
  // Check tdee_history for systematic gap between estimated burn and TDEE
  const { data: tdeeRows } = await sb
    .from('tdee_history')
    .select('calculated_tdee, total_estimated_burn')
    .eq('user_id', userId)
    .gte('date', since)
    .gt('total_estimated_burn', 0)
    .gt('calculated_tdee', 0)
    .order('date', { ascending: false })
    .limit(30);

  if (tdeeRows?.length >= 7) {
    const diffs = tdeeRows.map(r => (r.total_estimated_burn - r.calculated_tdee) / r.calculated_tdee);
    const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
    // If estimated burn consistently > TDEE by >15%, workout cals are over-estimated
    if (avgDiff > 0.15) {
      factors.workout_calorie_factor = clamp(current.workout_calorie_factor - 0.04, 0.6, 1.0);
    } else if (avgDiff > 0.08) {
      factors.workout_calorie_factor = clamp(current.workout_calorie_factor - 0.02, 0.6, 1.0);
    } else if (avgDiff < -0.05) {
      factors.workout_calorie_factor = clamp(current.workout_calorie_factor + 0.02, 0.6, 1.0);
    }
  }

  // Water retention sensitivity
  // Look at bodyweight_logs for spike-normalize patterns
  const { data: bwLogs } = await sb
    .from('bodyweight_logs')
    .select('weight, unit, created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at');

  if (bwLogs?.length >= 10) {
    const weights = bwLogs.map(l => parseFloat(l.weight) * (l.unit === 'kg' ? 2.205 : 1));
    const spikes = countSpikeAndNormalize(weights);
    if (spikes >= 3) factors.water_retention_sensitivity = 'high';
    else if (spikes >= 1) factors.water_retention_sensitivity = 'medium';
    else factors.water_retention_sensitivity = 'low';
  }

  factors.last_recalibrated = new Date().toISOString().split('T')[0];
  return factors;
}

// ─── Apply factors to a raw TDEE calculation result ──────────────────────────

export function applyAdaptiveFactors(rawResult, factors) {
  if (!factors || factors.data_days < 7) return rawResult; // not enough data yet

  const lf = factors.logging_accuracy_factor ?? 1.0;
  const wf = factors.workout_calorie_factor ?? 1.0;

  // Adjust the algorithmic TDEE by logging accuracy
  // If user under-reports, their "real" calorie intake is higher → TDEE estimate should be higher
  const adjustedTDEE = Math.round((rawResult.tdee || 0) * lf);
  const adjustedEAT  = Math.round((rawResult.todaysBurn?.eat || 0) * wf);

  const todaysBurn = rawResult.todaysBurn
    ? {
        ...rawResult.todaysBurn,
        eat: adjustedEAT,
        total: Math.round(
          (rawResult.todaysBurn.bmr || 0) +
          (rawResult.todaysBurn.neat || 0) +
          adjustedEAT +
          (rawResult.todaysBurn.tef || 0)
        ),
      }
    : rawResult.todaysBurn;

  return {
    ...rawResult,
    tdee: adjustedTDEE,
    todaysBurn,
    adaptiveFactors: factors,
    factorsApplied: lf !== 1.0 || wf !== 1.0,
  };
}

// ─── Weekly recalibration ─────────────────────────────────────────────────────

export async function recalibrateFactors(userId) {
  if (!userId) return;

  const current = await getAdaptiveFactors(userId);

  // Only recalibrate weekly
  if (current.last_recalibrated) {
    const lastDate = new Date(current.last_recalibrated);
    const daysSince = (Date.now() - lastDate.getTime()) / 864e5;
    if (daysSince < 6) return current;
  }

  // Need at least 14 days of data
  if ((current.data_days || 0) < 14) return current;

  // Compare predicted weight change vs actual
  const twoWeeksAgo = new Date(Date.now() - 14 * 864e5).toISOString().split('T')[0];
  const { data: tdeeRows } = await sb
    .from('tdee_history')
    .select('date, calculated_tdee, avg_calories')
    .eq('user_id', userId)
    .gte('date', twoWeeksAgo)
    .order('date');

  const { data: bwLogs } = await sb
    .from('bodyweight_logs')
    .select('weight, unit, created_at')
    .eq('user_id', userId)
    .gte('created_at', twoWeeksAgo)
    .order('created_at');

  if (!tdeeRows?.length || !bwLogs?.length || bwLogs.length < 3) return current;

  // Predicted weight change: sum(avg_cals - calculated_tdee) / 3500
  const totalCalBalance = tdeeRows.reduce((s, r) =>
    s + ((r.avg_calories || 0) - (r.calculated_tdee || 0)), 0);
  const predictedLbsChange = totalCalBalance / 3500;

  // Actual weight change
  const firstWeight = parseFloat(bwLogs[0].weight) * (bwLogs[0].unit === 'kg' ? 2.205 : 1);
  const lastWeight  = parseFloat(bwLogs[bwLogs.length - 1].weight) * (bwLogs[bwLogs.length - 1].unit === 'kg' ? 2.205 : 1);
  const actualLbsChange = lastWeight - firstWeight;

  const predictionError = Math.abs(predictedLbsChange - actualLbsChange);

  if (predictionError > 1.5) {
    // Significant miss — adjust logging accuracy factor
    // If predicted more loss than actual → user eats more than logged → increase factor
    if (predictedLbsChange < actualLbsChange - 1.5) {
      current.logging_accuracy_factor = clamp(current.logging_accuracy_factor + 0.03, 0.85, 1.15);
    } else if (predictedLbsChange > actualLbsChange + 1.5) {
      current.logging_accuracy_factor = clamp(current.logging_accuracy_factor - 0.03, 0.85, 1.15);
    }
  }
  // Within 5% — factors are good, keep them
  // Mark recalibrated
  current.last_recalibrated = new Date().toISOString().split('T')[0];
  await saveAdaptiveFactors(userId, current);
  return current;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function countSpikeAndNormalize(weights) {
  let count = 0;
  for (let i = 1; i < weights.length - 2; i++) {
    const prev = weights[i - 1];
    const curr = weights[i];
    const next = weights[i + 1];
    // Spike: jump up >2 lbs followed by drop back within 3 days
    if (curr - prev > 2 && next < curr - 1) count++;
  }
  return count;
}
