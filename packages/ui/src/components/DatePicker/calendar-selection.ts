import { asRange, asSet, iso, parse } from './calendar-grid';
import type { CalendarMode, CalendarValue, ISODate } from './DatePicker.types';

/** Is this cell one of the selected dates (either end of a range counts)? */
export function isSelected(mode: CalendarMode, value: CalendarValue | undefined, d: Date): boolean {
  const key = iso(d);
  if (mode === 'set') {
    return asSet(value).includes(key);
  }
  if (mode === 'range') {
    const range = asRange(value);
    const from = parse(range.from);
    const to = parse(range.to);
    return (from !== null && key === iso(from)) || (to !== null && key === iso(to));
  }
  const single = parse(typeof value === 'string' ? value : null);
  return single !== null && key === iso(single);
}

/** Strictly between the two ends of a range — the tinted band, never an end. */
export function inRange(mode: CalendarMode, value: CalendarValue | undefined, d: Date): boolean {
  if (mode !== 'range') {
    return false;
  }
  const range = asRange(value);
  const from = parse(range.from);
  const to = parse(range.to);
  return from !== null && to !== null && d > from && d < to;
}

/**
 * The value a click produces. `set` toggles and hands back the whole SORTED array; `range` opens a
 * new span when there is none or the last one closed, and otherwise closes the open one in whichever
 * order the two dates fall.
 */
export function nextValue(
  mode: CalendarMode,
  value: CalendarValue | undefined,
  d: Date,
): CalendarValue {
  const key = iso(d);
  if (mode === 'set') {
    const set = asSet(value);
    return set.includes(key) ? set.filter((x) => x !== key) : [...set, key].sort();
  }
  if (mode !== 'range') {
    return key;
  }
  const range = asRange(value);
  if (range.from === null || range.to !== null) {
    return { from: key, to: null };
  }
  const from = parse(range.from);
  return from !== null && from <= d ? { from: range.from, to: key } : { from: key, to: range.from };
}

/** Outside min/max, or explicitly disabled. A locked date is NOT disabled — it answers instead. */
export function isDisabledDate(
  d: Date,
  min: ISODate | undefined,
  max: ISODate | undefined,
  disabledDates: ISODate[],
): boolean {
  const minD = parse(min);
  const maxD = parse(max);
  return (
    (minD !== null && d < minD) || (maxD !== null && d > maxD) || disabledDates.includes(iso(d))
  );
}
