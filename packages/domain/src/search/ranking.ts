import { type SearchQuery, searchTermsOf } from './query';

/**
 * Plain ranking (`F6-25`): an exact phone number first, then a number it begins, then name and city
 * matches — no engagement tuning, and a tie keeps the order the server read the records in.
 */
export const SEARCH_MATCHES = ['exact_phone', 'phone_prefix', 'name_or_city'] as const;
export type SearchMatch = (typeof SEARCH_MATCHES)[number];

/** What a result is ranked by: its stored numbers, its name and its city. */
export interface SearchCandidate {
  readonly phonesE164: readonly string[];
  readonly name: string;
  readonly city: string | null;
}

/** Whether every term begins one of the words of the name or the city. */
function namesEveryTerm(terms: readonly string[], candidate: SearchCandidate): boolean {
  const words = searchTermsOf(`${candidate.name} ${candidate.city ?? ''}`);
  return terms.length > 0 && terms.every((term) => words.some((word) => word.startsWith(term)));
}

/** How a record matches the query, best first, or `null` when it matches none of these ways. */
export function searchMatchOf(query: SearchQuery, candidate: SearchCandidate): SearchMatch | null {
  const { phone } = query;
  if (phone !== null) {
    if (phone.e164 !== null && candidate.phonesE164.includes(phone.e164)) return 'exact_phone';
    if (candidate.phonesE164.some((stored) => stored.startsWith(phone.e164Prefix))) {
      return 'phone_prefix';
    }
  }
  return namesEveryTerm(query.terms, candidate) ? 'name_or_city' : null;
}

/** A match's place in the ranking; a record the server found some other way comes last. */
function rankOf(match: SearchMatch | null): number {
  return match === null ? SEARCH_MATCHES.length : SEARCH_MATCHES.indexOf(match);
}

/**
 * The hits in ranked order. Stable, so records of one rank keep the server's order; a hit that
 * matches none of the ranked ways — the server found it by another — is kept, last.
 */
export function rankSearchHits<Hit>(
  hits: readonly Hit[],
  query: SearchQuery,
  candidateOf: (hit: Hit) => SearchCandidate,
): Hit[] {
  return hits
    .map((hit) => ({ hit, rank: rankOf(searchMatchOf(query, candidateOf(hit))) }))
    .sort((a, b) => a.rank - b.rank)
    .map(({ hit }) => hit);
}
