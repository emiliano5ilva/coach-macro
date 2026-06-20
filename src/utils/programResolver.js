// ─────────────────────────────────────────────────────────────────────────────
// Program resolver — READ-TIME canonical source of truth for "what program is
// this user on". Pure, side-effect-free, fully unit-testable. ZERO call sites
// this stage (Stage 1): nothing in the app imports these yet.
//
// Background: four fields can disagree about the current program —
//   current_program (write-only orphan), wprefs.splitType, wprefs.runPlan,
//   profile.run_race_type. The canonical key is wprefs._libraryId (the
//   PROGRAM_LIBRARY entry id, written by the live switch in activateProgramMode).
//   Given the id, EVERYTHING (mode, display name, splitType, run_race_type) is
//   derivable from the library entry — internally consistent by construction.
//
// resolveProgram() resolution priority:
//   (a) _libraryId resolves to an entry  → derive all (canonical, drift-proof).
//   (b) _libraryId missing/unresolvable  → reverse-resolve a single entry from
//       splitType / runPlan (onboarded-but-never-switched users + drifted rows).
//   (c) no clean entry match             → derive mode/name from existing fields
//       the way the UI does today, preferring splitType over the stale-sticky
//       run_race_type. NEVER returns worse data than the current UI.
// ─────────────────────────────────────────────────────────────────────────────

import { PROGRAM_LIBRARY } from "../programs.js";
import { PLAN_TO_RACE_TYPE } from "./runPlanUtils.js";

// Display labels for the degraded (c) path when only run_race_type survives.
const RACE_TYPE_LABEL = {
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half Marathon",
  marathon: "Marathon",
  general: "Running",
};

/**
 * Look up a PROGRAM_LIBRARY entry by its id.
 * @param {string} id
 * @returns {object|null} the library entry, or null if not found / no id.
 */
export function programFromId(id) {
  if (!id) return null;
  return PROGRAM_LIBRARY.find((p) => p.id === id) || null;
}

/**
 * The SINGLE id→derivation core. Maps a library entry to the canonical fields.
 * Mirrors activateProgramMode's mapping exactly so the write path (Stage 2 can
 * delegate to this) and the read path derive identically.
 *
 * mode vocabulary: 'hybrid-hyrox' | 'hyrox' | 'hybrid' | 'running' |
 *                  'conditioning' | 'lifting'
 *   (priority mirrors ProgramLibrary curMode: hyrox+hybrid > hyrox > hybrid >
 *    run > conditioning > lifting)
 *
 * @param {object} prog a PROGRAM_LIBRARY entry
 * @returns {{libraryId,mode,displayName,splitType,runRaceType,isRun,isHyrox,isHybrid,isConditioning}|null}
 */
export function deriveProgramFields(prog) {
  if (!prog) return null;
  const isRun = !!prog.isRun;
  const isHyrox = !!prog.isHyrox;
  const isHybrid = !!prog.isHybrid;
  const isConditioning = !!prog.isConditioning;

  const mode =
    isHyrox && isHybrid ? "hybrid-hyrox"
    : isHyrox ? "hyrox"
    : isHybrid ? "hybrid"
    : isRun ? "running"
    : isConditioning ? "conditioning"
    : "lifting";

  // splitType: run → null; hyrox/hybrid → entry.name; else (lifting/conditioning)
  // → splitKey || name. Matches activateProgramMode (which lumps conditioning
  // into the lifting branch).
  const splitType =
    isRun ? null
    : isHybrid || isHyrox ? prog.name
    : prog.splitKey || prog.name;

  const runRaceType = isRun ? (PLAN_TO_RACE_TYPE[prog.name] || "general") : null;

  return {
    libraryId: prog.id,
    mode,
    displayName: prog.name,
    splitType,
    runRaceType,
    isRun,
    isHyrox,
    isHybrid,
    isConditioning,
  };
}

/**
 * Reverse-resolve a single library entry from drifted/legacy wprefs fields.
 * Prefers an exact NAME match (most specific), then a unique splitKey match.
 * Returns null when ambiguous or unmatched (caller falls through to path (c)).
 * @param {object} wp wprefs
 * @returns {object|null} a single library entry, or null
 */
function inferEntryFromFields(wp) {
  const st = wp.splitType;
  const rp = wp.runPlan;

  if (st) {
    const byName = PROGRAM_LIBRARY.filter((p) => p.name === st);
    if (byName.length === 1) return byName[0];
    const bySplitKey = PROGRAM_LIBRARY.filter((p) => p.splitKey === st);
    if (bySplitKey.length === 1) return bySplitKey[0];
  }
  // runPlan only ever holds a run program name (set by activateProgramMode run branch).
  if (rp) {
    const byRun = PROGRAM_LIBRARY.filter((p) => p.isRun && p.name === rp);
    if (byRun.length === 1) return byRun[0];
  }
  return null;
}

/**
 * Canonical "what program is this user on", resolved from the messy persisted
 * fields with the priority documented at the top of this file.
 *
 * @param {object} wprefs the wprefs JSONB blob
 * @param {object} profile the profile (for run_race_type fallback only)
 * @returns {{libraryId:(string|null), mode:string, displayName:string,
 *            splitType:(string|null), runRaceType:(string|null), source:string}}
 *   `source` is a non-canonical tag identifying which path resolved it
 *   ('libraryId' | 'inferred' | 'fields:*' | 'empty') — useful for verifying
 *   migration and telemetry; consumers should ignore it.
 */
