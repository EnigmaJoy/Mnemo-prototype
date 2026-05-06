'use client';

// Async client for fragments + resurfacings, server-of-truth via /api/fragments
// and /api/resurfacings. Module-level in-memory cache keeps the read path cheap
// (Home, Archive, SentimentGrid all hit `loadFragments()` and share one fetch).
//
// Pattern: first call fetches and caches; subsequent calls return the cache;
// mutations update the cache in place; bulk mutations invalidate. Concurrent
// initial reads share a single in-flight promise so we never race.

import type { Fragment } from '@/models/fragment';
import type { Resurface } from '@/models/resurfacing';
import { runOneShotFragmentMigration } from '@/lib/migration';

let fragmentCache: Fragment[] | null = null;
let resurfacingCache: Resurface[] | null = null;
let inflightFragments: Promise<Fragment[]> | null = null;
let inflightResurfacings: Promise<Resurface[]> | null = null;
let migrationDone = false;
let inflightMigration: Promise<void> | null = null;

export function invalidateFragmentsCache(): void {
  fragmentCache = null;
  resurfacingCache = null;
  inflightFragments = null;
  inflightResurfacings = null;
}

async function ensureMigrated(): Promise<void> {
  if (migrationDone) return;
  if (inflightMigration) return inflightMigration;
  inflightMigration = (async () => {
    try {
      await runOneShotFragmentMigration({
        bulkUpsertFragments: bulkUpsertFragmentsRaw,
        bulkUpsertResurfacings: bulkUpsertResurfacingsRaw,
      });
      migrationDone = true;
    } finally {
      inflightMigration = null;
    }
  })();
  return inflightMigration;
}

// ─── Fragments ─────────────────────────────────────────────────────────────

export async function loadFragments(): Promise<Fragment[]> {
  if (fragmentCache) return fragmentCache;
  if (inflightFragments) return inflightFragments;
  inflightFragments = (async () => {
    await ensureMigrated();
    const res = await fetch('/api/fragments', { cache: 'no-store' });
    if (!res.ok) {
      inflightFragments = null;
      throw new Error(`load fragments failed (${res.status})`);
    }
    const data = (await res.json()) as { fragments: Fragment[] };
    fragmentCache = data.fragments;
    inflightFragments = null;
    return data.fragments;
  })();
  return inflightFragments;
}

export async function upsertFragment(fragment: Fragment): Promise<Fragment> {
  const res = await fetch('/api/fragments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fragments: [fragment] }),
  });
  if (!res.ok) throw new Error(`save fragment failed (${res.status})`);
  const data = (await res.json()) as { fragments: Fragment[] };
  const saved = data.fragments[0];
  if (fragmentCache) {
    const idx = fragmentCache.findIndex((f) => f.id === saved.id);
    if (idx >= 0) fragmentCache[idx] = saved;
    else fragmentCache.unshift(saved);
  }
  return saved;
}

async function bulkUpsertFragmentsRaw(fragments: Fragment[]): Promise<Fragment[]> {
  if (fragments.length === 0) return [];
  const res = await fetch('/api/fragments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fragments }),
  });
  if (!res.ok) throw new Error(`bulk save fragments failed (${res.status})`);
  const data = (await res.json()) as { fragments: Fragment[] };
  fragmentCache = null;
  return data.fragments;
}

export async function deleteFragmentRemote(id: string): Promise<void> {
  const res = await fetch(`/api/fragments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`delete fragment failed (${res.status})`);
  if (fragmentCache) fragmentCache = fragmentCache.filter((f) => f.id !== id);
  if (resurfacingCache) {
    resurfacingCache = resurfacingCache.filter((r) => r.fragmentId !== id);
  }
}

// ─── Resurfacings ──────────────────────────────────────────────────────────

export async function loadResurfacings(): Promise<Resurface[]> {
  if (resurfacingCache) return resurfacingCache;
  if (inflightResurfacings) return inflightResurfacings;
  inflightResurfacings = (async () => {
    await ensureMigrated();
    const res = await fetch('/api/resurfacings', { cache: 'no-store' });
    if (!res.ok) {
      inflightResurfacings = null;
      throw new Error(`load resurfacings failed (${res.status})`);
    }
    const data = (await res.json()) as { resurfacings: Resurface[] };
    resurfacingCache = data.resurfacings;
    inflightResurfacings = null;
    return data.resurfacings;
  })();
  return inflightResurfacings;
}

export async function upsertResurfacing(record: Resurface): Promise<Resurface> {
  const res = await fetch('/api/resurfacings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resurfacings: [record] }),
  });
  if (!res.ok) throw new Error(`save resurfacing failed (${res.status})`);
  const data = (await res.json()) as { resurfacings: Resurface[] };
  const saved = data.resurfacings[0];
  if (resurfacingCache) {
    const idx = resurfacingCache.findIndex((r) => r.fragmentId === saved.fragmentId);
    if (idx >= 0) resurfacingCache[idx] = saved;
    else resurfacingCache.push(saved);
  }
  return saved;
}

async function bulkUpsertResurfacingsRaw(records: Resurface[]): Promise<Resurface[]> {
  if (records.length === 0) return [];
  const res = await fetch('/api/resurfacings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resurfacings: records }),
  });
  if (!res.ok) throw new Error(`bulk save resurfacings failed (${res.status})`);
  const data = (await res.json()) as { resurfacings: Resurface[] };
  resurfacingCache = null;
  return data.resurfacings;
}
