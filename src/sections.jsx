import React, { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, SPLIT_CYCLES, FOCUS_MUSCLES, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, MuscleMap, FAQItem, BodyFigure,
  calcTDEE, lookupBarcode, useCountUp, autoFocus, getDayMacros,
  Badge, getTier, getReferralBadge } from "./components.jsx";
import { sb } from "./client.js";
import { getWorkoutForDay, GVT_OVERLAY, PROGRAMS_BY_DAYS, GLUTE_PROGRAMS, PROGRAM_LIBRARY } from "./programs.js";
import { getProgramForUser, getTodayRunWorkout, getTodayHyroxWorkout, getTodayHybridWorkout, RUNNING_PROGRAMS, HYROX_PROGRAM, HYBRID_PROGRAMS, getSkillVariant } from "./running_programs.js";
import { getEquipmentExercise, applyEquipmentToWorkout, getSwapOptions, EXERCISE_MUSCLE_GROUP } from "./exercise_database.js";
import { getPacesFromTime, resolvePaceTokens, formatRaceTime, getRacePredictions, enrichRunSession } from "./utils/runningPaces.js";
import { scoreReadiness, getReadinessTier, READINESS_CONFIG, applyWeightMod, getCyclePhase, isPriorityExercise, applyMobilitySubstitutions, getCoachingStyle } from "./utils/ait.js";
import { lifeStageModifier, ACL_PREHAB, isLegDay, getPostpartumPhase, isCalorieFreeMode, getConsistencyScore, showConsistencyScore, getCycleNutrition } from "./utils/female.js";
import { getAge, getAgeAppropriateProgram, applyOlderAdultProgram, HEALTH_CONDITIONS_SAFETY } from "./utils/safety.js";
import { ExerciseDetailModal } from "./ExerciseDetailModal.jsx";


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

