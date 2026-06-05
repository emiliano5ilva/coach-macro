// Pure generative running plan engine — no I/O, no React, no DB.
// Methodology: Daniels pace precision + Hudson mileage safety.
// Close-out items: easy-cap, scaled notes, interval1mi, taper diff,
// 3-day intervals, general mode, DOMS routing.

import { getRacePredictions, formatRaceTime } from '../utils/runningPaces.js';

const DAY_ORDER  = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
const DAY_BY_NUM = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

// ── Distance rounding ─────────────────────────────────────────────────────────
// All session distances are snapped to clean increments:
//   < 3 mi  → nearest 0.25 mi
//   3–10 mi → nearest 0.5 mi
//   > 10 mi → nearest 1 mi
function roundDist(mi) {
  if (mi <= 0) return 0;
  if (mi < 3)  return Math.round(mi * 4) / 4;
  if (mi <= 10) return Math.round(mi * 2) / 2;
  return Math.round(mi);
}

// ── Volume tables ─────────────────────────────────────────────────────────────

const START_BANDS = {
  beginner:     { '5k': 12, '10k': 14, 'half': 16, 'marathon': 18, 'general': 12 },
  intermediate: { '5k': 20, '10k': 22, 'half': 25, 'marathon': 28, 'general': 20 },
  advanced:     { '5k': 35, '10k': 38, 'half': 42, 'marathon': 48, 'general': 35 },
};

const VOLUME_CEILINGS = {
  beginner:     { '5k': 25, '10k': 28, 'half': 35, 'marathon': 40, 'general': 20 },
  intermediate: { '5k': 35, '10k': 40, 'half': 50, 'marathon': 60, 'general': 30 },
  advanced:     { '5k': 50, '10k': 55, 'half': 65, 'marathon': 80, 'general': 50 },
};

const PER_RUN_MILES = { beginner: 3.5, intermediate: 5, advanced: 7 };

const LONG_RUN_CAP = {
  beginner:     { '5k': 7,  '10k': 9,  'half': 12, 'marathon': 20, 'general': 8  },
  intermediate: { '5k': 7,  '10k': 9,  'half': 12, 'marathon': 20, 'general': 10 },
  advanced:     { '5k': 8,  '10k': 10, 'half': 13, 'marathon': 22, 'general': 12 },
};

// Item 1 — single easy-session caps by experience
const EASY_CAPS = { beginner: 6, intermediate: 12, advanced: 16 };

// ── Phase structure (§3) ──────────────────────────────────────────────────────

export function getWeekPhases(totalWeeks, goalDistance) {
  if (goalDistance === 'general') return Array(totalWeeks).fill('general');

  const taperWeeks = Math.max(1, Math.round(totalWeeks * 0.10));
  const remaining  = totalWeeks - taperWeeks;
  const baseWeeks  = Math.round(remaining * (0.35 / 0.90));
  const buildWeeks = Math.round(remaining * (0.30 / 0.90));
  const peakWeeks  = remaining - baseWeeks - buildWeeks;

  return [
    ...Array(baseWeeks).fill('base'),
    ...Array(buildWeeks).fill('build'),
    ...Array(Math.max(0, peakWeeks)).fill('peak'),
    ...Array(taperWeeks).fill('taper'),
  ];
}

// ── Volume ceiling (§5, §6, §10) ─────────────────────────────────────────────

export function getVolumeCeiling(goalDistance, experience, liftDaysPerWeek, recoveryCapacity) {
  let ceiling = VOLUME_CEILINGS[experience]?.[goalDistance] ?? 25;

  const liftDays = liftDaysPerWeek || 0;
  if      (liftDays >= 4) ceiling *= 0.85;
  else if (liftDays >= 3) ceiling *= 0.90;
  else if (liftDays >= 1) ceiling *= 0.95;

  const rc = Math.max(1, Math.min(5, recoveryCapacity || 3));
  ceiling *= 1 + (rc - 3) * 0.05;

  return Math.round(ceiling);
}

// ── Starting volume (§5, §10.1) ───────────────────────────────────────────────

