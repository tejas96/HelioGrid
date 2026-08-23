import type { ReactNode } from 'react';
import type { ComplianceFloorSpec } from '../ComplianceFloor';

export type ReorderListControls = 'stack' | 'row';
export type ReorderListDensity = 'expressive' | 'functional';

export interface ReorderListProps<T = unknown> {
  items: T[];
  /** Stable identity. The move affordance is keyed by it — that is what lets focus travel with a row. */
  keyOf?: (item: T, index: number) => string | number;
  /** The row's name. Said in every announcement and every button label. */
  labelOf?: (item: T, index: number) => string;
  /** The row body — the caller's fields. Anything focusable inside stays reachable. */
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
  label?: string;
  /** Plural noun for announcements — "phases", "tranches", "brands". */
  itemNoun?: string;
  emptyMessage?: string;
  /** Where the ⌃ ⌄ 🗑 targets sit. Defaults: `stack` (expressive/phone), `row` (functional). */
  controls?: ReorderListControls;
  density?: ReorderListDensity;
}
