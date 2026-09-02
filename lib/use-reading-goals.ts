import { saveReadingGoals as saveReadingGoalsDoc, type ReadingGoals } from './data-service';
import {
  activeReadingDays,
  completedBooksInMonth,
  completedBooksInYear,
  computeStreaks,
  todayReadingMinutes,
} from './reading-goals';
import { useAppStore } from './store';

/**
 * Reads the user's reading goals and derives streak + progress from their
 * real library (books, sentences) and logged timer minutes — all sourced
 * live from the zustand store (see lib/use-auth-sync.ts), so every screen
 * that mounts this hook stays in sync with the others instead of each
 * holding its own stale snapshot. Mount wherever streak/goal data is shown
 * (mypage entry chip, library's today card, reading-goal screen).
 */
export function useReadingGoals() {
  const uid = useAppStore((s) => s.user?.uid);
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const goals = useAppStore((s) => s.readingGoals);
  const readingLog = useAppStore((s) => s.readingLog);
  const loading = useAppStore((s) => !!uid && !s.readingGoalsLoaded);

  async function saveGoals(next: ReadingGoals) {
    if (!uid) return;
    const previous = useAppStore.getState().readingGoals;
    useAppStore.getState().setReadingGoals(next);
    try {
      await saveReadingGoalsDoc(uid, next);
    } catch (err) {
      useAppStore.getState().setReadingGoals(previous);
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
