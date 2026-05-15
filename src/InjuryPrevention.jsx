import React, { useState } from "react";
import { T } from "./components.jsx";
import { getInjuryFreeDays, detectPatterns, logInjury } from "./services/injuryRisk.js";

const REGION_RECS = {
  shoulder: {
    avoid: ["Overhead pressing","Lateral raises","Upright rows"],
    do: ["Back-focused sessions","Face pulls","Band pull aparts"],
  },
  elbow: {
    avoid: ["Heavy curls","Skull crushers","Close-grip bench"],
    do: ["Straight arm exercises","Leg/back sessions","Wrist mobility"],
  },
  knee: {
    avoid: ["Heavy squats","Lunges","Leg extensions"],
    do: ["Upper body focused","Swimming/bike (if available)","Gentle mobility"],
  },
  lower_back: {
    avoid: ["Deadlifts","Bent-over rows","Good mornings"],
    do: ["Upper body pressing","Core stabilization","Hip flexor stretches"],
  },
  hip: {
    avoid: ["Hip thrusts","Deep squats","Lunges"],
    do: ["Upper body focused","Gentle hip mobility","Walking"],
  },
};

const PAIN_REGIONS = ["shoulder","elbow","wrist","lower_back","hip","knee","ankle","neck","other"];
const PAIN_TYPES = [["soreness","Soreness"],["sharp_pain","Sharp Pain"],["stiffness","Stiffness"],["weakness","Weakness"],["swelling","Swelling"]];

