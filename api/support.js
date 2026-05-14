import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from './middleware/rateLimit.js';
import { withLogging } from './middleware/logger.js';

const sb = createClient(
  'https://oxxihlwqukbakmnnavuy.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

export default withLogging(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rateCheck = await checkRateLimit(req, '/api/support');
  res.setHeader('X-RateLimit-Limit',     rateCheck.limit);
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Too many support requests. Please wait before trying again.',
      resetIn: Math.ceil(rateCheck.resetIn || 3600),
    });
  }

  const { name, email, category, subject, description } = req.body;

  if (!name || !email || !subject || !description) {
    return res.status(400).json({ error: 'All fields required' });
  }

  // Log ticket to DB for admin dashboard tracking (fire-and-forget)
  sb.from('support_tickets').insert({ name, email, category: category || 'general', subject, description }).catch(() => {});

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Coach Macro Support <support@coach-macro.com>',
      to: 'support@coach-macro.com',
      reply_to: email,
      subject: `[${category || 'General'}] ${subject}`,
      html: `
        <h2 style="font-family:sans-serif;color:#111;">New Support Ticket</h2>
        <table style="font-family:sans-serif;font-size:15px;color:#333;border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px 0;font-weight:600;width:120px;">From:</td><td>${name} (${email})</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Category:</td><td>${category || 'General'}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Subject:</td><td>${subject}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;vertical-align:top;">Description:</td><td style="white-space:pre-wrap;">${description}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;">Submitted:</td><td>${new Date().toISOString()}</td></tr>
        </table>
      `,
    }),
  });

  if (!response.ok) return res.status(500).json({ error: 'Failed to send' });
  return res.status(200).json({ success: true });
});
