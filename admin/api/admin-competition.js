import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from './admin-verify.js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing Supabase credentials. ' +
    'URL: ' + !!SUPABASE_URL +
    ' Key: ' + !!SUPABASE_KEY
  );
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const session = await verifyAdminSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { action } = req.query;

      if (action === 'competitors') {
        const { data, error } = await sb
          .from('competitors')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ data });
      }

      if (action === 'calendar') {
        const { data, error } = await sb
          .from('content_calendar')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        return res.json({ data });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'POST') {
      const { action, ...payload } = req.body || {};

      if (action === 'add_competitor') {
        const { username, platform, notes } = payload;
        const { error } = await sb
          .from('competitors')
          .insert({ username, platform, notes: notes || null });
        if (error) throw error;
        return res.json({ ok: true });
      }

      if (action === 'remove_competitor') {
        const { id } = payload;
        const { error } = await sb
          .from('competitors')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return res.json({ ok: true });
      }

      if (action === 'add_calendar') {
        const { title, content_type, caption, higgsfield_prompt, platform, status } = payload;
        const { error } = await sb
          .from('content_calendar')
          .insert({ title, content_type, caption, higgsfield_prompt, platform, status });
        if (error) throw error;
        return res.json({ ok: true });
      }

      if (action === 'update_calendar_status') {
        const { id, status } = payload;
        const { error } = await sb
          .from('content_calendar')
          .update({ status })
          .eq('id', id);
        if (error) throw error;
        return res.json({ ok: true });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[admin-competition]', error.message);
    return res.status(500).json({ error: 'Internal error' });
  }
}
