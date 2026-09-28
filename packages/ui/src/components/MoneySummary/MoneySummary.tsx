import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { MoneySummaryProps } from './MoneySummary.types';
import { MoneySummaryRow } from './MoneySummaryRow';
import { MoneySummaryTotal } from './MoneySummaryTotal';

interface WebMoneySummaryProps extends MoneySummaryProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * **What the forty lines add up to.** `M06-35` (P0) / `SCR-M06-05`: cost + battery − incentive −
 * discount = payable, recomputed BY THE SERVER on every change — an ITEMISED EQUATION, not a single stat.
 *
 * **A payable at or below zero is shown, with a warning** (`M06-35`: the negative figure, never
 * hidden; the block is Generate's). **A failed reconciliation prints no price** (`SCR-M06-14`: a
 * disagreement is a defect, not a display difference), and neither does an unresolved line — no
 * figure without a resolved value. The arithmetic is the server's (`F4-04`); this block prints it.
 *
 * It survives a page break: `data-keep-together` pairs with `tokens/print.css`.
 *
 * This file composes: one member of the equation is `MoneySummaryRow`, and what they add up to —
 * or the reason they do not add up to a price — is `MoneySummaryTotal`.
 */
export function MoneySummary({
  equation,
  payableLabel = 'Payable',
  overline = 'Money summary',
  surface = 'screen',
  provenance,
  note,
  density = 'expressive',
  className,
  style,
}: WebMoneySummaryProps) {
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
        {equation.lines.map((l) => (
          <MoneySummaryRow key={l.key || l.label} line={l} />
        ))}
      </div>

      <MoneySummaryTotal
        money={equation}
        payableLabel={payableLabel}
        provenance={provenance}
        note={note}
      />
    </section>
  );
}
