import { sb, ai } from '../client';
import { computeLoadMetrics } from './trainingLoadService';

// ── RED-S + Overreaching detectors ────────────────────────────────────────────

export function detectREDS(foodLogs, workoutLogs, checkins, profile) {
  if (!foodLogs?.length || foodLogs.length < 14) return null;

  const tdee = profile?.profile_data?.baseTDEE ?? profile?.profile_data?.tdee ?? 2500;
  const recentFood = foodLogs.slice(0, 21);
  const avgCalories = recentFood.reduce((s, l) => s + (l.calories ?? 0), 0) / recentFood.length;
  const avgAdherence = avgCalories / tdee;
  const chronicallyUnderfuelled = avgAdherence < 0.80;

  const recentVolume = workoutLogs.slice(0, 7).reduce((s, l) => s + (l.volume_lbs ?? 0), 0) / 7;
  const olderVolume  = workoutLogs.slice(14, 21).reduce((s, l) => s + (l.volume_lbs ?? 0), 0) / 7;
  const performanceDeclining = olderVolume > 0 && recentVolume < olderVolume * 0.85;

  const recentCheckins = checkins.slice(0, 14);
  const avgSoreness = recentCheckins.reduce((s, c) => s + (c.overall_soreness ?? 0), 0) / (recentCheckins.length || 1);
  const poorRecovery = avgSoreness > 6 ||
    recentCheckins.filter(c => c.readiness === 'tired' || c.readiness === 'rough').length > recentCheckins.length * 0.5;

  if (chronicallyUnderfuelled && performanceDeclining && poorRecovery) {
    return {
      detected: true,
      severity: avgAdherence < 0.70 ? 'high' : 'moderate',
      message: `Energy availability has been below recommended levels for 3+ weeks (avg ${Math.round(avgCalories)} vs ${Math.round(tdee)} target). Combined with declining performance and elevated soreness, this matches a pattern associated with RED-S (relative energy deficiency in sport). We strongly recommend reviewing nutrition with a sports dietitian.`,
    };
  }
  return { detected: false };
}

