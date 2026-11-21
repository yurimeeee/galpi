import { describe, expect, it } from '@jest/globals';
import { BADGES, computeBadgeProgress } from '../badges';

describe('computeBadgeProgress', () => {
  it('awards each tier at its threshold, per category', () => {
    const progress = computeBadgeProgress({ books: 5, galpi: 9, bestStreak: 30 });
    const achieved = progress.filter((b) => b.achieved).map((b) => b.id);
    expect(achieved).toEqual(['books-1', 'books-5', 'streak-3', 'streak-7', 'streak-30']);
  });

  it('keeps one entry per badge in ladder order', () => {
    expect(computeBadgeProgress({ books: 0, galpi: 0, bestStreak: 0 }).map((b) => b.id)).toEqual(BADGES.map((b) => b.id));
  });
});
