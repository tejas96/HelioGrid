import type { EffectiveSettings, TrancheTemplateInForce } from '../commerce/effective-settings';
import type { ProposalCover } from '../commerce/proposal-template-defaults';
import type { TimelinePhase } from '../commerce/timeline-template-defaults';
import type { ProposalMarketFacts } from '../format/proposal-facts';
import { basisPoints } from '../money/basis-points';
import type { SubsidyPack } from '../subsidy/pack';
import { isIncentiveOffered } from '../subsidy/path';
import type { SystemSupplyRates } from '../tax/pack';
import type { DealSegment } from '../tenancy/segment';
import type { PaymentFields, ProposalFieldSet, ProposalPhase } from './field-set';
import type { TemplateFilledSteps } from './standing';
import { type CoverPicture, DEFAULT_COVER_PICTURE, PROPOSAL_LIMITS } from './vocabulary';

/**
 * How a new draft is filled (`M06-18`, `M06-49`, `T-M06-027`): each templated step takes the
 * company's saved template where one exists and the platform's default where none does — read
 * ONCE, through the settings in force — and the draft then keeps what it holds. An owner's later
 * change reaches an open draft only through that step's Reset, never by itself.
 *
 * On `./server`: the draft is created by the api, and the value it returns holds money fields.
 */

/** The efficiency a new proposal opens on — the approved design's own starting figure. */
export const DEFAULT_EFFICIENCY_PERCENT = 80;

export interface TemplateFillInput {
  /** The settings in force: the company's templates, or the platform's defaults behind them. */
  readonly settings: Pick<
    EffectiveSettings,
    'proposalTemplate' | 'timelineTemplate' | 'defaultTrancheTemplate'
  >;
  /** The company's default cover picture (`T-M01-030`); `null` until it picks one. */
  readonly coverPicture: CoverPicture | null;
  /** The size the company usually sells, where it said (`M01-23`); the size stepper starts there. */
  readonly typicalSystemKwp: number | null;
  readonly subsidy: SubsidyPack;
  readonly supplyRates: SystemSupplyRates | null;
  readonly market: ProposalMarketFacts | null;
  /** The lead's segment — what the incentive switch's starting position reads (`M06-38`). */
  readonly segment: DealSegment | null;
}

export const NO_COVER: ProposalCover = {
  aboutCompany: null,
  totalCapacityInstalledKw: null,
  happyCustomers: null,
  citiesServed: null,
};

/** Step 6 as the template in force gives it — also what its Reset returns to (`M06-12`). */
export function timelineFromTemplate(phases: readonly TimelinePhase[]): readonly ProposalPhase[] {
  return phases.map((phase) => ({ ...phase, durationDays: null }));
}

/** Step 7 as a named template gives it — the default at fill, and what Reset returns to (`M06-13`). */
export function paymentFromTemplate(template: TrancheTemplateInForce): PaymentFields {
  return { templateId: template.id, tranches: template.lines };
}

/** What the templates give steps 2, 6 and 9 — what a step's `default` standing is compared with. */
export function templateFilledSteps(
  input: Pick<TemplateFillInput, 'settings'>,
): TemplateFilledSteps {
  const { proposalTemplate, timelineTemplate } = input.settings;
  return {
    achievements: proposalTemplate.value.cover ?? NO_COVER,
    timeline: timelineFromTemplate(timelineTemplate.value.phases),
    terms: proposalTemplate.value.defaultTerms,
  };
}

function startingCapacity(typical: number | null): number | null {
  const { min, max } = PROPOSAL_LIMITS.capacityKw;
  return typical !== null && typical >= min && typical <= max ? typical : null;
}

/**
 * A new draft's field set: nothing pre-filled beyond the company's own settings and the market's
 * starting figures (`M06-02`). The price is left for the person to type; no rate per kW exists.
 */
export function newDraftFieldSet(input: TemplateFillInput): ProposalFieldSet {
  const { settings, market, supplyRates, subsidy, segment } = input;
  const offered =
    segment !== null && isIncentiveOffered(subsidy, { segment, systemType: 'on_grid' });
  return {
    version: 1,
    company: {
      proposalType: 'customer_owns',
      coverPicture: input.coverPicture ?? DEFAULT_COVER_PICTURE,
    },
    ...templateFilledSteps(input),
    system: {
      capacityKw: startingCapacity(input.typicalSystemKwp),
      systemType: 'on_grid',
      battery: null,
      maintenance: { kind: 'none' },
      commissioningIncluded: true,
      priceInclusive: null,
      taxRate: supplyRates?.system ?? basisPoints(0),
      discount: null,
      incentiveClaimed: offered,
      emi: null,
      ourCost: null,
    },
    performance: {
      efficiencyPercent: DEFAULT_EFFICIENCY_PERCENT,
      yieldPerKwp: null,
      source: null,
      grain: null,
      editedMonthlyKwh: null,
      editedAtCapacityKw: null,
    },
    financials: {
      tariffPerKwh: market?.typicalTariffPerKwh ?? null,
      tariffRise: market?.tariffRise ?? basisPoints(0),
      horizonYears: market?.lifetimeYears ?? 0,
    },
    payment: paymentFromTemplate(settings.defaultTrancheTemplate.value),
    components: [],
    bank: { includeInProposal: true },
  };
}
