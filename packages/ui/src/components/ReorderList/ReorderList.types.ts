import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ComplianceFloorSpec } from '../ComplianceFloor';

export type ReorderListControls = 'stack' | 'row' | 'foot';
export type ReorderListDensity = 'expressive' | 'functional';

/**
 * Every sentence the list says, in the reader's language — `@heliogrid/i18n`'s `reorderListWords`.
 * The row's name is in each, because "moved down" alone is useless to someone who cannot see which
 * row moved. Positions are 1-based.
 */
export interface ReorderListWords {
  /** "Structure mounting moved to position 2 of 5." */
  moved: (name: string, position: number, total: number) => TranslatedText;
  /** "Structure mounting is already first." — said when the first row's ⌃ is pressed. */
  alreadyFirst: (name: string) => TranslatedText;
  alreadyLast: (name: string) => TranslatedText;
  /** "Structure mounting deleted. 4 phases remain." — `noun` is the list's `itemNoun`. */
  deleted: (name: string, remaining: number, noun: TranslatedText | undefined) => TranslatedText;
  /** ⌃'s name — "Move Structure mounting up to position 1". */
  moveUp: (name: string, position: number) => TranslatedText;
  moveDown: (name: string, position: number) => TranslatedText;
  /** The end arrows stay focusable and say why they cannot act — "Structure mounting is first". */
  isFirst: (name: string) => TranslatedText;
  isLast: (name: string) => TranslatedText;
  /** The row's position with its denominator — "1 of 5". */
  position: (position: number, total: number) => TranslatedText;
  /** The delete's name — "Delete Structure mounting, position 1 of 5". */
  deleteRow: (name: string, position: number, total: number) => TranslatedText;
}

export interface ReorderListProps<T = unknown> {
  items: T[];
  /** Stable identity. The move affordance is keyed by it — that is what lets focus travel with a row. */
  keyOf?: (item: T, index: number) => string | number;
  /** The row's name — the caller's word or a fact it holds. Said in every announcement and label. */
  labelOf: (item: T, index: number) => string;
  /** The row body — the record's own content, never a field: a row is a tile (`F7-49`), and a
   *  field is edited in a sheet. Anything focusable inside stays reachable. */
  renderItem?: (item: T, index: number) => ReactNode;
  /** `(key, fromIndex, toIndex)` — **an index**, unlike `Kanban.onMove`, because the index is the value. */
  onMove?: (key: string | number, fromIndex: number, toIndex: number) => void;
  onDelete?: (key: string | number, index: number) => void;
  /** Per-row veto. A row that can't be deleted has **no** delete button, not a dead one. */
  canDelete?: (item: T, index: number) => boolean;
  /**
   * **A row protected by law** (`M07-11` P0 / `SCR-M07-05`: *"none forced — except 'asks to stop',
   * which is the statutory opt-out and cannot be removed"*). Returns a `ComplianceFloor` spec or node
   * — the row renders it as a permanent line and loses its delete button. `canDelete` vetoes silently;
   * this row's whole point is that the reason is sayable, and that it is a **floor**, not a preference
   * an admin set and not a permission the reader lacks.
   */
  lockOf?: (item: T, index: number) => ComplianceFloorSpec | ReactNode | null;
  /** Below this many rows every delete button disappears — "at least one phase" is a real rule. */
  minItems?: number;
  /** The list's accessible name. */
  label: TranslatedText;
  /** Plural noun for the delete announcement — "phases", "tranches", "brands". */
  itemNoun?: TranslatedText;
  /** What an empty list says. Drawn only when given; the empty line still takes focus after a delete. */
  emptyMessage?: TranslatedText;
  words: ReorderListWords;
  /**
   * Where the ⌃ ⌄ 🗑 targets sit. Defaults: `stack` (expressive/phone), `row` (functional). `foot` sets
   * them in one line under the row's body, at its end, so the body takes the row's full width — for a
   * narrow editor where beside-the-text controls wrap every title (`SCR-M01-19`). Same targets, order,
   * announcements and focus rules in every placement.
   */
  controls?: ReorderListControls;
  /**
   * With `controls="foot"`: the row's own act — an edit pencil — placed at the **start** of the foot
   * row, with ⌃ ⌄ 🗑 at its end, so a row's icons are one line (`SCR-M01-19`). The caller's node, named
   * by the caller ("Edit <phase>"); it comes before ⌃ in the tab order. Ignored in `stack` and `row`.
   */
  actionOf?: (item: T, index: number) => ReactNode;
  density?: ReorderListDensity;
}
