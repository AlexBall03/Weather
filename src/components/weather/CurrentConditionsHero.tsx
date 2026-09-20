'use client';

import { Droplets, Gauge, Eye, Thermometer, Umbrella, Wind } from 'lucide-react';

import { MetadataBlock } from '@/components/advanced/MetadataBlock';
import { MetricTile } from '@/components/weather/MetricTile';
import { RadarScope } from '@/components/weather/RadarScope';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { Corners, Panel } from '@/components/ui/Panel';
import { MetaTable, Notice, StatusDot } from '@/components/ui/Readouts';
import { useMode } from '@/context/ModeContext';
import {
  EM_DASH,
  formatClock,
  formatCoordinates,
  formatDegrees,
  formatNumber,
  formatPercent,
  formatTemperature,
  formatTime,
  formatWind,
} from '@/lib/weather/format';
import { FRESHNESS_LABEL } from '@/lib/weather/freshness';
import type { WeatherSnapshot } from '@/types/weather';

/** Highest precipitation chance across the next twelve hours, for the hero's precip tile. */
function nearTermPrecip(snapshot: WeatherSnapshot): number | null {
  const values = snapshot.hourly.periods
    .slice(0, 12)
    .map((period) => period.precipProbability)
    .filter((value): value is number => value !== null);
  return values.length > 0 ? Math.max(...values) : null;
}

/** Today's high and tonight's low from the first forecast day. */
function todayRange(snapshot: WeatherSnapshot): { highF: number | null; lowF: number | null } {
  const [first, second] = snapshot.forecast.days;
  return {
    highF: first?.highF ?? second?.highF ?? null,
    lowF: first?.lowF ?? second?.lowF ?? null,
  };
}

