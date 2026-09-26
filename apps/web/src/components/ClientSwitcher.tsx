import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Plus, Check } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useAgency } from '@/hooks/useAgency';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function ClientSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const { data: agency } = useAgency();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const agencyClients = workspaces?.filter(ws => ws.agency_id === agency?.id) || [];
  
  const filteredClients = agencyClients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Active Client</div>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 px-3 text-sm text-white transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-2">
          {activeWorkspace?.name || 'Select a client...'}
        </span>
        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col max-h-[300px]"
          >
            <div className="p-2 border-b border-white/10 shrink-0 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-black/50 border border-white/5 rounded pl-9 pr-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-1" role="listbox">
              {filteredClients.length === 0 ? (
                <div className="py-6 text-center text-sm text-zinc-500">
                  No clients found.
                </div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    role="option"
                    aria-selected={activeWorkspace?.id === client.id}
                    onClick={() => {
                      setActiveWorkspace(client);
                        trackEvent('agency_client_switched', { to_client: client.name }, client.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors text-left",
                      activeWorkspace?.id === client.id
                        ? "bg-primary/20 text-white"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <span className="truncate pr-2">{client.name}</span>
                    {activeWorkspace?.id === client.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>

            <div className="p-1 border-t border-white/10 shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/agency/clients');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