export function getStartingVolume(currentRunsPerWeek, longestRunMi, goalDistance, experience) {
  const band    = START_BANDS[experience]?.[goalDistance] ?? 12;
  const perRun  = PER_RUN_MILES[experience] || 3.5;

  // currentRunsPerWeek=0 means true beginner (never ran); use a minimal seed volume.
  // Non-zero: use frequency support as the capacity anchor.
  const freqSupport = (currentRunsPerWeek > 0)
    ? currentRunsPerWeek * perRun
    : band * 0.15; // ~15% of band = gentle starting point for non-runners

  let start = Math.min(band, freqSupport);

  // longestRunMi hard upper cap: the starting long run must not exceed longestRunMi.
  // Long run ≈ 33% of weekly volume → cap weekly volume at longestRunMi / 0.33.
  // This is an UPPER cap (prevents prescribing 5mi sessions to a 1mi athlete).
  if (longestRunMi && longestRunMi > 0) {
    const longestCap = longestRunMi / 0.33;
    start = Math.min(start, longestCap);
  }

  return Math.max(1, start);  // keep as float — volume progression handles ramp precision
}

// ── Full volume progression ───────────────────────────────────────────────────
// Item 4: taper weeks differentiated — first taper 70%, race week 52%.

export function buildVolumeProgression(startVol, ceiling, totalWeeks, experience, phases) {
  const downCadence     = experience === 'beginner' ? 3 : 4;
  const totalTaperWeeks = phases.filter(p => p === 'taper').length;
  const results  = [];
  let normalVol  = Math.max(startVol, 1);
  let peakNormal = normalVol;
  let taperSeq   = 0;

  for (let w = 1; w <= totalWeeks; w++) {
    const phase  = phases[w - 1];
    const isDown = phase !== 'taper' && phase !== 'general' && (w % downCadence === 0);

    let vol;
    if (phase === 'taper') {
      taperSeq++;
      const isRaceWeek = taperSeq === totalTaperWeeks;
      vol = isRaceWeek ? peakNormal * 0.52 : peakNormal * 0.70;
    } else if (phase === 'general') {
      vol = normalVol; // flat — no ramp, no down weeks
    } else if (isDown) {
      vol = normalVol * 0.78;
    } else {
      if (w > 1) {
        if (phase === 'base' || phase === 'build') {
          // Standard 10% ramp; for very small volumes (<6 mi) guarantee ≥0.5 mi/wk
          // increment so fractional rounding doesn't collapse the ramp to flat.
          const tenPct = normalVol * 1.10;
          const minInc = normalVol < 6 ? normalVol + 0.5 : tenPct;
          normalVol = Math.min(Math.max(tenPct, minInc), ceiling);
        } else if (phase === 'peak') {
          normalVol = Math.min(normalVol * 1.04, ceiling);
        }
      }
      vol = normalVol;
      peakNormal = Math.max(peakNormal, normalVol);
    }

    results.push({ week: w, volume: Math.max(vol, 1), isDownWeek: isDown, phase });
  }
  return results;
}

// ── DOMS blocking (Item 7) ────────────────────────────────────────────────────
// After a heavy lower-body day: day 1 blocked, day 2 (peak) always blocked,
// day 3 blocked unless recoveryCapacity >= 4.
// Reads personal peakHours from liftingLoad.domsProfile when available.

export function getDOMSBlockedDays(heavyLowerDays, domsProfile, recoveryCapacity) {
  if (!heavyLowerDays?.length) return new Set();
  const blocked = new Set();
  const rc = recoveryCapacity || 3;

  // Determine peak-day offset from personal data or generic curve
  const lowerZones = ['quads', 'hamstrings', 'glutes'];
  let peakDayOffset = 2; // generic: peak day 2 (≈48h)
  if (domsProfile?.peakHours) {
    const validPeaks = lowerZones
      .map(z => domsProfile.peakHours[z])
      .filter(p => p && p.confidence >= 0.60 && p.hours > 0)
      .map(p => p.hours);
    if (validPeaks.length > 0) {
      const avgHours = validPeaks.reduce((a, b) => a + b, 0) / validPeaks.length;
      peakDayOffset = Math.ceil(avgHours / 24);
    }
  }

  for (const heavyDay of heavyLowerDays) {
    const heavyNum = DAY_ORDER[heavyDay];
    if (!heavyNum) continue;

    // Block days 1 through peakDayOffset (always blocked regardless of RC)
    for (let offset = 1; offset <= peakDayOffset; offset++) {
      const num = ((heavyNum - 1 + offset) % 7) + 1;
      const day = DAY_BY_NUM[num];
      if (day) blocked.add(day);
    }

    // Day peakDayOffset+1: block if recovery_capacity < 4
    if (rc < 4) {
      const num = ((heavyNum - 1 + peakDayOffset + 1) % 7) + 1;
      const day = DAY_BY_NUM[num];
      if (day) blocked.add(day);
    }
  }
  return blocked;
}

