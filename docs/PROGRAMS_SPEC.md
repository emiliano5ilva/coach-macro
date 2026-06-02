# Coach Macro — Complete Program Library Spec
# 22 programs across 8 categories + onboarding additions + library UX changes

---

## PART 1 — ONBOARDING ADDITIONS (ob_new.jsx)

### New Screen: Equipment Access
Position: After training type (#12), before training experience (#13)
Field written: `equipment`
TDEE-critical: Yes — filters compatible programs
Options:
- v: "full"      l: "Full commercial gym"       sub: "Barbells, cables, machines — everything"
- v: "home_bar"  l: "Home gym with barbell"     sub: "Barbell, rack, dumbbells"
- v: "dumbbells" l: "Dumbbells and cables only" sub: "No barbell available"
- v: "minimal"   l: "Bodyweight / minimal"      sub: "Bands, bodyweight, light weights"

### New Screen: Session Length
Position: After equipment, before experience
Field written: `sessionLength`
TDEE-critical: Yes — affects training multiplier accuracy
Options:
- v: "20"  l: "20–30 minutes"
- v: "45"  l: "Around 45 minutes"
- v: "60"  l: "About an hour"
- v: "90"  l: "90 minutes or more"

### Update: Training Type Options
Add MetCon as 6th option:
- v: "metcon" l: "MetCon" sub: "Metabolic conditioning — mixed modal high intensity"

### Update: calcTDEE (components.jsx)
Add to trainType multiplier:
  metcon: 0.07   // same as hyrox — mixed modal high output

### Update: getDayMacros
Add metcon entry matching hyrox profile:
  metcon: { Bulk: { cal: 1.05, ...}, Cut: { cal: 0.95, ... }, Maintain: { cal: 1.00, ... } }
  (copy exact macro split from hyrox entry)

### handleDone mapping (ob_new.jsx)
No change needed — `equipment` and `sessionLength` are new fields that pass through directly.
They don't map to old field names. Store as-is in profile_data.

---

## PART 2 — PROGRAM LIBRARY UX (ProgramLibrary.jsx)

### Fix 1: Pre-filter by trainType on load
Change catFilter initial state from `"All"` to the user's training type:
```js
const defaultCategory = {
  strength: "Strength",
  run: "Running",
  hyrox: "Hyrox",
  hybrid: "Hybrid",
  metcon: "MetCon",
  sport: "Sport",
}[profile?.trainType] || "All";

const [catFilter, setCatFilter] = useState(defaultCategory);
```

### Fix 2: Add Golden Era and MetCon to FILTER_TABS
Current: ["All", "Strength", "Running", "Hyrox", "Hybrid", "Glute", "Fat Loss"]
New:     ["All", "Strength", "Golden Era", "Running", "Hyrox", "Hybrid", "MetCon", "Glute", "Fat Loss", "Sport"]

### Fix 3: Recommended section
Above the category chips, add a "// BUILT FOR YOU" section showing 2-3 programs that match:
- profile.trainType (category match)
- profile.equipment (compatible equipment)
- profile.sessionLength (session fits within time)

Compatibility rules (used for both filtering and the recommended section):
```
equipment compatibility:
  "minimal"   → only programs with tag: ["minimal", "bodyweight", "dumbbell"]
  "dumbbells" → programs with tag: ["dumbbell", "minimal", "cable"]
  "home_bar"  → programs with tag: ["barbell", "dumbbell", "minimal", "cable"]
  "full"      → all programs

sessionLength compatibility:
  "20"  → programs where sessionMins <= 30
  "45"  → programs where sessionMins <= 50
  "60"  → programs where sessionMins <= 70
  "90"  → all programs
```
Add `equipment` (array of compatible equipment tags) and `sessionMins` (typical session length)
to each PROGRAM_LIBRARY entry below.

---

## PART 3 — PROGRAM DATA

### Format reference (existing shape):
```
PROGRAM_LIBRARY entry:
{
  id, name, category, days, weeks, level, bestFor,
  splitKey,           // key into PROGRAMS_BY_DAYS or null for hyrox/running
  comingSoon,         // remove from all entries we're filling
  equipment: [],      // new: array of compatible equipment types
  sessionMins: 60,    // new: typical session duration in minutes
  isHyrox: true,      // keep for hyrox programs
  isRunning: true,    // keep for running programs
}

PROGRAMS_BY_DAYS[N].splits[splitKey] entry:
{
  description: "",
  days: ["Day A", "Day B", ...],
  alternating: true/false,
  workouts: {
    "Day A": [
      { name, sets, reps, notes, primary }
    ]
  }
}
```

---

### CATEGORY: STRENGTH

#### 1. Stronglifts 5×5 (fills stub)
```
PROGRAM_LIBRARY:
{
  id: "sl5x5",
  name: "Stronglifts 5×5",
  category: "Strength",
  days: 3,
  weeks: 12,
  level: "Beginner",
  bestFor: "Pure beginner strength foundation — the most proven novice program ever written",
  splitKey: "SL5x5",
  equipment: ["barbell", "full", "home_bar"],
  sessionMins: 45,
}

PROGRAMS_BY_DAYS[3].splits["SL5x5"]:
{
  description: "The most proven novice strength program. Alternates two full-body sessions 3x/week. Add 5lbs to upper body lifts and 10lbs to squat/deadlift each session you complete all reps. When you fail a weight 3 sessions in a row, deload 10% and rebuild.",
  days: ["Workout A", "Workout B"],
  alternating: true,
  workouts: {
    "Workout A": [
      { name: "Barbell Squat",       sets: 5, reps: "5",    notes: "Add 10lbs every session. Hit all 5×5 before adding weight.", primary: true },
      { name: "Barbell Bench Press", sets: 5, reps: "5",    notes: "Add 5lbs every session. Full range of motion.", primary: true },
      { name: "Barbell Row",         sets: 5, reps: "5",    notes: "Add 5lbs every session. Row to lower chest.", primary: true }
    ],
    "Workout B": [
      { name: "Barbell Squat",       sets: 5, reps: "5",    notes: "Same weight as last session. Add 10lbs if all reps completed.", primary: true },
      { name: "Overhead Press",      sets: 5, reps: "5",    notes: "Add 5lbs every session. Press strict — no leg drive.", primary: true },
      { name: "Deadlift",            sets: 1, reps: "5",    notes: "One heavy set. Add 10lbs every session. Most important lift.", primary: true }
    ]
  }
}
```

#### 2. 5/3/1 (fills stub)
```
PROGRAM_LIBRARY:
{
  id: "5_3_1",
  name: "5/3/1",
  category: "Strength",
  days: 4,
  weeks: null,
  level: "Intermediate",
  bestFor: "Long-term strength progression — the most popular intermediate program ever written",
  splitKey: "531",
  equipment: ["barbell", "full", "home_bar"],
  sessionMins: 75,
}

NOTE: All percentages are of TRAINING MAX (not 1RM).
Training Max = 90% of your current 1 rep max.
Set your training max in Program Settings before starting.
Add 5lbs to upper body training maxes and 10lbs to lower body training maxes each 4-week cycle.

PROGRAMS_BY_DAYS[4].splits["531"]:
{
  description: "Jim Wendler's wave-load periodization. Four main lifts, one per day. 4-week cycles: 3 weeks progressive load, 1 week deload. All percentages of your TRAINING MAX (= 90% of 1RM). Add 5lbs to press/bench TM and 10lbs to squat/deadlift TM each cycle. Never miss a rep.",
  days: ["Squat Day", "Bench Day", "Deadlift Day", "OHP Day"],
  alternating: false,
  workouts: {
    "Squat Day": [
      { name: "Barbell Squat",       sets: 3, reps: "Week 1: 5/5/5+ @ 65/75/85%. Week 2: 3/3/3+ @ 70/80/90%. Week 3: 5/3/1+ @ 75/85/95%. Week 4: 5/5/5 @ 40/50/60% (deload)", notes: "The + set means do as many reps as possible. Never miss — save reps in the tank on + sets.", primary: true },
      { name: "Barbell Squat (BBB)", sets: 5, reps: "10",  notes: "Big But Boring assistance: 50% of training max. No grinding — controlled and full range.", primary: false },
      { name: "Leg Press",           sets: 3, reps: "10-15", notes: "Assistance work — moderate weight.", primary: false },
      { name: "Leg Curl",            sets: 3, reps: "10-15", notes: "Assistance work.", primary: false },
      { name: "Plank",               sets: 3, reps: "45-60 sec", notes: "Core work.", primary: false }
    ],
    "Bench Day": [
      { name: "Barbell Bench Press", sets: 3, reps: "Week 1: 5/5/5+ @ 65/75/85%. Week 2: 3/3/3+ @ 70/80/90%. Week 3: 5/3/1+ @ 75/85/95%. Week 4: deload", notes: "Touch chest every rep. Control the descent.", primary: true },
      { name: "Barbell Bench Press (BBB)", sets: 5, reps: "10", notes: "50% training max. BBB sets build volume.", primary: false },
      { name: "Dumbbell Row",        sets: 4, reps: "10-15", notes: "Superset with bench assistance. Balance pressing with pulling.", primary: false },
      { name: "Tricep Pushdown",     sets: 3, reps: "12-15", notes: "Assistance.", primary: false },
      { name: "Face Pull",           sets: 3, reps: "15-20", notes: "Shoulder health. Never skip.", primary: false }
    ],
    "Deadlift Day": [
      { name: "Deadlift",            sets: 3, reps: "Week 1: 5/5/5+ @ 65/75/85%. Week 2: 3/3/3+ @ 70/80/90%. Week 3: 5/3/1+ @ 75/85/95%. Week 4: deload", notes: "Brace hard. Pull the floor apart. The + set is your money set.", primary: true },
      { name: "Romanian Deadlift",   sets: 5, reps: "10",  notes: "50% of deadlift training max. Hinge — don't squat.", primary: false },
      { name: "Lat Pulldown",        sets: 4, reps: "10-12", notes: "Assistance pulling work.", primary: false },
      { name: "Hanging Leg Raise",   sets: 3, reps: "10-15", notes: "Core work.", primary: false }
    ],
    "OHP Day": [
      { name: "Overhead Press",      sets: 3, reps: "Week 1: 5/5/5+ @ 65/75/85%. Week 2: 3/3/3+ @ 70/80/90%. Week 3: 5/3/1+ @ 75/85/95%. Week 4: deload", notes: "Strict press. No leg drive. Elbows slightly forward at start.", primary: true },
      { name: "Overhead Press (BBB)",sets: 5, reps: "10",  notes: "50% training max. Build shoulder volume.", primary: false },
      { name: "Chin Up",             sets: 4, reps: "max", notes: "Bodyweight or weighted. Pull to chin over bar.", primary: false },
      { name: "Dumbbell Lateral Raise", sets: 3, reps: "15-20", notes: "Lateral deltoid. Light weight, strict form.", primary: false },
      { name: "Barbell Curl",        sets: 3, reps: "10-12", notes: "Assistance work.", primary: false }
    ]
  }
}
```

#### 3. Upper/Lower Split (new)
```
PROGRAM_LIBRARY:
{
  id: "upper_lower",
  name: "Upper/Lower",
  category: "Strength",
  days: 4,
  weeks: 8,
  level: "Beginner",
  bestFor: "Optimal muscle frequency — each muscle trained twice per week",
  splitKey: "Upper Lower",
  equipment: ["barbell", "full", "home_bar"],
  sessionMins: 60,
}

PROGRAMS_BY_DAYS[4].splits["Upper Lower"]:
{
  description: "Science-backed frequency optimization. Training each muscle group twice per week drives significantly more growth than once-per-week splits. Alternates strength-focused and volume-focused sessions for upper and lower body.",
  days: ["Upper A (Strength)", "Lower A (Strength)", "Upper B (Volume)", "Lower B (Volume)"],
  alternating: false,
  workouts: {
    "Upper A (Strength)": [
      { name: "Barbell Bench Press", sets: 4, reps: "4-6",   notes: "Primary push movement. Add weight when top of range completed.", primary: true },
      { name: "Barbell Row",         sets: 4, reps: "4-6",   notes: "Primary pull movement. Match volume to bench.", primary: true },
      { name: "Overhead Press",      sets: 3, reps: "6-8",   notes: "Strict press. Build shoulder strength.", primary: true },
      { name: "Lat Pulldown",        sets: 3, reps: "8-10",  notes: "Pull to upper chest. Full stretch at top.", primary: false },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", notes: "Upper chest accessory.", primary: false },
      { name: "Face Pull",           sets: 3, reps: "15-20", notes: "Rear delts and rotator cuff. Always include.", primary: false }
    ],
    "Lower A (Strength)": [
      { name: "Barbell Squat",       sets: 4, reps: "4-6",   notes: "Primary lower movement. Break parallel.", primary: true },
      { name: "Romanian Deadlift",   sets: 3, reps: "8-10",  notes: "Hip hinge. Feel the hamstring stretch.", primary: true },
      { name: "Leg Press",           sets: 3, reps: "10-12", notes: "Volume for quads.", primary: false },
      { name: "Leg Curl",            sets: 3, reps: "10-12", notes: "Hamstring isolation.", primary: false },
      { name: "Standing Calf Raise", sets: 4, reps: "12-15", notes: "Full range — all the way up and down.", primary: false }
    ],
    "Upper B (Volume)": [
      { name: "Incline Barbell Press", sets: 4, reps: "8-12",  notes: "Volume day — controlled tempo. 3 sec down.", primary: true },
      { name: "Cable Row",             sets: 4, reps: "10-12", notes: "Squeeze the shoulder blade at peak contraction.", primary: true },
      { name: "Dumbbell Shoulder Press", sets: 3, reps: "10-15", notes: "Volume for shoulders.", primary: false },
      { name: "Cable Pullover",         sets: 3, reps: "12-15", notes: "Lat stretch and contraction.", primary: false },
      { name: "Dumbbell Lateral Raise", sets: 3, reps: "15-20", notes: "Strict form. Don't shrug.", primary: false },
      { name: "Bicep Curl",             sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Tricep Pushdown",        sets: 3, reps: "12-15", notes: "", primary: false }
    ],
    "Lower B (Volume)": [
      { name: "Leg Press",            sets: 4, reps: "10-15", notes: "High volume quad work. Full depth.", primary: true },
      { name: "Romanian Deadlift",    sets: 4, reps: "12-15", notes: "Lighter than A day. Focus on hamstring stretch.", primary: true },
      { name: "Walking Lunge",        sets: 3, reps: "12-15 each leg", notes: "Full knee bend. Upright torso.", primary: false },
      { name: "Leg Extension",        sets: 3, reps: "15-20", notes: "Quad isolation. Squeeze at top.", primary: false },
      { name: "Leg Curl",             sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Seated Calf Raise",    sets: 4, reps: "15-20", notes: "Full range — soleus focus.", primary: false }
    ]
  }
}
```

#### 4. PHUL (new)
```
PROGRAM_LIBRARY:
{
  id: "phul",
  name: "PHUL",
  category: "Strength",
  days: 4,
  weeks: 12,
  level: "Intermediate",
  bestFor: "Power and hypertrophy in the same week — strength on Monday, size on Thursday",
  splitKey: "PHUL",
  equipment: ["barbell", "full"],
  sessionMins: 75,
}

PROGRAMS_BY_DAYS[4].splits["PHUL"]:
{
  description: "Power Hypertrophy Upper Lower. Two power days build strength with heavy compound lifts at low reps. Two hypertrophy days build size with moderate weight and higher volume. The combination produces strength and size simultaneously.",
  days: ["Power Upper", "Power Lower", "Hypertrophy Upper", "Hypertrophy Lower"],
  alternating: false,
  workouts: {
    "Power Upper": [
      { name: "Barbell Bench Press",    sets: 3, reps: "3-5",   notes: "Heavy. Warm up thoroughly. These reps build strength.", primary: true },
      { name: "Incline Dumbbell Press", sets: 3, reps: "6-8",   notes: "Secondary press. Still heavy.", primary: true },
      { name: "Barbell Row",            sets: 3, reps: "3-5",   notes: "Match bench intensity for back-to-pressing balance.", primary: true },
      { name: "Lat Pulldown",           sets: 3, reps: "6-8",   notes: "Pull to upper chest. Control the negative.", primary: true },
      { name: "Overhead Press",         sets: 2, reps: "5-8",   notes: "Strict press — no leg drive.", primary: false },
      { name: "Barbell Curl",           sets: 2, reps: "6-8",   notes: "", primary: false },
      { name: "Skullcrusher",           sets: 2, reps: "6-8",   notes: "", primary: false }
    ],
    "Power Lower": [
      { name: "Barbell Squat",          sets: 3, reps: "3-5",   notes: "Heavy. Below parallel. This is the foundation.", primary: true },
      { name: "Deadlift",               sets: 3, reps: "3-5",   notes: "Heaviest pull of the week. Brace everything.", primary: true },
      { name: "Leg Press",              sets: 3, reps: "10-12", notes: "Quad volume after the heavy work.", primary: false },
      { name: "Leg Curl",               sets: 3, reps: "10-12", notes: "Hamstring balance.", primary: false },
      { name: "Standing Calf Raise",    sets: 4, reps: "8-12",  notes: "Loaded calves.", primary: false }
    ],
    "Hypertrophy Upper": [
      { name: "Incline Barbell Press",  sets: 4, reps: "8-12",  notes: "Upper chest focus. 3 sec descent.", primary: true },
      { name: "Flat Dumbbell Press",    sets: 4, reps: "8-12",  notes: "Full range of motion. Elbows 45°.", primary: false },
      { name: "Cable Row",              sets: 4, reps: "8-12",  notes: "Squeeze at contraction. Control the return.", primary: true },
      { name: "One Arm Dumbbell Row",   sets: 4, reps: "10-15", notes: "Elbow high. Full range.", primary: false },
      { name: "Dumbbell Shoulder Press",sets: 3, reps: "10-12", notes: "", primary: false },
      { name: "Lateral Raise",          sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Hammer Curl",            sets: 3, reps: "10-15", notes: "", primary: false },
      { name: "Tricep Pushdown",        sets: 3, reps: "10-15", notes: "", primary: false }
    ],
    "Hypertrophy Lower": [
      { name: "Squat",                  sets: 4, reps: "8-12",  notes: "Lighter than power day. Controlled. Time under tension.", primary: true },
      { name: "Leg Press",              sets: 4, reps: "12-15", notes: "High volume. Don't lock out between reps.", primary: false },
      { name: "Leg Extension",          sets: 4, reps: "12-15", notes: "Peak contraction every rep.", primary: false },
      { name: "Romanian Deadlift",      sets: 4, reps: "10-12", notes: "Feel the stretch.", primary: true },
      { name: "Leg Curl",               sets: 4, reps: "10-15", notes: "", primary: false },
      { name: "Seated Calf Raise",      sets: 4, reps: "12-15", notes: "", primary: false }
    ]
  }
}
```

---

### CATEGORY: GOLDEN ERA

#### 5. Arnold Split (already exists — add new fields only)
Add to existing entry:
```
equipment: ["full", "barbell"],
sessionMins: 90,
category: "Golden Era",   // move from wherever it currently is
```

#### 6. Tom Platz High Volume (new)
```
PROGRAM_LIBRARY:
{
  id: "platz_volume",
  name: "Tom Platz Volume",
  category: "Golden Era",
  days: 5,
  weeks: 12,
  level: "Advanced",
  bestFor: "Extreme volume training — the most brutal leg development program ever designed",
  splitKey: "Platz Volume",
  equipment: ["full", "barbell"],
  sessionMins: 90,
}

PROGRAMS_BY_DAYS[5].splits["Platz Volume"]:
{
  description: "Tom Platz built the greatest legs in bodybuilding history through extreme volume and training past failure. Each session is high volume with forced reps on the last set of each exercise. Leg day is 90 minutes minimum. If you've never trained like this, start with the lighter end of each range.",
  days: ["Chest", "Back", "Legs", "Shoulders + Arms", "Rest"],
  alternating: false,
  workouts: {
    "Chest": [
      { name: "Barbell Bench Press",     sets: 5, reps: "8-12",  notes: "Warm up with 3 progressive sets before working sets. Touch chest every rep.", primary: true },
      { name: "Incline Barbell Press",   sets: 4, reps: "8-12",  notes: "Upper chest is key for overall development.", primary: true },
      { name: "Incline Dumbbell Flye",   sets: 4, reps: "10-15", notes: "Full stretch. Feel the pecs — don't just move weight.", primary: false },
      { name: "Flat Dumbbell Flye",      sets: 4, reps: "10-15", notes: "Wide arc. Slight bend in elbows throughout.", primary: false },
      { name: "Cable Crossover",         sets: 3, reps: "12-15", notes: "Hands cross at the bottom. Squeeze and hold.", primary: false },
      { name: "Decline Push Up",         sets: 2, reps: "max",   notes: "Finish with a pump set to failure.", primary: false }
    ],
    "Back": [
      { name: "Deadlift",                sets: 4, reps: "6-10",  notes: "Foundation of the back day. Full reset each rep.", primary: true },
      { name: "Barbell Row",             sets: 4, reps: "8-12",  notes: "Row to lower abdomen. Elbows close to body.", primary: true },
      { name: "T-Bar Row",               sets: 4, reps: "8-12",  notes: "Great for thickness. Full range of motion.", primary: true },
      { name: "Wide Grip Pulldown",      sets: 4, reps: "10-12", notes: "Pull to upper chest. Lean back slightly.", primary: false },
      { name: "Close Grip Pulldown",     sets: 3, reps: "10-12", notes: "Inner lat development.", primary: false },
      { name: "Straight Arm Pulldown",   sets: 3, reps: "12-15", notes: "Lat isolation. Arms straight throughout.", primary: false },
      { name: "Hyperextension",          sets: 3, reps: "15-20", notes: "Lower back and glute accessory.", primary: false }
    ],
    "Legs": [
      { name: "Barbell Squat",           sets: 8, reps: "8-20",  notes: "THE exercise. Start with 60% of max for sets of 20. Work up to heavy sets of 8. Last set: 20 reps. This is 45+ minutes alone. Platz would do 315lbs for sets of 20. Train beyond comfort.", primary: true },
      { name: "Leg Press",               sets: 5, reps: "10-15", notes: "After squats. Full depth. Don't lock out between reps.", primary: true },
      { name: "Hack Squat",              sets: 4, reps: "10-15", notes: "Feet high = more hamstring. Feet low = more quad.", primary: false },
      { name: "Leg Extension",           sets: 4, reps: "12-20", notes: "Peak contraction every rep. Hold 1 sec at top.", primary: false },
      { name: "Lying Leg Curl",          sets: 4, reps: "10-15", notes: "Full range. Hamstrings are undertrained by most.", primary: false },
      { name: "Standing Calf Raise",     sets: 5, reps: "15-20", notes: "Full stretch at bottom. Pause at top.", primary: false },
      { name: "Seated Calf Raise",       sets: 4, reps: "15-20", notes: "Soleus. Different than standing.", primary: false }
    ],
    "Shoulders + Arms": [
      { name: "Seated Barbell Press",    sets: 4, reps: "8-12",  notes: "Primary shoulder mass builder.", primary: true },
      { name: "Dumbbell Lateral Raise",  sets: 4, reps: "12-15", notes: "Strict. Don't swing.", primary: false },
      { name: "Bent Over Lateral Raise", sets: 4, reps: "12-15", notes: "Rear delts. Chest nearly parallel to floor.", primary: false },
      { name: "Barbell Upright Row",     sets: 3, reps: "10-12", notes: "Elbows high. Targets medial deltoid.", primary: false },
      { name: "Barbell Curl",            sets: 4, reps: "8-12",  notes: "Full range. No swinging.", primary: true },
      { name: "Incline Dumbbell Curl",   sets: 3, reps: "10-12", notes: "Long head of bicep — peak development.", primary: false },
      { name: "Concentration Curl",      sets: 3, reps: "12-15", notes: "Maximum contraction.", primary: false },
      { name: "Close Grip Bench Press",  sets: 4, reps: "8-12",  notes: "Primary tricep mass.", primary: true },
      { name: "Overhead Tricep Extension", sets: 3, reps: "10-12", notes: "Long head — fullness from behind.", primary: false },
      { name: "Tricep Pushdown",         sets: 3, reps: "12-15", notes: "Finish the triceps.", primary: false }
    ],
    "Rest": []
  }
}
```

#### 7. Mike Mentzer Heavy Duty HIT (new)
```
PROGRAM_LIBRARY:
{
  id: "mentzer_hit",
  name: "Mike Mentzer Heavy Duty",
  category: "Golden Era",
  days: 4,
  weeks: null,
  level: "Intermediate",
  bestFor: "Maximum intensity, minimum volume — one perfect set beats ten mediocre ones",
  splitKey: "HIT Heavy Duty",
  equipment: ["full"],
  sessionMins: 45,
}

NOTE: This program trains 2 days per week. The "4 days" refers to workouts A+B over 2 weeks.
Each workout has 1 working set per exercise (after warm-ups), taken to ABSOLUTE failure.
Cadence: 4 seconds up, 4 seconds down. Never rush.
Working set is done AFTER 2-3 progressive warm-up sets.
Failure means you physically cannot complete another rep with correct form.

PROGRAMS_BY_DAYS[4].splits["HIT Heavy Duty"]:
{
  description: "Mike Mentzer's Heavy Duty system. The most controversial and effective training philosophy in bodybuilding. One working set per exercise, taken to absolute muscular failure. Train 2 days per week. Sessions last 30-45 minutes maximum. The pre-exhaust superset — isolation exercise immediately into compound — is Mentzer's signature technique. Do not add volume. The system only works if you actually train to failure.",
  days: ["Workout A — Chest + Back", "Workout B — Legs + Abs", "Workout C — Shoulders + Arms", "Rest"],
  alternating: false,
  workouts: {
    "Workout A — Chest + Back": [
      { name: "Dumbbell Flye",          sets: 1, reps: "8-12 to failure",  notes: "PRE-EXHAUST: warm up 2×10 light, then 1 working set to absolute failure. Immediately into Bench Press with no rest.", primary: true },
      { name: "Barbell Bench Press",    sets: 1, reps: "6-10 to failure",  notes: "SUPERSET with Flye. No rest after flye. The chest is already pre-fatigued so the triceps won't give out first. 1 working set to failure. If you can do 10 reps, add weight next time.", primary: true },
      { name: "Dumbbell Pullover",      sets: 1, reps: "8-12 to failure",  notes: "PRE-EXHAUST for back. Lats only — arms straight. To failure. Immediately into row.", primary: true },
      { name: "Close Grip Pulldown",    sets: 1, reps: "6-10 to failure",  notes: "SUPERSET with Pullover. 1 working set to complete failure. The back is pre-fatigued — your biceps won't limit you.", primary: true }
    ],
    "Workout B — Legs + Abs": [
      { name: "Leg Extension",          sets: 1, reps: "8-15 to failure",  notes: "PRE-EXHAUST for quads. 1 working set to absolute failure. Immediately into Leg Press.", primary: true },
      { name: "Leg Press",              sets: 1, reps: "8-15 to failure",  notes: "SUPERSET with Leg Extension. 1 working set to failure. Go deep. The quad is already pre-exhausted.", primary: true },
      { name: "Leg Curl",               sets: 1, reps: "8-12 to failure",  notes: "Hamstrings. 1 working set. Full range of motion. To failure.", primary: true },
      { name: "Calf Raise",             sets: 1, reps: "12-20 to failure", notes: "Full stretch at bottom. Pause at top. To failure.", primary: false },
      { name: "Crunch",                 sets: 2, reps: "15-20",            notes: "Abs are the exception — 2 sets here.", primary: false }
    ],
    "Workout C — Shoulders + Arms": [
      { name: "Lateral Raise",          sets: 1, reps: "8-12 to failure",  notes: "PRE-EXHAUST for medial deltoid. To failure. Immediately into press.", primary: true },
      { name: "Overhead Press",         sets: 1, reps: "6-10 to failure",  notes: "SUPERSET with lateral raise. 1 working set to failure. The deltoids are pre-fatigued.", primary: true },
      { name: "Barbell Curl",           sets: 1, reps: "6-10 to failure",  notes: "Biceps. Full range. To failure. Add weight when you hit 10 reps.", primary: true },
      { name: "Close Grip Bench Press", sets: 1, reps: "6-10 to failure",  notes: "Triceps primary mover. To failure.", primary: true }
    ],
    "Rest": []
  }
}
```

---

### CATEGORY: FAT LOSS & CONDITIONING

#### 8. Metabolic Resistance Training (fills stub)
```
PROGRAM_LIBRARY:
{
  id: "metabolic",
  name: "Metabolic Resistance",
  category: "Fat Loss & Conditioning",
  days: 4,
  weeks: 8,
  level: "Intermediate",
  bestFor: "Burn fat while keeping muscle — heavy enough to stimulate, fast enough to torch calories",
  splitKey: "Metabolic Resistance",
  equipment: ["full", "home_bar", "dumbbells"],
  sessionMins: 50,
}

PROGRAMS_BY_DAYS[4].splits["Metabolic Resistance"]:
{
  description: "Supersets of compound movements with 45-60 second rest periods. Heavy enough to preserve muscle mass, fast enough to keep heart rate elevated. The combination of resistance training and metabolic stress drives fat loss better than cardio or lifting alone.",
  days: ["Upper Metabolic A", "Lower Metabolic A", "Upper Metabolic B", "Lower Metabolic B"],
  alternating: false,
  workouts: {
    "Upper Metabolic A": [
      { name: "Barbell Bench Press",    sets: 4, reps: "8-10",  notes: "SUPERSET A1. 45 sec rest between supersets only.", primary: true },
      { name: "Barbell Row",            sets: 4, reps: "8-10",  notes: "SUPERSET A2. Immediately after bench. No rest between A1 and A2.", primary: true },
      { name: "Dumbbell Shoulder Press",sets: 3, reps: "10-12", notes: "SUPERSET B1.", primary: false },
      { name: "Face Pull",              sets: 3, reps: "15",    notes: "SUPERSET B2.", primary: false },
      { name: "Dumbbell Curl",          sets: 3, reps: "12",    notes: "SUPERSET C1.", primary: false },
      { name: "Tricep Pushdown",        sets: 3, reps: "12",    notes: "SUPERSET C2.", primary: false }
    ],
    "Lower Metabolic A": [
      { name: "Barbell Squat",          sets: 4, reps: "10-12", notes: "SUPERSET A1. Keep rest short — 60 sec between supersets.", primary: true },
      { name: "Romanian Deadlift",      sets: 4, reps: "10-12", notes: "SUPERSET A2.", primary: true },
      { name: "Walking Lunge",          sets: 3, reps: "12 each", notes: "SUPERSET B1. Dumbbell or barbell.", primary: false },
      { name: "Leg Curl",               sets: 3, reps: "12-15", notes: "SUPERSET B2.", primary: false },
      { name: "Box Jump",               sets: 3, reps: "10",    notes: "Explosive. Land softly.", primary: false },
      { name: "Plank",                  sets: 3, reps: "45 sec", notes: "", primary: false }
    ],
    "Upper Metabolic B": [
      { name: "Incline Dumbbell Press", sets: 4, reps: "10-12", notes: "SUPERSET A1.", primary: true },
      { name: "Cable Row",              sets: 4, reps: "10-12", notes: "SUPERSET A2.", primary: true },
      { name: "Lateral Raise",          sets: 3, reps: "15",    notes: "SUPERSET B1.", primary: false },
      { name: "Rear Delt Fly",          sets: 3, reps: "15",    notes: "SUPERSET B2.", primary: false },
      { name: "Push Up",                sets: 3, reps: "max",   notes: "Finisher. No rest. To failure.", primary: false }
    ],
    "Lower Metabolic B": [
      { name: "Deadlift",               sets: 4, reps: "8-10",  notes: "SUPERSET A1.", primary: true },
      { name: "Goblet Squat",           sets: 4, reps: "12-15", notes: "SUPERSET A2. Dumbbell or kettlebell.", primary: false },
      { name: "Bulgarian Split Squat",  sets: 3, reps: "10 each", notes: "SUPERSET B1. Rear foot elevated.", primary: false },
      { name: "Leg Extension",          sets: 3, reps: "15",    notes: "SUPERSET B2.", primary: false },
      { name: "Burpee",                 sets: 3, reps: "10",    notes: "Finisher. Full extension at top.", primary: false },
      { name: "Mountain Climber",       sets: 3, reps: "30 sec", notes: "Core finisher.", primary: false }
    ]
  }
}
```

#### 9. HIIT Strength Circuit (new)
```
PROGRAM_LIBRARY:
{
  id: "hiit_strength",
  name: "HIIT Strength Circuit",
  category: "Fat Loss & Conditioning",
  days: 3,
  weeks: 6,
  level: "Beginner",
  bestFor: "Burn fat and build base fitness with 3 sessions per week",
  splitKey: "HIIT Strength",
  equipment: ["full", "home_bar", "dumbbells", "minimal"],
  sessionMins: 45,
}

PROGRAMS_BY_DAYS[3].splits["HIIT Strength"]:
{
  description: "Three full-body sessions per week combining strength movements with conditioning finishers. Each session is 40-45 minutes. Perfect for someone building base fitness while losing fat.",
  days: ["Session A", "Session B", "Session C"],
  alternating: false,
  workouts: {
    "Session A": [
      { name: "Goblet Squat",           sets: 3, reps: "12-15", notes: "Start here. Warm up the whole body.", primary: true },
      { name: "Push Up",                sets: 3, reps: "10-15", notes: "Chest to floor.", primary: true },
      { name: "Dumbbell Row",           sets: 3, reps: "12 each", notes: "Elbow high.", primary: true },
      { name: "AMRAP 10 min",           sets: 1, reps: "As many rounds as possible", notes: "Finisher: 10 air squats + 10 push ups + 10 sit ups. Rest only when necessary.", primary: false }
    ],
    "Session B": [
      { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "12-15", notes: "Hip hinge. Feel hamstrings.", primary: true },
      { name: "Dumbbell Shoulder Press",    sets: 3, reps: "12",    notes: "", primary: true },
      { name: "Plank",                      sets: 3, reps: "45 sec", notes: "", primary: false },
      { name: "EMOM 10 min",                sets: 1, reps: "Every minute on the minute", notes: "Finisher: Odd minutes = 10 dumbbell deadlifts. Even minutes = 10 push ups.", primary: false }
    ],
    "Session C": [
      { name: "Lunge",                  sets: 3, reps: "10 each leg", notes: "Alternating. Control the descent.", primary: true },
      { name: "Dumbbell Bench Press",   sets: 3, reps: "12",    notes: "", primary: true },
      { name: "Lat Pulldown",           sets: 3, reps: "12",    notes: "Or resistance band pull apart.", primary: true },
      { name: "For Time",               sets: 1, reps: "Complete as fast as possible", notes: "Finisher: 3 rounds of 15 squats, 10 push ups, 200m run (or 30 jumping jacks).", primary: false }
    ]
  }
}
```

---

### CATEGORY: HYROX

#### 10. Hyrox First Timer (new)
```
PROGRAM_LIBRARY entry:
{
  id: "hyrox_8w",
  name: "8-Week First Timer",
  category: "Hyrox",
  days: 4,
  weeks: 8,
  level: "Beginner",
  bestFor: "First Hyrox completion — learn every station, build your aerobic base",
  splitKey: null,
  isHyrox: true,
  equipment: ["full"],
  sessionMins: 60,
}

Structure in running_programs.js as HYROX_PROGRAMS["8-Week First Timer"]:
{
  weeks: 8,
  goal: "Complete your first Hyrox and feel proud crossing the line",
  structure: "2 run sessions + 1 station intro + 1 strength day + 3 rest days",
  keyWeeks: {
    1: {
      theme: "Station Introduction",
      days: {
        Mon: { type: "Strength", description: "Squat 3×10, Deadlift 3×8, OHP 3×10, Pull Up 3×max, Farmers Carry 2×30m", skill_variants: { novice: { description: "Bodyweight squat if needed. All movements with light weight first.", goal: "Learn the patterns." } } },
        Tue: { type: "Easy Run", description: "3km easy. Conversational pace. If walking, that's fine.", skill_variants: { novice: { description: "Walk/run intervals. Keep moving.", duration: "20-30 min" } } },
        Wed: { type: "Station Intro", description: "SkiErg 3×100m technique only. Row 3×100m technique only. Wall Ball 3×10 light. Learn the movements.", skill_variants: { novice: { description: "Ask gym staff to show you the SkiErg and rower. Form first, always.", sled_weight: "Empty sled only", wall_balls: "6kg" } } },
        Thu: { type: "Rest", description: "Active recovery or full rest." },
        Fri: { type: "Strength", description: "Sled Push 3×15m empty. Sandbag Carry 2×20m. Farmers Carry 3×30m.", skill_variants: { novice: { description: "Focus on movement quality. No weight on sled yet.", sled_weight: "Empty" } } },
        Sat: { type: "Long Run", description: "5km easy. The longest run of week 1.", skill_variants: { novice: { description: "Walk/run. Goal is 5km of movement.", duration: "40-50 min" } } },
        Sun: { type: "Rest", description: "Rest." }
      }
    },
    4: {
      theme: "Building Volume",
      days: {
        Mon: { type: "Strength", description: "Squat 4×8, Deadlift 3×6, OHP 3×8, Pull Up 3×max, Farmers Carry 3×40m", skill_variants: { novice: { goal: "Add small weight from week 1." } } },
        Tue: { type: "Run Intervals", description: "4×500m @ effort with 90 sec rest", skill_variants: { novice: { description: "Run at a pace where you can't speak full sentences.", duration: "30 min" } } },
        Wed: { type: "Station Circuit", description: "SkiErg 3×250m, Row 3×250m, Wall Ball 3×15, Sled Push 2×15m light", skill_variants: { novice: { sled_weight: "10-20kg", wall_balls: "6-9kg" } } },
        Thu: { type: "Rest" },
        Fri: { type: "Functional Strength", description: "Sled Push 4×20m, Sled Pull 3×20m, Sandbag Lunge 3×15m, BBJ 3×5m", skill_variants: { novice: { sled_weight: "20-30kg" } } },
        Sat: { type: "Long Run", description: "7km easy", skill_variants: { novice: { duration: "50-60 min" } } },
        Sun: { type: "Rest" }
      }
    },
    8: {
      theme: "Race Week",
      days: {
        Mon: { type: "Easy Run", description: "3km very easy. Last real run.", skill_variants: { novice: { description: "Just shake the legs out." } } },
        Tue: { type: "Shakeout", description: "1 round each station at 40% effort. Mental rehearsal.", skill_variants: { novice: { sled_weight: "Race weight", goal: "Remember the movements." } } },
        Wed: { type: "Rest" },
        Thu: { type: "Rest" },
        Fri: { type: "Rest" },
        Sat: { type: "RACE DAY", description: "Your first Hyrox. Start conservative, finish strong.", skill_variants: { novice: { goal: "Complete it. Time is irrelevant." } } },
        Sun: { type: "Recovery", description: "Walk, eat, celebrate." }
      }
    }
  }
}
```

#### 11. Hyrox Elite Prep (new) — 16-week, advanced
```
PROGRAM_LIBRARY:
{
  id: "hyrox_elite",
  name: "16-Week Elite Prep",
  category: "Hyrox",
  days: 6,
  weeks: 16,
  level: "Advanced",
  bestFor: "Sub-60 min Open or Pro category — peak Hyrox performance",
  splitKey: null,
  isHyrox: true,
  equipment: ["full"],
  sessionMins: 90,
}
Note: Full week data follows same structure as existing 12-Week Race Prep in running_programs.js.
Key weeks: 1 (base), 4 (build), 8 (peak volume), 12 (race sim), 14 (full sim), 16 (taper + race).
Key differentiators from intermediate: higher sled weights (pro category), sub-60 min run pacing,
double station days in peak weeks, 2-a-day optional sessions.
```

---

### CATEGORY: HYBRID

#### 12. Hybrid Foundation (new)
```
PROGRAM_LIBRARY:
{
  id: "hybrid_foundation",
  name: "Hybrid Foundation",
  category: "Hybrid",
  days: 4,
  weeks: 8,
  level: "Beginner",
  bestFor: "Build strength and cardio simultaneously — the base every hybrid athlete needs",
  splitKey: "Hybrid Foundation",
  equipment: ["full", "home_bar"],
  sessionMins: 60,
}

PROGRAMS_BY_DAYS[4].splits["Hybrid Foundation"]:
{
  description: "Two lifting sessions and two cardio sessions per week. Builds the aerobic base and strength base simultaneously without either limiting the other. Perfect for someone transitioning from pure lifting to hybrid training.",
  days: ["Strength A", "Cardio A", "Strength B", "Cardio B"],
  alternating: false,
  workouts: {
    "Strength A": [
      { name: "Barbell Squat",       sets: 4, reps: "6-8",   notes: "Foundation lift. Below parallel.", primary: true },
      { name: "Barbell Bench Press", sets: 4, reps: "6-8",   notes: "", primary: true },
      { name: "Barbell Row",         sets: 4, reps: "6-8",   notes: "", primary: true },
      { name: "Romanian Deadlift",   sets: 3, reps: "10-12", notes: "", primary: false },
      { name: "Farmers Carry",       sets: 3, reps: "40m",   notes: "Grip and core stability.", primary: false }
    ],
    "Cardio A": [
      { name: "Easy Run or Row",     sets: 1, reps: "30-40 min", notes: "Zone 2 cardio. Conversational pace. Heart rate ~130-150 bpm. This is aerobic base building — not a workout, it's training the engine.", primary: true }
    ],
    "Strength B": [
      { name: "Deadlift",            sets: 4, reps: "4-6",   notes: "Heaviest lift of the week.", primary: true },
      { name: "Overhead Press",      sets: 4, reps: "6-8",   notes: "", primary: true },
      { name: "Pull Up",             sets: 4, reps: "max",   notes: "Or lat pulldown.", primary: true },
      { name: "Bulgarian Split Squat",sets: 3, reps: "8-10 each", notes: "Single leg strength.", primary: false },
      { name: "Plank",               sets: 3, reps: "60 sec", notes: "", primary: false }
    ],
    "Cardio B": [
      { name: "Intervals",           sets: 6, reps: "1 min on / 2 min off", notes: "Run, row, or bike. Effort during work intervals: 8/10. Recovery: easy walking/rowing. Total session 30 min.", primary: true }
    ]
  }
}
```

#### 13. Tactical Hybrid (new)
```
PROGRAM_LIBRARY:
{
  id: "tactical_hybrid",
  name: "Tactical Hybrid",
  category: "Hybrid",
  days: 5,
  weeks: 12,
  level: "Advanced",
  bestFor: "Military and operator-style — loaded carries, running, heavy lifting all in one week",
  splitKey: "Tactical Hybrid",
  equipment: ["full"],
  sessionMins: 75,
}

PROGRAMS_BY_DAYS[5].splits["Tactical Hybrid"]:
{
  description: "Built for athletes who need to be strong, fast, and resilient under load. Combines heavy barbell work with loaded carries, rucking, and running. Inspired by military and tactical fitness standards.",
  days: ["Heavy Strength", "Ruck + Carry", "Olympic + Conditioning", "Sprint + Gymnastics", "Long Aerobic"],
  alternating: false,
  workouts: {
    "Heavy Strength": [
      { name: "Back Squat",          sets: 5, reps: "3-5",   notes: "Heavy. Strength is the foundation.", primary: true },
      { name: "Deadlift",            sets: 4, reps: "3-5",   notes: "", primary: true },
      { name: "Overhead Press",      sets: 4, reps: "5",     notes: "Strict. Tactical athletes need strict pressing.", primary: true },
      { name: "Weighted Pull Up",    sets: 4, reps: "5-8",   notes: "Add weight when bodyweight becomes easy.", primary: true },
      { name: "Farmer Carry",        sets: 4, reps: "50m",   notes: "Heavy. Your bodyweight total is the target.", primary: false }
    ],
    "Ruck + Carry": [
      { name: "Ruck March",          sets: 1, reps: "5-8km", notes: "20-35kg pack. 15-18 min/km pace. This builds everything.", primary: true },
      { name: "Sandbag Clean",       sets: 3, reps: "10",    notes: "After rucking. Explosive hip drive.", primary: false },
      { name: "Sandbag Carry",       sets: 4, reps: "40m",   notes: "Bear hug carry. Core braced.", primary: false }
    ],
    "Olympic + Conditioning": [
      { name: "Power Clean",         sets: 5, reps: "3",     notes: "Explosive. Reset each rep.", primary: true },
      { name: "Push Press",          sets: 4, reps: "5",     notes: "Leg drive into press. Lockout overhead.", primary: true },
      { name: "AMRAP 15 min",        sets: 1, reps: "As many rounds as possible", notes: "5 power cleans + 10 push ups + 15 air squats. Conditioning finisher.", primary: false }
    ],
    "Sprint + Gymnastics": [
      { name: "Sprint",              sets: 8, reps: "100m",  notes: "Full sprint. Walk back recovery. Build speed.", primary: true },
      { name: "Pull Up",             sets: 4, reps: "10-15", notes: "Bodyweight. Chest to bar.", primary: false },
      { name: "Ring Dip",            sets: 3, reps: "8-12",  notes: "Or bar dip.", primary: false },
      { name: "Toes to Bar",         sets: 3, reps: "10",    notes: "Core. Control the descent.", primary: false }
    ],
    "Long Aerobic": [
      { name: "Long Run or Row",     sets: 1, reps: "45-60 min", notes: "Easy pace. Zone 2. Aerobic base maintenance. Nothing heroic today — save the intensity for the week ahead.", primary: true }
    ]
  }
}
```

---

### CATEGORY: METCON (new category entirely)

#### 14. MetCon Foundations (new)
```
PROGRAM_LIBRARY:
{
  id: "metcon_foundations",
  name: "MetCon Foundations",
  category: "MetCon",
  days: 3,
  weeks: 8,
  level: "Beginner",
  bestFor: "Learn metabolic conditioning — functional movements, short sessions, big results",
  splitKey: "MetCon Foundations",
  equipment: ["full", "dumbbells", "minimal"],
  sessionMins: 40,
}

Note: MetCon workouts use AMRAP (as many rounds as possible in X minutes),
EMOM (every minute on the minute), and "For Time" formats.

PROGRAMS_BY_DAYS[3].splits["MetCon Foundations"]:
{
  description: "MetCon — metabolic conditioning — builds cardiovascular capacity, muscular endurance, and burns significant calories in short sessions. No Olympic lifting. No complex gymnastics. Pure functional movement done with intention.",
  days: ["Session A", "Session B", "Session C"],
  alternating: false,
  workouts: {
    "Session A — AMRAP": [
      { name: "Warm Up",             sets: 1, reps: "5 min",  notes: "3 rounds: 10 air squats, 10 push ups, 10 sit ups. Movement prep.", primary: false },
      { name: "AMRAP 15 min",        sets: 1, reps: "As many rounds as possible", notes: "5 push ups → 10 air squats → 15 sit ups. Record your rounds. This is your benchmark — beat it next month.", primary: true },
      { name: "Cool Down Run",       sets: 1, reps: "400m",   notes: "Easy jog or walk.", primary: false }
    ],
    "Session B — EMOM": [
      { name: "Warm Up",             sets: 1, reps: "5 min",  notes: "Mobility and movement.", primary: false },
      { name: "EMOM 16 min",         sets: 1, reps: "Every minute on the minute", notes: "Min 1: 8 dumbbell deadlifts. Min 2: 10 push ups. Min 3: 12 sit ups. Min 4: 200m run. Repeat 4 times. Rest any remaining time in the minute.", primary: true },
      { name: "Core Finisher",       sets: 3, reps: "30 sec", notes: "Plank hold. Maximum tension.", primary: false }
    ],
    "Session C — For Time": [
      { name: "Warm Up",             sets: 1, reps: "5 min",  notes: "Dynamic stretching.", primary: false },
      { name: "For Time",            sets: 1, reps: "Complete as fast as possible", notes: "3 rounds: 15 goblet squats (light DB) → 12 DB push press → 9 burpees → 400m run. Record your time. Aim to go faster next time.", primary: true }
    ]
  }
}
```

#### 15. Performance MetCon (new)
```
PROGRAM_LIBRARY:
{
  id: "metcon_performance",
  name: "Performance MetCon",
  category: "MetCon",
  days: 4,
  weeks: 8,
  level: "Intermediate",
  bestFor: "Benchmark WODs, barbell cycling, pull-ups — competitive MetCon fitness",
  splitKey: "Performance MetCon",
  equipment: ["full"],
  sessionMins: 60,
}

PROGRAMS_BY_DAYS[4].splits["Performance MetCon"]:
{
  description: "Benchmark WODs are the measuring sticks of metabolic fitness. Fran (21-15-9 thrusters + pull-ups) is the most famous. By the end of this program you'll have completed Fran, Cindy, Kelly, and Helen — and have times to beat forever.",
  days: ["Strength + Conditioning", "Benchmark WOD", "EMOM Volume", "Long Chipper"],
  alternating: false,
  workouts: {
    "Strength + Conditioning": [
      { name: "Back Squat",          sets: 5, reps: "5",     notes: "Strength component first. Heavy.", primary: true },
      { name: "Barbell Deadlift",    sets: 3, reps: "5",     notes: "", primary: true },
      { name: "Conditioning — For Time", sets: 1, reps: "Complete ASAP", notes: "3 rounds: 10 hang power cleans (moderate weight) + 10 burpees + 200m run. Record time.", primary: false }
    ],
    "Benchmark WOD": [
      { name: "Fran",                sets: 1, reps: "21-15-9", notes: "Thrusters (42.5kg / 30kg) + Pull Ups. For time. This is the most famous benchmark in MetCon. Go as hard as you can from the start. Record your time. Sub-5 min is competitive.", primary: true },
      { name: "Cindy (alternate weeks)", sets: 1, reps: "AMRAP 20 min", notes: "5 pull ups + 10 push ups + 15 air squats. As many rounds as possible in 20 minutes. 20+ rounds is competitive.", primary: true }
    ],
    "EMOM Volume": [
      { name: "EMOM 20 min",         sets: 1, reps: "Every minute on the minute", notes: "Min 1: 5 power cleans @ moderate weight. Min 2: 10 push ups. Min 3: 15 wall balls. Min 4: 200m run. Repeat 5 times.", primary: true },
      { name: "Core — Toes to Bar",  sets: 3, reps: "10",    notes: "Controlled. Don't kip until form is solid.", primary: false }
    ],
    "Long Chipper": [
      { name: "Helen",               sets: 1, reps: "3 rounds for time", notes: "400m run + 21 kettlebell swings (24kg/16kg) + 12 pull ups. Sub-10 min is competitive. This is a classic test of all-around fitness.", primary: true },
      { name: "Kelly (alternate weeks)", sets: 1, reps: "5 rounds for time", notes: "400m run + 30 box jumps (24in/20in) + 30 wall balls (9kg/6kg). A true lung-burner. Sub-30 min is the target.", primary: true }
    ]
  }
}
```

#### 16. Elite MetCon (new)
```
PROGRAM_LIBRARY:
{
  id: "metcon_elite",
  name: "Elite MetCon",
  category: "MetCon",
  days: 5,
  weeks: 12,
  level: "Advanced",
  bestFor: "Competition prep — Olympic lifting, complex gymnastics, peak mixed-modal capacity",
  splitKey: "Elite MetCon",
  equipment: ["full"],
  sessionMins: 90,
}

PROGRAMS_BY_DAYS[5].splits["Elite MetCon"]:
{
  description: "Five sessions per week with two-a-days optional on skill days. Olympic lifting, gymnastics, and high-intensity conditioning. This program assumes proficiency in the snatch, clean and jerk, and kipping pull-ups.",
  days: ["Heavy Barbell + Short Conditioning", "Gymnastics + Moderate Conditioning", "Olympic Skill + Long Aerobic", "Team / Partner WOD Format", "Competition Simulation"],
  alternating: false,
  workouts: {
    "Heavy Barbell + Short Conditioning": [
      { name: "Back Squat",          sets: 5, reps: "3",     notes: "90%+ of max. Strength base.", primary: true },
      { name: "Clean and Jerk",      sets: 5, reps: "2",     notes: "Technical. Not for time — perfect reps.", primary: true },
      { name: "Diane — For Time",    sets: 1, reps: "21-15-9", notes: "Deadlifts (100kg/70kg) + Handstand Push Ups. Sub-5 min is elite.", primary: false }
    ],
    "Gymnastics + Moderate Conditioning": [
      { name: "Muscle Up Practice",  sets: 5, reps: "3-5",   notes: "Ring or bar. Quality over speed.", primary: true },
      { name: "Handstand Walk",      sets: 4, reps: "10m",   notes: "Or handstand holds/wall walks.", primary: false },
      { name: "AMRAP 20 min",        sets: 1, reps: "Rounds + reps", notes: "5 muscle ups + 10 power snatches (60kg/40kg) + 15 box jumps. Record score.", primary: false }
    ],
    "Olympic Skill + Long Aerobic": [
      { name: "Snatch",              sets: 6, reps: "2 @ 80%", notes: "Touch and go. Footwork perfect.", primary: true },
      { name: "Zone 2 Row or Run",   sets: 1, reps: "40 min", notes: "Easy aerobic. Recovery pace. This session is about the engine, not the cylinders.", primary: false }
    ],
    "Team / Partner WOD Format": [
      { name: "Partner Cindy",       sets: 1, reps: "AMRAP 30 min", notes: "You go / I go: partner A does a round while B rests. 5 pull ups + 10 push ups + 15 air squats. Target: 40+ combined rounds.", primary: true }
    ],
    "Competition Simulation": [
      { name: "Open WOD Simulation", sets: 1, reps: "Full competition format", notes: "Set a timer for an Open workout format: 20 min AMRAP with 3-4 movements. Score it like competition. This is your weekly test.", primary: true }
    ]
  }
}
```

---

### CATEGORY: SPORT SPECIFIC

#### 17. Athletic Performance Base (new — stops trainType fallthrough)
```
PROGRAM_LIBRARY:
{
  id: "athletic_base",
  name: "Athletic Performance Base",
  category: "Sport",
  days: 4,
  weeks: 8,
  level: "Intermediate",
  bestFor: "Sport-specific athleticism — speed, power, agility, and strength for any sport",
  splitKey: "Athletic Performance",
  equipment: ["full"],
  sessionMins: 60,
}

PROGRAMS_BY_DAYS[4].splits["Athletic Performance"]:
{
  description: "Built for athletes who play a sport and need general physical preparedness. Combines power (for explosive movements in sport), strength (to avoid injury), and speed work. Pairs with your sport practice — do not add additional cardio.",
  days: ["Power + Lower Body", "Speed + Upper Body", "Strength Complex", "Agility + Conditioning"],
  alternating: false,
  workouts: {
    "Power + Lower Body": [
      { name: "Box Jump",            sets: 5, reps: "5",     notes: "Explosive. Land softly. Full hip extension at top.", primary: true },
      { name: "Barbell Squat",       sets: 4, reps: "4-6",   notes: "Power-focused. Move the bar fast on the way up.", primary: true },
      { name: "Power Clean",         sets: 4, reps: "3",     notes: "Explosive hip drive. Catch in quarter squat.", primary: true },
      { name: "Lunge",               sets: 3, reps: "8 each", notes: "Single leg stability.", primary: false },
      { name: "Nordic Hamstring Curl",sets: 3, reps: "5-8",  notes: "Best hamstring injury prevention exercise.", primary: false }
    ],
    "Speed + Upper Body": [
      { name: "Sprint",              sets: 6, reps: "40m",   notes: "Maximum effort. Full recovery between sets (3 min). Acceleration focus.", primary: true },
      { name: "Barbell Bench Press", sets: 4, reps: "6",     notes: "Explosive intent. Move it fast.", primary: true },
      { name: "Weighted Pull Up",    sets: 4, reps: "6",     notes: "", primary: true },
      { name: "Medicine Ball Throw", sets: 4, reps: "6",     notes: "Chest pass against wall or overhead slam. Power transfer.", primary: false }
    ],
    "Strength Complex": [
      { name: "Deadlift",            sets: 4, reps: "4-6",   notes: "Posterior chain is king for sport performance.", primary: true },
      { name: "Overhead Press",      sets: 3, reps: "6-8",   notes: "Shoulder stability and pressing power.", primary: true },
      { name: "Bulgarian Split Squat",sets: 3, reps: "8 each", notes: "Single leg strength. Most important for change of direction.", primary: false },
      { name: "Copenhagen Plank",    sets: 3, reps: "20-30 sec each", notes: "Groin/adductor stability. Reduces injury risk dramatically.", primary: false }
    ],
    "Agility + Conditioning": [
      { name: "Ladder Drills",       sets: 5, reps: "3 patterns", notes: "Agility ladder. Speed of foot movement.", primary: true },
      { name: "Shuttle Run",         sets: 6, reps: "5-10-5",  notes: "Plant and cut. Change of direction speed.", primary: true },
      { name: "Conditioning Circuit",sets: 4, reps: "45 sec on / 15 sec off", notes: "4 movements: burpee → box jump → KB swing → row/run. Sport-specific conditioning.", primary: false }
    ]
  }
}
```

---

### CATEGORY: RUNNING (addition)

#### 18. Advanced Marathon Prep (new)
Running programs use a different data structure. Add to running_programs.js:
```
RUNNING_PROGRAMS["Advanced Marathon Prep"] = {
  weeks: 16,
  goal: "Qualify for Boston or set a new PR",
  structure: "5 run days + 1 strength + 1 rest. Periodized mileage build with 3-week progressive / 1-week recovery cycles.",
  keyWeeks: {
    1: { mileage: 45, theme: "Base", keyWorkouts: ["8km easy", "12km with 6km @tempo", "20km long run easy"] },
    4: { mileage: 40, theme: "Recovery week", keyWorkouts: ["Easy running only. No tempo, no intervals."] },
    8: { mileage: 60, theme: "Peak volume", keyWorkouts: ["16×800m @ 5K pace", "10km @marathon pace", "35km long run"] },
    12: { mileage: 55, theme: "Race simulation", keyWorkouts: ["32km long run with last 8km @race pace"] },
    16: { mileage: 25, theme: "Taper", keyWorkouts: ["4km easy", "2km race pace", "RACE DAY"] }
  }
}

PROGRAM_LIBRARY:
{
  id: "marathon_advanced",
  name: "Advanced Marathon",
  category: "Running",
  days: 5,
  weeks: 16,
  level: "Advanced",
  bestFor: "Boston qualifier or sub-3:30 — serious marathon performance",
  splitKey: null,
  isRunning: true,
  equipment: ["minimal"],
  sessionMins: 75,
}
```

---

## PART 4 — SUMMARY OF ALL CHANGES

### New PROGRAM_LIBRARY entries: 17 new + 1 updated (Arnold moved to Golden Era)
### Programs.js: 9 new PROGRAMS_BY_DAYS splits
### running_programs.js: 3 new programs (Hyrox First Timer, Hyrox Elite, Advanced Marathon)
### ob_new.jsx: 2 new screens (equipment, sessionLength), 1 updated (MetCon added to trainType)
### components.jsx: metcon added to calcTDEE multiplier
### sections.jsx: getDayMacros updated, ProgramLibrary filter fixed, Golden Era + MetCon + Sport filter chips added
### FILTER_TABS updated: ["All", "Strength", "Golden Era", "Running", "Hyrox", "Hybrid", "MetCon", "Glute", "Fat Loss", "Sport"]


---

## ADDENDUM — GOLDEN ERA ADDITIONS (5 more programs)

### GERMAN VOLUME TRAINING (GVT)
```
PROGRAM_LIBRARY:
{
  id: "gvt",
  name: "German Volume Training",
  category: "Golden Era",
  days: 5,
  weeks: 6,
  level: "Intermediate",
  bestFor: "10×10 — the most effective volume accumulation method ever designed",
  splitKey: "GVT",
  equipment: ["full", "home_bar"],
  sessionMins: 75,
}

Key: All percentages are of 1RM. Use 60% for the 10×10 sets.
The two main exercises per session are SUPERSETTED — no rest between A1 and A2,
60-90 seconds rest after the superset. Do NOT increase weight until all 10×10 reps
are completed across 3 sessions. When you complete all 100 reps in a session, add
2.5% next session.

PROGRAMS_BY_DAYS[5].splits["GVT"]:
{
  description: "German Olympic weightlifters used 10 sets of 10 to build rapid hypertrophy in the off-season. Charles Poliquin brought it to bodybuilding. The method works through cumulative fatigue — the last 4 sets feel completely different from the first 4. Use 60% of your max. It sounds easy. It is not.",
  days: ["Chest + Back", "Legs + Abs", "Rest", "Shoulders + Arms", "Rest"],
  alternating: false,
  workouts: {
    "Chest + Back": [
      { name: "Barbell Bench Press (A1)", sets: 10, reps: "10 @ 60% 1RM", notes: "SUPERSET with A2. No rest between A1 and A2. 60-90 sec rest after the superset. Same weight all 10 sets. Do not increase weight until all 100 reps are complete.", primary: true },
      { name: "Barbell Row (A2)", sets: 10, reps: "10 @ 60% 1RM", notes: "SUPERSET with A1. Execute immediately after A1. Pronated grip, row to lower chest.", primary: true },
      { name: "Incline Dumbbell Press (B1)", sets: 3, reps: "10-12", notes: "Assistance work only. 3×12 after the 10×10.", primary: false },
      { name: "Cable Row (B2)", sets: 3, reps: "10-12", notes: "Assistance. Superset with B1.", primary: false }
    ],
    "Legs + Abs": [
      { name: "Barbell Squat (A1)", sets: 10, reps: "10 @ 60% 1RM", notes: "SUPERSET with A2. Below parallel every rep. This is where GVT breaks most people.", primary: true },
      { name: "Romanian Deadlift (A2)", sets: 10, reps: "10 @ 60% 1RM", notes: "SUPERSET with A1. Hip hinge. Feel the stretch.", primary: true },
      { name: "Leg Curl (B1)", sets: 3, reps: "10-12", notes: "Assistance.", primary: false },
      { name: "Hanging Leg Raise (B2)", sets: 3, reps: "12-15", notes: "Core assistance.", primary: false }
    ],
    "Rest": [],
    "Shoulders + Arms": [
      { name: "Overhead Press (A1)", sets: 10, reps: "10 @ 60% 1RM", notes: "SUPERSET with A2. Strict press — no leg drive.", primary: true },
      { name: "Lat Pulldown (A2)", sets: 10, reps: "10 @ 60% 1RM", notes: "SUPERSET with A1. Wide grip. Pull to upper chest.", primary: true },
      { name: "Dumbbell Lateral Raise (B1)", sets: 3, reps: "10-12", notes: "Assistance — medial deltoid.", primary: false },
      { name: "Barbell Curl (B2)", sets: 3, reps: "10-12", notes: "Assistance — biceps.", primary: false },
      { name: "Tricep Pushdown (B3)", sets: 3, reps: "10-12", notes: "Assistance — triceps.", primary: false }
    ]
  }
}
```

---

### REG PARK 5×5 — HEAVY BASIC POWERBUILDING
```
PROGRAM_LIBRARY:
{
  id: "reg_park",
  name: "Reg Park 5×5",
  category: "Golden Era",
  days: 3,
  weeks: 24,
  level: "Beginner",
  bestFor: "The original powerbuilding — Arnold's idol built his physique on this exact program",
  splitKey: "Reg Park 5x5",
  equipment: ["full", "home_bar"],
  sessionMins: 60,
}

Note: 3-phase program. 3 days/week (Mon/Wed/Fri or similar).
Phase 1 (weeks 1-8): Learn the movements and build the base.
Phase 2 (weeks 9-16): Add deadlifts and standing press, increase weight.
Phase 3 (weeks 17-24): Peak strength phase.

PROGRAMS_BY_DAYS[3].splits["Reg Park 5x5"]:
{
  description: "Reg Park was Arnold Schwarzenegger's idol. Arnold modeled his early training on Park's methods before developing his own system. Park's principle: get brutally strong on the basic compound lifts and the muscle mass will follow. This is the original powerbuilding program — decades before the term was invented.",
  days: ["Phase 1 A/B/A", "Phase 2 A/B/A", "Phase 3 A/B/A"],
  alternating: true,
  workouts: {
    "Phase 1 A/B/A": [
      { name: "Barbell Squat", sets: 5, reps: "5", notes: "Weeks 1-8. Add weight when all 5×5 reps completed. Start light — form before weight.", primary: true },
      { name: "Barbell Bench Press", sets: 5, reps: "5", notes: "Weeks 1-8. Touch chest every rep. Add weight weekly.", primary: true },
      { name: "Barbell Row", sets: 5, reps: "5", notes: "Weeks 1-8. Row to lower chest. These three are the foundation.", primary: true },
      { name: "Barbell Curl", sets: 2, reps: "8-10", notes: "Assistance only. Keep it brief.", primary: false },
      { name: "Tricep Extension", sets: 2, reps: "8-10", notes: "Assistance only.", primary: false },
      { name: "Calf Raise", sets: 2, reps: "15", notes: "Assistance.", primary: false }
    ],
    "Phase 2 A/B/A": [
      { name: "Front Squat", sets: 5, reps: "5", notes: "Weeks 9-16. Park alternated front and back squats.", primary: true },
      { name: "Deadlift", sets: 5, reps: "5", notes: "Weeks 9-16. The most important addition. Every serious lifter must deadlift.", primary: true },
      { name: "Barbell Bench Press", sets: 5, reps: "5", notes: "Continue adding weight.", primary: true },
      { name: "Overhead Press", sets: 5, reps: "5", notes: "Strict press. Added in phase 2.", primary: true },
      { name: "Barbell Row", sets: 5, reps: "5", notes: "Continue from phase 1.", primary: true },
      { name: "Barbell Curl", sets: 3, reps: "8", notes: "", primary: false },
      { name: "Tricep Extension", sets: 3, reps: "8", notes: "", primary: false },
      { name: "Calf Raise", sets: 3, reps: "15", notes: "", primary: false }
    ],
    "Phase 3 A/B/A": [
      { name: "Back Squat", sets: 5, reps: "5", notes: "Weeks 17-24. Maximum weights. This is peak phase.", primary: true },
      { name: "Deadlift", sets: 5, reps: "5", notes: "Should be moving serious weight by now.", primary: true },
      { name: "Barbell Bench Press", sets: 5, reps: "5", notes: "Peak strength phase.", primary: true },
      { name: "Overhead Press", sets: 5, reps: "5", notes: "", primary: true },
      { name: "Power Clean", sets: 5, reps: "5", notes: "Park added power cleans in his advanced phase.", primary: true },
      { name: "Barbell Curl", sets: 3, reps: "8", notes: "", primary: false },
      { name: "Tricep Extension", sets: 3, reps: "8", notes: "", primary: false },
      { name: "Calf Raise", sets: 3, reps: "15", notes: "", primary: false }
    ]
  }
}
```

---

### SERGE NUBRET PUMP PROTOCOL
```
PROGRAM_LIBRARY:
{
  id: "nubret_pump",
  name: "Serge Nubret Pump Protocol",
  category: "Golden Era",
  days: 6,
  weeks: 12,
  level: "Advanced",
  bestFor: "Ultra-high volume, never to failure — the pump-based philosophy that built one of bodybuilding's greatest physiques",
  splitKey: "Nubret Pump",
  equipment: ["full"],
  sessionMins: 90,
}

Key: Never train to failure. Keep 1-2 reps in reserve always.
The goal is continuous blood flow and metabolic stress — the pump, not failure.
Rest 30-45 seconds between sets ONLY.
Moderate weight — you should be able to complete all reps with good form.
This is 6 days per week. If recovery suffers, take an extra rest day.

PROGRAMS_BY_DAYS[6].splits["Nubret Pump"]:
{
  description: "Serge Nubret trained 6 days per week, 15-20 sets per muscle group, never going to failure. He chased the pump. Where Mike Mentzer believed one perfect set was enough, Nubret believed in flooding the muscle with blood for hours. He had one of the most aesthetic physiques ever built. This program proves that the opposite of Heavy Duty HIT also works.",
  days: ["Chest + Back", "Legs + Abs", "Shoulders + Arms", "Chest + Back", "Legs + Abs", "Shoulders + Arms"],
  alternating: false,
  workouts: {
    "Chest + Back": [
      { name: "Barbell Bench Press", sets: 8, reps: "12", notes: "Moderate weight. Never to failure. 30-45 sec rest. The pump is the goal.", primary: true },
      { name: "Incline Barbell Press", sets: 5, reps: "12", notes: "Upper chest focus. Same rest protocol.", primary: true },
      { name: "Dumbbell Flye", sets: 5, reps: "12", notes: "Full stretch. Feel the pec working.", primary: false },
      { name: "Cable Crossover", sets: 4, reps: "12-15", notes: "Finishing movement. Cross the hands.", primary: false },
      { name: "Barbell Row", sets: 8, reps: "12", notes: "Moderate weight. Full range.", primary: true },
      { name: "T-Bar Row", sets: 5, reps: "12", notes: "", primary: false },
      { name: "Lat Pulldown", sets: 5, reps: "12", notes: "", primary: false }
    ],
    "Legs + Abs": [
      { name: "Barbell Squat", sets: 8, reps: "12", notes: "The volume on leg day is the hardest part. Moderate weight.", primary: true },
      { name: "Leg Press", sets: 5, reps: "15", notes: "", primary: false },
      { name: "Leg Extension", sets: 5, reps: "15", notes: "Pump in the quads.", primary: false },
      { name: "Romanian Deadlift", sets: 5, reps: "12", notes: "Hip hinge. Hamstring focus.", primary: true },
      { name: "Lying Leg Curl", sets: 5, reps: "12", notes: "", primary: false },
      { name: "Standing Calf Raise", sets: 5, reps: "20", notes: "Full range.", primary: false },
      { name: "Crunch", sets: 5, reps: "30", notes: "Slow and controlled.", primary: false }
    ],
    "Shoulders + Arms": [
      { name: "Seated Dumbbell Press", sets: 6, reps: "12", notes: "Shoulder volume block.", primary: true },
      { name: "Dumbbell Lateral Raise", sets: 5, reps: "15", notes: "", primary: false },
      { name: "Bent Over Lateral Raise", sets: 5, reps: "15", notes: "Rear delt.", primary: false },
      { name: "Barbell Curl", sets: 6, reps: "12", notes: "Bicep block. Full range.", primary: true },
      { name: "Incline Dumbbell Curl", sets: 4, reps: "12", notes: "", primary: false },
      { name: "Concentration Curl", sets: 4, reps: "12", notes: "Maximum contraction.", primary: false },
      { name: "Close Grip Bench Press", sets: 6, reps: "12", notes: "Tricep mass.", primary: true },
      { name: "Overhead Tricep Extension", sets: 4, reps: "12", notes: "", primary: false },
      { name: "Tricep Pushdown", sets: 4, reps: "15", notes: "Finisher.", primary: false }
    ]
  }
}
```

---

### WEIDER SUPERSET SYSTEM
```
PROGRAM_LIBRARY:
{
  id: "weider_superset",
  name: "Weider Superset System",
  category: "Golden Era",
  days: 4,
  weeks: 10,
  level: "Intermediate",
  bestFor: "Antagonist supersets — more volume in less time using Joe Weider's foundational principles",
  splitKey: "Weider Superset",
  equipment: ["full", "home_bar"],
  sessionMins: 60,
}

Key: ALL main exercises are paired as antagonist supersets (opposing muscle groups).
No rest between superset partners. 60-90 seconds rest after completing both.
The science: working the antagonist allows the agonist to recover 20% faster
(reciprocal inhibition). You get more volume without more time or more fatigue.
Weider codified this principle after observing every top Golden Era bodybuilder.

PROGRAMS_BY_DAYS[4].splits["Weider Superset"]:
{
  description: "Joe Weider gave names to what great bodybuilders were already doing. The superset principle is the cornerstone: pair opposing muscles back to back with no rest. Chest and back. Biceps and triceps. Quads and hamstrings. Every pairing in this program is an antagonist superset. More volume, less time, better development.",
  days: ["Chest + Back", "Biceps + Triceps + Shoulders", "Legs", "Full Upper Superset"],
  alternating: false,
  workouts: {
    "Chest + Back": [
      { name: "Barbell Bench Press (A1)", sets: 4, reps: "8-10", notes: "ANTAGONIST SUPERSET with A2. No rest between A1 and A2. 75 sec rest after A2.", primary: true },
      { name: "Barbell Row (A2)", sets: 4, reps: "8-10", notes: "SUPERSET. Execute immediately after A1.", primary: true },
      { name: "Incline Dumbbell Press (B1)", sets: 3, reps: "10-12", notes: "SUPERSET with B2.", primary: false },
      { name: "Cable Row (B2)", sets: 3, reps: "10-12", notes: "SUPERSET with B1.", primary: false },
      { name: "Cable Fly (C1)", sets: 3, reps: "12-15", notes: "SUPERSET with C2.", primary: false },
      { name: "Straight Arm Pulldown (C2)", sets: 3, reps: "12-15", notes: "SUPERSET with C1. Lat isolation.", primary: false }
    ],
    "Biceps + Triceps + Shoulders": [
      { name: "Barbell Curl (A1)", sets: 4, reps: "8-10", notes: "SUPERSET with A2. The classic arm superset.", primary: true },
      { name: "Tricep Pushdown (A2)", sets: 4, reps: "8-10", notes: "SUPERSET with A1.", primary: true },
      { name: "Incline Dumbbell Curl (B1)", sets: 3, reps: "10-12", notes: "SUPERSET with B2.", primary: false },
      { name: "Overhead Tricep Extension (B2)", sets: 3, reps: "10-12", notes: "SUPERSET with B1.", primary: false },
      { name: "Overhead Press", sets: 4, reps: "8-12", notes: "Solo — no superset here. Shoulders need full focus.", primary: true },
      { name: "Lateral Raise", sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Rear Delt Fly", sets: 3, reps: "15", notes: "Critical for shoulder balance.", primary: false }
    ],
    "Legs": [
      { name: "Barbell Squat (A1)", sets: 4, reps: "8-10", notes: "SUPERSET with A2. Quad-dominant squat.", primary: true },
      { name: "Romanian Deadlift (A2)", sets: 4, reps: "8-10", notes: "SUPERSET with A1. Hip hinge — hamstring focus.", primary: true },
      { name: "Leg Extension (B1)", sets: 3, reps: "12-15", notes: "SUPERSET with B2. Isolation — quad squeeze.", primary: false },
      { name: "Leg Curl (B2)", sets: 3, reps: "12-15", notes: "SUPERSET with B1.", primary: false },
      { name: "Calf Raise", sets: 4, reps: "15-20", notes: "Solo. Full range.", primary: false }
    ],
    "Full Upper Superset": [
      { name: "Incline Barbell Press (A1)", sets: 4, reps: "10", notes: "SUPERSET with A2.", primary: true },
      { name: "Lat Pulldown (A2)", sets: 4, reps: "10", notes: "SUPERSET with A1.", primary: true },
      { name: "Dumbbell Shoulder Press (B1)", sets: 3, reps: "10", notes: "SUPERSET with B2.", primary: false },
      { name: "Face Pull (B2)", sets: 3, reps: "15", notes: "SUPERSET with B1. Shoulder health.", primary: false },
      { name: "Dumbbell Curl (C1)", sets: 3, reps: "12", notes: "SUPERSET with C2.", primary: false },
      { name: "Skullcrusher (C2)", sets: 3, reps: "12", notes: "SUPERSET with C1.", primary: false }
    ]
  }
}
```

---

### PRE-EXHAUST SPECIALIZATION
```
PROGRAM_LIBRARY:
{
  id: "pre_exhaust",
  name: "Pre-Exhaust Method",
  category: "Golden Era",
  days: 4,
  weeks: 8,
  level: "Intermediate",
  bestFor: "Arthur Jones's technique — isolation first, then compound, so supporting muscles never limit the target",
  splitKey: "Pre Exhaust",
  equipment: ["full"],
  sessionMins: 55,
}

Key: PRE-EXHAUST SUPERSETS throughout. The formula:
  1. Isolation exercise targeting the PRIMARY muscle → take to near-failure
  2. Immediately (zero rest) → compound exercise using the same primary muscle
The primary muscle is already fatigued, so the compound movement is limited by the primary —
not the supporting muscles. This creates intense targeted fatigue.

Example: Leg extension (quads isolated to failure) → immediately leg press
         (quads limit the movement, not hip flexors or glutes)

Zero rest between the isolation and compound.
90 seconds rest after completing both.
Arthur Jones designed the Nautilus machines specifically for this method.
Ellington Darden systematized it into full programs. This is his approach.

PROGRAMS_BY_DAYS[4].splits["Pre Exhaust"]:
{
  description: "Arthur Jones observed that in compound exercises, the weakest supporting muscle limits the movement before the target muscle is fully fatigued. His solution: pre-exhaust the target with an isolation exercise, then immediately move into the compound. The target muscle is already fatigued — it becomes the limiting factor, not the helpers. Intense, efficient, and highly effective.",
  days: ["Chest + Back", "Legs", "Shoulders + Arms", "Full Body Pre-Exhaust"],
  alternating: false,
  workouts: {
    "Chest + Back": [
      { name: "Dumbbell Flye (A1 — PRE-EXHAUST)", sets: 3, reps: "10-12", notes: "PRE-EXHAUST: isolates pecs. Take to near-failure. IMMEDIATELY into A2 — zero rest.", primary: true },
      { name: "Barbell Bench Press (A2 — COMPOUND)", sets: 3, reps: "8-10", notes: "COMPOUND: immediately after flye. Pecs are pre-fatigued. Triceps will not limit the movement.", primary: true },
      { name: "Cable Fly (B1 — PRE-EXHAUST)", sets: 3, reps: "12-15", notes: "PRE-EXHAUST round 2. Different angle. Zero rest into B2.", primary: false },
      { name: "Incline Dumbbell Press (B2 — COMPOUND)", sets: 3, reps: "10-12", notes: "COMPOUND. Upper chest. Same principle.", primary: false },
      { name: "Straight Arm Pulldown (C1 — PRE-EXHAUST)", sets: 3, reps: "12-15", notes: "PRE-EXHAUST for lats. Arms straight — lats only.", primary: true },
      { name: "Barbell Row (C2 — COMPOUND)", sets: 3, reps: "8-10", notes: "COMPOUND. Lats pre-fatigued — biceps won't limit.", primary: true }
    ],
    "Legs": [
      { name: "Leg Extension (A1 — PRE-EXHAUST)", sets: 4, reps: "12-15", notes: "PRE-EXHAUST: quad isolation to near-failure. Zero rest into A2.", primary: true },
      { name: "Leg Press (A2 — COMPOUND)", sets: 4, reps: "10-12", notes: "COMPOUND. Quads are pre-exhausted. Hip flexors and glutes won't take over. Feel the quad working throughout.", primary: true },
      { name: "Leg Curl (B1 — PRE-EXHAUST)", sets: 3, reps: "12-15", notes: "PRE-EXHAUST for hamstrings.", primary: true },
      { name: "Romanian Deadlift (B2 — COMPOUND)", sets: 3, reps: "10-12", notes: "COMPOUND. Hamstrings pre-fatigued.", primary: true },
      { name: "Calf Raise", sets: 4, reps: "15-20", notes: "Calves — no pre-exhaust needed here.", primary: false }
    ],
    "Shoulders + Arms": [
      { name: "Lateral Raise (A1 — PRE-EXHAUST)", sets: 3, reps: "12-15", notes: "PRE-EXHAUST for medial deltoid. Zero rest into A2.", primary: true },
      { name: "Overhead Press (A2 — COMPOUND)", sets: 3, reps: "8-10", notes: "COMPOUND. Deltoids pre-fatigued — triceps won't dominate.", primary: true },
      { name: "Rear Delt Fly (B1 — PRE-EXHAUST)", sets: 3, reps: "15", notes: "PRE-EXHAUST for rear delts. Zero rest into B2.", primary: false },
      { name: "Upright Row (B2 — COMPOUND)", sets: 3, reps: "10-12", notes: "COMPOUND. Rear delts and traps.", primary: false },
      { name: "Concentration Curl (C1 — PRE-EXHAUST)", sets: 3, reps: "12", notes: "PRE-EXHAUST: bicep peak contraction.", primary: true },
      { name: "Barbell Curl (C2 — COMPOUND)", sets: 3, reps: "8-10", notes: "COMPOUND. Full bicep engagement.", primary: true },
      { name: "Overhead Tricep Extension (D1 — PRE-EXHAUST)", sets: 3, reps: "12", notes: "PRE-EXHAUST: long head tricep.", primary: false },
      { name: "Close Grip Bench Press (D2 — COMPOUND)", sets: 3, reps: "8-10", notes: "COMPOUND. Full tricep.", primary: false }
    ],
    "Full Body Pre-Exhaust": [
      { name: "Leg Extension (A1)", sets: 3, reps: "15", notes: "PRE-EXHAUST → A2 immediately.", primary: true },
      { name: "Squat (A2)", sets: 3, reps: "10", notes: "COMPOUND. Full body pre-exhaust day.", primary: true },
      { name: "Dumbbell Flye (B1)", sets: 3, reps: "12", notes: "PRE-EXHAUST → B2.", primary: true },
      { name: "Bench Press (B2)", sets: 3, reps: "10", notes: "COMPOUND.", primary: true },
      { name: "Straight Arm Pulldown (C1)", sets: 3, reps: "15", notes: "PRE-EXHAUST → C2.", primary: true },
      { name: "Pull Up (C2)", sets: 3, reps: "max", notes: "COMPOUND. Lats already fatigued.", primary: true },
      { name: "Lateral Raise (D1)", sets: 3, reps: "15", notes: "PRE-EXHAUST → D2.", primary: false },
      { name: "Overhead Press (D2)", sets: 3, reps: "10", notes: "COMPOUND. End with shoulders.", primary: false }
    ]
  }
}
```

---

## UPDATED GOLDEN ERA FILTER TAB
Golden Era programs (8 total):
1. Arnold Split (existing, moved here)
2. Tom Platz High Volume (from main spec)
3. Mike Mentzer Heavy Duty HIT (from main spec)
4. German Volume Training (this addendum)
5. Reg Park 5×5 (this addendum)
6. Serge Nubret Pump Protocol (this addendum)
7. Weider Superset System (this addendum)
8. Pre-Exhaust Specialization (this addendum)

These 8 programs represent every major training philosophy of the Golden Era — from minimum volume (Mentzer) to maximum volume (Nubret), from pure strength (Reg Park) to pure hypertrophy (Platz), from compound-only (5×5) to technique-focused (Pre-Exhaust). No other fitness app has this collection properly programmed.


---

## ADDENDUM 2 — EQUIPMENT TIER GAP FILL (4 programs)

### Coverage by equipment tier after this addendum:
- Full gym: 20+ programs ✓
- Home barbell: ~12 programs ✓
- Dumbbells only: 5 programs ✓ (was 3)
- Minimal/bodyweight: 4 programs ✓ (was 2)

---

### DUMBBELL PPL (for dumbbells + cables tier)
```
PROGRAM_LIBRARY:
{
  id: "dumbbell_ppl",
  name: "Dumbbell PPL",
  category: "Strength",
  days: 6,
  weeks: 8,
  level: "Intermediate",
  bestFor: "Full Push/Pull/Legs with just dumbbells — home gym, hotel gym, or no barbell available",
  splitKey: "Dumbbell PPL",
  equipment: ["full", "home_bar", "dumbbells"],
  sessionMins: 60,
}

PROGRAMS_BY_DAYS[6].splits["Dumbbell PPL"]:
{
  description: "Push/Pull/Legs repeated twice per week with dumbbells only. Every major muscle group trained twice. No barbell, no cables required — just a set of dumbbells and adjustable weight. The most popular home and travel training split.",
  days: ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"],
  alternating: false,
  workouts: {
    "Push A": [
      { name: "Dumbbell Bench Press",       sets: 4, reps: "8-10",  notes: "Flat bench or floor press. Full range.", primary: true },
      { name: "Incline Dumbbell Press",      sets: 3, reps: "10-12", notes: "Incline bench or propped up on a bag. Upper chest.", primary: true },
      { name: "Dumbbell Shoulder Press",     sets: 3, reps: "10-12", notes: "Seated or standing. Lock out at top.", primary: true },
      { name: "Dumbbell Lateral Raise",      sets: 3, reps: "15-20", notes: "Strict. Raise to shoulder height.", primary: false },
      { name: "Dumbbell Fly",               sets: 3, reps: "12-15", notes: "Full stretch at bottom.", primary: false },
      { name: "Overhead Tricep Extension",   sets: 3, reps: "12-15", notes: "One dumbbell, both hands.", primary: false },
      { name: "Tricep Kickback",             sets: 3, reps: "15",    notes: "Full extension. Control the return.", primary: false }
    ],
    "Pull A": [
      { name: "Dumbbell Row",               sets: 4, reps: "8-10",  notes: "Brace on bench or knee. Elbow high. Heavy.", primary: true },
      { name: "Dumbbell Pullover",           sets: 3, reps: "12-15", notes: "Flat on bench. Arms slightly bent. Lat stretch.", primary: true },
      { name: "Incline Dumbbell Curl",       sets: 3, reps: "10-12", notes: "Seated on incline bench. Long head bicep.", primary: false },
      { name: "Hammer Curl",                sets: 3, reps: "12",    notes: "Neutral grip. Brachialis development.", primary: false },
      { name: "Rear Delt Fly",              sets: 3, reps: "15-20", notes: "Bent over or face down on incline bench.", primary: false },
      { name: "Dumbbell Shrug",             sets: 3, reps: "15",    notes: "Straight up and down. No rolling.", primary: false }
    ],
    "Legs A": [
      { name: "Dumbbell Goblet Squat",       sets: 4, reps: "12-15", notes: "Hold one heavy dumbbell at chest. Heels flat.", primary: true },
      { name: "Dumbbell Romanian Deadlift",  sets: 4, reps: "10-12", notes: "Hip hinge. Feel the hamstring stretch.", primary: true },
      { name: "Dumbbell Lunge",             sets: 3, reps: "12 each", notes: "Alternating or walking. Full range.", primary: false },
      { name: "Dumbbell Step Up",           sets: 3, reps: "12 each", notes: "On a chair or step. Drive through heel.", primary: false },
      { name: "Dumbbell Calf Raise",        sets: 4, reps: "20",    notes: "Hold dumbbells. Full range.", primary: false },
      { name: "Glute Bridge",               sets: 3, reps: "20",    notes: "Dumbbell on hips. Squeeze at top.", primary: false }
    ],
    "Push B": [
      { name: "Dumbbell Bench Press",       sets: 4, reps: "10-12", notes: "Slightly lighter than A. More volume focus.", primary: true },
      { name: "Dumbbell Shoulder Press",     sets: 4, reps: "10-12", notes: "", primary: true },
      { name: "Incline Dumbbell Fly",       sets: 3, reps: "12-15", notes: "Upper chest stretch.", primary: false },
      { name: "Lateral Raise",              sets: 4, reps: "15-20", notes: "Drop set on last set.", primary: false },
      { name: "Close Grip Push Up",         sets: 3, reps: "max",   notes: "Tricep finisher. Chest to floor.", primary: false }
    ],
    "Pull B": [
      { name: "Dumbbell Row",               sets: 4, reps: "10-12", notes: "Volume day. Slightly lighter than A.", primary: true },
      { name: "Dumbbell Pullover",          sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Concentration Curl",         sets: 3, reps: "12",    notes: "Peak contraction.", primary: false },
      { name: "Dumbbell Curl",              sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Face Pull with Band",        sets: 3, reps: "20",    notes: "Or band pull-apart if no cables.", primary: false },
      { name: "Rear Delt Fly",              sets: 3, reps: "15",    notes: "", primary: false }
    ],
    "Legs B": [
      { name: "Bulgarian Split Squat",      sets: 4, reps: "10 each", notes: "Rear foot on chair. Dumbbell in each hand. The best single-leg exercise.", primary: true },
      { name: "Dumbbell Romanian Deadlift", sets: 4, reps: "12-15", notes: "Lighter than A. More hamstring stretch.", primary: true },
      { name: "Dumbbell Sumo Squat",        sets: 3, reps: "15",    notes: "Wide stance. Dumbbell between legs.", primary: false },
      { name: "Single Leg Calf Raise",      sets: 3, reps: "15 each", notes: "Body weight or holding one dumbbell.", primary: false },
      { name: "Lying Dumbbell Hamstring Curl", sets: 3, reps: "12", notes: "Lie face down. Hold dumbbell between feet.", primary: false }
    ]
  }
}
```

---

### DUMBBELL UPPER/LOWER (for dumbbells + cables tier)
```
PROGRAM_LIBRARY:
{
  id: "dumbbell_upper_lower",
  name: "Dumbbell Upper/Lower",
  category: "Strength",
  days: 4,
  weeks: 8,
  level: "Beginner",
  bestFor: "Optimal frequency with just dumbbells — each muscle trained twice per week",
  splitKey: "Dumbbell Upper Lower",
  equipment: ["full", "home_bar", "dumbbells"],
  sessionMins: 50,
}

PROGRAMS_BY_DAYS[4].splits["Dumbbell Upper Lower"]:
{
  description: "The frequency benefits of Upper/Lower training with nothing but dumbbells. Every muscle trained twice per week. Clean, simple, and effective for home gym, hotel gym, or travel.",
  days: ["Upper A", "Lower A", "Upper B", "Lower B"],
  alternating: false,
  workouts: {
    "Upper A": [
      { name: "Dumbbell Bench Press",       sets: 4, reps: "6-8",   notes: "Strength focus. Heavy as possible with good form.", primary: true },
      { name: "Dumbbell Row",               sets: 4, reps: "6-8",   notes: "Match pressing volume. Elbow high.", primary: true },
      { name: "Dumbbell Shoulder Press",    sets: 3, reps: "8-10",  notes: "Seated for stability.", primary: false },
      { name: "Dumbbell Pullover",          sets: 3, reps: "10-12", notes: "Lat stretch and strength.", primary: false },
      { name: "Lateral Raise",              sets: 3, reps: "15",    notes: "Strict. No swinging.", primary: false },
      { name: "Face Pull or Band Pull-Apart", sets: 3, reps: "20",  notes: "Rear delt and shoulder health. Never skip.", primary: false }
    ],
    "Lower A": [
      { name: "Dumbbell Goblet Squat",      sets: 4, reps: "8-10",  notes: "Heavy goblet squat. Hold at chest.", primary: true },
      { name: "Dumbbell Romanian Deadlift", sets: 4, reps: "8-10",  notes: "Hip hinge. Hamstrings loaded.", primary: true },
      { name: "Bulgarian Split Squat",      sets: 3, reps: "8 each", notes: "Dumbbells in both hands. Rear foot elevated.", primary: false },
      { name: "Lying Dumbbell Hamstring Curl", sets: 3, reps: "12", notes: "Dumbbell between feet.", primary: false },
      { name: "Dumbbell Calf Raise",        sets: 4, reps: "15-20", notes: "Full range.", primary: false }
    ],
    "Upper B": [
      { name: "Incline Dumbbell Press",     sets: 4, reps: "10-12", notes: "Volume day. Upper chest focus.", primary: true },
      { name: "Dumbbell Row",               sets: 4, reps: "10-12", notes: "Lighter than A day. More reps.", primary: true },
      { name: "Dumbbell Fly",               sets: 3, reps: "12-15", notes: "Chest stretch. Full range.", primary: false },
      { name: "Dumbbell Curl",              sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Tricep Overhead Extension",  sets: 3, reps: "12-15", notes: "", primary: false },
      { name: "Rear Delt Fly",              sets: 3, reps: "15-20", notes: "", primary: false }
    ],
    "Lower B": [
      { name: "Dumbbell Lunge",             sets: 4, reps: "12 each", notes: "Alternating. Control the descent.", primary: true },
      { name: "Dumbbell Sumo Deadlift",     sets: 4, reps: "10-12", notes: "Wide stance. Dumbbell between legs.", primary: true },
      { name: "Dumbbell Step Up",           sets: 3, reps: "12 each", notes: "Drive through heel.", primary: false },
      { name: "Glute Bridge",               sets: 3, reps: "20",    notes: "Dumbbell on hips. Pause at top.", primary: false },
      { name: "Single Leg Calf Raise",      sets: 3, reps: "15 each", notes: "", primary: false }
    ]
  }
}
```

---

### BODYWEIGHT FOUNDATION (for minimal/no equipment)
```
PROGRAM_LIBRARY:
{
  id: "bodyweight_foundation",
  name: "Bodyweight Foundation",
  category: "Strength",
  days: 3,
  weeks: 8,
  level: "Beginner",
  bestFor: "Zero equipment needed — build real strength with nothing but your bodyweight",
  splitKey: "Bodyweight Foundation",
  equipment: ["full", "home_bar", "dumbbells", "minimal"],
  sessionMins: 40,
}

Note: Truly zero equipment required. A yoga mat recommended but not necessary.
Progress by moving to harder variations when you can complete 3 sets of 20 reps with good form.
Progression chart built into notes for each exercise.

PROGRAMS_BY_DAYS[3].splits["Bodyweight Foundation"]:
{
  description: "No equipment. No excuses. Your bodyweight is enough to build real functional strength when you use it intelligently. This program uses progressive overload the same way a barbell program does — just by changing the leverage and difficulty of the movement, not the weight.",
  days: ["Full Body A", "Full Body B", "Full Body C"],
  alternating: false,
  workouts: {
    "Full Body A": [
      { name: "Push Up", sets: 4, reps: "10-20", notes: "Progression: Knee push up → Standard → Wide grip → Close grip → Pike push up. Move up when you hit 3×20.", primary: true },
      { name: "Air Squat", sets: 4, reps: "15-20", notes: "Progression: Assisted squat → Air squat → Jump squat → Single leg squat (pistol). Full depth.", primary: true },
      { name: "Glute Bridge", sets: 3, reps: "20", notes: "Progression: Bilateral → Single leg → Elevated single leg. Squeeze hard at top.", primary: true },
      { name: "Plank", sets: 3, reps: "30-60 sec", notes: "Progression: Knee plank → Standard → Extended → Single arm.", primary: false },
      { name: "Inverted Row (under a table)", sets: 3, reps: "max", notes: "Lie under table, grab edge, pull chest to table. Best bodyweight pull — use if possible. If no table: band pull-apart or skip.", primary: false }
    ],
    "Full Body B": [
      { name: "Pike Push Up", sets: 3, reps: "8-15", notes: "Hands and feet on floor, hips high. Leads to handstand push up.", primary: true },
      { name: "Reverse Lunge", sets: 3, reps: "12 each", notes: "Step back, lower knee to floor. Progression: bodyweight → single leg step up.", primary: true },
      { name: "Hip Hinge (Good Morning)", sets: 3, reps: "15", notes: "Hands behind head, hinge at hip, keep back flat. Teaches the hinge pattern without weight.", primary: true },
      { name: "Dead Bug", sets: 3, reps: "10 each side", notes: "Lower back flat on floor. Extend opposite arm and leg. Core control.", primary: false },
      { name: "Superman Hold", sets: 3, reps: "10", notes: "Face down, lift arms and legs simultaneously. Lower back strength.", primary: false }
    ],
    "Full Body C": [
      { name: "Diamond Push Up", sets: 3, reps: "8-15", notes: "Hands form a diamond. Tricep and inner chest.", primary: true },
      { name: "Jump Squat", sets: 4, reps: "10", notes: "Explosive. Land softly. Power development.", primary: true },
      { name: "Single Leg Glute Bridge", sets: 3, reps: "15 each", notes: "One leg extended. Posterior chain.", primary: true },
      { name: "Mountain Climber", sets: 3, reps: "30 sec", notes: "Fast legs. Keep hips low.", primary: false },
      { name: "Hollow Body Hold", sets: 3, reps: "20-30 sec", notes: "The foundation of gymnastics. Low back pressed to floor, arms and legs extended low. Harder than it looks.", primary: false }
    ]
  }
}
```

---

### CALISTHENICS PROGRESSION (for minimal — pull-up bar assumed)
```
PROGRAM_LIBRARY:
{
  id: "calisthenics_progression",
  name: "Calisthenics Progression",
  category: "Strength",
  days: 4,
  weeks: 12,
  level: "Intermediate",
  bestFor: "Build elite bodyweight strength — pull-up bar required (doorframe pull-up bar = $30)",
  splitKey: "Calisthenics",
  equipment: ["full", "home_bar", "dumbbells", "minimal"],
  sessionMins: 50,
}

Note: Requires a pull-up bar. A doorframe pull-up bar qualifies as "minimal equipment."
This program uses skill progressions — you're working toward harder movement variations,
not just adding reps. Progress is made by unlocking the next variation.

PROGRAMS_BY_DAYS[4].splits["Calisthenics"]:
{
  description: "Elite calisthenics athletes are stronger than most gym-goers — they just build it differently. This program uses movement progressions: each exercise has an easier and harder variation. You master the current level before moving to the next. By the end of 12 weeks you'll have real pull-up and push-up strength most people never develop.",
  days: ["Push Focus", "Pull Focus", "Legs + Core", "Full Skill Day"],
  alternating: false,
  workouts: {
    "Push Focus": [
      { name: "Push Up Progression", sets: 5, reps: "8-15", notes: "Current level: Standard push up. Next: Close grip. Then: Archer push up (one arm extended). Then: One arm push up. Move up when 3×15 easy.", primary: true },
      { name: "Pike Push Up / Handstand Push Up", sets: 4, reps: "6-12", notes: "Pike: hips high, lower head between hands. Progress to wall handstand push up.", primary: true },
      { name: "Dip (parallel bars or chair)", sets: 4, reps: "8-15", notes: "Full depth — upper arm parallel to floor. Lean forward for chest, upright for triceps.", primary: true },
      { name: "Tricep Push Up", sets: 3, reps: "max", notes: "Elbows back, close to body. Finisher.", primary: false }
    ],
    "Pull Focus": [
      { name: "Pull Up Progression", sets: 5, reps: "max", notes: "Levels: Band-assisted → Jumping pull up with slow lower → Full pull up → Chin over bar → Chest to bar → Weighted. Current: Full pull up. Track reps each set.", primary: true },
      { name: "Inverted Row", sets: 4, reps: "10-15", notes: "Under bar or table. Supinate grip for bicep focus. More horizontal = easier.", primary: true },
      { name: "Face Pull or Band Pull-Apart", sets: 3, reps: "20", notes: "Shoulder health and rear delt.", primary: false },
      { name: "Bicep Curl with Resistance Band", sets: 3, reps: "15", notes: "Or towel curl hanging from door handle.", primary: false }
    ],
    "Legs + Core": [
      { name: "Pistol Squat Progression", sets: 4, reps: "5-10 each", notes: "Levels: Assisted pistol (hold door) → Box pistol (to chair) → Full pistol. The hardest bodyweight leg movement.", primary: true },
      { name: "Nordic Hamstring Curl", sets: 3, reps: "3-8", notes: "Hook feet under sofa or heavy object. Lower slowly. One of the best hamstring exercises in existence.", primary: true },
      { name: "Hanging Leg Raise", sets: 3, reps: "10-15", notes: "From pull-up bar. Tuck first, then straight leg.", primary: false },
      { name: "Hollow Body Rock", sets: 3, reps: "10-15", notes: "Rock forward and back. Core stability.", primary: false },
      { name: "Wall Sit", sets: 3, reps: "45-60 sec", notes: "Quad endurance. 90-degree knee angle.", primary: false }
    ],
    "Full Skill Day": [
      { name: "Handstand Practice", sets: 5, reps: "20-30 sec hold", notes: "Wall-supported. Goal is 30 sec freestanding eventually. This takes months — enjoy the process.", primary: true },
      { name: "L-Sit Progression", sets: 4, reps: "10-20 sec", notes: "Tuck → One leg extended → Full L-sit. On floor, parallettes, or bars.", primary: true },
      { name: "Muscle Up Progression (if pull-up bar)", sets: 3, reps: "3-5", notes: "From pull-up bar. Levels: jumping muscle up → negative → full muscle up. Only attempt when pull-ups are strong.", primary: false },
      { name: "Full Body Flow", sets: 2, reps: "5 min", notes: "Continuous movement: push up → tuck jump → pull up → pistol × 2 → handstand → repeat. Your own flow.", primary: false }
    ]
  }
}
```

---

## UPDATED EQUIPMENT TIER COVERAGE
Full gym:         23+ programs ✓
Home barbell:     ~15 programs ✓
Dumbbells only:   Dumbbell PPL + Dumbbell Upper/Lower + Metabolic Resistance
                  + HIIT Strength + MetCon Foundations = 5 programs ✓
Minimal/BW:       Bodyweight Foundation + Calisthenics + MetCon Foundations
                  + HIIT Strength (partial) = 4 programs ✓

No equipment tier left uncovered.


## ADDENDUM 3 — SCULPT CATEGORY + GLUTE FOCUS EXPANSION (5 programs)

### New category: "Sculpt"
Add to FILTER_TABS after "Strength":
["All", "Strength", "Sculpt", "Golden Era", "Running", "Hyrox", "Hybrid", "MetCon", "Glute", "Fat Loss", "Sport"]

trainType default tab mapping: no specific trainType maps to Sculpt — users browse it manually.

---

### 1. FULL BODY SCULPT (beginner, 3 days)
```
PROGRAM_LIBRARY:
{
  id: "full_body_sculpt",
  name: "Full Body Sculpt",
  category: "Sculpt",
  days: 3,
  weeks: 8,
  level: "Beginner",
  bestFor: "Build a lean, sculpted physique — full body training with glute and core emphasis",
  splitKey: "Full Body Sculpt",
  equipment: ["full", "home_bar", "dumbbells"],
  sessionMins: 50,
}

PROGRAMS_BY_DAYS[3].splits["Full Body Sculpt"]:
{
  description: "Three full body sessions per week with higher rep ranges and moderate weight. Every session hits glutes, core, and a push/pull balance. The goal is a sculpted, athletic physique — not bulk, not pure cardio. Supersets keep the pace up and maximize time efficiency.",
  days: ["Session A — Push + Glutes", "Session B — Pull + Hamstrings", "Session C — Shoulders + Full Body"],
  alternating: false,
  workouts: {
    "Session A — Push + Glutes": [
      { name: "Hip Thrust",                 sets: 4, reps: "12-15", notes: "Barbell or dumbbell on hips. Drive through heels. Squeeze glutes hard at top for 1 second. The most effective glute exercise.", primary: true },
      { name: "Dumbbell Bench Press (A1)",   sets: 3, reps: "12-15", notes: "SUPERSET with A2. Moderate weight, controlled descent.", primary: true },
      { name: "Dumbbell Row (A2)",           sets: 3, reps: "12-15", notes: "SUPERSET with A1. Elbow high.", primary: true },
      { name: "Bulgarian Split Squat (B1)",  sets: 3, reps: "12 each", notes: "SUPERSET with B2. Rear foot elevated. Glute and quad.", primary: false },
      { name: "Lateral Raise (B2)",          sets: 3, reps: "15-20", notes: "SUPERSET with B1. Strict — no swinging.", primary: false },
      { name: "Plank",                       sets: 3, reps: "30-45 sec", notes: "Core finisher.", primary: false }
    ],
    "Session B — Pull + Hamstrings": [
      { name: "Romanian Deadlift",          sets: 4, reps: "12-15", notes: "Hip hinge — feel the hamstring stretch. Slow descent (3 sec down).", primary: true },
      { name: "Lat Pulldown (A1)",           sets: 3, reps: "12-15", notes: "SUPERSET with A2. Pull to upper chest.", primary: false },
      { name: "Goblet Squat (A2)",           sets: 3, reps: "15",    notes: "SUPERSET with A1. Hold dumbbell at chest. Full depth.", primary: false },
      { name: "Lying Leg Curl (B1)",         sets: 3, reps: "12-15", notes: "SUPERSET with B2. Hamstring isolation.", primary: false },
      { name: "Cable Hip Kickback (B2)",     sets: 3, reps: "15 each", notes: "SUPERSET with B1. Squeeze glute at peak extension.", primary: false },
      { name: "Dead Bug",                    sets: 3, reps: "10 each side", notes: "Core. Lower back flat on floor. Control.", primary: false }
    ],
    "Session C — Shoulders + Full Body": [
      { name: "Overhead Press",             sets: 3, reps: "12-15", notes: "Seated or standing. Build those shoulders.", primary: true },
      { name: "Hip Abduction Machine (A1)", sets: 3, reps: "20",    notes: "SUPERSET with A2. The outer glute.", primary: false },
      { name: "Dumbbell Lateral Raise (A2)",sets: 3, reps: "15-20", notes: "SUPERSET with A1.", primary: false },
      { name: "Reverse Lunge (B1)",         sets: 3, reps: "12 each", notes: "SUPERSET with B2. Step back. Controlled.", primary: false },
      { name: "Face Pull (B2)",             sets: 3, reps: "20",    notes: "SUPERSET with B1. Rear delts. Every session.", primary: false },
      { name: "Cable Crunch",               sets: 3, reps: "15-20", notes: "Core. Pull elbow to knees.", primary: false },
      { name: "Glute Bridge",               sets: 3, reps: "20",    notes: "Finisher. Bodyweight or dumbbell. Squeeze.", primary: false }
    ]
  }
}
```

---

### 2. PILATES-INSPIRED STRENGTH (intermediate, 4 days)
```
PROGRAM_LIBRARY:
{
  id: "pilates_strength",
  name: "Pilates Strength",
  category: "Sculpt",
  days: 4,
  weeks: 8,
  level: "Intermediate",
  bestFor: "Pilates precision meets resistance training — the trending Pilates + Weights combination",
  splitKey: "Pilates Strength",
  equipment: ["full", "dumbbells"],
  sessionMins: 55,
}

KEY PRINCIPLES FOR ALL EXERCISES IN THIS PROGRAM:
- Tempo: 3 seconds lowering, 1 second pause at stretch, 3 seconds lifting
- Isometric pause: hold 1-2 seconds at peak contraction
- Never use momentum. Every rep is deliberate and controlled.
- Mind-muscle connection over weight. Feel the target muscle working.
- Rep ranges are higher than traditional strength programs — that is intentional.
- Core is engaged throughout every exercise — this is the Pilates foundation.

PROGRAMS_BY_DAYS[4].splits["Pilates Strength"]:
{
  description: "Pilates + Weights is the fastest-growing fitness modality among women. Pilates precision — slow tempo, end-range contractions, constant core engagement — applied to resistance training. The result is a deep, targeted burn that traditional lifting misses. No reformer needed. Just dumbbells, cables, and intention.",
  days: ["Upper Body", "Lower Body", "Core + Stretch", "Full Body Flow"],
  alternating: false,
  workouts: {
    "Upper Body": [
      { name: "Dumbbell Press (Slow)",       sets: 3, reps: "15",    notes: "3-1-3 tempo. Pause at chest, pause at lockout. No rushing.", primary: true },
      { name: "Single Arm Cable Row (Hold)", sets: 3, reps: "15 each", notes: "Pull and HOLD 2 seconds at full contraction. Feel the shoulder blade squeeze.", primary: true },
      { name: "Lateral Raise (Pause)",       sets: 3, reps: "15-20", notes: "Raise slowly (3 sec). Hold at shoulder height for 2 seconds. Lower slowly (3 sec).", primary: false },
      { name: "Incline Dumbbell Fly (Stretch)", sets: 3, reps: "15", notes: "Deep stretch at bottom — pause and FEEL the pec. Slow return.", primary: false },
      { name: "Tricep Overhead Extension",   sets: 3, reps: "15-20", notes: "Full stretch at bottom. Hold at peak contraction.", primary: false },
      { name: "Dumbbell Curl (End Range)",   sets: 3, reps: "15",    notes: "Focus on the top 30 degrees of the movement — the hardest part. Squeeze hard.", primary: false },
      { name: "Pilates Hundred (Modified)", sets: 1, reps: "100 arm pumps", notes: "Lie on back, knees bent or legs extended, arms pumping. Inhale 5 counts, exhale 5. Classic Pilates core activation.", primary: false }
    ],
    "Lower Body": [
      { name: "Hip Thrust (Slow)",           sets: 4, reps: "15",    notes: "3-1-3 tempo. HOLD at the top for 2 full seconds. Feel the glute squeeze.", primary: true },
      { name: "Single Leg RDL",              sets: 3, reps: "12 each", notes: "Slow. Balance and hamstring. End-range stretch at bottom.", primary: true },
      { name: "Clamshell with Band",         sets: 3, reps: "20 each", notes: "Resistance band above knees. Slow rotation. Glute medius (the outer glute shape).", primary: false },
      { name: "Sumo Squat with Pulse",       sets: 3, reps: "15 + 15 pulses", notes: "Wide stance. Full sumo squat, then hold halfway down and pulse 15 times.", primary: false },
      { name: "Donkey Kick (Hold)",          sets: 3, reps: "15 each", notes: "On all fours. Kick up and HOLD for 3 seconds at top. Cable or bodyweight.", primary: false },
      { name: "Side Lying Hip Abduction",    sets: 3, reps: "20 each", notes: "Lie on side. Raise top leg slowly. Hold at top. Lower slowly. Outer glute.", primary: false },
      { name: "Single Leg Glute Bridge",     sets: 3, reps: "15 each", notes: "Finisher. Squeeze and hold.", primary: false }
    ],
    "Core + Stretch": [
      { name: "Dead Bug",                    sets: 3, reps: "10 each", notes: "The Pilates foundation. Lower back flat. Control.", primary: true },
      { name: "Pallof Press",                sets: 3, reps: "12 each", notes: "Anti-rotation core work. Cable at chest height. Press out and hold 2 sec.", primary: true },
      { name: "Bird Dog",                    sets: 3, reps: "10 each", notes: "Opposite arm and leg. Hold 3 seconds at extension.", primary: false },
      { name: "Side Plank",                  sets: 3, reps: "30-45 sec each", notes: "Obliques. Hip high. Body in a straight line.", primary: false },
      { name: "World's Greatest Stretch",    sets: 2, reps: "5 each side", notes: "The most valuable mobility exercise. Hip flexor + thoracic rotation.", primary: false },
      { name: "Pigeon Pose Hold",            sets: 2, reps: "60 sec each", notes: "Deep glute stretch. Essential for hip health.", primary: false }
    ],
    "Full Body Flow": [
      { name: "Goblet Squat to Press",       sets: 3, reps: "12",    notes: "Squat, stand, press overhead in one fluid movement.", primary: true },
      { name: "Dumbbell Romanian Deadlift to Row", sets: 3, reps: "12", notes: "Hinge, add a row at the bottom, return. Two movements in one.", primary: true },
      { name: "Lateral Lunge to Curtsy",     sets: 3, reps: "10 each", notes: "Side lunge, return, curtsy lunge. Inner thigh and glute medius.", primary: false },
      { name: "Dumbbell Halos",              sets: 3, reps: "10 each direction", notes: "Circle dumbbell around head. Shoulder stability and mobility.", primary: false },
      { name: "Hip 90/90 Flow",              sets: 2, reps: "8 each side", notes: "Sit in 90/90 hip position, rotate between sides. Hip mobility.", primary: false }
    ]
  }
}
```

---

### 3. HOURGLASS BUILD (intermediate, 4 days)
```
PROGRAM_LIBRARY:
{
  id: "hourglass",
  name: "Hourglass Build",
  category: "Sculpt",
  days: 4,
  weeks: 10,
  level: "Intermediate",
  bestFor: "Build curves — glutes and hips for width below, shoulders for width above",
  splitKey: "Hourglass Build",
  equipment: ["full", "dumbbells"],
  sessionMins: 60,
}

THE X-FRAME FORMULA:
- Wider hips: glute medius (outer glute), hip abductors, glute maximus volume
- Broader shoulders: lateral deltoid (side delt) is the key — it creates the visual width
- Tight waist: core work that builds stability without adding width (no heavy oblique work)
- Higher glutes: glute/hamstring tie-in work for the coveted "shelf" appearance

PROGRAMS_BY_DAYS[4].splits["Hourglass Build"]:
{
  description: "The hourglass physique is built mathematically: wider at the shoulders, wider at the hips, narrow in the middle. Every session in this program is designed with that formula. Glute days emphasize the outer glute and the high glute for shape. Shoulder days emphasize the lateral deltoid for width. Core work is anti-rotation and stability — no heavy oblique work that adds waist width.",
  days: ["Glute & Hip Focus", "Shoulders + Arms", "Hamstring & Glute Tie-In", "Upper Sculpt"],
  alternating: false,
  workouts: {
    "Glute & Hip Focus": [
      { name: "Hip Thrust",                 sets: 4, reps: "10-12", notes: "Barbell or dumbbell. The foundation. Drive through heels. Squeeze at top.", primary: true },
      { name: "Cable Hip Abduction",        sets: 4, reps: "15-20 each", notes: "Cable at ankle, sweep leg out. Outer glute — creates the hip width.", primary: true },
      { name: "Bulgarian Split Squat",      sets: 3, reps: "10-12 each", notes: "Rear foot elevated. Leans forward slightly for more glute activation.", primary: true },
      { name: "Lateral Band Walk",          sets: 3, reps: "20 each direction", notes: "Band above knees. Constant tension. Glute medius.", primary: false },
      { name: "Frog Pump",                  sets: 3, reps: "20-30", notes: "Lie on back, soles of feet together (butterfly position), pump hips up. Intense glute contraction.", primary: false },
      { name: "Pallof Press",               sets: 3, reps: "12 each", notes: "Anti-rotation core. No added waist width.", primary: false }
    ],
    "Shoulders + Arms": [
      { name: "Dumbbell Lateral Raise",     sets: 5, reps: "15-20", notes: "THE most important hourglass exercise. Lateral deltoid = shoulder width. Strict form — no swinging. 5 sets because this muscle responds to high volume.", primary: true },
      { name: "Overhead Press",             sets: 4, reps: "10-12", notes: "Seated or standing. Full shoulder development.", primary: true },
      { name: "Cable Lateral Raise",        sets: 3, reps: "15-20 each", notes: "Single cable, each arm. Constant tension through full range.", primary: false },
      { name: "Rear Delt Fly",              sets: 3, reps: "15-20", notes: "Posterior deltoid for 3D shoulder roundness.", primary: false },
      { name: "Dumbbell Curl",              sets: 3, reps: "12-15", notes: "Arms for balance.", primary: false },
      { name: "Tricep Pushdown",            sets: 3, reps: "15",    notes: "Lean arms finish the hourglass look.", primary: false },
      { name: "Cable Crunch",               sets: 3, reps: "15-20", notes: "Core. Not oblique — straight crunch only.", primary: false }
    ],
    "Hamstring & Glute Tie-In": [
      { name: "Romanian Deadlift",          sets: 4, reps: "10-12", notes: "The glute-hamstring tie-in creates the 'shelf' at the base of the glute. Slow descent. Feel the stretch.", primary: true },
      { name: "Lying Leg Curl",             sets: 4, reps: "12-15", notes: "Hamstring isolation. The upper hamstring creates the rounded under-glute shape.", primary: true },
      { name: "Hip Thrust (close feet)",    sets: 3, reps: "15",    notes: "Feet closer together shifts more load to glutes vs quads. Different stimulus.", primary: true },
      { name: "Nordic Hamstring Curl",      sets: 3, reps: "5-8",   notes: "Advanced. Best hamstring development exercise. Slow lowering is the key.", primary: false },
      { name: "Hip Abduction Machine",      sets: 3, reps: "20",    notes: "Outer glute again — this is hit twice per week for shape.", primary: false },
      { name: "Dead Bug",                   sets: 3, reps: "10 each", notes: "Core stability. No width added.", primary: false }
    ],
    "Upper Sculpt": [
      { name: "Incline Dumbbell Press",     sets: 3, reps: "12-15", notes: "Upper chest lifts the bust line visually. Part of the hourglass formula.", primary: true },
      { name: "Cable Row",                  sets: 3, reps: "12-15", notes: "Back development for posture. Shoulders back = better posture = better silhouette.", primary: true },
      { name: "Arnold Press",               sets: 3, reps: "12",    notes: "Hits all three deltoid heads. More shoulder volume.", primary: false },
      { name: "Cable Lateral Raise",        sets: 3, reps: "15-20 each", notes: "Lateral deltoid again — it gets worked every session in this program.", primary: false },
      { name: "Face Pull",                  sets: 3, reps: "20",    notes: "Rear delt and rotator cuff. Posture is everything.", primary: false },
      { name: "Plank",                      sets: 3, reps: "45 sec", notes: "Core. Straight line.", primary: false }
    ]
  }
}
```

---

### 4. PROGRESSIVE GLUTE BUILDER (beginner, 3 days)
ADD TO EXISTING "Glute Focus" category (not Sculpt)
```
PROGRAM_LIBRARY:
{
  id: "glute_builder",
  name: "Progressive Glute Builder",
  category: "Glute Focus",
  days: 3,
  weeks: 12,
  level: "Beginner",
  bestFor: "Build your glutes from scratch — progressive hip thrust program from bodyweight to barbell",
  splitKey: "Progressive Glute Builder",
  equipment: ["full", "home_bar", "dumbbells"],
  sessionMins: 50,
}

NOTE: The hip thrust progression over 12 weeks:
Weeks 1-2: Bodyweight hip thrust (learn the movement)
Weeks 3-4: Dumbbell hip thrust (add load)
Weeks 5-8: Barbell hip thrust (add weight each session)
Weeks 9-12: Heavy barbell hip thrust + bands (peak loading)

PROGRAMS_BY_DAYS[3].splits["Progressive Glute Builder"]:
{
  description: "The hip thrust is scientifically the most effective glute exercise — research by Bret Contreras shows it produces the highest glute muscle activation of any movement. This program makes the hip thrust the centerpiece and builds everything else around it. Start with bodyweight and progress to a loaded barbell over 12 weeks.",
  days: ["Session A — Hip Thrust Focus", "Session B — Split Squat Focus", "Session C — Deadlift Focus"],
  alternating: false,
  workouts: {
    "Session A — Hip Thrust Focus": [
      { name: "Hip Thrust",                 sets: 4, reps: "12-15", notes: "PROGRESSION: Weeks 1-2 bodyweight, Weeks 3-4 dumbbell on hips, Weeks 5-8 barbell, Weeks 9-12 barbell + resistance band above knees. Squeeze at top. Drive through heels not toes.", primary: true },
      { name: "Clamshell with Band",        sets: 3, reps: "20 each", notes: "Outer glute (glute medius). Lie on side, band above knees.", primary: false },
      { name: "Romanian Deadlift",          sets: 3, reps: "12",    notes: "Hamstring and glute. Hip hinge — not a squat.", primary: false },
      { name: "Cable Hip Kickback",         sets: 3, reps: "15 each", notes: "Cable at ankle. Kick back and up. Squeeze glute fully.", primary: false },
      { name: "Glute Bridge March",         sets: 3, reps: "10 each", notes: "Hold bridge position, alternate raising knees. Stability and core.", primary: false }
    ],
    "Session B — Split Squat Focus": [
      { name: "Bulgarian Split Squat",      sets: 4, reps: "10-12 each", notes: "Rear foot on bench. Drive through front heel. The best single-leg glute exercise. Dumbbell in each hand when ready.", primary: true },
      { name: "Lateral Band Walk",          sets: 3, reps: "20 each direction", notes: "Band above knees. Constant tension. Outer glute.", primary: false },
      { name: "Single Leg Glute Bridge",    sets: 3, reps: "15 each", notes: "One leg extended. Full hip extension. Squeeze.", primary: false },
      { name: "Sumo Squat (Wide)",          sets: 3, reps: "15",    notes: "Wide stance, toes out. Inner thigh + glute.", primary: false },
      { name: "Donkey Kick",                sets: 3, reps: "15 each", notes: "On all fours. Kick up. Squeeze at top.", primary: false }
    ],
    "Session C — Deadlift Focus": [
      { name: "Dumbbell Romanian Deadlift", sets: 4, reps: "12",    notes: "Hip hinge. Lower the weight along your legs. Feel the hamstring stretch. Return by squeezing glutes and driving hips forward.", primary: true },
      { name: "Hip Thrust (top half only)", sets: 3, reps: "20",    notes: "Partial rep — only the top 50% of the movement. Maximum glute tension. Keep constant tension, never lower all the way.", primary: false },
      { name: "Step Up",                    sets: 3, reps: "12 each", notes: "Drive through heel. Focus on glute activation not quad.", primary: false },
      { name: "Reverse Lunge",              sets: 3, reps: "12 each", notes: "Step back. Control. Front glute does the work on return.", primary: false },
      { name: "Hip Abduction Machine",      sets: 3, reps: "20",    notes: "Outer glute. Every session.", primary: false }
    ]
  }
}
```

---

### 5. GLUTE & HAMSTRING FOCUS (intermediate, 4 days)
ADD TO EXISTING "Glute Focus" category
```
PROGRAM_LIBRARY:
{
  id: "glute_hamstring",
  name: "Glute & Hamstring Focus",
  category: "Glute Focus",
  days: 4,
  weeks: 10,
  level: "Intermediate",
  bestFor: "Build the posterior chain — glutes, hamstrings, and the glute-hamstring tie-in for a sculpted backside",
  splitKey: "Glute Hamstring Focus",
  equipment: ["full", "home_bar"],
  sessionMins: 65,
}

PROGRAMS_BY_DAYS[4].splits["Glute Hamstring Focus"]:
{
  description: "The posterior chain — glutes and hamstrings together — creates the silhouette most athletes want. The glute-hamstring tie-in (where the two muscles meet at the crease) is built through Romanian deadlifts and leg curls. Hip thrusts load the glutes at peak contraction. This program hits the posterior chain from every angle, four days per week.",
  days: ["Hip Dominant (Thrust Focus)", "Knee Dominant (Split Squat Focus)", "Hinge Heavy (Deadlift Focus)", "Detail Day (Isolation)"],
  alternating: false,
  workouts: {
    "Hip Dominant (Thrust Focus)": [
      { name: "Barbell Hip Thrust",         sets: 5, reps: "8-12",  notes: "Primary glute exercise. Heavy. Add weight each session you complete all reps.", primary: true },
      { name: "Cable Hip Abduction",        sets: 3, reps: "20 each", notes: "Outer glute. Cable at low anchor, sweep leg out.", primary: false },
      { name: "Frog Pump",                  sets: 3, reps: "25-30", notes: "Feet together (butterfly), pump hips. High-activation pump set.", primary: false },
      { name: "Band Hip Thrust",            sets: 2, reps: "20",    notes: "Band above knees adds abduction. More outer glute.", primary: false },
      { name: "Plank",                      sets: 3, reps: "45 sec", notes: "Core stability.", primary: false }
    ],
    "Knee Dominant (Split Squat Focus)": [
      { name: "Bulgarian Split Squat",      sets: 4, reps: "8-10 each", notes: "Barbell or dumbbells. Heavier than beginner. Lean forward 15-20 degrees for more glute.", primary: true },
      { name: "Walking Lunge",              sets: 3, reps: "12-15 each", notes: "Dumbbell or barbell. Long stride = more glute.", primary: false },
      { name: "Leg Press (high foot)",      sets: 3, reps: "12-15", notes: "Feet high and wide on the platform = glute dominant.", primary: false },
      { name: "Lying Leg Curl",             sets: 3, reps: "12-15", notes: "Hamstring work on knee-dominant day for balance.", primary: false },
      { name: "Single Leg Hip Thrust",      sets: 3, reps: "12 each", notes: "Increased range and glute activation vs bilateral.", primary: false }
    ],
    "Hinge Heavy (Deadlift Focus)": [
      { name: "Romanian Deadlift",          sets: 5, reps: "8-10",  notes: "Heavy. Full hamstring stretch at bottom. Drive hips forward at top. This builds the glute-hamstring tie-in.", primary: true },
      { name: "Good Morning",               sets: 3, reps: "10-12", notes: "Lower back and hamstring. Hinge at hip, slight knee bend, flat back.", primary: true },
      { name: "Nordic Hamstring Curl",      sets: 3, reps: "5-8",   notes: "THE hamstring development exercise. Slow lowering (5 sec). Use a partner or anchor feet.", primary: true },
      { name: "Hip Thrust",                 sets: 3, reps: "15",    notes: "Lighter on this day — volume maintenance.", primary: false },
      { name: "Back Extension",             sets: 3, reps: "15",    notes: "Hold at top. Glute squeeze. Lower back.", primary: false }
    ],
    "Detail Day (Isolation)": [
      { name: "Cable Kickback",             sets: 4, reps: "15-20 each", notes: "Slow and controlled. Full extension at top. This is isolation — feel the glute, don't just move weight.", primary: true },
      { name: "Clamshell with Band",        sets: 3, reps: "20 each", notes: "Glute medius detail — outer hip shape.", primary: false },
      { name: "Seated Hip Abduction",       sets: 3, reps: "20",    notes: "Machine. Full range. Outer glute.", primary: false },
      { name: "Single Leg RDL",             sets: 3, reps: "12 each", notes: "Balance + hamstring + glute tie-in.", primary: false },
      { name: "Glute Squeeze Isometric",    sets: 3, reps: "10×5 sec holds", notes: "Stand or lie face down. Squeeze one glute maximally for 5 seconds. 10 reps each side. Sounds simple. It is not.", primary: false }
    ]
  }
}
```

---

## UPDATED FILTER TABS
["All", "Strength", "Sculpt", "Golden Era", "Running", "Hyrox", "Hybrid", "MetCon", "Glute", "Fat Loss", "Sport"]

## UPDATED GLUTE FOCUS COUNT
Existing: 3 programs
Added: Progressive Glute Builder + Glute & Hamstring Focus
Total: 5 programs

## NOTE: Cycle-Aware Training
Research (McMaster University 2025, ACE Fitness 2025) shows no objective 
performance differences across menstrual cycle phases. Rigid phase-based 
programming is not scientifically supported.
RECOMMENDATION: Implement as a MORNING BRIEF FEATURE — when a user 
reports high fatigue/discomfort symptoms in the Me tab, the morning brief 
suggests a lower-intensity session that day. This is honest, science-aligned, 
and still addresses the user need without making unsupportable claims.
Do NOT build as a standalone training program.


## ADDENDUM 4 — FEMALE PROGRAM GAPS (2 programs + 1 tag fix)

### Tag fix (no new program needed)
Update glute_hamstring PROGRAM_LIBRARY entry:
equipment: ["full", "home_bar"] → equipment: ["full", "home_bar", "dumbbells"]
Most exercises (RDL, hip thrust, leg curl) work with dumbbells.
This gives dumbbell-only users an intermediate glute option.

---

### 1. RESISTANCE BAND SCULPT & GLUTES (minimal equipment)
Covers: Sculpt beginner + Glute beginner/intermediate for minimal equipment users.
```
PROGRAM_LIBRARY:
{
  id: "band_sculpt",
  name: "Resistance Band Sculpt",
  category: "Sculpt",
  days: 4,
  weeks: 8,
  level: "Beginner",
  bestFor: "Bands only — full sculpt and glute program with nothing but resistance bands",
  splitKey: "Band Sculpt",
  equipment: ["full", "home_bar", "dumbbells", "minimal"],
  sessionMins: 40,
}

NOTE: Resistance bands are the #1 home fitness tool for female athletes.
This program requires only a set of resistance bands (loop bands + long band).
Every exercise has a band alternative. No barbell, no dumbbells required.
Progress by moving to a heavier band resistance, not by adding weight.

PROGRAMS_BY_DAYS[4].splits["Band Sculpt"]:
{
  description: "Resistance bands create constant tension throughout the full range of motion — unlike free weights which have zero tension at the top of many movements. For glutes specifically, bands are uniquely effective because the glutes work hardest at full extension, exactly where bands are tightest. This program uses that science.",
  days: ["Glute & Hips", "Upper Sculpt", "Hamstring & Core", "Full Body Burn"],
  alternating: false,
  workouts: {
    "Glute & Hips": [
      { name: "Banded Hip Thrust",           sets: 4, reps: "15-20", notes: "Loop band above knees. Back on bench or floor. Drive through heels. Squeeze for 2 seconds at top. The band adds abduction — outer glute activates too.", primary: true },
      { name: "Banded Lateral Walk",         sets: 3, reps: "20 each direction", notes: "Band above knees. Squat position. Step sideways maintaining tension. Never let feet come together.", primary: true },
      { name: "Banded Clamshell",            sets: 3, reps: "20 each", notes: "Lie on side. Band above knees. Rotate top knee open. Hold 1 second at top. Outer glute medius.", primary: false },
      { name: "Banded Donkey Kick",          sets: 3, reps: "15-20 each", notes: "Band around ankles. On all fours. Kick up and hold. Full glute contraction.", primary: false },
      { name: "Banded Squat to Pulse",       sets: 3, reps: "12 + 15 pulses", notes: "Band above knees. Full squat, return halfway, pulse 15 times at bottom. Quads, glutes, outer hip.", primary: false },
      { name: "Single Leg Glute Bridge",     sets: 3, reps: "15 each", notes: "No band needed. One leg extended. Squeeze hard at top.", primary: false }
    ],
    "Upper Sculpt": [
      { name: "Band Pull Apart",             sets: 4, reps: "20",    notes: "Long resistance band. Arms straight at shoulder height. Pull apart to full extension. Rear deltoid and upper back.", primary: true },
      { name: "Banded Overhead Press",       sets: 3, reps: "15",    notes: "Stand on band. Press overhead. Shoulder development without dumbbells.", primary: true },
      { name: "Banded Row",                  sets: 3, reps: "15",    notes: "Anchor band at low point (door anchor or foot). Row to hip. Back and biceps.", primary: false },
      { name: "Banded Chest Press",          sets: 3, reps: "15",    notes: "Band behind back at chest height. Press forward. Chest and triceps.", primary: false },
      { name: "Banded Lateral Raise",        sets: 3, reps: "15-20", notes: "Stand on band. Raise arms to shoulder height. Side deltoid.", primary: false },
      { name: "Push Up",                     sets: 3, reps: "max",   notes: "Or banded push up (band across back for resistance). Chest finisher.", primary: false }
    ],
    "Hamstring & Core": [
      { name: "Banded Romanian Deadlift",    sets: 4, reps: "15",    notes: "Stand on band. Hinge at hip. Hamstrings and glutes. Feel the stretch.", primary: true },
      { name: "Banded Good Morning",         sets: 3, reps: "15",    notes: "Band behind neck/shoulders. Hinge. Lower back and hamstrings.", primary: false },
      { name: "Banded Reverse Lunge",        sets: 3, reps: "12 each", notes: "Stand on band. Step back into lunge. Glute and hamstring focus.", primary: false },
      { name: "Dead Bug",                    sets: 3, reps: "10 each", notes: "No band. Core stability. Lower back flat.", primary: false },
      { name: "Banded Pallof Press",         sets: 3, reps: "12 each", notes: "Band anchored at shoulder height. Press away from anchor. Anti-rotation core.", primary: false },
      { name: "Banded Bicycle Crunch",       sets: 3, reps: "20 each", notes: "Band adds resistance to the twist. Oblique and rectus.", primary: false }
    ],
    "Full Body Burn": [
      { name: "Banded Squat Jump",           sets: 4, reps: "12",    notes: "Band above knees. Jump and land. Power + glute activation.", primary: true },
      { name: "Banded Pull Through",         sets: 3, reps: "15",    notes: "Band between legs from behind. Hip hinge and drive hips forward. The band version of a cable pull-through. Posterior chain.", primary: true },
      { name: "Banded Monster Walk",         sets: 3, reps: "20 each direction", notes: "Band above knees. Forward and back. Glute medius.", primary: false },
      { name: "Banded Tricep Pushdown",      sets: 3, reps: "15",    notes: "Band overhead. Pushdown. Tricep isolation.", primary: false },
      { name: "Banded Bicep Curl",           sets: 3, reps: "15",    notes: "Stand on band. Curl up. Bicep.", primary: false },
      { name: "AMRAP 5 min",                 sets: 1, reps: "As many rounds as possible", notes: "Finisher: 10 banded squats + 10 push ups + 10 banded hip thrusts. Record rounds.", primary: false }
    ]
  }
}
```

---

### 2. ADVANCED SCULPT (advanced, 5 days, full gym)
```
PROGRAM_LIBRARY:
{
  id: "advanced_sculpt",
  name: "Advanced Sculpt",
  category: "Sculpt",
  days: 5,
  weeks: 10,
  level: "Advanced",
  bestFor: "Maximum sculpting volume — 5 days, progressive overload, serious female athlete",
  splitKey: "Advanced Sculpt",
  equipment: ["full"],
  sessionMins: 70,
}

PROGRAMS_BY_DAYS[5].splits["Advanced Sculpt"]:
{
  description: "Five days per week with progressive overload on compound movements and targeted isolation. Built for the woman who already trains consistently and wants to dial in every muscle group. Glutes and shoulders appear in every session because those two muscle groups define the sculpted physique. Volume is high — recovery and nutrition matter here.",
  days: ["Push + Glutes", "Pull + Hamstrings", "Shoulders + Arms", "Lower Body Heavy", "Full Body Sculpt"],
  alternating: false,
  workouts: {
    "Push + Glutes": [
      { name: "Barbell Hip Thrust",          sets: 5, reps: "8-10",  notes: "Heavy. Progressive overload — add weight every session you hit all reps. This is your primary lower body strength movement.", primary: true },
      { name: "Incline Dumbbell Press",      sets: 4, reps: "10-12", notes: "Upper chest. Controlled descent.", primary: true },
      { name: "Cable Hip Abduction",         sets: 3, reps: "15-20 each", notes: "Outer glute. Full range.", primary: false },
      { name: "Chest Fly",                   sets: 3, reps: "12-15", notes: "Stretch and squeeze. Pec definition.", primary: false },
      { name: "Tricep Overhead Extension",   sets: 3, reps: "12-15", notes: "Long head of tricep.", primary: false },
      { name: "Lateral Raise",               sets: 3, reps: "15-20", notes: "Shoulder width. Every session.", primary: false }
    ],
    "Pull + Hamstrings": [
      { name: "Romanian Deadlift",           sets: 5, reps: "8-10",  notes: "Heavy. Progressive overload. Glute-hamstring tie-in.", primary: true },
      { name: "Lat Pulldown",                sets: 4, reps: "10-12", notes: "Wide grip. V-taper.", primary: true },
      { name: "Lying Leg Curl",              sets: 4, reps: "10-12", notes: "Hamstring isolation. Full range.", primary: false },
      { name: "Cable Row",                   sets: 3, reps: "12",    notes: "Mid-back. Posture.", primary: false },
      { name: "Rear Delt Fly",               sets: 3, reps: "15-20", notes: "3D shoulder. Always include.", primary: false },
      { name: "Dumbbell Curl",               sets: 3, reps: "12-15", notes: "", primary: false }
    ],
    "Shoulders + Arms": [
      { name: "Seated Dumbbell Press",       sets: 4, reps: "10-12", notes: "Primary shoulder movement.", primary: true },
      { name: "Lateral Raise",               sets: 5, reps: "15-20", notes: "5 sets this session — shoulder width day.", primary: true },
      { name: "Cable Lateral Raise",         sets: 3, reps: "15-20 each", notes: "Constant tension version. After dumbbell raises.", primary: false },
      { name: "Face Pull",                   sets: 3, reps: "20",    notes: "Rear delt and rotator cuff. Never skip.", primary: false },
      { name: "Barbell Curl",                sets: 4, reps: "10-12", notes: "Arms day. Full range.", primary: false },
      { name: "Skull Crusher",               sets: 4, reps: "10-12", notes: "Tricep mass.", primary: false },
      { name: "Hammer Curl",                 sets: 3, reps: "12",    notes: "Brachialis. Arm thickness.", primary: false },
      { name: "Cable Pushdown",              sets: 3, reps: "15",    notes: "Tricep finisher.", primary: false }
    ],
    "Lower Body Heavy": [
      { name: "Barbell Squat",               sets: 4, reps: "8-10",  notes: "The heavy lower day. Below parallel. Progressive overload.", primary: true },
      { name: "Bulgarian Split Squat",       sets: 4, reps: "8-10 each", notes: "Dumbbell or barbell. Advanced: add weight every 2 sessions.", primary: true },
      { name: "Hip Thrust (bands)",          sets: 3, reps: "15",    notes: "Band above knees adds outer glute. Lighter than Monday.", primary: false },
      { name: "Leg Press (high foot)",       sets: 3, reps: "12-15", notes: "Glute dominant. Feet high and wide.", primary: false },
      { name: "Nordic Hamstring Curl",       sets: 3, reps: "5-8",   notes: "Advanced hamstring. 5 second lowering.", primary: false },
      { name: "Seated Hip Abduction",        sets: 3, reps: "20",    notes: "Outer glute detail.", primary: false }
    ],
    "Full Body Sculpt": [
      { name: "Deadlift",                    sets: 4, reps: "6-8",   notes: "Full body strength. Heavy. Progressive overload.", primary: true },
      { name: "Overhead Press",              sets: 3, reps: "8-10",  notes: "Strict. Shoulder strength.", primary: true },
      { name: "Pull Up",                     sets: 3, reps: "max",   notes: "Or weighted when bodyweight is easy.", primary: false },
      { name: "Cable Kickback",              sets: 3, reps: "15-20 each", notes: "Glute isolation. End-range squeeze.", primary: false },
      { name: "Lateral Raise",               sets: 3, reps: "15-20", notes: "Shoulders every session.", primary: false },
      { name: "Plank Variations",            sets: 3, reps: "45-60 sec", notes: "Standard, side, and RKC plank. Core finisher.", primary: false }
    ]
  }
}
```

---

## FINAL COVERAGE MATRIX — FEMALE PROGRAMS

### Sculpt (3 original + 2 added = 5 total)
| Level | Full gym | Home bar | Dumbbells | Minimal/bands |
|-------|----------|----------|-----------|---------------|
| Beginner | ✓ Full Body Sculpt | ✓ | ✓ | ✓ Band Sculpt |
| Intermediate | ✓ Pilates Strength, Hourglass | partial | ✓ | ✓ Band Sculpt |
| Advanced | ✓ Advanced Sculpt | ✗ | ✗ | ✗ |

### Glute Focus (5 original + tag fix)
| Level | Full gym | Home bar | Dumbbells | Minimal/bands |
|-------|----------|----------|-----------|---------------|
| Beginner | ✓ × 3 | ✓ | ✓ | ✓ Band Sculpt |
| Intermediate | ✓ × 2 | ✓ | ✓ (tag fix) | ✓ Band Sculpt |
| Advanced | ✓ lower_5 | ✓ | ✗ | ✗ |

Remaining gap: Advanced female / dumbbell or minimal equipment.
RECOMMENDATION: The advanced female athlete almost always trains in a full gym.
The advanced glute program (lower_5) requiring full gym is acceptable.
This is a v1.1 gap, not a launch blocker.

