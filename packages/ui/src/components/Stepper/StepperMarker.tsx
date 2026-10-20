import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import type { ResolvedStep } from './resolve-steps';

interface StepperMarkerProps {
  index: number;
  size?: number;
  step: ResolvedStep;
}

/**
 * The step's glyph. Each state has its own — a tick, an exclamation, a number in an accent ring,
 * a hollow number — so a step's state is never carried by colour alone (F7-12).
 */
export function StepperMarker({ index, size = 28, step }: StepperMarkerProps) {
  return (
    <span
      className="hg-stepper-marker"
      aria-hidden="true"
      data-state={step.state}
      style={{ width: size, height: size, minWidth: size }}
    >
      {step.state === 'done' ? (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="tick-small" />
        </svg>
      ) : null}
      {step.state === 'errors' ? (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="alert-bold" />
        </svg>
      ) : null}
      {step.state === 'in-progress' || step.state === 'not-started' ? index + 1 : null}
    </span>
  );
}
