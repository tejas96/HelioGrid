import type { TranslatedText } from '@heliogrid/contracts';
import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { ResolvedStep } from './resolve-steps';
import { indicatorFacts } from './Stepper.logic';
import type { StepperWords } from './Stepper.types';

interface NavButtonProps {
  direction: number;
  disabled: boolean;
  name: TranslatedText;
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
        <ShellGlyphMarks name={direction < 0 ? 'chevron-left' : 'chevron-right'} />
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
  words: StepperWords;
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
  words,
}: StepperIndicatorProps) {
  const { total, name, errors, backOff, nextOff } = indicatorFacts(
    resolved,
    index,
    onStepClick !== undefined,
  );
  return (
    <div className={classNames('hg-stepper-indicator', className)} style={style}>
      <NavButton
        direction={-1}
        disabled={backOff}
        name={words.previousStep}
        onPress={() => onStepClick?.(index - 1)}
      />
      <button
        className="hg-stepper-open"
        type="button"
        onClick={onOpenStepList}
        aria-haspopup="dialog"
        disabled={onOpenStepList === undefined}
      >
        <span className="hg-stepper-count">{`${index + 1} / ${total}`}</span>
        <span className="hg-stepper-dot-sep" aria-hidden="true" />
        <span className="hg-stepper-current">{name}</span>
        {errors > 0 ? <span className="hg-stepper-errors">{words.toFix(errors)}</span> : null}
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
          <ShellGlyphMarks name="chevron" />
        </svg>
      </button>
      <NavButton
        direction={1}
        disabled={nextOff}
        name={words.nextStep}
        onPress={() => onStepClick?.(index + 1)}
      />
    </div>
  );
}
