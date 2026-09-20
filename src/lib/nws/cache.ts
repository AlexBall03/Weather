/**
 * Revalidation windows for every NWS resource, in seconds.
 *
 * api.weather.gov is a free public service, so these are deliberately tuned against the
 * `Cache-Control` headers the service itself sends rather than set to an arbitrary "fresh"
 * value. Observed upstream on 2026-09-19:
 *
 *   /points/{lat},{lon}                  s-maxage=120     (max-age ~29793)
 *   /gridpoints/{wfo}/{x},{y}/forecast   s-maxage=3600
 *   /gridpoints/{wfo}/{x},{y}/stations   (station geometry is effectively static)
 *   /stations/{id}/observations/latest   s-maxage=300
 *   /alerts/active?point=...             s-maxage=5
 */
export const NWS_REVALIDATE = {
  /**
   * The lat/lon to grid mapping never changes. The one-hour window exists only so the
   * `astronomicalData` block (sunrise/sunset) rolls over to the current day.
   */
  point: 3600,
  /** Office metadata (name, address) changes on the order of never. */
  office: 86400,
  /** NWS issues the zone forecast a few times a day plus amendments. */
  forecast: 900,
  hourly: 900,
  grid: 900,
  /** Station lists are stable; the stations themselves do not move. */
  stations: 86400,
  /** METARs are hourly with specials in between; matches upstream s-maxage. */
  observation: 300,
  /**
   * Upstream allows 5s. A dashboard does not need second-level alert latency, and one
   * request per minute per location is a responsible load on a public service.
   */
  alerts: 60,
} as const;

/** `Cache-Control` for our own aggregated response, governed by its shortest input (alerts). */
export const AGGREGATE_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';
