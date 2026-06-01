import { sb } from '../supabase.js';

async function mergeProfileData(userId, patch) {
  const { data, error: fetchErr } = await sb
    .from('profiles')
    .select('profile_data')
    .eq('id', userId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error } = await sb
    .from('profiles')
    .update({ profile_data: { ...(data?.profile_data ?? {}), ...patch } })
    .eq('id', userId);
  if (error) throw error;
}

export async function saveRunProfile(userId, runProfile) {
  return mergeProfileData(userId, { runProfile });
}

export async function saveHyroxProfile(userId, hyroxProfile) {
  return mergeProfileData(userId, { hyroxProfile });
}
