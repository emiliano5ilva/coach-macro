import { sb } from "../client.js";

// ── Nutrition adherence (7-day) ───────────────────────────────────────────────
export async function calcNutritionAdherence7d(userId) {
  try {
    const since = new Date(Date.now() - 7 * 864e5).toISOString().split("T")[0];
    const { data } = await sb
      .from("food_logs")
      .select("date,calories,goal_calories")
      .eq("user_id", userId)
      .gte("date", since);
    if (!data?.length) return 0.5;
    const days = {};
    data.forEach(r => {
      if (!days[r.date]) days[r.date] = { cal: 0, goal: r.goal_calories || 2000 };
      days[r.date].cal += r.calories || 0;
    });
    const adherences = Object.values(days).map(({ cal, goal }) => {
      const ratio = cal / goal;
      return ratio >= 0.85 && ratio <= 1.15 ? 1 : ratio >= 0.7 && ratio <= 1.3 ? 0.5 : 0;
    });
    return adherences.reduce((a, v) => a + v, 0) / Math.max(adherences.length, 1);
  } catch { return 0.5; }
}

// ── PR probability calculator ─────────────────────────────────────────────────
// Returns 0-100 score
export function calculatePRProbability(inputs, userAlgorithm = {}) {
  const {
    sleepHours = null,
    hrv = null,
    recoveryDaysSinceLast = 1,
    nutritionAdherence = 0.5, // 0-1
    stressLevel = 3,          // 1-5 (1=low, 5=high)
    mesocycleWeek = 1,        // 1-4
    currentHour = new Date().getHours(),
  } = inputs;

  let score = 50; // baseline

  // ── Sleep factor ────────────────────────────────────────────────────────────
  const sleepInsight = userAlgorithm?.sleep_performance?.insight_value;
  if (sleepHours != null) {
    if (sleepInsight) {
      // personalized: use their actual sweet spot
      const sweet = sleepInsight.sweetSpotKey;
      const optimalMin = sweet === "over_8" ? 8 : sweet === "7_to_8" ? 7 : 6;
      if (sleepHours >= optimalMin) score += 12;
      else if (sleepHours >= optimalMin - 1) score += 4;
      else score -= 12;
    } else {
      // generic benchmarks
      if (sleepHours >= 8) score += 10;
      else if (sleepHours >= 7) score += 6;
      else if (sleepHours >= 6) score += 0;
      else score -= 10;
    }
  }

  // ── HRV factor ──────────────────────────────────────────────────────────────
  if (hrv != null) {
    // Simplified: relative to generic good range (>50ms)
    if (hrv > 70) score += 10;
    else if (hrv > 50) score += 5;
    else if (hrv > 35) score -= 2;
    else score -= 10;
  }

  // ── Recovery days factor ────────────────────────────────────────────────────
  const recoveryInsight = userAlgorithm?.recovery_speed?.insight_value;
  if (recoveryInsight) {
    const optimalRest = recoveryInsight.recoveryDays || 2;
    if (recoveryDaysSinceLast >= optimalRest) score += 8;
    else if (recoveryDaysSinceLast >= optimalRest - 1) score += 3;
    else score -= 6;
  } else {
    if (recoveryDaysSinceLast >= 2) score += 6;
    else if (recoveryDaysSinceLast === 1) score += 2;
    else score -= 5;
  }

  // ── Nutrition adherence ─────────────────────────────────────────────────────
  const carbInsight = userAlgorithm?.carb_performance?.insight_value;
  if (carbInsight) {
    // personalized: higher adherence matters more if they respond to carbs
    const carbImpact = carbInsight.carbImpact || 0;
    score += Math.round(nutritionAdherence * (carbImpact > 5 ? 14 : 10));
  } else {
    score += Math.round(nutritionAdherence * 10);
  }

  // ── Stress factor ────────────────────────────────────────────────────────────
  const stressInsight = userAlgorithm?.stress_performance?.insight_value;
  if (stressInsight) {
    const optimalStress = stressInsight.optimalStress || 2;
    if (stressLevel <= optimalStress) score += 6;
    else score -= Math.min(12, (stressLevel - optimalStress) * 4);
  } else {
    if (stressLevel <= 2) score += 6;
    else if (stressLevel === 3) score += 0;
    else score -= (stressLevel - 3) * 5;
  }

  // ── Mesocycle week factor ────────────────────────────────────────────────────
  // Week 3 is typically peak, week 4 is deload
  if (mesocycleWeek === 3) score += 6;
  else if (mesocycleWeek === 2) score += 3;
  else if (mesocycleWeek === 4) score -= 6;

  // ── Time of day factor ────────────────────────────────────────────────────────
  const timeInsight = userAlgorithm?.time_performance?.insight_value;
  if (timeInsight) {
    const peakSlot = timeInsight.bestTimeSlot;
    const inPeak =
      (peakSlot === "morning" && currentHour >= 6 && currentHour <= 10) ||
      (peakSlot === "midday" && currentHour >= 11 && currentHour <= 13) ||
      (peakSlot === "afternoon" && currentHour >= 14 && currentHour <= 17) ||
      (peakSlot === "evening" && currentHour >= 17 && currentHour <= 21);
    if (inPeak) score += 8;
    else score -= 4;
  } else {
    // Generic: afternoon/early evening is optimal for most
    if (currentHour >= 14 && currentHour <= 18) score += 5;
    else if (currentHour >= 9 && currentHour <= 13) score += 3;
  }

  return Math.max(5, Math.min(95, Math.round(score)));
}

