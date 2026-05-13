import { useState, useEffect, useRef } from "react";
/*
  Supabase DDL — run once in Supabase SQL editor:

  -- food_logs: one row per user per day, full log as JSON array
  create table if not exists food_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    date date not null,
    entries jsonb default '[]',
    created_at timestamptz default now(),
    unique(user_id, date)
  );
  alter table food_logs enable row level security;
  create policy "Users manage own food logs" on food_logs for all using (auth.uid() = user_id);

  -- workout_logs: one row per session
  create table if not exists workout_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    date date not null,
    workout jsonb,
    created_at timestamptz default now()
  );
  alter table workout_logs enable row level security;
  create policy "Users manage own workout logs" on workout_logs for all using (auth.uid() = user_id);

  -- profiles: add referral_code column if not already present
  alter table profiles add column if not exists referral_code text;

  -- profiles RLS: run these if INSERT/UPDATE are being blocked
  create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
  create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

  -- referral_count and referral_tier on profiles (updated server-side via api/r.js)
  alter table profiles add column if not exists referral_count int default 0;
  alter table profiles add column if not exists referral_tier int default 0;
  alter table profiles add column if not exists referral_code text;

  -- referrals: one row per share link, click-counted
  create table if not exists referrals (
    id uuid primary key default gen_random_uuid(),
    referrer_id uuid references auth.users(id) on delete cascade,
    token text unique not null,
    clicked boolean default false,
    clicked_at timestamptz,
    clicked_ip text,
    recipient_user_id uuid,
    created_at timestamptz default now()
  );
  alter table referrals enable row level security;
  create policy "Users manage own referrals" on referrals for all using (auth.uid() = referrer_id);

  -- flagged_responses: AI safety flagging system
  create table if not exists flagged_responses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    response_text text,
    flag_reason text not null,
    feature text,
    created_at timestamptz default now()
  );
  alter table flagged_responses enable row level security;
  create policy "Users can insert flags" on flagged_responses for insert with check (auth.uid() = user_id or user_id is null);
  create policy "Admins can read flags" on flagged_responses for select using (auth.uid() = user_id);

  -- profiles: safety columns
  alter table profiles add column if not exists is_youth boolean default false;
  alter table profiles add column if not exists is_older_adult boolean default false;
  alter table profiles add column if not exists health_conditions jsonb default '[]';

  -- food_history: recent + frequent foods per user (for food search UX)
  create table if not exists food_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    food_id text not null,
    food_name text not null,
    food_data jsonb not null,
    last_used timestamptz default now(),
    use_count int default 1,
    unique(user_id, food_id)
  );
  alter table food_history enable row level security;
  create policy "Users manage own food history" on food_history for all using (auth.uid() = user_id);

  -- exercise_cache: start/end position images + metadata, cached forever
  -- Images: free-exercise-db GitHub JPGs (start=gif_url, end=gif_url_2)
  -- Metadata: ExerciseDB API (muscles, instructions, equipment)
  create table if not exists exercise_cache (
    id uuid primary key default gen_random_uuid(),
    exercise_name text unique not null,
    gif_url text,
    gif_url_2 text,
    target_muscles text[] default '{}',
    secondary_muscles text[] default '{}',
    instructions text[] default '{}',
    equipment text,
    created_at timestamptz default now()
  );
  -- If table already exists, add gif_url_2 column:
  alter table exercise_cache add column if not exists gif_url_2 text;
  -- No RLS needed — public read, public insert (cache only, no user data)
  alter table exercise_cache enable row level security;
  create policy "Public read exercise cache" on exercise_cache for select using (true);
  create policy "Authenticated insert exercise cache" on exercise_cache for insert with check (true);

  -- custom_foods: user-created foods for food search
  create table if not exists custom_foods (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    brand text,
    serving_size numeric default 100,
    serving_unit text default 'g',
    calories numeric not null,
    protein numeric default 0,
    carbs numeric default 0,
    fat numeric default 0,
    fiber numeric default 0,
    sugar numeric default 0,
    sodium numeric default 0,
    created_at timestamptz default now()
  );
  alter table custom_foods enable row level security;
  create policy "Users manage own custom foods" on custom_foods for all using (auth.uid() = user_id);
*/
import { sb, signInWithGoogle, signInWithApple } from "./supabase.js";

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
import { getAge } from "./utils/safety.js";
import { getErrorMessage } from "./utils/errors.js";
import { ErrorMessage } from "./utils/errors.jsx";
import { App } from "./ob_screens2.jsx";
import { LandingPage } from "./landing.jsx";
import { FuelSection } from "./fuel.jsx";
import { TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES, PROMOS,
  PromoScreen, Paywall } from "./sections.jsx";
