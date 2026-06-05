// Test harness for deriveDayModality — 4 required cases.
// Run: node scripts/test-day-modality.mjs
import { deriveDayModality } from '../src/running_programs.js';

let pass = 0, fail = 0;

function check(label, got, expected) {
  const sortedGot = [...got].sort();
  const sortedExp = [...expected].sort();
  const ok = JSON.stringify(sortedGot) === JSON.stringify(sortedExp);
  console.log(`  ${ok ? '✓' : '✗'} ${label}: [${sortedGot.join(', ')}]${ok ? '' : ` — expected [${sortedExp.join(', ')}]`}`);
  ok ? pass++ : fail++;
}

// ── Case (a): explicit dayPlan ────────────────────────────────────────────────
// Hybrid user who has gone through onboarding and has a full dayPlan set.
// Mon/Wed/Fri = lift only (Mon heavy_lower, Wed upper, Fri heavy_lower)
// Tue/Thu = run only; Sat/Sun = rest
{
  console.log('\n(a) Explicit dayPlan — should use it directly, ignore schedule');
  const profile = { run_race_type: 'half' };
  const wPrefs = {
    isHybrid: true,
    dayPlan: {
      Mon: { run: false, lift: true,  liftFocus: 'heavy_lower' },
      Tue: { run: true,  lift: false, liftFocus: null },
      Wed: { run: false, lift: true,  liftFocus: 'upper' },
      Thu: { run: true,  lift: false, liftFocus: null },
      Fri: { run: false, lift: true,  liftFocus: 'heavy_lower' },
      Sat: { run: false, lift: false, liftFocus: null },
      Sun: { run: false, lift: false, liftFocus: null },
    },
  };
  const schedule = { Mon:'training',Tue:'training',Wed:'training',Thu:'training',Fri:'training',Sat:'rest',Sun:'rest' };
  const { runDays, liftDays, heavyLowerDays } = deriveDayModality(profile, wPrefs, schedule);
  check('runDays',        runDays,        ['Tue','Thu']);
  check('liftDays',       liftDays,       ['Mon','Wed','Fri']);
  check('heavyLowerDays', heavyLowerDays, ['Mon','Fri']);
}

// ── Case (b): run-only fallback ───────────────────────────────────────────────
// Pure running account: run_race_type set, not hybrid, no dayPlan.
// All training days become runDays; liftDays and heavyLowerDays are empty.
{
  console.log('\n(b) Run-only fallback (no dayPlan, not hybrid)');
  const profile = { run_race_type: 'half' };
  const wPrefs  = { isHybrid: false, splitType: 'Half Marathon' };
  const schedule = { Mon:'rest',Tue:'training',Wed:'rest',Thu:'training',Fri:'rest',Sat:'training',Sun:'rest' };
  const { runDays, liftDays, heavyLowerDays } = deriveDayModality(profile, wPrefs, schedule);
  check('runDays',        runDays,        ['Tue','Thu','Sat']);
  check('liftDays',       liftDays,       []);
  check('heavyLowerDays', heavyLowerDays, []);
}

// ── Case (c): hybrid, no dayPlan, PPL inference (ppl_6 demo account) ─────────
// splitType "Push/Pull/Legs x2", 6 training days Mon–Sat.
// Cycle: Push Pull Legs Push Pull Legs → legs on Wed and Sat.
{
  console.log('\n(c) Hybrid, no dayPlan, PPL x2 inference (ppl_6 demo)');
  const profile = { run_race_type: 'half' };
  const wPrefs  = { isHybrid: true, splitType: 'Push/Pull/Legs x2' };
  const schedule = {
    Mon:'training',Tue:'training',Wed:'training',
    Thu:'training',Fri:'training',Sat:'training',Sun:'rest',
  };
  const { runDays, liftDays, heavyLowerDays } = deriveDayModality(profile, wPrefs, schedule);
  // All training days are both run and lift (no dayPlan to separate them yet)
  check('runDays',        runDays,        ['Mon','Tue','Wed','Thu','Fri','Sat']);
  check('liftDays',       liftDays,       ['Mon','Tue','Wed','Thu','Fri','Sat']);
  // Cycle[0]=Push Mon, [1]=Pull Tue, [2]=Legs Wed, [3]=Push Thu, [4]=Pull Fri, [5]=Legs Sat
  check('heavyLowerDays', heavyLowerDays, ['Wed','Sat']);
}

// ── Case (d): hybrid, no dayPlan, no inferable program → [] ──────────────────
// splitType is something the cycle map doesn't know (e.g. "GVT"), so
// heavyLowerDays must be [] rather than a wrong guess.
{
  console.log('\n(d) Hybrid, no dayPlan, unknown program → heavyLowerDays = []');
  const profile = { run_race_type: 'half' };
  const wPrefs  = { isHybrid: true, splitType: 'GVT' };
  const schedule = { Mon:'training',Tue:'rest',Wed:'training',Thu:'rest',Fri:'training',Sat:'rest',Sun:'rest' };
  const { runDays, liftDays, heavyLowerDays } = deriveDayModality(profile, wPrefs, schedule);
  check('runDays',        runDays,        ['Mon','Wed','Fri']);
  check('liftDays',       liftDays,       ['Mon','Wed','Fri']);
  check('heavyLowerDays', heavyLowerDays, []);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`${pass + fail} checks — ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
