import { describe, expect, it } from '@jest/globals';
import {
  buildYearHeatmap,
  getGenrePattern,
  getMonthMetrics,
  getPeriodQuote,
  getTimePattern,
  getTopGenres,
  getYearMetrics,
  maxIndex,
  seasonOf,
} from '../stats';
import { book, sentence } from './fixtures';

describe('seasonOf', () => {
  it.each([
    [0, '겨울'],
    [2, '봄'],
    [5, '여름'],
    [8, '가을'],
    [11, '겨울'],
  ])('month %i → %s', (m, season) => {
    expect(seasonOf(m)).toBe(season);
  });
});

describe('maxIndex', () => {
  it('returns -1 when everything is zero', () => {
    expect(maxIndex([0, 0, 0])).toBe(-1);
    expect(maxIndex([1, 3, 3])).toBe(1);
  });
});

describe('getTimePattern', () => {
  it('buckets by weekday and 6-hour block within the month', () => {
    // 2026-11-01 is a Sunday.
    const result = getTimePattern(
      [sentence('2026.11.01', { hour: 23 }), sentence('2026.11.02', { hour: 7 }), sentence('2026.10.31', { hour: 7 })],
      2026,
      10,
    );
    expect(result.weekdayCounts).toEqual([1, 1, 0, 0, 0, 0, 0]);
    expect(result.hourBucketCounts).toEqual([0, 1, 0, 1]);
    expect(result.hasHourData).toBe(true);
  });
});

describe('genres', () => {
  const novel = book({ genre: '국내도서>소설/시/희곡' });
  const essay = book({ genre: '에세이' });
  const plain = book();
  const byId = new Map([novel, essay, plain].map((b) => [b.id, b]));
  const sentences = [
    sentence('2026.11.01', { bookId: novel.id }),
    sentence('2026.11.02', { bookId: novel.id }),
    sentence('2026.11.03', { bookId: essay.id, favorite: true }),
    sentence('2026.11.04', { bookId: plain.id }),
    sentence('2026.11.05', { bookId: plain.id }),
    sentence('2026.11.06', { bookId: plain.id }),
  ];

  it('uses the last path segment and skips books without a genre', () => {
    expect(getGenrePattern(sentences, byId, 2026, 10)).toEqual({
      topReadGenre: '소설/시/희곡',
      topLikedGenre: '에세이',
      hasGenreData: true,
    });
  });

  it('ranks top genres for a period', () => {
    expect(getTopGenres(sentences, byId, 2026, 10)).toEqual(['소설/시/희곡', '에세이']);
    expect(getTopGenres(sentences, byId, 2025)).toEqual([]);
  });

  it('picks the period quote from the busiest book', () => {
    expect(getPeriodQuote(sentences, byId, 2026, 10)?.book).toBe(plain);
    expect(getPeriodQuote(sentences, byId, 2026, 0)).toBeNull();
  });
});

describe('buildYearHeatmap', () => {
  it('pads whole weeks with -1 outside the year and caps intensity at 4', () => {
    const grid = buildYearHeatmap(
      ['2026.01.01', '2026.01.01', '2026.12.31', '2026.12.31', '2026.12.31', '2026.12.31', '2026.12.31'].map((d) =>
        sentence(d),
      ),
      2026,
    );
    expect(grid.every((col) => col.length === 7)).toBe(true);
    // 2026-01-01 is a Thursday: Sun–Wed of the first column are outside the year.
    expect(grid[0]).toEqual([-1, -1, -1, -1, 2, 0, 0]);
    // 2026-12-31 is a Thursday too.
    expect(grid[grid.length - 1]).toEqual([0, 0, 0, 0, 4, -1, -1]);
    const inYear = grid.flat().filter((v) => v >= 0);
    expect(inYear).toHaveLength(365);
  });
});

describe('period metrics', () => {
  const books = [book({ completedAt: '2026.11.02' }), book({ completedAt: '2026.01.10' })];
  const sentences = [sentence('2026.11.01'), sentence('2026.11.01'), sentence('2026.11.05'), sentence('2026.02.01')];

  it('counts a month', () => {
    const m = getMonthMetrics(books, sentences, 2026, 10);
    expect([m.doneCount, m.galpiCount, m.readDaysCount]).toEqual([1, 3, 2]);
  });

  it('counts a year', () => {
    expect(getYearMetrics(books, sentences, 2026)).toEqual({ doneCount: 2, galpiCount: 4, readDaysCount: 3 });
  });
});
