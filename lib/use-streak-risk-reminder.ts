import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getNotificationPreferences, saveNotificationPreferences } from './data-service';
import { useAppStore } from './store';
import { activeReadingDays, computeStreaks } from './reading-goals';
import { dateKey } from './date-utils';

const STREAK_RISK_REMINDER_ID = 'galpi-streak-risk-reminder';
const REMINDER_HOUR = 22;
const REMINDER_MINUTE = 0;

const SUPPORTS_NOTIFICATIONS = Platform.OS !== 'web';

/**
 * Nudges the user only when it matters: today has no reading activity yet
 * *and* there's a live streak that would break at midnight. Unlike the daily
 * reminder (fixed OS-level schedule), this reschedules a one-shot tonight
 * notification whenever streak/activity state changes — including within the
 * same day, e.g. cancel it the moment the user logs a 갈피 after being
 * scheduled this morning. Mount at the app root (see app/_layout.tsx) so the
 * recompute runs on every launch/foreground, not just while the settings
 * screen is open.
 */
export function useStreakRiskReminder() {
  const uid = useAppStore((s) => s.user?.uid);
  const sentences = useAppStore((s) => s.sentences);
  const readingLog = useAppStore((s) => s.readingLog);

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
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
        setEnabled(!!prefs?.streakRiskReminderEnabled);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const activeDays = activeReadingDays(sentences, readingLog);
  const { current: currentStreak } = computeStreaks(activeDays);
  const hasActivityToday = activeDays.has(dateKey(new Date()));

  useEffect(() => {
    if (!SUPPORTS_NOTIFICATIONS) return;

    (async () => {
      await Notifications.cancelScheduledNotificationAsync(STREAK_RISK_REMINDER_ID).catch(() => {});
      if (!enabled || hasActivityToday || currentStreak < 1) return;

      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) return;

      const now = new Date();
      const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, REMINDER_MINUTE);
      if (fireAt.getTime() <= now.getTime()) return;

      await Notifications.scheduleNotificationAsync({
        identifier: STREAK_RISK_REMINDER_ID,
        content: {
          title: '🔥 오늘 기록이 아직 없어요',
          body: `현재 ${currentStreak}일 연속 기록 중이에요. 자정 전에 한 줄만 남겨볼까요?`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
      });
    })();
  }, [enabled, currentStreak, hasActivityToday]);

  const setStreakRiskReminderEnabled = useCallback(
    async (next: boolean) => {
      setError('');
      if (!SUPPORTS_NOTIFICATIONS) {
        setError('모바일 앱에서만 사용할 수 있는 기능이에요.');
        return;
      }

      if (next) {
        const current = await Notifications.getPermissionsAsync();
        const granted = current.granted || (current.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
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
      } else {
        await Notifications.cancelScheduledNotificationAsync(STREAK_RISK_REMINDER_ID).catch(() => {});
      }

      setEnabled(next);
      if (uid) await saveNotificationPreferences(uid, { streakRiskReminderEnabled: next });
    },
    [uid],
  );

  return {
    loading,
    enabled,
    error,
    supported: SUPPORTS_NOTIFICATIONS,
    currentStreak,
    hasActivityToday,
    setStreakRiskReminderEnabled,
  };
}
