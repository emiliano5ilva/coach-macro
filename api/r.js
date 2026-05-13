import { checkRateLimit } from './middleware/rateLimit.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const rateCheck = await checkRateLimit(req, '/api/r');
  if (!rateCheck.allowed) {
    return res.redirect(302, 'https://coach-macro.com?ref=ratelimited');
  }

  const { code, token } = req.query;

  if (!code || !token) {
    return res.redirect(302, 'https://coach-macro.com?ref=invalid');
  }

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  // Find referral by token
  const { data: referral } = await sb
    .from('referrals')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!referral) {
    return res.redirect(302, 'https://coach-macro.com?ref=invalid');
  }

  // Already clicked — still redirect with invite params so they get the free trial
  if (referral.clicked) {
    return res.redirect(302,
      `https://coach-macro.com?invited=true&token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`
    );
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.connection?.remoteAddress || 'unknown';

  // Anti-spam: same IP clicked a link for this referrer in the last hour
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count: recentClicks } = await sb
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', referral.referrer_id)
    .eq('clicked_ip', ip)
    .gte('clicked_at', oneHourAgo);

  if (recentClicks > 0) {
    // Don't count, but still redirect with invite params
    return res.redirect(302,
      `https://coach-macro.com?invited=true&token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`
    );
  }

  // Mark token as clicked
  await sb.from('referrals')
    .update({
      clicked: true,
      clicked_at: new Date().toISOString(),
      clicked_ip: ip,
    })
    .eq('token', token);

  // Increment referrer's count
  const { data: referrerProfile } = await sb
    .from('profiles')
    .select('referral_count')
    .eq('id', referral.referrer_id)
    .maybeSingle();

  if (referrerProfile !== null) {
    const newCount = (referrerProfile.referral_count || 0) + 1;
    const newTier = newCount >= 10 ? 4 : newCount >= 5 ? 3 : newCount >= 3 ? 2 : newCount >= 1 ? 1 : 0;
    await sb.from('profiles')
      .update({ referral_count: newCount, referral_tier: newTier })
      .eq('id', referral.referrer_id);
  }

  return res.redirect(302,
    `https://coach-macro.com?invited=true&token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`
  );
}
