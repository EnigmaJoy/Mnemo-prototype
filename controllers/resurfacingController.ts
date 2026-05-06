import {
  daysSince,
  getTriggerType,
  hasHadFirstResurfacing,
  selectResurfacingCandidate,
  type Resurface,
  type ResurfacingCandidate,
} from '@/models/resurfacing';
import type { Fragment } from '@/models/fragment';
import {
  loadFragments,
  loadResurfacings,
  upsertResurfacing,
} from '@/lib/fragments';
import { addDismissedId, getDismissedIds } from '@/lib/storage';

export async function getCandidateToResurface(): Promise<ResurfacingCandidate | null> {
  const [fragments, history] = await Promise.all([
    loadFragments(),
    loadResurfacings(),
  ]);
  return selectResurfacingCandidate(fragments, history, getDismissedIds());
}

export async function hasFirstResurfacingHappened(): Promise<boolean> {
  return hasHadFirstResurfacing(await loadResurfacings());
}

export interface ResurfaceContext {
  fragment: Fragment;
  record: Resurface | null;
  triggerType: Resurface['triggerType'] | null;
}

export async function loadResurfaceContext(id: string): Promise<ResurfaceContext | null> {
  const [fragments, history] = await Promise.all([
    loadFragments(),
    loadResurfacings(),
  ]);
  const fragment = fragments.find((f) => f.id === id);
  if (!fragment) return null;

  const existing = history.find((record) => record.fragmentId === id);
  if (existing) {
    return { fragment, record: existing, triggerType: existing.triggerType };
  }

  const computedTrigger = getTriggerType(daysSince(fragment.createdAt));
  if (!computedTrigger) {
    return { fragment, record: null, triggerType: null };
  }

  const fresh: Resurface = {
    fragmentId: id,
    shownAt: new Date().toISOString(),
    reaction: null,
    triggerType: computedTrigger,
  };
  const saved = await upsertResurfacing(fresh);
  return { fragment, record: saved, triggerType: saved.triggerType };
}

export async function saveReaction(
  fragmentId: string,
  reaction: NonNullable<Resurface['reaction']>,
): Promise<void> {
  const history = await loadResurfacings();
  const existing = history.find((r) => r.fragmentId === fragmentId);
  // If no record yet (edge case: user hits a Reaction button before
  // loadResurfaceContext has completed), seed one with the current trigger.
  const fragments = await loadFragments();
  const fragment = fragments.find((f) => f.id === fragmentId);
  if (!fragment) return;
  const triggerType =
    existing?.triggerType ?? getTriggerType(daysSince(fragment.createdAt)) ?? 'day_7';
  await upsertResurfacing({
    fragmentId,
    shownAt: existing?.shownAt ?? new Date().toISOString(),
    reaction,
    triggerType,
  });
}

export function dismissCandidate(fragmentId: string): void {
  addDismissedId(fragmentId);
}
