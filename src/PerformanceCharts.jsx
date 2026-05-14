// NOTE: Chart colors are chart-exclusive (CHART_COLORS palette from theme.js).
// They do not conflict with macro colors (blue/green/amber) or brand red.
import { useState, useMemo, useRef, useEffect } from "react";
import { T } from "./components.jsx";

// Chart-only colors
const CC = {
  optimal:  "#4ECDC4",  // turquoise — fitness / peak / good
  danger:   "#FF5252",  // chart red — fatigue / caution
  caution:  "#FF9F43",  // peach — projection / amber
  neutral:  "#607D8B",  // slate
  gold:     "#FFD700",  // achievement gold (from primary palette)
  brand:    "#e8341c",  // brand red — goal line only
  white:    "#f5f5f0",  // actual line
};

// ── SVG helpers ───────────────────────────────────────────────────────────────
const VW = 320, VH = 160;
const PAD = { t: 20, r: 10, b: 24, l: 38 };
const PW = VW - PAD.l - PAD.r;
const PH = VH - PAD.t - PAD.b;

function xs(i, n) { return PAD.l + (i / Math.max(1, n - 1)) * PW; }
function ys(v, lo, hi) {
  if (hi === lo) return PAD.t + PH / 2;
  return PAD.t + PH - ((v - lo) / (hi - lo)) * PH;
}

function linePath(pts) {
  if (!pts.length) return "";
  return pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

function curvePath(pts) {
  if (pts.length < 2) return linePath(pts);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const cpx = ((x0 + x1) / 2).toFixed(1);
    d += ` C ${cpx} ${y0.toFixed(1)}, ${cpx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

function bandPath(upper, lower) {
  if (!upper.length) return "";
  const fwd = upper.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const bwd = [...lower].reverse().map(([x, y]) => `L ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return `${fwd} ${bwd} Z`;
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function linReg(ys_) {
  const n = ys_.length;
  if (n < 2) return { slope: 0, intercept: ys_[0] || 0, r2: 0 };
  const xs_ = ys_.map((_, i) => i);
  const mx = xs_.reduce((s, x) => s + x, 0) / n;
  const my = ys_.reduce((s, y) => s + y, 0) / n;
  const num = xs_.reduce((s, x, i) => s + (x - mx) * (ys_[i] - my), 0);
  const den = xs_.reduce((s, x) => s + (x - mx) ** 2, 0);
  if (!den) return { slope: 0, intercept: my, r2: 0 };
  const slope = num / den;
  const intercept = my - slope * mx;
  const ssTot = ys_.reduce((s, y) => s + (y - my) ** 2, 0);
  const ssRes = ys_.reduce((s, y, i) => s + (y - (slope * xs_[i] + intercept)) ** 2, 0);
  const r2 = ssTot ? Math.max(0, 1 - ssRes / ssTot) : 0;
  return { slope, intercept, r2 };
}

function epley(weight, reps) {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

// ── LIFT DEFINITIONS ─────────────────────────────────────────────────────────
const LIFTS = [
  { key: "bench",    label: "Bench",    terms: ["bench press", "barbell bench", "flat bench", "dumbbell bench", "incline bench"] },
  { key: "squat",    label: "Squat",    terms: ["squat"] },
  { key: "deadlift", label: "Deadlift", terms: ["deadlift", "rdl", "romanian deadlift"] },
  { key: "ohp",      label: "OHP",      terms: ["overhead press", "ohp", "shoulder press", "military press"] },
];

function extractLiftHistory(workoutLogsRaw, liftKey) {
  const lift = LIFTS.find(l => l.key === liftKey);
  if (!lift) return [];
  const sessions = [];
  const sorted = [...(workoutLogsRaw || [])].sort((a, b) =>
    new Date(a.date + "T12:00:00") - new Date(b.date + "T12:00:00")
  );
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
      if (best > 0) sessions.push({ date: log.date, value: Math.round(best) });
    });
  });
  // Deduplicate by date — keep best per day
  const byDate = {};
  sessions.forEach(s => { byDate[s.date] = Math.max(byDate[s.date] || 0, s.value); });
  return Object.entries(byDate)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── FLUX RANGE CHART ─────────────────────────────────────────────────────────
