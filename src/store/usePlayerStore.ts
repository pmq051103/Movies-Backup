import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import type { MovieDetail } from '@/types';

interface CurrentEpisode {
  serverIndex: number;
  episodeIndex: number;
}

interface PlayerState {
  currentMovie: MovieDetail | null;
  currentEpisode: CurrentEpisode;
  cinemaMode: boolean;
  autoNext: boolean;
  setCurrentMovie: (movie: MovieDetail | null) => void;
  setCurrentEpisode: (episode: CurrentEpisode) => void;
  setCinemaMode: (value: boolean) => void;
  setAutoNext: (value: boolean) => void;
  reset: () => void;
}

const DEFAULT_EPISODE: CurrentEpisode = { serverIndex: 0, episodeIndex: 0 };

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      currentMovie: null,
      currentEpisode: DEFAULT_EPISODE,
      cinemaMode: false,
      autoNext: true,

      setCurrentMovie: (movie) =>
        set({ currentMovie: movie, currentEpisode: DEFAULT_EPISODE }),

      setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

      setCinemaMode: (value) => set({ cinemaMode: value }),

      setAutoNext: (value) => set({ autoNext: value }),

      reset: () => set({ currentMovie: null, currentEpisode: DEFAULT_EPISODE }),
    }),
    {
      name: STORAGE_KEYS.PLAYER_SETTINGS,
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not the transient movie/episode state.
      partialize: (state) => ({
        cinemaMode: state.cinemaMode,
        autoNext: state.autoNext,
      }),
    },
  ),
);
