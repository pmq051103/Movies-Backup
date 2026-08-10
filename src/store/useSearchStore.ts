import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MAX_RECENT_SEARCHES, STORAGE_KEYS } from '@/constants';

interface SearchState {
  recentSearches: string[];
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recentSearches: [],

      addRecentSearch: (term) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        const existing = get().recentSearches.filter(
          (t) => t.toLowerCase() !== trimmed.toLowerCase(),
        );
        const next = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES);
        set({ recentSearches: next });
      },

      removeRecentSearch: (term) => {
        set({
          recentSearches: get().recentSearches.filter(
            (t) => t.toLowerCase() !== term.toLowerCase(),
          ),
        });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: STORAGE_KEYS.RECENT_SEARCHES,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
