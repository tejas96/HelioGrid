import type { TranslatedText } from '@heliogrid/contracts';
import type { Ref } from 'react';
import type { FocusAfter, FocusHandle } from '../../primitives/FocusAfter';
import type { StatusTone } from '../../primitives/StatusMark';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';

/** The rows' own words: how a row is opened, and the name a customer without one reads as. */
export interface ProjectRowsWords {
  readonly open: (name: string) => TranslatedText;
  readonly noName: TranslatedText;
}

/** A state a row carries, as glyph, word and tint — never the tint alone. */
export interface ProjectRowMark {
  readonly tone: StatusTone;
  readonly label: TranslatedText;
}

/**
 * The tint of a kind tile: a promise passed is a problem, a gap a warning, a proof come early the
 * system's own good news (the teal hue), nothing waiting a success.
 */
export type ProjectRowTint = 'danger' | 'warning' | 'success' | 'teal';

/**
 * What a row or a group is about, as a glyph on its tint — a to-do's kind, a waited-on party.
 * Decorative: the words beside it say the same.
 */
export interface ProjectRowKind {
  readonly glyph: ShellGlyphName;
  readonly tint: ProjectRowTint;
}

/** A row's one act, beside the open target (`CardRow`'s `aside`). */
export interface ProjectRowAct {
  readonly label: TranslatedText;
  /** The act with the project it acts on, as a screen reader says it. */
  readonly spoken: TranslatedText;
  readonly primary: boolean;
  readonly onPress: () => void;
}

/**
 * One project in a list (`SCR-M08-01`): its kind tile when it asks something, the customer, a line
 * of what it is, the state it carries, its days figure — the honest number, never a % (`M08-12`) —
 * and at its end its manager, its one act, or a chevron when it only opens.
 */
export interface ProjectRowProps {
  readonly first: boolean;
  readonly name: string | null;
  /** What the project is — its place and install, or its wait; null with nothing to say. */
  readonly line: TranslatedText | null;
  readonly kind: ProjectRowKind | null;
  readonly mark: ProjectRowMark | null;
  /** The days figure, worded — "34 days", "today". */
  readonly days: TranslatedText | null;
  /** The manager's name: drawn as their face, the name its spoken label. */
  readonly manager: string | null;
  readonly act: ProjectRowAct | null;
  /** A chevron at the end: the row's only move is to open its project. */
  readonly chevron: boolean;
  readonly highlighted?: boolean;
  /** The open target's focus handle: the first row *Show more* lets in takes the focus. */
  readonly targetRef?: Ref<FocusHandle>;
  readonly onOpen: () => void;
  readonly words: ProjectRowsWords;
}

/** The head of a group of rows inside one card: what the rows below share, and how many. */
export interface ProjectRowGroupProps {
  readonly first: boolean;
  readonly kind: ProjectRowKind;
  /** The overline — *Waiting on DISCOM*. */
  readonly label: TranslatedText;
  readonly count: number;
}

/** The card's last line: *Show 4 more*, which lets the held-back rows in. */
export interface ProjectRowMoreProps {
  readonly label: TranslatedText;
  readonly onPress: () => void;
  /** It leaves once pressed: focus lands on the first row it let in. */
  readonly focusAfter: FocusAfter;
}

/** One entry of a card of project rows: a project, the head of the group below it, or *Show more*. */
export type ProjectRowItem =
  | { readonly kind: 'row'; readonly key: string; readonly row: ProjectRowProps }
  | { readonly kind: 'group'; readonly key: string; readonly group: ProjectRowGroupProps }
  | { readonly kind: 'more'; readonly key: string; readonly more: ProjectRowMoreProps };

/** One card of project rows — each group's head above its own rows. */
export interface ProjectRowListProps {
  readonly items: readonly ProjectRowItem[];
}
