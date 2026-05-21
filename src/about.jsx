import React from "react";

const ABOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,300;0,400;0,900;1,300;1,400;1,900&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --red: #E8341C;
    --red-glow: rgba(232,52,28,0.35);
    --white: #FFFFFF;
    --white-dim: rgba(255,255,255,0.65);
    --white-faint: rgba(255,255,255,0.35);
    --white-border: rgba(255,255,255,0.07);
    --condensed: 'Barlow Condensed', sans-serif;
    --body: 'Inter', sans-serif;
    --mono: 'DM Mono', monospace;
  }

  .ab * { box-sizing: border-box; margin: 0; padding: 0; }
  .ab { background: #000; color: var(--white); font-family: var(--body); overflow-x: hidden; -webkit-font-smoothing: antialiased; }

  /* ── NAV ── */
  .ab-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(0,0,0,0.75); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid var(--white-border); }
  .ab-logo { display: flex; align-items: center; gap: 12px; font-family: var(--condensed); font-weight: 800; font-size: 20px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--white); text-decoration: none; cursor: pointer; background: none; border: none; }
  .ab-logo-mark { width: 32px; height: 32px; border-radius: 7px; object-fit: cover; display: block; box-shadow: 0 0 18px rgba(232,52,28,0.45); }
  .ab-logo-coach { color: rgba(255,255,255,0.5); font-style: italic; font-weight: 400; }
  .ab-logo-macro { color: var(--white); font-weight: 800; }
  .ab-nav-links { display: flex; gap: 32px; align-items: center; }
  .ab-nav-link { color: var(--white); font-size: 13px; font-weight: 500; text-decoration: none; letter-spacing: 0.02em; transition: color 0.2s; background: none; border: none; cursor: pointer; font-family: var(--body); }
  .ab-nav-link:hover { color: var(--red); }
  .ab-nav-link.active { color: var(--red); }
  .ab-nav-cta { font-family: var(--condensed); font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--red); background: transparent; border: 1px solid var(--red); padding: 9px 18px; border-radius: 4px; cursor: pointer; transition: all 0.25s; text-decoration: none; white-space: nowrap; }
  .ab-nav-cta:hover { background: var(--red); color: var(--white); box-shadow: 0 0 30px var(--red-glow); }

  /* ── HERO ── */
  .ab-hero { position: relative; height: 100vh; min-height: 600px; display: flex; align-items: flex-end; overflow: hidden; }
  .ab-hero-bg { position: absolute; inset: 0; background-image: url('/images/about-hero.jpg'); background-size: cover; background-position: center 30%; }
  .ab-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.5) 100%); }
  .ab-hero-content { position: relative; z-index: 2; padding: 0 64px 80px; max-width: 900px; }
  .ab-hero-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--red); margin-bottom: 20px; }
  .ab-hero-headline { font-family: var(--condensed); font-weight: 900; font-style: italic; font-size: clamp(52px, 7vw, 96px); line-height: 0.93; letter-spacing: -0.02em; text-transform: uppercase; color: var(--white); margin-bottom: 28px; }
  .ab-hero-meta { font-family: var(--mono); font-size: 13px; letter-spacing: 0.08em; color: rgba(255,255,255,0.5); }

  /* ── STORY SECTION ── */
  .ab-story { padding: 120px 64px; max-width: 1200px; margin: 0 auto; }
  .ab-story-grid { display: grid; grid-template-columns: 280px 1fr; gap: 80px; align-items: start; }
  .ab-sticky { position: sticky; top: 96px; }
  .ab-section-label { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--red); margin-bottom: 12px; }
  .ab-section-head { font-family: var(--condensed); font-weight: 900; font-style: italic; font-size: 48px; line-height: 0.95; text-transform: uppercase; color: var(--white); }

  .ab-body p { font-family: var(--body); font-size: 18px; line-height: 1.75; color: var(--white); margin-bottom: 28px; font-weight: 400; }
  .ab-body p:last-child { margin-bottom: 0; }

  .ab-pull { border-left: 3px solid var(--red); padding: 20px 28px; margin: 48px 0; background: rgba(232,52,28,0.04); }
  .ab-pull p { font-family: var(--condensed); font-style: italic; font-weight: 400; font-size: 26px; line-height: 1.3; color: var(--white) !important; margin-bottom: 0 !important; letter-spacing: 0.01em; }

  /* ── THEN / NOW TABLE ── */
  .ab-table-wrap { margin: 56px 0; }
  .ab-table-header { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin-bottom: 1px; }
  .ab-table-th { font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; padding: 10px 20px; }
  .ab-table-th.then { color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.03); }
  .ab-table-th.now { color: var(--red); background: rgba(232,52,28,0.06); }
  .ab-table-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin-bottom: 1px; }
  .ab-table-cell { padding: 16px 20px; font-family: var(--body); font-size: 15px; line-height: 1.5; }
  .ab-table-cell.then { background: rgba(255,255,255,0.02); color: rgba(255,255,255,0.45); }
  .ab-table-cell.now { background: rgba(232,52,28,0.05); color: var(--white); border-left: 1px solid rgba(232,52,28,0.15); }

  /* ── COACH SECTION ── */
  .ab-coach { border-top: 1px solid rgba(255,255,255,0.06); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 120px 64px; text-align: center; position: relative; overflow: hidden; }
  .ab-coach::before { content: ''; position: absolute; top: -40%; left: 50%; transform: translateX(-50%); width: 60vw; height: 60vw; background: radial-gradient(ellipse at center, rgba(232,52,28,0.07), transparent 65%); pointer-events: none; }
  .ab-coach-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--red); margin-bottom: 20px; }
  .ab-coach-head { font-family: var(--condensed); font-weight: 900; font-style: italic; font-size: clamp(48px, 6vw, 88px); line-height: 0.93; text-transform: uppercase; color: var(--white); letter-spacing: -0.02em; margin-bottom: 32px; max-width: 900px; margin-left: auto; margin-right: auto; }
  .ab-coach-body { font-family: var(--body); font-size: 18px; line-height: 1.7; color: var(--white-dim); max-width: 640px; margin: 0 auto 48px; }
  .ab-coach-body strong { color: var(--white); font-weight: 600; }
  .ab-cta-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--red); color: var(--white); font-family: var(--condensed); font-weight: 700; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; padding: 16px 32px; border-radius: 6px; border: none; cursor: pointer; text-decoration: none; transition: transform 0.2s, box-shadow 0.3s; box-shadow: 0 0 30px var(--red-glow), 0 12px 40px rgba(0,0,0,0.6); }
  .ab-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 0 50px var(--red-glow), 0 16px 50px rgba(0,0,0,0.8); }

  /* ── TEXAS CLOSER ── */
  .ab-texas { padding: 72px 64px; text-align: center; }
  .ab-texas-text { font-family: var(--mono); font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(255,255,255,0.2); }

  /* ── FOOTER ── */
  .ab-footer { padding: 32px 48px; border-top: 1px solid rgba(232,52,28,0.18); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; }
  .ab-footer-copy { font-family: var(--mono); font-size: 11px; color: var(--white-faint); letter-spacing: 0.04em; }
  .ab-footer-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .ab-footer-links a { font-size: 12px; color: var(--white-dim); text-decoration: none; letter-spacing: 0.04em; transition: color 0.2s; font-family: var(--body); }
  .ab-footer-links a:hover { color: var(--red); }

  /* ── MOBILE ── */
  @media (max-width: 768px) {
    .ab-nav { padding: 0 20px; }
    .ab-nav-links .ab-nav-link { display: none; }
    .ab-hero-content { padding: 0 24px 60px; }
    .ab-hero-headline { font-size: 48px; }
    .ab-story { padding: 72px 24px; }
    .ab-story-grid { grid-template-columns: 1fr; gap: 40px; }
    .ab-sticky { position: static; }
    .ab-section-head { font-size: 36px; }
    .ab-body p { font-size: 16px; }
    .ab-pull p { font-size: 20px; }
    .ab-coach { padding: 80px 24px; }
    .ab-coach-head { font-size: 42px; }
    .ab-coach-body { font-size: 16px; }
    .ab-texas { padding: 48px 24px; }
    .ab-footer { flex-direction: column; text-align: center; padding: 32px 24px; }
    .ab-footer-links { justify-content: center; }
  }
