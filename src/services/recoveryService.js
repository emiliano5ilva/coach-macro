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

// ── Morning check-in helpers ──────────────────────────────────────────────────

export async function getTodayCheckin(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('morning_checkins')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();
  return data ?? null;
}

export async function getRecentCheckins(userId, days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await sb
    .from('morning_checkins')
    .select('*')
    .eq('user_id', userId)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false });
  return data ?? [];
}

export function getReadinessModifier(profile, checkin, recentFoodLogs) {
  const coachScore = profile?.coach_score ?? 75;
  const readiness  = checkin?.readiness ?? 'good';
  const soreness   = checkin?.overall_soreness ?? 0;
  const adherence  = recentFoodLogs?.length
    ? recentFoodLogs.slice(0, 3).reduce((sum, l) => {
        const target = l.calorie_target ?? 2000;
        const actual = l.calories ?? 0;
        return sum + Math.min(actual / target, 1.5);
      }, 0) / Math.min(recentFoodLogs.length, 3)
    : 1.0;

  const readinessMap = { great: 1.10, good: 1.0, okay: 0.90, tired: 0.80, rough: 0.70 };
  let volume    = readinessMap[readiness] ?? 1.0;
  let intensity = volume;
  const reasons = [];

  if (coachScore < 40) {
    volume    = Math.min(volume, 0.70);
    intensity = Math.min(intensity, 0.80);
    reasons.push('Recovery signals low');
  } else if (coachScore < 60) {
    volume = Math.min(volume, 0.85);
    reasons.push('Below-average recovery');
  }

  if (soreness >= 8) {
    volume = Math.min(volume, 0.70);
    reasons.push('High soreness reported');
  } else if (soreness >= 6) {
    volume = Math.min(volume, 0.85);
    reasons.push('Moderate soreness — volume reduced');
  }

  if (adherence < 0.75) {
    intensity = Math.min(intensity, 0.85);
    reasons.push('Under-fuelled this week');
  }

  const label = volume < 0.75 ? 'recovery' : volume < 0.90 ? 'reduced' : 'full';
  return { volumeMultiplier: volume, intensityMultiplier: intensity, label, reasons };
}

export function getSorenessMuscleConflicts(checkin, todayExercises) {
  if (!checkin || checkin.overall_soreness < 5) return [];
  const soreZones = [
    ...(checkin.primary_soreness ?? []),
    ...(checkin.secondary_soreness ?? []),
  ];
  const zoneToKeywords = {
    'quads':        ['squat','lunge','leg press','extension'],
    'quads_L':      ['squat','lunge','leg press','extension'],
    'quads_R':      ['squat','lunge','leg press','extension'],
    'hamstrings':   ['deadlift','curl','rdl','nordic'],
    'hamstrings_L': ['deadlift','curl','rdl'],
    'hamstrings_R': ['deadlift','curl','rdl'],
    'glutes':       ['hip thrust','glute','lunge','squat'],
    'glutes_L':     ['hip thrust','glute'],
    'glutes_R':     ['hip thrust','glute'],
    'lower-back':   ['deadlift','good morning','back'],
    'chest':        ['bench','press','fly','push'],
    'shoulders-f':  ['press','raise','shoulder'],
    'lats':         ['pulldown','pull up','row'],
    'biceps':       ['curl','pull','row'],
    'triceps':      ['press','extension','pushdown','dip'],
  };
  const conflicts = [];
  soreZones.forEach(zone => {
    const keywords = zoneToKeywords[zone] ?? [];
    todayExercises.forEach(ex => {
      const nameL = ex.name?.toLowerCase() ?? '';
      if (keywords.some(k => nameL.includes(k))) {
        conflicts.push({ exercise: ex.name, zone });
      }
    });
  });
  return [...new Set(conflicts.map(c => c.exercise))]
    .map(name => conflicts.find(c => c.exercise === name));
}

export function applyReadinessToSession(exercises, modifier) {
  if (modifier.volumeMultiplier >= 1.0) return exercises;
  return exercises.map(ex => {
    if (!ex.primary) return ex;
    const reduced = Math.max(2, Math.round((ex.sets ?? 3) * modifier.volumeMultiplier));
    return { ...ex, sets: reduced };
  });
}
