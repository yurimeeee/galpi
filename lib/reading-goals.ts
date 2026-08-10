import { dateKey, parseDotDate, todayLabel } from './date-utils';
import { type Book } from './data/books';
import { type Sentence } from './data/sentences';

export type { ReadingGoals } from './data-service';
export { DEFAULT_READING_GOALS } from './data-service';

function shiftDay(d: Date, delta: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + delta);
  return next;
}

/** Calendar days (as dateKey strings) the user was active — captured a 갈피 or logged timer minutes that day. */
export function activeReadingDays(
  sentences: Sentence[],
  readingLog: Record<string, number>,
): Set<string> {
  const days = new Set<string>();
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (d) days.add(dateKey(d));
  }
  for (const [label, minutes] of Object.entries(readingLog)) {
    if (minutes <= 0) continue;
    const d = parseDotDate(label);
    if (d) days.add(dateKey(d));
  }
  return days;
}

/**
 * Consecutive-day streak ending today, and the longest streak on record.
 * If today has no activity yet, the current streak counts back from
 * yesterday instead of resetting to 0 — the day isn't over.
 */
export function computeStreaks(days: Set<string>): { current: number; best: number } {
  if (days.size === 0) return { current: 0, best: 0 };

  let cursor = new Date();
  if (!days.has(dateKey(cursor))) cursor = shiftDay(cursor, -1);
  let current = 0;
  while (days.has(dateKey(cursor))) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  const sorted = Array.from(days)
    .map((key) => {
      const [y, m, d] = key.split('-').map(Number);
      return new Date(y, m, d);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diffDays = Math.round((sorted[i].getTime() - sorted[i - 1].getTime()) / 86_400_000);
    run = diffDays === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  return { current, best: Math.max(best, current) };
}

export function completedBooksInMonth(books: Book[], year: number, month: number): number {
  return books.filter((b) => {
    const d = b.completedAt ? parseDotDate(b.completedAt) : null;
    return d && d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export function completedBooksInYear(books: Book[], year: number): number {
  return books.filter((b) => {
    const d = b.completedAt ? parseDotDate(b.completedAt) : null;
    return d && d.getFullYear() === year;
  }).length;
}

export function todayReadingMinutes(readingLog: Record<string, number>): number {
  return readingLog[todayLabel()] ?? 0;
}
