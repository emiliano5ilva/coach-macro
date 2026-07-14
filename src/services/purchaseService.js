import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { sb } from '../client';

// Bounds an await so a hung RevenueCat native-bridge call or a supabase-js
// auth-lock stall (see the WKWebView/supabase-js gotchas — a hang is NOT a
// rejection, so a plain `await` never returns and the flow spins forever)
// surfaces as a rejection the caller can catch and show an error for. This is
// the REJECT-on-timeout variant (distinct from morningBriefService's
// fallback-on-timeout helper). Interactive StoreKit calls (purchasePackage,
// which shows the system sheet and can legitimately take as long as the user
// needs) are deliberately NOT wrapped.
export function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout:${label}`)), ms)),
  ]);
}

async function setTier(userId, tier) {
  await withTimeout(sb.from('profiles').update({
    subscription_tier: tier,
    is_pro: tier !== 'free',
    subscription_started_at: new Date().toISOString()
  }).eq('id', userId), 6000, 'setTier');
}

// DEV-ONLY visible unlock — lets us test the post-paywall flow on a dev/sim
// build where no RevenueCat offering exists (so a real IAP can never complete).
// MODE-gated exactly like NativeApp's dev-skip: `vite build` (production) folds
// this to `return false` and terser strips it, so it can NEVER grant entitlement
// in an App Store build. `build:sim` (--mode development) runs it. Writes the same
// paid-tier fields handleDevSkip does, so loadProfile sees is_pro on reload.
export async function devUnlockEntitlement(userId) {
  if (import.meta.env.MODE === 'production') return false;
  await setTier(userId, 'annual');
  return true;
}

async function creditReferralOnPayment(userId) {
  try {
    await fetch('/api/referral-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch (e) {
    console.warn('Referral credit failed:', e);
  }
}

export async function purchaseAnnual(userId) {
  try {
    const offerings = await withTimeout(Purchases.getOfferings(), 15000, 'getOfferings');
    const pkg = offerings.current?.annual;
    if (!pkg) throw new Error('Annual package not found');
    // purchasePackage shows the interactive StoreKit sheet — intentionally not timeout-wrapped.
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: pkg
    });
    if (customerInfo.entitlements.active['pro']) {
      await setTier(userId, 'annual');
      await creditReferralOnPayment(userId);
      return true;
    }
    return false;
  } catch (e) {
    if (e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return false;
    throw e;
  }
}

export async function purchaseMonthly(userId) {
  try {
    const offerings = await withTimeout(Purchases.getOfferings(), 15000, 'getOfferings');
    const pkg = offerings.current?.monthly;
    if (!pkg) throw new Error('Monthly package not found');
    // purchasePackage shows the interactive StoreKit sheet — intentionally not timeout-wrapped.
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: pkg
    });
    if (customerInfo.entitlements.active['pro']) {
      await setTier(userId, 'monthly');
      await creditReferralOnPayment(userId);
      return true;
    }
    return false;
  } catch (e) {
    if (e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return false;
    throw e;
  }
}

// Returns the restored tier STRING ('monthly' | 'annual') on success, or false
// when no active 'pro' entitlement is found. Callers must NOT assume a boolean —
// they need the tier to label the result (returning bare `true` made the toast
// always read "Pro Annual" because `true === "monthly"` is false).
export async function restorePurchases(userId) {
  try {
    const { customerInfo } = await withTimeout(Purchases.restorePurchases(), 20000, 'restorePurchases');
    if (customerInfo.entitlements.active['pro']) {
      const tier = customerInfo.activeSubscriptions
        .some(s => s.includes('annual')) ? 'annual' : 'monthly';
      await setTier(userId, tier);
      return tier;
    }
    return false;
  } catch (e) {
    throw e;
  }
}

export async function checkEntitlements(userId) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { customerInfo } = await withTimeout(Purchases.getCustomerInfo(), 10000, 'getCustomerInfo');
    if (!customerInfo.entitlements.active['pro']) {
      await setTier(userId, 'free');
    }
  } catch (e) {
    console.warn('checkEntitlements failed:', e);
  }
}
