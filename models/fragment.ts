export interface Fragment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type?: 'text' | 'audio';
  audioId?: string;
}

export function sortFragmentsNewestFirst(fragments: Fragment[]): Fragment[] {
  return [...fragments].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function findEarliestFragment(fragments: Fragment[]): Fragment | null {
  if (fragments.length === 0) return null;
  return fragments.reduce((earliest, fragment) =>
    Date.parse(fragment.createdAt) < Date.parse(earliest.createdAt)
      ? fragment
      : earliest,
  );
}

export function countFragmentsCreatedOn(
  fragments: Fragment[],
  reference: Date,
): number {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const day = reference.getDate();
  return fragments.filter((fragment) => {
    const created = new Date(fragment.createdAt);
    return (
      created.getFullYear() === year &&
      created.getMonth() === month &&
      created.getDate() === day
    );
  }).length;
}

export interface MonthGroup {
  key: string;
  monthDate: Date;
  items: Fragment[];
}

export function groupFragmentsByMonth(fragments: Fragment[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const fragment of fragments) {
    const created = new Date(fragment.createdAt);
    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(fragment);
    } else {
      groups.set(key, {
        key,
        monthDate: new Date(created.getFullYear(), created.getMonth(), 1),
        items: [fragment],
      });
    }
  }
  return Array.from(groups.values());
}

const STOP_WORDS = new Set([
  'i', 'the', 'a', 'is', 'in', 'and', 'to', 'of', 'it',
  'that', 'this', 'for', 'on', 'with', 'was', 'but',
]);

export function findRecurringWord(
  fragments: Fragment[],
  locale: string,
): string | null {
  if (locale.startsWith('zh')) return null;
  const textFragments = fragments.filter((fragment) => fragment.type !== 'audio');
  if (textFragments.length < 3) return null;

  const counts = new Map<string, number>();
  for (const fragment of textFragments) {
    const words = fragment.content
      .toLowerCase()
      .split(/[^\p{L}\p{N}']+/u)
      .filter(Boolean);
    for (const word of words) {
      if (word.length < 2 || STOP_WORDS.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  let bestWord: string | null = null;
  let bestCount = 1;
  for (const [word, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestWord = word;
    }
  }
  return bestWord;
}
