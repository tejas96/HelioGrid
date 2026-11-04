import type { BillingStanding, TranslatedText } from '@heliogrid/contracts';
import { type BillingStripFact, billingStripFactOf } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import { capView } from './BillingStrip.caps';
import { dunningView } from './BillingStrip.dunning';
import {
  type ActSpec,
  actOf,
  actSpec,
  type BillingStripContext,
  type BillingStripFacts,
  dated,
  EMPTY,
  ownerOf,
  type StripFacts,
  workingOf,
} from './BillingStrip.facts';
import type { BillingStripView } from './BillingStrip.types';
import { plain } from './BillingStrip.values';

export type { BillingStripContext, BillingStripFacts } from './BillingStrip.facts';

/** The shell's strip for the one fact domain says speaks, or `null` when none does. */
export function billingStripOf(
  facts: BillingStripFacts,
  context: BillingStripContext,
): BillingStripView | null {
  return stripOf({ ...facts, withAct: true }, context);
}

/**
 * Billing Home's and Plan Selection's own strip: no act, no amount and no cap, since `Needs you`
 * and the plans carry them, and no trial count, which their plan chip carries. It shows its state
 * to whoever opens the page (`M12-56`: seeing state is everyone's); the shell's banner audience
 * (`M12-40`) is the shell's.
 */
export function pageStripOf(
  standing: BillingStanding,
  context: BillingStripContext,
): BillingStripView | null {
  return stripOf(
    {
      standing,
      signals: [],
      audience: 'owner',
      home: null,
      usage: null,
      methodName: null,
      scope: null,
      withAct: false,
    },
    context,
  );
}

function stripOf(facts: StripFacts, context: BillingStripContext): BillingStripView | null {
  const { standing } = facts;
  const fact = billingStripFactOf({
    phase: standing.phase,
    stateEnteredAt: Date.parse(standing.stateEnteredAt),
    trialEndsAt: standing.trialEndsAt === null ? null : Date.parse(standing.trialEndsAt),
    signals: facts.signals.map((signal) => ({
      meter: signal.meter,
      step: signal.usage.step,
      pausesAt: signal.usage.pausesAt === null ? null : Date.parse(signal.usage.pausesAt),
      resetsAt: signal.usage.resetsAt === null ? null : Date.parse(signal.usage.resetsAt),
    })),
    audience: facts.audience,
    now: context.now,
  });
  return viewOf(fact, facts, context);
}

function viewOf(
  fact: BillingStripFact,
  facts: StripFacts,
  context: BillingStripContext,
): BillingStripView | null {
  const { words, format } = context;
  const owner = ownerOf(facts, context);
  switch (fact.kind) {
    case 'none':
      return null;
    case 'trial_chip':
      if (!facts.withAct) return null;
      return {
        ...EMPTY,
        kind: 'bundle',
        variant: 'pill',
        title: words.trialDaysLeft(fact.daysLeft),
      };
    case 'trial_prominent':
      if (!facts.withAct) return null;
      return {
        ...EMPTY,
        kind: 'state',
        title: words.trialDaysLeft(fact.daysLeft),
        rows: [dated('ends', words.trialEnds, format.date(new Date(fact.endsAt)))],
        ...actOf(facts, actSpec(words.pickPlan, 'plans')),
      };
    case 'expired':
      return deadView(
        facts,
        context,
        words.trialEndedOn(trialEnd(facts, format)),
        'expired',
        actSpec(words.pickPlan, 'plans'),
      );
    case 'halted':
      return {
        ...deadView(facts, context, words.haltedTitle, 'halted', owner.reactivate),
        working: facts.withAct ? workingOf(null, facts, context) : null,
      };
    case 'cancelled':
      return deadView(
        facts,
        context,
        words.subscriptionEnded,
        'cancelled_post_period',
        owner.reactivate,
      );
    case 'dunning':
      return dunningView(fact, facts, context, owner);
    case 'cap':
      return capView(fact, facts, context);
  }
}

function trialEnd(facts: BillingStripFacts, format: MarketFormat): string {
  return format.date(facts.standing.trialEndsAt ?? facts.standing.stateEnteredAt);
}

/** A dead state: what paused and the four things that always work (`BM-32`). */
function deadView(
  facts: StripFacts,
  { words }: BillingStripContext,
  title: TranslatedText,
  phase: 'halted' | 'expired' | 'cancelled_post_period',
  act: ActSpec,
): BillingStripView {
  const { paused, stillWorks } = words.matrix(phase);
  return {
    ...EMPTY,
    kind: phase === 'expired' ? 'state' : 'dunning',
    title,
    rows: [
      { key: 'paused', mark: 'paused', label: words.paused, value: plain(paused) },
      { key: 'works', mark: 'works', label: words.stillWorks, value: plain(stillWorks) },
    ],
    ...actOf(facts, act),
  };
}
