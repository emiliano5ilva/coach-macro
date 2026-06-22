# PROJECT_STATE.md — Coach Macro

> Canonical "where we are" doc. **Claude Code reads this at the start of every session and
> updates it at the end**, so a fresh session never starts cold. Keep it terse and current.

_Last updated: 2026-06-22 — handleConfirm atomic-write fix DONE/verified on-device; new lower-pri OPEN: onboarding completion doesn't auto-nav in-session (branch `goclub-redesign`)._

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
- **handleConfirm atomic-write fix — DONE** (verified on-device) — onboarding completion now writes `wprefs` + `schedule`
  + `profile_data` + `plan_built` in **one timeout-guarded upsert** (`ob_screens2.jsx:4350`, `Promise.race` 15s), replacing
  the old upsert + separate `markPlanBuilt`. Verified: `_libraryId=upper_lower` **and** `plan_built=true` landed together
  (no half-apply); API logs confirm the new path (atomic `POST` upsert, no `markPlanBuilt` `PATCH`). Original
  completion-blocker fixed; severity dropped from "can't complete" → "doesn't auto-nav in-session" (see OPEN below).
- **Design system locked** — Me tab, Today/Train/Fuel reskins, weight logging, security/RLS.

---

## OPEN — correctness bugs (highest priority)
- **Onboarding completion doesn't auto-navigate in-session** (lower priority — NOT completion-blocking) —
  with the atomic-write fix, completion now **persists correctly** (`plan_built=true`, relaunch lands in 5-tab),
  but the screen doesn't visibly swap to Today in the *same* session — it stays on the stale "Building…" overlay.
  Likely cause: the success path **never resets `saving`/`building`** (relies on `setSection` unmounting), and
  `setSection('today')` doesn't visibly swap when `_spb(true)` flips 3→5 nav simultaneously. Likely fix: add
  `setSaving(false)`/`setBuilding(false)` before `setSection` on success + investigate the nav-swap/unmount race.
  Recon-first next session. (Severity: cosmetic-ish — data is saved; user just has to relaunch.)
- _Read-side drift bugs previously here (Today-tab program-switch; Upper/Lower title-vs-exercises) are RESOLVED — see DONE & VERIFIED._

---

## OPEN — program-drift Stage 5 (write-side + DB)
- ✅ **Stage 5a — Backfill `_libraryId` on WRITE — DONE** (commit `2b31be5`; verified on-device): active PlanOnboarding
  `handleConfirm` infers the catalog id via `inferEntryFromFields` (strength→splitType, run→runPlan; hyrox/hybrid→null to
  avoid the `Full Body`→`full_body` misfire). Verified: `d3d00001` `_libraryId` `hyrox_8w → upper_lower`, `resolveProgram`
  `source:"libraryId"`. (Legacy `saveProfile`/`handleTrainDone` path is dead under `NEW_ONBOARDING=true` — intentionally not patched.)
- **Program switches must CLEAR opposite-mode fields** — lift switch → `runPlan=null` + `run_race_type=null`; run switch → `splitType=null`.
- **Reset `startDate` on program switch** — currently `profile_data.startDate` stays at the onboarding date → `weekNum` wrong
  post-switch. OR drive week purely from `program_current_week`.
- **One-time DB reconciliation** of drifted rows (demo `d3d00001` is the four-way-drift test case).

---

## OPEN — pre-release / polish
- **Runna-style font pass** — Train tab control labels (HIDE ↑, SEE EXERCISES ↓) are too-heavy Archivo; match Runna
  discipline (9px floor / 11px eyebrows / spaced-caps, no `//` prefixes). User: "not now, keep on list."
- **Clinical-records / provisioning entitlement cleanup** before App Store submission — verify portal App ID + provisioning
  profile carry only what's used (binary entitlements currently clean).
- **HRV full device verification** — reads work (`ah_hrv_ok`); for the Settings-permission-sheet + real HRV data, needs an
  Apple Watch wearer + cleanest is delete/reinstall so HRV is in the initial grant.
- **HYROX calorie refinement** — `totalSec` is wall-clock incl. inter-station rest → MET 8 slightly overcounts; sum
  active-segment times instead.
- **Apple Health endgame** — prefer Apple Watch `activeEnergyBurned` reading over our estimate when present.
- **Breadcrumb keep-vs-gate** — decide keep-vs-gate for `ah_*` / `tier` / `bmr` breadcrumbs before release.
- **`markPlanBuilt` now unused** — after the atomic-write fix, the App-level `markPlanBuilt` fn + the `markPlanBuilt` prop
  on `PlanOnboarding` are dead (only caller removed). Remove as a small cleanup.
- **Onboarding-completion user-facing error** — `handleConfirm`'s catch is still `console.error`-only; on
  failure/timeout the button silently reverts. Add an honest inline/toast error ("Couldn't save — check connection, try again").
- **Minor residual direct `splitType` reads** (optional cleanup, NOT drift-causing — not the Today narrative/day surfaces):
  `morningBriefService.js:279` (weather-fetch gate `splitType.includes('run')`) and the AI workout-generation prompt
  (`ob_screens2.jsx:8169/8172/8179`, tells the model the split via `wPrefs.splitType`). Could route through `resolveProgram().displayName`.

---

## OPEN — big feature (was "next up" pre-Apple-Health)
- **PROGRESS TAB redesign** — the "rolodex" section-selector interaction (tap section name → swipe scrubs sections live,
  prefetch-backed). Reskin 5 sub-tabs / ~30 cards / 14+ charts from the old dark theme (`#000`, `var(--accent)`, DM Mono
  `//` eyebrows) to the red/white `--cm-*` system, sub-tab by sub-tab. Target: `ProgressSection` (`ob_screens2.jsx` ~9180).
  Foundation (getUserMode 5-tabs, weight logging, prefetch) already done.

---

## WORKING RULES
- **Recon-first:** STEP 0 = quote the exact current code/state before any edit; confirm assumptions against the real files (don't act on a stale premise — surface mismatches).
- **Small, targeted edits:** minimal `str_replace`-style changes; compile-check (`esbuild` for JS, generic-destination `xcodebuild` for native) before proposing a build.
- **Instrumentation over guessing:** when behavior is unclear, add fire-and-forget `analytics_events` breadcrumbs (readable via Supabase MCP — we cannot read the WKWebView console over cable) rather than theorize.
- **Never destructive DB writes without explicit ask;** prefer read-only inspection (`list_tables`, `get_logs`, `execute_sql` SELECT).
- **Git:** commit only when asked; branch `goclub-redesign`; commit author uses the GitHub no-reply email (avoids GH007); end commit messages with the Claude co-author trailer.
- **Build hygiene:** always the `rm -rf ios/App/App/public` prefix; native plugin changes live in the `patches/` file (regenerate with `npx patch-package @perfood/capacitor-healthkit`); `postinstall: patch-package` reapplies on install.
