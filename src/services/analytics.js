import { sb } from '../supabase.js';

export const EVENTS = {
  // Auth
  USER_SIGNUP:         'user.signup',
  USER_LOGIN:          'user.login',
  USER_LOGOUT:         'user.logout',
  USER_DELETE:         'user.delete',
  PASSWORD_RESET:      'user.password_reset',
  // Onboarding
  ONBOARDING_START:    'onboarding.start',
  ONBOARDING_COMPLETE: 'onboarding.complete',
  ONBOARDING_ABANDON:  'onboarding.abandon',
  // Subscription
  TRIAL_START:         'subscription.trial_start',
  SUBSCRIPTION_START:  'subscription.start',
  SUBSCRIPTION_CANCEL: 'subscription.cancel',
  SUBSCRIPTION_EXPIRE: 'subscription.expire',
  UPGRADE_VIEWED:      'subscription.upgrade_viewed',
  // Core features
  WORKOUT_STARTED:     'workout.started',
  WORKOUT_COMPLETED:   'workout.completed',
  WORKOUT_ABANDONED:   'workout.abandoned',
  FOOD_LOGGED:         'food.logged',
  FOOD_DELETED:        'food.deleted',
  WATER_LOGGED:        'water.logged',
  // AI features
  AI_RESTAURANT:       'ai.restaurant',
  AI_ADAPT_NOW:        'ai.adapt_now',
  AI_MORNING_BRIEF:    'ai.morning_brief',
  AI_MEAL_PREP:        'ai.meal_prep',
  AI_FLAGGED:          'ai.response_flagged',
  // Referral
  REFERRAL_LINK_SENT:  'referral.link_sent',
  REFERRAL_CLICKED:    'referral.clicked',
  REFERRAL_CONVERTED:  'referral.converted',
  TIER_UNLOCKED:       'referral.tier_unlocked',
  // Features
  PROGRAM_CHANGED:     'program.changed',
  RECIPE_CREATED:      'recipe.created',
  HEALTH_CONNECTED:    'health.connected',
  HEALTH_DISCONNECTED: 'health.disconnected',
  // Errors
  API_ERROR:           'error.api',
  AI_ERROR:            'error.ai',
  PAYMENT_ERROR:       'error.payment',
};

// Module-level flag — call setAnalyticsEnabled(false) when user opts out
let _enabled = true;
export function setAnalyticsEnabled(enabled) { _enabled = enabled !== false; }

export const track = async (event, properties = {}, userId = null) => {
  if (!_enabled) return;
  try {
    if (!userId) {
      const { data: { user } } = await sb.auth.getUser();
      userId = user?.id || null;
    }
    // Never log PII — strip any accidental email/name fields
    const { email: _e, name: _n, password: _p, ...safeProps } = properties;
    await sb.from('analytics_events').insert({
      user_id:    userId,
      event,
      properties: {
        ...safeProps,
        platform:    'web',
        app_version: '2.0.0',
        timestamp:   new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Analytics must never break the app
    console.error('[analytics]', err?.message || err);
  }
};

export const trackError = (error, context, userId) =>
  track(EVENTS.API_ERROR, {
    error:   error?.message || String(error),
    context,
    stack:   error?.stack?.slice(0, 500),
  }, userId);
