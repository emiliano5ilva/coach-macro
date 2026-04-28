import { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, MONTHS_A, DAYS_A, YEARS_A, FT_A, IN_A, CM_A, LBS_A, KG_A,
  BF_DATA, BF_VISUAL, FOCUS_MUSCLES, SPLIT_CYCLES, DAY_CFG, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, calcTDEE, autoFocus, useCountUp } from "./components.jsx";
import { ChoiceScreens, TDEEReveal, GoalScreen } from "./ob_screens2.jsx";


export function Onboarding({onComplete, user, signupName}) {
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
        {sc===23&&<TDEEReveal tdee={tdee} animTDEE={animTDEE} d={d} chatReply={chatReply} setCR={setCR} next={()=>onComplete(d,tdee)}/>}
      </div>
    </div>
  );
}



// ─── BODY FIGURE SVG ─────────────────────────────────────────────────────────
export function BodyFigure({pct, color, selected}) {
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
ort { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, MONTHS_A, DAYS_A, YEARS_A, FT_A, IN_A, CM_A, LBS_A, KG_A,
  BF_DATA, BF_VISUAL, FOCUS_MUSCLES, SPLIT_CYCLES, DAY_CFG, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, Toggle, PrimaryBtn, UnitToggle, Rolodex,
  SectionCard, Spinner, Logo, CC, calcTDEE, autoFocus, useCountUp } from "./components.jsx";
import { ChoiceScreens, TDEEReveal, GoalScreen } from "./ob_screens2.jsx";


export function Onboarding({onComplete, user, signupName}) {
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
        {sc===23&&<TDEEReveal tdee={tdee} animTDEE={animTDEE} d={d} chatReply={chatReply} setCR={setCR} next={()=>onComplete(d,tdee)}/>}
      </div>
    </div>
  );
}



// ─── BODY FIGURE SVG ─────────────────────────────────────────────────────────
export function BodyFigure({pct, color, selected}) {
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

export const BF_VISUAL=[
  {r:"5–7%",   pct:6,  c:"#29B6F6",l:"Athletic",  desc:"Visible striations, very lean"},
  {r:"8–12%",  pct:10, c:"#00E676", l:"Fit",       desc:"Visible abs, athletic build"},
  {r:"13–17%", pct:15, c:"#2979FF", l:"Lean",      desc:"Defined, not shredded"},
  {r:"18–24%", pct:21, c:"#FFD740", l:"Average",   desc:"Soft, no visible abs"},
  {r:"25–30%", pct:27, c:"#FFA726", l:"Above avg", desc:"Rounded belly, soft arms"},
  {r:"31–40%", pct:35, c:"#EF6C00", l:"High",      desc:"Significant fat coverage"},
  {r:"40+%",   pct:43, c:"#FF4D6D", l:"Obese",     desc:"High health risk range"},
];