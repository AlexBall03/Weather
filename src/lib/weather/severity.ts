import type { AlertCategory, AlertLevel } from '@/types/weather';

/**
 * Alert presentation is driven by real NWS product semantics, not by painting everything
 * red. The product *category* comes from the event name (every NWS headline ends in
 * Warning / Watch / Advisory / Statement / Emergency), and the colour *level* comes from
 * the CAP severity field, floored by category so an advisory can never outrank a warning.
 */
export function alertCategory(event: string): AlertCategory {
  const name = event.toLowerCase();
  if (name.includes('warning') || name.includes('emergency')) return 'warning';
  if (name.includes('watch')) return 'watch';
  if (name.includes('advisory')) return 'advisory';
  return 'statement';
}

export function alertLevel(severity: string | null | undefined, category: AlertCategory): AlertLevel {
  switch ((severity ?? '').toLowerCase()) {
    case 'extreme':
      return 'extreme';
    case 'severe':
      return 'severe';
    case 'moderate':
      return 'moderate';
    case 'minor':
      return 'minor';
    default:
      // CAP severity is occasionally "Unknown". Fall back to what the product type implies.
      return category === 'warning' ? 'severe' : category === 'watch' ? 'moderate' : 'minor';
  }
}

export const CATEGORY_LABEL: Record<AlertCategory, string> = {
  warning: 'WARNING',
  watch: 'WATCH',
  advisory: 'ADVISORY',
  statement: 'STATEMENT',
};

/** Sort order for the alert list: the most consequential product first. */
const LEVEL_RANK: Record<AlertLevel, number> = {
  extreme: 0,
  severe: 1,
  moderate: 2,
  minor: 3,
  unknown: 4,
};

export function compareAlertLevel(a: AlertLevel, b: AlertLevel): number {
  return LEVEL_RANK[a] - LEVEL_RANK[b];
}
