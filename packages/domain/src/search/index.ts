/**
 * The global search (`F6-20`…`F6-25`): what a query asks and how results rank. Each module adds its
 * target to the server's one read when its slice begins (Law 9).
 */

export type { PhoneQuery, SearchQuery } from './query';
export { searchQueryOf, searchTermsOf } from './query';
export type { SearchCandidate, SearchMatch } from './ranking';
export { rankSearchHits, SEARCH_MATCHES, searchMatchOf } from './ranking';
export type {
  SearchCatalogHit,
  SearchCustomerHit,
  SearchHits,
  SearchLeadHit,
  SearchPersonHit,
  SearchProposalHit,
} from './search-hits';
export type { SearchNumber } from './search-number';
export type {
  SearchCatalogRow,
  SearchCustomerRow,
  SearchGroup,
  SearchGroupView,
  SearchLeadRow,
  SearchOpens,
  SearchPersonRow,
  SearchProposalRow,
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
