import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useClips, useCampaigns, ClipStatus, Clip } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, GripVertical, ChevronDown, X, Video } from 'lucide-react';
import { getProductionState, getTransitionIssue } from '@/lib/clipWorkflow';

const STAGES: { key: ClipStatus; label: string; color: string }[] = [
  { key: 'idea',      label: 'Idea',      color: '#71717A' },
  { key: 'writing',   label: 'Writing',   color: '#60A5FA' },
  { key: 'editing',   label: 'Editing',   color: '#A78BFA' },
  { key: 'ready',     label: 'Ready',     color: '#34D399' },
  { key: 'scheduled', label: 'Scheduled', color: '#FBBF24' },
  { key: 'published', label: 'Published', color: '#7C3AED' },
  { key: 'analyzed',  label: 'Analyzed',  color: '#10B981' },
];

function AddClipModal({ campaignId, onClose }: { campaignId?: string; onClose: () => void }) {
  const { createClip } = useClips(campaignId);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createClip.mutateAsync({ title, platform, campaign_id: campaignId, status: 'idea' });
      onClose();
    } catch {
      setError('Could not add this clip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        className="w-full max-w-sm bg-[#111111] border border-white/[0.08] rounded-[18px] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-[#FAFAFA]">Add Clip</h3>
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA]"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Clip title…" autoFocus
            className="h-10 rounded-[10px] bg-[#0D0D0D] border-white/[0.08] text-[#FAFAFA] placeholder:text-[#71717A]" />
          <div className="flex gap-2">
            {['tiktok','youtube','instagram'].map(p => (
              <button type="button" key={p} onClick={() => setPlatform(p)}
                className={`px-3 py-1 rounded-full text-[11px] capitalize transition-all ${platform === p ? 'bg-primary text-white' : 'bg-[#0D0D0D] border border-white/[0.08] text-[#71717A]'}`}>
                {p}
              </button>
            ))}
          </div>
          {error && <p role="alert" className="text-[12px] text-red-400">{error}</p>}
          <Button type="submit" disabled={saving || !title.trim()} className="w-full h-10 rounded-[10px] bg-primary text-white text-[13px]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Clip'}
          </Button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function KanbanCard({ clip, onMove }: { clip: Clip; onMove: (id: string, status: ClipStatus) => void }) {
  const [showMove, setShowMove] = useState(false);

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }} transition={{ duration: 0.15 }}
      draggable
      onDragStartCapture={(event: React.DragEvent<HTMLDivElement>) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', clip.id); }}
      className="bg-[#161616] border border-white/[0.06] rounded-[12px] p-4 cursor-grab active:cursor-grabbing hover:border-white/[0.12] transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-3">
        {clip.campaign_id ? <Link to={`/dashboard/campaign-os/${clip.campaign_id}/content/${clip.id}`} className="text-[13px] font-medium text-[#FAFAFA] leading-snug line-clamp-2 hover:text-primary">{clip.title}</Link> : <p className="text-[13px] font-medium text-[#FAFAFA] leading-snug line-clamp-2">{clip.title}</p>}
        <GripVertical className="h-4 w-4 text-[#71717A] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {clip.platform && (
        <span className="text-[11px] text-[#71717A] capitalize">{clip.platform}</span>
      )}
      {clip.hook && (
        <p className="text-[11px] text-[#71717A] mt-2 line-clamp-1 italic">"{clip.hook}"</p>
      )}
      <p className="mt-2 text-[10px] text-[#A1A1AA]">{getProductionState(clip)}</p>
      {/* Quick move */}
      <div className="mt-3 pt-3 border-t border-white/[0.04]">
        <button onClick={() => setShowMove(!showMove)}
          className="flex items-center gap-1 text-[11px] text-[#71717A] hover:text-primary transition-colors">
          <ChevronDown className={`h-3 w-3 transition-transform ${showMove ? 'rotate-180' : ''}`} />
          Move to stage
        </button>
        <AnimatePresence>
          {showMove && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 mt-2">
                {STAGES.filter(s => s.key !== clip.status).map(s => (
                  <button key={s.key} onClick={() => { onMove(clip.id, s.key); setShowMove(false); }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-white/[0.08] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-white/[0.2] transition-colors">
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function KanbanColumn({ stage, clips, onMove }: { stage: typeof STAGES[0]; clips: Clip[]; onMove: (id: string, status: ClipStatus) => void }) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  return (
    <div className="flex-shrink-0 w-64 flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
        <span className="text-[12px] font-medium text-[#A1A1AA]">{stage.label}</span>
        <span className="ml-auto text-[11px] text-[#71717A] bg-white/[0.06] px-1.5 py-0.5 rounded-full">{clips.length}</span>
      </div>
      <div onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setIsDropTarget(true); }}
        onDragLeave={() => setIsDropTarget(false)}
        onDrop={event => { event.preventDefault(); setIsDropTarget(false); const clipId = event.dataTransfer.getData('text/plain'); if (clipId) onMove(clipId, stage.key); }}
        className={`flex-1 bg-[#0D0D0D] border rounded-[14px] p-3 min-h-[200px] space-y-2 transition-colors ${isDropTarget ? 'border-primary/60 bg-primary/[0.04]' : 'border-white/[0.04]'}`}>
        <AnimatePresence>
          {clips.map(clip => (
            <KanbanCard key={clip.id} clip={clip} onMove={onMove} />
          ))}
        </AnimatePresence>
        {clips.length === 0 && (
          <div className="flex items-center justify-center h-20 text-[12px] text-[#71717A] text-center">
            Drop clips here
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClipPipelinePage() {
  const location = useLocation();
  const { data: campaigns } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<string | undefined>(() => (location.state as { campaignId?: string } | null)?.campaignId);
  const { data: clips, isLoading, updateClip } = useClips(selectedCampaign);
  const [showAdd, setShowAdd] = useState(false);
  const [moveError, setMoveError] = useState('');

  const handleMove = async (id: string, status: ClipStatus) => {
    setMoveError('');
    const clip = clips?.find(item => item.id === id);
    const transitionIssue = clip ? getTransitionIssue(clip, status) : null;
    if (transitionIssue) { setMoveError(transitionIssue); return; }
    try {
      await updateClip.mutateAsync({ id, patch: { status } });
    } catch {
      setMoveError('Could not move this clip. Please try again.');
    }
  };

  const clipsByStage = (key: ClipStatus) => clips?.filter(c => c.status === key) ?? [];

  return (
    <div className="os-page animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Clip Pipeline</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1">Kanban board from idea to published and analyzed.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select value={selectedCampaign ?? ''} onChange={e => setSelectedCampaign(e.target.value || undefined)}
            className="h-10 px-3 sm:px-4 rounded-[10px] bg-[#111111] border border-white/[0.06] text-[#A1A1AA] text-[13px] focus:outline-none focus:border-primary/50 flex-1 sm:flex-initial min-w-0">
            <option value="">All Campaigns</option>
            {campaigns?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <Button onClick={() => setShowAdd(true)} className="h-10 rounded-[12px] px-4 sm:px-5 bg-primary text-white hover:bg-primary/90 text-[13px] shrink-0">
            <Plus className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Add Clip</span>
          </Button>
        </div>
      </div>

      {moveError && <p role="alert" className="rounded-[10px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-[12px] text-red-400">{moveError}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-5 w-5 animate-spin text-[#71717A]" /></div>
      ) : !clips?.length && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-[16px] bg-primary/10 flex items-center justify-center mb-5">
            <Video className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-[17px] font-semibold text-[#FAFAFA] mb-2">No clips yet</h3>
          <p className="text-[14px] text-[#71717A] max-w-sm mb-6">Add your first clip to start tracking it through the production pipeline.</p>
          <Button onClick={() => setShowAdd(true)} className="h-10 rounded-[12px] px-5 bg-primary text-white text-[13px]">
            <Plus className="h-4 w-4 mr-1.5" />Add First Clip
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Kanban */}
          <div className="hidden md:block overflow-x-auto pb-6">
            <div className="flex gap-4 min-w-max">
              {STAGES.map(stage => (
                <KanbanColumn key={stage.key} stage={stage} clips={clipsByStage(stage.key)} onMove={handleMove} />
              ))}
            </div>
          </div>

          {/* Mobile List View */}
          <div className="block md:hidden space-y-8 pb-6">
            {STAGES.map(stage => {
              const stageClips = clipsByStage(stage.key);
              if (stageClips.length === 0) return null;
              return (
                <div key={stage.key} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-[14px] font-medium text-[#FAFAFA]">{stage.label}</span>
                    <span className="ml-auto text-[11px] text-[#71717A] bg-white/[0.06] px-2 py-0.5 rounded-full">{stageClips.length}</span>
                  </div>
                  <div className="space-y-2">
                    {stageClips.map(clip => (
                      <KanbanCard key={clip.id} clip={clip} onMove={handleMove} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {showAdd && <AddClipModal campaignId={selectedCampaign} onClose={() => setShowAdd(false)} />}
      </AnimatePresence>
    </div>
  );
}
