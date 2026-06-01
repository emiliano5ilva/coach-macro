export function computeTrainingStress(workoutLog) {
  const duration = workoutLog.session_duration_mins ?? 0;
  const type = (workoutLog.workout?.type ?? workoutLog.workout?.focus ?? 'strength').toLowerCase();

  const intensityFactor =
    type.includes('easy run')   ? 0.65 :
    type.includes('long run')   ? 0.70 :
    type.includes('tempo')      ? 0.88 :
    type.includes('interval')   ? 1.00 :
    type.includes('hyrox')      ? 1.00 :
    type.includes('metcon')     ? 1.00 :
    type.includes('recovery')   ? 0.50 :
    type.includes('rest')       ? 0.00 :
    type.includes('strength')   ? 0.75 :
    0.75;

  const hours = duration / 60;
  return Math.min(150, Math.round(hours * intensityFactor * intensityFactor * 100));
}

export function computeLoadMetrics(workoutLogs) {
  if (!workoutLogs?.length) {
    return { ctl: 0, atl: 0, tsb: 0, trend: 'neutral' };
  }

  // Build daily TSS map
  const tssMap = {};
  workoutLogs.forEach(log => {
    const date = log.date;
    tssMap[date] = (tssMap[date] ?? 0) + computeTrainingStress(log);
  });

  const ctlDecay = 1 / 42;
  const atlDecay = 1 / 7;
  let ctl = 0, atl = 0;

  const today = new Date();
  for (let i = 41; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const tss = tssMap[dateStr] ?? 0;
    ctl = ctl * (1 - ctlDecay) + tss * ctlDecay;
    if (i < 7) {
      atl = atl * (1 - atlDecay) + tss * atlDecay;
    }
  }

  const tsb = Math.round(ctl - atl);
  const trend =
    tsb > 5   ? 'fresh' :
    tsb > -10 ? 'neutral' :
    tsb > -25 ? 'fatigued' :
    'overreached';

  return { ctl: Math.round(ctl), atl: Math.round(atl), tsb, trend };
}
