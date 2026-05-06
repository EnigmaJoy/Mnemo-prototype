'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Fragment } from '@/models/fragment';
import {
  SENTIMENT_CODES,
  dominantSentiment,
  type SentimentCode,
} from '@/lib/sentiment';
import { DEFAULT_PALETTE, type Palette } from '@/lib/palette';

interface SentimentGridProps {
  fragments: Fragment[];
  palette?: Palette;
}

const DAYS_PER_WEEK = 7;
const EMPTY_CELL_COLOR = 'rgba(0, 0, 0, 0.06)';
const OUT_OF_MONTH_OPACITY = 0.35;

interface DaySummary {
  count: number;
  dominant: SentimentCode;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMondayWeek(d: Date): Date {
  const day = startOfDay(d);
  const weekday = day.getDay();
  const offsetToMonday = weekday === 0 ? -6 : 1 - weekday;
  day.setDate(day.getDate() + offsetToMonday);
  return day;
}

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function opacityForCount(count: number): number {
  if (count >= 8) return 1;
  if (count >= 4) return 0.8;
  if (count >= 3) return 0.55;
  if (count >= 1) return 0.3;
  return 0;
}

function tryFormatter(
  language: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(language, options);
  } catch {
    return new Intl.DateTimeFormat(undefined, options);
  }
}

export default function SentimentGrid({ fragments, palette }: SentimentGridProps) {
  const { t, i18n } = useTranslation();
  const colors = palette ?? DEFAULT_PALETTE;

  const { cells, weekdayLabels, monthLabel, weeks, dateFormatter, currentMonth } =
    useMemo(() => {
      const codesByDay = new Map<string, SentimentCode[]>();
      for (const fragment of fragments) {
        const created = new Date(fragment.createdAt);
        if (Number.isNaN(created.getTime())) continue;
        const key = dayKey(created);
        const code: SentimentCode = fragment.sentimentCode ?? 'neutral';
        const list = codesByDay.get(key);
        if (list) list.push(code);
        else codesByDay.set(key, [code]);
      }

      const summaries = new Map<string, DaySummary>();
      for (const [key, codes] of codesByDay) {
        summaries.set(key, {
          count: codes.length,
          dominant: dominantSentiment(codes),
        });
      }

      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);

      const start = startOfMondayWeek(firstOfMonth);
      const lastWeekStart = startOfMondayWeek(lastOfMonth);
      const weekCount =
        Math.round((lastWeekStart.getTime() - start.getTime()) / (7 * 86400000)) + 1;

      const built: Array<{
        key: string;
        date: Date;
        inMonth: boolean;
        summary?: DaySummary;
      }> = [];
      for (let week = 0; week < weekCount; week += 1) {
        for (let weekday = 0; weekday < DAYS_PER_WEEK; weekday += 1) {
          const date = new Date(start);
          date.setDate(start.getDate() + week * DAYS_PER_WEEK + weekday);
          const key = dayKey(date);
          built.push({
            key,
            date,
            inMonth: date.getMonth() === month,
            summary: summaries.get(key),
          });
        }
      }

      const weekdayFmt = tryFormatter(i18n.language, { weekday: 'narrow' });
      const labels: string[] = [];
      const refMonday = startOfMondayWeek(today);
      for (let i = 0; i < DAYS_PER_WEEK; i += 1) {
        const d = new Date(refMonday);
        d.setDate(refMonday.getDate() + i);
        labels.push(weekdayFmt.format(d).toUpperCase());
      }

      const monthFmt = tryFormatter(i18n.language, { month: 'long' });
      const firstDate = built[0]?.date ?? firstOfMonth;
      const lastDate = built[built.length - 1]?.date ?? lastOfMonth;
      const startMonthName = monthFmt.format(firstDate);
      const currentMonthName = monthFmt.format(firstOfMonth);
      const endMonthName = monthFmt.format(lastDate);

      let label = currentMonthName;
      if (firstDate.getMonth() !== month && lastDate.getMonth() !== month) {
        label = `${startMonthName} · ${currentMonthName} · ${endMonthName}`;
      } else if (firstDate.getMonth() !== month) {
        label = `${startMonthName} · ${currentMonthName}`;
      } else if (lastDate.getMonth() !== month) {
        label = `${currentMonthName} · ${endMonthName}`;
      }

      const dateFmt = tryFormatter(i18n.language, {
        day: 'numeric',
        month: 'short',
      });

      return {
        cells: built,
        weekdayLabels: labels,
        monthLabel: label,
        weeks: weekCount,
        dateFormatter: dateFmt,
        currentMonth: currentMonthName,
      };
    }, [fragments, i18n.language]);

  return (
    <section className="mb-8" aria-label={t('sentimentGrid.label')}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-dm-mono text-[10px] uppercase tracking-[0.18em] text-mnemo-ink-tertiary">
          {t('sentimentGrid.label')}
        </span>
        <span
          className="font-cormorant italic text-mnemo-ink text-base"
          title={currentMonth}
        >
          {monthLabel}
        </span>
      </div>

      <div
        className="flex items-start gap-2"
        role="presentation"
      >
        <div
          className="grid font-dm-mono text-[9px] text-mnemo-ink-tertiary"
          style={{
            gridTemplateRows: `repeat(${DAYS_PER_WEEK}, clamp(14px, 4.5vw, 18px))`,
            gap: '3px',
          }}
          aria-hidden="true"
        >
          {weekdayLabels.map((label, i) => (
            <span
              key={i}
              className="flex items-center justify-center"
              style={{ width: 14 }}
            >
              {label}
            </span>
          ))}
        </div>

        <div
          className="grid"
          style={{
            gridTemplateRows: `repeat(${DAYS_PER_WEEK}, clamp(14px, 4.5vw, 18px))`,
            gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`,
            gridAutoFlow: 'column',
            gap: '3px',
            flex: 1,
          }}
          role="presentation"
        >
          {cells.map(({ key, date, inMonth, summary }) => {
            const dateLabel = dateFormatter.format(date);
            if (!summary) {
              return (
                <div
                  key={key}
                  title={dateLabel}
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 'clamp(14px, 4.5vw, 18px)',
                    borderRadius: 3,
                    backgroundColor: EMPTY_CELL_COLOR,
                    opacity: inMonth ? 1 : OUT_OF_MONTH_OPACITY,
                  }}
                />
              );
            }
            const color = colors[summary.dominant];
            const opacity =
              opacityForCount(summary.count) * (inMonth ? 1 : OUT_OF_MONTH_OPACITY);
            const countLabel = t('sentimentGrid.tooltipCount', {
              count: summary.count,
            });
            return (
              <div
                key={key}
                tabIndex={0}
                title={`${dateLabel} · ${countLabel}`}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 'clamp(14px, 4.5vw, 18px)',
                  borderRadius: 3,
                  backgroundColor: color,
                  opacity,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center gap-2 overflow-x-auto">
        {SENTIMENT_CODES.map((code) => (
          <div key={code} className="flex items-center gap-1.5 flex-shrink-0">
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: colors[code],
                display: 'inline-block',
              }}
            />
            <span className="font-dm-mono text-[9px] text-mnemo-ink-tertiary">
              {t(`sentimentGrid.sentiments.${code}`)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
