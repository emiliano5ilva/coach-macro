import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

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
import { FuelSection } from "./fuel.jsx";
import { TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES, PROMOS,
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
  const [phase,setPhase]=useState("landing"); // landing | loading | auth | onboarding | promo | paywall | app
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [schedule,setSchedule]=useState({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"});
  const [wPrefs,setWPrefs]=useState({splitType:"Push/Pull/Legs",equipment:"Full Gym",isHybrid:false,isHyrox:false});
  const [dayFocus,setDayFocus]=useState(autoFocus({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"},"Push/Pull/Legs"));
  const [earnedCals,setEarnedCals]=useState(0);
  const [signupName,setSignupName]=useState("");
  const [saveErr,setSaveErr]=useState("");

  async function loadProfile(uid) {
    console.log("[loadProfile] starting for uid:", uid);
    try {
      // Diagnostic: count all rows in the table
      const {data:countData,error:countErr}=await sb.from("profiles").select("id");
      console.log("[loadProfile] total profile rows in table:", countData?.length, "countErr:", countErr?.message);

      const {data,error}=await sb.from("profiles").select("*").eq("id",uid).maybeSingle();
      console.log("[loadProfile] row for this user:", data ? "FOUND" : "NOT FOUND", "error:", error?.message);
      if(error){
        console.error("[loadProfile] query error:", error.message, error.code);
        setPhase("landing");
        return;
      }
      if(!data){
        console.log("[loadProfile] no profile row — routing to onboarding");
        setPhase("onboarding");
        return;
      }
      console.log("[loadProfile] profile_data keys:", Object.keys(data.profile_data||{}));
      if(data.profile_data) setProfile(data.profile_data);
      if(data.schedule) setSchedule(data.schedule);
      if(data.wprefs) setWPrefs(data.wprefs);
      console.log("[loadProfile] done — routing to app");
      setPhase("app");
    } catch(e){
      console.error("[loadProfile] exception:", e);
      setPhase("landing");
    }
  }

  // Returns true if the row was confirmed saved, false otherwise.
  async function saveProfile(uid,prof,sch,wp) {
    console.log("[saveProfile] called — uid:", uid, "profile keys:", Object.keys(prof||{}));
    if(!uid){ console.error("[saveProfile] no uid — aborting"); return false; }
    try {
      const payload={id:uid, profile_data:prof, schedule:sch, wprefs:wp, updated_at:new Date().toISOString()};
      console.log("[saveProfile] upserting payload keys:", Object.keys(payload));
      const {data:upsertData,error}=await sb.from("profiles")
        .upsert(payload, {onConflict:"id"})
        .select("id");
      console.log("[saveProfile] upsert result — data:", upsertData, "error:", error?.message, error?.code, error?.details);
      if(error){
        console.error("[saveProfile] upsert error:", error.message, error.code, error.details, error.hint);
        return false;
      }

      // Verify the row actually landed in the DB
      const {data:check,error:checkErr}=await sb.from("profiles").select("id").eq("id",uid).maybeSingle();
      console.log("[saveProfile] verification read — found:", !!check, "err:", checkErr?.message);
      if(checkErr||!check){
        console.error("[saveProfile] verification failed — row not found after upsert");
        return false;
      }
      console.log("[saveProfile] SUCCESS — row confirmed in DB");
      return true;
    } catch(e){ console.error("[saveProfile] exception:", e); return false; }
  }

  async function handleAuth(authUser, name="") {
    console.log("[handleAuth] uid:", authUser?.id, "name:", name);
    setPhase("loading");
    setUser(authUser);
    if(name) setSignupName(name);
    await loadProfile(authUser.id);
  }

  // Step 1: Profile onboarding done — go to fuel onboarding
  function handleProfileDone(od,tdee) {
    console.log("[handleProfileDone] building base profile for:", od.name);
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
    console.log("[handleFuelDone] goal:", fuelData.goal);
    const updated={...profile,...fuelData};
    // getDayMacros expects title-case goal: "Cut" | "Maintain" | "Bulk"
    if(updated.goal) updated.goal=updated.goal.charAt(0).toUpperCase()+updated.goal.slice(1).toLowerCase();
    setProfile(updated);
    setPhase("onboarding-train");
  }

  // Step 3: Train onboarding done — save everything and go to promo
  async function handleTrainDone(trainData) {
    console.log("[handleTrainDone] called — user:", user?.id, "trainType:", trainData.trainType, "split:", trainData.split, "freq:", trainData.freq);
    setSaveErr("");
    const finalProf={...profile,...trainData};

    // Map TrainOnboarding freq values ("1-2","3","4","5","6","7") to actual day lists
    const trainDaysMap={
      "1-2":["Mon","Thu"],
      "3":  ["Mon","Wed","Fri"],
      "4":  ["Mon","Tue","Thu","Fri"],
      "5":  ["Mon","Tue","Wed","Thu","Fri"],
      "6":  ["Mon","Tue","Wed","Thu","Fri","Sat"],
      "7":  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    };
    const trainDays=trainDaysMap[trainData.freq]||["Mon","Wed","Fri"];
    const sch={Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"};
    trainDays.forEach(d=>{sch[d]="training";});
    if(trainData.trainType==="running"||trainData.trainType==="hybrid"){
      ["Tue","Thu"].filter(d=>sch[d]==="rest").slice(0,1).forEach(d=>{sch[d]="cardio";});
    }

    // Map split IDs from TrainOnboarding to SPLIT_CYCLES keys used throughout the app
    const splitTypeMap={
      "full_body":"Full Body","ppl_half":"Push/Pull/Legs","upper_lower_3":"Upper/Lower",
      "upper_lower":"Upper/Lower","ppl_upper":"Push/Pull/Legs","bro_4":"Bro Split",
      "bro_split":"Bro Split","upper_lower_5":"Upper/Lower","ppl_upper_lower":"Push/Pull/Legs",
      "ppl_6":"Push/Pull/Legs","arnold":"Arnold Split","upper_lower_6":"Upper/Lower",
      "ppl_7":"Push/Pull/Legs","bro_7":"Bro Split",
      "c25k":"Full Body","5k_sub25":"Full Body","10k":"Full Body","half":"Full Body","marathon":"Full Body",
      "hyrox_12w":"Full Body","hyrox_strength":"Full Body","hyrox_run":"Full Body",
      "strength_run":"Push/Pull/Legs","ppl_hyrox":"Push/Pull/Legs",
      "upper_lower_run":"Upper/Lower","hyrox_hybrid":"Full Body",
    };

    const wp={
      splitType:splitTypeMap[trainData.split]||"Push/Pull/Legs",
      equipment:trainData.equipment||"Full Gym",
      isHybrid:trainData.trainType==="hybrid",
      isHyrox:trainData.trainType==="hyrox",
      sessionLength:trainData.sessionLength||60,
      weakPoints:trainData.weakPoints||[],
      injuries:trainData.injuries||[],
    };

    console.log("[handleTrainDone] schedule:", sch, "wprefs splitType:", wp.splitType);
    setSchedule(sch);
    setWPrefs(wp);
    setProfile(finalProf);
    setPhase("loading");

    if(!user){
      console.error("[handleTrainDone] no authenticated user — cannot save profile");
      setSaveErr("Not logged in. Please sign in again.");
      return; // stay on loading with error shown
    }

    console.log("[handleTrainDone] attempt 1 — saving for uid:", user.id);
    const saved=await saveProfile(user.id,finalProf,sch,wp);

    if(!saved){
      console.warn("[handleTrainDone] attempt 1 failed — retrying in 1500ms...");
      await new Promise(r=>setTimeout(r,1500));
      console.log("[handleTrainDone] attempt 2 — saving for uid:", user.id);
      const saved2=await saveProfile(user.id,finalProf,sch,wp);
      if(!saved2){
        console.error("[handleTrainDone] BOTH attempts failed — not proceeding to promo");
        setSaveErr("Could not save your profile. Check your connection and try again.");
        return; // do NOT advance — stay on loading screen showing error
      }
      console.log("[handleTrainDone] attempt 2 succeeded");
    } else {
      console.log("[handleTrainDone] attempt 1 succeeded");
    }

    console.log("[handleTrainDone] profile saved — routing to promo");
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
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{textAlign:"center",maxWidth:340}}>
        <div style={{marginBottom:16}}><Logo size={36} text={false}/></div>
        {saveErr
          ?<>
            <div style={{fontSize:13,color:"#FF4D6D",marginBottom:16,lineHeight:1.6}}>{saveErr}</div>
            <button onClick={()=>{setSaveErr("");window.location.reload();}} style={{padding:"12px 28px",background:T.prot,color:"#fff",fontWeight:700,fontSize:14,border:"none",borderRadius:11,cursor:"pointer",fontFamily:"inherit"}}>Try Again</button>
          </>
          :<div style={{fontSize:13,color:T.mu,letterSpacing:2}}>SAVING YOUR PLAN...</div>
        }
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
