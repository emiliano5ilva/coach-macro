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
  const [view, setView] = useState("front"); // front | back

  // Calculate volume per muscle from this week's schedule
  const getVolume = (muscle) => {
    const muscleToFocus = {
      chest:    ["Push","Arnold A","Full Body","Chest+Triceps","Upper"],
      shoulders:["Push","Arnold A","Full Body","Shoulders+Arms","Upper"],
      triceps:  ["Push","Arnold A","Full Body","Chest+Triceps","Shoulders+Arms","Upper"],
      biceps:   ["Pull","Arnold B","Full Body","Back+Biceps","Shoulders+Arms","Upper"],
      back:     ["Pull","Arnold B","Full Body","Back+Biceps","Upper"],
      traps:    ["Pull","Arnold B","Full Body","Upper"],
      core:     ["Full Body","Legs","Lower"],
      quads:    ["Legs","Full Body","Lower"],
      hamstrings:["Legs","Full Body","Lower"],
      glutes:   ["Legs","Full Body","Lower"],
      calves:   ["Legs","Full Body","Lower"],
      forearms: ["Pull","Arnold B","Full Body","Back+Biceps","Upper"],
    };
    const focusDays = muscleToFocus[muscle] || [];
    const sessions = Object.values(dayFocus||{}).filter(f => focusDays.includes(f)).length;
    return sessions * 3; // ~3 sets per session
  };

  const getColor = (muscle) => {
    const sets = getVolume(muscle);
    if (sets === 0) return "#1A1A2E";
    if (sets < 6)  return "#4A1942";   // low — purple tint
    if (sets < 10) return "#8B1A6B";   // getting there — pink
    if (sets <= 20) return "#E8185A";  // optimal — red (like Fitbod)
    return "#FF4D6D";                  // overreached — bright red
  };

  const getStatus = (muscle) => {
    const sets = getVolume(muscle);
    if (sets === 0) return {label:"Not trained",color:"#444"};
    if (sets < 6)  return {label:`${sets} sets — needs more`,color:"#8B1A6B"};
    if (sets < 10) return {label:`${sets} sets — building`,color:"#E8185A"};
    if (sets <= 20) return {label:`${sets} sets — optimal ✓`,color:"#00E676"};
    return {label:`${sets} sets — deload soon`,color:"#FF4D6D"};
  };

  const muscles = ["chest","shoulders","triceps","biceps","back","traps","core","quads","hamstrings","glutes","calves","forearms"];

  return (
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:24,alignItems:"start"}}>
      {/* Figure + controls */}
      <div>
        {/* View toggle */}
        <div style={{display:"flex",background:T.s3,borderRadius:10,padding:3,marginBottom:16,gap:3}}>
          {["front","back"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",background:view===v?T.prot:"none",color:view===v?"#fff":T.mu,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize",transition:"all .2s"}}>{v}</button>
          ))}
        </div>

        {/* SVG anatomical figure */}
        <div style={{position:"relative",margin:"0 auto",maxWidth:240}}>
          {view==="front" ? (
            <svg viewBox="0 0 200 420" style={{width:"100%",height:"auto"}}>
              {/* HEAD */}
              <ellipse cx="100" cy="28" rx="22" ry="26" fill="#2A2A3E" stroke="#333" strokeWidth="1"/>
              {/* NECK */}
              <rect x="91" y="52" width="18" height="16" rx="4" fill="#2A2A3E"/>
              {/* TRAPS */}
              <path d="M78,58 Q100,52 122,58 L126,74 Q100,68 74,74 Z" fill={getColor("traps")} onClick={()=>setSelected("traps")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* CHEST — left */}
              <path d="M74,74 Q68,82 68,98 Q80,104 100,102 Q100,86 94,76 Z" fill={getColor("chest")} onClick={()=>setSelected("chest")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* CHEST — right */}
              <path d="M126,74 Q132,82 132,98 Q120,104 100,102 Q100,86 106,76 Z" fill={getColor("chest")} onClick={()=>setSelected("chest")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* SHOULDERS — left */}
              <ellipse cx="62" cy="78" rx="14" ry="16" fill={getColor("shoulders")} onClick={()=>setSelected("shoulders")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* SHOULDERS — right */}
              <ellipse cx="138" cy="78" rx="14" ry="16" fill={getColor("shoulders")} onClick={()=>setSelected("shoulders")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* BICEPS — left */}
              <path d="M50,92 Q42,108 44,128 Q52,132 60,128 Q62,108 66,94 Z" fill={getColor("biceps")} onClick={()=>setSelected("biceps")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* BICEPS — right */}
              <path d="M150,92 Q158,108 156,128 Q148,132 140,128 Q138,108 134,94 Z" fill={getColor("biceps")} onClick={()=>setSelected("biceps")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* TRICEPS — left (side) */}
              <path d="M46,92 Q36,110 38,132 Q42,134 46,130 Q44,110 52,92 Z" fill={getColor("triceps")} onClick={()=>setSelected("triceps")} style={{cursor:"pointer",transition:"fill .3s"}} opacity="0.7"/>
              {/* TRICEPS — right (side) */}
              <path d="M154,92 Q164,110 162,132 Q158,134 154,130 Q156,110 148,92 Z" fill={getColor("triceps")} onClick={()=>setSelected("triceps")} style={{cursor:"pointer",transition:"fill .3s"}} opacity="0.7"/>
              {/* FOREARMS — left */}
              <path d="M44,130 Q38,148 40,168 Q48,172 56,168 Q58,148 60,130 Z" fill={getColor("forearms")} onClick={()=>setSelected("forearms")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* FOREARMS — right */}
              <path d="M156,130 Q162,148 160,168 Q152,172 144,168 Q142,148 140,130 Z" fill={getColor("forearms")} onClick={()=>setSelected("forearms")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* ABS / CORE */}
              <path d="M80,102 Q74,110 74,148 Q88,154 100,154 Q112,154 126,148 Q126,110 120,102 Q100,108 80,102 Z" fill={getColor("core")} onClick={()=>setSelected("core")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* Ab lines */}
              <line x1="100" y1="102" x2="100" y2="154" stroke="#111" strokeWidth="1.5" opacity="0.5"/>
              <line x1="78" y1="120" x2="122" y2="120" stroke="#111" strokeWidth="1" opacity="0.4"/>
              <line x1="78" y1="134" x2="122" y2="134" stroke="#111" strokeWidth="1" opacity="0.4"/>
              <line x1="80" y1="148" x2="120" y2="148" stroke="#111" strokeWidth="1" opacity="0.3"/>
              {/* HIP/GROIN */}
              <path d="M74,148 Q78,162 100,166 Q122,162 126,148 Z" fill="#1E1E2E"/>
              {/* QUADS — left */}
              <path d="M76,164 Q68,182 68,214 Q80,220 92,216 Q96,184 98,164 Z" fill={getColor("quads")} onClick={()=>setSelected("quads")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* QUADS — right */}
              <path d="M124,164 Q132,182 132,214 Q120,220 108,216 Q104,184 102,164 Z" fill={getColor("quads")} onClick={()=>setSelected("quads")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* Quad separation line */}
              <line x1="87" y1="168" x2="82" y2="214" stroke="#111" strokeWidth="1" opacity="0.3"/>
              <line x1="113" y1="168" x2="118" y2="214" stroke="#111" strokeWidth="1" opacity="0.3"/>
              {/* KNEE */}
              <ellipse cx="83" cy="222" rx="12" ry="10" fill="#1E1E2E" stroke="#333" strokeWidth="1"/>
              <ellipse cx="117" cy="222" rx="12" ry="10" fill="#1E1E2E" stroke="#333" strokeWidth="1"/>
              {/* CALVES — left */}
              <path d="M72,230 Q68,254 70,280 Q80,286 90,280 Q92,254 92,230 Z" fill={getColor("calves")} onClick={()=>setSelected("calves")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* CALVES — right */}
              <path d="M128,230 Q132,254 130,280 Q120,286 110,280 Q108,254 108,230 Z" fill={getColor("calves")} onClick={()=>setSelected("calves")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* FEET */}
              <ellipse cx="81" cy="286" rx="13" ry="7" fill="#1A1A2E"/>
              <ellipse cx="119" cy="286" rx="13" ry="7" fill="#1A1A2E"/>
            </svg>
          ) : (
            <svg viewBox="0 0 200 420" style={{width:"100%",height:"auto"}}>
              {/* HEAD back */}
              <ellipse cx="100" cy="28" rx="22" ry="26" fill="#2A2A3E" stroke="#333" strokeWidth="1"/>
              <rect x="91" y="52" width="18" height="16" rx="4" fill="#2A2A3E"/>
              {/* TRAPS — back (bigger, more prominent) */}
              <path d="M74,58 Q100,48 126,58 L130,80 Q100,72 70,80 Z" fill={getColor("traps")} onClick={()=>setSelected("traps")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* REAR DELTS */}
              <ellipse cx="62" cy="80" rx="14" ry="16" fill={getColor("shoulders")} onClick={()=>setSelected("shoulders")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              <ellipse cx="138" cy="80" rx="14" ry="16" fill={getColor("shoulders")} onClick={()=>setSelected("shoulders")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* LATS */}
              <path d="M70,80 Q62,100 64,128 Q80,136 100,134 Q100,110 94,80 Z" fill={getColor("back")} onClick={()=>setSelected("back")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              <path d="M130,80 Q138,100 136,128 Q120,136 100,134 Q100,110 106,80 Z" fill={getColor("back")} onClick={()=>setSelected("back")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* RHOMBOIDS / MID BACK */}
              <path d="M80,80 Q100,76 120,80 L118,108 Q100,112 82,108 Z" fill={getColor("back")} onClick={()=>setSelected("back")} style={{cursor:"pointer",transition:"fill .3s"}} opacity="0.85"/>
              {/* Back line */}
              <line x1="100" y1="76" x2="100" y2="134" stroke="#111" strokeWidth="1.5" opacity="0.4"/>
              {/* TRICEPS — back */}
              <path d="M50,88 Q40,110 42,134 Q48,136 54,134 Q52,110 58,88 Z" fill={getColor("triceps")} onClick={()=>setSelected("triceps")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              <path d="M150,88 Q160,110 158,134 Q152,136 146,134 Q148,110 142,88 Z" fill={getColor("triceps")} onClick={()=>setSelected("triceps")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* FOREARMS back */}
              <path d="M42,136 Q36,154 38,174 Q46,178 54,174 Q56,154 56,136 Z" fill={getColor("forearms")} onClick={()=>setSelected("forearms")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              <path d="M158,136 Q164,154 162,174 Q154,178 146,174 Q144,154 144,136 Z" fill={getColor("forearms")} onClick={()=>setSelected("forearms")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* LOWER BACK */}
              <path d="M80,130 Q76,148 78,160 Q100,164 122,160 Q124,148 120,130 Q100,136 80,130 Z" fill={getColor("core")} onClick={()=>setSelected("core")} style={{cursor:"pointer",transition:"fill .3s"}} opacity="0.7"/>
              {/* GLUTES */}
              <path d="M76,160 Q72,178 76,196 Q100,204 124,196 Q128,178 124,160 Q100,168 76,160 Z" fill={getColor("glutes")} onClick={()=>setSelected("glutes")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              <line x1="100" y1="160" x2="100" y2="204" stroke="#111" strokeWidth="1.5" opacity="0.4"/>
              {/* HAMSTRINGS — left */}
              <path d="M76,200 Q68,222 70,248 Q82,254 92,248 Q94,222 90,200 Z" fill={getColor("hamstrings")} onClick={()=>setSelected("hamstrings")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* HAMSTRINGS — right */}
              <path d="M124,200 Q132,222 130,248 Q118,254 108,248 Q106,222 110,200 Z" fill={getColor("hamstrings")} onClick={()=>setSelected("hamstrings")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* CALVES — back */}
              <path d="M72,254 Q68,276 70,296 Q80,302 90,296 Q92,276 90,254 Z" fill={getColor("calves")} onClick={()=>setSelected("calves")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              <path d="M128,254 Q132,276 130,296 Q120,302 110,296 Q108,276 110,254 Z" fill={getColor("calves")} onClick={()=>setSelected("calves")} style={{cursor:"pointer",transition:"fill .3s"}}/>
              {/* FEET */}
              <ellipse cx="81" cy="302" rx="13" ry="7" fill="#1A1A2E"/>
              <ellipse cx="119" cy="302" rx="13" ry="7" fill="#1A1A2E"/>
            </svg>
          )}

          {/* Selected muscle label */}
          {selected&&<div style={{textAlign:"center",marginTop:8,padding:"8px 16px",background:T.s2,borderRadius:10,border:`1px solid ${getColor(selected)}40`}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",textTransform:"capitalize",marginBottom:2}}>{selected}</div>
            <div style={{fontSize:12,color:getStatus(selected).color,fontWeight:600}}>{getStatus(selected).label}</div>
          </div>}
        </div>
      </div>

      {/* Muscle list with volume bars */}
      <div>
        <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Weekly Volume</div>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {muscles.map(m=>{
            const sets=getVolume(m);
            const pct=Math.min(sets/20,1);
            const isOptimal=sets>=10&&sets<=20;
            const needsMore=sets<10&&sets>0;
            const notTrained=sets===0;
            const color=isOptimal?"#E8185A":needsMore?"#8B1A6B":"#1A1A2E";
            return(
              <div key={m} onClick={()=>setSelected(m)} style={{padding:"10px 0",borderBottom:`1px solid ${T.dim}`,cursor:"pointer",transition:"background .2s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,color:selected===m?"#E8185A":"#ccc",textTransform:"capitalize"}}>{m}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {isOptimal&&<span style={{fontSize:9,color:"#00E676",background:"rgba(0,230,118,.1)",border:"1px solid rgba(0,230,118,.2)",borderRadius:6,padding:"1px 6px",fontWeight:700}}>✓ Optimal</span>}
                    {needsMore&&<span style={{fontSize:9,color:"#8B1A6B",background:"rgba(139,26,107,.1)",border:"1px solid rgba(139,26,107,.2)",borderRadius:6,padding:"1px 6px",fontWeight:700}}>Low</span>}
                    <span style={{fontSize:12,fontWeight:700,color:notTrained?T.dim:isOptimal?"#E8185A":"#888"}}>{notTrained?"—":`${sets} sets`}</span>
                  </div>
                </div>
                <div style={{height:4,background:T.s3,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct*100}%`,background:isOptimal?"#E8185A":needsMore?"#8B1A6B":"#333",borderRadius:2,transition:"width .6s ease"}}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Legend</div>
          {[{c:"#E8185A",l:"Optimal (10–20 sets)"},{c:"#8B1A6B",l:"Building (6–9 sets)"},{c:"#4A1942",l:"Low (1–5 sets)"},{c:"#1A1A2E",l:"Not trained"}].map(({c,l})=>(
            <div key={l} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:12,height:12,borderRadius:2,background:c,flexShrink:0}}/>
              <span style={{fontSize:11,color:T.mu}}>{l}</span>
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
