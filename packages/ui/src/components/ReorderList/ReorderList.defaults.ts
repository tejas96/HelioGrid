/* ReorderList's defaults and its sentences — platform-neutral, so both halves say the same words.

   WHAT IS ANNOUNCED. One polite live region owned by the list:
     move   → "Structure mounting moved to position 2 of 5."
     end    → "Structure mounting is already first."
     delete → "Structure mounting deleted. 4 phases remain."
   The row's own name is in every sentence, because "moved down" alone is useless to someone who
   cannot see which row moved. */

export type MoveDirection = 'up' | 'down';

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

/** `it.title || it.label || it.name`, else "Row N". Said in every announcement. */
export function defaultLabelOf(item: unknown, index: number): string {
  if (item && typeof item === 'object') {
    const record = item as Record<string, unknown>;
    for (const key of ['title', 'label', 'name'] as const) {
      const value = record[key];
      if (typeof value === 'string' && value) {
        return value;
      }
    }
  }
  return `Row ${index + 1}`;
}

export function movedSentence(name: string, to: number, total: number): string {
  return `${name} moved to position ${to + 1} of ${total}.`;
}

export function atEndSentence(name: string, dir: MoveDirection): string {
  return `${name} is already ${dir === 'up' ? 'first' : 'last'}.`;
}

export function deletedSentence(name: string, remaining: number, itemNoun: string): string {
  return `${name} deleted. ${remaining} ${itemNoun} remain.`;
}

/**
 * The end arrow's label. It stays focusable and says why it cannot act — the whole reason it is
 * `aria-disabled` rather than natively `disabled`.
 */
export function moveLabel(name: string, dir: MoveDirection, index: number, total: number): string {
  if (dir === 'up') {
    return index === 0 ? `${name} is first` : `Move ${name} up to position ${index}`;
  }
  return index === total - 1 ? `${name} is last` : `Move ${name} down to position ${index + 2}`;
}

/**
 * The row's position AND its denominator — "1 of 5". The position is a fact a sighted reader gets
 * from the order and a screen-reader user does not, so it is stated once per row rather than only
 * on move. The web half draws the digit and hides " of N" beside it; RN has no visually-hidden
 * node, so the native half draws the digit and hands this whole string to the reader.
 */
export function positionLabel(index: number, total: number): string {
  return `${index + 1} of ${total}`;
}

export function deleteLabel(name: string, index: number, total: number): string {
  return `Delete ${name}, position ${positionLabel(index, total)}`;
}

/** The row's control glyphs, one declaration for both platforms. */
export const REORDER_GLYPHS = {
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
  delete: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6',
} as const;

export type ReorderGlyph = keyof typeof REORDER_GLYPHS;
