import type { BillingStripFact } from '@heliogrid/domain';
import {
  actOf,
  type BillingStripContext,
  dated,
  EMPTY,
  type OwnerFigures,
  payActOf,
  type StripFacts,
  workingOf,
} from './BillingStrip.facts';
import type { BillingStripRow, BillingStripView } from './BillingStrip.types';
import { figure, plain } from './BillingStrip.values';

/** Days 0–6 of a failed charge (`M12-39`, decisions 7 and 8). */
export function dunningView(
  fact: Extract<BillingStripFact, { kind: 'dunning' }>,
  facts: StripFacts,
  context: BillingStripContext,
  owner: OwnerFigures,
): BillingStripView {
  const { words, format } = context;
  const { standing } = facts;
  const date = (at: string | null) => (at === null ? null : format.date(at));
  const pausesOn = date(standing.pausesAt);
  const haltsOn = date(standing.graceEndsAt);
  const metered = words.matrix('past_due_metered_paused');
  const amountRow: BillingStripRow[] =
    fact.rung === 'early' && owner.owed !== null && facts.withAct
      ? [{ key: 'amount', mark: 'amount', label: words.amountDue, value: figure(owner.owed) }]
      : [];
  const rows: BillingStripRow[] =
    fact.rung === 'early'
      ? [
          {
            key: 'works',
            mark: 'works',
            label: words.stillWorks,
            value: plain(words.everythingIncluded),
          },
          ...amountRow,
          ...(pausesOn === null ? [] : [dated('pause', words.meteredPause, pausesOn)]),
        ]
      : [
          { key: 'paused', mark: 'paused', label: words.paused, value: plain(metered.paused) },
          {
            key: 'works',
            mark: 'works',
            label: words.stillWorks,
            value: plain(metered.stillWorks),
          },
          ...(haltsOn === null
            ? []
            : [dated('until', fact.rung === 'final' ? words.accountHalts : words.until, haltsOn)]),
        ];
  const title =
    fact.rung === 'final'
      ? words.finalWarning(fact.day)
      : words.graceTitle(fact.day, fact.rung === 'early');
  return {
    ...EMPTY,
    kind: 'dunning',
    title,
    rows,
    working: facts.withAct ? workingOf(fact.day, facts, context) : null,
    ...actOf(facts, payActOf(facts, context, owner, fact.rung)),
  };
}
