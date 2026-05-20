import { sb } from '../supabase.js';

// ── SIGNAL THRESHOLDS ─────────────────────────────────────────────────────────

const THRESHOLDS = {
  rpe_high: 8.5,
  soreness_high: 7,
  planned_interval_weeks: {
    very_fast: 6,
    normal: 5,
    slower: 4,
    very_slow: 3,
  },
};

// ── MAIN DETECTION FUNCTION ───────────────────────────────────────────────────

export async function checkDeloadNeeded(userId) {
  if (!userId) return null;
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const fourWeeksAgo = new Date(now - 28 * 864e5).toISOString().split('T')[0];
  const twoWeeksAgo = new Date(now - 14 * 864e5).toISOString().split('T')[0];

  // Skip if already has an upcoming/active deload
  const { data: existing } = await sb
    .from('deload_weeks')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['upcoming', 'active'])
    .gte('week_end', today)
    .limit(1);
  if (existing?.length > 0) return null;

  const [profileRes, sessionsRes, sorenessRes, lastDeloadRes] = await Promise.all([
    sb.from('profiles').select('program_start_date, skill_level, wprefs').eq('id', userId).single(),
    sb.from('workout_logs')
      .select('date, volume_lbs, total_sets, workout')
      .eq('user_id', userId)
      .gte('date', fourWeeksAgo)
      .order('date', { ascending: false })
      .limit(12),
    sb.from('soreness_logs')
      .select('log_date, soreness_score')
      .eq('user_id', userId)
      .gte('log_date', twoWeeksAgo)
      .order('log_date', { ascending: false }),
    sb.from('deload_weeks')
      .select('week_start')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const prof = profileRes.data;
  const sessions = sessionsRes.data || [];
  const soreness = sorenessRes.data || [];
  const lastDeloadDate = lastDeloadRes.data?.week_start || null;

  const signals = {};
  let triggerCount = 0;

  // ── SIGNAL 1: SORENESS HIGH ────────────────────────────────────────────────
  if (soreness.length >= 3) {
    const recent = soreness.slice(0, 5).map(s => s.soreness_score);
    const highStreak = recent.filter(s => s >= THRESHOLDS.soreness_high).length;
    const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
    if (highStreak >= 3) {
      signals.soreness_high = {
        avg: Math.round(avg * 10) / 10,
        streak: highStreak,
        message: `Soreness score ${Math.round(avg * 10) / 10}+ for ${highStreak} consecutive days`,
      };
      triggerCount++;
    }
  }

  // ── SIGNAL 2: PERFORMANCE DECLINING ───────────────────────────────────────
  if (sessions.length >= 3) {
    const vols = sessions.slice(0, 4).map(s => s.volume_lbs || 0);
    let declineCount = 0;
    for (let i = 0; i < vols.length - 1; i++) {
      if (vols[i] < vols[i + 1]) declineCount++;
    }
    if (declineCount >= 2) {
      signals.performance_decline = {
        sessions: declineCount,
        message: `Training volume declined for ${declineCount} consecutive sessions`,
      };
      triggerCount++;
    }
  }

  // ── SIGNAL 3: PLANNED INTERVAL ─────────────────────────────────────────────
  const recoveryCapacity = prof?.wprefs?.recoveryCapacity || 'normal';
  const plannedInterval = THRESHOLDS.planned_interval_weeks[recoveryCapacity] || 5;
  const programStart = new Date(prof?.program_start_date || now);
  const weeksSinceStart = Math.floor((now - programStart) / (7 * 864e5));
  const weeksSinceDeload = lastDeloadDate
    ? Math.floor((now - new Date(lastDeloadDate)) / (7 * 864e5))
    : weeksSinceStart;

  if (weeksSinceDeload >= plannedInterval) {
    signals.planned = {
      weeks: weeksSinceDeload,
      interval: plannedInterval,
      message: `${weeksSinceDeload} weeks since last deload — interval is every ${plannedInterval} weeks`,
    };
    triggerCount++;
  }

  // ── DETERMINE IF DELOAD NEEDED ─────────────────────────────────────────────
  // Planned alone is enough; reactive needs 2+ signals
  const deloadNeeded = signals.planned || triggerCount >= 2;
  if (!deloadNeeded) return null;

  // ── SCHEDULE: NEXT MONDAY ──────────────────────────────────────────────────
  const nextMonday = new Date(now);
  const day = nextMonday.getDay();
  const daysUntil = day === 1 ? 7 : day === 0 ? 1 : 8 - day;
  nextMonday.setDate(nextMonday.getDate() + daysUntil);
  const deloadStart = nextMonday.toISOString().split('T')[0];
  const deloadEndDate = new Date(nextMonday);
  deloadEndDate.setDate(deloadEndDate.getDate() + 6);
  const deloadEnd = deloadEndDate.toISOString().split('T')[0];

  const triggerReason = signals.planned && triggerCount <= 1
    ? 'planned'
    : triggerCount >= 2 ? 'combined' : Object.keys(signals)[0];

  const { data: deload, error } = await sb
    .from('deload_weeks')
    .upsert({
      user_id: userId,
      week_start: deloadStart,
      week_end: deloadEnd,
      trigger_reason: triggerReason,
      trigger_signals: signals,
      status: 'upcoming',
      volume_reduction_pct: 50,
    }, { onConflict: 'user_id,week_start' })
    .select()
    .single();

  if (error) { console.error('[deloadService] upsert error:', error); return null; }

  return { deload, signals, triggerReason, deloadStart, deloadEnd };
}

// ── GET ACTIVE DELOAD ─────────────────────────────────────────────────────────

export async function getActiveDeload(userId) {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('deload_weeks')
    .select('*')
    .eq('user_id', userId)
    .lte('week_start', today)
    .gte('week_end', today)
    .limit(1)
    .maybeSingle();
  return data || null;
}

// ── GET UPCOMING DELOAD ───────────────────────────────────────────────────────

export async function getUpcomingDeload(userId) {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('deload_weeks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'upcoming')
    .gt('week_start', today)
    .order('week_start', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data || null;
}

// ── GET DELOAD HISTORY ────────────────────────────────────────────────────────

export async function getDeloadHistory(userId, limit = 20) {
  if (!userId) return [];
  const { data } = await sb
    .from('deload_weeks')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── APPLY DELOAD TO SESSION ───────────────────────────────────────────────────

export function applyDeloadToSession(exercises, volumeReductionPct = 50) {
  const factor = 1 - volumeReductionPct / 100;
  return exercises.map(ex => {
    const reducedSets = (ex.sets || [])
      .slice(0, Math.max(2, Math.ceil((ex.sets || []).length * factor)))
      .map(set => ({
        ...set,
        weight: set.weight
          ? String(Math.round(parseFloat(set.weight) * factor / 2.5) * 2.5)
          : set.weight,
        reps: String(Math.min(parseInt(set.reps || 8), 8)),
      }));
    return { ...ex, sets: reducedSets };
  });
}

// ── STATUS TRANSITIONS ────────────────────────────────────────────────────────

export async function activateUpcomingDeload(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('deload_weeks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'upcoming')
    .lte('week_start', today)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  await sb.from('deload_weeks').update({ status: 'active' }).eq('id', data.id);
  return { ...data, status: 'active' };
}

export async function completeExpiredDeload(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb
    .from('deload_weeks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lt('week_end', today)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  await sb.from('deload_weeks').update({ status: 'completed' }).eq('id', data.id);
  return data;
}

export async function skipDeload(userId, deloadId) {
  await sb.from('deload_weeks').update({ status: 'skipped' }).eq('id', deloadId).eq('user_id', userId);
}

export async function completeDeload(userId, deloadId) {
  await sb.from('deload_weeks').update({ status: 'completed' }).eq('id', deloadId).eq('user_id', userId);
}
