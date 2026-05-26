// Called at onboarding completion (not on link click).
// Increments referrer count, recalculates tier, writes feature flags.
// Idempotent: status 'signup_credited' or 'completed' means already processed.

const THRESHOLDS = [
  { tier: 4, min: 10 },
  { tier: 3, min:  5 },
  { tier: 2, min:  3 },
  { tier: 1, min:  1 },
];

function calcTier(count) {
  for (const { tier, min } of THRESHOLDS) {
    if (count >= min) return tier;
  }
  return 0;
}

function featureFlags(tier) {
  return {
    app_icon_customization:     tier >= 1,
    workout_history_export:     tier >= 2,
    color_scheme_customization: tier >= 3,
    dashboard_layout_options:   tier >= 4,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { userId, token, code } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (!token && !code) return res.status(400).json({ error: 'Missing token or code' });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  // Locate the referral row — token path first, code path fallback
  let referral = null;
  if (token) {
    const { data } = await sb.from('referrals').select('*').eq('token', token).maybeSingle();
    referral = data;
  }
  if (!referral && code) {
    const { data } = await sb
      .from('referrals').select('*')
      .eq('referred_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    referral = data;
  }

  if (!referral) return res.status(404).json({ error: 'Referral not found' });

  // Idempotency guard
  if (referral.status === 'signup_credited' || referral.status === 'completed') {
    return res.status(200).json({ message: 'Already credited' });
  }

  // Fetch referrer profile
  const { data: referrer } = await sb
    .from('profiles')
    .select('referral_count, profile_data')
    .eq('id', referral.referrer_id)
    .maybeSingle();

  if (!referrer) return res.status(404).json({ error: 'Referrer not found' });

  const newCount    = (referrer.referral_count || 0) + 1;
  const newTier     = calcTier(newCount);
  const newFeatures = featureFlags(newTier);

  // Update referrer: count + tier + feature flags in profile_data
  await sb.from('profiles').update({
    referral_count: newCount,
    referral_tier:  newTier,
    profile_data: {
      ...(referrer.profile_data || {}),
      referral_features: newFeatures,
    },
  }).eq('id', referral.referrer_id);

  // Mark referral as signup_credited; set recipient so passport can display it
  await sb.from('referrals').update({
    status:             'signup_credited',
    recipient_user_id:  userId,
  }).eq('id', referral.id);

  return res.status(200).json({ tier: newTier, count: newCount, features: newFeatures });
}
