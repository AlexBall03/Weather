import { GEOCODER_ATTRIBUTION } from '@/lib/geocoding/attribution';

/**
 * Attribution lives here: NOAA/NWS for the weather, Mapbox and OpenStreetMap for geocoding
 * as their terms require. The disclaimer is deliberate — this is an independent client of
 * a public API, not an official government product.
 */
export function AppFooter() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__source">
          <p className="footer__source-title">NOAA / National Weather Service</p>
          <p className="footer__note">
            All forecasts, observations, and alerts come from the National Weather Service
            (api.weather.gov). This is an independent application and is not an official NOAA or
            NWS product. Geocoding {GEOCODER_ATTRIBUTION}.
          </p>
        </div>

        <div className="footer__built">
          <span>
            Built by{' '}
            <a href="https://alexball.dev" target="_blank" rel="noreferrer noopener">
              Alexander D. Ball
            </a>
          </span>
          <span>weather.alexball.dev</span>
        </div>
      </div>
    </footer>
  );
}
