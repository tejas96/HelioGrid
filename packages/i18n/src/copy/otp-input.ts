/**
 * The words `OtpInput` (`packages/ui`) says on its own: the code's name when the field has no label,
 * and each box's — inside the named group on the web, the whole name on the phone, which has none.
 */
import type { Translator } from '../runtime';

const OTP_INPUT = {
  code: /*i18n*/ { id: 'Verification code' },
  digit: /*i18n*/ { id: 'Digit {position}' },
  digitOf: /*i18n*/ { id: '{code} — digit {position}' },
} as const;

/** Every word `OtpInput` says on its own, in the reader's language. */
export function otpInputWords(t: Translator['t']) {
  return {
    code: t(OTP_INPUT.code),
    digit: (position: number) => t(OTP_INPUT.digit, { position }),
    digitOf: (code: string, position: number) => t(OTP_INPUT.digitOf, { code, position }),
  };
}
