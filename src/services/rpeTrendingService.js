import { sb } from '../client';

const THRESHOLDS = {
  rpe_drift_amount: 1.5,
  session_rpe_warning: 8.5,
  divergence_threshold: 1.0,
};

function computeSessionRPE(workout) {
  const allSets = (workout?.exercises || [])
    .flatMap(ex => ex.sets || [])
    .filter(s => s.done && s.rpe != null);
  if (!allSets.length) return null;
  return allSets.reduce((sum, s) => sum + s.rpe, 0) / allSets.length;
}

export async function analyseRPETrends(userId) {
  if (!userId) return null;
  const sixWeeksAgo = new Date(Date.now() - 42 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data: logs } = await sb
    .from('workout_logs')
    .select('date, workout')
    .eq('user_id', userId)
    .gte('date', sixWeeksAgo)
    .order('date', { ascending: true });

  if (!logs || logs.length < 3) return null;

  const fatigueSignals = [];

  // ── SESSION RPE DRIFT ──────────────────────────────────────────────────────
  const logsWithRPE = logs
    .map(l => ({ ...l, sessionRPE: computeSessionRPE(l.workout) }))
    .filter(l => l.sessionRPE != null);

  if (logsWithRPE.length >= 3) {
    const recent = logsWithRPE.slice(-5);
    const firstRPE = recent[0].sessionRPE;
    const lastRPE = recent[recent.length - 1].sessionRPE;
    const rpeIncrease = lastRPE - firstRPE;

    if (rpeIncrease >= THRESHOLDS.rpe_drift_amount) {
      fatigueSignals.push({
        type: 'session_rpe_drift',
        severity: rpeIncrease >= 2.5 ? 'high' : 'medium',
        message: `Session RPE has risen from ${firstRPE.toFixed(1)} to ${lastRPE.toFixed(1)} over the last ${recent.length} sessions.`,
        firstRPE, lastRPE,
        rpeIncrease: Math.round(rpeIncrease * 10) / 10,
        sessions: recent.length,
      });
    }

    const allAboveThreshold = recent.slice(-3).every(s => s.sessionRPE >= THRESHOLDS.session_rpe_warning);
    if (allAboveThreshold) {
      fatigueSignals.push({
        type: 'sustained_high_rpe',
        severity: 'high',
        message: `Session RPE has been ${THRESHOLDS.session_rpe_warning}+ for 3 consecutive sessions.`,
      });
    }
  }

  // ── EXERCISE RPE DRIFT ─────────────────────────────────────────────────────
  const exerciseRPEHistory = {};
  logs.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      if (!exerciseRPEHistory[ex.name]) exerciseRPEHistory[ex.name] = [];
      const doneSets = (ex.sets || []).filter(s => s.done && s.rpe != null);
      if (!doneSets.length) return;
      const avgExRPE = doneSets.reduce((sum, s) => sum + s.rpe, 0) / doneSets.length;
      const maxWeight = Math.max(...doneSets.map(s => parseFloat(s.weight) || 0));
      exerciseRPEHistory[ex.name].push({ date: log.date, avgRPE: avgExRPE, maxWeight });
    });
  });

  Object.entries(exerciseRPEHistory).forEach(([exerciseName, history]) => {
    if (history.length < 3) return;
    const recent = history.slice(-4);
    const firstEntry = recent[0];
    const lastEntry = recent[recent.length - 1];
    const rpeDrift = lastEntry.avgRPE - firstEntry.avgRPE;
    const weightSame = Math.abs(lastEntry.maxWeight - firstEntry.maxWeight) <= 2.5;

    if (rpeDrift >= THRESHOLDS.rpe_drift_amount && weightSame) {
      fatigueSignals.push({
        type: 'exercise_rpe_drift',
        severity: rpeDrift >= 2.0 ? 'high' : 'medium',
        exercise: exerciseName,
        message: `${exerciseName}: same weight but RPE went from ${firstEntry.avgRPE.toFixed(1)} to ${lastEntry.avgRPE.toFixed(1)} over ${recent.length} sessions.`,
        rpeDrift: Math.round(rpeDrift * 10) / 10,
        sessions: recent.length,
        currentWeight: lastEntry.maxWeight,
        firstRPE: firstEntry.avgRPE,
        lastRPE: lastEntry.avgRPE,
      });
    }

    if (rpeDrift >= THRESHOLDS.divergence_threshold && lastEntry.maxWeight <= firstEntry.maxWeight) {
      fatigueSignals.push({
        type: 'rpe_performance_divergence',
        severity: 'high',
        exercise: exerciseName,
        message: `${exerciseName}: effort increasing while weight is not progressing. Classic fatigue signal.`,
        rpeDrift: Math.round(rpeDrift * 10) / 10,
      });
    }
  });

  if (fatigueSignals.length === 0) return null;

  const highSignals = fatigueSignals.filter(s => s.severity === 'high').length;
  const overallFatigue = highSignals >= 2 ? 'high'
    : (highSignals === 1 || fatigueSignals.length >= 2) ? 'medium'
    : 'low';

  return {
    fatigueSignals,
    overallFatigue,
    signalCount: fatigueSignals.length,
    topSignal: [...fatigueSignals].sort((a, b) =>
      (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)
    )[0],
  };
}

export async function getExerciseRPETrend(userId, exerciseName) {
  if (!userId || !exerciseName) return [];
  const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data: logs } = await sb
    .from('workout_logs')
    .select('date, workout')
    .eq('user_id', userId)
    .gte('date', twelveWeeksAgo)
    .order('date', { ascending: true });

  if (!logs?.length) return [];

  const trend = [];
  logs.forEach(log => {
    const exercise = log.workout?.exercises?.find(e => e.name === exerciseName);
    if (!exercise) return;
    const doneSets = (exercise.sets || []).filter(s => s.done && s.rpe != null);
    if (!doneSets.length) return;
    const avgRPE = doneSets.reduce((sum, s) => sum + s.rpe, 0) / doneSets.length;
    const maxWeight = Math.max(...doneSets.map(s => parseFloat(s.weight) || 0));
    trend.push({ date: log.date, avgRPE: Math.round(avgRPE * 10) / 10, maxWeight });
  });

  return trend;
}
