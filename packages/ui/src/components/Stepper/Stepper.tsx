import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { resolveSteps, stepLabel } from './resolve-steps';
import type { StepperProps } from './Stepper.types';
import { StepperIndicator } from './StepperIndicator';
import { StepperNumbered } from './StepperNumbered';
import { StepperRow } from './StepperRow';

interface WebStepperProps extends StepperProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Wizard progress and step navigation. Four states per step; navigation always visible, and free
 * in any order unless the flow opts into `reachability="entered"`.
 */
export function Stepper({
  steps = [],
  current = 0,
  variant = 'progress',
  density = 'expressive',
  label,
  onStepClick,
  onOpenStepList,
  reachability = 'free',
  className,
  style,
}: WebStepperProps) {
  const total = steps.length;
  const index = Math.max(0, Math.min(total - 1, current));
  const percent = total > 1 ? ((index + 1) / total) * 100 : 100;
  const at = steps[index];
  const stepName = at === undefined ? '' : stepLabel(at);

  if (variant === 'rail') {
    const resolved = resolveSteps(steps, current, reachability);
    return (
      <nav className={className} aria-label={label ?? 'Steps'} style={style}>
        {label !== undefined ? <p className="hg-stepper-rail-heading">{label}</p> : null}
        <ol className="hg-stepper-list">
          {resolved.map((step, position) => (
            <StepperRow
              key={step.label}
              connector
              current={index}
              index={position}
              onStepClick={onStepClick}
              step={step}
              total={total}
            />
          ))}
        </ol>
      </nav>
    );
  }

  if (variant === 'indicator') {
    return (
      <StepperIndicator
        className={className}
        index={index}
        onOpenStepList={onOpenStepList}
        onStepClick={onStepClick}
        resolved={resolveSteps(steps, current, reachability)}
        style={style}
      />
    );
  }

  if (variant === 'progress') {
    return (
      <div className={className} style={style}>
        <div className="hg-stepper-head">
          <span className="hg-stepper-overline">
            {label === undefined ? '' : `${label} · `}Step {index + 1} of {total}
          </span>
          <span className="hg-stepper-step-name">{stepName}</span>
        </div>
        <div
          className="hg-stepper-track"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={label ?? 'Progress'}
        >
          <div className="hg-stepper-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a dot strip is a group of marks, not a form control group — a <fieldset> here would announce a form.
      <div
        className={classNames('hg-stepper-dots', className)}
        role="group"
        aria-label={label ?? 'Progress'}
        style={style}
      >
        {steps.map((step, position) => (
          <span
            key={stepLabel(step)}
            className="hg-stepper-dot"
            aria-current={position === index ? 'step' : undefined}
            data-current={position === index}
            data-filled={position <= index}
            title={stepLabel(step)}
          />
        ))}
        <span className="hg-stepper-dots-name">{stepName}</span>
      </div>
    );
  }

  return (
    <StepperNumbered
      className={className}
      density={density}
      index={index}
      label={label}
      onStepClick={onStepClick}
      resolved={resolveSteps(steps, current, reachability)}
      style={style}
    />
  );
}
