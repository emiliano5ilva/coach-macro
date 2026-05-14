import { sb } from "../client.js";
import { EXERCISE_MUSCLE_GROUP } from "../exercise_database.js";

// Minimum data points required before an insight is computed
export const MIN_POINTS = {
  sleep_performance:  14,
  recovery_speed:     20,
  carb_performance:   30,
  time_performance:   20,
  stress_performance: 20,
};

// Derive a 0-100 performance score from a completed workout
export function calcPerformanceScore(exercises, history) {
  if (!exercises?.length) return 75;
  let totalSets = 0, completedSets = 0, prCount = 0;
  exercises.forEach(ex => {
    const done = (ex.sets || []).filter(s => s.done);
    totalSets   += ex.sets?.length || 0;
    completedSets += done.length;
    const k = ex.name?.toLowerCase().replace(/\s+/g, "_");
    if (k && history?.[k]?.length) {
      const prevMax = Math.max(...history[k].flatMap(sess => sess.sets.map(s => parseFloat(s.weight) || 0)));
      const sessMax = Math.max(...done.map(s => parseFloat(s.weight) || 0));
      if (sessMax > prevMax && sessMax > 0) prCount++;
    }
  });
  const comp = totalSets > 0 ? (completedSets / totalSets) * 100 : 75;
  return Math.min(100, Math.round(comp * 0.8 + Math.min(20, prCount * 10)));
}

// Map readiness tier string to 1-5 stress scale
function tierToStress(tier) {
  if (tier == null) return null;
  const t = String(tier).toLowerCase();
  if (t.includes("excellent") || t === "5") return 1;
  if (t.includes("good")      || t === "4") return 2;
  if (t.includes("train")     || t === "3") return 3;
  if (t.includes("reduce")    || t === "2") return 4;
  if (t.includes("rest")      || t === "1") return 5;
  const n = parseFloat(tier);
  if (!isNaN(n)) return n >= 4.5 ? 1 : n >= 3.5 ? 2 : n >= 2.5 ? 3 : n >= 1.5 ? 4 : 5;
  return null;
}

// Derive primary muscle groups from a list of exercise names
function getMuscleGroups(exercises) {
  const groups = new Set();
  (exercises || []).forEach(ex => {
    const mg = EXERCISE_MUSCLE_GROUP[ex.name];
    if (mg) groups.add(mg);
  });
  return [...groups];
}

// ─── MAIN RECORDING ENTRY POINT ──────────────────────────────────────────────
// Called after every workout completion.
export async function recordWorkoutBioData(userId, {
  sleepHours,       // number | null — from Apple Health
  readinessTier,    // string | null — from activeWorkout.readinessTier
  workoutStartTime, // ms timestamp of session start
  performanceScore, // 0-100 calculated by calcPerformanceScore
  exercises,        // array of {name, sets: [{done, weight, reps}]}
}) {
  if (!userId) return;

  const now = new Date().toISOString();
  const workoutHour = workoutStartTime
    ? new Date(workoutStartTime).getHours()
    : new Date().getHours();
  const stressLevel = tierToStress(readinessTier);
  const muscleGroups = getMuscleGroups(exercises);

  const points = [];

  if (sleepHours != null && sleepHours > 0) {
    points.push({
      user_id: userId, metric: "sleep_performance",
      input_value: parseFloat(sleepHours), output_value: performanceScore,
      input_label: `${parseFloat(sleepHours).toFixed(1)}h sleep`,
      output_label: `${performanceScore}% perf`, recorded_at: now,
    });
  }

  points.push({
    user_id: userId, metric: "time_performance",
    input_value: workoutHour, output_value: performanceScore,
    input_label: _fmtHour(workoutHour),
    output_label: `${performanceScore}% perf`, recorded_at: now,
  });

  if (stressLevel != null) {
    points.push({
      user_id: userId, metric: "stress_performance",
      input_value: stressLevel, output_value: performanceScore,
      input_label: `stress ${stressLevel}/5`,
      output_label: `${performanceScore}% perf`, recorded_at: now,
    });
  }

  muscleGroups.forEach(mg => {
    points.push({
      user_id: userId, metric: "recovery_speed",
      input_value: null, // filled in by _updateRecoveryIntervals
      output_value: performanceScore,
      input_label: mg, output_label: `${performanceScore}% perf`, recorded_at: now,
    });
  });

  try {
    if (points.length) await sb.from("bio_data_points").insert(points);

    // Carb correlation: fetch yesterday's food log
    const yestStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const { data: yestFood } = await sb.from("food_logs")
      .select("entries").eq("user_id", userId).eq("date", yestStr).maybeSingle();
    if (yestFood?.entries?.length) {
      const carbs = yestFood.entries.reduce((a, e) => a + (parseFloat(e.carbs) || 0), 0);
      if (carbs > 0) {
        await sb.from("bio_data_points").insert({
          user_id: userId, metric: "carb_performance",
          input_value: carbs, output_value: performanceScore,
          input_label: `${Math.round(carbs)}g carbs`,
          output_label: `${performanceScore}% perf`, recorded_at: now,
        });
      }
    }

    // Back-fill recovery intervals for consecutive muscle sessions
    if (muscleGroups.length) await _updateRecoveryIntervals(userId, muscleGroups);

    // Recalculate all insights (non-blocking)
    updateAllInsights(userId).catch(() => {});
  } catch (e) {
    console.warn("[bioAlgorithm] record error:", e?.message);
  }
}

