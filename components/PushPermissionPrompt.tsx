'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCurrentSubscription,
  isPushSupported,
  requestPermissionAndSubscribe,
} from '@/lib/push';

const DISMISS_KEY = 'mnemo_push_prompt_dismissed';

export default function PushPermissionPrompt() {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!isPushSupported()) {
      setHidden(true);
      return;
    }
    if (Notification.permission !== 'default') {
      // Already granted or denied; backfill subscription if granted but missing.
      if (Notification.permission === 'granted') {
        void (async () => {
          const sub = await getCurrentSubscription();
          if (!sub) {
            try {
              await requestPermissionAndSubscribe();
            } catch {
              /* ignore - will retry next mount */
            }
          }
        })();
      }
      setHidden(true);
      return;
    }
    try {
      const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
      if (!cancelled) setHidden(dismissed);
    } catch {
      if (!cancelled) setHidden(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden) return null;

  const handleEnable = async () => {
    setBusy(true);
    setError(null);
    try {
      const perm = await requestPermissionAndSubscribe();
      if (perm === 'granted') {
        setHidden(true);
      } else if (perm === 'denied') {
        setError(t('push.prompt.denied'));
        setHidden(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('push.prompt.error'));
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* localStorage unavailable, dismiss for session only */
    }
    setHidden(true);
  };

  return (
    <div className="border border-mnemo-border rounded-lg p-5 mb-6 bg-mnemo-surface">
      <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-gold mb-3">
        {t('push.prompt.label')}
      </div>
      <p className="font-cormorant font-light text-xl text-mnemo-ink leading-relaxed mb-4">
        {t('push.prompt.body')}
      </p>
      {error && (
        <p className="font-dm-sans text-xs text-mnemo-ink-secondary mb-3">{error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="font-dm-mono text-[11px] uppercase tracking-[0.18em] bg-mnemo-ink text-mnemo-bg px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? t('push.prompt.enabling') : t('push.prompt.enable')}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary hover:text-mnemo-ink px-4 py-2"
        >
          {t('push.prompt.notNow')}
        </button>
      </div>
    </div>
  );
}
