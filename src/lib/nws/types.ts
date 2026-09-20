/**
 * Raw api.weather.gov response shapes, kept deliberately separate from the normalized
 * application model in `@/types/weather`. Fields are optional/nullable to match what the
 * service actually returns — nulls are routine, not exceptional.
 */

/** A measured quantity. `unitCode` is a WMO code such as `wmoUnit:degC`. */
export interface NwsQuantity {
  unitCode?: string;
  value: number | null;
  qualityControl?: string;
}

export interface NwsProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  correlationId?: string;
}

export interface NwsRelativeLocation {
  properties?: {
    city?: string;
    state?: string;
    distance?: NwsQuantity;
    bearing?: NwsQuantity;
  };
}

export interface NwsAstronomicalData {
  sunrise?: string | null;
  sunset?: string | null;
  civilTwilightBegin?: string | null;
  civilTwilightEnd?: string | null;
}

export interface NwsPointProperties {
  cwa?: string;
  gridId?: string;
  gridX?: number;
  gridY?: number;
  forecast?: string;
  forecastHourly?: string;
  forecastGridData?: string;
  observationStations?: string;
  forecastOffice?: string;
  relativeLocation?: NwsRelativeLocation;
  forecastZone?: string;
  county?: string;
  fireWeatherZone?: string;
  timeZone?: string;
  radarStation?: string;
  astronomicalData?: NwsAstronomicalData;
}

export interface NwsPointResponse {
  properties?: NwsPointProperties;
}

export interface NwsOfficeResponse {
  id?: string;
  name?: string;
}

export interface NwsForecastPeriod {
  number?: number;
  name?: string;
  startTime?: string;
  endTime?: string;
  isDaytime?: boolean;
  temperature?: number | null;
  temperatureUnit?: string;
  temperatureTrend?: string | null;
  probabilityOfPrecipitation?: NwsQuantity;
  dewpoint?: NwsQuantity;
  relativeHumidity?: NwsQuantity;
  /** Free text such as "5 mph" or "0 to 5 mph". Never a number. */
  windSpeed?: string | null;
  windDirection?: string | null;
  icon?: string | null;
  shortForecast?: string;
  detailedForecast?: string;
}

export interface NwsForecastResponse {
  properties?: {
    units?: string;
    updated?: string;
    generatedAt?: string;
    updateTime?: string;
    periods?: NwsForecastPeriod[];
  };
}

export interface NwsStationProperties {
  stationIdentifier?: string;
  name?: string;
  timeZone?: string;
  elevation?: NwsQuantity;
  distance?: NwsQuantity;
  bearing?: NwsQuantity;
}

export interface NwsStationsResponse {
  features?: Array<{ properties?: NwsStationProperties }>;
}

export interface NwsObservationProperties {
  station?: string;
  stationId?: string;
  timestamp?: string;
  textDescription?: string | null;
  icon?: string | null;
  temperature?: NwsQuantity;
  dewpoint?: NwsQuantity;
  windDirection?: NwsQuantity;
  windSpeed?: NwsQuantity;
  windGust?: NwsQuantity;
  barometricPressure?: NwsQuantity;
  seaLevelPressure?: NwsQuantity;
  visibility?: NwsQuantity;
  relativeHumidity?: NwsQuantity;
  windChill?: NwsQuantity;
  heatIndex?: NwsQuantity;
  cloudLayers?: Array<{ base?: NwsQuantity; amount?: string }>;
}

export interface NwsObservationResponse {
  properties?: NwsObservationProperties;
}

/** One entry of a gridded time series. `validTime` is `<ISO8601 start>/<ISO8601 duration>`. */
export interface NwsGridValue {
  validTime?: string;
  value?: number | null;
}

export interface NwsGridSeries {
  uom?: string;
  values?: NwsGridValue[];
}

export interface NwsGridResponse {
  properties?: {
    updateTime?: string;
    validTimes?: string;
    skyCover?: NwsGridSeries;
    windGust?: NwsGridSeries;
    probabilityOfThunder?: NwsGridSeries;
    quantitativePrecipitation?: NwsGridSeries;
    probabilityOfPrecipitation?: NwsGridSeries;
    apparentTemperature?: NwsGridSeries;
  };
}

export interface NwsAlertProperties {
  id?: string;
  areaDesc?: string;
  sent?: string;
  effective?: string;
  onset?: string | null;
  expires?: string;
  ends?: string | null;
  status?: string;
  messageType?: string;
  severity?: string;
  certainty?: string;
  urgency?: string;
  event?: string;
  senderName?: string;
  headline?: string | null;
  description?: string | null;
  instruction?: string | null;
}

export interface NwsAlertsResponse {
  features?: Array<{ id?: string; properties?: NwsAlertProperties }>;
}
