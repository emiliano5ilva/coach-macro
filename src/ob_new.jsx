/**
 * ob_new.jsx — New onboarding flow (PHASE 1 scaffold)
 *
 * Gated behind NEW_ONBOARDING feature flag in NativeApp.jsx.
 * Old flow (ob_screens.jsx + onboarding.jsx) is UNTOUCHED.
 *
 * Phase 1: screens 1-7, 9-14, 16-18, 20-21, 23-27.
 * Screens 8, 15, 19, 22, 28 are NO-OP placeholders (insight screens — Phase 2).
 * Screens 29-31 (crescendo) — Phase 3.
 *
 * Cut list applied (§3 of spec):
 *   - Running / Hyrox / Strength-comp sub-flows removed from flow
 *   - Female life-stage deep sub-flow removed; kept single cycle-status question
 *   - Cardio experience merged into "training experience" (#13)
 *   - Two safety multi-selects consolidated into one (#23)
 *   - Dietary prefs, meal frequency, fasting, water → deferred to Fuel tab
 */

import { useState, useEffect, useRef } from "react";
import {
  T, GLOBAL_CSS, MONTHS_A, DAYS_A, YEARS_A,
  FT_A, IN_A, CM_A, LBS_A, KG_A,
  BF_VISUAL,
  PrimaryBtn, UnitToggle, Rolodex, Logo,
  calcTDEE, getDayMacros,
} from "./components.jsx";
import { Icon } from "@iconify/react";
import "./iconData.js"; // registers the offline fluent-emoji-flat pack (goal-card glyphs)
import { getAge } from "./utils/safety.js";
import { purchaseAnnual, purchaseMonthly, devUnlockEntitlement } from "./services/purchaseService.js";
import { sb } from "./supabase.js";
import { showToast } from "./utils/toast.js";
import { TermsOfService, PrivacyPolicy } from "./legal.jsx";

// ─── Feature flag ─────────────────────────────────────────────────────────────
export const NEW_ONBOARDING = true;

// ─── Shared micro-components ──────────────────────────────────────────────────

function Eyebrow({ text }) {
  return (
    <div style={{
      fontFamily: "var(--mono)", fontSize: 9, fontWeight: 500,
      letterSpacing: "0.18em", textTransform: "uppercase",
      color: "var(--accent)", marginBottom: 10,
    }}>
      {text}
    </div>
  );
}

