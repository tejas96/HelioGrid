/**
 * `Calendar`'s and `DatePicker`'s own words (`packages/ui`'s `CalendarWords` and
 * `DatePickerWords`): the month arrows, the loading grid's name, an empty month's line, a day's
 * accessible name with its marker and its lock, and the field's empty words and popover name —
 * authored once for both platforms. A date arrives as the market writes it.
 */
import type { Translator } from '../runtime';
import { assembled } from './assembled';

const CALENDAR = {
  previousMonth: /*i18n*/ { id: 'Previous month' },
  nextMonth: /*i18n*/ { id: 'Next month' },
  loading: /*i18n*/ { id: 'Loading' },
  noRecords: /*i18n*/ { id: 'No records for this month.' },
  dayMarked: /*i18n*/ { id: '{date}, {marker}' },
  dayLocked: /*i18n*/ { id: '{date}, supplied by the market pack, cannot be removed' },
  dayMarkedLocked: /*i18n*/ {
    id: '{date}, {marker}, supplied by the market pack, cannot be removed',
  },
} as const;

const DATE_PICKER = {
  selectDate: /*i18n*/ { id: 'Select a date' },
  chooseDate: /*i18n*/ { id: 'Choose a date' },
  datesChosen: /*i18n*/ { id: '{count, plural, one {# date} other {# dates}}' },
} as const;

interface DayFacts {
  readonly date: string;
  readonly marker: string | null;
  readonly locked: boolean;
}

/** Every word `Calendar` says on its own, in the reader's language — its `words` prop. */
export function calendarWords(t: Translator['t']) {
  return {
    previousMonth: t(CALENDAR.previousMonth),
    nextMonth: t(CALENDAR.nextMonth),
    loading: t(CALENDAR.loading),
    noRecords: t(CALENDAR.noRecords),
    /** A day with neither a marker nor a lock is named by its date alone, as the market writes it. */
    day: (facts: DayFacts) => {
      if (facts.marker === null) {
        return facts.locked ? t(CALENDAR.dayLocked, { date: facts.date }) : assembled(facts.date);
      }
      return t(facts.locked ? CALENDAR.dayMarkedLocked : CALENDAR.dayMarked, { ...facts });
    },
  };
}

/** Every word `DatePicker` says on its own — its `words` prop, its calendar's words within. */
export function datePickerWords(t: Translator['t']) {
  return {
    ...calendarWords(t),
    selectDate: t(DATE_PICKER.selectDate),
    chooseDate: t(DATE_PICKER.chooseDate),
    datesChosen: (count: number) => t(DATE_PICKER.datesChosen, { count }),
  };
}
