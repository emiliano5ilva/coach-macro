// ─── EXERCISE DATABASE — Equipment Alternatives ────────────────────────────────
// Every movement has alternatives for every equipment setup
// So no user ever hits a dead end

import { stripSupersetLabel, resolveAlias } from './data/exerciseNames.js';
import { getCanonicalMuscleGroup, getCanonicalEquipment, getCanonicalExerciseData } from './data/canonicalExerciseData';

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
  },

  // ── GLUTE & LOWER BODY ────────────────────────────────────────────────────
  "Barbell Hip Thrust": {
    "Full Gym":       "Barbell Hip Thrust",
    "Home Gym":       "Barbell Hip Thrust",
    "Dumbbells Only": "Dumbbell Hip Thrust",
    "Bodyweight Only":"Glute Bridge",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Hip Thrust"
  },
  "Cable Kickback": {
    "Full Gym":       "Cable Kickback",
    "Home Gym":       "Band Kickback",
    "Dumbbells Only": "Band Kickback",
    "Bodyweight Only":"Donkey Kick",
    "Cables Only":    "Cable Kickback",
    "Machines Only":  "Machine Kickback"
  },
  "Lateral Band Walk": {
    "Full Gym":       "Lateral Band Walk",
    "Home Gym":       "Lateral Band Walk",
    "Dumbbells Only": "Lateral Band Walk",
    "Bodyweight Only":"Lateral Band Walk",
    "Cables Only":    "Lateral Band Walk",
    "Machines Only":  "Lateral Band Walk"
  },
  "Sumo Deadlift": {
    "Full Gym":       "Barbell Sumo Deadlift",
    "Home Gym":       "Barbell Sumo Deadlift",
    "Dumbbells Only": "Dumbbell Sumo Deadlift",
    "Bodyweight Only":"Sumo Squat",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Romanian Deadlift"
  },
  "Hip Thrust Pulse": {
    "Full Gym":       "Barbell Hip Thrust Pulse",
    "Home Gym":       "Glute Bridge Pulse",
    "Dumbbells Only": "Glute Bridge Pulse",
    "Bodyweight Only":"Glute Bridge Pulse",
    "Cables Only":    "Glute Bridge Pulse",
    "Machines Only":  "Machine Hip Thrust Pulse"
  },
  "Good Morning": {
    "Full Gym":       "Barbell Good Morning",
    "Home Gym":       "Barbell Good Morning",
    "Dumbbells Only": "Dumbbell Good Morning",
    "Bodyweight Only":"Bodyweight Good Morning",
    "Cables Only":    "Cable Good Morning",
    "Machines Only":  "Dumbbell Good Morning"
  },
  "Curtsy Lunge": {
    "Full Gym":       "Curtsy Lunge",
    "Home Gym":       "Curtsy Lunge",
    "Dumbbells Only": "Dumbbell Curtsy Lunge",
    "Bodyweight Only":"Curtsy Lunge",
    "Cables Only":    "Cable Curtsy Lunge",
    "Machines Only":  "Curtsy Lunge"
  },
  "Donkey Kick": {
    "Full Gym":       "Cable Donkey Kick",
    "Home Gym":       "Band Donkey Kick",
    "Dumbbells Only": "Band Donkey Kick",
    "Bodyweight Only":"Donkey Kick",
    "Cables Only":    "Cable Donkey Kick",
    "Machines Only":  "Machine Donkey Kick"
  },
  "Cable Pull Through": {
    "Full Gym":       "Cable Pull Through",
    "Home Gym":       "Band Pull Through",
    "Dumbbells Only": "Dumbbell Romanian Deadlift",
    "Bodyweight Only":"Bodyweight Hip Hinge",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Pull Through"
  },
  "Nordic Curl": {
    "Full Gym":       "Nordic Curl",
    "Home Gym":       "Nordic Curl",
    "Dumbbells Only": "Dumbbell Leg Curl",
    "Bodyweight Only":"Nordic Curl",
    "Cables Only":    "Cable Leg Curl",
    "Machines Only":  "Leg Curl Machine"
  },
  "Clamshell": {
    "Full Gym":       "Clamshell",
    "Home Gym":       "Clamshell",
    "Dumbbells Only": "Clamshell",
    "Bodyweight Only":"Clamshell",
    "Cables Only":    "Clamshell",
    "Machines Only":  "Clamshell"
  },
  "Glute Bridge": {
    "Full Gym":       "Glute Bridge",
    "Home Gym":       "Glute Bridge",
    "Dumbbells Only": "Glute Bridge",
    "Bodyweight Only":"Glute Bridge",
    "Cables Only":    "Glute Bridge",
    "Machines Only":  "Machine Hip Thrust"
  },
  "Sumo Squat": {
    "Full Gym":       "Barbell Sumo Squat",
    "Home Gym":       "Barbell Sumo Squat",
    "Dumbbells Only": "Dumbbell Sumo Squat",
    "Bodyweight Only":"Sumo Squat",
    "Cables Only":    "Cable Sumo Squat",
    "Machines Only":  "Leg Press"
  },

  // ── COMMIT 1: FULL GYM + DUMBBELL ADDITIONS ──────────────────────────────
  "Seated Calf Raise": {
    "Full Gym":       "Seated Calf Raise",
    "Home Gym":       "Calf Raise",
    "Dumbbells Only": "Single Leg Calf Raise",
    "Bodyweight Only":"Single Leg Calf Raise",
    "Cables Only":    "Calf Raise",
    "Machines Only":  "Seated Calf Raise"
  },
  "Chest Dip": {
    "Full Gym":       "Chest Dip",
    "Home Gym":       "Chest Dip",
    "Dumbbells Only": "Dumbbell Bench Press",
    "Bodyweight Only":"Wide Push Up",
    "Cables Only":    "Cable Fly",
    "Machines Only":  "Pec Deck Machine"
  },
  "Trap Bar Deadlift": {
    "Full Gym":       "Trap Bar Deadlift",
    "Home Gym":       "Deadlift",
    "Dumbbells Only": "Dumbbell Deadlift",
    "Bodyweight Only":"Single Leg Romanian Deadlift",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Leg Press"
  },
  "Goblet Squat": {
    "Full Gym":       "Goblet Squat",
    "Home Gym":       "Goblet Squat",
    "Dumbbells Only": "Goblet Squat",
    "Bodyweight Only":"Bulgarian Split Squat",
    "Cables Only":    "Goblet Squat",
    "Machines Only":  "Hack Squat"
  },
  "Dumbbell Deadlift": {
    "Full Gym":       "Deadlift",
    "Home Gym":       "Dumbbell Deadlift",
    "Dumbbells Only": "Dumbbell Deadlift",
    "Bodyweight Only":"Single Leg Romanian Deadlift",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Leg Press"
  },
  "Dumbbell Hip Thrust": {
    "Full Gym":       "Barbell Hip Thrust",
    "Home Gym":       "Dumbbell Hip Thrust",
    "Dumbbells Only": "Dumbbell Hip Thrust",
    "Bodyweight Only":"Glute Bridge",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Hip Thrust"
  },
  "Floor Press": {
    "Full Gym":       "Barbell Bench Press",
    "Home Gym":       "Floor Press",
    "Dumbbells Only": "Floor Press",
    "Bodyweight Only":"Push Up",
    "Cables Only":    "Cable Fly",
    "Machines Only":  "Chest Press Machine"
  },
  "Single Leg Romanian Deadlift": {
    "Full Gym":       "Romanian Deadlift",
    "Home Gym":       "Single Leg Romanian Deadlift",
    "Dumbbells Only": "Single Leg Romanian Deadlift",
    "Bodyweight Only":"Single Leg Romanian Deadlift",
    "Cables Only":    "Cable Romanian Deadlift",
    "Machines Only":  "Romanian Deadlift"
  },
  "Dumbbell Step Up": {
    "Full Gym":       "Barbell Squat",
    "Home Gym":       "Dumbbell Step Up",
    "Dumbbells Only": "Dumbbell Step Up",
    "Bodyweight Only":"Bodyweight Step Up",
    "Cables Only":    "Dumbbell Step Up",
    "Machines Only":  "Leg Press"
  },
  "Dumbbell Lunge": {
    "Full Gym":       "Walking Lunge",
    "Home Gym":       "Dumbbell Lunge",
    "Dumbbells Only": "Dumbbell Lunge",
    "Bodyweight Only":"Walking Lunge",
    "Cables Only":    "Dumbbell Lunge",
    "Machines Only":  "Leg Press"
  },
  "Single Leg Calf Raise": {
    "Full Gym":       "Single Leg Calf Raise",
    "Home Gym":       "Single Leg Calf Raise",
    "Dumbbells Only": "Single Leg Calf Raise",
    "Bodyweight Only":"Single Leg Calf Raise",
    "Cables Only":    "Single Leg Calf Raise",
    "Machines Only":  "Seated Calf Raise"
  },

  // ── COMMIT 2: BODYWEIGHT ADDITIONS ─────────────────────────────────────────
  "Glute Bridge": {
    "Full Gym":       "Barbell Hip Thrust",
    "Home Gym":       "Glute Bridge",
    "Dumbbells Only": "Dumbbell Hip Thrust",
    "Bodyweight Only":"Glute Bridge",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Hip Thrust"
  },
  "Single Leg Glute Bridge": {
    "Full Gym":       "Single Leg Hip Thrust",
    "Home Gym":       "Single Leg Glute Bridge",
    "Dumbbells Only": "Single Leg Glute Bridge",
    "Bodyweight Only":"Single Leg Glute Bridge",
    "Cables Only":    "Cable Kickback",
    "Machines Only":  "Machine Kickback"
  },
  "Pike Push Up": {
    "Full Gym":       "Overhead Press",
    "Home Gym":       "Pike Push Up",
    "Dumbbells Only": "Dumbbell Shoulder Press",
    "Bodyweight Only":"Pike Push Up",
    "Cables Only":    "Cable Shoulder Press",
    "Machines Only":  "Machine Shoulder Press"
  },
  "Inverted Row": {
    "Full Gym":       "Barbell Row",
    "Home Gym":       "Inverted Row",
    "Dumbbells Only": "Dumbbell Row",
    "Bodyweight Only":"Inverted Row",
    "Cables Only":    "Cable Row",
    "Machines Only":  "Machine Row"
  },
  "Tricep Dip": {
    "Full Gym":       "Close Grip Bench Press",
    "Home Gym":       "Tricep Dip",
    "Dumbbells Only": "Overhead Tricep Extension",
    "Bodyweight Only":"Tricep Dip",
    "Cables Only":    "Tricep Pushdown",
    "Machines Only":  "Machine Tricep Extension"
  },
  "Bodyweight Step Up": {
    "Full Gym":       "Barbell Squat",
    "Home Gym":       "Bodyweight Step Up",
    "Dumbbells Only": "Dumbbell Step Up",
    "Bodyweight Only":"Bodyweight Step Up",
    "Cables Only":    "Dumbbell Step Up",
    "Machines Only":  "Leg Press"
  },
  "Assisted Pistol Squat": {
    "Full Gym":       "Bulgarian Split Squat",
    "Home Gym":       "Assisted Pistol Squat",
    "Dumbbells Only": "Bulgarian Split Squat",
    "Bodyweight Only":"Assisted Pistol Squat",
    "Cables Only":    "Bulgarian Split Squat",
    "Machines Only":  "Leg Press"
  },
  "Mountain Climber": {
    "Full Gym":       "Mountain Climber",
    "Home Gym":       "Mountain Climber",
    "Dumbbells Only": "Mountain Climber",
    "Bodyweight Only":"Mountain Climber",
    "Cables Only":    "Mountain Climber",
    "Machines Only":  "Mountain Climber"
  },
  "Superman Hold": {
    "Full Gym":       "Hyperextension",
    "Home Gym":       "Superman Hold",
    "Dumbbells Only": "Superman Hold",
    "Bodyweight Only":"Superman Hold",
    "Cables Only":    "Superman Hold",
    "Machines Only":  "Hyperextension"
  },
  "Bird Dog": {
    "Full Gym":       "Bird Dog",
    "Home Gym":       "Bird Dog",
    "Dumbbells Only": "Bird Dog",
    "Bodyweight Only":"Bird Dog",
    "Cables Only":    "Bird Dog",
    "Machines Only":  "Bird Dog"
  },
  "Burpee": {
    "Full Gym":       "Burpee",
    "Home Gym":       "Burpee",
    "Dumbbells Only": "Burpee",
    "Bodyweight Only":"Burpee",
    "Cables Only":    "Burpee",
    "Machines Only":  "Burpee"
  },
  "Bear Crawl": {
    "Full Gym":       "Bear Crawl",
    "Home Gym":       "Bear Crawl",
    "Dumbbells Only": "Bear Crawl",
    "Bodyweight Only":"Bear Crawl",
    "Cables Only":    "Bear Crawl",
    "Machines Only":  "Bear Crawl"
  },

  // ── COMMIT 3: RESISTANCE BAND + EXTRA ADDITIONS ───────────────────────────
  "Band Pull Apart": {
    "Full Gym":       "Face Pull",
    "Home Gym":       "Band Pull Apart",
    "Dumbbells Only": "Rear Delt Fly",
    "Bodyweight Only":"Band Pull Apart",
    "Cables Only":    "Cable Rear Delt Fly",
    "Machines Only":  "Machine Rear Delt"
  },
  "Band Face Pull": {
    "Full Gym":       "Face Pull",
    "Home Gym":       "Band Face Pull",
    "Dumbbells Only": "Rear Delt Fly",
    "Bodyweight Only":"Band Face Pull",
    "Cables Only":    "Face Pull",
    "Machines Only":  "Machine Rear Delt"
  },
  "Band Curl": {
    "Full Gym":       "Barbell Curl",
    "Home Gym":       "Band Curl",
    "Dumbbells Only": "Dumbbell Curl",
    "Bodyweight Only":"Band Curl",
    "Cables Only":    "Cable Curl",
    "Machines Only":  "Machine Curl"
  },
  "Band Tricep Pushdown": {
    "Full Gym":       "Tricep Pushdown",
    "Home Gym":       "Band Tricep Pushdown",
    "Dumbbells Only": "Overhead Tricep Extension",
    "Bodyweight Only":"Band Tricep Pushdown",
    "Cables Only":    "Tricep Pushdown",
    "Machines Only":  "Machine Tricep Extension"
  },
  "Band Squat": {
    "Full Gym":       "Barbell Squat",
    "Home Gym":       "Band Squat",
    "Dumbbells Only": "Goblet Squat",
    "Bodyweight Only":"Band Squat",
    "Cables Only":    "Goblet Squat",
    "Machines Only":  "Leg Press"
  },
  "Band Hip Thrust": {
    "Full Gym":       "Barbell Hip Thrust",
    "Home Gym":       "Band Hip Thrust",
    "Dumbbells Only": "Dumbbell Hip Thrust",
    "Bodyweight Only":"Band Hip Thrust",
    "Cables Only":    "Cable Pull Through",
    "Machines Only":  "Machine Hip Thrust"
  },
  "Band Row": {
    "Full Gym":       "Barbell Row",
    "Home Gym":       "Band Row",
    "Dumbbells Only": "Dumbbell Row",
    "Bodyweight Only":"Inverted Row",
    "Cables Only":    "Cable Row",
    "Machines Only":  "Machine Row"
  },
  "Band Lateral Walk": {
    "Full Gym":       "Hip Abduction Machine",
    "Home Gym":       "Band Lateral Walk",
    "Dumbbells Only": "Band Lateral Walk",
    "Bodyweight Only":"Band Lateral Walk",
    "Cables Only":    "Cable Kickback",
    "Machines Only":  "Hip Abduction Machine"
  },
  "Reverse Curl": {
    "Full Gym":       "Reverse Curl",
    "Home Gym":       "Reverse Curl",
    "Dumbbells Only": "Reverse Curl",
    "Bodyweight Only":"Reverse Curl",
    "Cables Only":    "Cable Reverse Curl",
    "Machines Only":  "Reverse Curl"
  },
  "Dumbbell Upright Row": {
    "Full Gym":       "Barbell Upright Row",
    "Home Gym":       "Dumbbell Upright Row",
    "Dumbbells Only": "Dumbbell Upright Row",
    "Bodyweight Only":"Band Upright Row",
    "Cables Only":    "Cable Upright Row",
    "Machines Only":  "Machine Lateral Raise"
  }
};

