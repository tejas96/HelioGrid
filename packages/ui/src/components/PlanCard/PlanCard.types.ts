import type { TranslatedText } from '@heliogrid/contracts';

/**
 * The plan card's body (`SCR-M12-01` and `SCR-M12-03`, the redesign's shared object): the price
 * as the headline figure in mono with tabular figures and its period beside it (`F7-09`), an
 * optional line under it, then the limits that differ most as ONE flowing line. The holder draws
 * the name — a card's heading on the pricing page, an option's title on the plans screen — and
 * every figure arrives formatted: nothing here computes or invents a price.
 */

/**
 * The cycle's price, or Enterprise's anchor `From … a month`. The words around the figure sit
 * before or after it as the reader's language orders them (`From ₹24,999`, `₹24,999 से`).
 */
export interface PlanCardFigure {
  readonly lead: string | null;
  readonly figure: string;
  readonly trail: string | null;
  readonly period: TranslatedText;
}

/** One lead row — `Limits — 500 kW · 300 proposals a month`; each value is its own run. */
export interface PlanCardLine {
  readonly key: string;
  readonly label: TranslatedText;
  readonly values: readonly string[];
}

/**
 * Where the body stands, which sets its rhythm: `card` — the plans screen's option card, the figure
 * then its limits at `sp-3` (`SCR-M12-03`); `head` — the pricing page's card head under the name,
 * the figure and its line at `sp-2`, the card's rows below it at the card's own gap (`SCR-M12-01`).
 */
export type PlanCardForm = 'card' | 'head';

export interface PlanCardProps {
  readonly form: PlanCardForm;
  /** The plan's name, the lines' group name for a screen reader (`BM-11`: the same in every language). */
  readonly name: TranslatedText;
  /** The headline; `null` for a plan this market has no price for, when `gap` names it. */
  readonly figure: PlanCardFigure | null;
  /** `No price in your market` (`SCR-M12-03` decision 15): the slot keeps its card. */
  readonly gap: TranslatedText | null;
  /** A line under the figure — the pricing page's positioning. */
  readonly note: TranslatedText | null;
  readonly lines: readonly PlanCardLine[];
}