// ─── InjuryHistorySection ─────────────────────────────────────────────────────
export function InjuryHistorySection({ injuryLogs, injuryRisks, onResolve, onLogNew }) {
  const freeDays = getInjuryFreeDays(injuryLogs);
  const patterns = detectPatterns(injuryLogs);
  const displayDays = freeDays !== null ? freeDays : 0;
  const hasMilestone30 = displayDays >= 30;
  const hasMilestone90 = displayDays >= 90;
  const hasMilestone180 = displayDays >= 180;

  return (
    <div style={{ margin: "0 20px 14px" }}>
      {/* Streak card */}
      <div style={{ padding: "16px", background: "rgba(34,197,94,0.07)", border: "1.5px solid rgba(34,197,94,0.25)", borderRadius: 14, marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: T.green, lineHeight: 1 }}>{displayDays}</div>
        <div style={{ fontSize: 11, color: "rgba(245,245,240,.5)", letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700, marginTop: 4 }}>
          {freeDays !== null ? "INJURY FREE DAYS 🛡️" : "KEEP THE STREAK GOING 🛡️"}
        </div>
        {/* Milestone badges */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
          {[{ days: 30, label: "30 Days" }, { days: 90, label: "90 Days" }, { days: 180, label: "180 Days" }].map(({ days, label }) => {
            const earned = displayDays >= days;
            return (
              <span key={days} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: ".08em",
                background: earned ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.04)",
                color: earned ? T.green : "rgba(245,245,240,.2)",
                border: `1px solid ${earned ? "rgba(34,197,94,.3)" : "rgba(255,255,255,.08)"}` }}>
                {earned ? "✓ " : ""}{label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      {(injuryLogs || []).length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>Injury Log</div>
          {(injuryLogs || []).slice(0, 8).map(log => {
            const sev = log.severity || 1;
            const sevColor = sev >= 3 ? "#ef4444" : sev >= 2 ? "#f97316" : "#eab308";
            return (
              <div key={log.id} style={{ padding: "10px 12px", background: T.s1, border: `1px solid ${T.bd}`, borderRadius: 10, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", textTransform: "capitalize" }}>
                      {(log.body_region || "").replace("_", " ")}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: `${sevColor}18`, color: sevColor, border: `1px solid ${sevColor}30` }}>
                      {sev >= 3 ? "HIGH" : sev >= 2 ? "MOD" : "MILD"}
                    </span>
                    {log.resolved_at && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: "rgba(34,197,94,.12)", color: T.green, border: "1px solid rgba(34,197,94,.25)" }}>✓ Resolved</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: T.mu }}>
                    {(log.pain_type || "").replace("_", " ")} · {new Date(log.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                {!log.resolved_at && (
                  <button onClick={() => onResolve?.(log.id)} style={{ padding: "5px 10px", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.25)", borderRadius: 7, color: T.green, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pattern analysis */}
      {patterns.length > 0 && (
        <div style={{ padding: "12px 14px", background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.2)", borderRadius: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Pattern Analysis</div>
          {patterns.map((p, i) => (
            <div key={i} style={{ fontSize: 12, color: "rgba(245,245,240,.7)", lineHeight: 1.6, marginBottom: i < patterns.length - 1 ? 4 : 0 }}>• {p}</div>
          ))}
        </div>
      )}

      <button onClick={onLogNew} style={{ width: "100%", padding: "12px", background: `${T.prot}15`, border: `1px solid ${T.prot}30`, borderRadius: 12, color: T.prot, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer" }}>
        Log New Injury / Pain →
      </button>
    </div>
  );
}

// ─── InjuryRiskModal ──────────────────────────────────────────────────────────
export function InjuryRiskModal({ risk, region, onProtect, onOverride, onClose }) {
  const recs = REGION_RECS[region] || { avoid: [], do: [] };
  const label = (region || "").replace("_", " ").toUpperCase();
  const isHigh = risk?.level === "HIGH";
  const color = isHigh ? "#ef4444" : "#f97316";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.94)", backdropFilter: "blur(10px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0A1222", border: "1px solid rgba(255,255,255,.12)", borderRadius: "18px 18px 0 0", padding: "24px 20px 40px", maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />

        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>Injury Prevention</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24, fontWeight: 900, marginBottom: 6 }}>{label}</div>
        <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", background: `${color}18`, color, border: `1px solid ${color}35`, marginBottom: 18 }}>{risk?.level} RISK</span>

        {/* What I noticed */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>What I noticed</div>
          <div style={{ padding: "12px 14px", background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "rgba(245,245,240,.8)", lineHeight: 1.7 }}>
              {risk?.acwrRatio > 1 && <div>• Training load {Math.round((risk.acwrRatio - 1) * 100)}% above your average this week (ACWR: {risk.acwrRatio})</div>}
              {risk?.priorInjuries > 0 && <div>• {risk.priorInjuries} prior injury incident{risk.priorInjuries > 1 ? "s" : ""} logged for this region</div>}
              {risk?.recentPain > 0 && <div>• Pain reported in this area within the last 14 days</div>}
              {risk?.score != null && <div>• Risk score: {risk.score}/100</div>}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>My Recommendation — Next 5 Days</div>
          <div style={{ marginBottom: 8 }}>
            {recs.avoid.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                <span style={{ color: "#ef4444", fontSize: 13, flexShrink: 0 }}>✗</span>
                <span style={{ fontSize: 12, color: "rgba(245,245,240,.7)" }}>{item}</span>
              </div>
            ))}
            {recs.do.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < recs.do.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                <span style={{ color: T.green, fontSize: 13, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: "rgba(245,245,240,.7)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onProtect} style={{ width: "100%", padding: "14px", background: color, border: "none", borderRadius: 12, color: "#fff", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer", marginBottom: 10 }}>
          Protect My {(region || "").replace("_", " ")} →
        </button>
        <button onClick={onOverride} style={{ width: "100%", padding: "12px", background: "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "rgba(245,245,240,.4)", fontFamily: "inherit", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Override — I feel fine
        </button>
      </div>
    </div>
  );
}

// ─── PainLogModal ─────────────────────────────────────────────────────────────
export function PainLogModal({ user, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [painLevel, setPainLevel] = useState(null);
  const [painRegions, setPainRegions] = useState([]);
  const [painType, setPainType] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user || !painRegions.length) return;
    setSaving(true);
    try {
      await onSave({ painLevel, painRegions, painType, notes: notes || null });
    } finally {
      setSaving(false);
    }
  }

  function toggleRegion(r) {
    setPainRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6,13,26,.92)", backdropFilter: "blur(8px)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0A1222", border: "1px solid rgba(255,255,255,.12)", borderRadius: "18px 18px 0 0", padding: "24px 20px 40px", maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 32, height: 3, background: "rgba(255,255,255,.15)", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 10, color: T.mu, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono',monospace" }}>Log Injury / Pain</div>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 900, marginBottom: 20 }}>What are you experiencing?</div>

        {/* Step 1: Pain level */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Pain level</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["none","😊 None"],["minor","😬 Minor"],["significant","😣 Significant"]].map(([v, l]) => (
              <button key={v} onClick={() => { setPainLevel(v); if (v === "none") { setPainRegions([]); setPainType(null); } }}
                style={{ flex: 1, padding: "10px 6px", borderRadius: 9, border: `1.5px solid ${painLevel === v ? T.prot : T.bd}`,
                  background: painLevel === v ? `${T.prot}18` : T.s2, color: painLevel === v ? T.prot : "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Step 2: Regions */}
        {(painLevel === "minor" || painLevel === "significant") && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Where? (select all that apply)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PAIN_REGIONS.map(r => {
                const sel = painRegions.includes(r);
                return (
                  <button key={r} onClick={() => toggleRegion(r)}
                    style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${sel ? T.prot : T.bd}`,
                      background: sel ? `${T.prot}18` : T.s2, color: sel ? T.prot : "#fff",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>
                    {r.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Pain type */}
        {(painLevel === "minor" || painLevel === "significant") && painRegions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>What kind?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PAIN_TYPES.map(([v, l]) => (
                <button key={v} onClick={() => setPainType(v)}
                  style={{ padding: "7px 12px", borderRadius: 8, border: `1.5px solid ${painType === v ? T.prot : T.bd}`,
                    background: painType === v ? `${T.prot}18` : T.s2, color: painType === v ? T.prot : "#fff",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {(painLevel === "minor" || painLevel === "significant") && painRegions.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: T.mu, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Notes (optional)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..."
              style={{ width: "100%", padding: "10px 12px", background: T.s2, color: "#fff", border: `1px solid ${T.bd}`, borderRadius: 10, fontSize: 12, fontFamily: "inherit", resize: "none", height: 72, boxSizing: "border-box" }} />
          </div>
        )}

        <button onClick={handleSave}
          disabled={saving || !painLevel || ((painLevel === "minor" || painLevel === "significant") && painRegions.length === 0)}
          style={{ width: "100%", padding: "14px", background: painLevel ? T.prot : "rgba(255,255,255,.06)",
            color: painLevel ? "#fff" : "rgba(245,245,240,.3)", border: "none", borderRadius: 12,
            fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 15, letterSpacing: ".08em",
            textTransform: "uppercase", cursor: painLevel ? "pointer" : "not-allowed", marginBottom: 10, transition: "all .2s" }}>
          {saving ? "Saving..." : "Save Log →"}
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "12px", background: "transparent", color: "rgba(245,245,240,.4)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── ActiveWorkoutRiskBanner ──────────────────────────────────────────────────
export function ActiveWorkoutRiskBanner({ risks, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  if (!risks || !risks.length || dismissed) return null;
  const top = risks[0];

  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13, color: "#ef4444", letterSpacing: ".06em", textTransform: "uppercase" }}>
          ⚠️ {(top.region || "").replace("_", " ").toUpperCase()} RISK ELEVATED
        </div>
        <div style={{ fontSize: 11, color: "rgba(245,245,240,.5)", marginTop: 2 }}>Consider reducing volume by 1 set</div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={() => setDismissed(true)} style={{ padding: "5px 10px", background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 7, color: "#ef4444", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Adjust</button>
        <button onClick={() => { setDismissed(true); onDismiss?.(); }} style={{ padding: "5px 10px", background: "transparent", border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, color: "rgba(245,245,240,.4)", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Proceed</button>
      </div>
    </div>
  );
}
