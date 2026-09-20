'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a media query without an effect or a hydration mismatch. The server
 * snapshot is always `false`, so the server renders the desktop layout and the client
 * corrects on its first commit — the same pattern used for the stored preferences.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const list = window.matchMedia(query);
      list.addEventListener('change', listener);
      return () => list.removeEventListener('change', listener);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => (typeof window === 'undefined' ? false : window.matchMedia(query).matches),
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * The width below which the dashboard stacks into a single column. Advanced metadata
 * collapses behind a disclosure at the same boundary: in one column the expanded tables
 * push the hero past 700px tall, and the forecast below it off the screen.
 */
export const COMPACT_QUERY = '(max-width: 1080px)';
