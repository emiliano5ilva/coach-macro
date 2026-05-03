import React, { useState, useEffect, useRef } from "react";

export const T = {
  bg:   "#050810",
  s1:   "#161e35",
  s2:   "#111827",
  s3:   "#0f1628",
  bd:   "rgba(245,245,240,0.08)",
  mu:   "rgba(245,245,240,0.4)",
  dim:  "rgba(245,245,240,0.65)",
  prot: "#e8341c",
  carb: "#60a5fa",
  fat:  "#f59e0b",
  red:  "#e8341c",
  white:"#f5f5f0",
  green:"#22c55e",
};

// ─── STATIC DATA ──────────────────────────────────────────────────────────────
export const WDAYS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const MONTHS_A = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const DAYS_A   = Array.from({length:31},(_,i)=>String(i+1));
export const YEARS_A  = Array.from({length:85},(_,i)=>String(new Date().getFullYear()-13-i));
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
  {r:"40+%",   pct:43, c:"#e8341c", l:"Obese",     desc:"High health risk range"},
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
  const tm = {strength:0,cardio:.03,hybrid:.05,hyrox:.07,run:.04,sport:.03}[p.trainType]??0;
  let mult = Math.min(1.2+jm+sm+fm+(im*fs)+am+tm, 1.90);
  let tdee = bmr*mult;
  if(p.sleep==="u5")tdee*=0.93; else if(p.sleep==="5-6")tdee*=0.96;
  if(p.metHistory==="3plus")tdee*=0.90; else if(p.metHistory==="u3")tdee*=0.95;
  if((p.conditions||[]).includes("thyroid"))tdee*=0.82;
  if(p.protein==="high")tdee*=1.03;
  return { total:Math.round(tdee), bmr:Math.round(bmr), activity:Math.round(tdee-bmr-Math.round(tdee*0.08)), tef:Math.round(tdee*0.08) };
}

export function getDayMacros(baseCals, goal, dayType, earnedCals=0) {
  const mult = {
    training:{Bulk:1.15,Cut:1.05,Maintain:1.10},
    cardio:  {Bulk:1.00,Cut:0.90,Maintain:0.95},
    run:     {Bulk:1.00,Cut:0.90,Maintain:0.95},
    hyrox:   {Bulk:1.05,Cut:0.95,Maintain:1.00},
    rest:    {Bulk:0.85,Cut:0.75,Maintain:0.85},
  };
  const splits = {
    training:{Bulk:[.45,.30,.25],Cut:[.35,.45,.20],Maintain:[.40,.35,.25]},
    cardio:  {Bulk:[.38,.35,.27],Cut:[.30,.45,.25],Maintain:[.35,.38,.27]},
    run:     {Bulk:[.38,.35,.27],Cut:[.30,.45,.25],Maintain:[.35,.38,.27]},
    hyrox:   {Bulk:[.42,.33,.25],Cut:[.32,.43,.25],Maintain:[.38,.37,.25]},
    rest:    {Bulk:[.25,.45,.30],Cut:[.20,.50,.30],Maintain:[.25,.40,.35]},
  };
  const g=goal||"Maintain", dt=(dayType&&mult[dayType])?dayType:"rest";
  const cals = Math.round(baseCals*(mult[dt]?.[g]??1.0))+earnedCals;
  const [cp,pp,fp] = (splits[dt]?.[g])||[.40,.35,.25];
  return { calories:cals, protein:Math.round((cals*pp)/4), carbs:Math.round((cals*cp)/4), fat:Math.round((cals*fp)/9) };
}

