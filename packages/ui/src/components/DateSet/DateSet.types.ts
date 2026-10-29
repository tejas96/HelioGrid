import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type {
  ComplianceFloorSpec,
  ComplianceFloorWords,
} from '../ComplianceFloor/ComplianceFloor.types';
import type { CalendarWords, ISODate, MarketFormat } from '../DatePicker/DatePicker.types';

/** Where the date came from. **Data, not a display choice** — `F1-48` supplies the pack half. */
export type DateOrigin = 'pack' | 'tenant';

export interface DateSetEntry {
  date: ISODate;
  /** "Diwali", "Gudi Padwa", "Founder's day" — the holiday's name, not a tooltip. */
  name?: string;
  origin: DateOrigin;
  /** Tenant rows only — "Added by Priya Menon, 12 Feb 2026". Rendered after the origin word. */
  addedBy?: TranslatedText;
}

/** What the set says on its own: its announcements, its rows' origin words and the pack's floor. */
export interface DateSetWords {
  /** A date's marker in the grid when it has no name ("Holiday"). */
  holiday: TranslatedText;
  /** Announced as a date is added — "{date} added.". */
  added: (date: string) => TranslatedText;
  /** Announced as a date or a named holiday is removed — "{name} removed.". */
  removed: (name: string) => TranslatedText;
  /** Announced as a pack date's removal is refused in the grid. */
  supplied: (date: string, pack: string) => TranslatedText;
  /** The floor a pack date carries, named ("Market calling window"). */
  floorName: TranslatedText;
  /** Where that floor comes from — "{pack} · narrower only, never wider". */
  narrowerOnly: (pack: string) => TranslatedText;
  /** The refusal's subject for a date with no name ("A market holiday"). */
  anyHoliday: TranslatedText;
  /** The refusal's subject for a named holiday — "“{name}”". */
  namedHoliday: (name: string) => TranslatedText;
  /** The refusal's second sentence: who supplies the date and why it stays. */
  refusal: (pack: string) => TranslatedText;
  /** A tenant row's layer ("Added by you"). */
  addedByYou: TranslatedText;
  /** A pack row's source ("Market holiday"). */
  marketHoliday: TranslatedText;
  /** A tenant row's source when nobody is named ("Tenant holiday"). */
  tenantHoliday: TranslatedText;
  /** A tenant row's delete — "Remove {name}". */
  remove: (name: string) => TranslatedText;
}

/** The published answer to this component's own breakpoint (law 4). */
export interface DateSetForm {
  stacked: boolean;
  width: number;
}

export interface DateSetProps {
  entries: DateSetEntry[];
  /** A date was added. Only ever a tenant addition — `M07-12` permits extra holidays, not fewer. */
  onAdd?: (date: ISODate) => void;
  /** A **tenant** date was removed. A pack date never reaches this. */
  onRemove?: (date: ISODate) => void;
  /** The pack's name in the owner's words — "India market pack". Required: a pack date names it. */
  packName: string;
  /** The floor a pack-supplied date carries. Composed from `packName` when not given. */
  floor?: ComplianceFloorSpec;
  /** The set's name, spoken as its region's ("Holiday calendar"). */
  label: TranslatedText;
  /** The overline above the list ("Holidays this year"). */
  listLabel: TranslatedText;
  /** The line under the grid ("Tap a date to add a holiday"). */
  addLabel: TranslatedText;
  /** The list with no dates ("No holidays yet. Tap a date to add one."). */
  emptyMessage: TranslatedText;
  /** Its announcements, its rows' words and its floor's — `dateSetWords(t)`. */
  words: DateSetWords;
  /** The sentences of the floor it composes when `floor` is not given. */
  floorWords: ComplianceFloorWords;
  /** The grid's own words — its month arrows and its days' names. */
  calendarWords: CalendarWords;
  min?: ISODate;
  max?: ISODate;
  /**
   * The visible month. **Pass `onMonthChange` with it** — a pinned month draws no month arrows,
   * since arrows that write to state the view ignores are controls that lie.
   */
  month?: ISODate;
  onMonthChange?: (month: ISODate) => void;
  /**
   * The 640px breakpoint this component owns, published (law 4) — `{stacked, width}`, the same
   * callback shape `Kanban`, `DataTable` and `SheetActions` use.
   */
  onFormChange?: (form: DateSetForm) => void;
  density?: 'expressive' | 'functional';
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface DateSetRowProps {
  entry: DateSetEntry;
  mkt: MarketFormat;
  packName: string;
  floor: ComplianceFloorSpec | undefined;
  words: DateSetWords;
  floorWords: ComplianceFloorWords;
  /** True while this row's removal is the one that was just refused. */
  blocked: boolean;
  density: 'expressive' | 'functional';
  onRemove?: (date: string, spokenName: string) => void;
  /** Where focus lands once a removed date has taken its row away — the list it sat in. */
  focusAfter: FocusAfter;
}
