import type { ReactNode } from 'react';

import { EM_DASH } from '@/lib/weather/format';

interface MetricTileProps {
  label: string;
  value: string;
  detail?: string | null;
  icon?: ReactNode;
}

/** One reading in the hero's metric strip. Absent data dims rather than disappears. */
export function MetricTile({ label, value, detail, icon }: MetricTileProps) {
  const isEmpty = value === EM_DASH;
  return (
    <div className={`metric${isEmpty ? ' metric--empty' : ''}`}>
      <span className="metric__label">
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        {label}
      </span>
      <span className="metric__value tabular">{value}</span>
      {detail ? <span className="metric__detail">{detail}</span> : null}
    </div>
  );
}