// Fill in input_value (days between sessions) for recovery_speed entries
async function _updateRecoveryIntervals(userId, muscleGroups) {
  const { data: rows } = await sb.from("bio_data_points")
    .select("id, input_label, recorded_at, input_value")
    .eq("user_id", userId).eq("metric", "recovery_speed")
    .order("recorded_at", { ascending: true });
  if (!rows?.length) return;

  const byMuscle = {};
  rows.forEach(r => {
    if (!byMuscle[r.input_label]) byMuscle[r.input_label] = [];
    byMuscle[r.input_label].push(r);
  });

  const updates = [];
  for (const sessions of Object.values(byMuscle)) {
    for (let i = 1; i < sessions.length; i++) {
      if (sessions[i].input_value != null) continue; // already set
      const days = (new Date(sessions[i].recorded_at) - new Date(sessions[i-1].recorded_at)) / 86400000;
      if (days > 0 && days < 30) updates.push({ id: sessions[i].id, input_value: parseFloat(days.toFixed(2)) });
    }
  }
  if (updates.length) {
    await Promise.all(updates.map(u =>
      sb.from("bio_data_points").update({ input_value: u.input_value }).eq("id", u.id)
    ));
  }
}

function _fmtHour(h) {
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:00 ${ampm}`;
}

// ─── INSIGHT CALCULATIONS ─────────────────────────────────────────────────────

async function _calcSleep(userId) {
  const { data } = await sb.from("bio_data_points")
    .select("input_value,output_value").eq("user_id", userId)
    .eq("metric", "sleep_performance").not("input_value", "is", null);
  if (!data || data.length < MIN_POINTS.sleep_performance) return null;

  const buckets = { under_6: [], "6_to_7": [], "7_to_8": [], over_8: [] };
  data.forEach(p => {
    const s = parseFloat(p.input_value), v = parseFloat(p.output_value);
    if (s < 6) buckets.under_6.push(v);
    else if (s < 7) buckets["6_to_7"].push(v);
    else if (s < 8) buckets["7_to_8"].push(v);
    else buckets.over_8.push(v);
  });

  const avgB = {};
  Object.entries(buckets).forEach(([b, vs]) => {
    if (vs.length >= 2) avgB[b] = Math.round(vs.reduce((a, v) => a + v, 0) / vs.length);
  });
  if (Object.keys(avgB).length < 2) return null;

  const sorted = Object.entries(avgB).sort((a, b) => b[1] - a[1]);
  const best   = sorted[0][0];
  const worst  = sorted[sorted.length - 1][0];
  const improvement = avgB[worst] > 0 ? Math.round(((avgB[best] - avgB[worst]) / avgB[worst]) * 100) : 0;
  const LABELS = { under_6: "under 6 hours", "6_to_7": "6–7 hours", "7_to_8": "7–8 hours", over_8: "over 8 hours" };

  return {
    sweetSpot: LABELS[best],
    sweetSpotKey: best,
    worstBucket: LABELS[worst],
    performanceImprovement: improvement,
    bucketAverages: avgB,
    confidence: Math.min(Math.round(data.length / MIN_POINTS.sleep_performance * 70 + 30), 98),
    dataPoints: data.length,
  };
}

async function _calcRecovery(userId) {
  const { data } = await sb.from("bio_data_points")
    .select("input_value,output_value,input_label").eq("user_id", userId)
    .eq("metric", "recovery_speed").not("input_value", "is", null);
  if (!data || data.length < MIN_POINTS.recovery_speed) return null;

  const byMuscle = {};
  data.forEach(p => {
    const mg = p.input_label;
    if (!mg) return;
    if (!byMuscle[mg]) byMuscle[mg] = [];
    byMuscle[mg].push({ days: parseFloat(p.input_value), perf: parseFloat(p.output_value) });
  });

  const results = {};
  for (const [mg, sessions] of Object.entries(byMuscle)) {
    if (sessions.length < 3) continue;
    const byWindow = [
      { label: "< 2 days", maxDays: 2, items: sessions.filter(s => s.days < 2) },
      { label: "2–3 days", maxDays: 3, items: sessions.filter(s => s.days >= 2 && s.days < 3) },
      { label: "3+ days",  maxDays: 10, items: sessions.filter(s => s.days >= 3) },
    ].filter(w => w.items.length >= 1);
    if (!byWindow.length) continue;
    const best = byWindow.sort((a, b) => {
      const avgA = a.items.reduce((s, v) => s + v.perf, 0) / a.items.length;
      const avgB = b.items.reduce((s, v) => s + v.perf, 0) / b.items.length;
      return avgB - avgA;
    })[0];
    const avgDays = best.items.reduce((s, v) => s + v.days, 0) / best.items.length;
    results[mg] = parseFloat(avgDays.toFixed(1));
  }

  if (Object.keys(results).length < 2) return null;
  return {
    byMuscle: results,
    confidence: Math.min(Math.round(data.length / MIN_POINTS.recovery_speed * 70 + 30), 98),
    dataPoints: data.length,
  };
}

async function _calcCarb(userId) {
  const { data } = await sb.from("bio_data_points")
    .select("input_value,output_value").eq("user_id", userId)
    .eq("metric", "carb_performance").not("input_value", "is", null);
  if (!data || data.length < MIN_POINTS.carb_performance) return null;

  const low  = data.filter(p => p.input_value < 100).map(p => parseFloat(p.output_value));
  const mid  = data.filter(p => p.input_value >= 100 && p.input_value < 200).map(p => parseFloat(p.output_value));
  const high = data.filter(p => p.input_value >= 200).map(p => parseFloat(p.output_value));
  const avg  = arr => arr.length >= 2 ? Math.round(arr.reduce((a, v) => a + v, 0) / arr.length) : null;

  const avgs = { low: avg(low), mid: avg(mid), high: avg(high) };
  const known = Object.values(avgs).filter(v => v !== null);
  if (known.length < 2) return null;

  const sensitivity =
    avgs.high != null && avgs.low != null && avgs.high >= avgs.low + 8 ? "HIGH" :
    avgs.high != null && avgs.low != null && avgs.low >= avgs.high + 8 ? "LOW" : "NEUTRAL";
  const bestLabel =
    sensitivity === "HIGH" ? "200g+ carbs" :
    sensitivity === "LOW"  ? "under 100g carbs" : "100–200g carbs";

  return {
    sensitivity, bestLabel,
    averages: avgs,
    confidence: Math.min(Math.round(data.length / MIN_POINTS.carb_performance * 70 + 30), 98),
    dataPoints: data.length,
  };
}

async function _calcWindow(userId) {
  const { data } = await sb.from("bio_data_points")
    .select("input_value,output_value").eq("user_id", userId)
    .eq("metric", "time_performance").not("input_value", "is", null);
  if (!data || data.length < MIN_POINTS.time_performance) return null;

  const windows = [
    { key: "early_morning", label: "5:00–9:00 AM",  hours: [5,6,7,8],        perfs: [] },
    { key: "morning",       label: "9:00 AM–12:00",  hours: [9,10,11],        perfs: [] },
    { key: "midday",        label: "12:00–3:00 PM",  hours: [12,13,14],       perfs: [] },
    { key: "afternoon",     label: "3:00–6:00 PM",   hours: [15,16,17],       perfs: [] },
    { key: "evening",       label: "6:00–9:00 PM",   hours: [18,19,20],       perfs: [] },
    { key: "night",         label: "After 9:00 PM",  hours: [21,22,23,0,1,2], perfs: [] },
  ];
  data.forEach(p => {
    const h = Math.round(parseFloat(p.input_value));
    const win = windows.find(w => w.hours.includes(h));
    if (win) win.perfs.push(parseFloat(p.output_value));
  });

  const withData = windows
    .filter(w => w.perfs.length >= 2)
    .map(w => ({ ...w, avg: Math.round(w.perfs.reduce((a, v) => a + v, 0) / w.perfs.length) }))
    .sort((a, b) => b.avg - a.avg);
  if (withData.length < 2) return null;

  const best = withData[0], worst = withData[withData.length - 1];
  return {
    bestWindow: best.label,
    bestWindowKey: best.key,
    worstWindow: worst.label,
    performanceDiff: best.avg - worst.avg,
    windowAverages: withData.map(w => ({ label: w.label, avg: w.avg, count: w.perfs.length })),
    confidence: Math.min(Math.round(data.length / MIN_POINTS.time_performance * 70 + 30), 98),
    dataPoints: data.length,
  };
}

async function _calcStress(userId) {
  const { data } = await sb.from("bio_data_points")
    .select("input_value,output_value").eq("user_id", userId)
    .eq("metric", "stress_performance").not("input_value", "is", null);
  if (!data || data.length < MIN_POINTS.stress_performance) return null;

  const byLevel = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  data.forEach(p => {
    const l = Math.round(parseFloat(p.input_value));
    if (l >= 1 && l <= 5) byLevel[l].push(parseFloat(p.output_value));
  });
  const avgPerLevel = {};
  Object.entries(byLevel).forEach(([l, vs]) => {
    if (vs.length >= 2) avgPerLevel[l] = Math.round(vs.reduce((a, v) => a + v, 0) / vs.length);
  });
  if (Object.keys(avgPerLevel).length < 2) return null;

  const lowStress  = [...(byLevel[1] || []), ...(byLevel[2] || [])];
  const highStress = [...(byLevel[4] || []), ...(byLevel[5] || [])];
  const avgLow  = lowStress.length  >= 2 ? Math.round(lowStress.reduce((a, v) => a + v, 0)  / lowStress.length)  : null;
  const avgHigh = highStress.length >= 2 ? Math.round(highStress.reduce((a, v) => a + v, 0) / highStress.length) : null;

  let threshold = 4;
  const levels = Object.keys(avgPerLevel).map(Number).sort((a, b) => a - b);
  for (let i = 1; i < levels.length; i++) {
    if ((avgPerLevel[levels[i-1]] || 0) - (avgPerLevel[levels[i]] || 0) > 10) {
      threshold = levels[i]; break;
    }
  }

  return {
    threshold,
    avgPerLevel,
    performanceDrop: avgLow && avgHigh ? avgLow - avgHigh : null,
    confidence: Math.min(Math.round(data.length / MIN_POINTS.stress_performance * 70 + 30), 98),
    dataPoints: data.length,
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export async function updateAllInsights(userId) {
  if (!userId) return;
  const [sleep, recovery, carb, window_, stress] = await Promise.all([
    _calcSleep(userId).catch(() => null),
    _calcRecovery(userId).catch(() => null),
    _calcCarb(userId).catch(() => null),
    _calcWindow(userId).catch(() => null),
    _calcStress(userId).catch(() => null),
  ]);

  const upserts = [];
  const now = new Date().toISOString();
  const push = (type, val) => val && upserts.push({
    user_id: userId, insight_type: type,
    insight_value: val, confidence: val.confidence,
    data_points_used: val.dataPoints, last_updated: now,
  });

  push("sleep_performance",  sleep);
  push("recovery_speed",     recovery);
  push("carb_performance",   carb);
  push("time_performance",   window_);
  push("stress_performance", stress);

  if (upserts.length) {
    await sb.from("bio_insights").upsert(upserts, { onConflict: "user_id,insight_type" });
  }
}

export async function getInsights(userId) {
  if (!userId) return {};
  const { data } = await sb.from("bio_insights")
    .select("insight_type,insight_value,confidence,data_points_used,last_updated")
    .eq("user_id", userId);
  const result = {};
  (data || []).forEach(r => { result[r.insight_type] = r; });
  return result;
}

export async function getDataPointCounts(userId) {
  if (!userId) return {};
  const { data } = await sb.from("bio_data_points")
    .select("metric").eq("user_id", userId);
  const counts = {};
  (data || []).forEach(r => { counts[r.metric] = (counts[r.metric] || 0) + 1; });
  return counts;
}
