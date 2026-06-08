// canonicalExerciseData.js
// Hand-authored exercise-data backbone for Coach Macro.
// Built from the free-exercise-db (yuhonas/free-exercise-db, CC0) with QA-reviewed
// muscle group, primary/secondary muscles, body-map regions, equipment, and images.
// Purpose: resolve the ~190 exercises the curated EXERCISE_MUSCLE_MAP doesn't cover, so muscle-
// coverage maps, recovery, swaps, and equipment filtering work for every logged movement.
// USAGE: curated maps are PREFERRED; this is the fallback for names they miss.

// primary/secondary use Title-Case muscle labels that match MUSCLE_TO_BODYMAP keys.
// regions are body-map region ids. equipment: barbell|dumbbell|cable|machine|kettlebell|bands|bodyweight|other

export const FREE_DB_IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Title-Case muscle -> body-map region id (STRING, same format as MUSCLE_TO_BODYMAP).
export const COARSE_MUSCLE_TO_BODYMAP = {
 "Chest": "chest",
 "Shoulders": "shoulders-f",
 "Rear Delt": "rear-delts",
 "Triceps": "triceps",
 "Biceps": "biceps",
 "Forearms": "forearms-f",
 "Lats": "lats",
 "Middle Back": "lats",
 "Lower Back": "lower-back",
 "Traps": "traps",
 "Abdominals": "abs",
 "Hip Flexors": "hip-flexors",
 "Quadriceps": "quads",
 "Hamstrings": "hamstrings",
 "Glutes": "glutes",
 "Calves": "calves-f",
 "Adductors": "quads",
 "Abductors": "glutes",
 "Rhomboids": "lats"
};

