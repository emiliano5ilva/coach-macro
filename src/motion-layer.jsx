import React from 'react';
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
const SPRING = { type: 'spring', stiffness: 400, damping: 30 };

// ── StaggerItem ───────────────────────────────────────────────────────────────
// Fires opacity+translateY entrance once on mount. Respects reducedMotion.
export function StaggerItem({ children, style, i = 0, className }) {
  const rm = useReducedMotion();
  if (!GOCLUB_REDESIGN || rm) {
    return <div style={style} className={className}>{children}</div>;
  }
  return (
    <motion.div
      style={style}
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: i * 0.05, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// ── Pressable ─────────────────────────────────────────────────────────────────
// Scale-down on press, spring back on release. Apply to tappable cards.
export function Pressable({ children, style, onClick, className, ...rest }) {
  const rm = useReducedMotion();
  if (!GOCLUB_REDESIGN || rm) {
    return <div style={style} onClick={onClick} className={className} {...rest}>{children}</div>;
  }
  return (
    <motion.div
      style={style}
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.97 }}
      transition={SPRING}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// ── MN (MotionNumber) ─────────────────────────────────────────────────────────
// Thin NumberFlow wrapper. Inherits parent font/color via currentColor.
// Falls back to plain integer when GOCLUB_REDESIGN is off.
export function MN({ value, format, style, suffix, prefix }) {
  const rm = useReducedMotion();
  const v = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  if (!GOCLUB_REDESIGN) return <>{prefix}{Math.round(v)}{suffix}</>;
  return (
    <>
      {prefix}
      <NumberFlow
        value={v}
        format={format || { maximumFractionDigits: 0, useGrouping: false }}
        animated={!rm}
        willChange
        style={style}
      />
      {suffix}
    </>
  );
}

// ── MotionArc ─────────────────────────────────────────────────────────────────
// Replaces CSS @keyframes strokeDashoffset ring animations with Motion pathLength.
// transform + opacity only — compositor-safe.
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
