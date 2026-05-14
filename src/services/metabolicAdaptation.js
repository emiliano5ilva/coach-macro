import { sb } from "../client.js";
import { ai } from "../client.js";

// ── Plateau detection ─────────────────────────────────────────────────────────
export async function detectMetabolicAdaptation(userId, profile) {
  // Only check for cut goals
  if (!profile?.goal || !["cut"].includes(profile.goal)) return null;
  const goalCals = profile?.goalCals;
  if (!goalCals) return null;

  try {
    // Get last 42 days of bodyweight logs
    const since42 = new Date(Date.now() - 42 * 864e5).toISOString().split("T")[0];
    const { data: weightLogs } = await sb
      .from("bodyweight_logs")
      .select("date,weight")
      .eq("user_id", userId)
      .gte("date", since42)
      .order("date", { ascending: true });

    if (!weightLogs || weightLogs.length < 10) return null;

    // Get food logs for last 30 days to compute adherence
    const since30 = new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0];
    const { data: foodLogs } = await sb
      .from("food_logs")
      .select("date,entries")
      .eq("user_id", userId)
      .gte("date", since30);

    // Sum calories per day from entries array
    const dailyCalories = {};
    (foodLogs || []).forEach(row => {
      if (!row.entries?.length) return;
      const dayCals = row.entries.reduce((a, e) => a + (e.calories || 0), 0);
      dailyCalories[row.date] = (dailyCalories[row.date] || 0) + dayCals;
    });

    const loggedDays = Object.values(dailyCalories);
    if (loggedDays.length < 14) return null; // need at least 2 weeks of logs

    const avgCalories = loggedDays.reduce((a, b) => a + b, 0) / loggedDays.length;
    const calorieAdherence = avgCalories / goalCals;

    // Must be eating at or below target
    if (calorieAdherence > 1.10) return null;

    // Weight trend: compare oldest 10 vs newest 10
    const oldWeights = weightLogs.slice(0, 10);
    const recentWeights = weightLogs.slice(-10);

    const oldAvg = oldWeights.reduce((a, b) => a + b.weight, 0) / oldWeights.length;
    const recentAvg = recentWeights.reduce((a, b) => a + b.weight, 0) / recentWeights.length;
    const weightChange = recentAvg - oldAvg;

    // How long has this calorie level been running?
    const profileCreated = profile?.created_at ? new Date(profile.created_at) : new Date(Date.now() - 8 * 7 * 864e5);
    const weeksOnSameCalories = Math.max(4, Math.floor((Date.now() - profileCreated) / (7 * 864e5)));

    // PLATEAU: weight stalled < 0.5 units AND been dieting 4+ weeks AND adherent
    const isPlateaued =
      Math.abs(weightChange) < 0.5 &&
      weeksOnSameCalories >= 4 &&
      calorieAdherence <= 1.05;

    if (!isPlateaued) return null;

    return {
      detected: true,
      currentCalories: Math.round(avgCalories),
      targetCalories: goalCals,
      weeksOnSameCalories,
      weightChangeLastThreeWeeks: parseFloat(weightChange.toFixed(1)),
      adherence: Math.round(calorieAdherence * 100),
      wUnit: profile?.wUnit || "lbs",
      goal: profile.goal,
    };
  } catch (e) {
    console.error("[detectMetabolicAdaptation]", e);
    return null;
  }
}

// ── Compute 3-phase protocol numbers ─────────────────────────────────────────
export function buildProtocolPhases(plateauData) {
  const base = plateauData.currentCalories;
  const phase1Cals = Math.round(base * 1.10); // +10% reverse diet
  const phase2Cals = Math.round(base * 1.22); // +22% = near maintenance
  const phase3Cals = Math.round(phase2Cals * 0.86); // ~14% deficit from reset maintenance

  return {
    phase1: { calories: phase1Cals, weeks: 2, name: "Reverse Diet" },
    phase2: { calories: phase2Cals, weeks: 1, name: "Diet Break" },
    phase3: { calories: phase3Cals, weeks: null, name: "New Deficit" },
    estimatedWeeklyLoss: parseFloat(((phase2Cals - phase3Cals) / 3500 * 7).toFixed(2)),
  };
}

