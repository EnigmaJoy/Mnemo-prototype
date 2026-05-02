'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomNav from '@/components/BottomNav';
import FragmentItem from '@/components/FragmentItem';
import {
  deleteFragment,
  exportFragmentsAsDownload,
  getFragmentsGroupedByMonth,
} from '@/controllers/fragmentController';
import { formatMonthYear } from '@/lib/datetime';
import type { MonthGroup } from '@/models/fragment';

export default function ArchivePage() {
  const { t, i18n } = useTranslation();
  const [hydrated, setHydrated] = useState(false);
  const [groups, setGroups] = useState<MonthGroup[]>([]);

  const reloadGroups = () => {
    setGroups(getFragmentsGroupedByMonth());
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    reloadGroups();
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleDelete = async (id: string) => {
    await deleteFragment(id);
    reloadGroups();
  };

  const handleExport = () => {
    exportFragmentsAsDownload();
  };

  const totalFragments = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <>
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
        <header className="flex items-center justify-between mb-10">
          <h1 className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink">
            {t('archive.title')}
          </h1>
          {totalFragments > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink py-2 px-1"
            >
              {t('common.export')}
            </button>
          )}
        </header>

        {hydrated && totalFragments === 0 && (
          <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed mt-12">
            {t('archive.empty')}
          </p>
        )}

        {hydrated && totalFragments > 0 && (
          <div>
            {groups.map((group) => (
              <section key={group.key} className="mb-10">
                <h2 className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-2">
                  {formatMonthYear(group.monthDate, i18n.language)}
                </h2>
                <div>
                  {group.items.map((fragment) => (
                    <FragmentItem
                      key={fragment.id}
                      fragment={fragment}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </>
  );
}
