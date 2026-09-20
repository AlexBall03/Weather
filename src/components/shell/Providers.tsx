'use client';

import type { ReactNode } from 'react';

import { LocationProvider } from '@/context/LocationContext';
import { ModeProvider } from '@/context/ModeContext';

/** Client boundary for the app. Mode wraps location so the shell can read both. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ModeProvider>
      <LocationProvider>{children}</LocationProvider>
    </ModeProvider>
  );
}
