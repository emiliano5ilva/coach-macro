import React, { useState, useEffect } from "react";
import { T, Spinner, PrimaryBtn } from "./components.jsx";
import { sb } from "./client.js";
import { getCachedExerciseData } from "./services/exerciseMedia.js";
import { getExerciseData, getMuscleColor } from "./data/exerciseMuscleMap.js";

export const COACHING_CUES = {
  "Barbell Squat": {
    setup:          "Bar on upper traps. Feet shoulder-width. Toes slightly out.",
    cue:            "Chest up. Knees track over toes. Hit depth.",
    breathe:        "Big breath at top. Hold through the rep. Exhale at lockout.",
    common_mistake: "Knees caving in. Drive them out the entire rep.",
    feel:           "Quads and glutes — both should be burning.",
  },
  "Barbell Bench Press": {
    setup:          "Retract shoulder blades hard. Slight arch. Feet flat.",
    cue:            "Bar path: slight diagonal from chest to lockout over lower chest.",
    breathe:        "Breathe in at the top. Hold through. Exhale at lockout.",
    common_mistake: "Bouncing the bar off your chest. Control the descent.",
    feel:           "Chest, front delts, and triceps.",
  },
  "Deadlift": {
    setup:          "Bar over mid-foot. Hip-width stance. Grip just outside legs.",
    cue:            "Push the floor away — don't think about pulling the bar.",
    breathe:        "Big breath. Brace hard. Hold until bar is past your knees.",
    common_mistake: "Rounding lower back. Keep your chest up and proud.",
    feel:           "Hamstrings loading, back engaging, glutes at lockout.",
  },
  "Romanian Deadlift": {
    setup:          "Stand tall. Slight knee bend. Bar stays against your legs.",
    cue:            "Push hips back — not down. Feel the hamstring stretch.",
    breathe:        "Breathe in at top. Hold through the rep. Exhale on the way up.",
    common_mistake: "Squatting it. This is a hip hinge, not a squat.",
    feel:           "Deep stretch through the hamstrings on every rep.",
  },
  "Pull Up": {
    setup:          "Full dead hang. Shoulder-width or wider grip.",
    cue:            "Pull elbows down to your hips — not just pull your body up.",
    breathe:        "Exhale as you pull. Inhale on the controlled descent.",
    common_mistake: "Using momentum. Dead hang start on every single rep.",
    feel:           "Lats — not your biceps. If you feel it in your biceps, cue your elbows.",
  },
  "Overhead Press": {
    setup:          "Bar on front delts. Elbows slightly in front of the bar.",
    cue:            "Press in a straight line. Move your head back as bar passes your nose.",
    breathe:        "Breathe in before. Exhale hard at lockout.",
    common_mistake: "Leaning back excessively. Engage your core and glutes.",
    feel:           "Front and lateral delts, triceps, upper traps.",
  },
  "Barbell Row": {
    setup:          "Hinge to ~45°. Bar under shoulder blades. Overhand grip.",
    cue:            "Drive elbows past your hips. Row to your belly button.",
    breathe:        "Stay braced throughout. Breathe at the top.",
    common_mistake: "Using momentum. The bar should not bounce.",
    feel:           "Mid-back and lats. Squeeze hard at the top.",
  },
  "Lat Pulldown": {
    setup:          "Lean back slightly. Chest up. Grip just outside shoulder width.",
    cue:            "Pull your elbows straight down — not back.",
    breathe:        "Exhale as you pull. Inhale as you return.",
    common_mistake: "Pulling with arms only. Initiate with your lats depressing first.",
    feel:           "Lats — the sides of your back flaring out.",
  },
  "Incline Dumbbell Press": {
    setup:          "Bench at 30–45°. Dumbbells start at shoulder level.",
    cue:            "Press up and slightly in — controlled arc, not straight up.",
    breathe:        "Breathe in before. Exhale as you press.",
    common_mistake: "Flaring elbows 90° out. Keep them at ~45° to protect shoulders.",
    feel:           "Upper chest — the clavicular head of the pec.",
  },
  "Lateral Raise": {
    setup:          "Slight forward lean. Slight bend in elbows. Lead with your pinkies.",
    cue:            "Raise to shoulder height only. Pause. Slow descent.",
    breathe:        "Breathe freely — it's a lighter exercise.",
    common_mistake: "Using momentum and shrugging. Use lighter weight and control it.",
    feel:           "Side delts — the middle head of your shoulder.",
  },
  "Face Pull": {
    setup:          "Cable at face height or above. Rope attachment. Stand back.",
    cue:            "Pull to your face, elbows high, and externally rotate at the end.",
    breathe:        "Exhale as you pull. Inhale on return.",
    common_mistake: "Pulling to your neck instead of your face. Elbows must stay high.",
    feel:           "Rear delts and external rotators. Great for shoulder health.",
  },
  "Leg Press": {
    setup:          "Feet hip-width, mid-platform. Full range without lower back leaving seat.",
    cue:            "Push through your heels. Don't let knees cave.",
    breathe:        "Breathe in before lowering. Exhale as you push.",
    common_mistake: "Going too heavy with partial reps. Full range > more weight.",
    feel:           "Quads primarily. Higher foot placement adds hamstrings and glutes.",
  },
  "Leg Curl": {
    setup:          "Pad just above heels. Lie flat, no hip hike.",
    cue:            "Curl all the way up, pause, slow 3-second descent.",
    breathe:        "Exhale as you curl. Inhale on the way down.",
    common_mistake: "Hips rising off the bench. Keep them pinned down.",
    feel:           "Hamstrings — especially the belly of the muscle.",
  },
  "Leg Extension": {
    setup:          "Pad on lower shins. Sit upright. Full range.",
    cue:            "Squeeze and hold 1 second at the top. Slow descent.",
    breathe:        "Exhale at the top. Inhale on descent.",
    common_mistake: "Swinging weight. Control every inch of the movement.",
    feel:           "Quads only. If you feel it elsewhere, check your setup.",
  },
  "Calf Raise": {
    setup:          "Full range: heel below platform. Get a full stretch at the bottom.",
    cue:            "Rise onto the ball of your foot. Pause 1 second at the top.",
    breathe:        "Breathe freely.",
    common_mistake: "Bouncing from the bottom. The stretch is where the growth happens.",
    feel:           "Gastrocnemius and soleus — the full calf.",
  },
  "Hip Thrust": {
    setup:          "Upper back on bench. Bar over hip crease with pad. Feet flat.",
    cue:            "Drive hips straight up. Squeeze glutes hard at the top.",
    breathe:        "Breathe in at bottom. Exhale hard at top.",
    common_mistake: "Hyperextending your lower back. Tuck your chin and posteriorly tilt.",
    feel:           "Glutes exclusively. If you feel back, fix your pelvic position.",
  },
  "Bulgarian Split Squat": {
    setup:          "Rear foot on bench. Front foot far enough to prevent knee going past toe.",
    cue:            "Sink straight down. 90% of the work goes through your front leg.",
    breathe:        "Breathe in before descent. Exhale on the way up.",
    common_mistake: "Front foot too close — knee goes way over toe. Move it forward.",
    feel:           "Front leg quad and glute. Rear leg hip flexor gets a great stretch.",
  },
  "Hack Squat": {
    setup:          "Shoulder pads tight. Feet hip-width, slightly forward on platform.",
    cue:            "Descend slow. Knees track over toes. Hit full depth.",
    breathe:        "Breathe in at top. Hold through. Exhale at top.",
    common_mistake: "Rounding lower back at the bottom. Control the descent.",
    feel:           "Quads dominated movement. Glutes and hamstrings assist.",
  },
  "Cable Row": {
    setup:          "Chest tall. Slight backward lean. Cable at lower chest height.",
    cue:            "Row to your lower chest. Elbows back, not flared.",
    breathe:        "Exhale as you row. Inhale as you return.",
    common_mistake: "Using your lower back to swing. Isolate the pull with your arms.",
    feel:           "Mid-back (rhomboids, mid-traps) and lats.",
  },
  "Tricep Pushdown": {
    setup:          "Elbows tucked to sides. Standing upright or slight forward lean.",
    cue:            "Push straight down. Full extension at the bottom. Controlled return.",
    breathe:        "Exhale on pushdown. Inhale on return.",
    common_mistake: "Elbows flaring and using body. Keep elbows pinned to your sides.",
    feel:           "All three heads of the triceps.",
  },
  "Skull Crusher": {
    setup:          "Lying flat. Bar starts over forehead. Elbows vertical.",
    cue:            "Lower to forehead, then just past it. Press back up with triceps only.",
    breathe:        "Breathe in as bar descends. Exhale as you press.",
    common_mistake: "Elbows flaring out. Keep them pointing at the ceiling.",
    feel:           "Long head of the tricep — the meaty part at the back of the arm.",
  },
  "Barbell Curl": {
    setup:          "Shoulder-width underhand grip. Elbows at sides. Upright posture.",
    cue:            "Full range — start fully extended, curl all the way up.",
    breathe:        "Exhale as you curl. Inhale on descent.",
    common_mistake: "Swinging with your hips. Use a wall to isolate if needed.",
    feel:           "Biceps brachii. Squeeze hard at the top.",
  },
  "Hammer Curl": {
    setup:          "Neutral grip (palms facing each other). Elbows at sides.",
    cue:            "Curl straight up — no rotation. Controlled descent.",
    breathe:        "Exhale as you curl. Inhale on descent.",
    common_mistake: "Rushing the set. This movement benefits most from slow eccentrics.",
    feel:           "Brachialis and brachioradialis — the outer bicep and forearm.",
  },
  "Ab Wheel Rollout": {
    setup:          "Kneel. Wheel under shoulders. Core fully braced before you roll.",
    cue:            "Roll out slowly as far as you can control. Drag back with your abs.",
    breathe:        "Exhale as you roll out. Inhale on return.",
    common_mistake: "Sagging hips. Your lower back must stay flat the entire time.",
    feel:           "Deep core — rectus abdominis and transverse abdominis.",
  },
  "Hanging Leg Raise": {
    setup:          "Full hang. Posterior pelvic tilt before you raise.",
    cue:            "Raise your pelvis first, then legs follow — not just legs lifting.",
    breathe:        "Exhale as you raise. Inhale on descent.",
    common_mistake: "Swinging with momentum. Dead stop between reps.",
    feel:           "Lower abs and hip flexors. Less hip flexor with the pelvic tilt cue.",
  },
  "Dumbbell Row": {
    setup:          "One hand and knee on bench. Back flat and parallel to floor.",
    cue:            "Pull elbow to ceiling — not just up and back.",
    breathe:        "Exhale as you row. Inhale on descent.",
    common_mistake: "Rotating too much. Keep hips square to the ground.",
    feel:           "Lat and mid-back on the working side.",
  },
  "Dip": {
    setup:          "Parallel bars. Slight forward lean for chest. Upright for triceps.",
    cue:            "Lower controlled until upper arm is parallel. Press up strongly.",
    breathe:        "Breathe in before descent. Exhale as you press up.",
    common_mistake: "Not getting enough depth. You need to feel a chest stretch.",
    feel:           "Lower chest and triceps. More lean = more chest.",
  },
  "Chin Up": {
    setup:          "Supinated (underhand) grip, shoulder-width.",
    cue:            "Start with a dead hang. Pull chest to bar. Full extension at bottom.",
    breathe:        "Exhale as you pull. Inhale on descent.",
    common_mistake: "Half reps. Full extension is where the lats are actually loaded.",
    feel:           "Biceps and lats together — the supinated grip makes biceps work more.",
  },
  "Goblet Squat": {
    setup:          "Hold dumbbell or kettlebell at chest. Feet shoulder-width.",
    cue:            "Sit between your knees. Elbows inside knees at the bottom.",
    breathe:        "Breathe in before descent. Exhale as you stand.",
    common_mistake: "Heels rising. If this happens, elevate them or work ankle mobility.",
    feel:           "Quads, glutes, and inner thighs all at once.",
  },
};

