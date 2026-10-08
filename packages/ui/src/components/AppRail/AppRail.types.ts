import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';

export interface RailItem {
  key: string;
  label: string;
  icon: ReactNode;
  /**
   * Filled variant, shown only while this item is active — the one place this system mixes
   * filled and outlined icons. Falls back to `icon`.
   */
  activeIcon?: ReactNode;
  /**
   * Unread count, read **from the record** (`F6-17`) so it always matches the list it opens.
   * Renders the numeral via `CountBadge` — "99+" above 99, nothing at zero. `true` still draws a
   * bare dot for the rare case where a count isn't known; prefer a number.
   */
  badge?: number | boolean;
  /**
   * The whole name a screen reader hears, its count included, in the reader's language — the
   * bell's "Notifications, 3 unread". Absent, the label and the count are joined.
   */
  name?: string;
  /** A footer item whose overlay is open — the bell while its centre shows: drawn active. */
  open?: boolean;
  onClick?: () => void;
  /**
   * What a coach mark points at to name this item (`M01-16`): a ref the item binds to its
   * pressable — on the phone a ref to a View, on the web a ref to an element. A mark cannot find
   * an item it was not handed, so a marked item must carry one.
   */
  anchor?: CoachMarkAnchor;
}

export interface AppRailProps {
  /** The navigation landmark's name, in the reader's language. */
  label: string;
  items: RailItem[];
  value?: string;
  onChange?: (key: string) => void;
  /** Utility buttons pinned above the avatar (notifications, settings). */
  footer?: RailItem[];
  avatar?: ReactNode;
  /**
   * Rail width. Defaults to `var(--rail-w, 72px)` — the token is the source of the number, the
   * way `AppHeader` reads `--header-h`. Pass a number to override it.
   */
  width?: number | string;
  /** The product mark. The design system's default is `<LogoTile />` from the brand family. */
  brand?: ReactNode;
}

/**
 * A `verb` item is the role's action: it runs its `onClick`, is never in view, and its label is
 * its name.
 */
export type BottomNavItem = RailItem & { verb?: boolean };

/**
 * The phone footer (`F7-22`): one white pill. The item in view is a near-black pill with its icon
 * and label; every other item is its icon, named by its label. The order is the caller's.
 */
export interface BottomNavProps {
  items: BottomNavItem[];
  value?: string;
  onChange?: (key: string) => void;
  /**
   * Over the screen, `--bottomnav-inset` from each side and `--bottomnav-gap` above the bottom.
   * Default true. False leaves the pill in the flow, for a caller that places it.
   */
  floating?: boolean;
  /**
   * Above the device's own bottom inset, read at run time (`F7-50`). Default true. The web reads
   * it; on the phone the inset is the app's (`.claude/rules/screen-parts.md`), so the frame the
   * pill floats in ends at it and the native half does not read this.
   */
  safeBottom?: boolean;
}

export interface FabProps {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  size?: number;
}

/**
 * The pill's slot, ONE declaration for both halves: the touch floor wide and 48 tall — wider flex
 * slots fall under 44 once a long label is in view (`SCR-SHELL-01`).
 */
export const PILL_NAV_SLOT_WIDTH = MIN_TOUCH_TARGET;
export const PILL_NAV_SLOT_HEIGHT = theme.spacing['sp-12'];

/** The verb is never the item in view, whatever `value` says. */
export function isInView(item: BottomNavItem, value: string | undefined): boolean {
  return item.verb !== true && item.key === value;
}

/** An item with its own act runs it; any other item is a destination, handed to `onChange`. */
export function pressItem(item: BottomNavItem, onChange?: (key: string) => void): void {
  if (item.onClick === undefined) onChange?.(item.key);
  else item.onClick();
}
