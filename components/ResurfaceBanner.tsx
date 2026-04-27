'use client';

import { useRouter } from 'next/navigation';
import type { Fragment, Resurface } from '@/lib/types';
import { getTriggerLabel } from '@/lib/resurfacing';

interface ResurfaceBannerProps {
  fragment:    Fragment;
  triggerType: Resurface['triggerType'];
  onDismiss:   () => void;
}

function getPreview(content: string): string {
  const lines = content.split('\n');
  const first2 = lines.slice(0, 2).join('\n');
  if (first2.length > 120) return first2.slice(0, 120) + '…';
  return first2;
}

export default function ResurfaceBanner({ fragment, triggerType, onDismiss }: ResurfaceBannerProps) {
  const router = useRouter();
  // Label is derived from triggerType only — never from the raw daysSince value
  const label  = getTriggerLabel(triggerType);

  return (
    <div
      className="bg-mnemo-dark rounded-xl p-4 mb-4 animate-slide-fade-in"
      role="region"
      aria-label="Resurfacing moment"
    >
      {/* Trigger label — canonical, from triggerType */}
      <p className="font-dm-mono text-mnemo-gold text-[10px] uppercase tracking-widest mb-2">
        {label}
      </p>

      {/* Fragment preview */}
      <p
        className="font-cormorant italic leading-relaxed mb-4 line-clamp-2"
        style={{ color: 'rgba(245,241,234,0.88)', fontSize: '17px' }}
      >
        {getPreview(fragment.content)}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/resurface/${fragment.id}`)}
          className="font-dm-mono text-mnemo-gold text-[11px] uppercase tracking-wider flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          Read
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <button
          onClick={onDismiss}
          className="font-dm-mono text-[10px] uppercase tracking-wider transition-opacity"
          style={{ color: 'rgba(245,241,234,0.28)' }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