// name -> { group, primary[], secondary[], regions[], equipment, image|null }
export const CANONICAL_EXERCISE_DATA = {
 "Ab Wheel Rollout": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Abduction Machine": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "machine",
  "image": null
 },
 "Arnold Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Assisted Pull Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "machine",
  "image": null
 },
 "Back Extension": {
  "group": "back",
  "primary": [
   "Lower Back"
  ],
  "secondary": [
   "Glutes",
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "machine",
  "image": null
 },
 "Back Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Band Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Donkey Kick": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Face Pull": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "bands",
  "image": "Face_Pull/0.jpg"
 },
 "Band Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Kickback": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Lateral Raise": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [],
  "regions": [
   "shoulders-f"
  ],
  "equipment": "bands",
  "image": "Lateral_Raise_-_With_Bands/0.jpg"
 },
 "Band Lateral Walk": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Pull Apart": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "bands",
  "image": "Band_Pull_Apart/0.jpg"
 },
 "Band Pull Through": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bands",
  "image": "Pull_Through/0.jpg"
 },
 "Band Rear Delt Fly": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "bands",
  "image": null
 },
 "Band Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors",
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads"
  ],
  "equipment": "bands",
  "image": "Squat_with_Bands/0.jpg"
 },
 "Band Tricep Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "bands",
  "image": "Triceps_Pushdown/0.jpg"
 },
 "Band Upright Row": {
  "group": "shoulders",
  "primary": [
   "Shoulders",
   "Traps"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "shoulders-f",
   "traps"
  ],
  "equipment": "bands",
  "image": "Upright_Row_-_With_Bands/0.jpg"
 },
 "Banded Bicep Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Bicycle Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Chest Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Clamshell": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Donkey Kick": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Good Morning": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Lower Back"
  ],
  "secondary": [
   "Glutes"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bands",
  "image": "Good_Morning/0.jpg"
 },
 "Banded Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Lateral Raise": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [],
  "regions": [
   "shoulders-f"
  ],
  "equipment": "bands",
  "image": "Lateral_Raise_-_With_Bands/0.jpg"
 },
 "Banded Lateral Walk": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Monster Walk": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "bands",
  "image": "Monster_Walk/0.jpg"
 },
 "Banded Overhead Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Pallof Press": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bands",
  "image": "Pallof_Press/0.jpg"
 },
 "Banded Pull Through": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bands",
  "image": "Pull_Through/0.jpg"
 },
 "Banded Reverse Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Romanian Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bands",
  "image": "Romanian_Deadlift/0.jpg"
 },
 "Banded Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Squat Jump": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bands",
  "image": null
 },
 "Banded Tricep Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "bands",
  "image": "Triceps_Pushdown/0.jpg"
 },
 "Barbell Bench Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": "Bench_Press_-_With_Bands/0.jpg"
 },
 "Barbell Bent Over Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "barbell",
  "image": "Barbell_Curl/0.jpg"
 },
 "Barbell Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "barbell",
  "image": "Barbell_Hip_Thrust/0.jpg"
 },
 "Barbell Hip Thrust Pulse": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "barbell",
  "image": "Barbell_Lunge/0.jpg"
 },
 "Barbell Overhead Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Overhead Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Shrug": {
  "group": "back",
  "primary": [
   "Traps"
  ],
  "secondary": [],
  "regions": [
   "traps"
  ],
  "equipment": "barbell",
  "image": "Barbell_Shrug/0.jpg"
 },
 "Barbell Skull Crusher": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors",
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads"
  ],
  "equipment": "barbell",
  "image": "Barbell_Squat/0.jpg"
 },
 "Barbell Sumo Deadlift": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings",
   "Quadriceps"
  ],
  "secondary": [
   "Lower Back",
   "Traps"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Sumo_Deadlift/0.jpg"
 },
 "Barbell Sumo Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes",
   "Adductors"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Barbell Upright Row": {
  "group": "shoulders",
  "primary": [
   "Shoulders",
   "Traps"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "shoulders-f",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Upright_Row_-_With_Bands/0.jpg"
 },
 "Bear Crawl": {
  "group": "full_body",
  "primary": [
   "Abdominals",
   "Shoulders"
  ],
  "secondary": [
   "Quadriceps"
  ],
  "regions": [
   "abs",
   "quads",
   "shoulders-f"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Bench Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": "Bench_Press_-_With_Bands/0.jpg"
 },
 "Bent Over Lateral Raise": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Bicep Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Bicep Curl with Resistance Band": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "bands",
  "image": null
 },
 "Bicycle Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Bird Dog": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "abs",
   "lower-back"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Bodyweight Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "bodyweight",
  "image": "Calf_Raises_-_With_Bands/0.jpg"
 },
 "Bodyweight Hip Hinge": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Bodyweight Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors",
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": "Bodyweight_Squat/0.jpg"
 },
 "Bodyweight Step Up": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Box Jump": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": "Box_Jump_Multiple_Response/0.jpg"
 },
 "Bulgarian Split Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Burpee": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "quads",
   "shoulders-f"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Burpee Broad Jump": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "quads",
   "shoulders-f"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Cable Bulgarian Split Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "cable",
  "image": "Calf_Raises_-_With_Bands/0.jpg"
 },
 "Cable Chest Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "cable",
  "image": "Cable_Chest_Press/0.jpg"
 },
 "Cable Crossover": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "cable",
  "image": "Cable_Crossover/0.jpg"
 },
 "Cable Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "cable",
  "image": "Cable_Crunch/0.jpg"
 },
 "Cable Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Curtsy Lunge": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Quadriceps"
  ],
  "secondary": [
   "Adductors",
   "Abductors"
  ],
  "regions": [
   "glutes",
   "quads"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Donkey Kick": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Hammer Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "cable",
  "image": "Hammer_Curls/0.jpg"
 },
 "Cable Hip Abduction": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Hip Kickback": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Kickback": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Lateral Raise": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [],
  "regions": [
   "shoulders-f"
  ],
  "equipment": "cable",
  "image": "Lateral_Raise_-_With_Bands/0.jpg"
 },
 "Cable Leg Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Leg Extension": {
  "group": "legs",
  "primary": [
   "Quadriceps"
  ],
  "secondary": [],
  "regions": [
   "quads"
  ],
  "equipment": "cable",
  "image": "Leg_Extensions/0.jpg"
 },
 "Cable Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Overhead Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Overhead Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Pull Through": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "cable",
  "image": "Pull_Through/0.jpg"
 },
 "Cable Pullover": {
  "group": "back",
  "primary": [
   "Lats",
   "Chest"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "chest",
   "lats",
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Rear Delt Fly": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "cable",
  "image": "Cable_Rear_Delt_Fly/0.jpg"
 },
 "Cable Reverse Curl": {
  "group": "biceps",
  "primary": [
   "Forearms"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Romanian Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "cable",
  "image": "Romanian_Deadlift/0.jpg"
 },
 "Cable Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Shoulder Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "cable",
  "image": "Cable_Shoulder_Press/0.jpg"
 },
 "Cable Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors",
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads"
  ],
  "equipment": "cable",
  "image": "Squat_with_Bands/0.jpg"
 },
 "Cable Sumo Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes",
   "Adductors"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Tricep Press": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Cable Tricep Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": "Triceps_Pushdown/0.jpg"
 },
 "Cable Upright Row": {
  "group": "shoulders",
  "primary": [
   "Shoulders",
   "Traps"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "shoulders-f",
   "traps"
  ],
  "equipment": "cable",
  "image": "Upright_Row_-_With_Bands/0.jpg"
 },
 "Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "bodyweight",
  "image": "Calf_Raises_-_With_Bands/0.jpg"
 },
 "Calf Raise Machine": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "machine",
  "image": "Calf_Raises_-_With_Bands/0.jpg"
 },
 "Chest Dip": {
  "group": "chest",
  "primary": [
   "Chest",
   "Triceps"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Chest Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Chest Press Machine": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "machine",
  "image": null
 },
 "Chest-Supported Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "machine",
  "image": null
 },
 "Chin Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Chin-Up/0.jpg"
 },
 "Chin-Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Chin-Up/0.jpg"
 },
 "Clamshell": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Clean and Jerk": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Shoulders"
  ],
  "secondary": [
   "Glutes",
   "Traps"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Clean_and_Jerk/0.jpg"
 },
 "Close Grip Bench Press": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest",
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": "Bench_Press_-_With_Bands/0.jpg"
 },
 "Close Grip Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "cable",
  "image": null
 },
 "Close Grip Push Up": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest",
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": "Pushups/0.jpg"
 },
 "Concentration Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": "Concentration_Curls/0.jpg"
 },
 "Copenhagen Plank": {
  "group": "legs",
  "primary": [
   "Adductors"
  ],
  "secondary": [
   "Abdominals"
  ],
  "regions": [
   "abs",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Curtsy Lunge": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Quadriceps"
  ],
  "secondary": [
   "Adductors",
   "Abductors"
  ],
  "regions": [
   "glutes",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Dead Bug": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": "Dead_Bug/0.jpg"
 },
 "Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes",
   "Lower Back"
  ],
  "secondary": [
   "Quadriceps",
   "Traps",
   "Forearms"
  ],
  "regions": [
   "forearms-b",
   "forearms-f",
   "glutes",
   "hamstrings",
   "lower-back",
   "quads",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Deadlift_with_Bands/0.jpg"
 },
 "Decline Barbell Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Decline Bench Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Decline Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": "Decline_Crunch/0.jpg"
 },
 "Decline Dumbbell Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Decline Push Up": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": "Decline_Push-Up/0.jpg"
 },
 "Diamond Push Up": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest",
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Dip": {
  "group": "chest",
  "primary": [
   "Chest",
   "Triceps"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Donkey Kick": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Dumbbell Bench Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": "Dumbbell_Bench_Press/0.jpg"
 },
 "Dumbbell Bulgarian Split Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "dumbbell",
  "image": "Calf_Raises_-_With_Bands/0.jpg"
 },
 "Dumbbell Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Curtsy Lunge": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Quadriceps"
  ],
  "secondary": [
   "Adductors",
   "Abductors"
  ],
  "regions": [
   "glutes",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes",
   "Lower Back"
  ],
  "secondary": [
   "Quadriceps",
   "Traps",
   "Forearms"
  ],
  "regions": [
   "forearms-b",
   "forearms-f",
   "glutes",
   "hamstrings",
   "lower-back",
   "quads",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": "Deadlift_with_Bands/0.jpg"
 },
 "Dumbbell Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": "Dumbbell_Flyes/0.jpg"
 },
 "Dumbbell Flye": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": "Dumbbell_Flyes/0.jpg"
 },
 "Dumbbell Goblet Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": "Goblet_Squat/0.jpg"
 },
 "Dumbbell Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Lateral Raise": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [],
  "regions": [
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": "Lateral_Raise_-_With_Bands/0.jpg"
 },
 "Dumbbell Leg Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Leg Extension": {
  "group": "legs",
  "primary": [
   "Quadriceps"
  ],
  "secondary": [],
  "regions": [
   "quads"
  ],
  "equipment": "dumbbell",
  "image": "Leg_Extensions/0.jpg"
 },
 "Dumbbell Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": "Dumbbell_Lunges/0.jpg"
 },
 "Dumbbell Overhead Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Pullover": {
  "group": "back",
  "primary": [
   "Lats",
   "Chest"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "chest",
   "lats",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Rear Delt Fly": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Rollout": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Romanian Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "dumbbell",
  "image": "Romanian_Deadlift/0.jpg"
 },
 "Dumbbell Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Shoulder Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": "Dumbbell_Shoulder_Press/0.jpg"
 },
 "Dumbbell Shrug": {
  "group": "back",
  "primary": [
   "Traps"
  ],
  "secondary": [],
  "regions": [
   "traps"
  ],
  "equipment": "dumbbell",
  "image": "Dumbbell_Shrug/0.jpg"
 },
 "Dumbbell Skull Crusher": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Step Up": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Sumo Deadlift": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings",
   "Quadriceps"
  ],
  "secondary": [
   "Lower Back",
   "Traps"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": "Sumo_Deadlift/0.jpg"
 },
 "Dumbbell Sumo Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes",
   "Adductors"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Thruster": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Shoulders"
  ],
  "secondary": [
   "Glutes",
   "Triceps"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Tricep Press": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Dumbbell Upright Row": {
  "group": "shoulders",
  "primary": [
   "Shoulders",
   "Traps"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "shoulders-f",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": "Upright_Row_-_With_Bands/0.jpg"
 },
 "Dumbbell Walking Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "EZ Bar Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "barbell",
  "image": "EZ-Bar_Curl/0.jpg"
 },
 "EZ Bar Overhead Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "EZ Bar Skull Crusher": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Face Pull": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "cable",
  "image": "Face_Pull/0.jpg"
 },
 "Face Pull with Band": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "cable",
  "image": "Face_Pull/0.jpg"
 },
 "Farmer Carry": {
  "group": "full_body",
  "primary": [
   "Forearms",
   "Traps"
  ],
  "secondary": [
   "Quadriceps",
   "Abdominals"
  ],
  "regions": [
   "abs",
   "forearms-b",
   "forearms-f",
   "quads",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Farmers Carry": {
  "group": "full_body",
  "primary": [
   "Forearms",
   "Traps"
  ],
  "secondary": [
   "Quadriceps",
   "Abdominals"
  ],
  "regions": [
   "abs",
   "forearms-b",
   "forearms-f",
   "quads",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Feet Elevated Push Up": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Flat Dumbbell Flye": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Flat Dumbbell Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Floor Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "barbell",
  "image": "Floor_Press/0.jpg"
 },
 "Frog Pump": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Front Raise": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [],
  "regions": [
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Front Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Abdominals"
  ],
  "regions": [
   "abs",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "barbell",
  "image": "Front_Squat_Clean_Grip/0.jpg"
 },
 "Glute Bridge": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Glute Bridge March": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Glute Bridge Pulse": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Glute Kickback": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": "Glute_Kickback/0.jpg"
 },
 "Glute Squeeze Isometric": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [],
  "regions": [
   "glutes"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Goblet Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "dumbbell",
  "image": "Goblet_Squat/0.jpg"
 },
 "Good Morning": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Lower Back"
  ],
  "secondary": [
   "Glutes"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "barbell",
  "image": "Good_Morning/0.jpg"
 },
 "Hack Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "machine",
  "image": "Hack_Squat/0.jpg"
 },
 "Hack Squat Machine": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "machine",
  "image": "Hack_Squat/0.jpg"
 },
 "Hammer Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": "Hammer_Curls/0.jpg"
 },
 "Hanging Leg Raise": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [
   "Hip Flexors"
  ],
  "regions": [
   "abs",
   "hip-flexors"
  ],
  "equipment": "bodyweight",
  "image": "Hanging_Leg_Raise/0.jpg"
 },
 "Heavy Dumbbell Carry": {
  "group": "full_body",
  "primary": [
   "Forearms",
   "Traps"
  ],
  "secondary": [
   "Quadriceps",
   "Abdominals"
  ],
  "regions": [
   "abs",
   "forearms-b",
   "forearms-f",
   "quads",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "High Cable Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "cable",
  "image": null
 },
 "Hip Abduction Machine": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "machine",
  "image": null
 },
 "Hip Hinge": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Hip Thrust Pulse": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Hollow Body Hold": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Hollow Body Rock": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Hollow Hold": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Hyperextension": {
  "group": "back",
  "primary": [
   "Lower Back"
  ],
  "secondary": [
   "Glutes",
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "machine",
  "image": "Hyperextensions_Back_Extensions/0.jpg"
 },
 "Incline Barbell Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Incline Chest Press Machine": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "machine",
  "image": null
 },
 "Incline DB Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Incline Dumbbell Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": "Incline_Dumbbell_Curl/0.jpg"
 },
 "Incline Dumbbell Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": "Incline_Dumbbell_Flyes/0.jpg"
 },
 "Incline Dumbbell Flye": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": "Incline_Dumbbell_Flyes/0.jpg"
 },
 "Incline Dumbbell Press": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": "Incline_Dumbbell_Press/0.jpg"
 },
 "Incline Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Inverted Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Inverted Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Inverted_Row/0.jpg"
 },
 "Jump Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Kettlebell Swing": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings"
  ],
  "secondary": [
   "Lower Back",
   "Shoulders"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "shoulders-f"
  ],
  "equipment": "kettlebell",
  "image": null
 },
 "Lat Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "cable",
  "image": null
 },
 "Lateral Band Walk": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "bands",
  "image": null
 },
 "Lateral Lunge to Curtsy": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Quadriceps"
  ],
  "secondary": [
   "Adductors",
   "Abductors"
  ],
  "regions": [
   "glutes",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Leg Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": null
 },
 "Leg Curl Machine": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": null
 },
 "Leg Extension": {
  "group": "legs",
  "primary": [
   "Quadriceps"
  ],
  "secondary": [],
  "regions": [
   "quads"
  ],
  "equipment": "machine",
  "image": "Leg_Extensions/0.jpg"
 },
 "Leg Extension Machine": {
  "group": "legs",
  "primary": [
   "Quadriceps"
  ],
  "secondary": [],
  "regions": [
   "quads"
  ],
  "equipment": "machine",
  "image": "Leg_Extensions/0.jpg"
 },
 "Leg Press Machine": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "machine",
  "image": "Leg_Press/0.jpg"
 },
 "Loaded March": {
  "group": "full_body",
  "primary": [
   "Forearms",
   "Traps"
  ],
  "secondary": [
   "Quadriceps",
   "Abdominals"
  ],
  "regions": [
   "abs",
   "forearms-b",
   "forearms-f",
   "quads",
   "traps"
  ],
  "equipment": "other",
  "image": null
 },
 "Low Cable Fly": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "cable",
  "image": null
 },
 "Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Lying Dumbbell Hamstring Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [],
  "regions": [
   "hamstrings"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Lying Leg Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": "Lying_Leg_Curls/0.jpg"
 },
 "Lying Leg Raise": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [
   "Hip Flexors"
  ],
  "regions": [
   "abs",
   "hip-flexors"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Machine Ab Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Donkey Kick": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Hammer Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "machine",
  "image": "Hammer_Curls/0.jpg"
 },
 "Machine Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Kickback": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Lat Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Lateral Raise": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [],
  "regions": [
   "shoulders-f"
  ],
  "equipment": "machine",
  "image": "Lateral_Raise_-_With_Bands/0.jpg"
 },
 "Machine Leg Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Leg Extension": {
  "group": "legs",
  "primary": [
   "Quadriceps"
  ],
  "secondary": [],
  "regions": [
   "quads"
  ],
  "equipment": "machine",
  "image": "Leg_Extensions/0.jpg"
 },
 "Machine Pull Through": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "machine",
  "image": "Pull_Through/0.jpg"
 },
 "Machine Rear Delt": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Romanian Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "machine",
  "image": "Romanian_Deadlift/0.jpg"
 },
 "Machine Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "machine",
  "image": null
 },
 "Machine Shoulder Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "machine",
  "image": "Machine_Shoulder_Military_Press/0.jpg"
 },
 "Machine Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "machine",
  "image": "Machine_Triceps_Extension/0.jpg"
 },
 "Machine Tricep Press": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest"
  ],
  "regions": [
   "chest",
   "triceps"
  ],
  "equipment": "machine",
  "image": null
 },
 "Military Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Mountain Climber": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [
   "Hip Flexors"
  ],
  "regions": [
   "abs",
   "hip-flexors"
  ],
  "equipment": "bodyweight",
  "image": "Mountain_Climbers/0.jpg"
 },
 "Neutral Grip Pull Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Pullups/0.jpg"
 },
 "Neutral Grip Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "cable",
  "image": null
 },
 "Nordic Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Glutes",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Nordic Hamstring Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Glutes",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "One Arm Dumbbell Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "dumbbell",
  "image": "One-Arm_Dumbbell_Row/0.jpg"
 },
 "Overhead Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Overhead Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Pallof Press": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "cable",
  "image": "Pallof_Press/0.jpg"
 },
 "Pec Deck Machine": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [],
  "regions": [
   "chest"
  ],
  "equipment": "machine",
  "image": null
 },
 "Pendlay Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Pike Push Up": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Pilates Hundred": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Plank": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": "Plank/0.jpg"
 },
 "Power Clean": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Traps"
  ],
  "secondary": [
   "Glutes",
   "Shoulders"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Power_Clean/0.jpg"
 },
 "Preacher Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "barbell",
  "image": "Preacher_Curl/0.jpg"
 },
 "Prowler Push": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "other",
  "image": null
 },
 "Pull Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Pullups/0.jpg"
 },
 "Pull-Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Pullups/0.jpg"
 },
 "Push Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps",
   "Quadriceps"
  ],
  "regions": [
   "quads",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": "Push_Press/0.jpg"
 },
 "Push Up": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": "Pushups/0.jpg"
 },
 "Push Up Plus": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Rack Pull": {
  "group": "back",
  "primary": [
   "Lower Back",
   "Traps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Forearms"
  ],
  "regions": [
   "forearms-b",
   "forearms-f",
   "glutes",
   "hamstrings",
   "lower-back",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Rack_Pull_with_Bands/0.jpg"
 },
 "Rear Delt Fly": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Reverse Curl": {
  "group": "biceps",
  "primary": [
   "Forearms"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Reverse Fly": {
  "group": "shoulders",
  "primary": [
   "Rear Delt"
  ],
  "secondary": [
   "Traps"
  ],
  "regions": [
   "rear-delts",
   "traps"
  ],
  "equipment": "dumbbell",
  "image": "Reverse_Flyes/0.jpg"
 },
 "Reverse Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Ring Dip": {
  "group": "triceps",
  "primary": [
   "Triceps",
   "Chest"
  ],
  "secondary": [
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": "Ring_Dips/0.jpg"
 },
 "Romanian Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "barbell",
  "image": "Romanian_Deadlift/0.jpg"
 },
 "Rope Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Russian Twist": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": "Russian_Twist/0.jpg"
 },
 "Sandbag Carry": {
  "group": "full_body",
  "primary": [
   "Forearms",
   "Traps"
  ],
  "secondary": [
   "Quadriceps",
   "Abdominals"
  ],
  "regions": [
   "abs",
   "forearms-b",
   "forearms-f",
   "quads",
   "traps"
  ],
  "equipment": "other",
  "image": null
 },
 "Sandbag Clean": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Traps"
  ],
  "secondary": [
   "Glutes",
   "Shoulders"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f",
   "traps"
  ],
  "equipment": "other",
  "image": null
 },
 "Sandbag Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "other",
  "image": null
 },
 "Seated Cable Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "cable",
  "image": "Seated_Cable_Rows/0.jpg"
 },
 "Seated Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "bodyweight",
  "image": "Seated_Calf_Raise/0.jpg"
 },
 "Seated Hip Abduction": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "machine",
  "image": null
 },
 "Seated Leg Curl": {
  "group": "legs",
  "primary": [
   "Hamstrings"
  ],
  "secondary": [
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "hamstrings"
  ],
  "equipment": "machine",
  "image": "Seated_Leg_Curl/0.jpg"
 },
 "Shrug": {
  "group": "back",
  "primary": [
   "Traps"
  ],
  "secondary": [],
  "regions": [
   "traps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Side Lying Hip Abduction": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Abductors"
  ],
  "regions": [
   "glutes"
  ],
  "equipment": "machine",
  "image": null
 },
 "Side Plank": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": "Plank/0.jpg"
 },
 "Single Arm Cable Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "cable",
  "image": null
 },
 "Single Arm Dumbbell Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Single Leg Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "bodyweight",
  "image": "Calf_Raises_-_With_Bands/0.jpg"
 },
 "Single Leg Glute Bridge": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "bodyweight",
  "image": "Single_Leg_Glute_Bridge/0.jpg"
 },
 "Single Leg Hip Hinge": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Single Leg Hip Thrust": {
  "group": "glutes",
  "primary": [
   "Glutes"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Single Leg RDL": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Single Leg Romanian Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "barbell",
  "image": "Romanian_Deadlift/0.jpg"
 },
 "Skull Crusher": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Skullcrusher": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Sled Pull": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "other",
  "image": null
 },
 "Sled Push": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "other",
  "image": "Sled_Push/0.jpg"
 },
 "Smith Machine Bulgarian Split Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "machine",
  "image": null
 },
 "Smith Machine Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "machine",
  "image": null
 },
 "Snatch": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Shoulders"
  ],
  "secondary": [
   "Glutes",
   "Traps"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Snatch/0.jpg"
 },
 "Spider Curl": {
  "group": "biceps",
  "primary": [
   "Biceps"
  ],
  "secondary": [
   "Forearms"
  ],
  "regions": [
   "biceps",
   "forearms-b",
   "forearms-f"
  ],
  "equipment": "dumbbell",
  "image": "Spider_Curl/0.jpg"
 },
 "Split Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": "Split_Squats/0.jpg"
 },
 "Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors",
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": "Squat_with_Bands/0.jpg"
 },
 "Squat Jump": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Standing Calf Raise": {
  "group": "calves",
  "primary": [
   "Calves"
  ],
  "secondary": [],
  "regions": [
   "calves-b",
   "calves-f"
  ],
  "equipment": "bodyweight",
  "image": "Standing_Calf_Raises/0.jpg"
 },
 "Step Up": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Stiff Leg Deadlift": {
  "group": "legs",
  "primary": [
   "Hamstrings",
   "Glutes"
  ],
  "secondary": [
   "Lower Back"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Straight Arm Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [],
  "regions": [
   "lats"
  ],
  "equipment": "cable",
  "image": "Straight-Arm_Pulldown/0.jpg"
 },
 "Sumo Deadlift": {
  "group": "glutes",
  "primary": [
   "Glutes",
   "Hamstrings",
   "Quadriceps"
  ],
  "secondary": [
   "Lower Back",
   "Traps"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "lower-back",
   "quads",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Sumo_Deadlift/0.jpg"
 },
 "Sumo Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes",
   "Adductors"
  ],
  "secondary": [
   "Hamstrings"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Superman Hold": {
  "group": "back",
  "primary": [
   "Lower Back"
  ],
  "secondary": [
   "Glutes"
  ],
  "regions": [
   "glutes",
   "lower-back"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "T-Bar Row": {
  "group": "back",
  "primary": [
   "Lats",
   "Middle Back"
  ],
  "secondary": [
   "Biceps",
   "Rear Delt"
  ],
  "regions": [
   "biceps",
   "lats",
   "rear-delts"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Thruster": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Shoulders"
  ],
  "secondary": [
   "Glutes",
   "Triceps"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Toes to Bar": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [
   "Hip Flexors"
  ],
  "regions": [
   "abs",
   "hip-flexors"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Trap Bar Deadlift": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes",
   "Hamstrings"
  ],
  "secondary": [
   "Traps",
   "Lower Back",
   "Forearms"
  ],
  "regions": [
   "forearms-b",
   "forearms-f",
   "glutes",
   "hamstrings",
   "lower-back",
   "quads",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Trap_Bar_Deadlift/0.jpg"
 },
 "Tricep Dip": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest",
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Tricep Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Tricep Kickback": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Tricep Overhead Extension": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Tricep Push Up": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [
   "Chest",
   "Shoulders"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Tricep Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": "Triceps_Pushdown/0.jpg"
 },
 "Tricep Rope Pushdown": {
  "group": "triceps",
  "primary": [
   "Triceps"
  ],
  "secondary": [],
  "regions": [
   "triceps"
  ],
  "equipment": "cable",
  "image": null
 },
 "Upright Row": {
  "group": "shoulders",
  "primary": [
   "Shoulders",
   "Traps"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "shoulders-f",
   "traps"
  ],
  "equipment": "barbell",
  "image": "Upright_Row_-_With_Bands/0.jpg"
 },
 "Walking Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Wall Ball": {
  "group": "full_body",
  "primary": [
   "Quadriceps",
   "Shoulders"
  ],
  "secondary": [
   "Glutes"
  ],
  "regions": [
   "glutes",
   "quads",
   "shoulders-f"
  ],
  "equipment": "other",
  "image": null
 },
 "Wall Sit": {
  "group": "legs",
  "primary": [
   "Quadriceps"
  ],
  "secondary": [
   "Glutes"
  ],
  "regions": [
   "glutes",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Weighted Crunch": {
  "group": "core",
  "primary": [
   "Abdominals"
  ],
  "secondary": [],
  "regions": [
   "abs"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Weighted Lunge": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Weighted Pull Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Weighted_Pull_Ups/0.jpg"
 },
 "Weighted Pull-Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Weighted_Pull_Ups/0.jpg"
 },
 "Wide Grip Lat Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "cable",
  "image": "Wide-Grip_Lat_Pulldown/0.jpg"
 },
 "Wide Grip Pull Up": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "bodyweight",
  "image": "Pullups/0.jpg"
 },
 "Wide Grip Pulldown": {
  "group": "back",
  "primary": [
   "Lats"
  ],
  "secondary": [
   "Biceps"
  ],
  "regions": [
   "biceps",
   "lats"
  ],
  "equipment": "cable",
  "image": null
 },
 "Wide Push Up": {
  "group": "chest",
  "primary": [
   "Chest"
  ],
  "secondary": [
   "Shoulders",
   "Triceps"
  ],
  "regions": [
   "chest",
   "shoulders-f",
   "triceps"
  ],
  "equipment": "bodyweight",
  "image": "Pushups/0.jpg"
 },
 "Air Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Adductors"
  ],
  "regions": [
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Assisted Pistol Squat": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Pistol Squat Progression": {
  "group": "legs",
  "primary": [
   "Quadriceps",
   "Glutes"
  ],
  "secondary": [
   "Hamstrings",
   "Calves"
  ],
  "regions": [
   "calves-b",
   "calves-f",
   "glutes",
   "hamstrings",
   "quads"
  ],
  "equipment": "bodyweight",
  "image": null
 },
 "Dumbbell Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 },
 "Seated Barbell Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "barbell",
  "image": null
 },
 "Seated Dumbbell Press": {
  "group": "shoulders",
  "primary": [
   "Shoulders"
  ],
  "secondary": [
   "Triceps"
  ],
  "regions": [
   "shoulders-f",
   "triceps"
  ],
  "equipment": "dumbbell",
  "image": null
 }
};

const _norm = (s) => (s || "").toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const _IDX = {};
for (const k in CANONICAL_EXERCISE_DATA) _IDX[_norm(k)] = k;

export function getCanonicalExerciseData(name) {
  if (!name) return null;
  if (CANONICAL_EXERCISE_DATA[name]) return CANONICAL_EXERCISE_DATA[name];
  const n = _norm(name);
  if (_IDX[n]) return CANONICAL_EXERCISE_DATA[_IDX[n]];
  return null;
}
export function getCanonicalMuscleGroup(name) { const d = getCanonicalExerciseData(name); return d ? d.group : null; }
export function getCanonicalEquipment(name) { const d = getCanonicalExerciseData(name); return d ? d.equipment : null; }
export function getCanonicalImageUrl(name) { const d = getCanonicalExerciseData(name); return d && d.image ? `${FREE_DB_IMAGE_BASE}/${d.image}` : null; }
