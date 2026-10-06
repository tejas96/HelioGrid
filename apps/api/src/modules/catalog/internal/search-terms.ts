/**
 * A search text as per-word prefix terms for `to_tsquery('simple', …)` (`M01-38`, decision 2):
 * "waa 55" finds "Waaree WS-550". Only letters and digits pass — every other character is
 * `to_tsquery` syntax, and a stray `&` or `:` would be a query error, not a search. Null when no
 * word is left: the list is then not filtered by text at all.
 */
export function prefixTermsOf(text: string | undefined): string | null {
  const words = text?.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [];
  return words.length === 0 ? null : words.map((word) => `${word}:*`).join(' & ');
}
