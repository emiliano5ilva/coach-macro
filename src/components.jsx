import React, { useState, useEffect, useRef } from "react";

export const T = {
  bg:   "#060D1A", // page background
  s1:   "#0A1424", // surface 1 — sidebar, cards
  s2:   "#0D1828", // surface 2 — inner cards
  s3:   "#0F1C30", // surface 3 — input backgrounds
  bd:   "#1A2A44", // borders
  mu:   "#4A6285", // muted text
  dim:  "#0F1C30", // dimmed backgrounds
  prot: "#2979FF", // protein — electric blue
  carb: "#00E676", // carbs   — vivid emerald
  fat:  "#FFD740", // fat     — vivid gold
  red:  "#FF4D6D", // error / danger
  white:"#FFFFFF",
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
  {r:"5–7%",   pct:6,  c:"#29B6F6",l:"Athletic",  desc:"Visible striations, very lean"},
  {r:"8–12%",  pct:10, c:"#00E676", l:"Fit",       desc:"Visible abs, athletic build"},
  {r:"13–17%", pct:15, c:"#2979FF", l:"Lean",      desc:"Defined, not shredded"},
  {r:"18–24%", pct:21, c:"#FFD740", l:"Average",   desc:"Soft, no visible abs"},
  {r:"25–30%", pct:27, c:"#FFA726", l:"Above avg", desc:"Rounded belly, soft arms"},
  {r:"31–40%", pct:35, c:"#EF6C00", l:"High",      desc:"Significant fat coverage"},
  {r:"40+%",   pct:43, c:"#FF4D6D", l:"Obese",     desc:"High health risk range"},
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
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#root{height:100%;background:${T.bg}}
  body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${T.bd};border-radius:2px}
  ::-webkit-scrollbar-thumb:hover{background:#2A3A5A}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes slideUp{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:translateY(0)}}
  @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes glowPulse{0%,100%{opacity:.3}50%{opacity:.7}}
  .grad-text{background:linear-gradient(135deg,#2979FF 0%,#00E676 50%,#FFD740 100%);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradientShift 4s ease infinite}
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
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.s3} strokeWidth={sw}/>
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
    <div style={{background:T.s2,borderRadius:12,padding:"13px 15px",marginBottom:8,border:`1px solid ${T.bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
        <span style={{color,fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{label}</span>
        <span style={{fontFamily:"monospace",fontSize:13,color:"#fff"}}>{consumed}g <span style={{color:T.mu}}>/ {target}g</span></span>
      </div>
      <div style={{height:4,background:T.s3,borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct*100}%`,background:color,borderRadius:2,transition:"width 0.5s"}}/>
      </div>
      <div style={{fontSize:10,color:T.mu,marginTop:4}}>{rem>0?`${rem}g remaining`:"✓ Hit"}</div>
    </div>
  );
}

