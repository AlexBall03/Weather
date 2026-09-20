'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

import {
  getModeServerSnapshot,
  getModeSnapshot,
  setStoredMode,
  subscribeToMode,
} from '@/lib/location/mode-store';
import type { DisplayMode } from '@/lib/location/storage';

interface ModeContextValue {
  mode: DisplayMode;
  isAdvanced: boolean;
  setMode: (mode: DisplayMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  // Server renders Simple; the stored preference is applied on the client's first commit.
  const mode = useSyncExternalStore(subscribeToMode, getModeSnapshot, getModeServerSnapshot);

  const setMode = useCallback((next: DisplayMode) => setStoredMode(next), []);

  const value = useMemo<ModeContextValue>(
    () => ({ mode, isAdvanced: mode === 'advanced', setMode }),
    [mode, setMode],
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) throw new Error('useMode must be used inside <ModeProvider>');
  return context;
}
