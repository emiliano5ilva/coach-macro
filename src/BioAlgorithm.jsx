import React, { useState, useEffect } from "react";
import { T, Spinner } from "./components.jsx";
import { getInsights, getDataPointCounts, MIN_POINTS } from "./services/biologicalAlgorithm.js";

const METRICS = [
  { key: "sleep_performance",  emoji: "💤", label: "Sleep Profile",     need: MIN_POINTS.sleep_performance  },
  { key: "recovery_speed",     emoji: "⚡", label: "Recovery Speed",    need: MIN_POINTS.recovery_speed     },
  { key: "carb_performance",   emoji: "🍚", label: "Carb Sensitivity",  need: MIN_POINTS.carb_performance   },
  { key: "time_performance",   emoji: "🕐", label: "Peak Window",       need: MIN_POINTS.time_performance   },
  { key: "stress_performance", emoji: "😤", label: "Stress Threshold",  need: MIN_POINTS.stress_performance },
];

function ConfidenceBar({ value, color = "#2979FF" }) {
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );
}

function ProgressDots({ count, need }) {
  const pct = Math.min(1, count / need);
  const filled = Math.round(pct * 10);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 14, height: 5, borderRadius: 2, background: i < filled ? "#2979FF" : "rgba(255,255,255,.08)" }} />
      ))}
    </div>
  );
}

// ─── INSIGHT CARDS ────────────────────────────────────────────────────────────

function SleepCard({ data }) {
  const v = data.insight_value;
  return (
    <InsightCard emoji="💤" title="YOUR SLEEP SWEET SPOT" confidence={data.confidence} dataPoints={data.data_points_used} accent="#7B68EE">
      <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif", color: "#fff", marginBottom: 6 }}>{v.sweetSpot}</div>
      <div style={{ fontSize: 13, color: "rgba(245,245,240,.8)", lineHeight: 1.6, marginBottom: 12 }}>
        You perform <strong style={{ color: "#22c55e" }}>{v.performanceImprovement}% better</strong> after {v.sweetSpot} vs {v.worstBucket}. YOUR specific number — not a generic recommendation.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
        {Object.entries(v.bucketAverages || {}).map(([b, avg]) => {
          const labels = { under_6: "<6h", "6_to_7": "6–7h", "7_to_8": "7–8h", over_8: "8h+" };
          const isBest = b === v.sweetSpotKey;
          return (
            <div key={b} style={{ background: isBest ? "rgba(52,211,153,.1)" : "rgba(255,255,255,.04)", border: `1px solid ${isBest ? "rgba(52,211,153,.3)" : "rgba(255,255,255,.07)"}`, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: isBest ? "#34D399" : T.mu, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 3 }}>{labels[b] || b}{isBest ? " ★" : ""}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: isBest ? "#34D399" : "#fff" }}>{avg}%</div>
            </div>
          );
        })}
      </div>
    </InsightCard>
  );
}

