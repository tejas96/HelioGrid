import type { CSSProperties } from 'react';
import { useId } from 'react';
import { classNames } from '../../primitives/class-names';
import { useFormat } from '../MarketProvider/market-context';
import type { TimeFieldProps } from './TimeField.types';
import { TimeFieldMessage } from './TimeFieldMessage';
import { normaliseTime, resolvePreset, timeShape } from './time-parse';
import { useTimeEntry } from './use-time-entry';

interface WebTimeFieldProps extends TimeFieldProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Time of day, 24-hour. Commit-once, like `NumberField` — blur or Enter, never per keystroke;
 * Escape cancels.
 *
 * A time outside `min`/`max` is REFUSED and the refusal names the window; it is never clamped. The
 * field restores the last good value and states the permitted hours in words. A preset that falls
 * outside the window is refused the same way, so the thumb path cannot bypass the rule.
 *
 * THE VALUE IS 24-HOUR; THE DISPLAY IS THE MARKET'S (F1 / F3-20). `useFormat().time` spells the
 * draft, the preset labels, the placeholder and every refusal in the pack's clock — a 12-hour
 * market reads "5:00 PM" and is told to type "h:mm AM" — while `value`, `onCommit`, `min` and
 * `max` stay canonical "HH:MM". Both spellings parse on entry regardless of the pack.
 */
export function TimeField({
  value = '',
  onCommit,
  label,
  presets = [],
  helper,
  disabled = false,
  min,
  max,
  windowName,
  density = 'expressive',
  placeholder,
  refusalMessage,
  error,
  invalid = false,
  describedBy,
  id,
  className,
  style,
}: WebTimeFieldProps) {
  const format = useFormat();
  const shape = timeShape(placeholder, format);
  const entry = useTimeEntry({
    format,
    max,
    min,
    onCommit,
    placeholder: shape,
    refusalMessage,
    value,
    windowName,
  });
  const autoId = useId();
  const fieldId = id ?? autoId;
  const errorId = `${fieldId}-err`;
  const hasError = error !== undefined && error !== null && error !== false;
  const danger = entry.refused !== null || hasError || invalid;
  /* Own sentence if there is one; otherwise the one the parent drew for the pair. A ring with
     aria-invalid and no description is "invalid" with no why. */
  let describes: string | undefined;
  if (entry.refused === null && (hasError || invalid)) {
    describes = hasError ? errorId : describedBy;
  }

  return (
    <div className={classNames('hg-time-field', className)} style={style}>
      {label !== undefined ? (
        <label className="hg-time-field-label" htmlFor={fieldId}>
          {label}
        </label>
      ) : null}
      <div
        className="hg-time-field-box"
        data-danger={danger}
        data-density={density}
        data-disabled={disabled}
        data-focus={entry.focus}
      >
        <svg
          className="hg-time-field-glyph"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5V12l3 2" />
        </svg>
        <input
          className="hg-time-field-input"
          id={fieldId}
          inputMode="text"
          autoComplete="off"
          placeholder={shape}
          disabled={disabled}
          aria-invalid={danger ? true : undefined}
          aria-describedby={describes}
          value={entry.draft}
          onChange={(event) => entry.setDraft(event.target.value)}
          onFocus={entry.focusOn}
          onBlur={entry.blur}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              entry.submit();
            } else if (event.key === 'Escape') {
              entry.cancel();
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      {presets.length > 0 ? (
        <div className="hg-time-field-presets">
          {presets.map((candidate) => {
            const preset = resolvePreset(candidate, format);
            return (
              <button
                key={preset.value}
                className="hg-time-field-preset"
                type="button"
                data-active={normaliseTime(preset.value) === normaliseTime(value)}
                disabled={disabled}
                onClick={() => entry.pick(preset.value)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      ) : null}
      <TimeFieldMessage errorId={errorId} error={error} helper={helper} refused={entry.refused} />
    </div>
  );
}