export function FluxRangeChart({ workoutLogsRaw = [], wUnit = "lbs" }) {
  const [liftKey, setLiftKey] = useState("bench");
  const [showFlux, setShowFlux] = useState(true);
  const [showProj, setShowProj] = useState(true);
  const [tooltip, setTooltip] = useState(null); // {x, y, date, value}
  const svgRef = useRef(null);

  const history = useMemo(() => extractLiftHistory(workoutLogsRaw, liftKey), [workoutLogsRaw, liftKey]);

  const { points, fluxUpper, fluxLower, projPts, projUpper, projLower, prs, insight, xLabels } = useMemo(() => {
    if (history.length < 2) return { points: [], fluxUpper: [], fluxLower: [], projPts: [], projUpper: [], projLower: [], prs: [], insight: null, xLabels: [] };

    const vals = history.map(h => h.value);
    const allVals = [...vals];

    // Rolling 4-week flux band
    const rollingAvg = history.map((h, i) => {
      const cutoff = new Date(h.date + "T12:00:00").getTime() - 28 * 864e5;
      const win = history.slice(0, i + 1).filter(x => new Date(x.date + "T12:00:00").getTime() >= cutoff);
      return win.reduce((s, x) => s + x.value, 0) / win.length;
    });
    const fu = rollingAvg.map(v => v * 1.05);
    const fl = rollingAvg.map(v => v * 0.95);

    // Projection (linear regression on last 8 points)
    const recent = history.slice(-8);
    const reg = linReg(recent.map(r => r.value));
    const avgGapMs = history.length > 1
      ? (new Date(history[history.length - 1].date + "T12:00:00") - new Date(history[0].date + "T12:00:00")) / (history.length - 1)
      : 7 * 864e5;
    const sessionsIn4Wk = Math.max(3, Math.round((28 * 864e5) / avgGapMs));
    const lastVal = vals[vals.length - 1];
    const lastDate = new Date(history[history.length - 1].date + "T12:00:00");
    const proj = Array.from({ length: sessionsIn4Wk }, (_, i) => {
      const weekN = ((i + 1) * avgGapMs) / (7 * 864e5);
      const v = Math.max(0, reg.intercept + reg.slope * (recent.length - 1 + i + 1));
      const unc = lastVal * 0.02 * weekN;
      return {
        date: new Date(lastDate.getTime() + (i + 1) * avgGapMs).toISOString().split("T")[0],
        value: v, lower: Math.max(0, v - unc), upper: v + unc,
      };
    });

    proj.forEach(p => { allVals.push(p.value, p.lower, p.upper); });

    // PR detection
    let prMax = 0;
    const prSet = new Set();
    history.forEach((h, i) => { if (h.value > prMax) { prMax = h.value; prSet.add(i); } });

    // Y domain
    const yLo = Math.floor(Math.min(...allVals) * 0.94);
    const yHi = Math.ceil(Math.max(...allVals) * 1.04);
    const n = history.length;

    const pts = history.map((h, i) => [xs(i, n), ys(h.value, yLo, yHi)]);
    const fUp = fu.map((v, i) => [xs(i, n), ys(v, yLo, yHi)]);
    const fLo = fl.map((v, i) => [xs(i, n), ys(v, yLo, yHi)]);

    // Projection points on extended X axis
    const total = n + proj.length;
    const ptsP = proj.map((p, i) => [xs(n + i, total), ys(p.value, yLo, yHi)]);
    const pUp  = proj.map((p, i) => [xs(n + i, total), ys(p.upper, yLo, yHi)]);
    const pLo  = proj.map((p, i) => [xs(n + i, total), ys(p.lower, yLo, yHi)]);
    // Rescale history pts with full total x axis
    const ptsH = history.map((_, i) => [xs(i, total), ys(vals[i], yLo, yHi)]);
    const fUpT = fu.map((v, i) => [xs(i, total), ys(v, yLo, yHi)]);
    const fLoT = fl.map((v, i) => [xs(i, total), ys(v, yLo, yHi)]);
    // Add connecting segment from last actual to first projection
    const projFull = proj.length ? [[xs(n - 1, total), ys(vals[n - 1], yLo, yHi)], ...ptsP] : [];
    const pUpFull  = proj.length ? [[xs(n - 1, total), ys(fu[n - 1], yLo, yHi)], ...pUp] : [];
    const pLoFull  = proj.length ? [[xs(n - 1, total), ys(fl[n - 1], yLo, yHi)], ...pLo] : [];

    // PR markers
    const prMarkers = history.map((h, i) => prSet.has(i)
      ? { i, x: xs(i, total), y: ys(h.value, yLo, yHi), value: h.value, date: h.date }
      : null
    ).filter(Boolean);

    // X axis labels: first, ~middle, last actual, last projected
    const xLbls = [
      { x: xs(0, total), label: fmtDate(history[0].date) },
      { x: xs(Math.floor(n / 2), total), label: fmtDate(history[Math.floor(n / 2)].date) },
      { x: xs(n - 1, total), label: fmtDate(history[n - 1].date) },
    ];
    if (proj.length) xLbls.push({ x: xs(total - 1, total), label: fmtDate(proj[proj.length - 1].date) });

    // Y axis labels
    const yStep = Math.round((yHi - yLo) / 4 / 5) * 5 || 10;
    const yLbls = [];
    for (let v = Math.ceil(yLo / yStep) * yStep; v <= yHi; v += yStep) {
      yLbls.push({ y: ys(v, yLo, yHi), label: String(v) });
    }

    // Insight
    const weeklyGain = (reg.slope / avgGapMs) * 7 * 864e5;
    const nextMilestone = Math.ceil(lastVal / 5) * 5 + (lastVal % 5 === 0 ? 5 : 0);
    const weeksToGoal = weeklyGain > 0 ? Math.ceil((nextMilestone - lastVal) / weeklyGain) : null;
    const confidence = Math.round(reg.r2 * 100);

    return {
      points: ptsH, fluxUpper: fUpT, fluxLower: fLoT,
      projPts: projFull, projUpper: pUpFull, projLower: pLoFull,
      prs: prMarkers,
      xLabels: xLbls, yLabels: yLbls,
      dividerX: n > 0 ? xs(n - 1, total) : null,
      insight: history.length >= 3 ? { weeklyGain: weeklyGain.toFixed(1), nextMilestone, weeksToGoal, confidence, current: lastVal } : null,
    };
  }, [history]);

  const hasData = history.length >= 2;

  function handleTouch(e) {
    if (!svgRef.current || !history.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const relX = (clientX - rect.left) / rect.width;
    const svgX = relX * VW;
    const n = history.length + (showProj ? Math.max(3, Math.round(28 * 864e5 / 7 / 864e5)) : 0);
    const idx = Math.round(((svgX - PAD.l) / PW) * (history.length - 1));
    const i = Math.max(0, Math.min(history.length - 1, idx));
    const h = history[i];
    setTooltip({ x: points[i]?.[0], y: points[i]?.[1], date: h.date, value: h.value });
  }

  return (
    <div style={{ margin:"0 20px 14px", background:"var(--navy-card)", border:`1px solid ${T.bd}`, borderRadius:16, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"13px 16px 0", borderBottom:`1px solid ${T.bd}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:"var(--condensed)", fontWeight:900, fontSize:14, letterSpacing:"0.1em", textTransform:"uppercase", color:"#fff" }}>
              Lift Progression
            </div>
            <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>
              Flux Range · Am I Getting Stronger?
            </div>
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={() => setShowFlux(v => !v)} style={{
              padding:"3px 8px", borderRadius:5, border:`1px solid ${showFlux ? "rgba(78,205,196,0.5)" : T.bd}`,
              background: showFlux ? "rgba(78,205,196,0.12)" : "transparent",
              color: showFlux ? CC.optimal : T.mu, fontFamily:"var(--mono)", fontSize:8,
              letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer",
            }}>Flux</button>
            <button onClick={() => setShowProj(v => !v)} style={{
              padding:"3px 8px", borderRadius:5, border:`1px solid ${showProj ? "rgba(255,159,67,0.5)" : T.bd}`,
              background: showProj ? "rgba(255,159,67,0.12)" : "transparent",
              color: showProj ? CC.caution : T.mu, fontFamily:"var(--mono)", fontSize:8,
              letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer",
            }}>Proj</button>
          </div>
        </div>
        {/* Lift selector chips */}
        <div style={{ display:"flex", gap:5, paddingBottom:10 }}>
          {LIFTS.map(l => (
            <button key={l.key} onClick={() => { setLiftKey(l.key); setTooltip(null); }} style={{
              padding:"4px 10px", borderRadius:6, border:`1px solid ${liftKey === l.key ? "rgba(245,245,240,0.3)" : T.bd}`,
              background: liftKey === l.key ? "rgba(245,245,240,0.1)" : "transparent",
              color: liftKey === l.key ? "#fff" : T.mu, fontFamily:"var(--mono)", fontSize:10,
              letterSpacing:"0.08em", textTransform:"uppercase", cursor:"pointer", transition:"all 0.15s",
            }}>{l.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"10px 14px 6px", position:"relative" }}>
        {!hasData ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>📈</div>
            <div style={{ fontFamily:"var(--condensed)", fontSize:13, color:"rgba(245,245,240,0.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Log 2+ {LIFTS.find(l => l.key === liftKey)?.label} sessions to see your progression
            </div>
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VW} ${VH}`}
              width="100%" height={VH}
              style={{ display:"block", cursor:"crosshair" }}
              onTouchStart={handleTouch} onMouseMove={handleTouch}
              onMouseLeave={() => setTooltip(null)} onTouchEnd={() => setTimeout(() => setTooltip(null), 1500)}
            >
              {/* Y-axis grid + labels */}
              {[0.25, 0.5, 0.75, 1].map(t => {
                const y = PAD.t + (1 - t) * PH;
                return <line key={t} x1={PAD.l} y1={y} x2={PAD.l + PW} y2={y} stroke="rgba(245,245,240,0.05)" strokeWidth="1"/>;
              })}

              {/* Flux band (actual ±5%) */}
              {showFlux && fluxUpper.length > 0 && (
                <path d={bandPath(fluxUpper, fluxLower)} fill="rgba(78,205,196,0.08)" />
              )}

              {/* Projection band */}
              {showProj && projUpper.length > 0 && (
                <path d={bandPath(projUpper, projLower)} fill="rgba(255,159,67,0.10)" />
              )}

              {/* Forecast divider */}
              {showProj && projPts.length > 0 && (
                <>
                  <line
                    x1={projPts[0][0]} y1={PAD.t} x2={projPts[0][0]} y2={PAD.t + PH}
                    stroke="rgba(255,159,67,0.35)" strokeWidth="1" strokeDasharray="3,3"
                  />
                  <text x={projPts[0][0] + 3} y={PAD.t + 8} fontFamily="var(--mono)" fontSize="7" fill="rgba(255,159,67,0.7)" letterSpacing="0.1em">FORECAST →</text>
                </>
              )}

              {/* Projection center line */}
              {showProj && projPts.length > 1 && (
                <path d={curvePath(projPts)} fill="none" stroke={CC.caution} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.8"/>
              )}

              {/* Actual flux band solid border */}
              {showFlux && fluxUpper.length > 0 && (
                <>
                  <path d={curvePath(fluxUpper)} fill="none" stroke="rgba(78,205,196,0.25)" strokeWidth="0.75"/>
                  <path d={curvePath(fluxLower)} fill="none" stroke="rgba(78,205,196,0.25)" strokeWidth="0.75"/>
                </>
              )}

              {/* Actual lift line */}
              <path d={curvePath(points)} fill="none" stroke={CC.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

              {/* PR star markers */}
              {prs.map(pr => (
                <text key={`pr-${pr.i}`} x={pr.x} y={pr.y - 5} textAnchor="middle" fontSize="11" fill={CC.gold}>★</text>
              ))}

              {/* Tooltip dot */}
              {tooltip && (
                <circle cx={tooltip.x} cy={tooltip.y} r="4" fill={CC.white} stroke={T.bg} strokeWidth="1.5"/>
              )}

              {/* X-axis labels */}
              {[0, Math.floor(history.length / 2), history.length - 1].map(i => (
                <text key={i} x={points[i]?.[0] || 0} y={VH - 4} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.3)">
                  {fmtDate(history[i]?.date || "")}
                </text>
              ))}
            </svg>

            {/* Tooltip card */}
            {tooltip && (
              <div style={{
                position:"absolute", top:tooltip.y < 80 ? 50 : 14, left:"50%", transform:"translateX(-50%)",
                background:"rgba(10,15,28,0.95)", border:`1px solid ${T.bd}`,
                borderRadius:8, padding:"6px 10px", pointerEvents:"none", zIndex:10,
                display:"flex", gap:10, alignItems:"center",
              }}>
                <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu }}>{fmtDate(tooltip.date)}</div>
                <div style={{ fontFamily:"var(--condensed)", fontSize:16, fontWeight:900, color:"#fff" }}>{tooltip.value}</div>
                <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu }}>{wUnit} e1RM</div>
              </div>
            )}

            {/* Legend row */}
            <div style={{ display:"flex", gap:12, marginTop:4, paddingLeft:PAD.l }}>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:16, height:2, background:CC.white, borderRadius:1 }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>Actual</span>
              </div>
              {showFlux && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:12, height:8, background:"rgba(78,205,196,0.2)", borderRadius:2 }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>Flux ±5%</span>
              </div>}
              {showProj && <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:16, height:2, background:CC.caution, borderRadius:1 }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>Projection</span>
              </div>}
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:9, color:CC.gold }}>★</span>
                <span style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu }}>PR</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Insight card */}
      {hasData && insight && (
        <div style={{ margin:"0 14px 12px", padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:`1px solid ${T.bd}`, borderRadius:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 14px" }}>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu, textTransform:"uppercase", letterSpacing:"0.1em" }}>Rate</div>
              <div style={{ fontFamily:"var(--condensed)", fontSize:16, fontWeight:900, color: parseFloat(insight.weeklyGain) >= 0 ? CC.optimal : CC.danger }}>
                {parseFloat(insight.weeklyGain) >= 0 ? "+" : ""}{insight.weeklyGain} {wUnit}<span style={{ fontSize:9, fontFamily:"var(--mono)", color:T.mu, fontWeight:400 }}>/wk</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu, textTransform:"uppercase", letterSpacing:"0.1em" }}>Confidence</div>
              <div style={{ fontFamily:"var(--condensed)", fontSize:16, fontWeight:900, color: insight.confidence >= 70 ? CC.optimal : insight.confidence >= 40 ? CC.caution : CC.neutral }}>
                {insight.confidence}%
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu, textTransform:"uppercase", letterSpacing:"0.1em" }}>Current e1RM</div>
              <div style={{ fontFamily:"var(--condensed)", fontSize:16, fontWeight:900, color:"#fff" }}>{insight.current} {wUnit}</div>
            </div>
            {insight.weeksToGoal && (
              <div>
                <div style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu, textTransform:"uppercase", letterSpacing:"0.1em" }}>Next milestone</div>
                <div style={{ fontFamily:"var(--condensed)", fontSize:16, fontWeight:900, color:CC.gold }}>
                  {insight.nextMilestone} {wUnit}<span style={{ fontSize:9, fontFamily:"var(--mono)", color:T.mu, fontWeight:400 }}> ~{insight.weeksToGoal}wk</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ height:4 }}/>
    </div>
  );
}

