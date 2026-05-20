const BASE = '/images/programs';

export const PROGRAM_IMAGES = {
  // By PROGRAM_LIBRARY id
  'ppl_6':           `${BASE}/ppl.png`,
  'arnold':          `${BASE}/arnold_split.png`,
  'upper_lower':     `${BASE}/upper_lower.png`,
  'bro_split':       `${BASE}/bro_split.png`,
  'full_body':       `${BASE}/full_body.png`,
  'c25k':            `${BASE}/run_5k.png`,
  '5k_sub25':        `${BASE}/run_5k.png`,
  '10k':             `${BASE}/run_10k.png`,
  'half':            `${BASE}/run_half.png`,
  'hyrox_12w':       `${BASE}/hyrox_race.png`,
  'strength_run':    `${BASE}/hybrid.png`,
  'upper_lower_run': `${BASE}/hybrid.png`,
  'balanced_hybrid': `${BASE}/hybrid.png`,
  'ppl_hyrox':       `${BASE}/hyrox_strength.png`,

  // By splitType / name key variants
  'push_pull_legs':  `${BASE}/ppl.png`,
  'ppl':             `${BASE}/ppl.png`,
  'arnold_split':    `${BASE}/arnold_split.png`,
  'run_5k':          `${BASE}/run_5k.png`,
  '5k':              `${BASE}/run_5k.png`,
  'run_10k':         `${BASE}/run_10k.png`,
  'half_marathon':   `${BASE}/run_half.png`,
  'marathon':        `${BASE}/run_marathon.png`,
  'hyrox_strength':  `${BASE}/hyrox_strength.png`,
  'hyrox_run':       `${BASE}/hyrox_endurance.png`,
  'hyrox_endurance': `${BASE}/hyrox_endurance.png`,
  'hybrid':          `${BASE}/hybrid.png`,
  'hybrid_athlete':  `${BASE}/hybrid.png`,
};

export function getProgramImage(programId) {
  if (!programId) return null;

  const key = programId
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');

  if (PROGRAM_IMAGES[key]) return PROGRAM_IMAGES[key];

  if (key.includes('ppl') || key.includes('push')) return PROGRAM_IMAGES.push_pull_legs;
  if (key.includes('arnold'))                        return PROGRAM_IMAGES.arnold_split;
  if (key.includes('upper'))                         return PROGRAM_IMAGES.upper_lower;
  if (key.includes('bro'))                           return PROGRAM_IMAGES.bro_split;
  if (key.includes('full'))                          return PROGRAM_IMAGES.full_body;
  if (key.includes('hyrox') && key.includes('strength')) return PROGRAM_IMAGES.hyrox_strength;
  if (key.includes('hyrox') && (key.includes('run') || key.includes('endur'))) return PROGRAM_IMAGES.hyrox_endurance;
  if (key.includes('hyrox'))                         return PROGRAM_IMAGES.hyrox_12w;
  if (key.includes('marathon') && key.includes('half')) return PROGRAM_IMAGES.half_marathon;
  if (key.includes('marathon'))                      return PROGRAM_IMAGES.marathon;
  if (key.includes('10k') || key.includes('10_k'))   return PROGRAM_IMAGES.run_10k;
  if (key.includes('5k') || key.includes('5_k') || key.includes('couch')) return PROGRAM_IMAGES.run_5k;
  if (key.includes('run'))                           return PROGRAM_IMAGES.run_5k;
  if (key.includes('hybrid'))                        return PROGRAM_IMAGES.hybrid;

  return null;
}
