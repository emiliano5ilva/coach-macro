// ─────────────────────────────────────────────────────────────────────────────
// WEEK WARNING MODAL — coach-not-nag. Shown on Save when a recovery rule (R2/R3) trips.
// Informs calmly, then RESPECTS the athlete's call: "Keep it my way" is always present and easy.
// Portaled to document.body (like the edit sheet) so it escapes .cm-paper-card's containing block.
// All --cm-* tokens; recolors across themes.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from "motion/react";
import { warningCopy } from "../utils/weekRecovery.js";

const _AF = "'Archivo',sans-serif";

// Coach Macro whistle mark — glyph-only (no background), inherits the parent's color via
// fill="currentColor". Body + motion lines are separate <g> so the "blow" can animate them. This is
// the ONE place the whistle animates: when the user taps "Use Coach Macro's suggestion" it blows ONCE
// — the coach's whistle as it starts rearranging. Reference (Claude Design "Whistle Blow"): lines
// y[0,-20,6,-4,0] scale[1,1.14,1.02,1.06,1]; body y[0,-10,5,-3,0] scale[1,1.08,1.05,1.02,1];
// 720ms easeInOut, times[0,.22,.5,.74,1]. Lines pivot from their base, body from mid — fill-box.
function WhistleGlyph({ size = 17, blowTrigger = 0 }) {
  const whole = useAnimationControls();
  const body = useAnimationControls();
  const lines = useAnimationControls();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!blowTrigger || reduce) return;
    // Amplified one-shot "blow" — must read UNMISTAKABLY at 28px during the button flip. Slower (~880ms)
    // so the eye catches it; whole glyph pops, body bobs harder, and the lines puff up + out big (scale
    // ~1.42, large upward travel — values are viewBox-512 units, so they're sized for the small render).
    const t = { duration: 0.88, ease: "easeInOut", times: [0, 0.22, 0.5, 0.74, 1] };
    whole.start({ scale: [1, 1.12, 1.0, 1.05, 1] }, t);
    body.start({ y: [0, -30, 10, -6, 0], scale: [1, 1.15, 1.06, 1.03, 1] }, t);
    lines.start({ y: [0, -78, 18, -10, 0], scale: [1, 1.42, 1.06, 1.14, 1] }, t);
  }, [blowTrigger]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor" fillRule="evenodd" aria-hidden="true" animate={whole} style={{ display: "block", flexShrink: 0, overflow: "visible", transformOrigin: "50% 50%" }}>
      <motion.g className="whistle-body" animate={body} style={{ transformBox: "fill-box", transformOrigin: "50% 72%" }}>
        <path d="M121.3 231.3 144.8 233.8 167.6 243.7 364.2 369.4 366.6 373.1 366.6 419.3 364.8 424.3 353.1 434.1 343.8 434.7 278.5 392.8 260 386.7 248.9 387.3 240.9 390.4 224.3 406.4 207 418.1 193.4 423.6 175 427.3 150.9 426.1 134.3 421.2 117.6 413.2 100.4 401.5 77.6 378 65.2 356.5 56.6 325.6 56.6 298.5 64 272.6 75.1 254.8 94.2 238.7 106.5 233.8Z" />
        <path d="M184.2 158.6 216.9 161.1 232.3 166 250.1 174.6 353.7 238.7 453.5 303.5 456.6 308.4 456 350.9 454.2 355.2 382 410.7 379 411.3 377.7 368.8 375.9 364.5 253.2 283.7 253.8 280.7 260 275.7 318.6 235.7 317.9 231.3 258.2 194.4 248.9 198.7 244.6 221.5 209.5 226.4 189.7 243.1 152.1 224 130.6 219.6 112.1 220.3 101.6 222.7 77.6 235 94.8 207.9 120.7 183.3 150.3 166.6 167.6 161.1ZM444.9 327.5 387.6 370 388.2 387.9 445.5 344.8Z" />
        <path d="M260.6 209.2 298.8 233.8 258.8 262.2 249.5 268.3 246.4 268.3 208.9 243.7 216.9 237.5 255.7 232.6 258.2 228.9Z" />
      </motion.g>
      <motion.g className="whistle-lines" animate={lines} style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
        <path className="whistle-line" d="M161.9 88.8L167.7 128.9A9.6 9.6 0 0 0 186.8 126.1L181 86A9.6 9.6 0 0 0 161.9 88.8Z" />
        <path className="whistle-line" d="M224.8 95.4L207.9 130.8A9.8 9.8 0 0 0 225.6 139.2L242.4 103.9A9.8 9.8 0 0 0 224.8 95.4Z" />
        <path className="whistle-line" d="M145.2 135.4L119.9 103A9.9 9.9 0 0 0 104.2 115.2L129.6 147.7A9.9 9.9 0 0 0 145.2 135.4Z" />
      </motion.g>
    </motion.svg>
  );
}

