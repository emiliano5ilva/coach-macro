// Daniels VDOT-based pace engine — Jack Daniels & Gilbert (1979) equations.
// All paces in seconds/km. All distances in meters. All times in seconds unless noted.

// ── Core VDOT math ────────────────────────────────────────────────────────────

// %VO2max sustainable at a given race duration (t in minutes)
function pctVO2atVelocity(velocity, raceTime) {
  // Note: `velocity` param exists for API compatibility but only raceTime matters here
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * raceTime)
             + 0.2989558 * Math.exp(-0.1932605 * raceTime);
}

// VO2 cost of running at velocity v (m/min) → mL/kg/min
function vo2atVelocity(v) {
  return -4.60 + 0.182258 * v + 0.000104 * v * v;
}

// VDOT directly from any race (no binary search needed)
// distanceMeters: race distance, timeMinutes: finish time in minutes
function vdotFromRaceTime(distanceMeters, timeMinutes) {
  const velocity = distanceMeters / timeMinutes; // m/min at race pace
  const vo2  = vo2atVelocity(velocity);
  const pct  = pctVO2atVelocity(velocity, timeMinutes);
  return Math.round(vo2 / pct * 10) / 10;
}

function vdotFromMile(mileTimeSeconds) {
  return vdotFromRaceTime(1609.34, mileTimeSeconds / 60);
}

// Velocity in m/min at VO2max for an athlete with the given VDOT (VO2max)
// Inverts: VO2 = -4.60 + 0.182258*v + 0.000104*v² via quadratic formula
function velocityAtVDOT(vdot) {
  const a = 0.000104, b = 0.182258, c = -(vdot + 4.60);
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

// ── Race projections ──────────────────────────────────────────────────────────

const RACE_DISTANCES = {
  mile:         1609.34,
  fiveK:        5000,
  tenK:         10000,
  halfMarathon: 21097.5,
  marathon:     42195,
};

// Returns predicted race time in seconds for a given VDOT over a given distance.
// Binary search on time: VDOT is a decreasing function of race time.
function projectRaceTime(vdot, targetDistanceMeters) {
  let lo = 60, hi = 86400; // 1 min to 24 hr
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const testVdot = vdotFromRaceTime(targetDistanceMeters, mid / 60);
    // testVdot > vdot → this time is too fast (requires more fitness) → actual time is longer
    if (testVdot > vdot) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2);
}

function projectAllRaceTimes(vdot) {
  return {
    mile:         formatTime(projectRaceTime(vdot, RACE_DISTANCES.mile)),
    fiveK:        formatTime(projectRaceTime(vdot, RACE_DISTANCES.fiveK)),
    tenK:         formatTime(projectRaceTime(vdot, RACE_DISTANCES.tenK)),
    halfMarathon: formatTime(projectRaceTime(vdot, RACE_DISTANCES.halfMarathon)),
    marathon:     formatTime(projectRaceTime(vdot, RACE_DISTANCES.marathon)),
  };
}

// ── Training paces ────────────────────────────────────────────────────────────

// Convert VDOT at a given intensity fraction to seconds/km
function vdotToPace(vdot, intensityFraction) {
  const adjustedVdot   = vdot * intensityFraction;
  const velocityMperMin = velocityAtVDOT(adjustedVdot);
  return Math.round(60000 / velocityMperMin); // sec/km
}

function trainingPaces(vdot) {
  return {
    easy:     vdotToPace(vdot, 0.65),
    long:     vdotToPace(vdot, 0.62),
    marathon: Math.round(projectRaceTime(vdot, RACE_DISTANCES.marathon) / 42.195),
    tempo:    vdotToPace(vdot, 0.88),
    interval: Math.round(projectRaceTime(vdot, RACE_DISTANCES.fiveK) / 5),
    rep:      vdotToPace(vdot, 1.05),
  };
}

// ── Plan planning ─────────────────────────────────────────────────────────────

