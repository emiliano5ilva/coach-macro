export function getRunningPhase(raceDate) {
  if (!raceDate) return null;
  const weeksUntilRace = Math.floor(
    (new Date(raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7)
  );

  if (weeksUntilRace > 16) return {
    phase: 'base',
    label: 'BASE BUILDING',
    description: 'Building aerobic base and weekly mileage. Easy miles are the foundation of every race performance.',
    weeksUntilRace,
    color: '#22c55e',
    focusWorkout: 'Easy long run',
  };

  if (weeksUntilRace > 12) return {
    phase: 'build',
    label: 'BUILD PHASE',
    description: 'Increasing mileage and introducing tempo runs. Lactate threshold work begins.',
    weeksUntilRace,
    color: '#60a5fa',
    focusWorkout: 'Tempo run',
  };

  if (weeksUntilRace > 8) return {
    phase: 'race_specific',
    label: 'RACE SPECIFIC',
    description: 'Race pace workouts and long runs at goal pace. Volume at its peak.',
    weeksUntilRace,
    color: '#FEA020',
    focusWorkout: 'Race pace intervals',
  };

  if (weeksUntilRace > 3) return {
    phase: 'peak',
    label: 'PEAK',
    description: 'Sharpening speed. Shorter harder workouts. Longest long run of the cycle.',
    weeksUntilRace,
    color: '#e8341c',
    focusWorkout: 'VO2 max intervals',
  };

  if (weeksUntilRace > 0) return {
    phase: 'taper',
    label: 'TAPER',
    description: 'Reduce volume 40-50%. Keep intensity. Trust the training. You are ready.',
    weeksUntilRace,
    color: '#9933FF',
    focusWorkout: 'Race pace strides',
  };

  return {
    phase: 'race_week',
    label: 'RACE WEEK',
    description: 'Race week. Very easy runs only. Rest. Eat your carbs. Trust everything you have done.',
    weeksUntilRace: 0,
    color: '#FFD740',
    focusWorkout: 'Easy shakeout',
  };
}

function intervalToSeconds(t) {
  if (!t) return null;
  const parts = String(t).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Number(parts[0]);
}

function secondsToTime(seconds) {
  if (!seconds || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function getRunTimePredictor(profile, recentRuns = []) {
  const raceType = profile.run_race_type || '5k';

  const raceDistances = { '5k': 5, '10k': 10, 'half_marathon': 21.1, 'marathon': 42.2, 'ultra': 50, 'obstacle': 10 };
  const raceFactor = { '5k': 0.93, '10k': 0.95, 'half_marathon': 0.97, 'marathon': 0.99, 'ultra': 1.02, 'obstacle': 0.96 };

  let currentPrediction = null;
  const recentPaces = recentRuns
    .filter(r => r.workout?.avg_pace_secs_per_km)
    .map(r => r.workout.avg_pace_secs_per_km);

  if (recentPaces.length >= 2) {
    const avgPace = recentPaces.reduce((sum, p) => sum + p, 0) / recentPaces.length;
    const distance = raceDistances[raceType] || 5;
    const racePace = avgPace * (raceFactor[raceType] || 0.95);
    currentPrediction = secondsToTime(racePace * distance);
  }

  const previousSecs = intervalToSeconds(profile.run_previous_time);
  const targetSecs = intervalToSeconds(profile.run_target_time);

  const currentSecs = recentPaces.length >= 2
    ? (() => {
        const avgPace = recentPaces.reduce((sum, p) => sum + p, 0) / recentPaces.length;
        const distance = raceDistances[raceType] || 5;
        return avgPace * (raceFactor[raceType] || 0.95) * distance;
      })()
    : previousSecs;

  const gapSec = targetSecs && currentSecs ? currentSecs - targetSecs : null;

  return {
    raceType,
    currentPrediction: currentPrediction || (previousSecs ? secondsToTime(previousSecs) : null),
    currentPredictionSec: currentSecs,
    targetTime: targetSecs ? secondsToTime(targetSecs) : null,
    previousTime: previousSecs ? secondsToTime(previousSecs) : null,
    gap: gapSec !== null ? secondsToTime(Math.abs(gapSec)) : null,
    gapSec,
    onTrack: gapSec !== null ? gapSec <= 0 : null,
    weeksUntilRace: profile.run_race_date
      ? Math.floor((new Date(profile.run_race_date) - new Date()) / (1000 * 60 * 60 * 24 * 7))
      : null,
  };
}
