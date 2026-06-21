# Drift fixture — `d3d00001-cafe-4001-babe-d3d000000001`

Snapshot captured **2026-06-21** (UTC) *before* running the Stage 5a Plan-tab walkthrough on this
account. This is the canonical **four-way program-drift test case** for Stage 5d (write-side +
DB reconciliation). The 5a walkthrough will OVERWRITE this row's wprefs — use the snapshot below
to restore the fixture or to reference its exact shape for the 5d reconciliation test.

## Why it's a drift fixture (fields disagree about "what program")
- `wprefs._libraryId = "hyrox_8w"` (canonical → resolveProgram resolves to **hyrox**)
- `wprefs.splitType = "8-Week First Timer"` (a hyrox program name, in a lifting-ish field)
- `wprefs.isHyrox = true` **and** `wprefs.isLifting = true` (conflicting mode flags)
- `wprefs.runPlan = "Half Marathon"` + `run_race_date = "2026-08-28"` (stale run identity)
- `wprefs.hyroxProgram = "8-Week First Timer"`, `wprefs.hybridTemplate = "Strength-Biased Hybrid"` (every mode represented)
- `current_program = "ppl_6"` (column says PPL lifting)
- `wprefs.prescType = "lifting"`, `wprefs.splitLabel = "Push / Pull / Legs"`

## Verbatim snapshot
```json
{
    "id": "d3d00001-cafe-4001-babe-d3d000000001",
    "wprefs": {
        "gvt": false,
        "hUnit": "ft",
        "theme": { "bg": "white", "accent": "red" },
        "wUnit": "lbs",
        "isHyrox": true,
        "runPlan": "Half Marathon",
        "flexDays": ["Sat", "Sun"],
        "isHybrid": false,
        "mealFreq": "6",
        "schedule": { "Fri": "run", "Mon": "training", "Sat": "rest", "Sun": "run", "Thu": "training", "Tue": "rest", "Wed": "run" },
        "equipment": "Full Gym",
        "favorites": [],
        "isLifting": true,
        "planWeeks": 12,
        "prescType": "lifting",
        "splitType": "8-Week First Timer",
        "_libraryId": "hyrox_8w",
        "deloadFreq": 6,
        "isRunFocus": false,
        "longRunDay": "Sat",
        "splitLabel": "Push / Pull / Legs",
        "hyroxProgram": "8-Week First Timer",
        "longestRunMi": 6,
        "mealPrepDiet": "mediterranean",
        "hybridTemplate": "Strength-Biased Hybrid",
        "weekendFlexMode": false,
        "recoveryCapacity": "normal",
        "runPlanStartDate": "2026-06-05",
        "currentRunsPerWeek": 4,
        "flexCalorieIncrease": 20
    },
    "current_program": "ppl_6",
    "program_start_date": "2026-06-21",
    "program_current_week": null,
    "run_race_type": null,
    "run_race_date": "2026-08-28"
}
```

## Restore (DO NOT run without explicit go — Supabase MCP, project `oxxihlwqukbakmnnavuy`)
```sql
-- Restores the exact drift fixture above. Run ONLY when intentionally resetting the test case.
UPDATE public.profiles SET
  wprefs = '<the wprefs object above, as JSONB>'::jsonb,
  current_program = 'ppl_6',
  program_start_date = '2026-06-21',
  program_current_week = NULL,
  run_race_type = NULL,
  run_race_date = '2026-08-28'
WHERE id = 'd3d00001-cafe-4001-babe-d3d000000001';
```
