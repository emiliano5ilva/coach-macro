import { sb } from '../client';
import { getGoal } from '../utils/profile';

const COMPOUND_EXERCISES = [
  'Barbell Back Squat', 'Barbell Front Squat',
  'Barbell Bench Press', 'Incline Barbell Bench Press',
  'Deadlift', 'Romanian Deadlift',
  'Barbell Row', 'Overhead Press',
  'Pull-Up', 'Weighted Pull-Up',
  'Hip Thrust', 'Bulgarian Split Squat',
  'Dumbbell Bench Press', 'Dumbbell Row',
];

const STRATEGIES = {
  build_muscle: {
    weight_plateau: {
      name: 'DROP SET TECHNIQUE',
      description: 'Do your working sets then immediately drop to 70% weight and rep to failure. Forces new muscle recruitment.',
      prescription: [
        'Complete your normal sets',
        'Final set: drop weight to 70%',
        'Rep to failure on the drop set',
        'Rest 3 minutes after',
        'Return to normal next session',
      ],
      weeks: 2,
    },
    reps_plateau: {
      name: 'TEMPO MANIPULATION',
      description: 'Keep the weight. Change the tempo to 4 seconds down, 1 second pause, 1 second up. Creates new stimulus at same load.',
      prescription: [
        '4 second eccentric (down)',
        '1 second pause at bottom',
        '1 second concentric (up)',
        'Reps will drop — that is fine',
        'Progress tempo before weight',
      ],
      weeks: 2,
    },
  },
  get_stronger: {
    weight_plateau: {
      name: 'WAVE LOADING',
      description: 'Work in waves of 3 sets: 3 reps / 2 reps / 1 rep climbing in weight each wave. Potentiates the nervous system.',
      prescription: [
        'Wave 1: 85% × 3, 90% × 2, 95% × 1',
        'Wave 2: 87% × 3, 92% × 2, 97% × 1',
        'Rest 3-4 minutes between sets',
        'Use percentages of your stalled weight',
        'Run for 2 weeks then retest max',
      ],
      weeks: 2,
    },
    reps_plateau: {
      name: 'CLUSTER SETS',
      description: 'Break each set into clusters of 2-3 reps with 15 second intra-set rest. More total reps at heavy weight.',
      prescription: [
        'Load 90% of stalled weight',
        'Do 3 reps, rack, rest 15 sec',
        'Do 3 more reps, rack, rest 15 sec',
        'Repeat for 4-5 clusters per set',
        'This is one set — rest 3 min after',
      ],
      weeks: 2,
    },
  },
  lose_fat: {
    weight_plateau: {
      name: 'DENSITY TRAINING',
      description: 'Keep the weight. Do more total reps in the same time. More work capacity not more load.',
      prescription: [
        'Set a 15 minute timer',
        'Do as many quality sets as possible',
        'Rest only as needed',
        'Track total reps each session',
        'Beat your total next session',
      ],
      weeks: 2,
    },
    reps_plateau: {
      name: 'SUPERSET PROTOCOL',
      description: 'Pair the stalled exercise with its antagonist muscle. Higher metabolic demand drives adaptation.',
      prescription: [
        'Pair bench with barbell row',
        'Pair squat with Romanian deadlift',
        'No rest between the pair',
        'Rest 90 seconds after the pair',
        'Run for 2-3 weeks',
      ],
      weeks: 3,
    },
  },
  recomp: {
    weight_plateau: {
      name: 'MECHANICAL DROP SET',
      description: 'Change grip or stance at failure to continue the set in a stronger position. Same muscle, new angle.',
      prescription: [
        'Do your working sets normally',
        'At failure: change to easier variation',
        'e.g. flat → incline bench at failure',
        'e.g. squat → leg press at failure',
        'Continue without putting weight down',
      ],
      weeks: 2,
    },
  },
  get_faster: {
    weight_plateau: {
      name: 'CONTRAST TRAINING',
      description: 'Follow a heavy compound set immediately with an explosive movement. Potentiation effect unlocks new strength levels.',
      prescription: [
        'Heavy squat set (85%+ weight)',
        'Rest 15-20 seconds only',
        'Immediately do 5 box jumps',
        'Rest 3 minutes fully',
        'Repeat for all working sets',
      ],
      weeks: 2,
    },
  },
  train_for_race: {
    weight_plateau: {
      name: 'TEMPO RUN CARRY-OVER',
      description: 'Reduce strength session frequency by one day and add a race-pace interval run. Neurological freshness unlocks stuck lifts for endurance athletes.',
      prescription: [
        'Remove one strength session',
        'Add race-pace intervals that day',
        'Keep remaining strength days',
        'Reassess after 3 weeks',
      ],
      weeks: 3,
    },
  },
};

function getStrategy(goal, plateauType) {
  const goalKey = goal || 'build_muscle';
  return (
    STRATEGIES[goalKey]?.[plateauType] ||
    STRATEGIES.build_muscle[plateauType] ||
    STRATEGIES.build_muscle.weight_plateau
  );
}

