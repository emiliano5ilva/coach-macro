// ─────────────────────────────────────────────────────────────────────────────
// WEEK RECOVERY — coarse rules engine (v1). Keys off MODALITY ONLY, so it applies UNIVERSALLY to
// every program type (pure lift/PPL, pure run, Hyrox, hybrid). Honest to the data we have: there is
// no per-day intensity/focus metadata yet, so we deliberately do NOT infer leg-day or hard-vs-easy.
// R1/R4/R5 (which need that metadata) are intentionally OMITTED until the fast-follow adds it.
//
// A wrong warning is worse than none — only rules the coarse modality can evaluate truthfully ship.
// ─────────────────────────────────────────────────────────────────────────────

export const LOAD = { DEMANDING: "demanding", RECOVERY: "recovery", REST: "rest" };

// Modality → load state. training / run / hyrox = demanding; cardio = active recovery; rest = rest.
export function classifyLoad(mod) {
  if (!mod || mod === "rest") return LOAD.REST;
  if (mod === "cardio") return LOAD.RECOVERY;
  return LOAD.DEMANDING; // training, run, hyrox (+ any unknown non-rest) count as demanding
}

// Evaluate a week given an ordered array of modality strings (index = weekday slot).
// Returns per-day states + tripped rule flags + a summary, all derived from modality only.
export function evaluateWeek(mods) {
  const load = (mods || []).map(classifyLoad);
  const n = load.length;
  const conflict = new Array(n).fill(false);
  const flags = [];

  // R2 (reworded for v1 — no intensity data): two DEMANDING days back-to-back with no recovery/rest
  // buffer between them → conflict. (Original R2 needed hard/easy; this is the honest coarse version.)
  for (let i = 0; i < n - 1; i++) {
    if (load[i] === LOAD.DEMANDING && load[i + 1] === LOAD.DEMANDING) {
      conflict[i] = true; conflict[i + 1] = true;
      flags.push({ rule: "R2", severity: "conflict", days: [i, i + 1], reason: "Two demanding days back-to-back with no recovery between." });
    }
  }

  // R3: no rest day anywhere in the 7-day week → caution (week-level, not per-day).
  const hasRest = load.includes(LOAD.REST);
  if (!hasRest) flags.push({ rule: "R3", severity: "caution", days: [], reason: "No rest day this week." });

  const statuses = load.map((l, i) => ({ load: l, conflict: conflict[i] }));
  const conflictCount = flags.filter((f) => f.rule === "R2").length;
  const summary = conflictCount > 0
    ? `${conflictCount} conflict${conflictCount > 1 ? "s" : ""}`
    : (!hasRest ? "No rest day" : "Balanced");
  const worst = conflictCount > 0 ? "bad" : (!hasRest ? "warn" : "good"); // maps to --cm-bad/warn/good
  return { load, statuses, flags, hasRest, conflictCount, summary, worst };
}
