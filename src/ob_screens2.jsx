import { useState, useEffect, useRef, useMemo } from "react";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, SPLIT_CYCLES, FOCUS_MUSCLES, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, FASTING_PROTOCOLS, BF_DATA, BF_VISUAL,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, BodyFigure, InfoTip, ErrorBoundary,
  DashboardSkeleton, ScoreSkeleton, CardSkeleton, ProgressSkeleton, CalendarSkeleton,
  calcTDEE, autoFocus, useCountUp, lookupBarcode,
  getDayMacros, getTodayKey, isToday, hap, hapPR, hapSuccess, pad2 } from "./components.jsx";
import { showToast, subscribeToast } from "./utils/toast.js";
import { TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES,
  PROMOS, AthletePassport, TrainingDNA, PerformanceCalendar, RacePredictor } from "./sections.jsx";
import { getWorkoutForDay } from "./programs.js";
import { FuelSection } from "./fuel.jsx";
import { sb, ai, streamAI } from "./client.js";
import { track, EVENTS, trackError } from "./services/analytics.js";
import { getCyclePhase } from "./utils/ait.js";
import { getCycleNutrition, getConsistencyScore, showConsistencyScore, isCalorieFreeMode } from "./utils/female.js";
import { getDayType, getDayTypeNutrition, getWeekNutrition, getDailyWaterTarget } from "./utils/dayTypeNutrition.js";
import { getWaterLogs, addWaterLog, deleteWaterLog, getWaterHistory } from "./services/foodDatabase.js";
import { recordWorkoutBioData, getInsights, getDataPointCounts, calcPerformanceScore } from "./services/biologicalAlgorithm.js";
import { calculatePRProbability, generateWeeklyForecast, calculateGoalTrajectories, calcNutritionAdherence7d, trackPredictionOutcome } from "./services/predictionEngine.js";
import { detectMetabolicAdaptation, generateAdaptationProtocol, buildProtocolPhases, saveDetectedAdaptation, getActiveAdaptation, dismissAdaptation, startProtocol as startMetabolicProtocol, completeProtocol, getProtocolProgress } from "./services/metabolicAdaptation.js";
import { MetabolicAdaptationBanner, MetabolicAdaptationModal, MetabolicResetProgressCard } from "./MetabolicAdaptation.jsx";
import { requestCalendarAccess, checkCalendarAuthorized, getUpcomingEvents } from "./services/calendarService.js";
import { analyzeScheduleForTraining, buildHotelWorkout } from "./services/calendarAnalysis.js";
import { ScheduleAlertCard, TravelNutritionCard, CalendarConnectPrompt } from "./LifeAwareTraining.jsx";
import BioAlgorithmScreen from "./BioAlgorithm.jsx";
import { FlagBtn } from "./FlagBtn.jsx";
import { calculateAllRisks, logInjury, getInjuryLogs, resolveInjury, getInjuryFreeDays, detectPatterns } from "./services/injuryRisk.js";
import { InjuryHistorySection, InjuryRiskModal, PainLogModal } from "./InjuryPrevention.jsx";
import { initAppleHealth, checkAppleHealthAuthorized, getDailyHealthSnapshot, getMorningAdjustment, stepsToCalorieBonus } from "./services/appleHealth.js";
import { getAIErrorMessage } from "./utils/errors.js";
import { MuscleVolumeChart } from "./MuscleVolumeChart.jsx";
import { FluxRangeChart, PeakPerformanceChart } from "./PerformanceCharts.jsx";
import { BodyCompositionVector, GoalProbabilityCone, BalanceCheck } from "./ProgressCharts2.jsx";
import { NutritionPerformanceChart, WeightTrendChart, MacroCalendarHeatmap, SleepPerformanceChart } from "./ProgressCharts3.jsx";
import ChartSettingsScreen, { CHART_REGISTRY, DEFAULT_SETTINGS as CHART_DEFAULT_SETTINGS, ChartWrap, ChartExplainModal } from "./screens/ChartSettings.jsx";
import PhotoFoodLogger from "./PhotoFoodLogger.jsx";

export function ChoiceScreens({sc,d,upd,auto,next,tdee,FactCard,MiniBar}) {
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
    21:{emoji:"🏥",stat:"Your safety is our top priority",text:"These conditions help us apply the right exercise modifications, intensity limits, and safety notes to every session we build for you."},
    22:{emoji:"📈",stat:"Lifting experience determines your progressive overload pace",text:"Beginners gain 1-1.5% strength per week. Intermediates 0.5%. Advanced lifters 0.25%. Your program should match where you actually are."},
    23:{emoji:"🏃",stat:"Cardio experience affects how efficiently your body burns calories",text:"Trained runners burn fewer calories per mile than beginners — the body adapts. Your cardio history shapes your training zones and calorie targets."},
  };

  const fact=FACTS[sc];

  const screens={
    6:{num:"6",q:"Weight history.",sub:`Have you ever weighed significantly more than ${d.wUnit==="lbs"?Math.round(parseFloat(d.weight||180)*1.15):Math.round(parseFloat(d.weight||80)*1.15)}${d.wUnit}? Past weight affects your current metabolism.`,choices:[{v:"yes",l:"Yes, significantly more"},{v:"no",l:"No, this is typical"},{v:"notsure",l:"Not sure"}],key:"wHistory"},
    7:{num:"7",q:"Recent weight trend?",sub:"Think about the last 3–4 weeks. Not one day — your trend.",choices:[{v:"losing",l:"Losing weight",e:"📉"},{v:"gaining",l:"Gaining weight",e:"📈"},{v:"stable",l:"Weight stable",e:"➡️"},{v:"notsure",l:"Not sure",e:"🤔"}],key:"wTrend"},
    9:{num:"9",q:"How active is your job?",sub:"This alone can swing your TDEE by 700+ kcal/day.",choices:[{v:"desk",l:"Desk / Remote",e:"💻",sub:"Sitting most of the day"},{v:"mix",l:"Mixed",e:"🚶",sub:"Some sitting, some movement"},{v:"feet",l:"On my feet",e:"👟",sub:"Standing and walking most of the day"},{v:"physical",l:"Physical labor",e:"🔨",sub:"Heavy movement all day"}],key:"job"},
    10:{num:"10",q:"Daily steps?",sub:"Be honest — most people overestimate this.",choices:[{v:"u3k",e:"🪑",l:"Under 2,000",sub:"Mostly sitting — desk job, minimal walking"},{v:"3-6k",e:"🚶",l:"2,000–5,000 steps",sub:"Lightly active — some walking through the day"},{v:"6-10k",e:"🚶‍♂️",l:"5,000–8,000 steps",sub:"Moderately active — regular walking, errands"},{v:"10-15k",e:"🏃",l:"8,000–12,000 steps",sub:"Active — intentional movement, active job or lifestyle"},{v:"15k+",e:"⚡",l:"Over 12,000 steps",sub:"Very active — on feet all day or high NEAT lifestyle"}],key:"steps"},
    11:{num:"11",q:"Training sessions per week?",choices:[{v:"n0",l:"0 / week"},{v:"1-3",l:"1–3 / week"},{v:"4-6",l:"4–6 / week"},{v:"7+",l:"7+ / week",sub:"Training every day"}],key:"freq"},
    12:{num:"12",q:"Primary training type?",sub:"Pick the one that dominates your week.",choices:[{v:"strength",l:"Strength / Lifting",e:"🏋️"},{v:"run",l:"Running / Cardio",e:"🏃"},{v:"hyrox",l:"Hyrox / CrossFit",e:"🔥"},{v:"hybrid",l:"Hybrid — mix of types",e:"⚡"},{v:"sport",l:"Sport specific",e:"🏅"}],key:"trainType"},
    13:{num:"13",q:"Workout intensity?",sub:"Average RPE across most of your sessions.",choices:[{v:"light",l:"Light",e:"💧",sub:"Mostly moving, never out of breath"},{v:"moderate",l:"Moderate",e:"💦",sub:"Sweating, slightly challenging, could hold a short conversation"},{v:"hard",l:"Hard",e:"🔥",sub:"Breathing heavy, hard to talk, push through discomfort"},{v:"extreme",l:"Extreme",e:"⚡",sub:"All out — near max effort every session, very uncomfortable"}],key:"intensity"},
    14:{num:"14",q:"Activity outside workouts?",sub:"Lifestyle activity (NEAT) is often bigger than your workouts.",choices:[{v:"sedentary",l:"Mostly sedentary",e:"🛋️",sub:"Gym → couch"},{v:"moderate",l:"Moderately active",e:"🚶",sub:"Regular errands, weekend activities"},{v:"very",l:"Very active",e:"🏃",sub:"High energy lifestyle outside the gym"}],key:"activity"},
    15:{num:"15",q:"Average sleep hours?",sub:"This directly reduces your metabolic rate if you're under 7.",choices:[{v:"u5",l:"Under 5 hours"},{v:"5-6",l:"5–6 hours"},{v:"6-7",l:"6–7 hours"},{v:"7-8",l:"7–8 hours",sub:"Optimal recovery range"},{v:"8+",l:"8+ hours"}],key:"sleep"},
    16:{num:"16",q:"Sleep quality?",choices:[{v:"poor",l:"Poor",e:"😴"},{v:"fair",l:"Fair",e:"😐"},{v:"good",l:"Good",e:"🙂"},{v:"excellent",l:"Excellent",e:"⚡"}],key:"sleepQ"},
    17:{num:"17",q:"How long have you been dieting?",sub:"Prolonged restriction causes metabolic adaptation — we calculate it precisely.",choices:[{v:"not",l:"Not currently dieting"},{v:"u3",l:"In a deficit under 3 months"},{v:"3plus",l:"3+ months in a deficit",sub:"Significant adaptation likely"},{v:"offon",l:"On-and-off for years"}],key:"metHistory"},
    18:{num:"18",q:"How's your protein intake?",sub:"High protein intake raises your TDEE through the thermic effect of food.",choices:[{v:"none",l:"I don't track it"},{v:"low",l:"Very little protein"},{v:"moderate",l:"Some, inconsistently"},{v:"high",l:"High — I hit a daily target",sub:"0.7–1g+ per lb bodyweight"}],key:"protein"},
    22:{num:"22",q:"Weightlifting experience?",choices:[{v:"none",l:"None",e:"🌱"},{v:"beginner",l:"Beginner",e:"💪",sub:"< 1 year"},{v:"intermediate",l:"Intermediate",e:"🔥",sub:"1–4 years"},{v:"advanced",l:"Advanced",e:"⚡",sub:"4+ years, near your genetic ceiling"}],key:"liftExp"},
    23:{num:"23",q:"Cardio experience?",choices:[{v:"none",l:"None",e:"🌱"},{v:"beginner",l:"Beginner",e:"🚶",sub:"Occasional jogging"},{v:"intermediate",l:"Intermediate",e:"🏃",sub:"Can run 5K+ comfortably"},{v:"advanced",l:"Advanced",e:"🏅",sub:"Half marathon+ fitness"}],key:"cardioExp"},
  };

  // Live TDEE mini-chart that updates as they answer
  const LiveTDEEBar=()=>{
    if(!tdee||!tdee.total) return null;
    const vars=[
      {label:"Base BMR",val:tdee.bmr,color:T.prot},
      {label:"Activity & NEAT",val:Math.round(tdee.total*.35),color:T.carb},
      {label:"Exercise",val:Math.round(tdee.total*.2),color:T.fat},
      {label:"Thermic Effect",val:tdee.tef,color:"#7E57C2"},
    ];
    const maxV=Math.max(...vars.map(v=>v.val));
    return(
      <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px 16px",marginTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>Your TDEE so far</div>
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
        <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Equation Upgrade Unlocked</div>
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
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${d.conditions.includes(o.v)?T.prot:T.bd}`,background:d.conditions.includes(o.v)?T.prot:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
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

  // Safety health check
  if(sc===21){
    const SAFETY_CONDITIONS=[
      {v:"heart",l:"Heart condition",sub:"Includes cardiomyopathy, arrhythmia, valve issues"},
      {v:"hypertension",l:"High blood pressure (hypertension)",sub:"Medicated or uncontrolled"},
      {v:"diabetes",l:"Diabetes (Type 1 or 2)",sub:"Blood sugar management during exercise"},
      {v:"epilepsy",l:"Epilepsy / seizure disorder",sub:"Activity safety modifications apply"},
      {v:"surgery",l:"Recent surgery (within 12 months)",sub:"Including joint replacements"},
      {v:"joint_replacement",l:"Joint replacement",sub:"Hip, knee, shoulder — impact limits apply"},
      {v:"bone_condition",l:"Osteopenia or osteoporosis",sub:"Bone density affects safe loading"},
      {v:"none",l:"None of the above"},
    ];
    const toggle=v=>{
      if(v==="none"){upd("healthConditions",["none"]);return;}
      const cur=(d.healthConditions||[]).filter(c=>c!=="none");
      upd("healthConditions",cur.includes(v)?cur.filter(c=>c!==v):[...cur,v]);
    };
    const hc=d.healthConditions||[];
    return(
      <div style={{animation:"fadeIn 0.25s ease"}}>
        <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Safety Check</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:8}}>A quick safety check.</div>
        <p style={{fontSize:13,color:T.mu,marginBottom:16,lineHeight:1.65}}>Select any that apply. We'll apply the right modifications, intensity limits, and safety notes to every session — automatically.</p>
        {SAFETY_CONDITIONS.map(o=>(
          <div key={o.v} onClick={()=>toggle(o.v)} style={{background:hc.includes(o.v)?`${T.prot}08`:T.s2,border:`1.5px solid ${hc.includes(o.v)?T.prot:T.bd}`,borderRadius:12,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:hc.includes(o.v)?T.prot:"#fff"}}>{o.l}</div>{o.sub&&<div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>}</div>
            <div style={{width:18,height:18,borderRadius:4,border:`2px solid ${hc.includes(o.v)?T.prot:T.bd}`,background:hc.includes(o.v)?T.prot:"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {hc.includes(o.v)&&<div style={{fontSize:11,color:"#000",fontWeight:800}}>✓</div>}
            </div>
          </div>
        ))}
        <PrimaryBtn onClick={next} label="Continue →" disabled={hc.length===0} style={{marginTop:8}}/>
        <div style={{background:"rgba(74,144,226,.07)",border:"1px solid rgba(74,144,226,.2)",borderRadius:10,padding:"10px 14px",marginTop:14,display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:14,flexShrink:0}}>💙</span>
          <div style={{fontSize:11,color:"rgba(74,144,226,.9)",lineHeight:1.6}}>Your answers are used only to personalize your experience. Coach Macro is not a medical service — always consult a qualified healthcare professional for medical advice.</div>
        </div>
        {fact&&<FactCard emoji={fact.emoji} stat={fact.stat} text={fact.text} color={T.prot}/>}
      </div>
    );
  }

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

export function TDEEReveal({tdee,animTDEE,d,chatReply,setCR,next}) {
  const chats=[
    {q:"Got it — set my goal →",isNext:true},
    {q:"How was this calculated?",r:`We used ${d.bodyFat?"Katch-McArdle (370 + 21.6 × lean body mass)":"Mifflin-St Jeor"} as your base BMR, then built a custom multiplier from your job, steps, training frequency, intensity, and lifestyle. 16 variables total — far more precise than a standard TDEE calculator.`},
    {q:"What's my biggest factor?",r:`Your biggest driver is ${d.job==="physical"?"your physical job — labor adds 400–600 kcal/day above desk workers":d.freq==="7+"?"your training frequency — daily training creates massive cumulative burn":d.steps==="15k+"?"your step count — 15k+ daily steps is elite NEAT":"your overall combination of job activity, steps, and training"}.`},
    {q:"This seems off",r:"Connect Apple Health or Garmin after setup — we'll update your numbers from real data. Your first number is maintenance. Set your goal next to get your actual daily target."},
  ];
  return (
    <div style={{animation:"fadeIn 0.3s ease"}}>
      <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12,fontFamily:"'DM Mono',monospace"}}>Your Results</div>
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

export function GoalScreen({d,upd,tdee,goalCals,goalRate,setGR,onComplete}) {
  const [termsAccepted,setTermsAccepted]=useState(false);
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
      <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10,fontFamily:"'DM Mono',monospace"}}>Final Question</div>
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
          <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>All options</div>
          {(rates[d.goal]||[]).map(r=>{const info=rateInfo[r];const isRec=rec&&r===rec.rate;return(
            <div key={r} onClick={()=>setGR(r)} style={{background:goalRate===r?`${T.prot}10`:T.s2,border:`1.5px solid ${goalRate===r?T.prot:isRec?`${T.prot}30`:T.bd}`,borderRadius:11,padding:"12px 15px",marginBottom:7,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:600,color:goalRate===r?T.prot:"#fff"}}>{info.label}</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>{info.result}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>{isRec&&<div style={{fontSize:9,color:T.prot,background:`${T.prot}15`,border:`1px solid ${T.prot}30`,borderRadius:8,padding:"2px 7px",fontWeight:700}}>Recommended</div>}{goalRate===r&&<div style={{color:T.prot,fontSize:16}}>✓</div>}</div>
            </div>
          );})}
        </div>
      </>}
      {d.goal&&<div style={{background:"#070E1A",border:`1px solid ${T.prot}30`,borderRadius:13,padding:"16px",marginBottom:20}}>
        <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Your Daily Target</div>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:T.prot,lineHeight:1}}>{(d.goal==="maintain"?tdee.total:goalCals).toLocaleString()}</div>
        <div style={{fontSize:13,color:T.mu,marginTop:4}}>kcal / day · {d.goal} phase</div>
      </div>}
      {/* Goal timeline */}
      {d.goal&&goalRate&&<>
        <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8,marginTop:4}}>When do you want to reach this goal?</div>
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
      <div onClick={()=>setTermsAccepted(v=>!v)} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16,cursor:"pointer",padding:"2px 0"}}>
        <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${termsAccepted?T.prot:T.bd}`,background:termsAccepted?T.prot:"transparent",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
          {termsAccepted&&<svg width={11} height={9} viewBox="0 0 11 9" fill="none"><path d="M1 4l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div style={{fontSize:12,color:T.mu,lineHeight:1.6}}>
          I agree to the{" "}
          <a href="/terms" target="_blank" onClick={e=>e.stopPropagation()} style={{color:T.prot,textDecoration:"none"}}>Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" target="_blank" onClick={e=>e.stopPropagation()} style={{color:T.prot,textDecoration:"none"}}>Privacy Policy</a>
        </div>
      </div>
      <PrimaryBtn onClick={onComplete} label="Build My Dashboard →" disabled={!d.goal||(d.goal!=="maintain"&&!goalRate)||!d.goalTimeline||!termsAccepted}/>
    </div>
  );
}

// ─── SMART DELOAD DETECTOR ────────────────────────────────────────────────────

const SLEEP_MAP = {u5:4.5,"5-6":5.5,"6-7":6.5,"7-8":7.5,"8+":8.5};
const PRIMARY_LIFTS = [
  {key:"bench",   label:"Bench Press",    terms:["bench"]},
  {key:"squat",   label:"Squat",          terms:["squat"]},
  {key:"deadlift",label:"Deadlift",       terms:["deadlift"]},
  {key:"ohp",     label:"OHP",            terms:["overhead press","ohp","shoulder press","military press"]},
];

function analyzeDeload(logs, profile, schedule) {
  const now = new Date();
  const recent = logs.filter(w=>(now-new Date((w.date||"")+"T12:00:00"))<=21*864e5);
  const thisWeek = logs.filter(w=>(now-new Date((w.date||"")+"T12:00:00"))<=7*864e5);
  const signals = [];

  // Build per-lift session history (chronological)
  const liftHist = {};
  PRIMARY_LIFTS.forEach(l=>{liftHist[l.key]=[];});
  [...recent].sort((a,b)=>new Date(a.date+"T12:00:00")-new Date(b.date+"T12:00:00")).forEach(log=>{
    (log.workout?.exercises||[]).forEach(ex=>{
      const n=(ex.name||"").toLowerCase();
      PRIMARY_LIFTS.forEach(lift=>{
        if(lift.terms.some(t=>n.includes(t))){
          const ws=(ex.sets||[]).map(s=>parseFloat(s.weight)||0).filter(w=>w>0);
          if(ws.length)liftHist[lift.key].push({date:log.date,maxW:Math.max(...ws),label:lift.label});
        }
      });
    });
  });

  // Signal 1 — Strength stall: no increase across last 3 sessions
  Object.values(liftHist).forEach(sess=>{
    if(sess.length>=3){
      const last3=sess.slice(-3);
      if(last3.every(s=>s.maxW<=last3[0].maxW)&&last3[0].maxW>0)
        signals.push({icon:"💪",label:`${last3[0].label} stalled — no progress in last 3 sessions`,type:"stall"});
    }
  });

  // Signal 2 — Performance decline: current >5% below 3-week peak
  Object.values(liftHist).forEach(sess=>{
    if(sess.length>=2){
      const peak=Math.max(...sess.map(s=>s.maxW));
      const last=sess[sess.length-1];
      const drop=(peak-last.maxW)/peak*100;
      if(peak>0&&last.maxW>0&&drop>=5)
        signals.push({icon:"📉",label:`${last.label} down ${Math.round(drop)}% from your 3-week peak`,type:"decline"});
    }
  });

  // Signal 3 — Missed reps: 2+ sessions this week with <75% sets completed
  let missedSess=0;
  thisWeek.forEach(log=>{
    const hasMissed=(log.workout?.exercises||[]).some(ex=>{
      const total=(ex.sets||[]).length;
      const done=(ex.sets||[]).filter(s=>s.done===true).length;
      return total>0&&done<total*0.75;
    });
    if(hasMissed)missedSess++;
  });
  if(missedSess>=2)signals.push({icon:"⚠️",label:`Missed reps — ${missedSess} sessions fell short this week`,type:"missed_reps"});

  // Signal 4 — Low adherence this week
  const scheduled=Object.values(schedule||{}).filter(v=>["training","cardio","run","hyrox"].includes(v)).length;
  if(scheduled>=3&&thisWeek.length/scheduled<0.8)
    signals.push({icon:"📆",label:`${Math.round(thisWeek.length/scheduled*100)}% adherence this week (${thisWeek.length}/${scheduled} sessions)`,type:"adherence"});

  // Signal 5 — Poor sleep
  const sleepH=SLEEP_MAP[profile?.sleep];
  if(sleepH&&sleepH<6.5)
    signals.push({icon:"😴",label:`Sleep averaging ${sleepH}hrs this week — recovery compromised`,type:"sleep"});

  // Signal 6 — High volume
  let sets=0;
  thisWeek.forEach(log=>(log.workout?.exercises||[]).forEach(ex=>{sets+=(ex.sets||[]).length;}));
  if(sets>120)signals.push({icon:"🔥",label:`${sets} sets this week — overreaching risk`,type:"high_volume"});

  return signals;
}

function DeloadCard({signals, onStart, onDismiss}) {
  return (
    <div style={{margin:"0 20px 14px",padding:"16px 18px",background:"#0d1508",border:"1px solid rgba(245,166,35,0.3)",borderLeft:"3px solid #F5A623",borderRadius:"4px 14px 14px 4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:14}}>⚠️</span>
        <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.16em",color:"#F5A623",textTransform:"uppercase",fontWeight:700}}>Deload Recommended</div>
      </div>
      <div style={{fontSize:12,color:"rgba(245,245,240,0.5)",marginBottom:14}}>Your body is signaling recovery is needed.</div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
        {signals.slice(0,4).map((s,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{s.icon}</span>
            <span style={{fontSize:12,color:"rgba(245,245,240,0.75)",lineHeight:1.5}}>{s.label}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:"rgba(245,166,35,0.6)",lineHeight:1.7,marginBottom:14,fontStyle:"italic"}}>
        "This is not failure. This is strategy.<br/>Elite athletes deload every 4–8 weeks."
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onStart} style={{flex:2,padding:"12px",background:"var(--red)",border:"none",borderRadius:10,color:"#fff",fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Start Deload Week →</button>
        <button onClick={onDismiss} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",fontSize:11,cursor:"pointer"}}>Tomorrow</button>
      </div>
    </div>
  );
}

function DeloadActiveBadge({daysLeft, onComplete}) {
  return (
    <div style={{margin:"0 20px 14px",padding:"14px 18px",background:"rgba(245,166,35,0.06)",border:"1px solid rgba(245,166,35,0.25)",borderLeft:"3px solid #F5A623",borderRadius:"4px 14px 14px 4px",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:20}}>🔄</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:"var(--mono)",fontSize:10,color:"#F5A623",letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,marginBottom:3}}>Deload Week Active</div>
        <div style={{fontSize:12,color:"rgba(245,245,240,0.55)"}}>{daysLeft>0?`${daysLeft} day${daysLeft===1?"":"s"} remaining — 60% weights, 12–15 reps`:"Deload complete — returning to full program"}</div>
      </div>
      {daysLeft<=0&&<button onClick={onComplete} style={{padding:"8px 14px",background:"var(--green,#00B894)",border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>Resume →</button>}
    </div>
  );
}

// ─── HYDRATION BONUS ─────────────────────────────────────────────────────────

function getHydrationBonus(loggedOz, targetOz) {
  if (!loggedOz || !targetOz) return 0;
  const pct = loggedOz / targetOz;
  if (pct >= 1.0)  return 3;
  if (pct >= 0.75) return 1;
  if (pct >= 0.5)  return 0;
  if (pct >= 0.25) return -1;
  return -3;
}

// ─── COACH MACRO SCORE ────────────────────────────────────────────────────────

const SCORE_SLEEP = {u5:20,"5-6":40,"6-7":65,"7-8":85,"8+":100};
const _WDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

function calcCoachScore({profile,consumed,macros,log,workoutLogsRaw,schedule,todayKey,todayType,healthSnap}) {
  const today = new Date().toISOString().split("T")[0];

  // ── Recovery (40%) ─────────────────────────────────────────────────────────
  // Use real HealthKit data when available, fall back to onboarding self-report
  let sleepPts;
  if (healthSnap?.sleep != null) {
    const s = healthSnap.sleep;
    sleepPts = s>=8?100:s>=7?85:s>=6?65:s>=5?45:25;
  } else {
    sleepPts = SCORE_SLEEP[profile?.sleep] ?? 65;
  }

  let hrvPts = 75;
  if (healthSnap?.hrv != null) {
    const h = healthSnap.hrv;
    hrvPts = h>60?100:h>40?85:h>25?65:h>15?40:20;
  }

  let rhrPts = 75;
  if (healthSnap?.rhr != null) {
    const r = healthSnap.rhr;
    rhrPts = r<50?100:r<60?85:r<70?65:r<80?45:25;
  }

  const todayIdx = _WDAYS.indexOf(todayKey);
  let consecutive = 0;
  for(let i=0; i<=6; i++){
    const k = _WDAYS[(todayIdx - i + 7) % 7];
    const t = schedule[k]||"rest";
    if(t==="rest"||t==="flex") break;
    consecutive++;
  }
  const restPts = consecutive<=2?100:consecutive===3?80:consecutive===4?60:40;

  const hasRealHealth = healthSnap?.sleep!=null || healthSnap?.hrv!=null || healthSnap?.rhr!=null;
  let recovery;
  if (hasRealHealth) {
    const bioScore = Math.round(sleepPts*0.35 + hrvPts*0.50 + rhrPts*0.15);
    recovery = Math.min(100, Math.round(bioScore*0.80 + restPts*0.20));
  } else {
    recovery = Math.min(100, Math.round((sleepPts + restPts) / 2));
  }

  // ── Nutrition (30%) ────────────────────────────────────────────────────────
  let nutrition;
  if(!log.length) {
    nutrition = 20;
  } else {
    const calOff = macros.calories>0 ? Math.abs(consumed.calories-macros.calories)/macros.calories : 1;
    let base = calOff<=0.1?100:calOff<=0.2?80:calOff<=0.3?60:40;
    let bonus = 0;
    if(macros.protein>0 && Math.abs(consumed.protein-macros.protein)/macros.protein<=0.1) bonus+=10;
    const cOk=macros.carbs>0&&Math.abs(consumed.carbs-macros.carbs)/macros.carbs<=0.1;
    const fOk=macros.fat>0&&Math.abs(consumed.fat-macros.fat)/macros.fat<=0.1;
    const pOk=macros.protein>0&&Math.abs(consumed.protein-macros.protein)/macros.protein<=0.1;
    if(cOk&&fOk&&pOk) bonus+=5;
    nutrition = Math.min(100, base + bonus);
  }

  // ── Training (20%) ─────────────────────────────────────────────────────────
  const todayLogs = workoutLogsRaw.filter(w=>w.date===today);
  let training;
  if(todayType==="rest") {
    training = 90;
  } else if(!todayLogs.length) {
    training = 20;
  } else {
    const allDone = (todayLogs[0].workout?.exercises||[]).every(ex=>(ex.sets||[]).every(s=>s.done!==false));
    training = allDone ? 100 : 75;
  }

  // ── Consistency (10%) ──────────────────────────────────────────────────────
  const thirtyAgo = new Date(Date.now()-30*864e5);
  const recentN = workoutLogsRaw.filter(w=>new Date(w.date+"T12:00:00")>=thirtyAgo).length;
  let consistency = recentN>=25?100:recentN>=20?85:recentN>=15?70:recentN>=10?55:40;

  // ── Raw total ──────────────────────────────────────────────────────────────
  let total = Math.round(recovery*0.40 + nutrition*0.30 + training*0.20 + consistency*0.10);

  // ── Safety Thresholds ─────────────────────────────────────────────────────
  const warnings = [];
  const loggedCalories = (log||[]).reduce((s,e)=>s+(e.calories||0),0);
  const _age = Math.max(13, new Date().getFullYear()-parseInt(profile?.dobYear||2000));
  const _isFemale = profile?.sex==="female";
  const _minCal = _isFemale?1200:1500;
  const _warnCal = _isFemale?1400:1600;

  // T1 — Dangerously low calories
  if(loggedCalories>0&&loggedCalories<_minCal){
    total=Math.min(total,45);
    warnings.push({type:"low_calories_danger",icon:"⚠️",title:"Eating too little",
      message:`${loggedCalories} calories is below the safe minimum. Severe restriction reduces muscle, slows metabolism, and impairs recovery. Your score reflects this.`,
      action:"Eat more — especially protein",severity:"danger"});
  } else if(loggedCalories>0&&loggedCalories<_warnCal){
    total=Math.min(total,65);
    warnings.push({type:"low_calories_warn",icon:"⚡",title:"Calories may be too low",
      message:`${loggedCalories} calories is below what most people need to train effectively.`,
      action:"Consider eating more to fuel training",severity:"warning"});
  }

  // T2 — Chronic sleep deprivation
  const _recentSleep=healthSnap?.sleep??null;
  if(_recentSleep!==null&&_recentSleep<5){
    recovery=Math.min(recovery,25);
    warnings.push({type:"sleep_deprivation",icon:"😴",title:"Chronic sleep deprivation",
      message:`Only ${_recentSleep}h sleep. Below 5 hours significantly impairs muscle growth, fat loss, and performance. No training protocol overcomes this.`,
      action:"Sleep is the highest priority right now",severity:"danger"});
  }

  // T3 — Overtraining
  const _weekStart=new Date();
  _weekStart.setDate(_weekStart.getDate()-(_weekStart.getDay()||7)+1);
  _weekStart.setHours(0,0,0,0);
  const _weekStartStr=_weekStart.toISOString().split("T")[0];
  const _sessionsThisWeek=(workoutLogsRaw||[]).filter(w=>w.date>=_weekStartStr&&w.date<=today).length;
  if(_sessionsThisWeek>=7){
    total=Math.min(total,60);
    warnings.push({type:"overtraining",icon:"🔴",title:"No rest days this week",
      message:"Training every day without rest leads to overtraining, injury, and performance decline. Rest is when muscles actually grow.",
      action:"Take at least 1-2 rest days per week",severity:"warning"});
  }

  // T4 — Two-a-days without adequate fuel
  if(loggedCalories>0&&(macros?.calories||0)>0&&loggedCalories<(macros?.calories||0)*0.85){
    const _todayWorkouts=(workoutLogsRaw||[]).filter(w=>w.date===today);
    if(_todayWorkouts.length>=2){
      warnings.push({type:"twoADay_underfuel",icon:"⚡",title:"Under-fueling two-a-days",
        message:"Training twice today but eating below your target. Two-a-days require more fuel not less.",
        action:"Eat more on double training days",severity:"warning"});
    }
  }

  // T5 — Age-based intensity cap
  if(_age>=65) training=Math.min(training,85);

  // T6 — Eating disorder history (no calorie danger warnings)
  if(profile?.eatingHistory==="prefer_not"){
    for(let i=warnings.length-1;i>=0;i--){
      if(warnings[i].severity==="danger"||warnings[i].message.toLowerCase().includes("calorie")) warnings.splice(i,1);
    }
  }

  // T7 — Pregnancy
  if(profile?.lifeStage==="pregnant"){
    total=Math.max(total,60);
    for(let i=warnings.length-1;i>=0;i--){
      if(warnings[i].type==="low_calories_danger"||warnings[i].type==="low_calories_warn") warnings.splice(i,1);
    }
    if(loggedCalories>0) warnings.push({type:"pregnancy_info",icon:"🤰",title:"Pregnancy nutrition",
      message:"Your calorie needs are higher during pregnancy. Focus on nutrient density over restriction.",
      action:null,severity:"info"});
  }

  // Recalculate final with capped components
  const finalScore=Math.round(recovery*0.40+nutrition*0.30+training*0.20+consistency*0.10);
  total=Math.min(total,finalScore);

  // ── Suggestions ────────────────────────────────────────────────────────────
  const tips = [];
  if(recovery<70){
    if(healthSnap?.sleep!=null&&healthSnap.sleep<7) tips.push(`You got ${healthSnap.sleep}h sleep — aim for 8+ tonight to boost recovery`);
    else if(healthSnap?.hrv!=null&&healthSnap.hrv<30) tips.push(`HRV at ${healthSnap.hrv}ms — take it easy, prioritize recovery today`);
    else{const sh=SCORE_SLEEP[profile?.sleep]??65;if(sh<70)tips.push("Sleep by 10pm tonight to improve your recovery score");else tips.push("Schedule a rest day — you've trained multiple days straight");}
  }
  if(nutrition<70){
    if(!log.length) tips.push("Log your meals today to complete your nutrition score");
    else if(macros.protein>0&&consumed.protein<macros.protein*0.9) tips.push(`Hit your protein — ${Math.round(macros.protein-consumed.protein)}g remaining`);
    else if(macros.calories>0&&consumed.calories<macros.calories*0.9) tips.push(`Log dinner — ${Math.round(macros.calories-consumed.calories)} kcal remaining`);
  }
  if(training<70&&todayType!=="rest") tips.push("Complete today's training session to earn full points");
  if(consistency<70) tips.push("Log tomorrow's session to strengthen your consistency score");

  return {total, r:recovery, n:nutrition, t:training, c:consistency, tips, warnings, isCapped:total<Math.round(recovery*0.40+nutrition*0.30+training*0.20+consistency*0.10)};
}

function ScoreRing({score}) {
  const R=72; const C=2*Math.PI*R;
  const color=score>=85?"#00B894":score>=70?"#4A90E2":score>=50?"#F5A623":"#EF4444";
  const displayScore=useCountUp(score,1200);
  return (
    <div style={{position:"relative",width:180,height:180,margin:"0 auto"}}>
      <svg width={180} height={180} style={{transform:"rotate(-90deg)",display:"block"}}>
        <circle cx={90} cy={90} r={R} stroke="rgba(255,255,255,0.06)" strokeWidth={14} fill="none"/>
        <circle cx={90} cy={90} r={R} stroke={color} strokeWidth={14} fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C*(1-score/100)}
          style={{transition:"stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)"}}
        />
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:62,lineHeight:1,color:"#fff"}}>{displayScore}</div>
        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",letterSpacing:"0.18em",textTransform:"uppercase",marginTop:2}}>Coach Macro Score</div>
      </div>
    </div>
  );
}

function ScoreExplanationModal({sc, onClose}) {
  const comps=[
    {label:"Recovery",pct:40,val:sc.r,color:"#4A90E2",desc:"Based on sleep duration and quality, heart rate variability, and resting heart rate from Apple Health."},
    {label:"Nutrition",pct:30,val:sc.n,color:"#00B894",desc:"How close you hit your macro targets today. Protein adherence weighted higher."},
    {label:"Training",pct:20,val:sc.t,color:"var(--red)",desc:"Whether you completed today's scheduled session and how it compared to last week."},
    {label:"Consistency",pct:10,val:sc.c,color:"#F5A623",desc:"How many of your planned sessions you've completed over the last 30 days."},
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(6,13,26,.92)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#0A1222",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px 20px 0 0",padding:"24px 20px 48px",maxWidth:480,width:"100%",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:32,height:3,background:"rgba(255,255,255,.15)",borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{fontFamily:"var(--condensed)",fontSize:22,fontWeight:900,marginBottom:4,textAlign:"center"}}>HOW YOUR SCORE IS CALCULATED</div>
        <div style={{fontSize:11,color:"rgba(245,245,240,.4)",textAlign:"center",marginBottom:24}}>Tap anywhere to close</div>
        {comps.map(({label,pct,val,color,desc})=>(
          <div key={label} style={{marginBottom:20,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontFamily:"var(--condensed)",fontSize:17,fontWeight:800,color:"#fff"}}>{label}</div>
                <div style={{fontSize:10,color:"rgba(245,245,240,.35)",fontWeight:600}}>Weighted {pct}% of total score</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,color,lineHeight:1}}>{val}</div>
                <div style={{fontSize:9,color:"rgba(245,245,240,.3)"}}>/ 100</div>
              </div>
            </div>
            <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden",marginBottom:10}}>
              <div style={{height:"100%",width:`${val}%`,background:color,borderRadius:2,transition:"width .7s ease"}}/>
            </div>
            <div style={{fontSize:12,color:"rgba(245,245,240,.55)",lineHeight:1.6}}>{desc}</div>
          </div>
        ))}
        <div style={{background:"rgba(74,144,226,.06)",border:"1px solid rgba(74,144,226,.15)",borderRadius:12,padding:"12px 14px",marginTop:4}}>
          <div style={{fontSize:11,color:"rgba(245,245,240,.4)",lineHeight:1.7,textAlign:"center"}}>
            Score is for motivation and insight only. It is not a medical metric.<br/>
            Consult a healthcare professional for medical guidance.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PR PREDICTION ENGINE ─────────────────────────────────────────────────────

const PR_TRACKED_LIFTS = [
  {key:"bench",    label:"Bench Press",    terms:["bench press","barbell bench","flat bench","db bench","dumbbell bench","incline bench"]},
  {key:"squat",    label:"Squat",          terms:["squat"]},
  {key:"deadlift", label:"Deadlift",       terms:["deadlift","rdl","romanian deadlift"]},
  {key:"ohp",      label:"Overhead Press", terms:["overhead press","ohp","shoulder press","military press","standing press"]},
  {key:"pullup",   label:"Pull-Up",        terms:["pull-up","pull up","pullup","chin-up","chin up","chinup","weighted pull"]},
  {key:"row",      label:"Barbell Row",    terms:["barbell row","bent-over row","bent over row","bb row","pendlay row"]},
];

function epley1RM(weight, reps) {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function calcPRPredictions(workoutLogsRaw, wUnit) {
  if (!workoutLogsRaw || workoutLogsRaw.length < 2) return [];

  const exCounts = {};
  workoutLogsRaw.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      const n = (ex.name || "").trim();
      if (!n) return;
      const lower = n.toLowerCase();
      const tracked = PR_TRACKED_LIFTS.some(l => l.terms.some(t => lower.includes(t)));
      if (!tracked) exCounts[n] = (exCounts[n] || 0) + 1;
    });
  });

  const allLifts = [...PR_TRACKED_LIFTS];
  Object.entries(exCounts).forEach(([name, cnt]) => {
    if (cnt >= 5) allLifts.push({ key: name.toLowerCase().replace(/\s+/g,"_"), label: name, terms: [name.toLowerCase()], custom: true });
  });

  const sortedLogs = [...workoutLogsRaw].sort((a,b) => new Date(a.date+"T12:00:00") - new Date(b.date+"T12:00:00"));
  const liftSessions = {};
  allLifts.forEach(l => { liftSessions[l.key] = []; });

  sortedLogs.forEach(log => {
    (log.workout?.exercises || []).forEach(ex => {
      const n = (ex.name || "").toLowerCase();
      allLifts.forEach(lift => {
        if (!lift.terms.some(t => n.includes(t))) return;
        const sets = (ex.sets || []).filter(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          return w > 0 && r >= 1 && r <= 15;
        });
        if (!sets.length) return;
        const best = Math.max(...sets.map(s => epley1RM(parseFloat(s.weight), parseInt(s.reps))));
        if (best > 0) liftSessions[lift.key].push({ date: log.date, est1RM: Math.round(best) });
      });
    });
  });

  const results = [];
  allLifts.forEach(lift => {
    const sessions = liftSessions[lift.key];
    if (sessions.length < 3) return;

    const current1RM = sessions[sessions.length - 1].est1RM;
    if (current1RM <= 0) return;

    const last3 = sessions.slice(-3);
    const plateau = last3.every(s => s.est1RM <= last3[0].est1RM) && last3[0].est1RM > 0;
    const last3Max = Math.max(...last3.map(s => s.est1RM));
    const declining = current1RM < last3Max * 0.95 && last3Max > 0;

    const fourWeeksAgoStr = new Date(Date.now()-28*864e5).toISOString().split("T")[0];
    const olderSessions = sessions.filter(s => s.date <= fourWeeksAgoStr);
    let weeklyGain = 0;
    if (olderSessions.length > 0) {
      weeklyGain = (current1RM - olderSessions[olderSessions.length-1].est1RM) / 4;
    } else if (sessions.length >= 2) {
      const weeks = Math.max(0.5, (new Date(sessions[sessions.length-1].date+"T12:00:00") - new Date(sessions[0].date+"T12:00:00")) / (7*864e5));
      weeklyGain = (current1RM - sessions[0].est1RM) / weeks;
    }

    const milestones = [];
    if (weeklyGain > 0.5 && !declining) {
      const inc = current1RM >= 250 ? 25 : current1RM >= 150 ? 10 : 5;
      const base = Math.ceil(current1RM / inc) * inc;
      [base, base+inc, base+2*inc, base+3*inc].forEach(m => {
        if (m <= current1RM) return;
        const weeks = Math.round((m - current1RM) / weeklyGain);
        if (weeks >= 1 && weeks <= 52) milestones.push({ weight: m, weeks });
      });
    }

    results.push({ key: lift.key, label: lift.label, current1RM, weeklyGain, sessions, plateau, declining, milestones, custom: lift.custom || false });
  });

  return results
    .filter(r => r.milestones.length > 0 || r.plateau || r.declining)
    .sort((a,b) => {
      if (a.milestones.length && !b.milestones.length) return -1;
      if (!a.milestones.length && b.milestones.length) return 1;
      return b.sessions.length - a.sessions.length;
    });
}

