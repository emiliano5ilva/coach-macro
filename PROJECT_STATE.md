# PROJECT_STATE.md — Coach Macro

> Canonical "where we are" doc. **Claude Code reads this at the start of every session and
> updates it at the end**, so a fresh session never starts cold. Keep it terse and current.
>
> **⚠️ Source of truth: THIS file.** The 3 Google Drive docs (Project State & Next Up · Design System ·
> Growth Mechanics) are **STALE** — last real update **Jun 15**, predating the Apple Health, program-drift
> Stage 5, onboarding-completion, and RunProgramSetup input-fix work. Treat the Drive docs as **reference/archive
> only**; reconcile anything still useful from them into this file, then trust this file going forward.

_Last updated: 2026-06-23 — Stage 5 arc COMPLETE; BUG 2, A, B, day-selection "caps at 4" all DONE & verified on-device; morning-brief "didn't load" → NOT a defect. **🔴 NEW PRE-SUBMISSION SECURITY BLOCKER logged: dev-skip is a production backdoor (5-tap logo → auth + paywall bypass; hardcoded creds in bundle) — must remove before App Store.** Open housekeeping: restore the `d3d00001` drift fixture (currently `c25k`). Follow-ups: hybrid run/lift dayPlan split (branch `goclub-redesign`)._

---

## STACK & PATHS
- **Stack:** Capacitor v5 + React 18 + Vite, running in **WKWebView** (native iOS shell).
- **Repo:** `~/Developer/coach-macro` — working branch **`goclub-redesign`** (default branch is `main`).
- **Feature flag:** `GOCLUB_REDESIGN`.
- **Supabase project:** `oxxihlwqukbakmnnavuy` (region us-east-2). Inspect/logs/SQL via the Supabase MCP.
- **Device (physical test iPhone):** UDID `00008110-000C149636EA401E` (iPhone 13 Pro Max, iOS 17.7).
  Paired for **wireless debugging** (`iPhone-3.coredevice.local`) — cable not required when it shows
  `available (paired)` in `xcrun devicectl list devices`. Keep it unlocked/awake during builds.
- **Mandatory build chain** (the `rm -rf` prefix is required — stale `public/` causes ghost builds):
  ```sh
  rm -rf ios/App/App/public && npm run build:sim && npx cap copy ios && npx cap sync ios && \
  xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Debug \
    -destination "platform=iOS,id=00008110-000C149636EA401E" -derivedDataPath /tmp/coach-macro-device build && \
  xcrun devicectl device install app --device 00008110-000C149636EA401E \
    /tmp/coach-macro-device/Build/Products/Debug-iphoneos/App.app && \
  xcrun devicectl device process launch --device 00008110-000C149636EA401E com.coachmacro.app
  ```
  - Compile-only (no device): swap destination for `-destination 'generic/platform=iOS'`.
  - Each successful web build prints a fresh `dist/assets/NativeApp-<hash>.js` — use it to confirm the build is current.
- **⚠️ Do NOT confuse with `~/CoachMacro`** — that is a *separate* React Native side-project. All work
  here is the Capacitor app at `~/Developer/coach-macro`.

---

## DONE & VERIFIED (recent)
- **Apple Health: reads + HRV + workout-WRITE all working end-to-end on device** (commits **`bbe5cb8`**, **`7ef0ae2`**, **`234e360`**).
  HRV reads confirmed (`ah_hrv_ok`) — supersedes the older "HRV pending device verification" note. Technical detail:
  - Native-bridge **stall** fixed — `hk()` returned the Capacitor plugin proxy from an `async` fn; the proxy is
    thenable (no `then` guard) → `await hk()` hung forever. Fixed via non-thenable `{ kit }` container.
  - Method name `querySampleType` → **`queryHKitSampleType`**; query keys `stepCount`, HRV.
  - HRV via `patch-package` (`patches/@perfood+capacitor-healthkit+1.3.2.patch`): native `getTypes` + `getSampleType`
    + `generateOutput`(→ms); plus the `saveWorkout` `@objc` method + `.m` registration in the same patch.
  - Per-call timeouts (import/isAvailable 8s, requestAuth 30s, getters 10s, saveWorkout 4s) + `ah_*` breadcrumbs (with `tier`/`bmr`).
  - **Biometric active-energy** (Mifflin-St Jeor, **active-only `(MET−1)`**, two-tier) unified across **lifting/run/HYROX**
    via shared `src/utils/calorieEstimate.js` → `estimateActiveKcal`; feeds in-app ring + DB `calories_burned` + HK write.
    **Run distance wired** (GPS + manual → real `distanceMeters`). Lifting + HYROX writes verified on-device; Tier-2 graceful
    degradation verified on-device (demo has null DOB → `tier:2`, `bmr:null`, never NaN/0); Tier 1 verified via parity (`bmr:1699`).
