import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { dateKey, formatHourKorean, parseDotDate, todayLabel } from '../date-utils';

describe('parseDotDate', () => {
  it('parses YYYY.MM.DD as a local date', () => {
    const d = parseDotDate('2026.03.09')!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 2, 9]);
  });

  it.each(['', '2026', '2026.03', 'abc.de.fg'])('returns null for %p', (input) => {
    expect(parseDotDate(input)).toBeNull();
  });
});

describe('dateKey', () => {
  it('uses a zero-based month so it matches the reading-goal keys', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-0-5');
  });
});

describe('todayLabel', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('zero-pads month and day', () => {
    jest.useFakeTimers({ now: new Date(2026, 1, 3, 10) });
    expect(todayLabel()).toBe('2026.02.03');
  });
});

describe('formatHourKorean', () => {
  it.each([
    [0, '오전 12시'],
    [9, '오전 9시'],
    [12, '오후 12시'],
    [21, '오후 9시'],
  ])('%i → %s', (hour, label) => {
    expect(formatHourKorean(hour)).toBe(label);
  });
});
