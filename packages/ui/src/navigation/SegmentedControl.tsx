'use client';
import * as RadioGroup from '@radix-ui/react-radio-group';
import type { CSSProperties } from 'react';
import './SegmentedControl.css';

export interface SegmentedOption {
  value: string;
  label: string;
}

/** _adherence allowlist: options, value, onChange, density, style. */
export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  density?: 'expressive' | 'functional';
  style?: CSSProperties;
}

/** Pill track on canvas-sunken; white thumb slides with the spring easing. Radix radio-group core (roving focus). */
export function SegmentedControl({
  options,
  value,
  onChange,
  density = 'expressive',
  style,
}: SegmentedControlProps) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <RadioGroup.Root
      className="ui-segmented"
      data-density={density}
      value={value}
      onValueChange={onChange}
      /* --ui-segmented-index/count carry DATA (thumb position), not visual constants */
      style={
        {
          ...style,
          '--ui-segmented-index': index,
          '--ui-segmented-count': Math.max(1, options.length),
        } as CSSProperties
      }
    >
      {options.length > 0 && <span className="ui-segmented-thumb" aria-hidden />}
      {options.map((o) => (
        <RadioGroup.Item key={o.value} value={o.value} className="ui-segmented-item">
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
