// ============================================================
// CREATOR OS — GENERATION HISTORY STORE
// Every AI generation is recorded. Supports reuse, favorites, delete.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GenerationRecord, GenerationCategory } from '@clipper/core/src/ai/types';

function generateId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface HistoryStore {
  records: GenerationRecord[];

  // Write
  addRecord: (record: Omit<GenerationRecord, 'id' | 'timestamp' | 'isFavorite'>) => GenerationRecord;
  deleteRecord: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  clearAll: () => void;
  clearCategory: (category: GenerationCategory) => void;

  // Read
  getByCategory: (category: GenerationCategory) => GenerationRecord[];
  getByWorkspace: (workspaceId: string) => GenerationRecord[];
  getFavorites: () => GenerationRecord[];
  getRecent: (limit?: number) => GenerationRecord[];
  getById: (id: string) => GenerationRecord | undefined;

  // Stats
  getTotalTokens: () => number;
  getTotalCost: () => number;
  getUsageByModel: () => Record<string, number>;
  getUsageByCategory: () => Record<string, number>;
  getUsageByDay: () => Record<string, number>;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) => {
        const full: GenerationRecord = {
          ...record,
          id: generateId(),
          timestamp: new Date().toISOString(),
          isFavorite: false,
        };
        set(s => ({ records: [full, ...s.records].slice(0, 500) })); // cap at 500
        return full;
      },

      deleteRecord: (id) =>
        set(s => ({ records: s.records.filter(r => r.id !== id) })),

      toggleFavorite: (id) =>
        set(s => ({
          records: s.records.map(r =>
            r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
          ),
        })),

      addTag: (id, tag) =>
        set(s => ({
          records: s.records.map(r =>
            r.id === id ? { ...r, tags: [...new Set([...r.tags, tag])] } : r
          ),
        })),

      clearAll: () => set({ records: [] }),

      clearCategory: (category) =>
        set(s => ({ records: s.records.filter(r => r.category !== category) })),

      getByCategory: (category) =>
        get().records.filter(r => r.category === category),

      getByWorkspace: (workspaceId) =>
        get().records.filter(r => r.workspaceId === workspaceId),

      getFavorites: () =>
        get().records.filter(r => r.isFavorite),

      getRecent: (limit = 20) =>
        get().records.slice(0, limit),

      getById: (id) =>
        get().records.find(r => r.id === id),

      getTotalTokens: () =>
        get().records.reduce((acc, r) => acc + r.usage.totalTokens, 0),

      getTotalCost: () =>
        get().records.reduce((acc, r) => acc + (r.usage.estimatedCostUsd ?? 0), 0),

      getUsageByModel: () => {
        const map: Record<string, number> = {};
        for (const r of get().records) {
          map[r.model] = (map[r.model] ?? 0) + r.usage.totalTokens;
        }
        return map;
      },

      getUsageByCategory: () => {
        const map: Record<string, number> = {};
        for (const r of get().records) {
          map[r.category] = (map[r.category] ?? 0) + r.usage.totalTokens;
        }
        return map;
      },

      getUsageByDay: () => {
        const map: Record<string, number> = {};
        for (const r of get().records) {
          const day = r.timestamp.slice(0, 10);
          map[day] = (map[day] ?? 0) + r.usage.totalTokens;
        }
        return map;
      },
    }),
    {
      name: 'creator-os-history',
      version: 1,
    }
  )
);
