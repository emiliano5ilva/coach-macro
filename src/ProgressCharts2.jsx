// Chart colors — chart-exclusive palette (CHART_COLORS from theme.js).
// Never conflict with macro colors (blue/green/amber) or brand red.
import React, { useState, useMemo } from "react";
import { T } from "./components.jsx";

const CC = {
  optimal:    "#4ECDC4",
  caution:    "#FF9F43",
  danger:     "#FF5252",
  neutral:    "#607D8B",
  optBg:      "rgba(78,205,196,0.10)",
  cauBg:      "rgba(255,159,67,0.10)",
  danBg:      "rgba(255,82,82,0.10)",
  neutBg:     "rgba(96,125,139,0.10)",
  brand:      "#e8341c",
  gold:       "#FFD700",
  white:      "#f5f5f0",
  blueTint:   "rgba(74,144,226,0.10)",
};

// ── Shared math ───────────────────────────────────────────────────────────────
function epley(w, r) {
  if (!w || !r || w <= 0 || r <= 0) return 0;
  return r === 1 ? w : w * (1 + r / 30);
}

function linReg(ys) {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0, sigma: 0 };
  const xs = ys.map((_, i) => i);
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (!den) return { slope: 0, intercept: my, r2: 0, sigma: 0 };
  const slope = num / den;
  const ic = my - slope * mx;
  const ssTot = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  const ssRes = ys.reduce((s, y, i) => s + (y - (slope * xs[i] + ic)) ** 2, 0);
  const r2 = ssTot ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const sigma = n > 2 ? Math.sqrt(ssRes / (n - 2)) : my * 0.05;
  return { slope, intercept: ic, r2, sigma };
}

function fmtDate(dateStr, short = false) {
  const d = new Date((dateStr || "").replace("T", " ").split(" ")[0] + "T12:00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", short
    ? { month: "short", day: "numeric" }
    : { month: "long", day: "numeric" });
}

