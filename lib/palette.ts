import { SENTIMENT_COLORS, type SentimentCode } from '@/lib/sentiment';

export type Palette = Record<SentimentCode, string>;

const PALETTE_KEY = 'mnemo_palette_v1';
const ONBOARDED_KEY = 'mnemo_palette_onboarded_v1';

export const DEFAULT_PALETTE: Palette = { ...SENTIMENT_COLORS };

export const PALETTE_SWATCHES: Record<SentimentCode, readonly string[]> = {
  reflective: ['#7a8fa6', '#6f8a90', '#8a98b8', '#5e7186', '#98a4b3'],
  positive:   ['#8fa67a', '#a3b08e', '#6f8b62', '#98a173', '#7c9a6a'],
  negative:   ['#a67a7a', '#946b6b', '#b08c93', '#ab7a73', '#886a6a'],
  energetic:  ['#a6967a', '#b88466', '#b07054', '#c0866a', '#966c5a'],
  uncertain:  ['#9a7aa6', '#876c92', '#ab94b8', '#8c7da6', '#a88ab4'],
  neutral:    ['#b0aa9c', '#999487', '#c2bdaf', '#a89e8c', '#b8b1a2'],
};

function isStorageAvailable(): boolean {
  try {
    const probe = '__mnemo_palette_test__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function getPalette(): Palette {
  if (typeof window === 'undefined' || !isStorageAvailable()) {
    return { ...DEFAULT_PALETTE };
  }
  try {
    const raw = localStorage.getItem(PALETTE_KEY);
    if (!raw) return { ...DEFAULT_PALETTE };
    const parsed = JSON.parse(raw) as Partial<Palette>;
    return {
      reflective: parsed.reflective ?? DEFAULT_PALETTE.reflective,
      positive:   parsed.positive   ?? DEFAULT_PALETTE.positive,
      negative:   parsed.negative   ?? DEFAULT_PALETTE.negative,
      energetic:  parsed.energetic  ?? DEFAULT_PALETTE.energetic,
      uncertain:  parsed.uncertain  ?? DEFAULT_PALETTE.uncertain,
      neutral:    parsed.neutral    ?? DEFAULT_PALETTE.neutral,
    };
  } catch {
    return { ...DEFAULT_PALETTE };
  }
}

export function setPalette(palette: Palette): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) return;
  try {
    localStorage.setItem(PALETTE_KEY, JSON.stringify(palette));
  } catch {
    /* quota exceeded — prototype tolerates a silent drop */
  }
}

export function isPaletteOnboarded(): boolean {
  if (typeof window === 'undefined' || !isStorageAvailable()) return false;
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markPaletteOnboarded(): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) return;
  try {
    localStorage.setItem(ONBOARDED_KEY, 'true');
  } catch {
    /* tolerate silently */
  }
}
