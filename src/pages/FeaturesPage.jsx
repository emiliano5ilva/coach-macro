import React, { useState, useEffect, useRef } from "react";
import { applyLandingTheme, getInitialSiteTheme } from "../landing.jsx";

// ── /features — the comprehensive feature showcase. Two views (toggle):
//    A "Everything" — the full categorized inventory (built).
//    B "How it connects" — the connected-system diagram (iterative next step; placeholder for now).
// Same design system as the landing: no-grey full-contrast, light/dark, Barlow Condensed +
// DM Mono, AA contrast. Reuses applyLandingTheme so the site theme is shared.
// Honesty-checked against the real shipped features (no gated/stubbed overclaims):
// "hundreds" of recipes (not 299), only Apple Health + Strava (Garmin/Whoop stubbed → omitted),
// personas selectable via settings, food vision "checks against a nutrition database".

const FP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  :root { --condensed: 'Barlow Condensed','Inter',sans-serif; --body: 'Inter',sans-serif; --mono: 'DM Mono',monospace; }

  .fp * { box-sizing: border-box; margin: 0; padding: 0; }
  /* Default = DARK (FOUC-safe); applyLandingTheme overrides per light/dark on this element. */
  .fp {
    --bg: #000; --bg-rgb: 0,0,0; --bg-card: rgba(255,255,255,0.04); --lp-surface: #0E0E10;
    --white: #fff; --white-border: rgba(255,255,255,0.12); --lp-border: rgba(255,255,255,0.14);
    --red: #FF3B30; --red-text: #FF3B30; --cm-accent-deep: #D13027;
    --red-glow: rgba(255,59,48,0.40); --red-border: rgba(255,59,48,0.35); --red-border-strong: rgba(255,59,48,0.6);
    background: var(--bg); color: var(--white); font-family: var(--body);
    -webkit-font-smoothing: antialiased; min-height: 100vh; overflow-x: hidden;
  }

  /* NAV */
  .fp-nav { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(var(--bg-rgb,0,0,0),0.82); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid var(--white-border); }
  .fp-logo { display: flex; align-items: center; gap: 12px; font-family: var(--condensed); font-weight: 800; font-size: 20px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--white); text-decoration: none; cursor: pointer; background: none; border: none; }
  .fp-logo img { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; box-shadow: 0 0 18px rgba(255,59,48,0.45); }
  .fp-logo .coach { font-style: italic; font-weight: 400; }
  .fp-nav-right { display: flex; align-items: center; gap: 16px; }
  .fp-nav-link { font-family: var(--body); font-size: 13px; font-weight: 500; color: var(--white); text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; }
  .fp-nav-link:hover { color: var(--red-text); }
  .fp-theme-toggle { display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--white); background: transparent; border: 1px solid var(--lp-border); padding: 8px 13px; border-radius: 4px; cursor: pointer; transition: border-color 0.2s,color 0.2s; }
  .fp-theme-toggle:hover { border-color: var(--red); color: var(--red-text); }
  .fp-nav-cta { font-family: var(--condensed); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--cm-accent-deep); border: none; padding: 10px 18px; border-radius: 4px; cursor: pointer; text-decoration: none; }

  /* HEADER */
  .fp-head { max-width: 1200px; margin: 0 auto; padding: 88px 48px 32px; }
  .fp-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin-bottom: 16px; }
  .fp-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(44px,6vw,88px); line-height: 0.92; letter-spacing: -0.03em; text-transform: uppercase; color: var(--white); }
  .fp-title .accent { color: var(--red); }
  .fp-sub { font-family: var(--body); font-size: 18px; line-height: 1.6; color: var(--white); max-width: 640px; margin-top: 20px; }

  /* VIEW TOGGLE */
  .fp-toggle-wrap { max-width: 1200px; margin: 32px auto 0; padding: 0 48px; }
  .fp-toggle { display: inline-flex; align-items: center; gap: 4px; background: var(--bg-card); border: 1px solid var(--lp-border); border-radius: 100px; padding: 4px; }
  .fp-toggle button { font-family: var(--mono); font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--white); background: transparent; border: none; padding: 10px 20px; border-radius: 100px; cursor: pointer; transition: color 0.2s; }
  .fp-toggle button.on { background: var(--cm-accent-deep); color: #fff; }

  /* VIEW A — categorized list */
  .fp-body { max-width: 1200px; margin: 0 auto; padding: 48px 48px 40px; }
  .fp-cat { margin-bottom: 56px; }
  .fp-cat-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 22px; padding-bottom: 14px; border-bottom: 1px solid var(--white-border); }
  .fp-cat-label { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(26px,3vw,38px); line-height: 1; letter-spacing: -0.02em; text-transform: uppercase; color: var(--red); }
  .fp-cat-tag { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--white); }
  .fp-list { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px 40px; }
  .fp-item { font-family: var(--body); font-size: 15px; line-height: 1.55; color: var(--white); display: flex; gap: 12px; }
  .fp-item::before { content: ''; flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: var(--red); margin-top: 7px; }
  .fp-item strong { font-weight: 600; }

  /* VIEW B — the connected-system ring/web */
  .fp-connect-intro { max-width: 700px; margin: 4px 0 8px; font-family: var(--body); font-size: 17px; line-height: 1.6; color: var(--white); }
  .fp-diagram-wrap { max-width: 1080px; margin: 24px auto 0; }
  .fp-diagram { position: relative; width: 100%; aspect-ratio: 1000 / 680; }
  .fp-diagram svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .fp-node { position: absolute; transform: translate(-50%,-50%); z-index: 2; background: var(--bg-card); border: 1.5px solid var(--red-border); border-radius: 14px; padding: 13px 20px; text-align: center; min-width: 128px; box-shadow: 0 10px 30px rgba(0,0,0,0.30); }
  .fp-node.hero-node { border-color: var(--red); box-shadow: 0 0 34px var(--red-glow), 0 10px 30px rgba(0,0,0,0.30); }
  .fp-node-label { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 22px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: var(--white); }
  .fp-node-sub { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--red-text); margin-top: 5px; }
  #ah-hero path, #ah-mid path { fill: var(--red); }
  #ah-mid path { opacity: 0.72; }
  .fp-arr { fill: none; }
  .fp-arr.hero { stroke: var(--red); stroke-width: 3.4; }
  .fp-arr.mid { stroke: var(--red); stroke-width: 1.8; opacity: 0.72; }
  .fp-arr-faint { fill: none; stroke: var(--red); stroke-width: 1; stroke-dasharray: 3 6; opacity: 0; }
  .fp-arr-label { font-family: var(--mono); font-size: 12.5px; fill: var(--white); paint-order: stroke; stroke: var(--bg); stroke-width: 4px; stroke-linejoin: round; text-anchor: middle; letter-spacing: 0.02em; }
  .fp-arr-label.dim { fill: var(--red-text); font-size: 11px; }
  .fp-flow { fill: var(--red); }
  .fp-flow.hero { filter: drop-shadow(0 0 5px var(--red)); }
  .fp-connect-take { max-width: 720px; margin: 32px auto 0; text-align: center; font-family: var(--body); font-size: 16px; line-height: 1.6; color: var(--white); }
  .fp-connect-take strong { color: var(--red-text); font-weight: 600; }
  /* draw-in */
  .fp-diagram .fp-arr { stroke-dasharray: 1400; stroke-dashoffset: 1400; }
  .fp-diagram .fp-arr-label { opacity: 0; }
  .fp-diagram.animate .fp-arr { animation: fp-draw 0.9s cubic-bezier(0.34,1.12,0.5,1) forwards; }
  .fp-diagram.animate .fp-arr.hero { animation-delay: 0.15s; }
  .fp-diagram.animate .fp-arr.mid { animation-delay: 0.65s; }
  .fp-diagram.animate .fp-arr-faint { animation: fp-fade 0.8s ease forwards; animation-delay: 1.15s; }
  .fp-diagram.animate .fp-arr-label.hero-l { animation: fp-fadein 0.5s ease forwards; animation-delay: 0.75s; }
  .fp-diagram.animate .fp-arr-label.mid-l { animation: fp-fadein 0.5s ease forwards; animation-delay: 1.05s; }
  @keyframes fp-draw { to { stroke-dashoffset: 0; } }
  @keyframes fp-fade { to { opacity: 0.32; } }
  @keyframes fp-fadein { to { opacity: 1; } }
  /* static (reduced motion): everything shown, no flow */
  .fp-diagram.static .fp-arr { stroke-dashoffset: 0; }
  .fp-diagram.static .fp-arr-faint { opacity: 0.32; }
  .fp-diagram.static .fp-arr-label { opacity: 1; }

  /* FOOTER */
  .fp-footer { max-width: 1200px; margin: 0 auto; padding: 40px 48px; border-top: 1px solid var(--white-border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
  .fp-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .fp-footer-links a { font-family: var(--body); font-size: 12px; color: var(--white); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
  .fp-footer-links a:hover { color: var(--red-text); }
  .fp-footer-copy { font-family: var(--mono); font-size: 11px; color: var(--white); letter-spacing: 0.04em; }
  .fp-motion-btn { background: none; border: 1px solid var(--white-border); color: var(--white); font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
  .fp-motion-btn:hover { border-color: var(--red); color: var(--red-text); }

  /* Reveal */
  .fp [data-reveal] { opacity: 0; transform: translateY(22px); }
  .fp.rev-armed [data-reveal] { transition: opacity 0.34s ease-out, transform 0.46s cubic-bezier(0.34,1.36,0.5,1); transition-delay: var(--rev-delay,0ms); }
  .fp [data-reveal].in { opacity: 1; transform: translateY(0); }

  /* Focus */
  .fp a:focus-visible, .fp button:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; border-radius: 4px; }

  /* Visually-hidden but exposed to screen readers */
  .fp-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: normal; border: 0; }

  @media (prefers-reduced-motion: reduce) {
    .fp [data-reveal] { opacity: 1 !important; transform: none !important; transition: none !important; }
  }
  @media (max-width: 860px) {
    .fp-nav { padding: 0 20px; } .fp-nav-link { display: none; }
    .fp-head, .fp-body, .fp-footer, .fp-toggle-wrap { padding-left: 20px; padding-right: 20px; }
    .fp-list { grid-template-columns: 1fr; }
    .fp-footer { flex-direction: column; text-align: center; }
  }
  @media (max-width: 600px) {
    /* Below phone width the ring overlaps — swap the visual diagram for the readable
       relationship list (already present for screen readers). No h-scroll, clean content. */
    .fp-diagram { display: none; }
    .fp-diagram-wrap .fp-sr-only { position: static; width: auto; height: auto; overflow: visible; clip: auto; margin: 8px 0 0; }
    .fp-diagram-wrap .fp-sr-only h3 { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 22px; text-transform: uppercase; color: var(--red); margin-bottom: 14px; }
    .fp-diagram-wrap .fp-sr-only ul { list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .fp-diagram-wrap .fp-sr-only li { font-family: var(--body); font-size: 15px; line-height: 1.5; color: var(--white); padding-left: 14px; border-left: 2px solid var(--red); }
  }
`;

// Full categorized inventory — comprehensive, plain, honest.
const CATEGORIES = [
  { label: "Train", tag: "The Training Engine", items: [
    "50+ programs across strength, running, hybrid, and Hyrox — including faithful classic-era routines, not generic templates.",
    "Every program personalized to your goal and experience — sets, reps, rest, and effort calculated for you.",
    "Progression that tracks every set and tells you the next weight, with automatic deloads when you stall.",
    "Estimated 1RM and personal records caught and logged automatically.",
    "Plateau detection with specific break-through protocols when a lift stops moving.",
    "Adapt-Now — rewrite today's session in one tap when you're injured, travelling, or short on time; it accounts for your recovery.",
    "Contextual warm-ups matched to the session and ramped to your working weight.",
    "Exercise library with form cues and coaching pitched at your level.",
    "A week editor that lets you move training days around and keeps the plan sound.",
    "Live logging with rest timers seeded from your program and RPE-based fatigue cues.",
    "Deload weeks scheduled automatically when your body signals it needs one.",
    "Female cycle and life-stage programming (pregnancy, postpartum, menopause) that learns your own pattern.",
  ]},
  { label: "Fuel", tag: "The Nutrition Brain", items: [
    "Macro targets that move with your training — more on hard days, less on rest days, automatically.",
    "Photo food logging — snap your plate; it identifies the items, estimates portions, and checks itself against a nutrition database.",
    "Restaurant AI — tell it where you're eating and it finds the order that fits your day, with smart swaps for known chains.",
    "Barcode scanning and search across millions of foods, with one-tap re-logging from your history.",
    "Workouts credit calories back into your day the moment you finish.",
    "A full energy-balance model — your basal rate, daily movement, training, and digestion — that adapts to your real weight trend.",
    "Metabolic reset — detects a genuinely stalled cut and walks you through a structured reverse diet.",
    "Hundreds of guided recipes with step-by-step cooking mode.",
    "Weekly meal plans fitted to each day's macro target, with batch-prep and aisle-grouped grocery lists.",
    "Diet styles — keto, mediterranean, high-protein, vegan and more — that actually filter to matching meals.",
    "Water tracking scaled to your training and the weather.",
  ]},
  { label: "Run", tag: "The Run Engine", items: [
    "A full running plan from your inputs — mileage that ramps safely, recovery weeks, and a taper into race day.",
    "Real pace zones — easy, tempo, interval, long — derived from your current 5K time.",
    "Paces that recalibrate themselves as your sessions get faster.",
    "It won't stack a hard run on legs still sore from lifting.",
    "Honest race-time predictions grounded in your real runs, not fantasy numbers.",
    "Hyrox training with station-aware pacing and race-date periodization.",
  ]},
  { label: "Recovery", tag: "Recovery Intelligence", items: [
    "One recovery score from your sleep, heart-rate variability, and training load — with guardrails so it never rewards unsafe habits.",
    "A thermal body map showing which muscles are recovered and which still need time.",
    "Readiness that adjusts today's session — cutting volume when you're run-down, unlocking more when you're primed.",
    "Personalized soreness learning — it learns how long each muscle takes to bounce back for you.",
    "Injury-risk flags for volume spikes, sharp mileage jumps, and training through fatigue.",
    "Apple Health — reads your sleep, HRV, steps and heart rate, and writes your workouts back.",
    "Strava activities flow straight into your plan.",
  ]},
  { label: "Coach", tag: "The Coach", items: [
    "A morning brief each day that reads your data and surfaces the one thing that matters most.",
    "A coach voice you choose — gentle, steady, or intense — that speaks to your actual day.",
    "It remembers what worked before, and when a setback repeats it points you back to the fix that helped.",
    "Daily insights from your own patterns — under-eating, erratic intake, stalled progress, dropping recovery.",
    "Connections drawn from your own data — how your sleep shapes tomorrow, how volume affects recovery.",
    "Your Training DNA — a six-part athletic profile built from what you actually do.",
    "Weight and goal projections grounded in your trend, with an honest ETA.",
    "Eight colour themes and full light and dark — the whole app, your way.",
  ]},
];

// ── Connection ring geometry (View B) — 5 systems on a loose circle. ──────────
// Node positions as % (for HTML nodes) + viewBox centers (for SVG arrows). Loose, not
// perfectly even, so it reads as a web of mutual cross-talk — not a pipeline or a hub.
const RING_NODES = [
  { id: 'train',    label: 'Train',    sub: 'The Training Engine',   x: 30,   y: 22, hero: true },
  { id: 'fuel',     label: 'Fuel',     sub: 'The Nutrition Brain',   x: 70,   y: 22, hero: true },
  { id: 'run',      label: 'Run',      sub: 'The Run Engine',        x: 83.5, y: 59 },
  { id: 'recovery', label: 'Recovery', sub: 'Recovery Intelligence', x: 50,   y: 86 },
  { id: 'coach',    label: 'Coach',    sub: 'The Coach',             x: 16.5, y: 59 },
];
const CTR = { train:[300,149.6], fuel:[700,149.6], run:[835,401.2], recovery:[500,584.8], coach:[165,401.2] };

function _edge(cx, cy, ux, uy, rx = 94, ry = 46) {
  const t = 1 / Math.sqrt((ux*ux)/(rx*rx) + (uy*uy)/(ry*ry));
  return [cx + ux*t, cy + uy*t];
}
// Curved arrow between two nodes, trimmed to each node's edge; returns path + label point.
function _arc(from, to, curve) {
  const [ax, ay] = CTR[from], [bx, by] = CTR[to];
  let dx = bx-ax, dy = by-ay, L = Math.hypot(dx, dy), ux = dx/L, uy = dy/L;
  const [sx, sy] = _edge(ax, ay, ux, uy);
  const [ex, ey] = _edge(bx, by, -ux, -uy);
  const mx = (sx+ex)/2, my = (sy+ey)/2, px = -uy, py = ux;
  const cx = mx + px*curve, cy = my + py*curve;
  return { d: `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`, lx: cx, ly: cy };
}
// Solid relationships. Bidirectional pairs share a curve magnitude → the perpendicular
// auto-flips so the two directions bow to opposite sides. Train⇄Fuel is the hero.
const RING_ARROWS = [
  { id: 'a-tf', from: 'train',    to: 'fuel',     curve: 54, tier: 'hero', label: 'adjusts your macros', begin: 1.0 },
  { id: 'a-ft', from: 'fuel',     to: 'train',    curve: 54, tier: 'hero', label: 'fuels the work',      begin: 1.25 },
  { id: 'a-tr', from: 'train',    to: 'recovery', curve: 46, tier: 'mid',  label: 'adds to your load',   begin: 1.7 },
  { id: 'a-rt', from: 'recovery', to: 'train',    curve: 46, tier: 'mid',  label: 'shapes training',     begin: 1.9 },
  { id: 'a-rr', from: 'run',      to: 'recovery', curve: 46, tier: 'mid',  label: 'adds to your load',   begin: 1.7 },
  { id: 'a-rn', from: 'recovery', to: 'run',      curve: 46, tier: 'mid',  label: 'sets your paces',     begin: 1.9 },
].map(a => ({ ...a, ...(_arc(a.from, a.to, a.curve)) }));
// Coach reads everything — faintest layer, no arrowheads, one collective label.
const COACH_ARROWS = ['train','fuel','run','recovery'].map(t => ({ id: `c-${t}`, ..._arc('coach', t, 0) }));

function ThemeIcon({ mode }) {
  return mode === 'dark'
    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
}

export default function FeaturesPage() {
  const ref = useRef(null);
  const [theme, setTheme] = useState(getInitialSiteTheme);
  const [view, setView] = useState('everything');
  const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Pause control (WCAG 2.2.2) — the only loop here is the diagram flow; render it static when engaged.
  const [motionOff, setMotionOff] = useState(() => { try { return localStorage.getItem('cm-reduce-motion') === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('cm-reduce-motion', motionOff ? '1' : '0'); } catch {} }, [motionOff]);
  const noMotion = reduce || motionOff;

  useEffect(() => {
    applyLandingTheme(ref.current, theme);
    try { localStorage.setItem('cm-site-theme', theme); } catch {}
    try { document.body.style.background = theme === 'light' ? '#FFFFFF' : '#000000'; } catch {}
  }, [theme]);

  // Reveal — per-element, staggered within each category, fires once.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      root.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('in'));
      return;
    }
    root.classList.add('rev-armed');
    // stagger delay by index within each reveal group
    root.querySelectorAll('[data-reveal-group]').forEach(group => {
      [...group.querySelectorAll('[data-reveal]')].forEach((el, i) => el.style.setProperty('--rev-delay', (i * 45) + 'ms'));
    });
    const io = new IntersectionObserver((entries, ob) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); } });
    }, { threshold: 0.12 });
    root.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [view]);

  const go = (path) => { window.location.href = path; };

  return (
    <div className="fp" data-theme={theme} ref={ref}>
      <style>{FP_CSS}</style>

      <nav className="fp-nav">
        <button className="fp-logo" onClick={() => go('/')}>
          <img src="/coach-macro-logo.png" alt="Coach Macro"/>
          <span><span className="coach">Coach</span> Macro</span>
        </button>
        <div className="fp-nav-right">
          <a className="fp-nav-link" href="/">← Home</a>
          <button className="fp-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'}>
            <ThemeIcon mode={theme}/>{theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <a className="fp-nav-cta" href="/#pricing">Start Free Trial</a>
        </div>
      </nav>

      <header className="fp-head">
        <div className="fp-eyebrow">Everything it does</div>
        <h1 className="fp-title">Every feature,<br/><span className="accent">in one place.</span></h1>
        <p className="fp-sub">The full picture — training, fuel, running, recovery, and the coach that ties them together. One system, working as one.</p>
      </header>

      <div className="fp-toggle-wrap">
        <div className="fp-toggle" role="group" aria-label="Feature views">
          <button className={view === 'everything' ? 'on' : ''} aria-pressed={view === 'everything'} onClick={() => setView('everything')}>Everything</button>
          <button className={view === 'connects' ? 'on' : ''} aria-pressed={view === 'connects'} onClick={() => setView('connects')}>How it connects</button>
        </div>
      </div>

      {view === 'everything' ? (
        <main className="fp-body">
          {CATEGORIES.map(cat => (
            <section className="fp-cat" key={cat.label} data-reveal-group>
              <div className="fp-cat-head" data-reveal>
                <h2 className="fp-cat-label">{cat.label}</h2>
                <div className="fp-cat-tag">{cat.tag}</div>
              </div>
              <div className="fp-list">
                {cat.items.map((it, i) => (
                  <div className="fp-item" key={i} data-reveal><span>{it}</span></div>
                ))}
              </div>
            </section>
          ))}
        </main>
      ) : (
        <main className="fp-body">
          <p className="fp-connect-intro">Five systems. One conversation. Each part informs the others — so the plan you get already accounts for everything at once, instead of one thing at a time.</p>
          <div className="fp-diagram-wrap">
            <div className={"fp-diagram " + (noMotion ? "static" : "animate")} role="img" aria-label="Ring diagram: Coach Macro's five systems — Train, Fuel, Run, Recovery, and Coach — feed into each other. Described in the list below.">

              <svg viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <defs>
                  <marker id="ah-hero" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker>
                  <marker id="ah-mid" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker>
                </defs>
                {COACH_ARROWS.map(a => <path key={a.id} className="fp-arr-faint" d={a.d}/>)}
                {RING_ARROWS.map(a => (
                  <path key={a.id} id={a.id} className={"fp-arr " + a.tier} d={a.d} markerEnd={`url(#ah-${a.tier})`} strokeLinecap="round"/>
                ))}
                {!noMotion && RING_ARROWS.map(a => (
                  <circle key={"f-"+a.id} className={"fp-flow " + a.tier} r={a.tier === 'hero' ? 5 : 3.5} opacity="0">
                    <animateMotion dur="2.4s" begin={a.begin + "s"} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href={"#" + a.id}/></animateMotion>
                    <animate attributeName="opacity" dur="2.4s" begin={a.begin + "s"} repeatCount="indefinite" values="0;0.95;0.95;0" keyTimes="0;0.15;0.85;1"/>
                  </circle>
                ))}
                {RING_ARROWS.map(a => (
                  <text key={"l-"+a.id} className={"fp-arr-label " + (a.tier === 'hero' ? 'hero-l' : 'mid-l')} x={a.lx} y={a.ly} dominantBaseline="central">{a.label}</text>
                ))}
                <text className="fp-arr-label dim mid-l" x={CTR.coach[0]} y={CTR.coach[1] + 74} dominantBaseline="central">reads everything</text>
              </svg>
              {RING_NODES.map(n => (
                <div key={n.id} className={"fp-node" + (n.hero ? " hero-node" : "")} style={{ left: n.x + "%", top: n.y + "%" }}>
                  <div className="fp-node-label">{n.label}</div>
                  <div className="fp-node-sub">{n.sub}</div>
                </div>
              ))}
            </div>
            <div className="fp-sr-only">
              <h3>How the five systems connect</h3>
              <ul>
                <li>Your training adjusts your nutrition — a hard day earns you more food, and your food fuels the training.</li>
                <li>Your training and your running both add to your recovery load.</li>
                <li>Your recovery shapes your training and sets your run paces.</li>
                <li>The coach reads all of it and adapts to everything.</li>
              </ul>
            </div>
          </div>
          <p className="fp-connect-take"><strong>That's the whole point.</strong> Change one thing and the rest adjusts on its own — so you're never the one holding it all together in your head.</p>
        </main>
      )}

      <footer className="fp-footer">
        <div className="fp-footer-copy">© 2026 Coach Macro LLC. All rights reserved.</div>
        <button className="fp-motion-btn" onClick={() => setMotionOff(m => !m)} aria-pressed={motionOff}>{motionOff ? 'Motion: off' : 'Reduce motion'}</button>
        <div className="fp-footer-links">
          {[['Home','/'],['About','/about'],['FAQ','/faq'],['Privacy','/privacy'],['Terms','/terms'],['Support','/support']].map(([l,p]) => (
            <a key={p} href={p}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
