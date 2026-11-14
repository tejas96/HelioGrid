import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BatteryChemistry,
  DealSegment,
  DiscountMode,
  MaintenanceKind,
  ProposalPhase,
  ProposalType,
  SupplyPhase,
  SystemType,
} from '@heliogrid/domain';
import type { NumberFieldWords } from '../NumberField/NumberField.types';
import type { RichTextWords } from '../RichText/RichText.types';
import type { BankField, TrackRecordCount } from './ProposalSteps.shared.types';

/** The words the steps say themselves (`packages/i18n`'s `proposalStepWords`). No English lives here. */

/** What every step shares: a field's save line, the loading name, the failed read. */
export interface ProposalStepWords {
  readonly number: NumberFieldWords;
  readonly saved: TranslatedText;
  readonly saving: TranslatedText;
  /** `Not saved — tap to retry`. */
  readonly notSaved: TranslatedText;
  /** `Changed on another device — reload`. */
  readonly conflict: TranslatedText;
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

export interface CompanyStepWords {
  readonly type: TranslatedText;
  readonly typeOf: Readonly<
    Record<ProposalType, { readonly title: TranslatedText; readonly line: TranslatedText }>
  >;
  readonly cover: TranslatedText;
  /** The phone's tag on the cover peek — `Anil's first page`. */
  readonly peek: TranslatedText;
  /** The peek's spoken act — `See the full page`. */
  readonly openPeek: TranslatedText;
  /** Who may change the company's facts, and where. */
  readonly factsLine: TranslatedText;
}

export interface TrackRecordStepWords {
  readonly counts: Readonly<Record<TrackRecordCount, TranslatedText>>;
  readonly hint: TranslatedText;
  readonly about: TranslatedText;
  readonly aboutCount: (count: number, max: number) => TranslatedText;
}

export interface SystemStepWords {
  readonly size: TranslatedText;
  /** The unit after the size — `kW`; never translated. */
  readonly sizeUnit: TranslatedText;
  readonly smaller: TranslatedText;
  readonly bigger: TranslatedText;
  readonly commonSizes: TranslatedText;
  /** A size chip — `3 kW`. */
  readonly sizeChip: (kw: number) => TranslatedText;
  /** The picked panel's count and watt-peak, once step 8 holds a panel; absent before. */
  readonly panelLine?: TranslatedText;
  readonly systemType: TranslatedText;
  readonly systemTypes: Readonly<Record<SystemType, TranslatedText>>;
  readonly category: TranslatedText;
  readonly segments: Readonly<Record<DealSegment, TranslatedText>>;
  readonly price: TranslatedText;
  /** `Includes GST 8.9%`, or `No GST`. */
  readonly priceTag: TranslatedText;
  /** `Before GST ₹1,75,000`; absent while no price is typed. */
  readonly priceHelper?: TranslatedText;
  readonly discount: TranslatedText;
  readonly discountValue: TranslatedText;
  readonly discountField: TranslatedText;
  readonly discountHelper: TranslatedText;
  readonly discountModes: Readonly<Record<DiscountMode, TranslatedText>>;
  readonly discountMode: TranslatedText;
  /** The incentive's name, the market pack's — `PM Surya Ghar subsidy`. */
  readonly incentive: TranslatedText;
  /** What the switch came to: the amount and who is paid, or that it is not claimed. */
  readonly incentiveValue: TranslatedText;
  readonly incentiveSwitch: TranslatedText;
  readonly supply: TranslatedText;
  readonly supplyValue: TranslatedText;
  readonly sanctionedLoad: TranslatedText;
  readonly supplyPhase: TranslatedText;
  readonly supplyPhases: Readonly<Record<SupplyPhase, TranslatedText>>;
  readonly supplyHelper: TranslatedText;
  readonly maintenance: TranslatedText;
  readonly maintenanceValue: TranslatedText;
  readonly maintenanceKinds: Readonly<Record<MaintenanceKind, TranslatedText>>;
  readonly maintenanceYears: TranslatedText;
  readonly emi: TranslatedText;
  readonly emiValue: TranslatedText;
  readonly emiSwitch: TranslatedText;
  readonly emiSwitchLine: TranslatedText;
  readonly emiRate: TranslatedText;
  readonly emiTenure: TranslatedText;
  readonly years: TranslatedText;
  readonly percentPerYear: TranslatedText;
  readonly battery: TranslatedText;
  readonly batteryValue: TranslatedText;
  readonly batteryCapacity: TranslatedText;
  readonly batteryCost: TranslatedText;
  readonly batteryChemistry: TranslatedText;
  readonly chemistries: Readonly<Record<BatteryChemistry, TranslatedText>>;
  readonly chemistryCustom: TranslatedText;
  readonly removeBattery: TranslatedText;
  readonly ourCost: TranslatedText;
  readonly ourCostValue: TranslatedText;
  readonly ourCostField: TranslatedText;
  readonly ourCostHelper: TranslatedText;
}

export interface PerformanceStepWords {
  /** `Filled for you`, `PVGIS did not answer`, or that nothing is filled yet. */
  readonly fillTitle: TranslatedText;
  readonly fillLine: TranslatedText;
  /** `Reset`, `Try PVGIS` or `Fill it in`. */
  readonly refill: TranslatedText;
  readonly efficiency: TranslatedText;
  readonly efficiencyHelper: TranslatedText;
  readonly months: TranslatedText;
  readonly monthsValue: TranslatedText;
  /** Twelve month names in the reader's words, January first. */
  readonly monthNames: readonly TranslatedText[];
  /** A month field's spoken name — `January, kWh`. */
  readonly monthField: (month: TranslatedText) => TranslatedText;
}

export interface FinancialsStepWords {
  readonly monthlyBill: TranslatedText;
  readonly monthlyBillHelper: TranslatedText;
  readonly tariff: TranslatedText;
  readonly tariffUnit: TranslatedText;
  readonly assumptions: TranslatedText;
  readonly assumptionsValue: TranslatedText;
  readonly tariffRise: TranslatedText;
  readonly tariffRiseUnit: TranslatedText;
  readonly horizon: TranslatedText;
}

export interface TimelineStepWords {
  /** A row's second line — `2 days · tap to edit`. */
  readonly rowLine: (phase: ProposalPhase) => TranslatedText;
  readonly edit: (name: string) => TranslatedText;
  readonly moveUp: (name: string) => TranslatedText;
  readonly moveDown: (name: string) => TranslatedText;
  readonly remove: (name: string) => TranslatedText;
  readonly add: TranslatedText;
  readonly reset: TranslatedText;
}

export interface PaymentStepWords {
  readonly plans: TranslatedText;
  readonly newPlan: TranslatedText;
  /** Whose terms these are now: the company's, changed for this proposal, or the default being set. */
  readonly note: TranslatedText;
  readonly less: (label: string) => TranslatedText;
  readonly more: (label: string) => TranslatedText;
  /** A part's share, spoken — `Advance, percent`. */
  readonly share: (label: string) => TranslatedText;
  readonly remove: (label: string) => TranslatedText;
  /** A part's own sheet, spoken — `Edit Advance`. */
  readonly edit: (label: string) => TranslatedText;
  readonly add: TranslatedText;
  readonly reset: TranslatedText;
  readonly hint: TranslatedText;
}

export interface ComponentsStepWords {
  /** `Every part is picked`, or `2 parts left to pick`. */
  readonly title: TranslatedText;
  readonly line: TranslatedText;
  /** The ring, spoken — `3 of 5 parts picked`. */
  readonly ring: TranslatedText;
}

export interface TermsStepWords {
  readonly label: TranslatedText;
  readonly richText: RichTextWords;
  /** `About 1 page · 468 characters`; absent until the editor has measured. */
  readonly estimate?: TranslatedText;
  readonly saveAsDefault: TranslatedText;
  /** Terms that would print past their pages cannot be saved (`M06-15`): said under the field. */
  readonly overPages: TranslatedText;
  /** `Saved as the company default.` — the done of *Save as company default*. */
  readonly defaultSaved: TranslatedText;
  /** The failed *Save as company default*, when the failure has no words of its own. */
  readonly defaultFailed: TranslatedText;
  /** For who may not save a default: the change stays on this proposal. */
  readonly staysHere: TranslatedText;
}

export interface ClientStepWords {
  /** `From the lead`. */
  readonly fromLead: TranslatedText;
  readonly address: TranslatedText;
  readonly addressHelper: TranslatedText;
  readonly addressMissing: TranslatedText;
  /** Said on the State field when the site has none and Generate was asked for. */
  readonly areaMissing: TranslatedText;
  /** The region's and the district's field names — the market pack's words for them. */
  readonly area: TranslatedText;
  readonly district: TranslatedText;
  /** What an unpicked list reads — `Choose`. */
  readonly choose: TranslatedText;
  /** The lists' close button, spoken. */
  readonly closeList: TranslatedText;
}

export interface BankStepWords {
  readonly include: TranslatedText;
  /** What the switch came to: on the last page, or saved and not printed (`M06-17`). */
  readonly includeLine: TranslatedText;
  readonly fields: Readonly<Record<BankField, TranslatedText>>;
  /** For who may not write them: who can. */
  readonly whoCan: TranslatedText;
  /** The company holds no account yet. */
  readonly none: TranslatedText;
}
