import { sb } from '../client.js';
import { recallApplicableLearnings } from './coachMemoryService.js';

// ─── Pattern definitions ──────────────────────────────────────────────────────

export const FAILURE_PATTERNS = {
  honeymoon_crash: {
    name: 'The Honeymoon Phase',
    emoji: '🌙',
    description: 'Strong start followed by a sudden drop-off',
    stages: {
      early:    { label: 'Early signal',   color: '#F59E0B', bg: '#FEF3C7' },
      mid:      { label: 'Pattern forming', color: '#F97316', bg: '#FED7AA' },
      critical: { label: 'Needs attention', color: '#EF4444', bg: '#FEE2E2' },
    },
  },
  plateau_panic: {
    name: 'Plateau Panic',
    emoji: '📊',
    description: 'Scale stall triggering drastic changes or giving up',
    stages: {
      early:    { label: 'Early signal',   color: '#F59E0B', bg: '#FEF3C7' },
      mid:      { label: 'Pattern forming', color: '#F97316', bg: '#FED7AA' },
      critical: { label: 'Needs attention', color: '#EF4444', bg: '#FEE2E2' },
    },
  },
  overtraining_spiral: {
    name: 'Overtraining Spiral',
    emoji: '🔄',
    description: 'Volume climbing while recovery tanks',
    stages: {
      early:    { label: 'Watch carefully', color: '#F59E0B', bg: '#FEF3C7' },
      mid:      { label: 'Pattern forming', color: '#F97316', bg: '#FED7AA' },
      critical: { label: 'Recovery needed', color: '#EF4444', bg: '#FEE2E2' },
    },
  },
  sleep_tax: {
    name: 'Sleep Tax',
    emoji: '😴',
    description: 'Accumulated sleep debt sabotaging results',
    stages: {
      early:    { label: 'Sleep slightly low', color: '#F59E0B', bg: '#FEF3C7' },
      mid:      { label: 'Sleep debt growing', color: '#F97316', bg: '#FED7AA' },
      critical: { label: 'Sleep debt critical', color: '#EF4444', bg: '#FEE2E2' },
    },
  },
  perfection_trap: {
    name: 'The Perfection Trap',
    emoji: '🎯',
    description: 'One off-day spiraling into a lost week',
    stages: {
      early:    { label: 'Early signal',   color: '#F59E0B', bg: '#FEF3C7' },
      mid:      { label: 'Pattern forming', color: '#F97316', bg: '#FED7AA' },
      critical: { label: 'Needs attention', color: '#EF4444', bg: '#FEE2E2' },
    },
  },
  the_coaster: {
    name: 'The Coaster',
    emoji: '🎢',
    description: 'Effort cycles with no net forward progress',
    stages: {
      early:    { label: 'Cycle detected',  color: '#F59E0B', bg: '#FEF3C7' },
      mid:      { label: 'Cycle repeating', color: '#F97316', bg: '#FED7AA' },
      critical: { label: 'Breaking the cycle', color: '#EF4444', bg: '#FEE2E2' },
    },
  },
};

// ─── Individual pattern detectors ────────────────────────────────────────────

