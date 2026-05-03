import React, { useState, useEffect, useRef } from "react";
import { T, GLOBAL_CSS, WDAYS, DAY_CFG, FASTING_PROTOCOLS,
  Ring, MacroRing, MacroBar, PrimaryBtn, SectionCard, Spinner, Logo, FAQItem,
  hap, calcTDEE } from "./components.jsx";

export function FuelSection({log,macros,consumed,remaining,cfg,todayType,todayFocus,earnedCals,todayActs,fuelScreen,setFuelScreen,foodInput,setFoodInput,logging,logMsg,aiLog,logMode,setLogMode,barcodeInput,setBarcodeInput,barcodeResult,barcodeLoading,scanBarcode,addBarcode,quickFields,setQF,addQuick,removeLog,recs,recsLoading,fetchRecs,recipes,recipesLoading,fetchRecipes,fastProto,setFastProto,fastActive,setFastActive,fastStart,setFastStart,fastCustomH,setFastCustomH,fastHours,fastElapsed,fastPct,fastRemaining,eatOpen,city,setCity,isMobile}) {

  const FUEL_TABS=[{id:"home",label:"Home"},{id:"log",label:"Log Food"},{id:"recs",label:"Restaurants"},{id:"recipes",label:"Recipes"},{id:"fast",label:"Fasting"}];
  const pad2=n=>String(Math.max(0,Math.floor(n))).padStart(2,"0");

  return (
    <div style={{paddingBottom:isMobile?20:0}}>
      {/* Sub-nav */}
      <div style={{display:"flex",gap:4,padding:isMobile?"12px 18px 0":"0 0 20px",overflowX:"auto",flexShrink:0}}>
        {FUEL_TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setFuelScreen(tab.id)}
            style={{padding:"8px 16px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",background:fuelScreen===tab.id?T.prot:"none",
              color:fuelScreen===tab.id?"#fff":T.mu,fontSize:13,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s",flexShrink:0}}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{padding:isMobile?"12px 18px":"0"}}>

        {/* ── HOME ── */}
        {fuelScreen==="home"&&(
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* MAIN CARD — ring + macros */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"18px 16px":"24px 28px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,borderRadius:"50%",background:`radial-gradient(circle,${cfg.color}10,transparent 70%)`,pointerEvents:"none"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>{todayType} day</div>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:28,fontWeight:900,lineHeight:1}}>Fuel {cfg.emoji}</div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {earnedCals>0&&<div style={{background:`${cfg.color}15`,border:`1px solid ${cfg.color}35`,borderRadius:20,padding:"6px 14px",fontSize:11,color:cfg.color,fontWeight:700}}>+{earnedCals} earned 🔥</div>}
                  <div style={{background:`${cfg.color}12`,border:`1px solid ${cfg.color}30`,borderRadius:20,padding:"6px 14px",fontSize:11,color:cfg.color,fontWeight:700}}>{cfg.emoji} {todayFocus}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:isMobile?16:32}}>
                <div style={{position:"relative",flexShrink:0}}>
                  <MacroRing protein={consumed.protein} carbs={consumed.carbs} fat={consumed.fat} pTarget={macros.protein} cTarget={macros.carbs} fTarget={macros.fat} size={isMobile?150:180} sw={13}/>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none"}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:isMobile?34:40,lineHeight:1,color:remaining.calories<0?"#FF4D6D":"#fff"}}>{remaining.calories}</div>
                    <div style={{color:T.mu,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:2}}>kcal left</div>
                    <div style={{color:T.mu,fontSize:9,marginTop:3}}>{macros.calories} budget</div>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                    {[["Budget",macros.calories,"#fff"],["Eaten",consumed.calories,cfg.color]].map(([l,v,c])=>(
                      <div key={l} style={{background:T.s2,borderRadius:12,padding:"10px 14px"}}>
                        <div style={{fontSize:9,color:T.mu,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>{l}</div>
                        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                        <div style={{fontSize:9,color:T.mu,marginTop:2}}>kcal</div>
                      </div>
                    ))}
                  </div>
                  <MacroBar label="Protein" consumed={consumed.protein} target={macros.protein} color={T.prot}/>
                  <MacroBar label="Carbs"   consumed={consumed.carbs}   target={macros.carbs}   color={T.carb}/>
                  <MacroBar label="Fat"     consumed={consumed.fat}     target={macros.fat}     color={T.fat}/>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[["+ Food",()=>setFuelScreen("log"),T.prot,"🧠"],["Restaurants",()=>setFuelScreen("recs"),T.carb,"🍗"],["Recipes",()=>setFuelScreen("recipes"),T.fat,"👨‍🍳"],["Fasting",()=>setFuelScreen("fast"),"#9B59FF","⏱️"]].map(([l,fn,c,e])=>(
                <button key={l} onClick={fn} style={{padding:"14px 6px",background:T.s1,border:`1px solid ${T.bd}`,borderRadius:14,cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{e}</div>
                  <div style={{color:c,fontSize:10,fontWeight:700}}>{l}</div>
                </button>
              ))}
            </div>

            {/* FOOD LOG */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:20,padding:isMobile?"16px":"20px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700}}>Today&apos;s Log</div>
                <button onClick={()=>setFuelScreen("log")} style={{background:T.prot,color:T.white,border:"none",borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:0.5}}>+ Add Food</button>
              </div>
              {log.length===0
                ?<div style={{textAlign:"center",padding:"28px 0",color:T.mu,border:`1px dashed ${T.bd}`,borderRadius:12}}>
                  <div style={{fontSize:32,marginBottom:8}}>🍽️</div>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>Nothing logged yet</div>
                  <div style={{fontSize:11,color:T.dim}}>Describe a meal, scan a barcode, or use the restaurant finder</div>
                </div>
                :<div>
                  {log.slice(0,8).map((item,i)=>(
                    <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<Math.min(log.length,8)-1?`1px solid ${T.dim}`:""}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                        <div style={{width:34,height:34,borderRadius:10,background:T.s2,border:`1px solid ${T.bd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{item.method==="barcode"?"📷":item.method==="quick"?"✏️":"🧠"}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:600,textTransform:"capitalize",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.food||item.name}</div>
                          <div style={{fontSize:10,color:T.mu,marginTop:2}}>
                            <span style={{color:T.prot}}>P:{item.protein}g</span> · <span style={{color:T.carb}}>C:{item.carbs}g</span> · <span style={{color:T.fat}}>F:{item.fat}g</span>
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,fontWeight:900,color:"#fff"}}>{item.calories}</div>
                          <div style={{fontSize:9,color:T.mu}}>kcal</div>
                        </div>
                        <button onClick={()=>removeLog(item.id)} style={{background:T.s2,border:`1px solid ${T.bd}`,color:T.mu,cursor:"pointer",fontSize:13,padding:"4px 8px",borderRadius:6}}>×</button>
                      </div>
                    </div>
                  ))}
                  {log.length>8&&<div style={{fontSize:12,color:T.mu,textAlign:"center",marginTop:10,paddingTop:10,borderTop:`1px solid ${T.dim}`}}>+{log.length-8} more entries</div>}
                </div>
              }
            </div>
          </div>
        )}

        {/* ── LOG FOOD ── */}
        {fuelScreen==="log"&&(
          <div style={{maxWidth:isMobile?"100%":600}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>LOG FOOD</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>3 ways to track what you eat</p>
            <div style={{display:"flex",background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:3,gap:3,marginBottom:18}}>
              {[["ai","🧠 AI"],["barcode","📷 Barcode"],["quick","✏️ Quick"]].map(([k,l])=>(
                <button key={k} onClick={()=>setLogMode(k)} style={{flex:1,padding:"9px 4px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",background:logMode===k?`${T.prot}18`:"none",outline:logMode===k?`1.5px solid ${T.prot}`:"none",color:logMode===k?T.prot:T.mu,fontSize:12,fontWeight:700}}>{l}</button>
              ))}
            </div>
            {logMode==="ai"&&<>
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                <textarea value={foodInput} onChange={e=>setFoodInput(e.target.value)} placeholder="Describe your meal... e.g. grilled chicken 6oz, brown rice 1 cup, steamed broccoli" style={{width:"100%",background:"none",border:"none",color:"#fff",fontSize:14,resize:"none",outline:"none",minHeight:80,fontFamily:"inherit",boxSizing:"border-box",lineHeight:1.6}}/>
              </div>
              {logMsg&&<div style={{background:`${T.prot}12`,border:`1px solid ${T.prot}30`,borderRadius:9,padding:"8px 12px",fontSize:12,color:T.prot,marginBottom:10}}>{logMsg}</div>}
              <PrimaryBtn onClick={aiLog} label={logging?"Analyzing…":"Add to Log →"} disabled={logging||!foodInput.trim()}/>
            </>}
            {logMode==="barcode"&&<>
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:10}}>
                <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:8}}>Barcode number</div>
                <input value={barcodeInput} onChange={e=>setBarcodeInput(e.target.value)} placeholder="e.g. 0070038642824" style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"11px 13px",color:"#fff",fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",letterSpacing:1}}/>
                <div style={{fontSize:10,color:T.mu,marginTop:7}}>Tip: Use your phone camera app to scan — it shows the barcode number. Paste it here.</div>
              </div>
              {barcodeResult&&<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"14px",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:3}}>{barcodeResult.name}</div>
                {barcodeResult.brand&&<div style={{fontSize:11,color:T.mu,marginBottom:8}}>{barcodeResult.brand} · {barcodeResult.serving}</div>}
                <div style={{display:"flex",gap:14,marginBottom:12}}>
                  {[["Cal",barcodeResult.calories,""],["P",barcodeResult.protein,"g"],["C",barcodeResult.carbs,"g"],["F",barcodeResult.fat,"g"]].map(([l,v,u])=>(<div key={l}><div style={{fontSize:9,color:T.mu,textTransform:"uppercase",letterSpacing:1}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:T.prot}}>{v}{u}</div></div>))}
                </div>
                <PrimaryBtn onClick={addBarcode} label="Add to Log →"/>
              </div>}
              {barcodeLoading&&<div style={{textAlign:"center",padding:"16px",color:T.mu,fontSize:13}}>Looking up product…</div>}
              <PrimaryBtn onClick={scanBarcode} label="Look Up Barcode →" disabled={barcodeLoading||!barcodeInput.trim()}/>
            </>}
            {logMode==="quick"&&<>
              <div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:12,padding:"16px",marginBottom:14}}>
                {[["Name (optional)","text","name","e.g. Protein shake"],["Calories","number","calories","0"],["Protein (g)","number","protein","0"],["Carbs (g)","number","carbs","0"],["Fat (g)","number","fat","0"]].map(([l,t,k,ph])=>(
                  <div key={k} style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:T.mu,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{l}</div>
                    <input type={t} value={quickFields[k]} onChange={e=>setQF(q=>({...q,[k]:e.target.value}))} placeholder={ph} style={{width:"100%",background:T.s3,border:`1px solid ${T.bd}`,borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                  </div>
                ))}
              </div>
              <PrimaryBtn onClick={addQuick} label="Add Entry →" disabled={!quickFields.calories}/>
            </>}
          </div>
        )}

        {/* ── RESTAURANTS ── */}
        {fuelScreen==="recs"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:36,fontWeight:900,marginBottom:4}}>NEARBY EATS 🍗</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:16}}>AI finds exact orders at real restaurants to hit your remaining macros</p>

            {/* Remaining macros strip */}
            <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px 20px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:4}}>Remaining today</div>
                <div style={{display:"flex",gap:20}}>
                  {[["kcal",remaining.calories,"#fff"],["protein",`${remaining.protein}g`,T.prot],["carbs",`${remaining.carbs}g`,T.carb],["fat",`${remaining.fat}g`,T.fat]].map(([l,v,c])=>(
                    <div key={l}>
                      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,fontWeight:900,color:c,lineHeight:1}}>{v}</div>
                      <div style={{fontSize:9,color:T.mu,marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* City input */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:7}}>Your City</div>
              <div style={{display:"flex",gap:8}}>
                <input value={city} onChange={e=>setCity(e.target.value)} placeholder="e.g. Miami FL, Austin TX…" style={{flex:1,background:T.s2,border:`1px solid ${T.bd}`,borderRadius:10,padding:"12px 14px",color:"#fff",fontSize:14,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={fetchRecs} disabled={recsLoading||!city.trim()} style={{padding:"12px 20px",background:recsLoading?T.s3:T.prot,color:recsLoading?T.mu:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:recsLoading?"default":"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {recsLoading?"Finding…":"Find →"}
                </button>
              </div>
            </div>

            {/* Loading */}
            {recsLoading&&<div style={{textAlign:"center",padding:"48px 0",color:T.mu}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spinner/></div>
              <div style={{fontSize:13,marginBottom:4}}>Scanning nearby restaurants…</div>
              <div style={{fontSize:11,color:T.dim}}>Matching exact menu items to your macros</div>
            </div>}

            {/* Results — parse AI text into cards */}
            {recs&&!recsLoading&&(
              <div>
                <div style={{fontSize:10,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>🤖 AI Recommendations</div>
                <div style={{background:T.s1,border:`1px solid ${T.bd}`,borderRadius:16,padding:"16px",lineHeight:1.9,fontSize:14,color:"#ccc",whiteSpace:"pre-wrap"}}>{recs}</div>
                <button onClick={fetchRecs} style={{width:"100%",padding:"12px",background:T.s2,color:T.prot,fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.prot}25`,borderRadius:10,cursor:"pointer",marginTop:10,fontFamily:"inherit"}}>↺ Refresh Results</button>
              </div>
            )}

            {!recs&&!recsLoading&&(
              <div style={{textAlign:"center",padding:"40px 0",border:`1px dashed ${T.bd}`,borderRadius:16,color:T.mu}}>
                <div style={{fontSize:36,marginBottom:12}}>🍽️</div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Enter your city above</div>
                <div style={{fontSize:12,color:T.dim}}>We'll find exact menu items at nearby chains that hit your remaining macros</div>
              </div>
            )}
          </div>
        )}

        {/* ── RECIPES ── */}
        {fuelScreen==="recipes"&&(
          <div style={{maxWidth:isMobile?"100%":700}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>RECIPES</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:18}}>Simple home meals built around what macros you still need today</p>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[["Protein",`${remaining.protein}g`,T.prot],["Carbs",`${remaining.carbs}g`,T.carb],["Fat",`${remaining.fat}g`,T.fat]].map(([l,v,c])=>(
                <div key={l} style={{background:T.s2,border:`1px solid ${c}30`,borderRadius:10,padding:"12px 14px",flex:1}}>
                  <div style={{color:c,fontWeight:800,fontSize:18}}>{v}</div>
                  <div style={{color:T.mu,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginTop:3}}>{l} left</div>
                </div>
              ))}
            </div>
            {recipesLoading?<div style={{textAlign:"center",padding:"48px 0",color:T.mu}}><div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Spinner/></div><div style={{fontSize:13}}>Building your recipes…</div></div>
              :<div style={{background:T.s2,border:`1px solid ${T.bd}`,borderRadius:13,padding:"16px",lineHeight:1.85,fontSize:14,color:"#ccc",whiteSpace:"pre-wrap",minHeight:recipes?0:80}}>{recipes||<span style={{color:T.mu}}>Tap below to generate recipes</span>}</div>}
            <button onClick={fetchRecipes} style={{width:"100%",padding:"13px",background:T.s2,color:T.carb,fontSize:13,fontWeight:700,letterSpacing:1,textTransform:"uppercase",border:`1px solid ${T.carb}25`,borderRadius:11,cursor:"pointer",marginTop:10,fontFamily:"inherit"}}>{recipes?"↺ New Recipes":"Generate Recipes →"}</button>
          </div>
        )}

        {/* ── FASTING ── */}
        {fuelScreen==="fast"&&(
          <div style={{maxWidth:isMobile?"100%":560}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:32,fontWeight:900,marginBottom:4}}>FASTING</div>
            <p style={{fontSize:13,color:T.mu,marginBottom:20}}>Track your fasting window and eating schedule</p>
            <SectionCard title="Protocol">
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
                {FASTING_PROTOCOLS.map(p=>(<button key={p.id} onClick={()=>{setFastProto(p.id);if(fastActive)setFastActive(false);}} style={{padding:"9px 14px",borderRadius:9,border:`1.5px solid ${fastProto===p.id?T.prot:T.bd}`,background:fastProto===p.id?`${T.prot}15`:T.s3,color:fastProto===p.id?T.prot:T.mu,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{p.label}</button>))}
              </div>
              <div style={{fontSize:12,color:T.mu}}>{fastProto==="custom"?`${fastCustomH}h fast · ${24-fastCustomH}h eat`:FASTING_PROTOCOLS.find(p=>p.id===fastProto)?.desc}</div>
              {fastProto==="custom"&&<div style={{marginTop:12}}>
                <div style={{fontSize:10,color:T.prot,fontWeight:500,letterSpacing:"0.16em",textTransform:"uppercase",fontFamily:"'DM Mono',monospace",marginBottom:7}}>Fasting hours: {fastCustomH}h</div>
                <input type="range" min="12" max="23" value={fastCustomH} onChange={e=>{setFastCustomH(parseInt(e.target.value));hap();}} style={{width:"100%"}}/>
              </div>}
            </SectionCard>
            <div style={{textAlign:"center",margin:"20px 0"}}>
              <div style={{position:"relative",display:"inline-block"}}>
                <Ring value={fastElapsed} max={fastHours} color={eatOpen?T.carb:T.prot} size={180} sw={14}/>
                <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
                  {fastActive?(eatOpen?<><div style={{fontSize:13,color:T.carb,fontWeight:700,marginBottom:4}}>🎉 EAT NOW</div><div style={{fontWeight:900,fontSize:20,color:T.carb}}>Window Open</div></>:<><div style={{fontSize:11,color:T.mu,marginBottom:4}}>Fasting</div><div style={{fontWeight:900,fontSize:26,color:T.prot,fontVariantNumeric:"tabular-nums"}}>{pad2(fastRemaining/3600000)}:{pad2((fastRemaining%3600000)/60000)}:{pad2((fastRemaining%60000)/1000)}</div><div style={{fontSize:10,color:T.mu,marginTop:3}}>remaining</div></>):<><div style={{fontSize:11,color:T.mu,marginBottom:4}}>Ready to start</div><div style={{fontWeight:900,fontSize:26,color:T.mu}}>{fastHours}:00:00</div></>}
                </div>
              </div>
            </div>
            {!fastActive?<PrimaryBtn onClick={()=>{setFastActive(true);setFastStart(Date.now());hap();}} label="Start Fasting →"/>
              :<div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setFastActive(false);setFastStart(null);}} style={{flex:1,padding:"14px",background:T.s2,color:T.red,fontWeight:700,fontSize:13,border:`1px solid ${T.red}30`,borderRadius:11,cursor:"pointer",fontFamily:"inherit",textTransform:"uppercase"}}>End Fast</button>
                {eatOpen&&<button onClick={()=>{setFastActive(false);setFastStart(null);}} style={{flex:2,padding:"14px",background:T.green||"#22c55e",color:"#000",fontWeight:700,fontSize:15,border:"none",borderRadius:14,cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",textTransform:"uppercase",letterSpacing:1}}>Break Fast 🎉</button>}
              </div>}
          </div>
        )}

      </div>
    </div>
  );
}

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