export function WorkoutBuilder({profile,wPrefs,setWPrefs,generateWorkout,startStructured,workout,workoutLoading,isMobile,todayFocus,schedule,setActiveWorkout,setTrainScreen}) {
  const [step,setStep]=useState("type"); // type | split | run | hybrid | glute | glute-preview | exercises | generated
  const [type,setType]=useState(""); // lifting | running | hybrid | glute
  const [split,setSplit]=useState("");
  const [runPlanLocal,setRunPlanLocal]=useState("");
  const [runDays,setRunDays]=useState(3);
  const [longRunDay,setLongRunDay]=useState("Sunday");
  const [hybridTemplate,setHybridTemplate]=useState("");
  const [genExercises,setGenExercises]=useState(null);

  function handleTypeSelect(t) {
    setType(t);
    setStep(t==="lifting"?"split":t==="running"?"run":t==="glute"?"glute":"hybrid");
  }

  function handleGenerate() {
    setStep("generated");
    // Build real exercises from programs.js directly — no AI parsing needed
    const daysPerWeek=Object.values(schedule||{}).filter(v=>v==="training").length||3;
    const startD=new Date(profile?.startDate||Date.now());
    const dayIdx=Math.max(0,Math.floor((Date.now()-startD.getTime())/86400000))%(daysPerWeek||1);
    let exs=getWorkoutForDay(daysPerWeek,wPrefs.splitType||"Full Body",dayIdx,wPrefs.equipment||"Full Gym",undefined,wPrefs.liftExp||profile?.liftExp);
    exs=applyEquipmentToWorkout(exs||[],wPrefs.equipment||"Full Gym");
    setGenExercises(exs.length?exs:[{name:"Session Ready",sets:3,reps:"8-12",weight:"",notes:"Start your session"}]);
    generateWorkout(type,split,runPlanLocal,hybridTemplate); // still call AI for notes in background
  }

  function handleStartSession() {
    if(genExercises&&genExercises.length&&setActiveWorkout&&setTrainScreen){
      const activeEx=genExercises.map(ex=>({
        name:ex.name,notes:ex.notes||"",restSecs:ex.restSecs||120,
        sets:Array.from({length:Number(ex.sets)||3},()=>({weight:"",reps:String(ex.reps||10),done:false}))
      }));
      setActiveWorkout({title:todayFocus,exercises:activeEx});
      setTrainScreen("active");
    }else{
      startStructured(split,runPlanLocal,hybridTemplate);
    }
  }

  return (
    <div style={{maxWidth:isMobile?"100%":740}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>LIFT SMARTER</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:24}}>Build an optimized training plan — every muscle covered, every session purposeful.</p>

      {/* Step indicator */}
      <div style={{display:"flex",gap:6,marginBottom:24,flexWrap:"wrap"}}>
        {[["type","1. Training Type"],["split|run|hybrid|glute","2. Your Plan"],["generated","3. Your Session"]].map(([s,l])=>{
          const active=s==="type"?step==="type":s==="split|run|hybrid|glute"?["split","run","hybrid","glute","glute-preview","exercises"].includes(step):step==="generated";
          const done=s==="type"?(step!=="type"):s==="split|run|hybrid|glute"?(step==="generated"):false;
          return(<div key={s} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:20,background:active?`${T.carb}15`:done?"rgba(0,230,118,.05)":T.s2,border:`1px solid ${active?T.carb:done?"rgba(0,230,118,.2)":T.bd}`}}>
            <div style={{width:16,height:16,borderRadius:"50%",background:active?T.carb:done?"rgba(0,230,118,.5)":T.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:active?"#000":done?"#000":T.mu}}>{done?"✓":l[0]}</div>
            <span style={{fontSize:11,fontWeight:700,color:active?T.carb:done?"rgba(0,230,118,.7)":T.mu}}>{l.slice(3)}</span>
          </div>);
        })}
      </div>

      {/* STEP 1 — Training Type */}
      {step==="type"&&<div>
        <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:16}}>What kind of training?</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
          {[
            {v:"lifting",e:"🏋️",l:"Lifting",d:"Strength training splits — build muscle and get stronger"},
            {v:"running",e:"🏃",l:"Running",d:"Structured run plans from 5K to marathon"},
            {v:"hybrid",e:"⚡",l:"Hybrid",d:"Mix lifting, running, and Hyrox in one program"},
            {v:"glute",e:"🍑",l:"Glute Focus",d:"Lower body & glute programs built for maximum growth"},
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
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"'Barlow Condensed',sans-serif"}}>Choose your split</div>
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
          <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{LIFTING_SPLITS[split]?.label}</div>
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
        <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>
          Build Today's {todayFocus} Session →
        </button>
      </div>}

      {/* STEP 2C — Running */}
      {step==="run"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"'Barlow Condensed',sans-serif"}}>Choose your run plan</div>
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
            <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"'Barlow Condensed',sans-serif",marginBottom:10}}>When's your long run?</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Saturday","Sunday"].map(d=>(
                <button key={d} onClick={()=>setLongRunDay(d)} style={{padding:"10px 20px",borderRadius:9,border:`1.5px solid ${longRunDay===d?T.carb:T.bd}`,background:longRunDay===d?`${T.carb}15`:T.s2,color:longRunDay===d?T.carb:T.mu,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>
            Build My {runPlanLocal} Plan →
          </button>
        </>}
      </div>}

      {/* STEP 2D — Hybrid */}
      {step==="hybrid"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"'Barlow Condensed',sans-serif"}}>Choose your hybrid template</div>
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
        {hybridTemplate&&<button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>
          Build My {hybridTemplate} Plan →
        </button>}
      </div>}

      {/* STEP 2E — Glute Program Selection */}
      {step==="glute"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"'Barlow Condensed',sans-serif"}}>Choose your program</div>
        </div>
        <div style={{background:`rgba(255,153,0,.08)`,border:`1px solid rgba(255,153,0,.2)`,borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:12,color:"#ffb347",lineHeight:1.6}}>
          🍑 <b>Hip thrust progressive overload</b> is the #1 driver of glute growth. Add weight every time you hit the top rep range — that's the entire strategy.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {Object.entries(GLUTE_PROGRAMS).map(([key,p])=>(
            <div key={key} onClick={()=>{setSplit(key);setStep("glute-preview");}} style={{background:split===key?`${T.carb}08`:T.s2,border:`1.5px solid ${split===key?T.carb:T.bd}`,borderRadius:14,padding:"18px 20px",cursor:"pointer",transition:"all .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:700,color:split===key?T.carb:"#fff",marginBottom:4}}>{key}</div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.6,maxWidth:480}}>{p.description}</div>
                </div>
                <div style={{background:T.s3,borderRadius:8,padding:"3px 9px",fontSize:10,color:T.mu,fontWeight:700,flexShrink:0,marginLeft:12}}>{p.days.length} days/week</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {p.days.map(day=>(
                  <div key={day} style={{background:T.s3,borderRadius:6,padding:"3px 10px",fontSize:11,color:"#ccc"}}>{day}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* STEP 2F — Glute Program Preview */}
      {step==="glute-preview"&&split&&GLUTE_PROGRAMS[split]&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("glute")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{split}</div>
        </div>
        {GLUTE_PROGRAMS[split].days.map(dayName=>(
          <div key={dayName} style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:14,padding:"16px 20px",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10,color:T.carb}}>{dayName}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {(GLUTE_PROGRAMS[split].workouts[dayName]||[]).map((ex,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:T.s2,borderRadius:8,border:`1px solid ${ex.primary?`${T.carb}30`:T.bd}`}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:ex.primary?700:500,color:ex.primary?T.carb:"#ddd"}}>{ex.name}</span>
                    {ex.notes&&<div style={{fontSize:10,color:T.mu,marginTop:2,maxWidth:280}}>{ex.notes}</div>}
                  </div>
                  <div style={{fontSize:11,color:T.mu,flexShrink:0,marginLeft:8}}>{ex.sets}×{ex.reps}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>
          Build Today's Glute Session →
        </button>
      </div>}

      {/* STEP 3 — Generated workout as structured cards */}
      {step==="generated"&&(()=>{
        const exercises = genExercises||[{name:"Loading…",sets:3,reps:"8-12",weight:"",notes:""}];

        return(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,lineHeight:1}}>{todayFocus}</div>
                <div style={{fontSize:12,color:T.mu,marginTop:4}}>{split||runPlanLocal||hybridTemplate} · {wPrefs.equipment}</div>
              </div>
              <button onClick={()=>setStep(type==="lifting"?"exercises":type==="running"?"run":type==="glute"?"glute-preview":"hybrid")} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:"8px 14px",color:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Change</button>
            </div>

            {workoutLoading
              ?<div style={{textAlign:"center",padding:"56px 0",color:T.mu}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Spinner/></div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,marginBottom:6}}>BUILDING YOUR SESSION</div>
                <div style={{fontSize:12,color:T.dim}}>Optimizing muscle coverage · Setting progressive overload targets</div>
              </div>
              :<>
                {/* Exercise cards */}
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                  {exercises.map((ex,i)=>(
                    <div key={i} style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px 20px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,width:4,height:"100%",background:T.carb,borderRadius:"4px 0 0 4px"}}/>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                        <div>
                          <div style={{fontSize:9,color:T.carb,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Exercise {i+1}</div>
                          <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{ex.name}</div>
                          {ex.notes&&<div style={{fontSize:11,color:T.mu,marginTop:2}}>{ex.notes}</div>}
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <div style={{background:T.s2,borderRadius:8,padding:"6px 12px",textAlign:"center"}}>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:T.carb,lineHeight:1}}>{ex.sets}</div>
                            <div style={{fontSize:8,color:T.mu}}>sets</div>
                          </div>
                          <div style={{background:T.s2,borderRadius:8,padding:"6px 12px",textAlign:"center"}}>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{ex.reps}</div>
                            <div style={{fontSize:8,color:T.mu}}>reps</div>
                          </div>
                          {ex.weight&&<div style={{background:T.s2,borderRadius:8,padding:"6px 12px",textAlign:"center"}}>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,color:T.prot,lineHeight:1}}>{ex.weight}</div>
                            <div style={{fontSize:8,color:T.mu}}>lbs</div>
                          </div>}
                        </div>
                      </div>
                      {/* Set rows */}
                      <div style={{display:"grid",gridTemplateColumns:"40px 1fr 1fr 80px",gap:6,marginBottom:4}}>
                        {["SET","WEIGHT","REPS",""].map(h=>(<div key={h} style={{fontSize:8,color:T.mu,fontWeight:700,letterSpacing:1}}>{h}</div>))}
                      </div>
                      {Array.from({length:ex.sets}).map((_,si)=>(
                        <div key={si} style={{display:"grid",gridTemplateColumns:"40px 1fr 1fr 80px",gap:6,marginBottom:6,alignItems:"center"}}>
                          <div style={{fontSize:12,color:T.mu,fontWeight:700}}>#{si+1}</div>
                          <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:7,padding:"8px 10px",fontSize:13,color:T.mu,textAlign:"center"}}>{ex.weight||"—"}</div>
                          <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:7,padding:"8px 10px",fontSize:13,color:T.mu,textAlign:"center"}}>{ex.reps}</div>
                          <div style={{background:T.s3,border:`1px solid ${T.bd}`,borderRadius:7,padding:"8px 0",fontSize:12,color:T.mu,fontWeight:700,textAlign:"center"}}>Log</div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{display:"flex",gap:10}}>
                  <button onClick={handleGenerate} style={{flex:1,padding:"13px",background:T.s2,color:T.carb,fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.carb}25`,borderRadius:11,cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate</button>
                  <button onClick={handleStartSession} style={{flex:2,padding:"13px",background:T.prot,color:T.white,fontSize:15,fontWeight:700,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>▶ Start This Session →</button>
                </div>
              </>
            }
          </div>
        );
      })()}
    </div>
  );
}

const CATEGORY_ORDER=["Hypertrophy","Strength","Fat Loss & Conditioning","Running","Hyrox","Hybrid","Glute Focus"];

function ProgramLibraryScreen({wPrefs,setWPrefs,profile,setTrainScreen}){
  const [confirmProg,setConfirmProg]=useState(null);
  const [switching,setSwitching]=useState(false);

  const currentId=wPrefs._libraryId||null;

  async function confirmSwitch(prog){
    setSwitching(true);
    try{
      const newWPrefs={...wPrefs,_libraryId:prog.id};
      if(prog.isRun){newWPrefs.splitType=prog.name;newWPrefs.runPlan=prog.name;newWPrefs.isHybrid=false;newWPrefs.isHyrox=false;}
      else if(prog.isHyrox&&prog.isHybrid){newWPrefs.isHyrox=true;newWPrefs.isHybrid=true;newWPrefs.splitType=prog.name;}
      else if(prog.isHyrox){newWPrefs.isHyrox=true;newWPrefs.isHybrid=false;newWPrefs.splitType=prog.name;}
      else if(prog.isHybrid){newWPrefs.isHybrid=true;newWPrefs.isHyrox=false;newWPrefs.splitType=prog.name;}
      else if(prog.isConditioning){newWPrefs.splitType=prog.name;newWPrefs.isHybrid=false;newWPrefs.isHyrox=false;}
      else if(prog.splitKey){newWPrefs.splitType=prog.splitKey;newWPrefs.isHybrid=false;newWPrefs.isHyrox=false;}
      const newStartDate=new Date().toISOString().split("T")[0];
      setWPrefs(newWPrefs);
      const {data:{user}}=await sb.auth.getUser();
      if(user){
        await sb.from("profiles").upsert(
          {id:user.id,wprefs:newWPrefs,startDate:newStartDate},
          {onConflict:"id"}
        );
      }
      setConfirmProg(null);
      setTrainScreen("today");
    }catch(e){console.error("[ProgramLibrary] switch error:",e);}
    finally{setSwitching(false);}
  }

  const LIB_CSS=`
    .lib-wrap{padding:20px 0 40px;}
    .lib-cat-title{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,245,240,.4);margin:28px 0 10px;}
    .lib-cat-title:first-child{margin-top:0;}
    .lib-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:16px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;}
    .lib-card.lib-current{border-color:rgba(41,121,255,.4);background:rgba(41,121,255,.06);}
    .lib-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
    .lib-card-name{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:700;letter-spacing:.01em;}
    .lib-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;}
    .lib-badge{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:3px 7px;border-radius:4px;background:rgba(255,255,255,.07);color:rgba(245,245,240,.55);}
    .lib-badge.beg{background:rgba(52,211,153,.12);color:#34D399;}
    .lib-badge.int{background:rgba(251,191,36,.12);color:#FBbF24;}
    .lib-badge.adv{background:rgba(248,113,113,.12);color:#F87171;}
    .lib-best{font-size:12px;color:rgba(245,245,240,.5);line-height:1.5;}
    .lib-switch-btn{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:9px 14px;border-radius:7px;border:1.5px solid rgba(41,121,255,.5);background:rgba(41,121,255,.1);color:#2979FF;cursor:pointer;white-space:nowrap;font-family:inherit;transition:background .15s,border-color .15s;}
    .lib-switch-btn:hover{background:rgba(41,121,255,.2);border-color:#2979FF;}
    .lib-current-badge{font-size:11px;font-weight:700;letter-spacing:.08em;color:#2979FF;padding:9px 14px;border-radius:7px;border:1.5px solid rgba(41,121,255,.3);background:rgba(41,121,255,.06);}
    .lib-soon{font-size:11px;font-weight:700;letter-spacing:.08em;color:rgba(245,245,240,.25);padding:9px 14px;border-radius:7px;border:1.5px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);}
    .lib-modal-overlay{position:fixed;inset:0;background:rgba(6,13,26,.85);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .lib-modal{background:#0A1222;border:1px solid rgba(255,255,255,.1);border-radius:14px 14px 0 0;padding:28px 24px 36px;max-width:480px;width:100%;}
    .lib-modal h3{margin:0 0 8px;font-family:'Barlow Condensed',sans-serif;font-size:22px;font-weight:800;letter-spacing:.02em;}
    .lib-modal p{margin:0 0 24px;font-size:13px;color:rgba(245,245,240,.55);line-height:1.6;}
    .lib-modal-btns{display:flex;flex-direction:column;gap:10px;}
    .lib-confirm-btn{font-size:14px;font-weight:700;letter-spacing:.06em;padding:14px;border-radius:9px;border:none;background:#2979FF;color:#fff;cursor:pointer;font-family:inherit;}
    .lib-cancel-btn{font-size:14px;font-weight:600;padding:14px;border-radius:9px;border:1.5px solid rgba(255,255,255,.1);background:transparent;color:rgba(245,245,240,.5);cursor:pointer;font-family:inherit;}
    .lib-fav-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,77,109,.05);border:1px solid rgba(255,77,109,.15);border-radius:9px;margin-bottom:6px;}
    .lib-fav-name{font-size:13px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;}
    .lib-fav-group{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,245,240,.35);}
    .lib-fav-remove{font-size:11px;color:rgba(245,245,240,.3);background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 8px;border-radius:6px;}
    .lib-fav-remove:hover{color:rgba(255,77,109,.7);background:rgba(255,77,109,.08);}
    .lib-fav-section{margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.06);}
  `;

  const libFavorites=wPrefs.favorites||[];

  async function removeFavorite(name){
    const newFavs=libFavorites.filter(f=>f!==name);
    const newWPrefs={...wPrefs,favorites:newFavs};
    setWPrefs(newWPrefs);
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(user)await sb.from("profiles").upsert({id:user.id,wprefs:newWPrefs},{onConflict:"id"});
    }catch(e){console.error("[removeFavorite]",e);}
  }

  return(
    <div>
      <style>{LIB_CSS}</style>
      <div className="lib-wrap">
        {libFavorites.length>0&&(()=>{
          const byGroup={};
          libFavorites.forEach(name=>{
            const g=EXERCISE_MUSCLE_GROUP[name]||"other";
            if(!byGroup[g])byGroup[g]=[];
            byGroup[g].push(name);
          });
          return(
            <div className="lib-fav-section">
              <div className="lib-cat-title" style={{marginTop:0}}>❤️ My Favorites</div>
              {Object.entries(byGroup).map(([group,names])=>(
                <div key={group} style={{marginBottom:10}}>
                  <div className="lib-fav-group" style={{marginBottom:6}}>{group}</div>
                  {names.map(name=>(
                    <div key={name} className="lib-fav-row">
                      <span className="lib-fav-name">❤️ {name}</span>
                      <button className="lib-fav-remove" onClick={()=>removeFavorite(name)}>Remove</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
        {CATEGORY_ORDER.map(cat=>{
          const progs=PROGRAM_LIBRARY.filter(p=>p.category===cat);
          if(!progs.length)return null;
          return(
            <div key={cat}>
              <div className="lib-cat-title">{cat}</div>
              {progs.map(prog=>{
                const isCurrent=currentId===prog.id;
                const lvlClass=prog.level==="Beginner"?"beg":prog.level==="Advanced"?"adv":"int";
                return(
                  <div key={prog.id} className={`lib-card${isCurrent?" lib-current":""}`}>
                    <div className="lib-card-top">
                      <div>
                        <div className="lib-card-name">{prog.name}</div>
                        <div className="lib-badges">
                          <span className={`lib-badge ${lvlClass}`}>{prog.level}</span>
                          <span className="lib-badge">{prog.days}d/wk</span>
                          {prog.weeks&&<span className="lib-badge">{prog.weeks}wk</span>}
                        </div>
                      </div>
                      {isCurrent
                        ?<span className="lib-current-badge">CURRENT</span>
                        :prog.comingSoon
                          ?<span className="lib-soon">SOON</span>
                          :<button className="lib-switch-btn" onClick={()=>setConfirmProg(prog)}>Switch →</button>
                      }
                    </div>
                    <div className="lib-best">{prog.bestFor}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {confirmProg&&(
        <div className="lib-modal-overlay" onClick={()=>!switching&&setConfirmProg(null)}>
          <div className="lib-modal" onClick={e=>e.stopPropagation()}>
            <h3>Switch to {confirmProg.name}?</h3>
            <p>Your current history and PRs will be kept. Your program week will restart from today.</p>
            <div className="lib-modal-btns">
              <button className="lib-confirm-btn" disabled={switching} onClick={()=>confirmSwitch(confirmProg)}>
                {switching?"Switching…":"Switch Program →"}
              </button>
              <button className="lib-cancel-btn" disabled={switching} onClick={()=>setConfirmProg(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADAPT NOW HELPERS ────────────────────────────────────────────────────────
const ADAPT_CATEGORIES = [
  {id:"injury",   emoji:"🤕", label:"Injury / Pain",       options:["Upper body injury","Lower body injury","Back pain","Hamstring strain","Knee pain","Other injury"]},
  {id:"travel",   emoji:"✈️", label:"Traveling / No Gym",   options:["Hotel gym only","Dumbbells only","Bodyweight only","Resistance bands only"]},
  {id:"recovery", emoji:"😴", label:"Recovery & Wellness",  options:["Poor sleep (under 5 hrs)","Feeling sick","High stress","Feeling great — increase intensity"]},
  {id:"female",   emoji:"🩸", label:"Female Health",        options:["Menstrual phase (reduce intensity)","Follicular phase (increase intensity)","Ovulation (peak day)","Luteal phase (maintain)"]},
  {id:"time",     emoji:"⏱️", label:"Time Constraint",      options:["Only 20 minutes","Only 30 minutes","Only 45 minutes"]},
  {id:"other",    emoji:"✏️", label:"Other",                options:[]},
];


const ADAPT_CSS = `
  .adapt-overlay{position:fixed;inset:0;background:rgba(6,13,26,.97);z-index:300;display:flex;flex-direction:column;overflow:hidden;}
  .adapt-header{padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .adapt-title{font-family:'Barlow Condensed',sans-serif;font-size:24px;font-weight:900;letter-spacing:.04em;}
  .adapt-close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .adapt-body{flex:1;overflow-y:auto;padding:20px;}
  .adapt-cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;}
  .adapt-cat-card{background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.08);border-radius:14px;padding:16px 14px;cursor:pointer;text-align:left;transition:all .15s;display:flex;flex-direction:column;gap:6px;font-family:inherit;}
  .adapt-cat-card.sel{border-color:rgba(41,121,255,.5);background:rgba(41,121,255,.08);}
  .adapt-cat-card:hover{background:rgba(255,255,255,.07);}
  .adapt-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
  .adapt-chip{padding:9px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(245,245,240,.65);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;}
  .adapt-chip.sel{border-color:#2979FF;background:rgba(41,121,255,.12);color:#2979FF;}
  .adapt-footer{padding:16px 20px 28px;border-top:1px solid rgba(255,255,255,.07);flex-shrink:0;}
  .adapt-primary{width:100%;padding:15px;border:none;border-radius:12px;background:#2979FF;color:#fff;font-size:15px;font-weight:700;letter-spacing:.05em;cursor:pointer;font-family:inherit;}
  .adapt-primary:disabled{opacity:.35;cursor:not-allowed;}
  .adapt-secondary{width:100%;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:transparent;color:rgba(245,245,240,.5);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:10px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

function AdaptNowModal({wPrefs, profile, todayFocus, todayExercises, adaptationsLeft, adaptationsUsed, onUseAdapted, onClose}) {
  const [screen, setScreen] = useState("categories");
  const [category, setCategory] = useState(null);
  const [subOption, setSubOption] = useState(null);
  const [customText, setCustomText] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);

  const selectedCat = ADAPT_CATEGORIES.find(c => c.id === category);
  const cyclePhase = getCyclePhase(wPrefs?.lastPeriodDate || profile?.lastPeriodDate);
  const selectedReason = category === "other" ? customText.trim() : subOption;
  const canAdapt = !!(selectedReason);

  useEffect(() => {
    if (category === "female" && cyclePhase && !subOption) setSubOption(cyclePhase.adaptOption);
  }, [category]);

  async function runAdapt() {
    if (!canAdapt) return;
    setScreen("loading"); setErr(null);
    try {
      const adaptHealthItems=[...(profile?.conditions||[]).filter(c=>c!=="none"),...(wPrefs?.injuries||[]).filter(Boolean)];
      const adaptHealthCtx=adaptHealthItems.length>0?`\nKnown conditions/injuries: ${adaptHealthItems.join(", ")} — factor into all exercise selections.`:"";
      const prompt = `You are an expert personal trainer and coach.

Current program: ${wPrefs.splitType||"General"} — ${wPrefs.liftExp||"intermediate"} level
Today's session: ${todayFocus}
User situation: ${selectedReason}${adaptHealthCtx}

Current planned exercises:
${JSON.stringify((todayExercises||[]).map(e=>({name:e.name,sets:e.sets,reps:e.reps,notes:e.notes})), null, 2)}

Please adapt this session for the user's situation. Return ONLY a valid JSON object with no extra text:
{
  "changes": [
    { "type": "removed", "exercise": "name", "reason": "why" },
    { "type": "replaced", "original": "name", "replacement": "name", "reason": "why" },
    { "type": "modified", "exercise": "name", "change": "what changed", "reason": "why" }
  ],
  "adapted_exercises": [
    { "name": "exercise name", "sets": 3, "reps": "10-12", "notes": "coaching note", "weight": "", "done": false }
  ],
  "session_note": "One sentence summary of the adaptation"
}

Rules:
- Injury: remove dangerous movements, suggest safer alternatives that work around the injury.
- Travel/no gym: convert all barbell movements to dumbbell or bodyweight alternatives.
- Poor recovery/sick: reduce sets by 30-40%, reduce intensity, focus on movement quality.
- Menstrual phase: reduce volume 30%, remove heavy compound lifts, keep lighter accessory work.
- Follicular/ovulation: keep or increase intensity — good time for PRs.
- Time constraints: keep only the primary compound movements, cut accessories to fit the time.
- Feeling great: add 1-2 sets to primary lifts, suggest going for a PR.`;

      const r = await fetch("/api/claude", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-haiku-4-5-20251001", max_tokens:2000, messages:[{role:"user",content:prompt}]})
      });
      const d = await r.json();
      const text = d.content?.[0]?.text || "";
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("No JSON");
      const parsed = JSON.parse(m[0]);
      if (!parsed.adapted_exercises?.length) throw new Error("No exercises");
      setResult(parsed); setScreen("results");
    } catch(e) {
      setErr("Couldn't adapt session — try again."); setScreen("categories");
    }
  }

  const ICONS = {removed:"❌", replaced:"🔄", modified:"📉"};

  if (screen === "loading") return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:40}}>
        <div style={{width:52,height:52,border:"3px solid rgba(41,121,255,.2)",borderTop:"3px solid #2979FF",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900}}>ADAPTING SESSION</div>
        <div style={{fontSize:13,color:"rgba(245,245,240,.45)",textAlign:"center",maxWidth:280}}>{selectedReason}</div>
      </div>
    </div>
  );

  if (screen === "results" && result) return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontSize:10,color:"#2979FF",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>ADAPTED SESSION</div>
          <div className="adapt-title">YOUR ADAPTED SESSION</div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body" style={{animation:"slideUp .3s ease"}}>
        {result.session_note&&(
          <div style={{background:"rgba(41,121,255,.08)",border:"1px solid rgba(41,121,255,.2)",borderRadius:12,padding:"14px 16px",marginBottom:18}}>
            <div style={{fontSize:10,color:"#2979FF",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>SESSION NOTE</div>
            <div style={{fontSize:13,color:"rgba(245,245,240,.85)",lineHeight:1.65}}>{result.session_note}</div>
          </div>
        )}
        {result.changes?.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>WHAT CHANGED</div>
            {result.changes.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.05)"}}>
                <span style={{fontSize:16,flexShrink:0,lineHeight:1.5}}>{ICONS[c.type]||"•"}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#fff",marginBottom:2}}>
                    {c.type==="replaced"?`${c.original} → ${c.replacement}`:(c.exercise||c.original)}
                    {c.change&&<span style={{color:"rgba(245,245,240,.45)",fontWeight:400}}> — {c.change}</span>}
                  </div>
                  <div style={{fontSize:11,color:"rgba(245,245,240,.35)"}}>{c.reason}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>ADAPTED EXERCISES · {result.adapted_exercises?.length}</div>
          {(result.adapted_exercises||[]).map((ex,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"rgba(255,255,255,.03)",borderRadius:8,marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600}}>{ex.name}</span>
              <span style={{fontSize:11,color:"rgba(245,245,240,.45)",flexShrink:0,marginLeft:8}}>{ex.sets}×{ex.reps}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="adapt-footer">
        <button className="adapt-primary" onClick={()=>onUseAdapted(result, selectedReason)}>✓ Use This Adapted Session</button>
        <button className="adapt-secondary" onClick={onClose}>✕ Keep Original Session</button>
      </div>
    </div>
  );

  return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontSize:10,color:"#2979FF",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>ADAPT NOW · {adaptationsLeft} OF 2 REMAINING</div>
          <div className="adapt-title">ADAPT YOUR SESSION</div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body">
        {err&&<div style={{background:"rgba(255,77,109,.1)",border:"1px solid rgba(255,77,109,.3)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#FF4D6D"}}>{err}</div>}
        <div style={{fontSize:12,color:"rgba(245,245,240,.45)",marginBottom:18,lineHeight:1.7}}>What's happening today? We'll adapt your workout to match your situation.</div>
        <div className="adapt-cat-grid">
          {ADAPT_CATEGORIES.map(cat=>(
            <button key={cat.id} className={`adapt-cat-card${category===cat.id?" sel":""}`} onClick={()=>{setCategory(cat.id);setSubOption(null);}}>
              <span style={{fontSize:24,lineHeight:1}}>{cat.emoji}</span>
              <span style={{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.2}}>{cat.label}</span>
            </button>
          ))}
        </div>
        {selectedCat&&(
          <div style={{animation:"slideUp .2s ease"}}>
            <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:12}}>{selectedCat.label}</div>
            {selectedCat.id==="other"
              ?<textarea value={customText} onChange={e=>setCustomText(e.target.value)} placeholder="Describe your situation..." rows={4}
                  style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1.5px solid rgba(255,255,255,.12)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box"}}/>
              :<div className="adapt-chips">
                {selectedCat.options.map(opt=>(
                  <button key={opt} className={`adapt-chip${subOption===opt?" sel":""}`} onClick={()=>setSubOption(opt)}>{opt}</button>
                ))}
              </div>
            }
          </div>
        )}
      </div>
      <div className="adapt-footer">
        <button className="adapt-primary" disabled={!canAdapt} onClick={runAdapt}>Adapt My Session →</button>
      </div>
    </div>
  );
}

export function TrainSection({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,trainScreen,setTrainScreen,workout,workoutLoading,generateWorkout,activeWorkout,setActiveWorkout,restActive,restTimer,logSet,finishWorkout,getSuggestion,history,planMode,setPlanMode,runPlan,setRunPlan,hybridMix,setHybridMix,startStructured,todayKey,todayType,todayFocus,cfg,isMobile,user}) {
  const TRAIN_TABS=[{id:"today",l:"Today"},{id:"builder",l:"Lift Smarter"},{id:"active",l:"Active Session"},{id:"plan",l:"My Program"},{id:"library",l:"Library"},{id:"progress",l:"Progress"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
  const [showGVT,setShowGVT]=useState(false);

  // ── Exercise detail modal ────────────────────────────────────────────────
  const [detailModal,setDetailModal]=useState(null); // {exerciseName, exerciseIdx}
  const longPressTimer=useRef(null);
  function openDetail(exerciseName,exerciseIdx){setDetailModal({exerciseName,exerciseIdx});}
  function startLongPress(exerciseName,exerciseIdx){longPressTimer.current=setTimeout(()=>openDetail(exerciseName,exerciseIdx),500);}
  function cancelLongPress(){if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}}

  // ── Favorites & Swap state ───────────────────────────────────────────────
  const favorites=wPrefs.favorites||[];
  const permanentSwaps=wPrefs.permanentSwaps||{};
  const [swapModal,setSwapModal]=useState(null);
  const [selectedSwap,setSelectedSwap]=useState(null);
  const [swapPermanent,setSwapPermanent]=useState(false);

  useEffect(()=>{if(swapModal){setSelectedSwap(null);setSwapPermanent(false);}},[swapModal]);

  async function saveWPrefs(newWPrefs){
    setWPrefs(newWPrefs);
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(user)await sb.from("profiles").upsert({id:user.id,wprefs:newWPrefs},{onConflict:"id"});
    }catch(e){console.error("[saveWPrefs]",e);}
  }

  function toggleFavorite(name){
    const isFav=favorites.includes(name);
    const newFavs=isFav?favorites.filter(f=>f!==name):[...favorites,name];
    saveWPrefs({...wPrefs,favorites:newFavs});
  }

  function applySwap(exerciseIdx,swapName,permanent,originalName){
    const u={...activeWorkout,exercises:[...activeWorkout.exercises]};
    u.exercises[exerciseIdx]={...u.exercises[exerciseIdx],name:swapName,swappedFrom:originalName};
    setActiveWorkout(u);
    if(permanent){
      saveWPrefs({...wPrefs,permanentSwaps:{...permanentSwaps,[originalName]:swapName}});
    }
    setSwapModal(null);
    setSelectedSwap(null);
  }

  // ── Pre-session readiness (AIT Part 2) ──────────────────────────────────
  const [showReadiness,setShowReadiness]=useState(false);
  const [sessionReadiness,setSessionReadiness]=useState(null);
  const [rdAnswers,setRdAnswers]=useState({sleep:null,stress:null,energy:null});

  function confirmReadiness(){
    const score=scoreReadiness({sleep:rdAnswers.sleep||"7",stress:rdAnswers.stress||"low",energy:rdAnswers.energy||"normal"});
    const tier=getReadinessTier(score);
    const cfg=READINESS_CONFIG[tier];
    const rd={tier,config:cfg,answers:rdAnswers};
    setSessionReadiness(rd);
    setShowReadiness(false);
    _doStartFromProgram(rd);
  }

  function skipReadiness(){
    setShowReadiness(false);
    _doStartFromProgram(null);
  }

  // ── Adapt Now state ──────────────────────────────────────────────────────
  const [showAdapt,setShowAdapt]=useState(false);
  const [adaptToast,setAdaptToast]=useState("");
  const [localAdaptUsed,setLocalAdaptUsed]=useState(null);

  const adaptResetDate=profile?.adaptations_reset_date;
  const daysSinceReset=adaptResetDate?Math.floor((Date.now()-new Date(adaptResetDate))/86400000):31;
  const needsAdaptReset=daysSinceReset>30;
  const adaptUsed=localAdaptUsed!==null?localAdaptUsed:(needsAdaptReset?0:(profile?.adaptations_used||0));
  const adaptLeft=Math.max(0,2-adaptUsed);
  const daysUntilReset=needsAdaptReset?0:Math.max(0,30-daysSinceReset);

  useEffect(()=>{
    if(!needsAdaptReset)return;
    (async()=>{
      const {data:{user}}=await sb.auth.getUser().catch(()=>({data:{user:null}}));
      if(!user)return;
      await sb.from("profiles").upsert({id:user.id,adaptations_used:0,adaptations_reset_date:new Date().toISOString().split("T")[0]},{onConflict:"id"});
    })();
  },[needsAdaptReset]);

  async function useAdaptedSession(result, reason){
    const exs=(result.adapted_exercises||[]).map(ex=>({
      name:ex.name, notes:ex.notes||"",
      originalName:ex.name,
      sets:Array.from({length:Number(ex.sets)||3},()=>({weight:ex.weight||"",reps:String(ex.reps||"10"),done:false}))
    }));
    setActiveWorkout({exercises:exs});
    setTrainScreen("active");
    setShowAdapt(false);
    const newUsed=adaptUsed+1;
    setLocalAdaptUsed(newUsed);
    setAdaptToast(`Adapted session loaded. ${Math.max(0,2-newUsed)} adaptation${2-newUsed===1?"":"s"} remaining this month.`);
    setTimeout(()=>setAdaptToast(""),4500);
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(user){
        await sb.from("adaptations").insert({user_id:user.id,reason,original_workout:todayPrescription,adapted_workout:result.adapted_exercises});
        await sb.from("profiles").upsert({id:user.id,adaptations_used:newUsed,adaptations_reset_date:needsAdaptReset?new Date().toISOString().split("T")[0]:(adaptResetDate||new Date().toISOString().split("T")[0])},{onConflict:"id"});
      }
    }catch(e){console.error("[adapt] save error",e);}
  }

  // ── Program detection ────────────────────────────────────────────────────
  const trainingDays=WDAYS.filter(d=>schedule[d]==="training");
  const daysPerWeek=trainingDays.length||3;
  const startDate=profile?.startDate?new Date(profile.startDate):new Date();
  const daysSinceStart=Math.max(0,Math.floor((new Date()-startDate)/86400000));
  const weekNum=Math.floor(daysSinceStart/7)+1;
  const dayIndex=daysSinceStart%(daysPerWeek||1);
  const isLifting=!wPrefs.isHyrox&&!wPrefs.isHybrid&&!(wPrefs.splitType||"").toLowerCase().includes("run");
  const isGVTWeek=isLifting&&weekNum%4===0&&todayType==="training";

  let prescType="lifting";
  if(wPrefs.isHyrox&&wPrefs.isHybrid)prescType="hybrid-hyrox";
  else if(wPrefs.isHyrox)prescType="hyrox";
  else if(wPrefs.isHybrid)prescType="hybrid";
  else if((wPrefs.splitType||"").toLowerCase().includes("run"))prescType="running";

  let todayPrescription=null;
  let todayProgObj=null;
  if(prescType==="lifting"&&todayType==="training"){
    let exs=getWorkoutForDay(daysPerWeek,wPrefs.splitType||"Full Body",dayIndex,wPrefs.equipment||"Full Gym",undefined,wPrefs.liftExp||profile?.liftExp);
    exs=applyEquipmentToWorkout(exs,wPrefs.equipment||"Full Gym");
    exs=exs.map(ex=>{const c=ex.originalName||ex.name;const sw=permanentSwaps[c];return{...ex,name:sw||ex.name,swappedFrom:sw?c:undefined,isFavorite:favorites.includes(c)};});
    if(showGVT&&isGVTWeek)exs=[...exs.slice(0,2).map(e=>({...e,sets:GVT_OVERLAY.sets,reps:GVT_OVERLAY.reps,notes:GVT_OVERLAY.note})),...exs.slice(2)];
    todayPrescription=exs;
  }else if(prescType==="running"){
    todayProgObj=RUNNING_PROGRAMS[wPrefs.runPlan||"Couch to 5K"];
    const rawDay=todayProgObj?.schedule?.find(w=>w.week===weekNum)?.days?.find(d=>d.day===todayKey)||null;
    if(rawDay?.skill_variants){
      const lvl=(wPrefs.cardioExp||wPrefs.liftExp||profile?.liftExp||"intermediate").toLowerCase();
      todayPrescription=getSkillVariant(rawDay.skill_variants,lvl)||rawDay;
    }else{
      todayPrescription=rawDay;
    }
    const runPaces=getPacesFromTime(wPrefs.current5KTime||profile?.current5KTime);
    if(todayPrescription){
      todayPrescription=enrichRunSession(todayPrescription);
      if(runPaces) todayPrescription={...todayPrescription,description:resolvePaceTokens(todayPrescription.description||"",runPaces)};
    }
  }else if(prescType==="hyrox"){
    todayProgObj=HYROX_PROGRAM;
    todayPrescription=getTodayHyroxWorkout(todayProgObj,weekNum,todayKey);
  }else if(prescType==="hybrid-hyrox"){
    todayProgObj=HYBRID_PROGRAMS["Hyrox Hybrid"];
    todayPrescription=getTodayHybridWorkout(todayProgObj,todayKey);
  }else if(prescType==="hybrid"){
    todayProgObj=HYBRID_PROGRAMS[wPrefs.hybridTemplate||"Balanced Hybrid"];
    todayPrescription=getTodayHybridWorkout(todayProgObj,todayKey);
  }

  function startFromProgram(){
    if(prescType==="lifting"&&Array.isArray(todayPrescription)&&!sessionReadiness){
      setRdAnswers({sleep:null,stress:null,energy:null});
      setShowReadiness(true);
      return;
    }
    _doStartFromProgram(sessionReadiness);
  }

  function _doStartFromProgram(readiness){
    let exercises;
    if(prescType==="lifting"&&Array.isArray(todayPrescription)){
      const style=getCoachingStyle(wPrefs?.trainingAge);
      const baseSetCount=style.sets?.min||3;
      const weightMod=readiness?.config?.weightMod||1.0;
      const volMod=readiness?.config?.volumeMod||1.0;
      exercises=todayPrescription.map(ex=>({
        name:ex.name,notes:ex.notes||"",
        originalName:ex.originalName||ex.name,
        isFavorite:ex.isFavorite,
        swappedFrom:ex.swappedFrom,
        tier:ex.tier,
        priority:isPriorityExercise(ex.name,wPrefs?.musclePriorities||[]),
        sets:Array.from({length:Math.max(1,Math.round((Number(ex.sets)||baseSetCount)*volMod))},()=>({
          weight:applyWeightMod(ex.weight||"",weightMod),
          reps:String(ex.reps||10),done:false
        })),
      }));
      exercises=applyMobilitySubstitutions(exercises,wPrefs?.mobilityLimitations||[]);
      exercises=lifeStageModifier(exercises,profile);
      const userAge=getAge(profile?.dobYear,profile?.dobMonth,profile?.dobDay);
      const ageProg=getAgeAppropriateProgram(exercises,userAge);
      if(ageProg!==null)exercises=ageProg;
      const jointMode=wPrefs?.jointHealthMode!==false;
      exercises=applyOlderAdultProgram(exercises,userAge,jointMode);
      const priorities=wPrefs?.musclePriorities||[];
      if(priorities.length>0){
        exercises=[...exercises].sort((a,b)=>(a.priority?0:1)-(b.priority?0:1));
      }
    }else{
      const e=todayPrescription||{};
      const dur=e.duration?`${e.duration} min`:"";
      const dist=e.distance?` · ${e.distance}km`:"";
      exercises=[{name:e.label||"Today's Session",notes:(e.description||"")+(dur?`\n${dur}${dist}`:""),sets:[{weight:"",reps:dur||"Complete",done:false}]}];
    }
    setActiveWorkout({exercises,readinessTier:readiness?.tier||null});
    setTrainScreen("active");
  }

  const ZONE_COLOR={1:"#aaa",2:"#00C9A7",3:"#4fc3f7",4:"#f5a623",5:"#FF4D6D"};
  const ZONE_LABEL={1:"Zone 1 Recovery",2:"Zone 2 Aerobic",3:"Zone 3 Tempo",4:"Zone 4 Threshold",5:"Zone 5 VO₂ Max"};

  return (
    <div style={{paddingBottom:isMobile?20:0}}>
      {/* Adapt Now Modal */}
      {showAdapt&&<AdaptNowModal wPrefs={wPrefs} profile={profile} todayFocus={todayFocus} todayExercises={Array.isArray(todayPrescription)?todayPrescription:[]} adaptationsLeft={adaptLeft} adaptationsUsed={adaptUsed} onUseAdapted={useAdaptedSession} onClose={()=>setShowAdapt(false)}/>}

      {/* Swap Exercise Modal */}
      {swapModal&&(()=>{
        const opts=getSwapOptions(swapModal.originalName,wPrefs.equipment||"Full Gym");
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,.92)",backdropFilter:"blur(8px)",zIndex:250,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSwapModal(null)}>
            <div style={{background:"#0A1222",border:"1px solid rgba(255,255,255,.12)",borderRadius:"18px 18px 0 0",padding:"20px 20px 40px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:32,height:3,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 20px"}}/>
              <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>SWAP EXERCISE</div>
              <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>{swapModal.exerciseName}</div>
              <div style={{fontSize:12,color:"rgba(245,245,240,.4)",marginBottom:18}}>Choose a replacement — same muscle group</div>
              {opts.length>0
                ?<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
                  {opts.map((opt,i)=>(
                    <button key={i} onClick={()=>setSelectedSwap(selectedSwap===opt.name?null:opt.name)}
                      style={{padding:"12px 16px",background:selectedSwap===opt.name?"rgba(41,121,255,.15)":"rgba(255,255,255,.04)",border:`1.5px solid ${selectedSwap===opt.name?"rgba(41,121,255,.5)":"rgba(255,255,255,.08)"}`,borderRadius:10,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"inherit"}}>
                      <span style={{fontSize:14,fontWeight:600,color:"#fff"}}>{opt.name}</span>
                      {selectedSwap===opt.name&&<span style={{fontSize:14,color:"#2979FF"}}>✓</span>}
                    </button>
                  ))}
                </div>
                :<div style={{fontSize:13,color:"rgba(245,245,240,.4)",textAlign:"center",padding:"16px 0",marginBottom:18}}>No alternatives for this equipment setup.</div>
              }
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,padding:"12px 14px",background:"rgba(255,255,255,.03)",borderRadius:10,border:"1px solid rgba(255,255,255,.06)"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Make permanent</div>
                  <div style={{fontSize:11,color:"rgba(245,245,240,.4)"}}>Always replace this exercise in my plan</div>
                </div>
                <button onClick={()=>setSwapPermanent(p=>!p)} style={{width:40,height:24,borderRadius:12,border:"none",background:swapPermanent?"#2979FF":"rgba(255,255,255,.12)",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,transition:"left .2s",left:swapPermanent?19:3}}/>
                </button>
              </div>
              <button onClick={()=>selectedSwap&&applySwap(swapModal.exerciseIdx,selectedSwap,swapPermanent,swapModal.originalName)} disabled={!selectedSwap}
                style={{width:"100%",padding:15,background:selectedSwap?"#2979FF":"rgba(255,255,255,.05)",color:selectedSwap?"#fff":"rgba(245,245,240,.25)",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:selectedSwap?"pointer":"not-allowed",fontFamily:"inherit",marginBottom:10,transition:"all .2s"}}>
                Swap Exercise →
              </button>
              <button onClick={()=>setSwapModal(null)} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* Pre-session Readiness Modal */}
      {showReadiness&&(
        <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,.92)",backdropFilter:"blur(8px)",zIndex:260,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={skipReadiness}>
          <div style={{background:"#0A1222",border:"1px solid rgba(255,255,255,.12)",borderRadius:"18px 18px 0 0",padding:"24px 20px 40px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:32,height:3,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",marginBottom:4,fontFamily:"'DM Mono',monospace"}}>Pre-Session Check-In</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,marginBottom:20}}>How are you feeling?</div>
            {/* Sleep */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Sleep last night</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["4","5","6","7","8","9+"].map(v=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,sleep:v}))} style={{padding:"8px 14px",borderRadius:9,border:`1.5px solid ${rdAnswers.sleep===v?T.carb:T.bd}`,background:rdAnswers.sleep===v?`${T.carb}18`:T.s2,color:rdAnswers.sleep===v?T.carb:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{v}h</button>
                ))}
              </div>
            </div>
            {/* Stress */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Stress level</div>
              <div style={{display:"flex",gap:8}}>
                {[["low","😌 Low"],["medium","😐 Medium"],["high","😤 High"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,stress:v}))} style={{flex:1,padding:"10px 6px",borderRadius:9,border:`1.5px solid ${rdAnswers.stress===v?T.carb:T.bd}`,background:rdAnswers.stress===v?`${T.carb}18`:T.s2,color:rdAnswers.stress===v?T.carb:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                ))}
              </div>
            </div>
            {/* Energy */}
            <div style={{marginBottom:22}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Energy</div>
              <div style={{display:"flex",gap:8}}>
                {[["low","⚡ Low"],["normal","✅ Normal"],["high","🔥 High"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,energy:v}))} style={{flex:1,padding:"10px 6px",borderRadius:9,border:`1.5px solid ${rdAnswers.energy===v?T.carb:T.bd}`,background:rdAnswers.energy===v?`${T.carb}18`:T.s2,color:rdAnswers.energy===v?T.carb:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                ))}
              </div>
            </div>
            {/* Preview tier when all answered */}
            {rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy&&(()=>{
              const s=scoreReadiness({sleep:rdAnswers.sleep,stress:rdAnswers.stress,energy:rdAnswers.energy});
              const tier=getReadinessTier(s);
              const cfg=READINESS_CONFIG[tier];
              return(
                <div style={{background:`${cfg.color}12`,border:`1.5px solid ${cfg.color}40`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,color:cfg.color,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>{cfg.badge}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{cfg.label}</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2,maxWidth:220}}>{cfg.sub}</div>
                  </div>
                </div>
              );
            })()}
            <button onClick={confirmReadiness} disabled={!rdAnswers.sleep||!rdAnswers.stress||!rdAnswers.energy}
              style={{width:"100%",padding:15,background:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?T.prot:"rgba(255,255,255,.06)",color:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"#fff":"rgba(245,245,240,.3)",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"pointer":"not-allowed",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1,marginBottom:10,transition:"all .2s"}}>
              Start Session →
            </button>
            <button onClick={skipReadiness} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Skip Check-In</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {adaptToast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#0A1222",border:"1px solid rgba(41,121,255,.4)",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:600,color:"#fff",zIndex:250,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>{adaptToast}</div>}

      <div style={{display:"flex",gap:4,padding:isMobile?"12px 18px 0":"0 0 20px",overflowX:"auto"}}>
        {TRAIN_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setTrainScreen(tab.id)} style={{padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:trainScreen===tab.id?T.carb:"none",color:trainScreen===tab.id?"#000":T.mu,fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>{tab.l}</button>
        ))}
      </div>

      <div style={{padding:isMobile?"12px 18px":"0"}}>

        {/* ── TODAY ── */}
        {trainScreen==="today"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* TODAY HERO CARD */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:`radial-gradient(circle,${cfg.color}08,transparent 70%)`,pointerEvents:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>{new Date().toLocaleDateString("en-US",{weekday:"long"})}</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,lineHeight:1}}>Train 💪</div>
                </div>
                <div style={{background:`${cfg.color}15`,border:`1px solid ${cfg.color}35`,borderRadius:20,padding:"6px 16px",fontSize:12,color:cfg.color,fontWeight:700}}>{cfg.emoji} {todayFocus}</div>
              </div>
              <div style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.6}}>💡 {FOCUS_MUSCLES[todayFocus]||"Full body movement — hit all major muscle patterns"}</div>
              {/* Pregnancy permanent safety banner */}
              {profile?.lifeStage==="pregnant"&&(
                <>
                  <div style={{background:"rgba(249,115,22,.08)",border:"1.5px solid rgba(249,115,22,.3)",borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{fontSize:18,flexShrink:0}}>🤰</div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:"#F97316",letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>Pregnancy — Always consult your OB or midwife</div>
                      <div style={{fontSize:11,color:T.mu,lineHeight:1.6}}>Before continuing or modifying exercise during pregnancy. Stop immediately if you experience pain, dizziness, or shortness of breath.</div>
                    </div>
                  </div>
                  <div style={{background:"rgba(41,121,255,.07)",border:"1px solid rgba(41,121,255,.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:13,flexShrink:0}}>💙</span>
                    <div><div style={{fontSize:11,color:"rgba(41,121,255,.9)",lineHeight:1.6}}>Exercise during pregnancy should be supervised by your OB-GYN or midwife. Coach Macro provides general guidance only.</div><a href="https://coach-macro.com/support" style={{fontSize:10,color:"#2979FF",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                  </div>
                </>
              )}
              {/* Postpartum phase banner */}
              {profile?.lifeStage==="postpartum"&&(()=>{const pp=getPostpartumPhase(profile.postpartumWeeks,profile.csection);return(
                <>
                  <div style={{background:"rgba(168,85,247,.08)",border:"1.5px solid rgba(168,85,247,.3)",borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{fontSize:18,flexShrink:0}}>👶</div>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:"#A855F7",letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>{pp.label}</div>
                      <div style={{fontSize:11,color:T.mu,lineHeight:1.6}}>{pp.desc}</div>
                    </div>
                  </div>
                  <div style={{background:"rgba(41,121,255,.07)",border:"1px solid rgba(41,121,255,.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:13,flexShrink:0}}>💙</span>
                    <div><div style={{fontSize:11,color:"rgba(41,121,255,.9)",lineHeight:1.6}}>Return to exercise postpartum should be guided by your healthcare provider — especially with C-section recovery.</div><a href="https://coach-macro.com/support" style={{fontSize:10,color:"#2979FF",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                  </div>
                </>
              );})()}
              {/* ACL Prevention prehab for female users on leg days */}
              {profile?.sex==="female"&&isLegDay(todayFocus)&&(()=>{
                const cp=getCyclePhase(wPrefs?.lastPeriodDate||profile?.lastPeriodDate);
                const highLaxity=cp&&(cp.phase==="follicular"||cp.phase==="ovulation");
                return(
                  <div style={{background:"rgba(236,72,153,.06)",border:"1px solid rgba(236,72,153,.2)",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
                    <div style={{fontSize:10,color:"#EC4899",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>🦵 ACL PREHAB · 5 MIN</div>
                    {highLaxity&&<div style={{background:"rgba(234,179,8,.08)",border:"1px solid rgba(234,179,8,.25)",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:"#EAB308"}}>⚠️ Higher ligament laxity during {cp.label} — warm up thoroughly, land softly, bend knees on impact.</div>}
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {ACL_PREHAB.map((ex,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"6px 10px",background:T.s2,borderRadius:7}}>
                          <span style={{fontWeight:600}}>{ex.name}</span>
                          <span style={{color:T.mu}}>{ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {(()=>{
                const hc=(profile?.healthConditions||[]).filter(c=>c!=="none");
                if(hc.length===0)return null;
                return(
                  <div style={{background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.25)",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
                    <div style={{fontSize:9,color:"#FBBF24",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>⚠️ SAFETY NOTES FOR YOUR SESSION</div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {hc.map(c=>{const info=HEALTH_CONDITIONS_SAFETY[c];return info?(<div key={c} style={{fontSize:11,color:T.mu,lineHeight:1.55}}><span style={{color:"#FBBF24",fontWeight:600}}>{info.label}:</span> {info.note}</div>):null;})}
                    </div>
                    <a href="https://coach-macro.com/support" style={{fontSize:10,color:"#2979FF",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:6}}>Talk to a professional →</a>
                  </div>
                );
              })()}
              {todayType==="training"&&todayPrescription&&Array.isArray(todayPrescription)&&(()=>{
                const coachStyle=getCoachingStyle(wPrefs?.trainingAge);
                return(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>TODAY'S LIFT · {todayPrescription.length} EXERCISES</div>
                  {coachStyle.progressNote&&<div style={{background:"rgba(41,121,255,.07)",border:"1px solid rgba(41,121,255,.18)",borderRadius:9,padding:"8px 12px",marginBottom:8,fontSize:11,color:"#2979FF"}}>📋 {coachStyle.progressNote}</div>}
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {todayPrescription.slice(0,5).map((ex,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:T.s2,borderRadius:9,border:`1px solid ${T.bd}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</div>
                          {ex.isFavorite&&<span style={{fontSize:10,flexShrink:0}}>❤️</span>}
                          {ex.swappedFrom&&<span style={{fontSize:10,flexShrink:0,opacity:.7}}>🔄</span>}
                        </div>
                        <div style={{fontSize:11,color:T.mu,flexShrink:0,marginLeft:8}}>{ex.sets}×{ex.reps}</div>
                      </div>
                    ))}
                    {todayPrescription.length>5&&<div style={{fontSize:11,color:T.mu,textAlign:"center",padding:"4px 0"}}>+{todayPrescription.length-5} more exercises</div>}
                  </div>
                </div>
                );
              })()}
              {todayType==="training"&&todayPrescription&&!Array.isArray(todayPrescription)&&(()=>{
                const runPaces=getPacesFromTime(wPrefs.current5KTime||profile?.current5KTime);
                const preFuel=todayPrescription.preFuel;
                const postFuel=todayPrescription.postFuel;
                const macroAdj=todayPrescription.macroAdjustment;
                return(
                <div style={{background:T.s2,borderRadius:12,padding:"14px 16px",border:`1px solid ${T.bd}`,marginBottom:14}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>{todayPrescription.label||todayPrescription.type||"Today's Run"}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {todayPrescription.type&&<span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",background:`${T.prot}18`,color:T.prot,padding:"3px 8px",borderRadius:6}}>{todayPrescription.type}</span>}
                    {todayPrescription.duration&&<span style={{fontSize:10,fontWeight:700,background:`${T.carb}18`,color:T.carb,padding:"3px 8px",borderRadius:6}}>{todayPrescription.duration} min</span>}
                    {todayPrescription.distance&&<span style={{fontSize:10,fontWeight:700,background:`${T.fat}18`,color:T.fat,padding:"3px 8px",borderRadius:6}}>{todayPrescription.distance} km</span>}
                    {todayPrescription.zone&&<span style={{fontSize:10,fontWeight:700,background:`${ZONE_COLOR[todayPrescription.zone]}25`,color:ZONE_COLOR[todayPrescription.zone],padding:"3px 8px",borderRadius:6}}>{ZONE_LABEL[todayPrescription.zone]||`Zone ${todayPrescription.zone}`}</span>}
                    {macroAdj&&<span style={{fontSize:10,fontWeight:700,background:`${T.carb}15`,color:T.carb,padding:"3px 8px",borderRadius:6}}>+{macroAdj} carbs</span>}
                  </div>
                  {todayPrescription.description&&<div style={{fontSize:12,color:T.mu,lineHeight:1.7,marginBottom:8}}>{todayPrescription.description}</div>}
                  {runPaces&&(wPrefs.current5KTime||profile?.current5KTime)&&<div style={{background:"rgba(41,121,255,.06)",border:"1px solid rgba(41,121,255,.15)",borderRadius:9,padding:"10px 12px",marginBottom:8}}>
                    <div style={{fontSize:9,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>YOUR PACES TODAY</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px"}}>
                      {[["Easy",runPaces.easy.display],["Tempo",runPaces.tempo.display],["Long Run",runPaces.longRun.display],["Intervals",runPaces.interval5K.display]].map(([l,v])=>(
                        <div key={l} style={{fontSize:11}}><span style={{color:T.mu}}>{l}: </span><span style={{color:"#fff",fontWeight:700,fontFamily:"monospace"}}>{v}</span></div>
                      ))}
                    </div>
                  </div>}
                  {preFuel&&<div style={{background:"rgba(255,215,64,.06)",border:"1px solid rgba(255,215,64,.2)",borderRadius:9,padding:"9px 12px",marginBottom:6}}>
                    <div style={{fontSize:9,color:T.fat,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>⚡ PRE-RUN FUEL</div>
                    <div style={{fontSize:11,color:T.mu,lineHeight:1.6}}>{preFuel}</div>
                  </div>}
                  {postFuel&&<div style={{background:"rgba(0,201,167,.06)",border:"1px solid rgba(0,201,167,.2)",borderRadius:9,padding:"9px 12px",marginBottom:6}}>
                    <div style={{fontSize:9,color:"#00C9A7",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>🔁 RECOVERY FUEL</div>
                    <div style={{fontSize:11,color:T.mu,lineHeight:1.6}}>{postFuel}</div>
                  </div>}
                  {!preFuel&&!postFuel&&todayProgObj?.nutritionNote&&(
                    <div style={{background:`${T.carb}08`,borderRadius:9,padding:"10px 12px",border:`1px solid ${T.carb}20`}}>
                      <div style={{fontSize:9,color:T.carb,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>🍽 NUTRITION BRIDGE</div>
                      <div style={{fontSize:11,color:T.mu,lineHeight:1.6}}>{todayProgObj.nutritionNote}</div>
                    </div>
                  )}
                </div>
                );
              })()}
              {(()=>{
                const lvl=(wPrefs.liftExp||profile?.liftExp||"intermediate").toLowerCase();
                const isNov=lvl==="beginner"||lvl==="novice";
                const isAdv=lvl==="advanced"||lvl==="elite";
                const badgeColor=isNov?"#34D399":isAdv?"#F87171":"#2979FF";
                const badgeBg=isNov?"rgba(52,211,153,.1)":isAdv?"rgba(248,113,113,.1)":"rgba(41,121,255,.1)";
                const badgeLabel=isNov?"Beginner Program":isAdv?"Advanced Program":"Intermediate Program";
                if(!prescType||prescType!=="lifting"||!todayPrescription||!Array.isArray(todayPrescription))return null;
                return(
                  <div style={{background:badgeBg,border:`1px solid ${badgeColor}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div>
                      <span style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:badgeColor}}>{badgeLabel}</span>
                      <div style={{fontSize:11,color:T.mu,marginTop:2}}>Exercises selected for your level. <span style={{color:T.mu,cursor:"pointer",textDecoration:"underline"}} onClick={()=>setTrainScreen&&setTrainScreen("settings")}>Update in Settings.</span></div>
                    </div>
                    <div style={{width:28,height:28,borderRadius:"50%",background:badgeBg,border:`1.5px solid ${badgeColor}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>{isNov?"🌱":isAdv?"🔥":"⚡"}</div>
                  </div>
                );
              })()}
              {(()=>{
                const cp=getCyclePhase(wPrefs?.lastPeriodDate||profile?.lastPeriodDate);
                if(!cp)return null;
                return <div style={{background:`${cp.color}12`,border:`1px solid ${cp.color}30`,borderRadius:10,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:13}}>{cp.label.split(" ")[0]}</span>
                  <div>
                    <span style={{fontSize:11,fontWeight:700,color:cp.color}}>{cp.label}</span>
                    <span style={{fontSize:10,color:T.mu,marginLeft:8}}>Cycle day ~{Math.floor((Date.now()-new Date(wPrefs?.lastPeriodDate||profile?.lastPeriodDate))/86400000)%28+1}</span>
                  </div>
                </div>;
              })()}
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                {todayType==="training"&&todayPrescription
                  ?<button onClick={startFromProgram} style={{flex:2,padding:"14px",background:T.prot,color:T.white,fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>▶ Start Workout →</button>
                  :<button onClick={()=>setTrainScreen("builder")} style={{flex:1,padding:"14px",background:T.prot,color:T.white,fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Build Workout →</button>
                }
                {activeWorkout&&<button onClick={()=>setTrainScreen("active")} style={{flex:1,padding:"14px",background:`${T.carb}15`,color:T.carb,fontWeight:700,fontSize:14,border:`1px solid ${T.carb}40`,borderRadius:12,cursor:"pointer",fontFamily:"inherit"}}>▶ Resume Session</button>}
                {todayType==="training"&&todayPrescription&&Array.isArray(todayPrescription)&&(
                  <button onClick={()=>adaptLeft>0&&setShowAdapt(true)} style={{flexShrink:0,padding:"14px 12px",background:adaptLeft>0?"rgba(255,255,255,.05)":"rgba(255,255,255,.02)",color:adaptLeft>0?"rgba(245,245,240,.75)":"rgba(245,245,240,.25)",fontWeight:700,fontSize:13,border:`1px solid ${adaptLeft>0?"rgba(255,255,255,.12)":"rgba(255,255,255,.06)"}`,borderRadius:12,cursor:adaptLeft>0?"pointer":"not-allowed",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                    🔄 Adapt
                  </button>
                )}
              </div>
              {todayType==="training"&&todayPrescription&&Array.isArray(todayPrescription)&&(
                <div style={{fontSize:11,color:adaptLeft>0?T.mu:"rgba(245,245,240,.3)",textAlign:"center",marginTop:2}}>
                  {adaptLeft>0
                    ?`${adaptLeft} adaptation${adaptLeft===1?"":"s"} remaining this month`
                    :`Adaptations reset in ${daysUntilReset} day${daysUntilReset===1?"":"s"}`
                  }
                </div>
              )}
            </div>

            {/* WEEK SCHEDULE */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:14}}>This Week</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
                {WDAYS.map(day=>{
                  const t=schedule[day];
                  const c=DAY_CFG[t]||DAY_CFG.rest;
                  const isT=day===todayKey;
                  const f=dayFocus[day];
                  return(
                    <div key={day} style={{background:isT?`${T.prot}12`:T.s2,border:`1.5px solid ${isT?T.prot:T.bd}`,borderRadius:12,padding:"10px 4px",textAlign:"center",transition:"all .2s"}}>
                      <div style={{fontSize:9,fontWeight:700,color:isT?T.prot:T.mu,marginBottom:4,letterSpacing:1}}>{day}</div>
                      <div style={{fontSize:18,marginBottom:4}}>{c.emoji}</div>
                      <div style={{fontSize:8,color:isT?T.prot:T.dim,lineHeight:1.2}}>{f?.slice(0,6)||"Rest"}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MUSCLE RECOVERY MAP */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4}}>Muscle Recovery Map</div>
              <div style={{fontSize:11,color:T.mu,marginBottom:16}}>Tap any muscle to see weekly volume status</div>
              <MuscleMap dayFocus={dayFocus} isMobile={isMobile}/>
            </div>
          </div>
        )}

        {/* ── LIFT SMARTER BUILDER ── */}
        {trainScreen==="builder"&&<WorkoutBuilder profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} generateWorkout={generateWorkout} startStructured={startStructured} workout={workout} workoutLoading={workoutLoading} isMobile={isMobile} todayFocus={todayFocus} schedule={schedule} setActiveWorkout={setActiveWorkout} setTrainScreen={setTrainScreen}/>}

        {/* ── ACTIVE WORKOUT ── */}
        {trainScreen==="active"&&(
          <div style={{maxWidth:isMobile?"100%":680}}>
            {!activeWorkout
              ?<div style={{textAlign:"center",padding:"60px 24px",border:`1px dashed ${T.bd}`,borderRadius:20}}>
                <div style={{fontSize:48,marginBottom:16}}>💪</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:8}}>NO ACTIVE SESSION</div>
                <div style={{fontSize:14,color:T.mu,marginBottom:24,lineHeight:1.6}}>Go to Lift Smarter, build your workout, then tap "Start This Session" to begin tracking sets and reps here.</div>
                <button onClick={()=>setTrainScreen("builder")} style={{padding:"14px 28px",background:T.prot,color:T.white,fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Build a Workout →</button>
              </div>
              :<div>
                {/* Header */}
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:"18px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>ACTIVE SESSION</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,lineHeight:1}}>{todayFocus}</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:4}}>{activeWorkout.exercises?.length||0} exercises · {activeWorkout.exercises?.reduce((a,e)=>a+(e.sets?.length||0),0)||0} total sets</div>
                  </div>
                  <button onClick={finishWorkout} style={{padding:"12px 20px",background:T.prot,color:T.white,fontWeight:700,fontSize:14,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>✓ Finish</button>
                </div>

                {/* Readiness banner */}
                {activeWorkout.readinessTier&&(()=>{const cfg=READINESS_CONFIG[activeWorkout.readinessTier];return(
                  <div style={{background:`${cfg.color}10`,border:`1.5px solid ${cfg.color}30`,borderRadius:14,padding:"10px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:cfg.color,letterSpacing:".1em"}}>{cfg.badge}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{cfg.label}</div>
                      <div style={{fontSize:11,color:T.mu}}>{cfg.sub}</div>
                    </div>
                  </div>
                );})()}

                {/* Rest timer */}
                {restActive&&<div style={{background:`rgba(0,201,167,.08)`,border:`1px solid rgba(0,201,167,.25)`,borderRadius:16,padding:"16px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontSize:10,color:"#00C9A7",fontWeight:700,letterSpacing:2,textTransform:"uppercase"}}>⏱ Rest Timer</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>Next set when ready</div>
                  </div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,color:"#00C9A7",fontVariantNumeric:"tabular-nums"}}>{pad2(Math.floor(restTimer/60))}:{pad2(restTimer%60)}</div>
                </div>}

                {/* Exercise cards */}
                {(activeWorkout.exercises||[]).map((ex,ei)=>{
                  const sugg=getSuggestion(ex.name);
                  const doneSets=(ex.sets||[]).filter(s=>s.done).length;
                  const totalSets=(ex.sets||[]).length;
                  const allDone=doneSets===totalSets&&totalSets>0;
                  return(
                    <div key={ei} style={{background:T.s1,border:`1px solid ${allDone?T.carb:T.bd}`,borderRadius:18,padding:"18px 20px",marginBottom:12,position:"relative",overflow:"hidden",transition:"border-color .3s"}}>
                      {allDone&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:T.carb,borderRadius:"18px 18px 0 0"}}/>}
                      {/* Exercise header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <div style={{width:24,height:24,borderRadius:"50%",background:allDone?T.carb:T.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:allDone?"#000":T.mu,flexShrink:0}}>{allDone?"✓":ei+1}</div>
                            <div
                              style={{fontSize:16,fontWeight:700,flex:1,cursor:"pointer",userSelect:"none"}}
                              onPointerDown={()=>startLongPress(ex.name,ei)}
                              onPointerUp={cancelLongPress}
                              onPointerLeave={cancelLongPress}
                              onPointerCancel={cancelLongPress}
                            >
                              {ex.name}
                              {ex.tier&&<span style={{marginLeft:6,fontSize:9,fontWeight:700,background:ex.tier==="A"?`${T.prot}20`:ex.tier==="B"?`${T.carb}20`:"rgba(255,255,255,.08)",color:ex.tier==="A"?T.prot:ex.tier==="B"?T.carb:T.mu,borderRadius:4,padding:"1px 5px",letterSpacing:".06em",verticalAlign:"middle"}}>{ex.tier}</span>}
                              {ex.priority&&<span style={{marginLeft:4,fontSize:9,fontWeight:700,background:"rgba(249,115,22,.15)",color:"#F97316",borderRadius:4,padding:"1px 5px",letterSpacing:".06em",verticalAlign:"middle"}}>⭐ PRIORITY</span>}
                              {ex.mobilitySubstituted&&<span style={{marginLeft:4,fontSize:9,fontWeight:700,background:"rgba(139,92,246,.15)",color:"#8B5CF6",borderRadius:4,padding:"1px 5px",letterSpacing:".06em",verticalAlign:"middle"}}>♿ MODIFIED</span>}
                            </div>
                            <button onClick={()=>openDetail(ex.name,ei)} title="Exercise info" style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",fontSize:15,lineHeight:1,color:"rgba(245,245,240,.4)",flexShrink:0}}>ⓘ</button>
                            <button onClick={()=>toggleFavorite(ex.originalName||ex.name)} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",fontSize:15,lineHeight:1,flexShrink:0}}>{favorites.includes(ex.originalName||ex.name)?"❤️":"🤍"}</button>
                            <button onClick={()=>setSwapModal({exerciseIdx:ei,exerciseName:ex.name,originalName:ex.originalName||ex.name})} style={{background:"none",border:"none",cursor:"pointer",padding:"2px 4px",fontSize:14,lineHeight:1,color:"rgba(245,245,240,.35)",flexShrink:0}}>🔄</button>
                          </div>
                          {ex.notes&&<div style={{fontSize:11,color:T.mu,marginLeft:32}}>{ex.notes}</div>}
                          {ex.mobilitySubstituted&&ex.originalName&&<div style={{fontSize:10,color:"#8B5CF6",marginLeft:32,marginTop:2}}>Substituted from {ex.originalName} due to mobility</div>}
                        </div>
                        {sugg&&<div style={{background:`${T.prot}10`,border:`1px solid ${T.prot}25`,borderRadius:10,padding:"8px 12px",textAlign:"right",flexShrink:0,marginLeft:12}}>
                          <div style={{fontSize:8,color:T.prot,fontWeight:700,letterSpacing:1,marginBottom:2}}>SUGGESTED</div>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:T.prot}}>{sugg.weight}lbs × {sugg.reps}</div>
                          <div style={{fontSize:9,color:T.mu}}>{sugg.note}</div>
                        </div>}
                      </div>

                      {/* Progress bar */}
                      <div style={{height:3,background:T.s3,borderRadius:2,marginBottom:12,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${totalSets>0?doneSets/totalSets*100:0}%`,background:T.carb,borderRadius:2,transition:"width .4s"}}/>
                      </div>

                      {/* Set headers */}
                      <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 72px",gap:6,marginBottom:8}}>
                        {["SET","WEIGHT","REPS","DONE"].map(h=>(<div key={h} style={{fontSize:8,color:T.mu,fontWeight:700,letterSpacing:1.5,textAlign:"center"}}>{h}</div>))}
                      </div>

                      {/* Sets */}
                      {(ex.sets||[]).map((s,si)=>(
                        <div key={si} style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 72px",gap:6,marginBottom:8,alignItems:"center"}}>
                          <div style={{fontSize:13,color:s.done?T.carb:T.mu,fontWeight:700,textAlign:"center"}}>#{si+1}</div>
                          <input
                            defaultValue={s.weight||sugg?.weight||""}
                            placeholder="lbs"
                            style={{background:s.done?`${T.carb}12`:T.s2,border:`1.5px solid ${s.done?T.carb:T.bd}`,borderRadius:9,padding:"10px",color:s.done?T.carb:"#fff",fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"center",width:"100%",boxSizing:"border-box"}}
                            onChange={e=>{const u={...activeWorkout};u.exercises[ei].sets[si].weight=e.target.value;setActiveWorkout(u);}}
                          />
                          <input
                            defaultValue={s.reps||sugg?.reps||10}
                            style={{background:s.done?`${T.carb}12`:T.s2,border:`1.5px solid ${s.done?T.carb:T.bd}`,borderRadius:9,padding:"10px",color:s.done?T.carb:"#fff",fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"center",width:"100%",boxSizing:"border-box"}}
                            onChange={e=>{const u={...activeWorkout};u.exercises[ei].sets[si].reps=e.target.value;setActiveWorkout(u);}}
                          />
                          <button
                            onClick={()=>{const u={...activeWorkout};logSet(ei,si,u.exercises[ei].sets[si].reps,u.exercises[ei].sets[si].weight);}}
                            style={{padding:"10px 0",background:s.done?T.carb:T.s3,color:s.done?"#000":"#fff",border:`1.5px solid ${s.done?T.carb:T.bd}`,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",width:"100%",transition:"all .2s"}}
                          >{s.done?"✓":"Log"}</button>
                        </div>
                      ))}

                      {/* Add set */}
                      <button onClick={()=>{const u={...activeWorkout};u.exercises[ei].sets=[...u.exercises[ei].sets,{reps:u.exercises[ei].sets[0]?.reps||10,weight:u.exercises[ei].sets[0]?.weight||"",done:false}];setActiveWorkout(u);}} style={{width:"100%",fontSize:11,color:T.mu,background:"none",border:`1px dashed ${T.bd}`,borderRadius:8,padding:"8px",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>+ Add Set</button>

                      {/* Per-exercise feedback (AIT Part 3) */}
                      {allDone&&(
                        <div style={{marginTop:14,padding:"12px 14px",background:T.s2,borderRadius:12,border:`1px solid ${T.bd}`}}>
                          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Quick Feedback</div>
                          <div style={{marginBottom:8}}>
                            <div style={{fontSize:11,color:"rgba(245,245,240,.55)",marginBottom:6}}>Feel the right muscle?</div>
                            <div style={{display:"flex",gap:6}}>
                              {[["yes","💯 Yes"],["somewhat","🤷 Somewhat"],["no","❌ No"]].map(([v,l])=>(
                                <button key={v} onClick={()=>{const u={...activeWorkout};if(!u.exercises[ei].feedback)u.exercises[ei].feedback={};u.exercises[ei].feedback.feel=v;setActiveWorkout({...u});}}
                                  style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:700,borderRadius:8,border:`1.5px solid ${ex.feedback?.feel===v?T.carb:T.bd}`,background:ex.feedback?.feel===v?`${T.carb}18`:T.s1,color:ex.feedback?.feel===v?T.carb:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:11,color:"rgba(245,245,240,.55)",marginBottom:6}}>Challenge level?</div>
                            <div style={{display:"flex",gap:6}}>
                              {[["easy","😴 Easy"],["perfect","✅ Perfect"],["hard","🥵 Hard"]].map(([v,l])=>(
                                <button key={v} onClick={()=>{const u={...activeWorkout};if(!u.exercises[ei].feedback)u.exercises[ei].feedback={};u.exercises[ei].feedback.challenge=v;setActiveWorkout({...u});}}
                                  style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:700,borderRadius:8,border:`1.5px solid ${ex.feedback?.challenge===v?T.carb:T.bd}`,background:ex.feedback?.challenge===v?`${T.carb}18`:T.s1,color:ex.feedback?.challenge===v?T.carb:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                              ))}
                            </div>
                          </div>
                          {/* Coaching cue based on feedback */}
                          {ex.feedback?.feel==="no"&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,fontSize:11,color:"#EF4444"}}>💡 Mind-muscle tip: slow the eccentric, reduce weight 10%, focus on the squeeze at peak contraction.</div>}
                          {ex.feedback?.feel==="yes"&&ex.feedback?.challenge==="easy"&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(0,201,167,.08)",border:"1px solid rgba(0,201,167,.2)",borderRadius:8,fontSize:11,color:"#00C9A7"}}>📈 Add 2.5–5 lbs next session.</div>}
                          {ex.feedback?.feel==="somewhat"&&ex.feedback?.challenge==="perfect"&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(41,121,255,.08)",border:"1px solid rgba(41,121,255,.2)",borderRadius:8,fontSize:11,color:"#2979FF"}}>🎯 Focus on the target muscle before each set. Try a 2-second pause at peak.</div>}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Finish */}
                <button onClick={finishWorkout} style={{width:"100%",padding:"16px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1,marginTop:8}}>✓ Finish Workout</button>
              </div>
            }
          </div>
        )}

        {/* ── Exercise detail modal ── */}
        {detailModal&&(
          <ExerciseDetailModal
            exerciseName={detailModal.exerciseName}
            user={user}
            onClose={()=>setDetailModal(null)}
            onSwap={()=>{
              setDetailModal(null);
              setSwapModal({exerciseIdx:detailModal.exerciseIdx,exerciseName:detailModal.exerciseName,originalName:(activeWorkout?.exercises?.[detailModal.exerciseIdx]?.originalName)||detailModal.exerciseName});
            }}
          />
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
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:10}}>Mix</div>
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
                <div key={day} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid rgba(245,245,240,0.05)`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontWeight:700,fontSize:13,color:isT?T.prot:"#fff",width:32}}>{day}</span>
                    <span style={{background:c.bg,color:c.color,fontSize:9,fontWeight:700,letterSpacing:1,padding:"2px 8px",borderRadius:20,textTransform:"uppercase"}}>{f}</span>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    {["training","cardio","run","hyrox","rest"].map(tp=>(<button key={tp} onClick={()=>setSchedule(s=>({...s,[day]:tp}))} style={{fontSize:13,padding:"4px 6px",borderRadius:6,border:`1px solid ${schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).color:T.bd}`,background:schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).bg:"none",cursor:"pointer"}}>{(DAY_CFG[tp]||DAY_CFG.rest).emoji}</button>))}
                  </div>
                </div>
              );})}
            </SectionCard>
          </div>
        )}

        {/* ── LIBRARY ── */}
        {trainScreen==="library"&&<ProgramLibraryScreen wPrefs={wPrefs} setWPrefs={setWPrefs} profile={profile} setTrainScreen={setTrainScreen}/>}

        {/* ── PROGRESS ── */}
        {trainScreen==="progress"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:isMobile?"100%":740}}>
            <PerformanceCalendar profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>
            <AthletePassport profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile}/>
            {(wPrefs.isHyrox||(wPrefs.splitType||"").toLowerCase().includes("run"))&&<RacePredictor profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile}/>}
            <TrainingDNA profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>

            {/* Program Progress Card */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Current Program</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,lineHeight:1}}>{wPrefs.splitType||"No program set"}</div>
                  <div style={{fontSize:12,color:T.mu,marginTop:4}}>{wPrefs.equipment} · {profile?.liftExp||"Intermediate"}</div>
                </div>
                <div style={{background:`${T.fat}15`,border:`1px solid ${T.fat}30`,borderRadius:14,padding:"12px 18px",textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,color:T.fat,lineHeight:1}}>
                    {Math.min(Math.floor((new Date()-new Date(profile?.startDate||Date.now()))/(7*24*60*60*1000))+1,12)}
                  </div>
                  <div style={{fontSize:9,color:T.mu,marginTop:2}}>of 12 weeks</div>
                </div>
              </div>
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{fontSize:11,color:T.mu}}>Program progress</div>
                  <div style={{fontSize:11,color:T.fat,fontWeight:700}}>
                    {Math.round(Math.min(Math.floor((new Date()-new Date(profile?.startDate||Date.now()))/(7*24*60*60*1000))+1,12)/12*100)}%
                  </div>
                </div>
                <div style={{height:8,background:T.s3,borderRadius:4,overflow:"hidden",marginBottom:6}}>
                  <div style={{height:"100%",background:`linear-gradient(90deg,${T.prot},${T.fat})`,borderRadius:4,width:`${Math.round(Math.min(Math.floor((new Date()-new Date(profile?.startDate||Date.now()))/(7*24*60*60*1000))+1,12)/12*100)}%`,transition:"width 1s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:T.dim}}>
                  <span>Week 1</span><span>Week 6</span><span>Week 12</span>
                </div>
              </div>
            </div>

            {/* PR Tracker */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif"}}>Personal Records 🏆</div>
                <div style={{fontSize:11,color:T.mu}}>Updated every session</div>
              </div>
              {Object.keys(history).length===0
                ?<div style={{textAlign:"center",padding:"32px 0",border:`1px dashed ${T.bd}`,borderRadius:14,color:T.mu}}>
                  <div style={{fontSize:36,marginBottom:12}}>📈</div>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>No records yet</div>
                  <div style={{fontSize:12,color:T.dim,marginBottom:16}}>Build a workout and start logging sets — your PRs will appear here automatically</div>
                  <button onClick={()=>setTrainScreen("builder")} style={{padding:"10px 24px",background:T.prot,color:T.white,fontWeight:700,fontSize:14,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Build First Workout →</button>
                </div>
                :<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:10}}>
                  {Object.entries(history).slice(0,12).map(([key,sessions])=>{
                    const last=sessions[sessions.length-1];
                    const prev=sessions.length>1?sessions[sessions.length-2]:null;
                    const lastMax=Math.max(...last.sets.map(s=>parseFloat(s.weight||0)));
                    const prevMax=prev?Math.max(...prev.sets.map(s=>parseFloat(s.weight||0))):null;
                    const diff=prevMax?lastMax-prevMax:null;
                    const trend=diff?diff>0?"↑":diff<0?"↓":"→":null;
                    const tc=trend==="↑"?T.carb:trend==="↓"?"#FF4D6D":T.mu;
                    return(
                      <div key={key} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
                        {trend==="↑"&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:T.carb,borderRadius:"14px 14px 0 0"}}/>}
                        <div style={{fontSize:11,fontWeight:600,color:"#bbb",textTransform:"capitalize",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{key.replace(/_/g," ")}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                          <div>
                            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:T.prot,lineHeight:1}}>{lastMax}</div>
                            <div style={{fontSize:9,color:T.mu}}>lbs · best</div>
                          </div>
                          {trend&&<div style={{textAlign:"right"}}>
                            <div style={{fontSize:24,color:tc,fontWeight:900,lineHeight:1}}>{trend}</div>
                            {diff&&<div style={{fontSize:9,color:tc}}>{diff>0?"+":""}{diff.toFixed(1)}</div>}
                          </div>}
                        </div>
                        <div style={{marginTop:10,height:2,background:T.s3,borderRadius:1}}>
                          <div style={{height:"100%",width:`${Math.min(lastMax/500*100,100)}%`,background:T.prot,borderRadius:1}}/>
                        </div>
                        <div style={{fontSize:9,color:T.dim,marginTop:6}}>{sessions.length} session{sessions.length!==1?"s":""}</div>
                      </div>
                    );
                  })}
                </div>
              }
            </div>

            {/* Weight Trend */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"'Barlow Condensed',sans-serif"}}>Weight Trend 📊</div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{fontSize:11,color:T.mu}}>Start: <b style={{color:"#fff"}}>{profile?.startWeight||"—"} {profile?.wUnit||"lbs"}</b></div>
                  {profile?.goalWeight&&<div style={{fontSize:11,color:T.mu}}>Goal: <b style={{color:T.carb}}>{profile?.goalWeight} {profile?.wUnit||"lbs"}</b></div>}
                </div>
              </div>
              <div style={{textAlign:"center",padding:"24px",border:`1px dashed ${T.bd}`,borderRadius:12,color:T.mu,fontSize:12}}>
                <div style={{fontSize:28,marginBottom:8}}>⚖️</div>
                <div style={{fontWeight:600,marginBottom:4}}>Log daily weigh-ins in Settings</div>
                <div style={{fontSize:11,color:T.dim}}>Your weight trend graph will appear here once you start logging</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── PERFORMANCE CALENDAR ────────────────────────────────────────────────────
export function PerformanceCalendar({profile,wPrefs,user,isMobile,schedule}){
  const [workoutLogs,setWorkoutLogs]=useState([]);
  const [foodLogs,setFoodLogs]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const [selectedDay,setSelectedDay]=useState(null);

  const today=new Date();
  const year=today.getFullYear();
  const month=today.getMonth();
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  const daysInMonth=lastDay.getDate();
  const startDOW=firstDay.getDay(); // 0=Sun

  const monthStr=today.toISOString().slice(0,7);

  useEffect(()=>{
    if(!user)return;
    const monthStart=`${year}-${String(month+1).padStart(2,"0")}-01`;
    const monthEnd=`${year}-${String(month+1).padStart(2,"0")}-${String(daysInMonth).padStart(2,"0")}`;
    Promise.all([
      sb.from("workout_logs").select("date,workout").eq("user_id",user.id).gte("date",monthStart).lte("date",monthEnd),
      sb.from("food_logs").select("date,entries").eq("user_id",user.id).gte("date",monthStart).lte("date",monthEnd),
    ]).then(([{data:wl},{data:fl}])=>{
      setWorkoutLogs(wl||[]);setFoodLogs(fl||[]);setLoaded(true);
    });
  },[user]);

  const WDAYS_ABBR=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function getDOW(dateStr){return WDAYS_ABBR[new Date(dateStr+"T12:00:00").getDay()];}

  function getDayStatus(dayNum){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
    const isFuture=new Date(dateStr+"T23:59:59")>today;
    if(isFuture)return"future";
    const dow=getDOW(dateStr);
    const scheduleType=schedule?.[dow]||"rest";
    const isRestDay=scheduleType==="rest";
    const wLog=workoutLogs.find(w=>w.date===dateStr);
    const fLog=foodLogs.find(f=>f.date===dateStr);
    const didWorkout=!!wLog;
    const fEntries=fLog?.entries||[];
    const totalCals=fEntries.reduce((s,e)=>s+(e.calories||0),0);
    const macros=getDayMacros(profile?.goalCals||2000,profile?.goal||"Maintain",scheduleType,0);
    const calTarget=macros.calories;
    const protTarget=macros.protein;
    const totalProt=fEntries.reduce((s,e)=>s+(e.protein||0),0);
    const calPct=calTarget>0?totalCals/calTarget:0;
    const protPct=protTarget>0?totalProt/protTarget:0;
    const hitNutrition=fEntries.length>0&&calPct>=0.8&&calPct<=1.2&&protPct>=0.8;
    const hitTraining=isRestDay?true:didWorkout;
    if(isRestDay)return"rest";
    if(hitNutrition&&hitTraining)return"green";
    if(hitNutrition||hitTraining)return"yellow";
    return"red";
  }

  function getDayData(dayNum){
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`;
    const dow=getDOW(dateStr);
    const scheduleType=schedule?.[dow]||"rest";
    const wLog=workoutLogs.find(w=>w.date===dateStr);
    const fLog=foodLogs.find(f=>f.date===dateStr);
    const fEntries=fLog?.entries||[];
    const totalCals=Math.round(fEntries.reduce((s,e)=>s+(e.calories||0),0));
    const totalProt=Math.round(fEntries.reduce((s,e)=>s+(e.protein||0),0));
    const macros=getDayMacros(profile?.goalCals||2000,profile?.goal||"Maintain",scheduleType,0);
    const calPct=macros.calories>0?Math.round((totalCals/macros.calories)*100):0;
    const protPct=macros.protein>0?Math.round((totalProt/macros.protein)*100):0;
    return{dateStr,scheduleType,wLog,totalCals,totalProt,macros,calPct,protPct,isRestDay:scheduleType==="rest"};
  }

  const COLOR={green:"#00C9A7",yellow:"#F59E0B",red:"#FF4D6D",rest:"rgba(245,245,240,.12)",future:"rgba(245,245,240,.04)"};
  const LABEL={green:"Hit both",yellow:"Partial",red:"Missed",rest:"Rest",future:""};

  // Monthly stats
  const trainingDays=[];
  for(let d=1;d<=today.getDate();d++){
    const dow=getDOW(`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`);
    if((schedule?.[dow]||"rest")!=="rest")trainingDays.push(d);
  }
  const greenDays=trainingDays.filter(d=>getDayStatus(d)==="green").length;
  const adherence=trainingDays.length>0?Math.round((greenDays/trainingDays.length)*100):0;

  // Last month comparison (rough)
  const lastMonthStr=new Date(year,month-1,1).toLocaleDateString("en-US",{month:"long"});

  return(
    <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,lineHeight:1}}>
            {today.toLocaleDateString("en-US",{month:"long",year:"numeric"}).toUpperCase()}
          </div>
          <div style={{fontSize:11,color:T.mu,marginTop:4}}>
            {loaded?`${greenDays} green days · ${adherence}% adherence`:"Loading..."}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {[["green","🟢"],["yellow","🟡"],["red","🔴"],["rest","⚫"]].map(([s,e])=>(
            <div key={s} style={{fontSize:10,color:T.mu,display:"flex",alignItems:"center",gap:3}}>{e}<span>{LABEL[s]}</span></div>
          ))}
        </div>
      </div>

      {/* Day-of-week header */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:9,color:T.mu,fontWeight:700,letterSpacing:1,padding:"4px 0"}}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:startDOW},(_,i)=><div key={`e${i}`}/>)}
        {Array.from({length:daysInMonth},(_,i)=>{
          const dayNum=i+1;
          const status=loaded?getDayStatus(dayNum):"future";
          const isToday_=dayNum===today.getDate();
          return(
            <button key={dayNum} onClick={()=>setSelectedDay(selectedDay===dayNum?null:dayNum)}
              style={{aspectRatio:"1",background:COLOR[status],borderRadius:isMobile?6:8,border:isToday_?`2px solid #fff`:`2px solid transparent`,cursor:status==="future"?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",transition:"opacity .15s",fontFamily:"inherit"}}>
              <span style={{fontSize:isMobile?10:11,fontWeight:isToday_?900:600,color:status==="future"||status==="rest"?"rgba(245,245,240,.3)":"#fff"}}>{dayNum}</span>
              {isToday_&&<div style={{position:"absolute",bottom:2,width:4,height:4,borderRadius:"50%",background:"#fff"}}/>}
            </button>
          );
        })}
      </div>

      {/* Selected day popup */}
      {selectedDay&&loaded&&(()=>{
        const d=getDayData(selectedDay);
        const status=getDayStatus(selectedDay);
        const dateLabel=new Date(`${d.dateStr}T12:00:00`).toLocaleDateString("en-US",{month:"long",day:"numeric",weekday:"long"});
        const COLOR_STATUS={green:T.carb,yellow:"#F59E0B",red:"#FF4D6D",rest:T.mu,future:T.mu};
        return(
          <div style={{marginTop:14,background:T.s2,borderRadius:12,padding:"14px 16px",border:`1px solid rgba(245,245,240,.08)`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:13}}>{dateLabel}</div>
              <button onClick={()=>setSelectedDay(null)} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:14,padding:"0 2px",fontFamily:"inherit"}}>×</button>
            </div>
            {d.isRestDay?(
              <div style={{fontSize:12,color:T.mu}}>Rest day — no training expected.</div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{color:d.wLog?T.carb:"#FF4D6D",fontSize:13}}>{d.wLog?"✓":"✗"}</span>
                  <span style={{fontSize:12,color:"rgba(245,245,240,.8)"}}>Workout: {d.wLog?`${d.wLog.workout?.focus||"Completed"}`:status==="future"?"Upcoming":"Not logged"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{color:d.calPct>=80&&d.calPct<=120?T.carb:"#FF4D6D",fontSize:13}}>{d.calPct>=80&&d.calPct<=120?"✓":"✗"}</span>
                  <span style={{fontSize:12,color:"rgba(245,245,240,.8)"}}>Nutrition: {d.totalCals} / {d.macros.calories} kcal ({d.calPct}%)</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:d.protPct>=80?T.carb:"#FF4D6D",fontSize:13}}>{d.protPct>=80?"✓":"✗"}</span>
                  <span style={{fontSize:12,color:"rgba(245,245,240,.8)"}}>Protein: {d.totalProt} / {d.macros.protein}g ({d.protPct}%)</span>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Month summary */}
      {loaded&&trainingDays.length>0&&(
        <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.bd}`}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>
            This month: {greenDays} green days / {trainingDays.length} training days
          </div>
          <div style={{fontSize:12,color:T.mu}}>
            Adherence: {adherence}%{adherence>=80?" — great month":""}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRAINING DNA ────────────────────────────────────────────────────────────
export function TrainingDNA({profile,wPrefs,user,isMobile,schedule}){
  const [sessions,setSessions]=useState([]);
  const [foodLogs,setFoodLogs]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const dnaRef=useRef(null);
  const [sharing,setSharing]=useState(false);

  const startD=profile?.startDate?new Date(profile.startDate):new Date();
  const daysSince=Math.max(0,Math.floor((new Date()-startD)/86400000));

  useEffect(()=>{
    if(!user)return;
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);
    const cutStr=cutoff.toISOString().split("T")[0];
    Promise.all([
      sb.from("workout_logs").select("*").eq("user_id",user.id).gte("date",cutStr).order("date",{ascending:false}),
      sb.from("food_logs").select("date,entries").eq("user_id",user.id).gte("date",cutStr).order("date",{ascending:false}),
    ]).then(([{data:wl},{data:fl}])=>{
      setSessions(wl||[]);setFoodLogs(fl||[]);setLoaded(true);
    });
  },[user]);

  if(!loaded)return null;
  if(daysSince<30){
    return(
      <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:900,marginBottom:8}}>YOUR TRAINING DNA</div>
        <div style={{textAlign:"center",padding:"24px",color:T.mu}}>
          <div style={{fontSize:32,marginBottom:12}}>🧬</div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Unlocks after 30 days</div>
          <div style={{fontSize:12,color:T.dim}}>Keep training — {30-daysSince} days to go</div>
        </div>
      </div>
    );
  }

  // Score calculations
  const totalSessions=sessions.length;
  const strengthSessions=sessions.filter(w=>!w.workout?.focus?.toLowerCase().includes("run")&&w.workout?.type!=="running").length;
  const cardioSessions=sessions.length-strengthSessions;
  const strengthBias=Math.min(100,Math.round((strengthSessions/Math.max(1,totalSessions))*100*1.4));
  const enduranceBase=Math.min(100,Math.round((cardioSessions/Math.max(1,totalSessions))*100*2));
  const volumePerSession=sessions.reduce((sum,w)=>{
    let v=0;(w.workout?.exercises||[]).forEach(ex=>(ex.sets||[]).forEach(s=>{const wt=parseFloat(s.weight||0);const r=parseInt(s.reps||0);if(wt>0&&r>0)v+=wt*r;}));
    return sum+v;
  },0)/Math.max(1,totalSessions);
  const powerOutput=Math.min(100,Math.round((volumePerSession/3000)*100));
  const scheduledDays=Object.values(schedule||{}).filter(v=>v==="training").length;
  const expectedSessions=scheduledDays*4;
  const consistency=Math.min(100,Math.round((totalSessions/Math.max(1,expectedSessions))*100));
  const daysWithFood=foodLogs.filter(f=>f.entries?.length>0).length;
  const nutritionAdherence=Math.min(100,Math.round((daysWithFood/30)*100));
  const recoveryEfficiency=Math.min(100,Math.max(0,Math.round(consistency*0.7+powerOutput*0.3)));

  // Athlete type
  const isIronDiscipline=consistency>85;
  const isHybrid=strengthBias>60&&enduranceBase>60;
  const isStrength=strengthBias>70&&enduranceBase<50;
  const isEndurance=enduranceBase>70&&strengthBias<50;
  const allLow=strengthBias<50&&enduranceBase<50&&powerOutput<50&&consistency<50;
  const athleteType=allLow?"ATHLETE IN PROGRESS":isIronDiscipline?"IRON DISCIPLINE ATHLETE":isHybrid?"HYBRID ATHLETE":isStrength?"STRENGTH ATHLETE":isEndurance?"ENDURANCE ATHLETE":"BALANCED ATHLETE";

  const metrics=[
    {label:"Strength Bias",score:strengthBias},
    {label:"Endurance Base",score:enduranceBase},
    {label:"Power Output",score:powerOutput},
    {label:"Recovery Efficiency",score:recoveryEfficiency},
    {label:"Consistency",score:consistency},
    {label:"Nutrition Adherence",score:nutritionAdherence},
  ];
  const highest=metrics.reduce((a,b)=>a.score>b.score?a:b);
  const lowest=metrics.reduce((a,b)=>a.score<b.score?a:b);
  const RECS={
    "Strength Bias":"Add one more strength day per week to compound your gains.",
    "Endurance Base":"Schedule a weekly long run to build your aerobic engine.",
    "Power Output":"Prioritize heavy compound lifts — squat, deadlift, press.",
    "Recovery Efficiency":"Build a deload week every 4th week to reset adaptation.",
    "Consistency":"Focus on showing up — frequency matters more than intensity.",
    "Nutrition Adherence":"Log food every day this week — even estimates count.",
  };

  function barColor(score){return score>=75?"#00C9A7":score>=50?"#F59E0B":"#FF4D6D";}

  async function shareDNA(){
    if(!dnaRef.current)return;
    setSharing(true);
    try{
      const html2canvas=(await import("html2canvas")).default;
      const canvas=await html2canvas(dnaRef.current,{backgroundColor:"#060D1A",scale:2,useCORS:true,logging:false});
      canvas.toBlob(async blob=>{
        if(!blob)return;
        const file=new File([blob],"training-dna.png",{type:"image/png"});
        if(navigator.share&&navigator.canShare?.({files:[file]})){
          await navigator.share({files:[file],title:"My Training DNA",text:"My Coach Macro Training DNA"});
        }else{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="training-dna.png";a.click();URL.revokeObjectURL(url);}
      });
    }catch(e){console.error("[shareDNA]",e);}
    setSharing(false);
  }

  return(
    <div>
      <div ref={dnaRef} style={{background:"#060D1A",border:"1px solid rgba(245,245,240,.1)",borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
        <div style={{position:"absolute",display:"none"}}></div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,letterSpacing:.5}}>TRAINING DNA</div>
            <div style={{fontSize:12,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{athleteType}</div>
          </div>
          <div style={{fontSize:10,color:T.mu,fontFamily:"'DM Mono',monospace",textAlign:"right"}}>LAST 30 DAYS<br/>{totalSessions} sessions</div>
        </div>
        {metrics.map(({label,score})=>(
          <div key={label} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,color:"rgba(245,245,240,.7)"}}>{label}</span>
              <span style={{fontSize:12,fontWeight:700,color:barColor(score)}}>{score}</span>
            </div>
            <div style={{height:6,background:"rgba(245,245,240,.08)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${score}%`,background:barColor(score),borderRadius:3,transition:"width 1s ease"}}/>
            </div>
          </div>
        ))}
        <div style={{marginTop:18,borderTop:"1px solid rgba(245,245,240,.08)",paddingTop:14,display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:12,color:"rgba(245,245,240,.6)"}}><span style={{color:"#00C9A7",fontWeight:700}}>Your strength:</span> {highest.label} ({highest.score})</div>
          <div style={{fontSize:12,color:"rgba(245,245,240,.6)"}}><span style={{color:"#FF4D6D",fontWeight:700}}>Your gap:</span> {lowest.label} ({lowest.score})</div>
          <div style={{fontSize:12,color:"rgba(245,245,240,.6)"}}><span style={{color:T.prot,fontWeight:700}}>Recommended:</span> {RECS[lowest.label]}</div>
        </div>
      </div>
      <button onClick={shareDNA} disabled={sharing} style={{marginTop:10,width:"100%",padding:"13px",background:T.s3,border:`1px solid ${T.bd}`,color:"#fff",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:"uppercase",opacity:sharing?.6:1}}>
        {sharing?"Generating...":"Share DNA"}
      </button>
    </div>
  );
}

// ─── RACE PREDICTOR ──────────────────────────────────────────────────────────
export function RacePredictor({profile,wPrefs,user,isMobile}){
  const [sessions,setSessions]=useState([]);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    if(!user)return;
    sb.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(150).then(({data})=>{
      setSessions(data||[]);setLoaded(true);
    });
  },[user]);

  const startD=profile?.startDate?new Date(profile.startDate):new Date();
  const daysSince=Math.max(0,Math.floor((new Date()-startD)/86400000));
  const weekNum=Math.floor(daysSince/7)+1;

  // Extract run sessions and parse duration/distance from program-logged data
  const runLogs=sessions.filter(w=>w.workout?.focus?.toLowerCase().includes("run")||w.workout?.type==="running"||(w.workout?.exercises||[]).some(e=>e.name?.toLowerCase().includes("run")));

  // Parse pace from logged sets: reps field is "40 min", exercise name gives type
  function parseMins(str){const m=String(str||"").match(/(\d+)/);return m?parseInt(m[1]):null;}

  // Build pace estimates from logged sessions
  // We use program-expected distances for known workout types
  const DIST_BY_TYPE={"easy run":4,"tempo run":5,"long run":8,"intervals":4,"progression run":5,"recovery run":3,"hill run":4,"race pace":5};
  const paceSamples=[];
  runLogs.forEach(w=>{
    (w.workout?.exercises||[]).forEach(ex=>{
      const nm=ex.name?.toLowerCase()||"";
      const distGuess=Object.entries(DIST_BY_TYPE).find(([k])=>nm.includes(k))?.[1];
      if(!distGuess)return;
      (ex.sets||[]).filter(s=>s.done).forEach(s=>{
        const mins=parseMins(s.reps);
        if(mins&&mins>5&&mins<300){
          paceSamples.push({type:nm,mins,dist:distGuess,pace:mins/distGuess,isEasy:nm.includes("easy"),isTempo:nm.includes("tempo")||nm.includes("interval")});
        }
      });
    });
  });

  const easyPaces=paceSamples.filter(p=>p.isEasy).map(p=>p.pace);
  const tempoPaces=paceSamples.filter(p=>p.isTempo).map(p=>p.pace);
  const longestRun=paceSamples.length>0?Math.max(...paceSamples.map(p=>p.dist)):0;
  const last4wkSessions=sessions.filter(w=>{const d=new Date(w.date);return(new Date()-d)/86400000<=28;});
  const weeklyMiles=Math.round((paceSamples.filter(p=>{const s=sessions.find(w=>(w.workout?.exercises||[]).some(e=>e.name?.toLowerCase()===p.type));return s&&(new Date()-new Date(s.date))/86400000<=28;}).reduce((a,p)=>a+p.dist,0))/4);

  // Fallback estimates from program week if not enough logged data
  const PROG_PACES={
    "Couch to 5K":{easy:13,tempo:11},"Sub-25 5K":{easy:11,tempo:8.5},"10K Beginner":{easy:12,tempo:10},
    "10K Sub-50":{easy:11,tempo:8.5},"Half Marathon Beginner":{easy:12,tempo:10},"Half Marathon Sub-1:45":{easy:10,tempo:8},
  };
  const progName=wPrefs.runPlan||wPrefs.splitType||"";
  const fallback=PROG_PACES[progName]||{easy:11.5,tempo:9.5};
  const avgEasy=easyPaces.length>0?(easyPaces.reduce((a,b)=>a+b,0)/easyPaces.length):fallback.easy;
  const avgTempo=tempoPaces.length>0?(tempoPaces.reduce((a,b)=>a+b,0)/tempoPaces.length):fallback.tempo;

  function fmtTime(totalMins){
    const h=Math.floor(totalMins/60);const m=Math.floor(totalMins%60);const s=Math.round((totalMins%1)*60);
    if(h>0)return`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    return`${m}:${String(s).padStart(2,"0")}`;
  }
  function fmtPace(p){const m=Math.floor(p);const s=Math.round((p-m)*60);return`${m}:${String(s).padStart(2,"0")}/mi`;}

  const pred5k=avgTempo*3.1+0.25;
  const pred10k=avgTempo*6.2+0.5;
  const predHalf=avgEasy*0.88*13.1;
  const predFull=avgEasy*0.85*26.2;

  // Goal detection
  const isHyrox=wPrefs.isHyrox;
  const goals={"Sub-25 5K":{dist:"5K",targetMin:25},"10K Sub-50":{dist:"10K",targetMin:50},"Half Marathon Sub-1:45":{dist:"HM",targetMin:105}};
  const userGoal=goals[progName];

  // Readiness
  const mileTarget=progName.includes("5K")?16:progName.includes("Half")||progName.includes("10K")?28:20;
  const readiness=Math.min(100,Math.round((Math.min(weeklyMiles||1,mileTarget)/mileTarget*0.4+(Math.min(longestRun||1,(progName.includes("Half")?13:progName.includes("10K")?7:4))/(progName.includes("Half")?13:progName.includes("10K")?7:4))*0.6)*100));

  // Hyrox estimate
  const hyroxFTP=avgTempo||9.5;
  const kmTime=hyroxFTP*(1000/1609.34); // min/km
  const hyroxPred=8*kmTime+35; // 8 x 1km runs + 35 min for stations

  if(!loaded)return(
    <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:"24px 28px",color:T.mu,fontSize:13}}>Loading race data...</div>
  );

  return(
    <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,textTransform:"uppercase"}}>RACE PREDICTOR</div>
        <div style={{background:`${T.carb}15`,border:`1px solid ${T.carb}30`,borderRadius:20,padding:"4px 12px",fontSize:11,color:T.carb,fontWeight:700}}>{readiness}% READY</div>
      </div>
      <div style={{fontSize:11,color:T.mu,marginBottom:18}}>Based on your last {runLogs.length} logged sessions · Week {weekNum} of training</div>

      {isHyrox?(
        <div style={{background:T.s2,borderRadius:14,padding:"16px 18px",marginBottom:16}}>
          <div style={{fontSize:10,color:T.fat,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>HYROX FINISH TIME</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:40,fontWeight:900,color:"#fff",lineHeight:1}}>{fmtTime(hyroxPred)}</div>
          <div style={{fontSize:11,color:T.mu,marginTop:4}}>8 × 1km runs + station blocks + 10% fatigue buffer</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {[["5K",fmtTime(pred5k),userGoal?.dist==="5K"?`goal: ${fmtTime(userGoal.targetMin)} ${pred5k<=userGoal.targetMin?"✓ on track":"× not yet"}`:null],
            ["10K",fmtTime(pred10k),userGoal?.dist==="10K"?`goal: ${fmtTime(userGoal.targetMin)} ${pred10k<=userGoal.targetMin?"✓ on track":"× not yet"}`:null],
            ["Half",fmtTime(predHalf),null],["Marathon",fmtTime(predFull),null]
          ].map(([l,v,note])=>(
            <div key={l} style={{background:T.s2,borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>{l}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{v}</div>
              {note&&<div style={{fontSize:9,color:note.includes("✓")?T.carb:T.fat,marginTop:4,fontWeight:700}}>{note}</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{borderTop:`1px solid ${T.bd}`,paddingTop:14}}>
        <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>WHAT NEEDS TO IMPROVE</div>
        {[
          {label:"Easy pace",val:fmtPace(avgEasy),target:"10:00/mi",ok:avgEasy<=10},
          {label:"Tempo pace",val:fmtPace(avgTempo),target:"8:30/mi",ok:avgTempo<=8.5},
          {label:"Long run",val:`${Math.round(longestRun)} mi`,target:progName.includes("Half")?"13 mi":"7 mi",ok:longestRun>=(progName.includes("Half")?13:7)},
          {label:"Weekly mileage",val:`${weeklyMiles||"<1"} mi`,target:`${mileTarget} mi`,ok:(weeklyMiles||0)>=mileTarget},
        ].map(({label,val,target,ok})=>(
          <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid rgba(245,245,240,0.04)`}}>
            <span style={{fontSize:12,color:T.mu}}>{ok?"→":"→"} {label}</span>
            <span style={{fontSize:12,fontWeight:700,color:ok?T.carb:"#fff"}}>{val} <span style={{fontSize:10,color:T.mu,fontWeight:400}}>/ {target}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ATHLETE PASSPORT ────────────────────────────────────────────────────────
export function AthletePassport({profile,wPrefs,user,isMobile}){
  const [stats,setStats]=useState(null);
  const [sharing,setSharing]=useState(false);
  const passportRef=useRef(null);

  useEffect(()=>{
    if(!user)return;
    sb.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:true}).then(({data})=>{
      if(!data||data.length===0){setStats({workouts:0,volume:0,longestStreak:0,prsThisMonth:0,programs:1});return;}
      const workouts=data.length;
      // total volume
      let volume=0;
      data.forEach(row=>{
        (row.workout?.exercises||[]).forEach(ex=>{
          (ex.sets||[]).forEach(s=>{
            const w=parseFloat(s.weight||0);const r=parseInt(s.reps||0);
            if(w>0&&r>0)volume+=w*r;
          });
        });
      });
      // longest streak
      const dates=[...new Set(data.map(r=>r.date))].sort();
      let longest=1,cur=1;
      for(let i=1;i<dates.length;i++){
        const diff=(new Date(dates[i])-new Date(dates[i-1]))/86400000;
        if(diff===1){cur++;longest=Math.max(longest,cur);}
        else cur=1;
      }
      // PRs this month
      const thisMonth=new Date().toISOString().slice(0,7);
      const prevData=data.filter(r=>r.date<thisMonth+"-01");
      const currData=data.filter(r=>r.date.startsWith(thisMonth));
      const prevMaxes={};
      prevData.forEach(row=>{
        (row.workout?.exercises||[]).forEach(ex=>{
          const k=ex.name?.toLowerCase();if(!k)return;
          (ex.sets||[]).forEach(s=>{const w=parseFloat(s.weight||0);if(w>0)prevMaxes[k]=Math.max(prevMaxes[k]||0,w);});
        });
      });
      const prsSet=new Set();
      currData.forEach(row=>{
        (row.workout?.exercises||[]).forEach(ex=>{
          const k=ex.name?.toLowerCase();if(!k)return;
          (ex.sets||[]).forEach(s=>{const w=parseFloat(s.weight||0);if(w>0&&w>(prevMaxes[k]||0))prsSet.add(k);});
        });
      });
      const startD=profile?.startDate?new Date(profile.startDate):new Date();
      const daysSince=Math.max(0,Math.floor((new Date()-startD)/86400000));
      const programs=Math.max(1,Math.floor(daysSince/84)+1);
      setStats({workouts,volume:Math.round(volume),longestStreak:longest,prsThisMonth:prsSet.size,programs});
    });
  },[user]);

  async function sharePassport(){
    if(!passportRef.current)return;
    setSharing(true);
    try{
      const html2canvas=(await import("html2canvas")).default;
      const canvas=await html2canvas(passportRef.current,{backgroundColor:"#060D1A",scale:2,useCORS:true,logging:false});
      canvas.toBlob(async blob=>{
        if(!blob)return;
        const file=new File([blob],"athlete-passport.png",{type:"image/png"});
        if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
          await navigator.share({files:[file],title:"My Athlete Passport",text:"Check out my Coach Macro stats!"});
        }else{
          const url=URL.createObjectURL(blob);
          const a=document.createElement("a");a.href=url;a.download="athlete-passport.png";a.click();
          URL.revokeObjectURL(url);
        }
      });
    }catch(e){console.error("[sharePassport] error:",e);}
    setSharing(false);
  }

  const memberSince=profile?.startDate?new Date(profile.startDate).toLocaleDateString("en-US",{month:"short",year:"numeric"}):"—";
  const athleteType=wPrefs.isHyrox&&wPrefs.isHybrid?"HYBRID ATHLETE":wPrefs.isHyrox?"HYROX ATHLETE":wPrefs.isHybrid?"HYBRID ATHLETE":(wPrefs.splitType||"").toLowerCase().includes("run")?"ENDURANCE ATHLETE":"STRENGTH ATHLETE";
  const firstName=(profile?.name||"ATHLETE").split(" ")[0].toUpperCase();
  const refCount=profile?.referralCount||0;
  const isPro=!!profile?.is_pro;
  const refBadge=getReferralBadge(refCount);
  const watermarkText=refBadge||(isPro?"PRO":athleteType.split(" ")[0]);

  return(
    <div>
      <div ref={passportRef} style={{background:"#060D1A",border:"1px solid rgba(245,245,240,0.12)",borderRadius:20,padding:isMobile?"20px 18px":"28px 32px",fontFamily:"'Barlow Condensed',sans-serif",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${T.prot},${T.fat},${T.carb})`}}/>
        <div style={{position:"absolute",bottom:44,right:isMobile?-8:-12,fontSize:isMobile?72:90,fontWeight:900,color:"rgba(245,245,240,0.04)",letterSpacing:-2,lineHeight:1,pointerEvents:"none",userSelect:"none",fontFamily:"'Barlow Condensed',sans-serif",zIndex:0}}>{watermarkText}</div>
        <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative",zIndex:1}}>
          <div>
            <div style={{fontSize:isMobile?32:40,fontWeight:900,letterSpacing:1,color:"#fff",lineHeight:1}}>{firstName}</div>
            <div style={{fontSize:12,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginTop:2}}>{athleteType}</div>
          </div>
          {(isPro||refBadge)&&<div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end",paddingTop:4}}>
            {isPro&&<Badge type="PRO"/>}
            {refBadge&&<Badge type={refBadge}/>}
          </div>}
        </div>
        <div style={{height:1,background:"rgba(245,245,240,0.1)",marginBottom:16}}/>
        {stats?[
          ["Programs completed",stats.programs],
          ["Workouts logged",stats.workouts.toLocaleString()],
          ["Volume lifted",stats.volume>0?stats.volume.toLocaleString()+" lbs":"Logging..."],
          ["Longest streak",stats.longestStreak+" days"],
          ["PRs this month",stats.prsThisMonth],
        ].map(([l,v])=>(
          <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(245,245,240,0.06)"}}>
            <span style={{fontSize:13,color:"rgba(245,245,240,0.6)",fontFamily:"'Barlow',sans-serif"}}>{l}</span>
            <span style={{fontSize:isMobile?20:24,fontWeight:900,color:"#fff",lineHeight:1}}>{v}</span>
          </div>
        )):<div style={{fontSize:12,color:T.mu,padding:"12px 0"}}>Loading stats...</div>}
        <div style={{height:1,background:"rgba(245,245,240,0.1)",marginTop:16,marginBottom:14}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:10,color:"rgba(245,245,240,0.35)",letterSpacing:2,textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>COACH MACRO ATHLETE</div>
          <div style={{fontSize:10,color:"rgba(245,245,240,0.35)",letterSpacing:1,fontFamily:"'DM Mono',monospace"}}>{memberSince.toUpperCase()}</div>
        </div>
      </div>
      <button onClick={sharePassport} disabled={sharing||!stats} style={{marginTop:10,width:"100%",padding:"13px",background:T.prot,color:"#fff",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:"uppercase",opacity:sharing||!stats?0.6:1}}>
        {sharing?"Generating...":"Share Passport"}
      </button>
    </div>
  );
}

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
          {allActs.slice(0,10).map(a=>(<div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid rgba(245,245,240,0.05)`}}>
            <div style={{display:"flex",gap:10}}><div style={{fontSize:20}}>{a.icon}</div><div><div style={{fontSize:13,fontWeight:700}}>{a.title||a.type}</div><div style={{fontSize:11,color:T.mu}}>{a.sourceIcon} {a.source} · {a.date?new Date(a.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}):"—"}</div></div></div>
            <div style={{textAlign:"right"}}>{isToday(a.date)&&<div style={{background:`${T.carb}20`,color:T.carb,fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:8,marginBottom:2}}>TODAY</div>}<div style={{color:T.fat,fontWeight:800,fontSize:14}}>{a.calories} kcal</div></div>
          </div>))}
        </SectionCard>
      </div>}
    </div>
  );
}

// ─── SETTINGS SECTION ────────────────────────────────────────────────────────
export function SettingsSection({profile,wPrefs,setWPrefs,schedule,setSchedule,dayFocus,todayKey,isMobile,onSignOut,user,onPreviewBrief}) {
  const [delConfirm,setDelConfirm]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const [checkInWeight,setCheckInWeight]=useState("");
  const [checkIns,setCheckIns]=useState([]);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [settingsSaved,setSettingsSaved]=useState(false);
  const [referralStats,setReferralStats]=useState({sent:0,clicked:0});
  const [refGenerating,setRefGenerating]=useState(false);
  const [refCopied,setRefCopied]=useState(false);

  async function saveSettings(newWPrefs,newSchedule){
    if(!user)return;
    try{
      const {error}=await sb.from("profiles").upsert(
        {id:user.id,wprefs:newWPrefs||wPrefs,schedule:newSchedule||schedule},
        {onConflict:"id"}
      );
      if(error){console.error("[saveSettings] error:",error.message);}
      else{console.log("[saveSettings] saved");setSettingsSaved(true);setTimeout(()=>setSettingsSaved(false),2000);}
    }catch(e){console.error("[saveSettings] exception:",e);}
  }

  // Load weight check-ins from Supabase
  useEffect(()=>{
    if(!user)return;
    sb.from("weight_checkins").select("*").eq("user_id",user.id).order("checked_at",{ascending:true}).then(({data})=>{
      if(data)setCheckIns(data);
    });
  },[user]);

  useEffect(()=>{
    if(!user)return;
    sb.from("referrals").select("clicked").eq("referrer_id",user.id).then(({data})=>{
      if(data)setReferralStats({sent:data.length,clicked:data.filter(r=>r.clicked).length});
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

  async function doShare(method) {
    if(!profile?.referralCode||!user)return;
    setRefGenerating(true);
    try{
      const token=crypto.randomUUID();
      const {error}=await sb.from('referrals').insert({referrer_id:user.id,token});
      if(error)throw error;
      const link=`https://coach-macro.com/r/${profile.referralCode}/${token}`;
      const msg=`Hey! I use Coach Macro for my nutrition and training — it's the only app that connects both.\nHere's 2 weeks free on me:\n${link}`;
      if(method==='sms'){
        window.location.href=`sms:?body=${encodeURIComponent(msg)}`;
      }else if(method==='copy'){
        await navigator.clipboard.writeText(link);
        setRefCopied(true);
        setTimeout(()=>setRefCopied(false),2000);
      }else if(method==='share'){
        if(navigator.share){
          await navigator.share({title:'Coach Macro — 2 Weeks Free',text:msg});
        }else{
          await navigator.clipboard.writeText(link);
          setRefCopied(true);
          setTimeout(()=>setRefCopied(false),2000);
        }
      }
      // Refresh stats
      const {data}=await sb.from('referrals').select('clicked').eq('referrer_id',user.id);
      if(data)setReferralStats({sent:data.length,clicked:data.filter(r=>r.clicked).length});
    }catch(e){console.error('[doShare]',e);}
    setRefGenerating(false);
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
  const refCount=profile?.referralCount||0;
  const isPro=!!profile?.is_pro;
  const refBadge=getReferralBadge(refCount);
  const tier=getTier(refCount);

  return (
    <div style={{padding:isMobile?"12px 18px":"0",paddingBottom:isMobile?80:0}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>SETTINGS</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Your profile, program, and account</p>
      <div style={{background:T.s1,borderRadius:18,border:`1px solid ${T.bd}`,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:46,height:46,borderRadius:23,background:`${T.prot}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:T.prot,fontFamily:"'Barlow Condensed',sans-serif",flexShrink:0}}>{(profile?.name||"A")[0].toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:0}}>
            <span style={{fontSize:18,fontWeight:900,fontFamily:"'Barlow Condensed',sans-serif",color:"#fff"}}>{profile?.name||"Athlete"}</span>
            {isPro&&<Badge type="PRO"/>}
            {refBadge&&<Badge type={refBadge}/>}
          </div>
          <div style={{fontSize:12,color:T.mu,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.email||""}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>

        {/* Weight Trend Chart */}
        <SectionCard title="Weight Progress" style={{gridColumn:isMobile?"1":"1 / -1"}}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Log Today's Weight</div>
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
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:3}}>Start Weight</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{startW}<span style={{fontSize:13,color:T.mu,fontWeight:400}}> {profile.wUnit||"lbs"}</span></div>
              </div>
              {actualPoints.length>0&&<div>
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:3}}>Current</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:T.carb,lineHeight:1}}>{actualPoints[actualPoints.length-1].actual}<span style={{fontSize:13,color:T.mu,fontWeight:400}}> {profile.wUnit||"lbs"}</span></div>
              </div>}
              <div>
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:3}}>Goal Rate</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:T.prot,lineHeight:1}}>{Object.keys(rateMap).find(k=>rateMap[k]===(parseFloat(profile.goalRate?.replace("−","-"))||0))||"Maintain"}</div>
              </div>
            </div>
            <svg width="100%" height="140" viewBox="0 0 400 140" preserveAspectRatio="none" style={{overflow:"visible"}}>
              <defs>
                <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.prot} stopOpacity=".15"/><stop offset="100%" stopColor={T.prot} stopOpacity="0"/></linearGradient>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.carb} stopOpacity=".15"/><stop offset="100%" stopColor={T.carb} stopOpacity="0"/></linearGradient>
              </defs>
              {/* Grid lines */}
              {[0,25,50,75,100].map(y=>(<line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="rgba(245,245,240,0.08)" strokeWidth="0.5"/>))}
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

        <SectionCard title={`Workout Split${settingsSaved?" — ✓ Saved":""}`}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {Object.keys(SPLIT_CYCLES).map(s=>(<button key={s} onClick={()=>{const wp={...wPrefs,splitType:s};setWPrefs(wp);saveSettings(wp,null);}} style={{padding:"9px 13px",minHeight:44,borderRadius:9,border:`1.5px solid ${wPrefs.splitType===s?T.carb:T.bd}`,background:wPrefs.splitType===s?`${T.carb}15`:T.s3,color:wPrefs.splitType===s?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>))}
          </div>
        </SectionCard>

        <SectionCard title="Equipment">
          <div style={{display:"flex",gap:8}}>
            {["Full Gym","Home Gym","Bodyweight Only"].map(e=>(<button key={e} onClick={()=>{const wp={...wPrefs,equipment:e};setWPrefs(wp);saveSettings(wp,null);}} style={{flex:1,padding:"11px 6px",minHeight:44,borderRadius:9,border:`1.5px solid ${wPrefs.equipment===e?T.carb:T.bd}`,background:wPrefs.equipment===e?`${T.carb}15`:T.s3,color:wPrefs.equipment===e?T.carb:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{e}</button>))}
          </div>
        </SectionCard>

        <SectionCard title="Experience Level">
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            {[
              {v:"beginner",l:"Beginner",sub:"Less than 1 year — dumbbell-focused, lower volume",color:"#34D399"},
              {v:"intermediate",l:"Intermediate",sub:"1–3 years — barbell compounds, moderate volume",color:"#2979FF"},
              {v:"advanced",l:"Advanced",sub:"3+ years — heavy loads, high volume, advanced techniques",color:"#F87171"},
            ].map(o=>{
              const cur=(wPrefs.liftExp||profile?.liftExp||"intermediate")===o.v;
              return(
                <button key={o.v} onClick={()=>{const wp={...wPrefs,liftExp:o.v};setWPrefs(wp);saveSettings(wp,null);}} style={{textAlign:"left",padding:"13px 16px",minHeight:52,borderRadius:10,border:`1.5px solid ${cur?o.color:T.bd}`,background:cur?`${o.color}12`:T.s3,color:cur?o.color:T.mu,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",gap:3}}>
                  <span style={{fontSize:13,fontWeight:700,color:cur?o.color:"#fff"}}>{o.l}</span>
                  <span style={{fontSize:11,color:T.mu}}>{o.sub}</span>
                </button>
              );
            })}
          </div>
          <div style={{fontSize:11,color:T.dim,lineHeight:1.6}}>Exercises will update on your next session.</div>
        </SectionCard>

        <SectionCard title="Athlete Modes">
          <Toggle on={wPrefs.isHybrid} onChange={v=>{const wp={...wPrefs,isHybrid:v};setWPrefs(wp);saveSettings(wp,null);}} label="🏃 Hybrid Athlete" sub="Adds structured run blocks to training days"/>
          <Toggle on={wPrefs.isHyrox}  onChange={v=>{const wp={...wPrefs,isHyrox:v};setWPrefs(wp);saveSettings(wp,null);}}  label="🔥 Hyrox Mode" sub="Includes Hyrox station blocks"/>
        </SectionCard>

        <SectionCard title="Macro Memory">
          <Toggle on={wPrefs.macroMemory!==false} onChange={v=>{const wp={...wPrefs,macroMemory:v};setWPrefs(wp);saveSettings(wp,null);}} label="Macro Memory" sub="Pre-populates meals based on your weekly patterns"/>
          <button onClick={()=>{const wp={...wPrefs,macroMemory:true,_macroMemoryReset:Date.now()};setWPrefs(wp);saveSettings(wp,null);}} style={{marginTop:10,width:"100%",padding:"10px",background:"none",border:`1px solid ${T.bd}`,borderRadius:9,color:T.mu,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Clear my patterns</button>
        </SectionCard>

        <SectionCard title="Fuel View">
          <div style={{display:"flex",gap:8}}>
            {[["ring","Macro Ring","📊"],["budget","Body Budget","🏦"]].map(([v,l,e])=>{
              const active=(wPrefs.fuelView||"ring")===v;
              return<button key={v} onClick={()=>{const wp={...wPrefs,fuelView:v};setWPrefs(wp);saveSettings(wp,null);}} style={{flex:1,padding:"11px 6px",minHeight:44,borderRadius:9,border:`1.5px solid ${active?T.prot:T.bd}`,background:active?`${T.prot}15`:T.s3,color:active?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{e} {l}</button>;
            })}
          </div>
          <div style={{fontSize:11,color:T.dim,marginTop:8,lineHeight:1.6}}>Body Budget shows macros as a spending ledger with AI meal suggestions</div>
        </SectionCard>

        <SectionCard title="Nutrition Periodization">
          <Toggle on={!!wPrefs.nutritionPeriodization} onChange={v=>{const wp={...wPrefs,nutritionPeriodization:v};setWPrefs(wp);saveSettings(wp,null);}} label="Nutrition Periodization" sub="Automatically cycles macros across 8-week phases"/>
          <div style={{fontSize:12,color:T.mu,marginTop:10,lineHeight:1.6}}>Building (wk 1–3) → Deload (wk 4) → Performance (wk 5–7) → Mini Cut (wk 8)</div>
        </SectionCard>

        {(profile?.is_older_adult||(()=>{const a=getAge(profile?.dobYear,profile?.dobMonth,profile?.dobDay);return a!==null&&a>=65;})())&&(
          <SectionCard title="Joint Health Mode">
            <Toggle on={wPrefs.jointHealthMode!==false} onChange={v=>{const wp={...wPrefs,jointHealthMode:v};setWPrefs(wp);saveSettings(wp,null);}} label="Joint Health Mode" sub="Reduces volume, adds controlled tempo cues, removes failure training"/>
            <div style={{fontSize:12,color:T.mu,marginTop:10,lineHeight:1.6}}>Automatically applies safer exercise modifications for joint-protective training. Recommended for 65+ users.</div>
            {wPrefs.jointHealthMode!==false&&<div style={{background:"rgba(41,121,255,.07)",border:"1px solid rgba(41,121,255,.2)",borderRadius:9,padding:"10px 12px",marginTop:10}}>
              <div style={{fontSize:11,color:"rgba(41,121,255,.9)",lineHeight:1.6}}>Your sessions use 80% of standard volume with controlled tempo. For individual guidance, consult a physical therapist or exercise physiologist.</div>
              <a href="https://coach-macro.com/support" style={{fontSize:10,color:"#2979FF",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a>
            </div>}
          </SectionCard>
        )}

        <SectionCard title="Morning Brief">
          <Toggle on={wPrefs.morningBriefEnabled!==false} onChange={v=>{const wp={...wPrefs,morningBriefEnabled:v};setWPrefs(wp);saveSettings(wp,null);}} label="Enable Morning Brief" sub="Personalized daily coaching message before noon"/>
          <div style={{display:"flex",alignItems:"center",gap:12,marginTop:14}}>
            <div style={{fontSize:12,color:T.mu,flex:1}}>Brief time</div>
            <input type="time" value={wPrefs.morningBriefTime||"07:00"} onChange={e=>{const wp={...wPrefs,morningBriefTime:e.target.value};setWPrefs(wp);saveSettings(wp,null);}}
              style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:8,padding:"8px 12px",color:"#fff",fontSize:13,outline:"none",fontFamily:"inherit",colorScheme:"dark"}}/>
          </div>
          <button onClick={onPreviewBrief} style={{marginTop:12,width:"100%",padding:"11px",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:9,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Preview Today's Brief</button>
        </SectionCard>

        {(profile?.sex==="female"||wPrefs?.lastPeriodDate)&&(
          <SectionCard title="Cycle Tracking">
            {(()=>{
              const cp=getCyclePhase(wPrefs?.lastPeriodDate);
              return(
                <div>
                  <div style={{fontSize:12,color:T.mu,marginBottom:14,lineHeight:1.65}}>Track your cycle for personalized workout adaptations. We'll pre-select the right option when you tap "Adapt Now."</div>
                  {cp&&<div style={{background:`${cp.color}10`,border:`1px solid ${cp.color}25`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18}}>{cp.label.split(" ")[0]}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:cp.color}}>{cp.label}</div>
                      <div style={{fontSize:10,color:T.mu,marginTop:2}}>Cycle day {Math.floor((Date.now()-new Date(wPrefs.lastPeriodDate))/86400000)%28+1} of ~28</div>
                    </div>
                  </div>}
                  <div style={{fontSize:10,color:T.dim,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>Last Period Start Date</div>
                  <input type="date" value={wPrefs?.lastPeriodDate||""} onChange={e=>{const wp={...wPrefs,lastPeriodDate:e.target.value};setWPrefs(wp);saveSettings(wp,null);}}
                    style={{width:"100%",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:"11px 14px",color:"#fff",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
                  <div style={{fontSize:11,color:T.dim,marginTop:8,lineHeight:1.6}}>Used only to calculate your current phase. Never shared.</div>
                </div>
              );
            })()}
          </SectionCard>
        )}

        <SectionCard title="Your Profile">
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {[["Name",profile.name],["Goal",profile.goal],["Daily Target",`${profile.goalCals} kcal`],["Base TDEE",`${profile.baseTDEE} kcal`],["Start Weight",`${profile.startWeight||"—"} ${profile.wUnit||"lbs"}`],["Start Date",profile.startDate||"—"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid rgba(245,245,240,0.05)`}}><span style={{fontSize:13,color:T.mu,fontFamily:"'Barlow',sans-serif"}}>{l}</span><span style={{fontSize:13,fontWeight:600}}>{v}</span></div>))}
          </div>
        </SectionCard>

        {/* Refer a Friend */}
        {profile.referralCode&&<SectionCard title="Refer a Friend">
          {(isPro||getReferralBadge(referralStats.clicked))&&<div style={{display:"flex",alignItems:"center",gap:4,marginBottom:12,flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:T.mu,fontFamily:"'DM Mono',monospace",letterSpacing:"0.12em"}}>EARNED:</span>
            {isPro&&<Badge type="PRO"/>}
            {getReferralBadge(referralStats.clicked)&&<Badge type={getReferralBadge(referralStats.clicked)}/>}
          </div>}

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
            {[["Links Sent",referralStats.sent],["Clicked",referralStats.clicked],["Rate",referralStats.sent>0?Math.round(referralStats.clicked/referralStats.sent*100)+"%":"—"]].map(([l,v])=>(
              <div key={l} style={{background:T.s3,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:T.white,lineHeight:1}}>{v}</div>
                <div style={{fontSize:9,color:T.mu,fontFamily:"'DM Mono',monospace",letterSpacing:"0.1em",marginTop:3,textTransform:"uppercase"}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Share buttons */}
          <div style={{fontSize:10,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Share &amp; earn 2 weeks free</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {[{icon:"📱",label:"Text Message",method:"sms"},{icon:"📋",label:refCopied?"✓ Copied!":"Copy Link",method:"copy"},{icon:"↗",label:"Share",method:"share"}].map(btn=>(
              <button key={btn.method} disabled={refGenerating} onClick={()=>doShare(btn.method)}
                style={{width:"100%",padding:"12px 16px",minHeight:44,background:T.s3,border:`1px solid ${btn.method==="copy"&&refCopied?T.green:T.bd}`,borderRadius:10,color:btn.method==="copy"&&refCopied?T.green:T.white,fontWeight:700,fontSize:14,cursor:refGenerating?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10,transition:"border-color 0.2s,color 0.2s",opacity:refGenerating?0.6:1}}>
                <span style={{fontSize:18}}>{btn.icon}</span>
                <span style={{flex:1,textAlign:"left"}}>{btn.label}</span>
              </button>
            ))}
          </div>

          {/* Progress */}
          {(()=>{
            const cnt=referralStats.clicked;
            const t=getTier(cnt);
            const milestones=[1,3,5,10];
            const nextM=milestones.find(m=>m>cnt);
            return(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:10,color:T.dim,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Progress</div>
                  <div style={{fontSize:11,color:T.mu,fontFamily:"'DM Mono',monospace"}}>{cnt} click{cnt!==1?"s":""}</div>
                </div>
                {nextM?(
                  <>
                    <div style={{height:4,background:T.s3,borderRadius:2,marginBottom:8,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.min((cnt/nextM)*100,100)}%`,background:cnt>=5?"#00E676":cnt>=1?"#FFD740":T.prot,borderRadius:2,transition:"width 0.5s"}}/>
                    </div>
                    <div style={{fontSize:12,color:T.mu,marginBottom:12,lineHeight:1.5}}>
                      {t===0&&"1 person needs to click to unlock VIP status + custom icons"}
                      {t===1&&`${3-cnt} more click${3-cnt!==1?"s":""} to unlock accent colors`}
                      {t===2&&`${5-cnt} more click${5-cnt!==1?"s":""} to unlock VERIFIED status + themes`}
                      {t===3&&`${10-cnt} more click${10-cnt!==1?"s":""} to unlock dashboard customization`}
                    </div>
                  </>
                ):<div style={{fontSize:13,color:"#00E676",fontWeight:700,marginBottom:12}}>You are VERIFIED and fully unlocked. 💎</div>}
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {[
                    {badge:"VIP",minRef:1,rewards:[{l:"Custom app icons",minRef:1},{l:"Accent color themes",minRef:3}]},
                    {badge:"VERIFIED",minRef:5,rewards:[{l:"Background themes",minRef:5},{l:"Dashboard customization",minRef:10}]},
                  ].map(tb=>(
                    <div key={tb.badge} style={{background:T.s3,borderRadius:10,padding:"10px 12px",border:`1px solid ${cnt>=tb.minRef?"rgba(245,245,240,0.10)":"rgba(245,245,240,0.04)"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                        <Badge type={tb.badge}/>
                        <span style={{fontSize:10,color:T.mu,fontFamily:"'DM Mono',monospace"}}>{tb.minRef} click{tb.minRef>1?"s":""} required</span>
                      </div>
                      {tb.rewards.map(r=>{
                        const unlocked=cnt>=r.minRef;
                        const diff=r.minRef-cnt;
                        return(
                          <div key={r.l} style={{display:"flex",alignItems:"center",gap:6,marginTop:5}}>
                            <span style={{fontSize:13}}>{unlocked?"🔓":"🔒"}</span>
                            <span style={{fontSize:12,color:unlocked?T.white:T.mu}}>
                              {r.l}
                              {unlocked?<span style={{color:"#00E676",marginLeft:4,fontSize:10,fontWeight:700}}> UNLOCKED</span>:diff>0?<span style={{color:T.mu}}> — {diff} click{diff!==1?"s":""} away</span>:null}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </SectionCard>}

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
              <div key={f} style={{display:'flex',gap:10,padding:'7px 0',borderBottom:`1px solid rgba(245,245,240,0.05)`,fontSize:13,color:'#ccc',alignItems:'flex-start'}}>
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
