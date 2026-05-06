'use client';

/* ───────────────────────────────────────────────────────────────────────────
   ONE-SHOT LOCALSTORAGE → SUPABASE FRAGMENT MIGRATION
   ───────────────────────────────────────────────────────────────────────────

   WHAT THIS DOES
     For users who built up fragments in the localStorage-only era of Mnemo,
     this script lifts that data into the Supabase `fragments` and
     `resurfacings` tables on the first authenticated load after the upgrade.
     Once it has run, the server is the source of truth and localStorage is
     no longer read.

       1. Reads `mnemo_fragments`        (array of Fragment)
       2. Reads `mnemo_resurfacing`      (array of Resurface)
       3. POST  /api/fragments           (server upserts by id)
       4. POST  /api/resurfacings        (server upserts by user+fragment)
       5. Sets  `mnemo_migrated_v1`=`1`  (the gate)

   WHEN IT RUNS
     Lazily, the first time `loadFragments()` or `loadResurfacings()` is called
     in a session where `mnemo_migrated_v1` is absent. Wraps server reads, so
     no migration = no fetch on first page load. After the flag is set, the
     migration is skipped entirely on every subsequent call.

   WHY ONLY ONCE
     - The server upserts are idempotent, so re-running is harmless in theory.
     - In practice we don't want to re-upload the same N fragments on every
       page load — that would waste bandwidth, hit our rate limits, and could
       resurrect server-side deletions if the user later removes a fragment
       from the server but it still lives in localStorage.
     - The flag is the cleanest cut between the two storage models: present =
       Supabase-only world.

   AUDIO HANDLING (Phase 1 = Plan A option B)
     Audio fragments are migrated as text-only metadata. Their `audio_url`
     column on the server stays NULL; the .webm/.mp3 blob remains in IndexedDB
     on the device that recorded it. Cross-device audio playback will arrive
     when we add Supabase Storage in a future phase. Until then, opening the
     resurface page for an audio fragment from a different device will show
     the transcript only — not break.

   FAILURE MODE
     If the network request fails the migration throws and the flag is NOT
     set. The next call to loadFragments() will retry. The user-facing effect
     is a single load failure (UI shows error state); their localStorage is
     untouched, so nothing is lost. Once they retry on a healthy network the
     migration completes and they move on.

   HOW TO RE-TRIGGER MANUALLY (debugging only)
     In the browser devtools console, run:
       localStorage.removeItem('mnemo_migrated_v1');
       location.reload();
     The migration will re-run on the next fragment fetch. Since the API uses
     upsert this is idempotent and safe — but be aware it may resurrect any
     fragments you previously deleted server-side, IF those fragments still
     live in localStorage on this device.

   HOW TO REMOVE THIS CODE (in some future cleanup PR)
     Once we're confident every active user has been migrated (check via the
     fragments table or analytics), this whole file plus its caller in
     `lib/fragments.ts` (`ensureMigrated` and friends) can be deleted. The
     constant `MIGRATION_FLAG_KEY` and the localStorage reads are the only
     trace; the rest of the app already speaks Supabase.

   ─────────────────────────────────────────────────────────────────────────── */

import type { Fragment } from '@/models/fragment';
import type { Resurface } from '@/models/resurfacing';

const MIGRATION_FLAG_KEY = 'mnemo_migrated_v1';
const FRAGMENTS_KEY = 'mnemo_fragments';
const RESURFACING_KEY = 'mnemo_resurfacing';

type Deps = {
  bulkUpsertFragments: (fragments: Fragment[]) => Promise<Fragment[]>;
  bulkUpsertResurfacings: (records: Resurface[]) => Promise<Resurface[]>;
};

function readLocalArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const probe = '__mnemo_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export async function runOneShotFragmentMigration(deps: Deps): Promise<void> {
  if (!isLocalStorageAvailable()) {
    // No localStorage means nothing to migrate (private mode, SSR, locked
    // device, etc.) and nowhere to write the flag. Skip silently — the next
    // session will retry, which is fine because there's nothing to lift.
    return;
  }
  if (localStorage.getItem(MIGRATION_FLAG_KEY) === '1') return;

  const fragments = readLocalArray<Fragment>(FRAGMENTS_KEY);
  const resurfacings = readLocalArray<Resurface>(RESURFACING_KEY);

  if (fragments.length > 0) {
    await deps.bulkUpsertFragments(fragments);
  }
  if (resurfacings.length > 0) {
    await deps.bulkUpsertResurfacings(resurfacings);
  }

  // Flag is set last, after both uploads succeed. If either throws the flag
  // stays absent and the migration retries on the next read.
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, '1');
  } catch {
    /* quota exhausted; harmless — migration retries next session and the
       server upsert deduplicates. */
  }
}
