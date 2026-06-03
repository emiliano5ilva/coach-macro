import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import NumberFlow, { styles as nfStyles } from '@number-flow/react';
import { GOCLUB_REDESIGN } from './components.jsx';

// Inject NumberFlow document-level styles once at module load
if (typeof document !== 'undefined' && !document.querySelector('[data-nf]')) {
  const el = document.createElement('style');
  el.dataset.nf = '1';
  el.textContent = nfStyles.join('\n');
  document.head.appendChild(el);
}

const EASE = [0.2, 0.7, 0.3, 1];
export const TAP_SPRING = { type: 'spring', stiffness: 400, damping: 30 };

// ── StaggerItem ───────────────────────────────────────────────────────────────
// Entrance: opacity+translateY, fires once on mount.
// Delay = i * 50ms. No page-enter parent needed — remove it from tab wrappers.
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
      transition={{ duration: 0.32, delay: i * 0.055, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ── MN (MotionNumber) ─────────────────────────────────────────────────────────
// NumberFlow wrapper with three fixes:
//   1. mount-animate: starts at 0, updates to real value on next rAF so
//      NumberFlow always sees a value change (0 → v) and fires its animation.
//   2. trend={-1}: digits enter from the TOP and settle downward (GO Club feel).
//   3. spring transformTiming: cubic-bezier with visible overshoot/bounce.
export function MN({ value, format, style, suffix, prefix }) {
  const rm = useReducedMotion();
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;

  // Controlled value fed to NumberFlow — starts at 0 so mount triggers 0→v animation
  const [nfVal, setNfVal] = useState(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (!GOCLUB_REDESIGN || rm) return;
    if (isFirst.current) {
      isFirst.current = false;
      // Next animation frame: set real value → NumberFlow animates 0 → v
      const id = requestAnimationFrame(() => setNfVal(v));
      return () => cancelAnimationFrame(id);
    }
    // Subsequent changes: animate from previous to new
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

// ── MotionArc ─────────────────────────────────────────────────────────────────
// Replaces CSS @keyframes strokeDashoffset rings with Motion pathLength.
// transform only — compositor-safe. Tip dot handled separately by caller.
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
