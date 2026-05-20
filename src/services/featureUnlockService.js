import { sb } from '../client.js';

// ── FEATURE DEFINITIONS ───────────────────────────────────────────────────────

export const FEATURES = {
  app_tour: {
    key: 'app_tour',
    title: 'WELCOME TO COACH MACRO.',
    description: 'Let us show you around. Takes 30 seconds.',
    emoji: '👋',
    condition: null,
    tourSteps: 5,
  },
  streaks: {
    key: 'streaks',
    title: 'STREAKS UNLOCKED.',
    description: 'Your consistency is now being tracked. Keep the streak alive.',
    emoji: '🔥',
    condition: { type: 'consecutive_days', value: 3 },
  },
  macro_memory: {
    key: 'macro_memory',
    title: 'MACRO MEMORY UNLOCKED.',
    description: 'Coach Macro remembers your favourite meals. Logging just got faster.',
    emoji: '🧠',
    condition: { type: 'meals_logged', value: 5 },
  },
  progress_view: {
    key: 'progress_view',
    title: 'YOUR FIRST WEEK IS IN.',
    description: 'Your progress data is ready to explore. See how far you have come.',
    emoji: '📈',
    condition: { type: 'days_since_signup', value: 7 },
  },
  rpe_input: {
    key: 'rpe_input',
    title: 'EFFORT TRACKING UNLOCKED.',
    description: 'Rate how hard each set felt. This makes your program smarter over time.',
    emoji: '💪',
    condition: { type: 'workouts_logged', value: 5 },
  },
  training_dna: {
    key: 'training_dna',
    title: 'YOUR ATHLETE DNA IS READY.',
    description: 'Based on your training we have built your personal athlete profile.',
    emoji: '🧬',
    condition: { type: 'workouts_logged', value: 10 },
  },
  plateau_detection: {
    key: 'plateau_detection',
    title: 'PLATEAU DETECTION ACTIVE.',
    description: 'Coach Macro now watches your lifts for stalls and tells you exactly how to break through.',
    emoji: '🎯',
    condition: { type: 'workouts_logged', value: 15 },
  },
  advanced_coaching: {
    key: 'advanced_coaching',
    title: 'ADVANCED COACHING UNLOCKED.',
    description: 'Deload detection, muscle balance, fatigue trending. Your full coaching system is now active.',
    emoji: '🏆',
    condition: { type: 'days_since_signup', value: 30 },
  },
  first_pr: {
    key: 'first_pr',
    title: 'YOU JUST SET A PR.',
    description: 'Personal records are now being tracked. Every new best is saved forever.',
    emoji: '🔥',
    condition: { type: 'event', event: 'pr_set' },
  },
  nutrition_protocol: {
    key: 'nutrition_protocol',
    title: 'NUTRITION PERIODISATION ACTIVE.',
    description: 'Your macros now adjust automatically based on your training and goals.',
    emoji: '🥗',
    condition: { type: 'event', event: 'protocol_triggered' },
  },
};

// ── APP TOUR STEPS ────────────────────────────────────────────────────────────

export const APP_TOUR_STEPS = [
  {
    targetSelector: '[data-tour="today-tab"]',
    headline: 'START HERE EVERY DAY',
    description: 'Your workout and meals are always ready on Today. This is your daily home base.',
  },
  {
    targetSelector: '[data-tour="start-session"]',
    headline: 'TAP TO TRAIN',
    description: 'Your workout is pre-built and ready. Tap Start Session and we guide you through every set.',
  },
  {
    targetSelector: '[data-tour="fuel-tab"]',
    headline: 'LOG WHAT YOU EAT',
    description: "Track your meals here. Don't aim for perfect — just aim for logged.",
  },
  {
    targetSelector: '[data-tour="progress-tab"]',
    headline: 'WATCH YOURSELF GROW',
    description: 'This fills up as you train and eat. Check back after your first few sessions.',
  },
  {
    targetSelector: '[data-tour="me-tab"]',
    headline: 'YOUR PROFILE',
    description: 'Settings, preferences, your Athlete Passport, and feedback all live here.',
  },
];

