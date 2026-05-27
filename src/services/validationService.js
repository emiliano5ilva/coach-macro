import { sb } from '../client.js';
import { applyEWMA } from './expenditureService.js';

// ─── Pure analysis functions ──────────────────────────────────────────────────

export function analyzeCalorieIntake(foodLogs, profile) {
  if (!foodLogs?.length) return null;
  const targetCals = parseInt(profile?.goalCals || profile?.goal_cals || 2000);
  const targetProtein = parseFloat(profile?.goalProtein || profile?.goal_protein || 150);

  const daily = foodLogs.map(log => {
    let cals = 0, protein = 0, carbs = 0, fat = 0;
    (log.entries || []).forEach(e => {
      cals    += parseFloat(e.calories || 0);
      protein += parseFloat(e.protein || 0);
      carbs   += parseFloat(e.carbs || 0);
      fat     += parseFloat(e.fat || 0);
    });
    return { date: log.date, cals, protein, carbs, fat };
  }).filter(d => d.cals > 0);

  if (daily.length < 3) return null;

  const avgCals    = daily.reduce((s, d) => s + d.cals, 0) / daily.length;
  const avgProtein = daily.reduce((s, d) => s + d.protein, 0) / daily.length;
  const calDevRatio = avgCals / targetCals;
  const proteinHitDays = daily.filter(d => d.protein >= targetProtein * 0.9).length;
  const proteinHitRate = proteinHitDays / daily.length;

  // Variance for consistency signal
  const variance = daily.reduce((s, d) => s + Math.pow(d.cals - avgCals, 2), 0) / daily.length;
  const cv = Math.sqrt(variance) / (avgCals || 1); // coefficient of variation

  const signals = [];
  let priority = 'low';
  let message = '';
  let recommendation = '';

  const sevenDayDays = daily.slice(-7);
  const sevenDayAvg = sevenDayDays.length >= 5
    ? sevenDayDays.reduce((s, d) => s + d.cals, 0) / sevenDayDays.length
    : null;
  const sevenDayRatio = sevenDayAvg ? sevenDayAvg / targetCals : calDevRatio;

  if (sevenDayRatio < 0.60 && daily.length >= 7) {
    priority = 'severe';
    message = `You've averaged ${Math.round(sevenDayAvg)} kcal/day this week — ${Math.round((1 - sevenDayRatio) * 100)}% below your target. Chronic under-eating suppresses metabolism and accelerates muscle loss.`;
    recommendation = `Increase intake to at least ${Math.round(targetCals * 0.85)} kcal/day immediately. Focus on calorie-dense whole foods: oats, eggs, olive oil, nuts.`;
    signals.push({ signal: 'Avg calories 7d', value: Math.round(sevenDayAvg), direction: 'low' });
  } else if (sevenDayRatio < 0.80 && daily.length >= 5) {
    priority = 'high';
    message = `Calorie intake is running ${Math.round((1 - sevenDayRatio) * 100)}% below target over the past week. This deficit may be too aggressive for your goal.`;
    recommendation = `Add 200–300 kcal/day through an extra snack or larger portions at one meal.`;
    signals.push({ signal: 'Avg calories 7d', value: Math.round(sevenDayAvg || avgCals), direction: 'low' });
  } else if (proteinHitRate < 0.50 && daily.length >= 5) {
    priority = 'high';
    message = `Protein target hit only ${Math.round(proteinHitRate * 100)}% of logged days. You're averaging ${Math.round(avgProtein)}g vs a target of ${Math.round(targetProtein)}g.`;
    recommendation = `Add a protein-first meal or snack daily — Greek yogurt, cottage cheese, or a shake gets you 25–40g with minimal effort.`;
    signals.push({ signal: 'Protein hit rate', value: Math.round(proteinHitRate * 100), direction: 'low' });
  } else if (cv > 0.30 && daily.length >= 7) {
    priority = 'medium';
    message = `Calorie intake is erratic — some days ${Math.round(avgCals - Math.sqrt(variance))} kcal, others ${Math.round(avgCals + Math.sqrt(variance))} kcal. Inconsistency makes it hard for your body to adapt.`;
    recommendation = `Aim for ±200 kcal day-to-day. Meal prepping 2–3 anchor meals removes the guesswork.`;
    signals.push({ signal: 'Calorie variability (CV)', value: Math.round(cv * 100), direction: 'high' });
  } else if (calDevRatio >= 0.92 && calDevRatio <= 1.10 && proteinHitRate >= 0.75) {
    priority = 'low';
    message = `Nutrition is on point — ${Math.round(avgCals)} kcal/day with protein hit ${Math.round(proteinHitRate * 100)}% of days. Keep it up.`;
    recommendation = `Maintain consistency. Consider cycling carbs around training days for performance optimization.`;
    signals.push({ signal: 'Adherence rate', value: Math.round(proteinHitRate * 100), direction: 'good' });
  } else {
    priority = 'low';
    message = `Averaging ${Math.round(avgCals)} kcal/day — ${calDevRatio > 1 ? 'above' : 'below'} your ${targetCals} kcal target by ${Math.round(Math.abs(calDevRatio - 1) * 100)}%.`;
    recommendation = `Fine-tune portion sizes. Logging accuracy improves when you weigh foods rather than estimating.`;
    signals.push({ signal: 'Avg calories', value: Math.round(avgCals), direction: calDevRatio < 1 ? 'low' : 'high' });
  }

  signals.push({ signal: 'Avg protein', value: Math.round(avgProtein), direction: avgProtein >= targetProtein * 0.9 ? 'good' : 'low' });

  return {
    insight_type: 'calorie_intake',
    message,
    recommendation,
    confidence: Math.min(100, Math.round(40 + daily.length * 2)),
    priority,
    data_days_used: daily.length,
    signals_aligned: signals,
  };
}

