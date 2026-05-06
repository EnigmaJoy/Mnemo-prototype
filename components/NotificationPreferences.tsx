'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toggle from '@/components/Toggle';
import {
  getCurrentSubscription,
  isPushSupported,
  requestPermissionAndSubscribe,
  unsubscribePush,
} from '@/lib/push';
import { getEarliestFragment } from '@/controllers/fragmentController';

type Prefs = {
  nudge_enabled: boolean;
  nudge_hour: number;
  nudge_days_inactive: number;
  anniversary_enabled: boolean;
  resurfacing_enabled: boolean;
  timezone: string;
  locale: string;
  first_fragment_at: string | null;
};

const DEFAULT_PREFS: Prefs = {
  nudge_enabled: true,
  nudge_hour: 20,
  nudge_days_inactive: 3,
  anniversary_enabled: true,
  resurfacing_enabled: true,
  timezone: 'UTC',
  locale: 'en',
  first_fragment_at: null,
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OPTIONS = [1, 2, 3, 5, 7, 10, 14];

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export default function NotificationPreferences() {
  const { t, i18n } = useTranslation();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    'default',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported = useMemo(() => isPushSupported(), []);

  useEffect(() => {
    let cancelled = false;

    /* eslint-disable react-hooks/set-state-in-effect */
    setHydrated(true);
    if (!supported) {
      setPermission('unsupported');
      setLoading(false);
      return;
    }
    setPermission(Notification.permission);

    void (async () => {
      const sub = await getCurrentSubscription();
      if (!cancelled) setSubscribed(!!sub);

      const earliest = await getEarliestFragment().catch(() => null);
      const firstFragmentAt = earliest ? earliest.createdAt : null;

      const tz = detectTimezone();
      const locale = i18n.language;

      try {
        const res = await fetch('/api/notifications/preferences', {
          method: 'GET',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as Prefs;
          if (!cancelled) setPrefs(data);

          const sync: Partial<Prefs> = {};
          if (data.timezone !== tz) sync.timezone = tz;
          if (data.locale !== locale) sync.locale = locale;
          if (!data.first_fragment_at && firstFragmentAt) {
            sync.first_fragment_at = firstFragmentAt;
          }
          if (Object.keys(sync).length > 0) {
            const r2 = await fetch('/api/notifications/preferences', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sync),
            });
            if (r2.ok) {
              const updated = (await r2.json()) as Prefs;
              if (!cancelled) setPrefs(updated);
            }
          }
        }
      } catch {
        /* network errors are surfaced on save */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    /* eslint-enable react-hooks/set-state-in-effect */

    return () => {
      cancelled = true;
    };
  }, [supported, i18n.language]);

  const savePartial = async (patch: Partial<Prefs>) => {
    setBusy(true);
    setError(null);
    const previous = prefs;
    setPrefs({ ...prefs, ...patch });
    try {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      const data = (await res.json()) as Prefs;
      setPrefs(data);
    } catch (e) {
      setPrefs(previous);
      setError(e instanceof Error ? e.message : t('push.prefs.errorSave'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSubscription = async (next: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (next) {
        const perm = await requestPermissionAndSubscribe();
        setPermission(perm);
        setSubscribed(perm === 'granted');
        if (perm !== 'granted') setError(t('push.prefs.permissionRequired'));
      } else {
        await unsubscribePush();
        setSubscribed(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('push.prefs.errorSubscribe'));
    } finally {
      setBusy(false);
    }
  };

  if (!hydrated) {
    // SSR / pre-hydration: render a stable placeholder so we never produce a
    // tree that depends on browser APIs (Notification.permission) or on i18n
    // resources the server bundle might not yet have hot-reloaded.
    return (
      <section className="bg-mnemo-surface border border-mnemo-border rounded-lg p-5 mb-6">
        <div className="h-4" />
      </section>
    );
  }

  return (
    <section className="bg-mnemo-surface border border-mnemo-border rounded-lg p-5 mb-6">
      <h2 className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-4">
        {t('push.prefs.title')}
      </h2>

      {permission === 'unsupported' && (
        <p className="font-dm-sans text-xs text-mnemo-ink-tertiary">
          {t('push.prefs.unsupported')}
        </p>
      )}

      {permission !== 'unsupported' && (
        <>
          {permission === 'denied' && (
            <p className="font-dm-sans text-xs text-mnemo-ink-tertiary mb-4">
              {t('push.prefs.deniedHint')}
            </p>
          )}

          <Toggle
            label={t('push.prefs.master')}
            description={t('push.prefs.masterHint')}
            checked={subscribed}
            disabled={busy || loading || permission === 'denied'}
            onChange={handleToggleSubscription}
          />

          {!subscribed && permission !== 'denied' && (
            <p className="font-dm-sans text-xs text-mnemo-ink-tertiary mt-1 mb-2">
              {t('push.prefs.armedHint')}
            </p>
          )}

          <div className="border-t border-mnemo-border my-2" />

          <Toggle
            label={t('push.prefs.nudge')}
            description={t('push.prefs.nudgeHint')}
            checked={prefs.nudge_enabled}
            disabled={busy || loading}
            onChange={(v) => savePartial({ nudge_enabled: v })}
          />

          <div className="grid grid-cols-2 gap-4 py-2">
            <label className="block">
              <span className="font-dm-sans text-xs text-mnemo-ink-secondary block mb-1">
                {t('push.prefs.nudgeHour')}
              </span>
              <select
                value={prefs.nudge_hour}
                disabled={busy || loading}
                onChange={(e) => savePartial({ nudge_hour: Number(e.target.value) })}
                className="w-full bg-mnemo-bg border border-mnemo-border rounded px-2 py-2 font-dm-sans text-sm text-mnemo-ink focus:outline-none focus:border-mnemo-ink"
              >
                {HOUR_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="font-dm-sans text-xs text-mnemo-ink-secondary block mb-1">
                {t('push.prefs.nudgeDays')}
              </span>
              <select
                value={prefs.nudge_days_inactive}
                disabled={busy || loading}
                onChange={(e) => savePartial({ nudge_days_inactive: Number(e.target.value) })}
                className="w-full bg-mnemo-bg border border-mnemo-border rounded px-2 py-2 font-dm-sans text-sm text-mnemo-ink focus:outline-none focus:border-mnemo-ink"
              >
                {DAYS_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {t(d === 1 ? 'push.prefs.dayOne' : 'push.prefs.dayMany', { count: d })}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="border-t border-mnemo-border my-2" />

          <Toggle
            label={t('push.prefs.anniversary')}
            description={t('push.prefs.anniversaryHint')}
            checked={prefs.anniversary_enabled}
            disabled={busy || loading}
            onChange={(v) => savePartial({ anniversary_enabled: v })}
          />

          <Toggle
            label={t('push.prefs.resurfacing')}
            description={t('push.prefs.resurfacingHint')}
            checked={prefs.resurfacing_enabled}
            disabled={busy || loading}
            onChange={(v) => savePartial({ resurfacing_enabled: v })}
          />

          {error && (
            <p className="font-dm-sans text-xs text-mnemo-ink-secondary mt-3">{error}</p>
          )}
        </>
      )}
    </section>
  );
}
