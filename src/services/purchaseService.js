import { Purchases, PURCHASES_ERROR_CODE } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { sb } from '../client';

async function setTier(userId, tier) {
  await sb.from('profiles').update({
    subscription_tier: tier,
    is_pro: tier !== 'free',
    subscription_started_at: new Date().toISOString()
  }).eq('id', userId);
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
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.annual;
    if (!pkg) throw new Error('Annual package not found');
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
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.monthly;
    if (!pkg) throw new Error('Monthly package not found');
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

export async function restorePurchases(userId) {
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    if (customerInfo.entitlements.active['pro']) {
      const tier = customerInfo.activeSubscriptions
        .some(s => s.includes('annual')) ? 'annual' : 'monthly';
      await setTier(userId, tier);
      return true;
    }
    return false;
  } catch (e) {
    throw e;
  }
}

export async function checkEntitlements(userId) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    if (!customerInfo.entitlements.active['pro']) {
      await setTier(userId, 'free');
    }
  } catch (e) {
    console.warn('checkEntitlements failed:', e);
  }
}
