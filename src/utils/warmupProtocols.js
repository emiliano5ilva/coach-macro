export const GENERAL_WARMUP = {
  duration: '3-5 minutes',
  instructions: 'Choose one:',
  options: [
    { name: 'Cardio machine', detail: 'Bike, row, or treadmill at easy pace', duration: '3-5 min' },
    { name: 'Jump rope',      detail: 'Easy pace — not for time',             duration: '3 min'   },
    { name: 'Brisk walk',    detail: 'Walk to the gym counts',               duration: '5 min'   },
  ],
  coachNote: 'Raise your heart rate and break a light sweat before touching any weights. Cold muscles tear.',
};

export const MOVEMENT_PREP = {
  lower_body: [
    { name: 'Hip Circle',                sets: '10 each direction', reps: null,   detail: 'Hands on hips. Large circles with your hips. Loosen the hip joint.',                                                          duration: 30 },
    { name: 'Leg Swing (forward/back)',  sets: '10 each leg',       reps: null,   detail: 'Hold wall for balance. Swing leg forward and back loosely.',                                                                   duration: 30 },
    { name: 'Leg Swing (side to side)', sets: '10 each leg',       reps: null,   detail: 'Face wall. Swing leg across body and out to side.',                                                                            duration: 30 },
    { name: 'Bodyweight Squat',         sets: '2 sets',            reps: 10,     detail: 'Full depth. Pause at bottom for 1 second. Wake up the pattern.',                                                              duration: 45 },
    { name: 'Glute Bridge',             sets: '1 set',             reps: 15,     detail: 'Squeeze hard at top. Activate glutes before loading them.',                                                                    duration: 30 },
    { name: 'World Greatest Stretch',   sets: '5 each side',       reps: null,   detail: 'Lunge forward. Rotate elbow to floor. Rotate to sky. Best single warm-up movement.',                                          duration: 60 },
  ],
  upper_push: [
    { name: 'Arm Circle',         sets: '10 each direction', reps: null,   detail: 'Small to large circles. Forward then backward.',                                                                         duration: 30 },
    { name: 'Band Pull Apart',    sets: '2 sets',            reps: 15,     detail: 'Use light band or no band. Activates rear delts and prepares shoulder for pressing.',                                     duration: 30 },
    { name: 'Wall Slide',         sets: '2 sets',            reps: 10,     detail: 'Back flat against wall. Slide arms up overhead keeping contact. Shoulder health essential.',                              duration: 30 },
    { name: 'Push Up',            sets: '2 sets',            reps: '5-8',  detail: 'Slow and controlled. Not for reps — for blood flow and movement pattern.',                                               duration: 30 },
    { name: 'Scapular Push Up',   sets: '1 set',             reps: 10,     detail: 'Plank position. Push shoulder blades apart and together without bending elbows.',                                        duration: 20 },
  ],
  upper_pull: [
    { name: 'Arm Circle',         sets: '10 each direction', reps: null,   detail: 'Loosen the shoulder joint.',                                                                                            duration: 30 },
    { name: 'Band Pull Apart',    sets: '2 sets',            reps: 20,     detail: 'Higher reps than push day. Rear delts and rotator cuff prep for heavy pulling.',                                        duration: 30 },
    { name: 'Dead Hang',          sets: '2 sets',            reps: null,   detail: 'Hang from pull up bar for 20-30 seconds. Decompresses spine and activates lats.',                                       duration: 40, requiresEquipment: 'pull_up_bar' },
    { name: 'Scapular Pull Up',   sets: '2 sets',            reps: 8,      detail: 'Hang from bar. Depress shoulder blades without bending elbows. Lat activation.',                                       duration: 30, requiresEquipment: 'pull_up_bar' },
    { name: 'Face Pull (light)',  sets: '2 sets',            reps: 15,     detail: 'Very light. Shoulder external rotation warm up.',                                                                       duration: 30, requiresEquipment: 'cable_machine' },
  ],
  full_body: [
    { name: 'World Greatest Stretch', sets: '5 each side',       reps: null, detail: 'The best single warm-up movement for full body days.',                                                                duration: 60 },
    { name: 'Hip Circle',             sets: '10 each direction', reps: null, detail: 'Loosen hips for squatting and hinging.',                                                                               duration: 30 },
    { name: 'Band Pull Apart',        sets: '2 sets',            reps: 15,   detail: 'Shoulder prep for pressing.',                                                                                          duration: 30 },
    { name: 'Bodyweight Squat',       sets: '2 sets',            reps: 10,   detail: 'Full depth. Wake up the movement pattern.',                                                                            duration: 30 },
  ],
  running: [
    { name: 'Leg Swing (forward/back)',  sets: '10 each leg',              reps: null, detail: 'Hip flexor and hamstring prep for running.',                                                                duration: 30 },
    { name: 'Leg Swing (side to side)', sets: '10 each leg',              reps: null, detail: 'Hip abductor activation.',                                                                                   duration: 30 },
    { name: 'Ankle Circle',             sets: '10 each direction per foot',reps: null, detail: 'Loosen ankles before impact.',                                                                               duration: 20 },
    { name: 'Calf Raise',               sets: '2 sets',                    reps: 15,   detail: 'Slow and controlled. Calf and Achilles prep — most common running injury site.',                             duration: 30 },
    { name: 'High Knees (slow)',        sets: '20 steps',                  reps: null, detail: 'Not for speed. Hip flexor activation and running mechanics rehearsal.',                                      duration: 20 },
    { name: 'Butt Kicks (slow)',        sets: '20 steps',                  reps: null, detail: 'Hamstring activation. Slow and controlled.',                                                                 duration: 20 },
    { name: 'Easy Walk/Jog',            sets: null,                        reps: null, detail: '3-5 minutes very easy before starting the workout. Never start cold on intervals or tempo.',                 duration: 300 },
  ],
  hyrox: [
    { name: 'Rowing Machine (easy)',      sets: null,              reps: null, detail: '3 minutes easy. Warms up the full body pattern used in Hyrox.',               duration: 180, requiresEquipment: 'rowing_machine' },
    { name: 'Leg Swing',                  sets: '10 each per leg', reps: null, detail: 'Hip prep for sled and lunges.',                                                duration: 40 },
    { name: 'Banded Hip Activation',      sets: '2 sets',          reps: 15,   detail: 'Clamshells or lateral walks. Glute activation for sled work.',                 duration: 40 },
    { name: 'Wall Ball Practice (light)', sets: '2 sets',          reps: 10,   detail: 'Light ball or no ball. Practice the movement pattern.',                         duration: 30 },
    { name: 'Burpee (slow)',              sets: '1 set',           reps: 5,    detail: 'Very slow. Full range. Wake up the full body.',                                 duration: 30 },
  ],
};

