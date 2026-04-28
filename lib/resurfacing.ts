// lib/resurfacing.ts
import type { Fragment, Resurface, ResurfacingCandidate } from './types';

const MS_PER_DAY = 86_400_000;

const TRIGGER_WINDOWS: ReadonlyArray<{
  type: Resurface['triggerType'];
  min: number;
  max: number;
}> = [
  { type: 'day_7',  min: 6,  max: 8  },
  { type: 'day_14', min: 13, max: 15 },
  { type: 'day_30', min: 29, max: 31 },
];

export function daysSince(createdAt: string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - Date.parse(createdAt)) / MS_PER_DAY);
}

export function getTriggerType(days: number): Resurface['triggerType'] | null {
  for (const w of TRIGGER_WINDOWS) {
    if (days >= w.min && days <= w.max) return w.type;
  }
  return null;
}

export function hasHadFirstResurfacing(history: Resurface[]): boolean {
  return history.some((r) => r.shownAt !== null);
}

/**
 * Selects at most one fragment to resurface. Pure — caller supplies inputs.
 * Excludes fragments already reacted to (any non-null reaction) and any
 * dismissed via "Not now" this session. Among the rest, picks the most
 * recently created.
 */
export function selectResurfacingCandidate(
  fragments: Fragment[],
  history: Resurface[],
  dismissedIds: string[],
  now: Date = new Date()
): ResurfacingCandidate | null {
  const reactedIds = new Set(
    history.filter(r => r.reaction !== null).map(r => r.fragmentId)
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