function fmtDateFull(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// ── SVG layout constants ──────────────────────────────────────────────────────
const VW = 320, VH = 160;
const PAD = { t: 16, r: 10, b: 24, l: 36 };
const PW = VW - PAD.l - PAD.r, PH = VH - PAD.t - PAD.b;

function curvePath(pts) {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cpx = ((x0 + x1) / 2).toFixed(1);
    d += ` C ${cpx} ${y0.toFixed(1)}, ${cpx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 3 — BODY COMPOSITION VECTOR
// ═══════════════════════════════════════════════════════════════════════════════
const STRENGTH_LIFTS = [
  { terms: ["bench press", "barbell bench", "flat bench", "incline bench", "dumbbell bench"] },
  { terms: ["squat"] },
  { terms: ["deadlift", "rdl", "romanian deadlift"] },
];

function getWeekSnapshot(workoutLogsRaw, bodyweightLogs, weekStart, weekEnd) {
  const wLogs = (workoutLogsRaw || []).filter(l => l.date >= weekStart && l.date <= weekEnd);

  const liftMaxes = STRENGTH_LIFTS.map(lift => {
    let max = 0;
    wLogs.forEach(log => {
      (log.workout?.exercises || []).forEach(ex => {
        const n = (ex.name || "").toLowerCase();
        if (!lift.terms.some(t => n.includes(t))) return;
        (ex.sets || []).filter(s => s.done).forEach(s => {
          max = Math.max(max, epley(parseFloat(s.weight) || 0, parseInt(s.reps) || 0));
        });
      });
    });
    return max;
  }).filter(v => v > 0);

  const strength = liftMaxes.length ? liftMaxes.reduce((s, v) => s + v, 0) / liftMaxes.length : null;

  const bwEntries = (bodyweightLogs || []).filter(l => l.date >= weekStart && l.date <= weekEnd);
  const weight = bwEntries.length
    ? bwEntries.reduce((s, l) => s + parseFloat(l.weight || 0), 0) / bwEntries.length
    : null;

  return { weekStart, strength, weight };
}

function useVectorData(workoutLogsRaw, bodyweightLogs) {
  return useMemo(() => {
    const snaps = [];
    for (let i = 7; i >= 0; i--) {
      const endMs = Date.now() - i * 7 * 864e5;
      const startMs = endMs - 7 * 864e5;
      const ws = new Date(startMs).toISOString().split("T")[0];
      const we = new Date(endMs).toISOString().split("T")[0];
      snaps.push(getWeekSnapshot(workoutLogsRaw, bodyweightLogs, ws, we));
    }

    const validStr = snaps.filter(s => s.strength != null);
    const validWt  = snaps.filter(s => s.weight != null);

    if (validStr.length < 2 && validWt.length < 2) return { points: [], hasData: false };

    // Baseline = first valid values
    const baseStr = validStr[0]?.strength || 100;
    const baseWt  = validWt[0]?.weight || 70;

    const points = snaps.map(s => ({
      weekStart: s.weekStart,
      // x = strength delta % (+ = gaining muscle)
      x: s.strength != null ? ((s.strength - baseStr) / baseStr) * 100 : null,
      // y = -weight delta % (+ = losing fat / weight going down)
      y: s.weight != null ? -((s.weight - baseWt) / baseWt) * 100 : null,
    })).filter(p => p.x != null && p.y != null);

    const current = points[points.length - 1] || { x: 0, y: 0 };
    const prev    = points[points.length - 2] || current;

    // Quadrant
    const quad = current.x >= 0 && current.y >= 0 ? "ideal"
               : current.x <  0 && current.y >= 0 ? "cutting"
               : current.x >= 0 && current.y <  0 ? "bulk"
               : "reverse";

    const insightMap = {
      ideal:   "↗ Moving in the right direction — gaining strength while weight is stable or dropping.",
      cutting: "↑ Losing weight and strength. Increase protein and reduce calorie deficit slightly.",
      bulk:    "→ Getting stronger with some weight gain. Normal for a building phase.",
      reverse: "↙ Both strength and weight moving the wrong way. Prioritize sleep, nutrition, and consistency.",
    };

    return { points, current, prev, quad, insight: insightMap[quad], hasData: points.length >= 2 };
  }, [workoutLogsRaw, bodyweightLogs]);
}

export function BodyCompositionVector({ workoutLogsRaw = [], bodyweightLogs = [], wUnit = "lbs" }) {
  const { points, current, prev, quad, insight, hasData } = useVectorData(workoutLogsRaw, bodyweightLogs);

  // SVG for quadrant chart
  const QW = 260, QH = 200;
  const CX = QW / 2, CY = QH / 2;
  const SCALE = 6; // px per % unit

  function toSvg(x, y) {
    return [CX + Math.max(-CX + 12, Math.min(CX - 12, x * SCALE)), CY - Math.max(-CY + 12, Math.min(CY - 12, y * SCALE))];
  }

  const trailPts = points.slice(-8);
  const [cx_curr, cy_curr] = hasData ? toSvg(current.x, current.y) : [CX, CY];
  const [cx_prev, cy_prev] = hasData && points.length > 1 ? toSvg(prev.x, prev.y) : [cx_curr - 1, cy_curr];

  // Arrow direction (extend past current point)
  const dx = cx_curr - cx_prev, dy = cy_curr - cy_prev;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ax = cx_curr + (dx / len) * 10, ay = cy_curr + (dy / len) * 10;

  return (
    <div style={{ margin:"0 20px 14px", background:"var(--navy-card)", border:`1px solid ${T.bd}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.bd}` }}>
        <div style={{ fontFamily:"var(--condensed)", fontWeight:900, fontSize:14, letterSpacing:"0.1em", textTransform:"uppercase", color:"#fff" }}>
          Body Composition Vector
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>
          Which way am I going?
        </div>
      </div>

      <div style={{ padding:"14px 16px 6px" }}>
        {!hasData ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🧭</div>
            <div style={{ fontFamily:"var(--condensed)", fontSize:13, color:"rgba(245,245,240,0.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Log workouts and bodyweight to see your vector
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", justifyContent:"center" }}>
            <svg viewBox={`0 0 ${QW} ${QH}`} width="100%" style={{ maxWidth:QW, height:QH, display:"block" }}>
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill={CC.brand}/>
                </marker>
              </defs>

              {/* Quadrant backgrounds */}
              <rect x={CX} y={0}   width={CX} height={CY} fill={CC.optBg}  />
              <rect x={0}  y={0}   width={CX} height={CY} fill={CC.cauBg}  />
              <rect x={CX} y={CY}  width={CX} height={CY} fill={CC.blueTint}/>
              <rect x={0}  y={CY}  width={CX} height={CY} fill={CC.danBg}  />

              {/* Quadrant divider lines */}
              <line x1={CX} y1={0} x2={CX} y2={QH} stroke="rgba(245,245,240,0.12)" strokeWidth="1" strokeDasharray="4,4"/>
              <line x1={0} y1={CY} x2={QW} y2={CY} stroke="rgba(245,245,240,0.12)" strokeWidth="1" strokeDasharray="4,4"/>

              {/* Quadrant labels */}
              <text x={CX + 4} y={10} fontFamily="var(--mono)" fontSize="7" fill="rgba(78,205,196,0.8)" letterSpacing="0.08em">IDEAL ✓</text>
              <text x={4}      y={10} fontFamily="var(--mono)" fontSize="7" fill="rgba(255,159,67,0.7)" letterSpacing="0.08em">LOSING MUSCLE</text>
              <text x={CX + 4} y={QH - 4} fontFamily="var(--mono)" fontSize="7" fill="rgba(74,144,226,0.7)" letterSpacing="0.08em">BUILDING PHASE</text>
              <text x={4}      y={QH - 4} fontFamily="var(--mono)" fontSize="7" fill="rgba(255,82,82,0.7)" letterSpacing="0.08em">WRONG DIRECTION</text>

              {/* Axis labels */}
              <text x={CX / 2} y={CY - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.25)">← Losing strength</text>
              <text x={CX + CX / 2} y={CY - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.25)">Gaining strength →</text>
              <text x={4} y={CY / 2} fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.2)" transform={`rotate(-90, 4, ${CY / 2})`}>Losing fat ↑</text>

              {/* Trail dots */}
              {trailPts.slice(0, -1).map((p, i) => {
                const [px, py] = toSvg(p.x, p.y);
                const age = trailPts.length - 1 - i;
                return <circle key={i} cx={px} cy={py} r={3 - age * 0.25} fill="rgba(245,245,240,0.18)" />;
              })}

              {/* Trail connecting line */}
              {trailPts.length > 1 && (
                <polyline
                  points={trailPts.map(p => toSvg(p.x, p.y).join(",")).join(" ")}
                  fill="none" stroke="rgba(245,245,240,0.15)" strokeWidth="1"
                />
              )}

              {/* Direction arrow */}
              <line x1={cx_prev} y1={cy_prev} x2={ax} y2={ay}
                stroke={CC.brand} strokeWidth="2.5" markerEnd="url(#arrowhead)"/>

              {/* Current position dot */}
              <circle cx={cx_curr} cy={cy_curr} r="6" fill={CC.white} stroke={T.bg} strokeWidth="1.5"/>
              <circle cx={cx_curr} cy={cy_curr} r="3" fill={quad === "ideal" ? CC.optimal : quad === "bulk" ? T.carb : quad === "cutting" ? CC.caution : CC.danger}/>
            </svg>
          </div>
        )}
      </div>

      {/* Insight */}
      {hasData && (
        <div style={{ margin:"0 14px 12px", padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:`1px solid ${T.bd}`, borderRadius:10 }}>
          <div style={{ fontSize:12, color:"rgba(245,245,240,0.8)", lineHeight:1.65, marginBottom:8 }}>{insight}</div>
          <div style={{ fontSize:11, color:T.mu, lineHeight:1.6, borderTop:`1px solid rgba(255,255,255,0.06)`, paddingTop:8 }}>
            The scale shows one number. This chart shows the <em style={{ color:"rgba(245,245,240,0.6)" }}>direction</em> of change. The goal is the top-right corner.
          </div>
        </div>
      )}
      <div style={{ height:4 }}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 4 — GOAL PROBABILITY CONE
// ═══════════════════════════════════════════════════════════════════════════════
const CONE_LIFTS = [
  { key:"bench",    label:"Bench",    terms:["bench press","barbell bench","flat bench","dumbbell bench","incline bench"] },
  { key:"squat",    label:"Squat",    terms:["squat"] },
  { key:"deadlift", label:"Deadlift", terms:["deadlift","rdl","romanian deadlift"] },
  { key:"ohp",      label:"OHP",      terms:["overhead press","ohp","shoulder press","military press"] },
];

function extractHistory(workoutLogsRaw, lift) {
  const byDate = {};
  const sorted = [...(workoutLogsRaw || [])].sort((a, b) => a.date?.localeCompare(b.date));
  sorted.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      const n = (ex.name || "").toLowerCase();
      if (!lift.terms.some(t => n.includes(t))) return;
      const sets = (ex.sets || []).filter(s => {
        const w = parseFloat(s.weight) || 0, r = parseInt(s.reps) || 0;
        return w > 0 && r >= 1 && r <= 20;
      });
      if (!sets.length) return;
      const best = Math.max(...sets.map(s => epley(parseFloat(s.weight), parseInt(s.reps))));
      if (best > 0) byDate[log.date] = Math.max(byDate[log.date] || 0, best);
    });
  });
  return Object.entries(byDate).map(([date, value]) => ({ date, value: Math.round(value) })).sort((a, b) => a.date.localeCompare(b.date));
}

function buildConeData(history, goal) {
  if (history.length < 3) return null;
  const reg = linReg(history.map(h => h.value));
  const lastVal = history[history.length - 1].value;
  const avgGapMs = history.length > 1
    ? (new Date(history[history.length - 1].date + "T12:00:00") - new Date(history[0].date + "T12:00:00")) / (history.length - 1)
    : 7 * 864e5;

  // Project forward until all 3 lines cross the goal (or 104 weeks max)
  const projPoints = [];
  let bestWeek = null, likelyWeek = null, slowWeek = null;

  for (let i = 1; i <= 104; i++) {
    const v = reg.intercept + reg.slope * (history.length - 1 + i);
    const weekFrac = (i * avgGapMs) / (7 * 864e5);
    const unc = reg.sigma * Math.sqrt(weekFrac) * 1.28; // 80% CI
    const upper = v + unc, lower = Math.max(0, v - unc);
    const date = new Date(new Date(history[history.length - 1].date + "T12:00:00").getTime() + i * avgGapMs);

    projPoints.push({ date: date.toISOString().split("T")[0], value: v, upper, lower });

    if (bestWeek === null && upper >= goal) bestWeek = projPoints[projPoints.length - 1].date;
    if (likelyWeek === null && v >= goal) likelyWeek = projPoints[projPoints.length - 1].date;
    if (slowWeek === null && lower >= goal) slowWeek = projPoints[projPoints.length - 1].date;

    if (bestWeek && likelyWeek && slowWeek) break;
  }

  // Only keep enough projection to show all crossings + small buffer
  const maxIdx = projPoints.findIndex(p => slowWeek && p.date >= slowWeek);
  const trimmed = projPoints.slice(0, Math.min(projPoints.length, Math.max(12, maxIdx + 4)));

  return {
    reg, history, projection: trimmed, goal, lastVal,
    dates: { best: bestWeek, likely: likelyWeek, slow: slowWeek },
    confidence: Math.round(reg.r2 * 100),
    weeklyGain: (reg.slope / avgGapMs) * 7 * 864e5,
  };
}

export function GoalProbabilityCone({ workoutLogsRaw = [], wUnit = "lbs" }) {
  const [liftKey, setLiftKey] = useState("bench");

  const { coneData, allHaveData } = useMemo(() => {
    const lift = CONE_LIFTS.find(l => l.key === liftKey);
    if (!lift) return { coneData: null, allHaveData: false };
    const history = extractHistory(workoutLogsRaw, lift);
    if (history.length < 3) return { coneData: null, allHaveData: false };
    const lastVal = history[history.length - 1].value;
    const goal = Math.ceil((lastVal * 1.15) / 5) * 5;
    return { coneData: buildConeData(history, goal), allHaveData: true };
  }, [workoutLogsRaw, liftKey]);

  const cd = coneData;
  const allPts = cd ? [...cd.history.map(h => h.value), ...cd.projection.map(p => p.upper)] : [];
  const yLo = allPts.length ? Math.floor(Math.min(...allPts) * 0.94 / 5) * 5 : 0;
  const yHi = allPts.length ? Math.ceil(Math.max(...allPts) * 1.04 / 5) * 5 : 100;
  const total = cd ? cd.history.length + cd.projection.length : 1;

  function xs(i) { return PAD.l + (i / Math.max(1, total - 1)) * PW; }
  function ys(v)  { return yHi === yLo ? PAD.t + PH / 2 : PAD.t + PH - ((v - yLo) / (yHi - yLo)) * PH; }

  const histPts = cd ? cd.history.map((h, i) => [xs(i), ys(h.value)]) : [];
  const n = cd?.history.length || 0;
  const projCenter = cd ? cd.projection.map((p, i) => [xs(n + i), ys(p.value)]) : [];
  const projUpper  = cd ? cd.projection.map((p, i) => [xs(n + i), ys(p.upper)]) : [];
  const projLower  = cd ? cd.projection.map((p, i) => [xs(n + i), ys(p.lower)]) : [];

  // Cone fill
  const coneFill = cd && projUpper.length > 0 ? (
    [...projUpper.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" "),
     ...[...projLower].reverse().map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`),
     "Z"].join(" ")
  ) : "";

  // Goal line Y
  const goalY = cd ? ys(cd.goal) : 0;

  // X label indices
  const xLblIdxs = cd ? [0, Math.floor(n / 2), n - 1, n + Math.floor(cd.projection.length / 2), total - 1] : [];

  const allDates = cd ? [...cd.history.map(h => h.date), ...cd.projection.map(p => p.date)] : [];

  return (
    <div style={{ margin:"0 20px 14px", background:"var(--navy-card)", border:`1px solid ${T.bd}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"13px 16px 0", borderBottom:`1px solid ${T.bd}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:"var(--condensed)", fontWeight:900, fontSize:14, letterSpacing:"0.1em", textTransform:"uppercase", color:"#fff" }}>
              Goal Probability Cone
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>
              When do I hit my goal?
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:5, paddingBottom:10 }}>
          {CONE_LIFTS.map(l => (
            <button key={l.key} onClick={() => setLiftKey(l.key)} style={{
              padding:"4px 10px", borderRadius:6, cursor:"pointer", transition:"all 0.15s",
              border:`1px solid ${liftKey === l.key ? "rgba(245,245,240,0.3)" : T.bd}`,
              background: liftKey === l.key ? "rgba(245,245,240,0.1)" : "transparent",
              color: liftKey === l.key ? "#fff" : T.mu,
              fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase",
            }}>{l.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"10px 14px 6px" }}>
        {!allHaveData ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>🎯</div>
            <div style={{ fontFamily:"var(--condensed)", fontSize:13, color:"rgba(245,245,240,0.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Log 3+ {CONE_LIFTS.find(l => l.key === liftKey)?.label} sessions to see your projection
            </div>
          </div>
        ) : cd && (
          <>
            <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" height={VH} style={{ display:"block" }}>
              {/* Y grid */}
              {[0.25, 0.5, 0.75].map(t => (
                <line key={t} x1={PAD.l} y1={PAD.t + PH * (1 - t)} x2={PAD.l + PW} y2={PAD.t + PH * (1 - t)} stroke="rgba(245,245,240,0.04)" strokeWidth="1"/>
              ))}

              {/* Goal line */}
              <line x1={PAD.l} y1={goalY} x2={PAD.l + PW} y2={goalY} stroke={CC.brand} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7"/>
              <text x={PAD.l + 2} y={goalY - 3} fontFamily="var(--mono)" fontSize="7" fill={CC.brand} opacity="0.9">GOAL {cd.goal} {wUnit}</text>

              {/* Cone fill */}
              {coneFill && <path d={coneFill} fill="rgba(255,159,67,0.08)"/>}

              {/* Projection upper / lower bounds */}
              {projUpper.length > 1 && <path d={curvePath(projUpper)} fill="none" stroke={CC.caution} strokeWidth="1" strokeDasharray="5,3" opacity="0.7"/>}
              {projLower.length > 1 && <path d={curvePath(projLower)} fill="none" stroke={CC.caution} strokeWidth="1" strokeDasharray="5,3" opacity="0.7"/>}

              {/* Forecast divider */}
              {n > 0 && projCenter.length > 0 && (
                <line x1={xs(n - 1)} y1={PAD.t} x2={xs(n - 1)} y2={PAD.t + PH} stroke="rgba(245,245,240,0.15)" strokeWidth="1" strokeDasharray="3,3"/>
              )}

              {/* Projection center */}
              {projCenter.length > 1 && (
                <path d={curvePath([[histPts[histPts.length - 1][0], histPts[histPts.length - 1][1]], ...projCenter])} fill="none" stroke={CC.white} strokeWidth="1.5" strokeDasharray="6,3" opacity="0.6"/>
              )}

              {/* Historical line */}
              {histPts.length > 1 && <path d={curvePath(histPts)} fill="none" stroke={CC.white} strokeWidth="2" strokeLinecap="round"/>}

              {/* Goal crossing markers */}
              {cd.dates.likely && cd.projection.find(p => p.date === cd.dates.likely) && (
                () => {
                  const idx = cd.projection.findIndex(p => p.date === cd.dates.likely);
                  const [gx] = projCenter[idx] || [0];
                  return (
                    <>
                      <line x1={gx} y1={goalY - 6} x2={gx} y2={goalY + 6} stroke={CC.brand} strokeWidth="1.5"/>
                      <circle cx={gx} cy={goalY} r="3" fill={CC.brand}/>
                    </>
                  );
                }
              )()}

              {/* X-axis labels */}
              {xLblIdxs.filter((v, i, a) => a.indexOf(v) === i && allDates[v]).map(i => (
                <text key={i} x={(PAD.l + (i / Math.max(1, total - 1)) * PW).toFixed(1)} y={VH - 4}
                  textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.3)">
                  {fmtDate(allDates[i], true)}
                </text>
              ))}

              {/* Legend */}
              <text x={xs(n - 1) + 4} y={PAD.t + 8} fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.3)" letterSpacing="0.1em">FORECAST →</text>
            </svg>

            {/* Legend row */}
            <div style={{ display:"flex", gap:12, marginTop:2, paddingLeft:PAD.l }}>
              {[
                { color:CC.white, dash:false, label:"Actual" },
                { color:CC.caution, dash:true, label:"Best / Slow pace" },
                { color:CC.brand, dash:true, label:`Goal ${cd.goal} ${wUnit}` },
              ].map(({ color, dash, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:16, height:2, background:color, borderRadius:1, opacity: dash ? 0.7 : 1 }}/>
                  <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Goal dates card */}
      {cd && (cd.dates.best || cd.dates.likely || cd.dates.slow) && (
        <div style={{ margin:"6px 14px 12px", padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:`1px solid ${T.bd}`, borderRadius:10 }}>
          <div style={{ fontFamily:"var(--condensed)", fontSize:13, fontWeight:800, color:"#fff", marginBottom:8, letterSpacing:"0.06em" }}>
            🎯 {CONE_LIFTS.find(l => l.key === liftKey)?.label} {cd.goal} {wUnit}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {[
              { label:"Best case",    date:cd.dates.best,   color:CC.optimal },
              { label:"Most likely",  date:cd.dates.likely, color:CC.white   },
              { label:"Slower pace",  date:cd.dates.slow,   color:CC.neutral },
            ].map(({ label, date, color }) => date && (
              <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontFamily:"var(--mono)", fontSize:10, color:T.mu, letterSpacing:"0.06em" }}>{label}</span>
                <span style={{ fontFamily:"var(--condensed)", fontSize:14, fontWeight:800, color }}>{fmtDate(date)}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, paddingTop:8, borderTop:`1px solid rgba(255,255,255,0.06)` }}>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu }}>Rate: {cd.weeklyGain >= 0 ? "+" : ""}{cd.weeklyGain.toFixed(1)} {wUnit}/wk</span>
            <span style={{ fontFamily:"var(--mono)", fontSize:9, color: cd.confidence >= 70 ? CC.optimal : cd.confidence >= 40 ? CC.caution : CC.neutral }}>
              Confidence: {cd.confidence}%
            </span>
          </div>
          <div style={{ fontSize:11, color:T.mu, lineHeight:1.6, marginTop:8 }}>
            The cone widens further out because we're less certain. The middle line is based on your actual rate of progress.
          </div>
        </div>
      )}
      <div style={{ height:4 }}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 5 — BALANCE CHECK
// ═══════════════════════════════════════════════════════════════════════════════
const BALANCE_CATS = {
  push:  ["bench", "press", "push", "dip", "fly", "chest press", "chest fly"],
  pull:  ["row", "pulldown", "pull-up", "pullup", "pull up", "chin", "face pull", "rear delt"],
  upper: ["bench", "press", "row", "pulldown", "pull-up", "pullup", "pull up", "chin",
          "fly", "dip", "curl", "tricep", "shoulder", "lat", "rhomboid", "face pull"],
  lower: ["squat", "deadlift", "leg press", "leg curl", "leg extension", "lunge",
          "hip thrust", "glute bridge", "calf", "rdl", "hamstring", "nordic"],
  front: ["squat", "leg press", "leg extension", "lunge", "hack squat", "goblet squat",
          "bench", "chest press", "overhead press", "shoulder press"],
  back:  ["deadlift", "rdl", "romanian", "leg curl", "nordic", "hip thrust", "glute bridge",
          "row", "pulldown", "pull-up", "pullup", "face pull", "rear delt", "good morning"],
};

function catVolume(workoutLogsRaw, terms, weeks = 4) {
  const cutoff = new Date(Date.now() - weeks * 7 * 864e5).toISOString().split("T")[0];
  let vol = 0;
  (workoutLogsRaw || []).filter(l => l.date >= cutoff).forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      const n = (ex.name || "").toLowerCase();
      if (!terms.some(t => n.includes(t))) return;
      (ex.sets || []).filter(s => s.done).forEach(s => {
        vol += (parseFloat(s.weight) || 20) * (parseInt(s.reps) || 0);
      });
    });
  });
  return vol / Math.max(1, weeks);
}

