'use client';

import { useState, useEffect, useRef } from 'react';
import BottomNav from '@/components/BottomNav';
import { getFragments, deleteFragment } from '@/lib/storage';
import type { Fragment } from '@/lib/types';

function groupByMonth(fragments: Fragment[]): { label: string; items: Fragment[] }[] {
  const groups = new Map<string, Fragment[]>();
  for (const f of fragments) {
    const label = new Date(f.createdAt).toLocaleDateString([], {
      month: 'long',
      year:  'numeric',
    });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(f);
  }
  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function formatArchiveDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString([], {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

export default function ArchivePage() {
  const [fragments,  setFragments]  = useState<Fragment[]>([]);
  const [expanded,   setExpanded]   = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState<string | null>(null);
  const longPressRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const all = getFragments().sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    setFragments(all);
  }, []);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function startLongPress(id: string) {
    longPressRef.current = setTimeout(() => setConfirming(id), 600);
  }

  function cancelLongPress() {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }

  function handleDelete(id: string) {
    deleteFragment(id);
    setFragments(prev => prev.filter(f => f.id !== id));
    setConfirming(null);
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(fragments, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `mnemo-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const groups = groupByMonth(fragments);

  return (
    <div className="min-h-screen pb-20">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-mnemo-border">
        <span className="font-dm-mono text-mnemo-ink-secondary text-[10px] uppercase tracking-widest">
          Archive
        </span>
        {fragments.length > 0 && (
          <button
            onClick={handleExport}
            className="font-dm-mono text-mnemo-ink-secondary text-[10px] uppercase tracking-wider hover:text-mnemo-ink transition-colors"
          >
            Export
          </button>
        )}
      </header>

      <main className="px-4">
        {fragments.length === 0 ? (
          <div className="pt-8">
            <p className="font-cormorant italic text-mnemo-ink-secondary leading-relaxed" style={{ fontSize: '16px' }}>
              Your archive is empty. Every fragment you save will live here.
            </p>
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <section key={label} className="mt-6">
              <h2 className="font-dm-mono text-mnemo-ink-tertiary text-[10px] uppercase tracking-widest mb-3">
                {label}
              </h2>
              {items.map(f => (
                <div key={f.id} className="border-b border-mnemo-border py-3">
                  {confirming === f.id ? (
                    <div className="py-1">
                      <p className="font-dm-sans text-mnemo-ink-secondary leading-relaxed mb-3" style={{ fontSize: '14px' }}>
                        Remove this fragment? This cannot be undone.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="font-dm-mono text-[11px] uppercase tracking-wider text-red-500"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => setConfirming(null)}
                          className="font-dm-mono text-[11px] uppercase tracking-wider text-mnemo-ink-tertiary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => toggleExpand(f.id)}
                      onMouseDown={() => startLongPress(f.id)}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onTouchStart={() => startLongPress(f.id)}
                      onTouchEnd={cancelLongPress}
                      className="cursor-pointer select-none"
                    >
                      <p className="font-dm-mono text-mnemo-ink-tertiary mb-1.5" style={{ fontSize: '10px' }}>
                        {formatArchiveDate(f.createdAt)}
                      </p>
                      <p
                        className={`font-cormorant italic text-mnemo-ink leading-relaxed ${
                          expanded.has(f.id) ? '' : 'line-clamp-3'
                        }`}
                        style={{ fontSize: '16px' }}
                      >
                        {f.content}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
