import { runOneShotFragmentMigration } from '@/lib/migration';
import type { Fragment } from '@/models/fragment';
import type { Resurface } from '@/models/resurfacing';

const fragment: Fragment = {
  id: '11111111-1111-4111-8111-111111111111',
  content: 'hello',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  type: 'text',
};

const resurfacing: Resurface = {
  fragmentId: fragment.id,
  shownAt: '2026-01-08T00:00:00.000Z',
  reaction: null,
  triggerType: 'day_7',
};

beforeEach(() => {
  localStorage.clear();
});

describe('runOneShotFragmentMigration', () => {
  it('skips when migrated flag is set', async () => {
    localStorage.setItem('mnemo_migrated_v1', '1');
    localStorage.setItem('mnemo_fragments', JSON.stringify([fragment]));

    const bulkUpsertFragments = jest.fn().mockResolvedValue([]);
    const bulkUpsertResurfacings = jest.fn().mockResolvedValue([]);

    await runOneShotFragmentMigration({ bulkUpsertFragments, bulkUpsertResurfacings });

    expect(bulkUpsertFragments).not.toHaveBeenCalled();
    expect(bulkUpsertResurfacings).not.toHaveBeenCalled();
  });

  it('uploads fragments and resurfacings, then sets the flag', async () => {
    localStorage.setItem('mnemo_fragments', JSON.stringify([fragment]));
    localStorage.setItem('mnemo_resurfacing', JSON.stringify([resurfacing]));

    const bulkUpsertFragments = jest.fn().mockResolvedValue([fragment]);
    const bulkUpsertResurfacings = jest.fn().mockResolvedValue([resurfacing]);

    await runOneShotFragmentMigration({ bulkUpsertFragments, bulkUpsertResurfacings });

    expect(bulkUpsertFragments).toHaveBeenCalledWith([fragment]);
    expect(bulkUpsertResurfacings).toHaveBeenCalledWith([resurfacing]);
    expect(localStorage.getItem('mnemo_migrated_v1')).toBe('1');
  });

  it('skips empty arrays but still sets the flag (no-op migration)', async () => {
    const bulkUpsertFragments = jest.fn().mockResolvedValue([]);
    const bulkUpsertResurfacings = jest.fn().mockResolvedValue([]);

    await runOneShotFragmentMigration({ bulkUpsertFragments, bulkUpsertResurfacings });

    expect(bulkUpsertFragments).not.toHaveBeenCalled();
    expect(bulkUpsertResurfacings).not.toHaveBeenCalled();
    expect(localStorage.getItem('mnemo_migrated_v1')).toBe('1');
  });

  it('does NOT set the flag when fragment upload fails (so retry is possible)', async () => {
    localStorage.setItem('mnemo_fragments', JSON.stringify([fragment]));

    const bulkUpsertFragments = jest.fn().mockRejectedValue(new Error('network'));
    const bulkUpsertResurfacings = jest.fn().mockResolvedValue([]);

    await expect(
      runOneShotFragmentMigration({ bulkUpsertFragments, bulkUpsertResurfacings }),
    ).rejects.toThrow('network');
    expect(localStorage.getItem('mnemo_migrated_v1')).toBeNull();
  });

  it('tolerates corrupted JSON in localStorage', async () => {
    localStorage.setItem('mnemo_fragments', 'not-json{');
    localStorage.setItem('mnemo_resurfacing', '{not-an-array');

    const bulkUpsertFragments = jest.fn().mockResolvedValue([]);
    const bulkUpsertResurfacings = jest.fn().mockResolvedValue([]);

    await runOneShotFragmentMigration({ bulkUpsertFragments, bulkUpsertResurfacings });

    expect(bulkUpsertFragments).not.toHaveBeenCalled();
    expect(bulkUpsertResurfacings).not.toHaveBeenCalled();
    expect(localStorage.getItem('mnemo_migrated_v1')).toBe('1');
  });
});
