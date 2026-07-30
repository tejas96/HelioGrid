'use client';
import * as RadixSwitch from '@radix-ui/react-switch';
import { type CSSProperties, useId } from 'react';
import './Switch.css';

/** _adherence allowlist: checked, onChange, label, disabled, id, style. */
export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  /** Applies to the root label wrapper. */
  style?: CSSProperties;
}

export function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style,
}: SwitchProps) {
  const autoId = useId();
  const sid = id ?? autoId;
  return (
    <label className="ui-switch" htmlFor={sid} style={style} data-disabled={disabled || undefined}>
      <RadixSwitch.Root
        id={sid}
        className="ui-switch-track"
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
      >
        <RadixSwitch.Thumb className="ui-switch-thumb" />
      </RadixSwitch.Root>
      {label ? <span className="ui-switch-label">{label}</span> : null}
    </label>
  );
}