// ── PEAK PERFORMANCE CHART ────────────────────────────────────────────────────
const α_ctl = 2 / 43; // 42-day EWA
const α_atl = 2 / 8;  // 7-day EWA

function computeLoad(workoutLogsRaw) {
  const tssMap = {};
  (workoutLogsRaw || []).forEach(log => {
    const tss = (log.workout?.exercises || []).reduce((total, ex) => {
      const vol = (ex.sets || []).filter(s => s.done).reduce((v, s) =>
        v + (parseFloat(s.weight) || 20) * (parseInt(s.reps) || 0), 0);
      return total + vol;
    }, 0) / 1000;
    const d = log.date;
    if (d) tssMap[d] = (tssMap[d] || 0) + Math.min(tss, 200);
  });
  return tssMap;
}

function buildAtlCtl(tssMap) {
  const result = [];
  let ctl = 20, atl = 20; // seed with baseline
  for (let i = 119; i >= -28; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().split("T")[0];
    const tss = tssMap[d] || 0;
    const isProj = i < 0;
    if (!isProj) {
      ctl = α_ctl * tss + (1 - α_ctl) * ctl;
      atl = α_atl * tss + (1 - α_atl) * atl;
    }
    result.push({ date: d, ctl, atl, tsb: ctl - atl, tss, isProj });
  }
  return result;
}

