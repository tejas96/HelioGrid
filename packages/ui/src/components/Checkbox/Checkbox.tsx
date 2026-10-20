import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import type { CheckboxProps } from './Checkbox.types';
import { CheckboxTick } from './CheckboxTick';

interface WebCheckboxProps extends CheckboxProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * 20px checkbox. Unchecked = white + e1, checked = accent fill + white check.
 *
 * THE VISIBLE BOX IS 20px AND THE TARGET IS 44 — two rectangles, the FilterBar rule. The <label> is
 * the hit box (the real input is visually hidden). A bare box centres itself in its 44px target; a
 * labelled one starts at the left edge. A tick with no visible label — the `DataTable`'s selection
 * column — is named by `ariaLabel`, so nothing prints beside it and nothing is unnamed.
 *
 * **A control, not an item.** A list of steps someone ticks off — number, title, detail, materials,
 * who ticked it, and a tick that is a server write — is `Checklist` (law 23), never rows of these.
 */
export function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  ariaLabel,
  className,
  style,
}: WebCheckboxProps) {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <label
      className={classNames('hg-checkbox', className)}
      data-labelled={label === undefined ? undefined : 'true'}
      data-checked={checked ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      style={style}
      htmlFor={cid}
    >
      <span className="hg-checkbox-box">{checked ? <CheckboxTick /> : null}</span>
      <input
        className="hg-checkbox-input"
        id={cid}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        /* The name-only route: the tick is the control, so the name goes on the control. A visible
           `label` is already its name through the wrapping `<label>`, and never both. */
        aria-label={label === undefined ? ariaLabel : undefined}
        /* The box is controlled, so the next state is the negation of the current one — the same
           expression the native half uses, and it keeps this file free of DOM member access. */
        onChange={() => onChange?.(!checked)}
      />
      {label === undefined ? null : <span className="hg-checkbox-label">{label}</span>}
    </label>
  );
}
