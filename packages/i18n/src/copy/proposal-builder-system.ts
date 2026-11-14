import type { TranslatedText } from '@heliogrid/contracts';
import type {
  BatteryChemistry,
  DiscountMode,
  MaintenanceKind,
  SupplyPhase,
  SystemType,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { NO_WORDS, shownAsSent } from './assembled';
import { DEAL_SEGMENT_WORD as SEGMENT } from './crm-vocabulary';
import { QUICK_ADD } from './quick-add';

/**
 * Step 3's words (`packages/ui`'s `SystemStepWords`, `T-M06-005`): the size, the price and the rows
 * that open in place. A tax's, an incentive's and a scheme's name are the market pack's; every
 * amount arrives as the text the server sent. kW and kWh are never translated.
 */

type T = Translator['t'];

const SYSTEM = {
  size: /*i18n*/ { id: 'System size' },
  kw: /*i18n*/ { id: 'kW' },
  smaller: /*i18n*/ { id: 'Smaller' },
  bigger: /*i18n*/ { id: 'Bigger' },
  commonSizes: /*i18n*/ { id: 'Common sizes' },
  sizeChip: /*i18n*/ { id: '{size} kW' },
  panelLine: /*i18n*/ { id: '{count, plural, one {# panel} other {# panels}} of {watts} Wp' },
  systemType: /*i18n*/ { id: 'System type' },
  price: /*i18n*/ { id: 'System price' },
  includesTax: /*i18n*/ { id: 'Includes {tax} {rate}' },
  noTaxTag: /*i18n*/ { id: 'No {tax}' },
  beforeTax: /*i18n*/ { id: 'Before {tax} {amount}' },
  discount: /*i18n*/ { id: 'Discount' },
  discountNone: /*i18n*/ { id: 'None' },
  discountOff: /*i18n*/ { id: '{amount} off, before {tax}' },
  discountField: /*i18n*/ { id: 'Discount, before {tax}' },
  discountHelper: /*i18n*/ { id: '{tax} is worked out again on the lower price.' },
  discountMode: /*i18n*/ { id: 'Discount as' },
  modeAmount: /*i18n*/ { id: 'Amount' },
  modePercent: /*i18n*/ { id: 'Percent' },
  incentiveOn: /*i18n*/ { id: '{amount} · the government pays {name}' },
  incentiveOnCompany: /*i18n*/ { id: '{amount} · taken off the price' },
  incentiveOff: /*i18n*/ { id: 'Not claimed · panels need not be {scheme}' },
  incentiveOffPlain: /*i18n*/ { id: 'Not claimed' },
  incentiveWaits: /*i18n*/ { id: 'Claimed · worked out once the price is typed' },
  incentiveSwitch: /*i18n*/ { id: '{incentive} claimed' },
  supply: /*i18n*/ { id: 'Site supply' },
  supplyValue: /*i18n*/ { id: '{load} kW sanctioned · {phase}' },
  supplyUnknown: /*i18n*/ { id: 'Not known yet' },
  sanctionedLoad: /*i18n*/ { id: 'Sanctioned load' },
  supplyPhase: /*i18n*/ { id: 'Supply' },
  single: /*i18n*/ { id: '1-phase' },
  three: /*i18n*/ { id: '3-phase' },
  singleLong: /*i18n*/ { id: 'single phase' },
  threeLong: /*i18n*/ { id: 'three phase' },
  supplyHelper: /*i18n*/ { id: 'Saved on the lead, so nobody asks {name} again.' },
  maintenance: /*i18n*/ { id: 'Yearly maintenance' },
  maintenanceNone: /*i18n*/ { id: 'Not included' },
  maintenanceFree: /*i18n*/ { id: 'Free maintenance included' },
  maintenancePlan: /*i18n*/ {
    id: '{years, plural, one {#-year plan included} other {#-year plan included}}',
  },
  kindNone: /*i18n*/ { id: 'None' },
  kindFree: /*i18n*/ { id: 'Free' },
  kindYears: /*i18n*/ { id: 'Paid plan' },
  maintenanceYears: /*i18n*/ { id: 'Years' },
  emi: /*i18n*/ { id: 'EMI example' },
  emiOff: /*i18n*/ { id: 'Not shown' },
  emiOn: /*i18n*/ {
    id: '{amount} a month · {years, plural, one {# year} other {# years}} at {rate}',
  },
  emiOnNoFigure: /*i18n*/ {
    id: '{years, plural, one {# year} other {# years}} at {rate}',
  },
  emiSwitch: /*i18n*/ { id: 'Show an EMI example' },
  emiSwitchLine: /*i18n*/ { id: 'Printed as a projection with its rate and term.' },
  emiRate: /*i18n*/ { id: 'Interest rate' },
  emiTenure: /*i18n*/ { id: 'Term' },
  years: /*i18n*/ { id: 'years' },
  percentPerYear: /*i18n*/ { id: '% a year' },
  battery: /*i18n*/ { id: 'Battery' },
  batteryValue: /*i18n*/ { id: '{size} kWh · {chemistry}' },
  batteryCapacity: /*i18n*/ { id: 'Battery size, kWh' },
  batteryCost: /*i18n*/ { id: 'Battery price, with {tax}' },
  batteryCostPlain: /*i18n*/ { id: 'Battery price' },
  batteryChemistry: /*i18n*/ { id: 'Cell chemistry' },
  chemistryCustom: /*i18n*/ { id: 'Which chemistry' },
  removeBattery: /*i18n*/ { id: 'Remove the battery' },
  ourCost: /*i18n*/ { id: 'Our cost' },
  ourCostValue: /*i18n*/ { id: '{amount} · never printed' },
  ourCostNone: /*i18n*/ { id: 'Not typed · never printed' },
  ourCostField: /*i18n*/ { id: 'Our cost, before {tax}' },
  ourCostFieldPlain: /*i18n*/ { id: 'Our cost' },
  ourCostHelper: /*i18n*/ { id: 'Only people who manage the catalog see this.' },
} as const;

const SYSTEM_TYPE_NAME: Record<SystemType, { id: string }> = {
  on_grid: /*i18n*/ { id: 'On-grid' },
  hybrid: /*i18n*/ { id: 'Hybrid' },
  off_grid: /*i18n*/ { id: 'Off-grid' },
};

const CHEMISTRY: Record<BatteryChemistry, { id: string }> = {
  lfp: /*i18n*/ { id: 'Lithium LFP' },
  nmc: /*i18n*/ { id: 'Lithium NMC' },
  lead_acid: /*i18n*/ { id: 'Lead-acid' },
  custom: /*i18n*/ { id: 'Custom' },
};

/** What step 3's words are built over: every amount already as the server's text. */
export interface SystemStepFacts {
  /** The customer's first name. */
  readonly name: string;
  /** The tax's name from the market pack — `GST`; and the rate as text — `8.9%`. */
  readonly taxName: string;
  readonly taxRateText: string;
  readonly taxRegistered: boolean;
  /** Who can add the registration, for a viewer who cannot; absent for one who can. */
  readonly owner?: string;
  readonly preTaxText?: string;
  /** The picked panel's count and watt-peak, once step 8 holds one. */
  readonly panel?: { count: number; wattPeak: number };
  readonly discountText?: string;
  /** The incentive's and its scheme's names, the pack's; the amount where it is claimed. */
  readonly incentive?: {
    name: string;
    /** The certification the incentive path binds — `DCR`. */
    scheme?: string;
    amountText?: string;
    paidTo: 'customer' | 'company';
    claimed: boolean;
  };
  readonly sanctionedLoadText?: string;
  readonly supplyPhase: SupplyPhase | null;
  readonly maintenance: { kind: MaintenanceKind; years: number | null };
  readonly emi?: { monthlyText?: string; years: number; rateText: string };
  readonly battery?: { sizeText: string; chemistry: BatteryChemistry; custom: string | null };
  readonly ourCostText?: string;
}

function incentiveValue(t: T, facts: SystemStepFacts) {
  const { incentive } = facts;
  if (incentive === undefined) return t(SYSTEM.incentiveOffPlain);
  if (!incentive.claimed) {
    return incentive.scheme === undefined
      ? t(SYSTEM.incentiveOffPlain)
      : t(SYSTEM.incentiveOff, { scheme: incentive.scheme });
  }
  if (incentive.amountText === undefined) return t(SYSTEM.incentiveWaits);
  return incentive.paidTo === 'customer'
    ? t(SYSTEM.incentiveOn, { amount: incentive.amountText, name: facts.name })
    : t(SYSTEM.incentiveOnCompany, { amount: incentive.amountText });
}

/** A system type's name — `On-grid` — or `null` for a type a newer server learned. */
export function systemTypeWord(t: T, type: string): TranslatedText | null {
  const name = (SYSTEM_TYPE_NAME as Record<string, { id: string } | undefined>)[type];
  return name === undefined ? null : t(name);
}

/** A maintenance plan as the document says it — `Not included`, `3-year plan included`. */
export function maintenanceValue(
  t: T,
  plan: { readonly kind: MaintenanceKind | (string & {}); readonly years: number | null },
) {
  if (plan.kind === 'none') return t(SYSTEM.maintenanceNone);
  if (plan.kind === 'free') return t(SYSTEM.maintenanceFree);
  return t(SYSTEM.maintenancePlan, { years: plan.years ?? 1 });
}

function emiValue(t: T, emi: SystemStepFacts['emi']) {
  if (emi === undefined) return t(SYSTEM.emiOff);
  return emi.monthlyText === undefined
    ? t(SYSTEM.emiOnNoFigure, { years: emi.years, rate: emi.rateText })
    : t(SYSTEM.emiOn, { amount: emi.monthlyText, years: emi.years, rate: emi.rateText });
}

function supplyValue(t: T, facts: SystemStepFacts) {
  if (facts.sanctionedLoadText === undefined || facts.supplyPhase === null) {
    return t(SYSTEM.supplyUnknown);
  }
  return t(SYSTEM.supplyValue, {
    load: facts.sanctionedLoadText,
    phase: t(facts.supplyPhase === 'single' ? SYSTEM.singleLong : SYSTEM.threeLong),
  });
}

function batteryValue(t: T, battery: SystemStepFacts['battery']) {
  if (battery === undefined) return NO_WORDS;
  const custom = battery.chemistry === 'custom' && battery.custom !== null;
  return t(SYSTEM.batteryValue, {
    size: battery.sizeText,
    chemistry: custom ? (battery.custom ?? '') : t(CHEMISTRY[battery.chemistry]),
  });
}

function priceWords(t: T, facts: SystemStepFacts) {
  const tax = facts.taxName;
  if (!facts.taxRegistered) return { priceTag: t(SYSTEM.noTaxTag, { tax }) };
  const priceTag = t(SYSTEM.includesTax, { tax, rate: facts.taxRateText });
  return facts.preTaxText === undefined
    ? { priceTag }
    : { priceTag, priceHelper: t(SYSTEM.beforeTax, { tax, amount: facts.preTaxText }) };
}

function discountValue(t: T, facts: SystemStepFacts) {
  return facts.discountText === undefined
    ? t(SYSTEM.discountNone)
    : t(SYSTEM.discountOff, { amount: facts.discountText, tax: facts.taxName });
}

/** Step 3's words. */
export function proposalSystemStepWords(t: T, facts: SystemStepFacts) {
  const tax = facts.taxName;
  const modes: Record<DiscountMode, ReturnType<T>> = {
    amount: t(SYSTEM.modeAmount),
    percent: t(SYSTEM.modePercent),
  };
  const kinds: Record<MaintenanceKind, ReturnType<T>> = {
    none: t(SYSTEM.kindNone),
    free: t(SYSTEM.kindFree),
    years: t(SYSTEM.kindYears),
  };
  return {
    size: t(SYSTEM.size),
    sizeUnit: t(SYSTEM.kw),
    smaller: t(SYSTEM.smaller),
    bigger: t(SYSTEM.bigger),
    commonSizes: t(SYSTEM.commonSizes),
    sizeChip: (kw: number) => t(SYSTEM.sizeChip, { size: kw }),
    ...(facts.panel === undefined
      ? {}
      : {
          panelLine: t(SYSTEM.panelLine, { count: facts.panel.count, watts: facts.panel.wattPeak }),
        }),
    systemType: t(SYSTEM.systemType),
    systemTypes: {
      on_grid: t(SYSTEM_TYPE_NAME.on_grid),
      hybrid: t(SYSTEM_TYPE_NAME.hybrid),
      off_grid: t(SYSTEM_TYPE_NAME.off_grid),
    },
    /* A lead's segment reads as the CRM names it — *Type* — wherever it is asked (one term per concept). */
    category: t(QUICK_ADD.type),
    segments: { residential: t(SEGMENT.residential), commercial: t(SEGMENT.commercial) },
    price: t(SYSTEM.price),
    ...priceWords(t, facts),
    discount: t(SYSTEM.discount),
    discountValue: discountValue(t, facts),
    discountField: t(SYSTEM.discountField, { tax }),
    discountHelper: t(SYSTEM.discountHelper, { tax }),
    discountModes: modes,
    discountMode: t(SYSTEM.discountMode),
    incentive: shownAsSent(facts.incentive?.name ?? ''),
    incentiveValue: incentiveValue(t, facts),
    incentiveSwitch: t(SYSTEM.incentiveSwitch, { incentive: facts.incentive?.name ?? '' }),
    supply: t(SYSTEM.supply),
    supplyValue: supplyValue(t, facts),
    sanctionedLoad: t(SYSTEM.sanctionedLoad),
    supplyPhase: t(SYSTEM.supplyPhase),
    supplyPhases: { single: t(SYSTEM.single), three: t(SYSTEM.three) },
    supplyHelper: t(SYSTEM.supplyHelper, { name: facts.name }),
    maintenance: t(SYSTEM.maintenance),
    maintenanceValue: maintenanceValue(t, facts.maintenance),
    maintenanceKinds: kinds,
    maintenanceYears: t(SYSTEM.maintenanceYears),
    emi: t(SYSTEM.emi),
    emiValue: emiValue(t, facts.emi),
    emiSwitch: t(SYSTEM.emiSwitch),
    emiSwitchLine: t(SYSTEM.emiSwitchLine),
    emiRate: t(SYSTEM.emiRate),
    emiTenure: t(SYSTEM.emiTenure),
    years: t(SYSTEM.years),
    percentPerYear: t(SYSTEM.percentPerYear),
    battery: t(SYSTEM.battery),
    batteryValue: batteryValue(t, facts.battery),
    batteryCapacity: t(SYSTEM.batteryCapacity),
    batteryCost: facts.taxRegistered ? t(SYSTEM.batteryCost, { tax }) : t(SYSTEM.batteryCostPlain),
    batteryChemistry: t(SYSTEM.batteryChemistry),
    chemistries: {
      lfp: t(CHEMISTRY.lfp),
      nmc: t(CHEMISTRY.nmc),
      lead_acid: t(CHEMISTRY.lead_acid),
      custom: t(CHEMISTRY.custom),
    },
    chemistryCustom: t(SYSTEM.chemistryCustom),
    removeBattery: t(SYSTEM.removeBattery),
    ourCost: t(SYSTEM.ourCost),
    ourCostValue:
      facts.ourCostText === undefined
        ? t(SYSTEM.ourCostNone)
        : t(SYSTEM.ourCostValue, { amount: facts.ourCostText }),
    ourCostField: facts.taxRegistered
      ? t(SYSTEM.ourCostField, { tax })
      : t(SYSTEM.ourCostFieldPlain),
    ourCostHelper: t(SYSTEM.ourCostHelper),
  };
}
