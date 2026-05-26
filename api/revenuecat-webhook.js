// RevenueCat webhook handler — stub, not yet active.
//
// Wire this endpoint in the RevenueCat dashboard:
//   Dashboard → Project → Integrations → Webhooks → add https://coach-macro.com/api/revenuecat-webhook
//
// IMPORTANT: referral credit MUST be triggered here for the INITIAL_PURCHASE event.
// The client-side purchaseService.js also calls /api/referral-payment, but server-side
// webhook delivery is the authoritative path once RevenueCat is live — it handles
// purchases made outside the app (e.g. restored, gifted, or cross-device).
// api/referral-payment.js is idempotent so double-calls are safe.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // TODO: verify RevenueCat webhook signature
  // const sig = req.headers['x-revenuecat-signature'];
  // if (!verifySignature(sig, req.body, process.env.REVENUECAT_WEBHOOK_SECRET)) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  const event = req.body;
  const eventType = event?.event?.type;
  const userId = event?.event?.app_user_id;

  if (!userId) return res.status(400).json({ error: 'Missing app_user_id' });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  if (eventType === 'INITIAL_PURCHASE' || eventType === 'RENEWAL') {
    const productId = event?.event?.product_id || '';
    const tier = productId.includes('annual') ? 'annual' : 'monthly';

    await sb.from('profiles').update({
      subscription_tier: tier,
      subscription_started_at: new Date().toISOString(),
    }).eq('id', userId);

    // Credit referral on first payment — idempotent, safe to call even if client already fired
    if (eventType === 'INITIAL_PURCHASE') {
      await fetch('https://coach-macro.com/api/referral-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    }
  }

  if (eventType === 'EXPIRATION' || eventType === 'CANCELLATION') {
    await sb.from('profiles').update({
      subscription_tier: 'expired',
    }).eq('id', userId);
  }

  return res.status(200).json({ received: true });
}
