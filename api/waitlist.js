import { createClient } from '@supabase/supabase-js';
import React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WaitlistConfirmation } from '../emails/WaitlistConfirmation.jsx';
import { checkRateLimit } from './middleware/rateLimit.js';
import { withLogging } from './middleware/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'team@send.coach-macro.com';
const REPLY_TO = process.env.REPLY_TO_EMAIL || 'team@coach-macro.com';

async function sendEmail(to, subject, html) {
  const { error } = await resend.emails.send({
    from: `Coach Macro <${FROM}>`,
    reply_to: REPLY_TO,
    to,
    subject,
    html,
  });
  if (error) { console.error('[resend]', error); return false; }
  return true;
}

export default withLogging(async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateCheck = await checkRateLimit(req, '/api/waitlist');
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Too many sign-up attempts. Please wait before trying again.',
      resetIn: Math.ceil(rateCheck.resetIn || 3600),
    });
  }

  const supabase = createClient(
    'https://oxxihlwqukbakmnnavuy.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { email, firstName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const name = firstName?.trim() || null;

    // Already on the list — return success silently, no re-send
    const { data: existing, error: lookupError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (lookupError) console.error('[waitlist] lookup error:', lookupError.message);
    if (existing) return res.status(200).json({ success: true });

    // Insert confirmed immediately
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: normalizedEmail,
        first_name: name,
        confirmed: true,
        confirmed_at: now,
        created_at: now,
      });

    if (insertError) {
      console.error('[waitlist] insert error:', insertError.message);
      return res.status(500).json({ error: 'Could not save your email. Try again.' });
    }

    // Send "You're in." immediately
    const html = await render(React.createElement(WaitlistConfirmation, { firstName: name || '' }));
    const emailOk = await sendEmail(normalizedEmail, "You're in.", html);
    if (!emailOk) console.error('[waitlist] email failed for:', normalizedEmail);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[waitlist] unhandled error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
