// lib/storage.ts
import type { Fragment, Resurface } from './types';

const FRAGMENTS_KEY   = 'mnemo_fragments';
const RESURFACING_KEY = 'mnemo_resurfacing';
const DISMISSED_KEY   = 'mnemo_dismissed';

export function isStorageAvailable(): boolean {
  try {
    const test = '__mnemo_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

function readJSON<T>(key: string): T[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function writeJSON<T>(key: string, value: T[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or unavailable — silent no-op in prototype
  }
}

export function getFragments(): Fragment[] {
  return readJSON<Fragment>(FRAGMENTS_KEY);
}

export function saveFragment(fragment: Fragment): void {
  const all = getFragments();
  const idx = all.findIndex(f => f.id === fragment.id);
  if (idx >= 0) {
    all[idx] = fragment;
  } else {
    all.push(fragment);
  }
  writeJSON(FRAGMENTS_KEY, all);
}

export function deleteFragment(id: string): void {
  const all = getFragments().filter(f => f.id !== id);
  writeJSON(FRAGMENTS_KEY, all);
}

export function getResurfacingHistory(): Resurface[] {
  return readJSON<Resurface>(RESURFACING_KEY);
}

export function saveResurfacing(record: Resurface): void {
  const all = getResurfacingHistory();
  all.push(record);
  writeJSON(RESURFACING_KEY, all);
}

export function updateResurfacing(
  fragmentId: string,
  reaction: Resurface['reaction']
): void {
  const all = getResurfacingHistory();
  const idx = all.findIndex(r => r.fragmentId === fragmentId);
  if (idx < 0) return;
  all[idx] = { ...all[idx], reaction };
  writeJSON(RESURFACING_KEY, all);
}

// sessionStorage — "Not now" dismissals, cleared on browser close
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
    // sessionStorage unavailable — banner still hides via component state for this page
  }
}
