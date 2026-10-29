import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ResolvedStep } from './resolve-steps';
import { spokenStep, stateWord } from './resolve-steps';
import { isLastStep, isStepClickable, markerSizeFor, numberedNote } from './Stepper.logic';
import type { StepperDensity, StepperWords } from './Stepper.types';
import { StepperMarker } from './StepperMarker';

interface StepperNumberedProps {
  className?: string;
  density: StepperDensity;
  index: number;
  label?: TranslatedText;
  onStepClick?: (index: number) => void;
  resolved: readonly ResolvedStep[];
  style?: CSSProperties;
  words: StepperWords;
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
  words,
}: StepperNumberedProps) {
  const total = resolved.length;
  const size = markerSizeFor(density);
  return (
    <ol
      className={classNames('hg-stepper-numbered', className)}
      aria-label={label ?? words.progress}
      style={style}
    >
      {resolved.map((step, position) => {
        const clickable = isStepClickable(step, onStepClick !== undefined);
        const active = position === index;
        const last = isLastStep(position, total);
        const note = numberedNote(step);
        const word = stateWord(step, words);
        return (
          <li key={step.label} className="hg-stepper-numbered-item" data-last={last}>
            <button
              className="hg-stepper-node"
              type="button"
              disabled={!clickable}
              aria-current={active ? 'step' : undefined}
              aria-label={spokenStep(step, position, total, words)}
              data-clickable={clickable}
              onClick={clickable ? () => onStepClick?.(position) : undefined}
            >
              <StepperMarker index={position} size={size} step={step} />
            </button>
            <div className="hg-stepper-numbered-body" data-density={density}>
              <span className="hg-stepper-numbered-name">
                <span className="hg-stepper-name" data-active={active} data-state={step.state}>
                  {step.label}
                </span>
                {note === 'errors' ? (
                  <span className="hg-stepper-word" data-state="errors">
                    {word}
                  </span>
                ) : null}
                {note === 'optional' ? (
                  <span className="hg-stepper-word">{words.optional}</span>
                ) : null}
              </span>
              {last ? null : (
                <span
                  className="hg-stepper-line"
                  aria-hidden="true"
                  data-done={step.state === 'done'}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
