import type { ResolvedStep } from './resolve-steps';
import { stateWord } from './resolve-steps';
import { StepperMarker } from './StepperMarker';

interface StepperRowProps {
  connector?: boolean;
  current: number;
  index: number;
  onStepClick?: (index: number) => void;
  step: ResolvedStep;
  total: number;
}

/** One row per step — the body of the mobile step-list sheet, and the desktop rail's row. */
export function StepperRow({
  connector = false,
  current,
  index,
  onStepClick,
  step,
  total,
}: StepperRowProps) {
  const clickable = onStepClick !== undefined && step.reachable;
  const word = stateWord(step);
  const active = index === current;
  return (
    <li className="hg-stepper-item">
      {connector && index < total - 1 ? (
        <span
          className="hg-stepper-connector"
          aria-hidden="true"
          data-done={step.state === 'done'}
        />
      ) : null}
      <button
        className="hg-stepper-row"
        type="button"
        disabled={!clickable}
        aria-current={active ? 'step' : undefined}
        aria-label={`Step ${index + 1} of ${total}, ${step.label}, ${word.toLowerCase()}`}
        data-clickable={clickable}
        onClick={clickable ? () => onStepClick(index) : undefined}
      >
        <StepperMarker index={index} step={step} />
        <span className="hg-stepper-body">
          <span className="hg-stepper-name" data-active={active} data-state={step.state}>
            {step.label}
          </span>
          <span className="hg-stepper-word" data-state={step.state}>
            {step.optional === true ? `${word} · optional` : word}
          </span>
        </span>
        {clickable && !active ? (
          <svg
            className="hg-stepper-chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        ) : null}
      </button>
    </li>
  );
}
