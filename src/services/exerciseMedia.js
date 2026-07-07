import { sb } from "../supabase.js";

// ExerciseDB metadata is fetched through our own /api/exercise-media proxy, which holds
// the RapidAPI key server-side (process.env.RAPIDAPI_KEY). The key is NOT VITE_-prefixed,
// so it never ships in the client bundle. Same VITE_API_BASE_URL the other client calls use.
const API_BASE     = import.meta.env.VITE_API_BASE_URL || "";
const FREE_DB_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Maps our display names → ExerciseDB search strings
export const EXERCISEDB_NAME_MAP = {
  "Barbell Squat":          "barbell squat",
  "Barbell Bench Press":    "barbell bench press",
  "Deadlift":               "barbell deadlift",
  "Overhead Press":         "barbell shoulder press",
  "Barbell Row":            "bent over barbell row",
  "Pull Up":                "pull-up",
  "Romanian Deadlift":      "romanian deadlift",
  "Lat Pulldown":           "lat pulldown",
  "Incline Dumbbell Press": "incline dumbbell press",
  "Lateral Raise":          "dumbbell lateral raise",
  "Face Pull":              "face pull",
  "Leg Press":              "leg press",
  "Leg Curl":               "lying leg curls",
  "Leg Extension":          "leg extension",
  "Calf Raise":             "standing calf raises",
  "Hip Thrust":             "barbell hip thrust",
  "Bulgarian Split Squat":  "bulgarian split squat",
  "Hack Squat":             "hack squat",
  "Cable Row":              "cable row",
  "Tricep Pushdown":        "tricep pushdown",
  "Skull Crusher":          "skull crusher",
  "Barbell Curl":           "barbell curl",
  "Hammer Curl":            "hammer curl",
  "Ab Wheel Rollout":       "ab rollout",
  "Hanging Leg Raise":      "hanging leg raise",
  "Dumbbell Row":           "dumbbell row",
  "Incline Barbell Press":  "barbell incline bench press",
  "Close Grip Bench":       "close grip bench press",
  "Dip":                    "chest dips",
  "Chin Up":                "chin-up",
  "Seated Row":             "seated row",
  "Cable Crossover":        "cable crossover",
  "Pec Deck":               "pec deck",
  "Preacher Curl":          "preacher curl",
  "Tricep Extension":       "triceps extension",
  "Goblet Squat":           "goblet squat",
  "Sumo Deadlift":          "sumo deadlift",
  "Front Squat":            "front squat",
  "Good Morning":           "good morning",
  "Hyperextension":         "back extension",
  "Glute Bridge":           "glute bridge",
  "Reverse Fly":            "rear delt fly",
  "Shrug":                  "barbell shrug",
  "Arnold Press":           "arnold press",
};

