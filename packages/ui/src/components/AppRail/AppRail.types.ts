import type { ReactNode } from 'react';

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
  onClick?: () => void;
}

export interface AppRailProps {
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

/** Use `{ key, fab: true, label }` to reserve the centre slot; the label sits under the FAB. */
export interface BottomNavFabSlot {
  key: string;
  fab: true;
  label?: string;
}

export type BottomNavItem = RailItem | BottomNavFabSlot;

/**
 * curve = one parabolic sweep across the full width, icons and labels riding it (default, the
 * signature of the phone shell) · notch = concave cut · flat = plain bar.
 */
export type BottomNavShape = 'curve' | 'notch' | 'flat';

export interface BottomNavProps {
  items: BottomNavItem[];
  value?: string;
  onChange?: (key: string) => void;
  fab?: ReactNode;
  shape?: BottomNavShape;
  /**
   * Depth of the arc: how far the edges sit below the centre peak. 21 is the drawn spec —
   * changing it moves the icons and labels with the curve, since they ride it.
   */
  curveHeight?: number;
  /** Bar height measured from the centre peak down. Matches --bottomnav-h. */
  height?: number;
  /** Radius of the concave cut when shape="notch". */
  notchRadius?: number;
  /** How far the FAB rides above the peak. 23 of its 56 sits proud, the rest inside the bar. */
  fabOffset?: number;
}

export interface FabProps {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  size?: number;
}

/**
 * Vertical rhythm measured from the curve's peak: 13 icon top / 24 icon box / 4 gap / 14 label
 * line. ONE declaration for both platforms — the content RIDES the arc, so these are the numbers
 * the per-slot drop is added to.
 */
export const ICON_TOP = 13;
export const ICON_BOX = 24;
export const ICON_GAP = 4;
export const LABEL_TOP = ICON_TOP + ICON_BOX + ICON_GAP;

/** Depth of the parabolic edge at slot `k`'s centre, across `count` equal slots. */
export function slotDrop(k: number, count: number, rise: number): number {
  if (rise === 0 || count === 0) {
    return 0;
  }
  const u = ((k + 0.5) / count - 0.5) * 2;
  return rise * u * u;
}

export function isFabSlot(item: BottomNavItem): item is BottomNavFabSlot {
  return 'fab' in item && item.fab === true;
}
