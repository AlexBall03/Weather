'use client';

import { HourlyTrend } from '@/components/forecast/HourlyTrend';
import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Notice } from '@/components/ui/Readouts';
import { useMode } from '@/context/ModeContext';
import { EM_DASH, formatHourLabel, formatPercent } from '@/lib/weather/format';
import type { HourlyPeriod, WeatherSnapshot } from '@/types/weather';

/** Must match `.hourly__col` width in dashboard.css so the trend lines up with the columns. */
const COLUMN_WIDTH = 74;

function HourlyColumn({
  period,
  timeZone,
  isNow,
  isAdvanced,
}: {
  period: HourlyPeriod;
  timeZone: string;
  isNow: boolean;
  isAdvanced: boolean;
}) {
  const precip = period.precipProbability;
  return (
    <li className={`hourly__col${isNow ? ' hourly__col--now' : ''}`}>
      <span className="hourly__time">{isNow ? 'NOW' : formatHourLabel(period.startTime, timeZone)}</span>
      <WeatherIcon
        className="hourly__icon"
        code={period.iconCode}
        isDaytime={period.isDaytime}
        size={22}
        label={period.shortForecast || undefined}
      />
      <span className="hourly__temp">
        {period.temperatureF === null ? EM_DASH : `${Math.round(period.temperatureF)}°`}
      </span>
      <span className={`hourly__precip${!precip ? ' hourly__precip--none' : ''}`}>
        {formatPercent(precip)}
      </span>

      {isAdvanced ? (
        <span className="hourly__adv">
          <span className="hourly__adv-row">
            <span className="hourly__adv-key">WND</span>
            <span>{period.windSpeedMph === null ? EM_DASH : `${period.windSpeedMph}`}</span>
          </span>
          <span className="hourly__adv-row">
            <span className="hourly__adv-key">GST</span>
            <span>{period.windGustMph === null ? EM_DASH : `${Math.round(period.windGustMph)}`}</span>
          </span>
          <span className="hourly__adv-row">
            <span className="hourly__adv-key">SKY</span>
            <span>{period.skyCoverPercent === null ? EM_DASH : `${period.skyCoverPercent}`}</span>
          </span>
          <span className="hourly__adv-row">
            <span className="hourly__adv-key">DEW</span>
            <span>{period.dewpointF === null ? EM_DASH : `${Math.round(period.dewpointF)}`}</span>
          </span>
        </span>
      ) : null}
    </li>
  );
}

export function HourlyForecast({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { isAdvanced } = useMode();
  const { hourly, location } = snapshot;
  const periods = hourly.periods;

  return (
    <Panel className="dashboard__hourly panel--flush" labelledBy="hourly-heading">
      <PanelHeader
        title="Hourly Forecast"
        id="hourly-heading"
        aside={periods.length > 0 ? `NEXT ${periods.length} HR` : undefined}
      />

      {periods.length === 0 ? (
        <div className="panel__body">
          <Notice
            tone="info"
            title="Hourly forecast unavailable"
            message="NWS did not return an hourly forecast for this grid point. Try again shortly."
          />
        </div>
      ) : (
        <div
          className="hourly__track"
          // A horizontally scrolling region needs to be reachable and labelled for keyboard users.
          tabIndex={0}
          role="group"
          aria-label="Hourly forecast, scroll horizontally"
        >
          <div style={{ minWidth: 'max-content' }}>
            <HourlyTrend periods={periods} columnWidth={COLUMN_WIDTH} />
            <ul className="hourly__cols">
              {periods.map((period, index) => (
                <HourlyColumn
                  key={period.startTime}
                  period={period}
                  timeZone={location.timeZone}
                  isNow={index === 0}
                  isAdvanced={isAdvanced}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  );
}
