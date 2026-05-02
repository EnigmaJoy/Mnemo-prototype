'use client';

import { useTranslation } from 'react-i18next';
import Logo from '@/components/Logo';
import {
  groupFragmentsForPrint,
  type Fragment,
  type WeekGroup,
} from '@/models/fragment';

interface Props {
  fragments: Fragment[];
  exportedAt: Date;
}

function formatExportDateTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function formatYear(year: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(
    new Date(year, 0, 1),
  );
}

function formatMonth(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
}

function formatDay(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function formatTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatWeekRange(week: WeekGroup, locale: string): string {
  const sameMonth = week.weekStart.getMonth() === week.weekEnd.getMonth();
  const startFmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    ...(sameMonth ? {} : { month: 'short' }),
  });
  const endFmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  });
  return `${startFmt.format(week.weekStart)} – ${endFmt.format(week.weekEnd)}`;
}

export default function ArchivePrintView({ fragments, exportedAt }: Props) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language;
  const years = groupFragmentsForPrint(fragments);

  return (
    <div className="hidden print:block print-archive">
      <header className="print-header">
        <div className="flex items-center gap-3 mb-2">
          <Logo />
          <span className="font-cormorant italic text-3xl text-mnemo-ink">
            Mnemo
          </span>
        </div>
        <p className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-secondary">
          {t('archive.title')} · {formatExportDateTime(exportedAt, locale)}
        </p>
      </header>

      {years.map((yearGroup) => (
        <section key={yearGroup.year} className="print-year">
          <h1 className="font-cormorant font-light text-4xl text-mnemo-ink mb-6 mt-8">
            {formatYear(yearGroup.year, locale)}
          </h1>

          {yearGroup.months.map((monthGroup) => (
            <div key={monthGroup.monthDate.getTime()} className="print-month">
              <h2 className="font-dm-mono text-[11px] uppercase tracking-[0.18em] text-mnemo-ink-secondary mb-4 mt-6">
                {formatMonth(monthGroup.monthDate, locale)}
              </h2>

              {monthGroup.weeks.map((week) => (
                <div key={week.weekStart.getTime()} className="print-week">
                  <h3 className="font-dm-mono text-[10px] uppercase tracking-[0.16em] text-mnemo-ink-tertiary mb-3 mt-4">
                    {formatWeekRange(week, locale)}
                  </h3>

                  {week.days.map((day) => (
                    <div key={day.dayDate.getTime()} className="print-day">
                      <h4 className="font-dm-sans text-sm text-mnemo-ink-secondary mb-2 mt-3">
                        {formatDay(day.dayDate, locale)}
                      </h4>

                      <ul className="print-fragments space-y-3">
                        {day.items.map((fragment) => (
                          <li key={fragment.id} className="print-fragment">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-dm-mono text-[9px] uppercase tracking-[0.16em] text-mnemo-ink-tertiary tabular-nums">
                                {formatTime(fragment.createdAt, locale)}
                              </span>
                              {fragment.type === 'audio' && (
                                <span className="font-dm-mono text-[8px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary border border-mnemo-border rounded-full px-2">
                                  {t('fragmentItem.audioBadge')}
                                </span>
                              )}
                            </div>
                            <p className="font-cormorant italic text-mnemo-ink leading-relaxed text-base whitespace-pre-wrap">
                              {fragment.content}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}

      <footer className="print-footer">
        <Logo />
      </footer>
    </div>
  );
}
