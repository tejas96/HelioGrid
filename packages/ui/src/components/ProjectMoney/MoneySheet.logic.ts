import type { TranslatedText } from '@heliogrid/contracts';
import type { MarketFormat } from '../../utils/format';
import type { MoneySheetForm, MoneySheetWords } from './ProjectMoney.parts.types';

/** Each money sheet's head: its title, and the line under it naming the part or what it does. */
export function sheetHeadOf(
  form: MoneySheetForm,
  words: MoneySheetWords,
  format: MarketFormat,
): { readonly title: TranslatedText; readonly line: TranslatedText | null } {
  switch (form.kind) {
    case 'collect':
      return {
        title: words.collectTitle(format.money(form.request.amount)),
        line: words.collectLead(form.projectName, form.part.label),
      };
    case 'record':
      return {
        title: words.recordTitle,
        line: words.recordLead(form.part.label, format.money(form.part.outstanding)),
      };
    case 'reverse':
      return { title: words.reverseTitle(format.money(form.amount)), line: words.reverseLine };
    case 'waive':
      return {
        title: words.waiveTitle(form.part.label),
        line: words.waiveLine(format.money(form.part.outstanding)),
      };
  }
}

/**
 * The collect sheet's two ways to pay. It opens on UPI, the everyday way; on the bank only above
 * the market's UPI limit, or where the company has bank details and no UPI ID yet — so a company
 * with neither first reads how to add its UPI ID.
 */
export type CollectWay = 'upi' | 'bank';

export function firstWayOf(form: Extract<MoneySheetForm, { kind: 'collect' }>): CollectWay {
  const { request, payTo } = form;
  if (request.overUpiLimit) return 'bank';
  return request.upiUri === null && payTo.bank !== null ? 'bank' : 'upi';
}

/** The record sheet's amount starts as what the part still owes, the server's figure as sent. */
export function startAmountOf(form: Extract<MoneySheetForm, { kind: 'record' }>): string {
  return form.part.outstanding;
}

/** A reference as typed, or null when nothing was typed. */
export function referenceOf(typed: string): string | null {
  const trimmed = typed.trim();
  return trimmed === '' ? null : trimmed;
}
