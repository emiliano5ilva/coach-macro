#!/usr/bin/env node
// Test harness for generateRunWeek() — Phase A + day-count verification.
// Run: node scripts/test-run-engine.mjs
// Covers §11.7 matrix: distance × goalType × experience × runType × daysAvailable
// Asserts all 8 safety rails (§8) across every week of every plan.

import { generateRunWeek, getWeekPhases, buildVolumeProgression,
         getStartingVolume, getVolumeCeiling } from '../src/services/runEngine.js';

// ── Scenario definitions ──────────────────────────────────────────────────────

const DISTANCES   = ['5k', '10k', 'half', 'marathon'];
const GOAL_TYPES  = ['complete', 'goal-time'];
const EXPERIENCES = ['beginner', 'intermediate', 'advanced'];

// Plan lengths per distance
const PLAN_WEEKS = { '5k': 8, '10k': 12, 'half': 16, 'marathon': 16 };

// Riegel multipliers (matching getRacePredictions internals)
const RIEGEL = { '5k': 1, '10k': 2.09, 'half': 4.667, 'marathon': 9.87 };

// Day templates per experience per run type.
// Adjacency pre-verified: no hard-day pair is adjacent in any template.
// run-only templates avoid Mon (heavy lift day) in days list.
// hybrid templates keep heavyLowerDays=['Mon'] and exclude Mon from run days.
// 6-day templates are advanced only (§4).
const DAY_TEMPLATES = {
  'run-only': {
    beginner:     [ [3, ['Tue','Thu','Sat']],
                    [4, ['Mon','Wed','Thu','Sat']],
                    [5, ['Mon','Tue','Wed','Thu','Sat']] ],
    intermediate: [ [3, ['Tue','Thu','Sat']],
                    [4, ['Mon','Wed','Thu','Sat']],
                    [5, ['Mon','Tue','Wed','Thu','Sat']] ],
    advanced:     [ [3, ['Tue','Thu','Sat']],
                    [4, ['Mon','Wed','Thu','Sat']],
                    [5, ['Mon','Tue','Wed','Thu','Sat']],
                    [6, ['Mon','Tue','Wed','Thu','Sat','Sun']] ],
  },
  hybrid: {
    beginner:     [ [3, ['Tue','Thu','Sat']],
                    [4, ['Tue','Thu','Fri','Sat']],
                    [5, ['Tue','Thu','Fri','Sat','Sun']] ],
    intermediate: [ [3, ['Tue','Thu','Sat']],
                    [4, ['Tue','Thu','Fri','Sat']],
                    [5, ['Tue','Thu','Fri','Sat','Sun']] ],
    advanced:     [ [3, ['Tue','Thu','Sat']],
                    [4, ['Tue','Thu','Fri','Sat']],
                    [5, ['Tue','Thu','Fri','Sat','Sun']],
                    [6, ['Tue','Wed','Thu','Fri','Sat','Sun']] ],
  },
};

function makeAbility(experience) {
  const base5KSecs  = { beginner: 30*60, intermediate: 25*60, advanced: 20*60 }[experience];
  const runsPerWeek = { beginner: 3,     intermediate: 4,     advanced: 5     }[experience];
  return { seconds5K: base5KSecs, currentRunsPerWeek: runsPerWeek,
           longestRunMi: null, recoveryCapacity: 3 };
}

function makeGoalRace(distance, goalType, ability) {
  if (goalType === 'complete') return { distance, goalSeconds: null };
  const projSecs = Math.round(ability.seconds5K * (RIEGEL[distance] || 1) * 0.95);
  return { distance, goalSeconds: projSecs };
}

function makeLiftingLoad(runType) {
  if (runType === 'run-only') return { liftDaysPerWeek: 0, heavyLowerDays: [] };
  return { liftDaysPerWeek: 3, heavyLowerDays: ['Mon'] };
}

// ── Safety rail assertions ─────────────────────────────────────────────────────

const DAY_ORDER = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function daysAdjacent(a, b) {
  const da = DAY_ORDER[a], db = DAY_ORDER[b];
  if (!da || !db) return false;
  const diff = Math.abs(da - db);
  return diff === 1 || diff === 6;
}

function isHardSession(s) {
  return s.type === 'threshold' || s.type === 'intervals';
}

function parseMainEffortMi(note) {
  const m = note.match(/(\d+(?:\.\d+)?)mi @/);
  return m ? parseFloat(m[1]) : null;
}

const EASY_CAPS_CHECK = { beginner: 6, intermediate: 12, advanced: 16 };

