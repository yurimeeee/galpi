import { useCallback, useMemo } from 'react';
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
 *
 * The derivations are memoized on their store inputs: this hook is mounted
 * on the library screen, which re-renders on every search keystroke, and
 * `activeReadingDays` + `computeStreaks` walk and sort every 갈피 — work
 * that only needs redoing when sentences or the reading log change.
 */
export function useReadingGoals() {
  const uid = useAppStore((s) => s.user?.uid);
  const books = useAppStore((s) => s.books);
  const sentences = useAppStore((s) => s.sentences);
  const goals = useAppStore((s) => s.readingGoals);
  const readingLog = useAppStore((s) => s.readingLog);
  const loading = useAppStore((s) => !!uid && !s.readingGoalsLoaded);

  const saveGoals = useCallback(
    async (next: ReadingGoals) => {
      if (!uid) return;
      const previous = useAppStore.getState().readingGoals;
      useAppStore.getState().setReadingGoals(next);
      try {
        await saveReadingGoalsDoc(uid, next);
      } catch (err) {
        useAppStore.getState().setReadingGoals(previous);
        throw err;
      }
    },
    [uid],
  );

  const activeDays = useMemo(() => activeReadingDays(sentences, readingLog), [sentences, readingLog]);
  const { current: currentStreak, best: bestStreak } = useMemo(() => computeStreaks(activeDays), [activeDays]);

  // Cheap primitives, read fresh each render so a screen left open across
  // midnight / month end picks up the new period on its next render.
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayMinutes = todayReadingMinutes(readingLog);

  const monthDone = useMemo(() => completedBooksInMonth(books, year, month), [books, year, month]);
  const yearDone = useMemo(() => completedBooksInYear(books, year), [books, year]);

  return useMemo(
    () => ({
      loading,
      goals,
      saveGoals,
      activeDays,
      readingLog,
      currentStreak,
      bestStreak,
      todayMinutes,
      monthDone,
      yearDone,
      year,
      month,
    }),
    [loading, goals, saveGoals, activeDays, readingLog, currentStreak, bestStreak, todayMinutes, monthDone, yearDone, year, month],
  );
}
