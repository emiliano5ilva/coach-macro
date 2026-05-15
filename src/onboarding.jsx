import { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, PrimaryBtn, Spinner, Logo } from "./components.jsx";
import { estimateFrom, formatRaceTime, parseTimeInput } from "./utils/runningPaces.js";
import { RECOVERY_MESO_MAP, getMesoLength } from "./utils/ait.js";

// ─── FUEL ONBOARDING ──────────────────────────────────────────────────────────
export function FuelOnboarding({d, onComplete, onBack}) {
  const [sc,setSc]=useState(0);
  const [data,setData]=useState({
    goal:"", goalWeight:"", goalTimeline:"", why:"", whyOther:"",
    dietary:[], mealFreq:"", fasting:"", alcohol:"", goalRate:"", macroExp:"",
    waterMode:"calculate", waterCustomOz:"",
  });
  const upd=(k,v)=>setData(p=>({...p,[k]:v}));
  const auto=(k,v)=>{upd(k,v);setTimeout(()=>setSc(s=>s+1),260);};
  const next=()=>setSc(s=>s+1);
  const back=()=>sc===0?onBack():setSc(s=>s-1);
  const SCREENS=9;
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
    <div className="ob-page">
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="ob-inner">
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
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:8}}>
            {[
              {v:"cut",l:"Lose Fat",e:"🔥",sub:"Create a calorie deficit and reveal muscle"},
              {v:"bulk",l:"Build Muscle",e:"💪",sub:"Lean bulk phase for maximum muscle growth"},
              {v:"maintain",l:"Maintain",e:"⚖️",sub:"Keep your current weight and body composition"},
              {v:"recomp",l:"Recomposition",e:"🔄",sub:"Lose fat and build muscle simultaneously"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("goal",o.v)} style={{background:data.goal===o.v?`${T.carb}12`:T.s2,border:`2px solid ${data.goal===o.v?T.carb:T.bd}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:28,flexShrink:0}}>{o.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:700,color:data.goal===o.v?T.carb:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:12,color:T.mu,marginTop:3,lineHeight:1.4}}>{o.sub}</div>
                </div>
                {data.goal===o.v&&<div style={{color:T.carb,fontSize:16,flexShrink:0}}>✓</div>}
              </div>
            ))}
          </div>
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

        {/* SCREEN 2 — Timeline (math-based, no impossible options) */}
        {sc===2&&(()=>{
          const startW=parseFloat(d.startWeight)||parseFloat(d.weight)||0;
          const goalW=parseFloat(data.goalWeight)||startW;
          const diff=Math.abs(startW-goalW);
          // Max safe rates: cut 1% bw/week, bulk 0.5% bw/week
          const maxWeekly=data.goal==="cut"?Math.min(startW*0.01,2):Math.min(startW*0.005,1);
          const minWeeks=diff>0?Math.ceil(diff/maxWeekly):0;
          // Build realistic options
          const cutOptions=[
            {v:"12w",weeks:12,l:"12 Weeks",rate:diff/12},
            {v:"16w",weeks:16,l:"16 Weeks",rate:diff/16},
            {v:"24w",weeks:24,l:"24 Weeks (~6 months)",rate:diff/24},
            {v:"52w",weeks:52,l:"1 Year",rate:diff/52},
            {v:"ongoing",weeks:null,l:"Ongoing — no deadline",rate:null},
          ].filter(o=>o.weeks===null||o.weeks>=minWeeks);
          const bulkOptions=[
            {v:"8w",weeks:8,l:"8 Weeks",rate:diff/8},
            {v:"12w",weeks:12,l:"12 Weeks",rate:diff/12},
            {v:"24w",weeks:24,l:"6 Months",rate:diff/24},
            {v:"52w",weeks:52,l:"1 Year",rate:diff/52},
          ].filter(o=>o.weeks>=minWeeks);
          const options=data.goal==="cut"?cutOptions:data.goal==="bulk"?bulkOptions:[
            {v:"ongoing",weeks:null,l:"Ongoing",rate:null},
            {v:"12w",weeks:12,l:"12 Weeks",rate:null},
            {v:"24w",weeks:24,l:"6 Months",rate:null},
          ];
          const getRec=()=>{
            if(data.goal==="cut") return options.find(o=>o.rate&&o.rate>=0.5&&o.rate<=1)||options[0];
            if(data.goal==="bulk") return options.find(o=>o.rate&&o.rate<=0.5)||options[0];
            return options[0];
          };
          const rec=getRec();
          return(
            <div style={{animation:"fadeIn .25s ease"}}>
              <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 3</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                WHEN DO YOU<br/><span style={{color:T.carb}}>WANT IT?</span>
              </div>
              {diff>0&&<div style={{background:`${T.carb}08`,border:`1px solid ${T.carb}25`,borderRadius:12,padding:"14px 16px",marginBottom:16,fontSize:13,color:"#aaa",lineHeight:1.7}}>
                <b style={{color:"#fff"}}>{diff.toFixed(0)} {d.wUnit||"lbs"} to {data.goal==="cut"?"lose":"gain"}.</b> At a safe max of <b style={{color:T.carb}}>{maxWeekly.toFixed(1)} lbs/week</b>, the fastest realistic timeline is <b style={{color:"#fff"}}>{minWeeks} weeks</b>. Options below are all achievable.
              </div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {options.map(o=>{
                  const isRec=o.v===rec?.v;
                  const rateStr=o.rate?`~${o.rate.toFixed(1)} lbs/week`:"Flexible pace";
                  const isSafe=!o.rate||(data.goal==="cut"?o.rate<=1:o.rate<=0.5);
                  return(
                    <div key={o.v} onClick={()=>auto("goalTimeline",o.v)} style={{background:data.goalTimeline===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.goalTimeline===o.v?T.carb:isRec?`${T.carb}40`:T.bd}`,borderRadius:11,padding:"14px",cursor:"pointer",transition:"all .2s",position:"relative"}}>
                      {isRec&&<div style={{position:"absolute",top:-8,left:12,background:T.carb,color:"#000",fontSize:8,fontWeight:800,padding:"2px 8px",borderRadius:6,letterSpacing:1}}>RECOMMENDED</div>}
                      <div style={{fontSize:14,fontWeight:700,color:data.goalTimeline===o.v?T.carb:"#fff"}}>{o.l}</div>
                      <div style={{fontSize:11,color:isSafe?T.mu:"#FF4D6D",marginTop:3}}>{rateStr}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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

        {/* SCREEN 4 — Macro tracking experience */}
        {sc===4&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 5</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            HAVE YOU TRACKED<br/><span style={{color:T.carb}}>MACROS BEFORE?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>Your experience level changes how we coach you — beginner-friendly or detail-heavy.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {v:"never",e:"🌱",l:"Never tracked — I'm new to this",sub:"We'll keep it simple and build your understanding gradually"},
              {v:"tried",e:"🔄",l:"Tried it but found it hard",sub:"We'll make it easier with smart defaults and flexible logging"},
              {v:"occasional",e:"📊",l:"I track occasionally",sub:"You know the basics — we'll help you be more consistent"},
              {v:"consistent",e:"⚡",l:"I track consistently",sub:"Show me all the detail — I want full control over my numbers"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("macroExp",o.v)} style={{background:data.macroExp===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.macroExp===o.v?T.carb:T.bd}`,borderRadius:14,padding:"14px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:24,flexShrink:0,width:32,textAlign:"center"}}>{o.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:data.macroExp===o.v?T.carb:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:12,color:T.mu,marginTop:3,lineHeight:1.4}}>{o.sub}</div>
                </div>
                {data.macroExp===o.v&&<div style={{color:T.carb,fontSize:16,flexShrink:0}}>✓</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 5 — Water goal */}
        {sc===5&&(()=>{
          const wLbs=d.wUnit==="kg"?(parseFloat(d.weight||70)*2.205):parseFloat(d.weight||160);
          const calcOz=Math.round(wLbs*0.5);
          const weightDisplay=d.wUnit==="kg"?`${parseFloat(d.weight||70)}kg`:`${parseFloat(d.weight||160)}lbs`;
          return(
            <div style={{animation:"fadeIn .25s ease"}}>
              <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--red)",fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:8}}>// STEP 5b of 9</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:48,lineHeight:.88,marginBottom:16,color:"var(--white)",textTransform:"uppercase"}}>
                Water<br/><span style={{color:"var(--red)"}}>Target.</span>
              </div>
              <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>Your daily hydration goal. We'll track this in the Fuel tab.</p>
              {/* Toggle */}
              <div style={{display:"flex",gap:8,marginBottom:24}}>
                <button onClick={()=>upd("waterMode","calculate")} style={{flex:1,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,textTransform:"uppercase",letterSpacing:1,background:data.waterMode==="calculate"?"var(--red)":"rgba(245,245,240,0.06)",color:data.waterMode==="calculate"?"#fff":"rgba(245,245,240,0.5)",border:data.waterMode==="calculate"?"none":"1px solid rgba(245,245,240,0.12)",transition:"all 0.2s"}}>Calculate</button>
                <button onClick={()=>upd("waterMode","custom")} style={{flex:1,padding:"12px",borderRadius:12,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:14,textTransform:"uppercase",letterSpacing:1,background:data.waterMode==="custom"?"var(--red)":"rgba(245,245,240,0.06)",color:data.waterMode==="custom"?"#fff":"rgba(245,245,240,0.5)",border:data.waterMode==="custom"?"1px solid rgba(245,245,240,0.12)":"none",transition:"all 0.2s"}}>Custom</button>
              </div>
              {data.waterMode==="calculate"&&(
                <div style={{textAlign:"center",padding:"20px 0 24px"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:64,lineHeight:1,color:"var(--white)",marginBottom:8}}>{calcOz} <span style={{fontSize:28}}>oz</span></div>
                  <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--white-dim)",letterSpacing:"0.12em"}}>Based on {weightDisplay} bodyweight</div>
                </div>
              )}
              {data.waterMode==="custom"&&(
                <div style={{marginBottom:24}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input type="number" placeholder="e.g. 80" value={data.waterCustomOz} onChange={e=>upd("waterCustomOz",e.target.value)} min={20} max={300} style={{flex:1,background:"rgba(245,245,240,0.06)",border:"1px solid rgba(245,245,240,0.2)",borderRadius:12,padding:"14px 16px",color:"#fff",fontSize:22,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,outline:"none",textAlign:"center"}}/>
                    <div style={{fontFamily:"var(--mono)",fontSize:14,color:"var(--white-dim)",padding:"0 8px"}}>{d.wUnit==="kg"?"ml":"oz"}</div>
                  </div>
                  {data.waterCustomOz&&<div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--white-faint)",marginTop:8,textAlign:"center",letterSpacing:"0.1em"}}>Formula: {calcOz} oz — Your custom: {data.waterCustomOz} oz</div>}
                </div>
              )}
              <PrimaryBtn onClick={next} label="Continue →" disabled={data.waterMode==="custom"&&!parseFloat(data.waterCustomOz)} style={{background:"var(--red)"}}/>
            </div>
          );
        })()}

        {/* SCREEN 6 — Calorie target / Rate */}
        {sc===6&&data.goal!=="maintain"&&data.goal!=="recomp"&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 7</div>
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
            <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:6}}>Daily Target</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:T.carb,lineHeight:1}}>{goalCals.toLocaleString()}</div>
            <div style={{fontSize:13,color:T.mu,marginTop:4}}>kcal/day · {data.goal} phase</div>
          </div>}
          <PrimaryBtn onClick={next} label="Continue →" disabled={!data.goalRate} style={{background:T.carb}}/>
        </div>}
        {sc===6&&(data.goal==="maintain"||data.goal==="recomp")&&(()=>{setTimeout(next,100);return null;})()}

        {/* SCREEN 7 — Dietary preferences */}
        {sc===7&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            ANY DIETARY<br/><span style={{color:T.carb}}>NEEDS?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Select all that apply. This shapes your meal and recipe suggestions.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {[{v:"none",l:"No restrictions",e:"🍗"},{v:"vegetarian",l:"Vegetarian",e:"🥗"},{v:"vegan",l:"Vegan",e:"🌱"},{v:"gluten",l:"Gluten free",e:"🌾"},{v:"dairy",l:"Dairy free",e:"🥛"},{v:"halal",l:"Halal",e:"☪️"},{v:"kosher",l:"Kosher",e:"✡️"},{v:"nuts",l:"Nut allergy",e:"⚠️"}].map(o=>{
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

        {/* SCREEN 8 — Meal frequency + fasting */}
        {sc===8&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.carb,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Fuel · Step 9</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            HOW OFTEN<br/><span style={{color:T.carb}}>DO YOU EAT?</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
            {[
              {v:"2",l:"2–3 meals per day",e:"🍽️",sub:"Simple and structured. Larger meals, easier to plan."},
              {v:"4",l:"3–4 meals per day",e:"🥗",sub:"Standard approach. Balances satiety and energy."},
              {v:"5",l:"4–5 meals per day",e:"⚡",sub:"Better blood sugar control. More prep required."},
              {v:"6+",l:"6+ meals / grazing",e:"🔄",sub:"Keeps metabolism active. Works well for high volume athletes."},
            ].map(o=>(
              <div key={o.v} onClick={()=>upd("mealFreq",o.v)} style={{background:data.mealFreq===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.mealFreq===o.v?T.carb:T.bd}`,borderRadius:14,padding:"14px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:24,flexShrink:0}}>{o.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:data.mealFreq===o.v?T.carb:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:12,color:T.mu,marginTop:3,lineHeight:1.4}}>{o.sub}</div>
                </div>
                {data.mealFreq===o.v&&<div style={{color:T.carb,fontSize:16,flexShrink:0}}>✓</div>}
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>Intermittent fasting?</div>
          <div style={{display:"flex",gap:8,marginBottom:24}}>
            {[{v:"no",l:"No"},{v:"16:8",l:"16:8"},{v:"omad",l:"OMAD"},{v:"custom",l:"Custom"}].map(o=>(
              <div key={o.v} onClick={()=>upd("fasting",o.v)} style={{flex:1,background:data.fasting===o.v?`${T.carb}12`:T.s2,border:`1.5px solid ${data.fasting===o.v?T.carb:T.bd}`,borderRadius:10,padding:"12px 6px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:13,fontWeight:700,color:data.fasting===o.v?T.carb:"#ccc"}}>{o.l}</div>
              </div>
            ))}
          </div>
          <PrimaryBtn onClick={()=>{
            const wLbs=d.wUnit==="kg"?(parseFloat(d.weight||70)*2.205):parseFloat(d.weight||160);
            const calcOz=Math.round(wLbs*0.5);
            const waterGoalOz=data.waterMode==="custom"&&parseFloat(data.waterCustomOz)>0?parseFloat(data.waterCustomOz):calcOz;
            onComplete({...data,goalCals:data.goal==="maintain"||data.goal==="recomp"?d.baseTDEE:goalCals,waterGoalOz});
          }} label="Fuel Setup Done →" disabled={!data.goal||!data.mealFreq} style={{background:T.carb}}/>
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
  const [runSc,setRunSc]=useState(null); // null = not in run sub-flow; 0-7 = screens A-H
  const [data,setData]=useState({
    freq:"", trainType:"lifting", split:"", equipment:"Full Gym",
    sessionLength:60, weakPoints:[], injuries:[], longRunDay:"Sunday",
    liftExp:"", cardioExp:"", gvt:false, hybridStyle:"", primaryGoal:"",
    selectedDays:{Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"},
    // running-specific fields
    current5KTime:null, unknownFitness:"", runningGoal:"", raceDate:"",
    goalRaceTime:"", terrain:"road", trackAccess:false,
    timeInputMin:"", timeInputSec:"",
    // AIT fields
    recoveryCapacity:"", musclePriorities:[], trainingAge:"",
    blackoutDays:[], mobilityLimitations:[],
    stressLevel:"", sleepQuality:"", jobPhysicality:"",
    cycleTracking:null, hybridBias:"",
  });
  const upd=(k,v)=>setData(p=>({...p,[k]:v}));
  const auto=(k,v)=>{upd(k,v);setTimeout(()=>setSc(s=>s+1),260);};
  const next=()=>setSc(s=>s+1);
  const back=()=>sc===0?onBack():setSc(s=>s-1);
  const SCREENS=19;
  const pct=Math.round((sc/SCREENS)*100);

  const isRunType = data.trainType==="running"||data.trainType==="hybrid";
  const runSubTotal = 8;
  const runPct = runSc!==null ? Math.round((runSc/runSubTotal)*100) : 0;

  function getRecDays(freq,trainType){
    const sch={Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"};
    const n={"1-2":2,"3":3,"4":4,"5":5,"6":6,"7":7}[freq]||3;
    const all=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    if(trainType==="running"){
      const spread=n<=3?["Mon","Wed","Fri"]:n===4?["Mon","Tue","Thu","Fri"]:all.slice(0,n);
      spread.slice(0,n).forEach(d=>{sch[d]="cardio";});
    }else if(trainType==="hybrid"){
      const liftDays=n<=3?["Mon","Wed","Fri"]:["Mon","Wed","Fri","Sat"].slice(0,Math.ceil(n/2));
      const runDays=["Tue","Thu","Sat","Sun"].filter(d=>!liftDays.includes(d)).slice(0,Math.floor(n/2));
      liftDays.forEach(d=>{sch[d]="training";});
      runDays.forEach(d=>{sch[d]="cardio";});
    }else{
      const spread=n<=3?["Mon","Wed","Fri"]:n===4?["Mon","Tue","Thu","Fri"]:n===5?["Mon","Tue","Wed","Thu","Fri"]:n===6?["Mon","Tue","Wed","Thu","Fri","Sat"]:all;
      spread.slice(0,n).forEach(d=>{sch[d]="training";});
    }
    return sch;
  }

  const daysNum={n0:0,"1-2":2,"3":3,"4":4,"5":5,"6":6,"7":7}[data.freq]||0;
  const availableSplits=SPLITS_WITH_DAYS[daysNum]||SPLITS_WITH_DAYS[3];
  const recSplit=availableSplits.find(s=>s.rec&&s.levels.includes(data.liftExp||"intermediate"))||availableSplits[0];

  const MUSCLES=["Chest","Back","Shoulders","Biceps","Triceps","Legs","Glutes","Core","Calves"];
  const INJURY_OPTS=["Lower back","Knees","Shoulders","Wrists","Elbows","Hips","Neck","None"];

  return(
    <div className="ob-page">
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div className="ob-inner">
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
        {sc===0&&runSc===null&&<div style={{animation:"fadeIn .3s ease"}}>
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
              <div key={o.v} onClick={()=>{
                upd("trainType",o.v);
                setTimeout(()=>{
                  if(o.v==="running"||o.v==="hybrid") setRunSc(0);
                  else setSc(s=>s+1);
                },260);
              }} style={{background:data.trainType===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.trainType===o.v?T.prot:T.bd}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:16}}>
                <div style={{fontSize:28,flexShrink:0}}>{o.e}</div>
                <div><div style={{fontSize:15,fontWeight:700,color:data.trainType===o.v?T.prot:"#fff"}}>{o.l}</div><div style={{fontSize:12,color:T.mu,marginTop:3,lineHeight:1.5}}>{o.sub}</div></div>
                {data.trainType===o.v&&<div style={{marginLeft:"auto",color:T.prot}}>✓</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* ─── RUNNING SUB-FLOW (Screens A–H) ─────────────────────────────── */}
        {runSc!==null&&(()=>{
          const rBack=()=>runSc===0?(setRunSc(null)):(setRunSc(s=>s-1));
          const rNext=()=>setRunSc(s=>s+1);
          const rDone=()=>{setRunSc(null);setSc(1);};
          return(
            <div style={{animation:"fadeIn .25s ease"}}>
              {/* Run sub-flow progress header */}
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>Running Setup · {runSc+1}/{runSubTotal}</div>
                  <div style={{height:3,background:T.s3,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",background:T.prot,width:`${runPct}%`,transition:"width .5s ease"}}/>
                  </div>
                </div>
              </div>
              <button onClick={rBack} style={{background:"none",border:"none",color:T.mu,cursor:"pointer",fontSize:18,padding:"0 0 16px",fontFamily:"inherit"}}>← Back</button>

              {/* Screen A — Current 5K Time */}
              {runSc===0&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · A</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  YOUR CURRENT<br/><span style={{color:T.prot}}>5K TIME.</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>This single number calibrates every pace, every workout, every plan. All training zones flow from here. If you don't know it exactly, we'll estimate.</p>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"20px",marginBottom:12}}>
                  <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Enter your 5K time</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center",marginBottom:8}}>
                    <div style={{textAlign:"center"}}>
                      <input value={data.timeInputMin} onChange={e=>{
                        const v=e.target.value.replace(/\D/g,"").slice(0,2);
                        upd("timeInputMin",v);
                        if(v&&data.timeInputSec!==undefined){
                          const secs=parseInt(v||0)*60+parseInt(data.timeInputSec||0);
                          if(secs>0)upd("current5KTime",secs);
                        }
                      }} placeholder="28" maxLength={2} style={{width:72,background:T.s1,border:`2px solid ${T.prot}40`,color:"#fff",fontSize:36,fontWeight:700,textAlign:"center",borderRadius:10,padding:"10px 8px",outline:"none",fontFamily:"inherit"}}/>
                      <div style={{fontSize:10,color:T.mu,marginTop:4}}>min</div>
                    </div>
                    <div style={{fontSize:36,fontWeight:700,color:T.mu,paddingBottom:20}}>:</div>
                    <div style={{textAlign:"center"}}>
                      <input value={data.timeInputSec} onChange={e=>{
                        const v=e.target.value.replace(/\D/g,"").slice(0,2);
                        upd("timeInputSec",v);
                        if(data.timeInputMin!==undefined&&v!==""){
                          const secs=parseInt(data.timeInputMin||0)*60+parseInt(v||0);
                          if(secs>0)upd("current5KTime",secs);
                        }
                      }} placeholder="30" maxLength={2} style={{width:72,background:T.s1,border:`2px solid ${T.prot}40`,color:"#fff",fontSize:36,fontWeight:700,textAlign:"center",borderRadius:10,padding:"10px 8px",outline:"none",fontFamily:"inherit"}}/>
                      <div style={{fontSize:10,color:T.mu,marginTop:4}}>sec</div>
                    </div>
                  </div>
                  {data.current5KTime>0&&<div style={{textAlign:"center",fontSize:13,color:T.prot,fontWeight:600,marginTop:4}}>= {formatRaceTime(data.current5KTime)} 5K</div>}
                </div>
                <PrimaryBtn onClick={rNext} label="Continue →" disabled={!data.current5KTime} style={{marginBottom:8}}/>
                <button onClick={()=>{setRunSc(1);}} style={{width:"100%",padding:"11px",background:"none",color:T.mu,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>I don't know my 5K time →</button>
              </div>}

              {/* Screen B — Unknown 5K: estimate from fitness level */}
              {runSc===1&&!data.current5KTime&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · B</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  HOW'S YOUR<br/><span style={{color:T.prot}}>RUNNING BASE?</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>We'll estimate your 5K time and adjust it automatically as you train. Be honest — starting too fast causes injury.</p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {[
                    {v:"never",      l:"I've never run",           sub:"Starting from zero",                est:"~40:00"},
                    {v:"occasional", l:"I run occasionally",       sub:"A few times a month at most",       est:"~35:00"},
                    {v:"recreational",l:"I run regularly",         sub:"A few times per week, no race goals",est:"~30:00"},
                    {v:"fit",        l:"I'm athletic",             sub:"Sports background, decent cardio",   est:"~25:00"},
                    {v:"competitive",l:"I've raced before",        sub:"I've run races, I just don't know my 5K",est:"~20:00"},
                  ].map(o=>(
                    <div key={o.v} onClick={()=>{upd("unknownFitness",o.v);upd("current5KTime",estimateFrom(o.v));setTimeout(rNext,260);}} style={{background:data.unknownFitness===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.unknownFitness===o.v?T.prot:T.bd}`,borderRadius:12,padding:"14px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:data.unknownFitness===o.v?T.prot:"#fff"}}>{o.l}</div>
                        <div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>
                      </div>
                      <div style={{fontSize:12,color:T.prot,fontWeight:700,background:`${T.prot}12`,padding:"4px 10px",borderRadius:8,flexShrink:0}}>{o.est}</div>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:11,color:T.mu,lineHeight:1.6}}>Your paces will auto-adjust after tempo and interval sessions. This estimate is just a starting point.</p>
              </div>}

              {/* Screen B (if they entered time) or Screen C — Running Goal */}
              {(runSc===1&&!!data.current5KTime)||runSc===2?((()=>{
                const scTarget=runSc===1?null:null; // handled below
                return null;
              })())||null:null}
              {((runSc===1&&!!data.current5KTime)||runSc===2)&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · {runSc===1?"B":"C"}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  WHAT'S YOUR<br/><span style={{color:T.prot}}>RUNNING GOAL?</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>This determines your training plan structure and weekly mileage progression.</p>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                  {[
                    {v:"first_5k",  e:"🏃",l:"Run my first 5K",          sub:"Complete 5K without stopping",           plan:"Couch to 5K"},
                    {v:"sub25_5k",  e:"⚡",l:"Break 25 minutes for 5K",  sub:"Speed work and tempo progression",       plan:"5K Sub-25"},
                    {v:"first_10k", e:"🏅",l:"Run my first 10K",         sub:"Build from 5K to 10K",                   plan:"10K Plan"},
                    {v:"sub50_10k", e:"🎯",l:"Break 50 minutes for 10K", sub:"Race-pace training and intervals",       plan:"10K Sub-50"},
                    {v:"half",      e:"🎽",l:"Half Marathon",             sub:"13.1 miles — 12–16 week program",       plan:"Half Marathon"},
                    {v:"marathon",  e:"🏆",l:"Full Marathon",             sub:"26.2 miles — 18–20 week program",       plan:"Marathon"},
                    {v:"fitness",   e:"💪",l:"Running for fitness",       sub:"No race goal — just build the habit",   plan:"Couch to 5K"},
                  ].map(o=>(
                    <div key={o.v} onClick={()=>{upd("runningGoal",o.v);setTimeout(()=>setRunSc(runSc===1?2:3),260);}} style={{background:data.runningGoal===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.runningGoal===o.v?T.prot:T.bd}`,borderRadius:12,padding:"13px 16px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{fontSize:20,flexShrink:0}}>{o.e}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:data.runningGoal===o.v?T.prot:"#fff"}}>{o.l}</div>
                        <div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>
                      </div>
                      <div style={{fontSize:9,color:T.mu,background:T.s3,padding:"3px 8px",borderRadius:6,flexShrink:0,fontWeight:700}}>{o.plan}</div>
                    </div>
                  ))}
                </div>
              </div>}

              {/* Screen D — Race Date (optional) */}
              {runSc===3&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · D</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  DO YOU HAVE<br/><span style={{color:T.prot}}>A RACE DATE?</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>We'll build your plan backward from race day — taper, long run peaks, and everything.</p>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"20px",marginBottom:16}}>
                  <input type="date" value={data.raceDate} onChange={e=>upd("raceDate",e.target.value)} style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:20,fontWeight:600,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                </div>
                <PrimaryBtn onClick={rNext} label="Continue →" disabled={!data.raceDate} style={{marginBottom:8}}/>
                <button onClick={()=>{upd("raceDate","");rNext();}} style={{width:"100%",padding:"11px",background:"none",color:T.mu,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13}}>No race date yet — skip</button>
              </div>}

              {/* Screen E — Terrain */}
              {runSc===4&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · E</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  WHERE DO YOU<br/><span style={{color:T.prot}}>USUALLY RUN?</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>We'll adapt workouts to your surface — trail runs get slower paces, treadmill gets incline guidance.</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
                  {[
                    {v:"road",      e:"🛣️", l:"Road / Pavement",  sub:"Standard surfaces, pace-accurate"},
                    {v:"trail",     e:"🌲", l:"Trail",             sub:"Paces are 10–20% slower — we account for this"},
                    {v:"track",     e:"🏟️", l:"Track",             sub:"400m laps, pace-perfect sessions"},
                    {v:"treadmill", e:"🏃", l:"Treadmill",         sub:"Incline at 1% to simulate outdoor effort"},
                    {v:"mixed",     e:"🔀", l:"Mixed",             sub:"Road + some trail or treadmill"},
                  ].map(o=>(
                    <div key={o.v} onClick={()=>{upd("terrain",o.v);}} style={{background:data.terrain===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.terrain===o.v?T.prot:T.bd}`,borderRadius:12,padding:"14px",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{fontSize:22,marginBottom:6}}>{o.e}</div>
                      <div style={{fontSize:13,fontWeight:700,color:data.terrain===o.v?T.prot:"#fff",marginBottom:3}}>{o.l}</div>
                      <div style={{fontSize:10,color:T.mu,lineHeight:1.5}}>{o.sub}</div>
                    </div>
                  ))}
                </div>
                <PrimaryBtn onClick={rNext} label="Continue →" disabled={!data.terrain}/>
              </div>}

              {/* Screen F — Track Access */}
              {runSc===5&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · F</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  TRACK<br/><span style={{color:T.prot}}>ACCESS?</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>A 400m track lets us give you exact interval distances. Without one, we convert to time-based intervals — equally effective.</p>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                  {[
                    {v:true,  e:"✅",l:"Yes — I have access to a track",sub:"Get lap-based intervals (400m, 800m, 1mi, 1200m)"},
                    {v:false, e:"⏱️",l:"No — road or trail only",       sub:"All intervals converted to time (e.g. 3 min fast, 90 sec easy)"},
                  ].map(o=>(
                    <div key={String(o.v)} onClick={()=>{upd("trackAccess",o.v);setTimeout(rNext,260);}} style={{background:data.trackAccess===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.trackAccess===o.v?T.prot:T.bd}`,borderRadius:12,padding:"18px 20px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                      <div style={{fontSize:24,flexShrink:0}}>{o.e}</div>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:data.trackAccess===o.v?T.prot:"#fff"}}>{o.l}</div>
                        <div style={{fontSize:11,color:T.mu,marginTop:3,lineHeight:1.5}}>{o.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>}

              {/* Screen G — Long Run Day */}
              {runSc===6&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · G</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                  LONG RUN<br/><span style={{color:T.prot}}>DAY.</span>
                </div>
                <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>Your long run needs a full rest day after it. We'll build your whole schedule around this anchor day.</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>(
                    <div key={day} onClick={()=>upd("longRunDay",day)} style={{background:data.longRunDay===day?`${T.prot}12`:T.s2,border:`1.5px solid ${data.longRunDay===day?T.prot:T.bd}`,borderRadius:11,padding:"16px 8px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{fontSize:14,fontWeight:700,color:data.longRunDay===day?T.prot:"#fff"}}>{day}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:`${T.prot}08`,border:`1px solid ${T.prot}25`,borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:12,color:T.mu,lineHeight:1.65}}>
                  Long run day: <b style={{color:"#fff"}}>{data.longRunDay}</b>. Rest day after: <b style={{color:"#fff"}}>{data.longRunDay==="Sat"?"Sun":data.longRunDay==="Sun"?"Mon":data.longRunDay==="Mon"?"Tue":data.longRunDay==="Tue"?"Wed":data.longRunDay==="Wed"?"Thu":data.longRunDay==="Thu"?"Fri":"Sun"}</b>.
                </div>
                <PrimaryBtn onClick={rNext} label="Continue →" disabled={!data.longRunDay}/>
              </div>}

              {/* Screen H — Summary + Launch */}
              {runSc===7&&<div>
                <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Run Setup · Done</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:16}}>
                  YOUR RUNNING<br/><span style={{color:T.prot}}>PROFILE.</span>
                </div>
                <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"20px",marginBottom:16,display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.mu}}>Current 5K time</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{formatRaceTime(data.current5KTime||0)}{data.unknownFitness?" (estimated)":""}</span>
                  </div>
                  <div style={{height:1,background:T.bd}}/>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.mu}}>Goal</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{data.runningGoal?.replace(/_/g," ")}</span>
                  </div>
                  {data.raceDate&&<>
                    <div style={{height:1,background:T.bd}}/>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:13,color:T.mu}}>Race date</span>
                      <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{data.raceDate}</span>
                    </div>
                  </>}
                  <div style={{height:1,background:T.bd}}/>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.mu}}>Terrain</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{data.terrain}</span>
                  </div>
                  <div style={{height:1,background:T.bd}}/>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.mu}}>Track access</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{data.trackAccess?"Yes":"No — time-based intervals"}</span>
                  </div>
                  <div style={{height:1,background:T.bd}}/>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:T.mu}}>Long run day</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{data.longRunDay}</span>
                  </div>
                </div>
                <PrimaryBtn onClick={rDone} label="Build My Run Program →"/>
                <p style={{fontSize:11,color:T.mu,textAlign:"center",marginTop:12,lineHeight:1.6}}>Your paces will auto-calibrate after every tempo and interval session.</p>
              </div>}
            </div>
          );
        })()}

        {/* SCREEN 1 — Primary Training Goal */}
        {sc===1&&<div style={{animation:"fadeIn .3s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 2</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            PRIMARY<br/><span style={{color:T.prot}}>TRAINING GOAL.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>What are you actually training for? This determines your program recommendation.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[
              {v:"build_muscle",  e:"💪",l:"Build Muscle",     sub:"Hypertrophy focused training for maximum size"},
              {v:"get_stronger",  e:"🏋️",l:"Get Stronger",     sub:"Powerlifting and powerbuilding for maximum strength"},
              {v:"lose_fat",      e:"🔥",l:"Lose Fat",         sub:"Metabolic training, circuits, and HIIT for fat loss"},
              {v:"athleticism",   e:"⚡",l:"Improve Athleticism",sub:"Functional and hybrid training for performance"},
              {v:"race",          e:"🏃",l:"Train for a Race", sub:"Running, Hyrox, and endurance programming"},
              {v:"recomp",        e:"🎯",l:"Body Recomposition",sub:"Build muscle and lose fat simultaneously"},
              {v:"general",       e:"🌟",l:"General Fitness",  sub:"Feel better, move better, live better"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("primaryGoal",o.v)} style={{background:data.primaryGoal===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.primaryGoal===o.v?T.prot:T.bd}`,borderRadius:12,padding:"14px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:16}}>
                <div style={{fontSize:24,flexShrink:0,width:32,textAlign:"center"}}>{o.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:data.primaryGoal===o.v?T.prot:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:12,color:T.mu,marginTop:2,lineHeight:1.4}}>{o.sub}</div>
                </div>
                {data.primaryGoal===o.v&&<div style={{color:T.prot,fontSize:16,flexShrink:0}}>✓</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 2 — Experience */}
        {sc===2&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 3</div>
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

        {/* SCREEN 3 — Days per week */}
        {sc===3&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 4</div>
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
          <PrimaryBtn onClick={()=>{upd("selectedDays",getRecDays(data.freq,data.trainType));next();}} label="Continue →" disabled={!data.freq}/>
        </div>}

        {/* SCREEN 4 — Day picker */}
        {sc===4&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 5</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
            PICK YOUR<br/><span style={{color:T.prot}}>TRAINING DAYS.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:16,lineHeight:1.6}}>Tap each day to assign it. We've pre-filled a recommendation — override it completely.</p>
          {(()=>{
            const sch=data.selectedDays;
            const isHybrid=data.trainType==="hybrid";
            const isRun=data.trainType==="running";
            const dayColors={"training":{bg:`${T.prot}20`,border:T.prot,text:T.prot,label:"🏋️ Lift"},"cardio":{bg:`${T.fat}20`,border:T.fat,text:T.fat,label:"🏃 Run"},"rest":{bg:T.s2,border:T.bd,text:T.mu,label:"😴 Rest"}};
            const cycleDay=(day)=>{
              const cur=sch[day];
              let nextState;
              if(isHybrid) nextState=cur==="rest"?"training":cur==="training"?"cardio":"rest";
              else if(isRun) nextState=cur==="rest"?"cardio":"rest";
              else nextState=cur==="rest"?"training":"rest";
              upd("selectedDays",{...sch,[day]:nextState});
            };
            const liftCount=Object.values(sch).filter(v=>v==="training").length;
            const runCount=Object.values(sch).filter(v=>v==="cardio").length;
            const target={"1-2":2,"3":3,"4":4,"5":5,"6":6,"7":7}[data.freq]||3;
            return(
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6,marginBottom:16}}>
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{
                    const t=sch[day]||"rest";
                    const c=dayColors[t];
                    return(
                      <div key={day} onClick={()=>cycleDay(day)} style={{background:c.bg,border:`1.5px solid ${c.border}`,borderRadius:12,padding:"12px 4px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                        <div style={{fontSize:9,fontWeight:700,color:c.text,marginBottom:6,letterSpacing:1}}>{day}</div>
                        <div style={{fontSize:14,marginBottom:4}}>{t==="training"?"🏋️":t==="cardio"?"🏃":"😴"}</div>
                        <div style={{fontSize:8,color:c.text,lineHeight:1.2}}>{c.label.split(" ")[1]}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",gap:20}}>
                  {isHybrid||!isRun?<div><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:T.prot}}>{liftCount}</span><span style={{fontSize:11,color:T.mu,marginLeft:4}}>lift days</span></div>:null}
                  {isHybrid||isRun?<div><span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:T.fat}}>{runCount}</span><span style={{fontSize:11,color:T.mu,marginLeft:4}}>run days</span></div>:null}
                  <div style={{marginLeft:"auto",fontSize:11,color:T.mu}}>Target: {target} days</div>
                </div>
              </>
            );
          })()}
          <PrimaryBtn onClick={next} label="Continue →"/>
        </div>}

        {/* SCREEN 5 — Goal-based Recommendation */}
        {sc===5&&(()=>{
          const days={n0:0,"1-2":2,"3":3,"4":4,"5":5,"6":6,"7":7}[data.freq]||3;
          const exp=data.liftExp||"intermediate";
          const goal=data.primaryGoal;
          const ttype=data.trainType;

          // Map goal → recommendation
          const REC_MAP={
            build_muscle:{
              beginner:{id:"full_body",name:"Full Body 3×",why:"As a beginner, your nervous system adapts fastest when you practice every pattern every session. Full body gives you 3 practice sessions per week with every compound — you'll build size, strength, and coordination simultaneously."},
              intermediate:days>=5?{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"At 5+ days, PPL twice per week is the gold standard. Every muscle hit twice with a dedicated day — this is how most advanced physiques are built."}
                :days===4?{id:"upper_lower",name:"Upper/Lower 4-Day",why:"Upper/Lower at 4 days is the most scientifically validated split. Heavy compounds Monday/Thursday, volume Tuesday/Friday. Every muscle twice per week at optimal frequency."}
                :{id:"ppl_half",name:"Push/Pull/Legs",why:"3-day PPL gives you dedicated push, pull, and leg sessions with full recovery between each. More volume than full body at this stage, which is what you need to keep growing."},
              advanced:days>=6?{id:"arnold",name:"Arnold Split",why:"You've earned it. Arnold's double split puts massive volume on every muscle group twice per week — chest+back supersets, then arms+shoulders. Nothing matches it for advanced hypertrophy."}
                :{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"PPL 6-day is the proven ceiling for natural lifters. Every muscle hit twice per week with A days (heavy) and B days (volume). Your body knows how to respond — this gives it the stimulus to keep responding."},
            },
            get_stronger:{
              beginner:{id:"full_body",name:"Full Body 3× (Strength)",why:"Strength is a skill. The more you practice the squat, bench, and deadlift, the stronger you get. Full body 3 days per week lets you do all three movements every session — maximum practice, maximum progress."},
              intermediate:days>=5?{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"At intermediate level and 5+ days, PPL keeps strength moving. Heavy A days on the main compounds, volume B days for hypertrophy that feeds strength. Deadlift stays on Pull A where it belongs."}
                :{id:"upper_lower",name:"Upper/Lower 4-Day (Powerbuilding)",why:"Upper/Lower at 4 days is a powerbuilder's dream. Upper A is your strength day — heavy bench, heavy row. Lower A is squat and deadlift day. Upper B and Lower B are volume days that build the muscle you'll lift with."},
              advanced:{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"Advanced strength athletes need both heavy neural work and hypertrophy volume. PPL 6-day gives you max frequency on the competition lifts while building the muscle mass that lets you keep adding weight."},
            },
            lose_fat:{
              beginner:{id:"full_body",name:"Full Body Circuit",why:"Full body circuits elevate your heart rate while building muscle — the best of both worlds for fat loss. You'll burn more calories per session than isolation work, and the muscle you build raises your resting metabolic rate."},
              intermediate:{id:"upper_lower",name:"Upper/Lower 4-Day",why:"The most effective fat loss approach for intermediate lifters is keeping your strength while eating in a deficit. Upper/Lower keeps you on the key compound movements so you don't lose the muscle you've built."},
              advanced:{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"Don't change what works. Stay on high-frequency PPL while in a deficit. The volume keeps the muscle signal strong enough to preserve everything you've built."},
            },
            athleticism:{
              beginner:{id:"full_body",name:"Full Body 3×",why:"Athletic foundation first. Full body three days per week builds the movement quality, mobility, and baseline strength that all athletic development depends on."},
              intermediate:{id:"strength_run",name:"Strength + Run Hybrid",why:"True athleticism requires both strength and conditioning. 3 lifting days + 2 run days builds the aerobic engine and the power output that separate athletic bodies from just gym bodies."},
              advanced:{id:"upper_lower_run",name:"Upper/Lower + Running",why:"Advanced hybrid training. Upper/lower 4 days gives you strength frequency, while 2 dedicated run days build your aerobic capacity. Separate them to avoid interference effect."},
            },
            race:{
              beginner:{id:"c25k",name:"Couch to 5K",why:"Start here. Couch to 5K uses run/walk intervals that let your joints adapt at the same rate your cardio does. Most injuries happen when people progress too fast — this program prevents that."},
              intermediate:days>=5?{id:"half",name:"Half Marathon Plan",why:"16 weeks, 5 days per week. Long run builds to 13+ miles with proper aerobic base development. Built for runners who can already run 5K comfortably."}
                :{id:"5k_sub25",name:"Sub-25 5K Plan",why:"The sub-25 5K is a real athletic achievement. Speed work, tempo runs, and structured intervals will cut minutes off your time in 8 weeks."},
              advanced:{id:"half",name:"Half Marathon Plan",why:"The half marathon is where running gets serious. 16 weeks of structured training with proper long run progression, tempo work, and race-week taper."},
            },
            recomp:{
              beginner:{id:"full_body",name:"Full Body 3×",why:"Body recomp is hardest for experienced lifters and easiest for beginners. You can build muscle and lose fat simultaneously — full body 3 days keeps the training stimulus high while leaving room for recovery."},
              intermediate:{id:"upper_lower",name:"Upper/Lower 4-Day",why:"Recomp at intermediate level requires maximum muscle stimulus with precise nutrition. Upper/Lower hits every muscle twice per week — enough frequency to grow muscle even in a mild deficit."},
              advanced:{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"Advanced recomp is challenging but doable with high frequency. PPL 6-day keeps the muscle signal strong enough to grow (or maintain) while you drop body fat slowly."},
            },
            general:{
              beginner:{id:"full_body",name:"Full Body 3×",why:"Three days per week, full body — this is the most sustainable training structure on earth. Hit every major muscle, get in and out, and build a habit that lasts."},
              intermediate:{id:"upper_lower",name:"Upper/Lower 4-Day",why:"Four days per week gives you more to train, better results, and still leaves plenty of room for life. Upper/Lower is the right step up from full body."},
              advanced:{id:"ppl_6",name:"Push/Pull/Legs ×2",why:"You know how to train. PPL six days keeps you sharp, provides structure, and gives you a clear plan for every session."},
            },
          };

          // For running/hyrox/hybrid trainTypes, force specific recs
          let rec;
          if(ttype==="running"){
            rec=days>=5?{id:"half",name:"Half Marathon Plan",why:"With 5+ days available, the half marathon plan gives you enough volume to build a serious running base with proper taper and race prep."}
              :{id:"c25k",name:"Couch to 5K",why:"3 days per week is the perfect running schedule. Run/walk intervals build the aerobic base and joint integrity needed to run comfortably and injury-free."};
          }else if(ttype==="hyrox"){
            rec={id:"hyrox_12w",name:"Hyrox 12-Week Race Prep",why:"Purpose-built for Hyrox. 8 functional stations + 1km runs, replicated in the gym across 12 weeks. Your weaknesses become strengths on race day."};
          }else if(ttype==="hybrid"){
            rec=days>=6?{id:"upper_lower_run",name:"Upper/Lower + Running",why:"6 days gives you 4 lifting days and 2 running days with full separation. This is the most complete hybrid athlete template."}
              :{id:"strength_run",name:"Strength + Run",why:"3 lifting + 2 running days in the same week. Train them on separate days to prevent interference. Strong legs will make you faster."};
          }else{
            const goalMap=REC_MAP[goal]||REC_MAP["general"];
            rec=goalMap[exp]||goalMap["intermediate"]||{id:"upper_lower",name:"Upper/Lower 4-Day",why:"A solid, research-backed program that works for most goals and experience levels."};
          }

          const splitNameMap={
            full_body:"Full Body",upper_lower:"Upper/Lower",ppl_half:"Push/Pull/Legs",
            ppl_6:"Push/Pull/Legs",arnold:"Arnold Split",bro_split:"Bro Split",
            c25k:"Running Plan",half:"Running Plan","5k_sub25":"Running Plan",
            hyrox_12w:"Hyrox Program",strength_run:"Hybrid Program",upper_lower_run:"Hybrid Program",
          };

          return(
            <div style={{animation:"fadeIn .3s ease"}}>
              <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 6</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,lineHeight:.9,marginBottom:20}}>
                BASED ON YOUR<br/><span style={{color:T.prot}}>ANSWERS, WE RECOMMEND:</span>
              </div>
              <div style={{background:`${T.prot}08`,border:`1.5px solid ${T.prot}35`,borderRadius:16,padding:"24px",marginBottom:20}}>
                <div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>⭐ Best program for you</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:"#fff",marginBottom:4}}>{rec.name}</div>
                <div style={{fontSize:11,color:T.mu,marginBottom:16}}>{splitNameMap[rec.id]||"Program"} · {data.freq} days/week · {exp}</div>
                <div style={{fontSize:14,color:"#ccc",lineHeight:1.75}}>{rec.why}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={()=>{upd("split",rec.id);setSc(7);}} style={{width:"100%",padding:"16px",background:T.prot,color:"#000",fontWeight:700,fontSize:16,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>
                  Use This Program →
                </button>
                <button onClick={()=>setSc(6)} style={{width:"100%",padding:"14px",background:"none",color:T.mu,fontWeight:600,fontSize:14,border:`1.5px solid ${T.bd}`,borderRadius:14,cursor:"pointer",fontFamily:"inherit"}}>
                  Browse All Programs
                </button>
              </div>
            </div>
          );
        })()}

        {/* SCREEN 6 — Split / Program selection — context-aware by trainType */}
        {sc===6&&(()=>{
          // Running programs
          const RUN_PROGRAMS=[
            {id:"c25k",e:"🏃",l:"5K — Beginner (Couch to 5K)",desc:"Run/walk intervals building to a full 5K in 8 weeks. 3 days/week. No experience needed.",days:3,rec:["beginner"],gvt:false},
            {id:"5k_sub25",e:"⚡",l:"5K — Sub-25 Minutes",desc:"Speed work and tempo runs to break 25 minutes. 4 days/week.",days:4,rec:["intermediate"],gvt:false},
            {id:"10k",e:"🏅",l:"10K Plan",desc:"Build to 10K in 10 weeks. Mix of easy runs, tempo, and a weekly long run. 4 days/week.",days:4,rec:["intermediate"],gvt:false},
            {id:"half",e:"🎽",l:"Half Marathon",desc:"16-week plan to finish your first half marathon. Long run builds to 13 miles. 5 days/week.",days:5,rec:["intermediate","advanced"],gvt:false},
            {id:"marathon",e:"🏆",l:"Full Marathon",desc:"20-week plan. Long runs up to 22 miles. Includes taper and race week programming. 5 days/week.",days:5,rec:["advanced"],gvt:false},
          ];
          // Hyrox programs
          const HYROX_PROGRAMS=[
            {id:"hyrox_12w",e:"🔥",l:"Hyrox 12-Week Race Prep",desc:"Full race simulation every Saturday. 8 stations (SkiErg, sled push/pull, burpee broad jump, rowing, farmers carry, sandbag lunges, wall balls) + 1km runs between each. Strength on weekdays.",days:5,rec:["intermediate","advanced"],gvt:false},
            {id:"hyrox_strength",e:"💪",l:"Hyrox Strength Focus",desc:"Prioritize functional strength for Hyrox — heavy sled, loaded carries, wall balls. Less running, more power. Best if your weakness is strength.",days:4,rec:["beginner","intermediate"],gvt:false},
            {id:"hyrox_run",e:"🏃",l:"Hyrox Endurance Focus",desc:"Prioritize the 1km runs between stations. Interval work, tempo runs, station-to-station pacing. Best if cardio is your weakness.",days:4,rec:["intermediate"],gvt:false},
          ];
          // Hybrid programs
          const HYBRID_PROGRAMS=[
            {id:"strength_run",e:"⚡",l:"Strength + Run",desc:"3 lifting days + 2 run days. The classic hybrid. Build muscle AND aerobic base simultaneously. Lifting and running on separate days to prevent interference.",days:5,rec:["intermediate"],gvt:true},
            {id:"ppl_hyrox",e:"🔥",l:"PPL + Hyrox",desc:"Push/Pull/Legs 3 days + 2 Hyrox simulation sessions. Race-ready in 12 weeks while keeping muscle mass.",days:5,rec:["advanced"],gvt:false},
            {id:"upper_lower_run",e:"🏅",l:"Upper/Lower + Running",desc:"4 days Upper/Lower split + 2 structured run days. Best balance of strength frequency and endurance.",days:6,rec:["intermediate","advanced"],gvt:true},
            {id:"hyrox_hybrid",e:"💪",l:"Full Hybrid Hyrox",desc:"Strength, running, AND Hyrox stations. The complete athlete program. High commitment — 6 days/week.",days:6,rec:["advanced"],gvt:false},
          ];

          const getOptions=()=>{
            if(data.trainType==="running") return RUN_PROGRAMS;
            if(data.trainType==="hyrox") return HYROX_PROGRAMS;
            if(data.trainType==="hybrid") return HYBRID_PROGRAMS;
            return availableSplits||[]; // lifting
          };
          const getTitle=()=>{
            if(data.trainType==="running") return {title:"CHOOSE YOUR",sub:"RUN PLAN."};
            if(data.trainType==="hyrox") return {title:"CHOOSE YOUR",sub:"HYROX PROGRAM."};
            if(data.trainType==="hybrid") return {title:"CHOOSE YOUR",sub:"HYBRID TEMPLATE."};
            return {title:"CHOOSE YOUR",sub:"SPLIT."};
          };
          const options=getOptions();
          const {title,sub}=getTitle();
          const isLifting=data.trainType==="lifting";
          const recOpt=options.find(s=>(s.rec||[]).includes(data.liftExp||"intermediate")&&(isLifting?s.id===recSplit?.id:true))||options[0];

          return(
            <div style={{animation:"fadeIn .25s ease"}}>
              <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 4</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:12}}>
                {title}<br/><span style={{color:T.prot}}>{sub}</span>
              </div>
              {isLifting&&<p style={{fontSize:13,color:T.mu,marginBottom:16}}>Based on {data.freq} days/week. ⭐ = our recommendation for your experience level.</p>}
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                {options.map(s=>{
                  const isRec=s.id===recOpt?.id;
                  const sel=data.split===s.id;
                  return(
                    <div key={s.id} onClick={()=>upd("split",s.id)} style={{background:sel?`${T.prot}10`:T.s2,border:`1.5px solid ${sel?T.prot:isRec?`${T.prot}30`:T.bd}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontSize:20}}>{s.e}</span>
                          <span style={{fontSize:15,fontWeight:700,color:sel?T.prot:"#fff"}}>{s.l}</span>
                        </div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                          {isRec&&<div style={{background:`${T.prot}15`,border:`1px solid ${T.prot}30`,borderRadius:6,padding:"2px 8px",fontSize:9,color:T.prot,fontWeight:700}}>⭐ Recommended</div>}
                          {s.days&&<div style={{background:T.s3,borderRadius:6,padding:"2px 8px",fontSize:9,color:T.mu,fontWeight:700}}>{s.days} days/wk</div>}
                          {s.gvt&&<div style={{background:"rgba(255,215,64,.12)",border:"1px solid rgba(255,215,64,.3)",borderRadius:6,padding:"2px 8px",fontSize:9,color:T.fat,fontWeight:700}}>GVT week ✓</div>}
                        </div>
                      </div>
                      <div style={{fontSize:12,color:T.mu,lineHeight:1.65}}>{s.desc}</div>
                    </div>
                  );
                })}
              </div>
              {/* GVT toggle — only show for lifting splits that support it */}
              {isLifting&&(availableSplits||[]).find(s=>s.id===data.split)?.gvt&&<div style={{background:"rgba(255,215,64,.06)",border:"1px solid rgba(255,215,64,.2)",borderRadius:12,padding:"16px",marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1,marginRight:16}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.fat,marginBottom:4}}>💀 Add German Volume Training weeks</div>
                    <div style={{fontSize:12,color:T.mu,lineHeight:1.65}}>Every 4th week automatically switches your main compound to 10 sets × 10 reps at 60% working weight. Brutal hypertrophy stimulus — proven for breaking plateaus.</div>
                  </div>
                  <div onClick={()=>upd("gvt",!data.gvt)} style={{width:44,height:24,borderRadius:12,background:data.gvt?T.fat:T.s3,cursor:"pointer",position:"relative",flexShrink:0,transition:"all .3s"}}>
                    <div style={{position:"absolute",top:3,left:data.gvt?22:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
                  </div>
                </div>
              </div>}
              <PrimaryBtn onClick={next} label="Continue →" disabled={!data.split}/>
            </div>
          );
        })()}

        {/* SCREEN 7 — Equipment */}
        {sc===7&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 8</div>
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

        {/* SCREEN 8 — Session Length */}
        {sc===8&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 9</div>
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

        {/* SCREEN 9 — Weak Points */}
        {sc===9&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · Step 10</div>
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

        {/* SCREEN 10 — Recovery Capacity */}
        {sc===10&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 1/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            HOW QUICKLY<br/><span style={{color:T.prot}}>DO YOU RECOVER?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:10,lineHeight:1.65}}>This sets your training block length. Longer recovery means more time to peak before the next deload.</p>
          <div style={{background:"rgba(232,52,28,0.06)",border:"1px solid rgba(232,52,28,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:11,color:T.mu,lineHeight:1.65}}>
            <span style={{color:T.prot,fontWeight:700}}>What is DOMS?</span> Delayed Onset Muscle Soreness — the stiffness felt 24–48 hrs after training. Normal DOMS is not the same as inadequate recovery. Base your answer on how many days until you feel <em>ready</em> to train that muscle hard again.
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {[
              {v:"fast",     icon:<svg width={28} height={28} viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,l:"Very Fast",sub:"Rarely sore. Could train same muscle 2 days later easily.",weeks:5},
              {v:"normal",   icon:<svg width={28} height={28} viewBox="0 0 24 24" fill="none"><path d="M12 2c0 6-6 8-6 13a6 6 0 0012 0c0-5-6-7-6-13z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,l:"Normal",sub:"Sore 1-2 days then feel recovered and ready.",weeks:6},
              {v:"slow",     icon:<svg width={28} height={28} viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,l:"Slower",sub:"Need 3-4 days to feel truly recovered from hard sessions.",weeks:7},
              {v:"very_slow",icon:<svg width={28} height={28} viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,l:"Very Slow",sub:"Heavy sessions take 5+ days to fully recover from.",weeks:8},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("recoveryCapacity",o.v)} style={{background:data.recoveryCapacity===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.recoveryCapacity===o.v?T.prot:T.bd}`,borderRadius:12,padding:"14px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(232,52,28,0.15)",border:"1px solid rgba(232,52,28,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:data.recoveryCapacity===o.v?T.prot:"rgba(232,52,28,0.7)"}}>{o.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:data.recoveryCapacity===o.v?T.prot:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:11,color:T.mu,marginTop:2,lineHeight:1.5}}>{o.sub}</div>
                </div>
                <div style={{fontSize:10,color:T.mu,background:T.s3,padding:"3px 8px",borderRadius:8,flexShrink:0,fontWeight:700}}>{o.weeks}wk block</div>
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 11 — Muscle Priorities */}
        {sc===11&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 2/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            WHAT DO YOU WANT<br/><span style={{color:T.prot}}>TO PRIORITIZE?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>These muscle groups get extra volume, better exercise slots, and the most coaching attention. Max 2 selections.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            {["Chest","Back","Shoulders","Arms","Quads","Hamstrings","Glutes","Calves","Core"].map(m=>{
              const sel=(data.musclePriorities||[]).includes(m);
              const maxed=(data.musclePriorities||[]).length>=2&&!sel;
              return(
                <div key={m} onClick={()=>{
                  if(maxed)return;
                  upd("musclePriorities",sel?(data.musclePriorities||[]).filter(x=>x!==m):[...(data.musclePriorities||[]),m]);
                }} style={{background:sel?`${T.prot}12`:maxed?T.s1:T.s2,border:`1.5px solid ${sel?T.prot:T.bd}`,borderRadius:10,padding:"14px 8px",textAlign:"center",cursor:maxed?"not-allowed":"pointer",transition:"all .2s",opacity:maxed?0.4:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:sel?T.prot:"#ccc"}}>{m}</div>
                  {sel&&<div style={{fontSize:9,color:T.prot,marginTop:3,fontWeight:700}}>⭐ PRIORITY</div>}
                </div>
              );
            })}
          </div>
          <div style={{background:`${T.prot}06`,border:`1px solid ${T.prot}20`,borderRadius:10,padding:"12px 14px",marginBottom:16,fontSize:12,color:T.mu,lineHeight:1.65}}>
            {(data.musclePriorities||[]).length===0?"Select up to 2 muscle groups to prioritize.":`Prioritizing: ${(data.musclePriorities||[]).join(" + ")}. These get first slot, +2 sets/week, and lower RIR.`}
          </div>
          <PrimaryBtn onClick={next} label="Continue →"/>
          <button onClick={()=>{upd("musclePriorities",[]);next();}} style={{width:"100%",padding:"11px",background:"none",color:T.mu,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,marginTop:6}}>Skip — balanced development</button>
        </div>}

        {/* SCREEN 12 — Training Age */}
        {sc===12&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 3/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            HOW LONG HAVE<br/><span style={{color:T.prot}}>YOU BEEN TRAINING?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>Consistently means 3+ days/week with progressive overload. This changes how your program is structured — be honest.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {[
              {v:"new",        e:"🌱",l:"Under 6 months",     sub:"Still building my foundation",               skill:"Novice",   prog:"Linear progression every session"},
              {v:"developing", e:"📈",l:"6 months – 2 years", sub:"Getting consistent results",                 skill:"Intermediate",prog:"Undulating periodization"},
              {v:"established",e:"💪",l:"2–5 years",          sub:"Solid base, chasing new PRs",               skill:"Advanced",  prog:"Block periodization"},
              {v:"veteran",    e:"🏆",l:"5+ years",           sub:"Advanced — need specific programming",      skill:"Elite",    prog:"Auto-regulated"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("trainingAge",o.v)} style={{background:data.trainingAge===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.trainingAge===o.v?T.prot:T.bd}`,borderRadius:12,padding:"14px 18px",cursor:"pointer",transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:data.trainingAge===o.v?8:0}}>
                  <div style={{fontSize:24,flexShrink:0}}>{o.e}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:data.trainingAge===o.v?T.prot:"#fff"}}>{o.l}</div>
                    <div style={{fontSize:11,color:T.mu,marginTop:2}}>{o.sub}</div>
                  </div>
                  <div style={{fontSize:9,color:T.prot,background:`${T.prot}12`,padding:"3px 8px",borderRadius:6,fontWeight:700,flexShrink:0}}>{o.skill}</div>
                </div>
                {data.trainingAge===o.v&&<div style={{fontSize:11,color:T.mu,borderTop:`1px solid ${T.bd}`,paddingTop:8,marginLeft:36}}>{o.prog}</div>}
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 13 — Blackout Days (removed per audit: schedule tap-to-cycle IS the user's intent) */}
        {sc===13&&(()=>{setTimeout(next,50);return null;})()}

        {/* SCREEN 14 — Mobility Check (skip for running-only users) */}
        {sc===14&&data.trainType==="running"&&(()=>{setTimeout(next,50);return null;})()}
        {sc===14&&data.trainType!=="running"&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 5/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            ANY MOVEMENT<br/><span style={{color:T.prot}}>LIMITATIONS?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>Be honest — we program around these, not through them. Your program will automatically substitute safer alternatives.</p>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {[
              {v:"cant_squat_below_parallel",l:"Can't squat below parallel",sub:"→ Box squats, leg press, hack squat as primary quad movement"},
              {v:"shoulder_pain_pressing",   l:"Shoulder pain on pressing",  sub:"→ No overhead press, landmine press or dumbbell only"},
              {v:"lower_back",               l:"Lower back sensitivity",     sub:"→ No conventional deadlift, trap bar or Romanian only"},
              {v:"hip_flexor_tight",         l:"Hip flexor tightness",       sub:"→ Limited split squats, extra mobility prep"},
              {v:"ankle_mobility",           l:"Ankle mobility issues",      sub:"→ Heel-elevated squats, wider stance"},
              {v:"none",                     l:"None — full range of motion",sub:"Cleared for all movements"},
            ].map(o=>{
              const sel=(data.mobilityLimitations||[]).includes(o.v);
              const isNone=o.v==="none";
              return(
                <div key={o.v} onClick={()=>{
                  if(isNone){upd("mobilityLimitations",sel?[]:["none"]);}
                  else{upd("mobilityLimitations",(sel?(data.mobilityLimitations||[]).filter(x=>x!==o.v):[...(data.mobilityLimitations||[]).filter(x=>x!=="none"),o.v]));}
                }} style={{background:sel?(isNone?`${T.prot}10`:`rgba(239,68,68,.08)`):T.s2,border:`1.5px solid ${sel?(isNone?T.prot:"rgba(239,68,68,.4)"):T.bd}`,borderRadius:11,padding:"13px 16px",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{fontSize:13,fontWeight:700,color:sel?(isNone?T.prot:"#EF4444"):"#fff"}}>{o.l}</div>
                  <div style={{fontSize:11,color:T.mu,marginTop:3}}>{o.sub}</div>
                </div>
              );
            })}
          </div>
          <PrimaryBtn onClick={next} label="Continue →" disabled={!(data.mobilityLimitations||[]).length}/>
          <button onClick={()=>{upd("mobilityLimitations",["none"]);next();}} style={{width:"100%",padding:"11px",background:"none",color:T.mu,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,marginTop:6}}>Skip</button>
        </div>}

        {/* SCREEN 15 — Life Factors */}
        {sc===15&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 6/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            A COUPLE<br/><span style={{color:T.prot}}>MORE THINGS.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>These affect your recovery more than most people realize. High stress + poor sleep = lower starting volume, more deload weeks.</p>

          <div style={{fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>General stress level?</div>
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            {[{v:"low",e:"😊",l:"Low"},{v:"medium",e:"😐",l:"Medium"},{v:"high",e:"😫",l:"High"},{v:"very_high",e:"🔥",l:"Very High"}].map(o=>(
              <div key={o.v} onClick={()=>upd("stressLevel",o.v)} style={{flex:1,background:data.stressLevel===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.stressLevel===o.v?T.prot:T.bd}`,borderRadius:10,padding:"12px 6px",textAlign:"center",cursor:"pointer",transition:"all .2s"}}>
                <div style={{fontSize:22,marginBottom:4}}>{o.e}</div>
                <div style={{fontSize:11,fontWeight:700,color:data.stressLevel===o.v?T.prot:"#ccc"}}>{o.l}</div>
              </div>
            ))}
          </div>

          <PrimaryBtn onClick={next} label="Continue →" disabled={!data.stressLevel}/>
        </div>}

        {/* SCREEN 16 — Female Health (skip if not female) */}
        {sc===16&&d?.sex!=="female"&&(()=>{setTimeout(next,50);return null;})()}
        {sc===16&&d?.sex==="female"&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 7/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            ONE MORE<br/><span style={{color:T.prot}}>OPTIONAL QUESTION.</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>This helps us optimize your training around your body's natural rhythms. Completely optional — skip anytime.</p>
          <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:14,padding:"20px",marginBottom:16}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:16}}>Would you like to optimize your training around your menstrual cycle?</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[
                {v:true,  l:"Yes — I'd like cycle-aware training",   sub:"Volume, intensity, and coaching adjusts quietly each phase"},
                {v:false, l:"No thanks",                             sub:"Standard programming, no cycle adjustments"},
                {v:"menopause",l:"In menopause / not applicable",    sub:"Adjusted for hormonal changes without cycle tracking"},
                {v:"prefer_not",l:"Prefer not to say",              sub:"Standard programming"},
              ].map(o=>(
                <div key={String(o.v)} onClick={()=>{upd("cycleTracking",o.v);setTimeout(next,260);}} style={{background:data.cycleTracking===o.v?`${T.prot}10`:T.s1,border:`1.5px solid ${data.cycleTracking===o.v?T.prot:T.bd}`,borderRadius:11,padding:"13px 16px",cursor:"pointer",transition:"all .2s"}}>
                  <div style={{fontSize:13,fontWeight:700,color:data.cycleTracking===o.v?T.prot:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:11,color:T.mu,marginTop:3}}>{o.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* SCREEN 17 — Hybrid Bias (skip if not hybrid) */}
        {sc===17&&data.trainType!=="hybrid"&&(()=>{setTimeout(next,50);return null;})()}
        {sc===17&&data.trainType==="hybrid"&&<div style={{animation:"fadeIn .25s ease"}}>
          <div style={{fontSize:11,color:T.prot,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Train · AIT · 8/8</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:42,fontWeight:900,lineHeight:.9,marginBottom:8}}>
            WHICH MATTERS<br/><span style={{color:T.prot}}>MORE TO YOU?</span>
          </div>
          <p style={{fontSize:13,color:T.mu,marginBottom:20,lineHeight:1.65}}>This sets the volume ratio between lifting and running in your hybrid program.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {[
              {v:"lifting_primary", l:"Lifting is my priority",  sub:"Running supports my lifting — cardio, conditioning, and injury prevention",e:"🏋️",ratio:"70/30"},
              {v:"balanced",        l:"Equally important",       sub:"I want to be strong AND fast — true hybrid athlete",                          e:"⚡",ratio:"50/50"},
              {v:"running_primary", l:"Running is my priority",  sub:"Lifting supports my running — strength base and durability",                 e:"🏃",ratio:"30/70"},
            ].map(o=>(
              <div key={o.v} onClick={()=>auto("hybridBias",o.v)} style={{background:data.hybridBias===o.v?`${T.prot}10`:T.s2,border:`1.5px solid ${data.hybridBias===o.v?T.prot:T.bd}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .2s",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:28,flexShrink:0}}>{o.e}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:data.hybridBias===o.v?T.prot:"#fff"}}>{o.l}</div>
                  <div style={{fontSize:11,color:T.mu,marginTop:2,lineHeight:1.5}}>{o.sub}</div>
                </div>
                <div style={{fontSize:10,color:T.prot,background:`${T.prot}12`,padding:"3px 8px",borderRadius:6,flexShrink:0,fontWeight:700}}>{o.ratio}</div>
              </div>
            ))}
          </div>
        </div>}

        {/* SCREEN 18 — Injuries + GVT + Done (was screen 10) */}
        {sc===18&&<div style={{animation:"fadeIn .25s ease"}}>
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

