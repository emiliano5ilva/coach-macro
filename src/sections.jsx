import { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, SPLIT_CYCLES, FOCUS_MUSCLES, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, BodyFigure,
  calcTDEE, lookupBarcode, useCountUp, autoFocus } from "./components.jsx";


// ─── WORKOUT BUILDER ──────────────────────────────────────────────────────────
export const LIFTING_SPLITS = {
  "PPL": {
    label:"Push / Pull / Legs",
    desc:"The most popular split for intermediate lifters. 6 days max, each muscle hit 2x/week.",
    days:["Push","Pull","Legs","Push","Pull","Legs"],
    schedule:"3–6 days/week",
    level:"Intermediate",
    muscles:{
      Push:["Chest (upper, mid, lower)","Shoulders (all 3 heads)","Triceps (long, lateral, medial)"],
      Pull:["Lats (width + thickness)","Biceps (long + short + brachialis)","Rear delts + Traps"],
      Legs:["Quads (squat pattern)","Hamstrings (hinge + curl)","Glutes (thrust + abduction)","Calves"],
    }
  },
  "Arnold": {
    label:"Arnold Split",
    desc:"Arnold Schwarzenegger's 6-day double split. High volume, maximum pump.",
    days:["Chest+Back","Shoulders+Arms","Legs","Chest+Back","Shoulders+Arms","Legs"],
    schedule:"6 days/week",
    level:"Advanced",
    muscles:{
      "Chest+Back":["Chest (all angles)","Lats (width)","Mid back (thickness)","Serratus"],
      "Shoulders+Arms":["All 3 deltoid heads","Biceps (all heads)","Triceps (all heads)","Forearms"],
      "Legs":["Quads","Hamstrings","Glutes","Calves","Hip flexors"],
    }
  },
  "Bro Split": {
    label:"Bro Split (5-day)",
    desc:"One muscle group per day. Maximum volume and focus per session.",
    days:["Chest","Back","Shoulders","Arms","Legs"],
    schedule:"5 days/week",
    level:"All levels",
    muscles:{
      Chest:["Upper chest (incline)","Mid chest (flat)","Lower chest (decline)","Inner chest (cables)"],
      Back:["Lats width (pulldown)","Lats thickness (row)","Rhomboids","Lower traps","Rear delts"],
      Shoulders:["Front delt","Lateral delt","Rear delt","Rotator cuff"],
      Arms:["Biceps long head","Biceps short head","Brachialis","Triceps long","Triceps lateral","Triceps medial"],
      Legs:["Quads (4 heads)","Hamstrings","Glutes","Calves (gastroc + soleus)"],
    }
  },
  "Upper/Lower": {
    label:"Upper / Lower",
    desc:"4 days, balanced push/pull every session. Great for beginners and intermediates.",
    days:["Upper","Lower","Upper","Lower"],
    schedule:"4 days/week",
    level:"Beginner–Intermediate",
    muscles:{
      Upper:["Chest","Back","Shoulders","Biceps","Triceps"],
      Lower:["Quads","Hamstrings","Glutes","Calves","Core"],
    }
  },
  "GVT": {
    label:"German Volume Training",
    desc:"10 sets × 10 reps of one compound per session. Brutal. Proven for hypertrophy.",
    days:["Chest+Back","Legs+Abs","Shoulders+Arms","Rest"],
    schedule:"3 days/week",
    level:"Intermediate–Advanced",
    muscles:{
      "Chest+Back":["Bench press 10×10","Weighted pullup 10×10","+ isolation finishers"],
      "Legs+Abs":["Squat 10×10","Leg curl 10×10","+ calf raises"],
      "Shoulders+Arms":["Seated DB press 10×10","Cable curl 10×10","+ tricep finishers"],
    }
  },
  "Full Body": {
    label:"Full Body (3x/week)",
    desc:"Hit every major pattern every session. Best for beginners and strength focus.",
    days:["Full Body A","Full Body B","Full Body A"],
    schedule:"3 days/week",
    level:"Beginner",
    muscles:{
      "Full Body A":["Squat","Push (horizontal)","Pull (vertical)","Hinge","Core"],
      "Full Body B":["Hinge","Push (vertical)","Pull (horizontal)","Single-leg","Carry"],
    }
  },
};

