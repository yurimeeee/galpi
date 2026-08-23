import { useEffect, useState } from 'react';
import {
  getReadingGoals,
  getReadingLog,
  saveReadingGoals as saveReadingGoalsDoc,
  DEFAULT_READING_GOALS,
  type ReadingGoals,
} from './data-service';
import {
  activeReadingDays,
  completedBooksInMonth,
  completedBooksInYear,
  computeStreaks,
  todayReadingMinutes,
} from './reading-goals';
import { useAppStore } from './store';

/**
 * Loads/saves the user's reading goals and derives streak + progress from
 * their real library (books, sentences) and logged timer minutes — mount
 * wherever streak/goal data is shown (mypage entry chip, reading-goal screen).
 */
export function useReadingGoals() {
  const uid = useAppStore((s) => s.user?.uid);
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<ReadingGoals>(DEFAULT_READING_GOALS);
  const [readingLog, setReadingLog] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [g, log] = await Promise.all([getReadingGoals(uid), getReadingLog(uid)]);
      if (cancelled) return;
      setGoals(g);
      setReadingLog(log);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  async function saveGoals(next: ReadingGoals) {
    if (!uid) return;
    const previous = goals;
    setGoals(next);
    try {
      await saveReadingGoalsDoc(uid, next);
    } catch (err) {
      setGoals(previous);
      throw err;
    }
  }

  const now = new Date();
  const activeDays = activeReadingDays(sentences, readingLog);
  const { current: currentStreak, best: bestStreak } = computeStreaks(activeDays);

  return {
    loading,
    goals,
    saveGoals,
    activeDays,
    readingLog,
    currentStreak,
    bestStreak,
    todayMinutes: todayReadingMinutes(readingLog),
    monthDone: completedBooksInMonth(books, now.getFullYear(), now.getMonth()),
    yearDone: completedBooksInYear(books, now.getFullYear()),
    year: now.getFullYear(),
    month: now.getMonth(),
  };
}
