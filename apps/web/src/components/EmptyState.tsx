import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

export default function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] shrink-0 items-center justify-center rounded-[18px] border border-dashed border-white/[0.1] bg-[#111111]/70 px-5 py-10 animate-in fade-in duration-500">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/10 shadow-[0_0_22px_rgba(124,58,237,0.1)]">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-[#FAFAFA]">{title}</h3>
        <p className="mb-5 mt-2 text-[13px] leading-relaxed text-[#71717A]">
          {description}
        </p>
        <Button size="sm" className="relative" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
