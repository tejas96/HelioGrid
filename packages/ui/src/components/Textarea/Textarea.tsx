import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { renderAttribution } from '../ValueSource';
import type { TextareaProps } from './Textarea.types';

interface WebTextareaProps extends TextareaProps {
  className?: string;
  style?: CSSProperties;
}

/** 'near' at 90% of the limit, 'full' at it — the counter warns before it blocks. */
function countLevel(length: number, maxLength: number): 'full' | 'near' | 'ok' {
  if (length >= maxLength) {
    return 'full';
  }
  return length > maxLength * 0.9 ? 'near' : 'ok';
}

/**
 * Multi-line field. No border at rest (e1); 2px accent ring on focus.
 *
 * It hosts `attribution` for the same reason `Input` does — "this section's wording falls back to
 * Hindi" is which-layer-supplied-this, not free prose in `helper`. Slot: UNDER the field, in the
 * help-text position and ABOVE it, so it survives an error message appearing.
 */
export function Textarea({
  value,
  onChange,
  label,
  placeholder,
  rows = 4,
  maxLength,
  attribution,
  density = 'expressive',
  disabled = false,
  helper,
  error,
  name,
  className,
  style,
}: WebTextareaProps) {
  const autoId = useId();
  const length = (value ?? '').length;
  const hasCounter = maxLength !== undefined;
  const level = maxLength === undefined ? 'ok' : countLevel(length, maxLength);
  /* A spec, a level string or a ready node — `ValueSource`'s own resolver decides. The field's
     name rides along, so `inherited`'s override action says which field it would override. */
  const attributionNode = renderAttribution(attribution, { fieldName: label });

  return (
    <div className={classNames('hg-textarea', className)} style={style}>
      {label !== undefined ? (
        <label className="hg-textarea-label" htmlFor={autoId}>
          {label}
        </label>
      ) : null}
      <textarea
        className="hg-textarea-input"
        data-density={density}
        data-error={error !== undefined}
        id={autoId}
        name={name}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error !== undefined ? true : undefined}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {attributionNode === null ? null : (
        <div className="hg-textarea-attribution">{attributionNode}</div>
      )}
      {helper !== undefined || error !== undefined || hasCounter ? (
        <div className="hg-textarea-foot">
          <span className="hg-textarea-message" data-error={error !== undefined}>
            {error ?? helper}
          </span>
          {maxLength !== undefined ? (
            <span className="hg-textarea-count" data-level={level}>
              {length}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
