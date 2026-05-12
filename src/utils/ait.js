// ─── ADAPTIVE INTELLIGENCE TRAINING (AIT) UTILITIES ─────────────────────────

// ── Training Age ──────────────────────────────────────────────────────────────
export const TRAINING_AGE_MAP = {
  new:        { skill:"novice",       mesoLen:4, label:"Under 6 months",  progression:"linear" },
  developing: { skill:"intermediate", mesoLen:5, label:"6 months–2 years",progression:"undulating" },
  established:{ skill:"advanced",     mesoLen:6, label:"2–5 years",       progression:"block" },
  veteran:    { skill:"elite",        mesoLen:6, label:"5+ years",        progression:"auto-regulated" },
};

export const getSkillFromAge = (trainingAge) =>
  TRAINING_AGE_MAP[trainingAge]?.skill || "intermediate";

// ── Recovery Capacity → mesocycle length ─────────────────────────────────────
export const RECOVERY_MESO_MAP = {
  fast:      5,
  normal:    6,
  slow:      7,
  very_slow: 8,
};

export const getMesoLength = (recoveryCapacity, trainingAge) => {
  const baseMeso = RECOVERY_MESO_MAP[recoveryCapacity] || 6;
  const ageMeso  = TRAINING_AGE_MAP[trainingAge]?.mesoLen || 6;
  return Math.round((baseMeso + ageMeso) / 2);
};

// ── Readiness Scoring ─────────────────────────────────────────────────────────
// sleep: "4","5","6","7","8","9+"
// stress: "low","medium","high"
// energy: "low","normal","high"
export const scoreReadiness = ({ sleep, stress, energy }) => {
  const sleepScore = { "4":-2,"5":-1,"6":0,"7":1,"8":2,"9+":2 }[sleep] ?? 0;
  const stressScore = { low:2, medium:0, high:-2 }[stress] ?? 0;
  const energyScore = { low:-2, normal:1, high:2 }[energy] ?? 0;
  return sleepScore + stressScore + energyScore;
};

export const getReadinessTier = (score) => {
  if (score >= 3) return "optimal";
  if (score >= 0) return "suboptimal";
  return "poor";
};

export const READINESS_CONFIG = {
  optimal: {
    label: "Great day to push",
    sub:   "Energy looks good. PRs are on the table.",
    color: "#00C9A7",
    weightMod: 1.0,
    volumeMod: 1.0,
    amrap: true,
    badge: "💪 PEAK DAY",
  },
  suboptimal: {
    label: "Let's be smart today",
    sub:   "Weights reduced 10%. Stop at target reps.",
    color: "#F97316",
    weightMod: 0.9,
    volumeMod: 1.0,
    amrap: false,
    badge: "⚡ MANAGE",
  },
  poor: {
    label: "Recovery session today",
    sub:   "Training through fatigue is counterproductive. 60% weights, volume cut 30%.",
    color: "#EF4444",
    weightMod: 0.6,
    volumeMod: 0.7,
    amrap: false,
    badge: "🔄 RECOVERY",
  },
};

// Apply weight modifier to a suggestion weight string
export const applyWeightMod = (weightStr, mod) => {
  if (!weightStr || mod === 1.0) return weightStr;
  const n = parseFloat(weightStr);
  if (isNaN(n)) return weightStr;
  return String(Math.round(n * mod / 2.5) * 2.5); // round to nearest 2.5
};

