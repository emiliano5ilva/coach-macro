import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { T, GLOBAL_CSS, REDESIGN_CSS, GOCLUB_REDESIGN, SHOW_DEBUG, WDAYS, DAY_CFG, SPLIT_CYCLES, FOCUS_MUSCLES, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, FASTING_PROTOCOLS, BF_DATA, BF_VISUAL,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, BodyFigure, InfoTip, ErrorBoundary,
  DashboardSkeleton, ScoreSkeleton, CardSkeleton, ProgressSkeleton, CalendarSkeleton,
  calcTDEE, autoFocus, useCountUp, lookupBarcode,
  getDayMacros, getTodayKey, isToday, hap, hapPR, hapSuccess, pad2 } from "./components.jsx";
import { showToast, subscribeToast } from "./utils/toast.js";
import { TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES,
  PROMOS, AthletePassport, TrainingDNA, PerformanceCalendar, RacePredictor,
  WeekStrip } from "./sections.jsx";
import { getWorkoutForDay } from "./programs.js";
import { FuelSection } from "./fuel.jsx";
import { sb, ai, streamAI } from "./client.js";
import { track, EVENTS, trackError } from "./services/analytics.js";
import { getCyclePhase } from "./utils/ait.js";
import { getCycleNutrition, getConsistencyScore, showConsistencyScore, isCalorieFreeMode } from "./utils/female.js";
import { getDayType, getDayTypeNutrition, getWeekNutrition, getDailyWaterTarget } from "./utils/dayTypeNutrition.js";
import { getWaterLogs, addWaterLog, deleteWaterLog, getWaterHistory } from "./services/foodDatabase.js";
import { displayDistance, distanceLabel } from "./utils/units.js";
import { recordWorkoutBioData, getInsights, getDataPointCounts, calcPerformanceScore } from "./services/biologicalAlgorithm.js";
import { calculatePRProbability, generateWeeklyForecast, calculateGoalTrajectories, calcNutritionAdherence7d, trackPredictionOutcome } from "./services/predictionEngine.js";
import { detectMetabolicAdaptation, generateAdaptationProtocol, buildProtocolPhases, saveDetectedAdaptation, getActiveAdaptation, dismissAdaptation, startProtocol as startMetabolicProtocol, completeProtocol, getProtocolProgress } from "./services/metabolicAdaptation.js";
import { MetabolicAdaptationBanner, MetabolicAdaptationModal, MetabolicResetProgressCard } from "./MetabolicAdaptation.jsx";
import { requestCalendarAccess, checkCalendarAuthorized, getUpcomingEvents } from "./services/calendarService.js";
import { analyzeScheduleForTraining, buildHotelWorkout } from "./services/calendarAnalysis.js";
import { ScheduleAlertCard, TravelNutritionCard, CalendarConnectPrompt } from "./LifeAwareTraining.jsx";
import { saveMealToMemory } from "./services/macroMemoryService.js";
import BioAlgorithmScreen from "./BioAlgorithm.jsx";
import { FlagBtn } from "./FlagBtn.jsx";
import FeatureStrip from "./components/FeatureStrip.jsx";
import { getMorningBrief } from "./services/morningBriefService.js";
import { getHyroxPhase, getRaceTimePredictor } from "./services/hyroxPeriodisationService.js";
import SorenessCheckIn, { SorenesSummary } from "./components/SorenessCheckIn.jsx";
import { trainedYesterday, alreadyLoggedToday, getTodaySoreness } from "./services/sorenessService.js";
import { getSlotsForFreq, getSlotTargets, getLoggedSlots } from "./utils/mealSlots.js";
import { trialExpiringSoon, trialDaysRemaining } from "./utils/subscription.js";
import { calculateAllRisks, logInjury, getInjuryLogs, resolveInjury, getInjuryFreeDays, detectPatterns } from "./services/injuryRisk.js";
import { InjuryHistorySection, InjuryRiskModal, PainLogModal } from "./InjuryPrevention.jsx";
import { initAppleHealth, checkAppleHealthAuthorized, getDailyHealthSnapshot, getMorningAdjustment, stepsToCalorieBonus } from "./services/appleHealth.js";
import { getAIErrorMessage } from "./utils/errors.js";
import { MuscleVolumeChart } from "./MuscleVolumeChart.jsx";
import { FluxRangeChart, PeakPerformanceChart } from "./PerformanceCharts.jsx";
import { BodyCompositionVector, GoalProbabilityCone, BalanceCheck } from "./ProgressCharts2.jsx";
import { NutritionPerformanceChart, WeightTrendChart, MacroCalendarHeatmap, SleepPerformanceChart, AthleteWaveformChart, RunPaceChart, RunWeeklyMilesChart, RunTrainingLoadChart } from "./ProgressCharts3.jsx";
import ChartSettingsScreen, { CHART_REGISTRY, DEFAULT_SETTINGS as CHART_DEFAULT_SETTINGS, ChartWrap, ChartExplainModal } from "./screens/ChartSettings.jsx";
import PhotoFoodLogger from "./PhotoFoodLogger.jsx";
import { checkDeloadNeeded, getActiveDeload, getDeloadHistory, skipDeload, activateUpcomingDeload, completeExpiredDeload } from "./services/deloadService.js";
import { detectPlateaus, getActivePlateaus, checkPlateauResolved, getStrategyByName } from "./services/plateauService.js";
import { calculateMuscleBalance, getBalanceCorrections, getLatestBalance } from "./services/muscleBalanceService.js";
import { checkPeriodisationAdjustment, getRecentAdjustments, getProgramCurrentWeek } from "./services/periodisationService.js";
import { analyseRPETrends } from "./services/rpeTrendingService.js";
import { getTodayNutritionProtocol } from "./services/nutritionPeriodisationService.js";
import { getRunningPhase, getRunTimePredictor } from "./services/runningPeriodisationService.js";
import { getStrengthPhase, getStrengthPredictor } from "./services/strengthPeriodisationService.js";
import MuscleRecovery from "./components/MuscleRecovery.jsx";
import MorningCheckin from "./components/MorningCheckin.jsx";
import { recordWorkoutRecovery } from "./services/recoveryService.js";
import SpotlightTour from "./components/SpotlightTour.jsx";
import FeatureUnlockCard from "./components/FeatureUnlockCard.jsx";
import { checkFeatureUnlocks, getPendingUnlock, getUserStats, markUnlockShown, markAppTourComplete, triggerEventUnlock, APP_TOUR_STEPS } from "./services/featureUnlockService.js";
import WinScreen from "./components/WinScreen.jsx";
import StreakCard from "./components/StreakCard.jsx";
import { getWin, checkStreakWins, markStreakWinShown } from "./services/winService.js";
import CollapsibleAlert from "./components/CollapsibleAlert.jsx";
import { computeExpenditure, storeExpenditure, getExpenditureHistory, computeTodaysBurn, checkDataDrift } from "./services/expenditureService.js";
import { runDailyValidationSuite, dismissInsight } from "./services/validationService.js";
import { getAdaptiveFactors, detectSystematicBias, applyAdaptiveFactors, recalibrateFactors } from "./services/adaptiveLearningService.js";
import { generateProactiveAdjustments } from "./services/predictiveService.js";
import { buildContextSnapshot, recordMemory, recallApplicableLearnings, updateMemoryOutcomes, detectRecurringPatterns, getAllMemories, getUserPatterns, deleteMemory, exportMemories } from "./services/coachMemoryService.js";
import { detectActivePatterns, generateIntervention, recordPatternDetection, dismissPattern, trackInterventionOutcome, FAILURE_PATTERNS } from "./services/failurePatternService.js";
import { detectPrimaryPersonality, adaptMessageSync, trackUserEvent, setManualOverride, getPersonalityProfile, getProfileSync, PERSONALITY_TYPES } from "./services/personalityService.js";
import { getConnectionsData, identifyActiveInfluencers, predictDownstreamEffects, getConnectionInsights, getNodeStatus, formatMetricValue, METRIC_META } from "./services/connectionsService.js";
import { runOutreachCheck, calibrateFrequency } from "./services/outreachService.js";
import { getPeerComparison, assignCohort, getOptIn, setOptIn as setPeerOptIn, getPercentileLabel, interpolatePercentile } from "./services/peerComparisonService.js";
import { getUserMode, getUserTier, getVisibleSections, getProgressTabs } from "./utils/dashboardResolver.js";
import { COACH_SCORE_LABELS, RING_CONFIG } from "./config/dashboardConfig.js";
import { getPostWorkoutWindow } from "./services/nutritionTimingService.js";

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
          <div key={o.v} onClick={()=>toggle(o.v)} style={{background:d.conditions.includes(o.v)?`rgba(var(--accent-rgb),0.03)`:T.s2,border:`1.5px solid ${d.conditions.includes(o.v)?T.prot:T.bd}`,borderRadius:12,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
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
          <div key={o.v} onClick={()=>toggle(o.v)} style={{background:hc.includes(o.v)?`rgba(var(--accent-rgb),0.03)`:T.s2,border:`1.5px solid ${hc.includes(o.v)?T.prot:T.bd}`,borderRadius:12,padding:"13px 15px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
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
          <div key={o.v} onClick={()=>{upd("goal",o.v);setGR("");}} style={{flex:1,background:d.goal===o.v?`rgba(var(--accent-rgb),0.06)`:T.s2,border:`2px solid ${d.goal===o.v?T.prot:T.bd}`,borderRadius:12,padding:"18px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.2s"}}>
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
        {rec&&<div style={{background:`rgba(var(--accent-rgb),0.03)`,border:`1.5px solid rgba(var(--accent-rgb),0.25)`,borderRadius:12,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><div style={{fontSize:14}}>⭐</div><div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{rec.reason}</div></div>
          <div style={{fontSize:13,color:"#ccc",lineHeight:1.65,marginBottom:10}}>{rec.why}</div>
          <button onClick={()=>setGR(rec.rate)} style={{padding:"8px 16px",background:goalRate===rec.rate?T.prot:`rgba(var(--accent-rgb),0.12)`,color:goalRate===rec.rate?"#fff":T.prot,border:`1px solid rgba(var(--accent-rgb),0.31)`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>{goalRate===rec.rate?"✓ Selected":"Select This →"}</button>
        </div>}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.dim,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>All options</div>
          {(rates[d.goal]||[]).map(r=>{const info=rateInfo[r];const isRec=rec&&r===rec.rate;return(
            <div key={r} onClick={()=>setGR(r)} style={{background:goalRate===r?`rgba(var(--accent-rgb),0.06)`:T.s2,border:`1.5px solid ${goalRate===r?T.prot:isRec?`rgba(var(--accent-rgb),0.19)`:T.bd}`,borderRadius:11,padding:"12px 15px",marginBottom:7,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:13,fontWeight:600,color:goalRate===r?T.prot:"#fff"}}>{info.label}</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>{info.result}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>{isRec&&<div style={{fontSize:9,color:T.prot,background:`rgba(var(--accent-rgb),0.08)`,border:`1px solid rgba(var(--accent-rgb),0.19)`,borderRadius:8,padding:"2px 7px",fontWeight:700}}>Recommended</div>}{goalRate===r&&<div style={{color:T.prot,fontSize:16}}>✓</div>}</div>
            </div>
          );})}
        </div>
      </>}
      {d.goal&&<div style={{background:"#070E1A",border:`1px solid rgba(var(--accent-rgb),0.19)`,borderRadius:13,padding:"16px",marginBottom:20}}>
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
            <div key={o.v} onClick={()=>upd("goalTimeline",o.v)} style={{background:d.goalTimeline===o.v?`rgba(var(--accent-rgb),0.06)`:T.s2,border:`1.5px solid ${d.goalTimeline===o.v?T.prot:T.bd}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all .2s"}}>
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
    <div style={{margin:"0 20px 14px",padding:"16px 18px",background:"#0d1508",border:"1px solid rgba(245,158,11,0.3)",borderLeft:`3px solid ${T.fat}`,borderRadius:"4px 14px 14px 4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:14}}>⚠️</span>
        <div style={{fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.16em",color:T.fat,textTransform:"uppercase",fontWeight:700}}>Deload Recommended</div>
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
      <div style={{fontSize:11,color:"rgba(245,158,11,0.6)",lineHeight:1.7,marginBottom:14,fontStyle:"italic"}}>
        "This is not failure. This is strategy.<br/>Elite athletes deload every 4–8 weeks."
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onStart} style={{flex:2,padding:"12px",background:"var(--red)",border:"none",borderRadius:10,color:"#fff",fontFamily:"var(--condensed)",fontWeight:800,fontSize:13,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>Start Deload Week →</button>
        <button onClick={onDismiss} style={{flex:1,padding:"12px",background:"transparent",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:10,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",fontSize:11,cursor:"pointer"}}>Tomorrow</button>
      </div>
    </div>
  );
}

function DeloadActiveBadge({daysLeft, onComplete}) {
  return (
    <div style={{margin:"0 20px 14px",padding:"14px 18px",background:"rgba(245,158,11,0.06)",border:"1px solid rgba(245,158,11,0.25)",borderLeft:`3px solid ${T.fat}`,borderRadius:"4px 14px 14px 4px",display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:20}}>🔄</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:"var(--mono)",fontSize:10,color:T.fat,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,marginBottom:3}}>Deload Week Active</div>
        <div style={{fontSize:12,color:"rgba(245,245,240,0.55)"}}>{daysLeft>0?`${daysLeft} day${daysLeft===1?"":"s"} remaining — 60% weights, 12–15 reps`:"Deload complete — returning to full program"}</div>
      </div>
      {daysLeft<=0&&<button onClick={onComplete} style={{padding:"8px 14px",background:"var(--green)",border:"none",borderRadius:8,color:"#000",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:"0.08em",whiteSpace:"nowrap"}}>Resume →</button>}
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
  const isElite=score>=90;
  const isGreat=score>=85;
  const color=isElite?"#FFD700":isGreat?T.green:score>=70?T.carb:score>=50?T.fat:"#EF4444";

  // Animate ring fill from empty on mount
  const [offset,setOffset]=useState(C);
  useEffect(()=>{
    const id=requestAnimationFrame(()=>setOffset(C*(1-score/100)));
    return()=>cancelAnimationFrame(id);
  },[score]);

  const displayScore=useCountUp(score,1200);

  const tierLabel=isElite?"ELITE":isGreat?"GREAT":score>=70?"GOOD":score>=50?"FAIR":"LOW";
  const tierColor=isElite?"#FFD700":isGreat?T.green:score>=70?T.carb:score>=50?T.fat:"#EF4444";

  return (
    <div style={{position:"relative",width:180,height:180,margin:"0 auto"}}>
      {isElite&&(
        <>
          <style>{`@keyframes score-glow-pulse{0%,100%{opacity:.35}50%{opacity:.85}}`}</style>
          <div style={{
            position:"absolute",inset:-8,borderRadius:"50%",
            boxShadow:"0 0 40px 12px rgba(255,215,0,0.3)",
            animation:"score-glow-pulse 2s ease-in-out infinite",
            pointerEvents:"none",
          }}/>
        </>
      )}
      <svg width={180} height={180} style={{
        transform:"rotate(-90deg)",display:"block",
        filter:isElite?"drop-shadow(0 0 6px rgba(255,215,0,0.55))":"none",
        transition:"filter 0.32s cubic-bezier(.2,.7,.3,1)",
      }}>
        <circle cx={90} cy={90} r={R} stroke="rgba(var(--accent-rgb),0.06)" strokeWidth={14} fill="none"/>
        <circle cx={90} cy={90} r={R} stroke={color} strokeWidth={14} fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          style={{transition:"stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1), stroke 0.32s"}}
        />
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0}}>
        <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:62,lineHeight:1,color:isElite?"#FFD700":"#fff",transition:"color 0.32s"}}>{displayScore}</div>
        <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.32)",letterSpacing:"0.18em",textTransform:"uppercase",marginTop:3}}>Coach Macro Score</div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,color:tierColor,letterSpacing:"0.14em",textTransform:"uppercase",marginTop:4,fontWeight:700,transition:"color 0.32s"}}>{tierLabel}</div>
      </div>
    </div>
  );
}

function CoachScoreRing({score, ringColor, scoreStatus, scoreLabels, sc}) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - start) / 800);
      setDisplayScore(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p < 1) { raf = requestAnimationFrame(tick); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const sz = 90, r = 38, sw = 14;
  const circ = parseFloat((2 * Math.PI * r).toFixed(1));
  const pct = Math.min(1, score / 100);
  const fillLen = parseFloat((pct * circ).toFixed(1));
  // Arc uses rotate(-90 cx cy) on the circle, so arc starts at 12-o'clock;
  // tip angle is in global SVG coords (CCW from right, y-down)
  const tipAngle = pct * 2 * Math.PI - Math.PI / 2;
  const tipX = (sz / 2 + r * Math.cos(tipAngle)).toFixed(2);
  const tipY = (sz / 2 + r * Math.sin(tipAngle)).toFixed(2);

  const rc = ringColor === 'var(--accent)' ? '#e8341c' : ringColor;
  const tintMap = {'#FFD700':'#FFF59D','#22c55e':'#86efac','#60a5fa':'#bfdbfe','#FEA020':'#fde68a','#e8341c':'#fca5a5'};
  const tint = tintMap[rc] || '#f5f5f0';
  const mno = {fontFamily:"'DM Mono','SF Mono',monospace"};
  const cnd = {fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900};

  return (
    <>
      <style>{`
        @keyframes csRingSweep{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${(circ-fillLen).toFixed(1)}}}
        @keyframes csBarGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
      `}</style>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:4}}>
        {/* Ring */}
        <div style={{position:"relative",width:sz,height:sz,flexShrink:0}}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{overflow:"visible",display:"block"}}>
            <defs>
              <linearGradient id="csRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={rc}/>
                <stop offset="100%" stopColor={tint} stopOpacity="0.85"/>
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(245,245,240,0.12)" strokeWidth={sw}/>
            {/* Active arc */}
            <circle cx={sz/2} cy={sz/2} r={r} fill="none"
              stroke="url(#csRingGrad)" strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={(circ-fillLen).toFixed(1)}
              transform={`rotate(-90 ${sz/2} ${sz/2})`}
              style={{animation:'csRingSweep 0.8s cubic-bezier(.2,.7,.3,1) both'}}/>
            {/* Tip glow dot */}
            {pct>0.02&&(
              <circle cx={tipX} cy={tipY} r={6} fill={rc}
                style={{filter:`drop-shadow(0 0 6px ${rc}) drop-shadow(0 0 12px ${rc}66)`}}/>
            )}
          </svg>
          {/* Center labels — HTML overlay for textShadow */}
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <div style={{...cnd,fontSize:22,color:"#f5f5f0",lineHeight:1,textShadow:"0 0 30px rgba(245,245,240,0.12), 0 2px 24px rgba(0,0,0,0.8)"}}>{displayScore}</div>
            <div style={{...mno,fontSize:8,color:rc,letterSpacing:"0.1em",marginTop:2}}>{scoreStatus}</div>
          </div>
        </div>

        {/* Sub-score bars */}
        <div style={{flex:1}}>
          {[
            {l:scoreLabels[0],v:sc.t,c:"var(--accent)",r60:"rgba(232,52,28,0.6)"},
            {l:scoreLabels[1],v:sc.n,c:"#22c55e",r60:"rgba(34,197,94,0.6)"},
            {l:scoreLabels[2],v:sc.r,c:"#60a5fa",r60:"rgba(96,165,250,0.6)"},
            {l:scoreLabels[3],v:sc.c,c:"#FEA020",r60:"rgba(254,160,32,0.6)"},
          ].map(({l,v,c,r60},i)=>(
            <div key={l} style={{marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{...mno,fontSize:8,color:"rgba(245,245,240,0.45)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{l}</span>
                <span style={{...mno,fontSize:9,color:v>=70?"#f5f5f0":"rgba(245,245,240,0.45)"}}>{v}%</span>
              </div>
              <div style={{height:4,background:"rgba(245,245,240,0.07)",borderRadius:2,overflow:"hidden"}}>
                <div style={{
                  height:"100%",width:`${v}%`,
                  background:`linear-gradient(90deg,${c},${r60})`,
                  borderRadius:2,
                  transformOrigin:"left center",
                  animation:`csBarGrow 0.7s cubic-bezier(.2,.7,.3,1) ${80*i}ms both`,
                }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── RING + GAUGE COMPONENTS ────────────────────────────────────────────────

function MiniRing({pct, value, label, color, index=0}) {
  const isNum = typeof value === 'number';
  const [display, setDisplay] = useState(isNum ? 0 : value);
  useEffect(()=>{
    if(!isNum){setDisplay(value);return;}
    let raf;
    const to = setTimeout(()=>{
      const start=performance.now();
      const tick=now=>{
        const p=Math.min(1,(now-start)/700);
        setDisplay(Math.round((1-Math.pow(1-p,3))*value));
        if(p<1){raf=requestAnimationFrame(tick);}
      };
      raf=requestAnimationFrame(tick);
    },index*100);
    return()=>{clearTimeout(to);cancelAnimationFrame(raf);};
  },[value,index,isNum]);

  const sz=72,r=28,sw=9;
  const circ=parseFloat((2*Math.PI*r).toFixed(1));
  const pctDec=Math.min(1,Math.max(0,pct/100));
  const fillLen=parseFloat((pctDec*circ).toFixed(1));
  const tipAngle=pctDec*2*Math.PI-Math.PI/2;
  const tipX=(sz/2+r*Math.cos(tipAngle)).toFixed(2);
  const tipY=(sz/2+r*Math.sin(tipAngle)).toFixed(2);
  const rc=color==='var(--accent)'?'#e8341c':color;
  const animName=`mrSweep${index}`;
  const mno={fontFamily:"'DM Mono','SF Mono',monospace"};
  const cnd={fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900};
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:1}}>
      <style>{`@keyframes ${animName}{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${(circ-fillLen).toFixed(1)}}}`}</style>
      <div style={{position:"relative",width:sz,height:sz}}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{overflow:"visible",display:"block"}}>
          <defs>
            <linearGradient id={`mrGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8341c"/>
              <stop offset="100%" stopColor="#ff6b5c" stopOpacity="0.9"/>
            </linearGradient>
          </defs>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(245,245,240,0.12)" strokeWidth={sw}/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none"
            stroke={`url(#mrGrad${index})`} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={(circ-fillLen).toFixed(1)}
            transform={`rotate(-90 ${sz/2} ${sz/2})`}
            style={{animation:`${animName} 0.8s cubic-bezier(.2,.7,.3,1) ${index*100}ms both`}}/>
          {pctDec>0.02&&(
            <circle cx={tipX} cy={tipY} r={4} fill="#e8341c"
              style={{filter:'drop-shadow(0 0 5px rgba(232,52,28,0.8)) drop-shadow(0 0 10px rgba(232,52,28,0.4))'}}/>
          )}
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
          <div style={{...cnd,fontSize:13,color:"#f5f5f0",lineHeight:1}}>{display}</div>
        </div>
      </div>
      <div style={{...mno,fontSize:8,color:rc,textTransform:"uppercase",letterSpacing:"0.1em",textAlign:"center",lineHeight:1.3,whiteSpace:"pre-line"}}>{label}</div>
    </div>
  );
}

function RecoveryGauge({score}) {
  const [display,setDisplay]=useState(0);
  useEffect(()=>{
    let raf;
    const start=performance.now();
    const tick=now=>{
      const p=Math.min(1,(now-start)/800);
      setDisplay(Math.round((1-Math.pow(1-p,3))*score));
      if(p<1){raf=requestAnimationFrame(tick);}
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[score]);

  const label=score>=90?"RECOVERED":score>=70?"PRIMED":score>=50?"RECOVERING":"FATIGUED";
  const rc=score>=90?"#22c55e":score>=70?"#60a5fa":score>=50?"#FEA020":"#e8341c";
  const tintMap={"#22c55e":"#86efac","#60a5fa":"#bfdbfe","#FEA020":"#fde68a","#e8341c":"#fca5a5"};
  const tint=tintMap[rc]||'#f5f5f0';
  const sz=90,r=38,sw=14;
  const circ=parseFloat((2*Math.PI*r).toFixed(1));
  const pct=Math.min(1,score/100);
  const fillLen=parseFloat((pct*circ).toFixed(1));
  const tipAngle=pct*2*Math.PI-Math.PI/2;
  const tipX=(sz/2+r*Math.cos(tipAngle)).toFixed(2);
  const tipY=(sz/2+r*Math.sin(tipAngle)).toFixed(2);
  const mno={fontFamily:"'DM Mono','SF Mono',monospace"};
  const cnd={fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900};
  return(
    <>
      <style>{`@keyframes recGaugeSweep{from{stroke-dashoffset:${circ}}to{stroke-dashoffset:${(circ-fillLen).toFixed(1)}}}`}</style>
      <div style={{display:"flex",justifyContent:"center",marginBottom:4}}>
        <div style={{position:"relative",width:sz,height:sz}}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`} style={{overflow:"visible",display:"block"}}>
            <defs>
              <linearGradient id="recGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={rc}/>
                <stop offset="100%" stopColor={tint} stopOpacity="0.85"/>
              </linearGradient>
            </defs>
            <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(245,245,240,0.12)" strokeWidth={sw}/>
            <circle cx={sz/2} cy={sz/2} r={r} fill="none"
              stroke="url(#recGaugeGrad)" strokeWidth={sw} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={(circ-fillLen).toFixed(1)}
              transform={`rotate(-90 ${sz/2} ${sz/2})`}
              style={{animation:'recGaugeSweep 0.8s cubic-bezier(.2,.7,.3,1) both'}}/>
            {pct>0.02&&(
              <circle cx={tipX} cy={tipY} r={6} fill={rc}
                style={{filter:`drop-shadow(0 0 6px ${rc}) drop-shadow(0 0 12px ${rc}66)`}}/>
            )}
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
            <div style={{...cnd,fontSize:22,color:"#f5f5f0",lineHeight:1,textShadow:"0 0 30px rgba(245,245,240,0.12), 0 2px 24px rgba(0,0,0,0.8)"}}>{display}</div>
            <div style={{...mno,fontSize:8,color:rc,letterSpacing:"0.1em",marginTop:2}}>{label}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── BAR + GRID COMPONENTS ──────────────────────────────────────────────────

function WorkoutFreqBars({weeklyFreq}) {
  const maxC=Math.max(...weeklyFreq.map(w=>w.count),1);
  const hasDeload=weeklyFreq.some(w=>w.isDeload);
  return(
    <>
      <style>{`@keyframes wfBarUp{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
      <div style={{position:"relative",height:72,display:"flex",alignItems:"flex-end",gap:4,marginBottom:2}}>
        {/* Baseline axis at bar floor */}
        <div style={{position:"absolute",bottom:13,left:0,right:0,height:1,background:"rgba(245,245,240,0.06)",pointerEvents:"none"}}/>
        {weeklyFreq.map(({week,count,isCurrent,isDeload},i)=>{
          const h=count>0?Math.max(8,Math.round((count/maxC)*58)):isDeload?14:3;
          const barBg=isDeload
            ?'rgba(245,245,240,0.25)'
            :count===0
              ?'rgba(245,245,240,0.06)'
              :isCurrent
                ?'linear-gradient(to bottom,#e8341c,rgba(232,52,28,0.5))'
                :'linear-gradient(to bottom,rgba(232,52,28,0.65),rgba(232,52,28,0.25))';
          return(
            <div key={week} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <div style={{
                width:"100%",height:h,
                background:barBg,
                borderRadius:'3px 3px 0 0',
                transformOrigin:'bottom center',
                animation:`wfBarUp 0.5s cubic-bezier(.2,.7,.3,1) ${i*60}ms both`,
                filter:isCurrent&&!isDeload?'drop-shadow(0 0 6px rgba(232,52,28,0.6))':'none',
              }}/>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:isCurrent?"rgba(245,245,240,0.6)":"rgba(245,245,240,0.25)",textAlign:"center",lineHeight:1.2}}>
                {isDeload?"DELOAD":isCurrent?"NOW":`W${week}`}
              </div>
            </div>
          );
        })}
      </div>
      {hasDeload&&(
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
          <div style={{width:8,height:8,borderRadius:2,background:"rgba(245,245,240,0.25)"}}/>
          <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Deload week</span>
        </div>
      )}
    </>
  );
}

function PerformanceCalendarGrid({calDays}) {
  return(
    <>
      <style>{`@keyframes calCellIn{from{opacity:0;transform:scale(0.7)}to{opacity:1;transform:scale(1)}}@keyframes smBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      {/* Legend */}
      <div style={{display:"flex",gap:12,marginBottom:10}}>
        {[
          {c:"rgba(232,52,28,0.45)",l:"Trained"},
          {c:"rgba(245,245,240,0.20)",l:"Macros"},
          {c:"rgba(232,52,28,0.85)",l:"Both"},
        ].map(({c,l})=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:8,height:8,borderRadius:2,background:c}}/>
            <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</span>
          </div>
        ))}
      </div>
      {/* DOW header */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
        {["S","M","T","W","T","F","S"].map((d,i)=>(
          <div key={i} style={{textAlign:"center",fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.25)"}}>{d}</div>
        ))}
      </div>
      {/* 35-day grid with diagonal stagger */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:10}}>
        {calDays.map(({ds,hasWorkout,hasMacros,isFuture,isToday2},i)=>{
          const row=Math.floor(i/7),col=i%7;
          const both=hasWorkout&&hasMacros;
          const bg=isFuture?"transparent"
            :both?"rgba(232,52,28,0.85)"
            :hasWorkout?"rgba(232,52,28,0.45)"
            :hasMacros?"rgba(245,245,240,0.20)"
            :"rgba(245,245,240,0.04)";
          return(
            <div key={ds} style={{
              aspectRatio:"1",
              borderRadius:6,
              background:bg,
              border:isToday2?"1px solid rgba(232,52,28,1)":"1px solid transparent",
              boxShadow:isToday2?"0 0 6px rgba(232,52,28,0.4)":"none",
              animation:`calCellIn 0.3s ease-out ${(row+col)*12}ms both`,
            }}/>
          );
        })}
      </div>
      {/* 5-week summary bars */}
      <div style={{display:"flex",gap:3}}>
        {Array.from({length:5},(_,w)=>{
          const wDays=calDays.slice(w*7,w*7+7);
          const trainPct=(wDays.filter(d=>d.hasWorkout).length/7)*100;
          const macroPct=(wDays.filter(d=>d.hasMacros).length/7)*100;
          return(
            <div key={w} style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
              <div style={{height:3,borderRadius:1,background:"rgba(232,52,28,0.12)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${trainPct}%`,borderRadius:1,background:"linear-gradient(90deg,#e8341c,rgba(232,52,28,0.5))",transformOrigin:"left center",animation:`smBar 0.5s cubic-bezier(.2,.7,.3,1) ${w*60+200}ms both`}}/>
              </div>
              <div style={{height:3,borderRadius:1,background:"rgba(245,245,240,0.06)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${macroPct}%`,borderRadius:1,background:"rgba(245,245,240,0.40)",transformOrigin:"left center",animation:`smBar 0.5s cubic-bezier(.2,.7,.3,1) ${w*60+260}ms both`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ProteinGrid({days14,hitCount,protTarget}) {
  const [displayCount,setDisplayCount]=useState(0);
  useEffect(()=>{
    let raf;
    const start=performance.now();
    const tick=now=>{
      const p=Math.min(1,(now-start)/600);
      setDisplayCount(Math.round((1-Math.pow(1-p,3))*hitCount));
      if(p<1){raf=requestAnimationFrame(tick);}
    };
    raf=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(raf);
  },[hitCount]);
  const mno={fontFamily:"'DM Mono','SF Mono',monospace"};
  const circleStyle=(fd,i)=>{
    const hit=fd?.hasData&&fd.prot>=protTarget*0.9;
    const miss=fd?.hasData&&!hit;
    return{
      width:22,height:22,borderRadius:"50%",
      background:hit?'#e8341c':!fd?.hasData?'rgba(245,245,240,0.08)':'transparent',
      border:miss?'1.5px solid rgba(245,245,240,0.20)':'none',
      filter:hit?'drop-shadow(0 0 4px rgba(232,52,28,0.5)) drop-shadow(0 0 8px rgba(232,52,28,0.25))':'none',
      animation:`dotFade 0.3s ease-out ${i*30}ms both`,
    };
  };
  return(
    <>
      <style>{`@keyframes dotFade{from{opacity:0;transform:scale(0.6)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
        {days14.slice(0,7).map(({ds,fd,dow},i)=>(
          <div key={ds} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={circleStyle(fd,i)}/>
            <div style={{...mno,fontSize:7,color:"rgba(245,245,240,0.3)"}}>{dow}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:12}}>
        {days14.slice(7).map(({ds,fd,dow},i)=>(
          <div key={ds} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <div style={circleStyle(fd,i+7)}/>
            <div style={{...mno,fontSize:7,color:"rgba(245,245,240,0.3)"}}>{dow}</div>
          </div>
        ))}
      </div>
      <div style={{...mno,fontSize:10,color:"rgba(245,245,240,0.5)"}}>
        {displayCount} of 14 days protein target hit
      </div>
    </>
  );
}

// ─── CHART COMPONENTS ───────────────────────────────────────────────────────

function RPELineChart({points, exName, trendColor, trendLabel}) {
  const W=240,H=70,minRPE=6,maxRPE=10,PAD_L=22;
  const xStep=(W-PAD_L-8)/Math.max(1,points.length-1);
  const toX=i=>PAD_L+i*xStep;
  const toY=rpe=>4+(1-(rpe-minRPE)/(maxRPE-minRPE))*(H-8);
  const rpeColor=rpe=>rpe<=7?'#22c55e':rpe<=8?'#FEA020':'#e8341c';
  const gradId=`rpeGrad${exName.replace(/[^a-zA-Z0-9]/g,'')}`;
  const pathD=points.map((p,i)=>`${i===0?'M':'L'} ${toX(i).toFixed(1)} ${toY(p.avgRPE).toFixed(1)}`).join(' ');
  const areaD=`${pathD} L ${toX(points.length-1).toFixed(1)} ${H} L ${toX(0).toFixed(1)} ${H} Z`;
  const mno={fontFamily:"'DM Mono','SF Mono',monospace"};
  return(
    <div style={{marginBottom:14}}>
      <style>{`@keyframes rpeLineDraw{from{stroke-dashoffset:2000}to{stroke-dashoffset:0}}@keyframes rpeAreaFill{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:13,color:"rgba(245,245,240,0.7)"}}>{exName}</div>
        <div style={{...mno,fontSize:7,color:trendColor,letterSpacing:"0.08em"}}>{trendLabel}</div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.30"/>
            <stop offset="100%" stopColor={trendColor} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[[6,'6'],[8,'8'],[10,'10']].map(([rpe,lbl])=>(
          <g key={rpe}>
            <line x1={PAD_L} y1={toY(rpe)} x2={W} y2={toY(rpe)} stroke="rgba(245,245,240,0.06)" strokeWidth="1"/>
            <text x={PAD_L-4} y={toY(rpe)+3} textAnchor="end" fill="rgba(245,245,240,0.35)" fontSize="8" fontFamily="'DM Mono',monospace">{lbl}</text>
          </g>
        ))}
        <path d={areaD} fill={`url(#${gradId})`} style={{animation:"rpeAreaFill 0.4s ease-out 0.3s both"}}/>
        <path d={pathD} fill="none" stroke={trendColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{strokeDasharray:2000,strokeDashoffset:0,animation:"rpeLineDraw 1s ease-out both"}}/>
        {points.map((p,i)=>{
          const last=i===points.length-1;
          const c=rpeColor(p.avgRPE);
          return(
            <g key={i}>
              <circle cx={toX(i)} cy={toY(p.avgRPE)} r={last?5:3} fill={c}
                style={{filter:`drop-shadow(0 0 4px ${c}) drop-shadow(0 0 8px ${c}66)`}}/>
              {last&&<text x={toX(i)+7} y={toY(p.avgRPE)+3} fill={c} fontSize="7" fontFamily="monospace">{p.avgRPE}</text>}
            </g>
          );
        })}
      </svg>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
        <div style={{...mno,fontSize:7,color:"rgba(245,245,240,0.25)"}}>{points[0].date.slice(5)}</div>
        <div style={{...mno,fontSize:7,color:"rgba(245,245,240,0.25)"}}>{points[points.length-1].date.slice(5)}</div>
      </div>
    </div>
  );
}

function CalorieTrendChart({days14,calTarget}) {
  const W=320,H=90;
  const validDays=days14.filter(d=>d.hasData);
  const maxC=Math.max(calTarget*1.25,...validDays.map(d=>d.cal));
  const pts=days14.map((d,i)=>({...d,x:Math.round((i/13)*W),y:d.hasData?Math.round((1-d.cal/maxC)*H):null}));
  const dataPts=pts.filter(p=>p.y!==null);
  if(!dataPts.length)return null;
  const targetY=Math.round((1-calTarget/maxC)*H);
  const pathD=dataPts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const areaD=`${pathD} L ${dataPts[dataPts.length-1].x} ${H} L ${dataPts[0].x} ${H} Z`;
  const ptColor=cal=>cal>calTarget*1.1?'#e8341c':cal>=calTarget*0.9?'#22c55e':'#FEA020';
  return(
    <>
      <style>{`@keyframes calLineDraw{from{stroke-dashoffset:2000}to{stroke-dashoffset:0}}@keyframes calAreaFill{from{opacity:0}to{opacity:1}}`}</style>
      <svg viewBox={`0 0 ${W} ${H+16}`} width="100%" style={{display:"block",overflow:"visible"}}>
        <defs>
          <linearGradient id="calTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8341c" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#e8341c" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[H*0.25,H*0.5,H*0.75].map((y,i)=>(
          <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="rgba(245,245,240,0.06)" strokeWidth="1"/>
        ))}
        <line x1="0" y1={targetY} x2={W} y2={targetY} stroke="rgba(245,245,240,0.4)" strokeWidth="1" strokeDasharray="4 4"/>
        <text x={W-4} y={targetY-4} fontSize="8" fontFamily="'DM Mono',monospace" fill="rgba(245,245,240,0.4)" textAnchor="end" letterSpacing="1">TARGET</text>
        <path d={areaD} fill="url(#calTrendAreaGrad)" style={{animation:"calAreaFill 0.4s ease-out 0.3s both"}}/>
        <path d={pathD} fill="none" stroke="#e8341c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{strokeDasharray:2000,strokeDashoffset:0,animation:"calLineDraw 1s ease-out both"}}/>
        {dataPts.map((p,i)=>{
          const last=i===dataPts.length-1;
          const c=ptColor(p.cal);
          return(
            <circle key={p.ds} cx={p.x} cy={p.y} r={last?5:3} fill={c}
              style={{filter:`drop-shadow(0 0 ${last?'6':'4'}px ${c}) drop-shadow(0 0 ${last?'12':'8'}px ${c}66)`}}/>
          );
        })}
      </svg>
    </>
  );
}

function WeightChart({weightProjection,goalW,profile}) {
  const{slope,intercept,data,projectedDelta}=weightProjection;
  const W=320,H=80;
  const allW=data.map(l=>parseFloat(l.weight));
  const projW14=intercept+slope*(data.length-1)+slope*7;
  const minW=Math.min(...allW,projW14,...(goalW?[goalW]:[]))-1;
  const maxW=Math.max(...allW,projW14,...(goalW?[goalW]:[]))+1;
  const range=maxW-minW||1;
  const toY=w=>Math.round((1-(w-minW)/range)*H);
  const toX=(i,len)=>Math.round((i/(len+6))*W);
  const histPts=data.map((l,i)=>({x:toX(i,data.length),y:toY(parseFloat(l.weight))}));
  const projX=toX(data.length+6,data.length);
  const projY=toY(projW14);
  const lastH=histPts[histPts.length-1];
  const curW=(intercept+slope*(data.length-1)).toFixed(1);
  const dir=projectedDelta>0.2?"gaining":projectedDelta<-0.2?"losing":"maintaining";
  const rate=Math.abs(projectedDelta*4).toFixed(1);
  const histPathD=histPts.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  const histAreaD=`${histPathD} L ${lastH.x} ${H} L ${histPts[0].x} ${H} Z`;
  const mno={fontFamily:"'DM Mono','SF Mono',monospace"};
  return(
    <>
      <style>{`@keyframes wtLineDraw{from{stroke-dashoffset:2000}to{stroke-dashoffset:0}}@keyframes wtAreaFill{from{opacity:0}to{opacity:1}}`}</style>
      <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
        <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#f5f5f0",lineHeight:1}}>{curW}</span>
        <span style={{...mno,fontSize:11,color:"rgba(245,245,240,0.45)"}}>{profile?.wUnit||"lbs"}</span>
        <span style={{...mno,fontSize:9,color:dir==="gaining"?"#FEA020":dir==="losing"?"#22c55e":"#60a5fa"}}>{dir} · ~{rate} {profile?.wUnit||"lbs"}/mo</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H+10}`} width="100%" style={{display:"block",overflow:"visible"}}>
        <defs>
          <linearGradient id="wtAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8341c" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#e8341c" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[minW,(minW+maxW)/2,maxW].map((w,i)=>(
          <line key={i} x1={0} y1={toY(w)} x2={W} y2={toY(w)} stroke="rgba(245,245,240,0.06)" strokeWidth="1"/>
        ))}
        {goalW&&<>
          <line x1={0} y1={toY(goalW)} x2={W} y2={toY(goalW)} stroke="rgba(245,245,240,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
          <text x={W-4} y={toY(goalW)-4} textAnchor="end" fontFamily="'DM Mono',monospace" fontSize="8" fill="rgba(245,245,240,0.4)" letterSpacing="1">GOAL</text>
        </>}
        <path d={histAreaD} fill="url(#wtAreaGrad)" style={{animation:"wtAreaFill 0.4s ease-out 0.3s both"}}/>
        <path d={histPathD} fill="none" stroke="#e8341c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{strokeDasharray:2000,strokeDashoffset:0,animation:"wtLineDraw 1s ease-out both"}}/>
        <path d={`M ${lastH.x} ${lastH.y} L ${projX} ${projY}`} fill="none" stroke="rgba(232,52,28,0.6)" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round"/>
        {histPts.map((p,i)=>{
          const last=i===histPts.length-1;
          return(
            <circle key={i} cx={p.x} cy={p.y} r={last?5:3} fill="#e8341c"
              style={{filter:last?'drop-shadow(0 0 6px #e8341c) drop-shadow(0 0 12px rgba(232,52,28,0.4))':'drop-shadow(0 0 4px #e8341c) drop-shadow(0 0 8px rgba(232,52,28,0.3))'}}/>
          );
        })}
        <circle cx={projX} cy={projY} r={5} fill="rgba(232,52,28,0.6)"
          style={{filter:'drop-shadow(0 0 5px rgba(232,52,28,0.6)) drop-shadow(0 0 10px rgba(232,52,28,0.3))'}}/>
      </svg>
      <div style={{...mno,fontSize:9,color:"rgba(245,245,240,0.35)",marginTop:4}}>Based on {data.length} weigh-ins · 7-day projection{goalW?` · Goal: ${goalW}${profile?.wUnit||'lbs'}`:''}</div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function ScoreExplanationModal({sc, onClose}) {
  const comps=[
    {label:"Recovery",pct:40,val:sc.r,color:T.carb,desc:"Based on sleep duration and quality, heart rate variability, and resting heart rate from Apple Health."},
    {label:"Nutrition",pct:30,val:sc.n,color:T.green,desc:"How close you hit your macro targets today. Protein adherence weighted higher."},
    {label:"Training",pct:20,val:sc.t,color:"var(--red)",desc:"Whether you completed today's scheduled session and how it compared to last week."},
    {label:"Consistency",pct:10,val:sc.c,color:T.fat,desc:"How many of your planned sessions you've completed over the last 30 days."},
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(10px)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:"20px 20px 0 0",padding:"24px 20px 48px",maxWidth:480,width:"100%",maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{width:32,height:3,background:"rgba(var(--accent-rgb),0.15)",borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{fontFamily:"var(--condensed)",fontSize:22,fontWeight:900,marginBottom:4,textAlign:"center"}}>HOW YOUR SCORE IS CALCULATED</div>
        <div style={{fontSize:11,color:"rgba(245,245,240,.4)",textAlign:"center",marginBottom:24}}>Tap anywhere to close</div>
        {comps.map(({label,pct,val,color,desc})=>(
          <div key={label} style={{marginBottom:20,background:"rgba(var(--accent-rgb),0.03)",border:"1px solid rgba(var(--accent-rgb),0.06)",borderRadius:14,padding:"16px"}}>
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
            <div style={{height:4,background:"rgba(var(--accent-rgb),0.06)",borderRadius:2,overflow:"hidden",marginBottom:10}}>
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
          <div key={pred.key} style={{marginBottom:showDivider?20:0,paddingBottom:showDivider?20:0,borderBottom:showDivider?"1px solid rgba(var(--accent-rgb),0.05)":"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:17,letterSpacing:.5}}>{pred.label.toUpperCase()}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:12,color:T.carb,fontWeight:600}}>~{pred.current1RM} {unit} est. 1RM</div>
            </div>
            {pred.declining&&(
              <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8}}>
                <div style={{fontSize:11,color:"#EF4444",fontWeight:700,marginBottom:3}}>📉 Performance trending down</div>
                <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",lineHeight:1.6}}>Recovery may be needed — check your sleep and nutrition</div>
              </div>
            )}
            {pred.plateau&&!pred.declining&&(
              <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(245,158,11,0.07)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:8}}>
                <div style={{fontSize:11,color:T.fat,fontWeight:700,marginBottom:3}}>⚠️ Plateau detected — 3 sessions no progress</div>
                <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",lineHeight:1.6}}>Consider a deload or technique focus</div>
              </div>
            )}
            {pred.milestones.length>0&&(
              <>
                <div style={{height:4,background:"rgba(245,245,240,0.07)",borderRadius:3,marginBottom:10,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${barPct}%`,background:`linear-gradient(90deg,${T.carb},${T.green})`,borderRadius:3,transition:"width 0.7s ease"}}/>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:7}}>
                  {pred.milestones.slice(0,4).map((m,mi)=>{
                    const col = m.weeks<=4?T.green:m.weeks<=8?T.carb:T.fat;
                    const bg  = m.weeks<=4?"rgba(34,197,94,0.09)":m.weeks<=8?"rgba(74,144,226,0.09)":"rgba(245,158,11,0.09)";
                    const bd  = m.weeks<=4?"rgba(34,197,94,0.28)":m.weeks<=8?"rgba(74,144,226,0.28)":"rgba(245,158,11,0.28)";
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
            <div style={{fontFamily:"var(--mono)",fontSize:12,color:T.carb,fontWeight:600}}>{_fmtPace(runData.avgPace)} avg</div>
          </div>
          {runData.declining&&(
            <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8}}>
              <div style={{fontSize:11,color:"#EF4444",fontWeight:700,marginBottom:3}}>📉 Performance trending down</div>
              <div style={{fontSize:11,color:"rgba(245,245,240,0.45)",lineHeight:1.6}}>Recovery may be needed — check your sleep and nutrition</div>
            </div>
          )}
          {runData.improving&&!runData.declining&&(
            <div style={{marginBottom:10,padding:"8px 12px",background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8}}>
              <div style={{fontSize:11,color:T.green,fontWeight:700}}>📈 Pace improving — trending faster</div>
            </div>
          )}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:7}}>
            {runData.races.map((r,ri)=>(
              <div key={ri} style={{padding:"5px 10px",background:"rgba(74,144,226,0.09)",border:"1px solid rgba(74,144,226,0.28)",borderRadius:20,display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.45)"}}>{r.name}</span>
                <span style={{fontFamily:"var(--mono)",fontSize:11,color:T.carb,fontWeight:700}}>{_fmtFinish(r.mins)}</span>
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
    high:    {label:"HIGH RISK",    color:"#EF4444",bg:"rgba(239,68,68,0.06)",  border:"rgba(239,68,68,0.28)",  left:"#EF4444"},
    moderate:{label:"MODERATE RISK",color:"#F97316",bg:"rgba(249,115,22,0.06)", border:"rgba(249,115,22,0.28)", left:"#F97316"},
    low:     {label:"LOW RISK",     color:T.fat,bg:"rgba(245,158,11,0.06)",  border:"rgba(245,158,11,0.28)",  left:T.fat},
  };
  const lc=LC[top.level]||LC.low;
  return (
    <div style={{margin:"0 20px 14px",padding:"16px 18px",background:lc.bg,border:`1px solid ${lc.border}`,borderLeft:`3px solid ${lc.left}`,borderRadius:"4px 14px 14px 4px"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent)"><path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zm-1 5.01v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
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
        <button onClick={onDismiss} style={{flex:1,padding:"11px",background:"transparent",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:10,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",fontSize:11,cursor:"pointer"}}>Got It</button>
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
  const LC={HIGH:"#EF4444",MODERATE:"#F97316",LOW:T.green};
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
        const barColor=pct>=1?"#EF4444":pct>=0.8?"#F97316":pct>=0.6?T.fat:T.green;
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

function WeeklyNutritionCalendar({weekMacros,todayKey}) {
  const [expandedDay,setExpandedDay]=useState(null);
  const calColors={heavy_lower:T.carb,heavy_upper:T.carb,hypertrophy:T.carb,long_run:T.green,tempo_run:T.green,easy_run:T.green,interval_run:T.green,hyrox_station:T.fat,hybrid:"#7E57C2",active_recovery:"#6B7280",rest:"#374151"};
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
              style={{background:"none",border:`1.5px solid ${isToday2?c:"rgba(var(--accent-rgb),0.06)"}`,borderRadius:10,padding:"8px 4px",textAlign:"center",cursor:"pointer",fontFamily:"inherit",position:"relative"}}>
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
          <div style={{background:"rgba(var(--accent-rgb),0.03)",borderRadius:10,padding:"12px 14px",borderTop:"1px solid rgba(var(--accent-rgb),0.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:c,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{d.day} — {d.label}</div>
                <div style={{fontSize:12,color:"rgba(245,245,240,0.7)",lineHeight:1.5}}>{d.keyInsight}</div>
              </div>
              <div style={{fontSize:18,fontWeight:900,color:"#fff",flexShrink:0}}>{d.calories.toLocaleString()}<span style={{fontSize:10,color:"rgba(245,245,240,0.4)",fontWeight:400}}> kcal</span></div>
            </div>
            <div style={{display:"flex",gap:10}}>
              {[["P",d.protein,"g","var(--red)"],["C",d.carbs,"g","var(--blue)"],["F",d.fat,"g","var(--amber)"]].map(([l,v,u,c2])=>(
                <div key={l} style={{flex:1,background:"rgba(var(--accent-rgb),0.04)",borderRadius:8,padding:"8px",textAlign:"center"}}>
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
}

function PRFeed({dbPRs,wUnit}){
  const [prTab,setPrTab]=useState('recent');
  const thirtyDaysAgo=new Date(Date.now()-30*864e5).toISOString().split('T')[0];
  const allPRs=(dbPRs||[]).slice(0,30).map(pr=>({name:pr.exercise_name,weight:pr.weight,reps:pr.reps,date:pr.date}));
  const recentPRs=allPRs.filter(pr=>pr.date>=thirtyDaysAgo);
  const bestByExercise={};
  allPRs.forEach(pr=>{if(!bestByExercise[pr.name]||pr.weight>bestByExercise[pr.name].weight)bestByExercise[pr.name]=pr;});
  const allTimePRs=Object.values(bestByExercise).sort((a,b)=>b.weight-a.weight);
  const displayPRs=prTab==='recent'?recentPRs:allTimePRs;
  return(
    <div data-tour="pr-section" style={{margin:"0 16px 14px",padding:"16px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase"}}>// PERSONAL RECORDS</div>
        <div style={{display:"flex",gap:4}}>
          {['recent','all time'].map(t=>(
            <button key={t} onClick={()=>setPrTab(t)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${prTab===t?"var(--accent)":"rgba(245,245,240,0.1)"}`,background:prTab===t?"rgba(var(--accent-rgb),0.1)":"transparent",fontFamily:"'DM Mono',monospace",fontSize:8,color:prTab===t?"var(--accent)":"rgba(245,245,240,0.4)",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>{t}</button>
          ))}
        </div>
      </div>
      {displayPRs.length===0?(
        <div style={{textAlign:"center",padding:"24px 0"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:"rgba(245,245,240,0.3)",lineHeight:1,marginBottom:8}}>YOUR FIRST PR IS ONE SESSION AWAY.</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:16,color:"rgba(245,245,240,0.3)",lineHeight:1.5}}>Log your first session and Coach Macro will track every personal record from here.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {displayPRs.slice(0,10).map((pr,i)=>(
            <div key={pr.name+i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(34,197,94,0.03)",border:"1px solid rgba(34,197,94,0.1)",borderLeft:"3px solid #22c55e",borderRadius:12}}>
              <div style={{flex:1,minWidth:0,marginRight:12}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pr.name}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.3)",marginTop:2}}>{new Date(pr.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#22c55e",lineHeight:1}}>{pr.weight}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(34,197,94,0.6)",marginTop:1}}>{wUnit||"lbs"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeeklyReview({workoutLogsRaw,workoutsThisWeek,volumeThisWeek,volumeLastWeek,protHitDays,calHitDays,twStart,macros,user}){
  const [insight,setInsight]=useState(()=>{
    const key='cm_week_insight_'+twStart;
    try{return localStorage.getItem(key)||'';}catch{return '';}
  });
  const [insightLoading,setInsightLoading]=useState(false);

  useEffect(()=>{
    if(insight||insightLoading||!user?.id||workoutsThisWeek===0)return;
    const key='cm_week_insight_'+twStart;
    setInsightLoading(true);
    const prompt=`You are a fitness coach. In one punchy sentence (under 20 words), give a weekly performance insight based on these stats: ${workoutsThisWeek} sessions, ${volumeThisWeek.toLocaleString()} lbs volume (last week: ${volumeLastWeek.toLocaleString()} lbs), protein target hit ${protHitDays}/7 days, calorie target hit ${calHitDays}/7 days. Be specific, motivating, and direct. No fluff.`;
    ai(prompt,60,'week_insight').then(text=>{
      const clean=text.replace(/^["']|["']$/g,'').trim();
      setInsight(clean);
      try{localStorage.setItem('cm_week_insight_'+twStart,clean);}catch{}
    }).catch(()=>{}).finally(()=>setInsightLoading(false));
  },[workoutsThisWeek,user?.id]);

  const weekStart=new Date(twStart+'T12:00:00');
  const weekEnd=new Date(weekStart);weekEnd.setDate(weekEnd.getDate()+6);
  const fmt=(d)=>d.toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase();
  const dateRange=`${fmt(weekStart)} – ${fmt(weekEnd)}`;

  const lastWeekStart=new Date(weekStart);lastWeekStart.setDate(lastWeekStart.getDate()-7);
  const lastWeekStr=lastWeekStart.toISOString().split('T')[0];
  const lastWeekWorkouts=(workoutLogsRaw||[]).filter(l=>l.date>=lastWeekStr&&l.date<twStart).length;

  const sessionDelta=workoutsThisWeek-lastWeekWorkouts;
  const volDelta=volumeThisWeek-volumeLastWeek;
  const protPct=Math.round(protHitDays/7*100);
  const logDays=new Set([...(workoutLogsRaw||[]).filter(l=>l.date>=twStart).map(l=>l.date)]).size;

  return(
    <div style={{margin:"0 16px 14px",padding:"18px 16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase"}}>// WEEK IN REVIEW</div>
        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.3)"}}>{dateRange}</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {label:"SESSIONS",value:workoutsThisWeek,delta:sessionDelta,unit:''},
          {label:"VOLUME",value:volumeThisWeek>999?`${(volumeThisWeek/1000).toFixed(1)}k`:String(volumeThisWeek||0),delta:volDelta,unit:'lbs'},
          {label:"PROTEIN",value:`${protPct}%`,delta:null,unit:'of target'},
          {label:"LOGGED",value:`${logDays}/7`,delta:null,unit:'days'},
        ].map(({label,value,delta,unit})=>(
          <div key={label} style={{background:"rgba(var(--accent-rgb),0.04)",borderRadius:10,padding:"12px",textAlign:"center"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",lineHeight:1,marginBottom:2}}>{value}</div>
            {unit&&<div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",marginBottom:4}}>{unit}</div>}
            {delta!==null&&delta!==0&&(
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:delta>0?"#22c55e":"var(--accent)"}}>{delta>0?'+':''}{typeof delta==='number'&&Math.abs(delta)>999?`${(delta/1000).toFixed(1)}k`:delta} vs last wk</div>
            )}
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      {(insight||insightLoading)&&(
        <div style={{borderLeft:"2px solid var(--accent)",paddingLeft:12,marginTop:2}}>
          {insightLoading?(
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:15,color:"rgba(245,245,240,0.35)"}}>Analyzing your week...</div>
          ):(
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:17,color:"rgba(245,245,240,0.55)",lineHeight:1.4}}>{insight}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Confidence Dot ─────────────────────────────────────────────────────────────
function ConfidenceDot({pct, explain}) {
  const [show, setShow] = useState(false);
  const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : 'rgba(245,245,240,0.3)';
  const label = pct >= 70 ? 'High confidence' : pct >= 40 ? 'Building confidence' : 'Low confidence';
  return (
    <span style={{position:'relative',display:'inline-flex',alignItems:'center',marginLeft:5}}>
      <span onClick={()=>setShow(s=>!s)} style={{width:6,height:6,borderRadius:'50%',background:color,cursor:'pointer',flexShrink:0,display:'inline-block'}}/>
      {show&&(
        <span onClick={()=>setShow(false)} style={{position:'absolute',bottom:'calc(100% + 4px)',left:'50%',transform:'translateX(-50%)',background:'#1a1a1a',border:'1px solid rgba(245,245,240,0.1)',borderRadius:6,padding:'4px 8px',whiteSpace:'nowrap',zIndex:20,fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(245,245,240,0.7)',lineHeight:1.4,textAlign:'center',minWidth:110}}>
          {label} · {pct}%{explain?`\n${explain}`:''}
        </span>
      )}
    </span>
  );
}

// ── Game Plan Card (Today tab) ─────────────────────────────────────────────────
function GamePlanCard({items, onDismissItem}) {
  if (!items?.length) return null;
  const priorityColor = {high:'#f59e0b', medium:'var(--accent)', low:'rgba(245,245,240,0.35)'};
  return (
    <div style={{margin:"0 16px 14px",padding:"16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:16}}>
      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// This Week's Game Plan</div>
      {items.map((item, i) => (
        <div key={i} style={{marginBottom: i < items.length - 1 ? 12 : 0}}>
          {i > 0 && <div style={{height:1,background:'rgba(245,245,240,0.06)',marginBottom:12}}/>}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:15,color:'#f5f5f0',lineHeight:1.2,flex:1,paddingRight:8}}>{item.headline}</div>
            <div style={{background:`${priorityColor[item.priority] || 'rgba(245,245,240,0.35)'}18`,border:`1px solid ${priorityColor[item.priority] || 'rgba(245,245,240,0.35)'}44`,borderRadius:4,padding:'1px 6px',fontFamily:"'DM Mono',monospace",fontSize:7,color:priorityColor[item.priority],textTransform:'uppercase',letterSpacing:'0.12em',flexShrink:0}}>{item.daysUntil===1?'tomorrow':`${item.daysUntil}d`}</div>
          </div>
          <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:'rgba(245,245,240,0.65)',lineHeight:1.5,marginBottom:6}}>{item.body}</div>
          <div style={{background:'rgba(var(--accent-rgb),0.06)',borderLeft:'2px solid rgba(var(--accent-rgb),0.4)',borderRadius:'0 6px 6px 0',padding:'6px 10px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontFamily:"'Barlow',sans-serif",fontSize:11,color:'rgba(245,245,240,0.7)',lineHeight:1.4,flex:1}}>{item.actionable}</span>
            <button onClick={()=>onDismissItem&&onDismissItem(i)} style={{background:'none',border:'none',padding:'2px 6px',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(245,245,240,0.25)',textTransform:'uppercase',letterSpacing:'0.1em',marginLeft:8,flexShrink:0}}>ok</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Failure Pattern Alert Card ────────────────────────────────────────────────
function PatternAlertCard({ detection, onDismiss, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!detection) return null;

  const meta  = FAILURE_PATTERNS[detection.pattern] || {};
  const stage = detection.stage;
  const stageInfo = meta.stages?.[stage] || { label: stage, color: '#F59E0B', bg: '#FEF3C7' };

  const baseInterv = {
    honeymoon_crash:    { headline: "The first month is the hardest.", body: "Momentum tends to drop — that's completely normal. Just show up today." },
    plateau_panic:      { headline: "The scale hasn't moved — and that's data, not failure.", body: "A 14-day stall is physiologically normal. Stay the course." },
    overtraining_spiral:{ headline: "You're training hard. Make sure you recover just as hard.", body: "Volume is climbing — watch your recovery markers this week." },
    sleep_tax:          { headline: "Your sleep is costing you results.", body: "Under 7 hours slows fat loss and spikes hunger. Tonight, aim for 7." },
    perfection_trap:    { headline: "One off-day doesn't break your progress.", body: "The only thing that matters now is getting back on track today." },
    the_coaster:        { headline: "You're cycling — effort followed by coasting.", body: "Great weeks offset by coast weeks. Raise the floor on coasting weeks." },
  }[detection.pattern] || { headline: "Pattern detected.", body: "Your coach noticed something worth addressing." };

  const displayInterv = intervention || baseInterv;

  function handleExpand() {
    setExpanded(e => !e);
    if (!expanded && !intervention) {
      setLoading(true);
      generateIntervention(null, detection.pattern, stage)
        .then(i => { if (i) setIntervention(i); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }

  return (
    <div style={{margin:'0 16px 14px',borderRadius:16,overflow:'hidden',border:`1px solid ${stageInfo.color}33`}}>
      {/* Header */}
      <div
        onClick={handleExpand}
        style={{background:`${stageInfo.color}12`,padding:'12px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}
      >
        <span style={{fontSize:18,lineHeight:1}}>{meta.emoji || '⚠️'}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:stageInfo.color,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:2}}>{stageInfo.label}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontStyle:'italic',fontSize:14,color:'#f5f5f0',lineHeight:1.2}}>{meta.name}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:stageInfo.color}}/>
          <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'rgba(245,245,240,0.3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{expanded?'▲':'▼'}</span>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{background:'#0d0d0d',padding:'14px 14px 12px'}}>
          {loading ? (
            <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:'rgba(245,245,240,0.4)',paddingBottom:10}}>Personalizing your insight…</div>
          ) : (
            <>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontStyle:'italic',fontSize:15,color:'#f5f5f0',marginBottom:6,lineHeight:1.3}}>{displayInterv.headline}</div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:'rgba(245,245,240,0.65)',lineHeight:1.55,marginBottom:12}}>{displayInterv.body}</div>
            </>
          )}
          {/* Action buttons */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {['Tell me more','Help me with this','I\'ve got this'].map((label, i) => (
              <button
                key={i}
                onClick={() => { onAction?.(label, detection); if (label === "I've got this") onDismiss?.(); }}
                style={{
                  background: i === 0 ? `${stageInfo.color}18` : i === 1 ? `${stageInfo.color}10` : 'transparent',
                  border: `1px solid ${i === 2 ? 'rgba(245,245,240,0.12)' : stageInfo.color + '44'}`,
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontFamily: "'Barlow',sans-serif",
                  fontWeight: 600,
                  fontSize: 11,
                  color: i === 2 ? 'rgba(245,245,240,0.35)' : stageInfo.color,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Footer dismiss */}
      <div style={{background:'#0d0d0d',borderTop:'1px solid rgba(245,245,240,0.04)',padding:'6px 14px',display:'flex',justifyContent:'flex-end'}}>
        <button
          onClick={onDismiss}
          style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(245,245,240,0.2)',textTransform:'uppercase',letterSpacing:'0.12em',padding:'2px 4px'}}
        >dismiss 7 days</button>
      </div>
    </div>
  );
}

// ── Weekly Review Modal ────────────────────────────────────────────────────────
function WeeklyReviewModal({userId, profile, macros, workoutLogsRaw, twStart, onClose, onApply}) {
  const [cardIdx, setCardIdx] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const touchStart = useRef(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const since = new Date(new Date(twStart).getTime() - 7 * 864e5).toISOString().split('T')[0];
    const weekAgo = twStart;

    Promise.all([
      sb.from('food_logs').select('date,entries').eq('user_id', userId).gte('date', since),
      sb.from('bodyweight_logs').select('weight,unit,created_at').eq('user_id', userId).gte('created_at', since).order('created_at'),
      sb.from('validation_insights').select('*').eq('user_id', userId).gte('date_generated', weekAgo).order('created_at', {ascending: false}),
      sb.from('personal_records').select('exercise_name,weight,reps,date').eq('user_id', userId).gte('date', weekAgo),
    ]).then(([{data: food}, {data: bw}, {data: insights}, {data: prs}]) => {
      setData(buildReviewData({food, bw, insights, prs, workoutLogsRaw, macros, profile, twStart}));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, twStart]);

  const cards = data ? buildCards(data, macros, profile) : [];
  const total = cards.length;

  function onTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (!touchStart.current) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx > 0 && cardIdx < total - 1) setCardIdx(i => i + 1);
    else if (dx < 0 && cardIdx > 0) setCardIdx(i => i - 1);
  }

  async function handleApply() {
    if (!data?.adjustment?.calorieDelta || !userId) { onClose(); return; }
    setApplying(true);
    try {
      const newCals = (macros?.calories || 2000) + data.adjustment.calorieDelta;
      await sb.from('profiles').upsert({
        id: userId,
        profile_data: { ...(profile || {}), goalCals: newCals },
      }, { onConflict: 'id' });
      onApply?.(newCals);
    } catch {}
    setApplying(false);
    onClose();
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.96)',zIndex:10010,display:'flex',flexDirection:'column'}}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'max(env(safe-area-inset-top),20px) 20px 16px'}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--accent)',letterSpacing:'0.16em',textTransform:'uppercase'}}>// Weekly Review</div>
        <button onClick={onClose} style={{background:'none',border:'none',padding:4,cursor:'pointer',fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.4)',textTransform:'uppercase',letterSpacing:'0.1em'}}>close</button>
      </div>

      {/* Pip indicators */}
      <div style={{display:'flex',gap:5,justifyContent:'center',marginBottom:16}}>
        {Array.from({length: total}).map((_,i) => (
          <div key={i} onClick={()=>setCardIdx(i)} style={{width: i===cardIdx?20:6,height:6,borderRadius:3,background: i===cardIdx?'var(--accent)':'rgba(245,245,240,0.15)',transition:'all 0.3s ease',cursor:'pointer'}}/>
        ))}
      </div>

      {/* Card */}
      <div style={{flex:1,overflowY:'auto',padding:'0 20px'}}>
        {loading && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:12}}>
            <div style={{width:24,height:24,borderRadius:'50%',border:'2px solid rgba(var(--accent-rgb),0.3)',borderTopColor:'var(--accent)',animation:'spin 0.9s linear infinite'}}/>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Loading your week…</div>
          </div>
        )}
        {!loading && cards[cardIdx] && <ReviewCard card={cards[cardIdx]} isLast={cardIdx===total-1} onApply={handleApply} applying={applying} data={data}/>}
      </div>

      {/* Nav */}
      {!loading && (
        <div style={{display:'flex',justifyContent:'space-between',padding:'16px 20px max(env(safe-area-inset-bottom),24px)'}}>
          <button onClick={()=>setCardIdx(i=>Math.max(0,i-1))} disabled={cardIdx===0}
            style={{background:'none',border:'1px solid rgba(245,245,240,0.1)',borderRadius:8,padding:'8px 20px',cursor:cardIdx===0?'default':'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:700,fontSize:14,color:cardIdx===0?'rgba(245,245,240,0.15)':'rgba(245,245,240,0.5)'}}>
            ← Back
          </button>
          {cardIdx < total - 1 ? (
            <button onClick={()=>setCardIdx(i=>i+1)}
              style={{background:'var(--accent)',border:'none',borderRadius:8,padding:'8px 24px',cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:14,color:'#000'}}>
              Next →
            </button>
          ) : (
            <button onClick={handleApply} disabled={applying}
              style={{background:'var(--accent)',border:'none',borderRadius:8,padding:'8px 20px',cursor:'pointer',fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:14,color:'#000'}}>
              {applying ? 'Applying…' : data?.adjustment?.calorieDelta ? 'Apply Changes' : 'Done'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCard({card, isLast, onApply, applying, data}) {
  return (
    <div style={{paddingBottom:20}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:'var(--accent)',letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12}}>{card.eyebrow}</div>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:28,color:'#f5f5f0',lineHeight:1.15,marginBottom:16}}>{card.headline}</div>
      {card.body && <div style={{fontFamily:"'Barlow',sans-serif",fontSize:14,color:'rgba(245,245,240,0.75)',lineHeight:1.6,marginBottom:20}}>{card.body}</div>}
      {(card.items||[]).map((item,i)=>(
        <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:item.color||'var(--accent)',marginTop:6,flexShrink:0}}/>
          <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:'rgba(245,245,240,0.75)',lineHeight:1.5}}>{item.text}</div>
        </div>
      ))}
      {card.stat && (
        <div style={{display:'flex',gap:12,marginTop:16}}>
          {card.stat.map(({label,value,color},i)=>(
            <div key={i} style={{flex:1,background:'rgba(245,245,240,0.04)',borderRadius:10,padding:'12px 10px',textAlign:'center'}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:22,color:color||'#f5f5f0',lineHeight:1,marginBottom:4}}>{value}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:'rgba(245,245,240,0.3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
            </div>
          ))}
        </div>
      )}
      {card.callout && (
        <div style={{background:'rgba(var(--accent-rgb),0.07)',borderLeft:'3px solid var(--accent)',borderRadius:'0 10px 10px 0',padding:'12px 16px',marginTop:16}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:700,fontSize:15,color:'var(--accent)',marginBottom:4}}>{card.callout.label}</div>
          <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:'rgba(245,245,240,0.75)',lineHeight:1.5}}>{card.callout.text}</div>
        </div>
      )}
    </div>
  );
}

function buildReviewData({food, bw, insights, prs, workoutLogsRaw, macros, profile, twStart}) {
  const foodThisWeek  = (food||[]).filter(l => l.date >= twStart);
  const bwThisWeek    = (bw||[]).filter(l => (l.created_at||'').slice(0,10) >= twStart);
  const workThisWeek  = (workoutLogsRaw||[]).filter(l => l.date >= twStart);

  const calTarget  = macros?.calories || 2000;
  const protTarget = macros?.protein  || 150;

  const dailyCals = foodThisWeek.map(l => (l.entries||[]).reduce((s,e)=>s+(e.calories||0),0)).filter(c=>c>0);
  const dailyProt = foodThisWeek.map(l => (l.entries||[]).reduce((s,e)=>s+(e.protein||0),0));
  const avgCals   = dailyCals.length ? dailyCals.reduce((s,v)=>s+v,0)/dailyCals.length : null;
  const calHit    = dailyCals.filter(c => c >= calTarget*0.9).length;
  const protHit   = dailyProt.filter(p => p >= protTarget*0.9).length;

  const sessions    = workThisWeek.length;
  const volumeTotal = workThisWeek.reduce((s,l)=>s+(l.volume_lbs||0),0);
  const prCount     = (prs||[]).length;

  // Weight trend
  const wLbs = (bwThisWeek||[]).map(l => parseFloat(l.weight) * (l.unit==='kg'?2.205:1));
  const wtChange = wLbs.length >= 2 ? wLbs[wLbs.length-1] - wLbs[0] : null;

  // Top insight
  const topInsight = (insights||[]).find(i => i.priority==='severe' || i.priority==='high') || (insights||[])[0];

  // Single adjustment: calorie delta from top insight
  let calorieDelta = null;
  if (topInsight?.insight_type === 'calorie_intake') {
    if (avgCals && avgCals < calTarget * 0.85) calorieDelta = 200;
    else if (avgCals && avgCals > calTarget * 1.15) calorieDelta = -200;
  } else if (topInsight?.insight_type === 'weight_trend') {
    const goal = (profile?.goal||'').toLowerCase();
    if (wtChange !== null && /cut|lose/.test(goal) && wtChange > 0) calorieDelta = -150;
    else if (wtChange !== null && /gain|bulk/.test(goal) && wtChange < 0) calorieDelta = 200;
  }

  // Projected weight change for next week based on current TDEE
  const projectedWeightChange = avgCals && calTarget
    ? ((avgCals - calTarget) * 7 / 3500).toFixed(2)
    : null;

  return {sessions, volumeTotal, prCount, calHit, protHit, avgCals, calTarget, protTarget, wtChange,
    topInsight, calorieDelta, projectedWeightChange, loggedDays: foodThisWeek.length,
    insights: insights||[], prs: prs||[]};
}

function buildCards(d, macros, profile) {
  const goal = (profile?.goal||'').toLowerCase();
  const calDelta = d.calorieDelta;

  // Card 1 — Headline
  let headline, headlineBody;
  const score = (d.calHit >= 5 ? 1 : 0) + (d.protHit >= 5 ? 1 : 0) + (d.sessions >= 3 ? 1 : 0) + (d.loggedDays >= 5 ? 1 : 0);
  if (score >= 3) {
    headline = "Strong week. Keep this going.";
    headlineBody = `${d.sessions} training sessions, calories on target ${d.calHit} days, protein hit ${d.protHit} days. The compound effect of weeks like this is everything.`;
  } else if (score === 2) {
    headline = "Solid effort. One thing to tighten.";
    headlineBody = d.topInsight
      ? `${d.sessions} sessions logged. Main gap this week: ${d.topInsight.message?.slice(0,100)}`
      : `${d.sessions} sessions logged. Consistency is the leverage — small improvements compound fast.`;
  } else {
    headline = d.sessions > 0 ? "Inconsistent week — but you showed up." : "Rough week. Reset starts now.";
    headlineBody = "What you do this week determines next week's baseline. One consistent day at a time.";
  }

  const cards = [
    { eyebrow: '01 / HEADLINE', headline, body: headlineBody,
      stat: [
        {label:'Sessions', value:d.sessions, color:d.sessions>=3?'#22c55e':'#f59e0b'},
        {label:'Cal Days', value:`${d.calHit}/7`, color:d.calHit>=5?'#22c55e':'#f59e0b'},
        {label:'PRs', value:d.prCount, color:d.prCount>0?'#22c55e':'rgba(245,245,240,0.4)'},
      ]
    },

    // Card 2 — Wins
    { eyebrow: '02 / WINS', headline: 'What went right.',
      items: [
        d.sessions >= 3 && {text:`${d.sessions} training sessions completed — consistency is the #1 driver of progress.`, color:'#22c55e'},
        d.calHit >= 5  && {text:`Calorie target hit ${d.calHit}/7 days — nutritional compliance is excellent.`, color:'#22c55e'},
        d.protHit >= 5 && {text:`Protein target hit ${d.protHit}/7 days — muscle is getting what it needs.`, color:'#22c55e'},
        d.prCount > 0  && {text:`${d.prCount} new PR${d.prCount>1?'s':''} this week — progressive overload is working.`, color:'var(--accent)'},
        d.loggedDays >= 6 && {text:`Logged ${d.loggedDays} days — data quality enables better coaching.`, color:'#22c55e'},
      ].filter(Boolean).slice(0, 4)
    },

    // Card 3 — Friction
    { eyebrow: '03 / FRICTION', headline: 'Where things slipped.',
      items: [
        d.sessions < 2   && {text:`Only ${d.sessions} sessions logged — ${d.sessions===0?'zero training means zero adaptation':'low frequency reduces stimulus below threshold'}.`, color:'#ef4444'},
        d.calHit < 3     && {text:`Calorie target hit only ${d.calHit}/7 days — metabolic adaptation needs consistent fueling.`, color:'#f59e0b'},
        d.protHit < 3    && {text:`Protein target hit only ${d.protHit}/7 days — insufficient for muscle retention during a cut.`, color:'#f59e0b'},
        d.loggedDays < 4 && {text:`Only ${d.loggedDays} days logged — gaps in tracking make it impossible to optimize.`, color:'#f59e0b'},
      ].filter(Boolean).slice(0, 4)
    },

    // Card 4 — Diagnosis
    { eyebrow: '04 / DIAGNOSIS', headline: "What's actually happening.",
      body: d.topInsight?.message || (
        score >= 3
          ? "All signals are aligned. Calorie balance, training load, and recovery are working together. No intervention needed — stay consistent."
          : "Multiple variables are drifting slightly. No single point of failure, but small corrections across nutrition and training frequency would compound into significantly better outcomes."
      ),
      callout: d.topInsight ? {
        label: 'Primary Signal',
        text: d.topInsight.recommendation || 'Continue monitoring.'
      } : null
    },

    // Card 5 — Adjustment (one change only)
    { eyebrow: '05 / ADJUSTMENT', headline: 'One change for next week.',
      body: calDelta
        ? `${calDelta > 0 ? 'Increase' : 'Decrease'} daily calorie target by ${Math.abs(calDelta)} kcal. Current: ${macros?.calories||2000} kcal → Next week: ${(macros?.calories||2000) + calDelta} kcal.`
        : d.protHit < 3
          ? "Prioritize protein above everything else. Hit protein target before worrying about total calories or training. This is the highest-leverage change you can make."
          : d.sessions < 2
            ? "Add one more training session next week. Even 30 minutes counts. Frequency is more important than duration at this stage."
            : "No caloric adjustment needed. The current target is appropriate — execution is the variable to improve.",
      callout: calDelta ? {
        label: calDelta > 0 ? 'Increase target' : 'Reduce target',
        text: `Tap "Apply Changes" to update your calorie target to ${(macros?.calories||2000)+calDelta} kcal/day.`
      } : null
    },

    // Card 6 — Forecast
    { eyebrow: '06 / FORECAST', headline: 'What to expect next week.',
      body: (() => {
        const proj = parseFloat(d.projectedWeightChange||0);
        const goal  = (profile?.goal||'').toLowerCase();
        if (!d.projectedWeightChange) return "Not enough data yet to forecast. Log 7+ days of food and 3+ weight measurements for a personalized projection.";
        const dir = proj > 0.1 ? 'gaining' : proj < -0.1 ? 'losing' : 'maintaining';
        const rate = Math.abs(proj).toFixed(2);
        const aligned = (/bulk|gain/.test(goal)&&proj>0) || (/cut|lose/.test(goal)&&proj<0) || /maintain/.test(goal);
        return `Based on current intake vs TDEE, projecting ${dir} ~${rate} lbs next week. This is ${aligned ? 'aligned with' : 'opposite to'} your ${/bulk/.test(goal)?'bulk':/cut/.test(goal)?'cut':'recomp'} goal.${!aligned?' The calorie adjustment on the previous card addresses this.':''}`;
      })(),
      stat: d.projectedWeightChange !== null ? [
        {label:'Proj. Change', value:`${parseFloat(d.projectedWeightChange)>0?'+':''}${d.projectedWeightChange} lbs`},
        {label:'Cal Balance', value:`${d.avgCals&&d.calTarget?Math.round(d.avgCals-d.calTarget)>0?'+':''+(Math.round(d.avgCals-d.calTarget)):'—'} kcal/d`},
      ] : []
    },
  ];

  return cards.filter(c => (c.items||[undefined]).length > 0 || c.body || c.headline);
}

// ── Connections Dashboard helpers ─────────────────────────────────────────────

const CONN_NODE_R = 26;
const CONN_W = 360, CONN_H = 310;

function connInitNodes(ids, W, H) {
  return ids.map((id, i) => {
    const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
    return { id, x: W / 2 + (W * 0.38) * Math.cos(angle), y: H / 2 + (H * 0.38) * Math.sin(angle), vx: 0, vy: 0 };
  });
}

function connBuildEdges(corrs, activeIds) {
  const set = new Set(activeIds);
  return corrs
    .filter(c => set.has(c.a) && set.has(c.b) && c.correlation_strength > 0.12)
    .map(c => ({ a: c.a, b: c.b, strength: c.correlation_strength, direction: c.direction, lag: c.lag, is_user_data: c.is_user_data }));
}

function connRunForce(nodes, edges, W, H) {
  const n = nodes.map(nd => ({ ...nd }));
  const k = Math.sqrt((W * H) / n.length) * 0.9;
  let temp = W * 0.12;
  for (let iter = 0; iter < 65; iter++) {
    for (let i = 0; i < n.length; i++) { n[i].dx = 0; n[i].dy = 0; }
    for (let i = 0; i < n.length; i++) {
      for (let j = i + 1; j < n.length; j++) {
        const dx = n[i].x - n[j].x, dy = n[i].y - n[j].y;
        const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const f = (k * k) / d;
        n[i].dx += (dx / d) * f; n[i].dy += (dy / d) * f;
        n[j].dx -= (dx / d) * f; n[j].dy -= (dy / d) * f;
      }
    }
    for (const e of edges) {
      const ni = n.find(nd => nd.id === e.a), nj = n.find(nd => nd.id === e.b);
      if (!ni || !nj) continue;
      const dx = nj.x - ni.x, dy = nj.y - ni.y;
      const d = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const f = (d * d) / k * (0.4 + e.strength * 0.6);
      ni.dx += (dx / d) * f; ni.dy += (dy / d) * f;
      nj.dx -= (dx / d) * f; nj.dy -= (dy / d) * f;
    }
    // Gravity toward center
    for (const nd of n) {
      nd.dx += (W / 2 - nd.x) * 0.04;
      nd.dy += (H / 2 - nd.y) * 0.04;
    }
    for (const nd of n) {
      const d = Math.sqrt(nd.dx * nd.dx + nd.dy * nd.dy);
      if (d > 0) {
        nd.x += (nd.dx / d) * Math.min(d, temp);
        nd.y += (nd.dy / d) * Math.min(d, temp);
      }
      nd.x = Math.max(CONN_NODE_R + 4, Math.min(W - CONN_NODE_R - 4, nd.x));
      nd.y = Math.max(CONN_NODE_R + 4, Math.min(H - CONN_NODE_R - 4, nd.y));
    }
    temp *= 0.92;
  }
  return n;
}

function connBezierEdge(x1, y1, x2, y2, r) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const cx = mx - (dy / len) * (len * 0.18);
  const cy = my + (dx / len) * (len * 0.18);
  // Trim endpoints to node radius
  const trim = r + 2;
  const ax = x1 + (dx / len) * trim, ay = y1 + (dy / len) * trim;
  const bx = x2 - (dx / len) * trim, by = y2 - (dy / len) * trim;
  return `M ${ax} ${ay} Q ${cx} ${cy} ${bx} ${by}`;
}

// ── NodeInfoPanel ─────────────────────────────────────────────────────────────

function NodeInfoPanel({ nodeId, correlations }) {
  if (!nodeId) return null;
  const meta = METRIC_META[nodeId];
  const influencers = identifyActiveInfluencers(nodeId, correlations).slice(0, 3);
  const effects = predictDownstreamEffects(nodeId, 'up', correlations).slice(0, 3);
  return (
    <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
        {meta?.icon} {meta?.label} — connections
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {/* Influencers */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>influenced by</div>
          {influencers.length === 0 && <div style={{ fontSize: 10, color: "rgba(245,245,240,0.3)" }}>—</div>}
          {influencers.map(inf => (
            <div key={inf.metric} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 11 }}>{METRIC_META[inf.metric]?.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.7)" }}>{METRIC_META[inf.metric]?.label}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: inf.direction === 'positive' ? '#4ade80' : '#f87171' }}>{inf.direction === 'positive' ? '↑' : '↓'}</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
                  <div style={{ height: 2, width: `${Math.round(inf.strength * 100)}%`, background: inf.direction === 'positive' ? '#4ade80' : '#f87171', borderRadius: 1 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Effects */}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>if you improve it</div>
          {effects.length === 0 && <div style={{ fontSize: 10, color: "rgba(245,245,240,0.3)" }}>—</div>}
          {effects.map(ef => (
            <div key={ef.metric} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 11 }}>{METRIC_META[ef.metric]?.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.7)" }}>{METRIC_META[ef.metric]?.label}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: ef.direction === 'up' ? '#4ade80' : '#f87171' }}>{ef.direction === 'up' ? '↑' : '↓'}{ef.lag > 0 ? ` +${ef.lag}d` : ''}</span>
                </div>
                <div style={{ height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
                  <div style={{ height: 2, width: `${Math.round(ef.strength * 100)}%`, background: ef.direction === 'up' ? '#4ade80' : '#f87171', borderRadius: 1 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── InsightsTicker ─────────────────────────────────────────────────────────────

function InsightsTicker({ insights }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (insights.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % insights.length), 4200);
    return () => clearInterval(t);
  }, [insights.length]);
  if (!insights.length) return null;
  const item = insights[idx];
  return (
    <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontStyle: "italic", fontSize: 12, color: "rgba(245,245,240,0.65)", lineHeight: 1.4, minHeight: 34, transition: "opacity 0.3s" }}>
        {item.text}
      </div>
      {insights.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "center" }}>
          {insights.map((_, i) => (
            <div key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 14 : 4, height: 4, borderRadius: 2, background: i === idx ? "var(--accent)" : "rgba(255,255,255,0.2)", transition: "all 0.3s", cursor: "pointer" }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ConnectionsView (full-screen modal) ───────────────────────────────────────

function ConnectionsView({ userId, onClose, healthSnap, workoutLogsRaw, bodyweightLogs, consumed, memberDays }) {
  const [correlations, setCorrelations] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getConnectionsData(userId)
      .then(data => { setCorrelations(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const metricIds = Object.keys(METRIC_META);

  // Current values for node labels
  const currentValues = {
    sleep:    healthSnap?.sleepHours ?? null,
    hrv:      healthSnap?.hrv ?? null,
    rhr:      healthSnap?.rhr ?? null,
    steps:    healthSnap?.steps != null ? healthSnap.steps / 1000 : null,
    calories: consumed?.calories ?? null,
    volume:   workoutLogsRaw ? (() => { const t = new Date(); t.setHours(0,0,0,0); const ds = t.toISOString().split('T')[0]; const total = (workoutLogsRaw).filter(l => l.date === ds).reduce((s, l) => s + (l.volume_lbs || 0), 0); return total > 0 ? total / 1000 : null; })() : null,
    weight:   bodyweightLogs?.[0]?.weight ?? null,
    tdee:     null,
  };

  const nodes = React.useMemo(() => {
    const raw = connInitNodes(metricIds, CONN_W, CONN_H);
    const edges = connBuildEdges(correlations, metricIds);
    return connRunForce(raw, edges, CONN_W, CONN_H);
  }, [correlations]);

  const edges = React.useMemo(() => connBuildEdges(correlations, metricIds), [correlations]);

  const connectedIds = selectedNode
    ? new Set([selectedNode, ...edges.filter(e => e.a === selectedNode || e.b === selectedNode).flatMap(e => [e.a, e.b])])
    : null;

  const insights = React.useMemo(() => getConnectionInsights(correlations, memberDays), [correlations, memberDays]);

  const flowAnim = `@keyframes edgeFlow{to{stroke-dashoffset:-18}}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#070710", display: "flex", flexDirection: "column" }}>
      <style>{flowAnim}</style>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "max(env(safe-area-inset-top),16px) 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 10px 6px 0", color: "rgba(245,245,240,0.6)", fontFamily: "'DM Mono',monospace", fontSize: 12 }}>← back</button>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase" }}>// Your Connections</div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(245,245,240,0.3)" }}>calculating correlations…</div>
      ) : (
        <>
          {/* SVG Graph */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <svg viewBox={`0 0 ${CONN_W} ${CONN_H}`} style={{ width: "100%", height: "100%" }}>
              {/* Edges */}
              {edges.map(e => {
                const na = nodes.find(n => n.id === e.a);
                const nb = nodes.find(n => n.id === e.b);
                if (!na || !nb) return null;
                const isSelected = selectedNode && (e.a === selectedNode || e.b === selectedNode);
                const dimmed = connectedIds && !isSelected;
                const color = e.direction === 'positive' ? '#4ade80' : '#f97316';
                const opacity = dimmed ? 0.04 : (isSelected ? 0.9 : 0.22 + e.strength * 0.4);
                const strokeW = isSelected ? 1.8 + e.strength * 1.2 : 0.8 + e.strength * 0.8;
                return (
                  <path
                    key={`${e.a}-${e.b}`}
                    d={connBezierEdge(na.x, na.y, nb.x, nb.y, CONN_NODE_R)}
                    stroke={color}
                    strokeWidth={strokeW}
                    fill="none"
                    opacity={opacity}
                    strokeDasharray={isSelected ? "6 12" : undefined}
                    style={isSelected ? { animation: "edgeFlow 0.8s linear infinite" } : undefined}
                  />
                );
              })}
              {/* Nodes */}
              {nodes.map(nd => {
                const meta = METRIC_META[nd.id];
                const val = currentValues[nd.id];
                const status = getNodeStatus(nd.id, val);
                const statusColor = status === 'green' ? '#4ade80' : status === 'yellow' ? '#fbbf24' : status === 'red' ? '#f87171' : '#555';
                const isSelected = selectedNode === nd.id;
                const dimmed = connectedIds && !connectedIds.has(nd.id);
                const opacity = dimmed ? 0.15 : 1;
                return (
                  <g key={nd.id} transform={`translate(${nd.x},${nd.y})`} opacity={opacity} onClick={() => setSelectedNode(isSelected ? null : nd.id)} style={{ cursor: "pointer" }}>
                    {/* Status ring */}
                    <circle r={CONN_NODE_R + 3} fill="none" stroke={statusColor} strokeWidth={isSelected ? 2 : 1} opacity={isSelected ? 1 : 0.5} />
                    {/* Node bg */}
                    <circle r={CONN_NODE_R} fill={isSelected ? "rgba(255,255,255,0.1)" : "#111118"} stroke={meta?.color || "#555"} strokeWidth={isSelected ? 1.5 : 0.8} />
                    {/* Emoji */}
                    <text textAnchor="middle" dominantBaseline="middle" fontSize={14} y={val != null ? -5 : 0}>{meta?.icon}</text>
                    {/* Label */}
                    <text textAnchor="middle" y={val != null ? 8 : 12} fontFamily="'DM Mono',monospace" fontSize={6.5} fill="rgba(245,245,240,0.6)" letterSpacing="0.05em">{meta?.label}</text>
                    {/* Value */}
                    {val != null && (
                      <text textAnchor="middle" y={18} fontFamily="'DM Mono',monospace" fontSize={7} fill={statusColor} fontWeight="600">{formatMetricValue(nd.id, val)}</text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom panel */}
          <div style={{ background: "#0d0d14", borderTop: "1px solid rgba(255,255,255,0.08)", minHeight: 120, maxHeight: 200, overflowY: "auto" }}>
            {selectedNode
              ? <NodeInfoPanel nodeId={selectedNode} correlations={correlations} />
              : <InsightsTicker insights={insights} />
            }
          </div>
        </>
      )}
    </div>
  );
}

// ── ConnectionsInsightCard (Progress > Overview) ──────────────────────────────

function ConnectionsInsightCard({ correlations, memberDays, onOpen }) {
  if (!correlations?.length) return null;
  const daysLeft = Math.max(0, 30 - memberDays);
  const top3 = [...correlations].sort((a, b) => b.correlation_strength - a.correlation_strength).slice(0, 3);
  return (
    <div style={{ margin: "0 16px 14px", padding: "14px 16px", background: "rgba(245,245,240,0.03)", backgroundImage: "radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)", boxShadow: "0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)", borderRadius: 16, animation: "cardIn 0.4s ease-out both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase" }}>// How You Work</div>
        <button onClick={onOpen} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(var(--accent-rgb),0.6)", letterSpacing: "0.08em" }}>View all →</button>
      </div>
      {daysLeft > 0 ? (
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontStyle: "italic", fontSize: 12, color: "rgba(245,245,240,0.4)", lineHeight: 1.4 }}>
          {daysLeft} more days of data needed to reveal your personal patterns.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {top3.map(c => {
            const aMeta = METRIC_META[c.a], bMeta = METRIC_META[c.b];
            const color = c.direction === 'positive' ? '#4ade80' : '#f97316';
            const arrow = c.direction === 'positive' ? '↑' : '↓';
            const pct = Math.round(c.correlation_strength * 100);
            return (
              <div key={`${c.a}-${c.b}`} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13 }}>{aMeta?.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.7)" }}>{aMeta?.label}</span>
                    <span style={{ color, fontSize: 10 }}>{arrow}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.7)" }}>{bMeta?.label}</span>
                    {c.lag > 0 && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.35)" }}>+{c.lag}d</span>}
                    {c.is_user_data && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "rgba(var(--accent-rgb),0.5)", marginLeft: 2 }}>YOUR DATA</span>}
                  </div>
                  <div style={{ height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 1 }}>
                    <div style={{ height: 2, width: `${pct}%`, background: color, borderRadius: 1 }} />
                  </div>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.4)", minWidth: 28, textAlign: "right" }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Peer Comparison: PercentileCard ───────────────────────────────────────────

function PercentileCard({ label, icon, pct, sublabel, expanded, onClick }) {
  const info = getPercentileLabel(pct);
  const arcPct = pct != null ? Math.round(pct) : null;
  // SVG arc: 120° sweep from -150° to -30° at r=22
  const R = 22, cx = 28, cy = 28;
  const arcLen = 2 * Math.PI * R * (220 / 360);
  const arcDash = arcPct != null ? (arcPct / 100) * arcLen : 0;
  const strokeDasharray = `${arcLen}`;
  const strokeDashoffset = arcLen - arcDash;
  const angle = (deg) => { const r = (deg - 90) * Math.PI / 180; return { x: cx + R * Math.cos(r), y: cy + R * Math.sin(r) }; };
  const start = angle(-110); const end = angle(110);
  const arcPath = `M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`;
  return (
    <div onClick={onClick} style={{ flex: 1, minWidth: 0, background: expanded ? "rgba(var(--accent-rgb),0.07)" : "#0d0d0d", border: `1px solid ${expanded ? "rgba(var(--accent-rgb),0.25)" : "rgba(245,245,240,0.07)"}`, borderRadius: 12, padding: "10px 8px 8px", cursor: "pointer", transition: "all 0.2s" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        {/* Gauge */}
        <svg width={56} height={40} viewBox="0 0 56 56">
          <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} strokeLinecap="round" />
          {arcPct != null && (
            <path d={arcPath} fill="none" stroke={info.color} strokeWidth={5} strokeLinecap="round"
              strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
          )}
          <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="'DM Mono',monospace" fontSize={arcPct != null ? 11 : 8} fontWeight="700" fill={arcPct != null ? info.color : "rgba(245,245,240,0.3)"}>
            {arcPct != null ? `${arcPct}` : '—'}
          </text>
        </svg>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.55)", letterSpacing: "0.06em", textAlign: "center", lineHeight: 1.3 }}>{label}</div>
        {pct != null && <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: info.color, letterSpacing: "0.06em", textAlign: "center" }}>{info.short}</div>}
      </div>
    </div>
  );
}

// ── PeerInsightsView (full-screen modal) ─────────────────────────────────────

function PeerInsightsView({ userId, profile, onClose }) {
  const [tab, setTab] = useState(0);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [optedIn, setOptedIn] = useState(true);

  useEffect(() => {
    if (!userId || !profile) return;
    Promise.all([
      getPeerComparison(userId, profile),
      getOptIn(userId),
    ]).then(([comp, opt]) => {
      setComparison(comp);
      setOptedIn(opt ?? true);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, profile?.goal, profile?.weight]);

  async function handleOptToggle(val) {
    setOptedIn(val);
    await setPeerOptIn(userId, val);
  }

  const pct = comparison?.percentiles || {};
  const userM = comparison?.user_metrics || {};

  const METRIC_CARDS = [
    { key: 'adherence',          label: 'Logging',    icon: '📋', format: v => v != null ? `${Math.round(v * 100)}%` : '—',  sublabel: 'days tracked' },
    { key: 'training_frequency', label: 'Training',   icon: '🏋️', format: v => v != null ? `${v.toFixed(1)}/wk` : '—',     sublabel: 'sessions/wk' },
    { key: 'sleep',              label: 'Sleep',      icon: '💤', format: v => v != null ? `${v.toFixed(1)}h` : '—',         sublabel: 'avg hours' },
    { key: 'weight_velocity',    label: 'Progress',   icon: '⚖️', format: v => v != null ? `${v > 0 ? '+' : ''}${v.toFixed(2)}` : '—', sublabel: 'lbs/wk' },
  ];

  const userValForKey = { adherence: userM.adherence, training_frequency: userM.trainingFrequency, sleep: userM.sleepAverage, weight_velocity: userM.weightVelocity };

  const TABS = ['Where You Stand', 'What Works', 'Expectations'];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1001, background: "#070710", display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "max(env(safe-area-inset-top),16px) 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 10px 6px 0", color: "rgba(245,245,240,0.6)", fontFamily: "'DM Mono',monospace", fontSize: 12 }}>← back</button>
        <div style={{ flex: 1, fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase" }}>// Similar Users</div>
        {comparison && (
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.3)", letterSpacing: "0.08em" }}>
            {comparison.is_research_based ? 'RESEARCH NORMS' : `${comparison.sample_size} USERS`}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(245,245,240,0.3)" }}>calculating your cohort…</div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setTab(i)} style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: `2px solid ${tab === i ? "var(--accent)" : "transparent"}`, cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: tab === i ? "var(--accent)" : "rgba(245,245,240,0.4)", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s" }}>{t}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
            {/* Tab 0: Where You Stand */}
            {tab === 0 && (
              <>
                {!optedIn && (
                  <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: 14, marginBottom: 14, fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(251,191,36,0.8)", lineHeight: 1.5 }}>
                    Peer comparison is off. Showing research norms only. Toggle in Settings → Peer Comparison.
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {METRIC_CARDS.map(m => (
                    <PercentileCard
                      key={m.key}
                      label={m.label}
                      icon={m.icon}
                      pct={pct[m.key]}
                      sublabel={m.format(userValForKey[m.key])}
                      expanded={expandedCard === m.key}
                      onClick={() => setExpandedCard(expandedCard === m.key ? null : m.key)}
                    />
                  ))}
                </div>
                {expandedCard && (() => {
                  const mc = METRIC_CARDS.find(m => m.key === expandedCard);
                  const cohortStat = comparison?.cohort_stats?.[expandedCard] || {};
                  const userVal = userValForKey[expandedCard];
                  const label = getPercentileLabel(pct[expandedCard]);
                  return (
                    <div style={{ background: "#0d0d0d", border: "1px solid rgba(var(--accent-rgb),0.12)", borderRadius: 14, padding: 16, marginBottom: 14, animation: "fadeIn 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <span style={{ fontSize: 16 }}>{mc.icon}</span>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{mc.label}</div>
                        {pct[expandedCard] != null && <div style={{ marginLeft: "auto", fontFamily: "'DM Mono',monospace", fontSize: 9, color: label.color, background: `${label.color}18`, borderRadius: 6, padding: "2px 8px" }}>{label.long}</div>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        {['25th', '50th', '75th'].map((label, i) => {
                          const vals = [cohortStat.p25, cohortStat.p50, cohortStat.p75];
                          const val = vals[i];
                          return (
                            <div key={label} style={{ textAlign: "center", flex: 1 }}>
                              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.35)", marginBottom: 3 }}>{label}</div>
                              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(245,245,240,0.7)" }}>{mc.format(val)}</div>
                            </div>
                          );
                        })}
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.35)", marginBottom: 3 }}>YOU</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: getPercentileLabel(pct[expandedCard]).color, fontWeight: 700 }}>{mc.format(userVal)}</div>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, position: "relative" }}>
                        <div style={{ height: "100%", width: "25%", background: "rgba(255,255,255,0.12)", borderRadius: "2px 0 0 2px" }} />
                        <div style={{ height: "100%", width: "25%", left: "25%", position: "absolute", top: 0, background: "rgba(255,255,255,0.18)" }} />
                        <div style={{ height: "100%", width: "25%", left: "50%", position: "absolute", top: 0, background: "rgba(255,255,255,0.12)" }} />
                        {pct[expandedCard] != null && (
                          <div style={{ position: "absolute", top: -4, left: `${pct[expandedCard]}%`, transform: "translateX(-50%)", width: 12, height: 12, borderRadius: "50%", background: getPercentileLabel(pct[expandedCard]).color, border: "2px solid #070710" }} />
                        )}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "rgba(245,245,240,0.2)" }}>0%</span>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "rgba(245,245,240,0.2)" }}>100%</span>
                      </div>
                    </div>
                  );
                })()}
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.25)", lineHeight: 1.6, textAlign: "center", marginTop: 8 }}>
                  {comparison?.is_research_based
                    ? 'Based on research data — cohort data will replace this as more similar users join.'
                    : `Based on ${comparison?.sample_size} similar users. All data anonymous.`}
                </div>
              </>
            )}

            {/* Tab 1: What Works for Others */}
            {tab === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(comparison?.pattern_insights || []).map((text, i) => (
                  <div key={i} style={{ background: "#0d0d0d", border: "1px solid rgba(245,245,240,0.07)", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginTop: 5, flexShrink: 0 }} />
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontStyle: "italic", fontSize: 14, color: "rgba(245,245,240,0.75)", lineHeight: 1.45 }}>{text}</div>
                    </div>
                  </div>
                ))}
                {!comparison?.pattern_insights?.length && (
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(245,245,240,0.3)", textAlign: "center", marginTop: 40 }}>Log more data to unlock pattern insights.</div>
                )}
              </div>
            )}

            {/* Tab 2: Honest Expectations */}
            {tab === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.4)", letterSpacing: "0.1em", marginBottom: 4 }}>REALISTIC RANGES FOR USERS LIKE YOU</div>
                {(comparison?.expectation_ranges || []).map((range, i) => (
                  <div key={i} style={{ background: "#0d0d0d", border: "1px solid rgba(245,245,240,0.07)", borderRadius: 12, padding: 14 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{range.metric}</div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                      {[['Conservative', range.conservative, '#60a5fa'], ['Realistic', range.realistic, '#4ade80'], ['Aggressive', range.aggressive, '#a78bfa']].map(([tier, val, color]) => (
                        <div key={tier} style={{ flex: 1, background: `${color}10`, border: `1px solid ${color}30`, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "rgba(245,245,240,0.4)", marginBottom: 4, letterSpacing: "0.06em" }}>{tier.toUpperCase()}</div>
                          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color, fontWeight: 700 }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {range.note && <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontStyle: "italic", fontSize: 12, color: "rgba(245,245,240,0.45)", lineHeight: 1.4 }}>{range.note}</div>}
                  </div>
                ))}

                {/* Opt-in toggle */}
                <div style={{ background: "#0d0d0d", border: "1px solid rgba(245,245,240,0.07)", borderRadius: 12, padding: 14, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "rgba(245,245,240,0.7)" }}>Contribute my data</div>
                    <div onClick={() => handleOptToggle(!optedIn)} style={{ width: 40, height: 22, borderRadius: 11, background: optedIn ? "var(--accent)" : "rgba(245,245,240,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                      <div style={{ position: "absolute", top: 2, left: optedIn ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: "rgba(245,245,240,0.3)", lineHeight: 1.5 }}>
                    When on, your anonymized data helps refine insights for users like you. Individual data is never shared or exposed.
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── CohortContextCard (Progress > Overview) ───────────────────────────────────

function CohortContextCard({ peerData, memberDays, onOpen }) {
  if (!peerData) return null;
  const pct = peerData.percentiles;
  const bestMetric = Object.entries(pct)
    .filter(([, v]) => v != null)
    .sort(([, a], [, b]) => b - a)[0];

  const METRIC_LABELS = { adherence: 'Logging', training_frequency: 'Training freq.', sleep: 'Sleep', weight_velocity: 'Progress pace' };
  const METRIC_ICONS  = { adherence: '📋', training_frequency: '🏋️', sleep: '💤', weight_velocity: '⚖️' };

  return (
    <div style={{ margin: "0 16px 14px", padding: "14px 16px", background: "rgba(245,245,240,0.03)", backgroundImage: "radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)", boxShadow: "0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)", borderRadius: 16, animation: "cardIn 0.4s ease-out both" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "var(--accent)", letterSpacing: "0.16em", textTransform: "uppercase" }}>// Cohort Context</div>
        <button onClick={onOpen} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(var(--accent-rgb),0.6)", letterSpacing: "0.08em" }}>View all →</button>
      </div>

      {memberDays < 14 ? (
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontStyle: "italic", fontSize: 12, color: "rgba(245,245,240,0.4)", lineHeight: 1.4 }}>
          Your data is helping build context for users like you. Check back at 14 days.
        </div>
      ) : (
        <div>
          {/* Best percentile highlight */}
          {bestMetric && (() => {
            const [key, val] = bestMetric;
            const label = getPercentileLabel(val);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{METRIC_ICONS[key]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "rgba(245,245,240,0.6)", marginBottom: 2 }}>{METRIC_LABELS[key]}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 14, color: label.color }}>{label.short} of similar users</div>
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 20, fontWeight: 700, color: label.color }}>{Math.round(val)}<span style={{ fontSize: 10, opacity: 0.6 }}>%</span></div>
              </div>
            );
          })()}
          {/* Mini percentile row */}
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(pct).filter(([, v]) => v != null).slice(0, 4).map(([key, val]) => {
              const label = getPercentileLabel(val);
              return (
                <div key={key} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: label.color, fontWeight: 700 }}>{Math.round(val)}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "rgba(245,245,240,0.3)", letterSpacing: "0.04em" }}>{METRIC_ICONS[key]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 7, color: "rgba(245,245,240,0.2)", textAlign: "right", marginTop: 6 }}>
            {peerData.is_research_based ? 'vs. research norms' : `vs. ${peerData.sample_size} similar users`}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Coach Insights Card (Progress > Overview) ─────────────────────────────────
function CoachInsightsCard({recall, userId}) {
  const [expanded, setExpanded] = useState(false);
  if (!recall || !recall.similar_past?.length) return null;
  const _profile = getProfileSync(userId);
  const suggestion = adaptMessageSync(recall.intelligent_suggestion, _profile, { addPrefix: false });

  const top = recall.similar_past[0];
  const priColor = top.still_applicable ? '#f59e0b' : '#60a5fa';

  return (
    <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${priColor}22, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase"}}>// Coach Memory</div>
        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",background:"rgba(245,245,240,0.04)",borderRadius:4,padding:"2px 7px"}}>
          {recall.confidence}% confidence
        </div>
      </div>

      {/* Intelligent suggestion — personality-adapted */}
      <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.85)",lineHeight:1.6,marginBottom:12}}>
        {suggestion || recall.intelligent_suggestion}
      </div>

      {/* Similar past event chip */}
      <div style={{background:"rgba(245,245,240,0.04)",borderRadius:10,padding:"10px 12px",marginBottom: expanded ? 12 : 0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:priColor,textTransform:"uppercase",letterSpacing:"0.12em"}}>{top.date}</div>
          <div style={{background:`${priColor}18`,border:`1px solid ${priColor}44`,borderRadius:4,padding:"1px 7px",fontFamily:"'DM Mono',monospace",fontSize:7,color:priColor}}>
            {top.still_applicable ? 'STILL RELEVANT' : 'DIFFERENT NOW'}
          </div>
        </div>
        <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.6)",lineHeight:1.4,marginBottom:top.intervention?6:0}}>{top.description?.slice(0,140)}{top.description?.length>140?'…':''}</div>
        {top.intervention && (
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2}}>Fix applied: {top.intervention?.slice(0,80)}</div>
        )}
      </div>

      {/* Expand for full recall */}
      {recall.similar_past.length > 0 && (
        <button onClick={()=>setExpanded(e=>!e)} style={{background:"none",border:"none",padding:"8px 0 0",cursor:"pointer",width:"100%",textAlign:"left"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{flex:1,height:1,background:"rgba(245,245,240,0.06)"}}/>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{expanded?"hide details":"tell me more"}</span>
            <div style={{flex:1,height:1,background:"rgba(245,245,240,0.06)"}}/>
          </div>
        </button>
      )}

      {expanded && (
        <>
          {/* What's different */}
          {recall.what_is_different?.length > 0 && (
            <div style={{marginTop:12}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>What's different this time</div>
              {recall.what_is_different.map((diff, i) => (
                <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"#60a5fa",marginTop:5,flexShrink:0}}/>
                  <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.65)",lineHeight:1.4}}>{diff}</div>
                </div>
              ))}
            </div>
          )}
          {/* Other similar events */}
          {recall.similar_past.slice(1).map((mem, i) => (
            <div key={i} style={{background:"rgba(245,245,240,0.03)",borderRadius:8,padding:"8px 10px",marginTop:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:mem.still_applicable?'#f59e0b':'rgba(245,245,240,0.35)',textTransform:"uppercase",letterSpacing:"0.1em"}}>{mem.date}</div>
                {mem.effectiveness != null && <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)"}}>{mem.effectiveness}% effective</div>}
              </div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:11,color:"rgba(245,245,240,0.5)",lineHeight:1.4}}>{mem.description?.slice(0,100)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Communication Style Section (Me tab) ─────────────────────────────────────
function CommunicationStyleSection({ userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getPersonalityProfile(userId).then(p => { setProfile(p); setLoading(false); });
  }, [userId]);

  async function handleOverride(type) {
    setSaving(true);
    await setManualOverride(userId, type);
    const updated = await getPersonalityProfile(userId);
    setProfile(updated);
    setSaving(false);
    setShowOptions(false);
  }

  const effectiveType = profile?.manualOverride || profile?.primaryType;
  const typeInfo      = effectiveType && effectiveType !== 'balanced' ? PERSONALITY_TYPES[effectiveType] : null;
  const isOverridden  = !!profile?.manualOverride;
  const hasData       = profile && (profile.confidence || 0) >= 20;

  return (
    <div>
      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",margin:"20px 16px 12px"}}>// Communication Style</div>
      <div style={{margin:"0 16px 16px",padding:"16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.1)",borderRadius:14}}>
        {loading ? (
          <div style={{display:"flex",justifyContent:"center",height:48,alignItems:"center"}}>
            <div style={{width:14,height:14,borderRadius:"50%",border:"2px solid rgba(var(--accent-rgb),0.3)",borderTopColor:"var(--accent)",animation:"spin 0.9s linear infinite"}}/>
          </div>
        ) : hasData ? (
          <>
            {/* Current style chip */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <span style={{fontSize:20,lineHeight:1}}>{typeInfo?.icon || '🔮'}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontStyle:"italic",fontSize:16,color:"#f5f5f0",lineHeight:1.2}}>
                  {typeInfo?.label || 'Balanced'}
                  {isOverridden && <span style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:"var(--accent)",marginLeft:8,textTransform:"uppercase",letterSpacing:"0.1em",verticalAlign:"middle"}}>manual</span>}
                </div>
                <div style={{fontFamily:"'Barlow',sans-serif",fontSize:11,color:"rgba(245,245,240,0.5)",lineHeight:1.4,marginTop:2}}>{typeInfo?.tagline || 'Balanced coaching style'}</div>
              </div>
              <div style={{background:"rgba(245,245,240,0.05)",borderRadius:8,padding:"3px 8px",textAlign:"center",flexShrink:0}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.4)"}}>{profile.confidence}%</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:6,color:"rgba(245,245,240,0.25)",textTransform:"uppercase",letterSpacing:"0.06em"}}>match</div>
              </div>
            </div>

            {/* Description */}
            <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.5)",lineHeight:1.5,marginBottom:12}}>
              {typeInfo?.description || 'The app blends coaching styles based on your usage patterns.'}
            </div>

            {/* Mini score bars */}
            {profile.scores && Object.keys(profile.scores).length > 0 && (
              <div style={{display:"flex",gap:4,marginBottom:12,alignItems:"flex-end",height:32}}>
                {Object.entries(profile.scores).map(([k, v]) => {
                  const isTop = effectiveType === k;
                  return (
                    <div key={k} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{width:"100%",background: isTop ? "var(--accent)" : "rgba(245,245,240,0.1)",borderRadius:"2px 2px 0 0",height:Math.max(4, Math.round((v/100)*22)),transition:"height 0.4s"}}/>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:5,color:isTop?"var(--accent)":"rgba(245,245,240,0.2)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{k.slice(0,4)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Customize toggle */}
            <button onClick={() => setShowOptions(o => !o)}
              style={{background:"none",border:"1px solid rgba(245,245,240,0.1)",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",width:"100%",marginBottom: showOptions ? 10 : 0}}>
              {showOptions ? 'Cancel' : 'Customize coaching style'}
            </button>

            {showOptions && (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.entries(PERSONALITY_TYPES).map(([key, info]) => {
                  const sel = effectiveType === key;
                  return (
                    <button key={key} onClick={() => handleOverride(key)} disabled={saving}
                      style={{background: sel ? "rgba(var(--accent-rgb),0.1)" : "rgba(245,245,240,0.03)", border:`1px solid ${sel ? "rgba(var(--accent-rgb),0.3)" : "rgba(245,245,240,0.08)"}`, borderRadius:10, padding:"10px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left"}}>
                      <span style={{fontSize:16,lineHeight:1}}>{info.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontStyle:"italic",fontSize:13,color:sel?"var(--accent)":"rgba(245,245,240,0.7)"}}>{info.label}</div>
                        <div style={{fontFamily:"'Barlow',sans-serif",fontSize:10,color:"rgba(245,245,240,0.4)",lineHeight:1.3,marginTop:1}}>{info.tagline}</div>
                      </div>
                      {sel && <div style={{width:6,height:6,borderRadius:"50%",background:"var(--accent)",flexShrink:0}}/>}
                    </button>
                  );
                })}
                {isOverridden && (
                  <button onClick={() => handleOverride('auto')} disabled={saving}
                    style={{background:"none",border:"none",padding:"4px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.25)",textTransform:"uppercase",letterSpacing:"0.1em",textAlign:"center"}}>
                    Reset to auto-detect
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:17,color:"rgba(245,245,240,0.35)",marginBottom:6}}>BUILDING YOUR PROFILE.</div>
            <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.4)",lineHeight:1.5,marginBottom:14}}>
              Your coaching style adapts automatically as you use the app. After 30 days, every recommendation is tuned to how you think. Or set a preference now.
            </div>
            <button onClick={() => setShowOptions(o => !o)}
              style={{background:"none",border:"1px solid rgba(245,245,240,0.1)",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",width:"100%",marginBottom: showOptions ? 10 : 0}}>
              {showOptions ? 'Cancel' : 'Set a preference now'}
            </button>
            {showOptions && (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {Object.entries(PERSONALITY_TYPES).map(([key, info]) => (
                  <button key={key} onClick={() => handleOverride(key)} disabled={saving}
                    style={{background:"rgba(245,245,240,0.03)",border:"1px solid rgba(245,245,240,0.08)",borderRadius:10,padding:"10px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
                    <span style={{fontSize:16,lineHeight:1}}>{info.icon}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontStyle:"italic",fontSize:13,color:"rgba(245,245,240,0.7)"}}>{info.label}</div>
                      <div style={{fontFamily:"'Barlow',sans-serif",fontSize:10,color:"rgba(245,245,240,0.4)",lineHeight:1.3,marginTop:1}}>{info.tagline}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Your Patterns Card (Me tab) ───────────────────────────────────────────────
function YourPatternsCard({userId}) {
  const [memories, setMemories] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    Promise.all([getAllMemories(userId, 30), getUserPatterns(userId)])
      .then(([mems, pats]) => { setMemories(mems); setPatterns(pats); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const nonPatternMemories = memories.filter(m => m.memory_type !== 'pattern');
  const breakthroughs = memories.filter(m => m.memory_type === 'breakthrough').length;
  const plateaus      = memories.filter(m => m.memory_type === 'plateau').length;
  const setbacks      = memories.filter(m => m.memory_type === 'setback').length;

  async function handleExport() {
    setExporting(true);
    try {
      const json = await exportMemories(userId);
      const blob = new Blob([json], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'coach-memory.json'; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setExporting(false);
  }

  async function handleDelete(memId) {
    await deleteMemory(userId, memId);
    setMemories(prev => prev.filter(m => m.id !== memId));
  }

  const typeColor = { plateau:'#f59e0b', breakthrough:'#22c55e', setback:'#ef4444', pattern:'#60a5fa', intervention:'var(--accent)', preference:'rgba(245,245,240,0.5)' };
  const typeLabel = { plateau:'Plateau', breakthrough:'Breakthrough', setback:'Setback', pattern:'Pattern', intervention:'Intervention', preference:'Preference' };

  return (
    <div style={{margin:"0 0 0"}}>
      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",margin:"20px 16px 12px"}}>// Your Patterns</div>

      {loading ? (
        <div style={{margin:"0 16px 16px",padding:16,background:"#0d0d0d",borderRadius:14,display:"flex",justifyContent:"center",alignItems:"center",height:60}}>
          <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid rgba(var(--accent-rgb),0.3)",borderTopColor:"var(--accent)",animation:"spin 0.9s linear infinite"}}/>
        </div>
      ) : memories.length === 0 ? (
        <div style={{margin:"0 16px 16px",padding:"18px 16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.1)",borderRadius:14}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"rgba(245,245,240,0.35)",marginBottom:6}}>NO PATTERNS YET.</div>
          <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.4)",lineHeight:1.5}}>
            Coach Memory builds as you use the app. Significant events — plateaus, breakthroughs, recovery dips — get logged automatically. After 30 days, patterns emerge.
          </div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{margin:"0 16px 12px",display:"flex",gap:8}}>
            {[
              {label:'Events', value:nonPatternMemories.length},
              {label:'Breakthroughs', value:breakthroughs, color:'#22c55e'},
              {label:'Patterns', value:patterns.length, color:'#60a5fa'},
            ].map(({label,value,color}) => (
              <div key={label} style={{flex:1,background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.06)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:20,color:color||'#f5f5f0',lineHeight:1,marginBottom:3}}>{value}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Detected patterns */}
          {patterns.length > 0 && (
            <div style={{margin:"0 16px 12px",padding:"12px 14px",background:"#0d0d0d",border:"1px solid rgba(96,165,250,0.15)",borderRadius:12}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:8,color:"#60a5fa",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>Detected patterns</div>
              {patterns.slice(0,3).map((p, i) => (
                <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"#60a5fa",marginTop:5,flexShrink:0}}/>
                  <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.7)",lineHeight:1.4}}>{p.description}</div>
                </div>
              ))}
            </div>
          )}

          {/* Recent memory log */}
          <button onClick={()=>setExpanded(e=>!e)} style={{background:"none",border:"none",padding:"0 16px 10px",cursor:"pointer",width:"100%",textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{expanded?"Hide memory log":"View memory log"} ({nonPatternMemories.length})</span>
              <div style={{flex:1,height:1,background:"rgba(245,245,240,0.06)"}}/>
            </div>
          </button>

          {expanded && (
            <div style={{margin:"0 16px 12px"}}>
              {nonPatternMemories.slice(0,10).map((mem, i) => (
                <div key={mem.id} style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.06)",borderRadius:10,padding:"10px 12px",marginBottom:6,display:"flex",gap:10,alignItems:"flex-start"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:typeColor[mem.memory_type]||"rgba(245,245,240,0.3)"}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:typeColor[mem.memory_type]||"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{typeLabel[mem.memory_type]||mem.memory_type}</div>
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.25)"}}>{new Date(mem.date_observed).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                    </div>
                    <div style={{fontFamily:"'Barlow',sans-serif",fontSize:11,color:"rgba(245,245,240,0.6)",lineHeight:1.4}}>{mem.description?.slice(0,120)}</div>
                    {mem.effectiveness_score != null && (
                      <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",marginTop:3}}>{mem.effectiveness_score}% effective</div>
                    )}
                  </div>
                  <button onClick={()=>handleDelete(mem.id)} style={{background:"none",border:"none",padding:"2px 4px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.15)",flexShrink:0}}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Footer actions */}
          <div style={{margin:"0 16px 20px",display:"flex",gap:8}}>
            <button onClick={handleExport} disabled={exporting} style={{flex:1,background:"none",border:"1px solid rgba(245,245,240,0.1)",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.08em"}}>
              {exporting?"Exporting…":"Export Memory"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── BodyStatusBar — tier-adaptive health strip ───────────────────────────────
function BodyStatusBar({ tier, healthSnap }) {
  if (!healthSnap) return null;
  const hasAny = healthSnap.sleep != null || healthSnap.rhr != null || healthSnap.hrv != null || healthSnap.steps != null || healthSnap.calories != null;
  if (!hasAny) return null;

  if (tier === 'beginner') {
    const sl = healthSnap.sleep;
    const energyLevel = sl == null ? 'ok' : sl >= 7 ? 'good' : sl >= 6 ? 'ok' : 'low';
    const dotColors  = { good: '#22c55e', ok: '#FEA020', low: '#EF4444' };
    const bodyLabels = { good: 'Energy looks good — ready to train.', ok: 'Moderate energy. Train smart today.', low: 'Low energy today. Listen to your body.' };
    return (
      <div style={{margin:"0 20px 12px",padding:"10px 14px",background:"rgba(245,245,240,0.03)",border:"1px solid rgba(245,245,240,0.07)",borderRadius:12,display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:dotColors[energyLevel],flexShrink:0}}/>
        <div style={{fontFamily:"var(--body)",fontSize:12,color:"rgba(245,245,240,0.6)"}}>{bodyLabels[energyLevel]}</div>
      </div>
    );
  }

  if (tier === 'intermediate') {
    const sl = healthSnap.sleep;
    const recoveryOk = sl == null ? null : sl >= 7;
    const rhrOk = healthSnap.rhr == null ? null : healthSnap.rhr <= 65;
    const metrics = [
      sl   != null && { label:'Sleep',    value:`${sl}h`,                     ok: sl >= 7 },
      healthSnap.rhr  != null && { label:'RHR',     value:`${healthSnap.rhr}bpm`,         ok: healthSnap.rhr <= 65 },
      healthSnap.hrv  != null && { label:'HRV',     value:`${healthSnap.hrv}ms`,          ok: healthSnap.hrv >= 50 },
    ].filter(Boolean).slice(0, 3);
    if (!metrics.length) return null;
    return (
      <div style={{margin:"0 20px 12px",padding:"10px 14px",background:"rgba(245,245,240,0.03)",border:"1px solid rgba(245,245,240,0.07)",borderRadius:12,display:"flex",justifyContent:"space-around"}}>
        {metrics.map(m => (
          <div key={m.label} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:14,color:m.ok?"#22c55e":"#FEA020",lineHeight:1}}>{m.value}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{m.label}</div>
          </div>
        ))}
      </div>
    );
  }

  // advanced — full strip (identical to original Apple Health Strip)
  return (
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
  );
}

// ─── CoachAlertsStream — show top alert, collapse the rest ────────────────────
function CoachAlertsStream({ userMode, children }) {
  const [expanded, setExpanded] = useState(false);
  const valid = React.Children.toArray(children).filter(Boolean);
  if (!valid.length) return null;
  const [top, ...rest] = valid;
  return (
    <>
      {top}
      {rest.length > 0 && !expanded && (
        <div
          onClick={() => setExpanded(true)}
          style={{margin:"0 20px 6px",padding:"10px 14px",background:"rgba(245,245,240,0.03)",border:"1px solid rgba(245,245,240,0.08)",borderRadius:10,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
        >
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.45)",textTransform:"uppercase",letterSpacing:"0.12em"}}>{rest.length} more alert{rest.length>1?"s":""} below</span>
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)"}}>SHOW ↓</span>
        </div>
      )}
      {expanded && rest}
      {expanded && rest.length > 0 && (
        <div
          onClick={() => setExpanded(false)}
          style={{margin:"0 20px 6px",padding:"8px 14px",cursor:"pointer",textAlign:"center"}}
        >
          <span style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.12em"}}>COLLAPSE ↑</span>
        </div>
      )}
    </>
  );
}

export function App({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,onEarnedCals,onSignOut,user}) {
  const [section,setSection]=useState("today"); // today | train | fuel | progress | me
  const [isMobile,setIsMobile]=useState(window.innerWidth<769);
  const [_dbgFont,_setDbgFont]=useState("?");
  const [_dbgFontLoaded,_setDbgFontLoaded]=useState("?");
  useEffect(()=>{
    if(!GOCLUB_REDESIGN||!SHOW_DEBUG)return;
    // rAF ensures stylesheet has applied before reading computed style.
    const id=requestAnimationFrame(()=>{
      const el=document.querySelector(".goclub")||document.body;
      const cascade=window.getComputedStyle(el).fontFamily.split(",")[0].replace(/['"]/g,"").trim();
      _setDbgFont(cascade);
      // Font Loading API: did the file actually arrive?
      _setDbgFontLoaded(document.fonts.check(`12px '${cascade}'`) ? "✅ loaded" : "⏳ pending");
    });
    return()=>cancelAnimationFrame(id);
  },[section]);

  useEffect(()=>{
    const handler=()=>setIsMobile(window.innerWidth<769);
    window.addEventListener("resize",handler);
    return()=>window.removeEventListener("resize",handler);
  },[]);

  const [log,setLog]=useState([]);
  const [skippedSlots,setSkippedSlots]=useState([]);
  const [slotOverages,setSlotOverages]=useState({});
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

  const [city,setCity]=useState(profile.city||"");
  const [workout,setWorkout]=useState(""); const [workoutLoading,setWorkoutLoading]=useState(false);
  const [dashboardLoaded,setDashboardLoaded]=useState(false);
  const [workoutsLoaded,setWorkoutsLoaded]=useState(false);
  const [activeWorkout,setActiveWorkout]=useState(null);
  const [restTimer,setRestTimer]=useState(0); const [restActive,setRestActive]=useState(false);
  const restInterval=useRef(null);
  const [showLocalRest,setShowLocalRest]=useState(false);
  const [localRestSecs,setLocalRestSecs]=useState(90);
  const [history,setHistory]=useState({});
  const [workoutLogsRaw,setWorkoutLogsRaw]=useState([]);
  const [dbPRs,setDbPRs]=useState([]);
  const [deloadActive,setDeloadActive]=useState(profile?.deload_active||false);
  const [deloadStartedAt,setDeloadStartedAt]=useState(profile?.deload_started_at||null);
  const [deloadSnooze,setDeloadSnooze]=useState(()=>localStorage.getItem("deload_snooze")||null);
  const [upcomingDeload,setUpcomingDeload]=useState(null);
  const [deloadWeeksHistory,setDeloadWeeksHistory]=useState([]);
  const [activePlateaus,setActivePlateaus]=useState([]);
  const [plateauSnooze,setPlateauSnooze]=useState(()=>localStorage.getItem("plateau_snooze")||null);
  const [balanceCorrections,setBalanceCorrections]=useState([]);
  const [latestBalance,setLatestBalance]=useState(null);
  const [balanceSnooze,setBalanceSnooze]=useState(()=>localStorage.getItem("balance_snooze")||null);
  const [programCurrentWeek,setProgramCurrentWeek]=useState(null);
  const [recentAdjustments,setRecentAdjustments]=useState([]);
  const [weekAdjustment,setWeekAdjustment]=useState(null);
  const [adjSnooze,setAdjSnooze]=useState(()=>localStorage.getItem("adj_snooze")||null);
  const [fatigueAlert,setFatigueAlert]=useState(null);
  const [fatigueSnooze,setFatigueSnooze]=useState(()=>localStorage.getItem("fatigue_snooze")||null);
  const [todayProtocol,setTodayProtocol]=useState(null);
  const [skipConfirmDeload,setSkipConfirmDeload]=useState(false);
  const [dailyScores,setDailyScores]=useState(()=>(profile?.daily_scores||[]).slice(-90));
  const [scoreMilestones,setScoreMilestones]=useState(()=>profile?.score_milestones||[]);
  const [activeMilestone,setActiveMilestone]=useState(null);
  const [showScoreModal,setShowScoreModal]=useState(false);
  const [dismissedWarnings,setDismissedWarnings]=useState(()=>{try{return JSON.parse(localStorage.getItem("dismissed_score_warnings")||"{}");}catch{return{};}});
  const [waterLogs,setWaterLogs]=useState([]);
  const [waterHistory,setWaterHistory]=useState([]);
  const [comebackDismissed,setComebackDismissed]=useState(()=>localStorage.getItem("comeback_dismissed")===new Date().toISOString().split("T")[0]);
  const [planMode,setPlanMode]=useState(()=>wPrefs?.isHyrox?'hyrox':wPrefs?.isHybrid?'hybrid':'strength');
  const [runPlan,setRunPlan]=useState(()=>wPrefs?.runPlan||"Couch to 5K");
  const [hybridMix,setHybridMix]=useState(()=>{
    const bias=wPrefs?.hybridBias||"lifting_primary";
    return{
      strength:bias!=="running_primary",
      run:bias==="balanced"||bias==="running_primary",
      hyrox:wPrefs?.isHyrox||false,
    };
  });
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
  const [activeSessionOpen,setActiveSessionOpen]=useState(false);
  const [fuelScreen,setFuelScreen]=useState("home");    // home | log | recs | recipes | fast
  const [progressTab,setProgressTab]=useState("overview");
  const [fuelResetSignal,setFuelResetSignal]=useState(0);
  const [showPhotoLogger,setShowPhotoLogger]=useState(false);
  const [workoutSavedMsg,setWorkoutSavedMsg]=useState("");
  const [toasts,setToasts]=useState([]);
  const BRIEF_FALLBACK={greeting:"Good morning.",yesterday:"Yesterday is done — today is what matters.",today:"Show up, do the work, trust the process.",coach_says:"Focus on form over everything else today.",sign_off:"Let's go."};
  const [morningBrief,setMorningBrief]=useState(BRIEF_FALLBACK);
  const [morningBriefLoading,setMorningBriefLoading]=useState(false);
  const [morningBriefError,setMorningBriefError]=useState(null);
  const [briefDismissed,setBriefDismissed]=useState(()=>localStorage.getItem("brief_dismissed")===new Date().toISOString().split("T")[0]);
  const [briefTrigger,setBriefTrigger]=useState(0);
  const [showCheckin,setShowCheckin]=useState(false);
  const [sorenessData,setSorenessData]=useState(null);
  const [checkinDone,setCheckinDone]=useState(false);
  const [morningCheckinDone,setMorningCheckinDone]=useState(false);
  const [morningCheckinChecked,setMorningCheckinChecked]=useState(false);
  const [postWorkoutPrompt,setPostWorkoutPrompt]=useState(null);

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

  // ── Weekly Review Modal ────────────────────────────────────────────────────
  const [showWeeklyReviewModal,setShowWeeklyReviewModal]=useState(false);

  // ── Proactive Game Plan ───────────────────────────────────────────────────
  const [gamePlanItems,setGamePlanItems]=useState(()=>{try{const k='cm_gameplan_'+new Date().toISOString().split('T')[0];return JSON.parse(localStorage.getItem(k)||'[]');}catch{return[];}});
  const [dismissedGamePlan,setDismissedGamePlan]=useState(()=>{try{return new Set(JSON.parse(localStorage.getItem('cm_gp_dismissed')||'[]'));}catch{return new Set();}});

  // ── Failure Pattern Alert ─────────────────────────────────────────────────
  const [patternAlert,setPatternAlert]=useState(null);

  // ── Personality Engine ────────────────────────────────────────────────────
  const [personalityProfile,setPersonalityProfile]=useState(null);

  // ── Connections Dashboard ─────────────────────────────────────────────────
  const [showConnectionsView,setShowConnectionsView]=useState(false);

  // ── Peer Comparison ───────────────────────────────────────────────────────
  const [showPeerView,setShowPeerView]=useState(false);

  // ── Feature Unlock System ──────────────────────────────────────────────────
  const [showAppTour,setShowAppTour]=useState(false);
  const [pendingUnlock,setPendingUnlock]=useState(null);
  const [showFeatureTour,setShowFeatureTour]=useState(false);
  const [featureTourSteps,setFeatureTourSteps]=useState([]);

  // ── Win Celebrations ───────────────────────────────────────────────────────
  const [showWinScreen,setShowWinScreen]=useState(null);
  const [pendingStreakWin,setPendingStreakWin]=useState(null);
  const [briefExpanded,setBriefExpanded]=useState(()=>{const today=new Date().toISOString().split("T")[0];return localStorage.getItem("brief_expanded")===today;});
  const [sessionExpandedToday,setSessionExpandedToday]=useState(false);
  const [graduationDismissed,setGraduationDismissed]=useState(false);

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
      sb.from("food_logs").select("entries,skipped_slots,slot_overages").eq("user_id",user.id).eq("date",logDate).maybeSingle()
        .then(({data})=>{if(data?.entries)setLog(data.entries);setSkippedSlots(data?.skipped_slots||[]);setSlotOverages(data?.slot_overages||{});}),
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
      sb.from("personal_records").select("exercise_name,weight,reps,date").eq("user_id",user.id).order("date",{ascending:false}).limit(30)
        .then(({data})=>{if(data)setDbPRs(data);}),
      sb.from("deload_weeks").select("*").eq("user_id",user.id).order("week_start",{ascending:false}).limit(20)
        .then(({data})=>{if(data)setDeloadWeeksHistory(data);}),
      getActivePlateaus(user.id).then(data=>{if(data)setActivePlateaus(data);}).catch(()=>{}),
      getLatestBalance(user.id).then(b=>{if(b){setLatestBalance(b);setBalanceCorrections(getBalanceCorrections(b));}}).catch(()=>{}),
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
    const params=new URLSearchParams(window.location.search);
    const stravaParam=params.get("strava");
    if(stravaParam==="connected"){showToast("Strava connected! Last 30 days synced.","success",{duration:4000});history.replaceState({},"",window.location.pathname);}
    else if(stravaParam==="denied"){showToast("Strava connection cancelled.","info");history.replaceState({},"",window.location.pathname);}
    else if(stravaParam==="error"){showToast("Strava connection failed. Try again.","error");history.replaceState({},"",window.location.pathname);}
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
  const [completedWorkout,setCompletedWorkout]=useState(null);
  const notifTimeoutRef=useRef(null);
  const [middayDismissed,setMiddayDismissed]=useState(()=>{try{const d=localStorage.getItem('midday_dismissed');return d&&(Date.now()-parseInt(d))<7200000;}catch{return false;}});
  const [firstWeekCardDismissed,setFirstWeekCardDismissed]=useState(()=>{try{return!!localStorage.getItem('cm_1week_dismissed');}catch{return false;}});
  const [pendingMilestone,setPendingMilestone]=useState(null);


  useEffect(()=>{
    if(activeWorkout&&!workoutStartTime)setWorkoutStartTime(Date.now());
    if(!activeWorkout&&!workoutSummary)setWorkoutStartTime(null);
  },[activeWorkout]);


  // ── Persist food log: single row per day, entries = full jsonb array ────────
  async function saveFoodLog(uid,entries){
    const today=new Date().toISOString().split("T")[0];
    const {error}=await sb.from("food_logs")
      .upsert({user_id:uid,date:today,entries},{onConflict:"user_id,date"});
    if(error)console.error("[saveFoodLog] error:",error.message,error.code);
    // Sync per-slot aggregates to macro_memory (fire and forget)
    const slotGroups={};
    entries.forEach(e=>{
      const s=typeof e.slot==="number"?e.slot:1;
      if(!slotGroups[s])slotGroups[s]=[];
      slotGroups[s].push(e);
    });
    const sType=schedule?.[todayKey]||null;
    Object.entries(slotGroups).forEach(([slot,slotEntries])=>{
      saveMealToMemory(uid,today,parseInt(slot),slotEntries,sType).catch(()=>{});
    });
  }

  async function saveSkippedSlots(newSkipped){
    if(!user)return;
    setSkippedSlots(newSkipped);
    const today=new Date().toISOString().split("T")[0];
    await sb.from("food_logs").upsert({user_id:user.id,date:today,skipped_slots:newSkipped},{onConflict:"user_id,date"});
  }

  async function saveSlotOverages(newOverages){
    if(!user)return;
    setSlotOverages(newOverages);
    const today=new Date().toISOString().split("T")[0];
    await sb.from("food_logs").upsert({user_id:user.id,date:today,slot_overages:newOverages},{onConflict:"user_id,date"});
  }

  function handlePhotoLog(entries){
    const isFirstMeal=log.length===0;
    const newLog=[...entries,...log];
    setLog(newLog);
    if(user){
      saveFoodLog(user.id,newLog);
      const totals=entries.reduce((a,e)=>({calories:a.calories+e.calories,protein:a.protein+e.protein}),{calories:0,protein:0});
      track(EVENTS.FOOD_LOGGED,{method:"photo",calories:totals.calories,protein:totals.protein,items:entries.length},user.id);
    }
    setShowPhotoLogger(false);
    setFuelScreen("home");
    if(isFirstMeal){const sl=wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner';showToast(getWin('first_meal',sl)?.headline||'FIRST MEAL LOGGED.');}
  }

  // Load food log for selected date (re-runs when logDate or user changes)
  useEffect(()=>{
    if(!user)return;
    setLog([]);
    sb.from("food_logs").select("entries,skipped_slots,slot_overages").eq("user_id",user.id).eq("date",logDate).maybeSingle().then(({data})=>{
      if(data?.entries)setLog(data.entries);
      setSkippedSlots(data?.skipped_slots||[]);
      setSlotOverages(data?.slot_overages||{});
    });
  },[user,logDate]);

  // Load workout history + bodyweight + water on mount
  useEffect(()=>{
    if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    // Workout history — last 50 sessions
    sb.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(50).then(({data,error})=>{
      if(error)console.error("[loadWorkoutHistory] error:",error.message);
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
    sb.from("personal_records").select("exercise_name,weight,reps,date").eq("user_id",user.id).order("date",{ascending:false}).limit(30)
      .then(({data})=>{if(data)setDbPRs(data);});
    // Deload history
    sb.from("deload_weeks").select("*").eq("user_id",user.id).order("week_start",{ascending:false}).limit(20)
      .then(({data})=>{if(data)setDeloadWeeksHistory(data);});
    // Active plateaus
    getActivePlateaus(user.id).then(data=>{if(data)setActivePlateaus(data);}).catch(()=>{});
    // Muscle balance
    getLatestBalance(user.id).then(b=>{if(b){setLatestBalance(b);setBalanceCorrections(getBalanceCorrections(b));}}).catch(()=>{});
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

    // ── Feature unlock check — once per day ────────────────────────────────
    const lastUnlockCheck=localStorage.getItem('last_unlock_check');
    const todayStr=new Date().toISOString().split('T')[0];
    if(lastUnlockCheck!==todayStr){
      localStorage.setItem('last_unlock_check',todayStr);
      getUserStats(user.id,profile).then(stats=>{
        checkFeatureUnlocks(user.id,stats).catch(()=>{});
      }).catch(()=>{});
    }
    // Load pending unlock card
    getPendingUnlock(user.id).then(pending=>{
      if(pending&&pending.feature)setPendingUnlock(pending);
    }).catch(()=>{});

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
    // Proactive adjustments — game plan from calendar events
    if(user?.id&&profile){
      generateProactiveAdjustments(user.id,profile).then(items=>{
        if(!items?.length)return;
        const today=new Date().toISOString().split('T')[0];
        try{localStorage.setItem('cm_gameplan_'+today,JSON.stringify(items));}catch{}
        setGamePlanItems(items);
      }).catch(()=>{});
    }
  },[calendarConnected,user,schedule]);

  // ── Coach Memory — weekly outcome updates + pattern detection ─────────────
  useEffect(()=>{
    if(!user?.id)return;
    updateMemoryOutcomes(user.id).catch(()=>{});
    detectRecurringPatterns(user.id).catch(()=>{});
    trackInterventionOutcome(user.id).catch(()=>{});
  },[user?.id]);

  // ── Personality detection — weekly, populates module cache for sync access ─
  useEffect(()=>{
    if(!user?.id)return;
    detectPrimaryPersonality(user.id).then(p=>{if(p)setPersonalityProfile(p);}).catch(()=>{});
  },[user?.id]);

  // ── Outreach intelligence — debounced 4h, fires on app foreground ──────────
  useEffect(()=>{
    if(!user?.id||!profile?.created_at)return;
    const memberDays=Math.floor((Date.now()-new Date(profile.created_at).getTime())/864e5);
    runOutreachCheck(user.id,{
      workoutLogs: workoutLogsRaw||[],
      bodyweightLogs: bodyweightLogs||[],
      macros,
      memberDays,
    }).catch(()=>{});
    calibrateFrequency(user.id).catch(()=>{});
  },[user?.id,profile?.created_at]);

  // ── Failure pattern detection — runs once on load, needs 30+ member days ──
  useEffect(()=>{
    if(!user?.id||!profile?.created_at)return;
    const memberDays=Math.floor((Date.now()-new Date(profile.created_at).getTime())/864e5);
    if(memberDays<30)return;
    detectActivePatterns(user.id,{workoutLogs:workoutLogsRaw||[],weightLogs:bodyweightLogs||[],profile})
      .then(detection=>{
        if(detection)setPatternAlert(detection);
      }).catch(()=>{});
  },[user?.id,profile?.created_at,workoutLogsRaw?.length,bodyweightLogs?.length]);

  // ── Weekly review trigger — Monday first open or Sunday evening ───────────
  useEffect(()=>{
    if(!user?.id||!workoutLogsRaw?.length)return;
    const now=new Date();
    const dow=now.getDay(); // 0=Sun, 1=Mon
    const hour=now.getHours();
    const isTriggerTime=(dow===1&&hour<12)||(dow===0&&hour>=17);
    if(!isTriggerTime)return;
    const twStart=(()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d.toISOString().split('T')[0];})();
    const seenKey='cm_wr_seen_'+twStart;
    if(localStorage.getItem(seenKey)==='1')return;
    // Only show if at least 3 sessions or 5 logged days this past week
    const sessions=(workoutLogsRaw||[]).filter(l=>l.date>=twStart).length;
    if(sessions<1)return;
    localStorage.setItem(seenKey,'1');
    setShowWeeklyReviewModal(true);
  },[user?.id,workoutLogsRaw?.length]);

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
        setTrainScreen("active");setActiveSessionOpen(true);
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

  // ── Morning check-in: query once per session to see if already logged today ──
  useEffect(()=>{
    if(!user?.id||morningCheckinChecked)return;
    const today=new Date().toISOString().split('T')[0];
    sb.from('morning_checkins').select('id').eq('user_id',user.id).eq('date',today).maybeSingle()
      .then(({data})=>{
        setMorningCheckinDone(!!data);
        setMorningCheckinChecked(true);
      }).catch(()=>setMorningCheckinChecked(true));
  },[user,morningCheckinChecked]);

  // ── Morning Brief ───────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!user||wPrefs.morningBriefEnabled===false)return;
    if(briefTrigger===0&&briefDismissed)return;
    setMorningBriefLoading(true);setMorningBriefError(null);
    getMorningBrief(user.id)
      .then(content=>{
        setMorningBrief(content);
        setMorningBriefLoading(false);
        track(EVENTS.AI_MORNING_BRIEF,{cached:true},user.id);
      })
      .catch(e=>{
        console.error("[morningBrief] error:",e);
        setMorningBriefLoading(false);
      });
  },[user,wPrefs.morningBriefEnabled,briefTrigger]);

  // Soreness check-in — show if user trained yesterday and hasn't logged today
  useEffect(()=>{
    if(!user?.id)return;
    (async()=>{
      try{
        const [trained,logged]=await Promise.all([trainedYesterday(user.id),alreadyLoggedToday(user.id)]);
        if(trained&&!logged){setShowCheckin(true);}
        if(logged){
          const data=await getTodaySoreness(user.id);
          if(data){setSorenessData(data);setCheckinDone(true);}
        }
      }catch(e){console.error("[soreness check]",e);}
    })();
  },[user?.id]);

  // midnight refresh — invalidate brief at next midnight
  useEffect(()=>{
    const now=new Date();
    const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,5);
    const ms=midnight-now;
    const t=setTimeout(()=>{
      localStorage.removeItem("brief_date");
      localStorage.removeItem("brief_content");
      setBriefDismissed(false);
      setBriefTrigger(n=>n+1);
    },ms);
    return()=>clearTimeout(t);
  },[]);

  function previewMorningBrief(){
    localStorage.removeItem("brief_dismissed");
    setBriefDismissed(false);
    setMorningBrief(BRIEF_FALLBACK);
    setMorningBriefError(null);
    // clear DB cache so a fresh brief is generated
    if(user)sb.from("morning_briefs").delete().eq("user_id",user.id).eq("brief_date",new Date().toISOString().split("T")[0]).then(()=>{});
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
  const programWeek=programCurrentWeek||(Math.floor(_daysSince/7)+1);
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
  // Nutrition periodisation override (refeed / carb load / calorie cycling)
  if(todayProtocol&&todayProtocol.protocol_type!=="rest_day"&&todayProtocol.adjusted_calories){
    macros={
      ...macros,
      calories:todayProtocol.adjusted_calories,
      protein:todayProtocol.adjusted_protein_g??macros.protein,
      carbs:todayProtocol.adjusted_carbs_g??macros.carbs,
      fat:todayProtocol.adjusted_fat_g??macros.fat,
    };
  }
  const consumed=log.reduce((a,i)=>({calories:a.calories+i.calories,protein:a.protein+i.protein,carbs:a.carbs+i.carbs,fat:a.fat+i.fat}),{calories:0,protein:0,carbs:0,fat:0});
  const remaining={calories:macros.calories-consumed.calories,protein:macros.protein-consumed.protein,carbs:macros.carbs-consumed.carbs,fat:macros.fat-consumed.fat};

  // ── Coaching notifications (must be after macros + consumed are computed) ───
  useEffect(()=>{
    const today=new Date().toISOString().split('T')[0];
    const lastScheduled=localStorage.getItem('cm_notif_scheduled');
    if(lastScheduled===today)return;
    if(!user?.id||!macros)return;
    const todayStr=new Date().toISOString().split('T')[0];
    const sessionLoggedToday=(workoutLogsRaw||[]).some(w=>w.date===todayStr);
    let streak=0;
    for(let i=0;i<60;i++){
      const ds=new Date(Date.now()-i*864e5).toISOString().split('T')[0];
      if((workoutLogsRaw||[]).some(w=>w.date===ds))streak++;else if(i>0)break;
    }
    const briefLine=morningBrief?.coach_says||morningBrief?.greeting||'';
    import('./services/notifications.js').then(({scheduleCoachingNotifications})=>{
      scheduleCoachingNotifications({
        consumed,macros,todayType,streakCount:streak,
        morningBriefLine:briefLine,sessionLoggedToday
      }).then(()=>{
        localStorage.setItem('cm_notif_scheduled',today);
      }).catch(()=>{});
    }).catch(()=>{});
  },[user?.id,macros?.calories,workoutLogsRaw?.length]);

  // ── Water tracking ──────────────────────────────────────────────────────────
  const waterTarget=getDailyWaterTarget(_profileWithDeload,todayType,todayFocus);
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

  function getRestDuration(tier,repsStr,exRestSecs,exRestReason){
    const reps=parseInt(repsStr)||10;
    if(exRestSecs){
      const reason=exRestReason||`${exRestSecs>=60?Math.round(exRestSecs/60)+" min":""+exRestSecs+"s"} rest`;
      return{secs:exRestSecs,reason};
    }
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

  useEffect(()=>{
    if(!showLocalRest)return;
    if(localRestSecs<=0){setShowLocalRest(false);return;}
    const t=setTimeout(()=>setLocalRestSecs(s=>s-1),1000);
    return()=>clearTimeout(t);
  },[showLocalRest,localRestSecs]);

  useEffect(()=>()=>{clearInterval(restInterval.current);clearTimeout(notifTimeoutRef.current);},[]);

  async function aiLog(){
    if(!foodInput.trim())return;setLogging(true);setLogMsg("");
    try{
      const raw=await ai(`Estimate macros for: "${foodInput}". Reply ONLY valid JSON no markdown: {"food":"short name","calories":0,"protein":0,"carbs":0,"fat":0}`);
      const p=JSON.parse(raw.trim());
      const entry={...p,id:Date.now(),method:"ai"};
      const isFirstMeal=log.length===0;
      const newLog=[entry,...log];
      setLog(newLog);
      setLogMsg(`✓ ${p.food} — ${p.calories} kcal`);
      setFoodInput("");
      if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"ai",calories:p.calories,protein:p.protein},user.id);}
      if(isFirstMeal){const sl=wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner';showToast(getWin('first_meal',sl)?.headline||'FIRST MEAL LOGGED.');}
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
  function addBarcode(){if(!barcodeResult)return;const isFirstMeal=log.length===0;const entry={...barcodeResult,id:Date.now(),method:"barcode"};const newLog=[entry,...log];setLog(newLog);if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"barcode",calories:barcodeResult.calories,protein:barcodeResult.protein},user.id);}setBarcodeResult(null);setBarcodeInput("");setLogMsg(`✓ ${barcodeResult.name} added`);if(isFirstMeal){const sl=wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner';showToast(getWin('first_meal',sl)?.headline||'FIRST MEAL LOGGED.');}}
  function addQuick(){if(!quickFields.calories)return;const entry={food:quickFields.name||"Entry",calories:parseInt(quickFields.calories)||0,protein:parseInt(quickFields.protein)||0,carbs:parseInt(quickFields.carbs)||0,fat:parseInt(quickFields.fat)||0,id:Date.now(),method:"quick"};const newLog=[entry,...log];setLog(newLog);if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"quick",calories:entry.calories,protein:entry.protein},user.id);}setQF({name:"",calories:"",protein:"",carbs:"",fat:""});}
  function removeLog(id){const newLog=log.filter(i=>i.id!==id);setLog(newLog);if(user)saveFoodLog(user.id,newLog);}
  function logEntry(entry){const newLog=[{...entry,id:Date.now(),method:"memory"},...log];setLog(newLog);if(user){saveFoodLog(user.id,newLog);track(EVENTS.FOOD_LOGGED,{method:"memory",calories:entry.calories,protein:entry.protein},user.id);}}

  async function fetchRecs(){
    if(recsLoading||!city.trim())return;
    setRecsLoading(true);setRecs("");
    const dietaryCtx=(profile?.dietary||[]).filter(d=>d!=="none");
    const slots=getSlotsForFreq(profile?.mealFreq||"3");
    const lSlots=getLoggedSlots(log);
    const slotTargets=getSlotTargets(macros.calories,slots,skippedSlots||[],lSlots);
    const nextSlot=slots.find(s=>!lSlots.includes(s)&&!(skippedSlots||[]).includes(s));
    const currentSlotTarget=nextSlot?slotTargets[nextSlot]:Math.round(macros.calories/slots.length);
    const remainingSlots=slots.filter(s=>!lSlots.includes(s)&&!(skippedSlots||[]).includes(s));
    const mealProteinTarget=Math.round((macros.protein/slots.length)+((skippedSlots||[]).length>0?(macros.protein/slots.length*(skippedSlots||[]).length)/(remainingSlots.length||1):0));
    const currentMealSlot=nextSlot?`Meal ${nextSlot}`:"this meal";
    const mealsRemaining=remainingSlots.length;
    try{
      await streamAI(`You are a precision nutrition coach. The user is in ${city||"their city"} and is planning ${currentMealSlot} of ${slots.length} meals today.\n\nCurrent meal calorie target: ${currentSlotTarget} kcal\nProtein target for this meal: ~${mealProteinTarget}g\nMeals remaining after this one: ${Math.max(0,mealsRemaining-1)}\nDaily remaining macros: ${remaining.calories} kcal · ${remaining.protein}g protein · ${remaining.carbs}g carbs · ${remaining.fat}g fat\n\nGoal: ${profile.goal}. Training day: ${todayType}.${dietaryCtx.length>0?" DIETARY RESTRICTIONS (strictly avoid): "+dietaryCtx.join(", ")+".":""}\n\nProvide exactly 3 restaurant meal options using REAL menu items from chains available in ${city||"the US"} (e.g. Chick-fil-A, Chipotle, Subway, McDonald's, Wingstop, Raising Cane's, Panera, Wendy's, Taco Bell). For each option:\n• Restaurant name\n• Exact order with customizations\n• Macros: calories / protein / carbs / fat\n• How close it gets to your ${currentMealSlot} target (${currentSlotTarget} kcal)\n• "Covers X% of your ${currentMealSlot} protein target (${mealProteinTarget}g)"\n\nRules:\n- This is ONE meal, not the full day.${mealsRemaining>1?` Do not recommend a meal exceeding 120% of the ${currentSlotTarget} kcal meal target.`:` This is your last meal — you may go slightly over to hit daily protein.`}\n- Be SPECIFIC. Use real menu item names. Show exact macro numbers.\n\nThen 1 quick home meal option.`,900,"restaurant_ai",
        ()=>{},
        (text)=>{setRecs(text);}
      );
    }catch(e){console.error("[fetchRecs] error:",e);const m=getAIErrorMessage(e);if(m)setRecs("⚠️ "+m+" Tap 'Get Recommendations' to retry.");if(user)trackError(e,"restaurant_ai",user.id);setRecsLoading(false);}
    setRecsLoading(false);
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
    const terrainCtx=(wPrefs.terrain||profile?.terrain)?` | TERRAIN: ${wPrefs.terrain||profile?.terrain}${(wPrefs.trackAccess||profile?.trackAccess)?", track available":", no track — use time-based intervals"}`:"";
    const compCtx=(profile?.strength_comp_type||wPrefs?.strength_comp_type)?` | COMP PREP: ${(profile?.strength_comp_type||wPrefs?.strength_comp_type||"").replace(/_/g," ")}${profile?.strength_comp_federation||wPrefs?.strength_comp_federation?` (${profile?.strength_comp_federation||wPrefs?.strength_comp_federation})`:""} — program accordingly`:"";
    const paceZones5k=(()=>{const t=wPrefs?.current5KTime;if(!t)return null;const[m,s]=t.split(':');const tot=parseInt(m||0)*60+parseInt(s||0);if(!tot)return null;const race=tot/5;const fmt=sec=>{const pm=Math.floor(sec/60);const ps=Math.round(sec%60);return`${pm}:${String(ps).padStart(2,'0')}/km`;};return{easy:fmt(race*1.25),tempo:fmt(race*1.08),race:fmt(race),interval:fmt(race*0.97)};})();
    const runCtx=paceZones5k?`\nPACE ZONES (5K baseline ${wPrefs.current5KTime}): Easy ${paceZones5k.easy} · Tempo ${paceZones5k.tempo} · Race ${paceZones5k.race} · Intervals ${paceZones5k.interval}. Use these exact paces.`:`\nNo 5K baseline — use RPE/perceived effort.`;
    const cardioExpCtx=wPrefs?.cardioExp==='beginner'?'\nBEGINNER RUNNER: walk/run intervals OK, keep under 30min, easy effort only, no tempo yet.'
      :wPrefs?.cardioExp==='advanced'?'\nADVANCED RUNNER: high mileage from week 1, tempo + intervals appropriate, lactate threshold work welcome.'
      :wPrefs?.cardioExp==='intermediate'?'\nINTERMEDIATE RUNNER: standard progression, introduce tempo from week 3, mix easy and moderate efforts.':'';
    const isRunPrompt=planMode==="running"||(wPrefs?.splitType||"").toLowerCase().includes("run");
    const prompt=todayType==="rest"
      ?`REST DAY recovery for ${profile.goal} athlete. Mobility, stretching, foam rolling, recovery nutrition. Equipment: ${wPrefs.equipment}. Clear sections.`
      :`Complete ${todayFocus} session.\nATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Split: ${wPrefs.splitType} | Exp: ${profile.liftExp||"intermediate"} | Session: ${sessionLen}min${healthCtx}${terrainCtx}${compCtx}${isRunPrompt?runCtx:""}${isRunPrompt?cardioExpCtx:""}${actCtx}${deloadCtx}\nMUSCLE COVERAGE: ${coverage}\nFORMAT: Exercise | Sets×Reps | Rest | Form cue | Overload note\n1.Warm-up 2.Heavy compounds 3.Secondary 4.Isolation (ALL sub-muscles) 5.Finisher/Core${planMode==="hybrid"&&hybridMix.run?"\n═══ RUN BLOCK ═══\nType / Distance / Pace zone":""  }${planMode==="hybrid"&&hybridMix.hyrox||planMode==="hyrox"?`\n═══ HYROX ═══\n${todayType==="cardio"?"8 stations + 1km runs":"3-4 station finisher <20min"}`:""}\nSpecific. Clear headers. No fluff.`;
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
      const structTerrainCtx=(wPrefs.terrain||profile?.terrain)?` | TERRAIN: ${wPrefs.terrain||profile?.terrain}${(wPrefs.trackAccess||profile?.trackAccess)?", track available":", no track — time-based intervals"}`:""
      const structPaceZones5k=(()=>{const t=wPrefs?.current5KTime;if(!t)return null;const[m,s]=t.split(':');const tot=parseInt(m||0)*60+parseInt(s||0);if(!tot)return null;const race=tot/5;const fmt=sec=>{const pm=Math.floor(sec/60);const ps=Math.round(sec%60);return`${pm}:${String(ps).padStart(2,'0')}/km`;};return{easy:fmt(race*1.25),tempo:fmt(race*1.08),race:fmt(race),interval:fmt(race*0.97)};})();
      const structRunCtx=runPlanName?(structPaceZones5k?`\nPACE ZONES (5K baseline ${wPrefs.current5KTime}): Easy ${structPaceZones5k.easy} · Tempo ${structPaceZones5k.tempo} · Race ${structPaceZones5k.race} · Intervals ${structPaceZones5k.interval}.`:`\nNo 5K baseline — use RPE.`):"";
      const structCardioExpCtx=runPlanName?(wPrefs?.cardioExp==='beginner'?'\nBEGINNER RUNNER: walk/run OK, easy effort only, no tempo yet.':wPrefs?.cardioExp==='advanced'?'\nADVANCED RUNNER: tempo + intervals from week 1.':'\nINTERMEDIATE RUNNER: standard progression, tempo from week 3.'):"";

      const structCompCtx=(profile?.strength_comp_type||wPrefs?.strength_comp_type)?` | COMP PREP: ${(profile?.strength_comp_type||wPrefs?.strength_comp_type||"").replace(/_/g," ")}${profile?.strength_comp_federation?` (${profile.strength_comp_federation})`:""} — periodize accordingly`:"";
      const structSessionLen=wPrefs.sessionLength||45;
      const exCount=structSessionLen<=30?"3-4":structSessionLen<=45?"4-5":structSessionLen<=60?"5-6":"6-8";
      const structDeloadCtx=deloadActive?"\n⚠️ DELOAD WEEK — use 12-15 reps on all exercises, 3 sets max per exercise, no PRs, technique focus.":"";
      const raw=await ai(`Build a structured ${todayFocus} workout session.
ATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Experience: ${profile.liftExp||"intermediate"} | Session: ${structSessionLen}min${structHealthCtx}${structTerrainCtx}${structCompCtx}${structRunCtx}${structCardioExpCtx}${structDeloadCtx}
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
      // Inject balance correction exercises at end of session
      if(balanceCorrections?.length>0){
        balanceCorrections.forEach(correction=>{
          correction.exercises.forEach(exStr=>{
            const di=exStr.indexOf(" — ");
            if(di===-1)return;
            const name=exStr.substring(0,di).trim();
            const sr=exStr.substring(di+3).trim().split(" × ");
            const setsCount=parseInt(sr[0])||3;
            const repsVal=sr[1]||"12";
            if(!parsed.exercises.some(e=>e.name===name)){
              parsed.exercises.push({name,notes:"// Added for muscle balance",isBalanceCorrection:true,restSecs:60,sets:Array.from({length:setsCount},()=>({reps:String(repsVal),weight:"",done:false}))});
            }
          });
        });
      }
      setActiveWorkout(parsed);setTrainScreen("active");setActiveSessionOpen(true);
    }catch(e){
      console.error("[startStructured] AI error — falling back to hardcoded program:",e);
      try{
        const daysPerWeek=Object.values(schedule).filter(v=>v==="training").length||3;
        const startD=new Date(profile?.startDate||Date.now());
        const dayIdx=Math.floor((new Date()-startD)/(24*60*60*1000))%(daysPerWeek||1);
        const exs=getWorkoutForDay(daysPerWeek,wPrefs.splitType||"Full Body",dayIdx,wPrefs.equipment||"Full Gym");
        if(exs&&exs.length){
          const fallbackExs=exs.map(ex=>({name:ex.name,notes:ex.notes||"",restSecs:120,sets:Array.from({length:Number(ex.sets)||3},()=>({reps:String(ex.reps||10),weight:"",done:false}))}));
          if(balanceCorrections?.length>0){
            balanceCorrections.forEach(correction=>{
              correction.exercises.forEach(exStr=>{
                const di=exStr.indexOf(" — ");
                if(di===-1)return;
                const name=exStr.substring(0,di).trim();
                const sr=exStr.substring(di+3).trim().split(" × ");
                const setsCount=parseInt(sr[0])||3;
                const repsVal=sr[1]||"12";
                if(!fallbackExs.some(e=>e.name===name)){
                  fallbackExs.push({name,notes:"// Added for muscle balance",isBalanceCorrection:true,restSecs:60,sets:Array.from({length:setsCount},()=>({reps:String(repsVal),weight:"",done:false}))});
                }
              });
            });
          }
          setActiveWorkout({title:todayFocus,exercises:fallbackExs});
          setTrainScreen("active");setActiveSessionOpen(true);
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
    const{secs,reason}=getRestDuration(ex?.tier,reps,ex?.restSecs,ex?.restReason);

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
      showToast(`🔥 New PR — ${weight}${profile?.wUnit||"lbs"} on ${ex?.name||"this exercise"}!`, "pr", {duration:5000});
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
      // Snapshot before any async — prevents "NO ACTIVE SESSION" flash
      setCompletedWorkout({...activeWorkout});
      setTrainScreen('summary');
      try{localStorage.setItem('cm_last_session_time',Date.now().toString());}catch{}

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
          const today=new Date().toISOString().split("T")[0];
          await sb.from("workout_logs").insert({
            user_id:user.id,
            date:today,
            workout:{focus:todayFocus,exercises:setsLogged,calories_burned:burn,type:todayType,readinessTier:activeWorkout.readinessTier||null,exerciseFeedback:feedbackData},
            volume_lbs:Math.round(totalVolume),
            total_sets:setsLogged.reduce((a,e)=>a+e.sets.length,0),
            total_reps:setsLogged.reduce((a,e)=>a+e.sets.reduce((b,s)=>b+(parseInt(s.reps)||0),0),0),
            session_duration_mins:duration,
            pr_count:prs.length,
          });
          if(prs.length>0){
            await sb.from("personal_records").upsert(
              prs.map(pr=>({user_id:user.id,exercise_name:pr.name,weight:parseFloat(pr.weight)||0,reps:parseInt(pr.reps)||1,date:today})),
              {onConflict:"user_id,exercise_name"}
            ).then(({data,error})=>{
              if(error)console.error("[finishWorkout] PR upsert:",error.message);
              else if(data)setDbPRs(p=>{const m={};p.forEach(r=>m[r.exercise_name]=r);(data||[]).forEach(r=>m[r.exercise_name]=r);return Object.values(m);});
            });
          }
          recordWorkoutRecovery(user.id, setsLogged).catch(() => {});
          const pwWindow=getPostWorkoutWindow(activeWorkout);
          if(pwWindow)setPostWorkoutPrompt(pwWindow);
          window.dispatchEvent(new CustomEvent('workoutCompleted', { detail: { userId: user.id } }));
        }catch(e){console.error("[finishWorkout] save error:",e);}
      }

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

      // Plateau detection and resolution
      let plateausBroken=[];
      if(user){
        try{
          // Check if any active plateaus were broken this session
          const checkPromises=setsLogged.map(async ex=>{
            const maxW=Math.max(...ex.sets.filter(s=>s.done!==false).map(s=>parseFloat(s.weight)||0));
            if(maxW>0){
              const resolved=await checkPlateauResolved(user.id,ex.name,maxW);
              if(resolved)plateausBroken.push(ex.name);
            }
          });
          await Promise.all(checkPromises);
          // Detect new plateaus after session saved
          const newPlateaus=await detectPlateaus(user.id,profile);
          if(newPlateaus.length>0){
            setActivePlateaus(prev=>{
              const existing=new Set(prev.map(p=>p.id));
              const added=newPlateaus.filter(p=>p.id&&!existing.has(p.id));
              return [...prev,...added];
            });
          }
          // Refresh resolved plateaus out of state
          if(plateausBroken.length>0){
            setActivePlateaus(prev=>prev.filter(p=>!plateausBroken.includes(p.exercise_name)));
          }
        }catch(e){console.error("[finishWorkout] plateau:",e);}
      }

      // Muscle balance recalculation after session
      if(user){
        calculateMuscleBalance(user.id).then(balance=>{
          if(balance){setLatestBalance(balance);setBalanceCorrections(getBalanceCorrections(balance));}
        }).catch(()=>{});
      }

      // RPE fatigue detection after session
      if(user){
        analyseRPETrends(user.id).then(trends=>{
          if(trends&&(trends.overallFatigue==="high"||trends.overallFatigue==="medium")){
            setFatigueAlert(trends);
          }
        }).catch(()=>{});
      }

      setWorkoutSummary({
        title:todayFocus,duration,burn,
        totalVolume:Math.round(totalVolume),
        totalSets,completedSets:totalSetsLogged,
        prs,exercises:setsLogged,plateausBroken,
      });
      // First workout win
      if(workoutCount===1){
        const sl=wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner';
        setShowWinScreen({...getWin('first_workout',sl),_afterSummary:true});
      }
    } else {
      setActiveWorkout(null);
      try { localStorage.removeItem("cm_active_workout"); } catch {}
      setTrainScreen("progress");setActiveSessionOpen(false);
    }
  }

  function clearWorkoutSummary(){
    setWorkoutSummary(null);
    setCompletedWorkout(null);
    setActiveWorkout(null);
    setWorkoutStartTime(null);
    setTrainScreen("today");
    setActiveSessionOpen(false);
    setSection("today");
    try { localStorage.removeItem("cm_active_workout"); } catch {}
    // Show first-workout win screen after summary dismissed
    if(showWinScreen?._afterSummary){
      setShowWinScreen(prev=>prev?{...prev,_afterSummary:false}:null);
    }
  }

  async function startDeload(){
    const now=new Date().toISOString();
    const today=now.split("T")[0];
    // Find the upcoming deload row from state, or use today as start
    const upcomingRow=deloadWeeksHistory.find(d=>d.status==="upcoming");
    const weekStart=upcomingRow?.week_start||today;
    const weekEndDate=new Date(weekStart);weekEndDate.setDate(weekEndDate.getDate()+6);
    const weekEnd=weekEndDate.toISOString().split("T")[0];
    setDeloadActive(true);setDeloadStartedAt(weekStart);
    setUpcomingDeload(null);
    if(user){
      try{
        await sb.from("profiles").upsert({
          id:user.id,
          profile_data:{...profile,deload_active:true,deload_started_at:weekStart,last_deload_at:now},
          deload_active:true,deload_started_at:weekStart,last_deload_at:now,updated_at:now,
        },{onConflict:"id"});
        const signals=analyzeDeload(workoutLogsRaw,profile,schedule);
        const sigMap={};signals.forEach(s=>{sigMap[s.type]={message:s.label};});
        const {data:deloadRow}=await sb.from("deload_weeks").upsert({
          user_id:user.id,week_start:weekStart,week_end:weekEnd,
          trigger_reason:signals.length>0?"combined":"planned",
          trigger_signals:sigMap,status:"active",volume_reduction_pct:50,
        },{onConflict:"user_id,week_start"}).select().single();
        if(deloadRow)setDeloadWeeksHistory(prev=>[deloadRow,...prev.filter(d=>d.week_start!==weekStart)]);
      }catch(e){console.error("[startDeload]",e);}
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
    setDeloadActive(false);setDeloadStartedAt(null);setUpcomingDeload(null);
    const activeRow=deloadWeeksHistory.find(d=>d.status==="active");
    if(activeRow){
      setDeloadWeeksHistory(prev=>prev.map(d=>d.id===activeRow.id?{...d,status:"completed"}:d));
    }
    if(user){
      try{
        await sb.from("profiles").upsert({
          id:user.id,
          profile_data:{...profile,deload_active:false,deload_started_at:null},
          deload_active:false,updated_at:now,
        },{onConflict:"id"});
        if(activeRow){
          await sb.from("deload_weeks").update({status:"completed"}).eq("id",activeRow.id);
        }
      }catch(e){console.error("[handleDeloadComplete]",e);}
    }
  }

  useEffect(()=>{
    if(deloadActive&&deloadStartedAt){
      const days=(new Date()-new Date(deloadStartedAt))/864e5;
      if(days>=7)handleDeloadComplete();
    }
  },[deloadActive,deloadStartedAt]);

  // ── Daily deload check (once per day) ─────────────────────────────────────
  useEffect(()=>{
    if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    const lastCheck=localStorage.getItem("deload_check_date");
    if(lastCheck===today)return;
    localStorage.setItem("deload_check_date",today);

    // Complete any expired deload
    completeExpiredDeload(user.id).then(completed=>{
      if(completed){
        setDeloadActive(false);setDeloadStartedAt(null);
        setDeloadWeeksHistory(prev=>prev.map(d=>d.id===completed.id?{...d,status:"completed"}:d));
        sb.from("profiles").upsert({id:user.id,deload_active:false,updated_at:new Date().toISOString()},{onConflict:"id"}).catch(()=>{});
      }
    }).catch(()=>{});

    // Activate any upcoming deload that just started
    activateUpcomingDeload(user.id).then(activated=>{
      if(activated){
        setDeloadActive(true);setDeloadStartedAt(activated.week_start);
        setDeloadWeeksHistory(prev=>prev.map(d=>d.id===activated.id?activated:d));
        sb.from("profiles").upsert({id:user.id,deload_active:true,deload_started_at:activated.week_start,updated_at:new Date().toISOString()},{onConflict:"id"}).catch(()=>{});
      }
    }).catch(()=>{});

    // Check if a new deload should be scheduled
    checkDeloadNeeded(user.id).then(result=>{
      if(result){
        setUpcomingDeload(result);
        setDeloadWeeksHistory(prev=>{
          const exists=prev.find(d=>d.id===result.deload?.id);
          return exists?prev:[result.deload,...prev].filter(Boolean);
        });
      }
    }).catch(()=>{});

    getProgramCurrentWeek(user.id).then(data=>{
      if(data?.program_current_week) setProgramCurrentWeek(data.program_current_week);
    }).catch(()=>{});

    analyseRPETrends(user.id).then(trends=>{
      if(trends&&(trends.overallFatigue==="high"||trends.overallFatigue==="medium")){
        setFatigueAlert(trends);
      }
    }).catch(()=>{});
    getRecentAdjustments(user.id).then(setRecentAdjustments).catch(()=>{});

    if(new Date().getDay()===0){
      checkPeriodisationAdjustment(user.id).then(adj=>{
        if(adj&&adj.action!=="no_change"){
          setWeekAdjustment(adj);
          if(adj.new_week) setProgramCurrentWeek(adj.new_week);
          getRecentAdjustments(user.id).then(setRecentAdjustments).catch(()=>{});
        }
      }).catch(()=>{});
    }

    getTodayNutritionProtocol(user.id).then(proto=>{
      if(proto){
        setTodayProtocol(proto);
        triggerEventUnlock(user.id,'protocol_triggered').catch(()=>{});
      }
    }).catch(()=>{});

    // App tour — show once after onboarding
    sb.from('feature_unlocks').select('tour_completed').eq('user_id',user.id).eq('feature_key','app_tour').maybeSingle()
      .then(({data})=>{if(!data?.tour_completed)setShowAppTour(true);}).catch(()=>{});
  },[user?.id]);

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
    if(reps>=12){
      const rate={new:0.05,developing:0.025,established:0.015,veteran:0.01}[wPrefs?.trainingAge]||0.025;
      const step=profile?.wUnit==='kg'?1.25:2.5;
      const w=parseFloat(weight||0);
      const inc=Math.max(step,Math.round(w*rate/step)*step);
      return{weight:(w+inc).toFixed(0),reps:"8-10",note:"Weight ↑"};
    }
    return{weight,reps:String(parseInt(reps)+1),note:"Add a rep"};
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

  // ── Tab navigation helpers ──────────────────────────────────────────────────
  function scrollToTop(){
    const el=appScreenRef.current;
    if(!el)return;
    el.scrollTop=0;
  }

  function resetTabToRoot(tabId){
    switch(tabId){
      case "fuel":
        setFuelScreen("home");
        setFuelResetSignal(s=>s+1);
        break;
      case "train":
        if(trainScreen!=="active")setTrainScreen("today");
        break;
      case "progress":
        setProgressTab("overview");
        break;
      default: break;
    }
  }

  function handleTabPress(tabId){
    if(GOCLUB_REDESIGN && tabId==="plan") return; // Phase 3: will launch onboarding flow
    if(section===tabId){
      resetTabToRoot(tabId);
      scrollToTop();
    }else{
      setSection(tabId);
      setTimeout(scrollToTop,50);
    }
  }

  // ── FEATURE SHOW ME ────────────────────────────────────────────────────────
  function handleFeatureShowMe(featureKey){
    const tourMap={
      streaks:[{targetSelector:'[data-tour="streak-counter"]',headline:'YOUR STREAK',description:"Every day you train or log a meal keeps your streak alive. Don't break the chain."}],
      macro_memory:[{targetSelector:'[data-tour="macro-memory"]',headline:'RECENT MEALS',description:'Your most logged meals appear here. One tap to log them again.'}],
      progress_view:[{targetSelector:'[data-tour="progress-tab"]',headline:'YOUR PROGRESS',description:'Tap here to see your strength progress, nutrition trends, and recovery data.'}],
      rpe_input:[{targetSelector:'[data-tour="rpe-row"]',headline:'RATE YOUR EFFORT',description:'After logging a set tap how hard it felt. This data makes your program smarter.'}],
      training_dna:[{targetSelector:'[data-tour="training-dna"]',headline:'YOUR ATHLETE DNA',description:'This radar shows your strengths across 6 dimensions. It grows as you train.'}],
      plateau_detection:[{targetSelector:'[data-tour="plateau-section"]',headline:'PLATEAU TRACKER',description:'When a lift stalls we detect it and give you a specific strategy to break through.'}],
      advanced_coaching:[{targetSelector:'[data-tour="today-cards"]',headline:'COACHING CARDS',description:'These cards update daily based on your training. Deload alerts, fatigue signals, and more.'}],
      first_pr:[{targetSelector:'[data-tour="pr-section"]',headline:'YOUR RECORDS',description:'Every PR you set is saved here. Watch this list grow.'}],
    };
    const steps=tourMap[featureKey];
    if(steps){setFeatureTourSteps(steps);setShowFeatureTour(true);}
  }

  // ── LAYOUT ─────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    {id:"today",    label:"TODAY",    icon:"today",    tour:"today-tab"},
    {id:"train",    label:"TRAIN",    icon:"train"},
    {id:"fuel",     label:"FUEL",     icon:"fuel",     tour:"fuel-tab"},
    {id:"progress", label:"PROGRESS", icon:"progress", tour:"progress-tab"},
    {id:"me",       label:"ME",       icon:"me",       tour:"me-tab"},
  ];

  // Redesign nav — onboarding-complete condition mirrors NativeApp:
  // profile.goalCals is set by handleProfileDone (the same gate that flips phase→"app").
  const hasPlan = !!profile.goalCals;
  const GOCLUB_NAV_4 = [
    {id:"today", label:"Dashboard", icon:"today"},
    {id:"train", label:"Train",     icon:"train"},
    {id:"fuel",  label:"Fuel",      icon:"fuel"},
    {id:"me",    label:"Me",        icon:"me"},
  ];
  const GOCLUB_NAV_3 = [
    {id:"today", label:"Dashboard", icon:"today"},
    {id:"plan",  label:"Plan",      icon:"plan",  emphasized:true},
    {id:"me",    label:"Me",        icon:"me"},
  ];
  const activeNav = GOCLUB_REDESIGN
    ? (hasPlan ? GOCLUB_NAV_4 : GOCLUB_NAV_3)
    : NAV_ITEMS;

  function TabIcon({name, size=22}) {
    const paths = {
      today: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></g>,
      train: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"><rect x="2" y="9" width="3" height="6" rx="0.5"/><rect x="5" y="7" width="2" height="10" rx="0.5"/><rect x="17" y="7" width="2" height="10" rx="0.5"/><rect x="19" y="9" width="3" height="6" rx="0.5"/><line x1="7" y1="12" x2="17" y2="12"/></g>,
      fuel: <path d="M8 3h6l1 4c0 1.5-2 2.5-4 2.5S7 8.5 7 7l1-4zM7 9v11a1 1 0 001 1h6a1 1 0 001-1V9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>,
      progress: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l5-5 4 4 8-9"/><path d="M14 7h6v6"/></g>,
      me: <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></g>,
      plan: <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-1.8z"/></g>,
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
    const userMode = getUserMode(profile, wPrefs);
    const userTier = getUserTier(profile, wPrefs, userMode);
    const _userData = { profile, wPrefs };
    const visibleSections = getVisibleSections('today', userTier, userMode, _userData);
    let homStreak=0;
    for(let i=0;i<30;i++){
      const d=new Date();d.setDate(d.getDate()-i);
      const ds=d.toISOString().split("T")[0];
      if(workoutLogsRaw.some(w=>w.date===ds))homStreak++;else break;
    }
    const streakCount=homStreak;
    function handleStreakPress(){setSection("train");setTrainScreen("progress");}
    return (
      <div className="page-enter">
        {/* Header */}
        <div className="screen-header" style={{paddingTop:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="header-eyebrow">{new Date().toLocaleDateString("en-US",{weekday:"long"})} · {cfg.label} Day</div>
            <div className="header-title">Hey, {firstName}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div
              onClick={()=>{}}
              style={{
                width:'36px',
                height:'36px',
                borderRadius:'10px',
                background:'rgba(var(--accent-rgb),0.1)',
                border:'1px solid rgba(var(--accent-rgb),0.2)',
                display:'flex',
                flexDirection:'column',
                alignItems:'center',
                justifyContent:'center',
                cursor:'pointer',
                marginRight:'8px',
                gap:'2px',
              }}
            >
              <svg
                width="14"
                height="17"
                viewBox="0 0 14 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{display:'block',margin:'0 auto'}}
              >
                <path
                  d="M7 0C7 0 9.5 3 9.5 5.5C9.5 5.5 11 4 11 4C11 4 14 7.5 14 10.5C14 13.5 11 17 7 17C3 17 0 13.5 0 10.5C0 7.5 2.5 5 2.5 5C2.5 5 3.5 7 4.5 7C4.5 7 2.5 4.5 7 0Z"
                  fill="var(--accent)"
                />
                <path
                  d="M7 8C7 8 8.5 9.5 8.5 11C8.5 12.5 7.8 13.5 7 13.5C6.2 13.5 5.5 12.5 5.5 11C5.5 9.5 7 8 7 8Z"
                  fill="#FEA020"
                />
              </svg>
              <span style={{
                fontFamily:'DM Mono,monospace',
                fontSize:'8px',
                color:'var(--accent)',
                lineHeight:'1',
                fontWeight:'500',
                userSelect:'none',
              }}>
                {streakCount||14}
              </span>
            </div>
            <button className="icon-btn" aria-label="Notifications"><svg width={16} height={16} viewBox="0 0 24 24"><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round"/></svg></button>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--red),#8b1a0a)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--condensed)",fontWeight:800,fontStyle:"italic",fontSize:16,color:"white"}}>{firstName[0].toUpperCase()}</div>
          </div>
        </div>

        {/* BodyStatusBar — tier-adaptive health display */}
        <BodyStatusBar tier={userTier} healthSnap={healthSnap} />

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

        {/* ── PROACTIVE GAME PLAN ── */}
        {gamePlanItems.filter((_,i)=>!dismissedGamePlan.has(i)).length>0&&(
          <GamePlanCard
            items={gamePlanItems.filter((_,i)=>!dismissedGamePlan.has(i))}
            onDismissItem={(idx)=>{
              const realIdx=gamePlanItems.findIndex((_,i)=>!dismissedGamePlan.has(i)&&gamePlanItems.indexOf(gamePlanItems.filter((_,j)=>!dismissedGamePlan.has(j))[idx])===i);
              const next=new Set(dismissedGamePlan);
              // find the actual index in the original array for this filtered-idx item
              let count=0;
              for(let i=0;i<gamePlanItems.length;i++){
                if(!dismissedGamePlan.has(i)){if(count===idx){next.add(i);break;}count++;}
              }
              setDismissedGamePlan(next);
              try{localStorage.setItem('cm_gp_dismissed',JSON.stringify([...next]));}catch{}
              trackUserEvent(user?.id,'dismiss_gameplan').catch(()=>{});
            }}
          />
        )}

        {/* ── FAILURE PATTERN ALERT ── */}
        {patternAlert&&(
          <PatternAlertCard
            detection={patternAlert}
            onDismiss={()=>{
              dismissPattern(user.id,patternAlert.pattern);
              trackUserEvent(user.id,'dismiss_pattern',{pattern:patternAlert.pattern,stage:patternAlert.stage}).catch(()=>{});
              setPatternAlert(null);
            }}
            onAction={(label,det)=>{
              recordPatternDetection(user.id,det.pattern,det.stage,label,det.signals).catch(()=>{});
              trackUserEvent(user.id,'act_on_pattern',{pattern:det.pattern,stage:det.stage,label}).catch(()=>{});
            }}
          />
        )}




        {/* Streak counter + StreakCard */}
        {(()=>{
          const sl=(wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner').toLowerCase();
          const streakWin=checkStreakWins(homStreak,sl);
          return(
            <>
              {streakWin&&pendingStreakWin!=='dismissed'&&(
                <StreakCard
                  win={streakWin}
                  streak={homStreak}
                  onDismiss={()=>{markStreakWinShown(streakWin.key);setPendingStreakWin('dismissed');}}
                />
              )}
            </>
          );
        })()}

        {/* Feature Unlock Card */}
        {pendingUnlock&&pendingUnlock.feature&&(
          <div style={{margin:"0 20px 0"}}>
            <FeatureUnlockCard
              unlock={pendingUnlock}
              onShowMe={()=>{
                markUnlockShown(user?.id,pendingUnlock.feature_key).catch(()=>{});
                handleFeatureShowMe(pendingUnlock.feature_key);
                setPendingUnlock(null);
              }}
              onDismiss={()=>{
                markUnlockShown(user?.id,pendingUnlock.feature_key).catch(()=>{});
                setPendingUnlock(null);
              }}
            />
          </div>
        )}

        {/* Morning Brief + Comeback Protocol */}
        <div style={{margin:"0 20px 12px"}}>
          {/* Morning check-in card — shows once per day before the brief */}
          {morningCheckinChecked&&!morningCheckinDone&&user?.id&&(
            <MorningCheckin
              userId={user.id}
              onComplete={()=>setMorningCheckinDone(true)}
              onSkip={()=>setMorningCheckinDone(true)}
              profile={profile}
              workoutLogs={workoutLogsRaw}
            />
          )}
          {(morningBrief||morningBriefLoading||morningBriefError)&&!briefDismissed&&(
            briefExpanded
              ?<div style={{padding:"16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.18)",borderLeft:"3px solid var(--red)",borderRadius:"4px 14px 14px 4px",boxSizing:"border-box",position:"relative"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"var(--red)",textTransform:"uppercase"}}>// Morning Brief</div>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.08em",color:"rgba(245,245,240,0.35)"}}>
                    {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}
                  </div>
                </div>
                {morningBriefLoading
                  ?<div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {[1,0.85,0.7,0.55].map((w,i)=><div key={i} className="skeleton" style={{height:12,width:`${w*100}%`,borderRadius:3,animationDelay:`${i*80}ms`}}/>)}
                  </div>
                  :morningBriefError
                    ?<div style={{fontSize:12,color:"rgba(245,245,240,0.5)",fontStyle:"italic",lineHeight:1.5}}>{morningBriefError}</div>
                    :morningBrief&&(()=>{
                      const b=morningBrief;
                      return(
                        <div>
                          {b.greeting&&<div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:800,fontSize:20,lineHeight:1.1,textTransform:"uppercase",marginBottom:10}}>{b.greeting}</div>}
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
                            {b.yesterday&&(<div><div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:"0.14em",color:"rgba(245,245,240,0.4)",textTransform:"uppercase",marginBottom:3}}>Yesterday</div><div style={{fontSize:12.5,lineHeight:1.55,color:"rgba(245,245,240,0.75)"}}>{b.yesterday}</div></div>)}
                            <div style={{height:1,background:"rgba(var(--accent-rgb),0.08)"}}/>
                            {b.today&&(<div><div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:"0.14em",color:"rgba(245,245,240,0.4)",textTransform:"uppercase",marginBottom:3}}>Today</div><div style={{fontSize:12.5,lineHeight:1.55}}>{b.today}</div></div>)}
                            {b.coach_says&&(<div style={{padding:"8px 10px",background:"rgba(var(--accent-rgb),0.06)",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:6}}><div style={{fontFamily:"var(--mono)",fontSize:8,letterSpacing:"0.14em",color:"var(--red)",textTransform:"uppercase",marginBottom:3}}>Coach says</div><div style={{fontSize:12,lineHeight:1.55,fontStyle:"italic",color:"rgba(245,245,240,0.85)"}}>{b.coach_says}</div></div>)}
                          </div>
                          {b.sign_off&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"rgba(245,245,240,0.35)",marginTop:10,letterSpacing:"0.06em"}}>{b.sign_off}</div>}
                          {showCheckin&&!checkinDone&&(<SorenessCheckIn userId={user?.id} onComplete={(score,muscles)=>{setSorenessData({soreness_score:score,sore_muscles:muscles});setCheckinDone(true);setShowCheckin(false);}} onSkip={()=>setShowCheckin(false)}/>)}
                          {checkinDone&&sorenessData&&(<SorenesSummary score={sorenessData.soreness_score} muscles={sorenessData.sore_muscles}/>)}
                        </div>
                      );
                    })()
                }
                {!morningBriefLoading&&(
                  <div style={{marginTop:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <button onClick={()=>{setBriefExpanded(false);}} style={{background:"transparent",border:"none",color:"rgba(245,245,240,0.3)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer",padding:0}}>COLLAPSE ↑</button>
                      <button onClick={()=>{setBriefDismissed(true);localStorage.setItem("brief_dismissed",new Date().toISOString().split("T")[0]);}} style={{background:"transparent",border:"none",color:"var(--red)",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:0}}>GOT IT →</button>
                    </div>
                    {(()=>{
                      const hour=new Date().getHours();
                      const sessionDoneToday=workoutLogsRaw.some(w=>w.date===todayKey)||!!completedWorkout;
                      const breakfastLogged=log.length>0;
                      if(todayType==="training"&&hour<12&&!sessionDoneToday){
                        return(
                          <div style={{borderTop:"1px solid rgba(var(--accent-rgb),0.08)",paddingTop:12}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>// WHAT SHOULD I DO FIRST?</div>
                            <button onClick={()=>setSection("train")} style={{width:"100%",background:"rgba(var(--accent-rgb),0.08)",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:10,padding:"11px 14px",fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:"var(--accent)",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",textAlign:"left"}}>START YOUR SESSION →</button>
                          </div>
                        );
                      }
                      if(!breakfastLogged){
                        return(
                          <div style={{borderTop:"1px solid rgba(var(--accent-rgb),0.08)",paddingTop:12}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>// WHAT SHOULD I DO FIRST?</div>
                            <button onClick={()=>{setSection("fuel");setFuelScreen("log");}} style={{width:"100%",background:"rgba(var(--accent-rgb),0.08)",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:10,padding:"11px 14px",fontFamily:"var(--mono)",fontSize:9,fontWeight:700,color:"var(--accent)",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",textAlign:"left"}}>LOG BREAKFAST →</button>
                          </div>
                        );
                      }
                      return(
                        <div style={{borderTop:"1px solid rgba(var(--accent-rgb),0.08)",paddingTop:12}}>
                          <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>// WHAT SHOULD I DO FIRST?</div>
                          <div style={{fontFamily:"var(--body)",fontSize:12,color:"rgba(245,245,240,0.5)",letterSpacing:"0.04em"}}>YOU'RE ON TRACK. KEEP GOING.</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              :(()=>{
                const b=morningBrief;
                const coachSays=morningBriefLoading?"Loading brief...":(morningBriefError?"Couldn't load brief — tap to retry":(b?.coach_says||b?.greeting||""));
                return(
                  <div onClick={()=>{setBriefExpanded(true);const today=new Date().toISOString().split("T")[0];localStorage.setItem("brief_expanded",today);}}
                    style={{background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.06)",borderLeft:"2px solid var(--accent)",borderRadius:14,padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden"}}>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:15,color:"#f5f5f0",lineHeight:1.4,marginBottom:10,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {coachSays}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.12em",textTransform:"uppercase"}}>// MORNING BRIEF</div>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",letterSpacing:"0.1em",textTransform:"uppercase"}}>READ MORE ↓</div>
                    </div>
                  </div>
                );
              })()
          )}
          {showComebackProtocol&&(
            <div style={{padding:"16px",background:"linear-gradient(135deg, #1a1208, var(--navy-card))",border:"1px solid rgba(245,158,11,0.3)",borderRadius:14,boxSizing:"border-box"}}>
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
        </div>

        {/* Mid-day check-in card */}
        {(()=>{
          const hour=new Date().getHours();
          if(hour<11||hour>15)return null;
          if(remaining.calories<=500)return null;
          if(middayDismissed)return null;
          const lastLogTime=(()=>{try{return parseInt(localStorage.getItem('last_food_log_time')||'0');}catch{return 0;}})();
          const hoursSince=(Date.now()-lastLogTime)/3600000;
          if(lastLogTime>0&&hoursSince<=3)return null;
          const sessionStarted=trainScreen==="active"||!!completedWorkout;
          const isAfternoon=hour>=14;
          const msg=todayType==="training"&&!sessionStarted&&isAfternoon
            ?{headline:"YOU TRAIN IN A FEW HOURS.",sub:`You need fuel before your session. You're ${Math.round(remaining.calories)} calories behind. Log your next meal now.`}
            :{headline:"STAYING ON TRACK?",sub:`You have ${Math.round(remaining.calories)} calories and ${Math.round(remaining.protein)}g protein left today. Don't let the day get away from you.`};
          return(
            <div style={{margin:"0 20px 12px",position:"relative",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderLeft:"3px solid var(--accent)",borderRadius:12,padding:"14px 16px"}}>
              <button onClick={()=>{setMiddayDismissed(true);try{localStorage.setItem('midday_dismissed',Date.now().toString());}catch{}}} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:"rgba(245,245,240,0.3)",fontSize:16,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>// NUTRITION CHECK</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:6}}>{msg.headline}</div>
              <div style={{fontFamily:"var(--condensed)",fontSize:14,color:"rgba(245,245,240,0.6)",lineHeight:1.5}}>{msg.sub}</div>
              <button onClick={()=>{setSection("fuel");setFuelScreen("log");}} style={{marginTop:10,background:"transparent",border:"1px solid rgba(var(--accent-rgb),0.2)",borderRadius:8,padding:"8px 14px",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:"var(--accent)",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>LOG A MEAL →</button>
            </div>
          );
        })()}

        {/* Post-workout window card */}
        {(()=>{
          const lastSession=(()=>{try{return parseInt(localStorage.getItem('cm_last_session_time')||'0');}catch{return 0;}})();
          if(!lastSession)return null;
          const hoursAgo=(Date.now()-lastSession)/3600000;
          if(hoursAgo>3)return null;
          const pwProtein=macros?.protein?Math.round(macros.protein*0.35):50;
          const pwCarbs=macros?.carbs?Math.round(macros.carbs*0.4):80;
          return(
            <div style={{margin:"0 20px 12px",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderLeft:"3px solid #22c55e",borderRadius:12,padding:"14px 16px"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#22c55e",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6}}>// POST-WORKOUT WINDOW</div>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:6}}>FUEL YOUR RECOVERY.</div>
              <div style={{fontFamily:"var(--condensed)",fontSize:16,color:"rgba(245,245,240,0.6)",lineHeight:1.4,marginBottom:10}}>Your post-workout window is open. Hit {pwProtein}g protein and {pwCarbs}g carbs in the next 45 minutes to maximize recovery.</div>
              <button onClick={()=>{setSection("fuel");setFuelScreen("log");}} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:8,padding:"8px 14px",fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:"#22c55e",letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>LOG POST-WORKOUT MEAL →</button>
            </div>
          );
        })()}

        {/* First week milestone card */}
        {(()=>{
          if(firstWeekCardDismissed)return null;
          if(!profile?.created_at&&!profile?.createdAt)return null;
          const created=new Date(profile.created_at||profile.createdAt);
          const daysSince=Math.floor((Date.now()-created.getTime())/86400000);
          if(daysSince<7||daysSince>14)return null;
          return(
            <div style={{margin:"0 20px 12px",position:"relative",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.15)",borderRadius:14,padding:"20px"}}>
              <button onClick={()=>{setFirstWeekCardDismissed(true);try{localStorage.setItem('cm_1week_dismissed','1');}catch{}}} style={{position:"absolute",top:12,right:14,background:"none",border:"none",color:"rgba(245,245,240,0.3)",fontSize:16,cursor:"pointer",lineHeight:1,padding:0}}>×</button>
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,color:"#f5f5f0",lineHeight:1,marginBottom:8}}>ONE WEEK IN<span style={{color:"var(--accent)"}}>.</span></div>
              <div style={{fontFamily:"var(--condensed)",fontSize:16,color:"rgba(245,245,240,0.6)",lineHeight:1.5}}>You've been showing up. That's what separates the athletes who get results from the ones who don't.</div>
            </div>
          );
        })()}

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
              <div style={{height:4,background:"rgba(var(--accent-rgb),0.08)",borderRadius:2,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:`${pct}%`,background:"var(--green)",borderRadius:2,transition:"width .6s"}}/>
              </div>
              <div style={{fontSize:12,color:"rgba(245,245,240,.6)",lineHeight:1.55,fontStyle:"italic"}}>Every session counts. Every time you show up is a win.</div>
            </div>
          );
        })()}


        {/* ── COACH ALERTS STREAM ── */}
        <CoachAlertsStream userMode={userMode}>

        {/* ── DELOAD DETECTION ── */}
        {!deloadActive&&(()=>{
          const todayStr=new Date().toISOString().split("T")[0];
          const snoozedToday=deloadSnooze===todayStr;
          if(snoozedToday)return null;

          // Determine signals to display: prefer service result, fall back to local analyzeDeload
          const svcSignals=upcomingDeload?.signals||null;
          const localSignals=!svcSignals&&workoutLogsRaw.length>=5?analyzeDeload(workoutLogsRaw,profile,schedule):[];
          if(!svcSignals&&localSignals.length<3)return null;

          const deloadStartStr=upcomingDeload?.deloadStart||null;
          const deloadEndStr=upcomingDeload?.deloadEnd||null;
          const formattedRange=deloadStartStr&&deloadEndStr
            ?`${new Date(deloadStartStr+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} — ${new Date(deloadEndStr+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}`
            :"Next week";

          // Build top 2 signal lines
          let signalLines=[];
          if(svcSignals){
            if(svcSignals.planned)signalLines.push(`You've trained hard for ${svcSignals.planned.weeks} weeks without a break.`);
            if(svcSignals.soreness_high)signalLines.push(svcSignals.soreness_high.message+".");
            if(svcSignals.performance_decline)signalLines.push(svcSignals.performance_decline.message+".");
            if(svcSignals.rpe_high)signalLines.push(svcSignals.rpe_high.message+".");
          } else {
            signalLines=localSignals.slice(0,2).map(s=>s.label);
          }
          signalLines=signalLines.slice(0,2);

          if(skipConfirmDeload){
            const upcoming=upcomingDeload?.deload||deloadWeeksHistory.find(d=>d.status==="upcoming");
            return(
              <div style={{margin:"0 20px 14px",padding:"16px",background:"linear-gradient(135deg,#0d0d0d 0%,#0a0d08 100%)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:14}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// SKIP DELOAD?</div>
                <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.7)",lineHeight:1.6,marginBottom:16}}>
                  Skipping a deload increases injury risk and slows long-term progress. We strongly recommend you take it.
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={async()=>{
                    const row=upcoming||upcomingDeload?.deload;
                    if(row?.id){await sb.from("deload_weeks").update({status:"skipped"}).eq("id",row.id);setDeloadWeeksHistory(prev=>prev.map(d=>d.id===row.id?{...d,status:"skipped"}:d));}
                    setUpcomingDeload(null);setSkipConfirmDeload(false);
                    setDeloadSnooze(todayStr);localStorage.setItem("deload_snooze",todayStr);
                  }} style={{flex:1,padding:12,background:"rgba(245,245,240,0.08)",border:"1px solid rgba(245,245,240,0.15)",borderRadius:10,color:"rgba(245,245,240,0.5)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",cursor:"pointer"}}>SKIP ANYWAY</button>
                  <button onClick={()=>setSkipConfirmDeload(false)} style={{flex:2,padding:12,background:"#FEA020",border:"none",borderRadius:10,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer"}}>TAKE THE DELOAD</button>
                </div>
              </div>
            );
          }

          const deloadSummary=`Rest week${formattedRange&&formattedRange!=="Next week"?" · "+formattedRange:""}`;
          return(
            <CollapsibleAlert color="#FEA020" summary={deloadSummary} margin="0 20px 6px">
              <div style={{padding:"16px",background:"linear-gradient(135deg,#0d0d0d 0%,#0a0d08 100%)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:14,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(254,160,32,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
                {(()=>{const sl2=(wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner').toLowerCase();return(<div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>{sl2==='beginner'?"// REST WEEK COMING UP":"// DELOAD WEEK INCOMING"}</div>);})()}
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",marginBottom:10,textTransform:"uppercase",lineHeight:1}}>
                  YOUR BODY NEEDS THIS<span style={{color:"#FEA020"}}>.</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
                  {signalLines.map((l,i)=>(
                    <div key={i} style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",lineHeight:1.6}}>{l}</div>
                  ))}
                </div>
                <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:10}}>
                  Next week: same exercises, 50% less volume and weight. This is where the gains you've built actually set in.
                </div>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",marginBottom:14}}>DELOAD WEEK: {formattedRange}</div>
                <button onClick={startDeload} style={{width:"100%",padding:13,background:"#FEA020",border:"none",borderRadius:10,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer",marginBottom:8}}>GOT IT →</button>
                <button onClick={()=>setSkipConfirmDeload(true)} style={{width:"100%",padding:10,background:"transparent",border:"1px solid rgba(245,245,240,0.1)",borderRadius:10,color:"rgba(245,245,240,0.4)",fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",cursor:"pointer"}}>SKIP DELOAD</button>
              </div>
            </CollapsibleAlert>
          );
        })()}

        {/* ── PROGRAM ADJUSTMENT NOTIFICATION ── */}
        {weekAdjustment&&weekAdjustment.action!=="no_change"&&adjSnooze!==new Date().toISOString().split("T")[0]&&(()=>{
          const isAdvance=weekAdjustment.action==="advance";
          const accent=isAdvance?"#22c55e":"#60a5fa";
          const borderColor=isAdvance?"rgba(34,197,94,0.2)":"rgba(96,165,250,0.2)";
          const title=isAdvance?"WEEK ADVANCED":"WEEK REPEATED";
          const subtitle=isAdvance
            ?"Your training signals are strong. Moving to the next week."
            :"Your body needs more time here. Repeating this week.";
          const reasons=(weekAdjustment.reason||"").split("; ").filter(Boolean);
          const adjSummary=`Program ${isAdvance?"advanced":"repeated"} to Week ${weekAdjustment.new_week}`;
          return(
            <CollapsibleAlert color={accent} summary={adjSummary} margin="0 20px 6px">
              <div style={{padding:"16px",background:"#0d0d0d",border:`1px solid ${borderColor}`,borderRadius:14,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${accent}08 0%,transparent 70%)`,pointerEvents:"none"}}/>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:accent,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// PROGRAM UPDATED</div>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:6}}>
                  {title}<span style={{color:accent}}>.</span>
                </div>
                <div style={{fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:10}}>{subtitle}</div>
                {reasons.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
                    {reasons.map((r,i)=>(
                      <div key={i} style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",lineHeight:1.6}}>{isAdvance?"✓ ":"⚡ "}{r}</div>
                    ))}
                  </div>
                )}
                <div style={{display:"flex",gap:8,marginBottom:0}}>
                  <div style={{flex:1,background:"rgba(245,245,240,0.04)",borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:2}}>WAS</div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:800,fontSize:16,color:"rgba(245,245,240,0.4)"}}>W{weekAdjustment.old_week}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",fontSize:16,color:"rgba(245,245,240,0.3)"}}>→</div>
                  <div style={{flex:1,background:`${accent}12`,border:`1px solid ${accent}30`,borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:7,color:"rgba(245,245,240,0.3)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:2}}>NOW</div>
                    <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:800,fontSize:16,color:accent}}>W{weekAdjustment.new_week}</div>
                  </div>
                </div>
                <button onClick={()=>{const t=new Date().toISOString().split("T")[0];setAdjSnooze(t);localStorage.setItem("adj_snooze",t);}} style={{width:"100%",marginTop:12,padding:13,background:accent,border:"none",borderRadius:10,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GOT IT →</button>
              </div>
            </CollapsibleAlert>
          );
        })()}

        {/* ── PLATEAU DETECTION ── */}
        {activePlateaus.length>0&&plateauSnooze!==new Date().toISOString().split("T")[0]&&(()=>{
          const shown=activePlateaus.slice(0,2);
          const extra=activePlateaus.length-shown.length;
          const plateauNames=shown.map(p=>p.exercise_name).join(", ");
          const plateauSummary=`${plateauNames} stalled — strateg${shown.length>1?"ies":"y"} ready`;
          return(
            <CollapsibleAlert color="#60a5fa" summary={plateauSummary} margin="0 20px 6px">
              <div style={{padding:"16px",background:"#0d0d0d",border:"1px solid rgba(96,165,250,0.2)",borderRadius:14,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
                {(()=>{const sl2=(wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner').toLowerCase();return(<div style={{fontFamily:"var(--mono)",fontSize:9,color:"#60a5fa",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>{sl2==='beginner'?"// LET'S MIX IT UP":"// PLATEAU DETECTED"}</div>);})()}
                <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:14}}>
                  {shown.map((p,i)=>{
                    const strategy=getStrategyByName(p.strategy_prescribed);
                    return(
                      <div key={p.id||i}>
                        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:4}}>
                          {p.exercise_name.toUpperCase()}<span style={{color:"#60a5fa"}}>.</span>
                        </div>
                        <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",marginBottom:10}}>
                          {p.plateau_type==="weight"
                            ?`Stuck at ${p.stalled_value} lbs for ${p.sessions_stalled} sessions.`
                            :`Volume flat or declining for ${p.sessions_stalled} sessions.`}
                        </div>
                        {strategy&&(
                          <>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#60a5fa",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>// BREAK IT WITH</div>
                            <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:16,color:"#f5f5f0",textTransform:"uppercase",marginBottom:4}}>
                              {strategy.name}<span style={{color:"#60a5fa"}}>.</span>
                            </div>
                            <div style={{fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.4,marginBottom:8}}>{strategy.description}</div>
                            <div style={{display:"flex",flexDirection:"column",gap:5}}>
                              {strategy.prescription.map((step,si)=>(
                                <div key={si} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                                  <span style={{fontFamily:"var(--mono)",fontSize:8,color:"#60a5fa",minWidth:20,flexShrink:0,marginTop:1}}>0{si+1}</span>
                                  <span style={{fontSize:13,color:"#f5f5f0",lineHeight:1.5}}>{step}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {extra>0&&<div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.4)",marginBottom:12}}>and {extra} more exercise{extra>1?"s":""} need attention</div>}
                <button onClick={()=>{const t=new Date().toISOString().split("T")[0];setPlateauSnooze(t);localStorage.setItem("plateau_snooze",t);}} style={{width:"100%",padding:13,background:"#60a5fa",border:"none",borderRadius:10,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GOT IT →</button>
              </div>
            </CollapsibleAlert>
          );
        })()}

        {/* ── MUSCLE BALANCE WARNING ── */}
        {balanceCorrections.length>0&&balanceSnooze!==new Date().toISOString().split("T")[0]&&(()=>{
          const primary=balanceCorrections[0];
          const isRisk=primary.severity==="risk";
          const accent=isRisk?"var(--accent)":"#FEA020";
          const borderColor=isRisk?"rgba(var(--accent-rgb),0.2)":"rgba(254,160,32,0.2)";
          const balanceSummary=`${primary.type==="push_pull"?"Push/pull":"Quad/posterior"} imbalance — fix ready`;
          return(
            <CollapsibleAlert color={accent} summary={balanceSummary} margin="0 20px 6px">
              <div style={{padding:"16px",background:"#0d0d0d",border:`1px solid ${borderColor}`,borderRadius:14}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:accent,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// MUSCLE IMBALANCE DETECTED</div>
                {balanceCorrections.map((c,ci)=>{
                  const isPP=c.type==="push_pull";
                  const pushPct=isPP&&(balanceCorrections[0]?.type==="push_pull")
                    ? Math.round(100*(c.type==="push_pull"?(latestBalance?.push_volume_lbs||0)/Math.max(1,(latestBalance?.push_volume_lbs||0)+(latestBalance?.pull_volume_lbs||0)):0))
                    : 0;
                  const totalVol=isPP
                    ?(latestBalance?.push_volume_lbs||0)+(latestBalance?.pull_volume_lbs||0)
                    :(latestBalance?.quad_volume_lbs||0)+(latestBalance?.posterior_volume_lbs||0);
                  const aVol=isPP?(latestBalance?.push_volume_lbs||0):(latestBalance?.quad_volume_lbs||0);
                  const bVol=isPP?(latestBalance?.pull_volume_lbs||0):(latestBalance?.posterior_volume_lbs||0);
                  const aPct=totalVol>0?Math.round(aVol/totalVol*100):50;
                  const bPct=100-aPct;
                  const aLabel=isPP?"PUSH":"QUAD";
                  const bLabel=isPP?"PULL":"POST";
                  const aColor=isRisk?"var(--accent)":"#FEA020";
                  const bColor="#60a5fa";
                  return(
                    <div key={ci} style={{marginBottom:ci<balanceCorrections.length-1?16:0}}>
                      <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:6}}>
                        {isPP?"PUSH/PULL IMBALANCE":"QUAD/POSTERIOR IMBALANCE"}<span style={{color:accent}}>.</span>
                      </div>
                      <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",lineHeight:1.6,marginBottom:10}}>
                        {c.message}<br/>{c.risk}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
                        {[[aLabel,aPct,aColor],[bLabel,bPct,bColor]].map(([label,pct,color])=>(
                          <div key={label} style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.5)",width:30,flexShrink:0}}>{label}</div>
                            <div style={{flex:1,height:4,background:"rgba(245,245,240,0.06)",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:2,transition:"width 0.5s"}}/>
                            </div>
                            <div style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.5)",width:28,textAlign:"right",flexShrink:0}}>{pct}%</div>
                          </div>
                        ))}
                      </div>
                      <div style={{fontFamily:"var(--mono)",fontSize:8,color:"#22c55e",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>// FIX THIS WEEK</div>
                      <div style={{fontSize:13,color:"#f5f5f0",lineHeight:1.5,marginBottom:8}}>{c.fix}</div>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {c.exercises.map((ex,ei)=>(
                          <div key={ei} style={{fontFamily:"var(--mono)",fontSize:9,color:"#22c55e"}}>+ {ex}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <button onClick={()=>{const t=new Date().toISOString().split("T")[0];setBalanceSnooze(t);localStorage.setItem("balance_snooze",t);}} style={{width:"100%",marginTop:14,padding:13,background:accent,border:"none",borderRadius:10,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GOT IT →</button>
              </div>
            </CollapsibleAlert>
          );
        })()}

        {/* ── FATIGUE ALERT ── */}
        {fatigueAlert&&(fatigueAlert.overallFatigue==="high"||fatigueAlert.overallFatigue==="medium")&&fatigueSnooze!==new Date().toISOString().split("T")[0]&&(()=>{
          const isHigh=fatigueAlert.overallFatigue==="high";
          const accent=isHigh?"var(--accent)":"#FEA020";
          const borderColor=isHigh?"rgba(var(--accent-rgb),0.2)":"rgba(254,160,32,0.2)";
          const headline=isHigh?"YOUR BODY IS TIRED.":"FATIGUE BUILDING.";
          const exerciseSignals=(fatigueAlert.fatigueSignals||[]).filter(s=>s.type==="exercise_rpe_drift"||s.type==="rpe_performance_divergence");
          const fatigueSummary=isHigh?"High fatigue — lighter session today":"Fatigue building — monitor effort";
          return(
            <CollapsibleAlert color={accent} summary={fatigueSummary} margin="0 20px 6px">
              <div style={{padding:"16px",background:"#0d0d0d",border:`1px solid ${borderColor}`,borderRadius:14,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:-40,right:-40,width:140,height:140,borderRadius:"50%",background:`radial-gradient(circle,${accent}08 0%,transparent 70%)`,pointerEvents:"none"}}/>
                {(()=>{const sl2=(wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner').toLowerCase();return(<div style={{fontFamily:"var(--mono)",fontSize:9,color:accent,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>{sl2==='beginner'?"// YOUR BODY IS TIRED":"// FATIGUE DETECTED"}</div>);})()}
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:8}}>
                  {headline}<span style={{color:accent}}>.</span>
                </div>
                {fatigueAlert.topSignal&&(
                  <div style={{fontSize:13,color:"rgba(245,245,240,0.6)",lineHeight:1.5,marginBottom:10}}>{fatigueAlert.topSignal.message}</div>
                )}
                {exerciseSignals.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
                    {exerciseSignals.map((s,i)=>(
                      <div key={i} style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.5)"}}>
                        • {s.exercise}: RPE +{s.rpeDrift} over {s.sessions} sessions
                      </div>
                    ))}
                  </div>
                )}
                <div style={{borderLeft:`2px solid ${accent}`,paddingLeft:10,marginBottom:12}}>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontSize:15,color:"#f5f5f0",lineHeight:1.4}}>
                    {isHigh
                      ?"Consider requesting a deload or taking an extra rest day before your next heavy session."
                      :"Watch your RPE closely this week. If it keeps climbing a deload may be needed soon."}
                  </div>
                </div>
                <button onClick={()=>{const t=new Date().toISOString().split("T")[0];setFatigueSnooze(t);localStorage.setItem("fatigue_snooze",t);}} style={{width:"100%",padding:13,background:accent,border:"none",borderRadius:10,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>GOT IT →</button>
              </div>
            </CollapsibleAlert>
          );
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

        </CoachAlertsStream>

        {/* Today's session — STATE B (deload active) or normal */}
        {deloadActive
          ?(
            <div style={{margin:"0 20px 14px",padding:"16px",background:"linear-gradient(135deg,#0d0d0d 0%,#0a0d08 100%)",border:"1px solid rgba(254,160,32,0.25)",borderRadius:14,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(254,160,32,0.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
              {(()=>{const sl2=(wPrefs?.liftExp||profile?.profile_data?.liftExp||profile?.liftExp||'beginner').toLowerCase();return(<div style={{fontFamily:"var(--mono)",fontSize:9,color:"#FEA020",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>{sl2==='beginner'?"// REST WEEK COMING UP":"// DELOAD WEEK ACTIVE"}</div>);})()}
              <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:4}}>
                RECOVERY WEEK<span style={{color:"#FEA020"}}>.</span>
              </div>
              <div style={{fontFamily:"var(--body)",fontSize:13,color:"rgba(245,245,240,0.55)",lineHeight:1.5,marginBottom:14}}>
                Same movements. Half the volume. Trust the process.
              </div>
              {(()=>{
                const daysLeft=deloadStartedAt?Math.max(0,7-Math.floor((new Date()-new Date(deloadStartedAt))/864e5)):7;
                return(
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.12em"}}>
                      {daysLeft>0?`${daysLeft} day${daysLeft===1?"":"s"} remaining`:"Deload complete — great work."}
                    </div>
                    <div style={{flex:1,height:3,background:"rgba(245,245,240,0.07)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${Math.round((7-Math.max(0,daysLeft))/7*100)}%`,background:"#FEA020",borderRadius:2,transition:"width 0.6s"}}/>
                    </div>
                  </div>
                );
              })()}
              <div style={{background:"rgba(254,160,32,0.06)",border:"1px solid rgba(254,160,32,0.15)",borderRadius:8,padding:"8px 12px",marginBottom:14,fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",lineHeight:1.6}}>
                50% load · 50% volume · Full movement pattern
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setSection("train")} style={{flex:1,padding:14,background:"#FEA020",border:"none",borderRadius:12,color:"#000",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",cursor:"pointer"}}>
                  START DELOAD SESSION →
                </button>
                {deloadStartedAt&&Math.max(0,7-Math.floor((new Date()-new Date(deloadStartedAt))/864e5))<=0&&(
                  <button onClick={handleDeloadComplete} style={{padding:14,background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:12,color:"#22c55e",fontFamily:"var(--mono)",fontWeight:700,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",flexShrink:0}}>COMPLETE →</button>
                )}
              </div>
            </div>
          ):(()=>{
            const isRD=todayType==="rest"||!todayType||(schedule[todayKey]==="rest");
            const focusLabel=(()=>{const raw=(todayFocus||"").replace(/\.$/, "");if(!raw||raw.toLowerCase()==="rest")return DAY_CFG[todayType]?.label||"Training";return raw;})();
            const coachQuote=(()=>{const tip=(morningBrief?.coach_tip||"").trim();if(tip)return tip.length>100?tip.substring(0,97)+"...":tip;return isRD?"Rest. Your body grows when you recover.":"Show up, do the work, trust the process.";})();
            if(isRD){
              return(
                <div data-tour="start-session" style={{margin:"0 20px 14px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:14,padding:16}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// TODAY</div>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:36,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:10}}>REST<span style={{color:"var(--accent)"}}>.</span></div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:17,color:"rgba(245,245,240,0.55)",lineHeight:1.45,marginTop:8}}>{coachQuote}</div>
                </div>
              );
            }
            return(
              <div data-tour="start-session" style={{margin:"0 20px 14px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:14,padding:16}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// TODAY</div>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:6}}>
                  {focusLabel}<span style={{color:"var(--accent)"}}>.</span>
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:17,color:"rgba(245,245,240,0.55)",lineHeight:1.45,marginTop:6,marginBottom:14}}>{coachQuote}</div>
                <button onClick={()=>{setSection("train");startStructured(todayFocus);}} style={{width:"100%",background:"var(--accent)",border:"none",borderRadius:12,padding:"14px 0",fontFamily:"var(--mono)",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.18em",textTransform:"uppercase",cursor:"pointer",marginBottom:sessionExpandedToday?8:0}}>
                  START SESSION →
                </button>
                <div onClick={()=>setSessionExpandedToday(s=>!s)} style={{textAlign:"center",fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:8}}>
                  {sessionExpandedToday?"Session details ↑":"Session details ↓"}
                </div>
                {sessionExpandedToday&&(
                  <div style={{marginTop:10,padding:"10px 0",borderTop:"1px solid rgba(245,245,240,0.05)"}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.5)",lineHeight:1.6}}>
                      Go to Train tab to see the full exercise list, muscle chips, and set prescriptions.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}


        {/* ── PRESENT SECTION ── */}
        <div data-tour="today-cards" style={{margin:"0 20px 8px"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.16em",color:"rgba(245,245,240,.35)",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
            <span>// THIS WEEK</span>
            <div style={{flex:1,height:1,background:"rgba(245,245,240,.06)"}}/>
          </div>
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
                <div style={{fontFamily:"var(--condensed)",fontWeight:800,fontSize:22,fontStyle:"italic",lineHeight:1}}>{workoutLogsRaw.filter(w=>{const d=new Date(w.date||w.logged_at);const now=new Date();return d>=new Date(now.getFullYear(),now.getMonth(),now.getDate()-now.getDay());}).length}</div>
                <div style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--white-dim)",marginTop:3,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center",lineHeight:1.3}}>SESSIONS<br/>THIS WEEK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly roadmap — WeekStrip reuses the same component as the Train tab */}
        <div style={{margin:"0 20px 14px"}}>
          <WeekStrip todayKey={todayKey} schedule={schedule} dayFocus={dayFocus} sessionCount={workoutLogsRaw.length} todayType={todayType}/>
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

        {/* ── FUTURE SECTION — advanced only ── */}
        {visibleSections.includes('predictive_intelligence')&&(sessionPrediction||weeklyForecast.length>0||goalTrajectories.strength||goalTrajectories.bodyComp)&&(()=>{
          const todayProb=sessionPrediction?.probability??weeklyForecast.find(d=>d.isTraining&&d.probability!=null)?.probability;
          const probColor=todayProb>=75?T.green:todayProb>=50?"#3b82f6":T.fat;
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
                      const c=d.probability>=75?T.green:d.probability>=50?"#3b82f6":T.fat;
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
                        <div style={{fontFamily:"var(--mono)",fontWeight:500,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:goalTrajectories.strength.trend==="up"?T.green:goalTrajectories.strength.trend==="down"?"#ef4444":"rgba(245,245,240,.5)",padding:"4px 12px",borderRadius:8,border:`1px solid ${goalTrajectories.strength.trend==="up"?"rgba(34,197,94,0.2)":goalTrajectories.strength.trend==="down"?"rgba(239,68,68,0.2)":"rgba(245,245,240,0.1)"}`,background:goalTrajectories.strength.trend==="up"?"rgba(34,197,94,.1)":goalTrajectories.strength.trend==="down"?"rgba(239,68,68,.1)":"rgba(var(--accent-rgb),0.05)"}}>
                          {goalTrajectories.strength.trend==="up"?"PROGRESSING":goalTrajectories.strength.trend==="down"?"DECLINING":"STABLE"}
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
                        <div style={{fontFamily:"var(--mono)",fontWeight:500,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:goalTrajectories.bodyComp.trend==="gaining"?T.fat:goalTrajectories.bodyComp.trend==="losing"?T.green:"rgba(245,245,240,.5)",padding:"4px 12px",borderRadius:8,border:`1px solid ${goalTrajectories.bodyComp.trend==="gaining"?"rgba(245,158,11,0.2)":goalTrajectories.bodyComp.trend==="losing"?"rgba(34,197,94,0.2)":"rgba(245,245,240,0.1)"}`,background:goalTrajectories.bodyComp.trend==="gaining"?"rgba(245,158,11,.1)":goalTrajectories.bodyComp.trend==="losing"?"rgba(34,197,94,.1)":"rgba(var(--accent-rgb),0.05)"}}>
                          {goalTrajectories.bodyComp.trend==="gaining"?"GAINING":goalTrajectories.bodyComp.trend==="losing"?"LOSING":"STABLE"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      </div>
    );
  }

  // ─── PHASE 3 — Today screen (goclub redesign) ─────────────────────────────
  // Separate component so the old HomeSection is byte-identical when flag is off.
  // CRITICAL: every text node carries explicit fontFamily — GLOBAL_CSS heading
  // rules beat .goclub inheritance, so we never rely on the cascade for font.
  function HomeSectionGoClub() {
    const AF = "'Archivo',sans-serif";
    const sc  = coachScore?.total ?? 0;
    const tier = sc>=90?"ELITE":sc>=85?"GREAT":sc>=70?"GOOD":sc>=50?"FAIR":"LOW";
    const tierColor = sc>=90?"#FFD700":sc>=85?"#4ade80":sc>=70?"#93c5fd":sc>=50?"#fcd34d":"#fca5a5";

    // Delta vs yesterday from real dailyScores
    const ydStr=(()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];})();
    const delta=(()=>{const e=dailyScores.find(s=>s.date===ydStr);return e!=null?sc-e.score:null;})();

    // Gateway: check-in must happen before score is revealed
    const showGateway = morningCheckinChecked && !morningCheckinDone && !!user?.id;

    // Sheet state for the slide-up check-in panel
    const [sheetOpen,      setSheetOpen]      = useState(false);
    const [sheetReadiness, setSheetReadiness] = useState(null);
    const [sheetSoreness,  setSheetSoreness]  = useState(0);
    const [sheetSaving,    setSheetSaving]    = useState(false);

    const READINESS_OPTS = [
      {key:'great',emoji:'😁',label:'GREAT'},
      {key:'good', emoji:'🙂',label:'GOOD'},
      {key:'okay', emoji:'😐',label:'OKAY'},
      {key:'tired',emoji:'😓',label:'TIRED'},
      {key:'rough',emoji:'💀',label:'ROUGH'},
    ];

    async function handleGatewaySubmit() {
      if(!sheetReadiness||!user?.id) return;
      setSheetSaving(true);
      try {
        const today=new Date().toISOString().split('T')[0];
        const row={user_id:user.id,date:today,overall_soreness:sheetSoreness,
          primary_soreness:[],secondary_soreness:[],readiness:sheetReadiness};
        const{error}=await sb.from('morning_checkins').upsert(row,{onConflict:'user_id,date'});
        if(error) console.error('[gateway checkin]',error.message);
        setSheetOpen(false);
        setMorningCheckinDone(true); // score hero reveals + counts up
      }catch(e){
        console.error('[gateway checkin]',e);
        setMorningCheckinDone(true); // still reveal on error — never block UX
      }finally{
        setSheetSaving(false);
      }
    }

    const reducedMotion = typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion:reduce)').matches;
    const [selBar, setSelBar] = useState(null);
    const heroTarget = selBar!==null ? (last7[selBar]?.score ?? sc) : sc;
    const heroDisplay = useCountUp(heroTarget, reducedMotion ? 1 : 900);

    // 7-day history — real data from dailyScores, graceful on empty
    const last7 = useMemo(()=>{
      const rows=[];
      for(let i=6;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const ds=d.toISOString().split("T")[0];
        const ltr="SMTWTFS"[d.getDay()];
        const entry=dailyScores.find(s=>s.date===ds);
        rows.push({ds,ltr,score:entry?.score??null,isToday:i===0});
      }
      return rows;
    },[dailyScores]);

    const selScore = selBar!==null ? last7[selBar]?.score : null;
    const selDiff  = selScore!=null ? selScore-sc : null;
    const dayLabel = new Date().toLocaleDateString("en-US",{weekday:"long"}).toUpperCase();
    const dayStatus= deloadActive?"DELOAD WEEK":(cfg?.label||todayType).toUpperCase()+" DAY";
    const b = morningBrief;
    const briefText = b?.coach_says||b?.greeting||"";

    return (
      <div>
        {/* ── RED FIELD — flat #FF3B30 ── */}
        <div style={{background:'#FF3B30',paddingLeft:22,paddingRight:22,paddingBottom:168}}>

          {/* Date / status */}
          <div style={{fontFamily:AF,fontWeight:500,fontSize:11,color:"rgba(255,255,255,0.70)",letterSpacing:"0.13em",textTransform:"uppercase",marginBottom:6}}>
            {dayLabel} · {dayStatus}
          </div>

          {/* Greeting */}
          <div style={{fontFamily:AF,fontWeight:600,fontSize:17,color:"rgba(255,255,255,0.92)",marginBottom:24}}>
            HEY, {firstName.toUpperCase()}
          </div>

          {/* ── GATEWAY or HERO+BARS ── */}
          {showGateway ? (
            /* Check-in gateway — tap a face → slide-up sheet → score reveals */
            <div style={{textAlign:"center",paddingBottom:8}}>
              <div style={{fontFamily:AF,fontWeight:700,fontSize:9,color:"rgba(255,255,255,0.60)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:20}}>
                CHECK IN TO UNLOCK YOUR SCORE
              </div>
              <div style={{fontFamily:AF,fontWeight:800,fontSize:26,color:"#ffffff",lineHeight:1.15,marginBottom:28}}>
                How's your readiness today?
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:6}}>
                {READINESS_OPTS.map(r=>(
                  <button key={r.key}
                    onClick={()=>{setSheetReadiness(r.key);setSheetOpen(true);}}
                    style={{
                      display:"flex",flexDirection:"column",alignItems:"center",gap:7,
                      flex:1,padding:"14px 4px 12px",
                      background:"rgba(255,255,255,0.13)",
                      border:"2px solid rgba(255,255,255,0.26)",
                      borderRadius:18,cursor:"pointer",WebkitTapHighlightColor:"transparent",
                    }}>
                    <span style={{fontSize:28,lineHeight:1}}>{r.emoji}</span>
                    <span style={{fontFamily:AF,fontWeight:700,fontSize:8,color:"rgba(255,255,255,0.80)",letterSpacing:"0.10em"}}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (<>
            {/* ── HERO NUMBER ── */}
            <div style={{textAlign:"center",marginBottom:18}}>
              <div style={{fontFamily:AF,fontWeight:800,fontSize:96,color:"#ffffff",lineHeight:0.88,letterSpacing:"-0.02em",fontVariantNumeric:"tabular-nums"}}>
                {heroDisplay}
              </div>
              {/* Tier label — coloured by score band */}
              <div style={{fontFamily:AF,fontWeight:700,fontSize:11,color:tierColor,letterSpacing:"0.20em",marginTop:10,textTransform:"uppercase"}}>
                {tier}
              </div>
              {/* Delta vs yesterday — only when no bar selected */}
              {delta!==null&&selBar===null&&(
                <div style={{fontFamily:AF,fontWeight:600,fontSize:11,letterSpacing:"0.06em",marginTop:6,
                  color:delta>=0?"#86efac":"rgba(255,255,255,0.52)"}}>
                  {delta>=0?"+":""}{delta} vs yesterday
                </div>
              )}
              {/* Delta vs selected bar */}
              {selDiff!==null&&(
                <div style={{fontFamily:AF,fontWeight:600,fontSize:11,letterSpacing:"0.06em",marginTop:6,
                  color:selDiff>=0?"#86efac":"rgba(255,255,255,0.52)"}}>
                  {selDiff>=0?"+":""}{selDiff} vs today
                </div>
              )}
            </div>

            {/* ── 7-DAY BAR CHART ── */}
            <div style={{display:"flex",gap:8,alignItems:"flex-end",height:60,justifyContent:"center"}}>
              {last7.map((day,i)=>{
                const h = day.score!=null ? Math.max(8,Math.round(day.score/100*54)) : 5;
                return (
                  <div key={day.ds}
                    onClick={()=>setSelBar(selBar===i?null:i)}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
                    <div style={{
                      width:30,height:h,borderRadius:5,
                      background:day.isToday||selBar===i?"#ffffff":"rgba(255,255,255,0.28)",
                      transformOrigin:"bottom",
                      animation:`cm-bar-up 0.38s cubic-bezier(.2,.7,.3,1) ${i*38}ms both`,
                      transition:"background 0.15s",
                    }}/>
                    <div style={{fontFamily:AF,fontSize:9,color:day.isToday?"#fff":"rgba(255,255,255,0.48)",fontWeight:day.isToday?700:400}}>
                      {day.ltr}
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>

        {/* ── WHITE CARD ── */}
        <div className="goclub-card-enter" style={{
          background:"#ffffff",borderRadius:"30px 30px 0 0",
          marginTop:-130,position:"relative",
          paddingTop:28,paddingLeft:20,paddingRight:20,paddingBottom:120,
        }}>

          {/* Morning Brief */}
          {!briefDismissed&&briefText&&(
            <div style={{marginBottom:22}}>
              <div style={{fontFamily:AF,fontWeight:700,fontSize:9,color:"rgba(17,17,17,0.42)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>
                MORNING BRIEF
              </div>
              {briefExpanded?(
                <div style={{background:"#f5f5f5",borderRadius:16,padding:16}}>
                  {b?.greeting&&<div style={{fontFamily:AF,fontWeight:800,fontSize:18,color:"#111111",lineHeight:1.2,marginBottom:10}}>{b.greeting}</div>}
                  {b?.today&&<div style={{fontFamily:AF,fontSize:13,color:"rgba(17,17,17,0.72)",lineHeight:1.6,marginBottom:10}}>{b.today}</div>}
                  {b?.coach_says&&(
                    <div style={{fontFamily:AF,fontWeight:600,fontStyle:"italic",fontSize:13,color:"#111",lineHeight:1.5,
                      background:"rgba(255,59,48,0.06)",borderLeft:"3px solid #FF3B30",
                      borderRadius:"0 10px 10px 0",padding:"10px 12px",marginBottom:12}}>
                      {b.coach_says}
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <button onClick={()=>setBriefExpanded(false)}
                      style={{fontFamily:AF,fontSize:9,color:"rgba(17,17,17,0.38)",background:"none",border:"none",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:0}}>
                      COLLAPSE ↑
                    </button>
                    <button onClick={()=>{setBriefDismissed(true);localStorage.setItem("brief_dismissed",new Date().toISOString().split("T")[0]);}}
                      style={{fontFamily:AF,fontSize:9,color:"#FF3B30",background:"none",border:"none",letterSpacing:"0.12em",textTransform:"uppercase",cursor:"pointer",padding:0}}>
                      GOT IT →
                    </button>
                  </div>
                </div>
              ):(
                <div onClick={()=>setBriefExpanded(true)} style={{cursor:"pointer"}}>
                  <div style={{fontFamily:AF,fontWeight:800,fontSize:17,color:"#111111",lineHeight:1.3,marginBottom:8,
                    display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                    {briefText}
                  </div>
                  <div style={{fontFamily:AF,fontSize:9,fontWeight:700,color:"rgba(17,17,17,0.38)",letterSpacing:"0.14em",textTransform:"uppercase"}}>
                    READ MORE ↓
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Today's Session */}
          <div style={{marginBottom:22}}>
            <div style={{fontFamily:AF,fontWeight:700,fontSize:9,color:"rgba(17,17,17,0.42)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>
              TODAY'S SESSION
            </div>
            {deloadActive?(
              <div style={{background:"#f5f5f5",borderRadius:14,padding:"14px 16px"}}>
                <div style={{fontFamily:AF,fontWeight:800,fontSize:16,color:"#7E57C2",marginBottom:4}}>RECOVERY WEEK</div>
                <div style={{fontFamily:AF,fontSize:13,color:"rgba(17,17,17,0.55)"}}>Deload active — light work only</div>
              </div>
            ):todayType==="rest"?(
              <div style={{background:"#f5f5f5",borderRadius:14,padding:"14px 16px"}}>
                <div style={{fontFamily:AF,fontWeight:800,fontSize:16,color:"#111111",marginBottom:4}}>REST DAY</div>
                <div style={{fontFamily:AF,fontSize:13,color:"rgba(17,17,17,0.55)"}}>Recovery is part of the program</div>
              </div>
            ):(
              <button onClick={()=>setSection("train")} style={{
                width:"100%",background:"#111111",border:"none",borderRadius:14,
                padding:"14px 16px",display:"flex",justifyContent:"space-between",
                alignItems:"center",cursor:"pointer",textAlign:"left",
                WebkitTapHighlightColor:"transparent",
              }}>
                <div>
                  <div style={{fontFamily:AF,fontWeight:800,fontSize:16,color:"#ffffff"}}>{todayFocus}</div>
                  <div style={{fontFamily:AF,fontSize:12,color:"rgba(255,255,255,0.45)",marginTop:3}}>
                    {(cfg?.label||todayType).toUpperCase()}
                  </div>
                </div>
                <div style={{fontFamily:AF,fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.65)"}}>START →</div>
              </button>
            )}
          </div>

          {showCheckin&&!checkinDone&&(
            <SorenessCheckIn userId={user?.id}
              onComplete={(s,m)=>{setSorenessData({soreness_score:s,sore_muscles:m});setCheckinDone(true);setShowCheckin(false);}}
              onSkip={()=>setShowCheckin(false)}/>
          )}
          {checkinDone&&sorenessData&&(
            <SorenesSummary score={sorenessData.soreness_score} muscles={sorenessData.sore_muscles}/>
          )}
        </div>

        {/* ── SLIDE-UP SHEET — check-in detail (soreness + confirm) ── */}
        {sheetOpen&&ReactDOM.createPortal(
          <div style={{position:"fixed",inset:0,zIndex:10001,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
            {/* Backdrop */}
            <div onClick={()=>setSheetOpen(false)}
              style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.45)"}}/>
            {/* Sheet */}
            <div style={{
              position:"relative",background:"#ffffff",
              borderRadius:"28px 28px 0 0",
              padding:"28px 20px",
              paddingBottom:"max(32px,env(safe-area-inset-bottom))",
              animation:reducedMotion?"none":"cm-slide-up 0.35s cubic-bezier(.2,.7,.3,1) forwards",
            }}>
              {/* Drag handle */}
              <div style={{width:36,height:4,background:"rgba(0,0,0,0.12)",borderRadius:2,margin:"0 auto 22px"}}/>

              {/* Selected readiness — tap to change */}
              <div style={{display:"flex",gap:6,marginBottom:24}}>
                {READINESS_OPTS.map(r=>(
                  <button key={r.key} onClick={()=>setSheetReadiness(r.key)}
                    style={{
                      display:"flex",flexDirection:"column",alignItems:"center",gap:5,flex:1,padding:"10px 4px",
                      background:sheetReadiness===r.key?"rgba(255,59,48,0.08)":"rgba(0,0,0,0.03)",
                      border:`2px solid ${sheetReadiness===r.key?"#FF3B30":"rgba(0,0,0,0.08)"}`,
                      borderRadius:14,cursor:"pointer",WebkitTapHighlightColor:"transparent",transition:"all 0.12s",
                    }}>
                    <span style={{fontSize:22}}>{r.emoji}</span>
                    <span style={{fontFamily:AF,fontWeight:700,fontSize:8,
                      color:sheetReadiness===r.key?"#FF3B30":"rgba(0,0,0,0.35)",letterSpacing:"0.10em"}}>
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Soreness slider */}
              <div style={{marginBottom:28}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontFamily:AF,fontWeight:700,fontSize:9,color:"rgba(0,0,0,0.42)",letterSpacing:"0.14em",textTransform:"uppercase"}}>
                    OVERALL SORENESS
                  </div>
                  <div style={{fontFamily:AF,fontWeight:800,fontSize:20,
                    color:sheetSoreness===0?"rgba(0,0,0,0.25)":sheetSoreness>=7?"#FF3B30":sheetSoreness>=4?"#FF8C00":"#22c55e"}}>
                    {sheetSoreness}<span style={{fontFamily:AF,fontSize:12,fontWeight:400,color:"rgba(0,0,0,0.25)"}}>/10</span>
                  </div>
                </div>
                <input type="range" min={0} max={10} step={1} value={sheetSoreness}
                  onChange={e=>setSheetSoreness(Number(e.target.value))}
                  style={{width:"100%",accentColor:"#FF3B30",cursor:"pointer"}}/>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontFamily:AF,fontSize:9,color:"rgba(0,0,0,0.30)"}}>None</span>
                  <span style={{fontFamily:AF,fontSize:9,color:"rgba(0,0,0,0.30)"}}>Max</span>
                </div>
              </div>

              {/* Confirm */}
              <button onClick={handleGatewaySubmit} disabled={!sheetReadiness||sheetSaving}
                style={{
                  width:"100%",padding:"16px 0",border:"none",borderRadius:14,cursor:"pointer",
                  background:sheetReadiness&&!sheetSaving?"#FF3B30":"rgba(0,0,0,0.08)",
                  color:sheetReadiness&&!sheetSaving?"#ffffff":"rgba(0,0,0,0.25)",
                  fontFamily:AF,fontWeight:800,fontSize:16,letterSpacing:"0.04em",
                  transition:"background 0.15s",
                }}>
                {sheetSaving?"Saving…":"See my score →"}
              </button>

              {/* Dismiss */}
              <button onClick={()=>setSheetOpen(false)}
                style={{display:"block",margin:"14px auto 0",background:"none",border:"none",
                  fontFamily:AF,fontSize:11,color:"rgba(0,0,0,0.32)",cursor:"pointer",
                  letterSpacing:"0.08em",textTransform:"uppercase"}}>
                Not now
              </button>
            </div>
          </div>,
          document.body
        )}
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
                  <div style={{width:34,height:34,borderRadius:10,background:"rgba(var(--accent-rgb),0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>💪</div>
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
                            <div key={k} style={{fontSize:10,color:"rgba(245,245,240,0.45)",background:"rgba(245,245,240,0.06)",borderRadius:4,padding:"2px 7px"}}>{s.weight||0}{profile?.wUnit||"lbs"} × {s.reps||0}</div>
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
              <path d={chartData.line} fill="none" stroke="rgba(var(--accent-rgb),0.4)" strokeWidth={1.5}/>
              <path d={chartData.maLine} fill="none" stroke="var(--red)" strokeWidth={2} strokeLinecap="round"/>
              {logs.map((x,idx)=>{
                const isMilestone=chartData.milestones.some(m=>Math.abs(x.weight-m)<0.5);
                if(!isMilestone&&idx!==logs.length-1)return null;
                return<circle key={idx} cx={chartData.px(idx)} cy={chartData.py(x.weight)} r={isMilestone?4:3} fill={isMilestone?T.fat:"var(--red)"} stroke="var(--navy-card)" strokeWidth={2}/>;
              })}
            </svg>
          )}
          {chartData&&<div style={{display:"flex",gap:16,marginTop:8}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"rgba(245,245,240,0.4)"}}>
              <div style={{width:16,height:2,background:"var(--red)",borderRadius:1}}/>7-day avg
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"rgba(245,245,240,0.4)"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:T.fat}}/>5 {wUnit} milestone
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

  const MILESTONES=[
    {id:'first_session',type:'session',threshold:1,title:'FIRST SESSION.',sub:"The hardest part is starting. You started.",icon:'S1'},
    {id:'sessions_5',type:'session',threshold:5,title:'5 SESSIONS.',sub:"Five times you chose to show up.",icon:'S5'},
    {id:'sessions_10',type:'session',threshold:10,title:'10 SESSIONS.',sub:"Double digits. This is becoming who you are.",icon:'S10'},
    {id:'sessions_25',type:'session',threshold:25,title:'25 SESSIONS.',sub:"Most people quit by now. You're not most people.",icon:'S25'},
    {id:'sessions_50',type:'session',threshold:50,title:'50 SESSIONS.',sub:"Fifty. The iron knows your name.",icon:'S50'},
    {id:'sessions_100',type:'session',threshold:100,title:'100 SESSIONS.',sub:"This is just who you are now.",icon:'S100'},
    {id:'streak_3',type:'streak',threshold:3,title:'3 DAY STREAK.',sub:"Momentum is a powerful thing.",icon:'3D'},
    {id:'streak_7',type:'streak',threshold:7,title:'7 DAYS STRAIGHT.',sub:"One full week. Your body is adapting.",icon:'7D'},
    {id:'streak_14',type:'streak',threshold:14,title:'14 DAYS.',sub:"Two weeks of choosing yourself every day.",icon:'14D'},
    {id:'streak_30',type:'streak',threshold:30,title:'30 DAY STREAK.',sub:"A month straight. Legendary.",icon:'30D'},
    {id:'meals_10',type:'meals',threshold:10,title:'10 MEALS LOGGED.',sub:"You know what's in your body. That's power.",icon:'M10'},
    {id:'meals_50',type:'meals',threshold:50,title:'50 MEALS TRACKED.',sub:"Fifty meals of knowing exactly what you eat.",icon:'M50'},
    {id:'meals_100',type:'meals',threshold:100,title:'100 MEALS.',sub:"Data is your edge now.",icon:'M100'},
    {id:'volume_10k',type:'volume',threshold:10000,title:'10,000 LBS MOVED.',sub:"Ten thousand pounds of work done.",icon:'V10'},
    {id:'volume_50k',type:'volume',threshold:50000,title:'50,000 LBS.',sub:"The iron remembers every rep.",icon:'V50'},
    {id:'volume_100k',type:'volume',threshold:100000,title:'100K LBS LIFTED.',sub:"One hundred thousand pounds. Unstoppable.",icon:'V100'},
    {id:'day_7',type:'membership',threshold:7,title:'ONE WEEK IN.',sub:"Seven days with Coach Macro. The journey has begun.",icon:'W1'},
    {id:'day_30',type:'membership',threshold:30,title:'30 DAYS STRONG.',sub:"A month of showing up. Look how far you've come.",icon:'W4'},
    {id:'day_90',type:'membership',threshold:90,title:'90 DAYS.',sub:"Three months. You're a different athlete now.",icon:'W12'},
  ];

  function ProgressSection() {
    const sc = coachScore;
    const activeTab = progressTab;
    const setActiveTab = setProgressTab;
    const userMode = getUserMode(profile, wPrefs);
    const userTier = getUserTier(profile, wPrefs, userMode);
    const progressTabs = getProgressTabs(userTier, userMode);
    const scoreLabels = COACH_SCORE_LABELS[userMode] || COACH_SCORE_LABELS.strength;
    const [progFoodLogs, setProgFoodLogs] = useState([]);

    useEffect(()=>{
      if(!user?.id)return;
      const cutoff=new Date(Date.now()-30*864e5).toISOString().split('T')[0];
      sb.from('food_logs').select('date,entries').eq('user_id',user.id)
        .gte('date',cutoff).order('date',{ascending:false})
        .then(({data})=>setProgFoodLogs(data||[]));
    },[user?.id]);

    const [expenditure, setExpenditure] = useState(null);
    const [expenditureHistory, setExpenditureHistory] = useState([]);
    const [dataDrift, setDataDrift] = useState(null);

    useEffect(() => {
      if (!user?.id || !profile) return;
      const todayStr = new Date().toISOString().split('T')[0];
      const rawResult = computeExpenditure(bodyweightLogs, progFoodLogs, profile);
      const todayWorkouts = (workoutLogsRaw || []).filter(l => l.date === todayStr);
      const todayActivities = (allActs || []).filter(a => {
        const d = (a.date || '').split('T')[0];
        return d === todayStr;
      });
      const burn = computeTodaysBurn(todayWorkouts, todayActivities, healthSnap, profile, rawResult.tef);
      const rawWithBurn = { ...rawResult, todaysBurn: burn };

      // Load adaptive factors, apply, then store
      getAdaptiveFactors(user.id).then(factors => {
        setAdaptiveFactors(factors);
        const adjusted = applyAdaptiveFactors(rawWithBurn, factors);
        setExpenditure(adjusted);
        return storeExpenditure(user.id, adjusted, adjusted.todaysBurn);
      }).then(() => getExpenditureHistory(user.id, 30))
        .then(hist => {
          setExpenditureHistory(hist);
          setDataDrift(checkDataDrift(hist));
          // Weekly adaptive recalibration (debounced to once/week inside the service)
          recalibrateFactors(user.id).catch(() => {});
        })
        .catch(() => {
          // Fallback: use raw without factors
          setExpenditure(rawWithBurn);
        });
    }, [user?.id, progFoodLogs, bodyweightLogs, healthSnap?.steps, workoutLogsRaw?.length]);

    const [validationInsights, setValidationInsights] = useState([]);
    const [insightLoading, setInsightLoading] = useState(false);
    const [adaptiveFactors, setAdaptiveFactors] = useState(null);
    const [coachRecall, setCoachRecall] = useState(null);

    useEffect(() => {
      if (!user?.id || !profile) return;
      setInsightLoading(true);
      runDailyValidationSuite(user.id, profile)
        .then(insights => {
          setValidationInsights(insights);
          const top = insights[0];
          if (top?.priority === 'severe') {
            import('./services/notifications.js')
              .then(({ scheduleValidationAlert }) => scheduleValidationAlert(top.message))
              .catch(() => {});
          }
        })
        .catch(() => {})
        .finally(() => setInsightLoading(false));
    }, [user?.id, profile?.goalCals]);

    // Coach Memory — auto-record memories for high/severe insights + recall
    useEffect(() => {
      if (!user?.id || !validationInsights.length || insightLoading) return;
      const severe = validationInsights.filter(i => i.priority === 'severe' || i.priority === 'high');
      if (!severe.length) return;

      const currentCtx = buildContextSnapshot({
        weightLogs: bodyweightLogs,
        foodLogs: progFoodLogs,
        workoutLogs: workoutLogsRaw,
        macros,
        profile,
        healthSnap,
      });

      // Auto-record top severe/high insight as a memory
      const top = severe[0];
      const memType = top.insight_type === 'weight_trend' ? 'plateau' : 'setback';
      recordMemory(user.id, memType, currentCtx, top.message, top.recommendation, top.insight_type)
        .catch(() => {});

      // Only recall if user has been around 30+ days
      const memberDays = profile?.created_at
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 864e5)
        : 0;
      if (memberDays < 30) return;

      recallApplicableLearnings(user.id, top.insight_type, currentCtx)
        .then(recall => { if (recall?.similar_past?.length) setCoachRecall(recall); })
        .catch(() => {});
    }, [validationInsights, insightLoading, user?.id]);

    const [connectionData,setConnectionData]=useState([]);
    useEffect(()=>{
      if(!user?.id)return;
      getConnectionsData(user.id).then(data=>setConnectionData(data)).catch(()=>{});
    },[user?.id]);

    const [peerData,setPeerData]=useState(null);
    useEffect(()=>{
      if(!user?.id||!profile)return;
      assignCohort(user.id,profile).catch(()=>{});
      getPeerComparison(user.id,profile).then(d=>{if(d)setPeerData(d);}).catch(()=>{});
    },[user?.id,profile?.goal,profile?.weight]);

    const [totalMealsAllTime,setTotalMealsAllTime]=useState(0);
    useEffect(()=>{
      if(!user?.id)return;
      sb.from('food_logs').select('entries').eq('user_id',user.id)
        .then(({data})=>{
          const total=(data||[]).reduce((s,l)=>s+(l.entries||[]).length,0);
          setTotalMealsAllTime(total);
        });
    },[user?.id]);

    useEffect(()=>{
      if(!user?.id||!workoutLogsRaw)return;
      const earned=JSON.parse(localStorage.getItem('cm_earned_milestones')||'[]');
      const totalSessions=workoutLogsRaw.length;
      let streak=0;
      for(let i=0;i<60;i++){
        const ds=new Date(Date.now()-i*864e5).toISOString().split('T')[0];
        if(workoutLogsRaw.some(l=>l.date===ds))streak++;else if(i>0)break;
      }
      const totalVolume=(workoutLogsRaw||[]).reduce((s,l)=>s+(l.volume_lbs||0),0);
      const memberDays=profile?.created_at?Math.floor((Date.now()-new Date(profile.created_at).getTime())/864e5):0;
      for(const m of MILESTONES){
        if(earned.includes(m.id))continue;
        let achieved=false;
        if(m.type==='session')achieved=totalSessions>=m.threshold;
        else if(m.type==='streak')achieved=streak>=m.threshold;
        else if(m.type==='meals')achieved=totalMealsAllTime>=m.threshold;
        else if(m.type==='volume')achieved=totalVolume>=m.threshold;
        else if(m.type==='membership')achieved=memberDays>=m.threshold;
        if(achieved){
          earned.push(m.id);
          localStorage.setItem('cm_earned_milestones',JSON.stringify(earned));
          setPendingMilestone(m);
          break;
        }
      }
    },[workoutLogsRaw,totalMealsAllTime,user?.id]);

    const _twStart=(()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d.toISOString().split('T')[0];})();
    const todayStr=new Date().toISOString().split('T')[0];

    const dailyFoodMap=useMemo(()=>{
      const m={};
      progFoodLogs.forEach(l=>{
        const cal=(l.entries||[]).reduce((s,e)=>s+(e.calories||0),0);
        const prot=(l.entries||[]).reduce((s,e)=>s+(e.protein||0),0);
        const carbs=(l.entries||[]).reduce((s,e)=>s+(e.carbs||0),0);
        const fat=(l.entries||[]).reduce((s,e)=>s+(e.fat||0),0);
        m[l.date]={cal,prot,carbs,fat,hasData:(l.entries||[]).length>0};
      });
      return m;
    },[progFoodLogs]);

    const workoutsThisWeek=useMemo(()=>(workoutLogsRaw||[]).filter(l=>l.date>=_twStart).length,[workoutLogsRaw,_twStart]);
    const calTarget=macros?.calories||2000;
    const protTarget=macros?.protein||150;
    const carbTarget=macros?.carbs||200;
    const fatTarget=macros?.fat||60;
    const calHitDays=useMemo(()=>Object.entries(dailyFoodMap).filter(([d,v])=>d>=_twStart&&v.cal>=calTarget*0.9).length,[dailyFoodMap,_twStart,calTarget]);
    const protHitDays=useMemo(()=>Object.entries(dailyFoodMap).filter(([d,v])=>d>=_twStart&&v.prot>=protTarget*0.9).length,[dailyFoodMap,_twStart,protTarget]);
    const currentStreak=useMemo(()=>{
      let s=0;
      for(let i=0;i<60;i++){
        const ds=new Date(Date.now()-i*864e5).toISOString().split('T')[0];
        if((workoutLogsRaw||[]).some(l=>l.date===ds)||dailyFoodMap[ds]?.hasData)s++;
        else if(i>0)break;
      }
      return s;
    },[workoutLogsRaw,dailyFoodMap]);

    const personalRecords=useMemo(()=>{
      if(dbPRs.length>0){
        return dbPRs.slice(0,6).map(pr=>[pr.exercise_name,{weight:pr.weight,date:pr.date}]);
      }
      // Fallback: compute from JSONB for users with no personal_records rows yet
      const prs={};
      (workoutLogsRaw||[]).forEach(log=>{
        (log.workout?.exercises||[]).forEach(ex=>{
          if(!ex.name)return;
          (ex.sets||[]).forEach(s=>{
            const w=parseFloat(s.weight)||0;
            if(w>0&&(!prs[ex.name]||w>prs[ex.name].weight))prs[ex.name]={weight:w,date:log.date};
          });
        });
      });
      return Object.entries(prs).sort((a,b)=>b[1].date.localeCompare(a[1].date)).slice(0,6);
    },[dbPRs,workoutLogsRaw]);

    const {volumeThisWeek,volumeLastWeek}=useMemo(()=>{
      const lws=new Date(_twStart);lws.setDate(lws.getDate()-7);const lwStr=lws.toISOString().split('T')[0];
      let tw=0,lw=0;
      (workoutLogsRaw||[]).forEach(log=>{
        // Use volume_lbs column if populated; fall back to JSONB computation
        const vol=log.volume_lbs>0
          ?log.volume_lbs
          :(log.workout?.exercises||[]).reduce((a,ex)=>a+(ex.sets||[]).reduce((b,s)=>b+(parseFloat(s.weight)||0)*(parseInt(s.reps)||0),0),0);
        if(log.date>=_twStart)tw+=vol;else if(log.date>=lwStr)lw+=vol;
      });
      return{volumeThisWeek:Math.round(tw),volumeLastWeek:Math.round(lw)};
    },[workoutLogsRaw,_twStart]);

    const weeklyFreq=useMemo(()=>Array.from({length:8},(_,i)=>{
      const ws=new Date();ws.setDate(ws.getDate()-ws.getDay()-(7-i)*7);ws.setHours(0,0,0,0);
      const we=new Date(ws);we.setDate(we.getDate()+7);
      const wsStr=ws.toISOString().split('T')[0];
      const weStr=we.toISOString().split('T')[0];
      const count=(workoutLogsRaw||[]).filter(l=>l.date>=wsStr&&l.date<weStr).length;
      const isDeloadWk=(deloadWeeksHistory||[]).some(d=>d.week_start<=weStr&&d.week_end>=wsStr&&(d.status==="active"||d.status==="completed"));
      return{week:i+1,count,isCurrent:i===7,isDeload:isDeloadWk};
    }),[workoutLogsRaw,deloadWeeksHistory]);

    const restDaysThisWeek=Math.max(0,(new Date().getDay()||7)-workoutsThisWeek);
    const recoveryScore=useMemo(()=>{
      const split=wPrefs?.splitType||'';
      const optimal=split.includes('6')?1:split.includes('4')?3:4;
      let score=100;
      score-=Math.abs(restDaysThisWeek-optimal)*10;
      if(healthSnap?.sleep!=null&&healthSnap.sleep<6)score-=15;
      if(volumeLastWeek>0&&volumeThisWeek>volumeLastWeek*1.2)score-=10;
      if(currentStreak>=14)score+=10;
      return Math.max(0,Math.min(100,Math.round(score)));
    },[restDaysThisWeek,healthSnap,volumeThisWeek,volumeLastWeek,currentStreak,wPrefs]);

    const setsThisWeek=useMemo(()=>(workoutLogsRaw||[]).filter(l=>l.date>=_twStart).reduce((total,log)=>
      total+(log.workout?.exercises||[]).reduce((a,ex)=>a+(ex.sets||[]).filter(s=>s.done).length,0),0)
    ,[workoutLogsRaw,_twStart]);

    const runActsThisWeek=useMemo(()=>(allActs||[]).filter(a=>{
      const d=a.date||a.start_date_local;
      return d&&d>=_twStart&&(a.type||'').toLowerCase().includes('run');
    }),[allActs,_twStart]);
    const runDistKm=runActsThisWeek.reduce((s,a)=>s+(parseFloat(a.distanceKm)||0),0);
    const runTimeMins=runActsThisWeek.reduce((s,a)=>s+(parseInt(a.durationMins)||0),0);

    const targetSessions=(()=>{
      const split=wPrefs?.splitType||'';
      if(split.includes('6'))return 6;
      if(split.includes('5'))return 5;
      if(split.includes('4'))return 4;
      if(split.includes('3'))return 3;
      return 4;
    })();

    const scoreStatus=sc.total>=90?'PEAKING':sc.total>=80?'PRIMED':sc.total>=70?'BUILDING':sc.total>=50?'RECOVERING':'RECHARGING';
    const ringColor=sc.total>=90?'#FFD700':sc.total>=80?'#22c55e':sc.total>=70?'#60a5fa':sc.total>=50?'#FEA020':'var(--accent)';

    const isHyroxMode=wPrefs?.isHyrox;
    const isRunnerMode=!isHyroxMode&&(wPrefs?.isHybrid||(wPrefs?.splitType||'').toLowerCase().includes('run'));

    const calDays=useMemo(()=>{
      const days=[];
      const today2=new Date();today2.setHours(0,0,0,0);
      const startDay=new Date(today2);
      startDay.setDate(startDay.getDate()-34-startDay.getDay());
      for(let i=0;i<35;i++){
        const d=new Date(startDay);d.setDate(startDay.getDate()+i);
        const ds=d.toISOString().split('T')[0];
        const hasWorkout=(workoutLogsRaw||[]).some(l=>l.date===ds);
        const hasMacros=dailyFoodMap[ds]?.hasData||false;
        const isFuture=d>today2;
        const isToday2=ds===todayStr;
        days.push({ds,hasWorkout,hasMacros,isFuture,isToday2});
      }
      return days;
    },[workoutLogsRaw,dailyFoodMap,todayStr]);

    const weightProjection=useMemo(()=>{
      if(bodyweightLogs.length<5)return null;
      const sorted=[...bodyweightLogs].sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
      const n=sorted.length;
      if(n<3)return null;
      const xs=sorted.map((_,i)=>i);
      const ys=sorted.map(l=>parseFloat(l.weight));
      const xMean=xs.reduce((s,x)=>s+x,0)/n;
      const yMean=ys.reduce((s,y)=>s+y,0)/n;
      const denom=xs.reduce((s,x)=>s+(x-xMean)**2,0);
      if(!denom)return null;
      const slope=xs.reduce((s,x,i)=>s+(x-xMean)*(ys[i]-yMean),0)/denom;
      const intercept=yMean-slope*xMean;
      return{slope,intercept,data:sorted,projectedDelta:slope*7};
    },[bodyweightLogs]);

    const doingWell=[];
    if(sc.r>=75)doingWell.push("Recovery is strong — you're resting right.");
    if(sc.n>=75)doingWell.push("Nutrition is dialed in. Macros on target.");
    if(sc.t>=75)doingWell.push("Training consistency is high this week.");
    if(sc.c>=75)doingWell.push(`${currentStreak}-day streak — momentum is building.`);
    if(!doingWell.length&&sc.total>=60)doingWell.push("Overall performance is solid. Keep stacking.");

    const focusTips=(sc.tips||[]).slice(0,3);

    let twRings,twInsight;
    if(isHyroxMode){
      twRings=[
        {pct:Math.min(100,workoutsThisWeek/targetSessions*100),value:workoutsThisWeek,label:"Training\nDays",color:"var(--accent)"},
        {pct:Math.min(100,setsThisWeek/50*100),value:setsThisWeek,label:"Sets\nDone",color:"#FEA020"},
        {pct:Math.min(100,volumeThisWeek/20000*100),value:volumeThisWeek>999?`${(volumeThisWeek/1000).toFixed(1)}k`:String(volumeThisWeek),label:`Volume\n${profile?.wUnit||'lbs'}`,color:"#60a5fa"},
      ];
      twInsight=`${workoutsThisWeek} of ${targetSessions} sessions done. ${setsThisWeek} total sets this week.`;
    } else if(isRunnerMode){
      twRings=[
        {pct:Math.min(100,runActsThisWeek.length/targetSessions*100),value:runActsThisWeek.length,label:"Runs",color:"var(--accent)"},
        {pct:Math.min(100,runDistKm/50*100),value:displayDistance(runDistKm, profile?.wUnit||'lbs'),label:`${distanceLabel(profile?.wUnit||'lbs')} run`,color:"#22c55e"},
        {pct:Math.min(100,runTimeMins/300*100),value:runTimeMins>=60?`${Math.floor(runTimeMins/60)}h`:`${runTimeMins}m`,label:"Time",color:"#60a5fa"},
      ];
      twInsight=runActsThisWeek.length>0?`${runActsThisWeek.length} run${runActsThisWeek.length>1?'s':''} · ${displayDistance(runDistKm, profile?.wUnit||'lbs')} · ${runTimeMins} min this week`:"No runs logged yet this week.";
    } else {
      twRings=[
        {pct:Math.min(100,workoutsThisWeek/targetSessions*100),value:workoutsThisWeek,label:"Sessions",color:"var(--accent)"},
        {pct:Math.min(100,setsThisWeek/40*100),value:setsThisWeek,label:"Sets",color:"#FEA020"},
        {pct:Math.min(100,Math.min(volumeThisWeek,20000)/20000*100),value:volumeThisWeek>999?`${(volumeThisWeek/1000).toFixed(1)}k`:String(volumeThisWeek||0),label:`Volume\n${profile?.wUnit||'lbs'}`,color:"#60a5fa"},
      ];
      const pctDone=Math.round(workoutsThisWeek/Math.max(1,targetSessions)*100);
      twInsight=workoutsThisWeek===0?"No sessions logged yet this week.":`${workoutsThisWeek} of ${targetSessions} sessions · ${pctDone}% weekly target`;
    }
    // Tier-adaptive: beginners see 2 rings (less overwhelming)
    if (userTier === 'beginner') twRings = twRings.slice(0, 2);

    function ExpenditureCard() {
      const [showInfo, setShowInfo] = useState(false);
      const exp  = expenditure;
      const hist = expenditureHistory;
      const burn = exp?.todaysBurn;
      const drift = dataDrift;

      const confColor = !exp ? "rgba(245,245,240,0.35)"
        : exp.confidence.level === 'high'   ? "#22c55e"
        : exp.confidence.level === 'medium' ? "#60a5fa"
        : exp.confidence.level === 'low'    ? "#FEA020"
        : "rgba(245,245,240,0.35)";

      // Sparkline from stored history
      const sparkPoints = hist.length > 1 ? hist : (exp ? [{ date: exp.date, calculated_tdee: exp.tdee }] : []);
      let sparklinePath = "";
      if (sparkPoints.length > 1) {
        const vals  = sparkPoints.map(p => p.calculated_tdee);
        const min   = Math.min(...vals);
        const max   = Math.max(...vals);
        const range = max - min || 200;
        const W = 200, H = 32;
        sparklinePath = vals.map((v, i) => {
          const x = (i / (vals.length - 1)) * W;
          const y = H - ((v - min) / range) * H;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
      }

      if (!exp) return null;

      const isBuilding  = exp.confidence.level === 'building';
      const tdeeDisplay = isBuilding
        ? exp.formulaTDEE.toLocaleString()
        : exp.confidence.showRange
          ? `${(exp.tdee - 200).toLocaleString()}–${(exp.tdee + 200).toLocaleString()}`
          : exp.tdee.toLocaleString();

      const mono = "'DM Mono','SF Mono',monospace";
      const cond = "'Barlow Condensed',sans-serif";

      return (
        <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>

          {/* Header row */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:mono,fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase"}}>// Energy Expenditure</div>
            <button onClick={()=>{ setShowInfo(v=>!v); if(!showInfo) trackUserEvent(user?.id,'view_expenditure_detail').catch(()=>{}); }} style={{background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"rgba(245,245,240,0.06)"}}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.4)" strokeWidth={2.5} strokeLinecap="round">
                <circle cx={12} cy={12} r={10}/><line x1={12} y1={8} x2={12} y2={8}/><line x1={12} y1={12} x2={12} y2={16}/>
              </svg>
            </button>
          </div>

          {/* Info panel */}
          {showInfo && (
            <div style={{background:"rgba(245,245,240,0.03)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
              {[
                ["TDEE",    "Total Daily Energy Expenditure — calories your body actually burned, derived from 14-day weight trend and food logs."],
                ["BMR",     "Basal Metabolic Rate — calories burned at rest, just keeping organs running. Your metabolic floor."],
                ["NEAT",    "Non-Exercise Activity Thermogenesis — calories from walking and daily movement, scaled by your step count."],
                ["EAT",     "Exercise Activity Thermogenesis — calories from deliberate training. Strength uses mechanical work; cardio uses MET formulas."],
                ["TEF",     "Thermic Effect of Food — energy cost of digestion. High-protein meals burn ~25% of their protein calories just to process."],
              ].map(([term, def]) => (
                <div key={term} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{fontFamily:mono,fontSize:7,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",paddingTop:2,minWidth:32}}>{term}</div>
                  <div style={{fontFamily:"'Barlow',sans-serif",fontSize:11,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{def}</div>
                </div>
              ))}
            </div>
          )}

          {/* TDEE display + confidence badge */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
            <div>
              {isBuilding ? (
                <>
                  <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:11,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Formula estimate</div>
                  <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:36,color:"rgba(245,245,240,0.35)",lineHeight:1}}>
                    {tdeeDisplay}<span style={{fontSize:11,fontWeight:400,color:"rgba(245,245,240,0.25)",fontStyle:"normal",marginLeft:4}}>kcal</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:36,color:"#f5f5f0",lineHeight:1,display:"flex",alignItems:"center",gap:6}}>
                    {tdeeDisplay}<span style={{fontSize:11,fontWeight:400,color:"rgba(245,245,240,0.45)",fontStyle:"normal"}}>kcal/day</span>
                    <ConfidenceDot pct={exp.confidence.score??{building:15,low:35,medium:60,high:85}[exp.confidence.level]??50} explain={exp.factorsApplied?"Adaptive factors applied":"Based on logged data"}/>
                  </div>
                  <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>14-day adaptive TDEE{exp.factorsApplied?" · personalized":""}</div>
                </>
              )}
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:8}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:4,background:`${confColor}14`,border:`1px solid ${confColor}50`,borderRadius:6,padding:"4px 8px",marginBottom:6}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:confColor,flexShrink:0}}/>
                <span style={{fontFamily:mono,fontSize:7,color:confColor,textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap"}}>{exp.confidence.label}</span>
              </div>
              <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{exp.dataDays} days of data</div>
            </div>
          </div>

          {/* Building baseline progress */}
          {isBuilding && (
            <div style={{background:"rgba(245,245,240,0.04)",borderLeft:"2px solid rgba(var(--accent-rgb),0.3)",borderRadius:"0 8px 8px 0",padding:"8px 12px",marginBottom:12}}>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>
                Log meals and weigh in daily to unlock your real TDEE. {Math.max(0, 7 - exp.dataDays)} more days needed.
              </div>
              <div style={{display:"flex",gap:3,marginTop:8}}>
                {Array.from({length:7},(_,i)=>(
                  <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<exp.dataDays?"var(--accent)":"rgba(245,245,240,0.08)"}}/>
                ))}
              </div>
            </div>
          )}

          {/* Component breakdown: BMR · NEAT · Training · TEF */}
          {burn && (
            <div style={{display:"flex",flexWrap:"wrap",gap:"4px 8px",marginBottom:12}}>
              {[
                {k:"BMR",      v:burn.bmr,  c:"rgba(245,245,240,0.5)"},
                {k:"NEAT",     v:burn.neat, c:"#60a5fa"},
                {k:"Training", v:burn.eat,  c:"var(--accent)"},
                {k:"TEF",      v:burn.tef,  c:"#22c55e"},
              ].map(({k,v,c})=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:3}}>
                  <span style={{fontFamily:mono,fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{k}</span>
                  <span style={{fontFamily:cond,fontStyle:"italic",fontWeight:700,fontSize:12,color:c}}>{(v||0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Today's burn line */}
          {burn && burn.total > 0 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(var(--accent-rgb),0.05)",border:"1px solid rgba(var(--accent-rgb),0.12)",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
              <div>
                <div style={{fontFamily:mono,fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:2}}>Today's projected burn</div>
                <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",lineHeight:1}}>
                  {burn.total.toLocaleString()} <span style={{fontSize:10,fontWeight:400,fontStyle:"normal",color:"rgba(245,245,240,0.45)"}}>kcal</span>
                </div>
              </div>
              {burn.noHealthKit && (
                <div style={{fontFamily:mono,fontSize:7,color:"rgba(96,165,250,0.7)",textTransform:"uppercase",letterSpacing:"0.08em",textAlign:"right",maxWidth:90,lineHeight:1.4}}>
                  Connect Health<br/>for NEAT
                </div>
              )}
            </div>
          )}

          {/* Sparkline */}
          {sparkPoints.length > 1 && (
            <div style={{marginBottom:12}}>
              <div style={{fontFamily:mono,fontSize:7,color:"rgba(245,245,240,0.25)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>30-day TDEE trend</div>
              <svg width="100%" height="32" viewBox="0 0 200 32" preserveAspectRatio="none" style={{display:"block"}}>
                <polyline points={sparklinePath} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                <polyline points={`0,32 ${sparklinePath} 200,32`} fill="rgba(var(--accent-rgb),0.08)" stroke="none"/>
              </svg>
            </div>
          )}

          {/* Bottom stat row */}
          {!isBuilding && (
            <div style={{display:"flex",borderTop:"1px solid rgba(245,245,240,0.06)",paddingTop:10}}>
              {[
                {l:"14d Cal Avg", v:`${(exp.avgCalories||0).toLocaleString()} kcal`},
                {l:"TEF Bonus",   v:`+${(exp.tef||0)} kcal`},
                {l:"Trend Wt",    v:`${(exp.trendWeight||0).toFixed(1)} ${profile.wUnit||'lbs'}`},
              ].map(({l,v},i)=>(
                <div key={l} style={{flex:1,textAlign:"center",borderRight:i<2?"1px solid rgba(245,245,240,0.06)":"none"}}>
                  <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:700,fontSize:13,color:"#f5f5f0",lineHeight:1}}>{v}</div>
                  <div style={{fontFamily:mono,fontSize:7,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Data drift insight */}
          {drift && (
            <div style={{marginTop:10,background:"rgba(254,160,32,0.06)",border:"1px solid rgba(254,160,32,0.2)",borderRadius:8,padding:"8px 12px"}}>
              <div style={{fontFamily:mono,fontSize:7,color:"#FEA020",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>// Data insight</div>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:11,color:"rgba(245,245,240,0.65)",lineHeight:1.5}}>{drift.message}</div>
            </div>
          )}
        </div>
      );
    }

    function ValidationInsightCard() {
      const [expanded, setExpanded] = useState(false);
      const top = validationInsights[0];

      if (insightLoading && !top) {
        return (
          <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// Today's Insight</div>
            <div style={{height:48,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{width:18,height:18,borderRadius:"50%",border:"2px solid rgba(var(--accent-rgb),0.3)",borderTopColor:"var(--accent)",animation:"spin 0.9s linear infinite"}}/>
            </div>
          </div>
        );
      }

      if (!top) return null;

      // Personality adaptation
      const _persProfile = getProfileSync(user?.id);
      const adaptedMessage = adaptMessageSync(top.message, _persProfile, { scenario: top.insight_type, addPrefix: false });

      const priorityColor = { severe: '#ef4444', high: '#f59e0b', medium: '#60a5fa', low: 'rgba(245,245,240,0.35)' };
      const priorityBg    = { severe: 'rgba(239,68,68,0.08)', high: 'rgba(245,158,11,0.08)', medium: 'rgba(96,165,250,0.08)', low: 'rgba(245,245,240,0.04)' };
      const typeLabel     = { calorie_intake: 'NUTRITION', weight_trend: 'BODY WEIGHT', training_progress: 'TRAINING', recovery: 'RECOVERY' };
      const pc = priorityColor[top.priority] || priorityColor.low;
      const pb = priorityBg[top.priority] || priorityBg.low;

      return (
        <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${pc}22, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase"}}>// Today's Insight</div>
              <div style={{background:pb,border:`1px solid ${pc}44`,borderRadius:4,padding:"1px 6px",fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:pc,textTransform:"uppercase",letterSpacing:"0.12em"}}>{top.priority}</div>
            </div>
            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{typeLabel[top.insight_type] || top.insight_type}</div>
          </div>

          {/* Message — personality-adapted */}
          <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.85)",lineHeight:1.55,marginBottom:10}}>{adaptedMessage || top.message}</div>

          {/* Confidence bar */}
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Confidence</span>
              <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.45)"}}>{top.confidence}%</span>
            </div>
            <div style={{height:3,background:"rgba(245,245,240,0.08)",borderRadius:2}}>
              <div style={{height:3,width:`${top.confidence}%`,background:pc,borderRadius:2,transition:"width 0.6s ease"}}/>
            </div>
          </div>

          {/* Signals */}
          {(top.signals_aligned || []).length > 0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
              {(top.signals_aligned || []).map((s, i) => {
                const sc = s.direction === 'good' ? '#22c55e' : s.direction === 'severe' ? '#ef4444' : s.direction === 'low' ? '#f59e0b' : 'rgba(245,245,240,0.35)';
                return (
                  <div key={i} style={{background:"rgba(245,245,240,0.04)",border:`1px solid rgba(245,245,240,0.08)`,borderRadius:6,padding:"4px 8px",display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:4,height:4,borderRadius:"50%",background:sc,flexShrink:0}}/>
                    <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.5)"}}>{s.signal}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:700,fontSize:11,color:sc}}>{String(s.value)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Expandable recommendation */}
          {top.recommendation && (
            <button onClick={() => { setExpanded(e => !e); if (!expanded) trackUserEvent(user?.id, 'expand_validation_insight', { insight_type: top.insight_type }).catch(()=>{}); }}
              style={{background:"none",border:"none",padding:0,cursor:"pointer",width:"100%",textAlign:"left",marginBottom: expanded ? 8 : 0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:1,background:"rgba(245,245,240,0.06)"}}/>
                <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{expanded ? "hide" : "recommendation"}</span>
                <div style={{flex:1,height:1,background:"rgba(245,245,240,0.06)"}}/>
              </div>
            </button>
          )}
          {expanded && top.recommendation && (
            <div style={{background:"rgba(var(--accent-rgb),0.05)",borderLeft:"2px solid rgba(var(--accent-rgb),0.4)",borderRadius:"0 8px 8px 0",padding:"8px 12px",marginBottom:8}}>
              <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.7)",lineHeight:1.5}}>{top.recommendation}</div>
            </div>
          )}

          {/* Footer: data days + dismiss */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
            <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.25)"}}>{top.data_days_used}d of data</span>
            <button onClick={() => {
              dismissInsight(user?.id, top.insight_type).catch(()=>{});
              trackUserEvent(user?.id, 'dismiss_validation_insight', { insight_type: top.insight_type }).catch(()=>{});
              setValidationInsights(prev => prev.filter(i => i.insight_type !== top.insight_type));
            }} style={{background:"none",border:"none",padding:"2px 8px",cursor:"pointer",fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.25)",textTransform:"uppercase",letterSpacing:"0.1em"}}>dismiss</button>
          </div>
        </div>
      );
    }

    function PH({eyebrow,headline,body}){
      return(
        <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>{eyebrow}</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#fff",marginBottom:6}}>{headline}</div>
          <div style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.55)",lineHeight:1.5}}>{body}</div>
        </div>
      );
    }

    return (
      <div style={{background:"#000",minHeight:"100vh",position:"relative",overflow:"hidden"}} className="page-enter">
        <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {/* Atmospheric red glows */}
        <div style={{position:"absolute",top:-80,left:-100,width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle, rgba(var(--accent-rgb),0.13) 0%, transparent 70%)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"absolute",bottom:150,right:-120,width:280,height:280,borderRadius:"50%",background:"radial-gradient(circle, rgba(var(--accent-rgb),0.07) 0%, transparent 70%)",pointerEvents:"none",zIndex:0}}/>

        <div style={{position:"relative",zIndex:1}}>
          {/* Header */}
          <div className="screen-header" style={{paddingTop:12}}>
            <div style={{flex:1,minWidth:0}}>
              <div className="header-eyebrow">// Performance</div>
              <div className="header-title">Progress</div>
            </div>
          </div>

          {/* Tab nav — dynamic per tier + mode */}
          <div style={{display:"flex",borderBottom:"1px solid rgba(245,245,240,0.07)",marginBottom:16,overflowX:"auto"}}>
            {progressTabs.map(id=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={{
                flex:1,fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,letterSpacing:"0.12em",
                padding:"10px 4px",color:activeTab===id?"var(--accent)":"rgba(245,245,240,0.35)",
                border:"none",borderBottom:activeTab===id?"2px solid var(--accent)":"2px solid transparent",
                background:"none",cursor:"pointer",whiteSpace:"nowrap"
              }}>{id.toUpperCase()}</button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {activeTab==="overview"&&<>
            {workoutLogsRaw.length>0&&<WeeklyReview
              workoutLogsRaw={workoutLogsRaw}
              workoutsThisWeek={workoutsThisWeek}
              volumeThisWeek={volumeThisWeek}
              volumeLastWeek={volumeLastWeek}
              protHitDays={protHitDays}
              calHitDays={calHitDays}
              twStart={_twStart}
              macros={macros}
              user={user}
            />}
            {workoutLogsRaw.length>0&&(
              <div style={{margin:"-4px 16px 14px",display:"flex",justifyContent:"flex-end"}}>
                <button onClick={()=>setShowWeeklyReviewModal(true)} style={{background:"none",border:"1px solid rgba(var(--accent-rgb),0.2)",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:8,color:"rgba(var(--accent-rgb),0.7)",textTransform:"uppercase",letterSpacing:"0.1em"}}>
                  Full Weekly Review →
                </button>
              </div>
            )}
            {/* Empty state — fewer than 3 sessions */}
            {workoutLogsRaw.length<3&&(
              <div style={{margin:"0 16px 16px",padding:"20px 16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// PROGRESS UNLOCKS IN 3 SESSIONS</div>
                <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:22,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:8}}>
                  YOUR DATA IS BUILDING<span style={{color:"var(--accent)"}}>.</span>
                </div>
                <div style={{fontSize:13,color:"rgba(245,245,240,0.55)",lineHeight:1.5,marginBottom:16}}>
                  Complete {3-workoutLogsRaw.length} more session{3-workoutLogsRaw.length===1?"":"s"} to unlock your full progress dashboard. Coach Macro needs a baseline to start measuring your growth.
                </div>
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.12em"}}>Sessions completed</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:8,color:"var(--accent)"}}>{workoutLogsRaw.length}/3</span>
                  </div>
                  <div style={{height:6,background:"rgba(245,245,240,0.07)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.round(workoutLogsRaw.length/3*100)}%`,background:"var(--accent)",borderRadius:3,transition:"width 0.6s ease"}}/>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    {[0,1,2].map(i=>(
                      <div key={i} style={{flex:1,height:3,borderRadius:2,background:i<workoutLogsRaw.length?"var(--accent)":"rgba(245,245,240,0.07)"}}/>
                    ))}
                  </div>
                </div>
                <button onClick={()=>setSection("train")} style={{width:"100%",padding:"13px 0",background:"var(--accent)",border:"none",borderRadius:12,fontFamily:"var(--mono)",fontWeight:700,fontSize:10,color:"#fff",letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer"}}>
                  START A SESSION →
                </button>
              </div>
            )}
            {/* Coach Score Card */}
            <div style={{
              margin:"0 16px 14px",padding:"20px 16px",
              background:"rgba(245,245,240,0.03)",
              backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",
              boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",
              borderRadius:16,
            }}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>// Coach Score</div>
              <CoachScoreRing score={sc.total} ringColor={ringColor} scoreStatus={scoreStatus} scoreLabels={scoreLabels} sc={sc}/>
            </div>

            {/* Feature Strip */}
            <div style={{padding:"0 16px",marginBottom:14}}>
              <FeatureStrip tab="progress" onProgressTab={(t) => setActiveTab(t)} />
            </div>

            {/* Hyrox Race Countdown + Predictor — only shown to hyrox users with a race date */}
            {wPrefs?.isHyrox&&(profile?.hyrox_race_date||wPrefs?.hyroxRaceDate)&&(()=>{
              const raceDate=profile?.hyrox_race_date||wPrefs?.hyroxRaceDate;
              const phase=getHyroxPhase(raceDate);
              if(!phase)return null;
              const hProf={
                hyrox_category:wPrefs?.hyroxCategory||profile?.hyrox_category||"open",
                hyrox_experience:wPrefs?.hyroxExp||profile?.hyrox_experience||"",
                hyrox_weak_stations:wPrefs?.hyroxWeakStations||profile?.hyrox_weak_stations||[],
                hyrox_target_time:wPrefs?.hyroxTargetTimeMin?`${wPrefs.hyroxTargetTimeMin}:${wPrefs.hyroxTargetTimeSec||"00"}`:profile?.hyrox_target_time,
                hyrox_previous_time:wPrefs?.hyroxPrevTimeMin?`${wPrefs.hyroxPrevTimeMin}:${wPrefs.hyroxPrevTimeSec||"00"}`:profile?.hyrox_previous_time,
              };
              const pred=getRaceTimePredictor(hProf,(workoutLogsRaw||[]).slice(0,30));
              return(<>
                {/* Race Countdown */}
                <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${phase.color}25, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Race Countdown</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:38,color:"#fff",lineHeight:1}}>{phase.weeksUntilRace}w</div>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>until race day</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{background:`${phase.color}18`,border:`1px solid ${phase.color}50`,borderRadius:8,padding:"6px 12px",marginBottom:6}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:15,color:phase.color}}>{phase.label}</div>
                      </div>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.35)",textTransform:"uppercase"}}>{new Date(raceDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                    </div>
                  </div>
                  <div style={{background:`${phase.color}08`,borderLeft:`2px solid ${phase.color}60`,borderRadius:"0 8px 8px 0",padding:"8px 12px"}}>
                    <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.65)",lineHeight:1.5}}>{phase.description}</div>
                  </div>
                </div>

                {/* Predictor */}
                <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(252,76,2,0.15), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"#FC4C02",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>// Finish Time Predictor</div>
                  <div style={{display:"flex",gap:12,marginBottom:14}}>
                    <div style={{flex:1,background:"rgba(252,76,2,0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Predicted</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:"#fff"}}>{pred.currentPrediction}</div>
                    </div>
                    {pred.targetTime&&<div style={{flex:1,background:pred.onTrack?"rgba(34,197,94,0.06)":"rgba(var(--accent-rgb),0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Target</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:pred.onTrack?"#22c55e":"var(--accent)"}}>{pred.targetTime}</div>
                    </div>}
                  </div>
                  {pred.targetTime&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"8px 12px",background:pred.onTrack?"rgba(34,197,94,0.06)":"rgba(var(--accent-rgb),0.04)",borderRadius:8}}>
                    <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{pred.onTrack?"On track":"Gap to target"}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:pred.onTrack?"#22c55e":"var(--accent)"}}>{pred.onTrack?"✓ "+pred.gap+" ahead":pred.gap+" behind"}</span>
                  </div>}
                  {pred.topPriorities.length>0&&<>
                    <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// Priority Stations</div>
                    {pred.topPriorities.map(s=>(
                      <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                        <div style={{width:6,height:6,borderRadius:1,background:"#FC4C02",flexShrink:0}}/>
                        <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.75)"}}>{s}</span>
                      </div>
                    ))}
                  </>}
                </div>
              </>);
            })()}

            {/* Running Race Countdown Card */}
            {profile?.run_race_date&&!wPrefs?.isHyrox&&(()=>{
              const phase=getRunningPhase(profile.run_race_date);
              if(!phase)return null;
              const pred=getRunTimePredictor(profile,(workoutLogsRaw||[]).filter(l=>l.workout?.avg_pace_secs_per_km).slice(0,20));
              const raceTypeLabels={_5k:"5K","5k":"5K",_10k:"10K","10k":"10K",half_marathon:"HALF MARATHON",marathon:"MARATHON",ultra:"ULTRA",obstacle:"OBSTACLE / OCR"};
              const raceLabel=raceTypeLabels[profile.run_race_type]||(profile.run_race_type||"").toUpperCase().replace(/_/g," ");
              return(<>
                <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${phase.color}25, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Race Day</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:38,color:"#fff",lineHeight:1}}>{phase.weeksUntilRace}w</div>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>until race day</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{background:`${phase.color}18`,border:`1px solid ${phase.color}50`,borderRadius:8,padding:"6px 12px",marginBottom:6}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:15,color:phase.color}}>{phase.label}</div>
                      </div>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.35)",textTransform:"uppercase"}}>{raceLabel&&<>{raceLabel} · </>}{new Date(profile.run_race_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                    </div>
                  </div>
                  <div style={{background:`${phase.color}08`,borderLeft:`2px solid ${phase.color}60`,borderRadius:"0 8px 8px 0",padding:"8px 12px"}}>
                    <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.65)",lineHeight:1.5}}>{phase.description}</div>
                  </div>
                </div>
                {(pred.currentPrediction||pred.previousTime)&&<div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${phase.color}12, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>// Predicted Finish</div>
                  <div style={{display:"flex",gap:12,marginBottom:pred.targetTime?14:0}}>
                    <div style={{flex:1,background:`${phase.color}06`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Predicted</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:"#fff"}}>{pred.currentPrediction||pred.previousTime}</div>
                    </div>
                    {pred.targetTime&&<div style={{flex:1,background:pred.onTrack?"rgba(34,197,94,0.06)":"rgba(var(--accent-rgb),0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Target</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:pred.onTrack?"#22c55e":"var(--accent)"}}>{pred.targetTime}</div>
                    </div>}
                  </div>
                  {pred.targetTime&&pred.gap&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:pred.onTrack?"rgba(34,197,94,0.06)":"rgba(var(--accent-rgb),0.04)",borderRadius:8}}>
                    <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{pred.onTrack?"On track":"Gap to target"}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:pred.onTrack?"#22c55e":"var(--accent)"}}>{pred.onTrack?"✓ "+pred.gap+" ahead":pred.gap+" behind"}</span>
                  </div>}
                </div>}
              </>);
            })()}

            {/* Strength Competition Card */}
            {profile?.strength_comp_date&&(()=>{
              const phase=getStrengthPhase(profile.strength_comp_date);
              if(!phase)return null;
              const pred=getStrengthPredictor(profile);
              const compTypeLabel=(profile.strength_comp_type||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
              const federation=profile.strength_comp_federation;
              return(<>
                <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${phase.color}25, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Competition</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:38,color:"#fff",lineHeight:1}}>{phase.weeksUntilRace}w</div>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:3}}>until competition</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{background:`${phase.color}18`,border:`1px solid ${phase.color}50`,borderRadius:8,padding:"6px 12px",marginBottom:6}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:15,color:phase.color}}>{phase.label}</div>
                      </div>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.35)",textTransform:"uppercase"}}>{compTypeLabel}{federation?` · ${federation}`:""}</div>
                    </div>
                  </div>
                  <div style={{background:`${phase.color}08`,borderLeft:`2px solid ${phase.color}60`,borderRadius:"0 8px 8px 0",padding:"8px 12px"}}>
                    <div style={{fontFamily:"'Barlow',sans-serif",fontSize:12,color:"rgba(245,245,240,0.65)",lineHeight:1.5}}>{phase.description}</div>
                  </div>
                </div>
                {pred.currentTotal>0&&<div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:`0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px ${phase.color}12, inset 0 1px 0 0 rgba(245,245,240,0.12)`,borderRadius:16}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>// Current Total</div>
                  <div style={{display:"flex",gap:12,marginBottom:pred.targetTotal?14:0}}>
                    <div style={{flex:1,background:`${phase.color}06`,borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Current</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:"#fff"}}>{pred.currentTotal.toLocaleString()} {profile?.units==="metric"?"kg":"lbs"}</div>
                    </div>
                    {pred.targetTotal&&<div style={{flex:1,background:pred.onTrack?"rgba(34,197,94,0.06)":"rgba(var(--accent-rgb),0.06)",borderRadius:10,padding:"12px",textAlign:"center"}}>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Target</div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:24,color:pred.onTrack?"#22c55e":"var(--accent)"}}>{pred.targetTotal.toLocaleString()} {profile?.units==="metric"?"kg":"lbs"}</div>
                    </div>}
                  </div>
                  {pred.targetTotal&&pred.gapToTarget!==null&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:pred.topLiftToImprove?12:0,padding:"8px 12px",background:pred.onTrack?"rgba(34,197,94,0.06)":"rgba(var(--accent-rgb),0.04)",borderRadius:8}}>
                    <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{pred.onTrack?"Target reached":"Gap to target"}</span>
                    <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:pred.onTrack?"#22c55e":"var(--accent)"}}>{pred.onTrack?"✓ On track":`${Math.abs(pred.gapToTarget)} to go`}</span>
                  </div>}
                  {pred.topLiftToImprove&&<div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:6,height:6,borderRadius:1,background:phase.color,flexShrink:0}}/>
                    <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.75)"}}>Focus: {pred.topLiftToImprove} — most room to close the gap</span>
                  </div>}
                </div>}
              </>);
            })()}

            {/* Today's Insight */}
            <ValidationInsightCard/>

            {/* Coach Memory — historical recall */}
            <CoachInsightsCard recall={coachRecall} userId={user?.id}/>

            {/* Connections Dashboard */}
            <ConnectionsInsightCard
              correlations={connectionData}
              memberDays={profile?.created_at?Math.floor((Date.now()-new Date(profile.created_at).getTime())/864e5):0}
              onOpen={()=>setShowConnectionsView(true)}
            />

            {/* Peer Comparison */}
            <CohortContextCard
              peerData={peerData}
              memberDays={profile?.created_at?Math.floor((Date.now()-new Date(profile.created_at).getTime())/864e5):0}
              onOpen={()=>setShowPeerView(true)}
            />

            {/* This Week Rings */}
            <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>// This Week</div>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                {twRings.map(({pct,value,label,color},i)=>(
                  <MiniRing key={label} pct={pct} value={value} label={label} color={color} index={i}/>
                ))}
              </div>
              <div style={{background:"rgba(var(--accent-rgb),0.05)",borderLeft:"2px solid rgba(var(--accent-rgb),0.5)",borderRadius:"0 8px 8px 0",padding:"8px 12px",marginBottom:12}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:13,color:"rgba(245,245,240,0.7)",lineHeight:1.4}}>{twInsight}</div>
              </div>
              <div style={{display:"flex",borderTop:"1px solid rgba(245,245,240,0.06)",paddingTop:12}}>
                {[{l:"Cal Hit",v:`${calHitDays}d`},{l:"Protein Hit",v:`${protHitDays}d`},{l:"Streak",v:`${currentStreak}d`}].map(({l,v},i)=>(
                  <div key={l} style={{flex:1,textAlign:"center",borderRight:i<2?"1px solid rgba(245,245,240,0.06)":"none"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#f5f5f0",lineHeight:1}}>{v}</div>
                    <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expenditure / TDEE Card */}
            <ExpenditureCard/>

            {/* Performance Calendar */}
            <div style={{margin:"0 16px 14px",padding:"16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:16}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Performance Calendar</div>
              <PerformanceCalendarGrid calDays={calDays}/>
            </div>

            {/* Training DNA */}
            <div data-tour="training-dna">
              {workoutLogsRaw.length<10?(
                <div style={{margin:"0 16px 14px",padding:"20px 16px",background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.08)",borderRadius:16}}>
                  <div style={{fontFamily:"var(--mono)",fontSize:9,color:"rgba(245,245,240,0.35)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// ATHLETE DNA</div>
                  <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",lineHeight:1,marginBottom:8}}>
                    ATHLETE DNA FORMING<span style={{color:"var(--accent)"}}>.</span>
                  </div>
                  <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.5,marginBottom:14}}>
                    Your training profile unlocks after 10 sessions. {10-workoutLogsRaw.length} to go.
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.3)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Sessions</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.4)"}}>{workoutLogsRaw.length}/10</span>
                  </div>
                  <div style={{height:4,background:"rgba(245,245,240,0.06)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.round(workoutLogsRaw.length/10*100)}%`,background:"rgba(245,245,240,0.25)",borderRadius:2,transition:"width 0.6s ease"}}/>
                  </div>
                </div>
              ):(
                <TrainingDNA profile={profile} wPrefs={wPrefs} user={user} isMobile={isMobile} schedule={schedule}/>
              )}
            </div>

            {/* Coach Tips */}
            <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out 60ms both"}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Coach</div>
              {doingWell.length>0&&(
                <div style={{marginBottom:focusTips.length?14:0}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(34,197,94,0.7)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>// Doing Well</div>
                  {doingWell.map((t,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
                      <span style={{color:"#22c55e",fontSize:11,marginTop:1,flexShrink:0}}>✓</span>
                      <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.75)",lineHeight:1.5}}>{t}</span>
                    </div>
                  ))}
                </div>
              )}
              {focusTips.length>0&&(
                <div>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(var(--accent-rgb),0.7)",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>// Focus This Week</div>
                  {focusTips.map((t,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:i<focusTips.length-1?6:0}}>
                      <span style={{color:"var(--accent)",fontSize:11,marginTop:1,flexShrink:0}}>→</span>
                      <span style={{fontFamily:"'Barlow',sans-serif",fontSize:13,color:"rgba(245,245,240,0.75)",lineHeight:1.5}}>{t}</span>
                    </div>
                  ))}
                </div>
              )}
              {!doingWell.length&&!focusTips.length&&(
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontSize:15,color:"rgba(245,245,240,0.45)"}}>Log workouts and meals to see personalized coaching.</div>
              )}
            </div>

            {/* Milestones Grid */}
            {(()=>{
              const earned=JSON.parse(localStorage.getItem('cm_earned_milestones')||'[]');
              const earnedSet=new Set(earned);
              return(
                <div style={{margin:"0 16px 14px",padding:"16px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out 120ms both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// MILESTONES</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {MILESTONES.map((m,mi)=>{
                      const isEarned=earnedSet.has(m.id);
                      return(
                        <div key={m.id} style={{background:"rgba(245,245,240,0.02)",border:`1px solid ${isEarned?"rgba(var(--accent-rgb),0.2)":"rgba(245,245,240,0.06)"}`,borderRadius:10,padding:"12px 8px",textAlign:"center",opacity:isEarned?1:0.25,animation:`cardIn 0.3s ease-out ${mi*20}ms both`}}>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:16,fontWeight:900,color:"var(--accent)",marginBottom:4,letterSpacing:'-0.02em'}}>{isEarned?m.icon:"X"}</div>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:7,color:"var(--accent)",letterSpacing:"0.1em",textTransform:"uppercase",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingTop:2}}>{m.title.replace(/\.$/, '')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </>}

          {/* ── STRENGTH ── */}
          {activeTab==="strength"&&<>
            <div data-tour="plateau-section" style={{margin:"0 16px 14px",padding:"16px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:activePlateaus.length>0?12:0}}>// ACTIVE PLATEAUS</div>
              {activePlateaus.length>0?(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {activePlateaus.map((p,i)=>(
                    <div key={p.id||i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<activePlateaus.length-1?"1px solid rgba(245,245,240,0.05)":"none"}}>
                      <div style={{flex:1,minWidth:0,marginRight:12}}>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.exercise_name}</div>
                        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2}}>
                          {p.plateau_type==="weight"?`Weight stuck at ${p.stalled_value} lbs × ${p.sessions_stalled} sessions`:`Volume flat × ${p.sessions_stalled} sessions`}
                        </div>
                      </div>
                      {p.strategy_prescribed&&(
                        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.55)",textAlign:"right",flexShrink:0,maxWidth:110,lineHeight:1.3}}>{p.strategy_prescribed}</div>
                      )}
                    </div>
                  ))}
                </div>
              ):(
                <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"#22c55e",marginTop:6}}>✓ All lifts progressing</div>
              )}
            </div>

            <PRFeed dbPRs={dbPRs} wUnit={profile?.wUnit||"lbs"}/>

            <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out 60ms both"}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// Volume This Week</div>
              {volumeThisWeek>0?(
                <>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:32,color:"#fff",lineHeight:1}}>{volumeThisWeek.toLocaleString()} <span style={{fontSize:16,color:"rgba(245,245,240,0.45)"}}>{profile?.wUnit||"lbs"}</span></div>
                  {volumeLastWeek>0&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontFamily:"'DM Mono','SF Mono',monospace",fontSize:10}}>
                      {volumeThisWeek>=volumeLastWeek?(
                        <><span style={{color:"#22c55e"}}>↑</span><span style={{color:"#22c55e"}}>{Math.round((volumeThisWeek/volumeLastWeek-1)*100)}% vs last week</span></>
                      ):(
                        <><span style={{color:"var(--accent)"}}>↓</span><span style={{color:"var(--accent)"}}>{Math.round((1-volumeThisWeek/volumeLastWeek)*100)}% vs last week</span></>
                      )}
                    </div>
                  )}
                </>
              ):(
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:20,color:"rgba(245,245,240,0.35)"}}>NO DATA YET.</div>
              )}
            </div>

            <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Workout Frequency</div>
              <WorkoutFreqBars weeklyFreq={weeklyFreq}/>
            </div>

            {(()=>{
              const split=wPrefs?.splitType||"My Program";
              const pct=Math.min(100,Math.round((programWeek/12)*100));
              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out 120ms both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// Mesocycle Progress</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#fff",marginBottom:10}}>Week {programWeek} of 12 · {split}</div>
                  <div style={{height:6,background:"rgba(245,245,240,0.07)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#e8341c,rgba(232,52,28,0.6))",borderRadius:3,transformOrigin:"left center",animation:"smBar 0.6s cubic-bezier(.2,.7,.3,1) both"}}/>
                  </div>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.35)",marginTop:6}}>{pct}% complete</div>
                </div>
              );
            })()}
            {(()=>{
              // RPE trend chart — only if user has RPE data on at least 5 sessions
              const sixWeeksAgo=new Date(Date.now()-42*864e5).toISOString().split("T")[0];
              const recentLogs=(workoutLogsRaw||[]).filter(l=>l.date>=sixWeeksAgo).sort((a,b)=>a.date>b.date?1:-1);

              // Build per-exercise RPE history from raw logs
              const exRPEMap={};
              recentLogs.forEach(log=>{
                (log.workout?.exercises||[]).forEach(ex=>{
                  if(!exRPEMap[ex.name])exRPEMap[ex.name]=[];
                  const doneSets=(ex.sets||[]).filter(s=>s.done&&s.rpe!=null);
                  if(!doneSets.length)return;
                  const avgRPE=doneSets.reduce((sum,s)=>sum+s.rpe,0)/doneSets.length;
                  exRPEMap[ex.name].push({date:log.date,avgRPE:Math.round(avgRPE*10)/10});
                });
              });

              // Sessions that have ANY RPE data
              const sessionsWithRPE=new Set(recentLogs.filter(l=>(l.workout?.exercises||[]).some(ex=>(ex.sets||[]).some(s=>s.done&&s.rpe!=null))).map(l=>l.date));
              if(sessionsWithRPE.size<5)return null;

              // Pick top 2 exercises with most RPE data
              const topExercises=Object.entries(exRPEMap)
                .filter(([,h])=>h.length>=3)
                .sort((a,b)=>b[1].length-a[1].length)
                .slice(0,2);
              if(topExercises.length===0)return null;

              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(245,245,240,0.06)",borderRadius:12}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// RPE TREND</div>
                  {topExercises.map(([exName,exHistory])=>{
                    const points=exHistory.slice(-8);
                    if(points.length<2)return null;
                    const trend=points[points.length-1].avgRPE-points[0].avgRPE;
                    const trendColor=trend>0.5?'#e8341c':trend>0?'#FEA020':'#22c55e';
                    const trendLabel=trend>0.5?"↑ RPE rising":trend>0?"→ RPE stable (slight rise)":"→ RPE stable";
                    return <RPELineChart key={exName} points={points} exName={exName} trendColor={trendColor} trendLabel={trendLabel}/>;
                  })}
                  <div style={{display:"flex",gap:12,marginTop:4}}>
                    {[["≤7","#22c55e","Easy"],["8","#FEA020","Hard"],["≥9","var(--accent)","Very Hard"]].map(([label,color,desc])=>(
                      <div key={label} style={{display:"flex",alignItems:"center",gap:4}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
                        <span style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:7,color:"rgba(245,245,240,0.3)"}}>{label} {desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>}

          {/* ── NUTRITION ── */}
          {activeTab==="nutrition"&&<>
            {(()=>{
              const twDays=Object.entries(dailyFoodMap).filter(([d])=>d>=_twStart&&dailyFoodMap[d].hasData);
              if(twDays.length===0)return<PH eyebrow="// This Week's Averages" headline="NO LOGS YET." body="Log meals this week to see your daily average calories and macros."/>;
              const n=twDays.length;
              const avg=(key)=>Math.round(twDays.reduce((s,[,v])=>s+v[key],0)/n);
              const avgCal=avg('cal'),avgProt=avg('prot'),avgCarbs=avg('carbs'),avgFat=avg('fat');
              function chipColor(actual,target){if(actual>=target*0.9&&actual<=target*1.1)return"#22c55e";if(actual>=target*0.75&&actual<=target*1.25)return"#FEA020";return"var(--accent)";}
              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,animation:"cardIn 0.4s ease-out both"}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// This Week's Averages</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[{l:"Calories",v:avgCal,t:calTarget,u:"kcal"},{l:"Protein",v:avgProt,t:protTarget,u:"g"},{l:"Carbs",v:avgCarbs,t:carbTarget,u:"g"},{l:"Fat",v:avgFat,t:fatTarget,u:"g"}].map(({l,v,t,u})=>(
                      <div key={l} style={{padding:"10px 12px",background:"rgba(245,245,240,0.03)",borderRadius:10,border:`1px solid ${chipColor(v,t)}30`}}>
                        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.35)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{l}</div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:chipColor(v,t),lineHeight:1}}>{v} <span style={{fontSize:11,fontWeight:400,color:"rgba(245,245,240,0.35)"}}>/ {t}{u}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {(()=>{
              const days14=Array.from({length:14},(_,i)=>{
                const d=new Date(Date.now()-(13-i)*864e5);
                const ds=d.toISOString().split('T')[0];
                const fd=dailyFoodMap[ds];
                return{ds,fd,dow:d.toLocaleDateString('en-US',{weekday:'short'}).slice(0,1)};
              });
              const hitCount=days14.filter(({fd})=>fd?.hasData&&fd.prot>=protTarget*0.9).length;
              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Protein Consistency</div>
                  <ProteinGrid days14={days14} hitCount={hitCount} protTarget={protTarget}/>
                </div>
              );
            })()}

            {(()=>{
              const days14=Array.from({length:14},(_,i)=>{
                const ds=new Date(Date.now()-(13-i)*864e5).toISOString().split('T')[0];
                const fd=dailyFoodMap[ds];
                return{ds,cal:fd?.cal||0,hasData:fd?.hasData||false};
              });
              const daysWithData=days14.filter(d=>d.hasData).length;
              if(daysWithData<3)return<PH eyebrow="// Calorie Trend" headline="KEEP LOGGING." body="Log 3 days of meals to see your calorie trend."/>;
              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Calorie Trend</div>
                  <CalorieTrendChart days14={days14} calTarget={calTarget}/>
                </div>
              );
            })()}

            {weightProjection?(
              <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// Weight Projection</div>
                <WeightChart
                  weightProjection={weightProjection}
                  goalW={profile?.goalWeight?parseFloat(profile.goalWeight):null}
                  profile={profile}
                />
              </div>
            ):(
              <PH eyebrow="// Weight Projection" headline="LOG YOUR WEIGHT." body="Log your weight for 5+ days to see trend projection and forecast."/>
            )}
            {(profile?.wHistory||profile?.wTrend)&&(()=>{
              const histLabel={yes:"Previously significantly heavier",no:"Weight stable long-term",notsure:"Weight history unclear"}[profile.wHistory]||null;
              const trendLabel={losing:"Losing",gaining:"Gaining",stable:"Stable",notsure:"Trend unclear"}[profile.wTrend]||null;
              if(!histLabel&&!trendLabel)return null;
              return(
                <div style={{margin:"0 16px 14px",padding:"10px 14px",background:"rgba(245,245,240,0.03)",border:"1px solid rgba(245,245,240,0.08)",borderRadius:12,display:"flex",gap:12,flexWrap:"wrap",animation:"cardIn 0.4s ease-out both"}}>
                  {histLabel&&<span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.45)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{histLabel}</span>}
                  {trendLabel&&<span style={{fontFamily:"var(--mono)",fontSize:8,color:"rgba(245,245,240,0.45)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Trend: {trendLabel}</span>}
                </div>
              );
            })()}
          </>}

          {/* ── RECOVERY ── */}
          {activeTab==="recovery"&&<>
            <div style={{margin:"0 16px 14px"}}>
              <MuscleRecovery userId={user?.id}/>
            </div>

            {/* Muscle Balance */}
            {(()=>{
              const b=latestBalance;
              const noData=!b||(b.push_volume_lbs===0&&b.pull_volume_lbs===0&&b.quad_volume_lbs===0&&b.posterior_volume_lbs===0);
              const ppStatus=b?.push_pull_status||"balanced";
              const qpStatus=b?.quad_posterior_status||"balanced";
              const statusColor=s=>s==="risk"?"var(--accent)":s==="warning"?"#FEA020":"#22c55e";
              const ppTotal=(b?.push_volume_lbs||0)+(b?.pull_volume_lbs||0);
              const qpTotal=(b?.quad_volume_lbs||0)+(b?.posterior_volume_lbs||0);
              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Muscle Balance</div>
                  {noData?(
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:16,color:"rgba(245,245,240,0.35)"}}>
                      COMPLETE MORE SESSIONS TO SEE BALANCE.
                    </div>
                  ):(
                    <>
                      <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>LAST 30 DAYS</div>
                      {/* Push/Pull */}
                      <div style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)"}}>PUSH vs PULL</div>
                          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"#000",background:statusColor(ppStatus),borderRadius:4,padding:"2px 7px",textTransform:"uppercase"}}>{ppStatus}</div>
                        </div>
                        {[["PUSH",b?.push_volume_lbs||0,"var(--accent)"],["PULL",b?.pull_volume_lbs||0,"#60a5fa"]].map(([label,vol,color])=>(
                          <div key={label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.5)",width:30,flexShrink:0}}>{label}</div>
                            <div style={{flex:1,height:4,background:"rgba(245,245,240,0.06)",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${ppTotal>0?Math.round(vol/ppTotal*100):50}%`,background:color,borderRadius:2,transition:"width 0.5s"}}/>
                            </div>
                            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",minWidth:60,textAlign:"right",flexShrink:0}}>{(vol/1000).toFixed(1)}k lbs</div>
                          </div>
                        ))}
                        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.4)",marginTop:4}}>
                          {b?.push_pull_ratio||1}:1 push to pull — {ppStatus}
                        </div>
                      </div>
                      <div style={{height:1,background:"rgba(245,245,240,0.05)",marginBottom:14}}/>
                      {/* Quad/Posterior */}
                      <div style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.5)"}}>QUAD vs POSTERIOR</div>
                          <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"#000",background:statusColor(qpStatus),borderRadius:4,padding:"2px 7px",textTransform:"uppercase"}}>{qpStatus}</div>
                        </div>
                        {[["QUAD",b?.quad_volume_lbs||0,"var(--accent)"],["POST",b?.posterior_volume_lbs||0,"#60a5fa"]].map(([label,vol,color])=>(
                          <div key={label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.5)",width:30,flexShrink:0}}>{label}</div>
                            <div style={{flex:1,height:4,background:"rgba(245,245,240,0.06)",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${qpTotal>0?Math.round(vol/qpTotal*100):50}%`,background:color,borderRadius:2,transition:"width 0.5s"}}/>
                            </div>
                            <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:8,color:"rgba(245,245,240,0.4)",minWidth:60,textAlign:"right",flexShrink:0}}>{(vol/1000).toFixed(1)}k lbs</div>
                          </div>
                        ))}
                        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"rgba(245,245,240,0.4)",marginTop:4}}>
                          {b?.quad_posterior_ratio||1}:1 quad to posterior — {qpStatus}
                        </div>
                      </div>
                      {ppStatus==="balanced"&&qpStatus==="balanced"&&(
                        <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"#22c55e"}}>✓ Muscle balance is good. Keep it up.</div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {(()=>{
              const split=wPrefs?.splitType||'';
              const optimal=split.includes('6')?1:split.includes('4')?3:4;
              const diff=restDaysThisWeek-optimal;
              const c=Math.abs(diff)<=1?"#22c55e":Math.abs(diff)===2?"#FEA020":"var(--accent)";
              return(
                <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// Rest Days This Week</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:28,color:c,lineHeight:1,marginBottom:6}}>{restDaysThisWeek} <span style={{fontSize:14,color:"rgba(245,245,240,0.45)"}}>rest days</span></div>
                  <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:10,color:"rgba(245,245,240,0.45)"}}>Optimal for {split||"your program"}: {optimal} rest day{optimal!==1?"s":""}</div>
                </div>
              );
            })()}

            <div style={{margin:"0 16px 14px",padding:"20px 18px",background:"rgba(245,245,240,0.03)",backgroundImage:"radial-gradient(circle at top, rgba(245,245,240,0.05) 0%, transparent 60%)",boxShadow:"0 2px 8px rgba(0,0,0,0.50), inset 0 0 0 1px rgba(245,245,240,0.08), inset 0 1px 0 0 rgba(245,245,240,0.12)",borderRadius:16,textAlign:"center"}}>
              <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>// Recovery Score</div>
              <RecoveryGauge score={recoveryScore}/>
            </div>

            {healthSnap?.sleep!=null?(
              <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10}}>// Avg Sleep This Week</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:28,color:healthSnap.sleep>=7?"#22c55e":healthSnap.sleep>=6?"#FEA020":"var(--accent)",lineHeight:1,marginBottom:6}}>{Math.floor(healthSnap.sleep)}h {Math.round((healthSnap.sleep%1)*60)}m</div>
                <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:10,color:"rgba(245,245,240,0.45)"}}>Optimal for recovery: 7–9 hours</div>
              </div>
            ):(
              <div style={{margin:"0 16px 14px",padding:"16px 18px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:12}}>
                <div style={{fontFamily:"'DM Mono','SF Mono',monospace",fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8}}>// Sleep Data</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:18,color:"#fff",marginBottom:6}}>CONNECT APPLE HEALTH.</div>
                <div style={{fontSize:13,color:"rgba(245,245,240,0.55)",marginBottom:12}}>Connect Apple Health to track sleep and recovery data automatically.</div>
                <button onClick={()=>setShowHealthModal(true)} style={{background:"none",border:"1px solid rgba(245,245,240,0.2)",borderRadius:8,padding:"8px 14px",color:"rgba(245,245,240,0.65)",fontSize:12,cursor:"pointer",fontFamily:"'DM Mono','SF Mono',monospace",letterSpacing:"0.08em"}}>Connect Apple Health →</button>
              </div>
            )}
          </>}

          {/* ── RUNNING TAB ── */}
          {activeTab==="running"&&(()=>{
            const allRuns=(allActs||[]).filter(a=>(a.type||'').toLowerCase().includes('run')).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
            const recentRuns=allRuns.slice(0,12);
            const hasRace=!!(profile?.run_race_date||wPrefs?.hyroxRaceDate||profile?.hyrox_race_date);
            const mono="'DM Mono','SF Mono',monospace";
            const cond="'Barlow Condensed',sans-serif";

            return(
              <>
                {/* Weekly mileage card */}
                <div style={{margin:"0 16px 14px",padding:"16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:16}}>
                  <div style={{fontFamily:mono,fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14}}>// This Week's Running</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:28,color:"#22c55e",lineHeight:1}}>{runActsThisWeek.length}</div>
                      <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>Runs</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:28,color:"var(--accent)",lineHeight:1}}>{displayDistance(runDistKm,profile?.wUnit||'lbs')}</div>
                      <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>{distanceLabel(profile?.wUnit||'lbs')}</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:28,color:"#60a5fa",lineHeight:1}}>{runTimeMins>=60?`${Math.floor(runTimeMins/60)}h${Math.round(runTimeMins%60)}m`:`${runTimeMins}m`}</div>
                      <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.4)",textTransform:"uppercase",letterSpacing:"0.1em",marginTop:4}}>Time</div>
                    </div>
                  </div>
                </div>

                {/* Recent runs list */}
                {recentRuns.length>0?(
                  <div style={{margin:"0 16px 14px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:16,overflow:"hidden"}}>
                    <div style={{fontFamily:mono,fontSize:9,color:"var(--accent)",letterSpacing:"0.16em",textTransform:"uppercase",padding:"14px 16px 10px"}}>// Recent Runs</div>
                    {recentRuns.map((run,i)=>{
                      const d=new Date((run.date||run.start_date_local||'').split('T')[0]+'T12:00:00');
                      const dateLabel=isNaN(d.getTime())?'—':d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
                      const distKm=parseFloat(run.distanceKm)||0;
                      const distLabel=displayDistance(distKm,profile?.wUnit||'lbs');
                      const dur=parseInt(run.durationMins)||0;
                      const paceSecKm=distKm>0&&dur>0?Math.round(dur*60/distKm):null;
                      const paceStr=paceSecKm?`${Math.floor(paceSecKm/60)}:${String(paceSecKm%60).padStart(2,'0')}/km`:'—';
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderTop:i>0?"1px solid rgba(245,245,240,0.05)":"none"}}>
                          <div style={{width:34,height:34,borderRadius:10,background:"rgba(34,197,94,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>🏃</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontFamily:cond,fontWeight:700,fontSize:14,color:"#f5f5f0",lineHeight:1}}>{run.name||'Run'}</div>
                            <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2}}>{dateLabel}</div>
                          </div>
                          <div style={{textAlign:"right",flexShrink:0}}>
                            <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:700,fontSize:14,color:"#22c55e"}}>{distLabel}</div>
                            <div style={{fontFamily:mono,fontSize:8,color:"rgba(245,245,240,0.4)",marginTop:2}}>{paceStr}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ):(
                  <div style={{margin:"0 16px 14px",padding:"20px 16px",background:"#0d0d0d",border:"1px solid rgba(var(--accent-rgb),0.08)",borderRadius:16}}>
                    <div style={{fontFamily:cond,fontStyle:"italic",fontWeight:900,fontSize:20,color:"#f5f5f0",textTransform:"uppercase",marginBottom:8}}>NO RUNS YET.</div>
                    <div style={{fontSize:13,color:"rgba(245,245,240,0.5)",lineHeight:1.5}}>Log a run from the Train tab or sync Strava to see your running stats here.</div>
                  </div>
                )}
              </>
            );
          })()}

          <div style={{height:24}}/>
        </div>
      </div>
    );
  }


  return (
    <div className={GOCLUB_REDESIGN ? `goclub tab-${section}` : undefined} style={{position:"relative",minHeight:"100vh",maxWidth:480,margin:"0 auto",background:"var(--navy)"}}>
      {GOCLUB_REDESIGN && (<>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap" />
      </>)}
      <style>{GLOBAL_CSS}{GOCLUB_REDESIGN ? REDESIGN_CSS : ""}</style>
      {GOCLUB_REDESIGN && SHOW_DEBUG && (
        <div style={{position:"fixed",top:52,right:8,zIndex:99999,background:"rgba(0,0,0,0.88)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,padding:"8px 10px",fontSize:10,fontFamily:"monospace",color:"#4ade80",lineHeight:1.7,pointerEvents:"none",maxWidth:230,backdropFilter:"blur(6px)"}}>
          <div>🏷 GOCLUB_REDESIGN: <b style={{color:"#f87171"}}>{String(GOCLUB_REDESIGN)}</b></div>
          <div>📍 section: <b style={{color:"#fff"}}>{section}</b></div>
          <div>🎨 rootClass: <b style={{color:"#60a5fa"}}>goclub tab-{section}</b></div>
          <div>📋 hasPlan: <b style={{color:"#fff"}}>{String(!!profile.goalCals)}</b></div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",marginTop:4,paddingTop:4}}>
            🔤 cascade: <b style={{color:"#fbbf24"}}>{_dbgFont}</b>
            <br/>📥 file: <b style={{color:"#a78bfa"}}>{_dbgFontLoaded}</b>
          </div>
        </div>
      )}
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
      {showWeeklyReviewModal&&(
        <WeeklyReviewModal
          userId={user?.id}
          profile={profile}
          macros={macros}
          workoutLogsRaw={workoutLogsRaw}
          twStart={(()=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-d.getDay());return d.toISOString().split('T')[0];})()}
          onClose={()=>setShowWeeklyReviewModal(false)}
          onApply={(newCals)=>{showToast(`Calorie target updated to ${newCals} kcal`,'success');}}
        />
      )}
      {showConnectionsView&&(
        <ConnectionsView
          userId={user?.id}
          onClose={()=>setShowConnectionsView(false)}
          healthSnap={healthSnap}
          workoutLogsRaw={workoutLogsRaw}
          bodyweightLogs={bodyweightLogs}
          consumed={consumed}
          memberDays={profile?.created_at?Math.floor((Date.now()-new Date(profile.created_at).getTime())/864e5):0}
        />
      )}
      {showPeerView&&(
        <PeerInsightsView
          userId={user?.id}
          profile={profile}
          onClose={()=>setShowPeerView(false)}
        />
      )}
      {!isOnline&&<div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,background:"rgba(254,160,32,0.12)",borderBottom:"1px solid rgba(254,160,32,0.2)",padding:"max(env(safe-area-inset-top),8px) 16px 8px",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#FEA020" strokeWidth="1.5"/><path d="M7 4v3M7 9.5v.5" stroke="#FEA020" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"#FEA020",letterSpacing:"0.1em"}}>NO INTERNET CONNECTION — DATA MAY BE OUTDATED</span>
      </div>}
      <div ref={appScreenRef} className="app-screen grid-bg" onTouchStart={onPullStart} onTouchEnd={onPullEnd} style={{paddingTop:!isOnline?"48px":undefined,pointerEvents:(showAppTour||showFeatureTour)?"none":undefined}}>
        {isRefreshing&&<div style={{position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"center",paddingTop:4,pointerEvents:"none"}}><div style={{background:"rgba(var(--accent-rgb),0.15)",border:"1px solid rgba(var(--accent-rgb),0.3)",borderRadius:20,padding:"4px 14px",fontSize:12,color:"rgba(245,245,240,0.6)",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:"0.08em",textTransform:"uppercase"}}>Refreshing…</div></div>}
        {section==="today"&&<ErrorBoundary>{GOCLUB_REDESIGN?<HomeSectionGoClub/>:<HomeSection/>}</ErrorBoundary>}
        {section==="train"&&<ErrorBoundary><TrainSection profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} trainScreen={trainScreen} setTrainScreen={(s)=>{setTrainScreen(s);setActiveSessionOpen(s==="active");}} activeSessionOpen={activeSessionOpen} workout={workout} workoutLoading={workoutLoading} generateWorkout={generateWorkout} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} restActive={restActive} restTimer={restTimer} logSet={logSet} finishWorkout={finishWorkout} getSuggestion={getSuggestion} history={history} planMode={planMode} setPlanMode={setPlanMode} runPlan={runPlan} setRunPlan={setRunPlan} hybridMix={hybridMix} setHybridMix={setHybridMix} startStructured={startStructured} todayKey={todayKey} todayType={todayType} todayFocus={todayFocus} cfg={cfg} isMobile={isMobile} user={user} lastLoggedSet={lastLoggedSet} setFlash={setFlash} skipRest={skipRest} adjustRest={adjustRest} workoutSummary={workoutSummary} completedWorkout={completedWorkout} clearWorkoutSummary={clearWorkoutSummary} workoutStartTime={workoutStartTime} sessionCount={workoutLogsRaw.length} sessionPrediction={sessionPrediction} onLogPain={handleLogPain} acwrHighRisks={acwrHighRisks} deloadActive={deloadActive} activePlateaus={activePlateaus} balanceCorrections={balanceCorrections} programCurrentWeek={programCurrentWeek} recentAdjustments={recentAdjustments} fatigueAlert={fatigueAlert} macros={macros} todayProtocol={todayProtocol} showLocalRest={showLocalRest} localRestSecs={localRestSecs} onStartLocalRest={(secs)=>{setLocalRestSecs(secs||90);setShowLocalRest(true);}} onSkipLocalRest={()=>{setShowLocalRest(false);setLocalRestSecs(90);}} onReduceLocalRest={()=>setLocalRestSecs(s=>Math.max(0,s-30))}/></ErrorBoundary>}
        {section==="fuel"&&<ErrorBoundary><FuelSection log={log} setLog={setLog} macros={macros} consumed={consumed} remaining={remaining} cfg={cfg} todayType={todayType} todayFocus={todayFocus} earnedCals={earnedCals} todayActs={todayActs} fuelScreen={fuelScreen} setFuelScreen={setFuelScreen} foodInput={foodInput} setFoodInput={setFoodInput} logging={logging} logMsg={logMsg} aiLog={aiLog} logMode={logMode} setLogMode={setLogMode} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} barcodeResult={barcodeResult} barcodeLoading={barcodeLoading} scanBarcode={scanBarcode} addBarcode={addBarcode} quickFields={quickFields} setQF={setQF} addQuick={addQuick} removeLog={removeLog} recs={recs} recsLoading={recsLoading} fetchRecs={fetchRecs} recipes={recipes} recipesLoading={recipesLoading} fetchRecipes={fetchRecipes} fastProto={fastProto} setFastProto={setFastProto} fastActive={fastActive} setFastActive={setFastActive} fastStart={fastStart} setFastStart={setFastStart} fastCustomH={fastCustomH} setFastCustomH={setFastCustomH} fastHours={fastHours} city={city} setCity={setCity} isMobile={isMobile} user={user} wPrefs={wPrefs} setWPrefs={setWPrefs} schedule={schedule} setSchedule={setSchedule} todayKey={todayKey} periodizationInfo={wPrefs.nutritionPeriodization?periodizationInfo:null} logEntry={logEntry} profile={profile} dayNutrition={dayNutrition} weekMacros={weekMacros} waterTarget={waterTarget} waterLogs={waterLogs} onAddWater={handleAddWater} onDeleteWater={handleDeleteWater} logDate={logDate} setLogDate={setLogDate} metabolicProtocol={metabolicAdaptation?.status==="active"?{progress:getProtocolProgress(metabolicAdaptation),onComplete:handleCompleteAdaptation}:null} onOpenPhotoLogger={()=>setShowPhotoLogger(true)} skippedSlots={skippedSlots} onSkipSlots={saveSkippedSlots} slotOverages={slotOverages} onSlotOverage={saveSlotOverages} resetSignal={fuelResetSignal} todayProtocol={todayProtocol}/></ErrorBoundary>}
        {showPhotoLogger&&<PhotoFoodLogger user={user} profile={profile} onLog={handlePhotoLog} onClose={()=>setShowPhotoLogger(false)} log={log}/>}
        {section==="progress"&&<ErrorBoundary><ProgressSection/></ErrorBoundary>}
        {section==="me"&&<ErrorBoundary><><CommunicationStyleSection userId={user?.id}/><YourPatternsCard userId={user?.id}/><SettingsSection profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} todayKey={todayKey} isMobile={isMobile} onSignOut={onSignOut} user={user} onPreviewBrief={previewMorningBrief} calendarConnected={calendarConnected} onCalendarConnect={handleConnectCalendar} onCalendarDisconnect={handleDisconnectCalendar} onLogInjury={()=>setShowPainLogModal(true)}/></></ErrorBoundary>}
      </div>

      {pendingMilestone&&ReactDOM.createPortal(
        <>
          <style>{`@keyframes cm-milestone-slide{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          {/* Transparent overlay — tap anywhere to dismiss */}
          <div onClick={()=>setPendingMilestone(null)} style={{position:'fixed',inset:0,background:'transparent',zIndex:10005}}/>
          {/* Bottom sheet card */}
          <div onClick={e=>e.stopPropagation()} style={{position:'fixed',bottom:0,left:0,right:0,background:'#0d0d0d',borderRadius:'24px 24px 0 0',borderTop:'2px solid var(--accent)',padding:'28px 24px 48px',zIndex:10006,animation:'cm-milestone-slide 0.35s cubic-bezier(.2,.9,.3,1) both'}}>
            {/* Top row */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{background:'rgba(var(--accent-rgb),0.1)',border:'1px solid rgba(var(--accent-rgb),0.25)',borderRadius:20,padding:'4px 12px',fontFamily:"'DM Mono',monospace",fontSize:9,color:'var(--accent)',letterSpacing:'0.16em',textTransform:'uppercase'}}>// MILESTONE</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:'rgba(245,245,240,0.2)',letterSpacing:'0.1em'}}>TAP ANYWHERE TO CONTINUE</div>
            </div>
            {/* Main row */}
            <div style={{display:'flex',alignItems:'center',gap:20,marginBottom:16}}>
              {/* Red ring with threshold number */}
              <div style={{width:72,height:72,flexShrink:0,position:'relative'}}>
                <svg viewBox="0 0 72 72" width="72" height="72" style={{position:'absolute',top:0,left:0}}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(var(--accent-rgb),0.08)" strokeWidth="4"/>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" strokeDasharray="188" strokeDashoffset="47" transform="rotate(-90 36 36)"/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:28,color:'#f5f5f0',lineHeight:1}}>
                  {pendingMilestone.threshold>=1000?`${pendingMilestone.threshold/1000}k`:pendingMilestone.threshold}
                </div>
              </div>
              {/* Title + sub */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:'italic',fontWeight:900,fontSize:32,color:'#f5f5f0',textTransform:'uppercase',lineHeight:0.9,marginBottom:6}}>
                  {pendingMilestone.title.replace(/\.$/, '')}<span style={{color:'var(--accent)'}}>.</span>
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,color:'rgba(245,245,240,0.45)',lineHeight:1.3}}>{pendingMilestone.sub}</div>
              </div>
            </div>
            {/* Buttons */}
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <button onClick={()=>setPendingMilestone(null)} style={{flex:2,background:'var(--accent)',border:'none',borderRadius:12,padding:14,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,color:'#fff',letterSpacing:'0.16em',textTransform:'uppercase',cursor:'pointer'}}>KEEP GOING</button>
              <button onClick={()=>{try{navigator.clipboard.writeText(pendingMilestone.title);}catch{}}} style={{flex:1,background:'transparent',border:'1px solid rgba(245,245,240,0.1)',borderRadius:12,padding:14,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,color:'rgba(245,245,240,0.4)',letterSpacing:'0.14em',textTransform:'uppercase',cursor:'pointer'}}>SHARE</button>
            </div>
          </div>
        </>,
        document.body
      )}

      {showLocalRest&&ReactDOM.createPortal(
        <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:10002,background:"#0d0d0d",borderTop:"2px solid var(--accent)",borderRadius:"20px 20px 0 0",padding:"24px 20px",paddingBottom:"max(env(safe-area-inset-bottom),40px)"}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--accent)",letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:8,textAlign:"center"}}>// REST</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:72,color:"#f5f5f0",textAlign:"center",lineHeight:1,marginBottom:16}}>
            {Math.floor(localRestSecs/60)}:{(localRestSecs%60).toString().padStart(2,'0')}
          </div>
          <div style={{height:3,background:"rgba(245,245,240,0.1)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
            <div style={{height:"100%",background:"var(--accent)",borderRadius:2,width:Math.max(0,Math.min(100,(localRestSecs/90)*100))+'%',transition:"width 1s linear"}}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setLocalRestSecs(s=>Math.max(0,s-30))} style={{flex:1,background:"transparent",border:"1px solid rgba(245,245,240,0.15)",borderRadius:12,padding:13,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,color:"rgba(245,245,240,0.5)",letterSpacing:"0.14em",cursor:"pointer"}}>−30s</button>
            <button onClick={()=>{setShowLocalRest(false);setLocalRestSecs(90);}} style={{flex:2,background:"var(--accent)",border:"none",borderRadius:12,padding:13,fontFamily:"'DM Mono',monospace",fontWeight:700,fontSize:11,color:"#fff",letterSpacing:"0.16em",textTransform:"uppercase",cursor:"pointer"}}>SKIP REST →</button>
          </div>
        </div>,
        document.body
      )}

      <div className="app-tab-bar">
        {activeNav.map(item=>(
          <button key={item.id} aria-label={item.label} aria-current={section===item.id?"page":undefined} className={`app-tab${section===item.id?" active":""}${item.emphasized?" app-tab--plan":""}`} onClick={()=>handleTabPress(item.id)} {...(item.tour?{"data-tour":item.tour}:{})}>
            <div className="tab-icon-wrap" style={{position:"relative"}}>
              <TabIcon name={item.icon} size={22}/>
              {item.id==="train"&&deloadActive&&<span style={{position:"absolute",top:-3,right:-4,width:8,height:8,borderRadius:"50%",background:T.fat,border:"2px solid var(--navy)"}}/>}
              {item.id==="train"&&!deloadActive&&topRiskLevel&&<span style={{position:"absolute",top:-3,right:-4,width:8,height:8,borderRadius:"50%",background:topRiskLevel==="high"?"#EF4444":topRiskLevel==="moderate"?"#F97316":T.fat,border:"2px solid var(--navy)"}}/>}
            </div>
            <div className="tab-label-txt">{item.label}</div>
          </button>
        ))}
      </div>

      {/* App tour — fires once after onboarding */}
      {showAppTour&&(
        <SpotlightTour
          steps={APP_TOUR_STEPS}
          onComplete={()=>{setShowAppTour(false);markAppTourComplete(user?.id).catch(()=>{});}}
          onSkip={()=>{setShowAppTour(false);markAppTourComplete(user?.id).catch(()=>{});}}
        />
      )}

      {/* Feature-specific mini tours */}
      {showFeatureTour&&(
        <SpotlightTour
          steps={featureTourSteps}
          onComplete={()=>setShowFeatureTour(false)}
          onSkip={()=>setShowFeatureTour(false)}
        />
      )}

      {/* Win Screen — fullscreen celebration */}
      {showWinScreen&&!showWinScreen._afterSummary&&(
        <WinScreen
          win={showWinScreen}
          onContinue={()=>{setShowWinScreen(null);setSection("today");}}
        />
      )}
    </div>
  );
}
