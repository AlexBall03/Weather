'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';

import { useWeatherSnapshot, type SnapshotState } from '@/hooks/useWeatherSnapshot';
import { GeolocationFailure, requestCurrentPosition } from '@/lib/location/geolocation';
import {
  getLocationServerSnapshot,
  getLocationSnapshot,
  setStoredLocation,
  subscribeToLocation,
} from '@/lib/location/store';
import type { ApiError } from '@/types/api';
import type { SavedLocation } from '@/types/location';
import type { WeatherSnapshot } from '@/types/weather';

interface LocationContextValue {
  /** False only while the saved location is being restored on the client's first commit. */
  hydrated: boolean;
  location: SavedLocation | null;
  snapshot: WeatherSnapshot | null;
  status: SnapshotState['status'];
  error: ApiError | null;
  /** True while a refresh replaces data that is already on screen. */
  isRefreshing: boolean;
  isLocating: boolean;
  geolocationError: string | null;
  selectLocation: (location: SavedLocation) => void;
  locateMe: () => Promise<void>;
  refresh: () => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

/**
 * Silent background refresh. Our API route caches aggressively, so this costs NWS very
 * little while keeping a dashboard left open from going quietly stale.
 */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const stored = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getLocationServerSnapshot,
  );

  const hydrated = stored !== 'restoring';
  const location = hydrated ? stored : null;

  const [refreshToken, setRefreshToken] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const state = useWeatherSnapshot(location, refreshToken);

  useEffect(() => {
    if (!location) return;
    const timer = window.setInterval(
      () => setRefreshToken((token) => token + 1),
      REFRESH_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [location]);

  const selectLocation = useCallback((next: SavedLocation) => {
    setGeolocationError(null);
    setStoredLocation(next);
  }, []);

  const locateMe = useCallback(async () => {
    setIsLocating(true);
    setGeolocationError(null);
    try {
      const coordinates = await requestCurrentPosition();
      // NWS supplies the readable place name once /points resolves; this is a placeholder.
      selectLocation({ label: 'Current location', coordinates });
    } catch (caught) {
      setGeolocationError(
        caught instanceof GeolocationFailure
          ? caught.message
          : 'Could not determine your location. Search for a place instead.',
      );
    } finally {
      setIsLocating(false);
    }
  }, [selectLocation]);

  const refresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  const value = useMemo<LocationContextValue>(
    () => ({
      hydrated,
      location,
      snapshot: state.status === 'ready' ? state.snapshot : null,
      status: state.status,
      error: state.status === 'error' ? state.error : null,
      isRefreshing: state.status === 'ready' && state.isRefreshing,
      isLocating,
      geolocationError,
      selectLocation,
      locateMe,
      refresh,
    }),
    [hydrated, location, state, isLocating, geolocationError, selectLocation, locateMe, refresh],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used inside <LocationProvider>');
  return context;
}
