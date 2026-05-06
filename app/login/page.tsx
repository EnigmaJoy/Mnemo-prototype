'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Logo from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NEGATIVE_COLOR = '#a67a7a';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      setErrorKey('login.errors.invalidEmail');
      return;
    }

    setStatus('submitting');
    setErrorKey(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setStatus('error');
        const msg = error.message?.toLowerCase() ?? '';
        if (msg.includes('rate') || msg.includes('too many')) {
          setErrorKey('login.errors.rateLimit');
        } else {
          setErrorKey('login.errors.generic');
        }
        return;
      }

      setStatus('sent');
    } catch {
      setStatus('error');
      setErrorKey('login.errors.generic');
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 bg-mnemo-bg">
      <div className="w-full max-w-[360px]">
        <div className="flex flex-col items-center mb-12">
          <Logo />
          <span className="font-cormorant font-light uppercase tracking-[0.18em] text-sm text-mnemo-ink mt-3">
            mnemo
          </span>
          <span className="font-dm-mono text-[10px] uppercase tracking-[0.14em] text-mnemo-ink-tertiary mt-2">
            {t('login.tagline')}
          </span>
        </div>

        {status === 'sent' ? (
          <div>
            <h1 className="font-cormorant italic font-light text-[22px] text-mnemo-ink mb-3">
              {t('login.successTitle')}
            </h1>
            <p className="font-dm-sans text-sm text-mnemo-ink-secondary leading-relaxed">
              {t('login.successBody', { email })}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h1 className="font-cormorant italic font-light text-[28px] text-mnemo-ink leading-tight mb-8">
              {t('login.headline')}
            </h1>

            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              className="w-full bg-transparent border-0 border-b border-mnemo-border focus:border-mnemo-ink focus:outline-none font-dm-sans text-sm text-mnemo-ink placeholder:text-mnemo-ink-tertiary py-[10px] transition-colors"
              disabled={status === 'submitting'}
            />

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-mnemo-ink text-mnemo-bg font-dm-mono text-[12px] uppercase tracking-[0.1em] py-[14px] mt-5 rounded-[2px] disabled:opacity-60"
            >
              {status === 'submitting'
                ? t('login.submitting')
                : t('login.submit')}
            </button>

            {status === 'error' && errorKey && (
              <p
                role="alert"
                className="font-dm-sans text-xs mt-3"
                style={{ color: NEGATIVE_COLOR }}
              >
                {t(errorKey)}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
