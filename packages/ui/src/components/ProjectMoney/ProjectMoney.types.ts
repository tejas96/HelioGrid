import type { ProjectMoneyGlance, ProjectPayments, TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';

/**
 * A project's money (`SCR-M11-02`, design A "Quiet Ledger"): the hero with what to collect now and
 * the money bar, the parts as a timeline, the money received. Every figure is the server's; this
 * draws it through the market's format and never works one out (`F4-04`).
 */

/** The read the screen draws: waiting, failed with its retry, or the payments. */
export type ProjectMoneyRead = Exclude<Read<ProjectPayments>, { readonly kind: 'empty' }>;

export interface ProjectMoneyWords {
  readonly toCollectNow: TranslatedText;
  readonly dueFor: (days: TranslatedText) => TranslatedText;
  readonly partOf: (part: string, position: number, count: number) => TranslatedText;
  readonly partOfWithIn: (
    part: string,
    position: number,
    count: number,
    amount: string,
  ) => TranslatedText;
  readonly partShare: (part: string, share: string) => TranslatedText;
  readonly nothingDue: TranslatedText;
  readonly nothingDueLine: (stage: string) => TranslatedText;
  readonly allIn: TranslatedText;
  readonly legendIn: (amount: string) => TranslatedText;
  readonly legendDue: (amount: string) => TranslatedText;
  readonly legendNext: (amount: string) => TranslatedText;
  readonly moneyBar: (received: string, due: string, next: string) => TranslatedText;
  readonly collect: TranslatedText;
  readonly record: TranslatedText;
  readonly parts: TranslatedText;
  readonly fromTerms: TranslatedText;
  readonly dueAt: (stage: string) => TranslatedText;
  readonly dueSince: (date: string) => TranslatedText;
  readonly left: (amount: string) => TranslatedText;
  readonly receivedOn: (date: string) => TranslatedText;
  readonly waivedBecause: (reason: string) => TranslatedText;
  readonly extra: (amount: string) => TranslatedText;
  readonly sharedBy: (name: string, date: string) => TranslatedText;
  readonly received: TranslatedText;
  readonly nothingReceived: TranslatedText;
  readonly entryLine: (date: string, name: string) => TranslatedText;
  readonly entryReference: (mode: string, reference: string) => TranslatedText;
  readonly reversal: (reason: string) => TranslatedText;
  readonly reversedMark: TranslatedText;
  readonly shareReceipt: TranslatedText;
  readonly receiptPdf: TranslatedText;
  readonly receiptPhoto: TranslatedText;
  readonly addReceiptPhoto: TranslatedText;
  /** A payment whose photo is still uploading after its save (`M11-37`). */
  readonly photoAttaching: TranslatedText;
  readonly reverse: TranslatedText;
  readonly waive: TranslatedText;
  readonly shareRequest: TranslatedText;
  readonly partMenu: (part: string) => TranslatedText;
  readonly entryMenu: (receipt: string) => TranslatedText;
  readonly noScheduleTitle: TranslatedText;
  readonly noScheduleBody: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly loading: TranslatedText;
  readonly retry: TranslatedText;
  readonly offline: TranslatedText;
  readonly days: (count: number) => TranslatedText;
  /** A part's state as its mark says it: glyph, word and tint (`F7-12`). */
  readonly state: (state: string) => TranslatedText;
}

export interface ProjectMoneyProps {
  readonly read: ProjectMoneyRead;
  readonly words: ProjectMoneyWords;
  /** A money act needs the server (`M11-06`): offline, the acts are inert and say why. */
  readonly online: boolean;
  readonly onCollect: (partId: string) => void;
  readonly onRecord: (partId: string) => void;
  readonly onReverse: (entryId: string) => void;
  readonly onWaive: (partId: string) => void;
  readonly onShareRequest: (partId: string) => void;
  readonly onShareReceipt: (entryId: string) => void;
  /** Open the payment's receipt PDF — made on the first ask (`M11-41`). */
  readonly onReceiptPdf: (entryId: string) => void;
  /** Add a receipt photo to a payment saved without one. */
  readonly onAddPhoto: (entryId: string) => void;
  /** The payments whose photo is uploading after the save; each row says so. */
  readonly attaching: readonly string[];
  /** Open a payment's receipt photo in the device's own viewer. */
  readonly onOpenPhoto: (fileId: string) => void;
  /** Where focus goes after *Try again* swaps the failure for the page. */
  readonly focusAfter: FocusAfter;
}

export interface MoneyCardWords {
  readonly money: TranslatedText;
  readonly collectedOf: (collected: string, total: string) => TranslatedText;
  readonly duePartLine: (part: string, amount: string) => TranslatedText;
  readonly dueFor: (days: TranslatedText) => TranslatedText;
  readonly days: (count: number) => TranslatedText;
  readonly sharedBy: (name: string, date: string) => TranslatedText;
  readonly nothingDue: TranslatedText;
  readonly noScheduleTitle: TranslatedText;
  readonly shareRequest: TranslatedText;
  readonly openPayments: TranslatedText;
}

/**
 * The project's Money card (`M11-52`'s one mirror): collected of total, the part due now with its
 * days, and its one act — share the request, which writes no money — beside the way into payments.
 */
export interface MoneyCardProps {
  readonly money: ProjectMoneyGlance;
  /** The company day, so the days a part has waited are counted the same everywhere. */
  readonly today: string;
  readonly words: MoneyCardWords;
  /** Share the due part's request; absent for a reader who may not. */
  readonly onShare?: (partId: string) => void;
  readonly onOpen: () => void;
}
