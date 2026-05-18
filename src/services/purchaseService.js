// Purchase service — wraps RevenueCat + Supabase tier sync.
// TODO: Install @revenuecat/purchases-capacitor and wire native SDK calls
// before App Store submission. Current implementation updates Supabase directly
// (development/web fallback). Replace the body of getRC() once the package is
// installed: import { Purchases } from '@revenuecat/purchases-capacitor';

import { sb } from '../client';

async function setTier(userId, tier) {
  await sb.from('profiles').update({
    subscription_tier: tier,
    ...(tier !== 'expired' ? { subscription_started_at: new Date().toISOString() } : {}),
  }).eq('id', userId);
}

export async function purchaseMonthly(userId) {
  // TODO: call Purchases.purchaseStoreProduct({ productIdentifier: 'coach_macro_monthly_999' })
  // and verify entitlement 'pro_monthly' before updating tier.
  await setTier(userId, 'monthly');
  return true;
}

export async function purchaseAnnual(userId) {
  // TODO: call Purchases.purchaseStoreProduct({ productIdentifier: 'coach_macro_annual_7999' })
  // and verify entitlement 'pro_annual' before updating tier.
  await setTier(userId, 'annual');
  return true;
}

export async function restorePurchases(userId) {
  // TODO: call Purchases.restorePurchases() and check customerInfo.entitlements.active.
  // For now, check Supabase tier directly.
  const { data } = await sb.from('profiles').select('subscription_tier').eq('id', userId).maybeSingle();
  const tier = data?.subscription_tier;
  if (tier === 'monthly' || tier === 'annual') return tier;
  return null;
}

export async function checkEntitlements(userId) {
  // TODO: call Purchases.getCustomerInfo() and sync entitlements to Supabase.
  // This is a no-op until the native SDK is installed.
}
