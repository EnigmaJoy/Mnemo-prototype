'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import BottomNav from '@/components/BottomNav';
import FragmentItem from '@/components/FragmentItem';
import ResurfaceBanner from '@/components/ResurfaceBanner';
import { getFragments, getResurfacingHistory, isStorageAvailable } from '@/lib/storage';
import { getResurfacingCandidate } from '@/lib/resurfacing';
import type { Fragment, ResurfacingCandidate } from '@/lib/types';

const DISMISSED_KEY = 'mnemo_dismissed';

function getSessionDismissed(): string[] {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addSessionDismissed(id: string): void {
  try {
    const current = getSessionDismissed();
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]));
  } catch { /* noop */ }
}

export default function HomePage() {
  const [fragments,  setFragments]  = useState<Fragment[]>([]);
  const [candidate,  setCandidate]  = useState<ResurfacingCandidate | null>(null);
  const [storageOk,  setStorageOk]  = useState(true);

  useEffect(() => {
    setStorageOk(isStorageAvailable());
    const all       = getFragments();
    const history   = getResurfacingHistory();
    const dismissed = getSessionDismissed();

    setFragments(all.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    setCandidate(getResurfacingCandidate(all, history, dismissed));
  }, []);

  function handleDismiss() {
    if (!candidate) return;
    addSessionDismissed(candidate.fragment.id);
    setCandidate(null);
  }

  const recent = fragments.slice(0, 5);

  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4">
        <Logo />
      </header>

      <main className="px-4">
        {/* Storage warning */}
        {!storageOk && (
          <div className="mb-4 px-3 py-2.5 rounded-lg border border-mnemo-border bg-mnemo-surface">
            <p className="font-dm-sans text-mnemo-ink-secondary leading-relaxed" style={{ fontSize: '12px' }}>
              Mnemo works best when storage is available. Some browsers block this in private mode.
            </p>
          </div>
        )}

        {/* Resurfacing banner */}
        {candidate && (
          <ResurfaceBanner
            fragment={candidate.fragment}
            triggerType={candidate.triggerType}
            onDismiss={handleDismiss}
          />
        )}

        {/* Recent fragments */}
        {recent.length === 0 ? (
          <div className="pt-8 pb-4">
            <p className="font-cormorant italic text-mnemo-ink-secondary leading-relaxed" style={{ fontSize: '16px' }}>
              Nothing here yet. Start with one thought — anything you&apos;d want to find a year from now.
            </p>
          </div>
        ) : (
          <div>
            {recent.map(f => (
              <FragmentItem key={f.id} fragment={f} lines={2} />
            ))}
          </div>
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
    </div>
  );
}