export function analyzeWeightTrend(weightLogs, profile) {
  if (!weightLogs?.length || weightLogs.length < 3) return null;

  const sorted = [...weightLogs].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
  const smoothed = applyEWMA(sorted);
  if (smoothed.length < 3) return null;

  const goal = (profile?.goal || '').toLowerCase();
  const isBulk = /gain|bulk|muscle/.test(goal);
  const isCut  = /cut|lose|fat|deficit/.test(goal);
  const isWUnit = profile?.wUnit === 'kg' ? 'kg' : 'lbs';

  const recent  = smoothed.slice(-7);
  const older   = smoothed.slice(-14, -7);
  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const olderAvg  = older.length ? older.reduce((s, v) => s + v, 0) / older.length : recentAvg;

  const weeklyChange = recentAvg - olderAvg; // positive = gaining
  const weeklyChangeLbs = isWUnit === 'kg' ? weeklyChange * 2.205 : weeklyChange;
  const totalDays = sorted.length;

  // Extended trend (30 days)
  const first = smoothed[0];
  const last  = smoothed[smoothed.length - 1];
  const totalChange = last - first;
  const totalChangeLbs = isWUnit === 'kg' ? totalChange * 2.205 : totalChange;
  const daysSpanned = Math.max(1,
    (new Date(sorted[sorted.length - 1].created_at || sorted[sorted.length - 1].date) -
     new Date(sorted[0].created_at || sorted[0].date)) / 864e5
  );

  const signals = [];
  let priority = 'low';
  let message = '';
  let recommendation = '';

  const absWeeklyLbs = Math.abs(weeklyChangeLbs);

  if (absWeeklyLbs > 2.0) {
    priority = 'severe';
    const dir = weeklyChangeLbs < 0 ? 'losing' : 'gaining';
    message = `Weight trend shows ${dir} ~${absWeeklyLbs.toFixed(1)} lbs/week — too fast. Rapid ${weeklyChangeLbs < 0 ? 'loss risks muscle catabolism' : 'gain accelerates fat accumulation'}.`;
    recommendation = weeklyChangeLbs < 0
      ? `Increase calories by 200–300 kcal/day and confirm protein is ≥1g/lb bodyweight.`
      : `Pull back calories 200–300 kcal/day. Prioritize whole foods over processed sources.`;
    signals.push({ signal: 'Weekly change', value: `${weeklyChangeLbs > 0 ? '+' : ''}${weeklyChangeLbs.toFixed(1)} lbs`, direction: 'severe' });
  } else if (absWeeklyLbs > 1.5) {
    priority = 'high';
    const dir = weeklyChangeLbs < 0 ? 'losing' : 'gaining';
    message = `${dir.charAt(0).toUpperCase() + dir.slice(1)} ${absWeeklyLbs.toFixed(1)} lbs/week. That's faster than optimal for ${weeklyChangeLbs < 0 ? 'preserving lean mass' : 'minimizing fat gain'}.`;
    recommendation = weeklyChangeLbs < 0
      ? `Bump intake by 150–200 kcal/day and prioritize strength training to signal muscle retention.`
      : `Trim 150–200 kcal/day from starchy carbs or added fats.`;
    signals.push({ signal: 'Weekly change', value: `${weeklyChangeLbs > 0 ? '+' : ''}${weeklyChangeLbs.toFixed(1)} lbs`, direction: 'high' });
  } else if (absWeeklyLbs < 0.15 && totalDays >= 14 && (isBulk || isCut)) {
    priority = 'medium';
    message = `Weight has barely moved (${totalChangeLbs.toFixed(1)} lbs over ${Math.round(daysSpanned)} days). Your intake and expenditure are nearly equal — expected ${isCut ? 'deficit' : 'surplus'} isn't materializing.`;
    recommendation = isCut
      ? `Reduce intake by 200 kcal/day or add 2 cardio sessions per week.`
      : `Add 200–300 kcal/day, prioritizing carbs around workouts.`;
    signals.push({ signal: 'Total change', value: `${totalChangeLbs.toFixed(2)} lbs`, direction: 'stalled' });
  } else if (!isBulk && !isCut && absWeeklyLbs < 0.5) {
    priority = 'low';
    message = `Weight is stable at ~${recentAvg.toFixed(1)} ${isWUnit}. Maintenance dialed in.`;
    recommendation = `If you want to shift body composition without scale movement, consider a recomp approach: slight deficit with higher protein and progressive training.`;
    signals.push({ signal: 'Weekly change', value: `${weeklyChangeLbs.toFixed(2)} lbs`, direction: 'good' });
  } else {
    const dir = weeklyChangeLbs < 0 ? 'down' : 'up';
    priority = 'low';
    message = `Weight trending ${dir} ${absWeeklyLbs.toFixed(1)} lbs/week — within optimal range for ${isBulk ? 'a lean bulk' : isCut ? 'a cut' : 'recomposition'}.`;
    recommendation = `Stay the course. Reassess if the trend stalls or accelerates beyond 1 lb/week.`;
    signals.push({ signal: 'Weekly rate', value: `${weeklyChangeLbs > 0 ? '+' : ''}${weeklyChangeLbs.toFixed(2)} lbs/wk`, direction: 'good' });
  }

  signals.push({ signal: 'Data points', value: totalDays, direction: 'info' });

  return {
    insight_type: 'weight_trend',
    message,
    recommendation,
    confidence: Math.min(100, Math.round(30 + totalDays * 3)),
    priority,
    data_days_used: totalDays,
    signals_aligned: signals,
  };
}

