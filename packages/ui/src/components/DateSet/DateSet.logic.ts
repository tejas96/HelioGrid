import type { TranslatedText } from '@heliogrid/contracts';
import { weekdayOf } from '../DatePicker/calendar-grid';
import type { DayMarker, ISODate } from '../DatePicker/DatePicker.types';
import type { ValueSourceSpec } from '../ValueSource/ValueSource.types';
import type { DateSetEntry, DateSetRowProps } from './DateSet.types';

/** At or above this much of its own width the set lays the calendar and the list side by side. */
export const DATE_SET_WIDE_AT = 640;

/** The set as both halves draw it: its dates in order, which the pack supplied, and their marks. */
export interface DateSetView {
  sorted: DateSetEntry[];
  dates: ISODate[];
  /** The pack's dates — the calendar refuses to take them away. */
  locked: ISODate[];
  byDate: Map<ISODate, DateSetEntry>;
  /** Every date is marked a holiday on the calendar, by its own name or the generic word. */
  markers: Record<string, DayMarker>;
}

export function dateSetView(entries: DateSetEntry[], holiday: TranslatedText): DateSetView {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    sorted,
    dates: sorted.map((e) => e.date),
    locked: sorted.filter((e) => e.origin === 'pack').map((e) => e.date),
    byDate: new Map(sorted.map((e) => [e.date, e])),
    markers: Object.fromEntries(
      sorted.map((e) => [e.date, { tone: 'holiday' as const, label: e.name ?? holiday }]),
    ),
  };
}

/** One row read once for both platforms. */
export interface DateRowReading {
  date: string;
  weekday: string;
  /** A pack-supplied date: it carries the floor where a tenant's own carries the delete. */
  pack: boolean;
  /** What the row is called aloud — its holiday's name, or its date. */
  spoken: string;
  /** Origin as persistent content: `inherited` · the pack against `own` · "Added by you". */
  origin: Pick<ValueSourceSpec, 'level' | 'layerName' | 'source'>;
  /** Only a tenant's own date can be removed, and only when the caller takes removals. */
  remove: (() => void) | null;
}

export function dateRowReading({
  entry,
  mkt,
  packName,
  words,
  onRemove,
}: Pick<DateSetRowProps, 'entry' | 'mkt' | 'packName' | 'words' | 'onRemove'>): DateRowReading {
  const day = new Date(`${entry.date}T00:00:00`);
  const pack = entry.origin === 'pack';
  const spoken = entry.name ?? mkt.date(day);
  return {
    date: mkt.date(day),
    weekday: weekdayOf(day, mkt.weekdayNames('long'), mkt.firstDayOfWeek),
    pack,
    spoken,
    origin: {
      level: pack ? 'inherited' : 'own',
      layerName: pack ? packName : words.addedByYou,
      source: pack ? words.marketHoliday : (entry.addedBy ?? words.tenantHoliday),
    },
    remove: !pack && onRemove !== undefined ? () => onRemove(entry.date, spoken) : null,
  };
}
