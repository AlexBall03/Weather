import type { ReactElement } from 'react';

import type { WeatherIconCode } from '@/types/weather';

/**
 * The app's weather icon set.
 *
 * NWS ships raster icons, but they are fixed-colour PNGs from a service the agency has
 * flagged as legacy. Drawing our own line glyphs instead keeps the weather in the same
 * visual language as the rest of the interface: single-weight strokes that inherit
 * `currentColor`, so severity colour and hover states apply without a second asset set.
 *
 * Every glyph is drawn on a 24x24 grid at a 1.5 stroke so they sit together at any size.
 */

interface IconProps {
  code: WeatherIconCode;
  /** Chooses the sun or moon variant for conditions that have one. */
  isDaytime?: boolean;
  size?: number;
  className?: string;
  /** Supply only when the icon is the sole carrier of meaning; otherwise it stays decorative. */
  label?: string;
}

const SUN_CORE = (
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>
);

const MOON_CORE = <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />;

const CLOUD = <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />;

const CLOUD_SMALL = <path d="M13 20H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />;

/** A wider cloud, so "few clouds" and "partly cloudy" are distinguished by cloud cover. */
const CLOUD_MID = <path d="M15.4 20.5H6.6a5.6 5.6 0 1 1 5.5-6.7h3.3a3.35 3.35 0 0 1 0 6.7Z" />;

const SUN_BEHIND = (
  <>
    <path d="M12 2v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="M20 12h2" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="M15.95 12.65a4 4 0 0 0-5.93-4.13" />
  </>
);

const MOON_BEHIND = <path d="M10.19 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.2" />;

/** Cloud base used by every precipitation glyph, sized to leave room beneath. */
const CLOUD_HIGH = <path d="M4 14.9A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.24" />;

function dayNight(isDaytime: boolean, day: ReactElement, night: ReactElement): ReactElement {
  return isDaytime ? day : night;
}

function glyph(code: WeatherIconCode, isDaytime: boolean): ReactElement {
  switch (code) {
    case 'clear':
      return dayNight(isDaytime, SUN_CORE, MOON_CORE);

    case 'few':
      return dayNight(
        isDaytime,
        <>
          {SUN_BEHIND}
          {CLOUD_SMALL}
        </>,
        <>
          {MOON_BEHIND}
          {CLOUD_SMALL}
        </>,
      );

    case 'scattered':
      return dayNight(
        isDaytime,
        <>
          {SUN_BEHIND}
          {CLOUD_MID}
        </>,
        <>
          {MOON_BEHIND}
          {CLOUD_MID}
        </>,
      );

    case 'broken':
      return (
        <>
          <path d="M10.5 5a5 5 0 0 1 4.9 4" />
          {CLOUD}
        </>
      );

    case 'overcast':
      return (
        <>
          <path d="M7 12a5 5 0 0 1 9-3" />
          {CLOUD}
        </>
      );

    case 'wind':
      return (
        <>
          <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
          <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
          <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
        </>
      );

    case 'rain':
      return (
        <>
          {CLOUD_HIGH}
          <path d="M8 19v2" />
          <path d="M12 20v2" />
          <path d="M16 19v2" />
        </>
      );

    case 'showers':
      return (
        <>
          {CLOUD_HIGH}
          <path d="M8 19v1" />
          <path d="M12 20v1" />
          <path d="M16 19v1" />
          <path d="M10 22v.5" />
          <path d="M14 22v.5" />
        </>
      );

    case 'thunderstorm':
      return (
        <>
          <path d="M6 16.3A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 .5 8.97" />
          <path d="m13 12-3 5h4l-3 5" />
        </>
      );

    case 'snow':
      return (
        <>
          {CLOUD_HIGH}
          <path d="M8 19h.01" />
          <path d="M8 22h.01" />
          <path d="M12 20h.01" />
          <path d="M12 23h.01" />
          <path d="M16 19h.01" />
          <path d="M16 22h.01" />
        </>
      );

    case 'sleet':
      return (
        <>
          {CLOUD_HIGH}
          <path d="M8 19v2" />
          <path d="M12 20h.01" />
          <path d="M16 19v2" />
          <path d="M10 22h.01" />
        </>
      );

    case 'freezing-rain':
      return (
        <>
          {CLOUD_HIGH}
          <path d="M12 18v5" />
          <path d="m10 20 4 2" />
          <path d="m14 20-4 2" />
          <path d="M7 19v2" />
          <path d="M17 19v2" />
        </>
      );

    case 'fog':
      return (
        <>
          {CLOUD_HIGH}
          <path d="M16 18H7" />
          <path d="M17 21.5H9" />
        </>
      );

    case 'haze':
      return (
        <>
          <path d="M12 3v1.5" />
          <path d="m5.6 5.6 1.1 1.1" />
          <path d="m18.4 5.6-1.1 1.1" />
          <path d="M16 12a4 4 0 1 0-8 0" />
          <path d="M3 15.5h18" />
          <path d="M5 19h14" />
          <path d="M8 22.5h8" />
        </>
      );

    case 'dust':
      return (
        <>
          <path d="M3 8h11a2.5 2.5 0 1 0-2.2-3.7" />
          <path d="M3 12.5h15a2.5 2.5 0 1 1-2.2 3.7" />
          <path d="M3 17h8" />
          <path d="M14 17h.01" />
          <path d="M17.5 17h.01" />
          <path d="M6 20.5h6" />
        </>
      );

    case 'smoke':
      return (
        <>
          <path d="M5 20h14" />
          <path d="M8 20c0-3 2.5-3.5 2.5-6S8 11 8 8.5 10 4.5 12 4.5" />
          <path d="M14.5 20c0-2.5 2-3 2-5s-1.8-2.6-1.8-4.4" />
        </>
      );

    case 'hot':
      return (
        <>
          <path d="M10 13.8V5a2 2 0 1 1 4 0v8.8a4.5 4.5 0 1 1-4 0Z" />
          <path d="M12 9.5v6.2" />
          <path d="M19 4.5v.01" />
          <path d="M21.5 8h.01" />
          <path d="M18 9.5h.01" />
        </>
      );

    case 'cold':
      return (
        <>
          <path d="M10 13.8V5a2 2 0 1 1 4 0v8.8a4.5 4.5 0 1 1-4 0Z" />
          <path d="M12 9.5v6.2" />
          <path d="M19 4v6" />
          <path d="m16.5 5.5 5 3" />
          <path d="m21.5 5.5-5 3" />
        </>
      );

    case 'unknown':
    default:
      return (
        <>
          {CLOUD}
          <path d="M9.5 10a2 2 0 0 1 3.4 1.4c0 1.3-2 1.6-2 2.6" />
          <path d="M11 16h.01" />
        </>
      );
  }
}

export function WeatherIcon({
  code,
  isDaytime = true,
  size = 24,
  className,
  label,
}: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {glyph(code, isDaytime)}
    </svg>
  );
}
