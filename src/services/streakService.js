import { sb } from '../client.js';

// Local YYYY-MM-DD string — matches how workout_logs and food_logs store dates.
// Must use local date parts (not toISOString/UTC) so dates align with stored values.
function _localDs(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/**
 * Compute the unified streak (food OR workout, either counts) with Yazio-style freeze protection.
 *
 * Freeze rules:
 *   - Every 7 consecutive-day milestone earns 1 freeze (cap: 2 banked).
 *   - A missed day (no food AND no workout) auto-consumes a freeze if one is available,
 *     preserving the streak. If no freeze available the streak resets to 0 (loop breaks).
 *   - Today always gets morning grace: if today has no activity yet, skip it without breaking.
 *   - Once a date is freeze-covered it stays covered (stored in freeze_used_dates) so the
 *     freeze isn't re-consumed on subsequent app opens for the same missed day.
 *
 * @param {Set<string>} workoutDates  — Set of YYYY-MM-DD strings with ≥1 workout session
 * @param {Set<string>} foodDates     — Set of YYYY-MM-DD strings with ≥1 food log entry
 * @param {object}      streakData    — persistent freeze state (from profiles.streak_data)
 * @returns {{ streak: number, streakData: object, changed: boolean }}
 */
export function computeStreak(workoutDates, foodDates, streakData) {
  const freezeUsed = new Set(streakData.freeze_used_dates || []);
  let freezes = streakData.freezes ?? 0;
  let lastEarnedAt = streakData.last_freeze_earned_at ?? 0;
  let changed = false;

  let streak = 0;
  const d = new Date();

  for (let i = 0; i < 90; i++) {
    const ds = _localDs(d);
    const hasActivity = workoutDates.has(ds) || foodDates.has(ds);

    if (hasActivity) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (i === 0) {
      // Today: no activity yet — morning grace, keep going
      d.setDate(d.getDate() - 1);
    } else if (freezeUsed.has(ds)) {
      // Freeze already consumed for this gap day on a prior open — treat as covered
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (freezes > 0) {
      // Consume a freeze to cover this gap day
      freezes--;
      freezeUsed.add(ds);
      changed = true;
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break; // no freeze available, streak is over
    }
  }

  // Earn new freezes at each 7-day milestone not yet awarded, cap at 2 banked
  const earnedMilestone = Math.floor(streak / 7) * 7;
  if (earnedMilestone > lastEarnedAt && freezes < 2) {
    const newFreezes = Math.min(2 - freezes, Math.floor((earnedMilestone - lastEarnedAt) / 7));
    if (newFreezes > 0) {
      freezes = Math.min(2, freezes + newFreezes);
      lastEarnedAt = earnedMilestone;
      changed = true;
    }
  }

  const newData = changed
    ? { freezes, freeze_used_dates: [...freezeUsed], last_freeze_earned_at: lastEarnedAt }
    : streakData;

  return { streak, streakData: newData, changed };
}

/**
 * Persist updated streak_data to the profiles table.
 * Fire-and-forget: caller should not await unless it needs confirmation.
 */
export async function saveStreakData(userId, streakData) {
  try {
    await sb.from('profiles').update({ streak_data: streakData }).eq('id', userId);
  } catch (e) {
    console.error('[streak] saveStreakData failed:', e?.message);
  }
}

/**
 * Load food log dates for the past `days` days where entries is non-empty.
 * Returns a Set<string> of YYYY-MM-DD local date strings.
 */
export async function loadFoodLogDates(userId, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = _localDs(since);
  const { data } = await sb
    .from('food_logs')
    .select('date, entries')
    .eq('user_id', userId)
    .gte('date', sinceStr)
    .order('date', { ascending: false });
  return new Set((data || []).filter(r => r.entries?.length > 0).map(r => r.date));
}
