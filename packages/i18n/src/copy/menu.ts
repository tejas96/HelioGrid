/**
 * `Menu`'s usual name (`packages/ui`'s `Menu`): the overflow menu's spoken name, which its default
 * trigger — a 44×44 button with no words — carries too.
 */
import type { Translator } from '../runtime';

export const MENU = {
  moreActions: /*i18n*/ { id: 'More actions' },
} as const;

/** An overflow menu's name, as `Menu` takes it. */
export function menuWords(t: Translator['t']) {
  return { label: t(MENU.moreActions) };
}
