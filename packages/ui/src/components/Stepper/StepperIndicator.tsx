import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import type { ResolvedStep } from './resolve-steps';

interface NavButtonProps {
  direction: number;
  disabled: boolean;
  name: string;
  onPress: () => void;
}

function NavButton({ direction, disabled, name, onPress }: NavButtonProps) {
  return (
    <button
      className="hg-stepper-nav"
      type="button"
      aria-label={name}
      disabled={disabled}
      onClick={onPress}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={direction < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
      </svg>
    </button>
  );
}

interface StepperIndicatorProps {
  className?: string;
  index: number;
  onOpenStepList?: () => void;
  onStepClick?: (index: number) => void;
  resolved: readonly ResolvedStep[];
  style?: CSSProperties;
}

/**
 * The compact mobile bar: `‹ 3 / 9 · Panel layout ›`, with a total error count when any step has
 * one. Back is always available (M05-03), and under the default `free` mode so is Next — M06-22's
 * "Back/Next always navigate". Under `reachability="entered"` Next only enters a started step.
 */
export function StepperIndicator({
  className,
  index,
  onOpenStepList,
  onStepClick,
  resolved,
  style,
}: StepperIndicatorProps) {
  const total = resolved.length;
  const step = resolved[index];
  const next = resolved[index + 1];
  const nextReachable = next?.reachable === true;
  const errors = resolved.filter((entry) => entry.state === 'errors').length;
  return (
    <div className={classNames('hg-stepper-indicator', className)} style={style}>
      <NavButton
        direction={-1}
        disabled={index === 0 || onStepClick === undefined}
        name="Previous step"
        onPress={() => onStepClick?.(index - 1)}
      />
      <button
        className="hg-stepper-open"
        type="button"
        onClick={onOpenStepList}
        aria-haspopup="dialog"
        disabled={onOpenStepList === undefined}
      >
        <span className="hg-stepper-count">
          {index + 1} / {total}
        </span>
        <span className="hg-stepper-dot-sep" aria-hidden="true" />
        <span className="hg-stepper-current">{step === undefined ? '' : step.label}</span>
        {errors > 0 ? <span className="hg-stepper-errors">{errors} to fix</span> : null}
        <svg
          className="hg-stepper-chevron"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <NavButton
        direction={1}
        disabled={!nextReachable || onStepClick === undefined}
        name="Next step"
        onPress={() => onStepClick?.(index + 1)}
      />
    </div>
  );
}