export function Toggle({on,onChange,label,sub}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${T.bd}`}}>
      <div><div style={{fontSize:14,color:on?"#fff":T.mu}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.mu,marginTop:2}}>{sub}</div>}</div>
      <div onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:12,background:on?T.prot:T.s3,cursor:"pointer",display:"flex",alignItems:"center",padding:"0 3px",justifyContent:on?"flex-end":"flex-start",transition:"background 0.2s",boxSizing:"border-box",flexShrink:0,marginLeft:16}}>
        <div style={{width:18,height:18,borderRadius:9,background:"#fff"}}/>
      </div>
    </div>
  );
}

export function CC({label,sub,sel,onClick,icon,accent=T.prot}) {
  return (
    <div onClick={onClick} style={{background:sel?`${accent}08`:T.s2,border:`1.5px solid ${sel?accent:T.bd}`,borderRadius:12,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"border-color 0.15s"}}>
      {icon&&<div style={{fontSize:18,flexShrink:0}}>{icon}</div>}
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:sel?accent:"#fff"}}>{label}</div>{sub&&<div style={{fontSize:12,color:T.mu,marginTop:2,lineHeight:1.5}}>{sub}</div>}</div>
      <div style={{width:18,height:18,borderRadius:9,border:`2px solid ${sel?accent:T.dim}`,background:sel?accent:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {sel&&<div style={{width:7,height:7,borderRadius:4,background:"#000"}}/>}
      </div>
    </div>
  );
}

export function PrimaryBtn({onClick,label,disabled,style:sx={}}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{width:"100%",padding:"15px",background:disabled?T.s3:T.prot,color:disabled?T.mu:"#fff",fontWeight:700,fontSize:15,letterSpacing:.5,border:"none",borderRadius:11,cursor:disabled?"default":"pointer",textTransform:"uppercase",fontFamily:"inherit",transition:"opacity 0.2s",...sx}}>
      {label}
    </button>
  );
}

export function UnitToggle({opts,val,onChange}) {
  return (
    <div style={{display:"flex",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:3,marginBottom:18,width:"fit-content"}}>
      {opts.map(o=>(
        <button key={o.val} onClick={()=>onChange(o.val)} style={{padding:"7px 16px",borderRadius:7,border:"none",cursor:"pointer",background:val===o.val?T.prot:"none",color:val===o.val?"#fff":T.mu,fontWeight:600,fontSize:13,fontFamily:"inherit",transition:"all 0.2s"}}>
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
              color:i===li?"#fff":d===1?"#2A3A5A":"#162030",transition:"all 0.08s",fontVariantNumeric:"tabular-nums",cursor:"pointer"}}>
            {item}
          </div>
        );})}<div style={{height:itemH}}/>
      </div>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(${T.bg} 12%,transparent 36%,transparent 64%,${T.bg} 88%)`,pointerEvents:"none",zIndex:2}}/>
      <div style={{position:"absolute",top:itemH,left:4,right:4,height:itemH,borderTop:`1px solid ${T.prot}45`,borderBottom:`1px solid ${T.prot}45`,pointerEvents:"none",zIndex:1}}/>
    </div>
  );
}

