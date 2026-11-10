import type { SearchResults } from '@heliogrid/contracts';
import type { ApiClient } from '../client/client';
import { bodyAt } from '../errors/errors';

/** What was typed, as it is sent — `limit` is filled by the server when left out. */
export type SearchAsk = NonNullable<Parameters<ApiClient['search']['search']>[0]>['query'];

/**
 * Global search (`F6-24`, `T-FPLAT-020`): leads, customers, people and catalog items in one read,
 * each group only what the searcher may open, in every billing state.
 */
export interface SearchRepository {
  search(query: SearchAsk, signal?: AbortSignal): Promise<SearchResults>;
}

/** The types are INFERRED from the contract, never a hand-written copy of the response. */
export function createSearchRepository(api: ApiClient): SearchRepository {
  return {
    search: (query, signal) =>
      bodyAt(() => api.search.search({ query, fetchOptions: { signal } }), 200),
  };
}