export const LIFT_WARMUP_SETS = {
  'Barbell Squat': w => [
    { weight: 45,                              reps: 8, note: 'Empty bar — perfect form only' },
    { weight: Math.round(w * 0.40 / 5) * 5,  reps: 6, note: '40% — feel the movement' },
    { weight: Math.round(w * 0.60 / 5) * 5,  reps: 4, note: '60% — build confidence' },
    { weight: Math.round(w * 0.80 / 5) * 5,  reps: 2, note: '80% — one breath per rep' },
  ],
  'Deadlift': w => [
    { weight: Math.round(w * 0.35 / 5) * 5,  reps: 5, note: 'Light — feel the hinge pattern' },
    { weight: Math.round(w * 0.55 / 5) * 5,  reps: 3, note: '55% — brace and pull' },
    { weight: Math.round(w * 0.75 / 5) * 5,  reps: 2, note: '75% — setup exactly as working sets' },
  ],
  'Barbell Bench Press': w => [
    { weight: 45,                              reps: 10, note: 'Empty bar — feel the path' },
    { weight: Math.round(w * 0.40 / 5) * 5,  reps: 8,  note: '40% — pause at bottom' },
    { weight: Math.round(w * 0.60 / 5) * 5,  reps: 5,  note: '60% — drive feet into floor' },
    { weight: Math.round(w * 0.80 / 5) * 5,  reps: 2,  note: '80% — treat like a working set' },
  ],
  'Overhead Press': w => [
    { weight: 45,                              reps: 8, note: 'Empty bar — shoulder path' },
    { weight: Math.round(w * 0.45 / 5) * 5,  reps: 6, note: '45% — brace your core' },
    { weight: Math.round(w * 0.65 / 5) * 5,  reps: 3, note: '65% — drive the bar straight up' },
  ],
  'Barbell Row': w => [
    { weight: 45,                              reps: 10, note: 'Empty bar — hip hinge and pull' },
    { weight: Math.round(w * 0.50 / 5) * 5,  reps: 6,  note: '50% — elbows back and down' },
    { weight: Math.round(w * 0.70 / 5) * 5,  reps: 3,  note: '70% — squeeze shoulder blades' },
  ],
  'Hip Thrust': w => [
    { weight: 0,                              reps: 12, note: 'Bodyweight — activate the glutes first' },
    { weight: Math.round(w * 0.50 / 5) * 5, reps: 8,  note: '50% — full hip extension' },
    { weight: Math.round(w * 0.75 / 5) * 5, reps: 4,  note: '75% — squeeze hard at top' },
  ],
};

const LOWER_PRIMARY = ['Barbell Squat','Deadlift','Hip Thrust','Leg Press','Romanian Deadlift','Bulgarian Split Squat','Hack Squat'];
const PUSH_PRIMARY  = ['Barbell Bench Press','Overhead Press','Incline Dumbbell Press','Dumbbell Bench Press'];
const PULL_PRIMARY  = ['Pull Up','Lat Pulldown','Barbell Row','Seated Cable Row'];