`;

const THEN_NOW = [
  ["Five apps to manage training, nutrition, and recovery", "One coach that connects everything"],
  ["Log your food — get no feedback", "Every log informs your next meal and session"],
  ["Generic macro targets from an online calculator", "Targets built around your exact training schedule"],
  ["Wonder when you need a deload", "Your program adjusts automatically when signals appear"],
  ["Morning of a hard session — figure it out yourself", "Morning Brief tells you exactly what today needs"],
  ["Data you own but can't interpret", "Insights that actually change what you do"],
];

export function AboutPage() {
  return (
    <div className="ab">
      <style>{ABOUT_CSS}</style>

      {/* ── NAV ── */}
      <nav className="ab-nav">
        <button className="ab-logo" onClick={() => window.location.href = "/"}>
          <img src="/coach-macro-logo.png" alt="Coach Macro" className="ab-logo-mark" />
          <div style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
            <span className="ab-logo-coach">Coach</span>
            <span className="ab-logo-macro">Macro</span>
          </div>
        </button>
        <div className="ab-nav-links">
          <a href="/#features" className="ab-nav-link">Features</a>
          <a href="/#how" className="ab-nav-link">How It Works</a>
          <a href="/#compare" className="ab-nav-link">Compare</a>
          <a href="/about" className="ab-nav-link active">About</a>
          <a href="/#download" className="ab-nav-cta">Get the App</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="ab-hero">
        <div className="ab-hero-bg" />
        <div className="ab-hero-overlay" />
        <div className="ab-hero-content">
          <div className="ab-hero-eyebrow">The Origin Story</div>
          <h1 className="ab-hero-headline">It started at<br />a starting line.</h1>
          <div className="ab-hero-meta">McAllen, Texas &nbsp;·&nbsp; January 20, 2024 &nbsp;·&nbsp; 6:52 AM &nbsp;·&nbsp; 13.1 miles ahead</div>
        </div>
      </section>

      {/* ── STORY ── */}
      <section className="ab-story">
        <div className="ab-story-grid">

          {/* Left sticky col */}
          <div>
            <div className="ab-sticky">
              <div className="ab-section-label">Built out of</div>
              <h2 className="ab-section-head">Frustration.</h2>
            </div>
          </div>

          {/* Right body col */}
          <div className="ab-body">
            <p>
              Standing at the starting line of a half marathon, I had months of nutrition logs on my phone. Macros tracked to the gram. A training block I'd cobbled together from YouTube and Reddit. Heart rate data from a watch I barely knew how to read.
            </p>
            <p>
              I had all the data. I had none of the answers.
            </p>
            <p>
              That morning — 6:52 AM, January air in South Texas, 13.1 miles ahead — it hit me. I wasn't being coached. I was being tracked. There's a difference. Tracking collects. Coaching thinks. Every app I'd used was a very expensive spreadsheet. It recorded what I did and asked nothing of what it meant.
            </p>

            <div className="ab-pull">
              <p>"I had a year of data and nothing to show for it. I needed something that thought — not just recorded."</p>
            </div>

            <p>
              After the race I started building. Not another tracker. A coach that lives in your phone — one that connects your food to your training, your training to your recovery, your recovery to what tomorrow should look like. An app that reads your data the way a good coach would: looking for patterns, adjusting when something's off, telling you what you actually need to hear.
            </p>
            <p>
              Coach Macro started as a personal obsession. Every feature exists because I needed it first. The Morning Brief because I wanted to know what each day meant before I started it. The deload detection because I kept grinding through weeks I should have backed off. The macro memory because I was eating the same meals every week and manually logging them every single time.
            </p>

            {/* THEN / NOW */}
            <div className="ab-table-wrap">
              <div className="ab-table-header">
                <div className="ab-table-th then">Before</div>
                <div className="ab-table-th now">With Coach Macro</div>
              </div>
              {THEN_NOW.map(([then, now], i) => (
                <div className="ab-table-row" key={i}>
                  <div className="ab-table-cell then">{then}</div>
                  <div className="ab-table-cell now">{now}</div>
                </div>
              ))}
            </div>

            <p>
              Athletes don't need more data. They need someone to make sense of the data they already have. That's what Coach Macro does. That's all it does — and it does it relentlessly.
            </p>
          </div>
        </div>
      </section>

      {/* ── NOT A TRACKER ── */}
      <section className="ab-coach">
        <div className="ab-coach-eyebrow">The Difference</div>
        <h2 className="ab-coach-head">Not a tracker.<br />A coach.</h2>
        <p className="ab-coach-body">
          Coach Macro doesn't care about your streak. It cares about your <strong>results</strong>. Not your log — your progress. Not your numbers — what your numbers mean. Every session you complete, every meal you log, every morning you open the app teaches it more about you. Over time, it stops giving you generic advice and starts giving you <strong>your</strong> advice.
        </p>
        <a href="/#download" className="ab-cta-btn">
          Start Training Smarter <span style={{ fontSize: 18 }}>→</span>
        </a>
      </section>

      {/* ── TEXAS ── */}
      <div className="ab-texas">
        <div className="ab-texas-text">Born in Texas. Built for every athlete.</div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="ab-footer">
        <button className="ab-logo" onClick={() => window.location.href = "/"} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <img src="/coach-macro-logo.png" alt="Coach Macro" className="ab-logo-mark" />
          <div style={{ display: "flex", gap: 4, alignItems: "baseline", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, textTransform: "uppercase", letterSpacing: "0.04em", color: "#fff" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontStyle: "italic", fontWeight: 400 }}>Coach</span>
            <span>Macro</span>
          </div>
        </button>
        <div className="ab-footer-links">
          {[["About", "/about"], ["Privacy Policy", "/privacy"], ["Terms", "/terms"], ["Health Disclaimer", "/health-disclaimer"], ["Support", "/support"]].map(([label, path]) => (
            <a key={path} href={path}>{label}</a>
          ))}
        </div>
        <div className="ab-footer-copy">© 2026 Coach Macro LLC. All rights reserved.</div>
      </footer>
    </div>
  );
}
