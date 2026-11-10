import type { TranslatedText } from '@heliogrid/contracts';
import type {
  ComponentKind,
  LeadLifecycleState,
  LeadStage,
  SearchGroup,
  SearchRead,
  SearchRow,
} from '@heliogrid/domain';

/** Every word the results say, built in `@heliogrid/i18n` (`searchWords`). */
export interface SearchResultsWords<Failure> {
  /** Nothing typed yet: what search covers. */
  idle: { readonly title: TranslatedText; readonly body: TranslatedText };
  /** The calm wait's spoken name. */
  loading: TranslatedText;
  /** Nothing found for the query asked: "No results for “98765 00000”", and what to try. */
  none: (query: string) => { readonly title: TranslatedText; readonly body: TranslatedText };
  failed: {
    readonly title: TranslatedText;
    readonly body: TranslatedText;
    readonly retry: TranslatedText;
  };
  group: (group: SearchGroup) => TranslatedText;
  /** "See all 214", the count as the market groups it. */
  seeAll: (count: string) => TranslatedText;
  noName: TranslatedText;
  noCity: TranslatedText;
  /** The mark on a row whose number is the one typed, whole. */
  numberMatch: TranslatedText;
  /** The mark on the reader's own row among the people. */
  you: TranslatedText;
  stage: (stage: LeadStage) => TranslatedText;
  source: (source: string) => TranslatedText;
  state: (state: LeadLifecycleState) => TranslatedText;
  componentKind: (kind: ComponentKind) => TranslatedText;
  /** A row's target's spoken name: "Open Priya Sharma", or the kind's own when it has no name. */
  open: (kind: SearchRow<Failure>['kind'], name: string | null) => TranslatedText;
  reopen: TranslatedText;
  /** Reopen's spoken name: "Reopen Suresh Kamble". */
  reopenNamed: (name: string | null) => TranslatedText;
  /** The row's line while its Reopen is out. */
  reopening: TranslatedText;
  /** Why a Reopen came back undone, said in its row. */
  reopenReturned: (failure: Failure) => TranslatedText;
}

/**
 * **Global Search's results** (`SCR-SHELL-02`, `F6-20`): the groups the one read answered, each
 * with its count, its rows and See all where the group is cut and a list takes the query; each
 * row a target that opens its record. A junk lead carries its mark and Reopen, out in its row
 * (`F6-23`). Before anything is typed, while the read is out, when nothing is found and when the
 * read failed, the same place says so — the web's palette and page and the phone's screen draw
 * this one part.
 */
export interface SearchResultsProps<Failure> {
  read: SearchRead<Failure>;
  /**
   * A read for what is typed now is out while an earlier answer is drawn: the web marks its region
   * busy; on the phone the screen reader hears the rows as they change.
   */
  searching: boolean;
  /** The row the keyboard's cursor is on (the desktop palette's ↑ and ↓); null where none is. */
  cursor: string | null;
  /** Opens a row's record or a group's See all, at domain's address for it (`leads/…`). */
  onOpen: (address: string) => void;
  onReopen: (leadId: string) => void;
  words: SearchResultsWords<Failure>;
}
