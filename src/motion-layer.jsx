import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import NumberFlow, { styles as nfStyles } from '@number-flow/react';
import SlotCounter from 'react-slot-counter';
import { GOCLUB_REDESIGN } from './components.jsx';

// Inject NumberFlow document-level styles once at module load
if (typeof document !== 'undefined' && !document.querySelector('[data-nf]')) {
  const el = document.createElement('style');
  el.dataset.nf = '1';
  el.textContent = nfStyles.join('\n');
  document.head.appendChild(el);
}

const EASE = [0.2, 0.7, 0.3, 1];
export const TAP_SPRING = { type: 'spring', stiffness: 500, damping: 25 };

// ── CSS injected once for react-slot-counter spring easing override ───────────
// slot-counter uses inline CSS transitions; !important overrides from outside.
const SC_CSS = `
.goclub-slot .slot-counter-item-numbers {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
`;
if (typeof document !== 'undefined' && !document.querySelector('[data-sc]')) {
  const el = document.createElement('style');
  el.dataset.sc = '1';
  el.textContent = SC_CSS;
  document.head.appendChild(el);
}

// ── StaggerItem ───────────────────────────────────────────────────────────────
// Entrance once on mount: opacity+translateY, 200ms gap between cards (75% through
// previous card's 320ms motion). Resolves immediately if reducedMotion.
export function StaggerItem({ children, style, i = 0, className }) {
  const rm = useReducedMotion();
  if (!GOCLUB_REDESIGN || rm) {
    return <div style={style} className={className}>{children}</div>;
  }
  return (
    <motion.div
      style={style}
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: i * 0.20, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ── MN (MotionNumber) — single NumberFlow per number ─────────────────────────
// REVERTED from per-digit hack (caused scramble mid-spin).
// One NumberFlow instance per number: trend=-1 (top→down), spring bounce easing,
// opacity fade. Mount-animate: starts at 0, rAF updates to real value so
// NumberFlow sees 0→v change and fires.
// Used on Train + Fuel. NOT used on Today (see SlotNumber below).
export function MN({ value, format, style, suffix, prefix }) {
  const rm = useReducedMotion();
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;

  const [nfVal, setNfVal] = useState(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (!GOCLUB_REDESIGN || rm) return;
    if (isFirst.current) {
      isFirst.current = false;
      const id = requestAnimationFrame(() => setNfVal(v));
      return () => cancelAnimationFrame(id);
    }
    setNfVal(v);
  }, [v]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!GOCLUB_REDESIGN) return <>{prefix}{Math.round(v)}{suffix}</>;

  return (
    <>
      {prefix}
      <NumberFlow
        value={nfVal}
        trend={-1}
        format={format || { maximumFractionDigits: 0, useGrouping: false }}
        transformTiming={{ duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        opacityTiming={{ duration: 300, easing: 'ease-out' }}
        animated={!rm}
        willChange
        style={style}
      />
      {suffix}
    </>
  );
}

// ── SlotNumber — react-slot-counter cascade for Today only ───────────────────
// react-slot-counter uses plain CSS transitions — no shadow DOM, no linear()
// easing dependency — works cleanly in WKWebView.
// Per-digit cascade: each digit starts delay seconds after the previous
// (left→right). direction="top-down" → digits enter from above, settle down.
// Spring overshoot easing injected via goclub-slot CSS class above.
//
// Props:
//   value       — number to display
//   prefix      — static string before the number (e.g. "+" for delta)
//   format      — { useGrouping } for comma separators
export function SlotNumber({ value, prefix, format, style }) {
  const rm = useReducedMotion();
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const rounded = Math.round(v);

  if (!GOCLUB_REDESIGN || rm) {
    return <span style={style}>{prefix}{rounded}</span>;
  }

  const displayVal = format?.useGrouping
    ? new Intl.NumberFormat('en', { useGrouping: true, maximumFractionDigits: 0 }).format(rounded)
    : String(rounded);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix && <span>{prefix}</span>}
      <SlotCounter
        value={displayVal}
        startValue="0"
        startValueOnce
        duration={0.45}
        delay={0.34}
        direction="top-down"
        containerClassName="goclub-slot"
        autoAnimationStart
      />
    </span>
  );
}

// ── MotionArc ─────────────────────────────────────────────────────────────────
export function MotionArc({ cx, cy, r, pct, stroke, strokeWidth, strokeLinecap = 'round', transform }) {
  const rm = useReducedMotion();
  const safeP = Math.min(1, Math.max(0, pct || 0));
  if (!GOCLUB_REDESIGN) {
    const circ = 2 * Math.PI * r;
    return (
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke}
        strokeWidth={strokeWidth} strokeLinecap={strokeLinecap}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - safeP)}
        transform={transform} />
    );
  }
  return (
    <motion.circle
      cx={cx} cy={cy} r={r} fill="none" stroke={stroke}
      strokeWidth={strokeWidth} strokeLinecap={strokeLinecap}
      transform={transform}
      initial={{ pathLength: rm ? safeP : 0 }}
      animate={{ pathLength: safeP }}
      transition={{ duration: 0.8, ease: EASE }}
    />
  );
}
