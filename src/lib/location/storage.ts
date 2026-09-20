import type { SavedLocation } from '@/types/location';

const LOCATION_KEY = 'wx.location.v1';
const MODE_KEY = 'wx.mode.v1';

/**
 * Saved coordinates are rounded to three decimals (~110 m) before they touch localStorage.
 * That is far finer than any forecast grid needs and coarse enough that we are not keeping
 * a precise record of where someone stood.
 */
const STORED_PRECISION = 3;

function roundForStorage(value: number): number {
  const factor = 10 ** STORED_PRECISION;
  return Math.round(value * factor) / factor;
}

function isSavedLocation(value: unknown): value is SavedLocation {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as SavedLocation;
  return (
    typeof candidate.label === 'string' &&
    typeof candidate.coordinates?.latitude === 'number' &&
    typeof candidate.coordinates?.longitude === 'number'
  );
}

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSavedLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSavedLocation(location: SavedLocation): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      LOCATION_KEY,
      JSON.stringify({
        label: location.label,
        coordinates: {
          latitude: roundForStorage(location.coordinates.latitude),
          longitude: roundForStorage(location.coordinates.longitude),
        },
      } satisfies SavedLocation),
    );
  } catch {
    // Private browsing or a full quota. Losing the saved location is not worth an error.
  }
}

export function clearSavedLocation(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LOCATION_KEY);
  } catch {
    // Ignored for the same reason as above.
  }
}

export type DisplayMode = 'simple' | 'advanced';

export function readSavedMode(): DisplayMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MODE_KEY);
    return raw === 'simple' || raw === 'advanced' ? raw : null;
  } catch {
    return null;
  }
}

export function writeSavedMode(mode: DisplayMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Ignored.
  }
}
