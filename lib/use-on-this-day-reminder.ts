import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getNotificationPreferences, saveNotificationPreferences } from './data-service';
import { useAppStore } from './store';
import { onThisDayLastYear } from './data/sentences';
import { todayLabel } from './date-utils';

const ON_THIS_DAY_REMINDER_ID = 'galpi-on-this-day-reminder';
const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

const SUPPORTS_NOTIFICATIONS = Platform.OS !== 'web';

/**
 * Surfaces a 갈피 saved on this same day in a past year, as a local
 * notification later today. Unlike the daily reminder — a fixed OS-level
 * repeating schedule set once — the content here is different every day, so
 * there's no way to "set it once": this hook recomputes today's match and
 * reschedules a one-shot notification each time the app is opened while
 * enabled. Mount it at the app root (see app/_layout.tsx) so that recompute
 * runs on every launch, not just while the settings screen happens to be
 * open. With no Cloud Functions component, a day the app never opens simply
 * has no notification — an accepted limitation of a client-only backend.
 */
export function useOnThisDayReminder() {
  const uid = useAppStore((s) => s.user?.uid);
  const sentences = useAppStore((s) => s.sentences);
  const books = useAppStore((s) => s.books);

  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState('');
  const scheduledForRef = useRef<string | null>(null);

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
        setEnabled(!!prefs?.onThisDayEnabled);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const match = onThisDayLastYear(sentences);
  const matchBook = match ? books.find((b) => b.id === match.bookId) : undefined;

  useEffect(() => {
    if (!SUPPORTS_NOTIFICATIONS || !enabled) return;
    const today = todayLabel();
    if (scheduledForRef.current === today) return;
    scheduledForRef.current = today;

    (async () => {
      await Notifications.cancelScheduledNotificationAsync(ON_THIS_DAY_REMINDER_ID).catch(() => {});
      if (!match) return;

      const permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) return;

      const now = new Date();
      const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, REMINDER_MINUTE);
      if (fireAt.getTime() <= now.getTime()) return;

      await Notifications.scheduleNotificationAsync({
        identifier: ON_THIS_DAY_REMINDER_ID,
        content: {
          title: '🔖 1년 전 오늘 남긴 갈피',
          body: matchBook ? `"${match.quote}" — 『${matchBook.title}』` : `"${match.quote}"`,
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
      });
    })();
  }, [enabled, match, matchBook]);

  const setOnThisDayEnabled = useCallback(
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
        await Notifications.cancelScheduledNotificationAsync(ON_THIS_DAY_REMINDER_ID).catch(() => {});
      }

      scheduledForRef.current = null;
      setEnabled(next);
      if (uid) await saveNotificationPreferences(uid, { onThisDayEnabled: next });
    },
    [uid],
  );

  return {
    loading,
    enabled,
    error,
    supported: SUPPORTS_NOTIFICATIONS,
    match,
    matchBook,
    setOnThisDayEnabled,
  };
}
