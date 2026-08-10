import { create } from 'zustand';
import i18n from '@/i18n';
import { STORAGE_KEYS } from '@/constants';
import type { Language } from '@/types';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'vi';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (stored === 'vi' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'vi';
}

function persistLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {
    // ignore
  }
}

const initialLanguage = getInitialLanguage();

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLanguage,

  setLanguage: (lang: Language) => {
    persistLanguage(lang);
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
    set({ language: lang });
  },
}));

// Keep the store in sync if i18next's language changes elsewhere
// (e.g. via the language detector plugin on first load).
i18n.on('languageChanged', (lng) => {
  const normalized: Language = lng.startsWith('en') ? 'en' : 'vi';
  if (useLanguageStore.getState().language !== normalized) {
    persistLanguage(normalized);
    useLanguageStore.setState({ language: normalized });
  }
});
