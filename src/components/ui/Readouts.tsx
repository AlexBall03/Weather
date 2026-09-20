import type { ReactNode } from 'react';

import { EM_DASH } from '@/lib/weather/format';
import type { ObservationFreshness } from '@/types/weather';

interface MetaRow {
  label: string;
  value: string | null;
  /** Suppresses the row entirely rather than printing a dash, for genuinely optional fields. */
  omitWhenEmpty?: boolean;
}

/**
 * The advanced-mode readout: a mono label column against a value column. Missing values
 * print an em dash — never a zero, never a guess.
 */
export function MetaTable({ rows, className }: { rows: MetaRow[]; className?: string }) {
  const visible = rows.filter((row) => !(row.omitWhenEmpty && !row.value));
  if (visible.length === 0) return null;

  return (
    <dl className={['meta-table', className].filter(Boolean).join(' ')}>
      {visible.map((row) => (
        <div className="meta-row" key={row.label}>
          <dt className="meta-row__label">{row.label}</dt>
          <dd
            className={`meta-row__value${row.value ? '' : ' meta-row__value--dim'}`}
            style={{ margin: 0 }}
          >
            {row.value ?? EM_DASH}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const FRESHNESS_CLASS: Record<ObservationFreshness | 'off', string> = {
  live: 'status-live',
  recent: 'status-recent',
  stale: 'status-stale',
  off: 'status-off',
};

/** Colour plus an explicit text label — status is never communicated by colour alone. */
export function StatusDot({ state }: { state: ObservationFreshness | 'off' }) {
  return <span className={`status-dot ${FRESHNESS_CLASS[state]}`} aria-hidden="true" />;
}

export function Skeleton({
  width,
  height,
  radius,
}: {
  width?: string | number;
  height?: string | number;
  radius?: string;
}) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width: width ?? '100%', height: height ?? 14, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

interface NoticeProps {
  tone?: 'neutral' | 'error' | 'info';
  icon?: ReactNode;
  title: string;
  message: string;
  actions?: ReactNode;
}

/** The shared shape for every error, empty, and unavailable state in the app. */
export function Notice({ tone = 'neutral', icon, title, message, actions }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {icon ? (
        <span className="notice__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="notice__title">{title}</p>
        <p className="notice__message">{message}</p>
        {actions ? <div className="notice__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
