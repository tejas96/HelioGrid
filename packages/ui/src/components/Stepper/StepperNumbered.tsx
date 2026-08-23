import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ResolvedStep } from './resolve-steps';
import { stateWord } from './resolve-steps';
import type { StepperDensity } from './Stepper.types';
import { StepperMarker } from './StepperMarker';

interface StepperNumberedProps {
  className?: string;
  density: StepperDensity;
  index: number;
  label?: string;
  onStepClick?: (index: number) => void;
  resolved: readonly ResolvedStep[];
  style?: CSSProperties;
}

/** The horizontal arrangement: a marker per step with a connector line between them. */
export function StepperNumbered({
  className,
  density,
  index,
  label,
  onStepClick,
  resolved,
  style,
}: StepperNumberedProps) {
  const total = resolved.length;
  const size = density === 'functional' ? 24 : 28;
  return (
    <ol
      className={classNames('hg-stepper-numbered', className)}
      aria-label={label ?? 'Progress'}
      style={style}
    >
      {resolved.map((step, position) => {
        const clickable = onStepClick !== undefined && step.reachable;
        const active = position === index;
        const word = stateWord(step);
        return (
          <li
            key={step.label}
            className="hg-stepper-numbered-item"
            data-last={position === total - 1}
          >
            <button
              className="hg-stepper-node"
              type="button"
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
              aria-label={`Step ${position + 1} of ${total}, ${step.label}, ${word.toLowerCase()}`}
              data-clickable={clickable}
              onClick={clickable ? () => onStepClick(position) : undefined}
            >
              <StepperMarker index={position} size={size} step={step} />
            </button>
            <div className="hg-stepper-numbered-body" data-density={density}>
              <span className="hg-stepper-numbered-name">
                <span className="hg-stepper-name" data-active={active} data-state={step.state}>
                  {step.label}
                </span>
                {step.state === 'errors' ? (
                  <span className="hg-stepper-word" data-state="errors">
                    {word}
                  </span>
                ) : null}
                {step.optional === true && step.state !== 'errors' ? (
                  <span className="hg-stepper-word">Optional</span>
                ) : null}
              </span>
              {position !== total - 1 ? (
                <span
                  className="hg-stepper-line"
                  aria-hidden="true"
                  data-done={step.state === 'done'}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