function checkRails(scenario, weeks, liftingLoad) {
  const { distance, experience, totalWeeks, numDays } = scenario;
  const isGeneral = distance === 'general';
  const fails = [];

  const vols   = weeks.map(w => w.weeklyVolumeMi);
  const phases = weeks.map(w => w.weekPhase);
  const isDown = weeks.map(w => w.isDownWeek);

  // ── Rail 1: ramp ≤10% between consecutive non-down Base/Build weeks ──────────
  if (!isGeneral) {
    for (let i = 0; i < weeks.length - 1; i++) {
      const p1 = phases[i], p2 = phases[i + 1];
      if (!['base', 'build'].includes(p1) || !['base', 'build'].includes(p2)) continue;
      if (isDown[i] || isDown[i + 1]) continue;
      const ramp = (vols[i + 1] - vols[i]) / vols[i];
      if (ramp > 0.101) fails.push(`Rail1 RAMP: wk${i+1}(${vols[i]})→wk${i+2}(${vols[i+1]}) = ${(ramp*100).toFixed(1)}% > 10%`);
    }
  }

  // ── Rail 2: taper race-week volume 50–60% of peak ────────────────────────────
  if (!isGeneral) {
    const taperWeeks = weeks.filter(w => w.weekPhase === 'taper');
    if (taperWeeks.length === 0) {
      fails.push('Rail2 TAPER: no taper week found');
    } else {
      const peakVol  = Math.max(...weeks.filter(w => !w.isDownWeek && w.weekPhase !== 'taper').map(w => w.weeklyVolumeMi));
      const raceWeekVol = taperWeeks[taperWeeks.length - 1].weeklyVolumeMi;
      const pct = raceWeekVol / peakVol;
      if (pct < 0.49 || pct > 0.61)
        fails.push(`Rail2 TAPER PCT: race week ${raceWeekVol}mi / peak ${peakVol}mi = ${(pct*100).toFixed(1)}% (need 50–60%)`);
    }
  }

  // ── Rail 3: no two hard days (run OR lift) adjacent ──────────────────────────
  const heavyDays = liftingLoad?.heavyLowerDays ?? [];
  for (let wi = 0; wi < weeks.length; wi++) {
    const hardRunDays = weeks[wi].sessions.filter(isHardSession).map(s => s.day);
    const allHard = [...new Set([...hardRunDays, ...heavyDays])];
    for (let a = 0; a < allHard.length; a++)
      for (let b = a + 1; b < allHard.length; b++)
        if (daysAdjacent(allHard[a], allHard[b]))
          fails.push(`Rail3 ADJACENCY: wk${wi+1} ${allHard[a]}↔${allHard[b]} adjacent`);
  }

  // ── Rail 4: long run ≤35% weekly volume; marathon caps ───────────────────────
  for (let wi = 0; wi < weeks.length; wi++) {
    const weekVol  = weeks[wi].weeklyVolumeMi;
    const longSess = weeks[wi].sessions.find(s => s.type === 'long');
    if (!longSess) continue;
    const lr = longSess.distanceMi;
    if (lr > weekVol * 0.401)
      fails.push(`Rail4 LONG>40%: wk${wi+1} long=${lr}mi vol=${weekVol}mi (${(lr/weekVol*100).toFixed(1)}%)`);
    if (distance === 'marathon') {
      const cap = experience === 'advanced' ? 22 : 20;
      if (lr > cap)  fails.push(`Rail4 MARATHON LONG: wk${wi+1} long=${lr}mi > cap ${cap}mi`);
      if (lr > 26.0) fails.push(`Rail4 NEVER 26.2: wk${wi+1} long=${lr}mi`);
    }
  }

  // ── Rail 5: down weeks on correct cadence ────────────────────────────────────
  if (!isGeneral) {
    const dc = experience === 'beginner' ? 3 : 4;
    for (let wi = 0; wi < weeks.length; wi++) {
      const w = wi + 1;
      const expected = (w % dc === 0) && phases[wi] !== 'taper';
      if (expected !== isDown[wi])
        fails.push(`Rail5 DOWN WEEK: wk${w} expected=${expected} got=${isDown[wi]} (cadence=${dc})`);
    }
  }

  // ── Rail 6: beginners get zero intervals in Base ──────────────────────────────
  if (!isGeneral && experience === 'beginner') {
    for (let wi = 0; wi < weeks.length; wi++) {
      if (phases[wi] !== 'base') continue;
      if (weeks[wi].sessions.some(s => s.type === 'intervals'))
        fails.push(`Rail6 BEGINNER INTERVAL IN BASE: wk${wi+1}`);
    }
  }

  // ── Rail 7: starting volume ≤ frequency support ───────────────────────────────
  const perRun = { beginner: 3.5, intermediate: 5, advanced: 7 }[experience] || 3.5;
  const freqSupport = (scenario.currentAbility.currentRunsPerWeek || 3) * perRun;
  if (vols[0] > freqSupport * 1.15)
    fails.push(`Rail7 START VOL: wk1=${vols[0]}mi > freqSupport ${freqSupport.toFixed(1)} × 1.15`);

  // ── Rail 8: taper never skipped ──────────────────────────────────────────────
  if (!isGeneral && phases[phases.length - 1] !== 'taper')
    fails.push(`Rail8 NO TAPER: last week phase='${phases[phases.length - 1]}'`);

  // ── Rail 9: no single easy run exceeds experience cap (item 1) ───────────────
  const easyCap = EASY_CAPS_CHECK[experience] || 12;
  for (let wi = 0; wi < weeks.length; wi++)
    for (const s of weeks[wi].sessions)
      if (s.type === 'easy' && s.distanceMi > easyCap)
        fails.push(`Rail9 EASY CAP: wk${wi+1} easy=${s.distanceMi}mi > cap ${easyCap}mi`);

  // ── Rail 10: threshold note effort is consistent with session distance (item 2)
  for (let wi = 0; wi < weeks.length; wi++) {
    for (const s of weeks[wi].sessions) {
      if (s.type !== 'threshold') continue;
      if (s.distanceMi < 3) continue;
      const eff = parseMainEffortMi(s.note);
      if (eff === null) {
        fails.push(`Rail10 NOTE: wk${wi+1} threshold ${s.distanceMi}mi note has no "Nmi @" pattern`);
      } else if (eff > s.distanceMi) {
        fails.push(`Rail10 NOTE: wk${wi+1} note effort ${eff}mi > session ${s.distanceMi}mi`);
      }
    }
  }

  // ── Rail 11: advanced late-Peak intervals use {interval1mi} (item 3) ──────────
  if (!isGeneral && experience === 'advanced') {
    const peakWks  = weeks.filter(w => w.weekPhase === 'peak');
    const latePeak = peakWks.slice(-2);
    for (const w of latePeak)
      for (const s of w.sessions)
        if (s.type === 'intervals' && s.pace !== '{interval1mi}')
          fails.push(`Rail11 INTERVAL1MI: wk${w.weekInPlan} advanced late-Peak uses ${s.pace} not {interval1mi}`);
  }

  // ── Rail 12: two taper weeks differ; race week is the lower (item 4) ─────────
  if (!isGeneral) {
    const taperWks = weeks.filter(w => w.weekPhase === 'taper');
    if (taperWks.length >= 2) {
      const first = taperWks[0].weeklyVolumeMi;
      const race  = taperWks[taperWks.length - 1].weeklyVolumeMi;
      if (first <= race)
        fails.push(`Rail12 TAPER DIFF: first taper ${first}mi ≤ race week ${race}mi (should be higher)`);
    }
  }

  // ── Rail 13: 3-day run-only Peak plans contain at least one intervals session (item 5)
  if (!isGeneral && scenario.runType === 'run-only' && (numDays ?? 0) <= 3) {
    const peakWks = weeks.filter(w => w.weekPhase === 'peak');
    if (peakWks.length > 0) {
      const hasIntervals = peakWks.some(w => w.sessions.some(s => s.type === 'intervals'));
      if (!hasIntervals)
        fails.push('Rail13 3DAY INTERVALS: 3-day Peak plan has no interval sessions');
    }
  }

  // ── Rail 14: general plan checks (item 6) ────────────────────────────────────
  if (isGeneral) {
    if (weeks.some(w => w.weekPhase === 'peak' || w.weekPhase === 'taper'))
      fails.push('Rail14 GENERAL: plan has peak/taper phase');
    if (weeks.some(w => w.projectedFinish !== null))
      fails.push('Rail14 GENERAL: projectedFinish non-null');
    const mv = Math.max(...vols), minV = Math.min(...vols);
    if (mv / minV > 1.20)
      fails.push(`Rail14 GENERAL: volume not flat (${minV}–${mv}mi, ratio ${(mv/minV).toFixed(2)})`);
  }

  // ── Rail 15: all maintenance sessions emit {maintenance} pace ─────────────────
  for (let wi = 0; wi < weeks.length; wi++) {
    for (const s of weeks[wi].sessions) {
      if (s.type !== 'maintenance') continue;
      if (s.pace !== '{maintenance}')
        fails.push(`Rail15 MAINTENANCE PACE: wk${wi+1} maintenance session uses '${s.pace}' not '{maintenance}'`);
    }
  }

  // ── Rail 16: no maintenance sessions in taper or down weeks ───────────────────
  for (let wi = 0; wi < weeks.length; wi++) {
    const w = weeks[wi];
    if (w.weekPhase !== 'taper' && !w.isDownWeek) continue;
    if (w.sessions.some(s => s.type === 'maintenance'))
      fails.push(`Rail16 MAINTENANCE IN TAPER/DOWN: wk${wi+1} phase=${w.weekPhase} isDown=${w.isDownWeek}`);
  }

  // ── Rail 17: long run is the longest session in every week (invariant) ────────
  for (let wi = 0; wi < weeks.length; wi++) {
    const longSess = weeks[wi].sessions.find(s => s.type === 'long');
    if (!longSess) continue;
    for (const s of weeks[wi].sessions) {
      if (s === longSess) continue;
      if (s.distanceMi > longSess.distanceMi)
        fails.push(`Rail17 LONG_LONGEST: wk${wi+1} ${s.type}(${s.distanceMi}mi) > long(${longSess.distanceMi}mi)`);
    }
  }

  // ── Rail 18: week-1 sessions anchored to longestRunMi (when provided) ─────────
  if (scenario.currentAbility.longestRunMi != null && scenario.currentAbility.longestRunMi > 0) {
    const lrm = scenario.currentAbility.longestRunMi;
    const lr1 = weeks[0].sessions.find(s => s.type === 'long');
    if (lr1 && lr1.distanceMi > lrm + 1)
      fails.push(`Rail18 WK1_LONG: week1 long=${lr1.distanceMi}mi > longestRunMi(${lrm})+1mi`);
    for (const s of weeks[0].sessions) {
      if (s.distanceMi > Math.max(lrm * 2, 3))
        fails.push(`Rail18 WK1_SESS: week1 ${s.type}=${s.distanceMi}mi > 2×longestRunMi=${Math.max(lrm*2,3)}mi`);
    }
  }

  // ── Rail 19: all session distances are valid rounding increments ───────────────
  // < 3 mi → nearest 0.25; 3–10 mi → nearest 0.5; > 10 mi → nearest 1
  for (let wi = 0; wi < weeks.length; wi++) {
    for (const s of weeks[wi].sessions) {
      const d = s.distanceMi;
      if (d <= 0) continue;
      let valid;
      if (d < 3)       valid = Math.abs(d * 4 - Math.round(d * 4)) < 0.001;
      else if (d <= 10) valid = Math.abs(d * 2 - Math.round(d * 2)) < 0.001;
      else              valid = Math.abs(d   - Math.round(d))       < 0.001;
      if (!valid)
        fails.push(`Rail19 ROUNDING: wk${wi+1} ${s.type}=${d}mi not a valid quarter/half/whole-mile increment`);
    }
  }

  return fails;
}

