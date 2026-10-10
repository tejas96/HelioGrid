import type { ReactNode } from 'react';
import type { ExplainerProps } from '../Explainer/Explainer.types';
import type { TintedBlockProps } from '../TintedBlock/TintedBlock.types';

/** Every word the frame draws; `@heliogrid/i18n`'s `knownNumberWords` writes them. */
export interface SignupKnownNumberWords {
  title: string;
  /** The rule behind the finding — one number, one account — beside the title. */
  explainer: ExplainerProps;
  intro: string;
  finding: Pick<TintedBlockProps, 'title' | 'body'>;
  phoneLabel: string;
  enter: string;
  leave: string;
}

/**
 * A number that already has an account, answered after its code verified (`M01-08`; `SCR-M01-02`
 * `m-duplicate-phone`, `d-duplicate-phone`): the finding, the rule in a sentence, the number as a
 * fact and both roads full-size — a steer, not a block. Off the flow, so it carries no step header.
 */
export interface SignupKnownNumberProps {
  /** The door's language control, in the header row. */
  language: ReactNode;
  words: SignupKnownNumberWords;
  /** The number that has the account, in E.164. */
  phoneE164: string;
  /** Into the account the number has. */
  onEnter: () => void;
  /** Back to step 1, for another number. */
  onLeave: () => void;
}
