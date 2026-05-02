const PROMPT_STORAGE_KEY = 'mnemo_capture_prompt';

export function setPromptOverride(prompt: string): void {
  try {
    sessionStorage.setItem(PROMPT_STORAGE_KEY, prompt);
  } catch {
    /* sessionStorage unavailable; capture page falls back to its default placeholder */
  }
}

export function consumePromptOverride(): string | null {
  try {
    const stored = sessionStorage.getItem(PROMPT_STORAGE_KEY);
    if (!stored) return null;
    sessionStorage.removeItem(PROMPT_STORAGE_KEY);
    return stored;
  } catch {
    return null;
  }
}