// ── Generate AI explanation ───────────────────────────────────────────────────
export async function generateAdaptationProtocol(plateauData, profile) {
  const phases = buildProtocolPhases(plateauData);
  const wUnit = plateauData.wUnit || "lbs";

  const explanation = await ai(
    `A user of Coach Macro fitness app has hit a metabolic adaptation plateau.

Their data:
- Goal: ${profile.goal} (fat loss)
- Current calories: ${plateauData.currentCalories}/day
- Weeks at this calorie level: ${plateauData.weeksOnSameCalories}
- Weight change last 6 weeks: ${plateauData.weightChangeLastThreeWeeks} ${wUnit}
- Calorie adherence: ${plateauData.adherence}% (they ARE hitting their target)
- Weight unit: ${wUnit}

Generate a specific metabolic reset protocol explanation with:
1. A 2-sentence plain English explanation of what happened (metabolic adaptation — no jargon)
2. Brief description of each phase:
   - Phase 1 (Reverse Diet, 2 weeks at ${phases.phase1.calories} cal): why eating more now actually helps
   - Phase 2 (Diet Break, 1 week at ${phases.phase2.calories} cal): what happens to metabolism
   - Phase 3 (New Deficit, ${phases.phase3.calories} cal): why this works better than the original target
3. What to expect: "scale may go up 1-2 ${wUnit} — this is water and glycogen, not fat"
4. One critical mistake to avoid

Be specific with the calorie numbers above. Empathetic tone — acknowledge this is frustrating. Under 180 words.`,
    900,
    "metabolic_adaptation"
  );

  return { explanation, phases };
}

// ── Supabase CRUD ─────────────────────────────────────────────────────────────
export async function saveDetectedAdaptation(userId, plateauData, protocol) {
  try {
    // Dismiss any previously detected (not started) ones first
    await sb
      .from("metabolic_adaptations")
      .update({ status: "dismissed" })
      .eq("user_id", userId)
      .eq("status", "detected");

    const { data, error } = await sb
      .from("metabolic_adaptations")
      .insert({
        user_id: userId,
        plateau_data: plateauData,
        protocol: protocol,
        status: "detected",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[saveDetectedAdaptation]", e);
    return null;
  }
}

export async function getActiveAdaptation(userId) {
  try {
    const { data } = await sb
      .from("metabolic_adaptations")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["detected", "active"])
      .order("detected_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data || null;
  } catch { return null; }
}

export async function dismissAdaptation(adaptationId) {
  try {
    await sb
      .from("metabolic_adaptations")
      .update({ status: "dismissed" })
      .eq("id", adaptationId);
  } catch {}
}

export async function startProtocol(adaptationId) {
  try {
    await sb
      .from("metabolic_adaptations")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", adaptationId);
  } catch {}
}

export async function completeProtocol(adaptationId) {
  try {
    await sb
      .from("metabolic_adaptations")
      .update({ status: "complete", completed_at: new Date().toISOString() })
      .eq("id", adaptationId);
  } catch {}
}

// ── Get current protocol phase based on start date ────────────────────────────
export function getProtocolProgress(adaptation) {
  if (!adaptation || adaptation.status !== "active") return null;
  const startDate = new Date(adaptation.started_at);
  const daysSinceStart = Math.floor((Date.now() - startDate) / 864e5);
  const phases = adaptation.protocol?.phases;
  if (!phases) return null;

  const p1Days = (phases.phase1?.weeks || 2) * 7;
  const p2Days = p1Days + (phases.phase2?.weeks || 1) * 7;
  const totalDays = p2Days + 14; // phase 3 at least 2 weeks tracked

  if (daysSinceStart < p1Days) {
    return {
      phase: 1,
      phaseName: "Reverse Diet",
      weekNum: Math.floor(daysSinceStart / 7) + 1,
      totalWeeks: 3,
      targetCals: phases.phase1.calories,
      nextPhaseDate: new Date(startDate.getTime() + p1Days * 864e5),
      nextPhaseName: "Diet Break",
      progressDots: [true, false, false],
    };
  } else if (daysSinceStart < p2Days) {
    return {
      phase: 2,
      phaseName: "Diet Break",
      weekNum: 3,
      totalWeeks: 3,
      targetCals: phases.phase2.calories,
      nextPhaseDate: new Date(startDate.getTime() + p2Days * 864e5),
      nextPhaseName: "New Deficit",
      progressDots: [true, true, false],
    };
  } else {
    return {
      phase: 3,
      phaseName: "New Deficit",
      weekNum: null,
      totalWeeks: 3,
      targetCals: phases.phase3.calories,
      nextPhaseDate: null,
      nextPhaseName: null,
      progressDots: [true, true, true],
      isComplete: daysSinceStart >= totalDays,
    };
  }
}
