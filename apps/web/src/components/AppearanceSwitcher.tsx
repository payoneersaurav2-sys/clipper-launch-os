import { useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { AppearanceMode, useAppearance } from '@/components/AppearanceProvider';
import { cn } from '@/lib/utils';

const options: Array<{ id: AppearanceMode; label: string; icon: typeof Sun }> = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export function AppearanceSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { mode, resolvedMode, setMode } = useAppearance();
  const TriggerIcon = resolvedMode === 'dark' ? Moon : Sun;

  return (
    <div className={cn('relative', className)}>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-haspopup="menu"
        aria-label={`Appearance: ${mode}. Change appearance`}
        className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.04] text-[#A1A1AA] transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <TriggerIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label="Appearance" className="absolute right-0 top-[calc(100%+8px)] z-[70] w-44 rounded-[14px] border border-white/[0.1] bg-[#111111] p-1.5 shadow-[0_18px_44px_rgba(0,0,0,0.3)]">
          {options.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" role="menuitemradio" aria-checked={mode === id}
              onClick={() => { setMode(id); setOpen(false); }}
              className={cn('flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', mode === id ? 'bg-primary/12 text-primary' : 'text-[#A1A1AA] hover:bg-white/[0.06] hover:text-[#FAFAFA]')}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {mode === id && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
