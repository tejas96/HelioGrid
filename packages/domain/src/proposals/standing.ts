import { allocationVerdict } from '../commerce/tranche-allocation';
import { sameContent } from '../tenancy/settings-page';
import { type ComponentCategory, MANDATORY_COMPONENT_CATEGORIES } from './component-category';
import type { ProposalDealFacts, ProposalFieldSet } from './field-set';
import { PROPOSAL_STEPS, type ProposalStep, type StepStanding } from './steps';
import { needsBattery } from './system-type';
import { PROPOSAL_LIMITS } from './vocabulary';

/**
 * How each step of a draft stands (`M06-21`, `T-M06-002`), decided once for the rail, the step
 * sheet and the lead's draft chip. A standing is feedback only: none blocks a step, and the
 * checks that stop Generate are the checklist's (`M06-22`, `M06-23`).
 */

/**
 * What the company's templates gave the draft for the steps they fill (`M06-18`, `T-M06-027`). A
 * step that still holds exactly this reads `default`; one the person changed reads `done`.
 */
export type TemplateFilledSteps = Pick<ProposalFieldSet, 'achievements' | 'timeline' | 'terms'>;

export interface StandingFacts {
  readonly fields: ProposalFieldSet;
  readonly deal: ProposalDealFacts;
  readonly templates: TemplateFilledSteps;
}

/** The categories a proposal must fill (`M06-27`): the five, and the battery once the system holds one. */
export function requiredCategories(
  fields: Pick<ProposalFieldSet, 'system'>,
): readonly ComponentCategory[] {
  return fields.system.battery === null
    ? MANDATORY_COMPONENT_CATEGORIES
    : [...MANDATORY_COMPONENT_CATEGORIES, 'battery'];
}

/** The required categories that hold no brand yet — what step 8's counter and the gate both read. */
export function emptyCategories(
  fields: Pick<ProposalFieldSet, 'system' | 'components'>,
): readonly ComponentCategory[] {
  return requiredCategories(fields).filter(
    (category) => !fields.components.some((line) => line.category === category),
  );
}

function within(value: number | null, bounds: { readonly min: number; readonly max: number }) {
  return value !== null && value >= bounds.min && value <= bounds.max;
}

function fromTemplate(held: unknown, template: unknown): StepStanding {
  return sameContent(held, template) ? 'default' : 'done';
}

const STANDING_OF: Readonly<Record<ProposalStep, (facts: StandingFacts) => StepStanding>> = {
  company: () => 'done',
  achievements: ({ fields, templates }) =>
    fromTemplate(fields.achievements, templates.achievements),
  system: ({ fields: { system } }) => {
    const priced = system.priceInclusive !== null && system.priceInclusive > 0;
    const stored = !needsBattery(system.systemType) || system.battery !== null;
    return within(system.capacityKw, PROPOSAL_LIMITS.capacityKw) && priced && stored
      ? 'done'
      : 'to_do';
  },
  performance: ({ fields: { performance } }) => {
    const filled = performance.yieldPerKwp !== null || performance.editedMonthlyKwh !== null;
    return filled && within(performance.efficiencyPercent, PROPOSAL_LIMITS.efficiencyPercent)
      ? 'done'
      : 'to_do';
  },
  financials: ({ fields }) => (fields.financials.tariffPerKwh === null ? 'to_do' : 'done'),
  timeline: ({ fields, templates }) => {
    const whole =
      fields.timeline.length > 0 &&
      fields.timeline.every((phase) => phase.name.trim() !== '' && phase.description.trim() !== '');
    return whole ? fromTemplate(fields.timeline, templates.timeline) : 'to_do';
  },
  payment: ({ fields: { payment } }) => {
    const whole =
      payment.tranches.every((tranche) => tranche.label.trim() !== '') &&
      allocationVerdict(payment.tranches.map((tranche) => tranche.share)).state === 'met';
    if (!whole) return 'to_do';
    return payment.templateId === null ? 'done' : 'default';
  },
  components: ({ fields }) => (emptyCategories(fields).length === 0 ? 'done' : 'to_do'),
  terms: ({ fields, templates }) => fromTemplate(fields.terms, templates.terms),
  client: ({ deal }) =>
    deal.siteAddress !== null && deal.siteAddress.trim() !== '' && deal.area !== null
      ? 'done'
      : 'to_do',
  bank: ({ fields }) => (fields.bank.includeInProposal ? 'default' : 'done'),
};

/** Every step's standing, keyed by step. */
export function stepStandings(facts: StandingFacts): Readonly<Record<ProposalStep, StepStanding>> {
  return {
    company: STANDING_OF.company(facts),
    achievements: STANDING_OF.achievements(facts),
    system: STANDING_OF.system(facts),
    performance: STANDING_OF.performance(facts),
    financials: STANDING_OF.financials(facts),
    timeline: STANDING_OF.timeline(facts),
    payment: STANDING_OF.payment(facts),
    components: STANDING_OF.components(facts),
    terms: STANDING_OF.terms(facts),
    client: STANDING_OF.client(facts),
    bank: STANDING_OF.bank(facts),
  };
}

/** The lead's draft chip (`M06-25`): how many of the eleven steps are complete, of how many. */
export interface DraftProgress {
  readonly complete: number;
  readonly of: number;
}

/**
 * "Proposal draft — n/11" (`M06-25`, `T-M06-001`): every step counts, the ones Quick mode hides
 * included, and a step is complete when it is done or its default is in place.
 */
export function draftProgress(facts: StandingFacts): DraftProgress {
  const standings = stepStandings(facts);
  return {
    complete: PROPOSAL_STEPS.filter((step) => standings[step] !== 'to_do').length,
    of: PROPOSAL_STEPS.length,
  };
}
