import { getExerciseData } from '../data/exerciseMuscleMap';
import { sb } from '../client';

// ─── Translation layer ────────────────────────────────
// Maps exerciseMuscleMap strings → InteractiveBodyMap zone IDs.
// Bridge between all 3 naming systems.

const MUSCLE_TO_ZONE = {
  // Chest
  'Sternal Pec':          'chest',
  'Clavicular Pec':       'chest',
  'Serratus':             'chest',
  // Shoulders
  'Anterior Delt':        'shoulders-f',
  'Medial Delt':          'shoulders-f',
  'Rear Delt':            'rear-delts',
  'Supraspinatus':        'shoulders-f',
  // Triceps
  'Long Head Tricep':     'triceps',
  'Lateral Head Tricep':  'triceps',
  'Medial Head Tricep':   'triceps',
  'Anconeus':             'triceps',
  // Biceps/Arms
  'Long Head Bicep':      'biceps',
  'Short Head Bicep':     'biceps',
  'Brachialis':           'biceps',
  'Forearms':             'forearms-f',
  // Back
  'Lats':                 'lats',
  'Upper Traps':          'traps',
  'Mid Traps':            'traps',
  'Lower Traps':          'traps',
  'Rhomboids':            'traps',
  'Teres Major':          'lats',
  'Lower Back':           'lower-back',
  // Quads
  'Rectus Femoris':       'quads',
  'Vastus Lateralis':     'quads',
  'Vastus Medialis':      'quads',
  'Vastus Intermedius':   'quads',
  // Hamstrings
  'Biceps Femoris':       'hamstrings',
  'Semitendinosus':       'hamstrings',
  'Semimembranosus':      'hamstrings',
  // Glutes
  'Gluteus Maximus':      'glutes',
  'Gluteus Medius':       'glutes',
  'Gluteus Minimus':      'glutes',
  'Adductors':            'glutes',
  // Lower leg
  'Calves':               'calves-b',
  // Core
  'Hip Flexors':          'hip-flexors',
  'Core':                 'abs',
  'Abs':                  'abs',
  'Obliques':             'abs',
};

// Normalise bilateral zone strings ("quads_L" → "quads")
function normaliseZone(zone) {
  return zone?.replace(/_[LR]$/, '') ?? zone;
}

// Get all zones trained by an exercise (primary muscles only)
export function getTrainedZones(exerciseName) {
  const data = getExerciseData(exerciseName);
  if (!data) return [];
  return [...new Set(
    (data.primary ?? []).map(m => MUSCLE_TO_ZONE[m]).filter(Boolean)
  )];
}

// ─── Core algorithm ───────────────────────────────────

export function recordDomsObservation(checkin, workoutLogs, existingProfile) {
  const allSoreZones = [
    ...(checkin.primary_soreness ?? []),
    ...(checkin.secondary_soreness ?? []),
  ].map(normaliseZone);

  if (!allSoreZones.length || !checkin.overall_soreness || checkin.overall_soreness < 3) return null;

  const checkinDate = new Date(checkin.date + 'T06:00:00');
  const newObservations = [];

  allSoreZones.forEach(zone => {
    for (const log of workoutLogs) {
      const logDate = new Date(log.date + 'T12:00:00');
      const hoursAgo = (checkinDate - logDate) / (60 * 60 * 1000);

      if (hoursAgo < 12 || hoursAgo > 96) continue;

      const exercises = log.workout?.exercises ?? [];
      const trained = exercises.some(ex => getTrainedZones(ex.name).includes(zone));

      if (trained) {
        newObservations.push({
          date: checkin.date,
          zone,
          hoursFromWorkout: Math.round(hoursAgo),
          sorenessLevel: checkin.overall_soreness,
          isPrimary: (checkin.primary_soreness ?? []).map(normaliseZone).includes(zone),
        });
        break;
      }
    }
  });

  if (!newObservations.length) return null;

  const existing = existingProfile?.domsProfile ?? {};
  const allObs = [
    ...newObservations,
    ...(existing.observations ?? []),
  ].slice(0, 200);

  const peakHours = computePeakHours(allObs);

  return {
    ...(existingProfile ?? {}),
    domsProfile: {
      observations: allObs,
      peakHours,
      lastUpdated: checkin.date,
    },
  };
}

