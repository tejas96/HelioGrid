import type { CertificationSchemesPack } from '../certification/pack';
import { allocationVerdict } from '../commerce/tranche-allocation';
import { type DocumentBasis, tierFitsBasis } from '../format/disclosure';
import type { FormatPack } from '../format/pack';
import type { ProposalMarketFacts } from '../format/proposal-facts';
import { minorUnits } from '../money/minor-units';
import type { SubsidyPack } from '../subsidy/pack';
import { unmetSubsidySchemesOf } from '../subsidy/path';
import type { SystemSupplyRates } from '../tax/pack';
import type {
  GenerateBlock,
  GenerateVerdict,
  GenerateWarning,
  RequiredField,
} from './checklist-findings';
import { sizeFindings } from './checklist-size';
import { isCountedCategory } from './component-category';
import { systemMonthlyKwh } from './energy';
import type { ProposalDealFacts, ProposalFieldSet } from './field-set';
import type { ProposalMoney } from './money';
import { emptyCategories } from './standing';
import type { ProposalStep } from './steps';
import { needsBattery } from './system-type';
import { PROPOSAL_LIMITS } from './vocabulary';

/**
 * The Generate gate (`M06-20`, `M06-22`, `M06-23`): ONE checklist, run in one pass, the same from
 * Quick mode, from a duplicate and from the full rail — it reads the field set and nothing about
 * how the person got there. Server-only: it reads the money block and states a loss.
 */
export interface GenerateCheckInput {
  readonly fields: ProposalFieldSet;
  readonly deal: ProposalDealFacts;
  /** The money block the same request computed; `null` while no price is typed. */
  readonly money: ProposalMoney | null;
  readonly formats: FormatPack;
  readonly subsidy: SubsidyPack;
  readonly certification: CertificationSchemesPack;
  /** `formats.proposal`; `null` on a pack that declares none, and the size checks then say so. */
  readonly market: ProposalMarketFacts | null;
  /** What stands behind the document: no design in V1, so only the heuristic tiers fit (`F8-21`). */
  readonly basis: DocumentBasis;
  /** The reader holds the cost grant (`F2.M01.manage-catalog`): the loss is stated, else withheld. */
  readonly viewerSeesCost: boolean;
  /** The company holds a tax registration (`T-M06-024`). */
  readonly taxRegistered: boolean;
  /** `tax.systemSupplyRates`; `null` on a pack stored before it declared them. */
  readonly supplyRates: SystemSupplyRates | null;
}

const STEP_OF_FIELD: Readonly<Record<RequiredField, ProposalStep>> = {
  'deal.segment': 'system',
  'system.capacityKw': 'system',
  'system.priceInclusive': 'system',
  'system.battery.capacityKwh': 'system',
  'system.battery.costInclusive': 'system',
  'system.emi': 'system',
  'performance.efficiencyPercent': 'performance',
  'performance.generation': 'performance',
  'financials.tariffPerKwh': 'financials',
  'financials.horizonYears': 'financials',
  timeline: 'timeline',
  'payment.tranches': 'payment',
  terms: 'terms',
  'deal.clientName': 'client',
  'deal.clientPhone': 'client',
  'deal.siteAddress': 'client',
  'deal.area': 'client',
};

function inRange(value: number | null, bounds: { readonly min: number; readonly max: number }) {
  return value !== null && Number.isFinite(value) && value >= bounds.min && value <= bounds.max;
}

function blank(text: string | null): boolean {
  return text === null || text.trim() === '';
}

/** `M06-23`(e): every required field that is empty or out of its range, in step order. */
function missingFields(input: GenerateCheckInput): readonly RequiredField[] {
  const { fields, deal, formats } = input;
  const { system, performance, financials } = fields;
  const major = 10 ** formats.minorUnitDigits;
  const tariff = financials.tariffPerKwh === null ? null : financials.tariffPerKwh / major;
  const emiUnfit =
    system.emi !== null && !(Number.isFinite(system.emi.tenureYears) && system.emi.tenureYears > 0);
  const missing: readonly (readonly [RequiredField, boolean])[] = [
    ['deal.segment', deal.segment === null],
    ['system.capacityKw', !inRange(system.capacityKw, PROPOSAL_LIMITS.capacityKw)],
    ['system.priceInclusive', system.priceInclusive === null],
    [
      'system.battery.capacityKwh',
      system.battery !== null && !inRange(system.battery.capacityKwh, PROPOSAL_LIMITS.batteryKwh),
    ],
    [
      'system.battery.costInclusive',
      system.battery !== null && system.battery.costInclusive === null,
    ],
    ['system.emi', emiUnfit],
    [
      'performance.efficiencyPercent',
      !inRange(performance.efficiencyPercent, PROPOSAL_LIMITS.efficiencyPercent),
    ],
    ['performance.generation', systemMonthlyKwh(performance, system.capacityKw) === null],
    ['financials.tariffPerKwh', !inRange(tariff, PROPOSAL_LIMITS.tariffPerKwh)],
    [
      'financials.horizonYears',
      !(Number.isFinite(financials.horizonYears) && financials.horizonYears > 0),
    ],
    [
      'timeline',
      fields.timeline.length === 0 ||
        fields.timeline.some((phase) => blank(phase.name) || blank(phase.description)),
    ],
    ['payment.tranches', fields.payment.tranches.some((tranche) => blank(tranche.label))],
    ['terms', fields.terms.blocks.length === 0],
    ['deal.clientName', blank(deal.clientName)],
    ['deal.clientPhone', !deal.clientPhoneValid],
    ['deal.siteAddress', blank(deal.siteAddress)],
    ['deal.area', deal.area === null],
  ];
  return missing.flatMap(([field, isMissing]) => (isMissing ? [field] : []));
}