// ── Menstrual Cycle Phase ─────────────────────────────────────────────────────
export const getCyclePhase = (lastPeriodIso, cycleLengthDays = 28) => {
  if (!lastPeriodIso) return null;
  const last = new Date(lastPeriodIso);
  const now  = new Date();
  const daysSince = Math.floor((now - last) / 86400000) % cycleLengthDays;

  if (daysSince <= 4)  return { phase:"menstrual",  day:daysSince+1, volumeMod:0.8,  label:"🩸 Menstrual",  color:"#FF4D6D", cue:"Energy may be lower. Listen to your body more than usual.",  adaptOption:"Menstrual phase (reduce intensity)" };
  if (daysSince <= 12) return { phase:"follicular",  day:daysSince+1, volumeMod:1.0,  label:"🌸 Follicular",  color:"#F472B6", cue:"Energy building. Good time to push on strength work.",   adaptOption:"Follicular phase (increase intensity)" };
  if (daysSince <= 14) return { phase:"ovulation",   day:daysSince+1, volumeMod:1.05, label:"🌟 Ovulation",   color:"#FBBF24", cue:"Your peak performance window. Go for PRs.",              adaptOption:"Ovulation (peak day)" };
  return                      { phase:"luteal",      day:daysSince+1, volumeMod:0.9,  label:"🍂 Luteal",      color:"#A78BFA", cue:"Fatigue is normal this phase. Maintain rather than push.", adaptOption:"Luteal phase (maintain)" };
};

// ── Muscle Priority Coaching ───────────────────────────────────────────────────
export const PRIORITY_EXERCISE_MAP = {
  Chest:       ["Barbell Bench Press","Incline Dumbbell Press","Cable Fly","Pec Deck"],
  Back:        ["Deadlift","Barbell Row","Pull Up","Lat Pulldown"],
  Shoulders:   ["Overhead Press","Lateral Raise","Face Pull","Arnold Press"],
  Arms:        ["Barbell Curl","Skull Crusher","Hammer Curl","Tricep Pushdown"],
  Quads:       ["Barbell Squat","Leg Press","Leg Extension","Walking Lunge"],
  Hamstrings:  ["Romanian Deadlift","Leg Curl","Glute Ham Raise","Nordic Curl"],
  Glutes:      ["Hip Thrust","Glute Kickback","Cable Pull Through","Sumo Deadlift"],
  Calves:      ["Calf Raise","Seated Calf Raise","Single Leg Calf Raise"],
  Core:        ["Ab Wheel Rollout","Hanging Leg Raise","Plank","Cable Crunch"],
};

export const isPriorityExercise = (exerciseName, musclePriorities) => {
  if (!musclePriorities?.length) return false;
  return musclePriorities.some(muscle =>
    (PRIORITY_EXERCISE_MAP[muscle] || []).some(ex =>
      exerciseName.toLowerCase().includes(ex.toLowerCase().split(" ")[0].toLowerCase())
    )
  );
};

// ── Exercise Rotation Tiers ───────────────────────────────────────────────────
// Tier A: cornerstone compound — never rotates
// Tier B: secondary compound — rotates every 2 weeks
// Tier C: isolation/variety — rotates every week
export const TIER_B_ROTATIONS = {
  Push: [
    ["Incline Dumbbell Press","Incline Barbell Press","Close Grip Bench Press","Dumbbell Bench Press"],
    ["Cable Fly","Pec Deck","Dumbbell Fly","Low Cable Cross"],
  ],
  Pull: [
    ["Barbell Row","Pendlay Row","T-Bar Row","Seated Cable Row"],
    ["Lat Pulldown","Pull Up","Assisted Pull Up","Cable Pullover"],
  ],
  Legs: [
    ["Romanian Deadlift","Stiff Leg Deadlift","Nordic Curl","Glute Ham Raise"],
    ["Leg Press","Hack Squat","Leg Extension","Bulgarian Split Squat"],
  ],
};

export const TIER_C_ROTATIONS = {
  Push: [
    ["Cable Fly","Pec Deck","Dumbbell Fly","Low Cable Cross"],
    ["Lateral Raise","Cable Lateral Raise","Machine Lateral Raise","Upright Row"],
    ["Tricep Pushdown","Skull Crusher","Overhead Tricep Extension","Tricep Dip"],
  ],
  Pull: [
    ["Face Pull","Band Pull Apart","Rear Delt Fly","Cable Rear Delt"],
    ["Barbell Curl","Dumbbell Curl","Preacher Curl","Spider Curl"],
    ["Hammer Curl","Incline Dumbbell Curl","Cable Curl","Concentration Curl"],
  ],
  Legs: [
    ["Walking Lunge","Reverse Lunge","Bulgarian Split Squat","Step Up"],
    ["Leg Curl","Nordic Curl","Lying Leg Curl","Seated Leg Curl"],
    ["Calf Raise","Seated Calf Raise","Single Leg Calf Raise","Donkey Calf Raise"],
  ],
};

