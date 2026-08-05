import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Lightbulb, PenTool, Type, Rocket, 
  Video, Library, TerminalSquare, LineChart, Settings,
  Search, LogOut, ChevronLeft, ChevronRight, UserCircle, HelpCircle, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import Wordmark from '@/components/Wordmark';
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

export default function DashboardLayout() {
  const [collapsed, setCollapsed]  = useState(false);
  const [cmdOpen, setCmdOpen]      = useState(false);
  const { showTour, completeTour } = useTour();
  const location  = useLocation();
  const navigate  = useNavigate();
  const { signOut, user } = useAuthStore();
  useWorkspaces();

  // ⌘K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const isActive = (href: string) =>
    href === '/dashboard' ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808] font-sans text-[#FAFAFA]">

      {/* ---- Sidebar ---------------------------------------- */}
      <aside className={cn(
        'flex flex-col border-r border-white/[0.06] bg-[#080808] transition-all duration-300 z-20 shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}>
        {/* Logo + collapse toggle */}
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && <Wordmark size="md" href="/dashboard" />}
          {collapsed && (
            <span className="w-full flex justify-center font-bold text-[13px] tracking-[-0.04em]">
              <span className="text-[#FAFAFA]">C</span><span className="text-primary">O</span>
            </span>
          )}
          <button onClick={() => setCollapsed(v => !v)}
            className="shrink-0 text-[#71717A] hover:text-[#FAFAFA] transition-colors p-1 rounded-[6px] hover:bg-white/[0.05]">
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Search shortcut */}
        {!collapsed && (
          <div className="px-4 mb-2">
            <button onClick={() => setCmdOpen(true)}
              className="w-full flex items-center gap-2.5 h-9 px-3 rounded-[10px] bg-white/[0.04] border border-white/[0.05] text-[#71717A] text-[13px] hover:bg-white/[0.06] transition-colors">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Search…</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono">⌘K</kbd>
            </button>
          </div>
        )}
        {collapsed && (
          <div className="px-3 mb-2">
            <button onClick={() => setCmdOpen(true)}
              className="w-full flex justify-center p-2 rounded-[10px] hover:bg-white/[0.05] transition-colors text-[#71717A] hover:text-[#FAFAFA]">
              <Search className="h-4 w-4" />
            </button>
          </div>
        )}

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
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition-all duration-150 group',
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
                <button onClick={handleLogout}
                  className="text-[#71717A] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-[6px] hover:bg-red-400/10">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ---- Main ------------------------------------------ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between px-8 border-b border-white/[0.04] shrink-0">
          <div className="text-[13px] text-[#71717A]">
            {navGroups.flatMap(g => g.items).find(i => isActive(i.href))?.name ?? 'Dashboard'}
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 lg:p-10 selection:bg-primary/30">
          <Outlet />
        </main>
      </div>

      {/* ---- Command Palette -------------------------------- */}
      <AnimatePresence>
        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      </AnimatePresence>

      {/* ---- Product Tour ---------------------------------- */}
      {showTour && <ProductTour onComplete={completeTour} />}

      {/* ---- Feedback Widget ------------------------------- */}
      <FeedbackWidget />
    </div>
  );
}
