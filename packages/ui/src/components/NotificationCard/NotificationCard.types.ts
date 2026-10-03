import type { ReactNode } from 'react';

/**
 * One notification in the centre (`SCR-SHELL-03`). Every word arrives translated: `title` and
 * `body` as the record stored them (`F6-08`), the rest from `packages/i18n`. The card knows no
 * subject and opens nothing itself — the screen says what a tap does.
 */
export interface NotificationCardProps {
  /** The notification's type; it picks the glyph, and a type this build does not know gets the bell. */
  type: string;
  title: string;
  body: string;
  /** When it was emitted, already on the tenant's clock — `16:12`. */
  time: string;
  /** The word for an unread item, shown beside the time and announced; absent once read. */
  unreadLabel?: string;
  /** The whole face's name for a screen reader — the sentence `notificationCardName` writes. */
  name: string;
  /** What a tap on the face does. Absent, the face is not a control. */
  onOpen?: () => void;
  /** The one-step act, as its subject's module draws it (`F6-17`): a verb in the foot. */
  act?: ReactNode;
  /** The one-step act as an icon at the right edge — a call. A card carries `act` or this, not both. */
  sideAct?: ReactNode;
}

/**
 * Product news from the platform (`F6.4`): drawn apart from tenant work — the product's tile in
 * the glyph's place, an overline naming who speaks, and no unread mark.
 */
export interface NotificationAnnouncementProps {
  /** "From HelioGrid · product news". */
  overline: string;
  title: string;
  body: string;
  time: string;
  name: string;
  onOpen?: () => void;
  act?: ReactNode;
}

/** One member of a group: its own record and its own link (`F6-12`). */
export interface NotificationMemberProps {
  id: string;
  title: string;
  /** The body and the time, one line — `Opened 15:48 · Nashik MIDC, Nashik`. */
  line: string;
  unreadLabel?: string;
  name: string;
  onOpen?: () => void;
  /** An icon act only: a member row has no width for a verb. */
  sideAct?: ReactNode;
}

/**
 * Two or more of one type, on one subject kind, on one day (`F6-12`). The group is not a link —
 * it has no subject of its own; its members carry the links.
 */
export interface NotificationGroupProps {
  type: string;
  /** "3 proposals opened". */
  sentence: string;
  /** "15:48 latest". */
  latest: string;
  /** "2 unread", or absent when every member is read. */
  unreadLabel?: string;
  open: boolean;
  onToggle: () => void;
  /** "Show these 3" / "Hide these 3", by `open`. */
  toggleLabel: string;
  members: readonly NotificationMemberProps[];
}

/**
 * The honest landing (`F6-16`'s edge): the reader opened an item whose subject they can no longer
 * see. It names nobody and no date — only that the record is out of reach, and the way back.
 */
export interface NotificationLandingProps {
  title: string;
  message: string;
  backLabel: string;
  onBack: () => void;
}

/** A card in the list, as its words arrived; `item` is what a tap hands back. */
export type NotificationListCard<T> = { kind: 'card'; item: T } & Omit<
  NotificationCardProps,
  'onOpen' | 'act' | 'sideAct'
>;

export type NotificationListAnnouncement<T> = { kind: 'announcement'; item: T } & Omit<
  NotificationAnnouncementProps,
  'onOpen' | 'act'
>;

export interface NotificationListGroup<T> {
  kind: 'group';
  key: string;
  type: string;
  sentence: string;
  latest: string;
  unreadLabel?: string;
  /** "Show these 3" and "Hide these 3": the list holds whether the group is open. */
  showLabel: string;
  hideLabel: string;
  members: readonly ({ item: T } & Omit<NotificationMemberProps, 'onOpen' | 'sideAct'>)[];
}

export type NotificationListRow<T> =
  | NotificationListCard<T>
  | NotificationListAnnouncement<T>
  | NotificationListGroup<T>;

/** One of the tenant's days: its overline and its rows, newest first. */
export interface NotificationListDay<T> {
  /** The day itself, `YYYY-MM-DD` — its key. */
  date: string;
  label: string;
  rows: readonly NotificationListRow<T>[];
}

/**
 * The centre's list (`SCR-SHELL-03`), both platforms: the days, their rows, then the tail — Show
 * older while older matches remain, else the horizon sentence (`F6-19`). Every word arrives
 * translated; the list holds only which groups are open.
 */
export interface NotificationListProps<T> {
  days: readonly NotificationListDay<T>[];
  /** A card, an announcement or a group's member was tapped. */
  onOpen: (item: T) => void;
  /** "Show older" — present while older matches remain; absent, the horizon shows instead. */
  olderLabel?: string;
  onShowOlder?: () => void;
  loadingOlder?: boolean;
  /** "Couldn't load older notifications. Try again." — shown over Show older when a page failed. */
  olderFailed?: string;
  /** "The centre keeps the last 30 days. It is an inbox, not an archive …" */
  horizon: string;
}

/**
 * The centre's head (`SCR-SHELL-03`): one count line and, at its right end, Mark all read as a
 * check-check icon — the same at both widths. The head scrolls away with the list.
 */
export interface NotificationHeadProps {
  /** "7 unread · 46 in the last 30 days" — a tally of the reader's records, no tier (`F8-01`). */
  count: string;
  /** "Mark all 7 unread notifications read". Absent while nothing unread is listed (`F4-27`). */
  markAllName?: string;
  onMarkAll?: () => void;
  /** Mark all read is on its way; a press now sends nothing. */
  marking?: boolean;
}

/**
 * The centre's filter bar (`SCR-SHELL-03`), pinned above the list: an Unread toggle, a hairline,
 * then one button per type group. A button is its icon; switched on it turns dark and its name
 * slides out. One group is open at a time — the bar holds no rule but that one.
 */
export interface NotificationFilterBarProps {
  /** The toolbar's name — "Filter notifications". */
  label: string;
  unread: { label: string; name: string };
  unreadOn: boolean;
  onUnread: (on: boolean) => void;
  groups: readonly { value: string; label: string }[];
  /** The open group, or null for every group. */
  openGroup: string | null;
  onGroup: (value: string | null) => void;
}
