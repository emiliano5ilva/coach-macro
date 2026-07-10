import React, { useEffect, useRef, useState } from "react";

const PILLS = ["Strength", "Hyrox", "Running", "Hybrid", "Metcon"];

const SHOTS = [
  { src: "/screens/06-progress-training-dna.png", alt: "Training DNA — your athlete profile across six dimensions" },
  { src: "/screens/03-progress-coach-score.png",  alt: "Coach Score — your daily readiness number" },
  { src: "/screens/05-progress-nutrition.png",    alt: "Nutrition trends and weight projection" },
  { src: "/screens/07-fuel-log-food.png",         alt: "Six ways to log food, including AI photo and barcode" },
  { src: "/screens/02-fuel-hydration.png",        alt: "Hydration tracking" },
];

const CORE = [
  { name: "Dynamic Macros", desc: "Targets recalc every morning around what you're training. Lift day is not rest day." },
  { name: "Workouts Earn Calories", desc: "Finish a session and the calories hit your budget the instant you're done." },
  { name: "Barcode + Search", desc: "Scan or search 1M+ foods. One-tap re-logs straight from your history." },
  { name: "Progressive Overload", desc: "Every set measured against last time. PRs caught and logged automatically." },
  { name: "Recovery Heatmap", desc: "A live body map of what's recovered and what still needs a day." },
  { name: "Health + Strava Sync", desc: "HRV, sleep, steps, and activities flow in on their own." },
];

const COACH = [
  { name: "Morning Brief", desc: "Wake up to a coach's brief built from last night's sleep and recovery." },
  { name: "Adapt Now", desc: "Wrecked or travelling? Today's whole session rewrites itself in seconds." },
  { name: "Photo Logger", desc: "Snap your plate. Every ingredient and macro, logged in one shot." },
  { name: "Restaurant AI", desc: "Tell it where you're eating. Get an order from 50,000+ spots that fits your macros." },
  { name: "Workout Generator", desc: "Describe it, get the full session back - sets, reps, rest, form cues." },
  { name: "Metabolic Reset", desc: "Spots a stalled cut from your weight trend and writes the refeed to break it." },
];

