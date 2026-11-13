import type { TranslatedText } from '@heliogrid/contracts';
import type { MessageRef, Translator } from '../runtime';

/**
 * The owner's monthly summary (`M13-21`): the month just ended in four figures, written in-app on
 * the first of the month. The api renders it in the RECIPIENT's language when it emits and stores
 * it as written (`F6-08`). Every figure arrives already formatted — money in the company's market
 * format, the month in the reader's words — so a word beside a value stays one message with it.
 */
const MONTHLY_SUMMARY_NOTICE = {
  title: /*i18n*/ { id: '{month} in four figures' },
  bodyWithRate: /*i18n*/ {
    id: 'Collected {collected} · won {wonCount} worth {wonAmount} · {lostCount} lost · win rate {rate}%',
  },
  bodyTooFew: /*i18n*/ {
    id: 'Collected {collected} · won {wonCount} worth {wonAmount} · {lostCount} lost · too few closed deals for a win rate yet',
  },
} satisfies Record<string, MessageRef>;

interface NoticeText {
  title: TranslatedText;
  body: TranslatedText;
}

/** The month's figures as the notice states them; `rate` is `null` while too few deals closed. */
export interface MonthlySummaryFigures {
  readonly month: string;
  readonly collected: string;
  readonly wonCount: number;
  readonly wonAmount: string;
  readonly lostCount: number;
  readonly rate: string | null;
}

export function monthlySummaryNotice(
  translate: Translator['t'],
  figures: MonthlySummaryFigures,
): NoticeText {
  const { month, rate, ...counts } = figures;
  return {
    title: translate(MONTHLY_SUMMARY_NOTICE.title, { month }),
    body:
      rate === null
        ? translate(MONTHLY_SUMMARY_NOTICE.bodyTooFew, counts)
        : translate(MONTHLY_SUMMARY_NOTICE.bodyWithRate, { ...counts, rate }),
  };
}
