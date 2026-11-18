import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalStartMode } from '@heliogrid/domain';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/**
 * *New proposal* (`M06-05`, `M06-19`, `T-M06-001`, `T-M05-001b`): option cards — Quick, four steps;
 * Full, eleven; and With 3D design, for who may design — then *or start from* with the person's
 * recent proposals. Quick is picked first for a home lead and Full for any other; one tap changes
 * it.
 */

export type StartMode = ProposalStartMode;

/** One of the person's recent proposals, to start from: every step arrives filled. */
export interface StartSource {
  readonly id: string;
  /** `Same as Meena Deshpande`. */
  readonly title: TranslatedText;
  /** `5 kW · ₹3,10,000 · sent 4 days ago` — the server's figures, in the reader's words. */
  readonly line: TranslatedText;
}

export interface ProposalStartWords extends OverlayCloseWords {
  readonly title: TranslatedText;
  readonly how: TranslatedText;
  readonly modes: Readonly<
    Record<StartMode, { readonly title: TranslatedText; readonly line: TranslatedText }>
  >;
  /** Where *With 3D design* will show a model: the placeholder until the studio draws one. */
  readonly designPreview: TranslatedText;
  /** `or start from`. */
  readonly or: TranslatedText;
  /** A copy brings every step filled; the customer's details come from this lead. */
  readonly copyLine: TranslatedText;
  readonly start: TranslatedText;
  readonly loading: TranslatedText;
}

export interface ProposalStartSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: ProposalStartWords;
  readonly mode: StartMode;
  readonly onMode: (mode: StartMode) => void;
  /** The reader may design (`studio.create_edit_designs`): *With 3D design* is offered. */
  readonly canDesign: boolean;
  /** The recent proposals; `null` while they are read, empty where there is none. */
  readonly sources: readonly StartSource[] | null;
  /** Starts a copy of one of them on this lead. */
  readonly onCopy: (id: string) => void;
  readonly onStart: () => void;
  /** The start is out: the sheet waits, and a second press sends nothing. */
  readonly starting: boolean;
  /** Why the start was refused — a closed lead reads *Reopen the lead to make a proposal*. */
  readonly failure?: TranslatedText | null;
}