function ExercisePlaceholder({ exerciseName }) {
  const exMuscleData = getExerciseData(exerciseName);
  const primaryMuscle = exMuscleData?.primary?.[0] || null;
  const mColor = getMuscleColor(primaryMuscle);
  const mLetter = {'#e8341c':'C','#60a5fa':'B','#FEA020':'S','#9C6FFF':'A','#22c55e':'L','#14C4B3':'CO'}[mColor] || '?';
  return (
    <div style={{width:"100%",aspectRatio:"4/3",background:`${mColor}1A`,borderRadius:14,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,marginBottom:20}}>
      <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontStyle:"italic",fontWeight:900,fontSize:72,color:mColor,lineHeight:1}}>{mLetter}</span>
    </div>
  );
}

function GifSkeleton() {
  return (
    <div style={{width:"100%",aspectRatio:"4/3",background:"linear-gradient(90deg,rgba(0,0,0,.05) 25%,rgba(0,0,0,.09) 50%,rgba(0,0,0,.05) 75%)",backgroundSize:"200% 100%",borderRadius:14,marginBottom:20,animation:"shimmer 1.4s infinite"}}/>
  );
}

function ExerciseImages({ url1, url2, exerciseName }) {
  const [err1, setErr1] = useState(false);
  const [err2, setErr2] = useState(false);
  if (!url1 || err1) return <ExercisePlaceholder exerciseName={exerciseName}/>;
  if (!url2 || err2) {
    return <img src={url1} alt="exercise start" onError={()=>setErr1(true)} style={{width:"100%",borderRadius:14,marginBottom:20,display:"block",objectFit:"cover"}}/>;
  }
  return (
    <div style={{position:"relative",width:"100%",aspectRatio:"4/3",borderRadius:14,overflow:"hidden",marginBottom:20,background:T.s2}}>
      <style>{`
        @keyframes ex-a{0%,42%{opacity:1}50%,100%{opacity:0}}
        @keyframes ex-b{0%,42%{opacity:0}50%,100%{opacity:1}}
      `}</style>
      <img src={url1} alt="start" onError={()=>setErr1(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",animation:"ex-a 2.4s ease-in-out infinite"}}/>
      <img src={url2} alt="end"   onError={()=>setErr2(true)} style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",animation:"ex-b 2.4s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:8,left:8,background:"rgba(0,0,0,0.55)",borderRadius:6,padding:"2px 7px",fontSize:9,fontWeight:700,letterSpacing:1,color:"rgba(255,255,255,0.7)"}}>START → END</div>
    </div>
  );
}

