// RoutineBuilder — Part 2
// Build a named custom routine: add exercises from ExerciseBrowser, set sets/reps/notes,
// reorder with up/down controls, optionally start from a premade program split-day.
// Saves to the custom_routines Supabase table (Part 3).
// Used standalone (new routine) and for editing from MyRoutines (Part 4).
import React, { useState, useCallback, useMemo } from "react";
import ExerciseBrowser from "./ExerciseBrowser.jsx";
import { PROGRAMS_BY_DAYS, PROGRAM_LIBRARY } from "../programs.js";
import { sb } from "../client.js";

const _AF = "'Archivo',sans-serif";
const _MO = "'DM Mono',monospace";

// ── Push/pull/quad/posterior classifiers (same logic as muscleBalanceService) ──
const _PUSH = ["Barbell Bench Press","Incline Barbell Bench Press","Dumbbell Bench Press","Incline Dumbbell Press","Overhead Press","Dumbbell Shoulder Press","Cable Fly","Chest Dip","Push-Up","Push Up","Tricep Pushdown","Skull Crusher","Lateral Raise","Front Raise","Dips (Chest)","Close Grip Bench Press","Diamond Push Up","Incline Barbell Press","Decline Bench Press","Dumbbell Fly","DB Fly","Dumbbell Overhead Press","Arnold Press"];
const _PULL = ["Barbell Row","Dumbbell Row","DB Row","Cable Row","Pull-Up","Pull Up","Weighted Pull-Up","Chin-Up","Lat Pulldown","Face Pull","Band Pull-Apart","Rear Delt Fly","Barbell Curl","Hammer Curl","Deadlift","Romanian Deadlift","Barbell Row","Seated Cable Row","Reverse Fly","Upright Row"];
const _QUAD = ["Barbell Back Squat","Barbell Squat","Front Squat","Leg Press","Leg Extension","Walking Lunge","Bulgarian Split Squat","Step Up","Hack Squat","Goblet Squat","Bodyweight Squat","Air Squat","Reverse Lunge","Sumo Squat"];
const _POST = ["Romanian Deadlift","Deadlift","Hip Thrust","Glute Bridge","Leg Curl","Good Morning","Nordic Curl","Cable Pull Through","Barbell Hip Thrust","Dumbbell Hip Thrust","Hip Thrust Pulse","Donkey Kick","Cable Kickback","Glute Kickback","Dumbbell Romanian Deadlift"];

function classifyEx(name) {
  const cats = [];
  const n = name.toLowerCase();
  if (_PUSH.some(e => e.toLowerCase() === n)) cats.push("push");
  if (_PULL.some(e => e.toLowerCase() === n)) cats.push("pull");
  if (_QUAD.some(e => e.toLowerCase() === n)) cats.push("quad");
  if (_POST.some(e => e.toLowerCase() === n)) cats.push("post");
  return cats;
}

function computeBalance(exercises) {
  let push = 0, pull = 0, quad = 0, post = 0;
  (exercises || []).forEach(ex => {
    const cats = classifyEx(ex.name || "");
    if (cats.includes("push")) push++;
    if (cats.includes("pull")) pull++;
    if (cats.includes("quad")) quad++;
    if (cats.includes("post")) post++;
  });
  const warnings = [];
  if (push > 0 && pull === 0) warnings.push(`${push} push exercise${push>1?"s":""}, 0 pull — consider adding a row or pull-up.`);
  else if (pull > 0 && push === 0) warnings.push(`${pull} pull exercise${pull>1?"s":""}, 0 push — consider adding a press.`);
  else if (push > 0 && pull > 0 && push / pull >= 2) warnings.push(`${push} push vs ${pull} pull — slightly push-dominant. Consider balancing.`);
  if (quad > 0 && post === 0) warnings.push(`${quad} quad exercise${quad>1?"s":""}, 0 posterior chain — add a hip hinge or glute movement.`);
  else if (post > 0 && quad === 0 && quad !== post) { /* posterior-only is fine */ }
  return warnings;
}

