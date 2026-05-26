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
    features: [],
    perks: [],
  },
  1: {
    name: 'TIER I',
    min: 1,
    next: 3,
    color: '#CD7F32',
    features: ['App icon customization'],
    perks: [],
  },
  2: {
    name: 'TIER II',
    min: 3,
    next: 5,
    color: '#C0C0C0',
    features: ['App icon customization', 'Workout history export'],
    perks: ['VIP badge on athlete passport', 'Early access to new features'],
  },
  3: {
    name: 'TIER III',
    min: 5,
    next: 10,
    color: '#1D9BF0',
    features: ['App icon customization', 'Workout history export', 'Color scheme customization'],
    perks: ['VIP badge on athlete passport', 'Early access to new features', 'Verified badge (blue checkmark)', '1 month free subscription'],
  },
  4: {
    name: 'TIER IV',
    min: 10,
    next: null,
    color: '#FFD740',
    features: ['App icon customization', 'Workout history export', 'Color scheme customization', 'Dashboard layout options'],
    perks: ['VIP badge on athlete passport', 'Early access to new features', 'Verified badge (blue checkmark)', 'Verified badge (white checkmark)', '3 months free subscription', 'Priority support'],
  },
};
