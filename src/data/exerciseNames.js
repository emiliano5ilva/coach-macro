// Tolerant exercise-name resolution helpers.
// stripSupersetLabel + EXERCISE_ALIASES are the two axes:
//   1. strip trailing parentheticals ("Pull Up (B2)" → "Pull Up")
//   2. map confirmed synonym/variant names to canonical keys

export function stripSupersetLabel(name) {
  return (name || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

// Confirmed variant → canonical key. Only pairs where the movement and
// primary muscles are identical. Do NOT use for equipment substitution
// (that belongs to EQUIPMENT_ALTERNATIVES).
export const EXERCISE_ALIASES = {
  // ── seeded pairs ────────────────────────────────────────────────────────
  'Back Squat':                 'Barbell Back Squat',
  'Bench Press':                'Barbell Bench Press',
  'Barbell Romanian Deadlift':  'Romanian Deadlift',
  'Bicep Curl':                 'Dumbbell Curl',
  'Face Pulls':                 'Face Pull',
  'Pull Ups':                   'Pull-Up',
  'Pull-Ups':                   'Pull-Up',
  'Push Ups':                   'Push-Up',
  'Push-Ups':                   'Push-Up',
  'Triceps Rope Pushdown':      'Tricep Rope Pushdown',
  'Banded Hip Thrust':          'Hip Thrust',
  'Banded Row':                 'Barbell Row',
  'Lunge':                      'Walking Lunge',

  // ── additional confirmed pairs (same primary muscles) ───────────────────
  'Chin Ups':                   'Chin-Up',          // plural variant
  'Barbell Deadlift':           'Deadlift',          // programs emit this name
  'Dumbbell Flye':              'Dumbbell Fly',      // alternate spelling in programs
  'Banded Good Morning':        'Good Morning',
  'Banded Lateral Raise':       'Lateral Raise',
  'Banded Romanian Deadlift':   'Romanian Deadlift',
};

// Try raw name, then label-stripped name. Returns canonical name or null.
export function resolveAlias(name) {
  if (!name) return null;
  return EXERCISE_ALIASES[name] || EXERCISE_ALIASES[stripSupersetLabel(name)] || null;
}
