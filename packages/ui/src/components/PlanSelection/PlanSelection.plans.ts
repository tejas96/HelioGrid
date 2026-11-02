import type { BillingStanding, PublicPricingRead } from '@heliogrid/contracts';
import {
  MS_PER_DAY,
  scaledPower,
  TIERS,
  type Tier,
  type TierLimit,
  TRIAL_DAYS,
  tierBand,
  tierStepOf,
} from '@heliogrid/domain';
import { billingHomeViewOf } from '../BillingHome/BillingHome.logic';
import { planChipOf, planOf } from '../BillingHome/BillingHome.plan';
import type { BillingFact } from '../BillingHome/BillingHome.types';
import { fact, figured } from '../BillingHome/BillingHome.values';
import type {
  PlanSelectionFacts,
  PlanSelectionInput,
  PlanSelectionState,
} from './PlanSelection.state';
import type {
  PlanCardView,
  PlanEnterpriseView,
  PlanHeldView,
  PlanPickView,
  PlanReadOnlyView,
} from './PlanSelection.types';
import type { BookPlan, PlanPower } from './PlanSelection.words';

/** The three plans bought through the product (`BM-14`); Enterprise is sold and stands apart. */
const BOUGHT: readonly Tier[] = TIERS.filter((tier) => tierBand(tier) === 'self_serve');

export function powerOf(kw: TierLimit): PlanPower {
  return typeof kw === 'number' ? scaledPower(kw) : kw;
}

/**
 * `Your plan` — Billing's own block (`SCR-M12-02` inherits it from here): the state's chip and its
 * pairs, with no amount under the next bill. The price row and its source line stand only while
 * the plans region prints prices too (frame s3), and the ask only where something is behind it.
 */
export function heldOf(
  facts: PlanSelectionFacts,
  input: PlanSelectionInput,
  priced: boolean,
): PlanHeldView {
  const standing = facts.kind === 'owner' ? facts.home.standing : facts.standing;
  const chip = planChipOf(input.words.view, standing, input.now);
  /* An ended trial is a warning, not yet a loss: it converts from here (frame s4, `M12-53`). */
  const held = { ...chip, tone: standing.state === 'expired' ? ('warning' as const) : chip.tone };
  const own = ownRowsOf(standing, input);
  if (facts.kind === 'member') {
    const member = billingHomeViewOf(
      { kind: 'member', standing: facts.standing, scope: null },
      input.billing,
    ).plan;
    return { chip: held, rows: own ?? member?.rows ?? [], source: null, ask: false };
  }
  const plan = planOf(input.billing, facts.home);
  const dead = input.billing.need === 'way_back' || input.billing.need === 'pick_plan';
  const rows = (own ?? plan.rows)
    .filter((fact) => priced || fact.key !== 'price')
    .map((fact) => ({ ...fact, under: null }));
  return {
    chip: held,
    rows,
    source: priced && rows.some((fact) => fact.key === 'price') ? plan.source : null,
    ask: !dead,
  };
}

/**
 * The rows the plans' frames draw where Billing's differ: a trial names its length and its days
 * left (s11), an ended trial the day it ended (s4), a halted plan the day it halted (s5). The trial's
 * length is the price list's own, else domain's. `null` where Billing's rows are the frame's.
 */
function ownRowsOf(standing: BillingStanding, input: PlanSelectionInput): BillingFact[] | null {
  const { words, format } = input;
  const view = words.view;
  const days = input.book?.trial.days ?? TRIAL_DAYS;
  const date = (value: string | null) => (value === null ? '' : format.date(value));
  const trial = fact('plan', view.plan, words.trialPlan(days));
  switch (standing.state) {
    case 'trialing': {
      const ends = standing.trialEndsAt;
      const left =
        ends === null ? days : Math.max(0, Math.ceil((Date.parse(ends) - input.now) / MS_PER_DAY));
      return [
        trial,
        fact('left', view.daysLeft, view.daysOf(format.number(left), format.number(days))),
        fact('ends', view.ends, date(ends)),
      ];
    }
    case 'expired':
      return [trial, fact('ended', words.trialEnded, date(standing.trialEndsAt))];
    case 'halted':
      return [
        fact('plan', view.plan, standing.tier === null ? view.trial : view.tier(standing.tier)),
        fact('since', view.haltedSince, date(standing.stateEnteredAt)),
      ];
    default:
      return null;
  }
}

