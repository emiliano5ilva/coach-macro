// ─────────────────────────────────────────────────────────────────────────────
// WEEK WARNING MODAL — coach-not-nag. Shown on Save when a recovery rule (R2/R3) trips.
// Informs calmly, then RESPECTS the athlete's call: "Keep it my way" is always present and easy.
// Portaled to document.body (like the edit sheet) so it escapes .cm-paper-card's containing block.
// All --cm-* tokens; recolors across themes.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { warningCopy } from "../utils/weekRecovery.js";

const _AF = "'Archivo',sans-serif";

export default function WeekWarningModal({ flags, slotNames, saving, suggesting, hasSuggestion, onSuggest, onKeep, onAdjust }) {
  const busy = saving || suggesting;
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
                <button onClick={busy ? undefined : onSuggest} disabled={busy}
                  style={{ fontFamily: _AF, fontWeight: 800, fontSize: 14, color: "#fff", background: "var(--cm-accent,#FF3B30)", border: "none", borderRadius: 14, padding: "14px", cursor: "pointer", WebkitTapHighlightColor: "transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: suggesting ? 0.85 : 1 }}>
                  {suggesting ? "Thinking…" : "✨ Use Coach Macro's suggestion"}
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
