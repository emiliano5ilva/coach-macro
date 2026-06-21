import { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, SPLIT_CYCLES,
  Logo, getDayMacros, getTodayKey, autoFocus,
  calcTDEE, FOCUS_MUSCLES } from "./components.jsx";
import { selectDayKey, baseName } from "./programs.js";
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { Onboarding } from "./ob_screens.jsx";
import { NewOnboarding, NEW_ONBOARDING } from "./ob_new.jsx";
import { App } from "./ob_screens2.jsx";
import { getAge } from "./utils/safety.js";
import { minSecToInterval, RUNNING_GOAL_TO_RACE_TYPE } from "./utils/runPlanUtils.js";
import { getErrorMessage } from "./utils/errors.js";
import { ErrorMessage } from "./utils/errors.jsx";
import { sb } from "./supabase.js";
import { track, EVENTS, setAnalyticsEnabled } from "./services/analytics.js";
import { initDeepLinks } from "./services/deepLinks.js";
import { initPushNotifications, scheduleTrialExpiryNotification } from "./services/notifications.js";
import { FuelOnboarding, TrainOnboarding } from "./onboarding.jsx";
import { PromoScreen, Paywall, UpgradeScreen, ExpiredPaywall } from "./sections.jsx";
import { isExpired } from "./utils/subscription.js";
import { checkEntitlements } from "./services/purchaseService.js";
import { PrivacyPolicy, TermsOfService } from "./legal.jsx";
import { loadAndApplyTheme, applyDefaultTheme } from "./utils/themeService.js";

// Synchronous default at module load — sets --cm-* on :root before React renders anything,
// so there is no flash even after removing the static values from REDESIGN_CSS.
applyDefaultTheme();

// Dev-only: auto-sign-in with seeded demo account so simulator reaches phase="app".
// Guard: import.meta.env.MODE — Vite replaces this with the literal string at build
// time. `vite build` (prod) → MODE="production" → first check returns false → dead
// code eliminated by terser. `npm run build:sim` → MODE="development" → bypass runs.
// Credentials come from .env.development.local (not loaded by prod builds).
// Flip SIM_AUTH_BYPASS to false to disable without touching env files.
const SIM_AUTH_BYPASS = true;

// ── Splash Screen ─────────────────────────────────────────────────────────────
function SplashScreen({onDone}) {
  useEffect(()=>{
    const t=setTimeout(onDone,1500);
    return()=>clearTimeout(t);
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"#000",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
      <style>{GLOBAL_CSS}{`
        @keyframes splash-in{0%{opacity:0;transform:scale(0.85)}100%{opacity:1;transform:scale(1)}}
        @keyframes splash-pulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.18);opacity:0.25}}
        @keyframes splash-fade{0%{opacity:1}100%{opacity:0}}
      `}</style>
      <div style={{animation:"splash-in 0.7s cubic-bezier(.2,.7,.3,1) forwards",display:"flex",flexDirection:"column",alignItems:"center",gap:16,position:"relative"}}>
        {/* Pulsing red ring */}
        <div style={{position:"absolute",width:120,height:120,borderRadius:"50%",border:"2px solid var(--red)",animation:"splash-pulse 1.2s ease-in-out infinite",pointerEvents:"none"}}/>
        <Logo size={52} text={false}/>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:26,letterSpacing:"-0.01em",textTransform:"uppercase",color:"#f5f5f0"}}>Coach Macro</div>
        <div style={{fontFamily:"var(--mono)",fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--red)"}}>AI ATHLETIC COACHING</div>
      </div>
    </div>
  );
}

// ── SVGs ──────────────────────────────────────────────────────────────────────
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

// ── Auth Screen ───────────────────────────────────────────────────────────────
// DEBUG overlay — remove before production
function DebugOverlay() {
  const [lines,setLines]=useState([]);
  useEffect(()=>{
    const orig=window.__debugPush;
    window.__debugPush=(msg)=>{
      const line=`[${new Date().toISOString().slice(11,19)}] ${msg}`;
      window.__debugLog=window.__debugLog||[];
      window.__debugLog.push(line);
      console.log('[DEBUG]',line);
      setLines(prev=>[...prev,line].slice(-25));
    };
    setLines((window.__debugLog||[]).slice(-25));
    return()=>{window.__debugPush=orig;};
  },[]);
  if(!lines.length)return null;
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.92)",color:"#0f0",fontFamily:"monospace",fontSize:10,padding:"6px 8px",zIndex:99999,maxHeight:"40vh",overflowY:"auto",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
      {lines.join('\n')}
    </div>
  );
}

