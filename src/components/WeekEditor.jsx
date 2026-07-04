// ─────────────────────────────────────────────────────────────────────────────
// WEEK EDITOR — hybrid-aware, next-cycle template editor.
// MAIN PATH: drag-to-reorder (grab anywhere on a row, GLOBAL window listeners, positions measured
// at grab, index by midpoint crossing). Window-scroll on Edit lifts the list above the tab bar
// (window is the real scroll parent; .app-screen never scrolls).
// FALLBACK: ▲/▼ buttons (WeekEditorButtons) behind USE_BUTTON_FALLBACK — flip if drag regresses.
//
// KNOWN EDGE CASE (not chased separately): under heavy reorder/Save use the lower rows can
// intermittently stop responding to drag (couldn't reproduce reliably; scrolling them up does NOT
// revive them, so it's distinct from the tab-bar dead-zone). Likely the auto-scroll occasionally
// not clearing the rows and/or a post-Save state edge. The real fix — a bounded edit panel that
// renders all 7 rows in a guaranteed-clear zone with NO scroll dependency — is folded into the
// Stage-5 persistence rework (next-cycle deferral), which removes the scroll reliance entirely.
//
// MODEL: weekday slots are FIXED (Mon..Sun, positional); the user drags SESSIONS between slots.
// On Save we dual-write schedule + dayFocus + dayPlan by slot (B model — a dragged session keeps its
// identity; autoFocus never relabels it). Persistence is delegated to the parent via onSave.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, animate, useReducedMotion } from "motion/react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { WDAYS, DAY_CFG } from "../components.jsx";
import WeekEditorButtons from "./WeekEditorButtons.jsx";
import RecoveryRibbon from "./RecoveryRibbon.jsx";
import WeekWarningModal from "./WeekWarningModal.jsx";
import { evaluateWeek, suggestWeek, balanceNote } from "../utils/weekRecovery.js";

const USE_BUTTON_FALLBACK = false; // flip to true to use the ▲/▼ button reorder instead of drag

const _AF = "'Archivo',sans-serif";
const _MO = "'DM Mono',monospace";
const HOLD_MS = 180;
const MOVE_TOL = 8;
const ROW_GAP = 8;

const _haptic = (style) => { try { Haptics.impact({ style }); } catch (_) {} };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
function arrayMove(arr, from, to) { const a = arr.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); return a; }

function siblingOffset(j, s, c, step) {
  if (c > s && j > s && j <= c) return -step;
  if (c < s && j >= c && j < s) return step;
  return 0;
}

function nextCycleStart(programStartDate) {
  const now = new Date();
  let startDow = 1;
  if (programStartDate) { const d = new Date(programStartDate); if (!isNaN(d.getTime())) startDow = d.getDay(); }
  let add = (startDow - now.getDay() + 7) % 7;
  if (add === 0) add = 7;
  const res = new Date(now); res.setDate(now.getDate() + add);
  return res;
}

// Read safe-area insets via an env() probe (getComputedStyle resolves the env to px).
function readSafeAreas() {
  try {
    const p = document.createElement("div");
    p.style.cssText = "position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;";
    document.body.appendChild(p);
    const cs = getComputedStyle(p);
    const t = parseFloat(cs.paddingTop) || 0, b = parseFloat(cs.paddingBottom) || 0;
    document.body.removeChild(p);
    return { safeTop: t, safeBottom: b };
  } catch (_) { return { safeTop: 0, safeBottom: 0 }; }
}

function buildOrder(schedule, dayFocus, dayPlan) {
  return WDAYS.map((d) => {
    const mod = schedule?.[d] || "rest";
    return { id: d, mod, focus: dayFocus?.[d] || (DAY_CFG[mod] || DAY_CFG.rest).label, plan: dayPlan?.[d] || null };
  });
}

function DayCard({ session, slotDay, editing, lifted }) {
  const cfg = DAY_CFG[session.mod] || DAY_CFG.rest;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", borderRadius: 14,
      background: "var(--cm-paper,#fff)",
      boxShadow: lifted ? "0 14px 34px rgba(0,0,0,.22)" : "0 1px 3px rgba(0,0,0,.06)",
      border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.06)",
      transform: lifted ? "scale(1.03)" : "none",
      transition: "box-shadow 160ms ease, transform 160ms ease",
      userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none",
    }}>
      {editing && (
        <div aria-hidden="true" style={{ flexShrink: 0, width: 26, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(var(--cm-ink-rgb,10,10,10),.32)", marginLeft: -2 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="6" r="1.6"/><circle cx="16" cy="6" r="1.6"/>
            <circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/>
            <circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/>
          </svg>
        </div>
      )}
      <span style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", width: 34, flexShrink: 0, color: "rgba(var(--cm-ink-rgb,10,10,10),.55)" }}>{slotDay}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 15, color: "var(--cm-ink,#0A0A0A)", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.focus}</div>
        <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 9.5, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.40)", marginTop: 2 }}>{cfg.label}{session.plan?.run && session.plan?.lift ? " · RUN + LIFT" : ""}</div>
      </div>
    </div>
  );
}