// ── Weekly forecast (7-day probability grid) ──────────────────────────────────
export async function generateWeeklyForecast(userId, userAlgorithm = {}, schedule = {}, healthSnap = null) {
  const WDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const days = [];

  // Get last workout date for recovery calc
  let lastWorkoutDate = null;
  try {
    const { data } = await sb
      .from("workout_logs")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);
    if (data?.[0]) lastWorkoutDate = new Date(data[0].date + "T12:00:00");
  } catch {}

  const nutritionAdherence = await calcNutritionAdherence7d(userId);

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const wday = WDAYS[d.getDay()];
    const dateKey = d.toISOString().split("T")[0];
    const daySchedule = schedule[dateKey] || "rest";
    const isTraining = daySchedule === "training" || daySchedule === "cardio" || daySchedule === "run" || daySchedule === "hyrox";

    // Recovery days: how many rest days between last workout and this day
    const recoveryDays = lastWorkoutDate
      ? Math.max(0, Math.floor((d - lastWorkoutDate) / 864e5))
      : 2;

    const prob = isTraining
      ? calculatePRProbability({
          sleepHours: i === 0 ? healthSnap?.sleep : null,
          hrv: i === 0 ? healthSnap?.hrv : null,
          recoveryDaysSinceLast: recoveryDays,
          nutritionAdherence,
          stressLevel: 3,
          mesocycleWeek: 2,
          currentHour: 15,
        }, userAlgorithm)
      : null;

    days.push({ date: dateKey, wday, isTraining, probability: prob });
    if (isTraining && lastWorkoutDate) lastWorkoutDate = d; // rolling
  }

  return days;
}