export function PeakPerformanceChart({ workoutLogsRaw = [] }) {
  const [analystMode, setAnalystMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const { series, insight } = useMemo(() => {
    const tssMap = computeLoad(workoutLogsRaw);
    const data = buildAtlCtl(tssMap);

    // Show last 90 days + 28 projection
    const display = data.slice(-118);
    if (!display.length) return { series: [], insight: null };

    // Normalize CTL and ATL to 0-100
    const maxV = Math.max(...display.map(d => Math.max(d.ctl, d.atl)), 1);
    const norm = v => (v / maxV) * 95 + 5; // 5–100 range so it's visible

    // Current state
    const lastReal = [...display].filter(d => !d.isProj).pop();
    const currentTSB = lastReal?.tsb || 0;
    const isPeak = currentTSB > 0;
    const daysUntilPeak = !isPeak ? display.findIndex((d, i) => !d.isProj && i > display.length - 20 && d.tsb > 0) : 0;

    return {
      series: display.map(d => ({ ...d, ctlN: norm(d.ctl), atlN: norm(d.atl) })),
      insight: lastReal ? { isPeak, tsb: currentTSB, ctl: lastReal.ctl, atl: lastReal.atl, daysUntilPeak } : null,
    };
  }, [workoutLogsRaw]);

  const hasData = series.some(d => !d.isProj && d.tss > 0);

  const n = series.length;
  const CHART_H = 140;
  const C_PAD = { t: 10, r: 8, b: 20, l: 8 };
  const CPW = VW - C_PAD.l - C_PAD.r;
  const CPH = CHART_H - C_PAD.t - C_PAD.b;

  function cx(i) { return C_PAD.l + (i / Math.max(1, n - 1)) * CPW; }
  function cy(v) { return C_PAD.t + CPH - (Math.min(100, Math.max(0, v)) / 100) * CPH; }

  const ctlPts  = series.map((d, i) => [cx(i), cy(d.ctlN)]);
  const atlPts  = series.map((d, i) => [cx(i), cy(d.atlN)]);

  // Peak zones: where ctl > atl
  const peakSegs = [];
  let seg = null;
  series.forEach((d, i) => {
    if (!d.isProj && d.ctl > d.atl) {
      if (!seg) seg = { start: i };
      seg.end = i;
    } else if (seg) {
      peakSegs.push({ ...seg });
      seg = null;
    }
  });
  if (seg) peakSegs.push(seg);

  // Bottom baseline points for filled area
  const baseline = (pts) => {
    const bottom = C_PAD.t + CPH;
    return `${pts.map(([x, y], i) => `${i ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} L ${pts[pts.length-1][0].toFixed(1)} ${bottom} L ${pts[0][0].toFixed(1)} ${bottom} Z`;
  };

  // Divider between actual and projection
  const projStart = series.findIndex(d => d.isProj);
  const divX = projStart > 0 ? cx(projStart) : null;

  // X-axis date labels
  const xLbls = [0, Math.floor(n * 0.33), Math.floor(n * 0.66), n - 1]
    .filter((v, i, a) => a.indexOf(v) === i)
    .map(i => ({ x: cx(i), label: fmtDate(series[i]?.date || "") }));

  return (
    <div style={{ margin:"0 20px 14px", background:"var(--navy-card)", border:`1px solid ${T.bd}`, borderRadius:16, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"13px 16px", borderBottom:`1px solid ${T.bd}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontFamily:"var(--condensed)", fontWeight:900, fontSize:14, letterSpacing:"0.1em", textTransform:"uppercase", color:"#fff" }}>
            Peak Timing
          </div>
          <div style={{ fontFamily:"var(--mono)", fontSize:9, color:T.mu, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>
            When am I peaking?
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <button
            onClick={() => setAnalystMode(v => !v)}
            style={{
              padding:"3px 9px", borderRadius:5, cursor:"pointer",
              border:`1px solid ${analystMode ? "rgba(245,245,240,0.25)" : T.bd}`,
              background: analystMode ? "rgba(245,245,240,0.08)" : "transparent",
              color: analystMode ? "#fff" : T.mu, fontFamily:"var(--mono)", fontSize:8,
              letterSpacing:"0.08em", textTransform:"uppercase",
            }}
          >
            {analystMode ? "CTL/ATL" : "Simple"}
          </button>
          <button
            onClick={() => setShowHelp(v => !v)}
            style={{
              width:18, height:18, borderRadius:"50%", border:`1px solid ${T.bd}`,
              background:"rgba(245,245,240,0.05)", color:"rgba(245,245,240,0.4)",
              fontFamily:"var(--mono)", fontSize:10, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}
          >?</button>
        </div>
      </div>

      {/* Help tooltip */}
      {showHelp && (
        <div style={{ margin:"10px 14px 0", padding:"12px 14px", background:"rgba(78,205,196,0.06)", border:`1px solid rgba(78,205,196,0.2)`, borderRadius:10 }}>
          <div style={{ fontSize:12, color:"rgba(245,245,240,0.8)", lineHeight:1.7 }}>
            <strong style={{ color:CC.optimal }}>Fitness</strong> builds slowly with consistent training.<br/>
            <strong style={{ color:CC.danger }}>Fatigue</strong> spikes after hard sessions and drops fast.<br/>
            When fitness is higher than fatigue — that's when you perform best.
          </div>
          <button onClick={() => setShowHelp(false)} style={{ marginTop:8, padding:"4px 12px", background:"rgba(255,255,255,0.06)", border:`1px solid ${T.bd}`, borderRadius:6, color:T.mu, fontFamily:"var(--mono)", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer" }}>Got it</button>
        </div>
      )}

      <div style={{ padding:"10px 14px 6px" }}>
        {!hasData ? (
          <div style={{ textAlign:"center", padding:"28px 0" }}>
            <div style={{ fontSize:28, marginBottom:8 }}>⚡</div>
            <div style={{ fontFamily:"var(--condensed)", fontSize:13, color:"rgba(245,245,240,0.4)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
              Log workouts to reveal your performance cycles
            </div>
          </div>
        ) : (
          <>
            {/* Area labels */}
            <div style={{ display:"flex", gap:12, marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:"rgba(78,205,196,0.3)", border:`1px solid ${CC.optimal}` }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:CC.optimal }}>
                  {analystMode ? "CTL (Fitness)" : "Your Fitness"}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:"rgba(255,82,82,0.25)", border:`1px solid ${CC.danger}` }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:CC.danger }}>
                  {analystMode ? "ATL (Fatigue)" : "Your Fatigue"}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:10, height:6, background:"rgba(78,205,196,0.15)", border:`1px solid rgba(78,205,196,0.3)`, borderRadius:2 }}/>
                <span style={{ fontFamily:"var(--mono)", fontSize:9, color:"rgba(78,205,196,0.7)" }}>Peak zone</span>
              </div>
            </div>

            <svg viewBox={`0 0 ${VW} ${CHART_H}`} width="100%" height={CHART_H} style={{ display:"block", overflow:"visible" }}>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75].map(t => (
                <line key={t} x1={C_PAD.l} y1={C_PAD.t + CPH * (1-t)} x2={C_PAD.l + CPW} y2={C_PAD.t + CPH * (1-t)} stroke="rgba(245,245,240,0.04)" strokeWidth="1"/>
              ))}

              {/* Peak zone shading */}
              {peakSegs.map((seg, si) => {
                const x1 = cx(seg.start), x2 = cx(seg.end);
                return (
                  <rect key={si} x={x1} y={C_PAD.t} width={Math.max(1, x2 - x1)} height={CPH}
                    fill="rgba(78,205,196,0.07)" />
                );
              })}

              {/* Fatigue filled area */}
              <path d={baseline(atlPts)} fill="rgba(255,82,82,0.18)" />
              {/* Fitness filled area */}
              <path d={baseline(ctlPts)} fill="rgba(78,205,196,0.18)" />

              {/* Fatigue line */}
              <path d={curvePath(atlPts.filter((_, i) => !series[i].isProj))} fill="none" stroke={CC.danger} strokeWidth="1.5" strokeLinecap="round"/>
              {/* Projected fatigue */}
              {projStart > 0 && <path d={curvePath(atlPts.slice(projStart - 1))} fill="none" stroke={CC.danger} strokeWidth="1" strokeDasharray="4,3" opacity="0.6"/>}

              {/* Fitness line */}
              <path d={curvePath(ctlPts.filter((_, i) => !series[i].isProj))} fill="none" stroke={CC.optimal} strokeWidth="2" strokeLinecap="round"/>
              {/* Projected fitness */}
              {projStart > 0 && <path d={curvePath(ctlPts.slice(projStart - 1))} fill="none" stroke={CC.optimal} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6"/>}

              {/* Projection divider */}
              {divX && (
                <>
                  <line x1={divX} y1={C_PAD.t} x2={divX} y2={C_PAD.t + CPH} stroke="rgba(245,245,240,0.12)" strokeWidth="1" strokeDasharray="3,3"/>
                  <text x={divX + 3} y={C_PAD.t + 8} fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.3)" letterSpacing="0.1em">PROJ →</text>
                </>
              )}

              {/* Peak label on current peak segments */}
              {peakSegs.slice(-1).map(seg => {
                const midX = (cx(seg.start) + cx(seg.end)) / 2;
                return (
                  <text key="peak-lbl" x={midX} y={C_PAD.t + 14} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="rgba(78,205,196,0.8)" letterSpacing="0.1em">YOUR PEAK</text>
                );
              })}

              {/* X labels */}
              {xLbls.map(({ x, label }) => (
                <text key={label} x={x} y={CHART_H - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" fill="rgba(245,245,240,0.3)">{label}</text>
              ))}

              {/* Analyst mode labels */}
              {analystMode && series.slice(-1).map((d, i) => (
                <g key="analyst">
                  <text x={cx(n-1) - 2} y={cy(d.ctlN) - 4} textAnchor="end" fontFamily="var(--mono)" fontSize="8" fill={CC.optimal}>CTL {d.ctl.toFixed(1)}</text>
                  <text x={cx(n-1) - 2} y={cy(d.atlN) + 10} textAnchor="end" fontFamily="var(--mono)" fontSize="8" fill={CC.danger}>ATL {d.atl.toFixed(1)}</text>
                </g>
              ))}
            </svg>
          </>
        )}
      </div>

      {/* Insight card */}
      {hasData && insight && (
        <div style={{
          margin:"0 14px 12px", padding:"10px 14px",
          background: insight.isPeak ? "rgba(78,205,196,0.08)" : "rgba(255,159,67,0.06)",
          border:`1px solid ${insight.isPeak ? "rgba(78,205,196,0.25)" : "rgba(255,159,67,0.2)"}`,
          borderRadius:10,
        }}>
          <div style={{ fontSize:13, color:"rgba(245,245,240,0.85)", lineHeight:1.6 }}>
            {insight.isPeak
              ? <><span style={{ color:CC.optimal, fontWeight:700 }}>🟢 You're in your peak window</span> — push hard this week. Fitness exceeds fatigue.</>
              : insight.daysUntilPeak > 0 && insight.daysUntilPeak < 14
                ? <><span style={{ color:CC.caution, fontWeight:700 }}>⏳ Approaching peak</span> — stay consistent, {insight.daysUntilPeak} days to your performance window.</>
                : <><span style={{ color:CC.danger, fontWeight:700 }}>🔄 Recovery phase</span> — fatigue is elevated. Prioritize sleep and lighter sessions.</>}
          </div>
          {analystMode && (
            <div style={{ display:"flex", gap:14, marginTop:8 }}>
              {[
                { label:"CTL", val:insight.ctl.toFixed(1), color:CC.optimal },
                { label:"ATL", val:insight.atl.toFixed(1), color:CC.danger },
                { label:"TSB", val:(insight.ctl - insight.atl).toFixed(1), color: insight.isPeak ? CC.optimal : CC.caution },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <div style={{ fontFamily:"var(--mono)", fontSize:8, color:T.mu, textTransform:"uppercase", letterSpacing:"0.1em" }}>{label}</div>
                  <div style={{ fontFamily:"var(--condensed)", fontSize:16, fontWeight:900, color }}>{val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ height:4 }}/>
    </div>
  );
}
