// ─── FEMALE HEALTH & TRAINING UTILITIES ──────────────────────────────────────

// ── Life Stage Config ─────────────────────────────────────────────────────────
export const LIFE_STAGES = {
  regular:      { label:"Regular cycle",        emoji:"🌸", tdeeAdj:0,    proteinMult:1.0 },
  irregular:    { label:"Irregular cycle",       emoji:"🌙", tdeeAdj:0,    proteinMult:1.0 },
  pregnant:     { label:"Pregnant",              emoji:"🤰", tdeeAdj:300,  proteinMult:1.1 },
  postpartum:   { label:"Postpartum / New mom",  emoji:"👶", tdeeAdj:-100, proteinMult:1.1 },
  perimenopause:{ label:"Perimenopause",         emoji:"🌊", tdeeAdj:-100, proteinMult:1.2 },
  menopause:    { label:"Menopause",             emoji:"🦋", tdeeAdj:-150, proteinMult:1.3 },
};

// ── Pregnancy Modifications ───────────────────────────────────────────────────
const PREGNANCY_UNSAFE = {
  1: ["Crunch","Sit-up","Double Leg Raise"],
  2: ["Barbell Bench Press","Barbell Squat","Crunch","Sit-up","Running","Burpee"],
  3: ["Barbell Bench Press","Barbell Squat","Deadlift","Overhead Press","Crunch","Sit-up","Running","Burpee","Jump"],
};

const PREGNANCY_SUBS = {
  "Barbell Bench Press":   "Incline Dumbbell Press",
  "Barbell Squat":         "Goblet Squat",
  "Deadlift":              "Trap Bar Deadlift (light)",
  "Overhead Press":        "Seated Dumbbell Press",
  "Crunch":                "Dead Bug",
  "Sit-up":                "Pelvic Floor Breathing",
  "Running":               "Walking / Light Cycling",
  "Burpee":                "Step Up",
  "Jump Squat":            "Squat",
};

export const applyPregnancyModifications = (exercises, trimester = 1) => {
  const t = Number(trimester) || 1;
  const unsafe = PREGNANCY_UNSAFE[t] || [];
  return exercises.map(ex => {
    const hit = unsafe.find(u => ex.name.includes(u));
    if (hit) {
      const sub = PREGNANCY_SUBS[hit] || ("Modified " + ex.name);
      return {
        ...ex,
        name: sub,
        originalName: ex.originalName || ex.name,
        pregnancyModified: true,
        sets: Math.min(Number(ex.sets) || 3, 3),
        notes: `T${t} safe modification. Consult your OB or midwife.`,
      };
    }
    if (t >= 2) {
      return {
        ...ex,
        sets: Math.min(Number(ex.sets) || 3, 3),
        notes: (ex.notes || "") + (t === 3 ? " | Reduce weight 20%. Stop if uncomfortable." : " | Moderate effort only."),
      };
    }
    return ex;
  });
};

// ── Postpartum Phase ──────────────────────────────────────────────────────────
export const getPostpartumPhase = (postpartumWeeks = 0, csection = false) => {
  const adj = Math.max(0, postpartumWeeks - (csection ? 2 : 0));
  if (adj < 6)  return { phase:1, label:"Phase 1 — Recovery",    desc:"Breathing & gentle walking only. Reconnect with your core.",  maxIntensity:"very_low" };
  if (adj < 12) return { phase:2, label:"Phase 2 — Rebuild",     desc:"Bodyweight only. Gentle core activation.",                     maxIntensity:"low" };
  if (adj < 26) return { phase:3, label:"Phase 3 — Restore",     desc:"Light resistance training. Progressive but cautious loading.", maxIntensity:"moderate" };
  return               { phase:4, label:"Phase 4 — Return",      desc:"Gradual full return. Listen to your body every session.",      maxIntensity:"full" };
};

const POSTPARTUM_P1 = [
  { name:"Diaphragmatic Breathing",    sets:3, reps:"10 breaths", notes:"Inhale 4s, exhale 6s. Feel ribcage expand 360°.", postpartumSafe:true },
  { name:"Pelvic Floor Contractions",  sets:3, reps:"10 × 5s holds", notes:"Lift and hold. Full release between reps.", postpartumSafe:true },
  { name:"Heel Slides",                sets:2, reps:"10 each side", notes:"Core brace, slow slide. No breath-holding.", postpartumSafe:true },
  { name:"Gentle Walking",             sets:1, reps:"10–20 min", notes:"Conversational pace. Build by 5 min/week.", postpartumSafe:true },
];

