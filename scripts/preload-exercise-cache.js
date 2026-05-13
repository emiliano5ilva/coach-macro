#!/usr/bin/env node
/**
 * Preloads exercise data into Supabase exercise_cache.
 * - Images: free-exercise-db GitHub repo (zero API calls, unlimited)
 * - Metadata: ExerciseDB RapidAPI (muscles, instructions — uses ~44 of 50 daily free requests)
 *
 * Usage (from project root):
 *   node --env-file=.env scripts/preload-exercise-cache.js
 *
 * Requires Node 18+. No extra packages needed.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL         = "https://oxxihlwqukbakmnnavuy.supabase.co";
const SUPABASE_ANON_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eGlobHdxdWtiYWttbm5hdnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTc3OTUsImV4cCI6MjA5MjQ5Mzc5NX0.IIK9gfRtgVidt6dShxAn6OCVNxIvdbFSFDYzWgVNFbk";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

const RAPIDAPI_KEY  = process.env.RAPIDAPI_KEY || process.env.VITE_RAPIDAPI_KEY || "";
const EXERCISEDB    = "https://exercisedb.p.rapidapi.com";
const FREE_DB_BASE  = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// ExerciseDB search names (for metadata only — muscles, instructions, equipment)
const EXERCISEDB_NAME_MAP = {
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

// free-exercise-db folder names for start/end position images
const FREE_EXERCISE_DB_MAP = {
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

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchMetadata(searchName) {
  try {
    const res = await fetch(
      `${EXERCISEDB}/exercises/name/${encodeURIComponent(searchName)}?limit=1`,
      { headers: { "X-RapidAPI-Key": RAPIDAPI_KEY, "X-RapidAPI-Host": "exercisedb.p.rapidapi.com" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.[0]) return null;
    const d = data[0];
    return {
      target_muscles:    d.target    ? [d.target]  : [],
      secondary_muscles: d.secondaryMuscles         || [],
      instructions:      d.instructions             || [],
      equipment:         d.equipment                || null,
    };
  } catch (e) {
    console.error("  ExerciseDB error:", e.message);
    return null;
  }
}

async function main() {
  if (!RAPIDAPI_KEY) {
    console.error("❌ No RAPIDAPI_KEY. Run: node --env-file=.env scripts/preload-exercise-cache.js");
    process.exit(1);
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Detect which optional columns exist in the live table
  const { error: e2 } = await sb.from("exercise_cache").select("gif_url_2").limit(1);
  const { error: e3 } = await sb.from("exercise_cache").select("secondary_muscles").limit(1);
  const hasGifUrl2        = !e2?.message?.includes("gif_url_2");
  const hasSecondaryMuscles = !e3?.message?.includes("secondary_muscles");

  if (!hasGifUrl2 || !hasSecondaryMuscles) {
    console.warn("⚠️  Some columns are missing from exercise_cache. Run this in Supabase SQL editor for full data:");
    console.warn("    alter table exercise_cache add column if not exists gif_url_2 text;");
    console.warn("    alter table exercise_cache add column if not exists secondary_muscles text[] default '{}';");
    console.warn("    Then wait ~60 seconds and re-run this script to populate those fields.\n");
    console.warn("    Continuing now with available columns only...\n");
  }

  // Fetch full existing rows so we know what's already populated
  const { data: existing } = await sb.from("exercise_cache").select("exercise_name, target_muscles");
  const cachedMap = Object.fromEntries((existing || []).map(r => [r.exercise_name, r]));
  const cachedCount = Object.keys(cachedMap).length;
  console.log(`ℹ  Already cached: ${cachedCount} exercises\n`);

  let inserted = 0, updated = 0, skipped = 0, imgMiss = 0;

  for (const [displayName, searchName] of Object.entries(EXERCISEDB_NAME_MAP)) {
    const folder    = FREE_EXERCISE_DB_MAP[displayName];
    const gif_url   = folder ? `${FREE_DB_BASE}/${folder}/0.jpg` : null;
    const gif_url_2 = folder ? `${FREE_DB_BASE}/${folder}/1.jpg` : null;
    if (!folder) imgMiss++;

    const existingRow = cachedMap[displayName];

    if (existingRow) {
      // Already inserted — update only if new columns are available
      if (!hasGifUrl2 && !hasSecondaryMuscles) {
        console.log(`  ⏭  ${displayName} — columns not ready yet`);
        skipped++;
        continue;
      }

      // gif_url_2 needs no API call. secondary_muscles needs one API call,
      // but only if this exercise had metadata in the first run.
      const hadMeta = existingRow.target_muscles?.length > 0;
      let secondary_muscles = [];

      if (hasSecondaryMuscles && hadMeta) {
        process.stdout.write(`  🔄 ${displayName}… `);
        const meta = await fetchMetadata(searchName);
        secondary_muscles = meta?.secondary_muscles || [];
        process.stdout.write(secondary_muscles.length
          ? `secondary: [${secondary_muscles.join(",")}]\n`
          : `(none)\n`
        );
        await sleep(1300);
      } else {
        console.log(`  🔄 ${displayName} — images only`);
      }

      const updateRow = {};
      if (hasGifUrl2)          updateRow.gif_url_2         = gif_url_2;
      if (hasSecondaryMuscles) updateRow.secondary_muscles = secondary_muscles;

      const { error } = await sb.from("exercise_cache")
        .update(updateRow)
        .eq("exercise_name", displayName);

      if (error) console.log(`     ❌ Update error: ${error.message}`);
      else updated++;

    } else {
      // New exercise — full insert
      process.stdout.write(`  🔍 ${displayName}… `);
      const meta = await fetchMetadata(searchName);
      if (meta) process.stdout.write(`✅ [${meta.target_muscles.join(",")}]\n`);
      else       process.stdout.write(`⚠️  no metadata\n`);

      const row = {
        exercise_name:  displayName,
        gif_url,
        target_muscles: meta?.target_muscles || [],
        instructions:   meta?.instructions   || [],
        equipment:      meta?.equipment      || null,
      };
      if (hasGifUrl2)          row.gif_url_2         = gif_url_2;
      if (hasSecondaryMuscles) row.secondary_muscles = meta?.secondary_muscles || [];

      const { error } = await sb.from("exercise_cache").insert(row);
      if (error) console.log(`     ❌ DB error: ${error.message}`);
      else inserted++;

      await sleep(1300);
    }
  }

  console.log(`\n✅ Done.  Inserted: ${inserted}  Updated: ${updated}  Skipped: ${skipped}  No image: ${imgMiss}`);
}

main();
