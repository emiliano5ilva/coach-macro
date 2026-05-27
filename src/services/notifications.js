import { sb } from '../client.js';

async function getPush() {
  try { return (await import('@capacitor/push-notifications')).PushNotifications; } catch { return null; }
}

async function getLocal() {
  try { return (await import('@capacitor/local-notifications')).LocalNotifications; } catch { return null; }
}

export async function initPushNotifications(userId) {
  if (!userId) return;
  const Push = await getPush();
  if (!Push) return;

  try {
    const { receive } = await Push.checkPermissions();
    let status = receive;
    if (status === 'prompt') {
      const result = await Push.requestPermissions();
      status = result.receive;
    }
    if (status !== 'granted') return;

    await Push.register();

    Push.addListener('registration', async ({ value: token }) => {
      await sb.from('profiles').upsert({ id: userId, push_token: token }, { onConflict: 'id' });
    });

    Push.addListener('registrationError', (err) => {
      console.error('[Push] registration error:', err);
    });

    Push.addListener('pushNotificationReceived', (_notification) => {
      // handled via UI dispatch in pushNotificationActionPerformed
    });

    Push.addListener('pushNotificationActionPerformed', (action) => {
      const { route } = action.notification.data || {};
      if (route) {
        window.dispatchEvent(new CustomEvent('cm:deeplink', { detail: { route, parts: [] } }));
      }
    });
  } catch (e) {
    console.warn('[Push] init failed:', e.message);
  }
}

export async function scheduleTrialExpiryNotification(trialEndsAt) {
  if (!trialEndsAt) return;
  const Local = await getLocal();
  if (!Local) return;

  try {
    const { display } = await Local.checkPermissions();
    if (display !== 'granted') {
      const result = await Local.requestPermissions();
      if (result.display !== 'granted') return;
    }

    const expiryDate = new Date(trialEndsAt);
    const warningDate = new Date(expiryDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    if (warningDate <= new Date()) return;

    await Local.schedule({
      notifications: [{
        id: 1001,
        title: 'Your Pro trial ends soon',
        body: 'You have 3 days left. Upgrade now to keep your AI coach and full access.',
        schedule: { at: warningDate },
        extra: { route: 'pro' },
      }],
    });
  } catch (e) {
    console.warn('[LocalNotif] schedule failed:', e.message);
  }
}

export async function scheduleRestTimerNotification(seconds, exerciseName) {
  const Local = await getLocal();
  if (!Local) return;

  try {
    const { display } = await Local.checkPermissions();
    if (display !== 'granted') return;

    await Local.schedule({
      notifications: [{
        id: 2001,
        title: 'Rest complete',
        body: `Time for your next set of ${exerciseName || 'the exercise'}!`,
        schedule: { at: new Date(Date.now() + seconds * 1000) },
      }],
    });
  } catch (e) {
    console.warn('[LocalNotif] rest timer failed:', e.message);
  }
}

export async function cancelRestTimerNotification() {
  const Local = await getLocal();
  if (!Local) return;
  try { await Local.cancel({ notifications: [{ id: 2001 }] }); } catch {}
}

export async function scheduleCoachingNotifications({ consumed, macros, todayType, streakCount, morningBriefLine, sessionLoggedToday }) {
  const Local = await getLocal();
  if (!Local) return;

  try {
    const { display } = await Local.checkPermissions();
    if (display !== 'granted') {
      const result = await Local.requestPermissions();
      if (result.display !== 'granted') return;
    }

    // Cancel previous coaching notifications (ids 3001-3005)
    try {
      await Local.cancel({ notifications: [{ id: 3001 }, { id: 3002 }, { id: 3003 }, { id: 3004 }, { id: 3005 }] });
    } catch {}

    const now = new Date();
    const notifications = [];

    function todayAt(h, m) {
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    }

    // 1. Morning brief reminder — 7:30 AM
    const t1 = todayAt(7, 30);
    if (now < t1 && morningBriefLine) {
      notifications.push({ id: 3001, title: 'Your coach checked in.', body: morningBriefLine, schedule: { at: t1 } });
    }

    // 2. Pre-workout fuel — 12:00 PM on training days if calories < 800
    if (todayType === 'training' && !sessionLoggedToday) {
      const t2 = todayAt(12, 0);
      if (now < t2 && (consumed?.calories || 0) < 800) {
        notifications.push({ id: 3002, title: 'YOU TRAIN TODAY.', body: 'Fuel up before your session. You need carbs now.', schedule: { at: t2 } });
      }
    }

    // 3. Mid-day protein check — 1:00 PM
    const t3 = todayAt(13, 0);
    const proteinBehind = Math.round((macros?.protein || 150) * 0.3) - (consumed?.protein || 0);
    if (now < t3 && proteinBehind > 20) {
      notifications.push({ id: 3003, title: 'PROTEIN CHECK.', body: `You're ${proteinBehind}g protein behind. Your muscles need fuel.`, schedule: { at: t3 } });
    }

    // 4. Evening recap — 7:00 PM if calories remaining > 500
    const t4 = todayAt(19, 0);
    const calRemaining = (macros?.calories || 2000) - (consumed?.calories || 0);
    if (now < t4 && calRemaining > 500) {
      notifications.push({ id: 3004, title: "HOW'S THE DAY LOOKING?", body: `${Math.round(calRemaining)} calories left to hit your target. Log your last meal.`, schedule: { at: t4 } });
    }

    // 5. Streak at risk — 9:00 PM on training days if no session logged
    if (todayType === 'training' && !sessionLoggedToday && streakCount > 0) {
      const t5 = todayAt(21, 0);
      if (now < t5) {
        notifications.push({ id: 3005, title: 'YOUR STREAK IS AT RISK.', body: `Log today's session before midnight to keep your ${streakCount}-day streak alive.`, schedule: { at: t5 } });
      }
    }

    if (notifications.length > 0) {
      await Local.schedule({ notifications });
    }
  } catch (e) {
    console.warn('[CoachingNotif] schedule failed:', e.message);
  }
}

export async function scheduleValidationAlert(message) {
  const today = new Date().toISOString().split('T')[0];
  if (localStorage.getItem('cm_validation_alert_date') === today) return;

  const Local = await getLocal();
  if (!Local) return;

  try {
    const { display } = await Local.checkPermissions();
    if (display !== 'granted') return;

    const fireAt = new Date();
    fireAt.setHours(fireAt.getHours() + 1, 0, 0, 0);
    if (fireAt.getDate() !== new Date().getDate()) return;

    await Local.schedule({
      notifications: [{
        id: 4001,
        title: 'COACH INSIGHT.',
        body: message.length > 120 ? message.slice(0, 117) + '…' : message,
        schedule: { at: fireAt },
        extra: { route: 'progress' },
      }],
    });
    localStorage.setItem('cm_validation_alert_date', today);
  } catch (e) {
    console.warn('[LocalNotif] validation alert failed:', e.message);
  }
}

export async function requestNotificationPermission() {
  const Push = await getPush();
  if (!Push) return false;
  try {
    const { receive } = await Push.checkPermissions();
    if (receive === 'granted') return true;
    if (receive === 'prompt') {
      const result = await Push.requestPermissions();
      return result.receive === 'granted';
    }
    return false;
  } catch (e) {
    console.warn('[Push] permission request failed:', e.message);
    return false;
  }
}
