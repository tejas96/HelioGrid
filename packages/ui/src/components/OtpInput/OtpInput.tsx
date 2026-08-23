// biome-ignore-all lint/a11y/noAutofocus: `autoFocus` is the caller's contract (.d.ts) — the
// code screen exists to receive a code and has nothing else on it to focus.

import type { CSSProperties, KeyboardEvent } from 'react';
import { useId, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { OtpInputProps } from './OtpInput.types';

interface WebOtpInputProps extends OtpInputProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * OtpInput — the login/verification code field. Mono digits in separate 48px boxes,
 * auto-advance, backspace steps back, arrow keys move, and pasting the whole code fills every
 * box (the path a rep actually uses when the SMS is on the same phone).
 */
export function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  label,
  helper,
  error,
  disabled = false,
  autoFocus = false,
  className,
  style,
}: WebOtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const autoId = useId();
  const slots = Array.from({ length }, (_, i) => ({
    key: `${autoId}-${i}`,
    index: i,
    char: value.padEnd(length, ' ').slice(0, length).charAt(i).trim(),
  }));

  const set = (next: string) => {
    const v = next.slice(0, length);
    onChange?.(v);
    if (v.length === length) onComplete?.(v);
  };

  const onCharChange = (i: number, raw: string) => {
    const digit = (raw.match(/\d/g) ?? []).join('');
    if (digit === '') return;
    /* A paste (or an SMS autofill) arrives in one box and fills the rest from there. */
    if (digit.length > 1) {
      set((value.slice(0, i) + digit).slice(0, length));
      refs.current[Math.min(length - 1, i + digit.length)]?.focus();
      return;
    }
    const arr = value.split('');
    arr[i] = digit;
    set(arr.join('').slice(0, length));
    refs.current[Math.min(length - 1, i + 1)]?.focus();
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.padEnd(length, ' ').split('');
      const here = arr[i];
      if (here !== undefined && here !== ' ') {
        arr[i] = ' ';
        set(arr.join('').trimEnd());
      } else if (i > 0) {
        arr[i - 1] = ' ';
        set(arr.join('').trimEnd());
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className={classNames('hg-otp', className)} style={style}>
      {label !== undefined ? <div className="hg-otp-label">{label}</div> : null}
      {/* biome-ignore lint/a11y/useSemanticElements: a <fieldset>/<legend> would replace the
          label line the design system draws above the boxes, and this group has no submit
          semantics — role="group" is the exact meaning. */}
      <div className="hg-otp-boxes" role="group" aria-label={label ?? 'Verification code'}>
        {slots.map((slot) => (
          <input
            key={slot.key}
            ref={(el) => {
              refs.current[slot.index] = el;
            }}
            className="hg-otp-box"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={`Digit ${slot.index + 1}`}
            aria-invalid={error !== undefined ? true : undefined}
            data-error={error !== undefined}
            maxLength={length}
            disabled={disabled}
            autoFocus={autoFocus && slot.index === 0}
            value={slot.char}
            onChange={(e) => onCharChange(slot.index, e.target.value)}
            onKeyDown={(e) => onKey(slot.index, e)}
            onFocus={(e) => e.target.select()}
          />
        ))}
      </div>
      {helper !== undefined || error !== undefined ? (
        <p className="hg-otp-message" data-error={error !== undefined}>
          {error ?? helper}
        </p>
      ) : null}
    </div>
  );
}
