/**
 * Global Search's words (`SCR-SHELL-02`, `F6-20`, `F6-23`): what it covers before anything is
 * typed and when nothing is found, its wait and its failure, each group's name and See all, a
 * row's marks and spoken name, a junk lead's Reopen, the desktop palette's keys and the phone's
 * Cancel. The box's own name and placeholder are the shell's (`SHELL.search`,
 * `SHELL.searchPlaceholder`).
 */
import type { TranslatedText } from '@heliogrid/contracts';
import type {
  ComponentKind,
  LeadActFailure,
  LeadLifecycleState,
  LeadStage,
  SearchGroup,
  SearchRow,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';
import { catalogKind } from './catalog-settings';
import { LEAD_STAGE_WORD } from './crm-vocabulary';
import { leadActFailureWords } from './lead-act-failure';
import { LEAD_DETAIL } from './lead-detail';
import { leadSourceWord, leadStateLabel } from './lead-marks';
import { SHELL } from './shell';

type T = Translator['t'];

const SEARCH = {
  idleTitle: /*i18n*/ { id: 'Search by name, phone or city' },
  covers: /*i18n*/ { id: 'Finds the leads, customers, people and catalog items you can open.' },
  loading: /*i18n*/ { id: 'Searching' },
  noneTitle: /*i18n*/ { id: 'No results for “{query}”' },
  noneBody: /*i18n*/ {
    id: 'Check the number, or try a name. Search finds the leads, customers, people and catalog items you can open.',
  },
  failedTitle: /*i18n*/ { id: "Couldn't search" },
  seeAll: /*i18n*/ { id: 'See all {count}' },
  noName: /*i18n*/ { id: 'No name yet' },
  noCity: /*i18n*/ { id: 'No city yet' },
  /** A row whose number is the one typed, whole: it ranks first and says so. */
  numberMatch: /*i18n*/ { id: 'Number match' },
  you: /*i18n*/ { id: 'You' },
  openNamed: /*i18n*/ { id: 'Open {name}' },
  openThisLead: /*i18n*/ { id: 'Open this lead' },
  openThisCustomer: /*i18n*/ { id: 'Open this customer' },
  reopenNamed: /*i18n*/ { id: 'Reopen {name}' },
  reopenThis: /*i18n*/ { id: 'Reopen this lead' },
  cancel: /*i18n*/ { id: 'Cancel' },
  /** The palette's key hints, each beside its key: ↑↓ move · Enter open · Esc close. */
  keyMove: /*i18n*/ { id: 'move' },
  keyOpen: /*i18n*/ { id: 'open' },
  keyClose: /*i18n*/ { id: 'close' },
  onlyYours: /*i18n*/ { id: 'Only records you can open' },
} as const;

/** Each group's name, in the order the results draw them. */
const GROUP: Record<SearchGroup, MessageRef> = {
  leads: /*i18n*/ { id: 'Leads' },
  customers: /*i18n*/ { id: 'Customers' },
  people: /*i18n*/ { id: 'People' },
  catalog: /*i18n*/ { id: 'Catalog' },
};

type RowKind = SearchRow<unknown>['kind'];

/** Every word the search says, for `SearchResults` and the surfaces around it. */
export function searchWords(t: T) {
  return {
    title: t(SHELL.search),
    placeholder: t(SHELL.searchPlaceholder),
    cancel: t(SEARCH.cancel),
    idle: { title: t(SEARCH.idleTitle), body: t(SEARCH.covers) },
    loading: t(SEARCH.loading),
    none: (query: string) => ({
      title: t(SEARCH.noneTitle, { query }),
      body: t(SEARCH.noneBody),
    }),
    failed: {
      title: t(SEARCH.failedTitle),
      body: t(SHELL.keepsFailing),
      retry: t(SHELL.tryAgain),
    },
    group: (group: SearchGroup): TranslatedText => t(GROUP[group]),
    seeAll: (count: string): TranslatedText => t(SEARCH.seeAll, { count }),
    noName: t(SEARCH.noName),
    noCity: t(SEARCH.noCity),
    numberMatch: t(SEARCH.numberMatch),
    you: t(SEARCH.you),
    stage: (stage: LeadStage): TranslatedText => t(LEAD_STAGE_WORD[stage]),
    source: (source: string): TranslatedText => leadSourceWord(t, source),
    state: (state: LeadLifecycleState): TranslatedText => leadStateLabel(t, state),
    componentKind: (kind: ComponentKind): TranslatedText => catalogKind(t, kind),
    open: (kind: RowKind, name: string | null): TranslatedText => {
      if (name !== null) return t(SEARCH.openNamed, { name });
      return t(kind === 'customer' ? SEARCH.openThisCustomer : SEARCH.openThisLead);
    },
    reopen: t(LEAD_DETAIL.reopen),
    reopenNamed: (name: string | null): TranslatedText =>
      name === null ? t(SEARCH.reopenThis) : t(SEARCH.reopenNamed, { name }),
    reopening: t(LEAD_DETAIL.reopening),
    reopenReturned: (failure: LeadActFailure): TranslatedText => leadActFailureWords(t, failure),
    keys: { move: t(SEARCH.keyMove), open: t(SEARCH.keyOpen), close: t(SEARCH.keyClose) },
    onlyYours: t(SEARCH.onlyYours),
  };
}

export type SearchWords = ReturnType<typeof searchWords>;
