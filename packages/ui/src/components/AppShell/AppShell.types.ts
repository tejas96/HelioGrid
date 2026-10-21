import type { ReactNode } from 'react';
import type { ShellGlyphName } from './ShellGlyph.shapes';

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
  /** The whole name, its count included, in the reader's language. Absent, label and count join. */
  name?: string;
  onClick?: () => void;
  active?: boolean;
  /**
   * The 44 grey circle — the phone header's search and bell, and the avatar's button. Without it
   * the button is transparent at `--r-md`, as on the desktop header.
   */
  round?: boolean;
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
  /**
   * The tenant's company name — plain words after the mark, bold, one line, cut by an ellipsis.
   * Not a control: V1 has no company switcher (`T-SHELL-001`), and a grey chip reads as one.
   */
  company?: string;
  /** The Search button's name, in the reader's language — the bar holds no English of its own. */
  searchLabel: string;
  /** The bell's name, in the reader's language; the unread count is added to it. */
  notificationsLabel: string;
  /** The bell's whole name with its count — "Notifications, 3 unread" — when the caller words it. */
  notificationsName?: string;
  /** The product mark. Defaults to the 32 `LogoTile`. */
  brand?: ReactNode;
  /** Opens the global search door — the phone's half of `F6-20`. */
  onSearchClick?: () => void;
  /** The `JobTray`, before the bell. */
  jobs?: ReactNode;
  /** Unread count, read from the record (`F6-17`). */
  notifications?: number | boolean;
  onNotificationsClick?: () => void;
  /** The 44 avatar. */
  avatar?: ReactNode;
  /** Back button or menu, before the mark. */
  leading?: ReactNode;
  /**
   * A page opened from a list (`SCR-M01-05`, `m-settings`): its title, after `leading`, in place of
   * the product tile and the company — the bar shows its way back and its title. It wraps rather
   * than cuts, so a longer language keeps every word.
   */
  title?: string;
  /** Extra round `ShellAction`s. */
  actions?: ReactNode;
  /**
   * Keep the bar below a centred camera. The device's own inset decides how far: the web half pads
   * `env(safe-area-inset-top)`; on the phone the app's safe area already holds the bar below it, so
   * the native half takes no inset of its own.
   */
  safeTop?: boolean;
  sticky?: boolean;
  /** Content has scrolled under the bar: it lifts on `--e2`, so the two never read as overlapped. */
  scrolled?: boolean;
}

export type { ShellGlyphName };

export type ShellGlyphSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ShellGlyphProps {
  name: ShellGlyphName;
  /** The filled form, for the pill's item in view only (`F7-19`). Outlined otherwise. */
  filled?: boolean;
  /**
   * `lg` (24) on the pill, `md` (20) in a menu, `xl` (32) on a full-screen state, `sm` (16) in a
   * row act's `Button`. The stroke follows the size (`glyphStroke`).
   */
  size?: ShellGlyphSize;
  /**
   * `secondary` at rest, `inverse` on the near-black pill, `primary` on a state's mark and in a
   * round shell button, `accent` in a settings row's icon circle (`SCR-SHELL-01`, *More*), `danger`
   * on a `Button` whose `tone` is `danger`, so the glyph matches its words, `info` in an info icon
   * circle (`SCR-M01-06`'s demo door).
   */
  tone?: 'primary' | 'secondary' | 'inverse' | 'accent' | 'info' | 'danger';
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