export function detectOverreaching(workoutLogs, checkins, profile) {
  if (!workoutLogs?.length || workoutLogs.length < 21) return null;

  const recentAvgVolume = workoutLogs.slice(0, 7).reduce((s, l) => s + (l.volume_lbs ?? 0), 0) / 7;
  const olderAvgVolume  = workoutLogs.slice(14, 21).reduce((s, l) => s + (l.volume_lbs ?? 0), 0) / 7;
  const performanceDeclining = olderAvgVolume > 0 && recentAvgVolume < olderAvgVolume * 0.90;

  const recentPRs = workoutLogs.slice(0, 21).reduce((s, l) => s + (l.pr_count ?? 0), 0);
  const noProgress = recentPRs === 0;

  const recentCheckins = (checkins ?? []).slice(0, 14);
  const consistentlyTired = recentCheckins.filter(c =>
    c.readiness === 'tired' || c.readiness === 'rough'
  ).length > recentCheckins.length * 0.4;

  if (performanceDeclining && noProgress && consistentlyTired) {
    return {
      detected: true,
      message: `Performance has declined for 3+ weeks despite consistent training. This is a sign of non-functional overreaching — the body isn't adapting, it's accumulating fatigue. We recommend 5-7 days of complete rest or very light activity only. This is not a setback — it's a required investment in the next block of progress.`,
    };
  }
  return { detected: false };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getMostFrequent(arr) {
  if (!arr?.length) return null;
  const freq = arr.reduce((acc, v) => { acc[v] = (acc[v] ?? 0) + 1; return acc; }, {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function getExerciseProgression(workoutLogs) {
  const byExercise = {};
  workoutLogs.forEach(log => {
    (log.workout?.exercises ?? []).forEach(ex => {
      if (!byExercise[ex.name]) byExercise[ex.name] = [];
      const done = (ex.sets ?? []).filter(s => s.done);
      if (done.length && parseFloat(done[0].weight) > 0) {
        byExercise[ex.name].push({
          date: log.date,
          weight: parseFloat(done[0].weight),
          completedSets: done.length,
        });
      }
    });
  });
  return Object.fromEntries(
    Object.entries(byExercise)
      .filter(([, v]) => v.length >= 3)
      .map(([k, v]) => [k, {
        sessions: v.length,
        startWeight: v[v.length - 1].weight,
        currentWeight: v[0].weight,
        trend: v[0].weight > v[v.length - 1].weight ? 'progressing'
          : v[0].weight < v[v.length - 1].weight ? 'regressing' : 'stalled',
      }])
  );
}

// ── Main analysis ──────────────────────────────────────────────────────────────

export async function runWeeklyAnalysis(userId, profile) {
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const sinceStr = since.toISOString().split('T')[0];

  const [logsRes, checkinsRes, foodRes] = await Promise.all([
    sb.from('workout_logs')
      .select('date,workout,volume_lbs,total_sets,pr_count')
      .eq('user_id', userId).gte('date', sinceStr).order('date', { ascending: false }),
    sb.from('morning_checkins')
      .select('*')
      .eq('user_id', userId).gte('date', sinceStr).order('date', { ascending: false }),
    sb.from('food_history')
      .select('date,calories,protein')
      .eq('user_id', userId).gte('date', sinceStr).order('date', { ascending: false }),
  ]);

  const workoutLogs = logsRes.data ?? [];
  const checkins    = checkinsRes.data ?? [];
  const foodLogs    = foodRes.data ?? [];

  const context = {
    athlete: {
      goal:           profile?.profile_data?.goal,
      trainType:      profile?.trainType,
      experience:     profile?.profile_data?.experience,
      currentProgram: profile?.profile_data?.currentProgram,
      programWeek:    profile?.profile_data?.programWeek,
      currentWeight:  profile?.weight,
    },
    last28Days: {
      sessionsCompleted: workoutLogs.length,
      totalVolumeLbs:    workoutLogs.reduce((s, l) => s + (l.volume_lbs ?? 0), 0),
      totalPRs:          workoutLogs.reduce((s, l) => s + (l.pr_count ?? 0), 0),
      avgCalorieAdherence: foodLogs.length
        ? foodLogs.reduce((s, l) => s + Math.min((l.calories ?? 0) / 2000, 1.5), 0) / foodLogs.length
        : null,
      avgProtein: foodLogs.length
        ? foodLogs.reduce((s, l) => s + (l.protein ?? 0), 0) / foodLogs.length
        : null,
      readinessDistribution: checkins.reduce((acc, c) => {
        acc[c.readiness] = (acc[c.readiness] ?? 0) + 1; return acc;
      }, {}),
      avgSoreness: checkins.length
        ? checkins.reduce((s, c) => s + (c.overall_soreness ?? 0), 0) / checkins.length
        : 0,
      mostFrequentPrimarySoreness: getMostFrequent(checkins.flatMap(c => c.primary_soreness ?? [])),
      exerciseProgression: getExerciseProgression(workoutLogs),
      loadMetrics: computeLoadMetrics(workoutLogs),
      cyclePattern: (() => {
        const cp = profile?.adaptive_profile?.cycleProfile;
        if (!cp?.pattern) return null;
        return { highWindow: cp.pattern.highPhrase, lowWindow: cp.pattern.lowPhrase, confident: cp.pattern.confident };
      })(),
    },
    previousAnalysis: profile?.adaptive_profile?.lastAnalysis ?? null,
  };

  // Run detectors and inject as high-priority signals
  const redsCheck = detectREDS(foodLogs, workoutLogs, checkins, profile);
  const overreachCheck = detectOverreaching(workoutLogs, checkins, profile);
  const redsSignal = redsCheck?.detected
    ? `\n⚠️ RED-S PATTERN DETECTED. This is the highest priority finding. Reference it explicitly in keyInsight and morningBriefNote. Recommend professional nutrition consultation. Set injuryRisk to "high".`
    : '';
  const overreachSignal = overreachCheck?.detected
    ? `\n⚠️ OVERREACHING DETECTED. Set nextWeekPhase to "deload" and deloadRecommended to true. Reference it in keyInsight.`
    : '';

  const prompt = `You are an elite strength and conditioning coach analyzing an athlete's training data.${redsSignal}${overreachSignal}
Return ONLY valid JSON, no markdown, no explanation.
You understand periodization, progressive overload, recovery science, and nutrition timing.
Be direct, honest, and specific to this athlete's data. Never give generic advice.

Analyze this athlete's last 28 days and return a coaching assessment as JSON:

${JSON.stringify(context, null, 2)}

Return this exact JSON structure:
{
  "trainingStatus": "adapting|loading|overreaching|recovering",
  "nextWeekPhase": "build|maintain|deload|peak",
  "volumeAdjustment": 0.85,
  "intensityAdjustment": 1.0,
  "deloadRecommended": false,
  "weeksToNextDeload": 3,
  "keyInsight": "one specific observation from the data",
  "nutritionInsight": "specific nutrition finding if relevant, else null",
  "injuryRisk": "none|low|moderate|high",
  "injuryNote": "specific note if risk > none, else null",
  "progressionNote": "what is progressing well and what is stalling",
  "focusNextWeek": ["sleep", "protein"],
  "morningBriefNote": "one sentence for Monday morning brief",
  "programTransitionReady": false,
  "programTransitionNote": null
}`;

  let text;
  try {
    text = await ai(prompt, 1000, 'adaptive_analysis');
  } catch (e) {
    console.error('[adaptiveAnalysis] AI call failed:', e);
    return null;
  }

  let analysis;
  try {
    analysis = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    console.error('[adaptiveAnalysis] parse failed:', text);
    return null;
  }

  const adaptiveProfile = {
    ...(profile?.adaptive_profile ?? {}),
    lastAnalysis:     analysis,
    lastAnalysisDate: new Date().toISOString().split('T')[0],
    redsDetected:     redsCheck?.detected ? redsCheck : null,
    overreachDetected: overreachCheck?.detected ? overreachCheck : null,
    analysisHistory:  [
      analysis,
      ...((profile?.adaptive_profile?.analysisHistory ?? []).slice(0, 11)),
    ],
  };

  await sb.from('profiles').update({ adaptive_profile: adaptiveProfile }).eq('id', userId);
  return analysis;
}

export async function shouldRunAnalysis(userId) {
  const { data: profile } = await sb
    .from('profiles').select('adaptive_profile').eq('id', userId).single();
  const lastDate = profile?.adaptive_profile?.lastAnalysisDate;
  if (!lastDate) return true;
  const daysSince = Math.floor((Date.now() - new Date(lastDate)) / (24 * 60 * 60 * 1000));
  return daysSince >= 7;
}
