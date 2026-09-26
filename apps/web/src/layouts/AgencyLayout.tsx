import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Menu, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';


import Wordmark from '@/components/Wordmark';
import BrandMark from '@/components/BrandMark';
import { ClientSwitcher } from '@/components/ClientSwitcher';

export default function AgencyLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  
  
  

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Derived: Filter workspaces to only those belonging to the current agency
  
  
  // If activeWorkspace does not belong to this agency, we shouldn't necessarily override it
  // unless we want strict isolation. For now, activeWorkspace is global.
  
  const navItems = [
    { name: 'Overview', href: '/agency', icon: LayoutDashboard },
    { name: 'Clients', href: '/agency/clients', icon: Users },
    { name: 'Team', href: '/agency/team', icon: Users },
  ];

  const clientItems = [
    { name: 'Brand Profile', href: '/agency/profile', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#080808] text-[#E4E4E7] font-sans selection:bg-primary/30">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#080808]/80 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <BrandMark className="w-6 h-6" />
          <span className="font-semibold text-sm tracking-wide">AGENCY HQ</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-zinc-400 hover:text-white">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0B0B0B] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
          <Link to="/agency" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Wordmark className="w-32" />
            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10">Agency</span>
          </Link>
        </div>

        {/* Client Switcher */}
        <div className="p-4 border-b border-white/5 shrink-0">
          <ClientSwitcher />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Agency</span>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Client Workspace</span>
            {clientItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 shrink-0 flex flex-col gap-1">
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            Back to Creator OS
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#080808] pt-16 lg:pt-0">
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}




