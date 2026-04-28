'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';
import FragmentItem from '@/components/FragmentItem';
import ResurfaceBanner from '@/components/ResurfaceBanner';
import {
  getFragments,
  getResurfacingHistory,
  getDismissedIds,
  isStorageAvailable,
} from '@/lib/storage';
import { selectResurfacingCandidate } from '@/lib/resurfacing';
import type { Fragment, ResurfacingCandidate } from '@/lib/types';

const RECENT_COUNT = 5;

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [recent, setRecent] = useState<Fragment[]>([]);
  const [candidate, setCandidate] = useState<ResurfacingCandidate | null>(null);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       One-time read from localStorage on mount; useSyncExternalStore would be
       overkill since we don't need to react to external storage changes. */
    const ok = isStorageAvailable();
    setStorageOk(ok);

    const all = getFragments();
    const sorted = [...all].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    setRecent(sorted.slice(0, RECENT_COUNT));

    const cand = selectResurfacingCandidate(
      all,
      getResurfacingHistory(),
      getDismissedIds()
    );
    setCandidate(cand);

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

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
            Mnemo works best when storage is available. Some browsers block this in private mode.
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

        {hydrated && recent.length === 0 && (
          <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed mt-12">
            {"Nothing here yet. Start with one thought — anything you'd want to find a year from now."}
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
        aria-label="New fragment"
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
