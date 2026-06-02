# Coach Macro — Pace Engine Spec
# Dynamic running/Hyrox/Hybrid plan personalization system

---

## OVERVIEW

The Pace Engine transforms static training plans into personalized coaching.
Instead of generic novice/intermediate/advanced buckets, every running and
Hyrox session shows the athlete's actual personal paces — derived from their
current fitness and updated automatically as they improve.

Core principle: Enter any performance → get every pace → get the right plan length.
Then as you improve: performance updates → paces update → moat #1 adjusts nutrition.

---

## PART 1 — THE MATH (paceService.js)

### 1A — VDOT from race time

VDOT is Jack Daniels' proxy for aerobic fitness (roughly equivalent to VO2max).
It's calculated from any race time using the Daniels formula.

```javascript
// Standard Daniels VDOT calculation
// T = race time in minutes, D = distance in meters

function velocityAtVDOT(vdot) {
  // Returns velocity in m/min at VO2max effort
  return (-4.60 + 0.182258 * vdot + 0.000104 * vdot * vdot);
}

function pctVO2atVelocity(velocity, raceTime) {
  // Percent of VO2max at a given velocity over a given duration
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * raceTime) + 
         0.2989558 * Math.exp(-0.1932605 * raceTime);
}

function vdotFromRaceTime(distanceMeters, timeMinutes) {
  // Binary search for VDOT that produces the observed race time
  // Precise enough for practical use
  let lo = 20, hi = 85;
  while (hi - lo > 0.1) {
    const mid = (lo + hi) / 2;
    const vel = velocityAtVDOT(mid);
    const pct = pctVO2atVelocity(vel, timeMinutes);
    const predictedTime = distanceMeters / (pct * vel);
    if (predictedTime > timeMinutes) lo = mid;
    else hi = mid;
  }
  return Math.round((lo + hi) / 2 * 10) / 10;
}

// From 1-mile time (the primary input method):
function vdotFromMile(mileTimeSeconds) {
  return vdotFromRaceTime(1609.34, mileTimeSeconds / 60);
}

// Cross-distance projection (mile → everything):
function projectRaceTime(vdot, targetDistanceMeters) {
  // Returns predicted time in seconds
  // Uses iterative approach — find the time where VDOT(dist, time) = known VDOT
  let lo = 0, hi = 86400; // max 24 hours
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const testVdot = vdotFromRaceTime(targetDistanceMeters, mid / 60);
    if (testVdot > vdot) hi = mid;
    else lo = mid;
  }
  return Math.round((lo + hi) / 2);
}

// All distances in meters
const RACE_DISTANCES = {
  mile:           1609.34,
  fiveK:          5000,
  tenK:           10000,
  halfMarathon:   21097.5,
  marathon:       42195,
};
```

### 1B — Training paces from VDOT

From a single VDOT number, derive every training pace:

```javascript
function trainingPaces(vdot) {
  // All paces in seconds per km
  // Based on Daniels' Tables (2014 edition)

  return {
    // Easy/Long Run: ~59-74% VO2max — conversational, sustainable for hours
    easy:     vdotToPace(vdot, 0.65),  // 65% intensity
    long:     vdotToPace(vdot, 0.62),  // slightly easier than easy

    // Marathon Pace: ~75-84% VO2max
    marathon: projectRaceTime(vdot, RACE_DISTANCES.marathon) / 42.195 / 60 * 1000,

    // Tempo/Threshold: ~83-88% VO2max — comfortably hard, 20-40 min
    tempo:    vdotToPace(vdot, 0.88),

    // Interval: ~95-100% VO2max — 5K race effort, 3-5 min reps
    interval: projectRaceTime(vdot, RACE_DISTANCES.fiveK) / 5 / 60 * 1000,

    // Repetition: 105% VO2max — short, fast, recovery in between
    rep:      vdotToPace(vdot, 1.05),
  };
}

function vdotToPace(vdot, intensityFraction) {
  // Convert VDOT at given intensity to seconds/km
  const adjustedVdot = vdot * intensityFraction;
  const velocityMperMin = velocityAtVDOT(adjustedVdot);
  const secPerKm = 60000 / velocityMperMin;
  return Math.round(secPerKm); // seconds per km
}

function formatPace(secPerKm) {
  // Returns "6:28/km" string
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60).toString().padStart(2, '0');
  return `${min}:${sec}/km`;
}

function formatTime(seconds) {
  // Returns "h:mm:ss" or "mm:ss"
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60).toString().padStart(2, '0');
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s}`;
  return `${m}:${s}`;
}
```

### 1C — Plan duration from VDOT gap

```javascript
function recommendPlanWeeks(currentVdot, goalVdot) {
  const gap = goalVdot - currentVdot;

  // VDOT improvement rates are non-linear:
  // Beginners (VDOT 25-35): can improve 2-3 VDOT per 8 weeks
  // Intermediate (35-50): 1-2 VDOT per 8 weeks
  // Advanced (50+): 0.5-1 VDOT per 8 weeks

  const weeksPer1VDOT = currentVdot < 35 ? 3.5 : currentVdot < 50 ? 5 : 8;
  const rawWeeks = gap * weeksPer1VDOT;

  // Round to nearest plan tier and cap at 24 weeks
  if (rawWeeks <= 8)  return 8;
  if (rawWeeks <= 12) return 12;
  if (rawWeeks <= 16) return 16;
  if (rawWeeks <= 20) return 20;
  return 24;
}

