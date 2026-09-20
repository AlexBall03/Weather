import type { SavedLocation } from '@/types/location';

/**
 * A short set of well-known points so the app is usable on first run and with no Mapbox
 * token configured. These are fixed coordinates, not weather data, and the labels NWS
 * returns for them still override these once a snapshot loads.
 */
export const QUICK_LOCATIONS: ReadonlyArray<SavedLocation & { code: string }> = [
  { code: 'PHX', label: 'Phoenix, AZ', coordinates: { latitude: 33.4484, longitude: -112.074 } },
  { code: 'DEN', label: 'Denver, CO', coordinates: { latitude: 39.7392, longitude: -104.9903 } },
  { code: 'ORD', label: 'Chicago, IL', coordinates: { latitude: 41.8781, longitude: -87.6298 } },
  { code: 'MIA', label: 'Miami, FL', coordinates: { latitude: 25.7617, longitude: -80.1918 } },
  { code: 'SEA', label: 'Seattle, WA', coordinates: { latitude: 47.6062, longitude: -122.3321 } },
  { code: 'NYC', label: 'New York, NY', coordinates: { latitude: 40.7128, longitude: -74.006 } },
];
