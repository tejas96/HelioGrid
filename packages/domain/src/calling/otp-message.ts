import { packLabel, type UiLanguage } from '../format/languages';
import type { CallingRulesPack } from './pack';

/** The slot the code fills in a registered OTP template. */
export const OTP_CODE_SLOT = '{code}';

/**
 * The OTP message a market sends (`M01-06`): its registered template in the reader's language
 * with the code in its slot. Composed here, from the pack, because the text is registered
 * sender-side data (`F1-38`) — the product name untranslated, the never-call line present —
 * and a template change is a pack revision (`F1-11`), never a catalog edit.
 */
export function otpMessage(rules: CallingRulesPack, language: UiLanguage, code: string): string {
  return packLabel(rules.messaging.otpMessage, language).replace(OTP_CODE_SLOT, code);
}
