// __tests__/lib/resurfacing.test.ts
import { selectResurfacingCandidate, daysSince } from '@/lib/resurfacing';
import type { Fragment, Resurface } from '@/lib/types';

// Helper to build a fragment created N days ago
const fragmentDaysAgo = (days: number, id = 'frag-1'): Fragment => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return {
    id,
    content: `Fragment from ${days} days ago`,
    createdAt: d.toISOString(),
    updatedAt: d.toISOString(),
  };
};

describe('daysSince', () => {
  it('returns 0 for a date created today', () => {
    const now = new Date().toISOString();
    expect(daysSince(now)).toBe(0);
  });

  it('returns 7 for a date created 7 days ago', () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    expect(daysSince(d.toISOString())).toBe(7);
  });
});

describe('selectResurfacingCandidate', () => {
  const noHistory: Resurface[] = [];
  const noDismissed: string[] = [];

  it('returns null when no fragments exist', () => {
    expect(selectResurfacingCandidate([], noHistory, noDismissed)).toBeNull();
  });

  it('returns null for a fragment from 5 days ago (too early)', () => {
    expect(selectResurfacingCandidate([fragmentDaysAgo(5)], noHistory, noDismissed)).toBeNull();
  });

  it('returns null for a fragment from 9 days ago (out of day_7 window)', () => {
    expect(selectResurfacingCandidate([fragmentDaysAgo(9)], noHistory, noDismissed)).toBeNull();
  });

  it('triggers day_7 for a fragment from exactly 7 days ago', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(7)], noHistory, noDismissed);
    expect(result).not.toBeNull();
    expect(result!.triggerType).toBe('day_7');
  });

  it('triggers day_7 for a fragment from 6 days ago (lower bound)', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(6)], noHistory, noDismissed);
    expect(result).not.toBeNull();
    expect(result!.triggerType).toBe('day_7');
  });

  it('triggers day_7 for a fragment from 8 days ago (upper bound)', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(8)], noHistory, noDismissed);
    expect(result).not.toBeNull();
    expect(result!.triggerType).toBe('day_7');
  });

  it('triggers day_14 for a fragment from 14 days ago', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(14)], noHistory, noDismissed);
    expect(result).not.toBeNull();
    expect(result!.triggerType).toBe('day_14');
  });

  it('triggers day_14 for a fragment from 13 days ago (lower bound)', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(13)], noHistory, noDismissed);
    expect(result!.triggerType).toBe('day_14');
  });

  it('triggers day_14 for a fragment from 15 days ago (upper bound)', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(15)], noHistory, noDismissed);
    expect(result!.triggerType).toBe('day_14');
  });

  it('triggers day_30 for a fragment from 30 days ago', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(30)], noHistory, noDismissed);
    expect(result!.triggerType).toBe('day_30');
  });

  it('triggers day_30 for a fragment from 29 days ago (lower bound)', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(29)], noHistory, noDismissed);
    expect(result!.triggerType).toBe('day_30');
  });

  it('triggers day_30 for a fragment from 31 days ago (upper bound)', () => {
    const result = selectResurfacingCandidate([fragmentDaysAgo(31)], noHistory, noDismissed);
    expect(result!.triggerType).toBe('day_30');
  });

  it('excludes fragments that already have a reaction', () => {
    const fragment = fragmentDaysAgo(7);
    const history: Resurface[] = [{
      fragmentId: fragment.id,
      shownAt: new Date().toISOString(),
      reaction: 'still_true',
      triggerType: 'day_7',
    }];
    expect(selectResurfacingCandidate([fragment], history, noDismissed)).toBeNull();
  });

  it('excludes fragments in the dismissed list', () => {
    const fragment = fragmentDaysAgo(7);
    expect(selectResurfacingCandidate([fragment], noHistory, [fragment.id])).toBeNull();
  });

  it('selects the most recent fragment when multiple are eligible', () => {
    const older  = fragmentDaysAgo(8,  'older');
    const newer  = fragmentDaysAgo(6,  'newer');
    const result = selectResurfacingCandidate([older, newer], noHistory, noDismissed);
    expect(result!.fragment.id).toBe('newer');
  });

  it('returns null if the only eligible fragment has been archived', () => {
    const fragment = fragmentDaysAgo(7);
    const history: Resurface[] = [{
      fragmentId: fragment.id,
      shownAt: new Date().toISOString(),
      reaction: 'archived',
      triggerType: 'day_7',
    }];
    expect(selectResurfacingCandidate([fragment], history, noDismissed)).toBeNull();
  });
});
