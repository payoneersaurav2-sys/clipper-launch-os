import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppearanceMode = 'light' | 'dark' | 'system';

type AppearanceContextValue = {
  mode: AppearanceMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: AppearanceMode) => void;
};

const STORAGE_KEY = 'creator-os-appearance';
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function getSystemMode(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyAppearance(mode: AppearanceMode) {
  const resolvedMode = mode === 'system' ? getSystemMode() : mode;
  const root = document.documentElement;
  root.dataset.theme = resolvedMode;
  root.classList.toggle('dark', resolvedMode === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedMode === 'dark' ? '#080808' : '#F7F7FA');
  return resolvedMode;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() => applyAppearance(mode));

  useEffect(() => {
    setResolvedMode(applyAppearance(mode));
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemMode = () => {
      if (mode === 'system') setResolvedMode(applyAppearance('system'));
    };
    media.addEventListener('change', syncSystemMode);
    return () => media.removeEventListener('change', syncSystemMode);
  }, [mode]);

  const setMode = (nextMode: AppearanceMode) => {
    localStorage.setItem(STORAGE_KEY, nextMode);
    setModeState(nextMode);
  };

  const value = useMemo(() => ({ mode, resolvedMode, setMode }), [mode, resolvedMode]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error('useAppearance must be used within AppearanceProvider');
  return value;
}
