import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { resolveSteps } from './resolve-steps';
import type { StepListProps } from './Stepper.types';
import { StepperRow } from './StepperRow';

interface WebStepListProps extends StepListProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The step list itself — put it in a `Sheet` opened by `variant="indicator"`, which is the mobile
 * half of M05-03. Same reachability rule as `Stepper`; rows are 52px.
 */
export function StepList({
  steps = [],
  current = 0,
  onStepClick,
  label,
  reachability = 'free',
  className,
  style,
}: WebStepListProps) {
  const resolved = resolveSteps(steps, current, reachability);
  return (
    <ol
      className={classNames('hg-stepper-list', className)}
      aria-label={label ?? 'Steps'}
      style={style}
    >
      {resolved.map((step, index) => (
        <StepperRow
          key={step.label}
          current={current}
          index={index}
          onStepClick={onStepClick}
          step={step}
          total={resolved.length}
        />
      ))}
    </ol>
  );
}
