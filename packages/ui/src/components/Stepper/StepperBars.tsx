import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { stepLabel } from './resolve-steps';
import type { StepperStep } from './Stepper.types';
import type { BarsVariant } from './stepper-bars';
import './StepperBars.css';

interface BarsProps {
  steps: (StepperStep | string)[];
  index: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * `variant="bars"`: one thin bar per step, those done and the current one filled. The location
 * only — hidden from a screen reader, because the head above it names the step.
 */
function PlainBars({ steps, index, className, style }: BarsProps) {
  return (
    <div className={classNames('hg-stepper-bars', className)} style={style} aria-hidden="true">
      {steps.map((step, position) => (
        <span key={stepLabel(step)} className="hg-stepper-bar" data-filled={position <= index} />
      ))}
    </div>
  );
}

interface NumberedBarsProps extends BarsProps {
  label?: string;
}

/**
 * `variant="numbered-bars"`: the same bars with each step's number and name under its bar — a
 * panel's step location. The current step is `aria-current="step"`, bold and primary.
 */
function NumberedBars({ steps, index, label, className, style }: NumberedBarsProps) {
  return (
    <nav
      className={classNames('hg-stepper-numbered-bars', className)}
      style={style}
      aria-label={label}
    >
      {steps.map((step, position) => (
        <div
          key={stepLabel(step)}
          className="hg-stepper-bar-step"
          aria-current={position === index ? 'step' : undefined}
        >
          <span className="hg-stepper-bar" data-filled={position <= index} />
          <span className="hg-stepper-bar-caption" data-current={position === index}>
            <span className="hg-stepper-bar-number">{position + 1}</span>
            <span>{stepLabel(step)}</span>
          </span>
        </div>
      ))}
    </nav>
  );
}

interface StepperBarsProps extends NumberedBarsProps {
  variant: BarsVariant;
}

/** `bars` or `numbered-bars` — `Stepper` hands both here. */
export function StepperBars({ variant, label, ...bars }: StepperBarsProps) {
  return variant === 'bars' ? <PlainBars {...bars} /> : <NumberedBars label={label} {...bars} />;
}
