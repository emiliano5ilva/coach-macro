import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const sb = createClient(
  "https://oxxihlwqukbakmnnavuy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94eGlobHdxdWtiYWttbm5hdnV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTc3OTUsImV4cCI6MjA5MjQ5Mzc5NX0.IIK9gfRtgVidt6dShxAn6OCVNxIvdbFSFDYzWgVNFbk"
);

// ─── STRIPE PAYMENT LINKS ─────────────────────────────────────────────────────
// Replace these two URLs with your actual Stripe Payment Links
const STRIPE = {
  annual:  "https://buy.stripe.com/test_4gM8wQaGPepKaiQ83l7wA00",   // line 6 — paste your $19.99/yr link here
  monthly: "https://buy.stripe.com/test_6oU6oI4ir4PafDa5Vd7wA01",  // line 7 — paste your $4.99/mo link here
};

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// ─── COMPONENTS ───────────────────────────────────────────────────────────────
import { T, GLOBAL_CSS, WDAYS, MONTHS_A, DAYS_A, YEARS_A, FT_A, IN_A, CM_A, LBS_A, KG_A,
  BF_DATA, FOCUS_MUSCLES, SPLIT_CYCLES, DAY_CFG, FASTING_PROTOCOLS, MUSCLE_COVERAGE,
  RUN_PLANS, HYROX_STATIONS, Ring, MacroRing, MacroBar, Toggle, CC, PrimaryBtn,
  UnitToggle, Rolodex, SectionCard, Spinner, Logo, BodyFigure,
  autoFocus, getDayMacros, getTodayKey, isToday, hap, pad2,
  calcTDEE, useCountUp, lookupBarcode } from "./components.jsx";
import { Onboarding } from "./ob_screens.jsx";
import { App } from "./ob_screens2.jsx";
import { LandingPage } from "./landing.jsx";
import { FuelSection, TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, SPLITS_WITH_DAYS, GVT_INFO,
  LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES, PROMOS,
  PromoScreen, Paywall } from "./sections.jsx";
import { FuelOnboarding, TrainOnboarding } from "./onboarding.jsx";


// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [mode,setMode]=useState("signup"); // signup | login
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handle() {
    if(mode==="signup"&&!name.trim()){setError("Please enter your name.");return;}
    if(!email.trim()){setError("Please enter your email.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);setError("");
    try {
      if(mode==="signup") {
        const {data,error:e}=await sb.auth.signUp({email,password});
        if(e)throw e;
        if(data.user) onAuth(data.user, name.trim());
      } else {
        const {data,error:e}=await sb.auth.signInWithPassword({email,password});
        if(e)throw e;
        onAuth(data.user, null);
      }
    } catch(e){setError(e.message||"Something went wrong. Try again.");}
    setLoading(false);
  }

  const field=(label,val,setVal,type="text",ph="")=>(
    <div style={{marginBottom:14}}>
      <label style={{display:"block",fontSize:11,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:7}}>{label}</label>
      <input value={val} onChange={e=>setVal(e.target.value)} type={type} placeholder={ph}
        onKeyDown={e=>e.key==="Enter"&&handle()}
        style={{width:"100%",background:T.s2,border:`1.5px solid ${val?T.prot:T.bd}`,borderRadius:11,padding:"13px 16px",color:"#fff",fontSize:15,outline:"none",fontFamily:"'Inter',sans-serif",transition:"border-color .2s",boxSizing:"border-box"}}/>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <style>{GLOBAL_CSS}{`@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:40}}>
          <svg width={52} height={22} viewBox="0 0 52 22"><rect x={0} y={0} width={14} height={22} rx={3} fill={T.prot}/><rect x={19} y={5} width={14} height={17} rx={3} fill={T.carb}/><rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/></svg>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:"#fff"}}>COACH</div>
            <div><span style={{color:T.prot}}>M</span><span style={{color:T.carb}}>A</span><span style={{color:T.fat}}>C</span><span style={{color:"#fff"}}>RO</span></div>
          </div>
        </div>

        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,fontStyle:"italic",lineHeight:.88,marginBottom:12}}>
          {mode==="signup"?<div>CREATE YOUR<br/><span style={{color:T.prot}}>ACCOUNT.</span></div>:<div>WELCOME<br/><span style={{color:T.prot}}>BACK.</span></div>}
        </div>
        <p style={{fontSize:14,color:"#888",marginBottom:28,lineHeight:1.65}}>
          {mode==="signup"?"One account. Your plan, your logs, your progress — all saved.":"Sign in to pick up where you left off."}
        </p>

        {/* Toggle */}
        <div style={{display:"flex",background:T.s1,border:`1px solid ${T.bd}`,borderRadius:10,padding:4,marginBottom:24,gap:4}}>
          {[["signup","Create Account"],["login","Sign In"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{flex:1,padding:"10px",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?T.prot:"none",color:mode===m?"#fff":T.mu,fontWeight:700,fontSize:14,fontFamily:"'Inter',sans-serif",transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {mode==="signup"&&field("Your Name",name,setName,"text","e.g. Marcus")}
        {field("Email",email,setEmail,"email","you@email.com")}
        {field("Password",password,setPassword,"password","Min 6 characters")}

        {error&&<div style={{background:"rgba(255,77,109,.08)",border:"1px solid rgba(255,77,109,.25)",borderRadius:9,padding:"11px 14px",marginBottom:16,fontSize:13,color:"#FF4D6D"}}>{error}</div>}

        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"15px",background:loading?T.s3:T.prot,color:loading?T.mu:"#fff",fontWeight:700,fontSize:15,letterSpacing:.5,border:"none",borderRadius:11,cursor:loading?"default":"pointer",textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:16}}>
          {loading?"...":(mode==="signup"?"Create Account →":"Sign In →")}
        </button>
        <div style={{textAlign:"center",fontSize:12,color:"#333"}}>Your data is stored securely. We never sell it.</div>
      </div>
    </div>
  );
}


// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CoachMacro() {
  const [phase,setPhase]=useState("landing"); // landing | auth | onboarding | promo | paywall | app
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [schedule,setSchedule]=useState({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"});
  const [wPrefs,setWPrefs]=useState({splitType:"Push/Pull/Legs",equipment:"Full Gym",isHybrid:false,isHyrox:false});
  const [dayFocus,setDayFocus]=useState(autoFocus({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"},"Push/Pull/Legs"));
  const [earnedCals,setEarnedCals]=useState(0);
  const [signupName,setSignupName]=useState("");

  useEffect(()=>{
    // Only use getSession — ignore onAuthStateChange on initial load to avoid race
    sb.auth.getSession().then(({data:{session},error})=>{
      if(error||!session?.user){ return; /* no session = stay on landing */ }
      setUser(session.user);
      loadProfile(session.user.id);
    });
    // Only listen for explicit sign-out after initial load
    const {data:{subscription}}=sb.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){
        setUser(null);setProfile(null);setPhase("landing");
      }
    });
    return()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(uid) {
    console.log("Loading profile for uid:", uid);
    try {
      const {data,error}=await sb.from("profiles").select("*").eq("id",uid).single();
      console.log("Profile load result:", {data,error});
      if(error||!data){
        console.log("No profile found, going to onboarding. Error:", error?.message);
        setPhase("onboarding");return;
      }
      console.log("Profile found:", data.profile_data?.name);
      setProfile(data.profile_data);
      if(data.schedule)setSchedule(data.schedule);
      if(data.wprefs)setWPrefs(data.wprefs);
      // Load today's food logs
      const today=new Date().toISOString().split("T")[0];
      const {data:logs}=await sb.from("food_logs").select("*").eq("user_id",uid).eq("logged_at",today);
      if(logs&&logs.length>0)setLog(logs.map(l=>l.entry));
      // Load workout history
      const {data:wlogs}=await sb.from("workout_logs").select("*").eq("user_id",uid).order("logged_at",{ascending:false}).limit(50);
      if(wlogs&&wlogs.length>0){
        const hist={};
        wlogs.forEach(w=>{
          (w.entry?.exercises||[]).forEach(ex=>{
            const k=ex.name.toLowerCase().replace(/\s+/g,"_");
            if(!hist[k])hist[k]=[];
            hist[k].push({date:w.logged_at,sets:ex.sets});
          });
        });
        setHistory(hist);
      }
      setPhase("app");
    } catch(e){
      console.error("loadProfile exception:", e);
      setPhase("onboarding");
    }
  }

  async function saveProfile(uid,prof,sch,wp) {
    console.log("Saving profile for uid:", uid, "name:", prof?.name);
    if(!uid){console.error("No uid provided to saveProfile");return;}
    try {
      // Try upsert first
      const {data,error}=await sb.from("profiles")
        .upsert({id:uid,profile_data:prof,schedule:sch,wprefs:wp,updated_at:new Date().toISOString()})
        .select();
      if(error){
        console.error("Upsert error:", error.message, error.code, error.details);
        // Try insert as fallback
        const {data:d2,error:e2}=await sb.from("profiles")
          .insert({id:uid,profile_data:prof,schedule:sch,wprefs:wp});
        if(e2)console.error("Insert fallback error:", e2.message);
        else console.log("Profile inserted successfully (fallback)");
      } else {
        console.log("Profile upserted successfully:", data);
      }
    } catch(e){console.error("saveProfile exception:",e);}
  }

  async function handleAuth(authUser) {
    setPhase("loading");
    setUser(authUser);
    await loadProfile(authUser.id);
  }

  // Step 1: Profile onboarding done — go to fuel onboarding
  function handleProfileDone(od,tdee) {
    const baseProf={
      name:od.name,
      email:od.email||user?.email||"",
      sex:od.sex,
      dobMonth:od.dobMonth,dobDay:od.dobDay,dobYear:od.dobYear,
      hUnit:od.hUnit,hFt:od.hFt,hIn:od.hIn,hCm:od.hCm,
      wUnit:od.wUnit||"lbs",
      weight:od.weight,
      startWeight:parseFloat(od.weight)||0,
      startDate:new Date().toISOString().split("T")[0],
      bodyFat:od.bodyFat,
      job:od.job,steps:od.steps,
      activity:od.activity,
      sleep:od.sleep,sleepQ:od.sleepQ,
      conditions:od.conditions||[],
      cycle:od.cycle,
      metHistory:od.metHistory,
      protein:od.protein,
      healthConn:od.healthConn,
      baseTDEE:tdee.total,
      bmr:tdee.bmr,
      city:"",
    };
    setProfile(baseProf);
    setPhase("onboarding-fuel");
  }
  
  // Step 2: Fuel onboarding done — go to train onboarding
  function handleFuelDone(fuelData) {
    const updated={...profile,...fuelData};
    setProfile(updated);
    setPhase("onboarding-train");
  }
  
  // Step 3: Train onboarding done — save everything and go to promo
  async function handleTrainDone(trainData) {
    const finalProf={...profile,...trainData};
    
    // Build schedule from training days
    const trainDays={n0:[],["1-3"]:["Mon","Wed","Fri"],["4-6"]:["Mon","Tue","Thu","Fri","Sat"],["7+"]:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]}[trainData.freq]||["Mon","Wed","Fri"];
    const sch={Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"};
    trainDays.forEach(d=>{sch[d]="training";});
    if(trainData.trainType==="run"||trainData.trainType==="hybrid"){["Tue","Thu"].filter(d=>sch[d]==="rest").slice(0,1).forEach(d=>{sch[d]="cardio";});}
    
    const wp={
      splitType:trainData.split||"Push/Pull/Legs",
      equipment:trainData.equipment||"Full Gym",
      isHybrid:trainData.trainType==="hybrid",
      isHyrox:trainData.trainType==="hyrox",
      sessionLength:trainData.sessionLength||60,
      weakPoints:trainData.weakPoints||[],
      injuries:trainData.injuries||[],
    };
    
    setSchedule(sch);
    setWPrefs(wp);
    setProfile(finalProf);
    
    if(user){
      console.log("Saving complete profile to Supabase. User id:", user.id);
      await saveProfile(user.id,finalProf,sch,wp);
    }
    setPhase("promo");
  }

  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null);setProfile(null);setPhase("landing");
  }

  useEffect(()=>{
    if(!profile)return;
    const cycles=SPLIT_CYCLES[wPrefs.splitType]||["Full Body"];
    const f={};let i=0;
    WDAYS.forEach(d=>{
      if(schedule[d]==="training")f[d]=cycles[i++%cycles.length];
      else if(["cardio","run","hyrox"].includes(schedule[d]))f[d]=(DAY_CFG[schedule[d]]||DAY_CFG.rest).label;
      else f[d]="Rest";
    });
    setDayFocus(f);
  },[wPrefs.splitType,schedule,profile]);

  if(phase==="loading") return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{textAlign:"center"}}>
        <svg width={52} height={22} viewBox="0 0 52 22" style={{marginBottom:16}}><rect x={0} y={0} width={14} height={22} rx={3} fill={T.prot}/><rect x={19} y={5} width={14} height={17} rx={3} fill={T.carb}/><rect x={38} y={10} width={14} height={12} rx={3} fill={T.fat}/></svg>
        <div style={{fontSize:13,color:T.mu,letterSpacing:2}}>LOADING...</div>
      </div>
    </div>
  );

  if(phase==="landing")    return <LandingPage onSignUp={()=>setPhase("auth")}/>;
  if(phase==="auth")       return <AuthScreen onAuth={handleAuth}/>;
  if(phase==="onboarding") return <Onboarding onComplete={(d,tdee)=>handleProfileDone(d,tdee)} user={user} signupName={signupName}/>;
  if(phase==="onboarding-fuel") return <FuelOnboarding d={profile} onComplete={handleFuelDone} onBack={()=>setPhase("onboarding")}/>;
  if(phase==="onboarding-train") return <TrainOnboarding d={profile} onComplete={handleTrainDone} onBack={()=>setPhase("onboarding-fuel")}/>;
  if(phase==="promo")      return <PromoScreen profile={profile} onValidCode={()=>setPhase("app")} onNoCode={()=>setPhase("paywall")}/>;
  if(phase==="paywall")    return <Paywall profile={profile}/>;
  return <App profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} onEarnedCals={cals=>setEarnedCals(prev=>prev+cals)} onSignOut={handleSignOut} user={user}/>;
}
