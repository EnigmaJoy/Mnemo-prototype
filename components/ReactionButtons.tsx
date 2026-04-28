'use client';

import { useState } from 'react';
import type { Resurface } from '@/lib/types';
import { updateResurfacing } from '@/lib/storage';

type Reaction = NonNullable<Resurface['reaction']>;

interface Props {
  fragmentId: string;
  initialReaction: Resurface['reaction'];
}

const OPTIONS: ReadonlyArray<{ value: Reaction; label: string }> = [
  { value: 'still_true', label: 'Still true' },
  { value: 'changed',    label: 'Everything changed' },
  { value: 'archived',   label: 'Archive' },
];

export default function ReactionButtons({ fragmentId, initialReaction }: Props) {
  const [selected, setSelected] = useState<Resurface['reaction']>(initialReaction);
  const locked = selected !== null;

  const handleSelect = (reaction: Reaction) => {
    if (locked) return;
    setSelected(reaction);
    updateResurfacing(fragmentId, reaction);
  };

  return (
    <section>
      <p className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-4">
        How does it feel today?
      </p>
      <div className={`flex flex-col gap-3 ${locked ? 'pointer-events-none' : ''}`}>
        {OPTIONS.map(({ value, label }) => {
          const isSelected = selected === value;

          let stateClass = 'border-mnemo-border text-mnemo-ink';
          if (isSelected && value === 'still_true') {
            stateClass = 'border-mnemo-ink text-mnemo-ink';
          } else if (isSelected && value === 'changed') {
            stateClass = 'border-mnemo-gold text-mnemo-ink';
          } else if (isSelected && value === 'archived') {
            stateClass = 'border-mnemo-border text-mnemo-ink opacity-50';
          }

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(value)}
              className={`w-full px-5 py-3 border bg-transparent font-dm-sans text-sm transition-colors ${stateClass}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {selected === 'archived' && (
        <p className="font-dm-sans text-sm text-mnemo-ink-secondary mt-4">
          {"Archived. It won't surface again."}
        </p>
      )}
    </section>
  );
}
