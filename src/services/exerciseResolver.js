import { getWorkoutForDay } from '../programs.js';
import { HYBRID_TEMPLATE_CYCLES, getTodayRunWorkout, getTodayHyroxWorkout, getTodayHybridWorkout } from '../running_programs.js';
import { resolveProgram } from '../utils/programResolver.js';
import { enrichRunSession } from '../utils/runningPaces.js';

const WDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// A/B/C rotation: returns the active routine ID for today based on
// elapsed full weeks since program start. Mirrors TrainSection exactly.
function _getActiveRoutineId(dayRoutineInfo, programStartDate) {
  if (!dayRoutineInfo) return null;
  const { routineId, rotation } = dayRoutineInfo;
  if (rotation?.length > 0) {
    const anchor = (() => {
      const d = programStartDate ? new Date(String(programStartDate).slice(0, 10)) : new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weeks = Math.max(0, Math.floor((today - anchor) / (7 * 86400000)));
    return rotation[weeks % rotation.length] || rotation[0];
  }
  return routineId || null;
}

function _avgReps(r) {
  const s = String(r == null || (typeof r === 'number' && !Number.isFinite(r)) ? 10 : r);
  const m = s.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (m) return (parseInt(m[1]) + parseInt(m[2])) / 2;
  const n = parseFloat(s);
  return isNaN(n) ? 10 : n;
}

/**
 * Compute a monotonic session-demand number: sum of sets × avgReps × compound-factor.
 * Compound/primary exercises use 1.5×; accessories use 1.0×.
 * No weight required — sets/reps/primary are the only inputs.
 */
export function computeSessionLoad(exercises) {
  if (!exercises?.length) return 0;
  return exercises.reduce((sum, ex) => {
    const sets = Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets) || 3);
    const reps = _avgReps(ex.reps);
    const factor = ex.primary !== false ? 1.5 : 1.0;
    return sum + sets * reps * factor;
  }, 0);
}

/**
 * Resolve today's planned lifting exercises from the user's saved data.
 *
 * Handles:
 *   1. Custom-routine days (todayType === 'custom'): looks up wPrefs.dayRoutine[todayKey]
 *      in customRoutines, honouring A/B/C rotation by elapsed full weeks.
 *   2. Premade-split lifting days (todayType === 'training'):
 *      - Hybrid users: null on run days; uses the hybrid template split + positional
 *        lift-day index on lift days (same as buildLiftingPrescription's positional path).
 *      - Standard lifting users: calls getWorkoutForDay with the same focusLabel and
 *        schedule-anchor resolution that TrainSection's buildLiftingPrescription uses.
 *
 * Returns null for rest/cardio/run/hyrox days and when no exercises can be resolved.
 * The 'sets' field is always a NUMBER (set count) in the returned objects.
 *
 * This is the single shared implementation used by both TrainSection (UI) and the
 * nutrition/morning-brief services — call sites must not duplicate this logic.
 */
