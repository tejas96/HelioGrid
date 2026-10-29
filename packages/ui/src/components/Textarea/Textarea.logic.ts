import type { TextareaProps } from './Textarea.types';

/** How close the text is to its limit. */
export type CountLevel = 'full' | 'near' | 'ok';

/** 'near' at 90% of the limit, 'full' at it — the counter warns before it blocks. */
export function countLevel(length: number, maxLength: number): CountLevel {
  if (length >= maxLength) {
    return 'full';
  }
  return length > maxLength * 0.9 ? 'near' : 'ok';
}

/** The counter's figures: characters typed, out of the limit. */
export function countText(length: number, maxLength: number): string {
  return `${length}/${maxLength}`;
}

/** The well's verdict ring: an error rings it. */
export function ringTone(error: TextareaProps['error']): 'error' | 'none' {
  return error === undefined ? 'none' : 'error';
}
