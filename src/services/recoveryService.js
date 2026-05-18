import { sb } from '../client';
import { musclesToSvgIds, svgIdsToMuscleGroups } from '../data/muscleMapping';
import { EXERCISE_MUSCLE_GROUP } from '../exercise_database';

const GROUP_TO_SVG = {
  chest:     ['chest'],
  back:      ['traps', 'lats', 'lower-back'],
  shoulders: ['shoulders-f', 'rear-delts'],
  arms:      ['biceps', 'forearms-f', 'triceps', 'forearms-b'],
  core:      ['abs', 'hip-flexors'],
  legs:      ['quads', 'calves-f', 'glutes', 'hamstrings', 'calves-b'],
};

// Maps EXERCISE_MUSCLE_GROUP values → the 6 tracked groups
const NORMALIZE_GROUP = {
  chest: 'chest', back: 'back', shoulders: 'shoulders',
  arms: 'arms', core: 'core',
  legs: 'legs', glutes: 'legs', calves: 'legs',
  cardio: null,
};

const ALL_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'core', 'legs'];

const OPTIMAL_SETS = {
  chest:     [10, 20],
  back:      [10, 20],
  shoulders: [12, 20],
  arms:      [12, 20],
  core:      [10, 16],
  legs:      [10, 20],
};

// Called immediately after a workout session completes.
// completedExercises = [{name, sets: [{weight, reps, done}]}]
export async function recordWorkoutRecovery(userId, completedExercises) {
  if (!userId || !completedExercises?.length) return;

  const groupsHit = new Set();

  // Primary: use local EXERCISE_MUSCLE_GROUP (fast, no network)
  const notFound = [];
  completedExercises.forEach(ex => {
    const name = ex.name || ex.exercise_name;
    if (!name) return;
    const raw = EXERCISE_MUSCLE_GROUP[name];
    const normalized = raw ? NORMALIZE_GROUP[raw] : null;
    if (normalized) {
      groupsHit.add(normalized);
    } else {
      notFound.push(name);
    }
  });

  // Fallback: query exercise_cache for exercises not found locally
  if (notFound.length) {
    try {
      const { data } = await sb
        .from('exercise_cache')
        .select('exercise_name, target_muscles, secondary_muscles')
        .in('exercise_name', notFound);

      (data || []).forEach(row => {
        const muscles = [
          ...(row.target_muscles || []),
          ...(row.secondary_muscles || []),
        ];
        const ids = musclesToSvgIds(muscles);
        svgIdsToMuscleGroups(ids).forEach(g => groupsHit.add(g));
      });
    } catch (e) {
      console.warn('[recoveryService] exercise_cache fallback failed', e);
    }
  }

  if (!groupsHit.size) return;

  const now = new Date().toISOString();
  const upserts = [...groupsHit].map(group => ({
    user_id: userId,
    muscle_group: group,
    svg_ids: GROUP_TO_SVG[group] || [],
    last_trained_at: now,
  }));

  await sb
    .from('muscle_recovery')
    .upsert(upserts, { onConflict: 'user_id,muscle_group' });
}

// Returns recovery state keyed by muscle group.
// recovery_percent is computed client-side: hours elapsed / 48h × 100, capped at 100.
export async function getRecoveryData(userId) {
  if (!userId) return null;

  const { data, error } = await sb
    .from('muscle_recovery')
    .select('muscle_group, svg_ids, last_trained_at')
    .eq('user_id', userId);

  if (error) throw error;
  if (!data?.length) return null;

  const now = Date.now();
  const recovery = {};

  data.forEach(row => {
    const hoursAgo = (now - new Date(row.last_trained_at).getTime()) / 3600000;
    recovery[row.muscle_group] = {
      percent: Math.min(100, Math.round((hoursAgo / 48) * 100)),
      lastTrainedAt: row.last_trained_at,
      svgIds: row.svg_ids,
    };
  });

  // Fill in groups never trained — fully recovered
  ALL_GROUPS.forEach(g => {
    if (!recovery[g]) {
      recovery[g] = { percent: 100, lastTrainedAt: null, svgIds: [] };
    }
  });

  return recovery;
}

// Returns optimization state keyed by muscle group (sets this week vs targets).
export async function getOptimizationData(userId) {
  if (!userId) return null;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekStr = weekStart.toISOString().split('T')[0];

  const { data: logs, error } = await sb
    .from('workout_logs')
    .select('workout')
    .eq('user_id', userId)
    .gte('date', weekStr);

  if (error) throw error;
  if (!logs?.length) return null;

  const setsByGroup = Object.fromEntries(ALL_GROUPS.map(g => [g, 0]));

  logs.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      const doneSets = (ex.sets || []).filter(s => s.done).length;
      if (!doneSets) return;
      const raw = EXERCISE_MUSCLE_GROUP[ex.name];
      const group = raw ? NORMALIZE_GROUP[raw] : null;
      if (group && group in setsByGroup) {
        setsByGroup[group] += doneSets;
      }
    });
  });

  const optimization = {};
  Object.entries(setsByGroup).forEach(([g, sets]) => {
    const [min, max] = OPTIMAL_SETS[g];
    optimization[g] = {
      sets,
      status: sets === 0 ? 'UNTRAINED' : sets < min ? 'UNDERTRAINED' : sets <= max ? 'OPTIMAL' : 'OVERLOADED',
      target: `${min}–${max} sets/week`,
    };
  });

  return optimization;
}
