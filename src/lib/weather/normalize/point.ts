import type { NwsPointProperties } from '@/lib/nws/types';
import { toDegrees, toMiles } from '@/lib/weather/units';
import type { AstronomicalData, NwsPointMeta, ResolvedLocation } from '@/types/weather';
import type { Coordinates } from '@/types/location';

/** Trailing path segment of an NWS resource URL, e.g. ".../zones/forecast/AZZ543" -> "AZZ543". */
function zoneId(url: string | undefined): string | null {
  if (!url) return null;
  const id = url.split('/').filter(Boolean).pop();
  return id ?? null;
}

/**
 * NWS gives a readable place through `relativeLocation` — the nearest named city and how
 * far the requested point is from it. That beats echoing raw coordinates back at the user,
 * so it wins over the geocoder's label when available.
 */
export function resolveLocation(
  point: NwsPointProperties,
  coordinates: Coordinates,
  fallbackLabel: string | null,
): ResolvedLocation {
  const relative = point.relativeLocation?.properties;
  const city = relative?.city?.trim();
  const state = relative?.state?.trim();
  const nwsLabel = city && state ? `${city}, ${state}` : city ?? null;

  return {
    label:
      nwsLabel ??
      fallbackLabel ??
      `${coordinates.latitude.toFixed(3)}, ${coordinates.longitude.toFixed(3)}`,
    coordinates,
    timeZone: point.timeZone ?? 'UTC',
    relativeDistanceMi: toMiles(relative?.distance),
    relativeBearingDegrees: toDegrees(relative?.bearing),
  };
}

export function normalizePointMeta(
  point: NwsPointProperties,
  officeName: string | null,
): NwsPointMeta {
  return {
    office: point.gridId ?? point.cwa ?? '\u2014',
    officeName,
    gridX: point.gridX ?? 0,
    gridY: point.gridY ?? 0,
    forecastZone: zoneId(point.forecastZone),
    countyZone: zoneId(point.county),
    fireWeatherZone: zoneId(point.fireWeatherZone),
    radarStation: point.radarStation ?? null,
  };
}

export function normalizeAstronomicalData(point: NwsPointProperties): AstronomicalData | null {
  const astro = point.astronomicalData;
  if (!astro) return null;
  const data: AstronomicalData = {
    sunrise: astro.sunrise ?? null,
    sunset: astro.sunset ?? null,
    civilTwilightBegin: astro.civilTwilightBegin ?? null,
    civilTwilightEnd: astro.civilTwilightEnd ?? null,
  };
  return data.sunrise || data.sunset ? data : null;
}
