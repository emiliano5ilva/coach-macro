import { sb } from '../client';

// Privacy gate: this service only activates when
//   profile.profile_data.sex === 'female'  AND
//   profile.profile_data.lastPeriodDate is set.
// Returns null for all other users unconditionally.

export function getCycleDay(lastPeriodDate, cycleLength) {
  if (!lastPeriodDate) return null;
  const last = new Date(lastPeriodDate);
  const today = new Date();
  const daysSince = Math.floor((today - last) / (24 * 60 * 60 * 1000));
  return (daysSince % cycleLength) + 1;
}

export function getCyclePhase(cycleDay, cycleLength) {
  const ratio = cycleDay / cycleLength;
  if (ratio < 0.18) return 'menstrual';
  if (ratio < 0.50) return 'follicular';
  if (ratio < 0.64) return 'ovulation';
  return 'luteal';
}

export function recordCycleObservation(checkin, profile, existingAdaptiveProfile) {
  const sex           = profile?.profile_data?.sex;
  const lastPeriodDate = profile?.profile_data?.lastPeriodDate;
  const cycleLength   = profile?.profile_data?.cycleLength ?? 28;

  if (sex !== 'female' || !lastPeriodDate) return null;

  const cycleDay = getCycleDay(lastPeriodDate, cycleLength);
  if (!cycleDay) return null;

  const readinessScore = { great: 5, good: 4, okay: 3, tired: 2, rough: 1 }[checkin.readiness] ?? 3;

  const newObs = {
    date: checkin.date,
    cycleDay,
    phase: getCyclePhase(cycleDay, cycleLength),
    readinessScore,
    soreness: checkin.overall_soreness ?? 0,
    energyLevel: readinessScore,
  };

  const existing = existingAdaptiveProfile?.cycleProfile ?? {};
  const allObs = [newObs, ...(existing.observations ?? [])].slice(0, 300);

  const minObs = cycleLength * 3;
  const pattern = allObs.length >= minObs
    ? computeCyclePattern(allObs, cycleLength)
    : null;

  return {
    ...(existingAdaptiveProfile ?? {}),
    cycleProfile: {
      observations: allObs,
      pattern,
      hasEnoughData: allObs.length >= minObs,
      observationsNeeded: Math.max(0, minObs - allObs.length),
      lastUpdated: checkin.date,
      cycleLength,
    },
  };
}

function computeCyclePattern(observations, cycleLength) {
  const byDay = {};
  for (let d = 1; d <= cycleLength; d++) {
    byDay[d] = { readiness: [], soreness: [] };
  }

  observations.forEach(obs => {
    const day = obs.cycleDay;
    if (byDay[day]) {
      byDay[day].readiness.push(obs.readinessScore);
      byDay[day].soreness.push(obs.soreness);
    }
  });

  const dailyAvg = {};
  for (let d = 1; d <= cycleLength; d++) {
    const r = byDay[d].readiness;
    const s = byDay[d].soreness;
    if (r.length < 2) continue;
    dailyAvg[d] = {
      avgReadiness: r.reduce((a, b) => a + b, 0) / r.length,
      avgSoreness:  s.reduce((a, b) => a + b, 0) / s.length,
      observations: r.length,
    };
  }

  const vals = Object.values(dailyAvg);
  if (!vals.length) return null;
  const overallAvgReadiness = vals.reduce((s, d) => s + d.avgReadiness, 0) / vals.length;

  const highWindow = Object.entries(dailyAvg)
    .filter(([, d]) => d.avgReadiness > overallAvgReadiness + 0.4)
    .map(([day]) => Number(day))
    .sort((a, b) => a - b);

  const lowWindow = Object.entries(dailyAvg)
    .filter(([, d]) => d.avgReadiness < overallAvgReadiness - 0.4)
    .map(([day]) => Number(day))
    .sort((a, b) => a - b);

  return {
    dailyAvg,
    overallAvgReadiness,
    highReadinessWindow: highWindow,
    lowReadinessWindow:  lowWindow,
    highPhrase: describeWindow(highWindow),
    lowPhrase:  describeWindow(lowWindow),
    confident: Object.values(dailyAvg).filter(d => d.observations >= 3).length >= cycleLength * 0.7,
  };
}

function describeWindow(days) {
  if (!days.length) return null;
  if (days.length === 1) return `day ${days[0]}`;
  const runs = [];
  let start = days[0], end = days[0];
  for (let i = 1; i < days.length; i++) {
    if (days[i] === end + 1) { end = days[i]; }
    else { runs.push([start, end]); start = end = days[i]; }
  }
  runs.push([start, end]);
  return runs.map(([s, e]) => s === e ? `day ${s}` : `days ${s}-${e}`).join(', ');
}

export function getCycleAdjustment(profile, adaptiveProfile) {
  const sex = profile?.profile_data?.sex;
  if (sex !== 'female') return null;

  const cp = adaptiveProfile?.cycleProfile;
  if (!cp?.hasEnoughData || !cp?.pattern?.confident) return null;

  const lastPeriodDate = profile?.profile_data?.lastPeriodDate;
  const cycleLength = cp.cycleLength ?? 28;
  const today = getCycleDay(lastPeriodDate, cycleLength);
  if (!today) return null;

  const pattern = cp.pattern;
  const isHighDay = pattern.highReadinessWindow.includes(today);
  const isLowDay  = pattern.lowReadinessWindow.includes(today);

  if (isHighDay) {
    return {
      multiplier: 1.05,
      label: 'high',
      insight: `Your personal data shows this is typically a high-readiness point in your cycle — a good day to push.`,
    };
  }
  if (isLowDay) {
    return {
      multiplier: 0.88,
      label: 'low',
      insight: `Your personal data shows this is typically a lower-readiness point in your cycle. Volume is adjusted. This is your pattern — not a prediction, your own data.`,
    };
  }
  return null;
}

// ─── Wire: call after morning check-in submit ─────────

export async function processCycleMorningCheckin(userId, checkin, profile) {
  const updated = recordCycleObservation(checkin, profile, profile?.adaptive_profile);
  if (!updated) return;

  await sb
    .from('profiles')
    .update({ adaptive_profile: updated })
    .eq('id', userId);
}
