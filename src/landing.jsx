import React, { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,600;1,700;1,800;1,900&family=Inter:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --bg: #000000;
    --bg-card: rgba(255,255,255,0.02);
    --red: #E8341C;
    --red-glow: rgba(232,52,28,0.4);
    --red-border: rgba(232,52,28,0.18);
    --red-border-strong: rgba(232,52,28,0.4);
    --white: #FFFFFF;
    --white-dim: rgba(255,255,255,0.5);
    --white-faint: rgba(255,255,255,0.3);
    --white-border: rgba(255,255,255,0.06);
    --c-protein: #2979FF;
    --c-carbs: #00E676;
    --c-fat: #FFD740;
    --condensed: 'Barlow Condensed', 'Inter', sans-serif;
    --body: 'Inter', sans-serif;
    --mono: 'DM Mono', monospace;
  }

  .lp * { box-sizing: border-box; margin: 0; padding: 0; }
  .lp { background: var(--bg); color: var(--white); font-family: var(--body); overflow-x: hidden; -webkit-font-smoothing: antialiased; position: relative; }

  .lp-aurora { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .lp-aurora::before { content: ''; position: absolute; top: -40%; left: -20%; width: 80vw; height: 80vw; background: radial-gradient(ellipse at center, rgba(232,52,28,0.08), transparent 60%); animation: lp-aurora-drift 20s ease-in-out infinite; }
  .lp-aurora::after { content: ''; position: absolute; bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(ellipse at center, rgba(41,121,255,0.05), transparent 60%); animation: lp-aurora-drift 28s ease-in-out infinite reverse; }
  @keyframes lp-aurora-drift { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3%,2%) scale(1.04)} 66%{transform:translate(-2%,1%) scale(0.97)} }

  .lp-cursor-glow { position: fixed; top: 0; left: 0; width: 480px; height: 480px; border-radius: 50%; background: radial-gradient(circle, rgba(232,52,28,0.12) 0%, transparent 60%); pointer-events: none; z-index: 1; transform: translate3d(-50%,-50%,0); transition: opacity 0.4s; mix-blend-mode: screen; filter: blur(20px); opacity: 0; }
  .lp.cursor-active .lp-cursor-glow { opacity: 1; }

  /* NAV */
  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(0,0,0,0.7); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid var(--white-border); }
  .lp.has-banner .lp-nav { top: 48px; }
  .lp-logo { display: flex; align-items: center; gap: 12px; font-family: var(--condensed); font-weight: 800; font-size: 20px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--white); text-decoration: none; cursor: pointer; background: none; border: none; }
  .lp-logo-mark { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; display: block; box-shadow: 0 0 18px rgba(232,52,28,0.45), 0 0 2px rgba(232,52,28,0.6); }
  .lp-logo-text { display: flex; gap: 4px; align-items: baseline; }
  .lp-logo-coach { color: var(--white-dim); font-style: italic; font-weight: 400; }
  .lp-logo-macro { color: var(--white); font-weight: 800; }
  .lp-nav-links { display: flex; gap: 32px; align-items: center; }
  .lp-nav-link { color: var(--white); font-size: 13px; font-weight: 500; text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; background: none; border: none; cursor: pointer; font-family: var(--body); }
  .lp-nav-link:hover { color: var(--red); }
  .lp-nav-cta { font-family: var(--condensed); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red); background: transparent; border: 1px solid var(--red); padding: 9px 18px; border-radius: 4px; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
  .lp-nav-cta:hover { background: var(--red); color: var(--white); box-shadow: 0 0 30px var(--red-glow); }

  /* BANNERS */
  .lp-banner { position: fixed; top: 0; left: 0; right: 0; z-index: 300; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 13px 24px; font-size: 13px; font-weight: 500; text-align: center; line-height: 1.4; font-family: var(--body); }
  .lp-banner-success { background: rgba(34,197,94,0.14); border-bottom: 1px solid rgba(34,197,94,0.28); color: #22c55e; }
  .lp-banner-warning { background: rgba(245,158,11,0.14); border-bottom: 1px solid rgba(245,158,11,0.28); color: #f59e0b; }
  .lp-banner-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.55; font-size: 16px; line-height: 1; padding: 0; flex-shrink: 0; transition: opacity 0.15s; }
  .lp-banner-close:hover { opacity: 1; }

  /* SECTION GLOBALS */
  .lp section { position: relative; z-index: 2; }
  .lp-section-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red); margin-bottom: 16px; }
  .lp-section-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(48px, 6vw, 96px); line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-bottom: 64px; }
  .lp-section-title .accent { color: var(--red); }

  /* CTA BUTTON */
  .lp-cta-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--red); color: var(--white); font-family: var(--condensed); font-weight: 700; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; padding: 16px 28px; border-radius: 6px; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.3s; box-shadow: 0 0 30px var(--red-glow), 0 12px 40px rgba(0,0,0,0.6); position: relative; }
  .lp-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--red-glow), 0 16px 50px rgba(0,0,0,0.8); }
  .lp-cta-btn .arrow { transition: transform 0.2s; }
  .lp-cta-btn:hover .arrow { transform: translateX(4px); }

  /* HERO */
  .lp-hero { min-height: 100vh; padding: 120px 48px 80px; display: grid; grid-template-columns: minmax(0,1.2fr) minmax(0,1fr); gap: 80px; align-items: center; position: relative; max-width: 1400px; margin: 0 auto; z-index: 2; }
  .lp-hero-content { position: relative; z-index: 2; min-width: 0; }
  .lp-hero-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red); margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
  .lp-hero-eyebrow::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--red); box-shadow: 0 0 12px var(--red); animation: lp-pulse 2s infinite; flex-shrink: 0; }
  @keyframes lp-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
  .lp-hero-headline { font-family: var(--condensed); font-weight: 900; font-style: italic; font-size: clamp(48px,4.8vw,80px); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-bottom: 32px; }
  .lp-hero-headline .red { color: var(--red); position: relative; }
  .lp-hero-headline .red::after { content: ''; position: absolute; inset: -10% -8%; background: radial-gradient(ellipse at center,rgba(232,52,28,0.4),transparent 70%); z-index: -1; filter: blur(24px); }
  .lp-hero-sub { font-family: var(--body); font-size: 18px; line-height: 1.55; color: var(--white-dim); margin-bottom: 36px; max-width: 540px; }
  .lp-hero-sub strong { color: var(--white); font-weight: 600; }
  .lp-hero-cta-group { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .lp-hero-proof { font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; color: var(--white-faint); text-transform: uppercase; }
  .lp-hero-proof strong { color: var(--white); font-weight: 500; }

  /* PHONE */
  .lp-phone-wrap { position: relative; display: flex; justify-content: center; align-items: center; z-index: 2; }
  .lp-phone { position: relative; width: 340px; height: 690px; border-radius: 48px; background: #0a0e1a; overflow: hidden; box-shadow: 0 0 0 10px #1a1a1f, 0 0 0 11px #2a2a30, 0 0 80px rgba(232,52,28,0.22), 0 40px 80px rgba(0,0,0,0.9); animation: lp-float 6s ease-in-out infinite; }
  @keyframes lp-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .lp-phone-notch { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); width: 110px; height: 30px; background: #000; border-radius: 16px; z-index: 50; }
  .lp-phone-statusbar { position: absolute; top: 0; left: 0; right: 0; height: 48px; z-index: 40; display: flex; align-items: center; justify-content: space-between; padding: 16px 28px 0; font-family: -apple-system,sans-serif; font-weight: 600; font-size: 13px; color: var(--white); }
  .lp-phone-home { position: absolute; bottom: 7px; left: 50%; transform: translateX(-50%); width: 116px; height: 4px; background: rgba(245,245,240,0.85); border-radius: 3px; z-index: 60; }
  .lp-phone-screen { position: absolute; inset: 0; padding: 48px 0 26px; overflow: hidden; background-image: radial-gradient(ellipse at 30% 0%,rgba(232,52,28,0.06),transparent 50%); }
  .lp-float-pill { position: absolute; background: rgba(255,255,255,0.04); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border: 1px solid var(--red-border); border-radius: 999px; padding: 10px 16px; display: flex; align-items: center; gap: 10px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1),0 0 30px rgba(232,52,28,0.08),0 12px 40px rgba(0,0,0,0.6); font-family: var(--mono); font-size: 11px; color: var(--white); white-space: nowrap; z-index: 3; animation: lp-drift 5s ease-in-out infinite; }
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
  .dash-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#e8341c,#f59e0b); display: flex; align-items: center; justify-content: center; font-family: var(--condensed); font-weight: 800; font-size: 12px; color: var(--white); }
  .dash-quote { margin: 6px 18px 14px; background: rgba(245,245,240,0.03); border-radius: 14px; padding: 12px 14px; border-left: 2px solid var(--red); }
  .dash-quote-l { font-family: var(--mono); font-size: 8px; letter-spacing: 0.16em; color: var(--red); text-transform: uppercase; margin-bottom: 4px; }
  .dash-quote-t { font-family: var(--body); font-size: 11px; line-height: 1.45; color: var(--white); }
  .dash-session { margin: 0 18px 12px; padding: 14px; border-radius: 16px; background: linear-gradient(135deg,rgba(232,52,28,0.16),rgba(15,22,40,0.6)); border: 1px solid rgba(232,52,28,0.28); position: relative; overflow: hidden; }
  .dash-session::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; background: radial-gradient(circle,rgba(232,52,28,0.18),transparent 65%); pointer-events: none; }
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
  .lp-problem-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; color: var(--red); text-transform: uppercase; margin-bottom: 24px; }
  .lp-problem-text { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(44px,5.4vw,86px); line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); }
  .lp-problem-text.dim { color: var(--white-faint); }
  .lp-problem-resolution { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(56px,7vw,110px); line-height: 0.9; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-top: 24px; }
  .lp-problem-resolution .red { color: var(--red); text-shadow: 0 0 40px rgba(232,52,28,0.6); }
  .lp-problem-divider { width: 1px; height: 60px; background: var(--red-border-strong); margin: 0 auto; }

  /* BENTO */
  .lp-bento { padding: 140px 48px; }
  .lp-bento-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; max-width: 1280px; margin: 0 auto; }
  .lp-tile { background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 24px; padding: 32px; position: relative; overflow: hidden; transition: transform 0.4s cubic-bezier(.2,.7,.3,1),border-color 0.3s,box-shadow 0.3s; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(232,52,28,0.04); display: flex; flex-direction: column; }
  .lp-tile:hover { border-color: var(--red-border-strong); transform: translateY(-4px); box-shadow: 0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(232,52,28,0.12); }
  .lp-tile::before { content: ''; position: absolute; top: 0; right: 0; width: 200px; height: 200px; background: radial-gradient(circle,rgba(232,52,28,0.08),transparent 70%); pointer-events: none; }
  .lp-tile.span2 { grid-column: span 2; }
  .lp-tile.span3 { grid-column: span 3; }
  .lp-tile-eye { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red); margin-bottom: 14px; }
  .lp-tile-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 32px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; color: var(--white); margin-bottom: 12px; }
  .lp-tile.span2 .lp-tile-title, .lp-tile.span3 .lp-tile-title { font-size: 40px; }
  .lp-tile-body { color: var(--white-dim); font-size: 14px; line-height: 1.55; }
  .lp-tile-stat { font-family: var(--mono); font-size: 11px; color: var(--white); letter-spacing: 0.04em; margin-top: auto; padding-top: 20px; border-top: 1px solid var(--white-border); }
  .lp-tile-bignum { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 120px; line-height: 0.9; letter-spacing: -0.04em; color: var(--red); text-shadow: 0 0 40px rgba(232,52,28,0.5); margin: 24px 0 8px; }
  .lp-ring-wrap { display: flex; align-items: center; gap: 32px; margin: 24px 0; }
  .lp-ring { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
  .lp-ring-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 78px; height: 78px; border-radius: 50%; background: radial-gradient(circle,#050505 60%,rgba(5,5,5,0.85) 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 2; }
  .lp-ring-cal { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 26px; line-height: 1; color: var(--white); }
  .lp-ring-of { font-family: var(--mono); font-size: 8px; letter-spacing: 0.08em; color: var(--white-dim); margin-top: 4px; text-transform: uppercase; text-align: center; white-space: nowrap; }
  .lp-ring-legend { flex: 1; display: flex; flex-direction: column; gap: 10px; }
  .lp-leg-row { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-size: 11px; }
  .lp-leg-dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }
  .lp-ai-msg { font-family: var(--mono); font-size: 11px; color: var(--white); background: rgba(232,52,28,0.06); border: 1px solid var(--red-border); border-radius: 8px; padding: 10px 12px; margin: 16px 0 10px; line-height: 1.5; }
  .lp-ai-msg-l { color: var(--red); letter-spacing: 0.16em; font-size: 9px; text-transform: uppercase; margin-bottom: 4px; }
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
  .lp-how-card { background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 24px; padding: 40px 32px; position: relative; overflow: hidden; transition: transform 0.4s cubic-bezier(.2,.7,.3,1),border-color 0.3s,box-shadow 0.3s; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(232,52,28,0.04); }
  .lp-how-card:hover { transform: translateY(-4px); border-color: var(--red-border-strong); box-shadow: 0 24px 80px rgba(0,0,0,0.9),0 0 60px rgba(232,52,28,0.12); }
  .lp-how-num { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 88px; line-height: 0.9; color: var(--red); letter-spacing: -0.04em; margin-bottom: 24px; text-shadow: 0 0 30px rgba(232,52,28,0.4); }
  .lp-how-step { font-family: var(--mono); font-size: 10px; letter-spacing: 0.2em; color: var(--red); text-transform: uppercase; margin-bottom: 12px; }
  .lp-how-title { font-family: var(--condensed); font-weight: 800; font-size: 26px; line-height: 1.05; text-transform: uppercase; letter-spacing: -0.01em; color: var(--white); margin-bottom: 14px; }
  .lp-how-body { color: var(--white-dim); font-size: 14px; line-height: 1.6; }
  .lp-how-body strong { color: var(--white); font-weight: 600; }

  /* COMPARE */
  .lp-compare { padding: 140px 48px; }
  .lp-compare-inner { max-width: 1100px; margin: 0 auto; }
  .lp-compare-table { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid rgba(232,52,28,0.2); border-radius: 16px; overflow: hidden; background: var(--bg); }
  .lp-compare-table th,.lp-compare-table td { padding: 18px 20px; text-align: left; border-bottom: 1px solid var(--white-border); font-size: 14px; }
  .lp-compare-table tr:last-child td { border-bottom: none; }
  .lp-compare-table th { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; background: #0a0a0a; border-bottom: 1px solid rgba(232,52,28,0.2); }
  .lp-compare-table th.col-other { color: var(--white-dim); text-align: center; width: 17%; }
  .lp-compare-table th.col-cm { background: var(--bg); color: var(--red); font-weight: 700; text-align: center; width: 17%; text-shadow: 0 0 10px rgba(232,52,28,0.4); }
  .lp-compare-table td { color: var(--white); font-family: var(--body); font-size: 13px; }
  .lp-compare-table td.col-other { text-align: center; background: #0a0a0a; color: rgba(255,255,255,0.3); }
  .lp-compare-table td.col-cm { text-align: center; }
  .lp-compare-note { text-align: center; margin-top: 24px; font-family: var(--mono); font-size: 10px; color: var(--white-faint); letter-spacing: 0.08em; text-transform: uppercase; }
  .lp-cross { color: rgba(255,255,255,0.18); font-size: 16px; }
  .lp-check { color: var(--red); font-size: 18px; font-weight: 700; text-shadow: 0 0 10px var(--red-glow); }

  /* SCREENS */
  .lp-screens { padding: 140px 0 140px 48px; }
  .lp-screens-head { padding-right: 48px; margin-bottom: 32px; }
  .lp-featured { margin: 0 48px 48px 0; background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 24px; padding: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(232,52,28,0.06); position: relative; overflow: hidden; max-width: 1200px; }
  .lp-featured::before { content: ''; position: absolute; top: 0; right: 0; width: 400px; height: 400px; background: radial-gradient(circle,rgba(232,52,28,0.1),transparent 70%); pointer-events: none; }
  .lp-feat-eye { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; color: var(--red); text-transform: uppercase; margin-bottom: 12px; }
  .lp-feat-title { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 44px; line-height: 1; text-transform: uppercase; letter-spacing: -0.02em; color: var(--white); margin-bottom: 16px; }
  .lp-feat-body { color: var(--white-dim); font-size: 15px; line-height: 1.6; margin-bottom: 20px; }
  .lp-scroll { display: flex; gap: 24px; overflow-x: auto; padding: 24px 0 32px; cursor: grab; scrollbar-width: none; }
  .lp-scroll::-webkit-scrollbar { display: none; }
  .lp-sphone { flex-shrink: 0; width: 300px; height: 620px; background: #0a0e1a; border-radius: 44px; overflow: hidden; position: relative; box-shadow: 0 0 0 9px #1a1a1f,0 0 0 10px #2a2a30,0 0 60px rgba(232,52,28,0.16),0 30px 60px rgba(0,0,0,0.9); user-select: none; }
  .lp-sphone-notch { position: absolute; top: 9px; left: 50%; transform: translateX(-50%); width: 96px; height: 26px; background: #000; border-radius: 14px; z-index: 50; }
  .lp-sphone-bar { position: absolute; top: 0; left: 0; right: 0; height: 42px; z-index: 40; display: flex; align-items: center; justify-content: space-between; padding: 14px 24px 0; font-family: -apple-system,sans-serif; font-weight: 600; font-size: 12px; color: var(--white); }
  .lp-sphone-home { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); width: 100px; height: 4px; background: rgba(245,245,240,0.85); border-radius: 3px; z-index: 60; }
  .lp-sphone-body { padding: 42px 0 22px; height: 100%; overflow: hidden; background-image: radial-gradient(ellipse at 30% 0%,rgba(232,52,28,0.05),transparent 50%); }
  .lp-pscr-head { padding: 12px 18px 8px; display: flex; align-items: flex-end; justify-content: space-between; }
  .lp-pscr-eye { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; color: var(--red); text-transform: uppercase; margin-bottom: 4px; }
  .lp-pscr-h1 { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: 26px; line-height: 1; color: var(--white); text-transform: uppercase; letter-spacing: -0.01em; }

  /* PROOF */
  .lp-proof { padding: 140px 48px; border-top: 1px solid var(--white-border); }
  .lp-proof-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; max-width: 1100px; margin: 0 auto 80px; }
  .lp-proof-stat { text-align: center; padding: 32px 24px; background: rgba(255,255,255,0.02); border: 1px solid var(--red-border); border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(232,52,28,0.04); }
  .lp-proof-num { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(60px,7vw,100px); line-height: 0.9; color: var(--white); letter-spacing: -0.03em; margin-bottom: 8px; }
  .lp-proof-num .red { color: var(--red); text-shadow: 0 0 30px rgba(232,52,28,0.5); }
  .lp-proof-lbl { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; color: var(--white-dim); text-transform: uppercase; line-height: 1.5; }
  .lp-testi-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; max-width: 1280px; margin: 0 auto; }
  .lp-testi { background: rgba(255,255,255,0.02); backdrop-filter: blur(20px); border: 1px solid var(--red-border); border-radius: 18px; padding: 28px; transition: transform 0.35s,border-color 0.3s; box-shadow: 0 20px 60px rgba(0,0,0,0.9),0 0 40px rgba(232,52,28,0.04); }
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
  .lp-faq-q:hover { color: var(--red); }
  .lp-faq-icon { font-family: var(--mono); font-size: 24px; color: var(--red); font-weight: 300; transition: transform 0.3s; flex-shrink: 0; margin-left: 16px; }
  .lp-faq-item.open .lp-faq-icon { transform: rotate(45deg); }
  .lp-faq-a { max-height: 0; overflow: hidden; transition: max-height 0.4s ease,padding 0.3s; color: var(--white-dim); font-size: 15px; line-height: 1.7; }
  .lp-faq-item.open .lp-faq-a { max-height: 320px; padding-bottom: 24px; }

  /* WAITLIST */
  .lp-waitlist { padding: 160px 48px; text-align: center; position: relative; overflow: hidden; background: radial-gradient(ellipse at center,#1a0008 0%,#000000 70%); }
  .lp-waitlist::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 50%,rgba(232,52,28,0.15),transparent 50%); pointer-events: none; }
  .lp-waitlist-inner { max-width: 720px; margin: 0 auto; position: relative; z-index: 2; }
  .lp-wl-hl { font-family: var(--condensed); font-style: italic; font-weight: 900; font-size: clamp(80px,10vw,160px); line-height: 0.9; letter-spacing: -0.04em; text-transform: uppercase; color: var(--white); margin-bottom: 32px; text-shadow: 0 0 80px rgba(232,52,28,0.4); }
  .lp-wl-sub { font-size: 18px; line-height: 1.55; color: var(--white-dim); margin-bottom: 16px; }
  .lp-wl-sub strong { color: var(--white); }
  .lp-wl-counter { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; background: rgba(255,255,255,0.04); border: 1px solid var(--red-border); border-radius: 999px; font-family: var(--mono); font-size: 13px; color: var(--white); letter-spacing: 0.06em; margin-bottom: 40px; }
  .lp-wl-counter::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--red); box-shadow: 0 0 12px var(--red); animation: lp-pulse 1.5s infinite; }
  .lp-wl-form { display: grid; grid-template-columns: 1fr 1.5fr; gap: 12px; margin-bottom: 16px; }
  .lp-wl-input { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1); color: var(--white); padding: 18px 20px; border-radius: 8px; font-family: var(--body); font-size: 15px; transition: border-color 0.2s,box-shadow 0.2s; outline: none; width: 100%; }
  .lp-wl-input::placeholder { color: var(--white-faint); }
  .lp-wl-input:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(232,52,28,0.15),0 0 30px rgba(232,52,28,0.3); }
  .lp-wl-btn { background: var(--red); color: var(--white); border: none; border-radius: 8px; padding: 16px 28px; font-family: var(--condensed); font-weight: 700; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 30px var(--red-glow); transition: transform 0.2s,box-shadow 0.3s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; grid-column: 1/-1; }
  .lp-wl-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--red-glow); }
  .lp-wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lp-wl-fine { font-family: var(--mono); font-size: 11px; color: var(--white-faint); letter-spacing: 0.06em; margin-top: 16px; }
  .lp-wl-err { font-family: var(--mono); font-size: 12px; color: var(--red); letter-spacing: 0.06em; margin-top: 8px; }
  @keyframes lp-spin { to{transform:rotate(360deg)} }
  .lp-spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: lp-spin 0.7s linear infinite; }

  /* FOOTER */
  .lp-footer { padding: 32px 48px; border-top: 1px solid rgba(232,52,28,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; position: relative; z-index: 2; }
  .lp-footer-copy { font-family: var(--mono); font-size: 11px; color: var(--white-faint); letter-spacing: 0.04em; }
  .lp-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .lp-footer-links a { font-size: 12px; color: var(--white-dim); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; }
  .lp-footer-links a:hover { color: var(--red); }

  .lp .fade-up { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease,transform 0.8s cubic-bezier(.2,.7,.3,1); }
  .lp .fade-up.visible { opacity: 1; transform: translateY(0); }

  @media (max-width: 980px) {
    .lp-hero { grid-template-columns: 1fr; gap: 40px; padding: 100px 24px 60px; }
    .lp-phone-wrap { transform: scale(0.85); }
    .lp-float-pill { display: none; }
    .lp-bento-grid,.lp-how-grid,.lp-proof-stats,.lp-testi-grid { grid-template-columns: 1fr; }
    .lp-tile.span2,.lp-tile.span3 { grid-column: span 1; }
    .lp-featured,.lp-split-content { grid-template-columns: 1fr; }
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
`;

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

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    container.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

    return () => {
      window.removeEventListener('mousemove', onMove);
      tilts.forEach(({ el, move, leave }) => { el.removeEventListener('mousemove', move); el.removeEventListener('mouseleave', leave); });
      obs.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

function MuscleMini() {
  return (
    <svg width="80" height="130" viewBox="0 0 60 100" style={{display:'block',margin:'0 auto'}}>
      <ellipse cx="30" cy="8" rx="7" ry="8" fill="rgba(255,255,255,0.1)"/>
      <rect x="26" y="15" width="8" height="5" fill="rgba(255,255,255,0.1)"/>
      <rect x="14" y="20" width="32" height="26" rx="3" fill="#E8341C"/>
      <rect x="16" y="46" width="28" height="20" rx="2" fill="rgba(255,255,255,0.08)"/>
      <ellipse cx="11" cy="22" rx="7" ry="6" fill="#E8341C" opacity="0.85"/>
      <ellipse cx="49" cy="22" rx="7" ry="6" fill="#E8341C" opacity="0.85"/>
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
      <div className="lp-phone-notch"/>
      <div className="lp-phone-statusbar">
        <span>9:41</span>
        <PhoneStatusIcons/>
      </div>
      <div className="lp-phone-screen">
        <div className="dash-header">
          <div>
            <div className="dash-eyebrow">// Tuesday, Push Day</div>
            <div className="dash-h1">Welcome,<br/>Alex</div>
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <div className="dash-icon-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg></div>
            <div className="dash-avatar">A</div>
          </div>
        </div>
        <div className="dash-quote">
          <div className="dash-quote-l">// Coach</div>
          <div className="dash-quote-t"><strong>Push Day at 5pm.</strong> Carbs are up 65g — hit them in the next 2 meals to fuel the session.</div>
        </div>
        <div className="dash-session">
          <div className="dash-session-row">
            <div>
              <div style={{fontFamily:'var(--mono)',fontSize:8,letterSpacing:'0.16em',color:'var(--red)',textTransform:'uppercase',marginBottom:5}}>// Today's Session · 5:00 PM</div>
              <div className="dash-session-title">Upper<br/>Hypertrophy A</div>
            </div>
            <div className="dash-session-tag">Ready</div>
          </div>
          <div className="dash-session-stats">
            <div><div className="dash-stat-l">Exercises</div><div className="dash-stat-v">6</div></div>
            <div><div className="dash-stat-l">Est. Time</div><div className="dash-stat-v">58<span style={{fontSize:9,color:'rgba(245,245,240,0.55)',marginLeft:2}}>min</span></div></div>
            <div><div className="dash-stat-l">PRs Ready</div><div className="dash-stat-v" style={{color:'var(--red)'}}>2</div></div>
          </div>
          <button className="dash-start-btn">▶ Start Session</button>
        </div>
        <div className="dash-rings">
          <div className="dash-ring-card">
            <div className="dash-ring-l">// Fuel Today</div>
            <div className="dash-ring-wrap">
              <svg width="76" height="76" viewBox="0 0 76 76" style={{transform:'rotate(-90deg)'}}>
                <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(245,245,240,0.06)" strokeWidth="6"/>
                <circle cx="38" cy="38" r="32" fill="none" stroke="#e8341c" strokeWidth="6" strokeDasharray="86 201" strokeLinecap="round" style={{filter:'drop-shadow(0 0 4px #e8341c)'}}/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div className="dash-ring-num">1,393</div>
                <div className="dash-ring-sub">of 3,240</div>
              </div>
            </div>
            <div className="dash-ring-foot" style={{color:'#22c55e'}}>1,847 kcal left</div>
          </div>
          <div className="dash-ring-card">
            <div className="dash-ring-l">// Train Week</div>
            <div className="dash-ring-wrap">
              <svg width="76" height="76" viewBox="0 0 76 76" style={{transform:'rotate(-90deg)'}}>
                <circle cx="38" cy="38" r="32" fill="none" stroke="rgba(245,245,240,0.06)" strokeWidth="6"/>
                <circle cx="38" cy="38" r="32" fill="none" stroke="#60a5fa" strokeWidth="6" strokeDasharray="100 201" strokeLinecap="round" style={{filter:'drop-shadow(0 0 4px #60a5fa)'}}/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div className="dash-ring-num">2/4</div>
                <div className="dash-ring-sub">sessions</div>
              </div>
            </div>
            <div className="dash-ring-foot" style={{color:'#60a5fa'}}>Week 6 · on track</div>
          </div>
        </div>
        <div className="dash-week">
          {[
            {d:'M',l:'PULL',bg:'rgba(34,197,94,0.12)',bc:'rgba(34,197,94,0.3)',c:'#22c55e'},
            {d:'T',l:'PUSH',bg:'rgba(232,52,28,0.18)',bc:'rgba(232,52,28,0.5)',c:'var(--red)'},
            {d:'W',l:'PULL',bg:'#0f1628',bc:'rgba(245,245,240,0.08)',c:'rgba(245,245,240,0.6)'},
            {d:'T',l:'LEGS',bg:'#0f1628',bc:'rgba(245,245,240,0.08)',c:'rgba(245,245,240,0.6)'},
            {d:'F',l:'REST',bg:'rgba(245,245,240,0.04)',bc:'rgba(245,245,240,0.08)',c:'rgba(245,245,240,0.4)'},
            {d:'S',l:'COND',bg:'#0f1628',bc:'rgba(245,245,240,0.08)',c:'rgba(245,245,240,0.6)'},
            {d:'S',l:'REST',bg:'rgba(245,245,240,0.04)',bc:'rgba(245,245,240,0.08)',c:'rgba(245,245,240,0.4)'},
          ].map((day,i) => (
            <div key={i} className="dash-week-day" style={{background:day.bg,borderColor:day.bc}}>
              <div className="dash-week-d">{day.d}</div>
              <div className="dash-week-l" style={{color:day.c}}>{day.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="lp-phone-home"/>
    </div>
  );
}

function BentoSection() {
  const r = 84, c = 2 * Math.PI * r;
  return (
    <section className="lp-bento" id="features">
      <div style={{maxWidth:1280,margin:'0 auto 64px'}}>
        <div className="lp-section-eyebrow">// The System</div>
        <h2 className="lp-section-title">Every other app<br/>misses <span className="accent">this.</span></h2>
      </div>
      <div className="lp-bento-grid">
        <div className="lp-tile span2 fade-up">
          <div className="lp-tile-eye">// Adaptive Macros</div>
          <div className="lp-tile-title">Dynamic Macros</div>
          <div className="lp-tile-body">Your macros change every morning based on whether you train today. Not static targets — a system that responds to load.</div>
          <div className="lp-ring-wrap">
            <div className="lp-ring">
              <svg width="180" height="180" viewBox="0 0 180 180" style={{transform:'rotate(-90deg)'}}>
                <circle cx="90" cy="90" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8"/>
                <circle cx="90" cy="90" r={r} fill="none" stroke="#2979FF" strokeWidth="8"
                  strokeDasharray={`${0.32*c} ${c}`} strokeLinecap="round" style={{filter:'drop-shadow(0 0 8px #2979FF)'}}/>
                <circle cx="90" cy="90" r={r-11} fill="none" stroke="#00E676" strokeWidth="7"
                  strokeDasharray={`${0.55*2*Math.PI*(r-11)} ${2*Math.PI*(r-11)}`} strokeLinecap="round" style={{filter:'drop-shadow(0 0 8px #00E676)'}}/>
                <circle cx="90" cy="90" r={r-22} fill="none" stroke="#FFD740" strokeWidth="7"
                  strokeDasharray={`${0.74*2*Math.PI*(r-22)} ${2*Math.PI*(r-22)}`} strokeLinecap="round" style={{filter:'drop-shadow(0 0 8px #FFD740)'}}/>
              </svg>
              <div className="lp-ring-center">
                <div className="lp-ring-cal">2,847</div>
                <div className="lp-ring-of">today's target</div>
              </div>
            </div>
            <div className="lp-ring-legend">
              <div className="lp-leg-row"><span className="lp-leg-dot" style={{background:'#2979FF',color:'#2979FF'}}/><span>PROTEIN <span style={{color:'var(--white-dim)',marginLeft:8}}>195g</span></span></div>
              <div className="lp-leg-row"><span className="lp-leg-dot" style={{background:'#00E676',color:'#00E676'}}/><span>CARBS <span style={{color:'var(--white-dim)',marginLeft:8}}>340g</span></span></div>
              <div className="lp-leg-row"><span className="lp-leg-dot" style={{background:'#FFD740',color:'#FFD740'}}/><span>FAT <span style={{color:'var(--white-dim)',marginLeft:8}}>78g</span></span></div>
            </div>
          </div>
          <div className="lp-tile-stat">Training day: <strong style={{color:'var(--red)'}}>2,847 kcal</strong> · Rest day: <strong>1,800 kcal</strong></div>
        </div>

        <div className="lp-tile fade-up">
          <div className="lp-tile-eye">// Workouts Earn Calories</div>
          <div className="lp-tile-bignum">+312</div>
          <div className="lp-tile-body">calories earned from today's session — automatically added to your daily budget the moment you finish.</div>
        </div>

        <div className="lp-tile fade-up">
          <div className="lp-tile-eye">// Restaurant AI</div>
          <div className="lp-tile-title">Eat Out, Stay In Budget</div>
          <div className="lp-ai-msg">
            <div className="lp-ai-msg-l">// REMAINING</div>
            412 kcal · 38g protein
          </div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--white-dim)',marginTop:8}}><strong style={{color:'var(--white)',fontWeight:500}}>Chipotle</strong> → Burrito Bowl, chicken, no rice</div>
        </div>

        <div className="lp-tile fade-up">
          <div className="lp-tile-eye">// Recovery Map</div>
          <div className="lp-tile-title">Muscle Recovery</div>
          <div style={{display:'flex',justifyContent:'center',margin:'12px 0'}}><MuscleMini/></div>
          <div style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--white)',textAlign:'center',letterSpacing:'0.04em'}}><span style={{color:'var(--red)'}}>Red</span> = optimal volume this week</div>
        </div>

        <div className="lp-tile fade-up">
          <div className="lp-tile-eye">// Auto-Tracked</div>
          <div className="lp-tile-title">Progressive Overload</div>
          <div className="lp-overload-card">
            <div className="lp-overload-arr">↑</div>
            <div>
              <div className="lp-overload-name">Bench Press</div>
              <div className="lp-overload-delta">+5lbs from last week</div>
            </div>
          </div>
          <div className="lp-tile-body">Automatically tracked every session. Every set. Every rep.</div>
        </div>

        <div className="lp-tile span3 fade-up">
          <div className="lp-tile-eye">// One System</div>
          <div className="lp-tile-title">Train + Fuel. One System.</div>
          <div className="lp-tile-body" style={{maxWidth:720}}>Most apps treat food and fitness as two separate problems. They're not.</div>
          <div className="lp-split-content">
            <div className="lp-split-half">
              <div className="lp-split-lbl">// FUEL</div>
              <div className="lp-split-hl">Today's Plate</div>
              <div className="lp-split-row"><span className="l">Calorie target</span><span className="v">3,240 kcal</span></div>
              <div className="lp-split-row"><span className="l">Carbs (push day)</span><span className="v" style={{color:'#00E676'}}>↑ +65g</span></div>
              <div className="lp-split-row"><span className="l">Logged so far</span><span className="v">1,393 kcal</span></div>
              <div className="lp-split-row"><span className="l">Workout bonus</span><span className="v" style={{color:'var(--red)'}}>+312 kcal</span></div>
            </div>
            <div className="lp-split-div"/>
            <div className="lp-split-half">
              <div className="lp-split-lbl">// TRAIN</div>
              <div className="lp-split-hl">Today's Session</div>
              <div className="lp-split-row"><span className="l">Block</span><span className="v">Upper Hypertrophy A</span></div>
              <div className="lp-split-row"><span className="l">Volume target</span><span className="v">12,400 kg</span></div>
              <div className="lp-split-row"><span className="l">Est. session burn</span><span className="v" style={{color:'#00E676'}}>632 kcal</span></div>
              <div className="lp-split-row"><span className="l">PRs queued</span><span className="v" style={{color:'var(--red)'}}>2 ready</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  const cards = [
    {n:'01',step:'Step One',title:'Build Your Profile',body:<>Three minutes. 25 data points. We calculate your <strong>exact metabolic rate</strong> — 8% more accurate than standard equations. This is the foundation everything else builds on.</>},
    {n:'02',step:'Step Two',title:'App Adapts Daily',body:<>Training day? <strong>Carbs go up.</strong> Rest day? Budget drops. Just finished a workout? Calories adjust in real time. Your plan changes before you even log your first meal.</>},
    {n:'03',step:'Step Three',title:'Track Everything',body:<>Food. Lifts. Sets. PRs. Recovery. Progress. <strong>One place. One system.</strong> Finally. No more switching between apps that don't know the other exists.</>},
  ];
  return (
    <section className="lp-how" id="how">
      <div style={{maxWidth:1280,margin:'0 auto 64px'}}>
        <div className="lp-section-eyebrow">// Three Steps</div>
        <h2 className="lp-section-title">The system.</h2>
      </div>
      <div className="lp-how-grid">
        {cards.map(card => (
          <div className="lp-how-card fade-up" key={card.n}>
            <div className="lp-how-num">{card.n}</div>
            <div className="lp-how-step">// {card.step}</div>
            <div className="lp-how-title">{card.title}</div>
            <div className="lp-how-body">{card.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompareSection() {
  const features = [
    'Adapts macros to training day','Adjusts calories post-workout','Muscle recovery tracking',
    'Unified food + lifting log','Real-time TDEE calculation','AI restaurant & food scan',
    'Periodized training plans','RPE-based load adjustment','Sleep & recovery integration',
    'Progress + body comp tracking',
  ];
  return (
    <section className="lp-compare" id="compare">
      <div className="lp-compare-inner">
        <div className="lp-section-eyebrow">// The Difference</div>
        <h2 className="lp-section-title fade-up">How we<br/>stack up.</h2>
        <table className="lp-compare-table">
          <thead>
            <tr>
              <th></th>
              <th className="col-other">MyFitnessPal /<br/>Cronometer</th>
              <th className="col-other">Strong /<br/>Hevy</th>
              <th className="col-cm">CoachMacro</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f,i) => (
              <tr key={i}>
                <td>{f}</td>
                <td className="col-other"><span className="lp-cross">✕</span></td>
                <td className="col-other"><span className="lp-cross">✕</span></td>
                <td className="col-cm"><span className="lp-check">✓</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="lp-compare-note">Based on publicly available information · 2026</div>
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
            <div className="lp-pscr-eye">// {eyebrow}</div>
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

function ScreensSection() {
  const scrollRef = useRef(null);
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
        <div className="lp-section-eyebrow">// The Product</div>
        <h2 className="lp-section-title">Built for athletes<br/>who <span className="accent">mean it.</span></h2>
      </div>

      <div className="lp-featured fade-up">
        <div>
          <div className="lp-feat-eye">// Featured · Restaurant AI</div>
          <div className="lp-feat-title">Order anything. Stay on plan.</div>
          <div className="lp-feat-body">Snap a menu. The AI tells you exactly what to order to hit your remaining macros. Works at 50,000+ chains and any photographed menu.</div>
          <div className="lp-ai-msg" style={{margin:0}}>
            <div className="lp-ai-msg-l">// COACH ANALYSIS</div>
            You're 44g of protein short. Order the grilled salmon — it's 42g. Skip the fries, get the side salad. Stays in budget.
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{fontFamily:'var(--mono)',fontSize:10,letterSpacing:'0.16em',color:'var(--white-faint)',textTransform:'uppercase',marginBottom:4}}>Detected: Nobu Restaurant</div>
          {[
            {name:'Grilled Salmon',macros:'42P · 0C · 18F',go:true},
            {name:'Edamame',macros:'11P · 8C · 5F',go:true},
            {name:'Miso Soup',macros:'3P · 4C · 1F',go:true},
            {name:'Side Salad',macros:'2P · 6C · 8F',go:true},
            {name:'Truffle Fries',macros:'6P · 58C · 22F',go:false},
          ].map(f => (
            <div key={f.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',background:f.go?'rgba(0,230,118,0.04)':'rgba(255,255,255,0.02)',border:`1px solid ${f.go?'rgba(0,230,118,0.15)':'var(--white-border)'}`,borderRadius:10,opacity:f.go?1:0.5}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{color:f.go?'#00E676':'var(--white-faint)',fontFamily:'var(--mono)',fontSize:14}}>{f.go?'✓':'✕'}</span>
                <span style={{fontSize:13,color:'var(--white)'}}>{f.name}</span>
              </div>
              <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--white-dim)',letterSpacing:'0.04em'}}>{f.macros}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="lp-scroll" ref={scrollRef}>
        <ScreenPhone eyebrow="Fuel · Tuesday" title={<>Today's<br/>Plate</>} headerRight={<div style={{padding:'4px 8px',background:'rgba(34,197,94,0.18)',borderRadius:5,fontFamily:'var(--mono)',fontSize:8,letterSpacing:'0.12em',color:'#22c55e',textTransform:'uppercase'}}>On Track</div>}>
          <div style={{padding:'4px 18px 14px'}}>
            <div style={{position:'relative',margin:'8px auto 14px',width:160,height:160}}>
              <svg width="160" height="160" viewBox="0 0 160 160" style={{transform:'rotate(-90deg)'}}>
                <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(245,245,240,0.06)" strokeWidth="10"/>
                <circle cx="80" cy="80" r="64" fill="none" stroke="#e8341c" strokeWidth="10" strokeDasharray="173 402" strokeLinecap="round" style={{filter:'drop-shadow(0 0 8px #e8341c)'}}/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:8,letterSpacing:'0.16em',color:'rgba(245,245,240,0.55)',textTransform:'uppercase',marginBottom:4}}>Eaten</div>
                <div style={{fontFamily:'var(--condensed)',fontStyle:'italic',fontWeight:900,fontSize:34,color:'var(--white)',lineHeight:1}}>1,393</div>
                <div style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.55)',marginTop:4}}>of 3,240 kcal</div>
              </div>
            </div>
            {[
              {l:'Protein',val:'142',target:'195g',c:'#60a5fa',pct:73},
              {l:'Carbs',val:'186',target:'320g',c:'#22c55e',pct:58},
              {l:'Fat',val:'58',target:'78g',c:'#fbbf24',pct:74},
            ].map(m => (
              <div key={m.l} style={{marginBottom:9}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:4,fontFamily:'var(--mono)',fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase'}}>
                  <span style={{color:m.c}}>{m.l}</span>
                  <span style={{color:'var(--white)'}}>{m.val}<span style={{color:'rgba(245,245,240,0.45)'}}>/{m.target}</span></span>
                </div>
                <div style={{height:4,background:'rgba(245,245,240,0.06)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${m.pct}%`,background:m.c,boxShadow:`0 0 6px ${m.c}`}}/>
                </div>
              </div>
            ))}
          </div>
        </ScreenPhone>

        <ScreenPhone eyebrow="Train · Push Day" title={<>Upper<br/>Hyper. A</>} headerRight={<div style={{padding:'4px 8px',background:'rgba(232,52,28,0.18)',borderRadius:5,fontFamily:'var(--mono)',fontSize:8,letterSpacing:'0.12em',color:'var(--red)',textTransform:'uppercase'}}>Wk 6 · D2</div>}>
          <div style={{padding:'4px 18px 14px'}}>
            <div style={{display:'flex',justifyContent:'center',margin:'4px 0 10px'}}><MuscleMini/></div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {[
                {name:'Bench Press',sets:'4×8',tag:'PR',tagC:'var(--red)'},
                {name:'Incline DB Press',sets:'3×10',tag:'+5kg',tagC:'#22c55e'},
                {name:'Cable Fly',sets:'3×12',tag:null},
                {name:'Overhead Press',sets:'4×8',tag:'PR',tagC:'var(--red)'},
                {name:'Lateral Raise',sets:'3×15',tag:null},
              ].map((e,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',background:'rgba(245,245,240,0.03)',borderRadius:9,border:'1px solid rgba(245,245,240,0.06)'}}>
                  <span style={{fontFamily:'var(--mono)',fontSize:8,color:'var(--red)',width:14}}>{String(i+1).padStart(2,'0')}</span>
                  <span style={{flex:1,fontSize:11,color:'var(--white)',fontWeight:500}}>{e.name}</span>
                  <span style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.55)'}}>{e.sets}</span>
                  {e.tag && <span style={{fontFamily:'var(--mono)',fontSize:8,color:e.tagC,padding:'2px 5px',background:e.tagC==='var(--red)'?'rgba(232,52,28,0.18)':'rgba(34,197,94,0.18)',borderRadius:4,letterSpacing:'0.08em'}}>{e.tag}</span>}
                </div>
              ))}
            </div>
          </div>
        </ScreenPhone>

        <ScreenPhone eyebrow="Active · Set 3 of 4" title="Bench Press" headerRight={<div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 8px',background:'rgba(232,52,28,0.18)',borderRadius:5,border:'1px solid rgba(232,52,28,0.4)'}}><span style={{width:5,height:5,borderRadius:'50%',background:'var(--red)',boxShadow:'0 0 6px var(--red)',animation:'lp-pulse 1.5s infinite'}}/><span style={{fontFamily:'var(--mono)',fontSize:8,color:'var(--white)',letterSpacing:'0.1em'}}>LIVE</span></div>}>
          <div style={{padding:'4px 18px 14px'}}>
            <div style={{textAlign:'center',padding:'14px 0 16px',borderBottom:'1px solid rgba(245,245,240,0.06)',marginBottom:14}}>
              <div style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.55)',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:6}}>Target</div>
              <div style={{fontFamily:'var(--condensed)',fontStyle:'italic',fontWeight:900,fontSize:48,color:'var(--white)',lineHeight:1,textShadow:'0 0 14px rgba(232,52,28,0.4)'}}>100<span style={{fontSize:24,color:'rgba(245,245,240,0.55)',fontStyle:'normal'}}>kg</span> × 8</div>
              <div style={{fontFamily:'var(--mono)',fontSize:9,color:'#22c55e',marginTop:6,letterSpacing:'0.1em'}}>RPE 8.0 · 1RM est. 127kg</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
              {[{l:'Last Set',v:'100kg × 9'},{l:'Volume',v:'3,240 kg'}].map(s => (
                <div key={s.l} style={{padding:10,background:'rgba(245,245,240,0.03)',border:'1px solid rgba(245,245,240,0.06)',borderRadius:9}}>
                  <div style={{fontFamily:'var(--mono)',fontSize:8,color:'rgba(245,245,240,0.55)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:4}}>{s.l}</div>
                  <div style={{fontFamily:'var(--condensed)',fontWeight:800,fontSize:14,color:'var(--white)'}}>{s.v}</div>
                </div>
              ))}
            </div>
            <button style={{width:'100%',padding:12,background:'var(--red)',color:'var(--white)',border:'none',borderRadius:10,fontFamily:'var(--condensed)',fontWeight:700,fontSize:13,letterSpacing:'0.12em',textTransform:'uppercase',cursor:'pointer'}}>Log Set ✓</button>
            <div style={{marginTop:10,textAlign:'center',fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.45)',letterSpacing:'0.1em'}}>Rest timer · 1:42 / 2:30</div>
          </div>
        </ScreenPhone>

        <ScreenPhone eyebrow="Progress · 12 weeks" title={<>You're<br/>Trending Up</>}>
          <div style={{padding:'4px 18px 14px'}}>
            <div style={{padding:12,background:'rgba(245,245,240,0.03)',border:'1px solid rgba(245,245,240,0.06)',borderRadius:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
                <span style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.55)',letterSpacing:'0.12em',textTransform:'uppercase'}}>Volume Load</span>
                <span style={{fontFamily:'var(--mono)',fontSize:9,color:'#22c55e'}}>+18% / 12wk</span>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:3,height:78}}>
                {[40,52,48,60,55,68,75,82,78,88,92,95].map((h,i) => (
                  <div key={i} style={{flex:1,height:`${h}%`,background:i>8?'#e8341c':'rgba(232,52,28,0.35)',borderRadius:'2px 2px 0 0',boxShadow:i>8?'0 0 6px #e8341c':'none'}}/>
                ))}
              </div>
            </div>
            {[
              {l:'Bodyweight',v:'+1.2 kg',c:'#22c55e'},
              {l:'Strength Index',v:'+8.4%',c:'#22c55e'},
              {l:'Adherence',v:'94%',c:'var(--white)'},
              {l:'Avg Sleep',v:'7h 22m',c:'var(--white)'},
            ].map(s => (
              <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(245,245,240,0.06)',fontFamily:'var(--mono)',fontSize:10}}>
                <span style={{color:'rgba(245,245,240,0.6)',letterSpacing:'0.06em',textTransform:'uppercase'}}>{s.l}</span>
                <span style={{color:s.c,fontWeight:600}}>{s.v}</span>
              </div>
            ))}
          </div>
        </ScreenPhone>

        <ScreenPhone eyebrow="TDEE · Today" title={<>Energy<br/>Balance</>}>
          <div style={{padding:'4px 18px 14px'}}>
            <div style={{textAlign:'center',padding:'10px 0 16px'}}>
              <div style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.55)',letterSpacing:'0.16em',textTransform:'uppercase',marginBottom:6}}>Total Daily Burn</div>
              <div style={{fontFamily:'var(--condensed)',fontStyle:'italic',fontWeight:900,fontSize:44,color:'var(--red)',lineHeight:1,textShadow:'0 0 16px rgba(232,52,28,0.5)'}}>3,240</div>
              <div style={{fontFamily:'var(--mono)',fontSize:9,color:'rgba(245,245,240,0.55)',marginTop:4}}>kcal · adjusted for Push Day</div>
            </div>
            {[
              {l:'BMR',v:'1,820',pct:56,c:'rgba(245,245,240,0.45)'},
              {l:'NEAT',v:'520',pct:16,c:'#60a5fa'},
              {l:'Workout',v:'632',pct:20,c:'#e8341c'},
              {l:'TEF (Food)',v:'268',pct:8,c:'#fbbf24'},
            ].map(r => (
              <div key={r.l} style={{marginBottom:11}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontFamily:'var(--mono)',fontSize:10}}>
                  <span style={{color:'rgba(245,245,240,0.6)',letterSpacing:'0.06em',textTransform:'uppercase'}}>{r.l}</span>
                  <span style={{color:'var(--white)'}}>{r.v} <span style={{color:'rgba(245,245,240,0.45)',fontSize:8}}>kcal · {r.pct}%</span></span>
                </div>
                <div style={{height:4,background:'rgba(245,245,240,0.06)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${r.pct}%`,background:r.c,borderRadius:2,boxShadow:r.c.startsWith('#')?`0 0 6px ${r.c}`:'none'}}/>
                </div>
              </div>
            ))}
          </div>
        </ScreenPhone>
      </div>
      <div style={{padding:'8px 48px 0',color:'var(--white-faint)',fontFamily:'var(--mono)',fontSize:10,letterSpacing:'0.16em',textTransform:'uppercase'}}>← Drag to explore →</div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="lp-proof">
      <div style={{maxWidth:1280,margin:'0 auto 64px'}}>
        <div className="lp-section-eyebrow">// Athlete Results</div>
        <h2 className="lp-section-title fade-up">The numbers<br/>don't lie.</h2>
      </div>
      <div className="lp-proof-stats">
        {[
          {num:'47',label:'athletes in closed beta'},
          {num:'12',suffix:'wk',label:'data window per profile'},
          {num:'$0',red:true,label:'charged in trial · ever'},
        ].map(s => (
          <div className="lp-proof-stat fade-up" key={s.num}>
            <div className="lp-proof-num">
              <span className={s.red?'red':''}>{s.num}</span>
              {s.suffix && <span style={{fontSize:'0.5em',color:'var(--red)'}}>{s.suffix}</span>}
            </div>
            <div className="lp-proof-lbl">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="lp-testi-grid">
        {[
          {text:"I've been using MyFitnessPal for 4 years. This is what MFP should have been the whole time. My macros actually match what I'm doing in the gym.",name:'Marcus T.',role:'Powerlifter · 4 years training'},
          {text:"Training for Hyrox. Calorie adjustment on hard run days vs strength days is the exact thing I needed. I'm not underfueling for the first time in two years.",name:'Jess L.',role:'Hyrox Athlete · 3x finisher'},
          {text:"The muscle recovery map made me realize I was training the same muscles three days in a row. My progress exploded once I actually programmed around recovery.",name:'Ryan K.',role:'Hybrid Athlete · 5 days/wk'},
        ].map(t => (
          <div className="lp-testi fade-up" key={t.name}>
            <div className="lp-testi-text">"{t.text}"</div>
            <div className="lp-testi-name">{t.name}</div>
            <div className="lp-testi-role">{t.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqSection() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {q:'How is this different from just using MyFitnessPal and a workout app together?',a:"Those apps run in isolation. Coach Macro's intelligence sits in the connection — when you log a workout, your macros change automatically. When you're in a deficit, your training load adjusts. No manual re-entry. No guesswork. One system that knows the full picture."},
    {q:'Do I need to be advanced to use this?',a:"Not at all. Whether you're just starting your fitness journey or you've been training for years, Coach Macro adapts to where you are. The system handles the complex math behind the scenes — you just log your meals and workouts, and we do the rest. No PhD in nutrition required."},
    {q:'How accurate is the metabolic rate calculation?',a:"We use 25 data inputs — body composition estimates, training history, activity patterns, and biometric data — to build a metabolic profile that is 8% more accurate than standard equations like Harris-Benedict or Mifflin-St Jeor. This compounds over time as the model learns your patterns."},
    {q:'What does "training day adjustment" actually mean?',a:"On a training day, your carbohydrate targets increase proportionally to session volume and intensity. After you log a completed workout, your remaining calorie and carb budgets update in real time. Rest days have a reduced carb and calorie target. It's automatic — you don't touch a setting."},
    {q:'Does it work for runners and endurance athletes, or just lifters?',a:"Both. The system handles volume-based endurance work the same way it handles resistance training. Hybrid athletes and Hyrox competitors are some of our most active users."},
    {q:'Can I connect my wearable or smartwatch?',a:"Garmin, Whoop, Apple Watch, and Polar integrations are in active development. For now, the app uses manual session logging and its own METs-based energy calculation. Integration with wearables will make the system even more accurate when available."},
    {q:'What happens after the 7-day trial?',a:"You choose a plan or you stop. No charge, no dark patterns. If you want to continue, you select monthly or annual. If not, your account downgrades to read-only — your data stays, you just can't log new entries."},
    {q:'Is my data private?',a:"Your data is never sold. Never shared with third parties. We use it only to run your personalized model. You can export or delete everything at any time from within the app."},
  ];
  return (
    <section className="lp-faq" id="faq">
      <div className="lp-section-eyebrow">// FAQ</div>
      <h2 className="lp-section-title fade-up">Got questions.</h2>
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

function WaitlistSection() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(28);

  useEffect(() => {
    const el = document.getElementById('waitlist');
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let n = 28;
        const tick = setInterval(() => {
          n += Math.ceil((47 - n) / 12);
          if (n >= 47) { n = 47; clearInterval(tick); }
          setCount(n);
        }, 60);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
        const d = await res.json().catch(()=>({}));
        if (res.status === 429) setError('Too many sign-up attempts. Please wait a few minutes and try again.');
        else setError(d.error || 'Unable to join waitlist right now. Please try again.');
      }
    } catch {
      setError('No connection. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lp-waitlist" id="waitlist">
      <div className="lp-waitlist-inner">
        {submitted ? (
          <div style={{padding:'48px 32px',background:'rgba(255,255,255,0.02)',border:'1px solid var(--red-border-strong)',borderRadius:14,boxShadow:'0 0 60px rgba(232,52,28,0.2)'}}>
            <div style={{fontFamily:'var(--mono)',fontSize:11,letterSpacing:'0.16em',color:'var(--red)',textTransform:'uppercase',marginBottom:16}}>// CONFIRMED</div>
            <div style={{fontFamily:'var(--condensed)',fontStyle:'italic',fontWeight:900,fontSize:'clamp(48px,6vw,72px)',color:'var(--white)',textTransform:'uppercase',lineHeight:0.95,marginBottom:16}}>
              You're on the list{firstName?`, ${firstName}`:''}<span style={{color:'var(--red)'}}>.</span>
            </div>
            <div style={{color:'var(--white-dim)',fontSize:15,lineHeight:1.65}}>You're on the list. Check your inbox — the email is on its way. We'll reach out the moment Coach Macro launches.</div>
          </div>
        ) : (
          <>
            <h2 className="lp-wl-hl">Be First.</h2>
            <p className="lp-wl-sub">Join the waitlist. Get <strong>30 days free at launch</strong>. No credit card ever.</p>
            <div className="lp-wl-counter">{count.toLocaleString()} athletes already waiting</div>
            <form className="lp-wl-form" onSubmit={handleSubmit}>
              <input className="lp-wl-input" type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name"/>
              <input className="lp-wl-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
              <button type="submit" className="lp-wl-btn" data-tilt disabled={loading}>
                {loading ? <span className="lp-spinner"/> : <>Secure My Spot <span>→</span></>}
              </button>
            </form>
            {error && <div className="lp-wl-err">{error}</div>}
            <div className="lp-wl-fine">Email sent instantly. No spam. Ever.</div>
          </>
        )}
      </div>
    </section>
  );
}

export function LandingPage({ onSignUp }) {
  const containerRef = useRef(null);
  useEffects(containerRef);

  const [waitlistBanner, setWaitlistBanner] = useState(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const w = p.get('waitlist');
    if (w === 'confirmed') setWaitlistBanner('confirmed');
    else if (w === 'invalid') setWaitlistBanner('invalid');
  }, []);

  const scrollToWaitlist = () => document.getElementById('waitlist')?.scrollIntoView({behavior:'smooth'});

  return (
    <div className={`lp${waitlistBanner?' has-banner':''}`} ref={containerRef}>
      <style>{CSS}</style>
      <div className="lp-aurora"/>
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

      <nav className="lp-nav">
        <button className="lp-logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <img src="/coach-macro-logo.png" alt="Coach Macro" className="lp-logo-mark" />
          <div className="lp-logo-text"><span className="lp-logo-coach">Coach</span><span className="lp-logo-macro">Macro</span></div>
        </button>
        <div className="lp-nav-links">
          <a href="#features" className="lp-nav-link">Features</a>
          <a href="#how" className="lp-nav-link">How It Works</a>
          <a href="#compare" className="lp-nav-link">Compare</a>
          <a href="#faq" className="lp-nav-link">FAQ</a>
          <button className="lp-nav-cta" data-tilt onClick={scrollToWaitlist}>Join Waitlist</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-content">
          <div className="lp-hero-eyebrow">Coming Soon · Closed Beta</div>
          <h1 className="lp-hero-headline">
            Your food and<br/>
            your training<br/>
            finally <span className="red">talk.</span>
          </h1>
          <p className="lp-hero-sub">
            The only app where your <strong>workout changes your nutrition</strong> — and your nutrition changes your workout. Every day. Automatically.
          </p>
          <div className="lp-hero-cta-group">
            <button className="lp-cta-btn" data-tilt onClick={scrollToWaitlist}>
              Join the Waitlist <span className="arrow">→</span>
            </button>
            <span className="lp-hero-proof">
              <strong>47 athletes in closed beta</strong> · 30 days free at launch
            </span>
          </div>
        </div>

        <div className="lp-phone-wrap">
          <HeroPhone/>
          <div className="lp-float-pill tl">
            <span className="dot" style={{background:'#00E676',color:'#00E676'}}/>
            <span><strong>+312 calories earned</strong> today</span>
          </div>
          <div className="lp-float-pill tr">
            <span className="dot" style={{background:'#E8341C',color:'#E8341C'}}/>
            <span>Push Day · <strong>847 kcal left</strong></span>
          </div>
          <div className="lp-float-pill bl">
            <span className="dot" style={{background:'#2979FF',color:'#2979FF'}}/>
            <span><strong>Week 4</strong> of 12</span>
          </div>
        </div>
      </section>

      <section className="lp-problem">
        <div className="lp-problem-grid">
          <div className="lp-problem-block fade-up">
            <div className="lp-problem-label">// The Disconnect</div>
            <div className="lp-problem-text">YOUR GARMIN KNOWS<br/>YOU SLEPT 5 HOURS.</div>
            <div className="lp-problem-text dim">YOUR TRAINING APP<br/>DOESN'T.</div>
          </div>
          <div className="lp-problem-divider"/>
          <div className="lp-problem-block fade-up">
            <div className="lp-problem-text">YOUR NUTRITION APP<br/>GIVES YOU 2,000 CALORIES.</div>
            <div className="lp-problem-text dim">WHETHER YOU LIFTED<br/>OR NOT.</div>
          </div>
          <div className="lp-problem-divider"/>
          <div className="lp-problem-block fade-up">
            <div className="lp-problem-text dim">NOBODY CONNECTED<br/>THE TWO.</div>
            <div className="lp-problem-resolution">UNTIL <span className="red">NOW.</span></div>
          </div>
        </div>
      </section>

      <BentoSection/>
      <HowSection/>
      <CompareSection/>
      <ScreensSection/>
      <ProofSection/>
      <FaqSection/>
      <WaitlistSection/>

      <footer className="lp-footer">
        <button className="lp-logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
          <img src="/coach-macro-logo.png" alt="Coach Macro" className="lp-logo-mark" />
          <div className="lp-logo-text"><span className="lp-logo-coach">Coach</span><span className="lp-logo-macro">Macro</span></div>
        </button>
        <div className="lp-footer-links">
          {[['Privacy Policy','/privacy'],['Terms','/terms'],['Health Disclaimer','/health-disclaimer'],['Health Data Notice','/health-data-notice'],['Washington Privacy','/washington-privacy'],['California Privacy','/california-privacy'],['Support','/support']].map(([label,path]) => (
            <a key={path} href={path}>{label}</a>
          ))}
        </div>
        <div className="lp-footer-copy">© 2026 Coach Macro LLC. All rights reserved.</div>
      </footer>
    </div>
  );
}
