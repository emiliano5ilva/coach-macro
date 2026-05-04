import React, { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --navy: #0a0e1a;
    --navy-mid: #0f1628;
    --navy-light: #161e35;
    --navy-card: #111827;
    --red: #e8341c;
    --red-dim: #c42d18;
    --white: #f5f5f0;
    --white-dim: rgba(245,245,240,0.7);
    --white-faint: rgba(245,245,240,0.12);
    --white-border: rgba(245,245,240,0.08);
    --mono: 'DM Mono', monospace;
    --condensed: 'Barlow Condensed', sans-serif;
    --body: 'Barlow', sans-serif;
    --blue: #2979FF;
  }

  .lp * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { background: var(--navy); color: var(--white); font-family: var(--body); overflow-x: hidden; -webkit-font-smoothing: antialiased; }

  .lp-grid-texture {
    background-image: linear-gradient(rgba(245,245,240,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,245,240,0.025) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  /* NAV */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 64px;
    border-bottom: 1px solid var(--white-border);
    background: rgba(10,14,26,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .lp-nav-logo { font-family: var(--condensed); font-weight: 800; font-size: 22px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--white); text-decoration: none; }
  .lp-nav-logo span { color: var(--red); }
  .lp-nav-links { display: flex; align-items: center; gap: 8px; }
  .lp-nav-link { font-family: var(--body); font-size: 13px; font-weight: 500; letter-spacing: 0.04em; color: var(--white-dim); text-decoration: none; padding: 8px 16px; transition: color 0.2s; background: none; border: none; cursor: pointer; }
  .lp-nav-link:hover { color: var(--white); }
  .lp-nav-cta { font-family: var(--body); font-size: 13px; font-weight: 600; letter-spacing: 0.06em; color: var(--white); background: var(--red); border: none; cursor: pointer; padding: 10px 20px; transition: background 0.2s; white-space: nowrap; }
  .lp-nav-cta:hover { background: var(--red-dim); }

  /* HERO */
  .lp-hero { position: relative; min-height: 100vh; overflow: hidden; display: flex; align-items: flex-start; padding-bottom: 80px; }
  .lp-hero-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; opacity: 0.45; }
  .lp-hero-overlay { position: absolute; inset: 0; background: linear-gradient(105deg, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.88) 38%, rgba(10,14,26,0.35) 65%, rgba(10,14,26,0.15) 100%); }
  .lp-hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(245,245,240,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(245,245,240,0.018) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; }
  .lp-hero-content { position: relative; z-index: 2; max-width: 680px; padding: 0 48px; padding-top: 140px; }
  .lp-hero-eyebrow { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .lp-hero-eyebrow-dot { width: 6px; height: 6px; background: var(--red); border-radius: 50%; animation: lp-pulse 2s infinite; }
  @keyframes lp-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
  .lp-hero-eyebrow-text { font-family: var(--mono); font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--red); }
  .lp-hero-headline { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(56px, 6.4vw, 92px); line-height: 0.92; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); margin-bottom: 28px; }
  .lp-hero-headline em { font-style: normal; color: var(--red); position: relative; }
  .lp-hero-headline em::after { content: ''; position: absolute; inset: -10% -5%; background: radial-gradient(ellipse at center, rgba(232,52,28,0.35), transparent 70%); z-index: -1; filter: blur(20px); }
  .lp-hero-sub { font-family: var(--body); font-size: 18px; font-weight: 300; line-height: 1.6; color: var(--white-dim); max-width: 480px; margin-bottom: 44px; }
  .lp-hero-cta-group { display: flex; flex-direction: column; gap: 14px; align-items: flex-start; }
  .lp-hero-cta-btn { display: inline-flex; align-items: center; gap: 10px; font-family: var(--condensed); font-weight: 700; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--white); background: var(--red); border: none; cursor: pointer; padding: 16px 32px; transition: background 0.2s, transform 0.15s; }
  .lp-hero-cta-btn:hover { background: var(--red-dim); transform: translateX(2px); }
  .lp-hero-proof { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; color: rgba(245,245,240,0.4); text-transform: uppercase; }
  .lp-hero-proof span { color: rgba(245,245,240,0.55); }

  /* Floating metric cards */
  .lp-hero-metrics { position: absolute; right: 48px; bottom: 80px; z-index: 3; display: flex; flex-direction: column; gap: 12px; align-items: flex-end; }
  .lp-metric-card { display: flex; align-items: center; gap: 12px; background: rgba(15,22,40,0.85); border: 1px solid var(--white-border); backdrop-filter: blur(16px); padding: 12px 18px; animation: lp-float-in 0.6s ease both, lp-drift 5s ease-in-out infinite 1.6s; }
  .lp-metric-card:nth-child(1) { animation-delay: 0.8s, 1.6s; }
  .lp-metric-card:nth-child(2) { animation-delay: 1.1s, 2.1s; }
  .lp-metric-card:nth-child(3) { animation-delay: 1.4s, 2.6s; }
  @keyframes lp-float-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes lp-drift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
  .lp-metric-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .lp-metric-dot.green { background: #22c55e; box-shadow: 0 0 8px #22c55e88; }
  .lp-metric-dot.red { background: var(--red); box-shadow: 0 0 8px var(--red); }
  .lp-metric-dot.blue { background: #60a5fa; box-shadow: 0 0 8px #60a5fa88; }
  .lp-metric-text { font-family: var(--mono); font-size: 12px; color: var(--white); letter-spacing: 0.04em; }
  .lp-metric-text strong { font-weight: 500; }

  /* LIQUID GLASS */
  .lp-liquid-glass {
    position: relative;
    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
    border: 1px solid rgba(255,255,255,0.12);
    backdrop-filter: blur(20px) saturate(140%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.35);
  }
  .lp-liquid-glass::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.18), transparent 50%); opacity: 0; transition: opacity 0.3s; pointer-events: none; border-radius: inherit; }
  .lp-liquid-glass:hover::before { opacity: 1; }

  /* TILT BUTTONS */
  .lp-tilt { transform-style: preserve-3d; transition: transform 0.18s cubic-bezier(.2,.7,.3,1), background 0.2s; will-change: transform; position: relative; }
  .lp-tilt::after { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.25), transparent 45%); opacity: 0; transition: opacity 0.25s; pointer-events: none; mix-blend-mode: overlay; }
  .lp-tilt:hover::after { opacity: 1; }

  /* CURSOR GLOW */
  .lp-cursor-glow { position: fixed; top: 0; left: 0; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(232,52,28,0.16) 0%, transparent 60%); pointer-events: none; z-index: 1; transform: translate3d(-50%,-50%,0); transition: opacity 0.4s; mix-blend-mode: screen; filter: blur(20px); opacity: 0; }
  .lp.cursor-active .lp-cursor-glow { opacity: 1; }

  /* SECTION GLOBALS */
  .lp section { position: relative; }
  .lp-section-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--red); margin-bottom: 16px; text-align: center; }
  .lp-section-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(48px, 5vw, 76px); line-height: 0.95; text-transform: uppercase; text-align: center; margin-bottom: 80px; }

  /* PROBLEM */
  .lp-problem { background: var(--navy-mid); padding: 140px 0; overflow: hidden; }
  .lp-problem-inner { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 0 48px; }
  .lp-problem-block { margin-bottom: 80px; }
  .lp-problem-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--red); margin-bottom: 20px; }
  .lp-problem-headline { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(42px, 5.5vw, 80px); line-height: 0.95; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); }
  .lp-problem-headline.dim { color: rgba(245,245,240,0.35); }
  .lp-problem-divider { width: 60px; height: 2px; background: var(--red); margin: 60px 0; }
  .lp-problem-resolution { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(48px, 6vw, 90px); line-height: 0.95; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); }
  .lp-problem-resolution .accent { color: var(--red); }

  /* HOW */
  .lp-how { background: var(--navy); padding: 140px 48px; }
  .lp-how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; max-width: 1200px; margin: 0 auto; }
  .lp-how-card { background: var(--navy-light); padding: 48px 40px; position: relative; overflow: hidden; transition: transform 0.35s cubic-bezier(.2,.7,.3,1), background 0.3s; }
  .lp-how-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--white-border); transition: background 0.3s; }
  .lp-how-card:hover::before { background: var(--red); }
  .lp-how-card:hover { transform: translateY(-6px); background: linear-gradient(135deg, rgba(245,245,240,0.05), rgba(232,52,28,0.04)); }
  .lp-how-number { font-family: var(--condensed); font-weight: 900; font-size: 96px; line-height: 1; color: rgba(245,245,240,0.06); position: absolute; top: 24px; right: 32px; letter-spacing: -0.04em; }
  .lp-how-step { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red); margin-bottom: 24px; }
  .lp-how-card-title { font-family: var(--condensed); font-weight: 800; font-size: 28px; line-height: 1.1; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 20px; color: var(--white); }
  .lp-how-card-body { font-family: var(--body); font-size: 15px; font-weight: 300; line-height: 1.7; color: var(--white-dim); }
  .lp-how-card-body strong { color: var(--white); font-weight: 500; }

  /* COMPARE */
  .lp-compare { background: var(--navy-mid); padding: 140px 48px; overflow: hidden; }
  .lp-compare-inner { position: relative; z-index: 1; max-width: 960px; margin: 0 auto; }
  .lp-compare-table { width: 100%; border-collapse: collapse; margin-top: 60px; }
  .lp-compare-table th { font-family: var(--condensed); font-weight: 700; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; padding: 16px 24px; text-align: left; }
  .lp-compare-table th:first-child { color: var(--white-dim); width: 45%; }
  .lp-compare-table th.col-other { color: rgba(245,245,240,0.35); text-align: center; }
  .lp-compare-table th.col-cm { color: var(--white); text-align: center; background: rgba(232,52,28,0.08); border-top: 2px solid var(--red); }
  .lp-compare-table td { padding: 14px 24px; border-top: 1px solid var(--white-border); font-family: var(--body); font-size: 14px; font-weight: 400; }
  .lp-compare-table td:first-child { color: var(--white-dim); }
  .lp-compare-table td.col-other { text-align: center; color: rgba(245,245,240,0.3); font-size: 18px; }
  .lp-compare-table td.col-cm { text-align: center; background: rgba(232,52,28,0.05); font-size: 18px; }
  .lp-compare-table tr:hover td { background: rgba(245,245,240,0.02); }
  .lp-compare-table tr:hover td.col-cm { background: rgba(232,52,28,0.08); }
  .lp-check { color: var(--red); font-size: 16px; font-weight: 700; }
  .lp-cross { color: rgba(245,245,240,0.25); }

  /* SCREENS */
  .lp-screens { background: var(--navy); padding: 140px 0; overflow: hidden; }
  .lp-screens-scroll { display: flex; gap: 24px; padding: 0 48px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; cursor: grab; user-select: none; }
  .lp-screens-scroll::-webkit-scrollbar { display: none; }
  .lp-screen-card { flex-shrink: 0; width: 280px; background: var(--navy-light); border: 1px solid var(--white-border); overflow: hidden; transition: transform 0.3s, border-color 0.3s; }
  .lp-screen-card:hover { transform: translateY(-6px); border-color: rgba(245,245,240,0.18); }
  .lp-screen-header { padding: 14px 20px 10px; border-bottom: 1px solid var(--white-border); display: flex; align-items: center; justify-content: space-between; }
  .lp-screen-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--white-dim); }
  .lp-screen-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); }
  .lp-screen-body { padding: 24px 20px; min-height: 360px; }
  .lp-macro-ring-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
  .lp-macro-ring { position: relative; width: 120px; height: 120px; }
  .lp-macro-ring svg { transform: rotate(-90deg); }
  .lp-macro-ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .lp-macro-ring-cal { font-family: var(--condensed); font-weight: 800; font-size: 26px; line-height: 1; color: var(--white); }
  .lp-macro-ring-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; color: var(--white-dim); text-transform: uppercase; margin-top: 2px; }
  .lp-macro-bars { display: flex; flex-direction: column; gap: 10px; }
  .lp-macro-bar-row { display: flex; align-items: center; gap: 10px; }
  .lp-macro-bar-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; color: var(--white-dim); width: 18px; text-transform: uppercase; }
  .lp-macro-bar-track { flex: 1; height: 4px; background: rgba(245,245,240,0.08); border-radius: 2px; overflow: hidden; }
  .lp-macro-bar-fill { height: 100%; border-radius: 2px; }
  .lp-macro-bar-val { font-family: var(--mono); font-size: 10px; color: var(--white-dim); width: 40px; text-align: right; }
  .lp-muscle-map { display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; }
  .lp-muscle-figure { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .lp-muscle-figure-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; color: var(--white-dim); text-transform: uppercase; }
  .lp-muscle-legend { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .lp-muscle-legend-item { display: flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 9px; color: var(--white-dim); letter-spacing: 0.06em; text-transform: uppercase; }
  .lp-muscle-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .lp-session-active-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.25); padding: 5px 10px; margin-bottom: 16px; }
  .lp-session-active-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: lp-pulse 1.5s infinite; }
  .lp-session-active-text { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: #22c55e; }
  .lp-session-stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--white-border); }
  .lp-session-stat-label { font-family: var(--body); font-size: 13px; color: var(--white-dim); }
  .lp-session-stat-val { font-family: var(--mono); font-size: 13px; color: var(--white); font-weight: 500; }
  .lp-ai-message { background: rgba(245,245,240,0.05); border-left: 2px solid var(--red); padding: 12px 14px; margin-bottom: 12px; }
  .lp-ai-message-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--red); margin-bottom: 6px; }
  .lp-ai-message-text { font-family: var(--body); font-size: 13px; font-weight: 300; line-height: 1.5; color: var(--white); }
  .lp-food-item-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--white-border); }
  .lp-food-item-name { font-family: var(--body); font-size: 13px; color: var(--white); }
  .lp-food-item-macros { font-family: var(--mono); font-size: 10px; color: var(--white-dim); letter-spacing: 0.06em; }
  .lp-progress-chart { display: flex; align-items: flex-end; gap: 6px; height: 100px; margin-bottom: 16px; }
  .lp-progress-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .lp-progress-bar { width: 100%; border-radius: 2px 2px 0 0; }
  .lp-progress-bar-week { font-family: var(--mono); font-size: 8px; color: rgba(245,245,240,0.3); letter-spacing: 0.06em; }
  .lp-tdee-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
  .lp-tdee-label { font-family: var(--body); font-size: 12px; color: var(--white-dim); }
  .lp-tdee-val { font-family: var(--condensed); font-weight: 700; font-size: 22px; color: var(--white); }
  .lp-tdee-unit { font-family: var(--mono); font-size: 10px; color: var(--white-dim); margin-left: 4px; }

  /* PROOF */
  .lp-proof { background: var(--navy-light); padding: 100px 48px; }
  .lp-proof-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; max-width: 900px; margin: 0 auto 80px; }
  .lp-proof-stat { background: var(--navy-card); padding: 40px 36px; text-align: center; }
  .lp-proof-stat-num { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 72px; line-height: 1; color: var(--white); margin-bottom: 8px; }
  .lp-proof-stat-num span { color: var(--red); }
  .lp-proof-stat-label { font-family: var(--body); font-size: 14px; font-weight: 300; color: var(--white-dim); letter-spacing: 0.04em; }
  .lp-testimonials { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 1100px; margin: 0 auto; }
  .lp-testimonial { background: var(--navy-card); padding: 32px; border: 1px solid var(--white-border); position: relative; transition: transform 0.35s cubic-bezier(.2,.7,.3,1), border-color 0.3s; }
  .lp-testimonial:hover { transform: translateY(-4px); border-color: rgba(232,52,28,0.3); }
  .lp-testimonial::before { content: '"'; font-family: var(--condensed); font-size: 80px; font-weight: 900; color: rgba(232,52,28,0.15); position: absolute; top: 16px; left: 24px; line-height: 1; }
  .lp-testimonial-text { font-family: var(--body); font-size: 14px; font-weight: 400; line-height: 1.7; color: var(--white); margin-bottom: 20px; margin-top: 20px; position: relative; z-index: 1; }
  .lp-testimonial-name { font-family: var(--condensed); font-weight: 700; font-size: 15px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--white); }
  .lp-testimonial-role { font-family: var(--mono); font-size: 10px; color: var(--white-dim); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 3px; }

  /* URL BANNERS */
  .lp-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 300; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 13px 24px; font-family: var(--body); font-size: 13px; font-weight: 500; text-align: center; line-height: 1.4; }
  .lp-banner-success { background: rgba(34,197,94,0.14); border-bottom: 1px solid rgba(34,197,94,0.28); color: #22c55e; }
  .lp-banner-warning { background: rgba(245,158,11,0.14); border-bottom: 1px solid rgba(245,158,11,0.28); color: #f59e0b; }
  .lp-banner-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.55; font-size: 16px; line-height: 1; padding: 0; flex-shrink: 0; transition: opacity 0.15s; }
  .lp-banner-close:hover { opacity: 1; }
  .lp.has-banner .lp-nav { top: 48px; }

  /* WAITLIST */
  .lp-waitlist { background: var(--navy); padding: 140px 48px; position: relative; overflow: hidden; }
  .lp-waitlist-inner { max-width: 600px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
  .lp-waitlist-headline { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(80px, 10vw, 140px); line-height: 0.9; text-transform: uppercase; letter-spacing: -0.02em; color: var(--white); margin-bottom: 24px; }
  .lp-waitlist-sub { font-family: var(--body); font-size: 18px; font-weight: 300; line-height: 1.65; color: var(--white-dim); max-width: 460px; margin: 0 auto 28px; }
  .lp-waitlist-counter { display: inline-flex; align-items: center; gap: 8px; background: rgba(41,121,255,0.1); border: 1px solid rgba(41,121,255,0.2); padding: 8px 16px; margin-bottom: 40px; }
  .lp-waitlist-counter-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); animation: lp-pulse 2s infinite; }
  .lp-waitlist-counter-text { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--blue); }
  .lp-waitlist-form { display: flex; flex-direction: column; gap: 12px; max-width: 460px; margin: 0 auto 16px; }
  .lp-waitlist-input { background: rgba(245,245,240,0.05); border: 1px solid var(--white-border); padding: 15px 20px; font-family: var(--body); font-size: 15px; color: var(--white); outline: none; transition: border-color 0.2s; width: 100%; }
  .lp-waitlist-input::placeholder { color: rgba(245,245,240,0.3); }
  .lp-waitlist-input:focus { border-color: rgba(41,121,255,0.5); }
  .lp-waitlist-btn { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 56px; font-family: var(--condensed); font-weight: 700; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--white); background: var(--blue); border: none; cursor: pointer; transition: background 0.2s; width: 100%; }
  .lp-waitlist-btn:hover:not(:disabled) { background: #1565c0; }
  .lp-waitlist-btn:disabled { opacity: 0.65; cursor: not-allowed; }
  .lp-waitlist-error { font-family: var(--mono); font-size: 12px; color: var(--red); letter-spacing: 0.06em; }
  .lp-waitlist-disclaimer { font-family: var(--mono); font-size: 11px; color: rgba(245,245,240,0.3); letter-spacing: 0.1em; text-transform: uppercase; }
  .lp-waitlist-success { background: rgba(41,121,255,0.07); border: 1px solid rgba(41,121,255,0.2); padding: 44px 36px; text-align: center; max-width: 460px; margin: 0 auto; }
  .lp-waitlist-success-title { font-family: var(--condensed); font-weight: 800; font-size: 28px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--white); margin-bottom: 12px; }
  .lp-waitlist-success-text { font-family: var(--body); font-size: 15px; font-weight: 300; color: var(--white-dim); line-height: 1.7; margin: 0; }
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-waitlist-spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: lp-spin 0.7s linear infinite; }

  /* FAQ */
  .lp-faq { background: var(--navy-mid); padding: 140px 48px; }
  .lp-faq-list { max-width: 760px; margin: 0 auto; }
  .lp-faq-item { border-bottom: 1px solid var(--white-border); }
  .lp-faq-question { width: 100%; background: none; border: none; text-align: left; padding: 24px 0; display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 24px; }
  .lp-faq-question-text { font-family: var(--condensed); font-weight: 700; font-size: 20px; text-transform: uppercase; letter-spacing: 0.02em; color: var(--white); line-height: 1.2; }
  .lp-faq-icon { font-family: var(--mono); font-size: 20px; color: var(--red); flex-shrink: 0; transition: transform 0.2s; }
  .lp-faq-item.open .lp-faq-icon { transform: rotate(45deg); }
  .lp-faq-answer { font-family: var(--body); font-size: 15px; font-weight: 300; line-height: 1.75; color: var(--white-dim); max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding-bottom 0.35s ease; }
  .lp-faq-item.open .lp-faq-answer { max-height: 400px; padding-bottom: 24px; }

  /* FINAL CTA */
  .lp-final-cta { background: var(--navy-mid); padding: 160px 48px; text-align: center; position: relative; overflow: hidden; }
  .lp-final-cta-inner { position: relative; z-index: 1; }
  .lp-final-headline { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(80px, 10vw, 160px); line-height: 0.9; text-transform: uppercase; letter-spacing: -0.02em; color: var(--white); margin-bottom: 48px; }
  .lp-final-headline span { color: var(--red); display: block; }
  .lp-final-cta-btn { display: inline-flex; align-items: center; gap: 12px; font-family: var(--condensed); font-weight: 700; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--white); background: var(--red); border: none; cursor: pointer; padding: 20px 48px; transition: background 0.2s, transform 0.15s; }
  .lp-final-cta-btn:hover { background: var(--red-dim); transform: translateX(2px); }

  /* FOOTER */
  .lp-footer { background: var(--navy); border-top: 1px solid var(--white-border); padding: 48px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
  .lp-footer-logo { font-family: var(--condensed); font-weight: 800; font-size: 18px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--white-dim); }
  .lp-footer-logo span { color: var(--red); }
  .lp-footer-links { display: flex; gap: 24px; }
  .lp-footer-link { font-family: var(--mono); font-size: 11px; color: rgba(245,245,240,0.35); text-decoration: none; letter-spacing: 0.06em; text-transform: uppercase; transition: color 0.2s; background: none; border: none; cursor: pointer; }
  .lp-footer-link:hover { color: var(--white-dim); }
  .lp-footer-copy { font-family: var(--mono); font-size: 11px; color: rgba(245,245,240,0.25); letter-spacing: 0.06em; }

  /* SCROLL REVEAL */
  .lp .fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.7s ease, transform 0.7s ease; }
  .lp .fade-up.visible { opacity: 1; transform: translateY(0); }

  @media (max-width: 768px) {
    .lp-nav { padding: 0 20px; }
    .lp-nav-link { display: none; }
    .lp-hero-content { padding: 0 24px; padding-top: 100px; }
    .lp-hero-metrics { display: none !important; }
    .lp-how-grid { grid-template-columns: 1fr; }
    .lp-proof-stats { grid-template-columns: 1fr; }
    .lp-testimonials { grid-template-columns: 1fr; }
    .lp-waitlist { padding: 100px 24px; }
    .lp-footer { flex-direction: column; text-align: center; }
  }
