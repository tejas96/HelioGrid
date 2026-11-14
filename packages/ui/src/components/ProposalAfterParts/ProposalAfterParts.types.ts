import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { ShellGlyphName } from '../AppShell/ShellGlyph.shapes';
import type { HueTileProps } from '../HueTile/HueTile.types';

/**
 * The small parts the proposal's after-build screens share (block 8): a quiet hint line, a
 * label-and-value summary, a row that opens something, and the composed message as a bubble. Each
 * is drawn once here, so Track, Versions, Links and their sheets cannot drift apart.
 */

/** A quiet line with its mark — what the screen will not do, or what happens next. */
export interface AfterHintProps {
  readonly glyph?: ShellGlyphName;
  readonly children: TranslatedText;
}

/** One fact of a summary: what it is, and its value as the caller printed it. */
export interface AfterSummaryRow {
  readonly label: TranslatedText;
  /** A figure, a name or words — already in the reader's form. */
  readonly value: string;
  /** A figure: set in the mono face. */
  readonly mono?: boolean;
  /** A figure after words in one value — "3 kW · ₹2,05,000": the words in the UI face, this in mono. */
  readonly figure?: string;
}

/** A sheet's summary: its facts one under the other, the value at the row's end. */
export interface AfterSummaryProps {
  readonly rows: readonly AfterSummaryRow[];
}

/** One row of a screen's rows card: a tile, a title and a line; it opens something, or just says. */
export interface AfterRowProps {
  /** The row's tile; absent, the row opens on its words (a plan part). */
  readonly glyph?: ShellGlyphName;
  readonly hue?: HueTileProps['hue'];
  // biome-ignore lint/plugin/copy-prop-type: a title may be a task's own words or a record's name, a fact
  readonly title: string;
  readonly line?: TranslatedText;
  /** Opens the row's record. Absent, the row is plain words. */
  readonly onOpen?: () => void;
  /** An act at the row's end, in place of the chevron. */
  readonly aside?: ReactNode;
  /** What stands where the tile would: a version's mark. */
  readonly leading?: ReactNode;
}

/** The rows, in one card with a hairline between two. */
export interface AfterRowsProps {
  readonly children: ReactNode;
}

/**
 * The composed message as a chat bubble (`M06-53`, `F5-48`, `F5-68`): the words a person will send,
 * exactly as written, and a note that they were written for them. It claims no send.
 */
export interface MessageBubbleProps {
  /** The message, as composed in the customer's language: shown as sent, line breaks kept. */
  readonly text: string;
  /** The link inside the text, set apart; absent where the message carries none. */
  readonly link?: string | null;
  /** Where the link goes before the first share has made one — "The link is added when you share". */
  readonly linkToCome?: TranslatedText;
  readonly note: TranslatedText;
  /** The bubble's spoken name — "The message". */
  readonly name: TranslatedText;
}
