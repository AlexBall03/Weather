'use client';

import { LocationSearch } from '@/components/shell/LocationSearch';
import { ModeToggle } from '@/components/shell/ModeToggle';
import { ACTIVE_NAV_SECTIONS } from '@/lib/nav';

/**
 * Command-center header in three zones: identity left, location centre, detail level
 * right. "Use My Location" lives as a crosshair inside the search field rather than a
 * second wide button — one control for "where", one for "how much detail".
 *
 * On narrow screens the search drops to its own row and the toggle stays beside the mark.
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
          <nav className="header__nav" aria-label="Sections">
            <ul>
              {ACTIVE_NAV_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={section.href}>{section.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="header__search">
          <LocationSearch />
        </div>

        <div className="header__aside">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
