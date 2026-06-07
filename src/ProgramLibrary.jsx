import React, { useState, useEffect, useCallback } from "react";
import { T, getDayMacros, Spinner } from "./components.jsx";
import { sb } from "./client.js";
import { PROGRAM_LIBRARY } from "./programs.js";
import { getProgramImage } from "./data/programImages.js";
import { MUSCLE_GROUP_POOL } from "./exercise_database.js";
import { showToast } from "./utils/toast.js";
import RunProgramSetup from "./RunProgramSetup.jsx";

const SETUP_CATEGORIES = new Set(["Running", "Hyrox", "Hybrid"]);

// ─── PROGRAM ENRICHMENT ────────────────────────────────────────────────────────
const PROG_META = {
  ppl_6:        { emoji:"🏋️", eq:"Full gym — barbell + cables", who:"Intermediate lifters ready to push volume", schedule:["Push","Pull","Legs","Push","Pull","Legs","Rest"], sample:[{n:"Barbell Bench Press",s:4,r:"8-10"},{n:"Incline DB Press",s:3,r:"10-12"},{n:"Cable Fly",s:3,r:"12-15"},{n:"Tricep Pushdown",s:3,r:"12-15"},{n:"Lateral Raise",s:4,r:"15-20"}], nuNote:"High volume → increase carbs on training days. Aim 180g+ protein." },
  arnold:       { emoji:"💪", eq:"Full gym — barbell + cables + machines", who:"Advanced lifters seeking maximum hypertrophy volume", schedule:["Chest+Back","Shoulders+Arms","Legs","Chest+Back","Shoulders+Arms","Legs","Rest"], sample:[{n:"Barbell Bench Press",s:4,r:"8-10"},{n:"Weighted Pull Up",s:4,r:"6-8"},{n:"Dumbbell Fly",s:3,r:"12-15"},{n:"T-Bar Row",s:4,r:"10-12"},{n:"Cable Row",s:3,r:"12-15"}], nuNote:"Extreme volume — add 200-300 extra calories on heavy days. Protein 1g/lb bodyweight." },
  upper_lower:  { emoji:"⚖️", eq:"Barbell or dumbbells", who:"Beginners wanting science-backed frequency for each muscle", schedule:["Upper","Lower","Rest","Upper","Lower","Rest","Rest"], sample:[{n:"Barbell Row",s:3,r:"8-10"},{n:"Barbell Bench Press",s:3,r:"8-10"},{n:"Overhead Press",s:3,r:"8-10"},{n:"Lat Pulldown",s:3,r:"10-12"},{n:"Dumbbell Curl",s:2,r:"12-15"}], nuNote:"Balanced approach. Match calories to training vs rest days." },
  bro_split:    { emoji:"🔥", eq:"Full gym preferred, dumbbells workable", who:"Lifters wanting maximum focus and pump per muscle group", schedule:["Chest","Back","Shoulders","Arms","Legs","Rest","Rest"], sample:[{n:"Barbell Bench Press",s:5,r:"5-8"},{n:"Incline DB Press",s:4,r:"8-10"},{n:"Cable Fly",s:3,r:"12-15"},{n:"Chest Dip",s:3,r:"10-12"},{n:"Push Up",s:2,r:"15-20"}], nuNote:"1 muscle group/day allows heavy loading. Keep calories in slight surplus for gains." },
  full_body:    { emoji:"🌀", eq:"Dumbbells or full gym", who:"Beginners, time-constrained, and those returning from a break", schedule:["Full Body A","Rest","Full Body B","Rest","Full Body A","Rest","Rest"], sample:[{n:"Goblet Squat",s:3,r:"10-12"},{n:"Barbell Row",s:3,r:"8-10"},{n:"Overhead Press",s:3,r:"8-10"},{n:"Romanian Deadlift",s:3,r:"10-12"},{n:"Plank",s:3,r:"30-45s"}], nuNote:"3 sessions/week — flexible nutrition. Focus on hitting protein daily." },
  powerbuilding:{ emoji:"⚡", eq:"Barbell required", who:"Lifters wanting to get both bigger and stronger", schedule:["Upper Strength","Lower Strength","Upper Hypertrophy","Lower Hypertrophy","Rest","Rest","Rest"], sample:[{n:"Barbell Bench Press",s:5,r:"5"},{n:"Barbell Row",s:5,r:"5"},{n:"Overhead Press",s:3,r:"5"},{n:"Lat Pulldown",s:3,r:"8-10"},{n:"Incline DB Press",s:3,r:"10-12"}], nuNote:"Strength days → eat more. Hypertrophy days → normal intake. Keep protein at 1g/lb." },
  "5_3_1":      { emoji:"🎯", eq:"Barbell required", who:"Intermediates focused on long-term strength progression", schedule:["Press","Deadlift","Bench","Squat","Rest","Rest","Rest"], sample:[{n:"Overhead Press",s:3,r:"5/3/1"},{n:"Barbell Row",s:5,r:"5"},{n:"Lateral Raise",s:3,r:"15-20"},{n:"Cable Curl",s:3,r:"15-20"},{n:"Tricep Pushdown",s:3,r:"15-20"}], nuNote:"Moderate volume — maintenance calories with high protein work well." },
  sl5x5:        { emoji:"🏆", eq:"Barbell + squat rack", who:"Pure beginners — the fastest strength foundation", schedule:["Workout A","Rest","Workout B","Rest","Workout A","Rest","Rest"], sample:[{n:"Barbell Squat",s:5,r:"5"},{n:"Barbell Bench Press",s:5,r:"5"},{n:"Barbell Row",s:5,r:"5"},{n:"Overhead Press",s:5,r:"5"},{n:"Deadlift",s:1,r:"5"}], nuNote:"Eat in a slight surplus. Add ~200 calories on lifting days to fuel rapid progression." },
  circuit:      { emoji:"🔄", eq:"Dumbbells or bodyweight", who:"Fat loss athletes wanting to keep muscle while cutting", schedule:["Circuit","Rest","Circuit","Rest","Circuit","Rest","Rest"], sample:[{n:"Goblet Squat",s:3,r:"15"},{n:"Push Up",s:3,r:"15"},{n:"Dumbbell Row",s:3,r:"15"},{n:"Plank",s:3,r:"30s"},{n:"Mountain Climber",s:3,r:"30s"}], nuNote:"Keep calories at target. Circuit training burns 300-500 cal/session." },
  hiit:         { emoji:"💥", eq:"Minimal — bodyweight works", who:"Athletes wanting maximum calorie burn in shortest time", schedule:["HIIT","Rest","HIIT","Rest","HIIT","Rest","Rest"], sample:[{n:"Burpee",s:4,r:"10"},{n:"Mountain Climber",s:4,r:"30s"},{n:"Jump Squat",s:4,r:"12"},{n:"Push Up",s:4,r:"12"},{n:"High Knees",s:4,r:"30s"}], nuNote:"HIIT raises metabolic rate for 24 hrs. Don't restrict calories too hard — refuel within 30 min." },
  metabolic:    { emoji:"🌡️", eq:"Dumbbells + cables or machines", who:"Intermediate athletes wanting strength + cardio hybrid", schedule:["Metabolic Upper","Metabolic Lower","Cardio","Metabolic Full","Rest","Cardio","Rest"], sample:[{n:"Dumbbell Row",s:4,r:"12"},{n:"Dumbbell Press",s:4,r:"12"},{n:"Goblet Squat",s:4,r:"12"},{n:"Lateral Raise",s:3,r:"15"},{n:"Plank",s:3,r:"45s"}], nuNote:"Higher frequency means more calories needed. Don't under-eat — muscle loss risk is high." },
  c25k:         { emoji:"🏃", eq:"Running shoes", who:"Complete beginners — never run before or returning after years off", schedule:["Run/Walk","Rest","Run/Walk","Rest","Run/Walk","Rest","Rest"], sample:[{n:"5min Walk",s:1,r:""},{n:"8×(60s run + 90s walk)",s:1,r:""},{n:"5min Walk cooldown",s:1,r:""}], nuNote:"Beginner running burns ~300 cal/session. Focus on carbs pre-run for energy." },
  "5k_sub25":   { emoji:"⏱️", eq:"Running shoes", who:"Runners with 5K base wanting to break 25 minutes", schedule:["Easy Run","Tempo","Rest","Intervals","Rest","Long Run","Rest"], sample:[{n:"Tempo Run 30min",s:1,r:""},{n:"800m × 4 @race pace",s:1,r:""},{n:"Rest 90s between reps",s:1,r:""}], nuNote:"Speed work demands carbs. Eat 30g carbs 1hr before speed sessions." },
  "10k":        { emoji:"🎽", eq:"Running shoes", who:"5K runners ready to double their distance", schedule:["Easy Run","Progression Run","Rest","Intervals","Rest","Long Run","Rest"], sample:[{n:"Easy 5km",s:1,r:""},{n:"3×1km @threshold pace",s:1,r:""},{n:"Long Run 8-10km",s:1,r:""}], nuNote:"Glycogen depletion risk on long runs. Carb load night before long run. Protein helps recovery." },
  half:         { emoji:"🥇", eq:"Running shoes + GPS watch", who:"10K runners aiming for first half marathon or sub-2 hour", schedule:["Easy","Medium Long","Tempo","Rest","Easy","Long Run","Rest"], sample:[{n:"Easy 6km",s:1,r:""},{n:"Tempo 5km @LT pace",s:1,r:""},{n:"Long Run 16-20km",s:1,r:""}], nuNote:"Long runs 16km+ need carb fueling during the run. Add 200-300 cal on long run days." },
  hyrox_12w:   { emoji:"🔥", eq:"Full gym + SkiErg + sled + sandbag", who:"Athletes prepping for first Hyrox or improving race time", schedule:["Stations A","Run","Strength","Stations B","Rest","Full Race Sim","Rest"], sample:[{n:"1km Run",s:1,r:""},{n:"Sled Push 50m",s:4,r:""},{n:"SkiErg 1km",s:3,r:""},{n:"Burpee Broad Jump 80m",s:3,r:""},{n:"Wall Ball 75 reps",s:3,r:""}], nuNote:"Hyrox burns 800-1200 cal per session. Increase carbs significantly on race simulation days." },
  strength_run: { emoji:"⚡", eq:"Full gym + running shoes", who:"Lifters adding aerobic capacity without losing muscle", schedule:["Lift","Easy Run","Lift","Rest","Lift","Long Run","Rest"], sample:[{n:"Barbell Squat",s:4,r:"6-8"},{n:"Barbell Row",s:4,r:"6-8"},{n:"Easy Run 5km",s:1,r:""},{n:"Romanian Deadlift",s:3,r:"8-10"},{n:"Core Work",s:3,r:""}], nuNote:"Hybrid demands: extra 200 cal on combined lift+run days. Protein 0.9-1g/lb." },
  upper_lower_run:{ emoji:"🏅", eq:"Full gym + running shoes", who:"Runners adding muscle to improve speed and reduce injury risk", schedule:["Easy Run","Upper","Tempo","Rest","Lower","Long Run","Rest"], sample:[{n:"Pull Up",s:4,r:"6-8"},{n:"Overhead Press",s:3,r:"8-10"},{n:"Barbell Squat",s:4,r:"8-10"},{n:"Hip Thrust",s:3,r:"12-15"},{n:"Tempo Run 5km",s:1,r:""}], nuNote:"6 sessions/week is high load. Ensure calories support both goals — don't under-eat." },
  balanced_hybrid:{ emoji:"⚖️", eq:"Full gym + running shoes", who:"Athletes wanting equal strength and endurance gains", schedule:["Push+Pull","Easy","Legs","Rest","Upper","Long","Rest"], sample:[{n:"Barbell Row",s:4,r:"8-10"},{n:"Barbell Bench",s:4,r:"8-10"},{n:"Easy Run 5km",s:1,r:""},{n:"Barbell Squat",s:4,r:"8-10"},{n:"Long Run 10km",s:1,r:""}], nuNote:"Keep calories slightly above maintenance. Protein supports muscle, carbs fuel running." },
  ppl_hyrox:    { emoji:"🏆", eq:"Full gym + Hyrox-specific equipment", who:"Strength athletes preparing for a Hyrox race", schedule:["Push","Pull","Stations","Legs","Rest","Race Sim","Rest"], sample:[{n:"Barbell Bench Press",s:4,r:"6-8"},{n:"Sled Push 50m",s:5,r:""},{n:"SkiErg 500m",s:4,r:""},{n:"Barbell Squat",s:4,r:"6-8"},{n:"Wall Ball 30 reps",s:5,r:""}], nuNote:"Highest calorie demand of any program. Eat 300-500 above maintenance. Carb cycle around race sim days." },
  glute_3:      { emoji:"🍑", eq:"Barbell/dumbbells + hip thrust bench", who:"Athletes wanting to develop glutes with 3 focused sessions", schedule:["Glute A","Rest","Glute B","Rest","Glute C","Rest","Rest"], sample:[{n:"Barbell Hip Thrust",s:4,r:"8-12"},{n:"Romanian Deadlift",s:3,r:"10-12"},{n:"Cable Kickback",s:3,r:"15-20"},{n:"Bulgarian Split Squat",s:3,r:"10-12"},{n:"Abduction Machine",s:3,r:"20-25"}], nuNote:"Glute growth requires a slight caloric surplus. Protein supports hypertrophy." },
  glute_4:      { emoji:"🍑", eq:"Barbell/dumbbells + cables + hip thrust bench", who:"Serious glute recomposition — lower body priority", schedule:["Heavy Glute","Upper","Glute Volume","Lower Vol","Rest","Rest","Rest"], sample:[{n:"Barbell Hip Thrust",s:5,r:"5-8"},{n:"Barbell Romanian Deadlift",s:4,r:"8-10"},{n:"Walking Lunge",s:3,r:"12/side"},{n:"Cable Kickback",s:4,r:"15-20"},{n:"Clamshell",s:3,r:"20-25"}], nuNote:"4 lower-body sessions → fuel with carbs. Avoid excessive restriction for optimal muscle growth." },
  lower_5:      { emoji:"🔥", eq:"Full gym required", who:"Advanced lower body athletes — maximum volume and frequency", schedule:["Quad Focus","Hamstring Focus","Glute Focus","Rest","Lower Volume","Rest","Rest"], sample:[{n:"Barbell Squat",s:5,r:"5-8"},{n:"Leg Press",s:4,r:"10-12"},{n:"Leg Extension",s:4,r:"15-20"},{n:"Hip Thrust",s:5,r:"8-10"},{n:"Nordic Curl",s:3,r:"6-8"}], nuNote:"5 lower body days is extreme. Carbs are critical — 200g+ daily for fuel and recovery." },
};