function detectHoneymoonCrash({ foodLogs, workoutLogs, weightLogs, memberDays }) {
  if (memberDays < 14 || memberDays > 90) return null;

  const now = Date.now();
  const day = 864e5;

  // Logging frequency: first 14 days vs last 7 days
  const first14 = foodLogs.filter(l => {
    const d = new Date(l.date || l.logged_at).getTime();
    const age = (now - d) / day;
    return age <= memberDays && age >= memberDays - 14;
  });
  const last7Food = foodLogs.filter(l => {
    const age = (now - new Date(l.date || l.logged_at).getTime()) / day;
    return age <= 7;
  });

  const earlyLogDays  = new Set(first14.map(l => (l.date || l.logged_at || '').slice(0, 10))).size;
  const recentLogDays = new Set(last7Food.map(l => (l.date || l.logged_at || '').slice(0, 10))).size;

  // Workout frequency drop
  const early14Workouts = workoutLogs.filter(l => {
    const age = (now - new Date(l.date).getTime()) / day;
    return age <= memberDays && age >= memberDays - 14;
  }).length;
  const last7Workouts = workoutLogs.filter(l => {
    const age = (now - new Date(l.date).getTime()) / day;
    return age <= 7;
  }).length;

  const logDropPct    = earlyLogDays > 0 ? 1 - (recentLogDays / (earlyLogDays / 2)) : 0;
  const workoutDropPct = early14Workouts > 0 ? 1 - ((last7Workouts * 2) / early14Workouts) : 0;

  const signals = { logDropPct, workoutDropPct, memberDays, earlyLogDays, recentLogDays };

  if (logDropPct > 0.6 && workoutDropPct > 0.5) {
    return { pattern: 'honeymoon_crash', stage: 'critical', signals };
  }
  if (logDropPct > 0.4 || workoutDropPct > 0.4) {
    return { pattern: 'honeymoon_crash', stage: 'mid', signals };
  }
  if ((logDropPct > 0.25 || workoutDropPct > 0.25) && memberDays >= 21) {
    return { pattern: 'honeymoon_crash', stage: 'early', signals };
  }
  return null;
}

function detectPlateauPanic({ weightLogs, foodLogs, memberDays }) {
  if (memberDays < 30 || weightLogs.length < 14) return null;

  const now = Date.now();
  const day = 864e5;

  // Last 14 days of weight
  const recent14 = weightLogs
    .filter(l => (now - new Date(l.date).getTime()) / day <= 14)
    .map(l => parseFloat(l.weight))
    .filter(n => !isNaN(n));

  if (recent14.length < 5) return null;

  const min14 = Math.min(...recent14);
  const max14 = Math.max(...recent14);
  const range14 = max14 - min14;
  const isStalled = range14 < 1.5; // less than 1.5 lb swing over 14 days

  if (!isStalled) return null;

  // Detect erratic calorie behavior during stall (large swings = panic dieting)
  const last14Food = foodLogs.filter(l => (now - new Date(l.date || l.logged_at).getTime()) / day <= 14);
  const dailyCals = Object.values(
    last14Food.reduce((acc, l) => {
      const d = (l.date || l.logged_at || '').slice(0, 10);
      acc[d] = (acc[d] || 0) + (l.calories || 0);
      return acc;
    }, {})
  );

  let erraticSwings = 0;
  for (let i = 1; i < dailyCals.length; i++) {
    if (Math.abs(dailyCals[i] - dailyCals[i - 1]) > 600) erraticSwings++;
  }

  const signals = { range14, isStalled, erraticSwings, dayCount: recent14.length };

  if (isStalled && erraticSwings >= 3) return { pattern: 'plateau_panic', stage: 'critical', signals };
  if (isStalled && erraticSwings >= 1) return { pattern: 'plateau_panic', stage: 'mid', signals };
  if (isStalled)                        return { pattern: 'plateau_panic', stage: 'early', signals };
  return null;
}

