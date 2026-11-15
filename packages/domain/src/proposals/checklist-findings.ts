import type { ProvenanceTier } from '../format/qualified';
import type { MinorUnits } from '../money/minor-units';
import type { ComponentCategory } from './component-category';
import type { ProposalStep } from './steps';
import type { SystemType } from './system-type';

/**
 * What Generate's one checklist finds (`M06-23`): a block stops Generate, a warning never does, and
 * a check whose input is unknown says it was skipped and why — it never passes silently. Every
 * finding names its step and the fields to highlight there, and a warning carries both figures.
 */

/** A field Generate needs filled or in range (`M06-23`(e)), as a path the builder highlights. */
export const REQUIRED_FIELDS = [
  'deal.segment',
  'deal.area',
  'system.capacityKw',
  'system.priceInclusive',
  'system.battery.capacityKwh',
  'system.battery.costInclusive',
  'system.emi',
  'performance.efficiencyPercent',
  'performance.generation',
  'financials.tariffPerKwh',
  'financials.horizonYears',
  'timeline',
  'payment.tranches',
  'terms',
  'deal.clientName',
  'deal.clientPhone',
  'deal.siteAddress',
] as const;
export type RequiredField = (typeof REQUIRED_FIELDS)[number];

/** Why a check did not run (`M06-23`): the one input it could not read. */
export const SKIP_REASONS = [
  'market_declares_none',
  'panel_watt_peak_unknown',
  'inverter_capacity_unknown',
  'inverter_phases_unknown',
  'sanctioned_load_unknown',
  'supply_phase_unknown',
] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

interface Located {
  readonly step: ProposalStep;
  /** The fields the step highlights when the finding is opened. */
  readonly fields: readonly string[];
}

export type GenerateBlock = Located &
  (
    | { readonly check: 'component_missing'; readonly category: ComponentCategory }
    | {
        readonly check: 'component_count_missing';
        readonly category: ComponentCategory;
        readonly brand: string;
      }
    | { readonly check: 'battery_required'; readonly systemType: SystemType }
    | { readonly check: 'payable_not_positive'; readonly payable: MinorUnits }
    /** The market pack declares no supply rates, so a registered company's tax cannot be stated. */
    | { readonly check: 'tax_rates_undeclared' }
    | {
        readonly check: 'tranches_not_whole';
        /** Basis points allocated, and what is still unallocated — negative when over. */
        readonly allocated: number;
        readonly remainder: number;
      }
    | { readonly check: 'field_missing'; readonly field: RequiredField }
    | {
        readonly check: 'scheme_unmet';
        readonly category: ComponentCategory;
        readonly brand: string;
        readonly scheme: string;
      }
    | {
        readonly check: 'tier_unfit';
        readonly category: ComponentCategory;
        readonly brand: string;
        readonly tier: ProvenanceTier;
      }
  );

export type GenerateWarning = Located &
  /** `loss` is `null` for a reader who may not see our cost: the words say "below cost" alone. */
  (
    | { readonly check: 'below_cost'; readonly loss: MinorUnits | null }
    | {
        readonly check: 'panel_capacity';
        readonly brand: string;
        readonly count: number;
        readonly wattPeak: number;
        readonly panelKw: number;
        readonly systemKw: number;
      }
    | {
        readonly check: 'inverter_band';
        readonly panelBrand: string;
        readonly inverterBrand: string;
        readonly panelKw: number;
        readonly inverterKw: number;
        readonly reading: 'inverter_too_small' | 'inverter_too_big';
      }
    | {
        readonly check: 'sanctioned_load';
        readonly systemKw: number;
        readonly sanctionedLoadKw: number;
      }
    | {
        readonly check: 'supply_phase';
        readonly brand: string;
        readonly inverterPhases: 1 | 3;
        readonly supplyPhases: 1 | 3;
      }
  );

export interface SkippedCheck extends Located {
  readonly check: GenerateWarning['check'];
  readonly reason: SkipReason;
  /** The brand the check could not read, where it runs per brand. */
  readonly brand: string | null;
}

export interface GenerateVerdict {
  readonly blocks: readonly GenerateBlock[];
  readonly warnings: readonly GenerateWarning[];
  readonly skipped: readonly SkippedCheck[];
  /** No block stands: Generate may run. Warnings never change this (`M06-37`). */
  readonly canGenerate: boolean;
}
