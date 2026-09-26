import { useAuthStore } from '@/stores/useAuthStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useAgency } from '@/hooks/useAgency';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/EmptyState';

export default function AgencyOverview() {
  const { user } = useAuthStore();
  const { workspaces } = useWorkspaceStore();
  const { data: agency } = useAgency();

  const agencyClients = workspaces?.filter(ws => ws.agency_id === agency?.id) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white mb-2">Agency HQ</h1>
        <p className="text-zinc-400">Good morning, {user?.user_metadata?.full_name || 'Agency Owner'}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white/5 border-white/10 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-zinc-400 font-medium">
            <Users className="w-4 h-4" />
            CLIENTS
          </div>
          <div className="text-3xl font-bold text-white">{agencyClients.length}</div>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Clients</h2>
          <Link to="/agency/clients" className="text-sm text-primary hover:text-primary/80 transition-colors">
            View All
          </Link>
        </div>

        {agencyClients.length === 0 ? (
          <EmptyState
            
            title="Your Agency workspace is ready."
            description="Create your first client to start organizing brands, content, and workflows."
            actionLabel="Create Client" onAction={() => window.location.href = '/agency/clients'}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agencyClients.slice(0, 3).map(client => (
              <Card key={client.id} className="p-5 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <h3 className="font-semibold text-white mb-1 truncate">{client.name}</h3>
                <p className="text-sm text-zinc-400 capitalize">{client.niche || 'General'} • {client.platform || 'Multi-platform'}</p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



