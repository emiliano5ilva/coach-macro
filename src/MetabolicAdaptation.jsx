import { useState } from "react";
import { T } from "./components.jsx";

// ── Notification banner — shown in HomeSection ────────────────────────────────
export function MetabolicAdaptationBanner({ adaptation, onView, onDismiss }) {
  if (!adaptation) return null;
  const pd = adaptation.plateau_data || {};
  return (
    <div style={{
      margin: "0 20px 14px",
      borderRadius: 16,
      overflow: "hidden",
      border: "1.5px solid rgba(239,68,68,0.35)",
      animation: "fade-in 0.4s",
    }}>
      {/* Header strip */}
      <div style={{
        background: "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(245,158,11,0.1))",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderBottom: "1px solid rgba(239,68,68,0.2)",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔔</span>
        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em", color: "#ef4444", textTransform: "uppercase", fontWeight: 700 }}>
          COACH MACRO NOTICED SOMETHING
        </div>
      </div>

      {/* Body */}
      <div style={{ background: "var(--navy-card)", padding: "14px 16px 16px" }}>
        <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 20, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8, color: "#fff" }}>
          METABOLIC ADAPTATION DETECTED
        </div>
        <div style={{ fontSize: 13, color: "rgba(245,245,240,.7)", lineHeight: 1.6, marginBottom: 14 }}>
          You've been eating <strong style={{ color: "#fff" }}>{pd.currentCalories} calories</strong> for <strong style={{ color: "#fff" }}>{pd.weeksOnSameCalories} weeks</strong> and your weight has barely moved — despite hitting your targets <strong style={{ color: "#22c55e" }}>{pd.adherence}%</strong> of the time.
          <br /><br />
          This is metabolic adaptation. It's not your fault. It happens to everyone. Your body is smart — it adjusted.
          <br /><br />
          I have a specific 3-week protocol to break through this.
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onView}
            style={{
              flex: 1, padding: "13px 16px", background: "#ef4444", border: "none",
              borderRadius: 12, color: "#fff", fontFamily: "var(--condensed)", fontWeight: 800,
              fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
            }}
          >
            See My Recommendation →
          </button>
          <button
            onClick={onDismiss}
            style={{
              padding: "13px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 12, color: "rgba(245,245,240,.5)", fontFamily: "var(--mono)", fontSize: 11,
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Full recommendation modal ─────────────────────────────────────────────────
export function MetabolicAdaptationModal({ adaptation, onStartProtocol, onDismiss }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  if (!adaptation) return null;

  const pd = adaptation.plateau_data || {};
  const protocol = adaptation.protocol || {};
  const phases = protocol.phases || {};
  const explanation = protocol.explanation || "";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.85)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        flex: 1, overflowY: "auto",
        background: "var(--navy)",
        maxWidth: 480, width: "100%", margin: "0 auto",
        paddingBottom: 40,
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 20px 0",
          background: "linear-gradient(180deg,rgba(239,68,68,0.12),transparent)",
          borderBottom: "1px solid rgba(239,68,68,0.15)",
          paddingBottom: 16,
        }}>
          <button onClick={onDismiss} style={{
            background: "none", border: "none", color: "rgba(245,245,240,.4)",
            fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1, float: "right",
          }}>×</button>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.16em", color: "#ef4444", textTransform: "uppercase", marginBottom: 8 }}>
            // Metabolic Adaptation Protocol
          </div>
          <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 32, textTransform: "uppercase", lineHeight: 1, marginBottom: 6 }}>
            BREAKING YOUR PLATEAU
          </div>
          <div style={{ fontSize: 12, color: "rgba(245,245,240,.5)" }}>3-week reset — then back to progress</div>
        </div>

        <div style={{ padding: "0 20px", marginTop: 20 }}>
          {/* AI explanation */}
          {explanation && (
            <div style={{
              background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 14, padding: "14px 16px", marginBottom: 20,
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,245,240,.35)", textTransform: "uppercase", marginBottom: 8 }}>What happened</div>
              <div style={{ fontSize: 13, color: "rgba(245,245,240,.8)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{explanation}</div>
            </div>
          )}

          {/* Protocol phases */}
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,245,240,.35)", textTransform: "uppercase", marginBottom: 12 }}>
            THE PROTOCOL
          </div>

          {/* Phase 1 */}
          {phases.phase1 && (
            <PhaseCard
              num={1}
              name="Reverse Diet"
              duration="2 weeks"
              calories={phases.phase1.calories}
              color="#f59e0b"
              why="Gradually restores your metabolic rate. Your body has adapted to your current intake — we need to bring it back up slowly."
              expect={`Scale may go up 0.5–1 ${pd.wUnit || "lbs"} (water and glycogen — not fat)`}
            />
          )}

          {/* Phase 2 */}
          {phases.phase2 && (
            <PhaseCard
              num={2}
              name="Diet Break"
              duration="1 week"
              calories={phases.phase2.calories}
              color="#3b82f6"
              why="Full maintenance eating resets leptin, thyroid hormones, and metabolic rate. One week is enough to make a measurable difference."
              expect="Scale stabilizes — no guilt, this is strategy"
            />
          )}

          {/* Phase 3 */}
          {phases.phase3 && (
            <PhaseCard
              num={3}
              name="New Deficit"
              duration="Ongoing"
              calories={phases.phase3.calories}
              color="#22c55e"
              why={`${phases.phase3.calories} is ${phases.phase3.calories - pd.currentCalories > 0 ? (phases.phase3.calories - pd.currentCalories) + " more" : "slightly less"} than your previous target — but now it's an actual deficit because your metabolism has reset.`}
              expect={`~${protocol.estimatedWeeklyLoss || 0.5} ${pd.wUnit || "lbs"}/week fat loss resumes`}
            />
          )}

          {/* Timeline */}
          <div style={{
            background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 14, padding: "14px 16px", marginTop: 4, marginBottom: 24,
          }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,245,240,.35)", textTransform: "uppercase", marginBottom: 10 }}>TIMELINE</div>
            {[
              { period: "Week 1–2", action: "Reverse diet — eating more on purpose" },
              { period: "Week 3", action: "Full maintenance — metabolism resets" },
              { period: "Week 4+", action: "New results expected — progress resumes" },
            ].map(({ period, action }) => (
              <div key={period} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "#ef4444", fontWeight: 700, width: 60, flexShrink: 0, paddingTop: 1 }}>{period}</div>
                <div style={{ fontSize: 12, color: "rgba(245,245,240,.65)", lineHeight: 1.5 }}>{action}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          {!confirmOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => setConfirmOpen(true)}
                style={{
                  width: "100%", padding: "16px", background: "#ef4444", border: "none",
                  borderRadius: 14, color: "#fff", fontFamily: "var(--condensed)", fontWeight: 800,
                  fontSize: 15, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Start the Protocol →
              </button>
              <button onClick={onDismiss} style={{
                width: "100%", padding: "12px", background: "transparent",
                border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
                color: "rgba(245,245,240,.4)", fontFamily: "var(--mono)", fontSize: 11,
                letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              }}>
                Not right now
              </button>
            </div>
          )}

          {/* Confirmation panel */}
          {confirmOpen && (
            <ConfirmPanel
              adaptation={adaptation}
              onConfirm={onStartProtocol}
              onCancel={() => setConfirmOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PhaseCard({ num, name, duration, calories, color, why, expect }) {
  return (
    <div style={{
      borderRadius: 14, marginBottom: 12, overflow: "hidden",
      border: `1px solid ${color}25`,
    }}>
      <div style={{ background: `${color}12`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700 }}>PHASE {num} — {name.toUpperCase()}</span>
          <span style={{ marginLeft: 8, fontSize: 9, color: "rgba(245,245,240,.4)", fontFamily: "var(--mono)" }}>{duration}</span>
        </div>
        <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 20, color }}>
          {calories.toLocaleString()} <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(245,245,240,.5)" }}>cal/day</span>
        </div>
      </div>
      <div style={{ background: "var(--navy-card)", padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: "rgba(245,245,240,.6)", lineHeight: 1.55, marginBottom: 6 }}>
          <span style={{ color: "rgba(245,245,240,.35)", fontWeight: 700 }}>Why: </span>{why}
        </div>
        <div style={{ fontSize: 11, color: "rgba(245,245,240,.6)", lineHeight: 1.55 }}>
          <span style={{ color, fontWeight: 700 }}>Expect: </span>{expect}
        </div>
      </div>
    </div>
  );
}

function ConfirmPanel({ adaptation, onConfirm, onCancel }) {
  const phases = adaptation.protocol?.phases || {};
  const pd = adaptation.plateau_data || {};
  return (
    <div style={{
      background: "rgba(239,68,68,0.06)",
      border: "1.5px solid rgba(239,68,68,0.3)",
      borderRadius: 16,
      padding: "18px 16px",
    }}>
      <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 18, textTransform: "uppercase", marginBottom: 10 }}>
        Starting Metabolic Reset
      </div>
      <div style={{ fontSize: 12, color: "rgba(245,245,240,.65)", lineHeight: 1.6, marginBottom: 14 }}>
        Your calorie target will update now:
        <div style={{ margin: "10px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 22, color: "rgba(245,245,240,.4)", textDecoration: "line-through" }}>{pd.currentCalories}</span>
          <span style={{ color: "rgba(245,245,240,.3)" }}>→</span>
          <span style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 26, color: "#f59e0b" }}>{phases.phase1?.calories}</span>
          <span style={{ fontSize: 11, color: "rgba(245,245,240,.4)" }}>cal/day this week</span>
        </div>
        <span style={{ color: "#f59e0b", fontWeight: 700 }}>This is intentional</span> — eating more to lose more. Trust the process.
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onConfirm} style={{
          flex: 1, padding: "14px", background: "#ef4444", border: "none", borderRadius: 12,
          color: "#fff", fontFamily: "var(--condensed)", fontWeight: 800, fontSize: 14,
          letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        }}>
          Confirm →
        </button>
        <button onClick={onCancel} style={{
          padding: "14px 16px", background: "rgba(255,255,255,.05)",
          border: "1px solid rgba(255,255,255,.1)", borderRadius: 12,
          color: "rgba(245,245,240,.5)", fontFamily: "var(--mono)", fontSize: 11,
          letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Protocol progress card — shown in Fuel tab ────────────────────────────────
export function MetabolicResetProgressCard({ progress, onComplete }) {
  if (!progress) return null;
  const [expanded, setExpanded] = useState(false);

  const phaseColor = progress.phase === 1 ? "#f59e0b" : progress.phase === 2 ? "#3b82f6" : "#22c55e";
  const weekLabel = progress.weekNum ? `WEEK ${progress.weekNum} OF ${progress.totalWeeks}` : "PHASE 3 ACTIVE";

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1.5px solid ${phaseColor}30`,
      marginBottom: 12,
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: `linear-gradient(135deg,${phaseColor}12,${phaseColor}06)`,
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", color: phaseColor, textTransform: "uppercase", fontWeight: 700, marginBottom: 3 }}>
            METABOLIC RESET — {weekLabel}
          </div>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {progress.progressDots.map((done, i) => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: "50%",
                background: done ? phaseColor : "rgba(255,255,255,.12)",
                border: `1px solid ${done ? phaseColor : "rgba(255,255,255,.2)"}`,
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 18, color: phaseColor }}>
            {progress.targetCals?.toLocaleString()} cal
          </div>
          <div style={{ color: "rgba(245,245,240,.3)", fontSize: 14, transition: "transform .2s", transform: expanded ? "rotate(180deg)" : "none" }}>▾</div>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ background: "var(--navy-card)", padding: "12px 14px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(245,245,240,.5)", marginBottom: 6 }}>
            Phase: <span style={{ color: phaseColor, fontWeight: 700 }}>{progress.phaseName}</span>
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(245,245,240,.5)", marginBottom: 10 }}>
            Target this week: <span style={{ color: "#fff", fontWeight: 700 }}>{progress.targetCals?.toLocaleString()} cal</span>
            {progress.nextPhaseDate && (
              <span style={{ marginLeft: 8, color: "rgba(245,245,240,.3)" }}>
                · Next phase: {progress.nextPhaseDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </span>
            )}
          </div>

          {/* What to expect */}
          <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.12em", color: "rgba(245,245,240,.3)", textTransform: "uppercase", marginBottom: 6 }}>What to expect</div>
            {progress.phase === 1 && (
              <div style={{ fontSize: 11, color: "rgba(245,245,240,.65)", lineHeight: 1.6 }}>
                Scale may go up slightly.<br />
                This is water and glycogen — not fat.<br />
                <strong style={{ color: "#f59e0b" }}>Trust the process.</strong>
              </div>
            )}
            {progress.phase === 2 && (
              <div style={{ fontSize: 11, color: "rgba(245,245,240,.65)", lineHeight: 1.6 }}>
                Full maintenance week. Enjoy it — you've earned it.<br />
                Scale stabilizes. Metabolism resets.<br />
                <strong style={{ color: "#3b82f6" }}>One more week and you're back in deficit.</strong>
              </div>
            )}
            {progress.phase === 3 && !progress.isComplete && (
              <div style={{ fontSize: 11, color: "rgba(245,245,240,.65)", lineHeight: 1.6 }}>
                New deficit is active. Progress should resume within 2 weeks.<br />
                <strong style={{ color: "#22c55e" }}>Monitor the scale — you should see movement now.</strong>
              </div>
            )}
            {progress.isComplete && (
              <div>
                <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 16, color: "#22c55e", marginBottom: 6 }}>
                  METABOLIC RESET COMPLETE ✓
                </div>
                <div style={{ fontSize: 11, color: "rgba(245,245,240,.65)", lineHeight: 1.6, marginBottom: 10 }}>
                  Your metabolism has been reset. Progress should now resume.
                </div>
                <button
                  onClick={onComplete}
                  style={{
                    padding: "10px 18px", background: "#22c55e", border: "none", borderRadius: 10,
                    color: "#000", fontFamily: "var(--condensed)", fontWeight: 800, fontSize: 12,
                    letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                  }}
                >
                  Mark Complete →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
