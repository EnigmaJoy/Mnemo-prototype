'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Resurface } from '@/models/resurfacing';

type Reaction = NonNullable<Resurface['reaction']>;

interface Props {
  initialReaction: Resurface['reaction'];
  onReact: (reaction: Reaction) => void;
}

const OPTIONS: ReadonlyArray<{ value: Reaction; labelKey: string }> = [
  { value: 'still_true', labelKey: 'reactions.stillTrue' },
  { value: 'changed',    labelKey: 'reactions.changed' },
  { value: 'archived',   labelKey: 'reactions.archive' },
];

export default function ReactionButtons({ initialReaction, onReact }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Resurface['reaction']>(initialReaction);
  const locked = selected !== null;

  const handleSelect = (reaction: Reaction) => {
    if (locked) return;
    setSelected(reaction);
    onReact(reaction);
  };

  return (
    <section>
      <p className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-4">
        {t('reactions.prompt')}
      </p>
      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ value, labelKey }) => {
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
              disabled={locked}
              onClick={() => handleSelect(value)}
              className={`w-full px-5 py-3 min-h-11 border bg-transparent font-dm-sans text-sm transition-colors disabled:cursor-default ${stateClass}`}
            >
              {t(labelKey)}
            </button>
          );
        })}
      </div>
      {selected === 'archived' && (
        <p className="font-dm-sans text-sm text-mnemo-ink-secondary mt-4">
          {t('reactions.archivedNote')}
        </p>
      )}
    </section>
  );
}
