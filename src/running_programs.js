// ─── COMPLETE RUNNING + HYROX + HYBRID PROGRAMS ───────────────────────────────

// ── RUNNING ───────────────────────────────────────────────────────────────────
export const RUNNING_PROGRAMS = {
  "Couch to 5K": {
    weeks: 8,
    goal: "Run 5K without stopping",
    daysPerWeek: 3,
    runDays: ["Mon","Wed","Fri"],
    schedule: [
      { week:1, theme:"First steps", days:[
        { day:"Mon", type:"Run/Walk", duration:30, description:"5 min walk warm up. Alternate 60 sec jog / 90 sec walk for 20 min. 5 min walk cool down." },
        { day:"Wed", type:"Run/Walk", duration:30, description:"Repeat Monday." },
        { day:"Fri", type:"Run/Walk", duration:30, description:"Repeat Monday. Focus on breathing — you should be able to speak in short sentences." }
      ]},
      { week:2, theme:"Building rhythm", days:[
        { day:"Mon", type:"Run/Walk", duration:30, description:"5 min walk. Alternate 90 sec jog / 2 min walk for 20 min. 5 min walk." },
        { day:"Wed", type:"Run/Walk", duration:30, description:"Repeat Monday." },
        { day:"Fri", type:"Run/Walk", duration:30, description:"Repeat Monday. Getting easier? Good — it should." }
      ]},
      { week:3, theme:"Longer intervals", days:[
        { day:"Mon", type:"Run/Walk", duration:35, description:"5 min walk. Then: 90 sec jog, 90 sec walk, 3 min jog, 3 min walk — repeat twice. 5 min walk." },
        { day:"Wed", type:"Run/Walk", duration:35, description:"Repeat Monday." },
        { day:"Fri", type:"Run/Walk", duration:35, description:"Repeat Monday. This is where most people feel the jump — push through." }
      ]},
      { week:4, theme:"Mixing it up", days:[
        { day:"Mon", type:"Run/Walk", duration:40, description:"5 min walk. 3 min jog, 90 sec walk, 5 min jog, 2.5 min walk, 3 min jog, 90 sec walk, 5 min jog. 5 min walk." },
        { day:"Wed", type:"Run/Walk", duration:40, description:"Repeat Monday." },
        { day:"Fri", type:"Run/Walk", duration:40, description:"Repeat Monday. You're halfway there." }
      ]},
      { week:5, theme:"Breakthrough week", days:[
        { day:"Mon", type:"Run", duration:40, description:"5 min walk. 5 min jog, 3 min walk, 5 min jog, 3 min walk, 5 min jog. 5 min walk." },
        { day:"Wed", type:"Run", duration:40, description:"5 min walk. 8 min jog, 5 min walk, 8 min jog. 5 min walk." },
        { day:"Fri", type:"Long Run", duration:30, description:"5 min walk then 20 MINUTES CONTINUOUS JOG. Your first continuous run. Go slow." }
      ]},
      { week:6, theme:"Building continuity", days:[
        { day:"Mon", type:"Run", duration:40, description:"5 min walk. 5 min jog, 3 min walk, 8 min jog, 3 min walk, 5 min jog. 5 min walk." },
        { day:"Wed", type:"Run", duration:40, description:"5 min walk. 10 min jog, 3 min walk, 10 min jog. 5 min walk." },
        { day:"Fri", type:"Long Run", duration:35, description:"5 min walk then 22 min continuous easy jog. Slow and steady." }
      ]},
      { week:7, theme:"Almost there", days:[
        { day:"Mon", type:"Easy Run", duration:25, description:"25 min continuous easy jog. You've got this." },
        { day:"Wed", type:"Easy Run", duration:25, description:"25 min continuous easy jog." },
        { day:"Fri", type:"Long Run", duration:28, description:"28 min continuous jog. Faster than week 6 if you can." }
      ]},
      { week:8, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", duration:30, description:"30 min easy jog. Legs feel good — trust your training." },
        { day:"Wed", type:"Shakeout", duration:20, description:"20 min very easy jog. Just staying loose before race day." },
        { day:"Fri", type:"RACE DAY", duration:30, description:"5K RACE. Start slow — slower than you think. Pick it up at 2km. Empty the tank in the last 500m." }
      ]}
    ]
  },

  "Sub-25 5K": {
    weeks: 8,
    goal: "Run 5K in under 25 minutes",
    targetPace: "8:00/mile",
    daysPerWeek: 4,
    runDays: ["Mon","Wed","Fri","Sat"],
    schedule: [
      { week:1, theme:"Base building", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy at fully conversational pace (9:30-10:00/mile). This should feel embarrassingly slow." },
        { day:"Wed", type:"Intervals", distance:6, duration:45, zone:"Zone 4-5", description:"1 mile easy warm up. 6x400m at 7:30/mile pace with 90 sec rest. 1 mile easy cool down." },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy recovery. Very slow. Flush the legs from intervals." },
        { day:"Sat", type:"Long Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy conversational pace. Never race this run — it defeats the purpose." }
      ]},
      { week:2, theme:"Adding tempo", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy." },
        { day:"Wed", type:"Tempo", distance:4, duration:45, zone:"Zone 3-4", description:"1 mile warm up. 2 miles at 8:00/mile — comfortably hard, not racing. 1 mile cool down." },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy recovery." },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy. Add 1 mile every week." }
      ]},
      { week:3, theme:"Speed development", days:[
        { day:"Mon", type:"Easy Run", distance:5, duration:50, zone:"Zone 2", description:"5 miles easy." },
        { day:"Wed", type:"Intervals", distance:7, duration:50, zone:"Zone 4-5", description:"1 mile warm up. 8x400m at 7:15/mile pace. 90 sec rest between. 1 mile cool down." },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy." },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy." }
      ]},
      { week:4, theme:"Recovery week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy. Recovery week — don't push." },
        { day:"Wed", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy with 4x100m strides at end." },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles very easy." },
        { day:"Sat", type:"Long Run", distance:6, duration:60, zone:"Zone 2", description:"6 miles easy. Deload week — less is more." }
      ]},
      { week:5, theme:"Building back stronger", days:[
        { day:"Mon", type:"Easy Run", distance:5, duration:50, zone:"Zone 2", description:"5 miles easy." },
        { day:"Wed", type:"Tempo", distance:5, duration:55, zone:"Zone 3-4", description:"1 mile warm up. 3 miles at 8:00/mile. 1 mile cool down. Sustained effort — you should be working." },
        { day:"Fri", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy." },
        { day:"Sat", type:"Long Run", distance:8, duration:85, zone:"Zone 2", description:"8 miles easy." }
      ]},
      { week:6, theme:"Peak training", days:[
        { day:"Mon", type:"Easy Run", distance:5, duration:50, zone:"Zone 2", description:"5 miles easy." },
        { day:"Wed", type:"Intervals", distance:9, duration:60, zone:"Zone 4", description:"1 mile warm up. 6x800m at 7:45/mile with 2 min rest. 1 mile cool down. Toughest session of the program." },
        { day:"Fri", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy." },
        { day:"Sat", type:"Long Run", distance:8, duration:85, zone:"Zone 2", description:"8 miles easy. Peak long run." }
      ]},
      { week:7, theme:"Taper begins", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:40, zone:"Zone 2", description:"4 miles easy. Taper begins — trust it." },
        { day:"Wed", type:"Tempo", distance:4, duration:45, zone:"Zone 3-4", description:"1 mile warm up. 2 miles at race pace 8:00/mile. 1 mile cool down. Sharp but short." },
        { day:"Fri", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles easy." },
        { day:"Sat", type:"Long Run", distance:6, duration:60, zone:"Zone 2", description:"6 miles easy. Taper — you're doing less because you're already fit." }
      ]},
      { week:8, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:3, duration:30, zone:"Zone 2", description:"3 miles very easy. Feel how fresh your legs are." },
        { day:"Wed", type:"Shakeout", distance:2, duration:25, zone:"Zone 2", description:"2 miles easy with 4x strides. Legs should feel electric." },
        { day:"Fri", type:"Rest", duration:0, description:"Complete rest. Eat well. Drink water. Sleep 8+ hours." },
        { day:"Sat", type:"RACE DAY", duration:25, description:"Sub-25 5K. Mile 1: 8:10 — don't go out too fast. Mile 2: 8:00 — settle in. Last 1.1 miles: empty the tank. You're ready." }
      ]}
    ]
  },

  "10K Training": {
    weeks: 10,
    goal: "Complete a 10K strong",
    targetPace: "10:00/mile",
    daysPerWeek: 4,
    runDays: ["Mon","Wed","Fri","Sat"],
    schedule: [
      { week:1, theme:"Foundation", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy. Start conservative." },
        { day:"Wed", type:"Intervals", distance:5, duration:45, zone:"Zone 4", description:"1 mile warm up. 5x400m at goal pace with 90 sec rest. 1 mile cool down." },
        { day:"Fri", type:"Easy Run", distance:3, duration:33, zone:"Zone 2", description:"3 miles easy recovery." },
        { day:"Sat", type:"Long Run", distance:7, duration:75, zone:"Zone 2", description:"7 miles easy. Build 1 mile per week." }
      ]},
      { week:5, theme:"Mid-program push", days:[
        { day:"Mon", type:"Easy Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy." },
        { day:"Wed", type:"Tempo", distance:6, duration:65, zone:"Zone 3-4", description:"1 mile warm up. 4 miles at 9:30/mile. 1 mile cool down." },
        { day:"Fri", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy." },
        { day:"Sat", type:"Long Run", distance:11, duration:120, zone:"Zone 2", description:"11 miles easy. Getting comfortable at distance." }
      ]},
      { week:10, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:44, zone:"Zone 2", description:"4 miles easy. Taper — you're ready." },
        { day:"Wed", type:"Shakeout", distance:3, duration:33, zone:"Zone 2", description:"3 miles with 4 strides. Sharp and fresh." },
        { day:"Fri", type:"Rest", duration:0, description:"Complete rest." },
        { day:"Sat", type:"RACE DAY", duration:65, description:"10K race. First 2km conservative. Middle 4km at goal pace. Last 4km — give everything." }
      ]}
    ]
  },

  "Half Marathon": {
    weeks: 16,
    goal: "Complete Half Marathon",
    targetPace: "10:00/mile",
    daysPerWeek: 4,
    runDays: ["Mon","Wed","Thu","Sat"],
    schedule: [
      { week:1, theme:"Base", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:45, zone:"Zone 2", description:"4 miles easy. Build your aerobic base." },
        { day:"Wed", type:"Tempo", distance:5, duration:55, zone:"Zone 3", description:"1 mile warm up. 3 miles at comfortably hard pace. 1 mile cool down." },
        { day:"Thu", type:"Easy Run", distance:3, duration:33, zone:"Zone 2", description:"3 miles easy recovery." },
        { day:"Sat", type:"Long Run", distance:8, duration:90, zone:"Zone 2", description:"8 miles easy. This builds to 11 miles at peak." }
      ]},
      { week:8, theme:"Peak training", days:[
        { day:"Mon", type:"Easy Run", distance:6, duration:65, zone:"Zone 2", description:"6 miles easy." },
        { day:"Wed", type:"Tempo", distance:8, duration:85, zone:"Zone 3", description:"1 mile warm up. 6 miles at goal half marathon pace. 1 mile cool down." },
        { day:"Thu", type:"Easy Run", distance:5, duration:55, zone:"Zone 2", description:"5 miles easy." },
        { day:"Sat", type:"Long Run", distance:11, duration:125, zone:"Zone 2", description:"11 miles easy. Peak long run. Fuel practice — take a gel at mile 5." }
      ]},
      { week:16, theme:"Race week", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:45, zone:"Zone 2", description:"4 miles easy taper." },
        { day:"Wed", type:"Shakeout", distance:3, duration:33, zone:"Zone 2", description:"3 miles with strides." },
        { day:"Thu", type:"Rest", duration:0, description:"Rest. Carb load. Hydrate." },
        { day:"Sat", type:"RACE DAY", duration:130, description:"Half Marathon. Miles 1-3: slower than goal pace. Miles 4-10: goal pace. Miles 11-13.1: empty the tank." }
      ]}
    ]
  }
};