const CATEGORY_EMOJI = {
  "Hypertrophy":"🏋️","Strength":"⚡","Fat Loss & Conditioning":"🔥",
  "Running":"🏃","Hyrox":"🔥","Hybrid":"⚡","Glute Focus":"🍑",
};

const CATEGORY_FILTER_MAP = {
  "All": null,
  "Strength": ["Hypertrophy","Strength"],
  "Running": ["Running"],
  "Hyrox": ["Hyrox"],
  "Hybrid": ["Hybrid"],
  "Glute": ["Glute Focus"],
  "Fat Loss": ["Fat Loss & Conditioning"],
};

// ─── NUTRITION RECALCULATION ──────────────────────────────────────────────────
export function recalculateNutritionForProgram(profile, prog) {
  const base = profile?.goalCals || 2000;
  const goal = profile?.goal || "Maintain";
  const days = prog?.days || 4;

  let calAdj = (days - 4) * 30; // ±30 cal per day above/below 4-day baseline
  if (prog?.isRun)    calAdj += 120;
  if (prog?.isHyrox)  calAdj += 200;
  if (prog?.isHybrid) calAdj += 80;

  const newCals = Math.max(1200, base + calAdj);
  return {
    goalCals: newCals,
    delta: calAdj,
    trainingDay: getDayMacros(newCals, goal, "training"),
    restDay:     getDayMacros(newCals, goal, "rest"),
    daysPerWeek: days,
  };
}

