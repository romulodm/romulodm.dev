/*
 * Resume dates are stored as localized display strings ("Janeiro de 2025",
 * "March 2024", "Atualmente", "Present"). This module turns a start/end pair
 * into a whole-month duration without changing that data format.
 */

const MONTHS: Record<string, number> = {
  // Portuguese, accents stripped by normalize() below.
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  // English.
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

const ONGOING = new Set(['atualmente', 'presente', 'present', 'current', 'now']);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Month index since year 0 (year * 12 + month), or null when unparseable. */
function toMonthIndex(value: string, now: Date): number | null {
  const text = normalize(value);
  if (ONGOING.has(text)) return now.getFullYear() * 12 + now.getMonth();

  const year = text.match(/\d{4}/)?.[0];
  const month = text.split(/[^a-z]+/).find((word) => word in MONTHS);
  if (!year || month === undefined) return null;

  return Number(year) * 12 + MONTHS[month];
}

export interface Duration {
  years: number;
  months: number;
}

/**
 * Plain month difference between start and end, so January 2025 to September
 * 2026 is 1 year 8 months. A role that starts and ends in the same month counts
 * as one month rather than zero. Returns null if either date is unparseable, so
 * callers can simply omit the label.
 */
export function getDuration(start: string, end: string, now: Date = new Date()): Duration | null {
  const from = toMonthIndex(start, now);
  const to = toMonthIndex(end, now);
  if (from === null || to === null || to < from) return null;

  const total = Math.max(1, to - from);
  return { years: Math.floor(total / 12), months: total % 12 };
}