/** `M06-23`(a), `M06-27`: a required category with no brand, and a counted line with no count. */
function componentBlocks(fields: ProposalFieldSet): readonly GenerateBlock[] {
  const located = { step: 'components', fields: ['components'] } as const;
  const missing = emptyCategories(fields).map(
    (category): GenerateBlock => ({ check: 'component_missing', category, ...located }),
  );
  const uncounted = fields.components
    .filter((line) => isCountedCategory(line.category) && !(line.count !== null && line.count >= 1))
    .map(
      (line): GenerateBlock => ({
        check: 'component_count_missing',
        category: line.category,
        brand: line.brand,
        ...located,
      }),
    );
  return [...missing, ...uncounted];
}

/**
 * `M06-23`(f), `F1-34`: on the incentive path every line of a category a required scheme binds
 * must hold that scheme — each brand by name. Off the path, nothing is checked. And no line may
 * carry a tier the document's basis cannot bear (`F8-21`).
 */
function lineBlocks(input: GenerateCheckInput): readonly GenerateBlock[] {
  const located = { step: 'components', fields: ['components'] } as const;
  const onIncentivePath = (input.money?.incentive ?? null) !== null;
  return input.fields.components.flatMap((line): GenerateBlock[] => {
    const unmet = onIncentivePath
      ? unmetSubsidySchemesOf(input.subsidy, input.certification, {
          category: line.category,
          held: line.certifications,
        })
      : [];
    return [
      ...unmet.map(
        (scheme): GenerateBlock => ({
          check: 'scheme_unmet',
          category: line.category,
          brand: line.brand,
          scheme,
          ...located,
        }),
      ),
      ...(tierFitsBasis(input.basis, line.tier)
        ? []
        : [
            {
              check: 'tier_unfit',
              category: line.category,
              brand: line.brand,
              tier: line.tier,
              ...located,
            } as const,
          ]),
    ];
  });
}

function moneyBlocks(input: GenerateCheckInput): readonly GenerateBlock[] {
  const { fields, money } = input;
  const blocks: GenerateBlock[] = [];
  if (needsBattery(fields.system.systemType) && fields.system.battery === null) {
    blocks.push({
      check: 'battery_required',
      systemType: fields.system.systemType,
      step: 'system',
      fields: ['system.battery'],
    });
  }
  if (input.taxRegistered && input.supplyRates === null) {
    blocks.push({
      check: 'tax_rates_undeclared',
      step: 'system',
      fields: ['system.priceInclusive'],
    });
  }
  if (money?.payableAtOrBelowZero) {
    blocks.push({
      check: 'payable_not_positive',
      payable: money.payable,
      step: 'system',
      fields: ['system.priceInclusive', 'system.discount'],
    });
  }
  const allocation = allocationVerdict(fields.payment.tranches.map((tranche) => tranche.share));
  if (allocation.state !== 'met') {
    blocks.push({
      check: 'tranches_not_whole',
      allocated: allocation.allocated,
      remainder: allocation.remainder,
      step: 'payment',
      fields: ['payment.tranches'],
    });
  }
  return blocks;
}

/** `M06-37`: priced below our cost while the payable is still above zero — a warning, with the loss. */
function belowCost(input: GenerateCheckInput): readonly GenerateWarning[] {
  const { money } = input;
  if (money === null || money.margin === null || !money.margin.belowCost) return [];
  if (money.payableAtOrBelowZero) return [];
  return [
    {
      check: 'below_cost',
      loss: input.viewerSeesCost ? minorUnits(-money.margin.amount) : null,
      step: 'system',
      fields: ['system.priceInclusive', 'system.discount'],
    },
  ];
}

/** The whole checklist over one proposal. Fixing the last block and running it again is the same run. */
export function generateVerdict(input: GenerateCheckInput): GenerateVerdict {
  const sized = sizeFindings(input.fields, input.deal, input.market);
  const blocks: readonly GenerateBlock[] = [
    ...componentBlocks(input.fields),
    ...moneyBlocks(input),
    ...missingFields(input).map(
      (field): GenerateBlock => ({
        check: 'field_missing',
        field,
        step: STEP_OF_FIELD[field],
        fields: [field],
      }),
    ),
    ...lineBlocks(input),
  ];
  return {
    blocks,
    warnings: [...belowCost(input), ...sized.warnings],
    skipped: sized.skipped,
    canGenerate: blocks.length === 0,
  };
}
