import type { ProvenanceTier, TranslatedText } from '@heliogrid/contracts';
import {
  allocationVerdict,
  bestMonth,
  type MinorUnits,
  MONTHS_PER_YEAR,
  type ProposalEmi,
  type ProposalMoney,
  type ProposalSavings,
  type QualifiedAmount,
  type SchedulePart,
  shareOfBasisPoints,
  shareTextOf,
  type TrancheLine,
} from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import type { ProposalSplitWords } from './ProposalBlocks.parts.types';
import type { ProposalBlockMode, ProposalGenerationFacts } from './ProposalBlocks.types';

/**
 * What each block draws, read out of the server's own answers (`F4-04`, `F8-24`): a figure's text
 * is the server's where it sent one, and the market format's print of the server's amount where it
 * sent the amount alone. Nothing here works a figure out — both platform halves read the same view,
 * so the two cannot draw different numbers.
 */

/** A figure as a block prints it: its number for a bar or a sign, and the text a reader sees. */
export interface BlockFigure {
  readonly value: number;
  readonly text: string;
}

/**
 * A money figure as a headline reads it: the server's amount, its zero fraction left unsaid and a
 * real one printed whole (`format.moneyPlain`) — never rounded here.
 */
const figureOf = (amount: QualifiedAmount, format: MarketFormat): BlockFigure => {
  const value = Number(amount.value);
  return {
    value: Number.isFinite(value) ? value : 0,
    text: format.moneyPlain(amount.value),
  };
};

/** A figure's own tier, or `null` where the block's head already states the same one. */
const tierBeside = (own: ProvenanceTier, head: ProvenanceTier): ProvenanceTier | null =>
  own === head ? null : own;

export interface PriceView {
  readonly tier: ProvenanceTier;
  readonly payable: BlockFigure;
  /** At or below zero (`M06-36`): shown as it is, with its line. */
  readonly bad: boolean;
  /** `null` where the company is registered for no tax, which prints the no-tax line. */
  readonly tax: BlockFigure | null;
  readonly discount: BlockFigure | null;
  readonly perKw: BlockFigure | null;
  /**
   * The incentive and the net cost after it. Each names its own tier only where it differs from the
   * payable's, which the block's head already states (`F8-01`).
   */
  readonly incentive: {
    readonly amount: BlockFigure;
    readonly amountTier: ProvenanceTier | null;
    readonly netCost: BlockFigure;
    readonly netCostTier: ProvenanceTier | null;
  } | null;
  readonly margin: {
    readonly amount: BlockFigure;
    readonly percentText: string;
    readonly loss: boolean;
  } | null;
}

/** The price as the block draws it. The per-kW check and the margin are the builder's alone. */
export function priceView(
  money: ProposalMoney,
  mode: ProposalBlockMode,
  format: MarketFormat,
): PriceView {
  const { figures } = money;
  const builder = mode === 'app';
  const margin = builder ? money.margin : null;
  return {
    tier: figures.payable.tier,
    payable: figureOf(figures.payable, format),
    bad: money.payableAtOrBelowZero,
    tax: money.taxes.length === 0 ? null : figureOf(figures.taxAmount, format),
    discount:
      figures.discount === null || money.discount === 0 ? null : figureOf(figures.discount, format),
    perKw: builder && figures.perKw !== null ? figureOf(figures.perKw, format) : null,
    incentive:
      figures.incentive === null
        ? null
        : {
            amount: figureOf(figures.incentive, format),
            amountTier: tierBeside(figures.incentive.tier, figures.payable.tier),
            netCost: figureOf(figures.netCost, format),
            netCostTier: tierBeside(figures.netCost.tier, figures.payable.tier),
          },
    margin:
      margin === null || figures.margin === null
        ? null
        : {
            amount: figureOf(figures.margin, format),
            percentText: margin.share === null ? '' : `${shareTextOf(Math.abs(margin.share))}%`,
            loss: margin.belowCost,
          },
  };
}

export interface GenerationView {
  readonly annual: BlockFigure;
  /** Twelve figures, January first. */
  readonly monthly: readonly BlockFigure[];
  /** The month that generates most, January as 0; -1 where nothing is generated. */
  readonly peak: number;
  readonly average: BlockFigure;
}

export function generationView(
  generation: ProposalGenerationFacts,
  format: MarketFormat,
): GenerationView {
  const whole = (kwh: number): BlockFigure => ({
    value: kwh,
    text: format.number(kwh, { maximumFractionDigits: 0 }),
  });
  return {
    annual: whole(generation.yearlyKwh),
    monthly: generation.monthlyKwh.map(whole),
    peak: generation.yearlyKwh > 0 ? bestMonth(generation.monthlyKwh) : -1,
    average: whole(generation.yearlyKwh / MONTHS_PER_YEAR),
  };
}

