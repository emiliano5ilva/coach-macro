import { getCyclePhase } from './ait.js';

export const DAY_TYPES = {
  HEAVY_LOWER:     'heavy_lower',
  HEAVY_UPPER:     'heavy_upper',
  HYPERTROPHY:     'hypertrophy',
  LONG_RUN:        'long_run',
  TEMPO_RUN:       'tempo_run',
  EASY_RUN:        'easy_run',
  INTERVAL_RUN:    'interval_run',
  HYROX_STATION:   'hyrox_station',
  HYROX_RACE:      'hyrox_race',
  HYBRID_LIFT_RUN: 'hybrid',
  ACTIVE_RECOVERY: 'active_recovery',
  DELOAD:          'deload',
  SICK:            'sick',
  REST:            'rest',
};

const LOWER_BODY_EXERCISES = [
  'Barbell Squat','Deadlift','Hack Squat','Leg Press',
  'Romanian Deadlift','Bulgarian Split Squat','Hip Thrust',
  'Sumo Deadlift','Front Squat','Leg Extension','Leg Curl','Calf Raise',
];

export function getDayType(scheduleType, workout, profile = {}) {
  // Sick overrides everything
  if (profile.isSick || scheduleType === 'sick') return DAY_TYPES.SICK;

  if (!scheduleType || scheduleType === 'rest') return DAY_TYPES.REST;

  if (scheduleType === 'active_recovery') return DAY_TYPES.ACTIVE_RECOVERY;

  if (scheduleType === 'cardio' || scheduleType === 'run') {
    const distance = workout?.distance || 0;
    const type     = workout?.runType || 'easy';
    if (type === 'long' || distance > 8) return DAY_TYPES.LONG_RUN;
    if (type === 'tempo')                return DAY_TYPES.TEMPO_RUN;
    if (type === 'interval')             return DAY_TYPES.INTERVAL_RUN;
    return DAY_TYPES.EASY_RUN;
  }

  if (scheduleType === 'hyrox') {
    return workout?.isRace ? DAY_TYPES.HYROX_RACE : DAY_TYPES.HYROX_STATION;
  }

  if (scheduleType === 'hybrid') return DAY_TYPES.HYBRID_LIFT_RUN;

  if (scheduleType === 'training') {
    // Deload overrides training-day type classification
    if (profile.deloadActive) return DAY_TYPES.DELOAD;

    const mesocycleWeek = profile.mesocycle_week || 1;
    const rirTarget     = profile.current_rir    || 3;
    const repRange      = workout?.primaryRepRange || workout?.repRange || '8-12';
    const minReps       = parseInt((repRange || '8').split('-')[0]) || 8;

    const isHeavy = minReps <= 6 || rirTarget <= 1;
    const isPeak  = mesocycleWeek >= 5;

    const exercises = workout?.exercises || [];
    const isLower   = exercises.some(e => LOWER_BODY_EXERCISES.includes(e.name));

    if (isPeak || (isHeavy && isLower)) return DAY_TYPES.HEAVY_LOWER;
    if (isHeavy && !isLower)            return DAY_TYPES.HEAVY_UPPER;
    return DAY_TYPES.HYPERTROPHY;
  }

  return DAY_TYPES.REST;
}

// Floors prevent under-fueling on high-demand days regardless of goal.
// Caps prevent over-eating on low-demand days during a cut/recomp.
function applyGoalAdjustment(dayType, baseCals, rawCalories, goal) {
  const hardFloors = {
    [DAY_TYPES.LONG_RUN]:       baseCals + 300,
    [DAY_TYPES.HYROX_RACE]:     baseCals + 500,
    [DAY_TYPES.HYROX_STATION]:  baseCals + 200,
    [DAY_TYPES.HYBRID_LIFT_RUN]:baseCals + 150,
  };
  const softCaps = {
    Cut:      baseCals + 150,
    Recomp:   baseCals + 200,
    Maintain: baseCals + 350,
    Bulk:     baseCals + 500,
  };
  const floor = hardFloors[dayType] || 0;
  const cap   = softCaps[goal] || baseCals + 350;
  // Floor always beats cap — a runner in a cut still needs fuel
  return Math.max(floor, Math.min(rawCalories, cap));
}

