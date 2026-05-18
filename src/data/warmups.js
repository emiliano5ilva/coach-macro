export const WARMUP_PROTOCOLS = {

  // ── PUSH ─────────────────────────────────────────────────────────────────────

  push_beginner: {
    duration: 8,
    exercises: [
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Big slow circles forward then back', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 2, reps: '15', notes: 'Squeeze shoulder blades together at the back', type: 'activation' },
      { name: 'Wall Chest Stretch', sets: 1, reps: '30 sec each side', notes: 'Press chest open against the wall', type: 'mobility' },
      { name: 'Light Bench Press', sets: 2, reps: '15', notes: 'Empty bar or very light — just moving the pattern', type: 'ramp' },
    ],
  },

  push_intermediate: {
    duration: 10,
    exercises: [
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Big slow circles forward then back', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 3, reps: '15', notes: 'Retract scapula fully at the back', type: 'activation' },
      { name: 'Wall Chest Stretch', sets: 1, reps: '30 sec each side', notes: 'Hold and breathe into the stretch', type: 'mobility' },
      { name: 'Light Bench Press', sets: 2, reps: '15', notes: '40% of working weight — feel the groove', type: 'ramp' },
      { name: 'Light Overhead Press', sets: 2, reps: '12', notes: '40% — prime the shoulders', type: 'ramp' },
    ],
  },

  push_advanced: {
    duration: 12,
    exercises: [
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Full range, controlled', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 3, reps: '20', notes: 'Retract scapula — hold 1 sec at back', type: 'activation' },
      { name: 'Face Pull', sets: 2, reps: '15', notes: 'Light — external rotation to prime rear delt', type: 'activation' },
      { name: 'Wall Chest Stretch', sets: 1, reps: '30 sec each side', notes: 'Relax into the stretch', type: 'mobility' },
      { name: 'Light Bench Press', sets: 3, reps: '10 / 8 / 6', notes: '50% / 65% / 75% — pyramid up to working weight', type: 'ramp' },
    ],
  },

  // ── PULL ─────────────────────────────────────────────────────────────────────

  pull_beginner: {
    duration: 7,
    exercises: [
      { name: 'Shoulder Rollout', sets: 2, reps: '10 each way', notes: 'Roll shoulders forward then backward slowly', type: 'mobility' },
      { name: 'Dead Hang', sets: 2, reps: '20 sec', notes: 'Passive hang — decompress the spine', type: 'mobility' },
      { name: 'Light Lat Pulldown', sets: 2, reps: '15', notes: 'Very light — feel lats engage', type: 'ramp' },
    ],
  },

  pull_intermediate: {
    duration: 9,
    exercises: [
      { name: 'Shoulder Rollout', sets: 2, reps: '10 each way', notes: 'Roll shoulders forward then backward slowly', type: 'mobility' },
      { name: 'Dead Hang', sets: 2, reps: '30 sec', notes: 'Passive hang — feel lats stretch', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 2, reps: '15', notes: 'Rear delt activation before rowing', type: 'activation' },
      { name: 'Light Barbell Row', sets: 2, reps: '15', notes: '40% — prime the hinge pattern', type: 'ramp' },
    ],
  },

  pull_advanced: {
    duration: 12,
    exercises: [
      { name: 'Shoulder Rollout', sets: 2, reps: '10 each way', notes: 'Full range, controlled', type: 'mobility' },
      { name: 'Dead Hang', sets: 3, reps: '30 sec', notes: 'Passive then active — engage lats on last set', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 3, reps: '20', notes: 'Hold 1 sec at back — rear delt activation', type: 'activation' },
      { name: 'Light Barbell Row', sets: 3, reps: '12 / 10 / 8', notes: '50% / 65% / 75% — ramp to working weight', type: 'ramp' },
    ],
  },

  // ── LEGS ─────────────────────────────────────────────────────────────────────

  legs_beginner: {
    duration: 8,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Hands on hips, big slow circles', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '12 each leg', notes: 'Forward and back, holding wall for balance', type: 'mobility' },
      { name: 'Bodyweight Squat', sets: 2, reps: '15', notes: 'Slow descent — 3 seconds down', type: 'activation' },
      { name: 'Light Goblet Squat', sets: 2, reps: '12', notes: 'Light dumbbell — open the hips', type: 'ramp' },
    ],
  },

  legs_intermediate: {
    duration: 10,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Big controlled circles', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '12 each leg', notes: 'Forward/back then lateral', type: 'mobility' },
      { name: 'Glute Bridge', sets: 2, reps: '15', notes: 'Squeeze hard at the top — wake the glutes', type: 'activation' },
      { name: 'Light Goblet Squat', sets: 2, reps: '12', notes: 'Pause at bottom — open hips', type: 'ramp' },
      { name: 'Light Barbell Squat', sets: 2, reps: '10', notes: '40-50% — groove the pattern before loading', type: 'ramp' },
    ],
  },

  legs_advanced: {
    duration: 14,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Full range, controlled tempo', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '15 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Glute Bridge', sets: 3, reps: '15', notes: 'Hold 2 sec at top — maximum glute activation', type: 'activation' },
      { name: 'Walking Lunge', sets: 2, reps: '10 each leg', notes: 'Bodyweight — prime hip flexors and quads', type: 'activation' },
      { name: 'Light Barbell Squat', sets: 3, reps: '10 / 8 / 5', notes: '50% / 65% / 75% — pyramid to working weight', type: 'ramp' },
    ],
  },

  // ── UPPER ────────────────────────────────────────────────────────────────────

  upper_beginner: {
    duration: 8,
    exercises: [
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Forward then backward', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 2, reps: '15', notes: 'Activate the rear delts', type: 'activation' },
      { name: 'Dead Hang', sets: 2, reps: '20 sec', notes: 'Decompress and stretch lats', type: 'mobility' },
      { name: 'Light Bench Press', sets: 2, reps: '12', notes: 'Empty bar — prime the push pattern', type: 'ramp' },
    ],
  },

  upper_intermediate: {
    duration: 10,
    exercises: [
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Full range, controlled', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 3, reps: '15', notes: 'Retract scapula fully', type: 'activation' },
      { name: 'Dead Hang', sets: 2, reps: '25 sec', notes: 'Passive hang — stretch lats', type: 'mobility' },
      { name: 'Light Bench Press', sets: 2, reps: '12', notes: '40% — prime push pattern', type: 'ramp' },
      { name: 'Light Barbell Row', sets: 2, reps: '12', notes: '40% — prime pull pattern', type: 'ramp' },
    ],
  },

  upper_advanced: {
    duration: 12,
    exercises: [
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Full range both directions', type: 'mobility' },
      { name: 'Band Pull-Apart', sets: 3, reps: '20', notes: 'Hold 1 sec at back', type: 'activation' },
      { name: 'Face Pull', sets: 2, reps: '15', notes: 'Light — external rotation activation', type: 'activation' },
      { name: 'Dead Hang', sets: 2, reps: '30 sec', notes: 'Passive then active on final set', type: 'mobility' },
      { name: 'Light Bench Press', sets: 2, reps: '12 / 8', notes: '50% / 65% — ramp up', type: 'ramp' },
    ],
  },

  // ── LOWER ────────────────────────────────────────────────────────────────────

  lower_beginner: {
    duration: 8,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Hands on hips, controlled', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '12 each leg', notes: 'Forward and back', type: 'mobility' },
      { name: 'Glute Bridge', sets: 2, reps: '15', notes: 'Squeeze at top', type: 'activation' },
      { name: 'Bodyweight Squat', sets: 2, reps: '15', notes: 'Slow descent — 3 sec down', type: 'ramp' },
    ],
  },

  lower_intermediate: {
    duration: 10,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Big controlled circles', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '12 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Glute Bridge', sets: 3, reps: '15', notes: 'Pause 2 sec at top', type: 'activation' },
      { name: 'Light Romanian Deadlift', sets: 2, reps: '12', notes: '40% — prime the hamstring hinge', type: 'ramp' },
    ],
  },

  lower_advanced: {
    duration: 12,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Full range', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '15 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Glute Bridge', sets: 3, reps: '15', notes: 'Hold 2 sec — max glute activation', type: 'activation' },
      { name: 'Walking Lunge', sets: 2, reps: '10 each leg', notes: 'Bodyweight — prime hip flexors', type: 'activation' },
      { name: 'Light Romanian Deadlift', sets: 3, reps: '10 / 8 / 6', notes: '50% / 65% / 75% — pyramid up', type: 'ramp' },
    ],
  },

  // ── RUN ──────────────────────────────────────────────────────────────────────

  run_beginner: {
    duration: 5,
    exercises: [
      { name: 'Leg Swing', sets: 1, reps: '10 each leg', notes: 'Forward and back, hold wall', type: 'mobility' },
      { name: 'Hip Flexor Stretch', sets: 1, reps: '30 sec each side', notes: 'Lunge position, push hips forward', type: 'mobility' },
      { name: 'Easy Jog', sets: 1, reps: '3 min', notes: 'Very easy pace — just wake the legs up', type: 'ramp' },
    ],
  },

  run_intermediate: {
    duration: 8,
    exercises: [
      { name: 'Leg Swing', sets: 1, reps: '12 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Hip Flexor Stretch', sets: 1, reps: '30 sec each side', notes: 'Deep lunge, push hips through', type: 'mobility' },
      { name: 'Glute Activation', sets: 2, reps: '15', notes: 'Clamshells or glute bridge — fire the glutes', type: 'activation' },
      { name: 'Easy Jog', sets: 1, reps: '4 min', notes: 'Zone 1 — conversational pace', type: 'ramp' },
      { name: 'Strides', sets: 4, reps: '20 sec', notes: 'Build to 85% effort — full recovery between', type: 'ramp' },
    ],
  },

  run_advanced: {
    duration: 10,
    exercises: [
      { name: 'Leg Swing', sets: 2, reps: '12 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Hip Flexor Stretch', sets: 1, reps: '40 sec each side', notes: 'Hold and breathe into the stretch', type: 'mobility' },
      { name: 'Glute Activation', sets: 2, reps: '20', notes: 'Clamshells — fire the glutes before loading', type: 'activation' },
      { name: 'Easy Jog', sets: 1, reps: '5 min', notes: 'Build gradually from walk to easy jog', type: 'ramp' },
      { name: 'Strides', sets: 6, reps: '20 sec', notes: 'Build to 90% effort — full 60 sec recovery', type: 'ramp' },
    ],
  },

  // ── HYROX / WOD ──────────────────────────────────────────────────────────────

  hyrox_beginner: {
    duration: 10,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Big controlled circles', type: 'mobility' },
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Full range both directions', type: 'mobility' },
      { name: 'Easy Jog', sets: 1, reps: '3 min', notes: 'Easy pace to elevate heart rate', type: 'ramp' },
      { name: 'Bodyweight Squat', sets: 2, reps: '15', notes: 'Prime the squat pattern', type: 'activation' },
      { name: 'Light SkiErg', sets: 2, reps: '20 strokes', notes: 'Easy pull — prime lats and core', type: 'ramp' },
    ],
  },

  hyrox_intermediate: {
    duration: 12,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Full range, controlled', type: 'mobility' },
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Full range both directions', type: 'mobility' },
      { name: 'Leg Swing', sets: 1, reps: '12 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Easy Jog', sets: 1, reps: '4 min', notes: 'Build to comfortable aerobic pace', type: 'ramp' },
      { name: 'Glute Bridge', sets: 2, reps: '15', notes: 'Activate glutes before sled work', type: 'activation' },
      { name: 'Light SkiErg', sets: 2, reps: '30 strokes', notes: 'Build to 70% effort on last set', type: 'ramp' },
    ],
  },

  hyrox_advanced: {
    duration: 15,
    exercises: [
      { name: 'Hip Circle', sets: 2, reps: '10 each way', notes: 'Full range', type: 'mobility' },
      { name: 'Arm Circle', sets: 2, reps: '10 each way', notes: 'Full range both directions', type: 'mobility' },
      { name: 'Leg Swing', sets: 2, reps: '15 each leg', notes: 'Forward/back and lateral', type: 'mobility' },
      { name: 'Glute Bridge', sets: 3, reps: '15', notes: 'Pause 2 sec at top', type: 'activation' },
      { name: 'Band Pull-Apart', sets: 2, reps: '20', notes: 'Prime rear delts and scapula', type: 'activation' },
      { name: 'Easy Jog', sets: 1, reps: '5 min', notes: 'Build to aerobic pace', type: 'ramp' },
      { name: 'Light SkiErg', sets: 3, reps: '20 / 20 / 20', notes: '60% / 70% / 80% — ramp intensity', type: 'ramp' },
    ],
  },

};

export function getWarmupProtocol(sessionType, skillLevel) {
  const type = (sessionType || 'push').toLowerCase().replace(/[^a-z]/g, '');
  const level = (skillLevel || 'beginner').toLowerCase();

  const typeMap = {
    push: 'push', pull: 'pull', legs: 'legs',
    upper: 'upper', lower: 'lower',
    run: 'run', running: 'run', cardio: 'run',
    hyrox: 'hyrox', wod: 'hyrox', workout: 'hyrox',
  };

  const mappedType = typeMap[type] || 'push';
  const key = `${mappedType}_${level}`;
  return WARMUP_PROTOCOLS[key] || WARMUP_PROTOCOLS[`${mappedType}_beginner`] || null;
}
