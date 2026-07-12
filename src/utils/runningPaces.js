// ─── RUNNING PACE CALCULATION SYSTEM ─────────────────────────────────────────
// All paces derived from a single number: the user's estimated 5K time in seconds.

import { vdotFromRaceTime, trainingPaces } from '../services/paceService.js';

const KM_PER_MI = 1.609344;

// Zone paces from a 5K time via the validated Daniels VDOT engine (paceService) — replaces the old
// flat 5K-pace multipliers (which overshot the slow zones). Returns each zone as { secs(sec/mi),
// display 'M:SS/mi' } — SAME shape as before so the run card + computeGoalPace(runPaces.tempo) are
// unchanged. Bad/missing input → null (paces block hides; NaN can't render).
export const getPacesFromTime = (raw) => {
  // Robust parse — number → seconds; "MM:SS"/"H:MM:SS" → seconds; numeric string → Number; else null.
  let seconds5K;
  if (typeof raw === 'number') {
    seconds5K = raw;
  } else if (typeof raw === 'string' && raw.includes(':')) {
    const p = raw.split(':').map(Number);
    seconds5K = p.some(n => !isFinite(n)) ? NaN
      : p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2]
      : p.length === 2 ? p[0] * 60 + p[1]
      : NaN;
  } else {
    seconds5K = Number(raw);
  }
  if (!isFinite(seconds5K) || seconds5K <= 0) return null;

  const vdot = vdotFromRaceTime(5000, seconds5K / 60);
  const tp = trainingPaces(vdot); // sec/km per zone
  if (!tp || !isFinite(tp.easy)) return null;

  const fmt = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return s < 10 ? `${m}:0${s}` : `${m}:${s}`;
  };
  // sec/km → sec/mi
  const mi = (secPerKm) => secPerKm * KM_PER_MI;
  const zone = (secPerKm) => ({ secs: mi(secPerKm), display: fmt(mi(secPerKm)) + '/mi' });

  // maintenance = steady (between easy and tempo) — blend ~75% toward tempo's effort, in sec/km.
  const maintenanceKm = tp.easy + (tp.tempo - tp.easy) * 0.5;

  return {
    easy:        zone(tp.easy),
    maintenance: zone(maintenanceKm),
    tempo:       zone(tp.tempo),
    marathon:    zone(tp.marathon),
    interval5K:  zone(tp.interval),
    interval1mi: zone(tp.rep),
    longRun:     zone(tp.long),
    stride:      zone(tp.rep),
  };
};

export const getRacePredictions = (seconds5K) => {
  if (!seconds5K || seconds5K <= 0) return null;
  return {
    fiveK:    seconds5K,
    tenK:     Math.round(seconds5K * 2.09),
    half:     Math.round(seconds5K * 4.667),
    marathon: Math.round(seconds5K * 9.87),
  };
};

