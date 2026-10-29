/**
 * A `DetailPanel`'s usual state words (`packages/ui`'s `DetailPanel`, and `EditorSurface` as a
 * panel): a panel holds one record, so its failure names the record.
 */
import type { Translator } from '../runtime';
import { CARD } from './card';
import { SHEET } from './sheet';

export const DETAIL_PANEL = {
  couldNotLoadRecord: /*i18n*/ { id: "Couldn't load this record" },
} as const;

/** A read panel's state words, named as `DetailPanel` takes them. */
export function detailPanelWords(t: Translator['t']) {
  return {
    loadingLabel: t(CARD.loading),
    errorTitle: t(DETAIL_PANEL.couldNotLoadRecord),
    errorMessage: t(CARD.keepsFailing),
    emptyTitle: t(SHEET.nothingHereYet),
  };
}
