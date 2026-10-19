import type { RolePreset, TeamRow, TeamSurface } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { AvatarMark, IrisHue } from '../Avatar/Avatar.types';

/** One preset a person holds, worded, in its kind's iris tone (design-system change 7). */
export interface MemberRole {
  label: string;
  tone: IrisHue;
}

/** An open invite's seven days: the bar, *Day N of 7* and *Expires <date>*. */
export interface MemberInvite {
  /** 0–100, the share of the seven days gone. */
  progress: number;
  day: string;
  expires: string;
}

/**
 * **A person on the team, on a phone** (`SCR-M01-12`, the 375 card): the face with the status dot,
 * the name with *You* beside it for the reader, the status line, every preset held as a badge that
 * wraps whole, an open invite's day of seven, and the one act. Drawn by both apps from this one
 * contract (`.claude/rules/screen-parts.md`); it is a `RecordCard` in its `stacked` layout, so it
 * adds no look of its own. Every word is the caller's.
 */
export interface MemberCardProps {
  name: string;
  mark: AvatarMark;
  /** The reader's own card: the words of the badge beside the name. */
  youLabel?: string;
  line: string;
  /** In F2's order, every one held — never capped (F2-10). */
  roles: MemberRole[];
  invite?: MemberInvite;
  /** The card's one act, full width at its foot. */
  action?: ReactNode;
  /** The whole card opens the person; an invite and a deactivated card take none. */
  onOpen?: () => void;
}

/** The three placeholder cards a team list shows while its read is out (`SCR-M01-12`, `m-loading`). */
export interface MemberCardsLoadingProps {
  /** Required words — what is loading. A busy region with no name tells a screen reader nothing. */
  label: string;
}

/** The list's words, every one the caller's (`@heliogrid/i18n`'s `TEAM`). */
/** A row's words, as `@heliogrid/i18n`'s `teamRowWords` gives them — the caller's, never this package's. */
export interface MemberRowWords {
  readonly line: string;
  readonly day: string | null;
  readonly expires: string | null;
}

export interface MemberListWords {
  /** The list's accessible name — *Everyone at <company>*. */
  label: string;
  loading: string;
  loadFailed: string;
  tryAgain: string;
  alone: string;
  aloneLine: string;
  /** *No one matches "<text>"*, already worded with the search. */
  noMatch: string;
  clearSearch: string;
  /** What the chosen Status chip says with nobody under it; null under *All*. */
  emptyChip: string | null;
  showAll: string;
  /** The reader's badge — *You*. */
  you: string;
  /** One row's line and invite words (`@heliogrid/i18n`'s `teamRowWords`). */
  row(row: TeamRow): MemberRowWords;
  /** A preset's name, in the reader's words. */
  role(preset: RolePreset): string;
}

/**
 * **A team list's body** (`SCR-M01-12`): the placeholder cards, the failure with *Try again*, the
 * reader's own card with the teaching state, the empty state for a search with no match, or the
 * cards. Drawn by the phone and by the web below the table's width from this one contract. A wide
 * web page hands its table in `records` and its table's loading in `waiting`, so the states around
 * them stay this component's.
 */
export interface MemberListProps {
  /** Which body to show — `@heliogrid/domain`'s `teamSurface`. */
  surface: TeamSurface;
  /** The rows in view, in the list's order; each becomes a card through `memberCardOf`. */
  rows: readonly TeamRow[];
  words: MemberListWords;
  onRetry: () => void;
  onClearSearch: () => void;
  /** Back to *All* from a Status chip with nobody under it. */
  onShowAll: () => void;
  /** Drawn in place of the cards — a wide page's table. */
  records?: ReactNode;
  /** Drawn in place of the placeholder cards — a wide page's table loading. */
  waiting?: ReactNode;
}

/**
 * **A person in the team table's first cell** (`SCR-M01-12`, `d-default`): a 40px face, the name
 * with *You* beside it for the reader, and the status chip under the name.
 */
export interface MemberPersonProps {
  name: string;
  youLabel?: string;
  /** The status in words — the chip carries a word as well as its tone. */
  status: string;
  tone: AvatarMark;
}
