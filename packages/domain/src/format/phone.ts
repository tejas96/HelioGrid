import { asciiDigits } from '../import/text';
import type { FormatPack } from './pack';

/**
 * Phone DISPLAY, from the market's spec (`F1-49`), and the one reading of a typed or imported number
 * into the E.164 it is stored as (`M02-02`). Storage and transport are always E.164
 * (`packages/contracts` `phoneE164Schema`); nothing here words a refusal — that is the caller's.
 *
 * The grouping is the PACK's, never a fixed 5+5. That constant lived in two places — the auth
 * slice and the design system — which is exactly the drift a pack key exists to end.
 */

const NON_DIGIT = /\D/g;

/**
 * Splits a national number into the market's groups. Digits beyond the declared groups stay in
 * the last one, so a number longer than the market expects renders whole and wrong rather than
 * short and plausible.
 */
function groupNationalNumber(digits: string, groups: readonly number[]): string {
  if (groups.length === 0) return digits;
  const parts: string[] = [];
  let at = 0;
  for (const size of groups.slice(0, -1)) {
    if (at >= digits.length) break;
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  if (at < digits.length) parts.push(digits.slice(at));
  return parts.join(' ');
}

/**
 * The national number, digits only — `+91 98450 27746` → `9845027746`. THIS MARKET's calling code
 * is stripped where the value carries it, and a value without one is already national.
 *
 * Exported because the series a caller line belongs to is a property of the national number
 * (`F1-37`), and `calling/routing.ts` reads it. One derivation, so a display and a compliance
 * check can never disagree about where the code ends.
 */
export function nationalNumber(pack: FormatPack, value: string): string {
  const raw = value.trim();
  const digits = raw.replace(NON_DIGIT, '');
  const code = pack.phone.dialCode.replace(NON_DIGIT, '');
  // Only a `+` says a code is there: a national number may begin with the code's digits (`91…`).
  const carriesCode = raw.startsWith('+') && code.length > 0 && digits.startsWith(code);
  return carriesCode ? digits.slice(code.length) : digits;
}

export interface PhoneOptions {
  /**
   * Render the national number alone — `98450 27746` — for a field that shows its dial code as
   * an adornment. THIS MARKET's calling code is stripped first if the value carries one: a
   * stored E.164 number grouped whole reads `91984 5027746` beside a `+91` label, which is a
   * different number.
   */
  readonly nationalOnly?: boolean;
}

/**
 * `+919845027746` → `+91 98450 27746`.
 *
 * **A number from another market is returned as it arrived.** This pack knows India's grouping
 * and nothing else, so applying 5+5 to a US number renders `14155 551234` — unreadable, and it
 * looks like an Indian number that lost a digit. Relabelling it `+91` would be worse.
 */
export function formatPhone(pack: FormatPack, value: string, options?: PhoneOptions): string {
  const raw = value.trim();
  const digits = raw.replace(NON_DIGIT, '');
  const national = nationalNumber(pack, raw);
  const carriesCode = national.length !== digits.length;
  if (options?.nationalOnly === true) return groupNationalNumber(national, pack.phone.nsnGroups);
  if (carriesCode) {
    return `${pack.phone.dialCode} ${groupNationalNumber(national, pack.phone.nsnGroups)}`;
  }
  if (raw.startsWith('+')) return raw;
  return groupNationalNumber(digits, pack.phone.nsnGroups);
}

export interface PhoneDigitsMismatch {
  readonly typed: number;
  readonly needed: number;
}

/**
 * Why a typed number cannot be sent a code: its national part has the wrong number of digits
 * for this market (`pack.phone.nsnLength`). `null` when it has exactly the right count. The
 * front door answers this ON THE FIELD when the primary is pressed, never by gating the
 * primary (`SCR-M01-01` decision 2b); the sentence is the screen's, the rule the pack's.
 */
export function phoneDigitsMismatch(pack: FormatPack, value: string): PhoneDigitsMismatch | null {
  const typed = nationalNumber(pack, value).length;
  const needed = pack.phone.nsnLength;
  return typed === needed ? null : { typed, needed };
}

/** The shape `phoneE164Schema` holds after its `+`: a non-zero first digit, seven to fifteen in all. */
const INTERNATIONAL_DIGITS = /^[1-9]\d{6,14}$/;

/**
 * The digits of a number written for international dialling — after its `+`, or after the `00`
 * that stands for one — or `null` for a number written the national way.
 */
export function internationalDigitsOf(typed: string): string | null {
  const digits = typed.replace(NON_DIGIT, '');
  if (typed.trim().startsWith('+')) return digits;
  return digits.startsWith('00') ? digits.slice(2) : null;
}

/**
 * Whether the digits typed before a national number are only dialling prefixes: zeros (a trunk `0`)
 * and this market's own calling code, in any of the ways people write them — `0`, `91`, `091`, `910`.
 */
function onlyDiallingPrefix(prefix: string, code: string): boolean {
  return new RegExp(`^0*(?:${code})?0*$`).test(prefix);
}

/**
 * The E.164 a number is stored and matched as (`M02-02`: identity survives any formatting habit and
 * any import) — every way one number is written gives one string: `98450 27746`, `098450-27746`,
 * `+91 (0) 98450 27746`, `0091 9845027746` and `९८४५० २७७४६` all read `+919845027746`. A number
 * written with `+` or `00` and another market's code is kept whole when it has an international
 * number's shape. `null` when the text is not a number this market can store: too few digits, too
 * many, or digits before the national number that are no dialling prefix.
 */
export function phoneE164Of(pack: FormatPack, raw: string): string | null {
  const typed = asciiDigits(raw);
  const code = pack.phone.dialCode.replace(NON_DIGIT, '');
  const { nsnLength } = pack.phone;
  const international = internationalDigitsOf(typed);
  if (international !== null) {
    if (!international.startsWith(code)) {
      return INTERNATIONAL_DIGITS.test(international) ? `+${international}` : null;
    }
    /* `+91 (0) 98450 27746`: the trunk zero some write after the code is no digit of the number. */
    const national = international.slice(code.length).replace(/^0+/, '');
    return national.length === nsnLength ? `${pack.phone.dialCode}${national}` : null;
  }
  const digits = typed.replace(NON_DIGIT, '');
  if (digits.length < nsnLength) return null;
  const national = digits.slice(digits.length - nsnLength);
  const prefix = digits.slice(0, digits.length - nsnLength);
  return onlyDiallingPrefix(prefix, code) ? `${pack.phone.dialCode}${national}` : null;
}
