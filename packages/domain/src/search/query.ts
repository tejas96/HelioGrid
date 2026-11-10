import type { FormatPack } from '../format/pack';
import { internationalDigitsOf, phoneE164Of } from '../format/phone';
import { asciiDigits } from '../import/text';

/**
 * What one search box query asks (`F6-20`): a phone number, whole or begun, and the words of a name
 * or a city. Read once here so the server's match and the ranking agree on what was typed.
 */

/** A number as people type one: digits, spaces, dashes, dots, brackets, one leading `+`. */
const PHONE_SHAPED = /^\+?[\d\s\-().]+$/;

const NON_DIGIT = /\D/g;

/** Anything but a letter, a mark Devanagari is written with, a digit or a hyphen separates terms. */
const TERM_SEPARATOR = /[^\p{L}\p{M}\p{N}-]+/u;

/**
 * A phone query, in the form numbers are stored: `e164Prefix` is how every stored number it begins
 * starts — the market's dial code before the national digits typed, with the code and any dialling
 * zeros the person typed taken off — so one index on the stored number serves both. `e164` is the
 * whole number when the query is one, which ranks first.
 */
export interface PhoneQuery {
  readonly e164Prefix: string;
  readonly e164: string | null;
}

export interface SearchQuery {
  /** Lower-case terms, each a whole token: a hyphen stays inside one, so `NP-1` is one term. */
  readonly terms: readonly string[];
  readonly phone: PhoneQuery | null;
}

/** The terms of a query or of a record's text, once each, in the order written. */
export function searchTermsOf(text: string): readonly string[] {
  const terms = asciiDigits(text)
    .toLowerCase()
    .split(TERM_SEPARATOR)
    .map((term) => term.replace(/^-+|-+$/g, ''))
    .filter((term) => term !== '');
  return [...new Set(terms)];
}

/**
 * The begun number as stored numbers begin. Written for international dialling, another market's
 * code is kept as typed; this market's code, or none, leaves the national digits begun. No digit of
 * a number itself — `+9`, a lone `+91`, `0` — asks for no number, never for every one.
 */
function e164PrefixOf(pack: FormatPack, typed: string): string | null {
  const code = pack.phone.dialCode.replace(NON_DIGIT, '');
  const international = internationalDigitsOf(typed);
  if (international !== null) {
    if (code.startsWith(international)) return null;
    if (!international.startsWith(code)) return `+${international}`;
  }
  const begun =
    international === null ? typed.replace(NON_DIGIT, '') : international.slice(code.length);
  const national = begun.replace(/^0+/, '');
  return national === '' ? null : `${pack.phone.dialCode}${national}`;
}

function phoneQueryOf(pack: FormatPack, typed: string): PhoneQuery | null {
  if (!PHONE_SHAPED.test(typed)) return null;
  const e164 = phoneE164Of(pack, typed);
  if (e164 !== null) return { e164Prefix: e164, e164 };
  const e164Prefix = e164PrefixOf(pack, typed);
  return e164Prefix === null ? null : { e164Prefix, e164: null };
}

/**
 * The query as the search reads it. A query shaped like a phone number is a phone query AND terms —
 * a model name may be digits alone — and any other is terms alone. Blank asks nothing.
 */
export function searchQueryOf(pack: FormatPack, raw: string): SearchQuery {
  const typed = asciiDigits(raw).trim();
  return { terms: searchTermsOf(typed), phone: phoneQueryOf(pack, typed) };
}