/** `Upgrade`, `Downgrade` or the plan held, by the tiers' order — the capacity ladder (`BM-12`). */
function relationOf(input: PlanSelectionInput, tier: Tier) {
  const held = input.heldTier;
  if (held === null) return null;
  if (held === tier) return input.words.yourPlan;
  return tierStepOf(held, tier) === 'higher' ? input.words.upgrade : input.words.downgrade;
}

function cardOf(
  input: PlanSelectionInput,
  tier: Tier,
  row: BookPlan | undefined,
  cycle: PlanPickView['cycle'],
): PlanCardView {
  const { words } = input;
  const held = input.heldTier === tier;
  return {
    tier,
    name: words.view.tier(tier),
    relation: held ? null : relationOf(input, tier),
    current: held,
    figure: row === undefined ? null : words.figure(row, cycle),
    gap: row === undefined ? words.noPrice : null,
    lines: row === undefined ? [] : [words.limitsLine(row, powerOf(row.designCeilingKw))],
  };
}

function enterpriseOf(
  input: PlanSelectionInput,
  row: BookPlan | undefined,
  sales: boolean,
): PlanEnterpriseView {
  const { words } = input;
  const name = words.view.tier('enterprise');
  if (row === undefined) {
    return {
      name,
      chip: null,
      from: null,
      figure: null,
      gap: words.noPrice,
      lines: [],
      sales: false,
    };
  }
  const { price } = row;
  const whole = (amount: string) => input.format.money(amount, { fractionDigits: 0 });
  return {
    name,
    chip: words.annualContract,
    from:
      price.kind === 'anchored'
        ? figured(words.enterpriseFrom(price.per), whole(price.from))
        : null,
    figure: words.figure(row, 'monthly'),
    gap: null,
    lines: [words.limitsLine(row, powerOf(row.designCeilingKw))],
    sales,
  };
}

/**
 * The Owner's plans: one card per plan bought here, in the ladder's order, each keeping its place
 * when this market has no price for it (decision 15); Enterprise beside them; the act's reason.
 */
export function pickOf(
  state: PlanSelectionState,
  input: PlanSelectionInput,
  book: PublicPricingRead,
  taxScheme: string | null,
): PlanPickView {
  const { words } = input;
  const rowOf = (tier: Tier) => book.plans.find((row) => row.tier === tier);
  return {
    kind: 'pick',
    cycle: state.cycle,
    cycles: [
      { value: 'monthly', label: words.monthly },
      { value: 'yearly', label: words.yearly },
    ],
    picked: state.picked,
    cards: BOUGHT.map((tier) => cardOf(input, tier, rowOf(tier), state.cycle)),
    enterprise: enterpriseOf(input, rowOf('enterprise'), state.talkToSales !== null),
    reason: state.picked === null ? words.pickReason : state.pickedIsHeld ? words.heldReason : null,
    source: input.priceList,
    sourceNote: book.taxExcluded && taxScheme !== null ? words.pricesExclude(taxScheme) : null,
  };
}

/** A person who is not the Owner: every plan and which one is theirs (frame s10). */
export function readOnlyOf(input: PlanSelectionInput): PlanReadOnlyView {
  const { words } = input;
  return {
    kind: 'readonly',
    cards: TIERS.map((tier) => ({
      key: tier,
      name: words.view.tier(tier),
      word: tier === 'enterprise' ? words.annualContract : relationOf(input, tier),
    })),
  };
}
