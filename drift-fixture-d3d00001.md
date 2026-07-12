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

## Pristine `profile_data` (program-mirror + calorie keys)
The row's `profile_data` JSONB mirrors some program fields and holds the calorie targets. A clean
fixture restore must reset these 7 keys so `profile_data` doesn't carry stale drift from a prior
program switch (e.g. a `goalCals` recalc, or a `current_program` mirror lagging the column):

| key | pristine value | why |
|---|---|---|
| `goalCals` | `2200` | base target (no program recalc applied) |
| `calorie_target` | `2200` | same |
| `current_program` | `ppl_6` | matches the `current_program` column |
| `run_race_type` | `null` | matches the `run_race_type` column (NULL) |
| `run_race_date` | `2026-08-28` | matches the `run_race_date` column |
| `program_start_date` | `2026-06-21` | matches the `program_start_date` column |
| `program_current_week` | `null` | matches the `program_current_week` column (NULL) |

**Intentionally NOT managed:** `recovery_capacity` (no documented fixture value — restoring it to
anything would invent one; left untouched). And the 18 immutable bio fields + `hyroxProfile` +
`current5KTime` + `daily_scores` + `program_total_weeks` + referral/trial/subscription keys MUST be
left byte-untouched — the `||` operator below only replaces the 7 keys named.

## Restore (DO NOT run without explicit go — Supabase MCP, project `oxxihlwqukbakmnnavuy`)
```sql
-- Restores the EXACT drift fixture above (wprefs + columns) AND the pristine profile_data state.
-- `profile_data || jsonb_build_object(...)` overrides ONLY the 7 keys; all other profile_data keys
-- (bio, hyroxProfile, current5KTime, daily_scores, recovery_capacity, …) are left byte-untouched.
-- Run ONLY when intentionally resetting the test case.
UPDATE public.profiles SET
  wprefs = '<the wprefs object above, as JSONB>'::jsonb,
  current_program = 'ppl_6',
  program_start_date = '2026-06-21',
  program_current_week = NULL,
  run_race_type = NULL,
  run_race_date = '2026-08-28',
  plan_built = true,
  profile_data = profile_data || jsonb_build_object(
    'goalCals',             2200,
    'calorie_target',       2200,
    'current_program',      'ppl_6',
    'run_race_type',        NULL,
    'run_race_date',        '2026-08-28',
    'program_start_date',   '2026-06-21',
    'program_current_week', NULL
  )
WHERE id = 'd3d00001-cafe-4001-babe-d3d000000001';
```
> Verified 2026-06-22: this exact statement restores the four-way drift (`_libraryId=hyrox_8w` +
> `isHyrox&&isLifting` both true + stale `runPlan`/`current_program`) with `goalCals/calorie_target=2200`
> and the program-mirror keys matching the columns; bio fields confirmed byte-unchanged.
