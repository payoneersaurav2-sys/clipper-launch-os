import { createContext, useContext, useEffect, useMemo } from 'react';

export type AppearanceMode = 'dark'; // Force dark mode only

type AppearanceContextValue = {
  mode: AppearanceMode;
  resolvedMode: 'dark';
  setMode: (mode: AppearanceMode) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function applyAppearance() {
  const root = document.documentElement;
  root.dataset.theme = 'dark';
  root.classList.add('dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080808');
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  // Always enforce dark mode on mount
  useEffect(() => {
    applyAppearance();
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({ 
    mode: 'dark', 
    resolvedMode: 'dark', 
    setMode: () => {} // No-op
  }), []);
  
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used within AppearanceProvider');
  return value;
}
