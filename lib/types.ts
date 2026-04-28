export interface Fragment {
  id: string;        // uuid v4 — generated via crypto.randomUUID()
  content: string;   // the text (max 2000 chars)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Resurface {
  fragmentId: string;
  shownAt: string;   // ISO 8601 — when the resurfacing detail was opened
  reaction: 'still_true' | 'changed' | 'archived' | null;
  triggerType: 'day_7' | 'day_14' | 'day_30';
}

export interface ResurfacingCandidate {
  fragment: Fragment;
  triggerType: Resurface['triggerType'];
}
