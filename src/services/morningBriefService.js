import { sb } from '../client';
import { getTodayInsights } from './validationService.js';
import { recallApplicableLearnings } from './coachMemoryService.js';
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
import { predictSoreness } from './domsLearningService.js';
import { getCycleAdjustment } from './cyclePatternService.js';
import { getWeatherPaceAdjustment } from './weatherService.js';
import { resolveProgram } from '../utils/programResolver.js';
import { selectDayKey, baseName } from '../programs.js';

export async function gatherBriefContext(userId) {
  const { data: row } = await sb
    .from('profiles')
    .select('profile_data, wprefs, first_name, goal, skill_level, hyrox_race_date, hyrox_category, hyrox_experience, hyrox_weak_stations, schedule, run_race_type, run_race_date, program_start_date')
    .eq('id', userId)
    .maybeSingle();

  const p = row?.profile_data || {};
  const wp = row?.wprefs || {};
  // Canonical program mode — SAME source the Today card (ob_screens2) and Train tab
  // (sections.jsx) use, so the brief describes the program identically and can't be
  // driven by the stale-sticky run_race_type. run_race_type/run_race_date are COLUMNS
  // (not in profile_data), so fold them into the profile arg resolveProgram reads.
  const _profileForResolve = { ...p, run_race_type: row?.run_race_type ?? null, run_race_date: row?.run_race_date ?? null };
  const _resolved = resolveProgram(wp, _profileForResolve);
  const _mode = _resolved.mode;
  const _progName = (((_mode === 'lifting' || _mode === 'conditioning')
    && _resolved.displayName && _resolved.displayName !== 'No program set')
    ? _resolved.displayName : null) || wp.splitType || 'PPL';
  // Prefer dedicated columns over JSONB fallbacks
  const firstName = row?.first_name || p.name || 'Athlete';
  const goalVal   = row?.goal || (p.goal || '').toLowerCase() || 'build_muscle';
  const skillLvl  = row?.skill_level || p.liftExp || 'intermediate';

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayKey = days[new Date().getDay()];
  const schedule = row?.schedule || wp.schedule || {};
  const dayFocus = wp.dayFocus || {};
  const todayType = schedule[todayKey] || 'rest';
  let todayFocus = dayFocus[todayKey] || (todayType === 'rest' ? 'Rest' : 'Training');
  // For lifting/conditioning, name the actual split day ("Lower") via the SAME selector
  // the Today card/WeekStrip use (selectDayKey), so the brief agrees with the card.
  // _WDAYS + the training-day count mirror NativeApp.jsx:932 exactly to guarantee the
  // same daysPerWeek → same selectDayKey result (Object.values(schedule) would diverge
  // on any non-weekday key). dayOffset 0 = today, matching the card's WeekStrip.
  if ((_mode === 'lifting' || _mode === 'conditioning') && todayType === 'training') {
    const _WDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const _dpw = _WDAYS.filter(d => schedule[d] === 'training').length || 4;
    const _psd = row?.program_start_date || null; // [B] never tenure startDate; selectDayKey bootstraps from null
    const _dk = selectDayKey(wp.splitType, _dpw, schedule, _psd, 0);
    if (_dk) todayFocus = baseName(_dk);
  }

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

  const isHyrox = (_mode === 'hyrox' || _mode === 'hybrid-hyrox');
  const hyroxRaceDate = wp.hyroxRaceDate || row?.hyrox_race_date || null;
  const hyroxPhase = hyroxRaceDate ? getHyroxPhase(hyroxRaceDate) : null;
  const runRaceDate = row?.run_race_date || wp.runRaceDate || null;
  const runPhase = (_mode === 'running' && runRaceDate) ? getRunningPhase(runRaceDate) : null;
  const strengthCompDate = row?.strength_comp_date || wp.strengthCompDate || null;
  const strengthPhase = strengthCompDate ? getStrengthPhase(strengthCompDate) : null;

  const [activeDeload, upcomingDeload, plateaus, latestBalance, recentAdjs, rpeTrends, nutritionProtocol, todayCheckinRow, adaptiveProfileRow, rawValidationInsights, yWorkoutRow] = await Promise.all([
    getActiveDeload(userId).catch(() => null),
    getUpcomingDeload(userId).catch(() => null),
    getActivePlateaus(userId).catch(() => []),
    getLatestBalance(userId).catch(() => null),
    getRecentAdjustments(userId).catch(() => []),
    analyseRPETrends(userId).catch(() => null),
    getTodayNutritionProtocol(userId).catch(() => null),
    sb.from('morning_checkins').select('*').eq('user_id', userId).eq('date', todayStr).maybeSingle().then(r=>r.data).catch(()=>null),
    sb.from('profiles').select('adaptive_profile').eq('id', userId).maybeSingle().then(r=>r.data?.adaptive_profile).catch(()=>null),
    getTodayInsights(userId).catch(() => []),  // cached daily — fast SELECT
    sb.from('workout_logs').select('date,workout,pr_count,volume_lbs,session_duration_mins').eq('user_id', userId).eq('date', yesterdayStr).maybeSingle().then(r=>r.data).catch(()=>null),
  ]);
  const balanceCorrections = latestBalance ? getBalanceCorrections(latestBalance) : [];

  // Pick the single most important validation finding (high/severe, highest confidence)
  const PRIORITY_RANK = { severe: 0, high: 1, medium: 2, low: 3 };
  const topValidation = (rawValidationInsights || [])
    .filter(i => i.priority === 'severe' || i.priority === 'high')
    .sort((a, b) => {
      const pd = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
      return pd !== 0 ? pd : (b.confidence ?? 0) - (a.confidence ?? 0);
    })[0] ?? null;

  // Coach memory recall — only fires when there's a real high/severe finding
  let memoryRecall = null;
  if (topValidation) {
    memoryRecall = await recallApplicableLearnings(userId, topValidation.insight_type, { goal: goalVal })
      .catch(() => null);
  }

  const ctx = {
    name: firstName,
    primaryGoal: goalNames[p.primaryGoal || goal] || (p.primaryGoal || goal),
    todayFocus,
    todayType,
    splitType: _progName,
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
    // Yesterday's workout (date-exact: today - 1, null = rest day or no log)
    yesterdayWorkout: yWorkoutRow ? {
      focus:     yWorkoutRow.workout?.focus || 'Session',
      prCount:   yWorkoutRow.pr_count ?? 0,
      volumeLbs: yWorkoutRow.volume_lbs ?? 0,
      durationMins: yWorkoutRow.session_duration_mins ?? 0,
    } : null,
    // Adaptive coaching
    todayCheckin: todayCheckinRow ?? null,
    weeklyAnalysis: adaptiveProfileRow?.lastAnalysis ?? null,
    preLoadingNote: null,   // computed below
    proteinInsight: null,   // computed below
    hrvNote: null,          // computed below
    // Intelligence layers
    topValidation: topValidation ? {
      type:           topValidation.insight_type,
      priority:       topValidation.priority,
      message:        topValidation.message,
      recommendation: topValidation.recommendation,
      confidence:     topValidation.confidence ?? 70,
    } : null,
    memoryRecall: (memoryRecall?.has_applicable_history && memoryRecall?.intelligent_suggestion) ? {
      suggestion:  memoryRecall.intelligent_suggestion,
      pastExample: memoryRecall.similar_past?.[0] ? {
        intervention: memoryRecall.similar_past[0].intervention,
        outcome:      memoryRecall.similar_past[0].outcome,
        effectiveness:memoryRecall.similar_past[0].effectiveness,
        when:         memoryRecall.similar_past[0].date,
      } : null,
    } : null,
  };

  // ── Optional enrichments — each wrapped so a failure degrades to null, never crashes ──

  // Pre-loading note (tomorrow's session context)
  try {
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][tomorrow.getDay()];
    const tomorrowType = (row?.schedule || wp.schedule || {})[tomorrowKey] || 'rest';
    const tomorrowFocus = (wp.dayFocus || {})[tomorrowKey] || null;
    const tomorrowSession = tomorrowType === 'training' ? { type: tomorrowFocus || 'Strength', exercises: null } : null;
    ctx.preLoadingNote = getPreLoadingNote(tomorrowSession, p);
  } catch { ctx.preLoadingNote = null; }

  // Protein distribution — food_logs has calories/protein inside entries JSONB, not top-level
  try {
    const { data: recentFoodRows } = await sb.from('food_logs').select('date,entries').eq('user_id', userId).order('date', { ascending: false }).limit(7);
    const foodHistoryRows = (recentFoodRows || []).map(r => ({
      date: r.date,
      calories: (r.entries||[]).reduce((s,e)=>s+(e.calories||0),0),
      protein:  (r.entries||[]).reduce((s,e)=>s+(e.protein||0),0),
    })).filter(r => r.calories > 0);
    const proteinTarget = Math.round(((p.goalCals || 2200) * 0.30) / 4);
    ctx.proteinInsight = getProteinDistributionInsight(foodHistoryRows, proteinTarget);
  } catch { ctx.proteinInsight = null; }

  // DOMS predictions
  try {
    const { data: recentLogsForDoms } = await sb.from('workout_logs').select('date,workout').eq('user_id', userId).order('date', { ascending: false }).limit(30);
    const domsProfile = adaptiveProfileRow?.domsProfile ?? null;
    const domsPreds = predictSoreness(recentLogsForDoms ?? [], domsProfile, 1);
    ctx.domsPredictions = Object.entries(domsPreds)
      .filter(([, p]) => p.isPeaking || (p.isBuilding && p.hoursToPeak < 12))
      .map(([zone, p]) => ({ zone, status: p.isPeaking ? 'peaking' : 'building', hoursToRecovery: p.hoursToRecovery }));
  } catch { ctx.domsPredictions = []; }

  // Cycle pattern
  try {
    const profileForCycle = { profile_data: p };
    const cycleAdj = getCycleAdjustment(profileForCycle, adaptiveProfileRow);
    const cp = adaptiveProfileRow?.cycleProfile;
    ctx.cycleInsight = cycleAdj?.insight ?? null;
    ctx.cycleDataProgress = (cp && !cp.hasEnoughData)
      ? `${cp.observations?.length ?? 0} days of cycle data collected — personalised cycle insights unlock at ${cp.observationsNeeded} more days`
      : null;
  } catch { ctx.cycleInsight = null; ctx.cycleDataProgress = null; }

  // Weather (run athletes only)
  ctx.weatherNote = null;
  try {
    const tomorrowKeyW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(Date.now()+864e5).getDay()];
    const tomorrowTypeW = (row?.schedule || wp.schedule || {})[tomorrowKeyW] || 'rest';
    const isRunDay = tomorrowTypeW === 'training' || todayType === 'training';
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
  } catch { ctx.weatherNote = null; }

  // HRV note
  try {
    const latestHRV  = p?.latestHRV ?? adaptiveProfileRow?.lastAnalysis?.latestHRV ?? null;
    const hrvBaseline = p?.hrvBaseline ?? null;
    if (latestHRV && hrvBaseline) {
      const ratio = latestHRV.value / hrvBaseline;
      if (Math.abs(ratio - 1) > 0.10) {
        const direction = ratio < 1 ? 'below' : 'above';
        ctx.hrvNote = `HRV: ${latestHRV.value.toFixed(0)}ms (baseline ${hrvBaseline.toFixed(0)}ms — ${Math.round(Math.abs(ratio - 1) * 100)}% ${direction} normal)`;
      }
    }
  } catch { ctx.hrvNote = null; }

  return ctx;
}