// ── Run matrix ────────────────────────────────────────────────────────────────

let totalScenarios = 0;
let totalPass = 0;
const failReport = [];

const GENERAL_WEEKS = 12;

console.log('\n═══════════════════════════════════════════════════════════════════════════════════════');
console.log('  Coach Macro — Run Engine Safety Rail Test Matrix (distance × goal × exp × days × type)');
console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
console.log('SCENARIO'.padEnd(62), 'D'.padStart(2), 'WKS'.padStart(4), 'PEAK'.padStart(6), 'LAST'.padStart(6), ' RESULT');
console.log('─'.repeat(92));

// ── Main parametric matrix (distances + general) ──────────────────────────────

const ALL_DISTANCES = [...DISTANCES, 'general'];

for (const distance of ALL_DISTANCES) {
  const isGeneral    = distance === 'general';
  const goalTypeList = isGeneral ? ['complete'] : GOAL_TYPES;
  const planWks      = isGeneral ? GENERAL_WEEKS : PLAN_WEEKS[distance];

  for (const goalType of goalTypeList) {
    for (const experience of EXPERIENCES) {
      for (const runType of ['run-only', 'hybrid']) {
        const dayList = DAY_TEMPLATES[runType][experience];
        for (const [numDays, days] of dayList) {
          totalScenarios++;

          const ability     = makeAbility(experience);
          const goalRace    = isGeneral ? { distance: 'general', goalSeconds: null }
                                        : makeGoalRace(distance, goalType, ability);
          const liftingLoad = makeLiftingLoad(runType);

          const allWeeks = [];
          for (let w = 1; w <= planWks; w++) {
            allWeeks.push(generateRunWeek(ability, goalRace, w, planWks, days, experience, liftingLoad));
          }

          const scenarioObj = { distance, goalType, experience, runType, totalWeeks: planWks, numDays, currentAbility: ability };
          const fails   = checkRails(scenarioObj, allWeeks, liftingLoad);
          const peakVol = Math.max(...allWeeks.filter(w => !w.isDownWeek && !['taper','general'].includes(w.weekPhase)).map(w => w.weeklyVolumeMi).filter(v => isFinite(v)), ...(isGeneral ? [allWeeks[0].weeklyVolumeMi] : []));
          const lastVol = allWeeks[allWeeks.length - 1].weeklyVolumeMi;

          const tag = `${distance.padEnd(8)} ${goalType.padEnd(9)} ${experience.padEnd(12)} ${runType.padEnd(8)} ${numDays}d`;
          const pass = fails.length === 0;
          if (pass) totalPass++;
          console.log(tag.padEnd(62), String(numDays).padStart(2), String(planWks).padStart(4), String(peakVol).padStart(6), String(lastVol).padStart(6), pass ? '  ✓ PASS' : '  ✗ FAIL');
          if (!pass) { failReport.push({ tag, fails }); for (const f of fails) console.log('    ↳', f); }
        }
      }
    }
  }
}

