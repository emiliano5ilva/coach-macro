# Run-Summary Redesign — Implementation Brief

For: Claude Code CLI · Repo: ~/Developer/coach-macro · branch goclub-redesign
Target: renderRunSummary() in src/sections.jsx (~3207-3385)
Design reference: run-summary-v2-mockup.html (Drive)
Folds into: the same pending commit as Tier 1/Tier 2 run-logging + AdaptiveBanner migration.

## Why

The current run-summary reads as one dense white card on red with red bleeding through as
accidental seams — user feedback: "very crammed, font is everywhere." This redesign fixes both:
(1) SEPARATE floating cards on the red canvas so red becomes intentional spacing, (2) a strict
numbers-mono / words-sans type hierarchy, (3) bigger/fewer/bolder stats.

## Prereqs (confirmed before building)

- `--cm-accent-rgb` resolves as a comma-separated triple (rgba(var(--cm-accent-rgb),0.12) works).
  Set at themeService.js:150 as `accent.rgb`, same mechanism as `--cm-red-rgb` (AdaptiveBanner).
- `--cm-accent-deep` / `--cm-accent-deep-rgb` added to themeService (per-theme darkened accent) for
  the canvas gradient bottom, phase pill text, Reached/Projected tags, and Save & exit text.
- sleeping-face + fork-and-knife-with-plate bundled in iconData.js (done).

## Layout (top → bottom), all on a red canvas with a subtle vertical gradient

### Canvas
- Background: linear-gradient(178deg, var(--cm-accent) 0%, var(--cm-accent-deep) 62%). Scrolls.
  ~16px horizontal padding so cards have red gutters on both sides.

### HERO (no card — sits directly on red, white text)
- Eyebrow: "RUN COMPLETE" (uppercase, letter-spaced, sans, ~90% white) + phase pill
  (BASE/BUILD/PEAK/TAPER) — small white pill, accent-deep text. Keep existing phase logic.
- Distance: huge numeral (~88px, MONO, weight 800, -0.04em) + unit ("mi"/"km", ~26px sans bold,
  90% opacity, baseline-aligned).
- Sub-line: "Run · [date]" (~13px sans, 82% white).

### BIG STAT TRIO (one white card, generous padding ~22px)
- Three equal columns, hairline dividers (rgba(ink,0.07)).
- LABEL (11px uppercase sans, muted) over VALUE.
- Time + Avg pace = MONO ~30px weight 800 ("/mi" small mono muted suffix). Effort = word
  (Easy/Moderate/Hard/Max) in SANS ~23px.
- GPS variant: third column is CALS (mono) instead of Effort; hide the separate calories card.

### "AT THIS PACE" card (race predictions — honest)
- Header "AT THIS PACE". Row: LEFT = distance (22px sans bold) + Reached/Projected tag
  (10px uppercase, accent-deep on accent-12% bg) + caption line. RIGHT = time (30px MONO bold).
- HONESTY RULE: "Reached" = distance actually run (dist >= 5.0km → 5K, >= 10.0km → 10K, real km
  thresholds); "Projected" = extrapolated. Never present a projection as measured.

### Calories card (quiet, manual only)
- "Calories (est.)" (14px sans muted) left, value MONO 19px + "kcal" small muted right. Hide for GPS.

### SPLITS card
- Header "SPLITS". MANUAL → dashed "Splits need GPS" prompt. GPS → existing lap-based split bars.

### COACH card (Fuel + Next-up)
- Use CardGlyph — fluent-emoji-flat icons in uniform accent-tint chips. One card, two rows,
  hairline divider. Row: 34px chip w/ glyph, big line (16px sans bold) + small line (12.5px muted).
- Fuel glyph: fork-and-knife-with-plate. Next-up glyph: sleeping-face when tomorrow is a rest day;
  otherwise a training glyph. Keep existing next-up logic.

### ACTIONS (on red, in-flow)
- [Edit (translucent white, 1px white-30% border)] + [Save & exit (white bg, accent-deep text,
  flex 1.5)]. Edit manual-only. GPS = full-width Save & exit.
- "Synced to Apple Health" line under it (white 85%, small, with a dot).

## CardGlyph component

```jsx
import "./iconData.js";
import { Icon } from "@iconify/react";
function CardGlyph({ icon, size = 34 }) {
  return (
    <div style={{ width:size, height:size, flexShrink:0, display:"flex",
      alignItems:"center", justifyContent:"center", borderRadius:10,
      background:"rgba(var(--cm-accent-rgb), 0.12)" }}>
      <Icon icon={icon} width={Math.round(size*0.6)} height={Math.round(size*0.6)} />
    </div>
  );
}
```
Uniform accent-tint chip (no per-card hues), recolors across 8 themes; multicolor glyph carries the color.

## Type hierarchy (the "font everywhere" fix) — STRICT

- MONO ('DM Mono'): hero distance numeral, all stat/time/pace/split values, calories figure, race
  times. Numbers only.
- SANS ('Archivo'): every label, eyebrow, tag, caption, coach copy, button, the Effort word. Words only.
- Three roles: labels (small/uppercase/muted) · data (big/mono/bold) · prose (readable sans).

## Guardrails

- Recon-first, quote current renderRunSummary before editing; small str_replaces.
- Keep both manual + GPS states coherent (same card system; GPS swaps splits + stat-3).
- Don't disturb DB→HealthKit ordering or the wheel/Edit logic already built.
- rm -rf ios/App/App/public before rebuild. Report bundle hash. Hold for eyeball before commit.
- LAST piece before the single commit (Tier 1 + Tier 2 + AdaptiveBanner + type/spacing + this redesign).
