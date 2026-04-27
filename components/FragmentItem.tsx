'use client';

import type { Fragment } from '@/lib/types';

interface FragmentItemProps {
  fragment: Fragment;
  /** Number of lines to show (2 for Home, 3 for Archive). Default 2. */
  lines?: 2 | 3;
  /** Show the full content (used in Archive expand). */
  expanded?: boolean;
}

function formatTimestamp(isoDate: string): string {
  const now    = new Date();
  const date   = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffD  = Math.floor(diffMs / 86_400_000);

  if (diffD === 0) {
    return `today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (diffD === 1) return 'yesterday';
  if (diffD < 7)   return `${diffD} days ago`;
  if (diffD < 30)  return `${Math.floor(diffD / 7)} weeks ago`;
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function FragmentItem({ fragment, lines = 2, expanded = false }: FragmentItemProps) {
  const clampClass = expanded ? '' : lines === 2 ? 'line-clamp-2' : 'line-clamp-3';

  return (
    <div className="py-3 border-b border-mnemo-border last:border-0">
      <p
        className={`font-cormorant italic text-mnemo-ink leading-relaxed ${clampClass}`}
        style={{ fontSize: '16px' }}
      >
        {fragment.content}
      </p>
      <p className="font-dm-mono text-mnemo-ink-tertiary mt-1.5" style={{ fontSize: '10px' }}>
        {formatTimestamp(fragment.createdAt)}
      </p>
    </div>
  );
}
