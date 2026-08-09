import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from './data-service';
import { useAppStore } from './store';

/**
 * Foreground presentation behavior — without this, scheduled/received
 * notifications are silently swallowed while the app is open.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const DAILY_REMINDER_ID = 'galpi-daily-reading-reminder';
const DEFAULT_TIME = '21:00';

export type ReminderTime = string; // "HH:mm"

/**
 * Local scheduled notifications aren't supported on web (no OS-level
 * scheduler), so every native call in this hook short-circuits there.
 */
const SUPPORTS_NOTIFICATIONS = Platform.OS !== 'web';

function parseTime(time: ReminderTime): { hour: number; minute: number } {
  const [hour, minute] = time.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

/**
 * Handles permission checks, push-token registration, and scheduling/
 * cancelling the daily local reading reminder. Mount wherever the reminder
 * setting is read or edited (notification settings screen, book detail).
 */
export function useReadingReminder() {
  const uid = useAppStore((s) => s.user?.uid);

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState<ReminderTime>(DEFAULT_TIME);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const prefs = await getNotificationPreferences(uid);
        if (cancelled) return;
        setEnabled(!!prefs?.dailyReminderEnabled);
        setTime(prefs?.dailyReminderTime ?? DEFAULT_TIME);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!SUPPORTS_NOTIFICATIONS) return;
    Notifications.getPermissionsAsync().then((res) => setPermissionStatus(res.status));
  }, []);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    if (!SUPPORTS_NOTIFICATIONS) return false;
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      setPermissionStatus(current.status);
      return true;
    }
    if (!current.canAskAgain) {
      setPermissionStatus(current.status);
      return false;
    }
    const requested = await Notifications.requestPermissionsAsync();
    setPermissionStatus(requested.status);
    return requested.granted;
  }, []);

  const registerPushToken = useCallback(async () => {
    if (!uid || !SUPPORTS_NOTIFICATIONS || !Device.isDevice) return;
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const { data } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      await saveNotificationPreferences(uid, { expoPushToken: data });
    } catch (err) {
      // Push token registration needs an EAS project; local reminders still
      // work without it, so this is a best-effort no-op on failure.
      console.warn('Expo push token registration failed', err);
    }
  }, [uid]);

  const scheduleDaily = useCallback(async (nextTime: ReminderTime) => {
    if (!SUPPORTS_NOTIFICATIONS) return;
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
    const { hour, minute } = parseTime(nextTime);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: '📚 오늘 독서 목표를 달성해 보세요!',
        body: '잠시 책장을 넘기며 나만의 갈피를 남겨볼까요?',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }, []);

  const setDailyReminderEnabled = useCallback(
    async (next: boolean) => {
      setError('');

      if (!SUPPORTS_NOTIFICATIONS) {
        setError('모바일 앱에서만 사용할 수 있는 기능이에요.');
        return;
      }

      if (next) {
        const granted = await ensurePermission();
        if (!granted) {
          setError('알림 권한이 꺼져 있어요. 기기 설정에서 갈피의 알림을 허용해 주세요.');
          return;
        }
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: '갈피 알림',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }
        await scheduleDaily(time);
        registerPushToken();
      } else {
        await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
      }

      setEnabled(next);
      if (uid) await saveNotificationPreferences(uid, { dailyReminderEnabled: next });
    },
    [ensurePermission, registerPushToken, scheduleDaily, time, uid],
  );

  const setDailyReminderTime = useCallback(
    async (nextTime: ReminderTime) => {
      setTime(nextTime);
      if (enabled) await scheduleDaily(nextTime);
      if (uid) await saveNotificationPreferences(uid, { dailyReminderTime: nextTime });
    },
    [enabled, scheduleDaily, uid],
  );

  /** Fired when the user taps "독서 시작" — a short countdown nudge to log a 갈피. */
  const triggerStartReadingNotification = useCallback(
    async (delaySeconds = 5) => {
      if (!SUPPORTS_NOTIFICATIONS) return;
      const granted = await ensurePermission();
      if (!granted) return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 독서를 시작했어요',
          body: '집중해서 읽고, 좋은 문장을 갈피에 남겨보세요.',
          sound: true,
        },
        trigger:
          delaySeconds > 0
            ? {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: delaySeconds,
                repeats: false,
              }
            : null,
      });
    },
    [ensurePermission],
  );

  return {
    loading,
    enabled,
    time,
    permissionStatus,
    error,
    supported: SUPPORTS_NOTIFICATIONS,
    setDailyReminderEnabled,
    setDailyReminderTime,
    triggerStartReadingNotification,
  };
}
