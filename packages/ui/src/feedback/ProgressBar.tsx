'use client';
import * as Progress from '@radix-ui/react-progress';
import type { CSSProperties } from 'react';
import './ProgressBar.css';

/** _adherence allowlist: value, gradient, style. `gradient` = brand-gradient fill, AI/long-running ops ONLY. */
export interface ProgressBarProps {
  value?: number;
  gradient?: boolean;
  style?: CSSProperties;
}

export function ProgressBar({ value = 0, gradient = false, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <Progress.Root
      className="ui-progress"
      value={pct}
      data-gradient={gradient || undefined}
      /* --ui-progress-value carries DATA (the fill %), not a visual constant */
      style={{ ...style, '--ui-progress-value': `${pct}%` } as CSSProperties}
    >
      <Progress.Indicator className="ui-progress-fill" />
    </Progress.Root>
  );
}
