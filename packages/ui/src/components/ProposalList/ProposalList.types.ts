import type {
  ProposalList as ProposalListWire,
  ProposalRow,
  TranslatedText,
} from '@heliogrid/contracts';
import type { ProposalListFilter, Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { DataTableWords } from '../DataTable/DataTable.types';

/** The proposals list's words — `@heliogrid/i18n`'s `proposalListWords`, by shape. */
export interface ProposalListWords {
  /** The filter chips' group name, and each chip's word. */
  readonly filterLabel: TranslatedText;
  readonly filter: (filter: ProposalListFilter) => TranslatedText;
  readonly columns: {
    readonly customer: TranslatedText;
    readonly number: TranslatedText;
    readonly system: TranslatedText;
    readonly price: TranslatedText;
    readonly status: TranslatedText;
    readonly latest: TranslatedText;
    readonly copy: TranslatedText;
  };
  /** The table's caption — "Proposals". */
  readonly caption: TranslatedText;
  readonly standing: (standing: string) => TranslatedText;
  /** The customer's name, or that the lead holds none. */
  readonly customer: (row: ProposalRow) => TranslatedText;
  /** The proposal's number, or "Draft" before it has one. */
  readonly number: (row: ProposalRow) => TranslatedText;
  /** "3 kW" — or nothing typed yet. */
  readonly system: (row: ProposalRow) => TranslatedText;
  /** The payable, as a headline amount; `null` until a price is typed. */
  // biome-ignore lint/plugin/copy-prop-type: a figure, printed by the market format
  readonly price: (row: ProposalRow) => string | null;
  /** One line for the latest event — "Read for 6 min · 4 days ago". */
  readonly latest: (row: ProposalRow) => TranslatedText;
  /** Not current: the mark's word — "Not current" (`F8-18`). */
  readonly stale: TranslatedText;
  /** The corrective act on a row that is not current — "Make a new version" — and its spoken name. */
  readonly newVersion: TranslatedText;
  readonly newVersionNamed: (row: ProposalRow) => TranslatedText;
  /** A row's spoken name, and its copy act's — "Use PRP-0042 for another lead". */
  readonly open: (row: ProposalRow) => TranslatedText;
  readonly copyNamed: (row: ProposalRow) => TranslatedText;
  readonly more: TranslatedText;
  readonly emptyTitle: TranslatedText;
  readonly emptyLine: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
  readonly table: DataTableWords;
}

/**
 * **The proposals list** (`SCR-M06-19`, `M06-48`): filter chips with their counts; on a phone one
 * card per proposal, at width a table set on the page with a line under the header and each row
 * and no card behind it; each row shows the customer, the number, the system, the price, the
 * standing as a mark and a word, and one line for the latest event. A row's copy act starts the
 * same proposal for another lead.
 */
export interface ProposalListProps {
  readonly read: Exclude<Read<ProposalListWire>, { readonly kind: 'empty' }>;
  /** `wide` draws the table; `narrow` the cards. The phone draws cards at every width. */
  readonly room: 'wide' | 'narrow';
  readonly filter: ProposalListFilter;
  readonly onFilter: (filter: ProposalListFilter) => void;
  readonly words: ProposalListWords;
  readonly onOpen: (row: ProposalRow) => void;
  /** Absent for a reader who may not start a proposal: no copy act is drawn. */
  readonly onCopy?: (row: ProposalRow) => void;
  /** Opens the builder for a new version of a row that is not current; absent for a reader who may not. */
  readonly onNewVersion?: (row: ProposalRow) => void;
  /** Present while the read holds more rows than it shows. */
  readonly onMore?: () => void;
  readonly loadingMore?: boolean;
  readonly focusAfter: FocusAfter;
}

/** A lead the copy can start on, as the picker lists it. */
export interface PickLeadRow {
  readonly id: string;
  readonly name: string;
  /** Where the lead is and what it wants — facts the caller joins. */
  // biome-ignore lint/plugin/copy-prop-type: the lead's own place and size, facts
  readonly line: string;
}

export interface PickLeadWords {
  readonly title: TranslatedText;
  readonly close: TranslatedText;
  readonly searchLabel: TranslatedText;
  readonly searchPlaceholder: TranslatedText;
  readonly clearSearch: TranslatedText;
  /** "A new customer" and its line. */
  readonly newCustomer: TranslatedText;
  readonly newCustomerLine: TranslatedText;
  /** "A copy brings every step filled…" */
  readonly hint: TranslatedText;
  readonly none: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/**
 * **Copy for which customer?** (`M06-48`): search, the person's recent leads and *A new customer*;
 * the builder then opens on the lead picked, every step filled from the proposal copied.
 */
export interface PickLeadSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: PickLeadWords;
  readonly query: string;
  readonly onQuery: (query: string) => void;
  readonly leads: Read<readonly PickLeadRow[]>;
  /** The lead whose copy is being started. */
  readonly pendingId: string | null;
  readonly failure: TranslatedText | null;
  readonly onPick: (leadId: string) => void;
  readonly onNewCustomer: () => void;
  readonly focusAfter: FocusAfter;
}
