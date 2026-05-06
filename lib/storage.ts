// Local-only state that does NOT round-trip to Supabase.
//
// Fragments and resurfacings have been migrated to the server (see
// `lib/fragments.ts`); only ephemeral, per-session, per-device state lives
// here now:
//
//   - dismissed banner ids       (sessionStorage; resets on tab close, on purpose)
//   - "is local storage usable?" (used by the Home banner that warns iOS users
//                                 in private mode their drafts won't survive)

const DISMISSED_KEY = 'mnemo_dismissed';

let cachedAvailability: boolean | null = null;

export function isStorageAvailable(): boolean {
  if (cachedAvailability !== null) return cachedAvailability;
  try {
    const probe = '__mnemo_test__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    cachedAvailability = true;
  } catch {
    cachedAvailability = false;
  }
  return cachedAvailability;
}

export function getDismissedIds(): string[] {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addDismissedId(id: string): void {
  try {
    const all = getDismissedIds();
    if (all.includes(id)) return;
    all.push(id);
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(all));
  } catch {
    /* sessionStorage unavailable; banner still hides via component state */
  }
}
