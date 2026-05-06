export type SentimentCode =
  | 'reflective'
  | 'positive'
  | 'negative'
  | 'energetic'
  | 'uncertain'
  | 'neutral';

export const SENTIMENT_CODES: readonly SentimentCode[] = [
  'reflective',
  'positive',
  'negative',
  'energetic',
  'uncertain',
  'neutral',
] as const;

export const SENTIMENT_COLORS: Record<SentimentCode, string> = {
  reflective: '#7a8fa6',
  positive:   '#8fa67a',
  negative:   '#a67a7a',
  energetic:  '#a6967a',
  uncertain:  '#9a7aa6',
  neutral:    '#b0aa9c',
};

type DetectableCode = Exclude<SentimentCode, 'neutral'>;

const KEYWORDS: Record<DetectableCode, readonly string[]> = {
  reflective: [
    'pensiero', 'pensare', 'penso', 'chiedo', 'chiedersi', 'capire', 'capisco',
    'rifletto', 'riflettere', 'domando', 'senso', 'significato', 'motivo',
    'ragione', 'comprendere', 'considerare', 'osservare', 'accorgermi',
    'wonder', 'wondering', 'think', 'thinking', 'thought', 'question',
    'reflect', 'reflection', 'meaning', 'understand', 'realize', 'notice',
    'observe', 'consider', 'ponder', 'contemplate',
  ],
  positive: [
    'felice', 'felicità', 'bene', 'contenta', 'contento', 'grata', 'grato',
    'amore', 'gioia', 'sorriso', 'sorridere', 'bello', 'bella', 'ottimo',
    'meraviglioso', 'fortuna', 'gratitudine', 'sereno', 'serena',
    'happy', 'happiness', 'grateful', 'gratitude', 'joy', 'joyful', 'love',
    'lovely', 'great', 'wonderful', 'beautiful', 'proud', 'excited',
    'peaceful', 'calm', 'smile', 'blessed',
  ],
  negative: [
    'stanca', 'stanco', 'pesante', 'difficile', 'male', 'paura', 'ansia',
    'ansiosa', 'triste', 'tristezza', 'solo', 'sola', 'sbagliato', 'fallito',
    'fallita', 'dolore', 'sofferenza', 'rabbia', 'arrabbiato',
    'tired', 'exhausted', 'hard', 'sad', 'fear', 'fearful', 'anxiety',
    'anxious', 'difficult', 'wrong', 'lost', 'empty', 'angry', 'frustrated',
    'overwhelmed', 'hurt', 'pain', 'struggle', 'heavy', 'alone',
  ],
  energetic: [
    'forza', 'voglia', 'carica', 'energia', 'energica', 'pronta', 'pronto',
    'decisa', 'deciso', 'motivata', 'motivato', 'determinata', 'slancio',
    'spinta', 'iniziare', 'comincio',
    'motivated', 'ready', 'strong', 'driven', 'focused', 'determined',
    'action', 'start', 'begin', 'energy', 'power', 'push', 'charged',
    'momentum', 'alive', 'vigor',
  ],
  uncertain: [
    'forse', 'dubbio', 'dubitare', 'confusa', 'confuso', 'persa', 'magari',
    'chissà', 'incerta', 'incerto', 'mistero', 'sospeso', 'sospesa',
    'dilemma',
    'maybe', 'unsure', 'confused', 'doubt', 'doubting', 'unclear',
    'hesitant', 'wondering', 'perhaps', 'uncertain', 'ambiguous', 'blurry',
    'foggy', 'unsettled',
  ],
};

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

export function detectSentiment(content: string): SentimentCode {
  const text = content.toLowerCase();
  if (!text.trim()) return 'neutral';

  let bestCode: DetectableCode | null = null;
  let bestCount = 0;
  let tied = false;

  for (const code of Object.keys(KEYWORDS) as DetectableCode[]) {
    let count = 0;
    for (const word of KEYWORDS[code]) {
      count += countOccurrences(text, word);
    }
    if (count > bestCount) {
      bestCount = count;
      bestCode = code;
      tied = false;
    } else if (count === bestCount && count > 0) {
      tied = true;
    }
  }

  if (bestCount === 0 || tied || bestCode === null) return 'neutral';
  return bestCode;
}

export function dominantSentiment(codes: SentimentCode[]): SentimentCode {
  if (codes.length === 0) return 'neutral';
  const counts = new Map<SentimentCode, number>();
  for (const code of codes) {
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let best: SentimentCode = codes[0];
  let bestCount = 0;
  for (const code of codes) {
    const c = counts.get(code) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      best = code;
    }
  }
  return best;
}
