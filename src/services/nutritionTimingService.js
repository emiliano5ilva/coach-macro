export function getPreLoadingNote(tomorrowSession, profile) {
  if (!tomorrowSession) return null;

  const isHeavy = tomorrowSession.exercises?.some(
    e => e.primary && /squat|deadlift|bench|press|clean|snatch/i.test(e.name)
  );
  const isLongRun = tomorrowSession.type === 'Long Run' ||
    (tomorrowSession.duration ?? 0) >= 75;

  if (isHeavy) {
    return {
      type: 'preload_strength',
      calories: 150,
      message: "Tomorrow is a heavy session. Eat 150 calories above your target tonight — prioritize carbohydrates (rice, pasta, potatoes). Your muscles will be better fuelled and your performance will reflect it.",
      macroFocus: 'carbs',
    };
  }
  if (isLongRun) {
    return {
      type: 'preload_endurance',
      calories: 200,
      message: "Long run tomorrow. Eat 200 calories above target tonight with a carb-heavy dinner. For runs over 75 minutes, also plan to take on 30-45g carbs at the halfway point during the run itself.",
      macroFocus: 'carbs',
    };
  }
  return null;
}

export function getPostWorkoutWindow(session) {
  const isStrength = session?.type === 'Strength' ||
    session?.exercises?.some(e => e.primary);
  const isHardRun = session?.type === 'Intervals' ||
    session?.type === 'Tempo Run';

  if (!isStrength && !isHardRun) return null;

  const windowMinutes = 45;
  const proteinTarget = isStrength ? 40 : 30;

  return {
    windowMinutes,
    proteinTarget,
    message: `Post-workout window open — ${windowMinutes} min to hit ${proteinTarget}g protein. This maximises muscle protein synthesis from today's session.`,
    urgency: 'high',
  };
}

export function getProteinDistributionInsight(foodLogs, dailyProteinTarget) {
  if (!foodLogs?.length || !dailyProteinTarget) return null;

  const recentLogs = foodLogs.slice(0, 7);
  const avgProtein = recentLogs.reduce((s, l) => s + (l.protein ?? 0), 0) / recentLogs.length;
  const adherenceRate = avgProtein / dailyProteinTarget;

  if (adherenceRate < 0.80) {
    return {
      type: 'insufficient',
      avg: Math.round(avgProtein),
      target: dailyProteinTarget,
      message: `Averaging ${Math.round(avgProtein)}g protein vs your ${dailyProteinTarget}g target. Protein is your highest-priority macro for muscle preservation and recovery.`,
    };
  }
  return null;
}

export function getIntraSessionFuelingNote(session) {
  const duration = session?.duration ?? session?.sessionMins ?? 0;
  const isEndurance = /run|row|hyrox|hybrid/i.test(session?.type ?? '');

  if (duration < 75 || !isEndurance) return null;

  return {
    carbsGrams: 30,
    message: `Today's session is ${duration} minutes — take on 30g carbs at the halfway point (gel, banana, or sports drink). Fuelling during sessions over 75 minutes improves performance and reduces cortisol.`,
  };
}
