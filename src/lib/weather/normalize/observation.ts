import type { NwsObservationProperties, NwsStationProperties } from '@/lib/nws/types';
import { classifyFreshness, observationAgeSeconds } from '@/lib/weather/freshness';
import { resolveIconCode, resolveIsDaytime } from '@/lib/weather/icon-code';
import {
  cardinalFromDegrees,
  toDegrees,
  toFahrenheit,
  toFeet,
  toMillibars,
  toMiles,
  toMph,
  toPercent,
} from '@/lib/weather/units';
import type { AstronomicalData, CloudLayer, CurrentConditions } from '@/types/weather';

function normalizeCloudLayers(properties: NwsObservationProperties): CloudLayer[] {
  return (properties.cloudLayers ?? [])
    .filter((layer) => Boolean(layer.amount))
    .map((layer) => ({ amount: layer.amount as string, baseFt: toFeet(layer.base) }));
}

export function normalizeObservation(
  properties: NwsObservationProperties,
  station: NwsStationProperties,
  sun: AstronomicalData | null,
  stationsSkipped: number,
  now: Date = new Date(),
): CurrentConditions {
  const observedAt = properties.timestamp ?? now.toISOString();
  const ageSeconds = observationAgeSeconds(observedAt, now);

  const heatIndexF = toFahrenheit(properties.heatIndex);
  const windChillF = toFahrenheit(properties.windChill);
  const windDirectionDegrees = toDegrees(properties.windDirection);

  return {
    station: {
      id: station.stationIdentifier ?? properties.stationId ?? '\u2014',
      name: station.name ?? 'Unnamed station',
      distanceMi: toMiles(station.distance),
      bearingDegrees: toDegrees(station.bearing),
      elevationFt: toFeet(station.elevation),
    },
    observedAt,
    ageSeconds,
    freshness: classifyFreshness(ageSeconds),
    textDescription: properties.textDescription?.trim() || null,
    iconCode: resolveIconCode(properties.icon, properties.textDescription),
    isDaytime: resolveIsDaytime(properties.icon, observedAt, sun),
    nwsIconUrl: properties.icon ?? null,
    temperatureF: toFahrenheit(properties.temperature),
    dewpointF: toFahrenheit(properties.dewpoint),
    relativeHumidity: toPercent(properties.relativeHumidity),
    windSpeedMph: toMph(properties.windSpeed),
    windGustMph: toMph(properties.windGust),
    windDirectionDegrees,
    windDirectionCardinal: cardinalFromDegrees(windDirectionDegrees),
    pressureMb: toMillibars(properties.barometricPressure),
    seaLevelPressureMb: toMillibars(properties.seaLevelPressure),
    visibilityMi: toMiles(properties.visibility),
    heatIndexF,
    windChillF,
    // "Feels like" is only shown when NWS actually computed one of these. We do not
    // synthesize an apparent temperature of our own.
    feelsLikeF: heatIndexF ?? windChillF,
    cloudLayers: normalizeCloudLayers(properties),
    stationsSkipped,
  };
}

/** A station that reports no temperature is effectively silent; try the next one instead. */
export function isUsableObservation(properties: NwsObservationProperties | undefined): boolean {
  return typeof properties?.temperature?.value === 'number';
}
