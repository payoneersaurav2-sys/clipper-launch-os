import { AppearanceProvider } from '#/components/site/theme'
import { SiteFooter } from '#/components/site/footer'
import { SiteHeader } from '#/components/site/header'

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <AppearanceProvider>
      <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </AppearanceProvider>
  )
}
