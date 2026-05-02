export type TimeOfDayKey =
  | 'capture.morning'
  | 'capture.afternoon'
  | 'capture.evening'
  | 'capture.night';

export function getTimeOfDayKey(hour: number): TimeOfDayKey {
  if (hour >= 5  && hour <= 11) return 'capture.morning';
  if (hour >= 12 && hour <= 17) return 'capture.afternoon';
  if (hour >= 18 && hour <= 21) return 'capture.evening';
  return 'capture.night';
}
