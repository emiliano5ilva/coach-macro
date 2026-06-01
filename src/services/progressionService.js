export function getLastSession(exerciseName, workoutLogs) {
  for (const log of workoutLogs) {
    const ex = log.workout?.exercises?.find(
      e => e.name?.toLowerCase() === exerciseName?.toLowerCase()
    );
    if (ex) {
      const done = ex.sets?.filter(s => s.done) ?? [];
      const totalReps = done.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
      const prescribed = ex.sets?.length ?? done.length;
      return {
        date: log.date,
        weight: parseFloat(done[0]?.weight) || 0,
        completedSets: done.length,
        prescribedSets: prescribed,
        allCompleted: done.length >= prescribed && done.every(s => parseInt(s.reps) > 0),
        totalReps,
        sets: done,
      };
    }
  }
  return null;
}

export function getConsecutiveFailures(exerciseName, workoutLogs) {
  let failures = 0;
  let lastWeight = null;
  for (const log of workoutLogs) {
    const ex = log.workout?.exercises?.find(
      e => e.name?.toLowerCase() === exerciseName?.toLowerCase()
    );
    if (!ex) continue;
    const done = ex.sets?.filter(s => s.done) ?? [];
    const weight = parseFloat(done[0]?.weight) || 0;
    const prescribed = ex.sets?.length ?? done.length;
    const allDone = done.length >= prescribed;
    if (lastWeight !== null && weight !== lastWeight) break;
    if (!allDone) {
      failures++;
      lastWeight = weight;
    } else break;
  }
  return failures;
}

export function computeNextWeight(exerciseName, workoutLogs, programId) {
  const isUpper = /bench|press|row|curl|fly|raise|dip|pulldown|push|extension|skullcrusher|overhead/i.test(exerciseName);
  const isBodyweight = /pull.?up|chin.?up|dip|push.?up|plank|lunge|squat.*body/i.test(exerciseName);
  const isCardio = /run|row|ski|erg|carry|walk|bike/i.test(exerciseName);

  if (isBodyweight || isCardio) return null;

  const programIncrements = {
    'sl5x5':    { upper: 2.5, lower: 5   },
    '5_3_1':    { upper: 2.5, lower: 5   },
    'phul':     { upper: 2.5, lower: 2.5 },
    'reg_park': { upper: 2.5, lower: 5   },
    'gvt':      { upper: 2.5, lower: 2.5 },
    'default':  { upper: 2.5, lower: 2.5 },
  };
  const inc = programIncrements[programId] ?? programIncrements.default;
  const step = isUpper ? inc.upper : inc.lower;

  const last = getLastSession(exerciseName, workoutLogs);
  if (!last || last.weight === 0) {
    return { weight: null, action: 'new', message: 'First session — choose your starting weight' };
  }

  const failures = getConsecutiveFailures(exerciseName, workoutLogs);

  if (failures >= 3) {
    const deload = Math.round(last.weight * 0.9 / 2.5) * 2.5;
    return {
      weight: deload,
      action: 'deload',
      message: `Reset to ${deload}kg. Three misses at ${last.weight}kg — rebuilding from here is faster than grinding a weight that isn't moving.`,
    };
  }

  if (!last.allCompleted) {
    return {
      weight: last.weight,
      action: 'hold',
      message: `Hold at ${last.weight}kg — hit all sets before adding weight`,
    };
  }

  return {
    weight: last.weight + step,
    action: 'increase',
    message: `+${step}kg from last session ✓`,
  };
}

export function detectPlateau(exerciseName, workoutLogs) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const recent = workoutLogs.filter(l =>
    new Date(l.date) >= cutoff &&
    l.workout?.exercises?.some(e => e.name?.toLowerCase() === exerciseName?.toLowerCase())
  );
  if (recent.length < 4) return false;
  const weights = recent.map(l => {
    const ex = l.workout.exercises.find(e => e.name?.toLowerCase() === exerciseName?.toLowerCase());
    return parseFloat(ex?.sets?.[0]?.weight) || 0;
  });
  const failures = recent.map(l => {
    const ex = l.workout.exercises.find(e => e.name?.toLowerCase() === exerciseName?.toLowerCase());
    const done = ex?.sets?.filter(s => s.done) ?? [];
    const prescribed = ex?.sets?.length ?? done.length;
    return done.length < prescribed;
  });
  const sameWeight = new Set(weights).size === 1;
  const failRate = failures.filter(Boolean).length / failures.length;
  return sameWeight && failRate >= 0.5;
}

export function estimateTrainingAge(workoutLogs) {
  if (!workoutLogs?.length) return 'beginner';
  const oldestLog = workoutLogs[workoutLogs.length - 1];
  const weeksLogged = Math.floor(
    (Date.now() - new Date(oldestLog.date)) / (7 * 24 * 60 * 60 * 1000)
  );
  const avgVolumePerSession = workoutLogs.reduce((sum, l) => sum + (l.volume_lbs ?? 0), 0) / workoutLogs.length;

  if (weeksLogged < 12 || avgVolumePerSession < 5000) return 'beginner';
  if (weeksLogged < 52 || avgVolumePerSession < 15000) return 'intermediate';
  return 'advanced';
}
