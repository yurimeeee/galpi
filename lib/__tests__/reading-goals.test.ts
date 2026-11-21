// reading-goals re-exports DEFAULT_READING_GOALS from data-service, which
// initializes Firebase on import — stub it so these stay pure unit tests.
import { afterEach, describe, expect, it, jest } from '@jest/globals';
jest.mock('../data-service', () => ({ DEFAULT_READING_GOALS: {} }));

import { dateKey } from '../date-utils';
import {
  activeReadingDays,
  completedBooksInMonth,
  completedBooksInYear,
  computeStreaks,
  getTopBookOfYear,
  todayReadingMinutes,
  yearBestStreak,
  yearlyReadingMinutes,
} from '../reading-goals';
import { book, sentence } from './fixtures';

function days(...dates: [number, number, number][]): Set<string> {
  return new Set(dates.map(([y, m, d]) => dateKey(new Date(y, m - 1, d))));
}

afterEach(() => {
  jest.useRealTimers();
});

describe('activeReadingDays', () => {
  it('merges 갈피 dates and timer days, ignoring zero-minute entries', () => {
    const result = activeReadingDays(
      [sentence('2026.11.01'), sentence('2026.11.01'), sentence('bad')],
      { '2026.11.02': 15, '2026.11.03': 0 },
    );
    expect(result).toEqual(days([2026, 11, 1], [2026, 11, 2]));
  });
});

describe('computeStreaks', () => {
  it('is zero for no activity', () => {
    expect(computeStreaks(new Set())).toEqual({ current: 0, best: 0 });
  });

  it('counts back from today when today is active', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 20, 12) });
    expect(computeStreaks(days([2026, 11, 18], [2026, 11, 19], [2026, 11, 20]))).toEqual({ current: 3, best: 3 });
  });

  it('keeps yesterday’s streak alive while today has no activity yet', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 20, 8) });
    expect(computeStreaks(days([2026, 11, 18], [2026, 11, 19])).current).toBe(2);
  });

  it('resets once a full day is missed', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 20, 8) });
    expect(computeStreaks(days([2026, 11, 17], [2026, 11, 18])).current).toBe(0);
  });

  it('crosses month boundaries', () => {
    jest.useFakeTimers({ now: new Date(2026, 2, 1, 12) });
    expect(computeStreaks(days([2026, 2, 27], [2026, 2, 28], [2026, 3, 1])).current).toBe(3);
  });

  it('remembers a longer past run as best', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 20, 12) });
    const result = computeStreaks(days([2026, 10, 1], [2026, 10, 2], [2026, 10, 3], [2026, 10, 4], [2026, 11, 20]));
    expect(result).toEqual({ current: 1, best: 4 });
  });
});

describe('yearBestStreak', () => {
  it('only counts the days inside the given year', () => {
    const d = days([2025, 12, 30], [2025, 12, 31], [2026, 1, 1], [2026, 1, 2]);
    expect(yearBestStreak(d, 2026)).toBe(2);
    expect(yearBestStreak(d, 2025)).toBe(2);
    expect(yearBestStreak(d, 2024)).toBe(0);
  });
});

describe('completed book counts', () => {
  const books = [
    book({ completedAt: '2026.11.02' }),
    book({ completedAt: '2026.10.31' }),
    book({ completedAt: '2025.11.02' }),
    book({}),
  ];

  it('filters by month (zero-based) and year', () => {
    expect(completedBooksInMonth(books, 2026, 10)).toBe(1);
    expect(completedBooksInYear(books, 2026)).toBe(2);
  });
});

describe('reading minutes', () => {
  it('reads today’s minutes from the log', () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 20, 12) });
    expect(todayReadingMinutes({ '2026.11.20': 25 })).toBe(25);
    expect(todayReadingMinutes({})).toBe(0);
  });

  it('sums a year', () => {
    expect(yearlyReadingMinutes({ '2026.01.01': 10, '2026.12.31': 5, '2025.12.31': 99 }, 2026)).toBe(15);
  });
});

describe('getTopBookOfYear', () => {
  it('picks the book with the most 갈피 and prefers a favorite quote', () => {
    const a = book();
    const b = book();
    const fav = sentence('2026.03.01', { bookId: a.id, favorite: true });
    const sentences = [
      fav,
      sentence('2026.05.01', { bookId: a.id }),
      sentence('2026.06.01', { bookId: b.id }),
      sentence('2025.01.01', { bookId: b.id }),
      sentence('2025.01.02', { bookId: b.id }),
    ];
    expect(getTopBookOfYear(sentences, [a, b], 2026)).toEqual({ book: a, sentence: fav });
  });

  it('falls back to the most recent quote and returns null for an empty year', () => {
    const a = book();
    const latest = sentence('2026.09.01', { bookId: a.id });
    const sentences = [sentence('2026.01.01', { bookId: a.id }), latest];
    expect(getTopBookOfYear(sentences, [a], 2026)?.sentence).toBe(latest);
    expect(getTopBookOfYear(sentences, [a], 2020)).toBeNull();
  });
});
