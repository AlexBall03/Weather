import type { NwsGridResponse, NwsGridSeries } from '@/lib/nws/types';
import { toInches, toMph } from '@/lib/weather/units';
import type { GridSummary, SectionStatus } from '@/types/weather';

/**
 * Gridded forecast series are sparse intervals, not hourly rows: each entry is
 * `{ validTime: "<ISO start>/<ISO 8601 duration>", value }` covering everything from one
 * hour to several days. To join them onto the hourly forecast we expand each interval into
 * the hours it covers, keyed by epoch hour.
 */

const MS_PER_HOUR = 3_600_000;
/** Eight days of hourly buckets — beyond the hourly forecast's own horizon. */
const MAX_EXPANDED_HOURS = 8 * 24;

const DURATION_PATTERN = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

export function parseIsoDurationMs(duration: string): number {
  const match = DURATION_PATTERN.exec(duration);
  if (!match) return 0;
  const [, days, hours, minutes, seconds] = match;
  return (
    (Number(days ?? 0) * 24 + Number(hours ?? 0)) * MS_PER_HOUR +
    Number(minutes ?? 0) * 60_000 +
    Number(seconds ?? 0) * 1000
  );
}

export type HourlySeriesIndex = Map<number, number>;

export function epochHour(iso: string): number | null {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : Math.floor(time / MS_PER_HOUR);
}

/** Expands one gridded series into an epoch-hour -> value lookup. */
export function indexSeries(series: NwsGridSeries | undefined): HourlySeriesIndex {
  const index: HourlySeriesIndex = new Map();
  for (const entry of series?.values ?? []) {
    if (typeof entry.value !== 'number' || !entry.validTime) continue;
    const [startIso, duration] = entry.validTime.split('/');
    const startHour = epochHour(startIso);
    if (startHour === null) continue;

    const spanHours = Math.max(1, Math.round(parseIsoDurationMs(duration ?? 'PT1H') / MS_PER_HOUR));
    for (let offset = 0; offset < Math.min(spanHours, MAX_EXPANDED_HOURS); offset += 1) {
      index.set(startHour + offset, entry.value);
    }
  }
  return index;
}

export function sampleSeries(index: HourlySeriesIndex, iso: string): number | null {
  const hour = epochHour(iso);
  if (hour === null) return null;
  return index.get(hour) ?? null;
}

export interface GridIndexes {
  skyCover: HourlySeriesIndex;
  /** Stored in km/h upstream; converted at read time via `gridWindGustMph`. */
  windGust: HourlySeriesIndex;
  thunder: HourlySeriesIndex;
  gustUnit: string | undefined;
}

export function buildGridIndexes(response: NwsGridResponse | null): GridIndexes {
  const properties = response?.properties;
  return {
    skyCover: indexSeries(properties?.skyCover),
    windGust: indexSeries(properties?.windGust),
    thunder: indexSeries(properties?.probabilityOfThunder),
    gustUnit: properties?.windGust?.uom,
  };
}

export function gridWindGustMph(indexes: GridIndexes, iso: string): number | null {
  const value = sampleSeries(indexes.windGust, iso);
  if (value === null) return null;
  return toMph({ unitCode: indexes.gustUnit ?? 'wmoUnit:km_h-1', value });
}

function maxOf(series: NwsGridSeries | undefined): number | null {
  const values = (series?.values ?? [])
    .map((entry) => entry.value)
    .filter((value): value is number => typeof value === 'number');
  return values.length > 0 ? Math.max(...values) : null;
}

function sumOf(series: NwsGridSeries | undefined): number | null {
  const values = (series?.values ?? [])
    .map((entry) => entry.value)
    .filter((value): value is number => typeof value === 'number');
  return values.length > 0 ? values.reduce((total, value) => total + value, 0) : null;
}

export function normalizeGridSummary(
  response: NwsGridResponse | null,
  status: SectionStatus,
): GridSummary {
  const properties = response?.properties;
  const gustMax = maxOf(properties?.windGust);
  const precipTotal = sumOf(properties?.quantitativePrecipitation);

  return {
    status,
    updatedAt: properties?.updateTime ?? null,
    maxWindGustMph:
      gustMax === null
        ? null
        : toMph({ unitCode: properties?.windGust?.uom ?? 'wmoUnit:km_h-1', value: gustMax }),
    maxThunderProbability: maxOf(properties?.probabilityOfThunder),
    totalPrecipIn:
      precipTotal === null
        ? null
        : toInches({
            unitCode: properties?.quantitativePrecipitation?.uom ?? 'wmoUnit:mm',
            value: precipTotal,
          }),
    maxSkyCoverPercent: maxOf(properties?.skyCover),
  };
}