export function getTodayKey() { return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()]; }
export function isToday(ds)    { if(!ds)return false; const d=new Date(ds),t=new Date(); return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate(); }
export function hap()          { try{navigator.vibrate?.(8);}catch{} }
export function pad2(n)        { return String(Math.max(0,Math.floor(n))).padStart(2,"0"); }
export function autoFocus(sch,splitType) {
  const cycles=SPLIT_CYCLES[splitType]||["Full Body"]; const f={}; let i=0;
  WDAYS.forEach(d=>{ if(sch[d]==="training")f[d]=cycles[i++%cycles.length]; else if(["cardio","run","hyrox"].includes(sch[d]))f[d]=(DAY_CFG[sch[d]]||DAY_CFG.rest).label; else f[d]="Rest"; });
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
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Barlow:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#root{height:100%}
  body{font-family:'Barlow',system-ui,-apple-system,sans-serif;color:${T.white};-webkit-font-smoothing:antialiased;background:#050810;background-image:radial-gradient(ellipse at 30% 20%,rgba(232,52,28,0.08),transparent 50%),radial-gradient(ellipse at 70% 80%,rgba(96,165,250,0.06),transparent 50%)}
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
  @keyframes fabPulse{0%,100%{box-shadow:0 12px 32px rgba(232,52,28,0.5)}50%{box-shadow:0 12px 48px rgba(232,52,28,0.75)}}
  .grad-text{background:linear-gradient(135deg,#e8341c 0%,#ff8c42 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .hero-title{animation:slideUp .9s cubic-bezier(.16,1,.3,1) forwards}
  .hero-sub{animation:slideUp .9s cubic-bezier(.16,1,.3,1) .15s both}
  .hero-cta{animation:slideUp .9s cubic-bezier(.16,1,.3,1) .3s both}
  .phone-float{animation:floatUp 4s ease-in-out infinite}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
  .reveal.visible{opacity:1;transform:translateY(0)}
  .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
  @media(max-width:768px){.desk-only{display:none!important}}
  @media(min-width:769px){.mob-only{display:none!important}}
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
  const pct=Math.min(consumed/target,1), rem=target-consumed;
  return (
    <div style={{background:T.s2,borderRadius:14,padding:"13px 15px",marginBottom:8,border:`1px solid ${T.bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <span style={{color,fontSize:10,fontWeight:500,letterSpacing:"0.14em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{label}</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:T.white}}>{consumed}g <span style={{color:T.mu}}>/ {target}g</span></span>
      </div>
      <div style={{height:4,background:"rgba(245,245,240,0.08)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct*100}%`,background:color,borderRadius:2,transition:"width 0.5s"}}/>
      </div>
      <div style={{fontSize:10,color:T.mu,marginTop:4,fontFamily:"'DM Mono',monospace"}}>{rem>0?`${rem}g remaining`:"✓ Hit"}</div>
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
      <div ref={ref} onScroll={onScr} style={{height:"100%",overflowY:"scroll",scrollSnapType:"y mandatory",scrollbarWidth:"none"}}>
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
      <div style={{position:"absolute",top:itemH,left:4,right:4,height:itemH,borderTop:`1px solid rgba(232,52,28,0.35)`,borderBottom:`1px solid rgba(232,52,28,0.35)`,pointerEvents:"none",zIndex:1}}/>
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
  const c1 = "#e8341c";   // red — primary
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
    if(selected===m) return "#E8185A";
    if(s===0) return "#4A6B8A";
    if(s<6)   return "#8B2252";
    if(s<10)  return "#C0392B";
    return "#E8185A";
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
    if(sets===0) return {l:"Not trained",c:"#4A6080"};
    if(sets<6)   return {l:`${sets} sets — needs more`,c:"#C0392B"};
    if(sets<10)  return {l:`${sets} sets — building`,c:"#E8185A"};
    return {l:`${sets} sets — optimal ✓`,c:"#00E676"};
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
          <div style={{background:T.s2,border:`1px solid ${statusText(selected).c}30`,borderRadius:12,padding:"12px 16px",marginTop:12,textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",textTransform:"capitalize",marginBottom:4}}>{selected.replace("_"," ")}</div>
            <div style={{fontSize:13,color:statusText(selected).c,fontWeight:600}}>{statusText(selected).l}</div>
          </div>
        )}
        {!selected&&<div style={{textAlign:"center",marginTop:8,fontSize:11,color:T.mu}}>Tap any muscle to see volume</div>}
      </div>

      {/* Volume list */}
      <div>
        <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:14}}>Weekly Volume</div>
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
            const c=optimal?"#E8185A":low?"#C0392B":sets===0?"#2A3A50":"#6B2D5E";
            const isSel=selected===m;
            return(
              <div key={m} onClick={()=>setSelected(isSel?null:m)} style={{padding:"8px 0",borderBottom:`1px solid rgba(245,245,240,0.05)`,cursor:"pointer",background:isSel?`${T.prot}06`:"transparent",paddingLeft:isSel?8:0,transition:"all .15s",borderRadius:isSel?6:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:isSel?"#E8185A":"#ccc"}}>{l}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {optimal&&<span style={{fontSize:9,color:"#00E676",background:"rgba(0,230,118,.08)",borderRadius:6,padding:"1px 7px",fontWeight:700}}>✓</span>}
                    <span style={{fontSize:12,fontWeight:700,color:sets===0?T.dim:c}}>{sets===0?"—":`${sets}`}<span style={{fontSize:9,color:T.mu}}>{sets>0?" sets":""}</span></span>
                  </div>
                </div>
                <div style={{height:3,background:T.s3,borderRadius:2}}>
                  <div style={{height:"100%",width:`${pct*100}%`,background:c,borderRadius:2,transition:"width .5s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
          {[{c:"#E8185A",l:"Optimal (10–20 sets)"},{c:"#C0392B",l:"Building (6–9)"},{c:"#6B2D5E",l:"Low (1–5)"},{c:"#2A3A50",l:"Not trained"}].map(({c,l})=>(
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
