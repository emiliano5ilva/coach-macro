// ─── COMPLETE LIFTING PROGRAMS ─────────────────────────────────────────────────
// All splits organized by days per week
// Equipment alternatives built in
// Progressive overload rules included

export const PROGRAMS_BY_DAYS = {
  2: {
    recommended: "Full Body",
    splits: {
      "Full Body": {
        description: "2 days — heavy compounds only. Each muscle once per week. Quality over quantity.",
        days: ["Day A", "Day B"],
        workouts: {
          "Day A": [
            { name:"Barbell Squat", sets:4, reps:"5-6", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Barbell Bench Press", sets:4, reps:"5-6", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Barbell Row", sets:4, reps:"5-6", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Overhead Press", sets:3, reps:"8-10", notes:"", primary:false },
            { name:"Barbell Curl", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          "Day B": [
            { name:"Deadlift", sets:4, reps:"4-5", notes:"Add 10lbs when all reps completed.", primary:true },
            { name:"Incline Dumbbell Press", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Pull Up", sets:4, reps:"6-10", notes:"Add weight when you hit 10 bodyweight reps.", primary:true },
            { name:"Romanian Deadlift", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Lateral Raise", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Ab Wheel Rollout", sets:3, reps:"10-12", notes:"", primary:false }
          ]
        }
      }
    }
  },
  3: {
    recommended: "Full Body A/B/A",
    splits: {
      "Full Body A/B/A": {
        description: "Best 3-day split. Alternates two full body sessions. Each muscle hit 1.5x per week.",
        days: ["Day A", "Day B"],
        alternating: true,
        workouts: {
          "Day A": [
            { name:"Barbell Squat", sets:4, reps:"4-6", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Barbell Bench Press", sets:4, reps:"4-6", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Barbell Row", sets:4, reps:"4-6", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Overhead Press", sets:3, reps:"6-8", notes:"", primary:false },
            { name:"Pull Up", sets:3, reps:"6-10", notes:"", primary:false },
            { name:"Barbell Curl", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          "Day B": [
            { name:"Deadlift", sets:4, reps:"3-5", notes:"Add 10lbs when all reps completed.", primary:true },
            { name:"Incline Dumbbell Press", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Lat Pulldown", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Romanian Deadlift", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Arnold Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Leg Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Face Pull", sets:3, reps:"15-20", notes:"Rear delt health.", primary:false },
            { name:"Calf Raise", sets:4, reps:"15", notes:"", primary:false }
          ]
        }
      },
      "Push/Pull/Legs": {
        description: "Each muscle group once per week. Good for beginners transitioning to splits.",
        days: ["Push", "Pull", "Legs"],
        workouts: {
          Push: [
            { name:"Barbell Bench Press", sets:4, reps:"6-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Overhead Press", sets:4, reps:"6-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Incline Dumbbell Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Cable Fly", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Lateral Raise", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Skull Crusher", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          Pull: [
            { name:"Deadlift", sets:4, reps:"4-6", notes:"Add 10lbs when all reps completed.", primary:true },
            { name:"Barbell Row", sets:4, reps:"6-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Pull Up", sets:3, reps:"6-10", notes:"", primary:false },
            { name:"Lat Pulldown", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Face Pull", sets:3, reps:"15-20", notes:"", primary:false },
            { name:"Barbell Curl", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Hammer Curl", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          Legs: [
            { name:"Barbell Squat", sets:4, reps:"6-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Romanian Deadlift", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Leg Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Walking Lunge", sets:3, reps:"12 each", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Leg Extension", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Calf Raise", sets:4, reps:"15", notes:"", primary:false },
            { name:"Ab Wheel Rollout", sets:3, reps:"10-12", notes:"", primary:false }
          ]
        }
      }
    }
  },
  4: {
    recommended: "Upper/Lower",
    splits: {
      "Upper/Lower": {
        description: "Most scientifically proven split. Each muscle twice per week. A days heavy, B days volume.",
        days: ["Upper A", "Lower A", "Upper B", "Lower B"],
        workouts: {
          "Upper A": [
            { name:"Barbell Bench Press", sets:4, reps:"4-6", notes:"Strength focus. Add 5lbs when all reps completed.", primary:true },
            { name:"Barbell Row", sets:4, reps:"4-6", notes:"Strength focus. Add 5lbs when all reps completed.", primary:true },
            { name:"Overhead Press", sets:3, reps:"6-8", notes:"", primary:false },
            { name:"Pull Up", sets:3, reps:"6-10", notes:"", primary:false },
            { name:"Barbell Curl", sets:3, reps:"8-10", notes:"", primary:false },
            { name:"Skull Crusher", sets:3, reps:"8-10", notes:"", primary:false }
          ],
          "Lower A": [
            { name:"Barbell Squat", sets:4, reps:"4-6", notes:"Strength focus. Add 5lbs when all reps completed.", primary:true },
            { name:"Romanian Deadlift", sets:4, reps:"6-8", notes:"", primary:false },
            { name:"Leg Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Calf Raise", sets:4, reps:"15", notes:"", primary:false },
            { name:"Ab Wheel Rollout", sets:3, reps:"10", notes:"", primary:false }
          ],
          "Upper B": [
            { name:"Incline Dumbbell Press", sets:4, reps:"10-12", notes:"Hypertrophy focus. Controlled tempo.", primary:false },
            { name:"Lat Pulldown", sets:4, reps:"10-12", notes:"Full stretch at top.", primary:false },
            { name:"Dumbbell Shoulder Press", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Cable Row", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Cable Fly", sets:3, reps:"15", notes:"", primary:false },
            { name:"Face Pull", sets:4, reps:"20", notes:"Rear delt health.", primary:false },
            { name:"Lateral Raise", sets:4, reps:"15", notes:"", primary:false },
            { name:"Hammer Curl", sets:3, reps:"12", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"15", notes:"", primary:false }
          ],
          "Lower B": [
            { name:"Deadlift", sets:4, reps:"4-6", notes:"Add 10lbs when all reps completed.", primary:true },
            { name:"Leg Press", sets:4, reps:"12-15", notes:"High foot placement for glute emphasis.", primary:false },
            { name:"Romanian Deadlift", sets:3, reps:"12-15", notes:"Hypertrophy focus.", primary:false },
            { name:"Walking Lunge", sets:3, reps:"12 each", notes:"", primary:false },
            { name:"Leg Extension", sets:3, reps:"15", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"15", notes:"", primary:false },
            { name:"Calf Raise", sets:5, reps:"20", notes:"", primary:false }
          ]
        }
      }
    }
  },
  5: {
    recommended: "Upper/Lower/Push/Pull/Legs",
    splits: {
      "Upper/Lower/Push/Pull/Legs": {
        description: "Best 5-day split. Combines Upper/Lower frequency with PPL volume. Every muscle twice per week.",
        days: ["Upper", "Lower", "Push", "Pull", "Legs"],
        workouts: {
          Upper: [
            { name:"Barbell Bench Press", sets:4, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Barbell Row", sets:4, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Overhead Press", sets:3, reps:"6-8", notes:"", primary:false },
            { name:"Pull Up", sets:3, reps:"6-10", notes:"", primary:false },
            { name:"Barbell Curl", sets:3, reps:"8-10", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          Lower: [
            { name:"Barbell Squat", sets:4, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Romanian Deadlift", sets:4, reps:"6-8", notes:"", primary:false },
            { name:"Leg Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Calf Raise", sets:4, reps:"15", notes:"", primary:false }
          ],
          Push: [
            { name:"Incline Dumbbell Press", sets:4, reps:"10-12", notes:"Volume day. Hypertrophy focus.", primary:false },
            { name:"Cable Fly", sets:4, reps:"15", notes:"", primary:false },
            { name:"Dumbbell Shoulder Press", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Lateral Raise", sets:5, reps:"15-20", notes:"This is how you build shoulder width.", primary:false },
            { name:"Skull Crusher", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Overhead Tricep Extension", sets:3, reps:"12-15", notes:"", primary:false }
          ],
          Pull: [
            { name:"Deadlift", sets:4, reps:"4-6", notes:"Add 10lbs when all reps completed.", primary:true },
            { name:"Lat Pulldown", sets:4, reps:"10-12", notes:"Volume day.", primary:false },
            { name:"Cable Row", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Face Pull", sets:4, reps:"20", notes:"", primary:false },
            { name:"Incline Dumbbell Curl", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Hammer Curl", sets:3, reps:"12-15", notes:"", primary:false }
          ],
          Legs: [
            { name:"Hack Squat", sets:4, reps:"10-12", notes:"Volume day quad focus.", primary:false },
            { name:"Walking Lunge", sets:4, reps:"12 each", notes:"", primary:false },
            { name:"Leg Extension", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Leg Curl", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Bulgarian Split Squat", sets:3, reps:"10 each", notes:"Single leg strength.", primary:false },
            { name:"Calf Raise", sets:6, reps:"20", notes:"", primary:false },
            { name:"Ab Wheel Rollout", sets:3, reps:"12-15", notes:"", primary:false }
          ]
        }
      },
      "Bro Split": {
        description: "Classic bodybuilding. One muscle group per day. Maximum volume per session.",
        days: ["Chest", "Back", "Shoulders", "Arms", "Legs"],
        workouts: {
          Chest: [
            { name:"Barbell Bench Press", sets:5, reps:"5-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Incline Dumbbell Press", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Decline Barbell Press", sets:3, reps:"8-10", notes:"", primary:false },
            { name:"Cable Fly", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Dumbbell Fly", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Push Up", sets:3, reps:"failure", notes:"Burnout finisher.", primary:false }
          ],
          Back: [
            { name:"Deadlift", sets:4, reps:"4-6", notes:"Add 10lbs when all reps completed.", primary:true },
            { name:"Barbell Row", sets:4, reps:"6-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Pull Up", sets:4, reps:"6-10", notes:"", primary:false },
            { name:"Lat Pulldown", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Cable Row", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Dumbbell Row", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          Shoulders: [
            { name:"Overhead Press", sets:5, reps:"5-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Arnold Press", sets:4, reps:"10-12", notes:"", primary:false },
            { name:"Lateral Raise", sets:5, reps:"15-20", notes:"Most important shoulder exercise for width.", primary:false },
            { name:"Face Pull", sets:4, reps:"20", notes:"Rear delt and rotator cuff.", primary:false },
            { name:"Rear Delt Fly", sets:4, reps:"15", notes:"", primary:false },
            { name:"Shrug", sets:4, reps:"12-15", notes:"", primary:false }
          ],
          Arms: [
            { name:"Barbell Curl", sets:5, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Skull Crusher", sets:5, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Incline Dumbbell Curl", sets:4, reps:"10-12", notes:"Long head stretch.", primary:false },
            { name:"Close Grip Bench Press", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Hammer Curl", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Overhead Tricep Extension", sets:3, reps:"12", notes:"Long head emphasis.", primary:false },
            { name:"Concentration Curl", sets:3, reps:"12", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"15", notes:"", primary:false }
          ],
          Legs: [
            { name:"Barbell Squat", sets:5, reps:"5-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Romanian Deadlift", sets:4, reps:"8-10", notes:"", primary:false },
            { name:"Leg Press", sets:4, reps:"10-12", notes:"", primary:false },
            { name:"Walking Lunge", sets:3, reps:"12 each", notes:"", primary:false },
            { name:"Leg Extension", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Calf Raise", sets:6, reps:"15-20", notes:"Calves need high volume.", primary:false }
          ]
        }
      }
    }
  },
  6: {
    recommended: "Push/Pull/Legs x2",
    splits: {
      "Push/Pull/Legs x2": {
        description: "Gold standard for advanced lifters. Every muscle twice per week. A days heavy, B days volume.",
        days: ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"],
        workouts: {
          "Push A": [
            { name:"Barbell Bench Press", sets:4, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Overhead Press", sets:4, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Incline Dumbbell Press", sets:3, reps:"8-10", notes:"", primary:false },
            { name:"Lateral Raise", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Skull Crusher", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          "Pull A": [
            { name:"Deadlift", sets:4, reps:"3-5", notes:"Heaviest lift of the week.", primary:true },
            { name:"Barbell Row", sets:4, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Pull Up", sets:3, reps:"6-8", notes:"", primary:false },
            { name:"Face Pull", sets:4, reps:"20", notes:"", primary:false },
            { name:"Barbell Curl", sets:3, reps:"8-10", notes:"", primary:false },
            { name:"Hammer Curl", sets:3, reps:"10-12", notes:"", primary:false }
          ],
          "Legs A": [
            { name:"Barbell Squat", sets:5, reps:"4-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
            { name:"Romanian Deadlift", sets:4, reps:"6-8", notes:"", primary:false },
            { name:"Leg Press", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Calf Raise", sets:5, reps:"15", notes:"", primary:false }
          ],
          "Push B": [
            { name:"Incline Dumbbell Press", sets:4, reps:"10-12", notes:"Volume day. Hypertrophy focus.", primary:false },
            { name:"Cable Fly", sets:4, reps:"15", notes:"", primary:false },
            { name:"Dumbbell Shoulder Press", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Lateral Raise", sets:5, reps:"15-20", notes:"Builds shoulder width.", primary:false },
            { name:"Rear Delt Fly", sets:3, reps:"20", notes:"", primary:false },
            { name:"Overhead Tricep Extension", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:3, reps:"15-20", notes:"", primary:false }
          ],
          "Pull B": [
            { name:"Lat Pulldown", sets:4, reps:"10-12", notes:"Volume day. Full stretch.", primary:false },
            { name:"Cable Row", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Dumbbell Row", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Face Pull", sets:4, reps:"20", notes:"", primary:false },
            { name:"Incline Dumbbell Curl", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Cable Curl", sets:3, reps:"15", notes:"", primary:false },
            { name:"Hammer Curl", sets:3, reps:"12-15", notes:"", primary:false }
          ],
          "Legs B": [
            { name:"Hack Squat", sets:4, reps:"10-12", notes:"Volume day. Deep range of motion.", primary:false },
            { name:"Walking Lunge", sets:4, reps:"12 each", notes:"", primary:false },
            { name:"Leg Extension", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Leg Curl", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Bulgarian Split Squat", sets:3, reps:"10 each", notes:"Single leg strength.", primary:false },
            { name:"Calf Raise", sets:6, reps:"20", notes:"Calves need high volume.", primary:false },
            { name:"Ab Wheel Rollout", sets:3, reps:"12-15", notes:"", primary:false }
          ]
        }
      },
      "Arnold Split": {
        description: "Arnold's 6-day split. Chest+Back supersets, Shoulders+Arms, Legs. Each twice per week.",
        days: ["Chest+Back A", "Shoulders+Arms A", "Legs A", "Chest+Back B", "Shoulders+Arms B", "Legs B"],
        workouts: {
          "Chest+Back A": [
            { name:"Barbell Bench Press", sets:4, reps:"6-8", notes:"Superset with Pull Up.", primary:true },
            { name:"Pull Up", sets:4, reps:"6-10", notes:"Superset with Bench Press.", primary:true },
            { name:"Incline Dumbbell Press", sets:3, reps:"8-10", notes:"Superset with Barbell Row.", primary:false },
            { name:"Barbell Row", sets:3, reps:"8-10", notes:"Superset with Incline Press.", primary:false },
            { name:"Dumbbell Fly", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Cable Row", sets:3, reps:"12-15", notes:"", primary:false }
          ],
          "Shoulders+Arms A": [
            { name:"Overhead Press", sets:4, reps:"6-8", notes:"Heavy shoulder strength.", primary:true },
            { name:"Arnold Press", sets:3, reps:"10-12", notes:"The signature movement.", primary:false },
            { name:"Lateral Raise", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Barbell Curl", sets:4, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Skull Crusher", sets:4, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Hammer Curl", sets:3, reps:"12", notes:"", primary:false },
            { name:"Overhead Tricep Extension", sets:3, reps:"12", notes:"", primary:false }
          ],
          "Legs A": [
            { name:"Barbell Squat", sets:5, reps:"6-8", notes:"Add 5lbs when all reps completed.", primary:true },
            { name:"Leg Press", sets:4, reps:"10-12", notes:"", primary:false },
            { name:"Romanian Deadlift", sets:3, reps:"10-12", notes:"", primary:false },
            { name:"Leg Extension", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Leg Curl", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Calf Raise", sets:5, reps:"15", notes:"", primary:false }
          ],
          "Chest+Back B": [
            { name:"Incline Barbell Press", sets:4, reps:"8-10", notes:"Volume day — upper chest.", primary:false },
            { name:"Lat Pulldown", sets:4, reps:"10-12", notes:"", primary:false },
            { name:"Cable Fly", sets:3, reps:"15", notes:"", primary:false },
            { name:"Dumbbell Row", sets:3, reps:"12-15", notes:"", primary:false },
            { name:"Push Up", sets:3, reps:"failure", notes:"Burnout finisher.", primary:false },
            { name:"Face Pull", sets:4, reps:"20", notes:"", primary:false }
          ],
          "Shoulders+Arms B": [
            { name:"Dumbbell Shoulder Press", sets:4, reps:"12-15", notes:"Volume day.", primary:false },
            { name:"Lateral Raise", sets:5, reps:"15-20", notes:"Builds the width.", primary:false },
            { name:"Rear Delt Fly", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Incline Dumbbell Curl", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Tricep Pushdown", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Cable Curl", sets:3, reps:"15", notes:"", primary:false },
            { name:"Diamond Push Up", sets:3, reps:"failure", notes:"", primary:false }
          ],
          "Legs B": [
            { name:"Hack Squat", sets:4, reps:"10-12", notes:"Volume day — quad focus.", primary:false },
            { name:"Romanian Deadlift", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Walking Lunge", sets:3, reps:"12 each", notes:"", primary:false },
            { name:"Leg Extension", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Leg Curl", sets:4, reps:"15-20", notes:"", primary:false },
            { name:"Calf Raise", sets:6, reps:"20", notes:"", primary:false },
            { name:"Hanging Leg Raise", sets:3, reps:"15", notes:"", primary:false }
          ]
        }
      }
    }
  },
  7: {
    recommended: "Bro Split + Active Recovery",
    splits: {
      "Bro Split + Active Recovery": {
        description: "6 days lifting, 1 active recovery. Not recommended — recovery is where you grow.",
        days: ["Chest", "Back", "Shoulders", "Arms", "Legs", "Core+Cardio", "Active Recovery"],
        workouts: {
          "Core+Cardio": [
            { name:"Ab Wheel Rollout", sets:4, reps:"12-15", notes:"", primary:false },
            { name:"Hanging Leg Raise", sets:4, reps:"15", notes:"", primary:false },
            { name:"Cable Crunch", sets:3, reps:"20", notes:"", primary:false },
            { name:"Plank", sets:3, reps:"60 sec", notes:"", primary:false },
            { name:"Zone 2 Cardio", sets:1, reps:"30 min", notes:"Easy pace — active recovery.", primary:false }
          ],
          "Active Recovery": [
            { name:"Easy Walk", sets:1, reps:"20 min", notes:"No intensity.", primary:false },
            { name:"Foam Rolling", sets:1, reps:"10 min", notes:"All major muscle groups.", primary:false },
            { name:"Hip Flexor Stretch", sets:3, reps:"60 sec each", notes:"", primary:false },
            { name:"Thoracic Spine Rotation", sets:3, reps:"10 each", notes:"", primary:false }
          ]
        }
      }
    }
  }
};

// GVT overlay — auto-scheduled week 4
export const GVT_OVERLAY = {
  description: "German Volume Training — 10 sets × 10 reps. Week 4 only. 60% of 1RM. 90 sec rest between sets.",
  movements: {
    Push:       { primary:"Barbell Bench Press", secondary:"Overhead Press" },
    "Push A":   { primary:"Barbell Bench Press", secondary:"Overhead Press" },
    "Push B":   { primary:"Incline Dumbbell Press", secondary:"Lateral Raise" },
    Pull:       { primary:"Barbell Row", secondary:"Pull Up" },
    "Pull A":   { primary:"Barbell Row", secondary:"Pull Up" },
    "Pull B":   { primary:"Lat Pulldown", secondary:"Cable Row" },
    Legs:       { primary:"Barbell Squat", secondary:"Romanian Deadlift" },
    "Legs A":   { primary:"Barbell Squat", secondary:"Romanian Deadlift" },
    "Legs B":   { primary:"Hack Squat", secondary:"Walking Lunge" },
    Upper:      { primary:"Barbell Bench Press", secondary:"Barbell Row" },
    "Upper A":  { primary:"Barbell Bench Press", secondary:"Barbell Row" },
    "Upper B":  { primary:"Incline Dumbbell Press", secondary:"Lat Pulldown" },
    Lower:      { primary:"Barbell Squat", secondary:"Deadlift" },
    "Lower A":  { primary:"Barbell Squat", secondary:"Romanian Deadlift" },
    "Lower B":  { primary:"Deadlift", secondary:"Leg Press" },
    "Day A":    { primary:"Barbell Squat", secondary:"Barbell Bench Press" },
    "Day B":    { primary:"Deadlift", secondary:"Incline Dumbbell Press" },
    "Full Body":{ primary:"Barbell Squat", secondary:"Barbell Bench Press" },
    "Chest+Back A":       { primary:"Barbell Bench Press", secondary:"Barbell Row" },
    "Shoulders+Arms A":   { primary:"Overhead Press", secondary:"Barbell Curl" },
    Chest:      { primary:"Barbell Bench Press", secondary:"Incline Dumbbell Press" },
    Back:       { primary:"Deadlift", secondary:"Barbell Row" },
    Shoulders:  { primary:"Overhead Press", secondary:"Arnold Press" },
    Arms:       { primary:"Barbell Curl", secondary:"Skull Crusher" },
  }
};

export function getWorkoutForDay(daysPerWeek, splitType, dayIndex, equipment, history) {
  const days = daysPerWeek || 4;
  const program = PROGRAMS_BY_DAYS[days];
  if(!program) return null;

  const split = program.splits[splitType] || program.splits[program.recommended];
  if(!split) return null;

  const dayKeys = split.days;
  const dayKey = dayKeys[dayIndex % dayKeys.length];
  const exercises = split.workouts[dayKey] || [];

  return {
    dayName: dayKey,
    splitName: splitType,
    exercises: exercises.map(ex => {
      const key = ex.name.toLowerCase().replace(/\s+/g,"_");
      const sessions = history?.[key] || [];
      const last = sessions[sessions.length-1];

      let suggestedWeight = "";
      let progressNote = "";

      if(last){
        const lastMax = Math.max(...(last.sets||[]).map(s=>parseFloat(s.weight||0)));
        const targetReps = parseInt((ex.reps||"10").split("-").pop());
        const allRepsHit = (last.sets||[]).every(s=>parseInt(s.reps||0)>=targetReps);
        if(allRepsHit && ex.primary){
          const inc = ex.name.toLowerCase().includes("deadlift")?10:5;
          suggestedWeight = lastMax + inc;
          progressNote = `↑ +${inc}lbs — you earned it`;
        } else if(lastMax>0){
          suggestedWeight = lastMax;
          progressNote = `Same as last time — hit all reps to progress`;
        }
      }

      return {
        ...ex,
        suggestedWeight,
        progressNote,
        sets: Array.from({length:ex.sets},()=>({
          reps: ex.reps.split("-")[0],
          weight: suggestedWeight?.toString()||"",
          done: false
        }))
      };
    })
  };
}
