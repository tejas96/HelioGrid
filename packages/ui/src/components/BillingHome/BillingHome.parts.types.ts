import type { TranslatedText } from '@heliogrid/contracts';
import type { CancellationReason } from '@heliogrid/domain';
import type { SurfaceRead } from '../UnavailableNote/UnavailableNote.types';
import type { BillingInvoiceRow, BillingTableWords, BillingValue } from './BillingHome.types';

/**
 * The record lists and the two asks the billing home opens (decisions 12–15, D9): each a sheet at
 * 375 and a side panel (the lists) or a centred dialog (the asks) at width, through
 * `EditorSurface`. Both halves draw these contracts (Law 7).
 */

export interface BillingInvoiceListWords {
  readonly title: TranslatedText;
  readonly findInList: TranslatedText;
  readonly invoiceState: TranslatedText;
  readonly all: TranslatedText;
  readonly paid: TranslatedText;
  readonly failed: TranslatedText;
  readonly noMatchLine: TranslatedText;
  readonly clearSearch: TranslatedText;
  readonly showMore: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly close: TranslatedText;
  readonly columns: {
    readonly date: TranslatedText;
    readonly forWhat: TranslatedText;
    readonly state: TranslatedText;
    readonly pdf: TranslatedText;
    readonly amount: TranslatedText;
  };
  /** The table at width. */
  readonly table: BillingTableWords;
  noMatch(query: string): TranslatedText;
  range(from: string, to: string, total: string): TranslatedText;
}

/** `All invoices` (decision 12): search, chips with counts, the list at 375, the table at width. */
export interface BillingInvoiceListProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: BillingInvoiceListWords;
  /** The list's own read; a failed one carries its retry. */
  readonly read: SurfaceRead;
  readonly rows: readonly BillingInvoiceRow[];
  readonly query: string;
  readonly chip: 'all' | 'paid' | 'failed';
  /** Each chip's count under the search, in the market's digits. */
  readonly counts: { readonly all: number; readonly paid: number; readonly failed: number };
  /** `1–24 of 24`, at width. */
  readonly range: TranslatedText | null;
  readonly source: TranslatedText | null;
  readonly more: boolean;
  /** The PDF act whose link is being signed: it shows pending. */
  readonly pendingPdf: string | null;
  readonly onSearch: (query: string) => void;
  readonly onChip: (chip: 'all' | 'paid' | 'failed') => void;
  readonly onShowMore: () => void;
  readonly onPdf: (id: string) => void;
}

/** One entry of a compact timeline: what happened, when, and why. */
export interface BillingTimelineItem {
  readonly id: string;
  readonly label: TranslatedText;
  /** The date, in the market's style. */
  readonly meta: string;
  readonly description: TranslatedText | null;
  readonly status: 'done' | 'current' | 'upcoming';
  /** A payment's amount, mono, under its row. */
  readonly figure: string | null;
}

export interface BillingTimelineWords {
  readonly title: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly tryAgain: TranslatedText;
  readonly showMore: TranslatedText;
  readonly nothingYet: TranslatedText;
  readonly close: TranslatedText;
}

/** `Payment reminders` and `Plan history` (decision 13): append-only lists, non-modal at width. */
export interface BillingTimelineProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: BillingTimelineWords;
  /** The list's own read; a failed one carries its retry. */
  readonly read: SurfaceRead;
  readonly items: readonly BillingTimelineItem[];
  readonly more: boolean;
  readonly onShowMore: () => void;
}

export interface BillingCancelWords {
  readonly title: TranslatedText;
  readonly subtitle: TranslatedText;
  readonly whyLeaving: TranslatedText;
  readonly runsUntil: TranslatedText;
  readonly yourData: TranslatedText;
  readonly kept: TranslatedText;
  readonly skip: TranslatedText;
  readonly act: TranslatedText;
  readonly close: TranslatedText;
  reason(reason: CancellationReason): TranslatedText;
}

/**
 * The cancel ask (`M12-50`, decision 15): the reasons as a list, `Skip` always offered — a reason
 * is never a gate — and `Runs until` with `Your data · Kept`. Its act is `destructive`.
 */
export interface BillingCancelAskProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: BillingCancelWords;
  /** The paid period's last day, in the market's style. */
  readonly runsUntil: string;
  readonly chosen: CancellationReason | null;
  readonly onChoose: (reason: CancellationReason) => void;
  /** Cancels with no reason. */
  readonly onSkip: () => void;
  /** Cancels with the chosen reason. */
  readonly onConfirm: () => void;
  readonly pending: boolean;
  /** Why it did not land, said in the ask. */
  readonly failure: TranslatedText | null;
}

export interface BillingRefundWords {
  readonly title: TranslatedText;
  readonly subtitle: TranslatedText;
  readonly refund: TranslatedText;
  readonly ends: TranslatedText;
  readonly today: TranslatedText;
  readonly yourData: TranslatedText;
  readonly kept: TranslatedText;
  readonly keep: TranslatedText;
  readonly act: TranslatedText;
  readonly close: TranslatedText;
}

/**
 * The refund's one ask (D9, `F8-34`): it ends the plan today, so what stops is shown before the
 * act — composed as the cancel ask is, rows and a `destructive` act.
 */
export interface BillingRefundAskProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: BillingRefundWords;
  readonly amount: BillingValue;
  readonly onConfirm: () => void;
  readonly pending: boolean;
  readonly failure: TranslatedText | null;
}

/**
 * The page's record lists and its two asks together, as `BillingSheets` draws them — one stands
 * open at a time; an ask is `null` where the person has none (not the Owner).
 */
export interface BillingSheetsView {
  readonly invoices: BillingInvoiceListProps;
  readonly reminders: BillingTimelineProps;
  readonly history: BillingTimelineProps;
  readonly cancel: BillingCancelAskProps | null;
  readonly refund: BillingRefundAskProps | null;
}
