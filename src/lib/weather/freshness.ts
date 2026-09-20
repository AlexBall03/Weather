import type { ObservationFreshness } from '@/types/weather';

/**
 * Surface observations are nominally hourly, with specials in between. A station that has
 * been quiet for over an hour is not "live", and the UI must never claim otherwise — hence
 * the deliberately conservative thresholds.
 */
const LIVE_MAX_SECONDS = 75 * 60;
const RECENT_MAX_SECONDS = 3 * 60 * 60;

export function observationAgeSeconds(observedAt: string, now: Date = new Date()): number {
  const observed = new Date(observedAt).getTime();
  if (Number.isNaN(observed)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.round((now.getTime() - observed) / 1000));
}

export function classifyFreshness(ageSeconds: number): ObservationFreshness {
  if (ageSeconds <= LIVE_MAX_SECONDS) return 'live';
  if (ageSeconds <= RECENT_MAX_SECONDS) return 'recent';
  return 'stale';
}

export const FRESHNESS_LABEL: Record<ObservationFreshness, string> = {
  live: 'LIVE',
  recent: 'RECENT',
  stale: 'STALE',
};