export function resolveProgram(wprefs, profile) {
  const wp = wprefs || {};

  // (a) Canonical — _libraryId resolves to an entry. Derive everything; the
  //     drifted splitType/runPlan/run_race_type are IGNORED, so the result is
  //     internally consistent and immune to the four-field drift bug.
  const byId = programFromId(wp._libraryId);
  if (byId) {
    const d = deriveProgramFields(byId);
    return {
      libraryId: byId.id,
      mode: d.mode,
      displayName: d.displayName,
      splitType: d.splitType,
      runRaceType: d.runRaceType,
      source: "libraryId",
    };
  }

  // (b) No canonical id → honor explicit mode FLAGS first. isHyrox/isHybrid are
  //     the app's authoritative discriminators today (sections.jsx:2529-2532), and
  //     they take precedence over splitType/run_race_type. This keeps a flagged
  //     hybrid/hyrox row classified identically to today even when splitType names
  //     a lifting program (e.g. a hybrid user whose lift-day split is 'Push/Pull/Legs').
  //     Order MUST match the live ladder: hyrox&&hybrid → hyrox → hybrid.
  const fHyrox = !!wp.isHyrox;
  const fHybrid = !!wp.isHybrid;
  if (fHyrox || fHybrid) {
    const mode =
      fHyrox && fHybrid ? "hybrid-hyrox"
      : fHyrox ? "hyrox"
      : "hybrid";
    const displayName =
      mode === "hybrid-hyrox" ? (wp.hybridTemplate || "Hyrox Hybrid")
      : mode === "hyrox" ? (wp.hyroxProgram || wp.splitType || "Hyrox")
      : (wp.hybridTemplate || wp.splitType || "Hybrid");
    return {
      libraryId: null,
      mode,
      displayName,
      splitType: wp.splitType ?? null,
      runRaceType: profile?.run_race_type ?? null,
      source: "flags",
    };
  }

  // (c) No flags — reverse-resolve a single entry from splitType / runPlan.
  //     Expose its id as the INFERRED libraryId (not yet persisted).
  const inferred = inferEntryFromFields(wp);
  if (inferred) {
    const d = deriveProgramFields(inferred);
    return {
      libraryId: inferred.id,
      mode: d.mode,
      displayName: d.displayName,
      splitType: d.splitType,
      runRaceType: d.runRaceType,
      source: "inferred",
    };
  }

  // (d) Degraded — derive from raw fields the way the UI does today, but PREFER
  //     splitType over run_race_type. run_race_type is the stale-sticky field
  //     that causes the "shows Marathon after switching to PPL" bug, so a
  //     splitType that clearly names a lifting program wins and we drop the
  //     stale race type. This is never worse than today's UI.
  const splitType = wp.splitType || null;
  const runPlan = wp.runPlan || null;
  const runRaceType = profile?.run_race_type || null;

  const splitLooksRun = splitType && /run|hybrid|hyrox/i.test(splitType);

  if (splitType && !splitLooksRun) {
    // splitType names a lifting program → trust it, ignore stale run_race_type.
    return {
      libraryId: null,
      mode: "lifting",
      displayName: splitType,
      splitType,
      runRaceType: null,
      source: "fields:splitType",
    };
  }
  if (runPlan) {
    return {
      libraryId: null,
      mode: "running",
      displayName: runPlan,
      splitType: null,
      runRaceType,
      source: "fields:runPlan",
    };
  }
  if (runRaceType) {
    return {
      libraryId: null,
      mode: "running",
      displayName: RACE_TYPE_LABEL[runRaceType] || "Running",
      splitType: null,
      runRaceType,
      source: "fields:run_race_type",
    };
  }
  if (splitType) {
    // splitType looked run/hybrid-ish but nothing else corroborated — still the
    // best name we have; treat as a named program rather than "No program set".
    return {
      libraryId: null,
      mode: splitLooksRun ? "hybrid" : "lifting",
      displayName: splitType,
      splitType,
      runRaceType: null,
      source: "fields:splitType-loose",
    };
  }
  return {
    libraryId: null,
    mode: "lifting",
    displayName: "No program set",
    splitType: null,
    runRaceType: null,
    source: "empty",
  };
}

/**
 * Single source of truth for "what program week to display". Prefers the real
 * program_current_week column; the program's total length is resolved from the
 * canonical program (same chain as resolveProgram) so callers don't re-derive it.
 *
 * Honesty rules:
 *  - program_current_week present → use it (clamped to [1, total]).
 *  - It's absent and the fallback weekNum OVERFLOWS the program length (the stale
 *    startDate-not-reset-on-switch case, Stage 5) → use the column if any, else
 *    week 1 — NEVER a misleading "complete" (e.g. 12/12) for a just-switched program.
 *  - No known total → just floor at 1.
 *
 * @param {number|null} programCurrentWeek  the program_current_week column value
 * @param {number} weekNum                  date-derived fallback (can be stale)
 * @param {object} wprefs
 * @param {object} profile
 * @returns {number} the week to display
 */
export function resolveDisplayWeek(programCurrentWeek, weekNum, wprefs, profile) {
  const raw = programCurrentWeek || weekNum || 1;
  const totalWks = programFromId(resolveProgram(wprefs, profile).libraryId)?.weeks || null;
  if (!totalWks) return Math.max(1, raw);
  const wk = raw > totalWks ? (programCurrentWeek || 1) : raw;
  return Math.max(1, Math.min(wk, totalWks));
}
