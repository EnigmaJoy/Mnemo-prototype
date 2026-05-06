'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleClick = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="border-t border-mnemo-border mt-8 pt-6 flex justify-center">
      <button
        type="button"
        onClick={handleClick}
        className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary hover:text-mnemo-ink transition-colors py-2"
      >
        {t('profile.signOut')}
      </button>
    </div>
  );
}