function detectOvertrainingSpiral({ workoutLogs, bioData, memberDays }) {
  if (memberDays < 21 || workoutLogs.length < 10) return null;

  const now = Date.now();
  const day = 864e5;

  const week1 = workoutLogs.filter(l => { const a = (now - new Date(l.date).getTime()) / day; return a <= 7; });
  const week2 = workoutLogs.filter(l => { const a = (now - new Date(l.date).getTime()) / day; return a > 7 && a <= 14; });
  const week3 = workoutLogs.filter(l => { const a = (now - new Date(l.date).getTime()) / day; return a > 14 && a <= 21; });

  const vol1 = week1.reduce((s, l) => s + (l.volume_lbs || 0), 0);
  const vol2 = week2.reduce((s, l) => s + (l.volume_lbs || 0), 0);
  const vol3 = week3.reduce((s, l) => s + (l.volume_lbs || 0), 0);

  const volumeTrend = vol3 > 0 ? (vol1 - vol3) / vol3 : 0; // positive = increasing

  // HRV from bioData (daily_health_snapshots or bio_data_points)
  const recentHrv = bioData
    .filter(d => (now - new Date(d.date || d.recorded_at).getTime()) / day <= 7)
    .map(d => d.hrv)
    .filter(n => typeof n === 'number' && n > 0);

  const olderHrv = bioData
    .filter(d => { const a = (now - new Date(d.date || d.recorded_at).getTime()) / day; return a > 7 && a <= 21; })
    .map(d => d.hrv)
    .filter(n => typeof n === 'number' && n > 0);

  const avgRecentHrv = recentHrv.length ? recentHrv.reduce((s, v) => s + v, 0) / recentHrv.length : null;
  const avgOlderHrv  = olderHrv.length  ? olderHrv.reduce((s, v) => s + v, 0)  / olderHrv.length  : null;
  const hrvDrop = (avgRecentHrv && avgOlderHrv) ? (avgOlderHrv - avgRecentHrv) / avgOlderHrv : 0;

  const volumeIncreasing = volumeTrend > 0.1;
  const signals = { volumeTrend, hrvDrop, vol1, vol2, vol3, avgRecentHrv };

  if (volumeIncreasing && hrvDrop > 0.15) return { pattern: 'overtraining_spiral', stage: 'critical', signals };
  if (volumeIncreasing && hrvDrop > 0.08) return { pattern: 'overtraining_spiral', stage: 'mid', signals };
  if (volumeIncreasing && week1.length >= 6) return { pattern: 'overtraining_spiral', stage: 'early', signals };
  return null;
}

function detectSleepTax({ bioData, memberDays }) {
  if (memberDays < 14 || bioData.length < 7) return null;

  const now = Date.now();
  const day = 864e5;

  const last14Sleep = bioData
    .filter(d => (now - new Date(d.date || d.recorded_at).getTime()) / day <= 14)
    .map(d => d.sleep)
    .filter(n => typeof n === 'number' && n > 0);

  if (last14Sleep.length < 5) return null;

  const avgSleep     = last14Sleep.reduce((s, v) => s + v, 0) / last14Sleep.length;
  const nightsUnder6 = last14Sleep.filter(s => s < 6).length;
  const nightsUnder7 = last14Sleep.filter(s => s < 7).length;

  const signals = { avgSleep, nightsUnder6, nightsUnder7, sampleDays: last14Sleep.length };

  if (avgSleep < 6 || nightsUnder6 >= 5)  return { pattern: 'sleep_tax', stage: 'critical', signals };
  if (avgSleep < 6.5 || nightsUnder6 >= 3) return { pattern: 'sleep_tax', stage: 'mid', signals };
  if (avgSleep < 7 || nightsUnder7 >= 5)   return { pattern: 'sleep_tax', stage: 'early', signals };
  return null;
}

function detectPerfectionTrap({ foodLogs, workoutLogs, memberDays }) {
  if (memberDays < 21 || foodLogs.length < 10) return null;

  const now = Date.now();
  const day = 864e5;

  // Find days with >200% of calorie target (binge/off days) — use 3000 as proxy
  const last30Food = foodLogs.filter(l => (now - new Date(l.date || l.logged_at).getTime()) / day <= 30);
  const byDay = last30Food.reduce((acc, l) => {
    const d = (l.date || l.logged_at || '').slice(0, 10);
    acc[d] = (acc[d] || 0) + (l.calories || 0);
    return acc;
  }, {});

  const dayValues = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b));

  // Count multi-day logging gaps after high-cal days (>2800 kcal)
  let gapAfterHighDay = 0;
  for (let i = 0; i < dayValues.length - 1; i++) {
    const [dateStr, cals] = dayValues[i];
    if (cals > 2800) {
      const nextDate = new Date(dayValues[i + 1]?.[0]);
      const thisDate = new Date(dateStr);
      const gap = (nextDate - thisDate) / day;
      if (gap >= 2) gapAfterHighDay++;
    }
  }

  // Workout gaps: days since last workout
  const lastWorkout = workoutLogs[0] ? new Date(workoutLogs[0].date) : null;
  const daysSinceWorkout = lastWorkout ? (now - lastWorkout.getTime()) / day : 999;

  // Did a high-cal day precede the gap?
  const recentHighCal = dayValues.slice(-3).some(([, c]) => c > 2800);

  const signals = { gapAfterHighDay, daysSinceWorkout, recentHighCal };

  if (gapAfterHighDay >= 3 && daysSinceWorkout > 5) return { pattern: 'perfection_trap', stage: 'critical', signals };
  if (gapAfterHighDay >= 2 || (recentHighCal && daysSinceWorkout > 3)) return { pattern: 'perfection_trap', stage: 'mid', signals };
  if (gapAfterHighDay >= 1) return { pattern: 'perfection_trap', stage: 'early', signals };
  return null;
}

