import { describe, expect, it } from 'vitest';
import type { Alert } from './parseAlerts';
import { ageMinutes, formatAge, freshness, isExpired } from './staleness';

const now = new Date('2026-10-25T12:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

describe('freshness', () => {
  it.each([
    [0, 'fresh'],
    [14.9, 'fresh'],
    [15, 'aging'],
    [59, 'aging'],
    [60, 'stale'],
    [60 * 24 * 3, 'stale'],
  ] as const)('%s minutes old is %s', (m, expected) => {
    expect(freshness(minutesAgo(m), now)).toBe(expected);
  });

  it('never reports a negative age if the clock is behind the cache', () => {
    expect(ageMinutes(new Date(now.getTime() + 60_000), now)).toBe(0);
    expect(freshness(new Date(now.getTime() + 60_000), now)).toBe('fresh');
  });
});

describe('formatAge', () => {
  it('uses minutes, then hours, then days, rounding down', () => {
    expect(formatAge(minutesAgo(0.5), now, 'en')).toBe('1 minute ago');
    expect(formatAge(minutesAgo(5.9), now, 'en')).toBe('5 minutes ago');
    expect(formatAge(minutesAgo(119), now, 'en')).toBe('1 hour ago');
    expect(formatAge(minutesAgo(60 * 50), now, 'en')).toBe('2 days ago');
  });

  it('speaks the user language', () => {
    expect(formatAge(minutesAgo(5), now, 'ja')).toBe('5 分前');
  });
});

describe('isExpired', () => {
  const alert = (ends: Date | null, expires: Date | null) =>
    ({ ends, expires }) as unknown as Alert;

  it('uses the end time when there is one', () => {
    expect(isExpired(alert(minutesAgo(1), minutesAgo(-60)), now)).toBe(true);
    expect(isExpired(alert(minutesAgo(-1), minutesAgo(60)), now)).toBe(false);
  });

  it('falls back to the expiry time', () => {
    expect(isExpired(alert(null, minutesAgo(1)), now)).toBe(true);
    expect(isExpired(alert(null, minutesAgo(-1)), now)).toBe(false);
  });

  it('treats an alert with neither as still in effect', () => {
    expect(isExpired(alert(null, null), now)).toBe(false);
  });
});
