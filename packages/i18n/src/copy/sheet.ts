/**
 * A `Sheet`'s usual state words (`packages/ui`'s `Sheet`, and `EditorSurface` as a sheet): what its
 * loading speaks, and what its failed and empty bodies say. A sheet draws each only in its state,
 * so a caller passes these with the read they belong to — never an English default in the sheet.
 */
import type { Translator } from '../runtime';
import { CARD } from './card';
import { DATA_TABLE } from './data-table';

export const SHEET = {
  nothingHereYet: DATA_TABLE.emptyTitle,
} as const;

/** A read sheet's state words, named as `Sheet` takes them. */
export function sheetWords(t: Translator['t']) {
  return {
    loadingLabel: t(CARD.loading),
    errorTitle: t(CARD.couldNotLoad),
    errorMessage: t(CARD.keepsFailing),
    emptyTitle: t(SHEET.nothingHereYet),
  };
}
