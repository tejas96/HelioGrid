'use client';
import { type ChangeEventHandler, type CSSProperties, useId } from 'react';
import './Radio.css';

/**
 * _adherence allowlist: checked, onChange, label, name, value, disabled, id, style.
 * Native input (not @radix-ui/react-radio-group): the standalone per-item API with
 * `name`/`value` grouping doesn't fit Radix's Root+Item model; the native radio gives
 * group + roving-focus semantics for free.
 */
export interface RadioProps {
  checked?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  label?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
  id?: string;
  /** Applies to the root label wrapper. */
  style?: CSSProperties;
}

export function Radio({
  checked = false,
  onChange,
  label,
  name,
  value,
  disabled = false,
  id,
  style,
}: RadioProps) {
  const autoId = useId();
  const rid = id ?? autoId;
  return (
    <label className="ui-radio" htmlFor={rid} style={style} data-disabled={disabled || undefined}>
      <span className="ui-radio-control">
        <input
          id={rid}
          className="ui-radio-input"
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="ui-radio-face" aria-hidden="true">
          <span className="ui-radio-dot" />
        </span>
      </span>
      {label ? <span className="ui-radio-label">{label}</span> : null}
    </label>
  );
}
