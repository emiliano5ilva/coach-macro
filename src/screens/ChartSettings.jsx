// Chart settings system — skill levels, time range, chart visibility & order.
import { useState } from "react";
import { T } from "../components.jsx";

// ── Chart registry ─────────────────────────────────────────────────────────────
export const CHART_REGISTRY = [
  {
    key: "flux_range", label: "Am I Getting Stronger?", category: "strength", beginner: true,
    description: "Tracks your best estimated max lift over time. The band shows normal week-to-week variation — this is expected. The line shows the real trend. Focus on the line, not any single session.",
    whatToDo: "If the line is flat for 3+ weeks, add weight or change rep range. If it's rising, stay the course.",
  },
  {
    key: "peak_performance", label: "Peak Performance Timing", category: "overview", beginner: false,
    description: "Shows when your body is primed to push hard based on fitness vs fatigue balance. Green zones = recovered and ready. The dip after a hard week is normal — it's called supercompensation.",
    whatToDo: "Schedule your hardest sessions in green zones. Use red zones for technique work or active recovery.",
  },
  {
    key: "body_comp_vector", label: "Which Way Am I Going?", category: "overview", beginner: false,
    description: "Plots the direction of your body composition change based on strength trends and body weight. Top-right = building strength while losing weight (ideal). Top-left = losing weight but also losing strength.",
    whatToDo: "Aim for the top-right quadrant. If you're in top-left, increase protein. If bottom-right, check calorie surplus.",
  },
  {
    key: "muscle_volume", label: "Muscle Group Volume", category: "strength", beginner: true,
    description: "Shows weekly sets per muscle group relative to your recovery capacity. The green zone is enough to grow without burning out. The blue zone needs more work. The red zone needs a deload.",
    whatToDo: "Prioritize any muscle group stuck in blue (undertrained). If a group is red, drop its volume next week.",
  },
  {
    key: "goal_cone", label: "When Do I Hit My Goal?", category: "strength", beginner: false,
    description: "Projects when you'll reach your next strength milestone based on your actual rate of progress. The cone shows best case vs slower pace — both are realistic depending on recovery and consistency.",
    whatToDo: "If best-case feels too far away, check if you're in a calorie deficit. Strength gains are 2–3× slower in a cut.",
  },
  {
    key: "balance_check", label: "Am I In Balance?", category: "strength", beginner: false,
    description: "Compares push vs pull, upper vs lower, and front vs back training volume. Imbalances don't hurt today — they hurt 3–6 months from now as postural and joint issues develop.",
    whatToDo: "If pull is more than 20% behind push, add a row to every upper body session. Balanced ratios = injury prevention.",
  },
  {
    key: "injury_risk", label: "Injury Risk This Week", category: "strength", beginner: false,
    description: "Calculates injury risk based on how much your training load changed vs last week. The #1 cause of overuse injuries is doing too much too fast — not doing too much overall.",
    whatToDo: "Keep weekly volume increases under 10%. If risk is high, do not add new exercises or increase weight this week.",
  },
  {
    key: "weight_trend", label: "My Weight Trend", category: "nutrition", beginner: true,
    description: "Your real weight trend after filtering out daily fluctuations from water, food, and hormones. The bold line is the only number that matters. One week tells you nothing — watch the month.",
    whatToDo: "If the line doesn't match your goal, adjust calories by 150–200 kcal/day and reassess in 2 weeks.",
  },
  {
    key: "macro_calendar", label: "My Nutrition Calendar", category: "nutrition", beginner: true,
    description: "90-day view of how consistently you're hitting your nutrition targets. Consistency over time reveals more than any single day. Tap any day to see exactly what you ate.",
    whatToDo: "Look for patterns: which days of the week do you miss? That's where to focus your prep.",
  },
  {
    key: "nutrition_perf", label: "Is My Diet Affecting Training?", category: "nutrition", beginner: false,
    description: "Measures whether what you eat shows up in how you train 48 hours later. This is your personal data — not generic nutrition advice. Diet affects performance differently for different people.",
    whatToDo: "If correlation is strong, treat nutrition days as training days. Missing your targets today = a weaker workout Thursday.",
  },
  {
    key: "sleep_perf", label: "Does Sleep Affect Workouts?", category: "recovery", beginner: false,
    description: "Scatter plot of your actual sleep hours vs your actual workout performance. Shows your personal optimal sleep window. Most people see their biggest gains between 7–8.5 hours.",
    whatToDo: "Find your sweet spot and protect it. Even 45 minutes less than your optimal reduces performance measurably.",
  },
];

