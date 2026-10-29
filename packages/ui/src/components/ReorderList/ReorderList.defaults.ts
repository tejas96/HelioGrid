/* ReorderList's defaults — platform-neutral, so both halves place and key rows alike. Its sentences
   are the caller's (`ReorderListWords`). */

import type { TranslatedText } from '@heliogrid/contracts';
import type { ShellGlyphName } from '../AppShell/AppShell.types';
import type {
  ReorderListControls,
  ReorderListDensity,
  ReorderListWords,
} from './ReorderList.types';

export type MoveDirection = 'up' | 'down';

/** Where the targets sit when the caller names no placement: a column on the phone's expressive
 *  rows, a line beside the body at functional density. */
export function controlsPlacement(
  controls: ReorderListControls | undefined,
  density: ReorderListDensity,
): ReorderListControls {
  return controls ?? (density === 'functional' ? 'row' : 'stack');
}

/** `it.id ?? it.key`, else the index. The move affordance is keyed by this. */
export function defaultKeyOf(item: unknown, index: number): string | number {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    const id = record.id ?? record.key;
    if (typeof id === 'string' || typeof id === 'number') {
      return id;
    }
  }
  return index;
}

/** What pressing an arrow at the end of the list says: the row cannot go further that way. */
export function atEndSentence(
  words: ReorderListWords,
  name: string,
  dir: MoveDirection,
): TranslatedText {
  return dir === 'up' ? words.alreadyFirst(name) : words.alreadyLast(name);
}

/**
 * An arrow's label. The end arrow stays focusable and says why it cannot act — the whole reason it
 * is `aria-disabled` rather than natively `disabled`.
 */
export function moveLabel(
  words: ReorderListWords,
  name: string,
  dir: MoveDirection,
  index: number,
  total: number,
): TranslatedText {
  if (dir === 'up') {
    return index === 0 ? words.isFirst(name) : words.moveUp(name, index);
  }
  return index === total - 1 ? words.isLast(name) : words.moveDown(name, index + 2);
}

/** The row's control glyphs, one declaration for both platforms. */
export const REORDER_GLYPHS = {
  up: 'chevron-up',
  down: 'chevron',
  delete: 'trash',
} as const satisfies Record<string, ShellGlyphName>;

export type ReorderGlyph = keyof typeof REORDER_GLYPHS;
