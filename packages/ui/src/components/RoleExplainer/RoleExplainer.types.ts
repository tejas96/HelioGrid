import type { RoleCardState, RoleCardWords } from '../RoleCard/RoleCard.types';

/** Every word the screen draws, already translated: `@heliogrid/i18n`'s `roleCardWords`. */
export interface RoleExplainerWords extends RoleCardWords {
  /** *Your role at …*, the screen's heading. */
  readonly title: string;
  /** The one act, named for the home it opens (*Go to my day*). */
  readonly act: string;
  /** The line under the act: where the card opens again, or the home one switch away. */
  readonly atAct: string;
}

/**
 * The role card's first-run life (`SCR-M01-10` m-first-run, d-first-run): the step after First-Run
 * Profile, or after a join that owed no name. The heading, the card bounded to the window — its
 * head stays and its rows scroll — and one act to the home the roles decide. No shell, no back. At
 * 375 one column; from the door's breakpoint the onboarding two panes, the heading in the brand
 * pane and the card and its act in the task pane.
 */
export interface RoleExplainerProps {
  readonly words: RoleExplainerWords;
  /** The card's reads: the rows wait for the owners read; a failed read is the error card. */
  readonly surface: RoleCardState;
  /**
   * `pending` — the company and who set the roles are still being read, with nothing from the join
   * to name them: the heading and the credit line wait undrawn and the rows wait as loading lines,
   * so no title is drawn that then changes. The frame and the act draw at once.
   */
  readonly names: 'ready' | 'pending';
  /** *Try again* on the error card. */
  readonly onRetry: () => void;
  /** The act: on to the home, and the card is not returned to. */
  readonly onAct: () => void;
}
