import type { ReactNode } from 'react';

/**
 * Which semantic pair the pill uses. The numeral is **words**, so the fill is the `-bg` tint and
 * the digits the `-text` partner — never the plain mark token, which no tone clears 4.5:1 against
 * white. Measured, fill vs digits: danger 5.79, warning 6.53, success 5.96, info 5.65, neutral
 * 6.03, accent 4.65.
 */
export type CountBadgeTone = 'danger' | 'accent' | 'warning' | 'info' | 'success' | 'neutral';

export interface CountBadgeProps {
  /**
   * The number of unread items, read **from the record** (`F6-17`) — never from push state, so it
   * always matches the list it opens. `true` falls back to a bare dot for the rare case where a
   * count genuinely isn't known; prefer a number.
   */
  count?: number | boolean;
  /** Above this it reads "99+". Default 99. */
  max?: number;
  /**
   * The NOUN only — "notifications", "alerts" — used to build **this badge's own** screen-reader
   * text, "3 unread notifications". On every call site in this system that text is never
   * announced: `RailButton`, `NavItem` and `ShellAction` each put `aria-label="Notifications, 7
   * unread"` on the host button, and an `aria-label` wins over element contents. `label` therefore
   * matters only for a `CountBadge` mounted **outside** a labelled host. Never write the count
   * into it: the number comes from `count`, and both spellings say it once.
   */
  label?: string;
  tone?: CountBadgeTone;
}

export interface ShellActionProps {
  label: string;
  icon?: ReactNode;
  /** A count (or `true`) rides the corner as a `CountBadge`. */
  badge?: number | boolean;
  onClick?: () => void;
  active?: boolean;
}

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  /**
   * The **product** mark. **Omit it when an `AppRail` is showing the mark** — the rail and the
   * header are one shell, and drawing the tile in both puts the logo on screen twice. Use it when
   * there is no rail: a phone, a focused flow, a settings shell.
   */
  brand?: ReactNode;
  /**
   * The **tenant's** identity — a `TenantMark` (`MS12-19`). The other half of the pair, and a
   * different job: the product mark says which application this is, the tenant mark says whose.
   * Pass it even when `brand` is omitted, which is the desktop case — the rail carries the product
   * mark and the header carries the tenant's, so the top bar is never identity-less.
   */
  tenant?: ReactNode;
  /** The **global** search box (`F6-20`) — one box, in the shell. A list filter is not this. */
  search?: ReactNode;
  actions?: ReactNode;
  /**
   * **Work the person walked away from** — a `JobTray`. It lives in the shell because that is the
   * only layer that outlives the screen which started it (`M02-21`). Rendered **before** the bell:
   * the bell says something happened while you were elsewhere, the tray says something is still
   * happening while you are elsewhere.
   */
  jobs?: ReactNode;
  /** Unread count for the bell. Read from the record. */
  notifications?: number | boolean;
  onNotificationsClick?: () => void;
  avatar?: ReactNode;
  breadcrumb?: ReactNode;
  sticky?: boolean;
}

export interface MobileTopBarProps {
  title?: string;
  /** The product mark. The phone has no rail, so **this** is where it rides. */
  brand?: ReactNode;
  /** The tenant's `TenantMark`. With a title present pass `showName={false}` — one set of words. */
  tenant?: ReactNode;
  /** Opens the global search sheet — the phone's half of `F6-20`. */
  onSearchClick?: () => void;
  /** The `JobTray`, same slot and same position as on the desktop header. */
  jobs?: ReactNode;
  notifications?: number | boolean;
  onNotificationsClick?: () => void;
  avatar?: ReactNode;
  /** Back button or menu, before the title. */
  leading?: ReactNode;
  actions?: ReactNode;
  sticky?: boolean;
}

export interface AppShellProps {
  /** `<AppRail />`. */
  rail?: ReactNode;
  /** `<AppHeader />`. */
  header?: ReactNode;
  children?: ReactNode;
}

/** `badge != null && badge !== false` — the render test, which lets 0 through to CountBadge. */
export function showsBadge(badge: number | boolean | undefined): boolean {
  return badge !== undefined && badge !== false;
}

/**
 * The accessible name belongs to the HOST, not the badge: "Notifications, 7 unread". Never write
 * the count into the label — one declaration so the rail, the nav item and the shell button all
 * say it the same way.
 */
export function badgeName(label: string, badge: number | boolean | undefined): string {
  if (!showsBadge(badge)) {
    return label;
  }
  return typeof badge === 'number' ? `${label}, ${badge} unread` : `${label}, unread`;
}
