'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  blob: Blob;
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ blob }: Props) {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAtRef = useRef(0);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = new AudioContext();
        const arr = await blob.arrayBuffer();
        const buf = await ctx.decodeAudioData(arr);
        if (cancelled) {
          await ctx.close();
          return;
        }
        ctxRef.current = ctx;
        bufferRef.current = buf;
        setDuration(buf.duration);
        setReady(true);
      } catch {
        // decoding failed — leave UI in not-ready state
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      const src = sourceRef.current;
      if (src) {
        try { src.stop(); } catch { /* ignore */ }
      }
      const ctx = ctxRef.current;
      if (ctx) void ctx.close();
      ctxRef.current = null;
      bufferRef.current = null;
      sourceRef.current = null;
    };
  }, [blob]);

  const tick = () => {
    const ctx = ctxRef.current;
    const buf = bufferRef.current;
    if (!ctx || !buf) return;
    const elapsed = ctx.currentTime - startedAtRef.current;
    const t = offsetRef.current + elapsed;
    if (t >= buf.duration) {
      offsetRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      sourceRef.current = null;
      rafRef.current = null;
      return;
    }
    setCurrentTime(t);
    rafRef.current = requestAnimationFrame(tick);
  };

  const startPlayback = () => {
    const ctx = ctxRef.current;
    const buf = bufferRef.current;
    if (!ctx || !buf) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.connect(ctx.destination);
    const offset = offsetRef.current >= buf.duration ? 0 : offsetRef.current;
    source.start(0, offset);
    sourceRef.current = source;
    startedAtRef.current = ctx.currentTime;
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopPlayback = () => {
    const ctx = ctxRef.current;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const src = sourceRef.current;
    if (ctx && src) {
      offsetRef.current += ctx.currentTime - startedAtRef.current;
      try { src.stop(); } catch { /* ignore */ }
    }
    sourceRef.current = null;
    setIsPlaying(false);
  };

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ready) return;
    if (isPlaying) stopPlayback();
    else startPlayback();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!ready || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = ratio * duration;
    const wasPlaying = isPlaying;
    if (wasPlaying) stopPlayback();
    offsetRef.current = target;
    setCurrentTime(target);
    if (wasPlaying) startPlayback();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        aria-label={t('fragmentItem.playAria')}
        className="w-9 h-9 rounded-full bg-mnemo-ink text-mnemo-bg flex items-center justify-center disabled:opacity-50 shrink-0"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div
        role="slider"
        aria-label={t('fragmentItem.playAria')}
        aria-valuemin={0}
        aria-valuemax={Math.max(1, Math.round(duration))}
        aria-valuenow={Math.round(currentTime)}
        tabIndex={0}
        onClick={seek}
        className="flex-1 h-2 flex items-center cursor-pointer"
      >
        <div className="w-full h-px bg-mnemo-border">
          <div
            className="h-px bg-mnemo-ink"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="font-dm-mono text-[10px] tabular-nums text-mnemo-ink-tertiary min-w-[3.5em] text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" />
    <rect x="14" y="5" width="4" height="14" />
  </svg>
);
