import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import type { RadioProps } from './Radio.types';

interface WebRadioProps extends RadioProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * 20px radio. Checked = accent ring + accent dot. The visible box is 20px and the target is 44 —
 * the `<label>` is the hit box, the same two-rectangles treatment Checkbox and FilterBar use.
 */
export function Radio({
  checked = false,
  onChange,
  label,
  name,
  value,
  disabled = false,
  id,
  className,
  style,
}: WebRadioProps) {
  const autoId = useId();
  const rid = id ?? autoId;
  return (
    <label
      className={classNames('hg-radio', className)}
      htmlFor={rid}
      data-labelled={label !== undefined}
      data-disabled={disabled}
      style={style}
    >
      {/* The input leads the box so the focus ring can be drawn on its sibling — see Radio.css. */}
      <input
        className="hg-radio-input"
        id={rid}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange?.()}
      />
      <span className="hg-radio-box" data-checked={checked} data-disabled={disabled}>
        {checked ? <span className="hg-radio-dot" /> : null}
      </span>
      {label !== undefined ? <span className="hg-radio-label">{label}</span> : null}
    </label>
  );
}
