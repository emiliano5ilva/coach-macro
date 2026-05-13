import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { checkRateLimit } from './middleware/rateLimit.js';
import { withLogging } from './middleware/logger.js';

async function sendEmail(to, subject, html) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: 'Coach Macro <team@coach-macro.com>', to, subject, html }),
  });
  return r.ok;
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Coach Macro</title>
</head>
<body style="margin:0;padding:0;background:#060D1A;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#060D1A;padding:48px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#0A1222;border:1px solid rgba(255,255,255,0.07);">
        <!-- HEADER -->
        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <svg width="36" height="26" viewBox="0 0 36 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-bottom:12px;">
              <rect y="0" width="36" height="5" rx="2.5" fill="#2979FF"/>
              <rect y="10.5" width="27" height="5" rx="2.5" fill="#2979FF"/>
              <rect y="21" width="18" height="5" rx="2.5" fill="#2979FF"/>
            </svg>
            <span style="font-size:17px;font-weight:700;color:#F5F5F0;letter-spacing:0.06em;text-transform:uppercase;">COACH<span style="color:#2979FF;">MACRO</span></span>
          </td>
        </tr>
        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${content}
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:11px;color:rgba(245,245,240,0.25);line-height:1.7;letter-spacing:0.03em;">
              Coach Macro · team@coach-macro.com<br>
              You're receiving this because you signed up at coach-macro.com.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function confirmationEmailHtml(firstName, confirmUrl) {
  return emailWrapper(`
    <h1 style="margin:0 0 16px;font-size:30px;font-weight:700;color:#F5F5F0;line-height:1.1;letter-spacing:-0.01em;">
      Hey ${firstName ? firstName : 'there'} — confirm your spot.
    </h1>
    <p style="margin:0 0 20px;font-size:15px;font-weight:300;color:rgba(245,245,240,0.7);line-height:1.75;">
      You're one click away from securing your place on the Coach Macro waitlist. When we launch, you'll get <strong style="color:#F5F5F0;font-weight:500;">30 days completely free</strong> — no credit card, no catch.
    </p>
    <p style="margin:0 0 28px;font-size:15px;font-weight:300;color:rgba(245,245,240,0.7);line-height:1.75;">
      Click the button below to confirm your email and lock in your spot:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
      <tr>
        <td style="background:#2979FF;">
          <a href="${confirmUrl}" style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.04em;">
            Confirm My Spot &rarr;
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:12px;color:rgba(245,245,240,0.3);line-height:1.6;">
      Or copy this link into your browser:<br>
      <span style="color:rgba(41,121,255,0.7);word-break:break-all;">${confirmUrl}</span>
    </p>
    <hr style="margin:24px 0;border:none;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0;font-size:12px;color:rgba(245,245,240,0.3);line-height:1.6;">
      Didn't sign up? You can safely ignore this email.
    </p>
  `);
}

function thankYouEmailHtml(firstName) {
  return emailWrapper(`
    <h1 style="margin:0 0 16px;font-size:30px;font-weight:700;color:#F5F5F0;line-height:1.1;letter-spacing:-0.01em;">
      You're in${firstName ? `, ${firstName}` : ''}.
    </h1>
    <p style="margin:0 0 20px;font-size:15px;font-weight:300;color:rgba(245,245,240,0.7);line-height:1.75;">
      Your spot is secured. When Coach Macro launches, you'll be among the first to access it — with <strong style="color:#F5F5F0;font-weight:500;">30 days completely free</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:15px;font-weight:300;color:rgba(245,245,240,0.7);line-height:1.75;">Here's what you've locked in:</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:28px;">
      ${[
        'Adaptive daily macros that update every time you train',
        'Unified food + lifting tracker — one system, finally',
        'AI restaurant scanner for eating out without guessing',
        'Real-time TDEE that adjusts on rest vs. training days',
        '30 days free at launch',
      ].map(item => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="display:inline-block;width:16px;color:#2979FF;font-weight:700;font-size:14px;">&rarr;</span>
          <span style="font-size:14px;font-weight:300;color:rgba(245,245,240,0.75);line-height:1.6;">${item}</span>
        </td>
      </tr>`).join('')}
    </table>
    <p style="margin:0;font-size:15px;font-weight:300;color:rgba(245,245,240,0.7);line-height:1.75;">
      We'll reach out the moment the doors open. See you at launch.
    </p>
  `);
}

export default withLogging(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const rateCheck = await checkRateLimit(req, '/api/waitlist');
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Too many sign-up attempts. Please wait before trying again.',
        resetIn: Math.ceil(rateCheck.resetIn || 3600),
      });
    }
  }

  const supabase = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { action, email, firstName, token } = req.method === 'GET'
      ? req.query
      : req.body;

    // ── JOIN WAITLIST ──────────────────────────────────────────────────────────
    if (req.method === 'POST' || action === 'join') {
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email required' });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const newToken = randomUUID();

      const { data: existing, error: existingError } = await supabase
        .from('waitlist')
        .select('id, confirmed')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingError) console.error('[waitlist] lookup error:', existingError.message);

      if (existing?.confirmed) {
        return res.status(200).json({ success: true });
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('waitlist')
          .update({ first_name: firstName?.trim() || null, confirm_token: newToken })
          .eq('email', normalizedEmail);
        if (updateError) console.error('[waitlist] update error:', updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from('waitlist')
          .insert({
            email: normalizedEmail,
            first_name: firstName?.trim() || null,
            confirm_token: newToken,
            confirmed: false,
            created_at: new Date().toISOString(),
          });
        if (insertError) {
          console.error('[waitlist] insert error:', insertError.message);
          return res.status(500).json({ error: 'Could not save your email. Try again.' });
        }
      }

      const proto = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const confirmUrl = `${proto}://${host}/api/waitlist?token=${newToken}`;

      const emailOk = await sendEmail(
        normalizedEmail,
        'Confirm your spot on the Coach Macro waitlist',
        confirmationEmailHtml(firstName?.trim(), confirmUrl)
      );
      if (!emailOk) console.error('[waitlist] confirmation email failed for:', normalizedEmail);

      return res.status(200).json({ success: true });
    }

    // ── CONFIRM EMAIL (GET ?token=XXX) ─────────────────────────────────────────
    if (req.method === 'GET') {
      if (!token) {
        res.setHeader('Location', 'https://coach-macro.com?waitlist=invalid');
        return res.status(302).end();
      }

      const { data, error: lookupError } = await supabase
        .from('waitlist')
        .select('*')
        .eq('confirm_token', token)
        .maybeSingle();

      if (lookupError) console.error('[waitlist] confirm lookup error:', lookupError.message);

      if (!data) {
        res.setHeader('Location', 'https://coach-macro.com?waitlist=invalid');
        return res.status(302).end();
      }

      if (!data.confirmed) {
        await supabase
          .from('waitlist')
          .update({ confirmed: true, confirmed_at: new Date().toISOString() })
          .eq('confirm_token', token);
        const emailOk = await sendEmail(
          data.email,
          "You're in. Your spot is secured.",
          thankYouEmailHtml(data.first_name)
        );
        if (!emailOk) console.error('[waitlist] thank-you email failed for:', data.email);
      }

      res.setHeader('Location', 'https://coach-macro.com?waitlist=confirmed');
      return res.status(302).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('[waitlist] unhandled error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
