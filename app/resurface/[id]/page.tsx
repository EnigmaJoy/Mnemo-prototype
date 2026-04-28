'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ReactionButtons from '@/components/ReactionButtons';
import {
  getFragments,
  getResurfacingHistory,
  saveResurfacing,
} from '@/lib/storage';
import { daysSince, getTriggerType } from '@/lib/resurfacing';
import type { Fragment, Resurface } from '@/lib/types';

const TRIGGER_LABEL: Record<Resurface['triggerType'], string> = {
  day_7:  '7 days ago',
  day_14: '14 days ago',
  day_30: '30 days ago',
};

const TRIGGER_DAYS: Record<Resurface['triggerType'], number> = {
  day_7: 7,
  day_14: 14,
  day_30: 30,
};

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ResurfaceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [hydrated, setHydrated] = useState(false);
  const [fragment, setFragment] = useState<Fragment | null>(null);
  const [record, setRecord] = useState<Resurface | null>(null);
  const [triggerType, setTriggerType] =
    useState<Resurface['triggerType'] | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       One-time load of fragment + resurface record on mount; per spec, the
       record is also created here on first view. */
    if (!id) return;

    const fragments = getFragments();
    const found = fragments.find((f) => f.id === id) ?? null;
    setFragment(found);

    if (!found) {
      setHydrated(true);
      return;
    }

    const history = getResurfacingHistory();
    const existing = history.find((r) => r.fragmentId === id) ?? null;

    if (existing) {
      setRecord(existing);
      setTriggerType(existing.triggerType);
    } else {
      const computed = getTriggerType(daysSince(found.createdAt));
      if (computed) {
        const fresh: Resurface = {
          fragmentId: id,
          shownAt: new Date().toISOString(),
          reaction: null,
          triggerType: computed,
        };
        saveResurfacing(fresh);
        setRecord(fresh);
        setTriggerType(computed);
      }
    }

    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id]);

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-6 pb-12">
      <header className="mb-12">
        <Link
          href="/"
          aria-label="Back"
          className="inline-flex items-center text-mnemo-ink"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
      </header>

      {hydrated && !fragment && (
        <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed">
          That fragment is no longer here.
        </p>
      )}

      {hydrated && fragment && triggerType && (
        <article>
          <div className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-gold mb-2">
            {TRIGGER_LABEL[triggerType]}
          </div>
          <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-10">
            {formatLongDate(fragment.createdAt)}
          </div>

          <div
            aria-hidden="true"
            className="font-cormorant text-mnemo-border leading-none mb-2 select-none"
            style={{ fontSize: '96px' }}
          >
            “
          </div>
          <p
            className="font-cormorant italic text-mnemo-ink leading-relaxed whitespace-pre-wrap"
            style={{ fontSize: '19px' }}
          >
            {fragment.content}
          </p>

          <hr className="border-0 border-t border-mnemo-border my-10" />

          <p className="font-dm-sans text-sm text-mnemo-ink-tertiary mb-10">
            This fragment surfaced because you wrote it{' '}
            {TRIGGER_DAYS[triggerType]} days ago.
          </p>

          <ReactionButtons
            fragmentId={fragment.id}
            initialReaction={record?.reaction ?? null}
          />

          <div className="mt-12">
            <Link
              href="/archive"
              className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary"
            >
              See in Archive →
            </Link>
          </div>
        </article>
      )}

      {hydrated && fragment && !triggerType && (
        <div>
          <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed">
            {"This fragment isn't due to surface yet."}
          </p>
          <Link
            href="/archive"
            className="inline-block mt-6 font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary"
          >
            See in Archive →
          </Link>
        </div>
      )}
    </main>
  );
}
