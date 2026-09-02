import { parseDotDate } from '../date-utils';

export type EntryType = 'text' | 'scan' | 'photo';

export const ENTRY_LABEL: Record<EntryType, string> = {
  text: '직접 입력',
  scan: '카메라 스캔',
  photo: '페이지 사진',
};

export type Sentence = {
  id: string;
  bookId: string;
  page: number;
  quote: string;
  memo?: string;
  photoUrl?: string;
  type: EntryType;
  date: string;
  /** Local hour (0–23) at save time — powers the stats page's time-of-day pattern. Only set on entries saved after this field was introduced, so older 갈피 won't have it. */
  hour?: number;
  /** Starred by the user as a favorite/highlight — surfaced in the yearly report's top quote. */
  favorite?: boolean;
  /** User-defined labels for grouping 갈피 across books into themed collections (e.g. "위로가 되는 문장"). */
  tags?: string[];
};

export function sentencesByBook(
  allSentences: Sentence[],
  bookId: string,
): Sentence[] {
  return allSentences.filter((s) => s.bookId === bookId);
}

export type TagCount = { tag: string; count: number };

/** Every distinct tag in use, most-used first (ties broken alphabetically). */
export function allTags(allSentences: Sentence[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const s of allSentences) {
    for (const tag of s.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function sentencesByTag(allSentences: Sentence[], tag: string): Sentence[] {
  return allSentences.filter((s) => s.tags?.includes(tag));
}

/**
 * The 갈피 saved on this same month/day in a past year — prefers exactly one
 * year ago, falling back to the most recent earlier year with a match.
 * Powers the "1년 전 오늘" reminder.
 */
export function onThisDayLastYear(allSentences: Sentence[], today: Date = new Date()): Sentence | undefined {
  const month = today.getMonth();
  const day = today.getDate();
  const year = today.getFullYear();

  const matches = allSentences
    .map((s) => ({ s, d: parseDotDate(s.date) }))
    .filter(
      (x): x is { s: Sentence; d: Date } =>
        !!x.d && x.d.getMonth() === month && x.d.getDate() === day && x.d.getFullYear() < year,
    );
  if (matches.length === 0) return undefined;

  const oneYearAgo = matches.find((x) => x.d.getFullYear() === year - 1);
  if (oneYearAgo) return oneYearAgo.s;
  return matches.sort((a, b) => b.d.getFullYear() - a.d.getFullYear())[0].s;
}

const MIN_SAMPLES_FOR_HOUR_SUGGESTION = 5;

/**
 * The hour (0-23) the user has most often saved a 갈피 at, for suggesting a
 * reminder time. Returns null with fewer than 5 timestamped entries — not
 * enough signal to suggest anything yet.
 */
export function mostActiveHour(allSentences: Sentence[]): number | null {
  const counts = new Array(24).fill(0);
  let total = 0;
  for (const s of allSentences) {
    if (typeof s.hour !== 'number') continue;
    counts[s.hour] += 1;
    total += 1;
  }
  if (total < MIN_SAMPLES_FOR_HOUR_SUGGESTION) return null;

  let best = 0;
  for (let h = 1; h < 24; h++) {
    if (counts[h] > counts[best]) best = h;
  }
  return best;
}
