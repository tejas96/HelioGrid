import { LANGUAGES } from '@heliogrid/domain';
import { proposalMoments } from '@heliogrid/i18n';
import { useI18n } from '@heliogrid/i18n/react';
import { useFormat } from '@heliogrid/ui';

/**
 * How every proposal screen on the phone prints the company's facts: money as a headline amount —
 * a zero fraction left unsaid, never rounded — a size, and a moment on the company's own clock.
 */
export function useProposalFormats() {
  const i18n = useI18n();
  const format = useFormat();
  const { when, ago } = proposalMoments(i18n.t, {
    pack: format.pack,
    language: i18n.locale,
    now: Date.now(),
  });
  const money = (amount: string, beside?: readonly string[]) => format.moneyPlain(amount, beside);
  return {
    t: i18n.t,
    locale: i18n.locale,
    format,
    formats: {
      money,
      number: format.number,
      when,
      ago,
      /** A payment stage as the customer's document names it — "Before dispatch". */
      due: (stage: string) => format.word('stage', stage),
      day: (date: string) => format.date(date),
      /** A number in the company's grouping — a row's name while its customer has none. */
      phone: (e164: string) => format.phone(e164),
    },
  };
}

/**
 * A language by its own name (`हिन्दी`), for the line that says which language a composed message
 * is written in. The phone's engine has no `Intl.DisplayNames`, so the name is the set's own; a
 * language a newer server names reads as its code.
 */
export const languageNameOf = (language: string): string =>
  Object.entries(LANGUAGES).find(([code]) => code === language)?.[1].endonym ?? language;
