import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { sb } from '../client.js';

export async function initPushNotifications(userId) {
  if (!userId) return;

  try {
    const { receive } = await PushNotifications.checkPermissions();
    let status = receive;

    if (status === 'prompt') {
      const result = await PushNotifications.requestPermissions();
      status = result.receive;
    }

    if (status !== 'granted') return;

    await PushNotifications.register();

    PushNotifications.addListener('registration', async ({ value: token }) => {
      await sb.from('profiles').upsert(
        { id: userId, push_token: token },
        { onConflict: 'id' }
      );
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] received in foreground:', notification);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const { route } = action.notification.data || {};
      if (route) {
        window.dispatchEvent(new CustomEvent('cm:deeplink', {
          detail: { route, parts: [] }
        }));
      }
    });
  } catch (e) {
    // Not running in Capacitor context (web browser) — silently ignore
  }
}

export async function scheduleTrialExpiryNotification(trialEndsAt) {
  if (!trialEndsAt) return;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      const result = await LocalNotifications.requestPermissions();
      if (result.display !== 'granted') return;
    }

    const expiryDate = new Date(trialEndsAt);
    const warningDate = new Date(expiryDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before

    if (warningDate <= new Date()) return; // already past warning window

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: 'Your Pro trial ends soon',
          body: 'You have 3 days left. Upgrade now to keep your AI coach and full access.',
          schedule: { at: warningDate },
          extra: { route: 'pro' },
        },
      ],
    });
  } catch (e) {
    // Not running in Capacitor context — silently ignore
  }
}

export async function scheduleRestTimerNotification(seconds, exerciseName) {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') return;

    const fireAt = new Date(Date.now() + seconds * 1000);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 2001,
          title: 'Rest complete',
          body: `Time for your next set of ${exerciseName || 'the exercise'}!`,
          schedule: { at: fireAt },
        },
      ],
    });
  } catch (e) {
    // Not running in Capacitor context — silently ignore
  }
}

export async function cancelRestTimerNotification() {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 2001 }] });
  } catch {}
}
