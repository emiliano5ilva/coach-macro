import { sb, ai } from '../client';
import { getHyroxPhase } from './hyroxPeriodisationService.js';
import { getTodayNutritionProtocol } from './nutritionPeriodisationService.js';
import { getRunningPhase } from './runningPeriodisationService.js';
import { getStrengthPhase } from './strengthPeriodisationService.js';
import { getActiveDeload, getUpcomingDeload } from './deloadService.js';
import { getActivePlateaus } from './plateauService.js';
import { getLatestBalance, getBalanceCorrections } from './muscleBalanceService.js';
import { getRecentAdjustments } from './periodisationService.js';
import { analyseRPETrends } from './rpeTrendingService.js';
import { getPreLoadingNote, getProteinDistributionInsight } from './nutritionTimingService.js';
import { computeLoadMetrics } from './trainingLoadService.js';
import { getWeatherPaceAdjustment } from './weatherService.js';

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
  const runRaceDate = row?.run_race_date || wp.runRaceDate || null;
  const runPhase = runRaceDate ? getRunningPhase(runRaceDate) : null;
  const strengthCompDate = row?.strength_comp_date || wp.strengthCompDate || null;
  const strengthPhase = strengthCompDate ? getStrengthPhase(strengthCompDate) : null;

  const [activeDeload, upcomingDeload, plateaus, latestBalance, recentAdjs, rpeTrends, nutritionProtocol, todayCheckinRow, adaptiveProfileRow] = await Promise.all([
    getActiveDeload(userId).catch(() => null),
    getUpcomingDeload(userId).catch(() => null),
    getActivePlateaus(userId).catch(() => []),
    getLatestBalance(userId).catch(() => null),
    getRecentAdjustments(userId).catch(() => []),
    analyseRPETrends(userId).catch(() => null),
    getTodayNutritionProtocol(userId).catch(() => null),
    sb.from('morning_checkins').select('*').eq('user_id', userId).eq('date', todayStr).maybeSingle().then(r=>r.data).catch(()=>null),
    sb.from('profiles').select('adaptive_profile').eq('id', userId).maybeSingle().then(r=>r.data?.adaptive_profile).catch(()=>null),
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
    lastAdjustment: recentAdjs[0]?.action !== 'no_change' ? recentAdjs[0] : null,
    fatigueLevel: rpeTrends?.overallFatigue || null,
    fatigueExercises: (rpeTrends?.fatigueSignals || [])
      .filter(s => s.type === 'exercise_rpe_drift')
      .map(s => s.exercise)
      .slice(0, 2),
    nutritionProtocol: nutritionProtocol?.protocol_type || null,
    nutritionProtocolReason: nutritionProtocol?.reason || null,
    adjustedCalories: nutritionProtocol?.adjusted_calories || null,
    runPhase: runPhase?.label || null,
    runWeeksToRace: runPhase?.weeksUntilRace || null,
    runFocusWorkout: runPhase?.focusWorkout || null,
    strengthPhase: strengthPhase?.label || null,
    strengthWeeksToComp: strengthPhase?.weeksUntilRace || null,
    strengthRepRange: strengthPhase?.repRange || null,
    goalTimeline: p.goalTimeline || null,
    sex: p.sex || null,
    menopauseSymptoms: p.menopauseSymptoms || [],
    cycleCondition: p.cycleCondition || null,
    strengthWeightClass: wp.strengthWeightClass || p.strengthWeightClass || null,
    strengthCompType: wp.strength_comp_type || p.strength_comp_type || null,
    strengthCompFederation: wp.strength_comp_federation || p.strength_comp_federation || null,
    // Adaptive coaching
    todayCheckin: todayCheckinRow ?? null,
    weeklyAnalysis: adaptiveProfileRow?.lastAnalysis ?? null,
    preLoadingNote: null,   // computed below
    proteinInsight: null,   // computed below
    hrvNote: null,          // computed below
  };

  // Derive tomorrow's session from the schedule for pre-loading
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][tomorrow.getDay()];
  const tomorrowType = (wp.schedule || {})[tomorrowKey] || 'rest';
  const tomorrowFocus = (wp.dayFocus || {})[tomorrowKey] || null;
  const tomorrowSession = tomorrowType === 'training'
    ? { type: tomorrowFocus || 'Strength', exercises: null }
    : null;
  ctx.preLoadingNote = getPreLoadingNote(tomorrowSession, p);

  // Protein distribution from food_history (use richer food_history table)
  const { data: foodHistoryRows } = await sb.from('food_history').select('date,calories,protein').eq('user_id', userId).order('date', { ascending: false }).limit(7);
  const proteinTarget = Math.round(((p.goalCals || 2200) * 0.30) / 4);
  ctx.proteinInsight = getProteinDistributionInsight(foodHistoryRows ?? [], proteinTarget);

  // Weather — only relevant for run days
  const isRunDay = tomorrowType === 'training' || todayType === 'training';
  if (isRunDay && (wp.isHybrid || wp.isHyrox || (wp.splitType||'').toLowerCase().includes('run'))) {
    const coords = await new Promise(resolve => {
      if (!navigator?.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 4000, maximumAge: 3600000 }
      );
    });
    if (coords) {
      const weather = await getWeatherPaceAdjustment(coords.lat, coords.lon).catch(() => null);
      ctx.weatherNote = weather?.note ?? null;
    }
  }
  if (!ctx.weatherNote) ctx.weatherNote = null;

  // HRV note — only when HRV differs meaningfully from baseline
  const latestHRV  = p?.latestHRV ?? adaptiveProfileRow?.lastAnalysis?.latestHRV ?? null;
  const hrvBaseline = p?.hrvBaseline ?? null;
  if (latestHRV && hrvBaseline) {
    const ratio = latestHRV.value / hrvBaseline;
    if (Math.abs(ratio - 1) > 0.10) {
      const direction = ratio < 1 ? 'below' : 'above';
      ctx.hrvNote = `HRV: ${latestHRV.value.toFixed(0)}ms (baseline ${hrvBaseline.toFixed(0)}ms — ${Math.round(Math.abs(ratio - 1) * 100)}% ${direction} normal)`;
    }
  }

  return ctx;
}

