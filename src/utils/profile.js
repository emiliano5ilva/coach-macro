// Profile field accessor — reads from dedicated column first, falls back to
// profile_data JSONB so old and new users both resolve correctly during the
// transition period while profile_data is still the primary store.

export function getProfileField(profile, field) {
  if (!profile) return null;

  const fieldMap = {
    first_name: [
      'first_name',
      ['profile_data', 'name'],
      ['profile_data', 'firstName'],
    ],
    goal: [
      'goal',
      ['profile_data', 'goal'],
    ],
    skill_level: [
      'skill_level',
      ['profile_data', 'liftExp'],
      ['profile_data', 'skill_level'],
    ],
    weight_kg: [
      'weight_kg',
    ],
    goal_weight_kg: [
      'goal_weight_kg',
      ['profile_data', 'goalWeight'],
    ],
    height_cm: [
      'height_cm',
      ['profile_data', 'hCm'],
    ],
    units: [
      'units',
      ['profile_data', 'wUnit'],
    ],
    protein_g: [
      'protein_g',
      ['profile_data', 'proteinG'],
      ['profile_data', 'protein_g'],
    ],
    calorie_target: [
      'calorie_target',
      ['profile_data', 'goalCals'],
      ['profile_data', 'calories'],
      ['profile_data', 'calorie_target'],
    ],
    equipment: [
      'equipment',
      ['wprefs', 'equipment'],
      ['profile_data', 'equipment'],
    ],
    current_program: [
      'current_program',
      ['wprefs', 'splitType'],
      ['profile_data', 'splitType'],
    ],
  };

  const paths = fieldMap[field];
  if (!paths) return profile[field] ?? null;

  // Try dedicated column first (direct key on profile object)
  const directKey = paths[0];
  const directVal = profile[directKey];
  if (directVal !== undefined && directVal !== null && directVal !== '') {
    return directVal;
  }

  // Fall back through JSONB paths
  for (let i = 1; i < paths.length; i++) {
    const [blob, key] = paths[i];
    const val = profile[blob]?.[key] ?? profile[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }

  return null;
}

export function getFirstName(profile) {
  // profile in app state is already the spread of profile_data, so
  // profile.name is the direct field — no nested lookup needed.
  return profile?.first_name || profile?.name || 'Athlete';
}

export function getGoal(profile) {
  // profile.goal may be a DB column value ("cut") or an old JSONB value ("Cut").
  const raw = profile?.goal || null;
  if (!raw) return 'build_muscle';
  return raw.toLowerCase().replace(/\s+/g, '_');
}

export function getSkillLevel(profile) {
  const raw = profile?.skill_level || profile?.liftExp || 'beginner';
  return raw.toLowerCase();
}

export function getUnits(profile) {
  const raw = profile?.units || profile?.wUnit;
  if (raw === 'metric' || raw === 'kg') return 'metric';
  return 'imperial';
}

export function getWeightUnit(profile) {
  return getUnits(profile) === 'metric' ? 'kg' : 'lbs';
}