// ─── FUEL AWARENESS MODAL ─────────────────────────────────────────────────────
function FuelAwarenessModal({ prog, profile, onConfirm, onCancel, switching }) {
  const calc = recalculateNutritionForProgram(profile, prog);
  const cur  = getDayMacros(profile?.goalCals || 2000, profile?.goal || "Maintain", "training");
  const delta = calc.delta;
  const days  = prog?.days || 4;
  const wk1   = Array.from({ length: 7 }, (_, i) => {
    const isTraining = i < days;
    const m = getDayMacros(calc.goalCals, profile?.goal || "Maintain", isTraining ? "training" : "rest");
    return { day: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], cals: m.calories, isTraining };
  });

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(6,13,26,.88)", backdropFilter:"blur(6px)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={() => !switching && onCancel()}>
      <div style={{ background:"#0A1222", border:"1px solid rgba(255,255,255,.1)", borderRadius:"16px 16px 0 0", padding:"28px 20px 40px", maxWidth:480, width:"100%", maxHeight:"85vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>

        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,.15)", margin:"0 auto 20px" }}/>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, letterSpacing:".02em", marginBottom:4 }}>Review Nutrition Plan</div>
        <div style={{ fontSize:13, color:T.mu, marginBottom:20 }}>Starting <strong style={{ color:"#fff" }}>{prog?.name}</strong> — here's how your daily targets change.</div>

        {/* Macro comparison */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {[
            { label:"Current Training Day", m:cur, accent:"rgba(255,255,255,.3)" },
            { label:"New Training Day", m:calc.trainingDay, accent:delta>0?"#34D399":delta<0?"#F87171":"#2979FF" },
          ].map(({ label, m, accent }) => (
            <div key={label} style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${accent}30`, borderRadius:12, padding:"14px 12px" }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:".1em", color:accent, textTransform:"uppercase", marginBottom:10 }}>{label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 }}>{m.calories}<span style={{ fontSize:11, color:T.mu, marginLeft:3 }}>kcal</span></div>
              <div style={{ fontSize:11, color:T.mu }}>P {m.protein}g · C {m.carbs}g · F {m.fat}g</div>
            </div>
          ))}
        </div>

        {/* Delta banner */}
        {delta !== 0 && (
          <div style={{ background:delta>0?"rgba(52,211,153,.06)":"rgba(248,113,113,.06)", border:`1px solid ${delta>0?"rgba(52,211,153,.2)":"rgba(248,113,113,.2)"}`, borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:12, color:delta>0?"#34D399":"#F87171", display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:16 }}>{delta > 0 ? "📈" : "📉"}</span>
            <span>{Math.abs(delta)} {delta > 0 ? "more" : "fewer"} calories/day vs current program. This reflects {prog?.days || 4} training days/week{prog?.isRun?" + running fuel requirements":prog?.isHyrox?" + Hyrox race simulation demands":prog?.isHybrid?" + hybrid volume":""} .</span>
          </div>
        )}

        {/* Week 1 preview */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", color:T.dim, marginBottom:10 }}>Week 1 Preview</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {wk1.map(d => (
              <div key={d.day} style={{ flex:"1 1 calc(14% - 5px)", minWidth:38, background:d.isTraining?"rgba(41,121,255,.08)":"rgba(255,255,255,.03)", border:`1px solid ${d.isTraining?"rgba(41,121,255,.25)":"rgba(255,255,255,.07)"}`, borderRadius:8, padding:"8px 4px", textAlign:"center" }}>
                <div style={{ fontSize:9, fontWeight:700, color:d.isTraining?"#2979FF":T.mu, letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>{d.day}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{d.cals}</div>
                <div style={{ fontSize:8, color:T.mu }}>kcal</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mesocycle warning */}
        <div style={{ background:"rgba(251,191,36,.06)", border:"1px solid rgba(251,191,36,.2)", borderRadius:10, padding:"10px 14px", marginBottom:24, fontSize:12, color:"#FBbF24", display:"flex", gap:8, alignItems:"flex-start" }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,marginTop:1}}>
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Switching resets your mesocycle to Week 1. Your workout history and PRs are kept.</span>
        </div>

        <button disabled={switching} onClick={onConfirm} style={{ width:"100%", padding:15, background:"#2979FF", color:"#fff", fontWeight:700, fontSize:15, border:"none", borderRadius:12, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
          {switching ? "Switching…" : "Confirm & Start →"}
        </button>
        <button disabled={switching} onClick={onCancel} style={{ width:"100%", padding:13, background:"transparent", color:T.mu, border:`1px solid ${T.bd}`, borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── PROGRAM DETAIL MODAL ─────────────────────────────────────────────────────
function ProgramDetailModal({ prog, profile, ratings, userRating, onStart, onRate, onClose }) {
  const meta = PROG_META[prog.id] || {};
  const r = ratings[prog.id] || { avg: 0, count: 0 };
  const lvlColor = prog.level === "Beginner" ? "#34D399" : prog.level === "Advanced" ? "#F87171" : "#FBbF24";

  function StarRow({ value, onChange, size = 24 }) {
    return (
      <div style={{ display:"flex", gap:4 }}>
        {[1,2,3,4,5].map(n => (
          <span key={n} onClick={() => onChange?.(n)} style={{ fontSize:size, cursor:onChange?"pointer":"default", color:n <= value ? "#FBbF24" : "rgba(255,255,255,.15)", transition:"color .1s" }}>★</span>
        ))}
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#060D1A", zIndex:400, display:"flex", flexDirection:"column", overflowY:"auto" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", flexShrink:0, position:"sticky", top:0, background:"#060D1A", zIndex:2 }}>
        <button onClick={onClose} style={{ background:"none", border:"none", color:T.mu, cursor:"pointer", fontSize:13, fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>← Back</button>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, letterSpacing:".04em" }}>{prog.name}</div>
        <div style={{ width:60 }} />
      </div>

      <div style={{ padding:"20px 20px 40px", maxWidth:520, margin:"0 auto", width:"100%" }}>
        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><ProgIcon prog={prog} size={52}/></div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:34, fontWeight:900, letterSpacing:".02em", marginBottom:8 }}>{prog.name}</div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            <span style={{ background:`${lvlColor}15`, border:`1px solid ${lvlColor}40`, borderRadius:8, padding:"4px 12px", fontSize:11, color:lvlColor, fontWeight:700 }}>{prog.level}</span>
            <span style={{ background:"rgba(255,255,255,.05)", borderRadius:8, padding:"4px 12px", fontSize:11, color:T.mu, fontWeight:700 }}>{prog.days}d/wk</span>
            {prog.weeks && <span style={{ background:"rgba(255,255,255,.05)", borderRadius:8, padding:"4px 12px", fontSize:11, color:T.mu, fontWeight:700 }}>{prog.weeks} weeks</span>}
            <span style={{ background:"rgba(255,255,255,.05)", borderRadius:8, padding:"4px 12px", fontSize:11, color:T.mu, fontWeight:700 }}>{prog.category}</span>
          </div>
          {r.count > 0 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:12 }}>
              <StarRow value={Math.round(r.avg)} size={18} />
              <span style={{ fontSize:12, color:T.mu }}>{r.avg.toFixed(1)} · {r.count} rating{r.count !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Best for */}
        <div style={{ background:"rgba(41,121,255,.06)", border:"1px solid rgba(41,121,255,.18)", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:"#2979FF", textTransform:"uppercase", marginBottom:6 }}>Best For</div>
          <div style={{ fontSize:14, color:"#fff", lineHeight:1.5 }}>{prog.bestFor}</div>
        </div>

        {/* Weekly schedule */}
        {meta.schedule && (
          <Section title="Weekly Schedule">
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {meta.schedule.map((day, i) => {
                const isRest = day.toLowerCase().includes("rest");
                return (
                  <div key={i} style={{ flex:"1 1 calc(14% - 5px)", minWidth:40, background:isRest?"rgba(255,255,255,.03)":"rgba(41,121,255,.07)", border:`1px solid ${isRest?"rgba(255,255,255,.07)":"rgba(41,121,255,.2)"}`, borderRadius:8, padding:"8px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:8, color:T.mu, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:3 }}>{["M","T","W","T","F","S","S"][i]}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:isRest?T.mu:"#7CB3FF", lineHeight:1.2 }}>{day.replace("🏋️ ","").replace("🏃 ","").replace("🔥 ","").replace("😴 ","")}</div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Sample workout */}
        {meta.sample && (
          <Section title="Sample Session">
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {meta.sample.map((ex, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"rgba(255,255,255,.03)", borderRadius:9, border:"1px solid rgba(255,255,255,.06)" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#fff" }}>{ex.n}</div>
                  </div>
                  {(ex.s || ex.r) && (
                    <div style={{ fontSize:11, color:T.mu, fontWeight:600, textAlign:"right" }}>
                      {ex.s ? `${ex.s} sets` : ""}
                      {ex.s && ex.r ? " · " : ""}
                      {ex.r ? `${ex.r} reps` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Nutrition impact */}
        {meta.nuNote && (
          <Section title="Nutrition Impact">
            <div style={{ display:"flex", gap:10, alignItems:"flex-start", background:"rgba(52,211,153,.05)", border:"1px solid rgba(52,211,153,.15)", borderRadius:10, padding:"12px 14px" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>🥗</span>
              <div style={{ fontSize:13, color:"rgba(245,245,240,.8)", lineHeight:1.6 }}>{meta.nuNote}</div>
            </div>
          </Section>
        )}

        {/* Equipment */}
        {meta.eq && (
          <Section title="Equipment">
            <div style={{ fontSize:13, color:"rgba(245,245,240,.7)", background:"rgba(255,255,255,.03)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,.06)" }}>
              {meta.eq}
            </div>
          </Section>
        )}

        {/* Who it's for */}
        {meta.who && (
          <Section title="Who It's For">
            <div style={{ fontSize:13, color:"rgba(245,245,240,.7)", background:"rgba(255,255,255,.03)", borderRadius:10, padding:"12px 14px", border:"1px solid rgba(255,255,255,.06)" }}>
              {meta.who}
            </div>
          </Section>
        )}

        {/* Rate this program */}
        <Section title="Rate This Program">
          <div style={{ background:"rgba(255,255,255,.03)", borderRadius:10, padding:"14px", border:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ fontSize:12, color:T.mu, marginBottom:10 }}>Your rating</div>
            <StarRow value={userRating || 0} onChange={onRate} size={28} />
            {r.count > 0 && (
              <div style={{ marginTop:12, fontSize:11, color:T.mu }}>
                Community average: <span style={{ color:"#FBbF24", fontWeight:700 }}>{r.avg.toFixed(1)}</span> from {r.count} athlete{r.count !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </Section>

        {/* Start button */}
        {!prog.comingSoon && (
          <button onClick={onStart} style={{ width:"100%", padding:16, background:T.prot, color:"#fff", fontWeight:700, fontSize:16, border:"none", borderRadius:14, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:1, marginTop:8 }}>
            Start {prog.name} →
          </button>
        )}
        {prog.comingSoon && (
          <div style={{ width:"100%", padding:16, background:"rgba(255,255,255,.04)", color:T.mu, fontWeight:700, fontSize:14, border:`1px solid ${T.bd}`, borderRadius:14, textAlign:"center", fontFamily:"inherit" }}>
            Coming Soon
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:".12em", textTransform:"uppercase", color:T.dim, fontFamily:"'Barlow Condensed',sans-serif", marginBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

// ─── CUSTOM ROUTINE BUILDER ───────────────────────────────────────────────────
const MUSCLE_GROUPS = [
  { key:"chest",    label:"Chest",     emoji:"💪" },
  { key:"back",     label:"Back",      emoji:"🏋️" },
  { key:"shoulders",label:"Shoulders", emoji:"🔺" },
  { key:"biceps",   label:"Biceps",    emoji:"💪" },
  { key:"triceps",  label:"Triceps",   emoji:"💪" },
  { key:"legs",     label:"Legs",      emoji:"🦵" },
  { key:"glutes",   label:"Glutes",    emoji:"🍑" },
  { key:"core",     label:"Core",      emoji:"🎯" },
  { key:"calves",   label:"Calves",    emoji:"🦵" },
  { key:"full_body",label:"Full Body", emoji:"⚡" },
];

export function CustomRoutineBuilder({ user, setTrainScreen, editRoutine, onSaved }) {
  const [name, setName] = useState(editRoutine?.name || "");
  const [exercises, setExercises] = useState(editRoutine?.exercises || []);
  const [notes, setNotes] = useState(editRoutine?.notes || "");
  const [activeGroup, setActiveGroup] = useState("chest");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState("build"); // build | review

  const groupExercises = MUSCLE_GROUP_POOL[activeGroup] || [];

  function addExercise(exName) {
    if (exercises.some(e => e.name === exName)) return;
    setExercises(prev => [...prev, { name: exName, sets: 3, repsMin: 8, repsMax: 12, restSecs: 90, rpe: 8 }]);
  }
  function removeExercise(idx) { setExercises(prev => prev.filter((_, i) => i !== idx)); }
  function moveUp(idx) { if (idx === 0) return; setExercises(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; }); }
  function moveDown(idx) { if (idx === exercises.length - 1) return; setExercises(prev => { const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; }); }
  function updateEx(idx, field, val) { setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e)); }

  async function saveRoutine() {
    if (!name.trim()) { showToast("Add a routine name", "error"); return; }
    if (!exercises.length) { showToast("Add at least one exercise", "error"); return; }
    setSaving(true);
    try {
      const payload = { user_id: user?.id, name: name.trim(), exercises, notes, updated_at: new Date().toISOString() };
      if (editRoutine?.id) {
        await sb.from("custom_routines").update(payload).eq("id", editRoutine.id);
      } else {
        await sb.from("custom_routines").insert(payload);
      }
      showToast("Routine saved!", "success");
      onSaved?.();
      setTrainScreen("library");
    } catch (e) {
      showToast("Save failed", "error");
      console.error("[CustomRoutineBuilder] save error:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight:"100vh" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
        <button onClick={() => setTrainScreen("library")} style={{ background:"none", border:"none", color:T.mu, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>← Back</button>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900 }}>{editRoutine ? "Edit Routine" : "Build Routine"}</div>
        <div style={{ width:60 }} />
      </div>

      <div style={{ padding:"20px 20px 80px" }}>
        {/* Routine name */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:T.dim, textTransform:"uppercase", marginBottom:8, fontFamily:"'Barlow Condensed',sans-serif" }}>Routine Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monday Push Day" maxLength={50}
            style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, padding:"12px 14px", color:"#fff", fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>

        {/* Muscle group tabs */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:T.dim, textTransform:"uppercase", marginBottom:10, fontFamily:"'Barlow Condensed',sans-serif" }}>Add Exercises</div>
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:8 }}>
            {MUSCLE_GROUPS.map(g => (
              <button key={g.key} onClick={() => setActiveGroup(g.key)} style={{ flexShrink:0, padding:"6px 14px", borderRadius:20, border:`1.5px solid ${activeGroup===g.key?"#2979FF":"rgba(255,255,255,.1)"}`, background:activeGroup===g.key?"rgba(41,121,255,.12)":"rgba(255,255,255,.03)", color:activeGroup===g.key?"#2979FF":T.mu, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:24 }}>
          {groupExercises.map(exName => {
            const added = exercises.some(e => e.name === exName);
            return (
              <button key={exName} onClick={() => added ? null : addExercise(exName)}
                style={{ padding:"10px 12px", borderRadius:9, border:`1.5px solid ${added?"rgba(52,211,153,.3)":"rgba(255,255,255,.08)"}`, background:added?"rgba(52,211,153,.06)":"rgba(255,255,255,.03)", color:added?"#34D399":"rgba(245,245,240,.75)", fontSize:11, fontWeight:600, cursor:added?"default":"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>{exName}</span>
                {added ? <span style={{ fontSize:14 }}>✓</span> : <span style={{ fontSize:14, color:T.dim }}>+</span>}
              </button>
            );
          })}
        </div>

        {/* Selected exercises */}
        {exercises.length > 0 && (
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:T.dim, textTransform:"uppercase", marginBottom:10, fontFamily:"'Barlow Condensed',sans-serif" }}>
              Your Routine ({exercises.length} exercises)
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {exercises.map((ex, idx) => (
                <div key={idx} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.09)", borderRadius:12, padding:"12px 14px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{ex.name}</div>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <button onClick={() => moveUp(idx)} disabled={idx===0} style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, color:idx===0?T.bd:T.mu, fontSize:11, cursor:idx===0?"default":"pointer", padding:"2px 6px", fontFamily:"inherit" }}>↑</button>
                      <button onClick={() => moveDown(idx)} disabled={idx===exercises.length-1} style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, color:idx===exercises.length-1?T.bd:T.mu, fontSize:11, cursor:idx===exercises.length-1?"default":"pointer", padding:"2px 6px", fontFamily:"inherit" }}>↓</button>
                      <button onClick={() => removeExercise(idx)} style={{ background:"none", border:"1px solid rgba(255,77,109,.2)", borderRadius:6, color:"rgba(255,77,109,.6)", fontSize:11, cursor:"pointer", padding:"2px 8px", fontFamily:"inherit" }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                    {[
                      { label:"Sets", field:"sets", type:"number", min:1, max:10, val:ex.sets },
                      { label:"Reps min", field:"repsMin", type:"number", min:1, max:50, val:ex.repsMin },
                      { label:"Reps max", field:"repsMax", type:"number", min:1, max:50, val:ex.repsMax },
                      { label:"Rest (s)", field:"restSecs", type:"number", min:30, max:300, step:15, val:ex.restSecs },
                    ].map(({ label, field, type, min, max, step:st, val }) => (
                      <div key={field}>
                        <div style={{ fontSize:9, color:T.mu, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>{label}</div>
                        <input type={type} value={val} min={min} max={max} step={st||1} onChange={e => updateEx(idx, field, Number(e.target.value))}
                          style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", borderRadius:7, padding:"6px 8px", color:"#fff", fontSize:12, fontFamily:"inherit", outline:"none", textAlign:"center", boxSizing:"border-box" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:9, color:T.mu, fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", marginBottom:4 }}>RPE (1–10)</div>
                    <div style={{ display:"flex", gap:4 }}>
                      {[6,7,8,9,10].map(v => (
                        <button key={v} onClick={() => updateEx(idx, "rpe", v)}
                          style={{ flex:1, padding:"5px 0", borderRadius:7, border:`1.5px solid ${ex.rpe===v?"#2979FF":"rgba(255,255,255,.1)"}`, background:ex.rpe===v?"rgba(41,121,255,.15)":"rgba(255,255,255,.03)", color:ex.rpe===v?"#2979FF":T.mu, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:".1em", color:T.dim, textTransform:"uppercase", marginBottom:8, fontFamily:"'Barlow Condensed',sans-serif" }}>Notes (optional)</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Coach notes, tempo, rest periods..." rows={3} maxLength={300}
            style={{ width:"100%", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, padding:"10px 12px", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", resize:"none", boxSizing:"border-box" }} />
        </div>

        <button onClick={saveRoutine} disabled={saving || !name.trim() || !exercises.length}
          style={{ width:"100%", padding:16, background:name.trim()&&exercises.length?T.prot:"rgba(255,255,255,.06)", color:name.trim()&&exercises.length?"#fff":T.mu, fontWeight:700, fontSize:15, border:"none", borderRadius:14, cursor:name.trim()&&exercises.length?"pointer":"not-allowed", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:1 }}>
          {saving ? "Saving…" : editRoutine ? "Save Changes" : "Save Routine →"}
        </button>
      </div>
    </div>
  );
}

// ─── PROGRAM TYPE ICON ───────────────────────────────────────────────────────
function ProgIcon({prog, size=28}) {
  const sw = "1.8";
  const lc = "round";
  const lj = "round";
  const s = {fill:"none",stroke:"rgba(245,245,240,0.75)",strokeWidth:sw,strokeLinecap:lc,strokeLinejoin:lj};
  const vb = "0 0 24 24";
  if (prog.isRun || prog.category === "Running") return (
    <svg width={size} height={size} viewBox={vb}><polyline {...s} points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  );
  if (prog.isHyrox || prog.category === "Hyrox") return (
    <svg width={size} height={size} viewBox={vb}><polygon {...s} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  );
  if (prog.isHybrid || prog.category === "Hybrid") return (
    <svg width={size} height={size} viewBox={vb}><polyline {...s} points="17 1 21 5 17 9"/><path {...s} d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline {...s} points="7 23 3 19 7 15"/><path {...s} d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
  );
  if (prog.isConditioning || prog.category === "Fat Loss & Conditioning") return (
    <svg width={size} height={size} viewBox={vb}><path {...s} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
  );
  if (prog.category === "Glute Focus") return (
    <svg width={size} height={size} viewBox={vb}><circle {...s} cx="12" cy="12" r="10"/><circle {...s} cx="12" cy="12" r="6"/><circle {...s} cx="12" cy="12" r="2"/></svg>
  );
  // Default: Dumbbell (Hypertrophy / Strength) — diagonal Lucide dumbbell
  return (
    <svg width={size} height={size} viewBox={vb} fill="none" stroke="rgba(245,245,240,0.75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5l11 11"/>
      <path d="M21 21l-1-1"/>
      <path d="M3 3l1 1"/>
      <path d="M18 22l4-4"/>
      <path d="M2 6l4-4"/>
      <path d="M3 10l7-7"/>
      <path d="M14 21l7-7"/>
    </svg>
  );
}

// ─── PROGRAM LIBRARY SCREEN ───────────────────────────────────────────────────
const FILTER_TABS = [
  { id:"All",        cats:null },
  { id:"Strength",   cats:["Hypertrophy","Strength"] },
  { id:"Sculpt",     cats:["Sculpt"] },
  { id:"Golden Era", cats:["Golden Era"] },
  { id:"Running",    cats:["Running"] },
  { id:"Hyrox",      cats:["Hyrox"] },
  { id:"Hybrid",     cats:["Hybrid"] },
  { id:"MetCon",     cats:["MetCon"] },
  { id:"Glute",      cats:["Glute Focus"] },
  { id:"Fat Loss",   cats:["Fat Loss & Conditioning"] },
  { id:"Sport",      cats:["Sport"] },
];

// Equipment compatibility — what equipment tags each profile setting unlocks
const EQUIPMENT_COMPAT = {
  minimal:   ["minimal","bodyweight","dumbbell"],
  dumbbells: ["dumbbell","minimal","cable","dumbbells"],
  home_bar:  ["barbell","dumbbell","minimal","cable","home_bar"],
  full:      null, // all
};

// trainType → default filter tab
const TRAINTYPE_DEFAULT_TAB = {
  strength: "Strength",
  run:      "Running",
  hyrox:    "Hyrox",
  hybrid:   "Hybrid",
  metcon:   "MetCon",
  sport:    "Sport",
};

function isEquipmentCompatible(prog, profileEquipment) {
  if (!profileEquipment || profileEquipment === "full") return true;
  const allowed = EQUIPMENT_COMPAT[profileEquipment];
  if (!allowed) return true;
  if (!prog.equipment || prog.equipment.length === 0) return true;
  return prog.equipment.some(e => allowed.includes(e));
}

function isSessionCompatible(prog, profileSessionLength) {
  if (!profileSessionLength || profileSessionLength === "90") return true;
  const maxMins = { "20": 30, "45": 50, "60": 70 }[profileSessionLength];
  if (!maxMins || !prog.sessionMins) return true;
  return prog.sessionMins <= maxMins;
}

function isFreqCompatible(prog, profileFreq) {
  const userMaxDays = { "n0": 0, "1-3": 3, "4-6": 6, "7+": 7 }[profileFreq] ?? 7;
  if (userMaxDays === 7) return true;                  // trains every day — show everything
  if (prog.days == null) return true;                  // running/hyrox use week structures — always show
  return prog.days <= userMaxDays;
}

export function ProgramLibraryScreen({ wPrefs, setWPrefs, profile, setTrainScreen, user }) {
  const defaultCategory = TRAINTYPE_DEFAULT_TAB[profile?.trainType] || "All";
  const [catFilter, setCatFilter] = useState(defaultCategory);
  const [levelFilter, setLevelFilter] = useState("All");
  const [detailProg, setDetailProg] = useState(null);
  const [confirmProg, setConfirmProg] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [ratings, setRatings] = useState({});
  const [userRatings, setUserRatings] = useState({});
  const [customRoutines, setCustomRoutines] = useState([]);
  const [routinesLoading, setRoutinesLoading] = useState(true);
  const [editRoutine, setEditRoutine] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [mpPendingProg, setMpPendingProg] = useState(null);
  const [setupProgram, setSetupProgram] = useState(null);

  const currentId = wPrefs._libraryId || null;

  // Load ratings and custom routines
  useEffect(() => {
    async function load() {
      try {
        const { data: ratingRows } = await sb.from("program_ratings").select("program_id,rating,user_id");
        if (ratingRows?.length) {
          const agg = {};
          ratingRows.forEach(r => {
            if (!agg[r.program_id]) agg[r.program_id] = { sum: 0, count: 0 };
            agg[r.program_id].sum += r.rating;
            agg[r.program_id].count += 1;
          });
          const result = {};
          Object.entries(agg).forEach(([id, { sum, count }]) => { result[id] = { avg: sum / count, count }; });
          setRatings(result);

          const { data: { user: me } } = await sb.auth.getUser();
          if (me) {
            const mine = {};
            ratingRows.filter(r => r.user_id === me.id).forEach(r => { mine[r.program_id] = r.rating; });
            setUserRatings(mine);
          }
        }
      } catch {}

      try {
        const { data: { user: me } } = await sb.auth.getUser();
        if (me) {
          const { data } = await sb.from("custom_routines").select("*").eq("user_id", me.id).order("updated_at", { ascending: false });
          setCustomRoutines(data || []);
        }
      } catch {} finally {
        setRoutinesLoading(false);
      }
    }
    load();
  }, []);

  const filtered = PROGRAM_LIBRARY.filter(p => {
    const tab = FILTER_TABS.find(t => t.id === catFilter);
    if (tab?.cats && !tab.cats.includes(p.category)) return false;
    if (levelFilter !== "All" && p.level !== levelFilter) return false;
    return true;
  });

  // "BUILT FOR YOU" — programs matching trainType + equipment + sessionLength + frequency
  const recommended = PROGRAM_LIBRARY.filter(p => {
    const tabMatch = TRAINTYPE_DEFAULT_TAB[profile?.trainType];
    if (!tabMatch) return false;
    const tab = FILTER_TABS.find(t => t.id === tabMatch);
    if (tab?.cats && !tab.cats.includes(p.category)) return false;
    if (!isEquipmentCompatible(p, profile?.equipment)) return false;
    if (!isSessionCompatible(p, profile?.sessionLength)) return false;
    if (!isFreqCompatible(p, profile?.freq)) return false;
    return true;
  }).slice(0, 3);

  async function rateProgram(progId, rating) {
    try {
      const { data: { user: me } } = await sb.auth.getUser();
      if (!me) return;
      await sb.from("program_ratings").upsert({ user_id: me.id, program_id: progId, rating }, { onConflict: "user_id,program_id" });
      setUserRatings(prev => ({ ...prev, [progId]: rating }));
      // Refresh agg
      const { data } = await sb.from("program_ratings").select("program_id,rating").eq("program_id", progId);
      if (data) {
        const sum = data.reduce((acc, r) => acc + r.rating, 0);
        setRatings(prev => ({ ...prev, [progId]: { avg: sum / data.length, count: data.length } }));
      }
      showToast("Rating saved!", "success");
    } catch { showToast("Rating failed", "error"); }
  }

  async function doActualSwitch(prog) {
    setSwitching(true);
    try {
      const newWPrefs = { ...wPrefs, _libraryId: prog.id };
      if (prog.isRun)   { newWPrefs.splitType = prog.name; newWPrefs.runPlan = prog.name; newWPrefs.isHybrid = false; newWPrefs.isHyrox = false; }
      else if (prog.isHyrox && prog.isHybrid) { newWPrefs.isHyrox = true; newWPrefs.isHybrid = true; newWPrefs.splitType = prog.name; }
      else if (prog.isHyrox)  { newWPrefs.isHyrox = true; newWPrefs.isHybrid = false; newWPrefs.splitType = prog.name; }
      else if (prog.isHybrid) { newWPrefs.isHybrid = true; newWPrefs.isHyrox = false; newWPrefs.splitType = prog.name; }
      else if (prog.isConditioning) { newWPrefs.splitType = prog.name; newWPrefs.isHybrid = false; newWPrefs.isHyrox = false; }
      else if (prog.splitKey) { newWPrefs.splitType = prog.splitKey; newWPrefs.isHybrid = false; newWPrefs.isHyrox = false; }

      const newStartDate = new Date().toISOString().split("T")[0];
      setWPrefs(newWPrefs);

      const { data: { user: me } } = await sb.auth.getUser();
      if (me) {
        const calc = recalculateNutritionForProgram(profile, prog);
        const profileUpdate = { id: me.id, wprefs: newWPrefs, startDate: newStartDate };
        if (calc.delta !== 0) {
          profileUpdate.calorie_target = calc.goalCals;
          profileUpdate.profile_data = { ...profile, goalCals: calc.goalCals, calorie_target: calc.goalCals, manual_calorie_target: false };
        }
        await sb.from("profiles").upsert(profileUpdate, { onConflict: "id" });
      }
      setConfirmProg(null);
      setDetailProg(null);
      showToast(`Started ${prog.name}!`, "success");
      setTrainScreen("today");
    } catch (e) {
      console.error("[ProgramLibrary] switch error:", e);
      showToast("Switch failed", "error");
    } finally { setSwitching(false); }
  }

  async function confirmSwitch(prog) {
    if (localStorage.getItem('__mp_exists') === '1') {
      setMpPendingProg(prog);
      setConfirmProg(null);
      setDetailProg(null);
      return;
    }
    await doActualSwitch(prog);
  }

  async function deleteRoutine(id) {
    setDeletingId(id);
    try {
      await sb.from("custom_routines").delete().eq("id", id);
      setCustomRoutines(prev => prev.filter(r => r.id !== id));
      showToast("Routine deleted", "success");
    } catch { showToast("Delete failed", "error"); }
    finally { setDeletingId(null); }
  }

  async function handleSetupConfirm(prog) {
    setSetupProgram(null);
    setDetailProg(null);
    await confirmSwitch(prog);
  }

  function handleSetupCancel() {
    setSetupProgram(null);
  }

  async function startCustomRoutine(routine) {
    // Navigate to active session with custom routine exercises
    const activeEx = (routine.exercises || []).map(ex => ({
      name: ex.name, notes: ex.notes || `${ex.sets}×${ex.repsMin}-${ex.repsMax} @ RPE ${ex.rpe}`, restSecs: ex.restSecs || 90,
      sets: Array.from({ length: ex.sets || 3 }, () => ({ weight: "", reps: String(ex.repsMin || 10), done: false })),
    }));
    // Store in sessionStorage for TrainSection to pick up
    try { sessionStorage.setItem("cm_custom_routine_session", JSON.stringify({ title: routine.name, exercises: activeEx })); } catch {}
    setTrainScreen("active");
  }

  const MpSwitchWarnModal = mpPendingProg ? (
    <div style={{ position:"fixed", inset:0, background:"rgba(6,13,26,.9)", backdropFilter:"blur(6px)", zIndex:400, display:"flex", alignItems:"flex-end", justifyContent:"center" }} onClick={() => setMpPendingProg(null)}>
      <div style={{ background:"#0d0d0d", border:"1px solid rgba(254,160,32,0.3)", borderRadius:"16px 16px 0 0", padding:"28px 20px 40px", maxWidth:480, width:"100%" }} onClick={e => e.stopPropagation()}>
        <div style={{ width:36, height:4, borderRadius:2, background:"rgba(255,255,255,.15)", margin:"0 auto 20px" }}/>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#FEA020", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:8 }}>// MEAL PLAN WARNING</div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontStyle:"italic", fontWeight:900, fontSize:22, color:"#f5f5f0", textTransform:"uppercase", lineHeight:1, marginBottom:12 }}>Meal plan will be invalidated<span style={{ color:"#FEA020" }}>.</span></div>
        <div style={{ background:"rgba(254,160,32,0.06)", border:"1px solid rgba(254,160,32,0.2)", borderRadius:10, padding:"12px 14px", marginBottom:24, fontSize:13, color:"rgba(245,245,240,0.75)", lineHeight:1.6 }}>
          Switching to <strong style={{ color:"#f5f5f0" }}>{mpPendingProg.name}</strong> will clear your current meal prep plan. You can regenerate it once you're in the Kitchen tab.
        </div>
        <button disabled={switching} onClick={async () => { localStorage.setItem('__mp_regen_needed','1'); window.dispatchEvent(new CustomEvent('cm_clear_meal_prep')); const p = mpPendingProg; setMpPendingProg(null); await doActualSwitch(p); }} style={{ width:"100%", padding:15, background:"#FEA020", color:"#000", fontWeight:700, fontSize:14, border:"none", borderRadius:12, cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>
          {switching ? "Switching…" : "SWITCH ANYWAY →"}
        </button>
        <button disabled={switching} onClick={() => setMpPendingProg(null)} style={{ width:"100%", padding:13, background:"transparent", color:"rgba(245,245,240,0.5)", border:"1px solid rgba(245,245,240,0.1)", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          KEEP CURRENT PROGRAM
        </button>
      </div>
    </div>
  ) : null;

  // Show detail modal
  if (detailProg && !confirmProg) {
    return (
      <>
        <ProgramDetailModal
          prog={detailProg}
          profile={profile}
          ratings={ratings}
          userRating={userRatings[detailProg.id] || 0}
          onStart={() => {
            if (detailProg.comingSoon) return;
            if (SETUP_CATEGORIES.has(detailProg.category)) {
              setSetupProgram(detailProg);
            } else {
              setConfirmProg(detailProg);
            }
          }}
          onRate={rating => rateProgram(detailProg.id, rating)}
          onClose={() => setDetailProg(null)}
        />
        {confirmProg && (
          <FuelAwarenessModal
            prog={confirmProg}
            profile={profile}
            switching={switching}
            onConfirm={() => confirmSwitch(confirmProg)}
            onCancel={() => !switching && setConfirmProg(null)}
          />
        )}
        {MpSwitchWarnModal}
        {setupProgram && (
          <RunProgramSetup
            program={setupProgram}
            user={user}
            onConfirm={handleSetupConfirm}
            onCancel={handleSetupCancel}
          />
        )}
      </>
    );
  }

  return (
    <div>
      <style>{`
        .plib-card{background:rgba(255,255,255,.03);border:1.5px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;cursor:pointer;transition:border-color .15s,background .15s;}
        .plib-card:hover{border-color:rgba(41,121,255,.35);background:rgba(41,121,255,.04);}
        .plib-card.current{border-color:rgba(41,121,255,.5);background:rgba(41,121,255,.07);}
        .plib-chip{height:36px;padding:0 16px;border-radius:18px;border:1px solid rgba(245,245,240,.10);background:rgba(245,245,240,.04);color:rgba(245,245,240,.55);font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0;display:inline-flex;align-items:center;transition:background 150ms,border-color 150ms,color 150ms,transform 100ms;}
        .plib-chip.active{border-color:#e8341c;background:rgba(232,52,28,.12);color:#e8341c;}
        .plib-chip:active{transform:scale(0.96);}
        .plib-routine{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
        .plib-filter-row{overflow-x:scroll;-webkit-overflow-scrolling:touch;margin-left:-18px;margin-right:-18px;padding-left:18px;padding-right:18px;}
        .plib-filter-row::-webkit-scrollbar{display:none;}
      `}</style>

      {/* Category filter — scrollable, no wrap */}
      <div className="plib-filter-row" style={{ display:"flex", gap:6, flexWrap:"nowrap", paddingBottom:8, marginBottom:12 }}>
        {FILTER_TABS.map(t => (
          <button key={t.id} className={`plib-chip${catFilter===t.id?" active":""}`} onClick={() => setCatFilter(t.id)}>{t.id}</button>
        ))}
      </div>

      {/* Level filter — scrollable, no wrap */}
      <div className="plib-filter-row" style={{ display:"flex", gap:6, flexWrap:"nowrap", marginBottom:20 }}>
        {["All","Beginner","Intermediate","Advanced"].map(l => (
          <button key={l} onClick={() => setLevelFilter(l)} className={`plib-chip${levelFilter===l?" active":""}`}>{l}</button>
        ))}
      </div>

      {/* BUILT FOR YOU */}
      {recommended.length > 0 && catFilter === "All" && (
        <div style={{ marginBottom:24 }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--accent)", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:10 }}>// Built For You</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {recommended.map(prog => {
              const isCurrent = currentId === prog.id;
              const lvlColor = prog.level==="Beginner"?"#34D399":prog.level==="Advanced"?"#F87171":"#FBbF24";
              return (
                <button key={prog.id} onClick={() => setDetailProg(prog)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"12px 14px", background:isCurrent?"rgba(var(--accent-rgb),.08)":"rgba(245,245,240,.03)", border:`1px solid ${isCurrent?"var(--accent)":"rgba(245,245,240,.08)"}`, borderRadius:12, cursor:"pointer", textAlign:"left", color:"#fff", fontFamily:"inherit" }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"var(--condensed)", fontStyle:"italic", fontWeight:900, fontSize:16, color:"#fff", lineHeight:1, marginBottom:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{prog.name}</div>
                    <div style={{ fontFamily:"var(--mono)", fontSize:9, color:lvlColor, letterSpacing:"0.1em", textTransform:"uppercase" }}>{prog.level} · {prog.days}d/wk{prog.weeks ? ` · ${prog.weeks}wk` : ""}</div>
                  </div>
                  <div style={{ fontFamily:"var(--mono)", fontSize:9, color:"var(--accent)", letterSpacing:"0.08em", flexShrink:0 }}>VIEW →</div>
                </button>
              );
            })}
          </div>
          <div style={{ height:1, background:"rgba(245,245,240,.06)", margin:"16px 0 4px" }} />
        </div>
      )}

      {/* Program grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:32 }}>
        {filtered.map(prog => {
          const meta = PROG_META[prog.id] || {};
          const isCurrent = currentId === prog.id;
          const r = ratings[prog.id] || { avg: 0, count: 0 };
          const lvlColor = prog.level==="Beginner"?"#34D399":prog.level==="Advanced"?"#F87171":"#FBbF24";
          const equipOk = isEquipmentCompatible(prog, profile?.equipment);
          return (
            <div key={prog.id} className={`plib-card${isCurrent?" current":""}`} onClick={() => setDetailProg(prog)} style={{overflow:"hidden", opacity: equipOk ? 1 : 0.75}}>
              {(()=>{ const img=getProgramImage(prog.id); return img?(
                <div style={{position:"relative",width:"calc(100% + 32px)",height:100,margin:"-16px -16px 12px -16px",borderRadius:"12px 12px 0 0",overflow:"hidden"}}>
                  <img src={img} alt={prog.name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center",display:"block"}} onError={e=>{e.target.parentElement.style.display="none";}}/>
                  <div style={{position:"absolute",bottom:0,left:0,right:0,height:50,background:"linear-gradient(transparent,rgba(9,11,17,0.97))",pointerEvents:"none"}}/>
                </div>
              ):null; })()}
              <div style={{ marginBottom:10 }}><ProgIcon prog={prog} size={28}/></div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:800, lineHeight:1.1, marginBottom:6 }}>{prog.name}</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>
                <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:5, background:`${lvlColor}12`, color:lvlColor, letterSpacing:".06em" }}>{prog.level}</span>
                <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:5, background:"rgba(255,255,255,.05)", color:T.mu }}>{prog.days}d/wk</span>
                {prog.weeks && <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:5, background:"rgba(255,255,255,.05)", color:T.mu }}>{prog.weeks}wk</span>}
              </div>
              <div style={{ fontSize:11, color:T.mu, lineHeight:1.4, marginBottom:8 }}>{prog.bestFor}</div>
              {r.count > 0 && (
                <div style={{ fontSize:10, color:"#FBbF24", display:"flex", alignItems:"center", gap:4 }}>
                  {"★".repeat(Math.round(r.avg))}{"☆".repeat(5-Math.round(r.avg))}
                  <span style={{ color:T.mu }}>{r.avg.toFixed(1)} ({r.count})</span>
                </div>
              )}
              {isCurrent && <div style={{ fontSize:10, fontWeight:700, color:"#2979FF", letterSpacing:".08em", marginTop:6 }}>▶ CURRENT</div>}
              {prog.comingSoon && <div style={{ fontSize:10, fontWeight:700, color:T.mu, letterSpacing:".08em", marginTop:6 }}>COMING SOON</div>}
              {!equipOk && <div style={{ fontSize:9, color:"rgba(245,245,240,.35)", letterSpacing:".06em", marginTop:4 }}>Requires: full gym</div>}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", color:T.mu, fontSize:13 }}>No programs match these filters.</div>
      )}

      {/* My Custom Routines */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:800 }}>My Custom Routines</div>
          <button onClick={() => setTrainScreen("routine-builder")} style={{ padding:"8px 16px", background:T.prot, color:"#fff", border:"none", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            + Build
          </button>
        </div>

        {routinesLoading ? (
          <div style={{ textAlign:"center", padding:20 }}><Spinner size={20} /></div>
        ) : customRoutines.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,.02)", border:"1px dashed rgba(255,255,255,.1)", borderRadius:14, padding:"28px 20px", textAlign:"center" }}>
            <div style={{ marginBottom:10, display:"flex", justifyContent:"center" }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="rgba(245,245,240,0.35)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="2" width="8" height="4" rx="1"/>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <line x1="12" y1="11" x2="16" y2="11"/>
                <line x1="12" y1="16" x2="16" y2="16"/>
                <circle cx="8" cy="11" r=".5" fill="rgba(245,245,240,0.35)"/>
                <circle cx="8" cy="16" r=".5" fill="rgba(245,245,240,0.35)"/>
              </svg>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:"rgba(245,245,240,.6)", marginBottom:6 }}>No custom routines yet</div>
            <div style={{ fontSize:12, color:T.mu, marginBottom:16 }}>Build a personalized workout with your favorite exercises.</div>
            <button onClick={() => setTrainScreen("routine-builder")} style={{ padding:"10px 20px", background:"rgba(41,121,255,.12)", border:"1.5px solid rgba(41,121,255,.3)", borderRadius:10, color:"#2979FF", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Build First Routine →
            </button>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {customRoutines.map(r => (
              <div key={r.id} className="plib-routine">
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#fff", marginBottom:4 }}>{r.name}</div>
                  <div style={{ fontSize:11, color:T.mu }}>{(r.exercises||[]).length} exercises{r.notes ? ` · ${r.notes.slice(0,40)}${r.notes.length>40?"…":""}` : ""}</div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  <button onClick={() => startCustomRoutine(r)} style={{ padding:"7px 12px", background:"rgba(41,121,255,.12)", border:"1.5px solid rgba(41,121,255,.3)", borderRadius:8, color:"#2979FF", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>▶</button>
                  <button onClick={() => { setEditRoutine(r); setTrainScreen("routine-builder"); }} style={{ padding:"7px 10px", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, color:T.mu, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Edit</button>
                  <button onClick={() => deleteRoutine(r.id)} disabled={deletingId===r.id} style={{ padding:"7px 10px", background:"rgba(255,77,109,.06)", border:"1px solid rgba(255,77,109,.2)", borderRadius:8, color:"rgba(255,77,109,.7)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {deletingId===r.id?"…":"✕"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fuel awareness modal over the list */}
      {confirmProg && (
        <FuelAwarenessModal
          prog={confirmProg}
          profile={profile}
          switching={switching}
          onConfirm={() => confirmSwitch(confirmProg)}
          onCancel={() => !switching && setConfirmProg(null)}
        />
      )}
      {MpSwitchWarnModal}
      {setupProgram && (
        <RunProgramSetup
          program={setupProgram}
          user={user}
          onConfirm={handleSetupConfirm}
          onCancel={handleSetupCancel}
        />
      )}
    </div>
  );
}
