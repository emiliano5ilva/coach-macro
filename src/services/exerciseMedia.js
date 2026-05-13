import { sb } from "../supabase.js";

const EXERCISEDB_BASE = "https://exercisedb.p.rapidapi.com";
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

export const EXERCISE_NAME_MAP = {
  "Barbell Squat":           "barbell squat",
  "Barbell Bench Press":     "barbell bench press",
  "Deadlift":                "deadlift",
  "Overhead Press":          "barbell overhead press",
  "Barbell Row":             "barbell bent over row",
  "Pull Up":                 "pull-up",
  "Romanian Deadlift":       "romanian deadlift",
  "Lat Pulldown":            "cable lat pulldown",
  "Incline Dumbbell Press":  "incline dumbbell press",
  "Lateral Raise":           "dumbbell lateral raise",
  "Face Pull":               "cable face pull",
  "Leg Press":               "leg press",
  "Leg Curl":                "lying leg curls",
  "Leg Extension":           "leg extension",
  "Calf Raise":              "standing calf raises",
  "Hip Thrust":              "barbell hip thrust",
  "Bulgarian Split Squat":   "dumbbell bulgarian split squat",
  "Hack Squat":              "hack squat",
  "Cable Row":               "cable seated row",
  "Tricep Pushdown":         "cable pushdown",
  "Skull Crusher":           "ez barbell skull crusher",
  "Barbell Curl":            "barbell curl",
  "Hammer Curl":             "dumbbell hammer curl",
  "Ab Wheel Rollout":        "ab wheel rollout",
  "Hanging Leg Raise":       "hanging leg raise",
  "Dumbbell Row":            "dumbbell bent over row",
  "Incline Barbell Press":   "barbell incline bench press",
  "Close Grip Bench":        "close-grip bench press",
  "Dip":                     "chest dips",
  "Chin Up":                 "chin-up",
  "Seated Row":              "cable seated row",
  "Cable Crossover":         "cable crossover",
  "Pec Deck":                "pec deck fly",
  "Preacher Curl":           "ez-bar preacher curl",
  "Concentration Curl":      "dumbbell concentration curl",
  "Tricep Extension":        "dumbbell triceps extension",
  "Overhead Tricep":         "dumbbell overhead tricep extension",
  "Goblet Squat":            "kettlebell goblet squat",
  "Sumo Deadlift":           "sumo deadlift",
  "Front Squat":             "barbell front squat",
  "Good Morning":            "good morning",
  "Hyperextension":          "back extension",
  "Glute Bridge":            "glute bridge",
  "Reverse Fly":             "bent over dumbbell reverse fly",
  "Shrug":                   "barbell shrug",
  "Upright Row":             "barbell upright row",
  "Arnold Press":            "arnold press",
};

async function fetchFromExerciseDB(exerciseName) {
  if (!RAPIDAPI_KEY) return null;
  try {
    const searchName = EXERCISE_NAME_MAP[exerciseName] || exerciseName.toLowerCase();
    const res = await fetch(
      `${EXERCISEDB_BASE}/exercises/name/${encodeURIComponent(searchName)}?limit=1`,
      {
        headers: {
          "X-RapidAPI-Key":  RAPIDAPI_KEY,
          "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]?.gifUrl) return null;
    return {
      gif_url:           data[0].gifUrl,
      target_muscles:    data[0].targetMuscles    || [],
      secondary_muscles: data[0].secondaryMuscles || [],
      instructions:      data[0].instructions     || [],
      equipment:         data[0].equipment        || null,
      body_part:         data[0].bodyPart         || null,
      source:            "exercisedb",
    };
  } catch { return null; }
}

async function fetchFromWger(exerciseName) {
  try {
    const res = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(exerciseName)}&language=english&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const id = data?.suggestions?.[0]?.data?.id;
    if (!id) return null;
    const [imgRes] = await Promise.all([
      fetch(`https://wger.de/api/v2/exerciseimage/?exercise_base=${id}&format=json`),
    ]);
    const imgData = await imgRes.json();
    const img = imgData?.results?.find(i => i.is_main) || imgData?.results?.[0];
    if (!img?.image) return null;
    return {
      gif_url:           img.image,
      target_muscles:    [],
      secondary_muscles: [],
      instructions:      [],
      equipment:         null,
      body_part:         null,
      source:            "wger",
    };
  } catch { return null; }
}

async function cacheToSupabase(exerciseName, data) {
  try {
    await sb.from("exercise_cache").insert({
      exercise_name:     exerciseName,
      gif_url:           data.gif_url,
      target_muscles:    data.target_muscles    || [],
      secondary_muscles: data.secondary_muscles || [],
      instructions:      data.instructions      || [],
      equipment:         data.equipment         || null,
    });
  } catch { /* ignore duplicate key */ }
}

export async function getCachedExerciseData(exerciseName) {
  try {
    const { data } = await sb
      .from("exercise_cache")
      .select("*")
      .eq("exercise_name", exerciseName)
      .maybeSingle();
    if (data) return { ...data, cached: true };
  } catch { /* continue to live fetch */ }

  const exData = await fetchFromExerciseDB(exerciseName);
  if (exData) { cacheToSupabase(exerciseName, exData); return exData; }

  const wgerData = await fetchFromWger(exerciseName);
  if (wgerData) { cacheToSupabase(exerciseName, wgerData); return wgerData; }

  return null;
}
