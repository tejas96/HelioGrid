import { resolvePayable } from '@heliogrid/domain';
import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { MoneySummaryProps, MoneySummarySpec } from './MoneySummary.types';
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
 * **A payable at or below zero is shown, with a warning** (`M06-35`: the negative figure, never
 * hidden; the block is Generate's). **A failed reconciliation prints no price** (`SCR-M06-14`: a
 * disagreement is a defect, not a display difference), and neither does an unresolved line — no
 * figure without a resolved value. The arithmetic is `@heliogrid/domain`'s, in whole minor units.
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
  const m = resolvePayable({ lines, reconcile });

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
MoneySummary.stands = (spec: MoneySummarySpec = {}) => resolvePayable(spec).payableStandsUp;
/** The resolved arithmetic, for a caller that needs the numbers as well as the rendering. */
MoneySummary.resolve = (spec: MoneySummarySpec = {}) => resolvePayable(spec);
