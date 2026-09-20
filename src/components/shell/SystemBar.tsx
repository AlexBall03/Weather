'use client';

import { RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { MetaTable, StatusDot } from '@/components/ui/Readouts';
import { useLocation } from '@/context/LocationContext';
import { useMode } from '@/context/ModeContext';
import { formatAge, formatClock, formatStamp } from '@/lib/weather/format';
import { FRESHNESS_LABEL } from '@/lib/weather/freshness';

/**
 * The data-freshness strip. "LIVE" is only printed when a station has actually reported
 * recently — a stale or missing observation says so plainly rather than implying currency.
 *
 * On a phone there is no room for the advanced readouts inline, and making the strip
 * scroll sideways hid them behind a gesture nobody would guess at. Instead they collapse
 * behind a Details button that opens a dialog with the full set.
 */
export function SystemBar() {
  const { snapshot, status, isRefreshing, refresh } = useLocation();
  const { isAdvanced } = useMode();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // <dialog> is opened imperatively so the browser supplies focus trapping,
  // Escape-to-close, and the inert backdrop for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  if (!snapshot) return null;

  const { current, location, forecast, hourly, meta } = snapshot;
  const freshness = current?.freshness ?? 'off';
  const label = current ? FRESHNESS_LABEL[current.freshness] : 'NO OBS';
  const timeZone = location.timeZone;

  /** Rendered inline on wide screens and inside the dialog on narrow ones, from one source. */
  const extras = isAdvanced
    ? [
        { label: 'Obs Age', value: formatAge(current?.ageSeconds ?? null) },
        { label: 'Forecast', value: formatStamp(forecast.updatedAt, timeZone) },
        { label: 'Hourly', value: formatStamp(hourly.updatedAt, timeZone) },
        { label: 'WFO', value: `${meta.office} ${meta.gridX},${meta.gridY}` },
      ]
    : [];

  return (
    <>
      <div className="wrap sysbar">
        <span className="sysbar__item">
          <span className="sysbar__label">NWS Data</span>
          <StatusDot state={freshness} />
          <span className="sysbar__value">{label}</span>
        </span>

        <span className="sysbar__item">
          <span className="sysbar__label">Updated</span>
          <span className="sysbar__value">
            {formatClock(current?.observedAt ?? snapshot.generatedAt, timeZone)}
          </span>
        </span>

        {extras.map((item) => (
          <span className="sysbar__item sysbar__item--extra" key={item.label}>
            <span className="sysbar__label">{item.label}</span>
            <span className="sysbar__value">{item.value}</span>
          </span>
        ))}

        <span className="sysbar__spacer" />

        <div className="sysbar__actions">
          {extras.length > 0 ? (
            <button
              type="button"
              className="btn btn--ghost sysbar__details"
              onClick={() => setIsOpen(true)}
            >
              <SlidersHorizontal className="btn__icon" size={12} aria-hidden="true" />
              Details
            </button>
          ) : null}

          <button
            type="button"
            className="btn btn--ghost sysbar__refresh"
            onClick={refresh}
            disabled={isRefreshing || status === 'loading'}
            aria-label={isRefreshing ? 'Refreshing weather data' : 'Refresh weather data'}
          >
            <RefreshCw className="btn__icon" size={12} aria-hidden="true" />
            <span className="sysbar__refresh-label">
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        className="sheet"
        aria-labelledby="data-status-heading"
        onClose={() => setIsOpen(false)}
        // A click on the backdrop lands on the dialog element itself, not its panel.
        onClick={(event) => {
          if (event.target === dialogRef.current) setIsOpen(false);
        }}
      >
        <div className="sheet__panel">
          <div className="sheet__head">
            <h2 className="eyebrow" id="data-status-heading">
              Data Status
            </h2>
            <button
              type="button"
              className="sheet__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close data status"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <MetaTable
            rows={[
              { label: 'NWS Data', value: label },
              {
                label: 'Updated',
                value: formatClock(current?.observedAt ?? snapshot.generatedAt, timeZone),
              },
              ...extras.map((item) => ({ label: item.label, value: item.value })),
              { label: 'Zone', value: meta.forecastZone },
              { label: 'Radar', value: meta.radarStation },
            ]}
          />
        </div>
      </dialog>
    </>
  );
}
