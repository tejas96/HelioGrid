import type { TranslatedText } from '@heliogrid/contracts';
import type { DesignPower, PricingPlan } from '@heliogrid/data/react';
import type { BillingCycle, TierLimit } from '@heliogrid/domain';
import { PRICING } from '@heliogrid/i18n';
import type { useTranslate } from '@heliogrid/i18n/react';
import type { MarketFormat } from '@heliogrid/ui';

/**
 * A plan's figures in the reader's words. Every value is the book's, through the api; this only
 * says it — a count in the market's grouping, a power in its unit, a negotiated limit as `Custom`.
 */
export type Translate = ReturnType<typeof useTranslate>;

export interface PlanWords {
  limit(limit: TierLimit): string;
  power(power: DesignPower): string;
  storage(limit: TierLimit): string;
  /** A bundle of 0 is a real zero — the plan prices voice per minute — so it reads `None`. */
  voiceIncluded(limit: TierLimit): string;
  /** `null` is the named gap: the book has not published this rate (`BM-26`). */
  voiceRate(plan: PricingPlan): TranslatedText | null;
  money(value: string): string;
}

export function planWords(t: Translate, format: MarketFormat): PlanWords {
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

/** A U+0000 stands in for the figure, so the words around it are the translation's own. */
const FIGURE_SLOT = '\u0000';

function around(sentence: string): { lead: string | null; trail: string | null } {
  const [before = '', after = ''] = sentence.split(FIGURE_SLOT);
  return { lead: before.trim() || null, trail: after.trim() || null };
}

export function planFigure(
  plan: PricingPlan,
  cycle: BillingCycle,
  t: Translate,
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