// ── DOMS-specific targeted scenarios (item 7) ─────────────────────────────────

function checkDOMSRails(label, allWeeks, heavyLowerDays) {
  const fails = [];
  for (let wi = 0; wi < allWeeks.length; wi++) {
    const w = allWeeks[wi];
    const hardRunDays = w.sessions.filter(isHardSession).map(s => s.day);
    for (const heavy of heavyLowerDays) {
      const heavyNum = { Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7 }[heavy];
      if (!heavyNum) continue;
      // Day 1 and 2 after heavy always blocked
      for (const offset of [1, 2]) {
        const blockedNum = ((heavyNum - 1 + offset) % 7) + 1;
        const blockedDay = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][blockedNum - 1];
        if (hardRunDays.includes(blockedDay))
          fails.push(`wk${wi+1} hard session on ${blockedDay} (day+${offset} after heavy ${heavy})`);
      }
    }
  }
  return fails;
}

const domsScenarios = [
  {
    // Mon heavy RC=3: Tue(day1)+Thu(day3) both DOMS-blocked; no quality can be placed
    label:    'DOMS cold-start RC=3: Tue+Thu blocked (day1+day3)',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 4, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: 'half', goalSeconds: null },
    experience: 'intermediate',
    days:     ['Tue','Thu','Sat','Sun'],
    liftLoad: { liftDaysPerWeek: 3, heavyLowerDays: ['Mon'] },
    planWks:  16,
    expectNoHardOn: ['Tue', 'Thu'],
  },
  {
    // Mon heavy RC=4: Tue(day1) still blocked; Thu(day3) freed at RC=4 → quality goes Thu
    label:    'DOMS high-RC RC=4: Tue still blocked, Thu allowed as quality',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 4, longestRunMi: null, recoveryCapacity: 4 },
    goalRace: { distance: 'half', goalSeconds: null },
    experience: 'intermediate',
    days:     ['Tue','Thu','Sat','Sun'],
    liftLoad: { liftDaysPerWeek: 3, heavyLowerDays: ['Mon'] },
    planWks:  16,
    expectNoHardOn:  ['Tue'],
    expectQualityOn: ['Thu'],
  },
  {
    label:    'DOMS long-run protection: heavy Fri → long run moved off Sat/Sun',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 3, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: 'half', goalSeconds: null },
    experience: 'intermediate',
    days:     ['Tue','Thu','Sat'],
    liftLoad: { liftDaysPerWeek: 3, heavyLowerDays: ['Fri'] },
    planWks:  16,
    expectLongRunNotOn: ['Sat'],
  },
  {
    label:    'DOMS personalized 24h peak: Thu unlocked even at RC=3',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 4, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: 'half', goalSeconds: null },
    experience: 'intermediate',
    days:     ['Tue','Thu','Fri','Sat'],
    liftLoad: {
      liftDaysPerWeek:3, heavyLowerDays:['Mon'],
      domsProfile: { peakHours: { quads: { hours:24, confidence:0.8 }, hamstrings: { hours:24, confidence:0.8 } } },
    },
    planWks:    12,
    // peakDayOffset=1 → only day 1 (Tue) blocked; Thu(day3) is beyond window → quality OK
    expectNoHardOn: ['Tue'],
    expectQualityOn: ['Thu'],
  },
];

