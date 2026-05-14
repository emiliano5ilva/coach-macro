// NOTE: VOLUME_COLORS defined below are exclusive to this chart.
// They are intentionally distinct from the app's primary palette:
//   Blue #2979FF = Protein  |  Green #22c55e = Carbs
//   Yellow #f59e0b = Fat     |  Red #e8341c = Brand accent
//   Purple = Recovery features
// Never reuse VOLUME_COLORS elsewhere.

import { useState, useEffect } from "react";
import { T } from "./components.jsx";
import { sb } from "./client.js";
import { EXERCISE_MUSCLE_GROUP } from "./exercise_database.js";

// ── Chart-only color palette — do NOT use in other components ────────────────
const VOLUME_COLORS = {
  under: {
    zone:   "rgba(96,125,139,0.14)",
    border: "rgba(96,125,139,0.5)",
    bar:    "#607D8B",
    label:  "#90A4AE",
    bg:     "rgba(96,125,139,0.12)",
    name:   "Train more",
  },
  optimal: {
    zone:   "rgba(78,205,196,0.12)",
    border: "rgba(78,205,196,0.5)",
    bar:    "#4ECDC4",
    label:  "#4ECDC4",
    bg:     "rgba(78,205,196,0.12)",
    name:   "Just right ✓",
  },
  warn: {
    zone:   "rgba(255,159,67,0.10)",
    border: "rgba(255,159,67,0.5)",
    bar:    "#FF9F43",
    label:  "#FF9F43",
    bg:     "rgba(255,159,67,0.12)",
    name:   "Near limit",
  },
  over: {
    zone:   "rgba(255,82,82,0.10)",
    border: "rgba(255,82,82,0.5)",
    bar:    "#FF5252",
    label:  "#FF5252",
    bg:     "rgba(255,82,82,0.12)",
    name:   "Ease up",
  },
};

// ── Muscle definitions with MEV / MAV / MRV (weekly sets) ────────────────────
const MUSCLES = [
  { key:"chest",      label:"Chest",      mev:8,  mav:16, mrv:22,
    desc:"Chest responds well to multiple angles. MEV assumes 2+ sessions/week.",
    tip:"Mix horizontal presses with incline and cable work for full development." },
  { key:"back",       label:"Back",       mev:10, mav:18, mrv:25,
    desc:"Back has high recovery capacity and responds well to accumulating volume.",
    tip:"Prioritize heavy rows and vertical pulls. Aim for a 2:1 pull:push ratio." },
  { key:"shoulders",  label:"Shoulders",  mev:6,  mav:14, mrv:20,
    desc:"Lateral head needs direct work — compound pressing doesn't fully cover it.",
    tip:"Include lateral raises 2–3×/week. Rear delts support long-term shoulder health." },
  { key:"biceps",     label:"Biceps",     mev:8,  mav:14, mrv:20,
    desc:"Biceps recover fast and can handle 3 sessions/week.",
    tip:"Supinating curls are the gold standard. Vary angles for full-length stimulus." },
  { key:"triceps",    label:"Triceps",    mev:6,  mav:14, mrv:18,
    desc:"Triceps make up 2/3 of your arm. Overhead extension creates a peak stretch.",
    tip:"Don't rely on pushdowns only — overhead extensions hit the long head uniquely." },
  { key:"quads",      label:"Quads",      mev:8,  mav:16, mrv:22,
    desc:"Quads respond well to deep range of motion and mechanical tension.",
    tip:"Deep squats and leg press hit all 4 quad heads. Knee-over-toe depth matters." },
  { key:"hamstrings", label:"Hamstrings", mev:6,  mav:14, mrv:20,
    desc:"Hamstrings need both hip-hinge and leg-curl patterns for full development.",
    tip:"RDLs train the long head; leg curls train the short head. Include both." },
  { key:"glutes",     label:"Glutes",     mev:8,  mav:16, mrv:22,
    desc:"Glutes are in peak contraction during hip thrusts — unlike squats.",
    tip:"Hip thrusts and kickbacks are uniquely effective for glute isolation." },
  { key:"calves",     label:"Calves",     mev:8,  mav:12, mrv:16,
    desc:"Calves respond well to high frequency and full range of motion.",
    tip:"Always go to full stretch at the bottom. Partial reps severely limit progress." },
  { key:"core",       label:"Core",       mev:6,  mav:12, mrv:16,
    desc:"Anti-movement core work builds functional stability for every lift.",
    tip:"Pallof Press and Dead Bug build real strength. Crunches alone aren't enough." },
];