function isGoalRealistic(currentVdot, goalVdot, requestedWeeks) {
  const needed = recommendPlanWeeks(currentVdot, goalVdot);
  if (needed > requestedWeeks) {
    return {
      realistic: false,
      neededWeeks: needed,
      milestone: goalTimeAtWeeks(currentVdot, requestedWeeks),
      message: `To hit your goal, you'll need ~${needed} weeks. 
                Want a ${needed}-week plan, or a ${requestedWeeks}-week 
                plan targeting an intermediate milestone of 
                ${milestone}?`
    };
  }
  return { realistic: true };
}
```

### 1D — Complete exported API

```javascript
export const paceService = {
  // Input: any race time → VDOT
  vdotFromMile,
  vdotFromRaceTime,   // pass distance in meters + time in minutes

  // VDOT → all training paces (returns { easy, long, marathon, tempo, interval, rep } in sec/km)
  trainingPaces,

  // VDOT → race time projections for all distances
  projectAllRaceTimes(vdot) {
    return {
      mile:         formatTime(projectRaceTime(vdot, RACE_DISTANCES.mile)),
      fiveK:        formatTime(projectRaceTime(vdot, RACE_DISTANCES.fiveK)),
      tenK:         formatTime(projectRaceTime(vdot, RACE_DISTANCES.tenK)),
      halfMarathon: formatTime(projectRaceTime(vdot, RACE_DISTANCES.halfMarathon)),
      marathon:     formatTime(projectRaceTime(vdot, RACE_DISTANCES.marathon)),
    };
  },

  // Plan planning
  recommendPlanWeeks,
  isGoalRealistic,

  // Display
  formatPace,
  formatTime,
};
```

---

## PART 2 — HYROX PACE SERVICE (hyroxPaceService.js)

Hyrox race time breaks into two components:
- Run component: 8 × 1km laps between stations (40% of total for elites, 50% for intermediate)
- Station component: 8 stations total time (60% for elites, 50% for intermediate)

```javascript
function hyroxTargets(currentTotalTime, goalTotalTime) {
  // currentTotalTime, goalTotalTime in seconds

  // Estimate current run/station split based on total time
  // Sub-60 min athletes: typically 40% run / 60% station
  // 60-80 min: ~45% / 55%
  // 80-100 min: ~50% / 50%
  // 100+ min: ~55% / 45%
  const runFraction = currentTotalTime < 3600 ? 0.40
    : currentTotalTime < 4800 ? 0.45
    : currentTotalTime < 6000 ? 0.50 : 0.55;

  const currentRunTime = currentTotalTime * runFraction;
  const currentStationTime = currentTotalTime * (1 - runFraction);
  const currentKmPace = (currentRunTime / 8); // seconds per 1km lap

  const goalRunTime = goalTotalTime * runFraction;
  const goalStationTime = goalTotalTime * (1 - runFraction);
  const goalKmPace = (goalRunTime / 8);

  // Individual station time targets (proportional)
  // Standard competition station times (Hyrox rules):
  const stationWeights = {
    skiErg:        0.09,   // SkiErg 1000m
    sled_push:     0.12,   // Sled Push (varies by weight)
    sled_pull:     0.11,   // Sled Pull
    burpee_bj:     0.15,   // Burpee Broad Jump 80m
    rowing:        0.10,   // Row 1000m
    farmers:       0.10,   // Farmer's Carry 200m (2×24kg)
    sandbag:       0.15,   // Sandbag Lunges 100m (20kg)
    wall_balls:    0.18,   // Wall Balls 100 reps (9kg)
  };

  const stationTargets = {};
  Object.entries(stationWeights).forEach(([station, weight]) => {
    const currentTime = currentStationTime * weight;
    const goalTime = goalStationTime * weight;
    stationTargets[station] = {
      current: Math.round(currentTime),
      goal: Math.round(goalTime),
      improvement: Math.round(currentTime - goalTime),
    };
  });

  return {
    currentKmPaceFormatted: formatPace(currentKmPace),
    goalKmPaceFormatted: formatPace(goalKmPace),
    stationTargets,
    planWeeks: hyroxPlanWeeks(currentTotalTime, goalTotalTime),
  };
}

