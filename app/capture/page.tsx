// app/capture/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveFragment } from '@/lib/storage';

const MAX_LENGTH = 2000;

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Morning';
  if (h >= 12 && h < 17) return 'Afternoon';
  if (h >= 17 && h < 21) return 'Evening';
  return 'Night';
}

function formatContextDate(): string {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  });
}

export default function CapturePage() {
  const router              = useRouter();
  const [content, setContent]   = useState('');
  const [saved,   setSaved]     = useState(false);
  const [focused, setFocused]   = useState(false);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  function handleSave() {
    if (!content.trim() || saved) return;
    const now = new Date().toISOString();
    saveFragment({
      id:        crypto.randomUUID(),
      content:   content.trim(),
      createdAt: now,
      updatedAt: now,
    });
    setSaved(true);
    setTimeout(() => router.push('/'), 1500);
  }

  const remaining  = MAX_LENGTH - content.length;
  const counterRed = remaining < 100;
  const canSave    = content.trim().length > 0 && !saved;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-mnemo-border">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-mnemo-ink-secondary"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span className="font-dm-mono text-mnemo-ink-secondary text-[10px] uppercase tracking-widest">
          New fragment
        </span>

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`font-dm-mono text-[11px] uppercase tracking-wider transition-colors ${
            canSave ? 'text-mnemo-ink' : 'text-mnemo-ink-tertiary'
          }`}
        >
          Save
        </button>
      </header>

      {/* Content area */}
      <main className="flex-1 flex flex-col px-4 pt-5">
        {saved ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-cormorant italic text-mnemo-ink-secondary text-lg text-center leading-relaxed">
              Saved. It will return when the time is right.
            </p>
          </div>
        ) : (
          <>
            {/* Textarea */}
            <div
              className="flex-1 relative pb-2"
              style={{
                borderBottom: `1px solid ${focused ? '#18160f' : '#ddd6c5'}`,
                transition: 'border-color 0.2s ease',
              }}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxLength={MAX_LENGTH}
                placeholder="What's on your mind?"
                className="w-full bg-transparent border-none outline-none resize-none font-cormorant italic text-mnemo-ink leading-relaxed placeholder:text-mnemo-ink-tertiary"
                style={{ fontSize: '18px', minHeight: '200px' }}
              />
              {/* Character count */}
              <p
                className={`font-dm-mono text-right mt-1 transition-colors ${
                  counterRed ? 'text-red-500' : 'text-mnemo-ink-tertiary'
                }`}
                style={{ fontSize: '10px' }}
              >
                {content.length} / {MAX_LENGTH}
              </p>
            </div>

            {/* Context pills */}
            <div className="pt-3 pb-4 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-mnemo-border bg-mnemo-surface font-dm-mono text-mnemo-ink-tertiary text-[10px]">
                {formatContextDate()}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-mnemo-border bg-mnemo-surface font-dm-mono text-mnemo-ink-tertiary text-[10px]">
                {getTimeOfDay()}
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