const ADJUSTMENTS = {
  [DAY_TYPES.HEAVY_LOWER]: {
    calOffset: 300, proteinMultiplier: 1.1, carbPercent: 0.50, fatPercent: 0.25,
    label: 'Heavy Leg Day',
    keyInsight: 'Carbs are up today. You need them.',
    reasoning: 'Squats and deadlifts demand maximum fuel. Carbs are high to support intense lower body work and recovery.',
    preFuel:   'Large carb meal 2–3 hours before. Oats, rice, or sweet potato.',
    postFuel:  '40g protein + 60g fast carbs within 30 minutes.',
    duringFuel: null,
    timing: 'Eat more today — especially carbs.',
    color: '#2979FF',
    timingSlots: [
      { t: '7:00 AM',  m: 'Breakfast — high carb (oats + banana + eggs)' },
      { t: '10:00 AM', m: 'Pre-workout snack — rice cakes or fruit' },
      { t: '12:00 PM', m: '🏋️ Train' },
      { t: '1:30 PM',  m: '✅ Post-workout priority — protein + 60g fast carbs' },
      { t: '5:00 PM',  m: 'Dinner — balanced, keep carbs moderate' },
      { t: '8:00 PM',  m: 'Evening snack (optional) — protein focus' },
    ],
  },
  [DAY_TYPES.HEAVY_UPPER]: {
    calOffset: 200, proteinMultiplier: 1.1, carbPercent: 0.45, fatPercent: 0.28,
    label: 'Heavy Upper Day',
    keyInsight: 'Prioritize protein. Moderate carb increase.',
    reasoning: 'Heavy pressing and pulling requires solid fuel but less than leg day.',
    preFuel:   'Moderate carbs 2 hours before. Bread or rice.',
    postFuel:  '40g protein within 30 minutes.',
    duringFuel: null,
    timing: 'Standard training day — prioritize protein.',
    color: '#2979FF',
    timingSlots: [
      { t: '7:00 AM',  m: 'Breakfast — protein focus (eggs + toast)' },
      { t: '10:00 AM', m: 'Pre-workout snack — light carbs' },
      { t: '12:00 PM', m: '🏋️ Train' },
      { t: '1:30 PM',  m: '✅ Post-workout — protein + moderate carbs' },
      { t: '6:00 PM',  m: 'Dinner — standard meal' },
    ],
  },
  [DAY_TYPES.HYPERTROPHY]: {
    calOffset: 150, proteinMultiplier: 1.0, carbPercent: 0.43, fatPercent: 0.28,
    label: 'Hypertrophy Day',
    keyInsight: 'Volume training needs steady fuel.',
    reasoning: 'Volume training needs fuel but not as much as heavy strength work. Moderate carb increase.',
    preFuel:   'Light carbs 90 minutes before.',
    postFuel:  'Protein shake within 30 minutes.',
    duringFuel: null,
    timing: 'Standard training day.',
    color: '#2979FF',
    timingSlots: [
      { t: '7:00 AM',  m: 'Breakfast — balanced' },
      { t: '11:00 AM', m: 'Pre-workout snack — light carbs' },
      { t: '12:30 PM', m: '🏋️ Train' },
      { t: '2:00 PM',  m: '✅ Post-workout — protein shake + food' },
      { t: '6:30 PM',  m: 'Dinner' },
    ],
  },
  [DAY_TYPES.DELOAD]: {
    calOffset: -50, proteinMultiplier: 1.0, carbPercent: 0.40, fatPercent: 0.32,
    label: 'Deload Week',
    keyInsight: 'Eat normally. Slightly less carbs.',
    reasoning: 'Lighter training this week. Slight calorie reduction to manage any surplus from the building phase.',
    preFuel:   null,
    postFuel:  null,
    duringFuel: null,
    timing: 'Eat normally. Slightly less carbs.',
    color: '#EAB308',
    timingSlots: [
      { t: 'Any time', m: 'Normal meal timing — no special prep needed' },
      { t: 'Post',     m: 'Light protein meal within an hour' },
    ],
  },
  [DAY_TYPES.LONG_RUN]: {
    calOffset: 500, proteinMultiplier: 0.9, carbPercent: 0.58, fatPercent: 0.22,
    label: 'Long Run Day',
    keyInsight: 'Your highest calorie day. Carbs before, during, and after.',
    reasoning: 'Long runs burn massive calories. Carbs are the priority — before, during, and after.',
    preFuel:   'High carb meal 2–3 hours before. Gel every 45 min from mile 5.',
    postFuel:  'Carbs + protein within 30 minutes. Chocolate milk is ideal.',
    duringFuel: 'Gel or chews every 45 minutes from mile 5 onwards.',
    timing: 'Eat more today. Especially carbs — no restriction.',
    color: '#22c55e',
    timingSlots: [
      { t: '6:00 AM',  m: 'Light carb breakfast — toast or banana' },
      { t: '7:00 AM',  m: '🏃 Run starts' },
      { t: 'During',   m: '⚡ Gel every 45 min from mile 5' },
      { t: '10:30 AM', m: '✅ Post-run: carbs + protein immediately' },
      { t: '12:30 PM', m: 'Full recovery meal' },
      { t: '6:00 PM',  m: 'Dinner — keep carbs high' },
    ],
  },
  [DAY_TYPES.TEMPO_RUN]: {
    calOffset: 250, proteinMultiplier: 0.95, carbPercent: 0.52, fatPercent: 0.25,
    label: 'Tempo Run Day',
    keyInsight: 'Higher carbs today. Threshold work burns glycogen.',
    reasoning: 'Threshold work burns significant calories and depletes glycogen. Carb focus.',
    preFuel:   'Simple carbs 90 min before. Banana or toast.',
    postFuel:  'Carbs + protein within 30 min.',
    duringFuel: null,
    timing: 'Higher carbs today.',
    color: '#22c55e',
    timingSlots: [
      { t: '7:00 AM',  m: 'Breakfast — moderate carbs' },
      { t: '8:30 AM',  m: 'Pre-workout snack — banana or toast' },
      { t: '10:00 AM', m: '🏃 Tempo run' },
      { t: '11:30 AM', m: '✅ Post-run — carbs + protein' },
      { t: '6:00 PM',  m: 'Dinner — balanced' },
    ],
  },
  [DAY_TYPES.INTERVAL_RUN]: {
    calOffset: 200, proteinMultiplier: 1.0, carbPercent: 0.50, fatPercent: 0.25,
    label: 'Speed Work Day',
    keyInsight: 'Moderate increase. Light meal before intervals.',
    reasoning: 'Intervals are short but intense. Moderate calorie increase with carb focus.',
    preFuel:   'Light carbs 60–90 min before. Nothing heavy.',
    postFuel:  'Protein priority post-session.',
    duringFuel: null,
    timing: 'Moderate increase today.',
    color: '#22c55e',
    timingSlots: [
      { t: '7:00 AM',  m: 'Light breakfast — avoid heavy foods' },
      { t: '8:30 AM',  m: 'Pre-session: banana or rice cake' },
      { t: '10:00 AM', m: '🏃 Interval session' },
      { t: '11:30 AM', m: '✅ Post-session: protein + light carbs' },
      { t: '6:00 PM',  m: 'Dinner — balanced' },
    ],
  },
  [DAY_TYPES.EASY_RUN]: {
    calOffset: 100, proteinMultiplier: 1.0, carbPercent: 0.42, fatPercent: 0.30,
    label: 'Easy Run Day',
    keyInsight: 'Small increase. No special fueling needed.',
    reasoning: 'Easy runs burn modest calories. Small increase — fat fuels easy activity well.',
    preFuel:   null,
    postFuel:  'Normal meal within an hour.',
    duringFuel: null,
    timing: 'Slight increase. No special fueling needed.',
    color: '#22c55e',
    timingSlots: [
      { t: 'Any time', m: 'Normal meals — no special timing' },
      { t: 'Post-run', m: 'Normal meal within an hour' },
    ],
  },
  [DAY_TYPES.HYROX_STATION]: {
    calOffset: 350, proteinMultiplier: 1.05, carbPercent: 0.52, fatPercent: 0.25,
    label: 'Hyrox Training Day',
    keyInsight: 'High demand session. Fuel both strength and endurance.',
    reasoning: 'Station work combines heavy strength and high-intensity cardio. Both systems need fuel.',
    preFuel:   'High carb meal 2–3 hours before. Your body needs glycogen for both the runs and the stations.',
    postFuel:  'Carbs + protein immediately after. Hyrox training depletes both.',
    duringFuel: null,
    timing: 'Higher calories today — balanced macros.',
    color: '#EAB308',
    timingSlots: [
      { t: '7:00 AM',  m: 'High carb breakfast' },
      { t: '9:30 AM',  m: 'Pre-session snack — simple carbs' },
      { t: '11:00 AM', m: '🏋️ HYROX session' },
      { t: '12:30 PM', m: '✅ Post-session — protein + carbs immediately' },
      { t: '6:00 PM',  m: 'Dinner' },
    ],
  },
  [DAY_TYPES.HYROX_RACE]: {
    calOffset: 600, proteinMultiplier: 0.9, carbPercent: 0.60, fatPercent: 0.20,
    label: 'RACE DAY 🏆',
    keyInsight: 'Your highest calorie day of the year. Eat intentionally.',
    reasoning: 'Race day demands maximum fuel. This is not the day to restrict.',
    preFuel:   'Carb load the night before AND morning of race. Oats + banana + sports drink. No new foods.',
    postFuel:  'Eat immediately after finishing. Carbs + protein within 30 minutes.',
    duringFuel: 'Gel at station 4–5. Electrolytes throughout. Drink at every water station.',
    timing: 'Your highest calorie day of the year. Eat intentionally.',
    color: '#EAB308',
    timingSlots: [
      { t: 'Night before', m: '🍝 Carb load — pasta, rice, or oats. Keep fat low.' },
      { t: '5:30 AM',      m: 'Race morning — oats + banana + sports drink' },
      { t: '7:00 AM',      m: '🏆 Race starts' },
      { t: 'Station 4–5',  m: '⚡ Gel + electrolytes' },
      { t: 'Every station',m: 'Water at every water station — no exceptions' },
      { t: 'Post-race',    m: '✅ Eat immediately — carbs + protein within 30 min' },
    ],
  },
  [DAY_TYPES.HYBRID_LIFT_RUN]: {
    calOffset: 400, proteinMultiplier: 1.1, carbPercent: 0.50, fatPercent: 0.25,
    label: 'Hybrid Day',
    keyInsight: "Your highest calorie day. Eat intentionally.",
    reasoning: "Lifting AND running in one day demands significantly more fuel. Don't under-eat today.",
    preFuel:   'Large carb meal before. Snack between sessions.',
    postFuel:  'Full meal within 45 minutes.',
    duringFuel: null,
    timing: 'Your highest calorie day. Eat intentionally.',
    color: '#9B59FF',
    timingSlots: [
      { t: '7:00 AM',  m: 'High carb breakfast before first session' },
      { t: 'Midday',   m: '⚡ Snack between lift and run' },
      { t: 'Post',     m: '✅ Full meal within 45 minutes' },
      { t: '6:00 PM',  m: 'Dinner — keep calories high' },
    ],
  },
  [DAY_TYPES.ACTIVE_RECOVERY]: {
    calOffset: -100, proteinMultiplier: 1.0, carbPercent: 0.38, fatPercent: 0.35,
    label: 'Active Recovery Day',
    keyInsight: 'Slightly less today. Protein stays high.',
    reasoning: 'Light movement only. Slightly reduced carbs — fat fuels easy activity well.',
    preFuel:   null,
    postFuel:  null,
    duringFuel: null,
    timing: 'Slightly less today. Protein stays high for recovery.',
    color: '#6B7280',
    timingSlots: [
      { t: 'Any time', m: 'Normal meals — protein focus, lower carbs' },
    ],
  },
  [DAY_TYPES.SICK]: {
    calOffset: -100, proteinMultiplier: 1.1, carbPercent: 0.42, fatPercent: 0.30,
    label: 'Recovery Day',
    keyInsight: 'Eat what you can. Protein and hydration first.',
    reasoning: 'Illness raises protein needs for immune function. Eat what you can but prioritize protein above all.',
    preFuel:   null,
    postFuel:  null,
    duringFuel: null,
    timing: 'Appetite may be low. Focus on protein and hydration first.',
    note: 'Consider resting instead of training. Your immune system needs the energy.',
    color: '#6B7280',
    timingSlots: [
      { t: 'Any time', m: 'Small frequent meals — prioritize protein and fluids' },
      { t: 'Hydration', m: 'Water, electrolytes, broth — stay hydrated' },
    ],
  },
  [DAY_TYPES.REST]: {
    calOffset: -250, proteinMultiplier: 1.0, carbPercent: 0.35, fatPercent: 0.35,
    label: 'Rest Day',
    keyInsight: 'Carbs down, protein stays the same.',
    reasoning: 'No training means lower energy needs. Reduce carbs — protein stays high for muscle repair.',
    preFuel:   null,
    postFuel:  null,
    duringFuel: null,
    timing: 'Eat less today — especially carbs. Protein stays the same.',
    color: '#6B7280',
    timingSlots: [
      { t: 'Any time', m: 'Focus on protein — reduce carbs today' },
    ],
  },
};

