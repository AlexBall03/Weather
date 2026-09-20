import type { Coordinates } from '@/types/location';

export type GeolocationFailureCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeolocationFailure extends Error {
  readonly code: GeolocationFailureCode;

  constructor(code: GeolocationFailureCode, message: string) {
    super(message);
    this.name = 'GeolocationFailure';
    this.code = code;
  }
}

export const GEOLOCATION_MESSAGES: Record<GeolocationFailureCode, string> = {
  unsupported: 'This browser does not support location services. Search for a place instead.',
  denied:
    'Location access was blocked. Allow it in your browser settings, or search for a place instead.',
  unavailable: 'Your device could not determine a position. Search for a place instead.',
  timeout: 'Locating timed out. Try again, or search for a place instead.',
};

const OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 12_000,
  // A position from the last five minutes is plenty precise for a forecast grid.
  maximumAge: 300_000,
};

/**
 * Wraps the callback-based Geolocation API in a promise with typed failures. Nothing here
 * runs until the user presses Use My Location — the app never prompts on load.
 */
export function requestCurrentPosition(): Promise<Coordinates> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.reject(
      new GeolocationFailure('unsupported', GEOLOCATION_MESSAGES.unsupported),
    );
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => {
        const code: GeolocationFailureCode =
          error.code === error.PERMISSION_DENIED
            ? 'denied'
            : error.code === error.TIMEOUT
              ? 'timeout'
              : 'unavailable';
        reject(new GeolocationFailure(code, GEOLOCATION_MESSAGES[code]));
      },
      OPTIONS,
    );
  });
}
