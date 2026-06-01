import { computeNextWeight, detectPlateau, estimateTrainingAge } from './progressionService';
import { getReadinessModifier, applyReadinessToSession, getSorenessMuscleConflicts } from './recoveryService';
import { computeLoadMetrics } from './trainingLoadService';
import { predictSoreness, getSchedulingConflicts } from './domsLearningService';

export function getSessionSpacingAlert(workoutLogs, todaySession) {
  if (!workoutLogs?.length) return null;

  const lastLog = workoutLogs[0];
  if (!lastLog) return null;

  const lastDate = new Date(lastLog.date + 'T12:00:00');
  const today = new Date();
  const hoursSinceLast = (today - lastDate) / (60 * 60 * 1000);
  const daysSinceLast  = hoursSinceLast / 24;

  // Same-day double session conflict
  if (hoursSinceLast < 12) {
    const lastType  = (lastLog.workout?.focus ?? lastLog.workout?.type ?? '').toLowerCase();
    const todayType = (todaySession?.focus ?? todaySession?.type ?? '').toLowerCase();
    const bothHeavyLower =
      /squat|deadlift|leg/i.test(lastType) &&
      /squat|deadlift|leg/i.test(todayType);

    if (bothHeavyLower) {
      return {
        type: 'conflict',
        severity: 'high',
        message: `Heavy lower body session logged ${Math.round(hoursSinceLast)} hours ago. Today's session has been adjusted to upper body focus. Legs need 48 hours.`,
        recommendation: 'shift_to_upper',
      };
    }
  }

  // Long layoff
  if (daysSinceLast > 5) {
    const deloadFactor = daysSinceLast > 10 ? 0.70 : daysSinceLast > 7 ? 0.80 : 0.90;
    return {
      type: 'layoff',
      severity: daysSinceLast > 10 ? 'moderate' : 'low',
      deloadFactor,
      message: `${Math.round(daysSinceLast)} days since your last session. Today starts at ${Math.round(deloadFactor * 100)}% volume — your body eases back in, not jumps back in.`,
      recommendation: 'reduce_volume',
    };
  }

  return null;
}

export function buildAdaptiveSession(
  exercises,
  workoutLogs,
  profile,
  programId,
  checkin,
  recentFoodLogs
) {
  // 1. Readiness modifier from check-in + coach score + nutrition + training load
  const modifier = getReadinessModifier(profile, checkin, recentFoodLogs, workoutLogs);

  // 2. Apply volume/intensity adjustments to primary lifts
  const adapted = applyReadinessToSession(exercises, modifier);

  // 3. Compute next weight and detect plateaus per primary lift
  const progressions = {};
  const plateaus = [];
  adapted.forEach(ex => {
    if (ex.primary && !/run|row|ski|carry|walk/i.test(ex.name)) {
      const next = computeNextWeight(ex.name, workoutLogs, programId, profile);
      if (next) progressions[ex.name] = next;
      if (detectPlateau(ex.name, workoutLogs, profile)) plateaus.push(ex.name);
    }
  });

  // 4. Soreness conflicts — warn on exercises that hit sore muscles
  const soreConflicts = getSorenessMuscleConflicts(checkin, adapted);

  // 5. Weekly analysis multiplier compounds with daily readiness
  const analysis = profile?.adaptive_profile?.lastAnalysis;
  const analysisVolumeAdj = analysis?.volumeAdjustment ?? 1.0;
  const finalVolumeMultiplier = modifier.volumeMultiplier * analysisVolumeAdj;

  // 6. Training age for context
  const trainingAge = estimateTrainingAge(workoutLogs);

  const loadMetrics = computeLoadMetrics(workoutLogs);

  // DOMS predictions from personal history
  const domsProfile   = profile?.adaptive_profile?.domsProfile;
  const domsPredictions = predictSoreness(workoutLogs, domsProfile);
  const domsConflicts   = getSchedulingConflicts(domsPredictions, { exercises });

  // Session spacing
  const spacingAlert = getSessionSpacingAlert(workoutLogs, exercises[0]);
  // Apply layoff deload factor on top of existing modifier
  if (spacingAlert?.type === 'layoff' && spacingAlert.deloadFactor < 1.0) {
    modifier.volumeMultiplier = Math.min(modifier.volumeMultiplier, spacingAlert.deloadFactor);
    if (!modifier.reasons.find(r => r.includes('days since'))) {
      modifier.reasons.push(spacingAlert.message);
    }
  }

  return {
    exercises: adapted,
    progressions,
    loadMetrics,
    modifier: {
      ...modifier,
      volumeMultiplier: finalVolumeMultiplier,
      weeklyAnalysisApplied: analysisVolumeAdj !== 1.0,
    },
    plateaus,
    hasPlateau: plateaus.length >= 2,
    soreConflicts,
    trainingAge,
    analysisInsight:   analysis?.keyInsight ?? null,
    deloadRecommended: analysis?.deloadRecommended ?? false,
    injuryRisk:        analysis?.injuryRisk ?? 'none',
    injuryNote:        analysis?.injuryNote ?? null,
    spacingAlert,
    domsPredictions,
    domsConflicts,
  };
}
