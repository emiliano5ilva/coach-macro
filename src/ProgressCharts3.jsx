// Chart colors — chart-exclusive palette (CHART_COLORS from theme.js).
// Never conflict with macro colors (blue/green/amber) or brand red.
import { useState, useMemo, useEffect } from "react";
import { T } from "./components.jsx";
import { sb } from "./client.js";

const CC = {
  optimal:  "#4ECDC4",
  caution:  "#FF9F43",
  danger:   "#FF5252",
  neutral:  "#607D8B",
  optBg:    "rgba(78,205,196,0.10)",
  cauBg:    "rgba(255,159,67,0.10)",
  danBg:    "rgba(255,82,82,0.10)",
  neutBg:   "rgba(96,125,139,0.10)",
  brand:    "#e8341c",
  brandBg:  "rgba(232,52,28,0.10)",
  gold:     "#FFD700",
  goldBg:   "rgba(255,215,0,0.12)",
  white:    "#f5f5f0",
  amber:    "#F5A623",
  protBg:   "rgba(74,144,226,0.20)",
  noData:   "#111827",
  loggedMissed: "rgba(74,144,226,0.28)",
};

// ── Math helpers ───────────────────────────────────────────────────────────────
function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((s,x)=>s+x,0)/n;
  const my = ys.reduce((s,y)=>s+y,0)/n;
  const num = xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
  const den = Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)*ys.reduce((s,y)=>s+(y-my)**2,0));
  return den ? num/den : 0;
}

function linReg(ys_) {
  const n = ys_.length;
  if (n < 2) return { slope:0, intercept:ys_[0]||0, r2:0, sigma:0 };
  const xs_ = ys_.map((_,i)=>i);
  const mx = xs_.reduce((s,x)=>s+x,0)/n;
  const my = ys_.reduce((s,y)=>s+y,0)/n;
  const num = xs_.reduce((s,x,i)=>s+(x-mx)*(ys_[i]-my),0);
  const den = xs_.reduce((s,x)=>s+(x-mx)**2,0);
  if (!den) return { slope:0, intercept:my, r2:0, sigma:0 };
  const slope = num/den;
  const ic = my - slope*mx;
  const ssTot = ys_.reduce((s,y)=>s+(y-my)**2,0);
  const ssRes = ys_.reduce((s,y,i)=>s+(y-(slope*xs_[i]+ic))**2,0);
  const r2 = ssTot ? Math.max(0, 1-ssRes/ssTot) : 0;
  const sigma = n>2 ? Math.sqrt(ssRes/(n-2)) : Math.abs(my*0.05);
  return { slope, intercept:ic, r2, sigma };
}

// ── SVG helpers ────────────────────────────────────────────────────────────────
const VW = 320;

function curvePath(pts) {
  if (pts.length < 2) return pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0,y0] = pts[i-1], [x1,y1] = pts[i];
    const cpx = ((x0+x1)/2).toFixed(1);
    d += ` C ${cpx} ${y0.toFixed(1)}, ${cpx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

function bandPath(upper, lower) {
  if (!upper.length || !lower.length) return "";
  const fwd = upper.map(([x,y],i)=>`${i?"L":"M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const bwd = [...lower].reverse().map(([x,y])=>`L ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return `${fwd} ${bwd} Z`;
}

// Shared card wrapper
function ChartCard({ title, subtitle, children, style={} }) {
  return (
    <div style={{background:T.s1,borderRadius:16,padding:"16px 16px 14px",marginBottom:16,border:`1px solid ${T.bd}`,...style}}>
      {title&&<div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:15,color:CC.white,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:2}}>{title}</div>}
      {subtitle&&<div style={{fontSize:11,color:T.mu,marginBottom:10}}>{subtitle}</div>}
      {children}
    </div>
  );
}

