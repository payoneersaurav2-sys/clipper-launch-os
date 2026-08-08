import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, CalendarDays, Loader2, TrendingUp } from 'lucide-react';
import { useCampaign, useClips, ClipStatus } from '@/hooks/useCampaigns';
import { Button } from '@/components/ui/button';

const statuses: ClipStatus[] = ['idea', 'writing', 'editing', 'ready', 'scheduled', 'published', 'analyzed'];

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const { data: campaign, isLoading, error } = useCampaign(campaignId);
  const { data: clips, isLoading: clipsLoading, updateClip } = useClips(campaignId);
  const [contentError, setContentError] = useState('');

  if (isLoading) return <div className="flex h-48 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-[#71717A]" /></div>;
  if (error || !campaign) return <div className="space-y-4"><Link to="/dashboard/campaign-os" className="text-[13px] text-primary hover:underline">Back to Campaign OS</Link><p className="text-sm text-red-400">Campaign not found or you do not have access.</p></div>;

  const content = clips ?? [];
  const published = content.filter(clip => clip.status === 'published' || clip.status === 'analyzed');
  const scheduled = content.filter(clip => clip.status === 'scheduled');
  const totalViews = content.reduce((sum, clip) => sum + (clip.views ?? 0), 0);
  const totalLikes = content.reduce((sum, clip) => sum + (clip.likes ?? 0), 0);
  const progress = content.length ? Math.round((published.length / content.length) * 100) : 0;
  const update = async (id: string, patch: Record<string, string | null>) => {
    setContentError('');
    try { await updateClip.mutateAsync({ id, patch }); }
    catch { setContentError('Could not update this content item. Please try again.'); }
  };

  return <div className="max-w-6xl space-y-7 animate-in fade-in duration-500">
    <div className="space-y-3">
      <Link to="/dashboard/campaign-os" className="inline-flex items-center gap-1.5 text-[13px] text-[#71717A] hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" />Campaign OS</Link>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">{campaign.title}</h2><p className="mt-1 text-[13px] text-[#71717A]">{campaign.brand || 'Creator campaign'} · {campaign.platform || 'No platform selected'} · {campaign.niche || 'No niche selected'}</p></div><Link to="/dashboard/clip-pipeline" state={{ campaignId: campaign.id }}><Button className="h-10 rounded-[12px] bg-primary text-white text-[13px]">Manage Clips</Button></Link></div>
    </div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[['Content progress', `${progress}%`], ['Published', String(published.length)], ['Views recorded', totalViews.toLocaleString()], ['Likes recorded', totalLikes.toLocaleString()]].map(([label, value]) => <div key={label} className="rounded-[16px] border border-white/[0.06] bg-[#111111] p-5"><p className="text-[12px] text-[#71717A]">{label}</p><p className="mt-2 text-[24px] font-semibold text-[#FAFAFA]">{value}</p></div>)}
    </div>
    <div className="grid gap-4 lg:grid-cols-3"><section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6 lg:col-span-2"><h3 className="text-[14px] font-semibold text-[#FAFAFA]">Campaign overview</h3><dl className="mt-5 grid gap-4 sm:grid-cols-2 text-[13px]"><div><dt className="text-[#71717A]">Goal</dt><dd className="mt-1 text-[#FAFAFA]">{campaign.goal || 'No goal set'}</dd></div><div><dt className="text-[#71717A]">Timeline</dt><dd className="mt-1 text-[#FAFAFA]">{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'No start date'} — {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}</dd></div></dl></section><section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6"><CalendarDays className="h-4 w-4 text-primary" /><p className="mt-3 text-[13px] text-[#71717A]">Upcoming scheduled content</p><p className="mt-1 text-[24px] font-semibold text-[#FAFAFA]">{scheduled.length}</p></section></div>
    <section className="rounded-[18px] border border-white/[0.06] bg-[#111111] p-6"><div className="mb-5 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary"/><h3 className="text-[14px] font-semibold text-[#FAFAFA]">Campaign content</h3></div>{contentError && <p role="alert" className="mb-3 text-[12px] text-red-400">{contentError}</p>}{clipsLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#71717A]" /> : !content.length ? <p className="text-[13px] text-[#71717A]">No clips are linked to this campaign yet.</p> : <div className="space-y-2">{content.map(clip => <div key={clip.id} className="grid gap-3 rounded-[12px] border border-white/[0.05] p-3 md:grid-cols-[1fr_130px_150px]"><p className="text-[13px] font-medium text-[#FAFAFA]">{clip.title}</p><select value={clip.status} onChange={event => void update(clip.id, { status: event.target.value })} className="rounded-[8px] border border-white/[0.08] bg-[#0D0D0D] px-2 text-[12px] text-[#FAFAFA]">{statuses.map(status => <option key={status} value={status}>{status}</option>)}</select><input type="date" value={clip.publishing_date?.slice(0, 10) ?? ''} onChange={event => void update(clip.id, { publishing_date: event.target.value || null })} className="rounded-[8px] border border-white/[0.08] bg-[#0D0D0D] px-2 text-[12px] text-[#FAFAFA]" /></div>)}</div>}</section>
  </div>;
}