export async function generateBriefContent(ctx) {
  const yNote = ctx.yesterdayNutrition
    ? `Yesterday: ${ctx.yesterdayNutrition.calories} kcal logged, ${ctx.yesterdayNutrition.protein}g protein.`
    : 'No nutrition logged yesterday.';

  const fatigueBlock = ctx.fatigueLevel === 'high'
    ? `FATIGUE ALERT: This athlete is showing high fatigue signals from RPE trending data${ctx.fatigueExercises?.length ? ` (affected: ${ctx.fatigueExercises.join(', ')})` : ''}. Coach Says MUST recommend backing off intensity today or taking a rest day. Do NOT recommend pushing hard.`
    : ctx.fatigueLevel === 'medium'
      ? `MILD FATIGUE: RPE is trending up slightly${ctx.fatigueExercises?.length ? ` on ${ctx.fatigueExercises.join(', ')}` : ''}. Coach Says should mention monitoring effort today and backing off if needed.`
      : '';

  const adjustmentBlock = ctx.lastAdjustment
    ? ctx.lastAdjustment.action === 'advance'
      ? `NOTE: Program was advanced to Week ${ctx.lastAdjustment.new_week} based on strong performance signals. Mention this briefly in today section — athlete is ahead of schedule.`
      : `NOTE: Program week was repeated (Week ${ctx.lastAdjustment.new_week}) due to: ${ctx.lastAdjustment.reason}. Reference this in today section — frame it as smart training, not failure.`
    : '';

  const runningBlock = ctx.runPhase
    ? `RUNNING CONTEXT:\nPhase: ${ctx.runPhase}\nWeeks to race: ${ctx.runWeeksToRace}\nFocus workout type: ${ctx.runFocusWorkout || 'easy run'}\nCoach Says should reflect the current running phase and what matters most right now.`
    : '';

  const strengthCompBlock = ctx.strengthPhase
    ? `STRENGTH COMPETITION CONTEXT:\nPhase: ${ctx.strengthPhase}\nWeeks to competition: ${ctx.strengthWeeksToComp}\nRep range focus: ${ctx.strengthRepRange || '4-6'}\nCoach Says should reflect the current strength phase — what to prioritise in training.`
    : '';

  const nutritionBlock = ctx.nutritionProtocol && ctx.nutritionProtocol !== 'standard'
    ? ctx.nutritionProtocol === 'refeed'
      ? `NUTRITION: Today is a REFEED DAY (${ctx.adjustedCalories} kcal). Briefly mention this in yesterday or coach_says — frame it as a metabolism reset, not a cheat day.`
      : ctx.nutritionProtocol === 'carb_load'
        ? `NUTRITION: Tomorrow is race day — today is a CARB LOADING day (${ctx.adjustedCalories} kcal). Reference this in today section — top up glycogen, go easy on fat.`
        : ctx.nutritionProtocol === 'race_day'
          ? `NUTRITION: RACE DAY. Targets are high-carb (${ctx.adjustedCalories} kcal). Reference this in today and coach_says.`
          : ctx.nutritionProtocol === 'training_day'
            ? `NUTRITION: Calorie cycling active — training day boost to ${ctx.adjustedCalories} kcal. Mention extra fuel in today section.`
            : ''
    : '';

  const hyroxBlock = ctx.isHyrox && ctx.hyroxPhase
    ? `- HYROX: ${ctx.weeksToRace}w to race | Phase: ${ctx.hyroxPhase}${ctx.hyroxWeakStations?.length ? ` | Weak stations: ${ctx.hyroxWeakStations.join(', ')}` : ''}${ctx.hyroxCategory ? ` | Category: ${ctx.hyroxCategory}` : ''}`
    : '';

  const goalTimelineBlock = ctx.goalTimeline
    ? `GOAL DEADLINE: Athlete wants to achieve their goal within ${ctx.goalTimeline}. Reference this timeline in today or coach_says if relevant — create a sense of productive urgency without pressure.`
    : '';

  const femaleHealthBlock = ctx.sex === 'female' && (ctx.menopauseSymptoms?.length || ctx.cycleCondition)
    ? `FEMALE HEALTH CONTEXT:${ctx.cycleCondition ? ` Cycle condition: ${ctx.cycleCondition}.` : ''}${ctx.menopauseSymptoms?.length ? ` Menopause symptoms: ${ctx.menopauseSymptoms.join(', ')}.` : ''} Tailor coach_says to acknowledge these factors — recovery, energy variability, and appropriate intensity. Be supportive and science-informed, not generic.`
    : '';

  const strengthWeightClassBlock = ctx.strengthWeightClass
    ? `STRENGTH COMPETITION: Weight class target: ${ctx.strengthWeightClass}${ctx.strengthCompType ? ` | Type: ${ctx.strengthCompType}` : ''}${ctx.strengthCompFederation ? ` | Federation: ${ctx.strengthCompFederation}` : ''}. If relevant, briefly mention weight management or competition prep context.`
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

  const skillTier = (ctx.liftExp || 'intermediate').toLowerCase();
  const writingStyleBlock = skillTier === 'beginner'
    ? `WRITING STYLE: This athlete is a BEGINNER. Write in plain everyday language — no jargon. Never say "deload", "RPE", "periodisation", "hypertrophy", "TDEE", "progressive overload", or similar technical terms. Instead say "rest week", "how hard the workout felt", "your eating plan", "building muscle", "calorie target", "gradually adding weight". Keep it warm, encouraging, and simple. Explain the why in plain English.`
    : skillTier === 'advanced'
      ? `WRITING STYLE: This is an ADVANCED athlete. Use precise coaching language — RPE, deload, hypertrophy, progressive overload, periodisation are all fine. Be concise and data-driven. Skip motivational fluff.`
      : `WRITING STYLE: This is an INTERMEDIATE athlete. Use standard coaching terms but briefly clarify any technical concepts when relevant. Be direct and data-informed.`;

  // ── Adaptive coaching block ────────────────────────────────────────────────
  const checkin = ctx.todayCheckin;
  const analysis = ctx.weeklyAnalysis;
  const adaptiveBlock = (checkin || analysis) ? `
ADAPTIVE COACHING DATA:
${JSON.stringify({
  todayReadiness: checkin?.readiness ?? null,
  soreness: checkin ? {
    level: checkin.overall_soreness,
    primaryAreas: checkin.primary_soreness,
    secondaryAreas: checkin.secondary_soreness,
  } : null,
  weeklyAnalysis: analysis ? {
    status: analysis.trainingStatus,
    insight: analysis.keyInsight,
    nutritionNote: analysis.nutritionInsight,
    morningNote: analysis.morningBriefNote,
    focusAreas: analysis.focusNextWeek,
    deloadRecommended: analysis.deloadRecommended,
    injuryRisk: analysis.injuryRisk,
    injuryNote: analysis.injuryNote,
  } : null,
}, null, 2)}

Use this data to make the brief feel like a real coach who knows this athlete intimately. Reference soreness by muscle name if reported. Acknowledge what is progressing. Be specific about today's session adjustments. Never be generic.` : '';

  // Training load block
  const { data: loadLogs } = await sb.from('workout_logs').select('date,session_duration_mins,workout,volume_lbs').eq('user_id', (await sb.auth.getUser()).data.user?.id ?? 'x').gte('date', (() => { const d=new Date(); d.setDate(d.getDate()-60); return d.toISOString().split('T')[0]; })()).order('date',{ascending:false}).limit(60).catch(()=>({data:[]}));
  const load = computeLoadMetrics(ctx._workoutLogs ?? loadLogs ?? []);
  const tsbBlock = load.tsb < -20
    ? `\n\nLOAD ALERT: Training stress balance is critically negative (TSB: ${load.tsb}). Athlete is likely overreached. Recommend recovery focus today.`
    : (load.tsb > 10 && ctx.runProfile?.raceDate)
    ? `\n\nFORM PEAK: Athlete is in optimal form (TSB: +${load.tsb}). Race-ready.`
    : '';

  const hrvBlock = ctx.hrvNote
    ? `\n\nHRV NOTE: ${ctx.hrvNote}. Reference this in coach_says if it meaningfully affects today's training recommendation.`
    : '';
  const weatherBlock = ctx.weatherNote
    ? `\n\nWEATHER NOTE: ${ctx.weatherNote} Warn the athlete explicitly in coach_says before they head out.`
    : '';
  const preLoadBlock = ctx.preLoadingNote
    ? `\n\nTONIGHT'S NUTRITION NOTE: ${ctx.preLoadingNote.message} Adjust the evening meal recommendation accordingly.`
    : '';
  const proteinBlock = ctx.proteinInsight
    ? `\n\nPROTEIN INSIGHT: ${ctx.proteinInsight.message}`
    : '';

  const prompt = `You are Coach Macro, a world-class personal trainer. Generate a structured morning briefing for your athlete.\n\n${writingStyleBlock}${deloadBlock ? `\n\n${deloadBlock}` : ''}${fatigueBlock ? `\n\n${fatigueBlock}` : ''}${adjustmentBlock ? `\n\n${adjustmentBlock}` : ''}${plateauBlock ? `\n\n${plateauBlock}` : ''}${muscleImbalanceBlock ? `\n\n${muscleImbalanceBlock}` : ''}${nutritionBlock ? `\n\n${nutritionBlock}` : ''}${runningBlock ? `\n\n${runningBlock}` : ''}${strengthCompBlock ? `\n\n${strengthCompBlock}` : ''}${goalTimelineBlock ? `\n\n${goalTimelineBlock}` : ''}${femaleHealthBlock ? `\n\n${femaleHealthBlock}` : ''}${strengthWeightClassBlock ? `\n\n${strengthWeightClassBlock}` : ''}${adaptiveBlock}${tsbBlock}${hrvBlock}${weatherBlock}${preLoadBlock}${proteinBlock}

Context:
- Name: ${ctx.name}
- Goal: ${ctx.primaryGoal}
- Experience level: ${skillTier}
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
  "coach_tip": "ONE short punchy sentence (max 12 words). What a real coach would say to this athlete before their session. Direct. No fluff. Examples: 'Focus on form over load today.' / 'Heavy today. Earn it.' / 'Your body is recovered. Push.' / 'Nail your protein today — that is the job.'",
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
