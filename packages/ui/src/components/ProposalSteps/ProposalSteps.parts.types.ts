import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BankDetails,
  BatteryChemistry,
  DealSegment,
  DiscountMode,
  MaintenanceKind,
  ProposalCover,
  ProposalPhase,
  ProposalType,
  SupplyPhase,
  SystemType,
} from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type {
  ProposalBankBlockProps,
  ProposalGenerationBlockProps,
  ProposalPartsBlockProps,
  ProposalPriceBlockProps,
  ProposalSavingsBlockProps,
  ProposalSplitBlockProps,
} from '../ProposalBlocks/ProposalBlocks.types';
import type { RichTextValue } from '../RichText/RichText.types';
import type {
  BankField,
  CoverChoice,
  FieldSaves,
  StepFact,
  StepNotice,
  TrackRecordCount,
} from './ProposalSteps.shared.types';
import type {
  BankStepWords,
  ClientStepWords,
  CompanyStepWords,
  ComponentsStepWords,
  FinancialsStepWords,
  PaymentStepWords,
  PerformanceStepWords,
  SystemStepWords,
  TermsStepWords,
  TimelineStepWords,
  TrackRecordStepWords,
} from './ProposalSteps.words.types';

/** One view per step: what its `packages/data` hook assembles (`ProposalSteps.types.ts`). */

export interface CompanyStepView {
  readonly step: 'company';
  readonly words: CompanyStepWords;
  readonly proposalType: ProposalType;
  readonly onProposalType: (type: ProposalType) => void;
  readonly covers: readonly CoverChoice[];
  readonly cover: string;
  readonly onCover: (key: string) => void;
  /** The phone's peek of the cover page; pressing it opens the preview. */
  /** `null` while no price is typed: no page draws yet, so no peek is drawn. */
  readonly peek?: { readonly page: ReactNode | null; readonly onOpen: () => void };
  /** The company's facts, read-only here: changed in settings by who may (`M06-07`). */
  readonly facts: readonly StepFact[];
}

export interface TrackRecordStepView {
  readonly step: 'achievements';
  readonly words: TrackRecordStepWords;
  readonly record: ProposalCover;
  readonly onCount: (count: TrackRecordCount, value: number | null) => void;
  /** Proposal defaults alone: the company's words about itself. */
  readonly about?: { readonly max: number; readonly onCommit: (text: string) => void };
  readonly saves?: FieldSaves<TrackRecordCount | 'about'>;
}

export type MaintenanceChoice = { readonly kind: MaintenanceKind; readonly years: number | null };

