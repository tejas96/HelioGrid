import type { ComponentLineWire, ProposalFieldSetWire } from '@heliogrid/contracts';
import type {
  BatteryChemistry,
  ComponentCategory,
  CoverCount,
  CoverPictureKey,
  DealSegment,
  DiscountMode,
  MaintenanceKind,
  ProjectChainStage,
  ProposalType,
  SupplyPhase,
  SystemType,
} from '@heliogrid/domain';
import type { DataError } from '../errors/errors';
import type { ProposalActFailure } from './proposal-cache';

/**
 * The builder's eleven steps as both screens draw them (`M06-07`–`M06-17`, Law 11): one model per
 * step — the values its fields show, what each field's last commit came to, and one callback per
 * commit. No words and no markup: `packages/ui` turns a model into its step view with the words
 * `packages/i18n` builds over the same facts. Money a person types travels as the major-unit
 * number in the field; every figure a person reads is the server's (`F4-04`).
 */

type Wire = ProposalFieldSetWire;

/** What a field's last commit came to (`T-M06-023`); the typed value stays in the field throughout. */
export interface BuilderFieldSave {
  readonly kind: 'saving' | 'saved' | 'unsaved' | 'conflict' | 'refused';
  readonly onRetry?: () => void;
  readonly onReload?: () => void;
  /** `refused`: why the server would not take the value itself — said at the field (`F8-36`). */
  readonly failure?: ProposalActFailure;
}
export type BuilderFieldSaves<Field extends string> = Readonly<
  Partial<Record<Field, BuilderFieldSave>>
>;

export interface CompanyStepModel {
  readonly step: 'company';
  readonly proposalType: ProposalType;
  readonly onProposalType: (type: ProposalType) => void;
  /** The platform's pictures, and the company's own photo while this proposal holds it. */
  readonly covers: readonly { key: string; picture?: CoverPictureKey; src?: string }[];
  readonly cover: string;
  readonly onCover: (key: string) => void;
  /** The company's facts as the document prints them, read-only here (`M06-07`). */
  readonly facts: readonly {
    key: 'company' | 'phone' | 'email' | 'address' | 'tax';
    value: string;
  }[];
}

export interface TrackRecordStepModel {
  readonly step: 'achievements';
  readonly record: Wire['achievements'];
  readonly onCount: (count: CoverCount, value: number | null) => void;
  readonly saves: BuilderFieldSaves<CoverCount>;
}

export interface BatteryModel {
  readonly capacityKwh: number;
  readonly cost: number | null;
  readonly chemistry: BatteryChemistry;
  readonly chemistryCustom: string | null;
}

export type SystemField =
  | 'capacity'
  | 'price'
  | 'discount'
  | 'sanctionedLoad'
  | 'emiRate'
  | 'emiTenure'
  | 'ourCost'
  | 'batteryCapacity'
  | 'batteryCost';

