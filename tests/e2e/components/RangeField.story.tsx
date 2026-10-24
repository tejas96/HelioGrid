import { RangeField, type RangeValue } from '@heliogrid/ui';
import { useState } from 'react';

/**
 * A range as a screen holds it: the pair lives here, in the browser, and arrives only through
 * `onCommit` — a value handed to `mount` never changes.
 */
export function HeldRangeField({
  label,
  unit,
  boxLabels,
  initial,
  min,
  max,
}: {
  label: string;
  unit: string;
  boxLabels: [string, string];
  initial: RangeValue;
  min: number;
  max: number;
}) {
  const [value, setValue] = useState<RangeValue>(initial);
  return (
    <RangeField
      label={label}
      unit={unit}
      boxLabels={boxLabels}
      value={value}
      min={min}
      max={max}
      onCommit={setValue}
    />
  );
}