for (const sc of domsScenarios) {
  totalScenarios++;
  const allWeeks = [];
  for (let w = 1; w <= sc.planWks; w++)
    allWeeks.push(generateRunWeek(sc.ability, sc.goalRace, w, sc.planWks, sc.days, sc.experience, sc.liftLoad));

  const fails = [];

  // DOMS window rail
  const domsViolations = checkDOMSRails(sc.label, allWeeks, sc.liftLoad.heavyLowerDays);
  fails.push(...domsViolations);

  if (sc.expectNoHardOn) {
    for (const day of sc.expectNoHardOn) {
      if (allWeeks.some(w => {
        const s = w.sessions.find(s => s.day === day);
        return s && isHardSession(s);
      })) fails.push(`expected no hard session on ${day} but found one`);
    }
  }
  if (sc.expectQualityOn) {
    // At least one build/peak week should have quality on this day
    const buildPeakWks = allWeeks.filter(w => ['build','peak'].includes(w.weekPhase));
    for (const day of sc.expectQualityOn) {
      const hasQuality = buildPeakWks.some(w => {
        const s = w.sessions.find(s => s.day === day);
        return s && (s.type === 'threshold' || s.type === 'intervals');
      });
      if (!hasQuality) fails.push(`expected quality session on ${day} in Build/Peak but none found`);
    }
  }
  if (sc.expectLongRunNotOn) {
    for (const day of sc.expectLongRunNotOn) {
      if (allWeeks.some(w => w.sessions.some(s => s.type === 'long' && s.day === day)))
        fails.push(`long run placed on ${day} (DOMS day-1/2 window — should be moved)`);
    }
  }

  const pass = fails.length === 0;
  if (pass) totalPass++;
  console.log((sc.label).padEnd(72), pass ? '  ✓ PASS' : '  ✗ FAIL');
  if (!pass) { failReport.push({ tag: sc.label, fails }); for (const f of fails) console.log('    ↳', f); }
}

