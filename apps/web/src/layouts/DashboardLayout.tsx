import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LayoutDashboard, Lightbulb, PenTool, Type, Rocket, 
  Video, Library, TerminalSquare, LineChart, Settings,
  Search, LogOut, ChevronLeft, ChevronRight, UserCircle, HelpCircle, Tag, Menu, X, Coins, Sparkles, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useCredits } from '@/hooks/useCredits';
import Wordmark from '@/components/Wordmark';
import BrandMark from '@/components/BrandMark';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ProductTour, useTour } from '@/components/ProductTour';
import { FeedbackWidget } from '@/components/FeedbackWidget';
import { AppearanceSwitcher } from '@/components/AppearanceSwitcher';

// ---- Nav groups ---------------------------------------------
const navGroups = [
  {
    label: 'Workspace',
    items: [
      { name: 'Dashboard',      href: '/dashboard',                icon: LayoutDashboard },
      { name: 'Idea Studio',    href: '/dashboard/idea-studio',    icon: Lightbulb },
      { name: 'Hook Engine',    href: '/dashboard/hook-engine',    icon: PenTool },
      { name: 'Caption OS',     href: '/dashboard/caption-os',     icon: Type },
    ],
  },
  {
    label: 'Production',
    items: [
      { name: 'Campaign OS',    href: '/dashboard/campaign-os',    icon: Rocket },
      { name: 'Clip Pipeline',  href: '/dashboard/clip-pipeline',  icon: Video },
      { name: 'Launch Center',  href: '/dashboard/launch-center',  icon: Rocket },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Analytics',      href: '/dashboard/analytics',      icon: LineChart },
      { name: 'Knowledge Vault',href: '/dashboard/knowledge-vault',icon: Library },
      { name: 'Prompt Library', href: '/dashboard/prompt-library', icon: TerminalSquare },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'AI Settings', href: '/dashboard/ai-settings', icon: Settings },
      { name: 'Credits',     href: '/dashboard/credits',     icon: Coins },
      { name: 'Settings',    href: '/dashboard/settings',    icon: UserCircle },
      { name: 'Help',        href: '/dashboard/help',        icon: HelpCircle },
      { name: 'Changelog',   href: '/dashboard/changelog',   icon: Tag },
    ],
  },
];