// Skeleton placeholder bar
function Skeleton({ h=80 }) {
  return <div style={{height:h,borderRadius:8,background:"rgba(255,255,255,0.04)",animation:"pulse 1.5s ease-in-out infinite"}}/>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 6 — NUTRITION × PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
const VH6 = 160;
const P6  = { t:20, r:12, b:28, l:38 };
const PW6 = VW - P6.l - P6.r;
const PH6 = VH6 - P6.t - P6.b;

function xn6(i, n) { return P6.l + (i/Math.max(1,n-1))*PW6; }
function yn6(v, lo=0, hi=100) {
  if (hi===lo) return P6.t+PH6/2;
  return P6.t+PH6-((v-lo)/(hi-lo))*PH6;
}

function calcDayPerf(log) {
  const exs = log.workout?.exercises || [];
  let total=0, done=0;
  exs.forEach(ex=>{
    total += (ex.sets||[]).length;
    done  += (ex.sets||[]).filter(s=>s.done).length;
  });
  if (!total) return null;
  return Math.min(100, Math.round((done/total)*100));
}

export function NutritionPerformanceChart({ userId, profile, workoutLogsRaw }) {
  const [foodLogs,  setFoodLogs]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  const goalCals    = profile?.goalCals || 2000;
  const goalProtein = Math.round(goalCals * 0.3 / 4);

  useEffect(()=>{
    if (!userId) { setLoading(false); return; }
    const cutoff = new Date(Date.now()-30*864e5).toISOString().split("T")[0];
    sb.from("food_logs").select("date,entries")
      .eq("user_id",userId).gte("date",cutoff)
      .order("date",{ascending:true})
      .then(({data})=>{ setFoodLogs(data||[]); setLoading(false); });
  },[userId]);

  const { days, correlation, proteinInsight } = useMemo(()=>{
    const arr = [];
    for (let i=29; i>=0; i--)
      arr.push(new Date(Date.now()-i*864e5).toISOString().split("T")[0]);

    const nutMap = {};
    foodLogs.forEach(f=>{
      const es = f.entries||[];
      if (!es.length) return;
      const cal  = es.reduce((s,e)=>s+(e.calories||0),0);
      const prot = es.reduce((s,e)=>s+(e.protein||0),0);
      nutMap[f.date] = Math.round(
        (Math.min(1,cal/goalCals)*0.5 + Math.min(1,prot/goalProtein)*0.5)*100
      );
    });

    const perfMap = {};
    (workoutLogsRaw||[]).forEach(log=>{
      const p = calcDayPerf(log);
      if (p!=null) perfMap[log.date] = p;
    });

    const days = arr.map(d=>({ date:d, nut:nutMap[d]??null, perf:perfMap[d]??null }));

    // Correlation: nut[d] vs perf[d+2 days]
    const nutVals=[], perfVals=[];
    days.forEach((day,i)=>{
      if (day.nut==null) return;
      const futDate = arr[i+2];
      if (!futDate) return;
      const fp = perfMap[futDate];
      if (fp==null) return;
      nutVals.push(day.nut);
      perfVals.push(fp);
    });
    const correlation = nutVals.length>=4 ? pearson(nutVals, perfVals) : 0;

    // Insight: high-nut (>=85%) days → perf 2d later vs low-nut (<65%)
    const avgPerfAfter = (filter) => {
      const ps = days.flatMap((day,i)=>{
        if (!filter(day)) return [];
        const futDate = arr[i+2];
        return futDate&&perfMap[futDate]!=null ? [perfMap[futDate]] : [];
      });
      return ps.length ? Math.round(ps.reduce((s,x)=>s+x,0)/ps.length) : null;
    };
    const hiAvg = avgPerfAfter(d=>d.nut!=null&&d.nut>=85);
    const loAvg = avgPerfAfter(d=>d.nut!=null&&d.nut<65);
    const proteinInsight = hiAvg!=null&&loAvg!=null
      ? Math.round(((hiAvg-loAvg)/Math.max(1,loAvg))*100) : null;

    return { days, correlation, proteinInsight };
  },[foodLogs,workoutLogsRaw,goalCals,goalProtein]);

  if (loading) return (
    <ChartCard title="Nutrition × Performance" subtitle="Is my diet affecting my training?">
      <Skeleton h={120}/>
    </ChartCard>
  );

  const nutDays  = (days||[]).filter(d=>d.nut!=null);
  const perfDays = (days||[]).filter(d=>d.perf!=null);

  if (!nutDays.length) return (
    <ChartCard title="Nutrition × Performance" subtitle="Is my diet affecting my training?">
      <div style={{textAlign:"center",padding:"20px 0",color:T.mu,fontSize:12}}>
        Log food for 7+ days to see your nutrition-performance link.
      </div>
    </ChartCard>
  );

  const n = (days||[]).length;
  const barW = Math.max(2, (PW6/n)*0.65);
  const corrPct = Math.round(Math.abs(correlation)*100);
  const isStrong = corrPct >= 40;

  const perfPts = (days||[]).map((d,i)=>
    d.perf!=null ? [xn6(i,n), yn6(d.perf)] : null
  ).filter(Boolean);

  return (
    <ChartCard title="Nutrition × Performance" subtitle="Is my diet affecting my training?">
      {/* Correlation badge */}
      <div style={{background:isStrong?CC.optBg:CC.neutBg,borderRadius:8,padding:"8px 10px",marginBottom:10,border:`1px solid ${isStrong?CC.optimal:CC.neutral}30`}}>
        {isStrong ? (
          <>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,color:CC.optimal,letterSpacing:"0.08em",textTransform:"uppercase"}}>STRONG LINK FOUND</div>
            <div style={{fontSize:11,color:T.mu,marginTop:1}}>Your nutrition affects your performance.</div>
            <div style={{fontSize:11,color:CC.optimal,fontWeight:700,marginTop:1}}>Correlation: {corrPct}%</div>
          </>
        ) : (
          <div style={{fontSize:11,color:T.mu,lineHeight:1.5}}>
            Limited link found — other factors may matter more for you right now.{" "}
            {corrPct>0&&<span style={{color:CC.neutral}}>Correlation: {corrPct}%</span>}
          </div>
        )}
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${VW} ${VH6}`} style={{width:"100%",display:"block"}}>
        {[0,25,50,75,100].map(v=>(
          <line key={v} x1={P6.l} x2={VW-P6.r} y1={yn6(v)} y2={yn6(v)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
        ))}
        {[0,50,100].map(v=>(
          <text key={v} x={P6.l-4} y={yn6(v)+4} textAnchor="end" fontSize="8" fill="rgba(245,245,240,0.30)">{v}%</text>
        ))}

        {/* Nutrition bars */}
        {(days||[]).map((d,i)=>{
          if (d.nut==null) return null;
          const bx = xn6(i,n)-barW/2;
          const by = yn6(d.nut);
          const bh = (VH6-P6.b)-by;
          return bh>0 ? <rect key={d.date} x={bx} y={by} width={barW} height={bh} fill={CC.protBg} rx="1"/> : null;
        })}

        {/* Performance line */}
        {perfPts.length>=2&&(
          <path d={curvePath(perfPts)} fill="none" stroke={CC.brand} strokeWidth="1.5" strokeLinecap="round"/>
        )}
        {perfPts.map(([px,py],i)=>(
          <circle key={i} cx={px} cy={py} r="2" fill={CC.brand}/>
        ))}

        {/* X labels */}
        {[0, Math.floor(n/2), n-1].map(i=>(
          <text key={i} x={xn6(i,n)} y={VH6-P6.b+12} textAnchor="middle" fontSize="8" fill="rgba(245,245,240,0.30)">
            {new Date((days[i]?.date||"")+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
          </text>
        ))}

        {/* Legend */}
        <rect x={P6.l} y={P6.t-12} width={8} height={6} fill={CC.protBg} rx="1"/>
        <text x={P6.l+10} y={P6.t-7} fontSize="8" fill="rgba(245,245,240,0.45)">Nutrition adherence</text>
        <line x1={P6.l+106} y1={P6.t-9} x2={P6.l+116} y2={P6.t-9} stroke={CC.brand} strokeWidth="1.5"/>
        <text x={P6.l+118} y={P6.t-7} fontSize="8" fill="rgba(245,245,240,0.45)">Performance +48h</text>
      </svg>

      {/* Insight */}
      {proteinInsight!=null&&Math.abs(proteinInsight)>=5&&(
        <div style={{background:T.s2,borderRadius:8,padding:"10px 12px",marginTop:4,fontSize:11,color:T.mu,lineHeight:1.55}}>
          When you hit your nutrition targets you perform{" "}
          <span style={{color:CC.optimal,fontWeight:700}}>{Math.abs(proteinInsight)}% {proteinInsight>0?"better":"worse"}</span>
          {" "}48 hours later.{" "}
          <span style={{color:CC.white}}>This is YOUR personal number.</span>
        </div>
      )}

      {!proteinInsight&&perfDays.length<5&&(
        <div style={{fontSize:11,color:T.mu,marginTop:6,lineHeight:1.5}}>
          Log {Math.max(0,5-perfDays.length)} more workouts to see your personal nutrition-performance link.
        </div>
      )}
    </ChartCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 7 — WEIGHT TREND
// ═══════════════════════════════════════════════════════════════════════════════
const VH7  = 175;
const P7   = { t:20, r:14, b:30, l:44 };
const PW7  = VW - P7.l - P7.r;
const PH7  = VH7 - P7.t - P7.b;
const PROJ_WEEKS = 12;

function movAvg(vals, w=7) {
  return vals.map((_,i)=>{
    const sl = vals.slice(Math.max(0,i-w+1),i+1).filter(v=>v!=null);
    return sl.length ? sl.reduce((s,x)=>s+x,0)/sl.length : null;
  });
}

function rollStd(vals, ma, w=7) {
  return vals.map((_,i)=>{
    const v = ma[i]; if (v==null) return 0;
    const sl = vals.slice(Math.max(0,i-w+1),i+1).filter(x=>x!=null);
    if (sl.length<2) return 0;
    return Math.sqrt(sl.reduce((s,x)=>s+(x-v)**2,0)/sl.length);
  });
}

export function WeightTrendChart({ bodyweightLogs, profile, wUnit }) {
  const logs = useMemo(()=>[...(bodyweightLogs||[])].sort((a,b)=>a.date<b.date?-1:1),[bodyweightLogs]);
  const wU   = wUnit || "lbs";

  const { vals, ma, std, weeklyRate, proj, lo, hi, firstDate, lastDate, goalWeight } = useMemo(()=>{
    if (logs.length<2) return {};
    const vals = logs.map(l=>parseFloat(l.weight)).filter(v=>!isNaN(v)&&v>0);
    if (vals.length<2) return {};
    const ma  = movAvg(vals, 7);
    const std = rollStd(vals, ma, 7);

    // Weekly rate from first→last MA
    const cleanMA = ma.filter(v=>v!=null);
    const firstV  = cleanMA[0], lastV = cleanMA[cleanMA.length-1];
    const firstDate = new Date(logs[0].date+"T12:00:00").getTime();
    const lastDate  = new Date(logs[logs.length-1].date+"T12:00:00").getTime();
    const spanDays  = Math.max(1, (lastDate-firstDate)/864e5);
    const weeklyRate= spanDays>=7 ? (lastV-firstV)/spanDays*7 : 0;

    // 12-week projection from last MA value
    const proj = Array.from({length:PROJ_WEEKS},(_,w)=>lastV+(w+1)*weeklyRate);

    const goalWeight = profile?.goalWeight ?? null;
    const allVals = [...vals,...proj].filter(v=>v>0);
    const pad = (Math.max(...allVals)-Math.min(...allVals))*0.12 || 3;
    const lo  = Math.min(...allVals)-pad, hi=Math.max(...allVals)+pad;
    return { vals, ma, std, weeklyRate, proj, lo, hi, firstDate, lastDate, goalWeight };
  },[logs, profile]);

  if (!vals?.length) return (
    <ChartCard title="My Weight Trend" subtitle="Watch the line. Ignore the dots.">
      <div style={{textAlign:"center",padding:"20px 0",color:T.mu,fontSize:12}}>
        Log your weight daily to see your real trend.
      </div>
    </ChartCard>
  );

  const n      = vals.length;
  const nTotal = n + PROJ_WEEKS;

  function xp(i) { return P7.l + (i/Math.max(1,nTotal-1))*PW7; }
  function yp(v) {
    if (hi===lo) return P7.t+PH7/2;
    return P7.t+PH7-((v-lo)/(hi-lo))*PH7;
  }

  const maPts     = ma.map((v,i)=>v!=null?[xp(i),yp(v)]:null).filter(Boolean);
  const upperBand = std.map((s,i)=>ma[i]!=null?[xp(i),yp(ma[i]+s)]:null).filter(Boolean);
  const lowerBand = std.map((s,i)=>ma[i]!=null?[xp(i),yp(ma[i]-s)]:null).filter(Boolean);
  const projPts   = proj.map((v,w)=>[xp(n-1+w+1), yp(v)]);
  const goalY     = goalWeight ? yp(goalWeight) : null;

  const rateSign  = (weeklyRate||0)<0?"-":"+";
  const rateAbs   = Math.abs(weeklyRate||0).toFixed(1);
  const currW     = ma[ma.length-1]||vals[vals.length-1];
  let weeksToGoal = null;
  if (goalWeight&&weeklyRate&&Math.sign(goalWeight-currW)===Math.sign(weeklyRate))
    weeksToGoal = Math.round(Math.abs(goalWeight-currW)/Math.abs(weeklyRate));

  const yTicks = [lo, lo+(hi-lo)*0.25, lo+(hi-lo)*0.5, lo+(hi-lo)*0.75, hi].map(v=>Math.round(v*10)/10);

  return (
    <ChartCard title="My Weight Trend" subtitle="Watch the line. Ignore the dots.">
      <svg viewBox={`0 0 ${VW} ${VH7}`} style={{width:"100%",display:"block"}}>
        {/* Grid */}
        {yTicks.map((v,i)=>(
          <g key={i}>
            <line x1={P7.l} x2={VW-P7.r} y1={yp(v)} y2={yp(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <text x={P7.l-4} y={yp(v)+4} textAnchor="end" fontSize="8" fill="rgba(245,245,240,0.28)">{v.toFixed(0)}</text>
          </g>
        ))}

        {/* Flux band */}
        {upperBand.length>1&&lowerBand.length>1&&(
          <path d={bandPath(upperBand,lowerBand)} fill="rgba(245,245,240,0.04)"/>
        )}

        {/* Goal weight line */}
        {goalY!=null&&(
          <line x1={P7.l} x2={VW-P7.r} y1={goalY} y2={goalY}
            stroke={CC.brand} strokeWidth="1" strokeDasharray="4,3" opacity="0.65"/>
        )}
        {goalY!=null&&goalWeight&&(
          <text x={VW-P7.r-2} y={goalY-3} textAnchor="end" fontSize="8" fill={CC.brand} opacity="0.8">
            Goal {goalWeight}{wU}
          </text>
        )}

        {/* Daily dots */}
        {vals.map((v,i)=>(
          <circle key={i} cx={xp(i)} cy={yp(v)} r="1.5" fill="rgba(245,245,240,0.22)"/>
        ))}

        {/* MA line */}
        {maPts.length>=2&&(
          <path d={curvePath(maPts)} fill="none" stroke={CC.white} strokeWidth="2.2" strokeLinecap="round"/>
        )}

        {/* Projection line */}
        {maPts.length>=1&&projPts.length>0&&(()=>{
          const lastMA = maPts[maPts.length-1];
          return <path d={curvePath([lastMA,...projPts])} fill="none"
            stroke={CC.amber} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.75"/>;
        })()}

        {/* X axis labels */}
        {n>0&&[0, Math.floor(n/2), n-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>(
          <text key={i} x={xp(i)} y={VH7-P7.b+14} textAnchor="middle" fontSize="8" fill="rgba(245,245,240,0.28)">
            {new Date((logs[i]?.date||"")+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}
          </text>
        ))}
        {/* Projection label */}
        <text x={xp(n+PROJ_WEEKS/2-1)} y={VH7-P7.b+14} textAnchor="middle" fontSize="8" fill={CC.amber} opacity="0.6">
          proj →
        </text>

        {/* Y unit */}
        <text x={P7.l-6} y={P7.t-6} fontSize="8" fill="rgba(245,245,240,0.25)">{wU}</text>
      </svg>

      {/* Stats row */}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <div style={{flex:1,background:T.s2,borderRadius:8,padding:"8px 10px"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:17,color:CC.white,lineHeight:1}}>
            {rateSign}{rateAbs} {wU}/wk {(weeklyRate||0)<0?"↓":(weeklyRate||0)>0?"↑":"→"}
          </div>
          <div style={{fontSize:10,color:T.mu,marginTop:2}}>Real trend</div>
        </div>
        {weeksToGoal!=null&&(
          <div style={{flex:1,background:T.s2,borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:17,color:CC.amber,lineHeight:1}}>
              {weeksToGoal} weeks
            </div>
            <div style={{fontSize:10,color:T.mu,marginTop:2}}>Goal: {goalWeight} {wU}</div>
          </div>
        )}
      </div>

      <div style={{fontSize:11,color:T.mu,marginTop:8,lineHeight:1.55}}>
        Daily weight bounces because of water and food. The bold line is the real trend. Ignore the dots. Watch the line.
      </div>
    </ChartCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 8 — MACRO CALENDAR HEATMAP
// ═══════════════════════════════════════════════════════════════════════════════
const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function dayColor(entries, goalCals, goalProtein) {
  if (!entries?.length) return CC.noData;
  const cal  = entries.reduce((s,e)=>s+(e.calories||0),0);
  const prot = entries.reduce((s,e)=>s+(e.protein||0),0);
  const carbs= entries.reduce((s,e)=>s+(e.carbs||0),0);
  const fat  = entries.reduce((s,e)=>s+(e.fat||0),0);
  if (!cal) return CC.noData;
  const calOk  = cal  >= goalCals    *0.90 && cal  <= goalCals    *1.15;
  const protOk = prot >= goalProtein *0.90;
  const goalCarbs = Math.round(goalCals*0.4/4);
  const goalFat   = Math.round(goalCals*0.3/9);
  const carbOk = carbs>= goalCarbs*0.85;
  const fatOk  = fat  >= goalFat  *0.85 && fat <= goalFat*1.20;
  if (calOk && protOk && carbOk && fatOk) return CC.gold;
  if (calOk && protOk) return CC.optimal;
  return CC.loggedMissed;
}

function dayColorLabel(color) {
  if (color===CC.gold)         return "Perfect day";
  if (color===CC.optimal)      return "Hit targets";
  if (color===CC.loggedMissed) return "Logged, missed targets";
  return "No data";
}

export function MacroCalendarHeatmap({ userId, profile }) {
  const [foodMap,  setFoodMap]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null); // date string

  const goalCals    = profile?.goalCals || 2000;
  const goalProtein = Math.round(goalCals*0.3/4);

  useEffect(()=>{
    if (!userId) { setLoading(false); return; }
    const cutoff = new Date(Date.now()-90*864e5).toISOString().split("T")[0];
    sb.from("food_logs").select("date,entries")
      .eq("user_id",userId).gte("date",cutoff)
      .order("date",{ascending:true})
      .then(({data})=>{
        const m = {};
        (data||[]).forEach(f=>{ m[f.date]=f.entries||[]; });
        setFoodMap(m);
        setLoading(false);
      });
  },[userId]);

  // Build 13-week grid starting from the Sunday of 13 weeks ago
  const { cells, weeks } = useMemo(()=>{
    const today  = new Date(); today.setHours(12,0,0,0);
    const todoDOW= today.getDay();
    const Sunday = new Date(today.getTime()-todoDOW*864e5);
    const gridStart = new Date(Sunday.getTime()-12*7*864e5);
    const cells = [];
    for (let i=0;i<91;i++){
      const d = new Date(gridStart.getTime()+i*864e5);
      const dStr = d.toISOString().split("T")[0];
      const daysAgo = Math.round((today.getTime()-d.getTime())/864e5);
      cells.push({ date:dStr, dow:d.getDay(), week:Math.floor(i/7), inRange:daysAgo>=0&&daysAgo<90, isFuture:daysAgo<0 });
    }
    return { cells, weeks:13 };
  },[]);

  const { hitCount, totalDays, bestStreak, currentStreak, weakestDay } = useMemo(()=>{
    const inRange = cells.filter(c=>c.inRange&&!c.isFuture);
    let hit=0, total=0;
    inRange.forEach(c=>{
      const entries = foodMap[c.date];
      total++;
      const col = dayColor(entries||[], goalCals, goalProtein);
      if (col===CC.optimal||col===CC.gold) hit++;
    });

    // Streaks: consecutive hit days ending today
    const todayStr = new Date().toISOString().split("T")[0];
    const sorted = [...inRange].sort((a,b)=>a.date<b.date?-1:1);
    let best=0, cur=0, run=0;
    const todayIdx = sorted.findIndex(c=>c.date===todayStr);
    // best streak overall
    for (const c of sorted) {
      const col = dayColor(foodMap[c.date]||[], goalCals, goalProtein);
      if (col===CC.optimal||col===CC.gold) { run++; if(run>best)best=run; } else run=0;
    }
    // current streak (from today going back)
    for (let i=todayIdx>=0?todayIdx:sorted.length-1; i>=0; i--){
      const col = dayColor(foodMap[sorted[i].date]||[], goalCals, goalProtein);
      if (col===CC.optimal||col===CC.gold) cur++; else break;
    }

    // Weakest day of week
    const dowHit   = Array(7).fill(0);
    const dowTotal = Array(7).fill(0);
    inRange.forEach(c=>{
      dowTotal[c.dow]++;
      const col = dayColor(foodMap[c.date]||[], goalCals, goalProtein);
      if (col===CC.optimal||col===CC.gold) dowHit[c.dow]++;
    });
    const dowPct = dowTotal.map((t,i)=>t?dowHit[i]/t:1);
    const weakIdx = dowPct.indexOf(Math.min(...dowPct));

    return { hitCount:hit, totalDays:total, bestStreak:best, currentStreak:cur, weakestDay:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][weakIdx] };
  },[cells, foodMap, goalCals, goalProtein]);

  const selectedEntries = selected ? (foodMap[selected]||[]) : null;

  // Cell size
  const CELL = 18, GAP = 2;

  return (
    <ChartCard title="My Nutrition Calendar" subtitle="90-day macro heatmap">
      {loading ? <Skeleton h={100}/> : (
        <>
          {/* Grid */}
          <div style={{overflowX:"auto",paddingBottom:4}}>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${weeks},${CELL}px)`,gridTemplateRows:`repeat(7,${CELL}px)`,gap:GAP,width:weeks*(CELL+GAP)-GAP}}>
              {cells.map((c,idx)=>{
                const entries = c.inRange&&!c.isFuture ? (foodMap[c.date]||null) : null;
                const col  = (c.inRange&&!c.isFuture) ? dayColor(entries||[], goalCals, goalProtein) : "transparent";
                const isToday = c.date===new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={idx}
                    onClick={()=>c.inRange&&!c.isFuture?setSelected(selected===c.date?null:c.date):null}
                    style={{
                      gridColumn: c.week+1,
                      gridRow: c.dow+1,
                      width:CELL, height:CELL,
                      borderRadius:3,
                      background: col,
                      border: isToday?`1px solid ${CC.white}`:(selected===c.date?`1px solid ${CC.optimal}`:"1px solid transparent"),
                      cursor:c.inRange&&!c.isFuture?"pointer":"default",
                      opacity: c.isFuture?0.15:1,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Day labels */}
          <div style={{display:"flex",gap:0,marginTop:4}}>
            {DAYS_OF_WEEK.map((d,i)=>(
              <div key={i} style={{fontSize:9,color:T.mu,width:CELL+GAP,textAlign:"center"}}>{d}</div>
            ))}
          </div>

          {/* Legend */}
          <div style={{display:"flex",gap:10,marginTop:8,flexWrap:"wrap"}}>
            {[
              {col:CC.noData,      label:"No data"},
              {col:CC.loggedMissed,label:"Missed"},
              {col:CC.optimal,     label:"Hit targets"},
              {col:CC.gold,        label:"Perfect"},
            ].map(({col,label})=>(
              <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:10,height:10,borderRadius:2,background:col}}/>
                <span style={{fontSize:9,color:T.mu}}>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{marginTop:10,background:T.s2,borderRadius:8,padding:"10px 12px",fontSize:11,color:T.mu,lineHeight:1.7}}>
            <span style={{color:CC.white,fontWeight:700}}>Hit targets {Math.round((hitCount/Math.max(1,totalDays))*100)}% of days</span>
            {" "}({hitCount}/{totalDays})
            <br/>
            Best streak: <span style={{color:CC.optimal,fontWeight:700}}>{bestStreak} days</span>
            {" · "}
            Current streak: <span style={{color:CC.optimal,fontWeight:700}}>{currentStreak} days</span>
            <br/>
            Weakest day: <span style={{color:CC.caution,fontWeight:700}}>{weakestDay}</span>
          </div>

          {/* Day popup */}
          {selected&&(
            <div style={{marginTop:8,background:T.s2,borderRadius:8,padding:"10px 12px",border:`1px solid ${CC.optimal}30`}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,color:CC.white,marginBottom:6}}>
                {new Date(selected+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              </div>
              {selectedEntries?.length ? (
                <>
                  {[
                    {label:"Calories", val:Math.round(selectedEntries.reduce((s,e)=>s+(e.calories||0),0)), goal:goalCals, unit:"kcal", color:"var(--white)"},
                    {label:"Protein",  val:Math.round(selectedEntries.reduce((s,e)=>s+(e.protein||0),0)),  goal:goalProtein, unit:"g", color:"#e8341c"},
                    {label:"Carbs",    val:Math.round(selectedEntries.reduce((s,e)=>s+(e.carbs||0),0)),    goal:Math.round(goalCals*0.4/4), unit:"g", color:"#4A90E2"},
                    {label:"Fat",      val:Math.round(selectedEntries.reduce((s,e)=>s+(e.fat||0),0)),      goal:Math.round(goalCals*0.3/9), unit:"g", color:"#F5A623"},
                  ].map(({label,val,goal,unit,color})=>(
                    <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <span style={{fontSize:11,color:T.mu}}>{label}</span>
                      <span style={{fontSize:11,fontWeight:700,color:val>=goal*0.9?CC.optimal:CC.white}}>
                        {val} / {goal} {unit}
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <div style={{fontSize:11,color:T.mu}}>No food logged this day.</div>
              )}
              <button onClick={()=>setSelected(null)} style={{marginTop:8,fontSize:10,color:T.mu,background:"none",border:"none",cursor:"pointer",padding:0}}>Dismiss ×</button>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHART 9 — SLEEP vs PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════
const VH9  = 185;
const P9   = { t:20, r:12, b:30, l:38 };
const PW9  = VW - P9.l - P9.r;
const PH9  = VH9 - P9.t - P9.b;
const SLEEP_MIN = 4, SLEEP_MAX = 10;
const PERF_MIN  = 0, PERF_MAX  = 100;
const UNLOCK_THRESHOLD = 14;

function sxp(hrs) { return P9.l + ((hrs-SLEEP_MIN)/(SLEEP_MAX-SLEEP_MIN))*PW9; }
function syp(pct) { return P9.t + PH9 - ((pct-PERF_MIN)/(PERF_MAX-PERF_MIN))*PH9; }

export function SleepPerformanceChart({ userId }) {
  const [points,  setPoints]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if (!userId) { setLoading(false); return; }
    sb.from("bio_data_points")
      .select("input_value,output_value,recorded_at")
      .eq("user_id", userId)
      .eq("metric", "sleep_performance")
      .gte("input_value", SLEEP_MIN).lte("input_value", SLEEP_MAX+1)
      .gte("output_value", 0).lte("output_value", 100)
      .order("recorded_at",{ascending:true})
      .then(({data})=>{
        setPoints((data||[]).map(r=>({ x:parseFloat(r.input_value), y:parseFloat(r.output_value) })));
        setLoading(false);
      });
  },[userId]);

  const { reg, sweetSpot, sweetPct, lowPct } = useMemo(()=>{
    if (points.length<4) return {};
    const xs_ = points.map(p=>p.x), ys_ = points.map(p=>p.y);
    const reg = linReg(ys_);

    // Group by 1-hr buckets: [4,5), [5,6), [6,7), [7,8), [8,9), [9+]
    const buckets = [
      {label:"4–5h", lo:4, hi:5},
      {label:"5–6h", lo:5, hi:6},
      {label:"6–7h", lo:6, hi:7},
      {label:"7–8h", lo:7, hi:8},
      {label:"8–9h", lo:8, hi:9},
      {label:"9h+",  lo:9, hi:11},
    ];
    buckets.forEach(b=>{
      const pts = points.filter(p=>p.x>=b.lo&&p.x<b.hi);
      b.avg  = pts.length ? pts.reduce((s,p)=>s+p.y,0)/pts.length : null;
      b.n    = pts.length;
    });
    const hasBuckets = buckets.filter(b=>b.avg!=null);
    if (!hasBuckets.length) return { reg };
    const best = hasBuckets.reduce((a,b)=>b.avg>a.avg?b:a);
    const under6 = buckets.filter(b=>b.hi<=6&&b.avg!=null);
    const u6avg  = under6.length ? under6.reduce((s,b)=>s+b.avg,0)/under6.length : null;
    const sweetPct = Math.round(best.avg);
    const lowPct   = u6avg!=null ? Math.round(u6avg) : null;
    return { reg, sweetSpot:best, sweetPct, lowPct };
  },[points]);

  const locked = points.length < UNLOCK_THRESHOLD;

  // Best-fit line pts
  const fitPts = useMemo(()=>{
    if (!reg||!points.length) return [];
    return [SLEEP_MIN, SLEEP_MAX].map((hr,i)=>{
      const v = reg.intercept + reg.slope*i*(points.length-1)/(SLEEP_MAX-SLEEP_MIN);
      return [sxp(hr), syp(Math.min(100,Math.max(0,v)))];
    });
  },[reg, points]);

  // Actual fit across the x range
  const fitLinePoints = useMemo(()=>{
    if (!points.length||!reg) return [];
    const xs_ = points.map(p=>p.x);
    const reg2 = linReg(xs_);
    // Do a proper x→y fit: regress y on x directly
    const n = points.length;
    const mx = xs_.reduce((s,x)=>s+x,0)/n;
    const my = points.map(p=>p.y).reduce((s,y)=>s+y,0)/n;
    const num= xs_.reduce((s,x,i)=>s+(x-mx)*(points[i].y-my),0);
    const den= xs_.reduce((s,x)=>s+(x-mx)**2,0);
    const slope2 = den?num/den:0;
    const ic2    = my - slope2*mx;
    return [[SLEEP_MIN,SLEEP_MAX]].flat().map(hr=>{
      const yv = Math.min(100,Math.max(0, slope2*hr+ic2));
      return [sxp(hr), syp(yv)];
    });
  },[points, reg]);

  return (
    <ChartCard title="Sleep vs Performance" subtitle="Does sleep affect my workouts?">
      {loading ? <Skeleton h={140}/> : locked ? (
        <>
          {/* Greyed placeholder */}
          <div style={{position:"relative",opacity:0.35,pointerEvents:"none"}}>
            <svg viewBox={`0 0 ${VW} ${VH9}`} style={{width:"100%",display:"block"}}>
              <rect x={P9.l} y={P9.t} width={PW9} height={PH9} fill="rgba(255,255,255,0.02)" rx="4"/>
              {[5,6,7,8,9].map(h=>(
                <line key={h} x1={sxp(h)} y1={P9.t} x2={sxp(h)} y2={P9.t+PH9} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              ))}
              {[25,50,75].map(v=>(
                <line key={v} x1={P9.l} y1={syp(v)} x2={P9.l+PW9} y2={syp(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
              ))}
              {Array.from({length:14},(_,i)=>(
                <circle key={i} cx={sxp(4.5+i*0.4)} cy={syp(30+i*3+Math.sin(i)*15)} r="3" fill="rgba(245,245,240,0.10)"/>
              ))}
            </svg>
          </div>
          <div style={{textAlign:"center",padding:"8px 0 4px",color:T.mu,fontSize:12}}>
            Sleep data unlocks after {UNLOCK_THRESHOLD} sessions with Apple Health connected.
            <br/>
            <span style={{color:CC.optimal,fontWeight:700}}>({points.length} of {UNLOCK_THRESHOLD} sessions logged)</span>
          </div>
        </>
      ) : (
        <>
          {/* Sweet spot callout */}
          {sweetSpot&&(
            <div style={{background:CC.optBg,borderRadius:8,padding:"8px 10px",marginBottom:10,border:`1px solid ${CC.optimal}30`}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:13,color:CC.optimal,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                YOUR SWEET SPOT: {sweetSpot.label}
              </div>
              {lowPct!=null&&sweetPct>lowPct&&(
                <div style={{fontSize:11,color:T.mu,marginTop:1}}>
                  You perform{" "}
                  <span style={{color:CC.optimal,fontWeight:700}}>{Math.round(((sweetPct-lowPct)/Math.max(1,lowPct))*100)}% better</span>
                  {" "}after {sweetSpot.label} vs under 6hrs.
                </div>
              )}
            </div>
          )}

          <svg viewBox={`0 0 ${VW} ${VH9}`} style={{width:"100%",display:"block"}}>
            {/* Grid */}
            {[25,50,75,100].map(v=>(
              <line key={v} x1={P9.l} x2={VW-P9.r} y1={syp(v)} y2={syp(v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}
            {[5,6,7,8,9].map(h=>(
              <line key={h} x1={sxp(h)} y1={P9.t} x2={sxp(h)} y2={P9.t+PH9} stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            ))}

            {/* Y axis labels */}
            {[0,50,100].map(v=>(
              <text key={v} x={P9.l-4} y={syp(v)+4} textAnchor="end" fontSize="8" fill="rgba(245,245,240,0.30)">{v}%</text>
            ))}

            {/* X axis labels */}
            {[4,5,6,7,8,9,10].map(h=>(
              <text key={h} x={sxp(h)} y={VH9-P9.b+12} textAnchor="middle" fontSize="8" fill="rgba(245,245,240,0.30)">{h}h</text>
            ))}

            {/* Sweet spot shaded band */}
            {sweetSpot&&(
              <rect
                x={sxp(sweetSpot.lo)} y={P9.t}
                width={sxp(Math.min(sweetSpot.hi,SLEEP_MAX))-sxp(sweetSpot.lo)}
                height={PH9}
                fill={CC.optBg}
                rx="3"
              />
            )}

            {/* Best-fit line */}
            {fitLinePoints.length===2&&(
              <line x1={fitLinePoints[0][0]} y1={fitLinePoints[0][1]}
                x2={fitLinePoints[1][0]} y2={fitLinePoints[1][1]}
                stroke={CC.optimal} strokeWidth="1.5" strokeDasharray="4,2" opacity="0.7"/>
            )}

            {/* Data dots */}
            {points.map((p,i)=>(
              <circle key={i} cx={sxp(p.x)} cy={syp(p.y)} r="3"
                fill={CC.white} opacity="0.75" stroke="none"/>
            ))}

            {/* Axis labels */}
            <text x={P9.l+PW9/2} y={VH9-P9.b+26} textAnchor="middle" fontSize="9" fill={T.mu}>Sleep hours</text>
            <text x={P9.l-30} y={P9.t+PH9/2} textAnchor="middle" fontSize="9" fill={T.mu} transform={`rotate(-90,${P9.l-30},${P9.t+PH9/2})`}>Performance %</text>
          </svg>

          <div style={{fontSize:11,color:T.mu,marginTop:6,lineHeight:1.55}}>
            Each dot = one session. The green band is your peak sleep zone.
            Based on {points.length} sessions.
          </div>
        </>
      )}
    </ChartCard>
  );
}