// ── Build exercise list from a premade program split-day ──────────────────────
function exercisesFromProgramDay(splitKey, dayName, daysPerWeek = 4) {
  // Try the specific daysPerWeek bucket first, then scan all buckets
  const buckets = [PROGRAMS_BY_DAYS[daysPerWeek], ...Object.values(PROGRAMS_BY_DAYS)];
  for (const bucket of buckets) {
    if (!bucket?.splits?.[splitKey]?.workouts?.[dayName]) continue;
    return bucket.splits[splitKey].workouts[dayName].map(ex => ({
      name: ex.name, sets: ex.sets || 3, reps: ex.reps || "10", notes: ex.notes || "", primary: !!ex.primary,
    }));
  }
  return [];
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function ExRowField({ label, value, onChange, type = "text", small = false }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: _MO, fontWeight: 500, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.4)", marginBottom: 3 }}>{label}</div>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box", background: "rgba(var(--cm-ink-rgb,10,10,10),.05)",
          border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.1)", borderRadius: 8,
          padding: small ? "6px 8px" : "8px 10px", fontFamily: _AF, fontSize: 13,
          color: "var(--cm-ink,#0A0A0A)", outline: "none",
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// existingRoutine: { id, name, exercises } — if set, starts in edit mode
export default function RoutineBuilder({ user, existingRoutine, onSaved, onCancel }) {
  const [name, setName] = useState(existingRoutine?.name || "");
  const [exercises, setExercises] = useState(() =>
    (existingRoutine?.exercises || []).map((ex, i) => ({ ...ex, _id: i }))
  );
  const [showBrowser, setShowBrowser] = useState(false);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [pickedProgram, setPickedProgram] = useState(null); // PROGRAM_LIBRARY entry
  const [pickedDay, setPickedDay] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [nextId, setNextId] = useState(existingRoutine?.exercises?.length || 0);

  const balanceWarnings = useMemo(() => computeBalance(exercises), [exercises]);
  const addedNames = useMemo(() => new Set(exercises.map(e => e.name)), [exercises]);

  // ── Exercise CRUD ──────────────────────────────────────────────────────────
  const addExercise = useCallback((ex) => {
    setExercises(prev => [...prev, { name: ex.name, sets: 3, reps: "10-12", notes: "", primary: true, _id: nextId }]);
    setNextId(n => n + 1);
  }, [nextId]);

  const removeExercise = useCallback((id) => {
    setExercises(prev => prev.filter(e => e._id !== id));
  }, []);

  const updateExercise = useCallback((id, field, value) => {
    setExercises(prev => prev.map(e => e._id === id ? { ...e, [field]: value } : e));
  }, []);

  const moveUp = useCallback((idx) => {
    if (idx === 0) return;
    setExercises(prev => { const a = [...prev]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; });
  }, []);

  const moveDown = useCallback((idx) => {
    setExercises(prev => { if (idx >= prev.length-1) return prev; const a = [...prev]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a; });
  }, []);

  // ── Program import ─────────────────────────────────────────────────────────
  const importFromProgram = useCallback(() => {
    if (!pickedProgram || !pickedDay) return;
    const prog = PROGRAM_LIBRARY.find(p => p.id === pickedProgram);
    if (!prog) return;
    const exs = exercisesFromProgramDay(prog.splitKey, pickedDay);
    if (!exs.length) return;
    let nid = nextId;
    const mapped = exs.map(ex => ({ ...ex, _id: nid++ }));
    setExercises(mapped);
    setNextId(nid);
    setShowProgramPicker(false);
    setPickedProgram(null);
    setPickedDay(null);
  }, [pickedProgram, pickedDay, nextId]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const save = useCallback(async () => {
    if (!name.trim()) { setError("Give your routine a name."); return; }
    if (exercises.length === 0) { setError("Add at least one exercise."); return; }
    setError("");
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: name.trim(),
        exercises: exercises.map(({ _id, ...rest }) => rest), // strip _id before saving
        updated_at: new Date().toISOString(),
      };
      if (existingRoutine?.id) {
        const { error: e } = await sb.from("custom_routines").update(payload).eq("id", existingRoutine.id);
        if (e) throw e;
        onSaved?.({ ...existingRoutine, ...payload, exercises: payload.exercises });
      } else {
        const { data, error: e } = await sb.from("custom_routines").insert(payload).select().single();
        if (e) throw e;
        onSaved?.(data);
      }
    } catch (e) {
      setError("Couldn't save — check your connection.");
      console.error("[RoutineBuilder save]", e);
    } finally {
      setSaving(false);
    }
  }, [name, exercises, user, existingRoutine, onSaved]);

  // ── Program picker popup ───────────────────────────────────────────────────
  if (showProgramPicker) {
    const prog = pickedProgram ? PROGRAM_LIBRARY.find(p => p.id === pickedProgram) : null;
    // Get available day names from PROGRAMS_BY_DAYS for the chosen splitKey
    const getDayNames = (splitKey) => {
      for (const bucket of Object.values(PROGRAMS_BY_DAYS)) {
        const split = bucket.splits?.[splitKey];
        if (split?.workouts) return split.days.filter(d => split.workouts[d]);
      }
      return [];
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--cm-paper,#fff)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0" }}>
          <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 18, color: "var(--cm-ink,#0A0A0A)" }}>
            {prog ? "Choose a Session" : "Start from a Program"}
          </div>
          <button onClick={() => { setShowProgramPicker(false); setPickedProgram(null); setPickedDay(null); }}
            style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)", WebkitTapHighlightColor: "transparent" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>
          {!prog ? (
            // Step 1: pick a program
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PROGRAM_LIBRARY.map(p => (
                <button key={p.id} onClick={() => setPickedProgram(p.id)}
                  style={{ background: "rgba(var(--cm-ink-rgb,10,10,10),.04)", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.08)", borderRadius: 14, padding: "14px 16px", textAlign: "left", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                  <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 15, color: "var(--cm-ink,#0A0A0A)", marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontFamily: _AF, fontWeight: 500, fontSize: 12, color: "rgba(var(--cm-ink-rgb,10,10,10),.5)" }}>{p.days} days · {p.level} · {p.category}</div>
                </button>
              ))}
            </div>
          ) : (
            // Step 2: pick a day
            <div>
              <div style={{ fontFamily: _AF, fontWeight: 600, fontSize: 13, color: "rgba(var(--cm-ink-rgb,10,10,10),.55)", marginBottom: 14 }}>
                Choose a session from <strong>{prog.name}</strong>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {getDayNames(prog.splitKey).map(d => (
                  <button key={d}
                    onClick={() => { setPickedDay(d); }}
                    style={{
                      background: pickedDay === d ? "rgba(var(--cm-accent-rgb,255,59,48),.10)" : "rgba(var(--cm-ink-rgb,10,10,10),.04)",
                      border: `1.5px solid ${pickedDay === d ? "var(--cm-accent,#FF3B30)" : "rgba(var(--cm-ink-rgb,10,10,10),.08)"}`,
                      borderRadius: 12, padding: "12px 16px", textAlign: "left", cursor: "pointer", WebkitTapHighlightColor: "transparent",
                      fontFamily: _AF, fontWeight: 700, fontSize: 15, color: "var(--cm-ink,#0A0A0A)",
                    }}>
                    {d}
                  </button>
                ))}
              </div>
              {pickedDay && (
                <button onClick={importFromProgram}
                  style={{ marginTop: 20, width: "100%", background: "var(--cm-accent,#FF3B30)", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontFamily: _AF, fontWeight: 800, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
                  Import {pickedDay} →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Exercise browser overlay ───────────────────────────────────────────────
  if (showBrowser) {
    return (
      <ExerciseBrowser
        pickerMode
        addedNames={addedNames}
        onPick={ex => { addExercise(ex); }}
        onClose={() => setShowBrowser(false)}
      />
    );
  }

  // ── Main builder UI ────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--cm-paper,#fff)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0", flexShrink: 0 }}>
        <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 18, color: "var(--cm-ink,#0A0A0A)" }}>
          {existingRoutine ? "Edit Routine" : "New Routine"}
        </div>
        {onCancel && (
          <button onClick={onCancel} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)", WebkitTapHighlightColor: "transparent" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        )}
      </div>

      <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px", WebkitOverflowScrolling: "touch" }}>
        {/* Routine name */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: _MO, fontWeight: 500, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.4)", marginBottom: 6 }}>Routine name</div>
          <input
            value={name} onChange={e => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Push A, Legs Day, Upper Hypertrophy"
            style={{
              width: "100%", boxSizing: "border-box",
              background: "rgba(var(--cm-ink-rgb,10,10,10),.05)",
              border: "1.5px solid rgba(var(--cm-ink-rgb,10,10,10),.12)", borderRadius: 12,
              padding: "13px 14px", fontFamily: _AF, fontSize: 16, color: "var(--cm-ink,#0A0A0A)", outline: "none",
            }}
          />
        </div>

        {/* Import from program CTA (only when exercise list is empty) */}
        {exercises.length === 0 && (
          <button onClick={() => setShowProgramPicker(true)}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "rgba(var(--cm-ink-rgb,10,10,10),.04)", border: "1.5px dashed rgba(var(--cm-ink-rgb,10,10,10),.16)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", marginBottom: 14, WebkitTapHighlightColor: "transparent" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="rgba(var(--cm-ink-rgb,10,10,10),.45)" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 14, color: "var(--cm-ink,#0A0A0A)" }}>Start from a premade program</div>
              <div style={{ fontFamily: _AF, fontWeight: 500, fontSize: 12, color: "rgba(var(--cm-ink-rgb,10,10,10),.5)", marginTop: 2 }}>Import a day from any program and customise from there</div>
            </div>
          </button>
        )}

        {/* Balance warning */}
        {balanceWarnings.length > 0 && (
          <div style={{ background: "rgba(255,180,0,.08)", border: "1px solid rgba(255,180,0,.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            {balanceWarnings.map((w, i) => (
              <div key={i} style={{ fontFamily: _AF, fontWeight: 500, fontSize: 12, color: "#8a6000", lineHeight: 1.5 }}>
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}

        {/* Exercise list */}
        {exercises.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: _MO, fontWeight: 500, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.4)", marginBottom: 8 }}>
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exercises.map((ex, idx) => (
                <div key={ex._id} style={{ background: "rgba(var(--cm-ink-rgb,10,10,10),.04)", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.07)", borderRadius: 14, padding: "12px 14px" }}>
                  {/* Row 1: name + reorder + delete */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    {/* Up/down */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                      <button onClick={() => moveUp(idx)} disabled={idx === 0}
                        style={{ background: "none", border: "none", padding: "2px 6px", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "rgba(var(--cm-ink-rgb,10,10,10),.2)" : "rgba(var(--cm-ink-rgb,10,10,10),.5)", WebkitTapHighlightColor: "transparent" }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === exercises.length - 1}
                        style={{ background: "none", border: "none", padding: "2px 6px", cursor: idx === exercises.length-1 ? "default" : "pointer", color: idx === exercises.length-1 ? "rgba(var(--cm-ink-rgb,10,10,10),.2)" : "rgba(var(--cm-ink-rgb,10,10,10),.5)", WebkitTapHighlightColor: "transparent" }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </div>
                    <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 14, color: "var(--cm-ink,#0A0A0A)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.name}</div>
                    <button onClick={() => removeExercise(ex._id)}
                      style={{ background: "none", border: "none", padding: "4px 6px", cursor: "pointer", color: "rgba(255,59,48,.55)", flexShrink: 0, WebkitTapHighlightColor: "transparent" }}>
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>
                  {/* Row 2: sets / reps / notes */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <ExRowField label="Sets" value={ex.sets} onChange={v => updateExercise(ex._id, "sets", parseInt(v) || ex.sets)} type="number" small />
                    <ExRowField label="Reps" value={ex.reps} onChange={v => updateExercise(ex._id, "reps", v)} small />
                    <ExRowField label="Notes" value={ex.notes} onChange={v => updateExercise(ex._id, "notes", v)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add exercise button */}
        <button onClick={() => setShowBrowser(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(var(--cm-accent-rgb,255,59,48),.08)", border: "1.5px dashed rgba(var(--cm-accent-rgb,255,59,48),.3)", borderRadius: 14, padding: "14px 0", cursor: "pointer", WebkitTapHighlightColor: "transparent", marginBottom: 4 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--cm-accent,#FF3B30)" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span style={{ fontFamily: _AF, fontWeight: 800, fontSize: 13, color: "var(--cm-accent,#FF3B30)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Add Exercise</span>
        </button>

        {exercises.length > 0 && (
          <button onClick={() => setShowProgramPicker(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "transparent", border: "1.5px dashed rgba(var(--cm-ink-rgb,10,10,10),.15)", borderRadius: 14, padding: "12px 0", cursor: "pointer", WebkitTapHighlightColor: "transparent", marginTop: 8 }}>
            <span style={{ fontFamily: _AF, fontWeight: 600, fontSize: 12, color: "rgba(var(--cm-ink-rgb,10,10,10),.45)", letterSpacing: "0.04em" }}>Replace with premade program day</span>
          </button>
        )}
      </div>

      {/* Footer: error + save */}
      <div style={{ padding: "12px 16px", flexShrink: 0, borderTop: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.06)" }}>
        {error && (
          <div style={{ fontFamily: _AF, fontWeight: 500, fontSize: 12, color: "#FF3B30", marginBottom: 8 }}>{error}</div>
        )}
        <button onClick={save} disabled={saving}
          style={{ width: "100%", background: saving ? "rgba(var(--cm-accent-rgb,255,59,48),.5)" : "var(--cm-accent,#FF3B30)", color: "#fff", border: "none", borderRadius: 14, padding: "15px 0", fontFamily: _AF, fontWeight: 800, fontSize: 15, letterSpacing: "0.04em", textTransform: "uppercase", cursor: saving ? "default" : "pointer" }}>
          {saving ? "Saving…" : existingRoutine ? "Save Changes" : "Save Routine"}
        </button>
      </div>
    </div>
  );
}
