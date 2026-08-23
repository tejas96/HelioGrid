import type { ReactElement, ReactNode } from 'react';
import type { ActionReasonSpec } from '../ActionReason/ActionReason.types';

export interface MenuItem {
  key?: string;
  label?: string;
  icon?: ReactNode;
  /** Right-aligned micro text — a shortcut, a count. **Not a mark**: use `marks`. */
  meta?: string;
  /** Marks the entry carries — "Default", "Read-only". Nodes, rendered through `MarkRow`. */
  marks?: ReactNode | ReactNode[];
  /**
   * The current option, under `selection="single"` — `M13-10`'s preset switcher, where
   * `single-preset-trivial` only reads as trivial if the one entry is visibly current. A tick plus
   * `aria-checked`, never colour alone.
   */
  selected?: boolean;
  /** Danger styling AND a trash glyph, so it isn't carried by colour alone. */
  destructive?: boolean;
  disabled?: boolean;
  /**
   * **Why the item is off** — rendered by `ActionReason` as the item's **second line, under the
   * label**. `meta` keeps its own job (a shortcut, a count) and never carries a reason. An item with
   * a stated reason **stays in the arrow-key walk** and is `aria-disabled` rather than natively
   * disabled, because a skipped item is one whose reason a keyboard user can never hear; selection
   * still refuses it.
   */
  disabledReason?: ReactNode | ActionReasonSpec;
  onSelect?: () => void;
  /** Renders a gap instead of an item. */
  separator?: boolean;
}

export type MenuAlign = 'start' | 'end';

/**
 * `single` makes this a **switcher** rather than an action menu: `menuitemradio`, `aria-checked`, a
 * tick as the non-colour channel, and a reserved tick column so labels don't shift when the current
 * option changes. `M13-10`'s preset switcher, and every later picker — language, tenant, saved view.
 */
export type MenuSelection = 'none' | 'single';

export interface MenuProps {
  items: MenuItem[];
  /** Custom trigger element. Defaults to a 44×44 overflow button. */
  trigger?: ReactElement;
  label?: string;
  align?: MenuAlign;
  width?: number;
  /**
   * `single` makes this a **switcher** rather than an action menu: `menuitemradio`, `aria-checked`,
   * a tick as the non-colour channel, and a reserved tick column so labels don't shift when the
   * current option changes.
   */
  selection?: MenuSelection;
  onSelect?: (key: string) => void;
  disabled?: boolean;
}
