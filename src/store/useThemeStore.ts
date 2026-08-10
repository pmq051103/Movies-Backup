import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import type { Theme } from '@/types';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Initial theme resolution.
 * The app is designed dark-first (Netflix / streaming aesthetic), so
 * new visitors always land in dark mode regardless of their OS theme
 * preference. Existing users keep whatever they explicitly picked via
 * the theme switcher (persisted in localStorage).
 */
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage unavailable (SSR, privacy mode, etc.)
  }
  return 'dark';
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function persistTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore write errors
  }
}

const initialTheme = getInitialTheme();
applyThemeClass(initialTheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    applyThemeClass(next);
    persistTheme(next);
    set({ theme: next });
  },

  setTheme: (theme: Theme) => {
    applyThemeClass(theme);
    persistTheme(theme);
    set({ theme });
  },
}));
