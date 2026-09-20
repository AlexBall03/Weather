import type { NwsQuantity } from '@/lib/nws/types';

/**
 * Unit conversion for NWS quantities. Observations come back in SI with a WMO `unitCode`,
 * while forecast periods come back in US customary — so every converter reads the unit code
 * rather than assuming one. All of them are null-in / null-out: a missing measurement stays
 * missing and is never coerced to zero.
 */

function unit(quantity: NwsQuantity | null | undefined): string {
  return (quantity?.unitCode ?? '').replace('wmoUnit:', '').replace('unit:', '');
}

function raw(quantity: NwsQuantity | null | undefined): number | null {
  const value = quantity?.value;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function round(value: number | null, places = 0): number | null {
  if (value === null) return null;
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function toFahrenheit(quantity: NwsQuantity | null | undefined): number | null {
  const value = raw(quantity);
  if (value === null) return null;
  switch (unit(quantity)) {
    case 'degF':
      return round(value);
    case 'K':
      return round((value - 273.15) * 1.8 + 32);
    case 'degC':
    default:
      return round(value * 1.8 + 32);
  }
}

export function toMph(quantity: NwsQuantity | null | undefined): number | null {
  const value = raw(quantity);
  if (value === null) return null;
  switch (unit(quantity)) {
    case 'mi_h-1':
      return round(value);
    case 'm_s-1':
      return round(value * 2.236_936);
    case 'km_h-1':
    default:
      return round(value * 0.621_371);
  }
}

export function toMillibars(quantity: NwsQuantity | null | undefined): number | null {
  const value = raw(quantity);
  if (value === null) return null;
  switch (unit(quantity)) {
    case 'hPa':
      return round(value, 1);
    case 'Pa':
    default:
      return round(value / 100, 1);
  }
}

export function toMiles(quantity: NwsQuantity | null | undefined): number | null {
  const value = raw(quantity);
  if (value === null) return null;
  switch (unit(quantity)) {
    case 'mi':
      return round(value, 1);
    case 'km':
      return round(value * 0.621_371, 1);
    case 'm':
    default:
      return round(value * 0.000_621_371, 1);
  }
}

export function toFeet(quantity: NwsQuantity | null | undefined): number | null {
  const value = raw(quantity);
  if (value === null) return null;
  if (unit(quantity) === 'ft') return round(value);
  return round(value * 3.280_84);
}

export function toInches(quantity: NwsQuantity | null | undefined): number | null {
  const value = raw(quantity);
  if (value === null) return null;
  switch (unit(quantity)) {
    case 'in':
      return round(value, 2);
    case 'm':
      return round(value * 39.370_1, 2);
    case 'mm':
    default:
      return round(value * 0.039_370_1, 2);
  }
}

export function toPercent(quantity: NwsQuantity | null | undefined): number | null {
  return round(raw(quantity));
}

export function toDegrees(quantity: NwsQuantity | null | undefined): number | null {
  return round(raw(quantity));
}

const CARDINALS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
] as const;

/** 274° -> "W". 16-point compass, matching how NWS labels forecast wind direction. */
export function cardinalFromDegrees(degrees: number | null): string | null {
  if (degrees === null) return null;
  const index = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return CARDINALS[index];
}

/**
 * NWS forecast periods report wind as free text: "5 mph", "0 to 5 mph", "10 to 15 mph".
 * We keep the label for display and take the upper bound as the sortable number.
 */
export function parseWindSpeedLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const matches = label.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  return Math.max(...matches.map(Number));
}
