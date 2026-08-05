import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Rocket, Lightbulb, Zap, Type, BarChart2, Settings, X, ArrowRight } from 'lucide-react';
import { useCampaigns } from '@/hooks/useCampaigns';
import { useClipIdeas } from '@/hooks/useClipIdeas';

interface CommandItem {
  id: string;
  label: string;
  desc?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  category: string;
}

const NAV_COMMANDS: CommandItem[] = [
  { id: 'home',          label: 'Dashboard',        icon: BarChart2,  href: '/dashboard',                  category: 'Navigate' },
  { id: 'ideas',         label: 'Idea Studio',       icon: Lightbulb,  href: '/dashboard/idea-studio',      category: 'Navigate' },
  { id: 'hooks',         label: 'Hook Engine',       icon: Zap,        href: '/dashboard/hook-engine',      category: 'Navigate' },
  { id: 'captions',      label: 'Caption OS',        icon: Type,       href: '/dashboard/caption-os',       category: 'Navigate' },
  { id: 'campaigns',     label: 'Campaign OS',       icon: Rocket,     href: '/dashboard/campaign-os',      category: 'Navigate' },
  { id: 'pipeline',      label: 'Clip Pipeline',     icon: Zap,        href: '/dashboard/clip-pipeline',    category: 'Navigate' },
  { id: 'analytics',     label: 'Analytics',         icon: BarChart2,  href: '/dashboard/analytics',        category: 'Navigate' },
  { id: 'ai-settings',   label: 'AI Settings',       icon: Settings,   href: '/dashboard/ai-settings',      category: 'Navigate' },
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const { data: campaigns } = useCampaigns();
  const { data: ideas }     = useClipIdeas();

  // Build full command list including dynamic items
  const allCommands: CommandItem[] = [
    ...NAV_COMMANDS,
    ...(campaigns ?? []).map(c => ({
      id: `campaign-${c.id}`, label: c.title,
      desc: `Campaign · ${c.status}`, icon: Rocket,
      href: '/dashboard/campaign-os', category: 'Campaigns',
    })),
    ...(ideas ?? []).slice(0, 5).map(i => ({
      id: `idea-${i.id}`, label: i.title,
      desc: 'Idea', icon: Lightbulb,
      href: '/dashboard/idea-studio', category: 'Ideas',
    })),
  ];

  const filtered = query.trim()
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc?.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Group by category
  const grouped: Record<string, CommandItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const flat = filtered;

  const execute = useCallback((item: CommandItem) => {
    if (item.action) item.action();
    else if (item.href) navigate(item.href);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && flat[selected]) execute(flat[selected]);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flat, selected, execute, onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.97, y: -8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: -8 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-[540px] bg-[#111111] border border-white/[0.08] rounded-[20px] shadow-2xl overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <Search className="h-4 w-4 text-[#71717A] shrink-0" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-[#FAFAFA] text-[14px] placeholder:text-[#71717A] outline-none" />
          <button onClick={onClose} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto py-2">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-[13px] text-[#71717A] text-center py-8">No results for "{query}"</p>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-[11px] font-medium text-[#71717A] uppercase tracking-widest px-4 py-2">
                  {category}
                </p>
                {items.map(item => {
                  const globalIdx = flat.indexOf(item);
                  const isSelected = globalIdx === selected;
                  return (
                    <button key={item.id} onClick={() => execute(item)} onMouseEnter={() => setSelected(globalIdx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-white/[0.03]'}`}>
                      <div className={`h-7 w-7 rounded-[8px] flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary/20' : 'bg-white/[0.06]'}`}>
                        <item.icon className={`h-3.5 w-3.5 ${isSelected ? 'text-primary' : 'text-[#71717A]'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${isSelected ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'}`}>{item.label}</p>
                        {item.desc && <p className="text-[11px] text-[#71717A] truncate">{item.desc}</p>}
                      </div>
                      {isSelected && <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/[0.06]">
          {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] font-mono text-[10px]">{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