export interface SystemStepModel {
  readonly step: 'system';
  readonly capacityKw: number | null;
  readonly onCapacity: (kw: number) => void;
  readonly systemType: SystemType;
  readonly onSystemType: (type: SystemType) => void;
  /** Home or business: the lead's own Category, written back to the lead (`M06-09`); `null` unset. */
  readonly segment: DealSegment | null;
  readonly onSegment: (segment: DealSegment) => void;
  /** The system needs a battery and holds none (`M06-30`): off-grid cannot work, hybrid should. */
  readonly batteryNeeded: 'danger' | 'warning' | null;
  /** Opens step 8's battery picker. */
  readonly onPickBattery: () => void;
  readonly priceInclusive: number | null;
  readonly onPrice: (price: number | null) => void;
  /** The company holds no tax registration: no tax line prints (`T-M06-024`). */
  readonly noTax: boolean;
  readonly discount: { readonly mode: DiscountMode; readonly value: number | null };
  readonly onDiscount: (discount: { mode: DiscountMode; value: number | null }) => void;
  /** Absent where the market offers this deal no incentive (`M06-38`). */
  readonly incentive?: {
    readonly claimed: boolean;
    readonly onClaimed: (on: boolean) => void;
    /** The pack's scheme — `PM Surya Ghar` — named before any price is typed. */
    readonly name: string;
    /** The certification the incentive path binds — `DCR` — or `null` where it binds none. */
    readonly requiredScheme: string | null;
    readonly paidTo: 'customer' | 'company';
  };
  readonly sanctionedLoadKw: number | null;
  readonly onSanctionedLoad: (kw: number | null) => void;
  readonly supplyPhase: SupplyPhase | null;
  readonly onSupplyPhase: (phase: SupplyPhase) => void;
  readonly maintenance: { readonly kind: MaintenanceKind; readonly years: number | null };
  readonly onMaintenance: (plan: { kind: MaintenanceKind; years: number | null }) => void;
  readonly emi: { readonly ratePercent: number; readonly tenureYears: number } | null;
  readonly onEmi: (emi: { ratePercent: number; tenureYears: number } | null) => void;
  readonly emiTypical: { readonly ratePercent: number; readonly tenureYears: number };
  readonly battery: BatteryModel | null;
  readonly onBattery: (battery: BatteryModel | null) => void;
  /** Present only for a viewer who may see cost (`M06-09`). */
  readonly ourCost?: {
    readonly value: number | null;
    readonly onCost: (cost: number | null) => void;
  };
  readonly saves: BuilderFieldSaves<SystemField>;
}

export interface PerformanceStepModel {
  readonly step: 'performance';
  readonly fill: 'source' | 'built_in' | 'none' | 'filling';
  /**
   * What the fill still needs — the size, the site's state — and whether the server refused the
   * last fill; step 4's card says which, where Fill it in was pressed.
   */
  readonly fillWants: {
    readonly size: boolean;
    readonly state: boolean;
    readonly refused: boolean;
  };
  /**
   * What a fill is asked for, from the draft's own facts: the district, else the state's name, and
   * the size; `null` where the draft holds none.
   */
  readonly asked: { readonly place: string | null; readonly capacityKw: number | null };
  readonly onRefill: () => void;
  /** The person's own month figures were typed at another size (`T-M06-033`). */
  readonly capacityChanged: boolean;
  readonly efficiencyPercent: number;
  readonly onEfficiency: (percent: number) => void;
  readonly monthlyKwh: readonly number[] | null;
  readonly onMonth: (month: number, kwh: number) => void;
  readonly saves: BuilderFieldSaves<'efficiency' | 'months'>;
}

export interface FinancialsStepModel {
  readonly step: 'financials';
  /** The lead's monthly bill: typed here and saved on the lead (`T-M06-007`). */
  readonly monthlyBill: number | null;
  readonly onMonthlyBill: (bill: number | null) => void;
  readonly tariffPerKwh: number | null;
  readonly onTariff: (tariff: number | null) => void;
  readonly tariffRisePercent: number;
  readonly onTariffRise: (percent: number) => void;
  readonly horizonYears: number;
  readonly onHorizon: (years: number) => void;
  readonly saves: BuilderFieldSaves<'monthlyBill' | 'tariff' | 'tariffRise' | 'horizon'>;
}

export interface TimelineStepModel {
  readonly step: 'timeline';
  readonly phases: Wire['timeline'];
  readonly onMove: (index: number, by: -1 | 1) => void;
  readonly onRemove: (index: number) => void;
  readonly onEdit: (index: number) => void;
  readonly onAdd: () => void;
  readonly onReset: () => void;
}

export interface PaymentStepModel {
  readonly step: 'payment';
  readonly plans: readonly { readonly id: string; readonly name: string }[];
  /** The plan the rows still match; `null` once a row was changed. */
  readonly planId: string | null;
  readonly onPlan: (id: string) => void;
  readonly parts: readonly {
    readonly key: string;
    readonly label: string;
    readonly dueOnStage: ProjectChainStage;
    readonly percent: number;
  }[];
  readonly onShare: (index: number, percent: number) => void;
  /** Absent while the plan holds one part: a plan with none cannot be shared out. */
  readonly onRemove?: (index: number) => void;
  /** Opens the part's own sheet: its name and the stage it falls due on (`T-M06-009`). */
  readonly onOpen: (index: number) => void;
  /** Opens that sheet on a new part. */
  readonly onAdd: () => void;
  readonly onReset: () => void;
}

