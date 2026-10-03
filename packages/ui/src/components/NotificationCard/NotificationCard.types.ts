import type { ReactNode } from 'react';
import type { ProvenanceProps } from '../Provenance/Provenance.types';

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
  /** How the count was arrived at (`F8`): derived, from the records. */
  provenance: ProvenanceProps;
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
