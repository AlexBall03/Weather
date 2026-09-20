import { mapboxGeocoder } from '@/lib/geocoding/mapbox';
import type { GeocodingProvider } from '@/lib/geocoding/provider';

/**
 * Single seam for the geocoding provider. Replacing Mapbox means changing this one line.
 */
export function getGeocodingProvider(): GeocodingProvider {
  return mapboxGeocoder;
}

export { GeocodingError } from '@/lib/geocoding/provider';
export type { GeocodingProvider } from '@/lib/geocoding/provider';
