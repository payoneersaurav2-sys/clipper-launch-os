// ============================================================
// CREATOR OS — AI SETTINGS STORE
// User-configurable AI preferences. Persisted locally.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AISettings, AIModelId } from '@clipper/core/src/ai/types';

const DEFAULTS: AISettings = {
  defaultModel: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  creativity: 'medium',
  streaming: true,
  autoSave: true,
  memoryLevel: 'standard',
  responseLength: 'balanced',
  preferredTone: 'viral',
  preferredPlatform: 'tiktok',
};

interface AISettingsStore {
  settings: AISettings;
  updateSettings: (patch: Partial<AISettings>) => void;
  resetSettings: () => void;

  // Derived helpers
  getTemperatureForCreativity: () => number;
  getMaxTokensForLength: () => number;
}

const CREATIVITY_TEMP: Record<string, number> = {
  low:    0.3,
  medium: 0.7,
  high:   0.95,
};

const LENGTH_TOKENS: Record<string, number> = {
  concise:  512,
  balanced: 1024,
  detailed: 2048,
};

export const useAISettingsStore = create<AISettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULTS,

      updateSettings: (patch) =>
        set(s => ({ settings: { ...s.settings, ...patch } })),

      resetSettings: () => set({ settings: DEFAULTS }),

      getTemperatureForCreativity: () =>
        CREATIVITY_TEMP[get().settings.creativity] ?? 0.7,

      getMaxTokensForLength: () =>
        LENGTH_TOKENS[get().settings.responseLength] ?? 1024,
    }),
    {
      name: 'creator-os-ai-settings',
      version: 1,
    }
  )
);

// ---- Available Models list (for Settings UI) ----------------

export const AVAILABLE_MODELS: { id: AIModelId; label: string; tier: string }[] = [
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', tier: 'Premium' },
  { id: 'anthropic/claude-3-haiku',    label: 'Claude 3 Haiku',    tier: 'Fast' },
  { id: 'openai/gpt-4o',               label: 'GPT-4o',             tier: 'Premium' },
  { id: 'openai/gpt-4o-mini',          label: 'GPT-4o Mini',        tier: 'Fast' },
  { id: 'google/gemini-flash-1.5',     label: 'Gemini Flash 1.5',   tier: 'Fast' },
  { id: 'deepseek/deepseek-chat',      label: 'DeepSeek Chat',      tier: 'Economy' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', tier: 'Open Source' },
];
