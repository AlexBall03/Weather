'use client';

import type { ReactNode } from 'react';

import { AppFooter } from '@/components/shell/AppFooter';
import { AppHeader } from '@/components/shell/AppHeader';
import { SystemBar } from '@/components/shell/SystemBar';
import { useMode } from '@/context/ModeContext';

/**
 * Chrome around the dashboard. `data-mode` on <main> is what lets Advanced tighten the
 * rhythm through CSS custom properties without any component re-rendering differently
 * for layout reasons.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { mode } = useMode();

  return (
    <div className="shell">
      <AppHeader />
      <SystemBar />
      <main className="wrap main" id="main" data-mode={mode}>
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
