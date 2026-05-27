// ─── Dashboard Configuration — Single Source of Truth ────────────────────────
// Controls section visibility by tier (beginner/intermediate/advanced) and
// training mode (strength/hyrox/running/hybrid).
// Tiers are CUMULATIVE: advanced sees everything beginner+intermediate see.

export const DASHBOARD_CONFIG = {
  TODAY: {
    sections: [
      {
        id: 'greeting',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 1,
      },
      {
        id: 'body_status',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 2,
        adaptive: true,
        // beginner: dot + energy text
        // intermediate: 3-metric readiness row
        // advanced: full health strip
      },
      {
        id: 'morning_brief',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 3,
        adaptive: true,
      },
      {
        id: 'todays_session',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 4,
        adaptive: true,
      },
      {
        id: 'race_countdown',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['hyrox', 'running'],
        priority: 5,
        conditional: 'hasUpcomingRace',
        adaptive: true,
      },
      {
        id: 'coach_alerts',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 6,
        adaptive: true,
      },
      {
        id: 'this_week_rings',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 7,
        adaptive: true,
      },
      {
        id: 'macros_today',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 8,
      },
      {
        id: 'weekly_roadmap',
        tiers: ['intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 9,
        adaptive: true,
        beginnerFallback: 'next_session_hint',
      },
      {
        id: 'predictive_intelligence',
        tiers: ['advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 10,
        adaptive: true,
      },
      {
        id: 'contextual_cards',
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
        priority: 11,
        adaptive: true,
      },
    ],
  },

  PROGRESS: {
    tabs: ['overview', 'strength', 'nutrition', 'recovery', 'running'],
    tabVisibility: {
      overview: {
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
      },
      strength: {
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'hybrid'],
        // hidden for pure 'running' mode
      },
      nutrition: {
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
      },
      recovery: {
        tiers: ['intermediate', 'advanced'],
        modes: ['strength', 'hyrox', 'running', 'hybrid'],
      },
      running: {
        tiers: ['beginner', 'intermediate', 'advanced'],
        modes: ['hyrox', 'running', 'hybrid'],
        // new tab — only for run-involved modes
      },
    },
    sections: {
      overview: [
        { id: 'coach_score',    tiers: ['beginner', 'intermediate', 'advanced'], modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'weekly_chart',   tiers: ['beginner', 'intermediate', 'advanced'], modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'connections',    tiers: ['intermediate', 'advanced'],             modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'peer_compare',   tiers: ['intermediate', 'advanced'],             modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'health_metrics', tiers: ['advanced'],                             modes: ['strength', 'hyrox', 'running', 'hybrid'] },
      ],
      strength: [
        { id: 'strength_chart', tiers: ['beginner', 'intermediate', 'advanced'], modes: ['strength', 'hyrox', 'hybrid'] },
        { id: 'pr_table',       tiers: ['beginner', 'intermediate', 'advanced'], modes: ['strength', 'hyrox', 'hybrid'] },
        { id: 'volume_trend',   tiers: ['intermediate', 'advanced'],             modes: ['strength', 'hyrox', 'hybrid'] },
        { id: 'muscle_map',     tiers: ['advanced'],                             modes: ['strength', 'hyrox', 'hybrid'] },
      ],
      nutrition: [
        { id: 'macro_calendar', tiers: ['beginner', 'intermediate', 'advanced'], modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'calorie_trend',  tiers: ['intermediate', 'advanced'],             modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'macro_split',    tiers: ['advanced'],                             modes: ['strength', 'hyrox', 'running', 'hybrid'] },
      ],
      recovery: [
        { id: 'hrv_trend',      tiers: ['intermediate', 'advanced'], modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'sleep_trend',    tiers: ['intermediate', 'advanced'], modes: ['strength', 'hyrox', 'running', 'hybrid'] },
        { id: 'recovery_score', tiers: ['advanced'],                 modes: ['strength', 'hyrox', 'running', 'hybrid'] },
      ],
      running: [
        { id: 'weekly_mileage',      tiers: ['beginner', 'intermediate', 'advanced'], modes: ['hyrox', 'running', 'hybrid'] },
        { id: 'pace_trends',         tiers: ['beginner', 'intermediate', 'advanced'], modes: ['hyrox', 'running', 'hybrid'] },
        { id: 'long_run_progression',tiers: ['intermediate', 'advanced'],             modes: ['running', 'hybrid'] },
        { id: 'race_stats',          tiers: ['intermediate', 'advanced'],             modes: ['hyrox', 'running', 'hybrid'], conditional: 'hasUpcomingRace' },
      ],
    },
  },
};

// ─── Coach Score sub-score labels per mode ────────────────────────────────────
export const COACH_SCORE_LABELS = {
  strength: ['Training',  'Nutrition', 'Recovery',    'Streak'],
  running:  ['Endurance', 'Nutrition', 'Recovery',    'Consistency'],
  hyrox:    ['Run',       'Strength',  'Nutrition',   'Recovery'],
  hybrid:   ['Strength',  'Cardio',    'Nutrition',   'Recovery'],
};

// ─── Ring config per tier × mode ─────────────────────────────────────────────
// 'beginner' gets 2 rings, 'intermediate'+'advanced' get 3
export const RING_CONFIG = {
  beginner: {
    strength: ['sessions', 'macros'],
    hyrox:    ['sessions', 'macros'],
    running:  ['runs',     'macros'],
    hybrid:   ['sessions', 'macros'],
  },
  intermediate: {
    strength: ['sessions', 'volume',       'macros'],
    hyrox:    ['sessions', 'volume',       'run_distance'],
    running:  ['runs',     'distance',     'time'],
    hybrid:   ['strength_sessions', 'run_distance', 'macros'],
  },
  advanced: {
    strength: ['sessions', 'volume',       'macros'],
    hyrox:    ['sessions', 'volume',       'run_distance'],
    running:  ['runs',     'distance',     'time'],
    hybrid:   ['strength_sessions', 'run_distance', 'macros'],
  },
};

// ─── Graduation thresholds per mode ──────────────────────────────────────────
export const GRADUATION_THRESHOLDS = {
  beginner_to_intermediate: {
    strength: { days: 30, sessions: 10 },
    running:  { days: 21, runs: 8 },
    hyrox:    { days: 30, sessions: 8 },
    hybrid:   { days: 30, sessions: 8 },
  },
  intermediate_to_advanced: {
    strength: { days: 90, sessions: 40 },
    running:  { days: 60, runs: 25 },
    hyrox:    { days: 90, sessions: 30 },
    hybrid:   { days: 90, sessions: 30 },
  },
};

// ─── Section conditional evaluators ──────────────────────────────────────────
export const SECTION_CONDITIONALS = {
  hasUpcomingRace: (userData) =>
    !!(
      userData?.profile?.hyrox_race_date ||
      userData?.wPrefs?.hyroxRaceDate ||
      userData?.profile?.run_race_date
    ),
};