export const applyPostpartumModifications = (exercises, postpartumWeeks = 0, csection = false) => {
  const { phase } = getPostpartumPhase(postpartumWeeks, csection);
  if (phase === 1) return POSTPARTUM_P1;
  if (phase === 2) return exercises.map(ex => ({
    ...ex, sets:Math.min(Number(ex.sets)||2,2),
    notes:"Bodyweight only. Stop if leaking, pressure, or pain.",
    postpartumModified:true,
  }));
  if (phase === 3) return exercises.map(ex => ({
    ...ex, sets:Math.min(Number(ex.sets)||3,3),
    notes:(ex.notes||"")+" | 50–60% working weight. Monitor for symptoms.",
    postpartumModified:true,
  }));
  return exercises;
};

// ── Perimenopause / Menopause Modifications ───────────────────────────────────
const HIIT_TERMS = ["HIIT","Box Jump","Sprint","Burpee","Jump Squat","Plyometric"];
const LEG_TERMS  = ["Squat","Deadlift","Lunge","Leg Press","Leg Curl","Step Up","Hip Thrust","Calf"];
const COMPOUND_NAMES = ["Barbell Squat","Deadlift","Barbell Bench Press","Barbell Row","Overhead Press","Hip Thrust"];

export const applyPerimenopauseModifications = (exercises) =>
  exercises.map(ex => {
    if (HIIT_TERMS.some(u => ex.name.includes(u)))
      return { ...ex, notes:(ex.notes||"")+" | Replace HIIT with 30-min Zone 2 cardio today.", periModified:true };
    if (LEG_TERMS.some(k => ex.name.includes(k)))
      return { ...ex, notes:(ex.notes||"")+" | Add 3×12 single-leg balance for bone density.", periModified:true };
    return ex;
  });

export const applyMenopauseModifications = (exercises) =>
  exercises.map(ex => {
    if (HIIT_TERMS.some(u => ex.name.includes(u)))
      return { ...ex, name: ex.name+" → Low Impact", notes:"Replace with steady-state cardio.", menopauseModified:true };
    if (COMPOUND_NAMES.includes(ex.name))
      return { ...ex, reps:"4–6", notes:(ex.notes||"")+" | Heavy compound: priority for bone density & muscle retention.", menopauseModified:true };
    return ex;
  });

// ── Life Stage Modifier (wraps any exercise array) ───────────────────────────
export const lifeStageModifier = (exercises, profile) => {
  if (!profile?.lifeStage || !Array.isArray(exercises)) return exercises;
  switch (profile.lifeStage) {
    case "pregnant":     return applyPregnancyModifications(exercises, profile.trimester);
    case "postpartum":   return applyPostpartumModifications(exercises, profile.postpartumWeeks, profile.csection);
    case "perimenopause":return applyPerimenopauseModifications(exercises);
    case "menopause":    return applyMenopauseModifications(exercises);
    default:             return exercises;
  }
};

// ── ACL Prevention Protocol ───────────────────────────────────────────────────
export const ACL_PREHAB = [
  { name:"Clamshells",          reps:"15 each side", notes:"Side-lying, hips stacked. Isolate glute medius." },
  { name:"Single-Leg Hip Hinge",reps:"10 each side", notes:"Soft knee, drive hip back. Control descent." },
  { name:"Wall Sit",            reps:"30 seconds",   notes:"Knees track over toes. Feet flat on floor." },
  { name:"Lateral Band Walk",   reps:"20 each way",  notes:"Band above knees. Shoulder-width stance." },
];

export const isLegDay = (todayFocus = "") =>
  ["Leg","Lower","Glute","Full Body","Quad","Hamstring"].some(k =>
    todayFocus.toLowerCase().includes(k.toLowerCase())
  );

