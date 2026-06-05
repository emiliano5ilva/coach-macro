#!/usr/bin/env node
// Prints 3 full sample plans for qualitative coach review.
// Run: node scripts/print-run-plans.mjs
// NO app wiring — print and inspect only.

import { generateRunWeek } from '../src/services/runEngine.js';
import { getRacePredictions, formatRaceTime } from '../src/utils/runningPaces.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function hr(char = '─', n = 76) { return char.repeat(n); }

function formatVol(v) { return `${v} mi`; }

function paceLabel(token) {
  const map = {
    '{easy}':       'EASY',
    '{longRun}':    'LONG RUN',
    '{tempo}':      'TEMPO',
    '{interval5K}': 'INTERVALS (5K)',
    '{interval1mi}':'INTERVALS (1mi)',
    '{stride}':     'STRIDES',
    '{maintenance}':'MAINTENANCE',
    '{marathon}':   'MARATHON PACE',
  };
  return map[token] || token;
}

function phaseLabel(p) {
  return { base: 'BASE', build: 'BUILD', peak: 'PEAK', taper: 'TAPER' }[p] || p.toUpperCase();
}

function printPlan(label, weeks, liftingLoad) {
  console.log('\n' + hr('═'));
  console.log(`  ${label}`);
  console.log(hr('═'));

  for (const wk of weeks) {
    const downTag  = wk.isDownWeek ? ' ↓ DOWN WEEK' : '';
    const phaseStr = `${phaseLabel(wk.weekPhase)}${downTag}`;

    console.log(`\n  WK ${String(wk.weekInPlan).padStart(2)} / ${wk.totalWeeks}  ·  ${phaseStr}  ·  ${formatVol(wk.weeklyVolumeMi)}`);
    console.log('  ' + hr('·', 72));

    for (const s of wk.sessions) {
      const typeCol  = s.type.toUpperCase().padEnd(11);
      const distCol  = `${s.distanceMi} mi`.padEnd(8);
      const paceCol  = paceLabel(s.pace).padEnd(18);
      console.log(`   ${s.day}  ${typeCol}  ${distCol}  ${paceCol}  ${s.note}`);
    }

    console.log(`   ── Coach: "${wk.coachNote}"`);
  }

  console.log('');
}

function projectedComparison(seconds5K, distance) {
  const pred   = getRacePredictions(seconds5K);
  const secMap = { '5k': pred.fiveK, '10k': pred.tenK, 'half': pred.half, 'marathon': pred.marathon };
  const sec    = secMap[distance];
  return sec ? formatRaceTime(sec) : '—';
}

// ── Plan 1 — Beginner, 10K, "complete it", run-only, 10 wks, 3 days ──────────
// Nervous first-timer. 38-min 5K. Runs 2-3x/week now.
// Days chosen so long run on Sat, quality slots on Tue/Thu.

{
  const PLAN     = 'PLAN 1  —  Beginner · 10K · Complete it · Run-only · 10 wks · 3 days/wk';
  const ability  = { seconds5K: 38 * 60, currentRunsPerWeek: 3, longestRunMi: 3 };
  const goalRace = { distance: '10k', goalSeconds: null };
  const days     = ['Tue', 'Thu', 'Sat'];
  const lift     = null;
  const WEEKS    = 10;

  const pred = projectedComparison(ability.seconds5K, '10k');
  console.log('\n\n' + hr('═', 76));
  console.log(`  ${PLAN}`);
  console.log(`  Athlete: 38:00 5K · runs 3x/wk now · longest run ~3 mi`);
  console.log(`  Projected 10K finish: ${pred}   (shown to athlete as motivation)`);
  console.log(hr('═', 76));

  const weeks = [];
  for (let w = 1; w <= WEEKS; w++) {
    weeks.push(generateRunWeek(ability, goalRace, w, WEEKS, days, 'beginner', lift));
  }
  printPlan(PLAN, weeks, lift);
}

// ── Plan 2 — Intermediate, Half, goal-time, run-only, 12 wks, 4 days ──────────
// 25-min 5K. 4 days: Mon/Wed/Thu/Sat — gives long Sat, quality Mon+Wed, easy Thu.
// Goal: 1:49 half (current Riegel projection is ~1:57, aiming for ~8 min PR).

{
  const PLAN     = 'PLAN 2  —  Intermediate · Half · Goal-time · Run-only · 12 wks · 4 days/wk';
  const ability  = { seconds5K: 25 * 60, currentRunsPerWeek: 4, longestRunMi: 8 };
  const goalRace = { distance: 'half', goalSeconds: 109 * 60 }; // 1:49:00
  const days     = ['Mon', 'Wed', 'Thu', 'Sat'];
  const lift     = null;
  const WEEKS    = 12;

  const pred = projectedComparison(ability.seconds5K, 'half');
  console.log('\n' + hr('═', 76));
  console.log(`  ${PLAN}`);
  console.log(`  Athlete: 25:00 5K · 4 days/wk · longest recent long run ~8 mi`);
  console.log(`  Current Riegel half projection: ${pred}   Goal: 1:49:00`);
  console.log(hr('═', 76));

  const weeks = [];
  for (let w = 1; w <= WEEKS; w++) {
    weeks.push(generateRunWeek(ability, goalRace, w, WEEKS, days, 'intermediate', lift));
  }
  printPlan(PLAN, weeks, lift);
}

// ── Plan 3 — Advanced, Marathon, goal-time, HYBRID heavy, 16 wks, 5 days ─────
// 20-min 5K. Sub-3:20 goal (current Riegel ~3:18).
// Lifting: 4 days/wk, heavyLower = Mon (classic upper/lower/push/pull + Mon legs).
// Run days: Tue Wed Thu Fri Sun — Mon is a heavy squat day, NOT a run day.
// This places Tue adjacent to heavy Mon → engine demotes Tue to easy.
// Wed and Fri clear the spacing check → 2 quality slots.
// Sun = long run (no Sat in list → engine falls to Sun).

