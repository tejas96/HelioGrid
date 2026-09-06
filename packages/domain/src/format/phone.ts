import type { FormatPack } from './pack';

/**
 * Phone DISPLAY, from the market's spec (`F1-49`). Storage and transport are always E.164
 * (`packages/contracts` `phoneE164Schema`); nothing here validates, because a refusal is the
 * caller's to word.
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
  const digits = value.trim().replace(NON_DIGIT, '');
  const code = pack.phone.dialCode.replace(NON_DIGIT, '');
  return code.length > 0 && digits.startsWith(code) ? digits.slice(code.length) : digits;
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