export function SectionCard({title,children,action}) {
  return (
    <div style={{background:T.s1,borderRadius:16,border:`1px solid ${T.bd}`,overflow:"hidden",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.bd}`}}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:T.mu}}>{title}</div>
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
export function Logo({size=32,text=true}) {
  const bar=size*.42, gap=size*.08;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <svg width={bar*3+gap*2} height={size} viewBox={`0 0 ${bar*3+gap*2} ${size}`}>
        <rect x={0}          y={0}           width={bar} height={size}       rx={3} fill={T.prot}/>
        <rect x={bar+gap}    y={size*.22}    width={bar} height={size*.78}   rx={3} fill={T.carb}/>
        <rect x={(bar+gap)*2}y={size*.44}    width={bar} height={size*.56}   rx={3} fill={T.fat}/>
      </svg>
      {text&&<div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:size*.65,fontWeight:900,letterSpacing:3,color:"#fff",lineHeight:1}}>COACH</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:size*.65,fontWeight:900,letterSpacing:3,lineHeight:1}}>
          <span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:"#fff"}}>RO</span>
        </div>
      </div>}
    </div>
  );
}

// ─── ONBOARDING ───────────────────────────────────────────────────────────────

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

  const getVolume = (muscle) => {
    const map = {
      chest:      ["Push","Arnold A","Full Body","Upper","Chest+Triceps"],
      shoulders:  ["Push","Arnold A","Full Body","Upper","Shoulders+Arms"],
      biceps:     ["Pull","Arnold B","Full Body","Upper","Back+Biceps","Shoulders+Arms"],
      triceps:    ["Push","Arnold A","Full Body","Upper","Chest+Triceps","Shoulders+Arms"],
      forearms:   ["Pull","Arnold B","Full Body","Upper","Back+Biceps"],
      abs:        ["Full Body","Legs","Lower"],
      quads:      ["Legs","Full Body","Lower"],
      hamstrings: ["Legs","Full Body","Lower"],
      glutes:     ["Legs","Full Body","Lower"],
      calves:     ["Legs","Full Body","Lower"],
      lats:       ["Pull","Arnold B","Full Body","Upper","Back+Biceps"],
      traps:      ["Pull","Arnold B","Full Body","Upper"],
      rhomboids:  ["Pull","Arnold B","Full Body","Upper","Back+Biceps"],
      lower_back: ["Legs","Full Body","Lower"],
    };
    const focusDays = map[muscle] || [];
    const sessions = Object.values(dayFocus||{}).filter(f=>focusDays.includes(f)).length;
    return sessions * 3;
  };

  const getColor = (muscle) => {
    const sets = getVolume(muscle);
    if(sets === 0)  return "#2A3A50";      // inactive — dark blue-grey
    if(sets < 6)    return "#6B2D5E";      // low — dark purple
    if(sets < 10)   return "#C0392B";      // building — medium red
    if(sets <= 20)  return "#E8185A";      // optimal — bright red (like reference)
    return "#FF6B6B";                       // overreached
  };

  const getOpacity = (muscle) => {
    const sets = getVolume(muscle);
    return sets === 0 ? 0.35 : 0.9;
  };

  const sel = (m) => () => setSelected(selected===m?null:m);
  const isSelected = (m) => selected === m;
  const mc = (m) => isSelected(m) ? "#FF4D6D" : getColor(m);
  const mo = (m) => isSelected(m) ? 1 : getOpacity(m);

  const BODY_BASE = "#3D5A73";   // base body color — matches reference blue-grey
  const OUTLINE = "#2A4A5E";    // darker outline
  const LINE = "#1E3A52";       // muscle separation lines

  const status = (m) => {
    const s = getVolume(m);
    if(s===0) return {l:"Not trained this week",c:"#4A6080"};
    if(s<6)   return {l:`${s} sets — add more volume`,c:"#C0392B"};
    if(s<10)  return {l:`${s} sets — building up`,c:"#E8185A"};
    if(s<=20) return {l:`${s} sets — optimal ✓`,c:"#00E676"};
    return {l:`${s} sets — consider deload`,c:"#FFD740"};
  };

  return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"start"}}>
      <div>
        {/* View toggle */}
        <div style={{display:"flex",background:T.s3,borderRadius:10,padding:3,marginBottom:16,gap:3}}>
          {["front","back"].map(v=>(
            <button key={v} onClick={()=>{setView(v);setSelected(null);}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:view===v?T.prot:"none",color:view===v?"#fff":T.mu,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize",transition:"all .2s"}}>{v} view</button>
          ))}
        </div>

        {/* SVG — Front View */}
        {view==="front"&&(
          <svg viewBox="0 0 200 460" style={{width:"100%",maxWidth:280,display:"block",margin:"0 auto"}}>
            {/* ── BODY SILHOUETTE ── */}
            {/* Head */}
            <ellipse cx="100" cy="30" rx="22" ry="26" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* Neck */}
            <path d="M88,54 L88,68 Q100,72 112,68 L112,54 Q100,58 88,54Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Torso */}
            <path d="M58,68 Q42,74 36,90 L34,160 Q38,176 60,182 L68,220 L132,220 L140,182 Q162,176 166,160 L164,90 Q158,74 142,68 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* Hips */}
            <path d="M60,218 Q50,228 48,248 L56,280 L90,280 L96,248 L96,220 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M140,218 Q150,228 152,248 L144,280 L110,280 L104,248 L104,220 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Left arm upper */}
            <path d="M36,90 Q16,94 12,130 L16,168 Q30,172 44,162 L44,120 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* Right arm upper */}
            <path d="M164,90 Q184,94 188,130 L184,168 Q170,172 156,162 L156,120 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* Left forearm */}
            <path d="M16,168 Q10,200 12,228 L22,232 Q36,224 44,202 L44,162 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Right forearm */}
            <path d="M184,168 Q190,200 188,228 L178,232 Q164,224 156,202 L156,162 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Left hand */}
            <ellipse cx="14" cy="238" rx="9" ry="12" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Right hand */}
            <ellipse cx="186" cy="238" rx="9" ry="12" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Left quad */}
            <path d="M56,278 Q48,296 46,330 Q48,360 56,374 L80,374 Q90,360 92,330 Q92,296 90,278 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* Right quad */}
            <path d="M144,278 Q152,296 154,330 Q152,360 144,374 L120,374 Q110,360 108,330 Q108,296 110,278 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            {/* Knees */}
            <ellipse cx="68" cy="380" rx="16" ry="10" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="132" cy="380" rx="16" ry="10" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Left shin */}
            <path d="M53,388 Q50,414 52,440 L84,440 Q86,414 83,388 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Right shin */}
            <path d="M117,388 Q114,414 116,440 L148,440 Q150,414 147,388 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            {/* Feet */}
            <ellipse cx="65" cy="446" rx="16" ry="8" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="135" cy="446" rx="16" ry="8" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* ── MUSCLE GROUPS — FRONT ── */}

            {/* CHEST — left pec */}
            <path onClick={sel("chest")} style={{cursor:"pointer"}} d="M64,78 Q56,86 54,106 Q68,118 96,116 L96,90 Q82,82 64,78Z" fill={mc("chest")} opacity={mo("chest")} stroke={isSelected("chest")?"#FF4D6D":"none"} strokeWidth="1.5">
              <title>Chest</title></path>
            {/* CHEST — right pec */}
            <path onClick={sel("chest")} style={{cursor:"pointer"}} d="M136,78 Q144,86 146,106 Q132,118 104,116 L104,90 Q118,82 136,78Z" fill={mc("chest")} opacity={mo("chest")} stroke={isSelected("chest")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Chest separation line */}
            <line x1="100" y1="76" x2="100" y2="118" stroke={LINE} strokeWidth="1" opacity="0.6"/>
            {/* Lower chest curve */}
            <path d="M54,108 Q76,122 100,118 Q124,122 146,108" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>

            {/* SHOULDERS — left */}
            <path onClick={sel("shoulders")} style={{cursor:"pointer"}} d="M36,88 Q24,86 16,100 Q14,116 22,126 Q34,120 44,110 Z" fill={mc("shoulders")} opacity={mo("shoulders")} stroke={isSelected("shoulders")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* SHOULDERS — right */}
            <path onClick={sel("shoulders")} style={{cursor:"pointer"}} d="M164,88 Q176,86 184,100 Q186,116 178,126 Q166,120 156,110 Z" fill={mc("shoulders")} opacity={mo("shoulders")} stroke={isSelected("shoulders")?"#FF4D6D":"none"} strokeWidth="1.5"/>

            {/* BICEPS — left */}
            <path onClick={sel("biceps")} style={{cursor:"pointer"}} d="M18,108 Q10,120 12,144 Q22,152 38,144 L40,118 Z" fill={mc("biceps")} opacity={mo("biceps")} stroke={isSelected("biceps")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* BICEPS — right */}
            <path onClick={sel("biceps")} style={{cursor:"pointer"}} d="M182,108 Q190,120 188,144 Q178,152 162,144 L160,118 Z" fill={mc("biceps")} opacity={mo("biceps")} stroke={isSelected("biceps")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Bicep peak line */}
            <path d="M18,122 Q24,118 34,122" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.5"/>
            <path d="M182,122 Q176,118 166,122" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.5"/>

            {/* TRICEPS — left (visible from front at side) */}
            <path onClick={sel("triceps")} style={{cursor:"pointer"}} d="M12,128 Q8,148 10,168 L18,170 Q24,152 26,132 Z" fill={mc("triceps")} opacity={mo("triceps")*0.7} stroke="none"/>
            {/* TRICEPS — right */}
            <path onClick={sel("triceps")} style={{cursor:"pointer"}} d="M188,128 Q192,148 190,168 L182,170 Q176,152 174,132 Z" fill={mc("triceps")} opacity={mo("triceps")*0.7} stroke="none"/>

            {/* FOREARMS — left */}
            <path onClick={sel("forearms")} style={{cursor:"pointer"}} d="M12,170 Q8,196 10,224 L22,228 Q30,204 34,172 Z" fill={mc("forearms")} opacity={mo("forearms")} stroke={isSelected("forearms")?"#FF4D6D":"none"} strokeWidth="1"/>
            {/* FOREARMS — right */}
            <path onClick={sel("forearms")} style={{cursor:"pointer"}} d="M188,170 Q192,196 190,224 L178,228 Q170,204 166,172 Z" fill={mc("forearms")} opacity={mo("forearms")} stroke={isSelected("forearms")?"#FF4D6D":"none"} strokeWidth="1"/>

            {/* ABS */}
            <path onClick={sel("abs")} style={{cursor:"pointer"}} d="M68,118 Q64,136 64,162 Q80,170 100,170 Q120,170 136,162 Q136,136 132,118 Q116,126 100,126 Q84,126 68,118Z" fill={mc("abs")} opacity={mo("abs")} stroke={isSelected("abs")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Ab lines */}
            <line x1="100" y1="126" x2="100" y2="170" stroke={LINE} strokeWidth="1" opacity="0.6"/>
            <path d="M68,138 Q84,143 100,141 Q116,143 132,138" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            <path d="M66,152 Q82,157 100,155 Q118,157 134,152" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            <path d="M66,165 Q82,169 100,168 Q118,169 134,165" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>
            {/* Obliques */}
            <path d="M64,130 Q60,150 62,170" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.4"/>
            <path d="M136,130 Q140,150 138,170" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.4"/>

            {/* TRAPS front (small visible portion) */}
            <path onClick={sel("traps")} style={{cursor:"pointer"}} d="M88,68 Q80,72 70,78 Q78,80 100,80 Q122,80 130,78 Q120,72 112,68 Z" fill={mc("traps")} opacity={mo("traps")*0.6} stroke="none"/>

            {/* QUADS — left (4 heads visible) */}
            <path onClick={sel("quads")} style={{cursor:"pointer"}} d="M56,280 Q46,300 46,334 Q50,360 60,372 L82,372 Q90,358 92,332 Q92,298 88,280 Z" fill={mc("quads")} opacity={mo("quads")} stroke={isSelected("quads")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Quad separation lines */}
            <path d="M62,285 Q66,320 68,368" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            <path d="M74,282 Q76,318 76,370" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>
            <path d="M82,284 Q84,320 82,368" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>

            {/* QUADS — right */}
            <path onClick={sel("quads")} style={{cursor:"pointer"}} d="M144,280 Q154,300 154,334 Q150,360 140,372 L118,372 Q110,358 108,332 Q108,298 112,280 Z" fill={mc("quads")} opacity={mo("quads")} stroke={isSelected("quads")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            <path d="M138,285 Q134,320 132,368" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            <path d="M126,282 Q124,318 124,370" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>

            {/* CALVES — left (shin/tibialis) */}
            <path onClick={sel("calves")} style={{cursor:"pointer"}} d="M54,390 Q50,416 52,438 L82,438 Q85,416 83,390 Z" fill={mc("calves")} opacity={mo("calves")} stroke={isSelected("calves")?"#FF4D6D":"none"} strokeWidth="1"/>
            <path d="M62,392 Q62,420 64,436" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>

            {/* CALVES — right */}
            <path onClick={sel("calves")} style={{cursor:"pointer"}} d="M146,390 Q150,416 148,438 L118,438 Q115,416 117,390 Z" fill={mc("calves")} opacity={mo("calves")} stroke={isSelected("calves")?"#FF4D6D":"none"} strokeWidth="1"/>

            {/* Selected muscle highlight ring */}
            {selected&&<text x="100" y="458" textAnchor="middle" fill="#E8185A" fontSize="9" fontWeight="700">{selected.replace("_"," ").toUpperCase()}</text>}
          </svg>
        )}

        {/* SVG — Back View */}
        {view==="back"&&(
          <svg viewBox="0 0 200 460" style={{width:"100%",maxWidth:280,display:"block",margin:"0 auto"}}>
            {/* ── BODY SILHOUETTE BACK ── */}
            <ellipse cx="100" cy="30" rx="22" ry="26" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <path d="M88,54 L88,68 Q100,72 112,68 L112,54 Q100,58 88,54Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M58,68 Q42,74 36,90 L34,160 Q38,176 60,182 L68,220 L132,220 L140,182 Q162,176 166,160 L164,90 Q158,74 142,68 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <path d="M60,218 Q48,230 46,252 L54,280 L92,280 L96,248 L96,220 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M140,218 Q152,230 154,252 L146,280 L108,280 L104,248 L104,220 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M36,90 Q16,94 12,130 L16,168 Q30,172 44,162 L44,120 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <path d="M164,90 Q184,94 188,130 L184,168 Q170,172 156,162 L156,120 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <path d="M16,168 Q10,200 12,228 L22,232 Q36,224 44,202 L44,162 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M184,168 Q190,200 188,228 L178,232 Q164,224 156,202 L156,162 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="14" cy="238" rx="9" ry="12" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="186" cy="238" rx="9" ry="12" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M56,278 Q46,298 44,334 Q46,362 56,376 L82,376 Q90,360 90,332 Q90,298 90,278 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <path d="M144,278 Q154,298 156,334 Q154,362 144,376 L118,376 Q110,360 110,332 Q110,298 110,278 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1.5"/>
            <ellipse cx="68" cy="382" rx="16" ry="10" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="132" cy="382" rx="16" ry="10" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M53,390 Q50,416 52,440 L84,440 Q86,416 83,390 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <path d="M117,390 Q114,416 116,440 L148,440 Q150,416 147,390 Z" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="65" cy="446" rx="16" ry="8" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>
            <ellipse cx="135" cy="446" rx="16" ry="8" fill={BODY_BASE} stroke={OUTLINE} strokeWidth="1"/>

            {/* ── MUSCLE GROUPS — BACK ── */}

            {/* TRAPS — upper (diamond shape) */}
            <path onClick={sel("traps")} style={{cursor:"pointer"}} d="M78,68 Q70,74 60,84 Q80,92 100,88 Q120,92 140,84 Q130,74 122,68 Q110,76 100,76 Q90,76 78,68Z" fill={mc("traps")} opacity={mo("traps")} stroke={isSelected("traps")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Trap spine line */}
            <line x1="100" y1="76" x2="100" y2="88" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>

            {/* REAR DELTOIDS — left */}
            <path onClick={sel("shoulders")} style={{cursor:"pointer"}} d="M36,88 Q24,86 16,102 Q16,118 26,126 Q38,118 46,106 Z" fill={mc("shoulders")} opacity={mo("shoulders")} stroke={isSelected("shoulders")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* REAR DELTOIDS — right */}
            <path onClick={sel("shoulders")} style={{cursor:"pointer"}} d="M164,88 Q176,86 184,102 Q184,118 174,126 Q162,118 154,106 Z" fill={mc("shoulders")} opacity={mo("shoulders")} stroke={isSelected("shoulders")?"#FF4D6D":"none"} strokeWidth="1.5"/>

            {/* LATS — left (big triangular fan) */}
            <path onClick={sel("lats")} style={{cursor:"pointer"}} d="M60,86 Q40,96 36,120 Q36,148 44,166 Q62,172 80,166 Q88,148 90,120 Q88,96 80,86 Z" fill={mc("lats")} opacity={mo("lats")} stroke={isSelected("lats")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* LATS — right */}
            <path onClick={sel("lats")} style={{cursor:"pointer"}} d="M140,86 Q160,96 164,120 Q164,148 156,166 Q138,172 120,166 Q112,148 110,120 Q112,96 120,86 Z" fill={mc("lats")} opacity={mo("lats")} stroke={isSelected("lats")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Lat fan lines */}
            <path d="M62,90 Q52,112 50,148" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.4"/>
            <path d="M70,86 Q64,110 64,152" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>
            <path d="M138,90 Q148,112 150,148" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.4"/>
            <path d="M130,86 Q136,110 136,152" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>

            {/* RHOMBOIDS / MID BACK */}
            <path onClick={sel("rhomboids")} style={{cursor:"pointer"}} d="M80,86 Q76,96 76,112 Q88,118 100,116 Q112,118 124,112 Q124,96 120,86 Q110,94 100,94 Q90,94 80,86Z" fill={mc("rhomboids")} opacity={mo("rhomboids")} stroke={isSelected("rhomboids")?"#FF4D6D":"none"} strokeWidth="1"/>
            {/* Mid back line */}
            <line x1="100" y1="94" x2="100" y2="166" stroke={LINE} strokeWidth="1" opacity="0.5"/>

            {/* TRICEPS — left (full view from back) */}
            <path onClick={sel("triceps")} style={{cursor:"pointer"}} d="M16,106 Q8,122 10,152 Q20,160 36,152 L40,120 Q28,112 16,106Z" fill={mc("triceps")} opacity={mo("triceps")} stroke={isSelected("triceps")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            {/* Tricep head separation */}
            <path d="M18,120 Q26,128 34,124" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            <path d="M14,138 Q22,134 32,138" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>
            {/* TRICEPS — right */}
            <path onClick={sel("triceps")} style={{cursor:"pointer"}} d="M184,106 Q192,122 190,152 Q180,160 164,152 L160,120 Q172,112 184,106Z" fill={mc("triceps")} opacity={mo("triceps")} stroke={isSelected("triceps")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            <path d="M182,120 Q174,128 166,124" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>

            {/* FOREARMS — back */}
            <path onClick={sel("forearms")} style={{cursor:"pointer"}} d="M10,156 Q6,186 8,222 L20,226 Q30,200 36,164 Z" fill={mc("forearms")} opacity={mo("forearms")} stroke={isSelected("forearms")?"#FF4D6D":"none"} strokeWidth="1"/>
            <path onClick={sel("forearms")} style={{cursor:"pointer"}} d="M190,156 Q194,186 192,222 L180,226 Q170,200 164,164 Z" fill={mc("forearms")} opacity={mo("forearms")} stroke={isSelected("forearms")?"#FF4D6D":"none"} strokeWidth="1"/>

            {/* LOWER BACK / ERECTORS */}
            <path onClick={sel("lower_back")} style={{cursor:"pointer"}} d="M80,162 Q76,178 76,202 Q88,212 100,210 Q112,212 124,202 Q124,178 120,162 Q110,170 100,170 Q90,170 80,162Z" fill={mc("lower_back")} opacity={mo("lower_back")} stroke={isSelected("lower_back")?"#FF4D6D":"none"} strokeWidth="1"/>
            <line x1="100" y1="170" x2="100" y2="210" stroke={LINE} strokeWidth="1" opacity="0.5"/>
            <path d="M86,175 Q88,190 88,208" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>
            <path d="M114,175 Q112,190 112,208" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>

            {/* GLUTES */}
            <path onClick={sel("glutes")} style={{cursor:"pointer"}} d="M62,216 Q48,228 46,256 Q50,276 66,280 Q80,282 92,274 Q100,264 100,252 Q100,232 96,218 Z" fill={mc("glutes")} opacity={mo("glutes")} stroke={isSelected("glutes")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            <path onClick={sel("glutes")} style={{cursor:"pointer"}} d="M138,216 Q152,228 154,256 Q150,276 134,280 Q120,282 108,274 Q100,264 100,252 Q100,232 104,218 Z" fill={mc("glutes")} opacity={mo("glutes")} stroke={isSelected("glutes")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            <line x1="100" y1="218" x2="100" y2="280" stroke={LINE} strokeWidth="1" opacity="0.5"/>
            {/* Glute crease */}
            <path d="M48,264 Q68,272 100,268 Q132,272 152,264" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.4"/>

            {/* HAMSTRINGS — left */}
            <path onClick={sel("hamstrings")} style={{cursor:"pointer"}} d="M54,280 Q44,300 44,336 Q46,362 56,378 L82,378 Q90,362 90,334 Q90,300 90,280 Z" fill={mc("hamstrings")} opacity={mo("hamstrings")} stroke={isSelected("hamstrings")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            <path d="M62,284 Q60,320 62,372" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            <path d="M72,282 Q72,318 74,372" fill="none" stroke={LINE} strokeWidth="0.7" opacity="0.4"/>
            {/* HAMSTRINGS — right */}
            <path onClick={sel("hamstrings")} style={{cursor:"pointer"}} d="M146,280 Q156,300 156,336 Q154,362 144,378 L118,378 Q110,362 110,334 Q110,300 110,280 Z" fill={mc("hamstrings")} opacity={mo("hamstrings")} stroke={isSelected("hamstrings")?"#FF4D6D":"none"} strokeWidth="1.5"/>
            <path d="M138,284 Q140,320 138,372" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>

            {/* CALVES — back (gastrocnemius — the diamond shape) */}
            <path onClick={sel("calves")} style={{cursor:"pointer"}} d="M52,390 Q48,408 50,428 Q58,440 68,438 L80,436 Q84,422 84,402 Q80,390 70,388 Z" fill={mc("calves")} opacity={mo("calves")} stroke={isSelected("calves")?"#FF4D6D":"none"} strokeWidth="1"/>
            {/* Calf split */}
            <path d="M66,392 Q64,414 66,434" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>
            {/* CALVES — right */}
            <path onClick={sel("calves")} style={{cursor:"pointer"}} d="M148,390 Q152,408 150,428 Q142,440 132,438 L120,436 Q116,422 116,402 Q120,390 130,388 Z" fill={mc("calves")} opacity={mo("calves")} stroke={isSelected("calves")?"#FF4D6D":"none"} strokeWidth="1"/>
            <path d="M134,392 Q136,414 134,434" fill="none" stroke={LINE} strokeWidth="0.8" opacity="0.5"/>

            {selected&&<text x="100" y="458" textAnchor="middle" fill="#E8185A" fontSize="9" fontWeight="700">{selected.replace("_"," ").toUpperCase()}</text>}
          </svg>
        )}

        {/* Selected muscle info */}
        {selected&&(
          <div style={{background:T.s2,border:`1px solid ${status(selected).c}30`,borderRadius:12,padding:"12px 16px",marginTop:12,textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",textTransform:"capitalize",marginBottom:4}}>{selected.replace("_"," ")}</div>
            <div style={{fontSize:13,color:status(selected).c,fontWeight:600}}>{status(selected).l}</div>
          </div>
        )}
        {!selected&&<div style={{textAlign:"center",marginTop:8,fontSize:11,color:T.mu}}>Tap any muscle to see volume status</div>}
      </div>

      {/* Volume bars list */}
      <div>
        <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Weekly Volume</div>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {[
            {m:"chest",    label:"Chest"},
            {m:"shoulders",label:"Shoulders"},
            {m:"lats",     label:"Lats"},
            {m:"traps",    label:"Traps"},
            {m:"rhomboids",label:"Rhomboids"},
            {m:"lower_back",label:"Lower Back"},
            {m:"biceps",   label:"Biceps"},
            {m:"triceps",  label:"Triceps"},
            {m:"forearms", label:"Forearms"},
            {m:"abs",      label:"Abs / Core"},
            {m:"quads",    label:"Quads"},
            {m:"hamstrings",label:"Hamstrings"},
            {m:"glutes",   label:"Glutes"},
            {m:"calves",   label:"Calves"},
          ].map(({m,label})=>{
            const sets=getVolume(m);
            const pct=Math.min(sets/20,1);
            const optimal=sets>=10&&sets<=20;
            const low=sets>0&&sets<10;
            const c=optimal?"#E8185A":low?"#C0392B":sets===0?"#2A3A50":"#6B2D5E";
            const isThisSel=selected===m;
            return(
              <div key={m} onClick={()=>setSelected(isThisSel?null:m)} style={{padding:"9px 0",borderBottom:`1px solid ${T.dim}`,cursor:"pointer",background:isThisSel?`${T.prot}05`:"transparent",transition:"background .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:600,color:isThisSel?"#E8185A":"#ccc",textTransform:"capitalize"}}>{label}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {optimal&&<span style={{fontSize:9,color:"#00E676",background:"rgba(0,230,118,.08)",border:"1px solid rgba(0,230,118,.15)",borderRadius:6,padding:"1px 7px",fontWeight:700}}>✓ Optimal</span>}
                    {low&&<span style={{fontSize:9,color:"#C0392B",background:"rgba(192,57,43,.08)",border:"1px solid rgba(192,57,43,.2)",borderRadius:6,padding:"1px 7px",fontWeight:700}}>Need more</span>}
                    <span style={{fontSize:12,fontWeight:700,color:sets===0?T.dim:c}}>{sets===0?"—":`${sets} sets`}</span>
                  </div>
                </div>
                <div style={{height:4,background:T.s3,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct*100}%`,background:c,borderRadius:2,transition:"width .5s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div style={{marginTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[{c:"#E8185A",l:"Optimal (10–20)"},{c:"#C0392B",l:"Building (6–9)"},{c:"#6B2D5E",l:"Low (1–5)"},{c:"#2A3A50",l:"Not trained"}].map(({c,l})=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:10,height:10,borderRadius:2,background:c,flexShrink:0}}/>
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
