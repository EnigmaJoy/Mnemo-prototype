'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import it from './locales/it.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import zhCN from './locales/zh-CN.json';
import { DEFAULT_LOCALE } from './config';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      it: { translation: it },
      de: { translation: de },
      fr: { translation: fr },
      'zh-CN': { translation: zhCN },
    },
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
