'use client';

import { Crosshair, Loader2 } from 'lucide-react';

import { useLocation } from '@/context/LocationContext';

/**
 * The only thing that ever touches the Geolocation API. Nothing is requested on load — the
 * permission prompt appears when, and only when, someone presses this.
 */
export function UseMyLocationButton({ full = false }: { full?: boolean }) {
  const { locateMe, isLocating } = useLocation();

  return (
    <button
      type="button"
      className="btn btn--accent"
      onClick={() => void locateMe()}
      disabled={isLocating}
      style={full ? { flex: 1 } : undefined}
    >
      {isLocating ? (
        <Loader2 className="btn__icon" size={14} aria-hidden="true" />
      ) : (
        <Crosshair className="btn__icon" size={14} aria-hidden="true" />
      )}
      {isLocating ? 'Locating' : 'Use My Location'}
    </button>
  );
}
