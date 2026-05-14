// ─── Coach Macro Color System ─────────────────────────────────────────────────
//
// Two distinct palettes. Never cross-pollinate them.
//
// PRIMARY — UI chrome, macros, and brand identity.
// These colors carry fixed semantic meaning throughout the app.
// NEVER use them for chart data visualization or generic status indicators.
//
export const PRIMARY_COLORS = {
  // Brand
  accent:        "#e8341c",   // brand red — CTAs, active states, brand moments
  accentDim:     "#c42d18",   // brand red dim — pressed states

  // Macros (displayed in macro ring, bars, food logs)
  protein:       "#e8341c",   // brand red doubles as protein color
  carbs:         "#4A90E2",   // refined blue — carbs macro
  fat:           "#F5A623",   // refined amber — fat macro

  // Recovery / wellness features
  recovery:      "#7E57C2",   // royal violet — sleep, HRV, recovery score
  recoveryHover: "#673AB7",
  recoveryBg:    "rgba(126,87,194,0.12)",

  // Achievement / win moments
  gold:          "#FFD700",   // achievement gold — PRs, streaks, milestones
  goldDeep:      "#FFA000",   // gold deep — gradient end
  goldBg:        "rgba(255,215,0,0.12)",

  // Text
  textPrimary:   "#f5f5f0",
  textSecondary: "rgba(245,245,240,0.70)",
  textTertiary:  "rgba(245,245,240,0.40)",
  textDisabled:  "rgba(245,245,240,0.20)",

  // Surfaces (darkest = base, lightest = most elevated)
  surfaceBase:   "#050810",   // body background
  surface1:      "#0A0F1C",   // cards on home dashboard
  surface2:      "#131A2C",   // raised elements, active workout overlay
  surface3:      "#1C2438",   // modals, bottom sheets, overlays

  // Borders
  borderSubtle:  "rgba(255,255,255,0.06)",
  borderMedium:  "rgba(255,255,255,0.12)",
  borderStrong:  "rgba(255,255,255,0.20)",
  borderBrand:   "rgba(232,52,28,0.30)",

  // Status (reuses macro colors intentionally — same meaning in context)
  success:       "#00B894",   // same as refined carbs green
  warning:       "#F5A623",   // same as refined fat amber
  error:         "#e8341c",   // same as brand red
  info:          "#4A90E2",   // same as refined protein blue
};

// SECONDARY (CHART-ONLY) — Data visualization exclusively.
// These colors are intentionally distinct from PRIMARY to prevent visual
// confusion with macro colors (blue/green/amber) and brand red.
//
// Turquoise = optimal / good / high performance
// Peach     = caution / moderate / approaching limit
// Chart red = danger / overreached (distinct shade from brand red)
// Slate     = neutral / insufficient / no data
//
// NEVER use chart colors in UI elements, buttons, text, macro displays,
// or anywhere outside of charts and data visualizations.
//
export const CHART_COLORS = {
  optimal:    "#4ECDC4",   // turquoise — optimal zone, high probability
  caution:    "#FF9F43",   // peach — caution zone, moderate risk
  danger:     "#FF5252",   // chart red — danger zone (different shade from brand #e8341c)
  neutral:    "#607D8B",   // blue-grey slate — no data / insufficient volume

  optimalBg:  "rgba(78,205,196,0.12)",
  cautionBg:  "rgba(255,159,67,0.12)",
  dangerBg:   "rgba(255,82,82,0.12)",
  neutralBg:  "rgba(96,125,139,0.12)",
};

// ─── Per-feature color assignments ───────────────────────────────────────────
//
// MUSCLE VOLUME CHART (src/MuscleVolumeChart.jsx):
//   under   → chart.neutral  (#607D8B slate)
//   optimal → chart.optimal  (#4ECDC4 turquoise)
//   warn    → chart.caution  (#FF9F43 peach)
//   over    → chart.danger   (#FF5252 chart red)
//
// INJURY RISK GAUGE:
//   safe    → chart.optimal  (#4ECDC4)
//   caution → chart.caution  (#FF9F43)
//   danger  → chart.danger   (#FF5252)
//
// PERFORMANCE FORECAST (PR probability):
//   high    → chart.optimal  (#4ECDC4)
//   moderate→ chart.caution  (#FF9F43)
//   low     → chart.neutral  (#607D8B)
//
// ACHIEVEMENT MOMENTS (use PRIMARY_COLORS.gold):
//   PR badges, streak milestones, 90+ score glow,
//   perfect day indicators, goal achievement modals
//
// RECOVERY FEATURES (use PRIMARY_COLORS.recovery):
//   Sleep score, HRV display, recovery ring, bio algorithm screen
