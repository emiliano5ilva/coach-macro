// ── WIN DEFINITIONS ────────────────────────────────────────────────────────────

export const WINS = {
  first_workout: {
    key: 'first_workout',
    emoji: '🏋️',
    headline: { beginner: 'FIRST SESSION DONE.', intermediate: 'FIRST SESSION DONE.', advanced: 'SESSION ONE LOCKED IN.' },
    message: {
      beginner: "You showed up. That's the hardest part. Your body is already changing.",
      intermediate: "First session in the books. The data collection begins now.",
      advanced: "Session logged. The machine is in motion.",
    },
    cta: 'SEE TODAY →',
  },
  first_meal: {
    key: 'first_meal',
    emoji: '🥗',
    headline: { beginner: 'FIRST MEAL LOGGED.', intermediate: 'FIRST MEAL LOGGED.', advanced: 'NUTRITION TRACKING LIVE.' },
    message: {
      beginner: "One meal logged. That's how every great athlete starts — one meal at a time.",
      intermediate: "First entry in. The nutrition engine is running.",
      advanced: "Macro tracking initiated. Precision mode engaged.",
    },
    cta: 'KEEP GOING →',
  },
  streak_3: {
    key: 'streak_3',
    emoji: '🔥',
    headline: { beginner: '3 DAYS IN A ROW!', intermediate: '3-DAY STREAK.', advanced: '3-DAY STREAK.' },
    message: {
      beginner: "Three days in a row! You're building a real habit now. This is exactly how it starts.",
      intermediate: "3-day streak. Consistency is your most important variable right now.",
      advanced: "72h consistency window closed. Streak data accumulating.",
    },
    cta: 'KEEP THE STREAK →',
  },
  streak_7: {
    key: 'streak_7',
    emoji: '⚡',
    headline: { beginner: 'ONE FULL WEEK!', intermediate: '7-DAY STREAK.', advanced: '7-DAY STREAK.' },
    message: {
      beginner: "A full week! You've done something most people never do. You're actually doing this.",
      intermediate: "7-day streak complete. Your program data is now statistically significant.",
      advanced: "Week 1 consistency block complete. Adaptation curve is now tracking.",
    },
    cta: 'LET\'S GO →',
  },
  first_pr: {
    key: 'first_pr',
    emoji: '🏆',
    headline: { beginner: 'NEW PERSONAL BEST!', intermediate: 'NEW PR SET.', advanced: 'PERSONAL RECORD.' },
    message: {
      beginner: "You just lifted more than you ever have before. That's what progress looks like.",
      intermediate: "New PR logged. Your progressive overload is working.",
      advanced: "Performance ceiling raised. Adaptation confirmed.",
    },
    cta: 'SEE MY PRS →',
  },
};

// ── GET WIN WITH SKILL LEVEL ───────────────────────────────────────────────────

export function getWin(winKey, skillLevel) {
  const win = WINS[winKey];
  if (!win) return null;
  const level = (skillLevel || 'beginner').toLowerCase();
  const tier = level === 'advanced' ? 'advanced' : level === 'intermediate' ? 'intermediate' : 'beginner';
  return {
    key: win.key,
    emoji: win.emoji,
    headline: win.headline[tier] || win.headline.beginner,
    message: win.message[tier] || win.message.beginner,
    cta: win.cta,
  };
}

// ── CHECK STREAK WINS (pure — no Supabase) ─────────────────────────────────────

export function checkStreakWins(streak, skillLevel) {
  const today = new Date().toISOString().split('T')[0];
  const shown3 = localStorage.getItem('streak_3_shown');
  const shown7 = localStorage.getItem('streak_7_shown');

  if (streak >= 7 && shown7 !== today) {
    return getWin('streak_7', skillLevel);
  }
  if (streak >= 3 && shown3 !== today) {
    return getWin('streak_3', skillLevel);
  }
  return null;
}

export function markStreakWinShown(winKey) {
  const today = new Date().toISOString().split('T')[0];
  if (winKey === 'streak_7') localStorage.setItem('streak_7_shown', today);
  if (winKey === 'streak_3') localStorage.setItem('streak_3_shown', today);
}
