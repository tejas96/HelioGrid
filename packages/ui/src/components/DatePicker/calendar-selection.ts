import { asRange, asSet, iso, parse } from './calendar-grid';
import type { CalendarMode, CalendarProps, CalendarValue, ISODate } from './DatePicker.types';

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

/** What a calendar's days are measured against — its mode, its value, its bounds and its lists. */
export interface CalendarRules {
  mode: CalendarMode;
  value: CalendarValue | undefined;
  min: ISODate | undefined;
  max: ISODate | undefined;
  disabledDates: ISODate[];
  lockedDates: ISODate[];
}

/** A set's locked member: it stays pressable and answers instead of toggling. */
export function isLockedDate(rules: CalendarRules, d: Date): boolean {
  return rules.mode === 'set' && rules.lockedDates.includes(iso(d));
}

export interface DayState {
  selected: boolean;
  between: boolean;
  disabled: boolean;
  locked: boolean;
  today: boolean;
}

/** One day's standing in the grid. */
export function dayStateOf(rules: CalendarRules, d: Date, todayIso: ISODate): DayState {
  return {
    selected: isSelected(rules.mode, rules.value, d),
    between: inRange(rules.mode, rules.value, d),
    disabled: isDisabledDate(d, rules.min, rules.max, rules.disabledDates),
    locked: isLockedDate(rules, d),
    today: iso(d) === todayIso,
  };
}

/** What pressing a day does: nothing outside the bounds, the caller's answer on a locked day, else the next value. */
export function dayPicker(
  rules: CalendarRules,
  onChange: CalendarProps['onChange'],
  onBlocked: CalendarProps['onBlocked'],
): (d: Date) => void {
  return (d) => {
    if (isDisabledDate(d, rules.min, rules.max, rules.disabledDates)) {
      return;
    }
    if (isLockedDate(rules, d)) {
      /* A locked date is aria-disabled and focusable, so this is reachable: the attempt is handed to
         the caller, which names the floor. Silently doing nothing would be the tooltip's failure. */
      onBlocked?.(iso(d));
      return;
    }
    onChange?.(nextValue(rules.mode, rules.value, d));
  };
}

/** A pick closes the picker once it is whole: any single date, or a range's second end. */
export function closesPicker(mode: CalendarMode, next: CalendarValue): boolean {
  return (
    mode === 'single' ||
    (mode === 'range' && !Array.isArray(next) && typeof next === 'object' && Boolean(next.to))
  );
}
