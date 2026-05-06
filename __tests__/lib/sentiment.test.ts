import { detectSentiment, dominantSentiment } from '@/lib/sentiment';

describe('detectSentiment', () => {
  it('returns neutral for empty content', () => {
    expect(detectSentiment('')).toBe('neutral');
    expect(detectSentiment('   ')).toBe('neutral');
  });

  it('returns neutral when no keywords match', () => {
    expect(detectSentiment('xyz qrs lmnop')).toBe('neutral');
  });

  it('detects reflective sentiment in English', () => {
    expect(detectSentiment('I wonder what this means')).toBe('reflective');
  });

  it('detects reflective sentiment in Italian', () => {
    expect(detectSentiment('Mi rifletto sul significato di questo pensiero')).toBe(
      'reflective',
    );
  });

  it('detects positive sentiment in English', () => {
    expect(detectSentiment('I am so grateful and happy today')).toBe('positive');
  });

  it('detects positive sentiment in Italian', () => {
    expect(detectSentiment('Sono felice e contenta, che gioia')).toBe('positive');
  });

  it('detects negative sentiment in English', () => {
    expect(detectSentiment('I feel so tired and sad today')).toBe('negative');
  });

  it('detects negative sentiment in Italian', () => {
    expect(detectSentiment('Sono stanca e triste, è difficile')).toBe('negative');
  });

  it('detects energetic sentiment in English', () => {
    expect(detectSentiment('I feel motivated, ready to start with energy')).toBe(
      'energetic',
    );
  });

  it('detects energetic sentiment in Italian', () => {
    expect(detectSentiment('Ho voglia ed energia, sono pronta')).toBe('energetic');
  });

  it('detects uncertain sentiment in English', () => {
    expect(detectSentiment('Maybe I am unsure, full of doubt')).toBe('uncertain');
  });

  it('detects uncertain sentiment in Italian', () => {
    expect(detectSentiment('Forse, chissà, ho un dubbio')).toBe('uncertain');
  });

  it('returns neutral when categories tie at the top', () => {
    expect(detectSentiment('happy tired')).toBe('neutral');
  });

  it('picks the dominant category by count', () => {
    expect(detectSentiment('happy happy happy tired')).toBe('positive');
  });

  it('is case-insensitive', () => {
    expect(detectSentiment('HAPPY GRATEFUL')).toBe('positive');
  });
});

describe('dominantSentiment', () => {
  it('returns neutral for an empty list', () => {
    expect(dominantSentiment([])).toBe('neutral');
  });

  it('returns the most frequent code', () => {
    expect(
      dominantSentiment(['positive', 'negative', 'positive']),
    ).toBe('positive');
  });

  it('returns the first encountered on a tie', () => {
    expect(dominantSentiment(['negative', 'positive'])).toBe('negative');
  });
});
