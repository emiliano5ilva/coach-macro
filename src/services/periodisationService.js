import { sb } from '../client';

export async function assessCurrentWeek(userId) {
  if (!userId) return null;

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Sunday = start
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];

  const { data: profileRow } = await sb
    .from('profiles')
    .select('wprefs, program_current_week, program_total_weeks')
    .eq('id', userId)
    .maybeSingle();

  const schedule = profileRow?.wprefs?.schedule || {};
  const programCurrentWeek = profileRow?.program_current_week || 1;
  const programTotalWeeks = profileRow?.program_total_weeks || 12;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const plannedDays = days.filter(d => schedule[d] && schedule[d] !== 'rest').length;

  const [{ data: weekLogs }, { data: weekPRs }, { data: recentPRs }, { data: plateaus }] = await Promise.all([
    sb.from('workout_logs').select('date').eq('user_id', userId).gte('date', weekStartStr).lte('date', todayStr),
    sb.from('personal_records').select('id').eq('user_id', userId).gte('date', weekStartStr).lte('date', todayStr),
    sb.from('personal_records').select('id').eq('user_id', userId)
      .gte('date', new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]),
    sb.from('plateaus').select('id').eq('user_id', userId).eq('status', 'active'),
  ]);

  const completedDays = (weekLogs || []).length;
  const prCount = (weekPRs || []).length;
  const recentPRCount = (recentPRs || []).length;
  const plateauCount = (plateaus || []).length;
  const compliance = plannedDays > 0 ? completedDays / plannedDays : 0;
  const missedSessions = Math.max(0, plannedDays - completedDays);

  const advanceSignals = [];
  const repeatSignals = [];

  if (compliance >= 1.0 && plannedDays >= 3) advanceSignals.push(`Full compliance: ${completedDays}/${plannedDays} sessions`);
  if (prCount >= 3) advanceSignals.push(`${prCount} PRs this week`);
  if (compliance >= 0.9 && prCount >= 1) advanceSignals.push(`Strong performance signal`);

  if (missedSessions >= 2) repeatSignals.push(`Missed ${missedSessions} planned sessions`);
  if (recentPRCount === 0 && programCurrentWeek > 2) repeatSignals.push(`No PRs in 2 weeks`);
  if (plateauCount >= 2) repeatSignals.push(`${plateauCount} active plateaus`);
  if (compliance < 0.6 && plannedDays >= 3) repeatSignals.push(`Low compliance: ${Math.round(compliance * 100)}%`);

  let action = 'no_change';
  let reasons = [];

  if (advanceSignals.length >= 2 && repeatSignals.length === 0) {
    action = 'advance';
    reasons = advanceSignals;
  } else if (repeatSignals.length >= 2 || (repeatSignals.length >= 1 && advanceSignals.length === 0 && compliance < 0.8)) {
    action = 'repeat';
    reasons = repeatSignals;
  }

  return {
    action,
    reasons,
    signals: { plannedDays, completedDays, compliance: Math.round(compliance * 100), prCount, recentPRCount, plateauCount, missedSessions },
    currentWeek: programCurrentWeek,
    totalWeeks: programTotalWeeks,
    advanceSignals,
    repeatSignals,
  };
}

export async function checkPeriodisationAdjustment(userId) {
  if (!userId) return null;
  if (new Date().getDay() !== 0) return null; // Sundays only

  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await sb
    .from('program_adjustments')
    .select('id, action, old_week, new_week, reason, signals')
    .eq('user_id', userId)
    .eq('assessed_at', today)
    .maybeSingle();

  if (existing) return existing;

  const assessment = await assessCurrentWeek(userId);
  if (!assessment) return null;

  const { action, reasons, signals, currentWeek, totalWeeks } = assessment;
  const newWeek = action === 'advance' ? Math.min(currentWeek + 1, totalWeeks) : currentWeek;

  const { data: adjustment } = await sb
    .from('program_adjustments')
    .insert({
      user_id: userId,
      assessed_at: today,
      action,
      old_week: currentWeek,
      new_week: newWeek,
      reason: reasons.join('; '),
      signals,
    })
    .select()
    .maybeSingle();

  if (action !== 'no_change') {
    await sb.from('profiles').upsert(
      { id: userId, program_current_week: newWeek, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  }

  return adjustment
    ? { ...adjustment, advanceSignals: assessment.advanceSignals, repeatSignals: assessment.repeatSignals }
    : null;
}

export async function getRecentAdjustments(userId) {
  if (!userId) return [];
  const { data } = await sb
    .from('program_adjustments')
    .select('*')
    .eq('user_id', userId)
    .order('assessed_at', { ascending: false })
    .limit(5);
  return data || [];
}