function ratioStatus(ratio) {
  if (ratio >= 0.8 && ratio <= 1.2) return { color: CC.optimal, badge: "✓", label: "Balanced" };
  if ((ratio >= 0.6 && ratio < 0.8) || (ratio > 1.2 && ratio <= 1.5)) return { color: CC.caution, badge: "⚠", label: "Slight imbalance" };
  return { color: CC.danger, badge: "⚠", label: "Imbalance" };
}

function BalanceRow({ label1, val1, label2, val2, status }) {
  const max = Math.max(val1, val2, 1);
  const p1 = Math.round((val1 / max) * 100);
  const p2 = Math.round((val2 / max) * 100);

  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"var(--mono)", fontSize:10, color:"rgba(245,245,240,0.75)", textTransform:"uppercase", letterSpacing:"0.08em" }}>
            {label1} vs {label2}
          </span>
        </div>
        <div style={{
          fontFamily:"var(--mono)", fontSize:9, color: status.color, letterSpacing:"0.06em",
          background:`${status.color}15`, border:`1px solid ${status.color}40`,
          borderRadius:5, padding:"2px 7px",
        }}>
          {status.badge} {status.label}
        </div>
      </div>
      {[{ label: label1, pct: p1 }, { label: label2, pct: p2 }].map(({ label, pct }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu, width:40, flexShrink:0, textTransform:"uppercase" }}>{label}</div>
          <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.05)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background: status.color, borderRadius:4, transition:"width 0.6s ease", opacity:0.75 }}/>
          </div>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(245,245,240,0.5)", width:28, textAlign:"right", flexShrink:0 }}>{pct}%</div>
        </div>
      ))}
    </div>
  );
}

