import type { NwsForecastResponse } from '@/lib/nws/types';
import { gridWindGustMph, sampleSeries, type GridIndexes } from '@/lib/weather/normalize/grid';
import { resolveIconCode } from '@/lib/weather/icon-code';
import { parseWindSpeedLabel, toFahrenheit, toPercent } from '@/lib/weather/units';
import type { HourlyPeriod, HourlySection, SectionStatus } from '@/types/weather';

/** Hours shown in the forecast track. NWS returns ~156; a dashboard wants the next day. */
const HOURLY_WINDOW = 24;

export function normalizeHourly(
  response: NwsForecastResponse | null,
  grid: GridIndexes | null,
  status: SectionStatus,
  now: Date = new Date(),
): HourlySection {
  const cutoff = now.getTime() - 60 * 60 * 1000; // keep the in-progress hour

  const periods: HourlyPeriod[] = (response?.properties?.periods ?? [])
    .filter((period) => {
      const start = new Date(period.startTime ?? '').getTime();
      return !Number.isNaN(start) && start >= cutoff;
    })
    .slice(0, HOURLY_WINDOW)
    .map((period) => {
      const startTime = period.startTime as string;
      const shortForecast = period.shortForecast?.trim() ?? '';
      return {
        startTime,
        isDaytime: period.isDaytime ?? true,
        temperatureF: typeof period.temperature === 'number' ? period.temperature : null,
        dewpointF: toFahrenheit(period.dewpoint),
        relativeHumidity: toPercent(period.relativeHumidity),
        precipProbability: toPercent(period.probabilityOfPrecipitation),
        windSpeedMph: parseWindSpeedLabel(period.windSpeed),
        windSpeedLabel: period.windSpeed?.trim() || null,
        windDirection: period.windDirection?.trim() || null,
        shortForecast,
        iconCode: resolveIconCode(period.icon, shortForecast),
        // Gusts and sky cover are not in the hourly product; they come from the grid.
        skyCoverPercent: grid ? sampleSeries(grid.skyCover, startTime) : null,
        windGustMph: grid ? gridWindGustMph(grid, startTime) : null,
        thunderProbability: grid ? sampleSeries(grid.thunder, startTime) : null,
      };
    });

  return {
    status,
    periods,
    updatedAt: response?.properties?.updated ?? response?.properties?.updateTime ?? null,
  };
}