export const formatRaceTime = (seconds) => {
  if (!seconds || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  const ss = s < 10 ? `0${s}` : `${s}`;
  if (h > 0) {
    const mm = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
};

// sessionType: 'tempo' | 'interval' | 'race' | 'easy' | 'long'
// Returns updated 5K time in seconds, or null if no update warranted.
// Only recalibrates on tempo/interval sessions where effort data exists.
export const updateRaceTime = (current5K, targetPaceSecs, actualPaceSecs, sessionType) => {
  if (!current5K || !targetPaceSecs || !actualPaceSecs) return current5K;
  if (!['tempo', 'interval', 'race'].includes(sessionType)) return current5K;
  const ratio = actualPaceSecs / targetPaceSecs; // <1 = ran faster than target
  if (ratio < 0.97) return Math.round(current5K * 0.995); // 3%+ faster → nudge PR
  if (ratio > 1.06) return Math.round(current5K * 1.005); // 6%+ slower → adjust up
  return current5K;
};

// Derive goal pace (sec/mi) from a goal finish time + race distance.
// Returns { secs, display } matching the paces object shape.
// Falls back to tempo when goal time is missing or distance unknown.
const RACE_DIST_MI = { '5k': 3.106856, '10k': 6.213712, 'half': 13.109375, 'marathon': 26.21875, 'general': null };

export const computeGoalPace = (goalTimeSecs, raceDistance, fallbackTempo) => {
  const distMi = RACE_DIST_MI[raceDistance];
  if (!goalTimeSecs || !distMi) return fallbackTempo ?? null;
  const secPerMile = goalTimeSecs / distMi;
  const m = Math.floor(secPerMile / 60);
  const s = Math.round(secPerMile % 60);
  return { secs: secPerMile, display: (s < 10 ? `${m}:0${s}` : `${m}:${s}`) + '/mi' };
};

// Replace {pace_token} placeholders in workout description strings with live pace values.
export const resolvePaceTokens = (text, paces) => {
  if (!paces || !text) return text;
  return text
    .replace(/\{easy\}/g,        paces.easy.display)
    .replace(/\{maintenance\}/g, paces.maintenance.display)
    .replace(/\{tempo\}/g,       paces.tempo.display)
    .replace(/\{marathon\}/g,    paces.marathon.display)
    .replace(/\{interval5K\}/g,  paces.interval5K.display)
    .replace(/\{interval1mi\}/g, paces.interval1mi.display)
    .replace(/\{longRun\}/g,     paces.longRun.display)
    .replace(/\{stride\}/g,      paces.stride.display)
    // {goalPace} → goal-pace derived from run_target_time; falls back to tempo
    .replace(/\{goalPace\}/g,    (paces.goalPace?.display ?? paces.tempo.display));
};

// Estimate 5K time from fitness level when user doesn't know their time.
export const estimateFrom = (fitnessLevel) => {
  const estimates = {
    never:        40 * 60,  // 40:00 — has never run
    occasional:   35 * 60,  // 35:00 — runs occasionally
    recreational: 30 * 60,  // 30:00 — runs regularly
    fit:          25 * 60,  // 25:00 — athletic background
    competitive:  20 * 60,  // 20:00 — competitive runner
  };
  return estimates[fitnessLevel] || 35 * 60;
};

// Enrich a raw run session object with pre/post fuel and macro adjustment based on session type.
export const enrichRunSession = (session) => {
  if (!session) return session;
  const type = (session.type || "").toLowerCase();
  const duration = session.duration || 0;
  const distance = session.distance || 0;

  let preFuel = null;
  let postFuel = null;
  let macroAdjustment = null; // extra carbs in grams

  if (type.includes("long run") || type.includes("long")) {
    macroAdjustment = distance >= 14 ? 80 : distance >= 10 ? 60 : 40;
    preFuel = `Eat 60-80g carbs 2 hrs before. Oats + banana, or toast + honey. Carry gel/chews for runs over ${distance >= 10 ? "10" : "8"} miles.`;
    postFuel = "Within 30 min: 40g protein + 80g carbs. Chocolate milk + rice works perfectly. Replenish glycogen — recovery is the workout.";
  } else if (type.includes("tempo")) {
    macroAdjustment = 25;
    preFuel = "Light carb 60-90 min before: banana, toast, or half a bagel. Nothing too heavy — you'll feel it at race pace.";
    postFuel = "Within 45 min: 25g protein + 40g carbs. Greek yogurt + fruit, or protein shake + banana.";
  } else if (type.includes("interval") || type.includes("speed") || type.includes("race day") || type.includes("race")) {
    macroAdjustment = type.includes("race") ? 60 : 30;
    preFuel = type.includes("race")
      ? "Race morning: 80-100g carbs 2 hrs before start. Toast + honey + banana. Stay hydrated. Light, familiar foods only."
      : "30-45 min before: 20-30g fast carbs. Banana, energy chews, or sports drink. Intervals demand blood sugar stability.";
    postFuel = type.includes("race")
      ? "Celebrate. Then: 40g protein + 60g carbs within 30 min. Chocolate milk + sandwich. Post-race inflammation is real — eat well."
      : "Within 30 min: 30g protein + 50g carbs. Tough sessions need real recovery.";
  } else if (type.includes("easy") || type.includes("recovery") || type.includes("shakeout")) {
    if (duration >= 60 || distance >= 6) {
      preFuel = "Easy carb if running 60+ min fasted: banana or toast. For shorter easy runs, fasted is fine if comfortable.";
      postFuel = "Normal meal within 1 hour. No special recovery needed for easy sessions.";
    }
  } else if (type.includes("run/walk")) {
    preFuel = "Eat your normal meal 1-2 hrs before. No special fueling needed at this stage.";
    postFuel = "Normal meal within 2 hours. Stay hydrated.";
  }

  return { ...session, preFuel, postFuel, macroAdjustment };
};

// Convert mm:ss string to total seconds
export const parseTimeInput = (mmss) => {
  if (!mmss) return 0;
  const parts = mmss.split(':');
  if (parts.length === 2) return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
  if (parts.length === 3) return parseInt(parts[0] || 0) * 3600 + parseInt(parts[1] || 0) * 60 + parseInt(parts[2] || 0);
  return parseInt(mmss) || 0;
};
