// ─────────────────────────────────────────────────────────────────────────────
// WEEK EDITOR — ▲/▼ BUTTON reorder fallback (flagged off by default; main path is drag).
// Immune to pointer-capture / hit-testing / gesture-race / dead-zone. Kept so we're never blocked.
// Same B-model persistence as the drag version.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { WDAYS, DAY_CFG } from "../components.jsx";
import RecoveryRibbon from "./RecoveryRibbon.jsx";

const _AF = "'Archivo',sans-serif";
const _MO = "'DM Mono',monospace";

const _haptic = (style) => { try { Haptics.impact({ style }); } catch (_) {} };
function arrayMove(arr, from, to) { const a = arr.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); return a; }

function nextCycleStart(programStartDate) {
  const now = new Date();
  let startDow = 1;
  if (programStartDate) { const d = new Date(programStartDate); if (!isNaN(d.getTime())) startDow = d.getDay(); }
  let add = (startDow - now.getDay() + 7) % 7;
  if (add === 0) add = 7;
  const res = new Date(now); res.setDate(now.getDate() + add);
  return res;
}

function buildOrder(schedule, dayFocus, dayPlan) {
  return WDAYS.map((d) => {
    const mod = schedule?.[d] || "rest";
    return { id: d, mod, focus: dayFocus?.[d] || (DAY_CFG[mod] || DAY_CFG.rest).label, plan: dayPlan?.[d] || null };
  });
}

function ArrowBtn({ dir, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={dir === "up" ? "Move up" : "Move down"}
      style={{ width: 30, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "none", cursor: disabled ? "default" : "pointer", background: disabled ? "rgba(var(--cm-ink-rgb,10,10,10),.04)" : "rgba(var(--cm-accent-rgb,255,59,48),.10)", color: disabled ? "rgba(var(--cm-ink-rgb,10,10,10),.20)" : "var(--cm-accent,#FF3B30)", WebkitTapHighlightColor: "transparent", padding: 0 }}>
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir === "down" ? "rotate(180deg)" : "none" }}>
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  );
}

function DayCard({ session, slotDay, editing, canUp, canDown, onUp, onDown }) {
  const cfg = DAY_CFG[session.mod] || DAY_CFG.rest;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: 14, background: "var(--cm-paper,#fff)", boxShadow: "0 1px 3px rgba(0,0,0,.06)", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.06)" }}>
      <span style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", width: 34, flexShrink: 0, color: "rgba(var(--cm-ink-rgb,10,10,10),.55)" }}>{slotDay}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 15, color: "var(--cm-ink,#0A0A0A)", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.focus}</div>
        <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 9.5, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.40)", marginTop: 2 }}>{cfg.label}{session.plan?.run && session.plan?.lift ? " · RUN + LIFT" : ""}</div>
      </div>
      {editing && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <ArrowBtn dir="up" disabled={!canUp} onClick={onUp} />
          <ArrowBtn dir="down" disabled={!canDown} onClick={onDown} />
        </div>
      )}
    </div>
  );
}

export default function WeekEditorButtons({ schedule, dayFocus, wPrefs, profile, todayKey, onSave }) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(() => buildOrder(schedule, dayFocus, wPrefs?.dayPlan));
  const [saving, setSaving] = useState(false);
  const _snapshot = useRef(null);
  const _justSaved = useRef(false);

  useEffect(() => {
    if (_justSaved.current) { _justSaved.current = false; return; }
    if (!editing) setOrder(buildOrder(schedule, dayFocus, wPrefs?.dayPlan));
  }, [schedule, dayFocus, wPrefs?.dayPlan, editing]);

  const startEdit = () => { _snapshot.current = order; setEditing(true); };
  const cancelEdit = () => { setOrder(_snapshot.current || buildOrder(schedule, dayFocus, wPrefs?.dayPlan)); setEditing(false); };
  const move = (index, dir) => { const to = index + dir; if (to < 0 || to >= order.length) return; setOrder((cur) => arrayMove(cur, index, to)); _haptic(ImpactStyle.Light); };

  const save = async () => {
    const newSchedule = { ...(schedule || {}) };
    const newDayFocus = { ...(dayFocus || {}) };
    const hasHybrid = !!wPrefs?.dayPlan;
    const newDayPlan = hasHybrid ? { ...wPrefs.dayPlan } : null;
    order.forEach((sn, i) => { const d = WDAYS[i]; newSchedule[d] = sn.mod; newDayFocus[d] = sn.focus; if (hasHybrid) { if (sn.plan) newDayPlan[d] = sn.plan; else delete newDayPlan[d]; } });
    setSaving(true);
    try { _justSaved.current = true; await onSave?.({ schedule: newSchedule, dayFocus: newDayFocus, dayPlan: hasHybrid ? newDayPlan : undefined }); _haptic(ImpactStyle.Medium); setEditing(false); }
    catch (_) { _justSaved.current = false; } finally { setSaving(false); }
  };

  const start = nextCycleStart(profile?.program_start_date);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const rowTransition = reduce ? { duration: 0 } : { type: "spring", bounce: 0.16, duration: 0.34 };

  return (
    <div style={{ margin: "12px 16px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)" }}>Next week</div>
          <div style={{ marginTop: 3, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: _AF, fontWeight: 500, fontSize: 13, color: "rgba(var(--cm-ink-rgb,10,10,10),.6)" }}>starts</span>
            <span style={{ fontFamily: _MO, fontWeight: 500, fontSize: 15, color: "var(--cm-ink,#0A0A0A)" }}>{startStr}</span>
          </div>
        </div>
        {!editing ? (
          <button onClick={startEdit} style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cm-accent,#FF3B30)", background: "rgba(var(--cm-accent-rgb,255,59,48),.10)", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Edit</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={cancelEdit} disabled={saving} style={{ fontFamily: _AF, fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.55)", background: "transparent", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.18)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: "var(--cm-accent,#FF3B30)", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", WebkitTapHighlightColor: "transparent", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save week"}</button>
          </div>
        )}
      </div>
      <RecoveryRibbon mods={order.map((s) => s.mod)} />
      <div style={{ position: "relative" }}>
        {order.map((session, i) => (
          <motion.div key={session.id} layout transition={rowTransition} style={{ marginBottom: 8 }}>
            <DayCard session={session} slotDay={WDAYS[i]} editing={editing} canUp={i > 0} canDown={i < order.length - 1} onUp={() => move(i, -1)} onDown={() => move(i, 1)} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