// ── Cycle-Synced Nutrition ────────────────────────────────────────────────────
export const CYCLE_NUTRITION = {
  menstrual:  {
    tdeeAdj:-50, carbAdj:-20, proteinAdj:0, fatAdj:5,
    focus:"Iron & anti-inflammatory",
    note:"Replenish iron. Reduce refined carbs. Prioritize anti-inflammatory fats (salmon, avocado).",
    foods:["Spinach","Salmon","Dark chocolate","Lentils","Pumpkin seeds","Dates"],
    color:"#FF4D6D",
  },
  follicular: {
    tdeeAdj:0, carbAdj:20, proteinAdj:0, fatAdj:0,
    focus:"Complex carbs & lean protein",
    note:"Rising estrogen boosts insulin sensitivity. Best window for carb-heavy fueling around training.",
    foods:["Oats","Quinoa","Chicken","Berries","Greek yogurt","Sweet potato"],
    color:"#F472B6",
  },
  ovulation:  {
    tdeeAdj:50, carbAdj:30, proteinAdj:10, fatAdj:0,
    focus:"Performance carbs & zinc",
    note:"Peak performance window. Maximize carbs around workouts. Zinc supports hormonal peak.",
    foods:["Sweet potato","Brown rice","Lean beef","Pumpkin seeds","Eggs","Banana"],
    color:"#FBBF24",
  },
  luteal:     {
    tdeeAdj:150, carbAdj:10, proteinAdj:5, fatAdj:10,
    focus:"Magnesium, B6 & steady energy",
    note:"Metabolism increases 7–10%. Higher calorie needs are real. Magnesium and B6 reduce PMS.",
    foods:["Banana","Dark leafy greens","Almonds","Turkey","Whole grain bread","Dark chocolate"],
    color:"#A78BFA",
  },
};

export const getCycleNutrition = (cyclePhase) =>
  cyclePhase ? (CYCLE_NUTRITION[cyclePhase.phase] || null) : null;

// ── PCOS Nutrition ────────────────────────────────────────────────────────────
export const applyPCOSMacros = (macros, weightLbs) => {
  if (!macros || !weightLbs) return macros;
  const w = parseFloat(weightLbs) || 150;
  const protein = Math.round(w * 1.15);
  const fat     = Math.round(macros.calories * 0.28 / 9);
  const carbs   = Math.max(80, Math.round((macros.calories - protein*4 - fat*9) / 4));
  return { ...macros, protein, fat, carbs };
};

export const PCOS_NOTE = "Your macros are optimized for PCOS — lower glycemic carbs and higher protein to support insulin sensitivity.";
export const PCOS_FOODS = ["Oats","Lentils","Berries","Sweet potato","Brown rice","Greek yogurt","Leafy greens"];

// ── Perimenopause/Menopause Nutrition ─────────────────────────────────────────
export const PERI_NUTRITION = {
  tdeeReduction:100, proteinMult:1.2,
  note:"Adjusted for perimenopause — reduced TDEE, higher protein for muscle retention, calcium-rich foods prioritized.",
  calcium:["Dairy/fortified alternatives","Sardines with bones","Kale","Broccoli","Almonds"],
  omega3:["Salmon","Mackerel","Sardines","Walnuts","Flaxseed","Chia seeds"],
};

export const MENO_NUTRITION = {
  tdeeReduction:150, proteinMult:1.3,
  note:"Adjusted for menopause — lower TDEE, higher protein to preserve muscle, anti-inflammatory priority.",
  calcium:["Dairy/fortified alternatives","Calcium-set tofu","Bok choy","Kale","Almonds"],
  omega3:["Fatty fish 3×/week","Walnuts daily","Flaxseed","Chia","Algae supplement"],
};

// ── Language Filter ───────────────────────────────────────────────────────────
const LANG_MAP = {
  "crush it":   "do your best",
  "destroy":    "complete",
  "beast mode": "strong session",
  "shred":      "lean out",
  "cheat meal": "flexible meal",
  "diet":       "nutrition plan",
  "failure":    "opportunity to adjust",
};

const GENTLE_MOTIVATIONS = ["health","energy","confidence","wellbeing","lifestyle"];

export const applyLanguageFilter = (text, profile) => {
  if (!text || !GENTLE_MOTIVATIONS.includes(profile?.fitnessMotivation)) return text;
  let r = text;
  Object.entries(LANG_MAP).forEach(([a,g]) => { r = r.replace(new RegExp(a,"gi"), g); });
  return r;
};

// ── Calorie-Free Mode ─────────────────────────────────────────────────────────
export const isCalorieFreeMode = (profile) => profile?.eatingHistory === "prefer_not";

// ── Consistency Score (replaces streak for peri/menopause) ───────────────────
export const getConsistencyScore = (workoutLogs = []) => {
  const recent = workoutLogs.filter(l => (Date.now() - new Date(l.date).getTime()) <= 30*86400000);
  const pct = Math.min(100, Math.round((recent.length / 12) * 100));
  return { sessions: recent.length, target: 12, pct };
};

export const showConsistencyScore = (profile) =>
  profile?.lifeStage === "perimenopause" || profile?.lifeStage === "menopause";
