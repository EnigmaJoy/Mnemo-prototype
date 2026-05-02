'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import ReactionButtons from '@/components/ReactionButtons';
import {
  loadResurfaceContext,
  saveReaction,
  type ResurfaceContext,
} from '@/controllers/resurfacingController';
import { getTriggerDays } from '@/models/resurfacing';
import { formatLongDate, formatRelativeDays } from '@/lib/datetime';

export default function ResurfaceDetailPage() {
  const { t, i18n } = useTranslation();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [hydrated, setHydrated] = useState(false);
  const [context, setContext] = useState<ResurfaceContext | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!id) return;
    setContext(loadResurfaceContext(id));
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id]);

  const handleReact = (reaction: 'still_true' | 'changed' | 'archived') => {
    if (!context) return;
    saveReaction(context.fragment.id, reaction);
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
      <header className="mb-12">
        <Link
          href="/"
          aria-label={t('common.back')}
          className="inline-flex items-center text-mnemo-ink py-2"
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

      {hydrated && !context && (
        <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed">
          {t('resurface.missing')}
        </p>
      )}

      {hydrated && context && context.triggerType && (
        <article>
          <div className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-gold mb-2">
            {formatRelativeDays(context.triggerType, i18n.language)}
          </div>
          <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-10">
            {formatLongDate(context.fragment.createdAt, i18n.language)}
          </div>

          <div
            aria-hidden="true"
            className="font-cormorant text-mnemo-border leading-none mb-2 select-none text-[96px]"
          >
            “
          </div>
          <p className="font-cormorant italic text-mnemo-ink leading-relaxed whitespace-pre-wrap text-[19px]">
            {context.fragment.content}
          </p>

          <hr className="border-0 border-t border-mnemo-border my-10" />

          <p className="font-dm-sans text-sm text-mnemo-ink-tertiary mb-10">
            {t('resurface.explanation', { count: getTriggerDays(context.triggerType) })}
          </p>

          <ReactionButtons
            initialReaction={context.record?.reaction ?? null}
            onReact={handleReact}
          />

          <div className="mt-12">
            <Link
              href="/archive"
              className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary py-2 inline-block"
            >
              {t('resurface.seeInArchive')}
            </Link>
          </div>
        </article>
      )}

      {hydrated && context && !context.triggerType && (
        <div>
          <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed">
            {t('resurface.notDueYet')}
          </p>
          <Link
            href="/archive"
            className="inline-block mt-6 font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary py-2"
          >
            {t('resurface.seeInArchive')}
          </Link>
        </div>
      )}
    </main>
  );
}
