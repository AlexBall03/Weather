import type { GeocodeErrorCode, GeocodeResult } from '@/types/location';

export interface ForwardOptions {
  limit?: number;
  /** True for as-you-type queries, where the text is a prefix rather than a finished place. */
  autocomplete?: boolean;
}

/**
 * Geocoding is deliberately kept behind this interface. Mapbox converts a typed place into
 * coordinates and does nothing else — no weather ever comes from it — so swapping the
 * provider later should not touch a single weather module.
 */
export interface GeocodingProvider {
  /** Provider id, surfaced in configuration errors. */
  readonly id: string;
  /** Attribution string the provider's terms require us to display. */
  readonly attribution: string;
  /** False when the required credentials are missing, so the UI can explain rather than fail. */
  isConfigured(): boolean;
  forward(query: string, options?: ForwardOptions): Promise<GeocodeResult[]>;
}

export class GeocodingError extends Error {
  readonly code: GeocodeErrorCode;

  constructor(code: GeocodeErrorCode, message: string) {
    super(message);
    this.name = 'GeocodingError';
    this.code = code;
  }
}
