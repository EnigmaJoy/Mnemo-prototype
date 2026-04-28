export interface Fragment {
  id: string;        // uuid v4 - generated via crypto.randomUUID()
  content: string;   // text fragment OR transcript of an audio fragment (max 2000 chars)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  type?: 'text' | 'audio'; // missing/'text' = legacy text fragment
  audioId?: string;  // IndexedDB key of the recorded blob, when type === 'audio'
}

export interface Resurface {
  fragmentId: string;
  shownAt: string;   // ISO 8601 - when the resurfacing detail was opened
  reaction: 'still_true' | 'changed' | 'archived' | null;
  triggerType: 'day_7' | 'day_14' | 'day_30';
}

export interface ResurfacingCandidate {
  fragment: Fragment;
  triggerType: Resurface['triggerType'];
}
