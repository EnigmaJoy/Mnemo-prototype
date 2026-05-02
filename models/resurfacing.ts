import type { Fragment } from './fragment';

export interface Resurface {
  fragmentId: string;
  shownAt: string;
  reaction: 'still_true' | 'changed' | 'archived' | null;
  triggerType: 'day_7' | 'day_14' | 'day_30';
}

export interface ResurfacingCandidate {
  fragment: Fragment;
  triggerType: Resurface['triggerType'];
}

export const MS_PER_DAY = 86_400_000;

export const DAYS_TO_FIRST_RESURFACE = 7;

const TRIGGER_WINDOWS: ReadonlyArray<{
  type: Resurface['triggerType'];
  min: number;
  max: number;
}> = [
  { type: 'day_7',  min: 6,  max: 8  },
  { type: 'day_14', min: 13, max: 15 },
  { type: 'day_30', min: 29, max: 31 },
];

const TRIGGER_DAYS: Record<Resurface['triggerType'], number> = {
  day_7: 7,
  day_14: 14,
  day_30: 30,
};

export function getTriggerDays(triggerType: Resurface['triggerType']): number {
  return TRIGGER_DAYS[triggerType];
}

export function daysSince(createdAt: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(createdAt)) / MS_PER_DAY);
}

export function getTriggerType(days: number): Resurface['triggerType'] | null {
  for (const window of TRIGGER_WINDOWS) {
    if (days >= window.min && days <= window.max) return window.type;
  }
  return null;
}

export function hasHadFirstResurfacing(history: Resurface[]): boolean {
  return history.length > 0;
}

export function isReactedTo(history: Resurface[], fragmentId: string): boolean {
  return history.some((record) =>
    record.fragmentId === fragmentId && record.reaction !== null,
  );
}

export function selectResurfacingCandidate(
  fragments: Fragment[],
  history: Resurface[],
  dismissedIds: string[],
  now: Date = new Date(),
): ResurfacingCandidate | null {
  const reactedIds = new Set(
    history.filter((record) => record.reaction !== null).map((record) => record.fragmentId),
  );
  const dismissedSet = new Set(dismissedIds);

  let best: ResurfacingCandidate | null = null;
  let bestCreatedMs = -Infinity;

  for (const fragment of fragments) {
    if (reactedIds.has(fragment.id)) continue;
    if (dismissedSet.has(fragment.id)) continue;

    const trigger = getTriggerType(daysSince(fragment.createdAt, now));
    if (!trigger) continue;

    const createdMs = Date.parse(fragment.createdAt);
    if (createdMs > bestCreatedMs) {
      best = { fragment, triggerType: trigger };
      bestCreatedMs = createdMs;
    }
  }

  return best;
}
