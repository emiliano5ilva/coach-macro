export function getStrengthPhase(compDate) {
  if (!compDate) return null;
  const weeksUntilComp = Math.floor(
    (new Date(compDate) - new Date()) / (1000 * 60 * 60 * 24 * 7)
  );

  if (weeksUntilComp > 16) return {
    phase: 'hypertrophy',
    label: 'HYPERTROPHY BLOCK',
    description: 'Building muscle mass and work capacity. Higher reps, moderate weight, more volume.',
    weeksUntilRace: weeksUntilComp,
    color: '#22c55e',
    repRange: '8-12',
    intensityPct: 65,
  };

  if (weeksUntilComp > 12) return {
    phase: 'strength',
    label: 'STRENGTH BLOCK',
    description: 'Transitioning to heavier loads. Rep ranges dropping. Frequency on competition lifts increasing.',
    weeksUntilRace: weeksUntilComp,
    color: '#60a5fa',
    repRange: '4-6',
    intensityPct: 78,
  };

  if (weeksUntilComp > 8) return {
    phase: 'peaking',
    label: 'PEAKING BLOCK',
    description: 'Heavy singles and doubles. Competition specificity. Volume drops, intensity climbs.',
    weeksUntilRace: weeksUntilComp,
    color: '#FEA020',
    repRange: '1-3',
    intensityPct: 88,
  };

  if (weeksUntilComp > 2) return {
    phase: 'competition_prep',
    label: 'COMPETITION PREP',
    description: 'Opener selection. Attempt planning. Reducing volume while maintaining sharpness.',
    weeksUntilRace: weeksUntilComp,
    color: '#e8341c',
    repRange: '1-2',
    intensityPct: 93,
  };

  return {
    phase: 'taper',
    label: 'TAPER WEEK',
    description: 'Very light work only. Competition lifts at 50-60%. Sleep. Eat. Visualise your attempts.',
    weeksUntilRace: weeksUntilComp,
    color: '#9933FF',
    repRange: '1',
    intensityPct: 55,
  };
}

export function getStrengthPredictor(profile) {
  const squat = parseFloat(profile.profile_data?.squat_max || 0);
  const bench = parseFloat(profile.profile_data?.bench_max || 0);
  const deadlift = parseFloat(profile.profile_data?.deadlift_max || 0);

  const currentTotal = squat + bench + deadlift;
  const targetTotal = parseFloat(profile.strength_target_total || 0) || null;

  const gapToTarget = targetTotal ? targetTotal - currentTotal : null;

  // Which lift has most room relative to typical comp ratios
  // Powerlifting standards: squat ≈ 40%, bench ≈ 25%, deadlift ≈ 35% of total
  let topLift = null;
  if (targetTotal && currentTotal > 0) {
    const sqPct = squat / currentTotal;
    const bPct = bench / currentTotal;
    const dlPct = deadlift / currentTotal;
    if (sqPct < 0.38) topLift = 'Squat';
    else if (bPct < 0.23) topLift = 'Bench Press';
    else if (dlPct < 0.33) topLift = 'Deadlift';
  }

  return {
    currentTotal: currentTotal || null,
    targetTotal,
    squat: squat || null,
    bench: bench || null,
    deadlift: deadlift || null,
    gapToTarget,
    onTrack: gapToTarget !== null ? gapToTarget <= 0 : null,
    topLiftToImprove: topLift,
  };
}
