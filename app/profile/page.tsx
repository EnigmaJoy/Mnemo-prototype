'use client';

import { useTranslation } from 'react-i18next';
import BottomNav from '@/components/BottomNav';
import { SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config';

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const current = (SUPPORTED_LOCALES as readonly string[]).includes(i18n.language)
    ? (i18n.language as Locale)
    : 'en';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <>
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
        <header className="flex items-center mb-10">
          <h1 className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink">
            {t('profile.title')}
          </h1>
        </header>

        <section className="bg-mnemo-surface border border-mnemo-border rounded-lg p-5">
          <h2 className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-4">
            {t('profile.settings')}
          </h2>

          <label className="block">
            <span className="font-dm-sans text-sm text-mnemo-ink-secondary block mb-2">
              {t('profile.language')}
            </span>
            <select
                id="language"
              value={current}
              onChange={handleChange}
              className="w-full bg-mnemo-bg border border-mnemo-border rounded px-3 py-2 font-dm-sans text-sm text-mnemo-ink focus:outline-none focus:border-mnemo-ink"
            >
              {SUPPORTED_LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_LABELS[loc]}
                </option>
              ))}
            </select>
          </label>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
