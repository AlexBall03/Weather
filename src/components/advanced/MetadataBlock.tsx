'use client';

import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { COMPACT_QUERY, useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * A titled block of technical metadata. On desktop it is simply a labelled block; below
 * the stacking breakpoint it becomes a real disclosure so advanced metadata folds away
 * instead of pushing alerts and the forecast off a phone screen.
 */
export function MetadataBlock({ title, children }: { title: string; children: ReactNode }) {
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [expanded, setExpanded] = useState(false);

  return (
    <details
      className="meta-block"
      open={!isCompact || expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary className="meta-block__summary">
        <span className="eyebrow">{title}</span>
        <ChevronDown className="meta-block__chevron" size={14} aria-hidden="true" />
      </summary>
      <div className="meta-block__body">{children}</div>
    </details>
  );
}
