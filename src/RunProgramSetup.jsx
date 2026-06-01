import React, { useState } from 'react';
import {
  vdotFromRaceTime,
  projectRaceTime, projectAllRaceTimes,
  trainingPaces, recommendPlanWeeks, isGoalRealistic,
  formatPace, RACE_DISTANCES,
} from './services/paceService.js';
import { hyroxTargets as calcHyroxTargets } from './services/hyroxPaceService.js';
import { saveRunProfile, saveHyroxProfile } from './services/profileService.js';
import { showToast } from './utils/toast.js';
import { PROGRAM_LIBRARY } from './programs.js';

// ── Style constants ────────────────────────────────────────────────────────────
const AC = "var(--accent)";
const MONO = { fontFamily:"'DM Mono',monospace" };
const COND = { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontStyle:"italic" };
const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ── Distance data ─────────────────────────────────────────────────────────────
const DIST_METERS = {
  mile: RACE_DISTANCES.mile,
  "5k":  RACE_DISTANCES.fiveK,
  "10k": RACE_DISTANCES.tenK,
  half:  RACE_DISTANCES.halfMarathon,
  full:  RACE_DISTANCES.marathon,
};
const DIST_LABELS = {
  mile:"1 Mile", "5k":"5K", "10k":"10K", half:"Half Marathon", full:"Marathon",
};

const PROJ_KEY_MAP = { mile:"mile", fiveK:"5k", tenK:"10k", halfMarathon:"half", marathon:"full" };

const PROG_GOAL_DIST = {
  c25k:"5k", "5k_sub25":"5k", "10k":"10k",
  half:"half", marathon_advanced:"full",
};

const STATION_LABELS = {
  skiErg:"SkiErg 1000m", sled_push:"Sled Push", sled_pull:"Sled Pull",
  burpee_bj:"Burpee Broad Jump", rowing:"Row 1000m",
  farmers:"Farmer's Carry", sandbag:"Sandbag Lunges", wall_balls:"Wall Balls",
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function parseMMSS(m, s) { return (parseInt(m)||0)*60 + (parseInt(s)||0); }
function parseHMS(h, m, s) { return (parseInt(h)||0)*3600 + (parseInt(m)||0)*60 + (parseInt(s)||0); }
function fmtSecs(secs) {
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TapCard({ label, sub, icon, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? "rgba(var(--accent-rgb),0.08)" : "#0d0d0d",
      border: `1.5px solid ${selected ? AC : "rgba(var(--accent-rgb),0.08)"}`,
      borderRadius:13, padding:"14px 18px", cursor:"pointer",
      display:"flex", alignItems:"center", gap:14, marginBottom:8,
      transition:"all 0.18s",
    }}>
      {icon && <div style={{ fontSize:22, flexShrink:0, width:28, textAlign:"center" }}>{icon}</div>}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:15, fontWeight:700, color: selected ? AC : "#f5f5f0" }}>{label}</div>
        {sub && <div style={{ fontSize:12, color:"rgba(245,245,240,.55)", marginTop:3 }}>{sub}</div>}
      </div>
      {selected && <div style={{ color:AC, fontSize:15, flexShrink:0 }}>✓</div>}
    </div>
  );
}

function Eyebrow({ children }) {
  return <div style={{ ...MONO, fontSize:10, color:AC, letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:10 }}>{children}</div>;
}

function Heading({ children }) {
  return <div style={{ ...COND, fontSize:30, textTransform:"uppercase", lineHeight:1.05, color:"#f5f5f0", marginBottom:8 }}>{children}</div>;
}

function ProjRow({ label, value, isCurrent }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background: isCurrent ? "rgba(var(--accent-rgb),.07)" : "rgba(255,255,255,.03)", borderRadius:8, marginBottom:4, border: isCurrent ? "1px solid rgba(var(--accent-rgb),.22)" : "1px solid rgba(255,255,255,.05)" }}>
      <span style={{ fontSize:13, color: isCurrent ? "#f5f5f0" : "rgba(245,245,240,.7)" }}>{label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ ...MONO, fontSize:14, fontWeight: isCurrent ? 700 : 400, color:"#f5f5f0" }}>{value}</span>
        {isCurrent && <span style={{ ...MONO, fontSize:9, color:AC, letterSpacing:"0.1em" }}>← actual</span>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, sub, accent }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:12 }}>
      <div>
        <div style={{ fontSize:12, color:"rgba(245,245,240,.5)" }}>{label}</div>
        {sub && <div style={{ fontSize:10, color:"rgba(245,245,240,.3)", marginTop:1 }}>{sub}</div>}
      </div>
      <div style={{ ...MONO, fontSize: accent ? 20 : 15, fontWeight: accent ? 700 : 600, color: accent ? AC : "#f5f5f0" }}>{value}</div>
    </div>
  );
}

function PaceRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
      <span style={{ fontSize:13, color:"rgba(245,245,240,.7)" }}>{label}</span>
      <span style={{ ...MONO, fontSize:15, color:"#f5f5f0", fontWeight:600 }}>{value}</span>
    </div>
  );
}

function CTABtn({ onClick, disabled, loading, children }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      width:"100%", padding:16,
      background: (disabled||loading) ? "rgba(255,255,255,.08)" : AC,
      color: (disabled||loading) ? "rgba(245,245,240,.35)" : "#fff",
      border:"none", borderRadius:14,
      cursor: (disabled||loading) ? "not-allowed" : "pointer",
      ...COND, fontSize:18, letterSpacing:"0.05em", textTransform:"uppercase",
      marginTop:12, transition:"opacity 0.15s",
    }}>
      {loading ? "Saving…" : children}
    </button>
  );
}

function TimeInputMMSS({ min, onMin, sec, onSec, label }) {
  return (
    <div style={{ marginTop:14 }}>
      {label && <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:8 }}>{label}</div>}
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div style={{ flex:1 }}>
          <div style={{ ...MONO, fontSize:9, color:"rgba(245,245,240,.4)", marginBottom:4 }}>MM</div>
          <input type="number" min={0} max={99} value={min} onChange={e=>onMin(e.target.value)} placeholder="28"
            style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"12px 8px", color:"#fff", fontSize:20, ...MONO, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
        </div>
        <div style={{ fontSize:22, color:"rgba(245,245,240,.3)", paddingTop:18 }}>:</div>
        <div style={{ flex:1 }}>
          <div style={{ ...MONO, fontSize:9, color:"rgba(245,245,240,.4)", marginBottom:4 }}>SS</div>
          <input type="number" min={0} max={59} value={sec} onChange={e=>onSec(e.target.value)} placeholder="15"
            style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"12px 8px", color:"#fff", fontSize:20, ...MONO, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
        </div>
      </div>
    </div>
  );
}

