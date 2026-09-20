import { GEOCODER_ATTRIBUTION } from '@/lib/geocoding/attribution';
import { formatBuildDate } from '@/lib/weather/format';

/**
 * Attribution lives here: NOAA/NWS for the weather, Mapbox and OpenStreetMap for geocoding
 * as their terms require. The disclaimer is deliberate — this is an independent client of
 * a public API, not an official government product.
 *
 * The bottom strip mirrors alexball.dev: year and name left, deploy date centre, stack
 * right. NEXT_PUBLIC_BUILD_TIME is stamped in next.config.ts when the build starts, which
 * on Vercel is the moment a merge deployed.
 */
/*
  Derived once at module scope from the inlined build stamp. Both values are constants
  baked in at build time, so the prerendered HTML and the hydrated client always agree —
  no reading of the visitor's clock during render.
*/
const BUILD_TIME = process.env.NEXT_PUBLIC_BUILD_TIME;
const UPDATED = formatBuildDate(BUILD_TIME);
const BUILD_YEAR = BUILD_TIME ? new Date(BUILD_TIME).getFullYear() : null;

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

      <div className="wrap footer__bottom">
        <span className="footer__copy">
          {BUILD_YEAR === null ? 'Alexander D. Ball' : `${BUILD_YEAR} Alexander D. Ball`}
        </span>

        {UPDATED ? (
          <span className="footer__updated">
            Last updated: <time dateTime={BUILD_TIME}>{UPDATED}</time>
          </span>
        ) : null}

        <span className="footer__stack">Next.js &middot; NWS &middot; Vercel</span>
      </div>
    </footer>
  );
}
