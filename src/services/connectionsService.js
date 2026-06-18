import { sb } from '../client.js';

// ─── Metric registry ──────────────────────────────────────────────────────────

export const METRIC_META = {
  sleep:    { label: 'Sleep',     unit: 'hrs',  icon: '💤', color: '#a78bfa' },
  hrv:      { label: 'HRV',      unit: 'ms',   icon: '💚', color: '#34d399' },
  rhr:      { label: 'RHR',      unit: 'bpm',  icon: '🫀', color: '#f87171' },
  weight:   { label: 'Weight',   unit: 'lbs',  icon: '⚖️', color: '#60a5fa' },
  calories: { label: 'Calories', unit: 'kcal', icon: '🍽️', color: '#fbbf24' },
  volume:   { label: 'Training', unit: 'k',    icon: '🏋️', color: '#c084fc' },
  steps:    { label: 'Steps',    unit: 'k',    icon: '👟', color: '#4ade80' },
  tdee:     { label: 'TDEE',     unit: 'kcal', icon: '🔥', color: '#f97316' },
};

// ─── Known physiological relationships ───────────────────────────────────────

const KNOWN_PAIRS = [
  { a: 'sleep',    b: 'hrv',      direction: 'positive', lag: 1, typical: 0.65 },
  { a: 'sleep',    b: 'rhr',      direction: 'negative', lag: 1, typical: 0.50 },
  { a: 'sleep',    b: 'volume',   direction: 'positive', lag: 1, typical: 0.38 },
  { a: 'sleep',    b: 'weight',   direction: 'negative', lag: 1, typical: 0.28 },
  { a: 'hrv',      b: 'volume',   direction: 'positive', lag: 0, typical: 0.45 },
  { a: 'calories', b: 'weight',   direction: 'positive', lag: 3, typical: 0.55 },
  { a: 'calories', b: 'tdee',     direction: 'positive', lag: 0, typical: 0.65 },
  { a: 'calories', b: 'volume',   direction: 'positive', lag: 1, typical: 0.35 },
  { a: 'volume',   b: 'hrv',      direction: 'negative', lag: 1, typical: 0.42 },
  { a: 'volume',   b: 'rhr',      direction: 'positive', lag: 1, typical: 0.35 },
  { a: 'volume',   b: 'weight',   direction: 'negative', lag: 7, typical: 0.36 },
  { a: 'steps',    b: 'tdee',     direction: 'positive', lag: 0, typical: 0.55 },
  { a: 'steps',    b: 'weight',   direction: 'negative', lag: 3, typical: 0.38 },
  { a: 'weight',   b: 'tdee',     direction: 'positive', lag: 0, typical: 0.48 },
  { a: 'sleep',    b: 'steps',    direction: 'positive', lag: 0, typical: 0.30 },
];

// ─── Math helpers ─────────────────────────────────────────────────────────────

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 8) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num  = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const sdx  = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const sdy  = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return sdx * sdy === 0 ? 0 : Math.max(-1, Math.min(1, num / (sdx * sdy)));
}

function buildDateMap(rows, dateField, valueField) {
  const map = {};
  for (const row of rows || []) {
    const d = String(row[dateField] || '').slice(0, 10);
    const v = parseFloat(row[valueField]);
    if (d && !isNaN(v) && v > 0) map[d] = v;
  }
  return map;
}

function correlate(mapA, mapB, lag) {
  const xs = [], ys = [];
  for (const dA of Object.keys(mapA).sort()) {
    const dB = lag === 0
      ? dA
      : new Date(new Date(dA).getTime() + lag * 864e5).toISOString().split('T')[0];
    if (mapB[dB] !== undefined) { xs.push(mapA[dA]); ys.push(mapB[dB]); }
  }
  return xs.length >= 8 ? { r: pearson(xs, ys), n: xs.length } : { r: 0, n: xs.length };
}

// ─── Main correlation calculation ─────────────────────────────────────────────

