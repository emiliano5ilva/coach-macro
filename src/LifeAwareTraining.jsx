import { useState } from "react";
import { T } from "./components.jsx";

// ── Calendar connect prompt ───────────────────────────────────────────────────
export function CalendarConnectPrompt({ onConnect, onDismiss }) {
  const [connecting, setConnecting] = useState(false);
  async function handleConnect() {
    setConnecting(true);
    await onConnect();
    setConnecting(false);
  }
  return (
    <div style={{
      margin: "0 20px 14px",
      borderRadius: 16,
      border: "1px solid rgba(59,130,246,0.3)",
      overflow: "hidden",
    }}>
      <div style={{
        background: "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.05))",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>🗓️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 16, textTransform: "uppercase", letterSpacing: ".04em", color: "#fff", marginBottom: 4 }}>
            Life-Aware Training
          </div>
          <div style={{ fontSize: 12, color: "rgba(245,245,240,.6)", lineHeight: 1.55, marginBottom: 12 }}>
            Connect your calendar so Coach Macro can adapt your training around travel, deadlines, and your schedule. We only read event titles and times — never descriptions or details.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                flex: 1, padding: "11px 14px", background: "#3b82f6", border: "none",
                borderRadius: 10, color: "#fff", fontFamily: "var(--condensed)", fontWeight: 800,
                fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
                opacity: connecting ? 0.7 : 1,
              }}
            >
              {connecting ? "Connecting…" : "Connect Calendar →"}
            </button>
            <button
              onClick={onDismiss}
              style={{
                padding: "11px 14px", background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.08)", borderRadius: 10,
                color: "rgba(245,245,240,.4)", fontFamily: "var(--mono)", fontSize: 11,
                letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Individual alert card ─────────────────────────────────────────────────────
export function ScheduleAlertCard({ alert, onAction, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    onDismiss?.(alert.id);
  }

  const borderColor =
    alert.severity === "high" ? "rgba(239,68,68,0.3)" :
    alert.severity === "medium" ? "rgba(245,158,11,0.3)" :
    alert.severity === "info" ? "rgba(59,130,246,0.3)" :
    "rgba(34,197,94,0.3)";

  const bgColor =
    alert.severity === "high" ? "rgba(239,68,68,0.07)" :
    alert.severity === "medium" ? "rgba(245,158,11,0.07)" :
    alert.severity === "info" ? "rgba(59,130,246,0.07)" :
    "rgba(34,197,94,0.07)";

  const labelColor =
    alert.severity === "high" ? "#ef4444" :
    alert.severity === "medium" ? T.fat :
    alert.severity === "info" ? "#3b82f6" :
    T.green;

  return (
    <div style={{
      margin: "0 20px 12px",
      borderRadius: 16,
      border: `1.5px solid ${borderColor}`,
      overflow: "hidden",
      animation: "fade-in 0.35s",
    }}>
      {/* Header */}
      <div style={{
        background: bgColor,
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${borderColor}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{alert.icon}</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em", color: labelColor, textTransform: "uppercase", fontWeight: 700 }}>
            {alert.title}
          </span>
        </div>
        <button onClick={dismiss} style={{ background: "none", border: "none", color: "rgba(245,245,240,.3)", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
      </div>

      {/* Body */}
      <div style={{ background: "var(--navy-card)", padding: "12px 14px" }}>
        <div style={{ fontSize: 13, color: "rgba(245,245,240,.75)", lineHeight: 1.6, marginBottom: 12 }}>
          {alert.message}
        </div>

        {/* Travel: multi-option buttons */}
        {alert.type === "travel_conflict" && alert.suggestions && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {alert.suggestions.map(s => (
              <button
                key={s.id}
                onClick={() => { onAction(alert, s); dismiss(); }}
                style={{
                  width: "100%", padding: "10px 14px",
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 10, color: "#fff", textAlign: "left",
                  fontFamily: "var(--condensed)", fontWeight: 700,
                  fontSize: 13, cursor: "pointer", display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                }}
              >
                <span>{s.label}</span>
                <span style={{ fontSize: 10, color: "rgba(245,245,240,.4)", fontFamily: "var(--mono)", fontWeight: 400 }}>{s.description}</span>
              </button>
            ))}
          </div>
        )}

        {/* Stress week: apply/dismiss */}
        {alert.type === "high_stress_week" && alert.suggestion && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onAction(alert, alert.suggestion); dismiss(); }}
              style={{
                flex: 1, padding: "11px 14px", background: T.fat,
                border: "none", borderRadius: 10, color: "#000",
                fontFamily: "var(--condensed)", fontWeight: 800,
                fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              {alert.suggestion.label}
            </button>
            <button onClick={dismiss} style={{
              padding: "11px 14px", background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
              color: "rgba(245,245,240,.5)", fontFamily: "var(--mono)", fontSize: 11,
              letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
            }}>
              {alert.dismissLabel || "Keep Normal"}
            </button>
          </div>
        )}

        {/* Opportunity: do it / skip */}
        {alert.type === "opportunity" && alert.suggestion && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { onAction(alert, alert.suggestion); dismiss(); }}
              style={{
                flex: 1, padding: "11px 14px", background: T.green,
                border: "none", borderRadius: 10, color: "#000",
                fontFamily: "var(--condensed)", fontWeight: 800,
                fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              {alert.suggestion.label}
            </button>
            <button onClick={dismiss} style={{
              padding: "11px 14px", background: "rgba(255,255,255,.05)",
              border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
              color: "rgba(245,245,240,.5)", fontFamily: "var(--mono)", fontSize: 11,
              letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
            }}>
              {alert.skipLabel || "Skip"}
            </button>
          </div>
        )}

        {/* Early morning: info only */}
        {alert.type === "early_morning_warning" && (
          <button onClick={dismiss} style={{
            padding: "9px 16px", background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
            color: "rgba(245,245,240,.5)", fontFamily: "var(--mono)", fontSize: 11,
            letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
          }}>
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

// ── Travel day nutrition card ─────────────────────────────────────────────────
export function TravelNutritionCard({ travelAdvice, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  if (!travelAdvice) return null;
  return (
    <div style={{
      margin: "0 20px 12px",
      borderRadius: 16,
      border: "1px solid rgba(245,158,11,0.3)",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "rgba(245,158,11,0.08)",
          padding: "12px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          borderBottom: expanded ? "1px solid rgba(245,158,11,0.15)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>✈️</span>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em", color: T.fat, textTransform: "uppercase", fontWeight: 700 }}>
              TRAVEL DAY NUTRITION
            </div>
            <div style={{ fontSize: 11, color: "rgba(245,245,240,.5)", marginTop: 1 }}>{travelAdvice.dateLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: T.fat }}>Tap for game plan</span>
          <div style={{ color: "rgba(245,245,240,.3)", fontSize: 14, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</div>
        </div>
      </div>
      {expanded && (
        <div style={{ background: "var(--navy-card)", padding: "14px 16px" }}>
          <div style={{ fontSize: 13, color: "rgba(245,245,240,.8)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {travelAdvice.text}
          </div>
          <button onClick={onDismiss} style={{
            marginTop: 12, padding: "8px 14px", background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 9,
            color: "rgba(245,245,240,.4)", fontFamily: "var(--mono)", fontSize: 10,
            letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer",
          }}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}

// ── Calendar settings panel (for SettingsSection) ────────────────────────────
export function CalendarSettingsPanel({ connected, onConnect, onDisconnect, prefs, onPrefsChange }) {
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;

  const toggles = [
    { key: "travelDetection", label: "Travel detection", sub: "Alerts when travel conflicts with training days" },
    { key: "stressWeekDetection", label: "Stress week detection", sub: "Detects deadline clusters, suggests lighter sessions" },
    { key: "freeTimeOpportunities", label: "Free time opportunities", sub: "Spots free blocks for unscheduled sessions" },
    { key: "earlyMorningWarnings", label: "Early morning warnings", sub: "Heads up when early events may affect sleep" },
  ];

  return (
    <div>
      {/* Status row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${T.bd}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            🗓️
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Calendar</div>
            <div style={{ fontSize: 11, color: T.mu, marginTop: 1 }}>Life-Aware Training</div>
          </div>
        </div>
        <div style={{
          fontFamily: "var(--mono)", fontSize: 10, padding: "4px 10px", borderRadius: 6,
          background: connected ? "rgba(34,197,94,0.12)" : isNative ? "rgba(245,245,240,0.06)" : "rgba(245,245,240,0.04)",
          color: connected ? T.green : isNative ? T.mu : "rgba(245,245,240,0.3)",
          border: `1px solid ${connected ? "rgba(34,197,94,0.3)" : T.bd}`,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          {connected ? "Connected ✓" : isNative ? "Not connected" : "iPhone Only"}
        </div>
      </div>

      {/* Connect/disconnect button */}
      {isNative && (
        <div style={{ paddingTop: 12 }}>
          {!connected ? (
            <button
              onClick={onConnect}
              style={{
                width: "100%", padding: "12px", background: "#3b82f6", border: "none",
                borderRadius: 12, color: "#fff", fontFamily: "var(--condensed)", fontWeight: 800,
                fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Connect Calendar →
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              style={{
                width: "100%", padding: "10px", background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12,
                color: "#ef4444", fontFamily: "var(--mono)", fontSize: 11,
                letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Disconnect Calendar
            </button>
          )}
        </div>
      )}

      {/* Privacy note */}
      <div style={{ paddingTop: 10, fontSize: 11, color: T.mu, lineHeight: 1.6 }}>
        {connected
          ? "Coach Macro reads event titles and times only — never descriptions, attendees, or locations. Calendar data is processed on-device and never sent to our servers."
          : "We read event titles and times to adapt training around your schedule. We never write to your calendar or read event content."}
      </div>

      {/* Toggles — only shown when connected */}
      {connected && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 0 }}>
          {toggles.map(({ key, label, sub }, i) => (
            <div
              key={key}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0",
                borderBottom: i < toggles.length - 1 ? `1px solid ${T.bd}` : "none",
              }}
            >
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ fontSize: 13, color: "#fff", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: T.mu, lineHeight: 1.5 }}>{sub}</div>
              </div>
              <div
                onClick={() => onPrefsChange(key, prefs[key] !== false ? false : true)}
                style={{
                  width: 44, height: 26, borderRadius: 13, cursor: "pointer", flexShrink: 0,
                  background: prefs[key] !== false ? T.prot : "rgba(255,255,255,.12)",
                  transition: "background .2s", position: "relative",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, width: 20, height: 20,
                  borderRadius: "50%", background: "#fff",
                  left: prefs[key] !== false ? 21 : 3,
                  transition: "left .2s",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
