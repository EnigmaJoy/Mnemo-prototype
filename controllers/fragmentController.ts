import {
  countFragmentsCreatedOn,
  findEarliestFragment,
  groupFragmentsByMonth,
  sortFragmentsNewestFirst,
  type Fragment,
  type MonthGroup,
} from '@/models/fragment';
import {
  deleteFragment as removeFragment,
  deleteResurfacingByFragmentId,
  getFragments as readFragments,
  isStorageAvailable,
  saveFragment as writeFragment,
} from '@/lib/storage';
import { deleteAudioBlob } from '@/lib/audio/db';
import { saveAudioBlob } from '@/lib/audio/db';

export function isFragmentStorageAvailable(): boolean {
  return isStorageAvailable();
}

export function getAllFragments(): Fragment[] {
  return sortFragmentsNewestFirst(readFragments());
}

export function getRecentFragments(count: number): Fragment[] {
  return getAllFragments().slice(0, count);
}

export function getFragmentById(id: string): Fragment | null {
  return readFragments().find((fragment) => fragment.id === id) ?? null;
}

export function getFragmentCount(): number {
  return readFragments().length;
}

export function getEarliestFragment(): Fragment | null {
  return findEarliestFragment(readFragments());
}

export function getFragmentsCreatedToday(now: Date = new Date()): number {
  return countFragmentsCreatedOn(readFragments(), now);
}

export function getFragmentsGroupedByMonth(): MonthGroup[] {
  return groupFragmentsByMonth(getAllFragments());
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
  };
  writeFragment(fragment);
  return fragment;
}

export async function saveAudioFragment(
  transcript: string,
  blob: Blob,
): Promise<Fragment> {
  const id = crypto.randomUUID();
  const audioId = `audio-${id}`;
  await saveAudioBlob(audioId, blob);
  const iso = new Date().toISOString();
  const fragment: Fragment = {
    id,
    content: transcript.trim(),
    createdAt: iso,
    updatedAt: iso,
    type: 'audio',
    audioId,
  };
  writeFragment(fragment);
  return fragment;
}

export async function deleteFragment(id: string): Promise<void> {
  const target = readFragments().find((fragment) => fragment.id === id);
  if (target?.type === 'audio' && target.audioId) {
    try {
      await deleteAudioBlob(target.audioId);
    } catch {
      /* blob already gone or storage error; metadata removal is the source of truth */
    }
  }
  removeFragment(id);
  deleteResurfacingByFragmentId(id);
}

