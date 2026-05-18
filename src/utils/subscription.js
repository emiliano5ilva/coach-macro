export const TIERS = {
  trial:   { label: 'Free Trial',  adaptLimit: 10 },
  monthly: { label: 'Pro Monthly', adaptLimit: 10 },
  annual:  { label: 'Pro Annual',  adaptLimit: 10 },
  expired: { label: 'Expired',     adaptLimit: 0  },
};

export function hasActiveAccess(profile) {
  if (!profile) return false;
  const tier = profile.subscription_tier;
  if (tier === 'monthly' || tier === 'annual') return true;
  if (tier === 'trial') {
    const trialEnds = new Date(profile.trial_ends_at);
    return trialEnds > new Date();
  }
  return false;
}

export function trialDaysRemaining(profile) {
  if (!profile?.trial_ends_at) return 0;
  const diff = new Date(profile.trial_ends_at) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function trialExpiringSoon(profile) {
  const days = trialDaysRemaining(profile);
  return days > 0 && days <= 3;
}

export function isExpired(profile) {
  if (!profile) return true;
  const tier = profile.subscription_tier;
  if (tier === 'monthly' || tier === 'annual') return false;
  if (tier === 'trial') {
    return new Date(profile.trial_ends_at) <= new Date();
  }
  return true;
}

export function getAdaptLimit(profile) {
  const tier = profile?.subscription_tier || 'expired';
  return TIERS[tier]?.adaptLimit ?? 0;
}

export function getSubscriptionLabel(profile) {
  if (!profile) return 'No subscription';
  const tier = profile.subscription_tier;
  if (tier === 'trial') {
    const days = trialDaysRemaining(profile);
    if (days <= 0) return 'Trial expired';
    return `Free trial · ${days} day${days === 1 ? '' : 's'} left`;
  }
  if (tier === 'monthly') return 'Pro · Monthly';
  if (tier === 'annual') return 'Pro · Annual';
  return 'Expired';
}