export interface ComponentsStepModel {
  readonly step: 'components';
  readonly picked: number;
  readonly required: number;
  readonly categories: readonly ComponentCategory[];
  readonly onPick: (category: ComponentCategory) => void;
  readonly saves: BuilderFieldSaves<'components'>;
}

export interface TermsStepModel {
  readonly step: 'terms';
  readonly terms: Wire['terms'];
  readonly onChange: (terms: Wire['terms']) => void;
  readonly onCommit: (terms: Wire['terms']) => void;
  /** For a holder of the settings right alone (`M06-15`). */
  readonly onSaveAsDefault?: () => void;
  readonly savingDefault: boolean;
  /** The terms on screen are the company's default now: the last *Save as default* landed. */
  readonly defaultSaved: boolean;
  /** Why the last *Save as default* did not land, said at its button; `null` while none failed. */
  readonly defaultFailure: DataError | null;
  /** The language the company's terms exist in, when it is not the customer's (`T-M06-027`). */
  readonly printsIn: string | null;
  readonly saves: BuilderFieldSaves<'terms'>;
}

export interface ClientStepModel {
  readonly step: 'client';
  readonly name: string;
  /** The customer's number as E.164, from the lead; the view groups it the market's way. */
  readonly phone?: string;
  readonly address: string;
  readonly onAddress: (address: string) => void;
  /** Empty, and Generate was asked for: said under the field where the check's row lands. */
  readonly addressMissing: boolean;
  /** The site's region and district (`M06-09`): saved on the lead, read by the tax and the energy fill. */
  readonly area: { readonly area: string; readonly district: string | null } | null;
  readonly onArea: (area: { area: string; district: string | null }) => void;
  /** No state, and Generate was asked for: said on the State field, where the check's row lands. */
  readonly areaMissing: boolean;
  /** `null` until the first Generate assigns it (`M06-44`). */
  readonly number: string | null;
  readonly language: string;
  readonly saves: BuilderFieldSaves<'address' | 'area'>;
}

export interface BankStepModel {
  readonly step: 'bank';
  readonly include: boolean;
  readonly onInclude: (include: boolean) => void;
  /** The viewer may write the company's facts (`M06-17`); the fields are theirs alone. */
  readonly mayEdit: boolean;
  /** The company's account as typed, for who may write it; absent for anyone else, or until read. */
  readonly edit?: {
    readonly details: {
      readonly bankName: string;
      readonly accountName: string;
      readonly accountNumber: string;
      readonly bankRoutingIdentifier: string;
    };
    readonly onDetail: (
      field: 'bankName' | 'accountName' | 'accountNumber' | 'bankRoutingIdentifier',
      value: string,
    ) => void;
  };
}

export type BuilderStepModel =
  | CompanyStepModel
  | TrackRecordStepModel
  | SystemStepModel
  | PerformanceStepModel
  | FinancialsStepModel
  | TimelineStepModel
  | PaymentStepModel
  | ComponentsStepModel
  | TermsStepModel
  | ClientStepModel
  | BankStepModel;

/** One brand a picker offers (`M06-28`): a resolved catalog item or one of the company's saved parts. */
export interface PartChoice {
  readonly key: string;
  readonly brand: string;
  /** Its specification and warranty, as stored. */
  readonly line: string;
  /** Certification scheme keys the item holds — the mark a subsidy-path proposal checks (`F1-34`). */
  readonly schemes: readonly string[];
  readonly picked: boolean;
}

/** A line as the edit sheet takes and answers it. */
export type BuilderComponentLine = ComponentLineWire;
