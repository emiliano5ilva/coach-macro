// RevenueCat webhook handler.
//
// Wire in RevenueCat dashboard:
//   Project → Integrations → Webhooks → https://www.coach-macro.com/api/revenuecat-webhook
//
// /api/referral-payment is idempotent — safe to call from both client and webhook.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const event = req.body?.event;
  const eventType = event?.type;
  const userId = event?.app_user_id;

  if (!userId) return res.status(400).json({ error: 'Missing app_user_id' });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  if (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL') {
    const productId = event?.product_id || '';
    const tier = productId.includes('annual') ? 'annual' : 'monthly';

    await sb.from('profiles').update({
      subscription_tier: tier,
      is_pro: true,
      subscription_started_at: new Date().toISOString(),
    }).eq('id', userId);

    if (eventType === 'INITIAL_PURCHASE') {
      await fetch('https://www.coach-macro.com/api/referral-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
    }
  }

  if (eventType === 'EXPIRATION') {
    await sb.from('profiles').update({
      subscription_tier: 'free',
      is_pro: false,
    }).eq('id', userId);
  }

  // CANCELLATION: access continues until expiry — no DB change.

  return res.status(200).json({ received: true });
}
