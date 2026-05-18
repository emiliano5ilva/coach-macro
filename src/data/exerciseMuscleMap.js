const MUSCLE_COLORS = {
  'Sternal Pec':         '#e8341c',
  'Clavicular Pec':      '#e8341c',
  'Anterior Delt':       '#FEA020',
  'Medial Delt':         '#FEA020',
  'Rear Delt':           '#FEA020',
  'Supraspinatus':       '#FEA020',
  'Long Head Tricep':    '#9C6FFF',
  'Lateral Head Tricep': '#9C6FFF',
  'Medial Head Tricep':  '#9C6FFF',
  'Long Head Bicep':     '#9C6FFF',
  'Short Head Bicep':    '#9C6FFF',
  'Brachialis':          '#9C6FFF',
  'Forearms':            '#9C6FFF',
  'Anconeus':            '#9C6FFF',
  'Lats':                '#60a5fa',
  'Upper Traps':         '#60a5fa',
  'Mid Traps':           '#60a5fa',
  'Lower Traps':         '#60a5fa',
  'Rhomboids':           '#60a5fa',
  'Teres Major':         '#60a5fa',
  'Serratus':            '#60a5fa',
  'Lower Back':          '#60a5fa',
  'Rectus Femoris':      '#22c55e',
  'Vastus Lateralis':    '#22c55e',
  'Vastus Medialis':     '#22c55e',
  'Vastus Intermedius':  '#22c55e',
  'Biceps Femoris':      '#22c55e',
  'Semitendinosus':      '#22c55e',
  'Semimembranosus':     '#22c55e',
  'Gluteus Maximus':     '#22c55e',
  'Gluteus Medius':      '#22c55e',
  'Gluteus Minimus':     '#22c55e',
  'Adductors':           '#22c55e',
  'Calves':              '#22c55e',
  'Hip Flexors':         '#14C4B3',
  'Core':                '#14C4B3',
  'Abs':                 '#14C4B3',
  'Obliques':            '#14C4B3',
};