function RecoveryCard({ data }) {
  const v = data.insight_value;
  const muscles = Object.entries(v.byMuscle || {}).sort((a, b) => a[1] - b[1]);
  const EMOJI = { chest: "💪", back: "🏋️", shoulders: "🔺", legs: "🦵", glutes: "🍑", biceps: "💪", triceps: "💪", core: "🎯", calves: "🦵" };
  return (
    <InsightCard emoji="⚡" title="YOUR RECOVERY SPEED" confidence={data.confidence} dataPoints={data.data_points_used} accent="#22c55e">
      <div style={{ fontSize: 12, color: "rgba(245,245,240,.7)", lineHeight: 1.6, marginBottom: 12 }}>
        Your personal optimal rest time per muscle group — calculated from YOUR training history.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {muscles.map(([mg, days]) => (
          <div key={mg} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(255,255,255,.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{EMOJI[mg] || "💪"} {mg.charAt(0).toUpperCase() + mg.slice(1)}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#22c55e" }}>{days}d</div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function CarbCard({ data }) {
  const v = data.insight_value;
  const COLOR = { HIGH: "#F97316", LOW: "#06B6D4", NEUTRAL: "#EAB308" };
  const COPY = {
    HIGH: { title: "HIGH CARB SENSITIVITY", body: `Your best sessions follow days with ${v.bestLabel}. Your performance dips significantly on low-carb days.` },
    LOW:  { title: "LOW CARB RELIANCE",     body: `You actually perform best on ${v.bestLabel}. You likely run efficiently on fat and protein.` },
    NEUTRAL:{ title: "CARB NEUTRAL",        body: `Your performance is consistent regardless of carb intake. You have flexible fuel metabolism.` },
  };
  const c = COPY[v.sensitivity] || COPY.NEUTRAL;
  const accent = COLOR[v.sensitivity] || "#EAB308";
  return (
    <InsightCard emoji="🍚" title="YOUR CARB RESPONSE" confidence={data.confidence} dataPoints={data.data_points_used} accent={accent}>
      <div style={{ background: `${accent}12`, border: `1px solid ${accent}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: accent, letterSpacing: ".06em" }}>{c.title}</div>
      </div>
      <div style={{ fontSize: 13, color: "rgba(245,245,240,.8)", lineHeight: 1.6, marginBottom: 12 }}>{c.body}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {[
          { label: "<100g", val: v.averages?.low },
          { label: "100–200g", val: v.averages?.mid },
          { label: "200g+", val: v.averages?.high },
        ].map(({ label, val }) => val != null && (
          <div key={label} style={{ background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "8px 6px", textAlign: "center", border: "1px solid rgba(255,255,255,.07)" }}>
            <div style={{ fontSize: 9, color: T.mu, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{val}%</div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function WindowCard({ data }) {
  const v = data.insight_value;
  return (
    <InsightCard emoji="🕐" title="YOUR PEAK PERFORMANCE WINDOW" confidence={data.confidence} dataPoints={data.data_points_used} accent="#FBbF24">
      <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Barlow Condensed',sans-serif", color: "#FBbF24", marginBottom: 8 }}>{v.bestWindow}</div>
      <div style={{ fontSize: 13, color: "rgba(245,245,240,.8)", lineHeight: 1.6, marginBottom: 12 }}>
        {v.performanceDiff > 0 && (
          <><strong style={{ color: "#FBbF24" }}>{v.performanceDiff}% higher performance</strong> in YOUR optimal window vs your worst time.</>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(v.windowAverages || []).map(w => (
          <div key={w.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 10, color: T.mu, width: 110, flexShrink: 0 }}>{w.label}</div>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(5, w.avg)}%`, background: w.label === v.bestWindow ? "#FBbF24" : "rgba(251,191,36,.3)", borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: "#fff", fontWeight: 700, width: 32, textAlign: "right" }}>{w.avg}%</div>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function StressCard({ data }) {
  const v = data.insight_value;
  const drop = v.performanceDrop;
  return (
    <InsightCard emoji="😤" title="YOUR STRESS THRESHOLD" confidence={data.confidence} dataPoints={data.data_points_used} accent="#EF4444">
      <div style={{ fontSize: 13, color: "rgba(245,245,240,.8)", lineHeight: 1.6, marginBottom: 12 }}>
        Performance drops noticeably when stress reaches <strong style={{ color: "#EF4444" }}>{v.threshold}/5</strong>.
        {drop != null && drop > 5 && <> You lose ~<strong style={{ color: "#EF4444" }}>{drop}%</strong> on high-stress days.</>}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map(l => {
          const avg = v.avgPerLevel?.[l];
          const isThreshold = l >= v.threshold;
          return (
            <div key={l} style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: isThreshold ? "rgba(239,68,68,.08)" : "rgba(52,211,153,.06)", border: `1px solid ${isThreshold ? "rgba(239,68,68,.25)" : "rgba(52,211,153,.2)"}`, borderRadius: 8 }}>
              <div style={{ fontSize: 9, color: T.mu, marginBottom: 3 }}>S{l}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isThreshold ? "#EF4444" : "#34D399" }}>{avg ?? "—"}{avg ? "%" : ""}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: T.mu, background: "rgba(239,68,68,.05)", borderRadius: 8, padding: "8px 10px", border: "1px solid rgba(239,68,68,.1)" }}>
        💡 Schedule deload or active recovery after 2+ consecutive high-stress days.
      </div>
    </InsightCard>
  );
}

function InsightCard({ emoji, title, confidence, dataPoints, accent, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,.03)", border: `1.5px solid ${accent}20`, borderRadius: 16, padding: "18px 16px", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>{emoji}</span>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: accent, fontFamily: "'Barlow Condensed',sans-serif" }}>{title}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 10, color: T.mu, marginBottom: 4 }}>Confidence</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: accent }}>{Math.round(confidence)}%</div>
        </div>
      </div>
      {children}
      <div style={{ marginTop: 12 }}>
        <ConfidenceBar value={confidence} color={accent} />
        <div style={{ fontSize: 9, color: T.dim, marginTop: 4 }}>Based on {dataPoints} data point{dataPoints !== 1 ? "s" : ""}</div>
      </div>
    </div>
  );
}

function LockedCard({ metric, count }) {
  const pct = Math.min(100, Math.round((count / metric.need) * 100));
  const remaining = Math.max(0, metric.need - count);
  const daysAway = Math.ceil(remaining / 1.2); // ~1.2 workouts/day estimate
  return (
    <div style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "16px", marginBottom: 10, opacity: 0.7 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>{metric.emoji}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(245,245,240,.7)" }}>{metric.label}</div>
            <div style={{ fontSize: 10, color: T.mu }}>{count} / {metric.need} data points</div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.dim, textAlign: "right" }}>
          {daysAway > 0 ? `~${daysAway}d away` : "Calculating..."}
        </div>
      </div>
      <ProgressDots count={count} need={metric.need} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <div style={{ fontSize: 10, color: T.dim }}>{pct}% complete</div>
      </div>
    </div>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function BioAlgorithmScreen({ user, profile, onClose }) {
  const [insights, setInsights]   = useState({});
  const [counts, setCounts]       = useState({});
  const [loading, setLoading]     = useState(true);

  const firstName = profile?.name?.split(" ")[0] || "Your";
  const totalWorkouts = Object.values(counts).length > 0
    ? Math.max(...Object.values(counts), 0)
    : 0;

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    Promise.all([
      getInsights(user.id),
      getDataPointCounts(user.id),
    ]).then(([ins, cnts]) => {
      setInsights(ins);
      setCounts(cnts);
    }).catch(console.warn).finally(() => setLoading(false));
  }, [user?.id]);

  const unlockedCount = METRICS.filter(m => insights[m.key]).length;
  const hasAnyInsight = unlockedCount > 0;

  // Days since account start
  const daysSinceStart = profile?.startDate
    ? Math.max(0, Math.floor((Date.now() - new Date(profile.startDate).getTime()) / 86400000))
    : 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#060D1A", zIndex: 500, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.07)", position: "sticky", top: 0, background: "#060D1A", zIndex: 2, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.mu, cursor: "pointer", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>← Back</button>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 18, fontWeight: 900, letterSpacing: ".04em" }}>BIOLOGICAL ALGORITHM</div>
        <div style={{ width: 60 }} />
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner size={28} /></div>
      ) : (
        <div style={{ padding: "20px 20px 60px", maxWidth: 520, margin: "0 auto", width: "100%" }}>

          {/* Hero header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🧬</div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 4 }}>
              {firstName}'s Biological Algorithm
            </div>
            {hasAnyInsight ? (
              <div style={{ fontSize: 12, color: T.mu }}>
                Built from {unlockedCount} insight{unlockedCount !== 1 ? "s" : ""} · {daysSinceStart} days of data
              </div>
            ) : (
              <div style={{ fontSize: 12, color: T.mu }}>
                Day {daysSinceStart} — Keep training and logging to unlock your profile
              </div>
            )}
            {hasAnyInsight && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
                <div style={{ background: "rgba(52,211,153,.1)", border: "1px solid rgba(52,211,153,.3)", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#34D399", fontWeight: 700 }}>
                  {unlockedCount}/{METRICS.length} Insights Unlocked
                </div>
                <div style={{ background: "rgba(41,121,255,.08)", border: "1px solid rgba(41,121,255,.2)", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "#2979FF", fontWeight: 700 }}>
                  {daysSinceStart} Days Active
                </div>
              </div>
            )}
          </div>

          {/* Teaser / Progress section — always show for locked metrics */}
          {METRICS.some(m => !insights[m.key]) && (
            <div style={{ background: "rgba(41,121,255,.05)", border: "1px solid rgba(41,121,255,.15)", borderRadius: 16, padding: "18px 16px", marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2979FF", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
                <span>🔓</span> Unlocking Your Profile
              </div>
              {METRICS.filter(m => !insights[m.key]).map(m => (
                <LockedCard key={m.key} metric={m} count={counts[m.key] || 0} />
              ))}
              <div style={{ fontSize: 11, color: T.mu, marginTop: 8, lineHeight: 1.6 }}>
                Each insight unlocks independently as soon as enough data exists. Keep training and logging meals daily.
              </div>
            </div>
          )}

          {/* Unlocked insight cards */}
          {insights.sleep_performance  && <SleepCard    data={insights.sleep_performance} />}
          {insights.recovery_speed     && <RecoveryCard data={insights.recovery_speed} />}
          {insights.carb_performance   && <CarbCard     data={insights.carb_performance} />}
          {insights.time_performance   && <WindowCard   data={insights.time_performance} />}
          {insights.stress_performance && <StressCard   data={insights.stress_performance} />}

          {/* How the algorithm is applied */}
          <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "20px 16px", marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: T.dim, fontFamily: "'Barlow Condensed',sans-serif", marginBottom: 14 }}>
              HOW WE USE YOUR ALGORITHM
            </div>
            <div style={{ fontSize: 13, color: "rgba(245,245,240,.7)", lineHeight: 1.8 }}>
              Every session recommendation, every macro target, every rest day suggestion is filtered through your personal biological profile.
            </div>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { day: "Day 30", label: "Basic patterns learned",        done: daysSinceStart >= 30 },
                { day: "Day 90", label: "Full algorithm active",         done: daysSinceStart >= 90 },
                { day: "Day 180", label: "Predictive accuracy: Elite",   done: daysSinceStart >= 180 },
              ].map(({ day, label, done }) => (
                <div key={day} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: done ? "rgba(52,211,153,.15)" : "rgba(255,255,255,.05)", border: `1.5px solid ${done ? "#34D399" : "rgba(255,255,255,.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {done ? <span style={{ fontSize: 10, color: "#34D399" }}>✓</span> : null}
                  </div>
                  <div style={{ fontSize: 13, color: done ? "#fff" : "rgba(245,245,240,.4)" }}>
                    <strong style={{ color: done ? "#34D399" : "rgba(245,245,240,.4)" }}>{day}</strong> — {label}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: "12px", background: "rgba(41,121,255,.06)", borderRadius: 10, border: "1px solid rgba(41,121,255,.15)", fontSize: 12, color: "#7CB3FF", lineHeight: 1.6 }}>
              The longer you use Coach Macro, the smarter it gets about YOU specifically.
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
