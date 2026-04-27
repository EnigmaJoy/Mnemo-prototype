'use client';

import { useState } from 'react';
import type { Resurface } from '@/lib/types';

interface ReactionButtonsProps {
  initial?:   Resurface['reaction'];
  onReact:    (reaction: Exclude<Resurface['reaction'], null>) => void;
}

type ReactionChoice = Exclude<Resurface['reaction'], null>;

const REACTIONS: { value: ReactionChoice; label: string; confirmation: string }[] = [
  {
    value:        'still_true',
    label:        'Still true',
    confirmation: 'It still holds.',
  },
  {
    value:        'changed',
    label:        'Everything changed',
    confirmation: 'Noted. Things change.',
  },
  {
    value:        'archived',
    label:        'Archive',
    confirmation: "Archived. It won't surface again.",
  },
];

export default function ReactionButtons({ initial = null, onReact }: ReactionButtonsProps) {
  const [selected, setSelected] = useState<ReactionChoice | null>(
    initial as ReactionChoice | null
  );

  function handleSelect(value: ReactionChoice) {
    if (selected) return; // already reacted
    setSelected(value);
    onReact(value);
  }

  return (
    <div>
      <p className="font-dm-mono text-mnemo-ink-tertiary text-[9px] uppercase tracking-widest mb-3">
        How does it feel today?
      </p>
      <div className="flex flex-col gap-2" style={{ pointerEvents: selected ? 'none' : 'auto' }}>
        {REACTIONS.map(({ value, label, confirmation }) => {
          const isSelected = selected === value;
          const isArchived = value === 'archived' && isSelected;

          let borderColor = '#ddd6c5'; // default border
          if (isSelected && value === 'still_true') borderColor = '#18160f';
          if (isSelected && value === 'changed')    borderColor = '#c4a35a';
          // archived keeps default border, just reduces opacity

          return (
            <div key={value}>
              <button
                onClick={() => handleSelect(value)}
                className="w-full text-left px-4 py-3 rounded-lg border font-dm-sans text-sm transition-all"
                style={{
                  borderColor,
                  opacity: isArchived ? 0.45 : 1,
                  color:   isSelected ? '#18160f' : '#7a7568',
                }}
              >
                {label}
              </button>
              {isSelected && (
                <p className="font-dm-mono text-mnemo-ink-tertiary mt-1.5 ml-1" style={{ fontSize: '10px' }}>
                  {confirmation}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
