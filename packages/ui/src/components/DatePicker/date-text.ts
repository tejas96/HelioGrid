import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import { parse } from './calendar-grid';
import type { ISODate } from './DatePicker.types';

/**
 * A date as text, for a call site that is NOT inside a component — a static label, a log line.
 *
 * It owns no formatting of its own: it reads the ISO string at local midnight (so a timezone
 * cannot shift it by a day) and hands the Date to a `MarketFormat`. Passing one from
 * `useFormat()` formats with the active market; omitting it uses `IN_FORMAT`, the shipped
 * default. Inside a component, read the hook instead — a screen must not pin itself to India.
 */
export function formatDate(value: ISODate | Date, format?: MarketFormat): string {
  const d = parse(value);
  return d === null ? '' : (format ?? IN_FORMAT).date(d);
}

/** The namespace form the design system declares — `Dates.format("2026-03-12")`. */
export const Dates: { format: typeof formatDate } = { format: formatDate };
