import { sb } from '../client.js';

export async function saveMealToMemory(userId, date, slot, slotEntries, sessionType) {
  if (!userId || !slotEntries?.length) return;
  const totals = slotEntries.reduce((acc, e) => ({
    calories: acc.calories + (e.calories || 0),
    protein:  acc.protein  + (e.protein  || 0),
    carbs:    acc.carbs    + (e.carbs    || 0),
    fat:      acc.fat      + (e.fat      || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const compactEntries = slotEntries.slice(0, 10).map(e => ({
    food:     e.food || e.name || '',
    calories: e.calories || 0,
    protein:  e.protein  || 0,
    carbs:    e.carbs    || 0,
    fat:      e.fat      || 0,
  }));

  await sb.from('macro_memory').upsert({
    user_id:         userId,
    logged_at:       date,
    slot,
    entries:         compactEntries,
    total_calories:  Math.round(totals.calories),
    total_protein:   Math.round(totals.protein  * 10) / 10,
    total_carbs:     Math.round(totals.carbs     * 10) / 10,
    total_fat:       Math.round(totals.fat       * 10) / 10,
    session_type:    sessionType || null,
  }, { onConflict: 'user_id,logged_at,slot' });
}

export async function getRecentMealsForSlot(userId, slot, limit = 6) {
  const { data } = await sb
    .from('macro_memory')
    .select('id,logged_at,entries,total_calories,total_protein,total_carbs,total_fat,session_type')
    .eq('user_id', userId)
    .eq('slot', slot)
    .order('logged_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function getFrequentMeals(userId, slot, limit = 6) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const { data } = await sb
    .from('macro_memory')
    .select('entries,total_calories,total_protein,total_carbs,total_fat,logged_at')
    .eq('user_id', userId)
    .eq('slot', slot)
    .gte('logged_at', cutoff.toISOString().split('T')[0])
    .order('logged_at', { ascending: false })
    .limit(60);
  if (!data?.length) return [];
  const counts = {};
  data.forEach(row => {
    const key = (row.entries || []).map(e => e.food).sort().join('|');
    if (!key) return;
    if (!counts[key]) counts[key] = { count: 0, row };
    counts[key].count++;
    counts[key].row = row;
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ count, row }) => ({ ...row, count }));
}

export async function getPerformanceCorrelations(userId) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const { data } = await sb
    .from('macro_memory')
    .select('logged_at,total_calories,total_protein,session_type')
    .eq('user_id', userId)
    .gte('logged_at', cutoff.toISOString().split('T')[0])
    .not('session_type', 'is', null)
    .order('logged_at', { ascending: false })
    .limit(100);
  if (!data?.length) return null;
  const groups = {};
  data.forEach(row => {
    const k = row.session_type;
    if (!groups[k]) groups[k] = { cals: [], protein: [] };
    groups[k].cals.push(row.total_calories);
    groups[k].protein.push(Number(row.total_protein));
  });
  return Object.entries(groups).map(([type, vals]) => ({
    session_type: type,
    avg_calories: Math.round(vals.cals.reduce((a, b) => a + b, 0) / vals.cals.length),
    avg_protein:  Math.round(vals.protein.reduce((a, b) => a + b, 0) / vals.protein.length * 10) / 10,
    count:        vals.cals.length,
  }));
}
