/**
 * The global search (`F6-20`…`F6-25`): what a query asks and how results rank. Each module adds its
 * target to the server's one read when its slice begins (Law 9).
 */

export type { PhoneQuery, SearchQuery } from './query';
export { searchQueryOf, searchTermsOf } from './query';
export type { SearchCandidate, SearchMatch } from './ranking';
export { rankSearchHits, SEARCH_MATCHES, searchMatchOf } from './ranking';
export type { SearchNumber } from './search-number';
export type {
  SearchCatalogHit,
  SearchCatalogRow,
  SearchCustomerHit,
  SearchCustomerRow,
  SearchGroup,
  SearchGroupView,
  SearchHits,
  SearchLeadHit,
  SearchLeadRow,
  SearchOpens,
  SearchPersonHit,
  SearchPersonRow,
  SearchRead,
  SearchReopen,
  SearchReopenAct,
  SearchRow,
  SearchView,
  SearchViewFacts,
} from './search-view';
export {
  SEARCH_GROUPS,
  SEARCH_SETTLE_MS,
  searchFoundNothing,
  searchViewOf,
} from './search-view';
