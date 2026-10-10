import type { ExplainerPagerWords, ExplainerPages } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/** The pager of the ask (`F7-46`): the only words the component shows that a screen does not write. */
const EXPLAINER = {
  next: /*i18n*/ { id: 'Next' },
  back: /*i18n*/ { id: 'Back' },
  position: /*i18n*/ { id: '{page} of {total}' },
};

/** Each page count domain allows as its own shape, as `Explainer` takes them. */
type PagesOneCountAtATime<T> = T extends unknown ? { readonly pages: T } : never;

/**
 * An ask's words: its trigger's spoken name, its title, and its pages (`F7-46`). Spread onto
 * `Explainer` with `explainerPagerWords`.
 */
export type ExplainerWords = {
  readonly label: string;
  readonly title: string;
} & PagesOneCountAtATime<Exclude<ExplainerPages<string>, string>>;

/** A paged ask's words in the reader's language — spread onto `Explainer`; `translate` is the mount's `t`. */
export function explainerPagerWords(translate: Translator['t']): ExplainerPagerWords {
  return {
    nextLabel: translate(EXPLAINER.next),
    backLabel: translate(EXPLAINER.back),
    positionLabel: (page, total) => translate(EXPLAINER.position, { page, total }),
  };
}