// ── HYROX ─────────────────────────────────────────────────────────────────────
export const HYROX_STATIONS = [
  { name:"SkiErg", distance:"1000m", tip:"Arms pull down hard, hinge at hips, sustainable pace. Don't blow up here." },
  { name:"Sled Push", distance:"50m", tip:"Low hips, drive with legs, short fast steps. Lean into it." },
  { name:"Sled Pull", distance:"50m", tip:"Hand over hand, lean back, use your bodyweight." },
  { name:"Burpee Broad Jump", distance:"80m", tip:"Jump forward not up. Land soft. Drop immediately. Rhythm over speed." },
  { name:"Row", distance:"1000m", tip:"Legs first, lean back, pull arms last. 500m split × 2 = your time." },
  { name:"Farmers Carry", distance:"200m", tip:"Shoulders back, core tight. Walk don't run — you'll pay for it later." },
  { name:"Sandbag Lunges", distance:"100m", tip:"Bag on shoulder, long stride, knee just above floor. Breathe." },
  { name:"Wall Balls", reps:"75 women / 100 men", tip:"Full squat every rep. Ball hits target. Catch and drop immediately. Unbroken if possible." }
];

export const HYROX_PROGRAM = {
  "12-Week Race Prep": {
    weeks: 12,
    goal: "Complete Hyrox and hit your target time",
    structure: "3 strength days + 2 run days + 1 station day + 1 rest",
    weeks_detail: [
      { week:1, focus:"Assessment & Foundation", days:[
        { day:"Mon", type:"Strength", duration:60, description:"Squat 4×8, Deadlift 4×6, Overhead Press 3×10, Pull Up 3×8, Farmers Carry 3×40m. Build the engine." },
        { day:"Tue", type:"Run", distance:5, duration:30, description:"5km easy run. Establish baseline. Note your pace — you'll race this at week 12." },
        { day:"Wed", type:"Station Work", duration:60, description:"SkiErg 4×250m with 2 min rest. Row 4×250m with 2 min rest. TECHNIQUE only — go slow and learn the machines." },
        { day:"Thu", type:"Rest", description:"Complete rest or 20 min walk." },
        { day:"Fri", type:"Strength", duration:60, description:"Farmers Carry 4×50m heavy, Sled Push 4×20m, Sandbag Lunge 3×20m, Wall Ball 3×20, Burpee Broad Jump 3×10m." },
        { day:"Sat", type:"Long Run", distance:8, duration:50, description:"8km easy — conversational pace the whole way. This builds to 12km at peak." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:4, focus:"Increasing Intensity", days:[
        { day:"Mon", type:"Strength", duration:65, description:"Squat 5×5, Deadlift 3×4, Overhead Press 4×6, Pull Up 4×6, Farmers Carry 4×50m. Getting heavier." },
        { day:"Tue", type:"Run Intervals", distance:8, duration:55, description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. Exactly simulates Hyrox run segments." },
        { day:"Wed", type:"Station Circuit", duration:60, description:"SkiErg 750m, rest 3 min, Row 750m, rest 3 min, Wall Ball 3×25, rest 2 min, Burpee Broad Jump 40m. Building station capacity." },
        { day:"Thu", type:"Recovery", description:"20 min easy walk, mobility work, foam rolling. Non-negotiable recovery." },
        { day:"Fri", type:"Strength", duration:60, description:"Sled Push 6×20m, Sled Pull 4×20m, Sandbag Lunge 4×25m, Farmers Carry 4×50m." },
        { day:"Sat", type:"Long Run", distance:10, duration:65, description:"10km easy. Aerobic base matters more than people think for Hyrox." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:8, focus:"Race Simulation", days:[
        { day:"Mon", type:"Strength", duration:65, description:"Heavy compounds peak week — Squat 5×3, Deadlift 3×3, Press 4×4. Strength should be peaking." },
        { day:"Tue", type:"Run", distance:8, duration:50, description:"8km with middle 4km at race pace." },
        { day:"Wed", type:"Half Hyrox Simulation", duration:70, description:"Run 1km, SkiErg 500m, Run 1km, Sled Push 25m, Run 1km, Row 500m, Run 1km, Wall Ball 50 reps. RACE EFFORT. This is your test." },
        { day:"Thu", type:"Recovery", description:"Full recovery — this is mandatory after the simulation." },
        { day:"Fri", type:"Station Repeats", duration:55, description:"Farmers Carry 6×50m, Sandbag Lunge 4×25m, Burpee Broad Jump 4×20m. Weakness work." },
        { day:"Sat", type:"Long Run", distance:12, duration:75, description:"12km easy. Peak long run." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:10, focus:"Full Race Simulation", days:[
        { day:"Mon", type:"Strength", duration:55, description:"Moderate strength — maintain, don't build. Last heavy week." },
        { day:"Tue", type:"Run Intervals", distance:7, duration:50, description:"4×1km at race pace. Sharpening." },
        { day:"Wed", type:"FULL HYROX SIMULATION", duration:90, description:"Complete race simulation. All 8 stations with 1km runs between each. Race pace. Note your time — this predicts race day." },
        { day:"Thu", type:"Rest", description:"2 days full rest after simulation." },
        { day:"Fri", type:"Rest", description:"Full rest." },
        { day:"Sat", type:"Easy Run", distance:8, duration:50, description:"8km very easy. Flush the legs." },
        { day:"Sun", type:"Rest", description:"Full rest." }
      ]},
      { week:12, focus:"Race Week — TAPER", days:[
        { day:"Mon", type:"Easy Run", distance:4, duration:25, description:"4km very easy. Just moving." },
        { day:"Tue", type:"Shakeout Stations", duration:30, description:"1 round of each station at 50% effort. Just feeling the movements." },
        { day:"Wed", type:"Rest", description:"Complete rest." },
        { day:"Thu", type:"Rest", description:"Complete rest. Eat well. 9 hours sleep." },
        { day:"Fri", type:"Rest", description:"Full rest. Carb load. Hydrate. Lay out your gear." },
        { day:"Sat", type:"RACE DAY — HYROX", description:"Race day. Pace the first 2 runs conservatively — everyone goes out too fast. Attack the stations with good technique. Leave everything on the floor." },
        { day:"Sun", type:"Recovery", description:"You earned it. Eat, sleep, reflect." }
      ]}
    ]
  }
};

// ── HYBRID ─────────────────────────────────────────────────────────────────────
export const HYBRID_PROGRAMS = {
  "Strength-Biased Hybrid": {
    goal: "Maintain serious strength while building real running fitness",
    weeks: 12,
    daysPerWeek: 6,
    structure: "3 lift days + 3 run days",
    liftDays: ["Mon","Wed","Fri"],
    runDays: ["Tue","Thu","Sat"],
    weekly_structure: [
      { day:"Mon", type:"Lift", focus:"Push", duration:60, description:"Bench Press 4×4-6, Overhead Press 4×4-6, Incline DB Press 3×8-10, Lateral Raise 4×12-15, Tricep Pushdown 3×10-12. Heavy. Progressive overload." },
      { day:"Tue", type:"Easy Run", distance:5, duration:30, zone:"Zone 2", description:"5km fully conversational. If you can't hold a conversation you're going too fast. This is recovery, not training." },
      { day:"Wed", type:"Lift", focus:"Pull", duration:60, description:"Deadlift 4×3-5, Barbell Row 4×4-6, Pull Up 3×6-8, Face Pull 3×20, Barbell Curl 3×8-10. Add weight when all reps are clean." },
      { day:"Thu", type:"Tempo Run", distance:8, duration:50, zone:"Zone 3-4", description:"1km warm up easy. 6km at comfortably hard pace (7/10 effort). 1km cool down. Sustained threshold work." },
      { day:"Fri", type:"Lift", focus:"Legs", duration:60, description:"Squat 4×4-6, Romanian Deadlift 3×6-8, Leg Press 3×10-12, Leg Curl 3×12-15, Calf Raise 4×15. Squat is king." },
      { day:"Sat", type:"Long Run", distance:14, duration:90, zone:"Zone 2", description:"Start at 12km. Add 1km per week up to 20km. Conversational pace the ENTIRE run. This is not a race. Fueling practice." },
      { day:"Sun", type:"Rest", description:"Complete rest. This is where adaptation happens. Don't skip it." }
    ],
    progression: "Long run adds 1km per week. Lifts add 5lbs on primary movements when all reps are clean. Week 4, 8, 12 are deload — reduce run volume 40%, keep lift intensity.",
    nutrition_bridge: "Lift days: carbs up for performance and recovery. Long run day: carb load the night before, take carbs during if over 90 min. Easy run days: standard macros. This is exactly what your Coach Macro budget adjusts for automatically."
  },

  "Run-Biased Hybrid": {
    goal: "Serious runner who wants functional strength without compromising running",
    weeks: 16,
    daysPerWeek: 6,
    structure: "2 lift days + 5 run days",
    liftDays: ["Tue","Sun"],
    runDays: ["Mon","Wed","Thu","Fri","Sat"],
    weekly_structure: [
      { day:"Mon", type:"Easy Run", distance:8, duration:50, zone:"Zone 2", description:"8km easy Zone 2. Sets the week up. Fully conversational." },
      { day:"Tue", type:"Lift", focus:"Full Body Heavy", duration:45, description:"Squat 3×5, Deadlift 2×5, Bench Press 3×5, Barbell Row 3×5. HEAVY COMPOUNDS ONLY. 45 minutes max. No isolation work — it kills your running legs." },
      { day:"Wed", type:"Intervals", distance:10, duration:65, zone:"Zone 5", description:"1km warm up. 6×1km at 5K race pace with 90 sec rest. 1km cool down. The quality session. Protect this at all costs." },
      { day:"Thu", type:"Easy Run", distance:6, duration:40, zone:"Zone 2", description:"6km easy recovery. Very slow. Flush the legs from intervals. This is not optional." },
      { day:"Fri", type:"Tempo Run", distance:8, duration:55, zone:"Zone 3-4", description:"2km warm up. 5km at half marathon pace. 1km cool down. Sustained effort." },
      { day:"Sat", type:"Long Run", distance:22, duration:145, zone:"Zone 2", description:"Long run. Start at 18km. Builds to 26km. Conversational pace. Practice fueling — gel every 45 min." },
      { day:"Sun", type:"Lift", focus:"Full Body Heavy", duration:45, description:"Same as Tuesday. Squat 3×5, Deadlift 2×5, Bench 3×5, Row 3×5. Quick, heavy, done." }
    ],
    progression: "Run volume builds maximum 10% per week. Lifts add 5lbs weekly — strength must progress or the program fails. Keep strength sessions exactly 45 min — running legs cannot afford more.",
    nutrition_bridge: "Long run day: 8g carbs per kg bodyweight the night before. Lift days: 2.2g protein per kg. Interval day: 60-80g carbs 2 hours before. Easy days: standard macros. Coach Macro adjusts this automatically based on what's on your schedule."
  },

  "Balanced Hybrid": {
    goal: "Equally strong and fast — no compromise on either quality",
    weeks: 12,
    daysPerWeek: 6,
    structure: "3 lift days + 3 run days — alternating",
    liftDays: ["Mon","Wed","Fri"],
    runDays: ["Tue","Thu","Sat"],
    weekly_structure: [
      { day:"Mon", type:"Lift", focus:"Upper Body Strength", duration:65, description:"Bench Press 4×3-5, Barbell Row 4×3-5, Overhead Press 3×5-6, Pull Up 3×5-8. Heavy compounds. This is your strength day — treat it seriously." },
      { day:"Tue", type:"Speed Work", distance:7, duration:50, zone:"Zone 5", description:"Track session: 1km warm up. 8×400m at mile pace with 60 sec rest. 1km cool down. Pure speed development. This is what makes you fast." },
      { day:"Wed", type:"Lift", focus:"Lower Body Strength", duration:65, description:"Squat 5×3-5, Romanian Deadlift 4×5, Bulgarian Split Squat 3×8 each, Leg Curl 3×12, Calf Raise 4×15. Squat heavy — this is your engine." },
      { day:"Thu", type:"Easy Run", distance:8, duration:55, zone:"Zone 2", description:"8km easy Zone 2. Active recovery. Never push this run — it undoes the whole program if you do." },
      { day:"Fri", type:"Lift", focus:"Power + Athletic", duration:65, description:"Power Clean 4×3, Box Jump 4×5, Farmers Carry 4×50m, Sled Push 3×20m, Sandbag Carry 3×30m. Athletic power work — this is what connects strength to sport." },
      { day:"Sat", type:"Long Run", distance:18, duration:120, zone:"Zone 2", description:"Long run. Start 14km, build to 22km. Conversational pace. This is where hybrid athletes separate themselves from people who just lift or just run." },
      { day:"Sun", type:"Rest", description:"Non-negotiable full rest. 9 hours sleep target." }
    ],
    progression: "Lifts add weight every session when reps are clean. Running adds 1km to long run every week, 1 interval rep per month. Deload weeks 4 and 8 — reduce everything 40%.",
    nutrition_bridge: "This program has the highest nutrition complexity. Heavy lift days: 4g carbs/kg for performance. Long run day: carb load night before. Rest days: drop carbs 25-30%. Protein stays 2.2g/kg every single day. Coach Macro handles all of this automatically based on your daily schedule."
  },

  "Hyrox Hybrid": {
    goal: "Compete in Hyrox — strong, fast, and station-ready",
    weeks: 12,
    daysPerWeek: 6,
    structure: "2 strength + 2 run + 1 station + 1 long run",
    liftDays: ["Mon","Wed"],
    runDays: ["Tue","Thu"],
    stationDays: ["Fri"],
    longRunDays: ["Sat"],
    weekly_structure: [
      { day:"Mon", type:"Lift", focus:"Strength Foundation", duration:65, description:"Squat 4×5, Deadlift 3×4, Overhead Press 4×5, Pull Up 4×6, Farmers Carry 3×40m. The strength base that powers every Hyrox station. Go heavy." },
      { day:"Tue", type:"Run", distance:8, duration:50, description:"8km with middle 4km at Hyrox race pace. You run 8km total in Hyrox between stations — this is exactly what you're training." },
      { day:"Wed", type:"Lift", focus:"Upper Strength + Station Carry-Over", duration:65, description:"Bench Press 4×5, Barbell Row 4×5, Sandbag Lunge 4×20m, Sled Push 3×20m, Wall Ball 3×20. Direct Hyrox station carry-over built into the lift day." },
      { day:"Thu", type:"Run Intervals", distance:9, duration:60, description:"6×1km at 5K pace with 90 sec rest. Hyrox requires repeated 1km efforts between stations — this is exactly that training." },
      { day:"Fri", type:"Station Circuit", duration:65, description:"SkiErg 1000m, rest 3 min, Row 1000m, rest 3 min, Burpee Broad Jump 50m, rest 3 min, Wall Ball 50 reps, rest 3 min. Station-specific conditioning. This gets harder every week." },
      { day:"Sat", type:"Long Run", distance:12, duration:75, description:"10-14km easy. Aerobic base. Hyrox is 60-80% aerobic — this matters more than most people think." },
      { day:"Sun", type:"Rest", description:"Complete rest. This program is high volume. Sleep is training." }
    ],
    race_simulations: [
      { week:8, description:"Half Hyrox — Run 4×1km with stations SkiErg, Row, Wall Ball, Farmers Carry at race effort" },
      { week:10, description:"Full Hyrox simulation — all 8 stations with 1km runs between each at race pace" },
      { week:12, description:"Race week taper — light work Monday through Friday, race Saturday" }
    ],
    progression: "Stations: add reps or distance every 2 weeks. Running: add 1km to long run weekly. Lifts: heavy and consistent — strength peaks at week 10. Full taper weeks 11-12.",
    nutrition_bridge: "Highest carb demands of any program. Station days and long run day: 5-6g carbs/kg. Race week: carb load Thursday-Friday. Race morning: 80-100g carbs 2 hours before start. Coach Macro tracks all of this and adjusts your daily budget accordingly."
  }
};

// ── HELPER FUNCTIONS ───────────────────────────────────────────────────────────
export function getTodayRunWorkout(programName, weekNumber, dayOfWeek) {
  const program = RUNNING_PROGRAMS[programName];
  if(!program) return null;
  const week = program.schedule.find(w=>w.week===weekNumber);
  if(!week) return null;
  return week.days.find(d=>d.day===dayOfWeek)||null;
}

export function getTodayHyroxWorkout(weekNumber, dayOfWeek) {
  const program = HYROX_PROGRAM["12-Week Race Prep"];
  const week = program.weeks_detail.find(w=>w.week===weekNumber);
  if(!week) return null;
  return week.days.find(d=>d.day===dayOfWeek)||null;
}

export function getTodayHybridWorkout(templateName, dayOfWeek, weekNumber) {
  const template = HYBRID_PROGRAMS[templateName];
  if(!template) return null;
  const todayPlan = template.weekly_structure.find(d=>d.day===dayOfWeek);
  if(!todayPlan) return { type:"Rest", description:"Rest day. Recover and prepare for tomorrow.", duration:0 };
  
  // Check for race simulations
  if(template.race_simulations){
    const sim = template.race_simulations.find(s=>s.week===weekNumber);
    if(sim && dayOfWeek==="Wed") return { ...todayPlan, raceSimulation:sim.description };
  }
  
  return { ...todayPlan, nutritionBridge:template.nutrition_bridge };
}

export function getProgramForUser(wPrefs) {
  if(wPrefs?.isHyrox && wPrefs?.isHybrid) return { type:"hyrox-hybrid", program:HYBRID_PROGRAMS["Hyrox Hybrid"] };
  if(wPrefs?.isHyrox) return { type:"hyrox", program:HYROX_PROGRAM["12-Week Race Prep"] };
  if(wPrefs?.isHybrid) {
    const template = wPrefs?.hybridTemplate || "Balanced Hybrid";
    return { type:"hybrid", program:HYBRID_PROGRAMS[template] };
  }
  if(wPrefs?.splitType?.toLowerCase().includes("run")) {
    const runPlan = wPrefs?.runPlan || "Couch to 5K";
    return { type:"running", program:RUNNING_PROGRAMS[runPlan] };
  }
  return { type:"lifting", program:null };
}
