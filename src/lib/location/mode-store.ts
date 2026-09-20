import { readSavedMode, writeSavedMode, type DisplayMode } from '@/lib/location/storage';

/**
 * Display-mode preference in an external store, for the same reason as the location store:
 * `useSyncExternalStore` lets the server render Simple and the client apply the saved
 * preference on its first commit, with no effect and no mismatch.
 */
const listeners = new Set<() => void>();

let cached: DisplayMode | undefined;

export function subscribeToMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getModeSnapshot(): DisplayMode {
  if (cached === undefined) cached = readSavedMode() ?? 'simple';
  return cached;
}

/** Simple is the default, and it is what the server always renders. */
export function getModeServerSnapshot(): DisplayMode {
  return 'simple';
}

export function setStoredMode(mode: DisplayMode): void {
  cached = mode;
  writeSavedMode(mode);
  for (const listener of listeners) listener();
}
