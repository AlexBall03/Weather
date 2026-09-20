/**
 * Display formatting. Every time-based helper takes the location's IANA zone explicitly —
 * the app formats timestamps in the *searched* location's time, never the viewer's, and
 * never a hardcoded zone.
 */

export const EM_DASH = '\u2014';

function formatter(timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone });
}

function parse(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "4:15 PM" */
export function formatTime(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return formatter(timeZone, { hour: 'numeric', minute: '2-digit' }).format(date);
}

/** "4 PM", or "NOW" when the hour contains the current moment. */
export function formatHourLabel(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return formatter(timeZone, { hour: 'numeric' }).format(date).replace(' ', '');
}

/** "MST" — the zone abbreviation at that instant, so DST is handled for us. */
export function formatZoneAbbreviation(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso) ?? new Date();
  const parts = formatter(timeZone, { timeZoneName: 'short' }).formatToParts(date);
  return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
}

/** "16:12 MST" — the operational clock readout used in the status strip. */
export function formatClock(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  const time = formatter(timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${time} ${formatZoneAbbreviation(iso, timeZone)}`.trim();
}

/** "Mon" */
export function formatWeekdayShort(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return formatter(timeZone, { weekday: 'short' }).format(date).toUpperCase();
}

/** "9/22" */
export function formatDateShort(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return formatter(timeZone, { month: 'numeric', day: 'numeric' }).format(date);
}

/** "Sep 22, 4:15 PM" — used for alert effective/expires stamps. */
export function formatStamp(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return EM_DASH;
  return formatter(timeZone, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Calendar-day key in the location's zone, so day/night periods group correctly. */
export function dayKey(iso: string | null | undefined, timeZone: string): string {
  const date = parse(iso);
  if (!date) return 'unknown';
  return formatter(timeZone, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** "00:06:41" — elapsed clock used for observation age in advanced mode. */
export function formatElapsed(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return EM_DASH;
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

/** "14 min ago" / "3 hr ago" — the plain-language form for simple mode. */
export function formatAge(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return EM_DASH;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** Temperatures render as a bare integer; the degree mark is drawn by the component. */
export function formatNumber(value: number | null, places = 0): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return value.toFixed(places);
}

export function formatTemperature(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${Math.round(value)}\u00B0`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${Math.round(value)}%`;
}

export function formatMph(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${Math.round(value)} mph`;
}

export function formatDegrees(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${Math.round(value)}\u00B0`;
}

/** "33.4484\u00B0N, 112.0740\u00B0W" */
export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(4)}\u00B0${latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(longitude).toFixed(4)}\u00B0${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}`;
}

/**
 * Wind reads as "Calm" at zero rather than "N 0 mph" — a direction on a calm wind is
 * meaningless, and that is how a station report would be read aloud.
 */
export function formatWind(speedMph: number | null, cardinal: string | null): string {
  if (speedMph === null || !Number.isFinite(speedMph)) return EM_DASH;
  if (speedMph === 0) return 'Calm';
  const speed = `${Math.round(speedMph)} mph`;
  return cardinal ? `${cardinal} ${speed}` : speed;
}