function HMSInput({ hVal, mVal, sVal, onH, onM, onS }) {
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      {[
        { val:hVal, set:onH, label:"H",  ph:"1" },
        { val:mVal, set:onM, label:"MM", ph:"10" },
        { val:sVal, set:onS, label:"SS", ph:"00" },
      ].map(({ val, set, label, ph }, i) => (
        <React.Fragment key={label}>
          {i > 0 && <div style={{ fontSize:22, color:"rgba(245,245,240,.3)", paddingTop:18 }}>:</div>}
          <div style={{ flex: i===0 ? 0.7 : 1 }}>
            <div style={{ ...MONO, fontSize:9, color:"rgba(245,245,240,.4)", marginBottom:4 }}>{label}</div>
            <input type="number" min={0} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
              style={{ width:"100%", background:"rgba(255,255,255,.07)", border:"1px solid rgba(255,255,255,.15)", borderRadius:10, padding:"12px 8px", color:"#fff", fontSize:18, ...MONO, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function DistSelector({ value, onChange, options }) {
  return (
    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
      {options.map(d => (
        <button key={d} onClick={()=>onChange(d)} style={{
          padding:"8px 14px", borderRadius:20,
          border: `1.5px solid ${value===d ? AC : "rgba(255,255,255,.12)"}`,
          background: value===d ? "rgba(var(--accent-rgb),.1)" : "rgba(255,255,255,.04)",
          color: value===d ? AC : "rgba(245,245,240,.7)",
          fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
        }}>
          {DIST_LABELS[d]}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RunProgramSetup({ program, user, onConfirm, onCancel }) {
  const isHyrox = program.category === "Hyrox";
  const TOTAL_STEPS = 5;

  // Navigation
  const [step, setStep] = useState(1);

  // Step 1 — Running/Hybrid baseline
  const [baselineChoice, setBaselineChoice] = useState(null);
  const [baselineDist, setBaselineDist] = useState("5k");
  const [bMin, setBMin] = useState("");
  const [bSec, setBSec] = useState("");

  // Step 1 — Hyrox baseline
  const [hyroxChoice, setHyroxChoice] = useState(null);
  const [hxH, setHxH] = useState("1");
  const [hxM, setHxM] = useState("10");
  const [hxS, setHxS] = useState("00");
  const [fkMin, setFkMin] = useState("");
  const [fkSec, setFkSec] = useState("");

  // Computed from baseline
  const [vdot, setVdot] = useState(null);
  const [proj, setProj] = useState(null);
  const [baselineSecs, setBaselineSecs] = useState(null);
  const [actualDist, setActualDist] = useState(null);
  const [currentHyroxSecs, setCurrentHyroxSecs] = useState(null);
  const [hyroxData, setHyroxData] = useState(null);

  // Step 2 — Training days
  const [trainDays, setTrainDays] = useState([]);
  const [longRunDay, setLongRunDay] = useState(null);
  const [stationDay, setStationDay] = useState(null);

  // Step 4 — Goal
  const [goalDist, setGoalDist] = useState(PROG_GOAL_DIST[program.id] || "5k");
  const [gMin, setGMin] = useState("");
  const [gSec, setGSec] = useState("");
  const [goalH, setGoalH] = useState("1");
  const [goalM, setGoalM] = useState("00");
  const [goalS, setGoalS] = useState("00");
  const [realisticSug, setRealisticSug] = useState(null);
  const [goalError, setGoalError] = useState("");

  const [saving, setSaving] = useState(false);

  // ── Step 1 → 2: Running/Hybrid ──────────────────────────────────────────────
  function proceedBaseline() {
    const distKey = baselineChoice === "mile" ? "mile" : baselineDist;
    const secs = parseMMSS(bMin, bSec);
    if (secs < 60) { showToast("Enter a valid time", "error"); return; }
    const meters = DIST_METERS[distKey];
    const v = vdotFromRaceTime(meters, secs / 60);
    if (!v || v < 15 || v > 90) { showToast("That time doesn't look right — try again", "error"); return; }
    setVdot(v);
    setProj(projectAllRaceTimes(v));
    setBaselineSecs(secs);
    setActualDist(distKey);
    setStep(2);
  }

  // ── Step 1 → 2: Hyrox ──────────────────────────────────────────────────────
  function proceedHyroxBaseline() {
    let secs;
    if (hyroxChoice === "yes") {
      secs = parseHMS(hxH, hxM, hxS);
    } else {
      const fkSecs = parseMMSS(fkMin, fkSec);
      if (fkSecs < 60) { showToast("Enter a valid 5K time", "error"); return; }
      secs = Math.round(fkSecs * 3.4);
    }
    if (secs < 2400 || secs > 18000) { showToast("Time doesn't look right — check your entry", "error"); return; }
    const goalSecs = Math.round(secs * 0.9);
    setCurrentHyroxSecs(secs);
    setHyroxData(calcHyroxTargets(secs, goalSecs));
    setStep(2);
  }

  // ── Step 4: "What's realistic?" ─────────────────────────────────────────────
  function computeRealistic() {
    if (!vdot) return;
    const weeksPer1VDOT = vdot < 35 ? 3.5 : vdot < 50 ? 5 : 8;
    const targetVdot = vdot + (12 / weeksPer1VDOT);
    const time = projectRaceTime(targetVdot, DIST_METERS[goalDist]);
    setRealisticSug({ time, vdot: targetVdot, weeks: 12 });
    setGMin(String(Math.floor(time / 60)));
    setGSec(String(time % 60).padStart(2, '0'));
  }

  // ── Step 4 → 5 ──────────────────────────────────────────────────────────────
  function proceedToConfirm() {
    setGoalError("");
    if (isHyrox) {
      const gs = parseHMS(goalH, goalM, goalS);
      if (gs < 2400 || gs >= currentHyroxSecs) {
        setGoalError("Goal must be faster than your current time");
        return;
      }
      setHyroxData(calcHyroxTargets(currentHyroxSecs, gs));
      setStep(5);
      return;
    }
    const gs = parseMMSS(gMin, gSec);
    if (gs < 30) { setGoalError("Enter a valid goal time"); return; }
    const goalVdot = vdotFromRaceTime(DIST_METERS[goalDist], gs / 60);
    const { realistic, neededWeeks } = isGoalRealistic(vdot, goalVdot, 24);
    if (!realistic && neededWeeks > 24) {
      setGoalError(`This goal requires ~${neededWeeks}+ weeks. Try an intermediate milestone.`);
      return;
    }
    setStep(5);
  }

  // ── Step 5: Confirm & Save ──────────────────────────────────────────────────
  async function handleConfirm() {
    setSaving(true);
    try {
      if (isHyrox) {
        const gs = parseHMS(goalH, goalM, goalS);
        const data = calcHyroxTargets(currentHyroxSecs, gs);
        if (user?.id) await saveHyroxProfile(user.id, {
          currentTotalTime: currentHyroxSecs,
          currentKmPace: data.currentKmPaceFormatted,
          goalTotalTime: gs,
          planWeeks: data.planWeeks,
          stationTargets: data.stationTargets,
          trainDays,
          stationDay: stationDay || null,
          longRunDay: longRunDay || null,
        });
      } else {
        const gs = parseMMSS(gMin, gSec);
        const goalVdot = vdotFromRaceTime(DIST_METERS[goalDist], gs / 60);
        const today = new Date().toISOString().split("T")[0];
        if (user?.id) await saveRunProfile(user.id, {
          currentVdot: vdot,
          baselineType: actualDist,
          baselineTime: baselineSecs,
          baselineDate: today,
          goalDistance: goalDist,
          goalTime: gs,
          goalDate: null,
          planWeeks: recommendPlanWeeks(vdot, goalVdot),
          planStartDate: today,
          paces: trainingPaces(vdot),
          trainDays,
          longRunDay: longRunDay || null,
        });
      }
      onConfirm(program);
    } catch (e) {
      console.error("[RunProgramSetup] save error:", e);
      showToast("Profile save failed — activating anyway", "error");
      onConfirm(program);
    } finally {
      setSaving(false);
    }
  }

  // ── Couch to Mile routing ───────────────────────────────────────────────────
  function handleCantRun() {
    const fallback = PROGRAM_LIBRARY.find(p => p.id === "couch_to_mile")
                  || PROGRAM_LIBRARY.find(p => p.id === "c25k");
    showToast("We'll build your base first. Couch to 5K starts today.", "success");
    onConfirm(fallback || program);
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  function Header() {
    const goBack = step > 1 ? () => setStep(s => s - 1) : onCancel;
    const backLabel = step > 1 ? "← Back" : "✕ Cancel";
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.07)", position:"sticky", top:0, background:"#000", zIndex:2 }}>
        <button onClick={goBack} style={{ background:"none", border:"none", color:"rgba(245,245,240,.5)", cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>
          {backLabel}
        </button>
        <div style={{ ...COND, fontSize:16, letterSpacing:"0.04em", color:"#f5f5f0" }}>
          {program.name.toUpperCase()}
        </div>
        <div style={{ ...MONO, fontSize:11, color:"rgba(245,245,240,.4)", letterSpacing:"0.1em" }}>
          {step} of {TOTAL_STEPS}
        </div>
      </div>
    );
  }

  // ── Step 1: Running/Hybrid ──────────────────────────────────────────────────
  function Step1Running() {
    const showEntry = baselineChoice === "mile" || baselineChoice === "other";
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Baseline</Eyebrow>
        <Heading>Where are you<br/><span style={{color:AC}}>starting from?</span></Heading>
        <div style={{ fontSize:13, color:"rgba(245,245,240,.6)", marginBottom:24, lineHeight:1.6 }}>
          Before we build your plan, we need to know your current fitness.
        </div>

        <TapCard icon="🏃" label="I can run a mile" sub="I have a recent 1-mile time" selected={baselineChoice==="mile"} onClick={()=>setBaselineChoice("mile")} />
        <TapCard icon="🚶" label="I can't run a mile yet" sub="Build your base first — takes 8 weeks" selected={baselineChoice==="cant"} onClick={()=>setBaselineChoice("cant")} />
        <TapCard icon="📊" label="I have a 5K / 10K / race time" sub="Use any recent race or timed effort" selected={baselineChoice==="other"} onClick={()=>setBaselineChoice("other")} />

        {baselineChoice === "other" && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:8 }}>Select your distance:</div>
            <DistSelector value={baselineDist} onChange={setBaselineDist} options={["5k","10k","half","full"]} />
          </div>
        )}

        {showEntry && (
          <TimeInputMMSS
            min={bMin} onMin={setBMin}
            sec={bSec} onSec={setBSec}
            label={`Your ${baselineChoice==="mile" ? "1-mile" : DIST_LABELS[baselineDist]} time`}
          />
        )}

        {baselineChoice === "cant" && (
          <CTABtn onClick={handleCantRun}>Start Couch to 5K →</CTABtn>
        )}
        {showEntry && (
          <CTABtn onClick={proceedBaseline} disabled={!(parseInt(bMin)||parseInt(bSec))}>
            Continue →
          </CTABtn>
        )}
      </div>
    );
  }

  // ── Step 1: Hyrox ───────────────────────────────────────────────────────────
  function Step1Hyrox() {
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Baseline</Eyebrow>
        <Heading>Your Hyrox<br/><span style={{color:AC}}>starting point.</span></Heading>
        <div style={{ fontSize:13, color:"rgba(245,245,240,.6)", marginBottom:24, lineHeight:1.6 }}>
          Have you done a Hyrox race before?
        </div>

        <TapCard icon="🏁" label="Yes — I have a race time" sub="Enter your official finish time" selected={hyroxChoice==="yes"} onClick={()=>setHyroxChoice("yes")} />
        <TapCard icon="🏃" label="No — use my running fitness" sub="Enter a 5K time to estimate your Hyrox potential" selected={hyroxChoice==="no"} onClick={()=>setHyroxChoice("no")} />

        {hyroxChoice === "yes" && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:8 }}>Your Hyrox finish time:</div>
            <HMSInput hVal={hxH} mVal={hxM} sVal={hxS} onH={setHxH} onM={setHxM} onS={setHxS} />
          </div>
        )}
        {hyroxChoice === "no" && (
          <TimeInputMMSS min={fkMin} onMin={setFkMin} sec={fkSec} onSec={setFkSec} label="Your recent 5K time" />
        )}

        {hyroxChoice && (
          <CTABtn onClick={proceedHyroxBaseline}>Continue →</CTABtn>
        )}
      </div>
    );
  }

  // ── Step 2: Training Days ────────────────────────────────────────────────────
  function Step2Days() {
    const minDays = program.days || 3;
    const deficit = minDays - trainDays.length;

    function toggleDay(d) {
      setTrainDays(prev => {
        const next = prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d];
        // Clear role selectors if day is removed
        if (!next.includes(longRunDay)) setLongRunDay(null);
        if (!next.includes(stationDay)) setStationDay(null);
        return next;
      });
    }

    const canProceed = isHyrox
      ? trainDays.length >= minDays && longRunDay && stationDay
      : trainDays.length >= minDays && longRunDay;

    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Training Schedule</Eyebrow>
        <Heading>Which days work<br/><span style={{color:AC}}>for training?</span></Heading>
        <div style={{ fontSize:13, color:"rgba(245,245,240,.6)", marginBottom:20, lineHeight:1.5 }}>
          This plan needs <span style={{color:"#f5f5f0", fontWeight:600}}>{minDays} sessions/week</span> — select at least that many days.
        </div>

        {/* 7-day grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:5, marginBottom:8 }}>
          {WEEK_DAYS.map(d => {
            const sel = trainDays.includes(d);
            return (
              <button key={d} onClick={() => toggleDay(d)} style={{
                padding:"11px 0", borderRadius:10,
                border: `1.5px solid ${sel ? AC : "rgba(255,255,255,.22)"}`,
                background: sel ? "rgba(var(--accent-rgb),.1)" : "rgba(255,255,255,.03)",
                color: sel ? AC : "rgba(245,245,240,.6)",
                fontSize:10, fontWeight:700, cursor:"pointer",
                fontFamily:"'DM Mono',monospace", transition:"all 0.15s",
                textAlign:"center",
              }}>
                {d}
              </button>
            );
          })}
        </div>

        {deficit > 0 && trainDays.length > 0 && (
          <div style={{ ...MONO, fontSize:11, color:"rgba(245,245,240,.4)", marginBottom:16, marginTop:4 }}>
            {deficit} more day{deficit !== 1 ? "s" : ""} needed
          </div>
        )}
        {deficit <= 0 && <div style={{ marginBottom:16 }} />}

        {/* Long run day selector */}
        {trainDays.length > 0 && (
          <div style={{ marginBottom: isHyrox ? 0 : 4 }}>
            <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:10, fontWeight:600 }}>
              Which day is your long run?
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {trainDays.map(d => (
                <button key={d} onClick={() => setLongRunDay(longRunDay === d ? null : d)} style={{
                  padding:"8px 14px", borderRadius:20,
                  border: `1.5px solid ${longRunDay===d ? AC : "rgba(255,255,255,.2)"}`,
                  background: longRunDay===d ? "rgba(var(--accent-rgb),.1)" : "rgba(255,255,255,.04)",
                  color: longRunDay===d ? AC : "rgba(245,245,240,.65)",
                  fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Station day selector (Hyrox only) */}
        {isHyrox && trainDays.length > 0 && (
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:10, fontWeight:600 }}>
              Which day for station work?
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {trainDays.map(d => (
                <button key={d} onClick={() => setStationDay(stationDay === d ? null : d)} style={{
                  padding:"8px 14px", borderRadius:20,
                  border: `1.5px solid ${stationDay===d ? AC : "rgba(255,255,255,.2)"}`,
                  background: stationDay===d ? "rgba(var(--accent-rgb),.1)" : "rgba(255,255,255,.04)",
                  color: stationDay===d ? AC : "rgba(245,245,240,.65)",
                  fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s",
                }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <CTABtn onClick={() => setStep(3)} disabled={!canProceed}>
          Continue →
        </CTABtn>
      </div>
    );
  }

  // ── Step 3: Running/Hybrid Projections ──────────────────────────────────────
  function Step3Running() {
    if (!proj) return null;
    const rows = [
      { projKey:"mile",         label:"1 Mile" },
      { projKey:"fiveK",        label:"5K" },
      { projKey:"tenK",         label:"10K" },
      { projKey:"halfMarathon", label:"Half Marathon" },
      { projKey:"marathon",     label:"Marathon" },
    ];
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Your Fitness</Eyebrow>
        <Heading>Based on your<br/><span style={{color:AC}}>{DIST_LABELS[actualDist]} time.</span></Heading>
        <div style={{ fontSize:13, color:"rgba(245,245,240,.6)", marginBottom:16, lineHeight:1.5 }}>
          Your current predicted race times:
        </div>
        <div style={{ marginBottom:20 }}>
          {rows.map(({ projKey, label }) => {
            const isCurr = PROJ_KEY_MAP[projKey] === actualDist;
            return (
              <ProjRow
                key={projKey}
                label={label}
                value={isCurr ? fmtSecs(baselineSecs) : proj[projKey]}
                isCurrent={isCurr}
              />
            );
          })}
        </div>
        <div style={{ ...MONO, fontSize:11, color:"rgba(245,245,240,.4)", marginBottom:24, lineHeight:1.6 }}>
          Daniels VDOT formula · Your fitness score: <span style={{color:AC}}>{vdot?.toFixed(1)}</span>
        </div>
        <CTABtn onClick={() => setStep(4)}>Set Your Goal →</CTABtn>
      </div>
    );
  }

  // ── Step 3: Hyrox Station Breakdown ─────────────────────────────────────────
  function Step3Hyrox() {
    if (!hyroxData) return null;
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Station Breakdown</Eyebrow>
        <Heading>Current station<br/><span style={{color:AC}}>targets.</span></Heading>
        <div style={{ fontSize:13, color:"rgba(245,245,240,.6)", marginBottom:16 }}>
          Based on {fmtSecs(currentHyroxSecs)} total · Run pace {hyroxData.currentKmPaceFormatted}
        </div>

        <div style={{ background:"rgba(255,255,255,.03)", borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,.08)", marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
            <div style={{ ...MONO, fontSize:9, color:"rgba(245,245,240,.35)", padding:"10px 14px", letterSpacing:"0.1em", textTransform:"uppercase" }}>Station</div>
            <div style={{ ...MONO, fontSize:9, color:"rgba(245,245,240,.35)", padding:"10px 12px", textAlign:"right", letterSpacing:"0.1em", textTransform:"uppercase" }}>Now</div>
            <div style={{ ...MONO, fontSize:9, color:AC, padding:"10px 14px", textAlign:"right", letterSpacing:"0.1em", textTransform:"uppercase" }}>Goal</div>
          </div>
          {Object.entries(hyroxData.stationTargets).map(([key, s], i) => (
            <div key={key} style={{ display:"grid", gridTemplateColumns:"1fr auto auto", borderTop: i===0 ? "none" : "1px solid rgba(255,255,255,.04)", background: i%2===0 ? "rgba(255,255,255,.01)" : "transparent" }}>
              <div style={{ fontSize:12, color:"rgba(245,245,240,.75)", padding:"10px 14px" }}>{STATION_LABELS[key] || key}</div>
              <div style={{ ...MONO, fontSize:12, color:"rgba(245,245,240,.5)", padding:"10px 12px", textAlign:"right" }}>{fmtSecs(s.current)}</div>
              <div style={{ ...MONO, fontSize:12, color:"#f5f5f0", fontWeight:700, padding:"10px 14px", textAlign:"right" }}>{fmtSecs(s.goal)}</div>
            </div>
          ))}
        </div>
        <CTABtn onClick={() => setStep(4)}>Set Your Goal →</CTABtn>
      </div>
    );
  }

  // ── Step 4: Goal ─────────────────────────────────────────────────────────────
  function Step4Running() {
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Goal</Eyebrow>
        <Heading>What are you<br/><span style={{color:AC}}>training for?</span></Heading>

        <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:10, marginTop:8 }}>Goal distance:</div>
        <DistSelector value={goalDist} onChange={d=>{setGoalDist(d); setRealisticSug(null);}} options={["5k","10k","half","full"]} />

        <div style={{ marginTop:16, marginBottom:8 }}>
          <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:4 }}>Your goal time for {DIST_LABELS[goalDist]}:</div>
        </div>
        <TimeInputMMSS min={gMin} onMin={setGMin} sec={gSec} onSec={setGSec} />

        <button onClick={computeRealistic} style={{ width:"100%", marginTop:16, padding:"12px 16px", background:"rgba(255,255,255,.04)", border:"1.5px solid rgba(255,255,255,.12)", borderRadius:12, color:"rgba(245,245,240,.75)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
          What's realistic for me?
        </button>

        {realisticSug && (
          <div style={{ background:"rgba(var(--accent-rgb),.06)", border:"1px solid rgba(var(--accent-rgb),.2)", borderRadius:12, padding:"14px 16px", marginTop:10 }}>
            <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:6 }}>Based on your fitness, a realistic 12-week goal:</div>
            <div style={{ ...MONO, fontSize:24, color:AC, fontWeight:700, marginBottom:2 }}>{fmtSecs(realisticSug.time)}</div>
            <div style={{ fontSize:11, color:"rgba(245,245,240,.45)" }}>{DIST_LABELS[goalDist]} · already applied to the fields above</div>
          </div>
        )}

        {goalError && <div style={{ color:"#F87171", fontSize:12, marginTop:10 }}>{goalError}</div>}
        <CTABtn onClick={proceedToConfirm} disabled={!(parseInt(gMin)||parseInt(gSec))}>See My Plan →</CTABtn>
      </div>
    );
  }

  function Step4Hyrox() {
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Goal</Eyebrow>
        <Heading>Your target<br/><span style={{color:AC}}>finish time.</span></Heading>
        <div style={{ fontSize:13, color:"rgba(245,245,240,.6)", marginBottom:20 }}>
          Current: <span style={{...MONO, color:"#f5f5f0"}}>{fmtSecs(currentHyroxSecs)}</span>
        </div>
        <div style={{ fontSize:12, color:"rgba(245,245,240,.6)", marginBottom:8 }}>Goal finish time:</div>
        <HMSInput hVal={goalH} mVal={goalM} sVal={goalS} onH={setGoalH} onM={setGoalM} onS={setGoalS} />
        {goalError && <div style={{ color:"#F87171", fontSize:12, marginTop:10 }}>{goalError}</div>}
        <CTABtn onClick={proceedToConfirm}>See My Plan →</CTABtn>
      </div>
    );
  }

  // ── Step 5: Plan Confirmation ────────────────────────────────────────────────
  function Step5Running() {
    const gs = parseMMSS(gMin, gSec);
    const goalVdot = gs > 0 && vdot ? vdotFromRaceTime(DIST_METERS[goalDist], gs / 60) : vdot;
    const weeks = (vdot && goalVdot) ? recommendPlanWeeks(vdot, goalVdot) : 12;
    const paces = vdot ? trainingPaces(vdot) : null;

    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Your Plan</Eyebrow>
        <Heading>Your plan<br/><span style={{color:AC}}>is ready.</span></Heading>

        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:16, padding:"20px", marginTop:20, marginBottom:20 }}>
          <SummaryRow label="Current" value={fmtSecs(baselineSecs)} sub={DIST_LABELS[actualDist]} />
          <SummaryRow label="Goal" value={fmtSecs(gs)} sub={DIST_LABELS[goalDist]} accent />
          <SummaryRow label="Plan length" value={`${weeks} weeks`} />
          {trainDays.length > 0 && (
            <SummaryRow label="Training days" value={trainDays.join(" · ")} />
          )}

          {paces && (
            <>
              <div style={{ height:1, background:"rgba(255,255,255,.08)", margin:"14px 0" }}/>
              <div style={{ ...MONO, fontSize:10, color:"rgba(245,245,240,.4)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Your training paces</div>
              <PaceRow label="Easy" value={formatPace(paces.easy)} />
              <PaceRow label="Tempo" value={formatPace(paces.tempo)} />
              <PaceRow label="Intervals" value={formatPace(paces.interval)} />
            </>
          )}

          <div style={{ height:1, background:"rgba(255,255,255,.08)", margin:"14px 0" }}/>
          <div style={{ fontSize:12, color:"rgba(245,245,240,.55)", lineHeight:1.6, fontStyle:"italic" }}>
            "Every session shows your personal paces — not generic effort levels."
          </div>
        </div>
        <CTABtn onClick={handleConfirm} loading={saving}>Start My Plan →</CTABtn>
      </div>
    );
  }

  function Step5Hyrox() {
    const gs = parseHMS(goalH, goalM, goalS);
    const data = calcHyroxTargets(currentHyroxSecs, gs);
    return (
      <div style={{ padding:"24px 20px 48px" }}>
        <Eyebrow>// Your Plan</Eyebrow>
        <Heading>Your Hyrox<br/><span style={{color:AC}}>plan is ready.</span></Heading>

        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.1)", borderRadius:16, padding:"20px", marginTop:20, marginBottom:20 }}>
          <SummaryRow label="Current time" value={fmtSecs(currentHyroxSecs)} />
          <SummaryRow label="Goal time" value={fmtSecs(gs)} accent />
          <SummaryRow label="Plan length" value={`${data.planWeeks} weeks`} />
          <SummaryRow label="Target run pace" value={data.goalKmPaceFormatted} />
          {trainDays.length > 0 && (
            <SummaryRow label="Training days" value={trainDays.join(" · ")} />
          )}

          <div style={{ height:1, background:"rgba(255,255,255,.08)", margin:"14px 0" }}/>
          <div style={{ fontSize:12, color:"rgba(245,245,240,.55)", lineHeight:1.6, fontStyle:"italic" }}>
            "Every session shows your personal pace and station targets."
          </div>
        </div>
        <CTABtn onClick={handleConfirm} loading={saving}>Start My Plan →</CTABtn>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  function renderStep() {
    if (isHyrox) {
      if (step === 1) return <Step1Hyrox />;
      if (step === 2) return <Step2Days />;
      if (step === 3) return <Step3Hyrox />;
      if (step === 4) return <Step4Hyrox />;
      if (step === 5) return <Step5Hyrox />;
    } else {
      if (step === 1) return <Step1Running />;
      if (step === 2) return <Step2Days />;
      if (step === 3) return <Step3Running />;
      if (step === 4) return <Step4Running />;
      if (step === 5) return <Step5Running />;
    }
    return null;
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000", zIndex:500, overflowY:"auto", display:"flex", flexDirection:"column" }}>
      <Header />
      <div style={{ flex:1 }}>
        {renderStep()}
      </div>
    </div>
  );
}
