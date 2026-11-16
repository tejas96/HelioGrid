import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ProgressBar } from '../ProgressBar';
import { resolveSteps, stepLabel } from './resolve-steps';
import { progressCounter, stepperPosition } from './Stepper.logic';
import type { StepperProps } from './Stepper.types';
import { StepperBars } from './StepperBars';
import { StepperIndicator } from './StepperIndicator';
import { StepperNumbered } from './StepperNumbered';
import { StepperRow } from './StepperRow';
import { isBarsVariant } from './stepper-bars';

interface WebStepperProps extends StepperProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Wizard progress and step navigation. Four states per step; navigation always visible, and free
 * in any order unless the flow opts into `reachability="entered"`.
 */
export function Stepper({
  words,
  steps = [],
  current = 0,
  variant = 'progress',
  density = 'expressive',
  label,
  onStepClick,
  onOpenStepList,
  reachability = 'free',
  fillIn = false,
  className,
  style,
}: WebStepperProps) {
  const { total, index, percent, stepName } = stepperPosition(steps, current);

  if (isBarsVariant(variant)) {
    return (
      <StepperBars
        className={className}
        fillIn={fillIn}
        index={index}
        label={label}
        steps={steps}
        style={style}
        variant={variant}
      />
    );
  }

  if (variant === 'rail') {
    const resolved = resolveSteps(steps, current, reachability);
    return (
      <nav className={className} aria-label={label ?? words.steps} style={style}>
        {label !== undefined ? (
          <p className="hg-stepper-rail-heading hg-overline">{label}</p>
        ) : null}
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
              words={words}
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
        words={words}
      />
    );
  }

  if (variant === 'progress') {
    return (
      <div className={className} style={style}>
        <div className="hg-stepper-head">
          <span className="hg-stepper-overline hg-overline">
            {progressCounter(words, index, total, label)}
          </span>
          <span className="hg-stepper-step-name">{stepName}</span>
        </div>
        <ProgressBar
          className="hg-stepper-track"
          value={percent}
          label={label ?? words.progress}
          steps={{ now: index + 1, total }}
        />
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a dot strip is a group of marks, not a form control group — a <fieldset> here would announce a form.
      <div
        className={classNames('hg-stepper-dots', className)}
        role="group"
        aria-label={label ?? words.progress}
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
      words={words}
    />
  );
}
