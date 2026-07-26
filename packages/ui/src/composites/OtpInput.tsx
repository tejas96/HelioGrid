'use client';
import {
  type ChangeEvent,
  type ClipboardEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
} from 'react';
import './OtpInput.css';

/**
 * Composition allowlist: length, value, onChange, onComplete, error, disabled,
 * autoFocus, label, style. Behaviours from docs/modules/auth-tenancy/specs/login.md §5:
 * auto-advance, backspace walk-back, paste distributes, digits-only, digits retained on
 * error. `error` is controlled — the parent clears it in onChange (any edit clears it).
 */
export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible group name — required (a11y contract, mirrors IconButton). */
  label: string;
  /** Applies to the root group wrapper. */
  style?: CSSProperties;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = false,
  label,
  style,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = value.replace(/\D/g, '').slice(0, length).split('');
  const boxes = Array.from({ length }, (_, position) => position);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string, focusIndex: number | null) => {
    onChange(next);
    if (focusIndex !== null) refs.current[focusIndex]?.focus();
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '');
    if (digits === '') {
      // box cleared natively (backspace/delete on a filled box)
      const next = [...chars];
      next.splice(Math.min(index, next.length - 1), 1);
      commit(next.join(''), null);
      return;
    }
    // last-char-wins on overtype; value stays left-packed, so typing into a far
    // empty box appends at the first free position instead of leaving a gap
    const digit = digits.slice(-1);
    const position = Math.min(index, chars.length);
    const next = [...chars];
    next[position] = digit;
    commit(next.join(''), Math.min(position + 1, length - 1));
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace' || event.currentTarget.value !== '' || index === 0) return;
    // backspace on an empty box clears the previous box and focuses it (walk-back)
    const previous = Math.min(index - 1, chars.length - 1);
    if (previous < 0) return;
    event.preventDefault();
    const next = [...chars];
    next.splice(previous, 1);
    commit(next.join(''), previous);
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (digits === '') return;
    commit(digits, Math.min(digits.length, length - 1));
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  return (
    // fieldset = native group semantics (biome useSemanticElements); reset in OtpInput.css
    <fieldset
      className="ui-otp"
      aria-label={label}
      data-error={error || undefined}
      data-disabled={disabled || undefined}
      style={style}
    >
      {boxes.map((position) => (
        <input
          key={position}
          ref={(node) => {
            refs.current[position] = node;
          }}
          className="ui-otp-box"
          type="text"
          inputMode="numeric"
          autoComplete={position === 0 ? 'one-time-code' : 'off'}
          value={chars[position] ?? ''}
          disabled={disabled}
          aria-label={`${label} ${position + 1}`}
          aria-invalid={error || undefined}
          data-filled={chars[position] !== undefined || undefined}
          onChange={(event) => handleChange(position, event)}
          onKeyDown={(event) => handleKeyDown(position, event)}
          onPaste={handlePaste}
          onFocus={handleFocus}
        />
      ))}
    </fieldset>
  );
}
