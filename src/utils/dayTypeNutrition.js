export const DAY_TYPES = {
  HEAVY_LOWER:     'heavy_lower',
  HEAVY_UPPER:     'heavy_upper',
  HYPERTROPHY:     'hypertrophy',
  LONG_RUN:        'long_run',
  TEMPO_RUN:       'tempo_run',
  EASY_RUN:        'easy_run',
  INTERVAL_RUN:    'interval_run',
  HYROX_STATION:   'hyrox_station',
  HYBRID_LIFT_RUN: 'hybrid',
  ACTIVE_RECOVERY: 'active_recovery',
  REST:            'rest',
};

const LOWER_BODY_EXERCISES = [
  'Barbell Squat','Deadlift','Hack Squat','Leg Press',
  'Romanian Deadlift','Bulgarian Split Squat','Hip Thrust',
  'Sumo Deadlift','Front Squat','Leg Extension','Leg Curl','Calf Raise',
];

export function getDayType(scheduleType, workout, profile = {}) {
  if (!scheduleType || scheduleType === 'rest') return DAY_TYPES.REST;

  if (scheduleType === 'active_recovery') return DAY_TYPES.ACTIVE_RECOVERY;

  if (scheduleType === 'cardio' || scheduleType === 'run') {
    const distance = workout?.distance || 0;
    const type = workout?.runType || 'easy';
    if (type === 'long' || distance > 8) return DAY_TYPES.LONG_RUN;
    if (type === 'tempo')                return DAY_TYPES.TEMPO_RUN;
    if (type === 'interval')             return DAY_TYPES.INTERVAL_RUN;
    return DAY_TYPES.EASY_RUN;
  }

  if (scheduleType === 'hyrox') return DAY_TYPES.HYROX_STATION;

  if (scheduleType === 'hybrid') return DAY_TYPES.HYBRID_LIFT_RUN;

  if (scheduleType === 'training') {
    const mesocycleWeek = profile.mesocycle_week || 1;
    const rirTarget     = profile.current_rir    || 3;
    const repRange      = workout?.primaryRepRange || workout?.repRange || '8-12';
    const minReps       = parseInt((repRange || '8').split('-')[0]) || 8;

    const isHeavy = minReps <= 6 || rirTarget <= 1;
    const isPeak  = mesocycleWeek >= 5;

    const exercises  = workout?.exercises || [];
    const isLower = exercises.some(e => LOWER_BODY_EXERCISES.includes(e.name));

    if (isPeak || (isHeavy && isLower)) return DAY_TYPES.HEAVY_LOWER;
    if (isHeavy && !isLower)            return DAY_TYPES.HEAVY_UPPER;
    return DAY_TYPES.HYPERTROPHY;
  }

  return DAY_TYPES.REST;
}

function applyGoalCap(adjustedCalories, baseCals, goal) {
  const caps = {
    Cut:      baseCals + 100,
    Recomp:   baseCals + 150,
    Maintain: baseCals + 300,
    Bulk:     baseCals + 400,
  };
  return Math.min(adjustedCalories, caps[goal] || baseCals + 300);
}

