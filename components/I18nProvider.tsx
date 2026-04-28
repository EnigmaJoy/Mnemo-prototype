'use client';

import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { detectInitialLocale, LOCALE_STORAGE_KEY } from '@/lib/i18n/config';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initial = detectInitialLocale();
    if (i18n.language !== initial) {
      i18n.changeLanguage(initial);
    }
    document.documentElement.lang = initial;

    const handler = (lng: string) => {
      document.documentElement.lang = lng;
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, lng);
      } catch {
        // localStorage unavailable - locale won't persist this session
      }
    };
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
