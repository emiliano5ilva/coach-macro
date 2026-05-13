export const ERROR_MESSAGES = {
  // Auth
  invalid_credentials: {
    title: 'Incorrect email or password',
    message: 'Double-check your email and password. Passwords are case-sensitive.',
    action: 'Try again',
    secondaryAction: 'Forgot password?',
  },
  email_not_confirmed: {
    title: 'Email not verified',
    message: 'Check your inbox for a verification email from Coach Macro.',
    action: 'Resend email',
  },
  user_already_exists: {
    title: 'Account already exists',
    message: 'An account with this email already exists.',
    action: 'Sign in instead',
  },
  weak_password: {
    title: 'Password too weak',
    message: 'Use at least 8 characters with a mix of letters and numbers.',
    action: null,
  },
  session_expired: {
    title: 'Session expired',
    message: 'You have been signed out for security. Please sign in again.',
    action: 'Sign in',
  },
  // Network
  network_error: {
    title: 'No connection',
    message: 'Check your internet connection. Your workout and food logs still work offline.',
    action: 'Retry',
  },
  timeout: {
    title: 'Request timed out',
    message: 'The server took too long to respond. Check your connection and try again.',
    action: 'Retry',
  },
  // AI
  ai_rate_limit: {
    title: 'Slow down a bit',
    message: "You've used a lot of AI features this hour. Try again in a few minutes.",
    action: null,
  },
  ai_monthly_limit: {
    title: 'Monthly AI limit reached',
    message: "You've used your full AI allowance for this month. Resets on the 1st.",
    action: null,
  },
  ai_subscription_required: {
    title: 'Trial ended',
    message: 'Upgrade to Pro to continue using AI features.',
    action: 'View Pro',
  },
  ai_unavailable: {
    title: 'AI temporarily unavailable',
    message: 'Our AI service is having issues. Core features still work. Try again in a few minutes.',
    action: 'Retry',
  },
  // Food
  food_not_found: {
    title: 'Food not found',
    message: "This food isn't in our database. You can add it manually.",
    action: 'Add manually',
  },
  barcode_not_found: {
    title: 'Product not found',
    message: "This barcode isn't in our database. You can enter the nutrition info manually.",
    action: 'Enter manually',
  },
  // Profile
  profile_save_failed: {
    title: "Couldn't save",
    message: "Your changes weren't saved. Check your connection and try again.",
    action: 'Retry',
  },
  profile_load_failed: {
    title: "Couldn't load your data",
    message: "We're having trouble loading your profile. Showing cached data.",
    action: 'Retry',
  },
  // Subscription
  subscription_required: {
    title: 'Pro feature',
    message: 'This feature is available on Coach Macro Pro.',
    action: 'View Pro',
  },
  payment_failed: {
    title: 'Payment failed',
    message: "Your payment couldn't be processed. Check your payment method in Apple ID settings.",
    action: 'Manage payment',
  },
  // Workout
  workout_save_failed: {
    title: 'Workout not saved',
    message: "Your session data wasn't saved. We'll try again when you're connected.",
    action: null,
  },
  adapt_now_failed: {
    title: "Couldn't adapt workout",
    message: 'AI adaptation failed. Your original workout is unchanged.',
    action: 'Try again',
  },
  // Fallback
  unknown: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Your data is safe.',
    action: 'Try again',
    secondaryAction: 'Contact support',
  },
};

export const getErrorMessage = (error) => {
  const msg  = (error?.message || '').toLowerCase();
  const code = (error?.code    || '').toLowerCase();
  const combined = msg + ' ' + code;

  if (combined.includes('invalid_credentials') || combined.includes('invalid login') || combined.includes('invalid email or password')) return ERROR_MESSAGES.invalid_credentials;
  if (combined.includes('email_not_confirmed') || combined.includes('email not confirmed')) return ERROR_MESSAGES.email_not_confirmed;
  if (combined.includes('user_already_exists') || combined.includes('already registered') || combined.includes('already exists')) return ERROR_MESSAGES.user_already_exists;
  if (combined.includes('weak_password') || combined.includes('password should be')) return ERROR_MESSAGES.weak_password;
  if (combined.includes('session_expired') || combined.includes('session has expired') || combined.includes('jwt expired')) return ERROR_MESSAGES.session_expired;
  if (combined.includes('subscription required') || combined.includes('trial has ended') || combined.includes('upgrade to pro')) return ERROR_MESSAGES.ai_subscription_required;
  if (combined.includes('monthly') && combined.includes('limit')) return ERROR_MESSAGES.ai_monthly_limit;
  if (combined.includes('rate limit') || combined.includes('too quickly') || combined.includes('wait a few')) return ERROR_MESSAGES.ai_rate_limit;
  if (combined.includes('network') || combined.includes('failed to fetch') || combined.includes('networkerror')) return ERROR_MESSAGES.network_error;
  if (combined.includes('timeout') || combined.includes('timed out')) return ERROR_MESSAGES.timeout;

  return ERROR_MESSAGES.unknown;
};

// Returns null when subscription_required (paywall fires automatically), otherwise a user-facing string
export const getAIErrorMessage = (error) => {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('subscription required') || msg.includes('trial has ended') || msg.includes('upgrade to pro')) return null;
  if (msg.includes('monthly') && msg.includes('limit')) return "Monthly AI limit reached — resets on the 1st.";
  if (msg.includes('rate limit') || msg.includes('too quickly') || msg.includes('wait a few')) return "You're using AI features quickly. Try again in a few minutes.";
  return "AI temporarily unavailable. Try again.";
};
