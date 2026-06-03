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

// Spring preset for whileTap — export so callers can spread it in
export const TAP_SPRING = { type: 'spring', stiffness: 500, damping: 25 };

// ── StaggerItem ───────────────────────────────────────────────────────────────
// Entrance: opacity+translateY, fires once on mount.
// Delay = i * 200ms so cards cascade top-to-bottom at ~75% through previous.
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

// ── MN (MotionNumber) ─────────────────────────────────────────────────────────
// NOTE: @number-flow/react (this version) has NO digitDelay / per-digit stagger.
// spinTiming applies uniformly to all digits. To achieve LEFT→RIGHT digit cascade,
// we render ONE NumberFlow instance per digit with staggered spinTiming.delay.
// The cascade: each digit starts when the previous is 75% done (delay = pos * dur * 0.75).
//
// Also fixes: mount-animate (starts at 0, rAF updates to real value so NumberFlow
// always sees a value change 0→v and fires animation), trend=-1 (top→down entry),
// spring bounce easing.
export function MN({ value, format, style, suffix, prefix }) {
  const rm = useReducedMotion();
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;

  // State-driven value: starts at 0 so mount triggers 0 → v animation
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

  // Format the display value
  const fmt = format || { maximumFractionDigits: 0, useGrouping: false };
  const formatted = new Intl.NumberFormat('en', fmt).format(Math.round(nfVal));

  // Cascade config: 500ms per digit, next starts at 75% of previous
  const DIGIT_DUR = 500;
  const CASCADE_PCT = 0.75;

  let digitIndex = 0;
  const segments = formatted.split('').map((char, i) => {
    if (/\d/.test(char)) {
      const delay = Math.round(digitIndex * DIGIT_DUR * CASCADE_PCT);
      digitIndex++;
      return (
        <NumberFlow
          key={`d${i}`}
          value={parseInt(char, 10)}
          trend={-1}
          spinTiming={{ duration: DIGIT_DUR, delay, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          opacityTiming={{ duration: 300, easing: 'ease-out' }}
          animated={!rm}
          willChange
          // Zero horizontal mask width so adjacent single-digit instances don't clip each other
          style={{ '--number-flow-mask-width': '0', ...style }}
        />
      );
    }
    // Non-digit chars (commas, decimal point, sign) render as static spans
    return <span key={`s${i}`} style={style}>{char}</span>;
  });

  return <>{prefix}<span style={{ fontVariantNumeric: 'tabular-nums' }}>{segments}</span>{suffix}</>;
}

// ── MotionArc ─────────────────────────────────────────────────────────────────
// Replaces CSS @keyframes strokeDashoffset rings with Motion pathLength.
// transform only — compositor-safe. Resolves to final state if reducedMotion.
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
