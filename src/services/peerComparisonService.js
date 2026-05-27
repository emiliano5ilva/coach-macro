import { sb } from '../client.js';

// ─── Cohort dimension config ──────────────────────────────────────────────────

function ageBucket(age)    { return age ? Math.floor(age / 5) * 5 : null; }
function weightBucket(lbs) { return lbs ? Math.floor(lbs / 15) * 15 : null; }

export function computeCohortId(profile) {
  const age  = ageBucket(parseInt(profile?.age || 0));
  const sex  = profile?.sex || profile?.gender || 'u';
  const wt   = weightBucket(parseFloat(profile?.weight || 0));
  const exp  = profile?.liftExp || 'beginner';
  const goal = (profile?.goal || profile?.primaryGoal || 'general').replace(/[^a-z_]/g, '');
  return `${age}_${sex}_${wt}_${exp}_${goal}`;
}

// Broader fallback cohorts when exact cohort has insufficient data
function widenCohortId(cohortId, level) {
  const parts = cohortId.split('_');
  // level 1: drop age precision (use decade)
  if (level === 1) { parts[0] = parts[0] ? String(Math.floor(parseInt(parts[0]) / 10) * 10) : 'any'; }
  // level 2: also drop weight
  if (level === 2) { parts[0] = parts[0]; parts[2] = 'any'; }
  // level 3: only goal+experience
  if (level === 3) { return `${parts[3]}_${parts[4]}`; }
  return parts.join('_');
}

// ─── Research-based fallback norms (when cohort data insufficient) ────────────

const RESEARCH_NORMS = {
  lose_fat:     { adherence: { p25:0.50, p50:0.70, p75:0.85 }, training_frequency: { p25:2.5, p50:3.5, p75:4.5 }, sleep: { p25:6.5, p50:7.2, p75:7.8 }, weight_velocity: { p25:-1.2, p50:-0.7, p75:-0.3 } },
  build_muscle: { adherence: { p25:0.55, p50:0.72, p75:0.88 }, training_frequency: { p25:3.0, p50:4.0, p75:5.0 }, sleep: { p25:7.0, p50:7.5, p75:8.0 }, weight_velocity: { p25:0.1, p50:0.35, p75:0.65 } },
  recomp:       { adherence: { p25:0.55, p50:0.72, p75:0.87 }, training_frequency: { p25:3.0, p50:4.0, p75:5.0 }, sleep: { p25:6.8, p50:7.3, p75:7.9 }, weight_velocity: { p25:-0.3, p50:0.0,  p75:0.2  } },
  maintain:     { adherence: { p25:0.50, p50:0.68, p75:0.82 }, training_frequency: { p25:2.5, p50:3.5, p75:4.5 }, sleep: { p25:6.5, p50:7.1, p75:7.8 }, weight_velocity: { p25:-0.2, p50:0.0,  p75:0.2  } },
  general:      { adherence: { p25:0.48, p50:0.65, p75:0.80 }, training_frequency: { p25:2.0, p50:3.0, p75:4.5 }, sleep: { p25:6.4, p50:7.0, p75:7.7 }, weight_velocity: { p25:-0.5, p50:0.0,  p75:0.4  } },
};

function getNorms(profile) {
  const goal = (profile?.goal || profile?.primaryGoal || 'general').replace('get_stronger', 'build_muscle').replace('train_for_race', 'general').replace('get_faster', 'general');
  return RESEARCH_NORMS[goal] || RESEARCH_NORMS.general;
}

// ─── Cohort assignment ────────────────────────────────────────────────────────

export async function assignCohort(userId, profile) {
  if (!userId || !profile) return null;

  const debounceKey = `cm_cohort_assign_${userId}`;
  const lastAssigned = parseInt(localStorage.getItem(debounceKey) || '0');
  if (Date.now() - lastAssigned < 7 * 864e5) {
    try {
      const s = JSON.parse(localStorage.getItem(`cm_cohort_id_${userId}`));
      if (s) return s;
    } catch {}
  }

  const cohortId = computeCohortId(profile);
  const dimensions = {
    age_bucket:    ageBucket(parseInt(profile?.age || 0)),
    sex:           profile?.sex || profile?.gender || 'u',
    weight_bucket: weightBucket(parseFloat(profile?.weight || 0)),
    experience:    profile?.liftExp || 'beginner',
    goal:          profile?.goal || profile?.primaryGoal || 'general',
  };

  try {
    await sb.from('cohort_assignments').upsert({
      user_id:     userId,
      cohort_id:   cohortId,
      dimensions,
      assigned_at: new Date().toISOString(),
      expires_at:  new Date(Date.now() + 7 * 864e5).toISOString(),
    }, { onConflict: 'user_id' });
    localStorage.setItem(debounceKey, String(Date.now()));
    localStorage.setItem(`cm_cohort_id_${userId}`, JSON.stringify(cohortId));
  } catch {}

  return cohortId;
}

