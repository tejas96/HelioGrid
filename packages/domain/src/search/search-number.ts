import type { FormatPack } from '../format/pack';
import { formatPhone } from '../format/phone';
import type { SearchQuery } from './query';
import { searchMatchOf } from './ranking';

/** A number as drawn, and where in it the digits typed sit: `[start, end)`, or none. */
export interface SearchNumber {
  readonly shown: string;
  readonly typed: readonly [number, number] | null;
}

/** Whether the number typed is this record's, whole: an exact match ranks first and says so. */
export function isExact(
  query: SearchQuery,
  record: {
    readonly phoneE164: string;
    readonly name: string | null;
    readonly city: string | null;
  },
): boolean {
  const candidate = { phonesE164: [record.phoneE164], name: record.name ?? '', city: record.city };
  return searchMatchOf(query, candidate) === 'exact_phone';
}

const DIGIT = /\d/;

/**
 * The number as the market writes it, with the digits typed marked across its spaces. Only a
 * number the typed digits begin is marked, and the market's own code never is: a person types
 * the national number, and `+91` lit on every row would mark nothing.
 */
export function numberOf(pack: FormatPack, query: SearchQuery, e164: string): SearchNumber {
  const shown = formatPhone(pack, e164);
  const prefix = query.phone?.e164Prefix;
  if (prefix === undefined || !e164.startsWith(prefix)) return { shown, typed: null };
  const code = pack.phone.dialCode;
  const from = prefix.startsWith(code) ? digitCount(code) : 0;
  const to = digitCount(prefix);
  const digitsAt = [...shown].flatMap((char, at) => (DIGIT.test(char) ? [at] : []));
  const start = digitsAt[from];
  const last = digitsAt[to - 1];
  if (to <= from || start === undefined || last === undefined) return { shown, typed: null };
  return { shown, typed: [start, last + 1] };
}

function digitCount(text: string): number {
  return text.replace(/\D/g, '').length;
}
