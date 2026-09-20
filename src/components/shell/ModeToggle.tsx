'use client';

import { useMode } from '@/context/ModeContext';
import type { DisplayMode } from '@/lib/location/storage';

const OPTIONS: Array<{ value: DisplayMode; label: string }> = [
  { value: 'simple', label: 'Simple' },
  { value: 'advanced', label: 'Advanced' },
];

/**
 * A radiogroup rather than a checkbox: the control has two named states and both need to
 * be announceable. The saved preference arrives through useSyncExternalStore, so the
 * control is interactive from the first client commit.
 *
 * Each option carries its own accent — Simple sits on the app's blue, Advanced on gold —
 * so the mark of "you are in the technical view" is visible at a glance.
 */
export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="mode-toggle" role="radiogroup" aria-label="Detail level">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={mode === option.value}
          className={`mode-toggle__option mode-toggle__option--${option.value}`}
          onClick={() => setMode(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
