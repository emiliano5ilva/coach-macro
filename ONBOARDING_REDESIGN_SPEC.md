# Coach Macro — Onboarding Redesign Build Spec

**Goal:** Replace the current ~64-screen onboarding with a conversion-optimized flow
(~26–30 screens for a typical user) that front-loads value, delivers psychological
"insight" moments at emotional high points, builds to a personalized plan reveal, and
ends at the Apple Pay trial-start paywall. Nothing comes after the paywall except the app.

---

## 0. GUARDRAILS — read before writing any code

1. **Build the new flow ALONGSIDE the old. Do NOT delete the existing onboarding until the
   new flow is verified working end-to-end on a real device.** Use a feature flag / new
   component tree so we can fall back instantly.

2. **REUSE existing infrastructure — do not rebuild:**
   - Existing input components (the rolodex pickers for DOB/height/weight, the tap-card
     selectors, unit toggles, body-fat silhouettes) — restyle/reorder, don't recreate.
   - The existing TDEE/BMR calculation logic (whatever currently powers the TDEE reveal
     screen). The reveal in this spec uses the SAME math.
   - `saveProfile()` → Supabase (fires at end of onboarding, before paywall — same as now).
   - `purchaseAnnual()` / `purchaseMonthly()` in `purchaseService.js` (the paywall CTA calls
     these — already wired to RevenueCat).
   - Existing referral/promo-code validation.
   - Apple Health connect logic (`healthConn`).

3. **MATCH THE EXISTING DESIGN SYSTEM EXACTLY.** Confirm the real tokens from the current
   onboarding files (`ob_screens.jsx`, `onboarding.jsx`) before building:
   - Background: `#080D1A` (or whatever the current bg is — confirm)
   - Headers: Barlow Condensed, 900 weight, italic, uppercase
   - Eyebrow/mono labels: DM Mono, "// label" style
   - Red accent: `#E8341C` (NOT a brighter red)
   - Muted body: the existing `rgba(245,245,240,0.5)` (BUT see note in §4 — insight screens
     use higher-contrast text)
   - Card inputs, progress bar style: match existing
   - **The visual mockups approved in design review used Playfair Display (serif) and
     `#FF3B30` as APPROXIMATIONS. Do NOT copy those literally. The mockups define copy,
     layout, hierarchy, and structure. The skin is the existing app's tokens above.**

4. **Every personalized number is COMPUTED from the user's real answers — never hardcoded.**
   See §7. A sample number shown to the wrong user breaks the entire effect.

5. **Acronym rule:** any acronym or technical term is unpacked in plain language in the same
   sentence (e.g. "RED-S — relative energy deficiency, your body running on empty"). Never
   leave the user wondering what a term means.

---

## 1. CORE PRINCIPLES

- **Topic completeness:** a topic is either asked thoroughly (enough questions to feel
  cared-about) or not raised at all. No orphan single-questions that make the app feel shallow.
- **Few insights, each a gut-punch.** Most screens are fast, frictionless data capture. The
  5 insight screens are the emotional peaks — they hit hard precisely because the screens
  around them are quiet.
- **Front-load value, ask at the peak.** Questions → build investment → reveal payoff →
  paywall at the emotional high point.
- **Route by experience level** (see §5). Beginner and athlete see different insight copy.
- **Paywall is the LAST screen. Nothing after it except the app.** Deferred topics are asked
  later, in-context, inside the Train/Fuel tabs — NOT as post-paywall onboarding.

---

## 2. THE FULL SCREEN SEQUENCE

Order top to bottom. `[FAST]` = frictionless data capture (answer + brief ack, move on).
`[INSIGHT]` = dedicated gut-punch screen (full copy in §4). `[SYSTEM]` = crescendo (§6).