// ── General-mode emphasis assertions (4b-2) ───────────────────────────────────

const _genAbility = { seconds5K: 25*60, currentRunsPerWeek: 3, longestRunMi: null, recoveryCapacity: 3 };
const _genGoal    = { distance: 'general', goalSeconds: null };
const _genDays    = ['Tue','Thu','Sat'];
const _genLift    = { liftDaysPerWeek: 0, heavyLowerDays: [] };
const _planWks    = 12;
const _exp        = 'intermediate';

const emphasisScenarios = [
  {
    label:    'General · endurance emphasis · long run ≥ 35% weekly vol',
    emphasis: 'endurance',
    check:    weeks => {
      const longFracs = weeks.map(w => {
        const lr = w.sessions.find(s => s.type === 'long');
        return lr ? lr.distanceMi / w.weeklyVolumeMi : 1;
      });
      const avgFrac = longFracs.reduce((a,b)=>a+b,0)/longFracs.length;
      return avgFrac >= 0.35
        ? null
        : `avg long-run fraction ${(avgFrac*100).toFixed(1)}% — expected ≥35%`;
    },
  },
  {
    label:    'General · speed emphasis · quality type = intervals',
    emphasis: 'speed',
    check:    weeks => {
      const qualityTypes = weeks.flatMap(w =>
        w.sessions.filter(s => s.type !== 'long' && s.type !== 'easy' && s.type !== 'maintenance').map(s => s.type)
      );
      const allThreshold = qualityTypes.every(t => t === 'threshold');
      if (allThreshold) return 'all quality sessions are threshold — expected intervals for speed emphasis';
      return null;
    },
  },
  {
    label:    'General · consistency emphasis · quality type = threshold',
    emphasis: 'consistency',
    check:    weeks => {
      const qualityTypes = weeks.flatMap(w =>
        w.sessions.filter(s => s.type !== 'long' && s.type !== 'easy' && s.type !== 'maintenance').map(s => s.type)
      );
      const nonThreshold = qualityTypes.filter(t => t !== 'threshold');
      return nonThreshold.length > 0
        ? `expected only threshold quality; found: ${[...new Set(nonThreshold)].join(', ')}`
        : null;
    },
  },
];

for (const sc of emphasisScenarios) {
  totalScenarios++;
  const weeks = [];
  for (let w = 1; w <= _planWks; w++)
    weeks.push(generateRunWeek(_genAbility, _genGoal, w, _planWks, _genDays, _exp, _genLift, sc.emphasis));
  const err = sc.check(weeks);
  const pass = err === null;
  if (pass) totalPass++;
  console.log(sc.label.padEnd(72), pass ? '  ✓ PASS' : '  ✗ FAIL');
  if (!pass) { failReport.push({ tag: sc.label, fails: [err] }); console.log('    ↳', err); }
}

