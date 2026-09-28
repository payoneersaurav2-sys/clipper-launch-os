import { createContext, useContext, useEffect, useMemo } from 'react'

export type AppearanceMode = 'dark'

export function applyAppearance() {
  const root = document.documentElement
  root.dataset.theme = 'dark'
  root.classList.add('dark')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080808')
  return 'dark'
}

type AppearanceValue = {
  mode: AppearanceMode
  resolvedMode: 'dark'
  setMode: (mode: AppearanceMode) => void
}

const AppearanceContext = createContext<AppearanceValue | null>(null)

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyAppearance()
  }, [])

  const value = useMemo<AppearanceValue>(
    () => ({ mode: 'dark', resolvedMode: 'dark', setMode: () => {} }),
    [],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider')
  return ctx
}

export function AppearanceToggle() {
  // Light mode removed
  return null
}
