import { useId } from 'react';

/**
 * A radar scope drawn purely as design: range rings, cardinal headings, degree ticks, a
 * crosshair and a slow sweep. It carries no weather data and never will — real radar is a
 * separate product. It exists to give the current-conditions area the feel of an
 * instrument rather than a phone widget.
 *
 * The sweep is a 24-second linear rotation at low opacity and stops entirely under
 * `prefers-reduced-motion` (see dashboard.css).
 */

const RINGS = [12, 24, 36, 47] as const;
const CARDINALS: Array<{ label: string; x: number; y: number }> = [
  { label: 'N', x: 50, y: 6.5 },
  { label: 'E', x: 95, y: 51.5 },
  { label: 'S', x: 50, y: 97 },
  { label: 'W', x: 5, y: 51.5 },
];

/** Tick marks every 15 degrees around the outer ring. */
const TICKS = Array.from({ length: 24 }, (_, index) => index * 15);

interface RadarScopeProps {
  className?: string;
  /** Turns off the sweep for the small standby mark, where stillness reads better. */
  animated?: boolean;
}

export function RadarScope({ className, animated = true }: RadarScopeProps) {
  const gradientId = useId();

  return (
    <svg
      className={['scope', className].filter(Boolean).join(' ')}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0.5" y1="1" x2="0.5" y2="0">
          <stop offset="0%" stopColor="#6BA5FB" stopOpacity="0" />
          <stop offset="100%" stopColor="#6BA5FB" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      {RINGS.map((radius, index) => (
        <circle
          key={radius}
          className={`scope__ring${index === RINGS.length - 1 ? ' scope__ring--outer' : ''}`}
          cx="50"
          cy="50"
          r={radius}
        />
      ))}

      <path className="scope__cross" d="M50 3v94" />
      <path className="scope__cross" d="M3 50h94" />

      {TICKS.map((degrees) => {
        const radians = ((degrees - 90) * Math.PI) / 180;
        const inner = degrees % 45 === 0 ? 43 : 45;
        return (
          <line
            key={degrees}
            className="scope__tick"
            x1={50 + Math.cos(radians) * inner}
            y1={50 + Math.sin(radians) * inner}
            x2={50 + Math.cos(radians) * 47}
            y2={50 + Math.sin(radians) * 47}
          />
        );
      })}

      {CARDINALS.map(({ label, x, y }) => (
        <text key={label} className="scope__cardinal" x={x} y={y} textAnchor="middle">
          {label}
        </text>
      ))}

      {animated ? (
        <g className="scope__sweep">
          {/* A 60-degree wedge from the origin, fading toward the trailing edge. */}
          <path d="M50 50 L50 3 A47 47 0 0 1 90.7 26.5 Z" fill={`url(#${gradientId})`} />
        </g>
      ) : null}
    </svg>
  );
}
