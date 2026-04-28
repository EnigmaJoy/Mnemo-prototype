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
  getFragments,
  getResurfacingHistory,
  getDismissedIds,
  getFragmentsSavedToday,
  isStorageAvailable,
} from '@/lib/storage';
import {
  selectResurfacingCandidate,
  hasHadFirstResurfacing,
  daysSince,
} from '@/lib/resurfacing';
import type { Fragment, ResurfacingCandidate } from '@/lib/types';

const RECENT_COUNT = 5;
const DAYS_TO_FIRST_RESURFACE = 7;
const COUNTDOWN_VISIBLE_UNTIL = 6; // hide countdown once daysSince(earliest) >= 6
const DAILY_PROMPT_DAILY_THRESHOLD = 5;
const PROMPT_STORAGE_KEY = 'mnemo_capture_prompt';
const PROMPTS_LENGTH = 30;

const STOP_WORDS = new Set([
  'i', 'the', 'a', 'is', 'in', 'and', 'to', 'of', 'it',
  'that', 'this', 'for', 'on', 'with', 'was', 'but',
]);

function findRecurringWord(fragments: Fragment[], locale: string): string | null {
  const textFragments = fragments.filter((f) => f.type !== 'audio');
  if (textFragments.length < 3) return null;
  if (locale.startsWith('zh')) return null;

  const counts = new Map<string, number>();
  for (const f of textFragments) {
    const words = f.content.toLowerCase().split(/[^\p{L}\p{N}']+/u).filter(Boolean);
    for (const w of words) {
      if (w.length < 2 || STOP_WORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 1;
  for (const [w, c] of counts) {
    if (c > bestCount) {
      bestCount = c;
      best = w;
    }
  }
  return best;
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

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
    /* eslint-disable react-hooks/set-state-in-effect --
       One-time read from storage on mount. */
    const ok = isStorageAvailable();
    setStorageOk(ok);

    const all = getFragments();
    setFragmentCount(all.length);

    const sorted = [...all].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    setRecent(sorted.slice(0, RECENT_COUNT));

    const history = getResurfacingHistory();
    setHadResurfacing(hasHadFirstResurfacing(history));

    setCandidate(selectResurfacingCandidate(all, history, getDismissedIds()));

    if (all.length > 0) {
      const earliest = all.reduce((min, f) =>
        Date.parse(f.createdAt) < Date.parse(min.createdAt) ? f : min
      );
      setDaysFromEarliest(daysSince(earliest.createdAt));
    } else {
      setDaysFromEarliest(null);
    }

    setRecurringWord(findRecurringWord(all, i18n.language));
    setSavedToday(getFragmentsSavedToday());
    const now = new Date();
    setTodaysPromptIdx((dayOfYear(now) * 7 + now.getHours()) % PROMPTS_LENGTH);

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [i18n.language]);

  const showOnboarding = hydrated && !hadResurfacing && !candidate;
  const showCountdown =
    showOnboarding &&
    (daysFromEarliest === null || daysFromEarliest < COUNTDOWN_VISIBLE_UNTIL);
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
    try {
      sessionStorage.setItem(PROMPT_STORAGE_KEY, todaysPrompt);
    } catch {
      // sessionStorage unavailable - capture page falls back to the default placeholder
    }
    router.push('/capture');
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
              onDismiss={() => setCandidate(null)}
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
              <div
                className="font-cormorant font-light text-mnemo-ink leading-none"
                style={{ fontSize: '28px' }}
              >
                {fragmentCount}
              </div>
              <div className="font-dm-mono text-[9px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mt-2">
                {t('home.stats.fragments')}
              </div>
            </div>
            <div className="text-center">
              <div
                className="font-cormorant font-light text-mnemo-ink leading-none"
                style={{ fontSize: '28px' }}
              >
                {daysFromEarliest ?? 0}
              </div>
              <div className="font-dm-mono text-[9px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mt-2">
                {t('home.stats.days')}
              </div>
            </div>
            <div className="text-center">
              <div
                className="font-cormorant font-light text-mnemo-ink leading-none"
                style={{ fontSize: '28px' }}
              >
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
            className="w-full text-left bg-mnemo-surface rounded-lg mb-6 relative block"
            style={{ padding: '16px 18px' }}
          >
            <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-2">
              {t('home.dailyPrompt.label')}
            </div>
            <p
              className="font-cormorant italic text-mnemo-ink leading-relaxed pr-6"
              style={{ fontSize: '16px' }}
            >
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
            {recent.map((f) => (
              <FragmentItem key={f.id} fragment={f} />
            ))}
          </section>
        )}
      </main>

      {/* FAB */}
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
