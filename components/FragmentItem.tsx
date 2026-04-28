'use client';

import { useRef, useState } from 'react';
import type { Fragment } from '@/lib/types';

interface Props {
  fragment: Fragment;
  onDelete?: (id: string) => void;
}

const LONG_PRESS_MS = 600;
const PREVIEW_LINES = 3;

export default function FragmentItem({ fragment, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // suppresses the synthetic click that follows a completed long-press
  const longPressFired = useRef(false);

  const startPress = () => {
    if (!onDelete) return;
    longPressFired.current = false;
    timerRef.current = setTimeout(() => {
      longPressFired.current = true;
      setConfirming(true);
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggle = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    setExpanded(prev => !prev);
  };

  if (confirming && onDelete) {
    return (
      <div className="bg-mnemo-surface border border-mnemo-border rounded-lg p-4 my-2">
        <p className="font-dm-sans text-sm text-mnemo-ink mb-4">
          Remove this fragment? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              onDelete(fragment.id);
              setConfirming(false);
            }}
            className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 border border-mnemo-ink text-mnemo-ink"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-2 border border-mnemo-border text-mnemo-ink-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const preview = firstNLines(fragment.content, PREVIEW_LINES);
  const truncated = !expanded && hasMoreThanNLines(fragment.content, PREVIEW_LINES);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      className="py-5 border-b border-mnemo-border last:border-b-0 cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-mnemo-ink-tertiary"
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(prev => !prev);
        }
      }}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
    >
      <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-2">
        {formatDate(fragment.createdAt)}
      </div>
      <p className="font-cormorant italic text-mnemo-ink text-lg leading-relaxed whitespace-pre-wrap">
        {expanded ? fragment.content : preview}
        {truncated && <span className="text-mnemo-ink-tertiary"> …</span>}
      </p>
    </article>
  );
}

function firstNLines(content: string, n: number): string {
  const lines = content.split('\n');
  return lines.slice(0, n).join('\n');
}

function hasMoreThanNLines(content: string, n: number): boolean {
  return content.split('\n').length > n;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
