import type { Resurface } from './types';

const TRIGGER_DAYS: Record<Resurface['triggerType'], number> = {
  day_7: 7,
  day_14: 14,
  day_30: 30,
};

export function getTriggerDays(triggerType: Resurface['triggerType']): number {
  return TRIGGER_DAYS[triggerType];
}

export function formatRelativeDays(
  triggerType: Resurface['triggerType'],
  locale: string,
): string {
  const days = TRIGGER_DAYS[triggerType];
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-days, 'day');
}

export function formatShortDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatLongDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatMonthYear(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(d);
}