function recommendPlanWeeks(currentVdot, goalVdot) {
  const gap = goalVdot - currentVdot;
  const weeksPer1VDOT = currentVdot < 35 ? 3.5 : currentVdot < 50 ? 5 : 8;
  const rawWeeks = gap * weeksPer1VDOT;
  if (rawWeeks <= 8)  return 8;
  if (rawWeeks <= 12) return 12;
  if (rawWeeks <= 16) return 16;
  if (rawWeeks <= 20) return 20;
  return 24;
}

function goalTimeAtWeeks(currentVdot, weeks) {
  const weeksPer1VDOT   = currentVdot < 35 ? 3.5 : currentVdot < 50 ? 5 : 8;
  const achievableGain  = weeks / weeksPer1VDOT;
  const achievableVdot  = currentVdot + achievableGain;
  return projectAllRaceTimes(achievableVdot);
}

function isGoalRealistic(currentVdot, goalVdot, requestedWeeks) {
  const needed = recommendPlanWeeks(currentVdot, goalVdot);
  if (needed > requestedWeeks) {
    const milestone = goalTimeAtWeeks(currentVdot, requestedWeeks);
    return {
      realistic: false,
      neededWeeks: needed,
      milestone,
      message: `To hit your goal, you'll need ~${needed} weeks. Want a ${needed}-week plan, or a ${requestedWeeks}-week plan targeting an intermediate milestone?`,
    };
  }
  return { realistic: true };
}

// ── Formatting ────────────────────────────────────────────────────────────────

function formatPace(secPerKm) {
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${min}:${sec}/km`;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s}`;
  return `${m}:${s}`;
}

// ── Dynamic plan renderer ──────────────────────────────────────────────────────

export function renderWithPaces(text, paces) {
  if (!paces || !text) return text;

  const fmt = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60).toString().padStart(2, '0');
    return m + ':' + s + '/km';
  };

  return text
    .replace(/\beasy run\b/gi,        `Easy Run @ ${fmt(paces.easy)}`)
    .replace(/\bzone 2\b/gi,          `Zone 2 (${fmt(paces.easy)} for you)`)
    .replace(/\blong run\b/gi,        `Long Run @ ${fmt(paces.long)}`)
    .replace(/\btempo run\b/gi,       `Tempo Run @ ${fmt(paces.tempo)}`)
    .replace(/\btempo pace\b/gi,      `tempo (${fmt(paces.tempo)})`)
    .replace(/\binterval pace\b/gi,   `interval pace (${fmt(paces.interval)})`)
    .replace(/\brace pace\b/gi,       `race pace (${fmt(paces.marathon)})`)
    // "8km easy" / "8km long" → append pace
    .replace(/(\d+\.?\d*\s*km?\b)(\s*)(easy|long|slow|recovery)/gi,
      (_, dist, space, effort) => {
        const p = effort.toLowerCase() === 'long' ? paces.long : paces.easy;
        return `${dist}${space}${effort} (${fmt(p)})`;
      })
    // "3km @ tempo" → concrete pace
    .replace(/(\d+\.?\d*\s*km?\b)\s*@\s*tempo/gi,
      (_, dist) => `${dist} @ ${fmt(paces.tempo)}`)
    // "6×800m @ interval" / "5×1km interval"
    .replace(/([\d×x]+\s*[×x]?\s*\d+\.?\d*\s*km?)\s*@?\s*interval/gi,
      (_, reps) => `${reps} @ ${fmt(paces.interval)}`)
    // Hyrox: "target km pace"
    .replace(/target\s*km\s*pace/gi,
      `target km pace (${fmt(paces.easy)})`);
}

// ── Exports ───────────────────────────────────────────────────────────────────

export {
  vo2atVelocity,
  velocityAtVDOT,
  pctVO2atVelocity,
  vdotFromRaceTime,
  vdotFromMile,
  projectRaceTime,
  projectAllRaceTimes,
  trainingPaces,
  recommendPlanWeeks,
  isGoalRealistic,
  goalTimeAtWeeks,
  formatPace,
  formatTime,
  RACE_DISTANCES,
};

export const paceService = {
  vdotFromMile,
  vdotFromRaceTime,
  trainingPaces,
  projectAllRaceTimes,
  recommendPlanWeeks,
  isGoalRealistic,
  formatPace,
  formatTime,
};