- **Program-drift resolver Stages 1–4** — `resolveProgram()` / `selectDayKey()` canonical sources; Train tab migrated;
  race-countdown gate; week-counter sourced from profile load (commit **`1ce6c3f`**).
- **Today-tab program-switch drift — RESOLVED** (was OPEN bug #1; commits **`bb274b9`**, **`0c5d52c`**, **`4782a36`**, **`11ca449`**).
  The morning-brief service (`morningBriefService.js` → `resolveProgram` `_mode` + `selectDayKey`/`baseName` day label) and the
  Today workout-for-the-day section (`ob_screens2.jsx` `_todayMode = resolveProgram(...).mode`; day label = `dayFocus[todayKey]`,
  which `NativeApp` builds via `selectDayKey`+`baseName`) now read the **identical canonical sources Train uses** — Today, Train,
  and the brief can't drift from each other. Verified consistent on drift account `d3d00001` (`_libraryId=hyrox_8w` → all three resolve to hyrox).
- **Upper/Lower split-day title-vs-exercises mismatch — RESOLVED by Stage 6** (commit **`11ca449`**, 2026-06-20 21:51 — *after* the
  Jun-20 screenshot). Both the day **title** (`dayFocus` → `selectDayKey`+`baseName`) and the day **exercises**
  (`getWorkoutForDay`, which internally calls `selectDayKey(splitType, daysPerWeek, schedule, programStartDate, dayOffset)` when
  schedule+anchor present) now derive "which split day" from **one** schedule-aware, `program_start_date`-anchored walk with matching
  args (same `splitType`, `daysPerWeek`, `dayOffset 0` for today). Retired the `SPLIT_CYCLES` dual-vocabulary that caused the desync.
  (No live Upper/Lower row in DB to spot-check; aligned by code analysis.)
- **Session restore / workout-save** — v2 storage-key fix, `processLock` auth hardening, distinct-day session count —
  all shipped (supersedes the Jun 19 "workouts not saving" priority docs).
- **Onboarding completion — FULLY FIXED & verified on-device** — breadcrumb-confirmed (`plan_confirm_write_ok` **+** `plan_confirm_pre_nav`,
  no error this run); row `_libraryId=upper_lower` / `split=Upper/Lower` / `plan_built=true`; screen lands on **Today (5-tab) in-session**.
  Three layers (instrumentation found the real cause — the await/timer theory was wrong):
  - **Real root cause (the in-session no-nav bug):** `onProtocolRefetch` (`ob_screens2.jsx:11313`) chained `.catch()` directly onto a
    `sb.from(...).delete().eq().eq()` **Postgrest thenable** — which has `.then` but **no `.catch`** → `catch is not a function` thrown
    **synchronously** right after the write resolved, aborting `handleConfirm` *before* `_spb(true)` / `setSection("today")`. Fix:
    `.catch(()=>{})` → **`.then(()=>{},()=>{})`**. Disproved the earlier await/timer-throttle hypothesis: breadcrumbs showed
    `write_ok` fired, `pre_nav` never did, and `plan_confirm_error` named the exact line.
  - **Sibling sweep (same misuse):** fixed 2 more **live** sites — `NativeApp.jsx` (bodyweight starter-log upsert) and
    `services/coachMemoryService.js` (coach-memory upsert; was `await …catch` → also throws since `.catch` evaluates before `await`).
    Audited all **236** `.catch(` in `src/`: no other live occurrences (5 remaining are in dead `src/_legacy/`, not imported/bundled — left as-is).
  - **Hardening retained (correct, though NOT the cause):** (a) single **atomic timeout-guarded upsert** (`ob_screens2.jsx:4354`,
    `Promise.race` 15s) writes `wprefs`+`schedule`+`profile_data`+`plan_built` together (no half-apply; replaced upsert + separate
    `markPlanBuilt`); (b) **nav de-coupled from any awaited `setTimeout`** — `setSection("today")` + `setSaving/setBuilding(false)`
    now fire synchronously after the write (dropped the cosmetic 1.5s "Building…" minimum so a throttled WKWebView timer can't wedge nav).
  - **Instrumentation kept:** `plan_confirm_write_ok` / `plan_confirm_pre_nav` / `plan_confirm_error` breadcrumbs + the `_crumb`
    helper (`ob_screens2.jsx:4279`) — **KEEP for now** (cheap observability on the critical onboarding path); gate/strip with the
    `ah_*` diagnostic breadcrumbs pre-release.
- **Design system locked** — Me tab, Today/Train/Fuel reskins, weight logging, security/RLS.

---

## 🔴 PRE-SUBMISSION BLOCKERS (security — CANNOT SHIP with these present)
- 🔴 **SECURITY — dev-skip is a PRODUCTION BACKDOOR.** `showDevSkip = import.meta.env.DEV || localStorage.devmode==='true'`;
  the **5-tap-logo gesture** (`handleLogoTap`, `NativeApp.jsx:253-264`) sets `localStorage.devmode='true'` → in a **PROD build**
  this exposes: (a) the dev-skip button + **autologin into hardcoded creds `testuser@coachm.dev` / `CoachTest123!` that SHIP IN
  THE BUNDLE**, (b) `isDevAccount` **subscription bypass** (`:545`), (c) `devEmail` **paywall-skip** (`:908`). Anyone can tap the
  logo 5× in the shipped app to **bypass auth AND payment**. ~10 sites: `showDevSkip:252`, `VITE_AUTO_DEVMODE:251`,
  `handleLogoTap:253-264`, `handleDevSkip:267`, `handleOnboardingTest:306`, buttons `:422/425/484/487`, `isDevAccount:545`,
  `devEmail:908`. **MUST be removed before submission.** Kept through dev (drives testuser/dev-skip testing); remove + on-device
  welcome/signin glance at submission time. **BLOCKER — cannot ship with this present.**

---

## OPEN — correctness bugs (highest priority)
- ✅ **RunProgramSetup time inputs auto-dismiss keyboard (~2s) — FIXED & verified keyboard-free on-device** (bundle `NativeApp-bc47f05d`).
  Root cause found: the TrainSection eyebrow rotator (`sections.jsx:2225` `_switchProgIdx`, 2.5s `setInterval`) kept ticking with
  no `trainScreen` guard → re-rendered all of TrainSection (incl. the library sub-screen's `RunProgramSetup` time `<input>`s) every
  ~2.5s → dismissed the iOS soft keyboard. Two fixes applied:
  - **FIX 1 (root cause):** gated the interval `if(_trainEyeRedMo || trainScreen!=='today')return;` + added `trainScreen` to deps
    (`sections.jsx:2226`). `_switchProgIdx` is consumed at exactly one site (`sections.jsx:5002`, the eyebrow), so pausing it off
    the main screen has no side effect.
  - **FIX 2 (robust + polished):** ported the Me-tab `Rolodex` wheel (keyboard-free) into `TimeInputMMSS`/`HMSInput`
    (`RunProgramSetup.jsx`) via a new `WheelField` wrapper. Value contract UNCHANGED — each wheel emits the same numeric string
    into the same setter → `parseMMSS`/`parseHMS` → identical total seconds → identical saved keys (`baselineTime`/
    `currentTotalTime`/`goalTime`/`goalTotalTime`). Empty run fields show a dimmed/red "needs input" treatment; CTA stays disabled
    until set. `raceDate` (`type="date"`) left as-is.
  - **Verified on-device:** scroll-wheel time entry works keyboard-free (no ~2s dismiss). The separate `runProfile` persistence
    failure turned out NOT to be the keyboard — it was the `doActualSwitch` profile_data clobber (see BUG 1 below).
  - **FOLLOW-UP (minor, tracked):** brief visual flicker on the wheels (cosmetic) — investigate later; not blocking.
  - **FOLLOW-UP (separate, real users hit it):** the **running goal-time** field (`RunProgramSetup.jsx:637`, `TimeInputMMSS`) is
    **MM:SS** and is shown for `half` and `full` goal distances — a half goal (~90–150 min) and a full (~180–360 min) both exceed
    the MM cap of 99, so those runners can't enter a goal time. Pre-existing (old `<input max=99>` had the same ceiling). Fix: give
    `half`/`full` goals an H:MM:SS field (use `HMSInput`). Not done here.
- ✅ **`doActualSwitch` profile_data clobber — FIXED & VERIFIED ON-DEVICE** (`ProgramLibrary.jsx`). On a fresh Balanced Hybrid
  setup (`d3d00001`), `profile_data.runProfile` **populated and survived the switch** — `baselineTime=660` (11:00 mile) /
  `goalTime=1963` (32:43) stored as correct total-seconds, `has_runProfile=true`. The clobber no longer drops the runProfile.
  Library program switches with a calorie change (`calc.delta!==0`) overwrote `profile_data` with the **stale React `profile` closure**,
  dropping the `runProfile`/`hyroxProfile` that `RunProgramSetup.saveRunProfile` had just written → run/hybrid setup data never
  persisted (the real cause of `has_runProfile=false` — NOT the keyboard, and NOT a dual client: `client.js` just re-exports
  `supabase.js`'s single `sb`). Fix: re-fetch current `profile_data` and merge only the nutrition keys onto it (read-then-merge, like
  `mergeProfileData`), with a fetch-failure guard that skips the `profile_data` write rather than wiping. Ordering confirmed:
  `await saveRunProfile` commits before `onConfirm → confirmSwitch → doActualSwitch` re-fetch.
- ✅ **BUG 2 — phantom 5K on hybrid — DONE & VERIFIED on-device.** Race is now OPTIONAL.
  Root cause (write-path ruled out by the breadcrumb test): the "5K" came from the **INPUT** forcing a distance
  (`runProfile.goalDistance="5k"`, a write-only field) + render `||'5k'` fallbacks — NOT a `run_race_type` column writer.
  Fix (`RunProgramSetup.jsx` + `sections.jsx`): "Training for a race?" **toggle** (default OFF for `program.isHybrid`, ON for
  pure-run); CTA relaxed + `proceedToConfirm` goal-validation gated on `raceGoal`; **no-race `saveRunProfile` branch** stores
  `raceGoal:false` and **omits** `goalDistance`/`goalTime`/`raceDate` (never writes `run_race_type`/`run_race_date`); Step 5 +
  red-hero show **"General Fitness"**. Verified on-device: no-race hybrid still gets run days + paces, no phantom 5K/countdown;
  race path persists `raceDate` and the countdown shows on load. (`runProfile.goalDistance`/`goalTime` confirmed write-only —
  zero readers; run engine derives distance from the `run_race_type` column null→`'5k'` zones, with a `'general'` path.)
  Breadcrumbs reverted across all 4 files.
- ✅ **In-session `runProfile` staleness — FIXED & VERIFIED on-device** (commit `3f1b83c`, the "A" fix). `doActualSwitch` now
  re-fetches `profile_data` up front, writes `run_race_date` to the **column** from the freshly-saved `runProfile.raceDate` on a
  run/hybrid target (null-safe → BUG 2 preserved; fetch-fail → preserve), and propagates `run_race_date` + `runProfile` into the
  `onProfileUpdate` React patch. Race countdown/paces now refresh **in-session** (no relaunch); also feeds the other
  `run_race_date`-column readers. Verified: in-session countdown on a race switch, no phantom on a no-race switch.
- ✅ **Run/hybrid day selection ignored ("caps at 4") — FIXED & VERIFIED on-device** (commit `572f811`). User-picked 5–6
  training days persisted to `runProfile.trainDays` but never rebuilt the schedule — `activateProgramMode` retyped the prior
  program's schedule, silently capping at the old day count. Now `activateProgramMode` takes `trainDays` and rebuilds the schedule
  from it when present+non-empty (selected → `dayType`, rest → `'rest'`; **exact selection, no cap**), else the retype-preserve
  fallback (lifting switches, which carry no `trainDays`); `doActualSwitch` threads `_freshRun.trainDays` from the existing A
  re-fetch (one read). Verified on `d3d00001`: 5-day `c25k` pick → 5 run days, `trainDays == schedule`, no cap.
- ✅ **Morning brief "didn't load" on run account — INVESTIGATED, NOT a defect.** Stale-cache/date-rollover blip (a `2026-06-22`
  cached brief while the device rolled to `2026-06-23`); self-resolved on cache-clear + reload. The brief **regenerates correctly
  for run/no-race** — verified via a fresh `morning_briefs` row (coherent `c25k` content) and **zero `brief_error` breadcrumbs**.
  The static pass was right: no unguarded null-read on the run/no-race path. (Temporary `brief_error` breadcrumb reverted.)
- **BUG/GAP — hybrid run/lift day split not generated from `trainDays`** — OPEN. `RunProgramSetup` collects no per-day run/lift
  assignment and builds no `dayPlan`; only onboarding does. So a hybrid set up via program-switch has **no `dayPlan`** →
  `deriveDayModality` Path 3 (degenerate: every training day = both run AND lift) AND `sections.jsx:2543` gates `hybridModality`
  on `dayPlan`, so the hybrid run-day UI doesn't compute. The day-COUNT fix (schedule-rebuild above) does NOT address this.
  **DESIGN SETTLED (recon 06-23):** extract onboarding's existing inline generator (`_infPlan`, `ob_screens2.jsx`
  `run_daymodality` step) into a shared `buildHybridDayPlan(trainDays, splitType)` in `running_programs.js` (reuses the
  already-present `HEAVY_LOWER_CYCLES`/`HEAVY_LOWER_LABELS` — the onboarding `_CYCS`/`_HEAVY_LABELS` were verified
  byte-identical dups). Wire into `activateProgramMode` (hybrid target + `trainDays` present → set `wPrefsUpdate.dayPlan`)
  and refactor onboarding to call the shared fn. Heuristic VERBATIM (lifts = `min(cycle-len | floor(n/2) | 3, n−2)`, ≥1,
  reserve ~2 runs). **BUILT (Pass 2, `NativeApp-df7bb7ec.js`) — onboarding parity proven byte-identical; NOT yet
  committed.** Pass 2 also resolved the original "generic upper" wrinkle via `HYBRID_TEMPLATE_CYCLES` (hybrid template
  name → a real lift-split cycle: Strength-Biased→PPL, Run-Biased/Balanced/Foundation→Upper/Lower, Tactical→PPL; Hyrox
  excluded) and folded in the `longRunDay` anchor (chosen day forced to a run day).
  - 🔴 **BLOCKER — long-run source-of-truth split (must fix before committing Pass 2).** The switch writes the user's
    `longRunDay` pick to `runProfile.longRunDay` (which the dayPlan honors), but the run-engine session-type
    reconciliation (`getRunWeek` `running_programs.js:1607`) reads **`wPrefs.longRunDay`**, which the switch leaves
    **stale** → chosen day becomes a run but gets an **easy** session, long run lands elsewhere. **FIX (decided: SYNC + PRESERVE VETO).** Sync-ONLY is insufficient: `generateRunWeek`/`buildSessions` never receive
    the pick (they compute a DOMS-safe day themselves), and the post-engine reconciliation (`running_programs.js:1607`)
    blindly overrides it — so syncing alone *forces obedience* and kills the safeguard. Agreed wiring = 3 coordinated
    changes: **(A)** sync `wPrefsUpdate.longRunDay = longRunDay` on run/hybrid when fresh pick present
    (`ProgramLibrary.jsx:83`); **(B)** thread `wPrefs.longRunDay` → `generateRunWeek` → `buildSessions` and make it the
    FIRST entry in the placement preference loop (`runEngine.js:362`) under the SAME DOMS/adjacency guards
    (`[preferredLongDay,'Sat','Sun'].filter(Boolean)`) → recovery-fine pick honored, recovery-bad pick fails the guard
    and the engine moves it (veto intact); **(C)** delete the blind reconciliation (`running_programs.js:1607-1630`).
    This ALSO dissolves the quality-day case (engine picks long day first; quality days exclude it via
    `candidates = days.filter(d => d !== longRunDay)`) — no limitation to track. Transparent messaging = the Transparent
    Recovery-Aware Long Run item below (NOT this fix). Diff confirmed; awaiting go to apply + build + re-test.
  - **ENHANCEMENT (future):** template-specific run:lift ratio — differentiate strength-biased vs run-biased templates
    (the generic `n−2` heuristic only varies bias by cycle length; no per-template ratio data exists). [audit's job]
- _**Onboarding-completion auto-nav** (was here) is RESOLVED — see DONE & VERIFIED.
  Read-side drift bugs (Today-tab program-switch; Upper/Lower title-vs-exercises) also RESOLVED._

---

## program-drift Stage 5 — ✅ COMPLETE (resolver 1–2 · 5a · 5b · 5d)
_Whole drift arc done: read-time resolver (Stages 1–2), write-path prevention (5a onboarding `_libraryId` backfill + 5b
opposite-mode field clearing on switch), and 5d (investigated — reconciliation unnecessary; residual stored-field drift is
inert). The catalog flag-fix also shipped. Only an optional confirmatory 5b hop-4 remains (non-blocking)._
- ✅ **Stage 5a — Backfill `_libraryId` on WRITE — DONE** (commit `2b31be5`; verified on-device): active PlanOnboarding
  `handleConfirm` infers the catalog id via `inferEntryFromFields` (strength→splitType, run→runPlan; hyrox/hybrid→null to
  avoid the `Full Body`→`full_body` misfire). Verified: `d3d00001` `_libraryId` `hyrox_8w → upper_lower`, `resolveProgram`
  `source:"libraryId"`. (Legacy `saveProfile`/`handleTrainDone` path is dead under `NEW_ONBOARDING=true` — intentionally not patched.)
- ✅ **Stage 5b — Program switches CLEAR opposite-mode fields — core VERIFIED on-device** (commit `a281f97`).
  `activateProgramMode`/`doActualSwitch` (`ProgramLibrary.jsx`) rewritten to an **enumerated program-mode patch**
  (owned values + explicit off-mode nulls; only program-mode keys named, so the spread preserves all shared state). Run-detail
  (`runFocus`/`currentRunsPerWeek`/`longestRunMi`/`planWeeks`/`recoveryCapacity`/`runPlanStartDate`/`longRunDay`) + run columns
  (`run_race_date`/`run_target_time`/`recovery_capacity`/`run_race_type`) preserved on **run AND hybrid**, cleared on **lifting +
  hyrox** (hybrid = combined run+lift; both consume `buildRunEngineInputs`). `dayPlan` cleared off-hybrid, **preserved on hybrid**
  (recon proved nulling it disables hybrid run-routing — `sections.jsx:2543` gates `hybridModality` on it; no schedule re-derivation).
  `current_program` orphan now synced to new `splitType`.
  - **Verified on `d3d00001` (bundle `NativeApp-3d117a12`):** hop 1 (→ Upper/Lower) = the four-way-drift collapse
    (`isHyrox+isLifting` both-true → clean lifting; stale `runPlan`/`hyroxProgram`/`hybridTemplate`/run-cols → null;
    `current_program` `ppl_6`→`upper_lower` = `_libraryId`); hop 2 (→ 10K running) = run owned, lift/hyrox cleared.
    Both PASS on all four checks: **cleared / owned / shared byte-identical / bio intact** (wprefs 12 shared fields unchanged;
    `profile_data` bio fully intact — only `goalCals` recalc + stale program-mirror moved, which is the pre-existing
    `doActualSwitch:755` clobber, not a 5b leak).
  - **Hop 3 (→ Balanced Hybrid) PASS** — owned (`isHybrid`, `hybridTemplate`, `splitType`), cleared (`isLifting/isRunFocus/isHyrox`,
    `runPlan/hyroxProgram`), **run-detail PRESERVED** (`currentRunsPerWeek=4`/`longestRunMi=6`/`recoveryCapacity=normal`/`longRunDay=Sat`
    survived — the preserve test hop 2 couldn't do), shared byte-identical. (Surfaced BUG 2's phantom-5K framing + the
    `doActualSwitch` clobber, both tracked above.)
  - **Hop 4 (return-trip → lifting) — optional confirmatory, non-blocking** — would confirm run+hybrid fields all clear on a
    switch back to a pure mode; 5b's clear-logic is already verified by hops 1–3, so this is belt-and-suspenders.
- ✅ **Stage 5d — One-time DB reconciliation — INVESTIGATED, NOT NEEDED as originally designed.** Read-only survey of all
  6 rows: **zero real rows in the safe-backfill bucket.** The 4 hybrid rows (`380ced37`/`71a77600`/`b23eefe5`/`be69c587`)
  already resolve correctly as **hybrid** via the `isHybrid` flag TODAY; a naive `_libraryId` backfill would infer
  `ppl_6→lifting` and **FLIP them hybrid→lifting** (harmful — violates "match what `resolveProgram` already returns").
  `563271d4` is empty (`resolveProgram`: "No program set"); backfilling from the orphan `current_program=ppl_6` would invent an
  interpretation. `d3d00001` is the disposable fixture. So historical drift is **already handled correctly by the resolver
  (1–2) and prevented going forward (5a/5b)** — the stored-field inconsistency is **INERT** (no read path uses the conflicting
  fields directly). **No reconciliation run.**
  - **PRINCIPLE (future, if real drifted rows appear at scale):** reconcile ONLY where `_libraryId` is present and other fields
    disagree — clear opposite-mode fields to match the canonical `_libraryId` (the `d3d00001` shape). **NEVER infer-and-backfill
    `_libraryId` from ambiguous fields** — inference can contradict the flag-based resolution and silently change a user's
    program. Survey → bucket → bulk-reconcile only the lib-present-but-conflicting rows.
- ✅ **Catalog mode-flag correctness (7 entries) — DONE** (commit `552ea62`): `metcon_*` / `metabolic` / `hiit_strength` →
  `isConditioning:true` (now conditioning → MET 4.5→8 calorie fix); `hybrid_foundation` / `tactical_hybrid` → `isHybrid:true`.
  Verified via `deriveProgramFields` (5→conditioning, 2→hybrid, no precedence override).
- **(Separate residual — NOT part of the drift arc) Reset `startDate`/week-counter on program switch** — `profile_data.startDate`
  stays at the onboarding date → `weekNum` can be wrong post-switch; OR drive week purely from `program_current_week`. Independent
  of drift resolution; moved here for tracking.

---

## OPEN — pre-release / polish
- _**Decided AGAINST** (don't re-flag): import-path consolidation (`supabase.js` ↔ `client.js`) — they're the same singleton via
  re-export, so it's 9 files of churn for zero behavior change. Not worth it._
- **Runna-style font pass** — Train tab control labels (HIDE ↑, SEE EXERCISES ↓) are too-heavy Archivo; match Runna
  discipline (9px floor / 11px eyebrows / spaced-caps, no `//` prefixes). User: "not now, keep on list."
- **Clinical-records / provisioning entitlement cleanup** before App Store submission — verify portal App ID + provisioning
  profile carry only what's used (binary entitlements currently clean).
- **HRV full device verification** — reads work (`ah_hrv_ok`); for the Settings-permission-sheet + real HRV data, needs an
  Apple Watch wearer + cleanest is delete/reinstall so HRV is in the initial grant.
- **HYROX calorie refinement** — `totalSec` is wall-clock incl. inter-station rest → MET 8 slightly overcounts; sum
  active-segment times instead.
- **Apple Health endgame** — prefer Apple Watch `activeEnergyBurned` reading over our estimate when present.
- **Breadcrumb keep-vs-gate** — decide keep-vs-gate for `ah_*` / `tier` / `bmr` / `plan_confirm_*` breadcrumbs before release.
  Current decision: **KEEP through development** (cheap observability on Health + onboarding-completion paths); gate or strip before App Store.
- **`markPlanBuilt` now unused** — after the atomic-write fix, the App-level `markPlanBuilt` fn + the `markPlanBuilt` prop
  on `PlanOnboarding` are dead (only caller removed). Remove as a small cleanup.
- **Onboarding-completion user-facing error** — `handleConfirm`'s catch is still `console.error`-only; on
  failure/timeout the button silently reverts. Add an honest inline/toast error ("Couldn't save — check connection, try again").
- **Minor residual direct `splitType` reads** (optional cleanup, NOT drift-causing — not the Today narrative/day surfaces):
  `morningBriefService.js:279` (weather-fetch gate `splitType.includes('run')`) and the AI workout-generation prompt
  (`ob_screens2.jsx:8169/8172/8179`, tells the model the split via `wPrefs.splitType`). Could route through `resolveProgram().displayName`.

---

## OPEN — big feature (was "next up" pre-Apple-Health)
- **PROGRESS TAB redesign** — large **multi-session epic** (was "next up" pre-Apple-Health; merged in from the stale Drive doc
  so this file is complete). Reskin the Progress tab from the OLD dark theme (`#000`, `var(--accent)`, DM Mono `//` eyebrows) to
  the red/white `--cm-*` system, sub-tab by sub-tab, plus the approved **rolodex section-selector** interaction.
  - **Target (be precise):** `ProgressSection` (`ob_screens2.jsx:~9180`), mounted at `{section==="progress"}` (~`:10684`).
    **NOT** the `sections.jsx` `trainScreen==="progress"` block — that's a separate Train sub-screen, easy to confuse.
  - **Inventory:** **5 sub-tabs** — overview / strength / nutrition / recovery / running — **~30 cards**, **14+ custom SVG/canvas
    charts**, all still on the old dark theme.
  - **Rolodex section-selector (approved interaction):** tap the section name → a wheel-scrub scrubs sub-tabs live
    (prefetch-backed), reusing the **scroll-snap wheel picker** — same component family (`Rolodex`/`StackPicker`, `components.jsx`)
    as the RunProgramSetup time-input wheels we just shipped.
  - **Foundation already done:** `getUserMode` 5-tabs, weight logging, prefetch.

- **PROGRAMMING ENGINE AUDIT — ensure every program is coach-grade optimized** — large, **foundational OWN PROJECT**
  (post the hybrid dayPlan quick-fix). This is the _"we are the best / very detailed"_ differentiator. Scope:
  - **MUSCLE COVERAGE:** every program hits all major groups across the week/mesocycle, down to **head-level**
    (3 triceps heads, 3 delt heads, etc.) — no gaps.
  - **VOLUME / SETS / REPS / REST:** correct per goal — hypertrophy (8–12 reps, 60–90s rest, higher volume),
    strength (3–5 reps, 3–5min rest), endurance, etc. **Calculated, not arbitrary.**
  - **GOAL-DRIVEN PARAMETERS:** an onboarding _"what's your goal"_ question (build muscle / strength / etc.) drives
    sets/reps/rest adaptation per program. **Evidence-based defaults (decision: option 2).**
  - **STYLE-AUTHENTIC PROGRAMS:** Golden Era / signature programs stay **FAITHFUL** to the original routines (the greats —
    Arnold/Zane/etc.), **NOT** generic-ized into default hypertrophy. The audit respects program identity.
  - **DOMS / RECOVERY-AWARE PLACEMENT:** day sequencing avoids stacking same-muscle stress back-to-back; recovery between
    hard sessions; muscle-map-driven placement.
  - **METHOD:** audit what exists first **(decision: option 3)** → define the standard → encode. Applies **system-wide**,
    including re-touching the hybrid dayPlan generator built in the quick fix.

- **TRANSPARENT RECOVERY-AWARE LONG RUN** (feeds the Programming Engine Audit's DOMS/recovery-placement work).
  The DOMS/recovery model already **EXISTS and is sophisticated** (`runEngine.js` `generateRunWeek`: Sat>Sun preference,
  never-adjacent-to-heavy-legs via `daysAdjacent`, personalized DOMS windows from `domsProfile.peakHours`,
  `recoveryCapacity` modulation; post-Pass-2 it also reasons about hybrid heavy-lower days, fed from the dayPlan via
  `deriveDayModality.heavyLowerDays` → `liftingLoad`). **What's MISSING is the transparent/collaborative UX layer:**
  (1) when the user's `longRunDay` pick is recovery-suboptimal, **SHOW the engine's reasoning** (_"Wednesday puts your
  long run the day after heavy legs — Saturday gives 48h recovery"_); (2) **RECOMMEND** the optimal day but let the user
  keep their pick; (3) **re-flow** the week's recovery around whatever they choose. Today the user-pick reconciliation
  (`getRunWeek` :1607) is a **blind conditional swap** with no DOMS reasoning and no messaging. = surface + wire the
  existing engine reasoning + a messaging layer, **NOT** build the model. Belongs with the audit's recovery-placement work.
_Tracked, not scheduled. Each is design-before-build; several need competitor/market research before a model is chosen._

- **SESSION TYPES (user opt-in, per-day/cadence placement)** — let users add advanced session types and place them
  on specific days / cadences. **Design model TBD via market research.**
  - _Endurance:_ brick workouts, two-a-days (AM/PM), time-trial / benchmark tests, fartlek/tempo as tagged types.
  - _Strength:_ EMOM/AMRAP, drop sets / supersets, max-effort testing days, deload as a surfaced session type.
  - **ASSIGNMENT MODEL:** per-day/cadence placement (user picks types + WHERE — e.g. brick Sat, two-a-days Tue/Thu,
    benchmark every 4wk), **NOT** a global on/off. Design via competitor research first.

- **ADAPT NOW (unified smart-adjust button)** — bring back as ONE button that absorbs all in-the-moment adjustments.
  **Keep in mind during ALL core work** (design while building core so the engine can support it):
  - travel → no-gym bodyweight swap; injury/tweak → _"what's bothering you?"_ → avoid loading it; low energy / poor sleep
    → lighter, HRV-driven; time-crunch → condensed; equipment-unavailable → substitute.

- **EXTRAS (tracked):** injury/niggle profiles (persistent); exercise swaps/preferences **[NOTE: partially EXISTS —
  audit what's there first]**; equipment profiles; progressive overload + PR detection; session time estimates.

- **COMPETITIVE INTELLIGENCE (2026 market research):**
  - **RP Strength** = evidence-based hypertrophy gold standard, BUT: hypertrophy-only, dated UI, limited
    analytics/customization, $25–35/mo, 2.8 Trustpilot. **Mesostrength / Alpha Progression** = cheaper challengers.
  - **THE GAP (our wedge):** 2026 reviews say the biggest unmet need is **hybrid** — people want muscle AND
    running/conditioning, but pure-hypertrophy apps _"treat cardio as an afterthought, program leg day without knowing
    you ran 8km yesterday."_ That **IS** Coach Macro's thesis.
  - **OUR DIFFERENTIATORS:** hybrid (lift+run+nutrition) engine; Design-Award UI (vs their dated look); objective +
    subjective auto-regulation (HRV + feedback, vs their subjective-only); deep analytics / Progress redesign;
    fatigue-aware cross-modal programming.
  - **ADOPT (validated best-practices → feed the PROGRAMMING ENGINE AUDIT):** volume landmarks MEV→MRV across the
    mesocycle w/ auto-deload; stimulus-to-fatigue-ratio exercise selection; frequency per experience level; muscle
    emphasis / maintain / ignore (RP's _"Meso Builder"_); feedback-driven weekly volume adjustment.
  - **Keep watching:** RP Strength, Mesostrength, Alpha Progression, Hevy (UX/social leader), Fitbod, STRNDR.

---

## WORKING RULES
- **Recon-first:** STEP 0 = quote the exact current code/state before any edit; confirm assumptions against the real files (don't act on a stale premise — surface mismatches).
- **Small, targeted edits:** minimal `str_replace`-style changes; compile-check (`esbuild` for JS, generic-destination `xcodebuild` for native) before proposing a build.
- **Instrumentation over guessing:** when behavior is unclear, add fire-and-forget `analytics_events` breadcrumbs (readable via Supabase MCP — we cannot read the WKWebView console over cable) rather than theorize.
- **Never destructive DB writes without explicit ask;** prefer read-only inspection (`list_tables`, `get_logs`, `execute_sql` SELECT).
- **Git:** commit only when asked; branch `goclub-redesign`; commit author uses the GitHub no-reply email (avoids GH007); end commit messages with the Claude co-author trailer.
- **Build hygiene:** always the `rm -rf ios/App/App/public` prefix; native plugin changes live in the `patches/` file (regenerate with `npx patch-package @perfood/capacitor-healthkit`); `postinstall: patch-package` reapplies on install.
