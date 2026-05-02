'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AudioRecorder, isAudioRecordingSupported } from '@/lib/audio/recorder';
import RecordingSphere from '@/components/RecordingSphere';
import AudioPlayer from '@/components/AudioPlayer';
import {
  saveAudioFragment,
  saveTextFragment,
} from '@/controllers/fragmentController';
import { consumePromptOverride } from '@/controllers/captureController';
import { getTimeOfDayKey } from '@/models/timeOfDay';
import { formatShortDate } from '@/lib/datetime';

const MAX_CHARS = 2000;
const COUNTER_RED_OVER = 1900;
const SAVED_REDIRECT_MS = 1500;
const MAX_RECORD_SECONDS = 30;

type Mode = 'text' | 'audio';
type RecState =
  | 'idle'
  | 'recording'
  | 'recorded'
  | 'modelLoading'
  | 'transcribing'
  | 'edit'
  | 'failed';

export default function CapturePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const [mode, setMode] = useState<Mode>('text');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [contextNow, setContextNow] = useState<Date | null>(null);
  const [placeholderOverride, setPlaceholderOverride] = useState<string | null>(null);
  const [audioSupported, setAudioSupported] = useState(true);

  const [recState, setRecState] = useState<RecState>('idle');
  const [recError, setRecError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPlaceholderOverride(consumePromptOverride());
    setContextNow(new Date());
    setAudioSupported(isAudioRecordingSupported());
    textareaRef.current?.focus();
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const resetAudio = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    setRecState('idle');
    setRecordedBlob(null);
    setSeconds(0);
    setTranscript('');
    setModelProgress(null);
    setRecError(null);
    setMicStream(null);
  };

  const handleTabChange = (next: Mode) => {
    if (next === mode) return;
    if (mode === 'audio') resetAudio();
    setMode(next);
  };

  const handleStartRecord = async () => {
    setRecError(null);
    if (!audioSupported) {
      setRecError(t('capture.record.notSupported'));
      return;
    }
    try {
      recorderRef.current = new AudioRecorder();
      await recorderRef.current.start();
      setMicStream(recorderRef.current.getStream());
      setSeconds(0);
      setRecState('recording');
    } catch {
      setRecError(t('capture.record.permissionDenied'));
      setRecState('idle');
    }
  };

  const handleStopRecord = async () => {
    const rec = recorderRef.current;
    if (!rec) return;
    try {
      const blob = await rec.stop();
      setRecordedBlob(blob);
      setMicStream(null);
      setRecState('recorded');
    } catch {
      setMicStream(null);
      setRecState('failed');
      setRecError(t('capture.record.transcriptionFailed'));
    }
  };

  useEffect(() => {
    if (recState !== 'recording') return;
    if (seconds >= MAX_RECORD_SECONDS) {
      void handleStopRecord();
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s + 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, seconds]);

  const handleTranscribe = async () => {
    if (!recordedBlob) return;
    setRecState('modelLoading');
    setModelProgress(0);
    try {
      const { transcribeBlob } = await import('@/lib/audio/transcribe');
      setRecState('transcribing');
      const text = await transcribeBlob(
        recordedBlob,
        i18n.language,
        (p) => {
          setModelProgress(p);
          if (p < 100) setRecState('modelLoading');
        },
      );
      setTranscript(text);
      setRecState('edit');
    } catch (err) {
      console.error('transcription failed', err);
      const detail = err instanceof Error ? err.message : String(err);
      setRecState('failed');
      setRecError(`${t('capture.record.transcriptionFailed')} - ${detail}`);
    }
  };

  const handleSaveText = async () => {
    if (content.trim().length === 0 || saved) return;
    await saveTextFragment(content);
    setSaved(true);
    setTimeout(() => router.push('/'), SAVED_REDIRECT_MS);
  };

  const handleSaveAudio = async () => {
    if (!recordedBlob || transcript.trim().length === 0 || saved) return;
    try {
      await saveAudioFragment(transcript, recordedBlob);
    } catch {
      setRecError(t('capture.record.transcriptionFailed'));
      return;
    }
    setSaved(true);
    setTimeout(() => router.push('/'), SAVED_REDIRECT_MS);
  };

  const handleSave = () => {
    if (mode === 'text') void handleSaveText();
    else void handleSaveAudio();
  };

  const counterRed = content.length > COUNTER_RED_OVER;
  const remaining = MAX_CHARS - content.length;

  const canSave = saved
    ? false
    : mode === 'text'
      ? content.trim().length > 0
      : recState === 'edit' && transcript.trim().length > 0;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/"
          aria-label={t('common.back')}
          className="flex items-center gap-2 text-mnemo-ink py-2"
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
            {t('capture.title')}
          </span>
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={`font-dm-mono text-[10px] uppercase tracking-[0.18em] transition-colors py-2 px-1 ${
            canSave
              ? 'text-mnemo-ink'
              : 'text-mnemo-ink-tertiary cursor-not-allowed'
          }`}
        >
          {t('common.save')}
        </button>
      </header>

      {!saved && (
        <div role="tablist" aria-label={t('capture.tabsAria')} className="flex border-b border-mnemo-border mb-6">
          <button
            role="tab"
            type="button"
            aria-selected={mode === 'text'}
            onClick={() => handleTabChange('text')}
            className={`flex-1 py-3 font-dm-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
              mode === 'text'
                ? 'text-mnemo-ink border-b-2 border-mnemo-ink -mb-px'
                : 'text-mnemo-ink-tertiary'
            }`}
          >
            {t('capture.tabs.write')}
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={mode === 'audio'}
            onClick={() => handleTabChange('audio')}
            disabled={!audioSupported}
            className={`flex-1 py-3 font-dm-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
              mode === 'audio'
                ? 'text-mnemo-ink border-b-2 border-mnemo-ink -mb-px'
                : audioSupported
                  ? 'text-mnemo-ink-tertiary'
                  : 'text-mnemo-ink-tertiary opacity-50 cursor-not-allowed'
            }`}
          >
            {t('capture.tabs.record')}
          </button>
        </div>
      )}

      {saved ? (
        <p className="font-cormorant italic text-2xl text-mnemo-ink leading-relaxed mt-12">
          {t('capture.saved')}
        </p>
      ) : mode === 'text' ? (
        <>
          <div className="border-b border-mnemo-border focus-within:border-mnemo-ink transition-colors mb-2">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder={placeholderOverride ?? t('capture.placeholder')}
              rows={6}
              className="w-full bg-transparent border-0 outline-none resize-none font-cormorant italic text-[18px] leading-relaxed text-mnemo-ink placeholder:text-mnemo-ink-tertiary py-2 min-h-40"
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
                {formatShortDate(contextNow.toISOString(), i18n.language)}
              </span>
              <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary border border-mnemo-border rounded-full px-3 py-1">
                {t(getTimeOfDayKey(contextNow.getHours()))}
              </span>
            </div>
          )}
        </>
      ) : (
        <RecordPanel
          recState={recState}
          recError={recError}
          recordedBlob={recordedBlob}
          seconds={seconds}
          transcript={transcript}
          onTranscriptChange={setTranscript}
          modelProgress={modelProgress}
          audioSupported={audioSupported}
          micStream={micStream}
          onStart={handleStartRecord}
          onStop={handleStopRecord}
          onRerecord={resetAudio}
          onTranscribe={handleTranscribe}
          t={t}
        />
      )}
    </main>
  );
}

interface RecordPanelProps {
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
  t: (key: string, opts?: Record<string, unknown>) => string;
}

function RecordPanel({
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
  t,
}: RecordPanelProps) {
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
            maxLength={MAX_CHARS}
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