export const EXERCISE_MUSCLE_MAP = {

  // ── CHEST ────────────────────────────
  'Barbell Bench Press': {
    primary: ['Sternal Pec', 'Anterior Delt'],
    secondary: ['Long Head Tricep', 'Lateral Head Tricep', 'Serratus'],
    note: 'Flat angle loads lower/sternal pec hardest',
  },
  'Incline Barbell Press': {
    primary: ['Clavicular Pec', 'Anterior Delt'],
    secondary: ['Long Head Tricep', 'Serratus'],
    note: 'Incline shifts emphasis to upper pec',
  },
  'Incline DB Press': {
    primary: ['Clavicular Pec', 'Anterior Delt'],
    secondary: ['Long Head Tricep', 'Serratus'],
    note: 'Incline shifts emphasis to upper pec',
  },
  'Decline Bench Press': {
    primary: ['Sternal Pec'],
    secondary: ['Lateral Head Tricep', 'Medial Head Tricep', 'Anterior Delt'],
    note: 'Decline maximises lower pec activation',
  },
  'DB Fly': {
    primary: ['Sternal Pec', 'Clavicular Pec'],
    secondary: ['Anterior Delt', 'Serratus'],
    note: 'Isolation — minimal tricep involvement',
  },
  'Cable Fly': {
    primary: ['Sternal Pec', 'Clavicular Pec'],
    secondary: ['Anterior Delt', 'Serratus'],
    note: 'Constant tension throughout range of motion',
  },
  'Cable Crossover': {
    primary: ['Sternal Pec'],
    secondary: ['Anterior Delt', 'Serratus'],
    note: 'High-to-low hits lower chest fibres',
  },
  'Push-Up': {
    primary: ['Sternal Pec', 'Anterior Delt'],
    secondary: ['Long Head Tricep', 'Lateral Head Tricep', 'Serratus', 'Core'],
    note: 'Serratus works hard to protract the scapula',
  },
  'Dips (Chest)': {
    primary: ['Sternal Pec', 'Clavicular Pec'],
    secondary: ['Long Head Tricep', 'Lateral Head Tricep', 'Anterior Delt'],
    note: 'Lean forward to maximise pec involvement',
  },

  // ── SHOULDERS ────────────────────────
  'Overhead Press': {
    primary: ['Anterior Delt', 'Medial Delt'],
    secondary: ['Long Head Tricep', 'Upper Traps', 'Serratus'],
    note: 'Long head loads because arm goes overhead',
  },
  'DB Shoulder Press': {
    primary: ['Anterior Delt', 'Medial Delt'],
    secondary: ['Long Head Tricep', 'Upper Traps', 'Serratus'],
    note: 'Greater range than barbell',
  },
  'Arnold Press': {
    primary: ['Anterior Delt', 'Medial Delt'],
    secondary: ['Long Head Tricep', 'Rear Delt', 'Upper Traps'],
    note: 'Rotation hits all three heads across the rep',
  },
  'Lateral Raise': {
    primary: ['Medial Delt'],
    secondary: ['Anterior Delt', 'Supraspinatus', 'Upper Traps'],
    note: 'Slight forward lean increases medial delt load',
  },
  'Cable Lateral Raise': {
    primary: ['Medial Delt'],
    secondary: ['Anterior Delt', 'Supraspinatus', 'Upper Traps'],
    note: 'Constant tension vs dumbbells',
  },
  'Face Pull': {
    primary: ['Rear Delt', 'Upper Traps'],
    secondary: ['Rhomboids', 'Short Head Bicep', 'Supraspinatus'],
    note: 'External rotation targets rear delt maximally',
  },
  'Reverse Fly': {
    primary: ['Rear Delt'],
    secondary: ['Mid Traps', 'Rhomboids'],
    note: 'Keep slight bend in elbows throughout',
  },
  'Front Raise': {
    primary: ['Anterior Delt', 'Clavicular Pec'],
    secondary: ['Medial Delt', 'Serratus'],
    note: 'Anterior delt dominant — already hit by pressing',
  },

  // ── BACK ─────────────────────────────
  'Pull-Up': {
    primary: ['Lats', 'Teres Major'],
    secondary: ['Long Head Bicep', 'Rear Delt', 'Lower Traps', 'Serratus'],
    note: 'Full dead hang maximises lat stretch',
  },
  'Weighted Pull-Up': {
    primary: ['Lats', 'Teres Major'],
    secondary: ['Long Head Bicep', 'Rear Delt', 'Lower Traps', 'Serratus'],
    note: 'Full dead hang maximises lat stretch',
  },
  'Chin-Up': {
    primary: ['Lats', 'Long Head Bicep'],
    secondary: ['Teres Major', 'Short Head Bicep', 'Lower Traps'],
    note: 'Supinated grip adds significant bicep load',
  },
  'Barbell Row': {
    primary: ['Lats', 'Mid Traps', 'Rhomboids'],
    secondary: ['Rear Delt', 'Long Head Bicep', 'Lower Back'],
    note: '45° torso angle hits mid-back and lats equally',
  },
  'DB Row': {
    primary: ['Lats', 'Teres Major'],
    secondary: ['Rear Delt', 'Long Head Bicep', 'Lower Traps'],
    note: 'Elbow close to body for more lat focus',
  },
  'Seated Cable Row': {
    primary: ['Mid Traps', 'Rhomboids', 'Lats'],
    secondary: ['Rear Delt', 'Long Head Bicep', 'Lower Traps'],
    note: 'Squeeze shoulder blades at the top',
  },
  'Lat Pulldown': {
    primary: ['Lats', 'Teres Major'],
    secondary: ['Long Head Bicep', 'Rear Delt', 'Lower Traps'],
    note: 'Lean back slightly to align with lat fibres',
  },
  'Deadlift': {
    primary: ['Gluteus Maximus', 'Biceps Femoris', 'Lower Back'],
    secondary: ['Semitendinosus', 'Lats', 'Vastus Lateralis', 'Upper Traps', 'Core'],
    note: 'Hinge at hips — keep bar close to shins',
  },
  'Romanian Deadlift': {
    primary: ['Biceps Femoris', 'Semitendinosus', 'Gluteus Maximus'],
    secondary: ['Lower Back', 'Adductors', 'Forearms'],
    note: 'Hip hinge — feel the stretch not the lower back',
  },
  'Good Morning': {
    primary: ['Biceps Femoris', 'Lower Back'],
    secondary: ['Semitendinosus', 'Gluteus Maximus'],
    note: 'Soft bend in knees throughout',
  },

  // ── ARMS ─────────────────────────────
  'Barbell Curl': {
    primary: ['Short Head Bicep', 'Long Head Bicep'],
    secondary: ['Brachialis', 'Forearms'],
    note: 'Supinated grip hits both heads equally',
  },
  'DB Curl': {
    primary: ['Long Head Bicep', 'Short Head Bicep'],
    secondary: ['Brachialis', 'Forearms'],
    note: 'Supinate at the top for peak contraction',
  },
  'Incline DB Curl': {
    primary: ['Long Head Bicep'],
    secondary: ['Short Head Bicep', 'Brachialis'],
    note: 'Incline fully stretches and loads the long head',
  },
  'Hammer Curl': {
    primary: ['Brachialis', 'Long Head Bicep'],
    secondary: ['Forearms', 'Short Head Bicep'],
    note: 'Neutral grip maximises brachialis activation',
  },
  'Preacher Curl': {
    primary: ['Short Head Bicep'],
    secondary: ['Long Head Bicep', 'Brachialis'],
    note: 'Arm position shortens long head — hits short head',
  },
  'Tricep Dips': {
    primary: ['Lateral Head Tricep', 'Medial Head Tricep'],
    secondary: ['Long Head Tricep', 'Anterior Delt', 'Sternal Pec'],
    note: 'Upright torso maximises tricep involvement',
  },
  'Tricep Pushdown': {
    primary: ['Lateral Head Tricep', 'Medial Head Tricep'],
    secondary: ['Anconeus', 'Forearms'],
    note: 'Arm at side — long head barely works here',
  },
  'Tricep Rope Pushdown': {
    primary: ['Lateral Head Tricep', 'Medial Head Tricep'],
    secondary: ['Anconeus', 'Forearms'],
    note: 'Spread rope at bottom for peak contraction',
  },
  'Overhead Tricep Extension': {
    primary: ['Long Head Tricep'],
    secondary: ['Lateral Head Tricep', 'Medial Head Tricep'],
    note: 'Overhead position fully stretches the long head',
  },
  'Skull Crusher': {
    primary: ['Long Head Tricep', 'Lateral Head Tricep'],
    secondary: ['Medial Head Tricep', 'Anconeus'],
    note: 'Let bar come to forehead for full long head stretch',
  },
  'Close Grip Bench': {
    primary: ['Medial Head Tricep', 'Long Head Tricep'],
    secondary: ['Lateral Head Tricep', 'Anterior Delt', 'Sternal Pec'],
    note: 'Close grip shifts load from pec to triceps',
  },

  // ── LEGS ─────────────────────────────
  'Barbell Back Squat': {
    primary: ['Rectus Femoris', 'Vastus Lateralis', 'Vastus Medialis', 'Gluteus Maximus'],
    secondary: ['Adductors', 'Core', 'Lower Back'],
    note: 'Hitting depth maximises glute and quad range',
  },
  'Front Squat': {
    primary: ['Rectus Femoris', 'Vastus Lateralis', 'Vastus Medialis'],
    secondary: ['Gluteus Maximus', 'Core', 'Upper Traps'],
    note: 'Upright torso shifts more load to quads',
  },
  'Leg Press': {
    primary: ['Rectus Femoris', 'Vastus Lateralis'],
    secondary: ['Vastus Medialis', 'Gluteus Maximus', 'Adductors'],
    note: 'High foot placement adds more glute activation',
  },
  'Leg Extension': {
    primary: ['Rectus Femoris', 'Vastus Medialis'],
    secondary: ['Vastus Lateralis', 'Vastus Intermedius'],
    note: 'Pure quad isolation — good for VMO detail work',
  },
  'Leg Curl': {
    primary: ['Biceps Femoris', 'Semitendinosus'],
    secondary: ['Semimembranosus', 'Calves'],
    note: 'Plantarflex feet to increase hamstring activation',
  },
  'Nordic Curl': {
    primary: ['Biceps Femoris', 'Semitendinosus'],
    secondary: ['Semimembranosus', 'Core'],
    note: 'Highest eccentric hamstring load of any exercise',
  },
  'Bulgarian Split Squat': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Vastus Medialis', 'Biceps Femoris', 'Hip Flexors'],
    note: 'Rear foot elevated increases hip flexor stretch',
  },
  'Walking Lunge': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Vastus Medialis', 'Biceps Femoris', 'Core'],
    note: 'Long stride loads glutes more than quads',
  },
  'Hip Thrust': {
    primary: ['Gluteus Maximus', 'Gluteus Medius'],
    secondary: ['Biceps Femoris', 'Adductors', 'Core'],
    note: 'Best exercise for glute max activation',
  },
  'Cable Kickback': {
    primary: ['Gluteus Maximus'],
    secondary: ['Biceps Femoris', 'Gluteus Medius'],
    note: 'Keep pelvis neutral throughout the movement',
  },
  'Abduction Machine': {
    primary: ['Gluteus Medius', 'Gluteus Minimus'],
    secondary: ['Tensor Fasciae Latae'],
    note: 'Controls hip stability and knee tracking',
  },
  'Standing Calf Raise': {
    primary: ['Calves'],
    secondary: ['Hip Flexors'],
    note: 'Full stretch at bottom — do not bounce',
  },
  'Seated Calf Raise': {
    primary: ['Calves'],
    secondary: [],
    note: 'Seated position isolates the soleus specifically',
  },

  // ── CORE ─────────────────────────────
  'Plank': {
    primary: ['Core', 'Abs'],
    secondary: ['Obliques', 'Hip Flexors', 'Serratus'],
    note: 'Posterior pelvic tilt to fully engage abs',
  },
  'Hanging Leg Raise': {
    primary: ['Abs', 'Hip Flexors'],
    secondary: ['Obliques', 'Serratus', 'Forearms'],
    note: 'Control the descent — avoid swinging',
  },
  'Ab Wheel Rollout': {
    primary: ['Abs', 'Core'],
    secondary: ['Obliques', 'Serratus', 'Lats'],
    note: 'Anti-extension demand is the primary stimulus',
  },
  'Cable Crunch': {
    primary: ['Abs', 'Obliques'],
    secondary: ['Hip Flexors', 'Core'],
    note: 'Flex the spine — do not pull with arms',
  },

  // ── HYROX ────────────────────────────
  'SkiErg': {
    primary: ['Lats', 'Core'],
    secondary: ['Anterior Delt', 'Long Head Tricep', 'Hip Flexors'],
    note: 'Full lat pull — hinge forward at waist',
  },
  'Sled Push': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Biceps Femoris', 'Calves', 'Core'],
    note: 'Drive from hips — keep low stable position',
  },
  'Sled Pull': {
    primary: ['Biceps Femoris', 'Gluteus Maximus'],
    secondary: ['Calves', 'Core', 'Long Head Bicep'],
    note: 'Hip hinge pattern — keep spine neutral',
  },
  'Burpee Broad Jump': {
    primary: ['Rectus Femoris', 'Sternal Pec'],
    secondary: ['Anterior Delt', 'Long Head Tricep', 'Gluteus Maximus', 'Core'],
    note: 'Full body power — explode on the jump',
  },
  'Box Jump': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Calves', 'Biceps Femoris', 'Core'],
    note: 'Land softly with knees tracking over toes',
  },
  'Farmers Carry': {
    primary: ['Forearms', 'Upper Traps'],
    secondary: ['Core', 'Gluteus Medius', 'Calves'],
    note: 'Grip and stability challenge throughout',
  },
  'Wall Ball': {
    primary: ['Rectus Femoris', 'Anterior Delt'],
    secondary: ['Gluteus Maximus', 'Core', 'Medial Delt'],
    note: 'Full squat depth before the throw',
  },
  'Sandbag Lunges': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Core', 'Biceps Femoris', 'Upper Traps'],
    note: 'Sandbag load challenges core stability more',
  },

  // ── RUNNING ──────────────────────────
  'Easy Run': {
    primary: ['Biceps Femoris', 'Gluteus Maximus'],
    secondary: ['Calves', 'Hip Flexors', 'Core'],
    note: 'Zone 2 — conversational pace throughout',
  },
  'Tempo Run': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Biceps Femoris', 'Calves', 'Core'],
    note: 'Comfortably hard — just below lactate threshold',
  },
  'Long Run': {
    primary: ['Biceps Femoris', 'Gluteus Maximus'],
    secondary: ['Calves', 'Core', 'Hip Flexors'],
    note: 'Aerobic base building — stay in Zone 2-3',
  },
  'Sprint Interval': {
    primary: ['Rectus Femoris', 'Gluteus Maximus'],
    secondary: ['Biceps Femoris', 'Calves', 'Hip Flexors', 'Core'],
    note: 'Max effort — full recovery between sets',
  },
};

export function getMuscleColor(muscle) {
  return MUSCLE_COLORS[muscle] || 'rgba(245,245,240,0.4)';
}

export function getExerciseData(exerciseName) {
  return EXERCISE_MUSCLE_MAP[exerciseName] || null;
}