export const BEGINNER_CHARTS = ["flux_range","muscle_volume","weight_trend","macro_calendar","peak_performance","sleep_perf"];

export const DEFAULT_SETTINGS = {
  skill_level: "athlete",
  time_range: "1month",
  display_mode: "compact",
  visible_charts: Object.fromEntries(CHART_REGISTRY.map(c => [c.key, true])),
  chart_order: CHART_REGISTRY.map(c => c.key),
  analyst_options: { show_ctl_atl: false, show_formulas: false, show_confidence: false },
};

// ── ChartWrap — adds ⋮ menu and tap-to-expand to any chart card ───────────────
export function ChartWrap({ chartKey, onHide, onExplain, children }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      {children}
      {/* 3-dot button */}
      <button
        onPointerDown={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          position: "absolute", top: 14, right: 28,
          background: "none", border: "none",
          color: "rgba(245,245,240,0.18)", cursor: "pointer",
          fontSize: 18, padding: "2px 5px", lineHeight: 1,
          zIndex: 10, letterSpacing: 2,
        }}
        aria-label="Chart options"
      >⋮</button>

      {open && (
        <>
          <div onPointerDown={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 19 }} />
          <div style={{
            position: "absolute", top: 38, right: 20, zIndex: 20,
            background: T.s1, border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, padding: "4px 0", minWidth: 168,
            boxShadow: "0 8px 32px rgba(0,0,0,0.55)",
          }}>
            <DropBtn onClick={() => { setExpanded(true); setOpen(false); }}>Expand chart</DropBtn>
            <DropBtn onClick={() => { onExplain(chartKey); setOpen(false); }}>Explain this chart</DropBtn>
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "3px 0" }} />
            <DropBtn onClick={() => { onHide(); setOpen(false); }} danger>Hide this chart</DropBtn>
          </div>
        </>
      )}

      {/* Full-screen expanded view */}
      {expanded && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#060D1A", overflowY: "auto" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#060D1A", padding: "max(52px,env(safe-area-inset-top)) 20px 12px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => setExpanded(false)} style={{ background: "rgba(245,245,240,0.08)", border: "1px solid rgba(245,245,240,0.12)", borderRadius: 20, padding: "8px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Close ×
            </button>
          </div>
          <div style={{ transform: "scale(1.05)", transformOrigin: "top center", paddingBottom: 48 }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function DropBtn({ onClick, danger, children }) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", padding: "9px 14px",
      background: "none", border: "none",
      color: danger ? "#FF5252" : "rgba(245,245,240,0.80)",
      fontSize: 13, fontWeight: 500, textAlign: "left", cursor: "pointer",
    }}>
      {children}
    </button>
  );
}

