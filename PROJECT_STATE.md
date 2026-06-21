# PROJECT_STATE.md — Coach Macro

> Canonical "where we are" doc. **Claude Code reads this at the start of every session and
> updates it at the end**, so a fresh session never starts cold. Keep it terse and current.

_Last updated: 2026-06-21 (branch `goclub-redesign`)._

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

## DONE / SHIPPED
- **Apple Health — reads + HRV + write path** (commits **`bbe5cb8`** reads, **`7ef0ae2`** write; both pushed):
  - Fixed the native-bridge **stall**: `hk()` returned the Capacitor plugin proxy from an `async` fn;
    the proxy is thenable (no `then` guard) → `await hk()` hung forever. Fixed via non-thenable `{ kit }` container.
  - Corrected method name `querySampleType` → **`queryHKitSampleType`**, and query keys (`stepCount`, HRV).
  - **HRV** added via `patch-package` (`patches/@perfood+capacitor-healthkit+1.3.2.patch`): native
    `getTypes` + `getSampleType` + `generateOutput`(→ms) cases. All 5 snapshot reads return `_ok`.
  - **Write path:** native `saveWorkout` (`@objc` method + `.m` registration, in the same patch),
    activity-type mapped from resolved program mode; `ah_savework_*` breadcrumbs. Compiles clean
    (native verified via generic-destination build). **On-device write test still pending** (see NEXT).
  - Per-call timeouts (import 8s / isAvailable 8s / requestAuth 30s / getters 10s / saveWorkout 4s)
    and `ah_*` analytics_events breadcrumbs retained as hardening/observability.
- **Program-drift resolver** — `resolveProgram(wPrefs, profile)` is the single canonical mode/displayName
  source. Today card, Train tab, and morning brief all route through it (no more stale `run_race_type`).
- **Week counter** (commit **`1ce6c3f`**) — `program_current_week`/`program_total_weeks` sourced from the
  profile load (removed fragile auth-gated call); dynamic `Week N of <total>` denominator.
- **Design system** — locked.

---

## IN PROGRESS / NEXT
- **Apple Health on-device `saveWorkout` functional test** (resume checklist):
  1. Confirm device `available (paired)` via `xcrun devicectl list devices`; unlock + keep awake.
  2. Run the mandatory build chain (fresh `NativeApp-<hash>`).
  3. Complete **a strength workout AND a run workout** in-app (so `finishWorkout` → best-effort `saveWorkout` fires both activity types).
  4. Read back `ah_savework_*` from `analytics_events` (Supabase MCP):
     `ah_savework_ok` = write landed; `ah_savework_error` + message = HealthKit rejected (most likely write-permission not granted).
  5. Cross-check **Apple Health → Workouts** for the entries + correct activity type (Traditional Strength Training / Running).

---

## DEFERRED
- **Real distance for runs** — `saveWorkoutToHealth` currently sends `distance: 0` (understates, never mislabels). Wire actual run distance once the write path is proven.
- **Breadcrumb keep-vs-gate** — decide whether to keep `ah_*` analytics breadcrumbs long-term or gate behind a debug flag before release.
- **Clinical-records / HealthKit entitlement cleanup** — review entitlements before App Store submission.

---

## WORKING RULES
- **Recon-first:** STEP 0 = quote the exact current code/state before any edit; confirm assumptions against the real files (don't act on a stale premise — surface mismatches).
- **Small, targeted edits:** minimal `str_replace`-style changes; compile-check (`esbuild` for JS, generic-destination `xcodebuild` for native) before proposing a build.
- **Instrumentation over guessing:** when behavior is unclear, add fire-and-forget `analytics_events` breadcrumbs (readable via Supabase MCP — we cannot read the WKWebView console over cable) rather than theorize.
- **Never destructive DB writes without explicit ask;** prefer read-only inspection (`list_tables`, `get_logs`, `execute_sql` SELECT).
- **Git:** commit only when asked; branch `goclub-redesign`; commit author uses the GitHub no-reply email (avoids GH007); end commit messages with the Claude co-author trailer.
- **Build hygiene:** always the `rm -rf ios/App/App/public` prefix; native plugin changes live in the `patches/` file (regenerate with `npx patch-package @perfood/capacitor-healthkit`); `postinstall: patch-package` reapplies on install.
