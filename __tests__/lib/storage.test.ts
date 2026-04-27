// __tests__/lib/storage.test.ts
import {
  getFragments,
  saveFragment,
  deleteFragment,
  getResurfacingHistory,
  saveResurfacing,
  updateResurfacing,
  isStorageAvailable,
} from '@/lib/storage';
import type { Fragment, Resurface } from '@/lib/types';

const makeFragment = (overrides: Partial<Fragment> = {}): Fragment => ({
  id: 'test-id-1',
  content: 'Test content',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const makeResurface = (overrides: Partial<Resurface> = {}): Resurface => ({
  fragmentId: 'test-id-1',
  shownAt: new Date().toISOString(),
  reaction: null,
  triggerType: 'day_7',
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
});

describe('isStorageAvailable', () => {
  it('returns true in jsdom environment', () => {
    expect(isStorageAvailable()).toBe(true);
  });
});

describe('getFragments', () => {
  it('returns empty array when no fragments stored', () => {
    expect(getFragments()).toEqual([]);
  });

  it('returns stored fragments', () => {
    const f = makeFragment();
    localStorage.setItem('mnemo_fragments', JSON.stringify([f]));
    expect(getFragments()).toEqual([f]);
  });

  it('returns empty array when stored value is corrupted JSON', () => {
    localStorage.setItem('mnemo_fragments', 'not-json{{{');
    expect(getFragments()).toEqual([]);
  });
});

describe('saveFragment', () => {
  it('adds a new fragment', () => {
    const f = makeFragment();
    saveFragment(f);
    expect(getFragments()).toEqual([f]);
  });

  it('appends to existing fragments', () => {
    const f1 = makeFragment({ id: 'a' });
    const f2 = makeFragment({ id: 'b' });
    saveFragment(f1);
    saveFragment(f2);
    expect(getFragments()).toHaveLength(2);
  });

  it('updates an existing fragment with the same id', () => {
    const original = makeFragment({ content: 'original' });
    saveFragment(original);
    const updated = makeFragment({ content: 'updated' });
    saveFragment(updated);
    const all = getFragments();
    expect(all).toHaveLength(1);
    expect(all[0].content).toBe('updated');
  });
});

describe('deleteFragment', () => {
  it('removes a fragment by id', () => {
    const f = makeFragment({ id: 'to-delete' });
    saveFragment(f);
    deleteFragment('to-delete');
    expect(getFragments()).toEqual([]);
  });

  it('does nothing when id does not exist', () => {
    const f = makeFragment({ id: 'exists' });
    saveFragment(f);
    deleteFragment('nonexistent');
    expect(getFragments()).toHaveLength(1);
  });
});

describe('getResurfacingHistory', () => {
  it('returns empty array when no history stored', () => {
    expect(getResurfacingHistory()).toEqual([]);
  });

  it('returns stored history', () => {
    const r = makeResurface();
    localStorage.setItem('mnemo_resurfacing', JSON.stringify([r]));
    expect(getResurfacingHistory()).toEqual([r]);
  });
});

describe('saveResurfacing', () => {
  it('adds a new resurfacing record', () => {
    const r = makeResurface();
    saveResurfacing(r);
    expect(getResurfacingHistory()).toEqual([r]);
  });
});

describe('updateResurfacing', () => {
  it('sets the reaction on an existing record', () => {
    const r = makeResurface({ fragmentId: 'frag-1', reaction: null });
    saveResurfacing(r);
    updateResurfacing('frag-1', 'still_true');
    const history = getResurfacingHistory();
    expect(history[0].reaction).toBe('still_true');
  });

  it('does nothing when fragmentId does not exist', () => {
    updateResurfacing('nonexistent', 'changed');
    expect(getResurfacingHistory()).toEqual([]);
  });
});
