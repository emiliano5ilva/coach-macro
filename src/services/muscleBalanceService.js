import { sb } from '../client';

const PUSH_EXERCISES = [
  'Barbell Bench Press', 'Incline Barbell Bench Press',
  'Dumbbell Bench Press', 'Incline Dumbbell Press',
  'Overhead Press', 'Dumbbell Shoulder Press',
  'Cable Fly', 'Chest Dip', 'Push-Up',
  'Tricep Pushdown', 'Skull Crusher',
  'Lateral Raise', 'Front Raise',
];

const PULL_EXERCISES = [
  'Barbell Row', 'Dumbbell Row', 'Cable Row',
  'Pull-Up', 'Weighted Pull-Up', 'Lat Pulldown',
  'Face Pull', 'Band Pull-Apart', 'Rear Delt Fly',
  'Bicep Curl', 'Hammer Curl', 'Deadlift',
];

const QUAD_EXERCISES = [
  'Barbell Back Squat', 'Barbell Front Squat',
  'Leg Press', 'Leg Extension',
  'Walking Lunge', 'Bulgarian Split Squat', 'Step-Up',
];

const POSTERIOR_EXERCISES = [
  'Romanian Deadlift', 'Deadlift', 'Hip Thrust',
  'Glute Bridge', 'Leg Curl', 'Good Morning',
  'Nordic Curl', 'Cable Pull-Through', 'Reverse Hyper',
];

function classifyExercise(name) {
  const cats = [];
  if (PUSH_EXERCISES.includes(name)) cats.push('push');
  if (PULL_EXERCISES.includes(name)) cats.push('pull');
  if (QUAD_EXERCISES.includes(name)) cats.push('quad');
  if (POSTERIOR_EXERCISES.includes(name)) cats.push('posterior');
  return cats;
}

function getBalanceStatus(ratio) {
  if (ratio <= 1.3) return 'balanced';
  if (ratio <= 1.6) return 'warning';
  return 'risk';
}

export async function calculateMuscleBalance(userId) {
  if (!userId) return null;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const { data: logs } = await sb
    .from('workout_logs')
    .select('date, workout')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false });

  if (!logs?.length) return null;

  let pushVolume = 0, pullVolume = 0, quadVolume = 0, posteriorVolume = 0;

  logs.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      const cats = classifyExercise(ex.name);
      if (!cats.length) return;
      const vol = (ex.sets || []).filter(s => s.done).reduce((sum, s) =>
        sum + (parseFloat(s.weight || 0) * parseInt(s.reps || 0)), 0);
      if (cats.includes('push')) pushVolume += vol;
      if (cats.includes('pull')) pullVolume += vol;
      if (cats.includes('quad')) quadVolume += vol;
      if (cats.includes('posterior')) posteriorVolume += vol;
    });
  });

  const pushPullRatio = pullVolume > 0
    ? Math.round((pushVolume / pullVolume) * 100) / 100
    : pushVolume > 0 ? 99 : 1;

  const quadPosteriorRatio = posteriorVolume > 0
    ? Math.round((quadVolume / posteriorVolume) * 100) / 100
    : quadVolume > 0 ? 99 : 1;

  const pushPullStatus = getBalanceStatus(pushPullRatio);
  const quadPosteriorStatus = getBalanceStatus(quadPosteriorRatio);
  const today = new Date().toISOString().split('T')[0];

  await sb.from('muscle_balance').upsert({
    user_id: userId,
    assessment_date: today,
    push_volume_lbs: Math.round(pushVolume),
    pull_volume_lbs: Math.round(pullVolume),
    quad_volume_lbs: Math.round(quadVolume),
    posterior_volume_lbs: Math.round(posteriorVolume),
    push_pull_ratio: pushPullRatio,
    quad_posterior_ratio: quadPosteriorRatio,
    push_pull_status: pushPullStatus,
    quad_posterior_status: quadPosteriorStatus,
  }, { onConflict: 'user_id,assessment_date' });

  return { pushVolume, pullVolume, quadVolume, posteriorVolume, pushPullRatio, quadPosteriorRatio, pushPullStatus, quadPosteriorStatus };
}

export function getBalanceCorrections(balance) {
  if (!balance) return [];
  const corrections = [];

  if (balance.pushPullStatus === 'warning' || balance.pushPullStatus === 'risk') {
    const excess = balance.pullVolume > 0
      ? Math.round((balance.pushVolume / balance.pullVolume - 1) * 100)
      : 100;
    corrections.push({
      type: 'push_pull',
      severity: balance.pushPullStatus,
      message: `Push volume is ${excess}% higher than pull volume.`,
      risk: balance.pushPullStatus === 'risk'
        ? 'High shoulder injury risk.'
        : 'Shoulder imbalance developing.',
      fix: 'Add one extra pulling exercise to every push session this week.',
      exercises: ['Face Pull — 3 × 15', 'Band Pull-Apart — 3 × 20', 'Cable Row — 3 × 12'],
    });
  }

  if (balance.quadPosteriorStatus === 'warning' || balance.quadPosteriorStatus === 'risk') {
    const excess = balance.posteriorVolume > 0
      ? Math.round((balance.quadVolume / balance.posteriorVolume - 1) * 100)
      : 100;
    corrections.push({
      type: 'quad_posterior',
      severity: balance.quadPosteriorStatus,
      message: `Quad volume is ${excess}% higher than posterior chain.`,
      risk: balance.quadPosteriorStatus === 'risk'
        ? 'High knee and lower back injury risk.'
        : 'Knee imbalance developing.',
      fix: 'Add Romanian deadlifts and hip thrusts to your next leg session.',
      exercises: ['Romanian Deadlift — 3 × 10', 'Hip Thrust — 3 × 12', 'Leg Curl — 3 × 15'],
    });
  }

  return corrections;
}

export async function getLatestBalance(userId) {
  if (!userId) return null;
  const { data } = await sb
    .from('muscle_balance')
    .select('*')
    .eq('user_id', userId)
    .order('assessment_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}