export interface SavingsView {
  readonly tier: ProvenanceTier;
  readonly monthly: BlockFigure;
  /** Absent where the lead's bill is not known: no bar is drawn for a bill nobody gave. */
  readonly bills: { readonly today: BlockFigure; readonly withSolar: BlockFigure } | null;
  /** The saving to date at the end of each year, and the net cost it crosses — one unit, for the curve. */
  readonly cumulative: readonly number[];
  readonly netCost: BlockFigure & { readonly amount: number };
  /** `null` where nothing is saved or the horizon ends first. */
  readonly payback: BlockFigure | null;
  readonly lifetime: BlockFigure;
  readonly yearly: BlockFigure;
  readonly horizonYears: number;
}

export function savingsView(
  savings: ProposalSavings,
  money: Pick<ProposalMoney, 'netCost' | 'figures'>,
  monthlyBill: MinorUnits | null,
  format: MarketFormat,
): SavingsView {
  const lifetime = figureOf(savings.figures.lifetime, format);
  const { paybackYears, billWithSolar } = savings;
  return {
    tier: savings.figures.monthly.tier,
    monthly: figureOf(savings.figures.monthly, format),
    bills:
      monthlyBill === null || billWithSolar === null
        ? null
        : {
            today: { value: monthlyBill, text: format.amountPlain(monthlyBill, [billWithSolar]) },
            withSolar: {
              value: billWithSolar,
              text: format.amountPlain(billWithSolar, [monthlyBill]),
            },
          },
    cumulative: savings.cumulative,
    netCost: { ...figureOf(money.figures.netCost, format), amount: money.netCost },
    payback:
      paybackYears === null
        ? null
        : { value: paybackYears, text: format.number(paybackYears, { maximumFractionDigits: 1 }) },
    /* The horizon's whole saving reads compact, as the market compacts money (`F3-24`). */
    lifetime: { value: lifetime.value, text: format.compactMoney(lifetime.value) },
    yearly: figureOf(savings.figures.yearly, format),
    horizonYears: savings.cumulative.length,
  };
}

export interface EmiView {
  readonly monthly: BlockFigure;
  readonly monthlyTier: ProvenanceTier;
  readonly months: number;
  readonly monthlySaving: BlockFigure | null;
  readonly savingTier: ProvenanceTier | null;
}

export function emiView(
  emi: ProposalEmi,
  savings: Pick<ProposalSavings, 'figures'> | null,
  format: MarketFormat,
): EmiView {
  return {
    monthly: figureOf(emi.figure, format),
    monthlyTier: emi.figure.tier,
    months: emi.months,
    monthlySaving: savings === null ? null : figureOf(savings.figures.monthly, format),
    savingTier: savings === null ? null : savings.figures.monthly.tier,
  };
}

export interface SplitPartView {
  // biome-ignore lint/plugin/copy-prop-type: a tranche's name, as the company typed it
  readonly label: string;
  readonly percent: number;
  readonly due: TranslatedText;
  /** Absent while the shares do not add up: no amount is stated for a broken plan. */
  readonly amount: string | null;
}

export interface SplitView {
  readonly parts: readonly SplitPartView[];
  /** What the shares add up to, in percent, and whether that is the whole (`allocationVerdict`). */
  readonly allocatedPercent: number;
  readonly state: 'under' | 'met' | 'over';
  /** How far off the whole, as a person reads it — `12`. */
  readonly offText: string;
}

export function splitView(
  tranches: readonly TrancheLine[],
  amounts: readonly SchedulePart[] | null,
  words: Pick<ProposalSplitWords, 'due'>,
  format: MarketFormat,
): SplitView {
  const verdict = allocationVerdict(tranches.map((tranche) => tranche.share));
  /* One column, one form: a part with paise makes every part print them. */
  const column = (amounts ?? []).map((part) => part.amount);
  return {
    parts: tranches.map((tranche, index) => {
      const amount = amounts?.[index]?.amount;
      return {
        label: tranche.label,
        percent: shareOfBasisPoints(tranche.share),
        due: words.due(tranche.dueOnStage),
        amount: amount === undefined ? null : format.amountPlain(amount, column),
      };
    }),
    allocatedPercent: shareOfBasisPoints(verdict.allocated),
    state: verdict.state,
    offText: shareTextOf(Math.abs(verdict.remainder)),
  };
}