function hyroxPlanWeeks(currentSecs, goalSecs) {
  const improvementPct = (currentSecs - goalSecs) / currentSecs * 100;
  if (improvementPct <= 5)  return 8;
  if (improvementPct <= 10) return 12;
  if (improvementPct <= 15) return 16;
  if (improvementPct <= 20) return 20;
  return 24;
}

export const hyroxPaceService = { hyroxTargets, hyroxPlanWeeks };
```

---

## PART 3 — PROGRAM SETUP MODAL (new component)

Fires when user taps any Running, Hyrox, or Hybrid program in the library.
This replaces the current behavior where tapping a program immediately starts it.

### Running Program Setup — 4 steps

**Step 1: Baseline**
```
// Screen shown
"Before we build your plan, we need to know
where you're starting from."

[Can you run 1 mile without stopping?]
  ✓ Yes — I'll run a test mile now / I have a recent time
  ✗ Not yet — I'm building up to it
  ─ Skip — I'll enter a 5K/10K/HM time directly
```

If "Not yet" → route to Couch to Mile program (8 weeks).
End of Couch to Mile → return here for time trial.

If "Yes" → Step 2
If "Skip" → Step 2 (with distance selector)

**Step 2: Time entry**
```
"What's your best recent time?"
[Distance selector: 1 mile / 5K / 10K / Half / Full]
[Time entry: MM:SS or H:MM:SS]

"Based on your time, here's where you stand:"
┌─────────────────────────────────────┐
│  1 mile:         8:42               │
│  5K:             28:15  ← current   │
│  10K:            58:30              │
│  Half marathon:  2:08:45            │
│  Marathon:       4:29:00            │
└─────────────────────────────────────┘
"These are your current predicted times based on
your fitness today."
```

**Step 3: Goal**
```
"What are you training for?"
[Radio buttons:]
  ○ Improve my 5K time
  ○ Train for a 10K
  ○ Train for a Half Marathon
  ○ Train for a Marathon
  ○ Just get fitter — no race goal

"What's your target time?" [time entry]
  OR "What's realistic?" → app suggests:
     "Based on your fitness, a realistic goal for
      [plan length] of training is [projected time].
      Want to aim for that?"
```

**Step 4: Plan recommendation**
```
"Here's your plan:"
┌─────────────────────────────────────────┐
│  Current:     28:15 5K                  │
│  Goal:        25:00 5K                  │
│  Plan length: 12 weeks                  │
│  Your easy pace:   6:28/km              │
│  Your tempo pace:  5:15/km              │
│  Your interval:    4:58/km              │
└─────────────────────────────────────────┘
"Every session in your plan will show your
personal target paces — not generic effort
levels."

