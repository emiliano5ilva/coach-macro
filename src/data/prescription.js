const COMPOUND_EXERCISES = new Set([
  'Squat','Back Squat','Front Squat','Goblet Squat','Bulgarian Split Squat',
  'Deadlift','Romanian Deadlift','Sumo Deadlift','Trap Bar Deadlift',
  'Bench Press','Incline Bench Press','Decline Bench Press',
  'Overhead Press','Push Press','Military Press',
  'Pull-Up','Chin-Up','Lat Pulldown','Seated Cable Row','Bent Over Row','Barbell Row','T-Bar Row',
  'Hip Thrust','Glute Bridge',
  'Lunge','Walking Lunge','Reverse Lunge',
  'Dip','Push-Up',
  'Power Clean','Hang Clean','Clean and Jerk','Snatch',
  'Leg Press','Hack Squat',
  'Incline Dumbbell Press','Dumbbell Bench Press','Dumbbell Row',
  'Arnold Press','Dumbbell Shoulder Press',
]);

// {sets, reps (display string), restSeconds, rpe (optional note)}
const PRESCRIPTION = {
  build_muscle: {
    compound: {
      beginner:      { sets:3, reps:'8–12', restSeconds:90,  rpe:'RPE 7–8' },
      intermediate:  { sets:4, reps:'8–12', restSeconds:90,  rpe:'RPE 7–8' },
      advanced:      { sets:4, reps:'6–10', restSeconds:120, rpe:'RPE 8–9' },
    },
    isolation: {
      beginner:      { sets:3, reps:'12–15', restSeconds:60, rpe:'RPE 7' },
      intermediate:  { sets:3, reps:'10–15', restSeconds:60, rpe:'RPE 7–8' },
      advanced:      { sets:4, reps:'10–15', restSeconds:75, rpe:'RPE 8' },
    },
  },
  get_stronger: {
    compound: {
      beginner:      { sets:3, reps:'5',   restSeconds:180, rpe:'RPE 7–8' },
      intermediate:  { sets:4, reps:'3–5', restSeconds:240, rpe:'RPE 8–9' },
      advanced:      { sets:5, reps:'1–3', restSeconds:300, rpe:'RPE 9+'  },
    },
    isolation: {
      beginner:      { sets:3, reps:'8–10', restSeconds:90,  rpe:'RPE 7' },
      intermediate:  { sets:3, reps:'6–10', restSeconds:90,  rpe:'RPE 8' },
      advanced:      { sets:4, reps:'6–8',  restSeconds:120, rpe:'RPE 8' },
    },
  },
  lose_fat: {
    compound: {
      beginner:      { sets:3, reps:'12–15', restSeconds:45, rpe:'RPE 7' },
      intermediate:  { sets:3, reps:'10–15', restSeconds:45, rpe:'RPE 7–8' },
      advanced:      { sets:4, reps:'10–15', restSeconds:45, rpe:'RPE 8'  },
    },
    isolation: {
      beginner:      { sets:3, reps:'15–20', restSeconds:30, rpe:'RPE 7' },
      intermediate:  { sets:3, reps:'15–20', restSeconds:30, rpe:'RPE 7' },
      advanced:      { sets:4, reps:'15–20', restSeconds:30, rpe:'RPE 8' },
    },
  },
  recomp: {
    compound: {
      beginner:      { sets:3, reps:'8–12', restSeconds:75,  rpe:'RPE 7–8' },
      intermediate:  { sets:4, reps:'8–12', restSeconds:75,  rpe:'RPE 7–8' },
      advanced:      { sets:4, reps:'6–12', restSeconds:90,  rpe:'RPE 8'   },
    },
    isolation: {
      beginner:      { sets:3, reps:'12–15', restSeconds:60, rpe:'RPE 7' },
      intermediate:  { sets:3, reps:'12–15', restSeconds:60, rpe:'RPE 7–8' },
      advanced:      { sets:4, reps:'10–15', restSeconds:60, rpe:'RPE 8'   },
    },
  },
  train_for_race: {
    compound: {
      beginner:      { sets:2, reps:'10–12', restSeconds:75,  rpe:'RPE 6–7' },
      intermediate:  { sets:3, reps:'8–10',  restSeconds:90,  rpe:'RPE 7'   },
      advanced:      { sets:3, reps:'6–8',   restSeconds:120, rpe:'RPE 7–8' },
    },
    isolation: {
      beginner:      { sets:2, reps:'12–15', restSeconds:45, rpe:'RPE 6' },
      intermediate:  { sets:3, reps:'12–15', restSeconds:60, rpe:'RPE 7' },
      advanced:      { sets:3, reps:'10–12', restSeconds:60, rpe:'RPE 7' },
    },
  },
  get_faster: {
    compound: {
      beginner:      { sets:3, reps:'5–6',  restSeconds:180, rpe:'RPE 7–8' },
      intermediate:  { sets:4, reps:'3–5',  restSeconds:180, rpe:'RPE 8'   },
      advanced:      { sets:4, reps:'2–4',  restSeconds:240, rpe:'RPE 8–9' },
    },
    isolation: {
      beginner:      { sets:3, reps:'8–12', restSeconds:90,  rpe:'RPE 7' },
      intermediate:  { sets:3, reps:'6–10', restSeconds:90,  rpe:'RPE 7–8' },
      advanced:      { sets:4, reps:'6–8',  restSeconds:120, rpe:'RPE 8'   },
    },
  },
};

const PROGRESSION = {
  build_muscle:   { compound: 2.5, isolation: 1.25 },
  get_stronger:   { compound: 5,   isolation: 2.5  },
  lose_fat:       { compound: 2.5, isolation: 1.25 },
  recomp:         { compound: 2.5, isolation: 1.25 },
  train_for_race: { compound: 2.5, isolation: 1.25 },
  get_faster:     { compound: 5,   isolation: 2.5  },
};

const GOAL_LABELS = {
  build_muscle:   'HYPERTROPHY',
  get_stronger:   'STRENGTH',
  lose_fat:       'FAT LOSS',
  recomp:         'RECOMP',
  train_for_race: 'ENDURANCE',
  get_faster:     'POWER',
};

const GOAL_CONTEXT = {
  build_muscle:   'Controlled tempo · Full range of motion',
  get_stronger:   'Max effort · Long rest between sets',
  lose_fat:       'Short rest · Keep moving',
  recomp:         'Moderate intensity · Progressive overload',
  train_for_race: 'Functional strength · Aerobic capacity',
  get_faster:     'Explosive reps · Power output',
};

function isCompound(exerciseName) {
  return COMPOUND_EXERCISES.has(exerciseName);
}

export function getPrescription(goal, skillLevel, exerciseName) {
  const g = PRESCRIPTION[goal] || PRESCRIPTION.build_muscle;
  const type = isCompound(exerciseName) ? 'compound' : 'isolation';
  const level = ['beginner','intermediate','advanced'].includes(skillLevel) ? skillLevel : 'beginner';
  return { ...g[type][level], type };
}

export function getRestTime(goal, exerciseName) {
  const p = getPrescription(goal, 'intermediate', exerciseName || '');
  return p.restSeconds;
}

export function getProgressionAmount(goal, exerciseName) {
  const prog = PROGRESSION[goal] || PROGRESSION.build_muscle;
  const type = isCompound(exerciseName) ? 'compound' : 'isolation';
  return prog[type];
}

export function getGoalLabel(goal) {
  return GOAL_LABELS[goal] || 'TRAINING';
}

export function getGoalContext(goal) {
  return GOAL_CONTEXT[goal] || '';
}