function _fmtPace(minKm) {
  const m = Math.floor(minKm);
  const s = Math.round((minKm-m)*60);
  return `${m}:${String(s).padStart(2,"0")}/km`;
}
function _fmtFinish(totalMins) {
  const h = Math.floor(totalMins/60);
  const m = Math.floor(totalMins%60);
  return h > 0 ? `${h}h ${String(m).padStart(2,"0")}m` : `${m}m`;
}

function PRPredictionCard({ predictions, runActs, wPrefs, wUnit }) {
  const isRunner = wPrefs?.isHyrox || (wPrefs?.splitType||"").toLowerCase().includes("run") || (runActs?.length||0) >= 3;

  let runData = null;
  if (isRunner && runActs && runActs.length >= 2) {
    const runs = runActs.filter(a => parseFloat(a.distanceKm)>1 && parseInt(a.durationMin)>1).slice(0,10);
    if (runs.length >= 2) {
      const recent = runs.slice(0, Math.min(5,runs.length));
      const avgPace = recent.reduce((s,r) => s+(parseInt(r.durationMin)/parseFloat(r.distanceKm)),0)/recent.length;
      const older = runs.slice(-3);
      const olderPace = older.reduce((s,r) => s+(parseInt(r.durationMin)/parseFloat(r.distanceKm)),0)/older.length;
      runData = {
        avgPace,
        improving: olderPace - avgPace > 0.1,
        declining: avgPace - olderPace > 0.1,
        races: [{name:"5K",km:5},{name:"10K",km:10},{name:"Half",km:21.1},{name:"Marathon",km:42.2}].map(r=>({name:r.name,mins:avgPace*Math.pow(r.km,1.06)}))
      };
    }
  }

  const hasContent = (predictions&&predictions.length>0) || runData;
  if (!hasContent) return null;

  const unit = wUnit==="kg" ? "kg" : "lbs";
  const totalItems = (predictions?.length||0) + (runData?1:0);

  return (
    <div style={{margin:"0 20px 14px",padding:"18px 20px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:20}}>
      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:16}}>PR PREDICTIONS</div>

      {/* Strength lifts */}
      {predictions && predictions.map((pred,i)=>{
        const nextM = pred.milestones[0];
        const inc = pred.current1RM>=250?25:pred.current1RM>=150?10:5;
        const lowerBound = nextM ? nextM.weight-inc : pred.current1RM;
        const barPct = nextM ? Math.max(3,Math.min(97,Math.round(((pred.current1RM-lowerBound)/(nextM.weight-lowerBound))*100))) : 5;
        const showDivider = i < totalItems-1;
        return (
          <div key={pred.key} style={{marginBottom:showDivider?20:0,paddingBottom:showDivider?20:0,borderBottom:showDivider?"1px solid rgba(255,255,255,0.05)":"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:17,letterSpacing:.5}}>{pred.label.toUpperCase()}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:12,color:"#4A90E2",fontWeight:600}}>~{pred.current1RM} {unit} est. 1RM</div>
            </div>
            {pred.declining&&(
              <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8}}>
                <div style={{fontSize:11,color:"#EF4444",fontWeight:700,marginBottom:3}}>📉 Performance trending down</div>
                <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",lineHeight:1.6}}>Recovery may be needed — check your sleep and nutrition</div>
              </div>
            )}
            {pred.plateau&&!pred.declining&&(
              <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(245,166,35,0.07)",border:"1px solid rgba(245,166,35,0.2)",borderRadius:8}}>
                <div style={{fontSize:11,color:"#F5A623",fontWeight:700,marginBottom:3}}>⚠️ Plateau detected — 3 sessions no progress</div>
                <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",lineHeight:1.6}}>Consider a deload or technique focus</div>
              </div>
            )}
            {pred.milestones.length>0&&(
              <>
                <div style={{height:4,background:"rgba(245,245,240,0.07)",borderRadius:3,marginBottom:10,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${barPct}%`,background:"linear-gradient(90deg,#4A90E2,#00B894)",borderRadius:3,transition:"width 0.7s ease"}}/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:7}}>
                  {pred.milestones.slice(0,4).map((m,mi)=>{
                    const col = m.weeks<=4?"#00B894":m.weeks<=8?"#4A90E2":"#F5A623";
                    const bg  = m.weeks<=4?"rgba(0,184,148,0.09)":m.weeks<=8?"rgba(74,144,226,0.09)":"rgba(245,166,35,0.09)";
                    const bd  = m.weeks<=4?"rgba(0,184,148,0.28)":m.weeks<=8?"rgba(74,144,226,0.28)":"rgba(245,166,35,0.28)";
                    return (
                      <div key={mi} style={{padding:"5px 10px",background:bg,border:`1px solid ${bd}`,borderRadius:20,display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontFamily:"var(--mono)",fontSize:11,color:col,fontWeight:700}}>{m.weight} {unit}</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)"}}>— {m.weeks===1?"1 week":`${m.weeks} weeks`}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{fontSize:10,color:"rgba(245,245,240,0.28)",fontFamily:"var(--mono)"}}>Trending toward these weights based on your current progression rate</div>
              </>
            )}
          </div>
        );
      })}

      {/* Running predictions */}
      {runData&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:17,letterSpacing:.5}}>RUNNING PACE</div>
            <div style={{fontFamily:"var(--mono)",fontSize:12,color:"#4A90E2",fontWeight:600}}>{_fmtPace(runData.avgPace)} avg</div>
          </div>
          {runData.declining&&(
            <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8}}>
              <div style={{fontSize:11,color:"#EF4444",fontWeight:700,marginBottom:3}}>📉 Performance trending down</div>
              <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",lineHeight:1.6}}>Recovery may be needed — check your sleep and nutrition</div>
            </div>
          )}
          {runData.improving&&!runData.declining&&(
            <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(0,184,148,0.07)",border:"1px solid rgba(0,184,148,0.2)",borderRadius:8}}>
              <div style={{fontSize:11,color:"#00B894",fontWeight:700}}>📈 Pace improving — trending faster</div>
            </div>
          )}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:7}}>
            {runData.races.map((r,ri)=>(
              <div key={ri} style={{padding:"5px 10px",background:"rgba(74,144,226,0.09)",border:"1px solid rgba(74,144,226,0.28)",borderRadius:20,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.45)"}}>{r.name}</span>
                <span style={{fontFamily:"var(--mono)",fontSize:11,color:"#4A90E2",fontWeight:700}}>{_fmtFinish(r.mins)}</span>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"rgba(245,245,240,0.28)",fontFamily:"var(--mono)"}}>Projected finish times based on your current average pace</div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{marginTop:16,padding:"10px 12px",background:"rgba(245,245,240,0.02)",borderRadius:8,border:"1px solid rgba(245,245,240,0.04)"}}>
        <div style={{fontSize:10,color:"rgba(245,245,240,0.2)",lineHeight:1.7,fontStyle:"italic"}}>
          Projections are based on your logged training data and are estimates only. Always train within your current ability. Coach Macro projections are not training instructions.
        </div>
      </div>
    </div>
  );
}

// ─── INJURY PREVENTION ENGINE ─────────────────────────────────────────────────

const MUSCLE_MAP = {
  shoulders:      ["lateral raise","shoulder press","overhead press","ohp","front raise","rear delt","face pull","upright row","arnold press","military press","cable lateral"],
  elbows_triceps: ["tricep","skull crusher","close grip bench","pushdown","overhead tricep","french press","dips","cable push"],
  lower_back:     ["deadlift","good morning","hyperextension","back extension","rdl","romanian"],
  knees_quads:    ["squat","leg press","lunge","leg extension","step up","hack squat","goblet squat","split squat","bulgarian"],
  chest:          ["bench press","chest fly","pec deck","cable fly","dumbbell fly","push up","pushup","incline press","decline press","chest press"],
};
const MUSCLE_THRESHOLDS = { shoulders:20, elbows_triceps:22, lower_back:16, knees_quads:24, chest:22 };
const MUSCLE_LABELS     = { shoulders:"Shoulders", elbows_triceps:"Elbows/Triceps", lower_back:"Lower Back", knees_quads:"Knees/Quads", chest:"Chest" };

function calcInjuryRisks(workoutLogsRaw, profile, wPrefs, allActs, coachScore) {
  const risks = [];
  const now = new Date();
  const sevenAgo  = new Date(now - 7*864e5);
  const fourteenAgo = new Date(now - 14*864e5);

  const thisWeekLogs = (workoutLogsRaw||[]).filter(w=>new Date(w.date+"T12:00:00")>=sevenAgo);
  const lastWeekLogs = (workoutLogsRaw||[]).filter(w=>{const d=new Date(w.date+"T12:00:00");return d>=fourteenAgo&&d<sevenAgo;});

  // ── Rule 1: Muscle volume ───────────────────────────────────────────────────
  const muscleSetCounts = {};
  Object.keys(MUSCLE_MAP).forEach(m=>{muscleSetCounts[m]=0;});
  thisWeekLogs.forEach(log=>{
    (log.workout?.exercises||[]).forEach(ex=>{
      const n=(ex.name||"").toLowerCase();
      const nSets=(ex.sets||[]).length;
      if(!nSets)return;
      Object.entries(MUSCLE_MAP).forEach(([muscle,kws])=>{
        if(kws.some(kw=>n.includes(kw))) muscleSetCounts[muscle]+=nSets;
      });
    });
  });
  Object.entries(MUSCLE_THRESHOLDS).forEach(([muscle,threshold])=>{
    const count=muscleSetCounts[muscle]||0;
    if(count===0)return;
    if(count>threshold){
      const over=count-threshold;
      risks.push({
        id:`muscle_${muscle}`,
        level:count>threshold*1.3?"high":"moderate",
        area:MUSCLE_LABELS[muscle],
        message:`You've trained ${MUSCLE_LABELS[muscle].toLowerCase()} ${count} sets this week. Research shows injury risk increases above ${threshold} sets for most athletes.`,
        recommendation:`Recommended: Skip ${MUSCLE_LABELS[muscle].toLowerCase()} isolation work tomorrow. You can still train other muscle groups.`,
        sets:count, threshold, pct:count/threshold,
      });
    } else if(count>threshold*0.8){
      risks.push({
        id:`muscle_${muscle}_monitor`,
        level:"low",
        area:MUSCLE_LABELS[muscle],
        message:`${MUSCLE_LABELS[muscle]} at ${count}/${threshold} sets this week — approaching the safe limit.`,
        recommendation:"Monitor volume in the next session.",
        sets:count, threshold, pct:count/threshold,
      });
    }
  });

  // ── Rule 2: Consecutive training days ──────────────────────────────────────
  const loggedDates=new Set((workoutLogsRaw||[]).map(w=>w.date));
  let consecutive=0;
  for(let i=0;i<14;i++){
    const ds=new Date(now-i*864e5).toISOString().split("T")[0];
    if(loggedDates.has(ds))consecutive++;else break;
  }
  if(consecutive>=6){
    risks.push({id:"consecutive_6",level:"high",area:"Recovery",
      message:`You've trained ${consecutive} consecutive days without rest. Overuse injury risk is significantly elevated.`,
      recommendation:"Strong recommendation: Take a rest day today. Elite athletes require at least 1–2 rest days per week.",
      sets:consecutive,threshold:6,pct:1.0});
  } else if(consecutive>=4){
    risks.push({id:"consecutive_4",level:"moderate",area:"Recovery",
      message:`${consecutive} consecutive training days. Recovery becomes limited after 3–4 days straight.`,
      recommendation:"Recommended: Schedule a rest or active recovery day within the next 24 hours.",
      sets:consecutive,threshold:4,pct:consecutive/6});
  }

  // ── Rule 3: Volume spike ───────────────────────────────────────────────────
  function countSets(logs){return logs.reduce((s,l)=>s+(l.workout?.exercises||[]).reduce((ss,ex)=>ss+(ex.sets||[]).length,0),0);}
  const thisSets=countSets(thisWeekLogs);
  const lastSets=countSets(lastWeekLogs);
  if(lastSets>5&&thisSets>0){
    const spike=(thisSets-lastSets)/lastSets;
    if(spike>=0.25){
      risks.push({id:"volume_spike",level:spike>=0.5?"high":"moderate",area:"Total Volume",
        message:`Training volume up ${Math.round(spike*100)}% this week (${thisSets} vs ${lastSets} sets). Too much too soon is the #1 cause of overuse injuries.`,
        recommendation:"Recommended: Reduce the number of sets in your next 1–2 sessions to let adaptation catch up.",
        sets:thisSets,threshold:Math.round(lastSets*1.25),pct:Math.min(1.5,thisSets/(lastSets*1.25))});
    }
  }

  // ── Rule 4: Running mileage spike ─────────────────────────────────────────
  if(allActs&&allActs.length>0){
    const runs=(a)=>(a.type||"").toLowerCase().includes("run")&&parseFloat(a.distanceKm)>0.5;
    const thisKm=(allActs.filter(a=>runs(a)&&new Date(a.date)>=sevenAgo)).reduce((s,r)=>s+parseFloat(r.distanceKm||0),0);
    const lastKm=(allActs.filter(a=>{const d=new Date(a.date);return runs(a)&&d>=fourteenAgo&&d<sevenAgo;})).reduce((s,r)=>s+parseFloat(r.distanceKm||0),0);
    if(lastKm>3&&thisKm>0&&(thisKm-lastKm)/lastKm>0.1){
      const pct=Math.round(((thisKm-lastKm)/lastKm)*100);
      risks.push({id:"run_spike",level:pct>=25?"high":"moderate",area:"Running Volume",
        message:`Running mileage up ${pct}% this week (${thisKm.toFixed(1)} km vs ${lastKm.toFixed(1)} km last week). The 10% rule exists to prevent stress fractures.`,
        recommendation:"Recommended: Keep weekly mileage increases to 10% or less. Reduce tomorrow's run distance.",
        sets:Math.round(thisKm*10)/10,threshold:Math.round(lastKm*1.1*10)/10,pct:Math.min(1.5,thisKm/(lastKm*1.1))});
    }
  }

  // ── Rule 5: Training through fatigue ──────────────────────────────────────
  const sleepHrs=SLEEP_MAP[profile?.sleep]??7;
  if((sleepHrs<5||(coachScore?.total!=null&&coachScore.total<40))&&thisWeekLogs.length>0){
    const why=[];
    if(sleepHrs<5)why.push(`sleep under 5 hours (${sleepHrs}h logged)`);
    if(coachScore?.total!=null&&coachScore.total<40)why.push(`Coach Macro Score at ${coachScore.total}`);
    risks.push({id:"fatigue_flag",level:"moderate",area:"Fatigue",
      message:`Training under elevated fatigue: ${why.join(" and ")}. Injury risk increases when training fatigued.`,
      recommendation:"Recommended: Reduce intensity today. Consider a lighter session or active recovery.",
      sets:0,threshold:0,pct:0.7});
  }

  // ── Rule 6: Known injury history ──────────────────────────────────────────
  const injuries=(wPrefs?.injuries||[]).filter(Boolean).map(i=>(i||"").toLowerCase());
  if(injuries.some(i=>i.includes("knee")||i.includes("quad")||i.includes("patella"))){
    const k=muscleSetCounts.knees_quads||0;
    const t=MUSCLE_THRESHOLDS.knees_quads;
    if(k>t*0.65&&!risks.find(r=>r.id==="muscle_knees_quads"))
      risks.push({id:"injury_knee",level:k>t?"high":"moderate",area:"Knee (History)",
        message:`Knee issues in your history. You've done ${k} leg/quad sets this week${k>t?" — above the safe limit":" — approaching the limit"}.`,
        recommendation:"Recommended: Substitute high-impact leg work for leg press or hamstring-focused exercises.",
        sets:k,threshold:t,pct:k/t});
  }
  if(injuries.some(i=>i.includes("shoulder")||i.includes("rotator")||i.includes("cuff"))){
    const pv=(muscleSetCounts.shoulders||0)+(muscleSetCounts.chest||0);
    if(pv>20&&!risks.find(r=>r.id==="muscle_shoulders"))
      risks.push({id:"injury_shoulder",level:pv>32?"high":"moderate",area:"Shoulder (History)",
        message:`Shoulder history detected. Combined pressing volume: ${pv} sets this week. Pressing above 20+ sets can aggravate shoulder issues.`,
        recommendation:"Recommended: Focus on pulling movements. Avoid overhead pressing until pressing volume decreases.",
        sets:pv,threshold:20,pct:Math.min(1.5,pv/20)});
  }
  if(injuries.some(i=>i.includes("back")||i.includes("spine")||i.includes("disc")||i.includes("lumbar"))){
    const b=muscleSetCounts.lower_back||0;
    const t=MUSCLE_THRESHOLDS.lower_back;
    if(b>t*0.6&&!risks.find(r=>r.id==="muscle_lower_back"))
      risks.push({id:"injury_back",level:b>t?"high":"moderate",area:"Lower Back (History)",
        message:`Back issues in your history. You've done ${b} lower back sets this week${b>t?" — exceeding the safe limit":" — approaching the limit"}.`,
        recommendation:"Recommended: Avoid heavy deadlifts and bent-over rows. Try Romanian deadlifts at reduced weight.",
        sets:b,threshold:t,pct:b/t});
  }

  const priorityOrder={high:0,moderate:1,low:2};
  risks.sort((a,b)=>priorityOrder[a.level]-priorityOrder[b.level]);
  return {risks, muscleSetCounts};
}

function InjuryAlertCard({risks, onAdapt, onDismiss}) {
  if(!risks||risks.length===0)return null;
  const top=risks[0];
  const LC={
    high:    {label:"🔴 HIGH RISK",    color:"#EF4444",bg:"rgba(239,68,68,0.06)",  border:"rgba(239,68,68,0.28)",  left:"#EF4444"},
    moderate:{label:"🟠 MODERATE RISK",color:"#F97316",bg:"rgba(249,115,22,0.06)", border:"rgba(249,115,22,0.28)", left:"#F97316"},
    low:     {label:"🟡 LOW RISK",     color:"#F5A623",bg:"rgba(245,166,35,0.06)",  border:"rgba(245,166,35,0.28)",  left:"#F5A623"},
  };
  const lc=LC[top.level]||LC.low;
  return (
    <div style={{margin:"0 20px 14px",padding:"16px 18px",background:lc.bg,border:`1px solid ${lc.border}`,borderLeft:`3px solid ${lc.left}`,borderRadius:"4px 14px 14px 4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        <span style={{fontSize:14}}>⚠️</span>
        <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.16em",color:lc.color,textTransform:"uppercase",fontWeight:700}}>INJURY PREVENTION ALERT</div>
        <div style={{marginLeft:"auto",padding:"2px 8px",background:`${lc.color}15`,border:`1px solid ${lc.color}40`,borderRadius:4,fontFamily:"var(--mono)",fontSize:9,color:lc.color,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:700,whiteSpace:"nowrap"}}>{lc.label}</div>
      </div>
      <div style={{fontSize:13,color:"rgba(245,245,240,0.8)",lineHeight:1.65,marginBottom:10}}>{top.message}</div>
      {top.recommendation&&(
        <div style={{padding:"8px 12px",background:"rgba(245,245,240,0.04)",borderRadius:8,border:"1px solid rgba(245,245,240,0.06)",marginBottom:12}}>
          <div style={{fontSize:9,color:lc.color,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Recommended Action</div>
          <div style={{fontSize:12,color:"rgba(245,245,240,0.65)",lineHeight:1.65}}>{top.recommendation}</div>
        </div>
      )}
      {risks.length>1&&(
        <div style={{marginBottom:12,padding:"5px 10px",background:"rgba(245,245,240,0.02)",borderRadius:6,border:"1px solid rgba(245,245,240,0.04)"}}>
          <span style={{fontSize:10,color:"rgba(245,245,240,0.3)",fontFamily:"var(--mono)"}}>
            +{risks.length-1} more risk{risks.length>2?"s":""} detected: {risks.slice(1).map(r=>r.area).join(", ")}
          </span>
        </div>
      )}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={onAdapt} style={{flex:2,padding:"11px 8px",background:lc.left,border:"none",borderRadius:10,color:"#fff",fontFamily:"var(--condensed)",fontWeight:800,fontSize:12,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>Adjust Tomorrow's Session</button>
        <button onClick={onDismiss} style={{flex:1,padding:"11px",background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRadius:10,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",fontSize:11,cursor:"pointer"}}>Got It</button>
      </div>
      <div style={{fontSize:10,color:"rgba(245,245,240,0.2)",lineHeight:1.7,fontStyle:"italic"}}>
        Injury alerts are informational only and based on general training principles. They are not medical advice. Consult a healthcare professional for any pain or injury concerns.
      </div>
    </div>
  );
}

function InjuryRiskReport({risks, muscleSetCounts}) {
  const hasSets=Object.values(muscleSetCounts||{}).some(v=>v>0);
  if(!hasSets&&(!risks||risks.length===0))return null;
  const overallLevel=risks?.some(r=>r.level==="high")?"HIGH":risks?.some(r=>r.level==="moderate")?"MODERATE":"LOW";
  const LC={HIGH:"#EF4444",MODERATE:"#F97316",LOW:"#00B894"};
  const mostAtRisk=risks&&risks.length>0?risks[0]:null;
  return (
    <div style={{margin:"0 20px 14px",padding:"16px 18px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase"}}>Injury Risk This Week</div>
        <div style={{padding:"3px 10px",background:`${LC[overallLevel]}12`,border:`1px solid ${LC[overallLevel]}35`,borderRadius:6,fontFamily:"var(--mono)",fontSize:9,color:LC[overallLevel],fontWeight:700,letterSpacing:"0.1em"}}>{overallLevel}</div>
      </div>
      {mostAtRisk&&mostAtRisk.threshold>0&&(
        <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",marginBottom:10}}>
          Most at-risk: <span style={{color:"#fff",fontWeight:600}}>{mostAtRisk.area}</span>
          <span style={{color:"rgba(245,245,240,0.3)"}}> · {mostAtRisk.sets}/{mostAtRisk.threshold} sets</span>
        </div>
      )}
      {Object.entries(MUSCLE_THRESHOLDS).map(([muscle,threshold])=>{
        const sets=(muscleSetCounts||{})[muscle]||0;
        const pct=Math.min(1,sets/threshold);
        const barColor=pct>=1?"#EF4444":pct>=0.8?"#F97316":pct>=0.6?"#F5A623":"#00B894";
        return (
          <div key={muscle} style={{marginBottom:7}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.45)",letterSpacing:"0.06em"}}>{MUSCLE_LABELS[muscle]}</span>
              <span style={{fontFamily:"var(--mono)",fontSize:10,color:pct>=0.8?barColor:"rgba(245,245,240,0.3)"}}>{sets}/{threshold}</span>
            </div>
            <div style={{height:3,background:"rgba(245,245,240,0.07)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${pct*100}%`,background:barColor,borderRadius:2,transition:"width 0.6s"}}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AppleHealthModal({onConnect, onDismiss}) {
  const [connecting, setConnecting] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  async function handleConnect() {
    setConnecting(true);setPermDenied(false);
    const ok = await initAppleHealth();
    setConnecting(false);
    if(ok){onConnect(true);}
    else{setPermDenied(true);}
  }
  const isNative = typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.() === true;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9000,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{width:"100%",maxWidth:480,background:"var(--navy-card)",borderRadius:"20px 20px 0 0",padding:"28px 24px 40px",border:"1px solid var(--white-border)"}}>
        <div style={{width:40,height:4,borderRadius:2,background:"rgba(245,245,240,0.15)",margin:"0 auto 24px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,69,58,0.12)",border:"1px solid rgba(255,69,58,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" fill="#FF453A"/></svg>
          </div>
          <div>
            <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontStyle:"italic",fontSize:22,textTransform:"uppercase",lineHeight:1}}>Connect Apple Health</div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--white-dim)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:3}}>Personalize with real data</div>
          </div>
        </div>
        <div style={{marginBottom:20,display:"flex",flexDirection:"column",gap:8}}>
          {[["Sleep","Adjust training intensity based on last night's sleep"],["HRV & Heart Rate","Real-time recovery scoring using biometric data"],["Steps","Earn calorie adjustments for daily activity"],["Workouts","Auto-save sessions and sync active calories"]].map(([title,desc])=>(
            <div key={title} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 12px",background:"rgba(245,245,240,0.03)",borderRadius:10,border:"1px solid rgba(245,245,240,0.06)"}}>
              <div style={{color:"var(--green)",marginTop:2,flexShrink:0}}>
                <svg width={14} height={14} viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <div style={{fontFamily:"var(--condensed)",fontWeight:700,fontSize:13,textTransform:"uppercase",letterSpacing:"0.04em"}}>{title}</div>
                <div style={{fontFamily:"var(--body)",fontSize:11,color:"var(--white-dim)",marginTop:1,lineHeight:1.45}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        {permDenied&&(
          <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.3)",borderRadius:12,padding:"12px 14px",marginBottom:12,fontSize:12,color:"#f87171",lineHeight:1.55}}>
            Apple Health access denied. To enable:<br/>
            <strong style={{color:"#fff"}}>Settings → Privacy & Security → Health → Coach Macro</strong>
          </div>
        )}
        {isNative
          ? <button onClick={handleConnect} disabled={connecting} style={{width:"100%",padding:"15px",background:connecting?"rgba(245,245,240,0.08)":"#FF453A",color:connecting?"var(--white-dim)":"white",border:"none",borderRadius:14,fontFamily:"var(--condensed)",fontWeight:800,fontSize:15,letterSpacing:"0.1em",textTransform:"uppercase",cursor:connecting?"default":"pointer",marginBottom:12}}>
              {connecting?"Requesting Access...":permDenied?"Try Again →":"Connect Apple Health →"}
            </button>
          : <div style={{textAlign:"center",padding:"12px",background:"rgba(245,245,240,0.04)",borderRadius:12,marginBottom:12,fontFamily:"var(--body)",fontSize:12,color:"var(--white-dim)",lineHeight:1.5}}>Apple Health is available when you install the app on your iPhone.</div>
        }
        <button onClick={onDismiss} style={{width:"100%",padding:"12px",background:"transparent",color:"var(--white-dim)",border:"none",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Not Now</button>
      </div>
    </div>
  );
}

export function App({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,onEarnedCals,onSignOut,user}) {
  const [section,setSection]=useState("home"); // home | train | fuel | progress | settings
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
  const [logMode,setLogMode]=useState("search");
  const [barcodeInput,setBarcodeInput]=useState("");
  const [barcodeResult,setBarcodeResult]=useState(null);
  const [barcodeLoading,setBarcodeLoading]=useState(false);
  const [quickFields,setQF]=useState({name:"",calories:"",protein:"",carbs:"",fat:""});
  const [recs,setRecs]=useState(""); const [recsLoading,setRecsLoading]=useState(false);
  const [recipes,setRecipes]=useState(""); const [recipesLoading,setRecipesLoading]=useState(false);
  const [fastProto,setFastProto]=useState(profile?.fasting && profile.fasting!=="no" ? profile.fasting : "16:8");
  const [fastActive,setFastActive]=useState(false);
  const [fastStart,setFastStart]=useState(null);
  const [fastCustomH,setFastCustomH]=useState(16);
  const [now,setNow]=useState(Date.now());
  const [city,setCity]=useState(profile.city||"");
  const [workout,setWorkout]=useState(""); const [workoutLoading,setWorkoutLoading]=useState(false);
  const [dashboardLoaded,setDashboardLoaded]=useState(false);
  const [workoutsLoaded,setWorkoutsLoaded]=useState(false);
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [restTimer,setRestTimer]=useState(0); const [restActive,setRestActive]=useState(false);
  const restInterval=useRef(null);
  const [history,setHistory]=useState({});
  const [workoutLogsRaw,setWorkoutLogsRaw]=useState([]);
  const [deloadActive,setDeloadActive]=useState(profile?.deload_active||false);
  const [deloadStartedAt,setDeloadStartedAt]=useState(profile?.deload_started_at||null);
  const [deloadSnooze,setDeloadSnooze]=useState(()=>localStorage.getItem("deload_snooze")||null);
  const [dailyScores,setDailyScores]=useState(()=>(profile?.daily_scores||[]).slice(-90));
  const [scoreMilestones,setScoreMilestones]=useState(()=>profile?.score_milestones||[]);
  const [activeMilestone,setActiveMilestone]=useState(null);
  const [showScoreModal,setShowScoreModal]=useState(false);
  const [dismissedWarnings,setDismissedWarnings]=useState(()=>{try{return JSON.parse(localStorage.getItem("dismissed_score_warnings")||"{}");}catch{return{};}});
  const [waterLogs,setWaterLogs]=useState([]);
  const [waterHistory,setWaterHistory]=useState([]);
  const [comebackDismissed,setComebackDismissed]=useState(()=>localStorage.getItem("comeback_dismissed")===new Date().toISOString().split("T")[0]);
  const [planMode,setPlanMode]=useState("strength");
  const [runPlan,setRunPlan]=useState(()=>wPrefs?.runPlan||"Couch to 5K");
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
  const [showPhotoLogger,setShowPhotoLogger]=useState(false);
  const [workoutSavedMsg,setWorkoutSavedMsg]=useState("");
  const [toasts,setToasts]=useState([]);
  const [morningBrief,setMorningBrief]=useState(null);
  const [morningBriefLoading,setMorningBriefLoading]=useState(false);
  const [briefDismissed,setBriefDismissed]=useState(()=>localStorage.getItem("brief_dismissed")===new Date().toISOString().split("T")[0]);
  const [briefTrigger,setBriefTrigger]=useState(0);

  // ── Biological Algorithm ───────────────────────────────────────────────────
  const [bioInsights,setBioInsights]=useState({});
  const [bioDataCounts,setBioDataCounts]=useState({});
  const [bioScreen,setBioScreen]=useState(false);

  // ── Predictive Performance Engine ─────────────────────────────────────────
  const [sessionPrediction,setSessionPrediction]=useState(null);
  const [weeklyForecast,setWeeklyForecast]=useState([]);
  const [goalTrajectories,setGoalTrajectories]=useState({strength:null,bodyComp:null,running:null});

  // ── Metabolic Adaptation Intelligence ─────────────────────────────────────
  const [metabolicAdaptation,setMetabolicAdaptation]=useState(null);
  const [showAdaptationModal,setShowAdaptationModal]=useState(false);
  const [adaptationChecking,setAdaptationChecking]=useState(false);

  // ── Life-Aware Training — Calendar ────────────────────────────────────────
  const [calendarConnected,setCalendarConnected]=useState(()=>localStorage.getItem("calendar_connected")==="1");
  const [calendarAlerts,setCalendarAlerts]=useState([]);
  const [travelAdvice,setTravelAdvice]=useState(null);
  const [showCalendarPrompt,setShowCalendarPrompt]=useState(false);
  const [dismissedAlerts,setDismissedAlerts]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem("dismissed_cal_alerts")||"[]"));}catch{return new Set();}});

  // ── Offline detection ─────────────────────────────────────────────────────
  const [isOnline,setIsOnline]=useState(()=>typeof navigator!=="undefined"?navigator.onLine:true);
  useEffect(()=>{
    const goOnline=()=>setIsOnline(true);
    const goOffline=()=>setIsOnline(false);
    window.addEventListener("online",goOnline);
    window.addEventListener("offline",goOffline);
    return()=>{window.removeEventListener("online",goOnline);window.removeEventListener("offline",goOffline);};
  },[]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const [isRefreshing,setIsRefreshing]=useState(false);
  const pullStartY=useRef(null);
  const appScreenRef=useRef(null);

  async function refreshData(){
    if(!user||isRefreshing)return;
    setIsRefreshing(true);
    hap?.();
    const today=new Date().toISOString().split("T")[0];
    await Promise.allSettled([
      sb.from("food_logs").select("entries").eq("user_id",user.id).eq("date",logDate).maybeSingle()
        .then(({data})=>{if(data?.entries)setLog(data.entries);}),
      getWaterLogs(user.id,today).then(logs=>setWaterLogs(logs||[])),
      getWaterHistory(user.id,7).then(hist=>setWaterHistory(hist||[])),
      sb.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(50)
        .then(({data})=>{
          if(data?.length){
            setWorkoutLogsRaw(data);
            const hist={};
            data.forEach(w=>{
              (w.workout?.exercises||w.entry?.exercises||[]).forEach(ex=>{
                const k=ex.name.toLowerCase().replace(/\s+/g,"_");
                if(!hist[k])hist[k]=[];
                hist[k].push({date:w.date||w.logged_at,sets:ex.sets});
              });
            });
            setHistory(hist);
          }
        }),
    ]);
    setIsRefreshing(false);
  }

  function onPullStart(e){
    if(appScreenRef.current?.scrollTop===0) pullStartY.current=e.touches[0].clientY;
  }
  function onPullEnd(e){
    if(pullStartY.current===null)return;
    const delta=e.changedTouches[0].clientY-pullStartY.current;
    pullStartY.current=null;
    if(delta>80)refreshData();
  }

  // ── Apple Health ───────────────────────────────────────────────────────────
  const [healthSnap,setHealthSnap]=useState(null);
  const [healthConnected,setHealthConnected]=useState(false);
  const [showHealthModal,setShowHealthModal]=useState(false);
  const healthDismissCount=useRef(parseInt(localStorage.getItem("health_modal_dismiss")||"0"));

  useEffect(()=>{
    return subscribeToast(ev=>{
      if(ev.event==="add") setToasts(t=>[...t,ev.toast]);
      if(ev.event==="remove") setToasts(t=>t.filter(x=>x.id!==ev.id));
    });
  },[]);

  useEffect(()=>{
    const isNative=typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()===true;
    async function loadHealth(){
      if(!isNative) return; // Apple Health is iOS only — never prompt on web
      const authorized=await checkAppleHealthAuthorized();
      if(!authorized){
        if(healthDismissCount.current<3)setShowHealthModal(true);
        return;
      }
      setHealthConnected(true);
      const snap=await getDailyHealthSnapshot();
      setHealthSnap(snap);
    }
    loadHealth();
  },[]);

  async function handleHealthConnect(authorized){
    setShowHealthModal(false);
    if(authorized){
      setHealthConnected(true);
      const snap=await getDailyHealthSnapshot();
      setHealthSnap(snap);
    }
  }

  function dismissHealthModal(){
    const next=healthDismissCount.current+1;
    healthDismissCount.current=next;
    localStorage.setItem("health_modal_dismiss",String(next));
    setShowHealthModal(false);
  }

  // ── Food log date navigation ───────────────────────────────────────────────
  const [logDate,setLogDate]=useState(()=>new Date().toISOString().split("T")[0]);

  // ── Bodyweight logs ────────────────────────────────────────────────────────
  const [bodyweightLogs,setBodyweightLogs]=useState([]);

  // ── Workout coaching state ─────────────────────────────────────────────────
  const [lastLoggedSet,setLastLoggedSet]=useState(null);
  const [setFlash,setSetFlash]=useState(null);
  const [workoutStartTime,setWorkoutStartTime]=useState(null);
  const [workoutSummary,setWorkoutSummary]=useState(null);
  const notifTimeoutRef=useRef(null);

  useEffect(()=>{
    if(activeWorkout&&!workoutStartTime)setWorkoutStartTime(Date.now());
    if(!activeWorkout&&!workoutSummary)setWorkoutStartTime(null);
  },[activeWorkout]);

  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);

  // ── Persist food log: single row per day, entries = full jsonb array ────────
  async function saveFoodLog(uid,entries){
    const today=new Date().toISOString().split("T")[0];
    const {error}=await sb.from("food_logs")
      .upsert({user_id:uid,date:today,entries},{onConflict:"user_id,date"});
    if(error)console.error("[saveFoodLog] error:",error.message,error.code);
    else console.log("[saveFoodLog] saved",entries.length,"entries");
  }

  function handlePhotoLog(entries){
    const newLog=[...entries,...log];
    setLog(newLog);
    if(user){
      saveFoodLog(user.id,newLog);
      const totals=entries.reduce((a,e)=>({calories:a.calories+e.calories,protein:a.protein+e.protein}),{calories:0,protein:0});
      track(EVENTS.FOOD_LOGGED,{method:"photo",calories:totals.calories,protein:totals.protein,items:entries.length},user.id);
    }
    setShowPhotoLogger(false);
    setFuelScreen("home");
  }

  // Load food log for selected date (re-runs when logDate or user changes)
  useEffect(()=>{
    if(!user)return;
    setLog([]);
    sb.from("food_logs").select("entries").eq("user_id",user.id).eq("date",logDate).maybeSingle().then(({data})=>{
      if(data?.entries)setLog(data.entries);
    });
  },[user,logDate]);

  // Load workout history + bodyweight + water on mount
  useEffect(()=>{
    if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    // Workout history — last 50 sessions
    sb.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(50).then(({data,error})=>{
      console.log("[loadWorkoutHistory] rows:",data?.length||0,"error:",error?.message);
      if(data&&data.length>0){
        setWorkoutLogsRaw(data);
        const hist={};
        data.forEach(w=>{
          const exercises=w.workout?.exercises||w.entry?.exercises||[];
          exercises.forEach(ex=>{
            const k=ex.name.toLowerCase().replace(/\s+/g,"_");
            if(!hist[k])hist[k]=[];
            hist[k].push({date:w.date||w.logged_at,sets:ex.sets});
          });
        });
        setHistory(hist);
      }
      setWorkoutsLoaded(true);
    });
    // Bodyweight logs — last 90 days
    sb.from("bodyweight_logs").select("date,weight").eq("user_id",user.id).order("date",{ascending:true}).limit(90).then(({data})=>{
      if(data&&data.length>0)setBodyweightLogs(data);
    });
    // Water logs
    getWaterLogs(user.id,today).then(logs=>setWaterLogs(logs||[]));
    getWaterHistory(user.id,7).then(hist=>setWaterHistory(hist||[]));
    // Injury logs
    getInjuryLogs(user.id).then(logs=>setInjuryLogs(logs||[])).catch(()=>{});
    // ACWR risks — recalculate weekly
    const lastRiskCheck=localStorage.getItem("acwr_last_check");
    const shouldCheckRisk=!lastRiskCheck||(Date.now()-parseInt(lastRiskCheck))>7*864e5;
    if(shouldCheckRisk&&profile){
      calculateAllRisks(user.id,profile).then(risks=>{
        localStorage.setItem("acwr_last_check",String(Date.now()));
        setAcwrRisks(risks||{});
      }).catch(()=>{});
    }
    // Biological Algorithm — load insights and data point counts
    Promise.all([getInsights(user.id),getDataPointCounts(user.id)]).then(([ins,cnts])=>{
      setBioInsights(ins||{});setBioDataCounts(cnts||{});
      // Predictive Performance Engine — load with bio insights for personalization
      Promise.all([
        generateWeeklyForecast(user.id,ins||{},schedule,null),
        calculateGoalTrajectories(user.id,profile||{}),
      ]).then(([forecast,trajectories])=>{
        setWeeklyForecast(forecast||[]);
        setGoalTrajectories(trajectories||{strength:null,bodyComp:null,running:null});
      }).catch(()=>{});
    }).catch(()=>{});
    // Mark dashboard as loaded after data arrives
    setTimeout(()=>setDashboardLoaded(true),300);

    // Metabolic Adaptation — load existing active/detected, then run weekly check
    getActiveAdaptation(user.id).then(existing=>{
      if(existing)setMetabolicAdaptation(existing);
    }).catch(()=>{});
    const lastCheck=localStorage.getItem("ma_last_check");
    const shouldCheck=!lastCheck||(Date.now()-parseInt(lastCheck))>7*864e5;
    if(shouldCheck&&profile){
      setAdaptationChecking(true);
      detectMetabolicAdaptation(user.id,profile).then(async plateau=>{
        localStorage.setItem("ma_last_check",String(Date.now()));
        setAdaptationChecking(false);
        if(!plateau)return;
        // Already have an active protocol? Don't re-detect
        const existing=await getActiveAdaptation(user.id);
        if(existing)return;
        // Generate protocol (phases computed locally, AI explanation async)
        const phases=buildProtocolPhases(plateau);
        const saved=await saveDetectedAdaptation(user.id,plateau,{phases,explanation:"",estimatedWeeklyLoss:phases.estimatedWeeklyLoss});
        if(saved)setMetabolicAdaptation(saved);
        // Enrich with AI explanation in background
        generateAdaptationProtocol(plateau,profile).then(({explanation,phases:p})=>{
          const enriched={...saved,protocol:{phases:p,explanation,estimatedWeeklyLoss:p.estimatedWeeklyLoss}};
          setMetabolicAdaptation(enriched);
          sb.from("metabolic_adaptations").update({protocol:enriched.protocol}).eq("id",saved.id).catch(()=>{});
        }).catch(()=>{});
      }).catch(()=>{setAdaptationChecking(false);});
    }
  },[user]);

  // ── Calendar — load and analyze events each day ───────────────────────────
  useEffect(()=>{
    if(!calendarConnected||!user)return;
    const lastScan=localStorage.getItem("calendar_last_scan");
    const today=new Date().toISOString().split("T")[0];
    if(lastScan===today)return; // already scanned today
    async function loadCalendar(){
      try{
        const authorized=await checkCalendarAuthorized();
        if(!authorized){localStorage.removeItem("calendar_connected");setCalendarConnected(false);return;}
        const events=await getUpcomingEvents(14);
        localStorage.setItem("calendar_last_scan",today);
        const calPrefs=wPrefs?.calendarPrefs||{};
        const alerts=analyzeScheduleForTraining(events,schedule,calPrefs);
        // Filter already dismissed
        const visible=alerts.filter(a=>!dismissedAlerts.has(a.id));
        setCalendarAlerts(visible);
        // Travel nutrition — check for travel today or tomorrow
        const travelEv=events.find(e=>e.type==="travel"&&(
          e.startDate.split("T")[0]===today||
          e.startDate.split("T")[0]===new Date(Date.now()+864e5).toISOString().split("T")[0]
        ));
        if(travelEv){
          const advice=await generateTravelNutritionAdvice(travelEv,profile);
          setTravelAdvice(advice);
        }
      }catch(e){console.error("[calendar]",e);}
    }
    loadCalendar();
  },[calendarConnected,user,schedule]);

  async function generateTravelNutritionAdvice(travelEvent,prof){
    if(!prof)return null;
    try{
      const {ai:callAI}=await import("./client.js");
      const dateLabel=new Date(travelEvent.startDate).toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
      const text=await callAI(
        `A Coach Macro user is traveling on ${dateLabel} (event: "${travelEvent.title}").
Profile: goal=${prof.goal}, calories=${prof.goalCals}/day, protein target=${Math.round((prof.goalCals||2000)*0.3/4)}g.

Write a brief travel day nutrition game plan (under 150 words):
1. Pre-travel breakfast tip (protein-heavy)
2. Best airport/travel food option (real chain name, specific order, approximate calories + protein)
3. What to avoid and why
4. Macro adjustment note (travel = lower activity = slightly fewer carbs)

Be specific and practical. Empathetic tone. No fluff.`,
        600,"travel_nutrition");
      return{text,dateLabel,event:travelEvent.title};
    }catch{return null;}
  }

  async function handleConnectCalendar(){
    const authorized=await requestCalendarAccess();
    if(authorized){
      localStorage.setItem("calendar_connected","1");
      setCalendarConnected(true);
      setShowCalendarPrompt(false);
      showToast("Calendar connected — workouts will adapt around your schedule");
    }else{
      showToast("Calendar access denied. Enable in Settings → Coach Macro → Calendar.",{duration:5000});
    }
  }

  function handleDisconnectCalendar(){
    localStorage.removeItem("calendar_connected");
    localStorage.removeItem("calendar_last_scan");
    setCalendarConnected(false);
    setCalendarAlerts([]);
    setTravelAdvice(null);
  }

  function handleDismissAlert(alertId){
    const next=new Set(dismissedAlerts);
    next.add(alertId);
    setDismissedAlerts(next);
    localStorage.setItem("dismissed_cal_alerts",JSON.stringify([...next]));
    setCalendarAlerts(prev=>prev.filter(a=>a.id!==alertId));
  }

  function handleCalendarAction(alert,suggestion){
    switch(suggestion.action){
      case "swap_to_hotel_workout":{
        const hotel=buildHotelWorkout(todayFocus);
        setActiveWorkout(hotel);
        setTrainScreen("active");
        setSection("train");
        showToast("Hotel gym session loaded — let's go 🏨","success");
        break;
      }
      case "reschedule":{
        showToast(`Noted — moving session to ${suggestion.data?.altDay||"another day"}. Adjust your schedule in Train → Program.`,"info",{duration:5000});
        break;
      }
      case "skip":{
        showToast("Got it — rest day scheduled instead.","info");
        break;
      }
      case "reduce_volume_this_week":{
        const next={...wPrefs,lighterWeek:true,lighterWeekDate:new Date().toISOString().split("T")[0]};
        setWPrefs(next);
        if(user)sb.from("profiles").upsert({id:user.id,wprefs:next},{onConflict:"id"}).catch(()=>{});
        showToast("Lighter week applied — 20% fewer sets this week 💪","success",{duration:5000});
        break;
      }
      case "schedule_in_free_time":{
        setSection("train");
        showToast("Head to Train to start your session!","success");
        break;
      }
    }
  }

  // ── Session Prediction — compute when entering active session ─────────────
  useEffect(()=>{
    if(trainScreen!=="active"||!user)return;
    async function buildPrediction(){
      try{
        const adherence=await calcNutritionAdherence7d(user.id);
        const{data:lastLog}=await sb.from("workout_logs").select("date").eq("user_id",user.id).order("date",{ascending:false}).limit(1);
        const lastDate=lastLog?.[0]?.date;
        const recoveryDays=lastDate?Math.max(0,Math.floor((Date.now()-new Date(lastDate+"T12:00:00"))/864e5)):2;
        const readinessTierToStress=t=>{
          if(!t)return 3;
          const s={excellent:1,good:2,train:3,reduce:4,rest:5};
          return typeof t==="string"?s[t]||3:t;
        };
        const prob=calculatePRProbability({
          sleepHours:healthSnap?.sleep??null,
          hrv:healthSnap?.hrv??null,
          recoveryDaysSinceLast:recoveryDays,
          nutritionAdherence:adherence,
          stressLevel:readinessTierToStress(activeWorkout?.readinessTier),
          mesocycleWeek:wPrefs?.mesocycleWeek||2,
          currentHour:new Date().getHours(),
        },bioInsights);
        const factors=[
          {label:"Sleep",ok:healthSnap?.sleep!=null?(healthSnap.sleep>=7?true:healthSnap.sleep>=6?null:false):null},
          {label:"Recovery",ok:recoveryDays>=2?true:recoveryDays===1?null:false},
          {label:"Nutrition",ok:adherence>=0.8?true:adherence>=0.5?null:false},
          {label:"HRV",ok:healthSnap?.hrv!=null?(healthSnap.hrv>=50?true:healthSnap.hrv>=35?null:false):null},
          {label:"Stress",ok:readinessTierToStress(activeWorkout?.readinessTier)<=2?true:readinessTierToStress(activeWorkout?.readinessTier)<=3?null:false},
        ].filter(f=>f.ok!==null);
        setSessionPrediction({probability:prob,factors});
      }catch{setSessionPrediction(null);}
    }
    buildPrediction();
  },[trainScreen,user,activeWorkout?.readinessTier]);

  // ── Morning Brief ───────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!user||wPrefs.morningBriefEnabled===false)return;
    const todayDate=new Date().toISOString().split("T")[0];
    const hour=new Date().getHours();
    if(briefTrigger===0&&hour>=12)return;
    if(briefTrigger===0&&briefDismissed)return;
    const cachedDate=localStorage.getItem("brief_date");
    const cachedBrief=localStorage.getItem("brief_content");
    if(briefTrigger===0&&cachedDate===todayDate&&cachedBrief){setMorningBrief(cachedBrief);return;}
    setMorningBriefLoading(true);setMorningBrief(null);
    (async()=>{
      const cutoff=new Date();cutoff.setDate(cutoff.getDate()-30);
      const{data:fLogs}=await sb.from("food_logs").select("date,entries").eq("user_id",user.id).gte("date",cutoff.toISOString().split("T")[0]).order("date",{ascending:false});
      let streak=0;
      const chk=new Date();chk.setDate(chk.getDate()-1);
      const foodDates=new Set((fLogs||[]).filter(f=>f.entries?.length>0).map(f=>f.date));
      while(foodDates.has(chk.toISOString().split("T")[0])){streak++;chk.setDate(chk.getDate()-1);}
      if(foodDates.has(todayDate))streak++;
      const{data:wLog}=await sb.from("workout_logs").select("date,workout").eq("user_id",user.id).order("date",{ascending:false}).limit(1).maybeSingle();
      const lastSession=wLog?`${wLog.workout?.focus||"Workout"} on ${new Date(wLog.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"})}`:"No recent session logged";
      const sleepMap={u5:4.5,"5-6":5.5,"6-7":6.5,"7-8":7.5,"8+":8.5};
      const sleepAvg=sleepMap[profile?.sleep]||7;
      const startD=profile?.startDate?new Date(profile.startDate):new Date();
      const weekNum=Math.floor(Math.max(0,(new Date()-startD)/86400000)/7)+1;
      const cMacros=getDayMacros(profile.goalCals,profile.goal,schedule[getTodayKey()]||"training",0);
      const prompt=`You are a world-class personal trainer and nutritionist texting your athlete their morning briefing.\n\nAthlete data:\n- Name: ${profile.name}\n- Today: ${dayFocus[getTodayKey()]||"Training"} day — Week ${weekNum} of ${wPrefs.splitType||"training"}\n- Last session: ${lastSession}\n- Today's macros: ${cMacros.calories}kcal, ${cMacros.protein}g protein, ${cMacros.carbs}g carbs, ${cMacros.fat}g fat\n- Current streak: ${streak} days\n- Recent sleep: ${sleepAvg} hours average\n\nWrite a brief morning message (4-6 lines max) that:\n1. States today's training focus and one specific target\n2. Gives today's macro targets\n3. Suggests a first meal that fits the macros\n4. One motivational line based on their streak or recent performance\n\nWrite like a coach texting — direct, specific, no fluff. Not a formal notification. A real message from someone who knows them.`;
      try{
        await streamAI(prompt,400,"morning_brief",
          (partial)=>{setMorningBrief(partial);},
          (full)=>{setMorningBrief(full);localStorage.setItem("brief_date",todayDate);localStorage.setItem("brief_content",full);setMorningBriefLoading(false);if(user)track(EVENTS.AI_MORNING_BRIEF,{chars:full.length},user.id);}
        );
      }catch(e){console.error("[morningBrief] error:",e);const m=getAIErrorMessage(e);if(m)setMorningBrief("⚠️ "+m);setMorningBriefLoading(false);}
    })();
  },[user,wPrefs.morningBriefEnabled,briefTrigger]);

  function previewMorningBrief(){
    localStorage.removeItem("brief_dismissed");
    setBriefDismissed(false);
    setMorningBrief(null);
    setBriefTrigger(t=>t+1);
    setSection("fuel");
  }

  const todayKey=getTodayKey();
  const todayType=schedule[todayKey]||"rest";
  const todayFocus=dayFocus[todayKey]||"Rest";
  const cfg=DAY_CFG[todayType]||DAY_CFG.rest;

  const allActs=[
    ...stravaActs.map(a=>({id:`st-${a.id}`,type:a.sport_type||"Workout",icon:{Run:"🏃",Ride:"🚴",Swim:"🏊",Walk:"🚶",WeightTraining:"💪",CrossFit:"🏋️"}[a.sport_type]||"💪",date:a.start_date_local,durationMin:Math.round((a.moving_time||0)/60),distanceKm:((a.distance||0)/1000).toFixed(2),calories:Math.round(a.calories||0),title:a.name,avgHR:a.average_heartrate||"",source:"Strava",sourceIcon:"🟠"})),
    ...ahActs,...garminActs,...fitbitActs
  ].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const todayActs=allActs.filter(a=>isToday(a.date));
  const earnedCals=todayActs.reduce((s,a)=>s+a.calories,0)+stepsToCalorieBonus(healthSnap?.steps);
  // ── Nutrition Periodization ─────────────────────────────────────────────────
  const _startD=profile?.startDate?new Date(profile.startDate):new Date();
  const _daysSince=Math.max(0,Math.floor((new Date()-_startD)/86400000));
  const programWeek=Math.floor(_daysSince/7)+1;
  const cycleWeek=((programWeek-1)%8)+1;
  const PERIO_PHASES=[null,
    {phase:"Building",   wks:"1–3", cal:+200, carbPct:.50, protMult:1.0, note:"Building phase — fuel muscle growth"},
    {phase:"Building",   wks:"1–3", cal:+200, carbPct:.50, protMult:1.0, note:"Building phase — fuel muscle growth"},
    {phase:"Building",   wks:"1–3", cal:+200, carbPct:.50, protMult:1.0, note:"Building phase — fuel muscle growth"},
    {phase:"Deload",     wks:"4",   cal:-150, carbPct:.40, protMult:1.0, note:"Deload week — body resets and recovers"},
    {phase:"Performance",wks:"5–7", cal:0,    carbPct:null,protMult:1.1, note:"Performance phase — carbs fuel training"},
    {phase:"Performance",wks:"5–7", cal:0,    carbPct:null,protMult:1.1, note:"Performance phase — carbs fuel training"},
    {phase:"Performance",wks:"5–7", cal:0,    carbPct:null,protMult:1.1, note:"Performance phase — carbs fuel training"},
    {phase:"Mini Cut",   wks:"8",   cal:-400, carbPct:.35, protMult:1.2, note:"Mini cut — shed any fat gained this cycle"},
  ];
  const _phase=PERIO_PHASES[cycleWeek];
  const _baseTDEE=profile?.baseTDEE||profile?.goalCals||2000;
  const _wLbs=profile?.wUnit==="kg"?(parseFloat(profile?.weight||70)*2.205):parseFloat(profile?.weight||160);
  const _bodyweightKg=profile?.wUnit==="lbs"?parseFloat(profile?.weight||160)*0.4536:parseFloat(profile?.weight||70);
  const periodizationInfo=_phase?{phase:_phase.phase,wks:_phase.wks,cycleWeek,note:_phase.note}:null;

  // Day-type specific nutrition (uses active workout exercises when available)
  const _profileWithDeload={...profile,deloadActive};
  const todayDayType=getDayType(todayType,activeWorkout,_profileWithDeload);
  const dayNutrition=getDayTypeNutrition(profile.goalCals||_baseTDEE,_bodyweightKg,todayDayType,_profileWithDeload);
  const weekMacros=useMemo(()=>getWeekNutrition(schedule,profile.goalCals||_baseTDEE,_bodyweightKg,_profileWithDeload),[schedule,profile.goalCals,_bodyweightKg,profile.goal,deloadActive]);

  let macros;
  if(wPrefs.nutritionPeriodization&&_phase){
    const adjCals=Math.max(1200,Math.round(_baseTDEE+_phase.cal)+earnedCals);
    const protG=Math.round(_wLbs*(_phase.protMult||1.0));
    const carbPct=_phase.carbPct===null?(todayType==="training"?.48:.32):_phase.carbPct;
    const carbG=Math.round((adjCals*carbPct)/4);
    const fatG=Math.max(30,Math.round((adjCals-protG*4-carbG*4)/9));
    macros={calories:adjCals,protein:protG,carbs:carbG,fat:fatG,isFlexDay:false};
  }else{
    const flexOpts={weekendFlexMode:wPrefs.weekendFlexMode||false,flexDays:wPrefs.flexDays||["Sat","Sun"],flexCalorieIncrease:wPrefs.flexCalorieIncrease||20,todayKey};
    const isFlexDay=flexOpts.weekendFlexMode&&flexOpts.flexDays.includes(todayKey);
    if(isFlexDay){
      macros=getDayMacros(profile.goalCals,profile.goal,todayType,earnedCals,flexOpts);
    }else{
      // Day-type specific nutrition path
      let baseCals=dayNutrition.calories+earnedCals;
      let flexDeficit=0;
      if(flexOpts.weekendFlexMode&&flexOpts.flexDays.length>0){
        const bonusPerFlexDay=Math.round((profile.goalCals||_baseTDEE)*(flexOpts.flexCalorieIncrease/100));
        flexDeficit=Math.round((bonusPerFlexDay*flexOpts.flexDays.length)/Math.max(1,7-flexOpts.flexDays.length));
        baseCals=Math.max(1200,baseCals-flexDeficit);
      }
      macros={calories:baseCals,protein:dayNutrition.protein,carbs:dayNutrition.carbs,fat:dayNutrition.fat,isFlexDay:false,flexDeficit};
    }
  }
  const consumed=log.reduce((a,i)=>({calories:a.calories+i.calories,protein:a.protein+i.protein,carbs:a.carbs+i.carbs,fat:a.fat+i.fat}),{calories:0,protein:0,carbs:0,fat:0});
  const remaining={calories:macros.calories-consumed.calories,protein:macros.protein-consumed.protein,carbs:macros.carbs-consumed.carbs,fat:macros.fat-consumed.fat};

  // ── Water tracking ──────────────────────────────────────────────────────────
  const waterTarget=getDailyWaterTarget(_profileWithDeload,todayDayType);
  const waterLoggedOz=waterLogs.reduce((s,l)=>s+Number(l.amount_oz),0);
  const hydrationBonus=getHydrationBonus(waterLoggedOz,waterTarget);

  async function handleAddWater(oz){
    const today=new Date().toISOString().split("T")[0];
    const log2=await addWaterLog(user.id,oz,today);
    if(log2){setWaterLogs(prev=>[...prev,log2]);track(EVENTS.WATER_LOGGED,{oz},user.id);}
  }
  async function handleDeleteWater(id){
    await deleteWaterLog(id);
    setWaterLogs(prev=>prev.filter(l=>l.id!==id));
  }

  // ── Comeback Protocol ────────────────────────────────────────────────────────
  const lastWorkoutDate=workoutLogsRaw.length>0?workoutLogsRaw[0].date:null;
  const daysSinceWorkout=lastWorkoutDate?Math.floor((new Date()-new Date(lastWorkoutDate+"T12:00:00"))/86400000):null;
  const showComebackProtocol=daysSinceWorkout>=7&&!comebackDismissed&&workoutLogsRaw.length>0;

  const fasting=FASTING_PROTOCOLS.find(p=>p.id===fastProto)||FASTING_PROTOCOLS[0];
  const fastHours=fastProto==="custom"?fastCustomH:fasting.fast;
  const fastElapsed=fastActive&&fastStart?(now-fastStart)/3600000:0;
  const fastPct=Math.min(fastElapsed/fastHours,1);
  const fastRemaining=fastActive?Math.max(0,(fastHours*3600000)-(now-fastStart)):fastHours*3600000;
  const eatOpen=fastActive&&fastElapsed>=fastHours;

  function getRestDuration(tier,repsStr,exRestSecs){
    const reps=parseInt(repsStr)||10;
    if(exRestSecs&&exRestSecs!==90&&exRestSecs!==120)return{secs:exRestSecs,reason:`${Math.round(exRestSecs/60)} min rest`};
    if(tier==="A"&&reps<=5)return{secs:180,reason:"3 min rest — heavy compound"};
    if(tier==="A"&&reps<=12)return{secs:120,reason:"2 min rest — compound work"};
    if(tier==="B"&&reps<=8)return{secs:120,reason:"2 min rest — secondary compound"};
    if(tier==="C")return{secs:60,reason:"60 sec rest — isolation"};
    return{secs:90,reason:"90 sec rest"};
  }

  function scheduleRestNotification(secs){
    clearTimeout(notifTimeoutRef.current);
    if(typeof window==="undefined"||!window.Notification)return;
    const doSchedule=()=>{
      notifTimeoutRef.current=setTimeout(()=>{
        if(document.hidden)new window.Notification("Rest Complete",{body:"Time for your next set 💪",tag:"rest-timer"});
      },secs*1000);
    };
    if(window.Notification.permission==="granted")doSchedule();
    else if(window.Notification.permission!=="denied")window.Notification.requestPermission().then(p=>{if(p==="granted")doSchedule();});
  }

  function startRest(secs){
    clearTimeout(notifTimeoutRef.current);
    clearInterval(restInterval.current);setRestTimer(secs);setRestActive(true);
    scheduleRestNotification(secs);
    restInterval.current=setInterval(()=>setRestTimer(prev=>{if(prev<=1){clearInterval(restInterval.current);setRestActive(false);hap();return 0;}if(prev===11)hap();return prev-1;}),1000);
  }

  function skipRest(){
    clearTimeout(notifTimeoutRef.current);
    clearInterval(restInterval.current);setRestActive(false);setRestTimer(0);setLastLoggedSet(null);
  }

  function adjustRest(delta){
    setRestTimer(prev=>{
      const nv=Math.max(5,prev+delta);
      clearTimeout(notifTimeoutRef.current);scheduleRestNotification(nv);
      return nv;
    });
  }

  useEffect(()=>()=>{clearInterval(restInterval.current);clearTimeout(notifTimeoutRef.current);},[]);

  async function aiLog(){
    if(!foodInput.trim())return;setLogging(true);setLogMsg("");
    try{
      const raw=await ai(`Estimate macros for: "${foodInput}". Reply ONLY valid JSON no markdown: {"food":"short name","calories":0,"protein":0,"carbs":0,"fat":0}`);
      const p=JSON.parse(raw.trim());
      const entry={...p,id:Date.now(),method:"ai"};
      const newLog=[entry,...log];
      setLog(newLog);
      setLogMsg(`✓ ${p.food} — ${p.calories} kcal`);
      setFoodInput("");
      if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"ai",calories:p.calories,protein:p.protein},user.id);}
    }
    catch(e){console.error("[aiLog] error:",e);const m=getAIErrorMessage(e);if(m)setLogMsg("⚠️ "+m);}
    setLogging(false);
  }
  async function scanBarcode(code){
    const barcode=(code||barcodeInput).trim();
    if(!barcode)return null;
    setBarcodeLoading(true);setBarcodeResult(null);
    const result=await lookupBarcode(barcode);setBarcodeResult(result);setBarcodeLoading(false);
    return result;
  }
  function addBarcode(){if(!barcodeResult)return;const entry={...barcodeResult,id:Date.now(),method:"barcode"};const newLog=[entry,...log];setLog(newLog);if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"barcode",calories:barcodeResult.calories,protein:barcodeResult.protein},user.id);}setBarcodeResult(null);setBarcodeInput("");setLogMsg(`✓ ${barcodeResult.name} added`);}
  function addQuick(){if(!quickFields.calories)return;const entry={food:quickFields.name||"Entry",calories:parseInt(quickFields.calories)||0,protein:parseInt(quickFields.protein)||0,carbs:parseInt(quickFields.carbs)||0,fat:parseInt(quickFields.fat)||0,id:Date.now(),method:"quick"};const newLog=[entry,...log];setLog(newLog);if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"quick",calories:entry.calories,protein:entry.protein},user.id);}setQF({name:"",calories:"",protein:"",carbs:"",fat:""});}
  function removeLog(id){const newLog=log.filter(i=>i.id!==id);setLog(newLog);if(user)saveFoodLog(user.id,newLog);}
  function logEntry(entry){const newLog=[{...entry,id:Date.now(),method:"memory"},...log];setLog(newLog);if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"memory",calories:entry.calories,protein:entry.protein},user.id);}}

  async function fetchRecs(){
    setRecsLoading(true);setRecs("…");
    const actCtx=todayActs.length>0?`\nToday's activity: ${todayActs.map(a=>`${a.type} (${a.calories} kcal via ${a.source})`).join(", ")}\n`:"";
    const dietaryCtx=(profile.dietary||[]).filter(d=>d!=="none");
    try{
      await streamAI(`You are a precision nutrition coach. The user is in ${city||"their city"} and needs to hit these EXACT remaining macros:\n- Calories: ${remaining.calories} kcal\n- Protein: ${remaining.protein}g\n- Carbs: ${remaining.carbs}g\n- Fat: ${remaining.fat}g\nGoal: ${profile.goal}. Training day: ${todayType}.${dietaryCtx.length>0?" DIETARY RESTRICTIONS (strictly avoid): "+dietaryCtx.join(", ")+".":""}\n\nProvide exactly 3 restaurant meal options using REAL menu items from chains available in ${city||"the US"} (e.g. Chick-fil-A, Chipotle, Subway, McDonald's, Wingstop, Raising Cane's, Panera, Wendy's, Taco Bell). For each option:\n• Restaurant name\n• Exact order with customizations ("no sauce", "extra protein", "double meat")\n• Macros: calories / protein / carbs / fat\n• How close it gets to their remaining targets\n\nThen 1 quick home meal option.\n\nBe SPECIFIC. Use real menu item names. Show exact macro numbers.`,900,"restaurant_ai",
        (partial)=>{setRecs(partial);},
        (full)=>{setRecsLoading(false);setRecs(full);if(user)track(EVENTS.AI_RESTAURANT,{city,chars:full.length},user.id);}
      );
    }catch(e){console.error("[fetchRecs] error:",e);const m=getAIErrorMessage(e);if(m)setRecs("⚠️ "+m+" Tap 'Get Recommendations' to retry.");if(user)trackError(e,"restaurant_ai",user.id);setRecsLoading(false);}
  }

  async function fetchRecipes(){
    setRecipesLoading(true);setRecipes("");
    const recipeDietCtx=(profile.dietary||[]).filter(d=>d!=="none");
    const recipeCondCtx=(profile.conditions||[]).filter(c=>c!=="none");
    try{const txt=await ai(`Remaining macros I need to hit:\n- Calories: ${remaining.calories} kcal\n- Protein: ${remaining.protein}g\n- Carbs: ${remaining.carbs}g\n- Fat: ${remaining.fat}g\nGoal: ${profile.goal} · Day: ${todayType}${recipeDietCtx.length>0?". Dietary restrictions: "+recipeDietCtx.join(", "):""}${recipeCondCtx.length>0?". Health conditions: "+recipeCondCtx.join(", "):""}\n\nGive 3 simple home recipes. Each: name, ingredients (max 6 with amounts), steps (max 5), macro breakdown, prep time. Easy to cook. Hit the protein and calorie targets.`,900);setRecipes(txt);}
    catch(e){console.error("[fetchRecipes] error:",e);const m=getAIErrorMessage(e);if(m)setRecipes("⚠️ "+m+" Tap 'Get Recipes' to retry.");}setRecipesLoading(false);
  }

  async function generateWorkout(type="lifting",split="",runPlan="",hybridTemplate=""){
    setWorkoutLoading(true);setWorkout("");
    const coverage=MUSCLE_COVERAGE[todayFocus]||"Full coverage of all muscles";
    const actCtx=todayActs.length>0?`\nNOTE: Already completed: ${todayActs.map(a=>`${a.type} (${a.calories} kcal)`).join(", ")}. Adjust accordingly.`:"";
    const healthItems=[...(profile.conditions||[]).filter(c=>c!=="none"),...(wPrefs.injuries||[]).filter(Boolean)];
    const healthCtx=healthItems.length>0?` | HEALTH: ${healthItems.join(", ")} — modify exercises accordingly`:"";
    const sessionLen=wPrefs.sessionLength||45;
    const deloadCtx=deloadActive?"\n⚠️ DELOAD WEEK: 60% of normal weight, 12–15 reps, remove maximal effort sets. Recovery focus only.":"";
    const prompt=todayType==="rest"
      ?`REST DAY recovery for ${profile.goal} athlete. Mobility, stretching, foam rolling, recovery nutrition. Equipment: ${wPrefs.equipment}. Clear sections.`
      :`Complete ${todayFocus} session.\nATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Split: ${wPrefs.splitType} | Exp: ${profile.liftExp||"intermediate"} | Session: ${sessionLen}min${healthCtx}${actCtx}${deloadCtx}\nMUSCLE COVERAGE: ${coverage}\nFORMAT: Exercise | Sets×Reps | Rest | Form cue | Overload note\n1.Warm-up 2.Heavy compounds 3.Secondary 4.Isolation (ALL sub-muscles) 5.Finisher/Core${planMode==="hybrid"&&hybridMix.run?"\n═══ RUN BLOCK ═══\nType / Distance / Pace zone":""  }${planMode==="hybrid"&&hybridMix.hyrox||planMode==="hyrox"?`\n═══ HYROX ═══\n${todayType==="cardio"?"8 stations + 1km runs":"3-4 station finisher <20min"}`:""}\nSpecific. Clear headers. No fluff.`;
    try{const txt=await ai(prompt,1000);setWorkout(txt);}catch(e){console.error("[generateWorkout] AI error:",e);const m=getAIErrorMessage(e);if(m)setWorkout("⚠️ "+m+" Tap 'Build Workout' to retry.");}setWorkoutLoading(false);
  }

  async function startStructured(splitName="",runPlanName="",hybridName=""){
    setWorkoutLoading(true);
    try{
      const splitInfo=splitName?`Training split: ${splitName}.`:`Training split: ${wPrefs.splitType}.`;
      const runInfo=runPlanName?`Run plan: ${runPlanName}.`:"";
      const hybridInfo=hybridName?`Hybrid template: ${hybridName}.`:"";
      const focus=FOCUS_MUSCLES[todayFocus]||"full body movements";
      const structHealthItems=[...(profile.conditions||[]).filter(c=>c!=="none"),...(wPrefs.injuries||[]).filter(Boolean)];
      const structHealthCtx=structHealthItems.length>0?` | HEALTH: ${structHealthItems.join(", ")} — avoid contraindicated movements`:"";
      const structSessionLen=wPrefs.sessionLength||45;
      const exCount=structSessionLen<=30?"3-4":structSessionLen<=45?"4-5":structSessionLen<=60?"5-6":"6-8";
      const structDeloadCtx=deloadActive?"\n⚠️ DELOAD WEEK — use 12-15 reps on all exercises, 3 sets max per exercise, no PRs, technique focus.":"";
      const raw=await ai(`Build a structured ${todayFocus} workout session.
ATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Experience: ${profile.liftExp||"intermediate"} | Session: ${structSessionLen}min${structHealthCtx}${structDeloadCtx}
${splitInfo}${runInfo}${hybridInfo}
MUSCLES TO COVER: ${focus}

Return ONLY valid JSON, no markdown, no explanation:
{"title":"${todayFocus}","exercises":[{"name":"Exercise Name","sets":[{"reps":10,"weight":0,"done":false},{"reps":10,"weight":0,"done":false},{"reps":10,"weight":0,"done":false}],"restSecs":120,"notes":"Which muscle head this targets + key form cue"}]}

Rules:
- ${exCount} exercises total
- Warm-up set first for compounds (lighter weight, higher reps)
- Cover EVERY muscle head listed above
- restSecs: 180 for heavy compounds, 120 for secondary, 60 for isolation
- Start weight at 0 (user will fill in their weight)${deloadActive?"\n- DELOAD: reps 12-15, sets 2-3, notes must include 'Deload — form + blood flow'":""}`,800);
      const cleaned=raw.trim().replace(/^[^{]*/,"").replace(/[^}]*$/,"");
      const parsed=JSON.parse(cleaned);
      // Apply deload modifications: cap sets, set higher reps, add note
      if(deloadActive){
        parsed.exercises=parsed.exercises.map(ex=>({
          ...ex,
          notes:"Deload — focus on form and blood flow. "+(ex.notes||""),
          sets:ex.sets.slice(0,Math.max(2,Math.ceil(ex.sets.length*0.6))).map(s=>({...s,reps:typeof s.reps==="number"?13:"12-15"})),
        }));
      }
      setActiveWorkout(parsed);setTrainScreen("active");
    }catch(e){
      console.error("[startStructured] AI error — falling back to hardcoded program:",e);
      try{
        const daysPerWeek=Object.values(schedule).filter(v=>v==="training").length||3;
        const startD=new Date(profile?.startDate||Date.now());
        const dayIdx=Math.floor((new Date()-startD)/(24*60*60*1000))%(daysPerWeek||1);
        const exs=getWorkoutForDay(daysPerWeek,wPrefs.splitType||"Full Body",dayIdx,wPrefs.equipment||"Full Gym");
        if(exs&&exs.length){
          setActiveWorkout({title:todayFocus,exercises:exs.map(ex=>({name:ex.name,notes:ex.notes||"",restSecs:120,sets:Array.from({length:Number(ex.sets)||3},()=>({reps:String(ex.reps||10),weight:"",done:false}))}))});
          setTrainScreen("active");
        }else{
          setWorkout("⚠️ AI unavailable. Use the Today tab → Start Workout to begin.");
        }
      }catch(fe){setWorkout("⚠️ AI unavailable. Use the Today tab → Start Workout to begin.");}
    }
    setWorkoutLoading(false);
  }

  function logSet(ei,si,reps,weight){
    setActiveWorkout(prev=>{if(!prev)return prev;const u={...prev};u.exercises=prev.exercises.map((ex,i)=>i!==ei?ex:{...ex,sets:ex.sets.map((s,j)=>j!==si?s:{...s,reps,weight,done:true})});return u;});
    const ex=activeWorkout?.exercises[ei];
    const{secs,reason}=getRestDuration(ex?.tier,reps,ex?.restSecs);

    // History lookup for PR detection
    const k=(ex?.name||"").toLowerCase().replace(/\s+/g,"_");
    const prevHistory=history[k];
    const prevLast=prevHistory?.[prevHistory.length-1];
    const prevBestWeight=prevLast?Math.max(...prevLast.sets.map(s=>parseFloat(s.weight)||0)):null;
    const isNewPR=prevBestWeight!=null&&parseFloat(weight)>prevBestWeight;

    // Rep completion
    const sets=ex?.sets||[];
    const targetReps=sets[si]?.reps;
    const targetNum=parseInt(targetReps)||0;
    const completedNum=parseInt(reps)||0;
    const missedCount=targetNum>0&&completedNum<targetNum?targetNum-completedNum:0;
    const hitAllReps=missedCount===0;

    // Next set context
    const doneSets=sets.filter(s=>s.done).length+1;
    const totalSets=sets.length;
    const nextSet=si+1<totalSets?sets[si+1]:null;
    let suggestWeight=null;
    if(nextSet&&!nextSet.done&&hitAllReps){
      const w=parseFloat(weight)||0;
      suggestWeight=ex?.tier==="A"?String(Math.round((w+5)/2.5)*2.5):String(Math.round((w+2.5)*2)/2);
    }

    setLastLoggedSet({
      exerciseName:ex?.name,
      setIndex:si,
      totalSets,
      doneSets:Math.min(doneSets,totalSets),
      reps,weight,targetReps,
      prevBestWeight,
      prevBestDate:prevLast?new Date(prevLast.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}):null,
      isNewPR,missedCount,hitAllReps,
      restSecs:secs,restReason:reason,
      nextSetIndex:si+1,
      nextSetReps:nextSet?.reps,
      nextSetWeight:nextSet?.weight||weight,
      suggestWeight,
    });

    const flashType=isNewPR?"pr":missedCount>0?"missed":"complete";
    setSetFlash({type:flashType,reps,targetReps,missedCount});
    setTimeout(()=>setSetFlash(null),1400);

    startRest(secs);
    hap();
    if(isNewPR){
      hapPR();
      showToast(`🔥 New PR — ${weight}lbs on ${ex?.name||"this exercise"}!`, "pr", {duration:5000});
    }

    // Persist workout state for resume
    try { localStorage.setItem("cm_active_workout", JSON.stringify({...activeWorkout, ts: Date.now()})); } catch {}
  }

  async function finishWorkout(){
    if(activeWorkout){
      const nh={...history};
      const setsLogged=[];
      const prs=[];
      let totalVolume=0;
      const totalSets=activeWorkout.exercises.reduce((a,e)=>a+(e.sets?.length||0),0);

      activeWorkout.exercises.forEach(ex=>{
        const k=ex.name.toLowerCase().replace(/\s+/g,"_");
        const done=ex.sets.filter(s=>s.done);
        if(done.length>0){
          if(!nh[k])nh[k]=[];
          nh[k]=[...nh[k],{date:new Date().toISOString(),sets:done}];
          setsLogged.push({name:ex.name,sets:done});
          done.forEach(s=>{totalVolume+=(parseFloat(s.weight)||0)*(parseInt(s.reps)||0);});
          // PR detection
          const prevH=history[k];
          if(prevH?.length){
            const prevMax=Math.max(...prevH.flatMap(sess=>sess.sets.map(s=>parseFloat(s.weight)||0)));
            const sessionMax=Math.max(...done.map(s=>parseFloat(s.weight)||0));
            if(sessionMax>prevMax)prs.push({name:ex.name,weight:sessionMax,reps:done.find(s=>parseFloat(s.weight)===sessionMax)?.reps});
          }
        }
      });
      setHistory(nh);

      const duration=workoutStartTime?Math.max(1,Math.round((Date.now()-workoutStartTime)/60000)):45;
      const burn=todayType==="training"?Math.round(duration*6):Math.round(duration*11);
      if(onEarnedCals)onEarnedCals(burn);

      // Save to Apple Health if connected
      if(healthConnected){
        try{const{saveWorkoutToHealth}=await import("./services/appleHealth.js");await saveWorkoutToHealth({durationMinutes:duration,activeCalories:burn});}catch{}
      }

      if(user){
        try{
          const feedbackData=activeWorkout.exercises.filter(ex=>ex.feedback).map(ex=>({name:ex.name,feedback:ex.feedback}));
          await sb.from("workout_logs").insert({
            user_id:user.id,
            date:new Date().toISOString().split("T")[0],
            workout:{focus:todayFocus,exercises:setsLogged,calories_burned:burn,type:todayType,readinessTier:activeWorkout.readinessTier||null,exerciseFeedback:feedbackData}
          });
          console.log("[finishWorkout] saved",setsLogged.length,"exercises to Supabase");
        }catch(e){console.error("[finishWorkout] save error:",e);}
      }

      // Show summary screen instead of immediately exiting
      setActiveWorkout(null);
      skipRest();
      try { localStorage.removeItem("cm_active_workout"); } catch {}
      const totalSetsLogged = setsLogged.reduce((a,e)=>a+e.sets.length,0);
      if(prs.length>0){
        hapPR();
        showToast(`🔥 ${prs.length} new PR${prs.length>1?"s":""} this session!`, "pr", {duration:5000});
      } else {
        hapSuccess();
        showToast(`Session saved · ${totalSetsLogged} sets logged`, "success", {duration:4000});
      }
      if(user)track(EVENTS.WORKOUT_COMPLETED,{
        program:wPrefs?.splitType,focus:todayFocus,
        duration_minutes:duration,sets_completed:totalSetsLogged,sets_planned:totalSets,
        had_pr:prs.length>0,total_volume:Math.round(totalVolume),
      },user.id);

      // Biological Algorithm — record data points from this session
      if(user){
        const perfScore=calcPerformanceScore(activeWorkout.exercises,history);
        // Prediction accuracy tracking
        if(sessionPrediction?.probability!=null){
          trackPredictionOutcome(user.id,sessionPrediction.probability,perfScore).catch(()=>{});
        }
        recordWorkoutBioData(user.id,{
          sleepHours:healthSnap?.sleep??null,
          readinessTier:activeWorkout.readinessTier||null,
          workoutStartTime,
          performanceScore:perfScore,
          exercises:activeWorkout.exercises||[],
        }).then(()=>{
          // Refresh insights after recording
          Promise.all([getInsights(user.id),getDataPointCounts(user.id)]).then(([ins,cnts])=>{
            setBioInsights(ins||{});setBioDataCounts(cnts||{});
          }).catch(()=>{});
        }).catch(()=>{});
      }

      // Priority 7: notification permission after first workout
      const isNative=typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()===true;
      if(isNative&&!localStorage.getItem("first_workout_done")){
        localStorage.setItem("first_workout_done","1");
        try{const{requestNotificationPermission}=await import("./services/notifications.js");await requestNotificationPermission();}catch{}
      }

      // Priority 8: app rating after 5th workout
      const workoutCount=(workoutLogsRaw.length||0)+1;
      if(isNative&&workoutCount>=5&&!localStorage.getItem("rating_prompt_shown")){
        localStorage.setItem("rating_prompt_shown","1");
        try{const m=await import(/* @vite-ignore */ "@capacitor-community/in-app-review");await(m.InAppReview||m.AppReview)?.requestReview?.();}catch{}
      }

      setWorkoutSummary({
        title:todayFocus,duration,burn,
        totalVolume:Math.round(totalVolume),
        totalSets,completedSets:totalSetsLogged,
        prs,exercises:setsLogged,
      });
    } else {
      setActiveWorkout(null);
      try { localStorage.removeItem("cm_active_workout"); } catch {}
      setTrainScreen("progress");
    }
  }

  function clearWorkoutSummary(){
    setWorkoutSummary(null);
    setWorkoutStartTime(null);
    setTrainScreen("progress");
  }

  async function startDeload(){
    const now=new Date().toISOString();
    setDeloadActive(true);setDeloadStartedAt(now);
    if(user){
      try{await sb.from("profiles").upsert({
        id:user.id,
        profile_data:{...profile,deload_active:true,deload_started_at:now,last_deload_at:now},
        deload_active:true,deload_started_at:now,last_deload_at:now,
        updated_at:now
      },{onConflict:"id"});}catch(e){console.error("[startDeload]",e);}
    }
  }

  // ── Metabolic Adaptation handlers ─────────────────────────────────────────
  async function handleStartMetabolicProtocol(){
    if(!metabolicAdaptation||!user)return;
    const phases=metabolicAdaptation.protocol?.phases;
    if(!phases?.phase1?.calories)return;
    // Update profile goalCals to phase 1 calories
    const newCals=phases.phase1.calories;
    try{
      await sb.from("profiles").upsert({id:user.id,goalCals:newCals,updated_at:new Date().toISOString()},{onConflict:"id"});
      await startMetabolicProtocol(metabolicAdaptation.id);
      const updated={...metabolicAdaptation,status:"active",started_at:new Date().toISOString()};
      setMetabolicAdaptation(updated);
      setShowAdaptationModal(false);
      showToast("Metabolic reset protocol started 🔥","success",{duration:5000});
      track(EVENTS.FEATURE_USED||"metabolic_adaptation.started",{phases:3},user.id);
    }catch(e){console.error("[handleStartMetabolicProtocol]",e);}
  }

  async function handleDismissAdaptation(){
    if(!metabolicAdaptation)return;
    await dismissAdaptation(metabolicAdaptation.id).catch(()=>{});
    setMetabolicAdaptation(null);
    setShowAdaptationModal(false);
  }

  async function handleCompleteAdaptation(){
    if(!metabolicAdaptation)return;
    // Restore to phase 3 calories permanently
    const phase3Cals=metabolicAdaptation.protocol?.phases?.phase3?.calories;
    if(phase3Cals&&user){
      await sb.from("profiles").upsert({id:user.id,goalCals:phase3Cals,updated_at:new Date().toISOString()},{onConflict:"id"}).catch(()=>{});
    }
    await completeProtocol(metabolicAdaptation.id).catch(()=>{});
    setMetabolicAdaptation(null);
    showToast("Metabolic reset complete ✓ New deficit active","success",{duration:5000});
  }

  async function handleDeloadComplete(){
    const now=new Date().toISOString();
    setDeloadActive(false);setDeloadStartedAt(null);
    if(user){
      try{await sb.from("profiles").upsert({
        id:user.id,
        profile_data:{...profile,deload_active:false,deload_started_at:null},
        deload_active:false,
        updated_at:now
      },{onConflict:"id"});}catch(e){console.error("[handleDeloadComplete]",e);}
    }
  }

  useEffect(()=>{
    if(deloadActive&&deloadStartedAt){
      const days=(new Date()-new Date(deloadStartedAt))/864e5;
      if(days>=7)handleDeloadComplete();
    }
  },[deloadActive,deloadStartedAt]);

  // ── Coach Macro Score ──────────────────────────────────────────────────────
  const coachScore = useMemo(()=>{
    const sc=calcCoachScore({profile,consumed,macros,log,workoutLogsRaw,schedule,todayKey,todayType,healthSnap});
    const bonusedTotal=Math.max(0,Math.min(100,sc.total+hydrationBonus));
    return {...sc,total:bonusedTotal,hydrationBonus};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[log.length,workoutLogsRaw.length,todayKey,todayType,profile?.sleep,schedule,healthSnap,hydrationBonus]);

  useEffect(()=>{
    if(!user||!coachScore) return;
    const today=new Date().toISOString().split("T")[0];
    const existing=dailyScores.find(s=>s.date===today);
    if(existing&&Math.abs(existing.score-coachScore.total)<3) return;
    const entry={date:today,score:coachScore.total,r:coachScore.r,n:coachScore.n,t:coachScore.t,c:coachScore.c};
    const updated=[...dailyScores.filter(s=>s.date!==today),entry].slice(-90);
    setDailyScores(updated);
    (async()=>{ const {error}=await sb.from("profiles").upsert({id:user.id,daily_scores:updated,updated_at:new Date().toISOString()},{onConflict:"id"}); if(error)console.error("[saveScore]",error); })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[coachScore?.total]);

  // ── Milestone detection ────────────────────────────────────────────────────
  useEffect(()=>{
    if(!coachScore||!user)return;
    const today=new Date().toISOString().split("T")[0];
    const newMs=[];
    const has=(type)=>scoreMilestones.some(m=>m.type===type);

    if(coachScore.total>=90&&!has("first90")){
      newMs.push({type:"first90",date:today});
      setActiveMilestone({type:"first90",score:coachScore.total});
    } else if(coachScore.total>=80&&!has("first80")){
      newMs.push({type:"first80",date:today});
      setActiveMilestone({type:"first80",score:coachScore.total});
    }

    // 7-day streak above 70
    const cutoff=new Date(Date.now()-7*864e5).toISOString().split("T")[0];
    const last7ds=dailyScores.filter(s=>s.date>=cutoff&&s.date<=today);
    if(last7ds.length>=7&&last7ds.every(s=>s.score>=70)&&!scoreMilestones.some(m=>m.type==="streak7"&&m.date===today)){
      newMs.push({type:"streak7",date:today});
      if(!activeMilestone)setActiveMilestone({type:"streak7"});
    }

    // Perfect day (all components ≥70)
    if(coachScore.r>=70&&coachScore.n>=70&&coachScore.t>=70&&coachScore.c>=70&&!scoreMilestones.some(m=>m.type==="perfect"&&m.date===today)){
      newMs.push({type:"perfect",date:today});
      if(!activeMilestone)setActiveMilestone({type:"perfect"});
    }

    if(newMs.length>0){
      const updated=[...scoreMilestones,...newMs];
      setScoreMilestones(updated);
      (async()=>{ await sb.from("profiles").upsert({id:user.id,score_milestones:updated,updated_at:new Date().toISOString()},{onConflict:"id"}); })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[coachScore?.total]);

  function dismissWarning(type){
    const today=new Date().toISOString().split("T")[0];
    const updated={...dismissedWarnings,[type]:today};
    setDismissedWarnings(updated);
    localStorage.setItem("dismissed_score_warnings",JSON.stringify(updated));
  }

  // ── PR Predictions ─────────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prPredictions = useMemo(()=>calcPRPredictions(workoutLogsRaw,profile?.wUnit),[workoutLogsRaw]);

  // ── Injury Prevention ──────────────────────────────────────────────────────
  const [dismissedInjuryAlerts,setDismissedInjuryAlerts]=useState(()=>{
    const s=new Set();
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k?.startsWith("injury_alert_")){
        const ts=parseInt(localStorage.getItem(k)||"0");
        if(Date.now()-ts<86400000)s.add(k.replace("injury_alert_",""));
      }
    }
    return s;
  });
  function dismissInjuryAlert(id){
    localStorage.setItem(`injury_alert_${id}`,String(Date.now()));
    setDismissedInjuryAlerts(s=>new Set([...s,id]));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const injuryData=useMemo(()=>calcInjuryRisks(workoutLogsRaw,profile,wPrefs,allActs,coachScore),[workoutLogsRaw.length,profile?.sleep,wPrefs?.injuries,coachScore?.total,stravaActs.length,ahActs.length]);
  const activeInjuryRisks=(injuryData?.risks||[]).filter(r=>!dismissedInjuryAlerts.has(r.id));
  const topRiskLevel=activeInjuryRisks[0]?.level||null;

  // ── ACWR Injury Prediction state ──────────────────────────────────────────
  const [injuryLogs, setInjuryLogs] = useState([]);
  const [acwrRisks, setAcwrRisks] = useState({});
  const [showInjuryRiskModal, setShowInjuryRiskModal] = useState(null);
  const [showPainLogModal, setShowPainLogModal] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const acwrHighRisks = useMemo(()=>
    Object.entries(acwrRisks)
      .filter(([,r])=>r.level==="HIGH")
      .map(([region,r])=>({region,...r})),
    [acwrRisks]
  );

  async function handleLogPain({painLevel,painRegions,painType}){
    if(!user||!painRegions?.length)return;
    const severity=painLevel==="significant"?3:2;
    try{
      const newLogs=[];
      for(const region of painRegions){
        const log=await logInjury(user.id,{body_region:region,pain_type:painType||"soreness",severity,notes:null});
        if(log)newLogs.push(log);
      }
      if(newLogs.length)setInjuryLogs(prev=>[...newLogs,...prev]);
      showToast(`Pain logged — ${painRegions.length} region${painRegions.length>1?"s":""} noted`,"info");
    }catch(e){console.error("[handleLogPain]",e);}
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
    {id:"home",     label:"Home",     icon:"home"},
    {id:"train",    label:"Train",    icon:"train"},
    {id:"fuel",     label:"Fuel",     icon:"fuel"},
    {id:"progress", label:"Progress", icon:"progress"},
    {id:"settings", label:"Settings", icon:"settings"},
  ];

  function TabIcon({name, size=22}) {
    const paths = {
      home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>,
      train: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><rect x="2" y="9" width="3" height="6" rx="0.5"/><rect x="5" y="7" width="2" height="10" rx="0.5"/><rect x="17" y="7" width="2" height="10" rx="0.5"/><rect x="19" y="9" width="3" height="6" rx="0.5"/><line x1="7" y1="12" x2="17" y2="12"/></g>,
      fuel: <path d="M8 3h6l1 4c0 1.5-2 2.5-4 2.5S7 8.5 7 7l1-4zM7 9v11a1 1 0 001 1h6a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>,
      progress: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></g>,
      settings: <g stroke="currentColor" strokeWidth="1.6" fill="none"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></g>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]||null}</svg>;
  }

  const firstName = (profile.name||"Athlete").split(" ")[0];
  const weekDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weekDayLetters = ["M","T","W","T","F","S","S"];

  function HomeSection() {
    if (!dashboardLoaded && log.length === 0 && workoutLogsRaw.length === 0) {
      return <DashboardSkeleton/>;
    }
    return (
      <div className="page-enter">
        {/* Header */}
        <div className="screen-header" style={{paddingTop:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="header-eyebrow">{new Date().toLocaleDateString("en-US",{weekday:"long"})} · {cfg.label} Day</div>
            <div className="header-title">Hey, {firstName}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button className="icon-btn" aria-label="Notifications"><svg width={16} height={16} viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg></button>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--red),#8b1a0a)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--condensed)",fontWeight:800,fontStyle:"italic",fontSize:16,color:"white"}}>{firstName[0].toUpperCase()}</div>
          </div>
        </div>

        {/* Apple Health Strip */}
        {healthSnap&&(healthSnap.sleep!=null||healthSnap.rhr!=null||healthSnap.hrv!=null||healthSnap.steps!=null||healthSnap.calories!=null)&&(
          <div style={{margin:"0 20px 12px",padding:"12px 14px",background:"rgba(255,69,58,0.06)",border:"1px solid rgba(255,69,58,0.18)",borderRadius:14,display:"flex",gap:0,overflowX:"auto"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:0,display:"flex",gap:16,alignItems:"center",flexShrink:0}}>
              {healthSnap.sleep!=null&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:44}}>
                <span style={{fontSize:16}}>😴</span>
                <span style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:15,color:"var(--white)",lineHeight:1}}>{healthSnap.sleep}h</span>
                <span style={{fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Sleep</span>
              </div>}
              {healthSnap.rhr!=null&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:44}}>
                <span style={{fontSize:16}}>❤️</span>
                <span style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:15,color:"var(--white)",lineHeight:1}}>{healthSnap.rhr}</span>
                <span style={{fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase"}}>RHR</span>
              </div>}
              {healthSnap.hrv!=null&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:44}}>
                <span style={{fontSize:16}}>⚡</span>
                <span style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:15,color:"var(--white)",lineHeight:1}}>{healthSnap.hrv}ms</span>
                <span style={{fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase"}}>HRV</span>
              </div>}
              {healthSnap.steps!=null&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:52}}>
                <span style={{fontSize:16}}>👟</span>
                <span style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:15,color:"var(--white)",lineHeight:1}}>{healthSnap.steps>=1000?(healthSnap.steps/1000).toFixed(1)+"k":healthSnap.steps}</span>
                <span style={{fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Steps</span>
              </div>}
              {healthSnap.calories!=null&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:52}}>
                <span style={{fontSize:16}}>🔥</span>
                <span style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:15,color:"var(--white)",lineHeight:1}}>{healthSnap.calories}</span>
                <span style={{fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase"}}>Active</span>
              </div>}
            </div>
          </div>
        )}

        {/* ── METABOLIC ADAPTATION BANNER ── */}
        {metabolicAdaptation&&metabolicAdaptation.status==="detected"&&(
          <MetabolicAdaptationBanner
            adaptation={metabolicAdaptation}
            onView={()=>setShowAdaptationModal(true)}
            onDismiss={handleDismissAdaptation}
          />
        )}

        {/* ── METABOLIC RESET PROGRESS (while protocol active) ── */}
        {metabolicAdaptation&&metabolicAdaptation.status==="active"&&(()=>{
          const progress=getProtocolProgress(metabolicAdaptation);
          if(!progress)return null;
          return(
            <div style={{margin:"0 20px 14px"}}>
              <MetabolicResetProgressCard
                progress={progress}
                onComplete={handleCompleteAdaptation}
              />
            </div>
          );
        })()}

        {/* ── CALENDAR CONNECT PROMPT (first-time, native only) ── */}
        {typeof window!=="undefined"&&window.Capacitor?.isNativePlatform?.()&&!calendarConnected&&!showCalendarPrompt&&localStorage.getItem("cal_prompt_dismissed")!=="1"&&workoutLogsRaw.length>=3&&(
          <CalendarConnectPrompt
            onConnect={handleConnectCalendar}
            onDismiss={()=>{setShowCalendarPrompt(false);localStorage.setItem("cal_prompt_dismissed","1");}}
          />
        )}

        {/* ── LIFE-AWARE TRAINING — Calendar alerts ── */}
        {calendarAlerts.filter(a=>!dismissedAlerts.has(a.id)).map(alert=>(
          <ScheduleAlertCard
            key={alert.id}
            alert={alert}
            onAction={handleCalendarAction}
            onDismiss={handleDismissAlert}
          />
        ))}

        {/* ── TRAVEL DAY NUTRITION ── */}
        {travelAdvice&&(
          <TravelNutritionCard
            travelAdvice={travelAdvice}
            onDismiss={()=>setTravelAdvice(null)}
          />
        )}

        {/* ── PAST SECTION — Your Last 30 Days ── */}
        {workoutLogsRaw.length>0&&(()=>{
          const now=new Date();
          const cutoff=new Date(now.getFullYear(),now.getMonth(),now.getDate()-30);
          const last30=workoutLogsRaw.filter(w=>new Date(w.date+"T12:00:00")>=cutoff);
          const sessionsCount=last30.length;
          const totalSetsAll=last30.reduce((a,w)=>(w.workout?.exercises||[]).reduce((b,ex)=>b+(ex.sets?.length||0),a),0);
          // Nutrition adherence: logged days in last 30
          const loggedDays=new Set(log.filter(l=>{const d=new Date(l.date+"T12:00:00");return d>=cutoff;}).map(l=>l.date)).size;
          const nutPct=Math.round((loggedDays/30)*100);
          // Strength gain: compare avg session volume this 15d vs prior 15d
          const mid=new Date(now.getFullYear(),now.getMonth(),now.getDate()-15);
          const recent=last30.filter(w=>new Date(w.date+"T12:00:00")>=mid);
          const older=last30.filter(w=>new Date(w.date+"T12:00:00")<mid);
          const avgVol=arr=>arr.length?arr.reduce((a,w)=>(w.workout?.exercises||[]).reduce((b,ex)=>b+(ex.sets||[]).filter(s=>s.done).reduce((c,s)=>c+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0),a),0)/arr.length:0;
          const volGain=older.length&&recent.length?Math.round((avgVol(recent)-avgVol(older))/Math.max(avgVol(older),1)*100):null;
          if(!sessionsCount)return null;
          return(
            <div style={{margin:"0 20px 14px"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"rgba(245,245,240,.35)",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                <span>// PAST · LAST 30 DAYS</span>
                <div style={{flex:1,height:1,background:"rgba(245,245,240,.06)"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <div style={{background:"rgba(0,184,148,.07)",border:"1px solid rgba(0,184,148,.15)",borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:26,color:"#00B894",lineHeight:1}}>{sessionsCount}</div>
                  <div style={{fontSize:9,color:"rgba(245,245,240,.4)",marginTop:3,letterSpacing:".1em",textTransform:"uppercase"}}>Sessions</div>
                </div>
                <div style={{background:"rgba(59,130,246,.07)",border:"1px solid rgba(59,130,246,.15)",borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:26,color:"#3b82f6",lineHeight:1}}>{nutPct}%</div>
                  <div style={{fontSize:9,color:"rgba(245,245,240,.4)",marginTop:3,letterSpacing:".1em",textTransform:"uppercase"}}>Nutrition</div>
                </div>
                <div style={{background:volGain!=null&&volGain>=0?"rgba(245,166,35,.07)":"rgba(239,68,68,.07)",border:`1px solid ${volGain!=null&&volGain>=0?"rgba(245,166,35,.15)":"rgba(239,68,68,.15)"}`,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
                  <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:26,color:volGain!=null&&volGain>=0?"#F5A623":"#ef4444",lineHeight:1}}>{volGain!=null?`${volGain>=0?"+":""}${volGain}%`:"—"}</div>
                  <div style={{fontSize:9,color:"rgba(245,245,240,.4)",marginTop:3,letterSpacing:".1em",textTransform:"uppercase"}}>Strength</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Morning Adjustment Banner — with Biological Algorithm personalization */}
        {healthSnap&&(()=>{
          const adj=getMorningAdjustment({sleep:healthSnap.sleep,hrv:healthSnap.hrv});
          const sleepInsight=bioInsights?.sleep_performance?.insight_value;
          const sleepHours=healthSnap.sleep;

          // Personalized bio insight overrides generic banner when available
          if(sleepInsight&&sleepHours!=null){
            const sweet=sleepInsight.sweetSpotKey;
            const belowSweet=(sweet==="over_8"&&sleepHours<8)||(sweet==="7_to_8"&&sleepHours<7)||(sweet==="6_to_7"&&sleepHours<6);
            const perfImp=sleepInsight.performanceImprovement||0;
            if(belowSweet&&perfImp>5){
              const expectedDrop=Math.round(perfImp*((sleepInsight.sweetSpotKey==="over_8"?8:sleepInsight.sweetSpotKey==="7_to_8"?7.5:6.5)-sleepHours)/1.5);
              return(
                <div style={{margin:"0 20px 12px",padding:"12px 14px",background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:20,flexShrink:0}}>💤</span>
                  <div>
                    <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,textTransform:"uppercase",letterSpacing:"0.04em",color:"#EF4444"}}>Below YOUR Sleep Sweet Spot</div>
                    <div style={{fontFamily:"var(--body)",fontSize:11,color:"var(--white-dim)",marginTop:1}}>
                      You slept {parseFloat(sleepHours).toFixed(1)}h — below your personal {sleepInsight.sweetSpot} sweet spot. Expect ~{Math.max(5,expectedDrop)}% lower performance today. Session adjusted.
                    </div>
                  </div>
                </div>
              );
            }
            if(!belowSweet&&adj.type==="normal"){
              return(
                <div style={{margin:"0 20px 12px",padding:"12px 14px",background:"rgba(0,184,148,0.07)",border:"1px solid rgba(0,184,148,0.2)",borderRadius:12,display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:20}}>🧬</span>
                  <div>
                    <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,textTransform:"uppercase",letterSpacing:"0.04em",color:"#00B894"}}>In Your Sweet Spot</div>
                    <div style={{fontFamily:"var(--body)",fontSize:11,color:"var(--white-dim)",marginTop:1}}>
                      {parseFloat(sleepHours).toFixed(1)}h sleep — your personal optimal. Based on YOUR data: expect strong performance today.
                    </div>
                  </div>
                </div>
              );
            }
          }

          if(adj.type==="normal")return null;
          const isReduce=adj.type==="reduce";
          return(
            <div style={{margin:"0 20px 12px",padding:"12px 14px",background:isReduce?"rgba(239,68,68,0.08)":"rgba(0,184,148,0.08)",border:`1px solid ${isReduce?"rgba(239,68,68,0.25)":"rgba(0,184,148,0.25)"}`,borderRadius:12,display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:20}}>{isReduce?"⚡":"🔥"}</span>
              <div>
                <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,textTransform:"uppercase",letterSpacing:"0.04em",color:isReduce?"#EF4444":"#00B894"}}>{isReduce?"Reduce Intensity Today":"Peak Recovery — Push Hard"}</div>
                <div style={{fontFamily:"var(--body)",fontSize:11,color:"var(--white-dim)",marginTop:1}}>{adj.reason}</div>
              </div>
            </div>
          );
        })()}

        {/* Morning Brief */}
        {(morningBrief||morningBriefLoading)&&!briefDismissed&&(
          <div style={{margin:"0 20px 12px",padding:"14px 16px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderLeft:"3px solid var(--red)",borderRadius:"4px 14px 14px 4px",animation:"fade-in 0.4s"}}>
            <div className="header-eyebrow">// Morning Brief</div>
            {morningBriefLoading&&!morningBrief
              ?<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:8}}>{[0,1,2].map(i=><div key={i} className={`stagger-${i}`} style={{opacity:0,animation:"page-fade 0.3s ease forwards"}}><div className="skeleton" style={{height:13,width:i===2?"65%":"100%",borderRadius:4}}/></div>)}</div>
              :<div style={{fontSize:13.5,lineHeight:1.55,marginTop:8,fontStyle:"italic"}}>
                <style>{`@keyframes cm-blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
                {morningBrief}
                {morningBriefLoading&&<span style={{display:"inline-block",width:2,height:"1em",background:"var(--red)",marginLeft:2,verticalAlign:"text-bottom",animation:"cm-blink 1s step-end infinite"}}/>}
              </div>
            }
            {!morningBriefLoading&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <FlagBtn responseText={morningBrief} feature="morning_brief" user={user}/>
              <button onClick={()=>{setBriefDismissed(true);localStorage.setItem("brief_dismissed",new Date().toISOString().split("T")[0]);}} style={{background:"transparent",border:"none",color:"var(--red)",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Got it →</button>
            </div>}
          </div>
        )}

        {/* Comeback Protocol */}
        {showComebackProtocol&&(
          <div style={{margin:"0 20px 12px",padding:"16px",background:"linear-gradient(135deg, #1a1208, var(--navy-card))",border:"1px solid rgba(245,166,35,0.3)",borderRadius:14}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"var(--amber)",textTransform:"uppercase",marginBottom:6}}>// {daysSinceWorkout} Days Out</div>
            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:24,marginTop:0,textTransform:"uppercase",marginBottom:10}}>Welcome Back, {firstName}.</div>
            {["Muscles recovered — full intensity ready","Macros reset to maintenance this week",`Program resumes: Week ${programWeek}, ${todayFocus}`].map((t,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:13,marginBottom:6}}>
                <div style={{color:"var(--green)",marginTop:2}}>
                  <svg width={16} height={16} viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>{t}</div>
              </div>
            ))}
            <button onClick={()=>{setComebackDismissed(true);localStorage.setItem("comeback_dismissed",new Date().toISOString().split("T")[0]);setSection("train");}} style={{width:"100%",marginTop:12,padding:14,background:"var(--amber)",border:"none",borderRadius:12,color:"#0a0e1a",fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>Start Comeback Session →</button>
          </div>
        )}

        {/* Cycle Insight Card (Part 10) */}
        {profile?.sex==="female"&&profile?.cycleTracking&&(()=>{
          const cp=getCyclePhase(wPrefs?.lastPeriodDate||profile?.lastPeriodDate);
          const cn=getCycleNutrition(cp);
          if(!cp)return null;
          return(
            <div style={{margin:"0 20px 12px",borderRadius:14,overflow:"hidden",border:`1.5px solid ${cn?.color||"#F472B6"}30`}}>
              <div style={{background:`${cn?.color||"#F472B6"}12`,padding:"12px 16px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:cn?.color||"#F472B6",marginBottom:4}}>// Cycle · Day {cp.day}</div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,textTransform:"uppercase"}}>{cp.label}</div>
                  </div>
                  <div style={{fontSize:28}}>{cp.label.split(" ")[0]}</div>
                </div>
              </div>
              <div style={{background:"var(--navy-card)",padding:"10px 16px 14px"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,.4)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:4}}>Training</div>
                    <div style={{fontSize:11,lineHeight:1.55,color:"rgba(245,245,240,.8)"}}>{cp.cue}</div>
                  </div>
                  <div>
                    <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,.4)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:4}}>Nutrition</div>
                    <div style={{fontSize:11,lineHeight:1.55,color:"rgba(245,245,240,.8)"}}>{cn?.focus||"Balanced fueling"}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Consistency Score for peri/menopause (replaces streak) */}
        {showConsistencyScore(profile)&&(()=>{
          const {sessions,pct}=getConsistencyScore(workoutLogsRaw||[]);
          return(
            <div style={{margin:"0 20px 12px",padding:"14px 16px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"var(--white-dim)",textTransform:"uppercase",marginBottom:6}}>// Consistency Score</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:6}}>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:32,color:"var(--green)"}}>{pct}%</div>
                <div style={{fontSize:11,color:"rgba(245,245,240,.5)"}}>{sessions} sessions last 30 days</div>
              </div>
              <div style={{height:4,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:`${pct}%`,background:"var(--green)",borderRadius:2,transition:"width .6s"}}/>
              </div>
              <div style={{fontSize:12,color:"rgba(245,245,240,.6)",lineHeight:1.55,fontStyle:"italic"}}>Every session counts. Every time you show up is a win.</div>
            </div>
          );
        })()}

        {/* Coach quote */}
        <div className="coach-card">
          <div className="coach-label">// Coach</div>
          <div className="coach-text">"{todayFocus} day. Stay consistent — your progress compounds every session."</div>
        </div>

        {/* ── SMART DELOAD DETECTOR ── */}
        {(()=>{
          const todayStr=new Date().toISOString().split("T")[0];
          if(deloadActive){
            const daysLeft=deloadStartedAt?Math.max(0,7-Math.floor((new Date()-new Date(deloadStartedAt))/864e5)):7;
            return <DeloadActiveBadge daysLeft={daysLeft} onComplete={handleDeloadComplete}/>;
          }
          const snoozedToday=deloadSnooze===todayStr;
          if(!snoozedToday&&workoutLogsRaw.length>=5){
            const signals=analyzeDeload(workoutLogsRaw,profile,schedule);
            if(signals.length>=3){
              return <DeloadCard
                signals={signals}
                onStart={startDeload}
                onDismiss={()=>{setDeloadSnooze(todayStr);localStorage.setItem("deload_snooze",todayStr);}}
              />;
            }
          }
          return null;
        })()}

        {/* ── INJURY PREVENTION ALERT ── */}
        {activeInjuryRisks.length>0&&(
          <InjuryAlertCard
            risks={activeInjuryRisks}
            onAdapt={()=>{setSection("train");}}
            onDismiss={()=>dismissInjuryAlert(activeInjuryRisks[0].id)}
          />
        )}

        {/* ── ACWR HIGH-RISK ALERTS ── */}
        {acwrHighRisks.map(r=>(
          <div key={r.region} onClick={()=>setShowInjuryRiskModal(r.region)} style={{margin:"0 20px 12px",padding:"14px 16px",background:"rgba(239,68,68,0.07)",border:"1.5px solid rgba(239,68,68,0.28)",borderLeft:"3px solid #EF4444",borderRadius:"4px 14px 14px 4px",cursor:"pointer"}}>
            <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.14em",color:"#EF4444",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>⚠️ INJURY RISK ALERT — {r.region.replace("_"," ").toUpperCase()}</div>
            <div style={{fontSize:13,color:"rgba(245,245,240,.8)",lineHeight:1.6,marginBottom:8}}>
              Your {r.region.replace("_"," ")} training load is significantly above average this week (ACWR: {r.acwrRatio}).
              {r.recentPain>0&&` You've also reported pain in this area recently.`}
            </div>
            <div style={{fontSize:11,color:"#EF4444",fontWeight:700}}>See My Recommendation →</div>
          </div>
        ))}

        {/* Today's session */}
        <div style={{margin:"0 20px 14px",padding:"16px",background:deloadActive?"linear-gradient(135deg,#1a1508,var(--navy-card) 70%)":"linear-gradient(135deg, #2a0d05, var(--navy-card) 70%)",border:`1px solid ${deloadActive?"rgba(245,166,35,0.2)":"rgba(232,52,28,0.2)"}`,borderRadius:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div className="header-eyebrow">// Today's Session</div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {topRiskLevel&&!deloadActive&&(
                <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:6,
                  background:topRiskLevel==="high"?"rgba(239,68,68,0.12)":topRiskLevel==="moderate"?"rgba(249,115,22,0.12)":"rgba(245,166,35,0.12)",
                  color:topRiskLevel==="high"?"#EF4444":topRiskLevel==="moderate"?"#F97316":"#F5A623",
                  border:`1px solid ${topRiskLevel==="high"?"rgba(239,68,68,0.3)":topRiskLevel==="moderate"?"rgba(249,115,22,0.3)":"rgba(245,166,35,0.3)"}`,
                  fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase"}}>
                  ⚠️ {topRiskLevel==="high"?"HIGH RISK":topRiskLevel==="moderate"?"MONITOR":"WATCH"}
                </span>
              )}
              {deloadActive
                ?<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,background:"rgba(245,166,35,0.15)",color:"#F5A623",border:"1px solid rgba(245,166,35,0.3)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>DELOAD</span>
                :<span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,background:"rgba(0,184,148,0.15)",color:"var(--green)",border:"1px solid rgba(0,184,148,0.3)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase"}}>READY</span>
              }
            </div>
          </div>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,lineHeight:1,textTransform:"uppercase",marginBottom:14}}>{todayFocus}</div>
          <button onClick={()=>setSection("train")} style={{width:"100%",padding:14,background:deloadActive?"#F5A623":"var(--red)",border:"none",borderRadius:12,color:deloadActive?"#0a0e1a":"white",fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <svg width={14} height={14} viewBox="0 0 24 24"><path d="M6 4l14 8-14 8V4z" fill="currentColor"/></svg>
            Start Session
          </button>
        </div>

        {/* Dual rings */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"0 20px 14px"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 10px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"var(--white-dim)",textTransform:"uppercase"}}>// Fuel Today</div>
            <div style={{position:"relative",width:108,height:108,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={108} height={108} style={{transform:"rotate(-90deg)"}}>
                <circle cx={54} cy={54} r={46} stroke="rgba(245,245,240,0.08)" strokeWidth={8} fill="none"/>
                <circle cx={54} cy={54} r={46} stroke="var(--red)" strokeWidth={8} fill="none" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*46} strokeDashoffset={2*Math.PI*46*(1-Math.min(consumed.calories/macros.calories,1))} style={{transition:"stroke-dashoffset 0.6s"}}/>
              </svg>
              <div style={{position:"absolute",textAlign:"center"}}>
                <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:22,fontStyle:"italic",lineHeight:1}}>{consumed.calories.toLocaleString()}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--white-dim)",marginTop:3,letterSpacing:"0.1em",textTransform:"uppercase"}}>{Math.max(0,macros.calories-consumed.calories)} left</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"14px 10px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"var(--white-dim)",textTransform:"uppercase"}}>// This Week</div>
            <div style={{position:"relative",width:108,height:108,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={108} height={108} style={{transform:"rotate(-90deg)"}}>
                <circle cx={54} cy={54} r={46} stroke="rgba(245,245,240,0.08)" strokeWidth={8} fill="none"/>
                <circle cx={54} cy={54} r={46} stroke="var(--green)" strokeWidth={8} fill="none" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*46} strokeDashoffset={2*Math.PI*46*(1-Math.min(workoutLogsRaw.filter(w=>{const d=new Date(w.date||w.logged_at);const now=new Date();return d>=new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());}).length/Math.max(1,Object.values(schedule).filter(v=>v==="training").length),1))} style={{transition:"stroke-dashoffset 0.6s"}}/>
              </svg>
              <div style={{position:"absolute",textAlign:"center"}}>
                <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:22,fontStyle:"italic",lineHeight:1}}>{workoutLogsRaw.filter(w=>{const d=new Date(w.date||w.logged_at);const now=new Date();return d>=new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());}).length}/{Object.values(schedule).filter(v=>v==="training").length}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--white-dim)",marginTop:3,letterSpacing:"0.1em",textTransform:"uppercase"}}>sessions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly roadmap */}
        <div className="section-title">This Week</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,margin:"0 20px 14px"}}>
          {weekDays.map((day,i)=>{
            const type=schedule[day]||"rest";
            const isToday2=day===todayKey;
            const colors={training:"var(--red)",cardio:"var(--blue)",run:"var(--blue)",hyrox:"var(--amber)",rest:"rgba(245,245,240,0.06)"};
            const c=colors[type]||colors.rest;
            return (
              <div key={i} style={{aspectRatio:"1",borderRadius:10,background:isToday2?c:(type==="rest"?colors.rest:`${c}22`),border:"1px solid "+(isToday2?"transparent":(type==="rest"?"var(--white-border)":`${c}55`)),display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                <div style={{fontFamily:"var(--mono)",fontSize:10,color:type==="rest"?"var(--white-faint)":"var(--white)",letterSpacing:"0.06em"}}>{weekDayLetters[i]}</div>
                {isToday2&&<div style={{width:5,height:5,borderRadius:"50%",background:"white"}}/>}
              </div>
            );
          })}
        </div>

        {/* Macros */}
        <div className="section-title">Macros Today</div>
        <div style={{margin:"0 20px 14px",padding:"16px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14,display:"flex",flexDirection:"column",gap:12}}>
          {[["Protein",consumed.protein,macros.protein,"var(--red)"],["Carbs",consumed.carbs,macros.carbs,"var(--blue)"],["Fat",consumed.fat,macros.fat,"var(--amber)"]].map(([label,val,target,color])=>(
            <div key={label}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--white-dim)"}}>{label}</span>
                <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--white)"}}>{val}<span style={{color:"var(--white-faint)"}}>/{target}g</span></span>
              </div>
              <div style={{height:4,background:"rgba(245,245,240,0.08)",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(val/target,1)*100}%`,background:color,transition:"width 0.6s"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── FUTURE SECTION ── */}
        {(sessionPrediction||weeklyForecast.length>0||goalTrajectories.strength||goalTrajectories.bodyComp)&&(()=>{
          const todayProb=sessionPrediction?.probability??weeklyForecast.find(d=>d.isTraining&&d.probability!=null)?.probability;
          const probColor=todayProb>=75?"#00B894":todayProb>=50?"#3b82f6":"#F5A623";
          const trainingDays=weeklyForecast.filter(d=>d.isTraining&&d.probability!=null);
          return(
            <div style={{margin:"0 20px 14px"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"rgba(245,245,240,.35)",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                <span>// FUTURE</span>
                <div style={{flex:1,height:1,background:"rgba(245,245,240,.06)"}}/>
              </div>

              {/* Today's PR probability */}
              {todayProb!=null&&todayType==="training"&&(
                <div style={{background:`${probColor}0d`,border:`1px solid ${probColor}25`,borderRadius:14,padding:"14px 16px",marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:20,color:probColor,textTransform:"uppercase",letterSpacing:".04em"}}>
                      {todayProb>=75?"🔥 STRONG DAY":todayProb>=50?"💪 SOLID SESSION":"⚡ RECOVERY SESSION"}
                    </div>
                    <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:28,color:probColor}}>{todayProb}%</div>
                  </div>
                  <div style={{fontSize:11,color:"rgba(245,245,240,.45)"}}>PR probability · based on sleep, recovery, nutrition & your biology</div>
                </div>
              )}

              {/* Weekly forecast grid */}
              {trainingDays.length>0&&(
                <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14,padding:"12px 14px",marginBottom:10}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.14em",color:"rgba(245,245,240,.35)",textTransform:"uppercase",marginBottom:10}}>This Week's Forecast</div>
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${trainingDays.length},1fr)`,gap:6}}>
                    {trainingDays.map((d,i)=>{
                      const c=d.probability>=75?"#00B894":d.probability>=50?"#3b82f6":"#F5A623";
                      const isToday3=d.date===new Date().toISOString().split("T")[0];
                      return(
                        <div key={i} style={{textAlign:"center",background:`${c}12`,borderRadius:10,padding:"8px 4px",border:`1px solid ${isToday3?c+"50":"transparent"}`}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,.45)",letterSpacing:".1em",marginBottom:4}}>{d.wday.toUpperCase()}</div>
                          <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:18,color:c,lineHeight:1}}>{d.probability}%</div>
                          <div style={{fontSize:8,color:"rgba(245,245,240,.3)",marginTop:2}}>PR PROB</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Goal trajectories */}
              {(goalTrajectories.strength||goalTrajectories.bodyComp)&&(
                <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14,padding:"12px 14px"}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.14em",color:"rgba(245,245,240,.35)",textTransform:"uppercase",marginBottom:10}}>Goal Trajectories</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {goalTrajectories.strength&&(
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:"rgba(245,245,240,.8)"}}>Strength</div>
                          <div style={{fontSize:10,color:"rgba(245,245,240,.4)"}}>{goalTrajectories.strength.weeklyGainPct>0?"+":""}{goalTrajectories.strength.weeklyGainPct}% per session avg</div>
                        </div>
                        <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,color:goalTrajectories.strength.trend==="up"?"#00B894":goalTrajectories.strength.trend==="down"?"#ef4444":"rgba(245,245,240,.5)",padding:"4px 10px",borderRadius:20,background:goalTrajectories.strength.trend==="up"?"rgba(0,184,148,.1)":goalTrajectories.strength.trend==="down"?"rgba(239,68,68,.1)":"rgba(255,255,255,.05)"}}>
                          {goalTrajectories.strength.trend==="up"?"↗ PROGRESSING":goalTrajectories.strength.trend==="down"?"↘ DECLINING":"→ STABLE"}
                        </div>
                      </div>
                    )}
                    {goalTrajectories.bodyComp&&(
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:"rgba(245,245,240,.8)"}}>Body Comp</div>
                          <div style={{fontSize:10,color:"rgba(245,245,240,.4)"}}>
                            {Math.abs(goalTrajectories.bodyComp.weeklyChange)<0.05?"Weight stable":`${goalTrajectories.bodyComp.weeklyChange>0?"+":""}${goalTrajectories.bodyComp.weeklyChange.toFixed(1)}${goalTrajectories.bodyComp.wUnit}/wk`}
                            {goalTrajectories.bodyComp.weeksToGoal&&` · ~${goalTrajectories.bodyComp.weeksToGoal}w to goal`}
                          </div>
                        </div>
                        <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,color:goalTrajectories.bodyComp.trend==="gaining"?"#F5A623":goalTrajectories.bodyComp.trend==="losing"?"#00B894":"rgba(245,245,240,.5)",padding:"4px 10px",borderRadius:20,background:goalTrajectories.bodyComp.trend==="gaining"?"rgba(245,166,35,.1)":goalTrajectories.bodyComp.trend==="losing"?"rgba(0,184,148,.1)":"rgba(255,255,255,.05)"}}>
                          {goalTrajectories.bodyComp.trend==="gaining"?"↗ GAINING":goalTrajectories.bodyComp.trend==="losing"?"↘ LOSING":"→ STABLE"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Quick actions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"0 20px 24px"}}>
          <button onClick={()=>setSection("fuel")} className="quick-btn">
            <svg width={16} height={16} viewBox="0 0 24 24"><g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><path d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2"/><line x1="3" y1="12" x2="21" y2="12"/></g></svg>
            Log Food
          </button>
          <button onClick={()=>setSection("train")} className="quick-btn">
            <svg width={16} height={16} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Start Workout
          </button>
        </div>
      </div>
    );
  }

  function WorkoutHistorySection({logs}) {
    const [expandedIdx,setExpandedIdx]=useState(null);
    return(
      <div style={{margin:"0 20px 14px"}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>HISTORY</div>
        <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16,overflow:"hidden"}}>
          {logs.slice(0,20).map((w,i)=>{
            const dateLabel=new Date(w.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});
            const focus=w.workout?.focus||"Workout";
            const dur=w.workout?.calories_burned?Math.round(w.workout.calories_burned/6)+"m":"—";
            const sets=(w.workout?.exercises||[]).reduce((a,e)=>a+(e.sets?.length||0),0);
            const expanded=expandedIdx===i;
            return(
              <div key={w.id||i} style={{borderBottom:i<Math.min(logs.length,20)-1?"1px solid rgba(245,245,240,0.06)":"none"}}>
                <div onClick={()=>setExpandedIdx(expanded?null:i)} style={{display:"flex",alignItems:"center",padding:"12px 16px",cursor:"pointer",gap:12}}>
                  <div style={{width:34,height:34,borderRadius:10,background:"rgba(232,52,28,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>💪</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{focus}</div>
                    <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",marginTop:2}}>{dateLabel} · {dur} · {sets} sets</div>
                  </div>
                  <div style={{color:"rgba(245,245,240,0.3)",fontSize:14,flexShrink:0,transition:"transform .2s",transform:expanded?"rotate(180deg)":"none"}}>▾</div>
                </div>
                {expanded&&(
                  <div style={{padding:"0 16px 14px",display:"flex",flexDirection:"column",gap:6}}>
                    {(w.workout?.exercises||[]).map((ex,j)=>(
                      <div key={j} style={{background:"rgba(245,245,240,0.03)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:12,fontWeight:600,color:"rgba(245,245,240,0.75)",marginBottom:4}}>{ex.name}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {(ex.sets||[]).filter(s=>s.done||s.weight).map((s,k)=>(
                            <div key={k} style={{fontSize:10,color:"rgba(245,245,240,0.45)",background:"rgba(245,245,240,0.06)",borderRadius:4,padding:"2px 7px"}}>{s.weight||0}lbs × {s.reps||0}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function BodyweightSection({logs,user:u,setLogs,wUnit}) {
    const [bwModal,setBwModal]=useState(false);
    const [bwInput,setBwInput]=useState("");
    const [bwDate,setBwDate]=useState(()=>new Date().toISOString().split("T")[0]);
    const [bwSaving,setBwSaving]=useState(false);

    async function saveWeight(){
      const w=parseFloat(bwInput);
      if(!w||!u)return;
      setBwSaving(true);
      const entry={date:bwDate,weight:w};
      await sb.from("bodyweight_logs").upsert({user_id:u.id,...entry},{onConflict:"user_id,date"});
      setLogs(prev=>[...prev.filter(x=>x.date!==bwDate),entry].sort((a,b)=>a.date.localeCompare(b.date)));
      setBwModal(false);setBwInput("");setBwSaving(false);
    }

    const chartData=(()=>{
      if(logs.length<2)return null;
      const vals=logs.map(x=>x.weight);
      const minW=Math.min(...vals)-2,maxW=Math.max(...vals)+2;
      const n=logs.length;
      const W=300,H=80;
      const px=(idx)=>Math.round((idx/(n-1))*W);
      const py=(v)=>Math.round(H-((v-minW)/(maxW-minW))*H);
      const line=logs.map((x,idx)=>`${idx===0?"M":"L"}${px(idx)},${py(x.weight)}`).join(" ");
      const ma=logs.map((_,idx)=>{
        const slice=logs.slice(Math.max(0,idx-3),idx+4);
        return slice.reduce((s,x)=>s+x.weight,0)/slice.length;
      });
      const maLine=ma.map((v,idx)=>`${idx===0?"M":"L"}${px(idx)},${py(v)}`).join(" ");
      const startW=Math.ceil(vals[0]/5)*5;
      const milestones=[];
      for(let m=startW;m<=maxW+5;m+=5)if(m>=minW)milestones.push(m);
      return{line,maLine,W,H,vals,py,px,milestones,n};
    })();

    const latest=logs[logs.length-1];

    return(
      <div style={{margin:"0 20px 14px"}}>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>WEIGHT</div>
        <div style={{background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16,padding:"16px 18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              {latest
                ?<><div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,lineHeight:1}}>{latest.weight}<span style={{fontSize:14,fontWeight:400,color:"rgba(245,245,240,0.45)",marginLeft:4}}>{wUnit}</span></div>
                  <div style={{fontSize:10,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",marginTop:2}}>Last: {new Date(latest.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div></>
                :<div style={{textAlign:"center",padding:"8px 0 4px"}}>
                  <div style={{fontSize:28,marginBottom:6}}>⚖️</div>
                  <div style={{fontSize:13,fontWeight:600,color:"rgba(245,245,240,0.65)"}}>No weight logged yet</div>
                  <div style={{fontSize:11,color:"rgba(245,245,240,0.35)",marginTop:3}}>Log daily to see your trend</div>
                </div>}
            </div>
            <button onClick={()=>setBwModal(true)} style={{padding:"8px 16px",background:"var(--red)",color:"#fff",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.05em"}}>+ Log</button>
          </div>
          {chartData&&(
            <svg viewBox={`0 0 ${chartData.W} ${chartData.H}`} style={{width:"100%",height:80,overflow:"visible",display:"block"}}>
              {chartData.milestones.map(m=>(
                <line key={m} x1={0} y1={chartData.py(m)} x2={chartData.W} y2={chartData.py(m)} stroke="rgba(245,245,240,0.06)" strokeWidth={1}/>
              ))}
              <path d={chartData.line} fill="none" stroke="rgba(232,52,28,0.4)" strokeWidth={1.5}/>
              <path d={chartData.maLine} fill="none" stroke="var(--red)" strokeWidth={2} strokeLinecap="round"/>
              {logs.map((x,idx)=>{
                const isMilestone=chartData.milestones.some(m=>Math.abs(x.weight-m)<0.5);
                if(!isMilestone&&idx!==logs.length-1)return null;
                return<circle key={idx} cx={chartData.px(idx)} cy={chartData.py(x.weight)} r={isMilestone?4:3} fill={isMilestone?"#F5A623":"var(--red)"} stroke="var(--navy-card)" strokeWidth={2}/>;
              })}
            </svg>
          )}
          {chartData&&<div style={{display:"flex",gap:16,marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"rgba(245,245,240,0.4)"}}>
              <div style={{width:16,height:2,background:"var(--red)",borderRadius:1}}/>7-day avg
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"rgba(245,245,240,0.4)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#F5A623"}}/>5 {wUnit} milestone
            </div>
          </div>}
        </div>
        {bwModal&&(
          <div onClick={()=>setBwModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#0D1827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,paddingBottom:"max(24px,env(safe-area-inset-bottom))"}}>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:24,marginBottom:16}}>Log Weight</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div>
                  <div style={{fontSize:10,color:"rgba(245,245,240,0.4)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6,fontFamily:"var(--mono)"}}>Weight ({wUnit})</div>
                  <input autoFocus value={bwInput} onChange={e=>setBwInput(e.target.value)} type="number" step="0.1" placeholder="e.g. 175" style={{width:"100%",background:"rgba(245,245,240,0.06)",border:"1.5px solid rgba(245,245,240,0.12)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:16,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:10,color:"rgba(245,245,240,0.4)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6,fontFamily:"var(--mono)"}}>Date</div>
                  <input value={bwDate} onChange={e=>setBwDate(e.target.value)} type="date" style={{width:"100%",background:"rgba(245,245,240,0.06)",border:"1.5px solid rgba(245,245,240,0.12)",borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
                </div>
              </div>
              <button onClick={saveWeight} disabled={!bwInput||bwSaving} style={{width:"100%",padding:"14px",background:!bwInput||bwSaving?"rgba(245,245,240,0.1)":"var(--red)",color:!bwInput||bwSaving?"rgba(245,245,240,0.3)":"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:!bwInput||bwSaving?"default":"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.08em",textTransform:"uppercase"}}>
                {bwSaving?"Saving...":"Save Weight"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function ProgressSection() {
    const sc = coachScore;

    // ── Chart settings state ─────────────────────────────────────────────────
    const [chartSettings, setChartSettings] = useState(()=>{
      try {
        const s = localStorage.getItem("cm_chart_settings");
        if (s) return { ...CHART_DEFAULT_SETTINGS, ...JSON.parse(s) };
      } catch {}
      return { ...CHART_DEFAULT_SETTINGS, ...(profile?.chart_settings||{}) };
    });
    const [chartCategory,    setChartCategory]    = useState("all");
    const [chartSettingsOpen,setChartSettingsOpen] = useState(false);
    const [explainChartKey,  setExplainChartKey]   = useState(null);

    function saveChartSettings(next) {
      setChartSettings(next);
      try { localStorage.setItem("cm_chart_settings", JSON.stringify(next)); } catch {}
      if (user?.id) sb.from("profiles").update({chart_settings:next}).eq("id",user.id)
        .then(({error})=>{ if(error) showToast("Chart settings saved locally (sync failed)"); })
        .catch(()=>{ showToast("Chart settings saved locally (sync failed)"); });
    }

    const RANGE_DAYS = { "1week":7, "1month":30, "3months":90, "all":3650 };
    const filteredLogs = useMemo(()=>{
      const days = RANGE_DAYS[chartSettings.time_range] || 30;
      const cutoff = new Date(Date.now()-days*864e5).toISOString().split("T")[0];
      return (workoutLogsRaw||[]).filter(l=>l.date>=cutoff);
    },[workoutLogsRaw, chartSettings.time_range]);

    const orderedChartKeys = useMemo(()=>{
      const order = chartSettings.chart_order || CHART_REGISTRY.map(c=>c.key);
      return order.filter(key=>{
        if (chartSettings.visible_charts?.[key]===false) return false;
        if (chartCategory!=="all") {
          const reg = CHART_REGISTRY.find(c=>c.key===key);
          if (!reg || reg.category!==chartCategory) return false;
        }
        return true;
      });
    },[chartSettings, chartCategory]);

    const wUnit = profile?.wUnit||"lbs";
    const hasWorkoutData = filteredLogs.length >= 3;
    const hasBodyweightData = bodyweightLogs.length >= 2;

    function ChartNoData({icon="🏋️",heading,sub,ctaLabel,ctaAction}){
      return(
        <div style={{textAlign:"center",padding:"40px 20px 32px"}}>
          <div style={{fontSize:36,marginBottom:12,opacity:0.6}}>{icon}</div>
          <div style={{fontSize:15,fontWeight:700,color:"rgba(245,245,240,0.65)",marginBottom:6}}>{heading}</div>
          <div style={{fontSize:12,color:"rgba(245,245,240,0.35)",maxWidth:240,margin:"0 auto",lineHeight:1.6}}>{sub}</div>
          {ctaLabel&&ctaAction&&<button onClick={ctaAction} style={{marginTop:18,padding:"10px 24px",background:"var(--red)",color:"#fff",border:"none",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{ctaLabel}</button>}
        </div>
      );
    }

    function renderChart(key) {
      switch(key) {
        case "flux_range":       return !hasWorkoutData?<ChartNoData icon="📈" heading="Complete 3+ workouts first" sub="This chart tracks your strength progress over time. Log a few sessions to see it come to life." ctaLabel="Start Workout" ctaAction={()=>setSection("train")}/>:<FluxRangeChart workoutLogsRaw={filteredLogs} wUnit={wUnit}/>;
        case "peak_performance": return !hasWorkoutData?<ChartNoData icon="⚡" heading="Not enough data yet" sub="Peak Performance needs at least 3 logged sessions to model your fitness and fatigue balance." ctaLabel="Log a Workout" ctaAction={()=>setSection("train")}/>:<PeakPerformanceChart workoutLogsRaw={filteredLogs}/>;
        case "body_comp_vector": return (!hasWorkoutData||!hasBodyweightData)?<ChartNoData icon="🧬" heading="Log workouts and weight" sub="This chart needs both workout history and daily weigh-ins to show your body composition direction."/>:<BodyCompositionVector workoutLogsRaw={filteredLogs} bodyweightLogs={bodyweightLogs} wUnit={wUnit}/>;
        case "muscle_volume":    return <MuscleVolumeChart userId={user?.id}/>;
        case "goal_cone":        return !hasWorkoutData?<ChartNoData icon="🎯" heading="Build your baseline first" sub="Log 3+ sessions so we can model your rate of progress and project your goal timeline." ctaLabel="Log a Workout" ctaAction={()=>setSection("train")}/>:<GoalProbabilityCone workoutLogsRaw={filteredLogs} wUnit={wUnit}/>;
        case "balance_check":    return !hasWorkoutData?<ChartNoData icon="⚖️" heading="Log a full week first" sub="Balance Check needs workouts across multiple muscle groups to detect push/pull and upper/lower imbalances."/>:<BalanceCheck workoutLogsRaw={filteredLogs} wUnit={wUnit} onViewExercises={()=>setSection("train")}/>;
        case "injury_risk":      return <InjuryRiskReport risks={injuryData?.risks} muscleSetCounts={injuryData?.muscleSetCounts}/>;
        case "weight_trend":     return !hasBodyweightData?<ChartNoData icon="⚖️" heading="Log your weight daily" sub="Track your weight for at least 2 days to see your trend line and filter out daily fluctuations."/>:<WeightTrendChart bodyweightLogs={bodyweightLogs} profile={profile} wUnit={wUnit}/>;
        case "macro_calendar":   return <MacroCalendarHeatmap userId={user?.id} profile={profile}/>;
        case "nutrition_perf":   return !hasWorkoutData?<ChartNoData icon="🥗" heading="Log food and workouts" sub="This chart correlates what you eat with how you train 48 hours later. It needs both data streams."/>:<NutritionPerformanceChart userId={user?.id} profile={profile} workoutLogsRaw={filteredLogs}/>;
        case "sleep_perf":       return <SleepPerformanceChart userId={user?.id}/>;
        default: return null;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const ringColor = sc.total>=90?"#FFD700":sc.total>=85?"#00B894":sc.total>=70?"#4A90E2":sc.total>=50?"#F5A623":"#EF4444";
    const dateStr = new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"});
    const todayStr = new Date().toISOString().split("T")[0];
    const last7 = (()=>{
      const out = [];
      for(let i=6;i>=0;i--){
        const d = new Date(Date.now()-i*864e5).toISOString().split("T")[0];
        const entry = dailyScores.find(s=>s.date===d);
        out.push(entry ? {...entry} : {date:d,score:d===todayStr?sc.total:null});
      }
      return out;
    })();
    const hydPct=Math.min(100,Math.round((waterLoggedOz/Math.max(1,waterTarget))*100));
    const components=[
      {label:"Recovery",   val:sc.r, color:"#4A90E2"},
      {label:"Nutrition",  val:sc.n, color:"#00B894"},
      {label:"Training",   val:sc.t, color:"var(--red)"},
      {label:"Consistency",val:sc.c, color:"#F5A623"},
      {label:"Hydration",  val:hydPct, color:"#06B6D4", suffix:` (${hydrationBonus>=0?"+":""}${hydrationBonus}pts)`},
    ];

    // ── Active warnings (filter dismissed, max 2, danger first) ──────────────
    const activeWarnings=(sc.warnings||[])
      .filter(w=>{const today2=new Date().toISOString().split("T")[0];return dismissedWarnings[w.type]!==today2;})
      .sort((a,b)=>(a.severity==="danger"?0:1)-(b.severity==="danger"?0:1))
      .slice(0,2);

    // ── Trend analysis ───────────────────────────────────────────────────────
    const scoredLast7=last7.filter(e=>e.score!=null);
    const trendLabel=(()=>{
      if(scoredLast7.length<4)return null;
      const first=scoredLast7.slice(0,Math.floor(scoredLast7.length/2));
      const second=scoredLast7.slice(Math.floor(scoredLast7.length/2));
      const avg=(arr)=>arr.reduce((s,x)=>s+x.score,0)/arr.length;
      const diff=avg(second)-avg(first);
      if(diff>5)return{icon:"↑",text:"Trending up this week",color:"#00B894"};
      if(diff<-5)return{icon:"↓",text:"Trending down — check recovery",color:"#EF4444"};
      return{icon:"→",text:"Consistent performance",color:"#F5A623"};
    })();

    // ── Weekly report (Monday only) ──────────────────────────────────────────
    const isMonday=new Date().getDay()===1;
    const lastWeekScores=(()=>{
      const mon=new Date();mon.setDate(mon.getDate()-7);mon.setHours(0,0,0,0);
      const sun=new Date();sun.setDate(sun.getDate()-1);sun.setHours(23,59,59,999);
      const monStr=mon.toISOString().split("T")[0];
      const sunStr=sun.toISOString().split("T")[0];
      return dailyScores.filter(s=>s.date>=monStr&&s.date<=sunStr);
    })();
    const weekReport=isMonday&&lastWeekScores.length>=3?(()=>{
      const avg=Math.round(lastWeekScores.reduce((s,x)=>s+x.score,0)/lastWeekScores.length);
      const best=lastWeekScores.reduce((a,b)=>a.score>b.score?a:b);
      const worst=lastWeekScores.reduce((a,b)=>a.score<b.score?a:b);
      const bestDay=new Date(best.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"});
      const worstDay=new Date(worst.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"long"});
      const lowRecovery=lastWeekScores.filter(s=>s.r<60).length;
      const avgSleep=healthSnap?.sleep;
      let insight=null;
      if(lowRecovery>=3){
        insight=`Recovery dragged your score down ${lowRecovery} days.${avgSleep?` Average sleep was ${avgSleep}h. One extra hour per night could add ~8 points to your average.`:" Focus on sleep quality this week."}`;
      } else if(lastWeekScores.some(s=>s.n<60)){
        insight="Nutrition consistency was the biggest opportunity last week. Logging meals earlier in the day tends to improve hitting targets.";
      } else if(lastWeekScores.some(s=>s.t<60)){
        insight="Missing training sessions cost the most points last week. Pre-scheduling tomorrow's session increases follow-through significantly.";
      }
      return{avg,best,worst,bestDay,worstDay,insight};
    })():null;

    // ── Milestone display ────────────────────────────────────────────────────
    const MILESTONE_COPY={
      first80:{title:"FIRST 80+ SCORE! 🎉",sub:"You're training like an athlete.",color:"#4A90E2"},
      first90:{title:"ELITE PERFORMANCE DAY 🔥",sub:"Top 10% of Coach Macro athletes today.",color:"#00B894"},
      streak7:{title:"7-DAY CONSISTENCY STREAK 💪",sub:"This is how champions are built.",color:"#FFD700"},
      perfect:{title:"PERFECT DAY ⭐",sub:"Nutrition + Training + Recovery + Consistency all firing together.",color:"#FFD700"},
    };

    return (
      <div className="page-enter">
        {showScoreModal&&<ScoreExplanationModal sc={sc} onClose={()=>setShowScoreModal(false)}/>}

        <div className="screen-header" style={{paddingTop:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="header-eyebrow">// Daily Performance</div>
            <div className="header-title">Progress</div>
          </div>
          <button onClick={()=>setChartSettingsOpen(true)} title="Customize charts" style={{background:"none",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 10px",color:"rgba(245,245,240,0.50)",cursor:"pointer",fontSize:16,flexShrink:0,lineHeight:1}}>⊞</button>
        </div>

        {/* Category filter pills */}
        <div style={{display:"flex",gap:6,overflowX:"auto",padding:"0 20px 12px",scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
          {[{id:"all",label:"All"},{id:"overview",label:"Overview"},{id:"strength",label:"Strength"},{id:"nutrition",label:"Nutrition"},{id:"recovery",label:"Recovery"}].map(({id,label})=>(
            <button key={id} onClick={()=>setChartCategory(id)} style={{flexShrink:0,padding:"5px 14px",borderRadius:20,background:chartCategory===id?"var(--red)":"rgba(255,255,255,0.06)",border:chartCategory===id?"none":"1px solid rgba(255,255,255,0.10)",color:chartCategory===id?"white":"rgba(245,245,240,0.55)",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",lineHeight:1.4}}>
              {label}
            </button>
          ))}
        </div>

        {/* ── MILESTONE CELEBRATION ── */}
        {activeMilestone&&MILESTONE_COPY[activeMilestone.type]&&(()=>{
          const m=MILESTONE_COPY[activeMilestone.type];
          return(
            <div style={{margin:"0 20px 14px",padding:"18px 20px",background:`linear-gradient(135deg,${m.color}20,${m.color}08)`,border:`1px solid ${m.color}40`,borderRadius:16,display:"flex",alignItems:"flex-start",gap:14}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:18,fontWeight:900,color:"#fff",marginBottom:4}}>{m.title}</div>
                <div style={{fontSize:12,color:"rgba(245,245,240,0.65)",lineHeight:1.5}}>{m.sub}</div>
              </div>
              <button onClick={()=>setActiveMilestone(null)} style={{background:"none",border:"none",color:"rgba(245,245,240,.3)",cursor:"pointer",fontSize:18,padding:"0 2px",lineHeight:1,flexShrink:0}}>×</button>
            </div>
          );
        })()}

        {/* ── BIOLOGICAL ALGORITHM CARD ── */}
        {(()=>{
          const unlockedCount=Object.keys(bioInsights).length;
          const totalDataPts=Object.values(bioDataCounts).reduce((a,v)=>a+v,0);
          const hasInsights=unlockedCount>0;
          return(
            <div onClick={()=>setBioScreen(true)} style={{margin:"0 20px 14px",padding:"16px 18px",background:hasInsights?"linear-gradient(135deg,rgba(123,104,238,.08),rgba(74,144,226,.05))":"rgba(255,255,255,.02)",border:`1px solid ${hasInsights?"rgba(123,104,238,.3)":"rgba(255,255,255,.07)"}`,borderRadius:16,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:28,flexShrink:0}}>🧬</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:15,fontWeight:800,letterSpacing:".04em",color:hasInsights?"#fff":"rgba(245,245,240,.5)",textTransform:"uppercase",marginBottom:3}}>
                  {hasInsights?"Your Biological Algorithm":"Algorithm Unlocking..."}
                </div>
                <div style={{fontSize:11,color:"rgba(245,245,240,.45)"}}>
                  {hasInsights
                    ?`${unlockedCount}/5 insights · ${totalDataPts} data points collected`
                    :`${totalDataPts} data points collected — keep training to unlock`}
                </div>
              </div>
              <div style={{fontSize:14,color:hasInsights?"rgba(123,104,238,.8)":"rgba(255,255,255,.2)",flexShrink:0}}>›</div>
            </div>
          );
        })()}

        {/* ── SCORE RING CARD ── */}
        <div onClick={()=>setShowScoreModal(true)} style={{margin:"0 20px 14px",padding:"28px 20px 20px",background:"var(--navy-card)",border:`1px solid ${ringColor}30`,borderRadius:20,textAlign:"center",cursor:"pointer"}}>
          <ScoreRing score={sc.total}/>
          <div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.3)",letterSpacing:"0.14em",textTransform:"uppercase",marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            Today · {dateStr}
            {sc.isCapped&&<span style={{marginLeft:8,color:"#F5A623"}}>⚠ Score capped</span>}
            <span onClick={e=>{e.stopPropagation();}}><InfoTip title="Coach Macro Score" content={"A daily 0–100 score that measures how optimized your day was.\n\nRecovery (40%) — sleep quality and duration\nNutrition (30%) — hitting your macro targets\nTraining (20%) — completing your scheduled session\nConsistency (10%) — your 30-day streak\nHydration bonus — up to ±3 points\n\nScores above 80 indicate elite-level discipline. Most athletes average 55–70."}/></span>
          </div>
          <div style={{fontSize:9,color:"rgba(245,245,240,0.2)",marginTop:4}}>Tap to understand your score →</div>

          {/* Component bars */}
          <div style={{marginTop:20,textAlign:"left"}}>
            {components.map(({label,val,color,suffix})=>(
              <div key={label} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.5)",letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}{suffix&&<span style={{color:"rgba(245,245,240,0.3)",fontSize:9,marginLeft:4}}>{suffix}</span>}</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:11,color:val>=70?"#fff":"#EF4444",fontWeight:600}}>{val}%</span>
                </div>
                <div style={{height:5,background:"rgba(245,245,240,0.07)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${val}%`,background:color,borderRadius:3,transition:"width 0.7s ease"}}/>
                </div>
              </div>
            ))}
          </div>

          {/* Warning cards */}
          {activeWarnings.length>0&&(
            <div style={{marginTop:16,textAlign:"left",display:"flex",flexDirection:"column",gap:8}}>
              {activeWarnings.map(w=>{
                const bg=w.severity==="danger"?"rgba(239,68,68,.12)":w.severity==="warning"?"rgba(245,166,35,.1)":"rgba(74,144,226,.1)";
                const border=w.severity==="danger"?"rgba(239,68,68,.3)":w.severity==="warning"?"rgba(245,166,35,.25)":"rgba(74,144,226,.25)";
                const ic=w.severity==="danger"?"#EF4444":w.severity==="warning"?"#F5A623":"#4A90E2";
                return(
                  <div key={w.type} onClick={e=>e.stopPropagation()} style={{background:bg,border:`1px solid ${border}`,borderRadius:12,padding:"12px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:`${ic}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{w.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>{w.title}</div>
                      <div style={{fontSize:11,color:"rgba(245,245,240,.6)",lineHeight:1.5,marginBottom:w.action?6:0}}>{w.message}</div>
                      {w.action&&<div style={{fontSize:11,color:ic,fontWeight:700}}>→ {w.action}</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();dismissWarning(w.type);}} style={{background:"none",border:"none",color:"rgba(245,245,240,.25)",cursor:"pointer",fontSize:16,padding:"0 2px",lineHeight:1,flexShrink:0}}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SUGGESTIONS ── */}
        {sc.tips.length>0&&(
          <div style={{margin:"0 20px 14px",padding:"16px 18px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>
              What would push you to {Math.min(99,sc.total+8)}+ tomorrow
            </div>
            {sc.tips.map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<sc.tips.length-1?9:0}}>
                <span style={{color:"var(--red)",fontSize:12,marginTop:1,flexShrink:0}}>→</span>
                <span style={{fontSize:13,color:"rgba(245,245,240,0.75)",lineHeight:1.5}}>{tip}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── WEEKLY REPORT (Mondays only) ── */}
        {weekReport&&(
          <div style={{margin:"0 20px 14px",padding:"18px 20px",background:"linear-gradient(135deg,rgba(126,87,194,.1),rgba(126,87,194,.04))",border:"1px solid rgba(126,87,194,.25)",borderRadius:16}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(126,87,194,.8)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>Last Week Recap</div>
            <div style={{display:"flex",gap:12,marginBottom:14}}>
              <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px"}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{weekReport.avg}</div>
                <div style={{fontSize:9,color:"rgba(245,245,240,.4)",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>Avg Score</div>
              </div>
              <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px"}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,color:"#00B894",lineHeight:1}}>{weekReport.best.score}</div>
                <div style={{fontSize:9,color:"rgba(245,245,240,.4)",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{weekReport.bestDay.slice(0,3)} Best</div>
              </div>
              <div style={{flex:1,textAlign:"center",background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px"}}>
                <div style={{fontFamily:"var(--condensed)",fontSize:28,fontWeight:900,color:"#EF4444",lineHeight:1}}>{weekReport.worst.score}</div>
                <div style={{fontSize:9,color:"rgba(245,245,240,.4)",textTransform:"uppercase",letterSpacing:1,marginTop:2}}>{weekReport.worstDay.slice(0,3)} Worst</div>
              </div>
            </div>
            {weekReport.insight&&(
              <div style={{fontSize:12,color:"rgba(245,245,240,.65)",lineHeight:1.7,borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:12}}>
                <span style={{color:"rgba(126,87,194,.9)",fontWeight:700}}>Biggest opportunity: </span>{weekReport.insight}
              </div>
            )}
          </div>
        )}

        {/* ── 7-DAY HISTORY CHART ── */}
        <div style={{margin:"0 20px 14px",padding:"16px 18px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase"}}>Your Trend</div>
            {trendLabel&&<div style={{fontSize:11,fontWeight:700,color:trendLabel.color}}>{trendLabel.icon} {trendLabel.text}</div>}
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:6,height:72}}>
            {last7.map((entry,i)=>{
              const h=entry.score!=null?Math.max(4,Math.round((entry.score/100)*72)):4;
              const c=entry.score==null?"rgba(255,255,255,0.06)":entry.score>=85?"#00B894":entry.score>=70?"#4A90E2":entry.score>=50?"#F5A623":"#EF4444";
              const dow=new Date(entry.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}).slice(0,2);
              const isToday2=entry.date===todayStr;
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{width:"100%",height:h,background:c,borderRadius:3,transition:"height 0.5s ease",border:isToday2?`1px solid ${c}`:"none",boxShadow:isToday2?`0 0 6px ${c}80`:"none"}}/>
                  {entry.score!=null&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",lineHeight:1}}>{entry.score}</div>}
                  <div style={{fontFamily:"var(--mono)",fontSize:8,color:isToday2?"rgba(245,245,240,0.6)":"rgba(245,245,240,0.2)",lineHeight:1}}>{dow}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── WATER HISTORY ── */}
        {waterHistory.length>0&&(()=>{
          const maxOz=Math.max(...waterHistory.map(d=>d.oz),waterTarget||80);
          return(
            <div style={{margin:"0 20px 14px",padding:"16px 18px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase"}}>Hydration — 7 Days</div>
                <div style={{fontFamily:"var(--mono)",fontSize:10,color:"#06B6D4"}}>Target: {waterTarget} oz</div>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:6,height:60}}>
                {waterHistory.map((entry,i)=>{
                  const h=Math.max(4,Math.round((entry.oz/maxOz)*60));
                  const pctOfTarget=entry.oz/Math.max(1,waterTarget);
                  const c=pctOfTarget>=1?"#00B894":pctOfTarget>=0.75?"#06B6D4":pctOfTarget>=0.5?"#F5A623":"#EF4444";
                  const dow=new Date(entry.date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short"}).slice(0,2);
                  const isToday2=entry.date===todayStr;
                  return(
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{width:"100%",height:h,background:c,borderRadius:3,border:isToday2?`1px solid ${c}`:"none",boxShadow:isToday2?`0 0 6px ${c}80`:"none"}}/>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.35)",lineHeight:1}}>{Math.round(entry.oz)}</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:isToday2?"rgba(245,245,240,0.6)":"rgba(245,245,240,0.2)",lineHeight:1}}>{dow}</div>
                    </div>
                  );
                })}
              </div>
              {waterTarget>0&&<div style={{height:1,background:"rgba(6,182,212,0.2)",borderRadius:1,marginTop:4,position:"relative"}}><div style={{position:"absolute",right:0,top:-9,fontFamily:"var(--mono)",fontSize:7,color:"rgba(6,182,212,0.5)"}}>goal</div></div>}
            </div>
          );
        })()}

        {/* ── WEEKLY NUTRITION CALENDAR ── */}
        {(()=>{
          const [expandedDay,setExpandedDay]=React.useState(null);
          const calColors={heavy_lower:"#4A90E2",heavy_upper:"#4A90E2",hypertrophy:"#4A90E2",long_run:"#00B894",tempo_run:"#00B894",easy_run:"#00B894",interval_run:"#00B894",hyrox_station:"#F5A623",hybrid:"#7E57C2",active_recovery:"#6B7280",rest:"#374151"};
          const minCal=Math.min(...weekMacros.map(d=>d.calories));
          const maxCal=Math.max(...weekMacros.map(d=>d.calories));
          return(
            <div style={{margin:"0 20px 14px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:16,padding:"16px 18px"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>Weekly Nutrition Targets</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:12}}>
                {weekMacros.map(d=>{
                  const isToday2=d.day===todayKey;
                  const c=calColors[d.dayType]||"#374151";
                  const barH=maxCal>minCal?Math.max(8,Math.round(((d.calories-minCal)/(maxCal-minCal))*48)+8):28;
                  return(
                    <button key={d.day} onClick={()=>setExpandedDay(expandedDay===d.day?null:d.day)}
                      style={{background:"none",border:`1.5px solid ${isToday2?c:"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",fontFamily:"inherit",position:"relative"}}>
                      <div style={{fontSize:8,fontWeight:700,color:isToday2?c:"rgba(245,245,240,0.35)",marginBottom:4,letterSpacing:1,textTransform:"uppercase"}}>{d.day}</div>
                      <div style={{height:barH,background:isToday2?c:`${c}55`,borderRadius:3,margin:"0 2px 4px",minHeight:8}}/>
                      <div style={{fontSize:8,fontWeight:700,color:isToday2?"#fff":"rgba(245,245,240,0.5)",lineHeight:1}}>{Math.round(d.calories/100)*100}</div>
                      {isToday2&&<div style={{position:"absolute",top:2,right:2,width:5,height:5,borderRadius:"50%",background:c}}/>}
                    </button>
                  );
                })}
              </div>
              {expandedDay&&(()=>{
                const d=weekMacros.find(x=>x.day===expandedDay);
                if(!d)return null;
                const c=calColors[d.dayType]||"#374151";
                return(
                  <div style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div>
                        <div style={{fontSize:10,color:c,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{d.day} — {d.label}</div>
                        <div style={{fontSize:12,color:"rgba(245,245,240,0.7)",lineHeight:1.5}}>{d.keyInsight}</div>
                      </div>
                      <div style={{fontSize:18,fontWeight:900,color:"#fff",flexShrink:0}}>{d.calories.toLocaleString()}<span style={{fontSize:10,color:"rgba(245,245,240,0.4)",fontWeight:400}}> kcal</span></div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      {[["P",d.protein,"g","var(--red)"],["C",d.carbs,"g","var(--blue)"],["F",d.fat,"g","var(--amber)"]].map(([l,v,u,c2])=>(
                        <div key={l} style={{flex:1,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px",textAlign:"center"}}>
                          <div style={{fontSize:9,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>{l}</div>
                          <div style={{fontSize:16,fontWeight:800,color:c2}}>{v}<span style={{fontSize:10,color:"rgba(245,245,240,0.4)",fontWeight:400}}>{u}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ── CHART STACK — ordered & filtered by settings ── */}
        {!workoutsLoaded
          ?<ProgressSkeleton/>
          :orderedChartKeys.map(key=>(
            <ChartWrap key={key} chartKey={key}
              onHide={()=>saveChartSettings({...chartSettings,visible_charts:{...chartSettings.visible_charts,[key]:false}})}
              onExplain={()=>setExplainChartKey(key)}>
              {renderChart(key)}
            </ChartWrap>
          ))
        }

        {/* Chart settings overlay */}
        {chartSettingsOpen&&(
          <ChartSettingsScreen
            settings={chartSettings}
            onSave={saveChartSettings}
            onClose={()=>setChartSettingsOpen(false)}
          />
        )}

        {/* Explain overlay */}
        {explainChartKey&&(
          <ChartExplainModal chartKey={explainChartKey} onClose={()=>setExplainChartKey(null)}/>
        )}

        {/* ── INJURY HISTORY + ACWR RISKS ── */}
        <InjuryHistorySection
          injuryLogs={injuryLogs}
          injuryRisks={acwrRisks}
          onResolve={async(id)=>{
            await resolveInjury(id).catch(()=>{});
            setInjuryLogs(prev=>prev.map(l=>l.id===id?{...l,resolved_at:new Date().toISOString()}:l));
          }}
          onLogNew={()=>setShowPainLogModal(true)}
        />

        {/* ── PR PREDICTIONS ── */}
        {(()=>{
          const runActs = allActs.filter(a=>(a.type||"").toLowerCase().includes("run")&&parseFloat(a.distanceKm)>1);
          return <PRPredictionCard predictions={prPredictions} runActs={runActs} wPrefs={wPrefs} wUnit={profile?.wUnit||"lbs"}/>;
        })()}

        {/* ── STATS GRID ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"0 20px 14px"}}>
          {[
            {k:"Bodyweight",v:`${profile.weight||"—"}`,u:profile.wUnit||"kg"},
            {k:"Training Streak",v:`${profile.streak||workoutLogsRaw.length}`,u:"sessions"},
            {k:"Daily Target",v:`${macros.calories.toLocaleString()}`,u:"kcal"},
            {k:"Adherence",v:`${workoutLogsRaw.length>0?Math.min(94,Math.round(workoutLogsRaw.length/Math.max(1,programWeek)*25)):"—"}`,u:"%"},
          ].map((s,i)=>(
            <div key={i} style={{padding:"12px 14px",background:"var(--navy-card)",border:"1px solid var(--white-border)",borderRadius:14}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"var(--white-dim)",textTransform:"uppercase",marginBottom:6}}>{s.k}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginTop:2}}>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:800,fontSize:28,lineHeight:1}}>{s.v}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--white-dim)"}}>{s.u}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── WORKOUT HISTORY ── */}
        {workoutLogsRaw.length>0&&<WorkoutHistorySection logs={workoutLogsRaw}/>}

        {/* ── BODYWEIGHT LOG ── */}
        <BodyweightSection logs={bodyweightLogs} user={user} setLogs={setBodyweightLogs} wUnit={profile?.wUnit||"lbs"}/>

        <AthletePassport profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile}/>
        <TrainingDNA profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>
        <PerformanceCalendar profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>
        {(wPrefs.isHyrox||(wPrefs.splitType||"").toLowerCase().includes("run"))&&<RacePredictor profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile}/>}
        <div style={{height:24}}/>
      </div>
    );
  }

  return (
    <div style={{position:"relative",minHeight:"100vh",maxWidth:480,margin:"0 auto",background:"var(--navy)"}}>
      <style>{GLOBAL_CSS}</style>
      {/* Toast container */}
      <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",zIndex:9999,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none",width:"min(380px,90vw)"}}>
        {toasts.map(toast=>(
          <div key={toast.id} style={{background:toast.type==="pr"?"linear-gradient(135deg,#FFD700,#FFA000)":toast.type==="error"?"#ef4444":toast.type==="info"?"#3b82f6":T.prot,color:"#fff",padding:"13px 18px",borderRadius:14,fontSize:13,fontWeight:700,boxShadow:"0 4px 24px rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:10,animation:"toast-in 0.22s cubic-bezier(.2,.7,.3,1) forwards",pointerEvents:"auto",whiteSpace:"nowrap",maxWidth:"100%",letterSpacing:"0.02em"}}>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis"}}>{toast.message}</span>
            {toast.action&&<button onClick={()=>{hap();toast.action();setToasts(t=>t.filter(x=>x.id!==toast.id));}} style={{background:"rgba(255,255,255,0.22)",border:"none",borderRadius:8,padding:"4px 10px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}}>{toast.actionLabel||"Undo"}</button>}
          </div>
        ))}
      </div>

      {showHealthModal&&<AppleHealthModal onConnect={handleHealthConnect} onDismiss={dismissHealthModal}/>}
      {bioScreen&&<BioAlgorithmScreen user={user} profile={profile} onClose={()=>setBioScreen(false)}/>}
      {showInjuryRiskModal&&acwrRisks[showInjuryRiskModal]&&(
        <InjuryRiskModal
          risk={acwrRisks[showInjuryRiskModal]}
          region={showInjuryRiskModal}
          onProtect={()=>{showToast(`Protecting ${showInjuryRiskModal.replace("_"," ")} — modified program active`,"success");setShowInjuryRiskModal(null);}}
          onOverride={()=>{showToast("Got it — proceeding as normal","info");setShowInjuryRiskModal(null);}}
          onClose={()=>setShowInjuryRiskModal(null)}
        />
      )}
      {showPainLogModal&&(
        <PainLogModal
          user={user}
          onSave={async(data)=>{
            await handleLogPain(data);
            setShowPainLogModal(false);
          }}
          onClose={()=>setShowPainLogModal(false)}
        />
      )}
      {showAdaptationModal&&metabolicAdaptation&&(
        <MetabolicAdaptationModal
          adaptation={metabolicAdaptation}
          onStartProtocol={handleStartMetabolicProtocol}
          onDismiss={()=>setShowAdaptationModal(false)}
        />
      )}
      {!isOnline&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:"rgba(239,68,68,0.95)",padding:"max(env(safe-area-inset-top),10px) 16px 10px",display:"flex",alignItems:"center",justifyContent:"center",gap:8,backdropFilter:"blur(8px)"}}>
        <span style={{fontSize:14}}>📡</span>
        <span style={{fontSize:13,fontWeight:700,color:"#fff",letterSpacing:"0.03em"}}>No internet connection — data may be outdated</span>
      </div>}
      <div ref={appScreenRef} className="app-screen grid-bg" onTouchStart={onPullStart} onTouchEnd={onPullEnd} style={{paddingTop:!isOnline?"48px":undefined}}>
        {isRefreshing&&<div style={{position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"center",paddingTop:4,pointerEvents:"none"}}><div style={{background:"rgba(232,52,28,0.15)",border:"1px solid rgba(232,52,28,0.3)",borderRadius:20,padding:"4px 14px",fontSize:12,color:"rgba(245,245,240,0.6)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.08em",textTransform:"uppercase"}}>Refreshing…</div></div>}
        {section==="home"&&<ErrorBoundary><HomeSection/></ErrorBoundary>}
        {section==="train"&&<ErrorBoundary><TrainSection profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} trainScreen={trainScreen} setTrainScreen={setTrainScreen} workout={workout} workoutLoading={workoutLoading} generateWorkout={generateWorkout} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} restActive={restActive} restTimer={restTimer} logSet={logSet} finishWorkout={finishWorkout} getSuggestion={getSuggestion} history={history} planMode={planMode} setPlanMode={setPlanMode} runPlan={runPlan} setRunPlan={setRunPlan} hybridMix={hybridMix} setHybridMix={setHybridMix} startStructured={startStructured} todayKey={todayKey} todayType={todayType} todayFocus={todayFocus} cfg={cfg} isMobile={isMobile} user={user} lastLoggedSet={lastLoggedSet} setFlash={setFlash} skipRest={skipRest} adjustRest={adjustRest} workoutSummary={workoutSummary} clearWorkoutSummary={clearWorkoutSummary} workoutStartTime={workoutStartTime} sessionCount={workoutLogsRaw.length} sessionPrediction={sessionPrediction} onLogPain={handleLogPain} acwrHighRisks={acwrHighRisks}/></ErrorBoundary>}
        {section==="fuel"&&<ErrorBoundary><FuelSection log={log} setLog={setLog} macros={macros} consumed={consumed} remaining={remaining} cfg={cfg} todayType={todayType} todayFocus={todayFocus} earnedCals={earnedCals} todayActs={todayActs} fuelScreen={fuelScreen} setFuelScreen={setFuelScreen} foodInput={foodInput} setFoodInput={setFoodInput} logging={logging} logMsg={logMsg} aiLog={aiLog} logMode={logMode} setLogMode={setLogMode} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} barcodeResult={barcodeResult} barcodeLoading={barcodeLoading} scanBarcode={scanBarcode} addBarcode={addBarcode} quickFields={quickFields} setQF={setQF} addQuick={addQuick} removeLog={removeLog} recs={recs} recsLoading={recsLoading} fetchRecs={fetchRecs} recipes={recipes} recipesLoading={recipesLoading} fetchRecipes={fetchRecipes} fastProto={fastProto} setFastProto={setFastProto} fastActive={fastActive} setFastActive={setFastActive} fastStart={fastStart} setFastStart={setFastStart} fastCustomH={fastCustomH} setFastCustomH={setFastCustomH} fastHours={fastHours} fastElapsed={fastElapsed} fastPct={fastPct} fastRemaining={fastRemaining} eatOpen={eatOpen} city={city} setCity={setCity} isMobile={isMobile} user={user} wPrefs={wPrefs} setWPrefs={setWPrefs} schedule={schedule} setSchedule={setSchedule} todayKey={todayKey} periodizationInfo={wPrefs.nutritionPeriodization?periodizationInfo:null} logEntry={logEntry} profile={profile} dayNutrition={dayNutrition} weekMacros={weekMacros} waterTarget={waterTarget} waterLogs={waterLogs} onAddWater={handleAddWater} onDeleteWater={handleDeleteWater} logDate={logDate} setLogDate={setLogDate} metabolicProtocol={metabolicAdaptation?.status==="active"?{progress:getProtocolProgress(metabolicAdaptation),onComplete:handleCompleteAdaptation}:null} onOpenPhotoLogger={()=>setShowPhotoLogger(true)}/></ErrorBoundary>}
        {showPhotoLogger&&<PhotoFoodLogger user={user} profile={profile} onLog={handlePhotoLog} onClose={()=>setShowPhotoLogger(false)} log={log}/>}
        {section==="progress"&&<ErrorBoundary><ProgressSection/></ErrorBoundary>}
        {section==="settings"&&<ErrorBoundary><SettingsSection profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} todayKey={todayKey} isMobile={isMobile} onSignOut={onSignOut} user={user} onPreviewBrief={previewMorningBrief} calendarConnected={calendarConnected} onCalendarConnect={handleConnectCalendar} onCalendarDisconnect={handleDisconnectCalendar} onLogInjury={()=>setShowPainLogModal(true)}/></ErrorBoundary>}
      </div>
      <div className="app-tab-bar">
        {NAV_ITEMS.map(item=>(
          <button key={item.id} aria-label={item.label} aria-current={section===item.id?"page":undefined} className={`app-tab${section===item.id?" active":""}`} onClick={()=>setSection(item.id)}>
            <div className="tab-icon-wrap" style={{position:"relative"}}>
              <TabIcon name={item.icon} size={22}/>
              {item.id==="train"&&deloadActive&&<span style={{position:"absolute",top:-3,right:-4,width:8,height:8,borderRadius:"50%",background:"#F5A623",border:"2px solid var(--navy)"}}/>}
              {item.id==="train"&&!deloadActive&&topRiskLevel&&<span style={{position:"absolute",top:-3,right:-4,width:8,height:8,borderRadius:"50%",background:topRiskLevel==="high"?"#EF4444":topRiskLevel==="moderate"?"#F97316":"#F5A623",border:"2px solid var(--navy)"}}/>}
            </div>
            <div className="tab-label-txt">{item.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