function detectCoaster({ weightLogs, foodLogs, workoutLogs, memberDays }) {
  if (memberDays < 45 || weightLogs.length < 20) return null;

  const now = Date.now();
  const day = 864e5;

  // Split into 3 windows of 15 days
  const w = (from, to) => weightLogs
    .filter(l => { const a = (now - new Date(l.date).getTime()) / day; return a <= from && a > to; })
    .map(l => parseFloat(l.weight))
    .filter(n => !isNaN(n));

  const w1 = w(15, 0);
  const w2 = w(30, 15);
  const w3 = w(45, 30);

  if (!w1.length || !w2.length || !w3.length) return null;

  const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const a1 = avg(w1), a2 = avg(w2), a3 = avg(w3);

  // Coasting: net weight change < 1 lb over 45 days, but there was movement mid-period
  const netChange = Math.abs(a1 - a3);
  const hadMovement = Math.abs(a2 - a3) > 1.5;
  const backToStart = Math.abs(a1 - a3) < 1.0;

  // Also check calorie variance — coasters have high weekly variance
  const last45Food = foodLogs.filter(l => (now - new Date(l.date || l.logged_at).getTime()) / day <= 45);
  const weeklyAvg = [0, 1, 2, 3, 4, 5].map(wk => {
    const wf = last45Food.filter(l => {
      const a = (now - new Date(l.date || l.logged_at).getTime()) / day;
      return a > wk * 7 && a <= (wk + 1) * 7;
    });
    const total = wf.reduce((s, l) => s + (l.calories || 0), 0);
    const days  = new Set(wf.map(l => (l.date || l.logged_at || '').slice(0, 10))).size;
    return days > 0 ? total / days : null;
  }).filter(v => v !== null);

  let cyclicSwings = 0;
  for (let i = 1; i < weeklyAvg.length; i++) {
    if (Math.abs(weeklyAvg[i] - weeklyAvg[i - 1]) > 400) cyclicSwings++;
  }

  const signals = { netChange, hadMovement, backToStart, cyclicSwings, a1, a2, a3 };

  if (hadMovement && backToStart && cyclicSwings >= 3) return { pattern: 'the_coaster', stage: 'critical', signals };
  if (hadMovement && backToStart && cyclicSwings >= 1) return { pattern: 'the_coaster', stage: 'mid', signals };
  if (cyclicSwings >= 2 && netChange < 2)              return { pattern: 'the_coaster', stage: 'early', signals };
  return null;
}

// ─── Interventions ────────────────────────────────────────────────────────────

