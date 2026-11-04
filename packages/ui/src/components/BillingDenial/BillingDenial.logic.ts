import type { EntitlementBlocked } from '@heliogrid/contracts';
import {
  type ActSpec,
  actSpec,
  type BillingStripContext,
  type BillingStripFacts,
  dated,
  ownerOf,
  payActOf,
} from '../BillingStrip/BillingStrip.facts';
import type { BillingStripRow } from '../BillingStrip/BillingStrip.types';
import { plain } from '../BillingStrip/BillingStrip.values';
import type { BillingDenialView } from './BillingDenial.types';

/** What the denial reads beside the refusal: the Owner's way to pay, or whose act it is. */
export type BillingDenialFacts = Pick<
  BillingStripFacts,
  'audience' | 'home' | 'methodName' | 'scope'
>;

/** A cap's entitlement key as the strip's meters name it. */
const METER_OF_KEY: Record<string, string> = {
  proposals_per_cycle: 'proposals',
  storage_gb: 'storage',
};

/**
 * The denial for one refusal (`M12-21`, `M12-31`): a billing state's lists are the matrix's
 * (`pauseNoticeOf`), a cap's are the cap's own (decision 9); the act is the strip's for that state.
 */
export function billingDenialOf(
  blocked: EntitlementBlocked,
  facts: BillingDenialFacts,
  context: BillingStripContext,
): BillingDenialView {
  const { words } = context;
  const title = words.denied(blocked.capability);
  if (blocked.reason === 'cap') {
    const meter = METER_OF_KEY[blocked.key] ?? blocked.key;
    const keeps = [words.existing(meter), words.reading, words.export, words.everyOtherFeature];
    return withAct(facts, actSpec(words.upgradePlan, 'plans'), {
      overline: words.limitOverline(meter),
      title,
      rows: [
        ...lists(context, plain(words.newOnes(meter)), plain(keeps.join(' · '))),
        // A cycle's count pauses until it resets; a ceiling no cycle resets lifts only by upgrade.
        ...(blocked.resetsAt === null
          ? []
          : [dated('resets', words.cycleResets, context.format.date(blocked.resetsAt))]),
      ],
    });
  }
  const { paused, stillWorks } = words.matrix(blocked.phase);
  return withAct(facts, phaseAct(blocked.phase, facts, context), {
    overline: words.overline(blocked.phase),
    title,
    rows: lists(context, plain(paused), plain(stillWorks)),
  });
}

function lists(
  { words }: BillingStripContext,
  paused: BillingStripRow['value'],
  works: BillingStripRow['value'],
): BillingStripRow[] {
  return [
    { key: 'paused', mark: 'paused', label: words.paused, value: paused },
    { key: 'works', mark: 'works', label: words.stillWorks, value: works },
  ];
}

/** The act that ends a state's pause: pay, start again, or pick a first plan (`pauseNoticeOf`). */
function phaseAct(
  phase: Extract<EntitlementBlocked, { reason: 'billing_state' }>['phase'],
  facts: BillingDenialFacts,
  context: BillingStripContext,
): ActSpec {
  const owner = ownerOf(facts, context);
  switch (phase) {
    case 'past_due_full_function':
    case 'past_due_metered_paused':
      return payActOf(facts, context, owner, 'metered');
    case 'halted':
    case 'cancelled_post_period':
      return owner.reactivate;
    case 'expired':
    case 'trialing':
    case 'active':
      return actSpec(context.words.pickPlan, 'plans');
  }
}

function withAct(
  facts: BillingDenialFacts,
  spec: ActSpec,
  view: Omit<BillingDenialView, 'act' | 'scope'>,
): BillingDenialView {
  if (facts.audience !== 'owner') return { ...view, act: null, scope: facts.scope };
  return {
    ...view,
    act: { label: spec.sentence, figures: spec.figures, spoken: spec.spoken, go: spec.go },
    scope: null,
  };
}
