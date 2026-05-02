'use client';

import { useTranslation } from 'react-i18next';
import RecordingSphere from '@/components/RecordingSphere';
import AudioPlayer from '@/components/AudioPlayer';

export const MAX_RECORD_SECONDS = 30;

export type RecState =
  | 'idle'
  | 'recording'
  | 'recorded'
  | 'modelLoading'
  | 'transcribing'
  | 'edit'
  | 'failed';

interface Props {
  recState: RecState;
  recError: string | null;
  recordedBlob: Blob | null;
  seconds: number;
  transcript: string;
  onTranscriptChange: (s: string) => void;
  modelProgress: number | null;
  audioSupported: boolean;
  micStream: MediaStream | null;
  onStart: () => void;
  onStop: () => void;
  onRerecord: () => void;
  onTranscribe: () => void;
}

export default function RecordPanel({
  recState,
  recError,
  recordedBlob,
  seconds,
  transcript,
  onTranscriptChange,
  modelProgress,
  audioSupported,
  micStream,
  onStart,
  onStop,
  onRerecord,
  onTranscribe,
}: Props) {
  const { t } = useTranslation();

  if (!audioSupported) {
    return (
      <p className="font-dm-sans text-sm text-mnemo-ink-secondary">
        {t('capture.record.notSupported')}
      </p>
    );
  }

  const remainingSeconds = Math.max(0, MAX_RECORD_SECONDS - seconds);

  return (
    <div className="flex flex-col items-center">
      {recState === 'idle' && (
        <>
          <p className="font-dm-sans text-sm text-mnemo-ink-secondary mb-8 text-center">
            {t('capture.record.instruction')}
          </p>
          <button
            type="button"
            onClick={onStart}
            aria-label={t('capture.tabs.record')}
            className="w-24 h-24 rounded-full bg-mnemo-ink text-mnemo-bg flex items-center justify-center shadow-md"
          >
            <MicIcon />
          </button>
        </>
      )}

      {recState === 'recording' && (
        <>
          <div className="relative mb-8 flex items-center justify-center w-60 h-60">
            <RecordingSphere stream={micStream} size={240} />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-cormorant font-light text-mnemo-ink leading-none tabular-nums text-[56px]"
              aria-live="polite"
            >
              {remainingSeconds}
            </div>
          </div>
          <button
            type="button"
            onClick={onStop}
            className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md"
          >
            <StopIcon />
          </button>
          <p className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mt-4">
            {t('capture.record.recording')}
          </p>
        </>
      )}

      {recState === 'recorded' && recordedBlob && (
        <>
          <div className="w-full mb-6">
            <AudioPlayer blob={recordedBlob} />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onRerecord}
              className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 border border-mnemo-border text-mnemo-ink-secondary"
            >
              {t('capture.record.rerecord')}
            </button>
            <button
              type="button"
              onClick={onTranscribe}
              className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 border border-mnemo-ink text-mnemo-ink"
            >
              {t('capture.record.transcribe')}
            </button>
          </div>
        </>
      )}

      {(recState === 'modelLoading' || recState === 'transcribing') && (
        <div className="text-center">
          <p className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-3">
            {recState === 'modelLoading'
              ? t('capture.record.modelLoading')
              : t('capture.record.transcribing')}
          </p>
          {recState === 'modelLoading' && modelProgress !== null && (
            <div className="w-48 h-px bg-mnemo-border mx-auto">
              <div
                className="h-px bg-mnemo-ink transition-all"
                style={{ width: `${modelProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {recState === 'edit' && recordedBlob && (
        <div className="w-full">
          <div className="w-full mb-4">
            <AudioPlayer blob={recordedBlob} />
          </div>
          <p className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-2">
            {t('capture.record.transcriptHint')}
          </p>
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            maxLength={2000}
            rows={6}
            className="w-full bg-transparent border-b border-mnemo-border focus:border-mnemo-ink outline-none resize-none font-cormorant italic text-[18px] leading-relaxed text-mnemo-ink py-2 mb-3"
          />
          {transcript.trim().length === 0 && (
            <p className="font-dm-sans text-xs text-red-600 mb-3">
              {t('capture.record.transcriptEmpty')}
            </p>
          )}
          <button
            type="button"
            onClick={onRerecord}
            className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary py-2"
          >
            {t('capture.record.rerecord')}
          </button>
        </div>
      )}

      {recState === 'failed' && (
        <div className="text-center">
          <p className="font-dm-sans text-sm text-red-600 mb-4">
            {recError ?? t('capture.record.transcriptionFailed')}
          </p>
          <button
            type="button"
            onClick={onRerecord}
            className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 border border-mnemo-ink text-mnemo-ink"
          >
            {t('capture.record.rerecord')}
          </button>
        </div>
      )}

      {recError && recState !== 'failed' && (
        <p className="font-dm-sans text-sm text-red-600 mt-4">{recError}</p>
      )}
    </div>
  );
}

const MicIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="3" width="6" height="12" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0" />
    <line x1="12" y1="18" x2="12" y2="22" />
  </svg>
);

const StopIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
