import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Lightbulb, PenTool, Type, Rocket, 
  ListTodo, Library, TerminalSquare, LineChart, Settings,
  Bell, Search, Menu, LogOut, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: '⌘D' },
  { name: 'Idea Studio', href: '/dashboard/idea-studio', icon: Lightbulb, shortcut: '⇧I' },
  { name: 'Hook Engine', href: '/dashboard/hook-engine', icon: PenTool, shortcut: '⇧H' },
  { name: 'Caption OS', href: '/dashboard/caption-os', icon: Type, shortcut: '⇧C' },
  { name: 'Launch Center', href: '/dashboard/launch-center', icon: Rocket, shortcut: '⇧L' },
  { name: 'Clip Tracker', href: '/dashboard/clip-tracker', icon: ListTodo, shortcut: '⇧T' },
  { name: 'Knowledge Vault', href: '/dashboard/knowledge-vault', icon: Library, shortcut: '⇧K' },
  { name: 'Prompt Library', href: '/dashboard/prompt-library', icon: TerminalSquare, shortcut: '⇧P' },
  { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart, shortcut: '⇧A' },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuthStore();
  const { data: workspaces, isLoading } = useWorkspaces();
  const { activeWorkspace } = useWorkspaceStore();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#080808] font-sans text-[#FAFAFA]">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-white/[0.06] bg-[#080808] transition-all duration-300 z-20",
        collapsed ? "w-[80px]" : "w-[260px]"
      )}>
        <div className="flex h-20 items-center justify-between px-6 border-b border-transparent">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-[10px] bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <span className="font-bold text-white text-[11px] tracking-tighter">CR</span>
              </div>
              <span className="font-semibold tracking-tight text-[15px]">Creator OS</span>
            </div>
          )}
          {collapsed && (
            <div className="h-7 w-7 mx-auto rounded-[10px] bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
               <span className="font-bold text-white text-[11px] tracking-tighter">CR</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-auto py-6 px-4">
          <nav className="grid gap-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-primary/[0.08] text-primary" 
                      : "text-[#A1A1AA] hover:bg-white/[0.03] hover:text-[#FAFAFA]",
                    collapsed ? "justify-center px-0" : ""
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn("h-[16px] w-[16px] shrink-0 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary" : "text-[#71717A]")} />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between">
                      <span className="tracking-tight">{item.name}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 flex flex-col gap-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[14px] font-medium transition-all hover:bg-white/[0.03] hover:text-[#FAFAFA] text-[#A1A1AA]",
              collapsed ? "justify-center px-0" : ""
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="h-[16px] w-[16px] shrink-0 text-[#71717A]" />
            {!collapsed && <span className="tracking-tight">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808]">
        {/* Top Navigation */}
        <header className="flex h-20 items-center justify-end gap-6 px-8 lg:px-12 bg-transparent z-10 border-b border-white/[0.02]">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/[0.03] rounded-full h-9 w-9 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
            </Button>
            <div className="flex items-center gap-3 pl-6 border-l border-white/[0.06] cursor-pointer group">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-[13px] font-medium tracking-tight text-[#FAFAFA] group-hover:text-primary transition-colors">
                  {user?.email?.split('@')[0] || 'Creator'}
                </span>
                <span className="text-[11px] text-[#71717A] tracking-wide">Workspace</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-[#111111] border border-white/[0.06] flex items-center justify-center text-[13px] font-medium text-[#FAFAFA] overflow-hidden group-hover:border-primary/50 transition-colors">
                {user?.email?.charAt(0).toUpperCase() || 'C'}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8 lg:p-12 relative selection:bg-primary/30">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
