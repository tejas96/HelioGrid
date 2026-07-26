'use client';
import './StepIndicator.css';

/**
 * Composition allowlist: steps, current, label. N step bars (whatyousell.md §2 row 2):
 * bars 1…current are accent, the rest canvas-sunken. Not ProgressBar — that is a
 * continuous meter; this is discrete flow position.
 */
export interface StepIndicatorProps {
  steps: number;
  /** 1-based: bars 1…current render active (accent). */
  current: number;
  /** Accessible name, e.g. the translated "Step 1 of 2" — required (a11y contract). */
  label: string;
}

export function StepIndicator({ steps, current, label }: StepIndicatorProps) {
  const bars = Array.from({ length: steps }, (_, position) => position + 1);
  return (
    <span className="ui-step-indicator" role="img" aria-label={label}>
      {bars.map((step) => (
        <span
          key={step}
          className="ui-step-indicator-bar"
          data-active={step <= current || undefined}
        />
      ))}
    </span>
  );
}
