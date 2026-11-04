import type { PublicPricingRead } from '@heliogrid/contracts';
import type { Tier } from '@heliogrid/domain';
import type { CompareAttribute, CompareOption } from '../CompareGrid';
import { powerOf } from './PlanSelection.plans';
import type { PlanSelectionInput, PlanSelectionState } from './PlanSelection.state';
import type { PlanCompareView, PlanSet } from './PlanSelection.types';
import type { BookPlan } from './PlanSelection.words';

/**
 * The comparison's rows for one set (decision 6): `Limits` · `Included` · `Extra charges`. The
 * table carries the period with the value; the money column ends on one right edge (`F7-09`).
 */
function attributesOf(input: PlanSelectionInput, set: PlanSet): CompareAttribute[] {
  const { limits } = input.words.view;
  if (set === 'included') {
    return [
      { key: 'voice', label: limits.voiceMinutes },
      { key: 'storage', label: limits.storage },
    ];
  }
  if (set === 'charges') {
    return [
      {
        key: 'voiceRate',
        label: limits.voiceMinutes,
        numeric: true,
        mono: true,
        gapLabel: input.words.notPublished,
      },
    ];
  }
  return [
    { key: 'design', label: limits.biggestDesign },
    { key: 'proposals', label: input.words.proposals },
    { key: 'projects', label: limits.activeProjects },
    { key: 'users', label: limits.users },
  ];
}

function optionOf(input: PlanSelectionInput, plan: BookPlan, set: PlanSet): CompareOption {
  const { words } = input;
  const { book } = words;
  const monthly = (value: string, counted: boolean) => (counted ? words.perMonth(value) : value);
  const voice = plan.voiceMinutesIncluded;
  const values: Record<string, string | undefined> =
    set === 'included'
      ? {
          voice:
            voice === 0
              ? words.perMinute
              : monthly(book.voiceIncluded(voice), typeof voice === 'number'),
          storage: book.storage(plan.storageGb),
        }
      : set === 'charges'
        ? { voiceRate: book.voiceRate(plan) ?? undefined }
        : {
            design: book.power(powerOf(plan.designCeilingKw)),
            proposals: monthly(
              book.limit(plan.proposalsPerMonth),
              typeof plan.proposalsPerMonth === 'number',
            ),
            projects: book.limit(plan.activeProjects),
            users: words.view.limits.unlimited,
          };
  return {
    key: plan.tier,
    name: words.view.tier(plan.tier),
    current: plan.tier === input.heldTier,
    values,
  };
}

/**
 * ONE region at both widths (decision 4): at 375 my plan against ONE other, chosen by a chip
 * strip, with a second strip for the set; at 1536 all four plans as columns. A person who is not
 * the Owner sees `Limits` and `Included` only, and no source line beside no price (decision 6).
 */
export function compareOf(
  state: PlanSelectionState,
  input: PlanSelectionInput,
  book: PublicPricingRead,
): PlanCompareView {
  const { words } = input;
  const sets: PlanCompareView['sets'] = [
    { value: 'limits', label: words.setLimits },
    { value: 'included', label: words.setIncluded },
    ...(state.owner ? [{ value: 'charges' as const, label: words.setCharges }] : []),
  ];
  const set = sets.some((choice) => choice.value === state.set) ? state.set : 'limits';
  const rowOf = (tier: Tier | null) => book.plans.find((row) => row.tier === tier);
  const pairRows = [rowOf(state.comparePlan), rowOf(state.against)].filter(
    (row): row is BookPlan => row !== undefined,
  );
  const plan = state.comparePlan;
  const against = state.against;
  const own = input.heldTier !== null;
  return {
    line: state.owner ? words.compareLineOwner : words.compareLineMember,
    sets,
    set,
    plans: state.planOptions.map((tier) => ({ value: tier, label: words.view.tier(tier) })),
    planValue: own ? null : plan,
    against: state.againstOptions.map((tier) => ({ value: tier, label: words.view.tier(tier) })),
    againstValue: against,
    pairCaption:
      plan === null || against === null
        ? words.allCaption(book.plans.length, set)
        : own
          ? words.pairCaption(plan, against, set)
          : words.pairOnlyCaption(plan, against),
    allCaption: words.allCaption(book.plans.length, set),
    attributes: attributesOf(input, set),
    pair: pairRows.map((row) => optionOf(input, row, set)),
    all: book.plans.map((row) => optionOf(input, row, set)),
    source: state.owner ? input.priceList : null,
  };
}
