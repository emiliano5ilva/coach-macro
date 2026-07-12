import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Premium spotlight tour — dimmed overlay with a single bright cutout over the
// target element, an on-brand tooltip (Archivo) with a caret, back/next nav, and
// a Skip-tour escape available on every step. Spring physics via motion/react.
// Props: steps [{ targetSelector, headline, description }], onComplete(), onSkip().
export default function SpotlightTour({ steps, onComplete, onSkip }) {
  const reduce = useReducedMotion();
  const SPRING = reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 };
  const PAD = 10;

  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const rafRef = useRef(0);
  const step = steps[i] || {};
  const last = i >= steps.length - 1;

  const measure = useCallback(() => {
    const sel = step?.targetSelector;
    const el = sel ? document.querySelector(sel) : null;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) { setRect(null); return; }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // On step change: scroll the target into view, then track its rect until it
  // settles (the smooth-scroll takes a few frames; keep the cutout glued to it).
  useEffect(() => {
    const el = step?.targetSelector ? document.querySelector(step.targetSelector) : null;
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    let start = null;
    const tick = (t) => {
      if (start == null) start = t;
      measure();
      if (t - start < 650) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [i, step, measure, reduce]);

  // Reposition on viewport change (rotation / resize / keyboard).
  useEffect(() => {
    const onR = () => { setVp({ w: window.innerWidth, h: window.innerHeight }); measure(); };
    window.addEventListener('resize', onR);
    window.addEventListener('orientationchange', onR);
    return () => {
      window.removeEventListener('resize', onR);
      window.removeEventListener('orientationchange', onR);
    };
  }, [measure]);

  const next = () => (last ? onComplete() : setI((v) => v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));

  // Cutout box, clamped to the viewport.
  const box = rect
    ? {
        x: Math.max(6, rect.left - PAD),
        y: Math.max(6, rect.top - PAD),
        w: Math.min(vp.w - 12, rect.width + PAD * 2),
        h: rect.height + PAD * 2,
      }
    : null;

  // Tooltip placement: below the target if it sits in the top half, else above.
  const below = rect ? rect.top + rect.height / 2 < vp.h / 2 : true;
  const TW = Math.min(360, vp.w - 32);
  let tx = rect ? rect.left + rect.width / 2 - TW / 2 : vp.w / 2 - TW / 2;
  tx = Math.max(16, Math.min(tx, vp.w - TW - 16));
  const topPos = rect ? rect.top + rect.height + PAD + 14 : vp.h / 2 - 130;
  const bottomPos = rect ? vp.h - (rect.top - PAD) + 14 : null;
  const caretX = rect ? Math.max(22, Math.min(TW - 22, rect.left + rect.width / 2 - tx)) : TW / 2;

  const AF = "'Archivo', sans-serif";
  const RED = 'var(--cm-red,#FF3B30)';
  const PAPER = 'var(--cm-paper,#FFFFFF)';
  const INK = 'var(--cm-ink,#0A0A0A)';
  const MUTE = 'rgba(var(--cm-ink-rgb,10,10,10),0.55)';

  const boxAnim = box ? { x: box.x, y: box.y, width: box.w, height: box.h } : {};

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, fontFamily: AF }}>
      {/* Dimmed overlay with a single bright spotlight cutout (no double-dim). */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <mask id="cm-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {box && (
              <motion.rect initial={false} animate={boxAnim} transition={SPRING} rx="16" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(8,6,6,0.74)" mask="url(#cm-spotlight-mask)" />
        {box && (
          <>
            <motion.rect
              initial={false}
              animate={boxAnim}
              transition={SPRING}
              rx="16"
              fill="none"
              stroke={RED}
              strokeWidth="2.5"
            />
            {!reduce && (
              <motion.rect initial={false} animate={boxAnim} transition={SPRING} rx="16" fill="none" stroke={RED} strokeWidth="2.5">
                <animate attributeName="stroke-opacity" values="0.55;0;0.55" dur="2s" repeatCount="indefinite" />
              </motion.rect>
            )}
          </>
        )}
      </svg>

      {/* Tap-catcher — blocks interaction with the app behind the tour. */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={(e) => e.stopPropagation()} />

      {/* Tooltip */}
      <motion.div
        key={i}
        initial={{ opacity: 0, y: below ? 10 : -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={SPRING}
        style={{
          position: 'absolute',
          left: tx,
          width: TW,
          ...(below ? { top: topPos } : { bottom: bottomPos }),
          background: PAPER,
          borderRadius: 18,
          padding: 18,
          boxShadow: '0 14px 44px rgba(0,0,0,0.38)',
          zIndex: 2,
        }}
      >
        {/* Caret pointing at the target */}
        {rect && (
          <div
            style={{
              position: 'absolute',
              left: caretX - 7,
              [below ? 'top' : 'bottom']: -6,
              width: 14,
              height: 14,
              background: PAPER,
              transform: 'rotate(45deg)',
              borderRadius: 3,
            }}
          />
        )}

        {/* Counter + Skip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: RED }}>
            {i + 1} / {steps.length}
          </div>
          <button
            onClick={onSkip}
            style={{ background: 'none', border: 'none', fontFamily: AF, fontSize: 11, fontWeight: 700, color: MUTE, cursor: 'pointer', padding: 4, letterSpacing: '0.03em' }}
          >
            Skip tour
          </button>
        </div>

        {/* Headline */}
        <div style={{ fontWeight: 800, fontSize: 19, color: INK, lineHeight: 1.1, marginBottom: 6, textTransform: 'uppercase' }}>
          {step.headline}
        </div>

        {/* Description */}
        <div style={{ fontSize: 14, fontWeight: 500, color: MUTE, lineHeight: 1.5, marginBottom: 16 }}>
          {step.description}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 16 }}>
          {steps.map((_, k) => (
            <motion.div
              key={k}
              initial={false}
              animate={{ width: k === i ? 18 : 6, backgroundColor: k === i ? '#FF3B30' : 'rgba(10,10,10,0.14)' }}
              transition={SPRING}
              style={{ height: 6, borderRadius: 3 }}
            />
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 8 }}>
          {i > 0 && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={back}
              style={{ flex: 1, background: 'rgba(var(--cm-ink-rgb,10,10,10),0.05)', border: 'none', borderRadius: 12, padding: '13px 0', fontFamily: AF, fontWeight: 700, fontSize: 13, color: INK, cursor: 'pointer', letterSpacing: '0.02em' }}
            >
              ← Back
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={next}
            style={{ flex: 2, background: RED, border: 'none', borderRadius: 12, padding: '13px 0', fontFamily: AF, fontWeight: 800, fontSize: 13, color: '#fff', cursor: 'pointer', letterSpacing: '0.04em' }}
          >
            {last ? "Let's go →" : 'Next →'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