function computePeakHours(observations) {
  const byZone = {};
  observations.forEach(obs => {
    if (!byZone[obs.zone]) byZone[obs.zone] = [];
    byZone[obs.zone].push(obs);
  });

  const peaks = {};
  Object.entries(byZone).forEach(([zone, obs]) => {
    if (obs.length < 3) return;

    const totalWeight = obs.reduce((sum, o) => sum + o.sorenessLevel * (o.isPrimary ? 1.5 : 1), 0);
    const weightedHours = obs.reduce((sum, o) =>
      sum + o.hoursFromWorkout * o.sorenessLevel * (o.isPrimary ? 1.5 : 1), 0
    );

    const avgHours = Math.round(weightedHours / totalWeight);
    const confidence = Math.min(0.95, 0.50 + (obs.length - 3) * 0.05);

    peaks[zone] = { hours: avgHours, confidence, observations: obs.length };
  });

  return peaks;
}

// ─── Prediction API ───────────────────────────────────

export function predictSoreness(workoutLogs, domsProfile, daysAhead = 2) {
  if (!domsProfile?.peakHours) return {};

  const predictions = {};
  const now = new Date();

  Object.entries(domsProfile.peakHours).forEach(([zone, peak]) => {
    if (peak.confidence < 0.60) return;

    for (const log of workoutLogs) {
      const exercises = log.workout?.exercises ?? [];
      const trained = exercises.some(ex => getTrainedZones(ex.name).includes(zone));
      if (!trained) continue;

      const logDate = new Date(log.date + 'T12:00:00');
      const peakDate = new Date(logDate.getTime() + peak.hours * 60 * 60 * 1000);
      const hoursToRecovery = peak.hours * 2;
      const recoveryDate = new Date(logDate.getTime() + hoursToRecovery * 60 * 60 * 1000);
      const hoursToPeak = (peakDate - now) / (60 * 60 * 1000);
      const hoursToRecoveryFromNow = (recoveryDate - now) / (60 * 60 * 1000);

      if (hoursToRecoveryFromNow > 0) {
        predictions[zone] = {
          peaksAt: peakDate,
          recoversAt: recoveryDate,
          hoursToPeak: Math.round(hoursToPeak),
          hoursToRecovery: Math.round(hoursToRecoveryFromNow),
          isPeaking: hoursToPeak < 0 && hoursToRecoveryFromNow > 0,
          isBuilding: hoursToPeak > 0,
          confidence: peak.confidence,
        };
      }
      break;
    }
  });

  return predictions;
}

export function getSchedulingConflicts(predictions, tomorrowSession) {
  if (!tomorrowSession?.exercises?.length || !Object.keys(predictions).length) return [];

  const conflicts = [];
  tomorrowSession.exercises.forEach(ex => {
    if (!ex.primary) return;
    const zones = getTrainedZones(ex.name);
    zones.forEach(zone => {
      const pred = predictions[zone];
      if (!pred) return;
      if (pred.isPeaking || (pred.isBuilding && pred.hoursToPeak < 24)) {
        conflicts.push({
          exercise: ex.name,
          zone,
          prediction: pred,
          severity: pred.isPeaking ? 'high' : 'moderate',
          message: pred.isPeaking
            ? `${zone} is at peak soreness (${Math.abs(pred.hoursToPeak)}h past peak)`
            : `${zone} peaks in ${pred.hoursToPeak}h — during tomorrow's session`,
        });
      }
    });
  });

  return conflicts;
}

export function getDomsInsight(domsProfile, zone) {
  const peak = domsProfile?.peakHours?.[zone];
  if (!peak || peak.confidence < 0.65) return null;

  const hours = peak.hours;
  const day = hours <= 24 ? 'within 24 hours'
    : hours <= 36 ? 'around 36 hours'
    : hours <= 48 ? 'around 48 hours'
    : hours <= 60 ? 'around 60 hours'
    : 'around 72 hours';

  return `Your ${zone} typically peaks ${day} after training — we plan your sessions around your personal recovery timeline.`;
}

// ─── Wire: call after morning check-in submit ─────────

export async function processDomsMorningCheckin(userId, checkin, workoutLogs, profile) {
  const updatedProfile = recordDomsObservation(
    checkin, workoutLogs, profile?.adaptive_profile
  );
  if (!updatedProfile) return;

  await sb
    .from('profiles')
    .update({ adaptive_profile: updatedProfile })
    .eq('id', userId);
}