// Maps our display names → free-exercise-db GitHub folder names
export const FREE_EXERCISE_DB_MAP = {
  "Barbell Squat":          "Barbell_Squat",
  "Barbell Bench Press":    "Barbell_Bench_Press_-_Medium_Grip",
  "Deadlift":               "Barbell_Deadlift",
  "Overhead Press":         "Barbell_Shoulder_Press",
  "Barbell Row":            "Bent_Over_Barbell_Row",
  "Pull Up":                "Band_Assisted_Pull-Up",
  "Romanian Deadlift":      "Stiff-Legged_Barbell_Deadlift",
  "Lat Pulldown":           "Close-Grip_Front_Lat_Pulldown",
  "Incline Dumbbell Press": "Incline_Dumbbell_Press",
  "Lateral Raise":          "Cable_Seated_Lateral_Raise",
  "Face Pull":              "Face_Pull",
  "Leg Press":              "Leg_Press",
  "Leg Curl":               "Lying_Leg_Curls",
  "Leg Extension":          "Leg_Extensions",
  "Calf Raise":             "Donkey_Calf_Raises",
  "Hip Thrust":             "Barbell_Hip_Thrust",
  "Bulgarian Split Squat":  "Barbell_Side_Split_Squat",
  "Hack Squat":             "Barbell_Hack_Squat",
  "Cable Row":              "Elevated_Cable_Rows",
  "Tricep Pushdown":        "Cable_Incline_Pushdown",
  "Skull Crusher":          "EZ-Bar_Skullcrusher",
  "Barbell Curl":           "Barbell_Curl",
  "Hammer Curl":            "Hammer_Curls",
  "Ab Wheel Rollout":       "Barbell_Ab_Rollout_-_On_Knees",
  "Hanging Leg Raise":      "Hanging_Leg_Raise",
  "Dumbbell Row":           "One-Arm_Dumbbell_Row",
  "Incline Barbell Press":  "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Close Grip Bench":       "Close-Grip_Barbell_Bench_Press",
  "Dip":                    "Bench_Dips",
  "Chin Up":                "Chin-Up",
  "Seated Row":             "Elevated_Cable_Rows",
  "Cable Crossover":        "Cable_Crossover",
  "Pec Deck":               null,
  "Preacher Curl":          "Cable_Preacher_Curl",
  "Tricep Extension":       "Dumbbell_One-Arm_Triceps_Extension",
  "Goblet Squat":           "Goblet_Squat",
  "Sumo Deadlift":          "Barbell_Deadlift",
  "Front Squat":            "Front_Squat_Clean_Grip",
  "Good Morning":           "Good_Morning",
  "Hyperextension":         "Hyperextensions_Back_Extensions",
  "Glute Bridge":           "Barbell_Glute_Bridge",
  "Reverse Fly":            "Dumbbell_Lying_Rear_Lateral_Raise",
  "Shrug":                  "Dumbbell_Shrug",
  "Arnold Press":           "Arnold_Dumbbell_Press",
};

function githubImageUrls(exerciseName) {
  const folder = FREE_EXERCISE_DB_MAP[exerciseName];
  if (!folder) return { gif_url: null, gif_url_2: null };
  return {
    gif_url:   `${FREE_DB_BASE}/${folder}/0.jpg`,
    gif_url_2: `${FREE_DB_BASE}/${folder}/1.jpg`,
  };
}

// Synchronous — no fetch. Returns null when exercise has no known thumbnail.
export function getThumbnailUrl(exerciseName) {
  const folder = FREE_EXERCISE_DB_MAP[exerciseName];
  if (!folder) return null;
  return `${FREE_DB_BASE}/${folder}/0.jpg`;
}

async function fetchMetadataFromExerciseDB(exerciseName) {
  try {
    const searchName = EXERCISEDB_NAME_MAP[exerciseName] || exerciseName.toLowerCase();
    // Proxy holds the RapidAPI key and returns the already-normalized metadata shape.
    const res = await fetch(`${API_BASE}/api/exercise-media?name=${encodeURIComponent(searchName)}`);
    if (!res.ok) return null;
    return await res.json(); // { target_muscles, secondary_muscles, instructions, equipment, body_part } | null
  } catch { return null; }
}

async function cacheToSupabase(exerciseName, row) {
  try {
    await sb.from("exercise_cache").insert({ exercise_name: exerciseName, ...row });
  } catch { /* ignore duplicate key */ }
}

export async function getCachedExerciseData(exerciseName) {
  // Supabase cache first
  try {
    const { data } = await sb.from("exercise_cache").select("*").eq("exercise_name", exerciseName).maybeSingle();
    if (data) return { ...data, cached: true };
  } catch { /* continue */ }

  // Build image URLs from free-exercise-db (zero API calls)
  const images = githubImageUrls(exerciseName);

  // Fetch metadata from ExerciseDB API
  const meta = await fetchMetadataFromExerciseDB(exerciseName);

  const row = {
    gif_url:           images.gif_url,
    gif_url_2:         images.gif_url_2,
    target_muscles:    meta?.target_muscles    || [],
    secondary_muscles: meta?.secondary_muscles || [],
    instructions:      meta?.instructions      || [],
    equipment:         meta?.equipment         || null,
  };

  cacheToSupabase(exerciseName, row); // fire-and-forget
  return row;
}
