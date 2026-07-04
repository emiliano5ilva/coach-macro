// ─────────────────────────────────────────────────────────────────────────────
// RECOVERY-LOAD RIBBON (v1) — the visible intelligence. 7 segments, one per day, colored by that
// day's coarse load state (demanding / recovery / rest) with R2 conflicts overlaid in red. Recolors
// LIVE as the week reorders (CSS background-color morph, ~250ms — no instant snap). Right-aligned
// status ("Balanced" / "N conflict" / "No rest day") colored to the worst state.
//
// Colors are theme tokens: --cm-accent (demanding load), --cm-good (recovery), --cm-bad (conflict),
// --cm-warn (no-rest caution), ink-tint (rest) — recolors across all 8 themes.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import { evaluateWeek } from "../utils/weekRecovery.js";

const _AF = "'Archivo',sans-serif";

function segColor(s) {
  if (s.conflict) return "var(--cm-bad,#E5533B)";
  if (s.load === "rest") return "rgba(var(--cm-ink-rgb,10,10,10),.13)";
  if (s.load === "recovery") return "var(--cm-good,#2E9E6B)";
  return "var(--cm-accent,#FF3B30)"; // demanding
}

export default function RecoveryRibbon({ mods }) {
  const { statuses, summary, worst } = evaluateWeek(mods);
  const statusColor = worst === "bad" ? "var(--cm-bad,#E5533B)" : worst === "warn" ? "var(--cm-warn,#E8A13A)" : "var(--cm-good,#2E9E6B)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 4, flex: 1 }}>
        {statuses.map((s, i) => (
          <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: segColor(s), transition: "background-color 250ms ease" }} />
        ))}
      </div>
      <span style={{ fontFamily: _AF, fontWeight: 800, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: statusColor, flexShrink: 0 }}>
        {summary}
      </span>
    </div>
  );
}