export default function FeaturesSection() {
  const rootRef = useRef(null);
  const [slide, setSlide] = useState(0);
  const timer = useRef(null);
  const drag = useRef({ x: 0, down: false });

  const next = () => setSlide((s) => (s + 1) % SHOTS.length);
  const prev = () => setSlide((s) => (s - 1 + SHOTS.length) % SHOTS.length);
  const startAuto = () => { stopAuto(); timer.current = setInterval(() => setSlide((s) => (s + 1) % SHOTS.length), 3500); };
  const stopAuto = () => { if (timer.current) clearInterval(timer.current); };

  useEffect(() => { startAuto(); return stopAuto; }, []);

  const onTouchStart = (e) => { drag.current.x = e.touches[0].clientX; stopAuto(); };
  const onTouchEnd = (e) => { const dx = e.changedTouches[0].clientX - drag.current.x; if (dx < -40) next(); else if (dx > 40) prev(); startAuto(); };
  const onPointerDown = (e) => { drag.current = { x: e.clientX, down: true }; stopAuto(); };
  const onPointerUp = (e) => { if (!drag.current.down) return; const dx = e.clientX - drag.current.x; drag.current.down = false; if (dx < -40) next(); else if (dx > 40) prev(); startAuto(); };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("cmf-in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    root.querySelectorAll(".cmf-reveal").forEach((el) => io.observe(el));

    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, end = parseFloat(el.dataset.end), pad = el.dataset.pad === "1", t0 = performance.now(), dur = 1200;
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
          el.textContent = pad ? String(v).padStart(2, "0") : v.toLocaleString();
          if (p < 1) requestAnimationFrame(tick); else el.textContent = pad ? String(end).padStart(2, "0") : end.toLocaleString();
        };
        requestAnimationFrame(tick); cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    root.querySelectorAll(".cmf-count").forEach((el) => cio.observe(el));

    return () => { io.disconnect(); cio.disconnect(); };
  }, []);

  return (
    <section id="features" className="cmf" ref={rootRef}>
      <style>{`
        .cmf {
          --cmf-red: var(--red, #E8341C);
          --cmf-red-glow: var(--red-glow, rgba(232,52,28,0.4));
          --cmf-red-bd: var(--red-border, rgba(232,52,28,0.18));
          --cmf-red-bd-strong: var(--red-border-strong, rgba(232,52,28,0.4));
          --cmf-card: var(--bg-card, rgba(255,255,255,0.02));
          --cmf-dim: var(--white-dim, rgba(255,255,255,0.5));
          --cmf-faint: var(--white-faint, rgba(255,255,255,0.3));
          --cmf-bd: var(--white-border, rgba(255,255,255,0.06));
          --cmf-cond: var(--condensed, 'Barlow Condensed','Inter',sans-serif);
          --cmf-body: var(--body, 'Inter',sans-serif);
          --cmf-mono: var(--mono, 'DM Mono',monospace);
          --cmf-ease: cubic-bezier(.2,.7,.3,1);
          position: relative; padding: 130px 48px; max-width: 1280px; margin: 0 auto; box-sizing: border-box;
        }
        .cmf-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s ease, transform 0.8s var(--cmf-ease); }
        .cmf-reveal.cmf-in { opacity: 1; transform: translateY(0); }
        .cmf-hero { display: grid; grid-template-columns: 1fr 260px; gap: 48px; align-items: center; }
        .cmf-eyebrow { font-family: var(--cmf-mono); font-size: 11px; letter-spacing: 0.2em; color: var(--cmf-red); text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
        .cmf-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--cmf-red); box-shadow: 0 0 8px var(--cmf-red-glow); animation: cmf-pulse 2s ease-in-out infinite; }
        .cmf-title { font-family: var(--cmf-cond); font-weight: 900; font-style: italic; text-transform: uppercase; font-size: clamp(46px, 6vw, 88px); line-height: 0.9; letter-spacing: -0.02em; color: #fff; margin: 16px 0 0; }
        .cmf-title .hot { color: var(--cmf-red); }
        .cmf-sub { font-family: var(--cmf-body); font-size: 16px; line-height: 1.55; color: var(--cmf-dim); margin: 18px 0 0; max-width: 540px; }
        .cmf-sub b { color: #fff; font-weight: 600; }
        .cmf-lens { margin-top: 26px; }
        .cmf-lens-label { font-family: var(--cmf-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cmf-faint); margin-bottom: 10px; }
        .cmf-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .cmf-pill { font-family: var(--cmf-mono); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--cmf-dim); background: var(--cmf-card); border: 1px solid var(--cmf-bd); border-radius: 999px; padding: 8px 16px; transition: transform 0.25s var(--cmf-ease), color 0.25s var(--cmf-ease), border-color 0.25s var(--cmf-ease), box-shadow 0.25s var(--cmf-ease); cursor: default; }
        .cmf-pill:hover { transform: translateY(-3px); color: #fff; border-color: var(--cmf-red-bd-strong); box-shadow: 0 8px 20px -8px var(--cmf-red-glow); }
        .cmf-phonewrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .cmf-phone { width: 260px; height: 540px; border-radius: 38px; padding: 10px; background: linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.10); box-shadow: 0 40px 80px -30px rgba(0,0,0,0.9); position: relative; }
        .cmf-screen { width: 100%; height: 100%; border-radius: 30px; overflow: hidden; background: #08080a; position: relative; cursor: grab; touch-action: pan-y; }
        .cmf-screen:active { cursor: grabbing; }
        .cmf-track { display: flex; height: 100%; transition: transform 0.55s var(--cmf-ease); }
        .cmf-slide { flex: 0 0 100%; height: 100%; }
        .cmf-slide img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; user-select: none; }
        .cmf-ph { position: absolute; inset: 0; z-index: -1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; }
        .cmf-ph-ring { width: 110px; height: 110px; border-radius: 50%; border: 6px solid rgba(232,52,28,0.18); border-top-color: var(--cmf-red); }
        .cmf-dots { display: flex; gap: 8px; }
        .cmf-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.18); border: none; padding: 0; cursor: pointer; transition: background 0.3s var(--cmf-ease), transform 0.3s var(--cmf-ease); }
        .cmf-dot.on { background: var(--cmf-red); transform: scale(1.25); box-shadow: 0 0 8px var(--cmf-red-glow); }
        .cmf-grid { display: grid; grid-template-columns: 1fr 1px 1fr; margin-top: 64px; align-items: start; }
        .cmf-col { padding: 0 34px; }
        .cmf-col-core { padding-left: 0; }
        .cmf-col-ai { padding-right: 0; }
        .cmf-col-head { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 18px; margin-bottom: 20px; border-bottom: 1px solid var(--cmf-bd); }
        .cmf-col-ai .cmf-col-head { border-bottom-color: var(--cmf-red-bd); }
        .cmf-col-label { font-family: var(--cmf-cond); font-weight: 800; font-style: italic; text-transform: uppercase; font-size: 27px; letter-spacing: -0.01em; color: #fff; line-height: 1; }
        .cmf-col-tag { font-family: var(--cmf-mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cmf-faint); margin-bottom: 6px; }
        .cmf-col-ai .cmf-col-tag { color: var(--cmf-red); }
        .cmf-col-num { font-family: var(--cmf-cond); font-weight: 900; font-size: 46px; line-height: 0.8; color: #fff; font-variant-numeric: tabular-nums; }
        .cmf-col-ai .cmf-col-num { color: var(--cmf-red); text-shadow: 0 0 24px var(--cmf-red-glow); }
        .cmf-col-numlabel { font-family: var(--cmf-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--cmf-faint); margin-top: 6px; text-align: right; }
        .cmf-sheen { position: relative; overflow: hidden; height: 2px; margin-top: 10px; background: var(--cmf-red-bd); border-radius: 2px; }
        .cmf-sheen::after { content: ""; position: absolute; inset: 0; width: 40%; background: linear-gradient(90deg, transparent, var(--cmf-red), transparent); animation: cmf-sweep 2.8s ease-in-out infinite; }
        .cmf-tile { position: relative; background: var(--cmf-card); border: 1px solid var(--cmf-bd); border-radius: 22px; padding: 16px 20px; margin-bottom: 10px; overflow: hidden; transition: transform 0.4s var(--cmf-ease), border-color 0.3s var(--cmf-ease), box-shadow 0.3s var(--cmf-ease); }
        .cmf-tile:hover { transform: translateY(-4px); }
        .cmf-col-core .cmf-tile:hover { border-color: rgba(255,255,255,0.16); box-shadow: 0 18px 40px -22px rgba(0,0,0,0.9); }
        .cmf-col-ai .cmf-tile { border-color: var(--cmf-red-bd); }
        .cmf-col-ai .cmf-tile:hover { border-color: var(--cmf-red-bd-strong); box-shadow: 0 18px 44px -20px rgba(232,52,28,0.35); }
        .cmf-col-ai .cmf-tile::before { content: ""; position: absolute; top: -60px; left: 50%; transform: translateX(-50%); width: 180px; height: 120px; background: radial-gradient(60% 60% at 50% 0%, rgba(232,52,28,0.14), transparent 70%); opacity: 0.5; transition: opacity 0.4s var(--cmf-ease); pointer-events: none; }
        .cmf-col-ai .cmf-tile:hover::before { opacity: 1; }
        .cmf-tile-head { display: flex; align-items: center; gap: 10px; }
        .cmf-tile-eye { font-family: var(--cmf-mono); font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #fff; }
        .cmf-col-core .cmf-tile-eye { color: rgba(255,255,255,0.85); }
        .cmf-tile-eye .slash { color: var(--cmf-red); margin-right: 6px; }
        .cmf-badge { margin-left: auto; font-family: var(--cmf-mono); font-size: 8.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cmf-red); border: 1px solid var(--cmf-red-bd-strong); border-radius: 999px; padding: 3px 8px; background: rgba(232,52,28,0.08); }
        .cmf-tile-desc { font-family: var(--cmf-body); font-size: 13px; line-height: 1.5; color: var(--cmf-dim); margin: 8px 0 0; }
        .cmf-divider { position: relative; width: 1px; background: var(--cmf-bd); align-self: stretch; }
        .cmf-divider::before { content: ""; position: absolute; left: -1px; width: 3px; height: 60px; border-radius: 3px; background: linear-gradient(180deg, transparent, var(--cmf-red), transparent); box-shadow: 0 0 12px var(--cmf-red-glow); animation: cmf-travel 4.2s ease-in-out infinite; }
        .cmf-more { margin-top: 10px; font-family: var(--cmf-mono); font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--cmf-faint); }
        .cmf-more .n { color: var(--cmf-red); }
        @keyframes cmf-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        @keyframes cmf-sweep { 0% { transform: translateX(-120%); } 50% { transform: translateX(320%); } 100% { transform: translateX(320%); } }
        @keyframes cmf-travel { 0% { top: 0; opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { top: calc(100% - 60px); opacity: 0; } }
        @media (max-width: 980px) { .cmf-hero { grid-template-columns: 1fr; justify-items: start; gap: 36px; } .cmf-phonewrap { order: -1; align-self: center; } }
        @media (max-width: 860px) { .cmf { padding: 96px 24px; } .cmf-grid { grid-template-columns: 1fr; gap: 44px; } .cmf-col { padding: 0 !important; } .cmf-divider { display: none; } }
        @media (prefers-reduced-motion: reduce) { .cmf-eyebrow::before, .cmf-sheen::after, .cmf-divider::before, .cmf-track { animation: none; transition: none; } }
      `}</style>

      <div className="cmf-hero cmf-reveal">
        <div>
          <div className="cmf-eyebrow">the whole system</div>
          <h2 className="cmf-title">One app.<br />Not <span className="hot">five.</span></h2>
          <p className="cmf-sub">
            Nutrition, training, and recovery live in <b>one brain that talks to itself</b> - your lifting moves your macros, your sleep moves your plan. It reads <b>14 signals a day</b> and coaches you off all of them.
          </p>
          <div className="cmf-lens">
            <div className="cmf-lens-label">built for how you train</div>
            <div className="cmf-pills">
              {PILLS.map((p) => (<span className="cmf-pill" key={p}>{p}</span>))}
            </div>
          </div>
        </div>

        <div className="cmf-phonewrap">
          <div className="cmf-phone">
            <div className="cmf-screen" onMouseEnter={stopAuto} onMouseLeave={startAuto} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
              <div className="cmf-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
                {SHOTS.map((s, i) => (
                  <div className="cmf-slide" key={i}>
                    <img src={s.src} alt={s.alt} draggable="false" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                  </div>
                ))}
              </div>
              <div className="cmf-ph" aria-hidden="true"><div className="cmf-ph-ring" /></div>
            </div>
          </div>
          <div className="cmf-dots" role="tablist" aria-label="App screenshots">
            {SHOTS.map((s, i) => (
              <button key={i} className={"cmf-dot" + (i === slide ? " on" : "")} aria-label={"Show " + s.alt} aria-selected={i === slide} onClick={() => { setSlide(i); startAuto(); }} />
            ))}
          </div>
        </div>
      </div>

      <div className="cmf-grid">
        <div className="cmf-col cmf-col-core">
          <div className="cmf-col-head cmf-reveal">
            <div>
              <div className="cmf-col-tag">tracks every input</div>
              <div className="cmf-col-label">The Core</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="cmf-col-num"><span className="cmf-count" data-end="12" data-pad="1">00</span></div>
              <div className="cmf-col-numlabel">core systems</div>
            </div>
          </div>
          {CORE.map((f, i) => (
            <div className="cmf-tile cmf-reveal" key={f.name} style={{ transitionDelay: (i * 70) + "ms" }}>
              <div className="cmf-tile-head"><span className="cmf-tile-eye">{f.name}</span></div>
              <p className="cmf-tile-desc">{f.desc}</p>
            </div>
          ))}
          <div className="cmf-more cmf-reveal">+ <span className="n">6</span> more - deload detection, fasting timer, recipe builder...</div>
        </div>

        <div className="cmf-divider" aria-hidden="true" />

        <div className="cmf-col cmf-col-ai">
          <div className="cmf-col-head cmf-reveal">
            <div>
              <div className="cmf-col-tag">reads 14 signals, adapts daily</div>
              <div className="cmf-col-label">The Coach</div>
              <div className="cmf-sheen" />
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="cmf-col-num"><span className="cmf-count" data-end="8" data-pad="1">00</span></div>
              <div className="cmf-col-numlabel">ai engines</div>
            </div>
          </div>
          {COACH.map((f, i) => (
            <div className="cmf-tile cmf-reveal" key={f.name} style={{ transitionDelay: (i * 70) + "ms" }}>
              <div className="cmf-tile-head">
                <span className="cmf-tile-eye">{f.name}</span>
                <span className="cmf-badge">AI</span>
              </div>
              <p className="cmf-tile-desc">{f.desc}</p>
            </div>
          ))}
          <div className="cmf-more cmf-reveal">+ <span className="n">2</span> more - meal description, recipe generator</div>
        </div>
      </div>
    </section>
  );
}