// ── Day adjacency ─────────────────────────────────────────────────────────────

function daysAdjacent(a, b) {
  const da = DAY_ORDER[a], db = DAY_ORDER[b];
  if (!da || !db) return false;
  const diff = Math.abs(da - db);
  return diff === 1 || diff === 6;
}

// ── Peak-phase helpers (items 3, 5) ──────────────────────────────────────────

function peakWeekIndex(weekInPlan, phases) {
  let count = 0;
  for (let i = 0; i < phases.length; i++) {
    if (phases[i] === 'peak') count++;
    if (i + 1 === weekInPlan) return phases[i] === 'peak' ? count : 0;
  }
  return 0;
}

function totalPeakWeeks(phases) {
  return phases.filter(p => p === 'peak').length;
}

// ── Quality type selection ────────────────────────────────────────────────────
// Item 3: advanced late-Peak (last 2 peak weeks) → 'intervals_1mi'
// Item 5: 3-day Peak alternates threshold/intervals by peak week index

function getQualityType(idx, phase, experience, numDays, pkWeekIdx, pkWeeksTotal) {
  if (phase === 'general') return 'threshold';
  if (phase === 'base')    return 'threshold';
  if (phase === 'taper')   return 'threshold';
  if (phase === 'build')   return 'threshold';

  if (phase === 'peak') {
    // 3-day plans: alternate threshold/intervals by peak week (item 5)
    if (numDays <= 3) {
      if (pkWeekIdx % 2 === 0) {
        // Even peak week → intervals
        const latePk = pkWeeksTotal > 0 && pkWeekIdx > pkWeeksTotal - 2;
        return (experience === 'advanced' && latePk) ? 'intervals_1mi' : 'intervals';
      }
      return 'threshold';
    }

    // 4+ day plans: idx=0 threshold, idx≥1 intervals
    if (idx === 0) return 'threshold';
    const latePk = pkWeeksTotal > 0 && pkWeekIdx > pkWeeksTotal - 2;
    return (experience === 'advanced' && latePk) ? 'intervals_1mi' : 'intervals';
  }

  return 'threshold';
}

// ── Quality session details with scaled notes (item 2) ────────────────────────

function getQualityDetails(qType, phase, distanceMi) {
  const wu = distanceMi >= 3 ? 1 : 0;
  const cd = distanceMi >= 3 ? 1 : 0;
  // For short sessions (<3mi, no WU/CD), effort = full distance.
  // For longer sessions, subtract WU+CD but floor at 1mi.
  const effort = distanceMi < 3 ? distanceMi : Math.max(1, distanceMi - wu - cd);
  const wuStr  = wu ? `${wu}mi WU, ` : '';
  const cdStr  = cd ? `, ${cd}mi CD` : '';

  if (qType === 'intervals' || qType === 'intervals_1mi') {
    const pace = qType === 'intervals_1mi' ? '{interval1mi}' : '{interval5K}';
    const unit = qType === 'intervals_1mi' ? '×1mi' : '×800m';
    const reps = effort <= 3 ? '3–4' : effort <= 5 ? '4–6' : '6–8';
    return {
      pace,
      note: `${wuStr}${reps}${unit} @ interval pace, 90 sec jog recovery${cdStr}.`,
    };
  }

  // threshold
  if (phase === 'taper') return {
    pace: '{tempo}',
    note: `${wuStr}${effort}mi @ threshold${cdStr}. Short, sharp — stay fresh for race day.`,
  };
  if (phase === 'peak') return {
    pace: '{tempo}',
    note: `${wuStr}${effort}mi @ threshold${cdStr}. Race-specific stimulus.`,
  };
  return {
    pace: '{tempo}',
    note: `${wuStr}${effort}mi @ threshold${cdStr}. Comfortably hard. Controlled.`,
  };
}

// ── Long run notes ────────────────────────────────────────────────────────────