`;

function useLiquidEffects(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const glow = container.querySelector('.lp-cursor-glow');
    let raf = null;
    let mx = 0, my = 0, gx = 0, gy = 0;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      container.classList.add('cursor-active');
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const loop = () => {
      gx += (mx - gx) * 0.15;
      gy += (my - gy) * 0.15;
      if (glow) glow.style.transform = `translate3d(${gx - 240}px, ${gy - 240}px, 0)`;
      if (Math.abs(mx - gx) > 0.5 || Math.abs(my - gy) > 0.5) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    };

    window.addEventListener('mousemove', onMove);

    const tiltEls = container.querySelectorAll('[data-tilt]');
    const tiltHandlers = [];
    tiltEls.forEach(el => {
      const enter = () => { el.style.transition = 'transform 0.15s cubic-bezier(.2,.7,.3,1)'; };
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const cx = r.width / 2, cy = r.height / 2;
        const rotY = ((x - cx) / cx) * 12;
        const rotX = -((y - cy) / cy) * 12;
        el.style.setProperty('--mx', ((x / r.width) * 100) + '%');
        el.style.setProperty('--my', ((y / r.height) * 100) + '%');
        el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px) scale(1.03)`;
        el.style.transition = 'transform 0.08s linear';
      };
      const leave = () => {
        el.style.transition = 'transform 0.4s cubic-bezier(.2,.7,.3,1)';
        el.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0) scale(1)';
      };
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      tiltHandlers.push({ el, enter, move, leave });
    });

    const glassEls = container.querySelectorAll('.lp-liquid-glass, .lp-how-card, .lp-testimonial, .lp-pricing-card, .lp-screen-card');
    const glassHandlers = [];
    glassEls.forEach(el => {
      const move = (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      };
      el.addEventListener('mousemove', move);
      glassHandlers.push({ el, move });
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      tiltHandlers.forEach(({ el, enter, move, leave }) => {
        el.removeEventListener('mouseenter', enter);
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
      glassHandlers.forEach(({ el, move }) => el.removeEventListener('mousemove', move));
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function useScrollReveal(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    container.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function MacroRingScreen() {
  const r = 48, cx = 60, cy = 60;
  const circ = 2 * Math.PI * r;
  const dash = 0.62 * circ;
  return (
    <div className="lp-macro-ring-wrap">
      <div className="lp-macro-ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(245,245,240,0.06)" strokeWidth="10"/>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8341c" strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="butt"/>
        </svg>
        <div className="lp-macro-ring-center">
          <div className="lp-macro-ring-cal">1,847</div>
          <div className="lp-macro-ring-label">kcal left</div>
        </div>
      </div>
    </div>
  );
}

function MuscleFigure({ label, front }) {
  const m = front
    ? { chest: '#e8341c', shoulders: '#e8341c88', quads: '#3b82f6', biceps: '#22c55e88', abs: 'rgba(245,245,240,0.1)' }
    : { glutes: '#e8341c88', hamstrings: '#3b82f6', traps: 'rgba(245,245,240,0.1)', lats: '#22c55e88', calves: 'rgba(245,245,240,0.1)' };
  return (
    <div className="lp-muscle-figure">
      <svg width="54" height="110" viewBox="0 0 54 110">
        <ellipse cx="27" cy="8" rx="8" ry="9" fill="rgba(245,245,240,0.12)"/>
        <rect x="23" y="16" width="8" height="6" fill="rgba(245,245,240,0.12)"/>
        {front ? (
          <>
            <rect x="14" y="22" width="26" height="28" rx="2" fill={m.chest}/>
            <rect x="16" y="50" width="10" height="16" rx="1" fill={m.abs}/>
            <rect x="28" y="50" width="10" height="16" rx="1" fill={m.abs}/>
          </>
        ) : (
          <>
            <rect x="14" y="22" width="26" height="28" rx="2" fill={m.lats}/>
            <rect x="14" y="22" width="26" height="10" rx="2" fill={m.traps}/>
          </>
        )}
        <rect x="4" y="22" width="9" height="24" rx="4" fill={front ? m.biceps : 'rgba(245,245,240,0.1)'}/>
        <rect x="41" y="22" width="9" height="24" rx="4" fill={front ? m.biceps : 'rgba(245,245,240,0.1)'}/>
        <ellipse cx="11" cy="24" rx="7" ry="6" fill={front ? m.shoulders : 'rgba(245,245,240,0.1)'}/>
        <ellipse cx="43" cy="24" rx="7" ry="6" fill={front ? m.shoulders : 'rgba(245,245,240,0.1)'}/>
        <rect x="14" y="66" width="26" height="10" rx="2" fill={front ? 'rgba(245,245,240,0.1)' : m.glutes}/>
        <rect x="13" y="74" width="12" height="28" rx="4" fill={front ? m.quads : m.hamstrings}/>
        <rect x="29" y="74" width="12" height="28" rx="4" fill={front ? m.quads : m.hamstrings}/>
        <rect x="14" y="99" width="10" height="10" rx="3" fill={front ? 'rgba(245,245,240,0.1)' : m.calves}/>
        <rect x="30" y="99" width="10" height="10" rx="3" fill={front ? 'rgba(245,245,240,0.1)' : m.calves}/>
      </svg>
      <div className="lp-muscle-figure-label">{label}</div>
    </div>
  );
}

function ScreenCard({ label, children }) {
  return (
    <div className="lp-screen-card">
      <div className="lp-screen-header">
        <span className="lp-screen-label">{label}</span>
        <div className="lp-screen-dot"></div>
      </div>
      <div className="lp-screen-body">{children}</div>
    </div>
  );
}

function ScreensSection() {
  const scrollRef = useRef(null);
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const d = dragRef.current;
    const onDown = e => { d.down = true; d.startX = e.pageX - el.offsetLeft; d.scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing'; };
    const onUp = () => { d.down = false; el.style.cursor = 'grab'; };
    const onMove = e => { if (!d.down) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = d.scrollLeft - (x - d.startX) * 1.5; };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    return () => { el.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); el.removeEventListener('mousemove', onMove); };
  }, []);

  return (
    <section className="lp-screens">
      <div className="lp-section-eyebrow" style={{paddingLeft:48, textAlign:'left'}}>{`// The Product`}</div>
      <h2 className="lp-section-title" style={{paddingLeft:48, textAlign:'left', marginBottom:40}}>REAL DATA.<br/>REAL DESIGN.</h2>
      <div className="lp-screens-scroll" ref={scrollRef}>
        <ScreenCard label="Fuel Dashboard">
          <MacroRingScreen/>
          <div className="lp-macro-bars">
            {[{label:'P',val:'182g',fill:'#e8341c',pct:72},{label:'C',val:'241g',fill:'#60a5fa',pct:55},{label:'F',val:'68g',fill:'#f59e0b',pct:80}].map(m=>(
              <div className="lp-macro-bar-row" key={m.label}>
                <span className="lp-macro-bar-label">{m.label}</span>
                <div className="lp-macro-bar-track"><div className="lp-macro-bar-fill" style={{width:`${m.pct}%`,background:m.fill}}/></div>
                <span className="lp-macro-bar-val">{m.val}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,padding:'12px 0',borderTop:'1px solid rgba(245,245,240,0.08)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'rgba(245,245,240,0.4)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Training Day Bonus</span>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'#22c55e',letterSpacing:'0.06em'}}>+312 kcal</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'rgba(245,245,240,0.4)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Today's goal</span>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--white)',letterSpacing:'0.06em'}}>2,847 kcal</span>
            </div>
          </div>
        </ScreenCard>

        <ScreenCard label="Train Today">
          <div style={{marginBottom:16}}>
            <div style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--red)',marginBottom:8}}>{`// Push Day · Week 6`}</div>
            <div style={{fontFamily:'var(--condensed)',fontWeight:800,fontSize:22,textTransform:'uppercase',color:'var(--white)',marginBottom:4}}>Upper Hypertrophy A</div>
            <div style={{fontFamily:'var(--body)',fontSize:12,color:'var(--white-dim)'}}>5 exercises · ~58 min · High volume</div>
          </div>
          <div className="lp-muscle-map">
            <MuscleFigure label="Front" front={true}/>
            <MuscleFigure label="Back" front={false}/>
          </div>
          <div className="lp-muscle-legend">
            <div className="lp-muscle-legend-item"><div className="lp-muscle-legend-dot" style={{background:'#e8341c'}}/> Primary</div>
            <div className="lp-muscle-legend-item"><div className="lp-muscle-legend-dot" style={{background:'#3b82f6'}}/> Secondary</div>
            <div className="lp-muscle-legend-item"><div className="lp-muscle-legend-dot" style={{background:'#22c55e88'}}/> Stabilizer</div>
          </div>
        </ScreenCard>

        <ScreenCard label="Active Session">
          <div className="lp-session-active-badge">
            <div className="lp-session-active-dot"/>
            <span className="lp-session-active-text">Session Live — 38:14</span>
          </div>
          <div style={{fontFamily:'var(--condensed)',fontWeight:800,fontSize:20,textTransform:'uppercase',color:'var(--white)',marginBottom:16}}>Bench Press</div>
          {[{label:'Set 3 of 4',val:'100kg × 8'},{label:'Last Set',val:'100kg × 9'},{label:'Volume Today',val:'3,240 kg'},{label:'Est. 1RM',val:'127 kg'},{label:'RPE Target',val:'8.0'},{label:'Kcal Burned',val:'284 kcal'}].map(s=>(
            <div className="lp-session-stat-row" key={s.label}>
              <span className="lp-session-stat-label">{s.label}</span>
              <span className="lp-session-stat-val">{s.val}</span>
            </div>
          ))}
        </ScreenCard>

        <ScreenCard label="Restaurant AI">
          <div className="lp-ai-message">
            <div className="lp-ai-message-label">{`// Coach Analysis`}</div>
            <div className="lp-ai-message-text">You're 44g of protein short. Order the grilled salmon — it's 42g. Skip the fries, get the side salad. Stays in budget.</div>
          </div>
          <div style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'0.14em',color:'rgba(245,245,240,0.35)',textTransform:'uppercase',marginBottom:10}}>Detected: Nobu Restaurant</div>
          {[{name:'Grilled Salmon',macros:'42P · 0C · 18F'},{name:'Edamame',macros:'11P · 8C · 5F'},{name:'Miso Soup',macros:'3P · 4C · 1F'},{name:'Side Salad',macros:'2P · 6C · 8F'}].map(f=>(
            <div className="lp-food-item-row" key={f.name}>
              <span className="lp-food-item-name">{f.name}</span>
              <span className="lp-food-item-macros">{f.macros}</span>
            </div>
          ))}
        </ScreenCard>

        <ScreenCard label="Progress">
          <div className="lp-tdee-row">
            <span className="lp-tdee-label">Current TDEE</span>
            <span><span className="lp-tdee-val">3,240</span><span className="lp-tdee-unit">kcal/day</span></span>
          </div>
          <div className="lp-progress-chart">
            {[{h:45,w:'W1',c:'rgba(232,52,28,0.4)'},{h:52,w:'W2',c:'rgba(232,52,28,0.5)'},{h:60,w:'W3',c:'rgba(232,52,28,0.6)'},{h:55,w:'W4',c:'rgba(232,52,28,0.55)'},{h:68,w:'W5',c:'rgba(232,52,28,0.7)'},{h:75,w:'W6',c:'rgba(232,52,28,0.8)'},{h:88,w:'W7',c:'#e8341c'}].map(b=>(
              <div className="lp-progress-bar-col" key={b.w}>
                <div className="lp-progress-bar" style={{height:`${b.h}%`,background:b.c}}/>
                <span className="lp-progress-bar-week">{b.w}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[{label:'Bodyweight',val:'+1.2kg'},{label:'Avg Training Volume',val:'+18%'},{label:'Adherence Score',val:'94%'}].map(s=>(
              <div key={s.label} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(245,245,240,0.06)'}}>
                <span style={{fontFamily:'var(--body)',fontSize:12,color:'var(--white-dim)'}}>{s.label}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:12,color:'#22c55e'}}>{s.val}</span>
              </div>
            ))}
          </div>
        </ScreenCard>

        <ScreenCard label="TDEE Breakdown">
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:'var(--mono)',fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--red)',marginBottom:8}}>{`// Today's Energy Balance`}</div>
          </div>
          {[{label:'Basal Metabolic Rate',val:'1,820 kcal',pct:56,c:'rgba(245,245,240,0.25)'},{label:'NEAT (daily activity)',val:'520 kcal',pct:16,c:'#60a5fa'},{label:'Workout (Push Day)',val:'632 kcal',pct:20,c:'#e8341c'},{label:'Thermic Effect of Food',val:'268 kcal',pct:8,c:'#f59e0b'}].map(r=>(
            <div key={r.label} style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontFamily:'var(--body)',fontSize:12,color:'var(--white-dim)'}}>{r.label}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--white)'}}>{r.val}</span>
              </div>
              <div style={{height:3,background:'rgba(245,245,240,0.06)',borderRadius:2}}>
                <div style={{height:'100%',width:`${r.pct}%`,background:r.c,borderRadius:2}}/>
              </div>
            </div>
          ))}
          <div style={{borderTop:'1px solid rgba(245,245,240,0.08)',paddingTop:14,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontFamily:'var(--condensed)',fontWeight:700,fontSize:16,textTransform:'uppercase',color:'var(--white)'}}>Total TDEE</span>
            <span style={{fontFamily:'var(--condensed)',fontWeight:800,fontSize:22,color:'#e8341c'}}>3,240 kcal</span>
          </div>
        </ScreenCard>
      </div>
      <div style={{padding:'24px 48px 0',color:'rgba(245,245,240,0.25)',fontFamily:'var(--mono)',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase'}}>
        ← Drag to explore →
      </div>
    </section>
  );
}

function WaitlistSection() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lp-waitlist" id="waitlist">
      <div className="lp-grid-texture" style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
      <div className="lp-waitlist-inner">
        {submitted ? (
          <div className="lp-waitlist-success">
            <div className="lp-waitlist-success-title">Check your inbox</div>
            <p className="lp-waitlist-success-text">
              Check your inbox — we just sent you a confirmation email
            </p>
          </div>
        ) : (
          <>
            <div className="lp-section-eyebrow fade-up">{`// Waitlist`}</div>
            <div className="lp-waitlist-headline fade-up">BE FIRST.</div>
            <p className="lp-waitlist-sub fade-up">Join the waitlist. Get 30 days free at launch. No credit card ever.</p>
            <div className="lp-waitlist-counter fade-up">
              <div className="lp-waitlist-counter-dot"/>
              <span className="lp-waitlist-counter-text">247 members already in line</span>
            </div>
            <form className="lp-waitlist-form fade-up" onSubmit={handleSubmit}>
              <input
                className="lp-waitlist-input"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
              <input
                className="lp-waitlist-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <button
                className="lp-waitlist-btn lp-tilt"
                data-tilt
                type="submit"
                disabled={loading}
              >
                {loading
                  ? <span className="lp-waitlist-spinner"/>
                  : 'Secure My Spot →'
                }
              </button>
              {error && <div className="lp-waitlist-error">{error}</div>}
            </form>
            <div className="lp-waitlist-disclaimer fade-up">Confirmation email sent instantly. No spam. Ever.</div>
          </>
        )}
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {q:'How is this different from just using MyFitnessPal and a workout app together?',a:"Those apps run in isolation. Coach Macro's intelligence sits in the connection — when you log a workout, your macros change automatically. When you're in a deficit, your training load adjusts. No manual re-entry. No guesswork. One system that knows the full picture."},
    {q:'Do I need to be advanced to use this?',a:"Not at all. Whether you're just starting your fitness journey or you've been training for years, Coach Macro adapts to where you are. The system handles the complex math behind the scenes — you just log your meals and workouts, and we do the rest."},
    {q:'How accurate is the metabolic rate calculation?',a:"We use 25 data inputs — body composition estimates, training history, activity patterns, and biometric data — to build a metabolic profile that is 8% more accurate than standard equations like Harris-Benedict or Mifflin-St Jeor. This compounds over time as the model learns your patterns."},
    {q:'What does "training day adjustment" actually mean?',a:"On a training day, your carbohydrate targets increase proportionally to session volume and intensity. After you log a completed workout, your remaining calorie and carb budgets update in real time. Rest days have a reduced carb and calorie target. It's automatic — you don't touch a setting."},
    {q:'Does it work for runners and endurance athletes, or just lifters?',a:"Both. The system handles volume-based endurance work the same way it handles resistance training — it calculates energy expenditure and adjusts macros accordingly. Hybrid athletes and Hyrox competitors are some of our most active users."},
    {q:'Can I connect my wearable or smartwatch?',a:"Garmin, Whoop, Apple Watch, and Polar integrations are in active development. For now, the app uses manual session logging and its own METs-based energy calculation."},
    {q:'What happens after the 7-day trial?',a:"You choose a plan or you stop. No charge, no dark patterns. If you want to continue, you select monthly or annual. If not, your account downgrades to read-only — your data stays, you just can't log new entries."},
    {q:'Is my data private?',a:"Your data is never sold. Never shared with third parties. We use it only to run your personalized model. You can export or delete everything at any time from within the app."},
  ];
  return (
    <section className="lp-faq" id="faq">
      <div className="lp-section-eyebrow">{`// FAQ`}</div>
      <h2 className="lp-section-title fade-up">GOT QUESTIONS.</h2>
      <div className="lp-faq-list">
        {faqs.map((f,i)=>(
          <div className={`lp-faq-item ${open===i?'open':''}`} key={i}>
            <button className="lp-faq-question" onClick={()=>setOpen(open===i?null:i)}>
              <span className="lp-faq-question-text">{f.q}</span>
              <span className="lp-faq-icon">+</span>
            </button>
            <div className="lp-faq-answer">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingPage({ onSignUp }) {
  const containerRef = useRef(null);
  useLiquidEffects(containerRef);
  useScrollReveal(containerRef);

  const [waitlistBanner, setWaitlistBanner] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const w = p.get('waitlist');
    if (w === 'confirmed') setWaitlistBanner('confirmed');
    else if (w === 'invalid') setWaitlistBanner('invalid');
  }, []);

  return (
    <div className={`lp${waitlistBanner ? ' has-banner' : ''}`} ref={containerRef}>
      <style>{CSS}</style>

      <div className="lp-cursor-glow"/>

      {waitlistBanner === 'confirmed' && (
        <div className="lp-banner lp-banner-success">
          <span>Your spot is secured. See you at launch.</span>
          <button className="lp-banner-close" onClick={() => setWaitlistBanner(null)}>✕</button>
        </div>
      )}
      {waitlistBanner === 'invalid' && (
        <div className="lp-banner lp-banner-warning">
          <span>That link has expired. Enter your email again.</span>
          <button className="lp-banner-close" onClick={() => setWaitlistBanner(null)}>✕</button>
        </div>
      )}

      {/* NAV */}
      <nav className="lp-nav">
        <span className="lp-nav-logo">Coach<span>Macro</span></span>
        <div className="lp-nav-links">
          <a href="#how" className="lp-nav-link">How It Works</a>
          <a href="#waitlist" className="lp-nav-link">Waitlist</a>
          <a href="#faq" className="lp-nav-link">FAQ</a>
          <button className="lp-nav-cta lp-tilt" data-tilt onClick={onSignUp}>Start Free Trial</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <video className="lp-hero-video" autoPlay muted loop playsInline preload="auto">
          <source src="/hero.mp4" type="video/mp4"/>
        </video>
        <div className="lp-hero-overlay"/>
        <div className="lp-hero-grid"/>
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">
            <div className="lp-hero-eyebrow-dot"/>
            <span className="lp-hero-eyebrow-text">The First Unified Athlete OS</span>
          </div>
          <h1 className="lp-hero-headline">
            YOUR FOOD AND<br/>
            YOUR TRAINING<br/>
            <em>FINALLY</em> TALK<br/>
            TO EACH OTHER.
          </h1>
          <p className="lp-hero-sub">
            Coach Macro is the only app where your workout changes your nutrition — and your nutrition changes your workout. Every day. Automatically.
          </p>
          <div className="lp-hero-cta-group">
            <button className="lp-hero-cta-btn lp-tilt" data-tilt onClick={onSignUp}>
              Start Free — 7 Day Trial <span style={{fontSize:20,transition:'transform 0.2s'}}>→</span>
            </button>
            <span className="lp-hero-proof">
              <span>Trusted by 400+ athletes</span> · Cancel anytime
            </span>
          </div>
        </div>
        <div className="lp-hero-metrics">
          <div className="lp-metric-card lp-liquid-glass">
            <div className="lp-metric-dot green"/>
            <span className="lp-metric-text"><strong>+312 kcal earned</strong> · Push Day active</span>
          </div>
          <div className="lp-metric-card lp-liquid-glass">
            <div className="lp-metric-dot red"/>
            <span className="lp-metric-text"><strong>847 kcal remaining</strong> · Adjusted for session</span>
          </div>
          <div className="lp-metric-card lp-liquid-glass">
            <div className="lp-metric-dot blue"/>
            <span className="lp-metric-text"><strong>Legs recovering</strong> · 36h to full output</span>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="lp-problem">
        <div className="lp-grid-texture" style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
        <div className="lp-problem-inner">
          <div className="lp-problem-block fade-up">
            <div className="lp-problem-label">{`// The Disconnect`}</div>
            <div className="lp-problem-headline">YOUR GARMIN KNOWS<br/>YOU SLEPT 5 HOURS.</div>
            <div className="lp-problem-headline dim">YOUR TRAINING APP<br/>DOESN'T.</div>
          </div>
          <div className="lp-problem-divider"/>
          <div className="lp-problem-block fade-up">
            <div className="lp-problem-headline">YOUR NUTRITION APP<br/>GIVES YOU 2,000 CALORIES.</div>
            <div className="lp-problem-headline dim">WHETHER YOU LIFTED<br/>OR NOT.</div>
          </div>
          <div className="lp-problem-divider"/>
          <div className="lp-problem-block fade-up">
            <div className="lp-problem-headline dim">NOBODY CONNECTED<br/>THE TWO.</div>
            <div className="lp-problem-resolution">UNTIL <span className="accent">NOW.</span></div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how" id="how">
        <div className="lp-section-eyebrow">{`// Three Steps`}</div>
        <h2 className="lp-section-title">THE SYSTEM</h2>
        <div className="lp-how-grid">
          {[
            {n:'01',step:'Step One',title:'Build Your Profile',body:<>Three minutes. 25 data points. We calculate your <strong>exact metabolic rate</strong> — 8% more accurate than standard equations. This is the foundation everything else builds on.</>},
            {n:'02',step:'Step Two',title:'App Adapts Daily',body:<>Training day? <strong>Carbs go up.</strong> Rest day? Budget drops. Just finished a workout? Calories adjust in real time. Your plan changes before you even log your first meal.</>},
            {n:'03',step:'Step Three',title:'Track Everything',body:<>Food. Lifts. Sets. PRs. Recovery. Progress. <strong>One place. One system.</strong> Finally. No more switching between apps that don't know the other exists.</>},
          ].map(card=>(
            <div className="lp-how-card fade-up" key={card.n}>
              <div className="lp-how-number">{card.n}</div>
              <div className="lp-how-step">{`// ${card.step}`}</div>
              <div className="lp-how-card-title">{card.title}</div>
              <p className="lp-how-card-body">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARE */}
      <section className="lp-compare">
        <div className="lp-grid-texture" style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
        <div className="lp-compare-inner">
          <div className="lp-section-eyebrow">{`// The Difference`}</div>
          <h2 className="lp-section-title fade-up">EVERY OTHER APP<br/>MISSES THIS.</h2>
          <table className="lp-compare-table">
            <thead>
              <tr>
                <th/>
                <th className="col-other">MyFitnessPal /<br/>Cronometer</th>
                <th className="col-other">Strong /<br/>Hevy</th>
                <th className="col-cm">CoachMacro</th>
              </tr>
            </thead>
            <tbody>
              {['Adapts macros to training day','Adjusts calories post-workout','Muscle recovery tracking','Unified food + lifting log','Real-time TDEE calculation','AI restaurant & food scan','Periodized training plans','RPE-based load adjustment','Sleep & recovery integration','Progress + body comp tracking'].map((f,i)=>(
                <tr key={i}>
                  <td>{f}</td>
                  <td className="col-other"><span className="lp-cross">✕</span></td>
                  <td className="col-other"><span className="lp-cross">✕</span></td>
                  <td className="col-cm"><span className="lp-check">✓</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SCREENS */}
      <ScreensSection/>

      {/* PROOF */}
      <section className="lp-proof">
        <div className="lp-section-eyebrow">{`// Athlete Results`}</div>
        <h2 className="lp-section-title fade-up">THE NUMBERS<br/>DON'T LIE.</h2>
        <div className="lp-proof-stats">
          {[{num:'40',suffix:'%',label:'Of athletes underfuel without realizing it'},{num:'2x',suffix:'',label:'Faster recovery when carbs match training load'},{num:'94',suffix:'%',label:'Report better performance in 30 days'}].map(s=>(
            <div className="lp-proof-stat fade-up" key={s.num}>
              <div className="lp-proof-stat-num">{s.num}<span>{s.suffix}</span></div>
              <div className="lp-proof-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="lp-testimonials">
          {[
            {text:"I've been using MyFitnessPal for 4 years. This is what MFP should have been the whole time. My macros actually match what I'm doing in the gym.",name:'Marcus T.',role:'Powerlifter · 4 years training'},
            {text:"Training for Hyrox. Calorie adjustment on hard run days vs strength days is the exact thing I needed. I'm not underfueling for the first time in two years.",name:'Jess L.',role:'Hyrox Athlete · 3x finisher'},
            {text:"The muscle recovery map made me realize I was training the same muscles three days in a row. My progress exploded once I actually programmed around recovery.",name:'Ryan K.',role:'Hybrid Athlete · 5 days/wk'},
          ].map(t=>(
            <div className="lp-testimonial fade-up" key={t.name}>
              <div className="lp-testimonial-text">{t.text}</div>
              <div>
                <div className="lp-testimonial-name">{t.name}</div>
                <div className="lp-testimonial-role">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WAITLIST */}
      <WaitlistSection/>

      {/* FAQ */}
      <FaqSection/>

      {/* FINAL CTA */}
      <section className="lp-final-cta">
        <div className="lp-grid-texture" style={{position:'absolute',inset:0,pointerEvents:'none'}}/>
        <div className="lp-final-cta-inner">
          <div className="lp-final-headline">
            STOP GUESSING.
            <span>START KNOWING.</span>
          </div>
          <button className="lp-final-cta-btn lp-tilt" data-tilt onClick={onSignUp}>
            Start Your Free Trial <span>→</span>
          </button>
          <div style={{marginTop:20,fontFamily:'var(--mono)',fontSize:11,color:'rgba(245,245,240,0.3)',letterSpacing:'0.1em',textTransform:'uppercase'}}>
            7 days free · Cancel anytime
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">Coach<span>Macro</span></div>
        <div className="lp-footer-links">
          <button className="lp-footer-link">Privacy</button>
          <button className="lp-footer-link">Terms</button>
          <button className="lp-footer-link">Contact</button>
        </div>
        <div className="lp-footer-copy">© 2026 CoachMacro · All rights reserved</div>
      </footer>
    </div>
  );
}
