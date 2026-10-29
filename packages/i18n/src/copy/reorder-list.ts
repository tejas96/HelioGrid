/**
 * An authored order's sentences (`ReorderList`, `packages/ui`'s `ReorderListWords`): what its live
 * region announces after a move or a delete, and the names of each row's ⌃ ⌄ 🗑 and position. The
 * row's own name is in every sentence, because "moved down" alone is useless to someone who cannot
 * see which row moved.
 */
import type { Translator } from '../runtime';
import { SHELL } from './shell';

const REORDER_LIST = {
  moved: /*i18n*/ { id: '{name} moved to position {position} of {total}.' },
  alreadyFirst: /*i18n*/ { id: '{name} is already first.' },
  alreadyLast: /*i18n*/ { id: '{name} is already last.' },
  deletedOf: /*i18n*/ { id: '{name} deleted. {remaining} {noun} remain.' },
  deleted: /*i18n*/ {
    id: '{name} deleted. {remaining, plural, one {# remains} other {# remain}}.',
  },
  moveUp: /*i18n*/ { id: 'Move {name} up to position {position}' },
  moveDown: /*i18n*/ { id: 'Move {name} down to position {position}' },
  isFirst: /*i18n*/ { id: '{name} is first' },
  isLast: /*i18n*/ { id: '{name} is last' },
  deleteRow: /*i18n*/ { id: 'Delete {name}, position {position} of {total}' },
} as const;

/** Every sentence a reorderable list says, in the reader's language. Positions are 1-based. */
export function reorderListWords(t: Translator['t']) {
  return {
    moved: (name: string, position: number, total: number) =>
      t(REORDER_LIST.moved, { name, position, total }),
    alreadyFirst: (name: string) => t(REORDER_LIST.alreadyFirst, { name }),
    alreadyLast: (name: string) => t(REORDER_LIST.alreadyLast, { name }),
    deleted: (name: string, remaining: number, noun: string | undefined) =>
      noun === undefined
        ? t(REORDER_LIST.deleted, { name, remaining })
        : t(REORDER_LIST.deletedOf, { name, remaining, noun }),
    moveUp: (name: string, position: number) => t(REORDER_LIST.moveUp, { name, position }),
    moveDown: (name: string, position: number) => t(REORDER_LIST.moveDown, { name, position }),
    isFirst: (name: string) => t(REORDER_LIST.isFirst, { name }),
    isLast: (name: string) => t(REORDER_LIST.isLast, { name }),
    position: (position: number, total: number) => t(SHELL.markCount, { step: position, total }),
    deleteRow: (name: string, position: number, total: number) =>
      t(REORDER_LIST.deleteRow, { name, position, total }),
  };
}
