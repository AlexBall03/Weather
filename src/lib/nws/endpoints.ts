import 'server-only';

import { NWS_REVALIDATE, nwsFetch } from '@/lib/nws/client';
import type {
  NwsAlertsResponse,
  NwsForecastResponse,
  NwsGridResponse,
  NwsObservationResponse,
  NwsOfficeResponse,
  NwsPointProperties,
  NwsPointResponse,
  NwsStationProperties,
  NwsStationsResponse,
} from '@/lib/nws/types';

/**
 * NWS rounds coordinates to four decimals internally; sending more just fragments the
 * cache and asks the service to normalize on every request.
 */
export function roundCoordinate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Weather discovery always starts here. Everything else in the app is reached through the
 * URLs this response hands back, rather than by reconstructing endpoint paths ourselves.
 */
export async function getPoint(latitude: number, longitude: number): Promise<NwsPointProperties> {
  const path = `/points/${roundCoordinate(latitude)},${roundCoordinate(longitude)}`;
  const response = await nwsFetch<NwsPointResponse>(path, {
    revalidate: NWS_REVALIDATE.point,
  });
  return response.properties ?? {};
}

export async function getOffice(url: string): Promise<NwsOfficeResponse> {
  return nwsFetch<NwsOfficeResponse>(url, {
    revalidate: NWS_REVALIDATE.office,
    accept: 'application/ld+json',
  });
}

export async function getForecast(url: string): Promise<NwsForecastResponse> {
  return nwsFetch<NwsForecastResponse>(url, { revalidate: NWS_REVALIDATE.forecast });
}

export async function getHourlyForecast(url: string): Promise<NwsForecastResponse> {
  return nwsFetch<NwsForecastResponse>(url, { revalidate: NWS_REVALIDATE.hourly });
}

export async function getGridData(url: string): Promise<NwsGridResponse> {
  return nwsFetch<NwsGridResponse>(url, { revalidate: NWS_REVALIDATE.grid });
}

export async function getObservationStations(url: string): Promise<NwsStationProperties[]> {
  const response = await nwsFetch<NwsStationsResponse>(url, {
    revalidate: NWS_REVALIDATE.stations,
  });
  return (response.features ?? [])
    .map((feature) => feature.properties)
    .filter((properties): properties is NwsStationProperties => Boolean(properties?.stationIdentifier));
}

export async function getLatestObservation(stationId: string): Promise<NwsObservationResponse> {
  return nwsFetch<NwsObservationResponse>(`/stations/${stationId}/observations/latest`, {
    revalidate: NWS_REVALIDATE.observation,
  });
}

export async function getActiveAlerts(
  latitude: number,
  longitude: number,
): Promise<NwsAlertsResponse> {
  const point = `${roundCoordinate(latitude)},${roundCoordinate(longitude)}`;
  return nwsFetch<NwsAlertsResponse>(`/alerts/active?point=${point}`, {
    revalidate: NWS_REVALIDATE.alerts,
  });
}