function WeekEditorDrag({ schedule, dayFocus, wPrefs, profile, todayKey, onSave, notify }) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(() => buildOrder(schedule, dayFocus, wPrefs?.dayPlan));
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(null);
  const [sheetMaxH, setSheetMaxH] = useState(0); // computed from REAL innerHeight, not 100vh
  const [warnFlags, setWarnFlags] = useState(null); // rule flags → Save warning modal (null = hidden)
  const [suggesting, setSuggesting] = useState(false); // "thinking" beat while the solver runs
  const [healing, setHealing] = useState(false);       // gate Motion `layout` to the heal only

  const dragMV = useMotionValue(0);
  const listRef = useRef(null);
  const _snapshot = useRef(null);
  const _justSaved = useRef(false);
  const orderRef = useRef(order); orderRef.current = order;
  const reduceRef = useRef(reduce); reduceRef.current = reduce;
  const g = useRef({ pointerId: null, grabY: 0, startIdx: 0, curIdx: 0, step: 62, grabbed: false, hold: null, tops: [], heights: [] });

  useEffect(() => {
    if (_justSaved.current) { _justSaved.current = false; return; }
    if (!editing) setOrder(buildOrder(schedule, dayFocus, wPrefs?.dayPlan));
  }, [schedule, dayFocus, wPrefs?.dayPlan, editing]);

  const startEdit = () => {
    _snapshot.current = order;
    // Cap the sheet to the REAL viewport (100vh over-reports in this WKWebView). Panel = space between
    // (safeTop + 16) from the top and (safeBottom + 108) from the bottom → top always positive.
    const { safeTop, safeBottom } = readSafeAreas();
    setSheetMaxH(Math.max(280, Math.round(window.innerHeight - (safeBottom + 108) - (safeTop + 16))));
    setEditing(true);
  };
  const cancelEdit = () => { detach(); setDrag(null); setWarnFlags(null); dragMV.set(0); setOrder(_snapshot.current || buildOrder(schedule, dayFocus, wPrefs?.dayPlan)); setEditing(false); };

  const onWinMove = useCallback((e) => {
    const st = g.current;
    const dy0 = e.clientY - st.grabY;
    if (!st.grabbed) { if (Math.abs(dy0) > MOVE_TOL) { clearTimeout(st.hold); } return; }
    e.preventDefault?.();
    const n = st.tops.length; if (!n) return;
    const s = st.startIdx;
    const origTop = st.tops[s];
    const dy = clamp(dy0, st.tops[0] - origTop, st.tops[n - 1] - origTop);
    dragMV.set(dy);
    const draggedCenter = origTop + st.heights[s] / 2 + dy;
    let ci = 0, best = Infinity;
    for (let j = 0; j < n; j++) { const c = st.tops[j] + st.heights[j] / 2; const d = Math.abs(draggedCenter - c); if (d < best) { best = d; ci = j; } }
    if (ci !== st.curIdx) { st.curIdx = ci; setDrag((d) => (d ? { ...d, currentIndex: ci } : d)); _haptic(ImpactStyle.Light); }
  }, []);

  const detach = useCallback(() => {
    window.removeEventListener("pointermove", onWinMove);
    window.removeEventListener("pointerup", onWinUp);
    window.removeEventListener("pointercancel", onWinUp);
  }, [onWinMove]);

  const onWinUp = useCallback(() => {
    const st = g.current;
    detach();
    clearTimeout(st.hold);
    if (!st.grabbed) return;
    st.grabbed = false;
    _haptic(ImpactStyle.Light);
    const s = st.startIdx, to = st.curIdx;
    const targetY = (st.tops[to] ?? st.tops[s]) - st.tops[s];
    const settle = () => { if (s !== to) setOrder((cur) => arrayMove(cur, s, to)); dragMV.set(0); setDrag(null); };
    if (reduceRef.current) settle();
    else animate(dragMV, targetY, { type: "spring", bounce: 0, duration: 0.28, onComplete: settle });
  }, [detach]);

  useEffect(() => () => { window.removeEventListener("pointermove", onWinMove); window.removeEventListener("pointerup", onWinUp); window.removeEventListener("pointercancel", onWinUp); }, [onWinMove, onWinUp]);

  const onRowPointerDown = (e, index) => {
    if (!editing || drag) return;
    const st = g.current;
    st.pointerId = e.pointerId; st.grabY = e.clientY; st.startIdx = index; st.curIdx = index; st.grabbed = false;
    window.addEventListener("pointermove", onWinMove, { passive: false });
    window.addEventListener("pointerup", onWinUp);
    window.addEventListener("pointercancel", onWinUp);
    clearTimeout(st.hold);
    st.hold = setTimeout(() => {
      const kids = listRef.current ? Array.from(listRef.current.children) : [];
      const rects = kids.map((k) => k.getBoundingClientRect());
      st.tops = rects.map((r) => r.top);
      st.heights = rects.map((r) => r.height || 62);
      st.step = rects.length > 1 ? (st.tops[rects.length - 1] - st.tops[0]) / (rects.length - 1) : (st.heights[0] || 62);
      st.grabbed = true;
      dragMV.set(0);
      setDrag({ id: orderRef.current[index].id, startIndex: index, currentIndex: index });
      _haptic(ImpactStyle.Medium);
    }, HOLD_MS);
  };

  // Write the arranged week (B-model). `balanced` drives the parent's positive-vs-neutral toast.
  const persist = async (balanced) => {
    const newSchedule = { ...(schedule || {}) };
    const newDayFocus = { ...(dayFocus || {}) };
    const hasHybrid = !!wPrefs?.dayPlan;
    const newDayPlan = hasHybrid ? { ...wPrefs.dayPlan } : null;
    order.forEach((sn, i) => { const d = WDAYS[i]; newSchedule[d] = sn.mod; newDayFocus[d] = sn.focus; if (hasHybrid) { if (sn.plan) newDayPlan[d] = sn.plan; else delete newDayPlan[d]; } });
    setSaving(true);
    try { _justSaved.current = true; await onSave?.({ schedule: newSchedule, dayFocus: newDayFocus, dayPlan: hasHybrid ? newDayPlan : undefined, balanced }); _haptic(ImpactStyle.Medium); setWarnFlags(null); setEditing(false); }
    catch (_) { _justSaved.current = false; } finally { setSaving(false); }
  };

  // Save runs the SAME rules the ribbon uses. Any trip → warn (don't persist); clean → save silently.
  const save = () => {
    const { flags } = evaluateWeek(order.map((s) => s.mod));
    if (flags.length) { _haptic(ImpactStyle.Light); setWarnFlags(flags); return; }
    persist(true);
  };

  // The solver's proposal for the current week (null when reordering can't help — e.g. pure R3).
  const suggestion = useMemo(() => (warnFlags ? suggestWeek(order) : null), [warnFlags, order]);
  const locked = suggesting || healing; // no drag / no Save-Cancel while the coach rearranges

  // "Use Coach Macro's suggestion": brief coach-thinking beat → close modal → animate the heal
  // (Motion `layout`) into the suggested order. NOT auto-saved — the user confirms, then Saves.
  const applySuggestion = () => {
    if (!suggestion) { setWarnFlags(null); return; }
    const sug = suggestion;                               // capture BEFORE any state change (suggestion depends on warnFlags)
    setSuggesting(true);                                  // brief "Thinking…" beat on the modal button

    // PHASE 1 — after the beat, DISMISS the modal first. Do NOT start the heal yet.
    setTimeout(() => {
      setSuggesting(false);
      setWarnFlags(null);                                 // modal card exit spring (~400ms) + backdrop fade begin

      // PHASE 2 — wait for the modal to fully clear, THEN play the heal in the open, unblurred editor.
      setTimeout(() => {
        setHealing(true);                                 // lock editor + "✨ Rearranging…", enable Motion `layout`
        requestAnimationFrame(() => {                     // reorder next frame so `layout` snapshots the old positions
          setOrder(sug.order);
          _haptic(ImpactStyle.Medium);
        });

        // PHASE 3 — after the staggered slide settles: unlock, then the honest toast in the clear.
        setTimeout(() => {
          setHealing(false);
          _haptic(ImpactStyle.Light);
          const note = balanceNote(sug.order);            // honest "best possible" when conflicts are unavoidable
          if (note) notify?.(note);
        }, 950);
      }, 460);                                            // modal exit (~400ms spring) + a hair of clearance
    }, 460);                                              // "Thinking…" beat
  };

  const start = nextCycleStart(profile?.program_start_date);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  // Header + ribbon + rows — rendered inline (read-only) OR inside the fixed edit sheet.
  const bodyInner = (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12, flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)" }}>Next week</div>
          <div style={{ marginTop: 3, display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: _AF, fontWeight: 500, fontSize: 13, color: "rgba(var(--cm-ink-rgb,10,10,10),.6)" }}>starts</span>
            <span style={{ fontFamily: _MO, fontWeight: 500, fontSize: 15, color: "var(--cm-ink,#0A0A0A)" }}>{startStr}</span>
          </div>
        </div>
        {!editing ? (
          <button onClick={startEdit} style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cm-accent,#FF3B30)", background: "rgba(var(--cm-accent-rgb,255,59,48),.10)", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Edit</button>
        ) : locked ? (
          <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cm-accent,#FF3B30)", background: "rgba(var(--cm-accent-rgb,255,59,48),.10)", borderRadius: 10, padding: "8px 12px", whiteSpace: "nowrap" }}>✨ Rearranging…</div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={cancelEdit} disabled={saving} style={{ fontFamily: _AF, fontWeight: 700, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.55)", background: "transparent", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.18)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: "var(--cm-accent,#FF3B30)", border: "none", borderRadius: 10, padding: "8px 16px", cursor: "pointer", WebkitTapHighlightColor: "transparent", opacity: saving ? 0.6 : 1 }}>{saving ? "Saving…" : "Save week"}</button>
          </div>
        )}
      </div>

      {/* Recovery-load ribbon — recolors live as the week reorders (rules v1: R2 + R3). */}
      <RecoveryRibbon mods={order.map((s) => s.mod)} />

      <div ref={listRef} style={{ position: "relative", ...(editing ? { minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", margin: "0 -4px", padding: "0 4px" } : {}) }}>
        {order.map((session, i) => {
          const isDragged = drag && drag.id === session.id;
          const off = drag && !isDragged ? siblingOffset(i, drag.startIndex, drag.currentIndex, g.current.step) : 0;
          return (
            <motion.div
              key={session.id}
              layout={healing}
              onPointerDown={editing && !locked ? (e) => onRowPointerDown(e, i) : undefined}
              style={{ position: "relative", marginBottom: ROW_GAP, zIndex: isDragged ? 30 : 1, touchAction: editing && !locked ? "none" : undefined, userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", cursor: editing && !locked ? "grab" : "default", ...(isDragged ? { y: dragMV } : {}) }}
              // Only pin the manual y during an active drag; during the heal (drag idle) leave it to
              // Motion `layout` so the cards physically slide into their new slots.
              animate={drag && !isDragged ? { y: off } : (healing ? undefined : { y: 0 })}
              transition={isDragged ? undefined : (reduce ? { duration: 0 } : (healing ? { type: "spring", bounce: 0.26, duration: 0.5, delay: i * 0.05 } : { type: "spring", bounce: 0, duration: 0.26 }))}
            >
              <DayCard session={session} slotDay={WDAYS[i]} editing={editing} lifted={!!isDragged} />
            </motion.div>
          );
        })}
      </div>
    </>
  );

  // Read-only inline; Edit opens a FIXED bottom-sheet anchored ABOVE the tab bar (z-index over it),
  // so all 7 rows always sit in a reachable zone regardless of page scroll or what's added above them.
  return (
    <>
      {!editing && <div style={{ margin: "12px 16px 16px" }}>{bodyInner}</div>}
      {/* Portal to document.body so the fixed sheet escapes .cm-paper-card's `will-change:transform`
           containing block and anchors to the REAL viewport (else it resolves against the ~379px card). */}
      {createPortal(
      <AnimatePresence>
        {editing && (
          <motion.div key="wk-backdrop" onClick={cancelEdit}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
        )}
        {editing && (
          // Bounded on BOTH ends: bottom clears the tab bar; maxHeight (which subtracts the bottom
          // anchor + top safe-margin) prevents any top overflow. Sheet is a flex column with
          // overflow:hidden — header + ribbon pin, only the row list scrolls internally.
          <motion.div key="wk-sheet"
            initial={{ y: "115%" }} animate={{ y: 0 }} exit={{ y: "115%" }}
            transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.12, duration: 0.4 }}
            style={{ position: "fixed", top: "auto", left: 8, right: 8, bottom: "calc(env(safe-area-inset-bottom, 0px) + 108px)", zIndex: 401, background: "var(--cm-paper,#fff)", borderRadius: 22, padding: "16px 16px 14px", maxHeight: sheetMaxH ? `${sheetMaxH}px` : "70vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 -10px 44px rgba(0,0,0,.34)" }}>
            {bodyInner}
          </motion.div>
        )}
      </AnimatePresence>,
      document.body)}
      <WeekWarningModal flags={warnFlags} slotNames={WDAYS} saving={saving} suggesting={suggesting} hasSuggestion={!!suggestion} onSuggest={applySuggestion} onKeep={() => persist(false)} onAdjust={() => setWarnFlags(null)} />
    </>
  );
}

export default function WeekEditor(props) {
  return USE_BUTTON_FALLBACK ? <WeekEditorButtons {...props} /> : <WeekEditorDrag {...props} />;
}
