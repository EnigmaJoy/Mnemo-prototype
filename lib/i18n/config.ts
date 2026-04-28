export const SUPPORTED_LOCALES = ['en', 'it', 'de', 'fr', 'zh-CN'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_STORAGE_KEY = 'mnemo_locale';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  'zh-CN': '简体中文',
};

function isSupported(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && isSupported(saved)) return saved;
  } catch {
    // localStorage unavailable — fall through to navigator detection
  }

  const nav = navigator.language;
  if (isSupported(nav)) return nav;
  const base = nav.split('-')[0];
  const found = SUPPORTED_LOCALES.find((l) => l.split('-')[0] === base);
  return found ?? DEFAULT_LOCALE;
}