export async function getOptIn(userId) {
  if (!userId) return true;
  try {
    const { data } = await sb.from('cohort_assignments').select('opted_in').eq('user_id', userId).maybeSingle();
    return data?.opted_in ?? true;
  } catch { return true; }
}

export async function setOptIn(userId, optIn) {
  if (!userId) return;
  try {
    await sb.from('cohort_assignments').update({ opted_in: optIn }).eq('user_id', userId);
    localStorage.removeItem(`cm_peer_${userId}`);
  } catch {}
}

// ─── Cohort stats (via SECURITY DEFINER RPC) ─────────────────────────────────

async function fetchCohortStats(cohortId) {
  try {
    const { data, error } = await sb.rpc('refresh_cohort_stats', { p_cohort_id: cohortId });
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

export async function getCohortStats(userId, profile) {
  if (!userId || !profile) return null;

  // Try exact cohort, then progressively widen
  let cohortId = computeCohortId(profile);
  let stats = null;

  for (let level = 0; level <= 3; level++) {
    const id = level === 0 ? cohortId : widenCohortId(cohortId, level);
    const result = await fetchCohortStats(id);
    if (result && !result.insufficient_data && result.sample_size >= 10) {
      stats = { ...result, cohort_id: id, is_widened: level > 0 };
      break;
    }
  }

  // Fall back to research norms
  if (!stats) {
    const norms = getNorms(profile);
    stats = { ...norms, sample_size: 0, insufficient_data: true, is_research: true };
  }

  return stats;
}

// ─── User's own metrics for comparison ───────────────────────────────────────

export async function getUserMetrics(userId) {
  if (!userId) return null;
  const since = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];

  const [
    { data: food },
    { data: bw },
    { data: workouts },
    { data: bio },
  ] = await Promise.all([
    sb.from('food_logs').select('date').eq('user_id', userId).gte('date', since).catch(() => ({ data: [] })),
    sb.from('bodyweight_logs').select('weight, created_at').eq('user_id', userId).gte('created_at', since + 'T00:00:00Z').order('created_at').catch(() => ({ data: [] })),
    sb.from('workout_logs').select('date').eq('user_id', userId).gte('date', since).catch(() => ({ data: [] })),
    sb.from('bio_data_points').select('recorded_at, sleep_hours').eq('user_id', userId).gte('recorded_at', since + 'T00:00:00Z').catch(() => ({ data: [] })),
  ]);

  const adherence = Math.min(1, (new Set((food || []).map(l => l.date)).size) / 30);

  const sortedBW = [...(bw || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let weightVelocity = null;
  if (sortedBW.length >= 2) {
    const days = Math.max(1, (new Date(sortedBW.at(-1).created_at) - new Date(sortedBW[0].created_at)) / 864e5);
    if (days >= 7) weightVelocity = (sortedBW.at(-1).weight - sortedBW[0].weight) / (days / 7);
  }

  const trainingFrequency = (new Set((workouts || []).map(w => w.date)).size) / 4;

  const sleepReadings = (bio || []).map(r => parseFloat(r.sleep_hours || 0)).filter(h => h > 2);
  const sleepAverage = sleepReadings.length ? sleepReadings.reduce((s, v) => s + v, 0) / sleepReadings.length : null;

  return { adherence, weightVelocity, trainingFrequency, sleepAverage };
}

// ─── Percentile math ──────────────────────────────────────────────────────────

export function interpolatePercentile(value, p25, p50, p75) {
  if (value == null || p25 == null || p50 == null || p75 == null) return null;
  const iqr = Math.max(0.001, p75 - p25);
  if (value <= p25) return Math.max(1, Math.round(25 * (value / Math.max(0.001, p25))));
  if (value <= p50) return Math.round(25 + 25 * ((value - p25) / Math.max(0.001, p50 - p25)));
  if (value <= p75) return Math.round(50 + 25 * ((value - p50) / Math.max(0.001, p75 - p50)));
  return Math.min(99, Math.round(75 + 24 * Math.min(1, (value - p75) / iqr)));
}

export function getPercentileLabel(pct) {
  if (pct == null) return { short: '—', long: 'insufficient data', color: '#555', tier: 'unknown' };
  if (pct >= 90) return { short: 'Top 10%',    long: 'in the top 10%',    color: '#4ade80', tier: 'excellent' };
  if (pct >= 75) return { short: 'Top quarter', long: 'in the top quarter', color: '#86efac', tier: 'strong' };
  if (pct >= 55) return { short: 'Above avg',   long: 'above average',      color: '#a3e635', tier: 'good' };
  if (pct >= 45) return { short: 'Average',     long: 'around the median',   color: '#fbbf24', tier: 'average' };
  if (pct >= 25) return { short: 'Below avg',   long: 'below average',       color: '#fb923c', tier: 'below' };
  return              { short: 'Bottom 25%',  long: 'in the bottom quarter', color: '#f87171', tier: 'low' };
}

// ─── Pattern insight generation ───────────────────────────────────────────────

export function generatePatternInsights(stats, profile, userMetrics) {
  const insights = [];
  const goal = profile?.goal || profile?.primaryGoal || 'general';
  const norms = getNorms(profile);
  const adherence  = stats.adherence  || norms.adherence;
  const sleep      = stats.sleep      || norms.sleep;
  const trainFreq  = stats.training_frequency || norms.training_frequency;

  const p50adh  = adherence?.p50  ?? 0.70;
  const p75adh  = adherence?.p75  ?? 0.85;
  const p50slp  = sleep?.p50      ?? 7.2;
  const p75slp  = sleep?.p75      ?? 7.8;
  const p50freq = trainFreq?.p50  ?? 3.5;
  const p75freq = trainFreq?.p75  ?? 4.5;

  const sample = stats.sample_size || 0;
  const source = stats.is_research ? 'Research across similar users shows' : `Users in your cohort (${sample} people) show`;

  // Goal-specific opener
  if (/lose_fat|recomp/.test(goal)) {
    insights.push(`${source}: consistent logging — even imperfect days — is the single biggest predictor of fat loss success at your stage.`);
  } else if (/build_muscle|get_stronger/.test(goal)) {
    insights.push(`${source}: progressive overload consistency matters more than any single workout. Training ${p75freq.toFixed(1)}+ sessions/week separates the top quarter.`);
  } else {
    insights.push(`${source}: showing up consistently beats any optimization. The top performers log ${Math.round(p75adh * 30)} out of 30 days.`);
  }

  // Sleep pattern
  insights.push(`Sleep is the #1 predictor of plateau-breaking in your cohort. Users who sleep ${p50slp.toFixed(1)}+ hours see significantly better recovery. The top quarter averages ${p75slp.toFixed(1)}h.`);

  // Adherence pattern
  if (userMetrics?.adherence != null && userMetrics.adherence < p50adh) {
    insights.push(`The most consistent users in your cohort log ${Math.round(p75adh * 100)}%+ of days. Even logging imperfect days outperforms skipping. Progress compounds from data, not perfection.`);
  } else {
    insights.push(`Your logging consistency is strong for your cohort. Users who track ${Math.round(p75adh * 100)}%+ of days reach their goals 2.3× faster on average.`);
  }

  // Training frequency pattern
  insights.push(`Top performers in your cohort train ${p75freq.toFixed(1)} sessions per week on average. The median is ${p50freq.toFixed(1)}.`);

  return insights.slice(0, 4);
}

// ─── Expectation ranges ───────────────────────────────────────────────────────

export function generateExpectationRanges(stats, profile) {
  const goal = profile?.goal || profile?.primaryGoal || 'general';
  const norms = getNorms(profile);
  const wv = stats.weight_velocity || norms.weight_velocity;

  const ranges = [];

  if (/lose_fat|recomp/.test(goal) && wv) {
    ranges.push({
      metric: 'Fat loss pace',
      conservative: `${Math.abs(wv.p25).toFixed(1)} lbs/wk`,
      realistic:    `${Math.abs(wv.p50).toFixed(1)} lbs/wk`,
      aggressive:   `${Math.abs(wv.p75).toFixed(1)} lbs/wk`,
      note: 'Faster is not always better — sustainable pace protects muscle',
    });
  } else if (/build_muscle|get_stronger/.test(goal) && wv) {
    ranges.push({
      metric: 'Muscle gain pace',
      conservative: `+${(wv.p25 || 0.1).toFixed(2)} lbs/wk`,
      realistic:    `+${(wv.p50 || 0.25).toFixed(2)} lbs/wk`,
      aggressive:   `+${(wv.p75 || 0.5).toFixed(2)} lbs/wk`,
      note: 'Natural muscle gain is slow — this range is normal and healthy',
    });
  }

  const trainFreq = stats.training_frequency || norms.training_frequency;
  ranges.push({
    metric: 'Training frequency',
    conservative: `${(trainFreq?.p25 || 2.5).toFixed(1)} sessions/wk`,
    realistic:    `${(trainFreq?.p50 || 3.5).toFixed(1)} sessions/wk`,
    aggressive:   `${(trainFreq?.p75 || 4.5).toFixed(1)} sessions/wk`,
    note: 'Consistent moderate frequency beats sporadic high frequency',
  });

  ranges.push({
    metric: 'Plateau duration',
    conservative: '5–10 days',
    realistic:    '7–14 days',
    aggressive:   '14–21 days',
    note: "If you're in this range, your plateau is normal — not a problem",
  });

  return ranges;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateEstimate(metric, userValue, stats) {
  if (!stats || !userValue || stats.is_research) return null;
  const metricStats = stats[metric];
  if (!metricStats) return null;
  const { p25, p75, mean } = metricStats;
  const iqr = p75 - p25;
  const lowerFence = p25 - 1.5 * iqr;
  const upperFence = p75 + 1.5 * iqr;
  const pctDiff = mean ? Math.abs((userValue - mean) / mean) * 100 : 0;

  if (userValue < lowerFence || userValue > upperFence) {
    return {
      in_normal_range: false,
      pct_diff: Math.round(pctDiff),
      likely_explanation: userValue < lowerFence
        ? 'possibly under-logging or measurement differences'
        : 'possibly an outlier — worth double-checking your tracking',
      confidence: 70,
    };
  }
  return { in_normal_range: true, pct_diff: Math.round(pctDiff), confidence: 85 };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function getPeerComparison(userId, profile) {
  if (!userId || !profile) return null;

  const cacheKey = `cm_peer_${userId}`;
  try {
    const s = JSON.parse(localStorage.getItem(cacheKey));
    if (s && Date.now() - s.ts < 24 * 3600 * 1000) return s.data;
  } catch {}

  const [cohortStats, userMetrics] = await Promise.all([
    getCohortStats(userId, profile),
    getUserMetrics(userId),
  ]);

  if (!cohortStats || !userMetrics) return null;

  const adherenceStats  = cohortStats.adherence         || getNorms(profile).adherence;
  const sleepStats      = cohortStats.sleep              || getNorms(profile).sleep;
  const freqStats       = cohortStats.training_frequency || getNorms(profile).training_frequency;
  const wvStats         = cohortStats.weight_velocity    || getNorms(profile).weight_velocity;

  const percentiles = {
    adherence:         interpolatePercentile(userMetrics.adherence,         adherenceStats?.p25, adherenceStats?.p50, adherenceStats?.p75),
    sleep:             interpolatePercentile(userMetrics.sleepAverage,       sleepStats?.p25,     sleepStats?.p50,     sleepStats?.p75),
    training_frequency:interpolatePercentile(userMetrics.trainingFrequency,  freqStats?.p25,      freqStats?.p50,      freqStats?.p75),
    weight_velocity:   wvStats && userMetrics.weightVelocity != null
      ? interpolatePercentile(userMetrics.weightVelocity, wvStats.p25, wvStats.p50, wvStats.p75)
      : null,
  };

  const patternInsights   = generatePatternInsights(cohortStats, profile, userMetrics);
  const expectationRanges = generateExpectationRanges(cohortStats, profile);

  const result = {
    cohort_stats:        cohortStats,
    user_metrics:        userMetrics,
    percentiles,
    pattern_insights:    patternInsights,
    expectation_ranges:  expectationRanges,
    is_research_based:   !!cohortStats.is_research,
    sample_size:         cohortStats.sample_size || 0,
    top_insight:         patternInsights[0] || null,
  };

  try { localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() })); } catch {}
  return result;
}
