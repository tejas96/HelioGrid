import type { CSSProperties } from 'react';
import { useId, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { fieldBox } from '../../primitives/FieldBox';
import { renderAttribution } from '../ValueSource';
import { countLevel, countText, ringTone } from './Textarea.logic';
import type { TextareaProps } from './Textarea.types';

interface WebTextareaProps extends TextareaProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Multi-line field: a well (`FieldBox`) that takes the system focus ring and an inset verdict ring.
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
  const [focused, setFocused] = useState(false);
  const length = (value ?? '').length;
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
        {...fieldBox({ focused, tone: ringTone(error), disabled, density })}
        id={autoId}
        name={name}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        aria-invalid={error !== undefined ? true : undefined}
        onChange={(event) => onChange?.(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {attributionNode === null ? null : (
        <div className="hg-textarea-attribution">{attributionNode}</div>
      )}
      {helper !== undefined || error !== undefined || maxLength !== undefined ? (
        <div className="hg-textarea-foot">
          <span className="hg-textarea-message" data-error={error !== undefined}>
            {error ?? helper}
          </span>
          {maxLength !== undefined ? (
            <span className="hg-textarea-count" data-level={level}>
              {countText(length, maxLength)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
