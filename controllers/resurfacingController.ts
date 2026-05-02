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
  addDismissedId,
  getDismissedIds,
  getFragments as readFragments,
  getResurfacingHistory as readResurfacingHistory,
  saveResurfacing,
  updateResurfacing,
} from '@/lib/storage';

export function getCandidateToResurface(): ResurfacingCandidate | null {
  return selectResurfacingCandidate(
    readFragments(),
    readResurfacingHistory(),
    getDismissedIds(),
  );
}

export function hasFirstResurfacingHappened(): boolean {
  return hasHadFirstResurfacing(readResurfacingHistory());
}

export interface ResurfaceContext {
  fragment: Fragment;
  record: Resurface | null;
  triggerType: Resurface['triggerType'] | null;
}

export function loadResurfaceContext(id: string): ResurfaceContext | null {
  const fragment = readFragments().find((f) => f.id === id);
  if (!fragment) return null;

  const history = readResurfacingHistory();
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
  saveResurfacing(fresh);
  return { fragment, record: fresh, triggerType: computedTrigger };
}

export function saveReaction(
  fragmentId: string,
  reaction: NonNullable<Resurface['reaction']>,
): void {
  updateResurfacing(fragmentId, reaction);
}

export function dismissCandidate(fragmentId: string): void {
  addDismissedId(fragmentId);
}