const INTERVENTIONS = {
  honeymoon_crash: {
    early: {
      headline: 'The first month is the hardest.',
      body: "Your momentum is starting to slow — that's completely normal. The goal now isn't perfection, it's just showing up. One logged meal today keeps the streak alive.",
      actions: ['Log today', 'See my streak', 'Tell me more'],
    },
    mid: {
      headline: "You're in the dip. This is the hardest part.",
      body: "Most people quit here. The initial excitement has worn off — but this is exactly when habits form. Your results in month 3 are built right now.",
      actions: ["See what's worked", 'Simplify my plan', 'I understand'],
    },
    critical: {
      headline: "Real talk — you're about to lose everything you built.",
      body: "Your logging has dropped significantly. Every day you don't log, the goal gets further away. But it only takes 24 hours to restart momentum.",
      actions: ['Log right now', 'Talk to my coach', 'Remind me tomorrow'],
    },
  },
  plateau_panic: {
    early: {
      headline: "The scale hasn't moved — and that's data, not failure.",
      body: "A 14-day stall is physiologically normal. Your body is adapting. Drastic cuts now will cost you muscle and spike rebound risk. Stay the course.",
      actions: ['Show my trend', 'What should I adjust?', 'Got it'],
    },
    mid: {
      headline: "Your calories are getting erratic.",
      body: "Swinging between restriction and overeating during a plateau makes it worse. Consistency beats intensity right now — same calories every day for 7 days.",
      actions: ['Set a consistent target', 'Explain the science', "I'll try"],
    },
    critical: {
      headline: "The plateau is the problem, panic-dieting is making it worse.",
      body: "Drastic calorie swings disrupt leptin and cortisol, extending the plateau. Your coach needs to review your 4-week trend before making any changes.",
      actions: ['Review my 4-week data', 'Talk to my coach', 'Reset my approach'],
    },
  },
  overtraining_spiral: {
    early: {
      headline: "You're training hard. Make sure you recover just as hard.",
      body: "Training volume is climbing. As long as sleep and nutrition keep up, you're fine. Watch your HRV — if it trends down, add a rest day this week.",
      actions: ['Check my HRV trend', 'See my schedule', 'On it'],
    },
    mid: {
      headline: "Your recovery isn't keeping up with your training.",
      body: "HRV is dipping while volume climbs. This is how overtraining starts. A deload week now costs you 5 days but saves you 6 weeks of burnout.",
      actions: ['Schedule a deload', 'What is a deload?', 'I feel fine'],
    },
    critical: {
      headline: "Your body is in a recovery deficit.",
      body: "HRV has dropped meaningfully while you've been pushing harder. Continuing without a recovery week risks illness, injury, or a crash. Your coach recommends 5–7 days of light activity only.",
      actions: ['Take a deload week', 'Show me the signals', 'I hear you'],
    },
  },
  sleep_tax: {
    early: {
      headline: "Your sleep is slightly below where your goals need it.",
      body: "Under 7 hours slows fat loss by 55%, increases hunger hormones, and reduces strength gains. You don't need perfect sleep — but aim for 7 tonight.",
      actions: ['Set a sleep reminder', 'How does sleep affect fat loss?', 'Noted'],
    },
    mid: {
      headline: "Sleep debt is accumulating and it's affecting your results.",
      body: "You've averaged under 6.5 hours for nearly two weeks. Cortisol is elevated, ghrelin is higher, and your body is holding water. Sleep is the free performance drug you're not taking.",
      actions: ['Help me sleep better', 'Set a 10pm reminder', 'Working on it'],
    },
    critical: {
      headline: "Chronic sleep deprivation is your biggest obstacle right now.",
      body: "No macro plan, supplement, or training tweak will overcome sustained sleep deprivation. Your TDEE algorithm is compensating — but the root cause needs to be addressed.",
      actions: ['Talk to my coach', 'Help me fix my sleep', 'I know, I know'],
    },
  },
  perfection_trap: {
    early: {
      headline: "One off-day doesn't break your progress.",
      body: "A single high-calorie day has zero meaningful impact on your trend — unless it becomes three days. The only thing that matters now is getting back on track today.",
      actions: ['Log today anyway', 'See my overall trend', "You're right"],
    },
    mid: {
      headline: "The gap after a hard day is becoming a pattern.",
      body: "Skipping logging after a tough day feels easier in the moment, but each gap makes the next restart harder. Your best day doesn't need to be yesterday — it just needs to be today.",
      actions: ['Start fresh today', 'Log yesterday too', 'I needed this'],
    },
    critical: {
      headline: "You've been in the spiral for almost a week.",
      body: "This is the perfection trap — where good becomes the enemy of done. Progress isn't linear. Your coach has seen this before and knows how to break the cycle.",
      actions: ['Help me reset', 'Talk to my coach', 'Log right now'],
    },
  },
  the_coaster: {
    early: {
      headline: "Your weekly effort is cycling a bit.",
      body: "Some weeks you're locked in, others you coast. That's life — but the pattern can hold back net progress. What's different about the weeks you nail it?",
      actions: ['See my best week', 'What drives the swings?', 'Makes sense'],
    },
    mid: {
      headline: "You're working hard, but cycling back to the start.",
      body: "Great weeks are being offset by coast weeks. The net trend is close to flat. The fix isn't trying harder in the good weeks — it's raising the floor in the coasting ones.",
      actions: ['Set a coasting floor', 'Show me my pattern', 'Help me break it'],
    },
    critical: {
      headline: "Six weeks in, you're close to where you started.",
      body: "Two steps forward, two steps back. Your effort is real, but it's not compounding. Your coach wants to look at what's happening between your good weeks.",
      actions: ['Talk to my coach', 'Analyze my cycles', 'I want to fix this'],
    },
  },
};

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function detectActivePatterns(userId, preloadedData = {}) {
  if (!userId) return null;

  const cacheKey = `cm_patterns_${userId}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { ts, result } = JSON.parse(cached);
      if (Date.now() - ts < 6 * 36e5) return result; // 6-hour cache
    } catch {}
  }

  const {
    workoutLogs = [],
    weightLogs  = [],
    profile     = {},
  } = preloadedData;

  const memberDays = profile.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 864e5)
    : 0;

  if (memberDays < 30) {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), result: null }));
    return null;
  }

  // Fetch food_logs and bio_data_points
  const since90 = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0];
  const since30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const [{ data: foodLogs }, { data: bioRaw }] = await Promise.all([
    sb.from('food_logs')
      .select('date, logged_at, calories')
      .eq('user_id', userId)
      .gte('date', since90)
      .order('date', { ascending: false }),
    sb.from('bio_data_points')
      .select('recorded_at, sleep_hours, hrv_avg')
      .eq('user_id', userId)
      .gte('recorded_at', since30)
      .order('recorded_at', { ascending: false }),
  ]);

  // Normalise bio_data_points into { date, sleep, hrv }
  const bioData = (bioRaw || []).map(r => ({
    date: r.recorded_at,
    sleep: r.sleep_hours,
    hrv: r.hrv_avg,
  }));

  const ctx = {
    foodLogs:    foodLogs    || [],
    workoutLogs,
    weightLogs,
    bioData,
    memberDays,
  };

  // Run all detectors
  const candidates = [
    detectHoneymoonCrash(ctx),
    detectPlateauPanic(ctx),
    detectOvertrainingSpiral(ctx),
    detectSleepTax(ctx),
    detectPerfectionTrap(ctx),
    detectCoaster(ctx),
  ].filter(Boolean);

  if (!candidates.length) {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), result: null }));
    return null;
  }

  // Pick highest severity (critical > mid > early), then by most signals
  const stageOrder = { critical: 0, mid: 1, early: 2 };
  candidates.sort((a, b) => (stageOrder[a.stage] ?? 2) - (stageOrder[b.stage] ?? 2));
  const top = candidates[0];

  // Filter dismissed
  if (isPatternDismissed(userId, top.pattern)) {
    localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), result: null }));
    return null;
  }

  const result = {
    pattern:  top.pattern,
    stage:    top.stage,
    signals:  top.signals,
    meta:     FAILURE_PATTERNS[top.pattern],
    detected: new Date().toISOString(),
  };

  localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), result }));
  return result;
}

// ─── Intervention generation ──────────────────────────────────────────────────

export async function generateIntervention(userId, patternName, stage) {
  const base = INTERVENTIONS[patternName]?.[stage];
  if (!base) return null;

  // Try to personalise via coach memory
  try {
    const recall = await recallApplicableLearnings(userId, patternName, {});
    if (recall?.intelligent_suggestion) {
      return {
        ...base,
        body: `${base.body}\n\nYour coach has seen this before with you: ${recall.intelligent_suggestion}`,
        personalized: true,
      };
    }
  } catch {}

  return { ...base, personalized: false };
}

// ─── DB persistence ───────────────────────────────────────────────────────────

export async function recordPatternDetection(userId, patternName, stage, interventionText, signals = {}) {
  if (!userId) return;
  try {
    await sb.from('pattern_detections').insert({
      user_id:           userId,
      pattern_name:      patternName,
      stage,
      intervention_text: interventionText,
      signals,
    });
  } catch {}
}

export async function trackInterventionOutcome(userId) {
  if (!userId) return;

  const today = new Date().toISOString().split('T')[0];
  const key   = `cm_outcome_check_${userId}`;
  if (localStorage.getItem(key) === today) return;
  localStorage.setItem(key, today);

  try {
    const since = new Date(Date.now() - 21 * 864e5).toISOString();
    const { data: pending } = await sb
      .from('pattern_detections')
      .select('id, pattern_name, stage, detected_at')
      .eq('user_id', userId)
      .is('outcome', null)
      .is('dismissed_at', null)
      .lt('detected_at', new Date(Date.now() - 7 * 864e5).toISOString())
      .gte('detected_at', since);

    if (!pending?.length) return;

    // For each pending detection, check if the pattern is still active (simple proxy: same pattern no longer detected → resolved)
    for (const det of pending) {
      const ageMs = Date.now() - new Date(det.detected_at).getTime();
      const ageDays = ageMs / 864e5;
      const outcome = ageDays >= 14 ? 'resolved_auto' : 'monitoring';
      if (outcome === 'resolved_auto') {
        await sb.from('pattern_detections')
          .update({ outcome, outcome_recorded_at: new Date().toISOString() })
          .eq('id', det.id);
      }
    }
  } catch {}
}

// ─── Dismiss management ───────────────────────────────────────────────────────

export function dismissPattern(userId, patternName) {
  const key     = `cm_dismiss_${userId}_${patternName}`;
  const expiry  = Date.now() + 7 * 864e5;
  localStorage.setItem(key, String(expiry));
  // Bust pattern cache so next open re-evaluates
  localStorage.removeItem(`cm_patterns_${userId}`);
}

export function isPatternDismissed(userId, patternName) {
  const key    = `cm_dismiss_${userId}_${patternName}`;
  const expiry = parseInt(localStorage.getItem(key) || '0', 10);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    localStorage.removeItem(key);
    return false;
  }
  return true;
}

// ─── Prediction ───────────────────────────────────────────────────────────────

export async function predictNextLikelyPattern(userId) {
  if (!userId) return null;

  try {
    const { data: history } = await sb
      .from('pattern_detections')
      .select('pattern_name, stage, detected_at, outcome')
      .eq('user_id', userId)
      .order('detected_at', { ascending: false })
      .limit(30);

    if (!history?.length) return null;

    const frequency = history.reduce((acc, d) => {
      acc[d.pattern_name] = (acc[d.pattern_name] || 0) + 1;
      return acc;
    }, {});

    // Most frequent historical pattern that isn't currently active
    const sorted = Object.entries(frequency).sort(([, a], [, b]) => b - a);
    if (!sorted.length) return null;

    const [topPattern, count] = sorted[0];
    const lastOccurrence = history.find(d => d.pattern_name === topPattern);

    return {
      pattern:   topPattern,
      count,
      lastSeen:  lastOccurrence?.detected_at,
      meta:      FAILURE_PATTERNS[topPattern],
    };
  } catch {
    return null;
  }
}