function getLongRunNote(phase, goalDistance, isRaceWeek) {
  if (isRaceWeek) return 'Shakeout long run. Easy, no stress on the legs. Race day is days away.';
  if (phase === 'taper') return 'Reduced long run. Stay fully easy. Trust the taper.';
  if (phase === 'peak' && (goalDistance === 'half' || goalDistance === 'marathon')) {
    return 'Peak long run. Patience is the strategy — the final miles will feel familiar on race day.';
  }
  if (phase === 'general') return 'Long-ish run. Easy conversational effort. No target distance pressure.';
  return 'Build aerobic endurance. Fully conversational start to finish.';
}

// ── Coach notes ───────────────────────────────────────────────────────────────

const COACH_NOTES = {
  base: {
    beginner:     'Every easy mile builds the engine. Consistency now pays off in the final miles of your race.',
    intermediate: 'Aerobic base work. These easy miles matter more than they look.',
    advanced:     'Base phase: volume is the focus. Discipline here creates options later.',
  },
  build: {
    beginner:     'Threshold work is starting — it will feel hard, and that is right. You are building real race fitness.',
    intermediate: 'Threshold volume is climbing — this is where race fitness is built. Hit the paces, nail the recovery.',
    advanced:     'Double quality weeks — manage fatigue carefully. Hard, easy, hard, easy.',
  },
  peak: {
    beginner:     'Your first intervals. Sharpening has started. Trust everything you built in Base.',
    intermediate: 'Race-specific sharpening. Intervals are hard because your goal race is hard. You are ready.',
    advanced:     'Peak stimulus — short, fast, targeted. Volume is secondary to quality execution.',
  },
  taper: {
    beginner:     'You have done the work. Back off, stay sharp, trust the taper. Nerves equal readiness.',
    intermediate: 'Taper: resist the urge to add miles. Your legs will feel fresh on race day for a reason.',
    advanced:     'Taper sharp. Race-pace touches keep the neuromuscular system primed. Do not add volume.',
  },
  general: {
    beginner:     'Maintaining your base. Easy miles, one quality day, one longer run. No pressure, just consistency.',
    intermediate: 'General fitness block. Keep the aerobic engine running without peak race stress.',
    advanced:     'Maintenance mode. Sustain the base, keep the quality sharp, recover well.',
  },
};

const RACE_WEEK_NOTES = {
  beginner:     'Race week. 2-3 easy runs only, no hard efforts. Rest, eat your carbs, sleep. You are ready.',
  intermediate: 'Race week. Short shakeout runs, one race-pace touch. Store the energy. Trust everything you built.',
  advanced:     'Race week. Shakeout runs and strides only. Everything now is maintenance, not fitness. Race sharp.',
};

function getCoachNote(phase, experience, isDownWeek, isRaceWeek) {
  if (isDownWeek)  return 'Down week — absorb the adaptation, not add to it. Sleep more, eat well, recover fully.';
  if (isRaceWeek)  return RACE_WEEK_NOTES[experience] ?? RACE_WEEK_NOTES.intermediate;
  return COACH_NOTES[phase]?.[experience] ?? 'Build consistency, manage effort, trust the process.';
}

// ── Session building ──────────────────────────────────────────────────────────
// Items 1,2,5,7 applied here.

