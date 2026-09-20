import 'server-only';

import { GEOCODER_ATTRIBUTION } from '@/lib/geocoding/attribution';
import { GeocodingError, type GeocodingProvider } from '@/lib/geocoding/provider';
import type { GeocodeResult } from '@/types/location';

const FORWARD_ENDPOINT = 'https://api.mapbox.com/search/geocode/v6/forward';
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * NWS forecasts cover the United States and its territories, so results are restricted to
 * those countries. A search that cannot produce a forecastable point is not a useful result.
 */
const COVERED_COUNTRIES = 'us,pr,vi,gu,mp,as';

interface MapboxContextEntry {
  name?: string;
  region_code?: string;
  country_code?: string;
}

interface MapboxFeature {
  properties?: {
    mapbox_id?: string;
    feature_type?: string;
    name?: string;
    name_preferred?: string;
    place_formatted?: string;
    full_address?: string;
    coordinates?: { longitude?: number; latitude?: number };
    context?: Record<string, MapboxContextEntry | undefined>;
  };
  geometry?: { coordinates?: [number, number] };
}

interface MapboxForwardResponse {
  features?: MapboxFeature[];
}

function accessToken(): string | null {
  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

/** Prefers Mapbox's own formatted address, falling back to assembling name + context. */
function buildLabel(feature: MapboxFeature): string | null {
  const properties = feature.properties;
  const name = properties?.name_preferred?.trim() || properties?.name?.trim();
  if (!name) return null;

  const formatted = properties?.full_address?.trim() || properties?.place_formatted?.trim();
  if (formatted) {
    return formatted.startsWith(name) ? formatted : `${name}, ${formatted}`;
  }

  const context = properties?.context ?? {};
  const region = context.region?.region_code ?? context.region?.name;
  const parts = [name, region].filter(Boolean);
  return parts.join(', ');
}

function normalizeFeature(feature: MapboxFeature, index: number): GeocodeResult | null {
  const properties = feature.properties;
  const longitude = properties?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const latitude = properties?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;

  const label = buildLabel(feature);
  if (!label) return null;

  return {
    id: properties?.mapbox_id ?? `${latitude},${longitude}-${index}`,
    name: properties?.name_preferred?.trim() || properties?.name?.trim() || label,
    label,
    featureType: properties?.feature_type ?? null,
    coordinates: { latitude, longitude },
  };
}

export const mapboxGeocoder: GeocodingProvider = {
  id: 'mapbox',
  attribution: GEOCODER_ATTRIBUTION,

  isConfigured() {
    return accessToken() !== null;
  },

  async forward(query, options) {
    const token = accessToken();
    if (!token) {
      throw new GeocodingError(
        'GEOCODER_NOT_CONFIGURED',
        'MAPBOX_ACCESS_TOKEN is not set on the server.',
      );
    }

    const url = new URL(FORWARD_ENDPOINT);
    url.searchParams.set('q', query);
    url.searchParams.set('access_token', token);
    url.searchParams.set('limit', String(options?.limit ?? 5));
    url.searchParams.set('country', COVERED_COUNTRIES);
    url.searchParams.set('language', 'en');
    // Submit-based search, so we want settled results rather than prefix guesses.
    url.searchParams.set('autocomplete', 'false');

    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch {
      throw new GeocodingError('GEOCODER_UNAVAILABLE', 'Could not reach the geocoding service.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new GeocodingError(
        'GEOCODER_REJECTED',
        'Mapbox rejected the access token. Check MAPBOX_ACCESS_TOKEN.',
      );
    }
    if (!response.ok) {
      throw new GeocodingError(
        'GEOCODER_UNAVAILABLE',
        `Geocoding service responded ${response.status}.`,
      );
    }

    let body: MapboxForwardResponse;
    try {
      body = (await response.json()) as MapboxForwardResponse;
    } catch {
      throw new GeocodingError('GEOCODER_UNAVAILABLE', 'Geocoding response could not be parsed.');
    }

    return (body.features ?? [])
      .map(normalizeFeature)
      .filter((result): result is GeocodeResult => result !== null);
  },
};