function Headline({ children }) {
  return (
    <div style={{
      fontFamily: "var(--condensed)", fontStyle: "italic", fontWeight: 900,
      fontSize: "clamp(34px,8vw,52px)", lineHeight: 0.92,
      textTransform: "uppercase", color: "var(--white)", marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Sub({ children }) {
  return (
    <p style={{
      fontSize: 13, color: "var(--text-dim)", lineHeight: 1.65, marginBottom: 20,
    }}>
      {children}
    </p>
  );
}

// Tap card — reuses the existing visual pattern
// Accepts both `label` (spec) and shorthand `l` (legacy option arrays) so neither needs changing.
function TapCard({ label, l, sub, icon, selected, onClick }) {
  const text = label ?? l;
  return (
    <div onClick={onClick} style={{
      background: selected ? "rgba(var(--accent-rgb),0.08)" : "#0d0d0d",
      border: `1.5px solid ${selected ? "var(--accent)" : "rgba(var(--accent-rgb),0.08)"}`,
      borderRadius: 13, padding: "14px 18px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 14, marginBottom: 8,
      transition: "all 0.18s",
    }}>
      {icon && <div style={{ fontSize: 22, flexShrink: 0, width: 28, textAlign: "center" }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: selected ? "var(--accent)" : "var(--white)" }}>
          {text}
        </div>
        {sub && <div style={{ fontSize: 12, color: "#FFFFFF", marginTop: 3 }}>{sub}</div>}
      </div>
      {selected && <div style={{ color: "var(--accent)", fontSize: 15, flexShrink: 0 }}>✓</div>}
    </div>
  );
}

// Multi-select tap card
function MultiCard({ label, sub, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? "rgba(var(--accent-rgb),0.06)" : "#0d0d0d",
      border: `1.5px solid ${selected ? "var(--accent)" : "rgba(var(--accent-rgb),0.08)"}`,
      borderRadius: 12, padding: "13px 15px", cursor: "pointer",
      display: "flex", alignItems: "center", gap: 12, marginBottom: 8,
      transition: "all 0.18s",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        border: `2px solid ${selected ? "var(--accent)" : "rgba(var(--accent-rgb),0.2)"}`,
        background: selected ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.18s",
      }}>
        {selected && <span style={{ color: "#000", fontSize: 10, fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: selected ? "var(--accent)" : "var(--white)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// Progress bar header
function ProgressHeader({ pct }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
      <Logo size={28} />
      <div style={{ flex: 1, height: 3, background: "#0d0d0d", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "var(--accent)",
          width: `${pct}%`, transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ fontSize: 11, color: "#FFFFFF", fontWeight: 700, minWidth: 34, textAlign: "right" }}>
        {pct}%
      </div>
    </div>
  );
}

// Auto-advance shim — used only for skipped insights (e.g. insight 02 when not dieting)
function InsightPlaceholder({ next }) {
  useEffect(() => { next(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Routing helpers ──────────────────────────────────────────────────────────

// §5: experience tier → 'beginner' | 'athlete'
function getVariant(experience) {
  return (experience === "none" || experience === "beginner") ? "beginner" : "athlete";
}

// §5: trainType → 'endurance' | 'strength' (for insight 04 / screen 28)
function getInsight04Variant(trainType) {
  return (trainType === "run" || trainType === "hyrox" || trainType === "hybrid")
    ? "endurance" : "strength";
}

// §5: sleep >= 7 → soften insight 05
function isSleepSoftened(sleep) {
  return sleep === "7-8" || sleep === "8+";
}

// ─── Dynamic math helpers (§7) ────────────────────────────────────────────────

// Parse the midpoint pct from a BF range string, matching BF_VISUAL pct values
function parseBfPct(bodyFat) {
  if (!bodyFat) return null;
  const MAP = {
    "5–7%": 6, "8–12%": 10, "13–17%": 15,
    "18–24%": 21, "25–30%": 27, "31–40%": 35, "40+%": 43,
  };
  return MAP[bodyFat] ?? null;
}

// §7: leanMass = round(weightLbs * (1 - bfPct/100)), handles kg input
function calcLeanMass(d) {
  const bfPct = parseBfPct(d.bodyFat);
  if (!bfPct || !d.weight) return null;
  const weightLbs = d.wUnit === "kg"
    ? parseFloat(d.weight) * 2.2046
    : parseFloat(d.weight);
  if (!weightLbs || isNaN(weightLbs)) return null;
  const lm = Math.round(weightLbs * (1 - bfPct / 100));
  return isNaN(lm) || lm <= 0 ? null : lm;
}

// Human-readable labels for coded field values
const FREQ_LABELS = { n0: "0 sessions", "1-3": "1–3 times", "4-6": "4–6 times", "7+": "7+" };
const SLEEP_LABELS = { u5: "under 5", "5-6": "5–6", "6-7": "6–7", "7-8": "7–8", "8+": "8+" };

function computeDynamic(d) {
  return {
    leanMass:   calcLeanMass(d),
    freqLabel:  FREQ_LABELS[d.freq]  ?? d.freq  ?? "",
    sleepLabel: SLEEP_LABELS[d.sleep] ?? d.sleep ?? "",
  };
}

// ─── Inline red span helper ────────────────────────────────────────────────────

const R = (children) => (
  <b style={{ color: "var(--accent)", fontWeight: 700 }}>{children}</b>
);

// ─── INSIGHTS config (§4) — ALL copy in one place ─────────────────────────────
// Each field is a function (d, dyn) → JSX|string so dynamic values resolve at render time.

const INSIGHTS = {

  // ── INSIGHT 01 — body composition (screen 8) ──────────────────────────────
  8: {
    beginner: {
      reflect:  (d)      => <>You picked around {R(d.bodyFat || "some")} body fat.</>,
      headline: ()       => <>There's an engine {R("under there.")}</>,
      body1:    (d, dyn) => dyn.leanMass
        ? `At your size, you're already carrying roughly ${dyn.leanMass} lbs of lean mass — muscle, bone, the stuff that burns calories all day. Most apps would have you crash-diet and torch it.`
        : "At your size, you're already carrying significant lean mass — muscle, bone, the stuff that burns calories all day. Most apps would have you crash-diet and torch it.",
      body2: "We do the opposite. We feed it, build it, and let it do the work for you.",
      cta:   "Makes sense →",
    },
    athlete: {
      reflect:  (d)      => <>You picked around {R(d.bodyFat || "some")} body fat.</>,
      headline: ()       => <>That's {R("earned muscle.")}</>,
      body1:    (d, dyn) => dyn.leanMass
        ? `You're carrying ~${dyn.leanMass} lbs of lean mass. A flat calorie-deficit app would strip it the second you cut — it can't tell muscle from fat, it just sees "eat less."`
        : `You're carrying significant lean mass. A flat calorie-deficit app would strip it the second you cut — it can't tell muscle from fat, it just sees "eat less."`,
      body2: "Coach Macro protects the engine you built. We cut fat, not the work you've done.",
      cta:   "Let's keep it →",
    },
  },

  // ── INSIGHT 03 — the moat (screen 15) ────────────────────────────────────
  15: {
    beginner: {
      reflect:  ()       => <>You're mostly {R("winging it")} at the gym.</>,
      headline: ()       => <>Finding a free machine {R("isn't a plan.")}</>,
      body1:    ()       => "Walking in and doing whatever's open is a coin flip — you never know if it's building toward anything. That's not your fault. Nobody handed you a system.",
      body2: "Coach Macro tells you the exact lifts, weight, and reps every session — and moves your food to match. You walk in knowing.",
      cta:   "Finally →",
    },
    athlete: {
      reflect:  (d, dyn) => <>You train {R(dyn.freqLabel)} a week.</>,
      headline: ()       => <>One number is wrong {R("5 days a week.")}</>,
      body1:    ()       => "A heavy training day costs hundreds more calories than a rest day. Every other app hands you one flat target — so it's wrong almost every day you train.",
      body2: "Here, your fuel and your training finally talk. Hard day eats like a hard day. This is the whole point.",
      cta:   "Show me →",
    },
  },

  // ── INSIGHT 02 — metabolic adaptation (screen 19) ────────────────────────
  // Skipped entirely when dietHistory === "not" — handled in resolveInsight.
  19: {
    beginner: {
      reflect:  ()  => <>You've {R("started and stopped")} a lot.</>,
      headline: ()  => <>It was {R("never")} willpower.</>,
      body1:    ()  => "Every crash diet quietly taught your body to burn less and hold on tighter. So the next one worked less. That's not you failing — that's biology defending you.",
      body2: "We rebuild your metabolism before we ask it to cut. Nobody told you that part.",
      cta:   "I'm in →",
    },
    athlete: {
      reflect:  ()  => <>You've dieted hard, {R("repeatedly.")}</>,
      headline: ()  => <>You're not broken. {R("You adapted.")}</>,
      body1:    ()  => "Years of aggressive cuts down-regulate your metabolism — it learns to defend itself. You've felt it: the same deficit stops working. That's adaptation, not weakness.",
      body2: "We reverse-diet you back to power before the cut, so your body has somewhere to fall.",
      cta:   "Undo it →",
    },
  },

  // ── INSIGHT 05 — recovery / sleep (screen 22) ────────────────────────────
  // _soft variants used when sleep >= 7 (isSleepSoftened).
  22: {
    beginner: {
      reflect:  ()       => <>You sleep {R("under 6 hours")} most nights.</>,
      headline: ()       => <>Bad days {R("aren't your fault.")}</>,
      body1:    ()       => "Short sleep spikes the hormone that drives hunger (ghrelin) and kills the one that says you're full (leptin). The next day your body fights you — and you call it falling off. It's chemistry, not character.",
      body2: "We read your sleep and adjust the day around it. The plan bends so you don't break.",
      cta:   "Okay →",
    },
    beginner_soft: {
      reflect:  ()       => <>You're getting {R("decent sleep")} — here's why that's your edge.</>,
      headline: ()       => <>Bad days {R("aren't your fault.")}</>,
      body1:    ()       => "Short sleep spikes the hormone that drives hunger (ghrelin) and kills the one that says you're full (leptin). The next day your body fights you — and you call it falling off. It's chemistry, not character.",
      body2: "We read your sleep and adjust the day around it. The plan bends so you don't break.",
      cta:   "Okay →",
    },
    athlete: {
      reflect:  (d, dyn) => <>You're running on {R(`~${dyn.sleepLabel} hours`)}.</>,
      headline: ()       => <>Recovery is {R("where you grow.")}</>,
      body1:    ()       => "Under-sleep raises ghrelin (hunger) and drops leptin (fullness), and it blunts recovery — your hard training literally adapts slower. Most apps don't even ask. They train a robot, not you.",
      body2: "Coach Macro factors last night's sleep into today's plan — load, macros, the whole thing.",
      cta:   "Dial it in →",
    },
    athlete_soft: {
      reflect:  ()       => <>You're getting {R("decent sleep")} — here's why that's your edge.</>,
      headline: ()       => <>Recovery is {R("where you grow.")}</>,
      body1:    ()       => "Under-sleep raises ghrelin (hunger) and drops leptin (fullness), and it blunts recovery — your hard training literally adapts slower. Most apps don't even ask. They train a robot, not you.",
      body2: "Coach Macro factors last night's sleep into today's plan — load, macros, the whole thing.",
      cta:   "Dial it in →",
    },
  },

  // ── INSIGHT 04 — fuel ↔ training (screen 28) — routes on trainType ────────
  28: {
    endurance: {
      reflect:  ()  => <>You said you {R("train for endurance.")}</>,
      headline: ()  => <>A flat number {R("can hurt you.")}</>,
      body1:    ()  => "A long session can cost 1,000+ calories your app never logs. Under-fuel your training long enough and doctors have a name for it — RED-S, relative energy deficiency, when your body quietly runs on empty: stalled pace, constant fatigue, getting sick, nagging injuries.",
      body2: "Coach Macro moves your fuel with your training, every day. Never guessing, never empty.",
      cta:   "That's me →",
    },
    strength: {
      reflect:  ()  => <>You're {R("lifting to build.")}</>,
      headline: ()  => <>You can't out-train {R("under-eating.")}</>,
      body1:    ()  => "Muscle is built from a surplus of fuel and protein on the days you train hard — not from grinding in the gym alone. Eat like a rest day after a heavy session and you leave growth on the table.",
      body2: "Coach Macro pushes calories and protein up on your training days, automatically. The work pays off because the fuel shows up.",
      cta:   "Let's build →",
    },
  },
};

// ─── Insight resolver (§5) ────────────────────────────────────────────────────

function resolveInsight(sc, d) {
  const dyn = computeDynamic(d);

  // Skip condition: insight 02 has nothing to reframe if user isn't dieting
  if (sc === 19 && d.dietHistory === "not") return null;

  let cfgKey;
  if (sc === 28) {
    // Routes on trainType, not experience
    cfgKey = getInsight04Variant(d.trainType);
  } else if (sc === 22) {
    // Routes on experience + sleep softening
    const base = getVariant(d.experience);
    cfgKey = isSleepSoftened(d.sleep) ? `${base}_soft` : base;
  } else {
    cfgKey = getVariant(d.experience);
  }

  const cfg = INSIGHTS[sc]?.[cfgKey];
  if (!cfg) return null;

  // Resolve all functions — InsightScreen receives plain values
  return {
    reflect:  cfg.reflect(d, dyn),
    headline: cfg.headline(d, dyn),
    body1:    cfg.body1(d, dyn),
    body2:    cfg.body2,
    cta:      cfg.cta,
  };
}

// ─── InsightScreen component ──────────────────────────────────────────────────
// Receives a resolved config (no functions, all values final).
// Body text is full white (#FFFFFF) per §4 contrast rule.

function InsightScreen({ config, onNext }) {
  const { reflect, headline, body1, body2, cta } = config;
  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <Eyebrow>// insight</Eyebrow>
      {/* Reflect — white 85%, key value bolded red by INSIGHTS config */}
      <div style={{
        fontSize: 15, fontWeight: 500, lineHeight: 1.55, marginBottom: 16,
        color: "rgba(245,245,240,0.85)",
      }}>
        {reflect}
      </div>
      {/* Headline — Barlow Condensed 900 italic, key word red */}
      <div style={{
        fontFamily: "var(--condensed)", fontStyle: "italic", fontWeight: 900,
        fontSize: "clamp(34px,8vw,52px)", lineHeight: 0.92,
        textTransform: "uppercase", color: "var(--white)", marginBottom: 24,
      }}>
        {headline}
      </div>
      {/* Body — full white, NOT muted (§4) */}
      <p style={{ color: "#FFFFFF", fontSize: 15, lineHeight: 1.72, margin: "0 0 14px 0" }}>
        {body1}
      </p>
      <p style={{ color: "#FFFFFF", fontSize: 15, lineHeight: 1.72, margin: "0 0 28px 0" }}>
        {body2}
      </p>
      <PrimaryBtn onClick={onNext} label={cta} />
    </div>
  );
}

// ─── Initial data state ───────────────────────────────────────────────────────

function initData(user, signupName) {
  return {
    name: signupName || "",
    email: user?.email || "",
    healthConn: false,
    sex: "",
    dobMonth: "Jan", dobDay: "15", dobYear: "1995",
    hUnit: "ft", hFt: "5", hIn: "10", hCm: "178",
    wUnit: "lbs", weight: "185",
    bodyFat: "",
    job: "",
    steps: "",
    freq: "",
    trainType: "",
    experience: "",  // merged lift+cardio (spec §3)
    intensity: "",
    wTrend: "",
    wHistory: "",
    dietHistory: "",
    sleep: "",
    sleepQ: "",
    conditions: [],  // consolidated single multi-select (spec §3)
    goal: "",
    goalWeight: "",
    goalRate: "",
    why: "",
    cycle: "",       // female only — single question
    // downstream fields expected by saveProfile / calcTDEE
    liftExp: "",     // mapped from experience at save time
    cardioExp: "",   // mapped from experience at save time
    metHistory: "",  // mapped from dietHistory at save time
    protein: "moderate",
    activity: "moderate",
    conditions_old: [],
    healthConditions: [],
    equipment: "",
    sessionLength: "",
  };
}

// ─── SCREEN SEQUENCE ──────────────────────────────────────────────────────────
//
// Indexes below match §2 screen numbers. "INSIGHT" screens are placeholders.
// Female cycle question inserted after screen 21 when sex=female.
//
// 1  Welcome + name
// 2  Apple Health
// 3  Sex
// 4  DOB
// 5  Height
// 6  Weight
// 7  Body fat
// 8  [INSIGHT 01 placeholder]
// 9  Occupation
// 10 Steps
// 11 Training frequency
// 12 Training type
// 13 Training experience (merged)
// 14 Training intensity
// 15 [INSIGHT 03 placeholder]
// 16 Weight trend
// 17 Weight history
// 18 Diet history
// 19 [INSIGHT 02 placeholder]
// 20 Sleep hours
// 21 Sleep quality
// 21b Cycle (female only)
// 22 [INSIGHT 05 placeholder]
// 23 Health + safety (consolidated)
// 24 Goal
// 25 Target weight
// 26 Calorie rate
// 27 Why this matters
// 28 [INSIGHT 04 placeholder]
// (29-31 Phase 3)

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function NewOnboarding({ onComplete, user, signupName }) {
  const [sc, setSc] = useState(3); // first real screen after removing name (1) and Apple Health (2)
  const [history, setHistory] = useState([]); // FIX 3: stack-based back navigation
  const [d, setD] = useState(() => initData(user, signupName));
  const [ageWarning, setAgeWarning] = useState(null);
  const [parentalConfirmed, setParentalConfirmed] = useState(false);
  const savedRef = useRef(false); // ensures onComplete fires exactly once

  const upd = (k, v) => setD(p => ({ ...p, [k]: v }));
  const auto = (k, v) => { upd(k, v); setTimeout(next, 260); };

  const isFemale = d.sex === "female";
  // Single source of truth: the trial is 7 days everywhere — matches the paywall
  // disclosure ("7-day free trial") and the Apple intro offer. No 14-day path exists.
  const trialDays = 7;

  // FIX 1 + 4: removed screens 1 (name ask) and 2 (Apple Health).
  // FIX 2: goalWeight (25) moved to immediately after current weight (6).
  function getScreenList() {
    const base = [3,4,5,6,25,7,8,9,10,11,12,"12b","12c",13,14,15,16,17,18,19,20,21];
    if (isFemale) base.push("21b");
    base.push(22,23,24,26,27,28,29,30,31);
    return base;
  }

  // Progress based on actual list position, not raw screen number.
  const _list = getScreenList();
  const _idx  = _list.indexOf(sc);
  const pct   = _idx >= 0 ? Math.round(((_idx + 1) / _list.length) * 100) : 100;

  // FIX 3: next() — user-initiated advance; pushes current screen to history.
  function next() {
    const list = getScreenList();
    const idx = list.indexOf(sc);
    if (idx === -1 || idx >= list.length - 1) return;
    if (sc === 28) handleDone();
    setHistory(h => [...h, sc]);
    setSc(list[idx + 1]);
  }

  // FIX 3: autoNext() — programmatic advance (skipped insights, auto-skip screens);
  // does NOT push to history so Back correctly skips over auto-advanced screens.
  function autoNext() {
    const list = getScreenList();
    const idx = list.indexOf(sc);
    if (idx === -1 || idx >= list.length - 1) return;
    setSc(list[idx + 1]);
  }

  // FIX 3: back() — pops from history stack instead of stepping list index.
  function back() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setSc(prev);
  }

  // Build the mapped profile object (§7) — shared by handleDone + crescendo screens
  function getMappedProfile() {
    return {
      ...d,
      liftExp: d.experience,
      cardioExp: d.experience,
      metHistory: d.dietHistory,
      protein: "moderate",
      activity: d.job === "physical" ? "very"
              : d.job === "feet"     ? "moderate"
              : d.job === "mix"      ? "moderate"
              : "sedentary",
      conditions: d.conditions,
      healthConditions: d.conditions,
    };
  }

  // §8: save profile — called at 28→29 boundary, exactly once
  function handleDone() {
    if (savedRef.current) return;
    savedRef.current = true;
    const mapped = getMappedProfile();
    onComplete(mapped, calcTDEE(mapped));
  }

  // Screen render
  function renderScreen() {
    // ── Insight screens — resolved centrally via INSIGHTS config (§4/§5) ──────
    if ([8, 15, 19, 22, 28].includes(sc)) {
      const cfg = resolveInsight(sc, d);
      // Skipped insights auto-advance without pushing to history (FIX 3).
      if (!cfg) return <InsightPlaceholder next={autoNext} />;
      // Shown insights: user taps CTA → next() pushes to history (correct).
      return <InsightScreen config={cfg} onNext={next} />;
    }

    // ── Crescendo screens (29-31) ─────────────────────────────────────────────
    if (sc === 29) return <BuildScreen d={d} getMapped={getMappedProfile} onDone={next} />;
    if (sc === 30) return <RevealScreen d={d} getMapped={getMappedProfile} onNext={next} />;
    if (sc === 31) return <NewPaywall trialDays={trialDays} />;

    switch (sc) {
      // ── 1 — Welcome + name ─────────────────────────────────────────────────
      case 1: return (
        <div style={{ animation: "fadeIn 0.3s ease" }}>
          <Headline>FUEL SMARTER.<br /><span style={{ color: "var(--accent)" }}>TRAIN HARDER.</span></Headline>
          <Sub>Three minutes. 25 variables. The most accurate fitness plan you've ever had.</Sub>
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-faint)",
              fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 7,
            }}>
              // First name
            </div>
            <input
              value={d.name}
              onChange={e => upd("name", e.target.value)}
              placeholder="e.g. Marcus"
              autoFocus
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0d0d0d",
                border: `1.5px solid ${d.name ? "var(--accent)" : "rgba(var(--accent-rgb),0.08)"}`,
                borderRadius: 11, padding: "13px 16px",
                color: "var(--white)", fontSize: 16, outline: "none",
                fontFamily: "var(--body)", transition: "border-color 0.2s",
              }}
            />
          </div>
          <PrimaryBtn onClick={next} label="Build My Plan →" disabled={!d.name.trim()} />
        </div>
      );

      // ── 2 — Apple Health (REMOVED from onboarding flow, FIX 4) ──────────────
      // TODO: trigger Apple Health permission request contextually on first Today
      // tab open. Hook into ob_screens2.jsx App component — initAppleHealth() is
      // already imported there (line ~42). Wire it on the first "today" section
      // render when Capacitor.isNativePlatform() and !healthConnected (line ~3793).
      case 2: {
        const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
        return (
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            <Eyebrow>// Step 2</Eyebrow>
            <Headline>Let's start strong, <span style={{ color: "var(--accent)" }}>{d.name}.</span></Headline>
            {isNative
              ? <Sub>Connect Apple Health — real steps, sleep, and workouts feed your macros automatically from day one.</Sub>
              : <Sub>Download the iOS app after setup to connect Apple Health — real data makes the plan real.</Sub>
            }
            <div style={{
              background: "#0d0d0d",
              border: "1px solid rgba(var(--accent-rgb),0.08)",
              borderRadius: 14, padding: "24px", textAlign: "center", marginBottom: 14,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 12px",
              }}>
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                  <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#FF453A" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Apple Health</div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 18, lineHeight: 1.6 }}>
                Workouts · Steps · Sleep · Heart Rate
              </div>
              {isNative
                ? <button onClick={() => { upd("healthConn", true); setTimeout(next, 280); }} style={{
                  width: "100%", padding: "14px",
                  background: "var(--accent)", color: "#fff",
                  fontWeight: 700, fontSize: 14, letterSpacing: 1,
                  border: "none", borderRadius: 10, cursor: "pointer",
                  textTransform: "uppercase", fontFamily: "var(--body)",
                }}>Allow Apple Health →</button>
                : <div style={{
                  padding: "12px", background: "rgba(245,245,240,0.03)",
                  borderRadius: 10, fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5,
                }}>Available on the iPhone app — connect after downloading.</div>
              }
            </div>
            <button onClick={next} style={{
              width: "100%", padding: "12px",
              background: "none", color: "var(--text-faint)",
              fontWeight: 500, fontSize: 13,
              border: "1px solid rgba(var(--accent-rgb),0.08)",
              borderRadius: 10, cursor: "pointer", fontFamily: "var(--body)",
            }}>
              {isNative ? "Skip for now" : "Continue"}
            </button>
          </div>
        );
      }

      // ── 3 — Sex (now first screen; personalized headline uses name from auth) ──
      case 3: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Let's start</Eyebrow>
          <Headline>
            {d.name
              ? <>Let's start strong, <span style={{ color: "var(--accent)" }}>{d.name}.</span></>
              : <>Let's start <span style={{ color: "var(--accent)" }}>strong.</span></>}
          </Headline>
          <Sub>Biological sex — one of the biggest drivers of your metabolic rate.</Sub>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ v: "male", l: "Male", e: "♂" }, { v: "female", l: "Female", e: "♀" }].map(o => (
              <div key={o.v} onClick={() => auto("sex", o.v)} style={{
                flex: 1, background: d.sex === o.v ? "rgba(var(--accent-rgb),0.08)" : "#0d0d0d",
                border: `2px solid ${d.sex === o.v ? "var(--accent)" : "rgba(var(--accent-rgb),0.08)"}`,
                borderRadius: 14, padding: "28px 12px", textAlign: "center",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <div style={{ fontSize: 28, marginBottom: 10, color: d.sex === o.v ? "var(--accent)" : "var(--text-faint)" }}>{o.e}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: d.sex === o.v ? "var(--accent)" : "var(--white)" }}>{o.l}</div>
              </div>
            ))}
          </div>
        </div>
      );

      // ── 4 — DOB ────────────────────────────────────────────────────────────
      case 4: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 4</Eyebrow>
          <Headline>Date of <span style={{ color: "var(--accent)" }}>birth.</span></Headline>
          <Sub>Metabolism slows ~1–2% per decade after 20. Age is non-negotiable in the equation.</Sub>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1.4, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Month</div>
              <Rolodex items={MONTHS_A} sel={d.dobMonth} onChange={v => { upd("dobMonth", v); setAgeWarning(null); setParentalConfirmed(false); }} />
            </div>
            <div style={{ flex: 0.8, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Day</div>
              <Rolodex items={DAYS_A} sel={d.dobDay} onChange={v => { upd("dobDay", v); setAgeWarning(null); setParentalConfirmed(false); }} />
            </div>
            <div style={{ flex: 1.2, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Year</div>
              <Rolodex items={YEARS_A} sel={d.dobYear} onChange={v => { upd("dobYear", v); setAgeWarning(null); setParentalConfirmed(false); }} />
            </div>
          </div>
          {ageWarning === "blocked" && (
            <div style={{ background: "rgba(239,68,68,.08)", border: "1.5px solid rgba(239,68,68,.3)", borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
              <div style={{ fontWeight: 700, color: "#EF4444", marginBottom: 4 }}>Age Requirement Not Met</div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6 }}>Coach Macro requires users to be at least 13 years old.</div>
            </div>
          )}
          {ageWarning === "parental" && !parentalConfirmed && (
            <div style={{ background: "rgba(251,191,36,.06)", border: "1.5px solid rgba(251,191,36,.3)", borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
              <div style={{ fontWeight: 700, color: "#FBBF24", marginBottom: 4 }}>Parental Consent Required</div>
              <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.6, marginBottom: 12 }}>Users aged 13–15 need a parent or guardian to approve use of this app.</div>
              <button onClick={() => setParentalConfirmed(true)} style={{ width: "100%", padding: "11px", background: "rgba(251,191,36,.12)", border: "1.5px solid rgba(251,191,36,.35)", borderRadius: 9, color: "#FBBF24", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Parent / Guardian Confirms →
              </button>
            </div>
          )}
          {ageWarning !== "blocked" && (ageWarning !== "parental" || parentalConfirmed) && (
            <PrimaryBtn onClick={() => {
              const age = getAge(d.dobYear, d.dobMonth, d.dobDay);
              if (age !== null && age < 13) { setAgeWarning("blocked"); return; }
              if (age !== null && age < 16 && !parentalConfirmed) { setAgeWarning("parental"); return; }
              next();
            }} label="Continue →" style={{ marginTop: 20 }} />
          )}
        </div>
      );

      // ── 5 — Height ─────────────────────────────────────────────────────────
      case 5: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 5</Eyebrow>
          <Headline>Your <span style={{ color: "var(--accent)" }}>height.</span></Headline>
          <UnitToggle
            opts={[{ val: "ft", label: "ft & in" }, { val: "cm", label: "cm" }]}
            val={d.hUnit}
            onChange={v => { upd("hUnit", v); upd("wUnit", v === "cm" ? "kg" : "lbs"); }}
          />
          {d.hUnit === "ft"
            ? <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Feet</div>
                <Rolodex items={FT_A} sel={d.hFt} onChange={v => upd("hFt", v)} />
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Inches</div>
                <Rolodex items={IN_A} sel={d.hIn} onChange={v => upd("hIn", v)} />
              </div>
            </div>
            : <div style={{ maxWidth: 150, margin: "0 auto", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--text-faint)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Centimeters</div>
              <Rolodex items={CM_A} sel={d.hCm} onChange={v => upd("hCm", v)} />
            </div>
          }
          <PrimaryBtn onClick={next} label="Continue →" style={{ marginTop: 20 }} />
        </div>
      );

      // ── 6 — Weight ─────────────────────────────────────────────────────────
      case 6: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 6</Eyebrow>
          <Headline>Current <span style={{ color: "var(--accent)" }}>weight.</span></Headline>
          <Sub>Your weight right now — not your goal. The equation only works with real numbers.</Sub>
          <UnitToggle
            opts={[{ val: "lbs", label: "lbs" }, { val: "kg", label: "kg" }]}
            val={d.wUnit}
            onChange={v => { upd("wUnit", v); upd("hUnit", v === "kg" ? "cm" : "ft"); }}
          />
          <div style={{ maxWidth: 160, margin: "0 auto", textAlign: "center" }}>
            <Rolodex items={d.wUnit === "lbs" ? LBS_A : KG_A} sel={d.weight} onChange={v => upd("weight", v)} />
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>
            {d.weight} {d.wUnit}
            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-faint)", marginLeft: 8 }}>
              = {d.wUnit === "lbs" ? Math.round(parseFloat(d.weight) * 0.4536) : Math.round(parseFloat(d.weight) / 0.4536)} {d.wUnit === "lbs" ? "kg" : "lbs"}
            </span>
          </div>
          <PrimaryBtn onClick={next} label="Continue →" style={{ marginTop: 16 }} />
        </div>
      );

      // ── 7 — Body fat ───────────────────────────────────────────────────────
      case 7: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 7</Eyebrow>
          <Headline>Estimate your <span style={{ color: "var(--accent)" }}>body fat.</span></Headline>
          <Sub>Pick the figure that most closely matches your current build. This unlocks a more accurate metabolic equation.</Sub>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 8 }}>
            {BF_VISUAL.slice(0, 4).map(b => (
              <div key={b.r} onClick={() => auto("bodyFat", b.r)} style={{
                background: d.bodyFat === b.r ? `${b.c}14` : "#0d0d0d",
                border: `2px solid ${d.bodyFat === b.r ? b.c : "rgba(var(--accent-rgb),0.08)"}`,
                borderRadius: 12, padding: "10px 6px", textAlign: "center", cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <BFSilhouette pct={b.pct} color={b.c} selected={d.bodyFat === b.r} />
                <div style={{ fontSize: 10, fontWeight: 700, color: d.bodyFat === b.r ? b.c : "var(--text-faint)", marginTop: 5 }}>{b.r}</div>
                <div style={{ fontSize: 9, color: "var(--text-ghost)" }}>{b.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {BF_VISUAL.slice(4).map(b => (
              <div key={b.r} onClick={() => auto("bodyFat", b.r)} style={{
                background: d.bodyFat === b.r ? `${b.c}14` : "#0d0d0d",
                border: `2px solid ${d.bodyFat === b.r ? b.c : "rgba(var(--accent-rgb),0.08)"}`,
                borderRadius: 12, padding: "10px 6px", textAlign: "center", cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <BFSilhouette pct={b.pct} color={b.c} selected={d.bodyFat === b.r} />
                <div style={{ fontSize: 10, fontWeight: 700, color: d.bodyFat === b.r ? b.c : "var(--text-faint)", marginTop: 5 }}>{b.r}</div>
                <div style={{ fontSize: 9, color: "var(--text-ghost)" }}>{b.l}</div>
              </div>
            ))}
          </div>
        </div>
      );

      // (screen 8 handled above — insight 01)

      // ── 9 — Occupation ─────────────────────────────────────────────────────
      case 9: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 9</Eyebrow>
          <Headline>How active is <span style={{ color: "var(--accent)" }}>your job?</span></Headline>
          <Sub>This alone swings your daily burn by 700+ calories.</Sub>
          {[
            { v: "desk", l: "Desk / Remote", e: "💻", sub: "Sitting most of the day" },
            { v: "mix", l: "Mixed", e: "🚶", sub: "Some sitting, some movement" },
            { v: "feet", l: "On my feet", e: "👟", sub: "Standing and walking most of the day" },
            { v: "physical", l: "Physical labor", e: "🔨", sub: "Heavy movement all day" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.job === o.v} onClick={() => auto("job", o.v)} />)}
        </div>
      );

      // ── 10 — Steps ─────────────────────────────────────────────────────────
      case 10: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 10</Eyebrow>
          <Headline>Daily <span style={{ color: "var(--accent)" }}>steps?</span></Headline>
          <Sub>Be honest — most people overestimate this.</Sub>
          {[
            { v: "u3k", e: "🪑", l: "Under 2,000", sub: "Mostly sitting" },
            { v: "3-6k", e: "🚶", l: "2,000–5,000 steps" },
            { v: "6-10k", e: "🚶‍♂️", l: "5,000–8,000 steps" },
            { v: "10-15k", e: "🏃", l: "8,000–12,000 steps", sub: "Active lifestyle" },
            { v: "15k+", e: "⚡", l: "Over 12,000 steps", sub: "On feet all day" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.steps === o.v} onClick={() => auto("steps", o.v)} />)}
        </div>
      );

      // ── 11 — Training frequency ────────────────────────────────────────────
      case 11: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 11</Eyebrow>
          <Headline>Training sessions <span style={{ color: "var(--accent)" }}>per week?</span></Headline>
          {[
            { v: "n0",  l: "0 / week",     e: "😴" },
            { v: "1-3", l: "1–3 / week",   e: "🌱" },
            { v: "4-6", l: "4–6 / week",   e: "🔥" },
            { v: "7+",  l: "7+ / week",    e: "⚡", sub: "Training every day" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.freq === o.v} onClick={() => auto("freq", o.v)} />)}
        </div>
      );

      // ── 12 — Training type ─────────────────────────────────────────────────
      case 12: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 12</Eyebrow>
          <Headline>Primary training <span style={{ color: "var(--accent)" }}>type?</span></Headline>
          <Sub>Pick the one that dominates your week.</Sub>
          {[
            { v: "strength", l: "Strength / Lifting", e: "🏋️" },
            { v: "run", l: "Running / Cardio", e: "🏃" },
            { v: "hyrox", l: "Hyrox / CrossFit", e: "🔥" },
            { v: "hybrid", l: "Hybrid — mix of types", e: "⚡" },
            { v: "metcon", l: "MetCon", e: "💥", sub: "Metabolic conditioning — mixed modal high intensity" },
            { v: "sport", l: "Sport specific", e: "🏅" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.trainType === o.v} onClick={() => auto("trainType", o.v)} />)}
        </div>
      );

      // ── 12b — Equipment access ─────────────────────────────────────────────
      case "12b": return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Equipment</Eyebrow>
          <Headline>What equipment do you <span style={{ color: "var(--accent)" }}>train with?</span></Headline>
          <Sub>This filters programs to only show what actually works for you.</Sub>
          {[
            { v: "full",      l: "Full commercial gym",     e: "🏛️", sub: "Barbells, cables, machines — everything" },
            { v: "home_bar",  l: "Home gym with barbell",   e: "🏋️", sub: "Barbell, rack, dumbbells" },
            { v: "dumbbells", l: "Dumbbells and cables only", e: "💪", sub: "No barbell available" },
            { v: "minimal",   l: "Bodyweight / minimal",    e: "🌿", sub: "Bands, bodyweight, light weights" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.equipment === o.v} onClick={() => auto("equipment", o.v)} />)}
        </div>
      );

      // ── 12c — Session length ──────────────────────────────────────────────
      case "12c": return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Session Length</Eyebrow>
          <Headline>How long are your <span style={{ color: "var(--accent)" }}>sessions?</span></Headline>
          <Sub>Your typical training session — warm-up to done.</Sub>
          {[
            { v: "20",  l: "20–30 minutes",    e: "⚡" },
            { v: "45",  l: "Around 45 minutes", e: "🔥" },
            { v: "60",  l: "About an hour",     e: "💪" },
            { v: "90",  l: "90 minutes or more", e: "🏛️" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.sessionLength === o.v} onClick={() => auto("sessionLength", o.v)} />)}
        </div>
      );

      // ── 13 — Training experience (merged lift + cardio) ────────────────────
      case 13: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 13</Eyebrow>
          <Headline>Training <span style={{ color: "var(--accent)" }}>experience?</span></Headline>
          <Sub>Overall experience in your sport — lifting, running, or both. This sets the pace of your program.</Sub>
          {[
            { v: "none", e: "🌱", l: "None", sub: "Brand new to structured training" },
            { v: "beginner", e: "💪", l: "Beginner", sub: "Less than 1 year" },
            { v: "intermediate", e: "🔥", l: "Intermediate", sub: "1–4 years, consistent training" },
            { v: "advanced", e: "⚡", l: "Advanced", sub: "4+ years, near your ceiling" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.experience === o.v} onClick={() => auto("experience", o.v)} />)}
        </div>
      );

      // ── 14 — Training intensity ────────────────────────────────────────────
      case 14: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 14</Eyebrow>
          <Headline>Workout <span style={{ color: "var(--accent)" }}>intensity?</span></Headline>
          <Sub>Average RPE — rate of perceived exertion — across most of your sessions.</Sub>
          {[
            { v: "light", l: "Light", e: "💧", sub: "Mostly moving, never out of breath" },
            { v: "moderate", l: "Moderate", e: "💦", sub: "Sweating, slightly challenging" },
            { v: "hard", l: "Hard", e: "🔥", sub: "Breathing heavy, push through discomfort" },
            { v: "extreme", l: "Extreme", e: "⚡", sub: "Near max effort every session" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.intensity === o.v} onClick={() => auto("intensity", o.v)} />)}
        </div>
      );

      // (screen 15 handled above — insight 03)

      // ── 16 — Weight trend ──────────────────────────────────────────────────
      case 16: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 16</Eyebrow>
          <Headline>Recent weight <span style={{ color: "var(--accent)" }}>trend?</span></Headline>
          <Sub>Think about the last 3–4 weeks. Not one day — your trend.</Sub>
          {[
            { v: "losing", l: "Losing weight", e: "📉" },
            { v: "gaining", l: "Gaining weight", e: "📈" },
            { v: "stable", l: "Weight stable", e: "➡️" },
            { v: "notsure", l: "Not sure", e: "🤔" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.wTrend === o.v} onClick={() => auto("wTrend", o.v)} />)}
        </div>
      );

      // ── 17 — Weight history ────────────────────────────────────────────────
      case 17: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 17</Eyebrow>
          <Headline>Weight <span style={{ color: "var(--accent)" }}>history.</span></Headline>
          <Sub>Have you ever weighed significantly more than you do now? Past weight affects your current metabolism.</Sub>
          {[
            { v: "yes", l: "Yes, significantly more" },
            { v: "no", l: "No, this is typical" },
            { v: "notsure", l: "Not sure" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.wHistory === o.v} onClick={() => auto("wHistory", o.v)} />)}
        </div>
      );

      // ── 18 — Diet history ──────────────────────────────────────────────────
      case 18: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 18</Eyebrow>
          <Headline>How long have you <span style={{ color: "var(--accent)" }}>been dieting?</span></Headline>
          <Sub>Prolonged restriction causes metabolic adaptation — your body learns to burn less. We calculate it precisely.</Sub>
          {[
            { v: "not", l: "Not currently dieting" },
            { v: "u3", l: "In a deficit under 3 months" },
            { v: "3plus", l: "3+ months in a deficit", sub: "Significant adaptation likely" },
            { v: "offon", l: "On-and-off for years" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.dietHistory === o.v} onClick={() => auto("dietHistory", o.v)} />)}
        </div>
      );

      // (screen 19 handled above — insight 02)

      // ── 20 — Sleep hours ───────────────────────────────────────────────────
      case 20: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 20</Eyebrow>
          <Headline>Average <span style={{ color: "var(--accent)" }}>sleep hours?</span></Headline>
          <Sub>This directly reduces your metabolic rate if you're under 7 hours.</Sub>
          {[
            { v: "u5", l: "Under 5 hours" },
            { v: "5-6", l: "5–6 hours" },
            { v: "6-7", l: "6–7 hours" },
            { v: "7-8", l: "7–8 hours", sub: "Optimal recovery range" },
            { v: "8+", l: "8+ hours" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.sleep === o.v} onClick={() => auto("sleep", o.v)} />)}
        </div>
      );

      // ── 21 — Sleep quality ─────────────────────────────────────────────────
      case 21: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Step 21</Eyebrow>
          <Headline>Sleep <span style={{ color: "var(--accent)" }}>quality?</span></Headline>
          {[
            { v: "poor", l: "Poor", e: "😴", sub: "Restless, wake often" },
            { v: "fair", l: "Fair", e: "😐", sub: "Okay but not refreshing" },
            { v: "good", l: "Good", e: "🙂", sub: "Wake rested most nights" },
            { v: "excellent", l: "Excellent", e: "⚡", sub: "Deep, consistent sleep" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.sleepQ === o.v} onClick={() => auto("sleepQ", o.v)} />)}
        </div>
      );

      // ── 21b — Cycle status (female only) ───────────────────────────────────
      case "21b": return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// One more thing</Eyebrow>
          <Headline>Menstrual cycle <span style={{ color: "var(--accent)" }}>status.</span></Headline>
          <Sub>Your calorie needs shift 150–350 cal across your cycle. Most apps pretend this doesn't exist.</Sub>
          {[
            { v: "regular", l: "Regular cycle" },
            { v: "irregular", l: "Irregular cycle" },
            { v: "peri", l: "Perimenopausal / Menopausal" },
            { v: "hbc", l: "Using hormonal birth control" },
            { v: "prefer", l: "Prefer not to say" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.cycle === o.v} onClick={() => auto("cycle", o.v)} />)}
        </div>
      );

      // (screen 22 handled above — insight 05)

      // ── 23 — Health + safety (consolidated) ───────────────────────────────
      case 23: {
        const CONDITIONS = [
          { v: "thyroid", l: "Thyroid condition", sub: "Reduces BMR — hypothyroid / hyperthyroid" },
          { v: "pcos", l: "PCOS — polycystic ovary syndrome", sub: "Affects insulin sensitivity and fat storage" },
          { v: "diabetes", l: "Diabetes (Type 1 or 2)", sub: "Impacts glucose metabolism" },
          { v: "meds", l: "Weight-affecting medication", sub: "Many medications alter metabolism" },
          { v: "heart", l: "Heart condition", sub: "Cardiomyopathy, arrhythmia, valve issues" },
          { v: "hypertension", l: "High blood pressure", sub: "Medicated or uncontrolled" },
          { v: "surgery", l: "Recent surgery (within 12 months)", sub: "Including joint replacements" },
          { v: "joint_replacement", l: "Joint replacement", sub: "Hip, knee, shoulder — impact limits apply" },
          { v: "bone_condition", l: "Osteopenia or osteoporosis — low bone density", sub: "Affects safe loading" },
          { v: "none", l: "None of the above" },
        ];
        const toggle = v => {
          if (v === "none") { upd("conditions", ["none"]); return; }
          const cur = (d.conditions || []).filter(c => c !== "none");
          upd("conditions", cur.includes(v) ? cur.filter(c => c !== v) : [...cur, v]);
        };
        return (
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            <Eyebrow>// Safety check</Eyebrow>
            <Headline>Any health <span style={{ color: "var(--accent)" }}>conditions?</span></Headline>
            <Sub>Select all that apply. We adjust your equation and apply safe exercise modifications automatically.</Sub>
            {CONDITIONS.map(o => (
              <MultiCard
                key={o.v}
                label={o.l}
                sub={o.sub}
                selected={(d.conditions || []).includes(o.v)}
                onClick={() => toggle(o.v)}
              />
            ))}
            <div style={{
              background: "rgba(74,144,226,0.06)", border: "1px solid rgba(74,144,226,0.18)",
              borderRadius: 10, padding: "10px 14px", margin: "12px 0 16px",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💙</span>
              <div style={{ fontSize: 11, color: "rgba(74,144,226,0.85)", lineHeight: 1.6 }}>
                Coach Macro is not a medical service — always consult a healthcare professional. Your answers personalize your plan and are never shared.
              </div>
            </div>
            <PrimaryBtn onClick={next} label="Continue →" disabled={(d.conditions || []).length === 0} />
          </div>
        );
      }

      // ── 24 — Goal ──────────────────────────────────────────────────────────
      case 24: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Almost there</Eyebrow>
          <Headline>What's your <span style={{ color: "var(--accent)" }}>goal?</span></Headline>
          <Sub>Based on your answers, we'll set the right approach and tell you exactly why.</Sub>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { v: "cut", l: "Lose Fat", icon: "fluent-emoji-flat:fire", sub: "Fat loss" },
              { v: "maintain", l: "Maintain", icon: "fluent-emoji-flat:balance-scale", sub: "Hold weight" },
              { v: "bulk", l: "Build Muscle", icon: "fluent-emoji-flat:flexed-biceps", sub: "Lean bulk" },
              { v: "recomp", l: "Recomp", icon: "fluent-emoji-flat:counterclockwise-arrows-button", sub: "Both" },
            ].map(o => (
              <div key={o.v} onClick={() => auto("goal", o.v)} style={{
                flex: 1, background: d.goal === o.v ? "rgba(var(--accent-rgb),0.08)" : "#0d0d0d",
                border: `2px solid ${d.goal === o.v ? "var(--accent)" : "rgba(var(--accent-rgb),0.08)"}`,
                borderRadius: 12, padding: "16px 6px", textAlign: "center",
                cursor: "pointer", transition: "all 0.2s",
              }}>
                <div style={{ marginBottom: 6, display: "flex", justifyContent: "center" }}>
                  <Icon icon={o.icon} width={26} height={26} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: d.goal === o.v ? "var(--accent)" : "var(--white)" }}>{o.l}</div>
                <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{o.sub}</div>
              </div>
            ))}
          </div>
        </div>
      );

      // ── 25 — Target weight (moved: now immediately after current weight) ──────
      case 25: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Optional</Eyebrow>
          <Headline>Target <span style={{ color: "var(--accent)" }}>weight.</span></Headline>
          <Sub>Current: <b style={{ color: "var(--white)" }}>{d.weight} {d.wUnit}</b>. Where do you want to be? Skip if you don't have a specific number.</Sub>
          <div style={{ background: "#0d0d0d", border: "1px solid rgba(var(--accent-rgb),0.08)", borderRadius: 12, padding: "16px", marginBottom: 16 }}>
            <input
              value={d.goalWeight}
              onChange={e => upd("goalWeight", e.target.value)}
              type="number"
              placeholder={String(parseFloat(d.weight) || 160)}
              style={{
                width: "100%", background: "none", border: "none",
                color: "var(--white)", fontSize: 32, fontWeight: 700,
                outline: "none", fontFamily: "inherit",
                textAlign: "center", boxSizing: "border-box",
              }}
            />
            <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>{d.wUnit}</div>
          </div>
          <PrimaryBtn onClick={next} label="Continue →" disabled={!d.goalWeight} />
          <button onClick={next} style={{
            width: "100%", padding: "11px", background: "none",
            color: "var(--text-faint)", border: "none", cursor: "pointer",
            fontFamily: "inherit", fontSize: 13, marginTop: 8,
          }}>
            Skip — no specific target
          </button>
        </div>
      );

      // ── 26 — Calorie rate ──────────────────────────────────────────────────
      case 26: {
        if (d.goal === "maintain" || d.goal === "recomp") {
          // auto-skip — use autoNext so Back from screen 27 doesn't land here
          setTimeout(autoNext, 80);
          return null;
        }
        const RATES = d.goal === "cut"
          ? [
            { v: "−500", l: "−500 kcal/day", sub: "~1 lb fat loss/week" },
            { v: "−250", l: "−250 kcal/day", sub: "~0.5 lb/week" },
            { v: "−125", l: "−125 kcal/day", sub: "~0.25 lb/week — gentlest approach" },
          ]
          : [
            { v: "+125", l: "+125 kcal/day", sub: "~0.25 lb muscle/week — lean bulk" },
            { v: "+250", l: "+250 kcal/day", sub: "~0.5 lb/week" },
            { v: "+500", l: "+500 kcal/day", sub: "~1 lb/week — aggressive" },
          ];
        return (
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            <Eyebrow>// Step 26</Eyebrow>
            <Headline>Your calorie <span style={{ color: "var(--accent)" }}>rate.</span></Headline>
            <Sub>Choose your deficit or surplus depth. We'll tell you the exact daily target.</Sub>
            {RATES.map(o => <TapCard key={o.v} label={o.l} sub={o.sub} selected={d.goalRate === o.v} onClick={() => auto("goalRate", o.v)} />)}
          </div>
        );
      }

      // ── 27 — Why ───────────────────────────────────────────────────────────
      case 27: return (
        <div style={{ animation: "fadeIn 0.25s ease" }}>
          <Eyebrow>// Last question</Eyebrow>
          <Headline>Why does this <span style={{ color: "var(--accent)" }}>matter?</span></Headline>
          <Sub>We use this for daily motivation, pre-workout messages, and hard-day reminders. Pick the one that hits hardest.</Sub>
          {[
            { v: "health", e: "❤️", l: "Health & Longevity", sub: "Feel better, live longer" },
            { v: "confidence", e: "💪", l: "Confidence", sub: "Look and feel my best" },
            { v: "performance", e: "⚡", l: "Athletic Performance", sub: "Get stronger, faster, better" },
            { v: "aesthetic", e: "🔥", l: "Look Better", sub: "Body composition goals" },
            { v: "discipline", e: "🎯", l: "Discipline & Habits", sub: "Build a lifestyle, not a diet" },
            { v: "compete", e: "🏆", l: "Compete", sub: "Sport, Hyrox, powerlifting" },
          ].map(o => <TapCard key={o.v} {...o} selected={d.why === o.v} onClick={() => auto("why", o.v)} />)}
        </div>
      );

      // (screen 28 handled above — insight 04)

      default: return null;
    }
  }

  return (
    <div className="ob-page">
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Barlow:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div className="ob-inner" style={{ animation: "fadeIn 0.3s ease" }}>
        <ProgressHeader pct={pct} />
        {sc > 1 && sc !== 31 && (
          <button onClick={back} style={{
            background: "none", border: "none", color: "#FFFFFF",
            cursor: "pointer", fontSize: 18, padding: "0 0 16px",
            fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
          }}>← Back</button>
        )}
        {renderScreen()}
      </div>
    </div>
  );
}

