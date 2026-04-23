import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const sb = createClient(
  "https://oxxihlwqukbakmnnavuy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eGlobHdxdWtiYWttbm5hdnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTc3OTUsImV4cCI6MjA5MjQ5Mzc5NX0.IIK9gfRtgVidt6dShxAn6OCVNxIvdbFSFDYzWgVNFbk"
);

// ─── STRIPE PAYMENT LINKS ─────────────────────────────────────────────────────
// Replace these two URLs with your actual Stripe Payment Links
const STRIPE = {
  annual:  "https://buy.stripe.com/test_4gM8wQaGPepKaiQ83l7wA00",   // line 6 — paste your $19.99/yr link here
  monthly: "https://buy.stripe.com/test_6oU6oI4ir4PafDa5Vd7wA01",  // line 7 — paste your $4.99/mo link here
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
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
const WDAYS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const MONTHS_A = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_A   = Array.from({length:31},(_,i)=>String(i+1));
const YEARS_A  = Array.from({length:85},(_,i)=>String(new Date().getFullYear()-13-i));
const FT_A     = ["4","5","6","7"];
const IN_A     = Array.from({length:12},(_,i)=>String(i));
const CM_A     = Array.from({length:121},(_,i)=>String(120+i));
const LBS_A    = Array.from({length:421},(_,i)=>String(80+i));
const KG_A     = Array.from({length:226},(_,i)=>String(35+i));

const BF_DATA = [
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

const FOCUS_MUSCLES = {
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

const SPLIT_CYCLES = {
  "Push/Pull/Legs":  ["Push","Pull","Legs"],
  "Upper/Lower":     ["Upper","Lower"],
  "Full Body":       ["Full Body"],
  "Bro Split":       ["Chest","Back","Shoulders","Arms","Legs"],
  "Arnold Split":    ["Chest & Back","Shoulders & Arms","Legs"],
};

const DAY_CFG = {
  training:{label:"Training", emoji:"💪", color:T.prot, bg:`${T.prot}18`},
  cardio:  {label:"Cardio",   emoji:"🏃", color:T.carb, bg:`${T.carb}18`},
  run:     {label:"Run",      emoji:"👟", color:"#29B6F6", bg:"#29B6F618"},
  hyrox:   {label:"Hyrox",    emoji:"🔥", color:T.fat,  bg:`${T.fat}18`},
  rest:    {label:"Rest",     emoji:"😴", color:T.mu,   bg:"#4A628518"},
};

const FASTING_PROTOCOLS = [
  {id:"16:8",  label:"16:8",   fast:16, desc:"Skip breakfast"},
  {id:"18:6",  label:"18:6",   fast:18, desc:"Smaller eating window"},
  {id:"20:4",  label:"20:4",   fast:20, desc:"One large meal window"},
  {id:"omad",  label:"OMAD",   fast:23, desc:"One meal a day"},
  {id:"custom",label:"Custom", fast:0,  desc:"Set your own window"},
];

const MUSCLE_COVERAGE = {
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

const RUN_PLANS = {
  "5K Beginner":   {weeks:8,  desc:"Walk-to-run, 3 sessions/week"},
  "10K":           {weeks:10, desc:"Base fitness required, 3-4 sessions/week"},
  "Half Marathon": {weeks:14, desc:"Comfortable 10K required"},
  "Marathon":      {weeks:20, desc:"Regular running base required"},
  "Base Building": {weeks:0,  desc:"Open-ended zone 2 aerobic development"},
};

const HYROX_STATIONS = ["SkiErg","Sled Push","Sled Pull","Burpee Broad Jumps","Rowing","Farmers Carry","Sandbag Lunges","Wall Balls"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcTDEE(p) {
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

function getDayMacros(baseCals, goal, dayType, earnedCals=0) {
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

function getTodayKey() { return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()]; }
function isToday(ds)    { if(!ds)return false; const d=new Date(ds),t=new Date(); return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate(); }
function hap()          { try{navigator.vibrate?.(8);}catch{} }
function pad2(n)        { return String(Math.max(0,Math.floor(n))).padStart(2,"0"); }
function autoFocus(sch,splitType) {
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

async function lookupBarcode(barcode) {
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

function useCountUp(target, dur=1400) {
  const [v,setV]=useState(0);
  useEffect(()=>{ let s=null; const t=(now)=>{ if(!s)s=now; const p=Math.min((now-s)/dur,1); setV(Math.round((1-Math.pow(1-p,3))*target)); if(p<1)requestAnimationFrame(t);}; const id=requestAnimationFrame(t); return()=>cancelAnimationFrame(id); },[target]);
  return v;
}

// ─── GLOBAL STYLES ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#root{height:100%;background:${T.bg}}
  body{font-family:'Inter',system-ui,-apple-system,sans-serif;color:#fff;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${T.bd};border-radius:2px}
  ::-webkit-scrollbar-thumb:hover{background:#2A3A5A}
  @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @media(max-width:768px){.desk-only{display:none!important}}
  @media(min-width:769px){.mob-only{display:none!important}}
`;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Ring({value,max,color,size=140,sw=11}) {
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

function MacroRing({protein,carbs,fat,pTarget,cTarget,fTarget,size=200,sw=16}) {
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

function MacroBar({label,consumed,target,color}) {
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

function Toggle({on,onChange,label,sub}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:`1px solid ${T.bd}`}}>
      <div><div style={{fontSize:14,color:on?"#fff":T.mu}}>{label}</div>{sub&&<div style={{fontSize:11,color:T.mu,marginTop:2}}>{sub}</div>}</div>
      <div onClick={()=>onChange(!on)} style={{width:44,height:24,borderRadius:12,background:on?T.prot:T.s3,cursor:"pointer",display:"flex",alignItems:"center",padding:"0 3px",justifyContent:on?"flex-end":"flex-start",transition:"background 0.2s",boxSizing:"border-box",flexShrink:0,marginLeft:16}}>
        <div style={{width:18,height:18,borderRadius:9,background:"#fff"}}/>
      </div>
    </div>
  );
}

function CC({label,sub,sel,onClick,icon,accent=T.prot}) {
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

function PrimaryBtn({onClick,label,disabled,style:sx={}}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{width:"100%",padding:"15px",background:disabled?T.s3:T.prot,color:disabled?T.mu:"#fff",fontWeight:700,fontSize:15,letterSpacing:.5,border:"none",borderRadius:11,cursor:disabled?"default":"pointer",textTransform:"uppercase",fontFamily:"inherit",transition:"opacity 0.2s",...sx}}>
      {label}
    </button>
  );
}

function UnitToggle({opts,val,onChange}) {
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

function Rolodex({items,sel,onChange,itemH=56}) {
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

function SectionCard({title,children,action}) {
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

function Spinner() {
  return <div style={{width:20,height:20,border:`2px solid ${T.bd}`,borderTopColor:T.prot,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;
}

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function Logo({size=32,text=true}) {
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
function Onboarding({onComplete, user, signupName}) {
  const [sc,setSc]=useState(0);
  const [chatReply,setCR]=useState("");
  const [goalRate,setGR]=useState("");
  const [d,setD]=useState({name:signupName||"",email:user?.email||"",healthConn:false,sex:"",dobMonth:"Jan",dobDay:"15",dobYear:"1995",hUnit:"ft",hFt:"5",hIn:"10",hCm:"178",wUnit:"lbs",weight:"185",wHistory:"",wTrend:"",bodyFat:"",job:"",steps:"",freq:"",trainType:"",intensity:"",activity:"",sleep:"",sleepQ:"",metHistory:"",protein:"",conditions:[],cycle:"",liftExp:"",cardioExp:"",goal:"",goalTimeline:"",targetWeight:""});
  const upd=(k,v)=>setD(p=>({...p,[k]:v}));
  const auto=(k,v)=>{upd(k,v);setTimeout(next,260);};
  const tdee=calcTDEE(d);
  const animTDEE=useCountUp(sc===23?tdee.total:0);
  const SKIP20=d.sex!=="female";
  const next=()=>setSc(s=>{const n=s+1;if(n===20&&SKIP20)return 21;return n;});
  const back=()=>setSc(s=>{const p=s-1;if(p===20&&SKIP20)return 19;return Math.max(0,p);});
  const rateMap={"−750":-750,"−500":-500,"−250":-250,"−125":-125,"0":0,"+125":125,"+250":250,"+500":500};
  const goalCals=tdee.total+(rateMap[goalRate]||0);
  const pct=Math.round((sc/25)*100);

  // Live BMR preview as data comes in
  const bmrPreview=d.weight&&d.sex?Math.round(calcTDEE(d).bmr):null;

  // Fact card component
  const FactCard=({emoji,stat,text,color=T.prot})=>(
    <div style={{background:`${color}08`,border:`1px solid ${color}22`,borderRadius:12,padding:"14px 16px",marginTop:14,display:"flex",gap:12,alignItems:"flex-start"}}>
      <div style={{fontSize:20,flexShrink:0}}>{emoji}</div>
      <div><div style={{fontSize:13,fontWeight:700,color,marginBottom:3}}>{stat}</div><div style={{fontSize:12,color:T.mu,lineHeight:1.65}}>{text}</div></div>
    </div>
  );

  // Mini bar chart component
  const MiniBar=({label,val,max,color})=>(
    <div style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:3}}><span style={{color:T.mu}}>{label}</span><span style={{color,fontWeight:700}}>{val}</span></div>
      <div style={{height:5,background:T.s3,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(val/max,1)*100}%`,background:color,borderRadius:3,transition:"width 0.8s ease"}}/>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900;ital@0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{width:"100%",maxWidth:480,animation:"fadeIn 0.3s ease"}}>
        {/* Progress bar */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
          <Logo size={28}/>
          <div style={{flex:1,height:3,background:T.s3,borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",background:T.prot,width:`${pct}%`,transition:"width 0.5s ease"}}/>
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:1,minWidth:36,textAlign:"right"}}>{pct}%</div>
        </div>

        {sc>0&&<button onClick={back} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:18,padding:"0 0 16px",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>← Back</button>}

        {/* ── SCREEN 0 — Welcome ── */}
        {sc===0&&<div style={{animation:"fadeIn 0.3s ease"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(42px,8vw,64px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:12}}>
            FUEL SMARTER.<br/><span style={{color:T.prot}}>TRAIN HARDER.</span>
          </div>
          <p style={{fontSize:15,color:T.mu,lineHeight:1.7,marginBottom:8}}>We're about to build the most accurate fitness plan you've ever had. Takes 3 minutes. Based on 25 variables about your body.</p>
          <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:12,padding:"12px 16px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
            <div style={{fontSize:22}}>⚡</div>
            <div style={{fontSize:12,color:T.mu,lineHeight:1.6}}><b style={{color:"#fff"}}>Used by 400+ athletes</b> — most say their first plan was more accurate than anything they'd calculated manually.</div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>First name</label>
            <input value={d.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. Marcus" style={{width:"100%",background:T.s2,border:`1.5px solid ${d.name?T.prot:T.bd}`,borderRadius:11,padding:"13px 16px",color:"#fff",fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s"}}/>
          </div>
          <PrimaryBtn onClick={next} label="Build My Plan →" disabled={!d.name.trim()}/>
        </div>}

        {/* ── SCREEN 1 — Apple Health ── */}
        {sc===1&&<div style={{animation:"fadeIn 0.25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 1</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Let's start strong, {d.name}.</div>
          <p style={{fontSize:13,color:T.mu,lineHeight:1.65,marginBottom:20}}>Connect Apple Health and your plan is accurate from day one — real steps, real sleep, real workouts feeding into your macros automatically.</p>
          <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"24px",textAlign:"center",marginBottom:14}}>
            <div style={{fontSize:44,marginBottom:8}}>🍎</div>
            <div style={{fontSize:17,fontWeight:700,marginBottom:5}}>Apple Health</div>
            <p style={{fontSize:12,color:T.mu,marginBottom:18,lineHeight:1.6}}>Workouts · Steps · Sleep · Heart Rate</p>
            <button onClick={()=>{upd("healthConn",true);setTimeout(next,280);}} style={{width:"100%",padding:"14px",background:T.prot,color:"#fff",fontWeight:700,fontSize:14,letterSpacing:1,border:"none",borderRadius:10,cursor:"pointer",textTransform:"uppercase",fontFamily:"inherit"}}>Allow Apple Health →</button>
          </div>
          <button onClick={next} style={{width:"100%",padding:"12px",background:"none",color:T.mu,fontWeight:500,fontSize:13,border:`1px solid ${T.bd}`,borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>Skip for now</button>
          <FactCard emoji="📊" stat="Athletes who sync devices see 23% better adherence" text="Real data makes your plan real. Step counts, burned calories, and sleep quality all feed directly into your daily macro targets." color={T.prot}/>
        </div>}

        {/* ── SCREEN 2 — Sex ── */}
        {sc===2&&<div style={{animation:"fadeIn 0.25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 2</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Biological sex?</div>
          <p style={{fontSize:13,color:T.mu,marginBottom:24}}>This is one of the biggest drivers of your metabolic rate — not a detail we can skip.</p>
          <div style={{display:"flex",gap:12}}>
            {[{v:"male",l:"Male",e:"♂"},{v:"female",l:"Female",e:"♀"}].map(o=>(
              <div key={o.v} onClick={()=>auto("sex",o.v)} style={{flex:1,background:d.sex===o.v?`${T.prot}12`:T.s2,border:`2px solid ${d.sex===o.v?T.prot:T.bd}`,borderRadius:14,padding:"28px 12px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}>
                <div style={{fontSize:30,marginBottom:10,color:d.sex===o.v?T.prot:T.mu}}>{o.e}</div>
                <div style={{fontSize:17,fontWeight:700,color:d.sex===o.v?T.prot:"#fff"}}>{o.l}</div>
              </div>
            ))}
          </div>
          <FactCard emoji="🧬" stat="Sex affects BMR by up to 5–10%" text="Males and females have different baseline metabolic rates due to differences in lean mass distribution. We use sex-specific Mifflin-St Jeor or Katch-McArdle equations." color={T.carb}/>
        </div>}

        {/* ── SCREEN 3 — DOB ── */}
        {sc===3&&<div style={{animation:"fadeIn 0.25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 3</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Date of birth.</div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Metabolism slows roughly 1–2% per decade after 20. Age is non-negotiable in the equation.</p>
          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1.4,textAlign:"center"}}><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Month</div><Rolodex items={MONTHS_A} sel={d.dobMonth} onChange={v=>upd("dobMonth",v)}/></div>
            <div style={{flex:.8,textAlign:"center"}}><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Day</div><Rolodex items={DAYS_A} sel={d.dobDay} onChange={v=>upd("dobDay",v)}/></div>
            <div style={{flex:1.2,textAlign:"center"}}><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Year</div><Rolodex items={YEARS_A} sel={d.dobYear} onChange={v=>upd("dobYear",v)}/></div>
          </div>
          <PrimaryBtn onClick={next} label="Continue →" style={{marginTop:20}}/>
          <FactCard emoji="⏳" stat="Age is variable #3 of 25" text="Every decade after 20 reduces your BMR by roughly 1-2%. We account for this precisely — not with a rough estimate." color={T.fat}/>
        </div>}

        {/* ── SCREEN 4 — Height ── */}
        {sc===4&&<div style={{animation:"fadeIn 0.25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 4</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:12}}>Your height.</div>
          <UnitToggle opts={[{val:"ft",label:"ft & in"},{val:"cm",label:"cm"}]} val={d.hUnit} onChange={v=>upd("hUnit",v)}/>
          {d.hUnit==="ft"?(<div style={{display:"flex",gap:16}}>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Feet</div><Rolodex items={FT_A} sel={d.hFt} onChange={v=>upd("hFt",v)}/></div>
            <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Inches</div><Rolodex items={IN_A} sel={d.hIn} onChange={v=>upd("hIn",v)}/></div>
          </div>):(<div style={{maxWidth:150,margin:"0 auto",textAlign:"center"}}><div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Centimeters</div><Rolodex items={CM_A} sel={d.hCm} onChange={v=>upd("hCm",v)}/></div>)}
          <PrimaryBtn onClick={next} label="Continue →" style={{marginTop:20}}/>
          <FactCard emoji="📐" stat="Height affects BMR more than most people realize" text="Taller people have more surface area and more organ mass — your BMR is higher than someone shorter at the same weight." color={T.prot}/>
        </div>}

        {/* ── SCREEN 5 — Weight ── */}
        {sc===5&&<div style={{animation:"fadeIn 0.25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 5</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Current weight.</div>
          <p style={{fontSize:13,color:T.mu,marginBottom:16}}>Your weight right now — not a goal weight. Be honest. The equation only works with real numbers.</p>
          <UnitToggle opts={[{val:"lbs",label:"lbs"},{val:"kg",label:"kg"}]} val={d.wUnit} onChange={v=>upd("wUnit",v)}/>
          <div style={{maxWidth:160,margin:"0 auto",textAlign:"center"}}>
            <Rolodex items={d.wUnit==="lbs"?LBS_A:KG_A} sel={d.weight} onChange={v=>upd("weight",v)}/>
          </div>
          <div style={{textAlign:"center",marginTop:8,fontSize:17,fontWeight:700,color:T.prot}}>
            {d.weight}{d.wUnit} <span style={{fontSize:12,fontWeight:400,color:T.mu}}>= {d.wUnit==="lbs"?Math.round(parseFloat(d.weight)*0.4536):Math.round(parseFloat(d.weight)/0.4536)} {d.wUnit==="lbs"?"kg":"lbs"}</span>
          </div>
          {bmrPreview&&<div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 16px",marginTop:16}}>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Live BMR Preview</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:40,fontWeight:900,color:T.prot,lineHeight:1}}>{bmrPreview.toLocaleString()}</div>
            <div style={{fontSize:11,color:T.mu,marginTop:4}}>kcal/day at complete rest · Updates as you answer more questions</div>
          </div>}
          <PrimaryBtn onClick={next} label="Continue →" style={{marginTop:16}}/>
        </div>}

        {/* Screens 6-22 */}
        {sc>=6&&sc<=22&&<ChoiceScreens sc={sc} d={d} upd={upd} auto={auto} next={next} tdee={tdee} FactCard={FactCard} MiniBar={MiniBar}/>}

        {/* Screen 23: TDEE reveal */}
        {sc===23&&<TDEEReveal tdee={tdee} animTDEE={animTDEE} d={d} chatReply={chatReply} setCR={setCR} next={next}/>}

        {/* Screen 24: Goal */}
        {sc===24&&<GoalScreen d={d} upd={upd} tdee={tdee} goalCals={goalCals} goalRate={goalRate} setGR={setGR} onComplete={()=>onComplete(d,tdee,d.goal==="maintain"?tdee.total:goalCals)}/>}
      </div>
    </div>
  );
}



// ─── BODY FIGURE SVG ─────────────────────────────────────────────────────────
function BodyFigure({pct, color, selected}) {
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

const BF_VISUAL=[
  {r:"5–7%",   pct:6,  c:"#29B6F6",l:"Athletic",  desc:"Visible striations, very lean"},
  {r:"8–12%",  pct:10, c:"#00E676", l:"Fit",       desc:"Visible abs, athletic build"},
  {r:"13–17%", pct:15, c:"#2979FF", l:"Lean",      desc:"Defined, not shredded"},
  {r:"18–24%", pct:21, c:"#FFD740", l:"Average",   desc:"Soft, no visible abs"},
  {r:"25–30%", pct:27, c:"#FFA726", l:"Above avg", desc:"Rounded belly, soft arms"},
  {r:"31–40%", pct:35, c:"#EF6C00", l:"High",      desc:"Significant fat coverage"},
  {r:"40+%",   pct:43, c:"#FF4D6D", l:"Obese",     desc:"High health risk range"},
];

function ChoiceScreens({sc,d,upd,auto,next,tdee,FactCard,MiniBar}) {
  // Facts per screen
  const FACTS={
    6:{emoji:"⚖️",stat:"Weight history reveals metabolic adaptation",text:"If you've been significantly heavier before, your metabolism may be running 10-15% lower than predicted. We adjust for this."},
    7:{emoji:"📉",stat:"Weight trend is more predictive than a single weigh-in",text:"Daily weight fluctuates up to 5 lbs from water, food, and hormones. Your trend over weeks is what actually matters."},
    8:{emoji:"💪",stat:"Body fat % unlocks the most accurate equation",text:"Katch-McArdle (fat-free mass based) is 5-8% more accurate than standard BMR equations. Your lean mass is what drives your metabolism."},
    9:{emoji:"🚶",stat:"NEAT — non-exercise activity — accounts for 15-30% of TDEE",text:"Your job activity can add 300–700 kcal/day over someone who sits at a desk. This is one of the biggest variables most calculators ignore."},
    10:{emoji:"👟",stat:"Every 2,000 steps burns ~80–100 kcal",text:"10,000 steps/day adds roughly 400-500 kcal to your daily expenditure. Step count is one of the most underrated fitness variables."},
    11:{emoji:"🏋️",stat:"Training frequency directly impacts how many calories you need",text:"4-6 sessions per week can add 400-700 kcal/day to your maintenance. Most apps give you a flat number that completely ignores this."},
    12:{emoji:"🔥",stat:"Training type changes your macro ratios, not just calories",text:"Strength training needs more protein. Running needs more carbs. Hyrox needs both. Coach Macro adjusts your macro split for each type."},
    13:{emoji:"💦",stat:"Workout intensity multiplies your calorie burn",text:"High intensity training (RPE 8-9) can burn 2-3× more calories than the same duration at low intensity. Your effort level matters."},
    14:{emoji:"🎯",stat:"Activity outside the gym adds up fast",text:"Sports, hiking, active errands — a highly active lifestyle outside the gym can add 300-600 kcal to your daily expenditure."},
    15:{emoji:"😴",stat:"Poor sleep reduces fat loss by up to 55%",text:"A 2010 University of Chicago study found dieters who slept 5.5 hours lost 55% less fat than those sleeping 8.5 hours at the same calories."},
    16:{emoji:"🛌",stat:"Sleep quality matters as much as quantity",text:"Poor quality sleep elevates cortisol, suppresses growth hormone, and increases hunger hormones by up to 24%. Recovery takes a hit."},
    17:{emoji:"⚠️",stat:"Prolonged dieting slows metabolism by 10-25%",text:"Metabolic adaptation is real. After 3+ months in a deficit, your body burns fewer calories at the same intake. We calculate and adjust for this."},
    18:{emoji:"🥩",stat:"High protein raises your metabolism by 80-100 kcal/day",text:"The thermic effect of protein is 20-30% of its calories — meaning your body burns more energy just digesting it. High protein = higher TDEE."},
    19:{emoji:"🏥",stat:"Health conditions can shift TDEE by 5-25%",text:"Thyroid conditions can reduce BMR by up to 25%. Certain medications alter fat storage and metabolism significantly. We account for all of it."},
    20:{emoji:"🔄",stat:"Hormonal cycles shift calorie needs by 150-350 kcal",text:"Metabolic rate increases 7-10% in the luteal phase (post-ovulation). Macros should shift with your cycle — most apps don't know you have one."},
    21:{emoji:"📈",stat:"Lifting experience determines your progressive overload pace",text:"Beginners gain 1-1.5% strength per week. Intermediates 0.5%. Advanced lifters 0.25%. Your program should match where you actually are."},
    22:{emoji:"🏃",stat:"Cardio experience affects how efficiently your body burns calories",text:"Trained runners burn fewer calories per mile than beginners — the body adapts. Your cardio history shapes your training zones and calorie targets."},
  };

  const fact=FACTS[sc];

  const screens={
    6:{num:"6",q:"Weight history.",sub:`Have you ever weighed significantly more than ${d.wUnit==="lbs"?Math.round(parseFloat(d.weight||180)*1.15):Math.round(parseFloat(d.weight||80)*1.15)}${d.wUnit}? Past weight affects your current metabolism.`,choices:[{v:"yes",l:"Yes, significantly more"},{v:"no",l:"No, this is typical"},{v:"notsure",l:"Not sure"}],key:"wHistory"},
    7:{num:"7",q:"Recent weight trend?",sub:"Think about the last 3–4 weeks. Not one day — your trend.",choices:[{v:"losing",l:"Losing weight",e:"📉"},{v:"gaining",l:"Gaining weight",e:"📈"},{v:"stable",l:"Weight stable",e:"➡️"},{v:"notsure",l:"Not sure",e:"🤔"}],key:"wTrend"},
    9:{num:"9",q:"How active is your job?",sub:"This alone can swing your TDEE by 700+ kcal/day.",choices:[{v:"desk",l:"Desk / Remote",e:"💻",sub:"Sitting most of the day"},{v:"mix",l:"Mixed",e:"🚶",sub:"Some sitting, some movement"},{v:"feet",l:"On my feet",e:"👟",sub:"Standing and walking most of the day"},{v:"physical",l:"Physical labor",e:"🔨",sub:"Heavy movement all day"}],key:"job"},
    10:{num:"10",q:"Daily step count?",sub:"Be honest — most people overestimate this one.",choices:[{v:"u3k",l:"Under 3,000"},{v:"3-6k",l:"3,000–6,000"},{v:"6-10k",l:"6,000–10,000"},{v:"10-15k",l:"10,000–15,000"},{v:"15k+",l:"15,000+",sub:"High activity lifestyle"}],key:"steps"},
    11:{num:"11",q:"Training sessions per week?",choices:[{v:"n0",l:"0 / week"},{v:"1-3",l:"1–3 / week"},{v:"4-6",l:"4–6 / week"},{v:"7+",l:"7+ / week",sub:"Training every day"}],key:"freq"},
    12:{num:"12",q:"Primary training type?",sub:"Pick the one that dominates your week.",choices:[{v:"strength",l:"Strength / Lifting",e:"🏋️"},{v:"run",l:"Running / Cardio",e:"🏃"},{v:"hyrox",l:"Hyrox / CrossFit",e:"🔥"},{v:"hybrid",l:"Hybrid — mix of types",e:"⚡"},{v:"sport",l:"Sport specific",e:"🏅"}],key:"trainType"},
    13:{num:"13",q:"Workout intensity?",sub:"Average RPE across most of your sessions.",choices:[{v:"light",l:"Light",e:"💧",sub:"Mostly moving, never out of breath"},{v:"moderate",l:"Moderate",e:"💦",sub:"Sweating, slightly challenging, could hold a short conversation"},{v:"hard",l:"Hard",e:"🔥",sub:"Breathing heavy, hard to talk, push through discomfort"},{v:"extreme",l:"Extreme",e:"⚡",sub:"All out — near max effort every session, very uncomfortable"}],key:"intensity"},
    14:{num:"14",q:"Activity outside workouts?",sub:"Lifestyle activity (NEAT) is often bigger than your workouts.",choices:[{v:"sedentary",l:"Mostly sedentary",e:"🛋️",sub:"Gym → couch"},{v:"moderate",l:"Moderately active",e:"🚶",sub:"Regular errands, weekend activities"},{v:"very",l:"Very active",e:"🏃",sub:"High energy lifestyle outside the gym"}],key:"activity"},
    15:{num:"15",q:"Average sleep hours?",sub:"This directly reduces your metabolic rate if you're under 7.",choices:[{v:"u5",l:"Under 5 hours"},{v:"5-6",l:"5–6 hours"},{v:"6-7",l:"6–7 hours"},{v:"7-8",l:"7–8 hours",sub:"Optimal recovery range"},{v:"8+",l:"8+ hours"}],key:"sleep"},
    16:{num:"16",q:"Sleep quality?",choices:[{v:"poor",l:"Poor",e:"😴"},{v:"fair",l:"Fair",e:"😐"},{v:"good",l:"Good",e:"🙂"},{v:"excellent",l:"Excellent",e:"⚡"}],key:"sleepQ"},
    17:{num:"17",q:"How long have you been dieting?",sub:"Prolonged restriction causes metabolic adaptation — we calculate it precisely.",choices:[{v:"not",l:"Not currently dieting"},{v:"u3",l:"In a deficit under 3 months"},{v:"3plus",l:"3+ months in a deficit",sub:"Significant adaptation likely"},{v:"offon",l:"On-and-off for years"}],key:"metHistory"},
    18:{num:"18",q:"How's your protein intake?",sub:"High protein intake raises your TDEE through the thermic effect of food.",choices:[{v:"none",l:"I don't track it"},{v:"low",l:"Very little protein"},{v:"moderate",l:"Some, inconsistently"},{v:"high",l:"High — I hit a daily target",sub:"0.7–1g+ per lb bodyweight"}],key:"protein"},
    21:{num:"21",q:"Weightlifting experience?",choices:[{v:"none",l:"None",e:"🌱"},{v:"beginner",l:"Beginner",e:"💪",sub:"< 1 year"},{v:"intermediate",l:"Intermediate",e:"🔥",sub:"1–4 years"},{v:"advanced",l:"Advanced",e:"⚡",sub:"4+ years, near your genetic ceiling"}],key:"liftExp"},
    22:{num:"22",q:"Cardio experience?",choices:[{v:"none",l:"None",e:"🌱"},{v:"beginner",l:"Beginner",e:"🚶",sub:"Occasional jogging"},{v:"intermediate",l:"Intermediate",e:"🏃",sub:"Can run 5K+ comfortably"},{v:"advanced",l:"Advanced",e:"🏅",sub:"Half marathon+ fitness"}],key:"cardioExp"},
  };

  // Live TDEE mini-chart that updates as they answer
  const LiveTDEEBar=()=>{
    if(!tdee||!tdee.total) return null;
    const vars=[
      {label:"Base BMR",val:tdee.bmr,color:T.prot},
      {label:"Activity & NEAT",val:Math.round(tdee.total*.35),color:T.carb},
      {label:"Exercise",val:Math.round(tdee.total*.2),color:T.fat},
      {label:"Thermic Effect",val:tdee.tef,color:"#9B59FF"},
    ];
    const maxV=Math.max(...vars.map(v=>v.val));
    return(
      <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 16px",marginTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Your TDEE so far</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,color:T.prot,lineHeight:1}}>{tdee.total.toLocaleString()} <span style={{fontSize:11,color:T.mu,fontWeight:400}}>kcal</span></div>
        </div>
        {vars.map(v=><MiniBar key={v.label} label={v.label} val={v.val} max={maxV} color={v.color}/>)}
        <div style={{fontSize:10,color:T.mu,marginTop:6}}>Updates with each answer ↑</div>
      </div>
    );
  };

  // Body fat screen
  // SVG body figure for each body fat level — torso silhouette that gets wider
  function BodyFigure({pct, color, selected}) {
    // Body shape params: waist width increases with body fat
    const w = 28 + pct*0.8;  // waist gets wider
    const sh = 22 + pct*0.3; // shoulders slightly wider
    const ab = pct > 20 ? `M${50-w/3},52 Q50,${52+pct*0.4} ${50+w/3},52` : `M${50-w/3},52 L${50+w/3},52`;
    return (
      <svg width="60" height="90" viewBox="0 0 100 160" style={{display:"block",margin:"0 auto"}}>
        {/* Head */}
        <ellipse cx="50" cy="18" rx="14" ry="17" fill={selected?color:color+"55"} />
        {/* Neck */}
        <rect x="44" y="33" width="12" height="8" fill={selected?color:color+"55"} />
        {/* Torso — wider with more body fat */}
        <path d={`M${50-sh},42 C${50-sh-4},42 ${50-w},55 ${50-w},80 Q${50-w},95 50,95 Q${50+w},95 ${50+w},80 C${50+w},55 ${50+sh+4},42 ${50+sh},42 Z`} fill={selected?color:color+"44"} />
        {/* Belly bump for higher bf */}
        {pct>20&&<ellipse cx="50" cy={68+pct*0.3} rx={w*0.6} ry={pct*0.35} fill={selected?color+"88":color+"22"} />}
        {/* Arms */}
        <path d={`M${50-sh},48 C${50-sh-8},52 ${50-sh-10},70 ${50-sh-8},85`} fill="none" stroke={selected?color:color+"55"} strokeWidth={4+pct*0.08} strokeLinecap="round"/>
        <path d={`M${50+sh},48 C${50+sh+8},52 ${50+sh+10},70 ${50+sh+8},85`} fill="none" stroke={selected?color:color+"55"} strokeWidth={4+pct*0.08} strokeLinecap="round"/>
        {/* Legs */}
        <path d={`M${50-12},95 L${50-14-pct*0.1},145`} fill="none" stroke={selected?color:color+"55"} strokeWidth={7+pct*0.1} strokeLinecap="round"/>
        <path d={`M${50+12},95 L${50+14+pct*0.1},145`} fill="none" stroke={selected?color:color+"55"} strokeWidth={7+pct*0.1} strokeLinecap="round"/>
      </svg>
    );
  }

  const BF_VISUAL=[
    {r:"5–7%",   pct:6,  c:"#29B6F6",l:"Athletic",desc:"Visible striations, very low fat"},
    {r:"8–12%",  pct:10, c:"#00E676", l:"Fit",     desc:"Visible abs, lean look"},
    {r:"13–17%", pct:15, c:T.prot,   l:"Lean",    desc:"Defined but not shredded"},
    {r:"18–24%", pct:21, c:T.fat,    l:"Average", desc:"Soft, no visible abs"},
    {r:"25–30%", pct:27, c:"#FFA726", l:"Above avg",desc:"Rounded belly, soft arms"},
    {r:"31–40%", pct:35, c:"#EF6C00", l:"High",   desc:"Significant fat coverage"},
    {r:"40+%",   pct:43, c:T.red,    l:"Obese",   desc:"High health risk range"},
  ];

  if(sc===8) return(
    <div style={{animation:"fadeIn 0.25s ease"}}>
      <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 8</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Estimate your body fat.</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:16}}>Pick the figure that most closely matches your current build. This unlocks a more accurate metabolic equation.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {BF_VISUAL.slice(0,4).map(b=>(
          <div key={b.r} onClick={()=>auto("bodyFat",b.r)} style={{background:d.bodyFat===b.r?`${b.c}14`:T.s2,border:`2px solid ${d.bodyFat===b.r?b.c:T.bd}`,borderRadius:12,padding:"10px 6px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}>
            <BodyFigure pct={b.pct} color={b.c} selected={d.bodyFat===b.r}/>
            <div style={{fontSize:11,fontWeight:700,color:d.bodyFat===b.r?b.c:"#ccc",marginTop:6}}>{b.r}</div>
            <div style={{fontSize:9,color:T.mu,marginTop:2}}>{b.l}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:8}}>
        {BF_VISUAL.slice(4).map(b=>(
          <div key={b.r} onClick={()=>auto("bodyFat",b.r)} style={{background:d.bodyFat===b.r?`${b.c}14`:T.s2,border:`2px solid ${d.bodyFat===b.r?b.c:T.bd}`,borderRadius:12,padding:"10px 6px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}>
            <BodyFigure pct={b.pct} color={b.c} selected={d.bodyFat===b.r}/>
            <div style={{fontSize:11,fontWeight:700,color:d.bodyFat===b.r?b.c:"#ccc",marginTop:6}}>{b.r}</div>
            <div style={{fontSize:9,color:T.mu,marginTop:2}}>{b.l}</div>
          </div>
        ))}
      </div>
      {d.bodyFat&&<div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 16px",marginTop:12}}>
        <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Equation Upgrade Unlocked</div>
        <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>Switching to <b style={{color:T.prot}}>Katch-McArdle</b> — uses your lean body mass for a 5–8% more accurate BMR estimate than standard equations.</div>
      </div>}
      {fact&&<FactCard emoji={fact.emoji} stat={fact.stat} text={fact.text} color={T.prot}/>}
    </div>
  );

  // Health conditions
  if(sc===19){
    const toggle=v=>{if(v==="none"){upd("conditions",["none"]);return;}const cur=d.conditions.filter(c=>c!=="none");upd("conditions",cur.includes(v)?cur.filter(c=>c!==v):[...cur,v]);};
    return(
      <div style={{animation:"fadeIn 0.25s ease"}}>
        <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 19</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Health conditions?</div>
        <p style={{fontSize:13,color:T.mu,marginBottom:16}}>We adjust your equation accordingly. This can mean the difference between hitting your goal and spinning your wheels for months.</p>
        {[{v:"thyroid",l:"Thyroid condition",sub:"Reduces BMR by up to 25%"},{v:"pcos",l:"PCOS",sub:"Affects insulin sensitivity and fat storage"},{v:"diabetes",l:"Type 1 or 2 Diabetes",sub:"Impacts glucose metabolism"},{v:"meds",l:"Weight-affecting medication",sub:"Many medications alter metabolism"},{v:"none",l:"None of the above"}].map(o=>(
          <div key={o.v} onClick={()=>toggle(o.v)} style={{background:d.conditions.includes(o.v)?`${T.prot}08`:T.s2,border:`1.5px solid ${d.conditions.includes(o.v)?T.prot:T.bd}`,borderRadius:12,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:d.conditions.includes(o.v)?T.prot:"#fff"}}>{o.l}</div>{o.sub&&<div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>}</div>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${d.conditions.includes(o.v)?T.prot:T.dim}`,background:d.conditions.includes(o.v)?T.prot:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {d.conditions.includes(o.v)&&<div style={{fontSize:11,color:"#000",fontWeight:800}}>✓</div>}
            </div>
          </div>
        ))}
        <PrimaryBtn onClick={next} label="Continue →" disabled={d.conditions.length===0} style={{marginTop:8}}/>
        {fact&&<FactCard emoji={fact.emoji} stat={fact.stat} text={fact.text} color={T.fat}/>}
      </div>
    );
  }

  // Female cycle
  if(sc===20) return(
    <div style={{animation:"fadeIn 0.25s ease"}}>
      <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step 20</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>Menstrual cycle status.</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Your calorie needs shift 150–350 kcal across your cycle. Most apps pretend this doesn't exist.</p>
      {[{v:"regular",l:"Regular cycle"},{v:"irregular",l:"Irregular cycle"},{v:"peri",l:"Perimenopausal / Menopausal"},{v:"hbc",l:"Using hormonal birth control"},{v:"prefer",l:"Prefer not to say"}].map(o=>(
        <CC key={o.v} label={o.l} sel={d.cycle===o.v} onClick={()=>auto("cycle",o.v)}/>
      ))}
      {fact&&<FactCard emoji={fact.emoji} stat={fact.stat} text={fact.text} color={T.carb}/>}
    </div>
  );

  const screen=screens[sc];
  if(!screen) return null;

  // Show live TDEE bar from screen 11 onwards
  const showLiveTDEE=sc>=11;

  return(
    <div style={{animation:"fadeIn 0.25s ease"}}>
      <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Step {screen.num}</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:screen.sub?8:20}}>{screen.q}</div>
      {screen.sub&&<p style={{fontSize:13,color:T.mu,lineHeight:1.65,marginBottom:16}}>{screen.sub}</p>}
      {screen.choices.map(o=>(<CC key={o.v} label={o.l} sub={o.sub} icon={o.e} sel={d[screen.key]===o.v} onClick={()=>auto(screen.key,o.v)}/>))}
      {showLiveTDEE&&<LiveTDEEBar/>}
      {fact&&<FactCard emoji={fact.emoji} stat={fact.stat} text={fact.text} color={sc%3===0?T.prot:sc%3===1?T.carb:T.fat}/>}
    </div>
  );
}


function TDEEReveal({tdee,animTDEE,d,chatReply,setCR,next}) {
  const chats=[
    {q:"Got it — set my goal →",isNext:true},
    {q:"How was this calculated?",r:`We used ${d.bodyFat?"Katch-McArdle (370 + 21.6 × lean body mass)":"Mifflin-St Jeor"} as your base BMR, then built a custom multiplier from your job, steps, training frequency, intensity, and lifestyle. 16 variables total — far more precise than a standard TDEE calculator.`},
    {q:"What's my biggest factor?",r:`Your biggest driver is ${d.job==="physical"?"your physical job — labor adds 400–600 kcal/day above desk workers":d.freq==="7+"?"your training frequency — daily training creates massive cumulative burn":d.steps==="15k+"?"your step count — 15k+ daily steps is elite NEAT":"your overall combination of job activity, steps, and training"}.`},
    {q:"This seems off",r:"Connect Apple Health or Garmin after setup — we'll update your numbers from real data. Your first number is maintenance. Set your goal next to get your actual daily target."},
  ];
  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:12}}>Your Results</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>DAILY EXPENDITURE</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Based on 25 data points about you</p>
      <div style={{textAlign:"center",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:16,padding:"28px 20px",marginBottom:14}}>
        <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Maintenance Calories</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:72,fontWeight:900,color:T.prot,lineHeight:1,letterSpacing:-2}}>{animTDEE.toLocaleString()}</div>
        <div style={{fontSize:14,color:T.mu,marginTop:4}}>kcal / day</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:18}}>
        {[["🧬 BMR",tdee.bmr,"Base"],["🏃 Activity",tdee.activity,"Exercise+NEAT"],["🍽️ TEF",tdee.tef,"Digestion"]].map(([l,v,s])=>(
          <div key={l} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:11,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:11,marginBottom:4}}>{l}</div>
            <div style={{fontSize:18,fontWeight:800}}>{v?.toLocaleString()}</div>
            <div style={{fontSize:9,color:T.mu,marginTop:3}}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#070E1A",border:`1px solid ${T.bd}`,borderRadius:14,padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <Logo size={22} text={false}/>
          <div style={{fontSize:13,color:"#ccc",lineHeight:1.6}}>{chatReply||`Here's your estimated daily expenditure — ${tdee.total.toLocaleString()} kcal to maintain your weight. What would you like to know?`}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {chats.map((o,i)=>(<button key={i} onClick={()=>{if(o.isNext)next();else setCR(o.r);}} style={{padding:"11px 14px",background:o.isNext?T.prot:T.s2,color:o.isNext?"#fff":"#ccc",border:`1px solid ${o.isNext?"transparent":T.bd}`,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:o.isNext?700:500,textAlign:"left",fontFamily:"inherit"}}>{o.q}</button>))}
        </div>
      </div>
    </div>
  );
}

function GoalScreen({d,upd,tdee,goalCals,goalRate,setGR,onComplete}) {
  const rates={cut:["−500","−250","−125"],bulk:["+125","+250","+500"]};
  const getExpertRec=()=>{
    const hasAdaptation=d.metHistory==="3plus"||d.metHistory==="offon";
    const isActive=["4-6","7+"].includes(d.freq);
    if(d.goal==="cut"){
      if(hasAdaptation)return{rate:"−250",reason:"Expert pick for you",why:"Your dieting history suggests metabolic adaptation. A smaller deficit preserves more muscle and prevents further slowdown. Slower is smarter here."};
      if(isActive)return{rate:"−500",reason:"Expert pick for you",why:"You train frequently — a moderate deficit keeps performance high while losing fat. Research shows −500 kcal is optimal for trained athletes."};
      return{rate:"−500",reason:"Expert pick for you",why:"A 500 kcal deficit produces ~1 lb/week fat loss — the rate with the most research support for maintaining muscle mass while cutting."};
    }
    if(d.goal==="bulk"){
      if(d.liftExp==="beginner")return{rate:"+250",reason:"Expert pick for beginners",why:"Beginners gain muscle fastest. A small surplus maximizes muscle while minimizing fat gain — the proven lean bulk approach."};
      return{rate:"+125",reason:"Expert pick for you",why:"Intermediate and advanced lifters gain muscle slowly regardless of surplus size. A small surplus is all you need — bigger just adds fat."};
    }
    return null;
  };
  const rec=d.goal&&d.goal!=="maintain"?getExpertRec():null;
  const rateInfo={"−500":{label:"−500 kcal/day",result:"~1 lb fat loss per week",tag:"Most researched"},"−250":{label:"−250 kcal/day",result:"~0.5 lb per week",tag:"Most sustainable"},
    "−125":{label:"−125 kcal/day",result:"~0.25 lb per week",tag:"Gentlest approach"},"+125":{label:"+125 kcal/day",result:"~0.25 lb/wk muscle",tag:"Lean bulk"},"+250":{label:"+250 kcal/day",result:"~0.5 lb per week",tag:"Moderate bulk"},"+500":{label:"+500 kcal/day",result:"~1 lb per week",tag:"Aggressive bulk"}};
  return (
    <div style={{animation:"fadeIn 0.25s ease"}}>
      <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Final Question</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:8}}>What's your goal?</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Based on your answers, we'll recommend the right approach and tell you exactly why.</p>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {[{v:"cut",l:"Cut",e:"🔥",sub:"Lose fat"},{v:"maintain",l:"Maintain",e:"⚖️",sub:"Hold weight"},{v:"bulk",l:"Bulk",e:"💪",sub:"Build muscle"}].map(o=>(
          <div key={o.v} onClick={()=>{upd("goal",o.v);setGR("");}} style={{flex:1,background:d.goal===o.v?`${T.prot}10`:T.s2,border:`2px solid ${d.goal===o.v?T.prot:T.bd}`,borderRadius:12,padding:"18px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}>
            <div style={{fontSize:26,marginBottom:6}}>{o.e}</div>
            <div style={{fontSize:15,fontWeight:700,color:d.goal===o.v?T.prot:"#fff"}}>{o.l}</div>
            <div style={{fontSize:11,color:T.mu,marginTop:3}}>{o.sub}</div>
          </div>
        ))}
      </div>
      {d.goal==="maintain"&&<div style={{background:`${T.carb}10`,border:`1px solid ${T.carb}30`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
        <div style={{fontSize:11,color:T.carb,fontWeight:700,marginBottom:4}}>💡 Great for body recomposition</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.65}}>Maintenance calories let you lose fat and build muscle simultaneously — especially effective if you're new to structured training or returning after a break. Requires consistent protein and training.</div>
      </div>}
      {d.goal&&d.goal!=="maintain"&&<>
        {rec&&<div style={{background:`${T.prot}08`,border:`1.5px solid ${T.prot}40`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{fontSize:14}}>⭐</div><div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{rec.reason}</div></div>
          <div style={{fontSize:13,color:"#ccc",lineHeight:1.65,marginBottom:10}}>{rec.why}</div>
          <button onClick={()=>setGR(rec.rate)} style={{padding:"8px 16px",background:goalRate===rec.rate?T.prot:`${T.prot}20`,color:goalRate===rec.rate?"#fff":T.prot,border:`1px solid ${T.prot}50`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>{goalRate===rec.rate?"✓ Selected":"Select This →"}</button>
        </div>}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>All options</div>
          {(rates[d.goal]||[]).map(r=>{const info=rateInfo[r];const isRec=rec&&r===rec.rate;return(
            <div key={r} onClick={()=>setGR(r)} style={{background:goalRate===r?`${T.prot}10`:T.s2,border:`1.5px solid ${goalRate===r?T.prot:isRec?`${T.prot}30`:T.bd}`,borderRadius:11,padding:"12px 15px",marginBottom:7,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:600,color:goalRate===r?T.prot:"#fff"}}>{info.label}</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>{info.result}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>{isRec&&<div style={{fontSize:9,color:T.prot,background:`${T.prot}15`,border:`1px solid ${T.prot}30`,borderRadius:8,padding:"2px 7px",fontWeight:700}}>Recommended</div>}{goalRate===r&&<div style={{color:T.prot,fontSize:16}}>✓</div>}</div>
            </div>
          );})}
        </div>
      </>}
      {d.goal&&<div style={{background:"#070E1A",border:`1px solid ${T.prot}30`,borderRadius:13,padding:"16px",marginBottom:20}}>
        <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Your Daily Target</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:T.prot,lineHeight:1}}>{(d.goal==="maintain"?tdee.total:goalCals).toLocaleString()}</div>
        <div style={{fontSize:13,color:T.mu,marginTop:4}}>kcal / day · {d.goal} phase</div>
      </div>}
      {/* Goal timeline */}
      {d.goal&&goalRate&&<>
        <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:4}}>When do you want to reach this goal?</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {(d.goal==="cut"?[
            {v:"4w",l:"4 Weeks",sub:"Aggressive timeline"},
            {v:"8w",l:"8 Weeks",sub:"Focused effort"},
            {v:"12w",l:"12 Weeks",sub:"Recommended pace"},
            {v:"6m",l:"6 Months",sub:"Sustainable & lasting"},
          ]:d.goal==="bulk"?[
            {v:"8w",l:"8 Weeks",sub:"Short bulk"},
            {v:"12w",l:"12 Weeks",sub:"Standard bulk"},
            {v:"6m",l:"6 Months",sub:"Longer bulk"},
            {v:"1y",l:"1 Year",sub:"Long-term build"},
          ]:[
            {v:"forever",l:"Ongoing",sub:"Lifestyle approach"},
          ]).map(o=>(
            <div key={o.v} onClick={()=>upd("goalTimeline",o.v)} style={{background:d.goalTimeline===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${d.goalTimeline===o.v?T.prot:T.bd}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all .2s"}}>
              <div style={{fontSize:14,fontWeight:700,color:d.goalTimeline===o.v?T.prot:"#fff"}}>{o.l}</div>
              <div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>
            </div>
          ))}
        </div>
      </>}
      <PrimaryBtn onClick={onComplete} label="Build My Dashboard →" disabled={!d.goal||(d.goal!=="maintain"&&!goalRate)||!d.goalTimeline}/>
    </div>
  );
}

// ─── MAIN APP SHELL (Responsive) ─────────────────────────────────────────────
function App({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,onEarnedCals,onSignOut,user}) {
  const [section,setSection]=useState("fuel"); // fuel | train | connect | settings
  const [isMobile,setIsMobile]=useState(window.innerWidth<769);

  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<769);
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);

  const [log,setLog]=useState([]);
  const [foodInput,setFoodInput]=useState("");
  const [logging,setLogging]=useState(false);
  const [logMsg,setLogMsg]=useState("");
  const [logMode,setLogMode]=useState("ai");
  const [barcodeInput,setBarcodeInput]=useState("");
  const [barcodeResult,setBarcodeResult]=useState(null);
  const [barcodeLoading,setBarcodeLoading]=useState(false);
  const [quickFields,setQF]=useState({name:"",calories:"",protein:"",carbs:"",fat:""});
  const [recs,setRecs]=useState(""); const [recsLoading,setRecsLoading]=useState(false);
  const [recipes,setRecipes]=useState(""); const [recipesLoading,setRecipesLoading]=useState(false);
  const [fastProto,setFastProto]=useState("16:8");
  const [fastActive,setFastActive]=useState(false);
  const [fastStart,setFastStart]=useState(null);
  const [fastCustomH,setFastCustomH]=useState(16);
  const [now,setNow]=useState(Date.now());
  const [city,setCity]=useState(profile.city||"");
  const [workout,setWorkout]=useState(""); const [workoutLoading,setWorkoutLoading]=useState(false);
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [restTimer,setRestTimer]=useState(0); const [restActive,setRestActive]=useState(false);
  const restInterval=useRef(null);
  const [history,setHistory]=useState({});
  const [planMode,setPlanMode]=useState("strength");
  const [runPlan,setRunPlan]=useState("5K Beginner");
  const [hybridMix,setHybridMix]=useState({strength:true,run:false,hyrox:false});
  const [stravaToken,setStravaToken]=useState("");
  const [stravaStatus,setStravaStatus]=useState("idle");
  const [stravaAthlete,setStravaAthlete]=useState(null);
  const [stravaActs,setStravaActs]=useState([]);
  const [ahActs,setAhActs]=useState([]);
  const [garminActs,setGarminActs]=useState([]);
  const [fitbitActs,setFitbitActs]=useState([]);
  const [importStatus,setImportStatus]=useState({});
  const fileRef=useRef({});
  const [trainScreen,setTrainScreen]=useState("today"); // today | workout | active | plan | progress | settings
  const [fuelScreen,setFuelScreen]=useState("home");    // home | log | recs | recipes | fast

  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);

  const todayKey=getTodayKey();
  const todayType=schedule[todayKey]||"rest";
  const todayFocus=dayFocus[todayKey]||"Rest";
  const cfg=DAY_CFG[todayType]||DAY_CFG.rest;

  const allActs=[
    ...stravaActs.map(a=>({id:`st-${a.id}`,type:a.sport_type||"Workout",icon:{Run:"🏃",Ride:"🚴",Swim:"🏊",Walk:"🚶",WeightTraining:"💪",CrossFit:"🏋️"}[a.sport_type]||"💪",date:a.start_date_local,durationMin:Math.round((a.moving_time||0)/60),distanceKm:((a.distance||0)/1000).toFixed(2),calories:Math.round(a.calories||0),title:a.name,avgHR:a.average_heartrate||"",source:"Strava",sourceIcon:"🟠"})),
    ...ahActs,...garminActs,...fitbitActs
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const todayActs=allActs.filter(a=>isToday(a.date));
  const earnedCals=todayActs.reduce((s,a)=>s+a.calories,0);
  const macros=getDayMacros(profile.goalCals,profile.goal,todayType,earnedCals);
  const consumed=log.reduce((a,i)=>({calories:a.calories+i.calories,protein:a.protein+i.protein,carbs:a.carbs+i.carbs,fat:a.fat+i.fat}),{calories:0,protein:0,carbs:0,fat:0});
  const remaining={calories:macros.calories-consumed.calories,protein:macros.protein-consumed.protein,carbs:macros.carbs-consumed.carbs,fat:macros.fat-consumed.fat};

  const fasting=FASTING_PROTOCOLS.find(p=>p.id===fastProto)||FASTING_PROTOCOLS[0];
  const fastHours=fastProto==="custom"?fastCustomH:fasting.fast;
  const fastElapsed=fastActive&&fastStart?(now-fastStart)/3600000:0;
  const fastPct=Math.min(fastElapsed/fastHours,1);
  const fastRemaining=fastActive?Math.max(0,(fastHours*3600000)-(now-fastStart)):fastHours*3600000;
  const eatOpen=fastActive&&fastElapsed>=fastHours;

  function startRest(secs){
    clearInterval(restInterval.current);setRestTimer(secs);setRestActive(true);
    restInterval.current=setInterval(()=>setRestTimer(prev=>{if(prev<=1){clearInterval(restInterval.current);setRestActive(false);hap();return 0;}if(prev===11)hap();return prev-1;}),1000);
  }
  useEffect(()=>()=>clearInterval(restInterval.current),[]);

  async function aiLog(){
    if(!foodInput.trim())return;setLogging(true);setLogMsg("");
    try{const raw=await ai(`Estimate macros for: "${foodInput}". Reply ONLY valid JSON no markdown: {"food":"short name","calories":0,"protein":0,"carbs":0,"fat":0}`);const p=JSON.parse(raw.trim());setLog(prev=>[{...p,id:Date.now(),method:"ai"},...prev]);setLogMsg(`✓ ${p.food} — ${p.calories} kcal`);setFoodInput("");}
    catch{setLogMsg("Couldn't estimate. Try again.");}setLogging(false);
  }
  async function scanBarcode(){
    if(!barcodeInput.trim())return;setBarcodeLoading(true);setBarcodeResult(null);
    const result=await lookupBarcode(barcodeInput.trim());setBarcodeResult(result);setBarcodeLoading(false);
  }
  function addBarcode(){if(!barcodeResult)return;setLog(prev=>[{...barcodeResult,id:Date.now(),method:"barcode"},...prev]);setBarcodeResult(null);setBarcodeInput("");setLogMsg(`✓ ${barcodeResult.name} added`);}
  function addQuick(){if(!quickFields.calories)return;setLog(prev=>[{food:quickFields.name||"Entry",calories:parseInt(quickFields.calories)||0,protein:parseInt(quickFields.protein)||0,carbs:parseInt(quickFields.carbs)||0,fat:parseInt(quickFields.fat)||0,id:Date.now(),method:"quick"},...prev]);setQF({name:"",calories:"",protein:"",carbs:"",fat:""});}
  function removeLog(id){setLog(prev=>prev.filter(i=>i.id!==id));}

  async function fetchRecs(){
    setRecsLoading(true);setRecs("");
    const actCtx=todayActs.length>0?`\nToday's activity: ${todayActs.map(a=>`${a.type} (${a.calories} kcal via ${a.source})`).join(", ")}\n`:"";
    try{const txt=await ai(`You are a precision nutrition coach. The user needs to hit these EXACT remaining macros:\n- Calories: ${remaining.calories} kcal\n- Protein: ${remaining.protein}g\n- Carbs: ${remaining.carbs}g\n- Fat: ${remaining.fat}g\nGoal: ${profile.goal}. Training day: ${todayType}.\n\nUsing REAL menu items with VERIFIED nutritional data from these chains: Chick-fil-A, Chipotle, Subway, McDonald's, Wingstop, Raising Cane's, Panera, Wendy's, Taco Bell:\n\nProvide exactly 3 restaurant options. For each:\n• Restaurant name\n• Exact order (item + any customizations like "no sauce", "extra protein", "double meat")\n• Macros: calories / protein / carbs / fat\n• How close it gets to their remaining targets\n\nThen 1 quick home meal option.\n\nBe SPECIFIC. Use real menu item names. Show exact macro numbers. No vague suggestions.`,900);setRecs(txt);}
    catch{setRecs("Error. Try again.");}setRecsLoading(false);
  }

  async function fetchRecipes(){
    setRecipesLoading(true);setRecipes("");
    try{const txt=await ai(`Remaining macros I need to hit:\n- Calories: ${remaining.calories} kcal\n- Protein: ${remaining.protein}g\n- Carbs: ${remaining.carbs}g\n- Fat: ${remaining.fat}g\nGoal: ${profile.goal} · Day: ${todayType}\n\nGive 3 simple home recipes. Each: name, ingredients (max 6 with amounts), steps (max 5), macro breakdown, prep time. Easy to cook. Hit the protein and calorie targets.`,900);setRecipes(txt);}
    catch{setRecipes("Error. Try again.");}setRecipesLoading(false);
  }

  async function generateWorkout(){
    setWorkoutLoading(true);setWorkout("");setTrainScreen("workout");
    const coverage=MUSCLE_COVERAGE[todayFocus]||"Full coverage of all muscles";
    const actCtx=todayActs.length>0?`\nNOTE: Already completed: ${todayActs.map(a=>`${a.type} (${a.calories} kcal)`).join(", ")}. Adjust accordingly.`:"";
    const prompt=todayType==="rest"
      ?`REST DAY recovery for ${profile.goal} athlete. Mobility, stretching, foam rolling, recovery nutrition. Equipment: ${wPrefs.equipment}. Clear sections.`
      :`Complete ${todayFocus} session.\nATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Split: ${wPrefs.splitType} | Exp: ${profile.liftExp||"intermediate"}${actCtx}\nMUSCLE COVERAGE: ${coverage}\nFORMAT: Exercise | Sets×Reps | Rest | Form cue | Overload note\n1.Warm-up 2.Heavy compounds 3.Secondary 4.Isolation (ALL sub-muscles) 5.Finisher/Core${planMode==="hybrid"&&hybridMix.run?"\n═══ RUN BLOCK ═══\nType / Distance / Pace zone":""  }${planMode==="hybrid"&&hybridMix.hyrox||planMode==="hyrox"?`\n═══ HYROX ═══\n${todayType==="cardio"?"8 stations + 1km runs":"3-4 station finisher <20min"}`:""}\nSpecific. Clear headers. No fluff.`;
    try{const txt=await ai(prompt,1000);setWorkout(txt);}catch{setWorkout("Error. Tap retry.");}setWorkoutLoading(false);
  }

  async function startStructured(){
    try{
      const raw=await ai(`Structured ${todayFocus} workout for ${profile.goal} athlete with ${wPrefs.equipment}.\nReturn ONLY valid JSON no markdown:\n{"exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":0,"done":false}],"restSecs":90,"notes":"form cue"}]}\n5-7 exercises. Compounds 3-4 sets. restSecs: 180 heavy, 90 secondary, 60 isolation.`,600);
      const parsed=JSON.parse(raw.trim());setActiveWorkout(parsed);setTrainScreen("active");
    }catch{setWorkout("Couldn't build. Use AI workout above instead.");}
  }

  function logSet(ei,si,reps,weight){
    setActiveWorkout(prev=>{if(!prev)return prev;const u={...prev};u.exercises=prev.exercises.map((ex,i)=>i!==ei?ex:{...ex,sets:ex.sets.map((s,j)=>j!==si?s:{...s,reps,weight,done:true})});return u;});
    const ex=activeWorkout?.exercises[ei];startRest(ex?.restSecs||90);hap();
  }

  function finishWorkout(){
    if(activeWorkout){
      const nh={...history};
      activeWorkout.exercises.forEach(ex=>{const k=ex.name.toLowerCase().replace(/\s+/g,"_");const done=ex.sets.filter(s=>s.done);if(done.length>0){if(!nh[k])nh[k]=[];nh[k]=[...nh[k],{date:new Date().toISOString(),sets:done}];}});
      setHistory(nh);
      const burn=todayType==="training"?Math.round(45*6):Math.round(45*11);
      if(onEarnedCals)onEarnedCals(burn);
    }
    setActiveWorkout(null);setTrainScreen("today");
  }

  function getSuggestion(name){
    const k=name.toLowerCase().replace(/\s+/g,"_");const prev=history[k];if(!prev||!prev.length)return null;
    const last=prev[prev.length-1];const lastSet=last.sets[last.sets.length-1];if(!lastSet)return null;
    const {reps,weight}=lastSet;
    return reps>=12?{weight:(parseFloat(weight||0)+5).toFixed(0),reps:"8-10",note:"Weight ↑"}:{weight,reps:String(parseInt(reps)+1),note:"Add a rep"};
  }

  async function connectStrava(){
    if(!stravaToken.trim())return;setStravaStatus("connecting");
    try{const[a,b]=await Promise.all([fetch("https://www.strava.com/api/v3/athlete",{headers:{Authorization:`Bearer ${stravaToken}`}}),fetch("https://www.strava.com/api/v3/athlete/activities?per_page=30",{headers:{Authorization:`Bearer ${stravaToken}`}})]);if(!a.ok)throw new Error();setStravaAthlete(await a.json());setStravaActs(await b.json());setStravaStatus("connected");if(onEarnedCals)onEarnedCals(earnedCals);}
    catch{setStravaStatus("error");}
  }

  async function handleFile(e,platform){
    const file=e.target.files?.[0];if(!file)return;setImportStatus(s=>({...s,[platform]:"reading..."}));
    try{const text=await file.text();let p=[];
      if(platform==="apple")p=parseAppleXML(text);
      else p=parseCSV(text,platform);
      if(platform==="apple")setAhActs(p);else if(platform==="garmin")setGarminActs(p);else setFitbitActs(p);
      setImportStatus(s=>({...s,[platform]:`✓ ${p.length} activities`}));}
    catch{setImportStatus(s=>({...s,[platform]:"Error"}))}
  }

  function parseAppleXML(xml){try{const doc=new DOMParser().parseFromString(xml,"text/xml");const AM={Running:"Running",Cycling:"Cycling",Walking:"Walking",TraditionalStrengthTraining:"Strength",HIIT:"HIIT",CrossTraining:"CrossFit",Swimming:"Swimming",Rowing:"Rowing"};return Array.from(doc.querySelectorAll("Workout")).map(w=>{const rt=(w.getAttribute("workoutActivityType")||"").replace("HKWorkoutActivityType","");return{id:w.getAttribute("startDate"),type:AM[rt]||rt||"Workout",icon:rt==="Running"?"🏃":rt==="Cycling"?"🚴":rt==="Walking"?"🚶":"💪",date:w.getAttribute("startDate"),durationMin:Math.round(parseFloat(w.getAttribute("duration")||0)),distanceKm:parseFloat(w.getAttribute("totalDistance")||0).toFixed(2),calories:Math.round(parseFloat(w.getAttribute("totalEnergyBurned")||0)),source:"Apple Health",sourceIcon:"🍎"};}).filter(a=>a.calories>0).reverse();}catch{return[];}}
  function parseCSV(text,platform){try{const lines=text.trim().split("\n").filter(Boolean);if(lines.length<2)return[];const pr=l=>{const c=[];let cur="",q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){c.push(cur.trim());cur="";}else cur+=ch;}c.push(cur.trim());return c;};const h=pr(lines[0]);const gi=n=>h.findIndex(x=>x.toLowerCase().includes(n.toLowerCase()));const iT=gi("type")||gi("activity"),iD=gi("date"),iDist=gi("distance"),iC=gi("calorie"),iDur=gi("duration");return lines.slice(1).map((l,i)=>{const c=pr(l);const t=c[iT]||"Workout";return{id:`${platform}-${i}`,type:t,icon:t.toLowerCase().includes("run")?"🏃":t.toLowerCase().includes("cycl")?"🚴":"💪",date:c[iD]||"",durationMin:Math.round(parseFloat(c[iDur]||0)),distanceKm:parseFloat(c[iDist]||0).toFixed(2),calories:Math.round(parseFloat(c[iC]||0)),source:platform==="garmin"?"Garmin":"Fitbit",sourceIcon:platform==="garmin"?"⌚":"💜"};}).filter(a=>a.date&&a.calories>0).reverse();}catch{return[];}}

  const connCount=[stravaStatus==="connected",ahActs.length>0,garminActs.length>0,fitbitActs.length>0].filter(Boolean).length;

  // ── LAYOUT ─────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    {id:"fuel",  label:"Fuel",    icon:"⚡", color:T.prot},
    {id:"train", label:"Train",   icon:"💪", color:T.carb},
    {id:"connect",label:"Connect",icon:"🔗", color:T.fat},
    {id:"settings",label:"Settings",icon:"⚙️",color:T.mu},
  ];

  const activeColor = NAV_ITEMS.find(n=>n.id===section)?.color||T.prot;

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:T.bg}}>
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900;ital@0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile&&(
        <aside style={{width:240,flexShrink:0,background:T.s1,borderRight:`1px solid ${T.bd}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"24px 20px 20px"}}>
            <Logo size={30}/>
          </div>
          <div style={{padding:"0 12px",flex:1}}>
            {NAV_ITEMS.map(item=>(
              <button key={item.id} onClick={()=>setSection(item.id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",marginBottom:4,
                  background:section===item.id?`${item.color}15`:"none",
                  color:section===item.id?item.color:T.mu,
                  fontSize:14,fontWeight:section===item.id?700:500,
                  borderLeft:section===item.id?`3px solid ${item.color}`:"3px solid transparent",
                  transition:"all 0.15s"}}>
                <span style={{fontSize:16}}>{item.icon}</span>
                {item.label}
                {item.id==="connect"&&connCount>0&&<span style={{marginLeft:"auto",background:T.prot,color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 7px"}}>{connCount}</span>}
              </button>
            ))}
          </div>
          {/* Sidebar bottom: today summary */}
          <div style={{padding:"16px",borderTop:`1px solid ${T.bd}`}}>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Today</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:12,color:T.mu}}>Calories</span>
              <span style={{fontSize:12,fontWeight:700,color:remaining.calories<0?T.red:"#fff"}}>{remaining.calories} left</span>
            </div>
            {[[T.prot,"P",consumed.protein,macros.protein],[T.carb,"C",consumed.carbs,macros.carbs],[T.fat,"F",consumed.fat,macros.fat]].map(([c,l,v,t])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <span style={{fontSize:10,fontWeight:700,color:c,width:10}}>{l}</span>
                <div style={{flex:1,height:3,background:T.s3,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(v/t,1)*100}%`,background:c,borderRadius:2}}/>
                </div>
                <span style={{fontSize:10,color:T.mu,minWidth:28,textAlign:"right"}}>{t-v}g</span>
              </div>
            ))}
            <div style={{marginTop:10,background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:cfg.color,fontWeight:700}}>{cfg.emoji} {todayFocus}</div>
              {earnedCals>0&&<div style={{fontSize:10,color:T.carb,fontWeight:700}}>+{earnedCals} earned</div>}
            </div>
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Top bar — desktop */}
        {!isMobile&&(
          <div style={{padding:"20px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
            <div>
              <div style={{fontSize:13,color:T.mu}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
              <div style={{fontSize:22,fontWeight:800}}>Hey, {profile.name} 👋</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{background:`${cfg.color}18`,border:`1px solid ${cfg.color}`,borderRadius:20,padding:"5px 14px",color:cfg.color,fontSize:11,fontWeight:700,letterSpacing:2}}>{cfg.emoji} {todayType.toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Mobile top bar */}
        {isMobile&&(
          <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.bd}`,flexShrink:0,background:T.s1}}>
            <Logo size={24}/>
            <div style={{display:"flex",gap:6}}>
              <div style={{background:`${cfg.color}18`,border:`1px solid ${cfg.color}`,borderRadius:20,padding:"4px 10px",color:cfg.color,fontSize:9,fontWeight:700,letterSpacing:1}}>{cfg.emoji} {todayFocus.slice(0,8).toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{flex:1,padding:isMobile?"0":"20px 32px 24px",overflowY:isMobile?"auto":"visible"}}>
          {section==="fuel"&&<FuelSection log={log} macros={macros} consumed={consumed} remaining={remaining} cfg={cfg} todayType={todayType} todayFocus={todayFocus} earnedCals={earnedCals} todayActs={todayActs} fuelScreen={fuelScreen} setFuelScreen={setFuelScreen} foodInput={foodInput} setFoodInput={setFoodInput} logging={logging} logMsg={logMsg} aiLog={aiLog} logMode={logMode} setLogMode={setLogMode} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} barcodeResult={barcodeResult} barcodeLoading={barcodeLoading} scanBarcode={scanBarcode} addBarcode={addBarcode} quickFields={quickFields} setQF={setQF} addQuick={addQuick} removeLog={removeLog} recs={recs} recsLoading={recsLoading} fetchRecs={fetchRecs} recipes={recipes} recipesLoading={recipesLoading} fetchRecipes={fetchRecipes} fastProto={fastProto} setFastProto={setFastProto} fastActive={fastActive} setFastActive={setFastActive} fastStart={fastStart} setFastStart={setFastStart} fastCustomH={fastCustomH} setFastCustomH={setFastCustomH} fastHours={fastHours} fastElapsed={fastElapsed} fastPct={fastPct} fastRemaining={fastRemaining} eatOpen={eatOpen} city={city} setCity={setCity} isMobile={isMobile}/>}
          {section==="train"&&<TrainSection profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} trainScreen={trainScreen} setTrainScreen={setTrainScreen} workout={workout} workoutLoading={workoutLoading} generateWorkout={generateWorkout} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} restActive={restActive} restTimer={restTimer} logSet={logSet} finishWorkout={finishWorkout} getSuggestion={getSuggestion} history={history} planMode={planMode} setPlanMode={setPlanMode} runPlan={runPlan} setRunPlan={setRunPlan} hybridMix={hybridMix} setHybridMix={setHybridMix} startStructured={startStructured} todayKey={todayKey} todayType={todayType} todayFocus={todayFocus} cfg={cfg} isMobile={isMobile}/>}
          {section==="connect"&&<ConnectSection stravaToken={stravaToken} setStravaToken={setStravaToken} stravaStatus={stravaStatus} stravaAthlete={stravaAthlete} stravaActs={stravaActs} connectStrava={connectStrava} ahActs={ahActs} garminActs={garminActs} fitbitActs={fitbitActs} importStatus={importStatus} handleFile={handleFile} fileRef={fileRef} allActs={allActs} todayActs={todayActs} earnedCals={earnedCals} isMobile={isMobile}/>}
          {section==="settings"&&<SettingsSection profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} todayKey={todayKey} isMobile={isMobile} onSignOut={onSignOut} user={user}/>}
        </div>

        {/* Mobile bottom nav */}
        {isMobile&&(
          <div style={{position:"sticky",bottom:0,background:"rgba(6,13,26,0.97)",borderTop:`1px solid ${T.bd}`,display:"flex",zIndex:50,flexShrink:0}}>
            {NAV_ITEMS.map(item=>(
              <button key={item.id} onClick={()=>setSection(item.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 0",fontSize:8,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",fontFamily:"inherit",color:section===item.id?item.color:T.mu,position:"relative"}}>
                <div style={{fontSize:18,marginBottom:2}}>{item.icon}</div>
                {item.label}
                {item.id==="connect"&&connCount>0&&<span style={{position:"absolute",top:6,left:"58%",background:T.prot,color:"#fff",borderRadius:6,fontSize:8,fontWeight:800,padding:"0 3px",lineHeight:"12px"}}>{connCount}</span>}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── FUEL SECTION ────────────────────────────────────────────────────────────
function FuelSection({log,macros,consumed,remaining,cfg,todayType,todayFocus,earnedCals,todayActs,fuelScreen,setFuelScreen,foodInput,setFoodInput,logging,logMsg,aiLog,logMode,setLogMode,barcodeInput,setBarcodeInput,barcodeResult,barcodeLoading,scanBarcode,addBarcode,quickFields,setQF,addQuick,removeLog,recs,recsLoading,fetchRecs,recipes,recipesLoading,fetchRecipes,fastProto,setFastProto,fastActive,setFastActive,fastStart,setFastStart,fastCustomH,setFastCustomH,fastHours,fastElapsed,fastPct,fastRemaining,eatOpen,city,setCity,isMobile}) {

  const FUEL_TABS=[{id:"home",label:"Home"},{id:"log",label:"Log Food"},{id:"recs",label:"Restaurants"},{id:"recipes",label:"Recipes"},{id:"fast",label:"Fasting"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");

  return (
    <div style={{paddingBottom:isMobile?20:0}}>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:4,padding:isMobile?"12px 18px 0":"0 0 20px",overflowX:"auto",flexShrink:0}}>
        {FUEL_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setFuelScreen(tab.id)}
            style={{padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:fuelScreen===tab.id?T.prot:"none",
              color:fuelScreen===tab.id?"#fff":T.mu,fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:isMobile?"12px 18px":"0"}}>

        {/* ── HOME ── */}
        {fuelScreen==="home"&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            {/* Calorie card */}
            <SectionCard title="Daily Calories">
              {earnedCals>0&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}30`,borderRadius:10,padding:"9px 13px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:11,color:T.prot,fontWeight:700}}>🔥 Burned today — added to budget</div>
                <div style={{color:T.prot,fontWeight:800,fontSize:15}}>+{earnedCals} kcal</div>
              </div>}
              <div style={{display:"flex",alignItems:"center",gap:isMobile?16:24}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <MacroRing protein={consumed.protein} carbs={consumed.carbs} fat={consumed.fat} pTarget={macros.protein} cTarget={macros.carbs} fTarget={macros.fat} size={isMobile?160:180} sw={14}/>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontWeight:900,fontSize:isMobile?32:36,lineHeight:1,color:remaining.calories<0?"#FF4D6D":"#fff"}}>{remaining.calories}</div>
                    <div style={{color:T.mu,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>kcal left</div>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    {[["Budget",macros.calories],["Eaten",consumed.calories]].map(([l,v])=>(<div key={l}><div style={{color:T.mu,fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{l}</div><div style={{fontWeight:800,fontSize:20}}>{v}</div></div>))}
                  </div>
                  <MacroBar label="Protein" consumed={consumed.protein} target={macros.protein} color={T.prot}/>
                  <MacroBar label="Carbs"   consumed={consumed.carbs}   target={macros.carbs}   color={T.carb}/>
                  <MacroBar label="Fat"     consumed={consumed.fat}     target={macros.fat}     color={T.fat}/>
                </div>
              </div>
            </SectionCard>

            {/* Quick log + food log */}
            <SectionCard title="Food Log" action={<button onClick={()=>setFuelScreen("log")} style={{background:T.prot,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add Food</button>}>
              {log.length===0?<div style={{textAlign:"center",padding:"24px 0",color:T.mu,border:`1px dashed ${T.bd}`,borderRadius:10}}><div style={{fontSize:28,marginBottom:8}}>🍽️</div><div style={{fontSize:13}}>Nothing logged yet</div></div>
                :log.slice(0,8).map(item=>(<div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.dim}`}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,textTransform:"capitalize"}}>{item.food||item.name}</div>
                    <div style={{fontSize:11,color:T.mu}}>P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g <span style={{fontSize:9}}>{item.method==="barcode"?"📷":item.method==="quick"?"✏️":"🧠"}</span></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{color:cfg.color,fontWeight:700,fontSize:14}}>{item.calories}</div>
                    <button onClick={()=>removeLog(item.id)} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:14,padding:"2px 4px"}}>×</button>
                  </div>
                </div>))}
              {log.length>8&&<div style={{fontSize:12,color:T.mu,textAlign:"center",marginTop:8}}>+ {log.length-8} more entries</div>}
            </SectionCard>

            {/* Quick action pills */}
            {isMobile&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[["🍽️ Restaurants",()=>setFuelScreen("recs")],["👨‍🍳 Recipes",()=>setFuelScreen("recipes")],["⏱️ Fasting",()=>setFuelScreen("fast")]].map(([l,fn])=>(
                <button key={l} onClick={fn} style={{flex:1,minWidth:90,padding:"12px 8px",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:11,cursor:"pointer",fontFamily:"inherit",color:"#fff",fontSize:12,fontWeight:600}}>{l}</button>
              ))}
            </div>}
          </div>
        )}

        {/* ── LOG FOOD ── */}
        {fuelScreen==="log"&&(
          <div style={{maxWidth:isMobile?"100%":600}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>LOG FOOD</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>3 ways to track what you eat</p>
            <div style={{display:"flex",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:3,gap:3,marginBottom:18}}>
              {[["ai","🧠 AI"],["barcode","📷 Barcode"],["quick","✏️ Quick"]].map(([k,l])=>(
                <button key={k} onClick={()=>setLogMode(k)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",background:logMode===k?`${T.prot}18`:"none",outline:logMode===k?`1.5px solid ${T.prot}`:"none",color:logMode===k?T.prot:T.mu,fontSize:12,fontWeight:700}}>{l}</button>
              ))}
            </div>
            {logMode==="ai"&&<>
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} placeholder="Describe your meal... e.g. grilled chicken 6oz, brown rice 1 cup, steamed broccoli" style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,resize:"none",outline:"none",minHeight:80,fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
              </div>
              {logMsg&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}30`,borderRadius:9,padding:"8px 12px",fontSize:12,color:T.prot,marginBottom:10}}>{logMsg}</div>}
              <PrimaryBtn onClick={aiLog} label={logging?"Analyzing…":"Add to Log →"} disabled={logging||!foodInput.trim()}/>
            </>}
            {logMode==="barcode"&&<>
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Barcode number</div>
                <input value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} placeholder="e.g. 0070038642824" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"11px 13px",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",letterSpacing:1}}/>
                <div style={{fontSize:10,color:T.mu,marginTop:7}}>Tip: Use your phone camera app to scan — it shows the barcode number. Paste it here.</div>
              </div>
              {barcodeResult&&<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{barcodeResult.name}</div>
                {barcodeResult.brand&&<div style={{fontSize:11,color:T.mu,marginBottom:8}}>{barcodeResult.brand} · {barcodeResult.serving}</div>}
                <div style={{display:"flex",gap:14,marginBottom:12}}>
                  {[["Cal",barcodeResult.calories,""],["P",barcodeResult.protein,"g"],["C",barcodeResult.carbs,"g"],["F",barcodeResult.fat,"g"]].map(([l,v,u])=>(<div key={l}><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:T.prot}}>{v}{u}</div></div>))}
                </div>
                <PrimaryBtn onClick={addBarcode} label="Add to Log →"/>
              </div>}
              {barcodeLoading&&<div style={{textAlign:"center",padding:"16px",color:T.mu,fontSize:13}}>Looking up product…</div>}
              <PrimaryBtn onClick={scanBarcode} label="Look Up Barcode →" disabled={barcodeLoading||!barcodeInput.trim()}/>
            </>}
            {logMode==="quick"&&<>
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                {[["Name (optional)","text","name","e.g. Protein shake"],["Calories","number","calories","0"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                  <div key={k} style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                    <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
              <PrimaryBtn onClick={addQuick} label="Add Entry →" disabled={!quickFields.calories}/>
            </>}
          </div>
        )}

        {/* ── RESTAURANTS ── */}
        {fuelScreen==="recs"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>NEARBY EATS</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:18}}>AI finds exact orders at real restaurants to hit your remaining macros</p>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {[["Left",remaining.calories,T.prot],["Protein",`${remaining.protein}g`,T.prot],["Carbs",`${remaining.carbs}g`,T.carb],["Fat",`${remaining.fat}g`,T.fat]].map(([l,v,c])=>(
                <div key={l} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:"12px 16px",flex:1,minWidth:80}}>
                  <div style={{color:c,fontWeight:800,fontSize:18,lineHeight:1}}>{v}</div>
                  <div style={{color:T.mu,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Your City</div>
              <input value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Miami FL, Austin TX, Chicago…" style={{width:"100%",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            {recsLoading?<div style={{textAlign:"center",padding:"48px 0",color:T.mu}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spinner/></div><div style={{fontSize:13}}>Finding your meals…</div></div>
              :<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",lineHeight:1.85,fontSize:14,color:"#ccc",whiteSpace:"pre-wrap",minHeight:recs?0:80}}>{recs||<span style={{color:T.mu}}>Tap below to get recommendations</span>}</div>}
            <button onClick={fetchRecs} style={{width:"100%",padding:"13px",background:T.s2,color:T.prot,fontSize:13,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.prot}25`,borderRadius:11,cursor:"pointer",marginTop:10,fontFamily:"inherit"}}>{recs?"↺ Refresh":"Find Restaurants →"}</button>
          </div>
        )}

        {/* ── RECIPES ── */}
        {fuelScreen==="recipes"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>RECIPES</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:18}}>Simple home meals built around what macros you still need today</p>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["Protein",`${remaining.protein}g`,T.prot],["Carbs",`${remaining.carbs}g`,T.carb],["Fat",`${remaining.fat}g`,T.fat]].map(([l,v,c])=>(
                <div key={l} style={{background:T.s2,border:`1px solid ${c}30`,borderRadius:10,padding:"12px 14px",flex:1}}>
                  <div style={{color:c,fontWeight:800,fontSize:18}}>{v}</div>
                  <div style={{color:T.mu,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:3}}>{l} left</div>
                </div>
              ))}
            </div>
            {recipesLoading?<div style={{textAlign:"center",padding:"48px 0",color:T.mu}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spinner/></div><div style={{fontSize:13}}>Building your recipes…</div></div>
              :<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",lineHeight:1.85,fontSize:14,color:"#ccc",whiteSpace:"pre-wrap",minHeight:recipes?0:80}}>{recipes||<span style={{color:T.mu}}>Tap below to generate recipes</span>}</div>}
            <button onClick={fetchRecipes} style={{width:"100%",padding:"13px",background:T.s2,color:T.carb,fontSize:13,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.carb}25`,borderRadius:11,cursor:"pointer",marginTop:10,fontFamily:"inherit"}}>{recipes?"↺ New Recipes":"Generate Recipes →"}</button>
          </div>
        )}

        {/* ── FASTING ── */}
        {fuelScreen==="fast"&&(
          <div style={{maxWidth:isMobile?"100%":560}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>FASTING</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Track your fasting window and eating schedule</p>
            <SectionCard title="Protocol">
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {FASTING_PROTOCOLS.map(p=>(<button key={p.id} onClick={()=>{setFastProto(p.id);if(fastActive)setFastActive(false);}} style={{padding:"9px 14px",borderRadius:9,border:`1.5px solid ${fastProto===p.id?T.prot:T.bd}`,background:fastProto===p.id?`${T.prot}15`:T.s3,color:fastProto===p.id?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{p.label}</button>))}
              </div>
              <div style={{fontSize:12,color:T.mu}}>{fastProto==="custom"?`${fastCustomH}h fast · ${24-fastCustomH}h eat`:FASTING_PROTOCOLS.find(p=>p.id===fastProto)?.desc}</div>
              {fastProto==="custom"&&<div style={{marginTop:12}}>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>Fasting hours: {fastCustomH}h</div>
                <input type="range" min="12" max="23" value={fastCustomH} onChange={e=>{setFastCustomH(parseInt(e.target.value));hap();}} style={{width:"100%"}}/>
              </div>}
            </SectionCard>
            <div style={{textAlign:"center",margin:"20px 0"}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <Ring value={fastElapsed} max={fastHours} color={eatOpen?T.carb:T.prot} size={180} sw={14}/>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                  {fastActive?(eatOpen?<><div style={{fontSize:13,color:T.carb,fontWeight:700,marginBottom:4}}>🎉 EAT NOW</div><div style={{fontWeight:900,fontSize:20,color:T.carb}}>Window Open</div></>:<><div style={{fontSize:11,color:T.mu,marginBottom:4}}>Fasting</div><div style={{fontWeight:900,fontSize:26,color:T.prot,fontVariantNumeric:"tabular-nums"}}>{pad2(fastRemaining/3600000)}:{pad2((fastRemaining%3600000)/60000)}:{pad2((fastRemaining%60000)/1000)}</div><div style={{fontSize:10,color:T.mu,marginTop:3}}>remaining</div></>):<><div style={{fontSize:11,color:T.mu,marginBottom:4}}>Ready to start</div><div style={{fontWeight:900,fontSize:26,color:T.mu}}>{fastHours}:00:00</div></>}
                </div>
              </div>
            </div>
            {!fastActive?<PrimaryBtn onClick={()=>{setFastActive(true);setFastStart(Date.now());hap();}} label="Start Fasting →"/>
              :<div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setFastActive(false);setFastStart(null);}} style={{flex:1,padding:"14px",background:T.s2,color:T.red,fontWeight:700,fontSize:13,border:`1px solid ${T.red}30`,borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>End Fast</button>
                {eatOpen&&<button onClick={()=>{setFastActive(false);setFastStart(null);}} style={{flex:2,padding:"14px",background:T.carb,color:"#000",fontWeight:800,fontSize:14,border:"none",borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>Break Fast 🎉</button>}
              </div>}
          </div>
        )}

      </div>
    </div>
  );
}

// ─── TRAIN SECTION ────────────────────────────────────────────────────────────
function TrainSection({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,trainScreen,setTrainScreen,workout,workoutLoading,generateWorkout,activeWorkout,setActiveWorkout,restActive,restTimer,logSet,finishWorkout,getSuggestion,history,planMode,setPlanMode,runPlan,setRunPlan,hybridMix,setHybridMix,startStructured,todayKey,todayType,todayFocus,cfg,isMobile}) {
  const TRAIN_TABS=[{id:"today",l:"Today"},{id:"workout",l:"AI Workout"},{id:"active",l:"Active"},{id:"plan",l:"Program"},{id:"progress",l:"Progress"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");

  return (
    <div style={{paddingBottom:isMobile?20:0}}>
      <div style={{display:"flex",gap:4,padding:isMobile?"12px 18px 0":"0 0 20px",overflowX:"auto"}}>
        {TRAIN_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setTrainScreen(tab.id)} style={{padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:trainScreen===tab.id?T.carb:"none",color:trainScreen===tab.id?"#000":T.mu,fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>{tab.l}</button>
        ))}
      </div>

      <div style={{padding:isMobile?"12px 18px":"0"}}>

        {/* ── TODAY ── */}
        {trainScreen==="today"&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <SectionCard title="Today's Session" action={<div style={{background:cfg.bg,border:`1px solid ${cfg.color}`,borderRadius:20,padding:"4px 12px",color:cfg.color,fontSize:10,fontWeight:700,letterSpacing:2}}>{cfg.emoji} {todayFocus}</div>}>
              <div style={{fontSize:28,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,marginBottom:4}}>{todayFocus}</div>
              <div style={{fontSize:12,color:T.mu,marginBottom:4}}>{wPrefs.splitType} · {wPrefs.equipment}</div>
              <div style={{fontSize:12,color:T.mu,marginBottom:16}}>💡 {FOCUS_MUSCLES[todayFocus]||"Full body movement — hit all major patterns"}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={generateWorkout} style={{flex:1,padding:"13px",background:T.carb,color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>AI Workout →</button>
                <button onClick={startStructured} style={{flex:1,padding:"13px",background:T.s3,color:T.carb,fontWeight:700,fontSize:13,border:`1px solid ${T.carb}30`,borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>▶ Start Session</button>
              </div>
            </SectionCard>

            <SectionCard title="This Week">
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:12}}>
                {WDAYS.map(day=>{const t=schedule[day];const c=DAY_CFG[t]||DAY_CFG.rest;const isT=day===todayKey;const f=dayFocus[day];return(
                  <div key={day} style={{background:isT?`${T.prot}15`:T.s3,border:`1px solid ${isT?T.prot:T.dim}`,borderRadius:8,padding:"8px 4px",textAlign:"center"}}>
                    <div style={{fontSize:8,fontWeight:700,color:isT?T.prot:T.mu,marginBottom:4}}>{day}</div>
                    <div style={{fontSize:14}}>{c.emoji}</div>
                    <div style={{fontSize:7,color:isT?T.prot:T.dim,marginTop:3}}>{f?.slice(0,4)}</div>
                  </div>
                );})}
              </div>
            </SectionCard>

            {/* Muscle Volume Tracker — Strongsplit style with green optimal zone */}
            <SectionCard title="Weekly Muscle Volume" style={{gridColumn:isMobile?"1":"1 / -1"}}>
              <div style={{fontSize:11,color:T.mu,marginBottom:12}}>Each muscle needs 10–20 sets/week for optimal growth. <span style={{color:"#00E676"}}>Green markers</span> show the optimal zone.</div>
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {[
                  {m:"Shoulders",sessions:WDAYS.filter(d=>["Push","Arnold A","Full Body"].includes(dayFocus[d])).length,color:T.prot,heads:["Posterior","Lateral","Anterior"]},
                  {m:"Chest",sessions:WDAYS.filter(d=>["Push","Arnold A","Full Body"].includes(dayFocus[d])).length,color:T.prot,heads:["Upper","Mid","Lower"]},
                  {m:"Back",sessions:WDAYS.filter(d=>["Pull","Arnold B","Full Body"].includes(dayFocus[d])).length,color:T.prot,heads:["Lats (width)","Thickness"]},
                  {m:"Legs",sessions:WDAYS.filter(d=>["Legs","Full Body"].includes(dayFocus[d])).length,color:"#00C9A7",heads:["Quads","Hamstrings","Glutes"]},
                  {m:"Biceps",sessions:WDAYS.filter(d=>["Pull","Arnold B"].includes(dayFocus[d])).length,color:T.prot,heads:["Long head","Short head"]},
                  {m:"Triceps",sessions:WDAYS.filter(d=>["Push","Arnold A"].includes(dayFocus[d])).length,color:T.prot,heads:["All 3 heads"]},
                ].map(({m,sessions,color,heads})=>{
                  const sets=sessions*3; // avg 3 sets per session per muscle
                  const pct=Math.min(sets/20,1);
                  const isOptimal=sets>=10&&sets<=20;
                  const needsMore=sets<10;
                  return(
                    <div key={m} style={{padding:"12px 0",borderBottom:`1px solid ${T.dim}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>{m}</span>
                          <span style={{fontSize:10,color:T.mu}}>{heads.join(" · ")}</span>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          {isOptimal&&<span style={{fontSize:9,color:"#00E676",background:"rgba(0,230,118,.1)",border:"1px solid rgba(0,230,118,.25)",borderRadius:8,padding:"2px 8px",fontWeight:700}}>✓ Optimal</span>}
                          {needsMore&&<span style={{fontSize:9,color:"#FFD740",background:"rgba(255,215,64,.1)",border:"1px solid rgba(255,215,64,.2)",borderRadius:8,padding:"2px 8px",fontWeight:700}}>+ Add sessions</span>}
                          <span style={{fontSize:14,fontWeight:800,color:isOptimal?"#00E676":needsMore?"#FFD740":color}}>~{sets} sets</span>
                        </div>
                      </div>
                      <div style={{position:"relative",height:6,background:T.s3,borderRadius:3,overflow:"visible"}}>
                        <div style={{height:"100%",width:`${pct*100}%`,background:isOptimal?"#00E676":needsMore?"#FFD740":color,borderRadius:3,transition:"width .8s ease",opacity:.85}}/>
                        {/* Optimal zone markers — the green lines */}
                        <div style={{position:"absolute",top:-2,left:"50%",width:2,height:10,background:"rgba(0,230,118,.7)",borderRadius:1}}/>
                        <div style={{position:"absolute",top:-2,left:"100%",width:2,height:10,background:"rgba(0,230,118,.7)",borderRadius:1}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:16,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.dim}`,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:2,background:"rgba(0,230,118,.7)",borderRadius:1}}></div><span style={{fontSize:11,color:T.mu}}>Optimal zone (10–20 sets/week)</span></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:3,background:"#00E676",borderRadius:1}}></div><span style={{fontSize:11,color:T.mu}}>In optimal range</span></div>
                <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:14,height:3,background:"#FFD740",borderRadius:1}}></div><span style={{fontSize:11,color:T.mu}}>Needs more volume</span></div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── AI WORKOUT ── */}
        {trainScreen==="workout"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900}}>{todayFocus}</div>
              <div style={{display:"flex",gap:6}}>
                {wPrefs.isHybrid&&<div style={{background:`${T.carb}15`,border:`1px solid ${T.carb}`,color:T.carb,fontSize:8,fontWeight:700,padding:"3px 9px",borderRadius:20}}>HYBRID</div>}
                {wPrefs.isHyrox&&<div style={{background:`${T.fat}15`,border:`1px solid ${T.fat}`,color:T.fat,fontSize:8,fontWeight:700,padding:"3px 9px",borderRadius:20}}>HYROX</div>}
              </div>
            </div>
            <div style={{fontSize:13,color:T.mu,marginBottom:20}}>{wPrefs.equipment} · {profile.goal} · {wPrefs.splitType}</div>
            {workoutLoading?<div style={{textAlign:"center",padding:"56px 0",color:T.mu}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spinner/></div><div style={{fontSize:14,marginBottom:6}}>Building your session…</div><div style={{fontSize:11,color:T.dim}}>Covering all muscle heads</div></div>
              :<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",lineHeight:1.85,fontSize:13.5,color:"#ccc",whiteSpace:"pre-wrap"}}>{workout||"Tap generate to build today's session."}</div>}
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={generateWorkout} style={{flex:1,padding:"12px",background:T.s2,color:T.carb,fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.carb}25`,borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate</button>
              {workout&&<button onClick={startStructured} style={{flex:1,padding:"12px",background:T.carb,color:"#000",fontSize:12,fontWeight:800,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>▶ Start Session →</button>}
            </div>
          </div>
        )}

        {/* ── ACTIVE WORKOUT ── */}
        {trainScreen==="active"&&(
          <div style={{maxWidth:isMobile?"100%":680}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900}}>ACTIVE SESSION</div>
              <button onClick={finishWorkout} style={{padding:"9px 18px",background:`${T.carb}15`,border:`1px solid ${T.carb}`,borderRadius:9,color:T.carb,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Finish ✓</button>
            </div>
            {restActive&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}30`,borderRadius:12,padding:"14px 18px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>⏱ Rest Timer</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>Next set when ready</div></div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,color:T.prot,fontVariantNumeric:"tabular-nums"}}>{pad2(restTimer/60)}:{pad2(restTimer%60)}</div>
            </div>}
            {!activeWorkout?<div style={{textAlign:"center",padding:"40px 0",color:T.mu}}>
              <div style={{fontSize:28,marginBottom:12}}>💪</div>
              <div style={{fontSize:14,marginBottom:16}}>No active session</div>
              <button onClick={startStructured} style={{padding:"13px 24px",background:T.carb,color:"#000",fontWeight:800,fontSize:14,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>Build Workout →</button>
            </div>:activeWorkout.exercises.map((ex,ei)=>{
              const sugg=getSuggestion(ex.name);
              return(<div key={ei} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div><div style={{fontSize:15,fontWeight:700}}>{ex.name}</div>{ex.notes&&<div style={{fontSize:11,color:T.mu,marginTop:2}}>{ex.notes}</div>}</div>
                  {sugg&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}25`,borderRadius:8,padding:"6px 10px",textAlign:"right"}}>
                    <div style={{fontSize:8,color:T.prot,fontWeight:700,letterSpacing:1}}>SUGGESTED</div>
                    <div style={{fontSize:13,fontWeight:800,color:T.prot}}>{sugg.weight}lbs × {sugg.reps}</div>
                    <div style={{fontSize:9,color:T.mu}}>{sugg.note}</div>
                  </div>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:".4fr 1fr 1fr .7fr",gap:6,marginBottom:6}}>
                  {["Set","Weight","Reps","Log"].map(h=>(<div key={h} style={{fontSize:9,color:T.mu,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{h}</div>))}
                </div>
                {ex.sets.map((s,si)=>(<div key={si} style={{display:"grid",gridTemplateColumns:".4fr 1fr 1fr .7fr",gap:6,marginBottom:7,alignItems:"center"}}>
                  <div style={{fontSize:13,color:s.done?T.carb:T.mu,fontWeight:700}}>#{si+1}</div>
                  <input defaultValue={s.weight||sugg?.weight||0} style={{background:s.done?`${T.carb}12`:T.s3,border:`1px solid ${s.done?T.carb:T.bd}`,borderRadius:7,padding:"8px 9px",color:s.done?T.carb:"#fff",fontSize:13,fontWeight:700,outline:"none",fontFamily:"inherit"}} onChange={e=>{const u={...activeWorkout};u.exercises[ei].sets[si].weight=e.target.value;setActiveWorkout(u);}}/>
                  <input defaultValue={s.reps||sugg?.reps||10} style={{background:s.done?`${T.carb}12`:T.s3,border:`1px solid ${s.done?T.carb:T.bd}`,borderRadius:7,padding:"8px 9px",color:s.done?T.carb:"#fff",fontSize:13,fontWeight:700,outline:"none",fontFamily:"inherit"}} onChange={e=>{const u={...activeWorkout};u.exercises[ei].sets[si].reps=e.target.value;setActiveWorkout(u);}}/>
                  <button onClick={()=>{const u={...activeWorkout};logSet(ei,si,u.exercises[ei].sets[si].reps,u.exercises[ei].sets[si].weight);}} style={{padding:"8px 0",background:s.done?T.carb:T.s3,color:s.done?"#000":"#fff",border:`1px solid ${s.done?T.carb:T.bd}`,borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>{s.done?"✓":"Log"}</button>
                </div>))}
                <button onClick={()=>{const u={...activeWorkout};u.exercises[ei].sets=[...u.exercises[ei].sets,{reps:u.exercises[ei].sets[0]?.reps||10,weight:u.exercises[ei].sets[0]?.weight||0,done:false}];setActiveWorkout(u);}} style={{fontSize:11,color:T.mu,background:"none",border:`1px dashed ${T.bd}`,borderRadius:7,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>+ Add set</button>
              </div>);
            })}
            {activeWorkout&&<PrimaryBtn onClick={finishWorkout} label="Finish Workout ✓" style={{background:T.carb,color:"#000",marginTop:8}}/>}
          </div>
        )}

        {/* ── PLAN ── */}
        {trainScreen==="plan"&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <SectionCard title="Training Mode">
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                {[["strength","🏋️ Strength"],["run","🏃 Running"],["hyrox","🔥 Hyrox"],["hybrid","⚡ Hybrid"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setPlanMode(k)} style={{padding:"9px 14px",borderRadius:9,border:`1.5px solid ${planMode===k?T.carb:T.bd}`,background:planMode===k?`${T.carb}15`:T.s3,color:planMode===k?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                ))}
              </div>
              {planMode==="hybrid"&&<div style={{borderTop:`1px solid ${T.bd}`,paddingTop:14}}>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Mix</div>
                <Toggle on={hybridMix.strength} onChange={v=>setHybridMix(p=>({...p,strength:v}))} label="💪 Strength splits"/>
                <Toggle on={hybridMix.run}      onChange={v=>setHybridMix(p=>({...p,run:v}))}      label="🏃 Running plan"/>
                <Toggle on={hybridMix.hyrox}    onChange={v=>setHybridMix(p=>({...p,hyrox:v}))}    label="🔥 Hyrox blocks"/>
              </div>}
              {planMode==="run"&&<div style={{borderTop:`1px solid ${T.bd}`,paddingTop:14}}>
                {Object.entries(RUN_PLANS).map(([k,p])=>(<div key={k} onClick={()=>setRunPlan(k)} style={{background:runPlan===k?`${T.carb}15`:T.s3,border:`1.5px solid ${runPlan===k?T.carb:T.bd}`,borderRadius:10,padding:"11px 13px",marginBottom:7,cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:13,fontWeight:700,color:runPlan===k?T.carb:"#fff"}}>{k}</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>{p.desc}</div></div>
                  {p.weeks>0&&<div style={{background:T.s2,borderRadius:7,padding:"3px 8px",fontSize:10,color:T.mu,fontWeight:700,alignSelf:"center"}}>{p.weeks}wk</div>}
                </div>))}
              </div>}
            </SectionCard>

            <SectionCard title="Weekly Schedule">
              {WDAYS.map(day=>{const t=schedule[day];const c=DAY_CFG[t]||DAY_CFG.rest;const isT=day===todayKey;const f=dayFocus[day];return(
                <div key={day} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.dim}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontWeight:700,fontSize:13,color:isT?T.prot:"#fff",width:32}}>{day}</span>
                    <span style={{background:c.bg,color:c.color,fontSize:9,fontWeight:700,letterSpacing:1,padding:"2px 8px",borderRadius:20,textTransform:"uppercase"}}>{f}</span>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    {["training","cardio","run","hyrox","rest"].map(tp=>(<button key={tp} onClick={()=>setSchedule(s=>({...s,[day]:tp}))} style={{fontSize:13,padding:"4px 6px",borderRadius:6,border:`1px solid ${schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).color:T.dim}`,background:schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).bg:"none",cursor:"pointer"}}>{(DAY_CFG[tp]||DAY_CFG.rest).emoji}</button>))}
                  </div>
                </div>
              );})}
            </SectionCard>
          </div>
        )}

        {/* ── PROGRESS ── */}
        {trainScreen==="progress"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>PROGRESSIVE OVERLOAD</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Every logged set tracked — weights suggested automatically next session</p>
            {Object.keys(history).length===0?<div style={{textAlign:"center",padding:"40px 0",color:T.mu,border:`1px dashed ${T.bd}`,borderRadius:12}}><div style={{fontSize:28,marginBottom:10}}>📈</div><div>Log workouts to see progress here</div></div>
              :<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
                {Object.entries(history).map(([key,sessions])=>{
                  const last=sessions[sessions.length-1];const prev=sessions.length>1?sessions[sessions.length-2]:null;
                  const lastMax=Math.max(...last.sets.map(s=>parseFloat(s.weight||0)));const prevMax=prev?Math.max(...prev.sets.map(s=>parseFloat(s.weight||0))):null;
                  const trend=prevMax?lastMax>prevMax?"↑":lastMax<prevMax?"↓":"→":null;
                  return(<div key={key} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 16px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{fontSize:14,fontWeight:700,textTransform:"capitalize"}}>{key.replace(/_/g," ")}</div>
                      {trend&&<div style={{fontSize:18,color:trend==="↑"?T.carb:trend==="↓"?T.red:T.mu,fontWeight:900}}>{trend}</div>}
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <div><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>Best</div><div style={{fontSize:18,fontWeight:800,color:T.prot}}>{lastMax}<span style={{fontSize:10,color:T.mu}}>lbs</span></div></div>
                      <div><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>Sessions</div><div style={{fontSize:18,fontWeight:800}}>{sessions.length}</div></div>
                      <div><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>Last</div><div style={{fontSize:13,fontWeight:600,color:T.mu}}>{new Date(last.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div></div>
                    </div>
                  </div>);
                })}
              </div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CONNECT SECTION ──────────────────────────────────────────────────────────
function ConnectSection({stravaToken,setStravaToken,stravaStatus,stravaAthlete,stravaActs,connectStrava,ahActs,garminActs,fitbitActs,importStatus,handleFile,fileRef,allActs,todayActs,earnedCals,isMobile}) {
  return (
    <div style={{paddingBottom:isMobile?20:0,padding:isMobile?"12px 18px":"0"}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>CONNECT DEVICES</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Burned calories automatically add to your Fuel budget</p>
      {earnedCals>0&&<div style={{background:`${T.carb}12`,border:`1px solid ${T.carb}30`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>🔥 Earned Today</div><div style={{fontSize:12,color:T.mu,marginTop:2}}>{todayActs.map(a=>`${a.icon} ${a.title||a.type}`).join(" · ")}</div></div><div style={{color:T.carb,fontWeight:900,fontSize:22}}>+{earnedCals} kcal</div></div>}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
        {/* Strava */}
        <SectionCard title="🟠 Strava — Live Sync">
          {stravaStatus==="connected"&&stravaAthlete?<div style={{background:T.s3,borderRadius:9,padding:"10px 12px",marginBottom:10}}><div style={{fontSize:12,fontWeight:700}}>{stravaAthlete.firstname} {stravaAthlete.lastname}</div><div style={{fontSize:11,color:T.mu}}>{stravaActs.length} activities · Live</div></div>:null}
          {stravaStatus!=="connected"&&<>
            <p style={{fontSize:12,color:T.mu,marginBottom:10,lineHeight:1.6}}>Get your token at <span style={{color:T.fat}}>strava.com/settings/api</span> — needs <code style={{background:T.s3,padding:"1px 4px",borderRadius:3,fontSize:10}}>activity:read_all</code> scope.</p>
            <input style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:9,padding:"11px 13px",color:"#fff",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:10}} value={stravaToken} placeholder="Paste Strava access token…" onChange={e=>setStravaToken(e.target.value)}/>
            <PrimaryBtn onClick={connectStrava} label={stravaStatus==="connecting"?"Connecting…":"Connect Strava →"} disabled={!stravaToken.trim()||stravaStatus==="connecting"}/>
            {stravaStatus==="error"&&<div style={{color:T.red,fontSize:11,marginTop:8}}>Invalid token. Check and try again.</div>}
          </>}
          {stravaStatus==="connected"&&<div style={{background:`${T.carb}12`,borderRadius:9,padding:"8px 12px",textAlign:"center",color:T.carb,fontSize:12,fontWeight:700}}>✓ Connected</div>}
        </SectionCard>
        {/* File imports */}
        {[["apple","🍎","Apple Health","XML export","export.xml","xml","iPhone: Health → Profile → Export All Health Data",ahActs],["garmin","⌚","Garmin Connect","CSV export","activities.csv","csv","Garmin Connect web → Activities → Export CSV",garminActs],["fitbit","💜","Fitbit","CSV export","activities.csv","csv","Fitbit.com → Manage Data → Export → Activities CSV",fitbitActs]].map(([id,icon,name,sub,file,ext,instructions,acts])=>(
          <SectionCard key={id} title={`${icon} ${name}`}>
            <p style={{fontSize:12,color:T.mu,marginBottom:10,lineHeight:1.6}}>{instructions}</p>
            {acts.length>0&&<div style={{background:`${T.carb}12`,borderRadius:9,padding:"7px 10px",marginBottom:10,fontSize:12,color:T.carb,fontWeight:700}}>✓ {acts.length} activities loaded</div>}
            <input ref={el=>fileRef.current[id]=el} type="file" accept={`.${ext}`} style={{display:"none"}} onChange={e=>handleFile(e,id)}/>
            <button onClick={()=>fileRef.current[id]?.click()} style={{width:"100%",padding:"12px",background:acts.length>0?T.s3:T.s3,color:T.prot,fontWeight:700,fontSize:12,border:`1px solid ${T.prot}25`,borderRadius:9,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>{acts.length>0?`Re-import ${file}`:`Import ${file} →`}</button>
            {importStatus[id]&&<div style={{fontSize:11,color:T.carb,marginTop:7}}>{importStatus[id]}</div>}
          </SectionCard>
        ))}
      </div>
      {allActs.length>0&&<div style={{marginTop:16}}>
        <SectionCard title={`Activity Feed — ${allActs.length} total`}>
          {allActs.slice(0,10).map(a=>(<div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.dim}`}}>
            <div style={{display:"flex",gap:10}}><div style={{fontSize:20}}>{a.icon}</div><div><div style={{fontSize:13,fontWeight:700}}>{a.title||a.type}</div><div style={{fontSize:11,color:T.mu}}>{a.sourceIcon} {a.source} · {a.date?new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—"}</div></div></div>
            <div style={{textAlign:"right"}}>{isToday(a.date)&&<div style={{background:`${T.carb}20`,color:T.carb,fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:8,marginBottom:2}}>TODAY</div>}<div style={{color:T.fat,fontWeight:800,fontSize:14}}>{a.calories} kcal</div></div>
          </div>))}
        </SectionCard>
      </div>}
    </div>
  );
}

// ─── SETTINGS SECTION ────────────────────────────────────────────────────────
function SettingsSection({profile,wPrefs,setWPrefs,schedule,setSchedule,dayFocus,todayKey,isMobile,onSignOut,user}) {
  const [delConfirm,setDelConfirm]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [checkInWeight,setCheckInWeight]=useState("");
  const [checkIns,setCheckIns]=useState([]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);

  // Load weight check-ins from Supabase
  useEffect(()=>{
    if(!user)return;
    sb.from("weight_checkins").select("*").eq("user_id",user.id).order("checked_at",{ascending:true}).then(({data})=>{
      if(data)setCheckIns(data);
    });
  },[user]);

  async function saveCheckIn() {
    if(!checkInWeight||!user)return;
    setSaving(true);
    const entry={user_id:user.id,weight:parseFloat(checkInWeight),unit:profile.wUnit||"lbs",checked_at:new Date().toISOString().split("T")[0]};
    const {data}=await sb.from("weight_checkins").insert(entry).select().single();
    if(data)setCheckIns(p=>[...p,data]);
    setCheckInWeight("");setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  async function deleteAccount() {
    if(!user)return;
    setDeleting(true);
    // Delete all user data
    await sb.from("profiles").delete().eq("id",user.id);
    await sb.from("weight_checkins").delete().eq("user_id",user.id);
    await sb.from("food_logs").delete().eq("user_id",user.id);
    await sb.from("workout_logs").delete().eq("user_id",user.id);
    await sb.auth.signOut();
  }

  // Build weight trend chart data
  const startW=profile.startWeight||0;
  const startDate=profile.startDate||new Date().toISOString().split("T")[0];
  const rateMap={"−750":-750,"−500":-500,"−250":-250,"−125":-125,"0":0,"+125":125,"+250":250,"+500":500};
  const dailyDelta=(rateMap[profile.goalRate]||0)/3500; // lbs per day
  const allPoints=[];
  // Projected line from start
  const today=new Date();
  const start=new Date(startDate);
  const daysSinceStart=Math.max(0,Math.round((today-start)/(1000*60*60*24)));
  for(let i=0;i<=Math.min(daysSinceStart+90,180);i++){
    allPoints.push({day:i,projected:Math.round((startW+dailyDelta*i)*10)/10});
  }
  // Actual check-ins
  const actualPoints=checkIns.map(c=>{
    const d=Math.round((new Date(c.checked_at)-start)/(1000*60*60*24));
    return{day:d,actual:c.weight};
  });
  // Chart dimensions
  const CDAYS=Math.min(daysSinceStart+90,180);
  const allWeights=[startW,...allPoints.map(p=>p.projected),...actualPoints.map(p=>p.actual)].filter(Boolean);
  const minW=Math.min(...allWeights)-3;
  const maxW=Math.max(...allWeights)+3;
  const xScale=(d)=>(d/CDAYS)*100;
  const yScale=(w)=>100-((w-minW)/(maxW-minW))*100;

  return (
    <div style={{padding:isMobile?"12px 18px":"0",paddingBottom:isMobile?80:0}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>SETTINGS</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Your profile, program, and account</p>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>

        {/* Weight Trend Chart */}
        <SectionCard title="Weight Progress" style={{gridColumn:isMobile?"1":"1 / -1"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Log Today's Weight</div>
            <div style={{display:"flex",gap:8}}>
              <input value={checkInWeight} onChange={e=>setCheckInWeight(e.target.value)} type="number" placeholder={`e.g. ${startW}`} style={{flex:1,background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:"10px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <div style={{fontSize:11,color:T.mu,alignSelf:"center"}}>{profile.wUnit||"lbs"}</div>
              <button onClick={saveCheckIn} disabled={saving} style={{padding:"10px 18px",background:saving?T.s3:T.prot,color:saving?T.mu:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{saved?"✓ Saved":saving?"...":"Log"}</button>
            </div>
          </div>

          {/* SVG Weight Trend Chart */}
          <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>Start Weight</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{startW}<span style={{fontSize:13,color:T.mu,fontWeight:400}}> {profile.wUnit||"lbs"}</span></div>
              </div>
              {actualPoints.length>0&&<div>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>Current</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:T.carb,lineHeight:1}}>{actualPoints[actualPoints.length-1].actual}<span style={{fontSize:13,color:T.mu,fontWeight:400}}> {profile.wUnit||"lbs"}</span></div>
              </div>}
              <div>
                <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>Goal Rate</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:T.prot,lineHeight:1}}>{Object.keys(rateMap).find(k=>rateMap[k]===(parseFloat(profile.goalRate?.replace("−","-"))||0))||"Maintain"}</div>
              </div>
            </div>
            <svg width="100%" height="140" viewBox="0 0 400 140" preserveAspectRatio="none" style={{overflow:"visible"}}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.prot} stopOpacity=".15"/><stop offset="100%" stopColor={T.prot} stopOpacity="0"/></linearGradient>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.carb} stopOpacity=".15"/><stop offset="100%" stopColor={T.carb} stopOpacity="0"/></linearGradient>
              </defs>
              {/* Grid lines */}
              {[0,25,50,75,100].map(y=>(<line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke={T.dim} strokeWidth="0.5"/>))}
              {/* Today marker */}
              <line x1={`${xScale(daysSinceStart)}%`} y1="0" x2={`${xScale(daysSinceStart)}%`} y2="100%" stroke={T.prot} strokeWidth="1" strokeDasharray="3,3" opacity="0.4"/>
              <text x={`${xScale(daysSinceStart)}%`} y="8" fill={T.prot} fontSize="7" textAnchor="middle" opacity="0.7">TODAY</text>
              {/* Projected line */}
              {allPoints.length>1&&<>
                <path d={`M ${allPoints.map(p=>`${xScale(p.day)*4},${yScale(p.projected)*1.4}`).join(" L ")}`} fill="none" stroke={T.prot} strokeWidth="1.5" strokeDasharray="5,3" opacity="0.5"/>
              </>}
              {/* Actual points */}
              {actualPoints.length>1&&<path d={`M ${actualPoints.map(p=>`${xScale(p.day)*4},${yScale(p.actual)*1.4}`).join(" L ")}`} fill="none" stroke={T.carb} strokeWidth="2.5" strokeLinecap="round"/>}
              {actualPoints.map((p,i)=>(<circle key={i} cx={`${xScale(p.day)*4}`} cy={`${yScale(p.actual)*1.4}`} r="4" fill={T.carb}/>))}
              {/* Start point */}
              <circle cx="0" cy={`${yScale(startW)*1.4}`} r="4" fill={T.prot} opacity="0.8"/>
            </svg>
            <div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:2,background:T.prot,opacity:.6,borderTop:"2px dashed "+T.prot}}></div><span style={{fontSize:11,color:T.mu}}>Projected</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:2,background:T.carb,borderRadius:1}}></div><span style={{fontSize:11,color:T.mu}}>Actual</span></div>
              {actualPoints.length===0&&<span style={{fontSize:11,color:T.mu}}>Log your weight daily to see your actual trend vs projected</span>}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Workout Split">
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {Object.keys(SPLIT_CYCLES).map(s=>(<button key={s} onClick={()=>setWPrefs(p=>({...p,splitType:s}))} style={{padding:"9px 13px",borderRadius:9,border:`1.5px solid ${wPrefs.splitType===s?T.carb:T.bd}`,background:wPrefs.splitType===s?`${T.carb}15`:T.s3,color:wPrefs.splitType===s?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>))}
          </div>
        </SectionCard>

        <SectionCard title="Equipment">
          <div style={{display:"flex",gap:8}}>
            {["Full Gym","Home Gym","Bodyweight Only"].map(e=>(<button key={e} onClick={()=>setWPrefs(p=>({...p,equipment:e}))} style={{flex:1,padding:"11px 6px",borderRadius:9,border:`1.5px solid ${wPrefs.equipment===e?T.carb:T.bd}`,background:wPrefs.equipment===e?`${T.carb}15`:T.s3,color:wPrefs.equipment===e?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{e}</button>))}
          </div>
        </SectionCard>

        <SectionCard title="Athlete Modes">
          <Toggle on={wPrefs.isHybrid} onChange={v=>setWPrefs(p=>({...p,isHybrid:v}))} label="🏃 Hybrid Athlete" sub="Adds structured run blocks to training days"/>
          <Toggle on={wPrefs.isHyrox}  onChange={v=>setWPrefs(p=>({...p,isHyrox:v}))}  label="🔥 Hyrox Mode" sub="Includes Hyrox station blocks"/>
        </SectionCard>

        <SectionCard title="Your Profile">
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {[["Name",profile.name],["Goal",profile.goal],["Daily Target",`${profile.goalCals} kcal`],["Base TDEE",`${profile.baseTDEE} kcal`],["Start Weight",`${profile.startWeight||"—"} ${profile.wUnit||"lbs"}`],["Start Date",profile.startDate||"—"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${T.dim}`}}><span style={{fontSize:13,color:T.mu}}>{l}</span><span style={{fontSize:13,fontWeight:600}}>{v}</span></div>))}
          </div>
        </SectionCard>

        {/* Account Actions */}
        <SectionCard title="Account">
          <button onClick={onSignOut} style={{width:"100%",padding:"13px",background:T.s3,color:"#fff",border:`1px solid ${T.bd}`,borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>Sign Out</button>
          {!delConfirm
            ?<button onClick={()=>setDelConfirm(true)} style={{width:"100%",padding:"13px",background:"none",color:"#FF4D6D",border:"1px solid rgba(255,77,109,.25)",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Delete Account</button>
            :<div style={{background:"rgba(255,77,109,.06)",border:"1px solid rgba(255,77,109,.25)",borderRadius:10,padding:"16px"}}>
              <div style={{fontSize:13,color:"#FF4D6D",fontWeight:700,marginBottom:8}}>⚠️ This permanently deletes all your data.</div>
              <div style={{fontSize:12,color:T.mu,marginBottom:14}}>Your profile, food logs, workout history, and weight check-ins will be gone forever. This cannot be undone.</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setDelConfirm(false)} style={{flex:1,padding:"11px",background:T.s3,color:T.mu,border:`1px solid ${T.bd}`,borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                <button onClick={deleteAccount} disabled={deleting} style={{flex:1,padding:"11px",background:"#FF4D6D",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{deleting?"Deleting...":"Delete Forever"}</button>
              </div>
            </div>
          }
        </SectionCard>
      </div>
    </div>
  );
}

// ─── PROMO CODES ──────────────────────────────────────────────────────────────
const PROMOS = {
  'BETA2000': true,
};

// ─── PROMO SCREEN ─────────────────────────────────────────────────────────────
function PromoScreen({profile, onValidCode, onNoCode}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function check() {
    const c = code.trim().toUpperCase();
    if(!c) { onNoCode(); return; }
    setLoading(true);
    setTimeout(() => {
      if(PROMOS[c]) {
        onValidCode();
      } else {
        setError('Invalid code. Check your code and try again.');
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900;ital@0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{width:'100%',maxWidth:440}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:48}}>
          <svg width={52} height={22} viewBox="0 0 52 22">
            <rect x={0}  y={0}  width={14} height={22} rx={3} fill={T.prot}/>
            <rect x={19} y={5}  width={14} height={17} rx={3} fill={T.carb}/>
            <rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/>
          </svg>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:'#fff'}}>COACH</div>
            <div><span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:'#fff'}}>RO</span></div>
          </div>
        </div>

        {/* Headline */}
        <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Final Step</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:900,fontStyle:'italic',lineHeight:.9,marginBottom:12}}>
          GOT A CODE,<br/><span style={{color:T.prot}}>{profile?.name?.toUpperCase() || 'ATHLETE'}?</span>
        </div>
        <p style={{fontSize:15,color:'#888',lineHeight:1.7,marginBottom:36}}>
          Your plan is built. Enter a promo code for free access — or skip to start your 7-day free trial. No charge until day 8.
        </p>

        {/* Code input */}
        <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:14,padding:24,marginBottom:16}}>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>Promo Code</div>
          <div style={{display:'flex',gap:8}}>
            <input
              value={code}
              onChange={e=>{setCode(e.target.value.toUpperCase());setError('');}}
              onKeyDown={e=>{if(e.key==='Enter')check();}}
              placeholder="Enter code"
              maxLength={20}
              style={{flex:1,background:T.s2,border:`1.5px solid ${error?'#FF4D6D':code?T.prot:T.bd}`,borderRadius:9,padding:'12px 16px',color:'#fff',fontSize:16,outline:'none',fontFamily:"'Inter',sans-serif",letterSpacing:2,textTransform:'uppercase',transition:'border-color .2s'}}
            />
            <button
              onClick={check}
              disabled={loading}
              style={{padding:'12px 20px',background:T.prot,color:'#fff',border:'none',borderRadius:9,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:"'Inter',sans-serif",opacity:loading?.7:1}}
            >
              {loading ? '...' : 'Apply'}
            </button>
          </div>
          {error && <div style={{fontSize:13,color:'#FF4D6D',marginTop:10}}>{error}</div>}
        </div>

        {/* Skip to payment */}
        <button
          onClick={onNoCode}
          style={{width:'100%',padding:'16px',background:T.prot,color:'#fff',border:'none',borderRadius:11,fontWeight:700,fontSize:16,cursor:'pointer',fontFamily:"'Inter',sans-serif",marginBottom:12,textTransform:'uppercase',letterSpacing:.5}}
        >
          Start 7-Day Free Trial →
        </button>
        <div style={{fontSize:12,color:T.mu,textAlign:'center',lineHeight:1.6}}>
          No charge until day 8 · Cancel anytime · $4.99/mo or $19.99/yr
        </div>
      </div>
    </div>
  );
}

// ─── PAYWALL ──────────────────────────────────────────────────────────────────
function Paywall({profile}) {
  const [plan, setPlan] = useState('annual');
  const plans = {
    annual:  {label:'Yearly',  badge:'BEST VALUE — 67% OFF', price:'$19.99', per:'/yr',  sub:'$1.67/month · billed annually', note:'7 days free, then $19.99/yr', link:STRIPE.annual},
    monthly: {label:'Monthly', badge:null,                   price:'$4.99',  per:'/mo',  sub:'billed monthly · cancel anytime', note:'7 days free, then $4.99/mo',  link:STRIPE.monthly},
  };
  const p = plans[plan];

  return (
    <div style={{minHeight:'100vh',background:T.bg,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900;ital@0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{width:'100%',maxWidth:440}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:36}}>
          <svg width={52} height={22} viewBox="0 0 52 22">
            <rect x={0}  y={0}  width={14} height={22} rx={3} fill={T.prot}/>
            <rect x={19} y={5}  width={14} height={17} rx={3} fill={T.carb}/>
            <rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/>
          </svg>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:'#fff'}}>COACH</div>
            <div><span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:'#fff'}}>RO</span></div>
          </div>
        </div>

        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:44,fontWeight:900,fontStyle:'italic',lineHeight:.9,marginBottom:10}}>
          YOUR PLAN IS READY.<br/><span style={{color:T.prot}}>UNLOCK IT.</span>
        </div>
        <p style={{fontSize:15,color:'#888',marginBottom:28,lineHeight:1.65}}>
          Start free — no charge for 7 days. Cancel before day 8 and pay nothing.
        </p>

        {/* Plan toggle */}
        <div style={{display:'flex',background:T.s1,border:`1px solid ${T.bd}`,borderRadius:10,padding:4,marginBottom:20,gap:4}}>
          {Object.entries(plans).map(([k,v])=>(
            <button key={k} onClick={()=>setPlan(k)} style={{flex:1,padding:'11px',borderRadius:8,border:'none',cursor:'pointer',background:plan===k?T.prot:'none',color:plan===k?'#fff':T.mu,fontWeight:700,fontSize:14,fontFamily:"'Inter',sans-serif",transition:'all .2s'}}>
              {v.label} {k==='annual'&&<span style={{fontSize:11,opacity:.8}}>— 67% off</span>}
            </button>
          ))}
        </div>

        {/* Price card */}
        <div style={{background:T.s1,border:`1.5px solid ${T.prot}`,borderRadius:16,padding:28,marginBottom:16,position:'relative'}}>
          {p.badge && <div style={{position:'absolute',top:-11,left:'50%',transform:'translateX(-50%)',background:T.prot,color:'#fff',fontSize:9,fontWeight:800,padding:'4px 14px',borderRadius:9,letterSpacing:1.5,whiteSpace:'nowrap'}}>{p.badge}</div>}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:64,fontWeight:900,color:T.prot,lineHeight:1,letterSpacing:-1,marginBottom:4}}>
            {p.price}<span style={{fontSize:22,fontWeight:400,color:T.mu}}>{p.per}</span>
          </div>
          <div style={{fontSize:13,color:T.mu,marginBottom:4}}>{p.sub}</div>
          <div style={{fontSize:13,color:T.carb,fontWeight:700,marginBottom:20}}>{p.note}</div>
          <div style={{display:'flex',flexDirection:'column',gap:0,marginBottom:24,borderTop:`1px solid ${T.bd}`,paddingTop:16}}>
            {['Everything in one app — Fuel + Train','Dynamic macros that shift daily with your schedule','AI food logging — describe any meal instantly','Progressive overload tracking — every set, every session','Restaurant AI, recipe generator, barcode scanner','Strava, Apple Health, Garmin, Fitbit integrations','Running plans, Hyrox mode, Hybrid athlete support'].map(f=>(
              <div key={f} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:`1px solid ${T.dim}`,fontSize:13,color:'#ccc',alignItems:'flex-start'}}>
                <span style={{color:T.prot,fontWeight:800,flexShrink:0}}>✓</span>{f}
              </div>
            ))}
          </div>
          <a href={p.link} style={{display:'block',textAlign:'center',padding:'16px',background:T.prot,color:'#fff',fontWeight:700,fontSize:16,borderRadius:10,textDecoration:'none',letterSpacing:.3,transition:'opacity .2s'}}>
            Start Free Trial →
          </a>
        </div>
        <div style={{fontSize:12,color:T.mu,textAlign:'center'}}>
          Secure checkout · Cancel anytime · No charge for 7 days
        </div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [mode,setMode]=useState("signup"); // signup | login
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handle() {
    if(mode==="signup"&&!name.trim()){setError("Please enter your name.");return;}
    if(!email.trim()){setError("Please enter your email.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);setError("");
    try {
      if(mode==="signup") {
        const {data,error:e}=await sb.auth.signUp({email,password});
        if(e)throw e;
        if(data.user) onAuth(data.user, name.trim());
      } else {
        const {data,error:e}=await sb.auth.signInWithPassword({email,password});
        if(e)throw e;
        onAuth(data.user, null);
      }
    } catch(e){setError(e.message||"Something went wrong. Try again.");}
    setLoading(false);
  }

  const field=(label,val,setVal,type="text",ph="")=>(
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>{label}</label>
      <input value={val} onChange={e=>setVal(e.target.value)} type={type} placeholder={ph}
        onKeyDown={e=>e.key==="Enter"&&handle()}
        style={{width:"100%",background:T.s2,border:`1.5px solid ${val?T.prot:T.bd}`,borderRadius:11,padding:"13px 16px",color:"#fff",fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",transition:"border-color .2s",boxSizing:"border-box"}}/>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:40}}>
          <svg width={52} height={22} viewBox="0 0 52 22"><rect x={0} y={0} width={14} height={22} rx={3} fill={T.prot}/><rect x={19} y={5} width={14} height={17} rx={3} fill={T.carb}/><rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/></svg>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:"#fff"}}>COACH</div>
            <div><span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:"#fff"}}>RO</span></div>
          </div>
        </div>

        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,fontStyle:"italic",lineHeight:.88,marginBottom:12}}>
          {mode==="signup"?<div>CREATE YOUR<br/><span style={{color:T.prot}}>ACCOUNT.</span></div>:<div>WELCOME<br/><span style={{color:T.prot}}>BACK.</span></div>}
        </div>
        <p style={{fontSize:14,color:"#888",marginBottom:28,lineHeight:1.65}}>
          {mode==="signup"?"One account. Your plan, your logs, your progress — all saved.":"Sign in to pick up where you left off."}
        </p>

        {/* Toggle */}
        <div style={{display:"flex",background:T.s1,border:`1px solid ${T.bd}`,borderRadius:10,padding:4,marginBottom:24,gap:4}}>
          {[["signup","Create Account"],["login","Sign In"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?T.prot:"none",color:mode===m?"#fff":T.mu,fontWeight:700,fontSize:14,fontFamily:"'Inter',sans-serif",transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {mode==="signup"&&field("Your Name",name,setName,"text","e.g. Marcus")}
        {field("Email",email,setEmail,"email","you@email.com")}
        {field("Password",password,setPassword,"password","Min 6 characters")}

        {error&&<div style={{background:"rgba(255,77,109,.08)",border:"1px solid rgba(255,77,109,.25)",borderRadius:9,padding:"11px 14px",marginBottom:16,fontSize:13,color:"#FF4D6D"}}>{error}</div>}

        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"15px",background:loading?T.s3:T.prot,color:loading?T.mu:"#fff",fontWeight:700,fontSize:15,letterSpacing:.5,border:"none",borderRadius:11,cursor:loading?"default":"pointer",textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:16}}>
          {loading?"...":(mode==="signup"?"Create Account →":"Sign In →")}
        </button>
        <div style={{textAlign:"center",fontSize:12,color:"#333"}}>Your data is stored securely. We never sell it.</div>
      </div>
    </div>
  );
}


// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CoachMacro() {
  const [phase,setPhase]=useState("auth"); // auth | loading | onboarding | promo | paywall | app
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [schedule,setSchedule]=useState({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"});
  const [wPrefs,setWPrefs]=useState({splitType:"Push/Pull/Legs",equipment:"Full Gym",isHybrid:false,isHyrox:false});
  const [dayFocus,setDayFocus]=useState(autoFocus({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"},"Push/Pull/Legs"));
  const [earnedCals,setEarnedCals]=useState(0);
  const [signupName,setSignupName]=useState("");

  useEffect(()=>{
    // Only use getSession — ignore onAuthStateChange on initial load to avoid race
    sb.auth.getSession().then(({data:{session},error})=>{
      if(error||!session?.user){
        setPhase("auth");
        return;
      }
      setUser(session.user);
      loadProfile(session.user.id);
    });
    // Only listen for explicit sign-out after initial load
    const {data:{subscription}}=sb.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){
        setUser(null);setProfile(null);setPhase("auth");
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(uid) {
    try {
      const {data,error}=await sb.from("profiles").select("*").eq("id",uid).single();
      if(error||!data){setPhase("onboarding");return;}
      setProfile(data.profile_data);
      if(data.schedule)setSchedule(data.schedule);
      if(data.wprefs)setWPrefs(data.wprefs);
      setPhase("app");
    } catch(e){setPhase("onboarding");}
  }

  async function saveProfile(uid,prof,sch,wp) {
    try {
      await sb.from("profiles").upsert({id:uid,profile_data:prof,schedule:sch,wprefs:wp,updated_at:new Date().toISOString()},{onConflict:"id"});
    } catch(e){console.error("Save error:",e);}
  }

  async function handleAuth(authUser) {
    setPhase("loading");
    setUser(authUser);
    await loadProfile(authUser.id);
  }

  async function handleComplete(od,tdee,goalCals) {
    const trainDays={n0:[],["1-3"]:["Mon","Wed","Fri"],["4-6"]:["Mon","Tue","Thu","Fri","Sat"],["7+"]:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}[od.freq]||["Mon","Wed","Fri"];
    const sch={Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"};
    trainDays.forEach(d=>{sch[d]="training";});
    if(od.trainType==="run"||od.trainType==="hybrid"){["Tue","Thu"].filter(d=>sch[d]==="rest").slice(0,1).forEach(d=>{sch[d]="cardio";});}
    const spMap={none:"Full Body",beginner:"Upper/Lower",intermediate:"Push/Pull/Legs",advanced:"Bro Split"};
    const sp=spMap[od.liftExp]||"Push/Pull/Legs";
    const wp={splitType:sp,equipment:"Full Gym",isHybrid:od.trainType==="hybrid",isHyrox:od.trainType==="hyrox"};
    const prof={name:od.name,email:od.email||user?.email||"",goal:od.goal||"Maintain",goalCals,baseTDEE:tdee.total,sex:od.sex,city:"",liftExp:od.liftExp,cardioExp:od.cardioExp,healthConn:od.healthConn,goalTimeline:od.goalTimeline||"12w",startWeight:parseFloat(od.weight)||0,startDate:new Date().toISOString().split("T")[0],wUnit:od.wUnit||"lbs"};
    setSchedule(sch);setWPrefs(wp);setProfile(prof);
    if(user) await saveProfile(user.id,prof,sch,wp);
    setPhase("promo");
  }

  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null);setProfile(null);setPhase("auth");
  }

  useEffect(()=>{
    if(!profile)return;
    const cycles=SPLIT_CYCLES[wPrefs.splitType]||["Full Body"];
    const f={};let i=0;
    WDAYS.forEach(d=>{
      if(schedule[d]==="training")f[d]=cycles[i++%cycles.length];
      else if(["cardio","run","hyrox"].includes(schedule[d]))f[d]=(DAY_CFG[schedule[d]]||DAY_CFG.rest).label;
      else f[d]="Rest";
    });
    setDayFocus(f);
  },[wPrefs.splitType,schedule,profile]);

  if(phase==="loading") return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{textAlign:"center"}}>
        <svg width={52} height={22} viewBox="0 0 52 22" style={{marginBottom:16}}><rect x={0} y={0} width={14} height={22} rx={3} fill={T.prot}/><rect x={19} y={5} width={14} height={17} rx={3} fill={T.carb}/><rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/></svg>
        <div style={{fontSize:13,color:T.mu,letterSpacing:2}}>LOADING...</div>
      </div>
    </div>
  );

  if(phase==="auth")       return <AuthScreen onAuth={handleAuth}/>;
  if(phase==="onboarding") return <Onboarding onComplete={handleComplete} user={user} signupName={signupName}/>;
  if(phase==="promo")      return <PromoScreen profile={profile} onValidCode={()=>setPhase("app")} onNoCode={()=>setPhase("paywall")}/>;
  if(phase==="paywall")    return <Paywall profile={profile}/>;
  return <App profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} onEarnedCals={cals=>setEarnedCals(prev=>prev+cals)} onSignOut={handleSignOut} user={user}/>;
}