export function ExerciseDetailModal({ exerciseName, user, onClose, onSwap }) {
  const [exData,   setExData]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [wxHistory,setWxHistory]= useState([]);

  useEffect(() => {
    setLoading(true);
    setExData(null);
    setWxHistory([]);

    getCachedExerciseData(exerciseName).then(d => {
      setExData(d);
      setLoading(false);
    });

    if (user) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 120);
      sb.from("workout_logs")
        .select("date,workout")
        .eq("user_id", user.id)
        .gte("date", cutoff.toISOString().split("T")[0])
        .order("date", { ascending: false })
        .then(({ data }) => {
          if (!data) return;
          const rows = [];
          for (const row of data) {
            if (rows.length >= 3) break;
            const match = (row.workout?.exercises || []).find(
              e => e.name?.toLowerCase() === exerciseName.toLowerCase()
            );
            if (match?.sets?.filter(s => s.done).length) {
              rows.push({ date: row.date, sets: match.sets.filter(s => s.done) });
            }
          }
          setWxHistory(rows);
        });
    }
  }, [exerciseName, user]);

  const cues = COACHING_CUES[exerciseName];

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:10000}}
      />
      {/* Sheet */}
      <div
        style={{
          position:"fixed",bottom:0,left:0,right:0,zIndex:10001,
          background:"var(--cm-paper,#fff)",borderRadius:"22px 22px 0 0",
          maxHeight:"91vh",overflowY:"auto",
          paddingBottom:"max(env(safe-area-inset-bottom,0px),20px)",
        }}
      >
        {/* Drag handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"14px 0 0"}}>
          <div style={{width:36,height:4,background:"rgba(var(--cm-ink-rgb,10,10,10),.12)",borderRadius:2}}/>
        </div>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px 4px"}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:900,lineHeight:1.1,color:"var(--cm-ink,#0A0A0A)"}}>{exerciseName}</div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:"rgba(var(--cm-ink-rgb,10,10,10),.06)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),.10)",cursor:"pointer",fontSize:18,color:"rgba(var(--cm-ink-rgb,10,10,10),.50)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>×</button>
        </div>

        {exData?.equipment&&(
          <div style={{padding:"2px 20px 12px"}}>
            <span style={{fontSize:10,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",textTransform:"capitalize"}}>{exData.equipment}{exData.body_part?` · ${exData.body_part}`:""}</span>
          </div>
        )}

        <div style={{padding:"0 20px 28px"}}>
          {/* Images */}
          {loading ? <GifSkeleton/> : <ExerciseImages url1={exData?.gif_url} url2={exData?.gif_url_2} exerciseName={exerciseName}/>}

          {/* Muscles */}
          {!loading && (exData?.target_muscles?.length>0 || exData?.secondary_muscles?.length>0) && (
            <div style={{marginBottom:20}}>
              {exData.target_muscles?.length>0&&<>
                <div style={{fontSize:9,color:T.prot,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>PRIMARY MUSCLES</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {exData.target_muscles.map(m=>(
                    <span key={m} style={{padding:"4px 11px",background:`${T.prot}18`,border:`1px solid ${T.prot}35`,borderRadius:20,fontSize:11,fontWeight:700,color:T.prot,textTransform:"capitalize"}}>{m}</span>
                  ))}
                </div>
              </>}
              {exData.secondary_muscles?.length>0&&<>
                <div style={{fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>SECONDARY</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {exData.secondary_muscles.map(m=>(
                    <span key={m} style={{padding:"4px 11px",background:"rgba(var(--cm-ink-rgb,10,10,10),.05)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),.10)",borderRadius:20,fontSize:11,color:"rgba(var(--cm-ink-rgb,10,10,10),.55)",textTransform:"capitalize"}}>{m}</span>
                  ))}
                </div>
              </>}
            </div>
          )}

          {/* Instructions */}
          {!loading && exData?.instructions?.length>0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>HOW TO DO IT</div>
              {exData.instructions.map((step,i)=>(
                <div key={i} style={{display:"flex",gap:12,marginBottom:10,alignItems:"flex-start"}}>
                  <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(var(--cm-ink-rgb,10,10,10),.06)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),.10)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"rgba(var(--cm-ink-rgb,10,10,10),.50)",flexShrink:0,marginTop:1}}>{i+1}</div>
                  <div style={{fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),.70)",lineHeight:1.65,paddingTop:1}}>{step}</div>
                </div>
              ))}
            </div>
          )}

          {/* Coaching cues */}
          {cues && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>COACHING CUES</div>
              <div style={{background:`${T.carb}12`,border:`1px solid ${T.carb}28`,borderRadius:12,padding:"14px 16px",marginBottom:8}}>
                <div style={{fontSize:10,color:T.carb,fontWeight:700,letterSpacing:1,marginBottom:5}}>🔑 KEY CUE</div>
                <div style={{fontSize:14,fontWeight:600,color:"var(--cm-ink,#0A0A0A)",lineHeight:1.5}}>{cues.cue}</div>
              </div>
              {cues.setup && (
                <div style={{background:"rgba(var(--cm-ink-rgb,10,10,10),.04)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),.08)",borderRadius:12,padding:"12px 16px",marginBottom:8}}>
                  <div style={{fontSize:10,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",fontWeight:700,letterSpacing:1,marginBottom:4}}>📐 SETUP</div>
                  <div style={{fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),.70)",lineHeight:1.5}}>{cues.setup}</div>
                </div>
              )}
              <div style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.18)",borderRadius:12,padding:"12px 16px",marginBottom:8}}>
                <div style={{fontSize:10,color:"#EF4444",fontWeight:700,letterSpacing:1,marginBottom:4}}>⚠️ COMMON MISTAKE</div>
                <div style={{fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),.70)",lineHeight:1.5}}>{cues.common_mistake}</div>
              </div>
              <div style={{background:"rgba(255,59,48,.05)",border:"1px solid rgba(255,59,48,.14)",borderRadius:12,padding:"12px 16px"}}>
                <div style={{fontSize:10,color:"var(--cm-red,#FF3B30)",fontWeight:700,letterSpacing:1,marginBottom:4}}>💪 FEEL IT HERE</div>
                <div style={{fontSize:13,color:"rgba(var(--cm-ink-rgb,10,10,10),.70)",lineHeight:1.5}}>{cues.feel}</div>
              </div>
            </div>
          )}

          {/* Weight history */}
          {wxHistory.length>0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>YOUR HISTORY</div>
              <div style={{background:"rgba(var(--cm-ink-rgb,10,10,10),.04)",border:"1px solid rgba(var(--cm-ink-rgb,10,10,10),.08)",borderRadius:12,overflow:"hidden"}}>
                {wxHistory.map((h,i)=>{
                  const weights = h.sets.map(s=>parseFloat(s.weight)||0);
                  const maxW = Math.max(...weights);
                  const prevWeights = wxHistory[i+1]?.sets.map(s=>parseFloat(s.weight)||0)||[];
                  const prevMax = prevWeights.length ? Math.max(...prevWeights) : null;
                  const trend = prevMax!==null ? (maxW>prevMax?"↑":maxW<prevMax?"↓":"→") : null;
                  const d = new Date(h.date+"T12:00:00");
                  const label = d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
                  return (
                    <div key={i} style={{padding:"12px 16px",borderBottom:i<wxHistory.length-1?"1px solid rgba(var(--cm-ink-rgb,10,10,10),.08)":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:12,color:"rgba(var(--cm-ink-rgb,10,10,10),.45)",minWidth:60}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:700,flex:1,paddingLeft:8}}>
                        {maxW>0?`${maxW} lbs`:"Bodyweight"} × {h.sets.length} sets × {h.sets[0]?.reps||"?"} reps
                      </div>
                      {trend&&<div style={{fontSize:15,fontWeight:800,color:trend==="↑"?"#00C9A7":trend==="↓"?"#EF4444":T.mu,marginLeft:8}}>{trend}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Swap button */}
          {onSwap && (
            <button onClick={onSwap} style={{width:"100%",padding:"13px",background:"none",border:"1.5px solid rgba(var(--cm-ink-rgb,10,10,10),.12)",borderRadius:12,color:"rgba(var(--cm-ink-rgb,10,10,10),.50)",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
              Swap This Exercise →
            </button>
          )}
        </div>
      </div>
    </>
  );
}
