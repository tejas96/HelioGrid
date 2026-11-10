import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { stageStepsOf } from './StageTrack.logic';
import type { StageTrackProps } from './StageTrack.types';

interface WebStageTrackProps extends StageTrackProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The eight-step funnel as segments (`M02-41`). One image to a screen reader, named by its step —
 * "Step 3 of 8: Qualified" — so eight bare segments are never read one by one.
 */
export function StageTrack({ stage, size = 'sm', words, className, style }: WebStageTrackProps) {
  return (
    <span
      className={classNames('hg-stage-track', className)}
      data-size={size}
      role="img"
      aria-label={words.stepOf(stage)}
      style={style}
    >
      {stageStepsOf(stage).map((step) => (
        <span key={step.stage} className="hg-stage-track-step" data-standing={step.standing} />
      ))}
    </span>
  );
}