export function resolveTodaysExercises({
  todayType, todayKey, schedule, dayFocus, wPrefs, customRoutines, programStartDate,
}) {
  // ── 1. Custom day ──────────────────────────────────────────────────────────
  if (todayType === 'custom') {
    const drInfo = wPrefs?.dayRoutine?.[todayKey];
    const rid = _getActiveRoutineId(drInfo, programStartDate);
    const routine = (customRoutines || []).find(r => r.id === rid);
    if (!routine?.exercises?.length) return null;
    return routine.exercises.map(ex => ({
      name: ex.name,
      sets: Number(ex.sets) || 3,
      reps: String(ex.reps || 10),
      primary: ex.primary !== false,
      notes: ex.notes || '',
    }));
  }

  // ── 2. Non-lifting days ────────────────────────────────────────────────────
  if (!todayType || todayType === 'rest' || todayType === 'cardio'
      || todayType === 'run' || todayType === 'hyrox') {
    return null;
  }

  // ── 3. Premade lifting day (todayType === 'training') ─────────────────────
  if (todayType === 'training') {
    const sc = schedule || {};

    // Hybrid programs: disambiguate run vs lift days via wPrefs.dayPlan
    if (wPrefs?.isHybrid && wPrefs?.dayPlan && Object.keys(wPrefs.dayPlan).length > 0) {
      const dp = wPrefs.dayPlan[todayKey];
      if (!dp?.lift) return null; // run day — no lifting exercises

      // Positional index: position of todayKey among lift days in week order
      const liftDays = WDAYS.filter(d => !!wPrefs.dayPlan[d]?.lift);
      const liftIdx = liftDays.indexOf(todayKey);
      if (liftIdx < 0) return null;

      const hybridSplit = HYBRID_TEMPLATE_CYCLES[wPrefs.hybridTemplate]
        || HYBRID_TEMPLATE_CYCLES[wPrefs.splitType]
        || 'Upper/Lower';
      // Positional path: pass null schedule/start so getWorkoutForDay uses dayIndex directly
      const raw = getWorkoutForDay(
        liftDays.length || 2, hybridSplit, liftIdx,
        wPrefs?.equipment || 'Full Gym',
        undefined, wPrefs?.liftExp || null,
        null, null, 0, null
      );
      const rawExs = raw?.exercises || (Array.isArray(raw) ? raw : null);
      if (!rawExs?.length) return null;
      return rawExs.map(ex => ({
        name: ex.name,
        sets: Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets) || 3),
        reps: ex.reps || '10',
        primary: ex.primary !== false,
        notes: ex.notes || '',
      }));
    }

    // Standard lifting: schedule + program-start-date anchor
    const trainingDays = WDAYS.filter(d => sc[d] === 'training');
    const daysPerWeek = trainingDays.length || 3;
    const anchor = (() => {
      const d = programStartDate ? new Date(String(programStartDate).slice(0, 10)) : new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    })();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysSince = Math.max(0, Math.floor((today - anchor) / 86400000));
    const dayIndex = daysSince % (daysPerWeek || 1);
    const focusLabel = dayFocus?.[todayKey] || null;
    const splitType = wPrefs?.splitType || 'Full Body';

    const raw = getWorkoutForDay(
      daysPerWeek, splitType, dayIndex,
      wPrefs?.equipment || 'Full Gym',
      undefined, wPrefs?.liftExp || null,
      sc, programStartDate || null, 0, focusLabel
    );
    const rawExs = raw?.exercises || (Array.isArray(raw) ? raw : null);
    if (!rawExs?.length) return null;
    return rawExs.map(ex => ({
      name: ex.name,
      sets: Array.isArray(ex.sets) ? ex.sets.length : (Number(ex.sets) || 3),
      reps: ex.reps || '10',
      primary: ex.primary !== false,
      notes: ex.notes || '',
    }));
  }

  return null;
}

/**
 * Resolve today's run/hyrox/hybrid-run session and enrich it with fuel guidance.
 *
 * Parallel to resolveTodaysExercises but for run-type programs. Calls the appropriate
 * session builder (getTodayRunWorkout / getTodayHyroxWorkout / getTodayHybridWorkout)
 * then enrichRunSession to attach preFuel / postFuel / macroAdjustment.
 *
 * @param {string}  todayType     - schedule[todayKey]: 'run'|'hyrox'|'training'|'rest'|...
 * @param {Object}  schedule      - full Mon–Sun schedule map
 * @param {Object}  wPrefs        - user workout preferences
 * @param {Object}  profile       - user profile (program_start_date, current5KTime, etc.)
 * @param {string}  todayKey      - 'Mon'|'Tue'|...|'Sun'
 * @param {number}  weekNum       - current training week (computed from program_start_date)
 * @param {boolean} hybridRunDay  - whether today is an engine run day in a hybrid program
 * @returns enriched session ({…, preFuel, postFuel, macroAdjustment}) or null
 */
export function resolveTodaysRunSession({
  todayType, schedule, wPrefs, profile, todayKey, weekNum, hybridRunDay = false,
}) {
  const programMode = resolveProgram(wPrefs, profile).mode;
  const prescType = programMode === 'conditioning' ? 'lifting' : programMode;

  let raw = null;

  if (prescType === 'running') {
    // getTodayRunWorkout returns null for rest/unmapped days — let it decide.
    raw = getTodayRunWorkout(profile, wPrefs, schedule, todayKey, weekNum);
  } else if (prescType === 'hyrox') {
    const hyroxProgramName = wPrefs?.hyroxProgram || '12-Week Race Prep';
    raw = getTodayHyroxWorkout(hyroxProgramName, weekNum, todayKey);
  } else if (prescType === 'hybrid-hyrox') {
    raw = getTodayHybridWorkout('Hyrox Hybrid', todayKey, weekNum);
  } else if (prescType === 'hybrid' && hybridRunDay) {
    raw = getTodayRunWorkout(profile, wPrefs, schedule, todayKey, weekNum);
  }

  if (!raw) return null;
  return enrichRunSession(raw);
}
