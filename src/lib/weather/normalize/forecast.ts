import type { NwsForecastPeriod, NwsForecastResponse } from '@/lib/nws/types';
import { dayKey } from '@/lib/weather/format';
import { resolveIconCode } from '@/lib/weather/icon-code';
import { toPercent } from '@/lib/weather/units';
import type { ForecastDay, ForecastPeriod, ForecastSection, SectionStatus } from '@/types/weather';

export function normalizePeriod(period: NwsForecastPeriod): ForecastPeriod {
  const shortForecast = period.shortForecast?.trim() ?? '';
  return {
    number: period.number ?? 0,
    name: period.name?.trim() || '',
    startTime: period.startTime ?? '',
    endTime: period.endTime ?? '',
    isDaytime: period.isDaytime ?? true,
    temperatureF: typeof period.temperature === 'number' ? period.temperature : null,
    temperatureTrend: period.temperatureTrend?.trim() || null,
    precipProbability: toPercent(period.probabilityOfPrecipitation),
    windSpeed: period.windSpeed?.trim() || null,
    windDirection: period.windDirection?.trim() || null,
    shortForecast,
    // Hourly periods carry an empty detailedForecast; treat that as absent.
    detailedForecast: period.detailedForecast?.trim() || null,
    iconCode: resolveIconCode(period.icon, shortForecast),
    nwsIconUrl: period.icon ?? null,
  };
}

function maxOrNull(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length > 0 ? Math.max(...present) : null;
}

/**
 * NWS emits alternating day/night periods, with a partial first period ("This Afternoon",
 * "Tonight"). Pairing them by calendar day in the location's own zone gives the high/low
 * a 7-day forecast actually needs, without assuming the list starts on a day period.
 */
export function groupIntoDays(periods: ForecastPeriod[], timeZone: string): ForecastDay[] {
  const order: string[] = [];
  const byKey = new Map<string, ForecastDay>();

  for (const period of periods) {
    // A night period spans midnight; it belongs to the day it started on.
    const key = dayKey(period.startTime, timeZone);
    let day = byKey.get(key);
    if (!day) {
      day = {
        key,
        label: period.name || key,
        day: null,
        night: null,
        highF: null,
        lowF: null,
        precipProbability: null,
      };
      byKey.set(key, day);
      order.push(key);
    }

    if (period.isDaytime) {
      day.day ??= period;
      day.label = period.name || day.label;
      day.highF = period.temperatureF;
    } else {
      day.night ??= period;
      day.lowF = period.temperatureF;
      // A day that begins at night ("Tonight") takes its label from the night period.
      if (!day.day) day.label = period.name || day.label;
    }

    day.precipProbability = maxOrNull([day.precipProbability, period.precipProbability]);
  }

  return order.map((key) => byKey.get(key) as ForecastDay);
}

export function normalizeForecast(
  response: NwsForecastResponse | null,
  timeZone: string,
  status: SectionStatus,
): ForecastSection {
  const periods = (response?.properties?.periods ?? []).map(normalizePeriod);
  return {
    status,
    periods,
    days: groupIntoDays(periods, timeZone),
    updatedAt: response?.properties?.updated ?? response?.properties?.updateTime ?? null,
  };
}
