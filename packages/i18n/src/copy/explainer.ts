import type { ExplainerPagerWords } from '@heliogrid/domain';
import type { Translator } from '../runtime';

/** The pager of the ask (`F7-46`): the only words the component shows that a screen does not write. */
const EXPLAINER = {
  next: /*i18n*/ { id: 'Next' },
  back: /*i18n*/ { id: 'Back' },
  position: /*i18n*/ { id: '{page} of {total}' },
};

/** A paged ask's words in the reader's language — spread onto `Explainer`; `translate` is the mount's `t`. */
export function explainerPagerWords(translate: Translator['t']): ExplainerPagerWords {
  return {
    nextLabel: translate(EXPLAINER.next),
    backLabel: translate(EXPLAINER.back),
    positionLabel: (page, total) => translate(EXPLAINER.position, { page, total }),
  };
}
