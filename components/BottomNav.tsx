'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href:  '/',
    label: 'Home',
    icon:  (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          stroke="currentColor"
          strokeWidth={active ? '1.5' : '1.2'}
          strokeLinejoin="round"
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.12 : 0}
        />
      </svg>
    ),
  },
  {
    href:  '/capture',
    label: 'Capture',
    icon:  (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle
          cx="10" cy="10" r="7"
          stroke="currentColor"
          strokeWidth={active ? '1.5' : '1.2'}
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.12 : 0}
        />
        <path d="M10 7v6M7 10h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href:  '/archive',
    label: 'Archive',
    icon:  (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect
          x="2" y="4" width="16" height="13" rx="1.5"
          stroke="currentColor"
          strokeWidth={active ? '1.5' : '1.2'}
          fill={active ? 'currentColor' : 'none'}
          fillOpacity={active ? 0.12 : 0}
        />
        <path d="M2 7.5h16" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 11h8M6 13.5h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-mnemo-bg border-t border-mnemo-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center justify-around h-14 max-w-md mx-auto px-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors ${
                  active ? 'text-mnemo-ink' : 'text-mnemo-ink-tertiary'
                }`}
              >
                {icon(active)}
                <span className="font-dm-mono text-[9px] uppercase tracking-wider">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
