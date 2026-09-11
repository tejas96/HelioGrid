import { type MinorUnits, minorUnits, sumMinorUnits } from './minor-units';

/**
 * The client-payable equation — `cost + battery − incentive − discount = payable` (`M06-35`) —
 * every amount a whole number of the currency's minor unit, so the block, the table and the
 * document that all state a total can only agree (`M11-08`).
 *
 * The row fixes three things a display might be tempted to soften. A payable driven to zero or
 * below is REPORTED — the card warns with the negative figure, and the block belongs to Generate
 * (`M06-36`). A line whose amount has not resolved is `unresolved`, never counted as zero: no
 * figure without a resolved value. And two figures that must agree, agree only when they are
 * EQUAL — whole minor units leave no rounding to allow for, so one paisa apart is the defect
 * `SCR-M06-14` names, not a display difference.
 */

export type EquationSign = 'add' | 'deduct';

/** One member of the equation, as the caller states it. */
export interface PayableLine {
  key?: string;
  /** The caller's words for the line. */
  label: string;
  /**
   * A magnitude; `kind` carries the sign. `null` means *not resolved yet* and is never counted as
   * zero. A negative amount under `add` reads as a deduction of that size.
   */
  amount: MinorUnits | null;
  /** `add` (default) — cost, battery, tax. `deduct` — incentive, subsidy, discount. */
  kind?: EquationSign;
}

/** A line after resolution: the sign has moved into `kind` and the amount is a magnitude. */
export type ResolvedPayableLine<L extends PayableLine> = L & {
  kind: EquationSign;
  amount: MinorUnits | null;
};

/** The other figure the equation must agree with — the bill of materials against the price. */
export interface PayableReconcileSpec {
  /** What the other figure is called — the caller's words, never this package's. */
  label: string;
  amount: MinorUnits;
  /** The line key it must equal. Defaults to the first `add` line; with none, the gross. */
  against?: string;
  /** What the compared figure is called when no line carries a label for it — the caller's words. */
  againstLabel: string;
}

export interface PayableReconciliation {
  label: string;
  amount: MinorUnits;
  againstLabel: string;
  target: MinorUnits;
  /** `amount − target`, signed. */
  delta: MinorUnits;
  agrees: boolean;
}

export interface PayableSpec<L extends PayableLine = PayableLine> {
  lines?: readonly L[];
  reconcile?: PayableReconcileSpec;
}

export interface ResolvedPayable<L extends PayableLine = PayableLine> {
  lines: ResolvedPayableLine<L>[];
  gross: MinorUnits;
  deductions: MinorUnits;
  /** `gross − deductions` — negative when the deductions exceed the gross; reported, never floored. */
  payable: MinorUnits;
  /** A deduction drove the payable to zero or below, so the card warns (`M06-35`). No deduction, no warning. */
  zeroOrBelow: boolean;
  /** The keys — or, without one, the labels — of the lines with no resolved amount. */
  unresolved: string[];
  reconciliation: PayableReconciliation | null;
  /** No unresolved line and no failed reconciliation: may this document state a price? */
  payableStandsUp: boolean;
}

function resolveLine<L extends PayableLine>(line: L): ResolvedPayableLine<L> {
  const stated: EquationSign = line.kind ?? 'add';
  if (line.amount === null) return { ...line, kind: stated, amount: null };
  const kind: EquationSign = line.amount < 0 && stated === 'add' ? 'deduct' : stated;
  return { ...line, kind, amount: minorUnits(Math.abs(line.amount)) };
}

/** Two figures that must be equal. Whole minor units agree only when they are — there is no tolerance. */
export function reconcileMinorUnits(
  amount: MinorUnits,
  target: MinorUnits,
): { delta: MinorUnits; agrees: boolean } {
  const delta = minorUnits(amount - target);
  return { delta, agrees: delta === 0 };
}

function reconcileAgainst<L extends PayableLine>(
  rows: readonly ResolvedPayableLine<L>[],
  gross: MinorUnits,
  spec: PayableReconcileSpec,
): PayableReconciliation {
  const key = spec.against ?? rows.find((line) => line.kind === 'add')?.key;
  const against = key === undefined ? undefined : rows.find((line) => line.key === key);
  const target = against?.amount ?? gross;
  return {
    label: spec.label,
    amount: spec.amount,
    againstLabel: against?.label ?? spec.againstLabel,
    target,
    ...reconcileMinorUnits(spec.amount, target),
  };
}

/**
 * The equation, resolved: every line with its sign, the two subtotals, the payable, and whatever
 * stops this document from stating a price.
 */
export function resolvePayable<L extends PayableLine>({
  lines = [],
  reconcile,
}: PayableSpec<L> = {}): ResolvedPayable<L> {
  const rows = lines.map(resolveLine);
  const unresolved = rows
    .filter((line) => line.amount === null)
    .map((line) => line.key ?? line.label);
  const subtotal = (kind: EquationSign): MinorUnits =>
    sumMinorUnits(
      rows.flatMap((line) => (line.kind === kind && line.amount !== null ? [line.amount] : [])),
    );
  const gross = subtotal('add');
  const deductions = subtotal('deduct');
  const payable = minorUnits(gross - deductions);
  const reconciliation = reconcile === undefined ? null : reconcileAgainst(rows, gross, reconcile);
  return {
    lines: rows,
    gross,
    deductions,
    payable,
    zeroOrBelow: deductions > 0 && payable <= 0,
    unresolved,
    reconciliation,
    payableStandsUp: unresolved.length === 0 && (reconciliation === null || reconciliation.agrees),
  };
}
