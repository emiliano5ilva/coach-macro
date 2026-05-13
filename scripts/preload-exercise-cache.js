#!/usr/bin/env node
/**
 * Preloads exercise GIF data into Supabase exercise_cache.
 * Run once during development to avoid hitting the 50 req/day API limit.
 *
 * Usage:
 *   RAPIDAPI_KEY=your_key node scripts/preload-exercise-cache.js
 *
 * Or with a .env file:
 *   node --env-file=.env scripts/preload-exercise-cache.js
 *
 * Requires Node 18+. No extra dependencies beyond @supabase/supabase-js
 * (already installed). Creates exercise_cache rows for all mapped exercises.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://oxxihlwqukbakmnnavuy.supabase.co";
// Use the service-role key here so RLS doesn't block inserts.
// Get it from: Supabase Dashboard → Settings → API → service_role key
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY || "";

const EXERCISEDB_BASE = "https://exercisedb.p.rapidapi.com";

const EXERCISE_NAME_MAP = {
  "Barbell Squat":          "barbell squat",
  "Barbell Bench Press":    "barbell bench press",
  "Deadlift":               "deadlift",
  "Overhead Press":         "barbell overhead press",
  "Barbell Row":            "barbell bent over row",
  "Pull Up":                "pull-up",
  "Romanian Deadlift":      "romanian deadlift",
  "Lat Pulldown":           "cable lat pulldown",
  "Incline Dumbbell Press": "incline dumbbell press",
  "Lateral Raise":          "dumbbell lateral raise",
  "Face Pull":              "cable face pull",
  "Leg Press":              "leg press",
  "Leg Curl":               "lying leg curls",
  "Leg Extension":          "leg extension",
  "Calf Raise":             "standing calf raises",
  "Hip Thrust":             "barbell hip thrust",
  "Bulgarian Split Squat":  "dumbbell bulgarian split squat",
  "Hack Squat":             "hack squat",
  "Cable Row":              "cable seated row",
  "Tricep Pushdown":        "cable pushdown",
  "Skull Crusher":          "ez barbell skull crusher",
  "Barbell Curl":           "barbell curl",
  "Hammer Curl":            "dumbbell hammer curl",
  "Ab Wheel Rollout":       "ab wheel rollout",
  "Hanging Leg Raise":      "hanging leg raise",
  "Dumbbell Row":           "dumbbell bent over row",
  "Incline Barbell Press":  "barbell incline bench press",
  "Close Grip Bench":       "close-grip bench press",
  "Dip":                    "chest dips",
  "Chin Up":                "chin-up",
  "Seated Row":             "cable seated row",
  "Cable Crossover":        "cable crossover",
  "Pec Deck":               "pec deck fly",
  "Preacher Curl":          "ez-bar preacher curl",
  "Tricep Extension":       "dumbbell triceps extension",
  "Goblet Squat":           "kettlebell goblet squat",
  "Sumo Deadlift":          "sumo deadlift",
  "Front Squat":            "barbell front squat",
  "Good Morning":           "good morning",
  "Hyperextension":         "back extension",
  "Glute Bridge":           "glute bridge",
  "Reverse Fly":            "bent over dumbbell reverse fly",
  "Shrug":                  "barbell shrug",
  "Arnold Press":           "arnold press",
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchFromExerciseDB(searchName) {
  try {
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
    };
  } catch (e) {
    console.error("  ExerciseDB error:", e.message);
    return null;
  }
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
    const imgRes = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise_base=${id}&format=json`);
    const imgData = await imgRes.json();
    const img = imgData?.results?.find(i => i.is_main) || imgData?.results?.[0];
    if (!img?.image) return null;
    return { gif_url: img.image, target_muscles: [], secondary_muscles: [], instructions: [], equipment: null };
  } catch { return null; }
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error("❌ No RAPIDAPI_KEY set. Export it before running:\n   export RAPIDAPI_KEY=your_key");
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_KEY) {
    console.warn("⚠️  No SUPABASE_SERVICE_KEY — using anon key (RLS may block inserts).");
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eGlobHdxdWtiYWttbm5hdnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTc3OTUsImV4cCI6MjA5MjQ5Mzc5NX0.IIK9gfRtgVidt6dShxAn6OCVNxIvdbFSFDYzWgVNFbk");

  // Get already-cached exercises
  const { data: existing } = await supabase.from("exercise_cache").select("exercise_name");
  const cached = new Set((existing || []).map(r => r.exercise_name));
  console.log(`ℹ  Already cached: ${cached.size} exercises`);

  const exercises = Object.entries(EXERCISE_NAME_MAP);
  let fetched = 0, skipped = 0, failed = 0;

  for (const [displayName, searchName] of exercises) {
    if (cached.has(displayName)) {
      console.log(`  ⏭  ${displayName} — already cached`);
      skipped++;
      continue;
    }

    console.log(`  🔍 ${displayName} (searching: "${searchName}")…`);
    let exData = await fetchFromExerciseDB(searchName);

    if (!exData) {
      console.log(`     ↪ ExerciseDB miss — trying Wger…`);
      exData = await fetchFromWger(displayName);
    }

    if (exData) {
      const { error } = await supabase.from("exercise_cache").insert({
        exercise_name:     displayName,
        gif_url:           exData.gif_url,
        target_muscles:    exData.target_muscles    || [],
        secondary_muscles: exData.secondary_muscles || [],
        instructions:      exData.instructions      || [],
        equipment:         exData.equipment         || null,
      });
      if (error) {
        console.log(`     ❌ Insert error: ${error.message}`);
        failed++;
      } else {
        console.log(`     ✅ Cached — ${exData.gif_url?.slice(0,60)}…`);
        fetched++;
      }
    } else {
      console.log(`     ⚠️  No data found from either API`);
      failed++;
    }

    // Respect rate limits: ExerciseDB free = ~50/day, ~1 req/sec is safe
    await sleep(1200);
  }

  console.log(`\n✅ Done. Fetched: ${fetched}  Skipped: ${skipped}  Failed: ${failed}`);
}

main();
