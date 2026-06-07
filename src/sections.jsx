import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, useReducedMotion } from 'motion/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MN, MotionArc, StaggerItem } from './motion-layer.jsx';
const _hL=()=>{Haptics.impact({style:ImpactStyle.Light}).catch(()=>{});};
const _hM=()=>{Haptics.impact({style:ImpactStyle.Medium}).catch(()=>{});};
import AthletePassportComponent from "./components/AthletePassport.jsx";
import ReactDOM from "react-dom";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, SPLIT_CYCLES, FOCUS_MUSCLES, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, MuscleMap, FAQItem, BodyFigure,
  calcTDEE, lookupBarcode, useCountUp, autoFocus, getDayMacros,
  Badge, getTier, getReferralBadge,
  hap, hapMed, hapSuccess, hapPR,
  PaperCard, Pill, MusclePills,
  InfoTip, WorkoutSkeleton, ExerciseSkeleton, CardSkeleton, EmptyState,
  GOCLUB_REDESIGN } from "./components.jsx";
import { showToast } from "./utils/toast.js";
import { sb, ai, streamAI } from "./client.js";
import { track, EVENTS, trackError, setAnalyticsEnabled } from "./services/analytics.js";
import { getWorkoutForDay, GVT_OVERLAY, PROGRAMS_BY_DAYS, GLUTE_PROGRAMS, PROGRAM_LIBRARY } from "./programs.js";
import { getProgramForUser, getTodayRunWorkout, buildRunEngineInputs, getRunWeek, RUN_SESSION_TITLE, deriveDayModality, getTodayHyroxWorkout, getTodayHybridWorkout, RUNNING_PROGRAMS, HYROX_PROGRAM, HYBRID_PROGRAMS, getSkillVariant } from "./running_programs.js";
import { getHyroxPhase } from "./services/hyroxPeriodisationService.js";
import { getRunningPhase } from "./services/runningPeriodisationService.js";
import { getStrengthPhase } from "./services/strengthPeriodisationService.js";
import { getEquipmentExercise, applyEquipmentToWorkout, getSwapOptions, EXERCISE_MUSCLE_GROUP } from "./exercise_database.js";
import { getPacesFromTime, resolvePaceTokens, computeGoalPace, formatRaceTime, getRacePredictions, enrichRunSession, parseTimeInput } from "./utils/runningPaces.js";
import { renderWithPaces } from "./services/paceService.js";
import { buildAdaptiveSession } from "./services/adaptiveSessionService.js";
import { shouldRunAnalysis, runWeeklyAnalysis } from "./services/adaptiveAnalysisService.js";
import { getTodayCheckin, getRecoveryData } from "./services/recoveryService.js";
import { getWeatherPaceAdjustment, applyWeatherToPaces } from "./services/weatherService.js";
import { scoreReadiness, getReadinessTier, READINESS_CONFIG, applyWeightMod, getCyclePhase, isPriorityExercise, applyMobilitySubstitutions, getCoachingStyle, getLifeFactorMod } from "./utils/ait.js";
import { lifeStageModifier, ACL_PREHAB, isLegDay, getPostpartumPhase, isCalorieFreeMode, getConsistencyScore, showConsistencyScore, getCycleNutrition } from "./utils/female.js";
import { getAge, getAgeAppropriateProgram, applyOlderAdultProgram, HEALTH_CONDITIONS_SAFETY } from "./utils/safety.js";
import { ExerciseDetailModal } from "./ExerciseDetailModal.jsx";
import { getThumbnailUrl } from "./services/exerciseMedia.js";
import { COOL_DOWN, GENERAL_WARMUP, MOVEMENT_PREP } from "./utils/warmupProtocols.js";
import WarmupScreen from "./components/WarmupScreen.jsx";
import FeatureStrip from "./components/FeatureStrip.jsx";
import { getAIErrorMessage } from "./utils/errors.js";
import { ProgramLibraryScreen, CustomRoutineBuilder } from "./ProgramLibrary.jsx";
import { CalendarSettingsPanel } from "./LifeAwareTraining.jsx";
import MuscleRecovery from "./components/MuscleRecovery.jsx";
import BodyMap from "./components/BodyMap.jsx";
import { getExerciseData, getMuscleColor } from "./data/exerciseMuscleMap.js";
import { getPrescription, getRestTime, getGoalLabel, getGoalContext } from "./data/prescription.js";
import { calculateTrainingDNA } from "./services/trainingDnaService.js";
import { getReferralData, getReferrals, REFERRAL_TIERS } from "./services/referralService.js";
import { getAdaptLimit, trialDaysRemaining, trialExpiringSoon, isExpired, getSubscriptionLabel } from "./utils/subscription.js";
import { purchaseMonthly, purchaseAnnual, restorePurchases } from "./services/purchaseService.js";
import { getTodaySoreness } from "./services/sorenessService.js";
import { getProgramImage } from "./data/programImages.js";
import { triggerEventUnlock } from "./services/featureUnlockService.js";
import { ACCENT_COLORS, BG_COLORS, isCompatible, isLightBg, applyTheme } from "./utils/themeService.js";
import { getOutreachPreferences, saveOutreachPreferences, TRIGGER_CATEGORIES, DEFAULT_PREFS } from "./services/outreachService.js";
import { getOptIn, setOptIn as setPeerOptInSvc } from "./services/peerComparisonService.js";


// ─── HYROX SESSION ENRICHER ───────────────────────────────────────────────────
function enrichHyroxDesc(text, hyroxProfile) {
  if (!hyroxProfile?.stationTargets || !text) return text;
  const tgt = hyroxProfile.stationTargets;
  const fmtS = (s) => !s ? '' : `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  return text
    .replace(/\bsled push\b/gi,  (m) => tgt.sled_push?.goal  ? `${m} (target: ${fmtS(tgt.sled_push.goal)})` : m)
    .replace(/\bsled pull\b/gi,  (m) => tgt.sled_pull?.goal  ? `${m} (target: ${fmtS(tgt.sled_pull.goal)})` : m)
    .replace(/\bskierg\b|\bski erg\b/gi, (m) => tgt.skiErg?.goal ? `${m} (target: ${fmtS(tgt.skiErg.goal)})` : m)
    .replace(/\bwall ball/gi,    (m) => tgt.wall_balls?.goal  ? `${m} (target: ${fmtS(tgt.wall_balls.goal)})` : m)
    .replace(/\bfarmer/gi,       (m) => tgt.farmers?.goal     ? `${m} (target: ${fmtS(tgt.farmers.goal)})` : m)
    .replace(/\bsandbag/gi,      (m) => tgt.sandbag?.goal     ? `${m} (target: ${fmtS(tgt.sandbag.goal)})` : m)
    .replace(/\browingerg\b|\browing\b/gi, (m) => tgt.rowing?.goal ? `${m} (target: ${fmtS(tgt.rowing.goal)})` : m);
}

// ─── ADAPTIVE COACHING UI COMPONENTS ─────────────────────────────────────────
function AdaptiveBanner({ modifier, analysis }) {
  const [expanded,setExpanded]=React.useState(false);
  const isRecovery=modifier.label==='recovery';
  const icon=isRecovery?'🔄':'⬇️';
  const title=isRecovery?'Recovery session':'Reduced volume';
  return(
    <div onClick={()=>setExpanded(e=>!e)} style={{background:'#1a1a1a',borderLeft:'3px solid #FF3B30',borderRadius:'4px 10px 10px 4px',padding:'12px 16px',marginTop:10,cursor:'pointer'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:18,flexShrink:0}}>{icon}</span>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:16,color:'#f5f5f0',textTransform:'uppercase'}}>{title}</div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'rgba(245,245,240,0.65)',marginTop:2}}>{modifier.reasons?.join(' · ')}</div>
        </div>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.35)'}}>{expanded?'▲':'▼'}</span>
      </div>
      {expanded&&(
        <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'rgba(245,245,240,0.55)',lineHeight:1.6}}>
            Volume target: <span style={{color:'#f5f5f0'}}>{Math.round(modifier.volumeMultiplier*100)}%</span> of normal.{' '}
            Intensity: <span style={{color:'#f5f5f0'}}>{Math.round(modifier.intensityMultiplier*100)}%</span>.
          </div>
          {analysis&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'rgba(245,245,240,0.45)',marginTop:6,lineHeight:1.55}}>Weekly insight: {analysis}</div>}
        </div>
      )}
    </div>
  );
}

function WeightSuggestion({ prog }) {
  if(!prog)return null;
  const colorMap={increase:'#34C759',hold:'rgba(245,245,240,0.75)',deload:'#FF9500',new:'rgba(245,245,240,0.5)'};
  const prefixMap={increase:'↑',hold:'→',deload:'↓',new:''};
  return(
    <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:colorMap[prog.action]||'rgba(245,245,240,0.6)',marginTop:4,lineHeight:1.4}}>
      {prefixMap[prog.action]} {prog.weight?`${prog.weight}kg`:''}{prog.action==='increase'?' today':prog.action==='hold'?' (hold)':prog.action==='deload'?' (reset)':''}{prog.message?` — ${prog.message}`:''}
    </div>
  );
}

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
    week:["Lifting","Easy Run","Lifting","Rest","Lifting","Long Run","Rest"],
    notes:"Lifting and running on separate days to prevent interference. Long run on Saturday gives full Sunday recovery.",
  },
  "PPL + Hyrox":   {
    desc:"Push/Pull/Legs with 2 Hyrox simulation sessions. Race-ready in 12 weeks.",
    week:["Push","Pull","Hyrox Sim","Legs","Rest","Hyrox Race Sim","Rest"],
    notes:"Hyrox simulations on Wednesday and Saturday. Keep lifting heavy — Hyrox rewards both strength and endurance.",
  },
  "Run + Strength": {
    desc:"Run-first athlete adding strength. 3 run days + 2 lift days.",
    week:["Easy Run","Upper","Tempo","Rest","Lower","Long Run","Rest"],
    notes:"Strength sessions on non-run days. Upper/Lower split minimizes recovery interference.",
  },
  "Hyrox Specific": {
    desc:"Full Hyrox prep. 8 stations + 1km runs between each.",
    week:["Stations A","Run","Strength","Stations B","Rest","Full Race Sim","Rest"],
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
    exs=applyEquipmentToWorkout(exs?.exercises||exs||[],wPrefs.equipment||"Full Gym");
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
      <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900,marginBottom:4}}>LIFT SMARTER</div>
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
        <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"var(--condensed)",marginBottom:16}}>What kind of training?</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:12}}>
          {[
            {v:"lifting",e:<svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5v14"/><path d="M10 5v14"/><path d="M14 5v14"/><path d="M18 5v14"/><rect x="4" y="7" width="4" height="10" rx="1"/><rect x="16" y="7" width="4" height="10" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,l:"Lifting",d:"Strength training splits — build muscle and get stronger"},
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
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"var(--condensed)"}}>Choose your split</div>
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
          <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"var(--mono)"}}>{LIFTING_SPLITS[split]?.label}</div>
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
          <b style={{color:"#fff"}}>How progressive overload works:</b> Each session shows your last performance alongside the suggested increase. Hit 12+ reps → weight goes up next session. Miss → add a rep. Automatic, no math required.
        </div>
        <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1}}>
          Build Today's {todayFocus} Session →
        </button>
      </div>}

      {/* STEP 2C — Running */}
      {step==="run"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"var(--condensed)"}}>Choose your run plan</div>
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
            <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"var(--condensed)",marginBottom:10}}>When's your long run?</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {["Saturday","Sunday"].map(d=>(
                <button key={d} onClick={()=>setLongRunDay(d)} style={{padding:"10px 20px",borderRadius:9,border:`1.5px solid ${longRunDay===d?T.carb:T.bd}`,background:longRunDay===d?`${T.carb}15`:T.s2,color:longRunDay===d?T.carb:T.mu,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1}}>
            Build My {runPlanLocal} Plan →
          </button>
        </>}
      </div>}

      {/* STEP 2D — Hybrid */}
      {step==="hybrid"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"var(--condensed)"}}>Choose your hybrid template</div>
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
                    <div style={{fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.week[i]?.split(" ")[0]||"—"}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,color:T.mu,fontStyle:"italic"}}>{h.notes}</div>
            </div>
          ))}
        </div>
        {hybridTemplate&&<button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1}}>
          Build My {hybridTemplate} Plan →
        </button>}
      </div>}

      {/* STEP 2E — Glute Program Selection */}
      {step==="glute"&&<div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button onClick={()=>setStep("type")} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>← Back</button>
          <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim,fontFamily:"var(--condensed)"}}>Choose your program</div>
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
          <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"var(--mono)"}}>{split}</div>
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
        <button onClick={handleGenerate} style={{width:"100%",padding:"15px",background:T.prot,color:T.white,fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1,marginTop:4}}>
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
                <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,lineHeight:1}}>{todayFocus}</div>
                <div style={{fontSize:12,color:T.mu,marginTop:4}}>{split||runPlanLocal||hybridTemplate} · {wPrefs.equipment}</div>
              </div>
              <button onClick={()=>setStep(type==="lifting"?"exercises":type==="running"?"run":type==="glute"?"glute-preview":"hybrid")} style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:9,padding:"8px 14px",color:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>← Change</button>
            </div>

            {workoutLoading
              ?<div style={{padding:"8px 0"}}>
                <div style={{fontSize:11,color:T.dim,textAlign:"center",marginBottom:12}}>Optimizing muscle coverage · Setting progressive overload targets</div>
                <WorkoutSkeleton/>
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
                            <div style={{fontFamily:"var(--condensed)",fontSize:20,fontWeight:900,color:T.carb,lineHeight:1}}>{ex.sets}</div>
                            <div style={{fontSize:8,color:T.mu}}>sets</div>
                          </div>
                          <div style={{background:T.s2,borderRadius:8,padding:"6px 12px",textAlign:"center"}}>
                            <div style={{fontFamily:"var(--condensed)",fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{ex.reps}</div>
                            <div style={{fontSize:8,color:T.mu}}>reps</div>
                          </div>
                          {ex.weight&&<div style={{background:T.s2,borderRadius:8,padding:"6px 12px",textAlign:"center"}}>
                            <div style={{fontFamily:"var(--condensed)",fontSize:20,fontWeight:900,color:T.prot,lineHeight:1}}>{ex.weight}</div>
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
                  <button onClick={handleStartSession} style={{flex:2,padding:"13px",background:T.prot,color:T.white,fontSize:15,fontWeight:700,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1}}>▶ Start This Session →</button>
                </div>
              </>
            }
          </div>
        );
      })()}
    </div>
  );
}

// ProgramLibraryScreen is imported from ./ProgramLibrary.jsx
// Legacy CATEGORY_ORDER kept in case other code references it
const CATEGORY_ORDER=["Hypertrophy","Strength","Fat Loss & Conditioning","Running","Hyrox","Hybrid","Glute Focus"];

function _UNUSED_ProgramLibraryScreen({wPrefs,setWPrefs,profile,setTrainScreen}){
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
    .lib-cat-title{font-family:var(--condensed);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(245,245,240,.4);margin:28px 0 10px;}
    .lib-cat-title:first-child{margin-top:0;}
    .lib-card{background:rgba(var(--accent-rgb),0.03);border:1px solid rgba(var(--accent-rgb),0.07);border-radius:10px;padding:16px;margin-bottom:10px;display:flex;flex-direction:column;gap:8px;}
    .lib-card.lib-current{border-color:rgba(var(--accent-rgb),.4);background:rgba(var(--accent-rgb),.06);}
    .lib-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
    .lib-card-name{font-family:var(--condensed);font-size:18px;font-weight:700;letter-spacing:.01em;}
    .lib-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;}
    .lib-badge{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;padding:3px 7px;border-radius:4px;background:rgba(var(--accent-rgb),0.07);color:rgba(245,245,240,.55);}
    .lib-badge.beg{background:rgba(52,211,153,.12);color:#34D399;}
    .lib-badge.int{background:rgba(251,191,36,.12);color:#FBbF24;}
    .lib-badge.adv{background:rgba(248,113,113,.12);color:#F87171;}
    .lib-best{font-size:12px;color:rgba(245,245,240,.5);line-height:1.5;}
    .lib-switch-btn{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:9px 14px;border-radius:7px;border:1.5px solid rgba(var(--accent-rgb),.5);background:rgba(var(--accent-rgb),.1);color:var(--red);cursor:pointer;white-space:nowrap;font-family:inherit;transition:background .15s,border-color .15s;}
    .lib-switch-btn:hover{background:rgba(var(--accent-rgb),.2);border-color:var(--red);}
    .lib-current-badge{font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--red);padding:9px 14px;border-radius:7px;border:1.5px solid rgba(var(--accent-rgb),.3);background:rgba(var(--accent-rgb),.06);}
    .lib-soon{font-size:11px;font-weight:700;letter-spacing:.08em;color:rgba(245,245,240,.25);padding:9px 14px;border-radius:7px;border:1.5px solid rgba(var(--accent-rgb),0.07);background:rgba(var(--accent-rgb),0.03);}
    .lib-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
    .lib-modal{background:#0d0d0d;border:1px solid rgba(var(--accent-rgb),0.12);border-radius:14px 14px 0 0;padding:28px 24px 36px;max-width:480px;width:100%;}
    .lib-modal h3{margin:0 0 8px;font-family:var(--condensed);font-size:22px;font-weight:800;letter-spacing:.02em;}
    .lib-modal p{margin:0 0 24px;font-size:13px;color:rgba(245,245,240,.55);line-height:1.6;}
    .lib-modal-btns{display:flex;flex-direction:column;gap:10px;}
    .lib-confirm-btn{font-size:14px;font-weight:700;letter-spacing:.06em;padding:14px;border-radius:9px;border:none;background:var(--red);color:#fff;cursor:pointer;font-family:inherit;}
    .lib-cancel-btn{font-size:14px;font-weight:600;padding:14px;border-radius:9px;border:1.5px solid rgba(var(--accent-rgb),0.1);background:transparent;color:rgba(245,245,240,.5);cursor:pointer;font-family:inherit;}
    .lib-fav-row{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,77,109,.05);border:1px solid rgba(255,77,109,.15);border-radius:9px;margin-bottom:6px;}
    .lib-fav-name{font-size:13px;font-weight:600;color:#fff;display:flex;align-items:center;gap:8px;}
    .lib-fav-group{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(245,245,240,.35);}
    .lib-fav-remove{font-size:11px;color:rgba(245,245,240,.3);background:none;border:none;cursor:pointer;font-family:inherit;padding:4px 8px;border-radius:6px;}
    .lib-fav-remove:hover{color:rgba(255,77,109,.7);background:rgba(255,77,109,.08);}
    .lib-fav-section{margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid rgba(var(--accent-rgb),0.06);}
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
const PAIN_LOCATIONS = [
  {id:'shoulder',label:'SHOULDER'},{id:'chest',label:'CHEST'},{id:'back',label:'BACK'},
  {id:'elbow',label:'ELBOW'},{id:'wrist',label:'WRIST'},{id:'hip',label:'HIP'},
  {id:'knee',label:'KNEE'},{id:'ankle',label:'ANKLE'},{id:'lower_back',label:'LOWER BACK'},
  {id:'neck',label:'NECK'},{id:'quad',label:'QUAD'},{id:'hamstring',label:'HAMSTRING'},
];

const INJURY_CONFLICT_MAP = {
  shoulder:['push','upper','pull'],chest:['push','upper'],back:['pull','upper'],
  elbow:['push','pull','upper'],wrist:['push','pull','upper'],hip:['legs','lower'],
  knee:['legs','lower'],quad:['legs','lower'],hamstring:['legs','lower'],
  lower_back:['legs','lower','pull'],neck:['pull','upper'],ankle:['legs','lower'],
};

const FORM_COACHING = {
  shoulder:{
    bench_press:{
      likely_cause:"Elbow flare past 90 degrees creates anterior shoulder impingement.",
      fix:["Tuck elbows to 45-75 degrees — not flared out wide.","Retract your shoulder blades before unracking the bar.","Think about 'bending the bar' to engage lats and protect the shoulder.","Reduce weight by 30% and rebuild the pattern."],
      avoid:["Wide grip bench","Dips until pain-free","Behind-neck pressing"],
    },
    overhead_press:{
      likely_cause:"Shoulder impingement from insufficient thoracic mobility or internal rotation.",
      fix:["Grip slightly wider than shoulder width — not too narrow.","Press in a slight forward arc not straight up.","Add thoracic extensions over a foam roller before pressing.","Try a dumbbell variation — more forgiving on the joint."],
      avoid:["Behind-neck press","Upright rows","Lateral raises with internal rotation"],
    },
    pull_up:{
      likely_cause:"Shoulder not packed at the bottom of the movement.",
      fix:["Dead hang first — feel your shoulder blades pull apart.","Before pulling: depress and retract the scapula slightly.","Lead with the chest not the chin.","Reduce range if pain occurs at full extension."],
      avoid:["Kipping pull-ups","Behind-neck pull-downs"],
    },
  },
  knee:{
    squat:{
      likely_cause:"Knee tracking issue — valgus collapse (caving in) or anterior knee stress from forward lean.",
      fix:["Check: knee should track over second toe throughout.","If knees cave: glutes aren't firing. Do 2 sets clamshells before squatting.","If pain is front of knee: reduce forward lean, push hips back more at the start.","Reduce weight 30% and focus on knee tracking before adding load back."],
      avoid:["Full depth until pain-free","Leg press with feet low on the platform"],
    },
    lunges:{
      likely_cause:"Front knee tracking past toes or lateral instability.",
      fix:["Take a longer stride — front shin should be vertical or close to it.","Drive through the heel of the front foot.","If lateral pain: single leg work is exposing a hip weakness — add lateral band walks."],
      avoid:["Decline lunges","High-step lunges"],
    },
  },
  lower_back:{
    deadlift:{
      likely_cause:"Lumbar flexion under load (rounding) or hips shooting up faster than shoulders.",
      fix:["STOP immediately. Lower back sharp pain on deadlift is a serious warning sign.","Film from the side. Your hips and shoulders must rise at exactly the same rate.","If hips shoot up first you are good-morning-ing the weight — dangerous pattern.","Reduce weight 40% and focus on maintaining neutral spine throughout the entire rep.","Romanian deadlift with light weight to rebuild the hip hinge pattern."],
      avoid:["ANY loaded spinal flexion","Sit-ups or crunches","Good mornings"],
      escalate:true,
    },
    squat:{
      likely_cause:"Butt wink (lumbar flexion at the bottom) or anterior pelvic tilt.",
      fix:["Check your squat depth — only go as deep as you can maintain neutral spine.","Hip flexor tightness causes butt wink — add hip flexor stretches to every warm-up.","Box squat to a safe depth to rebuild the pattern.","Reduce weight significantly and treat this as a technique session."],
      avoid:["Below parallel until mobility improves","High bar squat if low bar feels better"],
    },
  },
  elbow:{
    bicep_curl:{
      likely_cause:"Medial epicondylitis (golfer's elbow) from supination under load.",
      fix:["Switch to hammer curls — neutral grip reduces medial elbow stress.","Reduce weight and slow the eccentric to 3 seconds.","Avoid full supination at the top until pain-free."],
      avoid:["Barbell curls","Reverse curls","Wrist curls"],
    },
    tricep_extension:{
      likely_cause:"Lateral epicondylitis (tennis elbow) or olecranon impingement.",
      fix:["Switch to pushdown with rope attachment — less elbow stress than bar.","Keep slight bend at the bottom — do not fully lock out.","Reduce weight 30%."],
      avoid:["Skull crushers","Overhead tricep extension","Full lockout on any press"],
    },
  },
};

function affectsToday(painLocation, todayFocus) {
  const conflicts = INJURY_CONFLICT_MAP[painLocation] || [];
  const focus = (todayFocus || '').toLowerCase();
  return conflicts.some(c => focus.includes(c));
}

function findRescheduleDay(schedule, todayKey) {
  const ORDER = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const todayIdx = ORDER.indexOf(todayKey);
  for (let i = todayIdx + 1; i < ORDER.length; i++) {
    if ((schedule[ORDER[i]] || 'rest') === 'rest') return ORDER[i];
  }
  return null;
}

function findExerciseCoaching(exerciseName, location) {
  const map = FORM_COACHING[location];
  if (!map) return null;
  const n = exerciseName.toLowerCase();
  for (const [key, data] of Object.entries(map)) {
    if (n.includes(key.replace(/_/g,' ')) || n.includes(key)) return {exercise: exerciseName, ...data};
  }
  return null;
}

const HEALTH_EXCLUSIONS = {
  bad_knees:    ['Barbell Back Squat','Barbell Front Squat','Leg Press','Box Jump','Jump Squat','Running Lunge'],
  bad_shoulders:['Overhead Press','Behind Neck Press','Upright Row','Dip'],
  bad_back:     ['Deadlift','Good Morning','Barbell Row','Sit-Up'],
  osteoporosis: ['Box Jump','Jump Squat','Burpee'],
};
const HEALTH_SUBSTITUTES = {
  bad_knees:'Leg Extension',bad_shoulders:'Cable Lateral Raise',
  bad_back:'Hip Thrust',osteoporosis:'Walking Lunge',
};
const HEALTH_NOTES = {
  heart_condition:'Keep intensity moderate — no max effort.',
  diabetes:'Monitor energy — keep session to moderate intensity.',
};
const HYROX_SUBSTITUTIONS = {
  'SkiErg':       {equipment_needed:'skierg',      substitute:'Rowing 1000m',          note:'No SkiErg — using row'},
  'Sled Push':    {equipment_needed:'sled',         substitute:'Leg Press to Failure',   note:'No sled — leg press × 20'},
  'Sled Pull':    {equipment_needed:'sled',         substitute:'Seated Cable Row × 20',  note:'No sled — cable row instead'},
  'Row':          {equipment_needed:'rowing_machine',substitute:'SkiErg 1000m',          note:'No rower — SkiErg instead'},
  'Farmers Carry':{equipment_needed:'turf_track',   substitute:'Dumbbell Carry 50m',     note:'Use heaviest dumbbells'},
};
function applyHealthConditionSubstitutions(exercises,healthConditions){
  if(!healthConditions?.length)return exercises;
  const noteMods=healthConditions
    .map(c=>HEALTH_NOTES[c])
    .filter(Boolean)
    .join(' ');
  return exercises.map(ex=>{
    for(const cond of healthConditions){
      const excluded=HEALTH_EXCLUSIONS[cond]||[];
      if(excluded.some(e=>ex.name.toLowerCase().includes(e.toLowerCase()))){
        const sub=HEALTH_SUBSTITUTES[cond];
        if(sub)return{...ex,name:sub,originalHealthName:ex.name,isHealthAdapted:true,notes:(ex.notes||"")+(noteMods?` — ${noteMods}`:"")};
        return{...ex,isHealthAdapted:true,notes:(ex.notes||"")+(noteMods?` — ${noteMods}`:"")};
      }
    }
    if(noteMods&&!ex.healthNoteAdded)return{...ex,healthNoteAdded:true,notes:(ex.notes||"")+` — ${noteMods}`};
    return ex;
  });
}
const ADAPT_CATEGORIES = [
  {id:"injury",   emoji:<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.96-1.2c.42-.52 1.2-.52 1.62 0l1.96 2.45.96-1.2c.42-.52 1.2-.52 1.62 0L17 14h4"/></svg>, label:"Injury / Pain",       options:[]},
  {id:"travel",   emoji:<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2a1 1 0 0 0-.7 1.4L3.5 11l-2 3.3a1 1 0 0 0 .2 1.2l1.8 1.8a1 1 0 0 0 1.2.2l3.3-2 3.4 2.4a1 1 0 0 0 1.4-.7z"/></svg>, label:"Traveling / No Gym",   options:["Hotel gym only","Dumbbells only","Bodyweight only","Resistance bands only"]},
  {id:"recovery", emoji:"😴", label:"Recovery & Wellness",  options:["Poor sleep (under 5 hrs)","Feeling sick","High stress","Feeling great — increase intensity"]},
  {id:"female",   emoji:<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(232,52,28,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>, label:"Female Health",        options:["Menstrual phase (reduce intensity)","Follicular phase (increase intensity)","Ovulation (peak day)","Luteal phase (maintain)"]},
  {id:"time",     emoji:<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label:"Time Constraint",      options:["Only 20 minutes","Only 30 minutes","Only 45 minutes"]},
  {id:"other",    emoji:<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.8)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>, label:"Other",                options:[]},
];


const ADAPT_CSS = `
  .adapt-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.97);z-index:300;display:flex;flex-direction:column;overflow:hidden;}
  .adapt-header{padding:20px 20px 16px;border-bottom:1px solid rgba(var(--accent-rgb),0.07);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .adapt-title{font-family:var(--condensed);font-style:italic;font-size:24px;font-weight:900;letter-spacing:.04em;}
  .adapt-close{width:36px;height:36px;border-radius:50%;border:1px solid rgba(var(--accent-rgb),0.12);background:rgba(var(--accent-rgb),0.05);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .adapt-body{flex:1;overflow-y:auto;padding:20px;}
  .adapt-cat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:20px;}
  .adapt-cat-card{background:rgba(var(--accent-rgb),0.04);border:1.5px solid rgba(var(--accent-rgb),0.08);border-radius:14px;padding:16px 14px;cursor:pointer;text-align:left;transition:all .15s;display:flex;flex-direction:column;gap:6px;font-family:inherit;}
  .adapt-cat-card.sel{border-color:rgba(var(--accent-rgb),.5);background:rgba(var(--accent-rgb),.08);}
  .adapt-cat-card:hover{background:rgba(var(--accent-rgb),0.07);}
  .adapt-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;}
  .adapt-chip{padding:9px 14px;border-radius:20px;border:1.5px solid rgba(var(--accent-rgb),0.12);background:rgba(var(--accent-rgb),0.04);color:rgba(245,245,240,.65);font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;font-family:inherit;}
  .adapt-chip.sel{border-color:var(--red);background:rgba(var(--accent-rgb),.12);color:var(--red);}
  .adapt-footer{padding:16px 20px 28px;border-top:1px solid rgba(var(--accent-rgb),0.07);flex-shrink:0;}
  .adapt-primary{width:100%;padding:15px;border:none;border-radius:12px;background:var(--red);color:#fff;font-size:15px;font-weight:700;letter-spacing:.05em;cursor:pointer;font-family:inherit;}
  .adapt-primary:disabled{opacity:.35;cursor:not-allowed;}
  .adapt-secondary{width:100%;padding:14px;border:1px solid rgba(var(--accent-rgb),0.1);border-radius:12px;background:transparent;color:rgba(245,245,240,.5);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:10px;}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

function AdaptNowModal({wPrefs, profile, todayFocus, todayExercises, adaptationsLeft, adaptationsUsed, adaptLimit, adaptResetDate, onUseAdapted, onClose, user, schedule, setSchedule, todayKey}) {
  const [screen, setScreen] = useState("categories");
  const [category, setCategory] = useState(null);
  const [subOption, setSubOption] = useState(null);
  const [customText, setCustomText] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(null);
  const [painLocation, setPainLocation] = useState(null);
  const [injurySeverity, setInjurySeverity] = useState(null);
  const [injuryLevel, setInjuryLevel] = useState(null);
  const [rescheduled, setRescheduled] = useState(null);
  const [formCoachingCards, setFormCoachingCards] = useState([]);

  const selectedCat = ADAPT_CATEGORIES.find(c => c.id === category);
  const cyclePhase = getCyclePhase(wPrefs?.lastPeriodDate || profile?.lastPeriodDate);
  const selectedReason = category === "other" ? customText.trim() : subOption;
  const canAdapt = !!(selectedReason);

  useEffect(() => {
    if (category === "female" && cyclePhase && !subOption) setSubOption(cyclePhase.adaptOption);
  }, [category]);

  async function doRunAdapt(level, location, rescheduleInfo) {
    setScreen("loading"); setErr(null);
    try {
      const adaptHealthItems=[...(profile?.conditions||[]).filter(c=>c!=="none"),...(wPrefs?.injuries||[]).filter(Boolean)];
      const adaptHealthCtx=adaptHealthItems.length>0?`\nKnown conditions/injuries: ${adaptHealthItems.join(", ")} — factor into all exercise selections.`:"";
      const GOAL_DESCRIPTIONS={build_muscle:"building muscle mass",get_stronger:"increasing strength",lose_fat:"losing body fat",recomp:"body recomposition",train_for_race:"race preparation",get_faster:"speed and power"};
      const goalDescription=GOAL_DESCRIPTIONS[profile?.goal]||(profile?.goal||"general fitness");
      let recoveryContext="No recovery data available";
      try{
        const{data:{user:authUser}}=await sb.auth.getUser();
        if(authUser){
          const{data:recoveryData}=await sb.from("muscle_recovery").select("muscle_group,recovery_percent").eq("user_id",authUser.id);
          if(recoveryData?.length>0)recoveryContext=recoveryData.map(r=>`${r.muscle_group}: ${r.recovery_percent}% recovered`).join(", ");
        }
      }catch{/* non-blocking */}

      const injuryCtx = (level && location) ? `\nINJURY DETAILS:\n  Pain location: ${location}\n  Severity level: ${level} (1=mild, 2=moderate, 3=sharp)\n  Conflicts with today's session: ${affectsToday(location, todayFocus)}\n${level===1?`  LEVEL 1 RULES:\n  - Keep all exercises but reduce load 15-20% on exercises loading ${location}\n  - Replace barbell with cable or dumbbell alternatives for affected area\n  - Add 2 mobility warm-up exercises for ${location} at session start\n  - Keep same rep ranges — do NOT remove exercises entirely`:level===2?`  LEVEL 2 RULES:\n  - REMOVE ALL exercises that directly load ${location}\n  - Replace with exercises for muscle groups NOT affected by ${location}\n  - Keep same total sets and duration — just different muscles\n  - Add a session note that the original ${todayFocus} session has been rescheduled${rescheduleInfo?.day?` to ${rescheduleInfo.day} this week`:''}`:` LEVEL 3 RULES:\n  - REMOVE ALL exercises loading ${location} and surrounding muscles\n  - Replace with safest possible alternatives far from affected area\n  - Reduce overall session intensity by 40%\n  - Add a detailed recovery coaching note`}` : '';

      const situationText = (level && location) ? `Injury — ${location.replace(/_/g,' ')} pain (level ${level}/3)` : selectedReason;

      // B1: Physical limitations
      const adaptMobilityLimitations=wPrefs?.mobilityLimitations||[];
      const adaptHealthConditions=profile?.profile_data?.healthConditions||[];
      const adaptMobilityCtx=adaptMobilityLimitations.length>0?`\n\nMOBILITY LIMITATIONS: ${adaptMobilityLimitations.join(', ')}\nNever prescribe exercises that conflict with these limitations, even as alternatives.`:'';
      const adaptHealthCondCtx=adaptHealthConditions.length>0?`\n\nHEALTH CONDITIONS: ${adaptHealthConditions.join(', ')}\nAdapt session to be safe for these conditions.${adaptHealthConditions.includes('heart_condition')?'\nKeep intensity moderate. No max effort work.':''}${adaptHealthConditions.includes('bad_knees')?'\nNo deep knee flexion or high impact.':''}`:''
      // B2: Life factors
      const adaptStress=wPrefs?.stressLevel||'medium';
      const adaptSleepQ=profile?.profile_data?.sleepQ||profile?.sleepQ||null;
      const adaptStressCtx=(adaptStress==='high'||adaptStress==='very_high')?`\n\nLIFE STRESS: ${adaptStress}\nReduce intensity and volume. Prioritise completion over performance.`:'';
      const adaptSleepCtx=(adaptSleepQ==='poor'||adaptSleepQ==='very_poor')?'\n\nSLEEP QUALITY: Poor\nReduce CNS-demanding exercises. Recommend moderate effort or active recovery.':'';
      // B3: Goal context
      const adaptGoalTimeline=profile?.profile_data?.goalTimeline||null;
      const adaptTrainingAge=wPrefs?.trainingAge||null;
      const adaptGoalTimelineCtx=(adaptGoalTimeline==='1_month'||adaptGoalTimeline==='3_months')?`\n\nGOAL URGENCY: ${adaptGoalTimeline} timeline. Consistency beats skipping.`:'';
      const adaptBegCtx=adaptTrainingAge==='new'?'\n\nTRAINING AGE: Beginner. Prioritise movement quality over load. Technique cues over weight.':'';
      // B4: Competition
      const nearestEvt=[profile?.strength_comp_date,profile?.hyrox_race_date,profile?.run_race_date].filter(Boolean).sort()[0];
      const weeksToEvt=nearestEvt?Math.floor((new Date(nearestEvt)-new Date())/(1000*60*60*24*7)):null;
      const adaptCompCtx=weeksToEvt!==null&&weeksToEvt<=4?`\n\nCOMPETITION IN ${weeksToEvt} WEEKS. Do NOT prescribe anything that risks injury or excessive fatigue. Protect for race day. Reduce volume.`:weeksToEvt!==null&&weeksToEvt<=8?`\n\nCompetition in ${weeksToEvt} weeks. Keep adaptations conservative.`:'';

      const prompt = `You are an expert personal trainer and coach.\n\nCurrent program: ${wPrefs.splitType||"General"} — ${wPrefs.liftExp||"intermediate"} level\nTraining goal: ${goalDescription}\nToday's session: ${todayFocus}\nUser situation: ${situationText}${adaptHealthCtx}${injuryCtx}${adaptMobilityCtx}${adaptHealthCondCtx}${adaptStressCtx}${adaptSleepCtx}${adaptGoalTimelineCtx}${adaptBegCtx}${adaptCompCtx}\n\nCurrent muscle recovery state:\n${recoveryContext}\n\nCurrent planned exercises:\n${JSON.stringify((todayExercises||[]).map(e=>({name:e.name,sets:e.sets,reps:e.reps,notes:e.notes})), null, 2)}\n\nPlease adapt this session for the user's situation. Return ONLY a valid JSON object with no extra text:\n{\n  "changes": [\n    { "type": "removed", "exercise": "name", "reason": "why" },\n    { "type": "replaced", "original": "name", "replacement": "name", "reason": "why" },\n    { "type": "modified", "exercise": "name", "change": "what changed", "reason": "why" }\n  ],\n  "adapted_exercises": [\n    { "name": "exercise name", "sets": 3, "reps": "10-12", "notes": "coaching note", "weight": "", "done": false }\n  ],\n  "session_note": "One sentence summary of the adaptation"\n}\n\nRules:\n- Injury: remove dangerous movements, suggest safer alternatives that work around the injury.\n- Travel/no gym: convert all barbell movements to dumbbell or bodyweight alternatives.\n- Poor recovery/sick: reduce sets by 30-40%, reduce intensity, focus on movement quality.\n- Menstrual phase: reduce volume 30%, remove heavy compound lifts, keep lighter accessory work.\n- Follicular/ovulation: keep or increase intensity — good time for PRs.\n- Time constraints: keep only the primary compound movements, cut accessories to fit the time.\n- Feeling great: add 1-2 sets to primary lifts, suggest going for a PR.\n- Recovery aware: if a muscle group being trained today is below 50% recovered, reduce its exercises by 1 set and add a note about incomplete recovery.\n- Goal aligned: adaptations must keep the session aligned with the user's training goal — a fat loss user should keep rest periods short, a strength user should keep heavy compounds even when adapting.`;

      let adaptText = '';
      const timeout = new Promise((_,rej) => setTimeout(() => rej(new Error("Adaptation timed out. Try again.")), 25000));
      await Promise.race([
        streamAI(prompt, 2000, "adapt_now", () => {}, (text) => { adaptText = text; }),
        timeout,
      ]);
      const m = adaptText.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("AI returned an unexpected response. Try again.");
      const parsed = JSON.parse(m[0]);
      if (!parsed.adapted_exercises?.length) throw new Error("No exercises in adapted plan. Try again.");
      track(EVENTS.AI_ADAPT_NOW,{reason:situationText,changes:parsed.changes?.length,exercises:parsed.adapted_exercises.length});
      setResult(parsed); setScreen("results");
    } catch(e) {
      trackError(e,"adapt_now");
      const m=getAIErrorMessage(e);
      setErr(m||"Couldn't adapt your session. Try again."); setScreen("categories");
    }
  }

  async function runAdapt() {
    if (!canAdapt) return;
    await doRunAdapt(null, null, null);
  }

  function handleInjuryLocationSelect(loc) {
    setPainLocation(loc);
    setScreen('injury-severity');
  }

  async function handleSeveritySelect(sev) {
    setInjurySeverity(sev);
    const conflicts = affectsToday(painLocation, todayFocus);
    const level = sev === 'sharp' ? 3 : (sev === 'moderate' && conflicts) ? 2 : 1;
    setInjuryLevel(level);
    if (level === 3) {
      const cards = (todayExercises || []).flatMap(ex => {
        const c = findExerciseCoaching(ex.name, painLocation);
        return c ? [c] : [];
      });
      setFormCoachingCards(cards);
      setScreen('form-coaching');
    } else {
      let rescheduleInfo = null;
      if (level === 2) {
        const rDay = findRescheduleDay(schedule || {}, todayKey || 'Mon');
        if (rDay && user) {
          const updatedSch = {...(schedule || {}), [rDay]: schedule?.[todayKey] || 'training'};
          setSchedule?.(updatedSch);
          (async()=>{try{await sb.from("profiles").upsert({id:user.id,schedule:updatedSch},{onConflict:"id"});}catch(e){console.warn('[profiles upsert schedule reschedule]',e);}})();
          rescheduleInfo = {day: rDay};
          setRescheduled(rescheduleInfo);
        }
      }
      await doRunAdapt(level, painLocation, rescheduleInfo);
    }
  }

  const ICONS = {removed:"❌", replaced:"🔄", modified:"📉"};

  if (screen === 'injury-location') return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>// WHERE DOES IT HURT?</div>
          <div className="adapt-title" style={{fontSize:22}}>SHOW US WHERE<span style={{color:"var(--accent)"}}>.</span></div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body">
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {PAIN_LOCATIONS.map(loc=>(
            <button key={loc.id} onClick={()=>handleInjuryLocationSelect(loc.id)}
              style={{background:painLocation===loc.id?"rgba(var(--accent-rgb),0.1)":"rgba(245,245,240,0.04)",border:`1px solid ${painLocation===loc.id?"rgba(var(--accent-rgb),0.3)":"rgba(245,245,240,0.08)"}`,borderRadius:10,padding:"10px",textAlign:"center",cursor:"pointer",fontFamily:"var(--mono)",fontSize:9,color:painLocation===loc.id?"var(--accent)":"#f5f5f0",fontWeight:700,letterSpacing:"0.06em",transition:"all .15s"}}>
              {loc.label}
            </button>
          ))}
        </div>
      </div>
      <div className="adapt-footer">
        <button className="adapt-secondary" onClick={()=>setScreen("categories")}>← Back</button>
      </div>
    </div>
  );

  if (screen === 'injury-severity') return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>// HOW BAD IS IT?</div>
          <div className="adapt-title" style={{fontSize:22}}>RATE THE PAIN<span style={{color:"var(--accent)"}}>.</span></div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body" style={{display:"flex",flexDirection:"column",gap:10}}>
        {[
          {id:'mild',rating:'1-4',headline:'MILD — A BIT SORE.',sub:"Dull ache or stiffness. Doesn't stop movement.",accent:"#22c55e",bg:"rgba(34,197,94,0.06)",border:"rgba(34,197,94,0.2)"},
          {id:'moderate',rating:'5-7',headline:'MODERATE — IT HURTS.',sub:"Noticeable pain that affects how you move.",accent:"#FEA020",bg:"rgba(254,160,32,0.06)",border:"rgba(254,160,32,0.2)"},
          {id:'sharp',rating:'8-10',headline:'SHARP — DURING REPS.',sub:"Pain during the movement itself. Something is wrong.",accent:"var(--accent)",bg:"rgba(var(--accent-rgb),0.06)",border:"rgba(var(--accent-rgb),0.2)"},
        ].map(s=>(
          <button key={s.id} onClick={()=>handleSeveritySelect(s.id)}
            style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:14,cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:s.accent,fontWeight:700,marginBottom:4}}>{s.rating}</div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",marginBottom:4}}>{s.headline}</div>
            <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>{s.sub}</div>
          </button>
        ))}
      </div>
      <div className="adapt-footer">
        <button className="adapt-secondary" onClick={()=>setScreen("injury-location")}>← Back</button>
      </div>
    </div>
  );

  if (screen === 'form-coaching') return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>// FORM COACHING</div>
          <div className="adapt-title">STOP. LET'S FIX THIS<span style={{color:"var(--accent)"}}>.</span></div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body">
        <div style={{fontFamily:"var(--body)",fontSize:14,color:"rgba(245,245,240,0.5)",lineHeight:1.6,marginBottom:20}}>Sharp pain during reps is your body telling you something needs to change.</div>
        {formCoachingCards.length > 0 ? formCoachingCards.map((card,ci)=>(
          <div key={ci} style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:14,padding:16,marginBottom:10}}>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",marginBottom:12}}>{card.exercise}<span style={{color:"var(--accent)"}}>.</span></div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--accent)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>// LIKELY CAUSE</div>
            <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:14}}>{card.likely_cause}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#22c55e",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>// WHAT TO DO</div>
            {(card.fix||[]).map((step,si)=>(
              <div key={si} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:8}}>
                <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(var(--accent-rgb),0.8)",fontWeight:700,flexShrink:0,lineHeight:1.5}}>{String(si+1).padStart(2,'0')}</span>
                <span style={{fontFamily:"var(--body)",fontSize:13,color:"#f5f5f0",lineHeight:1.5}}>{step}</span>
              </div>
            ))}
            {card.avoid?.length>0&&<>
              <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#FEA020",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4,marginTop:12}}>// AVOID TODAY</div>
              {card.avoid.map((a,ai)=>(
                <div key={ai} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:4}}>
                  <span style={{color:"var(--accent)",fontSize:12,flexShrink:0}}>✕</span>
                  <span style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.6)"}}>{a}</span>
                </div>
              ))}
            </>}
          </div>
        )) : (
          <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:14,padding:16,marginBottom:10}}>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",marginBottom:8}}>{(painLocation||'').replace(/_/g,' ').toUpperCase()} PAIN</div>
            <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5}}>Sharp {(painLocation||'').replace(/_/g,' ')} pain detected. The adapted session will remove all exercises loading this area and replace them with safe alternatives. Stop any exercise that worsens the pain.</div>
          </div>
        )}
        <div style={{background:"rgba(254,160,32,0.06)",border:"1px solid rgba(254,160,32,0.2)",borderRadius:10,padding:12,marginTop:4}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",lineHeight:1.6}}>This is technique guidance only. If you experience sharp or persistent pain stop training and consult a medical professional before your next session.</div>
        </div>
      </div>
      <div className="adapt-footer">
        <button className="adapt-primary" onClick={async()=>{
          let rescheduleInfo = null;
          const rDay = findRescheduleDay(schedule||{}, todayKey||'Mon');
          if (rDay && user) {
            const updatedSch = {...(schedule||{}), [rDay]: schedule?.[todayKey]||'training'};
            setSchedule?.(updatedSch);
            (async()=>{try{await sb.from("profiles").upsert({id:user.id,schedule:updatedSch},{onConflict:"id"});}catch(e){console.warn('[profiles upsert schedule adapt]',e);}})();
            rescheduleInfo = {day: rDay};
            setRescheduled(rescheduleInfo);
          }
          await doRunAdapt(3, painLocation, rescheduleInfo);
        }}>GOT IT — ADAPT SESSION →</button>
      </div>
    </div>
  );

  if (screen === "loading") return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20,padding:40}}>
        <div style={{width:52,height:52,border:"3px solid rgba(var(--accent-rgb),.15)",borderTop:"3px solid var(--red)",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
        <div style={{fontFamily:"var(--condensed)",fontSize:26,fontWeight:900}}>ADAPTING SESSION</div>
        <div style={{fontSize:13,color:"rgba(245,245,240,.45)",textAlign:"center",maxWidth:280}}>{selectedReason}</div>
      </div>
    </div>
  );

  if (screen === "results" && result) return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>ADAPTED SESSION</div>
          <div className="adapt-title">YOUR ADAPTED SESSION</div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body" style={{animation:"slideUp .3s ease"}}>
        {result.session_note&&(
          <div style={{background:"rgba(var(--accent-rgb),.06)",border:"1px solid rgba(var(--accent-rgb),.2)",borderRadius:12,padding:"14px 16px",marginBottom:18}}>
            <div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:6}}>SESSION NOTE</div>
            <div style={{fontSize:13,color:"rgba(245,245,240,.85)",lineHeight:1.65}}>{result.session_note}</div>
          </div>
        )}
        {rescheduled?.day && (
          <div style={{background:"rgba(254,160,32,0.06)",border:"1px solid rgba(254,160,32,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>// RESCHEDULED</div>
            <div style={{fontFamily:"var(--body)",fontSize:14,color:"#f5f5f0"}}>{todayFocus} moved to <strong>{rescheduled.day}</strong> this week.</div>
          </div>
        )}
        {result.changes?.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>WHAT CHANGED</div>
            {result.changes.map((c,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(var(--accent-rgb),0.05)"}}>
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
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:"rgba(var(--accent-rgb),0.03)",borderRadius:8,marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600}}>{ex.name}</span>
              <span style={{fontSize:11,color:"rgba(245,245,240,.45)",flexShrink:0,marginLeft:8}}>{ex.sets}×{ex.reps}</span>
            </div>
          ))}
        </div>
        {localStorage.getItem('__mp_exists')==='1'&&(
          <div style={{background:"rgba(254,160,32,0.08)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:10,padding:"12px 14px",marginTop:16,display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{color:"#FEA020",fontSize:14,flexShrink:0,lineHeight:1.5}}>!</span>
            <span style={{fontFamily:"var(--body)",fontSize:12,color:"rgba(245,245,240,0.8)",lineHeight:1.55}}>Your meal plan was built around your original session — today's meals may need adjusting.</span>
          </div>
        )}
      </div>
      <div className="adapt-footer">
        <button className="adapt-primary" onClick={()=>onUseAdapted(result, selectedReason)}>✓ Use This Adapted Session</button>
        <button className="adapt-secondary" onClick={onClose}>✕ Keep Original Session</button>
      </div>
    </div>
  );

  const _tier=profile?.subscription_tier||'trial';
  const isPaidPlan=_tier==='monthly'||_tier==='annual';
  const trialDays=_tier==='trial'?trialDaysRemaining(profile):null;
  const resetDisplayDate=adaptResetDate?new Date(new Date(adaptResetDate+"T00:00:00").getTime()+30*86400000).toLocaleDateString("en-US",{month:"short",day:"numeric"}):null;

  if(adaptationsLeft===0)return(
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontSize:10,color:"rgba(245,245,240,.35)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>ADAPT NOW · LIMIT REACHED</div>
          <div className="adapt-title">ADAPT YOUR SESSION</div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:16,paddingTop:40}}>
        <div style={{fontSize:40,marginBottom:4}}>⚡</div>
        {isPaidPlan?(
          <>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:24,lineHeight:1.15}}>YOU'VE USED ALL<br/>{adaptLimit} ADAPTATIONS<br/>THIS MONTH.</div>
            <div style={{fontSize:13,color:"rgba(245,245,240,.5)",lineHeight:1.65,maxWidth:280}}>{resetDisplayDate?`Your quota resets on ${resetDisplayDate}.`:"Your quota resets in the next billing cycle."}</div>
          </>
        ):(
          <>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:24,lineHeight:1.15}}>YOU'VE USED ALL<br/>{adaptLimit}<br/>ADAPTATIONS.</div>
            <div style={{fontSize:13,color:"rgba(245,245,240,.5)",lineHeight:1.65,maxWidth:280}}>Upgrade to Pro for 10 adaptations per month — plus AI meal logging, recipe generator, and more.</div>
            <button onClick={()=>{onClose();window.dispatchEvent(new CustomEvent("cm:subscription-required"));}} style={{padding:"14px 28px",background:"var(--red)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--condensed)",fontWeight:700,fontSize:15,letterSpacing:".06em",textTransform:"uppercase",cursor:"pointer",marginTop:4}}>Upgrade → Pro</button>
          </>
        )}
      </div>
      <div className="adapt-footer">
        <button className="adapt-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  return (
    <div className="adapt-overlay"><style>{ADAPT_CSS}</style>
      <div className="adapt-header">
        <div>
          <div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:2}}>ADAPT NOW · {adaptationsLeft} OF {adaptLimit} REMAINING</div>
          {trialDays!==null&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:4}}>TRIAL · {trialDays} DAY{trialDays===1?"":"S"} LEFT</div>}
          <div className="adapt-title">ADAPT YOUR SESSION</div>
        </div>
        <button className="adapt-close" onClick={onClose}>✕</button>
      </div>
      <div className="adapt-body">
        {err&&<div style={{background:"rgba(255,77,109,.1)",border:"1px solid rgba(255,77,109,.3)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:T.prot}}>{err}</div>}
        <div style={{fontSize:12,color:"rgba(245,245,240,.45)",marginBottom:18,lineHeight:1.7}}>What's happening today? We'll adapt your workout to match your situation.</div>
        <div className="adapt-cat-grid">
          {ADAPT_CATEGORIES.map(cat=>(
            <button key={cat.id} className={`adapt-cat-card${category===cat.id?" sel":""}`} onClick={()=>{
              setCategory(cat.id);
              setSubOption(null);
              if (cat.id === 'injury') setScreen('injury-location');
            }}>
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
                  style={{width:"100%",background:"rgba(var(--accent-rgb),0.04)",border:"1.5px solid rgba(var(--accent-rgb),0.12)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",boxSizing:"border-box"}}/>
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

// ─── WORKOUT COACHING COMPONENTS ─────────────────────────────────────────────

const _p2 = n => String(Math.max(0, Math.floor(n))).padStart(2, "0");

function EnhancedRestTimer({ restTimer, restActive, lastLoggedSet: lls, onSkip, onAdjust, wUnit = 'lbs' }) {
  if (!restActive || !lls) return null;
  const total = lls.restSecs || 90;
  const pct = Math.max(0, Math.min(1, restTimer / total));
  const R = 64; const C = 2 * Math.PI * R;
  const ringColor = restTimer > 15 ? T.green : restTimer > 5 ? T.fat : T.prot;

  const badge = lls.isNewPR
    ? { icon: <svg width={11} height={11} viewBox="0 0 24 24" fill={T.prot}><path d="M12 2C9.5 2 8 4.5 8 7c0 2 1 3.5 2.5 4.5C9 13 8 15 8 17h8c0-2-1-4-2.5-5.5C15 10.5 16 9 16 7c0-2.5-1.5-5-4-5z"/><rect x="9" y="19" width="6" height="3" rx="1"/></svg>, text: "New PR", color: T.prot, bg: "rgba(var(--accent-rgb),0.1)", border: "rgba(var(--accent-rgb),0.25)" }
    : lls.prevBestWeight != null && parseFloat(lls.weight) >= lls.prevBestWeight
      ? { icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={T.green} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>, text: "On track", color: T.green, bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.22)" }
      : lls.prevBestWeight != null
        ? { icon: <svg width={11} height={11} viewBox="0 0 24 24" fill="none"><circle cx={12} cy={12} r={9} stroke={T.fat} strokeWidth={2}/><path d="M12 8v4" stroke={T.fat} strokeWidth={2} strokeLinecap="round"/><circle cx={12} cy={16} r={1} fill={T.fat}/></svg>, text: "Below best", color: T.fat, bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.22)" }
        : null;

  const isLastSet = (lls.setIndex + 1) >= lls.totalSets;
  const w = parseFloat(lls.weight) || 0;

  let nextLine = null;
  if (!isLastSet) {
    if (lls.hitAllReps && lls.suggestWeight) {
      nextLine = {
        icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-7 7 7-7 7 7" stroke={T.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
        text: `Try ${lls.suggestWeight} ${wUnit} next set`,
        color: T.green,
      };
    } else if (!lls.hitAllReps) {
      nextLine = {
        icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke={T.fat} strokeWidth={2.2} strokeLinecap="round"/></svg>,
        text: `Hold at ${lls.weight} ${wUnit}`,
        color: T.fat,
      };
    } else {
      nextLine = {
        icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="rgba(245,245,240,0.45)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
        text: `Next: ${lls.nextSetWeight || lls.weight} ${wUnit} × ${lls.nextSetReps || lls.targetReps} reps`,
        color: "rgba(245,245,240,0.5)",
      };
    }
  } else if (w > 0) {
    if (lls.hitAllReps) {
      const bump = w >= 95 ? 5 : 2.5;
      const next = Math.round((w + bump) / 2.5) * 2.5;
      nextLine = {
        icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M12 19V5m-7 7 7-7 7 7" stroke={T.green} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
        text: `Try ${next} ${wUnit} next session · same reps`,
        color: T.green,
      };
    } else {
      nextLine = {
        icon: <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke={T.fat} strokeWidth={2.2} strokeLinecap="round"/></svg>,
        text: `Hold ${lls.weight} ${wUnit} next session — build the reps first`,
        color: T.fat,
      };
    }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,0.65)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:480,background:"#0b1120",borderRadius:"22px 22px 0 0",padding:"0 24px 44px",border:"1px solid rgba(var(--accent-rgb),0.08)"}}>
        <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:36,height:4,borderRadius:2,background:"rgba(245,245,240,0.12)"}}/>
        </div>

        {/* What you just did */}
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.38)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:5}}>
            Set {lls.setIndex + 1} of {lls.totalSets} complete
          </div>
          <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontStyle:"italic",fontSize:30,textTransform:"uppercase",lineHeight:1,color:"#fff"}}>
            {lls.weight ? `${lls.weight} ${wUnit} × ` : ""}{lls.reps} reps
          </div>
          {badge && (
            <div style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,padding:"4px 14px",borderRadius:20,background:badge.bg,border:`1px solid ${badge.border}`,fontFamily:"var(--mono)",fontSize:11,color:badge.color,fontWeight:700,letterSpacing:"0.05em"}}>
              {badge.icon}{badge.text}
            </div>
          )}
        </div>

        {/* Countdown ring */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:18}}>
          <div style={{position:"relative",width:160,height:160}}>
            <svg width={160} height={160} style={{transform:"rotate(-90deg)",display:"block"}}>
              <circle cx={80} cy={80} r={R} stroke="rgba(245,245,240,0.07)" strokeWidth={10} fill="none"/>
              <circle cx={80} cy={80} r={R} stroke={ringColor} strokeWidth={10} fill="none"
                strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                style={{transition:"stroke-dashoffset 1s linear, stroke 0.5s"}}
              />
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
              <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:50,lineHeight:1,color:ringColor,fontVariantNumeric:"tabular-nums",transition:"color 0.5s"}}>
                {_p2(Math.floor(restTimer / 60))}:{_p2(restTimer % 60)}
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.3)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:3,textAlign:"center",maxWidth:110,lineHeight:1.3}}>
                {lls.restReason || "Rest"}
              </div>
            </div>
          </div>
          {nextLine && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:12,padding:"8px 16px",borderRadius:10,background:"rgba(var(--accent-rgb),0.04)",border:"1px solid rgba(var(--accent-rgb),0.07)"}}>
              {nextLine.icon}
              <span style={{fontFamily:"var(--body)",fontSize:13,color:nextLine.color,lineHeight:1.4}}>{nextLine.text}</span>
            </div>
          )}
          {isLastSet && !nextLine && (
            <div style={{marginTop:12,fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.35)",letterSpacing:"0.14em",textTransform:"uppercase",textAlign:"center"}}>
              Last set — great work
            </div>
          )}
        </div>

        <div style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",fontStyle:"italic",padding:"12px 0"}}>
          Rest. Next set ready in {_p2(Math.floor(restTimer/60))}:{_p2(restTimer%60)}.
        </div>
      </div>
    </div>
  );
}

function MomentumBar({ activeWorkout, history }) {
  const score = useMemo(() => {
    if (!activeWorkout) return 0;
    let totalSets = 0, completedSets = 0, volumeWins = 0, exWithHistory = 0;
    (activeWorkout.exercises || []).forEach(ex => {
      const sets = ex.sets || [];
      totalSets += sets.length;
      const done = sets.filter(s => s.done);
      completedSets += done.length;
      if (done.length > 0) {
        const k = ex.name.toLowerCase().replace(/\s+/g, "_");
        const prev = history?.[k];
        if (prev?.length) {
          exWithHistory++;
          const prevMax = Math.max(...prev[prev.length-1].sets.map(s => parseFloat(s.weight)||0));
          const currMax = Math.max(...done.map(s => parseFloat(s.weight)||0));
          if (currMax >= prevMax) volumeWins++;
        }
      }
    });
    const compPct = totalSets > 0 ? completedSets / totalSets : 0;
    const volPct = exWithHistory > 0 ? volumeWins / exWithHistory : 0.75;
    return Math.round((compPct * 0.55 + volPct * 0.45) * 100);
  }, [activeWorkout, history]);

  const completedSets = (activeWorkout?.exercises||[]).reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  if (completedSets === 0) return null;

  const label = score >= 90 ? "Elite session" : score >= 75 ? "Strong session" : score >= 60 ? "Solid session" : "Recovery session";
  const barColor = score >= 90 ? T.green : score >= 75 ? T.fat : score >= 60 ? T.fat : T.prot;
  return (
    <div style={{padding:"10px 14px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:12,marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.38)",letterSpacing:"0.18em",textTransform:"uppercase"}}>Workout Momentum</div>
        <div style={{fontFamily:"var(--mono)",fontSize:11,color:barColor,fontWeight:700}}>{score}% — {label}</div>
      </div>
      <div style={{height:4,background:"rgba(245,245,240,0.07)",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${score}%`,background:barColor,borderRadius:2,transition:"width 0.6s ease"}}/>
      </div>
    </div>
  );
}

function PrevSessionRow({ exerciseName, history, wUnit = 'lbs' }) {
  const k = (exerciseName||"").toLowerCase().replace(/\s+/g, "_");
  const prev = history?.[k];
  if (!prev?.length) return (
    <div style={{marginBottom:10,fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.28)",letterSpacing:"0.12em",textTransform:"uppercase"}}>First time logging this exercise</div>
  );
  const last = prev[prev.length - 1];
  const sets = last.sets || [];
  if (!sets.length) return null;
  const maxW = Math.max(...sets.map(s => parseFloat(s.weight)||0));
  const reps = sets[0]?.reps;
  const dateStr = new Date(last.date).toLocaleDateString("en-US", {month:"short", day:"numeric"});
  return (
    <div style={{marginBottom:10,padding:"6px 10px",background:"rgba(245,245,240,0.03)",borderRadius:8,border:"1px solid rgba(245,245,240,0.06)"}}>
      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:2}}>Last session</div>
      <div style={{fontSize:12,color:"rgba(245,245,240,0.5)"}}>
        {maxW > 0 ? `${maxW} ${wUnit} × ` : ""}{reps} reps × {sets.length} sets
        <span style={{color:"rgba(245,245,240,0.28)",marginLeft:8}}>— {dateStr}</span>
      </div>
    </div>
  );
}

function SetFlashOverlay({ flash }) {
  if (!flash) return null;
  const cfg = {
    pr:       { bg:"rgba(var(--accent-rgb),0.18)",  border:T.prot, icon:"★",  title:"New PR!",                    color:T.prot },
    complete: { bg:"rgba(34,197,94,0.14)",  border:T.green, icon:"✓",  title:"Set complete",               color:T.green },
    missed:   { bg:"rgba(245,158,11,0.14)",  border:T.fat, icon:"-",  title:`Missed ${flash.missedCount} rep${flash.missedCount===1?"":"s"}`, color:T.fat },
  }[flash.type] || { bg:"rgba(34,197,94,0.14)", border:T.green, icon:"✓", title:"Set complete", color:T.green };
  return (
    <div style={{position:"fixed",bottom:110,left:"50%",transform:"translateX(-50%)",zIndex:9500,background:cfg.bg,border:`1px solid ${cfg.border}50`,borderRadius:16,padding:"12px 22px",display:"flex",alignItems:"center",gap:10,backdropFilter:"blur(10px)",minWidth:180,justifyContent:"center",pointerEvents:"none"}}>
      <span style={{fontSize:18}}>{cfg.icon}</span>
      <span style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:17,color:cfg.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{cfg.title}</span>
    </div>
  );
}

const PROTOCOL_TABS = [
  { id: 'lower_body',  label: 'Lower Body' },
  { id: 'upper_push',  label: 'Upper Push' },
  { id: 'upper_pull',  label: 'Upper Pull' },
  { id: 'full_body',   label: 'Full Body'  },
  { id: 'running',     label: 'Running'    },
  { id: 'hyrox',       label: 'Hyrox'      },
];

function fmtDuration(secs) {
  if (!secs) return '';
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m} min`;
}

function WarmupProtocolsViewer({ isMobile, setTrainScreen }) {
  const [tab, setTab] = useState('lower_body');
  const [coolTab, setCoolTab] = useState('strength');
  const moves = MOVEMENT_PREP[tab] || [];
  const [expanded, setExpanded] = useState(null);

  const moveTotalSecs = moves.reduce((s, m) => s + (m.duration || 30), 0);
  const moveTotalMin = Math.ceil(moveTotalSecs / 60);

  const EQUIP_LABELS = { pull_up_bar: 'Pull-up bar', cable_machine: 'Cable machine', rowing_machine: 'Rowing machine' };

  return (
    <div style={{ maxWidth: isMobile ? '100%' : 540 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setTrainScreen('today')}
          style={{ background: 'none', border: 'none', color: 'rgba(245,245,240,.45)', cursor: 'pointer', padding: '4px 2px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--condensed)", fontWeight: 900, fontSize: 26, letterSpacing: 0.5, lineHeight: 1, textTransform: 'uppercase' }}>Warm-Up Protocols</div>
          <div style={{ fontSize: 11, color: 'rgba(245,245,240,.4)', marginTop: 3 }}>Standard pre-session movement prep</div>
        </div>
      </div>

      {/* Step 1 — General Warm-Up */}
      <div style={{ background: 'linear-gradient(135deg,rgba(var(--accent-rgb),.08),rgba(var(--accent-rgb),.03))', border: '1px solid rgba(var(--accent-rgb),.22)', borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: T.prot, letterSpacing: '.18em', textTransform: 'uppercase', lineHeight: 1.4 }}>
            Step 1<br/>General Warm-Up
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: 'rgba(245,245,240,.35)', letterSpacing: '.06em' }}>{GENERAL_WARMUP.duration}</div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(245,245,240,.45)', marginBottom: 10 }}>{GENERAL_WARMUP.instructions}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {GENERAL_WARMUP.options.map((opt, i) => (
            <div key={i} style={{ background: 'rgba(var(--accent-rgb),0.04)', border: '1px solid rgba(var(--accent-rgb),0.07)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{opt.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(245,245,240,.4)' }}>{opt.detail}</div>
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: 'rgba(var(--accent-rgb),.65)', flexShrink: 0 }}>{opt.duration}</div>
            </div>
          ))}
        </div>
        {/* Coach note */}
        <div style={{ borderLeft: '2px solid rgba(var(--accent-rgb),.4)', paddingLeft: 12, fontSize: 11, color: 'rgba(245,245,240,.45)', fontStyle: 'italic', lineHeight: 1.65 }}>
          {GENERAL_WARMUP.coachNote}
        </div>
      </div>

      {/* Step 2 — Movement Prep */}
      <div style={{ background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 16, padding: '16px 18px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: T.prot, letterSpacing: '.18em', textTransform: 'uppercase', lineHeight: 1.4 }}>
            Step 2<br/>Movement Prep
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: 'rgba(245,245,240,.35)', letterSpacing: '.06em' }}>≈{moveTotalMin} min</div>
        </div>
        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {PROTOCOL_TABS.map(pt => (
            <button
              key={pt.id}
              onClick={() => { setTab(pt.id); setExpanded(null); }}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${tab === pt.id ? T.prot : 'rgba(var(--accent-rgb),0.1)'}`,
                background: tab === pt.id ? `rgba(var(--accent-rgb),0.09)` : 'none',
                color: tab === pt.id ? T.prot : 'rgba(245,245,240,.5)',
                fontFamily: "var(--condensed)", textTransform: 'uppercase', letterSpacing: '.06em',
                transition: 'all 0.2s',
              }}
            >{pt.label}</button>
          ))}
        </div>
        {/* Exercise list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {moves.map((ex, i) => {
            const isOpen = expanded === i;
            const setsReps = [ex.sets, ex.reps != null ? `× ${ex.reps}` : null].filter(Boolean).join(' ');
            return (
              <div
                key={`${tab}-${i}`}
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{
                  background: isOpen ? 'rgba(var(--accent-rgb),.05)' : 'rgba(var(--accent-rgb),0.03)',
                  border: `1px solid ${isOpen ? 'rgba(var(--accent-rgb),.25)' : 'rgba(var(--accent-rgb),0.07)'}`,
                  borderRadius: 12, padding: '11px 14px', cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{ex.name}</span>
                      {ex.requiresEquipment && (
                        <span style={{ fontSize: 9, fontFamily: "var(--mono)", background: 'rgba(var(--accent-rgb),.1)', color: T.prot, borderRadius: 4, padding: '2px 6px', letterSpacing: '.06em', textTransform: 'uppercase', flexShrink: 0 }}>
                          {EQUIP_LABELS[ex.requiresEquipment] || ex.requiresEquipment}
                        </span>
                      )}
                    </div>
                    {setsReps && <div style={{ fontSize: 11, color: 'rgba(245,245,240,.4)', marginTop: 2 }}>{setsReps}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: 'rgba(var(--accent-rgb),.6)' }}>{fmtDuration(ex.duration)}</div>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.32s cubic-bezier(.2,.7,.3,1)', flexShrink: 0 }}>
                      <path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(var(--accent-rgb),0.06)', fontSize: 12, color: 'rgba(245,245,240,.6)', lineHeight: 1.65 }}>
                    {ex.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 3 — Cool-Down */}
      <div style={{ background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 16, padding: '16px 18px', marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: T.prot, letterSpacing: '.18em', textTransform: 'uppercase', lineHeight: 1.4 }}>
            Step 3<br/>Cool-Down
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['strength', 'running'].map(ct => (
              <button key={ct} onClick={() => setCoolTab(ct)} style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${coolTab === ct ? T.prot : 'rgba(var(--accent-rgb),0.1)'}`,
                background: coolTab === ct ? `rgba(var(--accent-rgb),0.09)` : 'none',
                color: coolTab === ct ? T.prot : 'rgba(245,245,240,.45)',
                fontFamily: "var(--condensed)", textTransform: 'uppercase', letterSpacing: '.06em',
                transition: 'all 0.2s',
              }}>{ct === 'strength' ? 'Strength' : 'Running'}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(COOL_DOWN[coolTab] || []).map((ex, i) => (
            <div key={`cd-${coolTab}-${i}`} style={{ background: 'rgba(var(--accent-rgb),0.03)', border: '1px solid rgba(var(--accent-rgb),0.07)', borderRadius: 12, padding: '11px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{ex.name}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: 'rgba(var(--accent-rgb),.6)', flexShrink: 0 }}>{ex.duration}</div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(245,245,240,.4)', lineHeight: 1.6 }}>{ex.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// WarmupScreen is now imported from ./components/WarmupScreen.jsx

function WorkoutSummaryScreen({ summary, history, profile, onSaveAndExit, onLogMore, plateausBroken }) {
  const [coachNote, setCoachNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(true);

  useEffect(() => {
    if (!summary) return;
    const prText = (summary.prs||[]).length > 0
      ? `PRs hit: ${summary.prs.map(p => `${p.name} ${p.weight}${profile?.wUnit||"lbs"}`).join(", ")}. `
      : "";
    ai(`Brief 1-2 sentence coach note for: ${summary.title} session, ${summary.duration}min, ${(summary.totalVolume||0).toLocaleString()} lbs total volume, ${summary.completedSets}/${summary.totalSets} sets. ${prText}Punchy and specific. No leading emoji.`, 80)
      .then(n => { setCoachNote(n.trim()); setNoteLoading(false); })
      .catch(() => { setCoachNote("Solid session. Stay consistent — results compound."); setNoteLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.title]);

  if (!summary) return null;
  const wUnit = profile?.wUnit || "lbs";
  const compPct = summary.totalSets > 0 ? Math.round(summary.completedSets / summary.totalSets * 100) : 100;

  return (
    <div style={{animation:"fade-in 0.3s"}}>
      <div style={{textAlign:"center",padding:"24px 0 16px"}}>
        <div style={{marginBottom:10,display:"flex",justifyContent:"center"}}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none"><path d="M12 2C10 6 6 8 6 12a6 6 0 0012 0c0-4-4-6-4-10z" fill={T.prot} opacity="0.9"/><path d="M12 8c-1 2-3 3.5-3 5.5a3 3 0 006 0c0-2-2-3.5-2-5.5z" fill="rgba(245,245,240,0.25)"/></svg>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--red)",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>Session Complete</div>
        <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontStyle:"italic",fontSize:40,textTransform:"uppercase",lineHeight:.9}}>{summary.title}</div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          ["Total Volume", `${(summary.totalVolume||0).toLocaleString()} ${wUnit}`, "var(--red)"],
          ["Duration",     `${summary.duration} min`,                              T.carb],
          ["Sets",         `${summary.completedSets}/${summary.totalSets}`,        T.green],
          ["Completion",   `${compPct}%`,                                          compPct===100?T.green:T.fat],
        ].map(([label, val, color]) => (
          <div key={label} style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontStyle:"italic",fontSize:26,color,lineHeight:1}}>{val}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.38)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>

      {/* PRs */}
      {summary.prs?.length > 0 && (
        <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(239,68,68,0.8)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>Personal Records</div>
          {summary.prs.map((pr, i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:i<summary.prs.length-1?6:0}}>
              <span style={{fontSize:13,fontWeight:600}}>{pr.name}</span>
              <span style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:T.prot}}>{pr.weight} {wUnit} ← new PR</span>
            </div>
          ))}
        </div>
      )}

      {/* Plateaus broken */}
      {plateausBroken?.length>0&&(
        <div style={{background:"rgba(96,165,250,0.07)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#60a5fa",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8}}>// PLATEAUS BROKEN</div>
          {plateausBroken.map((name,i)=>(
            <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:i<plateausBroken.length-1?6:10}}>
              <span style={{fontSize:16}}>💪</span>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:15,color:"#f5f5f0",textTransform:"uppercase"}}>{name} — UNSTUCK.</span>
            </div>
          ))}
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:16,color:"rgba(245,245,240,0.7)",lineHeight:1.4}}>
            The strategy worked. Keep pushing — the adaptation is happening.
          </div>
        </div>
      )}

      {/* Coach note */}
      <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderLeft:"3px solid var(--red)",borderRadius:"4px 14px 14px 4px",padding:"12px 16px",marginBottom:16}}>
        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:6}}>// Coach</div>
        {noteLoading
          ? <div style={{fontSize:12,color:"rgba(245,245,240,0.4)",fontStyle:"italic"}}>Generating note...</div>
          : <div style={{fontSize:13.5,lineHeight:1.55,fontStyle:"italic"}}>{coachNote}</div>
        }
      </div>

      {/* Cool-down */}
      {(()=>{
        const [showCoolDown, setShowCoolDown] = React.useState(false);
        const isRun = (summary?.title||'').toLowerCase().includes('run') || (summary?.title||'').toLowerCase().includes('cardio');
        const coolProtocol = isRun ? COOL_DOWN.running : COOL_DOWN.strength;
        return (
          <div style={{marginBottom:16}}>
            {!showCoolDown ? (
              <button onClick={()=>setShowCoolDown(true)} style={{width:"100%",padding:"13px",background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:14,color:T.green,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"var(--condensed)",fontStyle:"italic",textTransform:"uppercase",letterSpacing:1}}>
                View Cool-Down Protocol (5 min)
              </button>
            ) : (
              <div style={{background:"rgba(0,201,167,0.06)",border:"1px solid rgba(0,201,167,0.2)",borderRadius:14,padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(0,201,167,0.8)",letterSpacing:".18em",textTransform:"uppercase"}}>Cool-Down — 5 minutes</div>
                  <button onClick={()=>setShowCoolDown(false)} style={{background:"none",border:"none",color:"rgba(245,245,240,.3)",cursor:"pointer",fontSize:16,padding:"0 2px",lineHeight:1}}>×</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {coolProtocol.map((step, i) => (
                    <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"10px 0",borderBottom:i<coolProtocol.length-1?"1px solid rgba(var(--accent-rgb),0.05)":"none"}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:T.green,flexShrink:0,marginTop:1}}>{i+1}</div>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>{step.name} <span style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(0,201,167,0.7)",fontWeight:400}}>· {step.duration}</span></div>
                        <div style={{fontSize:11,color:"rgba(245,245,240,.55)",lineHeight:1.6}}>{step.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Actions */}
      <button onClick={onSaveAndExit} style={{width:"100%",padding:"15px",background:"var(--red)",color:"white",border:"none",borderRadius:14,fontFamily:"var(--condensed)",fontWeight:800,fontSize:16,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",marginBottom:10}}>
        Save & Exit →
      </button>
      <button onClick={onLogMore} style={{width:"100%",padding:"13px",background:"rgba(245,245,240,0.05)",color:"rgba(245,245,240,0.6)",border:"1px solid rgba(245,245,240,0.1)",borderRadius:14,fontFamily:"var(--condensed)",fontWeight:700,fontSize:14,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>
        Log Another Exercise
      </button>
    </div>
  );
}

function MuscleChips({ name, sets, reps, sugg, history: h, muscleGroup, primaryMuscles: pmProp, secondaryMuscles: smProp }) {
  const md = getExerciseData(name);
  const mono = { fontFamily:"'DM Mono','SF Mono',monospace" };
  const groupColorMap={'chest':'var(--accent)','back':'#60a5fa','lats':'#60a5fa','shoulders':'#FEA020','arms':'#9C6FFF','biceps':'#9C6FFF','triceps':'#9C6FFF','legs':'#22c55e','glutes':'#22c55e','calves':'#22c55e','core':'#14C4B3','cardio':'#14C4B3'};
  const fallbackColor=groupColorMap[(muscleGroup||'').toLowerCase()]||'rgba(245,245,240,0.4)';
  // Resolve muscle arrays from all possible field shapes
  const fallbackPrimary = pmProp || (muscleGroup ? [muscleGroup] : []);
  const fallbackSecondary = smProp || [];

  // Weight progression indicator
  let weightEl = null;
  if (sugg?.weight) {
    const sessions = h?.[name.toLowerCase().replace(/ /g,'_')] || h?.[name] || null;
    const lastW = sessions?.length ? Math.max(...(sessions[sessions.length-1].sets||[]).map(s=>parseFloat(s.weight||0))) : null;
    const currW = parseFloat(sugg.weight);
    const isUp = lastW && currW > lastW;
    weightEl = (
      <span style={{...mono, fontSize:11, color: isUp ? '#22c55e' : 'rgba(245,245,240,0.5)', marginLeft:'auto', flexShrink:0}}>
        {sugg.weight}lbs{isUp ? ' ↑' : ''}
      </span>
    );
  }

  return (
    <div style={{marginTop:4}}>
      {/* Name row with optional weight */}
      {weightEl && (
        <div style={{display:'flex',alignItems:'center',marginBottom:3}}>
          {weightEl}
        </div>
      )}

      {md ? (
        <>
          {/* Primary chips */}
          <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:3}}>
            {md.primary.map(m => {
              const col = getMuscleColor(m);
              return (
                <span key={m} style={{
                  ...mono, fontSize:8, textTransform:'uppercase', letterSpacing:'0.08em',
                  padding:'2px 8px', borderRadius:20,
                  background: col + '1a', border:`1px solid ${col}33`, color: col,
                }}>{m}</span>
              );
            })}
          </div>

          {/* Secondary + sets×reps */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
            {md.secondary.length > 0 && (
              <div style={{...mono, fontSize:8, color:'rgba(245,245,240,0.28)', letterSpacing:'0.06em', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                + {md.secondary.join(' · ')}
              </div>
            )}
            {sets && reps && (
              <div style={{...mono, fontSize:9, color:'rgba(245,245,240,0.38)', flexShrink:0, marginLeft:'auto'}}>
                {sets}×{reps}
              </div>
            )}
          </div>

          {/* Coaching note */}
          {md.note && (
            <div style={{...mono, fontSize:8, fontStyle:'italic', color:'rgba(245,245,240,0.18)', marginTop:3}}>
              {md.note}
            </div>
          )}
        </>
      ) : (
        /* Fallback — use passed primaryMuscles/muscleGroup arrays */
        <>
          {fallbackPrimary.length > 0 && (
            <div style={{display:'flex',flexWrap:'wrap',gap:3,marginBottom:3}}>
              {fallbackPrimary.map((m,i) => {
                const col = getMuscleColor(m) || groupColorMap[(m||'').toLowerCase()] || fallbackColor;
                return (
                  <span key={i} style={{...mono,fontSize:8,textTransform:'uppercase',letterSpacing:'0.08em',padding:'2px 8px',borderRadius:20,background:col+'1a',border:`1px solid ${col}33`,color:col}}>
                    {m}
                  </span>
                );
              })}
            </div>
          )}
          {fallbackSecondary.length > 0 && (
            <div style={{...mono,fontSize:8,color:'rgba(245,245,240,0.28)',letterSpacing:'0.06em',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              + {fallbackSecondary.join(' · ')}
            </div>
          )}
          {sets && reps && (
            <div style={{...mono, fontSize:9, color:'rgba(245,245,240,0.38)', marginTop:2}}>
              {sets}×{reps}
            </div>
          )}
          {fallbackPrimary.length === 0 && (
            <span style={{background:'rgba(var(--accent-rgb),0.08)',border:'1px solid rgba(var(--accent-rgb),0.15)',borderRadius:20,padding:'3px 10px',fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.35)',letterSpacing:'0.1em',textTransform:'uppercase',display:'inline-block',marginTop:4}}>
              Compound Movement
            </span>
          )}
        </>
      )}
    </div>
  );
}

// ─── WEEK STRIP ───────────────────────────────────────────────────────────────
export function WeekStrip({ todayKey, schedule, dayFocus, sessionCount, todayType, lightSurface = false }) {
  const todayIdx = WDAYS.indexOf(todayKey);
  const firstUpNextIdx = WDAYS.findIndex((day,idx) => idx > todayIdx && schedule[day] && schedule[day] !== "rest");

  return (
    <div style={lightSurface
      ? {borderRadius:12,overflow:"hidden"}
      : {background:GOCLUB_REDESIGN?"rgba(255,255,255,0.04)":T.s1,border:GOCLUB_REDESIGN?"1px solid rgba(255,255,255,0.08)":`1px solid ${T.bd}`,borderRadius:16,padding:"14px 16px"}
    }>
      {!lightSurface&&<div className="header-eyebrow" style={{marginBottom:10,fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":undefined,fontStyle:GOCLUB_REDESIGN?"normal":undefined}}>// This Week</div>}
      {lightSurface&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--cm-ink)",marginBottom:14}}>THIS WEEK</div>}
      <div style={{display:"flex",flexDirection:"column"}}>
        {WDAYS.map((day,idx)=>{
          const t = schedule[day];
          const isToday = day === todayKey;
          const isRest = !t || t === "rest";
          const isDone = idx < todayIdx && !isRest;
          const isUpNext = idx === firstUpNextIdx;
          const label = dayFocus[day] || (isRest ? "Rest" : DAY_CFG[t]?.label || "Training");
          const statusText = isToday ? "today" : isDone ? "done" : isUpNext ? "up next" : "";

          // Dark surface colors (existing)
          const rowBgDark = isToday ? "rgba(var(--accent-rgb),0.06)" : isDone ? "rgba(34,197,94,0.04)" : "transparent";
          const dayColDark = isToday ? "var(--accent)" : isDone ? "#22c55e" : "rgba(245,245,240,0.28)";
          const labelColDark = isToday ? "#ffffff" : isDone ? "rgba(245,245,240,0.85)" : isRest ? "rgba(245,245,240,0.22)" : "rgba(245,245,240,0.55)";
          const statusColDark = isToday ? "var(--accent)" : isDone ? "#22c55e" : isUpNext ? "rgba(245,245,240,0.4)" : "transparent";

          // Light surface colors (paper card)
          const rowBgLight = isToday ? "rgba(255,59,48,0.07)" : isDone ? "rgba(34,197,94,0.07)" : "transparent";
          const dayColLight = isToday ? "#FF3B30" : isDone ? "#16a34a" : "rgba(var(--cm-ink-rgb),0.45)";
          const labelColLight = isToday ? "#0A0A0A" : isDone ? "var(--cm-ink)" : isRest ? "rgba(var(--cm-ink-rgb),0.40)" : "var(--cm-ink)";
          const statusColLight = isToday ? "#FF3B30" : isDone ? "#16a34a" : isUpNext ? "rgba(var(--cm-ink-rgb),0.65)" : "transparent";

          const rowBg = lightSurface ? rowBgLight : rowBgDark;
          const dayCol = lightSurface ? dayColLight : dayColDark;
          const labelCol = lightSurface ? labelColLight : labelColDark;
          const statusCol = lightSurface ? statusColLight : statusColDark;
          const dividerColor = lightSurface ? "rgba(10,10,10,0.06)" : "rgba(245,245,240,0.04)";

          return (
            <div key={day} style={{
              display:"flex", alignItems:"center", gap:12,
              padding:"9px 10px",
              borderRadius:8,
              background:rowBg,
              borderBottom: idx < 6 ? `1px solid ${dividerColor}` : "none",
            }}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:dayCol,width:30,flexShrink:0}}>
                {day.toUpperCase()}
              </div>
              <div style={{flex:1,fontFamily:GOCLUB_REDESIGN?"'Archivo',sans-serif":"var(--condensed)",fontStyle:GOCLUB_REDESIGN?"normal":"italic",fontWeight:GOCLUB_REDESIGN?700:900,fontSize:GOCLUB_REDESIGN?14:16,textTransform:"uppercase",color:labelCol,lineHeight:1}}>
                {label}
              </div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",color:statusCol,flexShrink:0,minWidth:44,textAlign:"right"}}>
                {statusText}
              </div>
            </div>
          );
        })}
      </div>
      {sessionCount===0&&todayIdx>1&&todayType==="training"&&(
        <div style={{marginTop:12,background:lightSurface?"rgba(255,59,48,0.06)":"rgba(var(--accent-rgb),0.04)",border:lightSurface?"1px solid rgba(255,59,48,0.15)":"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:10,padding:"12px 14px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FF3B30",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>CONSISTENCY BUILDS CHAMPIONS.</div>
          <div style={{fontFamily:lightSurface?"'Archivo',sans-serif":"var(--condensed)",fontSize:15,color:lightSurface?"var(--cm-ink)":"rgba(245,245,240,0.45)",lineHeight:1.5}}>Missing sessions is normal. What matters is showing up today. Your body is ready.</div>
        </div>
      )}
    </div>
  );
}

const _TRAIN_GOCLUB_CSS=`
.goclub.tab-train .screen-header{padding-top:4px!important;background:rgba(var(--cm-red-rgb,255,59,48),0.88)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important}
.goclub.tab-train .header-eyebrow{font-family:'Archivo',sans-serif!important;font-style:normal!important;font-weight:700!important;font-size:11px!important;letter-spacing:0.16em!important;color:rgba(255,255,255,0.55)!important;text-transform:uppercase!important}
.goclub.tab-train .header-title{font-family:'Archivo',sans-serif!important;font-style:normal!important;font-weight:800!important;font-size:26px!important;line-height:1.1!important;text-transform:none!important;color:#ffffff!important}
`;

export function TrainSection({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,trainScreen,setTrainScreen,activeSessionOpen,workout,workoutLoading,generateWorkout,activeWorkout,setActiveWorkout,restActive,restTimer,logSet,finishWorkout,getSuggestion,history,planMode,setPlanMode,runPlan,setRunPlan,hybridMix,setHybridMix,startStructured,todayKey,todayType,todayFocus,cfg,isMobile,user,lastLoggedSet,setFlash,skipRest,adjustRest,workoutSummary,completedWorkout=null,clearWorkoutSummary,workoutStartTime,sessionCount,sessionPrediction,onLogPain,acwrHighRisks,deloadActive,activePlateaus,balanceCorrections,programCurrentWeek,recentAdjustments,fatigueAlert,macros=null,todayProtocol=null,showLocalRest=false,localRestSecs=90,onStartLocalRest,onSkipLocalRest,onReduceLocalRest,onProfileUpdate}) {
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");
  const [progDetailsExpanded,setProgDetailsExpanded]=useState(false);
  const [exExpanded,setExExpanded]=useState(false);
  const [showGVT,setShowGVT]=useState(false);
  const [todaySoreness,setTodaySoreness]=useState(null);
  useEffect(()=>{
    if(!user?.id)return;
    getTodaySoreness(user.id).then(s=>setTodaySoreness(s)).catch(()=>{});
  },[user?.id]);

  // ── GOCLUB eyebrow — swipeable pages ─────────────────────────────────────────
  const [_trainRecovPct,_setTrainRecovPct]=useState(null);
  const [_trainEyePg,_setTrainEyePg]=useState(0);
  const _trainEyeX=useRef(0);
  const _trainEyeY=useRef(0);
  const _trainEyeRedMo=useReducedMotion();
  useEffect(()=>{
    if(!GOCLUB_REDESIGN||!user?.id)return;
    getRecoveryData(user.id).then(d=>{
      if(!d)return;
      const vs=Object.values(d);
      _setTrainRecovPct(Math.round(vs.reduce((s,v)=>s+v.percent,0)/vs.length));
    }).catch(()=>{});
  },[user?.id]);

  // ── Adaptive session ─────────────────────────────────────────────────────────
  const [adaptiveSession,setAdaptiveSession]=useState(null);
  const [todayCheckin,setTodayCheckin]=useState(null);
  const [recentFoodLogs,setRecentFoodLogs]=useState([]);
  const [weatherAdjustment,setWeatherAdjustment]=useState(null);
  useEffect(()=>{
    if(!user?.id)return;
    // Load today's check-in
    getTodayCheckin(user.id).then(c=>setTodayCheckin(c??null)).catch(()=>{});
    // Load recent food logs
    const since=new Date();since.setDate(since.getDate()-7);
    sb.from('food_logs').select('date,entries').eq('user_id',user.id)
      .gte('date',since.toISOString().split('T')[0]).order('date',{ascending:false}).limit(7)
      .then(({data})=>setRecentFoodLogs((data??[]).map(r=>({
        date:r.date,
        calories:(r.entries||[]).reduce((s,e)=>s+(e.calories||0),0),
        protein:(r.entries||[]).reduce((s,e)=>s+(e.protein||0),0),
      })).filter(r=>r.calories>0))).catch(()=>{});
    // Weekly analysis fire-and-forget
    shouldRunAnalysis(user.id).then(should=>{
      if(should)runWeeklyAnalysis(user.id,profile).catch(()=>{});
    }).catch(()=>{});
    // Weather adjustment for run sessions — fire once
    if(wPrefs?.isHybrid||wPrefs?.isHyrox||profile?.run_race_type){
      if(navigator?.geolocation){
        navigator.geolocation.getCurrentPosition(pos=>{
          getWeatherPaceAdjustment(pos.coords.latitude,pos.coords.longitude)
            .then(w=>setWeatherAdjustment(w)).catch(()=>{});
        },()=>{},{timeout:4000,maximumAge:3600000});
      }
    }
  },[user?.id]);

  useEffect(()=>{
    if(!Array.isArray(todayPrescription)||!todayPrescription.length)return;
    try{
      const session=buildAdaptiveSession(
        todayPrescription,
        history?Object.values(history).flat():[],
        profile,
        wPrefs?._libraryId||wPrefs?.splitType,
        todayCheckin,
        recentFoodLogs
      );
      setAdaptiveSession(session);
    }catch(e){console.error('[adaptiveSession]',e);}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[todayCheckin,recentFoodLogs,wPrefs?.splitType]);

  // ── End session confirmation ─────────────────────────────────────────────
  const [endConfirm,setEndConfirm]=useState(false);

  // ── Exercise navigation ──────────────────────────────────────────────────
  const [currentExerciseIdx,setCurrentExerciseIdx]=useState(0);
  useEffect(()=>{ if(trainScreen==="active") setCurrentExerciseIdx(0); },[trainScreen]);

  // ── Exercise detail modal ────────────────────────────────────────────────
  const [detailModal,setDetailModal]=useState(null); // {exerciseName, exerciseIdx}
  const longPressTimer=useRef(null);
  function openDetail(exerciseName,exerciseIdx){setDetailModal({exerciseName,exerciseIdx});}
  function startLongPress(exerciseName,exerciseIdx){longPressTimer.current=setTimeout(()=>openDetail(exerciseName,exerciseIdx),500);}
  function cancelLongPress(){if(longPressTimer.current){clearTimeout(longPressTimer.current);longPressTimer.current=null;}}

  // ── Custom routine session handoff ──────────────────────────────────────
  useEffect(()=>{
    if(trainScreen==="active"){
      try{
        const raw=sessionStorage.getItem("cm_custom_routine_session");
        if(raw){
          const parsed=JSON.parse(raw);
          sessionStorage.removeItem("cm_custom_routine_session");
          if(parsed?.exercises?.length&&!activeWorkout){
            setActiveWorkout({title:parsed.title||"Custom Routine",exercises:parsed.exercises});
          }
        }
      }catch{}
    }
  },[trainScreen]);

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
    showToast(isFav?"Removed from favorites":"❤️ Added to favorites", isFav?"info":"success");
    hap();
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
    showToast(`Swapped to ${swapName}${permanent?" · permanent":""}`, "success");
    hapMed();
  }

  // ── Active workout localStorage persistence ────────────────────────────────
  const WORKOUT_KEY = "cm_active_workout";
  const [resumePrompt, setResumePrompt] = useState(null);
  useEffect(() => {
    if (!activeWorkout) {
      // Check for a persisted workout when there's no active session
      try {
        const saved = localStorage.getItem(WORKOUT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.exercises && parsed.ts && Date.now() - parsed.ts < 4 * 60 * 60 * 1000) {
            setResumePrompt(parsed);
          } else {
            localStorage.removeItem(WORKOUT_KEY);
          }
        }
      } catch {}
    }
  }, []);
  useEffect(() => {
    if (activeWorkout) {
      try { localStorage.setItem(WORKOUT_KEY, JSON.stringify({...activeWorkout, ts: Date.now()})); } catch {}
    }
  }, [activeWorkout]);
  function clearPersistedWorkout() { try { localStorage.removeItem(WORKOUT_KEY); } catch {} }

  // ── Warm-up state ────────────────────────────────────────────────────────
  const [warmupData,setWarmupData]=useState(null);
  const [warmupSessionType,setWarmupSessionType]=useState('push');
  const [warmupSkillLevel,setWarmupSkillLevel]=useState('beginner');

  const [sessionMode,setSessionMode]=useState(null);
  const [editingSet,setEditingSet]=useState(null);
  const [sessionPRs,setSessionPRs]=useState({});
  const [editHintDismissed,setEditHintDismissed]=useState(false);
  const [hyroxWeaknessStation,setHyroxWeaknessStation]=useState(null);
  const [runElapsed,setRunElapsed]=useState(0);
  const [runDistance,setRunDistance]=useState(0);
  const [runCoords,setRunCoords]=useState([]);
  const [runLaps,setRunLaps]=useState([]);
  const [runCurrentPace,setRunCurrentPace]=useState('--:--');
  const [runAvgPace,setRunAvgPace]=useState('--:--');
  const [runCalories,setRunCalories]=useState(0);
  const [runGpsError,setRunGpsError]=useState(false);
  const [runManualDist,setRunManualDist]=useState('');
  const [runEffort,setRunEffort]=useState(null);
  const [runSummary,setRunSummary]=useState(null);
  const runTimerRef=useRef(null);
  const gpsWatchRef=useRef(null);
  const [hyroxType,setHyroxType]=useState(null);
  const [hyroxTotalElapsed,setHyroxTotalElapsed]=useState(0);
  const [hyroxSegElapsed,setHyroxSegElapsed]=useState(0);
  const [hyroxCurrentSeg,setHyroxCurrentSeg]=useState(0);
  const [hyroxSegTimes,setHyroxSegTimes]=useState([]);
  const [hyroxWodStations,setHyroxWodStations]=useState([]);
  const [hyroxWodRounds,setHyroxWodRounds]=useState(3);
  const [hyroxWodCurStation,setHyroxWodCurStation]=useState(0);
  const [hyroxWodCurRound,setHyroxWodCurRound]=useState(0);
  const [hyroxSummary,setHyroxSummary]=useState(null);
  const hyroxTotalTimerRef=useRef(null);
  const hyroxSegTimerRef=useRef(null);

  useEffect(()=>{
    if(lastLoggedSet?.isNewPR&&lastLoggedSet?.exerciseName){
      setSessionPRs(p=>({...p,[lastLoggedSet.exerciseName]:{weight:lastLoggedSet.weight,reps:lastLoggedSet.reps}}));
    }
  },[lastLoggedSet]);

  useEffect(()=>{
    return()=>{
      clearInterval(runTimerRef.current);
      if(gpsWatchRef.current!=null)navigator.geolocation.clearWatch(gpsWatchRef.current);
      clearInterval(hyroxTotalTimerRef.current);
      clearInterval(hyroxSegTimerRef.current);
    };
  },[]);

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
    if((rdAnswers.painLevel==="minor"||rdAnswers.painLevel==="significant")&&rdAnswers.painRegions?.length>0){
      onLogPain?.({painLevel:rdAnswers.painLevel,painRegions:rdAnswers.painRegions,painType:rdAnswers.painType});
    }
    _doStartFromProgram(rd);
  }

  function skipReadiness(){
    setShowReadiness(false);
    _doStartFromProgram(null);
  }

  // ── Explore sheet state ─────────────────────────────────────────────────
  const [showExploreSheet,setShowExploreSheet]=useState(false);
  const [activeCard,setActiveCard]=useState(0);
  const carouselRef=useRef(null);
  const [sessionDetailExpanded,setSessionDetailExpanded]=useState(false);
  // Plan screen: which non-today day is expanded (exact pills), and whether the schedule editor is open
  const [planExpandedDay,setPlanExpandedDay]=useState(null);
  const [planShowAdjust,setPlanShowAdjust]=useState(false);

  // ── Adapt Now state ──────────────────────────────────────────────────────
  const [showAdapt,setShowAdapt]=useState(false);
  const [adaptToast,setAdaptToast]=useState("");
  const [localAdaptUsed,setLocalAdaptUsed]=useState(null);

  const adaptLimit=getAdaptLimit(profile);
  const adaptResetDate=profile?.adaptations_reset_date;
  const daysSinceReset=adaptResetDate?Math.floor((Date.now()-new Date(adaptResetDate))/86400000):31;
  const needsAdaptReset=daysSinceReset>30;
  const adaptUsed=localAdaptUsed!==null?localAdaptUsed:(needsAdaptReset?0:(profile?.adaptations_used||0));
  const adaptLeft=Math.max(0,adaptLimit-adaptUsed);
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
    const _adaptRemaining=Math.max(0,adaptLimit-newUsed);
    const _tier=profile?.subscription_tier||'trial';
    const _toast=_adaptRemaining>0
      ?`Session adapted. ${_adaptRemaining} of ${adaptLimit} adaptations remaining this month.`
      :_tier==='expired'
        ?`Upgrade to Pro to unlock Adapt Now.`
        :`You have used all ${adaptLimit} adaptations this month.`;
    setAdaptToast(_toast);
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
  const isLifting=!wPrefs.isHyrox&&!wPrefs.isHybrid&&!profile?.run_race_type;
  const isGVTWeek=isLifting&&(wPrefs?.gvt===true||(wPrefs?.gvt!==false&&weekNum%4===0))&&todayType==="training";

  let prescType="lifting";
  if(wPrefs.isHyrox&&wPrefs.isHybrid)prescType="hybrid-hyrox";
  else if(wPrefs.isHyrox)prescType="hyrox";
  else if(wPrefs.isHybrid)prescType="hybrid";
  else if(profile?.run_race_type)prescType="running";

  // Full generated week for run-focused accounts; drives WeekStrip labels + week card
  const runWeek = prescType === "running"
    ? (() => { try { return getRunWeek(profile, wPrefs, schedule, weekNum); } catch { return null; } })()
    : null;

  // For hybrid accounts with an explicit dayPlan, compute per-day modality + engine run week
  const hybridModality = (prescType === "hybrid" && !!wPrefs?.dayPlan)
    ? deriveDayModality(profile, wPrefs, schedule)
    : null;
  const hybridRunWeek = hybridModality
    ? (() => { try { return getRunWeek(profile, wPrefs, schedule, weekNum); } catch { return null; } })()
    : null;
  // True when today is an engine run day for a hybrid account (dayPlan-gated)
  const hybridRunDay = !!(hybridModality?.runDays.includes(todayKey) && !hybridModality?.liftDays.includes(todayKey));

  // Format a run session label with mileage: "Tempo Run · 4 mi"
  const _runLabel = (rs) => {
    const label = RUN_SESSION_TITLE[rs.type] || rs.type;
    const dist  = rs.distanceMi || 0;
    if (!dist) return label;
    const distStr = dist >= 3 ? `${Math.round(dist)} mi` : `${parseFloat(dist.toFixed(1))} mi`;
    return `${label} · ${distStr}`;
  };

  // Build a dayFocus map showing correct labels for all account types
  const resolvedDayFocus = runWeek
    ? WDAYS.reduce((acc, d) => {
        if (!schedule[d] || schedule[d] === 'rest') { acc[d] = 'Rest'; return acc; }
        const rs = runWeek.sessions.find(s => s.day === d);
        acc[d] = rs ? _runLabel(rs) : 'Rest';
        return acc;
      }, {})
    : (hybridRunWeek && hybridModality)
      ? WDAYS.reduce((acc, d) => {
          const dp = wPrefs.dayPlan?.[d];
          if (!dp || (!dp.run && !dp.lift)) { acc[d] = 'Rest'; return acc; }
          if (dp.run && !dp.lift) {
            const rs = hybridRunWeek.sessions.find(s => s.day === d);
            acc[d] = rs ? _runLabel(rs) : 'Easy Run';
          } else {
            acc[d] = dayFocus[d] || 'Training';
          }
          return acc;
        }, {})
      : dayFocus;

  let todayPrescription=null;
  let todayProgObj=null;
  if(prescType==="lifting"&&todayType==="training"){
    let exs=getWorkoutForDay(daysPerWeek,wPrefs.splitType||"Full Body",dayIndex,wPrefs.equipment||"Full Gym",undefined,wPrefs.liftExp||profile?.liftExp);
    exs=applyEquipmentToWorkout(exs?.exercises||exs||[],wPrefs.equipment||"Full Gym");
    exs=exs.map(ex=>{const c=ex.originalName||ex.name;const sw=permanentSwaps[c];return{...ex,name:sw||ex.name,swappedFrom:sw?c:undefined,isFavorite:favorites.includes(c)};});
    if(showGVT&&isGVTWeek)exs=[...exs.slice(0,2).map(e=>({...e,sets:GVT_OVERLAY.sets,reps:GVT_OVERLAY.reps,notes:GVT_OVERLAY.note})),...exs.slice(2)];
    const _sl=wPrefs.sessionLength||60;
    const _exCap=_sl<=30?3:_sl<=45?4:_sl<=60?5:_sl<=75?6:_sl<=90?7:exs.length;
    exs=exs.slice(0,_exCap);
    if(todaySoreness?.soreness_score>=4){
      const _CHIP_TO_GRP={Quads:'legs',Hamstrings:'legs',Glutes:'legs',Calves:'legs',Chest:'chest',Back:'back',Shoulders:'shoulders',Arms:'arms',Core:'core'};
      const _NORM={chest:'chest',back:'back',shoulders:'shoulders',arms:'arms',core:'core',legs:'legs',glutes:'legs',calves:'legs'};
      const _soreGrps=new Set((todaySoreness.sore_muscles||[]).map(m=>_CHIP_TO_GRP[m]).filter(Boolean));
      const _reduction=todaySoreness.soreness_score>=7?2:1;
      exs=exs.map(ex=>{
        const _grp=_NORM[EXERCISE_MUSCLE_GROUP[ex.name]||''];
        if(!_grp||!_soreGrps.has(_grp))return ex;
        const _newSets=Math.max(1,Number(ex.sets||3)-_reduction);
        return{...ex,sets:_newSets,notes:(ex.notes?ex.notes+' — sets reduced for recovery':'Sets reduced for recovery')};
      });
    }
    todayPrescription=exs;
  }else if(prescType==="running"){
    // ── Generative engine — Phase B ──────────────────────────────────────────
    todayPrescription = getTodayRunWorkout(profile, wPrefs, schedule, todayKey, weekNum);

    // Resolve pace tokens and apply VDOT/weather adjustments
    const _5kSecs = wPrefs.current5KTime || profile?.current5KTime || profile?.profile_data?.current5KTime;
    let runPaces = getPacesFromTime(_5kSecs);
    if (runPaces && profile?.run_target_time) {
      // Extend paces with {goalPace} derived from the user's goal finish time
      const _gpSecs = parseTimeInput(profile.run_target_time);
      if (_gpSecs > 0) runPaces = { ...runPaces, goalPace: computeGoalPace(_gpSecs, profile?.run_race_type || '5k', runPaces.tempo) };
    }
    if (todayPrescription) {
      todayPrescription = enrichRunSession(todayPrescription);
      if (runPaces) todayPrescription = { ...todayPrescription, description: resolvePaceTokens(todayPrescription.description || "", runPaces) };
      const _rawPaces = profile?.runProfile?.paces ?? null;
      const _vdotPaces = weatherAdjustment?.adjustmentFactor > 1.0 ? applyWeatherToPaces(_rawPaces, weatherAdjustment.adjustmentFactor) : _rawPaces;
      if (_vdotPaces) todayPrescription = { ...todayPrescription, description: renderWithPaces(todayPrescription.description || "", _vdotPaces) };
      if (weatherAdjustment?.note && todayPrescription) todayPrescription = { ...todayPrescription, description: `⚠️ ${weatherAdjustment.note}\n` + (todayPrescription.description || "") };
    }
  }else if(prescType==="hyrox"){
    const _hyroxProgramName=wPrefs.hyroxProgram||"12-Week Race Prep";
    todayProgObj=HYROX_PROGRAM[_hyroxProgramName]||HYROX_PROGRAM["12-Week Race Prep"];
    todayPrescription=getTodayHyroxWorkout(_hyroxProgramName,weekNum,todayKey);
    if(todayPrescription){
      const _vdotPaces=profile?.runProfile?.paces??null;
      if(_vdotPaces) todayPrescription={...todayPrescription,description:renderWithPaces(todayPrescription.description||"",_vdotPaces)};
      const _hp=profile?.hyroxProfile??null;
      if(_hp) todayPrescription={...todayPrescription,description:enrichHyroxDesc(todayPrescription.description||"",_hp)};
    }
  }else if(prescType==="hybrid-hyrox"){
    todayProgObj=HYBRID_PROGRAMS["Hyrox Hybrid"];
    todayPrescription=getTodayHybridWorkout("Hyrox Hybrid",todayKey,weekNum);
    if(todayPrescription){
      const _vdotPaces=profile?.runProfile?.paces??null;
      if(_vdotPaces) todayPrescription={...todayPrescription,description:renderWithPaces(todayPrescription.description||"",_vdotPaces)};
      const _hp=profile?.hyroxProfile??null;
      if(_hp) todayPrescription={...todayPrescription,description:enrichHyroxDesc(todayPrescription.description||"",_hp)};
    }
  }else if(prescType==="hybrid"){
    if(hybridRunDay){
      // Engine path for run days — same pace resolution as the run-only branch
      todayPrescription = getTodayRunWorkout(profile, wPrefs, schedule, todayKey, weekNum);
      const _5kSecs = wPrefs.current5KTime || profile?.current5KTime || profile?.profile_data?.current5KTime;
      let runPaces = getPacesFromTime(_5kSecs);
      if(runPaces && profile?.run_target_time){
        const _gpSecs = parseTimeInput(profile.run_target_time);
        if(_gpSecs > 0) runPaces = { ...runPaces, goalPace: computeGoalPace(_gpSecs, profile?.run_race_type || '5k', runPaces.tempo) };
      }
      if(todayPrescription){
        todayPrescription = enrichRunSession(todayPrescription);
        if(runPaces) todayPrescription = { ...todayPrescription, description: resolvePaceTokens(todayPrescription.description || "", runPaces) };
        const _rawPaces = profile?.runProfile?.paces ?? null;
        const _vdotPaces = weatherAdjustment?.adjustmentFactor > 1.0 ? applyWeatherToPaces(_rawPaces, weatherAdjustment.adjustmentFactor) : _rawPaces;
        if(_vdotPaces) todayPrescription = { ...todayPrescription, description: renderWithPaces(todayPrescription.description || "", _vdotPaces) };
        if(weatherAdjustment?.note) todayPrescription = { ...todayPrescription, description: `⚠️ ${weatherAdjustment.note}\n` + (todayPrescription.description || "") };
      }
    } else {
      // Lift day or no-dayPlan (backward compat) — existing hybrid template, byte-for-byte unchanged
      const _hybridTemplate=wPrefs.hybridTemplate||"Balanced Hybrid";
      todayProgObj=HYBRID_PROGRAMS[_hybridTemplate];
      todayPrescription=getTodayHybridWorkout(_hybridTemplate,todayKey,weekNum);
      if(todayPrescription){
        const _vdotPaces=profile?.runProfile?.paces??null;
        if(_vdotPaces) todayPrescription={...todayPrescription,description:renderWithPaces(todayPrescription.description||"",_vdotPaces)};
      }
    }
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
      const lifeFactorMod=getLifeFactorMod(wPrefs?.stressLevel,profile?.sleepQuality||wPrefs?.sleepQuality,wPrefs?.jobPhysicality);
      const volMod=(readiness?.config?.volumeMod||1.0)*lifeFactorMod;
      const trainingGoal=profile?.primaryGoal||wPrefs?.primaryGoal;
      const skillLevel=wPrefs?.liftExp||profile?.liftExp||"beginner";
      const goalLabel=trainingGoal?getGoalLabel(trainingGoal):null;
      const goalCtx=trainingGoal?getGoalContext(trainingGoal):null;
      exercises=todayPrescription.map(ex=>{
        const rx=trainingGoal?getPrescription(trainingGoal,skillLevel,ex.name):null;
        const setCount=rx?Math.max(1,Math.round(rx.sets*volMod)):Math.max(1,Math.round((Number(ex.sets)||baseSetCount)*volMod));
        const repsVal=rx?rx.reps:String(ex.reps||10);
        const restSecs=rx?rx.restSeconds:(ex.restSecs||120);
        const restReason=goalLabel?`${goalLabel} · ${Math.round(restSecs/60*10)/10} min rest`:null;
        return {
          name:ex.name,notes:renderWithPaces(ex.notes||"",profile?.runProfile?.paces??null),
          originalName:ex.originalName||ex.name,
          isFavorite:ex.isFavorite,
          swappedFrom:ex.swappedFrom,
          tier:ex.tier,
          restSecs,
          restReason,
          priority:isPriorityExercise(ex.name,[...new Set([...(wPrefs?.musclePriorities||[]),...(wPrefs?.weakPoints||[])])]),
          sets:Array.from({length:setCount},()=>({
            weight:applyWeightMod(ex.weight||"",weightMod),
            reps:repsVal,done:false
          })),
        };
      });
      exercises=applyMobilitySubstitutions(exercises,wPrefs?.mobilityLimitations||[]);
      exercises=applyHealthConditionSubstitutions(exercises,profile?.profile_data?.healthConditions||[]);
      exercises=lifeStageModifier(exercises,profile);
      const userAge=getAge(profile?.dobYear,profile?.dobMonth,profile?.dobDay);
      const ageProg=getAgeAppropriateProgram(exercises,userAge);
      if(ageProg!==null)exercises=ageProg;
      const jointMode=wPrefs?.jointHealthMode!==false;
      exercises=applyOlderAdultProgram(exercises,userAge,jointMode);
      const priorities=[...new Set([...(wPrefs?.musclePriorities||[]),...(wPrefs?.weakPoints||[])])];
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

    // ── Warm-up intercept ────────────────────────────────────────────────
    const wuEnabled = wPrefs?.warmupEnabled !== false;
    const wuTiming  = wPrefs?.warmupTiming || 'always';
    const _isRunDayForWu = prescType === 'running' || (prescType === 'hybrid' && hybridRunDay);
    const showWu = wuEnabled && (
      wuTiming === 'always' ||
      (wuTiming === 'heavy' && prescType === 'lifting') ||
      (wuTiming === 'runs'  && _isRunDayForWu)
    );
    if (showWu) {
      const focusLower = (todayFocus || '').toLowerCase();
      const wuType = _isRunDayForWu ? 'run'
        : prescType === 'hyrox' || prescType === 'hybrid-hyrox' ? 'hyrox'
        : focusLower.includes('push') ? 'push'
        : focusLower.includes('pull') ? 'pull'
        : focusLower.includes('leg') ? 'legs'
        : focusLower.includes('upper') ? 'upper'
        : focusLower.includes('lower') ? 'lower'
        : 'push';
      const liftExp = (wPrefs?.liftExp || profile?.liftExp || 'beginner').toLowerCase();
      const wuLevel = liftExp.includes('advanc') || liftExp.includes('elite') || liftExp.includes('compet') ? 'advanced'
        : liftExp.includes('inter') || liftExp.includes('moderate') ? 'intermediate'
        : 'beginner';
      setWarmupSessionType(wuType);
      setWarmupSkillLevel(wuLevel);
      setTrainScreen("warmup");
    } else {
      setSessionMode(prescType==='hyrox'||prescType==='hybrid-hyrox'?'hyrox-picker':(prescType==='running'||hybridRunDay)?'run-picker':null);
      setTrainScreen("active");
    }
  }

  const ZONE_COLOR={1:"rgba(245,245,240,.35)",2:"var(--green)",3:"var(--blue)",4:"var(--amber)",5:"var(--red)"};
  const ZONE_LABEL={1:"Zone 1 Recovery",2:"Zone 2 Aerobic",3:"Zone 3 Tempo",4:"Zone 4 Threshold",5:"Zone 5 VO₂ Max"};

  function editSet(ei,si,reps,weight){
    setActiveWorkout(prev=>{
      if(!prev)return prev;
      const u={...prev};
      u.exercises=prev.exercises.map((ex,i)=>i!==ei?ex:{
        ...ex,sets:ex.sets.map((s,j)=>j!==si?s:{...s,reps,weight,done:true})
      });
      return u;
    });
    const ex=activeWorkout?.exercises[ei];
    if(!ex)return;
    const k=(ex.name||"").toLowerCase().replace(/\s+/g,"_");
    const prevHistory=history[k];
    const prevLast=prevHistory?.[prevHistory.length-1];
    const prevBestWeight=prevLast?Math.max(...prevLast.sets.map(s=>parseFloat(s.weight)||0)):null;
    const isNewPR=prevBestWeight!=null&&parseFloat(weight)>prevBestWeight;
    if(isNewPR){
      setSessionPRs(p=>({...p,[ex.name]:{weight,reps}}));
      showToast(`🔥 New PR — ${weight}${profile?.wUnit||"lbs"} on ${ex.name}!`,"pr",{duration:5000});
      if(user?.id)triggerEventUnlock(user.id,'pr_set').catch(()=>{});
    } else {
      setSessionPRs(p=>{const u={...p};delete u[ex.name];return u;});
    }
  }

  function haversineKm(lat1,lon1,lat2,lon2){
    const R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function fmtPace(distKm,elapsedSec){
    if(distKm<0.01||elapsedSec<5)return'--:--';
    const spk=elapsedSec/distKm;
    return `${Math.floor(spk/60)}:${String(Math.round(spk%60)).padStart(2,'0')}`;
  }
  function fmtTime(sec){
    const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;
    if(h>0)return `${h}:${_p2(m)}:${_p2(s)}`;
    return `${_p2(m)}:${_p2(s)}`;
  }

  function startGPSRun(){
    setSessionMode('run-gps');
    setRunElapsed(0);setRunDistance(0);setRunCoords([]);setRunLaps([]);setRunCurrentPace('--:--');setRunAvgPace('--:--');setRunCalories(0);setRunGpsError(false);
    runTimerRef.current=setInterval(()=>setRunElapsed(p=>p+1),1000);
    if(navigator.geolocation){
      gpsWatchRef.current=navigator.geolocation.watchPosition(
        pos=>{
          const {latitude:lat,longitude:lon,altitude}=pos.coords;
          setRunCoords(prev=>{
            if(prev.length>0){
              const last=prev[prev.length-1];
              const d=haversineKm(last.lat,last.lon,lat,lon);
              if(d>0.003){
                setRunDistance(pd=>{
                  setRunElapsed(pe=>{
                    setRunCurrentPace(fmtPace(pd+d>0.01?(pd+d):0.001,pe));
                    setRunAvgPace(fmtPace(pd+d,pe));
                    return pe;
                  });
                  return pd+d;
                });
              }
            }
            return [...prev,{lat,lon,alt:altitude||0,ts:Date.now()}];
          });
        },
        _err=>{setRunGpsError(true);},
        {enableHighAccuracy:true,maximumAge:1000,timeout:5000}
      );
    } else {
      setRunGpsError(true);
    }
  }

  function startManualRun(){
    setSessionMode('run-manual');
    setRunElapsed(0);
    runTimerRef.current=setInterval(()=>setRunElapsed(p=>p+1),1000);
  }

  function stopManualRunAndShowForm(){
    clearInterval(runTimerRef.current);
    setSessionMode('run-manual-finish');
  }

  function finishGPSRun(){
    clearInterval(runTimerRef.current);
    if(gpsWatchRef.current!=null)navigator.geolocation.clearWatch(gpsWatchRef.current);
    const elapsed=runElapsed;
    const dist=runDistance;
    const avgPace=fmtPace(dist,elapsed);
    const cals=Math.round(elapsed/60*8.5);
    setRunSummary({mode:'gps',elapsed,distance:dist,avgPace,calories:cals,laps:runLaps,gpsError:runGpsError});
    setSessionMode('run-summary');
    if(user){
      sb.from('workout_logs').insert({
        user_id:user.id,
        date:new Date().toISOString().split('T')[0],
        type:'run',
        duration_min:Math.round(elapsed/60),
        distance_m:Math.round(dist*1000),
        calories:cals,
        workout:{focus:todayFocus,type:'run',mode:'gps',duration_sec:elapsed,distance_km:dist,avg_pace:avgPace,laps:runLaps,coords:runCoords.filter((_,i)=>i%5===0)}
      }).catch(()=>{});
    }
  }

  function finishManualRun(){
    clearInterval(runTimerRef.current);
    const elapsed=runElapsed;
    const dist=parseFloat(runManualDist)||0;
    const avgPace=fmtPace(dist,elapsed);
    const cals=Math.round(elapsed/60*8.5);
    setRunSummary({mode:'manual',elapsed,distance:dist,avgPace,calories:cals,effort:runEffort,laps:[]});
    setSessionMode('run-summary');
    if(user&&elapsed>0){
      sb.from('workout_logs').insert({
        user_id:user.id,
        date:new Date().toISOString().split('T')[0],
        type:'run',
        duration_min:Math.round(elapsed/60),
        distance_m:dist>0?Math.round(dist*1000):null,
        calories:cals,
        workout:{focus:todayFocus,type:'run',mode:'manual',duration_sec:elapsed,distance_km:dist,avg_pace:avgPace,effort:runEffort}
      }).catch(()=>{});
    }
  }

  const HYROX_RACE_SEGS=[];
  for(let i=0;i<8;i++){
    HYROX_RACE_SEGS.push({type:'run',index:i,label:`RUN ${i+1}`,target:'1km'});
    HYROX_RACE_SEGS.push({type:'station',index:i,...HYROX_STATIONS[i]});
  }

  function startHyroxTotalTimer(){
    hyroxTotalTimerRef.current=setInterval(()=>setHyroxTotalElapsed(p=>p+1),1000);
  }
  function startHyroxSegTimer(){
    clearInterval(hyroxSegTimerRef.current);
    setHyroxSegElapsed(0);
    hyroxSegTimerRef.current=setInterval(()=>setHyroxSegElapsed(p=>p+1),1000);
  }
  function stopAllHyroxTimers(){
    clearInterval(hyroxTotalTimerRef.current);
    clearInterval(hyroxSegTimerRef.current);
  }

  function startRaceSim(){
    setHyroxType('race_sim');
    setHyroxCurrentSeg(0);
    setHyroxSegTimes([]);
    setHyroxTotalElapsed(0);
    setHyroxSegElapsed(0);
    setSessionMode('hyrox-sim');
    startHyroxTotalTimer();
    startHyroxSegTimer();
  }

  function completeHyroxSegment(){
    const seg=HYROX_RACE_SEGS[hyroxCurrentSeg];
    const segTime=hyroxSegElapsed;
    setHyroxSegTimes(p=>[...p,{...seg,elapsed:segTime}]);
    if(hyroxCurrentSeg>=HYROX_RACE_SEGS.length-1){
      stopAllHyroxTimers();
      const allTimes=[...hyroxSegTimes,{...seg,elapsed:segTime}];
      setHyroxSummary({type:'race_sim',totalElapsed:hyroxTotalElapsed,segments:allTimes});
      setSessionMode('hyrox-summary');
      saveHyroxSession('race_sim',hyroxTotalElapsed,allTimes);
    } else {
      setHyroxCurrentSeg(p=>p+1);
      startHyroxSegTimer();
    }
  }

  function startWOD(){
    const weakStations=(wPrefs?.hyroxWeakStations||profile?.hyrox_weak_stations||[]).slice(0,4);
    const stations=weakStations.length>0?weakStations:['SkiErg','Row','Wall Balls','Burpee Broad Jump'];
    const equipment=Array.isArray(profile?.hyrox_equipment)?profile.hyrox_equipment:(wPrefs?.hyroxEquipment?[wPrefs.hyroxEquipment]:[]);
    const hasFullGym=equipment.includes('full_gym');
    const stationObjs=stations.map(name=>{
      const base=HYROX_STATIONS.find(s=>s.name===name)||{name,distance:'',tip:''};
      const sub=HYROX_SUBSTITUTIONS[name];
      if(sub&&!hasFullGym&&!equipment.includes(sub.equipment_needed)){
        return{...base,name:sub.substitute,tip:sub.note,isSubstituted:true,originalName:name};
      }
      return base;
    }).filter(Boolean);
    setHyroxWodStations(stationObjs);
    setHyroxWodCurStation(0);
    setHyroxWodCurRound(0);
    setHyroxTotalElapsed(0);
    setHyroxSegElapsed(0);
    setHyroxSegTimes([]);
    setSessionMode('hyrox-wod');
    startHyroxTotalTimer();
    startHyroxSegTimer();
  }

  function completeWODStation(){
    const st=hyroxWodStations[hyroxWodCurStation];
    const segTime=hyroxSegElapsed;
    setHyroxSegTimes(p=>[...p,{...st,round:hyroxWodCurRound+1,elapsed:segTime}]);
    const nextStation=hyroxWodCurStation+1;
    if(nextStation>=hyroxWodStations.length){
      const nextRound=hyroxWodCurRound+1;
      if(nextRound>=hyroxWodRounds){
        stopAllHyroxTimers();
        const allTimes=[...hyroxSegTimes,{...st,round:hyroxWodCurRound+1,elapsed:segTime}];
        setHyroxSummary({type:'station_wod',totalElapsed:hyroxTotalElapsed,segments:allTimes,rounds:hyroxWodRounds});
        setSessionMode('hyrox-summary');
        saveHyroxSession('station_wod',hyroxTotalElapsed,allTimes);
      } else {
        setHyroxWodCurRound(nextRound);
        setHyroxWodCurStation(0);
        startHyroxSegTimer();
      }
    } else {
      setHyroxWodCurStation(nextStation);
      startHyroxSegTimer();
    }
  }

  function saveHyroxSession(mode,totalSec,segments){
    if(!user)return;
    const station_times={};
    segments.forEach(seg=>{
      const key=seg.type==='run'?`Run${seg.index+1}`:seg.name;
      station_times[key]=seg.elapsed;
    });
    sb.from('workout_logs').insert({
      user_id:user.id,
      date:new Date().toISOString().split('T')[0],
      type:'hyrox',
      duration_min:Math.round(totalSec/60),
      workout:{
        focus:todayFocus,type:'hyrox',session_mode:mode,
        station_times,total_time:totalSec,
        stations_completed:segments.filter(s=>s.type==='station').length
      }
    }).catch(()=>{});
  }

  function renderRunPicker(){
    const todayRun=todayPrescription;
    const headline=(todayRun?.label||todayRun?.type||'RUN').toUpperCase();
    const target=todayRun?.duration?`TARGET: ${todayRun.duration} min`:todayRun?.distance?`TARGET: ${todayRun.distance} km`:'';
    return(
      <div style={{padding:"24px 0"}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// TODAY'S RUN</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,lineHeight:0.9,marginBottom:16,textTransform:"uppercase"}}>
          {headline}<span style={{color:"var(--accent)"}}>.</span>
        </div>
        {target&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",marginBottom:24,textTransform:"uppercase"}}>{target}</div>}
        <div onClick={startGPSRun} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:18,marginBottom:10,display:"flex",gap:14,cursor:"pointer",alignItems:"flex-start"}}>
          <div style={{background:"rgba(var(--accent-rgb),0.1)",borderRadius:10,padding:12,flexShrink:0}}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round"><circle cx={12} cy={12} r={3}/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          </div>
          <div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",marginBottom:4}}>TRACK WITH GPS.</div>
            <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>Live pace, distance, and route tracking using your phone GPS.</div>
          </div>
        </div>
        <div onClick={startManualRun} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:18,display:"flex",gap:14,cursor:"pointer",alignItems:"flex-start"}}>
          <div style={{background:"rgba(245,245,240,0.06)",borderRadius:10,padding:12,flexShrink:0}}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.5)" strokeWidth={2} strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",marginBottom:4}}>LOG MANUALLY.</div>
            <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>For treadmill or when you track with another device. Enter distance and time at the end.</div>
          </div>
        </div>
      </div>
    );
  }

  function renderGPSRunScreen(){
    return(
      <div style={{textAlign:"center",paddingTop:20,position:"relative"}}>
        <div style={{position:"absolute",top:-60,left:"50%",transform:"translateX(-50%)",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(var(--accent-rgb),0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>
        {runGpsError&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(var(--accent-rgb),0.7)",marginBottom:12,padding:"6px 12px",background:"rgba(var(--accent-rgb),0.08)",borderRadius:8}}>GPS unavailable — tracking time only</div>}
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:64,color:"#f5f5f0",lineHeight:1,marginBottom:16,fontVariantNumeric:"tabular-nums"}}>{fmtTime(runElapsed)}</div>
        <div style={{display:"flex",justifyContent:"center",gap:32,marginBottom:32}}>
          <div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#f5f5f0"}}>{runCurrentPace}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>pace /km</div>
          </div>
          <div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color:"var(--accent)"}}>{runDistance.toFixed(2)}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>km</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:28}}>
          {[{l:"AVG PACE",v:runAvgPace},{l:"CALORIES",v:Math.round(runElapsed/60*8.5)},{l:"LAPS",v:runLaps.length}].map(({l,v})=>(
            <div key={l} style={{flex:1,background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{l}</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{setRunLaps(p=>[...p,{km:runLaps.length+1,time:runElapsed,dist:runDistance}]);}} style={{width:64,height:64,borderRadius:"50%",background:"rgba(245,245,240,0.06)",border:"1px solid rgba(245,245,240,0.1)",color:"#f5f5f0",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>LAP</button>
          <button onClick={finishGPSRun} style={{flex:1,padding:"16px 24px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>FINISH RUN →</button>
        </div>
      </div>
    );
  }

  function renderManualRunScreen(){
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// MANUAL RUN</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,color:"#f5f5f0",lineHeight:1,marginBottom:8,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>{fmtTime(runElapsed)}</div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",textAlign:"center",marginBottom:32}}>ELAPSED TIME</div>
        <button onClick={stopManualRunAndShowForm} style={{width:"100%",padding:"16px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>FINISH RUN →</button>
      </div>
    );
  }

  function renderManualRunFinishScreen(){
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// LOG YOUR RUN</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,marginBottom:24}}>HOW FAR DID YOU GO<span style={{color:"var(--accent)"}}>?</span></div>
        <div style={{marginBottom:16}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>DISTANCE (km)</div>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={runManualDist}
            onChange={e=>setRunManualDist(e.target.value)}
            style={{width:"100%",boxSizing:"border-box",background:"#0d0d0d",border:"1.5px solid rgba(var(--accent-rgb),0.3)",borderRadius:12,padding:"16px",color:"#f5f5f0",fontSize:24,fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,outline:"none",textAlign:"center"}}
          />
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>EFFORT LEVEL</div>
          <div style={{display:"flex",gap:8}}>
            {[{v:1,l:"Easy"},{v:2,l:"Moderate"},{v:3,l:"Hard"},{v:4,l:"Max"}].map(({v,l})=>(
              <button key={v} onClick={()=>setRunEffort(v)} style={{flex:1,padding:"10px 4px",background:runEffort===v?"rgba(var(--accent-rgb),0.15)":"#0d0d0d",border:`1.5px solid ${runEffort===v?"var(--accent)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:runEffort===v?"var(--accent)":"rgba(245,245,240,0.5)",fontFamily:"var(--mono)",fontSize:9,fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",marginBottom:16,textAlign:"center"}}>Time: {fmtTime(runElapsed)}</div>
        <button onClick={finishManualRun} style={{width:"100%",padding:"16px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>SAVE RUN →</button>
      </div>
    );
  }

  function renderRunSummary(){
    if(!runSummary)return null;
    const {elapsed,distance,avgPace,calories,laps}=runSummary;
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// RUN COMPLETE</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,lineHeight:0.9,marginBottom:24}}>
          NICE WORK<span style={{color:"var(--accent)"}}>.</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
          {[
            {l:"DISTANCE",v:distance>0?`${distance.toFixed(2)} km`:"—"},
            {l:"TIME",v:fmtTime(elapsed)},
            {l:"AVG PACE",v:avgPace},
            {l:"CALORIES",v:`${calories} kcal`}
          ].map(({l,v})=>(
            <div key={l} style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12,padding:"16px",textAlign:"center"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>{l}</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0"}}>{v}</div>
            </div>
          ))}
        </div>
        {laps?.length>0&&<>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.16em",marginBottom:8}}>// Splits</div>
          {laps.map((lap,i)=>{
            const lapTime=i===0?lap.time:lap.time-laps[i-1].time;
            const avgLapTime=elapsed/Math.max(laps.length,1);
            const isFaster=lapTime<avgLapTime;
            return(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(245,245,240,0.06)"}}>
                <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",textTransform:"uppercase"}}>KM {i+1}</span>
                <span style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:isFaster?"#22c55e":"var(--accent)"}}>{fmtTime(lapTime)}</span>
              </div>
            );
          })}
        </>}
        <button onClick={()=>{setSessionMode(null);clearWorkoutSummary();}} style={{width:"100%",marginTop:24,padding:"16px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>SAVE & EXIT →</button>
      </div>
    );
  }

  function renderHyroxPicker(){
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// HYROX SESSION</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,lineHeight:0.9,marginBottom:24}}>
          WHAT TYPE OF<br/><span style={{color:"#FC4C02"}}>SESSION?</span>
        </div>
        {[
          {e:"🏁",l:"RACE SIMULATION.",sub:"Full race · All 8 stations · Race distances · 60-90 min",fn:startRaceSim},
          {e:"⚡",l:"STATION WOD.",sub:`Coach picks your weakest stations · Multiple rounds · 20-40 min`,fn:()=>{setHyroxType('station_wod');startWOD();}},
          {e:"🎯",l:"WEAKNESS FOCUS.",sub:"Single station deep work · Intervals · Build the station costing you time",fn:()=>{setHyroxWeaknessStation(null);setSessionMode('hyrox-weakness-picker');}},
          {e:"🏃",l:"RUN INTERVALS.",sub:"Race-pace running · Builds the 8km running fitness most Hyrox athletes neglect",fn:()=>{setSessionMode('run-picker');}},
        ].map((o,i)=>(
          <div key={i} onClick={o.fn} style={{background:"#0d0d0d",border:"1px solid rgba(252,76,2,0.12)",borderRadius:14,padding:"18px",marginBottom:10,cursor:"pointer",display:"flex",gap:16,alignItems:"flex-start"}}>
            <div style={{fontSize:28,flexShrink:0}}>{o.e}</div>
            <div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",marginBottom:4}}>{o.l}</div>
              <div style={{fontFamily:"var(--body)",fontSize:12,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>{o.sub}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderHyroxRaceSim(){
    const seg=HYROX_RACE_SEGS[hyroxCurrentSeg]||HYROX_RACE_SEGS[0];
    const isRun=seg.type==='run';
    return(
      <div style={{paddingTop:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>// RACE SIMULATION</div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,lineHeight:1,color:"#f5f5f0",fontVariantNumeric:"tabular-nums"}}>{fmtTime(hyroxTotalElapsed)}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase"}}>total time</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",marginBottom:2}}>segment</div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:isRun?"#22c55e":"#FC4C02"}}>{hyroxCurrentSeg+1}/16</div>
          </div>
        </div>
        <div style={{display:"flex",gap:4,marginBottom:20,alignItems:"center"}}>
          {HYROX_STATIONS.map((_,i)=>{
            const stationSegIdx=i*2+1;
            const done=stationSegIdx<hyroxCurrentSeg;
            const current=stationSegIdx===hyroxCurrentSeg;
            const isRunCurrent=stationSegIdx-1===hyroxCurrentSeg;
            return(
              <div key={i} style={{flex:1,textAlign:"center"}}>
                <div style={{width:"100%",height:6,borderRadius:3,background:done?"#22c55e":current||isRunCurrent?"#FC4C02":"rgba(245,245,240,0.1)",transition:"background 0.3s"}}/>
                <div style={{fontFamily:"var(--mono)",fontSize:6,color:done?"#22c55e":current?"#FC4C02":"rgba(245,245,240,0.2)",marginTop:2,textTransform:"uppercase"}}>{i+1}</div>
              </div>
            );
          })}
        </div>
        <div style={{background:isRun?"rgba(34,197,94,0.06)":"#0d0d0d",border:`1px solid ${isRun?"rgba(34,197,94,0.2)":"rgba(252,76,2,0.2)"}`,borderRadius:14,padding:18,marginBottom:20}}>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:26,color:"#f5f5f0",marginBottom:4}}>
            {isRun?"1KM RUN.":(seg.name||"STATION")+"."}<span style={{color:isRun?"#22c55e":"#FC4C02"}}>.</span>
          </div>
          {!isRun&&<div style={{fontFamily:"var(--condensed)",fontWeight:700,fontSize:18,color:"rgba(245,245,240,0.6)",marginBottom:8}}>{seg.distance||seg.reps||""}</div>}
          {isRun&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",marginBottom:8}}>RECOVER AND PACE.</div>}
          {!isRun&&seg.tip&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",fontStyle:"italic",lineHeight:1.5,marginBottom:14}}>{seg.tip}</div>}
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,color:isRun?"#22c55e":"#FC4C02",fontVariantNumeric:"tabular-nums",marginBottom:16}}>{fmtTime(hyroxSegElapsed)}</div>
          <button onClick={completeHyroxSegment} style={{width:"100%",padding:"16px",background:isRun?"#22c55e":"#FC4C02",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>
            {isRun?"COMPLETE RUN →":"COMPLETE STATION →"}
          </button>
        </div>
        {hyroxSegTimes.length>0&&<div style={{marginBottom:16}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// Completed</div>
          {hyroxSegTimes.slice(-3).map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(245,245,240,0.05)"}}>
              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.45)",textTransform:"uppercase"}}>{s.type==='run'?`Run ${s.index+1}`:s.name}</span>
              <span style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:14,color:s.type==='run'?"#22c55e":"#f5f5f0"}}>{fmtTime(s.elapsed)}</span>
            </div>
          ))}
        </div>}
      </div>
    );
  }

  function renderHyroxWOD(){
    const st=hyroxWodStations[hyroxWodCurStation];
    if(!st)return null;
    const totalSteps=hyroxWodRounds*hyroxWodStations.length;
    const doneSteps=hyroxWodCurRound*hyroxWodStations.length+hyroxWodCurStation;
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// STATION WOD</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#f5f5f0"}}>{fmtTime(hyroxTotalElapsed)}</div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)"}}>ROUND {hyroxWodCurRound+1} of {hyroxWodRounds}</div>
        </div>
        <div style={{height:3,background:"rgba(245,245,240,0.06)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
          <div style={{height:"100%",background:"#FC4C02",width:`${(doneSteps/totalSteps)*100}%`,transition:"width 0.4s"}}/>
        </div>
        <div style={{background:"#0d0d0d",border:"1px solid rgba(252,76,2,0.2)",borderRadius:14,padding:18,marginBottom:20}}>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:26,color:"#f5f5f0",marginBottom:4}}>{(st.name||"").toUpperCase()}<span style={{color:"#FC4C02"}}>.</span></div>
          {st.isSubstituted&&<div style={{marginBottom:6}}><span style={{display:"inline-block",background:"rgba(254,160,32,0.08)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:4,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"rgba(254,160,32,0.7)",letterSpacing:"0.08em",textTransform:"uppercase"}}>// EQUIPMENT SUBSTITUTION</span></div>}
          {(st.distance||st.reps)&&<div style={{fontFamily:"var(--condensed)",fontWeight:700,fontSize:18,color:"rgba(245,245,240,0.6)",marginBottom:8}}>{st.distance||st.reps}</div>}
          {st.tip&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",fontStyle:"italic",lineHeight:1.5,marginBottom:14}}>{st.tip}</div>}
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,color:"#FC4C02",fontVariantNumeric:"tabular-nums",marginBottom:16}}>{fmtTime(hyroxSegElapsed)}</div>
          <button onClick={completeWODStation} style={{width:"100%",padding:"16px",background:"#FC4C02",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>COMPLETE STATION →</button>
        </div>
      </div>
    );
  }

  function renderHyroxWeaknessPicker(){
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// WEAKNESS FOCUS</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,lineHeight:0.9,marginBottom:6}}>
          PICK YOUR<br/><span style={{color:"#FC4C02"}}>STATION.</span>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",marginBottom:20,lineHeight:1.5}}>Single station · 5 rounds · Build the weakness costing you time</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {HYROX_STATIONS.map((st,i)=>{
            const sel=hyroxWeaknessStation===st.name;
            return(
              <div key={i} onClick={()=>setHyroxWeaknessStation(st.name)} style={{background:sel?"rgba(252,76,2,0.12)":"#0d0d0d",border:`1px solid ${sel?"rgba(252,76,2,0.4)":"rgba(252,76,2,0.1)"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}>
                <div>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:17,color:"#f5f5f0"}}>{st.name}</div>
                  {st.distance&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2,textTransform:"uppercase"}}>{st.distance}</div>}
                </div>
                {sel&&<div style={{width:20,height:20,borderRadius:"50%",background:"#FC4C02",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>}
              </div>
            );
          })}
        </div>
        <button
          onClick={()=>{
            if(!hyroxWeaknessStation)return;
            const st=HYROX_STATIONS.find(s=>s.name===hyroxWeaknessStation);
            if(!st)return;
            setHyroxWodStations([st]);
            setHyroxWodRounds(5);
            setHyroxWodCurStation(0);
            setHyroxWodCurRound(0);
            setHyroxTotalElapsed(0);
            setHyroxSegElapsed(0);
            setHyroxSegTimes([]);
            setHyroxType('weakness_focus');
            setSessionMode('hyrox-wod');
            startHyroxTotalTimer();
            startHyroxSegTimer();
          }}
          disabled={!hyroxWeaknessStation}
          style={{width:"100%",padding:"16px",background:hyroxWeaknessStation?"#FC4C02":"rgba(245,245,240,0.08)",border:"none",borderRadius:12,color:hyroxWeaknessStation?"#fff":"rgba(245,245,240,0.3)",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:hyroxWeaknessStation?"pointer":"not-allowed",transition:"all .2s"}}
        >START FOCUS SESSION →</button>
      </div>
    );
  }

  function renderHyroxSummary(){
    if(!hyroxSummary)return null;
    const {type,totalElapsed,segments}=hyroxSummary;
    return(
      <div style={{paddingTop:20}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// SESSION COMPLETE</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,lineHeight:0.9,marginBottom:20}}>
          DONE<span style={{color:"#FC4C02"}}>.</span>
        </div>
        <div style={{background:"#0d0d0d",border:"1px solid rgba(252,76,2,0.08)",borderRadius:12,padding:16,marginBottom:16,textAlign:"center"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>TOTAL TIME</div>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,color:"#f5f5f0"}}>{fmtTime(totalElapsed)}</div>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// Segment Splits</div>
        {segments.map((s,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(245,245,240,0.05)"}}>
            <span style={{fontFamily:"var(--mono)",fontSize:9,color:s.type==='run'?"rgba(34,197,94,0.7)":"rgba(245,245,240,0.55)",textTransform:"uppercase"}}>{s.type==='run'?`Run ${s.index+1}`:s.round!=null?`${s.name||""} R${s.round}`:(s.name||"")}</span>
            <span style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:s.type==='run'?"#22c55e":"#f5f5f0"}}>{fmtTime(s.elapsed)}</span>
          </div>
        ))}
        <button onClick={()=>{setSessionMode(null);clearWorkoutSummary();}} style={{width:"100%",marginTop:24,padding:"16px",background:"#FC4C02",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>SAVE & EXIT →</button>
      </div>
    );
  }

  return (
    <div className={GOCLUB_REDESIGN?"goclub tab-train":"page-enter"} style={{paddingBottom:isMobile?20:0}}>
      {GOCLUB_REDESIGN&&<style>{_TRAIN_GOCLUB_CSS}</style>}
      {/* Adapt Now Modal */}
      {showAdapt&&<AdaptNowModal wPrefs={wPrefs} profile={profile} todayFocus={todayFocus} todayExercises={Array.isArray(todayPrescription)?todayPrescription:[]} adaptationsLeft={adaptLeft} adaptationsUsed={adaptUsed} adaptLimit={adaptLimit} adaptResetDate={adaptResetDate} onUseAdapted={useAdaptedSession} onClose={()=>setShowAdapt(false)} user={user} schedule={schedule} setSchedule={setSchedule} todayKey={todayKey}/>}

      {/* Swap Exercise Modal */}
      {swapModal&&(()=>{
        const opts=getSwapOptions(swapModal.originalName,wPrefs.equipment||"Full Gym");
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(8px)",zIndex:250,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSwapModal(null)}>
            <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:"18px 18px 0 0",padding:"20px 20px 40px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
              <div style={{width:32,height:3,background:"rgba(var(--accent-rgb),0.15)",borderRadius:2,margin:"0 auto 20px"}}/>
              <div style={{fontSize:10,color:"rgba(245,245,240,.4)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>SWAP EXERCISE</div>
              <div style={{fontSize:18,fontWeight:700,marginBottom:2}}>{swapModal.exerciseName}</div>
              <div style={{fontSize:12,color:"rgba(245,245,240,.4)",marginBottom:18}}>Choose a replacement — same muscle group</div>
              {opts.length>0
                ?<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
                  {opts.map((opt,i)=>(
                    <button key={i} onClick={()=>setSelectedSwap(selectedSwap===opt.name?null:opt.name)}
                      style={{padding:"12px 16px",background:selectedSwap===opt.name?"rgba(var(--accent-rgb),.12)":"rgba(var(--accent-rgb),0.04)",border:`1.5px solid ${selectedSwap===opt.name?"rgba(var(--accent-rgb),.45)":"rgba(var(--accent-rgb),0.08)"}`,borderRadius:10,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"inherit"}}>
                      <span style={{fontSize:14,fontWeight:600,color:"#fff"}}>{opt.name}</span>
                      {selectedSwap===opt.name&&<span style={{fontSize:14,color:T.prot}}>✓</span>}
                    </button>
                  ))}
                </div>
                :<div style={{fontSize:13,color:"rgba(245,245,240,.4)",textAlign:"center",padding:"16px 0",marginBottom:18}}>No alternatives for this equipment setup.</div>
              }
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,padding:"12px 14px",background:"rgba(var(--accent-rgb),0.03)",borderRadius:10,border:"1px solid rgba(var(--accent-rgb),0.06)"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>Make permanent</div>
                  <div style={{fontSize:11,color:"rgba(245,245,240,.4)"}}>Always replace this exercise in my plan</div>
                </div>
                <button onClick={()=>setSwapPermanent(p=>!p)} style={{width:40,height:24,borderRadius:12,border:"none",background:swapPermanent?T.prot:"rgba(var(--accent-rgb),0.12)",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,transition:"left .2s",left:swapPermanent?19:3}}/>
                </button>
              </div>
              <button onClick={()=>selectedSwap&&applySwap(swapModal.exerciseIdx,selectedSwap,swapPermanent,swapModal.originalName)} disabled={!selectedSwap}
                style={{width:"100%",padding:15,background:selectedSwap?T.prot:"rgba(var(--accent-rgb),0.05)",color:selectedSwap?"#fff":"rgba(245,245,240,.25)",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:selectedSwap?"pointer":"not-allowed",fontFamily:"inherit",marginBottom:10,transition:"all .2s"}}>
                Swap Exercise →
              </button>
              <button onClick={()=>setSwapModal(null)} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* Pre-session Readiness Modal */}
      {/* ── Pre-session check-in — paper/ink (GOCLUB redesign) ── */}
      {showReadiness&&GOCLUB_REDESIGN&&(()=>{
        const _ciMO="'DM Mono',monospace";
        const _ciBC="'Barlow Condensed',sans-serif";
        const _ciAF="'Barlow',sans-serif";
        const _dispWk=programCurrentWeek||weekNum;
        // shared pill style builders (no T.* tokens)
        const _pillSel={background:"var(--cm-red)",color:"#fff",border:"1.5px solid var(--cm-red)"};
        const _pillOff={background:"rgba(var(--cm-ink-rgb),.05)",color:"var(--cm-ink)",border:"1.5px solid rgba(var(--cm-ink-rgb),.12)"};
        const _pillBase={borderRadius:9,fontWeight:700,cursor:"pointer",fontFamily:_ciAF,transition:"all .15s",minHeight:"auto",minWidth:"auto"};
        const _labelStyle={fontFamily:_ciMO,fontSize:10,fontWeight:700,letterSpacing:".13em",textTransform:"uppercase",color:"rgba(var(--cm-ink-rgb),.50)",marginBottom:8};
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(4px)",zIndex:260,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={skipReadiness}>
            <div style={{background:"var(--cm-paper)",borderRadius:"26px 26px 0 0",maxWidth:480,width:"100%",overflow:"hidden",boxShadow:"0 -6px 40px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
              {/* Drag handle */}
              <div style={{width:36,height:4,borderRadius:2,background:"rgba(var(--cm-ink-rgb),.12)",margin:"14px auto 0"}}/>
              {/* Red hero strip */}
              <div style={{background:"var(--cm-red)",padding:"16px 20px 18px",marginTop:12}}>
                <div style={{fontFamily:_ciMO,fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.65)",marginBottom:5}}>
                  {todayFocus} · Week {_dispWk}
                </div>
                <div style={{fontFamily:_ciBC,fontStyle:"italic",fontWeight:900,fontSize:28,color:"#fff",lineHeight:0.95,textTransform:"uppercase"}}>
                  Ready to train?
                </div>
              </div>
              {/* Form */}
              <div style={{padding:"20px 20px 36px",overflowY:"auto",maxHeight:"65vh"}}>
                {/* Sleep */}
                <div style={{marginBottom:18}}>
                  <div style={_labelStyle}>Last Night's Sleep</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {["4","5","6","7","8","9+"].map(v=>(
                      <button key={v} onClick={()=>setRdAnswers(a=>({...a,sleep:v}))}
                        style={{..._pillBase,...(rdAnswers.sleep===v?_pillSel:_pillOff),padding:"8px 14px",fontSize:14}}>
                        {v}h
                      </button>
                    ))}
                  </div>
                </div>
                {/* Stress */}
                <div style={{marginBottom:18}}>
                  <div style={_labelStyle}>Stress Level</div>
                  <div style={{display:"flex",gap:8}}>
                    {[["low","Low"],["medium","Medium"],["high","High"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setRdAnswers(a=>({...a,stress:v}))}
                        style={{..._pillBase,...(rdAnswers.stress===v?_pillSel:_pillOff),flex:1,padding:"10px 6px",fontSize:13,textAlign:"center"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Energy */}
                <div style={{marginBottom:18}}>
                  <div style={_labelStyle}>Energy</div>
                  <div style={{display:"flex",gap:8}}>
                    {[["low","Low"],["normal","Normal"],["high","High"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setRdAnswers(a=>({...a,energy:v}))}
                        style={{..._pillBase,...(rdAnswers.energy===v?_pillSel:_pillOff),flex:1,padding:"10px 6px",fontSize:13,textAlign:"center"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Pain level */}
                <div style={{marginBottom:18}}>
                  <div style={_labelStyle}>Any Soreness?</div>
                  <div style={{display:"flex",gap:8}}>
                    {[["none","None"],["minor","A little"],["significant","A lot"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setRdAnswers(a=>({...a,painLevel:v,painRegions:[],painType:null}))}
                        style={{..._pillBase,...(rdAnswers.painLevel===v?_pillSel:_pillOff),flex:1,padding:"10px 6px",fontSize:13,textAlign:"center"}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Pain regions — shown only when non-None selected (already gated) */}
                {(rdAnswers.painLevel==="minor"||rdAnswers.painLevel==="significant")&&(
                  <div style={{marginBottom:18}}>
                    <div style={_labelStyle}>Where?</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {["shoulder","elbow","wrist","lower_back","hip","knee","ankle","neck","other"].map(r=>{
                        const sel=(rdAnswers.painRegions||[]).includes(r);
                        return(
                          <button key={r}
                            onClick={()=>setRdAnswers(a=>{const cur=a.painRegions||[];return{...a,painRegions:sel?cur.filter(x=>x!==r):[...cur,r]};})}
                            style={{..._pillBase,...(sel?_pillSel:_pillOff),padding:"7px 12px",fontSize:12,textTransform:"capitalize"}}>
                            {r.replace("_"," ")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* Pain type — shown only when regions selected (already gated) */}
                {(rdAnswers.painLevel==="minor"||rdAnswers.painLevel==="significant")&&(rdAnswers.painRegions||[]).length>0&&(
                  <div style={{marginBottom:18}}>
                    <div style={_labelStyle}>What kind?</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {[["soreness","Soreness"],["sharp_pain","Sharp Pain"],["stiffness","Stiffness"],["weakness","Weakness"],["swelling","Swelling"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setRdAnswers(a=>({...a,painType:v}))}
                          style={{..._pillBase,...(rdAnswers.painType===v?_pillSel:_pillOff),padding:"7px 12px",fontSize:12}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Readiness preview — semantic color retained; text in ink tokens */}
                {rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy&&(()=>{
                  const s=scoreReadiness({sleep:rdAnswers.sleep,stress:rdAnswers.stress,energy:rdAnswers.energy});
                  const tier=getReadinessTier(s);
                  const cfg=READINESS_CONFIG[tier];
                  return(
                    <div style={{background:`${cfg.color}14`,border:`1.5px solid ${cfg.color}45`,borderRadius:12,padding:"12px 16px",marginBottom:18}}>
                      <div style={{fontSize:10,color:cfg.color,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>{cfg.badge}</div>
                      <div style={{fontFamily:_ciBC,fontStyle:"italic",fontWeight:900,fontSize:18,color:"var(--cm-ink)",lineHeight:1.1}}>{cfg.label}</div>
                      <div style={{fontFamily:_ciMO,fontSize:10,color:"rgba(var(--cm-ink-rgb),.55)",marginTop:3,lineHeight:1.5}}>{cfg.sub}</div>
                    </div>
                  );
                })()}
                {/* Submit */}
                <button onClick={confirmReadiness} disabled={!rdAnswers.sleep||!rdAnswers.stress||!rdAnswers.energy}
                  style={{width:"100%",padding:15,background:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"var(--cm-red)":"rgba(var(--cm-ink-rgb),.08)",color:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"#fff":"rgba(var(--cm-ink-rgb),.3)",border:"none",borderRadius:14,fontWeight:700,fontSize:16,cursor:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"pointer":"not-allowed",fontFamily:_ciBC,fontStyle:"italic",textTransform:"uppercase",letterSpacing:".04em",marginBottom:10,transition:"all .2s",minHeight:"auto"}}>
                  Start Session →
                </button>
                {/* Skip — quiet ink link */}
                <button onClick={skipReadiness}
                  style={{width:"100%",padding:10,background:"transparent",color:"rgba(var(--cm-ink-rgb),.40)",border:"none",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:_ciAF,minHeight:"auto"}}>
                  Skip check-in
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Pre-session check-in — dark legacy (non-redesign) ── */}
      {showReadiness&&!GOCLUB_REDESIGN&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(8px)",zIndex:260,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={skipReadiness}>
          <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:"18px 18px 0 0",padding:"24px 20px 40px",maxWidth:480,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{width:32,height:3,background:"rgba(var(--accent-rgb),0.15)",borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",marginBottom:4,fontFamily:"var(--mono)"}}>Pre-Session Check-In</div>
            <div style={{fontFamily:"var(--condensed)",fontSize:24,fontWeight:900,marginBottom:20}}>How are you feeling?</div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Sleep last night</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["4","5","6","7","8","9+"].map(v=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,sleep:v}))} style={{padding:"8px 14px",borderRadius:9,border:`1.5px solid ${rdAnswers.sleep===v?T.prot:T.bd}`,background:rdAnswers.sleep===v?`rgba(var(--accent-rgb),0.09)`:T.s2,color:rdAnswers.sleep===v?T.prot:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{v}h</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Stress level</div>
              <div style={{display:"flex",gap:8}}>
                {[["low","Low"],["medium","Medium"],["high","High"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,stress:v}))} style={{flex:1,padding:"10px 6px",borderRadius:9,border:`1.5px solid ${rdAnswers.stress===v?T.prot:T.bd}`,background:rdAnswers.stress===v?`rgba(var(--accent-rgb),0.09)`:T.s2,color:rdAnswers.stress===v?T.prot:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Energy</div>
              <div style={{display:"flex",gap:8}}>
                {[["low","Low"],["normal","Normal"],["high","High"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,energy:v}))} style={{flex:1,padding:"10px 6px",borderRadius:9,border:`1.5px solid ${rdAnswers.energy===v?T.prot:T.bd}`,background:rdAnswers.energy===v?`rgba(var(--accent-rgb),0.09)`:T.s2,color:rdAnswers.energy===v?T.prot:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Any pain or discomfort?</div>
              <div style={{display:"flex",gap:8}}>
                {[["none","None"],["minor","Minor"],["significant","Significant"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setRdAnswers(a=>({...a,painLevel:v,painRegions:[],painType:null}))} style={{flex:1,padding:"10px 6px",borderRadius:9,border:`1.5px solid ${rdAnswers.painLevel===v?T.prot:T.bd}`,background:rdAnswers.painLevel===v?`rgba(var(--accent-rgb),0.09)`:T.s2,color:rdAnswers.painLevel===v?T.prot:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>
                ))}
              </div>
            </div>
            {(rdAnswers.painLevel==="minor"||rdAnswers.painLevel==="significant")&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>Where?</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {["shoulder","elbow","wrist","lower_back","hip","knee","ankle","neck","other"].map(r=>{
                    const sel=(rdAnswers.painRegions||[]).includes(r);
                    return(<button key={r} onClick={()=>setRdAnswers(a=>{const cur=a.painRegions||[];return{...a,painRegions:sel?cur.filter(x=>x!==r):[...cur,r]};})} style={{padding:"7px 12px",borderRadius:8,border:`1.5px solid ${sel?T.prot:T.bd}`,background:sel?`rgba(var(--accent-rgb),0.09)`:T.s2,color:sel?T.prot:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{r.replace("_"," ")}</button>);
                  })}
                </div>
              </div>
            )}
            {(rdAnswers.painLevel==="minor"||rdAnswers.painLevel==="significant")&&(rdAnswers.painRegions||[]).length>0&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>What kind?</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {[["soreness","Soreness"],["sharp_pain","Sharp Pain"],["stiffness","Stiffness"],["weakness","Weakness"],["swelling","Swelling"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setRdAnswers(a=>({...a,painType:v}))} style={{padding:"7px 12px",borderRadius:8,border:`1.5px solid ${rdAnswers.painType===v?T.prot:T.bd}`,background:rdAnswers.painType===v?`rgba(var(--accent-rgb),0.09)`:T.s2,color:rdAnswers.painType===v?T.prot:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                  ))}
                </div>
              </div>
            )}
            {rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy&&(()=>{
              const s=scoreReadiness({sleep:rdAnswers.sleep,stress:rdAnswers.stress,energy:rdAnswers.energy});
              const tier=getReadinessTier(s);
              const cfg=READINESS_CONFIG[tier];
              return(<div style={{background:`${cfg.color}12`,border:`1.5px solid ${cfg.color}40`,borderRadius:12,padding:"12px 16px",marginBottom:16}}><div style={{fontSize:10,color:cfg.color,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>{cfg.badge}</div><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{cfg.label}</div><div style={{fontSize:11,color:T.mu,marginTop:2,maxWidth:220}}>{cfg.sub}</div></div>);
            })()}
            <button onClick={confirmReadiness} disabled={!rdAnswers.sleep||!rdAnswers.stress||!rdAnswers.energy} style={{width:"100%",padding:15,background:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?T.prot:"rgba(var(--accent-rgb),0.06)",color:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"#fff":"rgba(245,245,240,.3)",border:"none",borderRadius:12,fontWeight:700,fontSize:15,cursor:rdAnswers.sleep&&rdAnswers.stress&&rdAnswers.energy?"pointer":"not-allowed",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1,marginBottom:10,transition:"all .2s"}}>Start Session →</button>
            <button onClick={skipReadiness} style={{width:"100%",padding:13,background:"transparent",color:"rgba(245,245,240,.4)",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Skip Check-In</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {adaptToast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),.35)",borderRadius:12,padding:"12px 20px",fontSize:13,fontWeight:600,color:"#fff",zIndex:250,whiteSpace:"nowrap",boxShadow:"0 8px 32px rgba(0,0,0,.6)"}}>{adaptToast}</div>}

      {/* ── PAGE HEADER ── */}
      {trainScreen!=="routine-builder"&&(
        <div className="screen-header" style={{paddingTop:12}}>
          <div style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:10}}>
            {trainScreen!=="today"&&trainScreen!=="active"&&(
              <button onClick={()=>setTrainScreen("today")} style={{background:"none",border:"none",color:"var(--white-dim)",padding:"4px 0",cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",flexShrink:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back
              </button>
            )}
            <div>
              {GOCLUB_REDESIGN?(()=>{
                const _ec=n=>n>=80?'#22C55E':n>=50?'#F59E0B':'#FF3B30';
                const _tIdx=WDAYS.indexOf(todayKey);
                const _wDates=WDAYS.map((_,i)=>{const d=new Date();d.setDate(d.getDate()-_tIdx+i);return d.toISOString().split('T')[0];});
                const _wsSet=new Set(_wDates);
                const _done=new Set(Object.values(history).flatMap(s=>s.filter(x=>_wsSet.has(x.date)).map(x=>x.date))).size;
                const _sched=WDAYS.filter(d=>schedule[d]&&schedule[d]!=='rest').length;
                const _wkPct=_sched>0?Math.round(_done/_sched*100):0;
                const _pages=[
                  <><span style={{color:'rgba(255,255,255,0.4)'}}>RECOVERY</span><span style={{color:'rgba(255,255,255,0.18)',margin:'0 5px'}}>|</span><span style={{color:_ec(_trainRecovPct??100)}}>{_trainRecovPct!=null?`${_trainRecovPct}% ready`:'...'}</span></>,
                  <><span style={{color:'rgba(255,255,255,0.4)'}}>THIS WEEK</span><span style={{color:'rgba(255,255,255,0.18)',margin:'0 5px'}}>|</span><span style={{color:_ec(_wkPct)}}>{_wkPct}% complete</span></>,
                ];
                return(
                  <div className="header-eyebrow"
                    style={{overflow:'hidden',userSelect:'none'}}
                    onPointerDown={e=>{_trainEyeX.current=e.clientX;_trainEyeY.current=e.clientY;}}
                    onPointerUp={e=>{
                      const dx=e.clientX-_trainEyeX.current,dy=e.clientY-_trainEyeY.current;
                      if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)*1.5)_setTrainEyePg(p=>dx<0?Math.min(1,p+1):Math.max(0,p-1));
                    }}
                  >
                    <motion.div
                      animate={{x:_trainEyePg===0?'0%':'-50%'}}
                      transition={_trainEyeRedMo?{duration:0}:{type:'spring',stiffness:500,damping:40}}
                      style={{display:'flex',width:'200%'}}
                    >
                      <div style={{width:'50%'}}>{_pages[0]}</div>
                      <div style={{width:'50%'}}>{_pages[1]}</div>
                    </motion.div>
                  </div>
                );
              })():(
                <div className="header-eyebrow">// {todayFocus||cfg.label}</div>
              )}
              <div className="header-title">{trainScreen==="today"?"Today's Session":trainScreen==="plan"?"My Program":trainScreen==="library"?"Exercise Library":trainScreen==="routine-builder"?"My Routines":trainScreen==="warmup-protocols"?"Protocols":trainScreen==="builder"?"Lift Smarter":trainScreen==="progress"?"Progress":"Train"}</div>
            </div>
          </div>
        </div>
      )}

      <div style={{padding:trainScreen==="routine-builder"?0:GOCLUB_REDESIGN&&(trainScreen==="today"||trainScreen==="plan")?0:isMobile?"12px 18px":"0"}}>

        {/* ── Resume Workout Prompt — today surface only ── */}
        {resumePrompt&&!activeWorkout&&trainScreen==="today"&&(
          <div style={{margin:GOCLUB_REDESIGN?"12px 12px 0":"0 0 14px",padding:"14px 16px",background:GOCLUB_REDESIGN?"rgba(255,255,255,0.90)":"rgba(var(--accent-rgb),0.06)",border:GOCLUB_REDESIGN?"1px solid rgba(255,59,48,0.20)":"1px solid rgba(var(--accent-rgb),0.25)",borderRadius:14,display:"flex",alignItems:"center",gap:12,animation:"toast-in 0.22s ease forwards"}}>
            <div style={{flexShrink:0,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="10" width="4" height="4" rx="1" fill={T.prot}/><rect x="18" y="10" width="4" height="4" rx="1" fill={T.prot}/><rect x="6" y="8" width="12" height="8" rx="2" fill={T.prot} opacity="0.7"/><rect x="10" y="11" width="4" height="2" rx="1" fill={T.prot}/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:2}}>Unfinished session</div>
              <div style={{fontSize:11,color:"rgba(245,245,240,0.5)"}}>You left a workout in progress. Continue where you left off?</div>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button onClick={()=>{setActiveWorkout(resumePrompt);setTrainScreen("active");setResumePrompt(null);hapMed();showToast("Session resumed","success");}} style={{padding:"8px 14px",background:T.prot,border:"none",borderRadius:9,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Resume →</button>
              <button onClick={()=>{setResumePrompt(null);clearPersistedWorkout();}} style={{padding:"8px 10px",background:"none",border:`1px solid ${T.bd}`,borderRadius:9,color:T.mu,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Discard</button>
            </div>
          </div>
        )}

        {/* ── TODAY ── */}
        {trainScreen==="today"&&(()=>{
          // ── shared computed vars (train-today GOCLUB sandwich) ────────────
          const _AF="'Archivo',sans-serif";
          const _MO="'DM Mono',monospace";
          const _todayIdx=WDAYS.indexOf(todayKey);
          const _weekDates=WDAYS.map((_,i)=>{const d=new Date();d.setDate(d.getDate()-_todayIdx+i);return d.toISOString().split('T')[0];});
          const _thisWeekSet=new Set(_weekDates);
          const _doneThisWeek=new Set(Object.values(history).flatMap(s=>s.filter(x=>_thisWeekSet.has(x.date)).map(x=>x.date))).size;
          const _schedThisWeek=WDAYS.filter(d=>schedule[d]&&schedule[d]!=='rest').length;
          const _progInfo2=PROGRAM_LIBRARY.find(p=>p.splitKey===wPrefs.splitType||p.name===wPrefs.splitType)||null;
          const _totalWks=_progInfo2?.weeks||null;
          const _dispWk=programCurrentWeek||weekNum;
          const _wkPct=_totalWks?Math.min(1,(_dispWk-1)/Math.max(1,_totalWks-1)):null;
          const _r=16;
          const _donePct=_schedThisWeek>0?_doneThisWeek/_schedThisWeek:0;
          const heroLvl=(wPrefs.liftExp||profile?.liftExp||"intermediate").toLowerCase();
          const heroIsNov=heroLvl==="beginner"||heroLvl==="novice";
          const heroIsAdv=heroLvl==="advanced"||heroLvl==="elite";
          const heroLevelColor=heroIsNov?"var(--green)":heroIsAdv?"#F87171":"var(--blue)";
          const heroLvlBadge=heroIsNov?"Beginner":heroIsAdv?"Advanced":"Intermediate";
          const _raceTypeLabels={half_marathon:'Half Marathon',half:'Half Marathon','5k':'5K','10k':'10K',marathon:'Marathon',general:'General Fitness'};
          const _raceLabel=_raceTypeLabels[(profile?.run_race_type||'').toLowerCase()]||profile?.run_race_type||'';
          const progLabel=
            wPrefs.isHyrox&&wPrefs.isHybrid?(wPrefs.hybridTemplate||"Hyrox Hybrid"):
            wPrefs.isHyrox?(wPrefs.hyroxProgram||"Hyrox"):
            wPrefs.isHybrid?(_raceLabel?`${wPrefs.hybridTemplate||"Hybrid"} · ${_raceLabel}`:(wPrefs.hybridTemplate||"Hybrid")):
            prescType==="running"?(_raceLabel||wPrefs.runPlan||"Running"):
            wPrefs.splitType||"My Program";
          const muscleDesc=FOCUS_MUSCLES[todayFocus]||"Full body movement";
          const exCount=Array.isArray(todayPrescription)?todayPrescription.length:0;
          const totalSets=Array.isArray(todayPrescription)?todayPrescription.reduce((a,ex)=>a+(Number(ex.sets)||3),0):0;
          const estMin=exCount>0?Math.round(exCount*9+12):0;
          // race phase
          const _rp2=profile?.runProfile;
          let _phaseLabel=null,_phaseColor="rgba(255,255,255,0.70)";
          if(_rp2?.raceDate){
            const _wToRace=Math.ceil((new Date(_rp2.raceDate)-new Date())/(7*24*60*60*1000));
            const _tot2=_rp2.planWeeks??12;
            _phaseLabel=_wToRace>_tot2*0.6?'Base Build':_wToRace>_tot2*0.3?'Build':_wToRace>_tot2*0.15?'Peak':_wToRace>0?'Taper':'Race Week';
            _phaseColor=_phaseLabel==='Taper'?'#FFD60A':_phaseLabel==='Race Week'?'#FFE4E1':'rgba(255,255,255,0.75)';
          }
          return (
            <div>
              {/* ══ RED HERO ═══════════════════════════════════════════════════ */}
              <div style={{paddingLeft:20,paddingRight:20,paddingTop:0,paddingBottom:160}}>
                {/* Eyebrow: program · race phase */}
                <div style={{fontFamily:_MO,fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)",marginBottom:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <span>{progLabel}</span>
                  {_phaseLabel&&<><span style={{color:"rgba(255,255,255,0.22)"}}>·</span><span style={{color:_phaseColor}}>{_phaseLabel}</span></>}
                </div>
                {/* BIG session title */}
                <div style={{fontFamily:_AF,fontWeight:800,fontSize:54,lineHeight:0.88,textTransform:"uppercase",color:"#ffffff",letterSpacing:"-0.02em",marginBottom:4}}>
                  {(prescType==="running"||hybridRunDay)?(resolvedDayFocus[todayKey]||"Run Day"):todayFocus}
                </div>
                {/* Session brief */}
                {exCount>0&&(
                  <div style={{fontFamily:_MO,fontSize:9,color:"rgba(255,255,255,0.55)",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:12,display:"flex",gap:10,alignItems:"center"}}>
                    <span>~{estMin} min</span>
                    <span style={{color:"rgba(255,255,255,0.22)"}}>·</span>
                    <span>{exCount} exercises</span>
                    <span style={{color:"rgba(255,255,255,0.22)"}}>·</span>
                    <span>{totalSets} sets</span>
                  </div>
                )}
                {/* Stat chips: week completion ring + program arc */}
                <div style={{display:"flex",gap:10,marginTop:22}}>
                  <div style={{flex:1,background:"rgba(255,255,255,0.14)",borderRadius:16,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                    <svg width={38} height={38} viewBox="0 0 38 38" style={{flexShrink:0}}>
                      <circle cx={19} cy={19} r={_r} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth={3}/>
                      <MotionArc cx={19} cy={19} r={_r} pct={_donePct} stroke="#ffffff" strokeWidth={3} transform="rotate(-90 19 19)"/>
                    </svg>
                    <div>
                      <div style={{fontFamily:_AF,fontWeight:800,fontSize:20,color:"#fff",lineHeight:1}}>
                        <MN value={_doneThisWeek}/><span style={{color:"rgba(255,255,255,0.35)"}}>/<MN value={_schedThisWeek}/></span>
                      </div>
                      <div style={{fontFamily:_MO,fontSize:8,color:"rgba(255,255,255,0.50)",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:3}}>sessions</div>
                    </div>
                  </div>
                  {_totalWks&&(
                    <div style={{flex:1,background:"rgba(255,255,255,0.14)",borderRadius:16,padding:"12px 14px"}}>
                      <div style={{fontFamily:_MO,fontSize:8,color:"rgba(255,255,255,0.50)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>program</div>
                      <div style={{fontFamily:_AF,fontWeight:800,fontSize:20,color:"#fff",lineHeight:1,marginBottom:8}}>
                        Wk <MN value={_dispWk}/><span style={{color:"rgba(255,255,255,0.35)"}}> / {_totalWks}</span>
                      </div>
                      <div style={{height:3,background:"rgba(255,255,255,0.20)",borderRadius:2}}>
                        <div style={{height:"100%",width:`${(_wkPct||0)*100}%`,background:"#fff",borderRadius:2,transition:"width 0.6s cubic-bezier(0.2,0.7,0.3,1)"}}/>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ══ PAPER CARD 1 — SESSION DETAILS ═════════════════════════════ */}
              <PaperCard animate style={{margin:"-136px 12px 0",position:"relative",padding:"22px 18px 20px"}}>
                {/* Pill row */}
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
                  <span className="cm-pill" style={{background:"#FF3B30",color:"#fff"}} onClick={()=>_hL()}>{prescType==="lifting"?"Lifting":prescType==="running"?"Running":prescType.charAt(0).toUpperCase()+prescType.slice(1)}</span>
                  {prescType==="lifting"&&<span className="cm-pill" style={{background:heroLevelColor+"22",color:heroLevelColor}}>{heroLvlBadge}</span>}
                  {(profile?.primaryGoal||wPrefs?.primaryGoal)&&<span className="cm-pill" style={{background:"rgba(255,59,48,0.10)",color:"#FF3B30"}}>{getGoalLabel(profile?.primaryGoal||wPrefs?.primaryGoal)}</span>}
                </div>
                {/* Muscle focus */}
                <div style={{fontFamily:_MO,fontSize:9,color:"var(--cm-ink)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:14,lineHeight:1.5}}>
                  {muscleDesc?.replace(/\s*[\.\!\?].*$/,"").toUpperCase?.()}
                </div>
                {/* RED-S / Overreaching */}
                {(()=>{
                  const reds=profile?.adaptive_profile?.redsDetected;
                  const over=profile?.adaptive_profile?.overreachDetected;
                  if(!reds&&!over)return null;
                  const [expanded,setExpanded]=React.useState(false);
                  const title=reds?'RED-S Pattern Detected':'Overreaching Detected';
                  const msg=reds?reds.message:over.message;
                  return(
                    <div style={{background:'rgba(255,59,48,0.07)',border:'1.5px solid rgba(255,59,48,0.22)',borderRadius:12,padding:'14px 16px',marginBottom:10}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,cursor:'pointer'}} onClick={()=>setExpanded(e=>!e)}>
                        <span style={{fontSize:18}}>⚠️</span>
                        <div style={{fontFamily:_AF,fontWeight:800,fontSize:15,color:'#FF3B30',textTransform:'uppercase'}}>{title}</div>
                        <span style={{marginLeft:'auto',fontFamily:_MO,fontSize:9,color:'rgba(var(--cm-ink-rgb),0.75)'}}>{expanded?'▲':'▼'}</span>
                      </div>
                      {expanded&&<div style={{fontFamily:_MO,fontSize:11,color:'rgba(10,10,10,0.60)',lineHeight:1.65,borderTop:'1px solid rgba(255,59,48,0.12)',paddingTop:10,marginTop:4}}>{msg}</div>}
                    </div>
                  );
                })()}
                {adaptiveSession?.injuryRisk==="high"&&adaptiveSession?.injuryNote&&(
                  <div style={{background:"rgba(255,59,48,0.07)",border:"1.5px solid rgba(255,59,48,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
                    <div>
                      <div style={{fontFamily:_MO,fontSize:10,color:"#FF3B30",letterSpacing:"0.12em",textTransform:"uppercase",fontWeight:700,marginBottom:3}}>Injury Risk</div>
                      <div style={{fontSize:12,color:"var(--cm-ink)",lineHeight:1.55}}>{adaptiveSession.injuryNote}</div>
                      <div style={{fontSize:11,color:"rgba(var(--cm-ink-rgb),0.75)",marginTop:3}}>Consider seeing a physio before continuing.</div>
                    </div>
                  </div>
                )}
                {adaptiveSession?.modifier?.label&&adaptiveSession.modifier.label!=="full"&&(
                  <AdaptiveBanner modifier={adaptiveSession.modifier} analysis={adaptiveSession?.analysisInsight}/>
                )}
                {adaptiveSession?.spacingAlert&&(
                  <div style={{background:adaptiveSession.spacingAlert.severity==='high'?'rgba(255,149,0,0.10)':'rgba(10,10,10,0.04)',border:`1.5px solid ${adaptiveSession.spacingAlert.severity==='high'?'#FF9500':'rgba(10,10,10,0.10)'}`,borderRadius:10,padding:'10px 14px',marginBottom:8,display:'flex',gap:8,alignItems:'flex-start'}}>
                    <span style={{fontSize:15,flexShrink:0}}>{adaptiveSession.spacingAlert.type==='conflict'?'⚠️':'💤'}</span>
                    <div style={{fontFamily:_MO,fontSize:11,color:'var(--cm-ink)',lineHeight:1.55}}>{adaptiveSession.spacingAlert.message}</div>
                  </div>
                )}
                {profile?.lifeStage==="pregnant"&&(
                  <>
                    <div style={{background:"rgba(245,158,11,.08)",border:"1.5px solid rgba(245,158,11,.3)",borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="var(--amber)" strokeWidth="1.5"/><path d="M8 5v4M8 11v.5" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"var(--amber)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>Pregnancy — Always consult your OB or midwife</div>
                        <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>Before continuing or modifying exercise during pregnancy. Stop immediately if you experience pain, dizziness, or shortness of breath.</div>
                      </div>
                    </div>
                    <div style={{background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.15)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
                      <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>Exercise during pregnancy should be supervised by your OB-GYN or midwife. Coach Macro provides general guidance only.<br/><a href="https://coach-macro.com/support" style={{fontSize:10,color:"#FF3B30",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                    </div>
                  </>
                )}
                {profile?.lifeStage==="postpartum"&&(()=>{const pp=getPostpartumPhase(profile.postpartumWeeks,profile.csection);return(
                  <>
                    <div style={{background:"rgba(245,158,11,.08)",border:"1.5px solid rgba(245,158,11,.3)",borderRadius:12,padding:"12px 16px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{flexShrink:0,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="var(--amber)" strokeWidth="1.5"/><path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"var(--amber)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:3}}>{pp.label}</div>
                        <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>{pp.desc}</div>
                      </div>
                    </div>
                    <div style={{background:"rgba(245,158,11,.05)",border:"1px solid rgba(245,158,11,.15)",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",gap:10,alignItems:"flex-start"}}>
                      <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>Return to exercise postpartum should be guided by your healthcare provider.<br/><a href="https://coach-macro.com/support" style={{fontSize:10,color:"#FF3B30",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:3}}>Talk to a professional →</a></div>
                    </div>
                  </>
                );})()}
                {profile?.sex==="female"&&isLegDay(todayFocus)&&(()=>{
                  const cp=getCyclePhase(wPrefs?.lastPeriodDate||profile?.lastPeriodDate);
                  const highLaxity=cp&&(cp.phase==="follicular"||cp.phase==="ovulation");
                  return(
                    <div style={{background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.15)",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
                      <div style={{fontSize:10,color:"#FF3B30",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>ACL PREHAB · 5 MIN</div>
                      {highLaxity&&<div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.25)",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11,color:"var(--amber)"}}>Higher ligament laxity during {cp.label} — warm up thoroughly, land softly, bend knees on impact.</div>}
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {ACL_PREHAB.map((ex,i)=>(
                          <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"6px 10px",background:"rgba(10,10,10,0.04)",borderRadius:7}}>
                            <span style={{fontWeight:600,color:"var(--cm-ink)"}}>{ex.name}</span>
                            <span style={{color:"rgba(var(--cm-ink-rgb),0.75)"}}>{ex.reps}</span>
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
                      <div style={{fontSize:9,color:"var(--amber)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:6}}>SAFETY NOTES FOR YOUR SESSION</div>
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {hc.map(c=>{const info=HEALTH_CONDITIONS_SAFETY[c];return info?(<div key={c} style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.55}}><span style={{color:"var(--amber)",fontWeight:600}}>{info.label}:</span> {info.note}</div>):null;})}
                      </div>
                      <a href="https://coach-macro.com/support" style={{fontSize:10,color:"#FF3B30",textDecoration:"none",letterSpacing:".06em",display:"inline-block",marginTop:6}}>Talk to a professional →</a>
                    </div>
                  );
                })()}
                {(todayType==="training"||todayType==="run"||todayType==="cardio"||hybridRunDay)&&todayPrescription&&!Array.isArray(todayPrescription)&&(()=>{
                  const runPaces=getPacesFromTime(wPrefs.current5KTime||profile?.current5KTime);
                  const preFuel=todayPrescription.preFuel;
                  const postFuel=todayPrescription.postFuel;
                  const macroAdj=todayPrescription.macroAdjustment;
                  return(
                    <div style={{background:"rgba(10,10,10,0.04)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(10,10,10,0.08)",marginBottom:14}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:8,color:"var(--cm-ink)"}}>{todayPrescription.label||todayPrescription.type||"Today's Run"}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                        {todayPrescription.type&&<span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",background:"rgba(255,59,48,0.10)",color:"#FF3B30",padding:"3px 8px",borderRadius:6}}>{todayPrescription.type}</span>}
                        {todayPrescription.duration&&<span style={{fontSize:10,fontWeight:700,background:`${T.carb}18`,color:T.carb,padding:"3px 8px",borderRadius:6}}>{todayPrescription.duration} min</span>}
                        {todayPrescription.distance&&<span style={{fontSize:10,fontWeight:700,background:`${T.fat}18`,color:T.fat,padding:"3px 8px",borderRadius:6}}>{todayPrescription.distance} km</span>}
                        {todayPrescription.zone&&<span style={{fontSize:10,fontWeight:700,background:`${ZONE_COLOR[todayPrescription.zone]}25`,color:ZONE_COLOR[todayPrescription.zone],padding:"3px 8px",borderRadius:6}}>{ZONE_LABEL[todayPrescription.zone]||`Zone ${todayPrescription.zone}`}</span>}
                        {macroAdj&&<span style={{fontSize:10,fontWeight:700,background:`${T.carb}15`,color:T.carb,padding:"3px 8px",borderRadius:6}}>+{macroAdj} carbs</span>}
                      </div>
                      {todayPrescription.description&&<div style={{fontSize:12,color:"var(--cm-ink)",lineHeight:1.7,marginBottom:8}}>{todayPrescription.description}</div>}
                      {runPaces&&(wPrefs.current5KTime||profile?.current5KTime)&&<div style={{background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.12)",borderRadius:9,padding:"10px 12px",marginBottom:8}}>
                        <div style={{fontSize:9,color:"#FF3B30",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>YOUR PACES TODAY</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:"6px 14px"}}>
                          {[["Easy",runPaces.easy.display],["Tempo",runPaces.tempo.display],["Long Run",runPaces.longRun.display],["Intervals",runPaces.interval5K.display]].map(([l,v])=>(
                            <div key={l} style={{fontSize:11}}><span style={{color:"var(--cm-ink)"}}>{l}: </span><span style={{color:"var(--cm-ink)",fontWeight:700,fontFamily:"monospace"}}>{v}</span></div>
                          ))}
                        </div>
                      </div>}
                      {preFuel&&<div style={{background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.2)",borderRadius:9,padding:"9px 12px",marginBottom:6}}>
                        <div style={{fontSize:9,color:"var(--amber)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>PRE-RUN FUEL</div>
                        <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>{preFuel}</div>
                      </div>}
                      {postFuel&&<div style={{background:"rgba(52,211,153,.06)",border:"1px solid rgba(52,211,153,.2)",borderRadius:9,padding:"9px 12px",marginBottom:6}}>
                        <div style={{fontSize:9,color:T.green,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>RECOVERY FUEL</div>
                        <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>{postFuel}</div>
                      </div>}
                      {!preFuel&&!postFuel&&todayProgObj?.nutritionNote&&(
                        <div style={{background:"rgba(255,59,48,0.05)",borderRadius:9,padding:"10px 12px",border:"1px solid rgba(255,59,48,0.12)"}}>
                          <div style={{fontSize:9,color:"#FF3B30",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>NUTRITION BRIDGE</div>
                          <div style={{fontSize:11,color:"var(--cm-ink)",lineHeight:1.6}}>{todayProgObj.nutritionNote}</div>
                        </div>
                      )}
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
                      <span style={{fontSize:10,color:"var(--cm-ink)",marginLeft:8}}>Cycle day ~{Math.floor((Date.now()-new Date(wPrefs?.lastPeriodDate||profile?.lastPeriodDate))/86400000)%28+1}</span>
                    </div>
                  </div>;
                })()}
                {todayType==="training"&&!todayPrescription&&(
                  <div style={{background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.15)",borderRadius:14,padding:"18px 16px",marginBottom:8,textAlign:"center"}}>
                    <div style={{fontFamily:_AF,fontWeight:800,fontSize:20,color:"var(--cm-ink)",marginBottom:6}}>No Program Selected</div>
                    <div style={{fontSize:13,color:"var(--cm-ink)",marginBottom:14,lineHeight:1.5}}>Pick a structured program to see your session here every day.</div>
                    <button onClick={()=>setTrainScreen("plan")} style={{padding:"12px 24px",background:"#FF3B30",color:"#fff",fontWeight:700,fontSize:14,border:"none",borderRadius:12,cursor:"pointer",fontFamily:_AF,textTransform:"uppercase",letterSpacing:1}}>Pick a Program →</button>
                  </div>
                )}
                {/* ── LIFTING action region (unchanged) ── */}
                {todayType==="training"&&(
                  <div style={{marginTop:8}}>
                    {Array.isArray(todayPrescription)&&todayPrescription.length>0?(
                      <>
                        <div onClick={()=>{_hL();setSessionDetailExpanded(s=>!s);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px",background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.12)",borderRadius:10,cursor:"pointer",marginBottom:sessionDetailExpanded?10:0,transition:"margin 0.2s"}}>
                          <span style={{fontFamily:_MO,fontSize:10,fontWeight:700,color:"#FF3B30",letterSpacing:"0.14em",textTransform:"uppercase"}}>{sessionDetailExpanded?"Hide ↑":"See exercises ↓"}</span>
                          <span style={{fontFamily:_MO,fontSize:9,color:"rgba(var(--cm-ink-rgb),0.75)",letterSpacing:"0.08em"}}>{exCount} exercises · {totalSets} sets</span>
                        </div>
                        {sessionDetailExpanded&&(
                          <div>
                            <div style={{display:"flex",flexDirection:"column",marginBottom:12}}>
                              {todayPrescription.map((ex,i)=>(
                                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderBottom:"1px solid rgba(10,10,10,0.06)"}}>
                                  <div style={{width:26,height:26,borderRadius:"50%",background:"rgba(255,59,48,0.10)",border:"1px solid rgba(255,59,48,0.20)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:_MO,fontSize:10,color:"#FF3B30",fontWeight:700,flexShrink:0}}>{i+1}</div>
                                  <div style={{flex:1}}>
                                    <div style={{fontFamily:_AF,fontWeight:700,fontSize:15,color:"var(--cm-ink)",textTransform:"uppercase",lineHeight:1}}>{ex.name}</div>
                                    {(()=>{
                                      const prog=adaptiveSession?.progressions?.[ex.name];
                                      const conflict=adaptiveSession?.soreConflicts?.find(c=>c.exercise===ex.name);
                                      const domsConflict=adaptiveSession?.domsConflicts?.find(c=>c.exercise===ex.name);
                                      return(<>
                                        {conflict&&<div style={{fontFamily:_MO,fontSize:9,color:"#FF9500",letterSpacing:"0.08em",marginTop:3}}>⚠️ {conflict.zone.replace(/_/g,' ')} still recovering</div>}
                                        {!conflict&&domsConflict&&<div style={{fontFamily:_MO,fontSize:9,color:"#FF9500",letterSpacing:"0.08em",marginTop:3}}>⚠️ {domsConflict.zone} predicted soreness peak in {Math.abs(domsConflict.prediction.hoursToPeak)}h — consider reducing range of motion</div>}
                                        {prog&&prog.action!=='new'&&<WeightSuggestion prog={prog}/>}
                                      </>);
                                    })()}
                                  </div>
                                  <div style={{fontFamily:_MO,fontSize:12,color:"var(--cm-ink)",letterSpacing:"0.06em",flexShrink:0}}>{Array.isArray(ex.sets)?ex.sets.length:ex.sets}×{ex.reps}</div>
                                </div>
                              ))}
                            </div>
                            {adaptiveSession?.hasPlateau&&(
                              <div style={{background:"rgba(255,59,48,0.06)",border:"1px solid rgba(255,59,48,0.18)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
                                <div style={{fontFamily:_AF,fontWeight:800,fontSize:17,color:"var(--cm-ink)",marginBottom:4}}>You've pushed this program to its limit.</div>
                                <div style={{fontFamily:_MO,fontSize:11,color:"var(--cm-ink)",lineHeight:1.55,marginBottom:10}}>Your coach has noticed {adaptiveSession.plateaus.join(', ')} have stalled. You're ready for the next level.</div>
                                <button onClick={()=>setTrainScreen("library")} style={{padding:"8px 16px",background:"rgba(255,59,48,0.10)",border:"1.5px solid rgba(255,59,48,0.22)",borderRadius:9,color:"#FF3B30",fontFamily:_MO,fontSize:10,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>See next programs →</button>
                              </div>
                            )}
                            <motion.button onClick={()=>{_hM();startFromProgram();}} onPointerDown={()=>_hL()} whileTap={{scale:0.94}} transition={{type:'spring',stiffness:600,damping:20}} style={{width:"100%",background:"#FF3B30",border:"none",borderRadius:14,padding:16,fontFamily:_MO,fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",touchAction:"manipulation",boxShadow:"0 4px 20px rgba(255,59,48,0.35)"}}>START SESSION →</motion.button>
                          </div>
                        )}
                      </>
                    ):(
                      <motion.button
                        onClick={()=>{_hM();todayPrescription?startFromProgram():startStructured(todayFocus);}}
                        onPointerDown={()=>_hL()}
                        whileTap={{scale:0.94}}
                        transition={{type:'spring',stiffness:600,damping:20}}
                        style={{width:"100%",background:"#FF3B30",border:"none",borderRadius:14,padding:16,fontFamily:_MO,fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",touchAction:"manipulation",boxShadow:"0 4px 20px rgba(255,59,48,0.35)"}}>START SESSION →</motion.button>
                    )}
                    {/* Adapt today — secondary quiet pill, only when a session exists + quota remains */}
                    {Array.isArray(todayPrescription)&&todayPrescription.length>0&&adaptLeft>0&&(
                      <button onClick={()=>{_hL();setShowAdapt(true);}}
                        style={{width:"100%",marginTop:8,padding:"11px 0",background:"transparent",
                                border:"1px solid rgba(var(--cm-ink-rgb),.15)",borderRadius:12,
                                color:"rgba(var(--cm-ink-rgb),.60)",fontFamily:_MO,fontSize:10,
                                fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",
                                cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                                gap:6,minHeight:"auto",minWidth:"auto"}}>
                        <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M13 2L4.5 13.5h7L8.5 22 19 10h-7z"/></svg>
                        ADAPT TODAY
                      </button>
                    )}
                  </div>
                )}
                {/* ── RUN action region: run/cardio day or hybrid-run day ── */}
                {(todayType==="run"||todayType==="cardio"||hybridRunDay)&&(
                  <div style={{marginTop:8}}>
                    <motion.button
                      onClick={()=>{_hM();startFromProgram();}}
                      onPointerDown={()=>_hL()}
                      whileTap={{scale:0.94}}
                      transition={{type:'spring',stiffness:600,damping:20}}
                      style={{width:"100%",background:"#FF3B30",border:"none",borderRadius:14,padding:16,fontFamily:_MO,fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",touchAction:"manipulation",boxShadow:"0 4px 20px rgba(255,59,48,0.35)"}}>START RUN →</motion.button>
                  </div>
                )}
                {/* ── HYROX action region: hyrox or hybrid-hyrox day ── */}
                {todayType==="hyrox"&&(
                  <div style={{marginTop:8}}>
                    <motion.button
                      onClick={()=>{_hM();startFromProgram();}}
                      onPointerDown={()=>_hL()}
                      whileTap={{scale:0.94}}
                      transition={{type:'spring',stiffness:600,damping:20}}
                      style={{width:"100%",background:"#FF3B30",border:"none",borderRadius:14,padding:16,fontFamily:_MO,fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",touchAction:"manipulation",boxShadow:"0 4px 20px rgba(255,59,48,0.35)"}}>START HYROX →</motion.button>
                  </div>
                )}
              </PaperCard>

              {/* ══ PAPER CARD 2 — EXPLORE + NUTRITION ════════════════════════ */}
              <PaperCard reveal revealDelay={0} style={{margin:"12px 12px 0",padding:"22px 18px"}}>
                {/* Nutrition context */}
                {(()=>{
                  const displayPrefs=wPrefs?.displayPrefs||{};
                  const currentSkill=(wPrefs?.liftExp||profile?.liftExp||"intermediate").toLowerCase();
                  const showMacroCard=displayPrefs.full_macro_breakdown!=null?displayPrefs.full_macro_breakdown:currentSkill!=="beginner";
                  if(!showMacroCard||!todayProtocol||!macros)return null;
                  const p=todayProtocol;
                  const base={cal:p.base_calories||macros.calories,prot:p.base_protein_g||macros.protein,carbs:p.base_carbs_g||macros.carbs};
                  const adj={cal:p.adjusted_calories||macros.calories,prot:p.adjusted_protein_g||macros.protein,carbs:p.adjusted_carbs_g||macros.carbs};
                  function arrow(a,b){if(a>b+5)return{sym:"↑",color:T.green};if(a<b-5)return{sym:"↓",color:"#ef4444"};return{sym:"→",color:"rgba(var(--cm-ink-rgb),0.65)"};}
                  const chips=[
                    {label:"PROTEIN",val:`${adj.prot}g`,...arrow(adj.prot,base.prot)},
                    {label:"CARBS",val:`${adj.carbs}g`,...arrow(adj.carbs,base.carbs)},
                    {label:"CALORIES",val:String(adj.cal),...arrow(adj.cal,base.cal)},
                  ];
                  return(
                    <div style={{background:"rgba(255,59,48,0.05)",border:"1px solid rgba(255,59,48,0.12)",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",gap:0,position:"relative",overflow:"hidden"}}>
                      <div style={{width:3,background:"#FF3B30",borderRadius:2,marginRight:12,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:_MO,fontSize:8,color:"#FF3B30",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>TODAY'S NUTRITION</div>
                        <div style={{display:"flex",gap:6,marginBottom:6}}>
                          {chips.map(c=>(
                            <div key={c.label} style={{flex:1,background:"rgba(10,10,10,0.04)",borderRadius:8,padding:"7px 6px",textAlign:"center"}}>
                              <div style={{fontFamily:_AF,fontWeight:800,fontSize:15,color:c.color,lineHeight:1}}>{c.sym} {c.val}</div>
                              <div style={{fontFamily:_MO,fontSize:7,color:"rgba(var(--cm-ink-rgb),0.75)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:3}}>{c.label}</div>
                            </div>
                          ))}
                        </div>
                        {p.reason&&<div style={{fontFamily:_MO,fontSize:8,color:"rgba(var(--cm-ink-rgb),0.75)",lineHeight:1.5}}>{p.reason}</div>}
                      </div>
                    </div>
                  );
                })()}
                {/* Quick access eyebrow */}
                <div style={{fontFamily:_MO,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--cm-ink)",marginBottom:14}}>QUICK ACCESS</div>
                {/* Carousel */}
                {(()=>{
                  const progInfo=PROGRAM_LIBRARY.find(p=>p.splitKey===wPrefs.splitType||p.name===wPrefs.splitType)||null;
                  const _raceTypeLabels2={half_marathon:'Half Marathon',half:'Half Marathon','5k':'5K','10k':'10K',marathon:'Marathon',general:'General Fitness'};
                  const _raceLabel2=_raceTypeLabels2[(profile?.run_race_type||'').toLowerCase()]||profile?.run_race_type||'';
                  const progName=
                    wPrefs.isHyrox&&wPrefs.isHybrid?(wPrefs.hybridTemplate||"Hyrox Hybrid"):
                    wPrefs.isHyrox?(wPrefs.hyroxProgram||"Hyrox"):
                    wPrefs.isHybrid?(_raceLabel2?`${wPrefs.hybridTemplate||"Hybrid"} · ${_raceLabel2}`:(wPrefs.hybridTemplate||"Hybrid")):
                    prescType==="running"?(_raceLabel2||wPrefs.runPlan||"Running"):
                    progInfo?.name||(wPrefs.splitType||"Custom Plan");
                  const displayWeek=programCurrentWeek||weekNum;
                  const liftExp=(wPrefs?.liftExp||profile?.liftExp||"intermediate");
                  const expLabel=liftExp.charAt(0).toUpperCase()+liftExp.slice(1);
                  const cStyle={minWidth:"100%",maxWidth:"100%",width:"100%",flexShrink:0,scrollSnapAlign:"start",background:"rgba(10,10,10,0.04)",border:"1px solid rgba(10,10,10,0.08)",borderRadius:14,padding:"18px 16px",display:"flex",flexDirection:"column",justifyContent:"space-between",height:110,cursor:"pointer",position:"relative",boxSizing:"border-box"};
                  return(
                    <>
                      <div
                        ref={carouselRef}
                        onScroll={e=>{const el=e.currentTarget;const w=el.offsetWidth||el.clientWidth||320;const idx=Math.min(2,Math.max(0,Math.round(el.scrollLeft/w)));setActiveCard(idx);}}
                        style={{overflowX:"auto",display:"flex",flexDirection:"row",gap:0,paddingBottom:4,marginBottom:8,scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none"}}
                      >
                        <div onClick={()=>{_hL();setTrainScreen("plan");}} style={cStyle}>
                          <div>
                            <div style={{fontFamily:_MO,fontSize:9,color:"#FF3B30",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>YOUR PROGRAM</div>
                            <div style={{fontFamily:_AF,fontWeight:800,fontSize:20,color:"var(--cm-ink)",textTransform:"uppercase",lineHeight:1}}>{progName}</div>
                          </div>
                          <div style={{fontFamily:_MO,fontSize:9,color:"rgba(var(--cm-ink-rgb),0.75)"}}>Week {displayWeek} · {expLabel}</div>
                          <div style={{position:"absolute",bottom:16,right:16,color:"#FF3B30",fontSize:18,lineHeight:1}}>→</div>
                        </div>
                        <div onClick={()=>{_hL();setTrainScreen("library");}} style={cStyle}>
                          <div>
                            <div style={{fontFamily:_MO,fontSize:9,color:"#FF3B30",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>PROGRAMS</div>
                            <div style={{fontFamily:_AF,fontWeight:800,fontSize:20,color:"var(--cm-ink)",textTransform:"uppercase",lineHeight:1}}>TRAINING PLANS</div>
                          </div>
                          <div style={{fontFamily:_MO,fontSize:9,color:"rgba(var(--cm-ink-rgb),0.75)"}}>PPL, Arnold, Hyrox…</div>
                          <div style={{position:"absolute",bottom:16,right:16,color:"#FF3B30",fontSize:18,lineHeight:1}}>→</div>
                        </div>
                        <div onClick={()=>{_hL();setShowExploreSheet(true);}} style={cStyle}>
                          <div>
                            <div style={{fontFamily:_MO,fontSize:9,color:"#FF3B30",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>TOOLS & MORE</div>
                            <div style={{fontFamily:_AF,fontWeight:800,fontSize:20,color:"var(--cm-ink)",textTransform:"uppercase",lineHeight:1}}>EXPLORE</div>
                          </div>
                          <div style={{fontFamily:_MO,fontSize:9,color:"rgba(var(--cm-ink-rgb),0.75)"}}>Programs · Routines · Warm-up</div>
                          <div style={{position:"absolute",bottom:16,right:16,color:"#FF3B30",fontSize:18,lineHeight:1}}>→</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5,justifyContent:"center"}}>
                        {[0,1,2].map(i=>(
                          <div key={i} style={{width:5,height:5,borderRadius:"50%",background:activeCard===i?"#FF3B30":"rgba(10,10,10,0.12)",transition:"background 0.2s"}}/>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </PaperCard>

              {/* ══ PAPER CARD 3 — WEEK & RECOVERY ════════════════════════════ */}
              <PaperCard reveal revealDelay={60} style={{margin:"12px 12px 80px",padding:"22px 18px"}}>
                <WeekStrip todayKey={todayKey} schedule={schedule} dayFocus={resolvedDayFocus} sessionCount={sessionCount} todayType={todayType} lightSurface/>
                <div style={{marginTop:16}}>
                  <MuscleRecovery userId={user?.id}/>
                </div>
                {balanceCorrections?.length>0&&(()=>{
                  const top=balanceCorrections[0];
                  if(!top?.recommendation)return null;
                  return(
                    <div style={{background:"rgba(10,10,10,0.04)",border:"1px solid rgba(10,10,10,0.08)",borderRadius:12,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start",marginTop:12}}>
                      <div style={{fontSize:16,flexShrink:0,lineHeight:1,paddingTop:1}}>⚖️</div>
                      <div>
                        <div style={{fontFamily:_MO,fontSize:9,color:"var(--cm-ink)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:4}}>Balance insight</div>
                        <div style={{fontFamily:_AF,fontSize:13,fontWeight:500,color:"var(--cm-ink)",lineHeight:1.55}}>{top.recommendation}</div>
                      </div>
                    </div>
                  );
                })()}
              </PaperCard>

              {/* Explore bottom sheet — portalled */}
              {showExploreSheet&&ReactDOM.createPortal(
                <div onClick={()=>setShowExploreSheet(false)} style={{position:"fixed",inset:0,zIndex:9000,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"flex-end"}}>
                  <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#ffffff",borderRadius:"24px 24px 0 0",padding:"24px 20px",paddingBottom:"calc(24px + env(safe-area-inset-bottom))"}}>
                    <div style={{width:36,height:4,background:"rgba(10,10,10,0.12)",borderRadius:2,margin:"0 auto 20px"}}/>
                    <div style={{fontFamily:_MO,fontSize:11,color:"#FF3B30",letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:16}}>EXPLORE</div>
                    {[
                      {title:"PROGRAM LIBRARY",sub:"Browse all training programs",screen:"library"},
                      {title:"MY ROUTINES",sub:"Your custom workouts",screen:"routine-builder"},
                      {title:"WARM-UP",sub:"Movement prep by muscle group",screen:"warmup-protocols"},
                      {title:"CUSTOM ROUTINE",sub:"Build your own workout",screen:"routine-builder"},
                    ].map(({title,sub,screen})=>(
                      <div key={title} onClick={()=>{_hL();setShowExploreSheet(false);setTrainScreen(screen);}} style={{padding:"14px 0",borderBottom:"1px solid rgba(10,10,10,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                        <div>
                          <div style={{fontFamily:_AF,fontWeight:800,fontSize:17,color:"var(--cm-ink)",textTransform:"uppercase",lineHeight:1}}>{title}</div>
                          <div style={{fontFamily:_MO,fontSize:9,color:"rgba(var(--cm-ink-rgb),0.75)",marginTop:2}}>{sub}</div>
                        </div>
                        <div style={{color:"#FF3B30",fontSize:16,flexShrink:0}}>→</div>
                      </div>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            </div>
          );
        })()}

        {/* ── LIFT SMARTER BUILDER ── */}
        {trainScreen==="builder"&&<WorkoutBuilder profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} generateWorkout={generateWorkout} startStructured={startStructured} workout={workout} workoutLoading={workoutLoading} isMobile={isMobile} todayFocus={todayFocus} schedule={schedule} setActiveWorkout={setActiveWorkout} setTrainScreen={setTrainScreen}/>}

        {/* ── WARM-UP SCREEN ── */}
        {trainScreen==="warmup"&&ReactDOM.createPortal(
          <div style={{
            position:'fixed',
            top:0,left:0,right:0,bottom:0,
            background:'#000000',
            overflowY:'auto',
            zIndex:9000,
            display:'flex',
            flexDirection:'column',
            fontFamily:"'Barlow Condensed',sans-serif",
            animation:'wuFadeIn 0.22s ease',
          }}>
          <style>{`@keyframes wuFadeIn{from{opacity:0}to{opacity:1}}`}</style>
            {/* Header */}
            <div style={{padding:'max(env(safe-area-inset-top),48px) 24px 0'}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:'0.2em',color:'var(--accent)',marginBottom:8}}>
                {'// WARM-UP'}
              </div>
              <div style={{fontSize:36,fontWeight:900,fontStyle:'italic',color:'#f5f5f0',lineHeight:1,textTransform:'uppercase',marginBottom:14}}>
                BEFORE {({'push':'PUSH SESSION','pull':'PULL SESSION','legs':'LEG SESSION','upper':'UPPER BODY SESSION','lower':'LOWER BODY SESSION','run':'RUN SESSION','hyrox':'HYROX SESSION'}[warmupSessionType||'push'])||'PUSH SESSION'}<span style={{color:'var(--accent)'}}>.</span>
              </div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:'rgba(245,245,240,0.4)',marginBottom:24,letterSpacing:'0.08em'}}>
                COMPLETE BEFORE LOADING THE BAR
              </div>
            </div>

            {/* Self-contained hardcoded exercises — no external data */}
            {(()=>{
              try {
                const wuExercises={
                  push:[
                    {name:'Arm Circles',sets:'2 × 30 sec',note:'Forward and backward'},
                    {name:'Band Pull-Aparts',sets:'2 × 15 reps',note:'Activate rear delts'},
                    {name:'Wall Slides',sets:'2 × 10 reps',note:'Shoulder mobility'},
                    {name:'Incline Push-Ups',sets:'2 × 10 reps',note:'Prime chest and triceps'},
                    {name:'Empty Bar Bench Press',sets:'1 × 15 reps',note:'Movement pattern prep'},
                  ],
                  pull:[
                    {name:'Shoulder Rollouts',sets:'2 × 10 each',note:'Forward and backward'},
                    {name:'Dead Hang',sets:'2 × 20 sec',note:'Decompress the spine'},
                    {name:'Band Pull-Aparts',sets:'2 × 15 reps',note:'Rear delt activation'},
                    {name:'Light Lat Pulldown',sets:'2 × 15 reps',note:'Feel lats engage'},
                  ],
                  legs:[
                    {name:'Hip Circles',sets:'2 × 10 each',note:'Big slow circles'},
                    {name:'Leg Swings',sets:'2 × 12 each',note:'Forward and back'},
                    {name:'Bodyweight Squat',sets:'2 × 15 reps',note:'Slow 3-sec descent'},
                    {name:'Glute Bridge',sets:'2 × 15 reps',note:'Pause at top'},
                    {name:'Light Goblet Squat',sets:'1 × 12 reps',note:'Open the hips'},
                  ],
                  upper:[
                    {name:'Arm Circles',sets:'2 × 20 each',note:'Loosen shoulders'},
                    {name:'Band Pull-Aparts',sets:'2 × 15 reps',note:'Scapula activation'},
                    {name:'Shoulder Rolls',sets:'2 × 10 each',note:'Full range both ways'},
                    {name:'Light Press',sets:'2 × 15 reps',note:'Pattern prep'},
                  ],
                  lower:[
                    {name:'Hip Circles',sets:'2 × 10 each',note:'Both directions'},
                    {name:'Leg Swings',sets:'2 × 12 each',note:'Lateral and forward'},
                    {name:'Bodyweight Squat',sets:'2 × 15 reps',note:'Feel the range'},
                    {name:'Hip Flexor Stretch',sets:'2 × 30 sec',note:'Hold and breathe'},
                  ],
                  run:[
                    {name:'Leg Swings',sets:'2 × 15 each',note:'Loosen hips'},
                    {name:'Ankle Circles',sets:'2 × 10 each',note:'Both directions'},
                    {name:'High Knees (slow)',sets:'2 × 30 sec',note:'Warm the hip flexors'},
                    {name:'Easy Jog',sets:'1 × 3 min',note:'Build to aerobic pace'},
                  ],
                  hyrox:[
                    {name:'Hip Circles',sets:'2 × 10 each',note:'Loosen hips and lower back'},
                    {name:'Arm Circles',sets:'2 × 15 each',note:'Full range both directions'},
                    {name:'Glute Bridge',sets:'2 × 15 reps',note:'Activate posterior chain'},
                    {name:'Easy Jog',sets:'1 × 3 min',note:'Build to aerobic pace'},
                    {name:'SkiErg Light',sets:'2 × 20 reps',note:'60% effort — get the feel'},
                  ],
                };
                const list=wuExercises[warmupSessionType||'push']||wuExercises.push;
                return(
                  <div style={{padding:'0 24px',paddingBottom:200}}>
                    {list.map((ex,i)=>(
                      <div key={i} style={{
                        background:'#0d0d0d',
                        border:'1px solid rgba(var(--accent-rgb),0.08)',
                        borderRadius:12,
                        padding:'14px 16px',
                        marginBottom:8,
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                      }}>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:18,color:'#f5f5f0',textTransform:'uppercase',lineHeight:1.1}}>
                            {ex.name}
                          </div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.4)',marginTop:3,letterSpacing:'0.1em'}}>
                            {ex.note}
                          </div>
                        </div>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--accent)',letterSpacing:'0.1em',flexShrink:0,marginLeft:12,textAlign:'right'}}>
                          {ex.sets}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } catch(err) {
                return(
                  <div style={{padding:24,fontFamily:"'DM Mono',monospace",fontSize:12,color:'var(--accent)'}}>
                    {'Error: '+err.message}
                  </div>
                );
              }
            })()}

            {/* BEGIN SESSION + SKIP buttons */}
            <div style={{
              position:'fixed',
              bottom:0,left:0,right:0,
              padding:'16px 24px',
              paddingBottom:'max(env(safe-area-inset-bottom),24px)',
              background:'#000000',
              borderTop:'1px solid rgba(245,245,240,0.06)',
              display:'flex',
              flexDirection:'column',
              gap:10,
            }}>
              <button
                onClick={()=>{setSessionMode(prescType==='hyrox'||prescType==='hybrid-hyrox'?'hyrox-picker':(prescType==='running'||hybridRunDay)?'run-picker':null);setTrainScreen("active");}}
                style={{width:'100%',padding:'16px 0',background:'var(--accent)',border:'none',borderRadius:12,color:'#fff',fontSize:13,fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer'}}
              >
                BEGIN SESSION →
              </button>
              <button
                onClick={()=>{setSessionMode(prescType==='hyrox'||prescType==='hybrid-hyrox'?'hyrox-picker':(prescType==='running'||hybridRunDay)?'run-picker':null);setTrainScreen("active");}}
                style={{width:'100%',padding:'13px 0',background:'transparent',border:'1px solid rgba(245,245,240,0.15)',borderRadius:12,color:'rgba(245,245,240,0.4)',fontSize:11,fontWeight:700,fontFamily:"'DM Mono',monospace",letterSpacing:'0.16em',textTransform:'uppercase',cursor:'pointer'}}
              >
                SKIP WARM-UP →
              </button>
            </div>
          </div>,
          document.body
        )}

        {/* ── POST-WORKOUT SUMMARY ── */}
        {trainScreen==="summary"&&(completedWorkout||workoutSummary)&&ReactDOM.createPortal(
          (()=>{
            const MUSCLE_TO_BODYMAP={
              'Sternal Pec':'chest','Clavicular Pec':'chest','Serratus':'chest',
              'Anterior Delt':'shoulders-f','Medial Delt':'shoulders-f','Supraspinatus':'shoulders-f',
              'Rear Delt':'rear-delts',
              'Long Head Tricep':'triceps','Lateral Head Tricep':'triceps','Medial Head Tricep':'triceps','Anconeus':'triceps',
              'Long Head Bicep':'biceps','Short Head Bicep':'biceps','Brachialis':'biceps',
              'Forearms':'forearms-f',
              'Abs':'abs','Core':'abs','Obliques':'abs',
              'Hip Flexors':'hip-flexors',
              'Rectus Femoris':'quads','Vastus Lateralis':'quads','Vastus Medialis':'quads','Vastus Intermedius':'quads','Adductors':'quads',
              'Biceps Femoris':'hamstrings','Semitendinosus':'hamstrings','Semimembranosus':'hamstrings',
              'Gluteus Maximus':'glutes','Gluteus Medius':'glutes','Gluteus Minimus':'glutes',
              'Calves':'calves-f',
              'Lats':'lats','Teres Major':'lats','Rhomboids':'lats',
              'Upper Traps':'traps','Mid Traps':'traps','Lower Traps':'traps',
              'Lower Back':'lower-back',
            };
            const BODYMAP_COLOR={chest:'var(--accent)','shoulders-f':'#FEA020','rear-delts':'#FEA020',biceps:'#9C6FFF',triceps:'#9C6FFF','forearms-f':'#9C6FFF','forearms-b':'#9C6FFF',abs:'#14C4B3','hip-flexors':'#14C4B3',quads:'#22c55e',hamstrings:'#22c55e',glutes:'#22c55e','calves-f':'#22c55e','calves-b':'#22c55e',lats:'#60a5fa',traps:'#60a5fa','lower-back':'#60a5fa'};
            const REGION_LABELS={chest:'Chest','shoulders-f':'Shoulders','rear-delts':'Rear Delts',biceps:'Biceps',triceps:'Triceps','forearms-f':'Forearms',abs:'Core','hip-flexors':'Hip Flexors',quads:'Quads',hamstrings:'Hamstrings',glutes:'Glutes','calves-f':'Calves',lats:'Back',traps:'Traps','lower-back':'Lower Back'};
            const ALL_REGIONS=['chest','shoulders-f','biceps','forearms-f','abs','hip-flexors','quads','calves-f','traps','lats','rear-delts','triceps','forearms-b','lower-back','glutes','hamstrings','calves-b'];
            // Use completedWorkout for real done-set data; fallback to workoutSummary
            const parseReps=(r)=>{if(typeof r==='number')return r;if(typeof r==='string'){const p=r.split('-');return parseInt(p[0])||0;}return 0;};
            const srcExercises=completedWorkout?(completedWorkout.exercises||[]):(workoutSummary?.exercises||[]);
            const exercisesWorked=completedWorkout?srcExercises.filter(ex=>ex.sets?.some(s=>s.done)):srcExercises;
            const totalSetsLogged=completedWorkout?exercisesWorked.reduce((acc,ex)=>acc+(ex.sets?.filter(s=>s.done)?.length||0),0):(workoutSummary?.completedSets||0);
            const totalVolumeLogged=completedWorkout?exercisesWorked.reduce((acc,ex)=>acc+(ex.sets?.filter(s=>s.done)?.reduce((sum,s)=>sum+((parseFloat(s.weight)||0)*parseReps(s.reps)),0)||0),0):(workoutSummary?.totalVolume||0);
            const workedRegions=new Set();
            const primaryMuscleNames=new Set();
            exercisesWorked.forEach(ex=>{
              const md=getExerciseData(ex.name);
              if(md)md.primary.forEach(m=>{primaryMuscleNames.add(m);const r=MUSCLE_TO_BODYMAP[m];if(r)workedRegions.add(r);});
            });
            const bodyColors={};
            ALL_REGIONS.forEach(r=>{bodyColors[r]=workedRegions.has(r)?BODYMAP_COLOR[r]:'rgba(245,245,240,0.08)';});
            const workedChips=[...workedRegions].map(r=>({label:REGION_LABELS[r]||r,color:BODYMAP_COLOR[r]||'var(--accent)'}));
            const tomorrowIdx=(WDAYS.indexOf(todayKey)+1)%7;
            const tomorrowKey=WDAYS[tomorrowIdx];
            const tomorrowType=schedule?.[tomorrowKey]||'rest';
            const tomorrowFocus=tomorrowType==='rest'?'REST DAY':(dayFocus?.[tomorrowKey]||tomorrowType.toUpperCase())+' DAY';
            const tomorrowFullDay=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][(new Date().getDay()+1)%7];
            const dateStr=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
            const dur=workoutSummary?.duration||0;
            const durStr=dur>=60?`${Math.floor(dur/60)}H ${dur%60}M`:`${dur||'—'} MINUTES`;
            const mno={fontFamily:"'DM Mono',monospace"};
            const cnd={fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900};
            const isFirstSession=sessionCount<=1;
            return(
              <div style={{position:'fixed',inset:0,background:'#000000',zIndex:9001,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
                <style>{`@keyframes sumIn{from{opacity:0}to{opacity:1}}`}</style>
                {isFirstSession&&(
                  <div style={{background:'linear-gradient(180deg,rgba(var(--accent-rgb),0.15) 0%,transparent 100%)',padding:'40px 24px 24px',textAlign:'center',maxWidth:480,margin:'0 auto',boxSizing:'border-box'}}>
                    <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12}}>{'// FIRST SESSION COMPLETE'}</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:64,color:'#f5f5f0',lineHeight:0.88,marginBottom:16,textTransform:'uppercase'}}>YOU<br/>SHOWED<br/>UP.</div>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,color:'rgba(245,245,240,0.6)',lineHeight:1.4,marginBottom:24}}>That's the hardest part. Most people never start. You did.</div>
                    <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                      {['FIRST SESSION','STREAK STARTED','COACH ACTIVE'].map(chip=>(
                        <span key={chip} style={{background:'rgba(var(--accent-rgb),0.1)',border:'1px solid rgba(var(--accent-rgb),0.2)',borderRadius:20,padding:'6px 14px',fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--accent)',letterSpacing:'0.1em'}}>{chip} ✓</span>
                      ))}
                    </div>
                    <div style={{height:1,background:'rgba(var(--accent-rgb),0.08)',marginTop:24}}/>
                  </div>
                )}
                <div style={{animation:'sumIn 0.22s ease',maxWidth:480,margin:'0 auto',padding:isFirstSession?'24px 24px 0':'max(env(safe-area-inset-top),48px) 24px 0',paddingBottom:'max(env(safe-area-inset-bottom),48px)'}}>

                  {/* Close */}
                  <div onClick={clearWorkoutSummary} style={{width:36,height:36,borderRadius:10,background:'rgba(245,245,240,0.06)',border:'1px solid rgba(245,245,240,0.1)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',marginBottom:24}}>
                    <span style={{color:'rgba(245,245,240,0.5)',fontSize:16,lineHeight:1,fontFamily:'sans-serif',userSelect:'none'}}>&#x2715;</span>
                  </div>

                  {/* Headline */}
                  <div style={{...mno,fontSize:9,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12}}>{'// SESSION COMPLETE'}</div>
                  <div style={{...cnd,fontSize:72,color:'#f5f5f0',lineHeight:0.9,textTransform:'uppercase',marginBottom:12,letterSpacing:'-0.01em'}}>
                    SESSION<br/>COMPLETE<span style={{color:'var(--accent)'}}>.</span>
                  </div>
                  <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.35)',marginBottom:36,letterSpacing:'0.08em'}}>
                    {dateStr} · {durStr}
                  </div>

                  {/* Stats row */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:32}}>
                    {[
                      {val:totalSetsLogged,label:'SETS'},
                      {val:totalVolumeLogged>0?(totalVolumeLogged>=1000?(totalVolumeLogged/1000).toFixed(1)+'K lbs':Math.round(totalVolumeLogged)+' lbs'):'—',label:'VOLUME'},
                      {val:exercisesWorked.length||0,label:'EXERCISES'},
                    ].map(({val,label})=>(
                      <div key={label} style={{background:'#0d0d0d',border:'1px solid rgba(var(--accent-rgb),0.1)',borderRadius:12,padding:'14px 12px',textAlign:'center'}}>
                        <div style={{...cnd,fontSize:32,color:'#f5f5f0',lineHeight:1}}>{val}</div>
                        <div style={{...mno,fontSize:9,color:'rgba(245,245,240,0.4)',letterSpacing:'0.14em',marginTop:4}}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Muscles worked */}
                  {workedRegions.size>0&&(
                    <div style={{marginBottom:32}}>
                      <div style={{...mno,fontSize:9,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:16}}>{'// MUSCLES WORKED'}</div>
                      <BodyMap colors={bodyColors}/>
                      {workedChips.length>0&&(
                        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:16}}>
                          {workedChips.map(({label,color})=>(
                            <span key={label} style={{background:`${color}15`,border:`1px solid ${color}30`,borderRadius:20,padding:'4px 12px',...mno,fontSize:9,color,letterSpacing:'0.1em',textTransform:'uppercase'}}>{label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PRs */}
                  {workoutSummary?.prs?.length>0&&(
                    <div style={{marginBottom:32}}>
                      <div style={{...mno,fontSize:9,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:14}}>{'// NEW RECORDS'}</div>
                      {workoutSummary.prs.map((pr,i)=>(
                        <div key={i} style={{background:'rgba(34,197,94,0.05)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:12,padding:'14px 16px',marginBottom:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <div>
                            <div style={{...cnd,fontSize:18,color:'#f5f5f0',textTransform:'uppercase'}}>{pr.name}</div>
                            {pr.reps&&<div style={{...mno,fontSize:9,color:'rgba(245,245,240,0.4)',marginTop:2}}>{pr.reps} REPS</div>}
                          </div>
                          <div style={{...cnd,fontSize:28,color:'#22c55e',textAlign:'right'}}>
                            {pr.weight}<span style={{...mno,fontSize:10,fontStyle:'normal',fontWeight:400}}> lbs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fuel up */}
                  <div style={{marginBottom:32}}>
                    <div style={{...mno,fontSize:9,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:14}}>{'// FUEL UP'}</div>
                    <div style={{background:'#0d0d0d',border:'1px solid rgba(var(--accent-rgb),0.1)',borderRadius:12,padding:16}}>
                      <div style={{...cnd,fontSize:20,color:'#f5f5f0',textTransform:'uppercase',marginBottom:6}}>
                        {macros?`${Math.round((macros.protein||150)*0.35)}G PROTEIN · ${Math.round((macros.carbs||200)*0.3)}G CARBS`:'40–50G PROTEIN · MODERATE CARBS'}
                      </div>
                      <div style={{...mno,fontSize:9,color:'rgba(245,245,240,0.4)',lineHeight:1.6}}>
                        Post-workout window is open. Hit protein within the next 45 minutes.
                      </div>
                    </div>
                  </div>

                  {/* Next session */}
                  <div style={{marginBottom:48}}>
                    <div style={{...mno,fontSize:9,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:14}}>{'// NEXT UP'}</div>
                    <div style={{...cnd,fontSize:28,color:'#f5f5f0',textTransform:'uppercase',lineHeight:1,marginBottom:8}}>
                      {tomorrowFullDay} · {tomorrowFocus}
                    </div>
                    <div style={{...mno,fontSize:10,color:'rgba(245,245,240,0.4)',lineHeight:1.6}}>
                      {tomorrowType==='rest'?'Rest day tomorrow. Focus on sleep and nutrition for full recovery.':'Rest well tonight. Your next session is in 24 hours.'}
                    </div>
                  </div>

                  {/* Back to home */}
                  <button onClick={clearWorkoutSummary} style={{width:'100%',padding:'18px 0',background:'var(--accent)',border:'none',borderRadius:12,color:'#fff',...mno,fontSize:11,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',cursor:'pointer',marginBottom:16}}>
                    BACK TO HOME →
                  </button>

                </div>
              </div>
            );
          })(),
          document.body
        )}

        {/* ── ACTIVE WORKOUT ── */}
        {trainScreen==="active"&&activeSessionOpen&&ReactDOM.createPortal(
          <div style={{background:'#000000',position:'fixed',inset:0,zIndex:9999,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
            {/* End Session confirmation overlay */}
            {endConfirm&&(
              <div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(5,8,16,0.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
                <div style={{background:"#0a0e1a",border:"1px solid rgba(245,245,240,0.12)",borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center"}}>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,textTransform:"uppercase",marginBottom:10}}>End Session?</div>
                  <div style={{fontSize:14,color:"rgba(245,245,240,0.6)",lineHeight:1.6,marginBottom:24}}>Your progress will be saved before closing.</div>
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    <button onClick={()=>{setEndConfirm(false);finishWorkout();}} style={{padding:"14px",background:"var(--red)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--condensed)",fontWeight:800,fontSize:14,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>End Session</button>
                    <button onClick={()=>setEndConfirm(false)} style={{padding:"13px",background:"none",border:"1px solid rgba(245,245,240,0.12)",borderRadius:12,color:"rgba(245,245,240,0.65)",fontFamily:"var(--condensed)",fontWeight:700,fontSize:14,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Keep Going</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{maxWidth:680,margin:"0 auto",padding:isMobile?`max(env(safe-area-inset-top),16px) 18px 32px`:`max(env(safe-area-inset-top),16px) 24px 32px`}}>
            {/* Set completion flash overlay */}
            <SetFlashOverlay flash={setFlash}/>

            {sessionMode==='run-picker'&&renderRunPicker()}
            {sessionMode==='run-gps'&&renderGPSRunScreen()}
            {sessionMode==='run-manual'&&renderManualRunScreen()}
            {sessionMode==='run-manual-finish'&&renderManualRunFinishScreen()}
            {sessionMode==='run-summary'&&renderRunSummary()}
            {sessionMode==='hyrox-picker'&&renderHyroxPicker()}
            {sessionMode==='hyrox-sim'&&renderHyroxRaceSim()}
            {sessionMode==='hyrox-wod'&&renderHyroxWOD()}
            {sessionMode==='hyrox-weakness-picker'&&renderHyroxWeaknessPicker()}
            {sessionMode==='hyrox-summary'&&renderHyroxSummary()}
{!sessionMode&&(!activeWorkout
              ?<div style={{textAlign:"center",padding:"60px 24px",border:`1px dashed ${T.bd}`,borderRadius:20}}>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,color:"#f5f5f0",textTransform:"uppercase",lineHeight:0.9,marginBottom:16}}>NO SESSION<br/>ACTIVE<span style={{color:"var(--accent)"}}>.</span></div>
                <div style={{fontFamily:"var(--mono)",fontSize:12,color:T.mu,marginBottom:28,lineHeight:1.6}}>Head to the Train tab and tap Start Session to begin.</div>
                <button onClick={()=>setTrainScreen("today")} style={{padding:"14px 28px",background:"var(--accent)",color:"#fff",fontWeight:700,fontSize:11,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.14em"}}>GO TO TRAIN →</button>
              </div>
              : workoutSummary
                ? <WorkoutSummaryScreen
                    summary={workoutSummary}
                    history={history}
                    profile={profile}
                    onSaveAndExit={clearWorkoutSummary}
                    onLogMore={()=>{clearWorkoutSummary();setTrainScreen("builder");}}
                    plateausBroken={workoutSummary.plateausBroken||[]}
                  />
                : !activeWorkout.exercises?.length
                  ? <div style={{textAlign:"center",padding:"80px 24px"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>// NO SESSION FOUND</div>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:12}}>NO WORKOUT<br/>SCHEDULED.</div>
                      <div style={{fontFamily:"var(--condensed)",fontSize:18,color:"rgba(245,245,240,0.5)",lineHeight:1.5,marginBottom:32,maxWidth:280,margin:"0 auto 32px"}}>Your program doesn't have a session assigned for today. Try Adapt Now to generate one.</div>
                      <div style={{display:"flex",flexDirection:"column",gap:12,maxWidth:280,margin:"0 auto"}}>
                        <button onClick={()=>setShowAdapt(true)} style={{padding:"14px 28px",background:"var(--accent)",border:"none",borderRadius:12,color:"#fff",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer"}}>ADAPT NOW →</button>
                        <button onClick={()=>setTrainScreen("today")} style={{padding:"13px 28px",background:"none",border:"1px solid rgba(245,245,240,0.12)",borderRadius:12,color:"rgba(245,245,240,0.65)",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer"}}>GO BACK</button>
                      </div>
                    </div>
                  :<div>
                {/* Header */}
                <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.1)",borderRadius:14,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                  <button onClick={()=>setEndConfirm(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 8px",color:"#f5f5f0",fontSize:22,lineHeight:1,flexShrink:0}}>←</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1}}>{todayFocus}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",marginTop:2}}>{activeWorkout.exercises?.length||0} EXERCISES · {activeWorkout.exercises?.reduce((a,e)=>a+(e.sets?.length||0),0)||0} TOTAL SETS</div>
                    {deloadActive&&<div style={{display:"inline-block",marginTop:4,background:"rgba(254,160,32,0.1)",border:"1px solid rgba(254,160,32,0.2)",borderRadius:6,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"#FEA020",letterSpacing:"0.1em",textTransform:"uppercase"}}>DELOAD — 50% VOL</div>}
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                    {adaptLeft>0&&(
                      <button onClick={()=>setShowAdapt(true)} title="Adapt session" style={{width:36,height:36,borderRadius:10,background:"rgba(var(--accent-rgb),0.1)",border:"1px solid rgba(var(--accent-rgb),0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--red)",cursor:"pointer",flexShrink:0}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4.5 13.5h7L8.5 22 19 10h-7z"/></svg>
                      </button>
                    )}
                    <button onClick={finishWorkout} style={{padding:"10px 16px",background:"var(--accent)",color:"#fff",fontWeight:700,fontSize:11,border:"none",borderRadius:10,cursor:"pointer",fontFamily:"var(--mono)",textTransform:"uppercase",letterSpacing:"0.12em"}}>FINISH</button>
                  </div>
                </div>

                {/* Readiness banner */}
                {activeWorkout.readinessTier&&(()=>{const cfg=READINESS_CONFIG[activeWorkout.readinessTier];const isOptimal=activeWorkout.readinessTier==="optimal";const badgeColor=isOptimal?"#22c55e":cfg.color;return(
                  <div style={{background:`${badgeColor}10`,border:`1.5px solid ${badgeColor}30`,borderRadius:14,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--accent)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:3}}>{cfg.badge}</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",lineHeight:1.1}}>{cfg.label}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:3}}>{cfg.sub}</div>
                    </div>
                  </div>
                );})()}

                {/* Pre-session prediction card */}
                {sessionPrediction!=null&&(()=>{
                  const p=sessionPrediction;
                  const isStrong=p.probability>=75;
                  const isSolid=p.probability>=50&&p.probability<75;
                  const color=isStrong?T.green:isSolid?T.prot:T.fat;
                  const badge=isStrong?"STRONG DAY":isSolid?"SOLID SESSION":"RECOVERY SESSION";
                  const sub=isStrong?"Conditions aligned — PR opportunity today":isSolid?"Good session likely — execute your plan":"Suboptimal conditions — focus on technique";
                  const factors=p.factors||[];
                  return(
                    <div style={{background:`${color}0d`,border:`1.5px solid ${color}30`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                        <div>
                          <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:15,color,letterSpacing:".06em",textTransform:"uppercase"}}>{badge} — {p.probability}% PR PROBABILITY</div>
                          <div style={{fontSize:11,color:"rgba(245,245,240,.55)",marginTop:2}}>{sub}</div>
                        </div>
                      </div>
                      {factors.length>0&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {factors.map((f,fi)=>(
                            <span key={fi} style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:20,
                              background:f.ok?"rgba(34,197,94,.12)":f.ok===false?"rgba(239,68,68,.12)":"rgba(var(--accent-rgb),0.06)",
                              color:f.ok?T.green:f.ok===false?T.prot:"rgba(245,245,240,.4)",
                              border:`1px solid ${f.ok?"rgba(34,197,94,.2)":f.ok===false?"rgba(239,68,68,.2)":"rgba(var(--accent-rgb),0.1)"}`}}>
                              {f.ok?"✓":f.ok===false?"✗":"—"} {f.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Active workout ACWR risk banner */}
                {acwrHighRisks?.length>0&&(
                  <div style={{background:"rgba(var(--accent-rgb),0.08)",border:"1.5px solid rgba(var(--accent-rgb),0.25)",borderRadius:14,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:13,color:"var(--red)",letterSpacing:".06em",textTransform:"uppercase"}}>{acwrHighRisks[0].region.replace("_"," ").toUpperCase()} RISK ELEVATED</div>
                      <div style={{fontSize:11,color:"rgba(245,245,240,.5)",marginTop:2}}>Consider reducing sets by 1 for safety</div>
                    </div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:800,fontSize:18,color:"var(--red)"}}>{acwrHighRisks[0].score}%</div>
                  </div>
                )}

                {/* Momentum bar */}
                <MomentumBar activeWorkout={activeWorkout} history={history}/>

                {/* Exercise — single card + prev/next navigation */}
                {(()=>{
                  const exList=activeWorkout.exercises||[];
                  const ei=Math.min(currentExerciseIdx,exList.length-1);
                  const ex=exList[ei];
                  if(!ex)return null;
                  console.log('EXERCISE MUSCLES:',{name:ex.name,primaryMuscles:ex.primaryMuscles,secondaryMuscles:ex.secondaryMuscles,muscleGroup:ex.muscleGroup,muscles:ex.muscles,category:ex.category,bodyPart:ex.bodyPart});
                  console.log('IMAGE FIELDS:',{gif:ex.gif,gifUrl:ex.gifUrl,image:ex.image,imageUrl:ex.imageUrl,thumbnail:ex.thumbnail});
                  const sugg=getSuggestion(ex.name);
                  const doneSets=(ex.sets||[]).filter(s=>s.done).length;
                  const totalSets=(ex.sets||[]).length;
                  const allDone=doneSets===totalSets&&totalSets>0;
                  const nextSetIdx=(ex.sets||[]).findIndex(s=>!s.done);
                  const nextEx=exList[ei+1];
                  const nextLabel=nextEx?(nextEx.name.length>16?nextEx.name.slice(0,14)+'…':nextEx.name).toUpperCase():null;
                  return(
                    <>
                    <div style={{background:"#0d0d0d",border:`1px solid ${allDone?"rgba(34,197,94,0.3)":"rgba(var(--accent-rgb),0.08)"}`,borderRadius:18,padding:"18px 20px",marginBottom:12,position:"relative",overflow:"hidden",transition:"border-color .3s"}}>
                      {allDone&&<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"#22c55e",borderRadius:"18px 18px 0 0"}}/>}
                      {/* Exercise header */}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                            <div style={{width:24,height:24,borderRadius:"50%",background:allDone?"#22c55e":T.s3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:allDone?"#000":T.mu,flexShrink:0}}>
                              {allDone
                                ? <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#000" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : ei+1}
                            </div>
                            {(()=>{
                              const exMuscleData=getExerciseData(ex.name);
                              const rawMuscle=(exMuscleData?.primary?.[0]||ex.primaryMuscles?.[0]||ex.muscleGroup||ex.muscles?.primary?.[0]||ex.bodyPart||ex.category||'chest').toLowerCase();
                              const MUSCLE_MAP={chest:{color:'var(--accent)',letter:'C'},pec:{color:'var(--accent)',letter:'C'},lat:{color:'#60a5fa',letter:'B'},back:{color:'#60a5fa',letter:'B'},rhomboid:{color:'#60a5fa',letter:'B'},trap:{color:'#60a5fa',letter:'B'},teres:{color:'#60a5fa',letter:'B'},serratus:{color:'#60a5fa',letter:'B'},delt:{color:'#FEA020',letter:'S'},shoulder:{color:'#FEA020',letter:'S'},femoris:{color:'#22c55e',letter:'L'},vastus:{color:'#22c55e',letter:'L'},rectus:{color:'#22c55e',letter:'L'},gluteus:{color:'#22c55e',letter:'L'},glute:{color:'#22c55e',letter:'L'},adductor:{color:'#22c55e',letter:'L'},leg:{color:'#22c55e',letter:'L'},calf:{color:'#22c55e',letter:'L'},calves:{color:'#22c55e',letter:'L'},bicep:{color:'#9C6FFF',letter:'A'},tricep:{color:'#9C6FFF',letter:'A'},arm:{color:'#9C6FFF',letter:'A'},forearm:{color:'#9C6FFF',letter:'A'},brachialis:{color:'#9C6FFF',letter:'A'},abs:{color:'#14C4B3',letter:'CO'},oblique:{color:'#14C4B3',letter:'CO'},core:{color:'#14C4B3',letter:'CO'},default:{color:'var(--accent)',letter:'?'}};
                              const muscleKey=Object.keys(MUSCLE_MAP).find(k=>k!=='default'&&rawMuscle.includes(k))||'default';
                              const {color:fallbackBg,letter:mLetter}=MUSCLE_MAP[muscleKey];
                              // Image source — check all possible field names
                              const imgSrc=ex.gif||ex.gifUrl||ex.image||ex.imageUrl||ex.thumbnail||getThumbnailUrl(ex.name)||null;
                              return(
                                <div onClick={()=>openDetail(ex.name,ei)} style={{position:"relative",width:64,height:64,borderRadius:10,background:T.s3,border:`1px solid ${T.bd}`,flexShrink:0,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  {imgSrc?(<img src={imgSrc} alt={ex.name} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}/>):null}
                                  <div style={{position:"absolute",inset:0,display:imgSrc?"none":"flex",background:fallbackBg,borderRadius:10,alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:26,color:"#fff",lineHeight:1,textTransform:"uppercase"}}>{mLetter}</span>
                                  </div>
                                </div>
                              );
                            })()}
                            <div style={{fontSize:16,fontWeight:700,flex:1,cursor:"pointer",userSelect:"none",minWidth:0}} onPointerDown={()=>startLongPress(ex.name,ei)} onPointerUp={cancelLongPress} onPointerLeave={cancelLongPress} onPointerCancel={cancelLongPress}>
                              <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ex.name}</div>
                              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:2}}>
                                {ex.tier&&<span style={{fontSize:9,fontWeight:700,background:ex.tier==="A"?`rgba(var(--accent-rgb),0.12)`:ex.tier==="B"?`${T.carb}20`:"rgba(var(--accent-rgb),0.08)",color:ex.tier==="A"?T.prot:ex.tier==="B"?T.carb:T.mu,borderRadius:4,padding:"1px 5px",letterSpacing:".06em"}}>{ex.tier}</span>}
                                {ex.priority&&<span style={{fontSize:9,fontWeight:700,background:"rgba(249,115,22,.15)",color:"#F97316",borderRadius:4,padding:"1px 5px",letterSpacing:".06em",display:"inline-flex",alignItems:"center",gap:2}}><svg width={7} height={7} viewBox="0 0 24 24" fill="#F97316"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>PRIORITY</span>}
                                {ex.mobilitySubstituted&&<span style={{fontSize:9,fontWeight:700,background:"rgba(139,92,246,.15)",color:"#8B5CF6",borderRadius:4,padding:"1px 5px",letterSpacing:".06em"}}>MODIFIED</span>}
                              </div>
                            </div>
                            <button onClick={()=>toggleFavorite(ex.originalName||ex.name)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",lineHeight:1,flexShrink:0,display:"flex",alignItems:"center",color:favorites.includes(ex.originalName||ex.name)?T.prot:"rgba(245,245,240,.3)"}}>
                              <svg width={15} height={15} viewBox="0 0 24 24" fill={favorites.includes(ex.originalName||ex.name)?"currentColor":"none"} style={{stroke:"currentColor",strokeWidth:1.7}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                            </button>
                            <button onClick={()=>setSwapModal({exerciseIdx:ei,exerciseName:ex.name,originalName:ex.originalName||ex.name})} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",lineHeight:1,flexShrink:0,display:"flex",alignItems:"center",color:"rgba(245,245,240,.3)"}}>
                              <svg width={15} height={15} viewBox="0 0 24 24" fill="none"><path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                          {ex.notes&&<div style={{fontSize:11,color:T.mu,marginLeft:32}}>{ex.notes}</div>}
                          {(()=>{
                            const exPlateau=(activePlateaus||[]).find(p=>p.exercise_name===ex.name&&p.status==="active");
                            if(!exPlateau)return null;
                            return(<div style={{marginLeft:32,marginTop:4}}><span style={{display:"inline-block",background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:4,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"#60a5fa",letterSpacing:"0.08em",textTransform:"uppercase"}}>PLATEAU — USE {exPlateau.strategy_prescribed||"DROP SETS"} TODAY</span></div>);
                          })()}
                          {ex.isBalanceCorrection&&<div style={{marginLeft:32,marginTop:4}}><span style={{display:"inline-block",background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:4,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"#60a5fa",letterSpacing:"0.08em",textTransform:"uppercase"}}>// BALANCE CORRECTION</span></div>}
                          {ex.priority&&<div style={{marginLeft:32,marginTop:4}}><span style={{display:"inline-block",background:"rgba(254,160,32,0.1)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:4,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"#FEA020",letterSpacing:"0.08em",textTransform:"uppercase"}}>// PRIORITY MUSCLE</span></div>}
                          {ex.mobilitySubstituted&&<div style={{marginLeft:32,marginTop:4}}><span style={{display:"inline-block",background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",borderRadius:4,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"rgba(96,165,250,0.7)",letterSpacing:"0.08em",textTransform:"uppercase"}}>// MOBILITY ADAPTED</span></div>}
                          {ex.isHealthAdapted&&<div style={{marginLeft:32,marginTop:4}}><span style={{display:"inline-block",background:"rgba(var(--accent-rgb),0.08)",border:"1px solid rgba(var(--accent-rgb),0.2)",borderRadius:4,padding:"2px 8px",fontFamily:"var(--mono)",fontSize:8,color:"var(--accent)",letterSpacing:"0.08em",textTransform:"uppercase"}}>// HEALTH ADAPTED</span></div>}
                          <div style={{marginLeft:32,marginTop:4}}><MuscleChips name={ex.name} sugg={sugg} history={history} muscleGroup={ex.muscleGroup} primaryMuscles={ex.primaryMuscles} secondaryMuscles={ex.secondaryMuscles}/></div>
                          {(()=>{
                            const exFatigue=(fatigueAlert?.fatigueSignals||[]).find(s=>(s.type==="exercise_rpe_drift"||s.type==="rpe_performance_divergence")&&s.exercise===ex.name);
                            if(!exFatigue)return null;
                            return(<div style={{marginLeft:32,marginTop:6,display:"flex",alignItems:"center",gap:8,background:"rgba(254,160,32,0.06)",borderRadius:6,padding:"5px 10px"}}><span style={{color:"#FEA020",fontFamily:"var(--mono)",fontSize:10,flexShrink:0}}>⚠</span><span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.5)",lineHeight:1.4}}>RPE trending up — same weight, more effort. Watch for fatigue.</span></div>);
                          })()}
                        </div>
                        {(()=>{
                          const exPlateau=(activePlateaus||[]).find(p=>p.exercise_name===ex.name&&p.status==="active");
                          const dropPct=0.70;
                          const dropWeight=sugg?.weight?Math.round(parseFloat(sugg.weight)*dropPct/2.5)*2.5:null;
                          return(
                            <div style={{background:`rgba(var(--accent-rgb),0.06)`,border:`1px solid rgba(var(--accent-rgb),0.15)`,borderRadius:10,padding:"8px 12px",textAlign:"right",flexShrink:0,marginLeft:12}}>
                              {sugg&&<><div style={{fontSize:8,color:T.prot,fontWeight:700,letterSpacing:1,marginBottom:2}}>SUGGESTED</div><div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,color:T.prot}}>{sugg.weight}{profile?.wUnit||'lbs'} × {sugg.reps}</div><div style={{fontSize:9,color:T.mu}}>{sugg.note}</div></>}
                              {exPlateau&&dropWeight&&exPlateau.strategy_prescribed==="DROP SET TECHNIQUE"&&<div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(96,165,250,0.7)",marginTop:4,lineHeight:1.4}}>Drop set: {dropWeight}{profile?.wUnit||'lbs'} after final set</div>}
                              {exPlateau&&exPlateau.strategy_prescribed==="WAVE LOADING"&&sugg?.weight&&(()=>{const w=parseFloat(sugg.weight)||0;return(<div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(96,165,250,0.7)",marginTop:4,lineHeight:1.5}}>W1: {Math.round(w*0.85/2.5)*2.5}×3 · {Math.round(w*0.90/2.5)*2.5}×2<br/>W2: {Math.round(w*0.87/2.5)*2.5}×3 · {Math.round(w*0.92/2.5)*2.5}×2</div>);})()}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Progress bar */}
                      <div style={{height:3,background:T.s3,borderRadius:2,marginBottom:12,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${totalSets>0?doneSets/totalSets*100:0}%`,background:allDone?"#22c55e":"var(--accent)",borderRadius:2,transition:"background 0.4s, width .4s"}}/>
                      </div>

                      <PrevSessionRow exerciseName={ex.name} history={history} wUnit={profile?.wUnit||'lbs'}/>

                      {/* Set headers — SET / WEIGHT / REPS / DONE */}
                      <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 72px",gap:6,marginBottom:8}}>
                        {["SET","WEIGHT","REPS","DONE"].map(h=>(<div key={h} style={{fontSize:8,color:T.mu,fontWeight:700,letterSpacing:1.5,textAlign:"center"}}>{h}</div>))}
                      </div>

                      {/* Sets */}
                      {(()=>{
                        let _firstDoneMarked=false;
                        return(ex.sets||[]).map((s,si)=>{
                          const isActiveSt=!s.done&&si===nextSetIdx;
                          const isEditing=editingSet?.ei===ei&&editingSet?.si===si;
                          const showHint=s.done&&!_firstDoneMarked&&!editHintDismissed;
                          if(s.done)_firstDoneMarked=true;
                          return(
                            <div key={si}>
                              {showHint&&<div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4,marginLeft:44}}><svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.3)" strokeWidth={2} strokeLinecap="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.06em"}}>tap to edit</span></div>}
                              <div style={{display:"grid",gridTemplateColumns:"44px 1fr 1fr 72px",gap:6,marginBottom:8,alignItems:"center"}}>
                                <div style={{fontSize:13,color:s.done?"#22c55e":isActiveSt?"#f5f5f0":T.mu,fontWeight:700,textAlign:"center"}}>#{si+1}</div>
                                <input defaultValue={s.weight||sugg?.weight||""} placeholder={profile?.wUnit||'lbs'} style={{background:s.done&&!isEditing?"rgba(34,197,94,0.08)":isActiveSt||isEditing?"rgba(var(--accent-rgb),0.06)":"#0d0d0d",border:`1.5px solid ${s.done&&!isEditing?"rgba(34,197,94,0.25)":isActiveSt||isEditing?"rgba(var(--accent-rgb),0.3)":"rgba(245,245,240,0.08)"}`,borderRadius:9,padding:"10px",color:s.done&&!isEditing?"#22c55e":isActiveSt||isEditing?"#f5f5f0":"rgba(245,245,240,0.5)",fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"center",width:"100%",boxSizing:"border-box"}} onChange={e=>{const u={...activeWorkout};u.exercises[ei].sets[si].weight=e.target.value;setActiveWorkout(u);}} onFocus={s.done?()=>{setEditingSet({ei,si});setEditHintDismissed(true);}:undefined}/>
                                <input defaultValue={s.reps||sugg?.reps||10} style={{background:s.done&&!isEditing?"rgba(34,197,94,0.08)":isActiveSt||isEditing?"rgba(var(--accent-rgb),0.06)":"#0d0d0d",border:`1.5px solid ${s.done&&!isEditing?"rgba(34,197,94,0.25)":isActiveSt||isEditing?"rgba(var(--accent-rgb),0.3)":"rgba(245,245,240,0.08)"}`,borderRadius:9,padding:"10px",color:s.done&&!isEditing?"#22c55e":isActiveSt||isEditing?"#f5f5f0":"rgba(245,245,240,0.5)",fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"center",width:"100%",boxSizing:"border-box"}} onChange={e=>{const u={...activeWorkout};u.exercises[ei].sets[si].reps=e.target.value;setActiveWorkout(u);}} onFocus={s.done?()=>{setEditingSet({ei,si});setEditHintDismissed(true);}:undefined}/>
                                <button onClick={()=>{if(isEditing){editSet(ei,si,activeWorkout.exercises[ei].sets[si].reps,activeWorkout.exercises[ei].sets[si].weight);setEditingSet(null);}else{const u={...activeWorkout};logSet(ei,si,u.exercises[ei].sets[si].reps,u.exercises[ei].sets[si].weight);onStartLocalRest&&onStartLocalRest(90);}}} style={{padding:"10px 0",background:s.done&&!isEditing?"#22c55e":isActiveSt||isEditing?"var(--accent)":"#0d0d0d",color:s.done&&!isEditing?"#000":isActiveSt||isEditing?"#fff":"rgba(245,245,240,0.5)",border:`1.5px solid ${s.done&&!isEditing?"#22c55e":isActiveSt||isEditing?"var(--accent)":"rgba(245,245,240,0.08)"}`,borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:800,fontFamily:"inherit",width:"100%",transition:"all .2s"}}>{isEditing?"UPDATE":s.done?"✓":"LOG"}</button>
                              </div>
                              {s.done&&(
                                <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:44,marginBottom:6,marginTop:-2}}>
                                  <span style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.25)",marginRight:2,letterSpacing:"0.08em"}}>RPE</span>
                                  {[6,7,8,9,10].map(r=>(
                                    <button key={r} onClick={()=>{const u={...activeWorkout};u.exercises[ei].sets[si].rpe=r;setActiveWorkout(u);}} style={{width:26,height:20,borderRadius:4,border:`1px solid ${s.rpe===r?"#FEA020":"rgba(245,245,240,0.08)"}`,background:s.rpe===r?"rgba(254,160,32,0.15)":"transparent",color:s.rpe===r?"#FEA020":"rgba(245,245,240,0.3)",fontFamily:"var(--mono)",fontSize:8,cursor:"pointer",padding:0,fontWeight:s.rpe===r?700:400,lineHeight:1}}>{r}</button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}

                      {sessionPRs[ex.name]&&(
                        <div style={{background:"rgba(var(--accent-rgb),0.08)",border:"1px solid rgba(var(--accent-rgb),0.2)",borderRadius:8,padding:"8px 12px",display:"flex",gap:8,alignItems:"center",marginTop:6,marginBottom:4}}>
                          <span style={{fontSize:14,flexShrink:0}}>🔥</span>
                          <div><div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:14,color:"var(--accent)"}}>NEW PR.</div><div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)"}}>{sessionPRs[ex.name].weight} {profile?.wUnit||"lbs"} × {sessionPRs[ex.name].reps} reps</div></div>
                        </div>
                      )}

                      <button onClick={()=>{const u={...activeWorkout};u.exercises[ei].sets=[...u.exercises[ei].sets,{reps:u.exercises[ei].sets[0]?.reps||10,weight:u.exercises[ei].sets[0]?.weight||"",done:false}];setActiveWorkout(u);}} style={{width:"100%",fontSize:11,color:T.mu,background:"none",border:`1px dashed ${T.bd}`,borderRadius:8,padding:"8px",cursor:"pointer",fontFamily:"inherit",marginTop:4}}>+ Add Set</button>

                      {allDone&&(
                        <div style={{marginTop:14,padding:"12px 14px",background:T.s2,borderRadius:12,border:`1px solid ${T.bd}`}}>
                          <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>Quick Feedback</div>
                          <div style={{marginBottom:8}}>
                            <div style={{fontSize:11,color:"rgba(245,245,240,.55)",marginBottom:6}}>Feel the right muscle?</div>
                            <div style={{display:"flex",gap:6}}>
                              {[["yes","💯 Yes"],["somewhat","🤷 Somewhat"],["no","❌ No"]].map(([v,l])=>(<button key={v} onClick={()=>{const u={...activeWorkout};if(!u.exercises[ei].feedback)u.exercises[ei].feedback={};u.exercises[ei].feedback.feel=v;setActiveWorkout({...u});}} style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:700,borderRadius:8,border:`1.5px solid ${ex.feedback?.feel===v?T.carb:T.bd}`,background:ex.feedback?.feel===v?`${T.carb}18`:T.s1,color:ex.feedback?.feel===v?T.carb:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>))}
                            </div>
                          </div>
                          <div>
                            <div style={{fontSize:11,color:"rgba(245,245,240,.55)",marginBottom:6}}>Challenge level?</div>
                            <div style={{display:"flex",gap:6}}>
                              {[["easy","Easy"],["perfect","Perfect"],["hard","Hard"]].map(([v,l])=>(<button key={v} onClick={()=>{const u={...activeWorkout};if(!u.exercises[ei].feedback)u.exercises[ei].feedback={};u.exercises[ei].feedback.challenge=v;setActiveWorkout({...u});}} style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:700,borderRadius:8,border:`1.5px solid ${ex.feedback?.challenge===v?T.prot:T.bd}`,background:ex.feedback?.challenge===v?`rgba(var(--accent-rgb),0.09)`:T.s1,color:ex.feedback?.challenge===v?T.prot:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>{l}</button>))}
                            </div>
                          </div>
                          {ex.feedback?.feel==="no"&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(var(--accent-rgb),.06)",border:"1px solid rgba(var(--accent-rgb),.18)",borderRadius:8,fontSize:11,color:T.prot}}>Mind-muscle tip: slow the eccentric, reduce weight 10%, focus on the squeeze at peak contraction.</div>}
                          {ex.feedback?.feel==="yes"&&ex.feedback?.challenge==="easy"&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(52,211,153,.08)",border:"1px solid rgba(52,211,153,.2)",borderRadius:8,fontSize:11,color:T.green}}>Add 2.5–5 lbs next session.</div>}
                          {ex.feedback?.feel==="somewhat"&&ex.feedback?.challenge==="perfect"&&<div style={{marginTop:10,padding:"8px 12px",background:"rgba(var(--accent-rgb),.05)",border:"1px solid rgba(var(--accent-rgb),.15)",borderRadius:8,fontSize:11,color:T.prot}}>Focus on the target muscle before each set. Try a 2-second pause at peak.</div>}
                        </div>
                      )}
                    </div>

                    {/* Prev / Counter / Next navigation bar */}
                    <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.1)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      {ei>0
                        ?<button onClick={()=>setCurrentExerciseIdx(ei-1)} style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:10,padding:"10px 16px",fontFamily:"var(--mono)",fontSize:10,color:"#f5f5f0",cursor:"pointer",letterSpacing:"0.1em",minWidth:80}}>← PREV</button>
                        :<div style={{minWidth:80}}/>
                      }
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",letterSpacing:"0.08em"}}>{ei+1} / {exList.length}</span>
                      {ei<exList.length-1
                        ?<button onClick={()=>setCurrentExerciseIdx(ei+1)} style={{background:"var(--accent)",border:"none",borderRadius:10,padding:"10px 16px",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:"#fff",cursor:"pointer",letterSpacing:"0.08em",maxWidth:170,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>NEXT: {nextLabel} →</button>
                        :<button onClick={finishWorkout} style={{background:"var(--accent)",border:"none",borderRadius:10,padding:"10px 16px",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:"#fff",cursor:"pointer",letterSpacing:"0.08em"}}>FINISH SESSION →</button>
                      }
                    </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
          </div>
        , document.body)}

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

        {/* ── PLAN — redesigned paper view ── */}
        {trainScreen==="plan"&&GOCLUB_REDESIGN&&(()=>{
          // Recompute progName/displayWeek/expLabel exactly as Quick Access carousel does
          const _progInfo=PROGRAM_LIBRARY.find(p=>p.splitKey===wPrefs.splitType||p.name===wPrefs.splitType)||null;
          const _rtl={half_marathon:'Half Marathon',half:'Half Marathon','5k':'5K','10k':'10K',marathon:'Marathon',general:'General Fitness'};
          const _rl=_rtl[(profile?.run_race_type||'').toLowerCase()]||profile?.run_race_type||'';
          const progName=
            wPrefs.isHyrox&&wPrefs.isHybrid?(wPrefs.hybridTemplate||"Hyrox Hybrid"):
            wPrefs.isHyrox?(wPrefs.hyroxProgram||"Hyrox"):
            wPrefs.isHybrid?(_rl?`${wPrefs.hybridTemplate||"Hybrid"} · ${_rl}`:(wPrefs.hybridTemplate||"Hybrid")):
            prescType==="running"?(_rl||wPrefs.runPlan||"Running"):
            _progInfo?.name||(wPrefs.splitType||"Custom Plan");
          const displayWeek=programCurrentWeek||weekNum;
          const _liftExp=wPrefs?.liftExp||profile?.liftExp||"intermediate";
          const expLabel=_liftExp.charAt(0).toUpperCase()+_liftExp.slice(1);
          const _modeDesc=
            wPrefs.isHyrox&&wPrefs.isHybrid?"Strength + Hyrox hybrid":
            wPrefs.isHyrox?"Hyrox race prep":
            wPrefs.isHybrid?"Strength + endurance":
            prescType==="running"?`Training for ${_rl||"your race"}`:
            `${daysPerWeek} day${daysPerWeek!==1?"s":""} a week`;
          // Per-day done signal: ISO dates that had any logged exercise this week
          const _tIdx=WDAYS.indexOf(todayKey);
          const _wkDates=WDAYS.map((_,i)=>{const d=new Date();d.setDate(d.getDate()-_tIdx+i);return d.toISOString().split('T')[0];});
          const _doneDates=new Set(Object.values(history||{}).flatMap(s=>s.filter(x=>_wkDates.includes(x.date)).map(x=>x.date)));
          const _MO="'DM Mono',monospace";
          const _AF="'Barlow',sans-serif";
          const _BC="'Barlow Condensed',sans-serif";
          return(
            <div>
              {/* RED HERO BAND */}
              <div style={{paddingLeft:20,paddingRight:20,paddingTop:14,paddingBottom:84}}>
                <div style={{fontFamily:_MO,fontSize:9,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.55)",marginBottom:8,display:"flex",gap:8,alignItems:"center"}}>
                  <span>YOUR PLAN</span>
                  <span style={{color:"rgba(255,255,255,0.25)"}}>·</span>
                  <span style={{color:"rgba(255,255,255,0.75)"}}>{expLabel}</span>
                </div>
                <div style={{fontFamily:_BC,fontStyle:"italic",fontWeight:900,fontSize:40,lineHeight:0.92,textTransform:"uppercase",color:"#fff",letterSpacing:"-0.01em",marginBottom:8}}>
                  {progName}
                </div>
                <div style={{fontFamily:_MO,fontSize:10,color:"rgba(255,255,255,0.50)",letterSpacing:"0.06em"}}>
                  {_modeDesc} · Week {displayWeek}
                </div>
              </div>

              {/* PAPER CARD — THIS WEEK */}
              <PaperCard style={{margin:"-60px 12px 0",padding:"20px 0 4px"}}>
                {/* Card header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",marginBottom:14}}>
                  <div style={{fontFamily:_MO,fontSize:9,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase",color:"var(--cm-ink)"}}>THIS WEEK</div>
                  <button onClick={()=>{_hL();setTrainScreen("library");}} style={{fontFamily:_MO,fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--cm-red)",background:"none",border:"none",cursor:"pointer",padding:0,minHeight:"auto",minWidth:"auto"}}>
                    Switch program →
                  </button>
                </div>

                {/* 7-day rows */}
                <div style={{display:"flex",flexDirection:"column"}}>
                  {WDAYS.map((day,dayIdx)=>{
                    const t=schedule[day];
                    const isToday=day===todayKey;
                    const isRest=!t||t==="rest";
                    const isTraining=!isRest;
                    const focus=resolvedDayFocus[day]||(isRest?"Rest":"Training");
                    const isDone=!isToday&&_doneDates.has(_wkDates[dayIdx]);
                    const isExpanded=isToday||(planExpandedDay===day);
                    return(
                      <div
                        key={day}
                        onClick={()=>{if(!isToday&&isTraining){_hL();setPlanExpandedDay(planExpandedDay===day?null:day);}}}
                        style={{
                          position:"relative",
                          padding:isExpanded&&isTraining?"12px 16px 14px 14px":"10px 16px 10px 14px",
                          borderLeft:isToday?"3px solid var(--cm-red)":"3px solid transparent",
                          background:isToday?"rgba(var(--cm-red-rgb),.05)":"transparent",
                          cursor:!isToday&&isTraining?"pointer":"default",
                          transition:"background 0.15s",
                        }}
                      >
                        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                          {/* Day abbrev */}
                          <div style={{fontFamily:_MO,fontSize:10,fontWeight:700,letterSpacing:"0.06em",color:isToday?"var(--cm-red)":isDone?"rgba(var(--cm-ink-rgb),.40)":"rgba(var(--cm-ink-rgb),.42)",width:28,flexShrink:0,textTransform:"uppercase",paddingTop:2}}>
                            {day.slice(0,3)}
                          </div>
                          {/* Content */}
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:isTraining&&!isExpanded?4:0}}>
                              <div style={{fontFamily:_AF,fontWeight:700,fontSize:13,color:isToday?"var(--cm-ink)":isDone?"rgba(var(--cm-ink-rgb),.40)":isRest?"rgba(var(--cm-ink-rgb),.38)":"var(--cm-ink)",textDecoration:isDone?"line-through":"none",lineHeight:1.2}}>
                                {focus}
                              </div>
                              {isDone&&(
                                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="var(--cm-red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </div>
                            {/* Collapsed training: group pills */}
                            {isTraining&&!isExpanded&&(
                              <MusclePills focus={focus} variant="groups" max={3}/>
                            )}
                            {/* Rest label */}
                            {isRest&&(
                              <div style={{fontFamily:_MO,fontSize:9,color:"rgba(var(--cm-ink-rgb),.35)",letterSpacing:"0.05em",marginTop:2}}>
                                Recover &amp; grow
                              </div>
                            )}
                            {/* Expanded: exact sub-muscle pills */}
                            {isExpanded&&isTraining&&(
                              <div style={{marginTop:8}}>
                                <div style={{fontFamily:_MO,fontSize:8,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(var(--cm-ink-rgb),.38)",marginBottom:6}}>
                                  MUSCLES WORKED
                                </div>
                                <MusclePills focus={focus} variant="exact"/>
                              </div>
                            )}
                          </div>
                          {/* Chevron for non-today training rows */}
                          {!isToday&&isTraining&&(
                            <div style={{color:"rgba(var(--cm-ink-rgb),.22)",fontSize:12,transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",flexShrink:0,paddingTop:2}}>▾</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ADJUST MY WEEK — collapsed schedule editor */}
                <div style={{margin:"12px 16px 16px",borderTop:"1px solid rgba(var(--cm-ink-rgb),.08)",paddingTop:12}}>
                  <button
                    onClick={()=>{_hL();setPlanShowAdjust(v=>!v);}}
                    style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:_MO,fontSize:9,fontWeight:700,letterSpacing:"0.10em",textTransform:"uppercase",color:"rgba(var(--cm-ink-rgb),.48)",minHeight:"auto",minWidth:"auto"}}
                  >
                    <span>Adjust my week</span>
                    <span style={{display:"inline-block",transform:planShowAdjust?"rotate(90deg)":"rotate(0deg)",transition:"transform 0.2s",fontStyle:"normal"}}>›</span>
                  </button>
                  {planShowAdjust&&(
                    <div style={{marginTop:12}}>
                      {WDAYS.map(day=>{
                        const isT=day===todayKey;
                        const f=resolvedDayFocus[day];
                        return(
                          <div key={day} style={{padding:"9px 0",borderBottom:"1px solid rgba(var(--cm-ink-rgb),.06)"}}>
                            {/* Day name + current focus */}
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                              <span style={{fontFamily:_MO,fontWeight:700,fontSize:11,color:isT?"var(--cm-red)":"var(--cm-ink)",width:28,flexShrink:0}}>{day}</span>
                              <span style={{fontFamily:_AF,fontSize:11,color:"rgba(var(--cm-ink-rgb),.55)"}}>{f}</span>
                            </div>
                            {/* Type pills — word labels, wrap naturally */}
                            <div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:36}}>
                              {[["training","Training"],["cardio","Cardio"],["run","Run"],["hyrox","Hyrox"],["rest","Rest"]].map(([tp,lbl])=>(
                                <button key={tp}
                                  onClick={()=>{const next={...schedule,[day]:tp};setSchedule(next);if(user)sb.from("profiles").upsert({id:user.id,schedule:next},{onConflict:"id"}).then(({error})=>{if(error)console.error('[schedule persist]',error);});}}
                                  style={{fontFamily:_AF,fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:999,border:`1px solid ${schedule[day]===tp?"var(--cm-red)":"rgba(var(--cm-ink-rgb),.18)"}`,background:schedule[day]===tp?"var(--cm-red)":"transparent",color:schedule[day]===tp?"#fff":"rgba(var(--cm-ink-rgb),.50)",cursor:"pointer",minHeight:"auto",minWidth:"auto",lineHeight:1.3}}
                                >{lbl}</button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </PaperCard>
            </div>
          );
        })()}

        {/* ── PLAN — dark legacy fallback (non-redesign) ── */}
        {trainScreen==="plan"&&!GOCLUB_REDESIGN&&(
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
            <SectionCard title="Training Mode">
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                {[["strength","Strength"],["run","Running"],["hyrox","Hyrox"],["hybrid","Hybrid"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setPlanMode(k)} style={{padding:"9px 14px",borderRadius:9,border:`1.5px solid ${planMode===k?T.prot:T.bd}`,background:planMode===k?`rgba(var(--accent-rgb),0.08)`:T.s3,color:planMode===k?T.prot:T.mu,fontFamily:"var(--mono)",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>{l}</button>
                ))}
              </div>
              {planMode==="hybrid"&&<div style={{borderTop:`1px solid ${T.bd}`,paddingTop:14}}>
                <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"var(--mono)",marginBottom:10}}>Mix</div>
                <Toggle on={hybridMix.strength} onChange={v=>setHybridMix(p=>({...p,strength:v}))} label="Strength splits"/>
                <Toggle on={hybridMix.run}      onChange={v=>setHybridMix(p=>({...p,run:v}))}      label="Running plan"/>
                <Toggle on={hybridMix.hyrox}    onChange={v=>setHybridMix(p=>({...p,hyrox:v}))}    label="Hyrox blocks"/>
              </div>}
              {planMode==="run"&&<div style={{borderTop:`1px solid ${T.bd}`,paddingTop:14}}>
                {Object.entries(RUN_PLANS).map(([k,p])=>(<div key={k} onClick={()=>setRunPlan(k)} style={{background:runPlan===k?`rgba(var(--accent-rgb),0.08)`:T.s3,border:`1.5px solid ${runPlan===k?T.prot:T.bd}`,borderRadius:10,padding:"11px 13px",marginBottom:7,cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
                  <div><div style={{fontSize:13,fontWeight:700,color:runPlan===k?T.prot:"#fff"}}>{k}</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>{p.desc}</div></div>
                  {p.weeks>0&&<div style={{background:T.s2,borderRadius:7,padding:"3px 8px",fontSize:10,color:T.mu,fontWeight:700,alignSelf:"center"}}>{p.weeks}wk</div>}
                </div>))}
              </div>}
            </SectionCard>
            <SectionCard title="Weekly Schedule">
              {WDAYS.map(day=>{const t=schedule[day];const c=DAY_CFG[t]||DAY_CFG.rest;const isT=day===todayKey;const f=resolvedDayFocus[day];return(
                <div key={day} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid rgba(245,245,240,0.05)`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontWeight:700,fontSize:13,color:isT?T.prot:"#fff",width:32}}>{day}</span>
                    <span style={{background:c.bg,color:c.color,fontSize:9,fontWeight:700,letterSpacing:1,padding:"2px 8px",borderRadius:20,textTransform:"uppercase"}}>{f}</span>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    {[["training","T"],["cardio","C"],["run","R"],["hyrox","H"],["rest","—"]].map(([tp,lbl])=>(<button key={tp} onClick={()=>{const next={...schedule,[day]:tp};setSchedule(next);if(user)sb.from("profiles").upsert({id:user.id,schedule:next},{onConflict:"id"}).then(({error})=>{if(error)console.error('[schedule persist]',error);});}} style={{fontSize:10,fontWeight:700,fontFamily:"var(--mono)",padding:"4px 7px",borderRadius:6,border:`1px solid ${schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).color:T.bd}`,background:schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).bg:"none",color:schedule[day]===tp?(DAY_CFG[tp]||DAY_CFG.rest).color:T.mu,cursor:"pointer"}}>{lbl}</button>))}
                  </div>
                </div>
              );})}
            </SectionCard>
          </div>
        )}

        {/* ── LIBRARY ── */}
        {trainScreen==="library"&&<ProgramLibraryScreen wPrefs={wPrefs} setWPrefs={setWPrefs} profile={profile} setTrainScreen={setTrainScreen} user={user} onProfileUpdate={onProfileUpdate} schedule={schedule} setSchedule={setSchedule}/>}

        {/* ── CUSTOM ROUTINE BUILDER ── */}
        {trainScreen==="routine-builder"&&<CustomRoutineBuilder user={user} setTrainScreen={setTrainScreen} onSaved={()=>{}} />}

        {/* ── WARM-UP PROTOCOLS VIEWER ── */}
        {trainScreen==="warmup-protocols"&&<WarmupProtocolsViewer isMobile={isMobile} setTrainScreen={setTrainScreen}/>}

        {/* ── PROGRESS ── */}
        {trainScreen==="progress"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:isMobile?"100%":740}}>
            <PerformanceCalendar profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>
            <AthletePassport user={user}/>
            {(wPrefs.isHyrox||profile?.run_race_type)&&<RacePredictor profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile}/>}
            <TrainingDNA profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>

            {/* Program Progress Card */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Current Program</div>
                  <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,lineHeight:1}}>{wPrefs.splitType||"No program set"}</div>
                  <div style={{fontSize:12,color:T.mu,marginTop:4}}>{wPrefs.equipment} · {profile?.liftExp||"Intermediate"}</div>
                </div>
                <div style={{background:`${T.fat}15`,border:`1px solid ${T.fat}30`,borderRadius:14,padding:"12px 18px",textAlign:"center",flexShrink:0}}>
                  <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900,color:T.fat,lineHeight:1}}>
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
                <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"var(--condensed)"}}>Personal Records 🏆</div>
                <div style={{fontSize:11,color:T.mu}}>Updated every session</div>
              </div>
              {Object.keys(history).length===0
                ?<div style={{textAlign:"center",padding:"32px 16px",border:`1px dashed ${T.bd}`,borderRadius:14,color:T.mu}}>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#f5f5f0",marginBottom:12,lineHeight:1}}>YOUR STORY<br/>STARTS TODAY.</div>
                  <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.6,marginBottom:20,maxWidth:260,margin:"0 auto 20px"}}>Complete your first session and log your first meal. Coach Macro will build your performance profile from real data.</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
                    <button onClick={()=>setTrainScreen("today")} style={{padding:"10px 16px",background:T.prot,color:T.white,fontWeight:700,fontSize:12,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1}}>START TODAY'S SESSION →</button>
                  </div>
                </div>
                :<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:10}}>
                  {Object.entries(history).slice(0,12).map(([key,sessions])=>{
                    const last=sessions[sessions.length-1];
                    const prev=sessions.length>1?sessions[sessions.length-2]:null;
                    const lastMax=Math.max(...last.sets.map(s=>parseFloat(s.weight||0)));
                    const prevMax=prev?Math.max(...prev.sets.map(s=>parseFloat(s.weight||0))):null;
                    const diff=prevMax?lastMax-prevMax:null;
                    const trend=diff?diff>0?"↑":diff<0?"↓":"→":null;
                    const tc=trend==="↑"?T.green:trend==="↓"?T.prot:T.mu;
                    return(
                      <div key={key} className="card-press" style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
                        {trend==="↑"&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:T.carb,borderRadius:"14px 14px 0 0"}}/>}
                        <div style={{fontSize:11,fontWeight:600,color:"#bbb",textTransform:"capitalize",marginBottom:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{key.replace(/_/g," ")}</div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                          <div>
                            <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,color:T.prot,lineHeight:1}}>{lastMax}</div>
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
                <div style={{fontSize:14,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:"rgba(245,245,240,0.65)",fontFamily:"var(--condensed)"}}>Weight Trend 📊</div>
                <div style={{display:"flex",gap:8}}>
                  <div style={{fontSize:11,color:T.mu}}>Start: <b style={{color:"#fff"}}>{profile?.startWeight||"—"} {profile?.wUnit||"lbs"}</b></div>
                  {profile?.goalWeight&&<div style={{fontSize:11,color:T.mu}}>Goal: <b style={{color:T.prot}}>{profile?.goalWeight} {profile?.wUnit||"lbs"}</b></div>}
                </div>
              </div>
              <div style={{textAlign:"center",padding:"24px",border:`1px dashed ${T.bd}`,borderRadius:12,color:T.mu,fontSize:12}}>
                <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                    <path d="M7 21H17"/>
                    <path d="M12 3v18"/>
                    <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                  </svg>
                </div>
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

  const COLOR={green:T.green,yellow:T.fat,red:T.prot,rest:"rgba(245,245,240,.12)",future:"rgba(245,245,240,.04)"};
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
          <div style={{fontFamily:"var(--condensed)",fontSize:24,fontWeight:900,lineHeight:1}}>
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
        const COLOR_STATUS={green:T.green,yellow:T.fat,red:T.prot,rest:T.mu,future:T.mu};
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
                  <span style={{color:d.wLog?T.green:T.prot,fontSize:13}}>{d.wLog?"✓":"✗"}</span>
                  <span style={{fontSize:12,color:"rgba(245,245,240,.8)"}}>Workout: {d.wLog?`${d.wLog.workout?.focus||"Completed"}`:status==="future"?"Upcoming":"Not logged"}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                  <span style={{color:d.calPct>=80&&d.calPct<=120?T.green:T.prot,fontSize:13}}>{d.calPct>=80&&d.calPct<=120?"✓":"✗"}</span>
                  <span style={{fontSize:12,color:"rgba(245,245,240,.8)"}}>Nutrition: {d.totalCals} / {d.macros.calories} kcal ({d.calPct}%)</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{color:d.protPct>=80?T.green:T.prot,fontSize:13}}>{d.protPct>=80?"✓":"✗"}</span>
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

// ─── DNA RADAR CANVAS ────────────────────────────────────────────────────────
function drawDNARadar(canvas,scores){
  if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  const W=canvas.offsetWidth||280;
  const H=290;
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  const ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#000000';ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2;
  const R=Math.min(W*0.30,H*0.30,100);
  const AXES=['strength','endurance','power','consistency','nutrition','recovery'];
  const LABELS=['STRENGTH','ENDURANCE','POWER','CONSISTENCY','NUTRITION','RECOVERY'];
  const N=6;
  const angle=i=>(i/N)*2*Math.PI-Math.PI/2;
  const pt=(i,r)=>({x:cx+r*Math.cos(angle(i)),y:cy+r*Math.sin(angle(i))});
  function hc(v){if(v>=80)return[232,52,28];if(v>=65)return[255,100,20];if(v>=50)return[254,160,32];if(v>=35)return[20,196,179];return[29,155,240];}
  // Inner rings
  [0.25,0.5,0.75].forEach(f=>{
    ctx.beginPath();for(let i=0;i<N;i++){const p=pt(i,R*f);i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}
    ctx.closePath();ctx.strokeStyle='rgba(var(--accent-rgb),0.09)';ctx.lineWidth=0.5;ctx.stroke();
  });
  // Outer boundary
  ctx.beginPath();for(let i=0;i<N;i++){const p=pt(i,R);i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);}
  ctx.closePath();ctx.strokeStyle='rgba(245,245,240,0.55)';ctx.lineWidth=1.2;ctx.stroke();
  // Axis spokes
  for(let i=0;i<N;i++){const p=pt(i,R);ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(p.x,p.y);ctx.strokeStyle='rgba(245,245,240,0.07)';ctx.lineWidth=0.5;ctx.stroke();}
  // Heatmap sectors
  for(let i=0;i<N;i++){
    const a0=angle(i),a1=angle((i+1)%N);
    const[r,g,b]=hc(scores[AXES[i]]||0);
    const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    grad.addColorStop(0,`rgba(${r},${g},${b},0)`);grad.addColorStop(0.45,`rgba(${r},${g},${b},0.07)`);grad.addColorStop(1,`rgba(${r},${g},${b},0.20)`);
    ctx.beginPath();ctx.moveTo(cx,cy);
    for(let s=0;s<=8;s++){const a=a0+(a1-a0)*s/8;ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));}
    ctx.closePath();ctx.fillStyle=grad;ctx.fill();
  }
  // Data polygon
  const vals=AXES.map(k=>scores[k]||0);
  ctx.beginPath();vals.forEach((v,i)=>{const p=pt(i,R*v/100);i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);});
  ctx.closePath();ctx.strokeStyle='rgba(var(--accent-rgb),0.45)';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='rgba(var(--accent-rgb),0.06)';ctx.fill();
  // Data points
  const maxV=Math.max(...vals);
  vals.forEach((v,i)=>{
    const p=pt(i,R*v/100);const[r,g,b]=hc(v);const isDom=v===maxV;
    if(isDom){ctx.beginPath();ctx.arc(p.x,p.y,13,0,Math.PI*2);ctx.fillStyle='rgba(254,160,32,0.22)';ctx.fill();}
    ctx.beginPath();ctx.arc(p.x,p.y,isDom?6:4,0,Math.PI*2);ctx.fillStyle=isDom?'#FEA020':`rgb(${r},${g},${b})`;ctx.fill();
  });
  // Labels
  ctx.textBaseline='middle';
  vals.forEach((v,i)=>{
    const a=angle(i);
    const lx=cx+(R+26)*Math.cos(a);const ly=cy+(R+26)*Math.sin(a);
    const dx=Math.cos(a);
    ctx.textAlign=Math.abs(dx)<0.25?'center':dx>0?'left':'right';
    const[r,g,b]=hc(v);
    ctx.font=`500 9px 'DM Mono',monospace`;ctx.fillStyle='rgba(245,245,240,0.38)';ctx.fillText(LABELS[i],lx,ly);
    ctx.font=`bold 11px 'DM Mono',monospace`;ctx.fillStyle=`rgb(${r},${g},${b})`;ctx.fillText(v,lx,ly+14);
  });
}

// ─── TRAINING DNA ────────────────────────────────────────────────────────────
export function TrainingDNA({profile,wPrefs,user,isMobile,schedule}){
  const [dnaData,setDnaData]=useState(null);
  const radarRef=useRef(null);

  const startD=profile?.startDate?new Date(profile.startDate):new Date();
  const daysSince=Math.max(0,Math.floor((new Date()-startD)/86400000));

  useEffect(()=>{
    if(!user)return;
    calculateTrainingDNA(user.id).then(result=>{
      const scores={
        strength:result.strength,endurance:result.endurance,power:result.power,
        consistency:result.consistency,nutrition:result.nutrition,recovery:result.recovery,
      };
      const metrics=[
        {label:"Strength",score:result.strength},{label:"Endurance",score:result.endurance},
        {label:"Power",score:result.power},{label:"Consistency",score:result.consistency},
        {label:"Nutrition",score:result.nutrition},{label:"Recovery",score:result.recovery},
      ];
      setDnaData({scores,metrics,total:result._meta?.sessions||0,highest:metrics.reduce((a,b)=>a.score>b.score?a:b),lowest:metrics.reduce((a,b)=>a.score<b.score?a:b)});
    }).catch(()=>{});
  },[user?.id]);

  useEffect(()=>{
    if(!radarRef.current)return;
    drawDNARadar(radarRef.current,dnaData?.scores||{strength:0,endurance:0,power:0,consistency:0,nutrition:0,recovery:0});
  },[dnaData]);

  if(daysSince<30){
    return(
      <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px"}}>
        <div style={{fontFamily:"var(--condensed)",fontSize:20,fontWeight:900,marginBottom:8}}>YOUR TRAINING DNA</div>
        <div style={{textAlign:"center",padding:"24px",color:T.mu}}>
          <div style={{marginBottom:12,display:"flex",justifyContent:"center"}}>
              <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/>
                <path d="M8.5 2h7"/>
                <path d="M7 16h10"/>
              </svg>
            </div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Unlocks after 30 days</div>
          <div style={{fontSize:12,color:T.dim}}>Keep training — {30-daysSince} days to go</div>
        </div>
      </div>
    );
  }

  function heatColor(v){return v>=80?"var(--accent)":v>=65?"#ff6414":v>=50?"#FEA020":v>=35?"#14c4b3":"#1D9BF0";}
  const RECS={
    "Strength":"Add one more strength day per week to compound your gains.",
    "Endurance":"Schedule a weekly long run to build your aerobic engine.",
    "Power":"Prioritize heavy compound lifts — squat, deadlift, press.",
    "Consistency":"Focus on showing up — frequency matters more than intensity.",
    "Nutrition":"Log food every day this week — even estimates count.",
    "Recovery":"Build a deload week every 4th week to reset adaptation.",
  };

  const DEFAULT_METRICS=[
    {label:"Strength",score:0},{label:"Endurance",score:0},{label:"Power",score:0},
    {label:"Consistency",score:0},{label:"Nutrition",score:0},{label:"Recovery",score:0},
  ];
  const scores=dnaData?.scores||{strength:0,endurance:0,power:0,consistency:0,nutrition:0,recovery:0};
  const metrics=dnaData?.metrics||DEFAULT_METRICS;
  const highest=dnaData?.highest||DEFAULT_METRICS[0];
  const lowest=dnaData?.lowest||DEFAULT_METRICS[0];

  return(
    <div style={{background:"#000",border:"1px solid rgba(245,245,240,0.08)",borderRadius:20,padding:isMobile?"18px 16px":"24px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6,fontWeight:500}}>// TRAINING DNA</div>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,textTransform:"uppercase",color:"#f5f5f0",lineHeight:1}}>{dnaData?getAthleteTitle(scores):"CALCULATING..."}</div>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",textAlign:"right",letterSpacing:"0.08em"}}>LAST 90 DAYS<br/>{dnaData?`${dnaData.total} SESSIONS`:"—"}</div>
      </div>
      <canvas ref={radarRef} style={{width:"100%",display:"block",borderRadius:8}}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px 12px",marginTop:16}}>
        {metrics.map(({label,score})=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:7,height:7,borderRadius:2,background:heatColor(score),flexShrink:0}}/>
            <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.45)",letterSpacing:"0.04em",textTransform:"uppercase"}}>{label}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:heatColor(score),marginLeft:"auto"}}>{dnaData?score:"—"}</span>
          </div>
        ))}
      </div>
      {dnaData&&(
        <div style={{marginTop:16,borderTop:"1px solid rgba(245,245,240,0.06)",paddingTop:12,display:"flex",flexDirection:"column",gap:5}}>
          <div style={{fontSize:12,color:"rgba(245,245,240,0.6)"}}><span style={{color:"#22c55e",fontWeight:700}}>Strength:</span> {highest.label} ({highest.score})</div>
          <div style={{fontSize:12,color:"rgba(245,245,240,0.6)"}}><span style={{color:"#FEA020",fontWeight:700}}>Gap:</span> {lowest.label} ({lowest.score})</div>
          <div style={{fontSize:12,color:"rgba(245,245,240,0.6)"}}><span style={{color:"var(--accent)",fontWeight:700}}>Tip:</span> {RECS[lowest.label]}</div>
        </div>
      )}
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
        <div style={{fontFamily:"var(--condensed)",fontSize:22,fontWeight:900,textTransform:"uppercase"}}>RACE PREDICTOR</div>
        <div style={{background:`${T.carb}15`,border:`1px solid ${T.carb}30`,borderRadius:20,padding:"4px 12px",fontSize:11,color:T.carb,fontWeight:700}}>{readiness}% READY</div>
      </div>
      <div style={{fontSize:11,color:T.mu,marginBottom:18}}>Based on your last {runLogs.length} logged sessions · Week {weekNum} of training</div>

      {isHyrox?(
        <div style={{background:T.s2,borderRadius:14,padding:"16px 18px",marginBottom:16}}>
          <div style={{fontSize:10,color:T.fat,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>HYROX FINISH TIME</div>
          <div style={{fontFamily:"var(--condensed)",fontSize:40,fontWeight:900,color:"#fff",lineHeight:1}}>{fmtTime(hyroxPred)}</div>
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
              <div style={{fontFamily:"var(--condensed)",fontSize:24,fontWeight:900,color:"#fff",lineHeight:1}}>{v}</div>
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

// ─── ATHLETE WAVE CHART ──────────────────────────────────────────────────────
function AthleteWaveChart({waveData}){
  if(!waveData||waveData.length<2)return null;
  const W=300,H=72,pad=8,n=waveData.length;
  const xStep=(W-pad*2)/(n-1);
  const pts=key=>waveData.map((d,i)=>({
    x:pad+i*xStep,
    y:H-pad-(d[key]/100)*(H-pad*2),
  }));
  const areaPath=points=>{
    const segs=points.map((p,i)=>{
      if(i===0)return`M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      const cpx=((points[i-1].x+p.x)/2).toFixed(1);
      return`C${cpx} ${points[i-1].y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    });
    const last=points[n-1],first=points[0];
    return segs.join(' ')+` L${last.x.toFixed(1)} ${H} L${first.x.toFixed(1)} ${H} Z`;
  };
  const linePath=points=>points.map((p,i)=>{
    if(i===0)return`M${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const cpx=((points[i-1].x+p.x)/2).toFixed(1);
    return`C${cpx} ${points[i-1].y.toFixed(1)} ${cpx} ${p.y.toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');
  const layers=[
    {key:'recovery',   color:T.fat,  aOp:0.18,sOp:0.55},
    {key:'consistency',color:T.green,aOp:0.20,sOp:0.60},
    {key:'volume',     color:T.carb, aOp:0.22,sOp:0.65},
    {key:'strength',   color:T.prot, aOp:0.28,sOp:0.80},
  ];
  const now=new Date();
  const firstLabel=(()=>{const d=new Date(now);d.setDate(d.getDate()-d.getDay()-(n-1)*7);return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});})();
  const lastLabel=(()=>{const d=new Date(now);d.setDate(d.getDate()-d.getDay());return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});})();
  return(
    <div style={{marginTop:16,marginBottom:4}}>
      <div style={{fontSize:10,color:'rgba(245,245,240,0.35)',letterSpacing:2,textTransform:'uppercase',fontFamily:"var(--mono)",marginBottom:8}}>TRAINING WAVE — 8 WEEKS</div>
      <div style={{borderRadius:10,overflow:'hidden',background:'rgba(var(--accent-rgb),0.03)',border:'1px solid rgba(var(--accent-rgb),0.07)'}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block'}}>
          {[25,50,75].map(v=>{
            const y=(H-pad-(v/100)*(H-pad*2)).toFixed(1);
            return<line key={v} x1={pad} y1={y} x2={W-pad} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>;
          })}
          {layers.map(({key,color,aOp,sOp})=>{
            const p=pts(key);
            return(
              <g key={key}>
                <path d={areaPath(p)} fill={color} fillOpacity={aOp}/>
                <path d={linePath(p)} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={sOp}/>
                <circle cx={p[n-1].x.toFixed(1)} cy={p[n-1].y.toFixed(1)} r={2.5} fill={color} fillOpacity={0.9}/>
              </g>
            );
          })}
        </svg>
        <div style={{display:'flex',justifyContent:'space-between',padding:'2px 8px 6px',fontFamily:"var(--mono)",fontSize:9,color:'rgba(245,245,240,0.35)'}}>
          <span>{firstLabel}</span><span>{lastLabel}</span>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
        {[{key:'strength',color:T.prot,label:'Strength'},{key:'volume',color:T.carb,label:'Volume'},{key:'consistency',color:T.green,label:'Consistency'},{key:'recovery',color:T.fat,label:'Recovery'}].map(({color,label})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:20,height:2,background:color,borderRadius:1}}/>
            <span style={{fontSize:10,color:'rgba(245,245,240,0.5)',fontFamily:"var(--mono)"}}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PASSPORT HELPERS ────────────────────────────────────────────────────────
const PASSPORT_STAT_DEFS=[
  {id:'athlete_since',label:'Athlete Since',locked:true},
  {id:'sessions',     label:'Sessions'},
  {id:'weight_lifted',label:'Volume Lifted'},
  {id:'top_pr',       label:'Top PR'},
  {id:'streak',       label:'Best Streak'},
  {id:'prs_month',    label:'PRs This Month'},
  {id:'programs',     label:'Programs Done'},
  {id:'rank',         label:'Rank'},
];

function getRank(w){
  if(w>=200)return'ELITE';
  if(w>=100)return'ADVANCED';
  if(w>=50) return'ATHLETE';
  if(w>=20) return'ROOKIE';
  return'BEGINNER';
}

function getAthleteTitle(dna){
  const{strength=0,endurance=0,power=0,consistency=0,nutrition=0,recovery=0}=dna;
  if(consistency>85)         return'IRON DISCIPLINE ATHLETE';
  if(strength>70&&endurance>60) return'HYBRID ATHLETE';
  if(strength>70)            return'STRENGTH ATHLETE';
  if(endurance>70)           return'ENDURANCE ATHLETE';
  if(power>70)               return'POWER ATHLETE';
  if(nutrition>80)           return'MACRO MASTER';
  if(recovery>80)            return'RECOVERY KING';
  return'BALANCED ATHLETE';
}

// ─── ATHLETE PASSPORT ────────────────────────────────────────────────────────
export function AthletePassport({user}){
  return <AthletePassportComponent userId={user?.id}/>;
}

export function ConnectSection({stravaToken,setStravaToken,stravaStatus,stravaAthlete,stravaActs,connectStrava,ahActs,garminActs,fitbitActs,importStatus,handleFile,fileRef,allActs,todayActs,earnedCals,isMobile}) {
  return (
    <div style={{paddingBottom:isMobile?20:0,padding:isMobile?"12px 18px":"0"}}>
      <div style={{fontFamily:"var(--condensed)",fontSize:32,fontWeight:900,marginBottom:4}}>CONNECT DEVICES</div>
      <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Burned calories automatically add to your Fuel budget</p>
      {earnedCals>0&&<div style={{background:`rgba(var(--accent-rgb),0.07)`,border:`1px solid rgba(var(--accent-rgb),0.19)`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:"var(--mono)",fontSize:9,color:T.prot,fontWeight:700,letterSpacing:"0.16em",textTransform:"uppercase"}}>// Earned Today</div><div style={{fontSize:12,color:T.mu,marginTop:2}}>{todayActs.map(a=>`${a.title||a.type}`).join(" · ")}</div></div><div style={{color:T.prot,fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22}}>+{earnedCals} kcal</div></div>}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:14}}>
        {/* Strava */}
        <SectionCard title={<span style={{display:"inline-flex",alignItems:"center",gap:7}}><span style={{width:10,height:10,borderRadius:"50%",background:"#FC4C02",flexShrink:0,display:"inline-block"}}/>Strava — Live Sync</span>}>
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
            <button onClick={()=>fileRef.current[id]?.click()} style={{width:"100%",padding:"12px",background:acts.length>0?T.s3:T.s3,color:T.prot,fontWeight:700,fontSize:12,border:`1px solid rgba(var(--accent-rgb),0.15)`,borderRadius:9,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>{acts.length>0?`Re-import ${file}`:`Import ${file} →`}</button>
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

// ─── REFER A FRIEND CARD ─────────────────────────────────────────────────────
function ReferAFriendCard({ user, eyebrowStyle }) {
  const [refData, setRefData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showNextUnlock, setShowNextUnlock] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getReferralData(user.id).then(d => {
      if (!d) return;
      setRefData(d);
      // Flush any pending notifications queued by server when a referral converted
      const notifs = d.pending_referral_notifications || [];
      if (notifs.length > 0) {
        notifs.forEach(n =>
          showToast(n.message, n.type === 'tier_unlocked' ? 'success' : 'info', { duration: 4500 })
        );
        sb.from('profiles').update({
          profile_data: { ...(d.profile_data || {}), pending_referral_notifications: [] },
        }).eq('id', user.id).then(() => {});
      }
    });
    getReferrals(user.id).then(list => setReferrals(list));
  }, [user?.id]);

  const referralCode = refData?.referral_code || '';
  const referralCount = refData?.referral_count || 0;
  const tier = refData?.referral_tier || 0;
  const tierDef = REFERRAL_TIERS[tier] || REFERRAL_TIERS[0];
  const tierColor = tierDef.color;
  const nextTierDef = tier < 4 ? REFERRAL_TIERS[tier + 1] : null;

  const progressPct = nextTierDef
    ? Math.min(1, (referralCount - tierDef.min) / (nextTierDef.min - tierDef.min)) * 100
    : 100;

  async function copyCode() {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {}
  }

  async function shareCode() {
    if (!referralCode || sharing) return;
    setSharing(true);
    const text = `Use my referral code ${referralCode} to get started on Coach Macro — the app that connects your training and nutrition. Download at coach-macro.com`;
    const url = `https://coach-macro.com/join?ref=${referralCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Join me on Coach Macro', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        showToast('Link copied!', 'success', { duration: 2000 });
      }
    } catch {}
    setSharing(false);
  }

  if (!referralCode) return null;

  return (
    <>
      <div style={eyebrowStyle}>// Refer a Friend</div>
      <div style={{
        background: '#0d0d0d', borderRadius: 14, padding: 16,
        border: '1px solid rgba(var(--accent-rgb),0.07)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, transparent 60%, rgba(var(--accent-rgb),0.04) 100%)', pointerEvents: 'none' }} />

        {/* Code label */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Your referral code
        </div>

        {/* Code row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,245,240,0.04)', border: '1px solid rgba(245,245,240,0.1)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 24, color: '#f5f5f0', flex: 1, letterSpacing: '0.08em' }}>
            {referralCode}
          </div>
          <button onClick={copyCode} style={{ background: 'rgba(var(--accent-rgb),0.12)', border: '1px solid rgba(var(--accent-rgb),0.3)', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
            {codeCopied ? 'COPIED ✓' : 'COPY'}
          </button>
        </div>

        {/* Share button */}
        <button onClick={shareCode} disabled={sharing} style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 10, padding: 13, color: '#fff', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', opacity: sharing ? 0.7 : 1 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx={18} cy={5} r={3}/><circle cx={6} cy={12} r={3}/><circle cx={18} cy={19} r={3}/><line x1={8.59} y1={13.51} x2={15.42} y2={17.49}/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49}/></svg>
          SHARE YOUR CODE
        </button>

        {/* Tier progress */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(245,245,240,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>Current tier</div>
              <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 18, color: tierColor }}>
                {tier === 0 ? 'NO TIER YET.' : `${tierDef.name}.`}
              </div>
            </div>
            <div style={{ background: 'rgba(var(--accent-rgb),0.1)', border: '1px solid rgba(var(--accent-rgb),0.25)', borderRadius: 20, padding: '3px 10px', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)' }}>
              {referralCount} referral{referralCount !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Progress — bar with next-unlock dropdown (tier < 4) or status count (tier 4) */}
          {tier < 4 && nextTierDef ? (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.35)', marginBottom: 5 }}>
                {nextTierDef.min - referralCount} more referral{nextTierDef.min - referralCount !== 1 ? 's' : ''} to {nextTierDef.name}
              </div>
              <div style={{ background: 'rgba(245,245,240,0.06)', borderRadius: 4, height: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: tierColor, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
              {/* Next unlock row */}
              <div
                onClick={() => setShowNextUnlock(v => !v)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                  background: 'rgba(245,245,240,0.03)', border: '1px solid rgba(245,245,240,0.07)',
                  borderRadius: 8, padding: '8px 12px', marginBottom: showNextUnlock ? 0 : 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={nextTierDef.color} strokeWidth={2} strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Next unlock</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: nextTierDef.color, letterSpacing: '0.06em' }}>
                    {nextTierDef.newFeatures[0] || nextTierDef.newPerks[0] || nextTierDef.name}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(245,245,240,0.3)' }}>{showNextUnlock ? '▲' : '▼'}</span>
              </div>
              {showNextUnlock && (
                <div style={{ background: 'rgba(245,245,240,0.02)', border: '1px solid rgba(245,245,240,0.07)', borderTop: 'none',
                  borderRadius: '0 0 8px 8px', padding: '10px 12px', marginBottom: 12 }}>
                  {nextTierDef.newFeatures.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill={nextTierDef.color}><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z"/></svg>
                      <span style={{ fontFamily: 'var(--barlow)', fontSize: 12, color: 'rgba(245,245,240,0.8)' }}>{f}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(245,245,240,0.3)', marginLeft: 'auto' }}>FEATURE</span>
                    </div>
                  ))}
                  {nextTierDef.newPerks.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <svg width={10} height={10} viewBox="0 0 24 24" fill={nextTierDef.color}><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/></svg>
                      <span style={{ fontFamily: 'var(--barlow)', fontSize: 12, color: 'rgba(245,245,240,0.8)' }}>{p}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'rgba(245,245,240,0.3)', marginLeft: 'auto' }}>PERK</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : tier >= 4 ? (
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
              <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 56, color: '#FFD740', lineHeight: 1, letterSpacing: '-1px' }}>
                {referralCount}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.4)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 4 }}>
                Referrals. Legend status.
              </div>
            </div>
          ) : null}

          {/* Feature unlocks */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>// Feature unlocks</div>
          {[
            { label: 'App icon customization',   unlockedAt: 1 },
            { label: 'Workout history export',    unlockedAt: 2 },
            { label: 'Color scheme customization', unlockedAt: 3 },
            { label: 'Dashboard layout options',  unlockedAt: 4 },
          ].map(({ label, unlockedAt }) => {
            const unlocked = tier >= unlockedAt;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {unlocked
                  ? <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#22c55e' }}>✓</span>
                  : <svg width={12} height={12} viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="rgba(245,245,240,0.2)" strokeWidth={1.7}/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="rgba(245,245,240,0.2)" strokeWidth={1.7} strokeLinecap="round"/></svg>
                }
                <span style={{ fontFamily: 'var(--barlow)', fontSize: 13, color: unlocked ? '#f5f5f0' : 'rgba(245,245,240,0.3)' }}>{label}</span>
                {!unlocked && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.2)', marginLeft: 'auto' }}>{REFERRAL_TIERS[unlockedAt].min} refs</span>}
              </div>
            );
          })}

          {/* Status perks */}
          {tierDef.perks.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8, marginTop: 14 }}>// Status perks</div>
              {tierDef.perks.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#22c55e' }}>✓</span>
                  <span style={{ fontFamily: 'var(--barlow)', fontSize: 13, color: '#f5f5f0' }}>{p}</span>
                </div>
              ))}
            </>
          )}
          {tier === 0 && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(245,245,240,0.3)', marginTop: 6 }}>Refer 1 friend who subscribes to unlock your first feature</div>
          )}
        </div>

        {/* Referral list */}
        {referrals.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(245,245,240,0.06)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(245,245,240,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>// Referred members</div>
            {referrals.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < referrals.length - 1 ? '1px solid rgba(245,245,240,0.05)' : 'none' }}>
                <span style={{ fontFamily: 'var(--barlow)', fontSize: 13, color: '#f5f5f0' }}>
                  Anonymous
                </span>
                {r.status === 'completed'
                  ? <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--mono)', fontSize: 8, color: '#22c55e' }}>PAID ✓</span>
                  : <span style={{ background: 'rgba(254,160,32,0.1)', border: '1px solid rgba(254,160,32,0.2)', borderRadius: 6, padding: '2px 8px', fontFamily: 'var(--mono)', fontSize: 8, color: '#FEA020' }}>PENDING</span>
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── APPEARANCE SECTION ──────────────────────────────────────────────────────
function AppearanceSection({ user, wPrefs, setWPrefs }) {
  const [tier, setTier] = useState(null);
  const saved = wPrefs?.theme || { accent: 'red', bg: 'black' };
  const [pendingAccent, setPendingAccent] = useState(saved.accent);
  const [pendingBg,     setPendingBg]     = useState(saved.bg);
  const [saving, setSaving] = useState(false);
  const isDirty = pendingAccent !== saved.accent || pendingBg !== saved.bg;

  useEffect(() => {
    if (!user?.id) return;
    // Dev accounts always get max tier so the theme picker is visible for testing
    if (user.email?.endsWith('@coachm.dev')) { setTier(4); return; }
    sb.from('profiles').select('referral_tier').eq('id', user.id).maybeSingle()
      .then(({ data }) => setTier(data?.referral_tier || 0));
  }, [user?.id]);

  const accentHex = ACCENT_COLORS.find(c => c.id === pendingAccent)?.hex || '#FF3B30';
  const bgHex     = BG_COLORS.find(c => c.id === pendingBg)?.hex         || '#000000';
  const lightBg   = isLightBg(bgHex);
  const previewText   = lightBg ? '#1a1a1a' : '#f5f5f0';
  const previewTextDim = lightBg ? 'rgba(0,0,0,0.50)' : 'rgba(245,245,240,0.50)';
  const previewBorder = lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(245,245,240,0.10)';
  const previewCard   = lightBg ? '#ececec' : (() => {
    const bg = BG_COLORS.find(c => c.id === pendingBg);
    if (!bg) return '#0d0d0d';
    const [r, g, b_] = bg.rgb.split(',').map(Number);
    return `#${[r, g, b_].map(c => Math.min(255, Math.round(c + (255 - c) * 0.07)).toString(16).padStart(2, '0')).join('')}`;
  })();

  async function confirm() {
    if (!user?.id) return;
    setSaving(true);
    applyTheme(pendingAccent, pendingBg);
    const newWp = { ...wPrefs, theme: { accent: pendingAccent, bg: pendingBg } };
    setWPrefs(newWp);
    try {
      await sb.from('profiles').upsert({ id: user.id, wprefs: newWp }, { onConflict: 'id' });
      showToast('Theme saved', 'success');
    } catch { showToast("Couldn't save theme", 'error'); }
    setSaving(false);
  }

  function cancel() {
    setPendingAccent(saved.accent);
    setPendingBg(saved.bg);
  }

  // Always use default colors for the locked preview
  const lockedAccentHex = '#FF3B30';
  const lockedBgHex     = '#000000';

  const isUnlocked = tier !== null && tier >= 3;
  const isLoading  = tier === null;

  function ColorSwatch({ colors, selected, onSelect, isAccentRow }) {
    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {colors.map(c => {
          const isSel  = c.id === selected;
          const incompatible = isAccentRow
            ? !isCompatible(c.hex, bgHex)
            : !isCompatible(accentHex, c.hex);
          return (
            <button
              key={c.id}
              disabled={incompatible}
              onClick={() => isAccentRow ? setPendingAccent(c.id) : setPendingBg(c.id)}
              title={incompatible ? `${c.name} — low contrast` : c.name}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none',
                background: c.hex, cursor: incompatible ? 'not-allowed' : 'pointer',
                opacity: incompatible ? 0.25 : 1,
                boxShadow: isSel ? `0 0 0 2px var(--card-bg), 0 0 0 4px ${c.hex}` : 'none',
                transition: 'box-shadow 0.15s, opacity 0.15s',
                flexShrink: 0,
                outline: 'none',
                position: 'relative',
              }}
            >
              {c.hex === '#FFFFFF' && (
                <div style={{ position: 'absolute', inset: 2, borderRadius: '50%', border: '1px solid rgba(0,0,0,0.15)' }} />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  function MiniPreview({ accentH, bgH }) {
    const lt = isLightBg(bgH);
    const ptxt  = lt ? '#1a1a1a' : '#f5f5f0';
    const ptxtD = lt ? 'rgba(0,0,0,0.50)' : 'rgba(245,245,240,0.50)';
    const pBord = lt ? 'rgba(0,0,0,0.12)'  : 'rgba(245,245,240,0.10)';
    const pCard = lt ? '#ececec' : bgH === '#000000' ? '#0d0d0d' : '#' + (() => {
      const bg = BG_COLORS.find(c => c.hex === bgH);
      if (!bg) return '0d0d0d';
      const [r,g,b2] = bg.rgb.split(',').map(Number);
      return [r,g,b2].map(c => Math.min(255,Math.round(c+(255-c)*0.07)).toString(16).padStart(2,'0')).join('');
    })();
    return (
      <div style={{ background: bgH, borderRadius: 12, overflow: 'hidden', border: `1px solid ${pBord}` }}>
        {/* Mock header */}
        <div style={{ background: pCard, padding: '10px 14px', borderBottom: `1px solid ${pBord}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentH }} />
          <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 14, color: ptxt }}>COACH MACRO</div>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Mock stat card */}
          <div style={{ background: pCard, borderRadius: 8, padding: '8px 10px', border: `1px solid ${pBord}` }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: accentH, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>// TODAY</div>
            <div style={{ fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 18, color: ptxt, lineHeight: 1 }}>PUSH DAY.</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: ptxtD, marginTop: 2 }}>Chest · Shoulders · Triceps</div>
          </div>
          {/* Mock progress bar */}
          <div style={{ background: pCard, borderRadius: 8, padding: '8px 10px', border: `1px solid ${pBord}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: ptxtD }}>Protein</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: accentH }}>142 / 180g</span>
            </div>
            <div style={{ height: 4, background: `rgba(${lt ? '0,0,0' : '245,245,240'},0.12)`, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '79%', height: '100%', background: accentH, borderRadius: 2 }} />
            </div>
          </div>
          {/* Mock button */}
          <button style={{ width: '100%', padding: '9px', background: accentH, border: 'none', borderRadius: 8, fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900, fontSize: 13, color: lt && accentH === '#FFFFFF' ? '#1a1a1a' : '#fff', letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'default' }}>
            START SESSION →
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading ? null : (
        <>
          {!isUnlocked ? (
            /* ── LOCKED STATE ── */
            <div style={{ background: '#0d0d0d', borderRadius: 12, border: '1px solid rgba(245,245,240,0.07)', overflow: 'hidden', padding: '16px 16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(245,245,240,0.25)"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(245,245,240,0.40)', letterSpacing: '0.10em' }}>Unlock at 5 referrals</span>
              </div>
              <MiniPreview accentH={lockedAccentHex} bgH={lockedBgHex} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'rgba(245,245,240,0.25)', textAlign: 'center', marginTop: 12, letterSpacing: '0.08em' }}>
                Invite 5 friends to unlock color themes.
              </div>
            </div>
          ) : (
            /* ── UNLOCKED STATE ── */
            <div style={{ background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--card-border)', overflow: 'hidden', padding: '16px' }}>
              {/* Live preview */}
              <MiniPreview accentH={accentHex} bgH={bgHex} />

              {/* Accent picker */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(var(--text-rgb),0.40)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>Accent Color</div>
                <ColorSwatch colors={ACCENT_COLORS} selected={pendingAccent} onSelect={setPendingAccent} isAccentRow />
              </div>

              {/* Background picker */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(var(--text-rgb),0.40)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>Background</div>
                <ColorSwatch colors={BG_COLORS} selected={pendingBg} onSelect={setPendingBg} isAccentRow={false} />
              </div>

              {/* Confirm / Cancel — only when there are unsaved changes */}
              {isDirty && (
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={cancel} style={{ flex: 1, padding: '11px', background: 'rgba(var(--text-rgb),0.06)', border: '1px solid rgba(var(--text-rgb),0.12)', borderRadius: 10, color: 'rgba(var(--text-rgb),0.60)', fontFamily: 'var(--condensed)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={confirm} disabled={saving} style={{ flex: 2, padding: '11px', background: accentHex, border: 'none', borderRadius: 10, color: lightBg && accentHex === '#FFFFFF' ? '#1a1a1a' : '#fff', fontFamily: 'var(--condensed)', fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    {saving ? 'Saving…' : 'Apply Theme'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── PEER COMPARISON SECTION ─────────────────────────────────────────────────

function PeerComparisonSection({ user, eyebrowStyle, cardStyle }) {
  const [optIn, setOptIn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getOptIn(user.id).then(v => { setOptIn(v ?? true); setLoading(false); });
  }, [user?.id]);

  async function toggle(val) {
    setOptIn(val);
    await setPeerOptInSvc(user.id, val);
    showToast(val ? "Peer comparison enabled" : "Peer comparison disabled", "success");
  }

  if (loading) return null;

  return (
    <>
      <div style={eyebrowStyle}>// Peer Comparison</div>
      <div style={cardStyle}>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 14, color: "#f5f5f0", marginBottom: 3 }}>Anonymous Benchmarking</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(245,245,240,0.4)", lineHeight: 1.5, letterSpacing: "0.06em" }}>
                Compare your progress with similar users anonymously. Helps set realistic expectations and surface what's working for others like you.
              </div>
            </div>
            <div onClick={() => toggle(!optIn)} style={{ width: 44, height: 24, borderRadius: 12, background: optIn ? "var(--accent)" : "rgba(245,245,240,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: optIn ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
          <div style={{ background: "rgba(245,245,240,0.03)", border: "1px solid rgba(245,245,240,0.06)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "rgba(245,245,240,0.35)", lineHeight: 1.6, letterSpacing: "0.05em" }}>
              Your individual data is never shared with other users in any form. Only anonymized aggregate statistics are used. Groups require at least 10 users before any comparison is shown.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── COACH OUTREACH SECTION ───────────────────────────────────────────────────

function CoachOutreachSection({ user, eyebrowStyle, cardStyle }) {
  const [prefs, setPrefs] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getOutreachPreferences(user.id).then(p => setPrefs({ ...DEFAULT_PREFS, ...p }));
  }, [user?.id]);

  async function save(newPrefs) {
    if (!user?.id) return;
    setPrefs(newPrefs);
    setSaving(true);
    await saveOutreachPreferences(user.id, newPrefs);
    setSaving(false);
    showToast("Saved", "success");
  }

  if (!prefs) return null;

  const toggleSwitch = (val, key, nested) => {
    const next = nested
      ? { ...prefs, [nested]: { ...(prefs[nested] || {}), [key]: val } }
      : { ...prefs, [key]: val };
    save(next);
  };

  function ToggleRow({ label, value, onChange, isLast, sub }) {
    return (
      <div style={{ padding: "12px 16px", borderBottom: isLast ? "none" : "1px solid rgba(245,245,240,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 14, color: "#f5f5f0" }}>{label}</div>
          {sub && <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(245,245,240,0.35)", marginTop: 2, letterSpacing: "0.06em" }}>{sub}</div>}
        </div>
        <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? "var(--accent)" : "rgba(245,245,240,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 3, left: value ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
        </div>
      </div>
    );
  }

  const FREQ_LABELS = ["Off", "1/day", "2/day", "3/day"];
  const hourLabel = h => { const ampm = h >= 12 ? "pm" : "am"; const h12 = h % 12 || 12; return `${h12}${ampm}`; };

  return (
    <>
      <div style={eyebrowStyle}>// Coach Outreach</div>
      {/* Master toggle */}
      <div style={cardStyle}>
        <ToggleRow
          label="Coach Notifications"
          sub="Intelligent, specific outreach — not generic reminders"
          value={prefs.enabled}
          onChange={v => toggleSwitch(v, 'enabled')}
        />
        {prefs.enabled && (
          <>
            {/* Frequency */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(245,245,240,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 14, color: "#f5f5f0" }}>Frequency</div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "rgba(245,245,240,0.5)" }}>{FREQ_LABELS[prefs.max_per_day] || "Custom"}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2, 3].map(n => (
                  <button key={n} onClick={() => save({ ...prefs, max_per_day: n })} style={{ flex: 1, padding: "8px 0", borderRadius: 8, background: prefs.max_per_day === n ? "rgba(var(--accent-rgb),0.2)" : "rgba(245,245,240,0.06)", border: `1px solid ${prefs.max_per_day === n ? "rgba(var(--accent-rgb),0.5)" : "rgba(245,245,240,0.1)"}`, color: prefs.max_per_day === n ? "var(--accent)" : "rgba(245,245,240,0.5)", fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}>
                    {FREQ_LABELS[n]}
                  </button>
                ))}
              </div>
            </div>
            {/* Quiet hours */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(245,245,240,0.06)" }}>
              <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 14, color: "#f5f5f0", marginBottom: 2 }}>Quiet Hours</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(245,245,240,0.35)", marginBottom: 10, letterSpacing: "0.06em" }}>No notifications during this window</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select value={prefs.quiet_start} onChange={e => save({ ...prefs, quiet_start: parseInt(e.target.value) })} style={{ flex: 1, padding: "8px 10px", background: "rgba(245,245,240,0.06)", border: "1px solid rgba(245,245,240,0.12)", borderRadius: 8, color: "#f5f5f0", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer" }}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </select>
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(245,245,240,0.35)" }}>to</span>
                <select value={prefs.quiet_end} onChange={e => save({ ...prefs, quiet_end: parseInt(e.target.value) })} style={{ flex: 1, padding: "8px 10px", background: "rgba(245,245,240,0.06)", border: "1px solid rgba(245,245,240,0.12)", borderRadius: 8, color: "#f5f5f0", fontFamily: "var(--mono)", fontSize: 11, cursor: "pointer" }}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
                </select>
              </div>
            </div>
            {/* Critical override */}
            <ToggleRow
              label="Critical Alerts Always On"
              sub="Overtraining, dangerous patterns — bypasses quiet hours"
              value={prefs.critical_override !== false}
              onChange={v => toggleSwitch(v, 'critical_override')}
            />
            {/* Per-category toggles */}
            <div style={{ padding: "10px 16px 6px", borderTop: "1px solid rgba(245,245,240,0.06)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "rgba(245,245,240,0.35)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>// Notification Types</div>
              {Object.entries(TRIGGER_CATEGORIES).map(([key, label], i, arr) => {
                const val = prefs.categories?.[key] ?? true;
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < arr.length - 1 ? 10 : 4 }}>
                    <span style={{ fontFamily: "'Barlow',sans-serif", fontSize: 13, color: "rgba(245,245,240,0.8)" }}>{label}</span>
                    <div onClick={() => toggleSwitch(!val, key, 'categories')} style={{ width: 40, height: 22, borderRadius: 11, background: val ? "var(--accent)" : "rgba(245,245,240,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 2, left: val ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {saving && <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "rgba(245,245,240,0.3)", textAlign: "center", marginTop: 4, letterSpacing: "0.1em" }}>saving…</div>}
    </>
  );
}

// ─── SETTINGS SECTION ────────────────────────────────────────────────────────
export function SettingsSection({profile,wPrefs,setWPrefs,schedule,setSchedule,dayFocus,todayKey,isMobile,onSignOut,user,onPreviewBrief,calendarConnected,onCalendarConnect,onCalendarDisconnect,onLogInjury,onProfileUpdate}) {
  const [delStep,setDelStep]=useState(0);
  const [delInput,setDelInput]=useState("");
  const [deleting,setDeleting]=useState(false);
  const [displayPrefs,setDisplayPrefs]=useState(wPrefs?.displayPrefs||{});
  const [editModal,setEditModal]=useState(null);
  const [editValue,setEditValue]=useState("");
  const [localName,setLocalName]=useState(profile?.name||"");
  const [localWeight,setLocalWeight]=useState(String(profile?.weight||""));
  const [localHeight,setLocalHeight]=useState(String(profile?.height||""));
  const [showGoalSelector,setShowGoalSelector]=useState(false);
  const [showSkillSelector,setShowSkillSelector]=useState(false);
  // Plan & Nutrition modal states
  const [showDietPicker,setShowDietPicker]=useState(false);
  const [showRecoveryPicker,setShowRecoveryPicker]=useState(false);
  const [showLongRunPicker,setShowLongRunPicker]=useState(false);
  const [lrdOverrideDay,setLrdOverrideDay]=useState(null); // confirm before replacing a lift day
  const [showRaceTypePicker,setShowRaceTypePicker]=useState(false);
  const [showRaceDatePicker,setShowRaceDatePicker]=useState(false);
  const [showCaloriePicker,setShowCaloriePicker]=useState(false);
  const [stravaConnected,setStravaConnected]=useState(false);
  const [stravaLoading,setStravaLoading]=useState(false);
  const [stravaAthlete,setStravaAthlete]=useState(null);

  useEffect(()=>{
    if(!user?.id)return;
    sb.from('connected_apps').select('metadata,connected_at').eq('user_id',user.id).eq('provider','strava').maybeSingle().then(({data})=>{
      if(data){setStravaConnected(true);setStravaAthlete(data);}
    });
  },[user?.id]);

  async function saveSettings(newWPrefs,newSchedule){
    if(!user)return;
    try{
      const {error}=await sb.from("profiles").upsert(
        {id:user.id,wprefs:newWPrefs||wPrefs,schedule:newSchedule||schedule},
        {onConflict:"id"}
      );
      if(error){console.error("[saveSettings] error:",error.message);showToast("Couldn't save — check your connection","error");}
      else{showToast("Preferences saved","success");}
    }catch(e){console.error("[saveSettings] exception:",e);showToast("Couldn't save — check your connection","error");}
  }


  async function saveProfileField(field,value){
    if(!user)return;
    try{
      const{error}=await sb.from("profiles").upsert({id:user.id,[field]:value},{onConflict:"id"});
      if(!error)showToast("Saved","success");
      else showToast("Couldn't save","error");
    }catch{showToast("Couldn't save","error");}
  }


  async function deleteAccount() {
    if(!user||delInput.trim()!=="DELETE")return;
    setDelStep(3);
    setDeleting(true);
    try {
      const { data:{ session } } = await sb.auth.getSession();
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch(e) {
      // Fallback: client-side cleanup if server delete unavailable
      await sb.from("profiles").delete().eq("id",user.id);
    }
    await sb.auth.signOut();
  }

  const isPro=!!profile?.is_pro;
  const [showPlansModal,setShowPlansModal]=useState(false);
  const [purchaseLoading,setPurchaseLoading]=useState(null);
  const subTier=profile?.subscription_tier||'trial';
  const subLabel=getSubscriptionLabel(profile);
  const subIsPaid=subTier==='monthly'||subTier==='annual';

  const GOAL_LABELS={build_muscle:"Build Muscle",get_stronger:"Get Stronger",lose_fat:"Lose Fat",recomp:"Body Recomp",train_for_race:"Train for Race",get_faster:"Get Faster"};
  const SKILL_LABELS={none:"Beginner",beginner:"Beginner",intermediate:"Intermediate",advanced:"Advanced"};
  const currentGoal=wPrefs?.primaryGoal||profile?.primaryGoal;
  const currentSkill=wPrefs?.liftExp||profile?.liftExp||"beginner";
  const wUnit=wPrefs?.wUnit||profile?.wUnit||"lbs";

  const eyebrowStyle={fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10,marginTop:24};
  const cardStyle={background:"#0d0d0d",borderRadius:12,border:"1px solid rgba(245,245,240,0.07)",overflow:"hidden"};
  function MeRow({label:lbl,value:val,onPress,isLast,isDestructive,noChevron,rightEl}){
    return(
      <div onClick={onPress} style={{padding:"14px 16px",borderBottom:isLast?"none":"1px solid rgba(245,245,240,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:onPress?"pointer":"default"}}>
        <span style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:isDestructive?"var(--accent)":"#f5f5f0"}}>{lbl}</span>
        {rightEl||(!isDestructive&&(
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {val&&<span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:11,color:"rgba(245,245,240,0.40)"}}>{val}</span>}
            {!noChevron&&onPress&&<span style={{color:"rgba(245,245,240,0.25)",fontSize:18,lineHeight:1}}>›</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{padding:isMobile?"12px 18px":"0",paddingBottom:isMobile?100:0}}>
      {/* ── ATHLETE PASSPORT ── */}
      <AthletePassport user={user}/>
      {/* ── REFER A FRIEND ── */}
      <ReferAFriendCard user={user} eyebrowStyle={eyebrowStyle} />


      {/* ── PROFILE ── */}
      <div style={eyebrowStyle}>// Profile</div>
      <div style={cardStyle}>
        <MeRow label="Name" value={localName||"—"} onPress={()=>{setEditModal("name");setEditValue(localName);}}/>
        <MeRow label="Goal" value={GOAL_LABELS[currentGoal]||"—"} onPress={()=>setShowGoalSelector(true)}/>
        <MeRow label="Skill Level" value={SKILL_LABELS[currentSkill]||"Beginner"} onPress={()=>setShowSkillSelector(true)}/>
        <MeRow label="Weight" value={localWeight?(localWeight+" "+wUnit):"—"} onPress={()=>{setEditModal("weight");setEditValue(localWeight);}}/>
        <MeRow label="Height" value={localHeight?(localHeight+" cm"):"—"} onPress={()=>{setEditModal("height");setEditValue(localHeight);}} isLast/>
      </div>

      {/* ── PLAN & NUTRITION ── */}
      <div style={eyebrowStyle}>// Plan & Nutrition</div>
      <div style={cardStyle}>
        {/* A. Diet Preset */}
        {(()=>{
          const DIET_OPTS=[
            {id:'balanced',label:'Balanced'},{id:'high-protein',label:'High Protein'},
            {id:'keto',label:'Keto'},{id:'vegan',label:'Vegan'},
            {id:'vegetarian',label:'Vegetarian'},{id:'carnivore',label:'Carnivore'},
            {id:'low-carb',label:'Low Carb'},{id:'pescatarian',label:'Pescatarian'},
            {id:'mediterranean',label:'Mediterranean'},
          ];
          const currentDiet=wPrefs?.mealPrepDiet||'balanced';
          const currentDietLabel=DIET_OPTS.find(d=>d.id===currentDiet)?.label||'Balanced';
          return <MeRow label="Diet Preset" value={currentDietLabel} onPress={()=>setShowDietPicker(true)}/>;
        })()}
        {/* B. Allergens / Restrictions — chip multi-select */}
        {(()=>{
          const ALLERGEN_OPTS=[
            {v:'vegetarian',l:'Vegetarian'},{v:'vegan',l:'Vegan'},
            {v:'gluten',l:'Gluten Free'},{v:'dairy',l:'Dairy Free'},
            {v:'nuts',l:'No Nuts'},{v:'eggs',l:'No Eggs'},
            {v:'shellfish',l:'No Shellfish'},{v:'halal',l:'Halal'},
            {v:'kosher',l:'Kosher'},
          ];
          const current=(profile?.dietary||[]).filter(d=>d!=='none');
          return(
            <div style={{padding:"14px 16px",borderTop:"1px solid rgba(245,245,240,0.06)"}}>
              <div style={{fontSize:14,color:"#f5f5f0",fontFamily:"'Barlow',sans-serif",marginBottom:6}}>Dietary Restrictions</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:4}}>
                {ALLERGEN_OPTS.map(({v,l})=>{
                  const active=current.includes(v);
                  return(
                    <button key={v} onClick={async()=>{
                      const next=active?current.filter(x=>x!==v):[...current,v];
                      await sb.from("profiles").upsert({id:user.id,profile_data:{...profile,dietary:next}},{onConflict:"id"});
                      onProfileUpdate?.({dietary:next});
                    }} style={{padding:"6px 14px",borderRadius:20,border:active?"none":"1px solid rgba(245,245,240,0.15)",background:active?"var(--accent)":"transparent",color:active?"#fff":"rgba(245,245,240,0.5)",fontFamily:"var(--mono)",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.15s"}}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
        {/* C. Recovery Capacity */}
        {(()=>{
          const RC_LABELS={fast:"Very fast",normal:"Normal",slow:"Slower",very_slow:"Very slow"};
          const currentRC=wPrefs?.recoveryCapacity||profile?.recovery_capacity||'normal';
          return <MeRow label="Recovery Capacity" value={RC_LABELS[currentRC]||currentRC} onPress={()=>setShowRecoveryPicker(true)}/>;
        })()}
        {/* D. Long Run Day */}
        {(()=>{
          const currentLRD=wPrefs?.longRunDay;
          return <MeRow label="Long Run Day" value={currentLRD||'—'} onPress={()=>setShowLongRunPicker(true)}/>;
        })()}
        {/* E. Race Type + Race Date */}
        {(()=>{
          const RACE_LABELS={'5k':'5K','10k':'10K','half_marathon':'Half Marathon','marathon':'Marathon','ultra':'Ultra','obstacle':'Obstacle / OCR','general':'General Fitness'};
          const currentRT=profile?.run_race_type;
          const currentRD=profile?.run_race_date;
          return(
            <>
              <MeRow label="Race Type" value={currentRT?RACE_LABELS[currentRT]||currentRT:'—'} onPress={()=>setShowRaceTypePicker(true)}/>
              <MeRow label="Race Date" value={currentRD?new Date(currentRD+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'} onPress={()=>setShowRaceDatePicker(true)}/>
            </>
          );
        })()}
        {/* F. Daily calorie target */}
        {(()=>{
          const currentCals=profile?.goalCals??profile?.calorie_target;
          return <MeRow label="Daily calorie target" value={currentCals?`${currentCals} kcal`:'—'} onPress={()=>setShowCaloriePicker(true)} isLast/>;
        })()}
      </div>

      {/* ── DISPLAY ── */}
      <div style={eyebrowStyle}>// Display</div>
      <div style={cardStyle}>
        {/* Skill Level Chips */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)"}}>
          <div style={{fontSize:14,color:"#f5f5f0",fontFamily:"'Barlow',sans-serif",marginBottom:2}}>Experience Level</div>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",marginBottom:12}}>Adjusts coaching language and visible metrics</div>
          <div style={{display:"flex",gap:6}}>
            {["beginner","intermediate","advanced"].map(level=>{
              const isActive=currentSkill===level;
              return(
                <button key={level} onClick={async()=>{
                  const newWp={...wPrefs,liftExp:level};
                  setWPrefs(newWp);
                  await saveSettings(newWp,null);
                  showToast(`Display preferences updated for ${level} level.`,"success");
                }} style={{padding:"8px 16px",borderRadius:20,border:isActive?"none":"1px solid rgba(245,245,240,0.15)",background:isActive?"var(--accent)":"transparent",color:isActive?"#fff":"rgba(245,245,240,0.5)",fontFamily:"var(--mono)",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",transition:"all 0.2s"}}>
                  {level}
                </button>
              );
            })}
          </div>
        </div>
        {/* Today Tab Toggles */}
        <div style={{padding:"10px 16px 6px",borderBottom:"1px solid rgba(245,245,240,0.06)"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// TODAY TAB</div>
          {[
            {key:"morning_brief",label:"Morning Brief",def:true},
            {key:"streak_counter",label:"Streak Counter",def:true},
            {key:"deload_alerts",label:"Deload Alerts",def:true},
            {key:"plateau_alerts",label:"Plateau Alerts",def:true},
            {key:"fatigue_detection",label:"Fatigue Detection",def:currentSkill!=="beginner"},
            {key:"muscle_balance",label:"Muscle Balance",def:currentSkill==="advanced"},
            {key:"program_adjustments",label:"Program Adjustments",def:currentSkill!=="beginner"},
          ].map(({key,label,def})=>{
            const val=displayPrefs[key]??def;
            return(
              <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10}}>
                <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.8)"}}>{label}</span>
                <div onClick={async()=>{
                  const newDp={...displayPrefs,[key]:!val};
                  setDisplayPrefs(newDp);
                  const newWp={...wPrefs,displayPrefs:newDp};
                  setWPrefs(newWp);
                  await saveSettings(newWp,null);
                }} style={{width:44,height:24,borderRadius:12,background:val?"var(--accent)":"rgba(245,245,240,0.1)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:val?21:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        {/* During Workouts */}
        <div style={{padding:"10px 16px 6px",borderBottom:"1px solid rgba(245,245,240,0.06)"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// DURING WORKOUTS</div>
          {[
            {key:"rpe_input",label:"RPE Input",def:currentSkill!=="beginner"},
            {key:"momentum_bar",label:"Momentum Bar",def:currentSkill!=="beginner"},
          ].map(({key,label,def})=>{
            const val=displayPrefs[key]??def;
            return(
              <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10}}>
                <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.8)"}}>{label}</span>
                <div onClick={async()=>{
                  const newDp={...displayPrefs,[key]:!val};
                  setDisplayPrefs(newDp);
                  const newWp={...wPrefs,displayPrefs:newDp};
                  setWPrefs(newWp);
                  await saveSettings(newWp,null);
                }} style={{width:44,height:24,borderRadius:12,background:val?"var(--accent)":"rgba(245,245,240,0.1)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:val?21:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                </div>
              </div>
            );
          })}
        </div>
        {/* Nutrition */}
        <div style={{padding:"10px 16px 6px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:8}}>// NUTRITION</div>
          {[
            {key:"full_macro_breakdown",label:"Full Macro Breakdown",def:currentSkill!=="beginner"},
            {key:"macro_memory",label:"Macro Memory",def:currentSkill!=="beginner"},
            {key:"nutrition_timing",label:"Nutrition Timing",def:currentSkill!=="beginner"},
          ].map(({key,label,def})=>{
            const val=displayPrefs[key]??def;
            return(
              <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:10}}>
                <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.8)"}}>{label}</span>
                <div onClick={async()=>{
                  const newDp={...displayPrefs,[key]:!val};
                  setDisplayPrefs(newDp);
                  const newWp={...wPrefs,displayPrefs:newDp};
                  setWPrefs(newWp);
                  await saveSettings(newWp,null);
                }} style={{width:44,height:24,borderRadius:12,background:val?"var(--accent)":"rgba(245,245,240,0.1)",cursor:"pointer",position:"relative",transition:"background 0.2s",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:val?21:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── APPEARANCE ── */}
      <div style={eyebrowStyle}>// Appearance</div>
      <AppearanceSection user={user} wPrefs={wPrefs} setWPrefs={setWPrefs} />

      {/* ── SUBSCRIPTION ── */}
      <div style={eyebrowStyle}>// Subscription</div>
      <div style={cardStyle}>
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:"#f5f5f0"}}>Plan</span>
          <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:11,color:subIsPaid?"#34d399":subTier==="expired"?"var(--accent)":"rgba(245,245,240,0.5)",padding:"3px 10px",borderRadius:6,background:subIsPaid?"rgba(52,211,153,0.1)":"rgba(245,245,240,0.06)",border:`1px solid ${subIsPaid?"rgba(52,211,153,0.25)":"rgba(245,245,240,0.08)"}`}}>{subLabel}</span>
        </div>
        {subIsPaid?(
          <>
            {profile?.subscription_started_at&&<div style={{padding:"10px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)",fontSize:12,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)"}}>Active since {new Date(profile.subscription_started_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>}
            <MeRow label="Manage Subscription" onPress={()=>showToast("Manage via App Store → Subscriptions.","info",{duration:4000})} value=""/>
            <div style={{padding:"8px 16px",fontSize:10,color:"rgba(245,245,240,0.25)",fontFamily:"var(--mono)",letterSpacing:"0.06em",borderBottom:"1px solid rgba(245,245,240,0.04)"}}>Manage or cancel via the App Store settings.</div>
          </>
        ):(
          <div style={{margin:"12px 16px",padding:"16px",background:"rgba(var(--accent-rgb),0.05)",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:12}}>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,marginBottom:12}}>UPGRADE TO PRO.</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}><span>Monthly</span><span style={{fontFamily:"var(--mono)",fontSize:11,color:"rgba(245,245,240,0.6)"}}>$12.99 / month</span></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}><span>Annual · Founding</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"var(--mono)",fontSize:11,color:"rgba(245,245,240,0.6)"}}>$49.99 / year</span><span style={{background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:4,padding:"1px 6px",fontSize:9,color:"#22c55e",fontFamily:"var(--mono)",fontWeight:700}}>SAVE 68%</span></div></div>
            </div>
            <button onClick={()=>setShowPlansModal(true)} style={{width:"100%",padding:"12px",background:"var(--red)",border:"none",borderRadius:10,color:"#fff",fontFamily:"var(--condensed)",fontWeight:700,fontSize:14,letterSpacing:".06em",textTransform:"uppercase",cursor:"pointer"}}>VIEW PLANS →</button>
          </div>
        )}
        <MeRow label="Restore Purchases" isLast onPress={async()=>{
          showToast("Checking purchases...","info");
          const{data:{user:u}}=await sb.auth.getUser().catch(()=>({data:{user:null}}));
          if(!u)return;
          const tier=await restorePurchases(u.id);
          if(tier)showToast(`Restored: ${tier==="monthly"?"Pro Monthly":"Pro Annual"} active.`,"success");
          else showToast("No active purchases found.","info");
        }} value=""/>
      </div>

      {/* Plans modal — sheet */}
      {showPlansModal&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowPlansModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0a0e1a",borderRadius:"18px 18px 0 0",padding:"24px 20px 44px",maxWidth:480,margin:"0 auto"}}>
            <div style={{width:32,height:3,background:"rgba(var(--accent-rgb),0.15)",borderRadius:2,margin:"0 auto 20px"}}/>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,marginBottom:6}}>GO PRO.</div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",letterSpacing:"0.12em",marginBottom:20}}>10 ADAPT NOW · AI LOGGING · RECIPES · RESTAURANT AI</div>
            {[{id:"monthly",label:"MONTHLY",price:"$12.99",per:"/month",badge:null,gradient:false},{id:"annual",label:"FOUNDING ANNUAL",price:"$49.99",per:"/year · $4.17/mo",badge:"FOUNDING MEMBER",saving:"Save 68% vs monthly · locked for life",gradient:true}].map(plan=>(
              <div key={plan.id} onClick={async()=>{
                if(purchaseLoading)return;
                setPurchaseLoading(plan.id);
                const{data:{user:u}}=await sb.auth.getUser().catch(()=>({data:{user:null}}));
                if(!u){setPurchaseLoading(null);return;}
                const ok=plan.id==="monthly"?await purchaseMonthly(u.id):await purchaseAnnual(u.id);
                setPurchaseLoading(null);
                if(ok){setShowPlansModal(false);showToast(`${plan.id==="monthly"?"Monthly":"Annual"} subscription activated!`,"success");}
                else showToast("Purchase failed. Try again.","error");
              }} style={{background:plan.gradient?"linear-gradient(135deg,#0d0d0d,rgba(var(--accent-rgb),0.04))":"#0d0d0d",border:`1px solid ${plan.gradient?"var(--accent)":"rgba(var(--accent-rgb),0.1)"}`,borderRadius:14,padding:16,marginBottom:10,cursor:"pointer",position:"relative"}}>
                {plan.badge&&<div style={{position:"absolute",top:-10,right:16,background:"var(--accent)",borderRadius:20,padding:"3px 10px",fontFamily:"var(--mono)",fontSize:8,color:"#fff",fontWeight:700}}>{plan.badge}</div>}
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:plan.gradient?"var(--accent)":"rgba(245,245,240,0.4)",textTransform:"uppercase",marginBottom:4}}>{plan.label}</div>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,lineHeight:1}}>{plan.price}<span style={{fontFamily:"var(--mono)",fontSize:11,fontStyle:"normal",fontWeight:400,color:"rgba(245,245,240,0.4)"}}> {plan.per}</span></div>
                {plan.saving&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"#22c55e",marginTop:4}}>{plan.saving}</div>}
                {purchaseLoading===plan.id&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:6}}>Processing...</div>}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* ── YOUR VOICE ── */}
      <div style={eyebrowStyle}>// Your Voice</div>
      {[
        {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M9 22h6v-1H9v1zm3-20C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z"/></svg>,title:"SUGGEST A FEATURE.",sub:"Shape what we build next",bg:"rgba(var(--accent-rgb),0.1)",bd:"rgba(var(--accent-rgb),0.2)",section:"feedback"},
        {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>,title:"REPORT A PROBLEM.",sub:"Help us fix what's broken",bg:"rgba(254,160,32,0.1)",bd:"rgba(254,160,32,0.2)",section:"feedback"},
      ].map(({icon,title,sub,bg,bd,section})=>(
        <div key={title} onClick={()=>{if(window.uj)window.uj.showWidget({section});}} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.07)",borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}
          onPointerDown={e=>e.currentTarget.style.borderColor="rgba(var(--accent-rgb),0.3)"}
          onPointerUp={e=>e.currentTarget.style.borderColor="rgba(245,245,240,0.07)"}
          onPointerLeave={e=>e.currentTarget.style.borderColor="rgba(245,245,240,0.07)"}
        >
          <div style={{width:40,height:40,borderRadius:10,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{icon}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:17,color:"#f5f5f0"}}>{title}</div>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2}}>{sub}</div>
          </div>
          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:10,color:"rgba(245,245,240,0.3)"}}>→</div>
        </div>
      ))}
      <div onClick={()=>{if(window.uj)window.uj.showWidget({section:"roadmap"});}} style={{background:"rgba(245,245,240,0.02)",border:"1px solid rgba(245,245,240,0.05)",borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:14,cursor:"pointer"}}
        onPointerDown={e=>e.currentTarget.style.borderColor="rgba(96,165,250,0.25)"}
        onPointerUp={e=>e.currentTarget.style.borderColor="rgba(245,245,240,0.05)"}
        onPointerLeave={e=>e.currentTarget.style.borderColor="rgba(245,245,240,0.05)"}
      >
        <div style={{width:40,height:40,borderRadius:10,background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:17,color:"rgba(245,245,240,0.7)"}}>SEE OUR ROADMAP.</div>
          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.3)",marginTop:2}}>What we're building and what's coming next</div>
        </div>
        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:10,color:"rgba(245,245,240,0.3)"}}>→</div>
      </div>

      {/* ── CONNECTED APPS ── */}
      <div style={eyebrowStyle}>// Connected Apps</div>
      <div style={cardStyle}>
        {/* Strava */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:"#FC4C02",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:"#f5f5f0"}}>Strava</div>
              {stravaConnected&&stravaAthlete?.metadata?.firstname&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:1}}>{stravaAthlete.metadata.firstname}</div>}
              {!stravaConnected&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:1}}>Sync runs & rides automatically</div>}
            </div>
          </div>
          {stravaConnected?(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontFamily:"var(--mono)",fontSize:9,color:"#22c55e",background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:6,padding:"3px 8px"}}>CONNECTED</span>
              <button onClick={async()=>{
                if(!confirm("Disconnect Strava?"))return;
                await sb.from('connected_apps').delete().eq('user_id',user.id).eq('provider','strava');
                setStravaConnected(false);setStravaAthlete(null);
                showToast("Strava disconnected","info");
              }} style={{background:"transparent",border:"1px solid rgba(245,245,240,0.12)",borderRadius:6,color:"rgba(245,245,240,0.4)",fontSize:11,padding:"4px 10px",cursor:"pointer",fontFamily:"var(--mono)"}}>Disconnect</button>
            </div>
          ):(
            <button onClick={async()=>{
              if(!user?.id)return;
              setStravaLoading(true);
              const base=import.meta.env.VITE_API_BASE_URL||"";
              window.location.href=`${base}/api/strava/auth?userId=${user.id}`;
            }} disabled={stravaLoading} style={{background:"#FC4C02",border:"none",borderRadius:8,color:"#fff",fontFamily:"var(--mono)",fontSize:11,fontWeight:700,padding:"7px 14px",cursor:"pointer",letterSpacing:"0.06em"}}>
              {stravaLoading?"CONNECTING…":"CONNECT"}
            </button>
          )}
        </div>
        {/* Calendar — Life-Aware Training */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)"}}>
          <CalendarSettingsPanel connected={calendarConnected||false} onConnect={onCalendarConnect||(() =>{})} onDisconnect={onCalendarDisconnect||(() =>{})} prefs={wPrefs?.calendarPrefs||{}} onPrefsChange={async(key,val)=>{const next={...wPrefs,calendarPrefs:{...(wPrefs?.calendarPrefs||{}),[key]:val}};setWPrefs(next);if(user){try{await sb.from("profiles").upsert({id:user.id,wprefs:next},{onConflict:"id"});}catch{}}}}/>
        </div>
        {/* Apple Health */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="/images/apple-health-icon.png" alt="Apple Health" style={{width:44,height:44,borderRadius:10,flexShrink:0,display:"block"}}/>
            <div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:"#f5f5f0"}}>Apple Health</div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:1}}>Sleep · HRV · Steps</div>
            </div>
          </div>
          <div style={{fontFamily:"var(--mono)",fontSize:9,padding:"4px 10px",borderRadius:6,background:typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()?"rgba(34,197,94,0.12)":"rgba(245,245,240,0.06)",color:typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()?"#34d399":"rgba(245,245,240,0.4)",border:`1px solid ${typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()?"rgba(34,197,94,0.3)":"rgba(245,245,240,0.08)"}`,letterSpacing:"0.1em",textTransform:"uppercase"}}>
            {typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()?"iOS Ready":"iPhone Only"}
          </div>
        </div>
        {/* WHOOP */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(245,245,240,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:"#000",border:"1px solid rgba(245,245,240,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="22" height="14" viewBox="0 0 40 24" fill="#fff"><text x="0" y="18" fontSize="18" fontWeight="900" fontFamily="sans-serif">W</text></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:"#f5f5f0"}}>WHOOP</div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:1}}>Recovery & strain data</div>
            </div>
          </div>
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",background:"rgba(245,245,240,0.06)",border:"1px solid rgba(245,245,240,0.1)",borderRadius:6,padding:"3px 8px"}}>COMING SOON</span>
        </div>
        {/* Garmin */}
        <div style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:10,background:"#005f9e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
            </div>
            <div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:"#f5f5f0"}}>Garmin</div>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.4)",marginTop:1}}>Workouts & health metrics</div>
            </div>
          </div>
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",background:"rgba(245,245,240,0.06)",border:"1px solid rgba(245,245,240,0.1)",borderRadius:6,padding:"3px 8px"}}>COMING SOON</span>
        </div>
      </div>

      {/* ── SETTINGS ── */}
      <div style={eyebrowStyle}>// Settings</div>
      <div style={cardStyle}>
        <MeRow label="Units" noChevron rightEl={
          <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid rgba(245,245,240,0.12)"}}>
            {["lbs","kg"].map(u=>(
              <button key={u} onClick={async()=>{
                const hU=u==="kg"?"cm":"ft";
                const wp={...wPrefs,wUnit:u,hUnit:hU};
                setWPrefs(wp);
                await saveSettings(wp,null);
                if(user)sb.from("profiles").upsert({id:user.id,units:u==="kg"?"metric":"imperial"},{onConflict:"id"}).then(()=>{});
              }} style={{padding:"6px 14px",background:wUnit===u?"var(--accent)":"transparent",color:wUnit===u?"#fff":"rgba(245,245,240,0.4)",border:"none",fontFamily:"'DM Mono','SF Mono',monospace",fontSize:11,cursor:"pointer",letterSpacing:"0.08em"}}>{u}</button>
            ))}
          </div>
        }/>
        <MeRow label="Notifications" noChevron rightEl={<Toggle value={wPrefs?.notifications!==false} onChange={v=>{const wp={...wPrefs,notifications:v};setWPrefs(wp);saveSettings(wp,null);}}/>}/>
        {/* Calorie Cycling toggle removed: getDayTypeNutrition is now the single
            per-day target system (ring + meal plan). Training-day/rest-day variation
            is handled automatically by day type — no manual toggle needed. */}
        {(profile?.goal==="lose_fat"||profile?.goal==="recomp"||wPrefs?.primaryGoal==="lose_fat"||wPrefs?.primaryGoal==="recomp")&&(
          <div style={{padding:"14px 16px",borderTop:"1px solid rgba(245,245,240,0.06)"}}>
            <div style={{fontSize:14,color:"#f5f5f0",fontFamily:"'Barlow',sans-serif",marginBottom:4}}>Refeed Interval</div>
            <div style={{fontSize:11,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",marginBottom:10}}>Metabolism reset every N days in deficit</div>
            <div style={{display:"flex",gap:8}}>
              {[5,7,10].map(n=>(
                <button key={n} onClick={async()=>{const wp={...wPrefs,refeed_day_interval:n};setWPrefs(wp);await saveSettings(wp,null);await saveProfileField("refeed_day_interval",n);}} style={{flex:1,padding:"8px 0",borderRadius:8,background:(wPrefs?.refeed_day_interval||7)===n?"rgba(var(--accent-rgb),0.2)":"rgba(245,245,240,0.06)",border:`1px solid ${(wPrefs?.refeed_day_interval||7)===n?"rgba(var(--accent-rgb),0.5)":"rgba(245,245,240,0.1)"}`,color:(wPrefs?.refeed_day_interval||7)===n?"var(--accent)":"rgba(245,245,240,0.6)",fontFamily:"var(--mono)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                  {n}d
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── COACH OUTREACH ── */}
      <PeerComparisonSection user={user} eyebrowStyle={eyebrowStyle} cardStyle={cardStyle}/>
      <CoachOutreachSection user={user} eyebrowStyle={eyebrowStyle} cardStyle={cardStyle}/>

      {/* ── ACCOUNT ── */}
      <div style={eyebrowStyle}>// Account</div>
      <div style={cardStyle}>
        <MeRow label="Help & Support" onPress={()=>window.open("https://coach-macro.com/support","_blank")} value=""/>
        <MeRow label="Privacy Policy" onPress={()=>window.open("https://coach-macro.com/privacy","_blank")} value=""/>
        <MeRow label="Terms of Service" onPress={()=>window.open("https://coach-macro.com/terms","_blank")} value=""/>
        <MeRow label="Delete Account" isDestructive onPress={()=>setDelStep(delStep===0?1:0)}/>
        <MeRow label="Sign Out" isDestructive isLast onPress={onSignOut}/>
      </div>

      {/* Delete confirmation */}
      {delStep>0&&(
        <div style={{background:"rgba(var(--accent-rgb),0.06)",border:"1px solid rgba(var(--accent-rgb),0.2)",borderRadius:12,padding:16,marginTop:8}}>
          {delStep===1&&<>
            <div style={{fontSize:13,color:"var(--accent)",fontWeight:700,marginBottom:8}}>Delete your account?</div>
            <div style={{fontSize:12,color:"rgba(245,245,240,0.5)",marginBottom:6}}>Permanently deletes your profile, logs, workouts, and subscription records.</div>
            <div style={{fontSize:11,color:"var(--accent)",marginBottom:14,fontWeight:600}}>Cannot be undone.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setDelStep(0)} style={{flex:1,padding:"11px",background:"rgba(245,245,240,0.05)",color:"rgba(245,245,240,0.5)",border:"1px solid rgba(245,245,240,0.1)",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={()=>setDelStep(2)} style={{flex:1,padding:"11px",background:"var(--accent)",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Continue</button>
            </div>
          </>}
          {delStep===2&&<>
            <div style={{fontSize:13,color:"var(--accent)",fontWeight:700,marginBottom:8}}>Final confirmation</div>
            <div style={{fontSize:12,color:"rgba(245,245,240,0.5)",marginBottom:12}}>Type <strong style={{color:"#f5f5f0"}}>DELETE</strong> to permanently delete your account.</div>
            <input value={delInput} onChange={e=>setDelInput(e.target.value)} placeholder="Type DELETE here" style={{width:"100%",padding:"10px 12px",background:"rgba(245,245,240,0.05)",color:"#fff",border:`1px solid ${delInput==="DELETE"?"var(--accent)":"rgba(245,245,240,0.1)"}`,borderRadius:8,fontSize:13,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setDelStep(0);setDelInput("");}} style={{flex:1,padding:"11px",background:"rgba(245,245,240,0.05)",color:"rgba(245,245,240,0.5)",border:"1px solid rgba(245,245,240,0.1)",borderRadius:9,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={deleteAccount} disabled={deleting||delInput.trim()!=="DELETE"} style={{flex:1,padding:"11px",background:delInput==="DELETE"?"var(--accent)":"rgba(var(--accent-rgb),0.3)",color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,cursor:delInput==="DELETE"?"pointer":"not-allowed",fontFamily:"inherit"}}>{deleting?"Deleting...":"Delete Forever"}</button>
            </div>
          </>}
          {delStep===3&&<div style={{textAlign:"center",fontSize:13,color:"rgba(245,245,240,0.5)"}}>Deleting your account...</div>}
        </div>
      )}

      {/* ── EDIT FIELD MODAL ── */}
      {editModal&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setEditModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>{editModal==="name"?"Edit Name":editModal==="weight"?"Edit Weight":"Edit Height"}</div>
            <input autoFocus value={editValue} onChange={e=>setEditValue(e.target.value)} type={editModal==="name"?"text":"number"} placeholder={editModal==="name"?"Your name":editModal==="weight"?`Weight in ${wUnit}`:"Height in cm"}
              style={{width:"100%",padding:"12px 16px",background:"rgba(245,245,240,0.06)",color:"#f5f5f0",border:"1px solid rgba(245,245,240,0.12)",borderRadius:10,fontSize:16,fontFamily:"inherit",marginBottom:16,boxSizing:"border-box",outline:"none"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditModal(null)} style={{flex:1,padding:14,background:"transparent",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,color:"rgba(245,245,240,0.5)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={async()=>{
                const v=editValue.trim();if(!v){setEditModal(null);return;}
                if(editModal==="name"){setLocalName(v);await saveProfileField("name",v);}
                else if(editModal==="weight"){setLocalWeight(v);await saveProfileField("weight",v);}
                else if(editModal==="height"){setLocalHeight(v);await saveProfileField("height",v);}
                setEditModal(null);
              }} style={{flex:1,padding:14,background:"var(--accent)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── GOAL SELECTOR MODAL ── */}
      {showGoalSelector&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowGoalSelector(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Select Goal</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {Object.entries(GOAL_LABELS).map(([key,label])=>(
                <button key={key} onClick={async()=>{const wp={...wPrefs,primaryGoal:key};setWPrefs(wp);await saveSettings(wp,null);setShowGoalSelector(false);}} style={{padding:"14px 16px",background:currentGoal===key?"rgba(var(--accent-rgb),0.15)":"rgba(245,245,240,0.04)",border:`1px solid ${currentGoal===key?"rgba(var(--accent-rgb),0.4)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:currentGoal===key?"var(--accent)":"#f5f5f0",fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:currentGoal===key?700:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  {label}{currentGoal===key&&<span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SKILL SELECTOR MODAL ── */}
      {showSkillSelector&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowSkillSelector(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Select Skill Level</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{key:"beginner",label:"Beginner",sub:"Under 1 year"},{key:"intermediate",label:"Intermediate",sub:"1–4 years"},{key:"advanced",label:"Advanced",sub:"4+ years"}].map(({key,label,sub})=>(
                <button key={key} onClick={async()=>{const wp={...wPrefs,liftExp:key};setWPrefs(wp);await saveSettings(wp,null);setShowSkillSelector(false);}} style={{padding:"14px 16px",background:currentSkill===key?"rgba(var(--accent-rgb),0.15)":"rgba(245,245,240,0.04)",border:`1px solid ${currentSkill===key?"rgba(var(--accent-rgb),0.4)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:currentSkill===key?"var(--accent)":"#f5f5f0",fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:currentSkill===key?700:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div><div>{label}</div><div style={{fontSize:12,color:"rgba(245,245,240,0.4)",marginTop:2}}>{sub}</div></div>
                  {currentSkill===key&&<span>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── DIET PRESET MODAL ── */}
      {showDietPicker&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowDietPicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40,maxHeight:"75vh",overflowY:"auto"}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Select Diet Preset</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{id:'balanced',label:'Balanced'},{id:'high-protein',label:'High Protein'},{id:'keto',label:'Keto'},{id:'vegan',label:'Vegan'},{id:'vegetarian',label:'Vegetarian'},{id:'carnivore',label:'Carnivore'},{id:'low-carb',label:'Low Carb'},{id:'pescatarian',label:'Pescatarian'},{id:'mediterranean',label:'Mediterranean'}].map(({id,label})=>{
                const sel=(wPrefs?.mealPrepDiet||'balanced')===id;
                return(
                  <button key={id} onClick={async()=>{const wp={...wPrefs,mealPrepDiet:id};setWPrefs(wp);await saveSettings(wp,null);setShowDietPicker(false);}} style={{padding:"14px 16px",background:sel?"rgba(var(--accent-rgb),0.15)":"rgba(245,245,240,0.04)",border:`1px solid ${sel?"rgba(var(--accent-rgb),0.4)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:sel?"var(--accent)":"#f5f5f0",fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:sel?700:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {label}{sel&&<span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── RECOVERY CAPACITY MODAL ── */}
      {showRecoveryPicker&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowRecoveryPicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Recovery Capacity</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{v:'fast',l:'Very fast',d:'Ready to go the next day'},{v:'normal',l:'Normal',d:'A bit sore for about a day'},{v:'slow',l:'Slower',d:'Need 2–3 days to feel fresh'},{v:'very_slow',l:'Very slow',d:'4+ days to fully bounce back'}].map(({v,l,d})=>{
                const sel=(wPrefs?.recoveryCapacity||profile?.recovery_capacity||'normal')===v;
                return(
                  <button key={v} onClick={async()=>{
                    await saveProfileField('recovery_capacity',v);
                    const wp={...wPrefs,recoveryCapacity:v};setWPrefs(wp);await saveSettings(wp,null);
                    onProfileUpdate?.({recovery_capacity:v});
                    setShowRecoveryPicker(false);
                  }} style={{padding:"14px 16px",background:sel?"rgba(var(--accent-rgb),0.15)":"rgba(245,245,240,0.04)",border:`1px solid ${sel?"rgba(var(--accent-rgb),0.4)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:sel?"var(--accent)":"#f5f5f0",fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:sel?700:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div><div>{l}</div><div style={{fontSize:12,color:"rgba(245,245,240,0.4)",marginTop:2}}>{d}</div></div>
                    {sel&&<span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── LONG RUN DAY MODAL ── */}
      {showLongRunPicker&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>{setShowLongRunPicker(false);setLrdOverrideDay(null);}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Long Run Day</div>
            {(()=>{
              const LIFT=['training','hyrox','hybrid'];
              async function applyLongRun(d){
                const cur=schedule[d];
                const oldLrd=wPrefs?.longRunDay;
                const newSchedule={...schedule};
                // Demote the previous long-run day (only if it's still run/cardio)
                if(oldLrd&&oldLrd!==d&&(newSchedule[oldLrd]==='run'||newSchedule[oldLrd]==='cardio')){
                  newSchedule[oldLrd]='rest';
                }
                // Promote the new day to 'run' if not already run/cardio
                if(cur!=='run'&&cur!=='cardio'){
                  newSchedule[d]='run';
                }
                const wp={...wPrefs,longRunDay:d};
                setSchedule(newSchedule);
                setWPrefs(wp);
                await saveSettings(wp,newSchedule); // persists BOTH wprefs + schedule
                setLrdOverrideDay(null);
                setShowLongRunPicker(false);
              }
              return(
                <>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>{
                      const sel=wPrefs?.longRunDay===day;
                      const cur=schedule[day];
                      return(
                        <button key={day} onClick={()=>{
                          if(LIFT.includes(cur)){setLrdOverrideDay(day);}
                          else{applyLongRun(day);}
                        }} style={{padding:"14px 16px",background:sel?"rgba(var(--accent-rgb),0.15)":"rgba(245,245,240,0.04)",border:`1px solid ${sel?"rgba(var(--accent-rgb),0.4)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:sel?"var(--accent)":"#f5f5f0",fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:sel?700:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div>
                            {day}
                            {cur&&cur!=='rest'&&<span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"rgba(245,245,240,0.35)",marginLeft:8}}>{DAY_CFG[cur]?.label||cur}</span>}
                          </div>
                          {sel&&<span>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {/* Inline guardrail: confirm before replacing a lift/structured day */}
                  {lrdOverrideDay&&(
                    <div style={{background:"rgba(var(--accent-rgb),0.08)",border:"1px solid rgba(var(--accent-rgb),0.25)",borderRadius:10,padding:14,marginTop:12}}>
                      <div style={{fontSize:13,color:"var(--accent)",fontWeight:700,marginBottom:6}}>{lrdOverrideDay} is your {DAY_CFG[schedule[lrdOverrideDay]]?.label||'training'} day — replace it with your long run?</div>
                      <div style={{fontSize:12,color:"rgba(245,245,240,0.5)",marginBottom:10}}>This changes the schedule type to Run for {lrdOverrideDay}.</div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setLrdOverrideDay(null)} style={{flex:1,padding:"10px",background:"rgba(245,245,240,0.05)",color:"rgba(245,245,240,0.5)",border:"1px solid rgba(245,245,240,0.1)",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        <button onClick={()=>applyLongRun(lrdOverrideDay)} style={{flex:1,padding:"10px",background:"var(--accent)",color:"#fff",border:"none",borderRadius:8,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Replace</button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* ── RACE TYPE MODAL ── */}
      {showRaceTypePicker&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowRaceTypePicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Race Type</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[{v:'5k',l:'5K'},{v:'10k',l:'10K'},{v:'half_marathon',l:'Half Marathon'},{v:'marathon',l:'Marathon'},{v:'ultra',l:'Ultra'},{v:'obstacle',l:'Obstacle / OCR'},{v:'general',l:'General Fitness'}].map(({v,l})=>{
                const sel=profile?.run_race_type===v;
                return(
                  <button key={v} onClick={async()=>{
                    await saveProfileField('run_race_type',v);
                    onProfileUpdate?.({run_race_type:v});
                    setShowRaceTypePicker(false);
                  }} style={{padding:"14px 16px",background:sel?"rgba(var(--accent-rgb),0.15)":"rgba(245,245,240,0.04)",border:`1px solid ${sel?"rgba(var(--accent-rgb),0.4)":"rgba(245,245,240,0.08)"}`,borderRadius:10,color:sel?"var(--accent)":"#f5f5f0",fontFamily:"'Barlow',sans-serif",fontSize:15,fontWeight:sel?700:400,textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    {l}{sel&&<span>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── RACE DATE PICKER ── */}
      {showRaceDatePicker&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowRaceDatePicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>Race Date</div>
            <input type="date" defaultValue={profile?.run_race_date||''} min={new Date().toISOString().split('T')[0]}
              style={{width:"100%",padding:"12px 16px",background:"rgba(245,245,240,0.06)",color:"#f5f5f0",border:"1px solid rgba(245,245,240,0.12)",borderRadius:10,fontSize:16,fontFamily:"inherit",marginBottom:16,boxSizing:"border-box",outline:"none",colorScheme:"dark"}}
              onChange={async(e)=>{
                const val=e.target.value;
                if(!val)return;
                await saveProfileField('run_race_date',val);
                onProfileUpdate?.({run_race_date:val});
                setShowRaceDatePicker(false);
              }}/>
            <button onClick={()=>setShowRaceDatePicker(false)} style={{width:"100%",padding:14,background:"transparent",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,color:"rgba(245,245,240,0.5)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          </div>
        </div>,
        document.body
      )}

      {/* ── CALORIE TARGET PICKER ── */}
      {showCaloriePicker&&ReactDOM.createPortal(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end"}} onClick={()=>setShowCaloriePicker(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#0d0d0d",borderRadius:"16px 16px 0 0",padding:24,paddingBottom:40}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:4}}>Daily Calorie Target</div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.35)",marginBottom:16}}>Moves the ring immediately. Enter a value between 800 and 7000 kcal.</div>
            <input
              type="number"
              inputMode="numeric"
              defaultValue={profile?.goalCals??profile?.calorie_target??''}
              placeholder="e.g. 2200"
              style={{width:"100%",padding:"12px 16px",background:"rgba(245,245,240,0.06)",color:"#f5f5f0",border:"1px solid rgba(245,245,240,0.12)",borderRadius:10,fontSize:20,fontFamily:"inherit",marginBottom:16,boxSizing:"border-box",outline:"none"}}
              id="cal-target-input"
            />
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowCaloriePicker(false)} style={{flex:1,padding:14,background:"transparent",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,color:"rgba(245,245,240,0.5)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
              <button onClick={async()=>{
                const raw=document.getElementById('cal-target-input')?.value;
                const v=parseInt(raw,10);
                if(!raw||isNaN(v)||v<800||v>7000){showToast("Enter a value between 800 and 7000","error");return;}
                if(!user)return;
                // Matches allergens row spread: {id, profile_data:{...profile, key:val}}
                await sb.from("profiles").upsert(
                  {id:user.id,
                   calorie_target:v,
                   profile_data:{...profile,goalCals:v,calorie_target:v,manual_calorie_target:true}},
                  {onConflict:"id"});
                onProfileUpdate?.({goalCals:v,calorie_target:v,manual_calorie_target:true});
                showToast("Saved","success");
                setShowCaloriePicker(false);
              }} style={{flex:2,padding:14,background:"var(--accent)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Save</button>
            </div>
          </div>
        </div>,
        document.body
      )}
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
          <div style={{fontFamily:"var(--condensed)",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:'#fff'}}>COACH</div>
            <div><span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:'#fff'}}>RO</span></div>
          </div>
        </div>

        {/* Headline */}
        <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:'uppercase',marginBottom:12}}>Final Step</div>
        <div style={{fontFamily:"var(--condensed)",fontSize:48,fontWeight:900,fontStyle:'italic',lineHeight:.9,marginBottom:12}}>
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
          No charge until day 8 · Cancel anytime · $12.99/mo or $49.99/yr founding price
        </div>
      </div>
    </div>
  );
}

// ─── PAYWALL ──────────────────────────────────────────────────────────────────
export function Paywall({profile}) {
  const [plan, setPlan] = useState('annual');
  const [purchasing, setPurchasing] = useState(false);
  const plans = {
    annual:  {label:'Founding Annual', badge:'FOUNDING — SAVE 68%', price:'$49.99', per:'/yr',  sub:'$4.17/month · billed annually · locked for life', note:'7 days free, then $49.99/yr'},
    monthly: {label:'Monthly',         badge:null,                   price:'$12.99', per:'/mo',  sub:'billed monthly · cancel anytime',                    note:'7 days free, then $12.99/mo'},
  };

  async function handlePurchase() {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const { data: { user: u } } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!u) { showToast('Please sign in to continue.', 'error'); return; }
      const ok = plan === 'annual' ? await purchaseAnnual(u.id) : await purchaseMonthly(u.id);
      if (ok) window.location.reload();
      else showToast('Purchase failed. Try again.', 'error');
    } catch { showToast('Purchase failed. Try again.', 'error'); }
    finally { setPurchasing(false); }
  }
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
          <div style={{fontFamily:"var(--condensed)",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:'#fff'}}>COACH</div>
            <div><span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:'#fff'}}>RO</span></div>
          </div>
        </div>

        <div style={{fontFamily:"var(--condensed)",fontSize:44,fontWeight:900,fontStyle:'italic',lineHeight:.9,marginBottom:10}}>
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
          <div style={{fontFamily:"var(--condensed)",fontSize:64,fontWeight:900,color:T.prot,lineHeight:1,letterSpacing:-1,marginBottom:4}}>
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
          <button onClick={handlePurchase} disabled={purchasing} style={{display:'block',width:'100%',textAlign:'center',padding:'16px',background:purchasing?'rgba(234,93,67,0.5)':T.prot,color:'#fff',fontWeight:700,fontSize:16,borderRadius:10,border:'none',cursor:purchasing?'default':'pointer',letterSpacing:.3,transition:'opacity .2s',fontFamily:'inherit'}}>
            {purchasing ? 'Processing…' : 'Start Free Trial →'}
          </button>
        </div>
        <div style={{fontSize:12,color:T.mu,textAlign:'center'}}>
          Secure checkout · Cancel anytime · No charge for 7 days
        </div>
      </div>
    </div>
  );
}

// ─── UPGRADE SCREEN (mid-app trial expiry) ────────────────────────────────────
export function UpgradeScreen({ profile, onContinue }) {
  const [plan, setPlan] = useState('annual');
  const [purchasing, setPurchasing] = useState(false);
  const firstName = (profile?.name || '').split(' ')[0] || 'there';
  const plans = {
    annual:  { label:'Founding Annual', badge:'FOUNDING — SAVE 68%', price:'$49.99', per:'/yr',  sub:'$4.17/month · billed annually · locked for life' },
    monthly: { label:'Monthly',         badge:null,                   price:'$12.99', per:'/mo',  sub:'billed monthly · cancel anytime' },
  };

  async function handlePurchase() {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const { data: { user: u } } = await sb.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!u) { showToast('Please sign in to continue.', 'error'); return; }
      const ok = plan === 'annual' ? await purchaseAnnual(u.id) : await purchaseMonthly(u.id);
      if (ok) onContinue?.();
      else showToast('Purchase failed. Try again.', 'error');
    } catch { showToast('Purchase failed. Try again.', 'error'); }
    finally { setPurchasing(false); }
  }
  const p = plans[plan];

  const locked = [
    'AI food logging',
    'Restaurant AI',
    'Morning brief + coaching',
    'Recipe generator',
    'Adapt Now',
  ];
  const free = [
    'Workout tracking',
    'Macro targets + food diary',
    'Barcode scanner',
    'Progress stats + photos',
    'Apple Health sync',
  ];

  return (
    <div style={{ minHeight:'100vh', background:T.bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 20px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900;ital@0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');`}</style>
      <div style={{ width:'100%', maxWidth:440 }}>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
          <svg width={52} height={22} viewBox="0 0 52 22">
            <rect x={0}  y={0}  width={14} height={22} rx={3} fill={T.prot}/>
            <rect x={19} y={5}  width={14} height={17} rx={3} fill={T.carb}/>
            <rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/>
          </svg>
          <div style={{ fontFamily:"var(--condensed)", fontWeight:900, letterSpacing:3, fontSize:17, lineHeight:1.1 }}>
            <div style={{ color:'#fff' }}>COACH</div>
            <div><span style={{ color:T.prot }}>M</span><span style={{ color:T.carb }}>A</span><span style={{ color:T.fat }}>C</span><span style={{ color:'#fff' }}>RO</span></div>
          </div>
        </div>

        <div style={{ fontFamily:"var(--condensed)", fontSize:44, fontWeight:900, fontStyle:'italic', lineHeight:.92, marginBottom:10 }}>
          YOUR TRIAL<br/><span style={{ color:T.prot }}>HAS ENDED.</span>
        </div>
        <p style={{ fontSize:15, color:'#888', marginBottom:24, lineHeight:1.65 }}>
          Hey {firstName} — your 14-day free trial is up. Upgrade to keep AI features, or continue with core tracking for free.
        </p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          <div style={{ background:'rgba(var(--accent-rgb),0.07)', border:'1px solid rgba(var(--accent-rgb),0.2)', borderRadius:12, padding:'14px' }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.2, color:'rgba(var(--accent-rgb),0.75)', marginBottom:10 }}>AI PAUSED</div>
            {locked.map(f => (
              <div key={f} style={{ display:'flex', gap:8, padding:'5px 0', fontSize:12, color:'rgba(245,245,240,0.45)', alignItems:'flex-start' }}>
                <span style={{ color:'rgba(var(--accent-rgb),0.5)', flexShrink:0 }}>✕</span>{f}
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:12, padding:'14px' }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:1.2, color:'rgba(34,197,94,0.8)', marginBottom:10 }}>STILL FREE</div>
            {free.map(f => (
              <div key={f} style={{ display:'flex', gap:8, padding:'5px 0', fontSize:12, color:'rgba(245,245,240,0.65)', alignItems:'flex-start' }}>
                <span style={{ color:'rgba(34,197,94,0.8)', flexShrink:0 }}>✓</span>{f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', background:T.s1, border:`1px solid ${T.bd}`, borderRadius:10, padding:4, marginBottom:16, gap:4 }}>
          {Object.entries(plans).map(([k,v]) => (
            <button key={k} onClick={() => setPlan(k)} style={{ flex:1, padding:'11px', borderRadius:8, border:'none', cursor:'pointer', background:plan===k?T.prot:'none', color:plan===k?'#fff':T.mu, fontWeight:700, fontSize:14, fontFamily:"'Inter',sans-serif", transition:'all .2s' }}>
              {v.label}{k==='annual' && <span style={{ fontSize:11, opacity:.8 }}> — 67% off</span>}
            </button>
          ))}
        </div>

        <div style={{ background:T.s1, border:`1.5px solid ${T.prot}`, borderRadius:16, padding:'24px 24px 22px', marginBottom:12, position:'relative' }}>
          {p.badge && (
            <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:T.prot, color:'#fff', fontSize:9, fontWeight:800, padding:'4px 14px', borderRadius:9, letterSpacing:1.5, whiteSpace:'nowrap' }}>
              {p.badge}
            </div>
          )}
          <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
            <div style={{ fontFamily:"var(--condensed)", fontSize:56, fontWeight:900, color:T.prot, lineHeight:1, letterSpacing:-1 }}>{p.price}</div>
            <div style={{ fontSize:18, color:T.mu }}>{p.per}</div>
          </div>
          <div style={{ fontSize:13, color:T.mu, marginBottom:20 }}>{p.sub}</div>
          <button onClick={handlePurchase} disabled={purchasing} style={{ display:'block', width:'100%', textAlign:'center', padding:'16px', background:purchasing?'rgba(234,93,67,0.5)':T.prot, color:'#fff', fontWeight:700, fontSize:16, borderRadius:10, border:'none', cursor:purchasing?'default':'pointer', letterSpacing:.3, fontFamily:'inherit' }}>
            {purchasing ? 'Processing…' : 'Upgrade to Pro →'}
          </button>
        </div>

        <div style={{ fontSize:12, color:T.mu, textAlign:'center' }}>
          Secure checkout · Cancel anytime
        </div>
      </div>
    </div>
  );
}

// ─── EXPIRED PAYWALL — two-screen flow ───────────────────────────────────────
// Screen 1: Trial ended. X → Screen 2.
// Screen 2: Exit offer ($1 first month). X → dismiss entirely (onDismiss).
export function ExpiredPaywall({ profile, onSubscribed, onDismiss }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("annual");
  const [purchaseError, setPurchaseError] = useState("");

  // ── Dynamic values ──────────────────────────────────────────────────────
  const trialDays = (() => {
    if (!profile?.trial_started_at || !profile?.trial_ends_at) return 7;
    const start = new Date(profile.trial_started_at);
    const end   = new Date(profile.trial_ends_at);
    const days  = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return days >= 10 ? 14 : 7;
  })();

  const eyebrow   = trialDays === 14 ? "// your two weeks are up" : "// your free week is up";
  const firstName = profile?.first_name || profile?.name?.split(" ")[0] || null;

  // ── Purchase handlers ───────────────────────────────────────────────────
  async function getUid() {
    const { data: { user } } = await sb.auth.getUser();
    return user?.id;
  }

  async function purchaseMonthlyFn() {
    setPurchaseError("");
    try {
      setLoading(true);
      const uid = await getUid();
      if (!uid) return;
      const ok = await purchaseMonthly(uid);
      if (ok) onSubscribed?.();
      else setPurchaseError("Purchase failed. Try again.");
    } catch { setPurchaseError("Purchase failed. Try again."); }
    finally { setLoading(false); }
  }

  async function purchaseAnnualFn() {
    setPurchaseError("");
    try {
      setLoading(true);
      const uid = await getUid();
      if (!uid) return;
      const ok = await purchaseAnnual(uid);
      if (ok) onSubscribed?.();
      else setPurchaseError("Purchase failed. Try again.");
    } catch { setPurchaseError("Purchase failed. Try again."); }
    finally { setLoading(false); }
  }

  async function purchaseDollarOfferFn() {
    // $1 intro price is configured in App Store Connect as an introductory
    // offer on the monthly product — RevenueCat surfaces it automatically
    // when eligible. Wired to monthly purchase path for now.
    await purchaseMonthlyFn();
  }

  async function doRestore() {
    setPurchaseError("");
    try {
      setLoading(true);
      const uid = await getUid();
      if (!uid) return;
      const tier = await restorePurchases(uid);
      if (tier) onSubscribed?.();
      else setPurchaseError("No active purchases found.");
    } catch { setPurchaseError("Restore failed. Try again."); }
    finally { setLoading(false); }
  }

  // ── Shared style tokens ─────────────────────────────────────────────────
  const mono      = { fontFamily: 'var(--mono)' };
  const condensed = { fontFamily: 'var(--condensed)', fontStyle: 'italic', fontWeight: 900 };
  const body      = { fontFamily: 'var(--body, var(--condensed))' };

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative' }}>
      <style>{GLOBAL_CSS}</style>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(232,52,28,0.2)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      <div style={{ padding: '28px 24px 48px', overflowY: 'auto', minHeight: '100vh', position: 'relative', maxWidth: 480, margin: '0 auto' }}>

        {/* 1 ── LOGO ROW */}
        <div style={{ marginBottom: 28 }}>
          <Logo size={26} text={true} textColor="#fff" />
        </div>

        {/* 2 ── EYEBROW */}
        <div style={{ ...mono, fontSize: 11, color: 'var(--accent)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
          {eyebrow}
        </div>

        {/* 3 ── HEADLINE */}
        <div style={{ ...condensed, fontSize: 'clamp(44px, 11vw, 60px)', lineHeight: 1, textTransform: 'uppercase', marginBottom: 16 }}>
          <span style={{ color: '#fff' }}>KEEP YOUR</span><br />
          <span style={{ color: 'var(--accent)' }}>COACH.</span>
        </div>

        {/* 4 ── SUBHEAD */}
        <p style={{ ...body, fontSize: 15, color: '#fff', lineHeight: 1.5, marginBottom: 28, marginTop: 0 }}>
          {firstName ? `${firstName}, your` : 'Your'} coach learned how you train, eat, and recover — and built your Coach Score, Training DNA, and a plan that adapts every day. Lock it in before you lose it.
        </p>

        {/* 5 ── WHAT YOU KEEP */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 10.5, color: 'var(--accent)', letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 14 }}>
            // what your coach keeps doing
          </div>
          {[
            "A plan that rewrites itself around every workout and every night of sleep",
            "Snap a photo, get full macros in 3 seconds",
            "Restaurant orders, recipes, and a morning brief on tap",
            "Coach Score & Training DNA, recalculated daily",
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ color: 'var(--accent)', fontSize: 15, fontWeight: 700, lineHeight: '22px', flexShrink: 0 }}>→</span>
              <span style={{ ...body, fontSize: 14.5, color: '#fff', lineHeight: '22px' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,59,48,0.25)', marginBottom: 24 }} />

        {/* 6 ── PLAN TOGGLE */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {/* Annual */}
          <button
            onClick={() => setPlan("annual")}
            style={{
              flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
              background: plan === "annual" ? 'rgba(255,59,48,0.1)' : 'transparent',
              border: plan === "annual" ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ ...condensed, fontSize: 18, color: '#fff', lineHeight: 1, marginBottom: 4 }}>Annual</div>
            <div style={{ ...mono, fontSize: 10.5, color: 'var(--accent)', letterSpacing: 1 }}>67% off</div>
          </button>

          {/* Monthly */}
          <button
            onClick={() => setPlan("monthly")}
            style={{
              flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
              background: 'transparent',
              border: plan === "monthly" ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.15)',
              textAlign: 'center',
            }}
          >
            <div style={{ ...condensed, fontSize: 18, color: '#fff', lineHeight: 1, marginBottom: 4 }}>Monthly</div>
            <div style={{ ...mono, fontSize: 10.5, color: '#fff', letterSpacing: 1 }}>$12.99/mo</div>
          </button>
        </div>

        {/* 7 ── OFFER CARD */}
        <div style={{ background: '#0d0d0d', border: '1.5px solid rgba(255,59,48,0.35)', borderRadius: 16, padding: '20px 20px 22px', marginBottom: 16, position: 'relative' }}>
          {/* Top accent line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)', borderRadius: '16px 16px 0 0' }} />

          {plan === "annual" && (
            <>
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--accent)', borderRadius: 20, padding: '4px 12px', marginBottom: 18, marginTop: 4 }}>
                <span style={{ ...mono, fontSize: 9.5, color: 'var(--accent)', letterSpacing: 1.8, textTransform: 'uppercase' }}>FOUNDING · LOCKED FOR LIFE</span>
              </div>

              {/* Price row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
                <span style={{ ...condensed, fontStyle: 'italic', fontSize: 24, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', textDecorationColor: 'var(--accent)', lineHeight: 1 }}>$69.99</span>
                <span style={{ ...condensed, fontSize: 58, color: 'var(--accent)', lineHeight: 1 }}>$49.99</span>
                <span style={{ ...body, fontSize: 18, color: '#fff', paddingBottom: 6 }}>/yr</span>
              </div>

              {/* Reframe */}
              <div style={{ ...body, fontSize: 14, color: '#fff', marginBottom: 6 }}>Less than $1 a week after your trial</div>

              {/* Competitor */}
              <div style={{ ...body, fontSize: 12.5, color: '#fff' }}>MacroFactor charges $71.99 for less.</div>
            </>
          )}

          {plan === "monthly" && (
            <>
              {/* Price row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginBottom: 10, marginTop: 4 }}>
                <span style={{ ...condensed, fontSize: 58, color: 'var(--accent)', lineHeight: 1 }}>$12.99</span>
                <span style={{ ...body, fontSize: 18, color: '#fff', paddingBottom: 6 }}>/mo</span>
              </div>
              <div style={{ ...body, fontSize: 14, color: '#fff' }}>Billed monthly. Cancel anytime.</div>
            </>
          )}
        </div>

        {/* 8 ── CTA BUTTON */}
        <button
          onClick={plan === "annual" ? purchaseAnnualFn : purchaseMonthlyFn}
          disabled={loading}
          style={{
            width: '100%', padding: 18, background: 'var(--accent)', border: 'none',
            borderRadius: 16, cursor: loading ? 'default' : 'pointer',
            ...condensed, fontSize: 21, color: '#fff', letterSpacing: 1,
            opacity: loading ? 0.7 : 1, marginBottom: 8,
          }}
        >
          {loading ? '…' : plan === "annual" ? "Keep My Coach →" : "Start Monthly →"}
        </button>

        {/* Inline error */}
        {purchaseError ? (
          <div style={{ ...mono, fontSize: 12, color: '#fff', textAlign: 'center', marginBottom: 12 }}>{purchaseError}</div>
        ) : null}

        {/* 9 ── TRUST ROW */}
        <div style={{ ...mono, fontSize: 10.5, color: '#fff', letterSpacing: 1.4, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>
          $0.00 TODAY · CANCEL ANYTIME · LOCKED FOR LIFE
        </div>

        {/* 10 ── RESTORE LINK */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={doRestore}
            disabled={loading}
            style={{ background: 'none', border: 'none', ...mono, fontSize: 11, color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}
          >Restore purchase</button>
        </div>

      </div>
    </div>
  );
}
