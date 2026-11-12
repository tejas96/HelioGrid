import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BankFactsProps,
  CollectionsSettingsProps,
  CollectionsSettingsWords,
} from './CollectionsSettings.types';

/** Why the save did not land, said at the UPI ID field. */
export function failureOf(
  failure: CollectionsSettingsProps['failure'],
  words: CollectionsSettingsWords,
): TranslatedText | undefined {
  if (failure === 'malformed') return words.malformed;
  if (failure === 'failed') return words.failed;
  return undefined;
}

/** The bank account's facts in the order a payer reads them; account and routing numbers in mono. */
export function bankFactsOf({ bank, words }: BankFactsProps) {
  return [
    { key: 'name', term: words.accountName, value: bank.accountName, mono: false },
    { key: 'number', term: words.accountNumber, value: bank.accountNumber, mono: true },
    { key: 'routing', term: words.routing, value: bank.routing, mono: true },
    { key: 'bank', term: words.bankName, value: bank.bankName, mono: false },
  ];
}
