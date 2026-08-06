import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import { BookOpen, Library } from 'lucide-react';

export function ClipTracker() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Clip Tracker</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Track your content from idea to published.</p>
      </div>
      <EmptyState title="Pipeline empty" description="Your kanban board will populate as you move ideas through the workflow stages." actionLabel="Go to Idea Studio" onAction={() => navigate('/dashboard/idea-studio')} />
    </div>
  );
}

export function KnowledgeVault() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Knowledge Vault</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Your AI's long-term memory. Drop resources here.</p>
      </div>
      <EmptyState title="Vault is empty" description="Upload PDFs, paste Notion links, or add brand guidelines. The AI will reference these in every generation." actionLabel="Add Resource" />
    </div>
  );
}

export function PromptLibrary() {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[26px] font-semibold tracking-tight text-[#FAFAFA]">Prompt Library</h2>
        <p className="text-[14px] text-[#71717A] mt-1">Save your best performing AI instructions.</p>
      </div>
      <EmptyState title="No custom prompts" description="Save your best performing AI instructions here for 1-click execution later." actionLabel="New Prompt" />
    </div>
  );
}
