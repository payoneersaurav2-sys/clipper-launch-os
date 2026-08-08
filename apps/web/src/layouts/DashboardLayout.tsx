import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  LayoutDashboard, Lightbulb, PenTool, Type, Rocket, 
  Video, Library, TerminalSquare, LineChart, Settings,
  Search, LogOut, ChevronLeft, ChevronRight, UserCircle, HelpCircle, Tag, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import Wordmark from '@/components/Wordmark';
import BrandMark from '@/components/BrandMark';
import { CommandPalette } from '@/components/CommandPalette';
import { NotificationCenter } from '@/components/NotificationCenter';
import { ProductTour, useTour } from '@/components/ProductTour';
import { FeedbackWidget } from '@/components/FeedbackWidget';

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
  const { signOut, user } = useAuthStore();

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
          <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[12px] font-medium text-primary shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'C'}
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
  const { showTour, completeTour } = useTour();
  const location = useLocation();

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
            className="fixed top-0 left-0 h-full w-[280px] z-50 flex flex-col border-r border-white/[0.08] bg-[#080808] shadow-2xl lg:hidden"
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
        'hidden lg:flex flex-col border-r border-white/[0.06] bg-[linear-gradient(180deg,#0b0b0b_0%,#080808_45%)] transition-all duration-300 z-20 shrink-0',
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
    </div>
  );
}
