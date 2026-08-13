export type BadgeCategory = 'books' | 'galpi' | 'streak';

export type Badge = {
  id: string;
  category: BadgeCategory;
  threshold: number;
  title: string;
  description: string;
};

/** Static badge ladder — three categories (완독, 갈피, 연속 기록), four tiers each. */
export const BADGES: Badge[] = [
  { id: 'books-1', category: 'books', threshold: 1, title: '첫 완독', description: '책 1권을 완독했어요' },
  { id: 'books-5', category: 'books', threshold: 5, title: '꾸준한 독자', description: '책 5권을 완독했어요' },
  { id: 'books-20', category: 'books', threshold: 20, title: '다독가', description: '책 20권을 완독했어요' },
  { id: 'books-50', category: 'books', threshold: 50, title: '책의 달인', description: '책 50권을 완독했어요' },

  { id: 'galpi-10', category: 'galpi', threshold: 10, title: '첫 문장 수집', description: '갈피 10개를 모았어요' },
  { id: 'galpi-50', category: 'galpi', threshold: 50, title: '문장 수집가', description: '갈피 50개를 모았어요' },
  { id: 'galpi-100', category: 'galpi', threshold: 100, title: '문장 애호가', description: '갈피 100개를 모았어요' },
  { id: 'galpi-300', category: 'galpi', threshold: 300, title: '문장의 서재', description: '갈피 300개를 모았어요' },

  { id: 'streak-3', category: 'streak', threshold: 3, title: '3일의 습관', description: '3일 연속 독서 기록을 세웠어요' },
  { id: 'streak-7', category: 'streak', threshold: 7, title: '일주일의 힘', description: '7일 연속 독서 기록을 세웠어요' },
  { id: 'streak-30', category: 'streak', threshold: 30, title: '한 달의 몰입', description: '30일 연속 독서 기록을 세웠어요' },
  { id: 'streak-100', category: 'streak', threshold: 100, title: '백일의 기록', description: '100일 연속 독서 기록을 세웠어요' },
];

export type BadgeProgress = Badge & { achieved: boolean };

export type BadgeCounts = {
  /** Completed ("완독") book count, not the full library size. */
  books: number;
  galpi: number;
  /** Best streak on record, not just the current one — a badge earned once stays earned. */
  bestStreak: number;
};

const COUNT_KEY: Record<BadgeCategory, keyof BadgeCounts> = {
  books: 'books',
  galpi: 'galpi',
  streak: 'bestStreak',
};

export function computeBadgeProgress(counts: BadgeCounts): BadgeProgress[] {
  return BADGES.map((badge) => ({ ...badge, achieved: counts[COUNT_KEY[badge.category]] >= badge.threshold }));
}
