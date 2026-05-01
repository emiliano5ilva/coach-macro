// ─── EXERCISE DATABASE — Equipment Alternatives ────────────────────────────────
// Every movement has alternatives for every equipment setup
// So no user ever hits a dead end

export const EQUIPMENT_ALTERNATIVES = {
  // ── CHEST ──────────────────────────────────────────────────────────────────
  "Barbell Bench Press": {
    "Full Gym":       "Barbell Bench Press",
    "Home Gym":       "Barbell Bench Press",
    "Dumbbells Only": "Dumbbell Bench Press",
    "Bodyweight Only":"Push Up",
    "Cables Only":    "Cable Chest Press",
    "Machines Only":  "Chest Press Machine"
  },
  "Incline Dumbbell Press": {
    "Full Gym":       "Incline Dumbbell Press",
    "Home Gym":       "Incline Dumbbell Press",
    "Dumbbells Only": "Incline Dumbbell Press",
    "Bodyweight Only":"Decline Push Up",
    "Cables Only":    "High Cable Fly",
    "Machines Only":  "Incline Chest Press Machine"
  },
  "Incline Barbell Press": {
    "Full Gym":       "Incline Barbell Press",
    "Home Gym":       "Incline Barbell Press",
    "Dumbbells Only": "Incline Dumbbell Press",
    "Bodyweight Only":"Decline Push Up",
    "Cables Only":    "High Cable Fly",
    "Machines Only":  "Incline Chest Press Machine"
  },
  "Decline Barbell Press": {
    "Full Gym":       "Decline Barbell Press",
    "Home Gym":       "Decline Barbell Press",
    "Dumbbells Only": "Decline Dumbbell Press",
    "Bodyweight Only":"Feet Elevated Push Up",
    "Cables Only":    "Low Cable Fly",
    "Machines Only":  "Chest Press Machine"
  },
  "Cable Fly": {
    "Full Gym":       "Cable Fly",
    "Home Gym":       "Dumbbell Fly",
    "Dumbbells Only": "Dumbbell Fly",
    "Bodyweight Only":"Push Up Plus",
    "Cables Only":    "Cable Fly",
    "Machines Only":  "Pec Deck Machine"
  },
  "Dumbbell Fly": {
    "Full Gym":       "Dumbbell Fly",
    "Home Gym":       "Dumbbell Fly",
    "Dumbbells Only": "Dumbbell Fly",
    "Bodyweight Only":"Push Up Plus",
    "Cables Only":    "Cable Fly",
    "Machines Only":  "Pec Deck Machine"
  },
  "Push Up": {
    "Full Gym":       "Push Up",
    "Home Gym":       "Push Up",
    "Dumbbells Only": "Push Up",
    "Bodyweight Only":"Push Up",
    "Cables Only":    "Push Up",
    "Machines Only":  "Push Up"
  },
  "Close Grip Bench Press": {
    "Full Gym":       "Close Grip Bench Press",
    "Home Gym":       "Close Grip Bench Press",
    "Dumbbells Only": "Dumbbell Tricep Press",
    "Bodyweight Only":"Diamond Push Up",
    "Cables Only":    "Cable Tricep Press",
    "Machines Only":  "Machine Tricep Press"
  },
  "Diamond Push Up": {
    "Full Gym":       "Diamond Push Up",
    "Home Gym":       "Diamond Push Up",
    "Dumbbells Only": "Diamond Push Up",
    "Bodyweight Only":"Diamond Push Up",
    "Cables Only":    "Diamond Push Up",
    "Machines Only":  "Diamond Push Up"
  },

  // ── BACK ───────────────────────────────────────────────────────────────────
  "Deadlift": {
    "Full Gym":       "Barbell Deadlift",
    "Home Gym":       "Barbell Deadlift",
    "Dumbbells Only": "Dumbbell Romanian Deadlift",
    "Bodyweight Only":"Single Leg Hip Hinge",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Romanian Deadlift"
  },
  "Barbell Row": {
    "Full Gym":       "Barbell Bent Over Row",
    "Home Gym":       "Barbell Bent Over Row",
    "Dumbbells Only": "Dumbbell Row",
    "Bodyweight Only":"Inverted Row",
    "Cables Only":    "Cable Row",
    "Machines Only":  "Machine Row"
  },
  "Pull Up": {
    "Full Gym":       "Pull Up",
    "Home Gym":       "Pull Up",
    "Dumbbells Only": "Dumbbell Pullover",
    "Bodyweight Only":"Pull Up",
    "Cables Only":    "Lat Pulldown",
    "Machines Only":  "Machine Lat Pulldown"
  },
  "Wide Grip Pull Up": {
    "Full Gym":       "Wide Grip Pull Up",
    "Home Gym":       "Wide Grip Pull Up",
    "Dumbbells Only": "Dumbbell Pullover",
    "Bodyweight Only":"Wide Grip Pull Up",
    "Cables Only":    "Wide Grip Lat Pulldown",
    "Machines Only":  "Machine Lat Pulldown"
  },
  "Lat Pulldown": {
    "Full Gym":       "Lat Pulldown",
    "Home Gym":       "Pull Up",
    "Dumbbells Only": "Dumbbell Pullover",
    "Bodyweight Only":"Pull Up",
    "Cables Only":    "Lat Pulldown",
    "Machines Only":  "Machine Lat Pulldown"
  },
  "Cable Row": {
    "Full Gym":       "Seated Cable Row",
    "Home Gym":       "Barbell Row",
    "Dumbbells Only": "Dumbbell Row",
    "Bodyweight Only":"Inverted Row",
    "Cables Only":    "Seated Cable Row",
    "Machines Only":  "Machine Row"
  },
  "Dumbbell Row": {
    "Full Gym":       "Dumbbell Row",
    "Home Gym":       "Dumbbell Row",
    "Dumbbells Only": "Dumbbell Row",
    "Bodyweight Only":"Inverted Row",
    "Cables Only":    "Cable Row",
    "Machines Only":  "Machine Row"
  },
  "Face Pull": {
    "Full Gym":       "Cable Face Pull",
    "Home Gym":       "Band Face Pull",
    "Dumbbells Only": "Dumbbell Rear Delt Fly",
    "Bodyweight Only":"Band Face Pull",
    "Cables Only":    "Cable Face Pull",
    "Machines Only":  "Machine Rear Delt"
  },
  "Inverted Row": {
    "Full Gym":       "Inverted Row",
    "Home Gym":       "Inverted Row",
    "Dumbbells Only": "Inverted Row",
    "Bodyweight Only":"Inverted Row",
    "Cables Only":    "Cable Row",
    "Machines Only":  "Machine Row"
  },

  // ── SHOULDERS ──────────────────────────────────────────────────────────────
  "Overhead Press": {
    "Full Gym":       "Barbell Overhead Press",
    "Home Gym":       "Barbell Overhead Press",
    "Dumbbells Only": "Dumbbell Shoulder Press",
    "Bodyweight Only":"Pike Push Up",
    "Cables Only":    "Cable Overhead Press",
    "Machines Only":  "Machine Shoulder Press"
  },
  "Arnold Press": {
    "Full Gym":       "Arnold Press",
    "Home Gym":       "Arnold Press",
    "Dumbbells Only": "Arnold Press",
    "Bodyweight Only":"Pike Push Up",
    "Cables Only":    "Cable Shoulder Press",
    "Machines Only":  "Machine Shoulder Press"
  },
  "Dumbbell Shoulder Press": {
    "Full Gym":       "Dumbbell Shoulder Press",
    "Home Gym":       "Dumbbell Shoulder Press",
    "Dumbbells Only": "Dumbbell Shoulder Press",
    "Bodyweight Only":"Pike Push Up",
    "Cables Only":    "Cable Shoulder Press",
    "Machines Only":  "Machine Shoulder Press"
  },
  "Lateral Raise": {
    "Full Gym":       "Dumbbell Lateral Raise",
    "Home Gym":       "Dumbbell Lateral Raise",
    "Dumbbells Only": "Dumbbell Lateral Raise",
    "Bodyweight Only":"Band Lateral Raise",
    "Cables Only":    "Cable Lateral Raise",
    "Machines Only":  "Machine Lateral Raise"
  },
  "Rear Delt Fly": {
    "Full Gym":       "Dumbbell Rear Delt Fly",
    "Home Gym":       "Dumbbell Rear Delt Fly",
    "Dumbbells Only": "Dumbbell Rear Delt Fly",
    "Bodyweight Only":"Band Rear Delt Fly",
    "Cables Only":    "Cable Rear Delt Fly",
    "Machines Only":  "Machine Rear Delt"
  },
  "Shrug": {
    "Full Gym":       "Barbell Shrug",
    "Home Gym":       "Barbell Shrug",
    "Dumbbells Only": "Dumbbell Shrug",
    "Bodyweight Only":"Bodyweight Shrug",
    "Cables Only":    "Cable Shrug",
    "Machines Only":  "Machine Shrug"
  },

  // ── ARMS ───────────────────────────────────────────────────────────────────
  "Barbell Curl": {
    "Full Gym":       "Barbell Curl",
    "Home Gym":       "Barbell Curl",
    "Dumbbells Only": "Dumbbell Curl",
    "Bodyweight Only":"Inverted Curl",
    "Cables Only":    "Cable Curl",
    "Machines Only":  "Machine Curl"
  },
  "Hammer Curl": {
    "Full Gym":       "Dumbbell Hammer Curl",
    "Home Gym":       "Dumbbell Hammer Curl",
    "Dumbbells Only": "Dumbbell Hammer Curl",
    "Bodyweight Only":"Neutral Grip Pull Up",
    "Cables Only":    "Cable Hammer Curl",
    "Machines Only":  "Machine Hammer Curl"
  },
  "Incline Dumbbell Curl": {
    "Full Gym":       "Incline Dumbbell Curl",
    "Home Gym":       "Incline Dumbbell Curl",
    "Dumbbells Only": "Incline Dumbbell Curl",
    "Bodyweight Only":"Chin Up",
    "Cables Only":    "Cable Curl",
    "Machines Only":  "Machine Curl"
  },
  "Concentration Curl": {
    "Full Gym":       "Concentration Curl",
    "Home Gym":       "Concentration Curl",
    "Dumbbells Only": "Concentration Curl",
    "Bodyweight Only":"Chin Up",
    "Cables Only":    "Cable Curl",
    "Machines Only":  "Machine Curl"
  },
  "Cable Curl": {
    "Full Gym":       "Cable Curl",
    "Home Gym":       "Dumbbell Curl",
    "Dumbbells Only": "Dumbbell Curl",
    "Bodyweight Only":"Chin Up",
    "Cables Only":    "Cable Curl",
    "Machines Only":  "Machine Curl"
  },
  "Skull Crusher": {
    "Full Gym":       "EZ Bar Skull Crusher",
    "Home Gym":       "Barbell Skull Crusher",
    "Dumbbells Only": "Dumbbell Skull Crusher",
    "Bodyweight Only":"Diamond Push Up",
    "Cables Only":    "Cable Overhead Tricep Extension",
    "Machines Only":  "Machine Tricep Extension"
  },
  "Tricep Pushdown": {
    "Full Gym":       "Cable Tricep Pushdown",
    "Home Gym":       "Band Tricep Pushdown",
    "Dumbbells Only": "Dumbbell Overhead Tricep Extension",
    "Bodyweight Only":"Diamond Push Up",
    "Cables Only":    "Cable Tricep Pushdown",
    "Machines Only":  "Machine Tricep Extension"
  },
  "Overhead Tricep Extension": {
    "Full Gym":       "EZ Bar Overhead Tricep Extension",
    "Home Gym":       "Barbell Overhead Tricep Extension",
    "Dumbbells Only": "Dumbbell Overhead Tricep Extension",
    "Bodyweight Only":"Diamond Push Up",
    "Cables Only":    "Cable Overhead Tricep Extension",
    "Machines Only":  "Machine Tricep Extension"
  },

  // ── LEGS ───────────────────────────────────────────────────────────────────
  "Barbell Squat": {
    "Full Gym":       "Barbell Squat",
    "Home Gym":       "Barbell Squat",
    "Dumbbells Only": "Goblet Squat",
    "Bodyweight Only":"Bulgarian Split Squat",
    "Cables Only":    "Cable Squat",
    "Machines Only":  "Leg Press"
  },
  "Hack Squat": {
    "Full Gym":       "Hack Squat",
    "Home Gym":       "Barbell Squat",
    "Dumbbells Only": "Dumbbell Goblet Squat",
    "Bodyweight Only":"Bodyweight Squat",
    "Cables Only":    "Cable Squat",
    "Machines Only":  "Hack Squat Machine"
  },
  "Romanian Deadlift": {
    "Full Gym":       "Barbell Romanian Deadlift",
    "Home Gym":       "Barbell Romanian Deadlift",
    "Dumbbells Only": "Dumbbell Romanian Deadlift",
    "Bodyweight Only":"Single Leg Romanian Deadlift",
    "Cables Only":    "Cable Romanian Deadlift",
    "Machines Only":  "Machine Romanian Deadlift"
  },
  "Leg Press": {
    "Full Gym":       "Leg Press",
    "Home Gym":       "Barbell Squat",
    "Dumbbells Only": "Goblet Squat",
    "Bodyweight Only":"Step Up",
    "Cables Only":    "Cable Squat",
    "Machines Only":  "Leg Press Machine"
  },
  "Walking Lunge": {
    "Full Gym":       "Walking Lunge",
    "Home Gym":       "Walking Lunge",
    "Dumbbells Only": "Dumbbell Walking Lunge",
    "Bodyweight Only":"Walking Lunge",
    "Cables Only":    "Cable Lunge",
    "Machines Only":  "Smith Machine Lunge"
  },
  "Bulgarian Split Squat": {
    "Full Gym":       "Bulgarian Split Squat",
    "Home Gym":       "Bulgarian Split Squat",
    "Dumbbells Only": "Dumbbell Bulgarian Split Squat",
    "Bodyweight Only":"Bulgarian Split Squat",
    "Cables Only":    "Cable Bulgarian Split Squat",
    "Machines Only":  "Smith Machine Bulgarian Split Squat"
  },
  "Leg Curl": {
    "Full Gym":       "Machine Leg Curl",
    "Home Gym":       "Nordic Curl",
    "Dumbbells Only": "Dumbbell Leg Curl",
    "Bodyweight Only":"Nordic Curl",
    "Cables Only":    "Cable Leg Curl",
    "Machines Only":  "Leg Curl Machine"
  },
  "Leg Extension": {
    "Full Gym":       "Machine Leg Extension",
    "Home Gym":       "Dumbbell Leg Extension",
    "Dumbbells Only": "Dumbbell Leg Extension",
    "Bodyweight Only":"Wall Sit",
    "Cables Only":    "Cable Leg Extension",
    "Machines Only":  "Leg Extension Machine"
  },
  "Calf Raise": {
    "Full Gym":       "Standing Calf Raise",
    "Home Gym":       "Standing Calf Raise",
    "Dumbbells Only": "Dumbbell Calf Raise",
    "Bodyweight Only":"Bodyweight Calf Raise",
    "Cables Only":    "Cable Calf Raise",
    "Machines Only":  "Calf Raise Machine"
  },

  // ── CORE ───────────────────────────────────────────────────────────────────
  "Ab Wheel Rollout": {
    "Full Gym":       "Ab Wheel Rollout",
    "Home Gym":       "Ab Wheel Rollout",
    "Dumbbells Only": "Dumbbell Rollout",
    "Bodyweight Only":"Plank",
    "Cables Only":    "Cable Crunch",
    "Machines Only":  "Machine Ab Crunch"
  },
  "Hanging Leg Raise": {
    "Full Gym":       "Hanging Leg Raise",
    "Home Gym":       "Hanging Leg Raise",
    "Dumbbells Only": "Lying Leg Raise",
    "Bodyweight Only":"Lying Leg Raise",
    "Cables Only":    "Cable Crunch",
    "Machines Only":  "Machine Ab Crunch"
  },
  "Cable Crunch": {
    "Full Gym":       "Cable Crunch",
    "Home Gym":       "Decline Crunch",
    "Dumbbells Only": "Weighted Crunch",
    "Bodyweight Only":"Crunch",
    "Cables Only":    "Cable Crunch",
    "Machines Only":  "Machine Ab Crunch"
  },
  "Plank": {
    "Full Gym":       "Plank",
    "Home Gym":       "Plank",
    "Dumbbells Only": "Plank",
    "Bodyweight Only":"Plank",
    "Cables Only":    "Plank",
    "Machines Only":  "Plank"
  },

  // ── HYROX SPECIFIC ─────────────────────────────────────────────────────────
  "Farmers Carry": {
    "Full Gym":       "Farmers Carry",
    "Home Gym":       "Dumbbell Farmers Carry",
    "Dumbbells Only": "Dumbbell Farmers Carry",
    "Bodyweight Only":"Loaded March",
    "Cables Only":    "Dumbbell Farmers Carry",
    "Machines Only":  "Dumbbell Farmers Carry"
  },
  "Sandbag Lunge": {
    "Full Gym":       "Sandbag Lunge",
    "Home Gym":       "Barbell Lunge",
    "Dumbbells Only": "Dumbbell Lunge",
    "Bodyweight Only":"Walking Lunge",
    "Cables Only":    "Dumbbell Lunge",
    "Machines Only":  "Smith Machine Lunge"
  },
  "Wall Ball": {
    "Full Gym":       "Wall Ball",
    "Home Gym":       "Dumbbell Thruster",
    "Dumbbells Only": "Dumbbell Thruster",
    "Bodyweight Only":"Squat Jump",
    "Cables Only":    "Dumbbell Thruster",
    "Machines Only":  "Dumbbell Thruster"
  },
  "Sled Push": {
    "Full Gym":       "Sled Push",
    "Home Gym":       "Prowler Push",
    "Dumbbells Only": "Heavy Dumbbell Carry",
    "Bodyweight Only":"Sprint",
    "Cables Only":    "Heavy Dumbbell Carry",
    "Machines Only":  "Heavy Dumbbell Carry"
  },
  "Burpee Broad Jump": {
    "Full Gym":       "Burpee Broad Jump",
    "Home Gym":       "Burpee Broad Jump",
    "Dumbbells Only": "Burpee Broad Jump",
    "Bodyweight Only":"Burpee Broad Jump",
    "Cables Only":    "Burpee Broad Jump",
    "Machines Only":  "Burpee Broad Jump"
  }
};

export function getEquipmentExercise(exerciseName, equipment) {
  const alternatives = EQUIPMENT_ALTERNATIVES[exerciseName];
  if(!alternatives) return exerciseName;
  return alternatives[equipment] || alternatives["Full Gym"] || exerciseName;
}

export function applyEquipmentToWorkout(exercises, equipment) {
  return exercises.map(ex=>({
    ...ex,
    name: getEquipmentExercise(ex.name, equipment),
    originalName: ex.name
  }));
}