export function CurrentConditionsHero({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { isAdvanced } = useMode();
  const { current, location, meta, sun } = snapshot;
  const timeZone = location.timeZone;
  const range = todayRange(snapshot);
  const precip = nearTermPrecip(snapshot);

  // A direction on a calm wind is noise, so it is suppressed along with the gust.
  const windDetail = (() => {
    if (!current || current.windSpeedMph === 0) return null;
    const parts: string[] = [];
    if (current.windDirectionCardinal) parts.push(current.windDirectionCardinal);
    if (current.windGustMph !== null) parts.push(`G ${Math.round(current.windGustMph)}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  })();

  return (
    <Panel className="hero" labelledBy="current-conditions-heading">
      <Corners />
      <RadarScope className="hero__scope" />

      <div className="hero__body">
        <div>
          <h2 className="visually-hidden" id="current-conditions-heading">
            Current conditions
          </h2>

          <div className="hero__place">
            <p className="hero__label">{location.label}</p>
            <p className="hero__sub">
              <span>
                {current ? (
                  <>
                    <StatusDot state={current.freshness} /> {FRESHNESS_LABEL[current.freshness]}
                  </>
                ) : (
                  <>
                    <StatusDot state="off" /> NO OBSERVATION
                  </>
                )}
              </span>
              <span>{formatClock(current?.observedAt ?? snapshot.generatedAt, timeZone)}</span>
              {isAdvanced ? (
                <span>
                  {formatCoordinates(location.coordinates.latitude, location.coordinates.longitude)}
                </span>
              ) : null}
              {isAdvanced ? <span>{timeZone}</span> : null}
            </p>
          </div>

          {current ? (
            <div className="hero__reading">
              <p className="hero__temp">
                {current.temperatureF === null ? EM_DASH : Math.round(current.temperatureF)}
                <span className="hero__degree" aria-hidden="true">
                  &deg;
                </span>
                <span className="visually-hidden">
                  {current.temperatureF === null
                    ? 'temperature unavailable'
                    : `${Math.round(current.temperatureF)} degrees Fahrenheit`}
                </span>
              </p>

              <div className="hero__condition">
                <span className="hero__condition-row">
                  <WeatherIcon
                    className="hero__condition-icon"
                    code={current.iconCode}
                    isDaytime={current.isDaytime}
                    size={30}
                  />
                  <span className="hero__condition-text">
                    {current.textDescription ?? 'Conditions unavailable'}
                  </span>
                </span>

                {current.feelsLikeF !== null ? (
                  <span className="hero__feels">
                    Feels like {formatTemperature(current.feelsLikeF)}
                    {isAdvanced
                      ? ` · ${current.heatIndexF !== null ? 'heat index' : 'wind chill'}`
                      : ''}
                  </span>
                ) : null}

                <span className="hero__range">
                  <span className="hero__range-high">H {formatTemperature(range.highF)}</span>
                  <span aria-hidden="true">/</span>
                  <span className="hero__range-low">L {formatTemperature(range.lowF)}</span>
                </span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--s-5)', maxWidth: 520 }}>
              <Notice
                tone="info"
                icon={<Thermometer size={16} />}
                title="No current observation"
                message="No nearby NWS station is reporting right now. The forecast below is unaffected."
              />
            </div>
          )}
        </div>

        <div className="hero__aside">
          {isAdvanced ? (
            <MetadataBlock title="NWS Office">
              <MetaTable
                rows={[
                  {
                    label: 'WFO',
                    value: meta.officeName ? `${meta.office} · ${meta.officeName}` : meta.office,
                  },
                  { label: 'Grid', value: `${meta.gridX}, ${meta.gridY}` },
                  { label: 'Zone', value: meta.forecastZone },
                  { label: 'County', value: meta.countyZone },
                  { label: 'Fire Zone', value: meta.fireWeatherZone, omitWhenEmpty: true },
                  { label: 'Radar', value: meta.radarStation },
                ]}
              />
            </MetadataBlock>
          ) : null}

          {sun && (sun.sunrise || sun.sunset) ? (
            <MetadataBlock title="Sun">
              <MetaTable
                rows={[
                  { label: 'Sunrise', value: sun.sunrise ? formatTime(sun.sunrise, timeZone) : null },
                  { label: 'Sunset', value: sun.sunset ? formatTime(sun.sunset, timeZone) : null },
                  ...(isAdvanced
                    ? [
                        {
                          label: 'Civil Dawn',
                          value: sun.civilTwilightBegin
                            ? formatTime(sun.civilTwilightBegin, timeZone)
                            : null,
                        },
                        {
                          label: 'Civil Dusk',
                          value: sun.civilTwilightEnd
                            ? formatTime(sun.civilTwilightEnd, timeZone)
                            : null,
                        },
                      ]
                    : []),
                ]}
              />
            </MetadataBlock>
          ) : null}
        </div>
      </div>

      <div className="hero__metrics">
        <MetricTile
          label="Wind"
          icon={<Wind size={12} />}
          value={current ? formatWind(current.windSpeedMph, null) : EM_DASH}
          detail={windDetail}
        />
        <MetricTile
          label="Humidity"
          icon={<Droplets size={12} />}
          value={current ? formatPercent(current.relativeHumidity) : EM_DASH}
        />
        <MetricTile
          label="Dew Point"
          icon={<Thermometer size={12} />}
          value={current ? formatTemperature(current.dewpointF) : EM_DASH}
        />
        <MetricTile
          label="Precip"
          icon={<Umbrella size={12} />}
          value={formatPercent(precip)}
          detail="next 12 hr"
        />
        {isAdvanced ? (
          <>
            <MetricTile
              label="Pressure"
              icon={<Gauge size={12} />}
              value={
                current?.pressureMb !== null && current?.pressureMb !== undefined
                  ? `${formatNumber(current.pressureMb, 1)} mb`
                  : EM_DASH
              }
            />
            <MetricTile
              label="Visibility"
              icon={<Eye size={12} />}
              value={
                current?.visibilityMi !== null && current?.visibilityMi !== undefined
                  ? `${formatNumber(current.visibilityMi, 1)} mi`
                  : EM_DASH
              }
            />
            <MetricTile
              label="Wind Dir"
              icon={<Wind size={12} />}
              value={
                current && current.windSpeedMph !== 0
                  ? formatDegrees(current.windDirectionDegrees)
                  : EM_DASH
              }
              detail={current?.windSpeedMph === 0 ? 'calm' : (current?.windDirectionCardinal ?? null)}
            />
          </>
        ) : null}
      </div>
    </Panel>
  );
}
