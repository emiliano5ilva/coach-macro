// Shared utilities for run-plan onboarding → DB write path.
// Used by both NativeApp.jsx (saveProfile) and ob_screens2.jsx (PlanOnboarding.handleConfirm).

// Converts separate minutes + seconds into a Postgres interval string "HH:MM:SS".
// Returns null when min is falsy (no time entered).
export function minSecToInterval(min, sec) {
  if (!min) return null;
  const total = parseInt(min || 0) * 60 + parseInt(sec || 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Maps PlanOnboarding runPlan display labels → run_race_type column values.
// Covers both the pure-distance run_distance labels (4b-1+) and legacy run_goal labels.
export const PLAN_TO_RACE_TYPE = {
  // Pure-distance labels (run_distance step)
  "5K":               "5k",
  "10K":              "10k",
  "Half Marathon":    "half_marathon",
  "Marathon":         "marathon",
  "General Fitness":  "general",
  // Legacy bundled labels (run_goal — kept for existing seeded accounts)
  "Couch to 5K":      "5k",
  "Sub-25 5K":        "5k",
  "10K Training":     "10k",
  "Advanced Marathon":"marathon",
};

// Maps the old handleTrainDone runningGoal coded values → run_race_type column values.
// Used by NativeApp.saveProfile (System 1 flow).
export const RUNNING_GOAL_TO_RACE_TYPE = {
  first_5k:  "5k",
  sub25_5k:  "5k",
  first_10k: "10k",
  sub50_10k: "10k",
  half:      "half_marathon",
  marathon:  "marathon",
  fitness:   "5k",
};
