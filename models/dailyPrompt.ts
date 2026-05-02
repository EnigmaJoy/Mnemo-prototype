import { MS_PER_DAY } from './resurfacing';

export function pickPromptIndexForMoment(now: Date, promptCount: number): number {
  if (promptCount <= 0) return 0;
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / MS_PER_DAY);
  return (dayOfYear * 7 + now.getHours()) % promptCount;
}
