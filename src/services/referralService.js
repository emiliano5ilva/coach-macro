import { sb } from '../client';

export async function getReferralData(userId) {
  const { data } = await sb
    .from('profiles')
    .select('referral_code, referral_count, referral_tier, referred_by')
    .eq('id', userId)
    .single();
  return data;
}

export async function getReferrals(userId) {
  const { data } = await sb
    .from('referrals')
    .select('id, status, created_at, completed_at, referred_id, referred_name')
    .eq('referrer_id', userId)
    .not('referred_id', 'is', null)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function applyReferralCode(userId, code) {
  if (!code || !userId) return false;

  const { data: referrer } = await sb
    .from('profiles')
    .select('id, referral_code')
    .eq('referral_code', code.toUpperCase().trim())
    .maybeSingle();

  if (!referrer) return false;
  if (referrer.id === userId) return false;

  const { data: existing } = await sb
    .from('profiles')
    .select('referred_by')
    .eq('id', userId)
    .single();

  if (existing?.referred_by) return false;

  await sb.from('referrals').insert({
    referrer_id: referrer.id,
    referred_id: userId,
    referral_code: code.toUpperCase().trim(),
    status: 'pending',
    token: crypto.randomUUID(),
  });

  await sb
    .from('profiles')
    .update({ referred_by: code.toUpperCase().trim() })
    .eq('id', userId);

  return true;
}

export async function validateReferralCode(code) {
  if (!code || code.length !== 8) return false;
  const { data } = await sb
    .from('profiles')
    .select('id')
    .eq('referral_code', code.toUpperCase().trim())
    .maybeSingle();
  return !!data;
}

export async function completeReferral(userId) {
  const { data: profile } = await sb
    .from('profiles')
    .select('referred_by')
    .eq('id', userId)
    .single();

  if (!profile?.referred_by) return;

  await sb
    .from('referrals')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('referred_id', userId)
    .eq('status', 'pending');
}

export const REFERRAL_TIERS = {
  0: {
    name: 'No tier yet',
    min: 0,
    next: 1,
    color: 'rgba(245,245,240,0.3)',
    perks: [],
  },
  1: {
    name: 'BRONZE',
    min: 1,
    next: 5,
    color: '#CD7F32',
    perks: [
      'Early access to new features',
      'Bronze badge on passport',
    ],
  },
  2: {
    name: 'SILVER',
    min: 5,
    next: 10,
    color: '#C0C0C0',
    perks: [
      'All Bronze perks',
      'Silver badge on passport',
      '1 month free subscription',
    ],
  },
  3: {
    name: 'GOLD',
    min: 10,
    next: null,
    color: '#FFD740',
    perks: [
      'All Silver perks',
      'Gold badge on passport',
      '3 months free subscription',
      'VIP badge on passport',
      'Priority support',
    ],
  },
};
