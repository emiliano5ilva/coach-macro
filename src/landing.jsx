import React, { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    /* Non-color tokens (theme-independent). Type = ORIGINAL website face: Barlow Condensed (italic) + DM Mono numerals. */
    --condensed: 'Barlow Condensed', 'Inter', sans-serif;
    --body: 'Inter', sans-serif;
    --mono: 'DM Mono', monospace;
    --c-protein: #2979FF;
    --c-carbs: #00E676;
    --c-fat: #FFD740;
  }

  /* ── Landing theme tokens — DEFAULT = DARK (FOUC-safe). applyLandingTheme() overrides
     these on the .lp element per light/dark. Web-side mirror of themeService.js:86-95,
     deliberately NOT .goclub-coupled. Red accent (#FF3B30 = --cm-red) is CONSTANT across
     both themes — the toggle swaps bg/text/surface only. NO GREY TEXT: dim/faint aliases
     resolve to full-contrast ink/paper (hierarchy = size/weight/red, never grey). ── */
  .lp {
    --bg: #000000;
    --bg-rgb: 0,0,0;
    --bg-card: rgba(255,255,255,0.04);
    --lp-surface: #0E0E10;
    --white: #FFFFFF;
    --white-dim: #FFFFFF;
    --white-faint: #FFFFFF;
    --white-border: rgba(255,255,255,0.12);
    --lp-border: rgba(255,255,255,0.14);
    --red: #FF3B30;               /* bright — LARGE accents / borders / glows only */
    --red-text: #FF3B30;          /* small red TEXT — theme-aware (deep in light) for AA */
    --cm-accent-deep: #D13027;    /* deepened red — solid-button bg so white labels pass AA (5.0:1) */
    --red-glow: rgba(255,59,48,0.40);
    --red-border: rgba(255,59,48,0.35);
    --red-border-strong: rgba(255,59,48,0.60);
  }

  .lp * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { background: var(--bg); color: var(--white); font-family: var(--body); overflow-x: clip; -webkit-font-smoothing: antialiased; position: relative; }

  .lp-aurora { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .lp-aurora::before { content: ''; position: absolute; top: -40%; left: -20%; width: 80vw; height: 80vw; background: radial-gradient(ellipse at center, rgba(255,59,48,0.08), transparent 60%); animation: lp-aurora-drift 20s ease-in-out infinite; }
  .lp-aurora::after { content: ''; position: absolute; bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(ellipse at center, rgba(41,121,255,0.05), transparent 60%); animation: lp-aurora-drift 28s ease-in-out infinite reverse; }
  @keyframes lp-aurora-drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,2%) scale(1.04)} 66%{transform:translate(-2%,1%) scale(0.97)} }

  .lp-cursor-glow { position: fixed; top: 0; left: 0; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(255,59,48,0.12) 0%, transparent 60%); pointer-events: none; z-index: 1; transform: translate3d(-50%,-50%,0); transition: opacity 0.4s; mix-blend-mode: screen; filter: blur(20px); opacity: 0; }
  .lp.cursor-active .lp-cursor-glow { opacity: 1; }

  /* NAV */
  /* Pause control (WCAG 2.2.2) — kills all looping ambient motion when engaged */
  .lp.motion-off .lp-aurora::before, .lp.motion-off .lp-aurora::after, .lp.motion-off .lp-phone,
  .lp.motion-off .lp-float-pill, .lp.motion-off .lp-hero-eyebrow::before, .lp.motion-off .lp-cta-btn,
  .lp.motion-off .lp-price-btn:not(.ghost), .lp.motion-off .lp-wl-counter::before, .lp.motion-off .lp-spinner { animation: none !important; }
  .lp-motion-btn { background: none; border: 1px solid var(--white-border); color: var(--white); font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
  .lp-motion-btn:hover { border-color: var(--red); color: var(--red-text); }
  .lp-skip { position: fixed; top: -60px; left: 12px; z-index: 400; background: var(--cm-accent-deep); color: #fff; padding: 10px 16px; border-radius: 6px; font-family: var(--body); font-size: 14px; font-weight: 600; text-decoration: none; transition: top 0.2s; }
  .lp-skip:focus { top: 12px; }
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(var(--bg-rgb),0.82); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid var(--white-border); }
  .lp.has-banner .lp-nav { top: 48px; }
  .lp-logo { display: flex; align-items: center; gap: 12px; font-family: var(--condensed); font-weight: 800; font-size: 20px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--white); text-decoration: none; cursor: pointer; background: none; border: none; }
  .lp-logo-mark { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; display: block; box-shadow: 0 0 18px rgba(255,59,48,0.45), 0 0 2px rgba(255,59,48,0.6); }
  .lp-logo-text { display: flex; gap: 4px; align-items: baseline; }
  .lp-logo-coach { color: var(--white-dim); font-style: italic; font-weight: 400; }
  .lp-logo-macro { color: var(--white); font-weight: 800; }
  .lp-nav-links { display: flex; gap: 32px; align-items: center; }
  .lp-nav-link { color: var(--white); font-size: 13px; font-weight: 500; text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; background: none; border: none; cursor: pointer; font-family: var(--body); }
  .lp-nav-link:hover { color: var(--red-text); }
  .lp-nav-cta { font-family: var(--condensed); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red-text); background: transparent; border: 1px solid var(--red-text); padding: 9px 18px; border-radius: 4px; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
  .lp-nav-cta:hover { background: var(--cm-accent-deep); color: #fff; box-shadow: 0 0 30px var(--red-glow); }

  /* BANNERS */
  .lp-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 300; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 13px 24px; font-size: 13px; font-weight: 500; text-align: center; line-height: 1.4; font-family: var(--body); }
  .lp-banner-success { background: rgba(34,197,94,0.14); border-bottom: 1px solid rgba(34,197,94,0.28); color: #22c55e; }
  .lp-banner-warning { background: rgba(245,158,11,0.14); border-bottom: 1px solid rgba(245,158,11,0.28); color: #f59e0b; }
  .lp-banner-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.55; font-size: 16px; line-height: 1; padding: 0; flex-shrink: 0; transition: opacity 0.15s; }
  .lp-banner-close:hover { opacity: 1; }

  /* SECTION GLOBALS */
  .lp section { position: relative; z-index: 2; }
  .lp-section-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin-bottom: 16px; }
  .lp-section-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(48px, 6vw, 96px); line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-bottom: 64px; }
  .lp-section-title .accent { color: var(--red); }

  /* CTA BUTTON */
  .lp-cta-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--cm-accent-deep); color: #fff; font-family: var(--condensed); font-weight: 700; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; padding: 16px 28px; border-radius: 6px; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.3s; box-shadow: 0 0 30px var(--red-glow), 0 12px 40px rgba(0,0,0,0.6); position: relative; }
  .lp-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--red-glow), 0 16px 50px rgba(0,0,0,0.8); }
  .lp-cta-btn .arrow { transition: transform 0.2s; }
  .lp-cta-btn:hover .arrow { transform: translateX(4px); }

  /* HERO */
  .lp-hero { min-height: 100vh; padding: 120px 48px 80px; display: grid; grid-template-columns: minmax(0,1.2fr) minmax(0,1fr); gap: 80px; align-items: center; position: relative; max-width: 1400px; margin: 0 auto; z-index: 2; }
  .lp-hero-content { position: relative; z-index: 2; min-width: 0; }
  .lp-hero-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
  .lp-hero-eyebrow::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--red); box-shadow: 0 0 12px var(--red); animation: lp-pulse 2s infinite; flex-shrink: 0; }
  @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
  .lp-hero-headline { font-family: var(--condensed); font-weight: 900; font-style: italic; font-size: clamp(48px,4.8vw,80px); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-bottom: 32px; }
  .lp-hero-headline .red { color: var(--red); position: relative; }
  .lp-hero-headline .red::after { content: ''; position: absolute; inset: -10% -8%; background: radial-gradient(ellipse at center,rgba(255,59,48,0.4),transparent 70%); z-index: -1; filter: blur(24px); }
  .lp-hero-sub { font-family: var(--body); font-size: 18px; line-height: 1.55; color: var(--white-dim); margin-bottom: 36px; max-width: 540px; }
  .lp-hero-sub strong { color: var(--white); font-weight: 600; }
  .lp-hero-cta-group { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .lp-hero-proof { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; color: var(--white-faint); text-transform: uppercase; }
  .lp-hero-proof strong { color: var(--white); font-weight: 500; }

  /* PHONE */
  .lp-phone-wrap { position: relative; display: flex; justify-content: center; align-items: center; z-index: 2; }
  .lp-phone { position: relative; width: 340px; height: 736px; border-radius: 48px; background: #0a0e1a; overflow: hidden; box-shadow: 0 0 0 10px #1a1a1f, 0 0 0 11px #2a2a30, 0 0 80px rgba(255,59,48,0.22), 0 40px 80px rgba(0,0,0,0.9); animation: lp-float 6s ease-in-out infinite; }
  .lp-phone-shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; z-index: 1; }
  @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .lp-phone-notch { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 110px; height: 30px; background: #000; border-radius: 16px; z-index: 50; }
  .lp-phone-statusbar { position: absolute; top: 0; left: 0; right: 0; height: 48px; z-index: 40; display: flex; align-items: center; justify-content: space-between; padding: 16px 28px 0; font-family: -apple-system,sans-serif; font-weight: 600; font-size: 13px; color: var(--white); }
  .lp-phone-home { position: absolute; bottom: 7px; left: 50%; transform: translateX(-50%); width: 116px; height: 4px; background: rgba(245,245,240,0.85); border-radius: 3px; z-index: 60; }
  .lp-phone-screen { position: absolute; inset: 0; padding: 48px 0 26px; overflow: hidden; background-image: radial-gradient(ellipse at 30% 0%,rgba(255,59,48,0.06),transparent 50%); }
  .lp-float-pill { position: absolute; background: rgba(255,255,255,0.04); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--red-border); border-radius: 999px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1),0 0 30px rgba(255,59,48,0.08),0 12px 40px rgba(0,0,0,0.6); font-family: var(--mono); font-size: 11px; color: var(--white); white-space: nowrap; z-index: 3; animation: lp-drift 5s ease-in-out infinite; }
  .lp-float-pill strong { color: var(--white); font-weight: 600; }
  @keyframes lp-drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .lp-float-pill .dot { width: 7px; height: 7px; border-radius: 50%; box-shadow: 0 0 10px currentColor; }
  .lp-float-pill.tl { top: 12%; left: -4%; animation-delay: 0s; }
  .lp-float-pill.tr { top: 18%; right: -2%; animation-delay: 1.5s; }
  .lp-float-pill.bl { bottom: 22%; left: -6%; animation-delay: 3s; }

  /* PHONE DASHBOARD */
  .dash-header { padding: 12px 18px 8px; display: flex; align-items: flex-end; justify-content: space-between; }
  .dash-eyebrow { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; color: var(--red); text-transform: uppercase; margin-bottom: 4px; }
  .dash-h1 { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 28px; line-height: 1; color: var(--white); text-transform: uppercase; letter-spacing: -0.01em; }
  .dash-icon-btn { width: 30px; height: 30px; border-radius: 50%; background: rgba(245,245,240,0.06); border: 1px solid rgba(245,245,240,0.08); display: flex; align-items: center; justify-content: center; color: var(--white); }
  .dash-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#FF3B30,#f59e0b); display: flex; align-items: center; justify-content: center; font-family: var(--condensed); font-weight: 800; font-size: 12px; color: var(--white); }
  .dash-quote { margin: 6px 18px 14px; background: rgba(245,245,240,0.03); border-radius: 14px; padding: 12px 14px; border-left: 2px solid var(--red); }
  .dash-quote-l { font-family: var(--mono); font-size: 8px; letter-spacing: 0.16em; color: var(--red); text-transform: uppercase; margin-bottom: 4px; }
  .dash-quote-t { font-family: var(--body); font-size: 11px; line-height: 1.45; color: var(--white); }
  .dash-session { margin: 0 18px 12px; padding: 14px; border-radius: 16px; background: linear-gradient(135deg,rgba(255,59,48,0.16),rgba(15,22,40,0.6)); border: 1px solid rgba(255,59,48,0.28); position: relative; overflow: hidden; }
  .dash-session::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: radial-gradient(circle,rgba(255,59,48,0.18),transparent 65%); pointer-events: none; }
  .dash-session-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; position: relative; z-index: 1; }
  .dash-session-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 22px; line-height: 0.95; color: var(--white); text-transform: uppercase; }
  .dash-session-tag { padding: 3px 7px; background: rgba(34,197,94,0.18); border-radius: 5px; font-family: var(--mono); font-size: 8px; letter-spacing: 0.12em; color: #22c55e; text-transform: uppercase; flex-shrink: 0; }
  .dash-session-stats { display: flex; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid rgba(245,245,240,0.06); margin-bottom: 12px; position: relative; z-index: 1; }
  .dash-session-stats > div { flex: 1; }
  .dash-stat-l { font-family: var(--mono); font-size: 8px; letter-spacing: 0.1em; color: rgba(245,245,240,0.6); text-transform: uppercase; margin-bottom: 3px; }
  .dash-stat-v { font-family: var(--condensed); font-weight: 800; font-size: 16px; color: var(--white); line-height: 1; }
  .dash-start-btn { width: 100%; background: var(--red); color: var(--white); border: none; border-radius: 10px; padding: 10px; font-family: var(--condensed); font-weight: 700; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; justify-content: center; gap: 6px; position: relative; z-index: 1; cursor: pointer; }
  .dash-rings { margin: 0 18px 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .dash-ring-card { padding: 12px 10px; border-radius: 14px; background: rgba(245,245,240,0.03); border: 1px solid rgba(245,245,240,0.06); }
  .dash-ring-l { font-family: var(--mono); font-size: 8px; letter-spacing: 0.14em; color: rgba(245,245,240,0.55); text-transform: uppercase; margin-bottom: 8px; text-align: center; }
  .dash-ring-wrap { position: relative; width: 76px; height: 76px; margin: 0 auto 8px; }
  .dash-ring-num { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 18px; line-height: 1; color: var(--white); }
  .dash-ring-sub { font-family: var(--mono); font-size: 7px; letter-spacing: 0.1em; color: rgba(245,245,240,0.55); text-transform: uppercase; margin-top: 2px; }
  .dash-ring-foot { font-family: var(--mono); font-size: 9px; text-align: center; letter-spacing: 0.06em; }
  .dash-week { margin: 0 18px; display: flex; gap: 4px; }
  .dash-week-day { flex: 1; padding: 7px 2px; border-radius: 7px; text-align: center; border: 1px solid; }
  .dash-week-d { font-family: var(--mono); font-size: 8px; letter-spacing: 0.06em; color: rgba(245,245,240,0.5); margin-bottom: 3px; }
  .dash-week-l { font-family: var(--condensed); font-weight: 800; font-size: 8px; letter-spacing: 0.06em; }

  /* PROBLEM */
  .lp-problem { padding: 160px 48px; border-top: 1px solid var(--white-border); border-bottom: 1px solid var(--white-border); }
  .lp-problem-grid { display: flex; flex-direction: column; gap: 80px; max-width: 1100px; margin: 0 auto; }
  .lp-problem-block { text-align: center; }
  .lp-problem-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; color: var(--red-text); text-transform: uppercase; margin-bottom: 24px; }
  .lp-problem-text { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(44px,5.4vw,86px); line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); }
  .lp-problem-text.dim { color: var(--white-faint); }
  .lp-problem-resolution { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(56px,7vw,110px); line-height: 0.9; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-top: 24px; }
  .lp-problem-resolution .red { color: var(--red); text-shadow: 0 0 40px rgba(255,59,48,0.6); }
  .lp-problem-lead { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(40px,5.6vw,88px); line-height: 0.93; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); }
  .lp-problem-lead .red { color: var(--red); text-shadow: 0 0 40px rgba(255,59,48,0.5); }
  .lp-problem-body { font-family: var(--body); font-size: 18px; line-height: 1.65; color: var(--white); max-width: 620px; margin-top: 26px; }
  .lp-lede { font-family: var(--body); font-size: 18px; line-height: 1.6; color: var(--white); max-width: 640px; margin: -40px 0 0; }
  .lp-problem-divider { width: 1px; height: 60px; background: var(--red-border-strong); margin: 0 auto; }

  /* BENTO */
  .lp-bento { padding: 140px 48px; }
  .lp-bento-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; max-width: 1280px; margin: 0 auto; }
  .lp-tile { background: var(--bg-card); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 24px; padding: 32px; position: relative; overflow: hidden; transition: transform 0.4s cubic-bezier(.2,.7,.3,1),border-color 0.3s,box-shadow 0.3s; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(255,59,48,0.04); display: flex; flex-direction: column; }
  .lp-tile:hover { border-color: var(--red-border-strong); transform: translateY(-4px); box-shadow: 0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(255,59,48,0.12); }
  .lp-tile::before { content: ''; position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle,rgba(255,59,48,0.08),transparent 70%); pointer-events: none; }
  .lp-tile.span2 { grid-column: span 2; }
  .lp-tile.span3 { grid-column: span 3; }
  .lp-tile-eye { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red); margin-bottom: 14px; }
  .lp-tile-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 32px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: var(--white); margin-bottom: 12px; }
  .lp-tile.span2 .lp-tile-title, .lp-tile.span3 .lp-tile-title { font-size: 40px; }
  .lp-tile-body { color: var(--white-dim); font-size: 14px; line-height: 1.55; }
  .lp-tile-stat { font-family: var(--mono); font-size: 11px; color: var(--white); letter-spacing: 0.04em; margin-top: auto; padding-top: 20px; border-top: 1px solid var(--white-border); }
  .lp-tile-bignum { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 120px; line-height: 0.9; letter-spacing: -0.04em; color: var(--red); text-shadow: 0 0 40px rgba(255,59,48,0.5); margin: 24px 0 8px; }
  .lp-ring-wrap { display: flex; align-items: center; gap: 32px; margin: 24px 0; }
  .lp-ring { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
  .lp-ring-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 78px; height: 78px; border-radius: 50%; background: radial-gradient(circle,#050505 60%,rgba(5,5,5,0.85) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2; }
  .lp-ring-cal { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 26px; line-height: 1; color: var(--white); }
  .lp-ring-of { font-family: var(--mono); font-size: 8px; letter-spacing: 0.08em; color: var(--white-dim); margin-top: 4px; text-transform: uppercase; text-align: center; white-space: nowrap; }
  .lp-ring-legend { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .lp-leg-row { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 11px; }
  .lp-leg-dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
  .lp-ai-msg { font-family: var(--mono); font-size: 11px; color: var(--white); background: rgba(255,59,48,0.06); border: 1px solid var(--red-border); border-radius: 8px; padding: 10px 12px; margin: 16px 0 10px; line-height: 1.5; }
  .lp-ai-msg-l { color: var(--red-text); letter-spacing: 0.16em; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
  .lp-overload-card { display: flex; align-items: center; gap: 14px; margin: 20px 0 8px; padding: 14px; background: rgba(0,230,118,0.04); border: 1px solid rgba(0,230,118,0.15); border-radius: 12px; }
  .lp-overload-arr { width: 36px; height: 36px; border-radius: 9px; background: rgba(0,230,118,0.12); color: var(--c-carbs); display: flex; align-items: center; justify-content: center; font-size: 22px; text-shadow: 0 0 10px rgba(0,230,118,0.6); }
  .lp-overload-name { font-family: var(--condensed); font-weight: 800; font-size: 16px; text-transform: uppercase; color: var(--white); line-height: 1; margin-bottom: 4px; }
  .lp-overload-delta { font-family: var(--mono); font-size: 11px; color: var(--c-carbs); text-shadow: 0 0 10px rgba(0,230,118,0.4); }
  .lp-split-content { display: grid; grid-template-columns: 1fr auto 1fr; gap: 32px; align-items: center; margin-top: 28px; }
  .lp-split-div { width: 1px; height: 100%; min-height: 200px; background: linear-gradient(180deg,transparent,var(--red),transparent); box-shadow: 0 0 20px var(--red); }
  .lp-split-half { display: flex; flex-direction: column; gap: 12px; }
  .lp-split-lbl { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--white-dim); margin-bottom: 4px; }
  .lp-split-hl { font-family: var(--condensed); font-weight: 800; font-style: italic; font-size: 24px; text-transform: uppercase; color: var(--white); line-height: 1; }
  .lp-split-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--white-border); font-family: var(--mono); font-size: 12px; }
  .lp-split-row .l { color: var(--white-dim); }
  .lp-split-row .v { color: var(--white); }

  /* HOW */
  .lp-how { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; max-width: 1280px; margin: 0 auto; }
  .lp-how-card { background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 24px; padding: 40px 32px; position: relative; overflow: hidden; transition: transform 0.4s cubic-bezier(.2,.7,.3,1),border-color 0.3s,box-shadow 0.3s; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(255,59,48,0.04); }
  .lp-how-card:hover { transform: translateY(-4px); border-color: var(--red-border-strong); box-shadow: 0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(255,59,48,0.12); }
  .lp-how-num { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 88px; line-height: 0.9; color: var(--red); letter-spacing: -0.04em; margin-bottom: 24px; text-shadow: 0 0 30px rgba(255,59,48,0.4); }
  .lp-how-step { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; color: var(--red-text); text-transform: uppercase; margin-bottom: 12px; }
  .lp-how-title { font-family: var(--condensed); font-weight: 800; font-size: 26px; line-height: 1.05; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); margin-bottom: 14px; }
  .lp-how-body { color: var(--white-dim); font-size: 14px; line-height: 1.6; }
  .lp-how-body strong { color: var(--white); font-weight: 600; }

  /* COMPARE */
  .lp-compare { padding: 140px 48px; }
  .lp-compare-inner { max-width: 1100px; margin: 0 auto; }
  .lp-compare-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid rgba(255,59,48,0.2); border-radius: 16px; overflow: hidden; background: var(--bg); }
  .lp-compare-table th,.lp-compare-table td { padding: 18px 20px; text-align: left; border-bottom: 1px solid var(--white-border); font-size: 14px; }
  .lp-compare-table tr:last-child td { border-bottom: none; }
  .lp-compare-table th { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; background: var(--lp-surface); border-bottom: 1px solid rgba(255,59,48,0.2); }
  .lp-compare-table th.col-other { color: var(--white-dim); text-align: center; width: 17%; }
  .lp-compare-table th.col-cm { background: var(--bg); color: var(--red); font-weight: 700; text-align: center; width: 17%; text-shadow: 0 0 10px rgba(255,59,48,0.4); }
  .lp-compare-table td { color: var(--white); font-family: var(--body); font-size: 13px; }
  .lp-compare-table td.col-other { text-align: center; background: var(--lp-surface); color: var(--white); }
  .lp-compare-table td.col-cm { text-align: center; }
  .lp-compare-note { text-align: center; margin-top: 24px; font-family: var(--mono); font-size: 10px; color: var(--white-faint); letter-spacing: 0.08em; text-transform: uppercase; }
  .lp-cross { color: var(--white); opacity: 0.55; font-size: 16px; }
  .lp-check { color: var(--red); font-size: 18px; font-weight: 700; text-shadow: 0 0 10px var(--red-glow); }

  /* SCREENS */
  .lp-screens { padding: 140px 0 140px 48px; }
  .lp-screens-head { padding-right: 48px; margin-bottom: 32px; }
  .lp-featured { margin: 0 48px 48px 0; background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 24px; padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(255,59,48,0.06); position: relative; overflow: hidden; max-width: 1200px; }
  .lp-featured::before { content: ''; position: absolute; top: 0; right: 0; width: 400px; height: 400px; background: radial-gradient(circle,rgba(255,59,48,0.1),transparent 70%); pointer-events: none; }
  .lp-feat-eye { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; color: var(--red-text); text-transform: uppercase; margin-bottom: 12px; }
  .lp-feat-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 44px; line-height: 1; text-transform: uppercase; letter-spacing: -0.02em; color: var(--white); margin-bottom: 16px; }
  .lp-feat-body { color: var(--white-dim); font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
  .lp-scroll { display: flex; gap: 24px; overflow-x: auto; padding: 24px 0 32px; cursor: grab; scrollbar-width: none; }
  .lp-scroll::-webkit-scrollbar { display: none; }
  .lp-sphone { flex-shrink: 0; width: 300px; height: 620px; background: #0a0e1a; border-radius: 44px; overflow: hidden; position: relative; box-shadow: 0 0 0 9px #1a1a1f,0 0 0 10px #2a2a30,0 0 60px rgba(255,59,48,0.16),0 30px 60px rgba(0,0,0,0.9); user-select: none; }
  .lp-sphone-notch { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); width: 96px; height: 26px; background: #000; border-radius: 14px; z-index: 50; }
  .lp-sphone-bar { position: absolute; top: 0; left: 0; right: 0; height: 42px; z-index: 40; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px 0; font-family: -apple-system,sans-serif; font-weight: 600; font-size: 12px; color: var(--white); }
  .lp-sphone-home { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 100px; height: 4px; background: rgba(245,245,240,0.85); border-radius: 3px; z-index: 60; }
  .lp-sphone-body { padding: 42px 0 22px; height: 100%; overflow: hidden; background-image: radial-gradient(ellipse at 30% 0%,rgba(255,59,48,0.05),transparent 50%); }
  .lp-sphone-shot { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; z-index: 1; }
  .lp-feat-shot-wrap { display: flex; justify-content: center; }
  .lp-feat-shot-wrap .lp-sphone { width: 264px; height: 546px; }
  /* ── Restaurant AI showcase — angled-phone scroll reveal (big + readable) ──── */
  .lp-ra-showcase { margin: 0 48px 40px 0; }
  .lp-ra-copy { max-width: 600px; margin: 0 auto 36px; text-align: center; }
  .lp-ra-copy .lp-feat-title { font-size: clamp(30px,4vw,48px); }
  .lp-ra-copy .lp-feat-body { color: var(--white); margin-bottom: 0; }
  .lp-ra-msg { max-width: 460px; margin: 18px auto 0; text-align: left; }
  .lp-ra-stage { perspective: 1500px; display: flex; justify-content: center; padding: 30px 0 10px; }
  .lp-ra-phone { position: relative; width: 400px; height: 866px; border-radius: 56px; overflow: hidden; background: #0a0e1a; box-shadow: 0 0 0 11px #14141a, 0 0 0 12px #2a2a30, 0 40px 90px rgba(0,0,0,0.55), 0 0 110px rgba(255,59,48,0.14); transform-origin: center center; transform: perspective(1500px); will-change: transform; backface-visibility: hidden; transition: transform 0.12s cubic-bezier(0.33,1,0.68,1); }
  .lp-ra-phone img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .lp-ra-notch { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); width: 128px; height: 34px; background: #000; border-radius: 18px; z-index: 5; }
  .lp.motion-off .lp-ra-phone { transform: none !important; transition: none; }
  @media (max-width: 760px) {
    .lp-ra-showcase { margin: 0 0 28px; }
    .lp-ra-stage { perspective: none; padding: 18px 0 0; }
    .lp-ra-phone { width: 280px; height: 606px; border-radius: 42px; transform: none; box-shadow: 0 0 0 8px #14141a, 0 0 0 9px #2a2a30, 0 24px 60px rgba(0,0,0,0.55), 0 0 70px rgba(255,59,48,0.14); }
    .lp-ra-notch { width: 92px; height: 24px; top: 10px; }
  }
  .lp-pscr-head { padding: 12px 18px 8px; display: flex; align-items: flex-end; justify-content: space-between; }
  .lp-pscr-eye { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; color: var(--red); text-transform: uppercase; margin-bottom: 4px; }
  .lp-pscr-h1 { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 26px; line-height: 1; color: var(--white); text-transform: uppercase; letter-spacing: -0.01em; }

  /* PROOF */
  .lp-proof { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-proof-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; max-width: 1100px; margin: 0 auto 80px; }
  .lp-proof-stat { text-align: center; padding: 32px 24px; background: var(--bg-card); border: 1px solid var(--red-border); border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(255,59,48,0.04); }
  .lp-proof-num { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(60px,7vw,100px); line-height: 0.9; color: var(--white); letter-spacing: -0.03em; margin-bottom: 8px; }
  .lp-proof-num .red { color: var(--red); text-shadow: 0 0 30px rgba(255,59,48,0.5); }
  .lp-proof-lbl { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; color: var(--white-dim); text-transform: uppercase; line-height: 1.5; }
  .lp-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; max-width: 1280px; margin: 0 auto; }
  .lp-testi { background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 18px; padding: 28px; transition: transform 0.35s,border-color 0.3s; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(255,59,48,0.04); }
  .lp-testi:hover { transform: translateY(-4px); border-color: var(--red-border-strong); }
  .lp-testi-text { font-size: 15px; line-height: 1.6; color: var(--white); margin-bottom: 20px; }
  .lp-testi-name { font-family: var(--condensed); font-weight: 700; font-size: 14px; color: var(--white); text-transform: uppercase; letter-spacing: 0.04em; }
  .lp-testi-role { font-family: var(--mono); font-size: 11px; color: var(--white-dim); letter-spacing: 0.04em; margin-top: 2px; }

  /* FAQ */
  .lp-faq { padding: 140px 48px; max-width: 900px; margin: 0 auto; }
  .lp-faq-list { margin-top: 32px; }
  .lp-faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); position: relative; }
  .lp-faq-item.open { border-left: 2px solid var(--red); padding-left: 22px; margin-left: -24px; }
  .lp-faq-q { width: 100%; background: none; border: none; color: var(--white); padding: 24px 0; cursor: pointer; display: flex; align-items: center; justify-content: space-between; text-align: left; font-family: var(--body); font-size: 17px; font-weight: 500; transition: color 0.2s; line-height: 1.4; }
  .lp-faq-q:hover { color: var(--red-text); }
  .lp-faq-icon { font-family: var(--mono); font-size: 24px; color: var(--red); font-weight: 300; transition: transform 0.3s; flex-shrink: 0; margin-left: 16px; }
  .lp-faq-item.open .lp-faq-icon { transform: rotate(45deg); }
  .lp-faq-a { max-height: 0; overflow: hidden; transition: max-height 0.4s ease,padding 0.3s; color: var(--white-dim); font-size: 15px; line-height: 1.7; }
  .lp-faq-item.open .lp-faq-a { max-height: 320px; padding-bottom: 24px; }

  /* WAITLIST */
  .lp-waitlist { padding: 160px 48px; text-align: center; position: relative; overflow: hidden; background: radial-gradient(ellipse at center,#1a0008 0%,#000000 70%); }
  .lp-waitlist::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 50%,rgba(255,59,48,0.15),transparent 50%); pointer-events: none; }
  .lp-waitlist-inner { max-width: 720px; margin: 0 auto; position: relative; z-index: 2; }
  .lp-wl-hl { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(80px,10vw,160px); line-height: 0.9; letter-spacing: -0.04em; text-transform: uppercase; color: var(--white); margin-bottom: 32px; text-shadow: 0 0 80px rgba(255,59,48,0.4); }
  .lp-wl-sub { font-size: 18px; line-height: 1.55; color: var(--white-dim); margin-bottom: 16px; }
  .lp-wl-sub strong { color: var(--white); }
  .lp-wl-counter { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; background: rgba(255,255,255,0.04); border: 1px solid var(--red-border); border-radius: 999px; font-family: var(--mono); font-size: 13px; color: var(--white); letter-spacing: 0.06em; margin-bottom: 40px; }
  .lp-wl-counter::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--red); box-shadow: 0 0 12px var(--red); animation: lp-pulse 1.5s infinite; }
  .lp-wl-form { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; margin-bottom: 16px; }
  .lp-wl-input { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: var(--white); padding: 18px 20px; border-radius: 8px; font-family: var(--body); font-size: 15px; transition: border-color 0.2s,box-shadow 0.2s; outline: none; width: 100%; }
  .lp-wl-input::placeholder { color: var(--white-faint); }
  .lp-wl-input:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(255,59,48,0.15),0 0 30px rgba(255,59,48,0.3); }
  .lp-wl-btn { background: var(--red); color: var(--white); border: none; border-radius: 8px; padding: 16px 28px; font-family: var(--condensed); font-weight: 700; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 30px var(--red-glow); transition: transform 0.2s,box-shadow 0.3s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; grid-column: 1/-1; }
  .lp-wl-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--red-glow); }
  .lp-wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lp-wl-fine { font-family: var(--mono); font-size: 11px; color: var(--white-faint); letter-spacing: 0.06em; margin-top: 16px; }
  .lp-wl-err { font-family: var(--mono); font-size: 12px; color: var(--red); letter-spacing: 0.06em; margin-top: 8px; }
  @keyframes lp-spin { to{transform:rotate(360deg)} }
  .lp-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: lp-spin 0.7s linear infinite; }

  /* FOOTER */
  .lp-footer { padding: 32px 48px; border-top: 1px solid rgba(255,59,48,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; position: relative; z-index: 2; }
  .lp-footer-copy { font-family: var(--mono); font-size: 11px; color: var(--white-faint); letter-spacing: 0.04em; }
  .lp-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .lp-footer-links a { font-size: 12px; color: var(--white-dim); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
  .lp-footer-links a:hover { color: var(--red-text); }

  /* Scroll reveal — spring-settle up with slight overshoot, staggered per section.
     Transition is armed by JS (.rev-armed) so there's no pre-JS flash; --rev-delay
     is set per element in DOM order for the cascade. cmSpring-ish cubic-bezier. */
  .lp .fade-up { opacity: 0; transform: translateY(24px); }
  .lp.rev-armed .fade-up { transition: opacity 0.34s ease-out, transform 0.46s cubic-bezier(0.34,1.36,0.5,1); transition-delay: var(--rev-delay, 0ms); }
  .lp .fade-up.visible { opacity: 1; transform: translateY(0); }

  /* ── SOLUTION (two-way food↔training sync) ── */
  .lp-solution { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-solution-inner { max-width: 1100px; margin: 0 auto; }
  .lp-solution-lead { font-family: var(--body); font-size: 18px; line-height: 1.6; color: var(--white); max-width: 620px; }
  .lp-solution-lead strong { font-weight: 600; }
  .lp-solution-lead .lp-hook { color: var(--red-text); font-weight: 600; }
  .lp-solution-split { display: flex; align-items: center; gap: 56px; margin-top: 8px; }
  .lp-solution-split-text { flex: 1 1 58%; min-width: 0; }
  .lp-solution-split-text .lp-solution-lead { max-width: 560px; }
  .lp-solution-split-phone { flex: 0 0 42%; display: flex; justify-content: center; }
  @media (max-width: 820px) {
    .lp-solution-split { flex-direction: column; align-items: flex-start; gap: 40px; }
    .lp-solution-split-text, .lp-solution-split-phone { flex: 1 1 auto; width: 100%; }
    .lp-solution-split-phone { justify-content: center; }
    .lp-solution-split-text .lp-solution-lead { max-width: 620px; }
  }

  /* ── THE KITCHEN — recipe/nutrition depth (reuses .lp-solution-split + .lp-sphone) ── */
  .lp-kitchen { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-kitchen-inner { max-width: 1080px; margin: 0 auto; }
  .lp-kitchen-head { max-width: 720px; margin: 0 auto; text-align: center; }
  .lp-kitchen-head .lp-section-title { text-align: center; }
  .lp-kitchen-lead { font-family: var(--body); font-size: 18px; line-height: 1.6; color: var(--white); }
  .lp-kitchen-lead .lp-hook { color: var(--red-text); font-weight: 600; }
  .lp-kitchen-head .lp-kitchen-lead { max-width: 620px; margin: -44px auto 0; }
  .lp-kitchen-split { margin-top: 76px; }
  .lp-solution-split.reverse { flex-direction: row-reverse; }
  .lp-kitchen-mid { max-width: 640px; margin: 84px auto 0; text-align: center; }
  .lp-kitchen-mid .lp-kitchen-lead { max-width: 600px; margin: 0 auto; }
  .lp-kitchen-close { max-width: 680px; margin: 84px auto 0; text-align: center; }
  .lp-kitchen-close .lp-kitchen-lead { font-size: 20px; max-width: 620px; margin: 0 auto; }
  @media (max-width: 820px) {
    .lp-kitchen { padding: 100px 20px; }
    .lp-solution-split.reverse { flex-direction: column; }
    .lp-kitchen-split { margin-top: 56px; }
    .lp-kitchen-mid, .lp-kitchen-close { margin-top: 60px; }
  }

  .lp-sync { display: grid; grid-template-columns: 1fr auto 1fr; gap: 28px; align-items: stretch; margin-top: 56px; }
  .lp-sync-col { background: var(--bg-card); border: 1px solid var(--red-border); border-radius: 20px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .lp-sync-arrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--red-text); margin-bottom: 12px; }
  .lp-sync-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 28px; text-transform: uppercase; color: var(--white); line-height: 1; margin-bottom: 14px; letter-spacing: -0.01em; }
  .lp-sync-body { font-family: var(--body); font-size: 15px; line-height: 1.6; color: var(--white); }
  .lp-sync-mid { display: flex; align-items: center; justify-content: center; font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 40px; color: var(--red); text-shadow: 0 0 30px var(--red-glow); }

  /* ── SCROLL-SYNC (Solution centerpiece) — scroll-driven two-way sync viz ── */
  .lp-syncx { position: relative; height: 280vh; }
  .lp-syncx-sticky { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
  .lp-syncx-caps { position: relative; height: 44px; width: min(900px,92vw); }
  .lp-syncx-cap { position: absolute; inset: 0; opacity: 0; font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(22px,3vw,34px); line-height: 1; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); display: flex; align-items: center; justify-content: center; text-align: center; }
  .lp-syncx-cap .red { color: var(--red); margin-left: 0.3em; }
  .lp-syncx-stage { position: relative; width: min(900px,92vw); aspect-ratio: 900 / 480; }
  .lp-syncx-stage svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; z-index: 0; }
  .lp-sx-card { position: absolute; z-index: 2; background: var(--bg-card); border: 1.5px solid var(--red-border); border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,0.35); padding: 15px 17px; opacity: 0; }
  .lp-sx-card.hero { border-color: var(--red); box-shadow: 0 0 30px var(--red-glow), 0 16px 40px rgba(0,0,0,0.35); }
  .lp-sx-eyebrow { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--red-text); margin-bottom: 9px; }
  .lp-sx-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 19px; line-height: 0.98; text-transform: uppercase; color: var(--white); letter-spacing: -0.01em; }
  .lp-sx-row { display: flex; justify-content: space-between; align-items: baseline; font-family: var(--mono); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--white); margin-top: 9px; }
  .lp-sx-row .v { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 17px; letter-spacing: -0.01em; }
  .lp-sx-track { height: 5px; border-radius: 3px; background: var(--white-border); overflow: hidden; margin-top: 5px; }
  .lp-sx-bar { height: 100%; width: 100%; background: var(--red); border-radius: 3px; transform-origin: left center; }
  .lp-sx-badge { display: inline-block; font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #fff; background: var(--cm-accent-deep); border-radius: 5px; padding: 3px 8px; margin-top: 11px; opacity: 0; }
  .lp-sx-tag { display: inline-block; font-family: var(--mono); font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--red-text); border: 1px solid var(--red-border); border-radius: 5px; padding: 3px 8px; margin-top: 8px; opacity: 0; }
  .lp-sx-delta { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.02em; color: var(--red-text); margin-top: 11px; opacity: 0; line-height: 1.4; }
  .lp-sx-link { fill: none; stroke: var(--red); stroke-width: 2.6; stroke-linecap: round; }
  .lp-sx-pulse { fill: var(--red); filter: drop-shadow(0 0 5px var(--red)); opacity: 0; }
  .lp-syncx-note { font-family: var(--body); font-size: 13px; color: var(--white); opacity: 0.7; text-align: center; }
  /* static (reduced-motion): diagram in normal flow, final synced state */
  .lp-syncx.is-static { height: auto; }
  .lp-syncx.is-static .lp-syncx-sticky { position: static; height: auto; padding: 24px 0 8px; }

  /* ── TRUST / EVIDENCE (verified stat bubbles — NO testimonials until real) ── */
  .lp-trust { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-trust-inner { max-width: 1280px; margin: 0 auto; }
  .lp-evidence-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 12px; }
  .lp-evidence { background: var(--bg-card); border: 1px solid var(--red-border); border-radius: 18px; padding: 28px; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.35); }
  .lp-evidence-claim { font-family: var(--body); font-size: 16px; line-height: 1.55; color: var(--white); margin-bottom: 20px; flex: 1; }
  .lp-evidence-cite { font-family: var(--mono); font-size: 11px; line-height: 1.5; color: var(--white); letter-spacing: 0.02em; padding-top: 14px; border-top: 1px solid var(--white-border); }
  .lp-evidence-cite .src { color: var(--red-text); text-transform: uppercase; letter-spacing: 0.12em; font-size: 9px; display: block; margin-bottom: 5px; }
  .lp-trust-claim { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(28px,3.2vw,48px); line-height: 1.04; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); text-align: center; margin: 72px auto 0; max-width: 920px; }
  .lp-trust-claim .red { color: var(--red); }
  .lp-evidence-stat { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; margin-bottom: 16px; }
  .lp-evidence-stat > span:first-child { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 46px; line-height: 0.9; letter-spacing: -0.02em; color: var(--red); }
  .lp-evidence-stat-lbl { font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--white); }
  /* Qualitative lead for review-type evidence (no participant count) — red DM Mono, matches the section's cited tone. */
  .lp-evidence-headline { font-family: var(--mono); font-weight: 500; font-size: 26px; line-height: 1.05; letter-spacing: 0.03em; text-transform: uppercase; color: var(--red); margin-bottom: 16px; min-height: 41px; display: flex; align-items: flex-end; }

  /* ── PRICING ── */
  /* ── Pick-a-card color-theme showcase ─────────────────────────────────────── */
  .lp-cards { padding: 140px 48px; border-top: 1px solid var(--white-border); overflow: hidden; }
  .lp-cards-head { max-width: 720px; margin: 0 auto; text-align: center; }
  .lp-cards-head .lp-section-title { text-align: center; }
  .lp-cards-head .lp-lede { text-align: center; max-width: 560px; margin: -40px auto 0; }
  .lp-cards-fan { display: flex; justify-content: center; align-items: flex-end; padding: 120px 0 40px; min-height: 600px; }
  .lp-card { -webkit-appearance: none; appearance: none; background: none; border: none; padding: 0; margin: 0 -58px; cursor: pointer; flex-shrink: 0; position: relative; transform: rotate(var(--rot)); transform-origin: bottom center; transition: transform 0.55s cubic-bezier(0.34,1.35,0.42,1); -webkit-tap-highlight-color: transparent; outline: none; }
  .lp-card:nth-child(1){ --rot:-15deg; z-index:1; }
  .lp-card:nth-child(2){ --rot:-5deg;  z-index:2; }
  .lp-card:nth-child(3){ --rot:5deg;   z-index:4; }  /* red — central anchor, on top at rest */
  .lp-card:nth-child(4){ --rot:15deg;  z-index:3; }
  .lp:not(.motion-off) .lp-card:hover,
  .lp:not(.motion-off) .lp-card:focus-visible,
  .lp:not(.motion-off) .lp-card.active { transform: rotate(0deg) translateY(-44px) scale(1.06); z-index: 20; }
  .lp-card-phone { position: relative; width: 224px; height: 485px; border-radius: 34px; overflow: hidden; background: #0a0e1a; box-shadow: 0 0 0 7px #1a1a1f, 0 0 0 8px #2a2a30, 0 24px 55px rgba(0,0,0,0.55); }
  .lp-card:focus-visible .lp-card-phone { box-shadow: 0 0 0 7px #1a1a1f, 0 0 0 9px var(--red), 0 24px 55px rgba(0,0,0,0.55); }
  .lp-card-phone img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .lp-card-notch { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); width: 76px; height: 20px; background: #000; border-radius: 11px; z-index: 5; }
  .lp-cards-hint { text-align: center; font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--white-faint); margin-top: 6px; }
  .lp.motion-off .lp-card { transition: none; }
  @media (max-width: 620px) {
    .lp-cards { padding: 100px 20px; }
    .lp-cards-fan { padding: 76px 0 28px; min-height: 430px; }
    .lp-card { margin: 0 -46px; }
    .lp-card-phone { width: 156px; height: 338px; border-radius: 26px; box-shadow: 0 0 0 5px #1a1a1f, 0 0 0 6px #2a2a30, 0 16px 36px rgba(0,0,0,0.55); }
    .lp-card-notch { width: 54px; height: 15px; top: 6px; }
    .lp-card:nth-child(1){ --rot:-12deg; } .lp-card:nth-child(2){ --rot:-4deg; }
    .lp-card:nth-child(3){ --rot:4deg; }   .lp-card:nth-child(4){ --rot:12deg; }
    .lp:not(.motion-off) .lp-card:hover,
    .lp:not(.motion-off) .lp-card:focus-visible,
    .lp:not(.motion-off) .lp-card.active { transform: rotate(0deg) translateY(-26px) scale(1.08); }
  }

  /* ── Make-it-yours: coaching personalization (voice) ──────────────────────────
     Per-coach accent (--accent/-glow/-tint) is set inline; used ONLY on borders,
     rings, dots, glows and the top rule — never on text — so every label stays
     full-contrast ink/paper (no grey; AA both themes). ── */
  .lp-mine-label { text-align: center; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin: 0 0 8px; }
  .lp-mine-sub { text-align: center; font-family: var(--body); font-size: 16px; line-height: 1.6; color: var(--white); max-width: 540px; margin: 0 auto; }

  .lp-coach { max-width: 1060px; margin: 132px auto 0; padding: 0 8px; }
  .lp-coach-head { text-align: center; margin-bottom: 46px; }
  .lp-coach-head .lp-section-eyebrow { margin-bottom: 14px; }
  .lp-coach-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(32px, 4.4vw, 56px); line-height: 0.94; letter-spacing: -0.01em; text-transform: uppercase; color: var(--white); margin-bottom: 14px; }
  .lp-coach-title .accent { color: var(--red); }

  .lp-coach-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .lp-coach-card { position: relative; background: var(--bg-card); border: 1px solid var(--lp-border); border-radius: 20px; padding: 34px 26px 30px; text-align: center; overflow: hidden; transition: transform .45s cubic-bezier(.34,1.35,.42,1), border-color .3s, box-shadow .3s; }
  .lp-coach-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); }
  .lp:not(.motion-off) .lp-coach-card:hover { transform: translateY(-7px); border-color: var(--accent); box-shadow: 0 24px 55px rgba(0,0,0,0.30); }
  .lp-coach-mono { width: 68px; height: 68px; margin: 4px auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 31px; color: var(--white); background: var(--accent-tint); border: 2px solid var(--accent); box-shadow: 0 0 30px -6px var(--accent-glow); }
  .lp-coach-name { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 27px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: var(--white); margin-bottom: 9px; }
  .lp-coach-sub { font-family: var(--body); font-size: 14px; line-height: 1.5; color: var(--white); margin-bottom: 18px; }
  .lp-coach-tag { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: var(--white); }
  .lp-coach-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 11px -1px var(--accent-glow); }
  .lp-coach-note { text-align: center; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--white); margin-top: 26px; }

  .lp-adapt { max-width: 720px; margin: 100px auto 0; text-align: center; }
  .lp-adapt-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(28px, 3.6vw, 44px); line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: var(--white); margin-bottom: 18px; }
  .lp-adapt-title .accent { color: var(--red); }
  .lp-adapt-copy { font-family: var(--body); font-size: 16px; line-height: 1.65; color: var(--white); max-width: 600px; margin: 0 auto; }
  .lp-adapt-learns { font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin: 32px 0 16px; }
  .lp-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .lp-pill { display: inline-flex; align-items: center; gap: 9px; padding: 11px 18px; border-radius: 999px; border: 1px solid var(--lp-border); background: var(--bg-card); font-family: var(--body); font-size: 14px; font-weight: 600; color: var(--white); transition: border-color .25s, transform .25s, box-shadow .25s; }
  .lp:not(.motion-off) .lp-pill:hover { border-color: var(--red); transform: translateY(-2px); box-shadow: 0 8px 24px -8px var(--red-glow); }
  .lp-pill-ico { font-size: 16px; line-height: 1; }

  @media (max-width: 860px) {
    .lp-coach { margin-top: 92px; }
    .lp-coach-grid { grid-template-columns: 1fr; gap: 14px; max-width: 380px; margin: 0 auto; }
    .lp-adapt { margin-top: 74px; }
  }

  .lp-pricing { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-pricing-inner { max-width: 860px; margin: 0 auto; }
  /* Pricing = one consistently-centered section (headline + subhead join the already-centered table/lines/cards). */
  .lp-pricing .lp-section-title { text-align: center; }
  .lp-pricing .lp-lede { text-align: center; max-width: 620px; margin: -40px auto 0; }
  .lp-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; align-items: stretch; }
  .lp-price-card { position: relative; background: var(--bg-card); border: 1px solid var(--white-border); border-radius: 22px; padding: 40px 32px 32px; display: flex; flex-direction: column; }
  .lp-price-card.featured { border: 1.5px solid var(--red); box-shadow: 0 0 50px var(--red-glow), 0 20px 60px rgba(0,0,0,0.4); }
  .lp-price-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--cm-accent-deep); color: #fff; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 5px 14px; border-radius: 999px; white-space: nowrap; }
  .lp-price-plan { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin-bottom: 14px; }
  /* PLAN PRICE = hero of each card: biggest + boldest, Barlow Condensed display face. */
  .lp-price-amt { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 72px; line-height: 0.88; color: var(--white); letter-spacing: -0.03em; }
  /* only the /mo · /yr unit suffix is small — scoped to .per so it can't shrink the numeral */
  .lp-price-amt .per { font-size: 18px; font-style: normal; color: var(--white); font-weight: 600; margin-left: 4px; letter-spacing: 0; }
  .lp-price-eff { font-family: var(--mono); font-size: 11px; color: var(--red-text); letter-spacing: 0.06em; text-transform: uppercase; margin: 12px 0 22px; min-height: 14px; }
  /* Annual effective price reads as a confident value statement, not fine print (DM Mono, red-text). */
  .lp-price-card.featured .lp-price-eff { font-size: 19px; font-weight: 500; letter-spacing: 0.03em; min-height: 24px; margin: 14px 0 24px; }
  .lp-price-list { list-style: none; margin: 0 0 26px; padding: 0; display: flex; flex-direction: column; gap: 11px; flex: 1; }
  .lp-price-list li { font-family: var(--body); font-size: 14px; color: var(--white); display: flex; gap: 10px; align-items: flex-start; line-height: 1.4; }
  .lp-price-list li::before { content: '✓'; color: var(--red); font-weight: 700; flex-shrink: 0; }
  .lp-price-btn { width: 100%; background: var(--cm-accent-deep); color: #fff; border: none; border-radius: 8px; padding: 15px; font-family: var(--condensed); font-weight: 700; font-size: 15px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 30px var(--red-glow); transition: transform 0.2s; }
  .lp-price-btn.ghost { background: transparent; border: 1px solid var(--red-text); color: var(--red-text); box-shadow: none; }
  .lp-price-btn:hover { transform: translateY(-2px); }
  .lp-price-fine { text-align: center; font-family: var(--mono); font-size: 11px; color: var(--white); letter-spacing: 0.04em; line-height: 1.7; margin-top: 24px; }

  /* ── PRICING competitor stack (value anchor above the prices) ── */
  .lp-vs { max-width: 720px; margin: 6px auto 48px; }
  .lp-vs-head { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(24px,3vw,40px); line-height: 1.02; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); text-align: center; }
  .lp-vs-sub { font-family: var(--body); font-size: 15px; line-height: 1.55; color: var(--white); text-align: center; max-width: 540px; margin: 14px auto 28px; }
  .lp-vs-list { display: flex; flex-direction: column; gap: 8px; }
  .lp-vs-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 14px 20px; border: 1px solid var(--white-border); border-radius: 12px; }
  .lp-vs-row.cm { border: 1.5px solid var(--red); background: var(--bg-card); box-shadow: 0 0 30px var(--red-glow); }
  .lp-vs-name { font-family: var(--condensed); font-style: italic; font-weight: 800; font-size: 18px; text-transform: uppercase; color: var(--white); letter-spacing: -0.01em; }
  .lp-vs-row.cm .lp-vs-name { color: var(--red); }
  .lp-vs-cat { font-family: var(--mono); font-size: 10px; font-weight: 500; font-style: normal; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red-text); margin-left: 10px; }
  .lp-vs-price { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 22px; color: var(--white); letter-spacing: -0.01em; white-space: nowrap; }
  .lp-vs-price span { font-size: 12px; font-style: normal; font-weight: 600; margin-left: 2px; }
  .lp-vs-row.cm .lp-vs-price { color: var(--red); }
  .lp-vs-foot { font-family: var(--mono); font-size: 10px; color: var(--white); text-align: center; margin-top: 18px; letter-spacing: 0.03em; }

  /* Consolidated comparison ladder — price + coverage checks in one table (lives inside Pricing). */
  .lp-ladder-wrap { max-width: 880px; margin: 0 auto 28px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .lp-ladder { width: 100%; min-width: 620px; border-collapse: separate; border-spacing: 0; border: 1px solid var(--red-border); border-radius: 16px; overflow: hidden; background: var(--bg); }
  .lp-ladder th, .lp-ladder td { padding: 15px 12px; border-bottom: 1px solid var(--white-border); vertical-align: middle; }
  .lp-ladder tbody tr:last-child th, .lp-ladder tbody tr:last-child td { border-bottom: none; }
  .lp-ladder thead th { font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red-text); background: var(--lp-surface); text-align: center; }
  .lp-ladder thead th.lp-ladder-appcol { text-align: left; }
  .lp-ladder thead th.lp-ladder-pricecol { text-align: right; }
  .lp-ladder-app { text-align: left; white-space: nowrap; }
  .lp-ladder-name { font-family: var(--condensed); font-style: italic; font-weight: 800; font-size: 17px; text-transform: uppercase; color: var(--white); letter-spacing: -0.01em; }
  .lp-ladder-cat { display: block; font-family: var(--mono); font-size: 9px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red-text); margin-top: 3px; }
  .lp-ladder-cell { text-align: center; }
  .lp-ladder-cell .lp-check { font-size: 17px; }
  .lp-ladder-no { color: var(--white); opacity: 0.32; font-size: 15px; }
  .lp-ladder-price { text-align: right; font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 21px; color: var(--white); letter-spacing: -0.01em; white-space: nowrap; }
  .lp-ladder-price span { font-size: 11px; font-style: normal; font-weight: 600; margin-left: 1px; }
  .lp-ladder tr.cm th, .lp-ladder tr.cm td { background: var(--bg-card); border-top: 1.5px solid var(--red); box-shadow: inset 0 0 30px var(--red-glow); }
  .lp-ladder tr.cm .lp-ladder-name, .lp-ladder tr.cm .lp-ladder-price { color: var(--red); }

  /* ── "Works with" trust strip (Apple Health — live integration) ── */
  .lp-works { padding: 72px 48px; border-top: 1px solid var(--white-border); text-align: center; }
  .lp-works-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red-text); margin-bottom: 22px; }
  .lp-works-row { display: inline-flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
  .lp-works-badge { font-family: var(--body); font-size: 15px; color: var(--white); border: 1px solid var(--lp-border); border-radius: 100px; padding: 12px 22px; display: inline-flex; align-items: center; gap: 9px; }
  .lp-works-badge strong { font-weight: 700; }
  .lp-works-glyph { width: 20px; height: 20px; flex-shrink: 0; }

  /* ── FINAL CTA ── */
  .lp-final { padding: 160px 48px; text-align: center; position: relative; overflow: hidden; background: radial-gradient(ellipse at center, rgba(255,59,48,0.10) 0%, transparent 62%); border-top: 1px solid var(--white-border); }
  .lp-final-inner { max-width: 820px; margin: 0 auto; position: relative; z-index: 2; }
  .lp-final-hl { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(56px,8vw,120px); line-height: 0.9; letter-spacing: -0.03em; text-transform: uppercase; color: var(--white); margin-bottom: 24px; }
  .lp-final-hl .red { color: var(--red); text-shadow: 0 0 60px var(--red-glow); }
  .lp-final-sub { font-family: var(--body); font-size: 18px; line-height: 1.55; color: var(--white); margin-bottom: 36px; }
  .lp-final-fine { font-family: var(--mono); font-size: 11px; color: var(--white); letter-spacing: 0.06em; margin-top: 20px; }

  /* ── BRAND SIGNATURE LOCKUP (finale) — logo anchors "YOU SHOW UP. / WE KEEP UP." ── */
  .lp-sign { padding: 124px 48px 104px; border-top: 1px solid var(--white-border); text-align: center; }
  .lp-sign-lockup { display: inline-flex; align-items: center; gap: clamp(18px,2.4vw,38px); font-size: clamp(40px,7vw,104px); }
  .lp-sign-logo { height: 1.88em; width: auto; flex-shrink: 0; display: block; border-radius: 0.16em; box-shadow: 0 0 0.5em rgba(255,59,48,0.35); }
  .lp-sign-lines { text-align: left; font-family: var(--condensed); font-size: 1em; line-height: 0.92; text-transform: uppercase; letter-spacing: -0.02em; color: var(--white); }
  .lp-sign-l1 { display: block; font-weight: 400; }
  .lp-sign-l2 { display: block; font-weight: 900; }
  .lp-sign-cta { margin-top: 46px; }
  .lp-sign-link { background: none; border: none; cursor: pointer; font-family: var(--mono); font-size: 13px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red-text); border-bottom: 1px solid var(--red-border); padding: 0 0 5px; transition: color .2s,border-color .2s; }
  .lp-sign-link:hover { color: var(--red); border-color: var(--red); }
  .lp-sign-fine { font-family: var(--mono); font-size: 11px; color: var(--white); letter-spacing: 0.04em; margin-top: 16px; }
  @media (max-width: 560px) {
    .lp-sign { padding: 88px 24px 76px; }
    .lp-sign-lockup { font-size: clamp(30px,11vw,54px); gap: 14px; }
  }

  /* ── FEATURE DUMP (everything it does) — value-overwhelm before pricing ── */
  .lp-dump { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-dump-inner { max-width: 1200px; margin: 0 auto; }
  .lp-dump-sub { font-family: var(--body); font-size: 18px; line-height: 1.6; color: var(--white); max-width: 660px; margin: -40px 0 4px; }
  .lp-dump-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 52px; }
  .lp-dump-group { background: var(--bg-card); border: 1px solid var(--red-border); border-radius: 20px; padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.30); }
  .lp-dump-group-label { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 22px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: var(--red); margin-bottom: 22px; }
  .lp-dump-list { display: flex; flex-direction: column; gap: 18px; }
  .lp-dump-item { font-family: var(--body); font-size: 15px; line-height: 1.6; color: var(--white); display: flex; gap: 12px; }
  .lp-dump-item::before { content: ''; flex-shrink: 0; width: 7px; height: 7px; border-radius: 50%; background: var(--red); margin-top: 8px; }
  .lp-dump-item strong { font-weight: 700; color: var(--white); }
  .lp-dump-close { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 16px 32px; margin-top: 48px; }
  .lp-dump-close-line { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(28px,3.4vw,44px); text-transform: uppercase; letter-spacing: -0.02em; color: var(--white); }
  .lp-dump-link { font-family: var(--mono); font-size: 13px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--red-text); text-decoration: none; border-bottom: 1px solid var(--red-border); padding-bottom: 4px; transition: color 0.2s, border-color 0.2s; white-space: nowrap; }
  .lp-dump-link:hover { color: var(--red); border-color: var(--red); }

  @media (max-width: 980px) {
    .lp-hero { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
    .lp-phone-wrap { transform: scale(0.85); }
    .lp-float-pill { display: none; }
    .lp-bento-grid,.lp-how-grid,.lp-proof-stats,.lp-testi-grid,.lp-evidence-grid,.lp-price-grid { grid-template-columns: 1fr; }
    .lp-tile.span2,.lp-tile.span3 { grid-column: span 1; }
    .lp-featured,.lp-split-content { grid-template-columns: 1fr; }
    .lp-sync { grid-template-columns: 1fr; }
    .lp-sync-mid { transform: rotate(90deg); }
    .lp-solution,.lp-trust,.lp-pricing,.lp-final,.lp-dump { padding: 100px 24px; }
    .lp-dump-grid { grid-template-columns: 1fr; }
    .lp-dump-sub { margin-top: -24px; }
    .lp-split-div { width: 100%; height: 1px; min-height: 0; background: linear-gradient(90deg,transparent,var(--red),transparent); }
    .lp-wl-form { grid-template-columns: 1fr; }
    .lp-compare-table { font-size: 12px; }
    .lp-compare-table th,.lp-compare-table td { padding: 12px 10px; }
    .lp-nav { padding: 0 24px; }
    .lp-nav-links .lp-nav-link { display: none; }
    .lp-problem,.lp-bento,.lp-how,.lp-compare,.lp-proof,.lp-faq { padding: 100px 24px; }
    .lp-screens { padding: 100px 0 100px 24px; }
    .lp-featured { margin: 0 24px 48px 0; }
    .lp-waitlist { padding: 100px 24px; }
    .lp-footer { flex-direction: column; text-align: center; padding: 32px 24px; }
    .lp-footer-links { justify-content: center; }
  }

  /* ── THEME TOGGLE (nav) — labeled, not icon-only ── */
  .lp-theme-toggle { display: inline-flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--white); background: transparent; border: 1px solid var(--lp-border); padding: 8px 13px; border-radius: 4px; cursor: pointer; transition: border-color 0.2s, color 0.2s; white-space: nowrap; }
  .lp-theme-toggle:hover { border-color: var(--red); color: var(--red); }
  .lp-theme-toggle svg { display: block; }

  /* ── ACCESSIBILITY ── */
  /* Visible keyboard focus everywhere (replaces the input outline:none, adds to all controls) */
  .lp a:focus-visible, .lp button:focus-visible, .lp input:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; border-radius: 4px; }
  /* Honor reduced-motion — hold all ambient motion still (aurora, phone float, pulses, spinner, reveals) */
  @media (prefers-reduced-motion: reduce) {
    .lp-aurora::before, .lp-aurora::after, .lp-phone, .lp-float-pill,
    .lp-hero-eyebrow::before, .lp-wl-counter::before, .lp-spinner { animation: none !important; }
    .lp .fade-up { opacity: 1 !important; transform: none !important; transition: none !important; }
    .lp * { scroll-behavior: auto !important; }
  }

  /* ── CTA EMPHASIS (build step 3) — restrained idle "breath" + springy hover ── */
  @keyframes lp-cta-breath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.015); } }
  .lp-cta-btn, .lp-price-btn:not(.ghost) {
    animation: lp-cta-breath 3.2s ease-in-out infinite;
    transition: transform 0.32s cubic-bezier(0.34,1.42,0.5,1), box-shadow 0.32s ease;
  }
  /* hover cancels the idle breath so the spring scale-up takes over cleanly */
  .lp-cta-btn:hover, .lp-price-btn:not(.ghost):hover { animation: none; transform: scale(1.03); }
  .lp-cta-btn:hover { box-shadow: 0 0 52px var(--red-glow), 0 18px 46px rgba(0,0,0,0.45); }
  .lp-cta-btn .arrow, .lp-price-btn .arrow { display: inline-block; transition: transform 0.3s cubic-bezier(0.34,1.5,0.5,1); }
  .lp-cta-btn:hover .arrow, .lp-price-btn:not(.ghost):hover .arrow { transform: translateX(5px); }
  @media (prefers-reduced-motion: reduce) {
    .lp-cta-btn, .lp-price-btn:not(.ghost) { animation: none !important; }
  }
