import { describe, expect, it } from '@jest/globals';
import { allTags, mostActiveHour, onThisDayLastYear, sentencesByTag } from '../data/sentences';
import { sentence } from './fixtures';

describe('tags', () => {
  const sentences = [
    sentence('2026.01.01', { tags: ['위로', '사랑'] }),
    sentence('2026.01.02', { tags: ['위로'] }),
    sentence('2026.01.03', { tags: ['가족'] }),
    sentence('2026.01.04'),
  ];

  it('lists tags most-used first, ties alphabetically', () => {
    expect(allTags(sentences)).toEqual([
      { tag: '위로', count: 2 },
      { tag: '가족', count: 1 },
      { tag: '사랑', count: 1 },
    ]);
  });

  it('filters by tag', () => {
    expect(sentencesByTag(sentences, '위로')).toHaveLength(2);
  });
});

describe('onThisDayLastYear', () => {
  const today = new Date(2026, 10, 21);

  it('prefers exactly one year ago', () => {
    const lastYear = sentence('2025.11.21');
    expect(onThisDayLastYear([sentence('2023.11.21'), lastYear, sentence('2026.11.21')], today)).toBe(lastYear);
  });

  it('falls back to the most recent earlier year', () => {
    const recent = sentence('2023.11.21');
    expect(onThisDayLastYear([sentence('2021.11.21'), recent], today)).toBe(recent);
  });

  it('returns undefined when nothing matches', () => {
    expect(onThisDayLastYear([sentence('2025.11.20')], today)).toBeUndefined();
  });
});

describe('mostActiveHour', () => {
  it('needs at least 5 timestamped entries', () => {
    expect(mostActiveHour([21, 21, 21, 21].map((hour) => sentence('2026.01.01', { hour })))).toBeNull();
  });

  it('returns the most frequent hour', () => {
    const hours = [21, 21, 21, 8, 8, 0];
    expect(mostActiveHour(hours.map((hour) => sentence('2026.01.01', { hour })))).toBe(21);
  });
});