export function analyzeTrainingProgress(workoutLogs, personalRecords) {
  if (!workoutLogs?.length || workoutLogs.length < 3) return null;

  const sorted = [...workoutLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const now = new Date();
  const weeksAgo = (n) => new Date(now - n * 7 * 864e5);

  const thisWeek = sorted.filter(l => new Date(l.date) >= weeksAgo(1));
  const lastWeek = sorted.filter(l => new Date(l.date) >= weeksAgo(2) && new Date(l.date) < weeksAgo(1));
  const twoWeeksAgo = sorted.filter(l => new Date(l.date) >= weeksAgo(4) && new Date(l.date) < weeksAgo(2));

  const volumeOf = (logs) => logs.reduce((s, l) => s + (l.volume_lbs || 0), 0);
  const thisVol  = volumeOf(thisWeek);
  const lastVol  = volumeOf(lastWeek);
  const oldVol   = volumeOf(twoWeeksAgo);
  const avgOldVol = twoWeeksAgo.length ? oldVol / 2 : lastVol;

  const sessionFreq30d = sorted.filter(l => new Date(l.date) >= weeksAgo(4)).length;
  const sessionFreq14d = sorted.filter(l => new Date(l.date) >= weeksAgo(2)).length;
  const freqTrend = sessionFreq14d / 2 - sessionFreq30d / 4; // sessions/week delta

  const recentPRs = (personalRecords || []).filter(pr => {
    const d = new Date(pr.date || 0);
    return d >= weeksAgo(4);
  });

  const signals = [];
  let priority = 'low';
  let message = '';
  let recommendation = '';

  const volDrop = lastVol > 0 ? (lastVol - thisVol) / lastVol : 0;
  const volTrend = avgOldVol > 0 ? (lastVol - avgOldVol) / avgOldVol : 0;

  if (volDrop > 0.35 && thisWeek.length > 0 && lastWeek.length > 0) {
    priority = 'severe';
    message = `Training volume dropped ${Math.round(volDrop * 100)}% this week vs last. Significant volume reduction risks strength and muscle retention.`;
    recommendation = `If this is planned (deload), log it intentionally. Otherwise, reduce intensity but maintain session count and set count.`;
    signals.push({ signal: 'Volume drop', value: `${Math.round(volDrop * 100)}%`, direction: 'severe' });
  } else if (freqTrend < -1 && sessionFreq14d < 2) {
    priority = 'high';
    message = `Session frequency has dropped — only ${sessionFreq14d} sessions in the past 2 weeks. Consistency is the highest leverage variable in training.`;
    recommendation = `Schedule training like appointments. Even a 30-min session beats zero. Reduce duration before reducing frequency.`;
    signals.push({ signal: 'Sessions last 2wk', value: sessionFreq14d, direction: 'low' });
  } else if (recentPRs.length === 0 && volTrend <= 0 && sessionFreq30d >= 6) {
    priority = 'medium';
    message = `No new personal records in 30 days and volume has plateaued. Your body may have adapted — time to introduce a new stimulus.`;
    recommendation = `Try progressive overload: add 2.5–5 lbs to compound lifts, add a set per exercise, or reduce rest periods by 15 seconds.`;
    signals.push({ signal: 'PRs last 30d', value: 0, direction: 'stalled' });
    signals.push({ signal: 'Volume trend', value: `${volTrend > 0 ? '+' : ''}${Math.round(volTrend * 100)}%`, direction: volTrend > 0 ? 'good' : 'low' });
  } else if (volTrend > 0.10 && recentPRs.length > 0) {
    priority = 'low';
    message = `Strong training block — volume up ${Math.round(volTrend * 100)}% and ${recentPRs.length} new PR${recentPRs.length > 1 ? 's' : ''} this month. Progressive overload is working.`;
    recommendation = `Ensure recovery matches intensity: 7–9h sleep, protein at target, and schedule a deload after every 4–6 hard weeks.`;
    signals.push({ signal: 'Volume trend', value: `+${Math.round(volTrend * 100)}%`, direction: 'good' });
    signals.push({ signal: 'PRs this month', value: recentPRs.length, direction: 'good' });
  } else {
    priority = 'low';
    message = `Training is consistent — ${sessionFreq30d} sessions in the past 4 weeks. Keep showing up.`;
    recommendation = `Focus on progressive overload: aim to beat a previous lift or add one set somewhere each week.`;
    signals.push({ signal: 'Sessions 30d', value: sessionFreq30d, direction: 'info' });
  }

  return {
    insight_type: 'training_progress',
    message,
    recommendation,
    confidence: Math.min(100, Math.round(30 + sorted.length * 4)),
    priority,
    data_days_used: sorted.length,
    signals_aligned: signals,
  };
}

export function analyzeRecovery(bioDataPoints, healthSnaps) {
  const sleepPoints  = (bioDataPoints || []).filter(b => b.metric === 'sleep_performance').slice(-14);
  const stressPoints = (bioDataPoints || []).filter(b => b.metric === 'stress_performance').slice(-14);

  const hasHRV   = (healthSnaps || []).some(h => h.hrv > 0);
  const hasRHR   = (healthSnaps || []).some(h => h.rhr > 0);
  const hasSteps = (healthSnaps || []).some(h => h.steps > 0);

  if (!sleepPoints.length && !hasHRV && !hasRHR) return null;

  const avgSleep = sleepPoints.length
    ? sleepPoints.reduce((s, b) => s + parseFloat(b.output_value || b.input_value || 70), 0) / sleepPoints.length
    : null;

  const recentSnaps = (healthSnaps || []).slice(-7);
  const hrvValues = recentSnaps.map(h => h.hrv).filter(v => v > 0);
  const rhrValues = recentSnaps.map(h => h.rhr).filter(v => v > 0);

  const avgHRV = hrvValues.length ? hrvValues.reduce((s, v) => s + v, 0) / hrvValues.length : null;
  const avgRHR = rhrValues.length ? rhrValues.reduce((s, v) => s + v, 0) / rhrValues.length : null;

  // Trend: compare recent 3 vs earlier 4
  const hrvRecent = hrvValues.slice(-3);
  const hrvOlder  = hrvValues.slice(0, -3);
  const hrvTrend  = (hrvRecent.length && hrvOlder.length)
    ? (hrvRecent.reduce((s,v)=>s+v,0)/hrvRecent.length) - (hrvOlder.reduce((s,v)=>s+v,0)/hrvOlder.length)
    : null;

  const rhrRecent = rhrValues.slice(-3);
  const rhrOlder  = rhrValues.slice(0, -3);
  const rhrTrend  = (rhrRecent.length && rhrOlder.length)
    ? (rhrRecent.reduce((s,v)=>s+v,0)/rhrRecent.length) - (rhrOlder.reduce((s,v)=>s+v,0)/rhrOlder.length)
    : null;

  const signals = [];
  let priority = 'low';
  let message = '';
  let recommendation = '';

  if ((avgSleep !== null && avgSleep < 50) || (avgHRV !== null && avgHRV < 30)) {
    priority = 'severe';
    const reasons = [];
    if (avgSleep !== null && avgSleep < 50) reasons.push(`sleep performance at ${Math.round(avgSleep)}%`);
    if (avgHRV !== null && avgHRV < 30) reasons.push(`HRV at ${Math.round(avgHRV)} ms`);
    message = `Recovery is critically low: ${reasons.join(', ')}. Training hard on poor recovery accelerates breakdown, not adaptation.`;
    recommendation = `Cut training intensity by 40% for 3–5 days. Prioritize 8+ hours of sleep, reduce alcohol and late-night screens, add 10-min morning walk.`;
    if (avgSleep !== null) signals.push({ signal: 'Sleep performance', value: `${Math.round(avgSleep)}%`, direction: 'severe' });
    if (avgHRV !== null) signals.push({ signal: 'Avg HRV', value: `${Math.round(avgHRV)} ms`, direction: 'severe' });
  } else if (
    (hrvTrend !== null && hrvTrend < -5) ||
    (rhrTrend !== null && rhrTrend > 5) ||
    (avgSleep !== null && avgSleep < 65)
  ) {
    priority = 'high';
    const trends = [];
    if (hrvTrend !== null && hrvTrend < -5) trends.push(`HRV dropping ${Math.abs(hrvTrend).toFixed(1)} ms`);
    if (rhrTrend !== null && rhrTrend > 5)  trends.push(`RHR rising ${rhrTrend.toFixed(1)} bpm`);
    if (avgSleep !== null && avgSleep < 65)  trends.push(`sleep at ${Math.round(avgSleep)}%`);
    message = `Recovery signals are trending down: ${trends.join(', ')}. You may be accumulating fatigue.`;
    recommendation = `Reduce training volume by 20–30% this week. Add one full rest day. Review sleep hygiene and pre-sleep nutrition.`;
    if (hrvTrend !== null) signals.push({ signal: 'HRV trend', value: `${hrvTrend.toFixed(1)} ms/wk`, direction: 'low' });
    if (rhrTrend !== null) signals.push({ signal: 'RHR trend', value: `+${rhrTrend.toFixed(1)} bpm/wk`, direction: 'low' });
  } else if (avgHRV !== null && avgHRV >= 60 && avgSleep !== null && avgSleep >= 75) {
    priority = 'low';
    message = `Recovery is excellent — HRV ${Math.round(avgHRV)} ms and sleep performance at ${Math.round(avgSleep)}%. Your body is primed to adapt.`;
    recommendation = `This is the time to push hard in training. Increase intensity or volume this week.`;
    signals.push({ signal: 'Avg HRV', value: `${Math.round(avgHRV)} ms`, direction: 'good' });
    signals.push({ signal: 'Sleep performance', value: `${Math.round(avgSleep)}%`, direction: 'good' });
  } else {
    priority = 'low';
    const parts = [];
    if (avgSleep !== null) parts.push(`sleep at ${Math.round(avgSleep)}%`);
    if (avgHRV !== null)   parts.push(`HRV ${Math.round(avgHRV)} ms`);
    message = `Recovery is moderate${parts.length ? ' — ' + parts.join(', ') : ''}. Training load and recovery appear balanced.`;
    recommendation = `Watch for sleep quality changes — it's the highest-leverage recovery variable. HRV trending down 3+ days is the first sign to reduce load.`;
    if (avgSleep !== null) signals.push({ signal: 'Sleep performance', value: `${Math.round(avgSleep)}%`, direction: 'info' });
    if (avgHRV !== null)   signals.push({ signal: 'Avg HRV', value: `${Math.round(avgHRV)} ms`, direction: 'info' });
  }

  const dataDays = Math.max(sleepPoints.length, hrvValues.length, rhrValues.length);
  return {
    insight_type: 'recovery',
    message,
    recommendation,
    confidence: Math.min(100, Math.round(20 + dataDays * 5 + (hasHRV ? 15 : 0) + (hasSteps ? 5 : 0))),
    priority,
    data_days_used: dataDays,
    signals_aligned: signals,
  };
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function storeInsights(userId, insights) {
  if (!insights?.length) return;
  const today = new Date().toISOString().split('T')[0];
  const rows = insights.map(ins => ({
    user_id: userId,
    date_generated: today,
    insight_type: ins.insight_type,
    message: ins.message,
    recommendation: ins.recommendation || null,
    confidence: ins.confidence,
    priority: ins.priority,
    data_days_used: ins.data_days_used,
    signals_aligned: ins.signals_aligned,
  }));
  await sb.from('validation_insights')
    .upsert(rows, { onConflict: 'user_id,date_generated,insight_type' });
}

export async function dismissInsight(userId, insightType) {
  const today = new Date().toISOString().split('T')[0];
  await sb.from('validation_insights')
    .update({ dismissed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('date_generated', today)
    .eq('insight_type', insightType);
}

export async function getTodayInsights(userId) {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await sb.from('validation_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('date_generated', today)
    .is('dismissed_at', null)
    .order('created_at', { ascending: false });
  return data || [];
}

// ─── Master suite ─────────────────────────────────────────────────────────────

const PRIORITY_ORDER = { severe: 0, high: 1, medium: 2, low: 3 };

export async function runDailyValidationSuite(userId, profile) {
  if (!userId) return [];

  // Cache check: return stored insights if generated today
  const cached = await getTodayInsights(userId);
  if (cached.length > 0) return cached;

  // Parallel data fetch
  const cutoff30 = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
  const cutoff90 = new Date(Date.now() - 90 * 864e5).toISOString().split('T')[0];

  const [
    { data: foodLogs },
    { data: weightLogs },
    { data: workoutLogs },
    { data: prs },
    { data: bioData },
    { data: healthSnaps },
  ] = await Promise.all([
    sb.from('food_logs').select('date,entries').eq('user_id', userId).gte('date', cutoff30),
    sb.from('bodyweight_logs').select('weight,unit,created_at').eq('user_id', userId).gte('created_at', cutoff90).order('created_at'),
    sb.from('workout_logs').select('date,volume_lbs,workout').eq('user_id', userId).gte('date', cutoff90).order('date'),
    sb.from('personal_records').select('exercise_name,weight,reps,date').eq('user_id', userId).gte('date', cutoff90),
    sb.from('bio_data_points').select('metric,input_value,output_value,created_at').eq('user_id', userId).gte('created_at', cutoff30).order('created_at'),
    sb.from('daily_health_snapshots').select('date,hrv,rhr,steps,sleep').eq('user_id', userId).gte('date', cutoff30).order('date'),
  ]);

  const insights = [
    analyzeCalorieIntake(foodLogs, profile),
    analyzeWeightTrend(weightLogs, profile),
    analyzeTrainingProgress(workoutLogs, prs),
    analyzeRecovery(bioData, healthSnaps),
  ].filter(Boolean);

  if (!insights.length) return [];

  // Sort by priority, pick top 3
  const ranked = insights.sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  ).slice(0, 3);

  try {
    await storeInsights(userId, ranked);
  } catch {}

  return ranked;
}
