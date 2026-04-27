export interface Fragment {
  id: string;        // crypto.randomUUID()
  content: string;   // max 2000 chars
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Resurface {
  fragmentId: string;
  shownAt: string;   // ISO 8601 — set when detail screen is first opened
  reaction: 'still_true' | 'changed' | 'archived' | null;
  triggerType: 'day_7' | 'day_14' | 'day_30';
}

export interface ResurfacingCandidate {
  fragment: Fragment;
  triggerType: Resurface['triggerType'];
}