/** The battery a system carries (`M06-30`), as step 3 types it; money in the major unit. */
export interface BatteryDraft {
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

export interface SystemStepView {
  readonly step: 'system';
  readonly words: SystemStepWords;
  /** The price block the customer reads; the phone opens the step with it, in the hero. */
  readonly price: Omit<ProposalPriceBlockProps, 'mode'> | null;
  readonly capacityKw: number | null;
  readonly onCapacity: (kw: number) => void;
  readonly systemType: SystemType;
  readonly onSystemType: (type: SystemType) => void;
  /** Home or business, the lead's Category (`M06-09`); `null` until chosen. */
  readonly segment: DealSegment | null;
  readonly onSegment: (segment: DealSegment) => void;
  /** The system needs a battery and holds none: said at once, blocked only at Generate (`M06-30`). */
  readonly batteryNotice?: StepNotice & { readonly tone: 'danger' | 'warning' };
  /** The price as typed, tax included; `null` until typed. */
  readonly priceInclusive: number | null;
  readonly onPrice: (price: number | null) => void;
  /** The company holds no tax registration: no tax line prints, and the step says so (`T-M06-024`). */
  readonly noTax?: StepNotice;
  readonly discount: { readonly mode: DiscountMode; readonly value: number | null };
  readonly onDiscount: (discount: { mode: DiscountMode; value: number | null }) => void;
  /** Absent where the market offers this deal no incentive (`M06-38`). */
  readonly incentive?: { readonly claimed: boolean; readonly onClaimed: (on: boolean) => void };
  readonly sanctionedLoadKw: number | null;
  readonly onSanctionedLoad: (kw: number | null) => void;
  readonly supplyPhase: SupplyPhase | null;
  readonly onSupplyPhase: (phase: SupplyPhase) => void;
  readonly maintenance: MaintenanceChoice;
  readonly onMaintenance: (plan: MaintenanceChoice) => void;
  /** `null` while the EMI example is off. Rate in percent a year, tenure in years. */
  readonly emi: { readonly ratePercent: number; readonly tenureYears: number } | null;
  readonly onEmi: (emi: { ratePercent: number; tenureYears: number } | null) => void;
  /** What turning the example on starts with — the market pack's typical terms. */
  readonly emiTypical: { readonly ratePercent: number; readonly tenureYears: number };
  /** `null` while the system carries no battery. */
  readonly battery: BatteryDraft | null;
  readonly onBattery: (battery: BatteryDraft | null) => void;
  /** Present only for a viewer who may see cost (`M06-09`): absent, the row is not drawn at all. */
  readonly ourCost?: {
    readonly value: number | null;
    readonly onCost: (cost: number | null) => void;
  };
  readonly saves?: FieldSaves<SystemField>;
}

export interface PerformanceStepView {
  readonly step: 'performance';
  readonly words: PerformanceStepWords;
  /** The generation block; `null` until the step holds figures. */
  readonly generation: Omit<ProposalGenerationBlockProps, 'mode'> | null;
  /** How the figures came: the source of record, the built-in estimate, or not filled yet. */
  readonly fill: 'source' | 'built_in' | 'none' | 'filling';
  /** Restores the source's figures after an edit, or asks the source again when it was down. */
  readonly onRefill: () => void;
  /** The size changed since the person typed their own month figures (`T-M06-033`). */
  readonly capacityChanged?: StepNotice;
  readonly efficiencyPercent: number;
  readonly onEfficiency: (percent: number) => void;
  /** Twelve figures, January first, kWh for the whole system; `null` until filled. */
  readonly monthlyKwh: readonly number[] | null;
  readonly onMonth: (month: number, kwh: number) => void;
  readonly saves?: FieldSaves<'efficiency' | 'months'>;
}

export interface FinancialsStepView {
  readonly step: 'financials';
  readonly words: FinancialsStepWords;
  readonly savings: Omit<ProposalSavingsBlockProps, 'mode'> | null;
  /** The lead's monthly bill. With a commit it is typed here and saved on the lead; without, read-only. */
  readonly monthlyBill: number | null;
  readonly onMonthlyBill?: (bill: number | null) => void;
  readonly tariffPerKwh: number | null;
  readonly onTariff: (tariff: number | null) => void;
  readonly tariffRisePercent: number;
  readonly onTariffRise: (percent: number) => void;
  readonly horizonYears: number;
  readonly onHorizon: (years: number) => void;
  readonly saves?: FieldSaves<'monthlyBill' | 'tariff' | 'tariffRise' | 'horizon'>;
}

export interface TimelineStepView {
  readonly step: 'timeline';
  readonly words: TimelineStepWords;
  readonly phases: readonly ProposalPhase[];
  readonly onMove: (index: number, by: -1 | 1) => void;
  readonly onRemove: (index: number) => void;
  /** Opens the one sheet for a phase's name, sentence and duration. */
  readonly onEdit: (index: number) => void;
  readonly onAdd: () => void;
  /** Back to the company's timeline in force (`M06-12`). */
  readonly onReset: () => void;
}

/** One part of the payment plan as the step shows it. */
export interface PaymentPartView {
  readonly key: string;
  /** biome-ignore lint/plugin/copy-prop-type: a fact — the company's own name for the part */
  readonly label: string;
  /** When it falls due, in the reader's words. */
  readonly due: TranslatedText;
  /** Whole percent of the payable. */
  readonly percent: number;
}

export interface PaymentStepView {
  readonly step: 'payment';
  readonly words: PaymentStepWords;
  readonly split: Omit<ProposalSplitBlockProps, 'mode'>;
  /** The company's named plans (`M01-54`). */
  readonly plans: readonly { readonly id: string; readonly name: string }[];
  /** The plan the rows still match; `null` once a row was changed. */
  readonly planId: string | null;
  readonly onPlan: (id: string) => void;
  /** Proposal defaults alone: opens the new-plan editor. */
  readonly onNewPlan?: () => void;
  readonly parts: readonly PaymentPartView[];
  readonly onShare: (index: number, percent: number) => void;
  readonly onRemove?: (index: number) => void;
  /** Opens the part's own sheet: its name and the stage it falls due on (`T-M06-009`). */
  readonly onOpen?: (index: number) => void;
  readonly onAdd: () => void;
  readonly onReset: () => void;
}

export interface ComponentsStepView {
  readonly step: 'components';
  readonly words: ComponentsStepWords;
  /** How many of the required kinds hold a brand — the counter is the gate (`M06-27`). */
  readonly picked: number;
  readonly required: number;
  readonly parts: Omit<ProposalPartsBlockProps, 'mode'>;
  /** The parts' last save: a section the server refused — a fourth brand — says why here (`F8-36`). */
  readonly saves?: FieldSaves<'components'>;
}

export interface TermsStepView {
  readonly step: 'terms';
  readonly words: TermsStepWords;
  readonly terms: RichTextValue;
  readonly onChange: (terms: RichTextValue) => void;
  readonly onCommit: (terms: RichTextValue) => void;
  readonly maxLength?: number;
  /** For a holder of the settings right alone: makes these the company's default terms (`M06-15`). */
  readonly onSaveAsDefault?: () => void;
  readonly savingDefault?: boolean;
  /** The terms on screen are the company's default now: the last *Save as company default* landed. */
  readonly defaultSaved?: boolean;
  /** Why the last *Save as company default* did not land, said at its button. */
  readonly defaultFailure?: TranslatedText;
  readonly saves?: FieldSaves<'terms'>;
}

/** One region a site may sit in, with its districts — the market pack's (`M06-09`). */
export interface ClientAreaOption {
  readonly code: string;
  /** A fact: the region's name as the market pack writes it. */
  readonly name: string;
  readonly districts: readonly string[];
}

export interface ClientStepView {
  readonly step: 'client';
  readonly words: ClientStepWords;
  /** A fact: the customer's name */
  readonly name: string;
  /** A fact: the customer's number, as the pack groups it; absent where the read carries none. */
  readonly phone?: string;
  /** The site's address: saved on the lead (`M06-16`). */
  readonly address: string;
  readonly onAddress: (address: string) => void;
  /** The address is missing: said under the field, and listed at Generate. */
  readonly addressMissing: boolean;
  /**
   * The site's region and district (`M06-09`, `T-M06-012`): saved on the lead; the tax and the
   * generation estimate read them. Absent where the market declares no regions.
   */
  readonly area?: {
    readonly options: readonly ClientAreaOption[];
    /** No state, and Generate was asked for: the State field wears the error, where the check's row lands. */
    readonly missing: boolean;
    readonly code: string | null;
    readonly district: string | null;
    readonly onArea: (area: { area: string; district: string | null }) => void;
  };
  /** The proposal's number and the document's language. */
  readonly facts: readonly StepFact[];
  readonly saves?: FieldSaves<'address' | 'area'>;
}

export interface BankStepView {
  readonly step: 'bank';
  readonly words: BankStepWords;
  /** The account as the customer reads it; `null` while the company holds none. */
  readonly bank: Omit<ProposalBankBlockProps, 'mode'> | null;
  readonly include: boolean;
  readonly onInclude: (include: boolean) => void;
  /** For a holder of the settings right alone (`M06-17`): absent, a line names who can add them. */
  readonly edit?: {
    readonly details: BankDetails;
    readonly onDetail: (field: BankField, value: string) => void;
  };
  readonly saves?: FieldSaves<BankField>;
}