// ── Linear regression helper ────────────────────────────────────────────────
function linReg(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y || 0 };
  const sx = points.reduce((a, p) => a + p.x, 0);
  const sy = points.reduce((a, p) => a + p.y, 0);
  const sxy = points.reduce((a, p) => a + p.x * p.y, 0);
  const sxx = points.reduce((a, p) => a + p.x * p.x, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

// ── Goal trajectories ─────────────────────────────────────────────────────────
export async function calculateGoalTrajectories(userId, profile = {}) {
  const result = { strength: null, bodyComp: null, running: null };

  try {
    // ── Strength trajectory ────────────────────────────────────────────────────
    const { data: wLogs } = await sb
      .from("workout_logs")
      .select("date,workout")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .limit(30);

    if (wLogs?.length >= 3) {
      // Use total volume as proxy for strength progress
      const volumePoints = wLogs
        .filter(w => w.workout?.exercises?.length)
        .map((w, i) => {
          const vol = (w.workout.exercises || []).reduce((a, ex) =>
            a + (ex.sets || []).filter(s => s.done).reduce((b, s) =>
              b + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0), 0);
          return { x: i, y: vol };
        })
        .filter(p => p.y > 0);

      if (volumePoints.length >= 3) {
        const { slope, intercept } = linReg(volumePoints);
        const lastVol = volumePoints[volumePoints.length - 1].y;
        const weeklyGainPct = slope / Math.max(lastVol, 1) * 100;
        const weeksTo10pct = weeklyGainPct > 0.1 ? Math.round(10 / weeklyGainPct) : null;
        result.strength = {
          weeklyGainPct: parseFloat(weeklyGainPct.toFixed(1)),
          weeksTo10pct,
          trend: slope > 0 ? "up" : slope < -50 ? "down" : "flat",
          sessions: volumePoints.length,
        };
      }
    }

    // ── Body composition trajectory ────────────────────────────────────────────
    const { data: bwLogs } = await sb
      .from("bodyweight_logs")
      .select("date,weight")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .limit(60);

    if (bwLogs?.length >= 5) {
      const points = bwLogs.map((b, i) => ({ x: i, y: parseFloat(b.weight) }));
      const { slope } = linReg(points);
      const wUnit = profile?.wUnit || "lbs";
      const currentWeight = points[points.length - 1].y;
      const weeklyChange = slope * (bwLogs.length / Math.max(1, (new Date(bwLogs[bwLogs.length-1].date) - new Date(bwLogs[0].date)) / 604800000));
      const goal = profile?.goal || "Maintain";
      const targetWeight = goal === "Lose Weight" ? currentWeight * 0.9 : goal === "Gain Muscle" ? currentWeight * 1.05 : currentWeight;
      const delta = targetWeight - currentWeight;
      const weeksToGoal = Math.abs(weeklyChange) > 0.05 ? Math.abs(Math.round(delta / weeklyChange)) : null;

      result.bodyComp = {
        currentWeight: parseFloat(currentWeight.toFixed(1)),
        weeklyChange: parseFloat(weeklyChange.toFixed(2)),
        wUnit,
        trend: weeklyChange > 0.1 ? "gaining" : weeklyChange < -0.1 ? "losing" : "stable",
        weeksToGoal: weeksToGoal && weeksToGoal < 52 ? weeksToGoal : null,
        goal,
        dataPoints: bwLogs.length,
      };
    }

    // ── Running trajectory ─────────────────────────────────────────────────────
    if (wLogs?.length >= 3) {
      const runLogs = wLogs.filter(w =>
        (w.workout?.type === "run" || w.workout?.type === "cardio" ||
         (w.workout?.focus || "").toLowerCase().includes("run")));
      if (runLogs.length >= 3) {
        const pacePoints = runLogs
          .map((w, i) => {
            const duration = w.workout?.calories_burned ? Math.round(w.workout.calories_burned / 6) : null;
            return duration ? { x: i, y: duration } : null;
          })
          .filter(Boolean);
        if (pacePoints.length >= 2) {
          const { slope } = linReg(pacePoints);
          result.running = {
            trend: slope < -0.5 ? "improving" : slope > 0.5 ? "declining" : "stable",
            sessions: runLogs.length,
          };
        }
      }
    }
  } catch (e) { console.error("[calculateGoalTrajectories]", e); }

  return result;
}

// ── Track prediction outcome ────────────────────────────────────────────────
export async function trackPredictionOutcome(userId, predictedScore, actualPerfScore) {
  try {
    await sb.from("prediction_outcomes").insert({
      user_id: userId,
      date: new Date().toISOString().split("T")[0],
      predicted_prob: predictedScore,
      actual_score: actualPerfScore,
      pr_achieved: actualPerfScore >= 80,
    });
  } catch {}
}

// ── Get prediction accuracy ────────────────────────────────────────────────
export async function getPredictionAccuracy(userId) {
  try {
    const { data } = await sb
      .from("prediction_outcomes")
      .select("predicted_prob,actual_score,pr_achieved")
      .eq("user_id", userId)
      .limit(50);
    if (!data?.length) return null;
    const hits = data.filter(d => {
      const predicted = d.predicted_prob >= 70;
      return predicted === d.pr_achieved;
    });
    return {
      accuracy: Math.round((hits.length / data.length) * 100),
      totalPredictions: data.length,
    };
  } catch { return null; }
}