`;

// ── Web-side theme wrapper ────────────────────────────────────────────────────
// Mirrors the light/dark derivation in themeService.js:86-95 but writes to the LANDING
// container element (the .lp scope) — deliberately NOT .goclub-coupled, so the marketing
// site themes independently of the app shell. Red accent is CONSTANT across themes
// (#FF3B30 = --cm-red). NO GREY TEXT: text/dim/faint all resolve to full-contrast
// ink (#0A0A0A) on paper (#FFFFFF) / paper on ink — hierarchy comes from size/weight/red.
export function applyLandingTheme(el, mode) {
  if (!el) return;
  const light = mode === 'light';
  const set = (k, v) => el.style.setProperty(k, v);
  set('--bg',            light ? '#FFFFFF' : '#000000');
  set('--bg-rgb',        light ? '255,255,255' : '0,0,0');  // for theme-aware translucent nav
  set('--bg-card',       light ? 'rgba(10,10,10,0.035)' : 'rgba(255,255,255,0.04)');
  set('--lp-surface',    light ? '#F4F1EC' : '#0E0E10');
  set('--white',         light ? '#0A0A0A' : '#FFFFFF');   // primary text — full contrast
  set('--white-dim',     light ? '#0A0A0A' : '#FFFFFF');   // no grey
  set('--white-faint',   light ? '#0A0A0A' : '#FFFFFF');   // no grey
  set('--white-border',  light ? 'rgba(10,10,10,0.12)' : 'rgba(255,255,255,0.12)');
  set('--lp-border',     light ? 'rgba(10,10,10,0.14)' : 'rgba(255,255,255,0.14)');
  // Accent — bright red is theme-constant for LARGE elements / borders / glows.
  set('--red',           '#FF3B30');
  set('--red-glow',      light ? 'rgba(255,59,48,0.28)' : 'rgba(255,59,48,0.40)');
  set('--red-border',    light ? 'rgba(255,59,48,0.28)' : 'rgba(255,59,48,0.35)');
  set('--red-border-strong', light ? 'rgba(255,59,48,0.5)' : 'rgba(255,59,48,0.6)');
  // Small red TEXT: bright on dark (5.9:1), deepened on light (5.0:1) — passes AA both ways.
  set('--red-text',      light ? '#D13027' : '#FF3B30');
  // Solid-button background: deepened red both themes so the white label clears AA (5.0:1).
  set('--cm-accent-deep', '#D13027');
}

// Initial theme: localStorage cm-site-theme → prefers-color-scheme → dark (default).
export function getInitialSiteTheme() {
  try {
    const s = localStorage.getItem('cm-site-theme');
    if (s === 'light' || s === 'dark') return s;
  } catch {}
  try {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  } catch {}
  return 'dark';
}

function ThemeToggleIcon({ mode }) {
  // Shows the icon for the mode you'll switch TO.
  return mode === 'dark'
    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
}

// ── Number count-up ───────────────────────────────────────────────────────────
// Animates 0 → `to` the first time it scrolls into view, ease-out cubic, fires ONCE.
// Lands on the EXACT target on the final frame (prices precise to the cent — $12.99,
// never $13). Tabular figures so digits don't jump width. Reduced-motion → final value
// immediately, no count. rAF-driven (no animation lib).
function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1200 }) {
  const ref = useRef(null);
  const reduce = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [val, setVal] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) { setVal(to); return; }
    const el = ref.current;
    if (!el) return;
    let raf = null, t0 = null, done = false;
    const io = new IntersectionObserver((entries, ob) => {
      entries.forEach(e => {
        if (!e.isIntersecting || done) return;
        done = true;
        ob.unobserve(e.target);
        const tick = (now) => {
          if (t0 == null) t0 = now;
          const p = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);   // ease-out (fast, then settle)
          setVal(p < 1 ? eased * to : to);         // exact landing on the last frame
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [to, duration, reduce]);
  const shown = val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{prefix}{shown}{suffix}</span>;
}

function useEffects(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const glow = container.querySelector('.lp-cursor-glow');
    let raf = null, mx = 0, my = 0, gx = 0, gy = 0;
    const onMove = e => {
      mx = e.clientX; my = e.clientY;
      container.classList.add('cursor-active');
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const loop = () => {
      gx += (mx - gx) * 0.15; gy += (my - gy) * 0.15;
      if (glow) glow.style.transform = `translate3d(${gx - 240}px,${gy - 240}px,0)`;
      if (Math.abs(mx - gx) > 0.5 || Math.abs(my - gy) > 0.5) raf = requestAnimationFrame(loop);
      else raf = null;
    };
    window.addEventListener('mousemove', onMove);

    const tiltEls = container.querySelectorAll('[data-tilt]');
    const tilts = [];
    tiltEls.forEach(el => {
      const move = e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const cx = r.width / 2, cy = r.height / 2;
        el.style.transform = `perspective(600px) rotateX(${-((y - cy) / cy) * 10}deg) rotateY(${((x - cx) / cx) * 10}deg) translateZ(2px)`;
        el.style.transition = 'transform 0.08s linear';
      };
      const leave = () => {
        el.style.transition = 'transform 0.4s cubic-bezier(.2,.7,.3,1)';
        el.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
      };
      el.addEventListener('mousemove', move);
      el.addEventListener('mouseleave', leave);
      tilts.push({ el, move, leave });
    });

    // ── Scroll-triggered SECTION REVEALS ──────────────────────────────────────
    // One shared IntersectionObserver. Group every .fade-up by its owning <section>,
    // pre-assign a staggered transition-delay (DOM order), then reveal the whole group
    // when the section is ~15% into view. Fires ONCE per section (unobserve on reveal).
    // Transform/opacity only (GPU) so it can't jank the scroll. Reduced-motion → final
    // state instantly, no transition (belt + the @media rule).
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const revealEls = [...container.querySelectorAll('.fade-up')];
    let revObs = null;

    if (prefersReduced) {
      revealEls.forEach(el => el.classList.add('visible'));
    } else {
      const STAGGER = 70; // ms between cascading children — tune to taste
      const groups = new Map(); // section -> [els in DOM order]
      revealEls.forEach(el => {
        const sec = el.closest('section') || container;
        const arr = groups.get(sec) || [];
        el.style.setProperty('--rev-delay', (arr.length * STAGGER) + 'ms');
        arr.push(el);
        groups.set(sec, arr);
      });
      container.classList.add('rev-armed'); // enables the reveal transition (no pre-arm flash)
      revObs = new IntersectionObserver((entries, ob) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          (groups.get(e.target) || []).forEach(el => el.classList.add('visible'));
          ob.unobserve(e.target); // fire once
        });
      }, { threshold: 0.15 });
      groups.forEach((_, sec) => revObs.observe(sec));
    }

    return () => {
      window.removeEventListener('mousemove', onMove);
      tilts.forEach(({ el, move, leave }) => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); });
      revObs?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function MuscleMini() {
  return (
    <svg width="80" height="130" viewBox="0 0 60 100" style={{display:'block',margin:'0 auto'}}>
      <ellipse cx="30" cy="8" rx="7" ry="8" fill="rgba(255,255,255,0.1)"/>
      <rect x="26" y="15" width="8" height="5" fill="rgba(255,255,255,0.1)"/>
      <rect x="14" y="20" width="32" height="26" rx="3" fill="#FF3B30"/>
      <rect x="16" y="46" width="28" height="20" rx="2" fill="rgba(255,255,255,0.08)"/>
      <ellipse cx="11" cy="22" rx="7" ry="6" fill="#FF3B30" opacity="0.85"/>
      <ellipse cx="49" cy="22" rx="7" ry="6" fill="#FF3B30" opacity="0.85"/>
      <rect x="3" y="22" width="9" height="22" rx="4" fill="rgba(255,255,255,0.1)"/>
      <rect x="48" y="22" width="9" height="22" rx="4" fill="rgba(255,255,255,0.1)"/>
      <rect x="14" y="66" width="14" height="26" rx="4" fill="rgba(255,255,255,0.08)"/>
      <rect x="32" y="66" width="14" height="26" rx="4" fill="rgba(255,255,255,0.08)"/>
    </svg>
  );
}

function PhoneStatusIcons() {
  return (
    <div style={{display:'flex',alignItems:'center',gap:4}}>
      <svg width="14" height="10" viewBox="0 0 16 11" fill="currentColor"><path d="M0 7.5h2.5V11H0zM4.5 5h2.5v6H4.5zM9 2.5h2.5V11H9zM13.5 0H16v11h-2.5z"/></svg>
      <svg width="14" height="10" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M2 5C4 3 6 2.5 8 2.5s4 .5 6 2.5"/><path d="M4.5 7C6 5.8 7 5.5 8 5.5s2 .3 3.5 1.5"/><circle cx="8" cy="9" r="1" fill="currentColor"/></svg>
      <svg width="22" height="10" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5" fill="none"/><rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/></svg>
    </div>
  );
}

function HeroPhone() {
  return (
    <div className="lp-phone">
      {/* Real product screenshot — Today's Session training dashboard (IMG_2232, full-res 1284x2778
          → optimized 800w WebP+JPEG). Fills the phone frame; notch overlays the status-bar gap. */}
      <picture>
        <source srcSet="/hero-session.webp" type="image/webp" />
        <img
          className="lp-phone-shot"
          src="/hero-session.jpg"
          alt="Coach Macro app showing a training session dashboard"
          width="800"
          height="1731"
          loading="eager"
          decoding="async"
        />
      </picture>
      <div className="lp-phone-notch"/>
    </div>
  );
}

function HowSection() {
  const cards = [
    {n:'01',step:'Step One',title:'Tell it about you.',body:<>Day one or year ten — your goals and your real schedule. It builds around your life, <strong>not a template.</strong></>},
    {n:'02',step:'Step Two',title:'Train and eat.',body:<>A photo, a scan, a tap — whatever's fastest. <strong>It does the connecting.</strong></>},
    {n:'03',step:'Step Three',title:'It adjusts, forever.',body:<>Stronger, run-down, or a week off the rails — the plan moves with you. <strong>You never manage it.</strong></>},
  ];
  return (
    <section className="lp-how" id="how">
      <div style={{maxWidth:1280,margin:'0 auto 64px'}}>
        <div className="lp-section-eyebrow">How it works</div>
        <h2 className="lp-section-title fade-up">Set it up once.<br/>Then just <span className="accent">show up.</span></h2>
      </div>
      <div className="lp-how-grid">
        {cards.map(card => (
          <div className="lp-how-card fade-up" key={card.n}>
            <div className="lp-how-num">{card.n}</div>
            <div className="lp-how-step">{card.step}</div>
            <div className="lp-how-title">{card.title}</div>
            <div className="lp-how-body">{card.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScreenPhone({ eyebrow, title, headerRight, children }) {
  return (
    <div className="lp-sphone">
      <div className="lp-sphone-notch"/>
      <div className="lp-sphone-bar">
        <span>9:41</span>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <svg width="13" height="9" viewBox="0 0 16 11" fill="currentColor"><path d="M0 7.5h2.5V11H0zM4.5 5h2.5v6H4.5zM9 2.5h2.5V11H9zM13.5 0H16v11h-2.5z"/></svg>
          <svg width="20" height="9" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5" fill="none"/><rect x="2" y="2" width="14" height="7" rx="1" fill="currentColor"/></svg>
        </div>
      </div>
      <div className="lp-sphone-body">
        <div className="lp-pscr-head">
          <div>
            <div className="lp-pscr-eye">{eyebrow}</div>
            <div className="lp-pscr-h1">{title}</div>
          </div>
          {headerRight && <div style={{display:'flex',gap:6,alignItems:'center'}}>{headerRight}</div>}
        </div>
        {children}
      </div>
      <div className="lp-sphone-home"/>
    </div>
  );
}

// Real product screenshot inside the phone frame (full-res 1284x2778 → optimized 800w WebP+JPEG).
function RealScreen({ src, alt }) {
  return (
    <div className="lp-sphone">
      <picture>
        <source srcSet={`/screens/${src}.webp`} type="image/webp" />
        <img className="lp-sphone-shot" src={`/screens/${src}.jpg`} alt={alt} width="800" height="1731" loading="eager" decoding="async" />
      </picture>
      <div className="lp-sphone-notch"/>
    </div>
  );
}

// ── THE KITCHEN — recipe/nutrition depth: meal plan + recipe library + grocery list ──
function KitchenSection() {
  return (
    <section className="lp-kitchen" id="kitchen">
      <div className="lp-kitchen-inner">
        <div className="lp-kitchen-head">
          <div className="lp-section-eyebrow">The Kitchen</div>
          <h2 className="lp-section-title fade-up">Hundreds of recipes.<br/>Zero <span className="accent">guesswork.</span></h2>
          <p className="lp-kitchen-lead fade-up">Most fitness apps hand you a number and wish you luck. Coach Macro hands you the whole plan.</p>
        </div>

        {/* Meal plan — text left, phone right */}
        <div className="lp-solution-split lp-kitchen-split fade-up">
          <div className="lp-solution-split-text">
            <p className="lp-solution-lead"><strong>A real meal plan, built for your macros.</strong> Every day mapped out — breakfast to dinner — with meals that actually hit your targets. No more staring at a calorie goal wondering what to eat.</p>
          </div>
          <div className="lp-solution-split-phone">
            <div className="lp-sphone">
              <picture>
                <source srcSet="/screens/kitchen-mealplan.webp" type="image/webp" />
                <img className="lp-sphone-shot" src="/screens/kitchen-mealplan.jpg" alt="Coach Macro weekly meal plan — every day mapped out with meals and their macros" width="800" height="1731" loading="lazy" decoding="async" />
              </picture>
              <div className="lp-sphone-notch"/>
            </div>
          </div>
        </div>

        {/* Recipe library — centered statement (no screenshot) */}
        <div className="lp-kitchen-mid fade-up">
          <p className="lp-kitchen-lead"><strong>Hundreds of recipes, ready to cook.</strong> A full library of curated recipes with complete macros and step-by-step cooking guides. Real food, real instructions, real numbers.</p>
        </div>

        {/* Grocery list — phone left, text right */}
        <div className="lp-solution-split reverse lp-kitchen-split fade-up">
          <div className="lp-solution-split-text">
            <p className="lp-solution-lead"><strong>Your grocery list, done for you.</strong> Your whole week's shopping, organized and ready — pulled straight from your meal plan. Walk into the store knowing exactly what to grab.</p>
          </div>
          <div className="lp-solution-split-phone">
            <div className="lp-sphone">
              <picture>
                <source srcSet="/screens/kitchen-grocery.webp" type="image/webp" />
                <img className="lp-sphone-shot" src="/screens/kitchen-grocery.jpg" alt="Coach Macro grocery list — your whole week's shopping organized by aisle" width="800" height="1731" loading="lazy" decoding="async" />
              </picture>
              <div className="lp-sphone-notch"/>
            </div>
          </div>
        </div>

        {/* Close */}
        <div className="lp-kitchen-close fade-up">
          <p className="lp-kitchen-lead">Nutrition that doesn't stop at <span className="lp-hook">"eat 180g of protein."</span> It tells you what to eat, how to make it, and what to buy.</p>
        </div>
      </div>
    </section>
  );
}

function ScreensSection() {
  const scrollRef = useRef(null);
  const stageRef = useRef(null);
  const phoneRef = useRef(null);
  // Angled-phone scroll reveal: starts tilted in 3D, straightens to face-on as it scrolls up,
  // then holds LARGE + face-on + still (readability is the payoff). Desktop only — mobile &
  // reduced-motion get a big, static, face-on phone (no 3D jank). Transform/opacity only (GPU).
  useEffect(() => {
    const stage = stageRef.current, phone = phoneRef.current;
    if (!stage || !phone) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.querySelector('.lp')?.classList.contains('motion-off');
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    if (reduce || mobile) { phone.style.transform = 'none'; return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = stage.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.62)));  // 0 angled → 1 face-on, holds at 1
      const inv = 1 - p;
      phone.style.transform = `perspective(1500px) rotateY(${(-18*inv).toFixed(2)}deg) rotateX(${(8*inv).toFixed(2)}deg) scale(${(0.9+0.1*p).toFixed(3)})`;
    };
    update();
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let down = false, startX = 0, scrollLeft = 0;
    const onDown = e => { down = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = 'grabbing'; };
    const onUp = () => { down = false; el.style.cursor = 'grab'; };
    const onMove = e => { if (!down) return; e.preventDefault(); const x = e.pageX - el.offsetLeft; el.scrollLeft = scrollLeft - (x - startX) * 1.5; };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('mousemove', onMove);
    return () => { el.removeEventListener('mousedown', onDown); window.removeEventListener('mouseup', onUp); el.removeEventListener('mousemove', onMove); };
  }, []);

  return (
    <section className="lp-screens">
      <div className="lp-screens-head">
        <div className="lp-section-eyebrow">The Product</div>
        <h2 className="lp-section-title fade-up">Cheat Day,<br/>the <span className="accent">Right Way.</span></h2>
      </div>

      <div className="lp-ra-showcase">
        <div className="lp-ra-copy fade-up">
          <div className="lp-feat-eye">Featured · Restaurant AI</div>
          <div className="lp-feat-title">Order anything. Stay on plan.</div>
          <div className="lp-feat-body">Snap a menu. The AI tells you exactly what to order to hit your remaining macros. Works at 50,000+ chains and any photographed menu.</div>
          <div className="lp-ai-msg lp-ra-msg">
            <div className="lp-ai-msg-l">COACH ANALYSIS</div>
            You're 44g of protein short. Order the grilled salmon — it's 42g. Skip the fries, get the side salad. Stays in budget.
          </div>
        </div>
        <div className="lp-ra-stage" ref={stageRef}>
          <div className="lp-ra-phone" ref={phoneRef}>
            <picture>
              <source srcSet="/screens/restaurant-ai-lg.webp" type="image/webp" />
              <img src="/screens/restaurant-ai-lg.jpg" alt="Coach Macro Restaurant AI recommending a meal that fits your macros" width="1080" height="2337" loading="eager" decoding="async" />
            </picture>
            <div className="lp-ra-notch"/>
          </div>
        </div>
      </div>

      <div className="lp-scroll" ref={scrollRef}>
        <RealScreen src="meal-plan" alt="Coach Macro meal plan for the day, built around your macros" />
        <RealScreen src="grocery-list" alt="Coach Macro grocery list grouped by aisle" />
        <RealScreen src="coaching-technique" alt="Coach Macro exercise form coaching with technique cues" />
        <RealScreen src="coaching-cues" alt="Coach Macro exercise coaching with form tips" />
      </div>
      <div style={{padding:'8px 48px 0',color:'var(--white-faint)',fontFamily:'var(--mono)',fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase'}}>← Drag to explore →</div>
    </section>
  );
}

// ── SOLUTION — the two-way food↔training sync, framed as outcome ──────────────
// Scroll-driven two-way sync: scrubs with scroll position (forward/back). Stage A =
// workout adjusts your food (numbers climb); Stage B = recovery eases tomorrow's training.
// Transform/opacity + textContent only (GPU-friendly), one rAF-throttled scroll handler.
// Reduced-motion → static final synced state, no scrubbing.
function SolutionSection() {
  const trackRef = useRef(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const q = s => track.querySelector(s);
    const l1 = q('#sx-l1'), l2 = q('#sx-l2');
    const len1 = l1.getTotalLength(), len2 = l2.getTotalLength();
    l1.style.strokeDasharray = len1; l2.style.strokeDasharray = len2;
    const caps = track.querySelectorAll('[data-cap]');

    const cl = t => t < 0 ? 0 : t > 1 ? 1 : t;
    const ease = t => { t = cl(t); return t*t*(3-2*t); };
    const seg = (p, a, b) => ease((p - a) / (b - a));
    const band = (p, a, b, c, d) => Math.max(0, Math.min(ease((p-a)/(b-a)), ease((d-p)/(d-c))));
    const setPulse = (dot, path, len, t, vis) => {
      const pt = path.getPointAtLength(cl(t) * len);
      dot.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      dot.style.opacity = vis;
    };
    const render = (p) => {
      const intro = seg(p, 0, 0.12);
      const A = seg(p, 0.16, 0.48);      // workout → food
      const recIn = seg(p, 0.44, 0.56);
      const B = seg(p, 0.56, 0.86);      // recovery → training
      // cards intro
      const train = q('[data-card="train"]'), fuel = q('[data-card="fuel"]'), recov = q('[data-card="recov"]');
      train.style.opacity = intro; train.style.transform = `translateY(${(1-intro)*22}px)`;
      fuel.style.opacity = intro;  fuel.style.transform = `translateY(${(1-intro)*22}px)`;
      recov.style.opacity = recIn; recov.style.transform = `translateY(${(1-recIn)*18}px)`;
      // stage A — train logs, pulse flows, food climbs
      q('[data-log]').style.opacity = seg(p, 0.16, 0.24);
      l1.style.strokeDashoffset = (1 - A) * len1;
      setPulse(q('[data-pulse="1"]'), l1, len1, A, (A > 0.03 && A < 0.985) ? 1 : 0);
      q('[data-num="cal"]').textContent = Math.round(2400 + 500 * A).toLocaleString();
      q('[data-num="carb"]').textContent = Math.round(240 + 65 * A);
      q('[data-bar="carb"]').style.transform = `scaleX(${(0.55 + 0.35 * A).toFixed(3)})`;
      q('[data-delta]').style.opacity = A;
      // stage B — recovery eases tomorrow's training
      l2.style.strokeDashoffset = (1 - B) * len2;
      setPulse(q('[data-pulse="2"]'), l2, len2, B, (B > 0.03 && B < 0.985) ? 1 : 0);
      q('[data-bar="load"]').style.transform = `scaleX(${(1 - 0.34 * B).toFixed(3)})`;
      q('[data-eased]').style.opacity = B;
      // captions crossfade
      caps[0].style.opacity = band(p, 0, 0.02, 0.13, 0.19);
      caps[1].style.opacity = band(p, 0.17, 0.25, 0.46, 0.53);
      caps[2].style.opacity = band(p, 0.55, 0.63, 0.83, 0.89);
      caps[3].style.opacity = band(p, 0.87, 0.93, 1.2, 1.4);
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { track.classList.add('is-static'); render(1); return; }

    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const total = track.offsetHeight - window.innerHeight;
        const p = cl(-track.getBoundingClientRect().top / Math.max(1, total));
        render(p);
      });
    };
    render(0);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="lp-solution" id="solution">
      <div className="lp-solution-inner">
        <div className="lp-section-eyebrow">The difference</div>
        <h2 className="lp-section-title fade-up">Everyone connects them now.<br/>Almost no one <span className="accent">goes deep.</span></h2>
        <p className="lp-solution-lead fade-up">Plenty of apps can connect your training, your food, and your recovery. Almost none are actually good at all three. That's the hard part — and it's the whole reason Coach Macro exists.</p>
      </div>

      <div className="lp-syncx" ref={trackRef} aria-hidden="true">
        <div className="lp-syncx-sticky">
          <div className="lp-syncx-caps">
            <div className="lp-syncx-cap" data-cap>Two systems. Watch them talk.</div>
            <div className="lp-syncx-cap" data-cap>Your heavy day just earned <span className="red">more food.</span></div>
            <div className="lp-syncx-cap" data-cap>And recovery <span className="red">eases tomorrow.</span></div>
            <div className="lp-syncx-cap" data-cap>One system. <span className="red">Everything talks.</span></div>
          </div>
          <div className="lp-syncx-stage">
            <svg viewBox="0 0 900 480" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <path id="sx-l1" className="lp-sx-link" d="M 300 150 Q 460 92 588 128"/>
              <path id="sx-l2" className="lp-sx-link" d="M 452 312 Q 300 300 196 232"/>
              <circle className="lp-sx-pulse" data-pulse="1" r="5.5"/>
              <circle className="lp-sx-pulse" data-pulse="2" r="4.5"/>
            </svg>
            <div className="lp-sx-card" data-card="train" style={{ left: '2%', top: '13%', width: '31%' }}>
              <div className="lp-sx-eyebrow">Training · Today</div>
              <div className="lp-sx-title">Heavy<br/>Leg Day</div>
              <div className="lp-sx-row"><span>Load</span><span className="v">Hard</span></div>
              <div className="lp-sx-track"><div className="lp-sx-bar" data-bar="load"/></div>
              <div><span className="lp-sx-badge" data-log>✓ Logged</span></div>
              <div><span className="lp-sx-tag" data-eased>Tomorrow: eased</span></div>
            </div>
            <div className="lp-sx-card hero" data-card="fuel" style={{ left: '64%', top: '6%', width: '34%' }}>
              <div className="lp-sx-eyebrow">Fuel · Today's target</div>
              <div className="lp-sx-row"><span>Calories</span><span className="v" data-num="cal">2,400</span></div>
              <div className="lp-sx-row"><span>Carbs</span><span className="v"><span data-num="carb">240</span>g</span></div>
              <div className="lp-sx-track"><div className="lp-sx-bar" data-bar="carb"/></div>
              <div className="lp-sx-row"><span>Protein</span><span className="v">190g</span></div>
              <div className="lp-sx-delta" data-delta>+500 kcal · +65g carbs — from today's session</div>
            </div>
            <div className="lp-sx-card" data-card="recov" style={{ left: '33%', top: '62%', width: '34%' }}>
              <div className="lp-sx-eyebrow">Recovery · Last night</div>
              <div className="lp-sx-title">Sleep short. HRV down.</div>
            </div>
          </div>
          <div className="lp-syncx-note">Scroll — the systems talk in real time.</div>
        </div>
      </div>

      <div className="lp-solution-inner">
        <div className="lp-solution-split fade-up">
          <div className="lp-solution-split-text">
            <p className="lp-solution-lead">So: your <strong>heavy day earns you more food</strong>, automatically. Your <strong>trashed legs won't get a brutal session</strong> stacked on them. Your <strong>run paces come from your actual fitness</strong>, not a generic chart. And you get a coach that <span className="lp-hook">actually fits you</span> — a nervous beginner and a seasoned lifter don't need the same voice, so some days it's encouragement, and some days it <strong>pushes you harder than you'd push yourself</strong>. <span className="lp-hook">Real depth, on every side</span> — not "good enough for one app."</p>
          </div>
          <div className="lp-solution-split-phone">
            <div className="lp-sphone">
              <picture>
                <source srcSet="/screens/training-recovery.webp" type="image/webp" />
                <img className="lp-sphone-shot" src="/screens/training-recovery.jpg" alt="Coach Macro dashboard showing weekly training and recovery" width="800" height="1731" loading="lazy" decoding="async" />
              </picture>
              <div className="lp-sphone-notch"/>
            </div>
          </div>
        </div>
        <p className="lp-solution-lead" style={{ marginTop: 20 }}>You've been told you have to choose: everything in one place, or everything done well. <strong>You don't.</strong></p>
      </div>
    </section>
  );
}

// ── TRUST / EVIDENCE — verified peer-reviewed stat bubbles only. ──────────────
// ⚠️ NO fabricated testimonials, star counts, or install numbers. Every claim below
// is traced to a real source (see onboarding-stat-bubbles-verified.md) and framed to
// match what the study actually found. Real peer testimonials slot into the commented
// region at the bottom once we have consented, verifiable users.
function TrustSection() {
  const evidence = [
    { claim: "People following a structured, guided program see significantly greater gains in strength and physical function than those training on their own.",
      src: "Peer-reviewed · Meta-analysis", cite: "Gómez-Redondo et al., Sports Medicine (2024). 34 RCTs, 2,830 participants.",
      stat: { to: 2830, label: "participants across 34 studies" } },
    { headline: "How you lift",
      claim: "Proper training technique — range of motion, tempo, controlled execution — is what maximizes muscle growth. That's why Coach Macro coaches technique with form cues, not just weights and reps.",
      src: "Peer-reviewed · Research review", cite: "Piñero, Nippard & Schoenfeld, J. Funct. Morphol. Kinesiol. (2024)." },
    { claim: "In one study, people who logged more frequently lost noticeably more weight — the habit of logging, not the perfect diet, tracked with success.",
      src: "Peer-reviewed · Clinical trial", cite: "Harvey et al., Obesity (2019). 142 participants.",
      stat: { to: 142, label: "participants tracked" } },
  ];
  return (
    <section className="lp-trust" id="evidence">
      <div className="lp-trust-inner">
        <div className="lp-section-eyebrow">The evidence</div>
        <h2 className="lp-section-title fade-up">Backed by<br/><span className="accent">science.</span></h2>
        <p className="lp-lede fade-up">The approach is built on what the research keeps showing — about training with structure, and about what actually makes it stick.</p>
        <div className="lp-evidence-grid">
          {evidence.map((e,i) => (
            <div className="lp-evidence fade-up" key={i}>
              {e.stat && (
                <div className="lp-evidence-stat"><CountUp to={e.stat.to}/><span className="lp-evidence-stat-lbl">{e.stat.label}</span></div>
              )}
              {e.headline && (
                <div className="lp-evidence-headline">{e.headline}</div>
              )}
              <div className="lp-evidence-claim">{e.claim}</div>
              <div className="lp-evidence-cite"><span className="src">{e.src}</span>{e.cite}</div>
            </div>
          ))}
        </div>

        {/* ───────────────────────────────────────────────────────────────────────
            REAL PEER TESTIMONIALS SLOT IN HERE — do NOT fabricate.
            When we have verified users (real name, role, and ideally a photo or
            consented before/after), render them as a `.lp-testi-grid` of `.lp-testi`
            cards right below this comment (those styles already exist and are unused).
            Until then this region stays empty BY DESIGN. No invented quotes, no star
            counts, no "trusted by N" numbers. A fabricated claim in a health product
            is a credibility + liability risk.
            ─────────────────────────────────────────────────────────────────────── */}
      </div>
    </section>
  );
}

// ── FEATURE DUMP — "everything it does" value-overwhelm before pricing. ───────
// Curated from feature-dump-section.md. Honesty-checked against the real shipped
// features (no gated/stubbed overclaims): "hundreds" of recipes (not 299), no
// Garmin/Whoop, food vision "checks itself against a nutrition database", personas
// selectable via settings. Links to the full /features page.
const DUMP_GROUPS = [
  { label: "The Nutrition Brain", items: [
    { lead: "Photograph your plate.", body: "It identifies the food, estimates the portions, and checks itself against a nutrition database — so logging a meal takes a photo, not a search." },
    { lead: "Your macros move with your training.", body: "Train hard today and your targets adjust — more fuel on heavy days, less on rest days. You don't recalculate anything." },
    { lead: "Eating out? It finds your best options.", body: "Tell it where you're going and it works out what fits your day — the meals, the macros, the smart swaps — so a restaurant isn't the thing that derails you." },
    { lead: "Hundreds of guided recipes", body: "with step-by-step cooking mode, batch-prep plans, and grocery lists grouped by aisle." },
  ]},
  { label: "The Training Engine", items: [
    { lead: "Programs built for how you actually train", body: "— strength, running, hybrid, or Hyrox — not a generic template." },
    { lead: "Progression that thinks.", body: "It tracks your lifts and adjusts the load as you get stronger, so you're always training at the right weight." },
    { lead: "A week editor that respects your life", body: "— move your training days around and it keeps the plan sound instead of breaking." },
  ]},
  { label: "The Run Engine", items: [
    { lead: "Real pace zones from your actual fitness", body: "— easy days stay easy, hard days are calibrated to you, so you train the right way instead of guessing." },
    { lead: "It won't stack a hard run on tired legs.", body: "If yesterday hammered your quads, today's run adjusts — because that's how you avoid injury and actually improve." },
    { lead: "Race predictions grounded in your real runs", body: "— honest projections, not fantasy numbers." },
  ]},
  { label: "Recovery Intelligence", items: [
    { lead: "One recovery score from the whole picture", body: "— it reads your sleep, your heart-rate variability, and your training load together, so you know when to push and when to back off." },
    { lead: "The coach knows when you're fried.", body: "On the days your body needs rest, it tells you — because the strongest move is sometimes not training." },
  ]},
  { label: "The Coach", items: [
    { lead: "A coach that adapts to you", body: "— gentle and encouraging, straight and steady, or no-excuses intense. You choose the voice that actually helps you." },
    { lead: "It speaks to your day, not a script", body: "— a good week, a rough patch, a personal best, a plateau. It notices, and it says the right thing." },
    { lead: "Everything connects.", body: "Your training shapes your nutrition. Your recovery shapes your training. One system, working together — so you're not the one holding it all in your head." },
  ]},
];

function FeatureDumpSection() {
  return (
    <section className="lp-dump" id="everything">
      <div className="lp-dump-inner">
        <div className="lp-section-eyebrow">Everything it does</div>
        <h2 className="lp-section-title fade-up">The part other<br/>apps <span className="accent">skip.</span></h2>
        <p className="lp-dump-sub fade-up">Connecting things is easy. Being deep on all of them is the work. Here's the work.</p>
        <div className="lp-dump-grid">
          {DUMP_GROUPS.map(g => (
            <div className="lp-dump-group fade-up" key={g.label}>
              <h3 className="lp-dump-group-label">{g.label}</h3>
              <div className="lp-dump-list">
                {g.items.map((it, i) => (
                  <div className="lp-dump-item" key={i}><span><strong>{it.lead}</strong> {it.body}</span></div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="lp-dump-close fade-up">
          <div className="lp-dump-close-line">And that's the short version.</div>
          <a className="lp-dump-link" href="/features">See the full feature list →</a>
        </div>
      </div>
    </section>
  );
}

// ── "WORKS WITH" trust strip — Apple Health (live integration). ──
// ⚠️ COMPLIANCE: official brand assets required BEFORE DEPLOY. Do NOT recreate the Apple
// Health icon (Apple trademark) — drop in Apple's downloadable "Works with Apple Health"
// badge per Apple's marketing guidelines. The wording below ("Works with Apple Health") is
// Apple's APPROVED phrasing; only the icon artwork must be their own asset.
function WorksWithSection() {
  return (
    <section className="lp-works">
      <div className="lp-works-eyebrow">Works with</div>
      <div className="lp-works-row fade-up">
        <div className="lp-works-badge">Works with <strong>Apple&nbsp;Health</strong></div>
      </div>
    </section>
  );
}

// ── COLOR-THEME SHOWCASE — fanned "hand of cards", hover/tap to lift ──────────
function CardsSection() {
  const [active, setActive] = React.useState(null);
  const cards = [
    { src: 'theme-magenta', alt: 'Coach Macro app in the magenta color theme' },
    { src: 'theme-blue',    alt: 'Coach Macro app in the blue color theme' },
    { src: 'theme-red',     alt: 'Coach Macro app in the red color theme' },
    { src: 'theme-purple',  alt: 'Coach Macro app in the purple color theme' },
  ];
  // Real shipping personas (personalityService TONE_DISPLAY). Accent used only on
  // rings/dots/glows — warm→steady→intense mapped to the site's gold/blue/red tokens.
  const coaches = [
    { initial: 'M', name: 'McFarland', sub: 'Warm and encouraging',      tag: 'Warm',    a: '#FFD740', g: 'rgba(255,215,64,0.55)', t: 'rgba(255,215,64,0.10)' },
    { initial: 'G', name: 'Garcia',    sub: 'Straight and steady',       tag: 'Steady',  a: '#2979FF', g: 'rgba(41,121,255,0.55)', t: 'rgba(41,121,255,0.10)' },
    { initial: 'E', name: 'Eckley',    sub: 'No excuses, all intensity', tag: 'Intense', a: '#FF3B30', g: 'rgba(255,59,48,0.55)',  t: 'rgba(255,59,48,0.10)' },
  ];
  // Real shipping communication styles (personalityService PERSONALITY_TYPES).
  const styles = [
    { ico: '📊', label: 'Data-Driven' },
    { ico: '🚀', label: 'Progress-Focused' },
    { ico: '🔍', label: 'Evidence-First' },
    { ico: '🎯', label: 'Consistency-Oriented' },
    { ico: '⚡', label: 'Direct' },
    { ico: '🔬', label: 'Technical' },
  ];
  return (
    <section className="lp-cards" id="themes">
      <div className="lp-cards-head">
        <div className="lp-section-eyebrow">Make it yours</div>
        <h2 className="lp-section-title fade-up">Your coach,<br/>your <span className="accent">way.</span></h2>
        <p className="lp-lede fade-up">Two things you shouldn't have to settle for — how it looks, and how it talks to you. Eight color themes, light or dark. Three coaches. And a voice that keeps tuning itself to the way you think.</p>
      </div>

      {/* THE LOOK — color themes */}
      <div className="lp-mine-label fade-up">The look — eight themes, light or dark</div>
      <div className="lp-cards-fan fade-up" role="group" aria-label="App color themes — pick a card">
        {cards.map((c, i) => (
          <button
            key={c.src}
            className={`lp-card${active === i ? ' active' : ''}`}
            onClick={() => setActive(active === i ? null : i)}
            aria-pressed={active === i}
          >
            <div className="lp-card-phone">
              <picture>
                <source srcSet={`/screens/${c.src}.webp`} type="image/webp" />
                <img src={`/screens/${c.src}.jpg`} alt={c.alt} width="800" height="1731" loading="eager" decoding="async" />
              </picture>
              <div className="lp-card-notch"/>
            </div>
          </button>
        ))}
      </div>
      <div className="lp-cards-hint" aria-hidden="true">Hover or tap a card</div>

      {/* THE VOICE — 3 coaches (user-chosen) + adaptive communication style (learned) */}
      <div className="lp-coach fade-up">
        <div className="lp-coach-head">
          <div className="lp-section-eyebrow">The voice</div>
          <h3 className="lp-coach-title">Pick your <span className="accent">coach.</span></h3>
          <p className="lp-mine-sub">Chosen by you, live from day one — and switchable the moment your mood is.</p>
        </div>
        <div className="lp-coach-grid" role="list">
          {coaches.map(c => (
            <div className="lp-coach-card" role="listitem" key={c.name}
              style={{ '--accent': c.a, '--accent-glow': c.g, '--accent-tint': c.t }}>
              <div className="lp-coach-mono" aria-hidden="true">{c.initial}</div>
              <div className="lp-coach-name">Coach {c.name}</div>
              <div className="lp-coach-sub">{c.sub}</div>
              <div className="lp-coach-tag"><span className="lp-coach-dot"/>{c.tag}</div>
            </div>
          ))}
        </div>

        {/* Adaptive communication styles — LEARNED, not picked */}
        <div className="lp-adapt">
          <h3 className="lp-adapt-title">Then it learns <span className="accent">how you think.</span></h3>
          <p className="lp-adapt-copy">Beyond tone, Coach Macro adapts <em>how</em> it explains things to the way you actually engage — leaning into the framing that lands for you. You never set this; it learns it. And if you'd rather steer, you can.</p>
          <div className="lp-adapt-learns">It learns and adapts to</div>
          <div className="lp-pills" role="list">
            {styles.map(s => (
              <span className="lp-pill" role="listitem" key={s.label}>
                <span className="lp-pill-ico" aria-hidden="true">{s.ico}</span>{s.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── PRICING — trial-led, annual anchored vs monthly, one plan emphasized ──────
function PricingSection({ onStart }) {
  const CATS = ['Training','Nutrition','Running','Recovery','Coaching'];
  const rivals = [
    { name:'RP Strength', cat:'Training only',  price:'$34.99', covers:['Training'] },
    { name:'STNDRD',      cat:'Training + nutrition', price:'~$15', covers:['Training','Nutrition'] },
    { name:'Runna',       cat:'Running only',   price:'~$18',   covers:['Running'] },
    { name:'MacroFactor', cat:'Nutrition only', price:'$11.99', covers:['Nutrition'] },
  ];
  return (
    <section className="lp-pricing" id="pricing">
      <div className="lp-pricing-inner">
        <div className="lp-section-eyebrow">Pricing</div>
        <h2 className="lp-section-title fade-up">Everything.<br/>For less than <span className="accent">any one app.</span></h2>
        <p className="lp-lede fade-up">No tiers, no upsells, no paying five apps to do what one should. Free for 7&nbsp;days.</p>

        {/* Consolidated comparison — competitor price ladder WITH coverage checks, one table. */}
        <div className="lp-ladder-wrap fade-up">
          <table className="lp-ladder">
            <thead>
              <tr>
                <th scope="col" className="lp-ladder-appcol">App</th>
                {CATS.map(c => <th scope="col" key={c}>{c}</th>)}
                <th scope="col" className="lp-ladder-pricecol">Price</th>
              </tr>
            </thead>
            <tbody>
              {rivals.map(a => (
                <tr key={a.name}>
                  <th scope="row" className="lp-ladder-app">
                    <span className="lp-ladder-name">{a.name}</span>
                    <span className="lp-ladder-cat">{a.cat}</span>
                  </th>
                  {CATS.map(c => (
                    <td className="lp-ladder-cell" key={c}>
                      {a.covers.includes(c)
                        ? <span className="lp-check" role="img" aria-label={`${c}: yes`}>✓</span>
                        : <span className="lp-ladder-no" role="img" aria-label={`${c}: no`}>–</span>}
                    </td>
                  ))}
                  <td className="lp-ladder-price">{a.price}<span>/mo</span></td>
                </tr>
              ))}
              <tr className="cm">
                <th scope="row" className="lp-ladder-app">
                  <span className="lp-ladder-name">Coach Macro</span>
                  <span className="lp-ladder-cat">All of it</span>
                </th>
                {CATS.map(c => (
                  <td className="lp-ladder-cell" key={c}>
                    <span className="lp-check" role="img" aria-label={`${c}: yes`}>✓</span>
                  </td>
                ))}
                <td className="lp-ladder-price">$12.99<span>/mo</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payoff line — moved to BELOW the comparison table. */}
        <div className="lp-vs fade-up" style={{ margin: '0 auto 42px' }}>
          <div className="lp-vs-head">One app. Less than any single piece costs on its own.</div>
          <div className="lp-vs-sub">Every one of those apps does a slice of it. Coach Macro does all of it — for less than the cheapest single-purpose one.</div>
        </div>

        <div className="lp-price-grid">
          <div className="lp-price-card fade-up">
            <div className="lp-price-plan">Monthly</div>
            <div className="lp-price-amt"><CountUp to={12.99} decimals={2} prefix="$"/><span className="per">/mo</span></div>
            <div className="lp-price-eff">Billed monthly</div>
            <ul className="lp-price-list">
              <li>Every feature in Coach Macro</li>
              <li>Adaptive macros + training</li>
              <li>AI coach, morning brief & photo logging</li>
              <li>Cancel anytime</li>
            </ul>
            <button className="lp-price-btn ghost" onClick={onStart}>Start Free Trial</button>
          </div>
          <div className="lp-price-card featured fade-up">
            <div className="lp-price-badge">Most Popular · Save <CountUp to={68} suffix="%"/></div>
            <div className="lp-price-plan">Annual</div>
            <div className="lp-price-amt"><CountUp to={49.99} decimals={2} prefix="$"/><span className="per">/yr</span></div>
            <div className="lp-price-eff">Just <CountUp to={4.17} decimals={2} prefix="$"/>/mo — billed yearly</div>
            <ul className="lp-price-list">
              <li>Everything in Monthly</li>
              <li>Two-thirds off the month-to-month price</li>
              <li>Cancel anytime</li>
            </ul>
            <button className="lp-price-btn" data-tilt onClick={onStart}>Start Your 7-Day Free Trial <span className="arrow">→</span></button>
          </div>
        </div>
        <div className="lp-price-fine">
          {/* ⚠️ AUTO-RENEWAL DISCLOSURE — placeholder copy; billing/legal must finalize the exact
              wording (and the card-step disclosure) before this goes live. */}
          7 days free, then your plan renews automatically ($12.99/mo or $49.99/yr) unless you cancel at least 24 hours before the trial ends. Manage or cancel anytime in your account settings.
        </div>
        <div className="lp-vs-foot">Competitor prices as of July 2026; check each app for current pricing.</div>
      </div>
    </section>
  );
}

// ── FINAL CTA — restate the offer, one button, minimal escape routes ──────────
function FinalCtaSection({ onStart }) {
  return (
    <section className="lp-sign" id="start">
      <div className="lp-sign-lockup fade-up">
        <img className="lp-sign-logo" src="/whistle-logo.svg" alt=""/>
        <h2 className="lp-sign-lines">
          <span className="lp-sign-l1">You show up.</span>
          <span className="lp-sign-l2">We keep up.</span>
        </h2>
      </div>
      <div className="lp-sign-cta fade-up">
        <button className="lp-sign-link" onClick={onStart}>Start your 7-day free trial →</button>
        <div className="lp-sign-fine">then $12.99/mo or $49.99/yr · cancel anytime</div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {q:'How is this different from just using MyFitnessPal and a workout app together?',a:"Those apps run in isolation. Coach Macro's intelligence sits in the connection — when you log a workout, your macros change automatically. When you're in a deficit, your training load adjusts. No manual re-entry. No guesswork. One system that knows the full picture."},
    {q:'Do I need to be advanced to use this?',a:"Not at all. Whether you're just starting your fitness journey or you've been training for years, Coach Macro adapts to where you are. The system handles the complex math behind the scenes — you just log your meals and workouts, and we do the rest. No PhD in nutrition required."},
    {q:'How accurate is the metabolic rate calculation?',a:"Instead of dropping you into a one-size-fits-all formula, it builds your metabolic profile from your body stats, your training history, your activity, and your biometrics — and keeps refining it as it learns your patterns. The point isn't a magic number; it's a target that's actually tuned to you, and gets sharper the longer you use it."},
    {q:'What does "training day adjustment" actually mean?',a:"On a training day, your carbohydrate targets increase proportionally to session volume and intensity. After you log a completed workout, your remaining calorie and carb budgets update in real time. Rest days have a reduced carb and calorie target. It's automatic — you don't touch a setting."},
    {q:'Does it work for runners and endurance athletes, or just lifters?',a:"Both — and that's the whole idea. Running, hybrid, and Hyrox get the same depth as lifting: real pace zones from your own fitness, mileage that ramps safely, and recovery that keeps a hard run off tired legs. Endurance isn't an afterthought bolted onto a lifting app."},
    {q:'Can I connect my wearable or smartwatch?',a:"Apple Health connects today — your sleep, heart-rate variability, steps, and activities flow straight in. More integrations are on the way. Until then, a quick manual log works everywhere, with the app's own energy calculation behind it."},
    {q:'What happens after the 7-day trial?',a:"You choose a plan or you stop. No charge, no dark patterns. If you want to continue, you select monthly or annual. If not, your account downgrades to read-only — your data stays, you just can't log new entries."},
    {q:'Is my data private?',a:"Your data is never sold. Never shared with third parties. We use it only to run your personalized model. You can export or delete everything at any time from within the app."},
  ];
  return (
    <section className="lp-faq" id="faq">
      <div className="lp-section-eyebrow">Questions</div>
      <h2 className="lp-section-title fade-up">Fair <span className="accent">questions.</span></h2>
      <div className="lp-faq-list">
        {faqs.map((f,i) => (
          <div className={`lp-faq-item${open===i?' open':''}`} key={i}>
            <button className="lp-faq-q" onClick={() => setOpen(open===i?null:i)}>
              <span>{f.q}</span>
              <span className="lp-faq-icon">+</span>
            </button>
            <div className="lp-faq-a">{f.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingPage({ onSignUp }) {
  const containerRef = useRef(null);
  useEffects(containerRef);

  const [theme, setTheme] = useState(getInitialSiteTheme);
  useEffect(() => {
    applyLandingTheme(containerRef.current, theme);
    try { localStorage.setItem('cm-site-theme', theme); } catch {}
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  // Pause/stop control for looping ambient animations (WCAG 2.2.2). Persists across visits.
  const [motionOff, setMotionOff] = useState(() => { try { return localStorage.getItem('cm-reduce-motion') === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('cm-reduce-motion', motionOff ? '1' : '0'); } catch {} }, [motionOff]);

  const [waitlistBanner, setWaitlistBanner] = useState(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const w = p.get('waitlist');
    if (w === 'confirmed') setWaitlistBanner('confirmed');
    else if (w === 'invalid') setWaitlistBanner('invalid');
  }, []);

  // Primary conversion action — start the trial. Until the web signup flow is wired,
  // fall back to scrolling to Pricing (the standalone waitlist section was removed per spec).
  const startTrial = () => { if (onSignUp) onSignUp(); else document.getElementById('pricing')?.scrollIntoView({behavior:'smooth'}); };

  return (
    <div className={`lp${waitlistBanner?' has-banner':''}${motionOff?' motion-off':''}`} data-theme={theme} ref={containerRef}>
      <style>{CSS}</style>
      <a href="#main" className="lp-skip">Skip to content</a>
      <div className="lp-aurora"/>
      <div className="lp-cursor-glow"/>

      {waitlistBanner === 'confirmed' && (
        <div className="lp-banner lp-banner-success">
          <span>Your spot is secured. See you at launch.</span>
          <button className="lp-banner-close" aria-label="Dismiss notification" onClick={() => setWaitlistBanner(null)}>✕</button>
        </div>
      )}
      {waitlistBanner === 'invalid' && (
        <div className="lp-banner lp-banner-warning">
          <span>That link has expired. Enter your email again.</span>
          <button className="lp-banner-close" aria-label="Dismiss notification" onClick={() => setWaitlistBanner(null)}>✕</button>
        </div>
      )}

      <nav className="lp-nav">
        <button className="lp-logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <img src="/whistle-logo.svg" alt="Coach Macro" className="lp-logo-mark" />
          <div className="lp-logo-text"><span className="lp-logo-coach">Coach</span><span className="lp-logo-macro">Macro</span></div>
        </button>
        <div className="lp-nav-links">
          <a href="#everything" className="lp-nav-link">Features</a>
          <a href="#how" className="lp-nav-link">How It Works</a>
          <a href="#compare" className="lp-nav-link">Compare</a>
          <a href="#faq" className="lp-nav-link">FAQ</a>
          <a href="/about" className="lp-nav-link">About</a>
          <button className="lp-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'}>
            <ThemeToggleIcon mode={theme}/>{theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button className="lp-nav-cta" data-tilt onClick={startTrial}>Start Free Trial</button>
        </div>
      </nav>

      <main id="main">
      <section className="lp-hero">
        <div className="lp-hero-content">
          <h1 className="lp-hero-headline">
            Your food and<br/>
            your training<br/>
            finally <span className="red">talk.</span>
          </h1>
          <p className="lp-hero-sub">
            Everything you need: training that programs itself, nutrition that moves with it, recovery that knows when to pull you back. <strong>All in one app.</strong>
          </p>
          <div className="lp-hero-cta-group">
            <button className="lp-cta-btn" data-tilt onClick={startTrial}>
              Start Your 7-Day Free Trial <span className="arrow">→</span>
            </button>
            <span className="lp-hero-proof">
              then $12.99/mo or $49.99/yr · cancel anytime
            </span>
          </div>
        </div>

        <div className="lp-phone-wrap">
          <HeroPhone/>
          <div className="lp-float-pill tl" aria-hidden="true">
            <span className="dot" style={{background:'#00E676',color:'#00E676'}}/>
            <span>Recovery <strong>ready</strong></span>
          </div>
          <div className="lp-float-pill tr" aria-hidden="true">
            <span className="dot" style={{background:'#FF3B30',color:'#FF3B30'}}/>
            <span>Carbs up <strong>for the long run</strong></span>
          </div>
          <div className="lp-float-pill bl" aria-hidden="true">
            <span className="dot" style={{background:'#2979FF',color:'#2979FF'}}/>
            <span><strong>Week 1</strong> of 12</span>
          </div>
        </div>
      </section>

      <section className="lp-problem">
        <div className="lp-problem-grid" style={{maxWidth:1000,alignItems:'flex-start'}}>
          <div className="lp-problem-block fade-up" style={{textAlign:'left'}}>
            <div className="lp-problem-label">The real problem</div>
            <h2 className="lp-problem-lead">You're the app<br/>connecting all<br/>the <span className="red">other apps.</span></h2>
          </div>
          <div className="lp-problem-block fade-up" style={{textAlign:'left'}}>
            <p className="lp-problem-body">Recovery in one. Training in another. Food in a third. And every day, you're the one stitching it together in your head — push or rest, ate enough or didn't, is this even working.</p>
            <p className="lp-problem-body">You became the integration layer. That's not a job you signed up for. It's the whole reason this exists.</p>
          </div>
        </div>
      </section>

      {/* Conversion sequence: Hero → Problem → Solution → How → Trust → Screens → Features → Works → Pricing (comparison table now consolidated inside Pricing) → FAQ → Final CTA */}
      <SolutionSection/>
      <HowSection/>
      <TrustSection/>
      <KitchenSection/>
      <ScreensSection/>
      <FeatureDumpSection/>
      <WorksWithSection/>
      <CardsSection/>
      <PricingSection onStart={startTrial}/>
      <FaqSection/>
      <FinalCtaSection onStart={startTrial}/>

      </main>

      <footer className="lp-footer">
        <button className="lp-logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <img src="/whistle-logo.svg" alt="Coach Macro" className="lp-logo-mark" />
          <div className="lp-logo-text"><span className="lp-logo-coach">Coach</span><span className="lp-logo-macro">Macro</span></div>
        </button>
        <div className="lp-footer-links">
          {[['About','/about'],['FAQ','/faq'],['Privacy Policy','/privacy'],['Terms','/terms'],['Health Disclaimer','/health-disclaimer'],['Health Data Notice','/health-data-notice'],['Washington Privacy','/washington-privacy'],['California Privacy','/california-privacy'],['Support','/support']].map(([label,path]) => (
            <a key={path} href={path}>{label}</a>
          ))}
        </div>
        <div className="lp-footer-copy">© 2026 Coach Macro LLC. All rights reserved.</div>
        <button className="lp-motion-btn" onClick={() => setMotionOff(m => !m)} aria-pressed={motionOff}>{motionOff ? 'Motion: off' : 'Reduce motion'}</button>
      </footer>
    </div>
  );
}
