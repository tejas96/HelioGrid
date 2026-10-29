/**
 * The words `PhoneField` (`packages/ui`) says on its own: the phone's spoken name for its box — the
 * field's name, then the whole number with its dial code.
 */
import type { Translator } from '../runtime';

const PHONE_FIELD = {
  spokenNumber: /*i18n*/ { id: '{label}, {phone}' },
} as const;

/** Every word `PhoneField` says on its own, in the reader's language. */
export function phoneFieldWords(t: Translator['t']) {
  return {
    spokenNumber: (label: string, phone: string) => t(PHONE_FIELD.spokenNumber, { label, phone }),
  };
}
