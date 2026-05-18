import { sb } from '../client';

const COMPOUND = [
  'Barbell Back Squat', 'Barbell Bench Press', 'Deadlift',
  'Overhead Press', 'Barbell Row', 'Pull-Up', 'Weighted Pull-Up',
];

const POWER_EXERCISES = [
  'Box Jump', 'Sprint Interval', 'Burpee Broad Jump', 'Power Clean',
  'Hang Clean', 'Box Squat', 'Sled Push', 'SkiErg', 'Wall Ball',
];

export async function calculateTrainingDNA(userId) {
  if (!userId) return zeroScores();

  const now = new Date();
  const cut90 = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const cut30 = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [
    { data: workoutLogs },
    { data: foodLogs },
    { data: muscleRec },
    { data: prof },
    { data: runLogs },
  ] = await Promise.all([
    sb.from('workout_logs').select('date, workout').eq('user_id', userId).gte('date', cut90),
    sb.from('food_logs').select('date, entries').eq('user_id', userId).gte('date', cut30),
    sb.from('muscle_recovery').select('muscle_group, last_trained_at').eq('user_id', userId),
    sb.from('profiles').select('goalCals, created_at').eq('id', userId).single(),
    sb.from('run_logs').select('distance_km').eq('user_id', userId),
  ]);

  const wl = workoutLogs || [];
  const fl = foodLogs || [];
  const mr = muscleRec || [];

  // ── 1. STRENGTH ───────────────────────────────────────────────────────────
  // Progressive overload on compound lifts over 90 days.
  const compoundByExercise = {};
  wl.forEach(session => {
    const dateObj = new Date(session.date);
    (session.workout?.exercises || []).forEach(ex => {
      if (!COMPOUND.includes(ex.name)) return;
      const maxWeight = Math.max(0, ...(ex.sets || []).map(s => parseFloat(s.weight || 0)));
      if (maxWeight <= 0) return;
      if (!compoundByExercise[ex.name]) compoundByExercise[ex.name] = [];
      compoundByExercise[ex.name].push({ date: dateObj, weight: maxWeight });
    });
  });

  const exerciseEntries = Object.values(compoundByExercise);
  let strengthScore = 0;
  if (exerciseEntries.length >= 2) {
    let progressingLifts = 0;
    let totalLifts = 0;
    exerciseEntries.forEach(entries => {
      if (entries.length < 2) return;
      entries.sort((a, b) => a.date - b.date);
      totalLifts++;
      if (entries[entries.length - 1].weight > entries[0].weight) progressingLifts++;
    });
    strengthScore = totalLifts > 0
      ? Math.min(95, 40 + Math.round((progressingLifts / totalLifts) * 55))
      : 30;
  } else if (exerciseEntries.length === 1) {
    strengthScore = 30;
  } else {
    // Has strength sessions but no named compound logged — low baseline
    const hasStrengthSessions = wl.some(s =>
      !s.workout?.focus?.toLowerCase().includes('run') &&
      s.workout?.type !== 'running'
    );
    strengthScore = hasStrengthSessions ? 20 : 0;
  }

  // ── 2. ENDURANCE ──────────────────────────────────────────────────────────
  // Run/cardio sessions in workout_logs + total distance in run_logs.
  const cardioCount = wl.filter(s =>
    s.workout?.focus?.toLowerCase().includes('run') ||
    s.workout?.type === 'running' ||
    s.workout?.type === 'cardio' ||
    (s.workout?.exercises || []).some(e =>
      e.name?.toLowerCase().includes('run') ||
      e.name?.toLowerCase().includes('cardio')
    )
  ).length;

  const totalRunKm = (runLogs || []).reduce((sum, r) => sum + (r.distance_km || 0), 0);
  let enduranceScore = 0;
  if (cardioCount >= 24 || totalRunKm >= 100) {
    enduranceScore = 85;
  } else {
    const byCount = Math.round((cardioCount / 24) * 80);
    const byKm = totalRunKm > 0 ? Math.round((totalRunKm / 100) * 70) : 0;
    enduranceScore = Math.min(80, Math.max(byCount, byKm));
  }

  // ── 3. POWER ──────────────────────────────────────────────────────────────
  // Explicit power exercises + heavy compound work (≤5 reps).
  let powerCount = 0;
  wl.forEach(session => {
    (session.workout?.exercises || []).forEach(ex => {
      if (POWER_EXERCISES.includes(ex.name)) {
        powerCount += Math.max(1, (ex.sets || []).filter(s => s.done).length);
        return;
      }
      if (COMPOUND.includes(ex.name)) {
        powerCount += (ex.sets || []).filter(s =>
          parseInt(s.reps || 99) <= 5 && parseFloat(s.weight || 0) > 0
        ).length;
      }
    });
  });
  const powerScore = powerCount === 0 ? 0
    : powerCount >= 20 ? 80
    : Math.min(75, Math.round((powerCount / 20) * 75));

  // ── 4. CONSISTENCY ────────────────────────────────────────────────────────
  // Sessions vs expected (3/week) over tracked window, with streak bonus.
  const accountAgeDays = Math.max(1, Math.floor((now - new Date(prof?.created_at)) / 86400000));
  const windowDays = Math.min(accountAgeDays, 90);
  const expectedSessions = (windowDays / 7) * 3;
  let consistencyScore = expectedSessions > 0
    ? Math.min(95, Math.round((wl.length / expectedSessions) * 80))
    : 0;

  // Streak bonus (up to +15)
  const uniqueDates = [...new Set(wl.map(s => s.date))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let checkDate = new Date();
  for (const dateStr of uniqueDates) {
    const diff = Math.round((checkDate - new Date(dateStr)) / 86400000);
    if (diff <= 1) { streak++; checkDate = new Date(dateStr); } else break;
  }
  consistencyScore = Math.min(95, consistencyScore + Math.min(15, Math.floor(streak / 2)));

  // ── 5. NUTRITION ──────────────────────────────────────────────────────────
  // Protein and calorie target adherence over 30 days.
  let nutritionScore = 0;
  if (fl.length > 0) {
    const calorieTarget = prof?.goalCals || 2000;
    const proteinTarget = Math.round((calorieTarget * 0.30) / 4);

    const byDay = {};
    fl.forEach(log => {
      if (!byDay[log.date]) byDay[log.date] = { protein: 0, calories: 0 };
      (log.entries || []).forEach(e => {
        byDay[log.date].protein += e.protein || 0;
        byDay[log.date].calories += e.calories || 0;
      });
    });

    const days = Object.values(byDay);
    const proteinRate = days.filter(d => d.protein >= proteinTarget).length / days.length;
    const calorieRate = days.filter(d =>
      Math.abs(d.calories - calorieTarget) / calorieTarget <= 0.1
    ).length / days.length;
    const loggingRate = days.length / 30;

    nutritionScore = Math.min(95, Math.round(
      (proteinRate * 0.5 + calorieRate * 0.3 + loggingRate * 0.2) * 95
    ));
  }

  // ── 6. RECOVERY ───────────────────────────────────────────────────────────
  // Average muscle recovery percent computed from last_trained_at.
  // Sweet spot 60-85% = well-managed training load.
  let recoveryScore = 50;
  if (mr.length > 0) {
    const nowMs = now.getTime();
    const percents = mr.map(r => {
      const hoursAgo = (nowMs - new Date(r.last_trained_at).getTime()) / 3600000;
      return Math.min(100, Math.round((hoursAgo / 48) * 100));
    });
    const avg = percents.reduce((s, p) => s + p, 0) / percents.length;
    if (avg >= 60 && avg <= 85) {
      recoveryScore = 85;
    } else if (avg > 85) {
      recoveryScore = Math.max(40, 85 - Math.round((avg - 85) * 0.5));
    } else {
      recoveryScore = Math.max(20, Math.round(avg * 0.7));
    }
  }

  return {
    strength: strengthScore,
    endurance: enduranceScore,
    power: powerScore,
    consistency: consistencyScore,
    nutrition: nutritionScore,
    recovery: recoveryScore,
    _meta: { sessions: wl.length },
  };
}

export function getDominantDimension(dna) {
  if (!dna) return null;
  const keys = ['strength', 'endurance', 'power', 'consistency', 'nutrition', 'recovery'];
  return keys.reduce((best, k) => (dna[k] ?? 0) > (dna[best] ?? 0) ? k : best, keys[0]);
}

function zeroScores() {
  return { strength: 0, endurance: 0, power: 0, consistency: 0, nutrition: 0, recovery: 0, _meta: { sessions: 0 } };
}
