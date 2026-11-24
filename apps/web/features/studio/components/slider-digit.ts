import type { KeyboardEvent } from 'react';

const ONE_DIGIT = /^[0-9]$/;

/**
 * A digit typed while a slider has focus (`T-M05-002`, *Values*, G027): the person wants to type,
 * so the slider's box opens holding it. The digit, else `null` — a shortcut held with Ctrl, ⌘ or
 * Alt is not typing.
 */
export function digitOnSlider(event: KeyboardEvent): string | null {
  const target = event.target;
  const onSlider = target instanceof HTMLInputElement && target.type === 'range';
  const held = event.ctrlKey || event.metaKey || event.altKey;
  return onSlider && !held && ONE_DIGIT.test(event.key) ? event.key : null;
}

/**
 * The key handler round a slider whose box opens on a digit: on a digit typed while it slides,
 * `open` hears the digit, and the key types nothing into the slider.
 */
export function boxOnDigit(typing: boolean, open: (digit: string) => void) {
  return (event: KeyboardEvent) => {
    const digit = digitOnSlider(event);
    if (typing || digit === null) return;
    event.preventDefault();
    open(digit);
  };
}
