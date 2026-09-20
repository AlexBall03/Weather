/**
 * Mapbox requires attribution wherever geocoding results are used. Kept in its own module
 * so the footer can display it without pulling the server-only geocoding client into the
 * browser bundle.
 */
export const GEOCODER_ATTRIBUTION = '\u00A9 Mapbox \u00B7 \u00A9 OpenStreetMap';
