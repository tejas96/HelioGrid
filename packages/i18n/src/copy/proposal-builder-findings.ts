import type { TranslatedText } from '@heliogrid/contracts';
import type {
  ComponentCategory,
  GenerateBlock,
  GenerateWarning,
  MinorUnits,
  RequiredField,
  SkippedCheck,
  SkipReason,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';

/**
 * A finding of the check before Generate, in words (`M06-23`, `T-M06-022`). Each names what is
 * wrong and what to do; a warning states both figures of its check; a check that could not run
 * says so and why, never passing silently. Every money figure is the server's own text.
 */

type T = Translator['t'];

/** What a finding's words are built over. */
export interface ProposalFindingFacts {
  /** A kind's name — `Solar panels` (`proposalPartsWords(...).kind`). */
  readonly kind: (category: ComponentCategory) => TranslatedText;
  /** A step's short word — `Components`. */
  readonly step: (step: GenerateBlock['step']) => TranslatedText;
  readonly number: (value: number) => string;
  /** An amount as the reader sees it — `format.amountPlain`. */
  readonly amount: (amount: MinorUnits) => string;
}

export interface FindingWords {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

const BLOCK = {
  line: /*i18n*/ { id: '{fix} · {step}' },
  componentMissing: /*i18n*/ { id: '{kind} has no brand' },
  pickOne: /*i18n*/ { id: 'Pick at least one' },
  countMissing: /*i18n*/ { id: '{brand} has no count' },
  typeCount: /*i18n*/ { id: 'Type how many {kind} it needs' },
  batteryRequiredOffGrid: /*i18n*/ { id: 'An off-grid system needs a battery' },
  batteryRequiredHybrid: /*i18n*/ { id: 'A hybrid system needs a battery' },
  addBattery: /*i18n*/ { id: 'Add a battery' },
  payable: /*i18n*/ { id: 'The price is {amount}' },
  abovePayable: /*i18n*/ { id: 'It must be above zero' },
  taxRatesUndeclared: /*i18n*/ { id: 'The tax rates for this market are not set yet' },
  askSupport: /*i18n*/ { id: 'Ask HelioGrid support to update them' },
  tranchesUnder: /*i18n*/ { id: 'Payment parts add up to {allocated}%' },
  tranchesUnallocated: /*i18n*/ { id: '{remainder}% is not allocated' },
  tranchesOver: /*i18n*/ { id: '{remainder}% too much' },
  fieldMissing: /*i18n*/ { id: '{field} is missing' },
  fillIt: /*i18n*/ { id: 'Fill it in' },
  schemeUnmet: /*i18n*/ { id: '{brand} is not {scheme}' },
  schemeFix: /*i18n*/ { id: 'Pick a {scheme} brand, or switch the subsidy off' },
  tierUnfit: /*i18n*/ { id: '{brand} carries figures from a design this proposal does not have' },
  tierFix: /*i18n*/ { id: 'Pick it again' },
} as const;

const FIELD: Record<RequiredField, { id: string }> = {
  'deal.segment': /*i18n*/ { id: 'Home or business' },
  'deal.area': /*i18n*/ { id: 'The site’s state' },
  'system.capacityKw': /*i18n*/ { id: 'System size' },
  'system.priceInclusive': /*i18n*/ { id: 'System price' },
  'system.battery.capacityKwh': /*i18n*/ { id: 'Battery size' },
  'system.battery.costInclusive': /*i18n*/ { id: 'Battery price' },
  'system.emi': /*i18n*/ { id: 'EMI rate and term' },
  'performance.efficiencyPercent': /*i18n*/ { id: 'System efficiency' },
  'performance.generation': /*i18n*/ { id: 'Generation' },
  'financials.tariffPerKwh': /*i18n*/ { id: 'Tariff' },
  'financials.horizonYears': /*i18n*/ { id: 'Years of savings' },
  timeline: /*i18n*/ { id: 'Timeline' },
  'payment.tranches': /*i18n*/ { id: 'Payment plan' },
  terms: /*i18n*/ { id: 'Terms' },
  'deal.clientName': /*i18n*/ { id: 'Customer’s name' },
  'deal.clientPhone': /*i18n*/ { id: 'Customer’s phone number' },
  'deal.siteAddress': /*i18n*/ { id: 'Site address' },
};

const WARNING = {
  belowCost: /*i18n*/ { id: 'Priced below your cost' },
  belowCostLoss: /*i18n*/ { id: 'A loss of {amount} on this job' },
  belowCostQuiet: /*i18n*/ { id: 'Below the company’s cost' },
  panels: /*i18n*/ { id: '{brand} panels add up to {panels} kW' },
  panelsLine: /*i18n*/ { id: '{count} × {watts} Wp, but the system is {system} kW' },
  inverterSmall: /*i18n*/ { id: '{inverter} inverter is small for {panel} panels' },
  inverterBig: /*i18n*/ { id: '{inverter} inverter is big for {panel} panels' },
  inverterLine: /*i18n*/ { id: 'Inverter {inverterKw} kW, panels {panelKw} kW' },
  sanctioned: /*i18n*/ { id: 'Bigger than the sanctioned load' },
  sanctionedLine: /*i18n*/ { id: 'System {system} kW, sanctioned load {load} kW' },
  phase: /*i18n*/ { id: '{brand} inverter does not match the supply' },
  phaseLine: /*i18n*/ { id: 'Inverter {inverter}-phase, supply {supply}-phase' },
} as const;

const SKIPPED_CHECK: Record<GenerateWarning['check'], { id: string }> = {
  below_cost: /*i18n*/ { id: 'Cost check skipped' },
  panel_capacity: /*i18n*/ { id: 'Panel size check skipped' },
  inverter_band: /*i18n*/ { id: 'Inverter size check skipped' },
  sanctioned_load: /*i18n*/ { id: 'Sanctioned load check skipped' },
  supply_phase: /*i18n*/ { id: 'Supply phase check skipped' },
};

const SKIP_REASON: Record<SkipReason, { id: string }> = {
  market_declares_none: /*i18n*/ { id: 'This market sets no rule for it' },
  panel_watt_peak_unknown: /*i18n*/ { id: '{brand} has no watt-peak' },
  inverter_capacity_unknown: /*i18n*/ { id: '{brand} has no capacity' },
  inverter_phases_unknown: /*i18n*/ { id: '{brand} has no phase' },
  sanctioned_load_unknown: /*i18n*/ { id: 'The lead has no sanctioned load' },
  supply_phase_unknown: /*i18n*/ { id: 'The lead has no supply phase' },
};

function blockWords(t: T, facts: ProposalFindingFacts, block: GenerateBlock) {
  switch (block.check) {
    case 'component_missing':
      return [
        t(BLOCK.componentMissing, { kind: facts.kind(block.category) }),
        t(BLOCK.pickOne),
      ] as const;
    case 'component_count_missing':
      return [
        t(BLOCK.countMissing, { brand: block.brand }),
        t(BLOCK.typeCount, { kind: facts.kind(block.category) }),
      ] as const;
    case 'battery_required':
      return [
        t(
          block.systemType === 'off_grid'
            ? BLOCK.batteryRequiredOffGrid
            : BLOCK.batteryRequiredHybrid,
        ),
        t(BLOCK.addBattery),
      ] as const;
    case 'payable_not_positive':
      return [
        t(BLOCK.payable, { amount: facts.amount(block.payable) }),
        t(BLOCK.abovePayable),
      ] as const;
    case 'tax_rates_undeclared':
      return [t(BLOCK.taxRatesUndeclared), t(BLOCK.askSupport)] as const;
    case 'tranches_not_whole':
      return [
        t(BLOCK.tranchesUnder, { allocated: facts.number(block.allocated) }),
        t(block.remainder >= 0 ? BLOCK.tranchesUnallocated : BLOCK.tranchesOver, {
          remainder: facts.number(Math.abs(block.remainder)),
        }),
      ] as const;
    case 'field_missing':
      return [t(BLOCK.fieldMissing, { field: t(FIELD[block.field]) }), t(BLOCK.fillIt)] as const;
    case 'scheme_unmet':
      return [
        t(BLOCK.schemeUnmet, { brand: block.brand, scheme: block.scheme }),
        t(BLOCK.schemeFix, { scheme: block.scheme }),
      ] as const;
    case 'tier_unfit':
      return [t(BLOCK.tierUnfit, { brand: block.brand }), t(BLOCK.tierFix)] as const;
  }
}

/** A block: what stops Generate, and its fix with the step it is on. */
export function proposalCheckBlockWords(
  t: T,
  facts: ProposalFindingFacts,
  block: GenerateBlock,
): FindingWords {
  const [title, fix] = blockWords(t, facts, block);
  return { title, line: t(BLOCK.line, { fix, step: facts.step(block.step) }) };
}

/** A warning: both figures of its check. It never stops Generate (`M06-37`). */
export function proposalCheckWarningWords(
  t: T,
  facts: ProposalFindingFacts,
  warning: GenerateWarning,
): FindingWords {
  const n = facts.number;
  switch (warning.check) {
    case 'below_cost':
      return {
        title: t(WARNING.belowCost),
        line:
          warning.loss === null
            ? t(WARNING.belowCostQuiet)
            : t(WARNING.belowCostLoss, { amount: facts.amount(warning.loss) }),
      };
    case 'panel_capacity':
      return {
        title: t(WARNING.panels, { brand: warning.brand, panels: n(warning.panelKw) }),
        line: t(WARNING.panelsLine, {
          count: n(warning.count),
          watts: n(warning.wattPeak),
          system: n(warning.systemKw),
        }),
      };
    case 'inverter_band':
      return {
        title: t(
          warning.reading === 'inverter_too_small' ? WARNING.inverterSmall : WARNING.inverterBig,
          { inverter: warning.inverterBrand, panel: warning.panelBrand },
        ),
        line: t(WARNING.inverterLine, {
          inverterKw: n(warning.inverterKw),
          panelKw: n(warning.panelKw),
        }),
      };
    case 'sanctioned_load':
      return {
        title: t(WARNING.sanctioned),
        line: t(WARNING.sanctionedLine, {
          system: n(warning.systemKw),
          load: n(warning.sanctionedLoadKw),
        }),
      };
    case 'supply_phase':
      return {
        title: t(WARNING.phase, { brand: warning.brand }),
        line: t(WARNING.phaseLine, {
          inverter: warning.inverterPhases,
          supply: warning.supplyPhases,
        }),
      };
  }
}

/** A check that could not run: which, and why — never a silent pass (`M06-23`). */
export function proposalCheckSkippedWords(t: T, skipped: SkippedCheck): FindingWords {
  return {
    title: t(SKIPPED_CHECK[skipped.check]),
    line: t(SKIP_REASON[skipped.reason], { brand: skipped.brand ?? '' }),
  };
}
