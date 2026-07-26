'use client';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { type CSSProperties, type ReactNode, useId } from 'react';
import './Checkbox.css';

/** _adherence allowlist: checked, onChange, label, disabled, id, style. */
export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
  /** Applies to the root label wrapper. */
  style?: CSSProperties;
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  style,
}: CheckboxProps) {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <label
      className="ui-checkbox"
      htmlFor={cid}
      style={style}
      data-disabled={disabled || undefined}
    >
      <RadixCheckbox.Root
        id={cid}
        className="ui-checkbox-box"
        checked={checked}
        onCheckedChange={(next) => onChange?.(next === true)}
        disabled={disabled}
      >
        <RadixCheckbox.Indicator className="ui-checkbox-indicator">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 6.5L5 9l4.5-5" />
          </svg>
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label ? <span className="ui-checkbox-label">{label}</span> : null}
    </label>
  );
}
