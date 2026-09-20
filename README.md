# Weather

A weather command center built on National Weather Service data, deployed at
**weather.alexball.dev**.

One dashboard: current conditions, active alerts, hourly and seven-day forecasts, with a
Simple/Advanced toggle that reveals the meteorology underneath the forecast. All weather
comes from `api.weather.gov` — no other weather provider is used or substituted.

This is an independent application. It is **not** an official NOAA or NWS product.

---

## Stack

| Piece | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript, strict |
| UI | React 19, hand-written CSS (no CSS framework) |
| Icons | `lucide-react` for UI chrome; weather glyphs are authored in `WeatherIcon.tsx` |
| Fonts | Space Grotesk / Inter / JetBrains Mono, self-hosted via `next/font` |
| Weather data | National Weather Service (`api.weather.gov`) |
| Geocoding | Mapbox Geocoding API v6 — **text to coordinates only** |
| Hosting | Vercel |

The design system, "Meteorological Operations Center", is an evolution of the Executive
Engineer system on [alexball.dev](https://alexball.dev): the same dark ground, hairline
borders, and three typefaces, retuned for operational density with blue as the primary
functional accent.

---

## Environment

Copy `.env.example` to `.env.local`. Both variables are server-only — neither is prefixed
with `NEXT_PUBLIC_`, so neither reaches the browser bundle.

```env
NWS_USER_AGENT="Weather/1.0 (weather.alexball.dev, you@example.com)"
MAPBOX_ACCESS_TOKEN=pk.your_token_here
```

### `NWS_USER_AGENT`

The National Weather Service has **no accounts and no API keys**. It asks only that every
client identify itself with a `User-Agent` containing a way to contact the operator, so it
can reach you about a problem rather than silently blocking you.

Used in exactly one place: `src/lib/nws/client.ts`. If unset, the client falls back to
`Weather/1.0 (weather.alexball.dev)`, which works but gives NWS no contact path — set a
real one in production.

### `MAPBOX_ACCESS_TOKEN`

Used only by `src/lib/geocoding/mapbox.ts`, behind the `/api/geocode` route, to turn a
typed place name into coordinates. No weather data ever comes from Mapbox.

Without it, typed search returns a clear configuration message and everything else —
Use My Location, the quick locations, and the full dashboard — keeps working.

Get one at [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/):
the Default Public Token (`pk.…`) is sufficient, and the free tier covers 100,000
geocoding requests a month.

Leave the token's **URL restrictions empty**. Mapbox enforces those against the `Referer`
header, and this app calls the Geocoding API from the server, where there is no referer —
a URL-restricted token would be rejected on every request. Leaving it unrestricted is safe
here because the token is server-only and never reaches the browser.

### `NWS_BASE_URL` (optional)

Overrides the NWS base URL. Useful for exercising the "NWS unavailable" state locally:

```bash
NWS_BASE_URL=https://nws-unreachable.invalid npm run dev
```

---

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
npm run start   # serve the production build
```

### Verifying NWS directly

```bash
curl -H "User-Agent: Weather/1.0 (weather.alexball.dev, you@example.com)" \
     -H "Accept: application/geo+json" \
     "https://api.weather.gov/points/33.4484,-112.0740"
```

A point outside NWS coverage returns HTTP 404 with a `problems/InvalidPoint` body — the
app turns that into the "Outside NWS coverage" state rather than falling back elsewhere.

---

## Architecture

```
Browser
  └─ LocationContext  (selected place, persisted to localStorage)
       └─ useWeatherSnapshot  → GET /api/weather?lat&lon
            └─ lib/weather/aggregate.ts   ← the only NWS orchestration point
```

`aggregate.ts` resolves `/points` first, then fetches every independent resource
concurrently with `Promise.allSettled`, so a dead observation station degrades one panel
instead of the whole dashboard. Each section of the normalized `WeatherSnapshot` carries
its own `status`, and every measurement is `number | null` — a missing value renders as an
em dash, never as a zero or an invented figure.

### NWS resources used

| Resource | Purpose |
| --- | --- |
| `/points/{lat},{lon}` | Grid mapping, time zone, relative place name, zones, radar station, sunrise/sunset, and the URLs for everything below |
| `/gridpoints/{wfo}/{x},{y}/forecast` | Seven-day forecast periods |
| `/gridpoints/{wfo}/{x},{y}/forecast/hourly` | Hourly forecast |
| `/gridpoints/{wfo}/{x},{y}` | Gridded detail: sky cover, wind gusts, thunder probability |
| `/gridpoints/{wfo}/{x},{y}/stations` | Nearby observation stations |
| `/stations/{id}/observations/latest` | Current conditions |
| `/alerts/active?point={lat},{lon}` | Active watches, warnings, advisories |
| `/offices/{wfo}` | Forecast office name |

Endpoint URLs come from the `/points` response rather than being reconstructed by hand.

### Caching

Windows are tuned against the `Cache-Control` headers NWS itself sends, and are defined in
one place: `src/lib/nws/cache.ts`.

| Resource | Revalidate | Why |
| --- | --- | --- |
| `/points` | 1 hour | Grid mapping never changes; the window only refreshes sunrise/sunset |
| Forecast, hourly, grid | 15 min | Upstream `s-maxage=3600`; NWS issues a few times daily |
| Station list | 24 hours | Stations do not move |
| Latest observation | 5 min | Matches upstream `s-maxage=300` |
| Active alerts | 1 minute | Upstream allows 5s; one request per minute per location is responsible load |

The `/api/weather` response is served with `s-maxage=60, stale-while-revalidate=300`,
governed by its shortest input.

### Layout

```
src/
  app/                  layout, page, /api/weather, /api/geocode
  components/
    shell/              header, system bar, footer, standby, skeleton, dashboard
    weather/            hero, radar scope, conditions, metric tiles, weather icons
    forecast/           hourly track + trend, seven-day list
    alerts/             alert panel and cards
    advanced/           collapsible metadata block
    ui/                 panel, readouts, notices, skeletons
  context/              ModeContext, LocationContext
  hooks/                useWeatherSnapshot, useMediaQuery
  lib/
    nws/                client, endpoints, cache windows, raw API types
    geocoding/          provider interface, Mapbox implementation, attribution
    weather/            aggregate, normalizers, units, formatting, freshness, severity
    location/           storage, external stores, geolocation, quick locations
  types/                normalized application models
  styles/               tokens, base, backdrop, components, dashboard
```

---

## Deploying to Vercel

This is a standalone project. It does **not** share a Vercel project with the portfolio.

1. Push this repository to GitHub as its own repo.
2. In Vercel, **Add New → Project**, import that repo. The framework preset detects
   Next.js; leave the build settings at their defaults.
3. Under **Settings → Environment Variables**, add `NWS_USER_AGENT` and
   `MAPBOX_ACCESS_TOKEN` for Production, Preview, and Development.
4. Deploy.
5. Under **Settings → Domains**, add `weather.alexball.dev`. Because `alexball.dev` is
   already a domain in the same Vercel account, Vercel adds the subdomain's DNS record for
   you — the apex domain and its existing project are untouched.

A subdomain assigned to this project cannot affect the project serving `alexball.dev`;
they are separate projects with separate deployments.

---

## Not in this release

Radar, an alerts browser, and forecast discussion are deliberately absent. The radar scope
in the interface is a design element with no data behind it, and `src/lib/nav.ts` holds
the shape the navigation will take when those products actually exist.

---

Built by [Alexander D. Ball](https://alexball.dev). Weather data courtesy of
NOAA / the National Weather Service. Geocoding © Mapbox · © OpenStreetMap.
