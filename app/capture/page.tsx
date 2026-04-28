'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveFragment } from '@/lib/storage';
import type { Fragment } from '@/lib/types';

const MAX_CHARS = 2000;
const COUNTER_RED_OVER = 1900;
const SAVED_REDIRECT_MS = 1500;

function timeOfDay(hour: number): string {
  if (hour >= 5  && hour <= 11) return 'Morning';
  if (hour >= 12 && hour <= 17) return 'Afternoon';
  if (hour >= 18 && hour <= 21) return 'Evening';
  return 'Night';
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CapturePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [contextNow, setContextNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of wall-clock time on mount
    setContextNow(new Date());
    textareaRef.current?.focus();
  }, []);

  const canSave = content.trim().length > 0 && !saved;
  const counterRed = content.length > COUNTER_RED_OVER;
  const remaining = MAX_CHARS - content.length;

  const handleSave = () => {
    if (!canSave) return;
    const iso = new Date().toISOString();
    const fragment: Fragment = {
      id: crypto.randomUUID(),
      content: content.trim(),
      createdAt: iso,
      updatedAt: iso,
    };
    saveFragment(fragment);
    setSaved(true);
    setTimeout(() => router.push('/'), SAVED_REDIRECT_MS);
  };

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-6 pb-12">
      <header className="flex items-center justify-between mb-10">
        <Link
          href="/"
          aria-label="Back"
          className="flex items-center gap-2 text-mnemo-ink"
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
          <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em]">
            New fragment
          </span>
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`font-dm-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
            canSave
              ? 'text-mnemo-ink'
              : 'text-mnemo-ink-tertiary cursor-not-allowed'
          }`}
        >
          Save
        </button>
      </header>

      {saved ? (
        <p className="font-cormorant italic text-2xl text-mnemo-ink leading-relaxed mt-12">
          Saved. It will return when the time is right.
        </p>
      ) : (
        <>
          <div className="border-b border-mnemo-border focus-within:border-mnemo-ink transition-colors mb-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder="What's on your mind?"
              rows={6}
              className="w-full bg-transparent border-0 outline-none resize-none font-cormorant italic text-[18px] leading-relaxed text-mnemo-ink placeholder:text-mnemo-ink-tertiary py-2 min-h-[160px]"
            />
          </div>
          <div className="flex justify-end mb-8">
            <span
              className={`font-dm-mono text-[10px] tabular-nums ${
                counterRed ? 'text-red-600' : 'text-mnemo-ink-tertiary'
              }`}
              aria-live="polite"
            >
              {remaining}
            </span>
          </div>
          {contextNow && (
            <div className="border-t border-mnemo-border pt-5 flex flex-wrap gap-2">
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary border border-mnemo-border rounded-full px-3 py-1">
                {formatDate(contextNow)}
              </span>
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary border border-mnemo-border rounded-full px-3 py-1">
                {timeOfDay(contextNow.getHours())}
              </span>
            </div>
          )}
        </>
      )}
    </main>
  );
}
