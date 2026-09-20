'use client';

import { LocationSearch } from '@/components/shell/LocationSearch';
import { ModeToggle } from '@/components/shell/ModeToggle';
import { UseMyLocationButton } from '@/components/shell/UseMyLocationButton';
import { ACTIVE_NAV_SECTIONS } from '@/lib/nav';

/**
 * Command-center header: the mark on the left, location controls and the detail toggle on
 * the right. On narrow screens the controls drop to their own row rather than shrinking
 * into unusable targets.
 *
 * Navigation is driven by ACTIVE_NAV_SECTIONS. With one active section there is nothing to
 * navigate between, so no nav bar renders — the structure is there for when radar,
 * alerts and forecast discussion ship.
 */
export function AppHeader() {
  const showNav = ACTIVE_NAV_SECTIONS.length > 1;

  return (
    <header className="header">
      <div className="wrap header__inner">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            WX
          </span>
          <div className="brand__text">
            <h1 className="brand__name">WEATHER</h1>
            <span className="brand__url">weather.alexball.dev</span>
          </div>
        </div>

        {showNav ? (
          <nav aria-label="Sections">
            <ul style={{ display: 'flex', gap: 'var(--s-4)' }}>
              {ACTIVE_NAV_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={section.href}>{section.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="header__controls">
          <LocationSearch />
          <UseMyLocationButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
