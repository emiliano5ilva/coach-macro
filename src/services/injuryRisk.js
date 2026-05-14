import { sb } from "../client.js";

const REGION_EXERCISES = {
  shoulder: ["overhead press","lateral raise","face pull","bench press","incline press","arnold press","upright row","front raise","shoulder press","ohp","military press","cable lateral","chest press","dumbbell press"],
  elbow: ["curl","pushdown","skull crusher","tricep","close grip","french press","preacher","hammer curl","cable curl","ez bar"],
  knee: ["squat","lunge","leg press","leg extension","step up","bulgarian","hack squat","goblet squat","split squat","leg day"],
  lower_back: ["deadlift","good morning","hyperextension","back extension","rdl","romanian","stiff leg","bent over row"],
  hip: ["hip thrust","glute bridge","cable kickback","abduction","rdl","romanian deadlift","sumo"],
};

/** Pure — compute total load for one session's exercises array for a given region */
export function calcRegionLoad(exercises, region) {
  const keywords = REGION_EXERCISES[region] || [];
  let total = 0;
  for (const ex of (exercises || [])) {
    const name = (ex.name || "").toLowerCase();
    if (!keywords.some(kw => name.includes(kw))) continue;
    for (const s of (ex.sets || [])) {
      if (!s.done) continue;
      total += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 8);
    }
  }
  return total;
}

/** Async — query workout_logs for last N days, sum load for a region */
export async function calculateTrainingLoad(userId, region, days) {
  const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
  const { data } = await sb
    .from("workout_logs")
    .select("date,workout")
    .eq("user_id", userId)
    .gte("date", since);
  let total = 0;
  for (const row of (data || [])) {
    const exs = row.workout?.exercises || [];
    total += calcRegionLoad(exs, region);
  }
  return total;
}

/** Async — compute ACWR-based risk for all 5 regions */
export async function calculateAllRisks(userId, profile) {
  const regions = Object.keys(REGION_EXERCISES);
  const now = Date.now();
  const since14 = new Date(now - 14 * 86400000).toISOString();
  const since28 = new Date(now - 28 * 86400000).toISOString();

  // Fetch injury logs for prior & recent pain
  const { data: injLogs } = await sb
    .from("injury_logs")
    .select("body_region,severity,logged_at")
    .eq("user_id", userId)
    .gte("logged_at", since28);

  const results = {};

  await Promise.all(regions.map(async region => {
    const [load7d, load28d] = await Promise.all([
      calculateTrainingLoad(userId, region, 7),
      calculateTrainingLoad(userId, region, 28),
    ]);

    const chronicLoad = load28d / 4;
    const acwrRatio = parseFloat((load7d / (chronicLoad || 1)).toFixed(2));

    // Prior injuries (all time in our 28d window is a proxy; use all logs)
    const regionLogs = (injLogs || []).filter(l => l.body_region === region);
    const priorInjuries = regionLogs.length;
    const recentPain = regionLogs.filter(l => new Date(l.logged_at) >= new Date(now - 14 * 86400000)).length;

    // Skip if no activity and no pain
    if (load7d === 0 && recentPain === 0) return;

    // Compute weekly over-week from 7d vs prior 7d (days 8-14)
    const load7d_prior = load28d - load7d; // rough: last 21 days vs 7 days
    const weekOverWeekPct = load7d_prior > 0 ? (load7d - load7d_prior / 3) / (load7d_prior / 3) : 0;

    let score = 0;
    if (acwrRatio > 1.5) score += 40;
    else if (acwrRatio > 1.3) score += 25;
    else if (acwrRatio > 1.2) score += 10;

    if (weekOverWeekPct > 0.3) score += 20;
    else if (weekOverWeekPct > 0.2) score += 10;

    if (priorInjuries >= 3) score += 20;
    else if (priorInjuries >= 1) score += 10;

    if (recentPain >= 1) score += 20;

    const level = score >= 70 ? "HIGH" : score >= 40 ? "MODERATE" : "LOW";

    results[region] = { score, level, acwrRatio, priorInjuries, recentPain, load7d, load28d };
  }));

  return results;
}

/** Insert a new injury log row */
export async function logInjury(userId, { body_region, pain_type, severity, notes }) {
  const { data, error } = await sb
    .from("injury_logs")
    .insert({ user_id: userId, body_region, pain_type, severity: severity || 1, notes: notes || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Fetch all injury logs for a user, desc order */
export async function getInjuryLogs(userId) {
  const { data } = await sb
    .from("injury_logs")
    .select("*")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(50);
  return data || [];
}

/** Mark an injury as resolved */
export async function resolveInjury(injuryId) {
  const { data, error } = await sb
    .from("injury_logs")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", injuryId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Insert a risk snapshot for history tracking */
export async function saveRiskSnapshot(userId, region, riskData) {
  const { data, error } = await sb
    .from("injury_risks")
    .insert({
      user_id: userId,
      body_region: region,
      risk_score: riskData.score,
      risk_level: riskData.level,
      ac_chronic_ratio: riskData.acwrRatio,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Pure — days since last significant injury (severity >= 2) */
export function getInjuryFreeDays(injuryLogs) {
  const significant = (injuryLogs || []).filter(l => (l.severity || 0) >= 2 && !l.resolved_at);
  if (!significant.length) return null; // no injuries = use null (show streak since forever)
  const last = significant.reduce((a, b) => new Date(a.logged_at) > new Date(b.logged_at) ? a : b);
  return Math.floor((Date.now() - new Date(last.logged_at)) / 86400000);
}

/** Pure — detect simple patterns from injury history */
export function detectPatterns(injuryLogs) {
  const patterns = [];
  const logs = injuryLogs || [];

  const regionCounts = {};
  for (const l of logs) {
    regionCounts[l.body_region] = (regionCounts[l.body_region] || 0) + 1;
  }

  const sorted = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  for (const [region, count] of sorted.slice(0, 3)) {
    if (count >= 2) {
      const label = region.replace("_", " ");
      patterns.push(`Recurring ${label} issues detected (${count} incidents logged)`);
    }
  }

  // Check if injuries cluster around certain months
  const months = logs.map(l => new Date(l.logged_at).getMonth());
  const monthFreq = {};
  for (const m of months) monthFreq[m] = (monthFreq[m] || 0) + 1;
  const peakMonth = Object.entries(monthFreq).sort((a, b) => b[1] - a[1])[0];
  if (peakMonth && peakMonth[1] >= 2) {
    const mn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(peakMonth[0])];
    patterns.push(`More injuries tend to occur around ${mn} — consider extra recovery then`);
  }

  return patterns.slice(0, 3);
}
