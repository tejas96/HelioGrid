import type { TranslatedText } from '@heliogrid/contracts';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/**
 * *New proposal* (`M06-05`, `M06-19`, `T-M06-001`): two option cards — Quick, four steps, and Full,
 * eleven — then *or start from* with the person's recent proposals. Quick is picked first for a
 * home lead and Full for any other; one tap changes it. No path question is asked while no studio
 * exists: a question with one answer is a wasted tap.
 */

export type StartMode = 'quick' | 'full';

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
