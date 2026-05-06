import {
  isStorageAvailable,
  getDismissedIds,
  addDismissedId,
} from '@/lib/storage';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('isStorageAvailable', () => {
  it('returns true in jsdom environment', () => {
    expect(isStorageAvailable()).toBe(true);
  });
});

describe('dismissed ids (sessionStorage)', () => {
  it('returns empty array when nothing dismissed', () => {
    expect(getDismissedIds()).toEqual([]);
  });

  it('persists added id', () => {
    addDismissedId('frag-1');
    expect(getDismissedIds()).toEqual(['frag-1']);
  });

  it('does not duplicate the same id', () => {
    addDismissedId('frag-1');
    addDismissedId('frag-1');
    expect(getDismissedIds()).toEqual(['frag-1']);
  });

  it('preserves multiple ids in order', () => {
    addDismissedId('a');
    addDismissedId('b');
    addDismissedId('c');
    expect(getDismissedIds()).toEqual(['a', 'b', 'c']);
  });
});
