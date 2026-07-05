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

// ── Auto-arrange solver ──────────────────────────────────────────────────────
// Weighted violation score for a modality sequence (reuses the same rules the ribbon shows).
function violationScore(mods) {
  const { flags } = evaluateWeek(mods);
  let s = 0;
  for (const f of flags) s += f.rule === "R2" ? 3 : f.rule === "R3" ? 2 : 1;
  return s;
}

// Heap's algorithm — invoke cb(perm) for every permutation of `arr` (arr mutated in place).
function permute(arr, cb) {
  const n = arr.length, c = new Array(n).fill(0);
  cb(arr);
  let i = 0;
  while (i < n) {
    if (c[i] < i) {
      const k = i % 2 ? c[i] : 0;
      const t = arr[i]; arr[i] = arr[k]; arr[k] = t;
      cb(arr);
      c[i]++; i = 0;
    } else { c[i] = 0; i++; }
  }
}

// Enumerate permutations that keep FIXED slots pinned. Structurally-locked days (the long-run day,
// any other anchored session) must NOT be relocated by the solver — moving a fixed long run to shave
// an R2 count produces a structurally-illegal week. Only the non-fixed session slots permute among
// themselves; each fixed slot keeps its own session.
function permuteConstrained(n, fixed, cb) {
  const fixedSet = new Set(fixed || []);
  const freeSlots = [];
  for (let i = 0; i < n; i++) if (!fixedSet.has(i)) freeSlots.push(i);
  permute(freeSlots.slice(), (fv) => {
    const perm = new Array(n);
    for (let i = 0; i < n; i++) if (fixedSet.has(i)) perm[i] = i;   // fixed session stays in its slot
    for (let k = 0; k < freeSlots.length; k++) perm[freeSlots[k]] = fv[k];
    cb(perm);
  });
}

// Suggest a LEGAL reordering of `sessions` (array of {id, mod, ...}) that MINIMIZES rule violations
// with the LEAST disruption. `opts.fixed` = slot indices that must stay put (e.g. the long-run day) —
// the solver never moves them, so it only ever proposes structurally-legal weeks. Returns
// { order, moved:[slotIdx], score, wasScore } or null when reordering can't legally improve.
export function suggestWeek(sessions, opts = {}) {
  const n = sessions.length;
  const fixed = opts.fixed || [];
  const baseScore = violationScore(sessions.map((s) => s.mod));
  if (baseScore === 0) return null; // already clean
  let bestPerm = null, bestScore = baseScore, bestDisruption = Infinity;
  permuteConstrained(n, fixed, (perm) => {
    const score = violationScore(perm.map((i) => sessions[i].mod));
    if (score > bestScore) return;
    let disruption = 0;
    for (let j = 0; j < n; j++) if (perm[j] !== j) disruption++;
    if (score < bestScore || (score === bestScore && disruption < bestDisruption)) {
      bestScore = score; bestDisruption = disruption; bestPerm = perm.slice();
    }
  });
  if (!bestPerm || bestScore >= baseScore) return null; // no legal improvement possible
  const order = bestPerm.map((i) => sessions[i]);
  const moved = [];
  for (let j = 0; j < n; j++) if (bestPerm[j] !== j) moved.push(j);
  return { order, moved, score: bestScore, wasScore: baseScore };
}

// Honest note when the best-available arrangement STILL has unavoidable conflicts (e.g. many
// demanding days + few rest). Returns null when the week is fully clean (no note needed).
export function balanceNote(sessions) {
  const mods = (sessions || []).map((s) => s.mod);
  const { flags } = evaluateWeek(mods);
  if (!flags.length) return null;
  const rest = mods.filter((m) => m === "rest").length;
  const demanding = mods.filter((m) => classifyLoad(m) === "demanding");
  const allRun = demanding.length > 0 && demanding.every((m) => m === "run");
  const dLabel = allRun ? "run" : "training";
  return `Best balance with ${demanding.length} ${dLabel} day${demanding.length !== 1 ? "s" : ""} and ${rest} rest — some back-to-back is unavoidable at this volume.`;
}

// Coach-voice copy for the Save warning modal — plain, brief, non-alarmist, day-named.
// Top 1-2 issues only (no wall of text). slotNames = WDAYS (index → "Mon"…). Returns [{head, body}].
export function warningCopy(flags, slotNames) {
  const lines = [];
  const r2 = (flags || []).filter((f) => f.rule === "R2");
  const r3 = (flags || []).find((f) => f.rule === "R3");
  if (r2.length) {
    const f = r2[0];
    const a = slotNames?.[f.days[0]] ?? "one day";
    const b = slotNames?.[f.days[1]] ?? "the next";
    const more = r2.length > 1 ? ` (and ${r2.length - 1} more like it)` : "";
    lines.push({
      head: `Two demanding days back-to-back — ${a} + ${b}${more}.`,
      body: "Stacking hard days without a recovery day between can blunt both — your body adapts during rest, not just training.",
    });
  }
  if (r3) {
    lines.push({
      head: "No rest day this week.",
      body: "At least one full rest day helps you recover and come back stronger.",
    });
  }
  return lines.slice(0, 2);
}
