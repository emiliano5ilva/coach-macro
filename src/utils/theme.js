// ─── App Color System ─────────────────────────────────────────────────────────
//
// PRIMARY — UI chrome, macros, and brand.
// These colors carry specific semantic meaning throughout the app.
// NEVER use them for chart data visualization.
//
export const PRIMARY_COLORS = {
  accent:    "#e8341c",  // Brand red — CTAs, highlights, active states
  protein:   "#2979FF",  // Blue — protein macro everywhere
  carbs:     "#22c55e",  // Green — carbs macro everywhere
  fat:       "#f59e0b",  // Yellow/amber — fat macro everywhere
  recovery:  "#9B59FF",  // Purple — recovery score, sleep features
};

// SECONDARY (CHART-ONLY) — Data visualization exclusively.
// These colors are intentionally distinct from PRIMARY to avoid confusion.
// Used in charts and data displays. NEVER use for UI elements or macros.
//
// Teal   = good / optimal / high performance
// Orange = caution / moderate / approaching limit
// Coral  = danger / overreached / ease off
// Slate  = neutral / insufficient data / no volume
//
export const CHART_COLORS = {
  optimal: "#00BCD4",  // teal   — optimal zone, high probability
  caution: "#FF7043",  // orange — caution zone, moderate risk
  danger:  "#FF5722",  // coral  — danger zone, overreached
  neutral: "#78909C",  // slate  — no data, insufficient volume
};

// ─── Per-feature palette assignments ─────────────────────────────────────────
//
// MUSCLE VOLUME CHART (src/MuscleVolumeChart.jsx):
//   under   → neutral (#78909C slate)
//   optimal → optimal (#00BCD4 teal)
//   warn    → caution (#FF7043 orange)
//   over    → danger  (#FF5722 coral)
//
// INJURY RISK GAUGE:
//   safe    → optimal (#00BCD4 teal)
//   caution → caution (#FF7043 orange)
//   danger  → danger  (#FF5722 coral)
//
// PERFORMANCE FORECAST (PR probability):
//   high    → optimal (#00BCD4 teal)
//   moderate→ caution (#FF7043 orange)
//   low     → neutral (#78909C slate)
//
// SLEEP vs PERFORMANCE scatter:
//   sweet spot → optimal (#00BCD4 teal)
//   below avg  → neutral (#78909C slate)
//
// WEIGHT TREND:
//   daily dots      → neutral (#78909C slate)
//   moving average  → #FFFFFF white
//   goal line       → accent  (#e8341c brand red)
