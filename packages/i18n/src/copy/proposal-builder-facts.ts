import type { TranslatedText } from '@heliogrid/contracts';
import {
  basisPointsToPercent,
  type MinorUnits,
  type ProjectChainStage,
  type ProposalVersionSnapshot,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import type { SystemStepFacts } from './proposal-builder-system';

/** What the builder's step words are built over, and step 3's facts read out of them. */
type T = Translator['t'];

export const PERCENT = /*i18n*/ { id: '{value}%' };

/** What every step's words are built over, beside the step itself. */
export interface BuilderSaidFacts {
  /** The customer's first name. */
  readonly name: string;
  /** Who can change the company's facts — for a viewer who cannot; absent for one who can. */
  readonly owner?: string;
  /** The tax's name — `GST` — and the bank routing identifier's — `IFSC` — the market pack's. */
  readonly taxName: string;
  readonly routingLabel: string;
  /** The source of record's name — `PVGIS`. */
  readonly energySource: string;
  readonly snapshot: ProposalVersionSnapshot | null;
  readonly monthNames: readonly string[];
  readonly format: {
    readonly amount: (amount: MinorUnits) => string;
    readonly number: (value: number) => string;
    /** A number as the market groups it — `+91 99999 98801`. */
    readonly phone: (e164: string) => string;
  };
  /** What the terms editor last measured. */
  readonly termsEstimate?: { readonly pages: number; readonly chars: number };
  /** The stage a payment part falls due on, in the customer's words (`proposalBlockWords().split.due`). */
  readonly due: (stage: ProjectChainStage) => TranslatedText;
}

/** The step's model, as much of it as its words read — `packages/data`'s `BuilderStepModel` fits. */
export type BuilderSaidStep =
  | { readonly step: 'company' }
  | { readonly step: 'timeline' }
  | { readonly step: 'achievements' }
  | {
      readonly step: 'system';
      readonly batteryNeeded: 'danger' | 'warning' | null;
      readonly noTax: boolean;
      readonly systemType: 'on_grid' | 'hybrid' | 'off_grid';
      readonly sanctionedLoadKw: number | null;
      readonly supplyPhase: SystemStepFacts['supplyPhase'];
      readonly maintenance: SystemStepFacts['maintenance'];
      readonly emi: { readonly ratePercent: number; readonly tenureYears: number } | null;
      readonly battery: {
        readonly capacityKwh: number;
        readonly chemistry: NonNullable<SystemStepFacts['battery']>['chemistry'];
        readonly chemistryCustom: string | null;
      } | null;
      readonly ourCost?: { readonly value: number | null };
      readonly incentive?: {
        readonly claimed: boolean;
        readonly name: string;
        readonly requiredScheme: string | null;
        readonly paidTo: 'customer' | 'company';
      };
    }
  | {
      readonly step: 'performance';
      readonly fill: 'source' | 'built_in' | 'none' | 'filling';
      /** What the fill still needs, and whether the server refused the last one (`FillWants`). */
      readonly fillWants: {
        readonly size: boolean;
        readonly state: boolean;
        readonly refused: boolean;
      };
      /** The place and size the fill is asked for, from the draft's own facts (`PerformanceStepModel`). */
      readonly asked: { readonly place: string | null; readonly capacityKw: number | null };
      readonly edited: boolean;
    }
  | {
      readonly step: 'financials';
      readonly tariffRisePercent: number;
      readonly horizonYears: number;
    }
  | { readonly step: 'payment'; readonly planId: string | null }
  | { readonly step: 'components'; readonly picked: number; readonly required: number }
  | { readonly step: 'terms'; readonly printsIn: string | null }
  | { readonly step: 'client'; readonly number: string | null; readonly language: string }
  | { readonly step: 'bank'; readonly include: boolean };

export type SystemStep = Extract<BuilderSaidStep, { step: 'system' }>;
type Money = NonNullable<ProposalVersionSnapshot['money']>;

/**
 * The incentive row's facts: the pack names the scheme and what it binds before any price is
 * typed; the server's money block adds the amount once it has one and the incentive is claimed.
 */
function incentiveFacts(facts: BuilderSaidFacts, step: SystemStep, money: Money | null) {
  const { incentive } = step;
  if (incentive === undefined) return {};
  const amount = incentive.claimed ? (money?.incentive ?? null) : null;
  return {
    incentive: {
      name: incentive.name,
      ...(incentive.requiredScheme === null ? {} : { scheme: incentive.requiredScheme }),
      ...(amount === null ? {} : { amountText: facts.format.amount(amount.amount) }),
      paidTo: amount?.paidTo ?? incentive.paidTo,
      claimed: incentive.claimed,
    },
  };
}

/** What the server's money block gives step 3's words; none of it while no price is typed. */
function moneyFacts(facts: BuilderSaidFacts, money: Money | null) {
  if (money === null) return {};
  const { format } = facts;
  return {
    preTaxText: format.amount(money.preTax),
    ...(money.discount === 0 ? {} : { discountText: format.amount(money.discount) }),
  };
}

/** The picked panel's count and watt-peak, once step 8 holds one (`T-M06-005`). */
function panelFacts(snapshot: ProposalVersionSnapshot | null) {
  const panel = snapshot?.fields.components.find((line) => line.category === 'panel');
  if (panel?.category !== 'panel' || panel.count === null || panel.wattPeak === null) return {};
  return { panel: { count: panel.count, wattPeak: panel.wattPeak } };
}

function emiFacts(t: T, facts: BuilderSaidFacts, step: SystemStep) {
  if (step.emi === null) return {};
  const monthly = facts.snapshot?.emi?.monthly;
  return {
    emi: {
      ...(monthly === undefined ? {} : { monthlyText: facts.format.amount(monthly) }),
      years: step.emi.tenureYears,
      rateText: t(PERCENT, { value: facts.format.number(step.emi.ratePercent) }),
    },
  };
}

function batteryFacts(facts: BuilderSaidFacts, step: SystemStep) {
  if (step.battery === null) return {};
  return {
    battery: {
      sizeText: facts.format.number(step.battery.capacityKwh),
      chemistry: step.battery.chemistry,
      custom: step.battery.chemistryCustom,
    },
  };
}

export function systemFacts(t: T, facts: BuilderSaidFacts, step: SystemStep): SystemStepFacts {
  const { snapshot, format } = facts;
  const system = snapshot?.fields.system;
  const rate =
    system === undefined ? '' : format.number(Number(basisPointsToPercent(system.taxRate)));
  const ourCost = system?.ourCost ?? null;
  const load = step.sanctionedLoadKw;
  return {
    name: facts.name,
    taxName: facts.taxName,
    taxRateText: rate === '' ? '' : t(PERCENT, { value: rate }),
    taxRegistered: !step.noTax,
    ...(facts.owner === undefined ? {} : { owner: facts.owner }),
    ...moneyFacts(facts, snapshot?.money ?? null),
    ...incentiveFacts(facts, step, snapshot?.money ?? null),
    ...panelFacts(snapshot),
    ...(load === null ? {} : { sanctionedLoadText: format.number(load) }),
    supplyPhase: step.supplyPhase,
    maintenance: step.maintenance,
    ...emiFacts(t, facts, step),
    ...batteryFacts(facts, step),
    ...(step.ourCost === undefined || ourCost === null
      ? {}
      : { ourCostText: format.amount(ourCost) }),
  };
}
