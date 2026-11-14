import type { BatteryChemistry, PanelTechnology } from '../catalog/vocabulary';
import type { Certification } from '../certification/pack';
import type { TrancheLine } from '../commerce/effective-settings';
import type { ProposalCover } from '../commerce/proposal-template-defaults';
import type { RichTextValue } from '../commerce/rich-text';
import type { AreaGrain, AreaRef } from '../format/areas';
import type { EnergySource } from '../format/energy-source';
import type { ProvenanceTier } from '../format/qualified';
import type { BasisPoints } from '../money/basis-points';
import type { MinorUnits } from '../money/minor-units';
import type { DealSegment } from '../tenancy/segment';
import type { ComponentCategory } from './component-category';
import type { SystemType } from './system-type';
import type {
  ComponentLineSource,
  CoverPicture,
  DiscountMode,
  InverterType,
  MaintenanceKind,
  ProposalType,
  SupplyPhase,
} from './vocabulary';

/**
 * The eleven-step field set (`M06-42`): everything a person sets on ONE proposal, as one value. A
 * draft holds it and edits it; a version snapshots it whole and never changes. What the lead or the
 * company owns — the customer, the site, its supply, the bill, the company's own facts — is not
 * here: a draft reads those live (`ProposalDealFacts`, `ProposalCompanyFacts`) and a version freezes
 * them beside this value (`T-M06-012`, `T-M06-013`). Step 10 therefore holds no field of its own.
 */
export interface ProposalFieldSet {
  readonly version: 1;
  /** Step 1. */
  readonly company: CompanyFields;
  /** Step 2 — the company's track record as this proposal prints it (`M06-08`). */
  readonly achievements: ProposalCover;
  /** Step 3. */
  readonly system: SystemFields;
  /** Step 4. */
  readonly performance: PerformanceFields;
  /** Step 5. */
  readonly financials: FinancialFields;
  /** Step 6. */
  readonly timeline: readonly ProposalPhase[];
  /** Step 7. */
  readonly payment: PaymentFields;
  /** Step 8. */
  readonly components: readonly ComponentLine[];
  /** Step 9. */
  readonly terms: RichTextValue;
  /** Step 11. */
  readonly bank: BankFields;
}

export interface CompanyFields {
  readonly proposalType: ProposalType;
  /** Starts on the company's default; the pick is this proposal's and freezes with its version. */
  readonly coverPicture: CoverPicture;
}

export type MaintenancePlan =
  | { readonly kind: Exclude<MaintenanceKind, 'years'> }
  | { readonly kind: 'years'; readonly years: number };

/** A discount as it was typed (`M06-34`): pre-tax, and the mode entered is the mode recorded. */
export type DiscountFields =
  | { readonly mode: Extract<DiscountMode, 'percent'>; readonly percent: BasisPoints }
  | { readonly mode: Extract<DiscountMode, 'amount'>; readonly amount: MinorUnits };

/** `M06-30` — the battery added at step 3. Its brand, warranty and print facts are step 8's line. */
export interface BatteryFields {
  readonly capacityKwh: number;
  /** Typed including tax, as the system price is; `null` until typed. */
  readonly costInclusive: MinorUnits | null;
  readonly taxRate: BasisPoints;
  readonly chemistry: BatteryChemistry;
  /** The person's own words when the chemistry is `custom`. */
  readonly chemistryCustom: string | null;
}

/** `M06-40` — the EMI example: a yearly rate and a tenure in years. */
export interface EmiFields {
  readonly rate: BasisPoints;
  readonly tenureYears: number;
}

export interface SystemFields {
  /** kW; `null` until set. */
  readonly capacityKw: number | null;
  readonly systemType: SystemType;
  readonly battery: BatteryFields | null;
  readonly maintenance: MaintenancePlan;
  readonly commissioningIncluded: boolean;
  /** The price the person typed, tax included (`T-M06-024`): the authority the tax is derived from. */
  readonly priceInclusive: MinorUnits | null;
  /** The rate the system line is priced at; the pack's supply rate until the person changes it. */
  readonly taxRate: BasisPoints;
  readonly discount: DiscountFields | null;
  /** `M06-38` — off leaves the incentive path: no amount, no certification check. */
  readonly incentiveClaimed: boolean;
  /** `null` while the EMI example is off. */
  readonly emi: EmiFields | null;
  /** `M06-09`, `M06-37` — the company's own cost; never printed, shown only to who may see cost. */
  readonly ourCost: MinorUnits | null;
}

/** Twelve figures, January first. */
export type MonthlyFigures = readonly number[];

