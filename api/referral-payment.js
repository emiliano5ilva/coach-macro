// Triggered after a referred user's first payment.
// Increments referrer count, recalculates tier (capped at 4), unlocks feature flags,
// and queues in-app notifications for the referrer.
// Idempotent: referral.status === 'completed' short-circuits.

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

const TIER_NAMES = { 1: 'TIER I', 2: 'TIER II', 3: 'TIER III', 4: 'TIER IV' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  // Find any pending referral for this user
  const { data: referral } = await sb
    .from('referrals')
    .select('*')
    .eq('referred_id', userId)
    .not('status', 'eq', 'completed')
    .maybeSingle();

  if (!referral) return res.status(200).json({ message: 'No pending referral' });

  // Fetch referrer
  const { data: referrer } = await sb
    .from('profiles')
    .select('referral_count, referral_tier, profile_data')
    .eq('id', referral.referrer_id)
    .maybeSingle();

  if (!referrer) return res.status(404).json({ error: 'Referrer not found' });

  const prevTier = referrer.referral_tier || 0;
  const newCount = (referrer.referral_count || 0) + 1;
  // Tier caps at 4; count keeps growing past that for bragging rights
  const newTier  = Math.min(4, calcTier(newCount));
  const tierUp   = newTier > prevTier;
  const features = featureFlags(newTier);

  // Queue in-app notifications for the referrer
  const existingPD    = referrer.profile_data || {};
  const existingNotifs = existingPD.pending_referral_notifications || [];
  const newNotifs = [
    ...existingNotifs,
    {
      id:      crypto.randomUUID(),
      type:    'referral_converted',
      message: 'Someone you referred just subscribed. That\'s a real one.',
      at:      new Date().toISOString(),
    },
    ...(tierUp ? [{
      id:      crypto.randomUUID(),
      type:    'tier_unlocked',
      tier:    newTier,
      message: `You reached ${TIER_NAMES[newTier]}. New unlocks are live.`,
      at:      new Date().toISOString(),
    }] : []),
  ];

  // Update referrer atomically
  await sb.from('profiles').update({
    referral_count: newCount,
    referral_tier:  newTier,
    profile_data: {
      ...existingPD,
      referral_features:              features,
      pending_referral_notifications: newNotifs,
    },
  }).eq('id', referral.referrer_id);

  // Mark referral completed
  await sb.from('referrals').update({
    status:            'completed',
    completed_at:      new Date().toISOString(),
    recipient_user_id: userId,
  }).eq('id', referral.id);

  return res.status(200).json({ tier: newTier, count: newCount, features, tierUp });
}
