'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatShortDate } from '@/lib/datetime';
import { getAudioBlob } from '@/lib/audio/db';
import type { Fragment } from '@/models/fragment';

interface Props {
  fragment: Fragment;
  onDelete?: (id: string) => void | Promise<void>;
}

const LONG_PRESS_MS = 600;
const PREVIEW_LINES = 3;

export default function FragmentItem({ fragment, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const isAudio = fragment.type === 'audio';

  useEffect(() => {
    if (!isAudio || !expanded || !fragment.audioId) return;
    if (audioUrl) return;
    let cancelled = false;
    getAudioBlob(fragment.audioId)
      .then((blob) => {
        if (cancelled || !blob) return;
        setAudioUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        /* blob missing or storage error; player simply will not appear */
      });
    return () => {
      cancelled = true;
    };
  }, [isAudio, expanded, fragment.audioId, audioUrl]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

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
    setExpanded((prev) => !prev);
  };

  if (confirming && onDelete) {
    return (
      <div className="bg-mnemo-surface border border-mnemo-border rounded-lg p-4 my-2">
        <p className="font-dm-sans text-sm text-mnemo-ink mb-4">
          {t('fragmentItem.removeConfirm')}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              void onDelete(fragment.id);
              setConfirming(false);
            }}
            className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-ink text-mnemo-ink"
          >
            {t('common.remove')}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-border text-mnemo-ink-secondary"
          >
            {t('common.cancel')}
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
          setExpanded((prev) => !prev);
        }
      }}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary">
          {formatShortDate(fragment.createdAt, i18n.language)}
        </span>
        {isAudio && (
          <span className="font-dm-mono text-[9px] uppercase tracking-[0.18em] text-mnemo-ink-secondary border border-mnemo-border rounded-full px-2 py-0.5 inline-flex items-center gap-1">
            <MicGlyph />
            {t('fragmentItem.audioBadge')}
          </span>
        )}
      </div>
      <p className="font-cormorant italic text-mnemo-ink text-lg leading-relaxed whitespace-pre-wrap">
        {expanded ? fragment.content : preview}
        {truncated && <span className="text-mnemo-ink-tertiary"> …</span>}
      </p>
      {expanded && isAudio && audioUrl && (
        <audio
          src={audioUrl}
          controls
          aria-label={t('fragmentItem.playAria')}
          className="w-full mt-3"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </article>
  );
}

const MicGlyph = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

function firstNLines(content: string, n: number): string {
  return content.split('\n').slice(0, n).join('\n');
}

function hasMoreThanNLines(content: string, n: number): boolean {
  return content.split('\n').length > n;
}
