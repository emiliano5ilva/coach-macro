# PROJECT_STATE.md — Coach Macro

> Canonical "where we are" doc. **Claude Code reads this at the start of every session and
> updates it at the end**, so a fresh session never starts cold. Keep it terse and current.
>
> **⚠️ Source of truth: THIS file.** The 3 Google Drive docs (Project State & Next Up · Design System ·
> Growth Mechanics) are **STALE** — last real update **Jun 15**, predating the Apple Health, program-drift
> Stage 5, onboarding-completion, and RunProgramSetup input-fix work. Treat the Drive docs as **reference/archive
> only**; reconcile anything still useful from them into this file, then trust this file going forward.

_Last updated: 2026-06-29 — **COOKING GUIDE PHASE 1 + DIET-TAG RECLASSIFICATION ✅ SHIPPED** (`c6d05ec`, bundle `NativeApp-293a5f8e`). **(A) Cooking guide Phase 1:** added `recipes.instructions` (jsonb: `{prep/cook/total_time_min, yield_servings, sections:[{title,steps:[{n,text,type,active,duration_min,appliance,temp,ingredient_refs}]}], make_ahead, storage, reheat}`) + `recipes.recipe_kind` ('assembly'|'cooked') via migration; **5 seed recipes authored** (Blueberry Yogurt Bowl, Lean Turkey Wrap, Almond Butter Smoothie = assembly; Beef Stir Fry, Baked Salmon = cooked). **Meal-detail screen reskinned** to Fuel system (dropped //, italic-900, SVG donut ring) → title+macros (P-red/C-blue/F-amber bars) → time/servings/diet+allergen chips → ingredients (scaled grams, tappable check-off) → numbered steps (per-step type·duration·appliance·temp) → make-ahead/storage/reheat; **graceful fallback** = macros+ingredients only when no instructions (294 recipes). **Reachable from BOTH** your-week meal cards AND the Kitchen spine (meal names now tappable) via a `detailFrom` tag (Close returns to opener). `loadMealPool`/`fitterDayToShape` carry instructions/recipe_kind/dietTags/allergenTags/primary_diet. **(B) Diet-tag reclassification** (fixes the "Mediterranean shows vegan/carnivore meals" leak — root cause: diet_tags were catch-alls, high-protein on 273/299, mediterranean on 232/299): re-derived ALL 299 `diet_tags` + new `primary_diet` column from a **deterministic classifier** (ingredients + per-serving macros), recorded in `scripts/reclassify-diet-tags.sql`. **Rules:** vegan(no animal) · vegetarian(no meat/fish) · pescatarian(fish,no meat) · carnivore(animal-only, no plant/oil) · paleo(no grain/legume/dairy) · **keto(carbs≤15g & fat≥55% cal)** · **low-carb(carbs≤25g)** · **high-protein(protein≥30g abs)** · **mediterranean(olive oil & (fish OR legume) & no red meat — tightened hard)** · balanced(P20-42/C28-55/F18-42% cal). **primary_diet priority:** carnivore > **mediterranean** > vegan > pescatarian > vegetarian > paleo > keto > low-carb > high-protein > balanced — mediterranean deliberately ABOVE the plant axis because 55/88 Med meals are fish; this makes all 88 Med meals claim `primary='mediterranean'` so the generator's variety-preference draws evenly instead of skewing fishy. **Post-reclassify tag counts:** hp 183, low-carb 180, paleo 129, veg 121, keto 89, med 88, pesc 77, vegan 75, carnivore 50, balanced 29 (all clear the 21-meal-week floor). **Generator wiring** (`fuel.jsx`/`mealFitter.js`): filters on accurate `diet_tags` via `overlaps` (NOT primary as a hard filter — keto needs all 89); `primary_diet` is a −0.05 variety PREFERENCE in `pickForSlot`; **mediterranean snack-slot fallback** to pescatarian/vegetarian (Med has 0 snack recipes) gated in `meetsDiet`/`loadMealPool` to the snack slot only. **DB changes are live server-side** (no redeploy needed — generator reads them at query time). **🟡 FOLLOW-UPS LOGGED:** (1) author the remaining **294 cooking guides**; (2) add **~10-15 Mediterranean poultry/egg/yogurt meals** — Med pool is 55 fish / 33 mostly-legume, only ~1 poultry/egg main → even drawing still leans fish+legume; (3) **summary-strip "0 min / 0 grocery" bug** on the plan screen (fitter meals have no `prepTime` and `groceryList` is null → EST PREP shows 0M, GROCERY 0 ITEMS); (4) **legume-path classifier refinement** — 'beans' keyword over-matches (black-bean dishes reading as Mediterranean); tighten Med legume signal to chickpea/lentil/white-bean. Prior: **MORNING BRIEF ✅ FULLY FIXED** (`3198a6e`, bundle `NativeApp-39f97684`): template engine + hang-proof context, end-to-end verified (a fresh 2026-06-29 row now writes — "Evening, Demo." in the new concise template voice). **TRUE ROOT CAUSE of the 2026-06-26 outage: NOT AI quota — it was a hanging `navigator.geolocation.getCurrentPosition`** in `gatherBriefContext`'s run-athlete weather block. Its `{timeout}` option does NOT run while a WKWebView location-permission prompt is pending, so the `await`ed geo promise never resolved → `gatherBriefContext` never returned → the brief stalled in "loading" and the cache was never written (so DB stayed stuck at the last good 06-26 row). Fix: `withTimeout(promise, ms, fallback)` wraps EVERY network await (geolocation 4.5s, weather 4s, the 11-service enrichment Promise.all 4s each, profiles 6s, food/workout queries 5s, protein/DOMS 4s, cache read 5s / write 6s) — a hang/slow service degrades to the null/empty fallback the template already handles, so gather always completes (bounded, never infinite). Also **ungated generation** in the Today loader (`ob_screens2.jsx:7824` removed the `briefTrigger===0&&briefDismissed` early-return) — the local template is free/instant so it always generates+caches on Today-screen mount; visibility stays gated at render via `!briefDismissed`. Added `[brief]` trace logs (called → no cache → gather done → template done → cached) + `[brief] timeout:<service>` warnings. The earlier AI→template rewrite (`5abedad`) was correct but insufficient alone — the hang was upstream in context-gathering. **Both follow-ups still open:** hybrid-session naming in the brief (point context at `wPrefs.dayPlan`); personality-voicing phase 2 (`adaptMessageSync` + T-map `morning_brief` entry). Prior detail — the brief was **broken system-wide since 2026-06-26** (the `ai()` generation call failing — no briefs generated for any user). Replaced the AI path with a **pure template engine** `buildBriefFromTemplate(ctx)` in `morningBriefService.js` — composes the SAME 6-field shape (`greeting/yesterday/today/coach_says/coach_tip/sign_off`) from the already-gathered structured `gatherBriefContext` data, with **day-of-year-rotated phrasing variants** (per-field offsets; stable within a day, fresh across days). `coach_says` **priority-picks** the single most relevant non-null signal (injury > fatigue > readiness > deload > plateau > validation > streak > sleep > protein/HRV/DOMS/weather/memory > fallback); `coach_tip` paired ≤12 words. **NO `ai()` anywhere in the path** — entire prompt/`ai()`/JSON-parse block deleted; `gatherBriefContext` + the `morning_briefs` cache (user_id+brief_date) unchanged → now local/instant/unbreakable. Temporary `mb_*` analytics breadcrumbs **reverted** (helper + calls + unused `ai` import gone). Personality-READY (lines compose into vars). **🟡 FOLLOW-UPS LOGGED:** (1) **hybrid-session naming in the brief** — point the brief's context builder at `wPrefs.dayPlan` like the Kitchen spine now does, so `today` names "Upper Day"/"5 Mile Run" instead of the program name (currently `ctx.todayFocus`='Training' for hybrids → falls back to splitType "Balanced Hybrid"); (2) **personality-voicing phase 2** — `adaptMessageSync` wrap on `says`/`tip` + a `morning_brief` entry in personalityService's T-map (one-line wrap once the T-map entry exists). Prior: **DIET CARDS + GROCERY-CLOSE ✅ SHIPPED & VERIFIED** (`3cd8932`, bundle `NativeApp-9e634224`): **(1) Diet-style selector** redesigned — 2-col grid → **single-column full-bleed photo cards** (16:10, `/diet-images/{id}.jpg`, `objectFit:cover`, gradient fallback until images land); label + descriptor (`DIET_DESC`) on a **white plate** bottom-left (dark-on-white, legible over any photo) + scrim; **badge** top-left, **selected check** top-right, accent border + glow on selected. All 10 presets + "More styles" expander + persistence (`setMealPrepPrefs`+`saveFlexPrefs`) kept. **(2) Grocery close destination** — `groceryFrom` tag (`'kitchen'`|`'plan'`) + `closeGrocery()`: ✕/Done/backdrop now return to **where it was opened from** (Kitchen base if opened from the spine card, plan screen if opened there) instead of always landing on 'plan'. **🟡 PENDING ASSET DROP:** diet photos into `public/diet-images/` — exact lowercase kebab ids: `balanced, high-protein, mediterranean, keto, paleo, vegetarian, vegan, carnivore, low-carb, pescatarian` (`.jpg`, case-sensitive; only `high-protein`/`low-carb` are hyphenated). Until dropped, cards show the gradient fallback. **NEXT: MORNING BRIEF → pure template engine** (kill the failing `ai()` call; recon in progress). Prior: **KITCHEN POLISH ✅ SHIPPED & VERIFIED** (`8651dd1`, bundle `NativeApp-2585c893`): three Kitchen fixes in one bundle. **(1) Real spine session labels** — `_sessFull`/`_sessShort`/`sessColor` now consult `wPrefs.dayPlan[day]` FIRST (`.run` → "{mi} Mile Run" via `getRunWeek`, `.lift` → split from `dayPlan[day].cycleLabel` or the `HYBRID_TEMPLATE_CYCLES`→`HEAVY_LOWER_CYCLES` derivation that mirrors TrainSection), falling back to `schedule`+`dayFocus` for split programs. **Root cause it fixes:** for hybrids the `schedule` column stores `'training'` for BOTH run and lift days and `dayFocus` is null — the run/lift split + names live ONLY in `dayPlan` (confirmed via DB for fixture `d3d00001`: schedule all-`training`, dayPlan Mon=Upper/Tue=Lower lift, Wed/Sat/Sun run). So generic "TRAINING"/"REST" → now "Upper Day"/"Lower Day"/"X Mile Run"; run days colored blue. Also enriched `fitterDayToShape` ingredients with numeric `qty`+`unit`. **(2) Grocery list redesign** (replaced the flat dedup-only sheet): red sheet w/ white aisle cards grouped by aisle (Produce/Meat & Seafood/Dairy & Eggs/Pantry/Frozen) with **emoji icons from the bundled `fluent-emoji-flat` pack** (`iconData.js`: green-salad/poultry-leg/egg/sheaf-of-rice/ice-cream), **merged quantities** (sum by item+unit, "across N meals" tag) rendered as **shop-friendly units** via `toShoppingQty` ("1 dozen", "2 breasts", "1 bag", "1.5 lb" honoring `profile.wUnit` lb/kg; spices/staples show no qty; oils→"1 bottle"; canned→"N cans"), **check-off + persisted plan-scoped gather-progress** (`cm_grocery_gathered_v1` keyed by plan `generatedAt`) with progress bar, "Cook once · this week" framing, collapsible aisles (long ones default-collapsed), plain "Done" (NO Instacart). **(3) Spine meal names** — show the FULL day's meal list (`-webkit-line-clamp:2` wrap) instead of "{first} +N". All Fuel-system (Archivo, white-on-red, token-based, no //). Prior: **MEAL-PREP LIFECYCLE FOUNDATION ✅ COMPLETE & VERIFIED** (P0s `7a838a5` bundle `NativeApp-c28fc13e` + P1s `947d6af` bundle `NativeApp-4414d957`): the plan lifecycle is now sound under the upcoming plan-screen redesign — **builds forward from today**, **stale-on-ANY-training-change**, **freshness UX**, **today-not-covered** state. **P1s (freshness UX, `947d6af`):** "Planned X days ago" muted line on the Kitchen plan (off the stamped `generatedAt`; legacy timestamp-less plans show no age line); **window-elapsed state** (plan ≥7d old / no remaining days) → day rows replaced by "This week's plan has ended" + "Plan next week →" pill (action pills stay so the old plan's still viewable); **today-not-covered** → home food-log shows a quiet "No prepped meals planned for today" hint only when a plan exists but excludes today, Kitchen spine just shows upcoming days (today not highlighted). Fuel-system styling throughout. **🟡 STILL-LOGGED FOLLOW-UP:** per-DATE periodization lookahead (forward window crossing a mesocycle boundary uses the current block's macro target for the wrapped weekday — session label is right, only macro target may lag a block boundary). **NEXT: the actual MEAL-PREP PLAN screen redesign** (`mealPrepScreen==='plan'`) + its bottom-overlap bug (see below). Prior P0 detail — hardened the plan foundation before the plan-screen redesign. **(1) Stale-on-ANY-training-change** (was program-switch only): `_trainingSig()` (`fuel.jsx:1538`) snapshots `schedule`+`wPrefs.dayFocus`+`mealsPerDay`+program id+rounded per-day `weekMacros` cal/carb (the last folds in mesocycle/phase shifts); stamped on the plan at generate (`plan.trainingSig`+`generatedAt`, `:1810`); mount effect (`:1758`) compares live vs stored → shows the "plan no longer matches" banner on mismatch **without nulling the plan**; DISMISS **re-stamps** the live sig so it sticks until training changes again (`:3394`). Covers program switch / schedule+day-focus edit / phase change / meals-per-day. Legacy sig-less plans guarded out. **(2) Build forward from today**: `generateMealPrepPlan` (`:1784`) now builds a rolling 7-day window starting today (intersected with chosen prep days, today-first) instead of fixed Mon–Sun — kills the "Wednesday problem" (no past weekdays shown as to-prep); each day still resolves its real weekday session via `schedule[day]`/`weekMacros[day]`. **🟡 KNOWN FOLLOW-UP (deferred): per-DATE periodization lookahead** — when the forward window wraps past Sunday into a *different* mesocycle block, the wrapped weekday uses the *current* block's `weekMacros` target (schedule repeats weekly so the session label is right; only the macro target may lag a block boundary). Needs next-week periodization resolution; tracked for the periodization pass. Logged food preserved (regenerate untouched; only re-save merges, keeping manual entries). **NEXT: P1s — freshness UX** ("Planned X days ago" + "Time to plan next week →" when >~7d old or window elapsed; today-not-covered graceful state on Kitchen spine + home). Prior: **SET UP MY WEEK FORM ✅ SHIPPED & VERIFIED** (`2eadc59`, bundle `NativeApp-688e4501`): Fuel-system restyle of all 6 meal-prep setup sections (days/meals-per-day/diet/prep-time/restrictions/generate) — dropped `//`+DM-Mono+italic-900 → Archivo 5-step, white cards on red, muted eyebrows, **solid-accent selected states**, white-pill CTA; **diet grid collapses to 2 popular + "More styles" expander** (`dietExpanded`, all 10 still selectable, active always shown); day chips keep training labels. Styling only — every input + side-effect preserved (mealFreq persistence, slot reset, diet/restriction writes). _(Native build hit a transient CapacitorCordova/Pods cache flake; `rm -rf /tmp/coach-macro-device` fixed it — not a code issue.)_ **NEXT QUEUED: MEAL-PREP PLAN screen redesign + bug** (`mealPrepScreen==='plan'`, fuel.jsx ~:3818+, still old //+italic-900): 🔴 **bottom-overlap bug** — the plan's GROCERY/REGENERATE bar is `position:fixed; bottom:0; zIndex:200` with only `paddingBottom:max(14px,env(safe-area-inset-bottom))`, so it sits ON TOP of the main tab bar (`.app-tab-bar`, `z-index:100`, bottom:0, ~56–72px tall). The log sheet avoids this by being a `position:fixed inset:0 z500` full-screen overlay w/ `paddingBottom:80`; the plan screen is in-flow within the fuel tab so the tab bar shows and the action bar collides. **FIX (queued):** offset the action bar up by tab-bar height (`bottom: calc(tabbarH)`) + bump content pad, OR make mealprep a full-screen overlay above the tab bar. **MORNING BRIEF "not loading" — diagnosed, NOT our session's fault:** load path `ob_screens2.jsx:7826 getMorningBrief → gatherBriefContext → generateBriefContent → ai(prompt,600,'morning_brief')` (`morningBriefService.js:493`); brief imports `resolveProgram`/`selectDayKey`/13 services but **does NOT import `personalityService.js` or `fuel.jsx`** (this session's edits are unrelated + purely additive). Most likely failure = the `ai()` call (rate-limit/quota/auth) or JSON-parse of the AI response (`:495`), surfaced via `morningBriefError`; secondary = an unguarded enrichment service throwing in `gatherBriefContext`. On-device: check console for `[morningBrief]`/`[brief]` errors. Prior: **KITCHEN TRAINING-SPINE WEEK ✅ SHIPPED & VERIFIED** (`91fa04e`, bundle `NativeApp-0c3328ef`): Kitchen now leads with the week as a **training spine** (meal prep as a plan dashboard) — one row per day = colored spine bar + session label (`wPrefs.dayFocus[day]`/sessionType, color by type) + that day's prepped meal names + a per-day macro **why** chip (carbs vs the rest-day baseline from `weekMacros`, reusing the home train→fuel logic). **Today's row highlighted** with a one-tap "Log today's meals →" (routes Home to the existing planned-meal ✓-cards — no new bulk-logger). Eyebrow "YOUR WEEK, FUELED FOR TRAINING" + "{diet} · {N} meals prepped"; View plan / Grocery / Regenerate pills. **Removed the redundant top launcher card + deleted the bottom MEAL PREP section → ONE plan-aware surface**; **recipes demoted** to a secondary section (header fixed white-on-red — was latent red-on-red). Empty state = the Generate-your-week hero. Token-based, Fuel-system styling. (`mealPrepRef` now an unused decl — harmless.) Prior: **LOG-SHEET REDESIGN + WHITE/RED REBALANCE ✅ SHIPPED** (`4edb691`, bundle `NativeApp-838d6888`): the food-log sheet's 5-tile method grid collapsed to **3 named methods** — Scan & Snap (photo+barcode chooser), Describe (folds search/ai-describe/my-foods/quick-add behind one entry + 4-tab toggle), Restaurant AI (moved out of Kitchen; RA overlay z-index 400→600 so it opens above the sheet). Existing **meal lock-step guard surfaced** (Meal 2/3 dimmed+locked until prior logged; tap routes through the existing lock-gate prompt). **Kitchen trimmed to planning** (Meal Prep + recipes; RA carousel card removed, carousel wrapper dropped → plain Meal Prep card). **White/red rebalance:** killed the stray frosted header bar (transparent; ← Close + Meal chip → white-on-red), enlarged log-sheet + Kitchen cards so white dominates with red as framing — all token-based (`var(--cm-paper)`/`--cm-red`). No backend change. **DEFERRED/QUEUED follow-ups:** (1) **photo verification** — Option B (after AI proposal, user confirms/corrects; image-vs-text mismatch → re-prompt) NEEDS a `/api/food-photo` verify mode (backend); insertion point is `PhotoFoodLogger.jsx:770` (the analyzing→confirm seam; the "HERE'S WHAT I SEE" confirm screen stays the review step); (2) **food-log macro-toggle** (calorie⇄P/C/F meal bars — already built earlier, separate queue); (3) **Home↔Kitchen slide animation**; (4) **new-logo SVG swap** (whistle, recolorable to accent — usages mapped). **FUEL ARC ✅ SHIPPED** (`95d009e`, bundle `NativeApp-6b02277b`): hold-to-reveal calorie hero (solo 70px number on red, label above, press-hold fills glyphs bottom-up by macro w/ haptics+shimmer+double-tap lock, ring removed) + **train→fuel** section (names today's session + real macro delta vs rest day, voiced in the user's coaching style via `adaptMessageSync` `train_to_fuel` 6 plain variants + neutral base) + red-forward visual pass (white-on-red hero/macro rows, hold-tied bars, food-log card stays white), WHY-expander + protein-graph removed, Home/Kitchen + CTAs → canonical pills, `//` removed, Archivo 5-step scale. **⚠️ RECOVERED after an uncommitted-file data loss — a stray `sed -i ''` emptied `fuel.jsx`; reconstructed from session edit-history (no other backup existed: no editor history, no sourcemap, no stash), compiles + deployed. LESSON: commit at milestones; avoid in-place `sed` on uncommitted source.** Open Fuel follow-ups: **(1) new-logo SVG swap** (whistle mark, recolorable to accent — separate pass; all usages already mapped: `components.jsx` `Logo` covers in-app, plus `public/coach-macro-logo.png`/`coach-macro-app-icon-1024.png`/`cm-logo-email.png`/`favicon.svg`, iOS AppIcon set + Splash, FAQ broken `/images/app-icon.png`); **(2) planned-meal sub-card + tooltip fonts** still on DM-Mono (bounded-pass leftovers — plus deep sub-screens Log/Kitchen/MealPrep/Restaurant still carry `//`+DM-Mono); **(3) beginner easy-pace floor** + **`current5KTime` normalization** (wprefs MM:SS-string vs profile_data seconds) still pending. **RUN CARD TYPOGRAPHY (Job 3) ✅ SHIPPED & VERIFIED** (`7feb9d7`, bundle `NativeApp-59cbc9a6`): unified 5-step Archivo type scale on run card + WeekStrip (title 18/800 capitalize, eyebrows 10/700 muted, row 13/700, body 13/400, meta 11/600), DM-Mono/Archivo clash killed, GOCLUB-gated; ONE deliberate color change (per-section eyebrow accents → unified muted ink, per the approved T2 spec). Prior: Stage 5 arc COMPLETE; BUG 2, A, B, day-selection "caps at 4" all DONE & verified on-device; morning-brief "didn't load" → NOT a defect. **🔴 NEW PRE-SUBMISSION SECURITY BLOCKER logged: dev-skip is a production backdoor (5-tap logo → auth + paywall bypass; hardcoded creds in bundle) — must remove before App Store.** Open housekeeping: restore the `d3d00001` drift fixture (currently `c25k`). Follow-ups: hybrid run/lift dayPlan split (branch `goclub-redesign`). **Programming Engine Audit Phase 0 recon map appended (2026-06-24) — the audit's factual foundation; next session designs from it.** Hybrid lift fix 1a (`fc8f7a5`, verified) + 1c labels (`11edcbc`, on-device label check pending) shipped; **1b schema extension is next**. **NEW foundational project logged: RUN ENGINE VOLUME MODEL** + design spec + **Phase 0 recon MAJOR CORRECTION: the volume model already EXISTS & is wired — the "defects" are INPUT (run ability borrowed from liftExp, no running-specific tier) / VISIBILITY (weeklyVolumeMi computed but never shown) / cap-tuning, NOT a missing model. Re-sized: fixes (a)-(e) much smaller; long-run-anchor is the one architectural phase.** RUN VOLUME fix (a) **Phase 1 (`7a9595b`) + Phase 2 (`52a12ef`) DONE & VERIFIED on-device** (bundle `NativeApp-7f133c92`): running-specific `deriveRunAbility` replaces the liftExp borrow; ability inputs required in pure-run + hybrid onboarding AND collected on the switch path → all 3 entry points write the same engine-read wPrefs fields. Verified: switch-into-hybrid beginner inputs → `derivedAbility:beginner`/startVol 2.7. **NEXT: fix (b) — long==easy collapse at low volume (buildSessions cap/fraction tuning, small).** **TAB BAR REDESIGN ✅ SHIPPED — final design = BUMPED PILL** (`4cf1e6b`, supersedes `b00045b`): continuous off-white SVG pill with a smooth center hump cradling a bold flush red + (in-place spin to ×), Today centered below the +, 4 inline destinations + sliding accent pill highlight, tap + → quick-log (Water/Food/Workout). Iteration: off-white → dark-glass → bumped pill. **fix (b) ✅ SHIPPED & verified** (`2cca655`): low-volume long==easy collapse fixed (beginner 2.7mi → long 1.5 > easy 1.25). Open tab-bar follow-ups (non-blocking): quick-log Workout/Water handlers, color-swap polish; swipe-swap DROPPED. **RUN CARD ACCURACY ✅ SHIPPED & verified** (`a93e116`): (c) weekly-mileage "WEEKLY · X MI" row in THIS WEEK + VDOT-accurate paces (delegates to paceService Daniels engine; tempo 13:48→13:05) + NaN-proof parser. Follow-ups: `current5KTime` storage inconsistency (wprefs MM:SS-string vs profile_data seconds — normalise writers); beginner easy-pace floor (decision — pure Daniels slow at low VDOT, shipped as-is). Still tracked: run-volume (d)/(e) + long-run anchor, 1b schema, EMOJICON SWAP, tab-bar quick-log Workout/Water handlers._

---

## 🧪 PENDING DEVICE VERIFICATION (batch)
_**Current committed bundle: `NativeApp-293a5f8e`** (COOKING GUIDE + DIET FILTERING, commit `c6d05ec`)._

- ✅ **COOKING GUIDE PHASE 1 + DIET RECLASSIFICATION — SHIPPED** (`c6d05ec`, bundle `NativeApp-293a5f8e`).
  Meal-detail reskin + authored-instructions render (graceful fallback), reachable from your-week + Kitchen;
  `instructions`/`recipe_kind` schema + 5 seeds; all 299 `diet_tags` reclassified + `primary_diet` (classifier in
  `scripts/reclassify-diet-tags.sql`); generator filters on accurate tags + primary-diet variety preference + Med
  snack fallback. **Verify on device:** (1) Kitchen/your-week → tap a meal → reskinned detail; regenerate to see seeded
  recipes' Steps. (2) Diet → Mediterranean → regenerate → no vegan/carnivore leak, evened-out (not all-fish) draw.
  DB changes already live server-side. Follow-ups: 294 more guides · ~10-15 Med poultry/egg/yogurt meals ·
  plan summary-strip "0 min/0 grocery" bug · legume-path classifier refinement.

- ✅ **MORNING BRIEF — FULLY FIXED & VERIFIED** (`3198a6e`, bundle `NativeApp-39f97684`). Template engine
  (`5abedad`) + **hang-proof context** (`3198a6e`). Real root cause of the 06-26 outage = hanging
  `geolocation.getCurrentPosition` behind a WKWebView permission prompt (NOT AI quota); every network await in
  `gatherBriefContext` now `withTimeout`-wrapped, and the Today loader no longer gates generation behind
  dismiss/trigger. **DB-confirmed:** a fresh 2026-06-29 row writes in the new template voice ("Evening, Demo." +
  priority-picked plateau insight). 🟡 Follow-ups: (1) hybrid-session naming (point brief context at `wPrefs.dayPlan`);
  (2) personality-voicing phase 2 (`adaptMessageSync` + T-map `morning_brief` entry).

- ✅ **DIET CARDS + GROCERY-CLOSE — SHIPPED & VERIFIED on-device** (`3cd8932`, bundle `NativeApp-9e634224`).
  (1) Diet selector → single-column full-bleed photo cards (white text-plate, badge, check, accent glow);
  (2) grocery ✕ returns to opener (Kitchen vs plan). 🟡 **Pending asset drop:** `public/diet-images/{id}.jpg`
  (ids: balanced, high-protein, mediterranean, keto, paleo, vegetarian, vegan, carnivore, low-carb, pescatarian) —
  gradient fallback until then. Still uncommitted (temporary): morning-brief `mb_*` breadcrumbs — being removed in the
  next batch (template-engine rewrite replaces the failing ai() brief).

- ✅ **KITCHEN POLISH — SHIPPED & VERIFIED on-device** (`8651dd1`, bundle `NativeApp-2585c893`). (1) Real spine
  session labels (dayPlan-aware run/lift + split names; fixes hybrid "TRAINING"/"REST"); (2) grocery list redesign
  (aisle-grouped, emoji icons, merged + shop-friendly quantities, persisted check-off progress, collapsible, no
  Instacart); (3) full meal-name list on spine rows (2-line wrap, no "+N"). Fuel-system styling. Still uncommitted
  (intentional, temporary): morning-brief `mb_*` breadcrumbs in `morningBriefService.js` — revert after the cause is caught.

- ✅ **MEAL-PREP LIFECYCLE FOUNDATION — COMPLETE & VERIFIED on-device** (P0s `7a838a5` `NativeApp-c28fc13e` + P1s
  `947d6af` `NativeApp-4414d957`). **P0:** (1) stale-on-ANY-training-change via a stamped `trainingSig` (was
  program-switch only); (2) builds forward from today (rolling 7-day window) instead of fixed Mon–Sun; plan stamps
  `generatedAt`. **P1:** "Planned X days ago" muted line; window-elapsed "plan has ended → Plan next week →" state;
  today-not-covered quiet hint on home food-log + spine shows upcoming days. Fuel-system styling.
  🟡 **Still-logged deferred follow-up:** per-DATE periodization lookahead (forward window crossing a mesocycle boundary
  uses the current block's macro target for the wrapped weekday). **NEXT: the actual MEAL-PREP PLAN screen redesign +
  bottom-overlap bug** (see header). Also still uncommitted (intentional, temporary): morning-brief `mb_*` breadcrumbs in
  `morningBriefService.js` — revert after the cause is caught.

- ✅ **DAY LABELS — SHIPPED & VERIFIED on-device** (`571b1e2`). Real per-day session labels in Kitchen spine + setup
  chips (lifting → "{split} Day", running → "{mi} Mile Run", rest → "Rest"; compact variant for chips). Label-content
  only, styling unchanged.

- ✅ **SET UP MY WEEK FORM — SHIPPED & VERIFIED on-device** (`2eadc59`, bundle `NativeApp-688e4501`). Fuel-system restyle
  of all 6 setup sections; solid-accent selected states; diet grid → 2 popular + expander (all 10 selectable); styling
  only, inputs/side-effects preserved. NEXT: meal-prep PLAN screen redesign + the bottom-overlap bug (see header).

- ✅ **KITCHEN TRAINING-SPINE WEEK — SHIPPED & VERIFIED on-device** (`91fa04e`, bundle `NativeApp-0c3328ef`). Kitchen
  leads with the week as a training spine (per-day session + prepped meals + macro-why vs rest), today's row highlighted
  + one-tap log, redundant launcher removed (one plan-aware surface), recipes demoted (header white-on-red). Empty state
  = Generate-your-week hero. Follow-up (optional): "Log today's meals" currently routes Home to the planned ✓-cards —
  could become an in-place bulk-log; `mealPrepRef` is now an unused decl.

- 🟡 **LOG-SHEET REDESIGN + WHITE/RED REBALANCE — SHIPPED & committed (`4edb691`); on-device eyeball recommended.**
  3 methods (Scan & Snap chooser / Describe / Restaurant AI), surfaced meal lock-step (dimmed+locked Meal 2/3),
  Kitchen trimmed to Meal Prep + recipes, stray white header bar removed, bigger white-forward cards. Frontend only —
  PhotoFoodLogger / BarcodeScanner / search-ai-myfoods-quick sub-views unchanged; the "HERE'S WHAT I SEE" confirm screen
  stays the review step. **Verify:** Scan & Snap → Photo/Barcode; Describe 4-tab toggle; Restaurant AI opens above the
  sheet (z-fix) and adds to the selected meal; Meal 2/3 locked until Meal 1 logged; header has no white strip + the Meal
  chip reads white-on-red. Deferred: photo verification (Option B, backend), macro-toggle (queued), Home↔Kitchen slide,
  new-logo swap.

- 🟡 **FUEL ARC — SHIPPED & committed (`95d009e`); on-device eyeball still recommended.** Hold-to-reveal hero +
  train→fuel intelligence + red-forward visual pass (full description in the header line). Committed & deployed
  (`NativeApp-6b02277b`), compiles clean. **Reconstructed from session edit-history after a `sed -i ''` emptied the
  uncommitted `fuel.jsx`** — faithful to the transcript and verified vs the running bundle, but a human glance at the
  Fuel screen is the final confirmation nothing subtle drifted. Open follow-ups (non-blocking): new-logo SVG swap;
  planned-meal sub-card + tooltip fonts (+ deep sub-screens) still on DM-Mono/`//`; beginner easy-floor +
  `current5KTime` normalization.

- ✅ **RUN CARD TYPOGRAPHY (Job 3) — SHIPPED & VERIFIED on-device** (commit `7feb9d7`, bundle `NativeApp-59cbc9a6`).
  Applied the approved 5-step type scale, **type-only** (size/weight/spacing/font/transform/line-height + capitalize on title);
  no logic/engine/value changes. ~12 style objects across the run card (`sections.jsx` ~:4185–4213) + `WeekStrip` (~:1910–1963):
  - **T1 title** 14/700 lowercase → **18/800, -0.01em, capitalize**, Archivo (`long run`→`Long Run`).
  - **T2 eyebrows** unified to **Archivo 10/700/0.14em caps, muted ink (0.55)** — ALL section labels (YOUR PACES TODAY /
    PRE-RUN FUEL / RECOVERY FUEL / NUTRITION BRIDGE / WeekStrip THIS WEEK / WEEKLY row label).
  - **T3 row title** WeekStrip day labels 14 → **13/700 caps**.
  - **T4 body** consolidated 11/12px → **13/400, lh 1.6, ink 0.8** (description, fuel/bridge bodies, pace rows). Pace numeric
    values keep **700 + monospace** (tabular).
  - **T5 meta** consolidated 9/10px → **11/600/0.04em** (chips, WeekStrip day codes + status). WEEKLY value → 13/800 accent.
  - **DM-Mono killed** on the WeekStrip (eyebrow + day codes + status) → unified to Archivo, ending the DM-Mono/Archivo clash.
    Shared WeekStrip type props gated on `GOCLUB_REDESIGN` (mirrors the existing label pattern at :1950) so the legacy dark
    theme is untouched.
  - **⚠️ ONE deliberate color change** (everything else was pure type): the per-section eyebrow accent colors (paces=red,
    pre-fuel=amber, recovery=green, bridge=red) were collapsed to a **single muted ink (0.55)** — this is baked into the
    approved **T2 spec** ("ONE treatment for ALL section labels … muted ink ~55%"), the intentional move that kills the
    rainbow-eyebrow noise. Box backgrounds/borders unchanged (still color-coded). Body text also nudged full-ink → ink-0.8
    per the T4 spec. No other colors touched.

- ✅ **RUN VOLUME Phase 1 + Phase 2 — VERIFIED on-device & committed** (`7a9595b` Phase 1, `52a12ef` Phase 2; batch row
  23:39). Switch-into-hybrid with entered beginner values (`longestRunMi:1`/`currentRunsPerWeek:0`) →
  `derivedAbility:"beginner"`, `startVol` 2.7 (beginner band) — vs the stale-fixture rows (`6/4 → intermediate/18`).
  `run_ability` breadcrumb reverted; clean-rebuild deployed. **(Surfaced fix (b) — see RUN ENGINE VOLUME MODEL: at
  beginner 2.7mi/wk easy AND long both round to 1.25; distribution-math tuning, separate + small.)**
- ✅ **1c hybrid lift-day LABELS — RE-CONFIRMED on-device** (`d3d00001` shows PPL: PUSH/PULL/LEGS week strip + correct
  Wed header). The earlier `11edcbc` "on-device label check pending" note is now cleared.

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
  - ✅ **RESOLVED in Pass 2 (`43f6ae1`) — long-run source-of-truth split + vetoable preference.** The switch wrote the user's
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
    Recovery-Aware Long Run item below (NOT this fix). APPLIED + committed in `43f6ae1`; engine harness (`getRunWeek`
    end-to-end) proved honor/veto/fallthrough for SHORT names.
  - 🟡 **Pass 2 DEVICE-VERIFICATION IN PROGRESS (resume next session) — do NOT push `43f6ae1`, do NOT revert the
    breadcrumb, until all 3 resolve.** Engine harness proved the logic; on-device render verification is incomplete.
    State: Pass 2 committed (`43f6ae1`) **NOT pushed**; temp `lr_decision` breadcrumb **uncommitted** (live as
    `NativeApp-c78f2589.js`); `d3d00001` collapsed to this test setup (`strength_run`, 5-day). Threads (#2 RESOLVED;
    **#1 and #3 remain — resolve #1 first**):
    1. ✅ **RESOLVED — NOT A BUG.** User clarified the pick was **Mon/Tue/Wed/Sat/Sun (5 days, no Thursday)** — exactly
       what the DB shows (`trainDays=[Mon,Tue,Wed,Sat,Sun]`). Last session's "6 days + Thursday" was a description
       misremember, not a save failure; the day-count save path is correct. (The "long-run Sunday" recollection vs
       DB `longRunDay=Sat` is also explained by thread #3: user PICKED Sat, the safeguard MOVED the long run to Sun,
       so the user saw Sunday and conflated it with the pick.)
    2. ✅ **RESOLVED — NOT A BUG (recon).** `HYBRID_TEMPLATE_CYCLES` resolves correctly: `d.splitType = prog.name =
       "Strength-Biased Hybrid"` (hyphen) matches the map key (hyphen) exactly → chain resolves to **Push/Pull/Legs**.
       The observed `[upper, upper, heavy_lower]` dayPlan **IS** PPL — it's the signature (`heavy_lower` on the **3rd**
       lift day = Legs as PPL's 3rd entry; Upper/Lower would put it **2nd**, generic-null would have **none**). The
       "looks like Upper/Lower" was a `liftFocus`-vocabulary misread: `liftFocus` is a 3-value enum
       (`heavy_lower|full|upper`) so Push AND Pull both render `"upper"`. Every consumer reads `liftFocus` only as
       `=== 'heavy_lower'` (`deriveDayModality:1433`, `ob_screens2:4753/4808`), so the Push/Pull distinction isn't lost
       (workout content comes from `splitType`+cycle downstream, not `liftFocus`). No key to align.
    3. **`lr_decision` breadcrumb didn't fire (no rows) — `getRunWeek` not hit on the run-day view used.** Determine
       where `getRunWeek` actually runs / why no log, so the honor/veto test CAN be verified. (Breadcrumb stays
       uncommitted; keep it.)
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
- **EMOJICON SWAP — run-ability steps use stock iOS emoji; swap to the app's emojicon pack.** Small, own commit.
  **Recon done (2026-06-25):**
  - **Pack = Iconify `@iconify/react`, prefix `fluent-emoji-flat`**, rendered offline via `src/iconData.js`
    (`addCollection`, generated by `scripts/extract-icons.js`). Usage: `<Icon icon="fluent-emoji-flat:…" width height/>`
    (`ob_screens2.jsx:50/10398`). 2-pack fallback (`getFoodIcon` `iconMap.js:164`): `FOOD_ICON_MAP` (fluent-emoji-flat) →
    `TWEMOJI_FALLBACK_MAP` (twemoji) → generic — **but that's a FOOD-keyword resolver**, not a general UI-icon fallback;
    non-food icons use direct ids.
  - **Scope corrections:** (1) the **`ob_screens2.jsx` onboarding `run_*` steps have NO emoji** (use `optPill`, label+desc
    only) — nothing to swap there (adding icons = a net-add to `optPill`, bigger). (2) Only the **`RunProgramSetup`
    TapCards** use stock emoji (🏃 freq, 📏 longest; baseline 🏃/🚶/📊). (3) **Blocker:** `iconData.js` bundles **87 food
    icons only** — `person-running`/`straight-ruler`/`calendar`/`bar-chart`/`chequered-flag`/`person-walking` are NOT
    bundled, so they'd render blank offline. **Swap requires** adding the ids to `scripts/extract-icons.js` + re-running it
    to regenerate `iconData.js`, then `import { Icon }` into RunProgramSetup and pass `<Icon .../>` as the TapCard `icon`
    prop (it renders any node). i.e. RunProgramSetup-only, with the bundle-regen build step.
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
- **TAB BAR REDESIGN — ✅ SHIPPED & VERIFIED on-device. FINAL DESIGN = BUMPED PILL** (commit `4cf1e6b`, **supersedes**
  the earlier `b00045b`).
  - **FINAL SHIPPED SPEC (5-tab GoClub bar, scoped via `_use5tab`; 3-tab/flag-off + base nav untouched):**
    - **Continuous off-white SVG pill** — the bar background is an inline `<svg>` (`.tab-bar-svg`) with rounded stadium
      ends + flat bottom + a **smooth center hump** that cradles the +. Path is **generated from the measured bar width**
      (`barDims` via `getBoundingClientRect`, re-measured on resize) so the ends/hump keep FIXED radii (`TAB_HUMP_RISE=30`,
      `TAB_HUMP_HALF=50`) and only the flat segments stretch → **no hump distortion at any width**. Fill
      `var(--cm-offwhite,#F4F1EC)`; warm float via SVG `drop-shadow(0 12px 26px rgba(120,8,4,.24)) …`. The bar `<div>` is a
      transparent flex container. **No `overflow:hidden`** anywhere (hump rises above, un-clipped); `position:fixed` preserved.
    - **Flush red + glyph in the hump** — bold (`font-weight:700`, 32px, `var(--cm-accent)`), raised (`top:-38`), square
      flex box + `transform-origin:center` so it **spins to × IN PLACE** (open = `translateX(-50%) rotate(135deg)`, no drift).
    - **Today centered BELOW the +** (inline tab, keeps its ref → slider highlight + `handleTabPress('today')`); the 4 fixed
      destinations **Train·Fuel·[Today/+]·Stats·You** sit inline around the center.
    - **Sliding accent pill highlight** — fixed 54×46 stadium, translateX-only (**centered on the active icon, no resize**);
      `var(--cm-accent)` (palette-aware); loop-safe `setSliderPos` bail-out + deps `[_use5tab, section]` (stopped the render-loop crash).
    - **Tap + → quick-log panel** (rises above the bar, + spins to ×): **Log Water / Log Food / Do Workout**. Emojicon
      icons (`fluent-emoji-flat` via `iconData.js`: droplet / fork-and-knife / person-lifting-weights).
  - **Iteration path (history):** off-white floating pill (`b00045b`) → dark-glass blur variant → **bumped pill** (final,
    `4cf1e6b`). Earlier v5 mocks (`-pill-big`/`-notched-plus`/`-v3`/`-bumped-pill.html`) were the design path.
  - 🔧 **OPEN follow-ups (tracked, non-blocking):**
    - **Quick-log handlers** — **Do Workout** → currently `handleTabPress('train')`; refine to today's scheduled session
      (lift/run/hybrid, no assumption). **Log Water** → currently routes to Fuel; wire a **direct water quick-add**. (Log Food → Fuel is fine.)
    - **Color-swap polish** — the warm red-tinted hump shadow + (legacy) notch-border assume a red palette; eyeball on
      non-red accents (blue/pink/etc.) once. Non-blocking.
  - 💤 **DROPPED — swipe-swap (2b):** the + is now **always visible** in the hump (with Today inline below), so the
    Today⇄+ swap no longer applies. (A vertical swipe on the center still toggles the quick-log panel.)

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
  - **FLAG (from Pass 2 recon) — `liftFocus` enum granularity.** The dayPlan `liftFocus` is a 3-value enum
    (`heavy_lower|full|upper`), so Push AND Pull both collapse to `"upper"`. Fine NOW (every consumer reads it only as
    `=== 'heavy_lower'`; Push/Pull/Legs workout content comes from `splitType`+cycle, not `liftFocus`). BUT if the audit's
    **head-level muscle coverage** needs per-day push/pull/legs granularity encoded IN the dayPlan, the enum may need
    widening. Not a current bug — flagged for the audit.
  - 🔴 **FLAGSHIP DEFECT — HYBRID LIFT CONTENT ↔ dayPlan DISCONNECT** (real defect, pre-existing, **NOT a Pass-2
    regression**). Hybrid lift-day CONTENT comes from a **static template** (`getTodayHybridWorkout` →
    `HYBRID_PROGRAMS[template].weekly_structure`, keyed by **DAY NAME**, lift days hardcoded e.g. Mon/Wed/Fri) and
    **IGNORES the user's picked dayPlan entirely**. When picked lift days ≠ template's fixed days, content is wrong:
    confirmed repro (picks Mon/Tue/Wed lift) → Mon=Push ✓, **Tue=Easy Run ✗** (run on a lift day), **Wed=Pull ✗** (Pull
    on the Legs day), and **Legs (template Fri) NEVER delivered** (user didn't pick Fri) → a whole muscle group dropped.
    **THREE disconnected representations** of each lift day: (1) dayPlan `liftFocus` [PPL cycle, read only as
    `===heavy_lower` for DOMS], (2) WeekStrip label [`autoFocus`→`SPLIT_CYCLES`, no hybrid key → "Full Body" for all],
    (3) content [static template by day name]. None driven by the user's picks; none agree. Pass 2 wired
    dayPlan→run-placement+DOMS but lift CONTENT was left on the legacy static template (`sections.jsx:2667`
    "byte-for-byte unchanged"). **FIX = the AUDIT's core job:** drive per-day lift content from the cycle/dayPlan
    (correct body part per picked day, no dropped muscle groups), unify the 3 representations to one source. **This is
    the audit's flagship concrete example.**

  - **📋 PHASE 0 RECON MAP (2026-06-24) — the audit's factual foundation. Next session DESIGNS from this; do not re-derive.**
    Read-only map of how content flows TODAY. Four parts:

    **(1) CONTENT SOURCES — per program type.** Central dispatch: every day routes through `resolveProgram(wPrefs,
    profile).mode` (`programResolver.js:132`; modes `hybrid-hyrox|hyrox|hybrid|running|conditioning|lifting`). Two
    consumers read it: Train tab (`sections.jsx:2535`, per-day `if/else` chain `:2588–2676`) and Today tab
    (`ob_screens2.jsx:7858`, mirrors Train).

    | Type | Source | Entry point | Class | Keyed by |
    |---|---|---|---|---|
    | Pure lifting | `PROGRAMS_BY_DAYS[days].splits[splitType].workouts[dayKey]` | `getWorkoutForDay()` `programs.js:2598` (call `sections.jsx:2589`) | Static template + runtime overlay (progression/SKILL_OVERRIDES/GVT/soreness) | `splitType`→`selectDayKey()` `:2589`→`_sessionIndex()` `:2561` = cycle index anchored on `program_start_date` |
    | Pure run | run engine `generateRunWeek()` `runEngine.js:564` | `getTodayRunWorkout()` `running_programs.js:1618`→`getRunWeek()` `:1581` (call `sections.jsx:2611`) | Generator | day name in generated week (`:1630`) |
    | Hybrid lift days | `HYBRID_PROGRAMS[template].weekly_structure` | `getTodayHybridWorkout()` `running_programs.js:1658` (call `sections.jsx:2670`) | Static template | **DAY NAME hardcoded** (flagship defect) |
    | Hybrid run days | run engine (same as pure run) | `getTodayRunWorkout()` (call `sections.jsx:2651`) | Generator | `deriveDayModality()` `running_programs.js:1417` + `dayPlan` |
    | HYROX | `HYROX_PROGRAM[name].weeks_detail[].days[]` `running_programs.js:675` | `getTodayHyroxWorkout()` `:1651` (call `sections.jsx:2632`) | Static template (sparse) | (weekNumber, day name) |
    | Conditioning/metcon | `PROGRAMS_BY_DAYS` conditioning split keys (e.g. `programs.js:471`) | `getWorkoutForDay()` — mode collapsed conditioning→lifting at `sections.jsx:2536` | Static template (lifting path) | same cycle-index walk |

    Catalog→source: `PROGRAM_LIBRARY` (`programs.js:2455`) via flags in `deriveProgramFields` (`programResolver.js:57`):
    no-flag→lifting; `isConditioning`→conditioning(→lifting); `isRun`→run engine; `isHyrox`→HYROX; `isHybrid`→
    HYBRID_PROGRAMS+run engine; `isHybrid+isHyrox`→`getTodayHybridWorkout("Hyrox Hybrid")`. **Dead/orphaned content
    (exported, zero daily-dispatch consumers):** `CONDITIONING_PROGRAMS` (`programs.js:2373`), `STRONGLIFTS_5x5` (`:2433`;
    live SL5x5 is the in-`PROGRAMS_BY_DAYS` split), `GLUTE_PROGRAMS` (`:1543`; picker-UI only). **Catalog gap:**
    `hybrid_foundation`/`tactical_hybrid` have NO matching `HYBRID_PROGRAMS` template (only 4 templates exist there).

    **(2) MUSCLE COVERAGE — static lifting content is largely COACH-GRADE (so the audit is mostly "connect content to
    dayPlan," NOT "rebuild content").** Core splits (6-day PPL×2, 5-day ULPPL, Bro Split, Arnold) hit all 3 delt heads
    (lateral+face pull+rear-delt fly), triceps long/lateral, biceps long/short/brachialis, quads/hams/calves. Exercise
    schema: `{name,sets,reps,notes,primary}`. Golden-Era/signature programs EXIST and are author-faithful: Arnold Split
    (`programs.js:1336`), Platz Volume (`:995`), HIT/Mentzer (`:444`), Nubret/Weider/Reg Park/GVT (no "Zane"). Full
    novice/advanced arrays via `SKILL_OVERRIDES`. **Two content-level gaps (not rebuilds):** (a) NO structured
    `rest`/`tempo`/`RIR` field anywhere — rest only as prose in some `notes`; (b) THREE incompatible schemas —
    `PROGRAMS_BY_DAYS`/`GLUTE_PROGRAMS` use `workouts{day:[...]}`, PREGNANCY/POSTPARTUM use flat `exercises[]`,
    `HYBRID_PROGRAMS` (running file) stores lift days as **free-text `description` strings** ("Deadlift 4×3-5, Barbell
    Row 4×4-6…"), not arrays. Minor selection gaps: standard PPL/Upper-Lower no direct hip-thrust; PHUL Power Upper +
    2-day Full Body lack a dedicated rear-delt move.

    **(3) GOOD vs BROKEN.** WORKS AS-IS: **Pure lifting definitively does NOT share the hybrid disconnect** — title +
    content use the SAME `_sessionIndex` cycle-walk with matching args (content `getWorkoutForDay`/`selectDayKey`
    `programs.js:2598/2589`; title `selectDayKey`+`baseName` `NativeApp.jsx:937–945`; brief `morningBriefService.js:60`);
    pick any N days → cycle advances correctly, no dropped day (the Stage-6 unification). Pure run consistent (title +
    content both from generated `runWeek`). Conditioning inherits lifting's correct path. Hybrid run days route through
    the engine + respect dayPlan. BROKEN/GAPS: 🔴 hybrid lift-day content↔dayPlan disconnect (`getTodayHybridWorkout`
    `running_programs.js:1658` matches by day name, ignores `dayPlan`); three disconnected hybrid lift-day reps disagree
    (`liftFocus` enum `ob_screens2.jsx:4748`; WeekStrip `autoFocus`→`SPLIT_CYCLES` has no hybrid key→"Full Body"
    `components.jsx:187/444`; static day-name content); **HYROX undefined-weeks gap** — `weeks_detail` defines only a few
    weeks (12-week = 1,4,8,10,12), `getTodayHyroxWorkout` returns `null` otherwise → "No Program Selected"
    (`sections.jsx:4207`) on real training days; hybrid/HYROX have NO week-to-week progression engine (same static
    structure every week; overload text-only).

    **(4) STANDARDS GAP (adopt-list vs today).**
    | Standard | Status | Evidence |
    |---|---|---|
    | Volume landmarks MEV→MRV + auto-deload | PARTIAL | MEV/MAV/MRV are display-only analytics (`MuscleVolumeChart.jsx:49–89`), `OPTIMAL_SETS` zones (`recoveryService.js:27`); deload real but signal-based fixed 50% cut (`deloadService.js:17`), NOT a weekly ramp; not wired to generation |
    | Stimulus-to-Fatigue-Ratio selection | GREENFIELD | zero hits; `exerciseMuscleMap.js` has only primary/secondary + prose, no SFR scores |
    | Frequency per experience level | PARTIAL | per-SESSION sets/reps/rest/RPE by goal×level wired (`data/prescription.js:18`, `getPrescription` `:123`, used `sections.jsx:2713`)+`SKILL_OVERRIDES`; training age `progressionService.js:130`. Per-MUSCLE weekly frequency by level = greenfield |
    | Emphasis / maintain / ignore | PARTIAL | `weakPoints` collected (`onboarding.jsx:1681`), used only to SORT priority exercises (`sections.jsx:2741`, `ait.js:109`); no extra sets/freq, no maintain/ignore tiers, no reallocation |
    | Feedback-driven weekly volume adj. | PARTIAL | single GLOBAL LLM `volumeAdjustment` multiplier (`adaptiveAnalysisService.js:95`→`adaptiveSessionService.js:78`), not per-muscle set add/cut |

    **WIRED BASELINE that already EXISTS (audit does NOT rebuild this) — app is a daily readiness/recovery
    autoregulation system, not an RP mesocycle system:** multi-signal readiness modifier (`recoveryService.js:218`),
    per-lift autoregulated progression + plateau detect (`progressionService.js:45/105`), personalized DOMS learning
    (`domsLearningService.js`), session-spacing guards (`adaptiveSessionService.js:6`), run-engine DOMS-aware lift
    placement (`runEngine.js:158`), strength-sport phase periodization (`strengthPeriodisationService.js`), on-the-fly
    AI session adaptation (`sections.jsx:949`).

    **⚠️ SETS/REPS TWO-SOURCE RECONCILIATION NOTE:** sets/reps have TWO sources — the static templates' own `sets/reps`
    in `PROGRAMS_BY_DAYS`, AND the `getPrescription` goal×level scheme applied at `sections.jsx:2713`. How they interact
    (override vs merge) must be confirmed when the audit defines the volume standard.

  - **✅ PHASE 1 DESIGN DECISION (SETTLED 2026-06-24) — designed from the Phase 0/1 recon above.**

    **UNIFIED EXERCISE SCHEMA:** extend the existing 5-field lifting object `{name, sets, reps, notes, primary}` with
    structured fields `{rest:Number(sec), tempo:String|null, rir:Number|null, secondary:[String]|null}`. Constraints
    from recon: (1) `name` is the universal join key across ~15 consumers + DB — **NEVER reformatted**; (2) new fields
    are generation/render-time only — **NOT persisted** (`finishWorkout` `ob_screens2.jsx:8334` stores only `name` +
    per-set `{weight,reps,done}`), so **NON-BREAKING, no `workout_logs` migration**; (3) the prescription overlay
    (`getPrescription` `data/prescription.js:123`) already populates sets/reps/rest and currently **DROPS `rpe`** — the
    new `rir` field is where dropped `rpe` goes.

    **SETS/REPS RECONCILIATION (Phase 2 — mostly already done in code):** the live behavior is
    **prescription-overrides-static** (`sections.jsx:2712`, when `trainingGoal` set). Phase 2 shrinks to: document the
    rule + stop dropping `rpe`→`rir`. **Not a rebuild.**

    **HYBRID LIFT CONTENT (Option 3 — the flagship fix, CONFIRMED FEASIBLE):** hybrid lift days route to
    `getWorkoutForDay` (pure-lifting path) indexed by dayPlan cycle position, **ABANDONING** the separate
    `HYBRID_PROGRAMS` free-text lift content.
    - **Mechanism:** stop DISCARDING the cycle label in `buildHybridDayPlan` (`running_programs.js:1396` — `cyc[i%len]`
      is computed then collapsed to the enum); widen `dayPlan` to carry it (also serves the `liftFocus`-granularity flag
      + head-level muscle work). Hybrid lift day's ordinal position `k` → `getWorkoutForDay(splitType =
      HYBRID_TEMPLATE_CYCLES[template], dayIndex = k, omit schedule/startDate for positional indexing)`.
    - **Coverage:** all 5 mapped templates have pure-lifting content (PPL exact `programs.js:63`, U/L positional
      `programs.js:288`), **ZERO new authoring**. Hyrox Hybrid excluded (own path).
    - **Blast radius:** `sections.jsx:2669-2670` only; run days untouched. `getSkillVariant` is **DEAD code** (never
      called) so hybrid `skill_variants` are dead data — removal loses nothing rendered. `HYBRID_PROGRAMS` **NARROWS**
      (keeps `nutritionBridge`, `raceSimulation`, run-day desc, Hyrox Hybrid); only the 5 templates' lift-day
      `weekly_structure` becomes unused.
    - **RESULT:** fixes flagship defect at root (no divorced hybrid content), hybrid inherits coach-grade coverage
      automatically, unifies the 3 disconnected representations, collapses the schema question.
    - **BUILD SEQUENCE:**
      - ✅ **1a — Option 3 hybrid lift reroute — DONE & committed (`fc8f7a5`), VERIFIED on-device** (DB-confirmed:
        `d3d00001` Wed→k=2→Legs→Barbell Squat, 5 exercises; Mon=Push/Tue=Pull deterministic). Adds `cycleLabel` to
        dayPlan (additive), shared `buildLiftingPrescription` helper (pure-lifting byte-identical), widens 3 array guards.
        Temp `hybrid_lift_route` breadcrumb added then reverted (clean tree hash-matched the pre-breadcrumb build).
      - ✅ **1c — label-layer fix — committed (`11edcbc`), built & deployed (`NativeApp-ef2c6bec`); on-device label
        verification pending.** `dayFocus` build (`NativeApp.jsx:937`) labels hybrid lift days from `cycleLabel`
        (post-1a) or ordinal fallback (pre-1a dayPlans, same k + cycle map as content) → week strip PUSH/PULL/LEGS +
        day-header descriptor match content. Additive + hybrid-gated; pure-lifting unchanged (byte-identical `selectDayKey`
        path). Fixes the WeekStrip "UPPER" + the "balanced push/pull on a Legs day" header.
      - ⬜ **1b — schema extension** (rest/tempo/rir/secondary) — NEXT; recon done (Phase 1 design decision above).

- **RUN ENGINE VOLUME MODEL** — large, **foundational OWN PROJECT** (sibling to the Programming Engine Audit). The
  run engine has sophisticated DOMS/recovery PLACEMENT (`runEngine.js` `generateRunWeek`) but **no volume model**. THREE
  CONFIRMED DEFECTS (found on-device, hybrid 5-day, validated against Runna):
  1. **No weekly mileage model** — a beginner's plan opens at ~12 mi (6+6) week 1, with no starting-volume calc from
     fitness level and no week-over-week ramp. (Runna: starting weekly mileage set from fitness, builds gradually,
     deloads every 3-5 weeks.)
  2. **Run types not differentiated by distance** — long run AND easy run both 6 mi (should differ: easy = most of weekly
     volume, conversational, shorter; long = the weekly distance peak; plus tempo/intervals as distinct hard sessions).
     Runna: 80/20 easy/hard, 4 long-run subtypes, easy/hard/long distances tuned independently.
  3. **No week-over-week progression or deloads** in the run plan (static distances every week).
  - **MODEL TO BUILD (Runna-informed):** onboarding inputs → starting weekly mileage → distribute across run types by
    distance+pace (80/20) → progress weekly → deload every 3-5 weeks.
  - **SOURCE OF TRUTH:** Emiliano providing Runna's full onboarding breakdown (questions + answer choices) as the design
    spec foundation — the input→volume mapping the public pages don't reveal. **Designed from the Runna breakdown next.**
  - **RELATED:** the long-run-day DOMS veto (long run moved Sat→Sun for hybrid) — revisit whether the long run should
    ANCHOR and the LIFT move instead, as part of this model + the hybrid interaction. (Cross-refs the TRANSPARENT
    RECOVERY-AWARE LONG RUN item below.)
  - **📐 DESIGN SPEC (from Runna onboarding breakdown + support-doc mechanism, cross-verified):**

    **INPUT MODEL (what onboarding must collect to drive volume):**
    - **Running ABILITY = master volume input.** Tiers DEFINED BY SINGLE-RUN CAPABILITY (Runna's): Beginner = 5k
      continuous <60min; Intermediate = regularly ≥5k unstructured; Advanced = regularly ≥10k + some structure; Elite =
      regularly HM+. Ability → starting weekly mileage AND per-workout distances (NOT total-weekly — single-run capability).
    - **BEGINNER GUARDRAIL (the 'beginner at 12mi' fix):** if user CAN'T run 5k continuous → route to run-walk intervals
      plan (distinct type, 2-4 days), NOT a mileage plan. A true beginner gets intervals, not miles.
    - **Goal** (race/distance/start/return/improve/general/functional/post-injury/post-race) → plan type + race-anchoring.
    - **Injury history** (rarely / minor-past / frequent-recent) → volume conservatism + recovery.
    - **DOB, gender** → physiological adjustment. **Estimated race time** → pace zones (HAVE: `vdotFromRaceTime`).
    - **Days/week** (2-4 new, more experienced) → session split. **Days + long-run day** → placement. **Plan length**
      (7-26wk/custom) → ramp slope + deload count. **Miles/km** → units.

    **VOLUME MODEL (the 4 builds):**
    1. ability → starting weekly mileage + max single-run distance (fixes beginner-at-12mi).
    2. weekly mileage → distribute across run TYPES by distinct distance+pace, 80/20 easy/hard: easy = bulk of
       volume/shorter/conversational, LONG = weekly distance PEAK, tempo/intervals = the 20% hard. NEVER same distance
       (fixes long=easy bug).
    3. weekly progression: long run + weekly volume ramp gradually, slope from plan length × ability.
    4. deload every 3-5 weeks: drop weekly mileage (HAVE `deloadService` — signal-based; wire into the run calendar).

    **HYBRID INTERACTION:** the run volume model must account for lift-day fatigue (the existing DOMS veto) — and revisit
    whether long run anchors and the LIFT moves instead (cross-ref Transparent Recovery-Aware Long Run).
    **Cross-verified:** Runna support 'Adjusting Your Running Ability' (ability underpins mileage + workout distances);
    marketing (80/20, progressive long runs, deloads 3-5wk).
  - **🔎 PHASE 0 RECON — MAJOR CORRECTION (2026-06-24): the volume model EXISTS and is wired** (`runEngine.js`:
    `START_BANDS`, `getStartingVolume`, `buildVolumeProgression` w/ 10% ramp + down-weeks every 3-4 + taper, 80/20
    distribution in `buildSessions` w/ long-run-longest invariant; `getRunWeek`→`generateRunWeek` is the live source for
    pure-run AND hybrid run days). **The 3 "defects" are INPUT/WIRING/VISIBILITY, not a missing model.**
    - **ROOT (Q4): NO running-specific ability tier.** `experience = profile.skill_level || wPrefs.liftExp ||
      'intermediate'` (`buildRunEngineInputs:1535`), and `skill_level` is set FROM `liftExp` (`NativeApp.jsx:631`). So
      **run ability = LIFTING experience** → a beginner runner classified 'intermediate' → `START_BANDS.intermediate`
      (~20mi) not beginner (12) → the '12mi'/'6+6' symptom. The volume math is correct; it's fed the wrong ability.
    - **THE FIXES (re-sized — much smaller than "build a volume model"):**
      - **(a) RUNNING-SPECIFIC ABILITY INPUT** (core — root of #1 + most of #2): a run ability tier decoupled from
        `liftExp`, derived like Runna from CURRENT single-run capability / current race time (Beginner=5k continuous
        <60min, Intermediate=regularly ≥5k unstructured, Advanced=≥10k+structure, Elite=HM+). Image-1 screenshot =
        Runna's 'current 5k/10k/HM/M time' input. Feed this to `getStartingVolume`'s `exp` instead of `liftExp`.
      - **(b) 'long==easy' collapse:** caps+rounding at the inflated volume (`easyDist` hits beginner cap 6,
        `longRunDist` rounds ~6, invariant raises long to match). Largely DISSOLVES once (a) feeds the correct lower
        beginner volume; may need cap/fraction tuning in `buildSessions`.
      - ✅ **(c) SURFACE WEEKLY MILEAGE — SHIPPED & VERIFIED** (commit `a93e116`). `weeklyVolumeMi` (already on
        `runWeek`/`todayPrescription`) now renders as a **"WEEKLY · X MI" summary row** under Sunday in the THIS WEEK
        list (`WeekStrip` `weeklyMi` prop). Display-only; engine untouched.
      - ✅ **RUN PACE ACCURACY (VDOT) — SHIPPED & VERIFIED** (commit `a93e116`). `getPacesFromTime` (`runningPaces.js`)
        now delegates to the validated **Daniels VDOT engine** (`paceService.js` `vdotFromRaceTime` + `trainingPaces`)
        instead of flat 5K-pace multipliers → fixes the tempo overshoot (39:36 5K: tempo 13:48→**13:05**, easy 16:23,
        interval 12:41), one source of truth. **NaN guard:** robust parser (number / MM:SS / H:MM:SS / numeric → seconds,
        else null → paces block hides). No engine/distribution change (fix b untouched).
        - 🧹 **FOLLOW-UP — `current5KTime` storage inconsistency:** `wprefs.current5KTime` = `"39:36"` (STRING, MM:SS)
          while `profile_data.current5KTime` = `"2400"` (number, seconds) — **different formats AND different values**
          (39:36 vs 40:00). The new parser tolerates both, but **writers should normalise to ONE format + ONE source of
          truth** (other readers like `ob_screens2:8196` assume the MM:SS string). Tracked, non-blocking.
        - 🟡 **DECISION — beginner easy-pace floor:** pure Daniels easy/long are intentionally **slow at low VDOT**
          (VDOT 22: easy 16:23 / long 16:57). **Shipped as-is (correct per the model).** Revisit whether a beginner
          wants an easy-pace **floor** as a deliberate product tweak (faster than Daniels for very low fitness).
      - **(d) TRUE-BEGINNER run-walk routing** (Runna guardrail): `isTrueBeginner` flag exists (`buildSessions`:
        `currentRunsPerWeek===0 || longestRunMi≤1`) but only adds notes — no distinct run-walk plan. Route non-runners
        to intervals, not a mileage plan.
      - **(e) PROGRESSION 'looks static'** = visibility (UI shows today only) + possibly `weekInPlan` anchor
        (`runPlanStart`) being off. Verify the anchor; surface the multi-week arc.
    - **ARCHITECTURAL (separable, largest): long-run ANCHOR (#3/Q5)** — invert the lift-then-run placement (lifts
      placed first to `dayPlan`, run engine reads `heavyLowerDays` as immutable; long run flexes around fixed lifts).
      To anchor long run + move the lift: either move DOMS-adjacency reasoning into `buildHybridDayPlan` (write-time) or
      add a reconciliation pass. Feasible, not a flag — own phase.
    - **Cross-verified:** Runna support 'Adjusting Running Ability' + Image-1 onboarding screenshot.
  - ✅ **PHASE 1 — DONE & VERIFIED, committed `7a9595b`** (bundle `NativeApp-7f133c92`).
    - **Engine:** `deriveRunAbility({longestRunMi,currentRunsPerWeek,seconds5K})` (`runEngine.js`, beside
      `getStartingVolume`) returns exactly `{beginner|intermediate|advanced}` (thresholds on real onboarding bucket
      edges: beginner = `rpw===0` or `longestRunMi≤2`; advanced = `longestRunMi≥8` or `rpw≥3 && seconds5K≤1500`;
      else intermediate). `:1538` repoint: `experience = wPrefs.runAbility || deriveRunAbility(...) || 'intermediate'`
      (was `skill_level||liftExp||'intermediate'`). **Lifting path untouched** — only this one running consumer changed.
    - **Onboarding collection:** pure-run made REQUIRED (removed `run_5k` skip + `run_longest` non-HM skip; `run_frequency`
      was already required); **hybrid** now collects them too (`run_5k`/`run_frequency`/`run_longest` added to the hybrid
      `_stepSeq` after `hyb_split`; full reuse of existing step components); the 3 write gates widened
      `focus==="run"` → `(focus==="run"||focus==="hybrid")`. Lifting onboarding never sees these.
    - _(Temp `run_ability` breadcrumb used for verification — reverted post-verify.)_
  - ✅ **PHASE 2 — DONE & VERIFIED, committed `52a12ef`** (switch path, Option X). RunProgramSetup `Step3Running` collects
    frequency+longest (`TapCard`, required) + reuses the existing baseline 5K (`actualDist==='5k' ? baselineSecs :
    proj.fiveK`); both `saveRunProfile` payloads carry the 3 fields; `handleCantRun` writes beginner `0/1`. `doActualSwitch`
    threads `_freshRun.{currentRunsPerWeek,longestRunMi,current5KTime}` into `activateProgramMode`, which syncs them to the
    engine-read wPrefs fields (mirrors the `longRunDay` sync at `ProgramLibrary.jsx:85`). **All 3 entry points now write
    the same wPrefs ability fields → no fourth path.** Verified on-device: switch-into-hybrid beginner inputs →
    `derivedAbility:"beginner"`, `startVol` 2.7 (was always intermediate/18 on switch).
    - 🧹 **STALE COMMENT (tiny follow-up):** the `running_programs.js` repoint comment still says "switch-in users resolve
      intermediate until Phase 2" — now only true for **legacy null-data users who never re-switch**; update wording.
  - ✅ **fix (b) — long==easy collapse at LOW volume — SHIPPED & VERIFIED** (commit `2cca655`). Long-run-longest invariant
    `< → <=` with `roundDist(maxOther+0.25)` (`runEngine.js`) so long stays strictly > easy at low volume. **DB-confirmed:**
    beginner 2.7 mi/wk now **long 1.5 > easy 1.25** (was 1.25 = 1.25), three consistent `run_ability` breadcrumb fires.
    Fires only on tie/inversion (low volume); zero distortion at normal volumes.

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
