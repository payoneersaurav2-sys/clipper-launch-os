// Utility: export campaigns, ideas, hooks, captions as PDF / CSV / JSON / Markdown
import { Campaign } from '@/hooks/useCampaigns';

// ---- JSON -------------------------------------------------------
export function exportJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${filename}.json`);
}

// ---- CSV --------------------------------------------------------
export function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
    ),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `${filename}.csv`);
}

// ---- Markdown ---------------------------------------------------
export function exportMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  triggerDownload(blob, `${filename}.md`);
}

// ---- Campaign to Markdown --------------------------------------
export function campaignToMarkdown(campaign: Campaign): string {
  return `# ${campaign.title}

**Status:** ${campaign.status}  
**Platform:** ${campaign.platform ?? '—'}  
**Niche:** ${campaign.niche ?? '—'}  
**Goal:** ${campaign.goal ?? '—'}  
**Progress:** ${campaign.completion_pct ?? 0}%  
**Created:** ${new Date(campaign.created_at).toLocaleDateString()}

---

_Exported from Creator OS_
`;
}

// ---- Trigger browser download ----------------------------------
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
