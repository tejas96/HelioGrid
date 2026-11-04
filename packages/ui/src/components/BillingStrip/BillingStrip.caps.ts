import type { BillingUsage } from '@heliogrid/contracts';
import type { BillingStripFact } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import {
  actOf,
  actSpec,
  type BillingStripContext,
  dated,
  EMPTY,
  type StripFacts,
} from './BillingStrip.facts';
import type { BillingStripView } from './BillingStrip.types';
import { plain } from './BillingStrip.values';

/** A meter at its cap (`M12-30`, decision 9): in its grace, paused, or a ceiling at its limit. */
export function capView(
  fact: Extract<BillingStripFact, { kind: 'cap' }>,
  facts: StripFacts,
  { words, format }: BillingStripContext,
): BillingStripView {
  const { meter } = fact;
  const counts = countsOf(meter, facts.usage, format);
  const usedPaused =
    counts === null ? words.limitReached : words.usedPaused(meter, counts.used, counts.limit);
  const usedInGrace =
    counts === null ? words.limitReached : words.usedInGrace(meter, counts.used, counts.limit);
  const keeps = [words.existing(meter), words.reading, words.export];
  const list = (items: readonly string[]) => plain(items.join(' · '));
  const resets = facts.usage?.cycle.resetsAt ?? null;
  const resetOn = fact.resetsAt ?? (resets === null ? null : Date.parse(resets));
  const resetRow =
    resetOn === null ? [] : [dated('resets', words.cycleResets, format.date(new Date(resetOn)))];
  const shared = {
    ...EMPTY,
    kind: 'cap' as const,
    ...actOf(facts, actSpec(words.upgradePlan, 'plans')),
  };
  if (fact.step === 'paused') {
    return {
      ...shared,
      title: words.capPaused(meter, usedPaused),
      rows: [
        { key: 'paused', mark: 'paused', label: words.paused, value: plain(words.newOnes(meter)) },
        {
          key: 'works',
          mark: 'works',
          label: words.stillWorks,
          value: list([...keeps, words.everyOtherFeature]),
        },
        ...resetRow,
      ],
    };
  }
  if (fact.step === 'at_cap') {
    return {
      ...shared,
      title: words.capAtLimit(meter),
      rows: [{ key: 'works', mark: 'works', label: words.stillWorks, value: list(keeps) }],
    };
  }
  return {
    ...shared,
    title: words.capGrace(meter, usedInGrace),
    rows: [
      {
        key: 'works',
        mark: 'works',
        label: words.stillWorks,
        value: list([words.newOnes(meter), ...keeps]),
      },
      ...(fact.pausesAt === null
        ? []
        : [dated('pause', words.pauses(meter), format.date(new Date(fact.pausesAt)))]),
      ...resetRow,
    ],
  };
}

/** The Owner's count against the limit, as the title says it; `null` for anyone else (`M12-56`). */
function countsOf(
  meter: string,
  usage: BillingUsage | null,
  format: MarketFormat,
): { readonly used: string; readonly limit: string } | null {
  if (usage === null) return null;
  const counted =
    meter === 'proposals'
      ? { used: usage.proposals.used, limit: usage.proposals.limit }
      : meter === 'active_projects'
        ? { used: usage.activeProjects.used, limit: usage.activeProjects.limit }
        : meter === 'voice_minutes'
          ? { used: usage.voice.usedMinutes, limit: usage.voice.limit }
          : null;
  if (counted === null || typeof counted.limit !== 'number') return null;
  return { used: format.number(counted.used), limit: format.number(counted.limit) };
}