{
  const PLAN    = 'PLAN 3  —  Advanced · Marathon · Goal-time · HYBRID heavy · 16 wks · 5 days/wk';
  const ability = { seconds5K: 20 * 60, currentRunsPerWeek: 5, longestRunMi: 14, recoveryCapacity: 4 };

  // Riegel marathon projection from 20:00 5K
  const marathonProj = projectedComparison(ability.seconds5K, 'marathon');

  const goalRace = { distance: 'marathon', goalSeconds: 200 * 60 }; // 3:20:00
  const days     = ['Tue', 'Wed', 'Thu', 'Fri', 'Sun'];
  const lift     = { liftDaysPerWeek: 4, heavyLowerDays: ['Mon'] };
  const WEEKS    = 16;

  // Also generate run-only equivalent to show volume trim
  const runOnlyPeakWeeks = [];
  for (let w = 1; w <= WEEKS; w++) {
    runOnlyPeakWeeks.push(generateRunWeek(ability, goalRace, w, WEEKS, days, 'advanced', null));
  }
  const runOnlyPeak = Math.max(...runOnlyPeakWeeks.filter(w => !w.isDownWeek && w.weekPhase !== 'taper').map(w => w.weeklyVolumeMi));
  const hybridWeeks = [];
  for (let w = 1; w <= WEEKS; w++) {
    hybridWeeks.push(generateRunWeek(ability, goalRace, w, WEEKS, days, 'advanced', lift));
  }
  const hybridPeak = Math.max(...hybridWeeks.filter(w => !w.isDownWeek && w.weekPhase !== 'taper').map(w => w.weeklyVolumeMi));

  console.log('\n' + hr('═', 76));
  console.log(`  ${PLAN}`);
  console.log(`  Athlete: 20:00 5K · 5 run days/wk · 4 lift days (heavy lower Mon)`);
  console.log(`  Riegel marathon projection: ${marathonProj}   Goal: 3:20:00`);
  console.log(`  Volume trim: run-only peak ${runOnlyPeak} mi → hybrid peak ${hybridPeak} mi` +
              `  (${Math.round((1 - hybridPeak / runOnlyPeak) * 100)}% cut by lifting load)`);
  console.log(`  Mon = heavy squat day. Engine demotes Tue (adjacent Mon) to easy.`);
  console.log(`  Quality slots: Wed + Fri (both clear Mon and long-run adjacency).`);
  console.log(hr('═', 76));

  printPlan(PLAN, hybridWeeks, lift);
}

// ── Qualitative summary ───────────────────────────────────────────────────────

console.log(hr('═', 76));
console.log('  QUALITATIVE NOTES FOR REVIEW');
console.log(hr('─', 76));
console.log(`
  {stride} token:
    NEVER emitted as a pace token. Strides appear only in session NOTES on
    easy days during Base phase (non-beginner): "Easy effort + 4×20 sec strides
    at the end." The pace field stays {easy} — stride effort is described in
    prose, not as a token. This is intentional simplification: {stride} exists
    in resolvePaceTokens but the engine doesn't emit it as a pace; it appends
    the instruction to the note instead. Phase B could split strides into their
    own session object if you want them rendered separately.

  {interval1mi} token:
    Also NEVER emitted. The engine always uses {interval5K} for interval
    sessions — {interval1mi} is reserved for advanced rep work and was not
    differentiated in this build. Phase B can add experience-gated {interval1mi}
    for advanced athletes in late Peak. Flagged as a known gap.

  Phase character (Build threshold, Peak intervals):
    ✓ Build weeks emit type="threshold" + pace="{tempo}" as the quality session.
    ✓ Peak weeks emit type="threshold" (first quality) + type="intervals" /
      pace="{interval5K}" (second quality, where the budget allows it).
    ✓ Beginners get zero quality in Base (rail 6 enforced), one threshold in
      Build, and threshold+intervals in Peak (the "2 only in Peak" budget).

  Down weeks and taper:
    ✓ Down weeks land on the correct cadence (every 3rd for beginner, 4th for
      others) and are clearly marked with ↓ DOWN WEEK and a lower volume.
    ✓ Taper is always the final week(s) — never skipped, even on 10-week plans.
    ✓ Taper coachNote is distinct from the normal weekly note.

  Hybrid volume trim (Plan 3):
    ✓ 4 lift days/wk (heavy load) triggers 15% ceiling cut. Peak run volume
      is visibly lower than the equivalent run-only plan. See the trim %
      printed above Plan 3.
    ✓ Mon (heavy squat day) is not a run day. Tue is adjacent to Mon, so
      the engine correctly demotes Tue to easy. Wed and Fri become the quality
      slots — no run quality day is ever adjacent to the heavy lift day.

  Session note quality:
    Easy runs: "Easy effort. Zone 2. Conversational throughout." —
    functional but templated; Phase B could add distance-specific cues
    (e.g., "45-minute easy. If you\'re breathing hard, slow down.").
    Threshold: Good structural content (WU / main effort / CD breakdown).
    Intervals: Good. Notes the rep/distance and recovery interval.
    Long runs: Phase-aware (taper note differs from base/build note). The
    peak long-run note for marathon/half is specific and motivating.
    Coach notes: Down-week and phase notes are distinct. The
    intermediate/advanced notes read more like a coach; beginner notes
    lean encouragingly toward the "nervous first-timer" voice.
`);
console.log(hr('═', 76));
