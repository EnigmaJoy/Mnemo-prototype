'use client';

import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import FragmentItem from '@/components/FragmentItem';
import { getFragments, deleteFragment } from '@/lib/storage';
import type { Fragment } from '@/lib/types';

function formatMonth(d: Date): string {
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function todayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ArchivePage() {
  const [hydrated, setHydrated] = useState(false);
  const [fragments, setFragments] = useState<Fragment[]>([]);

  const reload = () => {
    const all = getFragments();
    const sorted = [...all].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    setFragments(sorted);
  };

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       One-time read from localStorage on mount. */
    reload();
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleDelete = (id: string) => {
    deleteFragment(id);
    reload();
  };

  const handleExport = () => {
    const data = JSON.stringify(getFragments(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mnemo-export-${todayYMD()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group by year-month, preserving Map insertion order (already reverse-chrono)
  const groups = new Map<string, { label: string; items: Fragment[] }>();
  for (const f of fragments) {
    const d = new Date(f.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!groups.has(key)) {
      groups.set(key, { label: formatMonth(d), items: [] });
    }
    groups.get(key)!.items.push(f);
  }

  return (
    <>
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-8 pb-24">
        <header className="flex items-center justify-between mb-10">
          <h1 className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink">
            Archive
          </h1>
          {fragments.length > 0 && (
            <button
              type="button"
              onClick={handleExport}
              className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink"
            >
              Export
            </button>
          )}
        </header>

        {hydrated && fragments.length === 0 && (
          <p className="font-cormorant italic text-xl text-mnemo-ink-secondary leading-relaxed mt-12">
            Your archive is empty. Every fragment you save will live here.
          </p>
        )}

        {hydrated && fragments.length > 0 && (
          <div>
            {Array.from(groups.entries()).map(([key, { label, items }]) => (
              <section key={key} className="mb-10">
                <h2 className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-2">
                  {label}
                </h2>
                <div>
                  {items.map((f) => (
                    <FragmentItem
                      key={f.id}
                      fragment={f}
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
