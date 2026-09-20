import type { Coordinates } from '@/types/location';

/**
 * Every section of the snapshot reports its own status. A dead observation station
 * must never take the 7-day forecast down with it, so the UI degrades panel by panel.
 */
export type SectionStatus = 'ok' | 'unavailable';

/** The 18 conditions our authored icon set draws. Derived from the NWS icon token. */
export type WeatherIconCode =
  | 'clear'
  | 'few'
  | 'scattered'
  | 'broken'
  | 'overcast'
  | 'wind'
  | 'rain'
  | 'showers'
  | 'thunderstorm'
  | 'snow'
  | 'sleet'
  | 'freezing-rain'
  | 'fog'
  | 'haze'
  | 'dust'
  | 'smoke'
  | 'hot'
  | 'cold'
  | 'unknown';

export type ObservationFreshness = 'live' | 'recent' | 'stale';

export interface ResolvedLocation {
  /** Human label, e.g. "Phoenix, AZ" — from NWS relativeLocation, or the geocoder. */
  label: string;
  coordinates: Coordinates;
  /** IANA zone from /points. Every timestamp in the UI is formatted against this. */
  timeZone: string;
  /** Distance and bearing from the requested point to the named place, when NWS gives them. */
  relativeDistanceMi: number | null;
  relativeBearingDegrees: number | null;
}

export interface NwsPointMeta {
  /** Weather Forecast Office / county warning area id, e.g. "PSR". */
  office: string;
  /** Full office name, e.g. "Phoenix, AZ". Null when the offices endpoint is unavailable. */
  officeName: string | null;
  gridX: number;
  gridY: number;
  forecastZone: string | null;
  countyZone: string | null;
  fireWeatherZone: string | null;
  radarStation: string | null;
}

export interface ObservationStation {
  id: string;
  name: string;
  distanceMi: number | null;
  bearingDegrees: number | null;
  elevationFt: number | null;
}

export interface CloudLayer {
  /** METAR sky cover code: CLR, FEW, SCT, BKN, OVC, VV. */
  amount: string;
  baseFt: number | null;
}

/**
 * A normalized surface observation. Every measurement is `number | null` because NWS
 * routinely returns nulls (a station with no gust sensor, a quiet ASOS) and a null must
 * render as "no data", never as a zero or an invented value.
 */
export interface CurrentConditions {
  station: ObservationStation;
  observedAt: string;
  ageSeconds: number;
  freshness: ObservationFreshness;
  textDescription: string | null;
  iconCode: WeatherIconCode;
  isDaytime: boolean;
  nwsIconUrl: string | null;
  temperatureF: number | null;
  dewpointF: number | null;
  relativeHumidity: number | null;
  windSpeedMph: number | null;
  windGustMph: number | null;
  windDirectionDegrees: number | null;
  windDirectionCardinal: string | null;
  pressureMb: number | null;
  seaLevelPressureMb: number | null;
  visibilityMi: number | null;
  heatIndexF: number | null;
  windChillF: number | null;
  /** Heat index or wind chill, whichever NWS actually reported. Null when neither applies. */
  feelsLikeF: number | null;
  cloudLayers: CloudLayer[];
  /** How many nearer stations were silent before this one answered. Advanced-mode detail. */
  stationsSkipped: number;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperatureF: number | null;
  temperatureTrend: string | null;
  precipProbability: number | null;
  windSpeed: string | null;
  windDirection: string | null;
  shortForecast: string;
  detailedForecast: string | null;
  iconCode: WeatherIconCode;
  nwsIconUrl: string | null;
}

/** A calendar day assembled from the NWS day/night period pair. */
export interface ForecastDay {
  key: string;
  /** "Today", "Tonight", "Monday" — taken from the NWS period name. */
  label: string;
  day: ForecastPeriod | null;
  night: ForecastPeriod | null;
  highF: number | null;
  lowF: number | null;
  precipProbability: number | null;
}

export interface ForecastSection {
  status: SectionStatus;
  days: ForecastDay[];
  periods: ForecastPeriod[];
  updatedAt: string | null;
}

export interface HourlyPeriod {
  startTime: string;
  isDaytime: boolean;
  temperatureF: number | null;
  dewpointF: number | null;
  relativeHumidity: number | null;
  precipProbability: number | null;
  windSpeedMph: number | null;
  windSpeedLabel: string | null;
  windDirection: string | null;
  shortForecast: string;
  iconCode: WeatherIconCode;
  /** Gridded values joined onto the hour. Null when the grid request failed. */
  skyCoverPercent: number | null;
  windGustMph: number | null;
  thunderProbability: number | null;
}

export interface HourlySection {
  status: SectionStatus;
  periods: HourlyPeriod[];
  updatedAt: string | null;
}

export type AlertCategory = 'warning' | 'watch' | 'advisory' | 'statement';
export type AlertLevel = 'extreme' | 'severe' | 'moderate' | 'minor' | 'unknown';

export interface NormalizedAlert {
  id: string;
  event: string;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  areaDescription: string | null;
  severity: string | null;
  urgency: string | null;
  certainty: string | null;
  messageType: string | null;
  senderName: string | null;
  effective: string | null;
  onset: string | null;
  expires: string | null;
  ends: string | null;
  category: AlertCategory;
  level: AlertLevel;
}

export interface AlertsSection {
  status: SectionStatus;
  alerts: NormalizedAlert[];
}

export interface AstronomicalData {
  sunrise: string | null;
  sunset: string | null;
  civilTwilightBegin: string | null;
  civilTwilightEnd: string | null;
}

/** Gridded forecast detail surfaced in advanced mode. */
export interface GridSummary {
  status: SectionStatus;
  updatedAt: string | null;
  maxWindGustMph: number | null;
  maxThunderProbability: number | null;
  totalPrecipIn: number | null;
  maxSkyCoverPercent: number | null;
}

/** The single contract the whole UI consumes. Nothing renders raw NWS JSON. */
export interface WeatherSnapshot {
  location: ResolvedLocation;
  meta: NwsPointMeta;
  current: CurrentConditions | null;
  currentStatus: SectionStatus;
  forecast: ForecastSection;
  hourly: HourlySection;
  alerts: AlertsSection;
  grid: GridSummary;
  sun: AstronomicalData | null;
  generatedAt: string;
}
