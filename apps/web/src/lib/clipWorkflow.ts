import type { Clip, ClipStatus } from '@/hooks/useCampaigns';

export function getReadinessIssues(clip: Partial<Clip>): string[] {
  const issues: string[] = [];
  if (!clip.script?.trim()) issues.push('script');
  if (!clip.caption?.trim()) issues.push('caption');
  if (!clip.cta?.trim()) issues.push('CTA');
  if (!clip.media_url?.trim() && !clip.media_path?.trim()) issues.push('media');
  if (!clip.platform?.trim()) issues.push('platform');
  return issues;
}

export function getTransitionIssue(clip: Partial<Clip>, next: ClipStatus): string | null {
  const readinessIssues = getReadinessIssues(clip);
  if ((next === 'ready' || next === 'scheduled') && readinessIssues.length) {
    return `Complete ${readinessIssues.join(', ')} before moving this item to ${next}.`;
  }
  if (next === 'scheduled' && !clip.publishing_date) {
    return 'Choose a publishing date and time before scheduling this item.';
  }
  if (next === 'published' && clip.publication_state !== 'published') {
    return 'Publishing is not connected. Keep this item Scheduled until a real publication is recorded.';
  }
  return null;
}

export function getProductionState(clip: Partial<Clip>): string {
  if (!clip.script?.trim()) return 'Script missing';
  if (!clip.media_url?.trim() && !clip.media_path?.trim()) return 'Media missing';
  if (getReadinessIssues(clip).length) return 'Production incomplete';
  if (clip.status === 'scheduled') return 'Scheduled';
  if (clip.status === 'published') return 'Published';
  return 'Ready for scheduling';
}