// ── Maintenance session targeted scenarios ────────────────────────────────────
const maintenanceScenarios = [
  {
    label:    'Maintenance · general+endurance 4-day shows ≥1 maintenance session',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 3, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: 'general', goalSeconds: null },
    days:     ['Mon','Tue','Wed','Fri'], planWks: 12, exp: 'intermediate',
    liftLoad: { liftDaysPerWeek: 0, heavyLowerDays: [] }, emphasis: 'endurance',
    check: weeks => {
      const has = weeks.some(w => w.sessions.some(s => s.type === 'maintenance'));
      return has ? null : 'No maintenance session found across 12 weeks';
    },
  },
  {
    label:    'Maintenance · 2-day plan has NO maintenance (easyDays < 2)',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 2, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: '5k', goalSeconds: null },
    days:     ['Tue','Sat'], planWks: 8, exp: 'intermediate',
    liftLoad: { liftDaysPerWeek: 0, heavyLowerDays: [] }, emphasis: 'consistency',
    check: weeks => {
      const has = weeks.some(w => w.sessions.some(s => s.type === 'maintenance'));
      return has ? `2-day plan placed a maintenance session (only 1 easy day available)` : null;
    },
  },
  {
    label:    'Maintenance · never placed in taper week (race plan)',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 4, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: 'half', goalSeconds: null },
    days:     ['Tue','Wed','Thu','Sat'], planWks: 16, exp: 'intermediate',
    liftLoad: { liftDaysPerWeek: 0, heavyLowerDays: [] }, emphasis: 'consistency',
    check: weeks => {
      for (const w of weeks) {
        if (w.weekPhase !== 'taper') continue;
        if (w.sessions.some(s => s.type === 'maintenance'))
          return `Maintenance placed in taper week ${w.weekInPlan}`;
      }
      return null;
    },
  },
  {
    label:    'Maintenance · never adjacent to quality session',
    ability:  { seconds5K: 25*60, currentRunsPerWeek: 4, longestRunMi: null, recoveryCapacity: 3 },
    goalRace: { distance: 'half', goalSeconds: null },
    days:     ['Mon','Tue','Wed','Fri'], planWks: 16, exp: 'intermediate',
    liftLoad: { liftDaysPerWeek: 0, heavyLowerDays: [] }, emphasis: 'consistency',
    check: weeks => {
      const DAY_ORD = { Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:7 };
      const adj = (a,b) => { const da=DAY_ORD[a],db=DAY_ORD[b]; if(!da||!db) return false; const d=Math.abs(da-db); return d===1||d===6; };
      for (const w of weeks) {
        const qualDays = w.sessions.filter(s=>s.type==='threshold'||s.type==='intervals').map(s=>s.day);
        const maintDays = w.sessions.filter(s=>s.type==='maintenance').map(s=>s.day);
        for (const md of maintDays)
          for (const qd of qualDays)
            if (adj(md,qd)) return `Maintenance on ${md} adjacent to quality on ${qd} in wk${w.weekInPlan}`;
      }
      return null;
    },
  },
];

for (const sc of maintenanceScenarios) {
  totalScenarios++;
  const weeks = [];
  for (let w = 1; w <= sc.planWks; w++)
    weeks.push(generateRunWeek(sc.ability, sc.goalRace, w, sc.planWks, sc.days, sc.exp, sc.liftLoad, sc.emphasis));
  const err = sc.check(weeks);
  const pass = err === null;
  if (pass) totalPass++;
  console.log(sc.label.padEnd(72), pass ? '  ✓ PASS' : '  ✗ FAIL');
  if (!pass) { failReport.push({ tag: sc.label, fails: [err] }); console.log('    ↳', err); }
}

// ── Beginner 0-runs scenarios (Bug 2 + Bug 3 regression guard) ───────────────
// Covers: currentRunsPerWeek=0 + longestRunMi=1 — the exact profile that
// previously produced 7mi easy + 5mi long in week 1.