export function getWarmupForWorkout(workout, profile, equipment) {
  const exercises = workout?.exercises || [];
  const names = exercises.map(e => e.name || '');

  const hasLower = names.some(n => LOWER_PRIMARY.includes(n));
  const hasPush  = names.some(n => PUSH_PRIMARY.includes(n));
  const hasPull  = names.some(n => PULL_PRIMARY.includes(n));
  const isPush   = hasPush && !hasPull;
  const isPull   = hasPull && !hasPush;

  let movementPrep;
  if (hasLower && (hasPush || hasPull))   movementPrep = MOVEMENT_PREP.full_body;
  else if (hasLower)                       movementPrep = MOVEMENT_PREP.lower_body;
  else if (isPush)                         movementPrep = MOVEMENT_PREP.upper_push;
  else if (isPull)                         movementPrep = MOVEMENT_PREP.upper_pull;
  else                                     movementPrep = MOVEMENT_PREP.full_body;

  const eq = (equipment || 'Full Gym').toLowerCase();
  movementPrep = movementPrep.filter(m => {
    if (!m.requiresEquipment) return true;
    if (m.requiresEquipment === 'pull_up_bar')   return eq !== 'bodyweight only' || profile?.hasPullUpBar;
    if (m.requiresEquipment === 'cable_machine') return eq.includes('full') || eq.includes('barbell');
    if (m.requiresEquipment === 'rowing_machine') return eq.includes('full');
    return true;
  });

  const liftWarmups = {};
  exercises.forEach(ex => {
    if (LIFT_WARMUP_SETS[ex.name]) {
      const w = parseFloat(ex.sets?.[0]?.weight) || parseFloat(ex.weight) || 135;
      if (w >= 45) liftWarmups[ex.name] = LIFT_WARMUP_SETS[ex.name](w);
    }
  });

  return {
    general: GENERAL_WARMUP,
    movementPrep,
    liftWarmups,
    totalDuration: _calcDuration(movementPrep, liftWarmups),
  };
}

export function getRunningWarmup(runType) {
  const base = MOVEMENT_PREP.running;
  if (runType === 'easy') {
    return {
      general: { duration: '2-3 minutes', instructions: 'Easy walk to start your run.', coachNote: 'Easy runs need minimal warm up. Just start slow.' },
      movementPrep: base.slice(0, 3),
      liftWarmups: {},
      totalDuration: 5,
    };
  }
  if (runType === 'tempo' || runType === 'interval') {
    return {
      general: { duration: '5-10 minutes', instructions: 'Easy jog before hard running.', coachNote: 'Never start a tempo or interval session cold. 10 min easy jog minimum. Your first interval should feel almost too easy.' },
      movementPrep: base,
      liftWarmups: {},
      strides: { included: true, count: 4, detail: '4 × 20-second strides at goal race pace. Full recovery between. Do these after movement prep and easy jog but before the main workout.' },
      totalDuration: 15,
    };
  }
  if (runType === 'long_run') {
    return {
      general: { duration: '5 minutes', instructions: 'Walk then easy jog.', coachNote: 'Start your long run very easy. First mile should feel embarrassingly slow. You have a long way to go.' },
      movementPrep: base.slice(0, 5),
      liftWarmups: {},
      totalDuration: 10,
    };
  }
  return { general: GENERAL_WARMUP, movementPrep: base, liftWarmups: {}, totalDuration: 10 };
}

export const COOL_DOWN = {
  strength: [
    { name: 'Easy walk',             duration: '2-3 minutes', detail: 'Bring your heart rate down gradually. Never just stop.' },
    { name: 'Hip flexor stretch',    duration: '30 sec each side', detail: 'Kneeling lunge. Drive hip forward. Essential after squats and deadlifts.' },
    { name: 'Hamstring stretch',     duration: '30 sec each side', detail: 'Seated or lying. Never bounce. Breathe into the stretch.' },
    { name: 'Chest/shoulder stretch',duration: '30 sec each side', detail: 'Doorway or arm-across-chest. Counters all that pressing.' },
    { name: 'Deep breathing',        duration: '1 minute',         detail: 'Slow diaphragmatic breathing. Activates parasympathetic recovery.' },
  ],
  running: [
    { name: 'Easy jog → walk',       duration: '5-10 minutes',    detail: 'Never stop running suddenly. Walk the last 5-10 minutes of your run. Always.' },
    { name: 'Calf stretch',          duration: '60 sec each side', detail: 'Most important for runners. Against a wall. Bent and straight knee variants.' },
    { name: 'Hip flexor stretch',    duration: '45 sec each side', detail: 'Running tightens hip flexors. This undoes that.' },
    { name: 'Hamstring stretch',     duration: '45 sec each side', detail: 'Seated or lying. Hold and breathe.' },
    { name: 'Quad stretch',          duration: '30 sec each side', detail: 'Standing or lying on side.' },
  ],
};

function _calcDuration(movementPrep, liftWarmups) {
  const moveSecs = (movementPrep || []).reduce((s, m) => s + (m.duration || 30), 0);
  const liftSecs = Object.values(liftWarmups || {}).reduce((s, sets) => s + sets.length * 90, 0);
  return Math.round((moveSecs + liftSecs + 300) / 60);
}
