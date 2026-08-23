import type { ReactNode } from 'react';
import { IndeterminateRail } from '../PendingAction/IndeterminateRail';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { OperationNarration } from './OperationNarration';

interface OperationHeadProps {
  label: ReactNode;
  /** The clamped percentage, or null when the operation is indeterminate or finished. */
  pct: number | null;
  running: boolean;
  gradient: boolean;
  step: string | null;
  stage: ReactNode;
  counted: string | null;
}

/**
 * The work's name, its figure, its rail and its narration.
 *
 * INDETERMINATE IS A REAL STATE: no percentage is printed, and `role="progressbar"` carries no
 * `aria-valuenow` — a bar with an invented number on it is a claim. STAGE NARRATION IS NOT
 * DECORATION: a percentage says how far, only words say what.
 */
export function OperationHead({
  label,
  pct,
  running,
  gradient,
  step,
  stage,
  counted,
}: OperationHeadProps) {
  return (
    <>
      <div className="hg-operation-progress-head">
        <span className="hg-operation-progress-label">{label}</span>
        {pct !== null ? (
          <span className="hg-operation-progress-figure">{`${Math.round(pct)}%`}</span>
        ) : null}
      </div>

      {running && pct !== null ? <ProgressBar value={pct} gradient={gradient} /> : null}
      {running && pct === null ? (
        <span
          role="progressbar"
          aria-label={typeof label === 'string' ? label : 'In progress'}
          className="hg-operation-progress-indeterminate"
        >
          <IndeterminateRail
            width="100%"
            thickness={6}
            tone={gradient ? 'var(--gradient-brand)' : 'var(--accent)'}
          />
        </span>
      ) : null}

      <OperationNarration step={step} stage={stage} counted={counted} />
    </>
  );
}
