/**
 * Sections the shell knows about. Radar, alerts and forecast discussion are real products
 * we intend to build, so the shell is shaped for them — but only `active` entries render,
 * because shipping visible dead links is worse than shipping one good page.
 */
export interface NavSection {
  id: string;
  label: string;
  href: string;
  status: 'active' | 'planned';
}

export const NAV_SECTIONS: readonly NavSection[] = [
  { id: 'weather', label: 'WEATHER', href: '/', status: 'active' },
];

export const ACTIVE_NAV_SECTIONS = NAV_SECTIONS.filter((section) => section.status === 'active');
