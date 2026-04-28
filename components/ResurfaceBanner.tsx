'use client';

import Link from 'next/link';
import type { Fragment, Resurface } from '@/lib/types';
import { addDismissedId } from '@/lib/storage';

interface Props {
  fragment: Fragment;
  triggerType: Resurface['triggerType'];
  onDismiss: () => void;
}

const TRIGGER_LABELS: Record<Resurface['triggerType'], string> = {
  day_7:  '7 days ago',
  day_14: '14 days ago',
  day_30: '30 days ago',
};

function firstNLines(content: string, n: number): string {
  return content.split('\n').slice(0, n).join('\n');
}

export default function ResurfaceBanner({ fragment, triggerType, onDismiss }: Props) {
  const handleDismiss = () => {
    addDismissedId(fragment.id);
    onDismiss();
  };

  return (
    <div
      role="region"
      aria-label="A previous fragment is resurfacing"
      className="bg-mnemo-dark rounded-xl p-5 animate-slide-fade-in"
    >
      <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-gold mb-3">
        {TRIGGER_LABELS[triggerType]}
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
          Read →
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="font-dm-mono text-xs uppercase tracking-[0.18em] text-mnemo-ink-tertiary"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
