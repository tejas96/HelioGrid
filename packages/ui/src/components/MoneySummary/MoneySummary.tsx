import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { resolveMoneySummary } from '../../utils/money-lines';
import type { MoneySummaryProps } from './MoneySummary.types';
import { MoneySummaryRow } from './MoneySummaryRow';
import { MoneySummaryTotal } from './MoneySummaryTotal';

interface WebMoneySummaryProps extends MoneySummaryProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * **What the forty lines add up to.** `M06-35` (P0) / `SCR-M06-05`: cost + battery − incentive −
 * discount = payable, RECOMPUTING ON EVERY CHANGE — an ITEMISED EQUATION, not a single stat.
 *
 * **Zero never renders negative, and the excess is named.** **A failed reconciliation prints no
 * price** (`SCR-M06-14`: a disagreement is a defect, not a display difference), and neither does
 * an unresolved line — no figure without a resolved value.
 *
 * It survives a page break: `data-keep-together` pairs with `tokens/print.css`.
 *
 * This file composes: one member of the equation is `MoneySummaryRow`, and what they add up to —
 * or the reason they do not add up to a price — is `MoneySummaryTotal`.
 */
export function MoneySummary({
  lines = [],
  reconcile,
  payableLabel = 'Payable',
  overline = 'Money summary',
  surface = 'screen',
  provenance,
  note,
  density = 'expressive',
  className,
  style,
}: WebMoneySummaryProps) {
  const m = resolveMoneySummary({ lines, reconcile });

  return (
    <section
      data-keep-together=""
      aria-label={overline || payableLabel}
      className={classNames('hg-money-summary', className)}
      data-surface={surface}
      data-density={density}
      style={style}
    >
      {overline ? <p className="hg-money-summary-overline">{overline}</p> : null}
      <div>
        {m.lines.map((l) => (
          <MoneySummaryRow key={l.key || l.label} line={l} />
        ))}
      </div>

      <MoneySummaryTotal
        money={m}
        payableLabel={payableLabel}
        provenance={provenance}
        note={note}
      />
    </section>
  );
}

/** The same test as a boolean, for a send path: may this document state a price? */
MoneySummary.stands = (spec: Parameters<typeof resolveMoneySummary>[0] = {}) =>
  resolveMoneySummary(spec).payableStandsUp;
/** The resolved arithmetic, for a caller that needs the numbers as well as the rendering. */
MoneySummary.resolve = resolveMoneySummary;
