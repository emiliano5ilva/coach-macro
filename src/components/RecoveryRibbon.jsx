// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY-LOAD RIBBON (v2 — session-baseline). 7 segments, one per day, colored by that day's load
// (demanding / recovery / rest). Recolors LIVE as the week reorders (~250ms morph).
//
// CALM-BY-DEFAULT: a week at or below its opening `baseline` conflict count reads as normal load —
// back-to-back days that were there when the user opened (or on a read-only view) are NOT alarmed;
// they're expected at this volume. The ribbon escalates to AMBER (and the status shows "+N") ONLY
// when the user's edits push conflicts ABOVE the baseline — i.e. they created fixable worsening.
// baseline=null (read-only) → never escalates.
//
// Colors are theme tokens: --cm-accent (demanding), --cm-good (recovery), --cm-warn (over-baseline
// warning), ink-tint (rest) — recolors across all 8 themes.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { evaluateWeek } from "../utils/weekRecovery.js";

const _AF = "'Archivo',sans-serif";

function segColor(s, excess) {
  if (s.conflict && excess) return "var(--cm-warn,#E8A13A)"; // pushed above baseline → amber alarm
  if (s.load === "rest") return "rgba(var(--cm-ink-rgb,10,10,10),.13)";
  if (s.load === "recovery") return "var(--cm-good,#2E9E6B)";
  return "var(--cm-accent,#FF3B30)"; // demanding (incl. baseline back-to-backs — calm, expected)
}

export default function RecoveryRibbon({ mods, baseline = null }) {
  const { statuses, conflictCount, hasRest } = evaluateWeek(mods);
  const excess = baseline != null && conflictCount > baseline; // user worsened beyond what they opened with
  const diff = excess ? conflictCount - baseline : 0;
  const statusText = excess
    ? `+${diff} conflict${diff > 1 ? "s" : ""}`
    : (conflictCount > 0 ? "Dense week" : (hasRest ? "Balanced" : "Full week"));
  const statusColor = excess
    ? "var(--cm-warn,#E8A13A)"
    : (conflictCount > 0 ? "rgba(var(--cm-ink-rgb,10,10,10),.5)" : "var(--cm-good,#2E9E6B)");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {statuses.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: segColor(s, excess), transition: "background-color 250ms ease" }} />
        ))}
      </div>
      <span style={{ fontFamily: _AF, fontWeight: 800, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor, flexShrink: 0 }}>
        {statusText}
      </span>
    </div>
  );
}
