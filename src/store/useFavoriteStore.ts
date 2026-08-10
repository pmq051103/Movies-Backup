import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import type { MovieListItem } from '@/types';

interface FavoriteState {
  favorites: MovieListItem[];
  addFavorite: (movie: MovieListItem) => void;
  removeFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (movie: MovieListItem) => void;
  clearFavorites: () => void;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (movie) => {
        if (get().favorites.some((f) => f.slug === movie.slug)) return;
        set({ favorites: [movie, ...get().favorites] });
      },

      removeFavorite: (slug) => {
        set({ favorites: get().favorites.filter((f) => f.slug !== slug) });
      },

      isFavorite: (slug) => get().favorites.some((f) => f.slug === slug),

      toggleFavorite: (movie) => {
        if (get().favorites.some((f) => f.slug === movie.slug)) {
          set({ favorites: get().favorites.filter((f) => f.slug !== movie.slug) });
        } else {
          set({ favorites: [movie, ...get().favorites] });
        }
      },

      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: STORAGE_KEYS.FAVORITES,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