const ADJUSTMENTS = {
  [DAY_TYPES.HEAVY_LOWER]: {
    calOffset: 300, proteinMultiplier: 1.1, carbPercent: 0.50, fatPercent: 0.25,
    label: 'Heavy Leg Day',
    keyInsight: 'Carbs are up today. You need them.',
    reasoning: 'Squats and deadlifts demand maximum fuel. Carbs are high to support intense lower body work and recovery.',
    preFuel:  'Large carb meal 2–3 hours before. Oats, rice, or sweet potato.',
    postFuel: '40g protein + 60g fast carbs within 30 minutes.',
    duringFuel: null,
    timing: 'Eat more today — especially carbs.',
    color: '#2979FF',
    timingSlots: [
      { t: '7:00 AM',   m: 'Breakfast — high carb (oats + banana + eggs)' },
      { t: '10:00 AM',  m: 'Pre-workout snack — rice cakes or fruit' },
      { t: '12:00 PM',  m: '🏋️ Train' },
      { t: '1:30 PM',   m: '✅ Post-workout priority — protein + 60g fast carbs' },
      { t: '5:00 PM',   m: 'Dinner — balanced, keep carbs moderate' },
      { t: '8:00 PM',   m: 'Evening snack (optional) — protein focus' },
    ],
  },
  [DAY_TYPES.HEAVY_UPPER]: {
    calOffset: 200, proteinMultiplier: 1.1, carbPercent: 0.45, fatPercent: 0.28,
    label: 'Heavy Upper Day',
    keyInsight: 'Prioritize protein. Moderate carb increase.',
    reasoning: 'Heavy pressing and pulling requires solid fuel but less than leg day.',
    preFuel:  'Moderate carbs 2 hours before. Bread or rice.',
    postFuel: '40g protein within 30 minutes.',
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
    preFuel:  'Light carbs 90 minutes before.',
    postFuel: 'Protein shake within 30 minutes.',
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
    preFuel:  'Simple carbs 90 min before. Banana or toast.',
    postFuel: 'Carbs + protein within 30 min.',
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
    preFuel:  'Light carbs 60–90 min before. Nothing heavy.',
    postFuel: 'Protein priority post-session.',
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
    preFuel:  null,
    postFuel: 'Normal meal within an hour.',
    duringFuel: null,
    timing: 'Slight increase. No special fueling needed.',
    color: '#22c55e',
    timingSlots: [
      { t: 'Any time', m: 'Normal meals — no special timing' },
      { t: 'Post-run', m: 'Normal meal within an hour' },
    ],
  },
  [DAY_TYPES.HYROX_STATION]: {
    calOffset: 350, proteinMultiplier: 1.05, carbPercent: 0.50, fatPercent: 0.25,
    label: 'HYROX Day',
    keyInsight: 'High demand session. Fuel both strength and endurance.',
    reasoning: 'HYROX combines strength and endurance — high calorie demand across the board.',
    preFuel:  'Carb-forward meal 2 hours before. No fasting.',
    postFuel: 'Protein + carbs within 30 minutes.',
    duringFuel: null,
    timing: 'Higher calories today — balanced macros.',
    color: '#EAB308',
    timingSlots: [
      { t: '7:00 AM',  m: 'High carb breakfast' },
      { t: '9:30 AM',  m: 'Pre-session snack' },
      { t: '11:00 AM', m: '🏋️ HYROX session' },
      { t: '12:30 PM', m: '✅ Post-session — protein + carbs' },
      { t: '6:00 PM',  m: 'Dinner' },
    ],
  },
  [DAY_TYPES.HYBRID_LIFT_RUN]: {
    calOffset: 400, proteinMultiplier: 1.1, carbPercent: 0.50, fatPercent: 0.25,
    label: 'Hybrid Day',
    keyInsight: "Your highest calorie day. Eat intentionally.",
    reasoning: "Lifting AND running in one day demands significantly more fuel. Don't under-eat today.",
    preFuel:  'Large carb meal before. Snack between sessions.',
    postFuel: 'Full meal within 45 minutes.',
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
    preFuel:  null,
    postFuel: null,
    duringFuel: null,
    timing: 'Slightly less today. Protein stays high for recovery.',
    color: '#6B7280',
    timingSlots: [
      { t: 'Any time', m: 'Normal meals — protein focus, lower carbs' },
    ],
  },
  [DAY_TYPES.REST]: {
    calOffset: -250, proteinMultiplier: 1.0, carbPercent: 0.35, fatPercent: 0.35,
    label: 'Rest Day',
    keyInsight: 'Carbs down, protein stays the same.',
    reasoning: 'No training means lower energy needs. Reduce carbs — protein stays high for muscle repair.',
    preFuel:  null,
    postFuel: null,
    duringFuel: null,
    timing: 'Eat less today — especially carbs. Protein stays the same.',
    color: '#6B7280',
    timingSlots: [
      { t: 'Any time', m: 'Focus on protein — reduce carbs today' },
    ],
  },
};

export function getDayTypeNutrition(baseCals, bodyweightKg, dayType, profile = {}) {
  const adj = ADJUSTMENTS[dayType] || ADJUSTMENTS[DAY_TYPES.REST];
  const goal = profile.goal || 'Maintain';

  const baseProtein = Math.max(120, Math.round(bodyweightKg * 2.2 * adj.proteinMultiplier));
  const rawCalories = baseCals + adj.calOffset;
  const cappedCalories = applyGoalCap(rawCalories, baseCals, goal);
  const targetCalories = Math.max(1200, cappedCalories);

  const carbCalories = targetCalories * adj.carbPercent;
  const fatCalories  = targetCalories * adj.fatPercent;

  return {
    calories: targetCalories,
    protein:  baseProtein,
    carbs:    Math.round(carbCalories / 4),
    fat:      Math.round(fatCalories / 9),
    dayType,
    label:      adj.label,
    keyInsight: adj.keyInsight,
    reasoning:  adj.reasoning,
    preFuel:    adj.preFuel   || null,
    postFuel:   adj.postFuel  || null,
    duringFuel: adj.duringFuel || null,
    timing:     adj.timing,
    color:      adj.color,
    timingSlots: adj.timingSlots || [],
  };
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
