'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const HouseIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
  </svg>
);

const PlusCircleIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const UserIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
  </svg>
);

const NAV_ITEMS = [
  { href: '/',        labelKey: 'nav.home',    Icon: HouseIcon },
  { href: '/capture', labelKey: 'nav.capture', Icon: PlusCircleIcon },
  { href: '/archive', labelKey: 'nav.archive', Icon: ListIcon },
  { href: '/profile', labelKey: 'nav.profile', Icon: UserIcon },
] as const;

export default function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('nav.primary')}
      className="fixed bottom-0 inset-x-0 bg-mnemo-bg border-t border-mnemo-border z-30"
    >
      <ul className="max-w-3xl mx-auto flex">
        {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
          const isActive = pathname === href;
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                  isActive
                    ? 'text-mnemo-ink'
                    : 'text-mnemo-ink-tertiary hover:text-mnemo-ink-secondary'
                }`}
              >
                <Icon />
                <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em]">
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
