import type { ComposedMessage, TranslatedText } from '@heliogrid/contracts';
import type { Read } from '@heliogrid/domain';
import type { MessageSheetWords } from '../MessageSheet/MessageSheet.types';

/** A row's two lines, as the words chose them. */
export interface ProjectProposalLine {
  readonly title: TranslatedText;
  readonly line: TranslatedText;
}

/** The version a project runs on: its proposal's number and the version — facts, never words. */
export interface ProjectVersionInForce {
  readonly number: string;
  readonly version: number;
}

/** The project's proposal facts — `useProjectProposalRows`, by shape (this package reads no `data`). */
export interface ProjectProposalRowsView<Missing> {
  /** The version in force; `null` won with no accepted proposal; `undefined` on an older api. */
  readonly version: ProjectVersionInForce | null | undefined;
  readonly newerVersion: number | null;
  openVersions(): void;
  readonly crewDue: boolean;
  readonly crewMissing: readonly Missing[];
  readonly crew: {
    readonly open: boolean;
    openSheet(): void;
    close(): void;
    readonly message: Exclude<Read<ComposedMessage>, { readonly kind: 'empty' }>;
    share(message: ComposedMessage): void;
    copy(message: ComposedMessage): void;
  };
}

/** The rows' words, by what they say (`projectProposalRowsWords`). */
export interface ProjectProposalSectionWords<Missing> {
  versionRow(
    inForce: ProjectVersionInForce | null,
    newer: number | null,
  ): ProjectProposalLine & { readonly accepted: boolean };
  crewRow(missing: readonly Missing[]): ProjectProposalLine & { readonly ready: boolean };
}

/**
 * **What a project says of its proposal** (`T-M06-025`, `T-F5-002`), both platforms: the version it
 * runs on — or that it was won without an accepted one — and, the evening before the installation,
 * the crew message a person sends from their own chat, or the facts it still needs. Nothing here
 * sends; no delivery is claimed.
 */
export interface ProjectProposalSectionProps<Missing> {
  readonly rows: ProjectProposalRowsView<Missing>;
  readonly words: ProjectProposalSectionWords<Missing>;
  /** The crew message sheet's words — its language named the platform's way. */
  readonly sheetWords: MessageSheetWords;
  /** The installation day's sheet, where the message's missing facts are added. */
  readonly onScheduleDay: () => void;
}
