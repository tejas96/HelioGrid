import type { TranslatedText } from '@heliogrid/contracts';
import type {
  Read,
  RolePreset,
  TeamAct,
  TeamList,
  TeamRow,
  TeamStatusFilter,
} from '@heliogrid/domain';
import type { ReactNode, Ref } from 'react';
import type { FocusAfter, FocusHandle } from '../../primitives/FocusAfter';
import type { AvatarMark, CategoryHue } from '../Avatar/Avatar.types';

/** One preset a person holds, worded, in its kind's iris tone (design-system change 7). */
export interface MemberRole {
  label: TranslatedText;
  tone: CategoryHue;
}

/** An open invite's seven days: the bar, *Day N of 7* and *Expires <date>*. */
export interface MemberInvite {
  /** 0–100, the share of the seven days gone. */
  progress: number;
  day: string;
  expires: string;
}

/**
 * **What a team row says of its person** (`SCR-M01-12`): the face with the status dot, the name with
 * *You* beside it for the reader, the status line, every preset held as a badge that wraps whole,
 * and an open invite's day of seven. Every word is the caller's.
 */
export interface MemberFacts {
  name: string;
  mark: AvatarMark;
  /** The reader's own card: the words of the badge beside the name. */
  youLabel?: TranslatedText;
  line: TranslatedText;
  /** In F2's order, every one held — never capped (F2-10). */
  roles: MemberRole[];
  invite?: MemberInvite;
}

/**
 * **A person on the team, one row of the list's glass card** (`SCR-M01-12`, direction A): their
 * facts, and the row's one act at its end, outside the target that opens the person.
 */
export interface MemberRowProps extends MemberFacts {
  /** The row's one act, at its end — the caller's `MemberAct`. */
  action?: ReactNode;
  /** The whole row opens the person; an invite and a deactivated row take none. */
  onOpen?: () => void;
  /** The first row draws no hairline above it. */
  first: boolean;
}

/** The placeholder rows a team list shows while its read is out (`SCR-M01-12`, `m-loading`). */
export interface MemberRowsLoadingProps {
  /** Required words — what is loading. A busy region with no name tells a screen reader nothing. */
  label: TranslatedText;
}

/** The list's words, every one the caller's (`@heliogrid/i18n`'s `TEAM`). */
/** A row's words, as `@heliogrid/i18n`'s `teamRowWords` gives them — the caller's, never this package's. */
export interface MemberRowWords {
  readonly line: TranslatedText;
  readonly day: TranslatedText | null;
  readonly expires: TranslatedText | null;
}

export interface MemberListWords {
  /** The list's accessible name — *Everyone at <company>*. */
  label: TranslatedText;
  loading: TranslatedText;
  loadFailed: TranslatedText;
  tryAgain: TranslatedText;
  alone: TranslatedText;
  aloneLine: TranslatedText;
  /** *No one matches "<text>"*, already worded with the search. */
  noMatch: TranslatedText;
  clearSearch: TranslatedText;
  /** What the chosen Status chip says with nobody under it; null under *All*. */
  emptyChip: TranslatedText | null;
  showAll: TranslatedText;
  /** The reader's badge — *You*. */
  you: TranslatedText;
  /** One row's line and invite words (`@heliogrid/i18n`'s `teamRowWords`). */
  row(row: TeamRow): MemberRowWords;
  /** A preset's name, in the reader's words. */
  role(preset: RolePreset): TranslatedText;
}

/**
 * **A team list's body** (`SCR-M01-12`): the placeholder rows, the failure with *Try again*, the
 * reader's own row with the teaching state, the empty state for a search with no match, or the
 * rows in one glass card. Drawn by the phone and by the web below the table's width from this one contract. A wide
 * web page hands its table in `records` and its table's loading in `waiting`, so the states around
 * them stay this component's.
 */
export interface MemberListProps {
  /**
   * The list's read: its wait, its failure with *Try again*, then the rows in view in the list's
   * order — each through `memberFactsOf` — drawn as `@heliogrid/domain`'s `teamSurface` says.
   */
  read: Read<TeamList>;
  words: MemberListWords;
  /** Where focus lands once *Try again* has left with the failure — the list's search, which the
   *  wait that follows draws again. */
  focusAfter: FocusAfter;
  onClearSearch: () => void;
  /** Back to *All* from a Status chip with nobody under it. */
  onShowAll: () => void;
  /** Drawn in place of the rows — a wide page's table. */
  records?: ReactNode;
  /** Drawn in place of the placeholder rows — a wide page's table loading. */
  waiting?: ReactNode;
  /** A row's one act at its end — the caller's `MemberAct`, or nothing for a row with none. */
  actOf?: (row: TeamRow) => ReactNode;
  /** A row's open — the whole row; undefined for a row that opens nothing (Assign Roles opens an active person only). */
  openOf?: (row: TeamRow) => (() => void) | undefined;
  /** The teaching state's act under its words — *Invite your first teammate* (`SCR-M01-12` m-teaching). */
  teachingAction?: ReactNode;
}

