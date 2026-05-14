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
