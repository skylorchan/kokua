import type { Alert } from './parseAlerts';

export type Freshness = 'fresh' | 'aging' | 'stale';

/** Minutes after which we say so on screen. NWS issues alerts at any time of day. */
export const AGING_AFTER_MIN = 15;
export const STALE_AFTER_MIN = 60;

export function ageMinutes(fetchedAt: Date, now: Date): number {
  return Math.max(0, (now.getTime() - fetchedAt.getTime()) / 60_000);
}

export function freshness(fetchedAt: Date, now: Date): Freshness {
  const age = ageMinutes(fetchedAt, now);
  if (age >= STALE_AFTER_MIN) return 'stale';
  if (age >= AGING_AFTER_MIN) return 'aging';
  return 'fresh';
}

/** An alert is over once its end time (or, failing that, its expiry) has passed. */
export function isExpired(alert: Alert, now: Date): boolean {
  const end = alert.ends ?? alert.expires;
  return end !== null && end.getTime() <= now.getTime();
}

/**
 * "5 minutes ago", "2 hours ago", "3 days ago" in the user's language. Never says less
 * than 1 minute, and rounds hours and days down.
 */
export function formatAge(fetchedAt: Date, now: Date, lang: string): string {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'always' });
  const minutes = Math.max(1, Math.floor(ageMinutes(fetchedAt, now)));
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.floor(hours / 24), 'day');
}
