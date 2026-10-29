/**
 * `ToastHost`'s own word (`packages/ui`'s `ToastHost`): the cross's spoken name. A toast's title,
 * description and *Undo* are the caller's.
 */
import type { Translator } from '../runtime';
import { CATALOG_SETTINGS } from './catalog-settings';

/** The words a host that closes toasts says of its own, in the reader's language. */
export function toastHostWords(t: Translator['t']) {
  return { dismissLabel: t(CATALOG_SETTINGS.dismiss) };
}