function buildSessions(
  phase, experience, daysAvailable, weeklyVolume, goalDistance,
  liftingLoad, weekInPlan, phases, recoveryCapacity, isRaceWeek,
  emphasis,          // 'endurance' | 'speed' | 'consistency' — only used when phase === 'general'
  isDownWeek,        // passed from generateRunWeek for maintenance-conversion guard
  longestRunMi,      // athlete's current longest comfortable run — anchors session distances
  currentRunsPerWeek // athlete's current weekly run frequency — 0 = non-runner
) {
  const days      = [...daysAvailable].sort((a, b) => (DAY_ORDER[a] || 0) - (DAY_ORDER[b] || 0));
  const numDays   = days.length;
  const heavyDays = liftingLoad?.heavyLowerDays ?? [];
  const domsProf  = liftingLoad?.domsProfile ?? null;

  // Item 7 — compute DOMS-blocked days
  const domsBlocked = getDOMSBlockedDays(heavyDays, domsProf, recoveryCapacity);

  // Long run day: prefer Sat > Sun, skip DOMS-blocked and adj-to-heavy days
  let longRunDay = null;
  for (const pref of ['Sat', 'Sun']) {
    if (days.includes(pref) && !domsBlocked.has(pref) && !heavyDays.some(h => daysAdjacent(pref, h))) {
      longRunDay = pref;
      break;
    }
  }
  if (!longRunDay) {
    longRunDay = [...days].reverse().find(
      d => !domsBlocked.has(d) && !heavyDays.some(h => daysAdjacent(d, h))
    ) ?? days[days.length - 1];
  }

  // True beginner: non-runner (0 runs/week) or very short longest run (≤1mi).
  // Must be defined before quality calculation so base-phase suppression applies.
  const isTrueBeginner = (currentRunsPerWeek === 0) || (longestRunMi != null && longestRunMi <= 1);

  // Quality session count
  const rawQuality = {
    base:    { beginner: 0, intermediate: numDays >= 4 ? 1 : 0, advanced: 1 },
    build:   { beginner: 1, intermediate: 2, advanced: 2 },
    peak:    { beginner: 2, intermediate: 2, advanced: numDays >= 5 ? 3 : 2 },
    taper:   { beginner: 1, intermediate: 1, advanced: 1 },
    general: { beginner: 1, intermediate: 1, advanced: 1 },
  };
  const dayCapForQuality = numDays <= 3 ? 1 : 2;
  let targetQuality = Math.min(
    (rawQuality[phase] ?? rawQuality.base)[experience] ?? 0,
    dayCapForQuality
  );

  if (experience === 'beginner' && phase === 'base') targetQuality = 0;
  // True beginners must not get quality sessions in base regardless of stated experience.
  // A profile labeled 'intermediate' who actually runs 0mi/week is a non-runner.
  if (isTrueBeginner && phase === 'base') targetQuality = 0;
  if (isRaceWeek) targetQuality = Math.min(targetQuality, 1); // taper race week: 1 max

  // Peak-phase context for items 3, 5
  const pkWeekIdx   = peakWeekIndex(weekInPlan, phases);
  const pkWksTotal  = totalPeakWeeks(phases);

  // Pick quality day slots
  const hardDays = new Set([longRunDay, ...heavyDays]);
  const candidates = days.filter(d => d !== longRunDay);
  const qualityDays = [];

  for (const candidate of candidates) {
    if (qualityDays.length >= targetQuality) break;
    if (domsBlocked.has(candidate)) continue;             // DOMS block (item 7)
    if (heavyDays.includes(candidate)) continue;          // same day as heavy lift
    const adjacentToHard = [...hardDays].some(hd => daysAdjacent(candidate, hd));
    if (adjacentToHard) continue;
    qualityDays.push(candidate);
    hardDays.add(candidate);
  }

  // Session distance floor: true beginners can have sub-1mi sessions; standard plans use 1mi.
  const sessionFloor = (longestRunMi && longestRunMi < 2) ? 0.5 : 1;

  // Distances — all snapped to quarter-mile increments via roundDist().
  // True beginners at low volume get a higher long-run fraction (0.50) so the long run
  // is meaningfully longer than the easy sessions, giving visible variety.
  const longRunCap = LONG_RUN_CAP[experience]?.[goalDistance] ?? 8;
  const _lrFrac    = (phase === 'general' && emphasis === 'endurance') ? 0.38
                   : (isTrueBeginner && weeklyVolume < 6) ? 0.50
                   : 0.33;
  const longRunDist = Math.max(sessionFloor, roundDist(Math.min(
    weeklyVolume * _lrFrac,
    longRunCap,
    weeklyVolume * (_lrFrac + 0.02)
  )));
  const qualityDist = qualityDays.length > 0
    ? Math.max(sessionFloor, roundDist((weeklyVolume - longRunDist) * 0.22))
    : 0;
  const easyDays  = days.filter(d => d !== longRunDay && !qualityDays.includes(d));
  const easyTotal = Math.max(0, weeklyVolume - longRunDist - qualityDist * qualityDays.length);

  // Item 1 — round easy distance then cap at easyCap and longRunDist.
  // The longRunDist cap is applied AFTER rounding to keep easyDist a valid increment.
  const easyCap     = EASY_CAPS[experience] || 12;
  const rawEasyDist = easyDays.length > 0 ? easyTotal / easyDays.length : 0;
  const easyDist    = Math.min(roundDist(Math.max(sessionFloor, Math.min(rawEasyDist, easyCap))), longRunDist);
  const easyAtCap   = rawEasyDist > easyCap;

  // Build sessions
  const sessions = [];
  for (const d of days) {
    if (d === longRunDay) {
      const _longNote = getLongRunNote(phase, goalDistance, isRaceWeek);
      sessions.push({
        day:        d,
        type:       'long',
        distanceMi: longRunDist,
        pace:       '{longRun}',
        note:       isTrueBeginner ? _longNote + ' Run/walk as needed.' : _longNote,
      });
    } else if (qualityDays.includes(d)) {
      const idx   = qualityDays.indexOf(d);
      // For general+speed emphasis, override quality type to intervals (all other paths unchanged).
      const _baseQType = getQualityType(idx, phase, experience, numDays, pkWeekIdx, pkWksTotal);
      const qType = (phase === 'general' && emphasis === 'speed') ? 'intervals' : _baseQType;
      // Item 2 — note scaled to actual distance
      const { pace, note } = getQualityDetails(qType, phase, qualityDist);
      const sessionType = qType === 'intervals_1mi' ? 'intervals' : qType;
      sessions.push({ day: d, type: sessionType, distanceMi: qualityDist, pace, note });
    } else {
      const strides   = phase === 'base' && experience !== 'beginner';
      const capNote   = easyAtCap ? ` (${easyDist} mi — capped; total for the day)` : '';
      const walkNote  = isTrueBeginner ? ' Run/walk as needed.' : '';
      sessions.push({
        day:        d,
        type:       'easy',
        distanceMi: easyDist,
        pace:       '{easy}',
        note: strides
          ? `Easy effort + 4×20 sec strides at the end. Fully conversational.${capNote}${walkNote}`
          : `Easy effort. Zone 2. Conversational throughout.${capNote}${walkNote}`,
      });
    }
  }

  // ── Steady conversion: upgrade one mid-week easy → steady (moderate aerobic) ──
  // Conditions: ≥2 easy days, not taper, not a down week.
  // Guards: not adjacent to quality/long/heavy days; not DOMS-blocked.
  // True beginners get +0.25mi on the maintenance session to create visible distance
  // variation between session types within the same week.
  if (easyDays.length >= 2 && phase !== 'taper' && !isDownWeek) {
    const allHardForSteady = new Set([longRunDay, ...qualityDays, ...heavyDays]);
    const steadyCandidate = easyDays.find(d =>
      !domsBlocked.has(d) &&
      ![...allHardForSteady].some(hd => daysAdjacent(d, hd))
    );
    if (steadyCandidate) {
      const idx = sessions.findIndex(s => s.day === steadyCandidate);
      if (idx !== -1) {
        const maintDist = isTrueBeginner
          ? Math.min(roundDist(easyDist + 0.25), longRunDist)
          : easyDist;
        const walkNote = isTrueBeginner ? ' Run/walk as needed.' : '';
        sessions[idx] = {
          day:        steadyCandidate,
          type:       'maintenance',
          distanceMi: maintDist,
          pace:       '{maintenance}',
          note:       `Comfortably moderate effort. Steady aerobic — between easy and threshold. Controlled throughout.${walkNote}`,
        };
      }
    }
  }

  // ── Long-run-longest invariant ─────────────────────────────────────────────
  // Enforced AFTER maintenance conversion so all session types are checked.
  // The long run is raised to match if any other session exceeds it.
  const longSess = sessions.find(s => s.type === 'long');
  if (longSess) {
    const maxOther = Math.max(0, ...sessions.filter(s => s !== longSess).map(s => s.distanceMi));
    if (longSess.distanceMi < maxOther) longSess.distanceMi = maxOther;
    // Hard assertion: enforcement above must have resolved all violations.
    const maxAfter = Math.max(0, ...sessions.filter(s => s !== longSess).map(s => s.distanceMi));
    if (longSess.distanceMi < maxAfter) {
      throw new Error(
        `[runEngine] long-run-longest invariant unresolvable after enforcement: ` +
        `long=${longSess.distanceMi}mi maxOther=${maxAfter}mi`
      );
    }
  }

  return sessions;
}

