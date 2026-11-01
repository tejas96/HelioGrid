import type {
  BillingDocumentRow,
  BillingHistory,
  BillingReminders,
  TranslatedText,
} from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import { billingAsksOf } from './BillingHome.asks';
import { invoiceRowOf } from './BillingHome.logic';
import type { BillingPage, BillingScreenState } from './BillingHome.page';
import type {
  BillingCancelWords,
  BillingInvoiceListProps,
  BillingInvoiceListWords,
  BillingRefundWords,
  BillingSheetsView,
  BillingTimelineWords,
} from './BillingHome.parts.types';
import { historyItemsOf, reminderItemsOf } from './BillingHome.records';

/** A record list's read as `@heliogrid/data`'s list hooks hold it: its rows and whether more remain. */
interface BillingListState<T> {
  readonly read: Read<readonly T[]>;
  readonly total: number;
  readonly more: boolean;
  showMore(): void;
}

/** The three record lists' hooks, each reading only while its list is open. */
export interface BillingListsState {
  readonly invoices: BillingListState<BillingDocumentRow> & {
    readonly query: string;
    readonly chip: BillingInvoiceListProps['chip'];
    readonly counts: BillingInvoiceListProps['counts'];
    search(query: string): void;
    choose(chip: BillingInvoiceListProps['chip']): void;
  };
  readonly reminders: BillingListState<BillingReminders['items'][number]> & {
    readonly upcoming: BillingReminders['next'];
  };
  readonly history: BillingListState<BillingHistory['items'][number]>;
}

/** The lists' and asks' words — `@heliogrid/i18n`'s `billingSheetsWords` gives them. */
export interface BillingSheetsWords {
  readonly invoiceList: BillingInvoiceListWords;
  readonly reminders: BillingTimelineWords;
  readonly history: BillingTimelineWords;
  readonly reminder: Parameters<typeof reminderItemsOf>[2];
  /** Why a plan's state changed, as `Plan history` says it. */
  cause(cause: string): TranslatedText;
  readonly cancel: BillingCancelWords;
  readonly refund: BillingRefundWords;
}

function rowsOf<T>(read: Read<readonly T[]>): readonly T[] {
  return read.kind === 'ready' ? read.value : [];
}

/**
 * The page's record lists and its two asks (decisions 12–15, D9), as both screens open them: one
 * stands open at a time, and an ask's failure is said in the ask.
 */
export function billingSheetsViewOf(
  screen: BillingScreenState,
  lists: BillingListsState,
  page: BillingPage,
  words: BillingSheetsWords,
): BillingSheetsView {
  const { sheet } = screen;
  const { format } = page.input;
  const asks = page.home === null ? null : billingAsksOf(page.home, format);
  const documents = lists.invoices;
  const rows = rowsOf(documents.read).map((row) => invoiceRowOf(row, page.input));
  return {
    invoices: {
      open: sheet === 'invoices',
      onClose: screen.closeSheet,
      words: words.invoiceList,
      read: documents.read,
      rows,
      query: documents.query,
      chip: documents.chip,
      counts: documents.counts,
      range:
        rows.length === 0
          ? null
          : words.invoiceList.range(
              format.number(1),
              format.number(rows.length),
              format.number(documents.total),
            ),
      source: page.view.invoices?.source ?? null,
      more: documents.more,
      pendingPdf: screen.pendingPdf,
      onSearch: documents.search,
      onChip: documents.choose,
      onShowMore: documents.showMore,
      onPdf: screen.openPdf,
    },
    reminders: {
      open: sheet === 'reminders',
      onClose: screen.closeSheet,
      words: words.reminders,
      read: lists.reminders.read,
      items: reminderItemsOf(
        rowsOf(lists.reminders.read),
        lists.reminders.upcoming,
        words.reminder,
        format,
      ),
      more: lists.reminders.more,
      onShowMore: lists.reminders.showMore,
    },
    history: {
      open: sheet === 'history',
      onClose: screen.closeSheet,
      words: words.history,
      read: lists.history.read,
      items: historyItemsOf(
        rowsOf(lists.history.read),
        { stateWord: page.input.words.stateWord, cause: words.cause },
        format,
      ),
      more: lists.history.more,
      onShowMore: lists.history.showMore,
    },
    cancel:
      asks === null
        ? null
        : {
            open: sheet === 'cancel',
            onClose: screen.closeSheet,
            words: words.cancel,
            runsUntil: asks.runsUntil,
            chosen: screen.reason,
            onChoose: screen.chooseReason,
            onSkip: () => screen.cancel(null),
            onConfirm: () => screen.cancel(screen.reason),
            pending: screen.acting === 'cancel',
            failure: page.failureOf('cancel'),
          },
    refund:
      asks?.refund == null
        ? null
        : {
            open: sheet === 'refund',
            onClose: screen.closeSheet,
            words: words.refund,
            amount: asks.refund,
            onConfirm: screen.refund,
            pending: screen.acting === 'refund',
            failure: page.failureOf('refund'),
          },
  };
}