function getZone(sets, mev, mav, mrv) {
  if (sets < mev)  return "under";
  if (sets <= mav) return "optimal";
  if (sets <= mrv) return "warn";
  return "over";
}

// Split "legs" into quads / hamstrings via exercise name keywords
function getExerciseMuscles(name) {
  const base = EXERCISE_MUSCLE_GROUP[name];
  if (!base) return [];
  if (base === "legs") {
    const n = (name || "").toLowerCase();
    const isHams = n.includes("romanian") || n.includes("rdl") || n.includes("curl") ||
      n.includes("nordic") || n.includes("stiff") || n.includes("good morning");
    return isHams ? ["hamstrings"] : ["quads"];
  }
  return [base];
}

async function getVolumePerMuscle(userId, days) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];
  const { data: logs } = await sb
    .from("workout_logs")
    .select("workout, date")
    .eq("user_id", userId)
    .gte("date", startDate);

  const volumeMap = {};
  logs?.forEach(session => {
    session.workout?.exercises?.forEach(ex => {
      const muscles = getExerciseMuscles(ex.name);
      const doneSets = ex.completedSets ??
        (Array.isArray(ex.sets) ? ex.sets.filter(s => s.done).length : 0);
      muscles.forEach(m => { volumeMap[m] = (volumeMap[m] || 0) + doneSets; });
    });
  });
  return volumeMap;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, padding:"4px 0" }}>
      {MUSCLES.slice(0, 6).map(m => (
        <div key={m.key} style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="skeleton" style={{ width:72, height:10, borderRadius:4, flexShrink:0 }}/>
          <div className="skeleton" style={{ flex:1, height:10, borderRadius:5 }}/>
          <div className="skeleton" style={{ width:56, height:10, borderRadius:4, flexShrink:0 }}/>
        </div>
      ))}
    </div>
  );
}

// ── Expanded detail card ──────────────────────────────────────────────────────
function DetailCard({ muscle, sets, mev, mav, mrv, zoneKey }) {
  const vc = VOLUME_COLORS[zoneKey];
  const plain = {
    under:   `You're below the Minimum Effective Volume for ${muscle.label}. Adding more sets each week will stimulate consistent growth without overloading recovery.`,
    optimal: `${muscle.label} is in the optimal training zone — maximum growth stimulus with manageable recovery. Keep this volume steady or progress slowly.`,
    warn:    `${muscle.label} is approaching its Maximum Recoverable Volume. Consider replacing one working set with a lighter technique set next week.`,
    over:    `${muscle.label} volume exceeds MRV. You're accumulating more fatigue than you can recover from — drop a set or two to stay injury-free and actually grow.`,
  };
  return (
    <div style={{
      background: vc.bg, border:`1px solid ${vc.border}`, borderRadius:12,
      padding:"12px 14px", marginTop:6, marginBottom:4,
      animation:"page-fade 0.2s ease forwards",
    }}>
      <div style={{ fontSize:12, color:"rgba(245,245,240,0.8)", lineHeight:1.65, marginBottom:10 }}>
        {plain[zoneKey]}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
        {[
          { label:"Minimum",    val:mev,  color:VOLUME_COLORS.under.label   },
          { label:"Sweet Spot", val:mav,  color:VOLUME_COLORS.optimal.label },
          { label:"Maximum",    val:mrv,  color:VOLUME_COLORS.warn.label    },
          { label:"Your Sets",  val:sets, color:vc.label                    },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"8px 6px", textAlign:"center",
          }}>
            <div style={{ fontFamily:"var(--condensed)", fontSize:20, fontWeight:900, color, lineHeight:1 }}>{val}</div>
            <div style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu, textTransform:"uppercase", letterSpacing:"0.1em", marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize:11, color:T.mu, lineHeight:1.6, borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:8 }}>
        <span style={{ color:vc.label, fontWeight:700 }}>Tip: </span>{muscle.tip}
      </div>
    </div>
  );
}

