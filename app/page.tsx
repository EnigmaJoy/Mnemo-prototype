'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';
import FragmentItem from '@/components/FragmentItem';
import ResurfaceBanner from '@/components/ResurfaceBanner';
import {
  getAllFragments,
  getEarliestFragment,
  getFragmentCount,
  getFragmentsCreatedToday,
  isFragmentStorageAvailable,
} from '@/controllers/fragmentController';
import {
  dismissCandidate,
  getCandidateToResurface,
  hasFirstResurfacingHappened,
} from '@/controllers/resurfacingController';
import { setPromptOverride } from '@/controllers/captureController';
import { findRecurringWord, type Fragment } from '@/models/fragment';
import {
  DAYS_TO_FIRST_RESURFACE,
  daysSince,
  type ResurfacingCandidate,
} from '@/models/resurfacing';
import { pickPromptIndexForMoment } from '@/models/dailyPrompt';

const RECENT_COUNT = 5;
const COUNTDOWN_HIDE_FROM_DAYS = 6;
const DAILY_PROMPT_DAILY_THRESHOLD = 5;

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [hydrated, setHydrated] = useState(false);
  const [recent, setRecent] = useState<Fragment[]>([]);
  const [candidate, setCandidate] = useState<ResurfacingCandidate | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [hadResurfacing, setHadResurfacing] = useState(false);
  const [fragmentCount, setFragmentCount] = useState(0);
  const [daysFromEarliest, setDaysFromEarliest] = useState<number | null>(null);
  const [recurringWord, setRecurringWord] = useState<string | null>(null);
  const [savedToday, setSavedToday] = useState(0);
  const [todaysPromptIdx, setTodaysPromptIdx] = useState(0);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setStorageOk(isFragmentStorageAvailable());

    const all = getAllFragments();
    setFragmentCount(getFragmentCount());
    setRecent(all.slice(0, RECENT_COUNT));
    setHadResurfacing(hasFirstResurfacingHappened());
    setCandidate(getCandidateToResurface());

    const earliest = getEarliestFragment();
    setDaysFromEarliest(earliest ? daysSince(earliest.createdAt) : null);

    setRecurringWord(findRecurringWord(all, i18n.language));
    setSavedToday(getFragmentsCreatedToday());

    const promptsRaw = t('home.dailyPrompt.prompts', { returnObjects: true });
    const promptCount = Array.isArray(promptsRaw) ? promptsRaw.length : 0;
    setTodaysPromptIdx(pickPromptIndexForMoment(new Date(), promptCount));

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [i18n.language, t]);

  const showOnboarding = hydrated && !hadResurfacing && !candidate;
  const showCountdown =
    showOnboarding &&
    (daysFromEarliest === null || daysFromEarliest < COUNTDOWN_HIDE_FROM_DAYS);
  const showStats = showOnboarding && fragmentCount >= 1;
  const showDailyPrompt = showOnboarding && savedToday < DAILY_PROMPT_DAILY_THRESHOLD;

  const promptsRaw = t('home.dailyPrompt.prompts', { returnObjects: true });
  const prompts = Array.isArray(promptsRaw) ? (promptsRaw as string[]) : [];
  const todaysPrompt = prompts[todaysPromptIdx] ?? '';

  const progressPct =
    daysFromEarliest === null
      ? 0
      : Math.min(100, (daysFromEarliest / DAYS_TO_FIRST_RESURFACE) * 100);

  const handlePromptClick = () => {
    setPromptOverride(todaysPrompt);
    router.push('/capture');
  };

  const handleDismissCandidate = () => {
    if (candidate) dismissCandidate(candidate.fragment.id);
    setCandidate(null);
  };

  return (
    <>
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
        <header className="flex items-center gap-3 mb-10">
          <Logo />
          <span className="font-cormorant font-light uppercase tracking-[0.18em] text-sm">
            mnemo
          </span>
        </header>

        {hydrated && !storageOk && (
          <div className="bg-mnemo-surface border border-mnemo-border rounded-lg p-4 mb-6 text-sm font-dm-sans text-mnemo-ink-secondary">
            {t('home.storageUnavailable')}
          </div>
        )}

        {hydrated && candidate && (
          <div className="mb-8">
            <ResurfaceBanner
              fragment={candidate.fragment}
              triggerType={candidate.triggerType}
              onDismiss={handleDismissCandidate}
            />
          </div>
        )}

        {showCountdown && (
          <div className="border border-mnemo-border rounded-lg p-5 mb-6">
            <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-gold mb-3">
              {t('home.firstResurfacing.label')}
            </div>
            <p className="font-cormorant font-light text-xl text-mnemo-ink leading-relaxed mb-4">
              {fragmentCount === 0
                ? t('home.firstResurfacing.empty')
                : t('home.firstResurfacing.message', {
                    count: DAYS_TO_FIRST_RESURFACE - (daysFromEarliest ?? 0),
                  })}
            </p>
            <div className="h-px w-full bg-mnemo-border">
              <div
                className="h-px bg-mnemo-ink"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {showStats && (
          <div className="border-t border-b border-mnemo-border py-6 mb-6 grid grid-cols-3">
            <div className="text-center">
              <div className="font-cormorant font-light text-mnemo-ink leading-none text-[28px]">
                {fragmentCount}
              </div>
              <div className="font-dm-mono text-[9px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mt-2">
                {t('home.stats.fragments')}
              </div>
            </div>
            <div className="text-center">
              <div className="font-cormorant font-light text-mnemo-ink leading-none text-[28px]">
                {daysFromEarliest ?? 0}
              </div>
              <div className="font-dm-mono text-[9px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mt-2">
                {t('home.stats.days')}
              </div>
            </div>
            <div className="text-center">
              <div className="font-cormorant font-light text-mnemo-ink leading-none text-[28px] truncate px-1">
                {recurringWord ?? '-'}
              </div>
              <div className="font-dm-mono text-[9px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mt-2">
                {t('home.stats.recurringWord')}
              </div>
            </div>
          </div>
        )}

        {showDailyPrompt && todaysPrompt && (
          <button
            type="button"
            onClick={handlePromptClick}
            className="w-full text-left bg-mnemo-surface rounded-lg mb-6 relative block px-[18px] py-4"
          >
            <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-2">
              {t('home.dailyPrompt.label')}
            </div>
            <p className="font-cormorant italic text-mnemo-ink leading-relaxed pr-6 text-base">
              {todaysPrompt}
            </p>
            <span className="absolute bottom-3 right-4 text-mnemo-ink-tertiary">→</span>
          </button>
        )}

        {hydrated && recent.length === 0 && (
          <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed mt-12">
            {t('home.empty')}
          </p>
        )}

        {hydrated && recent.length > 0 && (
          <section>
            {recent.map((fragment) => (
              <FragmentItem key={fragment.id} fragment={fragment} />
            ))}
          </section>
        )}
      </main>

      <Link
        href="/capture"
        className="fixed bottom-20 right-4 w-12 h-12 bg-mnemo-ink text-mnemo-bg rounded-full flex items-center justify-center shadow-lg"
        aria-label={t('home.newFragmentAria')}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </Link>

      <BottomNav />
    </>
  );
}
