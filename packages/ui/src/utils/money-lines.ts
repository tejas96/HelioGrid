import type { ReactNode } from 'react';

/**
 * The money arithmetic, in one place, because two components state the same total.
 *
 * M06-35 (P0) / SCR-M06-05: "cost + battery − incentive − discount = payable, RECOMPUTING ON EVERY
 * CHANGE" — an ITEMISED EQUATION, not a single stat. SCR-M06-17 names the members. SCR-M06-14:
 * "BOM total ↔ proposal price — reconciles under the locked invariants… A DISAGREEMENT IS A DEFECT,
 * NOT A DISPLAY DIFFERENCE."
 *
 * `MoneySummary` (the equation) and `DataTable`'s totalRow (the one line forty BOM lines add up to)
 * both run through this file, so the block and the table can never disagree about a payable, a
 * floor at zero or a failed reconciliation.
 *
 * ZERO NEVER RENDERS NEGATIVE, and the excess is NAMED rather than swallowed. A discount that
 * exceeds the cost is a real input, so the payable floors at zero AND `unapplied` carries what did
 * not fit. Clamping silently would print a payable the arithmetic does not support; printing
 * −₹12,400 would print a refund the tenant never agreed.
 */

export interface MoneyLine {
  key?: string;
  label: string;
  /**
   * A **magnitude** — `kind` carries the sign. `null` means *not resolved yet*, which renders as
   * those words in the amount's own footprint and suppresses the payable; it is never counted as
   * zero.
   */
  amount: number | null;
  /** `add` (default) — cost, battery, tax. `deduct` — incentive, subsidy, discount. */
  kind?: 'add' | 'deduct';
  /** A second line under the label — "PM Surya Ghar, credited by the National Portal". */
  note?: ReactNode;
  strong?: boolean;
}

export interface MoneyReconcileSpec {
  /** What the other figure is — "Bill of materials". */
  label: string;
  amount: number;
  /** The line key it must equal. Defaults to the first `add` line. */
  against?: string;
  /** Currency units. Default 0.5 — half a rupee. */
  tolerance?: number;
}

export interface MoneyReconciliation {
  label: string;
  amount: number;
  againstLabel: string;
  target: number;
  delta: number;
  agrees: boolean;
}

export interface ResolvedMoney {
  lines: MoneyLine[];
  gross: number;
  deductions: number;
  /** The part of the deductions the gross could absorb. */
  applied: number;
  /** What did not fit. Named on screen, never dropped, never a negative payable. */
  unapplied: number;
  payable: number;
  overDeducted: boolean;
  unresolved: string[];
  reconciliation: MoneyReconciliation | null;
  /** No unresolved line and no failed reconciliation — may this document state a price? */
  payableStandsUp: boolean;
}

/** What `resolveMoneySummary` and `MoneySummary.stands` both take. */
export interface MoneySummarySpec {
  lines?: MoneyLine[];
  reconcile?: MoneyReconcileSpec;
}

/** A line after normalisation: the sign has moved into `kind`, the amount is a magnitude. */
interface ResolvedMoneyLine extends MoneyLine {
  kind: 'add' | 'deduct';
  amount: number | null;
}

const r2 = (n: number): number => Math.round((Number(n) || 0) * 100) / 100;

/** Normalises a line: `amount` is a magnitude and `kind` carries the sign. */
function normalise(l: MoneyLine): ResolvedMoneyLine {
  const raw = Number(l.amount);
  const amount = Number.isFinite(raw) ? Math.abs(raw) : null;
  let kind: 'add' | 'deduct' = l.kind || 'add';
  if (Number.isFinite(raw) && raw < 0 && kind === 'add') kind = 'deduct';
  return { ...l, kind, amount };
}

/**
 * The equation, resolved. Returns every line with its sign, the two subtotals, the payable floored
 * at zero, and the part of a deduction that did not fit.
 */
export function resolveMoneySummary({
  lines = [],
  reconcile,
}: MoneySummarySpec = {}): ResolvedMoney {
  const rows = lines.filter(Boolean).map(normalise);
  /* NO FIGURE WITHOUT A RESOLVED VALUE — UsageMeter's rule, and the same reason: a line whose
     amount has not resolved is reported as unresolved rather than counted as zero. */
  const unresolved = rows.filter((l) => l.amount === null).map((l) => l.key || l.label);
  const sum = (kind: 'add' | 'deduct'): number =>
    r2(
      rows
        .filter(
          (l): l is ResolvedMoneyLine & { amount: number } => l.kind === kind && l.amount !== null,
        )
        .reduce((a, b) => a + b.amount, 0),
    );
  const gross = sum('add');
  const deductions = sum('deduct');
  const applied = r2(Math.min(deductions, gross));
  const unapplied = r2(deductions - applied);
  const payable = r2(gross - applied);

  let reconciliation: MoneyReconciliation | null = null;
  if (reconcile && reconcile.amount !== null && reconcile.amount !== undefined) {
    const firstAdd = rows.find((l) => l.kind === 'add');
    const againstKey = reconcile.against || (firstAdd ? firstAdd.key : undefined);
    const against = rows.find((l) => l.key === againstKey);
    const target = against && against.amount !== null ? against.amount : gross;
    const { delta, agrees } = reconcileAmounts(reconcile.amount, target, reconcile.tolerance);
    reconciliation = {
      label: reconcile.label || 'Bill of materials',
      amount: r2(reconcile.amount),
      againstLabel: against?.label || 'the quoted price',
      target,
      delta,
      agrees,
    };
  }

  return {
    lines: rows,
    gross,
    deductions,
    applied,
    unapplied,
    payable,
    overDeducted: unapplied > 0,
    unresolved,
    reconciliation,
    /* One boolean a send path can read: is this document allowed to state a price? */
    payableStandsUp: unresolved.length === 0 && (!reconciliation || reconciliation.agrees),
  };
}

/** Two figures that must be equal. `tolerance` is in currency units and defaults to half a rupee. */
export function reconcileAmounts(
  a: number,
  b: number,
  tolerance = 0.5,
): { delta: number; agrees: boolean } {
  const delta = r2(Number(a) - Number(b));
  return { delta, agrees: Math.abs(delta) <= tolerance };
}