// ── Single muscle bar row ─────────────────────────────────────────────────────
function MuscleRow({ muscle, sets, showDetails, showLabels, expanded, onToggle, multiplier }) {
  const mev = muscle.mev * multiplier;
  const mav = muscle.mav * multiplier;
  const mrv = muscle.mrv * multiplier;
  const zoneKey = getZone(sets, mev, mav, mrv);
  const vc = VOLUME_COLORS[zoneKey];
  const MAX = Math.ceil(mrv * 1.5);

  const pSlate  = (mev / MAX) * 100;
  const pTeal   = ((mav - mev) / MAX) * 100;
  const pOrange = ((mrv - mav) / MAX) * 100;
  const pCoral  = Math.max(0, ((MAX - mrv) / MAX) * 100);
  const barPct  = Math.min(100, (sets / MAX) * 100);

  return (
    <div>
      <div
        onClick={showDetails ? onToggle : undefined}
        style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"9px 0",
          cursor: showDetails ? "pointer" : "default",
          borderBottom: `1px solid ${T.bd}`,
        }}
      >
        {/* Muscle label */}
        <div style={{
          fontFamily:"var(--mono)", fontSize:10, color:T.mu, textTransform:"uppercase",
          letterSpacing:"0.08em", width:76, flexShrink:0,
        }}>
          {muscle.label}
        </div>

        {/* Bar track with zone overlays */}
        <div style={{ flex:1, position:"relative", height:12 }}>
          {/* Zone background segments */}
          <div style={{ position:"absolute", inset:0, display:"flex", borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${pSlate}%`,  background:VOLUME_COLORS.under.zone   }}/>
            <div style={{ width:`${pTeal}%`,   background:VOLUME_COLORS.optimal.zone }}/>
            <div style={{ width:`${pOrange}%`, background:VOLUME_COLORS.warn.zone    }}/>
            <div style={{ width:`${pCoral}%`,  background:VOLUME_COLORS.over.zone    }}/>
          </div>

          {/* Zone boundary markers (details mode only) */}
          {showLabels && [
            { v:mev, l:"MIN" },
            { v:mav, l:"SWEET SPOT" },
            { v:mrv, l:"MAX" },
          ].map(({ v, l }) => {
            const pct = (v / MAX) * 100;
            return (
              <div key={l} style={{
                position:"absolute", top:0, bottom:0, left:`${pct}%`,
                width:1, background:"rgba(245,245,240,0.15)", zIndex:2,
              }}>
                <div style={{
                  position:"absolute", top:-13, left:2,
                  fontFamily:"var(--mono)", fontSize:7, color:"rgba(245,245,240,0.3)",
                  letterSpacing:"0.08em", whiteSpace:"nowrap", textTransform:"uppercase",
                }}>
                  {l}
                </div>
              </div>
            );
          })}

          {/* Actual volume bar */}
          {sets > 0 && (
            <div style={{
              position:"absolute", top:"18%", bottom:"18%", left:0,
              width:`${barPct}%`, minWidth:3,
              background: vc.bar,
              borderRadius:4, zIndex:3,
              boxShadow:`0 0 5px ${vc.bar}60`,
              transition:"width 0.55s cubic-bezier(.4,0,.2,1)",
            }}/>
          )}
        </div>

        {/* Status / set count */}
        <div style={{ width:72, flexShrink:0, textAlign:"right" }}>
          {showDetails ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", gap:5 }}>
              <span style={{ fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:vc.label }}>{sets}</span>
              <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>sets</span>
              <span style={{ color:T.mu, fontSize:11 }}>{expanded ? "▴" : "▾"}</span>
            </div>
          ) : (
            <span style={{
              fontFamily:"var(--mono)", fontSize:9, color:vc.label,
              letterSpacing:"0.06em", textTransform:"uppercase",
            }}>
              {vc.name}
            </span>
          )}
        </div>
      </div>

      {/* Expanded detail card */}
      {showDetails && expanded && (
        <DetailCard muscle={muscle} sets={sets} mev={mev} mav={mav} mrv={mrv} zoneKey={zoneKey}/>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MuscleVolumeChart({ userId }) {
  const [period, setPeriod] = useState("week");
  const [showDetails, setShowDetails] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [volume, setVolume] = useState(null);
  const [loading, setLoading] = useState(true);

  const multiplier = period === "week" ? 1 : 4;
  const days = period === "week" ? 7 : 30;

  useEffect(() => {
    if (!userId) { setLoading(false); setVolume({}); return; }
    setLoading(true);
    getVolumePerMuscle(userId, days)
      .then(v => { setVolume(v); setLoading(false); })
      .catch(() => { setVolume({}); setLoading(false); });
  }, [userId, days]);

  const hasAnyVolume = !!volume && MUSCLES.some(m => (volume[m.key] || 0) > 0);

  // Zone counts for summary pills
  const zoneCounts = { under:0, optimal:0, warn:0, over:0 };
  if (volume) {
    MUSCLES.forEach(m => {
      const sets = volume[m.key] || 0;
      zoneCounts[getZone(sets, m.mev * multiplier, m.mav * multiplier, m.mrv * multiplier)]++;
    });
  }

  // Insight banner
  const needMore = volume
    ? MUSCLES.filter(m => getZone(volume[m.key] || 0, m.mev * multiplier, m.mav * multiplier, m.mrv * multiplier) === "under")
    : [];
  const allGood = hasAnyVolume && needMore.length === 0 && zoneCounts.over === 0;

  const toggleDetails = () => {
    const next = !showDetails;
    setShowDetails(next);
    setExpanded(null);
  };

  return (
    <div style={{
      margin:"0 20px 14px",
      background:"var(--navy-card)",
      border:`1px solid ${T.bd}`,
      borderRadius:16,
      overflow:"hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding:"13px 16px", borderBottom:`1px solid ${T.bd}`,
        display:"flex", justifyContent:"space-between", alignItems:"center",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{
            fontFamily:"var(--condensed)", fontWeight:900, fontSize:14,
            letterSpacing:"0.1em", textTransform:"uppercase", color:"#fff",
          }}>
            Muscle Balance
          </div>
          <div style={{
            fontFamily:"var(--mono)", fontSize:8, letterSpacing:"0.14em",
            textTransform:"uppercase", color:"#e8341c",
            background:"rgba(232,52,28,0.12)", border:"1px solid rgba(232,52,28,0.2)",
            borderRadius:4, padding:"2px 6px",
          }}>
            Strength
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {/* Week / Month */}
          <div style={{
            display:"flex", background:"rgba(255,255,255,0.06)",
            border:`1px solid ${T.bd}`, borderRadius:8, padding:2, gap:2,
          }}>
            {["week","month"].map(p => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setExpanded(null); }}
                style={{
                  padding:"4px 10px", borderRadius:6, border:"none", cursor:"pointer",
                  background: period === p ? "#e8341c" : "transparent",
                  color: period === p ? "#fff" : T.mu,
                  fontFamily:"var(--mono)", fontSize:9, letterSpacing:"0.08em",
                  textTransform:"uppercase", fontWeight:700, transition:"all 0.15s",
                }}
              >
                {p === "week" ? "Week" : "Month"}
              </button>
            ))}
          </div>
          {/* Simple / Details */}
          <button
            onClick={toggleDetails}
            style={{
              padding:"4px 10px", borderRadius:6, cursor:"pointer",
              border:`1px solid ${showDetails ? "rgba(245,245,240,0.15)" : T.bd}`,
              background: showDetails ? "rgba(245,245,240,0.08)" : "transparent",
              color: showDetails ? "#fff" : T.mu,
              fontFamily:"var(--mono)", fontSize:9, letterSpacing:"0.08em",
              textTransform:"uppercase", fontWeight:700, transition:"all 0.15s",
            }}
          >
            {showDetails ? "Simple" : "Details"}
          </button>
        </div>
      </div>

      <div style={{ padding:"14px 16px 8px" }}>
        {loading ? (
          <Skeleton/>
        ) : !hasAnyVolume ? (
          /* ── Empty state ── */
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🏋️</div>
            <div style={{
              fontFamily:"var(--condensed)", fontSize:14, fontWeight:700,
              color:"rgba(245,245,240,0.4)", textTransform:"uppercase", letterSpacing:"0.06em",
            }}>
              Log a workout to see your muscle balance
            </div>
          </div>
        ) : (
          <>
            {/* ── Insight banner ── */}
            <div style={{
              marginBottom:12, padding:"8px 12px", borderRadius:10,
              background: allGood
                ? "rgba(0,188,212,0.08)"
                : needMore.length > 0
                  ? "rgba(84,110,122,0.1)"
                  : "rgba(255,87,34,0.08)",
              border:`1px solid ${allGood
                ? "rgba(0,188,212,0.2)"
                : needMore.length > 0
                  ? "rgba(84,110,122,0.25)"
                  : "rgba(255,87,34,0.2)"}`,
              fontFamily:"var(--mono)", fontSize:11, color:"rgba(245,245,240,0.75)", lineHeight:1.5,
            }}>
              {allGood
                ? <span style={{ color:"#00BCD4" }}>All muscle groups in optimal zone 🔥</span>
                : needMore.length > 0
                  ? `${needMore.length} muscle${needMore.length > 1 ? "s" : ""} need more work (${needMore.slice(0,3).map(m=>m.label).join(", ")})`
                  : `${zoneCounts.over} muscle${zoneCounts.over !== 1 ? "s" : ""} exceeding MRV — consider reducing volume`}
            </div>

            {/* ── Summary pills ── */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
              {[
                { key:"optimal", count:zoneCounts.optimal, vc:VOLUME_COLORS.optimal },
                { key:"under",   count:zoneCounts.under,   vc:VOLUME_COLORS.under   },
                { key:"warn",    count:zoneCounts.warn,    vc:VOLUME_COLORS.warn    },
                { key:"over",    count:zoneCounts.over,    vc:VOLUME_COLORS.over    },
              ].map(({ key, count, vc }) => (
                <div key={key} style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"3px 9px", borderRadius:20,
                  background: vc.bg, border:`1px solid ${vc.border.replace("0.5","0.3")}`,
                }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:vc.bar, flexShrink:0 }}/>
                  <span style={{ fontFamily:"var(--mono)", fontSize:9, color:vc.label, fontWeight:700 }}>
                    {count} {vc.name}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Bar chart rows ── */}
            <div style={{ paddingTop: showDetails ? 18 : 0 }}>
              {MUSCLES.map(m => (
                <MuscleRow
                  key={m.key}
                  muscle={m}
                  sets={volume[m.key] || 0}
                  showDetails={showDetails}
                  showLabels={showDetails}
                  expanded={expanded === m.key}
                  onToggle={() => setExpanded(expanded === m.key ? null : m.key)}
                  multiplier={multiplier}
                />
              ))}
            </div>

            {/* ── Legend ── */}
            <div style={{
              marginTop:12, paddingTop:12, borderTop:`1px solid ${T.bd}`,
              display:"flex", flexWrap:"wrap", gap:"6px 16px",
            }}>
              {showDetails
                ? [
                    { color:VOLUME_COLORS.under.bar,   label:"Below MEV — add more sets" },
                    { color:VOLUME_COLORS.optimal.bar, label:"MEV–MAV — optimal growth zone" },
                    { color:VOLUME_COLORS.warn.bar,    label:"MAV–MRV — near the limit" },
                    { color:VOLUME_COLORS.over.bar,    label:"Above MRV — reduce volume" },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
                      <span style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu }}>{label}</span>
                    </div>
                  ))
                : [
                    { color:VOLUME_COLORS.under.bar,   label:"Train more"  },
                    { color:VOLUME_COLORS.optimal.bar, label:"Just right"  },
                    { color:VOLUME_COLORS.warn.bar,    label:"Near limit"  },
                    { color:VOLUME_COLORS.over.bar,    label:"Ease up"     },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
                      <span style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu }}>{label}</span>
                    </div>
                  ))
              }
            </div>
          </>
        )}
      </div>

      <div style={{ height:6 }}/>
    </div>
  );
}
