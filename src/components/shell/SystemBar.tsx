'use client';

import { RefreshCw } from 'lucide-react';

import { StatusDot } from '@/components/ui/Readouts';
import { useLocation } from '@/context/LocationContext';
import { useMode } from '@/context/ModeContext';
import { formatAge, formatClock, formatStamp } from '@/lib/weather/format';
import { FRESHNESS_LABEL } from '@/lib/weather/freshness';

/**
 * The data-freshness strip. "LIVE" is only printed when a station has actually reported
 * recently — a stale or missing observation says so plainly rather than implying currency.
 */
export function SystemBar() {
  const { snapshot, status, isRefreshing, refresh } = useLocation();
  const { isAdvanced } = useMode();

  if (!snapshot) return null;

  const { current, location, forecast, hourly, meta } = snapshot;
  const freshness = current?.freshness ?? 'off';
  const label = current ? FRESHNESS_LABEL[current.freshness] : 'NO OBS';

  return (
    <div className="wrap sysbar">
      <span className="sysbar__item">
        NWS Data
        <StatusDot state={freshness} />
        <span className="sysbar__value">{label}</span>
      </span>

      <span className="sysbar__item">
        Updated
        <span className="sysbar__value">
          {formatClock(current?.observedAt ?? snapshot.generatedAt, location.timeZone)}
        </span>
      </span>

      {isAdvanced ? (
        <>
          <span className="sysbar__item">
            Obs Age
            <span className="sysbar__value">{formatAge(current?.ageSeconds ?? null)}</span>
          </span>
          <span className="sysbar__item">
            Forecast
            <span className="sysbar__value">
              {formatStamp(forecast.updatedAt, location.timeZone)}
            </span>
          </span>
          <span className="sysbar__item">
            Hourly
            <span className="sysbar__value">{formatStamp(hourly.updatedAt, location.timeZone)}</span>
          </span>
          <span className="sysbar__item">
            WFO
            <span className="sysbar__value">
              {meta.office} {meta.gridX},{meta.gridY}
            </span>
          </span>
        </>
      ) : null}

      <span className="sysbar__spacer" />

      <button
        type="button"
        className="btn btn--ghost"
        onClick={refresh}
        disabled={isRefreshing || status === 'loading'}
      >
        <RefreshCw className="btn__icon" size={12} aria-hidden="true" />
        {isRefreshing ? 'Refreshing' : 'Refresh'}
      </button>
    </div>
  );
}
