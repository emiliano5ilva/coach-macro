import React, { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, FAQItem, Logo } from "./components.jsx";

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
export function LandingPage({onSignUp}) {
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
    <div style={{minHeight:"100vh",background:"#060D1A",color:"#fff",fontFamily:"'Inter',system-ui,sans-serif",overflowX:"hidden",width:"100%",maxWidth:"100vw"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,900;1,900&family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::selection{background:#2979FF;color:#fff}
      `}</style>

      {/* NAV */}
      <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:200,height:64,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",background:scrolled?"rgba(8,8,8,.95)":"transparent",backdropFilter:scrolled?"blur(16px)":"none",borderBottom:scrolled?"1px solid rgba(255,255,255,.04)":"none",transition:"all .3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Logo size={28} text={true}/>
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
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(41,121,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(41,121,255,.04) 1px,transparent 1px)",backgroundSize:"60px 60px"}}/>
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

        {/* Hero phone mockup — hidden on mobile */}
        <div className="hero-phone" style={{alignItems:"center"}}>
          <div className="phone-float">
            <div style={{background:"#0A1424",border:"1px solid #1C1C2E",borderRadius:36,overflow:"hidden",width:260,boxShadow:"0 40px 80px rgba(0,0,0,.8),0 0 60px rgba(232,24,90,.08)"}}>
              <div style={{background:"#060D1A",padding:"12px 16px 8px"}}>
                <div style={{width:48,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 12px"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div>
                    <div style={{fontSize:9,color:"#4A6080",letterSpacing:1,marginBottom:2}}>MONDAY — PUSH DAY</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>Hey Marcus 👋</div>
                  </div>
                  <div style={{background:"rgba(232,24,90,.15)",border:"1px solid rgba(232,24,90,.3)",borderRadius:16,padding:"3px 8px",fontSize:7,fontWeight:700,color:"#E8185A"}}>🏋️ PUSH</div>
                </div>
                <div style={{textAlign:"center",marginBottom:12,position:"relative"}}>
                  <svg width="130" height="130" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="65" cy="65" r="50" fill="none" stroke="#1C2A3A" strokeWidth="10"/>
                    <circle cx="65" cy="65" r="50" fill="none" stroke="#2979FF" strokeWidth="10" strokeDasharray="105 315" strokeLinecap="round"/>
                    <circle cx="65" cy="65" r="50" fill="none" stroke="#00E676" strokeWidth="10" strokeDasharray="84 315" strokeDashoffset="-105" strokeLinecap="round"/>
                    <circle cx="65" cy="65" r="50" fill="none" stroke="#FFD740" strokeWidth="10" strokeDasharray="52 315" strokeDashoffset="-189" strokeLinecap="round"/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:900,lineHeight:1,color:"#fff"}}>847</div>
                    <div style={{fontSize:7,color:"#4A6080",letterSpacing:1,marginTop:1}}>KCAL LEFT</div>
                  </div>
                </div>
                {[["Protein","#2979FF","195g","240g",81],["Carbs","#00E676","186g","320g",58],["Fat","#FFD740","47g","68g",69]].map(([n,c,v,t,p])=>(
                  <div key={n} style={{marginBottom:5}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:8,marginBottom:2}}>
                      <span style={{color:c,fontWeight:700}}>{n}</span>
                      <span style={{color:"#4A6080"}}>{v} / {t}</span>
                    </div>
                    <div style={{height:3,background:"#1C2A3A",borderRadius:2}}>
                      <div style={{height:"100%",width:`${p}%`,background:c,borderRadius:2}}/>
                    </div>
                  </div>
                ))}
                <div style={{height:1,background:"#1C2A3A",margin:"10px 0"}}/>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:8,color:"#4A6080",letterSpacing:1,marginBottom:6}}>TARGET MUSCLES</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {[["Chest","#E8185A"],["Shoulders","#E8185A"],["Triceps","#8B1A6B"]].map(([m,c])=>(
                      <div key={m} style={{background:`${c}20`,border:`1px solid ${c}40`,borderRadius:6,padding:"3px 7px",fontSize:7,color:c,fontWeight:700}}>{m}</div>
                    ))}
                  </div>
                </div>
                <div style={{background:"#0D1828",borderRadius:10,padding:"8px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:8,color:"#4A6080"}}>THIS WEEK</div>
                    <div style={{fontSize:8,color:"#E8185A",fontWeight:700}}>4/5 ✓</div>
                  </div>
                  <svg width="100%" height="32" viewBox="0 0 220 32">
                    {[[0,24,"#E8185A"],[32,28,"#E8185A"],[64,10,"#333"],[96,32,"#E8185A"],[128,20,"#E8185A"],[160,0,"#222"],[192,0,"#222"]].map(([x,h,c],i)=>(
                      <rect key={i} x={x} y={32-h} width="24" height={h||2} rx="3" fill={c}/>
                    ))}
                  </svg>
                  <div style={{display:"flex",justifyContent:"space-around",marginTop:3}}>
                    {["M","T","W","T","F","S","S"].map((d,i)=>(
                      <div key={i} style={{fontSize:7,color:i===4?"#E8185A":"#333",fontWeight:i===4?700:400}}>{d}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      {/* WHAT SEPARATES US */}
      <section style={{padding:"80px 24px",background:"#04080F",position:"relative",overflow:"hidden"}}>
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
          <div className="reveal" style={{borderRadius:20,overflow:"hidden",marginBottom:48,border:"1px solid #E5E5E5",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            {/* Table header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
              <div style={{padding:"16px 24px",fontSize:11,fontWeight:700,letterSpacing:2,color:"#999",textTransform:"uppercase",background:"#1C2A3A",borderBottom:"1px solid #222"}}>Feature</div>
              <div style={{padding:"16px 24px",fontSize:11,fontWeight:700,letterSpacing:2,color:"#333",textTransform:"uppercase",borderLeft:"1px solid #E5E5E5",textAlign:"center",background:"#fff",borderBottom:"1px solid #E5E5E5"}}>Other Apps</div>
              <div style={{padding:"16px 24px",fontSize:11,fontWeight:700,letterSpacing:2,color:"#2979FF",textTransform:"uppercase",borderLeft:"1px solid #1C2A4A",textAlign:"center",background:"#060D1A",borderBottom:"1px solid #1C2A4A"}}>Coach Macro</div>
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
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                <div style={{padding:"14px 24px",fontSize:13,color:"#888",background:"#1C2A3A",borderBottom:"1px solid #222"}}>{f}</div>
                <div style={{padding:"14px 24px",fontSize:13,color:"#1C2A3A",fontWeight:500,borderLeft:"1px solid #E5E5E5",textAlign:"center",background:"#fff",borderBottom:"1px solid #E5E5E5"}}>{bad}</div>
                <div style={{padding:"14px 24px",fontSize:13,color:"#7FBAFF",borderLeft:"1px solid #1C2A4A",textAlign:"center",background:"#060D1A",borderBottom:"1px solid #1C2A4A"}}>{good}</div>
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
              <div key={i} className="reveal" style={{background:"#080F1A",border:`1px solid ${color}20`,borderRadius:16,padding:"28px 24px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle,${color}08,transparent 70%)`,transform:"translate(30%,-30%)"}}/>
                <div style={{fontSize:32,marginBottom:16}}>{icon}</div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color,lineHeight:1,marginBottom:10}}>{title}</div>
                <div style={{fontSize:14,color:"#777",lineHeight:1.72}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* APP SCREENSHOTS — scrollable row */}
      <section style={{padding:"80px 0 80px",background:"#04080F",overflow:"hidden"}}>
        <div style={{textAlign:"center",padding:"0 24px",marginBottom:48}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Inside the App</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(44px,6vw,80px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
            BUILT FOR ATHLETES<br/><span style={{color:"#2979FF"}}>WHO MEAN IT.</span>
          </div>
          <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"0 auto",lineHeight:1.65}}>Every screen designed around your goal. Real data. Real decisions. Not generic.</p>
        </div>
        <div style={{display:"flex",gap:20,overflowX:"auto",paddingBottom:20,paddingLeft:48,paddingRight:48,scrollSnapType:"x mandatory",WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none"}}>
          <style>{`.snap-child{scroll-snap-align:start;flex-shrink:0}`}</style>

          {/* SCREEN 1 — Fuel Dashboard */}
          {[
            {title:"Fuel Dashboard",sub:"Dynamic macros · AI food logging · Restaurant finder",
             content:(
              <div style={{background:"#060D1A",padding:"16px 14px 14px",minHeight:480}}>
                <div style={{width:40,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 14px"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div><div style={{fontSize:9,color:"#4A6080",letterSpacing:1}}>TRAINING DAY</div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Fuel 🔥</div></div>
                  <div style={{background:"rgba(41,121,255,.12)",border:"1px solid rgba(41,121,255,.25)",borderRadius:20,padding:"4px 10px",fontSize:8,color:"#2979FF",fontWeight:700}}>+312 earned</div>
                </div>
                <div style={{position:"relative",textAlign:"center",marginBottom:14}}>
                  <svg width="150" height="150" style={{transform:"rotate(-90deg)",display:"block",margin:"0 auto"}}>
                    <circle cx="75" cy="75" r="62" fill="none" stroke="#1C2A3A" strokeWidth="12"/>
                    <circle cx="75" cy="75" r="62" fill="none" stroke="#2979FF" strokeWidth="12" strokeDasharray="196 194" strokeLinecap="round"/>
                    <circle cx="75" cy="75" r="62" fill="none" stroke="#00E676" strokeWidth="12" strokeDasharray="116 274" strokeDashoffset="-196" strokeLinecap="round"/>
                    <circle cx="75" cy="75" r="62" fill="none" stroke="#FFD740" strokeWidth="12" strokeDasharray="58 332" strokeDashoffset="-312" strokeLinecap="round"/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,color:"#fff",lineHeight:1}}>847</div>
                    <div style={{fontSize:8,color:"#4A6080",letterSpacing:1}}>KCAL LEFT</div>
                  </div>
                </div>
                {[["Protein","#2979FF","195g","240g",81],["Carbs","#00E676","186g","320g",58],["Fat","#FFD740","47g","68g",69]].map(([n,c,v,t,p])=>(
                  <div key={n} style={{marginBottom:7}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:3}}><span style={{color:c,fontWeight:700}}>{n}</span><span style={{color:"#4A6080"}}>{v}/{t}</span></div>
                    <div style={{height:4,background:"#1C2A3A",borderRadius:2}}><div style={{height:"100%",width:`${p}%`,background:c,borderRadius:2}}/></div>
                  </div>
                ))}
                <div style={{marginTop:12,borderTop:"1px solid #111",paddingTop:10}}>
                  <div style={{fontSize:8,color:"#4A6080",letterSpacing:1,marginBottom:6}}>TODAY'S LOG</div>
                  {[["Greek Yogurt + Berries","🥣","312 kcal"],["Grilled Chicken Breast","🍗","280 kcal"],["Brown Rice + Broccoli","🍚","240 kcal"]].map(([food,e,cal])=>(
                    <div key={food} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,padding:"5px 8px",background:"#0D1828",borderRadius:7}}>
                      <div style={{fontSize:12}}>{e}</div>
                      <div style={{flex:1,fontSize:8,color:"#ccc"}}>{food}</div>
                      <div style={{fontSize:8,color:"#4A6080"}}>{cal}</div>
                    </div>
                  ))}
                </div>
              </div>
            )},
            {title:"Train Dashboard",sub:"Muscle map · Progressive overload · Auto rest timer",
             content:(
              <div style={{background:"#060D1A",padding:"16px 14px 14px",minHeight:480}}>
                <div style={{width:40,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 14px"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div><div style={{fontSize:9,color:"#4A6080",letterSpacing:1}}>MONDAY</div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Train 💪</div></div>
                  <div style={{background:"rgba(0,201,167,.1)",border:"1px solid rgba(0,201,167,.25)",borderRadius:20,padding:"4px 10px",fontSize:8,color:"#00C9A7",fontWeight:700}}>Push Day</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                  <div style={{background:"#0D1828",borderRadius:10,padding:8}}>
                    <div style={{fontSize:8,color:"#4A6080",marginBottom:6}}>TARGET MUSCLES</div>
                    {[["Chest","#E8185A"],["Shoulders","#E8185A"],["Triceps","#8B1A6B"]].map(([m,c])=>(
                      <div key={m} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:8,color:"#ccc"}}>{m}</span>
                        <span style={{fontSize:7,color:c,background:`${c}15`,borderRadius:4,padding:"1px 5px"}}>Optimal</span>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"#0D1828",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg viewBox="0 0 100 160" width="60" height="96">
                      <ellipse cx="50" cy="14" rx="14" ry="12" fill="#1C2A3A"/>
                      <rect x="44" y="24" width="12" height="7" fill="#1C2A3A"/>
                      <path d="M32,32 Q28,40 30,56 Q50,60 70,56 Q72,40 68,32 Z" fill="#E8185A" opacity="0.85"/>
                      <ellipse cx="26" cy="38" rx="9" ry="11" fill="#E8185A" opacity="0.8"/>
                      <ellipse cx="74" cy="38" rx="9" ry="11" fill="#E8185A" opacity="0.8"/>
                      <path d="M18,34 Q10,48 12,64" fill="none" stroke="#8B1A6B" strokeWidth="6" strokeLinecap="round"/>
                      <path d="M82,34 Q90,48 88,64" fill="none" stroke="#8B1A6B" strokeWidth="6" strokeLinecap="round"/>
                      <path d="M36,56 Q34,72 36,84 Q50,88 64,84 Q66,72 64,56 Z" fill="#1C2A3A"/>
                      <path d="M36,84 L30,140" fill="none" stroke="#1C2A3A" strokeWidth="10" strokeLinecap="round"/>
                      <path d="M64,84 L70,140" fill="none" stroke="#1C2A3A" strokeWidth="10" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
                <div style={{background:"#0D1828",borderRadius:10,padding:10,marginBottom:8}}>
                  <div style={{fontSize:8,color:"#4A6080",marginBottom:6}}>ACTIVE SESSION</div>
                  {[["Barbell Bench Press","4×8 · 185 lbs","↑ +5 from last"],["Incline DB Press","3×10 · 65 lbs","PR ⚡"],["Cable Fly","3×12 · 40 lbs",""]].map(([ex,detail,note])=>(
                    <div key={ex} style={{display:"flex",justifyContent:"space-between",marginBottom:6,paddingBottom:5,borderBottom:"1px solid #111"}}>
                      <div><div style={{fontSize:8,color:"#ccc",fontWeight:600}}>{ex}</div><div style={{fontSize:7,color:"#00C9A7"}}>{note||detail}</div></div>
                      <div style={{fontSize:8,color:"#888"}}>{detail.split("·")[0]}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(0,201,167,.08)",border:"1px solid rgba(0,201,167,.2)",borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:9,color:"#00C9A7",fontWeight:700}}>REST TIMER</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:24,fontWeight:900,color:"#00C9A7"}}>1:32</div>
                </div>
              </div>
            )},
            {title:"Restaurant AI",sub:"Describe your city · Get exact orders · Hit your macros",
             content:(
              <div style={{background:"#060D1A",padding:"16px 14px 14px",minHeight:480}}>
                <div style={{width:40,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 14px"}}/>
                <div style={{fontSize:9,color:"#4A6080",letterSpacing:1,marginBottom:4}}>NEARBY EATS</div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:10}}>What to order 🍗</div>
                <div style={{background:"#0D1828",border:"1px solid #1C2A3A",borderRadius:10,padding:"10px",marginBottom:8}}>
                  <div style={{fontSize:8,color:"#4A6080",marginBottom:6}}>YOUR REMAINING MACROS</div>
                  <div style={{display:"flex",gap:12,justifyContent:"space-between"}}>
                    {[["412","kcal","#fff"],["38g","protein","#2979FF"],["45g","carbs","#00E676"],["9g","fat","#FFD740"]].map(([v,l,c])=>(
                      <div key={l} style={{textAlign:"center"}}>
                        <div style={{fontSize:16,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                        <div style={{fontSize:7,color:"#4A6080",marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:"#0D1828",border:"1px solid #1C2A3A",borderRadius:10,padding:"10px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:11,color:"#ccc"}}>📍 Edinburg, TX</div>
                  <div style={{fontSize:9,color:"#2979FF",fontWeight:700}}>Find meals →</div>
                </div>
                <div style={{background:"#0D1828",border:"1px solid #1C2A3A",borderRadius:10,padding:"12px"}}>
                  <div style={{fontSize:8,color:"#2979FF",fontWeight:700,letterSpacing:1,marginBottom:10}}>🤖 AI RECOMMENDATIONS</div>
                  {[
                    ["Chick-fil-A","Grilled Chicken Sandwich (no sauce) + Side Salad","~390 kcal · P:40g · C:42g · F:8g"],
                    ["Chipotle","Burrito Bowl · chicken + fajita veggies + salsa · no rice","~405 kcal · P:36g · C:44g · F:9g"],
                    ["Home meal","6oz grilled chicken + 1 cup rice + broccoli","~420 kcal · P:42g · C:48g · F:7g"],
                  ].map(([name,order,macros],i)=>(
                    <div key={i} style={{marginBottom:i<2?10:0,paddingBottom:i<2?10:0,borderBottom:i<2?"1px solid #1C2A3A":"none"}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#fff",marginBottom:2}}>{i+1}. {name}</div>
                      <div style={{fontSize:9,color:"#888",marginBottom:2,lineHeight:1.4}}>{order}</div>
                      <div style={{fontSize:8,color:"#4A6080"}}>{macros}</div>
                    </div>
                  ))}
                </div>
              </div>
            )},
            {title:"Lift Smarter",sub:"6 splits · Arnold · GVT · matched to your schedule",
             content:(
              <div style={{background:"#060D1A",padding:"16px 14px 14px",minHeight:480}}>
                <div style={{width:40,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 14px"}}/>
                <div style={{fontSize:9,color:"#4A6080",letterSpacing:1,marginBottom:4}}>LIFT SMARTER</div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:12}}>Choose your split</div>
                <div style={{fontSize:8,color:"#4A6080",marginBottom:10}}>Based on 6 days/week · Intermediate</div>
                {[
                  {id:"ppl",l:"Push / Pull / Legs",e:"🔄",rec:true,desc:"Each muscle 2x/week · Optimal frequency",days:"6 days"},
                  {id:"arnold",l:"Arnold Split",e:"🏆",rec:false,desc:"Arnold's 6-day double split · Max volume",days:"6 days"},
                  {id:"ul",l:"Upper / Lower",e:"⬆️",rec:false,desc:"2 upper + 2 lower · Balanced strength",days:"4 days"},
                ].map(s=>(
                  <div key={s.id} style={{background:s.rec?"rgba(41,121,255,.08)":"#0D1828",border:`1px solid ${s.rec?"rgba(41,121,255,.3)":"#1C2A3A"}`,borderRadius:10,padding:"10px",marginBottom:7,position:"relative"}}>
                    {s.rec&&<div style={{position:"absolute",top:-7,left:10,background:"#2979FF",color:"#fff",fontSize:7,fontWeight:800,padding:"2px 7px",borderRadius:5}}>⭐ RECOMMENDED</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:14}}>{s.e}</span>
                        <span style={{fontSize:10,fontWeight:700,color:s.rec?"#2979FF":"#ccc"}}>{s.l}</span>
                      </div>
                      <span style={{fontSize:7,color:"#4A6080",background:"#1C2A3A",borderRadius:5,padding:"2px 6px"}}>{s.days}</span>
                    </div>
                    <div style={{fontSize:8,color:"#4A6080"}}>{s.desc}</div>
                  </div>
                ))}
                <div style={{background:"rgba(255,215,64,.06)",border:"1px solid rgba(255,215,64,.2)",borderRadius:10,padding:"10px",marginTop:4}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:9,color:"#FFD740",fontWeight:700}}>💀 GVT Weeks</div><div style={{fontSize:7,color:"#4A6080",marginTop:2}}>10×10 every 4th week · Auto-scheduled</div></div>
                    <div style={{width:32,height:18,borderRadius:9,background:"#FFD740",position:"relative"}}><div style={{position:"absolute",top:2,right:2,width:14,height:14,borderRadius:"50%",background:"#000"}}/></div>
                  </div>
                </div>
              </div>
            )},
            {title:"Progress Tracking",sub:"Program progress · PR tracker · Weight trend",
             content:(
              <div style={{background:"#060D1A",padding:"16px 14px 14px",minHeight:480}}>
                <div style={{width:40,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 14px"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div><div style={{fontSize:9,color:"#4A6080",letterSpacing:1}}>WEEK 4 OF 12</div><div style={{fontSize:15,fontWeight:800,color:"#fff"}}>Progress 📈</div></div>
                  <div style={{background:"rgba(255,215,64,.1)",border:"1px solid rgba(255,215,64,.25)",borderRadius:20,padding:"4px 10px",fontSize:8,color:"#FFD740",fontWeight:700}}>PPL Split</div>
                </div>
                <div style={{background:"#0D1828",borderRadius:10,padding:10,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:9,color:"#888"}}>Program progress</span><span style={{fontSize:9,color:"#FFD740",fontWeight:700}}>33%</span></div>
                  <div style={{height:5,background:"#1C2A3A",borderRadius:3,marginBottom:6}}><div style={{height:"100%",width:"33%",background:"linear-gradient(90deg,#2979FF,#FFD740)",borderRadius:3}}/></div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:"#4A6080"}}>
                    <span>Week 1</span><span style={{color:"#FFD740"}}>Week 4 ←</span><span>Week 12</span>
                  </div>
                </div>
                <div style={{background:"#0D1828",borderRadius:10,padding:10,marginBottom:10}}>
                  <div style={{fontSize:8,color:"#4A6080",marginBottom:8}}>PERSONAL RECORDS</div>
                  {[["Bench Press","225","↑ +20 lbs"],["Squat","315","↑ +35 lbs"],["Deadlift","365","↑ +40 lbs"]].map(([l,w,n])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                      <div><div style={{fontSize:8,color:"#ccc"}}>{l}</div><div style={{fontSize:7,color:"#00E676"}}>{n}</div></div>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:"#fff"}}>{w}<span style={{fontSize:8,color:"#4A6080"}}> lbs</span></div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#0D1828",borderRadius:10,padding:10}}>
                  <div style={{fontSize:8,color:"#4A6080",marginBottom:6}}>WEIGHT TREND</div>
                  <svg width="100%" height="44" viewBox="0 0 220 44">
                    <path d="M0,36 L55,30 L110,24 L165,18 L220,12" fill="none" stroke="#2979FF" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
                    <path d="M0,36 L55,32 L110,27 L165,23" fill="none" stroke="#00E676" strokeWidth="2" strokeLinecap="round"/>
                    {[[0,36],[55,32],[110,27],[165,23]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="3" fill="#00E676"/>))}
                  </svg>
                  <div style={{display:"flex",gap:12,marginTop:3}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:2,background:"#2979FF",opacity:.5}}/><span style={{fontSize:7,color:"#4A6080"}}>Projected</span></div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:2,background:"#00E676"}}/><span style={{fontSize:7,color:"#4A6080"}}>Actual</span></div>
                  </div>
                </div>
              </div>
            )},
            {title:"TDEE & Macros",sub:"25 data points · Katch-McArdle · Fully personalized",
             content:(
              <div style={{background:"#060D1A",padding:"16px 14px 14px",minHeight:480}}>
                <div style={{width:40,height:4,background:"#1C2A3A",borderRadius:2,margin:"0 auto 14px"}}/>
                <div style={{fontSize:9,color:"#4A6080",letterSpacing:1,marginBottom:4}}>YOUR METABOLISM</div>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",marginBottom:14}}>TDEE Breakdown</div>
                <div style={{textAlign:"center",marginBottom:14}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:52,fontWeight:900,color:"#2979FF",lineHeight:1}}>2,847</div>
                  <div style={{fontSize:9,color:"#4A6080"}}>kcal/day to maintain weight</div>
                </div>
                {[
                  {l:"Base BMR",v:1842,pct:65,c:"#2979FF",note:"Mifflin-St Jeor + body fat adjusted"},
                  {l:"Activity",v:712,pct:25,c:"#00E676",note:"6-10k steps + 4 training days/week"},
                  {l:"TEF",v:293,pct:10,c:"#FFD740",note:"Thermic effect of food"},
                ].map(({l,v,pct,c,note})=>(
                  <div key={l} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <div><div style={{fontSize:9,fontWeight:700,color:"#ccc"}}>{l}</div><div style={{fontSize:7,color:"#4A6080"}}>{note}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:7,color:"#4A6080"}}>kcal</div></div>
                    </div>
                    <div style={{height:4,background:"#1C2A3A",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:2}}/></div>
                  </div>
                ))}
                <div style={{background:"rgba(0,230,118,.06)",border:"1px solid rgba(0,230,118,.15)",borderRadius:10,padding:"10px",marginTop:8}}>
                  <div style={{fontSize:8,color:"#00E676",fontWeight:700,marginBottom:4}}>🎯 Your cutting target</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,color:"#00E676"}}>2,347 <span style={{fontSize:12,color:"#4A6080",fontWeight:400}}>kcal/day</span></div>
                  <div style={{fontSize:8,color:"#4A6080",marginTop:2}}>−500 kcal deficit · ~1 lb/week fat loss</div>
                </div>
              </div>
            )},
          ].map((screen,i)=>(
            <div key={i} className="snap-child" style={{width:240}}>
              <div style={{background:"#0A1424",border:"1px solid #1C1C2E",borderRadius:32,overflow:"hidden",boxShadow:"0 20px 40px rgba(0,0,0,.6)"}}>
                {screen.content}
              </div>
              <div style={{textAlign:"center",marginTop:14,padding:"0 8px"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:3}}>{screen.title}</div>
                <div style={{fontSize:11,color:"#4A6080",lineHeight:1.5}}>{screen.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#333"}}>← Scroll to see all screens →</div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:"80px 24px",background:"#060D1A"}}>
        <div style={{textAlign:"center",marginBottom:64,maxWidth:1100,margin:"0 auto 64px"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Simple by design</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(44px,6vw,80px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
            THREE STEPS.<br/><span style={{color:"#2979FF"}}>ONE SYSTEM.</span>
          </div>
          <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"0 auto",lineHeight:1.65}}>No spreadsheets. No manual calculations. Coach Macro figures it out.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:2,maxWidth:1100,margin:"0 auto",background:"#142238",border:"1px solid #1C1C1C",borderRadius:20,overflow:"hidden"}}>
          {[
            {n:"01",color:"#2979FF",title:"Build your profile",sub:"3 minutes",
             desc:"Answer 25 questions about your body, lifestyle, and goals. We calculate your exact metabolic rate using Katch-McArdle — 5-8% more accurate than standard equations.",
             details:["Body stats + body fat estimate","Job, steps, sleep quality","Training frequency and intensity","Goal + timeline + the why"]},
            {n:"02",color:"#00E676",title:"App adapts daily",sub:"Every morning",
             desc:"Your macro targets change every day based on what's scheduled. Training day? Carbs go up. Rest day? Budget drops. Worked out extra? Budget adjusts automatically.",
             details:["Training days get more carbs","Rest days reduce total budget","Workout calories added in real-time","Sleep and recovery factored in"]},
            {n:"03",color:"#FFD740",title:"Track everything",sub:"In one place",
             desc:"Log food by describing it in plain English, scanning a barcode, or letting our restaurant AI build your order. Every set logged, every rep counted, every PR tracked.",
             details:["AI food logging — just describe it","Barcode scanner — 3M+ products","Restaurant AI — exact menu orders","Progressive overload auto-tracked"]},
          ].map(({n,color,title,sub,desc,details})=>(
            <div key={n} style={{background:"#080F1A",padding:"48px 40px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-20,right:-20,fontFamily:"'Barlow Condensed',sans-serif",fontSize:120,fontWeight:900,color:`${color}06`,lineHeight:1,userSelect:"none"}}>{n}</div>
              <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:48,height:48,borderRadius:12,background:`${color}15`,border:`1px solid ${color}30`,marginBottom:20}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color}}>{n}</div>
              </div>
              <div style={{fontSize:10,color,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>{sub}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,color:"#fff",lineHeight:1,marginBottom:14}}>{title}</div>
              <p style={{fontSize:14,color:"#666",lineHeight:1.75,marginBottom:20}}>{desc}</p>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {details.map(d=>(<div key={d} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#888"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:color,flexShrink:0}}/>
                  {d}
                </div>))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COMPETITOR COMPARISON */}
      <section style={{padding:"80px 24px",background:"#04080F"}}>
        <div style={{textAlign:"center",marginBottom:48,maxWidth:1100,margin:"0 auto 48px"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Honest comparison</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(40px,5.5vw,72px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
            HOW WE STACK UP<br/><span style={{color:"#2979FF"}}>AGAINST THE REST.</span>
          </div>
        </div>
        <div style={{maxWidth:1000,margin:"0 auto",overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:640}}>
            <thead>
              <tr>
                <th style={{padding:"14px 20px",textAlign:"left",fontSize:11,color:"#4A6080",fontWeight:700,letterSpacing:2,textTransform:"uppercase",background:"#080F1A",borderBottom:"1px solid #1C1C1C"}}>Feature</th>
                {[["MyFitnessPal","#888","#fff"],["MacroFactor","#888","#fff"],["Cronometer","#888","#fff"],["Coach Macro","#2979FF","#060D1A"]].map(([name,tc,bg])=>(
                  <th key={name} style={{padding:"14px 16px",textAlign:"center",fontSize:12,color:tc,fontWeight:800,background:bg==="#060D1A"?"#060D1A":"#fff",borderBottom:`1px solid ${bg==="#060D1A"?"#1C2A4A":"#E5E5E5"}`,borderLeft:"1px solid #1C1C1C"}}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Dynamic macros (train vs rest days)","❌","❌","❌","✅"],
                ["Workout tracking built in","❌","❌","❌","✅"],
                ["Workouts earn extra calories","❌","❌","❌","✅"],
                ["Restaurant AI (exact orders)","❌","❌","❌","✅"],
                ["Muscle volume optimization","❌","❌","❌","✅"],
                ["Progressive overload tracking","❌","❌","❌","✅"],
                ["Hyrox programming","❌","❌","❌","✅"],
                ["AI food logging (plain English)","❌","❌","❌","✅"],
                ["Split recommendation by days/week","❌","❌","❌","✅"],
                ["GVT periodization built in","❌","❌","❌","✅"],
                ["Barcode scanner","✅","✅","✅","✅"],
                ["Macro tracking","✅","✅","✅","✅"],
                ["Free trial","✅","✅","❌","✅"],
              ].map(([feature,...vals],ri)=>(
                <tr key={feature} style={{borderBottom:"1px solid #111"}}>
                  <td style={{padding:"12px 20px",fontSize:13,color:"#888",background:"#080F1A"}}>{feature}</td>
                  {vals.map((v,ci)=>(
                    <td key={ci} style={{padding:"12px 16px",textAlign:"center",fontSize:15,background:ci===3?"#060D1A":"#fff",borderLeft:"1px solid #1C1C1C",color:ci===3?(v==="✅"?"#2979FF":"#333"):(v==="✅"?"#1C2A3A":"#ccc"),fontWeight:v==="✅"?"700":"400"}}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"#333",marginTop:20,maxWidth:600,margin:"16px auto 0"}}>Based on publicly available feature information as of 2026. All trademarks are property of their respective owners.</p>
      </section>

      {/* FAQ */}
      <section style={{padding:"80px 24px",background:"#060D1A"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Got questions</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(44px,6vw,80px)",fontWeight:900,fontStyle:"italic",lineHeight:.9}}>
            FREQUENTLY<br/><span style={{color:"#2979FF"}}>ASKED.</span>
          </div>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",flexDirection:"column",gap:0}}>
          {[
            {q:"Is this just for bodybuilders?",a:"Not at all. Coach Macro works for anyone with a physical goal — cutting, bulking, maintaining, running a 5K, training for Hyrox, or just eating better. The onboarding builds a plan around what you actually do, not a generic template."},
            {q:"What makes the macros 'dynamic'?",a:"Most apps give you the same numbers every day. Coach Macro changes your targets every morning based on what's scheduled. Training day? You get more carbs to fuel performance and recovery. Rest day? Budget drops. Do an extra workout? Your calories adjust in real-time."},
            {q:"Do I need to count every calorie perfectly?",a:"No. The AI food logging lets you describe meals in plain English — 'a big bowl of pasta with chicken and olive oil' — and it estimates the macros. It's not perfect but it's fast, and consistent logging beats perfect logging every time."},
            {q:"What is the 7-day free trial?",a:"You get full access to everything for 7 days. No credit card required to start. If you want to keep using it after day 7, you choose a plan. If not, you walk away and owe nothing."},
            {q:"Does it work for running and Hyrox?",a:"Yes. Coach Macro has structured run plans (5K through marathon), a full 12-week Hyrox prep program with race simulations, and hybrid templates that mix lifting and running. Your nutrition adjusts based on whether it's a run day or a lift day."},
            {q:"Can I use it without going to a gym?",a:"Yes. Equipment options include full gym, home gym, dumbbells only, and bodyweight only. The workout builder substitutes exercises based on what you have access to."},
            {q:"What happens to my data if I cancel?",a:"Your data stays in your account for 30 days after cancellation. You can export or delete it at any time. We don't sell your data to anyone."},
            {q:"How is this different from MyFitnessPal?",a:"MyFitnessPal tracks food. That's it. Coach Macro tracks food AND workouts, and makes them talk to each other. Your workout earns calories. Your training schedule changes your macros. It's one system instead of two apps that never communicate."},
          ].map(({q,a},i)=>(<FAQItem key={i} q={q} a={a}/>))}
        </div>
      </section>

            {/* INTEGRATIONS */}
      <section style={{padding:"64px 24px",background:"#060D1A"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:4,textTransform:"uppercase",color:"#4A4A4A",marginBottom:14}}>Connect</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(40px,6vw,72px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
            EVERY WORKOUT<br/><span style={{color:"#2979FF"}}>EARNS CALORIES.</span>
          </div>
          <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"0 auto",lineHeight:1.65}}>Burned calories flow straight into your Fuel budget. Connect once, syncs automatically.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,maxWidth:1100,margin:"0 auto"}}>
          {[["🟠","Strava","Runs · Rides · Workouts","Live API Sync"],["🍎","Apple Health","Workouts · Steps · Sleep","Import"],["⌚","Garmin Connect","Activities · HR · Pace","Import"],["💜","Fitbit","Workouts · Steps","Import"]].map(([icon,name,sub,badge])=>(
            <div key={name} style={{background:"#0A1220",border:"1px solid #1C1C1C",borderRadius:14,padding:22}}>
              <div style={{fontSize:26,marginBottom:10}}>{icon}</div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:3,color:"#fff"}}>{name}</div>
              <div style={{fontSize:12,color:"#666",marginBottom:8}}>{sub}</div>
              <div style={{display:"inline-block",fontSize:9,fontWeight:700,letterSpacing:1,color:"#00E676",background:"rgba(0,230,118,.08)",border:"1px solid rgba(0,230,118,.15)",borderRadius:20,padding:"3px 10px"}}>{badge}</div>
            </div>
          ))}
        </div>
      </section>

            {/* PRICING */}
      <section style={{padding:"64px 24px",textAlign:"center",background:"#04080F"}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:"clamp(48px,6vw,80px)",fontWeight:900,fontStyle:"italic",lineHeight:.9,marginBottom:16}}>
          START FREE.<br/><span style={{color:"#2979FF"}}>STAY BECAUSE IT WORKS.</span>
        </div>
        <p style={{fontSize:16,color:"#666",maxWidth:480,margin:"0 auto 48px",lineHeight:1.65}}>7 days free. No credit card required. Cancel before day 8 and pay nothing.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,maxWidth:760,margin:"0 auto"}}>
          {[{t:"Monthly",p:"$4.99",per:"/mo",s:"billed monthly",note:"Today: $0.00",featured:false},
            {t:"Yearly",p:"$19.99",per:"/yr",s:"$1.67/month · 67% off",note:"Today: $0.00",featured:true}
          ].map(({t,p,per,s,note,featured})=>(
            <div key={t} style={{background:featured?"#050A14":"#0A1220",border:`1.5px solid ${featured?"rgba(41,121,255,.3)":"#142238"}`,borderRadius:18,padding:"36px 32px",position:"relative"}}>
              {featured&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#2979FF",color:"#fff",fontSize:9,fontWeight:800,padding:"4px 14px",borderRadius:9,letterSpacing:1.5,whiteSpace:"nowrap"}}>BEST VALUE</div>}
              <div style={{fontSize:10,color:"#4A4A4A",fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:14}}>{t}</div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:68,fontWeight:900,lineHeight:1,letterSpacing:-2,color:featured?"#2979FF":"#fff",marginBottom:4}}>{p}<span style={{fontSize:22,fontWeight:400,color:"#4A4A4A"}}>{per}</span></div>
              <div style={{fontSize:13,color:"#4A4A4A",marginBottom:6}}>{s}</div>
              <div style={{fontSize:13,color:"#00E676",fontWeight:700,marginBottom:24}}>{note} — 7 days free</div>
              <button onClick={onSignUp} style={{display:"block",width:"100%",textAlign:"center",padding:"15px",borderRadius:10,fontWeight:700,fontSize:15,cursor:"pointer",border:"none",fontFamily:"'Inter',sans-serif",background:featured?"#2979FF":"#142238",color:"#fff"}}>Start Free Trial →</button>
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
        <div style={{fontSize:13,color:"#142238",marginTop:14}}>No credit card · Free trial · Cancel anytime</div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid #1C1C1C",padding:"28px 24px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Logo size={22} text={true}/>
        </div>
        <div style={{fontSize:12,color:"#142238"}}>© 2026 Coach Macro. All rights reserved.</div>
      </footer>
    </div>
  );
}
