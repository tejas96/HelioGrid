'use client';
import { proposalMoments } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';

/**
 * How every proposal page prints the tenant's facts: money as a headline amount (a zero fraction
 * left unsaid, never rounded), a size, and a moment on the company's clock.
 */
export function useProposalFormats() {
  const { t, locale } = useI18n();
  const format = useFormat();
  const moments = proposalMoments(t, { pack: format.pack, language: locale, now: Date.now() });
  return {
    t,
    locale,
    format,
    formats: {
      money: (amount: string, beside?: readonly string[]) => format.moneyPlain(amount, beside),
      number: (value: number) => format.number(value),
      when: moments.when,
      ago: moments.ago,
      /** A payment stage as the customer's document names it — "Before dispatch". */
      due: (stage: string) => format.word('stage', stage),
      day: (date: string) => format.date(date),
      /** A number in the company's grouping — a row's name while its customer has none. */
      phone: (e164: string) => format.phone(e164),
    },
  };
}
