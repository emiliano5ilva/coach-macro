import { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, PrimaryBtn, Spinner, Logo } from "./components.jsx";

// ─── FUEL ONBOARDING ──────────────────────────────────────────────────────────
export function FuelOnboarding({d, onComplete, onBack}) {
  const [sc,setSc]=useState(0);
  const [data,setData]=useState({
    goal:"", goalWeight:"", goalTimeline:"", why:"", whyOther:"",
    dietary:[], mealFreq:"", fasting:"", alcohol:"", goalRate:"",
  });
  const upd=(k,v)=>setData(p=>({...p,[k]:v}));
  const auto=(k,v)=>{upd(k,v);setTimeout(()=>setSc(s=>s+1),260);};
  const next=()=>setSc(s=>s+1);
  const back=()=>sc===0?onBack():setSc(s=>s-1);
  const SCREENS=7;
  const pct=Math.round((sc/SCREENS)*100);
  const rateMap={"−750":-750,"−500":-500,"−250":-250,"−125":-125,"0":0,"+125":125,"+250":250,"+500":500};
  const goalCals=(d.baseTDEE||2000)+(rateMap[data.goalRate]||0);

  const WHY_OPTIONS=[
    {v:"health",e:"❤️",l:"Health & Longevity",sub:"Feel better, live longer"},
    {v:"confidence",e:"💪",l:"Confidence",sub:"Look and feel my best"},
    {v:"performance",e:"⚡",l:"Athletic Performance",sub:"Get stronger, faster, better"},
    {v:"aesthetic",e:"🔥",l:"Look Better",sub:"Body composition goals"},
    {v:"discipline",e:"🎯",l:"Discipline & Habits",sub:"Build a lifestyle, not a diet"},
    {v:"compete",e:"🏆",l:"Compete",sub:"Sport, Hyrox, powerlifting"},
  ];

  const RATE_INFO={
    cut:{
      "−500":{label:"−500 kcal/day",result:"~1 lb fat loss/week",rec:false},
      "−250":{label:"−250 kcal/day",result:"~0.5 lb/week",rec:false},
      "−125":{label:"−125 kcal/day",result:"~0.25 lb/week — gentlest",rec:false},
    },
    bulk:{
      "+125":{label:"+125 kcal/day",result:"~0.25 lb muscle/week — lean bulk",rec:false},
      "+250":{label:"+250 kcal/day",result:"~0.5 lb/week",rec:false},
      "+500":{label:"+500 kcal/day",result:"~1 lb/week — aggressive",rec:false},
    },
  };

  // Expert recommendation based on profile
  const getRec=()=>{
    if(data.goal==="cut"){
      if(d.metHistory==="3plus"||d.metHistory==="offon")return{rate:"−250",why:"You've dieted before — a smaller deficit prevents adaptation and preserves more muscle."};
      if(["4-6","7+"].includes(d.freq))return{rate:"−500",why:"You train frequently. A moderate deficit keeps performance high while losing fat."};
      return{rate:"−500",why:"A 500 kcal deficit produces ~1 lb/week fat loss — the most researched rate for maintaining muscle."};
    }
    if(data.goal==="bulk"){
      if(d.liftExp==="beginner")return{rate:"+250",why:"Beginners gain muscle fastest. A small surplus maximizes muscle while minimizing fat gain."};
      return{rate:"+125",why:"Advanced lifters gain muscle slowly regardless of surplus. Small surplus = more muscle, less fat."};
    }
    return null;
  };
  const rec=getRec();

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{width:"100%",maxWidth:480}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
          <Logo size={28}/>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Fuel Setup</div>
            <div style={{height:3,background:T.s3,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",background:T.carb,width:`${pct}%`,transition:"width .5s ease"}}/>
            </div>
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700}}>{pct}%</div>
        </div>
        {sc>0&&<button onClick={back} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:18,padding:"0 0 16px",fontFamily:"inherit"}}>← Back</button>}

        {/* SCREEN 0 — Goal */}
        {sc===0&&<div style={{animation:"fadeIn .3s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 1</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            YOUR FUEL<br/><span style={{color:T.carb}}>GOAL.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:24,lineHeight:1.65}}>Your base metabolic rate is <b style={{color:"#fff"}}>{(d.baseTDEE||2000).toLocaleString()} kcal/day</b>. Now let's set your target.</p>
          <div style={{display:"flex",gap:10,marginBottom:8}}>
            {[{v:"cut",l:"Cut",e:"🔥",sub:"Lose fat, preserve muscle"},{v:"maintain",l:"Maintain",e:"⚖️",sub:"Body recomp, stay lean"},{v:"bulk",l:"Bulk",e:"💪",sub:"Build muscle, gain size"}].map(o=>(
              <div key={o.v} onClick={()=>auto("goal",o.v)} style={{flex:1,background:data.goal===o.v?`${T.carb}12`:T.s2,border:`2px solid ${data.goal===o.v?T.carb:T.bd}`,borderRadius:12,padding:"20px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:28,marginBottom:8}}>{o.e}</div>
                <div style={{fontSize:15,fontWeight:700,color:data.goal===o.v?T.carb:"#fff"}}>{o.l}</div>
                <div style={{fontSize:10,color:T.mu,marginTop:4,lineHeight:1.4}}>{o.sub}</div>
              </div>
            ))}
          </div>
          {data.goal==="maintain"&&<div style={{background:`${T.carb}08`,border:`1px solid ${T.carb}25`,borderRadius:10,padding:"12px 14px",marginTop:8,fontSize:12,color:T.mu,lineHeight:1.65}}>
            💡 <b style={{color:"#fff"}}>Body recomp</b> — lose fat and build muscle simultaneously. Works best for beginners and those returning after a break. Requires consistent protein and progressive training.
          </div>}
        </div>}

        {/* SCREEN 1 — Goal Weight */}
        {sc===1&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 2</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            TARGET<br/><span style={{color:T.carb}}>WEIGHT.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Current: <b style={{color:"#fff"}}>{d.startWeight} {d.wUnit||"lbs"}</b>. Where do you want to be?</p>
          <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:16}}>
            <input value={data.goalWeight} onChange={e=>upd("goalWeight",e.target.value)} type="number" placeholder={data.goal==="cut"?String(Math.round((d.startWeight||180)*0.9)):String(Math.round((d.startWeight||180)*1.1))}
              style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:32,fontWeight:700,outline:"none",fontFamily:"inherit",textAlign:"center",boxSizing:"border-box"}}/>
            <div style={{textAlign:"center",fontSize:13,color:T.mu,marginTop:4}}>{d.wUnit||"lbs"}</div>
          </div>
          {data.goalWeight&&<div style={{background:`${T.carb}08`,border:`1px solid ${T.carb}20`,borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:13,color:T.mu}}>
            Difference: <b style={{color:data.goal==="cut"?T.carb:T.prot}}>{data.goal==="cut"?"-":"+"}{ Math.abs(parseFloat(data.goalWeight)-(d.startWeight||0)).toFixed(1)} {d.wUnit||"lbs"}</b>
          </div>}
          <PrimaryBtn onClick={next} label="Continue →" disabled={!data.goalWeight} style={{background:T.carb}}/>
          <button onClick={next} style={{width:"100%",padding:"11px",background:"none",color:T.mu,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,marginTop:8}}>Skip — I don't have a specific target</button>
        </div>}

        {/* SCREEN 2 — Timeline */}
        {sc===2&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 3</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            WHEN DO YOU<br/><span style={{color:T.carb}}>WANT IT?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>We'll use this to recommend a calorie deficit or surplus rate that keeps you on track.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {(data.goal==="cut"?[
              {v:"4w",l:"4 Weeks",sub:"Very aggressive — possible but hard",warn:true},
              {v:"8w",l:"8 Weeks",sub:"Focused sprint — great for events"},
              {v:"12w",l:"12 Weeks",sub:"Most recommended — sustainable"},
              {v:"6m",l:"6 Months",sub:"Slow and steady — lasting results"},
              {v:"1y",l:"1 Year",sub:"Lifestyle change — long game"},
              {v:"ongoing",l:"Ongoing",sub:"No deadline — just keep going"},
            ]:data.goal==="bulk"?[
              {v:"8w",l:"8 Weeks",sub:"Short bulk — mini cut after"},
              {v:"12w",l:"12 Weeks",sub:"Standard bulk cycle"},
              {v:"6m",l:"6 Months",sub:"Longer bulk — more muscle"},
              {v:"1y",l:"1 Year",sub:"Full year build — serious gains"},
            ]:[
              {v:"ongoing",l:"Ongoing",sub:"Maintenance is a lifestyle"},
              {v:"12w",l:"12 Weeks",sub:"Check in at 3 months"},
              {v:"6m",l:"6 Months",sub:"Check in at 6 months"},
            ]).map(o=>(
              <div key={o.v} onClick={()=>auto("goalTimeline",o.v)} style={{background:data.goalTimeline===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.goalTimeline===o.v?T.carb:o.warn?"rgba(255,77,109,.3)":T.bd}`,borderRadius:11,padding:"14px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:14,fontWeight:700,color:data.goalTimeline===o.v?T.carb:o.warn?"#FF4D6D":"#fff"}}>{o.l}</div>
                <div style={{fontSize:11,color:T.mu,marginTop:3,lineHeight:1.4}}>{o.sub}</div>
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 3 — The WHY */}
        {sc===3&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 4</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            WHY DOES<br/><span style={{color:T.carb}}>THIS MATTER?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>We use this for daily motivation, pre-workout messages, and hard-day reminders. Pick the one that hits hardest.</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {WHY_OPTIONS.map(o=>(
              <div key={o.v} onClick={()=>auto("why",o.v)} style={{background:data.why===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.why===o.v?T.carb:T.bd}`,borderRadius:11,padding:"14px 16px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:22,width:32,textAlign:"center",flexShrink:0}}>{o.e}</div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:data.why===o.v?T.carb:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>
                </div>
                {data.why===o.v&&<div style={{marginLeft:"auto",color:T.carb,fontSize:16}}>✓</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 4 — Calorie target / Rate */}
        {sc===4&&data.goal!=="maintain"&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 5</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            YOUR CALORIE<br/><span style={{color:T.carb}}>RATE.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:16}}>TDEE: <b style={{color:"#fff"}}>{(d.baseTDEE||2000).toLocaleString()} kcal</b>. Choose your deficit or surplus.</p>
          {rec&&<div style={{background:`${T.carb}08`,border:`1.5px solid ${T.carb}35`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>⭐ Expert pick for you</div>
            <div style={{fontSize:13,color:"#ccc",lineHeight:1.65,marginBottom:10}}>{rec.why}</div>
            <button onClick={()=>upd("goalRate",rec.rate)} style={{padding:"8px 16px",background:data.goalRate===rec.rate?T.carb:`${T.carb}18`,color:data.goalRate===rec.rate?"#000":T.carb,border:`1px solid ${T.carb}40`,borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>
              {data.goalRate===rec.rate?"✓ Selected":rec.rate+" — Select This"}
            </button>
          </div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {Object.entries(RATE_INFO[data.goal]||{}).map(([rate,info])=>(
              <div key={rate} onClick={()=>upd("goalRate",rate)} style={{background:data.goalRate===rate?`${T.carb}10`:T.s2,border:`1.5px solid ${data.goalRate===rate?T.carb:rec&&rate===rec.rate?`${T.carb}30`:T.bd}`,borderRadius:10,padding:"12px 15px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all .2s"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:data.goalRate===rate?T.carb:"#fff"}}>{info.label}</div>
                  <div style={{fontSize:11,color:T.mu,marginTop:2}}>{info.result}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {rec&&rate===rec.rate&&<div style={{fontSize:9,color:T.carb,background:`${T.carb}15`,border:`1px solid ${T.carb}30`,borderRadius:6,padding:"2px 7px",fontWeight:700}}>Recommended</div>}
                  {data.goalRate===rate&&<div style={{color:T.carb}}>✓</div>}
                </div>
              </div>
            ))}
          </div>
          {data.goalRate&&<div style={{background:"#070E1A",border:`1px solid ${T.carb}30`,borderRadius:12,padding:"16px",marginBottom:16}}>
            <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Daily Target</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:T.carb,lineHeight:1}}>{goalCals.toLocaleString()}</div>
            <div style={{fontSize:13,color:T.mu,marginTop:4}}>kcal/day · {data.goal} phase</div>
          </div>}
          <PrimaryBtn onClick={next} label="Continue →" disabled={!data.goalRate} style={{background:T.carb}}/>
        </div>}
        {sc===4&&data.goal==="maintain"&&(()=>{setTimeout(next,100);return null;})()}

        {/* SCREEN 5 — Dietary preferences */}
        {sc===5&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 6</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            DIETARY<br/><span style={{color:T.carb}}>PREFERENCES.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Select all that apply. This shapes your meal and recipe suggestions.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {[{v:"none",l:"No restrictions",e:"🍗"},{v:"vegetarian",l:"Vegetarian",e:"🥗"},{v:"vegan",l:"Vegan",e:"🌱"},{v:"gluten",l:"Gluten-free",e:"🌾"},{v:"dairy",l:"Dairy-free",e:"🥛"},{v:"keto",l:"Keto / Low-carb",e:"🥑"},{v:"halal",l:"Halal",e:"☪️"},{v:"kosher",l:"Kosher",e:"✡️"}].map(o=>{
              const sel=(data.dietary||[]).includes(o.v);
              return(<div key={o.v} onClick={()=>upd("dietary",sel?(data.dietary||[]).filter(x=>x!==o.v):[...(data.dietary||[]),o.v])} style={{background:sel?`${T.carb}12`:T.s2,border:`1.5px solid ${sel?T.carb:T.bd}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s"}}>
                <div style={{fontSize:18}}>{o.e}</div>
                <div style={{fontSize:13,fontWeight:600,color:sel?T.carb:"#ccc"}}>{o.l}</div>
                {sel&&<div style={{marginLeft:"auto",color:T.carb,fontSize:12}}>✓</div>}
              </div>);
            })}
          </div>
          <PrimaryBtn onClick={next} label="Continue →" style={{background:T.carb}}/>
        </div>}

        {/* SCREEN 6 — Meal frequency + fasting */}
        {sc===6&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 7</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            HOW DO YOU<br/><span style={{color:T.carb}}>LIKE TO EAT?</span>
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Meals per day</div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {["2","3","4","5","6+"].map(n=>(
              <div key={n} onClick={()=>upd("mealFreq",n)} style={{flex:1,minWidth:52,background:data.mealFreq===n?`${T.carb}12`:T.s2,border:`1.5px solid ${data.mealFreq===n?T.carb:T.bd}`,borderRadius:10,padding:"14px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:data.mealFreq===n?T.carb:"#fff"}}>{n}</div>
                <div style={{fontSize:9,color:T.mu,marginTop:2}}>meals</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Interested in intermittent fasting?</div>
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {[{v:"no",l:"No"},  {v:"16:8",l:"16:8"},{v:"omad",l:"OMAD"},{v:"custom",l:"Custom"}].map(o=>(
              <div key={o.v} onClick={()=>upd("fasting",o.v)} style={{flex:1,background:data.fasting===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.fasting===o.v?T.carb:T.bd}`,borderRadius:10,padding:"12px 6px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:13,fontWeight:700,color:data.fasting===o.v?T.carb:"#ccc"}}>{o.l}</div>
              </div>
            ))}
          </div>
          <PrimaryBtn onClick={()=>onComplete({...data,goalCals:data.goal==="maintain"?d.baseTDEE:goalCals})} label="Fuel Setup Done →" disabled={!data.goal||!data.mealFreq} style={{background:T.carb}}/>
        </div>}
      </div>
    </div>
  );
}

// ─── TRAIN ONBOARDING ─────────────────────────────────────────────────────────
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

export const GVT_INFO = "German Volume Training — 10 sets × 10 reps of one compound lift per session. Brutal, proven hypertrophy method. Added as Week 4 of every month. Automatically swaps your main compound for 10×10 at 60% of your working weight.";

export function TrainOnboarding({d, onComplete, onBack}) {
  const [sc,setSc]=useState(0);
  const [data,setData]=useState({
    freq:"", trainType:"lifting", split:"", equipment:"Full Gym",
    sessionLength:60, weakPoints:[], injuries:[], longRunDay:"Sunday",
    liftExp:"", cardioExp:"", gvt:false, hybridStyle:"",
  });
  const upd=(k,v)=>setData(p=>({...p,[k]:v}));
  const auto=(k,v)=>{upd(k,v);setTimeout(()=>setSc(s=>s+1),260);};
  const next=()=>setSc(s=>s+1);
  const back=()=>sc===0?onBack():setSc(s=>s-1);
  const SCREENS=8;
  const pct=Math.round((sc/SCREENS)*100);

  const daysNum={n0:0,"1-2":2,"3":3,"4":4,"5":5,"6":6,"7":7}[data.freq]||0;
  const availableSplits=SPLITS_WITH_DAYS[daysNum]||SPLITS_WITH_DAYS[3];
  const recSplit=availableSplits.find(s=>s.rec&&s.levels.includes(data.liftExp||"intermediate"))||availableSplits[0];

  const MUSCLES=["Chest","Back","Shoulders","Biceps","Triceps","Legs","Glutes","Core","Calves"];
  const INJURY_OPTS=["Lower back","Knees","Shoulders","Wrists","Elbows","Hips","Neck","None"];

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
          <Logo size={28}/>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Train Setup</div>
            <div style={{height:3,background:T.s3,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",background:T.prot,width:`${pct}%`,transition:"width .5s ease"}}/>
            </div>
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700}}>{pct}%</div>
        </div>
        {sc>0&&<button onClick={back} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:18,padding:"0 0 16px",fontFamily:"inherit"}}>← Back</button>}

        {/* SCREEN 0 — Training Type */}
        {sc===0&&<div style={{animation:"fadeIn .3s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 1</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            WHAT'S YOUR<br/><span style={{color:T.prot}}>TRAINING FOCUS?</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {v:"lifting",e:"🏋️",l:"Lifting / Strength",sub:"Hypertrophy, powerlifting, bodybuilding — weights are your primary focus"},
              {v:"running",e:"🏃",l:"Running",sub:"5K, 10K, half marathon, marathon — structured run programming"},
              {v:"hybrid",e:"⚡",l:"Hybrid Athlete",sub:"Lift AND run — structured mix of strength and endurance"},
              {v:"hyrox",e:"🔥",l:"Hyrox",sub:"8 functional stations + 1km run between each — race-specific prep"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("trainType",o.v)} style={{background:data.trainType===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.trainType===o.v?T.prot:T.bd}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:16}}>
                <div style={{fontSize:28,flexShrink:0}}>{o.e}</div>
                <div><div style={{fontSize:15,fontWeight:700,color:data.trainType===o.v?T.prot:"#fff"}}>{o.l}</div><div style={{fontSize:12,color:T.mu,marginTop:3,lineHeight:1.5}}>{o.sub}</div></div>
                {data.trainType===o.v&&<div style={{marginLeft:"auto",color:T.prot}}>✓</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 1 — Experience */}
        {sc===1&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 2</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            TRAINING<br/><span style={{color:T.prot}}>EXPERIENCE.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>This determines your split, progression speed, and volume. Be honest — the right program beats the advanced one every time.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {v:"beginner",l:"Beginner",sub:"Less than 1 year of consistent training",detail:"You'll progress fast on almost any program. Full Body or Upper/Lower will give you the best results."},
              {v:"intermediate",l:"Intermediate",sub:"1–3 years consistent, good form on main lifts",detail:"You need more volume and frequency. PPL or Upper/Lower gives you the stimulus you need."},
              {v:"advanced",l:"Advanced",sub:"3+ years consistent, near your genetic ceiling",detail:"You need high volume, smart periodization, and variety to keep progressing. Arnold or PPL 6-day."},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("liftExp",o.v)} style={{background:data.liftExp===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.liftExp===o.v?T.prot:T.bd}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:15,fontWeight:700,color:data.liftExp===o.v?T.prot:"#fff",marginBottom:3}}>{o.l}</div>
                <div style={{fontSize:12,color:T.mu,marginBottom:data.liftExp===o.v?8:0}}>{o.sub}</div>
                {data.liftExp===o.v&&<div style={{fontSize:12,color:"#aaa",lineHeight:1.6,borderTop:`1px solid ${T.bd}`,paddingTop:8}}>{o.detail}</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 2 — Days per week */}
        {sc===2&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 3</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            DAYS PER<br/><span style={{color:T.prot}}>WEEK.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>How many days can you realistically commit to training? Be honest — consistency beats intensity.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
            {[{v:"1-2",n:"1–2",sub:"Light"},{v:"3",n:"3",sub:"Standard"},{v:"4",n:"4",sub:"Dedicated"},{v:"5",n:"5",sub:"Serious"},{v:"6",n:"6",sub:"Advanced"},{v:"7",n:"7",sub:"Athlete"}].map(o=>(
              <div key={o.v} onClick={()=>upd("freq",o.v)} style={{background:data.freq===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.freq===o.v?T.prot:T.bd}`,borderRadius:11,padding:"18px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,color:data.freq===o.v?T.prot:"#fff",lineHeight:1}}>{o.n}</div>
                <div style={{fontSize:10,color:T.mu,marginTop:4}}>{o.sub}</div>
              </div>
            ))}
          </div>
          {data.freq&&recSplit&&<div style={{background:`${T.prot}08`,border:`1px solid ${T.prot}25`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
            <div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>⭐ We recommend for {data.freq} days</div>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:4}}>{recSplit.l}</div>
            <div style={{fontSize:12,color:T.mu,lineHeight:1.65}}>{recSplit.desc}</div>
          </div>}
          <PrimaryBtn onClick={next} label="Continue →" disabled={!data.freq}/>
        </div>}

        {/* SCREEN 3 — Split selection */}
        {sc===3&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 4</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            CHOOSE YOUR<br/><span style={{color:T.prot}}>SPLIT.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:16}}>Based on {data.freq} days/week. The ⭐ is our recommendation for your experience level.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {(availableSplits||[]).map(s=>{
              const isRec=s.id===(recSplit?.id);
              return(
                <div key={s.id} onClick={()=>upd("split",s.id)} style={{background:data.split===s.id?`${T.prot}10`:T.s2,border:`1.5px solid ${data.split===s.id?T.prot:isRec?`${T.prot}30`:T.bd}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:20}}>{s.e}</span>
                      <span style={{fontSize:15,fontWeight:700,color:data.split===s.id?T.prot:"#fff"}}>{s.l}</span>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {isRec&&<div style={{background:`${T.prot}15`,border:`1px solid ${T.prot}30`,borderRadius:6,padding:"2px 8px",fontSize:9,color:T.prot,fontWeight:700}}>⭐ Recommended</div>}
                      {s.gvt&&<div style={{background:"rgba(255,215,64,.1)",border:"1px solid rgba(255,215,64,.25)",borderRadius:6,padding:"2px 8px",fontSize:9,color:T.fat,fontWeight:700}}>GVT ready</div>}
                    </div>
                  </div>
                  <div style={{fontSize:12,color:T.mu,lineHeight:1.6}}>{s.desc}</div>
                </div>
              );
            })}
          </div>
          <PrimaryBtn onClick={next} label="Continue →" disabled={!data.split}/>
        </div>}

        {/* SCREEN 4 — Equipment */}
        {sc===4&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 5</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            EQUIPMENT<br/><span style={{color:T.prot}}>ACCESS.</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {[
              {v:"Full Gym",e:"🏢",l:"Full Gym",sub:"Barbells, cables, machines, dumbbells — everything"},
              {v:"Home Gym",e:"🏠",l:"Home Gym",sub:"Dumbbells, barbell, maybe a rack"},
              {v:"Dumbbells Only",e:"🏃",l:"Dumbbells Only",sub:"Limited equipment — we'll substitute intelligently"},
              {v:"Bodyweight Only",e:"💪",l:"Bodyweight Only",sub:"No equipment — calisthenics progressions"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("equipment",o.v)} style={{background:data.equipment===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.equipment===o.v?T.prot:T.bd}`,borderRadius:12,padding:"14px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:24,flexShrink:0}}>{o.e}</div>
                <div><div style={{fontSize:14,fontWeight:700,color:data.equipment===o.v?T.prot:"#fff"}}>{o.l}</div><div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div></div>
                {data.equipment===o.v&&<div style={{marginLeft:"auto",color:T.prot}}>✓</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 5 — Session Length */}
        {sc===5&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 6</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            SESSION<br/><span style={{color:T.prot}}>LENGTH.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>How long do you have per session? We'll size the workout accordingly.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:20}}>
            {[{v:30,l:"30 min",sub:"Quick — compounds only"},{v:45,l:"45 min",sub:"Efficient — 4-5 exercises"},{v:60,l:"60 min",sub:"Standard — full session"},{v:75,l:"75 min",sub:"Extended — high volume"},{v:90,l:"90 min",sub:"Full send — everything"},{v:120,l:"2+ hours",sub:"Dedicated athlete"}].map(o=>(
              <div key={o.v} onClick={()=>upd("sessionLength",o.v)} style={{background:data.sessionLength===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.sessionLength===o.v?T.prot:T.bd}`,borderRadius:11,padding:"14px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:16,fontWeight:700,color:data.sessionLength===o.v?T.prot:"#fff"}}>{o.l}</div>
                <div style={{fontSize:11,color:T.mu,marginTop:3}}>{o.sub}</div>
              </div>
            ))}
          </div>
          <PrimaryBtn onClick={next} label="Continue →"/>
        </div>}

        {/* SCREEN 6 — Weak Points */}
        {sc===6&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 7</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            WEAK POINTS<br/><span style={{color:T.prot}}>TO PRIORITIZE.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Select muscles you want to bring up. We'll add extra sets and frequency for these.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
            {MUSCLES.map(m=>{
              const sel=(data.weakPoints||[]).includes(m);
              return(<div key={m} onClick={()=>upd("weakPoints",sel?(data.weakPoints||[]).filter(x=>x!==m):[...(data.weakPoints||[]),m])} style={{background:sel?`${T.prot}12`:T.s2,border:`1.5px solid ${sel?T.prot:T.bd}`,borderRadius:10,padding:"12px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:13,fontWeight:600,color:sel?T.prot:"#ccc"}}>{m}</div>
                {sel&&<div style={{fontSize:10,color:T.prot,marginTop:3}}>Priority</div>}
              </div>);
            })}
          </div>
          <PrimaryBtn onClick={next} label="Continue →"/>
        </div>}

        {/* SCREEN 7 — Injuries + GVT + Done */}
        {sc===7&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Final Step</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            LAST FEW<br/><span style={{color:T.prot}}>THINGS.</span>
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Any injuries or limitations?</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:20}}>
            {INJURY_OPTS.map(m=>{
              const sel=(data.injuries||[]).includes(m);
              return(<div key={m} onClick={()=>upd("injuries",sel?(data.injuries||[]).filter(x=>x!==m):[...(data.injuries||[]),m])} style={{background:sel?`rgba(255,77,109,.1)`:T.s2,border:`1.5px solid ${sel?"rgba(255,77,109,.4)":T.bd}`,borderRadius:10,padding:"11px 12px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontSize:12,fontWeight:600,color:sel?"#FF4D6D":"#ccc"}}>{m}</div>
                {sel&&<div style={{marginLeft:"auto",color:"#FF4D6D",fontSize:11}}>⚠️</div>}
              </div>);
            })}
          </div>
          {/* GVT Option — only for compatible splits */}
          {(availableSplits||[]).find(s=>s.id===data.split)?.gvt&&<div style={{background:`rgba(255,215,64,.06)`,border:"1px solid rgba(255,215,64,.2)",borderRadius:12,padding:"16px",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.fat,marginBottom:4}}>💀 German Volume Training Week</div>
                <div style={{fontSize:12,color:T.mu,lineHeight:1.65,maxWidth:320}}>{GVT_INFO}</div>
              </div>
              <div onClick={()=>upd("gvt",!data.gvt)} style={{width:44,height:24,borderRadius:12,background:data.gvt?T.fat:T.s3,cursor:"pointer",position:"relative",flexShrink:0,marginLeft:12,transition:"all .3s"}}>
                <div style={{position:"absolute",top:3,left:data.gvt?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
              </div>
            </div>
          </div>}
          <PrimaryBtn onClick={()=>onComplete(data)} label="Build My Program →"/>
        </div>}
      </div>
    </div>
  );
}

