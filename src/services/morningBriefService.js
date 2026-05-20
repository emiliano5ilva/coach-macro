import { sb, ai } from '../client';
import { getHyroxPhase } from './hyroxPeriodisationService.js';
import { getActiveDeload, getUpcomingDeload } from './deloadService.js';
import { getActivePlateaus } from './plateauService.js';
import { getLatestBalance, getBalanceCorrections } from './muscleBalanceService.js';

export async function gatherBriefContext(userId) {
  const { data: row } = await sb
    .from('profiles')
    .select('profile_data, wprefs, first_name, goal, skill_level, hyrox_race_date, hyrox_category, hyrox_experience, hyrox_weak_stations')
    .eq('id', userId)
    .maybeSingle();

  const p = row?.profile_data || {};
  const wp = row?.wprefs || {};
  // Prefer dedicated columns over JSONB fallbacks
  const firstName = row?.first_name || p.name || 'Athlete';
  const goalVal   = row?.goal || (p.goal || '').toLowerCase() || 'build_muscle';
  const skillLvl  = row?.skill_level || p.liftExp || 'intermediate';

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayKey = days[new Date().getDay()];
  const schedule = wp.schedule || {};
  const dayFocus = wp.dayFocus || {};
  const todayType = schedule[todayKey] || 'rest';
  const todayFocus = dayFocus[todayKey] || (todayType === 'rest' ? 'Rest' : 'Training');

  const [{ data: lastWorkout }, { data: foodLogs }] = await Promise.all([
    sb.from('workout_logs')
      .select('date, workout')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb.from('food_logs')
      .select('date, entries')
      .eq('user_id', userId)
      .gte('date', (() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().split('T')[0]; })())
      .order('date', { ascending: false }),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const yDate = new Date(); yDate.setDate(yDate.getDate() - 1);
  const yesterdayStr = yDate.toISOString().split('T')[0];

  const foodDates = new Set((foodLogs || []).filter(f => f.entries?.length > 0).map(f => f.date));
  let streak = foodDates.has(todayStr) ? 1 : 0;
  const chk = new Date(); chk.setDate(chk.getDate() - 1);
  while (foodDates.has(chk.toISOString().split('T')[0])) { streak++; chk.setDate(chk.getDate() - 1); }

  const yLog = (foodLogs || []).find(f => f.date === yesterdayStr);
  const yNutrition = yLog?.entries?.length
    ? yLog.entries.reduce((acc, e) => ({ calories: acc.calories + (e.calories || 0), protein: acc.protein + (e.protein || 0) }), { calories: 0, protein: 0 })
    : null;

  const goalCals = p.goalCals || 2200;
  const goal = goalVal;
  const protPct = goal === 'lose_fat' ? 0.35 : 0.30;
  const carbPct = goal === 'lose_fat' ? 0.30 : 0.45;
  const protG = Math.round((goalCals * protPct) / 4);
  const carbG = Math.round((goalCals * carbPct) / 4);
  const fatG = Math.round((goalCals - protG * 4 - carbG * 4) / 9);

  const sleepMap = { u5: 4.5, '5-6': 5.5, '6-7': 6.5, '7-8': 7.5, '8+': 8.5 };
  const startD = p.startDate ? new Date(p.startDate) : new Date();

  const goalNames = { build_muscle:'Build Muscle', get_stronger:'Get Stronger', lose_fat:'Lose Fat', recomp:'Body Recomposition', train_for_race:'Train for a Race', get_faster:'Get Faster' };

  const isHyrox = !!(wp.isHyrox || row?.hyrox_race_date);
  const hyroxRaceDate = wp.hyroxRaceDate || row?.hyrox_race_date || null;
  const hyroxPhase = hyroxRaceDate ? getHyroxPhase(hyroxRaceDate) : null;

  const [activeDeload, upcomingDeload, plateaus, latestBalance] = await Promise.all([
    getActiveDeload(userId).catch(() => null),
    getUpcomingDeload(userId).catch(() => null),
    getActivePlateaus(userId).catch(() => []),
    getLatestBalance(userId).catch(() => null),
  ]);
  const balanceCorrections = latestBalance ? getBalanceCorrections(latestBalance) : [];

  return {
    name: firstName,
    primaryGoal: goalNames[p.primaryGoal || goal] || (p.primaryGoal || goal),
    todayFocus,
    todayType,
    splitType: wp.splitType || 'PPL',
    weekNum: Math.floor(Math.max(0, (new Date() - startD) / 86400000) / 7) + 1,
    lastSession: lastWorkout
      ? `${lastWorkout.workout?.focus || 'Workout'} on ${new Date(lastWorkout.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' })}`
      : 'No recent session logged',
    macros: { calories: goalCals, protein: protG, carbs: carbG, fat: fatG },
    streak,
    sleepAvg: sleepMap[p.sleep] || 7,
    yesterdayNutrition: yNutrition,
    liftExp: skillLvl,
    isHyrox,
    hyroxPhase: hyroxPhase?.label || null,
    weeksToRace: hyroxPhase?.weeksUntilRace || null,
    hyroxRaceDate,
    hyroxCategory: wp.hyroxCategory || row?.hyrox_category || null,
    hyroxWeakStations: wp.hyroxWeakStations || row?.hyrox_weak_stations || [],
    isDeloadWeek: !!activeDeload,
    deloadIncoming: !activeDeload && !!upcomingDeload,
    deloadStartDate: upcomingDeload?.week_start || null,
    activePlateaus: (plateaus || []).slice(0, 2).map(p => ({
      exercise: p.exercise_name,
      strategy: p.strategy_prescribed,
    })),
    muscleImbalance: balanceCorrections.length > 0 ? balanceCorrections[0].type : null,
    imbalanceSeverity: balanceCorrections[0]?.severity || null,
  };
}

export async function generateBriefContent(ctx) {
  const yNote = ctx.yesterdayNutrition
    ? `Yesterday: ${ctx.yesterdayNutrition.calories} kcal logged, ${ctx.yesterdayNutrition.protein}g protein.`
    : 'No nutrition logged yesterday.';

  const hyroxBlock = ctx.isHyrox && ctx.hyroxPhase
    ? `- HYROX: ${ctx.weeksToRace}w to race | Phase: ${ctx.hyroxPhase}${ctx.hyroxWeakStations?.length ? ` | Weak stations: ${ctx.hyroxWeakStations.join(', ')}` : ''}${ctx.hyroxCategory ? ` | Category: ${ctx.hyroxCategory}` : ''}`
    : '';

  const deloadBlock = ctx.isDeloadWeek
    ? `IMPORTANT: This is a DELOAD WEEK. Today section should reference the lighter training and explain why it is productive not lazy. Coach Says should focus on quality of movement not intensity. Deload weeks are where the adaptations set in.`
    : ctx.deloadIncoming
      ? `NOTE: A deload week starts on ${ctx.deloadStartDate}. You may briefly reference this if relevant to recovery context.`
      : '';

  const muscleImbalanceBlock = ctx.muscleImbalance
    ? `MUSCLE BALANCE ALERT:\n${ctx.muscleImbalance === 'push_pull'
        ? 'Push volume significantly exceeds pull volume. If today is a push session suggest adding a pull exercise.'
        : 'Quad volume significantly exceeds posterior chain. If today is legs suggest adding Romanian deadlifts.'}\nSeverity: ${ctx.imbalanceSeverity}`
    : '';

  const plateauBlock = ctx.activePlateaus?.length > 0
    ? `PLATEAU CONTEXT:\nThese lifts are currently stalled:\n${ctx.activePlateaus.map(p => `${p.exercise}: use ${p.strategy}`).join('\n')}\nIf today involves these exercises reference the plateau-breaking strategy in Coach Says.`
    : '';

  const prompt = `You are Coach Macro, a world-class personal trainer. Generate a structured morning briefing for your athlete.${deloadBlock ? `\n\n${deloadBlock}` : ''}${plateauBlock ? `\n\n${plateauBlock}` : ''}${muscleImbalanceBlock ? `\n\n${muscleImbalanceBlock}` : ''}

Context:
- Name: ${ctx.name}
- Goal: ${ctx.primaryGoal}
- Today: ${ctx.todayFocus} (${ctx.todayType === 'rest' ? 'rest day' : 'training day'}) — Week ${ctx.weekNum} of ${ctx.splitType}
- Last session: ${ctx.lastSession}
- Today's targets: ${ctx.macros.calories} kcal | ${ctx.macros.protein}g protein | ${ctx.macros.carbs}g carbs | ${ctx.macros.fat}g fat
- Logging streak: ${ctx.streak} days
- Sleep: ${ctx.sleepAvg}h avg
- ${yNote}${hyroxBlock ? `\n- ${hyroxBlock}` : ''}

Return ONLY valid JSON:
{
  "greeting": "Short punchy greeting using their first name (1 sentence)",
  "yesterday": "Yesterday recap — session or rest, nutrition hit or miss (1-2 sentences, specific numbers if available)",
  "today": "Today's focus — specific target, key lift or macro priority aligned to their goal (2-3 sentences)",
  "coach_says": "One sharp insight based on their data — streak, sleep, pattern, or momentum (1-2 sentences)",
  "sign_off": "— Coach Macro"
}

Direct. Specific. Like a real coach texting. No generic phrases.`;

  const raw = await ai(prompt, 600, 'morning_brief');
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON in AI response');
  return JSON.parse(match[0]);
}

export async function getMorningBrief(userId) {
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: cached } = await sb
    .from('morning_briefs')
    .select('content')
    .eq('user_id', userId)
    .eq('brief_date', todayStr)
    .maybeSingle();

  if (cached?.content) return cached.content;

  const ctx = await gatherBriefContext(userId);
  const content = await generateBriefContent(ctx);

  await sb.from('morning_briefs').upsert(
    { user_id: userId, brief_date: todayStr, content, generated_at: new Date().toISOString() },
    { onConflict: 'user_id,brief_date' }
  );

  return content;
}