export function getDayTypeNutrition(baseCals, bodyweightKg, dayType, profile = {}) {
  // ── Postpartum override ──────────────────────────────────────────────────────
  if (profile.lifeStage === 'postpartum') {
    const bfBonus         = profile.breastfeeding ? 500 : 0;
    const adjustedBase    = baseCals + bfBonus;
    const postpartumWeeks = profile.postpartumWeeks || 0;
    let effectiveDayType  = dayType;

    if (postpartumWeeks < 12) {
      // Phase 1–2: treat all sessions as active recovery
      effectiveDayType = DAY_TYPES.ACTIVE_RECOVERY;
    } else if (postpartumWeeks < 24) {
      // Phase 3: cap at hypertrophy level
      if (dayType === DAY_TYPES.HEAVY_LOWER || dayType === DAY_TYPES.HEAVY_UPPER) {
        effectiveDayType = DAY_TYPES.HYPERTROPHY;
      }
    }

    const result = getDayTypeNutrition(adjustedBase, bodyweightKg, effectiveDayType, {
      ...profile,
      lifeStage: undefined, // prevent infinite recursion
    });
    result.postpartumNote = bfBonus > 0
      ? 'Breastfeeding adds 500 kcal to your daily target.'
      : postpartumWeeks < 12
        ? 'Active recovery level training recommended — your body is still healing.'
        : 'Heavy training capped at hypertrophy level for postpartum recovery.';
    return result;
  }

  const adj  = ADJUSTMENTS[dayType] || ADJUSTMENTS[DAY_TYPES.REST];
  const goal = profile.goal || 'Maintain';

  const baseProtein = Math.max(120, Math.round(bodyweightKg * 2.2 * adj.proteinMultiplier));
  const rawCalories = baseCals + adj.calOffset;
  let   targetCalories = Math.max(1200, applyGoalAdjustment(dayType, baseCals, rawCalories, goal));

  // ── Female cycle interaction ─────────────────────────────────────────────────
  let cycleNote = null;
  let ironNote  = null;

  if (profile.sex === 'female' && profile.cycleTracking) {
    const lastPeriod = profile.lastPeriodDate || profile.lastPeriod;
    const cycleData  = lastPeriod ? getCyclePhase(lastPeriod) : null;
    const phase      = cycleData?.phase || profile.cyclePhase;

    if (phase === 'luteal') {
      // Luteal phase raises metabolism 100–300 kcal
      targetCalories += 150;
      if (
        dayType === DAY_TYPES.HEAVY_LOWER ||
        dayType === DAY_TYPES.HEAVY_UPPER ||
        dayType === DAY_TYPES.HYROX_STATION
      ) {
        targetCalories += 100;
        cycleNote = 'Luteal phase raises your metabolism. Combined with heavy training — eat a little more today.';
      } else {
        cycleNote = 'Luteal phase raises your metabolism ~150 kcal. This is accounted for today.';
      }
    }

    if (phase === 'follicular' && goal === 'Cut') {
      // Follicular phase — body responds better to a deficit
      targetCalories -= 50;
      cycleNote = 'Follicular phase — your body responds well to a deficit right now.';
    }

    if (phase === 'menstrual') {
      ironNote = 'Prioritize iron-rich foods today: red meat, lentils, spinach, fortified cereals.';
    }
  }

  targetCalories = Math.max(1200, targetCalories);

  const carbCalories = targetCalories * adj.carbPercent;
  const fatCalories  = targetCalories * adj.fatPercent;

  return {
    calories:    targetCalories,
    protein:     baseProtein,
    carbs:       Math.round(carbCalories / 4),
    fat:         Math.round(fatCalories  / 9),
    dayType,
    label:       adj.label,
    keyInsight:  adj.keyInsight,
    reasoning:   adj.reasoning,
    preFuel:     adj.preFuel    || null,
    postFuel:    adj.postFuel   || null,
    duringFuel:  adj.duringFuel || null,
    timing:      adj.timing,
    note:        adj.note       || null,
    color:       adj.color,
    timingSlots: adj.timingSlots || [],
    cycleNote,
    ironNote,
  };
}

