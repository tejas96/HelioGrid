import type { CollectionsSettings, PayTo, TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';

/**
 * How customers pay the company (`SCR-M11-04`, owner ruling 2026-11-11): its own UPI ID and the
 * name a UPI app shows, a one-rupee request to test them from a phone, the bank account its
 * business profile holds, and the ways a payment is recorded. Only the owner changes where money
 * goes; the save is one act and its refusal is said at the field.
 */
export interface CollectionsSettingsWords {
  readonly lead: TranslatedText;
  readonly upi: TranslatedText;
  readonly upiId: TranslatedText;
  readonly upiIdHint: TranslatedText;
  readonly payee: TranslatedText;
  readonly testTitle: TranslatedText;
  readonly testLine: (payee: string) => TranslatedText;
  readonly qrLabel: TranslatedText;
  readonly qrFailedTitle: TranslatedText;
  readonly qrFailedMessage: TranslatedText;
  readonly bank: TranslatedText;
  /** Why big amounts go by bank: above the market's UPI cap, formatted. */
  readonly bankLine: (limit: string) => TranslatedText;
  readonly noBankYet: TranslatedText;
  readonly editBank: TranslatedText;
  readonly accountName: TranslatedText;
  readonly accountNumber: TranslatedText;
  readonly bankName: TranslatedText;
  readonly routing: TranslatedText;
  readonly ways: TranslatedText;
  readonly waysLine: TranslatedText;
  readonly mode: (mode: string) => TranslatedText;
  readonly save: TranslatedText;
  readonly malformed: TranslatedText;
  readonly failed: TranslatedText;
  readonly ownerOnly: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

export interface CollectionsSettingsProps {
  readonly read: Exclude<Read<CollectionsSettings>, { readonly kind: 'empty' }>;
  readonly words: CollectionsSettingsWords;
  /** Who saved last and when, said under the lead; `null` before the first save. */
  readonly savedLine: TranslatedText | null;
  readonly saving: boolean;
  readonly failure: 'malformed' | 'failed' | null;
  /** What the two fields hold — the saved values until the owner types (the screen's draft). */
  readonly draft: { readonly upiId: string; readonly payee: string };
  readonly onEdit: (next: { readonly upiId?: string; readonly payee?: string }) => void;
  /** Something typed may be saved. On the phone the save rides the page's act bar, above the keyboard. */
  readonly changed: boolean;
  readonly onSave: () => void;
  readonly onEditBank: () => void;
  readonly focusAfter: FocusAfter;
}

/** The company's bank account as a customer pays into it: term beside value, numbers in mono. */
export interface BankFactsProps {
  readonly bank: NonNullable<PayTo['bank']>;
  readonly words: {
    readonly accountName: TranslatedText;
    readonly accountNumber: TranslatedText;
    readonly routing: TranslatedText;
    readonly bankName: TranslatedText;
  };
}
