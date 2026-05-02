'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AudioRecorder, isAudioRecordingSupported } from '@/lib/audio/recorder';
import RecordPanel, { MAX_RECORD_SECONDS, type RecState } from '@/components/RecordPanel';
import BottomNav from '@/components/BottomNav';
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

type Mode = 'text' | 'audio';

export default function CapturePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mode, setMode] = useState<Mode>('text');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);
  const [contextNow, setContextNow] = useState<Date | null>(null);
  const [placeholderOverride, setPlaceholderOverride] = useState<string | null>(null);
  const [audioSupported, setAudioSupported] = useState(true);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

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

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const cancelRedirect = () => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  };

  const resetAudioOnly = () => {
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

  const resetAll = () => {
    cancelRedirect();
    setContent('');
    setSaved(false);
    setMode('text');
    setPlaceholderOverride(null);
    resetAudioOnly();
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const hasUnsavedDraft = (): boolean => {
    if (saved) return false;
    if (mode === 'text') return content.trim().length > 0;
    return recordedBlob !== null || transcript.trim().length > 0;
  };

  const handleNewFragment = () => {
    if (!hasUnsavedDraft()) {
      resetAll();
      return;
    }
    setShowUnsavedModal(true);
  };

  const handleSaveAndNew = async () => {
    setShowUnsavedModal(false);
    if (mode === 'text' && content.trim().length > 0) {
      await saveTextFragment(content);
    } else if (mode === 'audio' && recordedBlob && transcript.trim().length > 0) {
      await saveAudioFragment(transcript, recordedBlob);
    }
    resetAll();
  };

  const handleDiscardAndNew = () => {
    setShowUnsavedModal(false);
    resetAll();
  };

  const handleTabChange = (next: Mode) => {
    if (next === mode) return;
    if (mode === 'audio') resetAudioOnly();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleStopRecord is stable via refs; including it would restart the timer
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
    redirectTimeoutRef.current = setTimeout(() => router.push('/'), SAVED_REDIRECT_MS);
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
    redirectTimeoutRef.current = setTimeout(() => router.push('/'), SAVED_REDIRECT_MS);
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

  const isAudioPendingTranscript =
    mode === 'audio' && recordedBlob !== null && transcript.trim().length === 0;

  return (
    <>
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
        <header className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleNewFragment}
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em]">
              {t('capture.title')}
            </span>
          </button>
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
            onRerecord={resetAudioOnly}
            onTranscribe={handleTranscribe}
          />
        )}
      </main>

      <BottomNav />

      {showUnsavedModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unsaved-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40"
          onClick={() => setShowUnsavedModal(false)}
        >
          <div
            className="bg-mnemo-bg border border-mnemo-border rounded-lg p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="unsaved-title"
              className="font-cormorant text-xl text-mnemo-ink mb-3"
            >
              {isAudioPendingTranscript
                ? t('capture.unsavedAudio.title')
                : t('capture.unsaved.title')}
            </h2>
            <p className="font-dm-sans text-sm text-mnemo-ink-secondary mb-6">
              {isAudioPendingTranscript
                ? t('capture.unsavedAudio.message')
                : t('capture.unsaved.message')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleDiscardAndNew}
                className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-border text-mnemo-ink-secondary"
              >
                {isAudioPendingTranscript
                  ? t('capture.unsaved.discard')
                  : t('capture.unsaved.writeNew')}
              </button>
              {isAudioPendingTranscript ? (
                <button
                  type="button"
                  onClick={() => setShowUnsavedModal(false)}
                  className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-ink text-mnemo-ink"
                >
                  {t('common.cancel')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveAndNew}
                  disabled={!canSave}
                  className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-ink text-mnemo-ink disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
