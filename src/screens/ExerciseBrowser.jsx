// ExerciseBrowser — Part 1
// Standalone exercise library (replaces the mislabelled "Exercise Library" program browser)
// AND a reusable picker for RoutineBuilder. Organises exercises by muscle group → sub-region
// using EXERCISE_MUSCLE_MAP as primary source (deepest data), falling back to
// CANONICAL_EXERCISE_DATA for exercises not covered there.
import React, { useState, useMemo } from "react";
import { EXERCISE_MUSCLE_MAP } from "../data/exerciseMuscleMap.js";
import { CANONICAL_EXERCISE_DATA } from "../data/canonicalExerciseData.js";

const _AF = "'Archivo',sans-serif";
const _MO = "'DM Mono',monospace";

// ── Group hierarchy: top-level muscle group → ordered sub-regions ──────────────
const GROUP_HIERARCHY = [
  { key: "Chest",      label: "Chest",      subs: ["Sternal Pec","Clavicular Pec"] },
  { key: "Shoulders",  label: "Shoulders",  subs: ["Anterior Delt","Medial Delt","Rear Delt","Supraspinatus"] },
  { key: "Back",       label: "Back",       subs: ["Lats","Teres Major","Upper Traps","Mid Traps","Rhomboids","Lower Back","Serratus"] },
  { key: "Biceps",     label: "Biceps",     subs: ["Long Head Bicep","Short Head Bicep","Brachialis"] },
  { key: "Triceps",    label: "Triceps",    subs: ["Long Head Tricep","Lateral Head Tricep","Medial Head Tricep","Anconeus"] },
  { key: "Forearms",   label: "Forearms",   subs: ["Forearms"] },
  { key: "Quads",      label: "Quads",      subs: ["Rectus Femoris","Vastus Lateralis","Vastus Medialis","Vastus Intermedius"] },
  { key: "Hamstrings", label: "Hamstrings", subs: ["Biceps Femoris","Semitendinosus","Semimembranosus"] },
  { key: "Glutes",     label: "Glutes",     subs: ["Gluteus Maximus","Gluteus Medius","Gluteus Minimus","Adductors"] },
  { key: "Calves",     label: "Calves",     subs: ["Calves"] },
  { key: "Core",       label: "Core",       subs: ["Abs","Core","Obliques","Hip Flexors"] },
];

// Muscle → group key lookup
const MUSCLE_TO_GROUP = {};
GROUP_HIERARCHY.forEach(g => g.subs.forEach(s => { MUSCLE_TO_GROUP[s] = g.key; }));

// Coarse canonical group → our group key
const CANONICAL_GROUP_MAP = {
  chest: "Chest", shoulders: "Shoulders", back: "Back",
  biceps: "Biceps", triceps: "Triceps", forearms: "Forearms",
  quadriceps: "Quads", quads: "Quads", hamstrings: "Hamstrings",
  glutes: "Glutes", calves: "Calves", core: "Core", abs: "Core",
  legs: "Quads",
};

// ── Build the unified exercise index ─────────────────────────────────────────
function buildExerciseIndex() {
  const index = {}; // name → { name, group, subregion, primary, secondary, note }

  // Primary source: EXERCISE_MUSCLE_MAP (fine-grained muscles)
  Object.entries(EXERCISE_MUSCLE_MAP).forEach(([name, data]) => {
    const primary = data.primary || [];
    const groupKey = primary.map(m => MUSCLE_TO_GROUP[m]).find(Boolean) || "Core";
    // Sub-region = the primary muscle with the finest granularity
    const sub = primary[0] || groupKey;
    index[name] = { name, group: groupKey, subregion: sub, primary, secondary: data.secondary || [], note: data.note || null, fromMap: true };
  });

  // Fallback: CANONICAL_EXERCISE_DATA for exercises not in the muscle map
  Object.entries(CANONICAL_EXERCISE_DATA).forEach(([name, data]) => {
    if (index[name]) return; // already covered
    const groupKey = CANONICAL_GROUP_MAP[data.group?.toLowerCase?.()] || null;
    if (!groupKey) return;
    const primary = data.primary || [];
    const sub = primary[0] || groupKey;
    index[name] = { name, group: groupKey, subregion: sub, primary, secondary: data.secondary || [], note: null, fromMap: false };
  });

  return index;
}

const EXERCISE_INDEX = buildExerciseIndex();

// Grouped: { groupKey: { subregion: [exercise,...] } }
const GROUPED = (() => {
  const g = {};
  GROUP_HIERARCHY.forEach(grp => { g[grp.key] = {}; });
  Object.values(EXERCISE_INDEX).forEach(ex => {
    if (!g[ex.group]) return;
    if (!g[ex.group][ex.subregion]) g[ex.group][ex.subregion] = [];
    g[ex.group][ex.subregion].push(ex);
  });
  // Sort exercises within each subregion alphabetically
  Object.values(g).forEach(grp => Object.values(grp).forEach(arr => arr.sort((a,b) => a.name.localeCompare(b.name))));
  return g;
})();

// ── Pill chip ─────────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: _AF, fontWeight: active ? 800 : 600, fontSize: 12,
      letterSpacing: "0.04em", textTransform: "uppercase",
      color: active ? "#fff" : "rgba(var(--cm-ink-rgb,10,10,10),.65)",
      background: active ? "var(--cm-accent,#FF3B30)" : "rgba(var(--cm-ink-rgb,10,10,10),.07)",
      border: "none", borderRadius: 20, padding: "7px 14px",
      cursor: "pointer", whiteSpace: "nowrap", WebkitTapHighlightColor: "transparent", flexShrink: 0,
    }}>
      {label}
    </button>
  );
}