const beginnerScenarios = [
  {
    label:    'Beginner 0-runs (intermediate): wk1 ≤2mi/session, long is longest, no quality in base',
    ability:  { seconds5K: null, currentRunsPerWeek: 0, longestRunMi: 1, recoveryCapacity: 3 },
    goalRace: { distance: '10k', goalSeconds: null },
    experience: 'intermediate',
    days:     ['Mon','Wed','Fri','Sat'],
    planWks:  12,
    liftLoad: { liftDaysPerWeek: 0, heavyLowerDays: [] },
    checks: [
      // No session in week 1 exceeds 2mi
      weeks => {
        for (const s of weeks[0].sessions)
          if (s.distanceMi > 2)
            return `week1 ${s.type}=${s.distanceMi}mi — exceeds 2mi ceiling for 0-runs/longestRunMi=1`;
        return null;
      },
      // No 7mi+ run anywhere in week 1
      weeks => {
        const bad = weeks[0].sessions.find(s => s.distanceMi >= 7);
        return bad ? `week1 ${bad.type}=${bad.distanceMi}mi — must not prescribe 7mi+ to non-runner` : null;
      },
      // Long run is the longest in every week
      weeks => {
        for (let wi = 0; wi < weeks.length; wi++) {
          const lr = weeks[wi].sessions.find(s => s.type === 'long');
          if (!lr) continue;
          for (const s of weeks[wi].sessions)
            if (s !== lr && s.distanceMi > lr.distanceMi)
              return `wk${wi+1} ${s.type}(${s.distanceMi}mi) > long(${lr.distanceMi}mi)`;
        }
        return null;
      },
      // Base-phase weeks: no quality for true beginner (regardless of experience label)
      weeks => {
        for (let wi = 0; wi < weeks.length; wi++) {
          if (weeks[wi].weekPhase !== 'base') continue;
          const q = weeks[wi].sessions.find(s => s.type === 'threshold' || s.type === 'intervals');
          if (q) return `wk${wi+1} base has quality (${q.type}) for 0-runs athlete`;
        }
        return null;
      },
      // Week 1 sessions are not all identical distances (variation required)
      weeks => {
        const dists = weeks[0].sessions.map(s => s.distanceMi);
        if (dists.every(d => d === dists[0]))
          return `week1 all sessions identical (${dists[0]}mi) — need visible variety (easy / maintenance / long)`;
        return null;
      },
      // Long run strictly increases weeks 1→2 and 2→3 (down weeks exempt)
      weeks => {
        for (let i = 0; i < Math.min(3, weeks.length) - 1; i++) {
          if (weeks[i + 1].isDownWeek) continue;
          const lr  = weeks[i].sessions.find(s => s.type === 'long')?.distanceMi;
          const lr2 = weeks[i + 1].sessions.find(s => s.type === 'long')?.distanceMi;
          if (lr == null || lr2 == null) continue;
          if (lr2 <= lr)
            return `long run wk${i+2}(${lr2}mi) ≤ wk${i+1}(${lr}mi) — should increase`;
        }
        return null;
      },
    ],
  },
  {
    label:    'Beginner 0-runs (beginner exp): long-run-longest holds every week',
    ability:  { seconds5K: null, currentRunsPerWeek: 0, longestRunMi: 1, recoveryCapacity: 3 },
    goalRace: { distance: '10k', goalSeconds: null },
    experience: 'beginner',
    days:     ['Mon','Wed','Fri','Sat'],
    planWks:  12,
    liftLoad: { liftDaysPerWeek: 0, heavyLowerDays: [] },
    checks: [
      weeks => {
        for (let wi = 0; wi < weeks.length; wi++) {
          const lr = weeks[wi].sessions.find(s => s.type === 'long');
          if (!lr) continue;
          for (const s of weeks[wi].sessions)
            if (s !== lr && s.distanceMi > lr.distanceMi)
              return `wk${wi+1} ${s.type}(${s.distanceMi}mi) > long(${lr.distanceMi}mi)`;
        }
        return null;
      },
      weeks => {
        for (const s of weeks[0].sessions)
          if (s.distanceMi > 2)
            return `week1 ${s.type}=${s.distanceMi}mi — too large for non-runner`;
        return null;
      },
    ],
  },
];

for (const sc of beginnerScenarios) {
  totalScenarios += sc.checks.length;
  for (const check of sc.checks) {
    const weeks = [];
    for (let w = 1; w <= sc.planWks; w++)
      weeks.push(generateRunWeek(sc.ability, sc.goalRace, w, sc.planWks, sc.days, sc.experience, sc.liftLoad));
    const err = check(weeks);
    const pass = err === null;
    if (pass) totalPass++;
    console.log(sc.label.padEnd(72), pass ? '  ✓ PASS' : '  ✗ FAIL');
    if (!pass) { failReport.push({ tag: sc.label, fails: [err] }); console.log('    ↳', err); }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('─'.repeat(78));
console.log(`\n  ${totalPass}/${totalScenarios} scenarios passed\n`);

if (failReport.length === 0) {
  console.log('  All safety rails GREEN across the full matrix.\n');
  process.exit(0);
} else {
  console.log(`  ${failReport.length} scenario(s) FAILED:\n`);
  for (const { tag, fails } of failReport) {
    console.log(`  ✗ ${tag}`);
    for (const f of fails) console.log(`    · ${f}`);
    console.log();
  }
  process.exit(1);
}
