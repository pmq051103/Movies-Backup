import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import type { WatchHistoryItem } from '@/types';

const MAX_HISTORY_ITEMS = 100;

interface HistoryState {
  history: WatchHistoryItem[];
  addToHistory: (item: WatchHistoryItem) => void;
  removeFromHistory: (slug: string) => void;
  getProgress: (slug: string, episode: string) => number;
  getHistoryItem: (slug: string) => WatchHistoryItem | undefined;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      addToHistory: (item) => {
        const existing = get().history.filter((h) => h.slug !== item.slug);
        const updated: WatchHistoryItem = { ...item, updatedAt: Date.now() };
        const next = [updated, ...existing].slice(0, MAX_HISTORY_ITEMS);
        set({ history: next });
      },

      removeFromHistory: (slug) => {
        set({ history: get().history.filter((h) => h.slug !== slug) });
      },

      getProgress: (slug, episode) => {
        const entry = get().history.find((h) => h.slug === slug && h.episode === episode);
        return entry?.progress ?? 0;
      },

      getHistoryItem: (slug) => {
        return get().history.find((h) => h.slug === slug);
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: STORAGE_KEYS.HISTORY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