export function buildBriefFromTemplate(ctx) {
  // Local, deterministic morning brief — composes the SAME 6-field shape the UI renders, from the
  // structured ctx, with day-of-year-rotated phrasing variants (stable within a day, fresh across
  // days). No network AI. Personality-ready: every line composes into a var, so a later
  // adaptMessageSync(says/tip, profile, {scenario:'morning_brief'}) wrap is a one-liner.
  const c = ctx || {};
  const name = c.name || 'Athlete';
  const tier = (c.liftExp || 'intermediate').toLowerCase();
  const macros = c.macros || {};
  const cals = macros.calories || 2200;
  const protG = macros.protein || 150;

  // Deterministic rotation by day-of-year (UTC); per-field offset so fields don't rotate in lockstep.
  const now = new Date();
  const doy = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
  const pick = (arr, off = 0) => arr[(doy + off) % arr.length];

  // ── greeting — time-of-day bucket + name ──────────────────────────────────
  const hr = now.getHours();
  const bucket = hr < 5 ? 'late' : hr < 12 ? 'morning' : hr < 17 ? 'midday' : hr < 22 ? 'evening' : 'late';
  const GREET = {
    morning: [`Morning, ${name}.`, `Rise and grind, ${name}.`, `Good morning, ${name}.`, `Up and at it, ${name}.`],
    midday:  [`Afternoon, ${name}.`, `Midday check-in, ${name}.`, `Hey ${name} — let's get into it.`, `Good afternoon, ${name}.`],
    evening: [`Evening, ${name}.`, `Good evening, ${name}.`, `Hey ${name} — let's close the day strong.`, `Evening check-in, ${name}.`],
    late:    [`Up early, ${name}?`, `Burning the candle, ${name}.`, `Hey ${name}.`, `Quiet hours, ${name}.`],
  };
  const greeting = pick(GREET[bucket], 0);

  // ── yesterday — workout recap (PRs/volume) vs rest; fold in nutrition ──────
  const yw = c.yesterdayWorkout;
  const yn = c.yesterdayNutrition;
  const nutBit = yn ? `${Math.round(yn.calories)} kcal and ${Math.round(yn.protein)}g protein` : null;
  let yesterday;
  if (yw) {
    const pr = yw.prCount > 0 ? ` with ${yw.prCount} PR${yw.prCount > 1 ? 's' : ''}` : '';
    const vol = yw.volumeLbs > 0 ? ` — ${(yw.volumeLbs / 1000).toFixed(1)}k lbs moved` : '';
    const base = pick([
      `Yesterday you put in a ${yw.focus} session${pr}${vol}.`,
      `${yw.focus} was on the menu yesterday${pr}${vol}.`,
      `You logged ${yw.focus} yesterday${pr}${vol}.`,
    ], 1);
    const nut = nutBit
      ? pick([` Fuel: ${nutBit} logged.`, ` On the plate: ${nutBit}.`, ` You hit ${nutBit}.`], 2)
      : pick([` Nutrition wasn't logged, though.`, ` No food logged to back it up.`], 2);
    yesterday = base + nut;
  } else {
    const base = pick([
      `Yesterday was a rest day — exactly when the work starts paying off.`,
      `Rest day yesterday. That's where the growth actually happens.`,
      `You rested yesterday — recovery is part of the plan, not a break from it.`,
    ], 1);
    yesterday = base + (nutBit ? pick([` Fuel: ${nutBit} logged.`, ` You still logged ${nutBit}.`], 2) : '');
  }

  // ── today — rest vs training + focus/phase + macro priority ────────────────
  const isRest = c.todayType === 'rest';
  const restWord = tier === 'beginner' ? 'rest week' : 'deload';
  let today;
  if (isRest) {
    today = pick([
      `Today's a rest day. Hit ${cals} kcal and ${protG}g protein to fuel recovery — light movement only if you feel like it.`,
      `Rest day today. Keep protein near ${protG}g and let the body rebuild — that's the job.`,
      `No training today. Prioritise ${protG}g protein, real food, and good sleep. Recovery is the work.`,
    ], 3);
  } else {
    const focus = (c.todayFocus && c.todayFocus !== 'Training') ? c.todayFocus : (c.splitType || 'training');
    const phaseLine = c.runPhase
      ? ` You're in the ${c.runPhase} block${c.runWeeksToRace ? `, ${c.runWeeksToRace}w to race` : ''} — ${c.runFocusWorkout || 'keep it controlled'}.`
      : (c.isHyrox && c.hyroxPhase)
        ? ` Hyrox ${c.hyroxPhase}${c.weeksToRace ? `, ${c.weeksToRace}w out` : ''}${c.hyroxWeakStations?.length ? ` — sharpen ${c.hyroxWeakStations[0]}` : ''}.`
        : c.strengthPhase
          ? ` Strength ${c.strengthPhase}${c.strengthWeeksToComp ? `, ${c.strengthWeeksToComp}w to comp` : ''}${c.strengthRepRange ? ` — live in the ${c.strengthRepRange} range` : ''}.`
          : '';
    const deloadBit = c.isDeloadWeek ? ` It's a ${restWord} — lighter on purpose; keep the movement clean and let the adaptations land.` : '';
    const base = pick([
      `Today is ${focus}. Lock in ${cals} kcal and ${protG}g protein to back it up.`,
      `${focus} on deck. Spread ${protG}g protein across the day and aim for ${cals} kcal.`,
      `It's ${focus} today. Targets: ${cals} kcal, ${protG}g protein. Show up and earn it.`,
    ], 3);
    today = base + phaseLine + deloadBit;
  }

  // ── coach_says — PRIORITY-PICK the single most relevant non-null signal ────
  const A = c.weeklyAnalysis;
  const ck = c.todayCheckin;
  let says, tip;
  if (A?.injuryRisk && A.injuryRisk !== 'low') {
    says = pick([
      `Your data's flagging injury risk${A.injuryNote ? ` — ${String(A.injuryNote).toLowerCase()}` : ''}. Dial the intensity back today and don't push through anything sharp.`,
      `I'm seeing elevated injury risk in your numbers. Today is clean, controlled reps — not maxing out.`,
      `Heads up: injury risk is trending up. Form and full recovery beat load right now.`,
    ], 4);
    tip = pick([`Form over load. Protect the body.`, `Nothing sharp today. Train smart.`, `Ease the intensity — stay healthy.`], 5);
  } else if (c.fatigueLevel === 'high') {
    const ex = c.fatigueExercises?.length ? ` (${c.fatigueExercises.join(', ')})` : '';
    says = pick([
      `Your effort's been creeping up${ex} — that's accumulated fatigue. Back off today or take it as recovery.`,
      `The data says you're running low${ex}. Ease up today; pushing now just costs you later.`,
      `Fatigue is high${ex}. The smart play today is lighter work or full rest — you've earned it.`,
    ], 4);
    tip = pick([`You're tired. Ease up today.`, `Recover hard. Push another day.`, `Back off — fatigue is real.`], 5);
  } else if (ck && ck.readiness != null && ck.readiness <= 2) {
    says = pick([
      `You checked in low on readiness today. Listen to that — keep it light and let the tank refill.`,
      `Readiness is down this morning. No hero sets; movement quality over numbers today.`,
    ], 4);
    tip = pick([`Low tank today. Keep it light.`, `Move well, don't grind.`], 5);
  } else if (c.isDeloadWeek) {
    says = pick([
      `It's a ${restWord} — lighter on purpose. This is where the gains you've built actually lock in.`,
      `Don't fight the ${restWord}. Easy work now means you come back stronger.`,
      `${restWord === 'deload' ? 'Deload' : 'Rest'} week: quality of movement beats intensity. Trust it.`,
    ], 4);
    tip = pick([`Light on purpose. Let it lock in.`, `Easy week. Come back stronger.`, `Recover now. Build later.`], 5);
  } else if (c.activePlateaus?.length) {
    const p0 = c.activePlateaus[0];
    says = pick([
      `${p0.exercise} has stalled — time to switch it up with ${p0.strategy}. The same approach won't break it.`,
      `You're plateaued on ${p0.exercise}. ${p0.strategy} is how you get it moving again.`,
    ], 4);
    tip = pick([`Break the ${p0.exercise} plateau today.`, `New approach on ${p0.exercise}.`], 5);
  } else if (c.topValidation) {
    says = c.topValidation.message + (c.topValidation.recommendation ? ` ${c.topValidation.recommendation}` : '');
    tip = pick([`One fix today: act on the data.`, `Small change, big difference. Do it.`], 5);
  } else if (c.streak >= 3) {
    says = pick([
      `${c.streak} days logged in a row — that consistency is the whole game. Keep the chain alive.`,
      `${c.streak}-day streak. Momentum like this is exactly what gets results — don't break it today.`,
      `You've logged ${c.streak} straight days. That's the habit doing the heavy lifting.`,
    ], 4);
    tip = pick([`${c.streak} days strong. Keep it going.`, `Don't break the streak today.`, `Consistency's winning. Log today.`], 5);
  } else if (c.sleepAvg && c.sleepAvg < 6.5) {
    says = pick([
      `Sleep's been short (~${c.sleepAvg}h). That's your recovery ceiling — protect tonight's sleep like a session.`,
      `You're averaging ~${c.sleepAvg}h. More sleep does more for results than any extra set right now.`,
    ], 4);
    tip = pick([`Get to bed early. Sleep is training.`, `Protect your sleep tonight.`], 5);
  } else if (c.proteinInsight?.message) {
    says = c.proteinInsight.message;
    tip = pick([`Nail your protein today.`, `Protein first. That's the job.`], 5);
  } else if (c.hrvNote) {
    says = `${c.hrvNote}. Let that guide how hard you go today.`;
    tip = pick([`Let recovery set the pace.`, `Listen to the data today.`], 5);
  } else if (c.domsPredictions?.length) {
    const d0 = c.domsPredictions[0];
    says = `Your ${d0.zone} is likely ${d0.status} today (~${d0.hoursToRecovery}h to recover). Train around it.`;
    tip = pick([`Work around the soreness today.`, `Let sore muscles recover.`], 5);
  } else if (c.weatherNote) {
    says = c.weatherNote;
    tip = pick([`Dress for the conditions. Adjust pace.`, `Plan around the weather today.`], 5);
  } else if (c.memoryRecall?.suggestion) {
    says = c.memoryRecall.suggestion;
    tip = pick([`What worked before works again.`, `Lean on what's worked for you.`], 5);
  } else if (isRest) {
    says = pick([
      `Nothing to prove today — recovery is where the work you've done turns into results.`,
      `Rest is a weapon when you use it on purpose. Eat well, sleep well, come back hungry.`,
      `The best athletes recover as hard as they train. Today's your day to do exactly that.`,
    ], 4);
    tip = pick([`Rest with intent. Refuel. Recharge.`, `Recover like it matters — it does.`, `Eat, sleep, grow.`], 5);
  } else {
    says = pick([
      `Show up, do the work, trust the process — that's how every result you want gets built.`,
      `No secrets today. Consistent effort on the basics is what moves the needle.`,
      `One good session at a time. That's the whole strategy — go get this one.`,
    ], 4);
    tip = pick([`Show up. Do the work.`, `Earn it today.`, `One solid session. Go.`], 5);
  }

  return { greeting, yesterday, today, coach_says: says, coach_tip: tip, sign_off: '— Coach Macro' };
}

// Pure template engine — NO network ai() in the path (the ai() brief failed system-wide since
// 2026-06-26). Same 6-field shape; getMorningBrief caches it identically (one per user per day).
export async function generateBriefContent(ctx) {
  return buildBriefFromTemplate(ctx);
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

  const ctx = await gatherBriefContext(userId).catch(e => { console.error('[brief] gatherBriefContext threw:',e?.message,e); throw e; });
  const content = await generateBriefContent(ctx, userId).catch(e => { console.error('[brief] generateBriefContent threw:',e?.message,e); throw e; });

  await sb.from('morning_briefs').upsert(
    { user_id: userId, brief_date: todayStr, content, generated_at: new Date().toISOString() },
    { onConflict: 'user_id,brief_date' }
  );

  return content;
}
