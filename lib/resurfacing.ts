// lib/resurfacing.ts
import type { Fragment, Resurface, ResurfacingCandidate } from './types';

export function daysSince(isoDate: string): number {
  const created = Date.parse(isoDate);
  const now     = Date.now();
  return Math.floor((now - created) / 86_400_000);
}

type TriggerWindow = { min: number; max: number; type: Resurface['triggerType'] };

const TRIGGER_WINDOWS: TriggerWindow[] = [
  { min: 6,  max: 8,  type: 'day_7'  },
  { min: 13, max: 15, type: 'day_14' },
  { min: 29, max: 31, type: 'day_30' },
];

function getTriggerTypeForFragment(
  fragment: Fragment
): Resurface['triggerType'] | null {
  const d = daysSince(fragment.createdAt);
  for (const window of TRIGGER_WINDOWS) {
    if (d >= window.min && d <= window.max) return window.type;
  }
  return null;
}

export function getTriggerLabel(triggerType: Resurface['triggerType']): string {
  const labels: Record<Resurface['triggerType'], string> = {
    day_7:  '7 days ago',
    day_14: '14 days ago',
    day_30: '30 days ago',
  };
  return labels[triggerType];
}

export function getResurfacingCandidate(
  fragments: Fragment[],
  history: Resurface[],
  dismissedIds: string[]
): ResurfacingCandidate | null {
  const reactedIds   = new Set(history.filter(r => r.reaction !== null).map(r => r.fragmentId));
  const dismissedSet = new Set(dismissedIds);

  const candidates: ResurfacingCandidate[] = [];

  for (const fragment of fragments) {
    if (reactedIds.has(fragment.id))   continue;
    if (dismissedSet.has(fragment.id)) continue;
    const triggerType = getTriggerTypeForFragment(fragment);
    if (!triggerType) continue;
    candidates.push({ fragment, triggerType });
  }

  if (candidates.length === 0) return null;

  // Most recently created wins
  candidates.sort(
    (a, b) => Date.parse(b.fragment.createdAt) - Date.parse(a.fragment.createdAt)
  );
  return candidates[0];
}
