'use client';
import { type CSSProperties, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import './Input.css';

/**
 * _adherence allowlist: label, value, onChange, placeholder, type, density, error,
 * success, helper, disabled, mono, leading, trailing, id, style.
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> {
  label?: string;
  density?: 'expressive' | 'functional';
  /** Error message — renders below the field and switches the ring to danger. */
  error?: string;
  success?: boolean;
  helper?: string;
  /** Numerics-as-data render in Geist Mono (docs/10 §3.1). */
  mono?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Applies to the root wrapper, not the input element. */
  style?: CSSProperties;
}

export function Input({
  label,
  density = 'expressive',
  error,
  success = false,
  helper,
  mono = false,
  leading = null,
  trailing = null,
  style,
  id,
  disabled = false,
  type = 'text',
  ...rest
}: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined;
  return (
    <div className="ui-input" data-density={density} style={style}>
      {label ? (
        <label className="ui-input-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <div
        className="ui-input-field"
        data-invalid={error ? true : undefined}
        data-success={(success && !error) || undefined}
        data-disabled={disabled || undefined}
      >
        {leading}
        <input
          id={fieldId}
          className="ui-input-control"
          type={type}
          disabled={disabled}
          data-mono={mono || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {trailing}
      </div>
      {error ? (
        <span className="ui-input-error" id={`${fieldId}-error`}>
          {error}
        </span>
      ) : helper ? (
        <span className="ui-input-helper" id={`${fieldId}-helper`}>
          {helper}
        </span>
      ) : null}
    </div>
  );
}
