import { Children, isValidElement, type ReactNode } from 'react';

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
