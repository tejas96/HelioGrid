import type { CSSProperties } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { type FactVars, useBoxProbe, useFits } from './FactRow';
import {
  contentSignature,
  FACT_LEAD_BELOW,
  FACT_LONG_AT,
  FACT_MEASURE,
  FactGroundProvider,
  factRowsOf,
  factWantsLead,
  groupForm,
  isUnderFloor,
  useAnswerReport,
  useFactGround,
} from './FactRow.logic';
import type { FactRowsForm, FactRowsProps } from './FactRow.types';

interface WebFactRowsProps extends FactRowsProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A group of fact rows — **one form and one left edge for the whole set.** The form is resolved
 * once: the group renders as a pair, every value is measured against one line box, and the first
 * value that would wrap takes the whole group to `lead`, because a set with two arrangements in it
 * reads as two sets. The left edge is shared by construction: the group owns the columns and every
 * row lands on them (`subgrid`); where any row has a mark, every row reserves its column.
 */
export function FactRows({
  children,
  label,
  density = 'expressive',
  measure = FACT_MEASURE,
  leadBelow = FACT_LEAD_BELOW,
  longAt = FACT_LONG_AT,
  form: forced = 'auto',
  onFormChange,
  className,
  style,
}: WebFactRowsProps) {
  const ref = useRef<HTMLDListElement>(null);
  const { width, gen } = useBoxProbe(ref);
  const rows = factRowsOf(children).map((row) => row.props);
  const declared = rows.some((row) => factWantsLead(row, longAt));
  const hasMark = rows.some((row) => Boolean(row.mark));
  const floor = isUnderFloor(width, leadBelow);
  /* Measured only while the group draws as a pair: in `lead` no value has a column to overflow. */
  const { fits, answered } = useFits(
    ref,
    forced === 'auto' && !declared && !floor,
    `${gen}|${contentSignature(rows)}`,
  );
  const { form, reason } = groupForm({ forced, declared, floor, fits });
  const settled = forced !== 'auto' || declared || floor || answered;
  const answer: FactRowsForm | null =
    settled && width !== null ? { form, width, hasMark, reason } : null;
  useAnswerReport(answer, `${form}|${hasMark}|${reason}`, onFormChange);
  const { ink } = useFactGround();
  const vars: FactVars = { '--hg-fact-measure': String(measure) };
  return (
    <dl
      ref={ref}
      aria-label={label}
      className={classNames('hg-fact-rows', className)}
      data-fact-group-form={form}
      data-fact-reason={reason}
      data-density={density}
      data-has-mark={hasMark ? 'true' : undefined}
      style={{ ...vars, ...style }}
    >
      <FactGroundProvider value={{ ink, group: { form, hasMark, density, longAt } }}>
        {children}
      </FactGroundProvider>
    </dl>
  );
}