export function BalanceCheck({ workoutLogsRaw = [], wUnit = "lbs", onViewExercises }) {
  const { push, pull, upper, lower, front, back, ppRatio, ulRatio, fbRatio, hasData, worstImbalance } = useMemo(() => {
    const push  = catVolume(workoutLogsRaw, BALANCE_CATS.push);
    const pull  = catVolume(workoutLogsRaw, BALANCE_CATS.pull);
    const upper = catVolume(workoutLogsRaw, BALANCE_CATS.upper);
    const lower = catVolume(workoutLogsRaw, BALANCE_CATS.lower);
    const front = catVolume(workoutLogsRaw, BALANCE_CATS.front);
    const back  = catVolume(workoutLogsRaw, BALANCE_CATS.back);

    const ppRatio = pull  > 0 ? push  / pull  : push > 0 ? Infinity : 1;
    const ulRatio = lower > 0 ? upper / lower : upper > 0 ? Infinity : 1;
    const fbRatio = back  > 0 ? front / back  : front > 0 ? Infinity : 1;

    const hasData = (push + pull + upper + lower) > 0;

    // Find worst imbalance for the main insight
    const ratios = [
      { ratio: ppRatio, label:"push:pull", fix:"Add more pulling exercises (rows, pull-ups, face pulls).", category:"pull" },
      { ratio: fbRatio, label:"front:back chain", fix:"Add Romanian deadlifts, hip thrusts, and face pulls.", category:"posterior" },
      { ratio: ulRatio, label:"upper:lower", fix:"Balance your split with equal upper and lower body sessions.", category:"lower" },
    ];
    const worst = ratios.reduce((a, b) => Math.abs(b.ratio - 1) > Math.abs(a.ratio - 1) ? b : a);
    const worstStatus = ratioStatus(worst.ratio);

    return { push, pull, upper, lower, front, back, ppRatio, ulRatio, fbRatio, hasData,
      worstImbalance: worstStatus.badge !== "✓" ? { ...worst, color: worstStatus.color } : null };
  }, [workoutLogsRaw]);

  return (
    <div style={{ margin:"0 20px 14px", background:"var(--navy-card)", border:`1px solid ${T.bd}`, borderRadius:16, overflow:"hidden" }}>
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.bd}` }}>
        <div style={{ fontFamily:"var(--condensed)", fontWeight:900, fontSize:14, letterSpacing:"0.1em", textTransform:"uppercase", color:"#fff" }}>
          Balance Check
        </div>
        <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>
          Am I in balance?
        </div>
      </div>

      <div style={{ padding:"14px 16px 6px" }}>
        {!hasData ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚖️</div>
            <div style={{ fontFamily:"var(--condensed)", fontSize:13, color:"rgba(245,245,240,0.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Log workouts to check your training balance
            </div>
          </div>
        ) : (
          <>
            <BalanceRow
              label1="Push" val1={push} label2="Pull" val2={pull}
              status={ratioStatus(ppRatio)}
            />
            <BalanceRow
              label1="Upper" val1={upper} label2="Lower" val2={lower}
              status={ratioStatus(ulRatio)}
            />
            <BalanceRow
              label1="Front" val1={front} label2="Back" val2={back}
              status={ratioStatus(fbRatio)}
            />

            {/* Legend */}
            <div style={{ display:"flex", gap:12, marginTop:4, paddingTop:10, borderTop:`1px solid ${T.bd}` }}>
              {[
                { color:CC.optimal, label:"Balanced (0.8–1.2)" },
                { color:CC.caution, label:"Slight imbalance" },
                { color:CC.danger,  label:"Significant" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }}/>
                  <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main insight */}
      {hasData && worstImbalance && (
        <div style={{ margin:"0 14px 12px", padding:"12px 14px", background:`${worstImbalance.color}0D`, border:`1px solid ${worstImbalance.color}35`, borderRadius:10 }}>
          <div style={{ fontSize:12, color:"rgba(245,245,240,0.85)", lineHeight:1.7 }}>
            <span style={{ color: worstImbalance.color, fontWeight:700 }}>{worstImbalance.badge} {worstImbalance.label.charAt(0).toUpperCase() + worstImbalance.label.slice(1)} ratio is {worstImbalance.ratio === Infinity ? "unbalanced" : `${worstImbalance.ratio.toFixed(1)}:1`}.</span>
            {" "}{worstImbalance.fix}
            {" "}Push:pull imbalance is the most common cause of shoulder injuries.
          </div>
          {onViewExercises && (
            <button
              onClick={() => onViewExercises(worstImbalance.category)}
              style={{
                marginTop:8, padding:"7px 14px", background:"rgba(255,255,255,0.06)",
                border:`1px solid ${T.bd}`, borderRadius:8, color:"rgba(245,245,240,0.65)",
                fontFamily:"var(--mono)", fontSize:9, letterSpacing:"0.1em",
                textTransform:"uppercase", cursor:"pointer",
              }}
            >
              See suggested exercises →
            </button>
          )}
        </div>
      )}
      <div style={{ height:4 }}/>
    </div>
  );
}
