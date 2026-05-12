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

// ─── GLUTE & LOWER BODY PROGRAMS ─────────────────────────────────────────────
export const GLUTE_PROGRAMS = {
  "Glute Focus 3-Day": {
    description: "3 days per week dedicated to glute and lower body development. Progressive overload on hip thrusts is the key driver.",
    days: ["Glute Heavy", "Hamstring + Posterior", "Glute Pump"],
    workouts: {
      "Glute Heavy": [
        { name:"Barbell Hip Thrust", sets:4, reps:"8-10", notes:"Most important glute exercise. Drive through heels, squeeze at top. Add 5-10lbs when all reps completed.", primary:true },
        { name:"Sumo Deadlift", sets:4, reps:"6-8", notes:"Wide stance targets glutes and inner thighs. Add 5lbs when all reps completed.", primary:true },
        { name:"Bulgarian Split Squat", sets:3, reps:"10-12 each", notes:"Back foot elevated. Lean forward slightly to hit glutes more than quads.", primary:false },
        { name:"Cable Kickback", sets:4, reps:"15-20 each", notes:"Full extension at top. Squeeze the glute hard. Control the return.", primary:false },
        { name:"Lateral Band Walk", sets:3, reps:"20 each direction", notes:"Band above knees. Stay low. Feel the glute med burning.", primary:false },
        { name:"Glute Bridge", sets:3, reps:"20", notes:"Burnout finisher. Squeeze at top for 1 second each rep.", primary:false }
      ],
      "Hamstring + Posterior": [
        { name:"Romanian Deadlift", sets:4, reps:"8-10", notes:"Feel the hamstring stretch at the bottom. Add 5lbs when all reps completed.", primary:true },
        { name:"Dumbbell Hip Thrust", sets:4, reps:"12-15", notes:"Same movement as barbell but with dumbbell on hips. Focus on squeeze.", primary:false },
        { name:"Leg Curl", sets:4, reps:"12-15", notes:"Slow on the way down — 3 second negative.", primary:false },
        { name:"Good Morning", sets:3, reps:"12", notes:"Hinge at hips, soft knee bend. Posterior chain builder.", primary:false },
        { name:"Reverse Lunge", sets:3, reps:"12 each", notes:"Step back, not forward. Keeps tension on the glute.", primary:false },
        { name:"Clamshell", sets:3, reps:"20 each", notes:"Band above knees. Targets glute medius — critical for round glutes.", primary:false }
      ],
      "Glute Pump": [
        { name:"Cable Pull Through", sets:4, reps:"15-20", notes:"Hinge at hips, drive through with glutes. Great mind-muscle connection builder.", primary:false },
        { name:"Curtsy Lunge", sets:3, reps:"12 each", notes:"Step behind and across. Hits glutes from a unique angle.", primary:false },
        { name:"Sumo Squat", sets:3, reps:"15", notes:"Wide stance, toes out. Dumbbell or barbell.", primary:false },
        { name:"Donkey Kick", sets:3, reps:"20 each", notes:"Cable or bodyweight. Full extension, squeeze hard at top.", primary:false },
        { name:"Lateral Band Walk", sets:3, reps:"20 each direction", notes:"", primary:false },
        { name:"Hip Thrust Pulse", sets:2, reps:"30", notes:"Lightweight, stay at top, small pulses. Burnout finisher.", primary:false }
      ]
    }
  },

  "Glute Focus 4-Day": {
    description: "4 days for serious glute development. Separates heavy loading days from pump/isolation days for maximum growth.",
    days: ["Heavy Glutes", "Hamstrings", "Quad + Glute Balance", "Glute Isolation + Core"],
    workouts: {
      "Heavy Glutes": [
        { name:"Barbell Hip Thrust", sets:5, reps:"6-8", notes:"HEAVY. This is your primary strength movement. Add 10lbs when all reps completed.", primary:true },
        { name:"Sumo Deadlift", sets:4, reps:"5-6", notes:"Heavy. Add 5lbs when all reps completed.", primary:true },
        { name:"Bulgarian Split Squat", sets:3, reps:"8-10 each", notes:"Heavy dumbbell. Lean forward for glute emphasis.", primary:false },
        { name:"Cable Kickback", sets:3, reps:"15 each", notes:"", primary:false },
        { name:"Lateral Band Walk", sets:3, reps:"20 each", notes:"", primary:false }
      ],
      "Hamstrings": [
        { name:"Romanian Deadlift", sets:4, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
        { name:"Leg Curl", sets:4, reps:"12-15", notes:"3 second negative on every rep.", primary:false },
        { name:"Good Morning", sets:3, reps:"12", notes:"", primary:false },
        { name:"Nordic Curl", sets:3, reps:"6-8", notes:"Hardest hamstring exercise. Use assistance if needed.", primary:false },
        { name:"Dumbbell Hip Thrust", sets:3, reps:"15", notes:"", primary:false },
        { name:"Clamshell", sets:3, reps:"20 each", notes:"Band above knees.", primary:false }
      ],
      "Quad + Glute Balance": [
        { name:"Barbell Squat", sets:4, reps:"8-10", notes:"Feet shoulder width. Sit back and down.", primary:true },
        { name:"Leg Press", sets:3, reps:"12-15", notes:"High foot placement for glute emphasis.", primary:false },
        { name:"Walking Lunge", sets:3, reps:"12 each", notes:"Long stride for more glute activation.", primary:false },
        { name:"Leg Extension", sets:3, reps:"15", notes:"", primary:false },
        { name:"Barbell Hip Thrust", sets:3, reps:"15", notes:"Lighter than Monday — pump focus.", primary:false },
        { name:"Calf Raise", sets:4, reps:"20", notes:"", primary:false }
      ],
      "Glute Isolation + Core": [
        { name:"Cable Pull Through", sets:4, reps:"15-20", notes:"Build that mind-muscle connection.", primary:false },
        { name:"Donkey Kick", sets:4, reps:"20 each", notes:"Cable or bodyweight. Squeeze hard.", primary:false },
        { name:"Curtsy Lunge", sets:3, reps:"12 each", notes:"", primary:false },
        { name:"Sumo Squat", sets:3, reps:"15", notes:"", primary:false },
        { name:"Clamshell", sets:3, reps:"25 each", notes:"", primary:false },
        { name:"Lateral Band Walk", sets:3, reps:"25 each", notes:"", primary:false },
        { name:"Plank", sets:3, reps:"45 sec", notes:"", primary:false },
        { name:"Glute Bridge", sets:3, reps:"25", notes:"Burnout. Squeeze every rep.", primary:false }
      ]
    }
  },

  "Lower Body Only 5-Day": {
    description: "5 dedicated lower body days for maximum glute and leg development. Not for beginners — requires recovery discipline.",
    days: ["Glutes Heavy", "Hamstrings", "Active Recovery", "Quads + Glutes", "Glute Pump + Abs"],
    workouts: {
      "Glutes Heavy": [
        { name:"Barbell Hip Thrust", sets:5, reps:"5-8", notes:"Heaviest session of the week. Add 10lbs when all reps completed.", primary:true },
        { name:"Sumo Deadlift", sets:4, reps:"5-6", notes:"Add 5lbs when all reps completed.", primary:true },
        { name:"Bulgarian Split Squat", sets:4, reps:"8 each", notes:"Heavy. Lean forward.", primary:false },
        { name:"Cable Kickback", sets:4, reps:"15 each", notes:"", primary:false },
        { name:"Lateral Band Walk", sets:3, reps:"20 each", notes:"", primary:false }
      ],
      "Hamstrings": [
        { name:"Romanian Deadlift", sets:5, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
        { name:"Leg Curl", sets:4, reps:"12-15", notes:"3 second negative.", primary:false },
        { name:"Nordic Curl", sets:3, reps:"5-8", notes:"Brutal but effective.", primary:false },
        { name:"Good Morning", sets:3, reps:"12", notes:"", primary:false },
        { name:"Dumbbell Hip Thrust", sets:3, reps:"20", notes:"Lighter — pump focus.", primary:false },
        { name:"Clamshell", sets:3, reps:"25 each", notes:"", primary:false }
      ],
      "Active Recovery": [
        { name:"20 Min Walk", sets:1, reps:"20 min", notes:"Easy pace. Get blood moving.", primary:false },
        { name:"Hip Flexor Stretch", sets:3, reps:"60 sec each", notes:"Tight hip flexors limit glute activation.", primary:false },
        { name:"Pigeon Pose", sets:3, reps:"90 sec each", notes:"Best glute stretch.", primary:false },
        { name:"Glute Bridge", sets:2, reps:"20", notes:"Activation work only — very light.", primary:false },
        { name:"Foam Rolling", sets:1, reps:"10 min", notes:"Quads, hamstrings, glutes, IT band.", primary:false }
      ],
      "Quads + Glutes": [
        { name:"Barbell Squat", sets:4, reps:"8-10", notes:"Add 5lbs when all reps completed.", primary:true },
        { name:"Leg Press", sets:4, reps:"12-15", notes:"High foot placement.", primary:false },
        { name:"Walking Lunge", sets:3, reps:"15 each", notes:"Long stride.", primary:false },
        { name:"Leg Extension", sets:3, reps:"15-20", notes:"", primary:false },
        { name:"Barbell Hip Thrust", sets:3, reps:"15", notes:"", primary:false },
        { name:"Calf Raise", sets:5, reps:"20", notes:"Calves need high volume.", primary:false }
      ],
      "Glute Pump + Abs": [
        { name:"Cable Pull Through", sets:4, reps:"20", notes:"", primary:false },
        { name:"Donkey Kick", sets:4, reps:"20 each", notes:"", primary:false },
        { name:"Curtsy Lunge", sets:3, reps:"15 each", notes:"", primary:false },
        { name:"Sumo Squat", sets:3, reps:"20", notes:"Lighter weight — pump.", primary:false },
        { name:"Lateral Band Walk", sets:3, reps:"25 each", notes:"", primary:false },
        { name:"Clamshell", sets:3, reps:"25 each", notes:"", primary:false },
        { name:"Ab Wheel Rollout", sets:3, reps:"12", notes:"", primary:false },
        { name:"Hanging Leg Raise", sets:3, reps:"15", notes:"", primary:false },
        { name:"Plank", sets:3, reps:"60 sec", notes:"", primary:false }
      ]
    }
  }
};

// ─── SKILL-LEVEL EXERCISE OVERRIDES ──────────────────────────────────────────
// Keyed by splitType → dayName → { novice, advanced }.
// Intermediate falls back to the base arrays in PROGRAMS_BY_DAYS.
export const SKILL_OVERRIDES = {
  // ── 2-day Full Body ─────────────────────────────────────────────────────────
  "Full Body": {
    "Day A": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"Hold dumbbell at chest. Heels shoulder-width, sit down between knees.",primary:true},
        {name:"Dumbbell Bench Press",sets:3,reps:"12-15",notes:"Feel the chest stretch at the bottom. Push the bench away, not the weight up.",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Pull to upper chest. Squeeze lats at the bottom.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12-15",notes:"Stop 2-3 reps before failure.",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"3-5",notes:"Heavy. Pause 1 sec at bottom. Add weight every week.",primary:true},
        {name:"Barbell Bench Press",sets:5,reps:"3-5",notes:"Add 5lbs when all reps completed. Controlled 2-sec descent.",primary:true},
        {name:"Barbell Row",sets:4,reps:"4-6",notes:"Hold 1 sec at top. Chest almost touches bar.",primary:true},
        {name:"Overhead Press",sets:4,reps:"5-7",notes:"Strict. Bar touches clavicle at bottom.",primary:false},
        {name:"Weighted Pull Up",sets:3,reps:"5-8",notes:"Add weight when you hit 8 clean reps bodyweight.",primary:false},
        {name:"Barbell Curl",sets:4,reps:"8-10",notes:"Controlled descent — 2 sec negative.",primary:false},
        {name:"Skull Crusher",sets:3,reps:"8-10",notes:"Elbows stay pointed at the ceiling.",primary:false},
        {name:"Ab Wheel Rollout",sets:3,reps:"10-12",notes:"Full extension. Don't let hips sag.",primary:false},
      ],
    },
    "Day B": {
      novice: [
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"Hip hinge — push hips back, not down. Feel the hamstring stretch.",primary:true},
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"30-45 degree incline. Focus on upper chest.",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"Squeeze shoulder blades together at the end.",primary:false},
        {name:"Leg Press",sets:3,reps:"15",notes:"Feet shoulder-width. Full depth.",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"Light weight. Lead with elbows.",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"3-5",notes:"Heavy. Add 10lbs when all reps completed. Belt at 4+ plates.",primary:true},
        {name:"Romanian Deadlift",sets:4,reps:"6-8",notes:"Pause at bottom for max hamstring stretch.",primary:false},
        {name:"Incline Dumbbell Press",sets:4,reps:"8-10",notes:"2-sec descent. Full stretch at bottom.",primary:false},
        {name:"Weighted Pull Up",sets:4,reps:"6-8",notes:"Dead hang to full lockout. Add weight.",primary:true},
        {name:"Face Pull",sets:4,reps:"20",notes:"External rotation at end. Rear delt and rotator cuff health.",primary:false},
        {name:"Lateral Raise",sets:4,reps:"15-20",notes:"Rest-pause on last set. This is how you build shoulder width.",primary:false},
        {name:"Ab Wheel Rollout",sets:3,reps:"12",notes:"",primary:false},
      ],
    },
  },

  // ── 3-day Full Body A/B/A ───────────────────────────────────────────────────
  "Full Body A/B/A": {
    "Day A": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12",notes:"Control the descent. Don't let knees cave.",primary:true},
        {name:"Dumbbell Bench Press",sets:3,reps:"12-15",notes:"Slow descent. Feel the chest stretch.",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Pull to chin. Full stretch at top.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"3-5",notes:"Heavy. Record this — you should hit a PR every 2-3 weeks.",primary:true},
        {name:"Barbell Bench Press",sets:5,reps:"3-5",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Barbell Row",sets:5,reps:"3-5",notes:"Pendlay-style. Bar from floor each rep.",primary:true},
        {name:"Overhead Press",sets:4,reps:"4-6",notes:"",primary:false},
        {name:"Weighted Pull Up",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Barbell Curl",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Skull Crusher",sets:3,reps:"8-10",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"Shoulder health — don't skip this.",primary:false},
      ],
    },
    "Day B": {
      novice: [
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"Hinge at hips. Keep back flat. Feel hamstrings load.",primary:true},
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12",notes:"",primary:false},
        {name:"Leg Press",sets:3,reps:"15",notes:"Full depth.",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"Full range — all the way up, all the way down.",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"2-4",notes:"Heaviest lift of the week. Add 10lbs when all reps completed.",primary:true},
        {name:"Hack Squat",sets:4,reps:"6-8",notes:"Or front squat. Quad depth.",primary:false},
        {name:"Incline Dumbbell Press",sets:4,reps:"8-10",notes:"2-sec descent.",primary:false},
        {name:"Lat Pulldown",sets:4,reps:"8-10",notes:"Full stretch — arms fully extended at top.",primary:false},
        {name:"Romanian Deadlift",sets:4,reps:"8-10",notes:"After deadlift — lighter. Hamstring stretch.",primary:false},
        {name:"Arnold Press",sets:3,reps:"10-12",notes:"",primary:false},
        {name:"Face Pull",sets:4,reps:"20",notes:"",primary:false},
        {name:"Calf Raise",sets:5,reps:"15-20",notes:"",primary:false},
      ],
    },
  },

  // ── 3-day Push/Pull/Legs ────────────────────────────────────────────────────
  "Push/Pull/Legs": {
    "Push": {
      novice: [
        {name:"Dumbbell Bench Press",sets:3,reps:"12-15",notes:"Focus on feeling the chest contract. Don't worry about weight yet.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12-15",notes:"Control the movement. Stop 2-3 reps before failure.",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"Light weight. Full range of motion.",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
        {name:"Push Up",sets:2,reps:"max",notes:"Burnout. Go until form breaks.",primary:false},
      ],
      advanced: [
        {name:"Barbell Bench Press",sets:5,reps:"4-6",notes:"Heavy. This is your primary strength movement. Progressive overload mandatory.",primary:true},
        {name:"Incline Dumbbell Press",sets:4,reps:"8-10",notes:"Controlled 2-second descent.",primary:false},
        {name:"Cable Fly",sets:4,reps:"12-15",notes:"Superset with push ups on last 2 sets.",primary:false},
        {name:"Overhead Press",sets:4,reps:"6-8",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Arnold Press",sets:3,reps:"10-12",notes:"",primary:false},
        {name:"Lateral Raise",sets:5,reps:"15-20",notes:"Rest-pause on last set. This builds shoulder width.",primary:false},
        {name:"Skull Crusher",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:3,reps:"10-12",notes:"Long head emphasis.",primary:false},
      ],
    },
    "Pull": {
      novice: [
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Pull to upper chest. Elbows down and back.",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"12-15",notes:"Single arm. Elbow drives to hip. Full row.",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"Squeeze shoulder blades at end of movement.",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"Rear delt health. Every session.",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Hammer Curl",sets:2,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"3-5",notes:"Add 10lbs when all reps completed. This is your heaviest day.",primary:true},
        {name:"Barbell Row",sets:5,reps:"4-6",notes:"Chest almost touches bar. Control the descent.",primary:true},
        {name:"Weighted Pull Up",sets:4,reps:"5-8",notes:"Add weight when you hit 8 clean reps bodyweight.",primary:false},
        {name:"Lat Pulldown",sets:4,reps:"8-10",notes:"Full stretch at top — arms fully extended.",primary:false},
        {name:"Face Pull",sets:4,reps:"20",notes:"External rotation. Non-negotiable for shoulder health.",primary:false},
        {name:"Barbell Curl",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Incline Dumbbell Curl",sets:3,reps:"10-12",notes:"Long head stretch.",primary:false},
        {name:"Hammer Curl",sets:3,reps:"10-12",notes:"",primary:false},
        {name:"Cable Curl",sets:3,reps:"15",notes:"Constant tension finisher.",primary:false},
      ],
    },
    "Legs": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"Dumbbell at chest. Sit between your heels, not in front of them.",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"Feet shoulder-width. Full depth — don't cut the range.",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"Hip hinge. Feel the hamstring stretch at the bottom.",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"Full range of motion.",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"4-6",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Front Squat",sets:4,reps:"6-8",notes:"Or hack squat. Quad depth. Stay upright.",primary:false},
        {name:"Romanian Deadlift",sets:4,reps:"6-8",notes:"Heavy. Feel the hamstring load.",primary:false},
        {name:"Leg Press",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Walking Lunge",sets:4,reps:"12 each",notes:"Long stride for glute emphasis.",primary:false},
        {name:"Leg Curl",sets:4,reps:"12-15",notes:"3-sec negative on every rep.",primary:false},
        {name:"Leg Extension",sets:4,reps:"15-20",notes:"Squeeze at top.",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"10 each",notes:"Single leg strength. Heavy DB.",primary:false},
        {name:"Calf Raise",sets:5,reps:"20",notes:"High volume — calves are stubborn.",primary:false},
      ],
    },
  },

  // ── 4-day Upper/Lower ───────────────────────────────────────────────────────
  "Upper/Lower": {
    "Upper A": {
      novice: [
        {name:"Dumbbell Bench Press",sets:3,reps:"10-12",notes:"Control the descent. Feel the chest stretch.",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"10-12",notes:"Elbow drives to hip. Hold 1 sec at top.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"10-12",notes:"Stop before failure.",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"12",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"12",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Bench Press",sets:5,reps:"3-5",notes:"Primary strength movement. Add 5lbs when all reps completed.",primary:true},
        {name:"Barbell Row",sets:5,reps:"3-5",notes:"Pendlay-style. Explosive up, controlled down.",primary:true},
        {name:"Overhead Press",sets:4,reps:"4-6",notes:"",primary:false},
        {name:"Weighted Pull Up",sets:4,reps:"5-8",notes:"",primary:false},
        {name:"Barbell Curl",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Skull Crusher",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"Shoulder health.",primary:false},
      ],
    },
    "Lower A": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"Priority: full depth over heavy weight.",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"Feet shoulder-width. Full range.",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"Hinge at hips. Flat back throughout.",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"3-sec negative.",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
        {name:"Plank",sets:3,reps:"30 sec",notes:"Squeeze everything.",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"3-5",notes:"Heavy. Add 5lbs when all reps completed.",primary:true},
        {name:"Romanian Deadlift",sets:4,reps:"5-7",notes:"Heavy hinge. Add weight weekly.",primary:false},
        {name:"Leg Press",sets:4,reps:"8-12",notes:"",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"8-10 each",notes:"Single-leg strength. Very challenging.",primary:false},
        {name:"Leg Curl",sets:4,reps:"10-12",notes:"3-sec negative.",primary:false},
        {name:"Calf Raise",sets:5,reps:"15",notes:"",primary:false},
        {name:"Ab Wheel Rollout",sets:3,reps:"12",notes:"",primary:false},
      ],
    },
    "Upper B": {
      novice: [
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"Upper chest focus.",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Full stretch at top.",primary:false},
        {name:"Machine Shoulder Press",sets:3,reps:"12-15",notes:"Or dumbbell press.",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"Light weight. Full range.",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"Rear delt health.",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Incline Dumbbell Press",sets:5,reps:"8-10",notes:"Hypertrophy focus. 2-sec descent.",primary:false},
        {name:"Lat Pulldown",sets:4,reps:"8-12",notes:"Full stretch — arms fully extended at top.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Cable Row",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Cable Fly",sets:4,reps:"12-15",notes:"Full stretch + squeeze.",primary:false},
        {name:"Face Pull",sets:5,reps:"20",notes:"",primary:false},
        {name:"Lateral Raise",sets:5,reps:"15-20",notes:"Rest-pause on last set.",primary:false},
        {name:"Hammer Curl",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:3,reps:"12",notes:"Long head.",primary:false},
      ],
    },
    "Lower B": {
      novice: [
        {name:"Dumbbell Deadlift",sets:3,reps:"10-12",notes:"Or trap bar if available. Hip hinge pattern.",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Walking Lunge",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"3-5",notes:"Add 10lbs when all reps completed.",primary:true},
        {name:"Leg Press",sets:4,reps:"10-15",notes:"High foot placement for glute emphasis.",primary:false},
        {name:"Romanian Deadlift",sets:4,reps:"8-10",notes:"Hypertrophy focus. Feel the stretch.",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Walking Lunge",sets:3,reps:"12 each",notes:"",primary:false},
        {name:"Leg Extension",sets:4,reps:"15-20",notes:"",primary:false},
        {name:"Leg Curl",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Calf Raise",sets:6,reps:"20",notes:"",primary:false},
      ],
    },
  },

  // ── 5-day Upper/Lower/Push/Pull/Legs ────────────────────────────────────────
  "Upper/Lower/Push/Pull/Legs": {
    "Upper": {
      novice: [
        {name:"Dumbbell Bench Press",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12",notes:"",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Bench Press",sets:5,reps:"3-5",notes:"Heavy. Add 5lbs.",primary:true},
        {name:"Barbell Row",sets:5,reps:"3-5",notes:"Heavy.",primary:true},
        {name:"Overhead Press",sets:4,reps:"4-6",notes:"",primary:false},
        {name:"Weighted Pull Up",sets:4,reps:"5-8",notes:"",primary:false},
        {name:"Barbell Curl",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Skull Crusher",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
      ],
    },
    "Lower": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"3-5",notes:"Heavy.",primary:true},
        {name:"Romanian Deadlift",sets:4,reps:"5-7",notes:"",primary:false},
        {name:"Leg Press",sets:4,reps:"8-12",notes:"",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"8-10 each",notes:"",primary:false},
        {name:"Leg Curl",sets:4,reps:"10-12",notes:"3-sec negative.",primary:false},
        {name:"Calf Raise",sets:5,reps:"15",notes:"",primary:false},
      ],
    },
    "Push": {
      novice: [
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"Volume day. Upper chest.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
        {name:"Push Up",sets:2,reps:"max",notes:"Burnout.",primary:false},
      ],
      advanced: [
        {name:"Incline Dumbbell Press",sets:4,reps:"8-10",notes:"2-sec descent.",primary:false},
        {name:"Cable Fly",sets:5,reps:"12-15",notes:"Full stretch + squeeze. This is hypertrophy day.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Lateral Raise",sets:6,reps:"15-20",notes:"Rest-pause on last 2 sets.",primary:false},
        {name:"Skull Crusher",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:4,reps:"10-12",notes:"Long head emphasis.",primary:false},
        {name:"Cable Crossover",sets:3,reps:"15",notes:"Inner chest finisher.",primary:false},
      ],
    },
    "Pull": {
      novice: [
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"3-5",notes:"Add 10lbs when all reps completed.",primary:true},
        {name:"Lat Pulldown",sets:4,reps:"8-10",notes:"Full stretch.",primary:false},
        {name:"Cable Row",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Face Pull",sets:5,reps:"20",notes:"",primary:false},
        {name:"Incline Dumbbell Curl",sets:4,reps:"10-12",notes:"Long head stretch.",primary:false},
        {name:"Hammer Curl",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Cable Curl",sets:3,reps:"15",notes:"Constant tension.",primary:false},
        {name:"Rear Delt Fly",sets:3,reps:"20",notes:"",primary:false},
      ],
    },
    "Legs": {
      novice: [
        {name:"Leg Press",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Walking Lunge",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Hack Squat",sets:5,reps:"8-10",notes:"Deep range. High foot placement for quad emphasis.",primary:false},
        {name:"Walking Lunge",sets:4,reps:"15 each",notes:"",primary:false},
        {name:"Leg Extension",sets:5,reps:"15-20",notes:"Squeeze at top. Hypertrophy focus.",primary:false},
        {name:"Leg Curl",sets:5,reps:"12-15",notes:"3-sec negative.",primary:false},
        {name:"Bulgarian Split Squat",sets:4,reps:"8-10 each",notes:"",primary:false},
        {name:"Calf Raise",sets:7,reps:"20",notes:"",primary:false},
        {name:"Ab Wheel Rollout",sets:4,reps:"12",notes:"",primary:false},
      ],
    },
  },

  // ── 5-day Bro Split ─────────────────────────────────────────────────────────
  "Bro Split": {
    "Chest": {
      novice: [
        {name:"Dumbbell Bench Press",sets:3,reps:"12-15",notes:"Feel the chest stretch. Control the weight.",primary:false},
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"Upper chest. 30-45 degree angle.",primary:false},
        {name:"Cable Fly",sets:3,reps:"12-15",notes:"Constant tension. Focus on the squeeze.",primary:false},
        {name:"Push Up",sets:3,reps:"max",notes:"Burnout. Go to failure.",primary:false},
      ],
      advanced: [
        {name:"Barbell Bench Press",sets:5,reps:"4-6",notes:"Primary strength movement. Add 5lbs when all reps completed.",primary:true},
        {name:"Incline Dumbbell Press",sets:5,reps:"6-8",notes:"2-sec controlled descent.",primary:false},
        {name:"Decline Barbell Press",sets:4,reps:"8-10",notes:"Lower chest emphasis.",primary:false},
        {name:"Cable Fly",sets:5,reps:"12-15",notes:"Full stretch. Superset with push ups on last 2 sets.",primary:false},
        {name:"Dumbbell Fly",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Cable Crossover",sets:3,reps:"15",notes:"Inner chest finisher.",primary:false},
        {name:"Push Up",sets:3,reps:"failure",notes:"Burnout.",primary:false},
      ],
    },
    "Back": {
      novice: [
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Pull to upper chest. Elbows drive down and back.",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"12-15",notes:"Single arm. Full range — chest stays proud.",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"Squeeze shoulder blades at end.",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"Rear delt and rotator cuff.",primary:false},
        {name:"Assisted Pull Up",sets:2,reps:"8",notes:"Or negative pull ups — jump up, lower slowly.",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"3-5",notes:"Add 10lbs when all reps completed.",primary:true},
        {name:"Barbell Row",sets:5,reps:"4-6",notes:"Chest nearly touches bar. Controlled descent.",primary:true},
        {name:"Weighted Pull Up",sets:4,reps:"4-8",notes:"Dead hang to chin over bar. Add weight.",primary:false},
        {name:"Lat Pulldown",sets:4,reps:"8-10",notes:"Full stretch at top.",primary:false},
        {name:"Cable Row",sets:4,reps:"8-12",notes:"",primary:false},
        {name:"Dumbbell Row",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Face Pull",sets:4,reps:"20",notes:"Non-negotiable.",primary:false},
      ],
    },
    "Shoulders": {
      novice: [
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12-15",notes:"Stop 2-3 reps from failure.",primary:false},
        {name:"Lateral Raise",sets:4,reps:"15",notes:"Light weight. Lead with elbows. Full range.",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"Rear delt health.",primary:false},
        {name:"Front Raise",sets:3,reps:"12",notes:"Alternate arms.",primary:false},
        {name:"Rear Delt Fly",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Overhead Press",sets:6,reps:"4-6",notes:"Heavy. Add 5lbs when all reps completed.",primary:true},
        {name:"Arnold Press",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Lateral Raise",sets:6,reps:"15-20",notes:"Rest-pause on last 2 sets. This is the shoulder width exercise.",primary:false},
        {name:"Face Pull",sets:5,reps:"20",notes:"",primary:false},
        {name:"Rear Delt Fly",sets:5,reps:"15",notes:"",primary:false},
        {name:"Shrug",sets:5,reps:"10-12",notes:"Hold at top for 1 second.",primary:false},
        {name:"Upright Row",sets:3,reps:"12",notes:"",primary:false},
      ],
    },
    "Arms": {
      novice: [
        {name:"Dumbbell Curl",sets:3,reps:"12-15",notes:"Slow — feel the bicep work. No swinging.",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"Full extension at bottom.",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:3,reps:"15",notes:"Long head emphasis.",primary:false},
        {name:"Concentration Curl",sets:2,reps:"12",notes:"Squeeze hard at top.",primary:false},
      ],
      advanced: [
        {name:"Barbell Curl",sets:5,reps:"6-8",notes:"Primary bicep strength movement. Add 5lbs.",primary:true},
        {name:"Skull Crusher",sets:5,reps:"6-8",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Incline Dumbbell Curl",sets:4,reps:"8-10",notes:"Long head stretch. Don't let elbows drift forward.",primary:false},
        {name:"Close Grip Bench Press",sets:4,reps:"6-8",notes:"Elbows tucked. Tricep strength.",primary:false},
        {name:"Hammer Curl",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:4,reps:"10-12",notes:"Long head emphasis.",primary:false},
        {name:"Concentration Curl",sets:3,reps:"12",notes:"Full contraction.",primary:false},
        {name:"Cable Tricep Kickback",sets:3,reps:"15",notes:"Full extension at end.",primary:false},
        {name:"Cable Curl",sets:3,reps:"15",notes:"Constant tension.",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
      ],
    },
    "Legs": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"Hold dumbbell at chest. Full depth.",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Walking Lunge",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"4-6",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Romanian Deadlift",sets:5,reps:"6-8",notes:"Heavy hinge. Add weight weekly.",primary:false},
        {name:"Leg Press",sets:5,reps:"10-12",notes:"",primary:false},
        {name:"Walking Lunge",sets:4,reps:"12 each",notes:"",primary:false},
        {name:"Leg Extension",sets:4,reps:"15-20",notes:"",primary:false},
        {name:"Leg Curl",sets:4,reps:"12-15",notes:"3-sec negative.",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Calf Raise",sets:7,reps:"15-20",notes:"",primary:false},
      ],
    },
  },

  // ── 6-day PPL x2 ────────────────────────────────────────────────────────────
  "Push/Pull/Legs x2": {
    "Push A": {
      novice: [
        {name:"Dumbbell Bench Press",sets:3,reps:"10-12",notes:"Heavy(ish) day. Still controlled.",primary:false},
        {name:"Dumbbell Overhead Press",sets:3,reps:"10-12",notes:"",primary:false},
        {name:"Incline Dumbbell Press",sets:3,reps:"12",notes:"",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Bench Press",sets:5,reps:"3-5",notes:"Heavy day. This is your primary push strength session.",primary:true},
        {name:"Overhead Press",sets:5,reps:"3-5",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Incline Dumbbell Press",sets:4,reps:"6-8",notes:"2-sec descent.",primary:false},
        {name:"Lateral Raise",sets:5,reps:"12-15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Skull Crusher",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Cable Fly",sets:3,reps:"15",notes:"",primary:false},
      ],
    },
    "Pull A": {
      novice: [
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Heavy(ish) pull session.",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Deadlift",sets:5,reps:"2-4",notes:"Heaviest lift of the week.",primary:true},
        {name:"Barbell Row",sets:5,reps:"3-5",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Weighted Pull Up",sets:4,reps:"5-8",notes:"",primary:false},
        {name:"Face Pull",sets:5,reps:"20",notes:"",primary:false},
        {name:"Barbell Curl",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Hammer Curl",sets:4,reps:"8-10",notes:"",primary:false},
        {name:"Incline Dumbbell Curl",sets:3,reps:"10-12",notes:"Long head.",primary:false},
      ],
    },
    "Legs A": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"Heavy(ish) leg session.",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"3-5",notes:"Heavy. Add 5lbs when all reps completed.",primary:true},
        {name:"Romanian Deadlift",sets:4,reps:"5-7",notes:"",primary:false},
        {name:"Leg Press",sets:4,reps:"8-12",notes:"",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"8-10 each",notes:"",primary:false},
        {name:"Leg Curl",sets:4,reps:"10-12",notes:"3-sec negative.",primary:false},
        {name:"Calf Raise",sets:6,reps:"15",notes:"",primary:false},
      ],
    },
    "Push B": {
      novice: [
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"Volume day. Upper chest focus.",primary:false},
        {name:"Cable Fly",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
        {name:"Push Up",sets:2,reps:"max",notes:"",primary:false},
      ],
      advanced: [
        {name:"Incline Dumbbell Press",sets:5,reps:"8-10",notes:"Volume day — hypertrophy focus.",primary:false},
        {name:"Cable Fly",sets:5,reps:"12-15",notes:"Full stretch. Squeeze hard.",primary:false},
        {name:"Dumbbell Shoulder Press",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Lateral Raise",sets:6,reps:"15-20",notes:"Rest-pause on last 2 sets.",primary:false},
        {name:"Rear Delt Fly",sets:4,reps:"15-20",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:4,reps:"10-12",notes:"Long head.",primary:false},
        {name:"Tricep Pushdown",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Cable Crossover",sets:3,reps:"15",notes:"",primary:false},
      ],
    },
    "Pull B": {
      novice: [
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"Volume pull day.",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Lat Pulldown",sets:5,reps:"8-10",notes:"Volume day. Full stretch at top.",primary:false},
        {name:"Cable Row",sets:5,reps:"10-12",notes:"",primary:false},
        {name:"Dumbbell Row",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Face Pull",sets:5,reps:"20",notes:"",primary:false},
        {name:"Incline Dumbbell Curl",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Cable Curl",sets:4,reps:"12-15",notes:"Constant tension.",primary:false},
        {name:"Hammer Curl",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Rear Delt Fly",sets:3,reps:"20",notes:"",primary:false},
      ],
    },
    "Legs B": {
      novice: [
        {name:"Leg Press",sets:3,reps:"15",notes:"Volume leg day.",primary:false},
        {name:"Walking Lunge",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Hack Squat",sets:5,reps:"8-10",notes:"Volume day. Deep range of motion.",primary:false},
        {name:"Walking Lunge",sets:4,reps:"15 each",notes:"",primary:false},
        {name:"Leg Extension",sets:5,reps:"15-20",notes:"Squeeze at top.",primary:false},
        {name:"Leg Curl",sets:5,reps:"12-15",notes:"3-sec negative.",primary:false},
        {name:"Bulgarian Split Squat",sets:4,reps:"8-10 each",notes:"",primary:false},
        {name:"Calf Raise",sets:7,reps:"20",notes:"",primary:false},
        {name:"Ab Wheel Rollout",sets:4,reps:"12-15",notes:"",primary:false},
      ],
    },
  },

  // ── 6-day Arnold Split ───────────────────────────────────────────────────────
  "Arnold Split": {
    "Chest+Back A": {
      novice: [
        {name:"Dumbbell Bench Press",sets:3,reps:"12-15",notes:"Heavy day. Focus on feel.",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Cable Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Fly",sets:3,reps:"15",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Bench Press",sets:5,reps:"4-6",notes:"Superset with Pull Up for maximum pump.",primary:true},
        {name:"Pull Up",sets:5,reps:"6-8",notes:"Superset with Bench. Weighted if possible.",primary:true},
        {name:"Incline Dumbbell Press",sets:4,reps:"6-8",notes:"Superset with Barbell Row.",primary:false},
        {name:"Barbell Row",sets:4,reps:"6-8",notes:"Superset with Incline Press.",primary:true},
        {name:"Cable Fly",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"10-12",notes:"",primary:false},
        {name:"Face Pull",sets:4,reps:"20",notes:"",primary:false},
      ],
    },
    "Shoulders+Arms A": {
      novice: [
        {name:"Dumbbell Shoulder Press",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
        {name:"Dumbbell Curl",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Overhead Press",sets:5,reps:"4-6",notes:"Heavy shoulder strength session.",primary:true},
        {name:"Arnold Press",sets:4,reps:"8-10",notes:"The signature movement. Full rotation.",primary:false},
        {name:"Lateral Raise",sets:5,reps:"12-15",notes:"",primary:false},
        {name:"Barbell Curl",sets:5,reps:"6-8",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Skull Crusher",sets:5,reps:"6-8",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Incline Dumbbell Curl",sets:3,reps:"10-12",notes:"Long head.",primary:false},
        {name:"Close Grip Bench Press",sets:3,reps:"8-10",notes:"Tricep strength.",primary:false},
        {name:"Hammer Curl",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Overhead Tricep Extension",sets:3,reps:"12",notes:"",primary:false},
      ],
    },
    "Legs A": {
      novice: [
        {name:"Goblet Squat",sets:3,reps:"12-15",notes:"",primary:true},
        {name:"Leg Press",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Barbell Squat",sets:5,reps:"4-6",notes:"Add 5lbs when all reps completed.",primary:true},
        {name:"Leg Press",sets:5,reps:"8-12",notes:"",primary:false},
        {name:"Romanian Deadlift",sets:4,reps:"6-8",notes:"",primary:false},
        {name:"Leg Extension",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Leg Curl",sets:4,reps:"10-12",notes:"3-sec negative.",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Calf Raise",sets:6,reps:"15-20",notes:"",primary:false},
      ],
    },
    "Chest+Back B": {
      novice: [
        {name:"Incline Dumbbell Press",sets:3,reps:"12-15",notes:"Volume day.",primary:false},
        {name:"Lat Pulldown",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Cable Fly",sets:3,reps:"15",notes:"",primary:false},
        {name:"Dumbbell Row",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Push Up",sets:3,reps:"max",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Incline Barbell Press",sets:5,reps:"5-7",notes:"Volume day — upper chest.",primary:false},
        {name:"Lat Pulldown",sets:5,reps:"8-10",notes:"Full stretch.",primary:false},
        {name:"Cable Fly",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Dumbbell Row",sets:4,reps:"10-12",notes:"",primary:false},
        {name:"Push Up",sets:3,reps:"failure",notes:"Drop set burnout.",primary:false},
        {name:"Face Pull",sets:5,reps:"20",notes:"",primary:false},
        {name:"Cable Crossover",sets:3,reps:"15",notes:"Inner chest.",primary:false},
      ],
    },
    "Shoulders+Arms B": {
      novice: [
        {name:"Machine Shoulder Press",sets:3,reps:"12-15",notes:"Volume day.",primary:false},
        {name:"Lateral Raise",sets:3,reps:"15",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
        {name:"Incline Dumbbell Curl",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Tricep Pushdown",sets:3,reps:"15",notes:"",primary:false},
        {name:"Hammer Curl",sets:3,reps:"15",notes:"",primary:false},
      ],
      advanced: [
        {name:"Dumbbell Shoulder Press",sets:5,reps:"10-12",notes:"Volume day — hypertrophy.",primary:false},
        {name:"Lateral Raise",sets:6,reps:"15-20",notes:"Rest-pause on last 2 sets.",primary:false},
        {name:"Rear Delt Fly",sets:5,reps:"12-15",notes:"",primary:false},
        {name:"Incline Dumbbell Curl",sets:5,reps:"10-12",notes:"Long head stretch.",primary:false},
        {name:"Tricep Pushdown",sets:5,reps:"12-15",notes:"",primary:false},
        {name:"Cable Curl",sets:4,reps:"12-15",notes:"",primary:false},
        {name:"Diamond Push Up",sets:3,reps:"failure",notes:"",primary:false},
        {name:"Face Pull",sets:3,reps:"20",notes:"",primary:false},
      ],
    },
    "Legs B": {
      novice: [
        {name:"Leg Press",sets:3,reps:"15",notes:"Volume leg day.",primary:false},
        {name:"Dumbbell Romanian Deadlift",sets:3,reps:"12-15",notes:"",primary:false},
        {name:"Walking Lunge",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Leg Extension",sets:3,reps:"15",notes:"",primary:false},
        {name:"Leg Curl",sets:3,reps:"15",notes:"",primary:false},
        {name:"Calf Raise",sets:3,reps:"20",notes:"",primary:false},
      ],
      advanced: [
        {name:"Hack Squat",sets:5,reps:"8-10",notes:"Volume day — quad emphasis.",primary:false},
        {name:"Romanian Deadlift",sets:5,reps:"10-12",notes:"",primary:false},
        {name:"Walking Lunge",sets:4,reps:"12 each",notes:"",primary:false},
        {name:"Leg Extension",sets:5,reps:"15-20",notes:"",primary:false},
        {name:"Leg Curl",sets:5,reps:"12-15",notes:"3-sec negative.",primary:false},
        {name:"Bulgarian Split Squat",sets:3,reps:"10 each",notes:"",primary:false},
        {name:"Calf Raise",sets:7,reps:"20",notes:"",primary:false},
        {name:"Hanging Leg Raise",sets:4,reps:"15",notes:"",primary:false},
      ],
    },
  },
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

// ─── CONDITIONING PROGRAMS ────────────────────────────────────────────────────
export const CONDITIONING_PROGRAMS = {
  "HIIT Program": {
    description: "3 days per week of high-intensity interval training. Tabata, EMOM, and AMRAP formats. No equipment needed.",
    days: ["Tabata", "EMOM", "AMRAP"],
    workouts: {
      "Tabata": [
        { name:"Tabata Block", sets:8, reps:"20 sec on / 10 sec off", notes:"8 rounds total. Cycle through: Burpees → Jump Squats → Mountain Climbers → High Knees. 4 min total. Rest 1 min then repeat 2 more times.", primary:true },
        { name:"Burpees", sets:2, reps:"20 sec", notes:"Full burpee — chest to ground. Maximum effort.", primary:false },
        { name:"Jump Squats", sets:2, reps:"20 sec", notes:"Explosive — land soft.", primary:false },
        { name:"Mountain Climbers", sets:2, reps:"20 sec", notes:"Drive knees to chest fast.", primary:false },
        { name:"High Knees", sets:2, reps:"20 sec", notes:"Drive arms, stay on balls of feet.", primary:false },
      ],
      "EMOM": [
        { name:"EMOM 20 min — Push Up / Air Squat", sets:20, reps:"Every minute on the minute", notes:"Odd minutes: 10 Push Ups. Even minutes: 10 Air Squats. Scale reps if needed — rest of the minute is your rest.", primary:true },
        { name:"Push Up", sets:10, reps:"10", notes:"Odd minutes. Chest to floor, full lockout.", primary:false },
        { name:"Air Squat", sets:10, reps:"10", notes:"Even minutes. Below parallel, stand tall.", primary:false },
      ],
      "AMRAP": [
        { name:"AMRAP 15 min", sets:1, reps:"As many rounds as possible", notes:"15 minutes straight. Complete rounds of: 5 Pull Ups → 10 Push Ups → 15 Air Squats. Note total rounds + reps at end.", primary:true },
        { name:"Pull Up", sets:1, reps:"5 per round", notes:"Full hang to chin over bar. Scale to ring rows if needed.", primary:false },
        { name:"Push Up", sets:1, reps:"10 per round", notes:"Chest to floor. No sagging hips.", primary:false },
        { name:"Air Squat", sets:1, reps:"15 per round", notes:"Hips below parallel every rep.", primary:false },
      ],
    }
  },
  "Full Body Circuit": {
    description: "3 days per week. Two circuits, 4 rounds each. Minimal rest — keeps heart rate elevated while building strength.",
    days: ["Circuit A", "Circuit B", "Circuit A/B"],
    workouts: {
      "Circuit A": [
        { name:"Circuit A — 4 rounds", sets:4, reps:"12 reps each / 30 sec rest between rounds", notes:"Complete all exercises back to back, then rest 30 seconds. 4 total rounds.", primary:true },
        { name:"Squat", sets:4, reps:"12", notes:"Barbell or goblet. Full depth.", primary:false },
        { name:"Push Up", sets:4, reps:"12", notes:"Add weight vest or elevate feet to progress.", primary:false },
        { name:"Dumbbell Row", sets:4, reps:"12 each", notes:"Single arm. Full row — elbow to hip.", primary:false },
        { name:"Walking Lunge", sets:4, reps:"12 each leg", notes:"Knee just above floor.", primary:false },
        { name:"Plank", sets:4, reps:"30 sec", notes:"Hold position — squeeze everything.", primary:false },
      ],
      "Circuit B": [
        { name:"Circuit B — 4 rounds", sets:4, reps:"10 reps each / 30 sec rest", notes:"Complete all exercises back to back, then rest 30 seconds. 4 total rounds.", primary:true },
        { name:"Deadlift", sets:4, reps:"10", notes:"Hinge, brace, drive hips forward. Add 10lbs when all reps easy.", primary:true },
        { name:"Overhead Press", sets:4, reps:"10", notes:"Bar or dumbbells. Full lockout at top.", primary:false },
        { name:"Pull Up", sets:4, reps:"10", notes:"Scale to assisted or ring rows.", primary:false },
        { name:"Step Up", sets:4, reps:"10 each", notes:"Box or bench. Drive through heel.", primary:false },
        { name:"Ab Wheel Rollout", sets:4, reps:"10", notes:"Full extension — don't let hips sag.", primary:false },
      ],
      "Circuit A/B": [
        { name:"Circuit A — 2 rounds", sets:2, reps:"12 reps each / 30 sec rest", notes:"First 2 rounds: Circuit A movements.", primary:true },
        { name:"Squat", sets:2, reps:"12", notes:"", primary:false },
        { name:"Push Up", sets:2, reps:"12", notes:"", primary:false },
        { name:"Dumbbell Row", sets:2, reps:"12 each", notes:"", primary:false },
        { name:"Circuit B — 2 rounds", sets:2, reps:"10 reps each / 30 sec rest", notes:"Last 2 rounds: Circuit B movements.", primary:true },
        { name:"Deadlift", sets:2, reps:"10", notes:"", primary:false },
        { name:"Overhead Press", sets:2, reps:"10", notes:"", primary:false },
        { name:"Ab Wheel Rollout", sets:2, reps:"10", notes:"", primary:false },
      ],
    }
  }
};

// ─── STRONGLIFTS 5×5 ─────────────────────────────────────────────────────────
export const STRONGLIFTS_5x5 = {
  description: "The most proven beginner strength program. 3 days per week, alternating A/B. Add weight every session.",
  days: ["Workout A", "Workout B"],
  alternating: true,
  progression: { upper: 5, squat: 10, deadlift: 10 },
  note: "Alternate A and B each session. Add 5 lbs to upper body lifts and 10 lbs to Squat and Deadlift after every completed session.",
  workouts: {
    "Workout A": [
      { name:"Barbell Squat", sets:5, reps:"5", notes:"5×5. Add 10lbs every session when all 25 reps completed. If you fail 3 sessions in a row, deload 10%.", primary:true },
      { name:"Barbell Bench Press", sets:5, reps:"5", notes:"5×5. Add 5lbs every session. Alternate bench/OHP — bench is Workout A.", primary:true },
      { name:"Barbell Row", sets:5, reps:"5", notes:"5×5. Pendlay row — bar from floor each rep. Add 5lbs every session.", primary:true },
    ],
    "Workout B": [
      { name:"Barbell Squat", sets:5, reps:"5", notes:"5×5. Same as Workout A. Squat every session — it's the spine of this program.", primary:true },
      { name:"Overhead Press", sets:5, reps:"5", notes:"5×5. Add 5lbs every session. Alternates with Bench Press.", primary:true },
      { name:"Deadlift", sets:1, reps:"5", notes:"1×5 only — not 5×5. Deadlift is the hardest lift to recover from. Add 10lbs every session.", primary:true },
    ],
  }
};

// ─── PROGRAM LIBRARY METADATA ─────────────────────────────────────────────────
// Used by the Library screen to display all available programs with metadata
export const PROGRAM_LIBRARY = [
  // HYPERTROPHY
  { id:"ppl_6",     name:"Push/Pull/Legs",          category:"Hypertrophy", days:6, weeks:12, level:"Intermediate", bestFor:"Maximum muscle growth with optimal frequency",    splitKey:"Push/Pull/Legs x2" },
  { id:"arnold",    name:"Arnold Split",             category:"Hypertrophy", days:6, weeks:12, level:"Advanced",     bestFor:"Advanced bodybuilders wanting maximum volume",     splitKey:"Arnold Split" },
  { id:"upper_lower",name:"Upper/Lower",             category:"Hypertrophy", days:4, weeks:12, level:"Beginner",     bestFor:"First split — science-backed frequency",           splitKey:"Upper/Lower" },
  { id:"bro_split", name:"Bro Split",                category:"Hypertrophy", days:5, weeks:12, level:"Intermediate", bestFor:"Max isolation volume per muscle group",            splitKey:"Bro Split" },
  { id:"full_body", name:"Full Body",                category:"Hypertrophy", days:3, weeks:8,  level:"Beginner",     bestFor:"Beginners and those short on time",                splitKey:"Full Body A/B/A" },
  // STRENGTH
  { id:"powerbuilding",name:"Powerbuilding Upper/Lower",category:"Strength",days:4, weeks:12, level:"Intermediate", bestFor:"Build strength and size simultaneously",           splitKey:"Upper/Lower" },
  { id:"5_3_1",     name:"5/3/1",                    category:"Strength", days:4, weeks:null, level:"Intermediate", bestFor:"Long-term strength progression",                   splitKey:null, comingSoon:true },
  { id:"sl5x5",     name:"Stronglifts 5×5",          category:"Strength", days:3, weeks:12,  level:"Beginner",     bestFor:"Pure beginner strength foundation",                splitKey:null, comingSoon:true },
  // FAT LOSS & CONDITIONING
  { id:"circuit",   name:"Full Body Circuit",        category:"Fat Loss & Conditioning", days:3, weeks:8, level:"Beginner", bestFor:"Fat loss while maintaining muscle",         splitKey:null, isConditioning:true },
  { id:"hiit",      name:"HIIT Program",             category:"Fat Loss & Conditioning", days:3, weeks:6, level:"Beginner", bestFor:"Maximum calorie burn in minimum time",      splitKey:null, isConditioning:true },
  { id:"metabolic", name:"Metabolic Resistance",     category:"Fat Loss & Conditioning", days:4, weeks:8, level:"Intermediate", bestFor:"Strength + cardio hybrid for fat loss", splitKey:null, comingSoon:true },
  // RUNNING
  { id:"c25k",      name:"Couch to 5K",             category:"Running", days:3, weeks:8,  level:"Beginner",     bestFor:"Complete beginners — first 5K ever",               splitKey:null, isRun:true },
  { id:"5k_sub25",  name:"Sub-25 5K",               category:"Running", days:4, weeks:8,  level:"Intermediate", bestFor:"Break 25 minutes for the 5K distance",            splitKey:null, isRun:true },
  { id:"10k",       name:"10K Training",            category:"Running", days:4, weeks:10, level:"Intermediate", bestFor:"Build to 10K from a 5K base",                     splitKey:null, isRun:true },
  { id:"half",      name:"Half Marathon",           category:"Running", days:5, weeks:16, level:"Intermediate", bestFor:"First half marathon or sub-2hr goal",              splitKey:null, isRun:true },
  // HYROX
  { id:"hyrox_12w", name:"12-Week Race Prep",       category:"Hyrox",   days:5, weeks:12, level:"Intermediate", bestFor:"First Hyrox or improving race time",              splitKey:null, isHyrox:true },
  // HYBRID
  { id:"strength_run",  name:"Strength-Biased Hybrid",  category:"Hybrid", days:5, weeks:12, level:"Intermediate", bestFor:"Lifters adding a running base",               splitKey:null, isHybrid:true },
  { id:"upper_lower_run",name:"Run-Biased Hybrid",       category:"Hybrid", days:6, weeks:12, level:"Advanced",    bestFor:"Runners adding strength training",             splitKey:null, isHybrid:true },
  { id:"balanced_hybrid",name:"Balanced Hybrid",         category:"Hybrid", days:5, weeks:12, level:"Intermediate", bestFor:"Equal strength and endurance development",   splitKey:null, isHybrid:true },
  { id:"ppl_hyrox",     name:"Hyrox Hybrid",            category:"Hybrid", days:5, weeks:12, level:"Advanced",    bestFor:"Strength athletes preparing for Hyrox",       splitKey:null, isHybrid:true, isHyrox:true },
  // GLUTE FOCUS
  { id:"glute_3", name:"Glute Focus 3-Day",        category:"Glute Focus", days:3, weeks:10, level:"Beginner",     bestFor:"Hip thrust-led glute development",            splitKey:"Glute Focus 3-Day" },
  { id:"glute_4", name:"Glute Focus 4-Day",        category:"Glute Focus", days:4, weeks:10, level:"Intermediate", bestFor:"Serious glute and lower body recomposition",  splitKey:"Glute Focus 4-Day" },
  { id:"lower_5", name:"Lower Body Only 5-Day",   category:"Glute Focus", days:5, weeks:10, level:"Advanced",     bestFor:"Maximum lower body volume and frequency",     splitKey:"Lower Body Only 5-Day" },
];

export function getWorkoutForDay(daysPerWeek, splitType, dayIndex, equipment, history, skillLevel) {
  const days = daysPerWeek || 4;
  const program = PROGRAMS_BY_DAYS[days];
  if(!program) return null;

  const split = program.splits[splitType] || program.splits[program.recommended];
  if(!split) return null;

  const dayKeys = split.days;
  const dayKey = dayKeys[dayIndex % dayKeys.length];
  const intermediate = split.workouts[dayKey] || [];

  // Resolve skill level → override key
  const skillKey = (skillLevel === 'beginner' || skillLevel === 'novice') ? 'novice' :
                   (skillLevel === 'advanced' || skillLevel === 'elite')   ? 'advanced' : null;

  // Look up per-split overrides; fall back to intermediate
  const splitOverrides = SKILL_OVERRIDES[splitType];
  const exercises = (skillKey && splitOverrides?.[dayKey]?.[skillKey]) ? splitOverrides[dayKey][skillKey] : intermediate;

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

// ─── PREGNANCY PROGRAM ────────────────────────────────────────────────────────
export const PREGNANCY_PROGRAM = {
  trimester1: {
    label: "First Trimester (Weeks 1–12)",
    sessionsPerWeek: 3,
    intensity: "moderate",
    note: "Energy may dip in first trimester. Listen to your body. Nausea, fatigue, and dizziness are common — reduce intensity accordingly.",
    exercises: [
      { name:"Goblet Squat",         sets:3, reps:"12–15", notes:"Safe T1 squat. Focus on depth you're comfortable with.", safe:[1,2] },
      { name:"Seated Dumbbell Press",sets:3, reps:"10–12", notes:"Seated version removes lumbar strain.", safe:[1,2,3] },
      { name:"Cable Row",            sets:3, reps:"12–15", notes:"Seated, neutral spine.", safe:[1,2,3] },
      { name:"Lat Pulldown",         sets:3, reps:"12–15", notes:"Excellent upper back compound.", safe:[1,2,3] },
      { name:"Romanian Deadlift",    sets:3, reps:"10–12", notes:"Light weight. Hinge pattern. Stop at shin height T3.", safe:[1,2] },
      { name:"Dead Bug",             sets:3, reps:"8–10 each", notes:"Core stability without spinal flexion.", safe:[1,2,3] },
      { name:"Pelvic Floor Breathing",sets:3,reps:"10 breaths", notes:"Inhale to expand, exhale to activate pelvic floor.", safe:[1,2,3] },
      { name:"Side-Lying Hip Abduction",sets:3,reps:"15 each side",notes:"Glute medius activation. Safe all trimesters.",safe:[1,2,3]},
      { name:"Calf Raise",           sets:3, reps:"15–20", notes:"Helps circulation. Hold wall for balance.", safe:[1,2,3] },
    ],
  },
  trimester2: {
    label: "Second Trimester (Weeks 13–27)",
    sessionsPerWeek: 3,
    intensity: "light-moderate",
    note: "Most women feel best in T2. Avoid lying flat on back after week 16. Modify all pressing and core work accordingly.",
    exercises: [
      { name:"Goblet Squat",          sets:3, reps:"12–15", notes:"Feet wider as belly grows.", safe:[2] },
      { name:"Seated Dumbbell Press", sets:3, reps:"10–12", notes:"Must be seated — no supine pressing.", safe:[2] },
      { name:"Incline Dumbbell Press",sets:3, reps:"10–12", notes:"45° incline bench only. Not flat.", safe:[2] },
      { name:"Cable Row",             sets:3, reps:"12–15", notes:"Seated, upright posture.", safe:[2] },
      { name:"Lat Pulldown",          sets:3, reps:"12–15", notes:"", safe:[2] },
      { name:"Hip Thrust (bodyweight)",sets:3,reps:"15",    notes:"Bodyweight only. Elevated shoulders on bench.", safe:[2] },
      { name:"Dead Bug",              sets:3, reps:"8 each",notes:"Core stability — no crunch or sit-up.", safe:[2] },
      { name:"Pelvic Floor Breathing",sets:3, reps:"10",    notes:"Foundation of all postpartum recovery.", safe:[2] },
      { name:"Side-Lying Hip Abduction",sets:3,reps:"15 each",notes:"", safe:[2] },
      { name:"Standing Calf Raise",   sets:3, reps:"20",    notes:"Hold wall. Helps with swelling.", safe:[2] },
    ],
  },
  trimester3: {
    label: "Third Trimester (Weeks 28–40)",
    sessionsPerWeek: 2,
    intensity: "light",
    note: "Comfort over performance. Relaxin hormone increases injury risk — avoid ballistic movement. Stay cool, stay hydrated.",
    exercises: [
      { name:"Goblet Squat",            sets:2, reps:"10–12", notes:"Use support if needed for balance.", safe:[3] },
      { name:"Seated Dumbbell Press",   sets:2, reps:"10",    notes:"Light weight only.", safe:[3] },
      { name:"Cable Row",               sets:2, reps:"12",    notes:"Focus on posture.", safe:[3] },
      { name:"Lat Pulldown",            sets:2, reps:"12",    notes:"Light weight.", safe:[3] },
      { name:"Standing Hip Abduction",  sets:2, reps:"15 each",notes:"Standing with band. Hold support.", safe:[3] },
      { name:"Pelvic Floor Breathing",  sets:4, reps:"10",    notes:"Most important exercise of pregnancy.", safe:[3] },
      { name:"Seated Dead Bug",         sets:2, reps:"8 each",notes:"Seated chair version.", safe:[3] },
      { name:"Gentle Walking",          sets:1, reps:"20–30 min",notes:"Best cardio T3. Pace: conversational.", safe:[3] },
    ],
  },
};

// ─── POSTPARTUM PROGRAM ───────────────────────────────────────────────────────
export const POSTPARTUM_PROGRAM = {
  phase1: {
    label: "Phase 1 — Recovery (Weeks 0–6)",
    weeks: "0–6",
    sessionsPerWeek: 1,
    csectionDelay: 2,
    exercises: [
      { name:"Diaphragmatic Breathing",    sets:3, reps:"10 breaths", notes:"Inhale 4s — ribcage 360° expansion. Exhale 6s — gentle pelvic floor lift." },
      { name:"Pelvic Floor Contractions",  sets:3, reps:"10 × 5s holds", notes:"Slow hold and full release. Quality over quantity." },
      { name:"Heel Slides",                sets:2, reps:"10 each side", notes:"Brace core gently. No breath-holding." },
      { name:"Gentle Walking",             sets:1, reps:"5–15 min", notes:"Start at 5 min. Add 5 min each day if comfortable." },
    ],
  },
  phase2: {
    label: "Phase 2 — Rebuild (Weeks 6–12)",
    weeks: "6–12",
    sessionsPerWeek: 2,
    csectionDelay: 2,
    exercises: [
      { name:"Pelvic Floor Breathing",     sets:3, reps:"10",         notes:"Continue daily." },
      { name:"Glute Bridge",               sets:3, reps:"15",         notes:"Feel glutes fire, not back. Feet flat." },
      { name:"Bird Dog",                   sets:3, reps:"10 each",    notes:"Opposite arm and leg. Stable pelvis." },
      { name:"Bodyweight Squat",           sets:3, reps:"12–15",      notes:"Full ROM. Stop if pressure or leaking." },
      { name:"Modified Push-Up (knees)",   sets:2, reps:"10–12",      notes:"Core engaged. Hips in line." },
      { name:"Side-Lying Hip Abduction",   sets:3, reps:"15 each",    notes:"Band optional. Glute medius." },
      { name:"Dead Bug",                   sets:3, reps:"8 each",     notes:"Core reconnection without spinal flexion." },
    ],
  },
  phase3: {
    label: "Phase 3 — Restore (Weeks 12–26)",
    weeks: "3–6 months",
    sessionsPerWeek: 3,
    csectionDelay: 2,
    exercises: [
      { name:"Goblet Squat",               sets:3, reps:"12",         notes:"Light dumbbell. Monitor for symptoms." },
      { name:"Romanian Deadlift",          sets:3, reps:"12",         notes:"50–60% working weight." },
      { name:"Dumbbell Row",               sets:3, reps:"12 each",    notes:"Supported on bench." },
      { name:"Dumbbell Overhead Press",    sets:3, reps:"12",         notes:"Seated. Light load." },
      { name:"Hip Thrust",                 sets:3, reps:"15",         notes:"Barbell or bodyweight depending on comfort." },
      { name:"Glute Bridge",               sets:3, reps:"15",         notes:"Loaded if Phase 2 felt strong." },
      { name:"Plank",                      sets:3, reps:"20–30s",     notes:"Stop if doming or leaking occurs." },
    ],
  },
  phase4: {
    label: "Phase 4 — Return (Months 6–12)",
    weeks: "6–12 months",
    sessionsPerWeek: 3,
    csectionDelay: 2,
    note: "Gradual return to full program. Individual response varies widely — listen to your body every session.",
    exercises: [
      { name:"Barbell Squat",              sets:4, reps:"8–10",       notes:"Start at 50% pre-pregnancy weight." },
      { name:"Romanian Deadlift",          sets:4, reps:"10",         notes:"Progressive loading from Phase 3." },
      { name:"Barbell Bench Press",        sets:3, reps:"10",         notes:"Return to flat bench if no symptoms." },
      { name:"Barbell Row",                sets:3, reps:"10",         notes:"Full compound pull back." },
      { name:"Hip Thrust",                 sets:4, reps:"12",         notes:"Loaded. Build back to working weight." },
      { name:"Pull Up / Lat Pulldown",     sets:3, reps:"8–10",       notes:"Upper body strength foundation." },
      { name:"Ab Wheel Rollout",           sets:3, reps:"8–10",       notes:"Only if no diastasis recti symptoms." },
    ],
  },
};
