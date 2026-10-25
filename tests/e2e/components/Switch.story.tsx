import { Switch, type SwitchToggleAt } from '@heliogrid/ui';
import { useState } from 'react';

/**
 * A switch as a settings row holds it, in a column of the board's width: the checked state lives
 * here, in the browser, and arrives only through `onChange` — a value handed to `mount` never
 * changes. The column is a flex row, as `SCR-M01-19`'s section row is.
 */
export function HeldSwitch({
  width,
  label,
  description,
  toggleAt,
  initial = false,
}: {
  width: number;
  label: string;
  description?: string;
  toggleAt?: SwitchToggleAt;
  initial?: boolean;
}) {
  const [checked, setChecked] = useState(initial);
  return (
    <div data-testid="row" style={{ width, display: 'flex' }}>
      <Switch
        checked={checked}
        onChange={setChecked}
        label={label}
        description={description}
        toggleAt={toggleAt}
      />
    </div>
  );
}