// Equipment compatibility: which canonical equipment tags each setup allows.
const EQUIP_COMPAT = {
  "Bodyweight Only": ["bodyweight"],
  "Dumbbells Only":  ["dumbbell","bodyweight"],
  "Home Gym":        ["barbell","dumbbell","bodyweight"],
  "Full Gym":        ["barbell","dumbbell","cable","machine","kettlebell","bands","bodyweight","other"],
};

function _canonRegions(name) {
  const d = getCanonicalExerciseData(name);
  return d && d.regions ? d.regions : [];
}

// Is this exercise doable with the given equipment setup?
function isEquipmentCompatible(name, equipment) {
  const key = EQUIP_KEY[equipment];
  const pool = key ? EQUIPMENT_POOLS[key] : null;
  // Pool membership = author-vetted compatible (e.g. bodyweight single-leg RDL).
  if (pool && (pool.includes(name) || pool.includes(stripSupersetLabel(name)))) return true;
  const allowed = EQUIP_COMPAT[equipment];
  if (!allowed) return true;                 // unknown setup -> don't block
  const eq = getCanonicalEquipment(name);
  if (!eq) return true;                      // unknown exercise -> don't block
  return allowed.includes(eq);
}

// Pick a same-group exercise from the setup's pool, preferring region overlap.
function substituteFromPool(name, equipment) {
  const key = EQUIP_KEY[equipment] || "full_gym";
  const pool = EQUIPMENT_POOLS[key] || [];
  if (!pool.length) return null;
  const grp = getMuscleGroup(name);
  const oReg = _canonRegions(name);
  let best = null, bestScore = -1;
  for (const p of pool) {
    const pGrp = getMuscleGroup(p);
    if (grp && pGrp && pGrp !== grp) continue;   // require same muscle group when both known
    const pReg = _canonRegions(p);
    const overlap = oReg.filter(r => pReg.includes(r)).length;
    const score = overlap * 10 + (pGrp === grp ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best || pool.find(p => getMuscleGroup(p) === grp) || pool[0];
}

export function getEquipmentExercise(exerciseName, equipment) {
  // Resolver chain: direct → superset-stripped → alias-resolved → passthrough
  const stripped = stripSupersetLabel(exerciseName);
  const aliased  = resolveAlias(exerciseName);
  const alternatives =
    EQUIPMENT_ALTERNATIVES[exerciseName]
    || EQUIPMENT_ALTERNATIVES[stripped]
    || (aliased ? EQUIPMENT_ALTERNATIVES[aliased] : null);
  let result = alternatives
    ? (alternatives[equipment] || alternatives["Full Gym"] || exerciseName)
    : exerciseName;
  // Guard: if the result still isn't doable with this equipment, substitute by muscle group.
  if (!isEquipmentCompatible(result, equipment)) {
    const sub = substituteFromPool(result, equipment);
    if (sub) result = sub;
  }
  return result;
}

export function applyEquipmentToWorkout(exercises, equipment) {
  return exercises.map(ex=>({
    ...ex,
    name: getEquipmentExercise(ex.name, equipment),
    originalName: ex.name
  }));
}

// ─── MUSCLE GROUP MAPPING ────────────────────────────────────────────────────
export const EXERCISE_MUSCLE_GROUP = {
  // CHEST
  "Barbell Bench Press":"chest","Incline Dumbbell Press":"chest","Incline Barbell Press":"chest",
  "Decline Barbell Press":"chest","Cable Fly":"chest","Dumbbell Fly":"chest","Push Up":"chest",
  "Chest Press Machine":"chest","Pec Deck Machine":"chest","Cable Crossover":"chest",
  "Low Cable Fly":"chest","High Cable Fly":"chest","Decline Dumbbell Press":"chest",
  "Dumbbell Bench Press":"chest","Cable Chest Press":"chest","Incline Fly":"chest",
  "Chest Dip":"chest","Push Up Plus":"chest","Feet Elevated Push Up":"chest","Decline Push Up":"chest",
  // BACK
  "Deadlift":"back","Barbell Row":"back","Pull Up":"back","Lat Pulldown":"back",
  "Cable Row":"back","T-Bar Row":"back","Single Arm Dumbbell Row":"back",
  "Chest-Supported Row":"back","Neutral Grip Pulldown":"back","Face Pull":"back",
  "Seated Cable Row":"back","Dumbbell Row":"back","Straight Arm Pulldown":"back",
  "Rack Pull":"back","Pendlay Row":"back",
  // SHOULDERS
  "Overhead Press":"shoulders","Dumbbell Shoulder Press":"shoulders",
  "Arnold Press":"shoulders","Lateral Raise":"shoulders","Cable Lateral Raise":"shoulders",
  "Front Raise":"shoulders","Reverse Fly":"shoulders","Upright Row":"shoulders",
  "DB Arnold Press":"shoulders","Machine Lateral Raise":"shoulders",
  "Dumbbell Lateral Raise":"shoulders","Rear Delt Fly":"shoulders",
  // LEGS
  "Barbell Squat":"legs","Romanian Deadlift":"legs","Leg Press":"legs",
  "Bulgarian Split Squat":"legs","Leg Extension":"legs","Seated Leg Curl":"legs",
  "Nordic Curl":"legs","Hack Squat":"legs","Goblet Squat":"legs","Lunge":"legs",
  "Leg Curl":"legs","Barbell Lunge":"legs","Walking Lunge":"legs",
  "Dumbbell Romanian Deadlift":"legs","Stiff Leg Deadlift":"legs",
  "Barbell Hack Squat":"legs","Dumbbell Lunge":"legs","Split Squat":"legs",
  // GLUTES
  "Hip Thrust":"glutes","Glute Bridge":"glutes","Cable Kickback":"glutes",
  "Abduction Machine":"glutes","Sumo Squat":"glutes","Clamshell":"glutes",
  "Barbell Sumo Squat":"glutes","Dumbbell Sumo Squat":"glutes","Machine Hip Thrust":"glutes",
  // BICEPS
  "Barbell Curl":"biceps","Dumbbell Curl":"biceps","Hammer Curl":"biceps",
  "Incline Dumbbell Curl":"biceps","Cable Curl":"biceps","EZ Bar Curl":"biceps",
  "Concentration Curl":"biceps","Preacher Curl":"biceps","Spider Curl":"biceps",
  // TRICEPS
  "Tricep Pushdown":"triceps","Skull Crusher":"triceps","Tricep Dip":"triceps",
  "Close Grip Bench Press":"triceps","Overhead Tricep Extension":"triceps",
  "Diamond Push Up":"triceps","Rope Pushdown":"triceps","Tricep Kickback":"triceps",
  // CORE
  "Ab Wheel Rollout":"core","Plank":"core","Cable Crunch":"core",
  "Hanging Leg Raise":"core","Russian Twist":"core","Bicycle Crunch":"core",
  "Hollow Hold":"core","Dead Bug":"core","Pallof Press":"core",
  // CALVES
  "Calf Raise":"calves","Seated Calf Raise":"calves","Standing Calf Raise":"calves",
  "Machine Calf Raise":"calves","Single Leg Calf Raise":"calves",
  // COMMIT 1: FULL GYM + DUMBBELL ADDITIONS
  "Barbell Hip Thrust":"glutes","Chest Dip":"chest","Trap Bar Deadlift":"back",
  "Goblet Squat":"legs","Dumbbell Deadlift":"back","Dumbbell Hip Thrust":"glutes",
  "Floor Press":"chest","Single Leg Romanian Deadlift":"legs",
  "Dumbbell Step Up":"legs","Dumbbell Lunge":"legs","Good Morning":"legs",
  // COMMIT 2: BODYWEIGHT ADDITIONS
  "Glute Bridge":"glutes","Single Leg Glute Bridge":"glutes","Pike Push Up":"shoulders",
  "Inverted Row":"back","Tricep Dip":"triceps","Bodyweight Step Up":"legs",
  "Assisted Pistol Squat":"legs","Mountain Climber":"core","Superman Hold":"back",
  "Bird Dog":"core","Burpee":"full_body","Bear Crawl":"core",
  // COMMIT 3: RESISTANCE BAND + EXTRA ADDITIONS
  "Band Pull Apart":"shoulders","Band Face Pull":"shoulders","Band Curl":"biceps",
  "Band Tricep Pushdown":"triceps","Band Squat":"legs","Band Hip Thrust":"glutes",
  "Band Row":"back","Band Lateral Walk":"glutes",
  "Reverse Curl":"biceps","Single Leg Calf Raise":"calves","Dumbbell Upright Row":"shoulders",
};

// Tolerant wrapper: try direct, then superset-stripped, then alias-resolved.
// Import and use this instead of direct EXERCISE_MUSCLE_GROUP[name] lookups.
export function getMuscleGroup(name) {
  if (!name) return null;
  return (
    EXERCISE_MUSCLE_GROUP[name]
    || EXERCISE_MUSCLE_GROUP[stripSupersetLabel(name)]
    || (resolveAlias(name) ? EXERCISE_MUSCLE_GROUP[resolveAlias(name)] : null)
    || getCanonicalMuscleGroup(name)
    || null
  );
}

export const MUSCLE_GROUP_POOL = {
  chest:["Barbell Bench Press","Incline Dumbbell Press","Dumbbell Bench Press","Incline Barbell Press","Cable Fly","Dumbbell Fly","Push Up","Chest Press Machine","Pec Deck Machine","Cable Crossover","Chest Dip","Decline Barbell Press","Floor Press"],
  back:["Deadlift","Barbell Row","Pull Up","Lat Pulldown","Cable Row","T-Bar Row","Single Arm Dumbbell Row","Chest-Supported Row","Neutral Grip Pulldown","Face Pull","Seated Cable Row","Rack Pull","Trap Bar Deadlift","Dumbbell Deadlift","Inverted Row","Superman Hold"],
  shoulders:["Overhead Press","Dumbbell Shoulder Press","Arnold Press","Lateral Raise","Cable Lateral Raise","Reverse Fly","Front Raise","Machine Lateral Raise","Upright Row","Pike Push Up"],
  legs:["Barbell Squat","Romanian Deadlift","Leg Press","Bulgarian Split Squat","Leg Extension","Seated Leg Curl","Nordic Curl","Hack Squat","Goblet Squat","Lunge","Walking Lunge","Dumbbell Lunge","Dumbbell Step Up","Single Leg Romanian Deadlift","Good Morning","Bodyweight Step Up","Assisted Pistol Squat"],
  glutes:["Hip Thrust","Barbell Hip Thrust","Glute Bridge","Single Leg Glute Bridge","Sumo Squat","Cable Kickback","Clamshell","Abduction Machine","Dumbbell Hip Thrust"],
  biceps:["Barbell Curl","Dumbbell Curl","Hammer Curl","EZ Bar Curl","Cable Curl","Incline Dumbbell Curl","Concentration Curl","Preacher Curl"],
  triceps:["Tricep Pushdown","Skull Crusher","Overhead Tricep Extension","Close Grip Bench Press","Tricep Dip","Diamond Push Up","Rope Pushdown"],
  core:["Ab Wheel Rollout","Plank","Cable Crunch","Hanging Leg Raise","Russian Twist","Hollow Hold","Dead Bug","Pallof Press","Mountain Climber","Bird Dog","Bear Crawl"],
  calves:["Calf Raise","Seated Calf Raise","Machine Calf Raise","Standing Calf Raise","Single Leg Calf Raise"],
  full_body:["Burpee","Farmers Carry","Kettlebell Swing","Thruster"],
  bands:["Band Squat","Band Hip Thrust","Band Row","Band Curl","Band Tricep Pushdown","Band Pull Apart","Band Face Pull","Band Lateral Walk"],
};

export function getSwapOptions(exerciseName, equipment="Full Gym", count=6) {
  const group=getMuscleGroup(exerciseName);
  if(!group)return[];
  const pool=MUSCLE_GROUP_POOL[group]||[];
  return pool
    .filter(n=>n!==exerciseName)
    .map(n=>({name:getEquipmentExercise(n,equipment),originalName:n,muscleGroup:group}))
    .slice(0,count);
}

// ─── EXERCISE DETAILS ────────────────────────────────────────────────────────
// Full coaching structure: setup, cue, breathe, mistake, feel, progression,
// tier, muscles, equipment, contraindications.
// Extends COACHING_CUES in ExerciseDetailModal for new exercises.
export const EXERCISE_DETAILS = {
  "Barbell Hip Thrust": {
    muscleGroup:"glutes", tier:"A",
    primaryMuscles:["glutes","hamstrings"], secondaryMuscles:["core","quads"],
    equipment:["barbell","bench"],
    setup:"Upper back on bench edge at shoulder-blade height. Barbell on hip crease with pad. Feet flat, shoulder-width, knees at 90° at top.",
    cue:"Drive hips up explosively. Squeeze glutes hard at the top. Full hip extension.",
    breathe:"Inhale at bottom. Brace core. Exhale as hips drive up.",
    mistake:"Not reaching full hip extension — get all the way up. Hips fully open at the top.",
    feel:"Deep glute contraction at lockout — not lower back.",
    progressionRule:"Add 10 lbs when all sets completed with full hip extension and a 1-sec pause at top.",
    deloadNote:"Drop to 60%. Slow tempo, feel the glute squeeze.",
    avoid_if:[],
    modify_if:{ lower_back:"Reduce range to where glutes engage before the back takes over." },
  },
  "Seated Calf Raise": {
    muscleGroup:"calves", tier:"C",
    primaryMuscles:["soleus"], secondaryMuscles:["gastrocnemius"],
    equipment:["machine"],
    setup:"Sit with pad just above knees. Balls of feet on platform edge. Full hang at the start.",
    cue:"Drive through the ball of the foot. Full range — all the way up, all the way down.",
    breathe:"Breathe freely — isolation movement.",
    mistake:"Bouncing through the stretch. Control the descent.",
    feel:"Deep stretch in the lower calf (soleus) at the bottom — different from standing calf raise.",
    progressionRule:"Add 5 lbs when all reps with full range of motion.",
    deloadNote:"Drop to bodyweight. Focus on range.",
  },
  "Good Morning": {
    muscleGroup:"legs", tier:"B",
    primaryMuscles:["hamstrings","lower_back","glutes"], secondaryMuscles:["core"],
    equipment:["barbell"],
    setup:"Bar on upper back (high bar position). Feet shoulder-width. Soft knee bend throughout.",
    cue:"Hinge at hips — push them back as you lean forward. Keep chest proud and spine neutral.",
    breathe:"Inhale and brace at the top. Hold through the hinge. Exhale on the way back up.",
    mistake:"Rounding the lower back. This is a hinge, not a spinal flexion exercise.",
    feel:"Deep hamstring stretch — very similar to RDL but with the bar on your back.",
    progressionRule:"Add 5 lbs when all sets with neutral spine throughout.",
    deloadNote:"Drop to 50% and prioritize spinal position.",
    avoid_if:["lower_back_pain"],
    modify_if:{ lower_back:"Replace with Romanian Deadlift until the back is stronger." },
  },
  "Chest Dip": {
    muscleGroup:"chest", tier:"B",
    primaryMuscles:["lower_chest","triceps","front_delts"], secondaryMuscles:["triceps"],
    equipment:["dip_bars"],
    setup:"Grip slightly wider than shoulder-width. Lean torso forward 20-30° to shift load to chest.",
    cue:"Lean forward to target chest. Lower until upper arms are parallel to floor. Press up and slightly forward.",
    breathe:"Inhale as you lower. Exhale as you press up.",
    mistake:"Not going deep enough — upper arms must reach parallel to the floor minimum.",
    feel:"Lower chest stretch at the bottom — distinct from the tricep-focused upright dip.",
    progressionRule:"Add weight with a dip belt when you hit 12+ clean bodyweight reps.",
    deloadNote:"Use band assistance or switch to push ups.",
    avoid_if:["shoulder_pain_pressing"],
    modify_if:{ shoulder_impingement:"Reduce depth to where shoulders don't click or impinge." },
  },
  "Trap Bar Deadlift": {
    muscleGroup:"back", tier:"A",
    primaryMuscles:["back","glutes","hamstrings","quads"], secondaryMuscles:["core","traps","forearms"],
    equipment:["trap_bar"],
    setup:"Stand in the center of the hex bar. Handles at sides. Sit slightly lower than conventional — more upright torso.",
    cue:"Push the floor away. More upright torso than conventional deadlift. Think 'squat and pull' simultaneously.",
    breathe:"Big breath and brace before each rep. Exhale at full lockout.",
    mistake:"Rising hips first, leaving the bar behind. Push floor away and keep chest up simultaneously.",
    feel:"More quad involvement than conventional deadlift — great for quad-dominant athletes.",
    progressionRule:"Add 10 lbs when all sets with full hip extension at lockout.",
    deloadNote:"Drop to 60%. Focus on position — chest up, hips fully extending.",
    avoid_if:[],
    modify_if:{ lower_back:"Often safer than conventional — more quad-friendly and less spinal shear." },
  },
  "Goblet Squat": {
    muscleGroup:"legs", tier:"A",
    primaryMuscles:["quads","glutes"], secondaryMuscles:["core","upper_back"],
    equipment:["dumbbell","kettlebell"],
    setup:"Hold weight vertically at chest with both hands. Feet shoulder-width, toes slightly out.",
    cue:"Hold weight at chest as a counterbalance. Elbows inside knees at the bottom. Sit between your heels.",
    breathe:"Inhale at top. Brace. Exhale as you stand.",
    mistake:"Heels rising off the floor. Sit into the squat — don't lean forward.",
    feel:"Deep quad and glute engagement. You should feel 'open' at the bottom of the movement.",
    progressionRule:"Add weight when you can do 15 reps with full depth and chest up.",
    deloadNote:"Drop to bodyweight squat to perfect the depth.",
    noviceVersion:{ equipment:"dumbbell", notes:"Excellent first squat. Weight acts as counterbalance to help you stay upright.", repRange:"12-15", sets:3 },
  },
  "Dumbbell Deadlift": {
    muscleGroup:"back", tier:"A",
    primaryMuscles:["back","glutes","hamstrings"], secondaryMuscles:["core","traps","forearms"],
    equipment:["dumbbells"],
    setup:"Dumbbells at sides. Hinge at hips — same position as barbell deadlift. Back flat, chest proud.",
    cue:"Push the floor away. Keep dumbbells close to legs throughout. Identical hinge to barbell — just lighter.",
    breathe:"Inhale and brace before each rep. Exhale at lockout.",
    mistake:"Squatting the weight up instead of hinging. Push hips back, don't squat down.",
    feel:"Same hamstring and glute engagement as barbell deadlift — identical movement pattern.",
    progressionRule:"Add 5 lbs per dumbbell when all sets completed. Transition to barbell when ready.",
    deloadNote:"Drop to single-leg RDL for unilateral focus.",
    noviceVersion:{ equipment:"dumbbells", notes:"Identical to barbell deadlift — builds the hip hinge pattern before loading heavily.", repRange:"10-12", sets:3 },
  },
  "Dumbbell Hip Thrust": {
    muscleGroup:"glutes", tier:"A",
    primaryMuscles:["glutes","hamstrings"], secondaryMuscles:["core"],
    equipment:["dumbbell","bench"],
    setup:"Upper back on bench edge. Dumbbell balanced vertically on hip crease. Both hands stabilize the dumbbell.",
    cue:"Drive hips up explosively — same movement as barbell hip thrust. Squeeze at the top.",
    breathe:"Inhale at bottom. Exhale as hips drive up.",
    mistake:"Dumbbell slipping — hold it vertical on the hip crease with both hands stabilizing.",
    feel:"Maximum glute contraction at top. Identical feel to barbell — just lighter load.",
    progressionRule:"Add 5 lbs when all reps completed. Transition to barbell when available.",
    deloadNote:"Drop to glute bridge (floor) for volume.",
    noviceVersion:{ equipment:"dumbbell", notes:"Great intro to hip thrust before moving to barbell.", repRange:"12-15", sets:3 },
  },
  "Floor Press": {
    muscleGroup:"chest", tier:"B",
    primaryMuscles:["chest","triceps"], secondaryMuscles:["front_delts"],
    equipment:["dumbbells"],
    setup:"Lie on floor. Arms at 45° from torso. Elbows will touch the floor between reps.",
    cue:"Press up normally. Let elbows touch the floor between reps and pause briefly — don't bounce.",
    breathe:"Inhale when elbows touch floor. Press with exhale.",
    mistake:"Bouncing off the floor. Pause with control when elbows touch.",
    feel:"Triceps work harder than on bench due to the limited range of motion. Good for elbow strength.",
    progressionRule:"Add 5 lbs per dumbbell when all reps with 1-sec pause at the floor.",
    deloadNote:"Drop to push ups.",
  },
  "Single Leg Romanian Deadlift": {
    muscleGroup:"legs", tier:"B",
    primaryMuscles:["hamstrings","glutes","core"], secondaryMuscles:["lower_back"],
    equipment:["dumbbell"],
    setup:"Hold dumbbell in the hand opposite to working leg. Standing on one leg, slight knee bend.",
    cue:"Hinge forward as you extend rear leg simultaneously — like a see-saw. Keep hips square to the floor.",
    breathe:"Inhale before hinge. Hold. Exhale as you return to standing.",
    mistake:"Rotating hips open — the hip of the extended leg should not rise above the standing hip.",
    feel:"Deep hamstring stretch on working leg. Balance challenge makes the core work very hard.",
    progressionRule:"Add 5 lbs when all reps without losing balance or rotating hips.",
    deloadNote:"Switch to two-leg RDL while working on balance separately.",
    modify_if:{ balance:"Lightly touch back foot to floor for support while building balance." },
  },
  "Dumbbell Step Up": {
    muscleGroup:"legs", tier:"C",
    primaryMuscles:["quads","glutes"], secondaryMuscles:["hamstrings","core"],
    equipment:["dumbbells","bench_or_box"],
    setup:"Hold dumbbells at sides. Box height: thigh roughly parallel when foot is on it.",
    cue:"Drive through the heel of the working leg. Back leg should barely contribute — all work from the front.",
    breathe:"Exhale as you step up. Inhale as you step down.",
    mistake:"Pushing off the back foot to help, which reduces load on the working leg.",
    feel:"Quad and glute of working leg should burn. Back leg is just for balance.",
    progressionRule:"Add 5 lbs per dumbbell when 12 controlled reps per leg.",
    deloadNote:"Drop to bodyweight step up.",
  },
  "Dumbbell Lunge": {
    muscleGroup:"legs", tier:"C",
    primaryMuscles:["quads","glutes","hamstrings"], secondaryMuscles:["core"],
    equipment:["dumbbells"],
    setup:"Hold dumbbells at sides. Stand tall. Take one large step forward.",
    cue:"Front shin vertical. Back knee hovers above the floor. Drive up through the front heel.",
    breathe:"Inhale as you step and lower. Exhale as you push back to start.",
    mistake:"Front knee caving inward or knee travelling too far past the toes.",
    feel:"Front leg does all the work. Rear leg is just for balance.",
    progressionRule:"Add 5 lbs per dumbbell when all reps with shin vertical and controlled back knee.",
    deloadNote:"Drop to bodyweight lunges.",
  },
  // ── COMMIT 2: BODYWEIGHT ADDITIONS ─────────────────────────────────────────
  "Glute Bridge": {
    muscleGroup:"glutes", tier:"A",
    primaryMuscles:["glutes","hamstrings"], secondaryMuscles:["core"],
    equipment:["bodyweight"],
    setup:"Lie on floor. Feet flat, knees bent at ~90°. Arms at sides. Feet hip-width apart.",
    cue:"Drive hips up by squeezing glutes hard. Full hip extension at the top — don't stop early.",
    breathe:"Inhale at bottom. Exhale as you drive up.",
    mistake:"Using lower back instead of glutes. If your back hurts, your glutes aren't firing.",
    feel:"Maximum glute squeeze at the top. Hold for 1 second every rep.",
    progressionRule:"Progress to dumbbell hip thrust, then barbell hip thrust.",
    deloadNote:"Same exercise — just reduce reps and focus on the squeeze.",
    noviceVersion:{ equipment:"bodyweight", notes:"The foundational glute exercise. Master this before loading.", repRange:"15-20", sets:3 },
  },
  "Single Leg Glute Bridge": {
    muscleGroup:"glutes", tier:"B",
    primaryMuscles:["glutes","hamstrings","core"], secondaryMuscles:[],
    equipment:["bodyweight"],
    setup:"Lie on floor. One leg extended, other foot flat. Drive up on one leg.",
    cue:"Drive through the heel of the planted foot. Extend other leg straight. Keep hips level.",
    breathe:"Inhale at bottom. Exhale as you drive up.",
    mistake:"Hips rotating — keep them level throughout.",
    feel:"Stronger glute contraction than two-legged version. Core works to stabilize.",
    progressionRule:"Progress to single-leg hip thrust with foot on bench.",
    deloadNote:"Drop to two-leg glute bridge.",
  },
  "Pike Push Up": {
    muscleGroup:"shoulders", tier:"A",
    primaryMuscles:["front_delts","triceps"], secondaryMuscles:["upper_chest"],
    equipment:["bodyweight"],
    setup:"Push up position, then walk feet toward hands until hips are high — inverted V shape.",
    cue:"Lower head between hands. Elbows track back and outward slightly. Push up keeping hips high.",
    breathe:"Inhale as you lower. Exhale as you push up.",
    mistake:"Hips dropping into a regular push up position — keep hips high throughout.",
    feel:"Shoulder dominant — very different from a push up. Front delts do most of the work.",
    progressionRule:"Elevate feet on a box to increase difficulty. Progress to handstand push up.",
    deloadNote:"Drop to regular push ups.",
    noviceVersion:{ equipment:"bodyweight", notes:"The bodyweight overhead press. Trains the same muscles as OHP.", repRange:"10-15", sets:3 },
  },
  "Inverted Row": {
    muscleGroup:"back", tier:"A",
    primaryMuscles:["back","biceps","rear_delts"], secondaryMuscles:["core"],
    equipment:["bodyweight","table_or_bar"],
    setup:"Set bar at hip height. Lie under it. Grip outside shoulder-width. Body straight from head to heel.",
    cue:"Pull chest to bar. Stay rigid — body moves as one unit like a horizontal pull up.",
    breathe:"Exhale as you pull. Inhale as you lower.",
    mistake:"Hips sagging — your body must stay completely straight throughout.",
    feel:"Similar to a barbell row but bodyweight. Lats and rhomboids drive the movement.",
    progressionRule:"Elevate feet or add weight vest to increase difficulty.",
    deloadNote:"Raise the bar higher (more upright) to reduce load.",
    noviceVersion:{ equipment:"bodyweight", notes:"Best bodyweight back exercise. Use a table edge, Smith machine bar, or TRX.", repRange:"8-12", sets:3 },
  },
  "Tricep Dip": {
    muscleGroup:"triceps", tier:"B",
    primaryMuscles:["triceps","front_delts"], secondaryMuscles:[],
    equipment:["bodyweight","chair_or_bench"],
    setup:"Hands on chair/bench behind you, fingers forward. Feet flat on floor, legs straight.",
    cue:"Lower until elbows reach 90°. Press back up. Keep torso close to the bench.",
    breathe:"Inhale as you lower. Exhale as you press up.",
    mistake:"Flaring elbows wide — they should point straight back.",
    feel:"Triceps working throughout. Front delts assist at the top.",
    progressionRule:"Elevate feet on another bench. Add weight plate on lap for more resistance.",
    deloadNote:"Reduce range of motion or bend knees to lower load.",
  },
  "Bodyweight Step Up": {
    muscleGroup:"legs", tier:"C",
    primaryMuscles:["quads","glutes"], secondaryMuscles:["hamstrings","core"],
    equipment:["bodyweight","box_or_stairs"],
    setup:"Stand in front of a box or step. Feet hip-width. Step up with one foot fully planted.",
    cue:"Drive through the heel of the front leg. Full hip extension at the top. Don't push off back foot.",
    breathe:"Exhale as you step up. Inhale as you step down.",
    mistake:"Pushing off the back foot — all work should be from the front leg.",
    feel:"Front leg quad and glute working hard. Great unilateral exercise.",
    progressionRule:"Add dumbbells when you can do 15+ reps per leg with control.",
    deloadNote:"Lower the step height.",
  },
  "Assisted Pistol Squat": {
    muscleGroup:"legs", tier:"C",
    primaryMuscles:["quads","glutes","core"], secondaryMuscles:["hamstrings"],
    equipment:["bodyweight"],
    setup:"Hold a doorframe or suspension strap for balance. One leg extended forward.",
    cue:"Squat on one leg as deep as possible while extending the other leg forward. Hold the support as much as needed.",
    breathe:"Inhale as you squat. Exhale as you stand.",
    mistake:"Knee caving inward — drive knee out over pinky toe.",
    feel:"Intense quad burn on the working leg. Balance is the hardest part at first.",
    progressionRule:"Use less and less support until you can do it freestanding.",
    deloadNote:"More support from the anchor point. Reduce depth.",
  },
  "Mountain Climber": {
    muscleGroup:"core", tier:"C",
    primaryMuscles:["core","hip_flexors","shoulders"], secondaryMuscles:["quads"],
    equipment:["bodyweight"],
    setup:"Push up / plank position. Hands directly under shoulders. Body straight.",
    cue:"Drive knees to chest alternately at a controlled pace. Keep hips level — don't let them rise.",
    breathe:"Breathe continuously — don't hold breath.",
    mistake:"Hips rising up into a pike position. Keep the plank position throughout.",
    feel:"Core and hip flexors working together. Shoulders stabilize.",
    progressionRule:"Increase pace. Add a push up between every few reps.",
    deloadNote:"Slow down. Focus on keeping hips level.",
  },
  "Superman Hold": {
    muscleGroup:"back", tier:"C",
    primaryMuscles:["lower_back","glutes"], secondaryMuscles:["hamstrings"],
    equipment:["bodyweight"],
    setup:"Face down on the floor. Arms extended overhead, legs straight.",
    cue:"Simultaneously raise arms and legs off the floor. Hold for 2-3 seconds. Control the descent.",
    breathe:"Exhale as you rise. Inhale as you lower.",
    mistake:"Straining the neck — keep it neutral, look at the floor.",
    feel:"Lower back and glutes contracting. Good prehab for spinal erectors.",
    progressionRule:"Increase hold time to 5 seconds per rep.",
    deloadNote:"Raise arms only, or legs only.",
  },
  "Bird Dog": {
    muscleGroup:"core", tier:"C",
    primaryMuscles:["core","lower_back","glutes"], secondaryMuscles:[],
    equipment:["bodyweight"],
    setup:"On hands and knees. Hands under shoulders, knees under hips. Neutral spine.",
    cue:"Extend opposite arm and leg simultaneously. Hold 3 seconds. Keep hips perfectly level.",
    breathe:"Breathe continuously and controlled.",
    mistake:"Rotating hips or rushing through reps. Slow and controlled is the point.",
    feel:"Core stability — not a strength exercise. Trains anti-rotation.",
    progressionRule:"Increase hold to 5 seconds. Add a mini-band around wrists.",
    deloadNote:"Just leg extension, without the arm. Master that first.",
  },
  "Burpee": {
    muscleGroup:"full_body", tier:"C",
    primaryMuscles:["chest","quads","core","shoulders"], secondaryMuscles:["hamstrings","triceps"],
    equipment:["bodyweight"],
    setup:"Stand tall. Jump out to push up position. Complete a push up. Jump feet in. Jump up.",
    cue:"Land softly. Keep hips from sagging in the push up position. Full extension on the jump.",
    breathe:"Breathe continuously — this is conditioning work.",
    mistake:"Sagging hips in the push up position. Maintain plank throughout.",
    feel:"Full body conditioning. Heart rate will spike. That's the point.",
    progressionRule:"Increase pace. Add a tuck jump at the top.",
    deloadNote:"Remove the push up. Just jump-out, jump-in, stand.",
  },
  "Bear Crawl": {
    muscleGroup:"core", tier:"C",
    primaryMuscles:["core","shoulders","quads"], secondaryMuscles:["hip_flexors"],
    equipment:["bodyweight"],
    setup:"On hands and knees. Lift knees 2 inches off the floor. Maintain this throughout.",
    cue:"Move opposite hand and foot simultaneously. Stay low. Knees never touch the floor.",
    breathe:"Breathe continuously.",
    mistake:"Knees touching the floor. The suspended knees are what makes this effective.",
    feel:"Core stability under load while moving. Surprisingly challenging.",
    progressionRule:"Increase distance. Add backwards bear crawl.",
    deloadNote:"Slow down significantly. Focus on not letting knees touch.",
  },
  // ── COMMIT 1: (continued) ────────────────────────────────────────────────────
  "Single Leg Calf Raise": {
    muscleGroup:"calves", tier:"C",
    primaryMuscles:["calves","soleus"], secondaryMuscles:[],
    equipment:["bodyweight","dumbbell"],
    setup:"Stand on one leg on a step or platform. Hold dumbbell if needed. Full hang at the start.",
    cue:"Full range of motion — all the way up and all the way down. Pause at the bottom for stretch.",
    breathe:"Breathe freely.",
    mistake:"Cutting range of motion short at the top or bottom.",
    feel:"Deep stretch at the bottom. Significant burn at the top on single leg.",
    progressionRule:"Add dumbbell when 15 reps per leg with full range.",
    deloadNote:"Drop to two-leg calf raise.",
  },
  // ── COMMIT 3: RESISTANCE BAND + EXTRA ADDITIONS ───────────────────────────
  "Band Pull Apart": {
    muscleGroup:"shoulders", tier:"C",
    primaryMuscles:["rear_delts","rotator_cuff"], secondaryMuscles:["rhomboids"],
    equipment:["resistance_band"],
    setup:"Hold band with both hands at shoulder width, arms straight in front at shoulder height.",
    cue:"Pull band apart to full shoulder width. Arms stay straight. Control the return.",
    breathe:"Exhale as you pull apart. Inhale on the return.",
    mistake:"Bending the elbows — arms must stay straight throughout.",
    feel:"Rear delts and between shoulder blades contracting.",
    progressionRule:"Use a thicker band or hold wider to increase resistance.",
    deloadNote:"Use a lighter band.",
  },
  "Band Face Pull": {
    muscleGroup:"shoulders", tier:"C",
    primaryMuscles:["rear_delts","rotator_cuff"], secondaryMuscles:[],
    equipment:["resistance_band"],
    setup:"Anchor band at face height. Hold with both hands, palms facing in.",
    cue:"Pull toward face with elbows flaring out and high. Externally rotate at the end.",
    breathe:"Exhale as you pull. Inhale on the return.",
    mistake:"Elbows dropping below the band. They must stay at or above band height.",
    feel:"Identical to cable face pull — rear delts and rotator cuff.",
    progressionRule:"Use a thicker band.",
    deloadNote:"Lighter band or shorter range of motion.",
  },
  "Band Curl": {
    muscleGroup:"biceps", tier:"C",
    primaryMuscles:["biceps"], secondaryMuscles:["brachialis"],
    equipment:["resistance_band"],
    setup:"Stand on the center of the band. Hold both handles with palms up.",
    cue:"Curl handles to shoulders. Keep elbows pinned at sides. Control the descent.",
    breathe:"Exhale as you curl. Inhale as you lower.",
    mistake:"Swinging body or letting elbows drift forward.",
    feel:"Biceps peak contraction at the top. Band provides increasing resistance.",
    progressionRule:"Use a thicker band or stand wider on the band.",
    deloadNote:"Use a lighter band.",
  },
  "Band Tricep Pushdown": {
    muscleGroup:"triceps", tier:"C",
    primaryMuscles:["triceps"], secondaryMuscles:[],
    equipment:["resistance_band"],
    setup:"Anchor band overhead. Hold handle(s) with palms down. Elbows at sides.",
    cue:"Push down keeping elbows pinned at sides. Full extension at the bottom.",
    breathe:"Exhale as you push down. Inhale as you return.",
    mistake:"Elbows flaring out or moving forward. Keep them anchored at your sides.",
    feel:"Triceps fully contracted at the bottom. Same as cable pushdown.",
    progressionRule:"Use a thicker band or step further from the anchor.",
    deloadNote:"Lighter band.",
  },
  "Band Squat": {
    muscleGroup:"legs", tier:"A",
    primaryMuscles:["quads","glutes"], secondaryMuscles:["hamstrings","core"],
    equipment:["resistance_band"],
    setup:"Stand on the center of the band. Hold handles at shoulder height (front squat position).",
    cue:"Squat normally — band provides resistance. Stay upright as the band will try to pull you forward.",
    breathe:"Inhale and brace at the top. Exhale as you stand.",
    mistake:"Band pulling torso forward. Brace core hard and keep chest up.",
    feel:"Similar to goblet squat — front-loaded feel from the band.",
    progressionRule:"Use a thicker band. Progress to goblet squat then barbell.",
    deloadNote:"Use a lighter band or go narrower on the anchor.",
    noviceVersion:{ equipment:"resistance_band", notes:"Band squats teach the squat pattern with minimal load. Great starting point.", repRange:"12-15", sets:3 },
  },
  "Band Hip Thrust": {
    muscleGroup:"glutes", tier:"A",
    primaryMuscles:["glutes","hamstrings"], secondaryMuscles:["core"],
    equipment:["resistance_band"],
    setup:"Anchor band across hips. Both ends held down by hands or anchored. Upper back on bench edge.",
    cue:"Drive hips up against band resistance. Same movement as barbell hip thrust.",
    breathe:"Inhale at bottom. Exhale as hips drive up.",
    mistake:"Band slipping — anchor it securely before starting.",
    feel:"Constant tension throughout range unlike barbell (which is easier at bottom). Great for glute activation.",
    progressionRule:"Thicker band. Progress to dumbbell then barbell hip thrust.",
    deloadNote:"Lighter band or glute bridge on floor.",
    noviceVersion:{ equipment:"resistance_band", notes:"Great intro to the hip thrust pattern with low load.", repRange:"15-20", sets:3 },
  },
  "Band Row": {
    muscleGroup:"back", tier:"A",
    primaryMuscles:["back","biceps"], secondaryMuscles:["rear_delts"],
    equipment:["resistance_band"],
    setup:"Anchor band at chest height. Hold handles, step back for tension. Slight hinge forward.",
    cue:"Pull handles to sides of torso. Squeeze shoulder blades together at the end.",
    breathe:"Exhale as you pull. Inhale as you extend.",
    mistake:"Using momentum or letting shoulder blades collapse forward on the way out.",
    feel:"Back muscles contracting. Similar feel to cable row.",
    progressionRule:"Thicker band. Step further back for more resistance.",
    deloadNote:"Step closer to the anchor for less resistance.",
    noviceVersion:{ equipment:"resistance_band", notes:"Teaches the rowing pattern. Great for building back strength before cable/barbell.", repRange:"12-15", sets:3 },
  },
  "Band Lateral Walk": {
    muscleGroup:"glutes", tier:"C",
    primaryMuscles:["glutes","hip_abductors"], secondaryMuscles:[],
    equipment:["resistance_band"],
    setup:"Band around ankles or just above knees. Slight squat position throughout.",
    cue:"Step sideways maintaining constant band tension. Don't let feet come together.",
    breathe:"Breathe continuously.",
    mistake:"Steps too wide — you lose band tension. Keep steps controlled.",
    feel:"Outer glute (glute medius) and hip burning. Great warm-up or prehab.",
    progressionRule:"Use a thicker band.",
    deloadNote:"Use a lighter band.",
  },
  "Reverse Curl": {
    muscleGroup:"biceps", tier:"C",
    primaryMuscles:["brachialis","biceps"], secondaryMuscles:["brachioradialis"],
    equipment:["barbell","dumbbell","cable"],
    setup:"Overhand (pronated) grip on barbell or dumbbells. Same stance as regular curl.",
    cue:"Curl with overhand grip. Lead with the forearms. Wrists stay neutral — don't extend.",
    breathe:"Exhale as you curl. Inhale as you lower.",
    mistake:"Wrists bending back — keep them neutral and firm throughout.",
    feel:"Top of forearm and outer bicep (brachialis). Very different from regular curl.",
    progressionRule:"Add 5 lbs when all reps with neutral wrists.",
    deloadNote:"Use lighter weight — brachialis often underdeveloped.",
  },
  "Dumbbell Upright Row": {
    muscleGroup:"shoulders", tier:"C",
    primaryMuscles:["traps","side_delts"], secondaryMuscles:["front_delts","biceps"],
    equipment:["dumbbell"],
    setup:"Hold dumbbells in front of thighs. Overhand grip. Feet shoulder-width.",
    cue:"Pull elbows up and out simultaneously. Stop at chin height. Elbows lead — not the wrists.",
    breathe:"Exhale as you pull up. Inhale as you lower.",
    mistake:"Going too heavy and shrugging the weight up. This causes shoulder impingement.",
    feel:"Traps and side delts working together. Lighter than you think is needed.",
    progressionRule:"Add 2.5 lbs per dumbbell when all reps with elbows leading.",
    deloadNote:"Drop significantly in weight. This is a technique exercise.",
    avoid_if:["shoulder_impingement"],
    modify_if:{ shoulder_impingement:"Avoid entirely — substitute with lateral raises." },
  },
};

// ─── EQUIPMENT POOLS ─────────────────────────────────────────────────────────
// Maps gym setup → exercises available for that setup.
// Used to filter swap options and build equipment-appropriate programs.
export const EQUIPMENT_POOLS = {
  full_gym: [
    // Chest
    "Barbell Bench Press","Incline Barbell Press","Decline Barbell Press",
    "Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press",
    "Cable Fly","High Cable Fly","Low Cable Fly","Pec Deck Machine","Dumbbell Fly",
    "Push Up","Diamond Push Up","Wide Push Up","Chest Dip","Floor Press",
    // Back
    "Deadlift","Trap Bar Deadlift","Barbell Row","Pull Up","Chin Up","Lat Pulldown",
    "Cable Row","Seated Cable Row","Dumbbell Row","Face Pull","Inverted Row",
    // Shoulders
    "Overhead Press","Dumbbell Shoulder Press","Arnold Press","Lateral Raise",
    "Rear Delt Fly","Face Pull","Shrug","Front Raise","Upright Row","Dumbbell Upright Row",
    // Arms
    "Barbell Curl","Dumbbell Curl","Hammer Curl","EZ Bar Curl","Preacher Curl",
    "Incline Dumbbell Curl","Concentration Curl","Cable Curl","Reverse Curl",
    "Tricep Pushdown","Skull Crusher","Close Grip Bench Press","Overhead Tricep Extension",
    "Tricep Dip","Diamond Push Up",
    // Legs
    "Barbell Squat","Front Squat","Hack Squat","Leg Press","Bulgarian Split Squat",
    "Walking Lunge","Reverse Lunge","Leg Extension","Goblet Squat",
    "Romanian Deadlift","Leg Curl","Nordic Curl","Good Morning",
    "Dumbbell Lunge","Dumbbell Step Up","Single Leg Romanian Deadlift",
    // Glutes
    "Barbell Hip Thrust","Dumbbell Hip Thrust","Glute Bridge","Single Leg Glute Bridge",
    "Sumo Deadlift","Cable Kickback","Lateral Band Walk","Clamshell",
    // Calves
    "Calf Raise","Seated Calf Raise","Single Leg Calf Raise",
    // Core
    "Ab Wheel Rollout","Hanging Leg Raise","Cable Crunch","Plank","Side Plank",
    "Dead Bug","Russian Twist","Pallof Press","Mountain Climber","Bird Dog","Bear Crawl",
  ],

  home_barbell: [
    // Chest
    "Barbell Bench Press","Incline Barbell Press","Decline Barbell Press",
    "Dumbbell Bench Press","Incline Dumbbell Press","Floor Press",
    "Push Up","Diamond Push Up","Wide Push Up","Chest Dip",
    // Back
    "Deadlift","Barbell Row","Pull Up","Chin Up","Dumbbell Row",
    "Face Pull","Inverted Row","Dumbbell Deadlift",
    // Shoulders
    "Overhead Press","Dumbbell Shoulder Press","Arnold Press","Lateral Raise",
    "Rear Delt Fly","Shrug","Dumbbell Upright Row","Band Pull Apart","Band Face Pull",
    // Arms
    "Barbell Curl","Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl",
    "Concentration Curl","Reverse Curl",
    "Skull Crusher","Close Grip Bench Press","Overhead Tricep Extension","Tricep Dip",
    // Legs
    "Barbell Squat","Front Squat","Bulgarian Split Squat","Walking Lunge","Reverse Lunge",
    "Romanian Deadlift","Nordic Curl","Good Morning","Goblet Squat",
    "Dumbbell Lunge","Dumbbell Step Up","Single Leg Romanian Deadlift",
    // Glutes
    "Barbell Hip Thrust","Dumbbell Hip Thrust","Glute Bridge","Single Leg Glute Bridge",
    "Sumo Deadlift","Lateral Band Walk","Band Hip Thrust",
    // Calves
    "Calf Raise","Single Leg Calf Raise",
    // Core
    "Ab Wheel Rollout","Hanging Leg Raise","Plank","Side Plank",
    "Dead Bug","Russian Twist","Mountain Climber","Bird Dog","Bear Crawl",
  ],

  dumbbells_only: [
    // Chest
    "Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press",
    "Dumbbell Fly","Floor Press",
    "Push Up","Diamond Push Up","Wide Push Up","Chest Dip",
    // Back
    "Dumbbell Row","Dumbbell Deadlift","Inverted Row","Pull Up","Chin Up",
    "Band Row","Superman Hold",
    // Shoulders
    "Dumbbell Shoulder Press","Arnold Press","Lateral Raise","Rear Delt Fly",
    "Dumbbell Upright Row","Band Pull Apart","Band Face Pull","Pike Push Up",
    // Arms
    "Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl","Concentration Curl","Reverse Curl",
    "Overhead Tricep Extension","Tricep Dip","Diamond Push Up",
    // Legs
    "Goblet Squat","Bulgarian Split Squat","Walking Lunge","Reverse Lunge",
    "Dumbbell Romanian Deadlift","Single Leg Romanian Deadlift",
    "Dumbbell Lunge","Dumbbell Step Up","Bodyweight Step Up","Assisted Pistol Squat",
    // Glutes
    "Dumbbell Hip Thrust","Glute Bridge","Single Leg Glute Bridge",
    "Lateral Band Walk","Band Hip Thrust","Clamshell",
    // Calves
    "Calf Raise","Single Leg Calf Raise","Seated Calf Raise",
    // Core
    "Ab Wheel Rollout","Plank","Side Plank","Dead Bug","Russian Twist",
    "Mountain Climber","Bird Dog","Bear Crawl",
  ],

  resistance_bands: [
    // Chest
    "Push Up","Diamond Push Up","Wide Push Up",
    // Back
    "Band Row","Inverted Row","Superman Hold",
    // Shoulders
    "Band Pull Apart","Band Face Pull","Pike Push Up",
    // Arms
    "Band Curl","Band Tricep Pushdown",
    // Legs
    "Band Squat","Walking Lunge","Reverse Lunge","Bodyweight Step Up",
    "Single Leg Romanian Deadlift",
    // Glutes
    "Band Hip Thrust","Glute Bridge","Single Leg Glute Bridge",
    "Band Lateral Walk","Clamshell",
    // Calves
    "Single Leg Calf Raise","Calf Raise",
    // Core
    "Plank","Side Plank","Dead Bug","Mountain Climber","Bird Dog","Bear Crawl",
  ],

  bodyweight_only: [
    // Chest
    "Push Up","Diamond Push Up","Wide Push Up","Chest Dip",
    // Back
    "Pull Up","Chin Up","Inverted Row","Superman Hold",
    // Shoulders
    "Pike Push Up",
    // Arms
    "Diamond Push Up","Tricep Dip",
    // Legs
    "Bulgarian Split Squat","Walking Lunge","Reverse Lunge",
    "Bodyweight Step Up","Assisted Pistol Squat","Single Leg Romanian Deadlift",
    // Glutes
    "Glute Bridge","Single Leg Glute Bridge","Clamshell",
    // Calves
    "Single Leg Calf Raise","Calf Raise",
    // Core
    "Plank","Side Plank","Ab Wheel Rollout","Hanging Leg Raise","Dead Bug",
    "Mountain Climber","Bird Dog","Bear Crawl","Burpee",
  ],
};

// Maps wPrefs.equipment (Title-Case) → EQUIPMENT_POOLS snake_case keys.
// NOTE: wPrefs has 4 settings; EQUIPMENT_POOLS has 5 pools (resistance_bands has no
// wPrefs equivalent, "Cables Only" / "Machines Only" from EQUIPMENT_ALTERNATIVES also
// have no pool). resistance_bands is still reachable by passing the key directly.
export const EQUIP_KEY = {
  "Full Gym":       "full_gym",
  "Home Gym":       "home_barbell",
  "Dumbbells Only": "dumbbells_only",
  "Bodyweight Only":"bodyweight_only",
};

export function getExercisesForEquipment(equipmentSetup) {
  const key = EQUIP_KEY[equipmentSetup] || equipmentSetup || "full_gym";
  return EQUIPMENT_POOLS[key] || EQUIPMENT_POOLS.full_gym;
}

export function getSwapOptionsForEquipment(exerciseName, equipmentSetup, count=6) {
  const group = getMuscleGroup(exerciseName);
  if (!group) return [];
  const available = new Set(getExercisesForEquipment(equipmentSetup));
  const pool = (MUSCLE_GROUP_POOL[group] || []).filter(
    n => n !== exerciseName && available.has(n)
  );
  return pool.slice(0, count).map(n => ({
    name: n, originalName: n, muscleGroup: group,
  }));
}
