'use client';

import { MetadataBlock } from '@/components/advanced/MetadataBlock';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { MetaTable, Notice } from '@/components/ui/Readouts';
import { useMode } from '@/context/ModeContext';
import {
  EM_DASH,
  formatDegrees,
  formatElapsed,
  formatMph,
  formatNumber,
  formatPercent,
  formatStamp,
  formatTemperature,
  formatWind,
} from '@/lib/weather/format';
import { cardinalFromDegrees } from '@/lib/weather/units';
import type { CurrentConditions, WeatherSnapshot } from '@/types/weather';

interface Row {
  key: string;
  label: string;
  value: string;
}

function ConditionRow({ label, value }: { label: string; value: string }) {
  const isEmpty = value === EM_DASH;
  return (
    <div className="conditions__row">
      <dt className="conditions__key">{label}</dt>
      <dd
        className={`conditions__value${isEmpty ? ' conditions__value--empty' : ''}`}
        style={{ margin: 0 }}
      >
        {value}
      </dd>
    </div>
  );
}

/** Cloud layers as a METAR-style summary: "BKN 3800 ft". */
function describeSky(current: CurrentConditions): string {
  if (current.cloudLayers.length === 0) return EM_DASH;
  return current.cloudLayers
    .map((layer) =>
      layer.baseFt === null
        ? layer.amount
        : `${layer.amount} ${formatNumber(layer.baseFt)} ft`,
    )
    .join(', ');
}

function buildRows(current: CurrentConditions, isAdvanced: boolean): Row[] {
  const rows: Row[] = [
    { key: 'feels', label: 'Feels like', value: formatTemperature(current.feelsLikeF) },
    { key: 'dew', label: 'Dew point', value: formatTemperature(current.dewpointF) },
    { key: 'humidity', label: 'Humidity', value: formatPercent(current.relativeHumidity) },
    {
      key: 'wind',
      label: 'Wind',
      value: formatWind(current.windSpeedMph, current.windDirectionCardinal),
    },
    { key: 'gust', label: 'Wind gust', value: formatMph(current.windGustMph) },
    {
      key: 'pressure',
      label: 'Pressure',
      value: current.pressureMb === null ? EM_DASH : `${formatNumber(current.pressureMb, 1)} mb`,
    },
    {
      key: 'visibility',
      label: 'Visibility',
      value: current.visibilityMi === null ? EM_DASH : `${formatNumber(current.visibilityMi, 1)} mi`,
    },
  ];

  if (!isAdvanced) return rows;

  return rows.concat([
    {
      key: 'winddir',
      label: 'Wind direction',
      // METAR reports 0 degrees for a calm wind, where a direction means nothing.
      value: current.windSpeedMph === 0 ? EM_DASH : formatDegrees(current.windDirectionDegrees),
    },
    { key: 'heat', label: 'Heat index', value: formatTemperature(current.heatIndexF) },
    { key: 'chill', label: 'Wind chill', value: formatTemperature(current.windChillF) },
    {
      key: 'slp',
      label: 'Sea level pressure',
      value:
        current.seaLevelPressureMb === null
          ? EM_DASH
          : `${formatNumber(current.seaLevelPressureMb, 1)} mb`,
    },
    { key: 'sky', label: 'Sky cover', value: describeSky(current) },
  ]);
}

export function ConditionsPanel({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { isAdvanced } = useMode();
  const { current, location } = snapshot;

  return (
    <Panel className="dashboard__conditions" labelledBy="conditions-heading">
      <PanelHeader
        title="Conditions"
        id="conditions-heading"
        aside={current ? current.station.id : 'NO STATION'}
      />

      {current ? (
        <>
          <dl className="conditions__list" style={{ margin: 0 }}>
            {buildRows(current, isAdvanced).map((row) => (
              <ConditionRow key={row.key} label={row.label} value={row.value} />
            ))}
          </dl>

          {isAdvanced ? (
            <div className="conditions__meta">
              <MetadataBlock title="Observation">
                <MetaTable
                  rows={[
                    { label: 'Station', value: current.station.id },
                    { label: 'Site', value: current.station.name },
                    { label: 'Taken', value: formatStamp(current.observedAt, location.timeZone) },
                    { label: 'Age', value: formatElapsed(current.ageSeconds) },
                    {
                      label: 'Distance',
                      value:
                        current.station.distanceMi === null
                          ? null
                          : `${formatNumber(current.station.distanceMi, 1)} mi ${
                              cardinalFromDegrees(current.station.bearingDegrees) ?? ''
                            }`.trim(),
                    },
                    {
                      label: 'Elevation',
                      value:
                        current.station.elevationFt === null
                          ? null
                          : `${formatNumber(current.station.elevationFt)} ft`,
                    },
                    {
                      label: 'Fallback',
                      // Only meaningful when nearer stations were silent.
                      value:
                        current.stationsSkipped > 0
                          ? `${current.stationsSkipped} nearer station(s) silent`
                          : null,
                      omitWhenEmpty: true,
                    },
                  ]}
                />
              </MetadataBlock>
            </div>
          ) : null}
        </>
      ) : (
        <div className="panel__body">
          <Notice
            tone="info"
            title="Observations unavailable"
            message="No nearby NWS station returned a current observation. Forecast data is still shown."
          />
        </div>
      )}
    </Panel>
  );
}
