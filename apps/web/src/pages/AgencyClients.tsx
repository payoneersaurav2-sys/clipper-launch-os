import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useAgency } from '@/hooks/useAgency';
import { Search, Plus, Building2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgencyClients() {
  const { createWorkspace } = useWorkspaces();
  const { workspaces, setActiveWorkspace } = useWorkspaceStore();
  const { data: agency } = useAgency();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const agencyClients = workspaces?.filter(ws => ws.agency_id === agency?.id) || [];
  const filteredClients = agencyClients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    if (!agency?.id) {
      alert('Error: Agency context not found. Please ensure you are on the Agency plan.');
      return;
    }

    try {
      setIsCreating(true);
      const ws = await createWorkspace.mutateAsync({ name: newClientName, agency_id: agency.id });
      setActiveWorkspace(ws);
        trackEvent('agency_client_created', { name: ws.name }, ws.id);
      setIsCreateModalOpen(false);
      setNewClientName('');
    } catch (err) {
      console.error(err);
      // Let global error boundary handle if needed
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-zinc-400 text-sm">Manage your brands and workspaces.</p>
        </div>
        <button
          id="add-client-btn"
          onClick={() => { if (!agency?.id) { alert("Agency context not found. You must be on the Agency plan to add clients."); return; } setIsCreateModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {agencyClients.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {agencyClients.length === 0 ? (
        <div className="pt-8">
          <EmptyState
            
            title="Your agency is ready to grow."
            description="Create your first client to organize your brands and workflows in one place."
            actionLabel="Create Client" onAction={() => { if (!agency?.id) { alert("Agency context not found. You must be on the Agency plan to add clients."); return; } setIsCreateModalOpen(true); }}
          />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No clients found matching "{search}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <Card key={client.id} className="p-5 bg-white/5 border-white/10 flex flex-col group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-green-500/10 text-green-400 rounded">
                  Active
                </span>
              </div>
              <h3 className="font-semibold text-white truncate mb-1">{client.name}</h3>
              <p className="text-sm text-zinc-400 mb-6 truncate">{client.niche || 'General'} • {client.platform || 'Multi-platform'}</p>
              
              <button 
                onClick={() => {
                    setActiveWorkspace(client);
                    trackEvent('agency_client_switched', { to_client: client.name }, client.id);
                  }}
                className="mt-auto flex items-center gap-2 text-sm text-primary group-hover:text-primary/80 transition-colors"
              >
                Switch Context
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => !isCreating && setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-xl p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-2">Add Client</h2>
              <p className="text-sm text-zinc-400 mb-6">Create a new client workspace to organize their content and knowledge.</p>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1">
                    Client / Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Acme Fitness"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isCreating}
                    className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newClientName.trim()}
                    className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : 'Add Client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}