const TRAINING_DAY_TYPES = [
  'heavy_lower','heavy_upper','hypertrophy',
  'long_run','tempo_run','interval_run',
  'hyrox_station','hyrox_race','hybrid',
];

export function getDailyWaterTarget(profile, dayType) {
  const wLbs = profile?.wUnit === 'kg'
    ? (parseFloat(profile?.weight || 70) * 2.205)
    : parseFloat(profile?.weight || 160);
  let oz = Math.round(wLbs * 0.67);
  if (TRAINING_DAY_TYPES.includes(dayType)) oz += 16;
  else if (['easy_run','active_recovery'].includes(dayType)) oz += 8;
  if (profile?.sex === 'female') {
    if (profile?.isPregnant) oz += 10;
    if (profile?.isBreastfeeding) oz += 13;
  }
  if (profile?.hot_weather_mode) oz += 16;
  return Math.round(oz);
}

export function getWeekNutrition(schedule, baseCals, bodyweightKg, profile) {
  const WDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return WDAYS.map(day => {
    const schedType = schedule?.[day] || 'rest';
    const dayType   = getDayType(schedType, null, profile);
    const nutrition = getDayTypeNutrition(baseCals, bodyweightKg, dayType, profile);
    return { day, schedType, dayType, ...nutrition };
  });
}
