import React from 'react';
import { useAISettingsStore, AVAILABLE_MODELS } from '@/stores/useAISettingsStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useMemoryStore } from '@/stores/useMemoryStore';
import { Button } from '@/components/ui/button';
import { RotateCcw, Cpu, Sliders, Brain, Database } from 'lucide-react';

const TONES = ['viral', 'casual', 'professional', 'bold', 'educational'];
const PLATFORMS = ['tiktok', 'youtube', 'instagram', 'twitter', 'universal'];
const CREATIVITY = ['low', 'medium', 'high'] as const;
const LENGTHS = ['concise', 'balanced', 'detailed'] as const;
const MEMORY_LEVELS = ['minimal', 'standard', 'full'] as const;

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-[18px] bg-[#111111] border border-white/[0.06] space-y-5">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-[14px] font-semibold text-[#FAFAFA] tracking-tight">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-[#71717A]">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium capitalize transition-all ${value === opt ? 'bg-primary text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]' : 'bg-[#0D0D0D] border border-white/[0.06] text-[#71717A] hover:text-[#FAFAFA] hover:border-white/[0.12]'}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-[#71717A]">{label}</p>
        <span className="text-[12px] font-medium text-primary">{format ? format(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full accent-[#7C3AED] bg-white/[0.06] cursor-pointer" />
    </div>
  );
}

export default function AISettingsPage() {
  const { settings, updateSettings, resetSettings } = useAISettingsStore();
  const totalTokens = useHistoryStore(s => s.getTotalTokens());
  const totalCost   = useHistoryStore(s => s.getTotalCost());
  const recordCount = useHistoryStore(s => s.records.length);
  const favCount    = useHistoryStore(s => s.getFavorites().length);
  const clearHistory = useHistoryStore(s => s.clearAll);
  const clearMemory  = useMemoryStore(s => s.clearAll);

  return (
    <div className="os-page max-w-3xl animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-[#FAFAFA]">AI Settings</h2>
          <p className="text-[13px] sm:text-[14px] text-[#71717A] mt-1">Configure how Creator OS AI behaves.</p>
        </div>
        <Button onClick={resetSettings} variant="outline"
          className="h-9 rounded-[10px] border-white/[0.06] bg-[#111111] text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px] self-start sm:self-auto shrink-0">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset Defaults
        </Button>
      </div>

      {/* Model */}
      <Section icon={Cpu} title="Default Model">
        <div className="space-y-2">
          <p className="text-[12px] text-[#71717A]">Active model for all AI generations</p>
          <div className="grid gap-2">
            {AVAILABLE_MODELS.map(m => (
              <button key={m.id} onClick={() => updateSettings({ defaultModel: m.id })}
                className={`flex items-center justify-between px-4 py-3 rounded-[12px] border text-left transition-all ${settings.defaultModel === m.id ? 'border-primary/50 bg-primary/[0.08]' : 'border-white/[0.06] bg-[#0D0D0D] hover:border-white/[0.12]'}`}>
                <div>
                  <p className={`text-[13px] font-medium ${settings.defaultModel === m.id ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'}`}>{m.label}</p>
                  <p className="text-[11px] text-[#71717A] mt-0.5">{m.id}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${settings.defaultModel === m.id ? 'bg-primary/20 text-primary' : 'bg-white/[0.06] text-[#71717A]'}`}>{m.tier}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Generation */}
      <Section icon={Sliders} title="Generation Settings">
        <SliderRow label="Temperature" value={settings.temperature} min={0} max={1} step={0.05} onChange={v => updateSettings({ temperature: v })} format={v => v.toFixed(2)} />
        <OptionGroup label="Creativity" options={CREATIVITY} value={settings.creativity} onChange={v => updateSettings({ creativity: v as any })} />
        <OptionGroup label="Response Length" options={LENGTHS} value={settings.responseLength} onChange={v => updateSettings({ responseLength: v as any })} />
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[13px] text-[#FAFAFA]">Streaming responses</p>
            <p className="text-[12px] text-[#71717A]">Show AI output token by token</p>
          </div>
          <button onClick={() => updateSettings({ streaming: !settings.streaming })}
            className={`relative w-10 h-5.5 h-[22px] rounded-full transition-colors ${settings.streaming ? 'bg-primary' : 'bg-white/[0.12]'}`}>
            <span className={`absolute top-0.5 h-4.5 h-[18px] w-[18px] rounded-full bg-white transition-transform ${settings.streaming ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-[13px] text-[#FAFAFA]">Auto-save generations</p>
            <p className="text-[12px] text-[#71717A]">Automatically record every generation to history</p>
          </div>
          <button onClick={() => updateSettings({ autoSave: !settings.autoSave })}
            className={`relative w-10 h-[22px] rounded-full transition-colors ${settings.autoSave ? 'bg-primary' : 'bg-white/[0.12]'}`}>
            <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-transform ${settings.autoSave ? 'translate-x-[20px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </Section>

      {/* Persona */}
      <Section icon={Brain} title="AI Persona">
        <OptionGroup label="Preferred Tone" options={TONES} value={settings.preferredTone} onChange={v => updateSettings({ preferredTone: v })} />
        <OptionGroup label="Primary Platform" options={PLATFORMS} value={settings.preferredPlatform} onChange={v => updateSettings({ preferredPlatform: v })} />
        <OptionGroup label="Memory Level" options={MEMORY_LEVELS} value={settings.memoryLevel} onChange={v => updateSettings({ memoryLevel: v as any })} />
      </Section>

      {/* Usage stats */}
      <Section icon={Database} title="Usage & Data">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Generations', value: recordCount },
            { label: 'Favorites', value: favCount },
            { label: 'Tokens Used', value: totalTokens.toLocaleString() },
            { label: 'Est. Cost', value: `$${totalCost.toFixed(4)}` },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-[12px] bg-[#0D0D0D] border border-white/[0.06] text-center">
              <p className="text-[18px] font-semibold text-[#FAFAFA]">{s.value}</p>
              <p className="text-[11px] text-[#71717A] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <Button onClick={clearHistory} variant="outline" size="sm"
            className="rounded-[10px] border-red-500/20 bg-red-500/[0.06] text-red-400 hover:bg-red-500/10 text-[12px]">
            Clear History
          </Button>
          <Button onClick={clearMemory} variant="outline" size="sm"
            className="rounded-[10px] border-white/[0.06] bg-[#0D0D0D] text-[#A1A1AA] hover:text-[#FAFAFA] text-[12px]">
            Clear Memory
          </Button>
        </div>
      </Section>
    </div>
  );
}
