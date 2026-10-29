/**
 * The `Derivation` explanation's own words (`packages/ui`'s `DerivationKindWords`, `summary` and
 * `appendixTitle`): each kind's heading, the trigger and the print appendix's title — authored
 * once for every surface that opens how a figure is worked out.
 */
import type { Translator } from '../runtime';
import { PROVENANCE_TIER_WORD } from './provenance';

const DERIVATION = {
  formula: /*i18n*/ { id: 'How it is worked out' },
  boundary: /*i18n*/ { id: 'Where the model stops' },
  exclusion: /*i18n*/ { id: 'Not included' },
  note: /*i18n*/ { id: 'Note' },
  summary: /*i18n*/ { id: 'How this is worked out' },
  appendixTitle: /*i18n*/ { id: 'How these figures are worked out' },
} as const;

/** Every word `Derivation` and `DerivationGroup` draw, in the reader's language. */
export function derivationWords(t: Translator['t']) {
  return {
    /** The trigger's words — *How this is worked out*. */
    summary: t(DERIVATION.summary),
    /** The print appendix's heading. */
    appendixTitle: t(DERIVATION.appendixTitle),
    /** Each kind's heading, where a part names none of its own. */
    kinds: {
      formula: t(DERIVATION.formula),
      assumption: t(PROVENANCE_TIER_WORD.assumed),
      boundary: t(DERIVATION.boundary),
      exclusion: t(DERIVATION.exclusion),
      note: t(DERIVATION.note),
    },
  };
}