// ── ChartExplainModal — plain-English explanation bottom sheet ────────────────
export function ChartExplainModal({ chartKey, onClose }) {
  const info = CHART_REGISTRY.find(c => c.key === chartKey);
  if (!info) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.72)" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", background: T.s3,
        borderRadius: "20px 20px 0 0", padding: "24px 20px 44px",
        maxHeight: "75vh", overflowY: "auto",
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2, margin: "0 auto 18px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 20, color: "white", textTransform: "uppercase", letterSpacing: "0.06em", flex: 1, marginRight: 12, lineHeight: 1.2 }}>
            {info.label}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(245,245,240,0.35)", cursor: "pointer", fontSize: 24, lineHeight: 1, padding: 2, flexShrink: 0 }}>×</button>
        </div>

        <div style={{ fontSize: 14, color: "rgba(245,245,240,0.72)", lineHeight: 1.65, marginBottom: 16 }}>
          {info.description}
        </div>

        {info.whatToDo && (
          <div style={{ background: "rgba(232,52,28,0.08)", border: "1px solid rgba(232,52,28,0.20)", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 11, color: "#e8341c", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>What to do with this</div>
            <div style={{ fontSize: 13, color: "rgba(245,245,240,0.68)", lineHeight: 1.6 }}>{info.whatToDo}</div>
          </div>
        )}

        <div style={{ fontSize: 10, color: "rgba(245,245,240,0.28)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Category: {info.category} {info.beginner && "· Beginner chart"}
        </div>

        <button onClick={onClose} style={{
          width: "100%", marginTop: 20, padding: 14,
          background: "#e8341c", border: "none", borderRadius: 12,
          color: "white", fontFamily: "'Barlow Condensed',sans-serif",
          fontWeight: 800, fontSize: 14, letterSpacing: "0.1em",
          textTransform: "uppercase", cursor: "pointer",
        }}>Got it</button>
      </div>
    </div>
  );
}

// ── ChartSettingsScreen — full-screen settings overlay ────────────────────────
export default function ChartSettingsScreen({ settings, onSave, onClose }) {
  const [local, setLocal] = useState({ ...DEFAULT_SETTINGS, ...settings });

  function update(patch) {
    const next = { ...local, ...patch };
    setLocal(next);
    onSave(next);
  }

  function setSkillLevel(level) {
    const keys = level === "beginner" ? BEGINNER_CHARTS : CHART_REGISTRY.map(c => c.key);
    const visible_charts = Object.fromEntries(CHART_REGISTRY.map(c => [c.key, keys.includes(c.key)]));
    update({ skill_level: level, visible_charts });
  }

  function toggleChart(key) {
    update({ visible_charts: { ...local.visible_charts, [key]: !(local.visible_charts?.[key] !== false) } });
  }

  function moveChart(key, dir) {
    const order = [...(local.chart_order || CHART_REGISTRY.map(c => c.key))];
    const idx = order.indexOf(key);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= order.length) return;
    [order[idx], order[next]] = [order[next], order[idx]];
    update({ chart_order: order });
  }

  function reset() {
    const next = { ...DEFAULT_SETTINGS };
    setLocal(next);
    onSave(next);
  }

  const order = local.chart_order || CHART_REGISTRY.map(c => c.key);
  const orderedRegistry = order.map(k => CHART_REGISTRY.find(c => c.key === k)).filter(Boolean);
  const CATS = ["overview", "strength", "nutrition", "recovery"];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 150,
      background: "#050810", overflowY: "auto",
      display: "flex", flexDirection: "column",
    }}>
      {/* Sticky header */}
      <div style={{
        padding: "16px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#050810", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 19, color: "white", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Customize Progress
          </div>
          <div style={{ fontSize: 11, color: "rgba(245,245,240,0.38)", marginTop: 1 }}>
            Changes save instantly
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(245,245,240,0.38)", cursor: "pointer", fontSize: 26, padding: 4, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 48 }}>

        {/* ── Time Range ── */}
        <Sect title="Global Time Range" sub="Applies to all charts that support it">
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { id: "1week",   label: "1 Week"    },
              { id: "1month",  label: "1 Month"   },
              { id: "3months", label: "3 Months"  },
              { id: "all",     label: "All Time"  },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => update({ time_range: id })} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, cursor: "pointer",
                background: local.time_range === id ? "#e8341c" : "rgba(255,255,255,0.06)",
                border: local.time_range === id ? "none" : "1px solid rgba(255,255,255,0.10)",
                color: local.time_range === id ? "white" : "rgba(245,245,240,0.50)",
                fontSize: 11, fontWeight: 700,
              }}>{label}</button>
            ))}
          </div>
        </Sect>

        {/* ── Skill Level ── */}
        <Sect title="Skill Level" sub="Sets default chart set and language style">
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "beginner", title: "BEGINNER", desc: "Essential charts & simple language", count: BEGINNER_CHARTS.length },
              { id: "athlete",  title: "ATHLETE",  desc: "Plain English + key numbers",        count: CHART_REGISTRY.length   },
              { id: "analyst",  title: "ANALYST",  desc: "Full data & technical labels",       count: CHART_REGISTRY.length   },
            ].map(({ id, title, desc, count }) => {
              const active = local.skill_level === id;
              return (
                <button key={id} onClick={() => setSkillLevel(id)} style={{
                  flex: 1, padding: "12px 8px 10px", borderRadius: 12,
                  cursor: "pointer", textAlign: "left",
                  background: active ? "rgba(232,52,28,0.14)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${active ? "rgba(232,52,28,0.55)" : "rgba(255,255,255,0.09)"}`,
                  color: active ? "white" : "rgba(245,245,240,0.45)",
                }}>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: "0.06em", marginBottom: 5 }}>{title}</div>
                  <div style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 7, opacity: 0.8 }}>{desc}</div>
                  <div style={{ fontSize: 10, opacity: 0.5, fontFamily: "'Barlow Condensed',sans-serif" }}>{count} charts</div>
                  {active && <div style={{ fontSize: 9, color: "#e8341c", fontWeight: 700, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active</div>}
                </button>
              );
            })}
          </div>

          {/* Analyst extras */}
          {local.skill_level === "analyst" && (
            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(245,245,240,0.35)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Technical Labels</div>
              {[
                { key: "show_ctl_atl",      label: "Show CTL / ATL / TSB values"           },
                { key: "show_formulas",     label: "Show ratio formulas"                    },
                { key: "show_confidence",   label: "Show confidence intervals (r²)"         },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 12, color: "rgba(245,245,240,0.68)" }}>{label}</span>
                  <Tog on={local.analyst_options?.[key] || false}
                    onToggle={() => update({ analyst_options: { ...local.analyst_options, [key]: !local.analyst_options?.[key] } })} />
                </div>
              ))}
            </div>
          )}
        </Sect>

        {/* ── Display Mode ── */}
        <Sect title="Display Mode">
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "compact",  label: "Compact",  desc: "More charts visible at once"   },
              { id: "detailed", label: "Detailed", desc: "Larger charts, more data shown" },
            ].map(({ id, label, desc }) => {
              const active = local.display_mode === id;
              return (
                <button key={id} onClick={() => update({ display_mode: id })} style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                  background: active ? "rgba(232,52,28,0.10)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${active ? "rgba(232,52,28,0.45)" : "rgba(255,255,255,0.09)"}`,
                  color: active ? "white" : "rgba(245,245,240,0.45)",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.4 }}>{desc}</div>
                </button>
              );
            })}
          </div>
        </Sect>

        {/* ── Chart Toggles ── */}
        <Sect title="Charts" sub="Toggle on/off · Use arrows to reorder">
          {CATS.map(cat => {
            const charts = orderedRegistry.filter(c => c.category === cat);
            if (!charts.length) return null;
            return (
              <div key={cat} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(245,245,240,0.32)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 2 }}>
                  {cat}
                </div>
                {charts.map((c, ci) => {
                  const globalIdx = order.indexOf(c.key);
                  const isOn = local.visible_charts?.[c.key] !== false;
                  return (
                    <div key={c.key} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "9px 0",
                      borderTop: ci === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {/* Up/Down arrows */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
                        <button onClick={() => moveChart(c.key, -1)} disabled={globalIdx === 0}
                          style={{ background: "none", border: "none", cursor: globalIdx === 0 ? "default" : "pointer", color: globalIdx === 0 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.28)", fontSize: 11, padding: "1px 4px", lineHeight: 1.2 }}>↑</button>
                        <button onClick={() => moveChart(c.key, 1)} disabled={globalIdx === order.length - 1}
                          style={{ background: "none", border: "none", cursor: globalIdx === order.length - 1 ? "default" : "pointer", color: globalIdx === order.length - 1 ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.28)", fontSize: 11, padding: "1px 4px", lineHeight: 1.2 }}>↓</button>
                      </div>

                      {/* Label */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: isOn ? "rgba(245,245,240,0.85)" : "rgba(245,245,240,0.28)", lineHeight: 1.2 }}>
                          {c.label}
                        </div>
                        {c.beginner && (
                          <div style={{ fontSize: 9, color: "#4ECDC4", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2, opacity: 0.7 }}>
                            beginner
                          </div>
                        )}
                      </div>

                      {/* Toggle */}
                      <Tog on={isOn} onToggle={() => toggleChart(c.key)} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </Sect>

        {/* Reset */}
        <div style={{ padding: "4px 20px 0" }}>
          <button onClick={reset} style={{
            width: "100%", padding: 13,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 12,
            color: "rgba(245,245,240,0.40)",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>
            Reset to Defaults
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Sect({ title, sub, children }) {
  return (
    <div style={{ padding: "20px 20px 0" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, color: "rgba(245,245,240,0.50)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: sub ? 2 : 10 }}>
        {title}
      </div>
      {sub && <div style={{ fontSize: 10, color: "rgba(245,245,240,0.28)", marginBottom: 10 }}>{sub}</div>}
      {children}
    </div>
  );
}

function Tog({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      width: 40, height: 22, borderRadius: 11,
      background: on ? "#e8341c" : "rgba(255,255,255,0.10)",
      cursor: "pointer", position: "relative",
      transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", top: 2,
        left: on ? 20 : 2, width: 18, height: 18,
        borderRadius: 9, background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.30)",
      }} />
    </div>
  );
}
