import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/** "YYYY-MM-DD". */
export type ISODate = string;

export interface DateRange {
  from: ISODate | null;
  to: ISODate | null;
}

/** The value a Calendar holds, whichever mode it is in. */
export type CalendarValue = ISODate | DateRange | ISODate[];

export type CalendarMode = 'single' | 'range' | 'set';

export type DayMarkerTone = 'present' | 'absent' | 'leave' | 'holiday' | 'scheduled' | 'neutral';

export interface DayMarker {
  /** Muted semantic dot under the date. */
  tone?: DayMarkerTone;
  /** Read out with the date by screen readers — the dot's only words, so every marker has them. */
  // biome-ignore lint/plugin/copy-prop-type: the day's own name — a holiday as its pack or the company names it
  label: string;
}

/** A day's accessible name: its date as the market writes it, its marker's words, and its lock. */
export interface CalendarDayFacts {
  readonly date: string;
  readonly marker: string | null;
  readonly locked: boolean;
}

/**
 * Every word the calendar says on its own, in the reader's language (`packages/i18n`'s
 * `calendarWords`). Required: the calendar holds no word of its own.
 */
export interface CalendarWords {
  /** The month arrows — *Previous month*, *Next month*. */
  previousMonth: TranslatedText;
  nextMonth: TranslatedText;
  /** The grid's name while it loads — *Loading*. */
  loading: TranslatedText;
  /** The grid's line for an empty month when the caller words none — *No records for this month.* */
  noRecords: TranslatedText;
  /** A day's accessible name — *12 Mar 2026, Holi, supplied by the market pack, cannot be removed*. */
  day: (facts: CalendarDayFacts) => TranslatedText;
}

/** The picker's words: the calendar's, and the field's own two. */
export interface DatePickerWords extends CalendarWords {
  /** The field while no date is chosen — *Select a date*. */
  selectDate: TranslatedText;
  /** The popover's name when the field has no `label` — *Choose a date*. */
  chooseDate: TranslatedText;
  /** The field of a set of dates — *3 dates*. */
  datesChosen(count: number): TranslatedText;
}

/** A calendar's own three, **not** `SurfaceState`: this is a control, not a surface. */
export type CalendarState = 'ready' | 'loading' | 'empty';

export type CalendarDensity = 'expressive' | 'functional';

/**
 * The market facts a date is made of — `date`, `monthYear`, `firstDayOfWeek`, `monthNames`,
 * `weekdayNames` — are `utils/format`'s, reached through `MarketProvider`'s `useFormat()`. This
 * folder declared its own copy of that contract while no provider existed; it is re-exported here
 * so the calendar's own files keep one import, but there is only ONE declaration.
 *
 * A screen never supplies the week start as a prop — supply a pack to `MarketProvider`.
 */
export type { MarketFormat } from '../../utils/format';

export interface CalendarProps {
  /** Every word the calendar says on its own — see `CalendarWords`. */
  words: CalendarWords;
  /** `single` — one ISO date. `range` — a span. `set` — **an array of unrelated dates**. */
  value?: CalendarValue;
  onChange?: (value: CalendarValue) => void;
  /**
   * `set` is `SCR-M07-06`'s holiday calendar: a bag of dates with nothing between them, which
   * `single` and `range` cannot hold and `markers` could only *display*. Clicking a date toggles it;
   * `onChange` receives the whole sorted array.
   */
  mode?: CalendarMode;
  /**
   * Controlled visible month (any date inside it). **Pass `onMonthChange` with it.** A `month` with
   * no handler is a *pinned* view: the arrows would write to state the view ignores, so they are not
   * drawn at all (and a console warning says so). Pass both, or neither.
   */
  month?: ISODate;
  onMonthChange?: (month: ISODate) => void;
  min?: ISODate;
  max?: ISODate;
  /**
   * Keyed by ISO date: attendance, leave, holidays, scheduled surveys. **Display only** — a marker
   * cannot be added to or removed from, and its `label` is a tooltip, which `F8-07` rules out for
   * provenance. A set the tenant edits is `mode="set"`.
   */
  markers?: Record<string, DayMarker>;
  disabledDates?: ISODate[];
  /**
   * `mode="set"` only — members of the set the tenant may **not** remove (`M07-12`). The cell is
   * `aria-disabled` and **stays focusable** with activation suppressed, so a keyboard user reaches it
   * and hears why. Its second channel in the grid is a bar under the numeral; the **origin itself is
   * persistent content in `DateSet`'s list**, never a tone and never a tooltip.
   */
  lockedDates?: ISODate[];
  /** `mode="set"` only — a locked date was activated. The caller renders the floor in words. */
  onBlocked?: (date: ISODate) => void;
  density?: CalendarDensity;
  state?: CalendarState;
  /** Overrides `words.noRecords`. */
  emptyMessage?: TranslatedText;
  footer?: ReactNode;
}

export interface DatePickerProps
  extends Omit<
    CalendarProps,
    'words' | 'state' | 'emptyMessage' | 'footer' | 'month' | 'onMonthChange'
  > {
  /** Every word the picker says on its own — see `DatePickerWords`. */
  words: DatePickerWords;
  label?: TranslatedText;
  /** Overrides `words.selectDate`. */
  placeholder?: TranslatedText;
  disabled?: boolean;
  helper?: TranslatedText;
  error?: TranslatedText;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface CalendarCellProps {
  date: Date;
  selected: boolean;
  between: boolean;
  disabled: boolean;
  locked: boolean;
  today: boolean;
  marker: DayMarker | undefined;
  spokenDate: string;
  onPick: (d: Date) => void;
  words: Pick<CalendarWords, 'day'>;
}
