import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { OverlayCloseWords } from '../Sheet/OverlayClose.types';

/**
 * The check before Generate (`M06-22`, `M06-23`, `M06-36`, `T-M06-022`): one sheet over the builder,
 * and the one place a proposal is validated. Blocked — every failure a row that opens its step, and
 * the main button goes to the first; never a dead Generate. Warnings sit under them, each with both
 * its figures, and never block. Clear — what is about to be generated, then Generate.
 */

/** One finding: what is wrong, in words that carry both figures, and the step that fixes it. */
export interface CheckFinding {
  readonly key: string;
  readonly title: TranslatedText;
  /** The fix, and for a block the step it is on — `Pick at least one · Components`. */
  readonly line: TranslatedText;
  readonly onFix: () => void;
}

/** What is about to be generated. */
export interface CheckSummary {
  /** The cover, small — a `ScaledProposalPage`. */
  readonly cover: ReactNode;
  /** A fact: the customer's name */
  readonly name: string;
  /** `3 kW · ₹1,90,575`, the amount standing as `FIGURE_SLOT` where the words put it. */
  readonly line: TranslatedText;
  /** The server's amount, set in the money face in the line's slot (§9). */
  readonly amount: string;
  /** `9 pages · English · version 1`. */
  readonly facts: TranslatedText;
}

/**
 * What changed and why (`M06-42`): asked from version 2 on, typed here, kept with the version. The
 * caller says when it is still owed (`error`) — Generate then waits on the person, never on a dead
 * button.
 */
export interface CheckChangeNote {
  readonly label: TranslatedText;
  readonly hint: TranslatedText;
  /** A fact: the person's own words, as typed. */
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly maxLength: number;
  readonly error?: TranslatedText;
}

export type ProposalCheckState =
  /** The verdict is being read. */
  | { readonly kind: 'checking' }
  | {
      readonly kind: 'blocked';
      readonly blocks: readonly CheckFinding[];
      readonly warnings: readonly CheckFinding[];
    }
  | {
      readonly kind: 'clear';
      readonly warnings: readonly CheckFinding[];
      readonly summary: CheckSummary;
      /** Absent for a first version, which carries no note. */
      readonly changeNote?: CheckChangeNote;
      /** Generate is out: the sheet waits, shows the travelling line, and a second press sends nothing. */
      readonly generating: boolean;
      /** Why Generate did not finish; the draft is as it was. */
      readonly failure?: TranslatedText;
      readonly onGenerate: () => void;
    }
  /** The plan's count for the cycle is used (`M06-26`, `T-M06-028`); the draft stays saved. */
  | { readonly kind: 'limit'; readonly onPlans?: () => void };

export interface ProposalCheckWords extends OverlayCloseWords {
  /** The sheet's title for its state — `Fix 2 things first`, `Ready to generate` … */
  readonly title: TranslatedText;
  /** `Then check · 2` under the blocks, `To check · 2` where nothing blocks. */
  readonly warningsOver: TranslatedText;
  /** `Go to Components` — the first block's step. */
  readonly goToFirst: TranslatedText;
  readonly generate: TranslatedText;
  readonly generateAnyway: TranslatedText;
  /** The line under the act, for the state. */
  readonly note: TranslatedText;
  /** The wait, spoken — `Generating`. */
  readonly generating: TranslatedText;
  /** What Quick mode filled from the company's defaults; absent outside Quick mode. */
  readonly quickLine?: TranslatedText;
  readonly checking: TranslatedText;
  /** The plan limit: the count used and when it starts again, what still works, and who can change the plan. */
  readonly limit: {
    readonly used: TranslatedText;
    readonly resets: TranslatedText;
    readonly stillWorks: TranslatedText;
    readonly works: readonly TranslatedText[];
    readonly who: TranslatedText;
    readonly seePlans: TranslatedText;
    readonly close: TranslatedText;
  };
}

export interface ProposalCheckSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly words: ProposalCheckWords;
  readonly state: ProposalCheckState;
}
