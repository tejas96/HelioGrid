import type { ReactNode } from 'react';
import { narrationShape } from './operation-progress-model';

interface OperationNarrationProps {
  /** "Step 2 of 3", when the caller has both halves. */
  step: string | null;
  stage: ReactNode;
  /** "142 of 400 rows", printed in mono. */
  counted: string | null;
}

/**
 * STAGE NARRATION IS NOT DECORATION. A percentage says how far; only words say what is happening,
 * and on a 40-second solar-access run the words are the whole reason the wait is tolerable.
 */
export function OperationNarration({ step, stage, counted }: OperationNarrationProps) {
  const shape = narrationShape(step, stage, counted);
  if (shape === null) {
    return null;
  }
  return (
    <div role="status" aria-live="polite" className="hg-operation-progress-narration">
      {shape.narrates ? (
        <span className="hg-operation-progress-narration-words">
          {step}
          {shape.joins ? ' · ' : ''}
          {stage}
        </span>
      ) : null}
      {counted !== null ? <span className="hg-operation-progress-count">{counted}</span> : null}
    </div>
  );
}
