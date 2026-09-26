import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgency } from '@/hooks/useAgency';
import { useAgencyTeam } from '@/hooks/useAgencyTeam';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { authorizeAgencyAction, canManageRole, AgencyRole } from '@clipper/core/src/auth/agency-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, X, Trash2, Mail, Shield,  } from 'lucide-react';


export default function AgencyTeam() {
  const { data: agency } = useAgency();
  const { user } = useAuthStore();
  const { workspaces } = useWorkspaceStore();
  const agencyClients = workspaces?.filter(ws => ws.agency_id === agency?.id) || [];
  
  const { members, invites, isLoading, inviteMember, cancelInvite, updateRole, removeMember } = useAgencyTeam(agency?.id);
  
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AgencyRole>('editor');
  const [inviteClients, setInviteClients] = useState<string[]>([]);
  const [inviteError, setInviteError] = useState('');
  
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const currentUserRole: AgencyRole = agency?.owner_id === user?.id ? 'owner' : (currentUserMember?.role || 'viewer');
  
  const canInvite = authorizeAgencyAction(currentUserRole, 'team.invite');
  const canUpdateRole = authorizeAgencyAction(currentUserRole, 'team.update_role');
  const canRemove = authorizeAgencyAction(currentUserRole, 'team.remove');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    if (!inviteEmail) return;
    try {
      await inviteMember.mutateAsync({ email: inviteEmail, role: inviteRole, workspaceIds: inviteClients });
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('editor');
      setInviteClients([]);
    } catch (err: any) {
      setInviteError(err.message);
    }
  };

  const toggleClientForInvite = (id: string) => {
    setInviteClients(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-zinc-500" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Team</h1>
          <p className="text-sm text-zinc-400">Manage members, roles, and client access for {agency?.name}.</p>
        </div>
        {canInvite && (
          <Button onClick={() => setShowInvite(true)} className="bg-primary text-white">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/[0.06] bg-[#161616] text-xs font-medium text-zinc-400 uppercase tracking-wider">
          <div className="col-span-5">Member</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-3">Client Access</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {members.map(m => {
            const isSelf = m.user_id === user?.id;
            const isOwner = m.role === 'owner' || agency?.owner_id === m.user_id;
            
            return (
              <div key={m.user_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                    {m.user?.full_name?.[0]?.toUpperCase() || m.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {m.user?.full_name || 'Unknown'} {isSelf && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">You</span>}
                    </div>
                    <div className="text-xs text-zinc-500">{m.user?.email}</div>
                  </div>
                </div>
                
                <div className="col-span-3 flex flex-col items-start gap-1">
                  <span className={`text-xs px-2 py-1 rounded capitalize ${isOwner ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-zinc-300 border border-white/10'}`}>
                    {isOwner ? 'Owner' : m.role}
                  </span>
                  {canUpdateRole && !isSelf && canManageRole(currentUserRole, 'viewer', m.role) && (
                    <select 
                      className="text-[10px] bg-transparent border-none text-zinc-500 hover:text-zinc-300 cursor-pointer p-0"
                      value={m.role}
                      onChange={(e) => updateRole.mutate({ userId: m.user_id, role: e.target.value as AgencyRole })}
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  )}
                </div>
                
                <div className="col-span-3 text-xs text-zinc-400">
                  {isOwner || m.role === 'admin' ? (
                    <span className="text-zinc-300 flex items-center gap-1"><Shield className="h-3 w-3" /> All Clients</span>
                  ) : (
                    <div>
                      {m.clients?.length === 0 ? 'No access' : `${m.clients?.length} client(s)`}
                    </div>
                  )}
                </div>
                
                <div className="col-span-1 flex justify-end">
                  {canRemove && !isOwner && !isSelf && canManageRole(currentUserRole, 'viewer', m.role) && (
                    <button 
                      onClick={() => removeMember.mutate(m.user_id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {invites.length > 0 && (
        <div className="bg-[#111111] border border-white/[0.06] rounded-xl overflow-hidden mt-8">
          <div className="p-4 border-b border-white/[0.06] bg-[#161616]">
            <h2 className="text-sm font-semibold text-white">Pending Invitations</h2>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {invites.map(inv => (
              <div key={inv.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                <div className="col-span-5 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{inv.email}</div>
                    <div className="text-xs text-zinc-500">Expires: {new Date(inv.expires_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="col-span-3 text-xs text-zinc-400 capitalize">{inv.role}</div>
                <div className="col-span-3 text-xs text-zinc-400">
                  {inv.role === 'admin' ? 'All Clients' : `${inv.agency_invitation_clients?.length || 0} client(s)`}
                </div>
                <div className="col-span-1 flex justify-end">
                  {canInvite && (
                    <button onClick={() => cancelInvite.mutate(inv.id)} className="text-zinc-500 hover:text-red-400 p-1" title="Cancel invitation">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-white/[0.08] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleInvite}>
                <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-[#161616]">
                  <h2 className="text-lg font-semibold text-white">Invite Team Member</h2>
                  <button type="button" onClick={() => setShowInvite(false)} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="p-5 space-y-5">
                  {inviteError && <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-2 rounded">{inviteError}</div>}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Email Address</label>
                    <Input autoFocus type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@agency.com" required className="bg-black/50" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-300">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['admin', 'manager', 'editor', 'viewer'] as AgencyRole[]).map(r => (
                        <button key={r} type="button" onClick={() => setInviteRole(r)} disabled={!canManageRole(currentUserRole, r)}
                          className={`p-3 text-left border rounded-lg text-xs capitalize transition-all ${inviteRole === r ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <div className="font-semibold mb-1">{r}</div>
                          <div className="text-[10px] opacity-80 leading-tight">
                            {r === 'admin' && 'Full access except billing/ownership.'}
                            {r === 'manager' && 'Manage assigned clients and campaigns.'}
                            {r === 'editor' && 'Edit content in assigned clients.'}
                            {r === 'viewer' && 'Read-only access to assigned clients.'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {inviteRole !== 'admin' && agencyClients.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-300">Client Access</label>
                      <div className="max-h-40 overflow-y-auto space-y-1 bg-black/30 border border-white/5 rounded-lg p-2">
                        {agencyClients.map(c => (
                          <label key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer">
                            <input type="checkbox" checked={inviteClients.includes(c.id)} onChange={() => toggleClientForInvite(c.id)} className="rounded border-zinc-700 bg-zinc-900 text-primary" />
                            <span className="text-xs text-zinc-300">{c.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-white/[0.06] flex justify-end gap-2 bg-[#161616]">
                  <Button type="button" variant="ghost" onClick={() => setShowInvite(false)} className="text-zinc-400 hover:text-white">Cancel</Button>
                  <Button type="submit" disabled={inviteMember.isPending || !inviteEmail} className="bg-primary text-white min-w-[120px]">
                    {inviteMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invitation'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

