import { ShellGlyph } from '../AppShell/ShellGlyph';
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
      {step.state === 'done' ? <ShellGlyph name="check" size="dense" tone="current" /> : null}
      {step.state === 'errors' ? <ShellGlyph name="alert" size="dense" tone="current" /> : null}
      {step.state === 'in-progress' || step.state === 'not-started' ? index + 1 : null}
    </span>
  );
}
