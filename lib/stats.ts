import { parseDotDate, dateKey } from './date-utils';
import type { Book } from './data/books';
import type { Sentence } from './data/sentences';

/**
 * Pure 갈피/book aggregations behind the 통계 tab, the report card and the
 * year review. No React or styling here — UI-only constants such as the
 * heatmap color classes stay with the screens.
 */

export const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
/** 4 six-hour buckets covering the day, indexed by `Math.floor(hour / 6)`. */
export const HOUR_BUCKET_LABELS = ['새벽', '오전', '오후', '밤'];

export function seasonOf(month0: number): '봄' | '여름' | '가을' | '겨울' {
  if (month0 === 11 || month0 <= 1) return '겨울';
  if (month0 <= 4) return '봄';
  if (month0 <= 7) return '여름';
  return '가을';
}

function intensityFromCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

/** Index of the largest value, or -1 if every value is 0. */
export function maxIndex(counts: number[]): number {
  let idx = -1;
  let max = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > max) {
      max = counts[i];
      idx = i;
    }
  }
  return idx;
}

/** Searched books carry a full category path ("국내도서>소설/시/희곡>한국소설"); manually-entered ones are already just the leaf label — both cases collapse to the same last-segment value. */
function bookGenreLabel(book: Book | undefined): string | undefined {
  return book?.genre?.split('>').pop()?.trim();
}

/** The (key, count) pair with the highest count, or null if the map is empty / all-zero. */
function topCount(counts: Map<string, number>): { key: string; count: number } | null {
  let top: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (count > 0 && (!top || count > top.count)) top = { key, count };
  }
  return top;
}

/** Weekday (0=일~6=토) and 6-hour-bucket 갈피 distribution; scoped to one month when `month` is given, otherwise the whole year. */
export function getTimePattern(sentences: Sentence[], year: number, month?: number) {
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  const hourBucketCounts = [0, 0, 0, 0];
  let hasHourData = false;
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    if (month !== undefined && d.getMonth() !== month) continue;
    weekdayCounts[d.getDay()] += 1;
    if (typeof s.hour === 'number') {
      hasHourData = true;
      hourBucketCounts[Math.min(3, Math.floor(s.hour / 6))] += 1;
    }
  }
  return { weekdayCounts, hourBucketCounts, hasHourData };
}

/**
 * Rule-based "what books they mainly read/like" for one month: the genre with
 * the most 갈피 saved (읽는 = read) and the genre with the most 즐겨찾기 갈피
 * (좋아하는 = liked). Books without a genre are excluded rather than bucketed
 * as "기타", since a manufactured catch-all bucket would just win by default
 * once enough ungenred books accumulate.
 */
export function getGenrePattern(sentences: Sentence[], bookById: Map<string, Book>, year: number, month: number) {
  const readCounts = new Map<string, number>();
  const likedCounts = new Map<string, number>();
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    const genre = bookGenreLabel(bookById.get(s.bookId));
    if (!genre) continue;
    readCounts.set(genre, (readCounts.get(genre) ?? 0) + 1);
    if (s.favorite) likedCounts.set(genre, (likedCounts.get(genre) ?? 0) + 1);
  }
  const topRead = topCount(readCounts);
  const topLiked = topCount(likedCounts);
  return {
    topReadGenre: topRead?.key ?? null,
    topLikedGenre: topLiked?.key ?? null,
    hasGenreData: readCounts.size > 0,
  };
}

/** Top N genres (by 갈피 count) for a period, most-frequent first — powers the report card's "이달의 취향" tags. */
export function getTopGenres(sentences: Sentence[], bookById: Map<string, Book>, year: number, month?: number, limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    if (month !== undefined && d.getMonth() !== month) continue;
    const genre = bookGenreLabel(bookById.get(s.bookId));
    if (!genre) continue;
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

/**
 * Featured quote for the report card: the book with the most 갈피 saved this
 * period, then its favorited 갈피 (most recent if several) — or, absent a
 * favorite, its most recent 갈피.
 */
export function getPeriodQuote(
  sentences: Sentence[],
  bookById: Map<string, Book>,
  year: number,
  month?: number,
): { book: Book; sentence: Sentence } | null {
  const inPeriod: { s: Sentence; d: Date }[] = [];
  const bookCounts = new Map<string, number>();
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    if (month !== undefined && d.getMonth() !== month) continue;
    inPeriod.push({ s, d });
    bookCounts.set(s.bookId, (bookCounts.get(s.bookId) ?? 0) + 1);
  }
  const top = topCount(bookCounts);
  if (!top) return null;
  const book = bookById.get(top.key);
  if (!book) return null;
  const inTopBook = inPeriod.filter((x) => x.s.bookId === top.key).sort((a, b) => b.d.getTime() - a.d.getTime());
  const sentence = inTopBook.find((x) => x.s.favorite)?.s ?? inTopBook[0]?.s;
  return sentence ? { book, sentence } : null;
}

/** GitHub-style weekly-column grid of activity intensity for a given year; -1 marks days outside the year. */
export function buildYearHeatmap(sentences: Sentence[], year: number): number[][] {
  const dayCounts = new Map<string, number>();
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    const key = dateKey(d);
    dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
  }

  const start = new Date(year, 0, 1);
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - start.getDay());
  const end = new Date(year, 11, 31);
  const gridEnd = new Date(end);
  gridEnd.setDate(gridEnd.getDate() + (6 - end.getDay()));

  const grid: number[][] = [];
  const day = new Date(gridStart);
  while (day <= gridEnd) {
    const col: number[] = [];
    for (let i = 0; i < 7; i++) {
      col.push(day.getFullYear() === year ? intensityFromCount(dayCounts.get(dateKey(day)) ?? 0) : -1);
      day.setDate(day.getDate() + 1);
    }
    grid.push(col);
  }
  return grid;
}

export function getYearMetrics(books: Book[], sentences: Sentence[], year: number) {
  const doneCount = books.filter((b) => {
    const d = b.completedAt ? parseDotDate(b.completedAt) : null;
    return d && d.getFullYear() === year;
  }).length;
  const uniqueDays = new Set<string>();
  let galpiCount = 0;
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year) continue;
    galpiCount += 1;
    uniqueDays.add(dateKey(d));
  }
  return { doneCount, galpiCount, readDaysCount: uniqueDays.size };
}

export function getMonthMetrics(books: Book[], sentences: Sentence[], year: number, month: number) {
  const completedBooks = books.filter((b) => {
    const d = b.completedAt ? parseDotDate(b.completedAt) : null;
    return d && d.getFullYear() === year && d.getMonth() === month;
  });
  const uniqueDays = new Set<string>();
  let galpiCount = 0;
  for (const s of sentences) {
    const d = parseDotDate(s.date);
    if (!d || d.getFullYear() !== year || d.getMonth() !== month) continue;
    galpiCount += 1;
    uniqueDays.add(dateKey(d));
  }
  return { doneCount: completedBooks.length, galpiCount, readDaysCount: uniqueDays.size, completedBooks };
}