export async function calculateUserCorrelations(userId) {
  if (!userId) return KNOWN_PAIRS.map(p => ({ ...p, correlation_strength: p.typical, confidence: 0, data_points: 0, is_user_data: false }));

  const lsKey = `cm_corr_${userId}`;
  try {
    const s = JSON.parse(localStorage.getItem(lsKey));
    if (s && Date.now() - s.ts < 7 * 864e5) return s.data;
  } catch {}

  const since = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0];

  const [{ data: bio }, { data: bw }, { data: food }, { data: workouts }, { data: tdeeHist }] = await Promise.all([
    sb.from('bio_data_points').select('recorded_at, sleep_hours, hrv_avg, rhr, steps').eq('user_id', userId).gte('recorded_at', since),
    sb.from('bodyweight_logs').select('created_at, weight').eq('user_id', userId).gte('created_at', since + 'T00:00:00Z'),
    sb.from('food_logs').select('date, entries').eq('user_id', userId).gte('date', since),
    sb.from('workout_logs').select('date, volume_lbs').eq('user_id', userId).gte('date', since),
    sb.from('tdee_history').select('date, calculated_tdee').eq('user_id', userId).gte('date', since),
  ]);

  // Build daily maps (aggregate multi-row days)
  const sleepMap   = buildDateMap(bio,       'recorded_at', 'sleep_hours');
  const hrvMap     = buildDateMap(bio,       'recorded_at', 'hrv_avg');
  const rhrMap     = buildDateMap(bio,       'recorded_at', 'rhr');
  const stepsMap   = buildDateMap(bio,       'recorded_at', 'steps');
  const weightMap  = buildDateMap(bw,        'created_at',  'weight');
  const tdeeMap    = buildDateMap(tdeeHist,  'date',        'calculated_tdee');

  const calMap = {};
  for (const row of food || []) {
    const d = String(row.date || '').slice(0, 10);
    const rowCals = (row.entries||[]).reduce((s,e)=>s+(e.calories||0),0);
    if (d) calMap[d] = (calMap[d] || 0) + rowCals;
  }

  const volMap = {};
  for (const row of workouts || []) {
    const d = String(row.date || '').slice(0, 10);
    if (d) volMap[d] = (volMap[d] || 0) + (row.volume_lbs || 0);
  }

  // Scale steps to thousands for better correlation scale
  for (const d of Object.keys(stepsMap)) stepsMap[d] /= 1000;
  for (const d of Object.keys(volMap))   volMap[d]  /= 1000;

  const maps = { sleep: sleepMap, hrv: hrvMap, rhr: rhrMap, weight: weightMap, calories: calMap, volume: volMap, steps: stepsMap, tdee: tdeeMap };

  const results = KNOWN_PAIRS.map(pair => {
    const mA = maps[pair.a], mB = maps[pair.b];
    if (!mA || !mB || !Object.keys(mA).length || !Object.keys(mB).length) {
      return { ...pair, correlation_strength: pair.typical * 0.6, confidence: 0, data_points: 0, is_user_data: false };
    }
    const { r, n } = correlate(mA, mB, pair.lag);
    const absR      = Math.abs(r);
    const direction = n >= 8 ? (r >= 0 ? 'positive' : 'negative') : pair.direction;
    const confidence = n > 60 ? 90 : n > 30 ? 70 : n > 15 ? 50 : n > 8 ? 30 : 0;
    return {
      ...pair,
      correlation_strength: n >= 8 ? Math.max(0.08, absR) : pair.typical * 0.5,
      direction,
      confidence,
      data_points: n,
      is_user_data: n >= 8,
      user_r: r,
    };
  });

  // Persist to DB
  try {
    await sb.from('connections_data').upsert(
      results.map(r => ({
        user_id:              userId,
        metric_a:             r.a,
        metric_b:             r.b,
        correlation_strength: r.correlation_strength,
        direction:            r.direction,
        lag_days:             r.lag,
        confidence:           r.confidence,
        data_points:          r.data_points,
        last_calculated:      new Date().toISOString().split('T')[0],
      })),
      { onConflict: 'user_id,metric_a,metric_b' }
    );
  } catch {}

  try { localStorage.setItem(lsKey, JSON.stringify({ data: results, ts: Date.now() })); } catch {}
  return results;
}

export async function getConnectionsData(userId) {
  if (!userId) return KNOWN_PAIRS.map(p => ({ ...p, correlation_strength: p.typical * 0.6, confidence: 0, data_points: 0, is_user_data: false }));
  const lsKey = `cm_corr_${userId}`;
  try {
    const s = JSON.parse(localStorage.getItem(lsKey));
    if (s && Date.now() - s.ts < 7 * 864e5) return s.data;
  } catch {}
  return calculateUserCorrelations(userId);
}

// ─── Trust filter ─────────────────────────────────────────────────────────────
// A correlation is trustworthy only when it was computed from real user data
// (is_user_data=true), has ≥14 paired data-points, and ≥50 confidence score.
// Anything below this bar is a KNOWN_PAIRS.typical estimate and must never
// render as a personal insight.
export const isTrustedCorr = c => c.is_user_data === true && c.confidence >= 50 && c.data_points >= 14;

