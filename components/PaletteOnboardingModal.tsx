'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_PALETTE,
  PALETTE_SWATCHES,
  getPalette,
  markPaletteOnboarded,
  setPalette,
  type Palette,
} from '@/lib/palette';
import { SENTIMENT_CODES, type SentimentCode } from '@/lib/sentiment';

type Step = 1 | 2 | 3;

interface PaletteOnboardingModalProps {
  open: boolean;
  mode: 'onboarding' | 'edit';
  onClose: () => void;
  onSaved?: (palette: Palette) => void;
}

const PREVIEW_PATTERN: ReadonlyArray<ReadonlyArray<SentimentCode | null>> = [
  ['neutral',    'positive',   null,        'reflective', 'positive'],
  ['positive',   'reflective', 'positive',  'energetic',  null],
  [null,         'reflective', 'reflective','positive',   'reflective'],
  ['negative',   null,         'positive',  'reflective', 'positive'],
  ['reflective', 'uncertain',  null,        'positive',   'energetic'],
  [null,         'positive',   'reflective','negative',   'reflective'],
  ['neutral',    null,         'positive',  'reflective', 'positive'],
];

export default function PaletteOnboardingModal({
  open,
  mode,
  onClose,
  onSaved,
}: PaletteOnboardingModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(mode === 'edit' ? 2 : 1);
  const [palette, setLocalPalette] = useState<Palette>(DEFAULT_PALETTE);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setStep(mode === 'edit' ? 2 : 1);
    setLocalPalette(getPalette());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, mode]);

  const canSkip = mode === 'onboarding' && step === 1;

  const handleSkip = () => {
    markPaletteOnboarded();
    onClose();
  };

  const handleDone = () => {
    setPalette(palette);
    markPaletteOnboarded();
    onSaved?.(palette);
    onClose();
  };

  const handleSwatchClick = (code: SentimentCode, color: string) => {
    setLocalPalette((prev) => ({ ...prev, [code]: color }));
  };

  const previewCells = useMemo(() => {
    const flat: Array<SentimentCode | null> = [];
    for (let col = 0; col < PREVIEW_PATTERN[0].length; col += 1) {
      for (let row = 0; row < PREVIEW_PATTERN.length; row += 1) {
        flat.push(PREVIEW_PATTERN[row][col]);
      }
    }
    return flat;
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="palette-onboarding-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-mnemo-bg border border-mnemo-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary mb-3">
          {t('paletteOnboarding.stepLabel', { step, total: 3 })}
        </div>

        {step === 1 && (
          <>
            <h2
              id="palette-onboarding-title"
              className="font-cormorant text-2xl text-mnemo-ink mb-3"
            >
              {t('paletteOnboarding.intro.title')}
            </h2>
            <p className="font-dm-sans text-sm text-mnemo-ink-secondary mb-6 leading-relaxed">
              {t('paletteOnboarding.intro.body')}
            </p>
            <div className="flex gap-3 justify-end">
              {canSkip && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 text-mnemo-ink-tertiary"
                >
                  {t('paletteOnboarding.skip')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-ink text-mnemo-ink"
              >
                {t('paletteOnboarding.continue')}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2
              id="palette-onboarding-title"
              className="font-cormorant text-2xl text-mnemo-ink mb-3"
            >
              {t('paletteOnboarding.choose.title')}
            </h2>
            <p className="font-dm-sans text-xs text-mnemo-ink-secondary mb-5 leading-relaxed">
              {t('paletteOnboarding.choose.body')}
            </p>

            <div className="space-y-3 mb-6">
              {SENTIMENT_CODES.map((code) => (
                <div key={code} className="flex items-center gap-3">
                  <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary w-20 flex-shrink-0">
                    {t(`sentimentGrid.sentiments.${code}`)}
                  </span>
                  <div className="flex gap-1.5 flex-1">
                    {PALETTE_SWATCHES[code].map((color) => {
                      const selected = palette[code] === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleSwatchClick(code, color)}
                          aria-label={t('paletteOnboarding.swatchAria', {
                            color,
                          })}
                          aria-pressed={selected}
                          className="rounded-full flex-1 transition-transform"
                          style={{
                            backgroundColor: color,
                            height: 26,
                            outline: selected ? '2px solid var(--color-mnemo-ink)' : 'none',
                            outlineOffset: 2,
                            transform: selected ? 'scale(1.05)' : 'scale(1)',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-between">
              {mode === 'onboarding' ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 text-mnemo-ink-tertiary"
                >
                  {t('common.back')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 text-mnemo-ink-tertiary"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep(3)}
                className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-ink text-mnemo-ink"
              >
                {t('paletteOnboarding.continue')}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2
              id="palette-onboarding-title"
              className="font-cormorant text-2xl text-mnemo-ink mb-3"
            >
              {t('paletteOnboarding.preview.title')}
            </h2>
            <p className="font-dm-sans text-xs text-mnemo-ink-secondary mb-5 leading-relaxed">
              {t('paletteOnboarding.preview.body')}
            </p>

            <div
              className="grid mb-6 mx-auto"
              style={{
                gridTemplateRows: `repeat(7, 14px)`,
                gridTemplateColumns: `repeat(5, 14px)`,
                gridAutoFlow: 'column',
                gap: '3px',
                width: 'fit-content',
              }}
              aria-hidden="true"
            >
              {previewCells.map((code, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    backgroundColor: code ? palette[code] : 'rgba(0,0,0,0.06)',
                    opacity: code ? 0.8 : 1,
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
              {SENTIMENT_CODES.map((code) => (
                <div key={code} className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: palette[code],
                      display: 'inline-block',
                    }}
                  />
                  <span className="font-dm-mono text-[9px] text-mnemo-ink-tertiary">
                    {t(`sentimentGrid.sentiments.${code}`)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 text-mnemo-ink-tertiary"
              >
                {t('common.back')}
              </button>
              <button
                type="button"
                onClick={handleDone}
                className="font-dm-mono text-[10px] uppercase tracking-[0.18em] px-4 py-3 min-h-11 border border-mnemo-ink text-mnemo-ink"
              >
                {t('paletteOnboarding.done')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
