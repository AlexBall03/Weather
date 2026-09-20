import 'server-only';

import {
  getActiveAlerts,
  getForecast,
  getGridData,
  getHourlyForecast,
  getLatestObservation,
  getObservationStations,
  getOffice,
  getPoint,
} from '@/lib/nws/endpoints';
import type {
  NwsAlertsResponse,
  NwsForecastResponse,
  NwsGridResponse,
  NwsStationProperties,
} from '@/lib/nws/types';
import { normalizeAlerts } from '@/lib/weather/normalize/alerts';
import { normalizeForecast } from '@/lib/weather/normalize/forecast';
import { buildGridIndexes, normalizeGridSummary } from '@/lib/weather/normalize/grid';
import { normalizeHourly } from '@/lib/weather/normalize/hourly';
import { isUsableObservation, normalizeObservation } from '@/lib/weather/normalize/observation';
import {
  normalizeAstronomicalData,
  normalizePointMeta,
  resolveLocation,
} from '@/lib/weather/normalize/point';
import type { AstronomicalData, CurrentConditions, WeatherSnapshot } from '@/types/weather';

/** How many of the nearest stations we will try before giving up on an observation. */
const MAX_STATION_ATTEMPTS = 3;

export interface SnapshotRequest {
  latitude: number;
  longitude: number;
  /** Label from the geocoder, used only if NWS has no relative location for the point. */
  label?: string | null;
}

function settledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

/**
 * Walks the nearest stations in order until one returns a usable observation. Stations do
 * go quiet — an ASOS outage should downgrade to the next site, not blank the panel.
 */
async function fetchNearestObservation(
  stationsUrl: string | undefined,
  sun: AstronomicalData | null,
): Promise<CurrentConditions | null> {
  if (!stationsUrl) return null;

  let stations: NwsStationProperties[];
  try {
    stations = await getObservationStations(stationsUrl);
  } catch {
    return null;
  }

  for (const [index, station] of stations.slice(0, MAX_STATION_ATTEMPTS).entries()) {
    const id = station.stationIdentifier;
    if (!id) continue;
    try {
      const observation = await getLatestObservation(id);
      if (!isUsableObservation(observation.properties)) continue;
      return normalizeObservation(observation.properties ?? {}, station, sun, index);
    } catch {
      // Try the next station rather than failing the whole snapshot.
    }
  }

  return null;
}

/**
 * The single orchestration point for NWS. Discovery starts at /points, then every
 * independent resource is fetched concurrently and settled individually so one dead
 * endpoint degrades one panel instead of the whole dashboard.
 */
export async function buildWeatherSnapshot(request: SnapshotRequest): Promise<WeatherSnapshot> {
  const { latitude, longitude, label } = request;

  // Everything downstream is addressed by URLs from this response, so it must succeed.
  const point = await getPoint(latitude, longitude);
  const sun = normalizeAstronomicalData(point);
  const location = resolveLocation(point, { latitude, longitude }, label ?? null);

  const [officeResult, forecastResult, hourlyResult, gridResult, observationResult, alertsResult] =
    await Promise.allSettled([
      point.forecastOffice ? getOffice(point.forecastOffice) : Promise.resolve(null),
      point.forecast ? getForecast(point.forecast) : Promise.reject(new Error('no forecast url')),
      point.forecastHourly
        ? getHourlyForecast(point.forecastHourly)
        : Promise.reject(new Error('no hourly url')),
      point.forecastGridData
        ? getGridData(point.forecastGridData)
        : Promise.reject(new Error('no grid url')),
      fetchNearestObservation(point.observationStations, sun),
      getActiveAlerts(latitude, longitude),
    ]);

  const forecastResponse = settledValue<NwsForecastResponse>(forecastResult);
  const hourlyResponse = settledValue<NwsForecastResponse>(hourlyResult);
  const gridResponse = settledValue<NwsGridResponse>(gridResult);
  const alertsResponse = settledValue<NwsAlertsResponse>(alertsResult);
  const current = settledValue<CurrentConditions | null>(observationResult);

  const gridIndexes = gridResponse ? buildGridIndexes(gridResponse) : null;

  return {
    location,
    meta: normalizePointMeta(point, settledValue(officeResult)?.name ?? null),
    current,
    currentStatus: current ? 'ok' : 'unavailable',
    forecast: normalizeForecast(forecastResponse, location.timeZone, forecastResponse ? 'ok' : 'unavailable'),
    hourly: normalizeHourly(hourlyResponse, gridIndexes, hourlyResponse ? 'ok' : 'unavailable'),
    alerts: normalizeAlerts(alertsResponse, alertsResponse ? 'ok' : 'unavailable'),
    grid: normalizeGridSummary(gridResponse, gridResponse ? 'ok' : 'unavailable'),
    sun,
    generatedAt: new Date().toISOString(),
  };
}
