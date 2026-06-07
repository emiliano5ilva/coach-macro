import React, { useState, useEffect, useRef } from "react";

export const T = {
  bg:   "#000000",         // page background — pure black
  s1:   "#0d0d0d",         // card surface
  s2:   "#0d0d0d",         // card surface
  s3:   "#0d0d0d",         // section background
  bd:   "rgba(var(--accent-rgb),0.08)",   // border subtle — red-tinted
  mu:   "rgba(245,245,240,0.4)",  // text tertiary
  dim:  "rgba(245,245,240,0.65)", // text secondary
  prot: "var(--accent)",         // brand red / protein
  carb: "#60a5fa",         // design blue — carbs + training ring
  fat:  "#f59e0b",         // design amber — fat + warnings
  red:  "var(--accent)",         // brand red
  white:"#f5f5f0",
  txt:  "#f5f5f0",         // primary text
  brand:"var(--accent)",         // brand accent (alias for red)
  green:"#22c55e",         // design green — success, done states
  recovery: "#7E57C2",     // recovery/purple
  gold:     "#FFD700",     // achievement gold
  goldDeep: "#FFA000",     // achievement gold deep
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
export const WDAYS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const MONTHS_A = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAYS_A   = Array.from({length:31},(_,i)=>String(i+1));
export const YEARS_A  = Array.from({length:59},(_,i)=>String(2008-i)); // 2008 → 1950
export const FT_A     = ["4","5","6","7"];
export const IN_A     = Array.from({length:12},(_,i)=>String(i));
export const CM_A     = Array.from({length:121},(_,i)=>String(120+i));
export const LBS_A    = Array.from({length:421},(_,i)=>String(80+i));
export const KG_A     = Array.from({length:226},(_,i)=>String(35+i));

export const BF_DATA = [
  {r:"3–4%",  c:"#29B6F6",l:"Competition lean"},
  {r:"5–7%",  c:"#26C6DA",l:"Athletic"},
  {r:"8–12%", c:"#00E676", l:"Fit"},
  {r:"13–17%",c:T.prot,   l:"Lean"},
  {r:"18–23%",c:T.fat,    l:"Average"},
  {r:"24–29%",c:"#FFA726", l:"Above avg"},
  {r:"30–34%",c:"#EF6C00", l:"High"},
  {r:"35–39%",c:T.red,    l:"Very high"},
  {r:"40+%",  c:"#B71C1C", l:"Obese range"},
];

export const BF_VISUAL=[
  {r:"5–7%",   pct:6,  c:"#60a5fa",l:"Athletic",  desc:"Visible striations, very lean"},
  {r:"8–12%",  pct:10, c:"#22c55e", l:"Fit",       desc:"Visible abs, athletic build"},
  {r:"13–17%", pct:15, c:"#60a5fa", l:"Lean",      desc:"Defined, not shredded"},
  {r:"18–24%", pct:21, c:"#f59e0b", l:"Average",   desc:"Soft, no visible abs"},
  {r:"25–30%", pct:27, c:"#FFA726", l:"Above avg", desc:"Rounded belly, soft arms"},
  {r:"31–40%", pct:35, c:"#EF6C00", l:"High",      desc:"Significant fat coverage"},
  {r:"40+%",   pct:43, c:"var(--accent)", l:"Obese",     desc:"High health risk range"},
];

export const FOCUS_MUSCLES = {
  "Push":          "Chest (upper/mid/lower) · Shoulders (all 3 heads) · Triceps (all 3 heads)",
  "Pull":          "Lats (width + thickness) · Biceps (long + short + brachialis) · Rear delts + Traps",
  "Legs":          "Quads (squat/press) · Hamstrings (hinge + curl) · Glutes (thrust + abduction) · Calves",
  "Upper":         "Chest · Back · Shoulders · Arms — balanced push/pull",
  "Lower":         "Quads · Hamstrings · Glutes · Calves — all leg patterns",
  "Full Body":     "Major compound movements — squat, hinge, push, pull, carry",
  "Chest+Triceps": "Chest: upper/mid/lower. Triceps: long + lateral + medial head",
  "Back+Biceps":   "Lats: width + thickness. Biceps: long + short + brachialis",
  "Shoulders+Arms":"All 3 deltoid heads · Biceps + Triceps superset",
  "Arnold A":      "Chest · Shoulders · Triceps — push-focused day",
  "Arnold B":      "Back · Biceps · Rear Delts — pull-focused day",
  "Rest":          "Recovery day — no training, prioritize sleep and protein",
};

export const SPLIT_CYCLES = {
  "Push/Pull/Legs":  ["Push","Pull","Legs"],
  "Upper/Lower":     ["Upper","Lower"],
  "Full Body":       ["Full Body"],
  "Bro Split":       ["Chest","Back","Shoulders","Arms","Legs"],
  "Arnold Split":    ["Chest & Back","Shoulders & Arms","Legs"],
};

export const DAY_CFG = {
  training:{label:"Training", emoji:"💪", color:T.prot, bg:`${T.prot}18`},
  cardio:  {label:"Cardio",   emoji:"🏃", color:T.carb, bg:`${T.carb}18`},
  run:     {label:"Run",      emoji:"👟", color:"#29B6F6", bg:"#29B6F618"},
  hyrox:   {label:"Hyrox",    emoji:"🔥", color:T.fat,  bg:`${T.fat}18`},
  rest:    {label:"Rest",     emoji:"😴", color:T.mu,   bg:"#4A628518"},
};

export const FASTING_PROTOCOLS = [
  {id:"16:8",  label:"16:8",   fast:16, desc:"Skip breakfast"},
  {id:"18:6",  label:"18:6",   fast:18, desc:"Smaller eating window"},
  {id:"20:4",  label:"20:4",   fast:20, desc:"One large meal window"},
  {id:"omad",  label:"OMAD",   fast:23, desc:"One meal a day"},
  {id:"custom",label:"Custom", fast:0,  desc:"Set your own window"},
];

export const MUSCLE_COVERAGE = {
  Push:           "Chest: upper (incline) · mid (flat) · lower (decline)\nShoulders: ALL 3 — anterior (OHP, front raise) · lateral (DB lateral, cable) · posterior (face pull, reverse flye)\nTriceps: long (overhead ext) · lateral (pushdown) · medial (close-grip)",
  Pull:           "Lats: width (pulldown) + thickness (row)\nBiceps: long (incline curl) + short (preacher) + brachialis (hammer)\nRear Delts + Rhomboids + Mid/Lower Traps",
  Legs:           "Quads (squat/press/extensions) · Hamstrings hinge (RDL) + flexion (curl) · Glutes (hip thrust + abductions) · Calves: gastroc (standing) + soleus (seated)",
  Chest:          "Upper (incline) · Mid (flat) · Lower (decline/dips)",
  Back:           "Lats vertical (pulldown) + thickness (rows) · Mid Traps/Rhomboids · Erectors",
  Shoulders:      "Anterior (OHP, front raise) · Lateral (DB/cable lateral, upright row) · Posterior (face pull, reverse pec deck, bent-over lateral) · Rotator cuff",
  Arms:           "Biceps long + short + brachialis · Triceps long + lateral + medial",
  Upper:          "Chest + Shoulders (all 3 heads) + Back (lat + row) + Biceps + Triceps",
  Lower:          "Squat + Hinge + Hip thrust + Calves (both heads)",
  "Full Body":    "Squat · Hinge · Horizontal push · Horizontal pull · Core",
  "Chest & Back": "Chest (upper/mid/lower) superset with Back (lats + rows + rear delts)",
  "Shoulders & Arms":"Shoulders (all 3 heads) + Biceps (long+short+brachialis) + Triceps (all 3 heads)",
};

export const RUN_PLANS = {
  "5K Beginner":   {weeks:8,  desc:"Walk-to-run, 3 sessions/week"},
  "10K":           {weeks:10, desc:"Base fitness required, 3-4 sessions/week"},
  "Half Marathon": {weeks:14, desc:"Comfortable 10K required"},
  "Marathon":      {weeks:20, desc:"Regular running base required"},
  "Base Building": {weeks:0,  desc:"Open-ended zone 2 aerobic development"},
};

export const HYROX_STATIONS = ["SkiErg","Sled Push","Sled Pull","Burpee Broad Jumps","Rowing","Farmers Carry","Sandbag Lunges","Wall Balls"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function calcTDEE(p) {
  const wKg  = p.wUnit==="lbs" ? parseFloat(p.weight||180)*0.4536 : parseFloat(p.weight||80);
  const hCm  = p.hUnit==="ft"  ? (parseInt(p.hFt||5)*12+parseInt(p.hIn||10))*2.54 : parseFloat(p.hCm||178);
  const age  = Math.max(13, new Date().getFullYear()-parseInt(p.dobYear||2000));
  const male = p.sex==="male";
  const bfPct= p.bodyFat ? (p.bodyFat.startsWith("40")?42:parseInt(p.bodyFat)) : null;
  let bmr = bfPct ? 370+21.6*(wKg*(1-bfPct/100)) : 10*wKg+6.25*hCm-5*age+(male?5:-161);
  // Recalibrated — no phantom defaults, capped at Harris-Benedict max of 1.9x
  const jm = {desk:0,mix:.06,feet:.11,physical:.17}[p.job]??0;
  const sm = {"u3k":0,"3-6k":.03,"6-10k":.07,"10-15k":.11,"15k+":0.15}[p.steps]??0;
  const fm = {n0:0,"1-3":.08,"4-6":.14,"7+":.20}[p.freq]??0;
  const im = {light:.03,moderate:.06,hard:.10,extreme:.14}[p.intensity]??0;
  const am = {sedentary:0,moderate:.04,very:.09}[p.activity]??0;
  const fs = p.freq==="7+"?1:p.freq==="4-6"?.85:p.freq==="1-3"?.5:0;
  const tm = {strength:0,cardio:.03,hybrid:.05,hyrox:.07,metcon:.07,run:.04,sport:.03}[p.trainType]??0;
  let mult = Math.min(1.2+jm+sm+fm+(im*fs)+am+tm, 1.90);
  let tdee = bmr*mult;
  if(p.sleep==="u5")tdee*=0.93; else if(p.sleep==="5-6")tdee*=0.96;
  if(p.metHistory==="3plus")tdee*=0.90; else if(p.metHistory==="u3")tdee*=0.95;
  if((p.conditions||[]).includes("thyroid"))tdee*=0.82;
  if(p.protein==="high")tdee*=1.03;
  return { total:Math.round(tdee), bmr:Math.round(bmr), activity:Math.round(tdee-bmr-Math.round(tdee*0.08)), tef:Math.round(tdee*0.08) };
}

export function getDayMacros(baseCals, goal, dayType, earnedCals=0, opts={}) {
  const {weekendFlexMode=false,flexDays=["Sat","Sun"],flexCalorieIncrease=20,todayKey=""}=opts;
  const mult = {
    training:{Bulk:1.15,Cut:1.05,Maintain:1.10},
    cardio:  {Bulk:1.00,Cut:0.90,Maintain:0.95},
    run:     {Bulk:1.00,Cut:0.90,Maintain:0.95},
    hyrox:   {Bulk:1.05,Cut:0.95,Maintain:1.00},
    metcon:  {Bulk:1.05,Cut:0.95,Maintain:1.00},
    rest:    {Bulk:0.85,Cut:0.75,Maintain:0.85},
  };
  const splits = {
    training:{Bulk:[.45,.30,.25],Cut:[.35,.45,.20],Maintain:[.40,.35,.25]},
    cardio:  {Bulk:[.38,.35,.27],Cut:[.30,.45,.25],Maintain:[.35,.38,.27]},
    run:     {Bulk:[.38,.35,.27],Cut:[.30,.45,.25],Maintain:[.35,.38,.27]},
    hyrox:   {Bulk:[.42,.33,.25],Cut:[.32,.43,.25],Maintain:[.38,.37,.25]},
    metcon:  {Bulk:[.42,.33,.25],Cut:[.32,.43,.25],Maintain:[.38,.37,.25]},
    rest:    {Bulk:[.25,.45,.30],Cut:[.20,.50,.30],Maintain:[.25,.40,.35]},
  };
  const g=goal||"Maintain", dt=(dayType&&mult[dayType])?dayType:"rest";
  const baseDayCals=Math.round(baseCals*(mult[dt]?.[g]??1.0))+earnedCals;
  const [cp,pp,fp]=(splits[dt]?.[g])||[.40,.35,.25];
  if(!weekendFlexMode||!todayKey||!flexDays.length)
    return{calories:baseDayCals,protein:Math.round((baseDayCals*pp)/4),carbs:Math.round((baseDayCals*cp)/4),fat:Math.round((baseDayCals*fp)/9),isFlexDay:false};
  const isFlexDay=flexDays.includes(todayKey);
  const numFlex=flexDays.length;
  const numNonFlex=Math.max(1,7-numFlex);
  const flexPct=(flexCalorieIncrease||20)/100;
  const bonusPerFlexDay=Math.round(baseCals*flexPct);
  const dailyDeficit=Math.round((bonusPerFlexDay*numFlex)/numNonFlex);
  const normalProtein=Math.round((baseDayCals*pp)/4);
  const normalCarbs=Math.round((baseDayCals*cp)/4);
  const normalFat=Math.round((baseDayCals*fp)/9);
  if(isFlexDay){
    return{calories:baseDayCals+bonusPerFlexDay,protein:normalProtein,carbs:normalCarbs+Math.round((bonusPerFlexDay*0.60)/4),fat:normalFat+Math.round((bonusPerFlexDay*0.40)/9),isFlexDay:true,flexBonus:bonusPerFlexDay};
  }else{
    return{calories:Math.max(0,baseDayCals-dailyDeficit),protein:normalProtein,carbs:Math.max(0,normalCarbs-Math.round((dailyDeficit*0.60)/4)),fat:Math.max(0,normalFat-Math.round((dailyDeficit*0.40)/9)),isFlexDay:false,flexDeficit:dailyDeficit};
  }
}

export function getTodayKey() { return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()]; }
export function isToday(ds)    { if(!ds)return false; const d=new Date(ds),t=new Date(); return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate(); }
export function hap()          { try{navigator.vibrate?.(8);}catch{} }
export function hapMed()       { try{navigator.vibrate?.(15);}catch{} }
export function hapHeavy()     { try{navigator.vibrate?.([10,30,10]);}catch{} }
export function hapSuccess()   { try{navigator.vibrate?.([8,40,8]);}catch{} }
export function hapPR()        { try{navigator.vibrate?.([10,30,10,30,10]);}catch{} }

// ─── Scroll-reveal primitives (Train + Fuel share these) ─────────────────────

// Walk up the DOM to find the nearest element that actually scrolls (overflow auto/scroll).
// Passing this as IntersectionObserver root ensures the observer fires relative to what
// the user sees, not the browser viewport. Without the correct root, overflow-y:auto
// containers show every child as "intersecting" because all are within the viewport rect.
function findScrollParent(el) {
  let node = el?.parentElement;
  while (node && node !== document.documentElement) {
    const oy = window.getComputedStyle(node).overflowY;
    // Guard: overflow-y:auto/scroll in CSS is necessary but not sufficient.
    // .app-screen has overflow-y:auto but min-height:100% with no fixed height —
    // the window scrolls instead. Only treat a node as the real scroll parent if
    // its content actually overflows it (scrollHeight > clientHeight).
    if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null; // null → viewport (window is the real scroller)
}

export function PaperCard({ children, style = {}, className = '', animate = false, reveal = false, revealDelay = 0 }) {
  const ref = useRef(null);
  // Read once at mount — matchMedia is live on device; false if user has Reduce Motion OFF (normal case)
  const prefersReduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // 'pending-below' = below viewport (initial), 'pending-above' = above viewport, 'revealed' = in view.
  // Reduced-motion or no reveal prop → always 'revealed' (fully visible, no animation).
  const [revealState, setRevealState] = useState(!reveal || prefersReduced ? 'revealed' : 'pending-below');

  useEffect(() => {
    if (!reveal || prefersReduced || !ref.current) return;
    const el = ref.current;
    // Use the real scroll container as root so off-screen cards stay pending.
    const root = findScrollParent(el);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealState('revealed');
        } else {
          // Determine which edge the element exited through so the next entry
          // animates from the correct direction.
          const rb = entry.rootBounds;
          if (rb && entry.boundingClientRect.top >= rb.bottom - 1) {
            // Element is below the viewport bottom → will rise up on re-entry
            setRevealState('pending-below');
          } else {
            // Element is above the viewport top → will descend on re-entry
            setRevealState('pending-above');
          }
        }
        // No unobserve — stays active so every entry/exit toggles state.
      },
      { root, threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // deps intentionally empty — root/reveal don't change after mount

  const revealClass = reveal ? ` cm-reveal-base cm-${revealState}` : '';
  const delayStyle = reveal && revealDelay > 0 ? { transitionDelay: `${revealDelay}ms` } : {};

  return (
    <div
      ref={ref}
      className={`cm-paper-card${animate ? ' cm-card-enter' : ''}${revealClass}${className ? ' '+className : ''}`}
      style={{ ...delayStyle, ...style }}
    >
      {children}
    </div>
  );
}

export function Pill({ label, bg, color = 'var(--cm-ink,#0A0A0A)', style: sx = {} }) {
  return (
    <span className="cm-pill" style={{ background: bg, color, ...sx }}>
      {label}
    </span>
  );
}
export function pad2(n)        { return String(Math.max(0,Math.floor(n))).padStart(2,"0"); }
export function autoFocus(sch,splitType,longRunDay) {
  const cycles=SPLIT_CYCLES[splitType]||["Full Body"]; const f={}; let i=0;
  WDAYS.forEach(d=>{
    if(sch[d]==="training")f[d]=cycles[i++%cycles.length];
    else if(["cardio","run","hyrox"].includes(sch[d])){
      f[d]=(longRunDay&&d===longRunDay&&(sch[d]==='run'||sch[d]==='cardio'))?"Long Run":(DAY_CFG[sch[d]]||DAY_CFG.rest).label;
    }else f[d]="Rest";
  });
  return f;
}

async function ai(prompt, max=900) {
  const r = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:max, messages:[{role:"user",content:prompt}] }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

export async function lookupBarcode(barcode) {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const d = await r.json();
    if(d.status!==1||!d.product) return null;
    const p=d.product, n=p.nutriments||{};
    return { name:p.product_name||"Unknown", brand:p.brands||"", serving:p.serving_size||"100g",
      calories:Math.round(n["energy-kcal_serving"]||n["energy-kcal_100g"]||0),
      protein:Math.round((n.proteins_serving||n.proteins_100g||0)*10)/10,
      carbs:Math.round((n.carbohydrates_serving||n.carbohydrates_100g||0)*10)/10,
      fat:Math.round((n.fat_serving||n.fat_100g||0)*10)/10 };
  } catch { return null; }
}

export function useCountUp(target, dur=1400) {
  const [v,setV]=useState(0);
  useEffect(()=>{ let s=null; const t=(now)=>{ if(!s)s=now; const p=Math.min((now-s)/dur,1); setV(Math.round((1-Math.pow(1-p,3))*target)); if(p<1)requestAnimationFrame(t);}; const id=requestAnimationFrame(t); return()=>cancelAnimationFrame(id); },[target]);
  return v;
}

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Archivo:wght@400;600;700;800&display=swap');
  :root {
    --accent: #FF3B30;
    --accent-rgb: 255,59,48;
    --bg: #000000;
    --bg-rgb: 0,0,0;
    --card-bg: #0d0d0d;
    --text: #f5f5f0;
    --text-rgb: 245,245,240;
    --text-dim: rgba(245,245,240,0.65);
    --text-faint: rgba(245,245,240,0.40);
    --text-ghost: rgba(245,245,240,0.20);
    --card-border: rgba(245,245,240,0.07);
    --navy: var(--bg);
    --navy-mid: var(--card-bg);
    --navy-light: var(--card-bg);
    --navy-card: var(--card-bg);
    --red: var(--accent);
    --red-dim: #c42d18;
    --green: #22c55e;
    --blue: #60a5fa;
    --amber: #f59e0b;
    --white: var(--text);
    --white-dim: var(--text-dim);
    --white-faint: var(--text-faint);
    --white-border: rgba(var(--accent-rgb),0.08);
    --recovery: #7E57C2;
    --recovery-hover: #673AB7;
    --recovery-bg: rgba(126,87,194,0.12);
    --gold: #FFD700;
    --gold-deep: #FFA000;
    --gold-bg: rgba(255,215,0,0.12);
    --surface-1: var(--card-bg);
    --surface-2: var(--card-bg);
    --surface-3: var(--card-bg);
    --border-subtle: rgba(245,245,240,0.06);
    --border-medium: rgba(245,245,240,0.12);
    --border-strong: rgba(245,245,240,0.20);
    --chart-optimal: #4ECDC4;
    --chart-caution: #FF9F43;
    --chart-danger: #FF5252;
    --chart-neutral: #607D8B;
    --mono: 'DM Mono', monospace;
    --condensed: 'Barlow Condensed', sans-serif;
    --body: 'Barlow', sans-serif;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#root{height:100%}
  button,a,[role=button]{min-height:44px;min-width:44px}
  @media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
  body{font-family:var(--body);color:var(--white);-webkit-font-smoothing:antialiased;background:var(--bg);background-image:radial-gradient(ellipse at 30% 20%,rgba(var(--accent-rgb),0.06),transparent 50%)}
  .grid-bg{background-image:linear-gradient(rgba(245,245,240,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(245,245,240,0.022) 1px,transparent 1px);background-size:32px 32px}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:rgba(245,245,240,0.12);border-radius:2px}
  ::-webkit-scrollbar-thumb:hover{background:rgba(245,245,240,0.2)}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
  @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes glowPulse{0%,100%{opacity:.3}50%{opacity:.7}}
  @keyframes fabPulse{0%,100%{box-shadow:0 12px 32px rgba(var(--accent-rgb),0.5)}50%{box-shadow:0 12px 48px rgba(var(--accent-rgb),0.75)}}
  @keyframes page-fade{0%{opacity:0.4;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes modal-in{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes sheet-in{0%{transform:translateY(100%)}100%{transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes pulse-dot{0%,100%{opacity:0.3}50%{opacity:1}}
  @keyframes scan-line{0%,100%{transform:translateY(0)}50%{transform:translateY(160px)}}
  @keyframes splash-logo{0%{opacity:0;transform:scale(0.88)}100%{opacity:1;transform:scale(1)}}
  @keyframes toast-in{0%{opacity:0;transform:translateY(16px) scale(0.96)}100%{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes toast-out{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(8px) scale(0.97)}}
  @keyframes press-scale{0%{transform:scale(1)}50%{transform:scale(0.96)}100%{transform:scale(1)}}
  @keyframes scale-in{0%{opacity:0;transform:scale(0.82)}100%{opacity:1;transform:scale(1)}}
  @keyframes slide-up-enter{0%{opacity:0;transform:translateY(28px)}100%{opacity:1;transform:translateY(0)}}
  @keyframes bounce-in{0%{transform:scale(0)}40%{transform:scale(1.12)}60%{transform:scale(0.94)}80%{transform:scale(1.04)}100%{transform:scale(1)}}
  @keyframes count-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .skeleton{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite linear;border-radius:8px;flex-shrink:0}
  .stagger-0{animation-delay:0ms}.stagger-1{animation-delay:60ms}.stagger-2{animation-delay:120ms}.stagger-3{animation-delay:180ms}.stagger-4{animation-delay:240ms}.stagger-5{animation-delay:300ms}.stagger-6{animation-delay:360ms}.stagger-7{animation-delay:420ms}.stagger-8{animation-delay:480ms}
  .fade-up{opacity:0;animation:page-fade 0.3s cubic-bezier(.2,.7,.3,1) forwards}
  .scale-in{animation:scale-in 0.24s cubic-bezier(.2,.7,.3,1) forwards}
  .slide-up{animation:slide-up-enter 0.32s cubic-bezier(.2,.7,.3,1) forwards}
  .bounce-in{animation:bounce-in 0.5s cubic-bezier(.2,.7,.3,1) forwards}
  .btn-press:active{transform:scale(0.96);transition:transform 0.08s ease}
  .card-press{transition:transform 0.1s ease,box-shadow 0.1s ease}
  .card-press:active{transform:scale(0.98);}
  .swipe-row{transition:transform 0.2s ease;touch-action:pan-y}
  .grad-text{background:linear-gradient(135deg,var(--accent) 0%,#ff8c42 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .hero-title{animation:slideUp .9s cubic-bezier(.16,1,.3,1) forwards}
  .hero-sub{animation:slideUp .9s cubic-bezier(.16,1,.3,1) .15s both}
  .hero-cta{animation:slideUp .9s cubic-bezier(.16,1,.3,1) .3s both}
  .phone-float{animation:floatUp 4s ease-in-out infinite}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
  .reveal.visible{opacity:1;transform:translateY(0)}
  .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
  @media(max-width:768px){.desk-only{display:none!important}}
  @media(min-width:769px){.mob-only{display:none!important}}
  .page-enter{animation:page-fade 0.28s cubic-bezier(.2,.7,.3,1) forwards}
  .screen-header{padding:14px 20px 14px;display:flex;align-items:flex-end;justify-content:space-between;gap:12px}
  .header-eyebrow{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:0.16em;color:var(--red);text-transform:uppercase;margin-bottom:8px}
  .header-title{font-family:var(--condensed);font-style:italic;font-weight:900;font-size:34px;letter-spacing:-0.01em;text-transform:uppercase;line-height:0.92;color:var(--white)}
  .icon-btn{width:36px;height:36px;border-radius:10px;background:rgba(245,245,240,0.06);border:1px solid rgba(245,245,240,0.08);display:flex;align-items:center;justify-content:center;color:var(--white);cursor:pointer}
  .section-title{font-family:var(--condensed);font-weight:800;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--white-dim);margin:18px 20px 10px}
  .hero-card{background:linear-gradient(135deg,rgba(var(--accent-rgb),0.18) 0%,rgba(var(--accent-rgb),0.08) 30%,#0d0d0d 100%);border:1px solid rgba(var(--accent-rgb),0.15);border-radius:16px;position:relative;overflow:hidden}
  .hero-card::before{content:'';position:absolute;top:0;right:0;width:200px;height:200px;background:radial-gradient(circle at top right,rgba(var(--accent-rgb),0.12),transparent 70%);pointer-events:none}
  .coach-card{margin:0 20px 14px;padding:14px 16px;background:#0d0d0d;border-left:3px solid var(--red);border-radius:4px 14px 14px 4px}
  .coach-label{font-family:var(--mono);font-size:9px;letter-spacing:0.16em;color:var(--red);text-transform:uppercase;margin-bottom:6px}
  .coach-text{font-family:var(--body);font-size:13.5px;line-height:1.5;color:var(--white);font-style:italic}
  .quick-btn{width:100%;padding:13px 16px;background:#0d0d0d;border:1px solid rgba(var(--accent-rgb),0.1);border-radius:12px;color:var(--white);font-family:var(--condensed);font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;display:flex;align-items:center;gap:12px}
  .quick-btn:hover{border-color:rgba(var(--accent-rgb),0.3)}
  .toggle{width:44px;height:26px;background:rgba(245,245,240,0.1);border-radius:13px;position:relative;cursor:pointer;transition:background 0.2s;flex-shrink:0}
  .toggle.on{background:var(--red)}
  .toggle-knob{position:absolute;top:2px;left:2px;width:22px;height:22px;background:var(--white);border-radius:50%;transition:left 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.3)}
  .toggle.on .toggle-knob{left:20px}
  .app-screen{position:relative;min-height:100%;overflow-y:auto;overflow-x:hidden;padding-top:max(54px,calc(env(safe-area-inset-top) + 48px));padding-bottom:100px;background:#000000;scrollbar-width:none;touch-action:pan-y}
  .app-screen::-webkit-scrollbar{display:none}
  .app-tab-bar{position:fixed;bottom:0;left:0;right:0;z-index:100;background:rgba(0,0,0,0.85);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border-top:1px solid rgba(var(--accent-rgb),0.08);display:flex;padding:8px 8px max(22px,env(safe-area-inset-bottom))}
  .ob-page{min-height:100vh;background:#000000;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .ob-inner{width:100%;max-width:480px;margin:0 auto;padding:max(env(safe-area-inset-top,0px),20px) 20px 60px}
  .rolodex-scroll::-webkit-scrollbar{display:none}
  @media(min-width:768px){.app-tab-bar{max-width:480px;left:50%;transform:translateX(-50%)}}
  .app-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;color:var(--white-faint);cursor:pointer;padding:8px 4px;transition:color 0.2s,transform 0.1s;position:relative}
  .app-tab:active{transform:scale(0.88)}
  .app-tab.active{color:var(--white)}
  .app-tab.active .tab-icon-wrap::before{content:'';position:absolute;inset:-8px -14px;background:radial-gradient(circle,rgba(var(--accent-rgb),0.25),transparent 70%);z-index:-1}
  .tab-icon-wrap{position:relative}
  .tab-label-txt{font-family:var(--mono);font-size:9px;letter-spacing:0.1em;text-transform:uppercase}
  .app-tab.active .tab-label-txt{color:var(--red)}
  .grid-bg{background-image:linear-gradient(rgba(245,245,240,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(245,245,240,0.022) 1px,transparent 1px);background-size:32px 32px}
  .full-modal{position:fixed;inset:0;z-index:200;background:#000000;animation:modal-in 0.32s cubic-bezier(.2,.7,.3,1) both;display:flex;flex-direction:column;overflow-y:auto}
  @media(min-width:768px){.full-modal{max-width:480px;left:50%;right:auto;transform:translateX(-50%)}}
  .bottom-sheet-overlay{position:fixed;inset:0;z-index:200}
  .bottom-sheet{position:absolute;bottom:0;left:0;right:0;background:#0d0d0d;border-radius:24px 24px 0 0;max-height:82%;overflow-y:auto;animation:sheet-in 0.32s cubic-bezier(.2,.7,.3,1);padding-bottom:24px}
  @media(min-width:768px){.bottom-sheet{max-width:480px;left:50%;right:auto;transform:translateX(-50%)}}
`;

export const NEW_ONBOARDING  = false;
export const GOCLUB_REDESIGN = true;
export const SHOW_DEBUG      = true;  // flip false to hide overlay
export const REDESIGN_CSS = `
  .goclub {
    --cm-bg:         #ffffff;
    --cm-surface:    #f5f5f5;
    --cm-text:       #111111;
    --cm-text-dim:   rgba(17,17,17,0.65);
    --cm-muted:      rgba(17,17,17,0.42);
    --cm-accent:     #FF3B30;
    --cm-accent-rgb: 255,59,48;
    --cm-border:     rgba(17,17,17,0.10);
    --cm-nav-track:  rgba(255,255,255,0.05);

    /* ── Canonical swappable palette ── edit these 6 vars to retheme: */
    --cm-red:        #FF3B30;
    --cm-red-rgb:    255,59,48;
    --cm-paper:      #FFFFFF;
    --cm-paper-rgb:  255,255,255;
    --cm-ink:        #0A0A0A;
    --cm-ink-rgb:    10,10,10;

    font-family: 'Archivo', sans-serif;
  }

  /* Per-tab nav track colour */
  .goclub.tab-today                              { --cm-nav-track: #F4F4F6; }
  .goclub.tab-train,.goclub.tab-fuel,
  .goclub.tab-me,.goclub.tab-progress,
  .goclub.tab-plan                               { --cm-nav-track: rgba(255,255,255,0.05); }

  /* Nav bar */
  .goclub .app-tab-bar {
    background: var(--cm-nav-track);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-top: none;
    gap: 4px;
    padding: 8px max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));
  }

  /* Inactive tab colour — white today surface = ink 40%, dark surfaces = white 40% */
  .goclub .app-tab                { color: rgba(0,0,0,0.40); border-radius: 24px; padding: 8px 12px; transition: background 0.2s,color 0.2s; }
  .goclub.tab-train .app-tab,
  .goclub.tab-fuel  .app-tab,
  .goclub.tab-me    .app-tab,
  .goclub.tab-progress .app-tab,
  .goclub.tab-plan  .app-tab      { color: rgba(255,255,255,0.40); }

  /* Active tab — red pill */
  .goclub .app-tab.active                          { background: var(--cm-accent); color: #ffffff; }
  .goclub .app-tab.active .tab-icon-wrap::before   { display: none; }

  /* Label: hidden inactive, visible active */
  .goclub .tab-label-txt                           { display: none; }
  .goclub .app-tab.active .tab-label-txt           { display: block; font-size: 10px; letter-spacing: 0.06em; }

  /* Emphasized center Plan tab (3-tab onboarding state) */
  .goclub .app-tab--plan { background: var(--cm-accent); color: #ffffff; padding: 10px 20px; flex: 1.4; }

  /* Muted text */
  .cm-muted          { color: rgba(17,17,17,0.42); }
  .goclub .cm-muted  { color: rgba(255,255,255,0.40); }

  /* Phase 3 — Today red field */
  .goclub.tab-today .app-screen { background: var(--cm-accent) !important; }

  /* Train tab — full-bleed red field, matches Today's treatment */
  .goclub.tab-train .app-screen { background: var(--cm-red) !important; }

  /* ── Reusable primitives (Train + Fuel can share these) ── */

  /* Floating paper card — all-corner rounded, soft shadow, lifts off red */
  .cm-paper-card {
    background: var(--cm-paper);
    border-radius: 28px;
    box-shadow:
      0 8px 40px rgba(0,0,0,0.22),
      0 2px 8px  rgba(0,0,0,0.10);
    will-change: transform;
  }

  /* Pill label — bold uppercase, tokenized color via inline style */
  .cm-pill {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
    padding: 5px 12px;
    white-space: nowrap;
  }

  /* Paper-card section eyebrow */
  .cm-card-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(var(--cm-ink-rgb,10,10,10),0.38);
    margin-bottom: 14px;
  }

  /* 60fps card slide-in for paper cards on scroll-reveal surfaces */
  @keyframes cm-card-in {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .cm-card-enter { animation: cm-card-in 0.44s cubic-bezier(.2,.7,.3,1) forwards; }

  /* Scroll-reveal — bidirectional, direction-aware */
  /* Persistent base class: always present when reveal=true; transition lives HERE so
     both the enter (reveal) and the exit (re-hide) animate. */
  .cm-reveal-base {
    will-change: opacity, transform;
    transition: opacity 0.32s cubic-bezier(.22,.61,.36,1), transform 0.32s cubic-bezier(.22,.61,.36,1);
  }
  /* Off-screen below (initial state + after exiting bottom) → will RISE up */
  .cm-pending-below {
    opacity: 0;
    transform: translateY(20px);
  }
  /* Off-screen above (after exiting top) → will DESCEND down */
  .cm-pending-above {
    opacity: 0;
    transform: translateY(-20px);
  }
  /* In-viewport */
  .cm-revealed {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .cm-card-enter { animation: none; }
    .cm-reveal-base { transition: none; will-change: auto; }
    .cm-pending-below,
    .cm-pending-above { transform: none; opacity: 1; }
  }

  /* Bar grow (transform-origin:bottom set inline) */
  @keyframes cm-bar-up {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }

  /* White card slide-up */
  @keyframes cm-slide-up {
    from { transform: translateY(52px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .goclub-card-enter { animation: cm-slide-up 0.42s cubic-bezier(.2,.7,.3,1) forwards; }

  /* Soreness range slider — on-brand thumb, immediate drag (touch-action:none) */
  .cm-soreness-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(17,17,17,0.12);
    outline: none;
    cursor: pointer;
    touch-action: none;
    display: block;
  }
  .cm-soreness-range::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: rgba(17,17,17,0.12);
  }
  .cm-soreness-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #FF3B30;
    cursor: pointer;
    margin-top: -11px;
    box-shadow: 0 2px 8px rgba(255,59,48,0.35);
    border: none;
  }
  .cm-soreness-range::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #FF3B30;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(255,59,48,0.35);
  }

  @media (prefers-reduced-motion: reduce) {
    .goclub .app-tab          { transition: none; }
    .goclub-card-enter        { animation: none; }
    @keyframes cm-bar-up      { from {} to {} }
  }

  /* Plan tab — full-screen onboarding; give app-screen a definite height so flex children fill it */
  .goclub.tab-plan .app-screen {
    height: 100dvh;
    padding: 0 !important;
    overflow: hidden;
  }
`;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

export function Ring({value,max,color,size=140,sw=11}) {
  const r=(size-sw)/2, circ=2*Math.PI*r, pct=Math.min(Math.max(value/max,0),1);
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(245,245,240,0.08)" strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
        style={{transition:"stroke-dashoffset 0.6s ease"}}/>
    </svg>
  );
}

export function MacroRing({protein,carbs,fat,pTarget,cTarget,fTarget,size=200,sw=16}) {
  const total=pTarget+cTarget+fTarget;
  if(!total) return null;
  const circ=2*Math.PI*((size-sw)/2);
  const pArc=circ*(pTarget/total), cArc=circ*(cTarget/total), fArc=circ*(fTarget/total);
  const pFill=circ*(Math.min(protein/pTarget,1)*(pTarget/total));
  const cFill=circ*(Math.min(carbs/cTarget,1)*(cTarget/total));
  const fFill=circ*(Math.min(fat/fTarget,1)*(fTarget/total));
  const r=(size-sw)/2;
  return (
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.s3} strokeWidth={sw}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.prot} strokeWidth={sw}
        strokeDasharray={`${pFill} ${circ-pFill}`} strokeDashoffset={0} strokeLinecap="round"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.carb} strokeWidth={sw}
        strokeDasharray={`${cFill} ${circ-cFill}`} strokeDashoffset={-(pArc)} strokeLinecap="round"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.fat} strokeWidth={sw}
        strokeDasharray={`${fFill} ${circ-fFill}`} strokeDashoffset={-(pArc+cArc)} strokeLinecap="round"/>
    </svg>
  );
}

export function MacroBar({label,consumed,target,color}) {
  const pct=Math.min(consumed/(target||1),1), rem=Math.max(0,target-consumed);
  const pctInt=Math.round(pct*100);
  return (
    <div style={{background:T.s2,borderRadius:14,padding:"12px 14px",marginBottom:8,border:`1px solid ${T.bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
        <div>
          <div style={{color,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"var(--mono)",marginBottom:3}}>{label}</div>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,lineHeight:1,color:pct>=1?color:"#fff"}}>{consumed}<span style={{fontSize:10,color:T.mu,fontWeight:400,fontStyle:"normal",marginLeft:2}}>g</span></div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:pct>=1?color:T.mu,fontWeight:700}}>{pct>=1?"✓ Hit":`${rem}g left`}</div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.3)",marginTop:2}}>of {target}g</div>
        </div>
      </div>
      <div style={{height:5,background:"rgba(245,245,240,0.07)",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pctInt}%`,background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:3,transition:"width 0.5s cubic-bezier(.2,.7,.3,1)"}}/>
      </div>
    </div>
  );
}

export function Toggle({on,onChange,label,sub}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${T.bd}`}}>
      <div><div style={{fontSize:14,color:on?T.white:T.mu,fontFamily:"'Barlow',sans-serif"}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.mu,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{sub}</div>}</div>
      <div onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:12,background:on?T.prot:"rgba(245,245,240,0.15)",cursor:"pointer",display:"flex",alignItems:"center",padding:"0 3px",justifyContent:on?"flex-end":"flex-start",transition:"background 0.2s",boxSizing:"border-box",flexShrink:0,marginLeft:16}}>
        <div style={{width:18,height:18,borderRadius:9,background:"#fff"}}/>
      </div>
    </div>
  );
}

export function CC({label,sub,sel,onClick,icon,accent=T.prot}) {
  return (
    <div onClick={onClick} style={{background:sel?`${accent}15`:T.s2,border:`1.5px solid ${sel?accent:T.bd}`,borderRadius:14,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"border-color 0.15s"}}>
      {icon&&<div style={{fontSize:18,flexShrink:0}}>{icon}</div>}
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:sel?accent:T.white,fontFamily:"'Barlow',sans-serif"}}>{label}</div>{sub&&<div style={{fontSize:12,color:T.mu,marginTop:2,lineHeight:1.5,fontFamily:"'Barlow',sans-serif"}}>{sub}</div>}</div>
      <div style={{width:18,height:18,borderRadius:9,border:`2px solid ${sel?accent:T.bd}`,background:sel?accent:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {sel&&<div style={{width:7,height:7,borderRadius:4,background:"#fff"}}/>}
      </div>
    </div>
  );
}

export function PrimaryBtn({onClick,label,disabled,style:sx={}}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{width:"100%",padding:"15px",background:disabled?T.s3:T.prot,color:disabled?T.mu:T.white,fontWeight:700,fontSize:16,letterSpacing:1,border:"none",borderRadius:14,cursor:disabled?"default":"pointer",textTransform:"uppercase",fontFamily:"'Barlow Condensed',sans-serif",transition:"opacity 0.2s",opacity:disabled?0.5:1,...sx}}>
      {label}
    </button>
  );
}

export function UnitToggle({opts,val,onChange}) {
  return (
    <div style={{display:"flex",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:3,marginBottom:18,width:"fit-content"}}>
      {opts.map(o=>(
        <button key={o.val} onClick={()=>onChange(o.val)} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:val===o.val?T.prot:"none",color:val===o.val?T.white:T.mu,fontWeight:700,fontSize:13,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:0.5,textTransform:"uppercase",transition:"all 0.2s"}}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Rolodex({items,sel,onChange,itemH=56}) {
  const ref=useRef(null),timer=useRef(null),inited=useRef(false);
  const [li,setLi]=useState(Math.max(0,items.indexOf(String(sel))));
  useEffect(()=>{ if(!ref.current||inited.current)return; ref.current.scrollTop=li*itemH; inited.current=true; },[]);
  const onScr=()=>{
    if(!ref.current)return;
    const ni=Math.round(ref.current.scrollTop/itemH); setLi(Math.max(0,Math.min(items.length-1,ni)));
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>{ if(!ref.current)return; const fi=Math.round(ref.current.scrollTop/itemH); const cl=Math.max(0,Math.min(items.length-1,fi)); if(items[cl]!==String(sel)){hap();onChange(items[cl]);} },70);
  };
  return (
    <div style={{position:"relative",height:itemH*3,overflow:"hidden",flex:1,minWidth:52}}>
      <div ref={ref} onScroll={onScr} className="rolodex-scroll" style={{height:"100%",overflowY:"scroll",scrollSnapType:"y mandatory",scrollbarWidth:"none"}}>
        <div style={{height:itemH}}/>
        {items.map((item,i)=>{ const d=Math.abs(i-li); return(
          <div key={i} onClick={()=>{onChange(item);ref.current?.scrollTo({top:i*itemH,behavior:"smooth"});hap();}}
            style={{height:itemH,display:"flex",alignItems:"center",justifyContent:"center",scrollSnapAlign:"center",
              fontSize:i===li?22:d===1?17:13,fontWeight:i===li?800:400,
              color:i===li?T.white:d===1?"rgba(245,245,240,0.25)":"rgba(245,245,240,0.08)",transition:"all 0.08s",fontVariantNumeric:"tabular-nums",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>
            {item}
          </div>
        );})}<div style={{height:itemH}}/>
      </div>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(${T.bg} 12%,transparent 36%,transparent 64%,${T.bg} 88%)`,pointerEvents:"none",zIndex:2}}/>
      <div style={{position:"absolute",top:itemH,left:4,right:4,height:itemH,borderTop:`1px solid rgba(var(--accent-rgb),0.35)`,borderBottom:`1px solid rgba(var(--accent-rgb),0.35)`,pointerEvents:"none",zIndex:1}}/>
    </div>
  );
}

export function SectionCard({title,children,action}) {
  return (
    <div style={{background:T.s1,borderRadius:18,border:`1px solid ${T.bd}`,overflow:"hidden",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.bd}`}}>
        <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif"}}>{title}</div>
        {action}
      </div>
      <div style={{padding:"16px 20px"}}>{children}</div>
    </div>
  );
}

export function Spinner() {
  return <div style={{width:20,height:20,border:`2px solid ${T.bd}`,borderTopColor:T.prot,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;
}

export function SkeletonBox({w="100%",h=16,radius=8,style={}}) {
  return <div className="skeleton" style={{width:w,height:h,borderRadius:radius,...style}}/>;
}

export function FoodSearchSkeleton() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {[0,1,2,3,4,5].map(i=>(
        <div key={i} className={`stagger-${i}`} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.bd}`,opacity:0,animation:`page-fade 0.3s ease forwards`}}>
          <SkeletonBox w={40} h={40} radius={10}/>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
            <SkeletonBox w="70%" h={13}/>
            <SkeletonBox w="45%" h={11}/>
          </div>
          <SkeletonBox w={50} h={13} radius={6}/>
        </div>
      ))}
    </div>
  );
}

export function AIContentSkeleton() {
  const widths=["90%","75%","85%","60%","80%","55%"];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10,padding:"8px 0"}}>
      {widths.map((w,i)=>(
        <div key={i} className={`stagger-${i}`} style={{opacity:0,animation:`page-fade 0.3s ease forwards`}}>
          <SkeletonBox w={w} h={14}/>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({icon="📭",title,subtitle,actionLabel,onAction}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px 24px",gap:12,textAlign:"center"}}>
      <div style={{fontSize:40,lineHeight:1}}>{icon}</div>
      <div style={{fontSize:17,fontWeight:700,color:T.txt}}>{title}</div>
      {subtitle && <div style={{fontSize:14,color:"rgba(245,245,240,0.5)",maxWidth:280}}>{subtitle}</div>}
      {actionLabel && onAction && (
        <button className="btn-press" onClick={onAction} style={{marginTop:8,padding:"10px 24px",background:T.prot,border:"none",borderRadius:24,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>{actionLabel}</button>
      )}
    </div>
  );
}

export function InfoTip({title,content}) {
  const [open,setOpen]=React.useState(false);
  return (
    <>
      <button onClick={()=>{hap();setOpen(true);}} style={{background:"none",border:"1px solid rgba(var(--accent-rgb),0.2)",borderRadius:"50%",width:18,height:18,color:"rgba(245,245,240,0.45)",fontSize:10,fontWeight:700,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>?</button>
      {open && (
        <div style={{position:"fixed",inset:0,zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.65)"}} onClick={()=>setOpen(false)}>
          <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:20,padding:"24px 20px",maxWidth:320,width:"90%",animation:"toast-in 0.22s cubic-bezier(.2,.7,.3,1) forwards"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:15,fontWeight:800,color:"#f5f5f0",marginBottom:10}}>{title}</div>
            <div style={{fontSize:14,color:"rgba(245,245,240,0.7)",lineHeight:1.6}}>{content}</div>
            <button onClick={()=>setOpen(false)} style={{marginTop:16,width:"100%",padding:"10px",background:T.bd,border:"none",borderRadius:12,color:T.txt,fontSize:14,fontWeight:600,cursor:"pointer"}}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return {hasError:true,error};}
  componentDidCatch(error,info){
    console.error("[ErrorBoundary] CAUGHT:",error?.message);
    console.error("[ErrorBoundary] STACK:",error?.stack);
    console.error("[ErrorBoundary] COMPONENT:",info?.componentStack);
    window.__debugPush?.(`EB: ${error?.message} | ${String(info?.componentStack||'').slice(0,120)}`);
  }
  render(){
    if(this.state.hasError){
      const e=this.state.error;
      return (
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:8,padding:"24px",background:"#0a0a0a",minHeight:200}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--accent)",fontFamily:"monospace"}}>COMPONENT CRASH</div>
          <div style={{fontSize:12,color:"#f5f5f0",fontFamily:"monospace",wordBreak:"break-all"}}>{e?.message||"unknown error"}</div>
          <div style={{fontSize:10,color:"rgba(245,245,240,0.5)",fontFamily:"monospace",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{String(e?.stack||"").slice(0,400)}</div>
          <button onClick={()=>this.setState({hasError:false,error:null})} style={{padding:"8px 20px",background:T.prot,border:"none",borderRadius:20,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",marginTop:8}}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function DashboardSkeleton() {
  return (
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}><SkeletonBox w={120} h={12}/><SkeletonBox w={180} h={24}/></div>
        <SkeletonBox w={36} h={36} radius={18}/>
      </div>
      <SkeletonBox w="100%" h={80} radius={14}/>
      <SkeletonBox w="100%" h={140} radius={20}/>
      <div style={{display:"flex",gap:8}}>{[0,1,2,3,4,5,6].map(i=><SkeletonBox key={i} w={36} h={36} radius={18}/>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>{[0,1,2].map(i=><SkeletonBox key={i} h={80} radius={16}/>)}</div>
    </div>
  );
}

export function WorkoutSkeleton() {
  return (
    <div style={{padding:"0 20px",display:"flex",flexDirection:"column",gap:12}}>
      <SkeletonBox w="70%" h={28} radius={8}/>
      <SkeletonBox w="100%" h={80} radius={20}/>
      {[0,1,2,3,4].map(i=>(
        <div key={i} className={`stagger-${Math.min(i,5)}`} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.05)",opacity:0,animation:"page-fade 0.3s ease forwards"}}>
          <SkeletonBox w={32} h={32} radius={16}/>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><SkeletonBox w="60%" h={16}/><SkeletonBox w="40%" h={12}/></div>
          <SkeletonBox w={60} h={28} radius={8}/>
        </div>
      ))}
    </div>
  );
}

export function FuelSkeleton() {
  return (
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:16}}>
      <SkeletonBox w="100%" h={160} radius={20}/>
      <SkeletonBox w="50%" h={20}/>
      {[0,1,2].map(i=>(
        <div key={i} style={{display:"flex",flexDirection:"column",gap:8}}>
          <SkeletonBox w="30%" h={14}/>
          <SkeletonBox w="100%" h={44} radius={10}/>
        </div>
      ))}
    </div>
  );
}

export function ProgressSkeleton() {
  return (
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:16}}>
      <SkeletonBox w="100%" h={180} radius={20}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><SkeletonBox h={100} radius={20}/><SkeletonBox h={100} radius={20}/></div>
      <SkeletonBox w="100%" h={200} radius={20}/>
    </div>
  );
}

export function ExerciseSkeleton() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {[0,1,2,3,4].map(i=>(
        <div key={i} className={`stagger-${Math.min(i,5)}`} style={{display:"flex",gap:12,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:14,opacity:0,animation:"page-fade 0.3s ease forwards"}}>
          <SkeletonBox w={32} h={32} radius={16}/>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><SkeletonBox w="55%" h={16}/><SkeletonBox w="35%" h={12}/></div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}><SkeletonBox w={50} h={14}/><SkeletonBox w={50} h={14}/></div>
        </div>
      ))}
    </div>
  );
}

export function ScoreSkeleton() {
  return (
    <div style={{padding:16,display:"flex",flexDirection:"column",gap:16,alignItems:"center"}}>
      <SkeletonBox w={160} h={160} radius={80}/>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
            <SkeletonBox w="30%" h={14}/>
            <SkeletonBox h={8} radius={4} style={{flex:1}}/>
            <SkeletonBox w={30} h={14}/>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div style={{padding:16,display:"flex",flexDirection:"column",gap:8}}>
      <SkeletonBox w="40%" h={20}/>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {Array.from({length:35}).map((_,i)=><SkeletonBox key={i} w={40} h={40} radius={8}/>)}
      </div>
    </div>
  );
}

export function CardSkeleton({height=120}) {
  return <SkeletonBox w="100%" h={height} radius={20}/>;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
export function Logo({size=32, text=true, textColor="#fff"}) {
  // Icon: 3 ascending bars — perfect golden ratio proportions
  // Heights: 40%, 65%, 100% of total height
  // Width: each bar = 28% of icon width, gap = 8%
  // Corners: 3px radius — premium, not harsh
  const h = size;
  const bw = h * 0.28;       // bar width
  const gap = h * 0.09;      // gap between bars
  const r = h * 0.1;         // corner radius
  const iw = bw*3 + gap*2;   // total icon width

  // Bar heights — ascending left to right
  const h1 = h * 0.42;   // protein bar — shortest
  const h2 = h * 0.68;   // carbs bar — mid
  const h3 = h * 1.00;   // fat/energy bar — tallest

  // Y positions (bars sit on bottom baseline)
  const y1 = h - h1;
  const y2 = h - h2;
  const y3 = h - h3;

  // Colors
  const c1 = "var(--accent)";   // red — primary
  const c2 = "#60a5fa";   // blue — carbs
  const c3 = "#f59e0b";   // amber — fat/energy

  const fontSize = size * 0.52;
  const letterSpacing = size * 0.06;

  return (
    <div style={{display:"flex",alignItems:"center",gap:size*0.28,flexShrink:0,userSelect:"none"}}>
      {/* Icon */}
      <svg width={iw} height={h} viewBox={`0 0 ${iw} ${h}`} style={{display:"block",flexShrink:0}}>
        {/* Glow layers for premium depth */}
        <defs>
          <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Bar 1 — Blue — protein */}
        <rect x={0} y={y1} width={bw} height={h1} rx={r} ry={r} fill={c1} filter="url(#logo-glow)"/>
        {/* Top cap — slightly lighter for 3D premium feel */}
        <rect x={0} y={y1} width={bw} height={r*2} rx={r} ry={r} fill="rgba(255,255,255,0.18)"/>

        {/* Bar 2 — Green — carbs */}
        <rect x={bw+gap} y={y2} width={bw} height={h2} rx={r} ry={r} fill={c2} filter="url(#logo-glow)"/>
        <rect x={bw+gap} y={y2} width={bw} height={r*2} rx={r} ry={r} fill="rgba(255,255,255,0.15)"/>

        {/* Bar 3 — Gold — energy */}
        <rect x={(bw+gap)*2} y={y3} width={bw} height={h3} rx={r} ry={r} fill={c3} filter="url(#logo-glow)"/>
        <rect x={(bw+gap)*2} y={y3} width={bw} height={r*2} rx={r} ry={r} fill="rgba(255,255,255,0.12)"/>

        {/* Connecting baseline — ultra thin, unifies the mark */}
        <rect x={0} y={h-1.5} width={iw} height={1.5} rx={0.75} fill="rgba(255,255,255,0.12)"/>
      </svg>

      {/* Wordmark */}
      {text&&(
        <div style={{display:"flex",flexDirection:"column",lineHeight:1,gap:0}}>
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:900,
            fontStyle:"italic",
            fontSize:fontSize*0.7,
            letterSpacing:letterSpacing*0.8,
            color:"rgba(255,255,255,0.45)",
            textTransform:"uppercase",
            marginBottom:1,
          }}>Coach</div>
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontWeight:900,
            fontSize:fontSize,
            letterSpacing:letterSpacing,
            color:textColor,
            textTransform:"uppercase",
            lineHeight:0.85,
            background:"linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 100%)",
            WebkitBackgroundClip:"text",
            WebkitTextFillColor:"transparent",
          }}>MACRO</div>
        </div>
      )}
    </div>
  );
}


export function BodyFigure({pct, color, selected}) {
  const w = 28 + pct*0.8;
  const sh = 22 + pct*0.3;
  return (
    <svg width="56" height="84" viewBox="0 0 100 160" style={{display:"block",margin:"0 auto"}}>
      <ellipse cx="50" cy="18" rx="14" ry="17" fill={selected?color:color+"66"} />
      <rect x="44" y="33" width="12" height="8" fill={selected?color:color+"66"} />
      <path d={`M${50-sh},42 C${50-sh-4},42 ${50-w},58 ${50-w},80 Q${50-w},95 50,95 Q${50+w},95 ${50+w},80 C${50+w},58 ${50+sh+4},42 ${50+sh},42 Z`} fill={selected?color:color+"44"} />
      {pct>22&&<ellipse cx="50" cy={65+pct*0.25} rx={w*0.55} ry={pct*0.3} fill={selected?color+"77":color+"22"} />}
      <path d={`M${50-sh},50 C${50-sh-8},56 ${50-sh-10},72 ${50-sh-7},86`} fill="none" stroke={selected?color:color+"66"} strokeWidth={4+pct*0.07} strokeLinecap="round"/>
      <path d={`M${50+sh},50 C${50+sh+8},56 ${50+sh+10},72 ${50+sh+7},86`} fill="none" stroke={selected?color:color+"66"} strokeWidth={4+pct*0.07} strokeLinecap="round"/>
      <path d={`M${50-10},95 L${50-13-pct*0.1},148`} fill="none" stroke={selected?color:color+"66"} strokeWidth={7+pct*0.08} strokeLinecap="round"/>
      <path d={`M${50+10},95 L${50+13+pct*0.1},148`} fill="none" stroke={selected?color:color+"66"} strokeWidth={7+pct*0.08} strokeLinecap="round"/>
    </svg>
  );
}

// ─── MUSCLE MAP ───────────────────────────────────────────────────────────────
export function MuscleMap({dayFocus, isMobile}) {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("front");

  const getVolume = (m) => {
    const map = {
      chest:["Push","Arnold A","Full Body","Upper","Chest+Triceps"],
      shoulders:["Push","Arnold A","Full Body","Upper","Shoulders+Arms"],
      biceps:["Pull","Arnold B","Full Body","Upper","Back+Biceps","Shoulders+Arms"],
      triceps:["Push","Arnold A","Full Body","Upper","Chest+Triceps","Shoulders+Arms"],
      forearms:["Pull","Arnold B","Full Body","Upper","Back+Biceps"],
      abs:["Full Body","Legs","Lower"],
      quads:["Legs","Full Body","Lower"],
      hamstrings:["Legs","Full Body","Lower"],
      glutes:["Legs","Full Body","Lower"],
      calves:["Legs","Full Body","Lower"],
      lats:["Pull","Arnold B","Full Body","Upper","Back+Biceps"],
      traps:["Pull","Arnold B","Full Body","Upper"],
      rhomboids:["Pull","Arnold B","Full Body","Upper","Back+Biceps"],
      lower_back:["Legs","Full Body","Lower"],
    };
    return (Object.values(dayFocus||{}).filter(f=>(map[m]||[]).includes(f)).length)*3;
  };

  const fillColor = (m) => {
    const s = getVolume(m);
    if(selected===m) return T.prot;
    if(s===0) return "#4A6B8A";
    if(s<6)   return "#8B2252";
    if(s<10)  return T.prot;
    return T.green;
  };

  const s = (m) => () => setSelected(selected===m?null:m);
  const f = (m) => fillColor(m);

  // Colors matching the reference exactly
  const BASE = "#4A6B8A";      // blue-grey body fill
  const SEP = "#ffffff";       // white separation lines
  const SEP_O = "0.35";        // separation line opacity
  const OUTLINE = "#3A5A78";   // body outline

  const statusText = (m) => {
    const sets = getVolume(m);
    if(sets===0) return {l:"Not trained this week",c:T.mu};
    if(sets<6)   return {l:`${sets} sets — needs more volume`,c:T.prot};
    if(sets<10)  return {l:`${sets} sets — building`,c:T.prot};
    return {l:`${sets} sets — optimal ✓`,c:T.green};
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"start"}}>
      <div>
        <div style={{display:"flex",background:T.s3,borderRadius:10,padding:3,marginBottom:16,gap:3}}>
          {["front","back"].map(v=>(
            <button key={v} onClick={()=>{setView(v);setSelected(null);}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:view===v?T.prot:"none",color:view===v?"#fff":T.mu,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize",transition:"all .2s"}}>{v} view</button>
          ))}
        </div>

        {view==="front"&&(
          <svg viewBox="0 0 220 500" style={{width:"100%",maxWidth:260,display:"block",margin:"0 auto",filter:"drop-shadow(0 4px 20px rgba(0,0,0,.4))"}}>
            {/* ══ FRONT VIEW — exact recreation of reference ══ */}

            {/* HEAD */}
            <ellipse cx="110" cy="28" rx="19" ry="22" fill={BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* neck */}
            <path d="M101,48 L101,60 Q110,64 119,60 L119,48" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* TRAPEZIUS upper — slopes from neck to shoulders */}
            <path d="M101,58 Q88,62 72,72 Q90,78 110,76 Q130,78 148,72 Q132,62 119,58Z" fill={f("traps")} stroke={OUTLINE} strokeWidth="0.5" onClick={s("traps")} style={{cursor:"pointer"}}/>
            {/* trap separation */}
            <line x1="110" y1="62" x2="110" y2="76" stroke={SEP} strokeWidth="0.8" opacity={SEP_O}/>

            {/* SHOULDERS — deltoids, round cap shape */}
            {/* left delt */}
            <path d="M72,72 Q52,72 44,86 Q44,106 56,116 Q68,108 74,96 L74,76Z" fill={f("shoulders")} stroke={OUTLINE} strokeWidth="1" onClick={s("shoulders")} style={{cursor:"pointer"}}/>
            {/* right delt */}
            <path d="M148,72 Q168,72 176,86 Q176,106 164,116 Q152,108 146,96 L146,76Z" fill={f("shoulders")} stroke={OUTLINE} strokeWidth="1" onClick={s("shoulders")} style={{cursor:"pointer"}}/>
            {/* delt separation lines */}
            <path d="M56,78 Q60,92 62,110" fill="none" stroke={SEP} strokeWidth="0.8" opacity={SEP_O}/>
            <path d="M164,78 Q160,92 158,110" fill="none" stroke={SEP} strokeWidth="0.8" opacity={SEP_O}/>

            {/* CHEST — two pecs with clear split and lower curve */}
            {/* left pec */}
            <path d="M74,76 Q68,80 66,96 Q66,114 80,120 Q96,122 110,120 L110,80 Q94,76 74,76Z" fill={f("chest")} stroke={OUTLINE} strokeWidth="1" onClick={s("chest")} style={{cursor:"pointer"}}/>
            {/* right pec */}
            <path d="M146,76 Q152,80 154,96 Q154,114 140,120 Q124,122 110,120 L110,80 Q126,76 146,76Z" fill={f("chest")} stroke={OUTLINE} strokeWidth="1" onClick={s("chest")} style={{cursor:"pointer"}}/>
            {/* chest center line */}
            <line x1="110" y1="76" x2="110" y2="122" stroke={SEP} strokeWidth="1" opacity="0.5"/>
            {/* lower pec curve */}
            <path d="M68,110 Q88,124 110,120 Q132,124 152,110" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            {/* upper pec line */}
            <path d="M76,84 Q92,82 110,84 Q128,82 144,84" fill="none" stroke={SEP} strokeWidth="0.6" opacity="0.3"/>

            {/* BICEPS — front, peaked shape */}
            {/* left bicep */}
            <path d="M44,90 Q36,102 36,128 Q38,144 50,150 Q62,144 66,124 L62,96Z" fill={f("biceps")} stroke={OUTLINE} strokeWidth="1" onClick={s("biceps")} style={{cursor:"pointer"}}/>
            {/* right bicep */}
            <path d="M176,90 Q184,102 184,128 Q182,144 170,150 Q158,144 154,124 L158,96Z" fill={f("biceps")} stroke={OUTLINE} strokeWidth="1" onClick={s("biceps")} style={{cursor:"pointer"}}/>
            {/* bicep peak line */}
            <path d="M40,116 Q48,110 58,116" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M180,116 Q172,110 162,116" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>

            {/* TRICEPS — visible from front as side strip */}
            <path d="M36,100 Q30,118 32,146 Q38,150 44,144 L44,102Z" fill={f("triceps")} stroke={OUTLINE} strokeWidth="0.8" onClick={s("triceps")} style={{cursor:"pointer"}}/>
            <path d="M184,100 Q190,118 188,146 Q182,150 176,144 L176,102Z" fill={f("triceps")} stroke={OUTLINE} strokeWidth="0.8" onClick={s("triceps")} style={{cursor:"pointer"}}/>

            {/* FOREARMS */}
            <path d="M32,148 Q26,172 28,196 Q34,202 42,198 L48,152Z" fill={f("forearms")} stroke={OUTLINE} strokeWidth="0.8" onClick={s("forearms")} style={{cursor:"pointer"}}/>
            <path d="M188,148 Q194,172 192,196 Q186,202 178,198 L172,152Z" fill={f("forearms")} stroke={OUTLINE} strokeWidth="0.8" onClick={s("forearms")} style={{cursor:"pointer"}}/>
            {/* forearm lines */}
            <path d="M30,160 Q36,164 42,162" fill="none" stroke={SEP} strokeWidth="0.6" opacity="0.3"/>
            <path d="M190,160 Q184,164 178,162" fill="none" stroke={SEP} strokeWidth="0.6" opacity="0.3"/>

            {/* HANDS */}
            <ellipse cx="30" cy="208" rx="10" ry="14" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="190" cy="208" rx="10" ry="14" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* TORSO body fill — between chest and hips */}
            <path d="M66,118 Q62,134 62,154 Q64,172 74,180 L80,216 L140,216 L146,180 Q156,172 158,154 Q158,134 154,118Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* ABS — 6-pack grid */}
            <path d="M80,122 Q76,138 76,158 Q78,174 84,180 L110,180 L136,180 Q142,174 144,158 Q144,138 140,122Z" fill={f("abs")} stroke={OUTLINE} strokeWidth="0.5" onClick={s("abs")} style={{cursor:"pointer"}}/>
            {/* vertical line */}
            <line x1="110" y1="122" x2="110" y2="180" stroke={SEP} strokeWidth="1" opacity="0.5"/>
            {/* horizontal lines — 3 rows */}
            <path d="M80,138 Q96,142 110,140 Q124,142 140,138" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.45"/>
            <path d="M78,154 Q96,158 110,156 Q124,158 142,154" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.45"/>
            <path d="M78,170 Q96,173 110,172 Q124,173 142,170" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            {/* oblique lines */}
            <path d="M76,130 Q72,152 74,172" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.3"/>
            <path d="M144,130 Q148,152 146,172" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.3"/>

            {/* SERRATUS — finger-like on sides */}
            <path d="M66,124 Q62,130 64,136" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>
            <path d="M64,134 Q60,140 62,146" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>
            <path d="M154,124 Q158,130 156,136" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>
            <path d="M156,134 Q160,140 158,146" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>

            {/* HIPS / PELVIS */}
            <path d="M74,178 Q68,190 68,204 Q80,212 110,214 Q140,212 152,204 Q152,190 146,178Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* hip line */}
            <path d="M68,196 Q88,202 110,200 Q132,202 152,196" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.3"/>

            {/* QUADS — 4 heads clearly defined, athletic taper */}
            {/* left quad */}
            <path d="M68,212 Q56,228 52,266 Q52,298 60,318 Q72,326 84,320 Q96,298 98,266 Q98,228 90,212Z" fill={f("quads")} stroke={OUTLINE} strokeWidth="1" onClick={s("quads")} style={{cursor:"pointer"}}/>
            {/* right quad */}
            <path d="M152,212 Q164,228 168,266 Q168,298 160,318 Q148,326 136,320 Q124,298 122,266 Q122,228 130,212Z" fill={f("quads")} stroke={OUTLINE} strokeWidth="1" onClick={s("quads")} style={{cursor:"pointer"}}/>
            {/* quad separation — 3 lines showing 4 heads */}
            <path d="M68,218 Q70,260 72,314" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M78,214 Q80,258 80,316" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>
            <path d="M88,214 Q88,258 88,316" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            <path d="M152,218 Q150,260 148,314" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M142,214 Q140,258 140,316" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>
            <path d="M132,214 Q132,258 132,316" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            {/* VMO bulge */}
            <path d="M84,306 Q80,316 84,322" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M136,306 Q140,316 136,322" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>

            {/* KNEES */}
            <ellipse cx="75" cy="330" rx="17" ry="12" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="145" cy="330" rx="17" ry="12" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* TIBIALIS / CALVES FRONT */}
            <path d="M60,340 Q54,366 56,396 L92,396 Q94,366 88,340Z" fill={f("calves")} stroke={OUTLINE} strokeWidth="1" onClick={s("calves")} style={{cursor:"pointer"}}/>
            <path d="M130,340 Q126,366 128,396 L164,396 Q166,366 160,340Z" fill={f("calves")} stroke={OUTLINE} strokeWidth="1" onClick={s("calves")} style={{cursor:"pointer"}}/>
            {/* tibialis line */}
            <path d="M68,342 Q66,368 68,392" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>
            <path d="M152,342 Q154,368 152,392" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>

            {/* FEET */}
            <path d="M54,396 Q50,404 52,412 Q60,416 80,414 Q92,410 94,404 Q92,396 88,396Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M166,396 Q170,404 168,412 Q160,416 140,414 Q128,410 126,404 Q128,396 132,396Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {selected&&<text x="110" y="428" textAnchor="middle" fill="#E8185A" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">{selected.replace("_"," ").toUpperCase()}</text>}
          </svg>
        )}

        {view==="back"&&(
          <svg viewBox="0 0 220 500" style={{width:"100%",maxWidth:260,display:"block",margin:"0 auto",filter:"drop-shadow(0 4px 20px rgba(0,0,0,.4))"}}>
            {/* ══ BACK VIEW ══ */}

            {/* HEAD */}
            <ellipse cx="110" cy="28" rx="19" ry="22" fill={BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <path d="M101,48 L101,60 Q110,64 119,60 L119,48" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* TRAPEZIUS — large diamond from neck to mid back */}
            <path d="M101,58 Q88,62 70,74 Q78,88 110,84 Q142,88 150,74 Q132,62 119,58Z" fill={f("traps")} stroke={OUTLINE} strokeWidth="1" onClick={s("traps")} style={{cursor:"pointer"}}/>
            {/* upper trap to neck detail */}
            <path d="M101,60 Q104,68 110,70 Q116,68 119,60" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <line x1="110" y1="68" x2="110" y2="130" stroke={SEP} strokeWidth="1" opacity="0.4"/>

            {/* REAR DELTOIDS */}
            <path d="M70,74 Q50,74 42,90 Q42,110 54,118 Q66,110 72,98 L72,78Z" fill={f("shoulders")} stroke={OUTLINE} strokeWidth="1" onClick={s("shoulders")} style={{cursor:"pointer"}}/>
            <path d="M150,74 Q170,74 178,90 Q178,110 166,118 Q154,110 148,98 L148,78Z" fill={f("shoulders")} stroke={OUTLINE} strokeWidth="1" onClick={s("shoulders")} style={{cursor:"pointer"}}/>

            {/* LATS — large triangular fan, widest point is the signature V-taper */}
            <path d="M70,76 Q44,90 38,122 Q36,152 46,170 Q64,178 84,172 Q96,156 98,132 Q96,104 90,82Z" fill={f("lats")} stroke={OUTLINE} strokeWidth="1" onClick={s("lats")} style={{cursor:"pointer"}}/>
            <path d="M150,76 Q176,90 182,122 Q184,152 174,170 Q156,178 136,172 Q124,156 122,132 Q124,104 130,82Z" fill={f("lats")} stroke={OUTLINE} strokeWidth="1" onClick={s("lats")} style={{cursor:"pointer"}}/>
            {/* lat fan lines */}
            <path d="M72,80 Q58,102 52,140" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M80,78 Q70,104 68,148" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            <path d="M88,78 Q82,106 82,150" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.3"/>
            <path d="M148,80 Q162,102 168,140" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M140,78 Q150,104 152,148" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            <path d="M132,78 Q138,106 138,150" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.3"/>

            {/* RHOMBOIDS / MID BACK */}
            <path d="M88,80 Q84,94 84,110 Q96,118 110,116 Q124,118 136,110 Q136,94 132,80 Q120,90 110,90 Q100,90 88,80Z" fill={f("rhomboids")} stroke={OUTLINE} strokeWidth="0.5" onClick={s("rhomboids")} style={{cursor:"pointer"}}/>

            {/* TRICEPS — full view from back, 3 heads */}
            <path d="M42,94 Q34,112 36,144 Q42,154 54,148 L56,108Z" fill={f("triceps")} stroke={OUTLINE} strokeWidth="1" onClick={s("triceps")} style={{cursor:"pointer"}}/>
            <path d="M178,94 Q186,112 184,144 Q178,154 166,148 L164,108Z" fill={f("triceps")} stroke={OUTLINE} strokeWidth="1" onClick={s("triceps")} style={{cursor:"pointer"}}/>
            {/* tricep head lines */}
            <path d="M38,118 Q46,122 52,118" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M36,132 Q44,136 52,132" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            <path d="M182,118 Q174,122 168,118" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M184,132 Q176,136 168,132" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>

            {/* FOREARMS back */}
            <path d="M34,148 Q28,172 30,196 Q36,202 44,198 L50,152Z" fill={f("forearms")} stroke={OUTLINE} strokeWidth="0.8" onClick={s("forearms")} style={{cursor:"pointer"}}/>
            <path d="M186,148 Q192,172 190,196 Q184,202 176,198 L170,152Z" fill={f("forearms")} stroke={OUTLINE} strokeWidth="0.8" onClick={s("forearms")} style={{cursor:"pointer"}}/>

            {/* HANDS */}
            <ellipse cx="30" cy="208" rx="10" ry="14" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="190" cy="208" rx="10" ry="14" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* TORSO BACK */}
            <path d="M66,168 Q60,182 60,202 L68,216 L152,216 L160,202 Q160,182 154,168Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* LOWER BACK / ERECTOR SPINAE */}
            <path d="M82,168 Q78,184 78,204 Q94,212 110,210 Q126,212 142,204 Q142,184 138,168 Q124,176 110,176 Q96,176 82,168Z" fill={f("lower_back")} stroke={OUTLINE} strokeWidth="0.5" onClick={s("lower_back")} style={{cursor:"pointer"}}/>
            <line x1="110" y1="174" x2="110" y2="210" stroke={SEP} strokeWidth="1" opacity="0.5"/>
            <path d="M94,180 Q94,198 94,208" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            <path d="M126,180 Q126,198 126,208" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>

            {/* GLUTES — two round shapes, signature */}
            <path d="M68,214 Q54,228 52,256 Q54,278 68,284 Q84,288 98,278 Q108,264 110,248 Q110,226 104,214Z" fill={f("glutes")} stroke={OUTLINE} strokeWidth="1" onClick={s("glutes")} style={{cursor:"pointer"}}/>
            <path d="M152,214 Q166,228 168,256 Q166,278 152,284 Q136,288 122,278 Q112,264 110,248 Q110,226 116,214Z" fill={f("glutes")} stroke={OUTLINE} strokeWidth="1" onClick={s("glutes")} style={{cursor:"pointer"}}/>
            <line x1="110" y1="214" x2="110" y2="284" stroke={SEP} strokeWidth="1" opacity="0.4"/>
            {/* glute crease */}
            <path d="M52,268 Q80,276 110,272 Q140,276 168,268" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.35"/>

            {/* HAMSTRINGS — 3 distinct bands */}
            <path d="M52,282 Q44,302 44,336 Q46,364 56,378 L84,378 Q94,362 96,334 Q96,300 90,282Z" fill={f("hamstrings")} stroke={OUTLINE} strokeWidth="1" onClick={s("hamstrings")} style={{cursor:"pointer"}}/>
            <path d="M168,282 Q176,302 176,336 Q174,364 164,378 L136,378 Q126,362 124,334 Q124,300 130,282Z" fill={f("hamstrings")} stroke={OUTLINE} strokeWidth="1" onClick={s("hamstrings")} style={{cursor:"pointer"}}/>
            {/* ham separation lines */}
            <path d="M60,286 Q58,318 60,370" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M72,284 Q72,316 74,370" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>
            <path d="M160,286 Q162,318 160,370" fill="none" stroke={SEP} strokeWidth="0.8" opacity="0.4"/>
            <path d="M148,284 Q148,316 146,370" fill="none" stroke={SEP} strokeWidth="0.7" opacity="0.35"/>

            {/* KNEES BACK */}
            <ellipse cx="75" cy="386" rx="17" ry="11" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="145" cy="386" rx="17" ry="11" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* CALVES BACK — gastrocnemius diamond */}
            <path d="M58,396 Q50,416 52,440 Q60,450 72,448 Q84,444 88,432 Q90,416 86,396Z" fill={f("calves")} stroke={OUTLINE} strokeWidth="1" onClick={s("calves")} style={{cursor:"pointer"}}/>
            <path d="M162,396 Q170,416 168,440 Q160,450 148,448 Q136,444 132,432 Q130,416 134,396Z" fill={f("calves")} stroke={OUTLINE} strokeWidth="1" onClick={s("calves")} style={{cursor:"pointer"}}/>
            {/* gastrocnemius split — the diamond line */}
            <path d="M70,398 Q68,420 70,442" fill="none" stroke={SEP} strokeWidth="0.9" opacity="0.5"/>
            <path d="M150,398 Q152,420 150,442" fill="none" stroke={SEP} strokeWidth="0.9" opacity="0.5"/>

            {/* FEET */}
            <path d="M50,446 Q46,454 48,462 Q58,466 78,464 Q90,460 92,454 Q90,446 86,446Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M170,446 Q174,454 172,462 Q162,466 142,464 Q130,460 128,454 Q130,446 134,446Z" fill={BASE} stroke={OUTLINE} strokeWidth="1"/>

            {selected&&<text x="110" y="480" textAnchor="middle" fill="#E8185A" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">{selected.replace("_"," ").toUpperCase()}</text>}
          </svg>
        )}

        {selected&&(
          <div style={{background:T.s2,border:`1px solid ${statusText(selected).c}35`,borderRadius:12,padding:"14px 16px",marginTop:12}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:T.mu,marginBottom:4}}>{selected.replace("_"," ")}</div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,textTransform:"uppercase",color:"#fff",marginBottom:4}}>{selected.replace("_"," ")}</div>
            <div style={{fontSize:12,color:statusText(selected).c,fontWeight:600,fontFamily:"var(--mono)"}}>{statusText(selected).l}</div>
          </div>
        )}
        {!selected&&<div style={{textAlign:"center",marginTop:8,fontSize:11,color:T.mu,fontFamily:"var(--mono)"}}>// TAP ANY MUSCLE</div>}
      </div>

      {/* Volume list */}
      <div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,textTransform:"uppercase",letterSpacing:"0.02em",color:"rgba(245,245,240,0.9)",marginBottom:14}}>Weekly Volume</div>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {[
            {m:"chest",l:"Chest"},{m:"shoulders",l:"Shoulders"},
            {m:"lats",l:"Lats"},{m:"traps",l:"Traps"},{m:"rhomboids",l:"Rhomboids"},
            {m:"lower_back",l:"Lower Back"},{m:"biceps",l:"Biceps"},
            {m:"triceps",l:"Triceps"},{m:"forearms",l:"Forearms"},
            {m:"abs",l:"Abs / Core"},{m:"quads",l:"Quads"},
            {m:"hamstrings",l:"Hamstrings"},{m:"glutes",l:"Glutes"},{m:"calves",l:"Calves"},
          ].map(({m,l})=>{
            const sets=getVolume(m);
            const pct=Math.min(sets/20,1);
            const optimal=sets>=10&&sets<=20;
            const low=sets>0&&sets<10;
            const c=optimal?T.green:low?T.prot:sets===0?"rgba(245,245,240,0.08)":"rgba(var(--accent-rgb),0.5)";
            const isSel=selected===m;
            return(
              <div key={m} onClick={()=>setSelected(isSel?null:m)} style={{padding:"9px 0",borderBottom:`1px solid rgba(245,245,240,0.05)`,cursor:"pointer",background:isSel?`${T.prot}08`:"transparent",paddingLeft:isSel?8:0,transition:"all .15s",borderRadius:isSel?6:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,color:isSel?T.prot:"rgba(245,245,240,0.8)"}}>{l}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {optimal&&<span style={{fontSize:9,color:T.green,background:`${T.green}12`,borderRadius:6,padding:"2px 7px",fontWeight:700,fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>✓ HIT</span>}
                    <span style={{fontSize:12,fontWeight:700,color:sets===0?T.mu:c,fontFamily:"var(--mono)"}}>{sets===0?"—":`${sets}`}<span style={{fontSize:9,color:T.mu}}>{sets>0?" sets":""}</span></span>
                  </div>
                </div>
                <div style={{height:5,background:"rgba(245,245,240,0.06)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct*100}%`,background:sets===0?"transparent":`linear-gradient(90deg,${c},${c}88)`,borderRadius:3,transition:"width 0.6s cubic-bezier(.4,0,.2,1)"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {[{c:T.green,l:"Optimal (10–20 sets)"},{c:T.prot,l:"Building (6–9)"},{c:"rgba(var(--accent-rgb),0.5)",l:"Low (1–5)"},{c:"rgba(245,245,240,0.12)",l:"Not trained"}].map(({c,l})=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}}/>
              <span style={{fontSize:10,color:T.mu}}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function getTier(count) {
  if(count>=10)return 4;
  if(count>=5)return 3;
  if(count>=3)return 2;
  if(count>=1)return 1;
  return 0;
}

export function getReferralBadge(count) {
  if(count>=5)return 'VERIFIED';
  if(count>=1)return 'VIP';
  return null;
}

export function Badge({type}) {
  const TIERS={
    PRO:{bg:'#FEA020',textColor:'#000',label:'PRO'},
    VIP:{bg:'#FFD740',textColor:'#000',label:'VIP'},
    VERIFIED:{bg:'#1D9BF0',textColor:'#fff',label:'VERIFIED'},
    LEGEND:{bg:'rgba(255,215,0,0.1)',textColor:'#FFD700',border:'1px solid rgba(255,215,0,0.5)',shadow:'0 0 14px rgba(255,215,0,0.3)',label:'LEGEND'},
  };
  const s=TIERS[type];
  if(!s)return null;
  return(
    <span style={{
      background:s.bg,color:s.textColor,
      fontSize:9,fontWeight:700,letterSpacing:'0.15em',
      padding:'3px 8px',borderRadius:20,
      fontFamily:"'DM Mono','SF Mono',monospace",
      display:"inline-flex",alignItems:"center",
      border:s.border||'none',boxShadow:s.shadow||'none',
      textTransform:'uppercase',
    }}>
      {s.label}
    </span>
  );
}

export function FAQItem({q, a}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{borderBottom:`1px solid #111`,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",padding:"20px 0",background:"none",border:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,fontFamily:"inherit",textAlign:"left"}}>
        <div style={{fontSize:16,fontWeight:700,color:"#fff",lineHeight:1.4}}>{q}</div>
        <div style={{fontSize:20,color:"#2979FF",flexShrink:0,transform:open?"rotate(45deg)":"rotate(0deg)",transition:"transform .2s"}}>+</div>
      </button>
      {open&&<div style={{fontSize:14,color:"#888",lineHeight:1.75,paddingBottom:20}}>{a}</div>}
    </div>
  );
}
