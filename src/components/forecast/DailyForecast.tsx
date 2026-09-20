'use client';

import { ChevronDown } from 'lucide-react';

import { WeatherIcon } from '@/components/weather/WeatherIcon';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { MetaTable, Notice } from '@/components/ui/Readouts';
import { useMode } from '@/context/ModeContext';
import {
  EM_DASH,
  formatDateShort,
  formatPercent,
  formatTemperature,
} from '@/lib/weather/format';
import type { ForecastDay, WeatherSnapshot } from '@/types/weather';

/** NWS returns 14 periods; seven days is the product. */
const DAYS_SHOWN = 7;

function DayRow({
  day,
  timeZone,
  isAdvanced,
}: {
  day: ForecastDay;
  timeZone: string;
  isAdvanced: boolean;
}) {
  const lead = day.day ?? day.night;
  if (!lead) return null;

  const hasDetail = Boolean(day.day?.detailedForecast || day.night?.detailedForecast);

  return (
    <details className="daily__item">
      <summary className="daily__row">
        <span className="daily__day">
          <span className="daily__name">{day.label}</span>
          <span className="daily__date">{formatDateShort(lead.startTime, timeZone)}</span>
        </span>

        <span className="daily__icon">
          <WeatherIcon code={lead.iconCode} isDaytime={lead.isDaytime} size={22} />
        </span>

        <span className="daily__short">{lead.shortForecast || EM_DASH}</span>

        <span className={`daily__precip${!day.precipProbability ? ' daily__precip--none' : ''}`}>
          {formatPercent(day.precipProbability)}
        </span>

        <span className="daily__temps">
          <span className="daily__high">{formatTemperature(day.highF)}</span>
          <span className="daily__low">{formatTemperature(day.lowF)}</span>
        </span>

        <ChevronDown className="daily__chevron" size={14} aria-hidden="true" />
        <span className="visually-hidden">Show forecast detail for {day.label}</span>
      </summary>

      <div className="daily__detail">
        {day.day?.detailedForecast ? (
          <div className="daily__detail-block">
            <span className="daily__detail-label">{day.day.name}</span>
            <p className="daily__detail-text">{day.day.detailedForecast}</p>
          </div>
        ) : null}

        {day.night?.detailedForecast ? (
          <div className="daily__detail-block">
            <span className="daily__detail-label">{day.night.name}</span>
            <p className="daily__detail-text">{day.night.detailedForecast}</p>
          </div>
        ) : null}

        {!hasDetail ? (
          <p className="daily__detail-text">No detailed forecast text was issued for this period.</p>
        ) : null}

        {isAdvanced ? (
          <MetaTable
            rows={[
              {
                label: 'Day Wind',
                value: day.day
                  ? `${day.day.windDirection ?? ''} ${day.day.windSpeed ?? ''}`.trim() || null
                  : null,
                omitWhenEmpty: true,
              },
              {
                label: 'Night Wind',
                value: day.night
                  ? `${day.night.windDirection ?? ''} ${day.night.windSpeed ?? ''}`.trim() || null
                  : null,
                omitWhenEmpty: true,
              },
              {
                label: 'Day PoP',
                value: day.day ? formatPercent(day.day.precipProbability) : null,
                omitWhenEmpty: true,
              },
              {
                label: 'Night PoP',
                value: day.night ? formatPercent(day.night.precipProbability) : null,
                omitWhenEmpty: true,
              },
              {
                label: 'Trend',
                value: day.day?.temperatureTrend ?? day.night?.temperatureTrend ?? null,
                omitWhenEmpty: true,
              },
            ]}
          />
        ) : null}
      </div>
    </details>
  );
}

export function DailyForecast({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { isAdvanced } = useMode();
  const days = snapshot.forecast.days.slice(0, DAYS_SHOWN);

  return (
    <Panel className="dashboard__daily panel--flush" labelledBy="daily-heading">
      <PanelHeader
        title="7-Day Forecast"
        id="daily-heading"
        aside={snapshot.forecast.status === 'ok' ? `${days.length} PERIODS` : undefined}
      />

      {days.length === 0 ? (
        <div className="panel__body">
          <Notice
            tone="info"
            title="Forecast unavailable"
            message="NWS did not return a forecast for this grid point. No other source is substituted."
          />
        </div>
      ) : (
        <div className="daily__list">
          {days.map((day) => (
            <DayRow
              key={day.key}
              day={day}
              timeZone={snapshot.location.timeZone}
              isAdvanced={isAdvanced}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}
