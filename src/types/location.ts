/** Geographic point. Always decimal degrees, WGS84 — the only coordinate form the app passes around. */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** A location the user has chosen, as persisted and as displayed. */
export interface SavedLocation {
  label: string;
  coordinates: Coordinates;
}

export interface GeocodeResult {
  /** Stable id from the provider, used as a React key. */
  id: string;
  /** Short display name, e.g. "Phoenix". */
  name: string;
  /** Full display label, e.g. "Phoenix, Arizona, United States". */
  label: string;
  /** Provider's feature classification, e.g. "place", "address", "postcode". */
  featureType: string | null;
  coordinates: Coordinates;
}

export type GeocodeErrorCode =
  | 'GEOCODER_NOT_CONFIGURED'
  | 'EMPTY_QUERY'
  | 'GEOCODER_UNAVAILABLE'
  | 'GEOCODER_REJECTED';

export interface GeocodeResponse {
  results: GeocodeResult[];
  /** Attribution string the provider's terms require us to surface. */
  attribution: string;
}
