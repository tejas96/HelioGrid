import type { OtpInputProps } from './OtpInput.types';

/** Each box's digit — blank where the code has none yet. */
export function otpDigits(value: string, length: number): string[] {
  const padded = value.padEnd(length, ' ').slice(0, length);
  return Array.from({ length }, (_, index) => padded.charAt(index).trim());
}

/** What an edit leaves: the code, and the box the caret moves to — `null` when it stays. */
export interface OtpEdit {
  code: string;
  focusAt: number | null;
}

/**
 * What typing into box `index` makes of the code. Anything but digits is dropped. A paste (or an
 * SMS autofill) arrives in one box and fills the rest from there; one digit takes this box and
 * moves on. `null` when nothing typed was a digit.
 */
export function typedOtp(
  value: string,
  index: number,
  raw: string,
  length: number,
): OtpEdit | null {
  const digit = (raw.match(/\d/g) ?? []).join('');
  if (digit === '') return null;
  if (digit.length > 1) {
    return {
      code: (value.slice(0, index) + digit).slice(0, length),
      focusAt: Math.min(length - 1, index + digit.length),
    };
  }
  const arr = value.split('');
  arr[index] = digit;
  return { code: arr.join('').slice(0, length), focusAt: Math.min(length - 1, index + 1) };
}

/**
 * Backspace in box `index`: it clears this box's digit, or on an empty box the one before it, and
 * steps back. `null` on an empty first box.
 */
export function erasedOtp(value: string, index: number, length: number): OtpEdit | null {
  const arr = value.padEnd(length, ' ').split('');
  const here = arr[index];
  if (here !== undefined && here !== ' ') {
    arr[index] = ' ';
    return { code: arr.join('').trimEnd(), focusAt: null };
  }
  if (index > 0) {
    arr[index - 1] = ' ';
    return { code: arr.join('').trimEnd(), focusAt: index - 1 };
  }
  return null;
}

/** The code as reported: never longer than the boxes, and complete once every box holds a digit. */
function reportOtp(
  next: string,
  length: number,
  { onChange, onComplete }: Pick<OtpInputProps, 'onChange' | 'onComplete'>,
): void {
  const code = next.slice(0, length);
  onChange?.(code);
  if (code.length === length) onComplete?.(code);
}

/** An edit lands: the code is reported, and the caret moves to the box the edit names. */
export function applyOtpEdit(
  edit: OtpEdit | null,
  length: number,
  handlers: Pick<OtpInputProps, 'onChange' | 'onComplete'>,
  focusBox: (index: number) => void,
): void {
  if (edit === null) return;
  reportOtp(edit.code, length, handlers);
  if (edit.focusAt !== null) focusBox(edit.focusAt);
}
