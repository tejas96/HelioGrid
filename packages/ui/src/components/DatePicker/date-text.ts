import type { TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import { asRange, asSet, parse } from './calendar-grid';
import type {
  CalendarValue,
  CalendarWords,
  DatePickerProps,
  DatePickerWords,
  DayMarker,
  ISODate,
} from './DatePicker.types';

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

/** What the picker's trigger shows: the active market's date, never a hand-spelled order. */
export function triggerText(
  mode: DatePickerProps['mode'],
  value: CalendarValue | undefined,
  mkt: MarketFormat,
  words: Pick<DatePickerWords, 'datesChosen'>,
): string {
  if (mode === 'range') {
    const range = asRange(value);
    if (range.from === null) {
      return '';
    }
    return `${mkt.date(range.from)} – ${range.to === null ? '…' : mkt.date(range.to)}`;
  }
  if (mode === 'set') {
    const set = asSet(value);
    return set.length === 0 ? '' : words.datesChosen(set.length);
  }
  const single = parse(typeof value === 'string' ? value : null);
  return single === null ? '' : mkt.date(single);
}

/** A day's whole fact as one accessible name — a marker's label is read out with its date. */
export function spokenDayOf(
  words: Pick<CalendarWords, 'day'>,
  spokenDate: string,
  marker: DayMarker | undefined,
  locked: boolean,
): TranslatedText {
  return words.day({ date: spokenDate, marker: marker?.label ?? null, locked });
}