// ─── Screen 29 — BUILD ("building one plan from all of it") §6 ───────────────

const BUILD_DELAYS = [450, 600, 650, 700, 700]; // ms per line; total ~3.1s
// After lines: +1000ms → pills; +800ms → note; +700ms → Continue button

function BuildScreen({ d, getMapped, onDone }) {
  const [step, setStep] = useState(0);
  const [pillsVisible, setPillsVisible] = useState(false);
  const [noteVisible, setNoteVisible] = useState(false);
  const [ready, setReady] = useState(false);

  // Compute personalised stats
  const mapped = getMapped();
  const tdee = calcTDEE(mapped);
  const freqLabel = FREQ_LABELS[d.freq] || d.freq || '—';
  const tdeeStr = tdee.total ? tdee.total.toLocaleString() : null;
  const _goalCap = GOAL_CAP[d.goal] || "Maintain";
  const _rateOffset = RATE_MAP_REVEAL[d.goalRate] || 0;
  const _goalCals = (d.goal === "maintain" || d.goal === "recomp")
    ? tdee.total : Math.max(1200, tdee.total + _rateOffset);
  const _lift = getDayMacros(_goalCals, _goalCap, "training");
  const liftDay = _lift?.calories > 0 ? _lift.calories.toLocaleString() : null;
  const proteinG = _lift?.protein > 0 ? String(_lift.protein) : null;

  const pills = [
    { num: tdeeStr  ? `${tdeeStr} cal` : "—", label: "daily burn" },
    { num: liftDay  ? `${liftDay} cal` : "—", label: "lift day" },
    { num: proteinG ? `${proteinG}g`   : "—", label: "protein target" },
  ];

  const lines = [
    `Metabolism mapped — ${tdeeStr ?? '—'} cal/day`,
    `Training load read — ${freqLabel} per week`,
    `Recovery factored — sleep + HRV`,
    `Linking fuel ↔ training…`,
    `Writing your adaptive targets`,
  ];

  useEffect(() => {
    const timers = [];
    let elapsed = 0;
    BUILD_DELAYS.forEach((delay, i) => {
      elapsed += delay;
      timers.push(setTimeout(() => setStep(i + 1), elapsed));
    });
    timers.push(setTimeout(() => setPillsVisible(true), elapsed + 1000));
    timers.push(setTimeout(() => setNoteVisible(true),  elapsed + 1800));
    timers.push(setTimeout(() => setReady(true),        elapsed + 2600));
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <Eyebrow>// connecting the system</Eyebrow>
      <div style={{
        fontFamily: "var(--condensed)", fontStyle: "italic", fontWeight: 900,
        fontSize: "clamp(30px,7vw,44px)", lineHeight: 0.95,
        textTransform: "uppercase", color: "var(--white)", marginBottom: 28,
      }}>
        Building one plan<br /><span style={{ color: "var(--accent)" }}>from all of it.</span>
      </div>

      {/* Animated checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
        {lines.map((line, i) => {
          const resolved = i < step;
          const active = i === step;
          const pending = i > step;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 0",
              borderBottom: "1px solid rgba(245,245,240,0.05)",
              opacity: pending ? 0.3 : 1,
              transition: "opacity 0.4s ease",
            }}>
              <div style={{ width: 20, flexShrink: 0, textAlign: "center" }}>
                {resolved && <span style={{ color: "var(--accent)", fontSize: 14, fontWeight: 800 }}>✓</span>}
                {active && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)", animation: "fabPulse 1s ease-in-out infinite" }} />}
                {pending && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "rgba(245,245,240,0.2)" }} />}
              </div>
              <div style={{
                fontSize: 14, fontWeight: resolved ? 600 : 400,
                color: resolved ? "#FFFFFF" : active ? "var(--white)" : "rgba(245,245,240,0.4)",
                transition: "color 0.4s ease, font-weight 0.3s ease",
                fontFamily: "var(--body)",
                letterSpacing: 0,
              }}>
                {line}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stat pills — appear 1s after last line */}
      {pillsVisible && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, animation: "fadeIn 0.5s ease" }}>
          {pills.map(p => (
            <div key={p.label} style={{
              flex: 1, textAlign: "center",
              background: "#0d0d0d",
              border: "1px solid rgba(var(--accent-rgb),0.3)",
              borderRadius: 10, padding: "12px 6px",
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: "#FFFFFF", lineHeight: 1, marginBottom: 5 }}>
                {p.num}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,245,240,0.45)" }}>
                {p.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Closing note — appears after pills */}
      {noteVisible && (
        <p style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.7, marginBottom: 20, animation: "fadeIn 0.5s ease" }}>
          Most apps run these as five separate tools. Coach Macro runs them as one brain — each one moving the others.
        </p>
      )}

      {/* Continue button — final beat */}
      {ready && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          <button onClick={onDone} style={{
            width: "100%", padding: "16px",
            background: "var(--accent)", color: "#fff",
            fontFamily: "var(--condensed)", fontWeight: 700, fontSize: 16,
            letterSpacing: 1, textTransform: "uppercase",
            border: "none", borderRadius: 13, cursor: "pointer",
          }}>
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Screen 30 — REVEAL (the payoff) §6 ──────────────────────────────────────

const GOAL_CAP = { cut: "Cut", bulk: "Bulk", maintain: "Maintain", recomp: "Maintain" };
const RATE_MAP_REVEAL = { "−500": -500, "−250": -250, "−125": -125, "+125": 125, "+250": 250, "+500": 500 };

function RevealScreen({ d, getMapped, onNext }) {
  const mapped = getMapped();
  const tdee = calcTDEE(mapped);
  const goalCap = GOAL_CAP[d.goal] || "Maintain";
  const rateOffset = RATE_MAP_REVEAL[d.goalRate] || 0;
  const goalCals = (d.goal === "maintain" || d.goal === "recomp")
    ? tdee.total
    : Math.max(1200, tdee.total + rateOffset);

  const liftMacros = getDayMacros(goalCals, goalCap, "training");
  const restMacros  = getDayMacros(goalCals, goalCap, "rest");

  // §7: liftDay / restDay / proteinG — from existing getDayMacros, graceful fallback
  const liftDay  = (liftMacros?.calories > 0) ? liftMacros.calories.toLocaleString() : null;
  const restDay  = (restMacros?.calories  > 0) ? restMacros.calories.toLocaleString()  : null;
  const proteinG = (liftMacros?.protein   > 0) ? liftMacros.protein   : null;
  const tdeeStr  = tdee.total ? tdee.total.toLocaleString() : null;

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      <Eyebrow>// your plan is ready</Eyebrow>
      <div style={{
        fontFamily: "var(--condensed)", fontStyle: "italic", fontWeight: 900,
        fontSize: "clamp(34px,8vw,52px)", lineHeight: 0.92,
        textTransform: "uppercase", color: "var(--white)", marginBottom: 24,
      }}>
        Here's your <span style={{ color: "var(--accent)" }}>starting line.</span>
      </div>

      {/* TDEE block */}
      <div style={{
        background: "rgba(var(--accent-rgb),0.06)",
        border: "1.5px solid rgba(var(--accent-rgb),0.2)",
        borderRadius: 16, padding: "22px 20px", marginBottom: 16,
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9, fontWeight: 500,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "rgba(var(--accent-rgb),0.7)", marginBottom: 10,
        }}>
          YOUR DAILY BURN · total energy you use in a day
        </div>
        <div style={{
          fontFamily: "var(--condensed)", fontWeight: 900,
          fontSize: 72, lineHeight: 1, color: "var(--accent)",
          letterSpacing: -2, marginBottom: 6,
        }}>
          {tdeeStr ?? "—"}
        </div>
        <div style={{ fontSize: 12, color: "#FFFFFF", opacity: 0.7 }}>
          But you'll rarely eat exactly this — it moves with your training.
        </div>
      </div>

      {/* Three-up cards: liftDay / restDay / protein */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "LIFT DAY", value: liftDay ? `${liftDay} cal` : "—", accent: true },
          { label: "REST DAY", value: restDay  ? `${restDay} cal`  : "—", accent: false },
          { label: "PROTEIN",  value: proteinG ? `${proteinG}g`    : "—", accent: false },
        ].map(card => (
          <div key={card.label} style={{
            background: card.accent ? "rgba(var(--accent-rgb),0.08)" : "#0d0d0d",
            border: `1.5px solid ${card.accent ? "rgba(var(--accent-rgb),0.25)" : "rgba(var(--accent-rgb),0.08)"}`,
            borderRadius: 12, padding: "14px 10px", textAlign: "center",
          }}>
            <div style={{
              fontFamily: "var(--mono)", fontSize: 8, fontWeight: 500,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: card.accent ? "var(--accent)" : "rgba(245,245,240,0.5)",
              marginBottom: 8,
            }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: "var(--condensed)", fontWeight: 900,
              fontSize: 22, color: card.accent ? "var(--accent)" : "#FFFFFF",
              lineHeight: 1,
            }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <p style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
        Three numbers that would be one wrong number in any other app.
      </p>

      <button onClick={onNext} style={{
        width: "100%", padding: "16px",
        background: "transparent",
        border: "1.5px solid rgba(var(--accent-rgb),0.35)",
        color: "var(--accent)", fontFamily: "var(--condensed)",
        fontWeight: 700, fontSize: 16, letterSpacing: 1,
        textTransform: "uppercase", borderRadius: 13, cursor: "pointer",
      }}>
        See what I unlock →
      </button>
    </div>
  );
}

// ─── Screen 31 — PAYWALL (Apple Pay trial start) §6 ──────────────────────────

function NewPaywall({ trialDays }) {
  const [plan, setPlan] = useState("annual");  // 'annual' | 'monthly'
  const [purchasing, setPurchasing] = useState(false);
  const [legalModal, setLegalModal] = useState(null); // null | 'terms' | 'privacy'

  const eyebrow = "// start your 7 days";

  async function handlePurchase() {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const { data: { user: u } } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!u) { showToast("Please sign in to continue.", "error"); return; }

      // ── DEV-TEST BYPASS (build:sim → MODE!=="production") ──────────────────
      // There is no configured RevenueCat offering in dev/sim, so the real IAP
      // can't complete — the button would appear dead. Instead, VISIBLY simulate
      // a successful unlock so the post-paywall flow is testable end-to-end.
      // MODE-gated → terser-stripped from production `vite build` (never ships).
      if (import.meta.env.MODE !== "production") {
        const unlocked = await devUnlockEntitlement(u.id);
        if (unlocked) {
          showToast("Dev unlock — subscription simulated. Loading your app…", "success");
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast("Dev unlock failed — check the console.", "error");
        }
        return;
      }

      // ── REAL PURCHASE (production) ─────────────────────────────────────────
      // Calls purchasePackage on the selected offering package; on entitlement
      // granted purchaseService returns true, on user-cancel it returns false.
      const ok = plan === "annual"
        ? await purchaseAnnual(u.id)
        : await purchaseMonthly(u.id);
      if (ok) window.location.reload();
      else showToast("Purchase cancelled or not completed.", "error");
    } catch (e) {
      // Surface the real reason instead of swallowing it. The most common
      // pre-launch failure is an empty RevenueCat offering (App Store products
      // not yet created/approved) → purchaseService throws "…package not found".
      console.warn("[paywall] purchase failed:", e?.message, e);
      showToast(
        /package not found/i.test(e?.message || "")
          ? "Subscriptions aren’t available yet. Please try again later."
          : "Purchase failed. Try again.",
        "error",
      );
    }
    finally { setPurchasing(false); }
  }


  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      {/* Logo removed here — the screen-level ProgressHeader (<Logo/>) already shows the mark. */}
      <Eyebrow>{eyebrow}</Eyebrow>
      <div style={{
        fontFamily: "var(--condensed)", fontStyle: "italic", fontWeight: 900,
        fontSize: "clamp(32px,8vw,48px)", lineHeight: 0.92,
        textTransform: "uppercase", color: "var(--white)", marginBottom: 12,
      }}>
        Meet the coach <span style={{ color: "var(--accent)" }}>that knows you.</span>
      </div>
      <p style={{ color: "#FFFFFF", fontSize: 14, lineHeight: 1.65, marginBottom: 18 }}>
        Your plan is built. Try the full coach free for <b>{trialDays} days</b> — adaptive targets, AI logging, your daily brief.
      </p>

      {/* Feature showcase — what you unlock (value before price). Compact 2-col list on a
          dark card with accent checks; no imagery behind text so the price + disclosure below
          stay fully legible. Fixed brand-dark surface → identical in both themes. */}
      <div style={{
        background: "#0d0d0d",
        border: "1px solid rgba(var(--accent-rgb),0.15)",
        borderRadius: 14, padding: "15px 16px 13px", marginBottom: 16,
      }}>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 9, fontWeight: 800,
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: "var(--accent)", marginBottom: 12,
        }}>
          Everything you unlock
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 12px" }}>
          {[
            "Adaptive daily macros",
            "Meal planning",
            "Auto grocery lists",
            "Restaurant AI",
            "Recovery scoring",
            "Run tracking",
            "AI coach + daily brief",
            "Progress & photos",
          ].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                flexShrink: 0, width: 15, height: 15, borderRadius: "50%",
                background: "rgba(var(--accent-rgb),0.15)", color: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, lineHeight: 1,
              }}>✓</span>
              <span style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 500, lineHeight: 1.15 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plan toggle */}
      <div style={{ display: "flex", background: "#0d0d0d", border: "1px solid rgba(var(--accent-rgb),0.08)", borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 }}>
        {[{ v: "annual", l: "Annual", sub: "67% off" }, { v: "monthly", l: "Monthly", sub: "" }].map(p => (
          <button key={p.v} onClick={() => setPlan(p.v)} style={{
            flex: 1, padding: "11px", borderRadius: 8, border: "none", cursor: "pointer",
            background: plan === p.v ? "var(--accent)" : "transparent",
            color: plan === p.v ? "#fff" : "rgba(245,245,240,0.5)",
            fontWeight: 700, fontSize: 13, fontFamily: "var(--body)",
            transition: "all 0.2s",
          }}>
            {p.l}{p.sub ? <span style={{ fontSize: 10, opacity: 0.8 }}> — {p.sub}</span> : ""}
          </button>
        ))}
      </div>

      {/* Offer card */}
      <div style={{
        background: "#0d0d0d",
        border: "1.5px solid rgba(var(--accent-rgb),0.25)",
        borderRadius: 16, padding: "22px 20px", marginBottom: 14, position: "relative",
      }}>
        {plan === "annual" ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <s style={{ fontSize: 18, color: "rgba(245,245,240,0.35)", fontWeight: 400 }}>$69.99</s>
              <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 52, color: "var(--accent)", lineHeight: 1, letterSpacing: -1 }}>
                $49.99<span style={{ fontSize: 18, fontWeight: 400, color: "rgba(245,245,240,0.5)" }}>/yr</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#FFFFFF", marginBottom: 20 }}>
              Less than $1 a week after your trial
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 52, color: "var(--accent)", lineHeight: 1, letterSpacing: -1, marginBottom: 4 }}>
              $12.99<span style={{ fontSize: 18, fontWeight: 400, color: "rgba(245,245,240,0.5)" }}>/mo</span>
            </div>
            <div style={{ fontSize: 13, color: "#FFFFFF", marginBottom: 20 }}>
              Billed monthly · cancel anytime
            </div>
          </>
        )}

        {/* ── Auto-renewal disclosure — legal requirement (FTC / state auto-renewal
              law / Apple 3.1.2). Must be legible and BEFORE the purchase button. ── */}
        <div style={{
          textAlign: "left", marginBottom: 16,
          fontFamily: "var(--body)", fontSize: 12, lineHeight: 1.55,
          color: "rgba(245,245,240,0.92)",
        }}>
          <div style={{ marginBottom: 7, fontWeight: 700, fontSize: 13, color: "#FFFFFF" }}>
            {trialDays}-day free trial, then {plan === "annual" ? "$49.99/year" : "$12.99/month"}.
          </div>
          Your Coach Macro subscription automatically renews at {plan === "annual" ? "$49.99/year" : "$12.99/month"} unless
          it is cancelled at least 24 hours before the end of the current period. Payment is charged to your Apple ID
          account at confirmation of purchase. Your account is charged for renewal within 24 hours before the current
          period ends. You can manage or cancel your subscription anytime in your App Store account settings.
          Any unused portion of the free trial is forfeited when you purchase a subscription.
          <div style={{ marginTop: 9 }}>
            <button type="button" onClick={() => setLegalModal("terms")} style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: "var(--body)", fontSize: 12, color: "var(--accent)", textDecoration: "underline",
            }}>Terms of Use</button>
            <span style={{ opacity: 0.45, margin: "0 7px" }}>·</span>
            <button type="button" onClick={() => setLegalModal("privacy")} style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              fontFamily: "var(--body)", fontSize: 12, color: "var(--accent)", textDecoration: "underline",
            }}>Privacy Policy</button>
          </div>
        </div>

        {/* Purchase CTA */}
        <button onClick={handlePurchase} disabled={purchasing} style={{
          display: "block", width: "100%", textAlign: "center",
          padding: "17px",
          background: purchasing ? "rgba(var(--accent-rgb),0.45)" : "var(--accent)",
          color: "#fff", fontFamily: "var(--condensed)", fontWeight: 700,
          fontSize: 17, letterSpacing: 1, textTransform: "uppercase",
          border: "none", borderRadius: 11, cursor: purchasing ? "default" : "pointer",
          transition: "opacity 0.2s",
        }}>
          {purchasing ? "Processing…" : `Start Free — $0.00 Today →`}
        </button>
      </div>


      {/* In-app legal viewer (Terms / Privacy) — mirrors NativeApp's bundled legal modal
          so the disclosure links open without leaving the native app. */}
      {legalModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <button onClick={() => setLegalModal(null)} style={{
            position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "rgba(0,0,0,0.92)", border: "none", borderBottom: "1px solid rgba(245,245,240,0.1)",
            color: "var(--accent)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 12,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "calc(env(safe-area-inset-top, 0px) + 14px) 20px 14px", width: "100%",
          }}>← Close</button>
          {legalModal === "terms" ? <TermsOfService /> : <PrivacyPolicy />}
        </div>
      )}
    </div>
  );
}

