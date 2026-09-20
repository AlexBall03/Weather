'use client';

import { useEffect, useState } from 'react';

import { isApiErrorBody, type ApiError } from '@/types/api';
import type { SavedLocation } from '@/types/location';
import type { WeatherSnapshot } from '@/types/weather';

export type SnapshotResult =
  | { kind: 'ready'; snapshot: WeatherSnapshot }
  | { kind: 'error'; error: ApiError };

export type SnapshotState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; snapshot: WeatherSnapshot; isRefreshing: boolean }
  | { status: 'error'; error: ApiError };

const NETWORK_ERROR: ApiError = {
  code: 'UNEXPECTED',
  title: 'Cannot reach the server',
  message: 'The weather service could not be reached. Check your connection and try again.',
};

interface Entry {
  /** Identifies the exact request, including the refresh counter. */
  fetchKey: string;
  /** Identifies the place, so a refresh of the same place can keep showing its data. */
  placeKey: string;
  result: SnapshotResult;
}

function placeKeyOf(location: SavedLocation): string {
  return `${location.coordinates.latitude},${location.coordinates.longitude}`;
}

/**
 * Fetches a normalized snapshot for the selected location.
 *
 * State is derived from the last completed request rather than written at the top of the
 * effect: the effect only ever calls setState from its async callbacks. That avoids the
 * cascading-render pattern while still distinguishing a first load (skeleton) from a
 * refresh of the same place (existing data stays on screen).
 */
export function useWeatherSnapshot(
  location: SavedLocation | null,
  refreshToken: number,
): SnapshotState {
  const placeKey = location ? placeKeyOf(location) : null;
  const fetchKey = placeKey === null ? null : `${placeKey}#${refreshToken}`;
  const [entry, setEntry] = useState<Entry | null>(null);

  useEffect(() => {
    if (!location || placeKey === null || fetchKey === null) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(location.coordinates.latitude),
      lon: String(location.coordinates.longitude),
      label: location.label,
    });

    fetch(`/api/weather?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const body: unknown = await response.json();
        const result: SnapshotResult = response.ok
          ? { kind: 'ready', snapshot: body as WeatherSnapshot }
          : { kind: 'error', error: isApiErrorBody(body) ? body.error : NETWORK_ERROR };
        setEntry({ fetchKey, placeKey, result });
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        console.error('[weather] request failed', caught);
        setEntry({ fetchKey, placeKey, result: { kind: 'error', error: NETWORK_ERROR } });
      });

    return () => controller.abort();
    // `location` only contributes its coordinates and label, both folded into fetchKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, placeKey]);

  if (!location || fetchKey === null) return { status: 'idle' };

  if (entry?.fetchKey === fetchKey) {
    return entry.result.kind === 'ready'
      ? { status: 'ready', snapshot: entry.result.snapshot, isRefreshing: false }
      : { status: 'error', error: entry.result.error };
  }

  // A newer request is in flight. Keep the current place's data visible while it lands.
  if (entry?.placeKey === placeKey && entry.result.kind === 'ready') {
    return { status: 'ready', snapshot: entry.result.snapshot, isRefreshing: true };
  }

  return { status: 'loading' };
}
