import type { TranslatedText } from '@heliogrid/contracts';
import { type CSSProperties, type ReactNode, useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider';
import type { OperationCount } from './OperationProgress.types';
import { ringSpokenName } from './operation-progress-model';
import { ProgressRing } from './ProgressRing';
import { countShare, RUN_RING } from './progress-ring';

interface OperationRingProps {
  label: ReactNode;
  count: OperationCount | null;
  countCaption?: TranslatedText;
  className?: string;
  style?: CSSProperties;
}

/**
 * `size="ring"`: the run's ring, the done figure inside and the caller's caption under it. The
 * `progressbar` carries the count; without one it is indeterminate and states no position. A
 * label that is not a string is named through a spoken-only copy, since `aria-label` takes words.
 */
export function OperationRing({
  label,
  count,
  countCaption,
  className,
  style,
}: OperationRingProps) {
  const { number } = useFormat();
  const labelId = useId();
  const spoken = ringSpokenName(label);
  return (
    <div
      className={classNames('hg-operation-ring', className)}
      style={style}
      role="progressbar"
      aria-label={spoken}
      aria-labelledby={spoken === undefined ? labelId : undefined}
      aria-valuemin={count === null ? undefined : 0}
      aria-valuemax={count?.total}
      aria-valuenow={count?.done}
    >
      {spoken === undefined ? (
        <span id={labelId} className="hg-spoken-only">
          {label}
        </span>
      ) : null}
      <ProgressRing geometry={RUN_RING} share={countShare(count)} />
      <span className="hg-operation-ring-centre">
        {count === null ? null : (
          <span className="hg-operation-ring-figure">{number(count.done)}</span>
        )}
        {countCaption === undefined ? null : (
          <span className="hg-operation-ring-caption">{countCaption}</span>
        )}
      </span>
    </div>
  );
}
