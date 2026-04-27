// app/resurface/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactionButtons from '@/components/ReactionButtons';
import {
  getFragments,
  getResurfacingHistory,
  saveResurfacing,
  updateResurfacing,
} from '@/lib/storage';
import { getTriggerLabel, getResurfacingCandidate, daysSince } from '@/lib/resurfacing';
import type { Fragment, Resurface } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Map triggerType → explanation sentence (canonical — no raw daysSince in UI)
const TRIGGER_EXPLANATION: Record<Resurface['triggerType'], string> = {
  day_7:  'This fragment surfaced because you wrote it 7 days ago.',
  day_14: 'This fragment surfaced because you wrote it 14 days ago.',
  day_30: 'This fragment surfaced because you wrote it 30 days ago.',
};

/**
 * Fallback trigger type inference when the candidate check doesn't match.
 * Uses daysSince only to pick the nearest window — never shown in UI.
 */
function inferTriggerType(fragment: Fragment): Resurface['triggerType'] {
  const d = daysSince(fragment.createdAt);
  if (d >= 6  && d <= 8)  return 'day_7';
  if (d >= 13 && d <= 15) return 'day_14';
  return 'day_30';
}

export default function ResurfaceDetailPage({ params }: PageProps) {
  const router = useRouter();

  const [id,         setId]         = useState<string | null>(null);
  const [fragment,   setFragment]   = useState<Fragment | null>(null);
  const [resurface,  setResurface]  = useState<Resurface | null>(null);
  const [notFound,   setNotFound]   = useState(false);

  // Resolve params (Next.js 15+ params is a Promise)
  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fragments = getFragments();
    const found     = fragments.find(f => f.id === id);

    if (!found) {
      setNotFound(true);
      return;
    }

    setFragment(found);

    const history  = getResurfacingHistory();
    const existing = history.find(r => r.fragmentId === id);

    if (existing) {
      setResurface(existing);
      return;
    }

    // Determine triggerType — prefer candidate check, fall back to inference
    const candidate  = getResurfacingCandidate(fragments, history, []);
    const triggerType: Resurface['triggerType'] =
      candidate?.fragment.id === id
        ? candidate.triggerType
        : inferTriggerType(found);

    const newRecord: Resurface = {
      fragmentId: id,
      shownAt:    new Date().toISOString(),
      reaction:   null,
      triggerType,
    };
    saveResurfacing(newRecord);
    setResurface(newRecord);
  }, [id]);

  function handleReact(reaction: Exclude<Resurface['reaction'], null>) {
    if (!id) return;
    updateResurfacing(id, reaction);
    setResurface(prev => prev ? { ...prev, reaction } : prev);
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="font-cormorant italic text-mnemo-ink-secondary text-lg text-center">
          This fragment no longer exists.
        </p>
      </div>
    );
  }

  if (!fragment || !resurface) return null;

  const label       = getTriggerLabel(resurface.triggerType); // canonical — from triggerType
  const explanation = TRIGGER_EXPLANATION[resurface.triggerType];
  const exactDate   = new Date(fragment.createdAt).toLocaleDateString([], {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-mnemo-ink-secondary"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>

      <main className="flex-1 px-4 pt-2 pb-12">
        {/* Distance label — canonical, derived from triggerType only */}
        <p className="font-dm-mono text-mnemo-gold text-[10px] uppercase tracking-widest mb-1">
          {label}
        </p>
        {/* Exact creation date */}
        <p className="font-dm-mono text-mnemo-ink-tertiary text-[11px] mb-8">
          {exactDate}
        </p>

        {/* Decorative opening quote mark */}
        <p
          className="font-cormorant text-mnemo-border leading-none mb-2 select-none"
          style={{ fontSize: '72px', lineHeight: 1 }}
          aria-hidden="true"
        >
          &ldquo;
        </p>

        {/* Fragment text */}
        <p
          className="font-cormorant italic text-mnemo-ink leading-relaxed mb-8"
          style={{ fontSize: '19px' }}
        >
          {fragment.content}
        </p>

        {/* Divider */}
        <div className="border-t border-mnemo-border mb-6" />

        {/* Trigger explanation */}
        <p className="font-dm-sans text-mnemo-ink-tertiary leading-relaxed mb-8" style={{ fontSize: '12px' }}>
          {explanation}
        </p>

        {/* Reactions */}
        <ReactionButtons
          initial={resurface.reaction}
          onReact={handleReact}
        />

        {/* Link to Archive */}
        <div className="mt-8">
          <Link
            href="/archive"
            className="font-dm-mono text-mnemo-ink-tertiary hover:text-mnemo-ink transition-colors text-[10px] uppercase tracking-wider"
          >
            See in archive →
          </Link>
        </div>
      </main>
    </div>
  );
}
