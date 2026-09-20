import { useId } from 'react';

import type { HourlyPeriod } from '@/types/weather';

/**
 * A lightweight temperature curve with precipitation bars beneath it, drawn inline in SVG.
 * A charting library would be several hundred kilobytes for one sparkline, and this needs
 * to line up exactly with the hourly columns below it — so it is hand-drawn at the same
 * column pitch.
 */

const HEIGHT = 74;
const TOP_PAD = 12;
const BOTTOM_PAD = 26;
const MAX_BAR = 20;

interface HourlyTrendProps {
  periods: HourlyPeriod[];
  columnWidth: number;
}

export function HourlyTrend({ periods, columnWidth }: HourlyTrendProps) {
  const gradientId = useId();
  const width = periods.length * columnWidth;

  const temperatures = periods
    .map((period) => period.temperatureF)
    .filter((value): value is number => value !== null);

  // Fewer than two readings cannot describe a trend; render nothing rather than a flat lie.
  if (temperatures.length < 2) return null;

  const min = Math.min(...temperatures);
  const max = Math.max(...temperatures);
  const span = max - min || 1;

  const points = periods.map((period, index) => {
    const x = index * columnWidth + columnWidth / 2;
    const y =
      period.temperatureF === null
        ? null
        : HEIGHT - BOTTOM_PAD - ((period.temperatureF - min) / span) * (HEIGHT - TOP_PAD - BOTTOM_PAD);
    return { x, y };
  });

  const drawn = points.filter((point): point is { x: number; y: number } => point.y !== null);
  if (drawn.length < 2) return null;

  const line = drawn.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`).join(' ');
  const area = `${line} L${drawn[drawn.length - 1].x} ${HEIGHT - BOTTOM_PAD} L${drawn[0].x} ${
    HEIGHT - BOTTOM_PAD
  } Z`;

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
          <stop offset="0%" stopColor="#6BA5FB" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#6BA5FB" stopOpacity="0" />
        </linearGradient>
      </defs>

      {periods.map((period, index) => {
        const probability = period.precipProbability ?? 0;
        if (probability <= 0) return null;
        const barHeight = (probability / 100) * MAX_BAR;
        return (
          <rect
            key={period.startTime}
            className="trend__bar"
            x={index * columnWidth + columnWidth / 2 - 6}
            y={HEIGHT - barHeight}
            width={12}
            height={barHeight}
            rx={2}
          />
        );
      })}

      <path d={area} fill={`url(#${gradientId})`} />
      <path className="trend__line" d={line} />
    </svg>
  );
}
