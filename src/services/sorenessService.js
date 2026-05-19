import { sb } from '../client';

const CHIP_TO_GROUP = {
  'Quads':      'legs',
  'Hamstrings': 'legs',
  'Glutes':     'legs',
  'Calves':     'legs',
  'Chest':      'chest',
  'Back':       'back',
  'Shoulders':  'shoulders',
  'Arms':       'arms',
  'Core':       'core',
};

const GROUP_TO_SVG = {
  chest:     ['chest'],
  back:      ['traps', 'lats', 'lower-back'],
  shoulders: ['shoulders-f', 'rear-delts'],
  arms:      ['biceps', 'forearms-f', 'triceps', 'forearms-b'],
  core:      ['abs', 'hip-flexors'],
  legs:      ['quads', 'calves-f', 'glutes', 'hamstrings', 'calves-b'],
};

// score 1-3 → fresh (85-100%), 4-6 → moderate (41-65%), 7-8 → high (20-35%), 9-10 → severe (5-10%)
function sorenessToRecovery(score) {
  if (score <= 3) return 90;
  if (score <= 6) return 65 - ((score - 4) * 12);
  if (score <= 8) return 35 - ((score - 7) * 15);
  return 10;
}

export async function trainedYesterday(userId) {
  if (!userId) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const { data } = await sb
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', yesterdayStr)
    .limit(1);
  return (data?.length || 0) > 0;
}

export async function alreadyLoggedToday(userId) {
  if (!userId) return false;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('soreness_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();
  return !!data;
}

export async function logSoreness(userId, score, soreMuscles) {
  if (!userId) return;
  const today = new Date().toISOString().split('T')[0];
  await sb.from('soreness_logs').upsert(
    { user_id: userId, log_date: today, soreness_score: score, sore_muscles: soreMuscles },
    { onConflict: 'user_id,log_date' }
  );
  if (soreMuscles.length > 0) {
    await updateRecoveryFromSoreness(userId, score, soreMuscles);
  }
}

async function updateRecoveryFromSoreness(userId, score, soreMuscles) {
  const groups = [...new Set(soreMuscles.map(m => CHIP_TO_GROUP[m]).filter(Boolean))];
  if (!groups.length) return;

  const recoveryPct = sorenessToRecovery(score);
  const hoursAgo = ((100 - recoveryPct) / 100) * 48;
  const lastTrainedAt = new Date(Date.now() - hoursAgo * 3600000).toISOString();

  const upserts = groups.map(group => ({
    user_id: userId,
    muscle_group: group,
    svg_ids: GROUP_TO_SVG[group] || [],
    last_trained_at: lastTrainedAt,
  }));

  await sb.from('muscle_recovery').upsert(upserts, { onConflict: 'user_id,muscle_group' });

  window.dispatchEvent(new CustomEvent('sorenessLogged', { detail: { userId, groups, score } }));
}

export async function getTodaySoreness(userId) {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('soreness_logs')
    .select('soreness_score, sore_muscles')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();
  return data || null;
}
