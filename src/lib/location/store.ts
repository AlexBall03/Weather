import { readSavedLocation, writeSavedLocation } from '@/lib/location/storage';
import type { SavedLocation } from '@/types/location';

/**
 * The selected location, held in a tiny external store so components can read it through
 * `useSyncExternalStore`. That keeps the localStorage read out of render and out of an
 * effect: the server renders `restoring`, the client swaps to the real value on its first
 * commit, and there is no hydration mismatch and no cascading setState.
 */
export type LocationState = SavedLocation | null | 'restoring';

const listeners = new Set<() => void>();

// `undefined` means "not read yet". The parsed object is cached so getSnapshot stays
// referentially stable, which useSyncExternalStore requires.
let cached: SavedLocation | null | undefined;

/** Frozen so the server snapshot is a stable reference across renders. */
const RESTORING: LocationState = 'restoring';

export function subscribeToLocation(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocationSnapshot(): LocationState {
  if (cached === undefined) cached = readSavedLocation();
  return cached;
}

export function getLocationServerSnapshot(): LocationState {
  return RESTORING;
}

export function setStoredLocation(location: SavedLocation): void {
  cached = location;
  writeSavedLocation(location);
  for (const listener of listeners) listener();
}
