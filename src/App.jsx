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
import { FuelSection, TrainSection, ConnectSection, SettingsSection,
  WorkoutBuilder, SPLITS_WITH_DAYS, GVT_INFO,
  LIFTING_SPLITS, RUN_PLANS_DETAIL, HYBRID_TEMPLATES, PROMOS,
  PromoScreen, Paywall } from "./sections.jsx";
import { FuelOnboarding, TrainOnboarding } from "./onboarding.jsx";

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({onSignUp}) {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>40);
    window.addEventListener("scroll",h);
    // Intersection observer for reveal animations
    const obs=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible");});
    },{threshold:.15});
    setTimeout(()=>{
      document.querySelectorAll(".reveal").forEach(el=>obs.observe(el));
    },100);
    return()=>{window.removeEventListener("scroll",h);obs.disconnect();};
  },[]);

  const Btn=({children,style={}})=>(
    <button onClick={onSignUp} style={{background:T.prot,color:"#fff",border:"none",borderRadius:9,padding:"14px 28px",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .2s",...style}}>{children}</button>
  );

  return(
    <div style={{minHeight:"100vh",background:"#080808",color:"#fff",fontFamily:"'Inter',system-ui,sans-serif",overflowX:"hidden",width:"100%",maxWidth:"100vw"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::selection{background:#2979FF;color:#fff}
      `}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:scrolled?"rgba(8,8,8,.95)":"transparent",backdropFilter:scrolled?"blur(16px)":"none",borderBottom:scrolled?"1px solid rgba(255,255,255,.04)":"none",transition:"all .3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width={52} height={22} viewBox="0 0 52 22"><rect x={0} y={0} width={14} height={22} rx={3} fill="#2979FF"/><rect x={19} y={5} width={14} height={17} rx={3} fill="#00E676"/><rect x={38} y={10} width={14} height={12} rx={3} fill="#FFD740"/></svg>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,letterSpacing:3,fontSize:17,lineHeight:1.1}}>
            <div style={{color:"#fff"}}>COACH</div>
            <div><span style={{color:"#2979FF"}}>M</span><span style={{color:"#00E676"}}>A</span><span style={{color:"#FFD740"}}>C</span><span style={{color:"#fff"}}>RO</span></div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button onClick={onSignUp} style={{color:"#aaa",fontSize:14,fontWeight:500,padding:"9px 18px",borderRadius:8,border:"1px solid #1C1C1C",background:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .2s"}}>Log in</button>
          <button onClick={onSignUp} style={{background:"#2979FF",color:"#fff",fontSize:14,fontWeight:700,padding:"10px 22px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit"}}>Start Free →</button>
        </div>
      </nav>

      {/* PARTICLES BACKGROUND */}
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        {[...Array(20)].map((_,i)=>(
          <div key={i} style={{
            position:"absolute",
            width:i%3===0?3:i%3===1?2:1.5,
            height:i%3===0?3:i%3===1?2:1.5,
            borderRadius:"50%",
            background:i%3===0?"#2979FF":i%3===1?"#00E676":"#FFD740",
            left:`${(i*17+7)%100}%`,
            top:`${(i*23+11)%100}%`,
            opacity:.3+((i%4)*.1),
            animation:`glow ${2+i%3}s ease-in-out ${i*.3}s infinite`,
          }}/>
        ))}
        {/* Grid overlay */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(41,121,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(41,121,255,.03) 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
        {/* Gradient orbs */}
        <div style={{position:"absolute",top:"15%",left:"10%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(41,121,255,.06),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:"20%",right:"5%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,230,118,.04),transparent 70%)",pointerEvents:"none"}}/>
      </div>

      {/* HERO */}
      <section style={{minHeight:"100vh",padding:"120px 24px 60px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:40,alignItems:"center",maxWidth:1200,margin:"0 auto",position:"relative",zIndex:1}}>
        <div>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(41,121,255,.08)",border:"1px solid rgba(41,121,255,.18)",borderRadius:24,padding:"7px 18px",fontSize:11,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#2979FF",marginBottom:28}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#2979FF",display:"inline-block"}}></span>
            AI Fitness Platform
          </div>
          <div className="hero-title" style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(68px,7.5vw,110px)",fontWeight:900,fontStyle:"italic",lineHeight:.88,letterSpacing:"-.02em",marginBottom:24}}>
            FUEL<br/>SMARTER.<br/><span className="grad-text">TRAIN<br/>HARDER.</span>
          </div>
          <p style={{fontSize:18,color:"#666",lineHeight:1.7,maxWidth:420,marginBottom:32}}>The only app where your nutrition and training share one brain — adjusting every day based on what you actually do.</p>
          <div style={{display:"flex",gap:12,marginBottom:40,flexWrap:"wrap"}}>
            <Btn style={{fontSize:15,padding:"15px 30px"}}>Start Free for 7 Days →</Btn>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{display:"flex"}}>
              {["#2979FF","#00E676","#FFD740","#00C9A7"].map((c,i)=>(
                <div key={i} style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${c},${c}88)`,border:"2px solid #080808",marginLeft:i?-9:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"}}>
                  {["M","J","S","A"][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{color:"#FFD740",fontSize:13,letterSpacing:2}}>★★★★★</div>
              <div style={{fontSize:13,color:"#666",marginTop:2}}>Loved by <b style={{color:"#fff"}}>400+ athletes</b> · 7-day free trial</div>
            </div>
          </div>
        </div>
        {/* Hero visual — hidden on mobile */}
        <div className="hero-phone" style={{justifyContent:"center",alignItems:"center"}}><div className="phone-float">
          <div style={{background:"#0D0D0D",border:"1px solid #1C1C1C",borderRadius:36,overflow:"hidden",width:260,boxShadow:"0 40px 80px rgba(0,0,0,.7)"}}>
            <div style={{background:"#060606",padding:"20px 16px",minHeight:480}}>
              <div style={{width:58,height:4,background:"#1A1A1A",borderRadius:2,margin:"0 auto 16px"}}></div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div><div style={{fontSize:8,color:"#444"}}>Training Day</div><div style={{fontSize:13,fontWeight:800}}>Hey Marcus 👋</div></div>
                <div style={{background:"rgba(41,121,255,.15)",border:"1px solid rgba(41,121,255,.3)",borderRadius:18,padding:"3px 8px",fontSize:7,fontWeight:700,color:"#2979FF"}}>💪 PUSH</div>
              </div>
              <div style={{textAlign:"center",marginBottom:10}}>
                <svg width="130" height="130" style={{transform:"rotate(-90deg)"}}>
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#1A1A1A" strokeWidth="11"/>
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#2979FF" strokeWidth="11" strokeDasharray="109 327" strokeDashoffset="0" strokeLinecap="round"/>
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#00E676" strokeWidth="11" strokeDasharray="87 327" strokeDashoffset="-109" strokeLinecap="round"/>
                  <circle cx="65" cy="65" r="52" fill="none" stroke="#FFD740" strokeWidth="11" strokeDasharray="55 327" strokeDashoffset="-196" strokeLinecap="round"/>
                </svg>
                <div style={{marginTop:-87,textAlign:"center"}}><div style={{fontSize:30,fontWeight:900,lineHeight:1}}>962</div><div style={{fontSize:7,color:"#444",textTransform:"uppercase",letterSpacing:1,marginTop:1}}>kcal left</div></div>
                <div style={{marginTop:56,display:"flex",justifyContent:"center",gap:16,fontSize:9}}><span style={{color:"#666"}}>Budget <b style={{color:"#fff"}}>2,847</b></span><span style={{color:"#666"}}>Eaten <b style={{color:"#fff"}}>1,885</b></span></div>
              </div>
              {[["Protein","#2979FF","195/240g",81],["Carbs","#00E676","186/320g",58],["Fat","#FFD740","47/68g",69]].map(([n,c,v,p])=>(
                <div key={n} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:8,marginBottom:2}}><span style={{color:c,fontWeight:700}}>{n}</span><span style={{color:"#555"}}>{v}</span></div>
                  <div style={{height:4,background:"#1A1A1A",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:c,borderRadius:2}}></div></div>
                </div>
              ))}
            </div>
          </div>
        </div></div>
      </section>

      {/* STATS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",borderTop:"1px solid #1C1C1C",borderBottom:"1px solid #1C1C1C"}}>
        {[["25","metabolic variables","#2979FF"],["3M+","foods in database","#00E676"],["4","device integrations","#FFD740"],["$0","charged today","#fff"]].map(([n,l,c])=>(
          <div key={n} style={{padding:"36px 24px",textAlign:"center",borderRight:"1px solid #1C1C1C"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:56,fontWeight:900,lineHeight:1,color:c}}>{n}</div>
            <div style={{fontSize:12,color:"#4A4A4A",marginTop:6}}>{l}</div>
          </div>
        ))}
      </div>

      {/* WHY */}
      <section style={{padding:"64px 24px",maxWidth:1100,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(48px,6.5vw,88px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
          MOST PEOPLE TRAIN HARD<br/>AND <span style={{color:"#2979FF"}}>STILL DON'T SEE RESULTS.</span>
        </div>
        <p style={{fontSize:16,color:"#666",maxWidth:520,margin:"0 auto 56px",lineHeight:1.72}}>It's not effort. It's the missing connection between what you eat and how you train.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:1,background:"#1C1C1C",border:"1px solid #1C1C1C",borderRadius:16,overflow:"hidden",marginBottom:56}}>
          {[["73%","of lifters undereat on training days","Carb needs increase 30–50% on heavy training days. Eating the same every day leaves performance on the floor.","#2979FF"],
            ["2–3×","more strength gained with tracked overload","Athletes who log volume and progression consistently outperform those who train by feel — across every study.","#00E676"],
            ["68%","never hit their protein target consistently","0.7–1g per lb is the proven minimum for muscle growth. Most people miss it more days than they hit it.","#FFD740"]
          ].map(([n,h,b,c])=>(
            <div key={n} style={{background:"#0F0F0F",padding:"32px 28px"}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:56,fontWeight:900,color:c,lineHeight:1,marginBottom:8}}>{n}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:8}}>{h}</div>
              <div style={{fontSize:13,color:"#666",lineHeight:1.7}}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:2,background:"#1C1C1C",border:"1px solid #1C1C1C",borderRadius:16,overflow:"hidden",maxWidth:900,margin:"0 auto 56px"}}>
          <div style={{background:"#0F0F0F",padding:"48px 40px"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(72px,8vw,108px)",fontWeight:900,fontStyle:"italic",lineHeight:.85,color:"#2979FF",marginBottom:20}}>FUEL</div>
            <p style={{fontSize:15,color:"#999",lineHeight:1.7,marginBottom:24}}>Dynamic nutrition that shifts every morning based on what your body needs today.</p>
            {["Dynamic macros — different every day","AI food logging — describe any meal","Barcode scanner — 3M+ products","Restaurant AI — exact orders to hit macros","Fasting tracker — 16:8, OMAD, custom"].map(f=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:"#ccc",marginBottom:10}}><span style={{color:"#2979FF"}}>⚡</span>{f}</div>
            ))}
          </div>
          <div style={{background:"#080808",padding:"48px 40px"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(72px,8vw,108px)",fontWeight:900,fontStyle:"italic",lineHeight:.85,color:"#00E676",marginBottom:20}}>TRAIN</div>
            <p style={{fontSize:15,color:"#999",lineHeight:1.7,marginBottom:24}}>Every set logged. Every muscle tracked. Workouts earn calories that go into your Fuel budget.</p>
            {["Progressive overload — last vs suggested","Muscle volume tracker — optimal zone","Smart rest timer — auto-starts every set","Hyrox + running plans built in","Hybrid mode — strength + cardio + Hyrox"].map(f=>(
              <div key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:"#ccc",marginBottom:10}}><span style={{color:"#00E676"}}>📈</span>{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF — scrolling testimonials */}
      <section style={{padding:"80px 0 60px",overflow:"hidden"}}>
        <div style={{textAlign:"center",padding:"0 24px",marginBottom:40}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Real athletes. Real results.</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(40px,6vw,72px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
            PEOPLE WHO STOPPED<br/><span style={{color:"#2979FF"}}>GUESSING.</span>
          </div>
        </div>
        <div style={{position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,bottom:0,left:0,width:80,background:"linear-gradient(90deg,#080808,transparent)",zIndex:10,pointerEvents:"none"}}></div>
          <div style={{position:"absolute",top:0,bottom:0,right:0,width:80,background:"linear-gradient(-90deg,#080808,transparent)",zIndex:10,pointerEvents:"none"}}></div>
          <style>{`
            @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
            .ttrack{display:flex;gap:14px;animation:marquee 50s linear infinite;width:max-content}
            .ttrack:hover{animation-play-state:paused}
          `}</style>
          <div className="ttrack">
            {[
              {q:"The macros actually changing based on whether I'm training or resting is insane. Every other app gives me the same numbers every day. This one actually adapts.",n:"Marcus T.",m:"PPL · Bulk · 4 months"},
              {q:"Restaurant finder is unreal. 400 calories left at dinner, it told me exactly what to order at Chick-fil-A. Hit my macros perfectly.",n:"Jessica R.",m:"Cutting · 8 weeks · −14 lbs"},
              {q:"Rest timer auto-starting after I log a set changed my workouts completely. I'm in and out faster and hitting more volume every session.",n:"David K.",m:"Bro Split · Advanced · 6 years"},
              {q:"Hyrox simulation is exactly what I needed. 8 stations, 1km runs between. Built my entire race prep in 10 minutes. Hit my target finish time.",n:"Sofia M.",m:"Hyrox competitor · Sub-70 min"},
              {q:"Strava adds my burned calories to my budget automatically. Ran 10K, got 600 extra calories. The ring updates instantly. I actually ate more and still lost weight.",n:"Ryan P.",m:"Hybrid athlete · Marathon training"},
              {q:"Progressive overload suggestions are scary accurate. Shows last session right next to today's target. Hit PRs 4 weeks straight since I switched.",n:"Alicia N.",m:"Upper/Lower · 2 years lifting"},
              {q:"I've tried MacroFactor, MFP, Cronometer. None tracked workouts too. Having both in one place where they actually talk to each other is completely different.",n:"James W.",m:"Arnold Split · 5 years · Advanced"},
              {q:"Described my entire Thanksgiving plate in one sentence. Logged everything within 50 calories of what I calculated manually. Genuinely wild.",n:"Priya S.",m:"Full Body · Maintain"},
              {q:"The macros actually changing based on whether I'm training or resting is insane. Every other app gives me the same numbers every day. This one actually adapts.",n:"Marcus T.",m:"PPL · Bulk · 4 months"},
              {q:"Restaurant finder is unreal. 400 calories left at dinner, it told me exactly what to order at Chick-fil-A. Hit my macros perfectly.",n:"Jessica R.",m:"Cutting · 8 weeks · −14 lbs"},
              {q:"Rest timer auto-starting after I log a set changed my workouts completely. I'm in and out faster and hitting more volume every session.",n:"David K.",m:"Bro Split · Advanced · 6 years"},
              {q:"Hyrox simulation is exactly what I needed. 8 stations, 1km runs between. Built my entire race prep in 10 minutes. Hit my target finish time.",n:"Sofia M.",m:"Hyrox competitor · Sub-70 min"},
            ].map((t,i)=>(
              <div key={i} style={{background:"#0F0F0F",border:"1px solid #1C1C1C",borderRadius:14,padding:24,width:320,flexShrink:0}}>
                <div style={{color:"#FFD740",fontSize:12,marginBottom:12,letterSpacing:2}}>★★★★★</div>
                <p style={{fontSize:13,lineHeight:1.75,color:"#aaa",marginBottom:16}}>"{t.q}"</p>
                <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{t.n}</div>
                <div style={{fontSize:11,color:"#4A4A4A",marginTop:2}}>{t.m}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EVERY BODY IS AN ATHLETE */}
      <section style={{padding:"80px 24px",background:"#050505",overflow:"hidden"}}>
        <div style={{textAlign:"center",marginBottom:64}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Real Transformations</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(56px,9vw,128px)",fontWeight:900,fontStyle:"italic",lineHeight:.82}}>
            EVERY<br/><span style={{color:"#2979FF"}}>BODY</span><br/>IS AN<br/>ATHLETE.
          </div>
          <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"20px auto 0",lineHeight:1.72}}>Different goals. Different starting points. One system that adapts to all of them.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,maxWidth:1100,margin:"0 auto"}}>
          {[
            {name:"Jessica R.",period:"8 weeks · Cut phase",stats:[{n:"-14",l:"lbs lost",c:"#00E676"},{n:"+4",l:"lbs muscle",c:"#2979FF"},{n:"-6%",l:"body fat",c:"#FFD740"}],quote:"The restaurant AI kept me on track every time I ate out. I never felt like I was dieting.",badge:"-14 lbs",bc:"#00E676",before:"164",after:"150",goal:"cut"},
            {name:"Marcus T.",period:"16 weeks · Bulk · PPL",stats:[{n:"+18",l:"lbs gained",c:"#2979FF"},{n:"+40",l:"lbs bench",c:"#00E676"},{n:"4mo",l:"timeline",c:"#FFD740"}],quote:"Dynamic macros shifting on training vs rest days was the missing piece. I was leaving gains on the table every week.",badge:"+18 lbs",bc:"#2979FF",before:"162",after:"180",goal:"bulk"},
            {name:"Sofia M.",period:"12 weeks · Hyrox race prep",stats:[{n:"-9",l:"min faster",c:"#FF6B2B"},{n:"-8",l:"lbs race wt",c:"#00E676"},{n:"12w",l:"prep",c:"#2979FF"}],quote:"Built my entire race plan in 10 minutes. Hyrox mode with race-day nutrition was something no other app came close to.",badge:"Sub-70",bc:"#FF6B2B",before:"79",after:"<70",goal:"hyrox"},
          ].map((p,pi)=>(
            <div key={pi} style={{background:"#0F0F0F",border:"1px solid #1C1C1C",borderRadius:20,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:"#080808",position:"relative"}}>
                {/* Before */}
                <div style={{padding:"28px 16px 16px",display:"flex",flexDirection:"column",alignItems:"center",borderRight:"1px solid #1C1C1C",position:"relative"}}>
                  <div style={{position:"absolute",top:10,left:10,fontSize:9,fontWeight:700,color:"#444",letterSpacing:2,textTransform:"uppercase"}}>BEFORE</div>
                  <svg viewBox="0 0 100 200" width="80" height="140">
                    <ellipse cx="50" cy="22" rx={p.goal==="bulk"?14:p.goal==="cut"?16:14} ry="17" fill="#2A2A2A"/>
                    <rect x="43" y="37" width="14" height="9" fill="#2A2A2A"/>
                    <path d={p.goal==="cut"?"M20,50 C16,52 14,68 14,90 Q14,115 50,115 Q86,115 86,90 C86,68 84,52 80,50 Z":p.goal==="bulk"?"M34,47 C32,47 30,58 30,76 Q30,90 50,90 Q70,90 70,76 C70,58 68,47 66,47 Z":"M33,46 C30,46 27,58 27,78 Q27,94 50,94 Q73,94 73,78 C73,58 70,46 67,46 Z"} fill="#2A2A2A"/>
                    {p.goal==="cut"&&<ellipse cx="50" cy="88" rx="24" ry="18" fill="#242424"/>}
                    <path d={p.goal==="cut"?"M20,55 C10,60 6,80 8,105":p.goal==="bulk"?"M34,51 C28,56 24,72 26,90":"M33,51 C25,56 20,73 22,92"} fill="none" stroke="#2A2A2A" strokeWidth={p.goal==="cut"?12:8} strokeLinecap="round"/>
                    <path d={p.goal==="cut"?"M80,55 C90,60 94,80 92,105":p.goal==="bulk"?"M66,51 C72,56 76,72 74,90":"M67,51 C75,56 80,73 78,92"} fill="none" stroke="#2A2A2A" strokeWidth={p.goal==="cut"?12:8} strokeLinecap="round"/>
                    <path d={p.goal==="cut"?"M40,115 L34,190":"M43,90 L38,186"} fill="none" stroke="#2A2A2A" strokeWidth={p.goal==="cut"?13:9} strokeLinecap="round"/>
                    <path d={p.goal==="cut"?"M60,115 L66,190":"M57,90 L62,186"} fill="none" stroke="#2A2A2A" strokeWidth={p.goal==="cut"?13:9} strokeLinecap="round"/>
                  </svg>
                  <div style={{marginTop:8,textAlign:"center"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:"#444",lineHeight:1}}>{p.before}</div>
                    <div style={{fontSize:9,color:"#333",marginTop:1}}>{p.goal==="hyrox"?"min Hyrox":"lbs"}</div>
                  </div>
                </div>
                {/* After */}
                <div style={{padding:"28px 16px 16px",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",background:p.goal==="cut"?"#050F08":p.goal==="bulk"?"#050814":"#0F0602"}}>
                  <div style={{position:"absolute",top:10,right:10,fontSize:9,fontWeight:700,color:p.bc,letterSpacing:2,textTransform:"uppercase"}}>AFTER</div>
                  <svg viewBox="0 0 100 200" width="80" height="140">
                    <ellipse cx="50" cy={p.goal==="bulk"?21:22} rx={p.goal==="bulk"?16:14} ry={p.goal==="bulk"?19:17} fill={p.bc} opacity=".85"/>
                    <rect x="43" y="37" width="14" height="9" fill={p.bc} opacity=".85"/>
                    <path d={p.goal==="cut"?"M28,47 C25,47 22,58 22,76 Q22,92 50,92 Q78,92 78,76 C78,58 75,47 72,47 Z":p.goal==="bulk"?"M22,47 C18,47 16,56 16,74 Q20,94 50,94 Q80,94 84,74 C84,56 82,47 78,47 Z":"M34,46 C30,46 24,58 24,78 Q24,94 56,94 Q80,88 82,72 C80,56 74,46 70,46 Z"} fill={p.bc} opacity=".55"/>
                    {p.goal==="bulk"&&<><ellipse cx="18" cy="56" rx="8" ry="10" fill={p.bc} opacity=".6"/><ellipse cx="82" cy="56" rx="8" ry="10" fill={p.bc} opacity=".6"/></>}
                    <path d={p.goal==="bulk"?"M22,52 C12,58 8,76 10,96":p.goal==="cut"?"M28,52 C20,57 16,74 18,94":"M32,52 C24,57 18,74 20,92"} fill="none" stroke={p.bc} strokeWidth={p.goal==="bulk"?12:8} strokeLinecap="round" opacity=".8"/>
                    <path d={p.goal==="bulk"?"M78,52 C88,58 92,76 90,96":p.goal==="cut"?"M72,52 C80,57 84,74 82,94":"M70,50 C82,44 90,52 88,66"} fill="none" stroke={p.bc} strokeWidth={p.goal==="bulk"?12:8} strokeLinecap="round" opacity=".8"/>
                    <path d={p.goal==="bulk"?"M40,94 L32,188":p.goal==="cut"?"M42,92 L36,186":"M42,94 C36,118 28,138 22,166"} fill="none" stroke={p.bc} strokeWidth={p.goal==="bulk"?13:p.goal==="hyrox"?11:9} strokeLinecap="round" opacity=".8"/>
                    <path d={p.goal==="bulk"?"M60,94 L68,188":p.goal==="cut"?"M58,92 L64,186":"M58,92 C68,112 74,136 72,168"} fill="none" stroke={p.bc} strokeWidth={p.goal==="bulk"?13:p.goal==="hyrox"?11:9} strokeLinecap="round" opacity=".8"/>
                    {p.goal==="hyrox"&&<><line x1="4" y1="78" x2="20" y2="78" stroke={p.bc} strokeWidth="2.5" opacity=".5"/><line x1="2" y1="88" x2="18" y2="88" stroke={p.bc} strokeWidth="2" opacity=".35"/></>}
                    {(p.goal==="cut"||p.goal==="bulk")&&<><line x1="44" y1="65" x2="56" y2="65" stroke={p.bc} strokeWidth="1.5" opacity=".35"/><line x1="43" y1="72" x2="57" y2="72" stroke={p.bc} strokeWidth="1.5" opacity=".3"/></>}
                  </svg>
                  <div style={{marginTop:8,textAlign:"center"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:p.bc,lineHeight:1}}>{p.after}</div>
                    <div style={{fontSize:9,color:p.bc,marginTop:1,opacity:.6}}>{p.goal==="hyrox"?"min Hyrox":"lbs"}</div>
                  </div>
                </div>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:28,height:28,background:"#0F0F0F",border:"1px solid #1C1C1C",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:p.bc,fontWeight:700,zIndex:2}}>→</div>
              </div>
              <div style={{padding:"20px 22px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div><div style={{fontSize:16,fontWeight:700}}>{p.name}</div><div style={{fontSize:11,color:"#666",marginTop:2}}>{p.period}</div></div>
                  <div style={{background:`${p.bc}18`,border:`1px solid ${p.bc}40`,borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:p.bc}}>{p.badge}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
                  {p.stats.map((s,si)=>(
                    <div key={si} style={{background:"#080808",borderRadius:8,padding:"8px",textAlign:"center"}}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:s.c,lineHeight:1}}>{s.n}</div>
                      <div style={{fontSize:9,color:"#4A4A4A",marginTop:2}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <p style={{fontSize:13,color:"#888",lineHeight:1.7,fontStyle:"italic"}}>"{p.quote}"</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:56}}>
          <p style={{fontSize:16,color:"#666",maxWidth:520,margin:"0 auto 24px",lineHeight:1.7}}>Whether you're cutting, bulking, or racing — Coach Macro builds around <b style={{color:"#fff"}}>your</b> body, <b style={{color:"#fff"}}>your</b> goal.</p>
          <button onClick={onSignUp} style={{background:"#2979FF",color:"#fff",border:"none",borderRadius:9,padding:"16px 36px",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Start Your Transformation →</button>
        </div>
      </section>

      {/* WHAT SEPARATES US */}
      <section style={{padding:"80px 24px",background:"#050505",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:800,height:400,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(41,121,255,.04),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative"}}>
          <div className="reveal" style={{textAlign:"center",marginBottom:64}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Why Coach Macro</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(48px,7vw,96px)",fontWeight:900,fontStyle:"italic",lineHeight:.88,marginBottom:16}}>
              EVERY OTHER APP<br/><span className="grad-text">MISSES THIS.</span>
            </div>
            <p style={{fontSize:16,color:"#666",maxWidth:560,margin:"0 auto",lineHeight:1.72}}>Nutrition apps don't know you trained. Workout apps don't know what you ate. Coach Macro is the first app where both sides of the equation share one brain.</p>
          </div>

          {/* Comparison table */}
          <div className="reveal" style={{background:"#0A0A0A",border:"1px solid #1C1C1C",borderRadius:20,overflow:"hidden",marginBottom:48}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:"1px solid #1C1C1C"}}>
              <div style={{padding:"16px 24px",fontSize:11,fontWeight:700,letterSpacing:2,color:"#333",textTransform:"uppercase"}}>Feature</div>
              <div style={{padding:"16px 24px",fontSize:11,fontWeight:700,letterSpacing:2,color:"#333",textTransform:"uppercase",borderLeft:"1px solid #1C1C1C",textAlign:"center"}}>Other Apps</div>
              <div style={{padding:"16px 24px",fontSize:11,fontWeight:700,letterSpacing:2,color:"#2979FF",textTransform:"uppercase",borderLeft:"1px solid #1C1C1C",textAlign:"center",background:"rgba(41,121,255,.04)"}}>Coach Macro</div>
            </div>
            {[
              ["Macros adjust for training days","❌ Same every day","✅ Changes every morning"],
              ["Workout earns extra calories","❌ Disconnected","✅ Auto-adjusts budget"],
              ["Restaurant AI for remaining macros","❌ Generic suggestions","✅ Exact orders, real menus"],
              ["Muscle volume optimization","❌ Not tracked","✅ 10–20 sets optimal zone"],
              ["Split recommendation by days","❌ One-size-fits-all","✅ Matched to your schedule"],
              ["Progressive overload tracking","❌ Manual logging only","✅ Last session vs target"],
              ["GVT periodization weeks","❌ Not available","✅ Auto week 4 every month"],
              ["Hyrox race programming","❌ Not available","✅ 12-week race prep built in"],
              ["Arnold Split + advanced programs","❌ Basic splits only","✅ 13 programs, all levels"],
              ["Recovery-aware (sleep → volume)","❌ Programs in a vacuum","✅ Adjusts when you're tired"],
            ].map(([f,bad,good],i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:i<9?"1px solid #111":"none"}}>
                <div style={{padding:"14px 24px",fontSize:13,color:"#888"}}>{f}</div>
                <div style={{padding:"14px 24px",fontSize:13,color:"#333",borderLeft:"1px solid #111",textAlign:"center"}}>{bad}</div>
                <div style={{padding:"14px 24px",fontSize:13,color:"#ccc",borderLeft:"1px solid #111",textAlign:"center",background:"rgba(41,121,255,.02)"}}>{good}</div>
              </div>
            ))}
          </div>

          {/* 3 key differentiators */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>
            {[
              {icon:"🔁",color:"#2979FF",title:"Fuel ↔ Train Loop",desc:"The only app where your nutrition and training share data. Train hard → eat more. Rest day → eat less. Automatic, every day."},
              {icon:"🧠",color:"#00E676",title:"AI That Knows You",desc:"25 data points from onboarding. Every recommendation — workouts, macros, restaurants, recipes — is built around YOUR body, not a generic user."},
              {icon:"📈",color:"#FFD740",title:"Progressive Everything",desc:"Overload on every set. Volume tracking per muscle. GVT cycles. Deload detection. Built by people who actually lift, not just engineers."},
            ].map(({icon,color,title,desc},i)=>(
              <div key={i} className="reveal" style={{background:"#0A0A0A",border:`1px solid ${color}20`,borderRadius:16,padding:"28px 24px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${color}08,transparent 70%)`,transform:"translate(30%,-30%)"}}/>
                <div style={{fontSize:32,marginBottom:16}}>{icon}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color,lineHeight:1,marginBottom:10}}>{title}</div>
                <div style={{fontSize:14,color:"#777",lineHeight:1.72}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

            {/* INTEGRATIONS */}
      <section style={{padding:"64px 24px",background:"#080808"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Connect</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(40px,6vw,72px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
            EVERY WORKOUT<br/><span style={{color:"#2979FF"}}>EARNS CALORIES.</span>
          </div>
          <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"0 auto",lineHeight:1.65}}>Burned calories flow straight into your Fuel budget. Connect once, syncs automatically.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,maxWidth:1100,margin:"0 auto"}}>
          {[["🟠","Strava","Runs · Rides · Workouts","Live API Sync"],["🍎","Apple Health","Workouts · Steps · Sleep","Import"],["⌚","Garmin Connect","Activities · HR · Pace","Import"],["💜","Fitbit","Workouts · Steps","Import"]].map(([icon,name,sub,badge])=>(
            <div key={name} style={{background:"#0F0F0F",border:"1px solid #1C1C1C",borderRadius:14,padding:22}}>
              <div style={{fontSize:26,marginBottom:10}}>{icon}</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#fff"}}>{name}</div>
              <div style={{fontSize:12,color:"#666",marginBottom:8}}>{sub}</div>
              <div style={{display:"inline-block",fontSize:9,fontWeight:700,letterSpacing:1,color:"#00E676",background:"rgba(0,230,118,.08)",border:"1px solid rgba(0,230,118,.15)",borderRadius:20,padding:"3px 10px"}}>{badge}</div>
            </div>
          ))}
        </div>
      </section>

            {/* PRICING */}
      <section style={{padding:"64px 24px",textAlign:"center",background:"#050505"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(48px,6vw,80px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
          START FREE.<br/><span style={{color:"#2979FF"}}>STAY BECAUSE IT WORKS.</span>
        </div>
        <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"0 auto 48px",lineHeight:1.65}}>7 days free. No credit card required. Cancel before day 8 and pay nothing.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,maxWidth:760,margin:"0 auto"}}>
          {[{t:"Monthly",p:"$4.99",per:"/mo",s:"billed monthly",note:"Today: $0.00",featured:false},
            {t:"Yearly",p:"$19.99",per:"/yr",s:"$1.67/month · 67% off",note:"Today: $0.00",featured:true}
          ].map(({t,p,per,s,note,featured})=>(
            <div key={t} style={{background:featured?"#050A14":"#0F0F0F",border:`1.5px solid ${featured?"rgba(41,121,255,.3)":"#1C1C1C"}`,borderRadius:18,padding:"36px 32px",position:"relative"}}>
              {featured&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#2979FF",color:"#fff",fontSize:9,fontWeight:800,padding:"4px 14px",borderRadius:9,letterSpacing:1.5,whiteSpace:"nowrap"}}>BEST VALUE</div>}
              <div style={{fontSize:10,color:"#4A4A4A",fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>{t}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:68,fontWeight:900,lineHeight:1,letterSpacing:-2,color:featured?"#2979FF":"#fff",marginBottom:4}}>{p}<span style={{fontSize:22,fontWeight:400,color:"#4A4A4A"}}>{per}</span></div>
              <div style={{fontSize:13,color:"#4A4A4A",marginBottom:6}}>{s}</div>
              <div style={{fontSize:13,color:"#00E676",fontWeight:700,marginBottom:24}}>{note} — 7 days free</div>
              <button onClick={onSignUp} style={{display:"block",width:"100%",textAlign:"center",padding:"15px",borderRadius:10,fontWeight:700,fontSize:15,cursor:"pointer",border:"none",fontFamily:"'Inter',sans-serif",background:featured?"#2979FF":"#1C1C1C",color:"#fff"}}>Start Free Trial →</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{padding:"72px 24px",textAlign:"center"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(56px,8vw,112px)",fontWeight:900,fontStyle:"italic",lineHeight:.88,marginBottom:18}}>
          STOP GUESSING.<br/><span style={{color:"#2979FF"}}>START KNOWING.</span>
        </div>
        <p style={{fontSize:17,color:"#666",maxWidth:420,margin:"0 auto 32px",lineHeight:1.65}}>Your macros. Your workouts. Your data. One system built around how your body actually works.</p>
        <Btn style={{fontSize:17,padding:"17px 40px"}}>Start Free for 7 Days →</Btn>
        <div style={{fontSize:13,color:"#1C1C1C",marginTop:14}}>No credit card · Free trial · Cancel anytime</div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid #1C1C1C",padding:"28px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width={40} height={17} viewBox="0 0 52 22"><rect x={0} y={0} width={14} height={22} rx={3} fill="#2979FF"/><rect x={19} y={5} width={14} height={17} rx={3} fill="#00E676"/><rect x={38} y={10} width={14} height={12} rx={3} fill="#FFD740"/></svg>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,letterSpacing:3,fontSize:14,color:"#fff"}}>COACH MACRO</span>
        </div>
        <div style={{fontSize:12,color:"#1C1C1C"}}>© 2026 Coach Macro. All rights reserved.</div>
      </footer>
    </div>
  );
}

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