import { FuelOnboarding, TrainOnboarding } from "./onboarding.jsx";

// ─── SPLASH SCREEN ────────────────────────────────────────────────────────────
function SplashScreen({onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,2400);return()=>clearTimeout(t);},[]);
  return(
    <div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <style>{GLOBAL_CSS}</style>
      <style>{`@keyframes splash-logo{0%{opacity:0;transform:scale(0.85) translateY(8px)}60%{opacity:1;transform:scale(1.04) translateY(-2px)}100%{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      <div style={{animation:"splash-logo 0.9s cubic-bezier(.2,.7,.3,1) forwards",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <Logo size={48} text={false}/>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:28,letterSpacing:"-0.01em",textTransform:"uppercase",color:"var(--white)"}}>Coach Macro</div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--red)",marginTop:4}}>AI ATHLETIC COACHING</div>
      </div>
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
const AppleSVG=()=>(
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);
const GoogleSVG=()=>(
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function AuthScreen({onAuth}) {
  const [view,setView]=useState("welcome"); // welcome | signin | signup
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [oauthLoading,setOauthLoading]=useState(""); // "apple" | "google" | ""
  const [error,setError]=useState("");

  async function handle() {
    if(view==="signup"&&!name.trim()){setError("Please enter your name.");return;}
    if(!email.trim()){setError("Please enter your email.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);setError("");
    try {
      if(view==="signup") {
        const {data,error:e}=await sb.auth.signUp({email,password});
        if(e)throw e;
        if(data.user) onAuth(data.user, name.trim());
      } else {
        const {data,error:e}=await sb.auth.signInWithPassword({email,password});
        if(e)throw e;
        onAuth(data.user, null);
      }
    } catch(e){setError(getErrorMessage(e));}
    setLoading(false);
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider);setError("");
    try {
      const fn=provider==="apple"?signInWithApple:signInWithGoogle;
      const {error:e}=await fn();
      if(e)throw e;
      // page will redirect; oauthLoading stays true
    } catch(e){setError(getErrorMessage(e));setOauthLoading("");}
  }

  const inputStyle=(val)=>({
    width:"100%",background:"rgba(245,245,240,0.04)",
    border:`1.5px solid ${val?"var(--red)":"var(--white-border)"}`,
    borderRadius:12,padding:"14px 16px",color:"var(--white)",fontSize:15,
    outline:"none",fontFamily:"var(--body)",transition:"border-color .2s",
    boxSizing:"border-box",
  });

  const labelStyle={display:"block",fontSize:10,color:"var(--white-dim)",fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:7,fontFamily:"var(--mono)"};
  const invitePending=(()=>{try{return JSON.parse(localStorage.getItem('coachMacroInvite')||'null');}catch{return null;}})();

  const field=(label,val,setVal,type="text",ph="")=>(
    <div style={{marginBottom:14}}>
      <label style={labelStyle}>{label}</label>
      <input value={val} onChange={e=>setVal(e.target.value)} type={type} placeholder={ph}
        onKeyDown={e=>e.key==="Enter"&&handle()} style={inputStyle(val)}/>
    </div>
  );

  const outer={minHeight:"100vh",background:"var(--navy)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",position:"relative",overflow:"hidden"};

  const socialDivider=(
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}>
      <div style={{flex:1,height:1,background:"var(--white-border)"}}/>
      <span style={{fontSize:10,color:"var(--white-faint)",fontFamily:"var(--mono)",letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"}}>or continue with</span>
      <div style={{flex:1,height:1,background:"var(--white-border)"}}/>
    </div>
  );

  const appleBtn=(
    <button onClick={()=>handleOAuth("apple")} disabled={!!oauthLoading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",background:oauthLoading==="apple"?"rgba(245,245,240,0.06)":"rgba(245,245,240,0.97)",color:oauthLoading==="apple"?"var(--white-dim)":"#111",fontWeight:700,fontSize:14,letterSpacing:"0.04em",border:"none",borderRadius:13,cursor:oauthLoading?"default":"pointer",fontFamily:"var(--body)",marginBottom:10,transition:"opacity .15s",opacity:oauthLoading&&oauthLoading!=="apple"?0.45:1}}>
      <AppleSVG/>{oauthLoading==="apple"?"Redirecting…":"Continue with Apple"}
    </button>
  );

  const googleBtn=(
    <button onClick={()=>handleOAuth("google")} disabled={!!oauthLoading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",background:oauthLoading==="google"?"rgba(245,245,240,0.04)":"rgba(245,245,240,0.06)",color:oauthLoading==="google"?"var(--white-dim)":"var(--white)",fontWeight:700,fontSize:14,letterSpacing:"0.04em",border:"1px solid var(--white-border)",borderRadius:13,cursor:oauthLoading?"default":"pointer",fontFamily:"var(--body)",transition:"opacity .15s",opacity:oauthLoading&&oauthLoading!=="google"?0.45:1}}>
      <GoogleSVG/>{oauthLoading==="google"?"Redirecting…":"Continue with Google"}
    </button>
  );

  if(view==="welcome") return(
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <div className="grid-bg" style={{position:"absolute",inset:0,opacity:0.5,pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{marginBottom:32,display:"flex",justifyContent:"center"}}><Logo size={40} text={false}/></div>
        {invitePending&&<div style={{background:"rgba(0,230,118,0.08)",border:"1px solid rgba(0,230,118,0.3)",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🎉</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"#00E676",fontFamily:"var(--condensed)",letterSpacing:1}}>You've been invited!</div>
            <div style={{fontSize:12,color:"var(--white-dim)",fontFamily:"var(--body)",marginTop:2}}>Sign up for 2 weeks free — no credit card needed.</div>
          </div>
        </div>}
        <div className="header-eyebrow" style={{textAlign:"center",marginBottom:12}}>AI Athletic Coaching</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:52,lineHeight:.88,marginBottom:18,color:"var(--white)",textAlign:"center",textTransform:"uppercase"}}>
          Stop Guessing.<br/><span style={{color:"var(--red)"}}>Start Knowing.</span>
        </div>
        <p style={{fontSize:14,color:"var(--white-dim)",marginBottom:28,lineHeight:1.65,fontFamily:"var(--body)",textAlign:"center"}}>
          AI-powered macros, workouts, and coaching — built around your body and your goals.
        </p>
        <button onClick={()=>setView("signup")} style={{width:"100%",padding:"16px",background:"var(--red)",color:"white",fontWeight:800,fontSize:15,letterSpacing:"0.1em",border:"none",borderRadius:14,cursor:"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)",marginBottom:12}}>
          Join Waitlist →
        </button>
        <button onClick={()=>setView("signin")} style={{width:"100%",padding:"16px",background:"rgba(245,245,240,0.06)",color:"var(--white)",fontWeight:700,fontSize:15,letterSpacing:"0.1em",border:"1px solid var(--white-border)",borderRadius:14,cursor:"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)",marginBottom:8}}>
          Sign In
        </button>
        {socialDivider}
        {appleBtn}
        {googleBtn}
        {error&&<ErrorMessage error={error} style={{marginTop:8}}/>}
        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:"var(--white-faint)",fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>Secure · Private · No spam</div>
      </div>
    </div>
  );

  return(
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <div className="grid-bg" style={{position:"absolute",inset:0,opacity:0.5,pointerEvents:"none"}}/>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <button onClick={()=>{setView("welcome");setError("");}} style={{background:"none",border:"none",color:"var(--white-dim)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:32,display:"flex",alignItems:"center",gap:6,padding:0}}>
          <svg width={14} height={14} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          Back
        </button>

        <div className="header-eyebrow" style={{marginBottom:10}}>{view==="signup"?"Create Account":"Welcome Back"}</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,lineHeight:.88,marginBottom:24,color:"var(--white)",textTransform:"uppercase"}}>
          {view==="signup"?<span>Your Plan<br/><span style={{color:"var(--red)"}}>Awaits.</span></span>:<span>Good to<br/><span style={{color:"var(--red)"}}>See You.</span></span>}
        </div>

        {appleBtn}
        {googleBtn}
        {socialDivider}

        {view==="signup"&&field("Your Name",name,setName,"text","e.g. Marcus")}
        {field("Email",email,setEmail,"email","you@email.com")}
        {field("Password",password,setPassword,"password","Min 6 characters")}

        {error&&<ErrorMessage error={error} style={{marginBottom:16}}/>}

        <button onClick={handle} disabled={loading||!!oauthLoading} style={{width:"100%",padding:"16px",background:loading?"rgba(245,245,240,0.1)":"var(--red)",color:loading?"var(--white-dim)":"white",fontWeight:800,fontSize:15,letterSpacing:"0.1em",border:"none",borderRadius:14,cursor:loading?"default":"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)",marginBottom:16}}>
          {loading?"...":(view==="signup"?"Create Account →":"Sign In →")}
        </button>

        <div style={{textAlign:"center",fontSize:11,color:"var(--white-faint)",fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>
          {view==="signup"
            ?<span>Already have an account? <button onClick={()=>{setView("signin");setError("");}} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.08em",padding:0}}>Sign In</button></span>
            :<span>New here? <button onClick={()=>{setView("signup");setError("");}} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.08em",padding:0}}>Create Account</button></span>
          }
        </div>
      </div>
    </div>
  );
}


// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function CoachMacro() {
  const [phase,setPhase]=useState("splash"); // splash | landing | loading | auth | onboarding | promo | paywall | app
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
      if(data.profile_data) setProfile({...data.profile_data,referralCount:data.referral_count||data.profile_data?.referralCount||0});
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
    console.log("User at save time:", uid, typeof uid);
    console.log("prof first 100:", JSON.stringify(prof).slice(0,100));
    console.log("sch first 100:", JSON.stringify(sch).slice(0,100));
    console.log("wp first 100:", JSON.stringify(wp).slice(0,100));
    if(!uid){ console.error("[saveProfile] no uid — aborting"); return false; }
    try {
      const { data, error } = await sb
        .from("profiles")
        .upsert({
          id: uid,
          profile_data: prof,
          schedule: sch,
          wprefs: wp,
          referral_code: prof.referralCode||null,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" })
        .select();

      console.log("Save result - data:", data, "error:", error);

      if (error) {
        console.error("FULL ERROR:", JSON.stringify(error));
        throw error;
      }

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
      // female-specific
      lifeStage:od.lifeStage||"",
      trimester:od.trimester||"",
      postpartumWeeks:od.postpartumWeeks||0,
      csection:od.csection||false,
      menopauseSymptoms:od.menopauseSymptoms||[],
      cycleCondition:od.cycleCondition||[],
      fitnessMotivation:od.fitnessMotivation||"",
      eatingHistory:od.eatingHistory||"",
      boneHistory:od.boneHistory||"",
      // safety
      healthConditions:od.healthConditions||[],
      is_youth:(()=>{const a=getAge(od.dobYear,od.dobMonth,od.dobDay);return a!==null&&a>=13&&a<18;})(),
      is_older_adult:(()=>{const a=getAge(od.dobYear,od.dobMonth,od.dobDay);return a!==null&&a>=65;})(),
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
    // Generate stable referral code if not already set
    if(!finalProf.referralCode){
      const first=(finalProf.name||"USER").split(" ")[0].replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,8)||"USER";
      finalProf.referralCode=first+Math.floor(1000+Math.random()*9000);
      console.log("[handleTrainDone] generated referral code:", finalProf.referralCode);
    }
    // All new users get a 2-week trial; invited users get extra tracking
    let _inviteToken=null;
    try{
      const _inv=JSON.parse(localStorage.getItem('coachMacroInvite')||'null');
      if(_inv&&(Date.now()-(_inv.savedAt||0))<7*86400000){
        finalProf.freeWeeksApplied=true;
        finalProf.inviteCode=_inv.code||'';
        _inviteToken=_inv.token||null;
        localStorage.removeItem('coachMacroInvite');
      }
    }catch{}
    // Give every new user a 14-day trial (invite users already have one set)
    if(!finalProf.trialEndsAt){
      finalProf.trialEndsAt=new Date(Date.now()+14*86400000).toISOString();
      finalProf.trialStartAt=new Date().toISOString();
    }

    // Use user-selected days from day picker, or fall back to auto-assign from freq
    let sch;
    if(trainData.selectedDays&&Object.values(trainData.selectedDays).some(v=>v!=="rest")){
      sch=trainData.selectedDays;
    }else{
      const trainDaysMap={"1-2":["Mon","Thu"],"3":["Mon","Wed","Fri"],"4":["Mon","Tue","Thu","Fri"],"5":["Mon","Tue","Wed","Thu","Fri"],"6":["Mon","Tue","Wed","Thu","Fri","Sat"],"7":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]};
      const trainDays=trainDaysMap[trainData.freq]||["Mon","Wed","Fri"];
      sch={Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"};
      trainDays.forEach(d=>{sch[d]="training";});
      if(trainData.trainType==="running"||trainData.trainType==="hybrid"){
        ["Tue","Thu"].filter(d=>sch[d]==="rest").slice(0,1).forEach(d=>{sch[d]="cardio";});
      }
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
      // running-specific
      current5KTime:trainData.current5KTime||null,
      runningGoal:trainData.runningGoal||"",
      raceDate:trainData.raceDate||"",
      terrain:trainData.terrain||"road",
      trackAccess:trainData.trackAccess||false,
      longRunDay:trainData.longRunDay||"Sunday",
      cardioExp:trainData.cardioExp||"",
      runPlan:({"first_5k":"Couch to 5K","fitness":"Couch to 5K","sub25_5k":"Sub-25 5K","first_10k":"10K Training","sub50_10k":"10K Training","half":"Half Marathon","marathon":"Half Marathon"})[trainData.runningGoal||""]||"Couch to 5K",
      // AIT fields
      recoveryCapacity:trainData.recoveryCapacity||"normal",
      musclePriorities:trainData.musclePriorities||[],
      trainingAge:trainData.trainingAge||"developing",
      blackoutDays:trainData.blackoutDays||[],
      mobilityLimitations:trainData.mobilityLimitations||[],
      stressLevel:trainData.stressLevel||"low",
      sleepQuality:trainData.sleepQuality||"average",
      jobPhysicality:trainData.jobPhysicality||"desk",
      cycleTracking:trainData.cycleTracking??null,
      hybridBias:trainData.hybridBias||"",
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

    console.log("[handleTrainDone] profile saved — routing to celebrate");
    if(_inviteToken){
      sb.from('referrals').update({recipient_user_id:user.id}).eq('token',_inviteToken).eq('clicked',true).then(()=>{});
    }
    setPhase("celebrate");
  }

  async function handleSignOut() {
    await sb.auth.signOut();
    setUser(null);setProfile(null);setPhase("landing");
  }

  // Check URL for referral invite params on first load + detect OAuth redirect sessions
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get('invited')==='true'){
      try{
        const inv={code:params.get('code')||'',token:params.get('token')||'',freeWeeks:2,savedAt:Date.now()};
        localStorage.setItem('coachMacroInvite',JSON.stringify(inv));
      }catch{}
      window.history.replaceState({},'','/');
    }
    // After OAuth redirect, Supabase restores the session — detect it here
    sb.auth.getSession().then(({data:{session}})=>{
      if(session?.user) handleAuth(session.user, null);
    });
    const {data:{subscription}}=sb.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_IN"&&session?.user) handleAuth(session.user, null);
    });
    // Trial/subscription expired — show paywall from anywhere in the app
    const onSubRequired=()=>setPhase("paywall");
    window.addEventListener("cm:subscription-required",onSubRequired);
    return()=>{subscription.unsubscribe();window.removeEventListener("cm:subscription-required",onSubRequired);};
  },[]);

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
        <div style={{marginBottom:16}}><Logo size={36} text={true}/></div>
        {saveErr
          ?<>
            <div style={{fontSize:13,color:T.red,marginBottom:16,lineHeight:1.6,fontFamily:"'Barlow',sans-serif"}}>{saveErr}</div>
            <button onClick={()=>{setSaveErr("");window.location.reload();}} style={{padding:"12px 28px",background:T.prot,color:T.white,fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1,textTransform:"uppercase"}}>Try Again</button>
          </>
          :<div style={{fontSize:11,color:T.mu,letterSpacing:"0.16em",fontFamily:"'DM Mono',monospace",textTransform:"uppercase"}}>SAVING YOUR PLAN...</div>
        }
      </div>
    </div>
  );

  if(phase==="splash")     return <SplashScreen onDone={()=>setPhase("landing")}/>;
  if(phase==="landing")    return <LandingPage onSignUp={()=>setPhase("auth")}/>;
  if(phase==="auth")       return <AuthScreen onAuth={handleAuth}/>;
  if(phase==="onboarding") return <Onboarding onComplete={(d,tdee)=>handleProfileDone(d,tdee)} user={user} signupName={signupName}/>;
  if(phase==="onboarding-fuel") return <FuelOnboarding d={profile} onComplete={handleFuelDone} onBack={()=>setPhase("onboarding")}/>;
  if(phase==="onboarding-train") return <TrainOnboarding d={profile} onComplete={handleTrainDone} onBack={()=>setPhase("onboarding-fuel")}/>;
  if(phase==="celebrate"){
    const cKey=getTodayKey();
    const cType=schedule[cKey]||"training";
    const cMacros=getDayMacros(profile?.goalCals,profile?.goal,cType,0);
    const cFocus=dayFocus[cKey]||"Full Body";
    return(
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{GLOBAL_CSS}</style>
        <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
          <div style={{fontSize:64,marginBottom:8}}>🎉</div>
          <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Your Plan Is Ready</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:48,fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:24}}>
            LET'S GO,<br/><span style={{color:T.prot}}>{profile?.name?.toUpperCase()||"ATHLETE"}.</span>
          </div>
          <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:18,padding:"20px 24px",marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14,fontFamily:"'DM Mono',monospace"}}>Today's Targets</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[["Cals",cMacros.calories,"kcal",T.prot],["Protein",cMacros.protein,"g",T.prot],["Carbs",cMacros.carbs,"g",T.carb],["Fat",cMacros.fat,"g",T.fat]].map(([l,v,u,c])=>(
                <div key={l} style={{background:T.s2,borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,fontStyle:"italic",color:c,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:T.mu,marginTop:2,fontFamily:"'DM Mono',monospace"}}>{u}</div>
                  <div style={{fontSize:9,color:T.mu,marginTop:1,fontFamily:"'DM Mono',monospace"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:18,padding:"16px 24px",marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:8,fontFamily:"'DM Mono',monospace"}}>Today's Focus</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,fontStyle:"italic",color:T.carb,textTransform:"uppercase"}}>{cFocus}</div>
            <div style={{fontSize:12,color:T.mu,marginTop:4,lineHeight:1.5,fontFamily:"'Barlow',sans-serif"}}>{FOCUS_MUSCLES[cFocus]||"Full body movement — every major muscle pattern covered."}</div>
          </div>
          {profile?.trialEndsAt&&<div style={{background:"rgba(0,230,118,0.06)",border:"1.5px solid rgba(0,230,118,0.25)",borderRadius:18,padding:"16px 24px",marginBottom:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:6}}>🎁</div>
            <div style={{fontSize:10,color:"#00E676",fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:6,fontFamily:"'DM Mono',monospace"}}>2-Week Free Trial</div>
            <div style={{fontSize:13,color:T.mu,lineHeight:1.6}}>Full AI access included — trial ends {new Date(profile.trialEndsAt).toLocaleDateString("en-US",{month:"long",day:"numeric"})}.</div>
          </div>}
          <button onClick={()=>setPhase("promo")} style={{width:"100%",padding:"16px",background:T.prot,color:T.white,border:"none",borderRadius:14,fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1,minHeight:52}}>
            Let's Go →
          </button>
        </div>
      </div>
    );
  }
  if(phase==="promo")      return <PromoScreen profile={profile} onValidCode={()=>setPhase("app")} onNoCode={()=>setPhase("paywall")}/>;
  if(phase==="paywall")    return <Paywall profile={profile}/>;
  return <App profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} onEarnedCals={cals=>setEarnedCals(prev=>prev+cals)} onSignOut={handleSignOut} user={user}/>;
}
