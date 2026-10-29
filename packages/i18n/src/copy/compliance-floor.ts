/**
 * `ComplianceFloor`'s sentences (`packages/ui`'s `ComplianceFloorWords`): what cannot happen,
 * flatly, then the floor named — one wording wherever the owner meets it, in three languages
 * (`F3-07`). The floor's and the authority's names are the market pack's; the row's is its own.
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/** `line`: the act the floor forbids, said flatly. One sentence per act, so each language conjugates it. */
const CANNOT = {
  removed: /*i18n*/ { id: 'Required by law — cannot be removed' },
  widened: /*i18n*/ { id: 'Required by law — cannot be widened' },
  'switched off': /*i18n*/ { id: 'Required by law — cannot be switched off' },
  shortened: /*i18n*/ { id: 'Required by law — cannot be shortened' },
} as const satisfies Record<string, MessageRef>;

/** The act a floor forbids — the keys `ComplianceFloor`'s `act` takes. */
type FloorAct = keyof typeof CANNOT;

/** `refusal`: the save that did not happen, naming the row it is about. */
const NOT_SAVED: Record<FloorAct, MessageRef> = {
  removed: /*i18n*/ { id: 'Not saved — {subject} cannot be removed' },
  widened: /*i18n*/ { id: 'Not saved — {subject} cannot be widened' },
  'switched off': /*i18n*/ { id: 'Not saved — {subject} cannot be switched off' },
  shortened: /*i18n*/ { id: 'Not saved — {subject} cannot be shortened' },
};

/** `refusal` with no row named. */
const NOT_SAVED_THIS: Record<FloorAct, MessageRef> = {
  removed: /*i18n*/ { id: 'Not saved — this cannot be removed' },
  widened: /*i18n*/ { id: 'Not saved — this cannot be widened' },
  'switched off': /*i18n*/ { id: 'Not saved — this cannot be switched off' },
  shortened: /*i18n*/ { id: 'Not saved — this cannot be shortened' },
};

const PUT_BACK = /*i18n*/ { id: '{named}. Put it back to save your other changes.' };

/** Every sentence a floor composes, named as `ComplianceFloor`'s `words` takes them. */
export function complianceFloorWords(t: Translator['t']) {
  return {
    cannot: (act: FloorAct): TranslatedText => t(CANNOT[act]),
    notSaved: (act: FloorAct, subject?: string): TranslatedText =>
      subject === undefined ? t(NOT_SAVED_THIS[act]) : t(NOT_SAVED[act], { subject }),
    putBack: (named: string): TranslatedText => t(PUT_BACK, { named }),
  };
}
