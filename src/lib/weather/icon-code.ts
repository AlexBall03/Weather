import type { WeatherIconCode } from '@/types/weather';

/**
 * NWS icon URLs look like
 *   https://api.weather.gov/icons/land/day/tsra_sct,40?size=medium
 * and can carry two conditions for a split period
 *   https://api.weather.gov/icons/land/day/rain,30/tsra_hi,60?size=medium
 *
 * We parse the token out and map it onto our own icon set rather than rendering the
 * service's raster artwork, so the glyphs inherit `currentColor` and stay crisp.
 */

const TOKEN_TO_CODE: Record<string, WeatherIconCode> = {
  skc: 'clear',
  few: 'few',
  sct: 'scattered',
  bkn: 'broken',
  ovc: 'overcast',
  wind_skc: 'wind',
  wind_few: 'wind',
  wind_sct: 'wind',
  wind_bkn: 'wind',
  wind_ovc: 'wind',
  rain: 'rain',
  rain_showers: 'showers',
  rain_showers_hi: 'showers',
  tsra: 'thunderstorm',
  tsra_sct: 'thunderstorm',
  tsra_hi: 'thunderstorm',
  tornado: 'thunderstorm',
  hurricane: 'thunderstorm',
  tropical_storm: 'thunderstorm',
  snow: 'snow',
  blizzard: 'snow',
  rain_snow: 'sleet',
  snow_sleet: 'sleet',
  rain_sleet: 'sleet',
  sleet: 'sleet',
  fzra: 'freezing-rain',
  rain_fzra: 'freezing-rain',
  snow_fzra: 'freezing-rain',
  fog: 'fog',
  haze: 'haze',
  dust: 'dust',
  smoke: 'smoke',
  hot: 'hot',
  cold: 'cold',
};

/** Ordered so that the more specific phrase wins — "freezing rain" before "rain". */
const PHRASE_TO_CODE: Array<[RegExp, WeatherIconCode]> = [
  [/freezing (rain|drizzle)/i, 'freezing-rain'],
  [/sleet|wintry mix|rain and snow/i, 'sleet'],
  [/thunder|t-?storm/i, 'thunderstorm'],
  [/snow|flurr|blizzard/i, 'snow'],
  [/shower/i, 'showers'],
  [/rain|drizzle/i, 'rain'],
  [/fog|mist/i, 'fog'],
  [/haze/i, 'haze'],
  [/dust|sand/i, 'dust'],
  [/smoke/i, 'smoke'],
  [/wind|breezy|blustery/i, 'wind'],
  [/overcast/i, 'overcast'],
  [/(mostly|considerable) cloud|broken/i, 'broken'],
  [/partly (cloudy|sunny)|scattered/i, 'scattered'],
  [/(mostly|mainly) (clear|sunny)|few clouds/i, 'few'],
  [/clear|sunny|fair/i, 'clear'],
];

interface ParsedIcon {
  code: WeatherIconCode;
  isDaytime: boolean | null;
}

/** Pulls the condition token and the day/night segment out of an NWS icon URL. */
export function parseNwsIcon(iconUrl: string | null | undefined): ParsedIcon {
  if (!iconUrl) return { code: 'unknown', isDaytime: null };

  const path = iconUrl.split('?')[0];
  const segments = path.split('/').filter(Boolean);
  const dayIndex = segments.findIndex((segment) => segment === 'day' || segment === 'night');
  const isDaytime = dayIndex === -1 ? null : segments[dayIndex] === 'day';

  // Conditions follow the day/night segment; the first is the dominant one.
  const conditionSegments = dayIndex === -1 ? segments.slice(-1) : segments.slice(dayIndex + 1);
  const token = conditionSegments[0]?.split(',')[0]?.toLowerCase();

  const code = token ? TOKEN_TO_CODE[token] : undefined;
  return { code: code ?? 'unknown', isDaytime };
}

/** Last resort when NWS omits the icon: read the short forecast text. */
export function iconCodeFromText(text: string | null | undefined): WeatherIconCode {
  if (!text) return 'unknown';
  for (const [pattern, code] of PHRASE_TO_CODE) {
    if (pattern.test(text)) return code;
  }
  return 'unknown';
}

export function resolveIconCode(
  iconUrl: string | null | undefined,
  text: string | null | undefined,
): WeatherIconCode {
  const parsed = parseNwsIcon(iconUrl);
  return parsed.code === 'unknown' ? iconCodeFromText(text) : parsed.code;
}

/**
 * Day/night for an observation, which NWS does not flag directly.
 *
 * The observation icon URL does carry a day/night segment, but NWS appears to derive it in
 * UTC: a 17:00 MST report from Phoenix comes back as `land/night/skc` even though local
 * sunset is nearly two hours away. So the sunrise/sunset pair from /points wins, and the
 * icon URL is only the fallback for points with no astronomical data.
 */
export function resolveIsDaytime(
  iconUrl: string | null | undefined,
  observedAt: string,
  sun: { sunrise: string | null; sunset: string | null } | null,
): boolean {
  const observed = new Date(observedAt).getTime();
  const sunrise = sun?.sunrise ? new Date(sun.sunrise).getTime() : Number.NaN;
  const sunset = sun?.sunset ? new Date(sun.sunset).getTime() : Number.NaN;

  if (!Number.isNaN(observed) && !Number.isNaN(sunrise) && !Number.isNaN(sunset)) {
    return observed >= sunrise && observed < sunset;
  }

  return parseNwsIcon(iconUrl).isDaytime ?? true;
}
