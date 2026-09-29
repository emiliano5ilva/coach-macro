// MyRoutines — Part 4
// List of the user's saved custom routines with view/edit/duplicate/delete.
// Used standalone (from Train → "My Routines" menu entry) and as a picker in WeekEditor
// Custom day assignment (Part 5).
import React, { useState, useEffect, useCallback } from "react";
import RoutineBuilder from "./RoutineBuilder.jsx";
import { sb } from "../client.js";

const _AF = "'Archivo',sans-serif";
const _MO = "'DM Mono',monospace";

function musclePreview(exercises) {
  const names = (exercises || []).slice(0, 4).map(e => e.name).join(" · ");
  return names || "Empty routine";
}

// ── Single routine card ────────────────────────────────────────────────────────
function RoutineCard({ routine, onEdit, onDuplicate, onDelete, pickerMode, onPick }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{
      background: "var(--cm-paper,#fff)", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.07)",
      borderRadius: 16, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.05)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 17, color: "var(--cm-ink,#0A0A0A)", lineHeight: 1.2 }}>{routine.name}</div>
          <div style={{ fontFamily: _MO, fontWeight: 500, fontSize: 10, letterSpacing: "0.08em", color: "rgba(var(--cm-ink-rgb,10,10,10),.4)", marginTop: 3 }}>
            {(routine.exercises || []).length} exercise{(routine.exercises || []).length !== 1 ? "s" : ""}
          </div>
        </div>
        {!pickerMode && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(m => !m)}
              style={{ background: "rgba(var(--cm-ink-rgb,10,10,10),.06)", border: "none", borderRadius: 10, padding: "6px 10px", cursor: "pointer", WebkitTapHighlightColor: "transparent", color: "rgba(var(--cm-ink-rgb,10,10,10),.55)" }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
              </svg>
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100 }} />
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "var(--cm-paper,#fff)", border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.12)", borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 101, minWidth: 160, overflow: "hidden" }}>
                  {[
                    { label: "Edit", action: () => { setMenuOpen(false); onEdit(routine); }, color: "var(--cm-ink,#0A0A0A)" },
                    { label: "Duplicate", action: () => { setMenuOpen(false); onDuplicate(routine); }, color: "var(--cm-ink,#0A0A0A)" },
                    { label: "Delete", action: () => { setMenuOpen(false); onDelete(routine); }, color: "#FF3B30" },
                  ].map(item => (
                    <button key={item.label} onClick={item.action}
                      style={{ display: "block", width: "100%", background: "none", border: "none", padding: "13px 16px", textAlign: "left", fontFamily: _AF, fontWeight: 700, fontSize: 14, color: item.color, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{ fontFamily: _AF, fontWeight: 400, fontSize: 12, color: "rgba(var(--cm-ink-rgb,10,10,10),.5)", lineHeight: 1.5, marginBottom: pickerMode ? 10 : 0 }}>
        {musclePreview(routine.exercises)}
      </div>
      {pickerMode && (
        <button onClick={() => onPick?.(routine)}
          style={{ width: "100%", background: "var(--cm-accent,#FF3B30)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 0", fontFamily: _AF, fontWeight: 800, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", WebkitTapHighlightColor: "transparent", marginTop: 4 }}>
          Use This Routine →
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// pickerMode: true → shows "Use This Routine" button, calls onPickRoutine(routine)
// onPickRoutine: called in picker mode when user selects a routine
// onRoutinesChanged: called with updated routines list (for parent state sync)
export default function MyRoutines({ user, pickerMode = false, onPickRoutine, onBack, onRoutinesChanged }) {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // routine being edited
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null); // routine pending delete confirmation

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await sb.from("custom_routines").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    const loaded = data || [];
    setRoutines(loaded);
    onRoutinesChanged?.(loaded);
    setLoading(false);
  }, [user?.id, onRoutinesChanged]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = useCallback((saved) => {
    setRoutines(prev => {
      const idx = prev.findIndex(r => r.id === saved.id);
      const updated = idx >= 0 ? prev.map(r => r.id === saved.id ? saved : r) : [saved, ...prev];
      onRoutinesChanged?.(updated);
      return updated;
    });
    setEditing(null);
    setCreating(false);
  }, [onRoutinesChanged]);

  const handleDuplicate = useCallback(async (routine) => {
    const { data } = await sb.from("custom_routines").insert({
      user_id: user.id,
      name: routine.name + " (copy)",
      exercises: routine.exercises,
      updated_at: new Date().toISOString(),
    }).select().single();
    if (data) {
      setRoutines(prev => {
        const updated = [data, ...prev];
        onRoutinesChanged?.(updated);
        return updated;
      });
    }
  }, [user.id, onRoutinesChanged]);

  const handleDelete = useCallback(async (routine) => {
    await sb.from("custom_routines").delete().eq("id", routine.id);
    setRoutines(prev => {
      const updated = prev.filter(r => r.id !== routine.id);
      onRoutinesChanged?.(updated);
      return updated;
    });
    setDeleting(null);
  }, [onRoutinesChanged]);

  // ── Edit / Create ──────────────────────────────────────────────────────────
  if (creating) {
    return (
      <RoutineBuilder
        user={user}
        onSaved={handleSaved}
        onCancel={() => setCreating(false)}
      />
    );
  }
  if (editing) {
    return (
      <RoutineBuilder
        user={user}
        existingRoutine={editing}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // ── Delete confirmation ────────────────────────────────────────────────────
  const deleteModal = deleting && (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ background: "var(--cm-paper,#fff)", borderRadius: 20, padding: "24px", maxWidth: 320, width: "100%" }}>
        <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 17, color: "var(--cm-ink,#0A0A0A)", marginBottom: 8 }}>Delete "{deleting.name}"?</div>
        <div style={{ fontFamily: _AF, fontWeight: 500, fontSize: 13, color: "rgba(var(--cm-ink-rgb,10,10,10),.55)", marginBottom: 20 }}>This can't be undone. Any week slots using this routine will need to be reassigned.</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setDeleting(null)} style={{ flex: 1, background: "rgba(var(--cm-ink-rgb,10,10,10),.07)", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: _AF, fontWeight: 700, fontSize: 14, cursor: "pointer", color: "var(--cm-ink,#0A0A0A)", WebkitTapHighlightColor: "transparent" }}>Cancel</button>
          <button onClick={() => handleDelete(deleting)} style={{ flex: 1, background: "#FF3B30", border: "none", borderRadius: 12, padding: "12px 0", fontFamily: _AF, fontWeight: 800, fontSize: 14, cursor: "pointer", color: "#fff", WebkitTapHighlightColor: "transparent" }}>Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(var(--cm-ink-rgb,10,10,10),.02)" }}>
      {deleteModal}
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: "none", border: "none", padding: "4px 6px 4px 0", cursor: "pointer", color: "rgba(var(--cm-ink-rgb,10,10,10),.5)", WebkitTapHighlightColor: "transparent" }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 18, color: "var(--cm-ink,#0A0A0A)" }}>
            {pickerMode ? "Choose a Routine" : "My Routines"}
          </div>
        </div>
        {!pickerMode && (
          <button onClick={() => setCreating(true)}
            style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", color: "#fff", background: "var(--cm-accent,#FF3B30)", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
            + New
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px", WebkitOverflowScrolling: "touch" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: _AF, fontSize: 14, color: "rgba(var(--cm-ink-rgb,10,10,10),.4)" }}>Loading…</div>
        ) : routines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💪</div>
            <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 18, color: "var(--cm-ink,#0A0A0A)", marginBottom: 8 }}>No routines yet</div>
            <div style={{ fontFamily: _AF, fontWeight: 400, fontSize: 14, color: "rgba(var(--cm-ink-rgb,10,10,10),.5)", marginBottom: 24, lineHeight: 1.6 }}>Build a custom routine and it'll show up here. You can start from scratch or import from any premade program.</div>
            {!pickerMode && (
              <button onClick={() => setCreating(true)}
                style={{ background: "var(--cm-accent,#FF3B30)", color: "#fff", border: "none", borderRadius: 14, padding: "14px 28px", fontFamily: _AF, fontWeight: 800, fontSize: 15, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                Build Your First Routine →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {routines.map(r => (
              <RoutineCard
                key={r.id}
                routine={r}
                pickerMode={pickerMode}
                onEdit={setEditing}
                onDuplicate={handleDuplicate}
                onDelete={setDeleting}
                onPick={onPickRoutine}
              />
            ))}
            {!pickerMode && (
              <button onClick={() => setCreating(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", background: "rgba(var(--cm-accent-rgb,255,59,48),.06)", border: "1.5px dashed rgba(var(--cm-accent-rgb,255,59,48),.25)", borderRadius: 14, padding: "14px 0", cursor: "pointer", marginTop: 4, WebkitTapHighlightColor: "transparent" }}>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="var(--cm-accent,#FF3B30)" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                <span style={{ fontFamily: _AF, fontWeight: 800, fontSize: 12, color: "var(--cm-accent,#FF3B30)", letterSpacing: "0.04em", textTransform: "uppercase" }}>New Routine</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