// ── Exercise card ─────────────────────────────────────────────────────────────
function ExerciseCard({ ex, pickerMode, onPick, alreadyAdded }) {
  const primaryStr = ex.primary.slice(0, 2).join(" · ");
  const secondaryStr = ex.secondary.slice(0, 2).join(" · ");
  return (
    <div style={{
      background: "var(--cm-paper,#fff)",
      border: "1px solid rgba(var(--cm-ink-rgb,10,10,10),.07)",
      borderRadius: 14, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,.05)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: _AF, fontWeight: 700, fontSize: 15, color: "var(--cm-ink,#0A0A0A)", lineHeight: 1.2, marginBottom: 4 }}>
          {ex.name}
        </div>
        {primaryStr && (
          <div style={{ fontFamily: _AF, fontWeight: 600, fontSize: 11, color: "var(--cm-accent,#FF3B30)", letterSpacing: "0.04em" }}>
            {primaryStr}
          </div>
        )}
        {secondaryStr && (
          <div style={{ fontFamily: _AF, fontWeight: 500, fontSize: 11, color: "rgba(var(--cm-ink-rgb,10,10,10),.45)", marginTop: 1 }}>
            {secondaryStr}
          </div>
        )}
        {ex.note && (
          <div style={{ fontFamily: _AF, fontWeight: 400, fontSize: 11, color: "rgba(var(--cm-ink-rgb,10,10,10),.5)", marginTop: 4, lineHeight: 1.4, fontStyle: "italic" }}>
            {ex.note}
          </div>
        )}
      </div>
      {pickerMode && (
        <button onClick={() => onPick?.(ex)} disabled={alreadyAdded}
          style={{
            flexShrink: 0, fontFamily: _AF, fontWeight: 800, fontSize: 12,
            letterSpacing: "0.04em", textTransform: "uppercase",
            color: alreadyAdded ? "rgba(var(--cm-ink-rgb,10,10,10),.35)" : "#fff",
            background: alreadyAdded ? "rgba(var(--cm-ink-rgb,10,10,10),.08)" : "var(--cm-accent,#FF3B30)",
            border: "none", borderRadius: 10, padding: "8px 14px",
            cursor: alreadyAdded ? "default" : "pointer",
            WebkitTapHighlightColor: "transparent",
          }}>
          {alreadyAdded ? "Added" : "+ Add"}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// pickerMode: true → shows "+ Add" buttons, calls onPick(exercise)
// addedNames: Set of exercise names already in the routine (to show "Added")
export default function ExerciseBrowser({ pickerMode = false, onPick, addedNames, onClose }) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(null); // null = All

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q && !activeGroup) return null; // null → show grouped browse
    return Object.values(EXERCISE_INDEX).filter(ex => {
      const nameMatch = !q || ex.name.toLowerCase().includes(q);
      const groupMatch = !activeGroup || ex.group === activeGroup;
      return nameMatch && groupMatch;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [search, activeGroup]);

  const added = addedNames instanceof Set ? addedNames : new Set(addedNames || []);

  // Header
  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0", flexShrink: 0 }}>
      <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 18, color: "var(--cm-ink,#0A0A0A)" }}>
        {pickerMode ? "Add Exercise" : "Exercise Library"}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)", WebkitTapHighlightColor: "transparent" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      )}
    </div>
  );

  // Search bar
  const searchBar = (
    <div style={{ padding: "10px 16px 0", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(var(--cm-ink-rgb,10,10,10),.06)", borderRadius: 12, padding: "10px 14px" }}>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="rgba(var(--cm-ink-rgb,10,10,10),.4)" strokeWidth={2} strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises…"
          style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: _AF, fontSize: 14, color: "var(--cm-ink,#0A0A0A)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        )}
      </div>
    </div>
  );

  // Group filter chips
  const groupChips = (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", display: "flex", gap: 6, padding: "10px 16px 0", flexShrink: 0 }}>
      <Chip label="All" active={!activeGroup} onClick={() => setActiveGroup(null)} />
      {GROUP_HIERARCHY.map(g => (
        <Chip key={g.key} label={g.label} active={activeGroup === g.key} onClick={() => setActiveGroup(g.key === activeGroup ? null : g.key)} />
      ))}
    </div>
  );

  // Content
  const content = filtered ? (
    // Search / filtered list
    <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", flex: 1, padding: "12px 16px" }}>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", fontFamily: _AF, fontSize: 14, color: "rgba(var(--cm-ink-rgb,10,10,10),.4)" }}>
          No exercises found
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(ex => (
            <ExerciseCard key={ex.name} ex={ex} pickerMode={pickerMode} onPick={onPick} alreadyAdded={added.has(ex.name)} />
          ))}
        </div>
      )}
    </div>
  ) : (
    // Grouped browse view
    <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", flex: 1, padding: "12px 16px" }}>
      {GROUP_HIERARCHY.map(grp => {
        const subsForGroup = Object.entries(GROUPED[grp.key] || {}).filter(([, arr]) => arr.length > 0);
        if (subsForGroup.length === 0) return null;
        return (
          <div key={grp.key} style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: _AF, fontWeight: 800, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--cm-accent,#FF3B30)", marginBottom: 10 }}>
              {grp.label}
            </div>
            {subsForGroup.map(([sub, exs]) => (
              <div key={sub} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: _MO, fontWeight: 500, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(var(--cm-ink-rgb,10,10,10),.45)", marginBottom: 6 }}>
                  {sub}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {exs.map(ex => (
                    <ExerciseCard key={ex.name} ex={ex} pickerMode={pickerMode} onPick={onPick} alreadyAdded={added.has(ex.name)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(var(--cm-ink-rgb,10,10,10),.03)" }}>
      {header}
      {searchBar}
      {groupChips}
      {content}
    </div>
  );
}
