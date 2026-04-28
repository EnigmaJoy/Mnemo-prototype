'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { Fragment, Resurface } from '@/lib/types';
import { addDismissedId } from '@/lib/storage';
import { formatRelativeDays } from '@/lib/datetime';

interface Props {
  fragment: Fragment;
  triggerType: Resurface['triggerType'];
  onDismiss: () => void;
}

function firstNLines(content: string, n: number): string {
  return content.split('\n').slice(0, n).join('\n');
}

export default function ResurfaceBanner({ fragment, triggerType, onDismiss }: Props) {
  const { t, i18n } = useTranslation();

  const handleDismiss = () => {
    addDismissedId(fragment.id);
    onDismiss();
  };

  return (
    <div
      role="region"
      aria-label={t('resurface.bannerAria')}
      className="bg-mnemo-dark rounded-xl p-5 animate-slide-fade-in"
    >
      <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-gold mb-3">
        {formatRelativeDays(triggerType, i18n.language)}
      </div>
      <p
        className="font-cormorant italic text-base leading-relaxed mb-5 whitespace-pre-wrap"
        style={{ color: 'rgba(245, 241, 234, 0.88)' }}
      >
        {firstNLines(fragment.content, 2)}
      </p>
      <div className="flex items-center justify-between">
        <Link
          href={`/resurface/${fragment.id}`}
          className="font-dm-mono text-xs uppercase tracking-[0.18em] text-mnemo-gold"
        >
          {t('resurface.read')}
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="font-dm-mono text-xs uppercase tracking-[0.18em] text-mnemo-ink-tertiary"
        >
          {t('resurface.notNow')}
        </button>
      </div>
    </div>
  );
}