// ─── Analysis helpers (sync) ──────────────────────────────────────────────────

export function identifyActiveInfluencers(metric, correlations) {
  return correlations
    .filter(c => (c.a === metric || c.b === metric) && c.correlation_strength > 0.1)
    .map(c => {
      const isTarget = c.b === metric;
      const source   = isTarget ? c.a : c.b;
      const dir      = isTarget ? c.direction : (c.direction === 'positive' ? 'positive' : 'negative');
      return {
        metric:      source,
        label:       METRIC_META[source]?.label || source,
        strength:    c.correlation_strength,
        direction:   dir,
        lag:         c.lag,
        confidence:  c.confidence,
        is_user_data: c.is_user_data,
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4);
}

export function predictDownstreamEffects(metric, changeDir, correlations) {
  return correlations
    .filter(c => (c.a === metric || c.b === metric) && c.correlation_strength > 0.1)
    .map(c => {
      const isSource   = c.a === metric;
      const downstream = isSource ? c.b : c.a;
      const dir        = isSource ? c.direction : (c.direction === 'positive' ? 'positive' : 'negative');
      const impact     = changeDir === 'up'
        ? (dir === 'positive' ? 'up' : 'down')
        : (dir === 'positive' ? 'down' : 'up');
      return {
        metric:      downstream,
        label:       METRIC_META[downstream]?.label || downstream,
        direction:   impact,
        strength:    c.correlation_strength,
        lag:         c.lag,
        is_user_data: c.is_user_data,
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 4);
}

export function getConnectionInsights(correlations, memberDays) {
  if (memberDays < 21) return [];
  // Only generate insight text from correlations that clear the trust bar.
  // Fabricated KNOWN_PAIRS estimates (confidence=0, data_points=0) never produce text.
  const strong = correlations
    .filter(c => isTrustedCorr(c) && c.correlation_strength > 0.3)
    .sort((a, b) => b.correlation_strength - a.correlation_strength);

  return strong.slice(0, 6).map(c => {
    const aLabel = METRIC_META[c.a]?.label || c.a;
    const bLabel = METRIC_META[c.b]?.label || c.b;
    const strength = c.correlation_strength > 0.65 ? 'strongly' : c.correlation_strength > 0.45 ? 'clearly' : 'noticeably';
    const dirWord  = c.direction === 'positive' ? 'improves' : 'reduces';
    const lagNote  = c.lag === 1 ? ' the next day' : c.lag > 1 ? ` after ${c.lag} days` : '';
    const source   = c.is_user_data ? 'Based on your data' : 'Generally';
    return {
      metric_a: c.a,
      metric_b: c.b,
      text: `${source}: better ${aLabel} ${strength} ${dirWord} ${bLabel}${lagNote}`,
      strength: c.correlation_strength,
      is_user_data: c.is_user_data,
    };
  });
}

export function getNodeStatus(metricId, value) {
  if (value == null || isNaN(value)) return 'gray';
  const rules = {
    sleep:    v => v >= 7 ? 'green' : v >= 6 ? 'yellow' : 'red',
    hrv:      v => v >= 55 ? 'green' : v >= 35 ? 'yellow' : 'red',
    rhr:      v => v <= 62 ? 'green' : v <= 72 ? 'yellow' : 'red',
    steps:    v => v >= 8 ? 'green' : v >= 5 ? 'yellow' : 'red',
    calories: _v => 'neutral',
    volume:   v => v > 0 ? 'green' : 'neutral',
    tdee:     v => v > 0 ? 'green' : 'neutral',
    weight:   _v => 'neutral',
  };
  return rules[metricId]?.(value) ?? 'neutral';
}

export function formatMetricValue(metricId, value) {
  if (value == null || isNaN(value)) return '—';
  const fmt = {
    sleep:    v => `${parseFloat(v).toFixed(1)}h`,
    hrv:      v => `${Math.round(v)}ms`,
    rhr:      v => `${Math.round(v)}bpm`,
    steps:    v => `${parseFloat(v).toFixed(1)}k`,
    calories: v => `${Math.round(v).toLocaleString()}`,
    volume:   v => `${parseFloat(v).toFixed(1)}k`,
    tdee:     v => `${Math.round(v).toLocaleString()}`,
    weight:   v => `${parseFloat(v).toFixed(1)}`,
  };
  return fmt[metricId]?.(value) ?? String(Math.round(value));
}
