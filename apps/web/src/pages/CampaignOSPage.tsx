import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaigns, Campaign, CampaignStatus } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, Loader2, MoreHorizontal, Copy, Trash2, Archive,
  Pencil, Rocket, Target, X
} from 'lucide-react';

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  researching: { label: 'Researching',  color: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/20' },
  planning:    { label: 'Planning',     color: 'text-yellow-400',  bg: 'bg-yellow-400/10 border-yellow-400/20' },
  recording:   { label: 'Recording',   color: 'text-orange-400',  bg: 'bg-orange-400/10 border-orange-400/20' },
  editing:     { label: 'Editing',     color: 'text-purple-400',  bg: 'bg-purple-400/10 border-purple-400/20' },
  posting:     { label: 'Posting',     color: 'text-primary',     bg: 'bg-primary/10 border-primary/20' },
  growing:     { label: 'Growing',     color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  completed:   { label: 'Completed',   color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20' },
  archived:    { label: 'Archived',    color: 'text-[#71717A]',   bg: 'bg-white/[0.04] border-white/[0.06]' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as CampaignStatus[];
const PLATFORMS = ['tiktok', 'youtube', 'instagram', 'twitter', 'universal'];

// ---- Create Modal -------------------------------------------
function CreateModal({ onClose }: { onClose: () => void }) {
  const { createCampaign } = useCampaigns();
  const [form, setForm] = useState({ title: '', brand: '', niche: '', platform: 'tiktok', goal: '', status: 'planning' as CampaignStatus });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await createCampaign.mutateAsync(form);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        className="w-full max-w-md bg-[#111111] border border-white/[0.08] rounded-t-[20px] sm:rounded-[20px] p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[17px] font-semibold text-[#FAFAFA] tracking-tight">New Campaign</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Campaign Name *</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Finance Niche Sprint"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#71717A]">Brand / Client</label>
              <Input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Your brand"
                className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-[#71717A]">Niche</label>
              <Input value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} placeholder="e.g. Finance"
                className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Platform</label>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(p => (
                <button type="button" key={p} onClick={() => setForm(f => ({ ...f, platform: p }))}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium capitalize transition-all ${form.platform === p ? 'bg-primary text-white' : 'bg-[#0D0D0D] border border-white/[0.08] text-[#71717A] hover:text-[#FAFAFA]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] text-[#71717A]">Goal</label>
            <Input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="e.g. Reach 10k followers"
              className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A] focus:border-primary/50" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}
              className="flex-1 h-10 rounded-[10px] border-white/[0.08] bg-transparent text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px]">Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim()}
              className="flex-1 h-10 rounded-[10px] bg-primary text-white hover:bg-primary/90 text-[13px]">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ---- Campaign Card ------------------------------------------
function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { updateCampaign, deleteCampaign, duplicateCampaign } = useCampaigns();
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.planning;
  const pct = campaign.completion_pct ?? 0;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="group relative bg-[#111111] border border-white/[0.06] rounded-[16px] p-6 hover:border-white/[0.12] transition-all duration-200">

      {/* Status badge */}
      <div className="flex items-center justify-between mb-5">
        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border capitalize ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="opacity-0 group-hover:opacity-100 text-[#71717A] hover:text-[#FAFAFA] transition-all p-1 rounded-[6px] hover:bg-white/[0.05]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-7 z-20 w-44 bg-[#161616] border border-white/[0.08] rounded-[12px] shadow-xl overflow-hidden py-1">
                {[
                  { icon: Pencil, label: 'Edit',      action: () => {} },
                  { icon: Copy,   label: 'Duplicate',  action: () => { duplicateCampaign.mutate(campaign); setMenuOpen(false); } },
                  { icon: Archive,label: 'Archive',    action: () => { updateCampaign.mutate({ id: campaign.id, patch: { status: 'archived' } }); setMenuOpen(false); } },
                  { icon: Trash2, label: 'Delete',     action: () => { deleteCampaign.mutate(campaign.id); setMenuOpen(false); } },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-white/[0.05] ${item.label === 'Delete' ? 'text-red-400 hover:text-red-300' : 'text-[#A1A1AA] hover:text-[#FAFAFA]'}`}>
                    <item.icon className="h-3.5 w-3.5" />{item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <h3 className="text-[15px] font-semibold text-[#FAFAFA] tracking-tight mb-1.5 line-clamp-1">{campaign.title}</h3>
      {campaign.brand && <p className="text-[12px] text-[#71717A] mb-1">{campaign.brand}</p>}

      <div className="flex flex-wrap gap-3 my-4 text-[12px] text-[#71717A]">
        {campaign.platform && (
          <span className="flex items-center gap-1 capitalize"><Rocket className="h-3 w-3" />{campaign.platform}</span>
        )}
        {campaign.niche && (
          <span className="flex items-center gap-1"><Target className="h-3 w-3" />{campaign.niche}</span>
        )}
        {campaign.clip_count != null && (
          <span>{campaign.clip_count} clips</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mt-4">
        <div className="flex items-center justify-between text-[11px] text-[#71717A]">
          <span>Progress</span><span className="text-primary">{pct}%</span>
        </div>
        <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
        </div>
      </div>

      {campaign.goal && (
        <p className="text-[12px] text-[#71717A] mt-4 line-clamp-1">Goal: {campaign.goal}</p>
      )}
    </motion.div>
  );
}

// ---- Main Page ----------------------------------------------
export default function CampaignOSPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');

  const visible = filter === 'all' ? campaigns : campaigns?.filter(c => c.status === filter);

  return (
    <div className="space-y-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Campaign OS</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1">Manage every campaign from research to growth.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}
          className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(124,58,237,0.3)] text-[13px] self-start sm:self-auto">
          <Plus className="h-4 w-4 mr-1.5" />New Campaign
        </Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-all ${filter === 'all' ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'bg-[#111111] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]'}`}>
          All
        </button>
        {ALL_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all ${filter === s ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'bg-[#111111] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA]'}`}>
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 rounded-[16px] bg-[#111111] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : !visible?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mb-5">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#FAFAFA] mb-2">No campaigns yet</h3>
          <p className="text-[14px] text-[#71717A] max-w-sm mb-6">Create your first campaign to start organizing your content production from research to growth.</p>
          <Button onClick={() => setShowCreate(true)} className="h-10 rounded-[12px] px-5 bg-primary text-white hover:bg-primary/90 text-[13px]">
            <Plus className="h-4 w-4 mr-1.5" />Create First Campaign
          </Button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <AnimatePresence>
            {visible?.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  );
}