export default function WeekWarningModal({ flags, slotNames, saving, suggesting, hasSuggestion, onSuggest, onKeep, onAdjust }) {
  const busy = saving || suggesting;
  const [blowN, setBlowN] = useState(0); // increments on tap → fires the one-time whistle "blow"
  const [labelHold, setLabelHold] = useState(false); // keep original label ~380ms so the blow reads BEFORE "Thinking…"
  const lines = warningCopy(flags || [], slotNames);
  return createPortal(
    <AnimatePresence>
      {flags && (
        <>
          <motion.div key="warn-bd" onClick={saving ? undefined : onAdjust}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
          <motion.div key="warn-card"
            initial={{ y: "112%" }} animate={{ y: 0 }} exit={{ y: "112%" }}
            transition={{ type: "spring", bounce: 0.14, duration: 0.4 }}
            style={{ position: "fixed", left: 12, right: 12, bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)", zIndex: 501, maxWidth: 440, marginLeft: "auto", marginRight: "auto", background: "var(--cm-paper,#fff)", borderRadius: 24, padding: "22px 20px", boxShadow: "0 -10px 44px rgba(0,0,0,.34)" }}>
            {/* Icon chip (amber, not red) + neutral title */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 15 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(var(--cm-warn-rgb,232,161,58),.16)", color: "var(--cm-warn,#E8A13A)" }}>
                <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.4v.2" /></svg>
              </div>
              <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 18, color: "var(--cm-ink,#0A0A0A)", letterSpacing: "-0.01em" }}>Before you save</div>
            </div>

            {/* Copy — what tripped + why, plain and brief */}
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 20 }}>
              {lines.map((ln, i) => (
                <div key={i}>
                  <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 14.5, color: "var(--cm-ink,#0A0A0A)", lineHeight: 1.3 }}>{ln.head}</div>
                  <div style={{ fontFamily: _AF, fontWeight: 500, fontSize: 13, color: "rgba(var(--cm-ink-rgb,10,10,10),.6)", lineHeight: 1.5, marginTop: 3 }}>{ln.body}</div>
                </div>
              ))}
            </div>

            {/* Actions (stacked): the coach's suggestion (primary, when reordering can help),
                "Keep it my way" (always present + easy — non-negotiable), and manual adjust. */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {hasSuggestion && (
                <button onClick={busy ? undefined : () => { setBlowN((n) => n + 1); setLabelHold(true); setTimeout(() => setLabelHold(false), 380); onSuggest(); }} disabled={busy}
                  style={{ fontFamily: _AF, fontWeight: 800, fontSize: 14, color: "#fff", background: "var(--cm-accent,#FF3B30)", border: "none", borderRadius: 14, padding: "14px", cursor: "pointer", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, opacity: suggesting ? 0.85 : 1 }}>
                  {/* Whistle stays mounted through the beat so the blow is visible. Label swap to "Thinking…"
                      is HELD ~380ms (past the blow's peak) so the whistle blow reads first, then it settles. */}
                  <WhistleGlyph size={28} blowTrigger={blowN} />
                  <span>{suggesting && !labelHold ? "Thinking…" : "Use Coach Macro's suggestion"}</span>
                </button>
              )}
              <button onClick={busy ? undefined : onKeep} disabled={busy}
                style={{ fontFamily: _AF, fontWeight: 800, fontSize: 14, color: "var(--cm-ink,#0A0A0A)", background: "transparent", border: "1.5px solid rgba(var(--cm-ink-rgb,10,10,10),.16)", borderRadius: 14, padding: "14px", cursor: "pointer", WebkitTapHighlightColor: "transparent", opacity: busy ? 0.6 : 1 }}>
                {saving ? "Saving…" : "Keep it my way"}
              </button>
              <button onClick={busy ? undefined : onAdjust} disabled={busy}
                style={hasSuggestion
                  ? { fontFamily: _AF, fontWeight: 700, fontSize: 13.5, color: "rgba(var(--cm-ink-rgb,10,10,10),.55)", background: "transparent", border: "none", borderRadius: 14, padding: "10px", cursor: "pointer", WebkitTapHighlightColor: "transparent", opacity: busy ? 0.6 : 1 }
                  : { fontFamily: _AF, fontWeight: 800, fontSize: 14, color: "#fff", background: "var(--cm-accent,#FF3B30)", border: "none", borderRadius: 14, padding: "14px", cursor: "pointer", WebkitTapHighlightColor: "transparent", opacity: busy ? 0.6 : 1 }}>
                Let me adjust
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