// ── CHECK ALL UNLOCKS ─────────────────────────────────────────────────────────

export async function checkFeatureUnlocks(userId, stats) {
  const { data: existing } = await sb
    .from('feature_unlocks')
    .select('feature_key')
    .eq('user_id', userId);

  const unlockedKeys = new Set((existing || []).map(f => f.feature_key));
  const newUnlocks = [];

  for (const [key, feature] of Object.entries(FEATURES)) {
    if (unlockedKeys.has(key)) continue;
    if (!feature.condition) continue;

    const { type, value } = feature.condition;
    if (type === 'event') continue; // event-driven, handled separately

    let conditionMet = false;
    switch (type) {
      case 'workouts_logged':   conditionMet = stats.workoutsLogged >= value; break;
      case 'meals_logged':      conditionMet = stats.mealsLogged >= value; break;
      case 'days_since_signup': conditionMet = stats.daysSinceSignup >= value; break;
      case 'consecutive_days':  conditionMet = stats.consecutiveDays >= value; break;
    }

    if (conditionMet) {
      await sb.from('feature_unlocks').upsert(
        { user_id: userId, feature_key: key, unlocked_at: new Date().toISOString() },
        { onConflict: 'user_id,feature_key' }
      );
      newUnlocks.push(feature);
    }
  }

  return newUnlocks;
}

// ── GET PENDING UNLOCK TO SHOW ────────────────────────────────────────────────

export async function getPendingUnlock(userId) {
  const { data } = await sb
    .from('feature_unlocks')
    .select('*')
    .eq('user_id', userId)
    .is('shown_at', null)
    .order('unlocked_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { ...data, feature: FEATURES[data.feature_key] };
}

// ── MARK UNLOCK AS SHOWN ──────────────────────────────────────────────────────

export async function markUnlockShown(userId, featureKey) {
  await sb
    .from('feature_unlocks')
    .update({ shown_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('feature_key', featureKey);
}

// ── MARK TOUR COMPLETE ────────────────────────────────────────────────────────

export async function markAppTourComplete(userId) {
  await sb.from('feature_unlocks').upsert(
    {
      user_id: userId,
      feature_key: 'app_tour',
      unlocked_at: new Date().toISOString(),
      shown_at: new Date().toISOString(),
      dismissed_at: new Date().toISOString(),
      tour_completed: true,
    },
    { onConflict: 'user_id,feature_key' }
  );
}

// ── TRIGGER EVENT UNLOCK ──────────────────────────────────────────────────────

export async function triggerEventUnlock(userId, event) {
  const eventFeatures = Object.values(FEATURES).filter(
    f => f.condition?.type === 'event' && f.condition.event === event
  );

  for (const feature of eventFeatures) {
    const { data: existing } = await sb
      .from('feature_unlocks')
      .select('id')
      .eq('user_id', userId)
      .eq('feature_key', feature.key)
      .maybeSingle();

    if (!existing) {
      await sb.from('feature_unlocks').insert({
        user_id: userId,
        feature_key: feature.key,
        unlocked_at: new Date().toISOString(),
      });
    }
  }
}

// ── GET USER STATS ────────────────────────────────────────────────────────────

export async function getUserStats(userId, profile) {
  const signupDate = new Date(profile?.created_at || Date.now());
  const daysSinceSignup = Math.floor((Date.now() - signupDate) / (1000 * 60 * 60 * 24));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const [workouts, meals] = await Promise.all([
    sb.from('workout_logs').select('id', { count: 'exact' }).eq('user_id', userId).gte('date', thirtyDaysAgo),
    sb.from('food_logs').select('id', { count: 'exact' }).eq('user_id', userId).gte('logged_date', thirtyDaysAgo),
  ]);

  const { data: recentActivity } = await sb
    .from('workout_logs')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30);

  let consecutiveDays = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    if (recentActivity?.some(a => a.date === dateStr)) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  return {
    workoutsLogged: workouts.count || 0,
    mealsLogged: meals.count || 0,
    daysSinceSignup,
    consecutiveDays,
  };
}
