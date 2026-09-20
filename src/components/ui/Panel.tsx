import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Renders as <section> with an accessible name when a labelledBy id is supplied. */
  labelledBy?: string;
  as?: 'section' | 'div';
}

/** The surface primitive every dashboard panel is built on. */
export function Panel({ children, className, labelledBy, as = 'section' }: PanelProps) {
  const Tag = as;
  return (
    <Tag className={['panel', className].filter(Boolean).join(' ')} aria-labelledby={labelledBy}>
      {children}
    </Tag>
  );
}

interface PanelHeaderProps {
  title: string;
  id?: string;
  aside?: ReactNode;
}

/** Eyebrow-style panel header: mono label with the gold tick, optional right-hand readout. */
export function PanelHeader({ title, id, aside }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <h2 className="eyebrow" id={id}>
        {title}
      </h2>
      {aside ? <div className="panel-header__aside">{aside}</div> : null}
    </div>
  );
}

/** Instrument-frame brackets. Decorative only. */
export function Corners() {
  return (
    <div className="corners" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
