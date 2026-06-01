import { computeNextWeight, detectPlateau, estimateTrainingAge } from './progressionService';
import { getReadinessModifier, applyReadinessToSession, getSorenessMuscleConflicts } from './recoveryService';

export function buildAdaptiveSession(
  exercises,
  workoutLogs,
  profile,
  programId,
  checkin,
  recentFoodLogs
) {
  // 1. Readiness modifier from check-in + coach score + nutrition
  const modifier = getReadinessModifier(profile, checkin, recentFoodLogs);

  // 2. Apply volume/intensity adjustments to primary lifts
  const adapted = applyReadinessToSession(exercises, modifier);

  // 3. Compute next weight and detect plateaus per primary lift
  const progressions = {};
  const plateaus = [];
  adapted.forEach(ex => {
    if (ex.primary && !/run|row|ski|carry|walk/i.test(ex.name)) {
      const next = computeNextWeight(ex.name, workoutLogs, programId);
      if (next) progressions[ex.name] = next;
      if (detectPlateau(ex.name, workoutLogs)) plateaus.push(ex.name);
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

  return {
    exercises: adapted,
    progressions,
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
  };
}