export const RUN_PLANS_DETAIL = {
  "5K Beginner":   {desc:"Run/walk intervals → first 5K in 8 weeks",days:3,long:"Saturday",sessions:["Easy 20min","Intervals 25min","Long run 30min"]},
  "5K Sub-25":     {desc:"Speed work to break 25 minutes",days:4,long:"Sunday",sessions:["Easy run","Tempo 30min","Intervals","Long run 45min"]},
  "10K Beginner":  {desc:"Build to 10K in 10 weeks",days:4,long:"Sunday",sessions:["Easy run","Progression run","Intervals","Long run"]},
  "Half Marathon": {desc:"16-week plan to finish strong",days:5,long:"Sunday",sessions:["Easy","Tempo","Intervals","Easy","Long run"]},
  "Marathon":      {desc:"20-week plan, runs up to 22 miles",days:5,long:"Sunday",sessions:["Easy","Medium long","Speed","Easy","Long run"]},
};

export const HYBRID_TEMPLATES = {
  "Strength + Run": {
    desc:"3 lifting days + 2 run days. The classic hybrid. Builds muscle AND aerobic base.",
    week:["🏋️ Lifting","🏃 Easy Run","🏋️ Lifting","😴 Rest","🏋️ Lifting","🏃 Long Run","😴 Rest"],
    notes:"Lifting and running on separate days to prevent interference. Long run on Saturday gives full Sunday recovery.",
  },
  "PPL + Hyrox":   {
    desc:"Push/Pull/Legs with 2 Hyrox simulation sessions. Race-ready in 12 weeks.",
    week:["🏋️ Push","🏋️ Pull","🔥 Hyrox Sim","🏋️ Legs","😴 Rest","🔥 Hyrox Race Sim","😴 Rest"],
    notes:"Hyrox simulations on Wednesday and Saturday. Keep lifting heavy — Hyrox rewards both strength and endurance.",
  },
  "Run + Strength": {
    desc:"Run-first athlete adding strength. 3 run days + 2 lift days.",
    week:["🏃 Easy Run","🏋️ Upper","🏃 Tempo","😴 Rest","🏋️ Lower","🏃 Long Run","😴 Rest"],
    notes:"Strength sessions on non-run days. Upper/Lower split minimizes recovery interference.",
  },
  "Hyrox Specific": {
    desc:"Full Hyrox prep. 8 stations + 1km runs between each.",
    week:["🔥 Stations A","🏃 Run","💪 Strength","🔥 Stations B","😴 Rest","🔥 Full Race Sim","😴 Rest"],
    notes:"Stations A: sled push/pull, burpee broad jump, rowing. Stations B: wall balls, sandbag lunges, farmers carry, SkiErg.",
  },
};