// ---- Sidebar Nav Content ------------------------------------
function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [cmdOpen, setCmdOpen] = useState(false);
  const { signOut, user, avatarUrl } = useAuthStore();

  const isActive = (href: string) =>
    href === '/dashboard' ? location.pathname === href : location.pathname.startsWith(href);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  return (
    <>
      {/* Search shortcut */}
      <div className={cn('px-3 mb-2', collapsed ? 'px-3' : 'px-4')}>
        {!collapsed ? (
          <button onClick={() => setCmdOpen(true)}
            className="w-full flex items-center gap-2.5 h-9 px-3 rounded-[10px] bg-white/[0.04] border border-white/[0.05] text-[#71717A] text-[13px] hover:bg-white/[0.06] transition-colors">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono">⌘K</kbd>
          </button>
        ) : (
          <button onClick={() => setCmdOpen(true)}
            className="w-full flex justify-center p-2 rounded-[10px] hover:bg-white/[0.05] transition-colors text-[#71717A] hover:text-[#FAFAFA]">
            <Search className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold text-[#71717A] uppercase tracking-widest px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <nav className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(item.href);
                return (
                  <Link key={item.name} to={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.name : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'os-glow-sweep flex min-h-9 items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      active
                        ? 'bg-primary/[0.10] text-primary'
                        : 'text-[#71717A] hover:bg-white/[0.04] hover:text-[#FAFAFA]',
                      collapsed && 'justify-center px-0 py-2.5'
                    )}>
                    <item.icon className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-105', active ? 'text-primary' : 'text-[#71717A]')} />
                    {!collapsed && <span className="tracking-tight">{item.name}</span>}
                    {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User / logout */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className={cn('flex items-center gap-3 p-2 rounded-[10px] hover:bg-white/[0.04] transition-colors cursor-pointer group', collapsed && 'justify-center')}>
          <div className="h-7 w-7 overflow-hidden rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[12px] font-medium text-primary shrink-0">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : (user?.email?.charAt(0).toUpperCase() || 'C')}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-[#FAFAFA] truncate">{user?.email?.split('@')[0] || 'Creator'}</p>
                <p className="text-[10px] text-[#71717A]">Active</p>
              </div>
              <button onClick={handleLogout} aria-label="Sign out"
                className="text-[#71717A] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-[6px] hover:bg-red-400/10">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [creditNotice, setCreditNotice] = useState<string | null>(null);
  const { showTour, completeTour } = useTour();
  const location = useLocation();
  const { data: creditBalance } = useCredits();
  const lowCreditPromptShown = useRef(false);

  useWorkspaces();

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
      else setCollapsed(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const available = creditBalance?.available;
    if (lowCreditPromptShown.current || available === undefined || available <= 0) return;
    const threshold = creditBalance?.tier === 'free' ? 25 : 50;
    if (available <= threshold) {
      lowCreditPromptShown.current = true;
      setCreditNotice(`Only ${available} credits remain.`);
    }
  }, [creditBalance?.available, creditBalance?.tier]);

  useEffect(() => {
    const handleCreditRequirement = (event: Event) => {
      const detail = event as CustomEvent<string>;
      setCreditNotice(detail.detail || 'Not enough CreatorOS credits for this action.');
    };
    window.addEventListener('creator-os-credit-required', handleCreditRequirement);
    return () => window.removeEventListener('creator-os-credit-required', handleCreditRequirement);
  }, []);

  // ⌘K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const currentPageName = navGroups
    .flatMap(g => g.items)
    .find(i => i.href === '/dashboard' ? location.pathname === i.href : location.pathname.startsWith(i.href))
    ?.name ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808] font-sans text-[#FAFAFA]">

      {/* ---- Mobile Overlay ---------------------------------- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ---- Mobile Drawer ----------------------------------- */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="os-sidebar fixed top-0 left-0 h-full w-[280px] z-50 flex flex-col border-r border-white/[0.08] bg-[#080808] shadow-2xl lg:hidden"
          >
            {/* Mobile drawer header */}
            <div className="flex h-16 items-center justify-between px-4 shrink-0">
              <Wordmark size="md" href="/dashboard" />
              <button onClick={() => setMobileOpen(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] p-1.5 rounded-[8px] hover:bg-white/[0.05]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---- Desktop Sidebar --------------------------------- */}
      <aside className={cn(
        'os-sidebar hidden lg:flex flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,#0b0b0b_0%,#080808_45%)] transition-all duration-300 z-20 shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}>
        {/* Logo + collapse toggle */}
        <div className="flex h-16 items-center justify-between px-4 shrink-0">
          {!collapsed && <Wordmark size="md" href="/dashboard" />}
          {collapsed && <span className="flex w-full justify-center"><BrandMark size="sm" /></span>}
          <button onClick={() => setCollapsed(v => !v)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="shrink-0 text-[#71717A] hover:text-[#FAFAFA] transition-colors p-1.5 rounded-[8px] hover:bg-white/[0.05]">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* ---- Main ------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex h-14 lg:h-16 items-center justify-between px-4 lg:px-8 border-b border-white/[0.05] bg-[#080808]/80 backdrop-blur-md shrink-0 gap-3">
          {/* Mobile: hamburger */}
          <button
            className="lg:hidden min-h-10 min-w-10 text-[#71717A] hover:text-[#FAFAFA] p-1.5 rounded-[8px] hover:bg-white/[0.05] transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.14em] text-[#71717A] sm:block">Creator OS</span>
            <span className="block truncate text-[13px] font-medium text-[#FAFAFA]">{currentPageName}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/dashboard/credits"
              aria-label={`${creditBalance?.available ?? 0} CreatorOS credits available`}
              className={cn(
                'os-glow-sweep inline-flex min-h-10 items-center gap-2 rounded-[10px] border px-2.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                (creditBalance?.available ?? 0) <= 50
                  ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-[#D4D4D8] hover:border-primary/35 hover:text-[#FAFAFA]'
              )}
              title={(creditBalance?.available ?? 0) <= 50 ? 'Low credits — get more capacity' : 'CreatorOS credits'}
            >
              <Coins className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">{creditBalance?.available ?? '—'} credits</span>
              <span className="sm:hidden">{creditBalance?.available ?? '—'}</span>
            </Link>
            <AppearanceSwitcher />
            <NotificationCenter />
          </div>
        </header>

        {/* Page content — responsive padding */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 xl:p-10 selection:bg-primary/30">
          <Outlet />
        </main>
      </div>

      {/* ---- Product Tour ---------------------------------- */}
      {showTour && <ProductTour onComplete={completeTour} />}

      {/* ---- Feedback Widget ------------------------------- */}
      <FeedbackWidget />

      <AnimatePresence>
        {creditNotice && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="credit-upgrade-title" onClick={() => setCreditNotice(null)}>
            <motion.section initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: .18 }} onClick={event => event.stopPropagation()} className="relative w-full max-w-md overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#111111] p-6 shadow-[0_24px_80px_rgba(0,0,0,.6)] sm:p-7">
              <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              <button type="button" onClick={() => setCreditNotice(null)} className="absolute right-4 top-4 rounded-lg p-1.5 text-[#71717A] transition-colors hover:bg-white/[0.06] hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[14px] border border-primary/30 bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">CreatorOS capacity</p>
              <h2 id="credit-upgrade-title" className="mt-2 text-[22px] font-semibold tracking-tight text-[#FAFAFA]">{creditBalance?.tier === 'free' ? 'Keep your momentum going' : creditBalance?.tier === 'creator' ? 'Ready for more capacity?' : 'Add more creative capacity'}</h2>
              <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{creditBalance?.tier === 'free' ? 'You’ve experienced CreatorOS. Upgrade to unlock a larger monthly creative allowance and keep your workflow moving.' : creditNotice.replace(/^\[INSUFFICIENT_CREDITS\]\s*/, '')}</p>
              <div className="mt-6 space-y-2">
                {creditBalance?.tier === 'free' ? <Link to="/pricing" onClick={() => setCreditNotice(null)} className="flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-primary text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,.25)] transition hover:bg-primary/90">Explore Creator plans <ArrowUpRight className="h-4 w-4" /></Link> : <>
                  {creditBalance?.tier === 'creator' && <Link to="/pricing" onClick={() => setCreditNotice(null)} className="flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-primary text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,.25)] transition hover:bg-primary/90">Upgrade to Pro <ArrowUpRight className="h-4 w-4" /></Link>}
                  <Link to="/dashboard/credits" onClick={() => setCreditNotice(null)} className="flex h-11 w-full items-center justify-center rounded-[11px] border border-white/[0.1] bg-white/[0.03] text-sm font-semibold text-[#FAFAFA] transition hover:bg-white/[0.07]">Add credits</Link>
                </>}
                <button type="button" onClick={() => setCreditNotice(null)} className="h-9 w-full text-xs font-medium text-[#71717A] transition hover:text-[#D4D4D8]">Maybe later</button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
