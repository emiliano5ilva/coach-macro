import { formatPace } from './paceService.js';

// ── Hyrox pace engine ─────────────────────────────────────────────────────────

// Station weights: proportion of total station time each station typically takes
const STATION_WEIGHTS = {
  skiErg:     0.09,   // SkiErg 1000m
  sled_push:  0.12,   // Sled Push
  sled_pull:  0.11,   // Sled Pull
  burpee_bj:  0.15,   // Burpee Broad Jump 80m
  rowing:     0.10,   // Row 1000m
  farmers:    0.10,   // Farmer's Carry 200m
  sandbag:    0.15,   // Sandbag Lunges 100m
  wall_balls: 0.18,   // Wall Balls 100 reps
};

function hyroxPlanWeeks(currentSecs, goalSecs) {
  const improvementPct = (currentSecs - goalSecs) / currentSecs * 100;
  if (improvementPct <= 5)  return 8;
  if (improvementPct <= 10) return 12;
  if (improvementPct <= 15) return 16;
  if (improvementPct <= 20) return 20;
  return 24;
}

function hyroxTargets(currentTotalTime, goalTotalTime) {
  // currentTotalTime and goalTotalTime in seconds

  // Run/station split estimation based on total time
  const runFraction = currentTotalTime < 3600 ? 0.40
    : currentTotalTime < 4800 ? 0.45
    : currentTotalTime < 6000 ? 0.50 : 0.55;

  const currentRunTime     = currentTotalTime * runFraction;
  const currentStationTime = currentTotalTime * (1 - runFraction);
  const currentKmPace      = currentRunTime / 8; // 8 × 1km laps

  const goalRunTime     = goalTotalTime * runFraction;
  const goalStationTime = goalTotalTime * (1 - runFraction);
  const goalKmPace      = goalRunTime / 8;

  const stationTargets = {};
  Object.entries(STATION_WEIGHTS).forEach(([station, weight]) => {
    const currentTime = currentStationTime * weight;
    const goalTime    = goalStationTime * weight;
    stationTargets[station] = {
      current:     Math.round(currentTime),
      goal:        Math.round(goalTime),
      improvement: Math.round(currentTime - goalTime),
    };
  });

  return {
    currentKmPaceFormatted: formatPace(currentKmPace),
    goalKmPaceFormatted:    formatPace(goalKmPace),
    stationTargets,
    planWeeks: hyroxPlanWeeks(currentTotalTime, goalTotalTime),
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────

export { hyroxTargets, hyroxPlanWeeks };

export const hyroxPaceService = { hyroxTargets, hyroxPlanWeeks };