export async function detectPlateaus(userId, profile) {
  if (!userId) return [];
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data: logs } = await sb
    .from('workout_logs')
    .select('date, workout')
    .eq('user_id', userId)
    .gte('date', eightWeeksAgo)
    .order('date', { ascending: false })
    .limit(20);

  if (!logs || logs.length < 3) return [];

  const exerciseHistory = {};
  logs.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      if (!COMPOUND_EXERCISES.includes(ex.name)) return;
      const doneSets = (ex.sets || []).filter(s => s.done);
      if (!doneSets.length) return;

      if (!exerciseHistory[ex.name]) exerciseHistory[ex.name] = [];
      const maxWeight = Math.max(...doneSets.map(s => parseFloat(s.weight) || 0));
      const totalVolume = doneSets.reduce((sum, s) =>
        sum + (parseFloat(s.weight || 0) * parseInt(s.reps || 0)), 0);

      exerciseHistory[ex.name].push({ date: log.date, maxWeight, totalVolume });
    });
  });

  const newPlateaus = [];
  const goal = getGoal(profile);

  for (const [exerciseName, history] of Object.entries(exerciseHistory)) {
    if (history.length < 3) continue;
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = history.slice(0, 4);

    // ── WEIGHT PLATEAU ──────────────────────────────────────────────────────
    const weights = recent.map(s => s.maxWeight);
    const weightVariance = Math.max(...weights) - Math.min(...weights);
    if (weights.length >= 3 && weightVariance <= 2.5) {
      const { data: existing } = await sb.from('plateaus').select('id')
        .eq('user_id', userId).eq('exercise_name', exerciseName)
        .eq('plateau_type', 'weight').eq('status', 'active').limit(1);

      if (!existing?.length) {
        const strategy = getStrategy(goal, 'weight_plateau');
        const { data: plateau } = await sb.from('plateaus').insert({
          user_id: userId,
          exercise_name: exerciseName,
          plateau_type: 'weight',
          detected_at: new Date().toISOString().split('T')[0],
          stalled_value: weights[0],
          sessions_stalled: weights.length,
          strategy_prescribed: strategy.name,
          status: 'active',
        }).select().maybeSingle();

        if (plateau) newPlateaus.push({ ...plateau, strategy, exerciseName });
      }
    }

    // ── VOLUME PLATEAU ───────────────────────────────────────────────────────
    const volumes = recent.map(s => s.totalVolume);
    const volumeTrend = volumes[0] - volumes[volumes.length - 1];
    if (volumes.length >= 3 && volumeTrend <= 0) {
      const { data: existing } = await sb.from('plateaus').select('id')
        .eq('user_id', userId).eq('exercise_name', exerciseName)
        .eq('plateau_type', 'volume').eq('status', 'active').limit(1);

      if (!existing?.length) {
        const strategy = getStrategy(goal, 'reps_plateau');
        const { data: plateau } = await sb.from('plateaus').insert({
          user_id: userId,
          exercise_name: exerciseName,
          plateau_type: 'volume',
          detected_at: new Date().toISOString().split('T')[0],
          stalled_value: volumes[0],
          sessions_stalled: volumes.length,
          strategy_prescribed: strategy.name,
          status: 'active',
        }).select().maybeSingle();

        if (plateau) newPlateaus.push({ ...plateau, strategy, exerciseName });
      }
    }
  }

  return newPlateaus;
}

export async function getActivePlateaus(userId) {
  if (!userId) return [];
  const { data } = await sb
    .from('plateaus')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('detected_at', { ascending: false });
  return data || [];
}

export async function checkPlateauResolved(userId, exerciseName, newWeight) {
  if (!userId || !exerciseName || !newWeight) return false;
  const { data: plateau } = await sb
    .from('plateaus')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_name', exerciseName)
    .eq('plateau_type', 'weight')
    .eq('status', 'active')
    .maybeSingle();

  if (!plateau) return false;
  if (newWeight > plateau.stalled_value + 2.5) {
    await sb.from('plateaus').update({
      status: 'resolved',
      resolved_at: new Date().toISOString().split('T')[0],
    }).eq('id', plateau.id);
    return true;
  }
  return false;
}

export function getStrategyForPlateau(plateau) {
  if (!plateau) return null;
  const goal = plateau.goal || 'build_muscle';
  const key = plateau.plateau_type === 'weight' ? 'weight_plateau' : 'reps_plateau';
  return STRATEGIES[goal]?.[key] || STRATEGIES.build_muscle[key] || null;
}

export function getStrategyByName(name) {
  if (!name) return null;
  for (const goal of Object.values(STRATEGIES)) {
    for (const strategy of Object.values(goal)) {
      if (strategy.name === name) return strategy;
    }
  }
  return null;
}
