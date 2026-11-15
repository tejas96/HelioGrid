import {
  formatMinorUnits,
  type MarketPack,
  minorUnits,
  packLabel,
  paymentModeLabel,
  type UiLanguage,
} from '@heliogrid/domain';
import { projectNumberOf, receiptNumberOf } from '@heliogrid/domain/server';
import { receiptMessage, type Translator } from '@heliogrid/i18n';

/** What a receipt's text states (`M11-41`): the payment, its part and who recorded it. */
export interface ReceiptTextFacts {
  readonly receiptNumber: number;
  readonly company: string;
  readonly customer: string;
  readonly projectNumber: number;
  readonly part: string;
  readonly amountMinor: number;
  readonly mode: string | null;
  readonly receivedOn: string | null;
  readonly reference: string | null;
  readonly recorder: string;
}

/** A mode as the market pack names it, in the reader's language. */
export function paymentModeIn(pack: MarketPack, mode: string | null, language: UiLanguage): string {
  if (mode === null) return '';
  const label = paymentModeLabel(pack.formats.vocabulary, mode);
  return label === null ? mode : packLabel(label, language);
}

/**
 * The receipt as text, in the reader's language (`F3-06`): one wording for the payments screen and
 * the customer's link, which both say a person recorded the money, never a bank (`M11-42`, `F5-59`).
 */
export function receiptTextOf(
  t: Translator['t'],
  pack: MarketPack,
  language: UiLanguage,
  facts: ReceiptTextFacts,
): string {
  return receiptMessage(t, {
    number: receiptNumberOf(facts.receiptNumber),
    company: facts.company,
    customer: facts.customer,
    project: projectNumberOf(facts.projectNumber),
    part: facts.part,
    /* A receipt states what was received to the minor unit: ₹19,057.50, never ₹19,058 (`F1-07`). */
    amount: formatMinorUnits(pack.formats, minorUnits(facts.amountMinor)),
    mode: paymentModeIn(pack, facts.mode, language),
    date: facts.receivedOn ?? '',
    reference: facts.reference,
    recorder: facts.recorder,
  });
}
