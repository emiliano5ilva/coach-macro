import { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, SPLIT_CYCLES, FOCUS_MUSCLES, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, FASTING_PROTOCOLS, BF_DATA, BF_VISUAL,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, BodyFigure,
  calcTDEE, autoFocus, useCountUp, lookupBarcode,
  getDayMacros, getTodayKey, isToday, hap, pad2 } from "./components.jsx";
import { TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES,
  PROMOS } from "./sections.jsx";
import { getWorkoutForDay } from "./programs.js";
import { FuelSection } from "./fuel.jsx";
import { sb, ai } from "./client.js";

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
        <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Equation Upgrade Unlocked</div>
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
          <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>All options</div>
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
        <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8,marginTop:4}}>When do you want to reach this goal?</div>
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

export function App({profile,schedule,setSchedule,dayFocus,wPrefs,setWPrefs,onEarnedCals,onSignOut,user}) {
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
  const [workoutSavedMsg,setWorkoutSavedMsg]=useState("");

  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(id);},[]);

  // ── Persist food log: single row per day, entries = full jsonb array ────────
  async function saveFoodLog(uid,entries){
    const today=new Date().toISOString().split("T")[0];
    const {error}=await sb.from("food_logs")
      .upsert({user_id:uid,date:today,entries},{onConflict:"user_id,date"});
    if(error)console.error("[saveFoodLog] error:",error.message,error.code);
    else console.log("[saveFoodLog] saved",entries.length,"entries");
  }

  // Load today's food logs and workout history on mount
  useEffect(()=>{
    if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    // Food log — single row per day
    sb.from("food_logs").select("entries").eq("user_id",user.id).eq("date",today).maybeSingle().then(({data,error})=>{
      console.log("[loadFoodLog] entries:",data?.entries?.length||0,"error:",error?.message);
      if(data?.entries)setLog(data.entries);
    });
    // Workout history — last 50 sessions
    sb.from("workout_logs").select("*").eq("user_id",user.id).order("date",{ascending:false}).limit(50).then(({data,error})=>{
      console.log("[loadWorkoutHistory] rows:",data?.length||0,"error:",error?.message);
      if(data&&data.length>0){
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
    });
  },[user]);

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
    try{
      const raw=await ai(`Estimate macros for: "${foodInput}". Reply ONLY valid JSON no markdown: {"food":"short name","calories":0,"protein":0,"carbs":0,"fat":0}`);
      const p=JSON.parse(raw.trim());
      const entry={...p,id:Date.now(),method:"ai"};
      const newLog=[entry,...log];
      setLog(newLog);
      setLogMsg(`✓ ${p.food} — ${p.calories} kcal`);
      setFoodInput("");
      if(user)saveFoodLog(user.id,newLog);
    }
    catch(e){console.error("[aiLog] error:",e);setLogMsg("⚠️ AI unavailable. Try again.");}
    setLogging(false);
  }
  async function scanBarcode(){
    if(!barcodeInput.trim())return;setBarcodeLoading(true);setBarcodeResult(null);
    const result=await lookupBarcode(barcodeInput.trim());setBarcodeResult(result);setBarcodeLoading(false);
  }
  function addBarcode(){if(!barcodeResult)return;const entry={...barcodeResult,id:Date.now(),method:"barcode"};const newLog=[entry,...log];setLog(newLog);if(user)saveFoodLog(user.id,newLog);setBarcodeResult(null);setBarcodeInput("");setLogMsg(`✓ ${barcodeResult.name} added`);}
  function addQuick(){if(!quickFields.calories)return;const entry={food:quickFields.name||"Entry",calories:parseInt(quickFields.calories)||0,protein:parseInt(quickFields.protein)||0,carbs:parseInt(quickFields.carbs)||0,fat:parseInt(quickFields.fat)||0,id:Date.now(),method:"quick"};const newLog=[entry,...log];setLog(newLog);if(user)saveFoodLog(user.id,newLog);setQF({name:"",calories:"",protein:"",carbs:"",fat:""});}
  function removeLog(id){const newLog=log.filter(i=>i.id!==id);setLog(newLog);if(user)saveFoodLog(user.id,newLog);}

  async function fetchRecs(){
    setRecsLoading(true);setRecs("");
    const actCtx=todayActs.length>0?`\nToday's activity: ${todayActs.map(a=>`${a.type} (${a.calories} kcal via ${a.source})`).join(", ")}\n`:"";
    try{const txt=await ai(`You are a precision nutrition coach. The user is in ${city||"their city"} and needs to hit these EXACT remaining macros:\n- Calories: ${remaining.calories} kcal\n- Protein: ${remaining.protein}g\n- Carbs: ${remaining.carbs}g\n- Fat: ${remaining.fat}g\nGoal: ${profile.goal}. Training day: ${todayType}.\n\nProvide exactly 3 restaurant meal options using REAL menu items from chains available in ${city||"the US"} (e.g. Chick-fil-A, Chipotle, Subway, McDonald's, Wingstop, Raising Cane's, Panera, Wendy's, Taco Bell). For each option:\n• Restaurant name\n• Exact order with customizations ("no sauce", "extra protein", "double meat")\n• Macros: calories / protein / carbs / fat\n• How close it gets to their remaining targets\n\nThen 1 quick home meal option.\n\nBe SPECIFIC. Use real menu item names. Show exact macro numbers.`,900);setRecs(txt);}
    catch(e){console.error("[fetchRecs] error:",e);setRecs("⚠️ AI temporarily unavailable. Tap 'Get Recommendations' to retry.");}setRecsLoading(false);
  }

  async function fetchRecipes(){
    setRecipesLoading(true);setRecipes("");
    try{const txt=await ai(`Remaining macros I need to hit:\n- Calories: ${remaining.calories} kcal\n- Protein: ${remaining.protein}g\n- Carbs: ${remaining.carbs}g\n- Fat: ${remaining.fat}g\nGoal: ${profile.goal} · Day: ${todayType}\n\nGive 3 simple home recipes. Each: name, ingredients (max 6 with amounts), steps (max 5), macro breakdown, prep time. Easy to cook. Hit the protein and calorie targets.`,900);setRecipes(txt);}
    catch(e){console.error("[fetchRecipes] error:",e);setRecipes("⚠️ AI temporarily unavailable. Tap 'Get Recipes' to retry.");}setRecipesLoading(false);
  }

  async function generateWorkout(type="lifting",split="",runPlan="",hybridTemplate=""){
    setWorkoutLoading(true);setWorkout("");
    const coverage=MUSCLE_COVERAGE[todayFocus]||"Full coverage of all muscles";
    const actCtx=todayActs.length>0?`\nNOTE: Already completed: ${todayActs.map(a=>`${a.type} (${a.calories} kcal)`).join(", ")}. Adjust accordingly.`:"";
    const prompt=todayType==="rest"
      ?`REST DAY recovery for ${profile.goal} athlete. Mobility, stretching, foam rolling, recovery nutrition. Equipment: ${wPrefs.equipment}. Clear sections.`
      :`Complete ${todayFocus} session.\nATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Split: ${wPrefs.splitType} | Exp: ${profile.liftExp||"intermediate"}${actCtx}\nMUSCLE COVERAGE: ${coverage}\nFORMAT: Exercise | Sets×Reps | Rest | Form cue | Overload note\n1.Warm-up 2.Heavy compounds 3.Secondary 4.Isolation (ALL sub-muscles) 5.Finisher/Core${planMode==="hybrid"&&hybridMix.run?"\n═══ RUN BLOCK ═══\nType / Distance / Pace zone":""  }${planMode==="hybrid"&&hybridMix.hyrox||planMode==="hyrox"?`\n═══ HYROX ═══\n${todayType==="cardio"?"8 stations + 1km runs":"3-4 station finisher <20min"}`:""}\nSpecific. Clear headers. No fluff.`;
    try{const txt=await ai(prompt,1000);setWorkout(txt);}catch(e){console.error("[generateWorkout] AI error:",e);setWorkout("⚠️ AI temporarily unavailable. Tap 'Build Workout' to retry.");}setWorkoutLoading(false);
  }

  async function startStructured(splitName="",runPlanName="",hybridName=""){
    setWorkoutLoading(true);
    try{
      const splitInfo=splitName?`Training split: ${splitName}.`:`Training split: ${wPrefs.splitType}.`;
      const runInfo=runPlanName?`Run plan: ${runPlanName}.`:"";
      const hybridInfo=hybridName?`Hybrid template: ${hybridName}.`:"";
      const focus=FOCUS_MUSCLES[todayFocus]||"full body movements";
      const raw=await ai(`Build a structured ${todayFocus} workout session.
ATHLETE: Goal: ${profile.goal} | Equipment: ${wPrefs.equipment} | Experience: ${profile.liftExp||"intermediate"}
${splitInfo}${runInfo}${hybridInfo}
MUSCLES TO COVER: ${focus}

Return ONLY valid JSON, no markdown, no explanation:
{"title":"${todayFocus}","exercises":[{"name":"Exercise Name","sets":[{"reps":10,"weight":0,"done":false},{"reps":10,"weight":0,"done":false},{"reps":10,"weight":0,"done":false}],"restSecs":120,"notes":"Which muscle head this targets + key form cue"}]}

Rules:
- 5-7 exercises total
- Warm-up set first for compounds (lighter weight, higher reps)
- Cover EVERY muscle head listed above
- restSecs: 180 for heavy compounds, 120 for secondary, 60 for isolation
- Start weight at 0 (user will fill in their weight)`,800);
      const cleaned=raw.trim().replace(/^[^{]*/,"").replace(/[^}]*$/,"");
      const parsed=JSON.parse(cleaned);
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
          setWorkout("⚠️ AI unavailable. Use Today tab → Start Workout to begin.");
        }
      }catch(fe){setWorkout("⚠️ AI unavailable. Use Today tab → Start Workout to begin.");}
    }
    setWorkoutLoading(false);
  }

  function logSet(ei,si,reps,weight){
    setActiveWorkout(prev=>{if(!prev)return prev;const u={...prev};u.exercises=prev.exercises.map((ex,i)=>i!==ei?ex:{...ex,sets:ex.sets.map((s,j)=>j!==si?s:{...s,reps,weight,done:true})});return u;});
    const ex=activeWorkout?.exercises[ei];startRest(ex?.restSecs||90);hap();
  }

  async function finishWorkout(){
    if(activeWorkout){
      const nh={...history};
      const setsLogged=[];
      activeWorkout.exercises.forEach(ex=>{
        const k=ex.name.toLowerCase().replace(/\s+/g,"_");
        const done=ex.sets.filter(s=>s.done);
        if(done.length>0){
          if(!nh[k])nh[k]=[];
          nh[k]=[...nh[k],{date:new Date().toISOString(),sets:done}];
          setsLogged.push({name:ex.name,sets:done});
        }
      });
      setHistory(nh);
      const burn=todayType==="training"?Math.round(45*6):Math.round(45*11);
      if(onEarnedCals)onEarnedCals(burn);
      if(user){
        try{
          await sb.from("workout_logs").insert({
            user_id:user.id,
            date:new Date().toISOString().split("T")[0],
            workout:{focus:todayFocus,exercises:setsLogged,calories_burned:burn,type:todayType}
          });
          console.log("[finishWorkout] saved",setsLogged.length,"exercises to Supabase");
          setWorkoutSavedMsg(`✓ Workout saved. Great session! ${setsLogged.length} exercise${setsLogged.length===1?"":"s"} logged.`);
          setTimeout(()=>setWorkoutSavedMsg(""),4000);
        }catch(e){console.error("[finishWorkout] save error:",e);}
      }
    }
    setActiveWorkout(null);
    setTrainScreen("progress");
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
      <style>{GLOBAL_CSS}</style>
      {workoutSavedMsg&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:T.prot,color:T.white,padding:"13px 22px",borderRadius:14,fontSize:14,fontWeight:700,zIndex:1000,boxShadow:"0 4px 32px rgba(232,52,28,0.5)",whiteSpace:"nowrap",pointerEvents:"none",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:"uppercase"}}>{workoutSavedMsg}</div>}

      {/* ── DESKTOP SIDEBAR ── */}
      {!isMobile&&(
        <aside style={{width:240,flexShrink:0,background:T.s1,borderRight:`1px solid ${T.bd}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"24px 20px 20px"}}>
            <Logo size={30}/>
          </div>
          <div style={{padding:"0 12px",flex:1}}>
            {NAV_ITEMS.map(item=>(
              <button key={item.id} onClick={()=>setSection(item.id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",marginBottom:4,
                  background:section===item.id?`${T.prot}12`:"none",
                  color:section===item.id?T.prot:T.mu,
                  fontSize:15,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",
                  borderLeft:section===item.id?`3px solid ${T.prot}`:"3px solid transparent",
                  transition:"all 0.15s"}}>
                <span style={{fontSize:16}}>{item.icon}</span>
                {item.label}
                {item.id==="connect"&&connCount>0&&<span style={{marginLeft:"auto",background:T.prot,color:"#fff",borderRadius:10,fontSize:10,fontWeight:800,padding:"1px 7px"}}>{connCount}</span>}
              </button>
            ))}
          </div>
          {/* Sidebar bottom: today summary */}
          <div style={{padding:"16px",borderTop:`1px solid ${T.bd}`}}>
            <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:10,fontFamily:"'DM Mono',monospace"}}>Today</div>
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
              <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,fontStyle:"italic",textTransform:"uppercase",color:T.white,marginTop:2}}>Hey, {profile.name}</div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <div style={{background:`rgba(232,52,28,0.1)`,border:`1px solid rgba(232,52,28,0.25)`,borderRadius:20,padding:"5px 14px",color:T.prot,fontSize:10,fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{cfg.emoji} {todayType.toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Mobile top bar */}
        {isMobile&&(
          <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.bd}`,flexShrink:0,background:T.s1}}>
            <Logo size={24}/>
            <div style={{display:"flex",gap:6}}>
              <div style={{background:"rgba(232,52,28,0.1)",border:"1px solid rgba(232,52,28,0.2)",borderRadius:20,padding:"4px 10px",color:T.prot,fontSize:9,fontWeight:500,letterSpacing:"0.12em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{cfg.emoji} {todayFocus.slice(0,10).toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{flex:1,padding:isMobile?"0":"20px 32px 24px",overflowY:isMobile?"auto":"visible"}}>
          {section==="fuel"&&<FuelSection log={log} setLog={setLog} macros={macros} consumed={consumed} remaining={remaining} cfg={cfg} todayType={todayType} todayFocus={todayFocus} earnedCals={earnedCals} todayActs={todayActs} fuelScreen={fuelScreen} setFuelScreen={setFuelScreen} foodInput={foodInput} setFoodInput={setFoodInput} logging={logging} logMsg={logMsg} aiLog={aiLog} logMode={logMode} setLogMode={setLogMode} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} barcodeResult={barcodeResult} barcodeLoading={barcodeLoading} scanBarcode={scanBarcode} addBarcode={addBarcode} quickFields={quickFields} setQF={setQF} addQuick={addQuick} removeLog={removeLog} recs={recs} recsLoading={recsLoading} fetchRecs={fetchRecs} recipes={recipes} recipesLoading={recipesLoading} fetchRecipes={fetchRecipes} fastProto={fastProto} setFastProto={setFastProto} fastActive={fastActive} setFastActive={setFastActive} fastStart={fastStart} setFastStart={setFastStart} fastCustomH={fastCustomH} setFastCustomH={setFastCustomH} fastHours={fastHours} fastElapsed={fastElapsed} fastPct={fastPct} fastRemaining={fastRemaining} eatOpen={eatOpen} city={city} setCity={setCity} isMobile={isMobile} user={user}/>}
          {section==="train"&&<TrainSection profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} trainScreen={trainScreen} setTrainScreen={setTrainScreen} workout={workout} workoutLoading={workoutLoading} generateWorkout={generateWorkout} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} restActive={restActive} restTimer={restTimer} logSet={logSet} finishWorkout={finishWorkout} getSuggestion={getSuggestion} history={history} planMode={planMode} setPlanMode={setPlanMode} runPlan={runPlan} setRunPlan={setRunPlan} hybridMix={hybridMix} setHybridMix={setHybridMix} startStructured={startStructured} todayKey={todayKey} todayType={todayType} todayFocus={todayFocus} cfg={cfg} isMobile={isMobile} user={user}/>}
          {section==="connect"&&<ConnectSection stravaToken={stravaToken} setStravaToken={setStravaToken} stravaStatus={stravaStatus} stravaAthlete={stravaAthlete} stravaActs={stravaActs} connectStrava={connectStrava} ahActs={ahActs} garminActs={garminActs} fitbitActs={fitbitActs} importStatus={importStatus} handleFile={handleFile} fileRef={fileRef} allActs={allActs} todayActs={todayActs} earnedCals={earnedCals} isMobile={isMobile}/>}
          {section==="settings"&&<SettingsSection profile={profile} wPrefs={wPrefs} setWPrefs={setWPrefs} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} todayKey={todayKey} isMobile={isMobile} onSignOut={onSignOut} user={user}/>}
        </div>

        {/* Mobile bottom nav */}
        {isMobile&&(
          <div style={{position:"sticky",bottom:0,background:`${T.bg}f5`,backdropFilter:"blur(16px)",borderTop:`1px solid ${T.bd}`,display:"flex",zIndex:50,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
            {NAV_ITEMS.map(item=>(
              <button key={item.id} onClick={()=>setSection(item.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"10px 0",minHeight:56,fontSize:9,fontWeight:500,letterSpacing:"0.1em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",color:section===item.id?T.prot:T.mu,position:"relative",transition:"color 0.15s"}}>
                <div style={{fontSize:20,marginBottom:3,filter:section===item.id?"drop-shadow(0 0 8px rgba(232,52,28,0.5))":"none",transition:"filter 0.15s"}}>{item.icon}</div>
                {item.label}
                {item.id==="connect"&&connCount>0&&<span style={{position:"absolute",top:6,left:"58%",background:T.prot,color:T.white,borderRadius:6,fontSize:8,fontWeight:800,padding:"0 3px",lineHeight:"12px"}}>{connCount}</span>}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
