/**
 * The words `DateSet` (`packages/ui`) says on its own — the holiday calendar of `SCR-M07-06`: its
 * name, its list's overline, its add and empty lines (the `label`, `listLabel`, `addLabel` and
 * `emptyMessage` it takes), and in `dateSetWords` its announcements, its rows' origin words and the
 * floor a pack date carries.
 */
import type { Translator } from '../runtime';
import { PRICE_BOOK } from './price-book';

export const DATE_SET = {
  label: /*i18n*/ { id: 'Holiday calendar' },
  listLabel: /*i18n*/ { id: 'Holidays this year' },
  addLabel: /*i18n*/ { id: 'Tap a date to add a holiday' },
  emptyMessage: /*i18n*/ { id: 'No holidays yet. Tap a date to add one.' },
  holiday: /*i18n*/ { id: 'Holiday' },
  added: /*i18n*/ { id: '{date} added.' },
  removed: /*i18n*/ { id: '{name} removed.' },
  supplied: /*i18n*/ { id: '{date} is supplied by the {pack} and cannot be removed.' },
  floorName: /*i18n*/ { id: 'Market calling window' },
  narrowerOnly: /*i18n*/ { id: '{pack} · narrower only, never wider' },
  anyHoliday: /*i18n*/ { id: 'A market holiday' },
  namedHoliday: /*i18n*/ { id: '“{name}”' },
  refusal: /*i18n*/ {
    id: "{pack} supplies this date. The calling window can be narrowed, never widened — so a market holiday is not the tenant's to remove.",
  },
  addedByYou: /*i18n*/ { id: 'Added by you' },
  marketHoliday: /*i18n*/ { id: 'Market holiday' },
  tenantHoliday: /*i18n*/ { id: 'Tenant holiday' },
} as const;

/** Every word `DateSet` says on its own beyond its four lines, in the reader's language. */
export function dateSetWords(t: Translator['t']) {
  return {
    holiday: t(DATE_SET.holiday),
    added: (date: string) => t(DATE_SET.added, { date }),
    removed: (name: string) => t(DATE_SET.removed, { name }),
    supplied: (date: string, pack: string) => t(DATE_SET.supplied, { date, pack }),
    floorName: t(DATE_SET.floorName),
    narrowerOnly: (pack: string) => t(DATE_SET.narrowerOnly, { pack }),
    anyHoliday: t(DATE_SET.anyHoliday),
    namedHoliday: (name: string) => t(DATE_SET.namedHoliday, { name }),
    refusal: (pack: string) => t(DATE_SET.refusal, { pack }),
    addedByYou: t(DATE_SET.addedByYou),
    marketHoliday: t(DATE_SET.marketHoliday),
    tenantHoliday: t(DATE_SET.tenantHoliday),
    remove: (name: string) => t(PRICE_BOOK.removeRate, { name }),
  };
}