export interface PerformanceFields {
  /** Efficiency or performance ratio, percent — applied once to the source's zero-loss yield. */
  readonly efficiencyPercent: number;
  /** What the source answered: kWh per month for 1 kWp at zero loss; `null` until filled (`T-M06-033`). */
  readonly yieldPerKwp: MonthlyFigures | null;
  readonly source: EnergySource | null;
  /** How exact the point asked for was: the district's own, or its region's alone. */
  readonly grain: AreaGrain | null;
  /** The person's own month figures for the whole system, kWh; `null` follows the source. */
  readonly editedMonthlyKwh: MonthlyFigures | null;
  /** The capacity those edits were typed at, so a later size change can say so (`T-M06-033`). */
  readonly editedAtCapacityKw: number | null;
}

export interface FinancialFields {
  /** Per kWh; `null` until typed (`M06-09`). */
  readonly tariffPerKwh: MinorUnits | null;
  /** The yearly rise a savings projection assumes (`M06-11`). */
  readonly tariffRise: BasisPoints;
  /** The horizon the lifetime saving runs over, years (`M06-11`). */
  readonly horizonYears: number;
}

/** One step of the customer-facing timeline as this proposal prints it (`M06-12`). */
export interface ProposalPhase {
  readonly name: string;
  readonly description: string;
  /** Working days; `null` where none is stated — the document then prints none. */
  readonly durationDays: number | null;
}

export interface PaymentFields {
  /** The company's named template the rows came from, while they still match it; `null` once edited. */
  readonly templateId: string | null;
  readonly tranches: readonly TrancheLine[];
}

/** What every component line carries (`M06-27`, `M06-31`). */
interface ComponentLineBase {
  readonly brand: string;
  /** One line for the customer (`M06-29`). */
  readonly description: string | null;
  /** Panels and inverters only (`M06-27`); `null` elsewhere and until typed. */
  readonly count: number | null;
  readonly source: ComponentLineSource;
  readonly catalogItemId: string | null;
  readonly savedPartId: string | null;
  /** `assumed` for a line picked without a design (`F8-21`). */
  readonly tier: ProvenanceTier;
  /** What the item is certified under — what the incentive path's check reads (`M06-23`). */
  readonly certifications: readonly Certification[];
}

/** What prints for one category, as its edit sheet holds it (`M06-29`). */
export type ComponentPrint =
  | {
      readonly category: Extract<ComponentCategory, 'panel'>;
      readonly wattPeak: number | null;
      readonly technology: PanelTechnology | null;
      readonly warranty: string | null;
    }
  | {
      readonly category: Extract<ComponentCategory, 'inverter'>;
      readonly capacityKw: number | null;
      readonly inverterType: InverterType | null;
      readonly phases: 1 | 3 | null;
      readonly warranty: string | null;
    }
  | {
      readonly category: Extract<ComponentCategory, 'cable'>;
      readonly cableType: string | null;
      readonly specification: string | null;
      readonly warranty: string | null;
    }
  | {
      readonly category: Extract<ComponentCategory, 'electrical'>;
      readonly includes: string | null;
      readonly standard: string | null;
    }
  | {
      readonly category: Extract<ComponentCategory, 'structure'>;
      readonly warranty: string | null;
      readonly weightPerKw: number | null;
      readonly standard: string | null;
    }
  | {
      readonly category: Extract<ComponentCategory, 'battery'>;
      readonly capacityKwh: number | null;
      readonly chemistry: BatteryChemistry | null;
      readonly chemistryCustom: string | null;
      readonly warranty: string | null;
    };

/** One brand in one section of step 8; a section's two or three read as alternatives. */
export type ComponentLine = ComponentLineBase & ComponentPrint;

export interface BankFields {
  /** Off: the details stay saved and do not print (`M06-17`). */
  readonly includeInProposal: boolean;
}

/**
 * What a proposal reads of its lead and customer (`T-M06-032`): never copied into the draft, saved
 * through the lead's own edit path, and frozen beside the field set when a version is generated.
 */
export interface ProposalDealFacts {
  readonly segment: DealSegment | null;
  /** The site's region and district (`M06-09`). */
  readonly area: AreaRef | null;
  readonly siteAddress: string | null;
  readonly sanctionedLoadKw: number | null;
  readonly supplyPhase: SupplyPhase | null;
  readonly monthlyBill: MinorUnits | null;
  readonly clientName: string | null;
  /** The customer's number passes the market pack's phone format (`M06-57`). */
  readonly clientPhoneValid: boolean;
}

/** What a proposal reads of the company it is from, live until Generate (`T-M06-013`). */
export interface ProposalCompanyFacts {
  /** The company holds a tax registration: with none, no tax line prints (`T-M06-024`). */
  readonly taxRegistered: boolean;
  /** The place its registration names, as the tax scheme compares it; `null` with none. */
  readonly supplierPlace: string | null;
  readonly hasBankDetails: boolean;
  readonly hasLogo: boolean;
}
