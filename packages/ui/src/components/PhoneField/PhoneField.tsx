// biome-ignore-all lint/a11y/noAutofocus: `autoFocus` is the caller's contract (.d.ts) — the desktop door has one task, the number.
import { nationalNumber } from '@heliogrid/domain';
import type { CSSProperties } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { classNames } from '../../primitives/class-names';
import { fieldBox } from '../../primitives/FieldBox';
import { useFormat } from '../MarketProvider';
import type { PhoneFieldProps, PhoneValueProps } from './PhoneField.types';

interface WebPhoneFieldProps extends PhoneFieldProps {
  className?: string;
  style?: CSSProperties;
}
interface WebPhoneValueProps extends PhoneValueProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A phone number, entered. The dial code is a FIXED PREFIX beside the digits rather than characters
 * inside them: a person typing their own number does not type their country's code, and a code that
 * can be edited is a code that can be deleted.
 *
 * `value` and `onChange` are E.164 both ways, so a caller stores exactly what it is given.
 */
export function PhoneField({
  label,
  value = '',
  onChange,
  density = 'expressive',
  error,
  helper,
  disabled = false,
  readOnly = false,
  announceError = false,
  autoFocus = false,
  id,
  className,
  style,
}: WebPhoneFieldProps) {
  const mkt = useFormat();
  const autoId = useId();
  const fieldId = id ?? autoId;
  const messageId = `${fieldId}-message`;
  const { dialCode } = mkt.pack.phone;
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* On a server-rendered page the HTML's own `autofocus` focuses the input before React hydrates
     it, so React never hears that focus: without this read the caret sits in a field that draws no
     ring (F7-24). */
  useEffect(() => {
    if (inputRef.current !== null && inputRef.current === document.activeElement) setFocused(true);
  }, []);

  /* The box shows the NATIONAL number, grouped; the caller holds E.164. Splitting here rather than
     in the caller is what stops two screens grouping one number two ways. */
  const shown = mkt.phone(value, { nsn: true });

  /* A number pasted whole carries its `+` and code, which the box already shows beside it. */
  const commit = (typed: string): void => {
    const entered = nationalNumber(mkt.pack, typed);
    onChange?.(entered.length === 0 ? '' : `${dialCode}${entered}`);
  };

  const message = error ?? helper;

  return (
    <div className={classNames('hg-phone-field', className)} style={style}>
      <label className="hg-phone-field-label" htmlFor={fieldId}>
        {label}
      </label>
      <div
        className="hg-phone-field-shell"
        data-density={density}
        {...fieldBox({ focused, tone: error === undefined ? 'none' : 'error', disabled, density })}
      >
        {/* aria-hidden: the code is spoken as part of the field's value, not as a second thing. */}
        <span className="hg-phone-field-dial" aria-hidden="true">
          {dialCode}
        </span>
        <input
          ref={inputRef}
          id={fieldId}
          className="hg-phone-field-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={shown}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          aria-invalid={error === undefined ? undefined : true}
          aria-describedby={message === undefined ? undefined : messageId}
          onChange={(e) => commit(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
      {message === undefined ? null : (
        <p
          id={messageId}
          className="hg-phone-field-message"
          data-error={error === undefined ? undefined : 'true'}
          role={error !== undefined && announceError ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
      {/* The grouping is the pack's, so a screen never restates it — this span exists only to keep
          the digits' count reachable to a screen reader as one number rather than as groups. */}
      <span className="hg-spoken-only">{mkt.phone(value)}</span>
    </div>
  );
}

/**
 * A phone number, shown. The read-only half — a labelled value, grouped and monospaced, with one
 * sentence saying where it came from.
 *
 * NOT a disabled `PhoneField`: disabled is never the only signal (`N4`), and a greyed field reads
 * as *editable, later*. A value that cannot be edited is drawn as a value.
 */
export function PhoneValue({ label, value, note, id, className, style }: WebPhoneValueProps) {
  const mkt = useFormat();

  return (
    <div className={classNames('hg-phone-value', className)} style={style} id={id}>
      {/* Label and number are adjacent text, read in order — no ARIA plumbing earns its place. */}
      <span className="hg-phone-value-label">{label}</span>
      <span className="hg-phone-value-number">{mkt.phone(value)}</span>
      {note === undefined ? null : <p className="hg-phone-value-note">{note}</p>}
    </div>
  );
}