function AuthScreen({onAuth, startView="welcome"}) {
  // view: welcome | signin | signup | forgot | forgot-sent | reset
  const [view,setView]=useState(startView);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [oauthLoading,setOauthLoading]=useState("");
  const [error,setError]=useState("");
  const [resetSent,setResetSent]=useState(false);
  const [rawDebugError,setRawDebugError]=useState(""); // DEBUG — remove before production
  const [termsAccepted,setTermsAccepted]=useState(false);
  const [showLegalModal,setShowLegalModal]=useState(null); // null | "terms" | "privacy"

  // DEBUG — remove before production
  useEffect(()=>{
    const dbg=window.__debugPush||((m)=>console.log('[AUTH]',m));
    dbg(`AuthScreen mounted view=${startView}`);
    try{
      const inv=localStorage.getItem("coachMacroInvite");
      dbg(`localStorage ok invite=${inv?"present":"none"}`);
    }catch(e){dbg(`localStorage error: ${e.message}`);}
  },[]);
  useEffect(()=>{
    const dbg=window.__debugPush||((m)=>console.log('[AUTH]',m));
    dbg(`view changed to: ${view}`);
  },[view]);

  async function handleEmailAuth(){
    if(view==="signup"&&!name.trim()){setError("Please enter your name.");return;}
    if(view==="signup"&&!termsAccepted){setError("Please accept the Terms of Service and Privacy Policy.");return;}
    if(!email.trim()){setError("Please enter your email.");return;}
    if(password.length<8){setError("Password must be at least 8 characters.");return;}
    setLoading(true);setError("");
    const dbg = window.__debugPush || ((m)=>console.log('[AUTH]',m));
    // DEBUG LOG — remove before production
    try{
      if(view==="signup"){
        dbg(`S1: signup started email=${email} pwdLen=${password.length}`);
        if(!sb){dbg("CRASH: sb is null");setLoading(false);return;}
        dbg("S2: sb exists");
        dbg(`S3: url=${import.meta.env.VITE_SUPABASE_URL?"set":"MISSING"} key=${import.meta.env.VITE_SUPABASE_ANON_KEY?"set":"MISSING"}`);
        dbg("S4: calling signUp...");
        const{data,error:e}=await sb.auth.signUp({email,password});
        dbg(`S5: err=${e?.message||"none"} code=${e?.code||"none"} user=${data?.user?.id?"ok":"missing"} session=${data?.session?"yes":"no"}`);
        if(e){dbg(`S6 AUTH ERROR: ${e.message} ${e.code||""}`);throw e;}
        if(!data?.user?.id){dbg("S6: no user returned");throw new Error("Sign up succeeded but no account was returned. Please try signing in.");}
        dbg(`S7: user created id=${data.user.id} confirmed=${!!data.user.email_confirmed_at}`);
        track(EVENTS.USER_SIGNUP,{method:"email"},data.user.id);
        dbg("S8: going to verify-email");
        setView("verify-email");
      }else{
        dbg(`S1: signIn email=${email} pwdLen=${password.length}`);
        dbg(`S3: url=${import.meta.env.VITE_SUPABASE_URL?"set":"MISSING"}`);
        dbg("S4: calling signInWithPassword...");
        const{data,error:e}=await sb.auth.signInWithPassword({email,password});
        dbg(`S5: err=${e?.message||"none"} user=${data?.user?.id||"missing"}`);
        if(e){dbg(`S6 SIGN IN ERROR: ${e.message}`);throw e;}
        if(!data?.user?.id)throw new Error("Sign in succeeded but no session was returned. Please try again.");
        track(EVENTS.USER_LOGIN,{method:"email"},data.user.id);
        dbg("S7: login success calling onAuth");
        onAuth(data.user,null);
      }
    }catch(e){
      const info={
        message:e?.message,code:e?.code,status:e?.status,
        name:e?.name,hint:e?.hint,details:e?.details,
        type:typeof e,stack:String(e?.stack||"").slice(0,300),
        json:(()=>{try{return JSON.stringify(e);}catch{return "unstringifiable";}})(),
      };
      dbg(`SX: msg=${info.message} code=${info.code} status=${info.status} name=${info.name} type=${info.type}`);
      console.error("[SIGNUP ERROR]",info);
      setRawDebugError(`MSG: ${info.message||"(none)"}\nCODE: ${info.code||"—"} | STATUS: ${info.status||"—"} | NAME: ${info.name||"—"}\nTYPE: ${info.type}\nJSON: ${info.json?.slice(0,200)}\nSTACK: ${info.stack?.slice(0,200)}`);
      setError(getErrorMessage(e));
    }
    setLoading(false);
  }

  async function handleForgot(){
    if(!email.trim()){setError("Please enter your email.");return;}
    setLoading(true);setError("");
    try{
      const{error:e}=await sb.auth.resetPasswordForEmail(email,{
        redirectTo:"coachmacro://reset-password",
      });
      if(e)throw e;
      setResetSent(true);setView("forgot-sent");
    }catch(e){setError(getErrorMessage(e));}
    setLoading(false);
  }

  async function handleResetPassword(){
    if(newPassword.length<6){setError("Password must be at least 6 characters.");return;}
    setLoading(true);setError("");
    try{
      const{error:e}=await sb.auth.updateUser({password:newPassword});
      if(e)throw e;
      setView("signin");
      setError("");
      // Show success via error state repurposed
      setTimeout(()=>setError("✓ Password updated — please sign in"),100);
    }catch(e){setError(getErrorMessage(e));}
    setLoading(false);
  }

  async function handleOAuth(provider){
    setOauthLoading(provider);setError("");
    try{
      const{error:e}=await sb.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin}});
      if(e)throw e;
    }catch(e){setError(getErrorMessage(e));setOauthLoading("");}
  }

  const inputStyle={width:"100%",background:"rgba(245,245,240,0.04)",border:"1.5px solid var(--white-border)",borderRadius:12,padding:"14px 16px",color:"#f5f5f0",fontSize:15,outline:"none",fontFamily:"var(--body)",boxSizing:"border-box"};
  const labelStyle={display:"block",fontSize:10,color:"var(--white-dim)",fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:7,fontFamily:"var(--mono)"};
  const outer={minHeight:"100vh",background:"#000000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",position:"relative",overflow:"hidden"};
  const invitePending=(()=>{try{return JSON.parse(localStorage.getItem("coachMacroInvite")||"null");}catch{return null;}})();

  const field=(label,val,setVal,type="text",ph="")=>(
    <div style={{marginBottom:14}}>
      <label style={labelStyle}>{label}</label>
      <input value={val} onChange={e=>setVal(e.target.value)} type={type} placeholder={ph}
        onKeyDown={e=>e.key==="Enter"&&(view==="forgot"?handleForgot():view==="reset"?handleResetPassword():handleEmailAuth())}
        style={inputStyle}/>
    </div>
  );

  const socialDivider=(
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}>
      <div style={{flex:1,height:1,background:"var(--white-border)"}}/>
      <span style={{fontSize:10,color:"var(--white-faint)",fontFamily:"var(--mono)",letterSpacing:"0.12em",textTransform:"uppercase",whiteSpace:"nowrap"}}>or continue with</span>
      <div style={{flex:1,height:1,background:"var(--white-border)"}}/>
    </div>
  );

  const appleBtn=(
    <button onClick={()=>handleOAuth("apple")} disabled={!!oauthLoading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",background:oauthLoading==="apple"?"rgba(245,245,240,0.06)":"rgba(245,245,240,0.97)",color:oauthLoading==="apple"?"var(--white-dim)":"#111",fontWeight:700,fontSize:14,letterSpacing:"0.04em",border:"none",borderRadius:13,cursor:"pointer",fontFamily:"var(--body)",marginBottom:10,transition:"opacity .15s"}}>
      <AppleSVG/>{oauthLoading==="apple"?"Redirecting…":"Continue with Apple"}
    </button>
  );

  const googleBtn=(
    <button onClick={()=>handleOAuth("google")} disabled={!!oauthLoading} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"14px",background:"rgba(245,245,240,0.06)",color:"#f5f5f0",fontWeight:700,fontSize:14,letterSpacing:"0.04em",border:"1px solid var(--white-border)",borderRadius:13,cursor:"pointer",fontFamily:"var(--body)",transition:"opacity .15s"}}>
      <GoogleSVG/>{oauthLoading==="google"?"Redirecting…":"Continue with Google"}
    </button>
  );

  const [devLoading,setDevLoading]=useState(false);
  const [devError,setDevError]=useState("");
  if(import.meta.env.VITE_AUTO_DEVMODE==="true") localStorage.setItem("devmode","true");
  const showDevSkip=import.meta.env.DEV||localStorage.getItem("devmode")==="true";
  const logoTapCount=useRef(0);
  const logoTapTimer=useRef(null);
  function handleLogoTap(){
    logoTapCount.current+=1;
    clearTimeout(logoTapTimer.current);
    if(logoTapCount.current>=5){
      localStorage.setItem("devmode","true");
      window.location.reload();
      return;
    }
    logoTapTimer.current=setTimeout(()=>{logoTapCount.current=0;},600);
  }

  // Signs in as testuser AND upserts a complete profile → lands in the main app.
  async function handleDevSkip(){
    setDevLoading(true);setDevError("");
    try{
      let userData=null;
      const{data:signInData,error:signInErr}=await sb.auth.signInWithPassword({
        email:"testuser@coachm.dev",password:"CoachTest123!",
      });
      if(!signInErr&&signInData?.user?.id){
        userData=signInData.user;
      }else{
        const{data:signUpData,error:signUpErr}=await sb.auth.signUp({
          email:"testuser@coachm.dev",password:"CoachTest123!",
        });
        if(signUpErr)throw signUpErr;
        if(signUpData?.session){userData=signUpData.user;}
        else{
          const{data:d2,error:e2}=await sb.auth.signInWithPassword({
            email:"testuser@coachm.dev",password:"CoachTest123!",
          });
          if(e2)throw e2;
          userData=d2?.user;
        }
      }
      if(!userData?.id)throw new Error("Could not get dev user");
      await sb.from("profiles").upsert({
        id:userData.id,
        profile_data:{name:"Dev User",email:"testuser@coachm.dev",goal:"muscle_gain",liftExp:"intermediate",cardioExp:"intermediate",subscription_tier:"annual",startDate:new Date().toISOString().split("T")[0]},
        subscription_tier:"annual",subscription_started_at:new Date().toISOString(),is_pro:true,
      },{onConflict:"id"});
      onAuth(userData,null);
    }catch(e){setDevError(e?.message||"Dev skip failed");}
    setDevLoading(false);
  }

  // Dev-only: bypasses ALL network calls. Injects a fake user object directly
  // and calls onAuth, which calls loadProfile. loadProfile will find no profile
  // row (deleted from Supabase already) and set phase="onboarding" → ob_new.jsx.
  // If the DB call itself fails due to network/RLS, the catch block in loadProfile
  // also sets phase="onboarding" — either path lands in onboarding.
  function handleOnboardingTest(){
    const fakeUser={
      id:"85e58fe7-f2f3-4597-a4a9-9b0ea90121dc",
      email:"testuser@coachm.dev",
    };
    onAuth(fakeUser,null);
  }

  const [resendCooldown,setResendCooldown]=useState(0);
  async function handleResendVerification(){
    if(resendCooldown>0||!email)return;
    setLoading(true);setError("");
    try{
      const{error:e}=await sb.auth.resend({type:"signup",email});
      if(e)throw e;
      setResendCooldown(60);
      const iv=setInterval(()=>setResendCooldown(c=>{if(c<=1){clearInterval(iv);return 0;}return c-1;}),1000);
    }catch(e){setError(getErrorMessage(e));}
    setLoading(false);
  }

  if(view==="verify-email") return(
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16}}>✉️</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:40,lineHeight:.9,marginBottom:16,textTransform:"uppercase"}}>Check Your<br/><span style={{color:"var(--red)"}}>Email.</span></div>
        <p style={{fontSize:14,color:"var(--white-dim)",marginBottom:8,lineHeight:1.65}}>
          We sent a verification link to<br/><strong style={{color:"#fff"}}>{email}</strong>
        </p>
        <p style={{fontSize:13,color:"var(--white-dim)",marginBottom:28,lineHeight:1.55}}>
          Tap the link in the email to activate your account, then come back to sign in.
        </p>
        {error&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#f87171",marginBottom:16}}>{error}</div>}
        <button onClick={()=>setView("signin")} style={{width:"100%",padding:"15px",background:"var(--red)",color:"#fff",fontWeight:700,fontSize:15,border:"none",borderRadius:13,cursor:"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:12}}>
          Go to Sign In →
        </button>
        <button onClick={handleResendVerification} disabled={loading||resendCooldown>0} style={{width:"100%",padding:"12px",background:"rgba(245,245,240,0.06)",color:resendCooldown>0?"rgba(245,245,240,0.65)":"#f5f5f0",fontWeight:600,fontSize:14,border:"1px solid var(--white-border)",borderRadius:13,cursor:resendCooldown>0?"default":"pointer",fontFamily:"var(--body)",marginBottom:12}}>
          {resendCooldown>0?`Resend in ${resendCooldown}s`:"Resend verification email"}
        </button>
        <button onClick={()=>{setView("signup");setEmail("");setPassword("");}} style={{background:"none",border:"none",color:"var(--white-dim)",fontSize:12,cursor:"pointer",fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>
          Use a different email
        </button>
      </div>
    </div>
  );

  if(view==="forgot-sent") return(
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:16}}>📬</div>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:40,lineHeight:.9,marginBottom:16,textTransform:"uppercase"}}>Check Your<br/><span style={{color:"var(--red)"}}>Email.</span></div>
        <p style={{fontSize:14,color:"var(--white-dim)",marginBottom:28,lineHeight:1.65}}>
          We sent a reset link to <strong style={{color:"#fff"}}>{email}</strong>. Open the link on your phone to set a new password.
        </p>
        <button onClick={()=>setView("signin")} style={{width:"100%",padding:"14px",background:"var(--red)",color:"#fff",fontWeight:700,fontSize:14,border:"none",borderRadius:12,cursor:"pointer",fontFamily:"var(--condensed)",letterSpacing:"0.08em",textTransform:"uppercase"}}>Back to Sign In</button>
      </div>
    </div>
  );

  if(view==="reset") return(
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:40,lineHeight:.9,marginBottom:24,textTransform:"uppercase"}}>New<br/><span style={{color:"var(--red)"}}>Password.</span></div>
        {field("New Password",newPassword,setNewPassword,"password","Min 6 characters")}
        {error&&<ErrorMessage error={error} style={{marginBottom:16}}/>}
        <button onClick={handleResetPassword} disabled={loading} style={{width:"100%",padding:"16px",background:loading?"rgba(245,245,240,0.1)":"var(--red)",color:loading?"var(--white-dim)":"#fff",fontWeight:800,fontSize:15,letterSpacing:"0.1em",border:"none",borderRadius:14,cursor:loading?"default":"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)"}}>
          {loading?"Saving...":"Set New Password →"}
        </button>
      </div>
    </div>
  );

  if(view==="forgot") return(
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <div style={{width:"100%",maxWidth:420}}>
        <button onClick={()=>setView("signin")} style={{background:"none",border:"none",color:"var(--white-dim)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:32,display:"flex",alignItems:"center",gap:6,padding:0}}>
          <svg width={14} height={14} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          Back
        </button>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:40,lineHeight:.9,marginBottom:8,textTransform:"uppercase"}}>Reset<br/><span style={{color:"var(--red)"}}>Password.</span></div>
        <p style={{fontSize:13,color:"var(--white-dim)",marginBottom:24,lineHeight:1.6}}>Enter your email and we'll send a reset link.</p>
        {field("Email",email,setEmail,"email","you@email.com")}
        {error&&<ErrorMessage error={error} style={{marginBottom:16}}/>}
        <button onClick={handleForgot} disabled={loading} style={{width:"100%",padding:"16px",background:loading?"rgba(245,245,240,0.1)":"var(--red)",color:loading?"var(--white-dim)":"#fff",fontWeight:800,fontSize:15,letterSpacing:"0.1em",border:"none",borderRadius:14,cursor:loading?"default":"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)"}}>
          {loading?"Sending...":"Send Reset Email →"}
        </button>
      </div>
    </div>
  );

  if(view==="welcome") return(
    <div style={{minHeight:"100vh",background:"#000000",display:"flex",flexDirection:"column",alignItems:"center",padding:"0 24px 52px",position:"relative",overflow:"hidden"}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:"18vh",width:"100%",maxWidth:420}}>
        <div onClick={handleLogoTap} style={{cursor:"default"}}>
          <div style={{marginBottom:28,display:"flex",justifyContent:"center"}}><Logo size={36} text={false}/></div>
          <div style={{fontFamily:"var(--condensed)",fontWeight:900,fontSize:84,lineHeight:.84,color:"#f5f5f0",textAlign:"center",textTransform:"uppercase",letterSpacing:"-0.01em"}}>
            YOUR COACH.
          </div>
        </div>
        <p style={{fontSize:13,color:"#FFFFFF",marginTop:22,lineHeight:1.6,textAlign:"center",maxWidth:260}}>
          AI-powered macros and training built around your body, your goals, and your life.
        </p>
      </div>
      <div style={{width:"100%",maxWidth:420}}>
        <button onClick={()=>setView("signup")} style={{width:"100%",padding:"17px",background:"var(--red)",color:"white",fontWeight:800,fontSize:15,letterSpacing:"0.1em",border:"none",borderRadius:14,cursor:"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)",marginBottom:10}}>Get Started →</button>
        <button onClick={()=>setView("signin")} style={{width:"100%",padding:"15px",background:"transparent",color:"#FFFFFF",fontWeight:600,fontSize:14,letterSpacing:"0.08em",border:"none",borderRadius:14,cursor:"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)",marginBottom:4}}>Sign In</button>
        {error&&<ErrorMessage error={error} style={{marginTop:8}}/>}
        {showDevSkip&&(
          <div style={{marginTop:20,borderTop:"1px dashed rgba(245,245,240,0.08)",paddingTop:14,textAlign:"center"}}>
            {devError&&<div style={{fontSize:10,color:"#f87171",fontFamily:"var(--mono)",marginBottom:6}}>{devError}</div>}
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={handleDevSkip} disabled={devLoading} style={{background:"none",border:"none",color:"rgba(245,245,240,0.22)",cursor:devLoading?"default":"pointer",fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.1em",padding:"4px 8px"}}>
                {devLoading?"…":"DEV SKIP →"}
              </button>
              <button onClick={handleOnboardingTest} style={{background:"none",border:"1px dashed rgba(245,245,240,0.15)",borderRadius:6,color:"rgba(245,245,240,0.35)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:10,letterSpacing:"0.1em",padding:"4px 8px"}}>
                ONBOARDING →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return(
    <>
    <div style={outer}>
      <style>{GLOBAL_CSS}</style>
      <DebugOverlay/>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <button onClick={()=>{setView("welcome");setError("");}} style={{background:"none",border:"none",color:"var(--white-dim)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:32,display:"flex",alignItems:"center",gap:6,padding:0}}>
          <svg width={14} height={14} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          Back
        </button>
        <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,lineHeight:.88,marginBottom:24,color:"#f5f5f0",textTransform:"uppercase"}}>
          {view==="signup"?<span>Your Plan<br/><span style={{color:"var(--red)"}}>Awaits.</span></span>:<span>Good to<br/><span style={{color:"var(--red)"}}>See You.</span></span>}
        </div>
        {appleBtn}{googleBtn}{socialDivider}
        {view==="signup"&&field("Your Name",name,setName,"text","e.g. Marcus")}
        {field("Email",email,setEmail,"email","you@email.com")}
        {field("Password",password,setPassword,"password","Min 6 characters")}
        {view==="signin"&&(
          <div style={{textAlign:"right",marginBottom:14,marginTop:-8}}>
            <button onClick={()=>{setView("forgot");setError("");}} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.08em",padding:0}}>Forgot password?</button>
          </div>
        )}
        {view==="signup"&&(
          <div onClick={()=>setTermsAccepted(v=>!v)} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16,cursor:"pointer",userSelect:"none"}}>
            <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${termsAccepted?"var(--red)":"rgba(245,245,240,0.25)"}`,background:termsAccepted?"var(--red)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.15s"}}>
              {termsAccepted&&<svg width={13} height={13} viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div style={{fontSize:12,color:"rgba(245,245,240,0.55)",lineHeight:1.55,fontFamily:"var(--body)",paddingTop:2}}>
              I agree to the{" "}
              <span onClick={e=>{e.stopPropagation();setShowLegalModal("terms");}} style={{color:"var(--red)",textDecoration:"underline",cursor:"pointer"}}>Terms of Service</span>
              {" "}and{" "}
              <span onClick={e=>{e.stopPropagation();setShowLegalModal("privacy");}} style={{color:"var(--red)",textDecoration:"underline",cursor:"pointer"}}>Privacy Policy</span>
            </div>
          </div>
        )}
        {error&&<ErrorMessage error={error} style={{marginBottom:16}}/>}
        <button onClick={handleEmailAuth} disabled={loading||!!oauthLoading||(view==="signup"&&!termsAccepted)} style={{width:"100%",padding:"16px",background:(loading||(view==="signup"&&!termsAccepted))?"rgba(245,245,240,0.1)":"var(--red)",color:(loading||(view==="signup"&&!termsAccepted))?"var(--white-dim)":"white",fontWeight:800,fontSize:15,letterSpacing:"0.1em",border:"none",borderRadius:14,cursor:(loading||(view==="signup"&&!termsAccepted))?"default":"pointer",textTransform:"uppercase",fontFamily:"var(--condensed)",marginBottom:16,transition:"all 0.15s"}}>
          {loading?"...":(view==="signup"?"Create Account →":"Sign In →")}
        </button>
        <div style={{textAlign:"center",fontSize:11,color:"var(--white-faint)",fontFamily:"var(--mono)",letterSpacing:"0.08em"}}>
          {view==="signup"
            ?<span>Already have an account? <button onClick={()=>{setView("signin");setError("");}} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.08em",padding:0}}>Sign In</button></span>
            :<span>New here? <button onClick={()=>{setView("signup");setError("");}} style={{background:"none",border:"none",color:"var(--red)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.08em",padding:0}}>Create Account</button></span>
          }
        </div>
        {showDevSkip&&view==="signin"&&(
          <div style={{marginTop:32,borderTop:"1px dashed rgba(245,245,240,0.08)",paddingTop:16,textAlign:"center"}}>
            {devError&&<div style={{fontSize:10,color:"#f87171",fontFamily:"var(--mono)",marginBottom:8}}>{devError}</div>}
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              <button onClick={handleDevSkip} disabled={devLoading} style={{background:"none",border:"none",color:"rgba(245,245,240,0.25)",cursor:devLoading?"default":"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.10em",padding:"4px 8px"}}>
                {devLoading?"…":"DEV SKIP →"}
              </button>
              <button onClick={handleOnboardingTest} style={{background:"none",border:"1px dashed rgba(245,245,240,0.15)",borderRadius:6,color:"rgba(245,245,240,0.35)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:11,letterSpacing:"0.10em",padding:"4px 8px"}}>
                ONBOARDING →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    {showLegalModal&&(
      <div style={{position:"fixed",inset:0,zIndex:99999,background:"#000",overflowY:"auto"}}>
        <button onClick={()=>setShowLegalModal(null)} style={{position:"sticky",top:0,zIndex:1,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,0.9)",border:"none",borderBottom:"1px solid rgba(245,245,240,0.1)",color:"var(--red)",cursor:"pointer",fontFamily:"var(--mono)",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",padding:"14px 20px",width:"100%"}}>
          <svg width={16} height={16} viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          Back
        </button>
        {showLegalModal==="terms"?<TermsOfService/>:<PrivacyPolicy/>}
      </div>
    )}
    </>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function NativeApp() {
  // Apply default theme immediately so UI never flashes wrong colors before profile loads
  useEffect(() => { applyDefaultTheme(); }, []);
  const [phase,setPhase]=useState("splash");
  const ujInitialized = useRef(false);
  // Dedupes handleAuth: cold start can call it twice (manual localStorage read
  // + onAuthStateChange INITIAL_SESSION) for the same user. Keyed by uid so a
  // later account switch / re-login still proceeds; reset on sign-out.
  const authedUserIdRef = useRef(null);
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [schedule,setSchedule]=useState({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"});
  const [wPrefs,setWPrefs]=useState({splitType:"Push/Pull/Legs",equipment:"Full Gym",isHybrid:false,isHyrox:false});
  const [dayFocus,setDayFocus]=useState(autoFocus({Mon:"training",Tue:"rest",Wed:"training",Thu:"cardio",Fri:"training",Sat:"rest",Sun:"rest"},"Push/Pull/Legs"));
  const [earnedCals,setEarnedCals]=useState(0);
  const [signupName,setSignupName]=useState("");
  const [saveErr,setSaveErr]=useState("");
  const [authView,setAuthView]=useState("welcome");

  // Init UserJot only after the user is authenticated — prevents update toasts on the login screen
  useEffect(() => {
    if (phase === 'app' && !ujInitialized.current && window.uj) {
      ujInitialized.current = true;
      window.uj.init('cmpdox60502qt0iqwx692w8tw', { widget: true, theme: 'dark', trigger: 'custom' });
    }
  }, [phase]);

  async function loadProfile(uid){
    try{
      const{data,error}=await sb.from("profiles").select("*").eq("id",uid).maybeSingle();
      if(error||!data){setPhase("onboarding");return;}
      if(data.profile_data){
        const trialEnd=data.trial_ends_at||data.profile_data.trialEndsAt;
        // Derive subscription_tier from DB column; fall back to date-based check
        let tier=data.subscription_tier||'trial';
        // Dev account bypass — never expire or paywall the test account
        const isDevAccount=data.profile_data?.email==="testuser@coachm.dev";
        if(!isDevAccount&&tier==='trial'&&trialEnd&&new Date(trialEnd)<=new Date())tier='expired';
        setProfile({
          ...data.profile_data,
          // Dedicated columns override JSONB where they exist
          plan_built: data.plan_built ?? false,
          ...(data.first_name   && {name:data.first_name, first_name:data.first_name}),
          ...(data.goal         && {goal:data.goal}),
          ...(data.skill_level  && {liftExp:data.skill_level, skill_level:data.skill_level}),
          ...(data.weight_kg    && {weight_kg:data.weight_kg}),
          ...(data.goal_weight_kg && {goal_weight_kg:data.goal_weight_kg}),
          ...(data.height_cm    && {height_cm:data.height_cm}),
          ...(data.units        && {units:data.units, wUnit:data.units==='metric'?'kg':'lbs', hUnit:data.units==='metric'?'cm':'ft'}),
          ...(data.equipment    && {equipment:data.equipment}),
          ...(data.calorie_target && {calorie_target:data.calorie_target}),
          ...(data.protein_g    && {protein_g:data.protein_g}),
          ...(data.current_program    && {current_program:data.current_program}),
          ...(data.program_start_date && {program_start_date:data.program_start_date}),
          ...(data.program_current_week && {program_current_week:data.program_current_week}),
          ...(data.program_total_weeks  && {program_total_weeks:data.program_total_weeks}),
          ...(data.recovery_capacity  && {recovery_capacity:data.recovery_capacity}),
          ...(data.run_race_type      && {run_race_type:data.run_race_type}),
          ...(data.run_race_date      && {run_race_date:data.run_race_date}),
          ...(data.run_target_time    && {run_target_time:data.run_target_time}),
          daily_scores:data.daily_scores||[],
          referralCount:data.referral_count||0,
          subscription_tier:tier,
          trial_ends_at:trialEnd||null,
          trial_started_at:data.trial_started_at||data.profile_data.trialStartAt||null,
          subscription_started_at:data.subscription_started_at||null,
        });
        // Sync entitlements on load (non-blocking)
        checkEntitlements(uid).catch(()=>{});
        if(trialEnd)scheduleTrialExpiryNotification(trialEnd);
        if(window.uj){window.uj.identify({id:uid,email:data.profile_data?.email||"",firstName:data.first_name||data.profile_data?.name||""});}
        const expired=tier==='expired';
        if(data.schedule)setSchedule(data.schedule);
        if(data.wprefs)setWPrefs(data.wprefs);
        loadAndApplyTheme(data.wprefs);
        setAnalyticsEnabled(data.analytics_enabled!==false);
        initPushNotifications(uid);
        setPhase(expired?"expired":"app");
      }else{
        setPhase("onboarding");
      }
    }catch(e){console.error("[loadProfile]",e);setPhase("onboarding");}
  }

  async function saveProfile(uid,prof,sch,wp){
    try{
      const _heightCm = prof.hUnit==='cm'
        ? parseFloat(prof.hCm)||null
        : ((parseFloat(prof.hFt||0)*30.48)+(parseFloat(prof.hIn||0)*2.54))||null;
      const _weightKg = prof.wUnit==='lbs'
        ? (parseFloat(prof.weight)*0.453592)||null
        : parseFloat(prof.weight)||null;
      const _goalWtKg = prof.goalWeight
        ? (prof.wUnit==='lbs'
            ? parseFloat(prof.goalWeight)*0.453592
            : parseFloat(prof.goalWeight))||null
        : null;
      const hyroxPhase=(()=>{
        if(!wp.hyroxRaceDate)return null;
        const w=Math.ceil((new Date(wp.hyroxRaceDate)-new Date())/(7*86400000));
        return w<=3?"taper":w<=8?"peak":w<=12?"race_prep":w<=16?"strength":"base";
      })();
      const runRaceType=(wp.runRaceDate&&wp.runningGoal)?RUNNING_GOAL_TO_RACE_TYPE[wp.runningGoal]||null:null;
      const runCurrentPhase=(()=>{
        if(!wp.runRaceDate)return null;
        const w=Math.floor((new Date(wp.runRaceDate)-new Date())/(7*86400000));
        return w>16?"base":w>12?"build":w>8?"race_specific":w>3?"peak":w>0?"taper":"race_week";
      })();
      const strengthCurrentPhase=(()=>{
        if(!wp.strengthCompDate)return null;
        const w=Math.floor((new Date(wp.strengthCompDate)-new Date())/(7*86400000));
        return w>16?"hypertrophy":w>12?"strength":w>8?"peaking":w>2?"competition_prep":"taper";
      })();
      const{error}=await sb.from("profiles").upsert({
        id:uid,profile_data:prof,schedule:sch,wprefs:wp,
        referral_code:prof.referralCode||null,
        trial_started_at:prof.trialStartAt||null,
        trial_ends_at:prof.trialEndsAt||null,
        subscription_tier:'trial',
        first_name:prof.name||null,
        goal:(prof.goal||'').toLowerCase().replace(/\s+/g,'_')||null,
        skill_level:(prof.liftExp||'').toLowerCase()||null,
        weight_kg:_weightKg,
        goal_weight_kg:_goalWtKg,
        height_cm:_heightCm,
        units:prof.wUnit==='kg'?'metric':'imperial',
        equipment:wp.equipment||null,
        current_program:wp.splitType||null,
        program_start_date:new Date().toISOString().split('T')[0],
        updated_at:new Date().toISOString(),
        hyrox_race_date:wp.hyroxRaceDate||null,
        hyrox_category:wp.hyroxCategory||null,
        hyrox_experience:wp.hyroxExp||null,
        hyrox_weak_stations:wp.hyroxWeakStations?.length?wp.hyroxWeakStations:null,
        hyrox_equipment:wp.hyroxEquipment?[wp.hyroxEquipment]:null,
        hyrox_current_phase:hyroxPhase,
        hyrox_target_time:minSecToInterval(wp.hyroxTargetTimeMin,wp.hyroxTargetTimeSec),
        hyrox_previous_time:minSecToInterval(wp.hyroxPrevTimeMin,wp.hyroxPrevTimeSec),
        // running race
        run_race_date:wp.runRaceDate||null,
        run_race_type:runRaceType,
        run_previous_time:minSecToInterval(wp.runPrevTimeMin,wp.runPrevTimeSec),
        run_current_phase:runCurrentPhase,
        // strength competition
        strength_comp_date:wp.strengthCompDate||null,
        strength_comp_type:wp.strengthCompType||null,
        strength_comp_federation:wp.strengthFederation||null,
        strength_target_total:wp.strengthTargetTotal||null,
        strength_current_phase:strengthCurrentPhase,
        strength_weight_class:wp.strengthWeightClass||null,
        recovery_capacity:wp.recoveryCapacity||'normal',
      },{onConflict:"id"}).select();
      if(error)throw error;
      return true;
    }catch(e){console.error("[saveProfile]",e);return false;}
  }

  async function handleAuth(authUser,name=""){
    // Already authed this user (e.g. second cold-start trigger) — skip the
    // duplicate profile load + one-time side effects (push reg, trial notif).
    if(authedUserIdRef.current===authUser.id)return;
    authedUserIdRef.current=authUser.id;
    setPhase("loading");setUser(authUser);
    if(name)setSignupName(name);
    if (Capacitor.isNativePlatform()) {
      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({
          apiKey: 'appl_aaBsADfHAbKGkrQPVgOETrpJMdV',
          appUserID: authUser.id,
        });
      } catch (e) {
        console.warn('RevenueCat configure failed:', e);
      }
    }
    await loadProfile(authUser.id);
  }

  async function handleProfileDone(od,tdee){
    const a=getAge(od.dobYear,od.dobMonth,od.dobDay);
    const baseProf={
      name:od.name,email:od.email||user?.email||"",
      sex:od.sex,dobMonth:od.dobMonth,dobDay:od.dobDay,dobYear:od.dobYear,
      hUnit:od.hUnit,hFt:od.hFt,hIn:od.hIn,hCm:od.hCm,
      wUnit:od.wUnit||"lbs",weight:od.weight,startWeight:parseFloat(od.weight)||0,
      startDate:new Date().toISOString().split("T")[0],
      bodyFat:od.bodyFat,job:od.job,steps:od.steps,activity:od.activity,
      sleep:od.sleep,sleepQ:od.sleepQ,conditions:od.conditions||[],cycle:od.cycle,
      metHistory:od.metHistory,protein:od.protein,healthConn:od.healthConn,
      baseTDEE:tdee.total,bmr:tdee.bmr,city:"",
      lifeStage:od.lifeStage||"",trimester:od.trimester||"",postpartumWeeks:od.postpartumWeeks||0,
      csection:od.csection||false,menopauseSymptoms:od.menopauseSymptoms||[],
      cycleCondition:od.cycleCondition||[],fitnessMotivation:od.fitnessMotivation||"",
      eatingHistory:od.eatingHistory||"",boneHistory:od.boneHistory||"",
      healthConditions:od.healthConditions||[],
      is_youth:a!==null&&a>=13&&a<18,
      is_older_adult:a!==null&&a>=65,
      runProfile:null,
      hyroxProfile:null,
    };
    if(NEW_ONBOARDING){
      // Augment with fuel + training fields collected by the new single-flow onboarding.
      // In the old flow these were added by handleFuelDone + handleTrainDone.
      const _rateMap={"−500":-500,"−250":-250,"−125":-125,"+125":125,"+250":250,"+500":500};
      const _rateOffset=_rateMap[od.goalRate]||0;
      const _goalCap=od.goal?(od.goal.charAt(0).toUpperCase()+od.goal.slice(1).toLowerCase()):"Maintain";
      const _goalCals=(od.goal==="maintain"||od.goal==="recomp")?tdee.total:Math.max(1200,tdee.total+_rateOffset);
      Object.assign(baseProf,{
        goal:_goalCap,
        goalRate:od.goalRate||"",
        goalCals:_goalCals,
        freq:od.freq||"",
        trainType:od.trainType||"",
        liftExp:od.liftExp||od.experience||"",
        cardioExp:od.cardioExp||od.experience||"",
        why:od.why||"",
        trialEndsAt:new Date(Date.now()+14*86400000).toISOString(),
        trialStartAt:new Date().toISOString(),
      });
    }
    setProfile(baseProf);
    // New flow: stay on "onboarding" — NewOnboarding continues to crescendo+paywall.
    // Old flow: advance to fuel onboarding.
    setPhase(NEW_ONBOARDING ? "onboarding" : "onboarding-fuel");
    if(NEW_ONBOARDING&&user?.id){
      console.log("[handleProfileDone] saving profile to Supabase…");
      try{
        const saved=await saveProfile(user.id,baseProf,schedule,wPrefs);
        if(saved)console.log("[handleProfileDone] profile saved ✓");
        else console.error("[handleProfileDone] saveProfile returned false — check Supabase");
      }catch(e){
        console.error("[handleProfileDone] saveProfile threw:",e);
      }
      // Seed starting weight into bodyweight_logs so Day-1 weight chart/TDEE have a baseline.
      // onConflict is idempotent — safe if onboarding runs twice.
      const _startW=parseFloat(baseProf.weight)||0;
      if(_startW>0){
        sb.from("bodyweight_logs").upsert(
          {user_id:user.id,date:baseProf.startDate,weight:_startW},
          {onConflict:"user_id,date"}
        ).catch(()=>{});
      }
    }
  }

  function handleFuelDone(fuelData){
    const updated={...profile,...fuelData};
    if(updated.goal)updated.goal=updated.goal.charAt(0).toUpperCase()+updated.goal.slice(1).toLowerCase();
    setProfile(updated);setPhase("onboarding-train");
  }

  async function handleTrainDone(trainData){
    setSaveErr("");
    const finalProf={...profile,...trainData};
    // Store lift maxes in profile_data for strength predictor
    if(trainData.squatMaxInput)finalProf.squat_max=parseFloat(trainData.squatMaxInput)||null;
    if(trainData.benchMaxInput)finalProf.bench_max=parseFloat(trainData.benchMaxInput)||null;
    if(trainData.deadliftMaxInput)finalProf.deadlift_max=parseFloat(trainData.deadliftMaxInput)||null;
    if(!finalProf.referralCode){
      const first=(finalProf.name||"USER").split(" ")[0].replace(/[^A-Za-z]/g,"").toUpperCase().slice(0,8)||"USER";
      finalProf.referralCode=first+Math.floor(1000+Math.random()*9000);
    }
    let _inviteToken=null;
    try{
      const _inv=JSON.parse(localStorage.getItem("coachMacroInvite")||"null");
      if(_inv&&(Date.now()-(_inv.savedAt||0))<7*86400000){
        finalProf.freeWeeksApplied=true;finalProf.inviteCode=_inv.code||"";
        _inviteToken=_inv.token||null;localStorage.removeItem("coachMacroInvite");
      }
    }catch{}
    if(!finalProf.trialEndsAt){
      finalProf.trialEndsAt=new Date(Date.now()+14*86400000).toISOString();
      finalProf.trialStartAt=new Date().toISOString();
    }
    let sch;
    if(trainData.selectedDays&&Object.values(trainData.selectedDays).some(v=>v!=="rest")){
      sch=trainData.selectedDays;
    }else{
      const dmap={"1-2":["Mon","Thu"],"3":["Mon","Wed","Fri"],"4":["Mon","Tue","Thu","Fri"],"5":["Mon","Tue","Wed","Thu","Fri"],"6":["Mon","Tue","Wed","Thu","Fri","Sat"],"7":["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]};
      const td=dmap[trainData.freq]||["Mon","Wed","Fri"];
      sch={Mon:"rest",Tue:"rest",Wed:"rest",Thu:"rest",Fri:"rest",Sat:"rest",Sun:"rest"};
      td.forEach(d=>{sch[d]="training";});
    }
    const splitMap={"full_body":"Full Body","ppl_half":"Push/Pull/Legs","upper_lower_3":"Upper/Lower","upper_lower":"Upper/Lower","ppl_upper":"Push/Pull/Legs","bro_4":"Bro Split","bro_split":"Bro Split","upper_lower_5":"Upper/Lower","ppl_upper_lower":"Push/Pull/Legs","ppl_6":"Push/Pull/Legs","arnold":"Arnold Split","upper_lower_6":"Upper/Lower","ppl_7":"Push/Pull/Legs","bro_7":"Bro Split","c25k":"Full Body","5k_sub25":"Full Body","10k":"Full Body","half":"Full Body","marathon":"Full Body","hyrox_12w":"Full Body","hyrox_strength":"Full Body","hyrox_run":"Full Body","strength_run":"Push/Pull/Legs","ppl_hyrox":"Push/Pull/Legs","upper_lower_run":"Upper/Lower","hyrox_hybrid":"Full Body"};
    const wp={
      splitType:splitMap[trainData.split]||"Push/Pull/Legs",
      equipment:trainData.equipment||"Full Gym",isHybrid:trainData.trainType==="hybrid",
      isHyrox:trainData.trainType==="hyrox",sessionLength:trainData.sessionLength||60,
      weakPoints:trainData.weakPoints||[],injuries:trainData.injuries||[],
      current5KTime:trainData.current5KTime||null,runningGoal:trainData.runningGoal||"",
      raceDate:trainData.raceDate||"",terrain:trainData.terrain||"road",
      trackAccess:trainData.trackAccess||false,longRunDay:trainData.longRunDay||"Sunday",
      cardioExp:trainData.cardioExp||"",
      runPlan:({"first_5k":"Couch to 5K","fitness":"Couch to 5K","sub25_5k":"Sub-25 5K","first_10k":"10K Training","sub50_10k":"10K Training","half":"Half Marathon","marathon":"Half Marathon"})[trainData.runningGoal||""]||"Couch to 5K",
      recoveryCapacity:trainData.recoveryCapacity||"normal",musclePriorities:trainData.musclePriorities||[],
      trainingAge:trainData.trainingAge||"developing",blackoutDays:trainData.blackoutDays||[],
      mobilityLimitations:trainData.mobilityLimitations||[],stressLevel:trainData.stressLevel||"low",
      sleepQuality:trainData.sleepQuality||({fair:"average",poor:"poor",good:"good",excellent:"excellent"}[profile?.sleepQ]||"average"),
      jobPhysicality:trainData.jobPhysicality||({desk:"desk",mix:"light",feet:"moderate",physical:"heavy"}[profile?.job]||"desk"),
      cycleTracking:trainData.cycleTracking??null,hybridBias:trainData.hybridBias||"",
      hyroxExp:trainData.hyroxExp||"",hyroxCategory:trainData.hyroxCategory||"",
      hyroxRaceDate:trainData.hyroxRaceDate||"",hyroxWeakStations:trainData.hyroxWeakStations||[],
      hyroxEquipment:trainData.hyroxEquipment||"",hyroxFitnessLevel:trainData.hyroxFitnessLevel||"",
      hyroxTargetTimeMin:trainData.hyroxTargetTimeMin||"",hyroxTargetTimeSec:trainData.hyroxTargetTimeSec||"",
      hyroxPrevTimeMin:trainData.hyroxPrevTimeMin||"",hyroxPrevTimeSec:trainData.hyroxPrevTimeSec||"",
      // running race fields
      runRaceDate:trainData.raceDate||"",
      runPrevTimeMin:trainData.runPrevTimeMin||"",runPrevTimeSec:trainData.runPrevTimeSec||"",
      // strength comp fields
      strengthCompeting:trainData.strengthCompeting||"",
      strengthCompType:trainData.strengthCompType||"",
      strengthFederation:trainData.strengthFederation||"",
      strengthCompDate:trainData.strengthCompDate||"",
      squatMax:parseFloat(trainData.squatMaxInput)||null,
      benchMax:parseFloat(trainData.benchMaxInput)||null,
      deadliftMax:parseFloat(trainData.deadliftMaxInput)||null,
      strengthWeightClass:trainData.strengthWeightClass||"",
      strengthTargetTotal:parseFloat(trainData.strengthTargetTotal)||null,
    };
    setSchedule(sch);setWPrefs(wp);setProfile(finalProf);setPhase("loading");
    if(!user){setSaveErr("Not logged in. Please sign in again.");return;}
    const saved=await saveProfile(user.id,finalProf,sch,wp);
    if(!saved){
      await new Promise(r=>setTimeout(r,1500));
      const saved2=await saveProfile(user.id,finalProf,sch,wp);
      if(!saved2){setSaveErr("Could not save your profile. Check your connection and try again.");return;}
    }
    track(EVENTS.ONBOARDING_COMPLETE,{goal:finalProf.goal,trainType:finalProf.trainType||trainData.trainType,experience:finalProf.liftExp||trainData.liftExp,daysPerWeek:trainData.freq},user?.id);
    track(EVENTS.TRIAL_START,{trial_ends_at:finalProf.trialEndsAt},user?.id);
    setPhase("celebrate");
  }

  async function handleSignOut(){
    track(EVENTS.USER_LOGOUT,{},user?.id);
    await sb.auth.signOut();
    if(window.uj)window.uj.identify(null);
    authedUserIdRef.current=null;
    setUser(null);setProfile(null);setPhase("welcome-screen");
  }

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get("invited")==="true"){
      try{const inv={code:params.get("code")||"",token:params.get("token")||"",freeWeeks:2,savedAt:Date.now()};localStorage.setItem("coachMacroInvite",JSON.stringify(inv));}catch{}
      window.history.replaceState({},"","/");
    }
    // Read session from localStorage — zero network calls at startup.
    // Any Supabase auth method (getSession, setSession, signOut) hits the wire
    // and hangs forever in WKWebView/simulator due to a QUIC OS-level bug.
    // We read raw localStorage, check expiry locally, and either resume the
    // session or go to welcome screen. The stored token is used automatically
    // by the Supabase client for all subsequent API calls (it reads localStorage
    // on every request), so no explicit setSession() is needed.
    // Pre-step: dev-only auto-login — fires only when MODE=development + bypass enabled
    // + no active session. signInWithPassword triggers onAuthStateChange(SIGNED_IN)
    // below, which calls handleAuth → normal profile-load → phase="app".
    // import.meta.env.MODE is replaced with the literal string at build time:
    //   prod build  → "production" === "production" → true  → return false (dead code)
    //   build:sim   → "development" === "production" → false → bypass runs
    function _tryDevBypass() {
      if (import.meta.env.MODE === "production" || !SIM_AUTH_BYPASS) return false;
      const e = import.meta.env.VITE_DEV_EMAIL;
      const p = import.meta.env.VITE_DEV_PASSWORD;
      if (!e || !p) return false;
      sb.auth.signInWithPassword({email:e, password:p})
        .catch(()=>setTimeout(()=>setPhase("welcome-screen"), 400));
      return true;
    }

    // supabase-js v2 persists the session under 'sb-<project-ref>-auth-token'
    // with the session fields (access_token, refresh_token, expires_at, user)
    // at the TOP LEVEL — not nested under a v1-style { currentSession } wrapper.
    const SB_STORAGE_KEY = 'sb-oxxihlwqukbakmnnavuy-auth-token';
    try {
      const raw    = localStorage.getItem(SB_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const user   = parsed?.user ?? null;
      const expiry = parsed?.expires_at ?? 0;
      const expired = expiry > 0 && expiry <= Math.floor(Date.now() / 1000) + 30;
      const valid   = user && !expired;
      if (valid) {
        handleAuth(user, null);
      } else {
        // Only clear when the token is genuinely expired. On a parse miss /
        // absent token, leave storage untouched (non-destructive) so the
        // supabase client + onAuthStateChange can still restore the session.
        if (expired) { try { localStorage.removeItem(SB_STORAGE_KEY); } catch {} }
        if (!_tryDevBypass()) setTimeout(()=>setPhase("welcome-screen"), 400);
      }
    } catch {
      if (!_tryDevBypass()) setTimeout(()=>setPhase("welcome-screen"), 400);
    }
    const{data:{subscription}}=sb.auth.onAuthStateChange((event,session)=>{
      // INITIAL_SESSION/TOKEN_REFRESHED let a restored (cold-start) session
      // drive app state, not just a fresh interactive SIGNED_IN.
      if((event==="SIGNED_IN"||event==="INITIAL_SESSION"||event==="TOKEN_REFRESHED")&&session?.user)handleAuth(session.user,null);
      if(event==="PASSWORD_RECOVERY")setPhase("reset-password");
    });
    const onSubRequired=()=>{
      const devEmail=profile?.email==="testuser@coachm.dev"||user?.email==="testuser@coachm.dev";
      if(!devEmail)setPhase("upgrade");
    };
    window.addEventListener("cm:subscription-required",onSubRequired);
    const onDeepLink=(e)=>{
      const{route}=e.detail||{};
      if(route==="workout"){setPhase("app");setTimeout(()=>window.dispatchEvent(new CustomEvent("cm:nav",{detail:"train"})),100);}
      else if(route==="fuel"){setPhase("app");setTimeout(()=>window.dispatchEvent(new CustomEvent("cm:nav",{detail:"fuel"})),100);}
      else if(route==="pro")setPhase("upgrade");
      else if(route==="reset-password")setPhase("reset-password");
    };
    window.addEventListener("cm:deeplink",onDeepLink);
    try{initDeepLinks();}catch{}
    return()=>{
      subscription.unsubscribe();
      window.removeEventListener("cm:subscription-required",onSubRequired);
      window.removeEventListener("cm:deeplink",onDeepLink);
    };
  },[]);

  useEffect(()=>{
    if(!profile)return;
    const lrd=wPrefs.longRunDay||null;
    // Title path now shares the SAME day selector as the prescribed exercises
    // (selectDayKey), so each weekday's WeekStrip label matches what it will prescribe.
    const _psd=profile?.program_start_date||profile?.startDate||null;
    const _dpw=WDAYS.filter(wd=>schedule[wd]==="training").length||4;
    const _todayIdx=(new Date().getDay()+6)%7; // 0=Mon, matches WDAYS order
    const f={};
    WDAYS.forEach((d,j)=>{
      if(schedule[d]==="training"){
        const _dk=selectDayKey(wPrefs.splitType,_dpw,schedule,_psd,j-_todayIdx);
        f[d]=_dk?baseName(_dk):(SPLIT_CYCLES[wPrefs.splitType]?.[0]||"Full Body");
      }else if(["cardio","run","hyrox"].includes(schedule[d])){
        f[d]=(lrd&&d===lrd&&(schedule[d]==='run'||schedule[d]==='cardio'))?"Long Run":(DAY_CFG[schedule[d]]||DAY_CFG.rest).label;
      }else f[d]="Rest";
    });
    setDayFocus(f);
  },[wPrefs.splitType,wPrefs.longRunDay,schedule,profile]);

  if(phase==="splash")return<SplashScreen onDone={()=>setPhase("session-check")}/>;

  if(phase==="session-check")return(
    <div style={{minHeight:"100vh",background:"#000",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_CSS}</style>
      <Logo size={32} text={false}/>
    </div>
  );

  if(phase==="reset-password")return<AuthScreen onAuth={handleAuth} startView="reset"/>;
  if(phase==="welcome-screen")return<AuthScreen onAuth={handleAuth} startView="welcome"/>;

  if(phase==="loading")return(
    <div style={{minHeight:"100vh",background:"#000000",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{GLOBAL_CSS}</style>
      <div style={{textAlign:"center",maxWidth:340}}>
        <div style={{marginBottom:16}}><Logo size={36} text={true}/></div>
        {saveErr
          ?<><div style={{fontSize:13,color:"var(--red)",marginBottom:16,lineHeight:1.6}}>{saveErr}</div>
            <button onClick={()=>{setSaveErr("");window.location.reload();}} style={{padding:"12px 28px",background:"var(--red)",color:"#fff",fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"var(--condensed)",letterSpacing:1,textTransform:"uppercase"}}>Try Again</button></>
          :<div style={{fontSize:11,color:"var(--white-dim)",letterSpacing:"0.16em",fontFamily:"var(--mono)",textTransform:"uppercase"}}>LOADING...</div>
        }
      </div>
    </div>
  );

  if(phase==="onboarding"){
    if(NEW_ONBOARDING)return<NewOnboarding onComplete={(d,tdee)=>handleProfileDone(d,tdee)} user={user} signupName={signupName}/>;
    return<Onboarding onComplete={(d,tdee)=>handleProfileDone(d,tdee)} user={user} signupName={signupName}/>;
  }
  // Old fuel+train onboarding (only reachable when NEW_ONBOARDING=false)
  if(phase==="onboarding-fuel")return<FuelOnboarding d={profile} onComplete={handleFuelDone} onBack={()=>setPhase("onboarding")}/>;
  if(phase==="onboarding-train")return<TrainOnboarding d={profile} onComplete={handleTrainDone} onBack={()=>setPhase("onboarding-fuel")}/>;

  if(phase==="celebrate"){
    const cKey=getTodayKey();
    const cType=schedule[cKey]||"training";
    const cMacros=getDayMacros(profile?.goalCals,profile?.goal,cType,0);
    const cFocus=dayFocus[cKey]||"Full Body";
    return(
      <div style={{minHeight:"100vh",background:"#000000",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
        <style>{GLOBAL_CSS}</style>
        <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
          <div style={{fontSize:64,marginBottom:8}}>🎉</div>
          <div style={{fontFamily:"var(--condensed)",fontStyle:"italic",fontWeight:900,fontSize:48,lineHeight:.9,marginBottom:24,textTransform:"uppercase"}}>LET'S GO,<br/><span style={{color:"var(--red)"}}>{profile?.name?.toUpperCase()||"ATHLETE"}.</span></div>
          <div style={{background:"rgba(var(--accent-rgb),0.06)",border:"1px solid rgba(var(--accent-rgb),0.1)",borderRadius:18,padding:"20px 24px",marginBottom:16,textAlign:"left"}}>
            <div style={{fontSize:10,color:"var(--red)",fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:14,fontFamily:"var(--mono)"}}>Today's Targets</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[["Cals",cMacros.calories,"kcal","var(--red)"],["Prot",cMacros.protein,"g","var(--red)"],["Carbs",cMacros.carbs,"g","#60a5fa"],["Fat",cMacros.fat,"g","#f59e0b"]].map(([l,v,u,c])=>(
                <div key={l} style={{background:"rgba(var(--accent-rgb),0.06)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
                  <div style={{fontFamily:"var(--condensed)",fontSize:22,fontWeight:900,fontStyle:"italic",color:c,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:"var(--white-dim)",marginTop:2,fontFamily:"var(--mono)"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>setPhase("promo")} style={{width:"100%",padding:"16px",background:"var(--red)",color:"#fff",border:"none",borderRadius:14,fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"var(--condensed)",textTransform:"uppercase",letterSpacing:1}}>Let's Go →</button>
        </div>
      </div>
    );
  }

  if(phase==="promo")return<PromoScreen profile={profile} onValidCode={()=>setPhase("app")} onNoCode={()=>setPhase("paywall")}/>;
  if(phase==="paywall")return<Paywall profile={profile}/>;
  if(phase==="upgrade"){track(EVENTS.UPGRADE_VIEWED,{},user?.id);return<UpgradeScreen profile={profile} onContinue={()=>setPhase("app")}/>;}
  if(phase==="expired")return<ExpiredPaywall profile={profile} onDismiss={()=>setPhase("app")} onSubscribed={async()=>{
    if(user)await loadProfile(user.id);
    else setPhase("app");
  }}/>;

  return<App profile={profile} schedule={schedule} setSchedule={setSchedule} dayFocus={dayFocus} wPrefs={wPrefs} setWPrefs={setWPrefs} onEarnedCals={cals=>setEarnedCals(prev=>prev+cals)} onSignOut={handleSignOut} user={user} onProfileUpdate={patch=>setProfile(p=>({...p,...patch}))}/>;
}
