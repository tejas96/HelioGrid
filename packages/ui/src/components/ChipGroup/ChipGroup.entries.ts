import type { TranslatedText } from '@heliogrid/contracts';
import { Children, isValidElement, type ReactNode } from 'react';
import type { ChipGroupWords } from './ChipGroup.types';

export interface ChipEntry {
  key: string;
  node: ReactNode;
}

/**
 * The children, flattened and keyed once for both platform halves.
 *
 * `Children.toArray` already drops `null`, `undefined` and booleans and stamps a stable key on
 * every element; the empty string is the one falsy child it keeps, so it is filtered here. The
 * key is the child's own — never its index, which would reorder wrongly when a chip is removed.
 */
export function chipEntries(children: ReactNode): ChipEntry[] {
  return Children.toArray(children)
    .filter((child) => child !== '')
    .map((child, position) => ({
      key: isValidElement(child) && child.key !== null ? child.key : `chip-at-${position}`,
      node: child,
    }));
}

/** What a group draws of its chips: the ones in view, and how many wait behind the "+N". */
export interface ChipOverflow {
  /** More chips than `max` — the "+N" is drawn. `0` never caps. */
  readonly capped: boolean;
  readonly shown: ChipEntry[];
  readonly hidden: number;
}

/** Overflow is by COUNT, never by pixels: the first `max` render whole while the group is closed. */
export function chipOverflow(all: ChipEntry[], max: number, open: boolean): ChipOverflow {
  const capped = max > 0 && all.length > max;
  const shown = capped && !open ? all.slice(0, max) : all;
  return { capped, shown, hidden: all.length - shown.length };
}

/** The "+N" pill's figure — the chips behind it. */
export function overflowCount(hidden: number): string {
  return `+${hidden}`;
}

/** The "+N" control's words: open, it offers fewer; closed, it counts what waits behind it. */
export function moreControlWords(
  words: ChipGroupWords,
  open: boolean,
  hidden: number,
  total: number,
): { seen: TranslatedText | string; spoken: TranslatedText } {
  return open
    ? { seen: words.showFewer, spoken: words.showFewerSpoken }
    : { seen: overflowCount(hidden), spoken: words.showMore(hidden, total) };
}