// ─── Body fat silhouette (inline — reuses same math as existing) ──────────────

// fillOpacity/strokeOpacity instead of hex concatenation — handles both hex and
// CSS variable colors (e.g. "var(--accent)" for the 40+% option).
function BFSilhouette({ pct, color, selected }) {
  const w = 28 + pct * 0.8;
  const sh = 22 + pct * 0.3;
  const fo = selected ? 1 : 0.4;          // fill opacity for main shapes
  const fot = selected ? 0.47 : 0.13;     // fill opacity for belly tint (≈"77"/"22")
  const so = selected ? 1 : 0.4;          // stroke opacity
  return (
    <svg width="56" height="84" viewBox="0 0 100 160" style={{ display: "block", margin: "0 auto" }}>
      <ellipse cx="50" cy="18" rx="14" ry="17" fill={color} fillOpacity={fo} />
      <rect x="44" y="33" width="12" height="8" fill={color} fillOpacity={fo} />
      <path d={`M${50 - sh},42 C${50 - sh - 4},42 ${50 - w},58 ${50 - w},80 Q${50 - w},95 50,95 Q${50 + w},95 ${50 + w},80 C${50 + w},58 ${50 + sh + 4},42 ${50 + sh},42 Z`} fill={color} fillOpacity={selected ? 0.27 : 0.27} />
      {pct > 22 && <ellipse cx="50" cy={65 + pct * 0.25} rx={w * 0.55} ry={pct * 0.3} fill={color} fillOpacity={fot} />}
      <path d={`M${50 - sh},50 C${50 - sh - 8},56 ${50 - sh - 10},72 ${50 - sh - 7},86`} fill="none" stroke={color} strokeOpacity={so} strokeWidth={4 + pct * 0.07} strokeLinecap="round" />
      <path d={`M${50 + sh},50 C${50 + sh + 8},56 ${50 + sh + 10},72 ${50 + sh + 7},86`} fill="none" stroke={color} strokeOpacity={so} strokeWidth={4 + pct * 0.07} strokeLinecap="round" />
      <path d={`M${50 - 10},95 L${50 - 13 - pct * 0.1},148`} fill="none" stroke={color} strokeOpacity={so} strokeWidth={7 + pct * 0.08} strokeLinecap="round" />
      <path d={`M${50 + 10},95 L${50 + 13 + pct * 0.1},148`} fill="none" stroke={color} strokeOpacity={so} strokeWidth={7 + pct * 0.08} strokeLinecap="round" />
    </svg>
  );
}