| # | Screen | Type | Writes | Notes |
|---|--------|------|--------|-------|
| 1 | Welcome + name | [FAST] | name | Brand moment + name for personalization |
| 2 | Apple Health connect | [FAST] | healthConn | Allow / Skip |
| 3 | Biological sex | [FAST] | sex | Tap cards |
| 4 | Date of birth | [FAST] | dob | Rolodex; keep age gate (<13 block, 13–15 consent) |
| 5 | Height | [FAST] | height | Rolodex + unit toggle |
| 6 | Current weight | [FAST] | weight | Rolodex + unit toggle |
| 7 | Body fat estimate | [FAST] | bodyFat | Visual silhouettes |
| 8 | **INSIGHT 01 — body composition** | [INSIGHT] | — | Routed. Uses computed lean mass (§7) |
| 9 | Occupation activity | [FAST] | job | Desk / Mixed / On feet / Labor |
| 10 | Daily steps | [FAST] | steps | <2k → 12k+ |
| 11 | Training frequency | [FAST] | freq | 0 / 1–3 / 4–6 / 7+ |
| 12 | Primary training type | [FAST] | trainType | Strength / Running / Hyrox / Hybrid / Sport |
| 13 | Training experience | [FAST] | experience | None / Beginner / Intermediate / Advanced. **MERGED lift+cardio into one.** Drives routing (§5) |
| 14 | Training intensity | [FAST] | intensity | Light / Moderate / Hard / Extreme |
| 15 | **INSIGHT 03 — the moat** | [INSIGHT] | — | Routed: beginner = "winging it / you walk in knowing"; athlete = "one number wrong 5 days a week" |
| 16 | Recent weight trend | [FAST] | wTrend | Losing / Gaining / Stable / Not sure |
| 17 | Weight history | [FAST] | wHistory | Ever significantly heavier? |
| 18 | Diet history | [FAST] | dietHistory | Not dieting / <3mo / 3+mo / On-off for years |
| 19 | **INSIGHT 02 — metabolic adaptation** | [INSIGHT] | — | Routed. The "you adapted / it was never willpower" gut-punch. (Strongest when dietHistory = on-off/3+mo) |
| 20 | Average sleep | [FAST] | sleep | <5 → 8+ |
| 21 | Sleep quality | [FAST] | sleepQ | Poor / Fair / Good / Excellent |
| 22 | **INSIGHT 05 — recovery/sleep** | [INSIGHT] | — | Routed. (Strongest when sleep < 6) |
| 23 | Health conditions + safety | [FAST] | conditions | **CONSOLIDATED** the two old multi-selects into one screen |
| 24 | Goal | [FAST] | goal | Lose fat / Build muscle / Maintain / Recomp |
| 25 | Target weight | [FAST] | goalWeight | Skippable |
| 26 | Calorie rate | [FAST] | goalRate | Deficit/surplus depth; auto-skip for maintain/recomp |
| 27 | Why this matters | [FAST] | why | Investment + coaching copy. Tap cards |
| 28 | **INSIGHT 04 — fuel ↔ training** | [INSIGHT] | — | Routed on **training type**: endurance/hybrid = RED-S version; strength = "can't out-train under-eating". (Place here so it lands right before the build, tying fuel to everything) |
| 29 | **BUILD — "building one plan from all of it"** | [SYSTEM] | — | Animated assembly. Moat #1 peak. §6 |
| 30 | **REVEAL — personalized plan** | [SYSTEM] | — | TDEE + lift/rest/protein. The payoff. §6 |
| 31 | **PAYWALL — Apple Pay trial start** | [SYSTEM] | triggers purchase | $0.00 today, 7-day trial, founding price. §6 |

**Note on cycle/female macro question:** if `sex = female`, insert ONE menstrual-cycle-status
question (affects macro cycling) after #21. Do NOT pull in the full female life-stage sub-flow
(defer — see §3). One question, because it changes the math; the rest is in-app.

**Typical totals:** male ~31 screens, female ~32. (Down from ~64. The bulk of the cut is
deferring the three sport sub-flows + the female life-stage sub-flow — see §3.)

---

## 3. CUT LIST — what to remove from the current flow

### DEFER WHOLE TOPICS → move into the app (Train/Fuel tabs), asked in-context later. NOT post-paywall onboarding.
- **Running sub-flow** (current ~9 screens: 5K time, race date, goal time, terrain, track
  access, etc.) → Train tab, when user builds a running program.
