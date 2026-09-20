'use client';

import { CloudOff, MapPinOff, ServerCrash, Timer } from 'lucide-react';
import type { ReactNode } from 'react';

import { AlertsPanel } from '@/components/alerts/AlertsPanel';
import { DailyForecast } from '@/components/forecast/DailyForecast';
import { HourlyForecast } from '@/components/forecast/HourlyForecast';
import { DashboardSkeleton } from '@/components/shell/DashboardSkeleton';
import { StandbyState } from '@/components/shell/StandbyState';
import { UseMyLocationButton } from '@/components/shell/UseMyLocationButton';
import { ConditionsPanel } from '@/components/weather/ConditionsPanel';
import { CurrentConditionsHero } from '@/components/weather/CurrentConditionsHero';
import { Panel } from '@/components/ui/Panel';
import { Notice } from '@/components/ui/Readouts';
import { useLocation } from '@/context/LocationContext';
import { QUICK_LOCATIONS } from '@/lib/location/quick-locations';
import type { ApiErrorCode } from '@/types/api';

/** Each failure gets its own icon so the states are distinguishable at a glance. */
const ERROR_ICON: Partial<Record<ApiErrorCode, ReactNode>> = {
  OUTSIDE_NWS_COVERAGE: <MapPinOff size={16} />,
  NWS_UNAVAILABLE: <CloudOff size={16} />,
  NWS_RATE_LIMITED: <Timer size={16} />,
  UNEXPECTED: <ServerCrash size={16} />,
};

function ErrorState() {
  const { error, refresh, selectLocation } = useLocation();
  if (!error) return null;

  const isCoverage = error.code === 'OUTSIDE_NWS_COVERAGE';

  return (
    <Panel>
      <div className="panel__body">
        <Notice
          tone="error"
          icon={ERROR_ICON[error.code] ?? <ServerCrash size={16} />}
          title={error.title}
          message={error.message}
          actions={
            <>
              {isCoverage ? null : (
                <button type="button" className="btn" onClick={refresh}>
                  Try again
                </button>
              )}
              <UseMyLocationButton />
              {QUICK_LOCATIONS.slice(0, 3).map((location) => (
                <button
                  key={location.code}
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    selectLocation({ label: location.label, coordinates: location.coordinates })
                  }
                >
                  {location.code}
                </button>
              ))}
            </>
          }
        />
        {error.correlationId ? (
          <p
            className="mono"
            style={{ marginTop: 'var(--s-3)', fontSize: '0.625rem', color: 'var(--faint)' }}
          >
            NWS CORRELATION {error.correlationId}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export function Dashboard() {
  const { hydrated, location, snapshot, status } = useLocation();

  // Until the saved location has been read, the server and client both render the skeleton.
  if (!hydrated) return <DashboardSkeleton label="Restoring saved location" />;

  if (!location) return <StandbyState />;

  if (status === 'error') return <ErrorState />;

  if (!snapshot || status === 'loading') {
    return <DashboardSkeleton label={`Loading weather for ${location.label}`} />;
  }

  return (
    <div className="dashboard">
      <CurrentConditionsHero snapshot={snapshot} />
      <AlertsPanel snapshot={snapshot} />
      <HourlyForecast snapshot={snapshot} />
      <ConditionsPanel snapshot={snapshot} />
      <DailyForecast snapshot={snapshot} />
    </div>
  );
}
