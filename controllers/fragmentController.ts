import {
  countFragmentsCreatedOn,
  findEarliestFragment,
  groupFragmentsByMonth,
  sortFragmentsNewestFirst,
  type Fragment,
  type MonthGroup,
} from '@/models/fragment';
import {
  deleteFragmentRemote,
  loadFragments,
  upsertFragment,
} from '@/lib/fragments';
import { isStorageAvailable } from '@/lib/storage';
import { deleteAudioBlob, saveAudioBlob } from '@/lib/audio/db';
import { detectSentiment } from '@/lib/sentiment';

// `isStorageAvailable` still drives the "private-mode warning" banner on Home.
// localStorage is no longer the source of truth for fragments, but we still
// touch it for ephemeral state (dismissed ids, locale) and for the one-shot
// migration. If it's blocked we want to tell the user.
export function isFragmentStorageAvailable(): boolean {
  return isStorageAvailable();
}

export async function getAllFragments(): Promise<Fragment[]> {
  return sortFragmentsNewestFirst(await loadFragments());
}

export async function getRecentFragments(count: number): Promise<Fragment[]> {
  return (await getAllFragments()).slice(0, count);
}

export async function getFragmentById(id: string): Promise<Fragment | null> {
  const all = await loadFragments();
  return all.find((fragment) => fragment.id === id) ?? null;
}

export async function getFragmentCount(): Promise<number> {
  return (await loadFragments()).length;
}

export async function getEarliestFragment(): Promise<Fragment | null> {
  return findEarliestFragment(await loadFragments());
}

export async function getFragmentsCreatedToday(now: Date = new Date()): Promise<number> {
  return countFragmentsCreatedOn(await loadFragments(), now);
}

export async function getFragmentsGroupedByMonth(): Promise<MonthGroup[]> {
  return groupFragmentsByMonth(await getAllFragments());
}

export async function saveTextFragment(content: string): Promise<Fragment> {
  const trimmed = content.trim();
  const iso = new Date().toISOString();
  const fragment: Fragment = {
    id: crypto.randomUUID(),
    content: trimmed,
    createdAt: iso,
    updatedAt: iso,
    type: 'text',
    sentimentCode: detectSentiment(trimmed),
  };
  return upsertFragment(fragment);
}

export async function saveAudioFragment(
  transcript: string,
  blob: Blob,
): Promise<Fragment> {
  const id = crypto.randomUUID();
  const audioId = `audio-${id}`;
  // Audio blob stays in IndexedDB on this device (Phase 1 = D1 option B).
  // Server stores metadata only; audio_url stays NULL until Storage migration.
  await saveAudioBlob(audioId, blob);
  const iso = new Date().toISOString();
  const trimmed = transcript.trim();
  const fragment: Fragment = {
    id,
    content: trimmed,
    createdAt: iso,
    updatedAt: iso,
    type: 'audio',
    audioId,
    sentimentCode: detectSentiment(trimmed),
  };
  return upsertFragment(fragment);
}

export async function deleteFragment(id: string): Promise<void> {
  const all = await loadFragments();
  const target = all.find((fragment) => fragment.id === id);
  if (target?.type === 'audio' && target.audioId) {
    try {
      await deleteAudioBlob(target.audioId);
    } catch {
      /* blob already gone or storage error; server delete is the source of truth */
    }
  }
  // resurfacings cascade via FK on the server side
  await deleteFragmentRemote(id);
}