export function WorkoutBuilder({profile,wPrefs,setWPrefs,generateWorkout,startStructured,workout,workoutLoading,isMobile,todayFocus}) {
  const [step,setStep]=useState("type"); // type | split | run | hybrid | exercises | generated
  const [type,setType]=useState(""); // lifting | running | hybrid
  const [split,setSplit]=useState("");
  const [runPlanLocal,setRunPlanLocal]=useState("");
  const [runDays,setRunDays]=useState(3);
  const [longRunDay,setLongRunDay]=useState("Sunday");
  const [hybridTemplate,setHybridTemplate]=useState("");

  function handleTypeSelect(t) {
    setType(t);
    setStep(t==="lifting"?"split":t==="running"?"run":"hybrid");
  }

  function handleGenerate() {
    setStep("generated");
    generateWorkout(type,split,runPlanLocal,hybridTemplate);
  }
  
  function handleStartSession() {
    startStructured(split,runPlanLocal,hybridTemplate);
  }

  return (
    <div style={{maxWidth:isMobile?"100%":740}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>LIFT SMARTER</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:24}}>Build an optimized training plan — every muscle covered, every session purposeful.</p>

      {/* Step indicator */}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {[["type","1. Training Type"],["split|run|hybrid","2. Your Plan"],["generated","3. Your Session"]].map(([s,l])=>{
          const active=s==="type"?step==="type":s==="split|run|hybrid"?["split","run","hybrid"].includes(step):step==="generated";
          const done=s==="type"?(step!=="type"):s==="split|run|hybrid"?(step==="generated"):false;
          return(<div key={s} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:active?`${T.carb}15`:done?"rgba(0,230,118,.05)":T.s2,border:`1px solid ${active?T.carb:done?"rgba(0,230,118,.2)":T.bd}`}}>
            <div style={{width:16,height:16,borderRadius:"50%",background:active?T.carb:done?"rgba(0,230,118,.5)":T.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:active?"#000":done?"#000":T.mu}}>{done?"✓":l[0]}</div>
            <span style={{fontSize:11,fontWeight:700,color:active?T.carb:done?"rgba(0,230,118,.7)":T.mu}}>{l.slice(3)}</span>
          </div>);
        })}
      </div>

      {/* STEP 1 — Training Type */}
      {step==="type"&&<div>
        <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>What kind of training?</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12}}>
          {[
            {v:"lifting",e:"🏋️",l:"Lifting",d:"Strength training splits — build muscle and get stronger"},
            {v:"running",e:"🏃",l:"Running",d:"Structured run plans from 5K to marathon"},
            {v:"hybrid",e:"⚡",l:"Hybrid",d:"Mix lifting, running, and Hyrox in one program"},
          ].map(o=>(
            <div key={o.v} onClick={()=>handleTypeSelect(o.v)} style={{background:T.s2,border:`2px solid ${T.bd}`,borderRadius:14,padding:"24px 16px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.carb;e.currentTarget.style.background=`${T.carb}08`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.bd;e.currentTarget.style.background=T.s2;}}>
              <div style={{fontSize:36,marginBottom:12}}>{o.e}</div>
              <div style={{fontSize:17,fontWeight:700,marginBottom:8}}>{o.l}</div>
              <div style={{fontSize:12,color:T.mu,lineHeight:1.6}}>{o.d}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* STEP 2A — Lifting Split */}
      {step==="split"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Choose your split</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {Object.entries(LIFTING_SPLITS).map(([key,s])=>(
            <div key={key} onClick={()=>{setSplit(key);setStep("exercises");}} style={{background:split===key?`${T.carb}08`:T.s2,border:`1.5px solid ${split===key?T.carb:T.bd}`,borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"all .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:split===key?T.carb:"#fff",marginBottom:3}}>{s.label}</div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.6,maxWidth:480}}>{s.desc}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0,marginLeft:12}}>
                  <div style={{background:T.s3,borderRadius:8,padding:"3px 9px",fontSize:10,color:T.mu,fontWeight:700,whiteSpace:"nowrap"}}>{s.schedule}</div>
                  <div style={{background:`${T.carb}15`,border:`1px solid ${T.carb}30`,borderRadius:8,padding:"3px 9px",fontSize:10,color:T.carb,fontWeight:700,whiteSpace:"nowrap"}}>{s.level}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {s.days.filter((d,i,a)=>a.indexOf(d)===i).map(day=>(
                  <div key={day} style={{background:T.s3,borderRadius:6,padding:"3px 10px",fontSize:11,color:"#ccc"}}>{day}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* STEP 2B — Exercise Preview */}
      {step==="exercises"&&split&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("split")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>{LIFTING_SPLITS[split]?.label}</div>
        </div>
        <div style={{background:`${T.carb}08`,border:`1px solid ${T.carb}25`,borderRadius:14,padding:"16px 20px",marginBottom:20}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Muscles covered this week</div>
          {Object.entries(LIFTING_SPLITS[split]?.muscles||{}).map(([day,muscles])=>(
            <div key={day} style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:6}}>{day}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {muscles.map(m=>(
                  <div key={m} style={{background:T.s3,borderRadius:6,padding:"4px 10px",fontSize:11,color:T.carb,border:`1px solid ${T.carb}25`}}>{m}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 16px",marginBottom:20,fontSize:13,color:T.mu,lineHeight:1.7}}>
          💡 <b style={{color:"#fff"}}>How progressive overload works:</b> Each session shows your last performance alongside the suggested increase. Hit 12+ reps → weight goes up next session. Miss → add a rep. Automatic, no math required.
        </div>
        <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.carb,color:"#000",fontWeight:800,fontSize:15,border:"none",borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase",letterSpacing:.5}}>
          Build Today's {todayFocus} Session →
        </button>
      </div>}

      {/* STEP 2C — Running */}
      {step==="run"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Choose your run plan</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {Object.entries(RUN_PLANS_DETAIL).map(([key,p])=>(
            <div key={key} onClick={()=>setRunPlanLocal(key)} style={{background:runPlanLocal===key?`${T.carb}08`:T.s2,border:`1.5px solid ${runPlanLocal===key?T.carb:T.bd}`,borderRadius:14,padding:"16px 20px",cursor:"pointer",transition:"all .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <div style={{fontSize:15,fontWeight:700,color:runPlanLocal===key?T.carb:"#fff"}}>{key}</div>
                <div style={{background:T.s3,borderRadius:8,padding:"3px 9px",fontSize:10,color:T.mu,fontWeight:700}}>{p.days} days/week</div>
              </div>
              <div style={{fontSize:12,color:T.mu,marginBottom:8}}>{p.desc}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {p.sessions.map((s,i)=><div key={i} style={{background:T.s3,borderRadius:6,padding:"3px 10px",fontSize:11,color:"#ccc"}}>{s}</div>)}
              </div>
            </div>
          ))}
        </div>
        {runPlanLocal&&<>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>When's your long run?</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Saturday","Sunday"].map(d=>(
                <button key={d} onClick={()=>setLongRunDay(d)} style={{padding:"10px 20px",borderRadius:9,border:`1.5px solid ${longRunDay===d?T.carb:T.bd}`,background:longRunDay===d?`${T.carb}15`:T.s2,color:longRunDay===d?T.carb:T.mu,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.carb,color:"#000",fontWeight:800,fontSize:15,border:"none",borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>
            Build My {runPlanLocal} Plan →
          </button>
        </>}
      </div>}

      {/* STEP 2D — Hybrid */}
      {step==="hybrid"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>Choose your hybrid template</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {Object.entries(HYBRID_TEMPLATES).map(([key,h])=>(
            <div key={key} onClick={()=>setHybridTemplate(key)} style={{background:hybridTemplate===key?`${T.carb}08`:T.s2,border:`1.5px solid ${hybridTemplate===key?T.carb:T.bd}`,borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"all .2s"}}>
              <div style={{fontSize:15,fontWeight:700,color:hybridTemplate===key?T.carb:"#fff",marginBottom:4}}>{key}</div>
              <div style={{fontSize:12,color:T.mu,marginBottom:12}}>{h.desc}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:10}}>
                {["M","T","W","T","F","S","S"].map((d,i)=>(
                  <div key={i} style={{background:T.s3,borderRadius:6,padding:"6px 2px",textAlign:"center"}}>
                    <div style={{fontSize:7,color:T.mu,marginBottom:2}}>{d}</div>
                    <div style={{fontSize:11}}>{h.week[i]?.split(" ")[0]||"😴"}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:T.mu,fontStyle:"italic"}}>{h.notes}</div>
            </div>
          ))}
        </div>
        {hybridTemplate&&<button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.carb,color:"#000",fontWeight:800,fontSize:15,border:"none",borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>
          Build My {hybridTemplate} Plan →
        </button>}
      </div>}

      {/* STEP 3 — Generated workout */}
      {step==="generated"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900}}>{todayFocus}</div>
            <div style={{fontSize:12,color:T.mu,marginTop:2}}>{split||runPlanLocal||hybridTemplate} · {wPrefs.equipment}</div>
          </div>
          <button onClick={()=>setStep(type==="lifting"?"exercises":type==="running"?"run":"hybrid")} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:"8px 14px",color:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Change</button>
        </div>
        {workoutLoading
          ?<div style={{textAlign:"center",padding:"56px 0",color:T.mu}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spinner/></div>
            <div style={{fontSize:14,marginBottom:6}}>Building your optimized session…</div>
            <div style={{fontSize:11,color:T.dim}}>Covering all muscle heads · Progressive overload ready</div>
          </div>
          :<>
            <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",lineHeight:1.85,fontSize:13.5,color:"#ccc",whiteSpace:"pre-wrap",marginBottom:12}}>{workout||"Building your session..."}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={handleGenerate} style={{flex:1,padding:"12px",background:T.s2,color:T.carb,fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.carb}25`,borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate</button>
              {workout&&<button onClick={()=>startStructured(split,runPlanLocal,hybridTemplate)} style={{flex:1,padding:"12px",background:T.carb,color:"#000",fontSize:12,fontWeight:800,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>▶ Start Session →</button>}
            </div>
          </>
        }
      </div>}
    </div>
  );
}

export function TrainSection({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,trainScreen,setTrainScreen,workout,workoutLoading,generateWorkout,activeWorkout,setActiveWorkout,restActive,restTimer,logSet,finishWorkout,getSuggestion,history,planMode,setPlanMode,runPlan,setRunPlan,hybridMix,setHybridMix,startStructured,todayKey,todayType,todayFocus,cfg,isMobile}) {
  const TRAIN_TABS=[{id:"today",l:"Today"},{id:"builder",l:"Lift Smarter"},{id:"active",l:"Active Session"},{id:"plan",l:"My Program"},{id:"progress",l:"Progress"}];
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
                <button onClick={()=>setTrainScreen("builder")} style={{flex:1,padding:"13px",background:T.carb,color:"#000",fontWeight:800,fontSize:13,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>Lift Smarter →</button>
                <button onClick={()=>startStructured(wPrefs.splitType,"","")} style={{flex:1,padding:"13px",background:T.s3,color:T.carb,fontWeight:700,fontSize:13,border:`1px solid ${T.carb}30`,borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>▶ Start Session</button>
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

        {/* ── LIFT SMARTER BUILDER ── */}
        {trainScreen==="builder"&&<WorkoutBuilder profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} generateWorkout={generateWorkout} startStructured={startStructured} workout={workout} workoutLoading={workoutLoading} isMobile={isMobile} todayFocus={todayFocus}/>}

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
              <button onClick={()=>startStructured(wPrefs.splitType,"","")} style={{padding:"13px 24px",background:T.carb,color:"#000",fontWeight:800,fontSize:14,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit"}}>Build Workout →</button>
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
export function ConnectSection({stravaToken,setStravaToken,stravaStatus,stravaAthlete,stravaActs,connectStrava,ahActs,garminActs,fitbitActs,importStatus,handleFile,fileRef,allActs,todayActs,earnedCals,isMobile}) {
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
export function SettingsSection({profile,wPrefs,setWPrefs,schedule,setSchedule,dayFocus,todayKey,isMobile,onSignOut,user}) {
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
export const PROMOS = {
  'BETA2000': true,
};

// ─── PROMO SCREEN ─────────────────────────────────────────────────────────────
export function PromoScreen({profile, onValidCode, onNoCode}) {
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
export function Paywall({profile}) {
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

export function FuelSection({log,macros,consumed,remaining,cfg,todayType,todayFocus,earnedCals,todayActs,fuelScreen,setFuelScreen,foodInput,setFoodInput,logging,logMsg,aiLog,logMode,setLogMode,barcodeInput,setBarcodeInput,barcodeResult,barcodeLoading,scanBarcode,addBarcode,quickFields,setQF,addQuick,removeLog,recs,recsLoading,fetchRecs,recipes,recipesLoading,fetchRecipes,fastProto,setFastProto,fastActive,setFastActive,fastStart,setFastStart,fastCustomH,setFastCustomH,fastHours,fastElapsed,fastPct,fastRemaining,eatOpen,city,setCity,isMobile}) {

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

export const SPLITS_WITH_DAYS = {
  3: [
    {id:"full_body",l:"Full Body 3×",e:"🏋️",desc:"Hit every major muscle pattern every session. Best for beginners. Squat, hinge, push, pull, carry — all 3 days.",rec:true,levels:["beginner","intermediate"],gvt:false},
    {id:"ppl_half",l:"Push/Pull/Legs (1 cycle)",e:"🔄",desc:"One round of PPL per week. Each muscle hit once. Good stepping stone before 6-day PPL.",rec:false,levels:["intermediate"],gvt:false},
    {id:"upper_lower_3",l:"Upper/Lower (3-day)",e:"⬆️",desc:"Alternate upper and lower body. 2 upper + 1 lower or vice versa. Great for strength focus.",rec:false,levels:["beginner","intermediate"],gvt:false},
  ],
  4: [
    {id:"upper_lower",l:"Upper/Lower (4-day)",e:"⬆️",desc:"The gold standard for 4 days. 2 upper body days + 2 lower body days. Each muscle hit twice per week — optimal frequency for hypertrophy.",rec:true,levels:["beginner","intermediate","advanced"],gvt:true},
    {id:"ppl_upper",l:"PPL + Upper",e:"🔄",desc:"Push, Pull, Legs, then a bonus Upper day. Good for those who want more upper body volume.",rec:false,levels:["intermediate","advanced"],gvt:false},
    {id:"bro_4",l:"Bro Split (4-day)",e:"💪",desc:"Chest/Back, Shoulders/Arms, Legs, repeat. One muscle focus per day — maximum pump per session.",rec:false,levels:["intermediate","advanced"],gvt:true},
  ],
  5: [
    {id:"bro_split",l:"Bro Split (5-day)",e:"💪",desc:"One muscle group per day: Chest, Back, Shoulders, Arms, Legs. Maximum volume and focus per session. Classic bodybuilding split.",rec:true,levels:["intermediate","advanced"],gvt:true},
    {id:"upper_lower_5",l:"Upper/Lower/Push/Pull/Legs",e:"⬆️",desc:"A hybrid: start the week with Upper/Lower frequency, finish with PPL isolation volume. Best of both worlds.",rec:false,levels:["advanced"],gvt:false},
    {id:"ppl_upper_lower",l:"PPL + Upper/Lower",e:"🔄",desc:"3 days PPL + 2 days Upper/Lower. Highest frequency option at 5 days — for serious lifters.",rec:false,levels:["advanced"],gvt:false},
  ],
  6: [
    {id:"ppl_6",l:"Push/Pull/Legs (6-day)",e:"🔄",desc:"The most popular split for serious lifters. Each muscle hit twice per week. 2 Push + 2 Pull + 2 Legs. Research shows 2x/week frequency is optimal for hypertrophy.",rec:true,levels:["intermediate","advanced"],gvt:true},
    {id:"arnold",l:"Arnold Split",e:"🏆",desc:"Arnold Schwarzenegger's 6-day double split. Day 1&4: Chest+Back, Day 2&5: Shoulders+Arms, Day 3&6: Legs. Insane volume — for serious bodybuilders.",rec:false,levels:["advanced"],gvt:true},
    {id:"upper_lower_6",l:"Upper/Lower (6-day)",e:"⬆️",desc:"3 upper + 3 lower days. Maximum frequency — each muscle hit 3x/week. Very high volume. Recovery critical.",rec:false,levels:["advanced"],gvt:false},
  ],
  7: [
    {id:"ppl_7",l:"PPL + Active Recovery",e:"🔄",desc:"6 days PPL, Sunday is active recovery (mobility, light cardio, stretching). Maximum volume with one built-in deload day.",rec:true,levels:["advanced"],gvt:true},
    {id:"bro_7",l:"Bro Split + LISS",e:"💪",desc:"5-day Bro Split + 2 cardio/conditioning days. Good for those who want to train every day but avoid overtraining.",rec:false,levels:["advanced"],gvt:true},
  ],
};

const GVT_INFO = "German Volume Training — 10 sets × 10 reps of one compound lift per session. Brutal, proven hypertrophy method. Added as Week 4 of every month. Automatically swaps your main compound for 10×10 at 60% of your working weight.";

export const GVT_INFO = "German Volume Training — 10 sets × 10 reps of one compound lift per session. Brutal, proven hypertrophy method. Added as Week 4 of every month. Automatically swaps your main compound for 10×10 at 60% of your working weight.";