// ── Projected finish ──────────────────────────────────────────────────────────

function buildProjectedFinish(seconds5K, goalDistance) {
  if (goalDistance === 'general') return null;
  if (!seconds5K || seconds5K <= 0) return null;
  const pred   = getRacePredictions(seconds5K);
  const secMap = { '5k': pred.fiveK, '10k': pred.tenK, 'half': pred.half, 'marathon': pred.marathon };
  const labels = { '5k': '5K', '10k': '10K', 'half': 'half', 'marathon': 'marathon' };
  const sec = secMap[goalDistance];
  if (!sec) return null;
  return formatRaceTime(sec) + ' ' + labels[goalDistance];
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * generateRunWeek — pure function, no side-effects.
 *
 * @param {object} currentAbility  { seconds5K, currentRunsPerWeek, longestRunMi, recoveryCapacity }
 * @param {object} goalRace        { distance: '5k'|'10k'|'half'|'marathon'|'general', goalSeconds }
 * @param {number} weekInPlan      1-based
 * @param {number} totalWeeks
 * @param {string[]} daysAvailable e.g. ['Tue','Thu','Sat']
 * @param {string} experience      'beginner'|'intermediate'|'advanced'
 * @param {object|null} liftingLoad { liftDaysPerWeek, heavyLowerDays, domsProfile? }
 * @param {string} [emphasis]      For goalRace.distance==='general' only:
 *   'endurance' = longer long run; 'speed' = intervals over threshold;
 *   'consistency' (default) = steady maintenance, no change.
 */
export function generateRunWeek(
  currentAbility,
  goalRace,
  weekInPlan,
  totalWeeks,
  daysAvailable,
  experience,
  liftingLoad,
  emphasis,
) {
  const seconds5K          = currentAbility?.seconds5K || null;
  const currentRunsPerWeek = currentAbility?.currentRunsPerWeek ?? 2; // ?? preserves 0 (non-runner)
  const longestRunMi       = currentAbility?.longestRunMi ?? null;
  const recoveryCapacity   = currentAbility?.recoveryCapacity || 3;
  const goalDistance       = goalRace?.distance || '5k';
  const exp = ['beginner', 'intermediate', 'advanced'].includes(experience) ? experience : 'beginner';
  const days = (Array.isArray(daysAvailable) && daysAvailable.length >= 2)
    ? daysAvailable.filter(d => DAY_ORDER[d])
    : ['Tue', 'Thu', 'Sat'];
  const liftLoad = liftingLoad || { liftDaysPerWeek: 0, heavyLowerDays: [], domsProfile: null };

  const phases    = getWeekPhases(totalWeeks, goalDistance);
  const phase     = phases[Math.min(weekInPlan - 1, phases.length - 1)] || 'base';
  const ceiling   = getVolumeCeiling(goalDistance, exp, liftLoad.liftDaysPerWeek, recoveryCapacity);
  const startVol  = getStartingVolume(currentRunsPerWeek, longestRunMi, goalDistance, exp);
  const prog      = buildVolumeProgression(startVol, ceiling, totalWeeks, exp, phases);
  const weekData  = prog[weekInPlan - 1] || { volume: startVol, isDownWeek: false, phase };

  const weeklyVolume = weekData.volume;
  const isDownWeek   = weekData.isDownWeek;

  // Item 4 — detect race week (last taper week)
  const taperWeeksTotal = phases.filter(p => p === 'taper').length;
  const taperWeeksSoFar = phases.slice(0, weekInPlan).filter(p => p === 'taper').length;
  const isRaceWeek = phase === 'taper' && taperWeeksSoFar === taperWeeksTotal;

  const _emphasis = ['endurance', 'speed', 'consistency'].includes(emphasis) ? emphasis : 'consistency';
  const sessions = buildSessions(
    phase, exp, days, weeklyVolume, goalDistance,
    liftLoad, weekInPlan, phases, recoveryCapacity, isRaceWeek, _emphasis, isDownWeek,
    longestRunMi, currentRunsPerWeek
  );

  return {
    weekInPlan,
    totalWeeks,
    weekPhase:      phase,
    weeklyVolumeMi: weeklyVolume,
    isDownWeek,
    isRaceWeek,
    sessions,
    projectedFinish: buildProjectedFinish(seconds5K, goalDistance),
    coachNote:       getCoachNote(phase, exp, isDownWeek, isRaceWeek),
  };
}
