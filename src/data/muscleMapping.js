// Single source of truth: exercise DB muscle names → SVG element IDs

export const MUSCLE_TO_SVG = {
  // ── CHEST ──────────────────────────
  'pectorals':               ['chest'],
  'pectoralis major':        ['chest'],
  'chest':                   ['chest'],
  'upper chest':             ['chest'],
  'lower chest':             ['chest'],
  'sternal pectorals':       ['chest'],

  // ── BACK ───────────────────────────
  'lats':                    ['lats'],
  'latissimus dorsi':        ['lats'],
  'upper back':              ['traps'],
  'traps':                   ['traps'],
  'trapezius':               ['traps'],
  'rhomboids':               ['traps'],
  'spine':                   ['lower-back'],
  'lower back':              ['lower-back'],
  'erector spinae':          ['lower-back'],
  'serratus anterior':       ['lats'],
  'teres major':             ['lats'],
  'teres minor':             ['rear-delts'],
  'infraspinatus':           ['rear-delts'],
  'back':                    ['traps', 'lats'],

  // ── SHOULDERS ──────────────────────
  'delts':                   ['shoulders-f', 'rear-delts'],
  'shoulders':               ['shoulders-f', 'rear-delts'],
  'deltoids':                ['shoulders-f', 'rear-delts'],
  'anterior deltoid':        ['shoulders-f'],
  'medial deltoid':          ['shoulders-f', 'rear-delts'],
  'rear deltoid':            ['rear-delts'],
  'rear delts':              ['rear-delts'],
  'rotator cuff':            ['shoulders-f', 'rear-delts'],
  'supraspinatus':           ['rear-delts'],

  // ── ARMS ───────────────────────────
  'biceps':                  ['biceps'],
  'biceps brachii':          ['biceps'],
  'brachialis':              ['biceps'],
  'triceps':                 ['triceps'],
  'triceps brachii':         ['triceps'],
  'long head tricep':        ['triceps'],
  'lateral head tricep':     ['triceps'],
  'medial head tricep':      ['triceps'],
  'forearms':                ['forearms-f', 'forearms-b'],
  'brachioradialis':         ['forearms-f', 'forearms-b'],
  'wrist flexors':           ['forearms-f'],
  'wrist extensors':         ['forearms-b'],
  'arms':                    ['biceps', 'forearms-f', 'triceps', 'forearms-b'],

  // ── CORE ───────────────────────────
  'abs':                     ['abs'],
  'abdominals':              ['abs'],
  'rectus abdominis':        ['abs'],
  'core':                    ['abs', 'lower-back'],
  'obliques':                ['abs'],
  'transverse abdominis':    ['abs'],

  // ── HIPS & GLUTES ──────────────────
  'glutes':                  ['glutes'],
  'gluteus maximus':         ['glutes'],
  'gluteus medius':          ['glutes'],
  'gluteus minimus':         ['glutes'],
  'hip flexors':             ['hip-flexors'],
  'iliopsoas':               ['hip-flexors'],
  'adductors':               ['quads'],
  'abductors':               ['glutes'],

  // ── LEGS ───────────────────────────
  'quads':                   ['quads'],
  'quadriceps':              ['quads'],
  'rectus femoris':          ['quads'],
  'vastus lateralis':        ['quads'],
  'vastus medialis':         ['quads'],
  'hamstrings':              ['hamstrings'],
  'biceps femoris':          ['hamstrings'],
  'semitendinosus':          ['hamstrings'],
  'semimembranosus':         ['hamstrings'],
  'calves':                  ['calves-f', 'calves-b'],
  'gastrocnemius':           ['calves-f', 'calves-b'],
  'soleus':                  ['calves-f', 'calves-b'],
  'legs':                    ['quads', 'hamstrings', 'glutes', 'calves-f', 'calves-b'],
};

// Given a list of muscle names, returns all SVG IDs that should be colored
export function musclesToSvgIds(muscles = []) {
  const ids = new Set();
  muscles.forEach(muscle => {
    const normalized = muscle.toLowerCase().trim();
    const svgIds = MUSCLE_TO_SVG[normalized];
    if (svgIds) svgIds.forEach(id => ids.add(id));
  });
  return [...ids];
}

const SVG_TO_GROUP = {
  'chest':       'chest',
  'shoulders-f': 'shoulders',
  'rear-delts':  'shoulders',
  'biceps':      'arms',
  'forearms-f':  'arms',
  'triceps':     'arms',
  'forearms-b':  'arms',
  'abs':         'core',
  'hip-flexors': 'core',
  'lower-back':  'back',
  'traps':       'back',
  'lats':        'back',
  'quads':       'legs',
  'calves-f':    'legs',
  'glutes':      'legs',
  'hamstrings':  'legs',
  'calves-b':    'legs',
};

export function svgIdsToMuscleGroups(svgIds = []) {
  const groups = new Set();
  svgIds.forEach(id => {
    const group = SVG_TO_GROUP[id];
    if (group) groups.add(group);
  });
  return [...groups];
}