/**
 * **A person in the team table's first cell**, as OneOhm draws one: the face, the name with *You*
 * beside it for the viewer, and the phone number under it in the quiet mono face. The status has
 * its own column.
 */
export interface MemberPersonProps {
  name: string;
  youLabel?: TranslatedText;
  /** The person's phone number, grouped for the market — a fact, shown as given. */
  phone: string;
}

/**
 * **A row's one act** (`SCR-M01-12`): *Deactivate* quiet danger words, *Revoke invite* quiet
 * words, *Invite again* the filled pill, each with its glyph (`MEMBER_ACT_LOOK`), at `sm` — at a
 * row's end and in the 1536 table's last cell alike.
 */
export interface MemberActProps {
  act: TeamAct;
  label: TranslatedText;
  /** Why the act cannot run — the only EPC Owner's own *Deactivate*; opens in the reason bubble. */
  offReason?: TranslatedText;
  /** The act's write is out. */
  busy?: boolean;
  /** What a screen reader hears — the act's words, then the person (D291). */
  spokenName: TranslatedText;
  onPress: () => void;
  /** Lets the caller send focus back to this act when a confirm it opened closes. */
  ref?: Ref<FocusHandle>;
}

/**
 * **The confirm a Team act opens** (`SCR-M01-12`, m-deactivate, m-revoke, m-refused): a sheet at
 * 375 and a centred modal at 1536, a decision — not dismissible, no close button. On the refused
 * form the banner says what stopped it and the go button is off with its reason. The `roles` look
 * is Assign Roles' removal (`SCR-M01-13` m-confirm, d-confirm): a handle on the sheet, a `md`
 * modal with no tone, and the way back as a second line under the body.
 */
export interface TeamConfirmProps {
  /** What the open confirm says; null while it is shut. The last words stay while it closes. */
  words: TeamConfirmWords | null;
  /** `act` — a Team row act, as `SCR-M01-12` draws it (the default) · `roles` — a roles removal. */
  look?: 'act' | 'roles';
  busy: boolean;
  onGo: () => void;
  /** *Cancel*, or *Close* on the refused form. */
  onLeave: () => void;
}

/** A confirm's words: its question and act, then what the act does or the refusal (`@heliogrid/i18n`). */
export interface TeamConfirmWords {
  /** *Deactivate Anjali Kulkarni?* */
  title: TranslatedText;
  go: TranslatedText;
  /** *Cancel*, or *Close* on the refused form. */
  leave: TranslatedText;
  /** What the act does; the refused form shows its banner instead. */
  body?: TranslatedText;
  /** The refused form: what stopped it, and who changed when exactly one person did. */
  refusal?: { title: TranslatedText; body: TranslatedText | null };
  /** The go button is off, and why — the refused form's route out. */
  goOffReason?: TranslatedText;
  /** The way back, under the body: a bold lead, then the rest of the sentence. */
  note?: { lead: TranslatedText; rest: TranslatedText };
}

/**
 * **A team list's head** (`SCR-M01-12`): *Find in this list* and the Status chips with their counts,
 * held at the top while the list scrolls. Both screens draw it from this one contract; every word is
 * the caller's.
 */
export interface MemberListHeadProps {
  query: string;
  onFind: (query: string) => void;
  status: TeamStatusFilter;
  onFilter: (status: TeamStatusFilter) => void;
  /** Each chip's count; absent while the list's read is out. */
  counts?: Readonly<Record<TeamStatusFilter, number>>;
  words: {
    find: TranslatedText;
    /** The search's clear button, spoken — *Clear search*. */
    clearSearch: TranslatedText;
    statusFilter: TranslatedText;
    statusOptions: { value: TeamStatusFilter; label: TranslatedText }[];
  };
  /**
   * At the table's width the search and the chips share a line and the chips wrap. A phone never
   * reaches that width, so it always draws the narrow form: search, then one sideways row of chips.
   */
  wide?: boolean;
  /** Where the caller sends focus once a search is cleared. */
  searchRef?: Ref<FocusHandle>;
  /** Where the caller sends focus once *Show all* chooses *All*. */
  chipsRef?: Ref<FocusHandle>;
}