export const getRotationIndex = (weekNum, rotationLength) =>
  Math.floor(weekNum / 2) % rotationLength;

// ── Mobility Substitutions ────────────────────────────────────────────────────
export const MOBILITY_SUBSTITUTIONS = {
  "cant_squat_below_parallel": {
    "Barbell Squat": "Box Squat",
    "Leg Press": "Leg Press (High Foot Position)",
    "Hack Squat": "Leg Press",
    "Bulgarian Split Squat": "Step Up",
  },
  "shoulder_pain_pressing": {
    "Overhead Press": "Landmine Press",
    "Arnold Press": "Landmine Press",
    "Barbell Bench Press": "Dumbbell Bench Press",
    "Incline Barbell Press": "Incline Dumbbell Press",
  },
  "lower_back": {
    "Deadlift": "Trap Bar Deadlift",
    "Romanian Deadlift": "Trap Bar Deadlift",
    "Barbell Row": "Cable Row",
    "Barbell Squat": "Goblet Squat",
  },
};

export const applyMobilitySubstitutions = (exercises, mobilityLimitations) => {
  if (!mobilityLimitations?.length || !exercises?.length) return exercises;
  return exercises.map(ex => {
    for (const limitation of mobilityLimitations) {
      const substitutions = MOBILITY_SUBSTITUTIONS[limitation] || {};
      if (substitutions[ex.name]) {
        return { ...ex, name: substitutions[ex.name], originalName: ex.originalName || ex.name, mobilitySubstituted: true };
      }
    }
    return ex;
  });
};

// ── Life Factor Adjustments ───────────────────────────────────────────────────
export const getLifeFactorMod = (stressLevel, sleepQuality, jobPhysicality) => {
  const stressHit = { low:0, medium:-0.05, high:-0.12, very_high:-0.2 }[stressLevel] || 0;
  const sleepHit  = { poor:-0.12, average:0, good:0.05, excellent:0.08 }[sleepQuality] || 0;
  const jobHit    = { desk:0, light:-0.03, moderate:-0.07, heavy:-0.15 }[jobPhysicality] || 0;
  return Math.max(0.6, 1 + stressHit + sleepHit + jobHit);
};

// Starting volume recommendation based on life factors and training age
export const getStartingVolume = (trainingAge, stressLevel, sleepQuality) => {
  const base = { new:10, developing:14, established:18, veteran:20 }[trainingAge] || 14;
  const stressCut = { low:0, medium:-1, high:-2, very_high:-4 }[stressLevel] || 0;
  const sleepCut  = { poor:-2, average:0, good:0, excellent:1 }[sleepQuality] || 0;
  return Math.max(8, base + stressCut + sleepCut);
};

// ── Training Age Coaching Style ───────────────────────────────────────────────
export const COACHING_STYLE = {
  novice: {
    rir:       false,
    amrap:     false,
    dropsets:  false,
    progressNote: "Add weight every session. Focus on form first, weight second.",
    sets: { min:3, max:3 },
    cueStyle: "form-focused",
  },
  intermediate: {
    rir:       "simple",
    amrap:     "last-set",
    dropsets:  false,
    progressNote: "AMRAP on last set. When you exceed target reps, add weight.",
    sets: { min:3, max:4 },
    cueStyle: "technical",
  },
  advanced: {
    rir:       "full",
    amrap:     "all-sets",
    dropsets:  true,
    progressNote: "Track RIR every set. Periodize across mesocycle.",
    sets: { min:4, max:5 },
    cueStyle: "data-driven",
  },
  elite: {
    rir:       "full",
    amrap:     "coach-driven",
    dropsets:  true,
    progressNote: "Auto-regulated. Trust the data, adjust by feel.",
    sets: { min:4, max:6 },
    cueStyle: "autonomous",
  },
};

export const getCoachingStyle = (trainingAge) =>
  COACHING_STYLE[getSkillFromAge(trainingAge)] || COACHING_STYLE.intermediate;
