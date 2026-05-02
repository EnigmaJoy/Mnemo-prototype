'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  blob: Blob;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ blob }: Props) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- URL.createObjectURL is a side-effecting allocation; revoke runs on cleanup */
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
        return;
      }
      /* WebM/Opus often reports duration === Infinity until the stream is
         walked end-to-end. Seeking past the end forces the browser to compute it. */
      audio.currentTime = Number.MAX_SAFE_INTEGER;
    };
    const handleDurationChange = () => {
      if (!Number.isFinite(audio.duration)) return;
      setDuration(audio.duration);
      if (audio.currentTime > audio.duration) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [url]);

  const ready = url !== null && duration > 0;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setCurrentTime(audio.currentTime);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
      {url && (
        <audio ref={audioRef} src={url} preload="metadata" className="hidden" />
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={!ready}
        aria-label={t('fragmentItem.playAria')}
        className="w-11 h-11 rounded-full bg-mnemo-ink text-mnemo-bg flex items-center justify-center disabled:opacity-50 shrink-0"
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
        className="flex-1 h-11 flex items-center cursor-pointer"
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
