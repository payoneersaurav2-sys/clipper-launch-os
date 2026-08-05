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
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r border-border/40 bg-background/95 backdrop-blur-md transition-all duration-300 z-20",
        collapsed ? "w-[80px]" : "w-[280px]"
      )}>
        <div className="flex h-20 items-center justify-between px-6">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-bold text-white text-sm tracking-tighter">CL</span>
              </div>
              <span className="font-bold tracking-widest text-lg">CREATOR <span className="text-primary">OS</span></span>
            </div>
          )}
          {collapsed && (
            <div className="h-8 w-8 mx-auto rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
               <span className="font-bold text-white text-sm tracking-tighter">CL</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-auto py-6 px-4">
          <nav className="grid gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    collapsed ? "justify-center px-0" : ""
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                  {!collapsed && (
                    <div className="flex flex-1 items-center justify-between">
                      <span className="tracking-wide">{item.name}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-6 flex flex-col gap-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-white/5 hover:text-foreground text-muted-foreground",
              collapsed ? "justify-center px-0" : ""
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span className="tracking-wide">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070707]">
        {/* Top Navigation */}
        <header className="flex h-20 items-center justify-end gap-6 px-8 lg:px-12 bg-transparent z-10">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-full h-10 w-10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
            </Button>
            <div className="flex items-center gap-3 pl-6 border-l border-border/40 cursor-pointer group">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold tracking-wide text-foreground group-hover:text-primary transition-colors">
                  {user?.email?.split('@')[0] || 'Creator'}
                </span>
                <span className="text-xs text-muted-foreground">Pro Plan</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary overflow-hidden">
                {user?.email?.charAt(0).toUpperCase() || 'C'}
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-8 lg:p-12 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
