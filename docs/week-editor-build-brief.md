# Week Editor — Award-Targeted Build Brief

For: Claude Code CLI · Repo: ~/Developer/coach-macro · branch goclub-redesign
Target: replace the "Adjust my week" section in sections.jsx (the per-day chip rows ~5228-5262;
also REMOVE the duplicate single-letter pill row ~5299)
Reference: week-editor.html mock (2 states: edit/drag + warning modal)
Model decided: edits apply to NEXT CYCLE ("starts Mon [date]"), not the live week. This is a
template change, not a live-week scramble.
Companion: week-editor-build-spec.md (Drive) — fuller rules `sci` text + solver scoring.

## The bar

Flagship, Apple-Design-Award-targeted feature. Judged on how the DRAG FEELS and how the
intelligence is made VISIBLE, not on static layout. Motion, haptics, and type discipline are the
product. Build for feel; expect device eyeball rounds on motion + type.

## Prereqs

- Add @dnd-kit/sortable + @dnd-kit/core (no DnD lib installed; Motion v12 dropped Reorder).
- Confirm @capacitor/haptics installed; if not, add it.
- Verify --cm-accent-rgb / --cm-accent-deep resolve (proven via AdaptiveBanner + run-summary).

## Data model (confirmed)

- wprefs.schedule = day→modality (training/run/cardio/hyrox/rest). wprefs.dayFocus = per-day label
  (Push/Pull/Legs/etc), sparse. Hybrid dayPlan = per-day run/lift split, SEPARATE source.
- On reorder, dual-write schedule + dayFocus + dayPlan together for the moved days (precedent
  ~6689-6690), so hybrid run/lift split travels WITH the day (B model — dragged session keeps
  identity; do NOT let autoFocus re-derive and relabel a dragged session). autoFocus() remains the
  FALLBACK only for days the user never hand-edited.
- "Next cycle start" = the user's week-start day computed from their schedule (do NOT hardcode Monday).

## Interaction (the core)

1. Tap Edit → drag handles (⠿) slide in at the LEFT of each day (staggered ~30ms apart). Pin icons
   appear at the right.
2. PRESS-AND-HOLD a handle to grab (dnd-kit activation constraint: delay ~180ms + tolerance, so a
   tap-scroll doesn't grab). On grab: row springs up (scale 1.02, elevated shadow),
   Haptics.impact({style: Medium}).
3. DRAG: other rows FLOW out of the way with a staggered spring (dnd-kit transform + spring
   transition — NOT linear, NOT instant jumps). Soft Haptics.impact({style: Light}) TICK each time
   two rows actually swap order.
4. The recovery-load RIBBON recolors LIVE as the order changes mid-drag — intelligence is
   continuous, not computed on drop.
5. DROP: row settles with a gentle spring overshoot-and-rest (not a snap).
6. PINS: tap 📌 to pin a day the user can't move ("I can only long-run Saturday"). Pinned = subtle
   warm tint (token) + fastened (filled accent chip). Pinned days excluded from Auto-arrange's
   moveable set + show a quiet "Pinned — [why]" meta if set.

## Recovery-load ribbon (the visible intelligence)

- Row of 7 segments under the header, one per day, colored by recovery status: green (--cm-good) /
  amber (--cm-warn) / red (--cm-bad) / neutral-grey (rest).
- Segments EASE between colors over ~250ms when load shifts (green→amber morph). Instant swap looks
  like a bug; smooth morph is the "whoa" — non-negotiable for the award bar.
- One-line status right-aligned: "All clear" / "1 conflict" / "Heavy" — colored to the worst segment.

## Recovery rules engine (research-backed — do NOT improvise the science)

Classify each day: modality + intensity. HARD = leg/heavy lower lift, run intervals/tempo/long,
hyrox. EASY = easy/recovery run, light cardio, mobility.

- R1: HARD run (interval/tempo/long) within 24-48h AFTER a heavy lower/leg day → conflict. EASY
  runs EXEMPT (easy running after legs has minimal impact — never flag).
- R2: Two HARD sessions back-to-back, no easy/rest buffer → conflict.
- R3: No rest day anywhere in the 7-day week → caution.
- R4: Long run the day BEFORE a heavy lift → caution (fatigue carryover).
- R5: Same modality HARD two days running → caution (48h). Load-dependent: only flag hard+hard;
  light frequency training is fine.
Ribbon segment color = worst rule touching that day. Inline flag under a row while dragging if that
day is in conflict.

## Auto-arrange (the killer feature — constraint solver)

Button "✨ Auto-arrange". Solve an optimal recovery ordering of NON-pinned days, keeping pinned days
fixed, minimizing rule violations.
- Moveable set ≤7 → brute-force/greedy fine. Permute non-pinned sessions across non-pinned slots,
  score by total violation weight (conflict=3, caution=1), pick lowest. Ties → keep days closest to
  original position (least disruption).
- Respects pins absolutely.
- Animate the result: rows spring into new positions (staggered ~40ms), ribbon morphs greener, one
  success haptic (Medium). The user SEES the week heal.
- If already optimal: light toast "Your week's already well-balanced", no movement.

## Warning modal (coach, not nag)

On Save, if any conflict/caution trips: spring modal up from bottom, backdrop BLURS (backdrop-filter,
not just dim). Paced entrance — headline first, science line fades ~half-beat later.
- Title neutral+smart ("Two things to know" / "Before you save"), icon in an amber-tint chip, NOT a
  red alarm.
- Body: which rule + WHY plain (bold the what, prose the why). One italic science sub-line. Multiple
  rules → summarize top 1-2, no wall of text.
- Actions (stacked): PRIMARY "Auto-fix around my pins →" (runs solver). SECONDARY "Keep it my way"
  (saves exact order, no nagging). Keep-my-way is NON-NEGOTIABLE — inform, then respect the athlete.
- If the user edited a GOOD week: optional positive confirm on save ("Nice — this order respects your
  recovery"). Confirm good instincts, don't only bark at mistakes.

## Type system (STRICT — the run-summary lesson)

- SANS (Archivo): every WORD — day labels, session names, badges, meta, modal copy, buttons, ribbon
  status. Hierarchy: session name 15/700, meta 12/500 muted, badge 9.5/800 uppercase, section labels
  11/800 uppercase spaced.
- MONO (DM Mono): only NUMERALS (mileage "5 mi", dates). MONO NEVER above weight 500 (faux-bolds,
  reads muddy). Sans carries all bold.
- Three roles: labels (small/uppercase/muted) · titles (sans bold) · numerals (mono ≤500).

## Token / theme discipline

- ALL accents via --cm-* tokens (accent, accent-deep, accent-rgb, good/warn/bad, ink, ink-soft,
  paper, line). A reviewer WILL switch themes — everything recolors across all 8. No hardcoded hex.
- Add --cm-good / --cm-warn / --cm-bad to themeService.js (ribbon needs them; can be theme-constant
  traffic-light values, but define as tokens, not inline hex).

## Guardrails

- Recon-first: quote the current "Adjust my week" section + how it persists before editing. Report
  the dayPlan co-edit approach + the @dnd-kit/Haptics install plan BEFORE wiring.
- Remove the duplicate single-letter pill row (~5299) so there's one editor.
- Small str_replaces; rm -rf ios/App/App/public before rebuild; report bundle hash; HOLD for device
  eyeball — expect motion + type rounds. This is the polish-on-device feature; do not self-approve
  the feel.