[Start My Plan →]
```

### Hyrox Program Setup — same 4-step structure
Step 1: "Have you done a Hyrox race before?"
  Yes → enter finish time
  No → enter recent 5K time (used to estimate Hyrox potential) 
       + self-assess station fitness (1-5 scale)
Step 2: Show station time breakdowns
Step 3: Goal time
Step 4: Plan with per-station targets + km pace

### Hybrid Program Setup
Collect BOTH:
- Run baseline (1-mile or 5K time)
- Lifting baseline (experience level + optional PR entry)
Show both: running paces AND lifting progressions
Note: "Your nutrition targets will shift automatically 
between run days and lift days."

---

## PART 4 — PROFILE STORAGE

Add to profile_data (store on Supabase profiles table):

```javascript
runProfile: {
  currentVdot: 42.5,
  baslineType: "mile",              // "mile" | "5k" | "10k" | "half" | "full"
  baselineTime: 520,                // seconds
  baselineDate: "2026-06-01",
  goalDistance: "5k",
  goalTime: 1500,                   // 25:00 in seconds
  goalDate: null,                   // optional race date
  planWeeks: 12,
  planStartDate: "2026-06-02",
  paces: {                          // seconds per km
    easy:      388,                 // 6:28/km
    long:      406,                 // 6:46/km
    marathon:  320,                 // 5:20/km
    tempo:     315,                 // 5:15/km
    interval:  298,                 // 4:58/km
    rep:       283,                 // 4:43/km
  },
},
hyroxProfile: {
  currentTotalTime: 4800,           // 80:00 in seconds
  currentKmPace: "5:00",
  goalTotalTime: 4200,              // 70:00
  planWeeks: 12,
  stationTargets: { ... },
},
```

---

## PART 5 — DYNAMIC PLAN RENDERER

The existing program data in running_programs.js stays as-is.
The renderer replaces the generic description with personalized paces.

```javascript
function renderSessionWithPaces(sessionDescription, paces) {
  // Replace pace zone keywords with actual paces
  return sessionDescription
    .replace(/easy pace/gi,     `easy pace (${formatPace(paces.easy)}/km)`)
    .replace(/tempo pace/gi,    `tempo pace (${formatPace(paces.tempo)}/km)`)
    .replace(/interval pace/gi, `interval pace (${formatPace(paces.interval)}/km)`)
    .replace(/race pace/gi,     `race pace (${formatPace(paces.marathon)}/km)`)
    .replace(/conversational/gi, `conversational (stay under ${formatPace(paces.easy + 30)}/km)`)
    // Pattern: "5km easy" → "5km easy (6:28/km for you)"
    .replace(/(\d+\.?\d*\s*km?\s*)(easy|long|slow|recovery)/gi,
      (match, dist, effort) => `${dist}${effort} (${formatPace(paces[effort === 'easy' || effort === 'long' ? 'easy' : 'long'])}/km for you)`);
}
```

All rendering happens at display time, not stored. If paces update, 
the plan description automatically updates next render.

---

## PART 6 — ADAPTATION ENGINE

### 6A — Auto-update from Apple Health
When a workout is synced from Apple Health:
```javascript
function checkForVdotImprovement(newRun, currentVdot) {
  // If the run was a race-effort (detected by high HR or explicit "race" tag)
  // Calculate implied VDOT from distance + time
  const impliedVdot = vdotFromRaceTime(newRun.distanceMeters, newRun.durationMinutes);

  if (impliedVdot > currentVdot + 0.5) {
    // Meaningful improvement — update
    return {
      shouldUpdate: true,
      newVdot: impliedVdot,
      message: `Your paces have been updated based on your ${formatTime(newRun.duration * 60)} 
                ${formatDistance(newRun.distanceMeters)}. New easy pace: 
                ${formatPace(trainingPaces(impliedVdot).easy)}/km`,
    };
  }
  return { shouldUpdate: false };
}
```

### 6B — Post-run feedback
After each prescribed run session, user sees:
```
"How did today's session feel?"
  ○ Too easy — I could have gone much faster
  ○ Just right
  ○ Hard but doable
  ○ Too hard — I couldn't hit the paces