- **Hyrox sub-flow** (current ~8 screens: category, weak stations, race date, target time,
  etc.) → Train tab, when user builds a Hyrox program.
- **Strength competition sub-flow** (current ~7 screens: federation, comp date, current maxes,
  weight class, target total) → Train tab, when user sets up meet prep.
- **Female life-stage deep sub-flow** (current up to ~5 screens: trimester, postpartum, bone
  health, menopause symptoms, etc.) → in-app, contextually. KEEP only the single cycle-status
  question (macro-critical).
- **Fuel deep prefs:** dietary preferences (8-option multiselect), meal frequency, fasting
  protocol, water target → Fuel tab, after onboarding.

### KILL (redundant — not deferred, removed)
- Separate **cardio experience** question → merged into the single "training experience" (#13).
- The two overlapping **safety multi-selects** → consolidated into one (#23).
- The standalone **fitness motivation** screen (female sub-flow) → covered by "why" (#27).
- The standalone **relationship-with-food** screen → the metabolic-adaptation insight (#19)
  handles this emotional ground better; remove the separate question.

### KEEP COMPLETE (asked thoroughly, in main flow)
- Identity/bio (name, sex, DOB, height, weight, body fat)
- Activity/NEAT (occupation activity + daily steps)
- Training (frequency, type, experience, intensity)
- Metabolic history (weight trend, weight history, diet history) — kept as a SET; this is
  where insight 02 lives and one question here would feel thin
- Sleep (hours + quality)
- Goal/fuel (goal, target, rate, why)
- Health/safety (consolidated)

---

## 4. THE 5 INSIGHT SCREENS — EXACT COPY

Layout for every insight screen (match existing design tokens):
- Progress bar (continues across whole flow)
- Mono eyebrow: `// insight`
- **Reflect line** (white, ~85% opacity): mirrors their answer back. Bold the key value in red.
- **Headline** (Barlow Condensed 900 italic, large): the reframe. Key word in red.
- **Body** (2 short paragraphs, WHITE text — high contrast, NOT muted gray): the science +
  blame-removal + Coach Macro positioning.
- **CTA button** (red): short forward verb.

**TEXT CONTRAST: insight-screen body copy is WHITE (`#FFFFFF`), not the muted gray used
elsewhere. These screens must be effortless to read.**

Each insight has a **beginner** and **athlete** variant. Routing in §5. `{dynamic}` values
computed per §7.

---

### INSIGHT 01 — Body composition (after body fat, screen 8)

**BEGINNER**
- Reflect: `You picked around {bodyFat}% body fat.`
- Headline: `There's an engine under there.`
- Body 1: `At your size, you're already carrying roughly {leanMass} lbs of lean mass — muscle, bone, the stuff that burns calories all day. Most apps would have you crash-diet and torch it.`
- Body 2: `We do the opposite. We feed it, build it, and let it do the work for you.`
- CTA: `Makes sense →`

**ATHLETE**
- Reflect: `You picked around {bodyFat}% body fat.`
- Headline: `That's earned muscle.`
- Body 1: `You're carrying ~{leanMass} lbs of lean mass. A flat calorie-deficit app would strip it the second you cut — it can't tell muscle from fat, it just sees "eat less."`
- Body 2: `Coach Macro protects the engine you built. We cut fat, not the work you've done.`
- CTA: `Let's keep it →`

---

### INSIGHT 03 — The moat (after intensity, screen 15)

**BEGINNER** (programming hook)
- Reflect: `You're mostly winging it at the gym.` *(use if experience = none/beginner;
  otherwise soften to "You train {freq} a week.")*
- Headline: `Finding a free machine isn't a plan.`
- Body 1: `Walking in and doing whatever's open is a coin flip — you never know if it's building toward anything. That's not your fault. Nobody handed you a system.`
- Body 2: `Coach Macro tells you the exact lifts, weight, and reps every session — and moves your food to match. You walk in knowing.`
- CTA: `Finally →`

**ATHLETE** (fuel↔training hook)
- Reflect: `You train {freq} a week.`
- Headline: `One number is wrong 5 days a week.`
- Body 1: `A heavy training day costs hundreds more calories than a rest day. Every other app hands you one flat target — so it's wrong almost every day you train.`
- Body 2: `Here, your fuel and your training finally talk. Hard day eats like a hard day. This is the whole point.`
- CTA: `Show me →`

---

### INSIGHT 02 — Metabolic adaptation (after diet history, screen 19)

> If `dietHistory = "Not dieting"`, SKIP this insight (the reframe doesn't apply — show a
> brief neutral transition instead, or go straight to next question).

**BEGINNER**
- Reflect: `You've started and stopped a lot.`
- Headline: `It was never willpower.`
- Body 1: `Every crash diet quietly taught your body to burn less and hold on tighter. So the next one worked less. That's not you failing — that's biology defending you.`
- Body 2: `We rebuild your metabolism before we ask it to cut. Nobody told you that part.`
- CTA: `I'm in →`

**ATHLETE**
- Reflect: `You've dieted hard, repeatedly.`
- Headline: `You're not broken. You adapted.`
- Body 1: `Years of aggressive cuts down-regulate your metabolism — it learns to defend itself. You've felt it: the same deficit stops working. That's adaptation, not weakness.`
- Body 2: `We reverse-diet you back to power before the cut, so your body has somewhere to fall.`
- CTA: `Undo it →`

---

### INSIGHT 05 — Recovery / sleep (after sleep quality, screen 22)

> Strongest when `sleep < 6`. If sleep is 7+, soften: lead with "You're getting decent
> sleep — here's why that's your edge" and keep the same Coach Macro positioning.

**BEGINNER**
- Reflect: `You sleep under 6 hours most nights.`
- Headline: `Bad days aren't your fault.`
- Body 1: `Short sleep spikes the hormone that drives hunger (ghrelin) and kills the one that says you're full (leptin). The next day your body fights you — and you call it falling off. It's chemistry, not character.`
- Body 2: `We read your sleep and adjust the day around it. The plan bends so you don't break.`
- CTA: `Okay →`

**ATHLETE**
- Reflect: `You're running on ~{sleep} hours.`
- Headline: `Recovery is where you grow.`
- Body 1: `Under-sleep raises ghrelin (hunger) and drops leptin (fullness), and it blunts recovery — your hard training literally adapts slower. Most apps don't even ask. They train a robot, not you.`
- Body 2: `Coach Macro factors last night's sleep into today's plan — load, macros, the whole thing.`
- CTA: `Dial it in →`

---

### INSIGHT 04 — Fuel ↔ training (after "why", screen 28)

**Routes on `trainType`**, not just experience:
- `trainType` = Running / Hyrox / Hybrid → **ENDURANCE** variant (RED-S)
- `trainType` = Strength / Sport → **STRENGTH** variant

**ENDURANCE variant** (use beginner/athlete tone per experience, copy below is athlete-leaning;
soften reflect for beginners)
- Reflect: `You said you train for endurance.`
- Headline: `A flat number can hurt you.`
- Body 1: `A long session can cost 1,000+ calories your app never logs. Under-fuel your training long enough and doctors have a name for it — RED-S, relative energy deficiency, when your body quietly runs on empty: stalled pace, constant fatigue, getting sick, nagging injuries.`
- Body 2: `Coach Macro moves your fuel with your training, every day. Never guessing, never empty.`
- CTA: `That's me →`

**STRENGTH variant**
- Reflect: `You're lifting to build.`
- Headline: `You can't out-train under-eating.`
- Body 1: `Muscle is built from a surplus of fuel and protein on the days you train hard — not from grinding in the gym alone. Eat like a rest day after a heavy session and you leave growth on the table.`
- Body 2: `Coach Macro pushes calories and protein up on your training days, automatically. The work pays off because the fuel shows up.`
- CTA: `Let's build →`

---

## 5. ROUTING LOGIC

**Experience tier** (from #13, `experience`):
- `none` or `beginner` → **BEGINNER** insight variants
- `intermediate` or `advanced` → **ATHLETE** insight variants

**Insight 04 (fuel) additionally routes on `trainType`** (see §4): endurance vs strength
variant, then beginner/athlete tone within that.

**Skip conditions:**
- Insight 02 skipped if `dietHistory = "Not dieting"`.
- Insight 05 softened if `sleep >= 7`.
- Insight 03 reflect line softened if experience is not none/beginner but trainType implies
  a structured athlete.

Implement routing as a simple helper: `getVariant(experience)` → `'beginner' | 'athlete'`,
plus per-screen overrides for trainType/skip. Keep copy in a single `INSIGHTS` config object
keyed by screen + variant, so it's easy to edit. Do NOT scatter copy across components.

---

## 6. THE CRESCENDO — 3 screens (the genuinely new build)

### Screen 29 — BUILD ("building one plan from all of it")
The moat's signature moment. Animated, line-by-line assembly.
- Mono eyebrow: `// connecting the system`
- Headline: `Building one plan from all of it.`
- Animated checklist (each line resolves ~500–700ms apart; completed = white + red check,
  active = red pulse dot, pending = dim):
  1. `Metabolism mapped — {TDEE} cal/day`
  2. `Training load read — {freq}`
  3. `Recovery factored — sleep + HRV`
  4. `Linking fuel ↔ training…` (the key beat — let it sit visibly)
  5. `Writing your adaptive targets`
- Closing note (white): `Most apps run these as five separate tools. Coach Macro runs them as
  one brain — each one moving the others.`
- Auto-advances to reveal when the sequence completes (~3.5–4s total), OR a "Continue →"
  appears.
- This is the one custom animation. Keep it lightweight (CSS transitions + a JS timer
  resolving each line). Don't over-engineer.

### Screen 30 — REVEAL (the payoff)
- Mono eyebrow: `// your plan is ready`
- Headline: `Here's your starting line.`
- TDEE block (bordered, red-tinted): label `YOUR DAILY BURN · total energy you use in a day`,
  big number `{TDEE}` cal, subline: `But you'll rarely eat exactly this — it moves with your
  training.`
- Three-up cards: `LIFT DAY {liftDay}` (red) · `REST DAY {restDay}` · `PROTEIN {proteinG}g`
- Note (white): `Three numbers that would be one wrong number in any other app.`
- CTA (can be ghost/outline → advances to paywall): `See what I unlock →`
- ALL numbers from §7. This screen reuses the existing TDEE calc.

### Screen 31 — PAYWALL (Apple Pay trial start)
- Logo (3 squares)
- Mono eyebrow: `// start your 7 days` (or `// your two weeks` if referral grants 14 — see §7)
- Headline: `Meet the coach that knows you.`
- Subline (white): `Your plan is built. Try the full coach free for {trialDays} days —
  adaptive targets, AI logging, your daily brief.`
- Offer card:
  - Badge: `FOUNDING · LOCKED FOR LIFE`
  - Price: ~~$69.99~~ **$49.99** /yr (strikethrough standard, founding in red)
  - Reframe: `Less than $1 a week after your trial`
  - **CTA (the purchase trigger): `Start Free — $0.00 Today →`** → calls `purchaseAnnual()`
    (default to annual; if a plan toggle is shown, monthly calls `purchaseMonthly()`)
  - Trust line (white): `{trialDays} days free · then $49.99/yr · cancel anytime`
- Foot (mono, red): `Founding price locked for life — only at launch.`
- Small "Have a referral code?" link → opens existing promo-code validation (replaces the
  separate PROMO screen). A valid code can extend trial to 14 days and/or apply referral credit.
- **NO free-tier messaging anywhere. No grey text.** (There is no free tier — it's
  subscribe-or-leave after trial, like MacroFactor.)

---

## 7. DYNAMIC MATH (compute, never hardcode)

- **leanMass** = `round(weightLbs * (1 - bodyFatPct/100))`. Convert kg→lbs if needed. Used in
  insight 01.
- **TDEE** = existing calculation (whatever powers the current TDEE reveal). Reuse it verbatim.
- **liftDay / restDay** = goal-adjusted training-day and rest-day targets. Use the existing
  logic that already produces day-type targets (the app already does dynamic macros). If a
  single source exists, call it. Spread should reflect real training cost (e.g. rest =
  TDEE − deficit; lift = TDEE + training-day adjustment). Confirm against existing macro engine.
- **proteinG** = existing protein target.
- **trialDays** = `referralApplied ? 14 : 7`. Default 7. The eyebrow/subline/trust copy all
  read this variable.
- **"Less than $1 a week"** is true at $49.99/yr ($0.96/wk) — safe to hardcode the phrase,
  but if annual price ever changes, compute `annual/52`.

If any computed value is missing/null at runtime, fall back gracefully (hide the specific
number, keep the sentence working) — never render "undefined" or "NaN".

---

## 8. INTEGRATION POINTS

- **End of onboarding:** `saveProfile()` fires after the last question screen (#28) and before
  the BUILD screen — same as the current flow saves before paywall. (Or keep the existing save
  point; just ensure profile is saved before paywall so the account is complete.)
- **Paywall CTA** → existing `purchaseAnnual()` / `purchaseMonthly()` (already RevenueCat-wired).
- **Promo code** → existing validation; on success, set `referralApplied = true` (drives
  trialDays) and apply referral credit via the existing path.
- **Apple Health** (#2) → existing `healthConn` logic.
- **Replaces** the current CELEBRATE → PROMO → PAYWALL sequence with BUILD → REVEAL → PAYWALL
  (promo folded into paywall as a link).
- The three sport sub-flows and fuel-prefs that are being deferred: leave their components in
  the codebase but REMOVE them from the onboarding flow; relocate their entry points into the
  Train/Fuel tabs (separate task — flag any wiring needed, don't fully build that here).

---

## 9. BUILD PHASES (do in order, verify each before the next)

**PHASE 1 — Scaffold + restructure question screens**
- Create the new flow controller alongside the old (feature flag, e.g. `NEW_ONBOARDING`).
- Implement screens 1–7, 9–14, 16–18, 20–21, 23–27 by REUSING existing inputs, in the new
  order, with the cut list (§3) applied (sub-flows removed from flow, cardio-exp merged,
  safety consolidated).
- Verify: a user can tap through all fast screens, data saves correctly, design matches app.

**PHASE 2 — Insight screens + routing**
- Build the 5 insight screens (§4) as a reusable `InsightScreen` component fed by an `INSIGHTS`
  config object (§5). Insert at positions 8, 15, 19, 22, 28.
- Wire `getVariant(experience)` + trainType/skip overrides.
- Verify BOTH paths: run through once as beginner, once as advanced; confirm the right copy
  shows and skip/soften conditions work.

**PHASE 3 — Crescendo**
- Build BUILD (29), REVEAL (30), PAYWALL (31) per §6.
- Wire paywall CTA to existing purchase calls; fold in promo-code link.
- Verify the animation runs, reveal renders, paywall triggers the Apple sheet (real device).

**PHASE 4 — Dynamic math**
- Wire all `{dynamic}` values (§7) from real answers + existing calc. Test with several
  fake profiles (small/large, beginner/athlete, runner/lifter) to confirm numbers are sane
  and nothing renders NaN.

**PHASE 5 — QA + cutover**
- Full run-through on a real device, both experience paths, male + female.
- Confirm saveProfile + RevenueCat purchase both work end-to-end.
- Flip `NEW_ONBOARDING` default ON. Keep old flow behind flag for one release, then remove.

---

## 10. WHAT NOT TO DO
- Don't hardcode any personalized number.
- Don't use grey/low-contrast text on insight, reveal, or paywall screens.
- Don't mention a free tier anywhere.
- Don't copy the mockups' serif font or brighter red — use existing app tokens.
- Don't ask anything after the paywall.
- Don't delete the old onboarding until the new flow is verified on device.
- Don't leave any acronym unexplained.
