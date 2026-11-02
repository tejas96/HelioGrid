import type { PublicPricingRead, TranslatedText } from '@heliogrid/contracts';
import {
  type BillingCycle,
  FIGURE_SLOT,
  type ScaledPower,
  type TierLimit,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { PRICING } from './pricing';

/**
 * A plan's figures in the reader's words, as the pricing page (`SCR-M12-01`) and the plans screen
 * (`SCR-M12-03`) both print them. Every value is the book's, through the api; this only says it —
 * a count in the market's grouping, a power in its unit, a negotiated limit as `Custom`.
 */

type T = Translator['t'];

/** The market format's two calls these words need — `@heliogrid/ui`'s `MarketFormat` has them. */
export interface PlanFormat {
  number(value: number): string;
  money(value: string): string;
}

/** A design ceiling as printed: a power in its unit, no ceiling, or negotiated. */
export type PlanPower = ScaledPower | 'unlimited' | 'custom';

export type BookPlan = PublicPricingRead['plans'][number];

export interface PlanWords {
  limit(limit: TierLimit): string;
  power(power: PlanPower): string;
  storage(limit: TierLimit): string;
  /** A bundle of 0 is a real zero — the plan prices voice per minute — so it reads `None`. */
  voiceIncluded(limit: TierLimit): string;
  /** `null` is the named gap: the book has not published this rate (`BM-26`). */
  voiceRate(plan: Pick<BookPlan, 'voiceMinuteRate'>): TranslatedText | null;
  money(value: string): string;
}

export function planWords(t: T, format: PlanFormat): PlanWords {
  const limit = (value: TierLimit): string => {
    if (value === 'unlimited') return t(PRICING.unlimited);
    if (value === 'custom') return t(PRICING.custom);
    return format.number(value);
  };
  return {
    limit,
    power: (power) =>
      typeof power === 'string'
        ? limit(power)
        : t(PRICING.power, { amount: format.number(power.amount), unit: power.unit }),
    storage: (value) =>
      typeof value === 'number'
        ? t(PRICING.storageGb, { amount: format.number(value) })
        : limit(value),
    voiceIncluded: (value) => (value === 0 ? t(PRICING.none) : limit(value)),
    voiceRate(plan) {
      const rate = plan.voiceMinuteRate;
      if (rate.kind === 'unpublished') return null;
      if (rate.kind === 'custom') return t(PRICING.custom);
      return t(PRICING.perMinute, { value: format.money(rate.rate) });
    },
    money: (value) => format.money(value),
  };
}

/**
 * The card's headline: the cycle's price, or Enterprise's anchor `From … a month` (`BM-15`). The
 * anchor's words sit before or after the figure as the reader's language orders them.
 */
export interface PlanFigure {
  readonly lead: string | null;
  readonly figure: string;
  readonly trail: string | null;
  readonly period: TranslatedText;
}

function around(sentence: string): { lead: string | null; trail: string | null } {
  const [before = '', after = ''] = sentence.split(FIGURE_SLOT);
  return { lead: before.trim() || null, trail: after.trim() || null };
}

export function planFigure(
  plan: Pick<BookPlan, 'price'>,
  cycle: BillingCycle,
  t: T,
  words: PlanWords,
): PlanFigure {
  const { price } = plan;
  if (price.kind === 'anchored') {
    return {
      ...around(t(PRICING.fromPrice, { price: FIGURE_SLOT })),
      figure: words.money(price.from),
      period: t(price.per === 'yearly' ? PRICING.aYear : PRICING.aMonth),
    };
  }
  return {
    lead: null,
    trail: null,
    figure: words.money(price.perCycle[cycle]),
    period: t(cycle === 'yearly' ? PRICING.aYear : PRICING.aMonth),
  };
}

/** `Limits — 500 kW · 300 proposals a month`: the card's ONE flowing line (`SCR-M12-01` redesign). */
export function planLimitsLine(
  plan: Pick<BookPlan, 'proposalsPerMonth'>,
  power: PlanPower,
  t: T,
  words: PlanWords,
): { key: string; label: TranslatedText; values: string[] } {
  return {
    key: 'limits',
    label: t(PRICING.limits),
    values: [
      words.power(power),
      t(PRICING.proposalsAMonth, { count: words.limit(plan.proposalsPerMonth) }),
    ],
  };
}
