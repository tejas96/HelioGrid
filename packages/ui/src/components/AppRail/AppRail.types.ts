import type { TranslatedText } from '@heliogrid/contracts';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { MIN_TOUCH_TARGET } from '../../primitives/Pressable/Pressable.types';
import type { AccountMenuProps } from '../AccountMenu/AccountMenu.types';
import type { AppearanceSwitchProps } from '../AppearanceSwitch/AppearanceSwitch.types';
import type { CoachMarkAnchor } from '../CoachMark/CoachMark.types';

export interface RailItem {
  key: string;
  label: TranslatedText;
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
   * bell's "Notifications, 3 unread". Absent, the item is named by `label` alone, so a badged
   * item passes it.
   */
  name?: TranslatedText;
  /** A footer item whose overlay is open — the bell while its centre shows: drawn active. */
  open?: boolean;
  /**
   * A quiet word after the label — *Soon* on a list whose module has not landed. Pass the row's
   * whole spoken sentence in `name` with it, so a screen reader hears it too.
   */
  tag?: TranslatedText;
  onClick?: () => void;
  /**
   * What a coach mark points at to name this item (`M01-16`): a ref the item binds to its
   * pressable — on the phone a ref to a View, on the web a ref to an element. A mark cannot find
   * an item it was not handed, so a marked item must carry one.
   */
  anchor?: CoachMarkAnchor;
}

/** The account at the sidebar's foot: who is signed in, their menu, and the theme switch. */
export interface RailAccount {
  /**
   * The account's menu (`AccountMenu`), drawn by the rail: open, the whole row — avatar, name,
   * caption and an up-down mark — opens it; folded, the avatar alone.
   */
  menu: Omit<AccountMenuProps, 'row'>;
  /** One quiet line under the name: the role and the company. */
  caption?: TranslatedText;
  /**
   * The Light / Dark / Device switch (`AppearanceSwitch`), drawn by the rail: open, its three
   * icons; folded, its one button that steps to the next choice.
   */
  appearance?: Omit<AppearanceSwitchProps, 'form'>;
}

export interface AppRailProps {
  /** The navigation landmark's name, in the reader's language. */
  label: TranslatedText;
  /** The work destinations, at the top and with no overline: Home, then the person's lists. */
  items: RailItem[];
  value?: string;
  onChange?: (key: string) => void;
  /** Utility buttons pinned above the account (the settings list). */
  footer?: RailItem[];
  /** The bell, a round icon beside the brand with its unread count. */
  bell?: RailItem;
  /** The search's door as one icon, drawn in the search's place while the sidebar is folded. */
  searchItem?: RailItem;
  /** The account block at the foot. */
  account?: RailAccount;
  /** The avatar alone, for a sidebar with no account block. */
  avatar?: ReactNode;
  /**
   * The sidebar folded to its icons: the names leave, each icon keeps its name as its spoken name
   * and its tooltip, and the brand, the search and the overlines give way. The app keeps the
   * choice on the device.
   */
  collapsed?: boolean;
  /** The fold control's two names. Without them the sidebar has no fold control. */
  fold?: {
    collapse: TranslatedText;
    expand: TranslatedText;
    onToggle: () => void;
  };
  /** Sidebar width. Defaults to the `--sidebar-w` token; a number overrides it. */
  width?: number | string;
  /** The product mark and name, at the sidebar's top. */
  brand?: ReactNode;
  /** One quiet line under the brand: the company the person is in. */
  caption?: ReactNode;
  /** The one search, under the brand — present only where search exists. */
  search?: ReactNode;
}

/**
 * A `verb` item is the role's action: it runs its `onClick`, is never in view, and its label is
 * its name.
 */
export type BottomNavItem = RailItem & { verb?: boolean };

/**
 * The phone footer: one floating pill in the card colour. The item in view is an ink pill with its
 * icon and label; every other item is its icon, named by its label. The order is the caller's.
 */
export interface BottomNavProps {
  /** The pill's name, the sidebar's own: what a screen reader calls this navigation. */
  label: TranslatedText;
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
  /** The button's name — the verb it performs, "Add". It carries no words, so this is all it says. */
  label: TranslatedText;
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
