'use client';

import { LocationSearch } from '@/components/shell/LocationSearch';
import { UseMyLocationButton } from '@/components/shell/UseMyLocationButton';
import { RadarScope } from '@/components/weather/RadarScope';
import { Corners, Panel } from '@/components/ui/Panel';
import { Notice } from '@/components/ui/Readouts';
import { useLocation } from '@/context/LocationContext';
import { QUICK_LOCATIONS } from '@/lib/location/quick-locations';

/**
 * First-run state. No location is assumed and no permission is requested — the two real
 * entry points are offered, plus a handful of fixed reference points so the app is usable
 * before a Mapbox token is configured.
 */
export function StandbyState() {
  const { selectLocation, geolocationError } = useLocation();

  return (
    <Panel className="hero">
      <Corners />
      <div className="standby">
        <div className="standby__inner">
          <RadarScope className="standby__scope" animated={false} />

          <div>
            <p className="eyebrow" style={{ justifyContent: 'center' }}>
              WX &middot; Standby
            </p>
            <h2 className="standby__title" style={{ marginTop: 'var(--s-3)' }}>
              Awaiting location input
            </h2>
          </div>

          <p className="standby__text">
            Search for a place or share your position to pull live National Weather Service
            observations, alerts, and forecasts.
          </p>

          <div className="standby__actions">
            <LocationSearch withLocateButton={false} />
            <UseMyLocationButton />
          </div>

          {geolocationError ? (
            <Notice tone="error" title="Location unavailable" message={geolocationError} />
          ) : null}

          <div className="standby__quick">
            <p className="eyebrow">Quick locations</p>
            <div className="standby__chips">
              {QUICK_LOCATIONS.map((location) => (
                <button
                  key={location.code}
                  type="button"
                  className="chip"
                  onClick={() => selectLocation({ label: location.label, coordinates: location.coordinates })}
                >
                  {location.code}
                  <span className="visually-hidden"> — {location.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
