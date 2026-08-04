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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-14 items-center justify-between px-4 border-b">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden truncate">
               <span className="font-bold tracking-tight truncate">
                 {isLoading ? 'Loading...' : activeWorkspace?.name || 'Workspace'}
               </span>
               <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="ml-auto shrink-0">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group",
                  location.pathname === item.href 
                    ? "bg-accent/50 text-accent-foreground" 
                    : "text-muted-foreground hover:bg-accent/30 hover:text-accent-foreground",
                  collapsed ? "justify-center" : ""
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between">
                    <span>{item.name}</span>
                    <span className="text-[10px] font-mono tracking-widest text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.shortcut}
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t flex flex-col gap-2">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground text-muted-foreground",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Settings" : undefined}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-destructive/10 hover:text-destructive text-muted-foreground w-full",
              collapsed ? "justify-center" : ""
            )}
            title={collapsed ? "Log out" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:px-8">
          <div className="w-full flex-1">
            <Button variant="outline" className="w-full justify-start text-muted-foreground max-w-sm sm:pr-12 md:w-64" onClick={() => {
                // To be implemented: trigger CMD+K palette
                console.log("Open CMD+K");
            }}>
              <Search className="mr-2 h-4 w-4" />
              <span className="hidden lg:inline-flex">Search OS (CMD+K)...</span>
              <span className="inline-flex lg:hidden">Search...</span>
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-accent border flex items-center justify-center text-sm font-medium cursor-pointer overflow-hidden">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
