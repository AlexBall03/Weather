import { useId } from 'react';

import type { HourlyPeriod } from '@/types/weather';

/**
 * Temperature curve with precipitation-chance bars beneath it, drawn inline in SVG. A
 * charting library would be hundreds of kilobytes for one sparkline, and this has to line
 * up exactly with the hourly columns below — so it is hand-drawn at the same column pitch.
 *
 * The curve runs edge to edge: readings sit at column centres, and the first and last are
 * carried flat out to the panel edges so the line does not float in a half-column gutter.
 */

const HEIGHT = 78;
const TOP_PAD = 14;
const BOTTOM_PAD = 26;
const MAX_BAR = 20;

export interface TrendRange {
  min: number;
  max: number;
}

/** The temperature span the curve is drawn against, for the panel's legend. */
export function hourlyTrendRange(periods: HourlyPeriod[]): TrendRange | null {
  const temps = periods
    .map((period) => period.temperatureF)
    .filter((value): value is number => value !== null);
  if (temps.length < 2) return null;
  return { min: Math.min(...temps), max: Math.max(...temps) };
}

interface HourlyTrendProps {
  periods: HourlyPeriod[];
  columnWidth: number;
  range: TrendRange;
}

export function HourlyTrend({ periods, columnWidth, range }: HourlyTrendProps) {
  const gradientId = useId();
  const width = periods.length * columnWidth;
  const span = range.max - range.min || 1;

  const yFor = (temperature: number) =>
    HEIGHT - BOTTOM_PAD - ((temperature - range.min) / span) * (HEIGHT - TOP_PAD - BOTTOM_PAD);

  const points = periods
    .map((period, index) =>
      period.temperatureF === null
        ? null
        : { x: index * columnWidth + columnWidth / 2, y: yFor(period.temperatureF) },
    )
    .filter((point): point is { x: number; y: number } => point !== null);

  if (points.length < 2) return null;

  // Carry the end readings flat to the panel edges.
  const drawn = [
    { x: 0, y: points[0].y },
    ...points,
    { x: width, y: points[points.length - 1].y },
  ];

  const line = drawn.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
  const area = `${line} L${width} ${HEIGHT - BOTTOM_PAD} L0 ${HEIGHT - BOTTOM_PAD} Z`;

  const hasPrecip = periods.some((period) => (period.precipProbability ?? 0) > 0);

  return (
    <svg
      className="trend"
      width={width}
      height={HEIGHT}
      viewBox={`0 0 ${width} ${HEIGHT}`}
      aria-hidden="true"
      focusable="false"
      style={{ width }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6BA5FB" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6BA5FB" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Reference lines at the high and the low, so the curve has a readable scale. */}
      <line className="trend__grid" x1="0" y1={yFor(range.max)} x2={width} y2={yFor(range.max)} />
      <line className="trend__grid" x1="0" y1={yFor(range.min)} x2={width} y2={yFor(range.min)} />

      {hasPrecip
        ? periods.map((period, index) => {
            const probability = period.precipProbability ?? 0;
            if (probability <= 0) return null;
            const barHeight = (probability / 100) * MAX_BAR;
            return (
              <rect
                key={period.startTime}
                className="trend__bar"
                x={index * columnWidth + columnWidth / 2 - 7}
                y={HEIGHT - barHeight}
                width={14}
                height={barHeight}
                rx={2}
              />
            );
          })
        : null}

      <path d={area} fill={`url(#${gradientId})`} />
      <path className="trend__line" d={line} />
    </svg>
  );
}