```

If "Too easy" 3 sessions in a row → nudge VDOT up by 1, recalculate
If "Too hard" 2 sessions in a row → nudge VDOT down by 0.5, recalculate + flag to morning brief

### 6C — Moat #1 integration
When plan paces update → trigger nutrition recalculation:
- Updated VDOT → updated training load estimate
- Training load estimate feeds into TDEE adjustment
- Morning brief next day acknowledges the performance improvement

Specifically, in NativeApp when a VDOT update fires:
→ Recalculate TDEE with new activity factor
→ Update today's calorie target if it's a training day
→ Add to morning brief queue: "You ran faster than expected yesterday.
   Your targets have been adjusted to fuel your progress."

---

## PART 7 — COUCH TO MILE (gateway program)

For users who answer "I can't run a mile yet."

```
PROGRAM_LIBRARY:
{
  id: "couch_to_mile",
  name: "Couch to Mile",
  category: "Running",
  days: 3,
  weeks: 8,
  level: "Beginner",
  bestFor: "Build from walking to running 1 mile — your gateway to every other plan",
  isRunning: true,
  equipment: ["minimal"],
  sessionMins: 30,
}
```

Week-by-week structure (all weeks present — not just key weeks):

Week 1: Walk 4 min, run 1 min × 5. Total 25 min.
Week 2: Walk 3 min, run 2 min × 5. Total 25 min.
Week 3: Walk 2 min, run 3 min × 5. Total 25 min.
Week 4: Walk 2 min, run 5 min × 4. Total 28 min.
Week 5: Walk 1 min, run 7 min × 3. Total 24 min.
Week 6: Walk 1 min, run 10 min × 2. Total 22 min.
Week 7: Run 15 min, walk 2 min, run 10 min. Total 27 min.
Week 8: Run 1 mile continuously. This is your time trial.

End of Week 8: "Run your mile. Record your time. Your personalized
running plan starts here."

Each session in RUNNING_PROGRAMS format with skill_variants:
novice:       lower end of each interval (add extra walk time if needed)
intermediate: as written above
advanced:     (this program has no advanced — all users follow intermediate)

---

## PART 8 — BUILD PHASES

### Phase 1: paceService.js + hyroxPaceService.js
- Pure math, no UI
- Write the functions
- Unit test with known inputs:
  - 28:00 5K → VDOT 36.4 → easy pace 6:41/km ✓
  - 20:00 5K → VDOT 53.8 → easy pace 5:24/km ✓
  - Mile 8:00 → VDOT 42.8 → 5K prediction 27:30 ✓

### Phase 2: Profile storage
- Add runProfile + hyroxProfile to profile schema
- Add to saveProfile and loadProfile
- Migration: existing users get runProfile: null (they'll be prompted to set up on next program tap)

### Phase 3: Program Setup Modal
- New component: RunProgramSetup.jsx
- The 4-step flow for Running and Hyrox
- Stores result to profile via saveProfile

### Phase 4: Dynamic plan renderer
- Modify the program display to show personal paces
- renderSessionWithPaces() applied to all running session descriptions

### Phase 5: Couch to Mile program
- Full week-by-week data in RUNNING_PROGRAMS
- PROGRAM_LIBRARY entry
- Routing from Step 1 "Not yet" → this program

### Phase 6: Adaptation engine
- Post-run feedback component
- Apple Health VDOT check on workout sync
- Moat #1 integration (VDOT update → TDEE recalc → morning brief)

---

## PART 9 — EXAMPLE OUTPUT

User: male, 31 years old, selected "Couch to 5K Race" program
Baseline: 1-mile time 9:45

System computes:
  VDOT:           38.2
  Easy pace:      6:33/km  ("conversational — you should be able to speak in sentences")
  Tempo pace:     5:23/km  ("comfortably hard — can speak a word at a time")
  Interval pace:  5:04/km  ("5K race effort — can't speak")
  5K prediction:  29:48
  10K prediction: 1:01:45
  HM prediction:  2:16:00
  FM prediction:  4:47:00

User sets goal: sub-25:00 5K
  Goal VDOT:      47.5
  VDOT gap:       9.3
  Plan duration:  16 weeks (recommended)

Week 8 session example — BEFORE pace engine:
  "Easy Run 8km"

Week 8 session example — AFTER pace engine:
  "Easy Run 8km @ 6:33/km for you
   (stay conversational — if you can't speak in sentences, slow down)
   Expected finish: ~52 min"

After 8 weeks user runs 27:30 5K (new PR):
  New VDOT:       43.7
  Improvement:    +5.5 VDOT
  New easy pace:  6:08/km
  Morning brief next day:
    "You ran a 5K PR yesterday. Your training paces have been updated.
     Easy runs are now 6:08/km. Your goal is still on track —
     you're ahead of schedule."
  Nutrition:
    "Yesterday's race effort cost approximately 450 additional calories.
     Today is a rest day — your targets are adjusted down to account for
     reduced activity. Protein stays high to support recovery."

