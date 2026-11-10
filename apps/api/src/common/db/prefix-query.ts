/** A term of digits alone, which the `simple` parser may have stored with a sign. */
const DIGITS = /^\d+$/;

/**
 * Terms as a `to_tsquery('simple', …)` text in which every term must begin a word of the document.
 * The parser stores a hyphen before digits as a minus sign — `NP-1` is the words `np` and `-1` — so
 * a term of digits also matches its signed form, and `np 1` finds `NP-1`. Each term holds
 * letters, marks, digits and hyphens only: anything else is `to_tsquery` syntax. Null for no terms,
 * which the caller reads as no text filter at all.
 */
export function prefixQueryOf(terms: readonly string[]): string | null {
  if (terms.length === 0) return null;
  return terms
    .map((term) => (DIGITS.test(term) ? `(${term}:* | -${term}:*)` : `${term}:*`))
    .join(' & ');
}
