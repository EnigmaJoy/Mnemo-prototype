import {
  DEFAULT_PALETTE,
  PALETTE_SWATCHES,
  getPalette,
  setPalette,
  isPaletteOnboarded,
  markPaletteOnboarded,
  type Palette,
} from '@/lib/palette';
import { SENTIMENT_CODES } from '@/lib/sentiment';

beforeEach(() => {
  localStorage.clear();
});

describe('PALETTE_SWATCHES', () => {
  it('has 5 swatches per emotion', () => {
    for (const code of SENTIMENT_CODES) {
      expect(PALETTE_SWATCHES[code]).toHaveLength(5);
    }
  });

  it('starts each emotion with the default color', () => {
    for (const code of SENTIMENT_CODES) {
      expect(PALETTE_SWATCHES[code][0]).toBe(DEFAULT_PALETTE[code]);
    }
  });

  it('uses unique hex colors per emotion', () => {
    for (const code of SENTIMENT_CODES) {
      const set = new Set(PALETTE_SWATCHES[code]);
      expect(set.size).toBe(PALETTE_SWATCHES[code].length);
    }
  });
});

describe('getPalette / setPalette', () => {
  it('returns defaults when nothing is stored', () => {
    expect(getPalette()).toEqual(DEFAULT_PALETTE);
  });

  it('persists and restores a chosen palette', () => {
    const chosen: Palette = {
      reflective: '#5e7186',
      positive:   '#a3b08e',
      negative:   '#946b6b',
      energetic:  '#b88466',
      uncertain:  '#876c92',
      neutral:    '#999487',
    };
    setPalette(chosen);
    expect(getPalette()).toEqual(chosen);
  });

  it('falls back to defaults for missing keys in stored palette', () => {
    localStorage.setItem(
      'mnemo_palette_v1',
      JSON.stringify({ positive: '#a3b08e' }),
    );
    const result = getPalette();
    expect(result.positive).toBe('#a3b08e');
    expect(result.reflective).toBe(DEFAULT_PALETTE.reflective);
    expect(result.neutral).toBe(DEFAULT_PALETTE.neutral);
  });

  it('returns defaults when stored value is corrupt JSON', () => {
    localStorage.setItem('mnemo_palette_v1', '{not json');
    expect(getPalette()).toEqual(DEFAULT_PALETTE);
  });
});

describe('isPaletteOnboarded / markPaletteOnboarded', () => {
  it('is false before onboarding', () => {
    expect(isPaletteOnboarded()).toBe(false);
  });

  it('is true after marking onboarded', () => {
    markPaletteOnboarded();
    expect(isPaletteOnboarded()).toBe(true);
  });
});
