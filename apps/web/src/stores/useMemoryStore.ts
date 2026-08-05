// ============================================================
// CREATOR OS — AI MEMORY STORE
// Persistent memory with categories, search, expiry, weight.
// Uses Zustand + localStorage. Ready for Supabase sync.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MemoryItem, MemoryCategory } from '@clipper/core/src/ai/types';

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface MemoryStore {
  items: MemoryItem[];

  // CRUD
  addMemory: (item: Omit<MemoryItem, 'id' | 'createdAt'>) => MemoryItem;
  updateMemory: (id: string, patch: Partial<Omit<MemoryItem, 'id'>>) => void;
  deleteMemory: (id: string) => void;
  clearCategory: (category: MemoryCategory) => void;
  clearAll: () => void;

  // Query
  getByCategory: (category: MemoryCategory) => MemoryItem[];
  search: (query: string) => MemoryItem[];
  getRelevant: (tags: string[], limit?: number) => MemoryItem[];
  getForContext: (workspaceId?: string, limit?: number) => MemoryItem[];

  // Maintenance
  purgeExpired: () => void;
  boostWeight: (id: string, amount?: number) => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      items: [],

      addMemory: (item) => {
        const full: MemoryItem = {
          ...item,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set(s => ({ items: [...s.items, full] }));
        return full;
      },

      updateMemory: (id, patch) =>
        set(s => ({
          items: s.items.map(m => m.id === id ? { ...m, ...patch } : m),
        })),

      deleteMemory: (id) =>
        set(s => ({ items: s.items.filter(m => m.id !== id) })),

      clearCategory: (category) =>
        set(s => ({ items: s.items.filter(m => m.category !== category) })),

      clearAll: () => set({ items: [] }),

      getByCategory: (category) =>
        get().items.filter(m => m.category === category),

      search: (query) => {
        const q = query.toLowerCase();
        return get().items.filter(m =>
          m.content.toLowerCase().includes(q) ||
          m.tags.some(t => t.toLowerCase().includes(q))
        );
      },

      getRelevant: (tags, limit = 10) => {
        const all = get().items;
        const now = Date.now();

        return all
          .filter(m => {
            if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
            return true;
          })
          .map(m => {
            const tagMatch = tags.filter(t =>
              m.tags.includes(t) || m.content.toLowerCase().includes(t.toLowerCase())
            ).length;
            return { ...m, _score: m.weight + tagMatch * 0.1 };
          })
          .sort((a, b) => (b as any)._score - (a as any)._score)
          .slice(0, limit);
      },

      getForContext: (workspaceId, limit = 15) => {
        const now = Date.now();
        return get().items
          .filter(m => {
            if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
            if (workspaceId && m.workspaceId && m.workspaceId !== workspaceId) return false;
            return true;
          })
          .sort((a, b) => b.weight - a.weight)
          .slice(0, limit);
      },

      purgeExpired: () => {
        const now = Date.now();
        set(s => ({
          items: s.items.filter(m =>
            !m.expiresAt || new Date(m.expiresAt).getTime() >= now
          ),
        }));
      },

      boostWeight: (id, amount = 0.05) =>
        set(s => ({
          items: s.items.map(m =>
            m.id === id ? { ...m, weight: Math.min(1, m.weight + amount) } : m
          ),
        })),
    }),
    {
      name: 'creator-os-memory',
      version: 1,
    }
  )
);
